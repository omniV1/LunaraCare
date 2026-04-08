/**
 * @module services/gridfsService
 * Low-level MongoDB GridFS wrapper for binary file storage. Provides
 * upload, download, metadata lookup, existence checks, and deletion
 * using the "uploads" bucket. Used by fileService and documentService.
 */

import mongoose from 'mongoose';
import { Readable } from 'stream';
import logger from '../utils/logger';

// Use mongoose's bundled mongodb types for compatibility
const { GridFSBucket, ObjectId } = mongoose.mongo;
type GridFSBucketType = InstanceType<typeof GridFSBucket>;

let bucket: GridFSBucketType | null = null;

/**
 * Initialize GridFS bucket after MongoDB connection is established
 */
export const initGridFS = (): GridFSBucketType => {
  if (bucket) return bucket;

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection not established');
  }

  bucket = new GridFSBucket(db, {
    bucketName: 'uploads'
  });

  logger.info('GridFS bucket initialized');
  return bucket;
};

/**
 * Get the GridFS bucket (initializes if needed)
 */
export const getBucket = (): GridFSBucketType => {
  if (!bucket) {
    return initGridFS();
  }
  return bucket;
};

/** Result returned after a successful GridFS upload. */
export interface UploadResult {
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
}

/**
 * Upload a file to GridFS.
 *
 * @param buffer - File contents as a Buffer
 * @param filename - Name to store the file under
 * @param contentType - MIME type
 * @param metadata - Optional metadata to attach to the file
 * @returns Upload result with generated fileId
 */
export const uploadFile = async (
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, any>
): Promise<UploadResult> => {
  const gridBucket = getBucket();

  const uploadStream = gridBucket.openUploadStream(filename, {
    metadata: {
      contentType,
      ...metadata,
      uploadedAt: new Date(),
    },
  });

  return new Promise((resolve, reject) => {
    const readableStream = Readable.from(buffer);

    readableStream
      .pipe(uploadStream)
      .on('error', (error: Error) => {
        logger.error('GridFS upload error:', error);
        reject(error);
      })
      .on('finish', () => {
        logger.info(`File uploaded to GridFS: ${filename} (${uploadStream.id})`);
        resolve({
          fileId: uploadStream.id.toString(),
          filename,
          contentType,
          size: buffer.length,
          uploadDate: new Date(),
        });
      });
  });
};

/**
 * Download a file from GridFS by ID.
 *
 * @param fileId - GridFS ObjectId string
 * @returns Readable stream with file metadata
 * @throws Error if fileId is invalid or file not found
 */
export const downloadFile = async (fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  filename: string;
  contentType: string;
  size: number;
}> => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID');
  }
  const gridBucket = getBucket();
  const objectId = new ObjectId(fileId);

  // Get file metadata first
  const files = await gridBucket.find({ _id: objectId }).toArray();

  if (files.length === 0) {
    throw new Error('File not found');
  }

  const file = files[0];
  const downloadStream = gridBucket.openDownloadStream(objectId);

  return {
    stream: downloadStream,
    filename: file.filename,
    // Prefer metadata.contentType; fallback for legacy files (contentType at top level is deprecated in GridFS)
    contentType: file.metadata?.contentType ?? 'application/octet-stream',
    size: file.length,
  };
};

/**
 * Delete a file from GridFS by ID.
 *
 * @param fileId - GridFS ObjectId string
 * @throws Error if fileId is invalid
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new Error('Invalid file ID');
  }
  const gridBucket = getBucket();
  const objectId = new ObjectId(fileId);

  await gridBucket.delete(objectId);
  logger.info(`File deleted from GridFS: ${fileId}`);
};

/**
 * Check if a file exists in GridFS.
 *
 * @param fileId - GridFS ObjectId string
 * @returns true if the file exists, false otherwise
 */
export const fileExists = async (fileId: string): Promise<boolean> => {
  try {
    const gridBucket = getBucket();
    const objectId = new ObjectId(fileId);
    const files = await gridBucket.find({ _id: objectId }).toArray();
    return files.length > 0;
  } catch {
    return false;
  }
};

/**
 * Get file metadata without downloading.
 *
 * @param fileId - GridFS ObjectId string
 * @returns File metadata or null if not found
 */
export const getFileInfo = async (fileId: string): Promise<{
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
  metadata?: Record<string, any>;
} | null> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) return null;
    const gridBucket = getBucket();
    const objectId = new ObjectId(fileId);
    const files = await gridBucket.find({ _id: objectId }).toArray();

    if (files.length === 0) {
      return null;
    }

    const file = files[0];
    return {
      fileId: file._id.toString(),
      filename: file.filename,
      // Prefer metadata.contentType; legacy top-level contentType is deprecated in GridFS
      contentType: file.metadata?.contentType ?? 'application/octet-stream',
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
    };
  } catch {
    return null;
  }
};

/**
 * Generate a URL path for accessing a file via the API.
 *
 * @param fileId - GridFS ObjectId string
 * @returns Fully qualified URL to the file download endpoint
 */
export const getFileUrl = (fileId: string): string => {
  const baseUrl = process.env.API_URL ?? 'http://localhost:5000/api';
  return `${baseUrl}/files/${fileId}`;
};

export default {
  initGridFS,
  getBucket,
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  getFileInfo,
  getFileUrl,
};
