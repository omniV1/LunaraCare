/**
 * @module services/documentService
 * Client document lifecycle: upload, versioning, submission to provider,
 * provider review with feedback, and bulk assignment. Manages file
 * attachments through GridFS and sends real-time Socket.io + in-app
 * notifications on submit/review events.
 */

import mongoose from 'mongoose';
import type { Server } from 'socket.io';
import ClientDocument, { IClientDocument, IFileAttachment } from '../models/ClientDocument';
import ClientDocumentVersion from '../models/ClientDocumentVersion';
import Client from '../models/Client';
import Message from '../models/Message';
import User, { IUser } from '../models/User';
import gridfsService from './gridfsService';
import logger from '../utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

// ── Socket.io access ─────────────────────────────────────────────────────────

const getIO = () => (globalThis as unknown as { io?: Server }).io;

// ── Input / Result types ─────────────────────────────────────────────────────

/** Query parameters for filtering and paginating client documents. */
export interface DocumentListQuery {
  documentType?: string;
  submissionStatus?: string;
  provider?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: string | number;
  page?: string | number;
}

/** Paginated list of client documents with metadata. */
export interface DocumentListResult {
  documents: IClientDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Fields for creating a new client document. */
export interface CreateDocumentInput {
  title: string;
  documentType: string;
  files: unknown;
  assignedProvider?: string;
  formData?: Record<string, unknown>;
  privacyLevel?: string;
  dueDate?: string;
  notes?: string;
}

/** Mutable fields when updating a client document. */
export interface UpdateDocumentInput {
  title?: string;
  notes?: string;
  formData?: Record<string, unknown>;
  files?: unknown;
}

/** Fields a provider submits when reviewing a document. */
export interface ReviewDocumentInput {
  providerNotes?: string;
  providerFeedback?: string;
  status?: string;
}

/** Single item in a bulk document assignment request. */
export interface BulkDocumentItem {
  title: string;
  documentType: string;
  clientUserId: string;
  notes?: string;
}

// ── Normalized file types ────────────────────────────────────────────────────

type NormalizedFileAttachment = {
  cloudinaryUrl: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  gridfsFileId?: string;
  supabasePath?: string;
};

type IncomingFileAttachment = Partial<{
  cloudinaryUrl: string;
  url: string;
  originalFileName: string;
  filename: string;
  originalName: string;
  fileType: string;
  contentType: string;
  mimetype: string;
  fileSize: number;
  size: number;
  uploadDate: string | Date;
  gridfsFileId: string;
  fileId: string;
  supabasePath: string;
}>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize file attachment payloads from various frontend shapes into a
 * single canonical form.
 *
 * @throws BadRequestError -- invalid files payload
 */
export function normalizeFileAttachments(filesRaw: unknown): NormalizedFileAttachment[] {
  if (!Array.isArray(filesRaw)) {
    throw new BadRequestError('files must be an array');
  }

  return (filesRaw as IncomingFileAttachment[]).map((file, idx) => {
    const gridfsFileId = file.gridfsFileId ?? file.fileId;
    const url =
      file.cloudinaryUrl ??
      file.url ??
      (gridfsFileId ? gridfsService.getFileUrl(gridfsFileId) : undefined);

    const originalFileName = file.originalFileName ?? file.filename ?? file.originalName;
    const fileType = file.fileType ?? file.contentType ?? file.mimetype;
    const fileSize = file.fileSize ?? file.size;
    const uploadDate = file.uploadDate ? new Date(file.uploadDate) : new Date();

    if (!url) {
      throw new BadRequestError(`files[${idx}]: missing url (cloudinaryUrl/url) and fileId/gridfsFileId`);
    }
    if (!originalFileName) {
      throw new BadRequestError(`files[${idx}]: missing originalFileName/filename`);
    }
    if (!fileType) {
      throw new BadRequestError(`files[${idx}]: missing fileType/contentType`);
    }
    if (typeof fileSize !== 'number' || Number.isNaN(fileSize)) {
      throw new BadRequestError(`files[${idx}]: missing fileSize/size`);
    }

    return {
      cloudinaryUrl: url,
      originalFileName,
      fileType,
      fileSize,
      uploadDate,
      gridfsFileId,
      supabasePath: file.supabasePath,
    };
  });
}

/** Create a version snapshot of a client document. Non-critical. */
async function createClientDocumentVersion(
  document: IClientDocument,
  changedBy: IUser | undefined,
  changeReason?: string,
): Promise<void> {
  try {
    const latestVersion = await ClientDocumentVersion.findOne({ documentId: document._id })
      .sort({ versionNumber: -1 })
      .limit(1);

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = new ClientDocumentVersion({
      documentId: document._id,
      versionNumber: nextVersionNumber,
      title: document.title,
      documentType: document.documentType,
      files: document.files ?? [],
      submissionStatus: document.submissionStatus,
      submissionData: document.submissionData,
      formData: document.formData,
      changedBy: changedBy?._id ?? changedBy,
      changeReason,
    });

    await version.save();
    logger.info(`Created version ${nextVersionNumber} for client document ${document._id}`);
  } catch (error) {
    logger.error('Error creating client document version:', error);
  }
}

/** Log document file details. */
async function logDocumentFiles(document: IClientDocument): Promise<void> {
  logger.debug('Document deletion', {
    documentId: document._id,
    filesCount: document.files?.length ?? 0,
    fileDetails: document.files?.map((f, i) => ({
      index: i + 1,
      originalFileName: f.originalFileName,
      hasGridfsFileId: !!f.gridfsFileId,
      gridfsFileId: f.gridfsFileId ?? 'NOT SET',
    })),
  });
}

/** Delete stored files from GridFS. */
async function deleteStoredFiles(document: IClientDocument): Promise<void> {
  if (!document.files || document.files.length === 0) return;
  try {
    const { default: gridfsService } = await import('./gridfsService');
    logger.info(`Attempting to delete ${document.files.length} file(s) from GridFS`);
    for (const file of document.files) {
      const fileId = file.gridfsFileId ?? file.supabasePath;
      if (fileId && fileId.length === 24) {
        try {
          await gridfsService.deleteFile(fileId);
          logger.info(`Deleted from GridFS: ${fileId}`);
        } catch {
          logger.debug(`File not found in GridFS (may be legacy): ${fileId}`);
        }
      }
    }
  } catch (storageError: unknown) {
    logger.error('Error deleting files from storage:', storageError);
  }
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * List documents with role-based filtering, pagination, and search.
 *
 * @param query - Filters, search, and pagination parameters
 * @param user - Authenticated user (determines visibility scope)
 * @returns Paginated document list
 */
export async function listDocuments(
  query: DocumentListQuery,
  user: IUser,
): Promise<DocumentListResult> {
  const {
    documentType,
    submissionStatus,
    provider,
    search,
    startDate,
    endDate,
    limit: rawLimit = 50,
    page = 1,
  } = query;

  const limit = Math.min(Number(rawLimit) || 50, 100);
  const skip = (Number(page) - 1) * limit;

  const filters: Record<string, unknown> = {};

  if (user.role === 'provider') {
    const providerId = new mongoose.Types.ObjectId(String(user._id));
    const myClientUserIds = await Client.find({ assignedProvider: providerId })
      .distinct('userId')
      .then(ids => ids.map((id: mongoose.Types.ObjectId) => new mongoose.Types.ObjectId(id.toString())));
    filters.$or =
      myClientUserIds.length > 0
        ? [
            { assignedProvider: providerId },
            { uploadedBy: { $in: myClientUserIds } },
          ]
        : [{ assignedProvider: providerId }];
    filters.privacyLevel = { $ne: 'client-only' };
  } else if (user.role === 'client') {
    filters.uploadedBy = user._id;
  }

  if (documentType) filters.documentType = documentType;
  if (submissionStatus) filters.submissionStatus = submissionStatus;
  if (provider && user.role === 'client') filters.assignedProvider = provider;

  if (startDate || endDate) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filters.createdAt = dateFilter;
  }

  if (search) {
    const sanitized = String(search).replace(/["\\\-~]/g, ' ').trim();
    if (sanitized) filters.$text = { $search: sanitized };
  }

  let sort: Record<string, 1 | -1 | { $meta: string }> = { createdAt: -1 };
  if (search) {
    sort = { score: { $meta: 'textScore' }, createdAt: -1 };
  }

  const total = await ClientDocument.countDocuments(filters);

  if (user.role === 'provider') {
    logger.info(`Provider documents list: providerId=${user._id}, submissionStatus=${submissionStatus ?? 'any'}, total=${total}`);
  }

  let dbQuery = ClientDocument.find(filters)
    .sort(sort)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email')
    .skip(skip)
    .limit(limit);

  if (search) {
    dbQuery = dbQuery.select({ score: { $meta: 'textScore' } }) as typeof dbQuery;
  }

  const documents = await dbQuery;

  return {
    documents,
    pagination: {
      page: Number(page),
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a new client document.
 *
 * @param data - Document metadata and file attachments
 * @param user - Authenticated uploader
 * @returns The created document with populated references
 * @throws BadRequestError -- invalid files payload
 */
export async function createDocument(
  data: CreateDocumentInput,
  user: IUser,
): Promise<IClientDocument> {
  const { title, documentType, files, assignedProvider, formData, privacyLevel, dueDate, notes } = data;

  let providerId = assignedProvider;
  if (!providerId && user.role === 'client') {
    const clientProfile = await Client.findOne({ userId: user._id });
    providerId = clientProfile?.assignedProvider?.toString();
  }

  const normalizedFiles = normalizeFileAttachments(files);

  const document = new ClientDocument({
    title,
    documentType,
    uploadedBy: user._id,
    assignedProvider: providerId,
    files: normalizedFiles,
    formData,
    privacyLevel: privacyLevel ?? 'client-and-provider',
    dueDate,
    notes,
    submissionStatus: 'draft',
  });

  await document.save();

  await createClientDocumentVersion(document, user, 'Initial document creation');

  await document.populate('uploadedBy', 'firstName lastName email');
  if (providerId) {
    await document.populate('assignedProvider', 'firstName lastName email');
  }

  return document;
}

/**
 * Get a document by ID with permission check.
 *
 * @param id - Document ObjectId
 * @param user - Authenticated caller
 * @returns The document with populated references
 * @throws NotFoundError -- document not found
 * @throws ForbiddenError -- access denied
 */
export async function getDocumentById(
  id: string,
  user: IUser,
): Promise<IClientDocument> {
  const document = await ClientDocument.findById(id)
    .populate('uploadedBy', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email');

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (document.uploadedBy.toString() !== String(user._id)) {
    const isAdmin = user.role === 'admin';
    const isAssignedProvider = user.role === 'provider' && document.assignedProvider?.toString() === String(user._id);
    if (!isAdmin && !isAssignedProvider) {
      throw new ForbiddenError('Access denied');
    }
  }

  return document;
}

/**
 * Update a document.
 *
 * @param id - Document ObjectId
 * @param data - Fields to update
 * @param user - Authenticated caller (must be uploader)
 * @returns Updated document
 * @throws NotFoundError -- document not found
 * @throws ForbiddenError -- access denied
 * @throws BadRequestError -- invalid files payload
 */
export async function updateDocument(
  id: string,
  data: UpdateDocumentInput,
  user: IUser,
): Promise<IClientDocument> {
  const document = await ClientDocument.findById(id);
  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (document.uploadedBy.toString() !== String(user._id)) {
    throw new ForbiddenError('Access denied');
  }

  const { title, notes, formData, files } = data;
  if (title) document.title = title;
  if (notes !== undefined) document.notes = notes;
  if (formData) document.formData = formData;
  if (files) {
    document.files = normalizeFileAttachments(files) as IFileAttachment[];
  }

  await document.save();

  await document.populate('uploadedBy', 'firstName lastName email');
  if (document.assignedProvider) {
    await document.populate('assignedProvider', 'firstName lastName email');
  }

  return document;
}

/**
 * Delete a document and its stored files.
 *
 * @param id - Document ObjectId
 * @param user - Authenticated caller
 * @throws NotFoundError -- document not found
 * @throws ForbiddenError -- access denied
 */
export async function deleteDocument(
  id: string,
  user: IUser,
): Promise<void> {
  const document = await ClientDocument.findById(id);
  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const isOwner = document.uploadedBy.toString() === String(user._id);
  const isAssignedProvider = user.role === 'provider' && document.assignedProvider?.toString() === String(user._id);
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAssignedProvider && !isAdmin) {
    throw new ForbiddenError('Access denied');
  }

  await logDocumentFiles(document);
  await deleteStoredFiles(document);
  await document.deleteOne();
}

/**
 * Submit a document to the provider for review.
 *
 * @param id - Document ObjectId
 * @param user - Authenticated uploader
 * @returns Confirmation message and updated document
 * @throws NotFoundError -- document not found
 * @throws ForbiddenError -- only the uploader can submit
 */
export async function submitDocument(
  id: string,
  user: IUser,
): Promise<{ message: string; document: IClientDocument }> {
  const document = await ClientDocument.findById(id).populate(
    'assignedProvider',
    'firstName lastName email',
  );

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (document.uploadedBy.toString() !== String(user._id)) {
    throw new ForbiddenError('Access denied');
  }

  await createClientDocumentVersion(document, user, 'Document submitted to provider');

  // Assign provider from client profile if missing
  if (!document.assignedProvider || document.assignedProvider.toString() === '') {
    const uploaderId = document.uploadedBy?._id ?? document.uploadedBy;
    const clientProfile = await Client.findOne({
      userId: uploaderId ? new mongoose.Types.ObjectId(uploaderId.toString()) : undefined,
    });
    if (clientProfile?.assignedProvider) {
      const providerRef = clientProfile.assignedProvider as mongoose.Types.ObjectId;
      document.assignedProvider = new mongoose.Types.ObjectId(providerRef.toString());
      logger.info(`Set document ${document._id} assignedProvider from client profile: ${document.assignedProvider}`);
    }
  }

  document.submissionStatus = 'submitted-to-provider';
  document.submissionData = {
    submittedDate: new Date(),
  };
  await document.save();

  // Send notification message to the provider if assigned
  const providerId = document.assignedProvider?._id ?? document.assignedProvider;
  if (providerId) {
    try {
      const provider = document.assignedProvider as unknown as { _id?: mongoose.Types.ObjectId } | mongoose.Types.ObjectId | undefined;
      const providerUserId = (provider && '_id' in provider ? provider._id : provider) ?? providerId;
      const sender = await User.findById(user._id);

      if (sender) {
        const notificationMessage = new Message({
          conversationId: new mongoose.Types.ObjectId(),
          sender: user._id,
          receiver: providerUserId,
          content: `${sender.firstName} has submitted a document: "${document.title}". Please review when you have a moment.`,
          type: 'system',
          read: false,
        });

        await notificationMessage.save();
        logger.info(`Notification sent to provider ${providerUserId} for document ${document._id}`);

        const io = getIO();
        if (io) {
          io.to(providerUserId.toString()).emit('document_submitted', {
            documentId: document._id,
            documentTitle: document.title,
            sender: sender.firstName,
            message: notificationMessage.content,
          });
          logger.info(`Socket.io notification emitted to provider ${providerUserId}`);
        } else {
          logger.warn('Socket.io instance not available');
        }
      } else {
        logger.error('Sender user not found for notification');
      }
    } catch (notificationError) {
      logger.error('Error sending notification to provider:', notificationError);
    }
  } else {
    logger.warn(`Document ${document._id} has no assignedProvider, skipping notification`);
  }

  return { message: 'Document submitted successfully', document };
}

/**
 * Review a document (provider/admin).
 *
 * @param id - Document ObjectId
 * @param data - Review notes, feedback, and new status
 * @param user - Authenticated reviewer
 * @returns Confirmation message and updated document
 * @throws NotFoundError -- document not found
 * @throws ForbiddenError -- not authorized to review
 */
export async function reviewDocument(
  id: string,
  data: ReviewDocumentInput,
  user: IUser,
): Promise<{ message: string; document: IClientDocument }> {
  const { providerNotes, providerFeedback, status } = data;

  const document = await ClientDocument.findById(id).populate(
    'uploadedBy',
    'firstName lastName email',
  );

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (
    user.role !== 'admin' &&
    document.assignedProvider &&
    document.assignedProvider.toString() !== String(user._id)
  ) {
    throw new ForbiddenError('You are not authorized to review this document');
  }

  await createClientDocumentVersion(
    document,
    user,
    `Document reviewed - ${status ?? 'reviewed-by-provider'}`,
  );

  document.submissionStatus = (status as IClientDocument['submissionStatus']) ?? 'reviewed-by-provider';
  document.submissionData = {
    ...document.submissionData,
    reviewedDate: new Date(),
    providerNotes,
    providerFeedback,
  };
  await document.save();

  // Send notification message to the client
  const clientId = document.uploadedBy?._id ?? document.uploadedBy;
  if (clientId) {
    try {
      const client = document.uploadedBy as unknown as { _id?: mongoose.Types.ObjectId } | mongoose.Types.ObjectId | undefined;
      const clientUserId = (client && '_id' in client ? client._id : client) ?? clientId;
      const sender = await User.findById(user._id);

      if (sender) {
        const feedbackMessage = new Message({
          conversationId: new mongoose.Types.ObjectId(),
          sender: user._id,
          receiver: clientUserId,
          content: `${sender.firstName} has reviewed your document: "${document.title}". ${providerFeedback ?? 'Please check the feedback section for details.'}`,
          type: 'system',
          read: false,
        });

        await feedbackMessage.save();
        logger.info(
          `Notification sent to client ${clientUserId} for document review ${document._id}`,
        );

        const io = getIO();
        if (io) {
          io.to(clientUserId.toString()).emit('document_reviewed', {
            documentId: document._id,
            documentTitle: document.title,
            reviewer: sender.firstName,
            feedback: providerFeedback,
            status,
            message: feedbackMessage.content,
          });
          logger.info(`Socket.io notification emitted to client ${clientUserId}`);
        } else {
          logger.warn('Socket.io instance not available');
        }
      } else {
        logger.error('Sender user not found for notification');
      }
    } catch (notificationError) {
      logger.error('Error sending notification to client:', notificationError);
    }
  } else {
    logger.warn(`Document ${document._id} has no uploadedBy, skipping notification`);
  }

  return { message: 'Document reviewed successfully', document };
}

/**
 * Bulk create document assignments (provider only).
 *
 * @param documents - Array of document items to create
 * @param providerId - Provider's ObjectId (fallback for assignedProvider)
 * @returns Array of created document records
 */
export async function bulkCreateDocuments(
  documents: BulkDocumentItem[],
  providerId: mongoose.Types.ObjectId,
): Promise<IClientDocument[]> {
  const created = await Promise.all(
    documents.map(async (doc) => {
      const client = await Client.findOne({ userId: doc.clientUserId });
      return ClientDocument.create({
        title: doc.title,
        documentType: doc.documentType,
        uploadedBy: new mongoose.Types.ObjectId(doc.clientUserId),
        assignedProvider: client?.assignedProvider ?? providerId,
        notes: doc.notes ?? '',
        submissionStatus: 'draft',
      });
    }),
  );

  return created;
}
