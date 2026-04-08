/**
 * @module services/fileService
 * High-level file operations (upload, download, info, delete) backed by
 * GridFS. Adds filename sanitisation and role-based access control on
 * top of the low-level gridfsService.
 */

import path from 'node:path';
import gridfsService from './gridfsService';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip unsafe characters from a filename for safe storage and download headers.
 *
 * @param raw - Original user-supplied filename
 * @returns Sanitised filename (max 255 chars)
 */
export function sanitizeFilename(raw: string): string {
  const basename = path.basename(raw);
  const safe = basename
    .replace(/[^\w.\-() ]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
  return safe || 'file';
}

// ── Result types ─────────────────────────────────────────────────────────────

/** Result returned after a successful file upload. */
export interface UploadResult {
  fileId: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
}

/** Streamable file payload with metadata for download responses. */
export interface FileDownloadResult {
  stream: NodeJS.ReadableStream;
  contentType: string;
  size: number;
  filename: string;
}

/** File metadata with a computed download URL. */
export interface FileInfoResult {
  url: string;
  [key: string]: unknown;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Upload a file to GridFS storage.
 *
 * @param buffer - File contents
 * @param originalName - User-supplied filename (will be sanitised)
 * @param mimetype - MIME type of the file
 * @param userId - Uploader's user ID (stored as metadata)
 * @param folder - Logical folder label (default "documents")
 * @returns Upload result with fileId and URL
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string,
  userId: string | undefined,
  folder?: string
): Promise<UploadResult> {
  const safeName = sanitizeFilename(originalName);

  const result = await gridfsService.uploadFile(
    buffer,
    safeName,
    mimetype,
    {
      uploadedBy: userId,
      folder: typeof folder === 'string' ? folder.replace(/[^\w\-]/g, '_').slice(0, 50) : 'documents',
      originalName: safeName,
    }
  );

  const fileUrl = gridfsService.getFileUrl(result.fileId);

  return {
    fileId: result.fileId,
    url: fileUrl,
    filename: result.filename,
    contentType: result.contentType,
    size: result.size,
    uploadDate: result.uploadDate,
  };
}

/**
 * Download a file from GridFS, with access control.
 *
 * @throws NotFoundError  — file not found
 * @throws ForbiddenError — caller does not own the file and is not provider/admin
 */
export async function downloadFile(
  fileId: string,
  userId: string | undefined,
  userRole: string | undefined
): Promise<FileDownloadResult> {
  const fileInfo = await gridfsService.getFileInfo(fileId);
  if (!fileInfo) {
    throw new NotFoundError('File not found');
  }

  const uploadedBy = fileInfo.metadata?.uploadedBy;
  if (uploadedBy && userId && uploadedBy !== userId && userRole !== 'provider' && userRole !== 'admin') {
    throw new ForbiddenError('Access denied');
  }

  const fileData = await gridfsService.downloadFile(fileId);
  const safeDownloadName = sanitizeFilename(fileData.filename);

  return {
    stream: fileData.stream,
    contentType: fileData.contentType,
    size: fileData.size,
    filename: safeDownloadName,
  };
}

/**
 * Get file metadata without downloading.
 *
 * @throws NotFoundError  — file not found
 * @throws ForbiddenError — caller does not own the file and is not provider/admin
 */
export async function getFileInfo(
  fileId: string,
  userId: string | undefined,
  userRole: string | undefined
): Promise<FileInfoResult> {
  const fileInfo = await gridfsService.getFileInfo(fileId);
  if (!fileInfo) {
    throw new NotFoundError('File not found');
  }

  const uploadedBy = fileInfo.metadata?.uploadedBy;
  if (uploadedBy && userId && uploadedBy !== userId && userRole !== 'provider' && userRole !== 'admin') {
    throw new ForbiddenError('Access denied');
  }

  return {
    ...fileInfo,
    url: gridfsService.getFileUrl(fileId),
  };
}

/**
 * Delete a file from GridFS.
 *
 * @throws NotFoundError  — file not found
 * @throws ForbiddenError — caller does not own the file and is not admin
 */
export async function deleteFile(
  fileId: string,
  userId: string | undefined,
  userRole: string | undefined
): Promise<void> {
  const fileInfo = await gridfsService.getFileInfo(fileId);
  if (!fileInfo) {
    throw new NotFoundError('File not found');
  }

  const uploadedBy = fileInfo.metadata?.uploadedBy;
  if (uploadedBy && userId && uploadedBy !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Access denied');
  }

  await gridfsService.deleteFile(fileId);
}
