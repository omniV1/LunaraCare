import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/ClientDocument', () => {
  const MockCD = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  }));
  (MockCD as unknown as Record<string, unknown>).find = jest.fn();
  (MockCD as unknown as Record<string, unknown>).findById = jest.fn();
  (MockCD as unknown as Record<string, unknown>).countDocuments = jest.fn();
  (MockCD as unknown as Record<string, unknown>).create = jest.fn();
  return { __esModule: true, default: MockCD };
});

jest.mock('../../src/models/ClientDocumentVersion', () => {
  const MockCDV = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  }));
  (MockCDV as unknown as Record<string, unknown>).findOne = jest.fn();
  return { __esModule: true, default: MockCDV };
});

jest.mock('../../src/models/Client', () => ({
  __esModule: true,
  default: { find: jest.fn(), findOne: jest.fn() },
}));

jest.mock('../../src/models/Message', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  })),
}));

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../../src/services/gridfsService', () => ({
  __esModule: true,
  default: {
    deleteFile: jest.fn(),
    getFileUrl: jest.fn().mockReturnValue('/api/files/abc123'),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import ClientDocument from '../../src/models/ClientDocument';
import ClientDocumentVersion from '../../src/models/ClientDocumentVersion';
import type { IUser } from '../../src/models/User';
import {
  normalizeFileAttachments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  submitDocument,
  reviewDocument,
} from '../../src/services/documentService';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

/** Creates a mock query chain: .populate().populate() → resolves to value */
function mockPopulateChain(value: unknown) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockImplementation(() => Promise.resolve(value)),
    }),
  };
}

/** Creates a mock single-populate chain: .populate() → resolves to value */
function mockSinglePopulate(value: unknown) {
  return {
    populate: jest.fn().mockImplementation(() => Promise.resolve(value)),
  };
}

function fakeUser(overrides: Partial<Pick<IUser, '_id' | 'role' | 'firstName' | 'lastName'>> = {}): IUser {
  return {
    _id: oid(),
    role: 'client',
    firstName: 'Jane',
    lastName: 'Doe',
    ...overrides,
  } as unknown as IUser;
}

interface FakeDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  documentType: string;
  uploadedBy: mongoose.Types.ObjectId;
  assignedProvider: mongoose.Types.ObjectId | null;
  files: unknown[];
  submissionStatus: string;
  notes: string;
  formData: Record<string, unknown>;
  save: jest.Mock;
  populate: jest.Mock;
  deleteOne: jest.Mock;
  [key: string]: unknown;
}

function fakeDocument(overrides: Partial<FakeDocument> = {}): FakeDocument {
  return {
    _id: oid(),
    title: 'Test Doc',
    documentType: 'intake',
    uploadedBy: oid(),
    assignedProvider: oid(),
    files: [],
    submissionStatus: 'draft',
    notes: '',
    formData: {},
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis() as jest.Mock,
    deleteOne: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('documentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── normalizeFileAttachments ────────────────────────────────────────────

  describe('normalizeFileAttachments', () => {
    it('throws BadRequestError when input is not an array', () => {
      expect(() => normalizeFileAttachments('not-array')).toThrow(BadRequestError);
      expect(() => normalizeFileAttachments(null)).toThrow(BadRequestError);
    });

    it('throws BadRequestError when file is missing url', () => {
      expect(() =>
        normalizeFileAttachments([{ originalFileName: 'test.pdf', fileType: 'application/pdf', fileSize: 1024 }]),
      ).toThrow(BadRequestError);
    });

    it('returns normalized file objects from objects with url field', () => {
      const result = normalizeFileAttachments([
        { url: 'https://example.com/file.pdf', originalFileName: 'file.pdf', fileType: 'application/pdf', fileSize: 100 },
        { url: 'https://example.com/image.png', originalFileName: 'image.png', fileType: 'image/png', fileSize: 200 },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].cloudinaryUrl).toBe('https://example.com/file.pdf');
    });

    it('returns normalized file objects from object entries', () => {
      const result = normalizeFileAttachments([
        {
          url: 'https://example.com/file.pdf',
          originalFileName: 'doc.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].originalFileName).toBe('doc.pdf');
      expect(result[0].fileType).toBe('application/pdf');
      expect(result[0].fileSize).toBe(2048);
    });
  });

  // ── getDocumentById ─────────────────────────────────────────────────────

  describe('getDocumentById', () => {
    it('throws NotFoundError when document not found', async () => {
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockPopulateChain(null));

      await expect(getDocumentById('badId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user is not uploader and not admin/provider', async () => {
      const otherUserId = oid();
      const doc = fakeDocument({ uploadedBy: otherUserId });
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockPopulateChain(doc));

      const user = fakeUser({ role: 'client' }); // different _id than uploadedBy
      await expect(getDocumentById('id', user)).rejects.toThrow(ForbiddenError);
    });

    it('allows access to own documents', async () => {
      const userId = oid();
      const doc = fakeDocument({ uploadedBy: userId });
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockPopulateChain(doc));

      const user = fakeUser({ _id: userId });
      const result = await getDocumentById('id', user);
      expect(result).toBe(doc);
    });

    it('allows admin access to any document', async () => {
      const doc = fakeDocument();
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockPopulateChain(doc));

      const admin = fakeUser({ role: 'admin' });
      const result = await getDocumentById('id', admin);
      expect(result).toBe(doc);
    });
  });

  // ── updateDocument ──────────────────────────────────────────────────────

  describe('updateDocument', () => {
    it('throws NotFoundError when document not found', async () => {
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(updateDocument('badId', { title: 'New' }, fakeUser())).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ForbiddenError when user did not upload the document', async () => {
      const doc = fakeDocument();
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

      // user._id won't match doc.uploadedBy
      await expect(updateDocument('id', { title: 'New' }, fakeUser())).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('updates title and notes when authorized', async () => {
      const userId = oid();
      const doc = fakeDocument({ uploadedBy: userId, assignedProvider: null });
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

      const user = fakeUser({ _id: userId });
      await updateDocument('id', { title: 'Updated', notes: 'new notes' }, user);
      expect(doc.title).toBe('Updated');
      expect(doc.notes).toBe('new notes');
      expect(doc.save).toHaveBeenCalled();
    });
  });

  // ── deleteDocument ──────────────────────────────────────────────────────

  describe('deleteDocument', () => {
    it('throws NotFoundError when document not found', async () => {
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(deleteDocument('badId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError for non-owner, non-admin, non-assigned-provider', async () => {
      const doc = fakeDocument();
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

      const user = fakeUser({ role: 'client' }); // different _id
      await expect(deleteDocument('id', user)).rejects.toThrow(ForbiddenError);
    });

    it('allows owner to delete', async () => {
      const userId = oid();
      const doc = fakeDocument({ uploadedBy: userId, files: [] });
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

      const user = fakeUser({ _id: userId });
      await deleteDocument('id', user);
      expect(doc.deleteOne).toHaveBeenCalled();
    });

    it('allows admin to delete any document', async () => {
      const doc = fakeDocument({ files: [] });
      (ClientDocument.findById as jest.Mock).mockImplementation(() => Promise.resolve(doc));

      const admin = fakeUser({ role: 'admin' });
      await deleteDocument('id', admin);
      expect(doc.deleteOne).toHaveBeenCalled();
    });
  });

  // ── submitDocument ──────────────────────────────────────────────────────

  describe('submitDocument', () => {
    it('throws NotFoundError when document not found', async () => {
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockSinglePopulate(null));

      await expect(submitDocument('badId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user did not upload the document', async () => {
      const doc = fakeDocument();
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockSinglePopulate(doc));

      await expect(submitDocument('id', fakeUser())).rejects.toThrow(ForbiddenError);
    });
  });

  // ── reviewDocument ──────────────────────────────────────────────────────

  describe('reviewDocument', () => {
    it('throws NotFoundError when document not found', async () => {
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockSinglePopulate(null));

      await expect(
        reviewDocument('badId', { status: 'reviewed-by-provider' }, fakeUser({ role: 'provider' })),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when provider is not the assigned provider', async () => {
      const doc = fakeDocument();
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockSinglePopulate(doc));

      const provider = fakeUser({ role: 'provider' }); // _id won't match assignedProvider
      await expect(
        reviewDocument('id', { status: 'reviewed-by-provider' }, provider),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows admin to review any document', async () => {
      const reviewerId = oid();
      const doc = fakeDocument({ submissionStatus: 'submitted' });
      (ClientDocument.findById as jest.Mock).mockReturnValue(mockSinglePopulate(doc));
      (ClientDocumentVersion as unknown as Record<string, jest.Mock>).findOne = jest
        .fn()
        .mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => Promise.resolve(null)),
          }),
        });
      const { default: User } = require('../../src/models/User');
      (User.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({ _id: reviewerId, firstName: 'Admin' }),
      );

      const admin = fakeUser({ _id: reviewerId, role: 'admin' });
      const result = await reviewDocument(
        'id',
        { status: 'reviewed-by-provider', providerFeedback: 'LGTM' },
        admin,
      );
      expect(result.message).toBe('Document reviewed successfully');
    });
  });
});
