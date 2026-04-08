/**
 * @module ClientDocumentVersion
 * Immutable snapshot of a ClientDocument at a point in time.
 * Maps to the MongoDB `clientdocumentversions` collection.
 * Created on every update to a client document, preserving file attachments,
 * form data, and submission state for audit and rollback purposes.
 */
import mongoose, { Schema, Document } from 'mongoose';
import { IFileAttachment, ISubmissionData } from './ClientDocument';

/** Immutable version record capturing a client document's state at a revision point. */
export interface IClientDocumentVersion extends Document {
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  title: string;
  documentType:
    | 'emotional-survey'
    | 'health-assessment'
    | 'personal-assessment'
    | 'feeding-log'
    | 'sleep-log'
    | 'mood-check-in'
    | 'recovery-notes'
    | 'progress-photo'
    | 'other';
  files: IFileAttachment[];
  submissionStatus: 'draft' | 'submitted-to-provider' | 'reviewed-by-provider' | 'completed';
  submissionData?: ISubmissionData;
  formData?: Record<string, unknown>;
  changedBy: mongoose.Types.ObjectId; // User who made the change
  changeReason?: string; // Optional reason for the change (e.g., "Resubmitted after provider feedback")
  createdAt: Date;
}

// File attachment schema (reused from ClientDocument)
const fileAttachmentSchema = new Schema<IFileAttachment>(
  {
    cloudinaryUrl: { type: String, required: true }, // URL for access (GridFS or legacy)
    originalFileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    gridfsFileId: { type: String, required: false },
    supabasePath: String,
  },
  { _id: false }
);

const submissionDataSchema = new Schema<ISubmissionData>(
  {
    submittedDate: Date,
    reviewedDate: Date,
    providerNotes: String,
    providerFeedback: String,
  },
  { _id: false }
);

// Client Document Version Schema
const clientDocumentVersionSchema = new Schema<IClientDocumentVersion>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientDocument',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'emotional-survey',
        'health-assessment',
        'personal-assessment',
        'feeding-log',
        'sleep-log',
        'mood-check-in',
        'recovery-notes',
        'progress-photo',
        'other',
      ],
      required: true,
    },
    files: [fileAttachmentSchema],
    submissionStatus: {
      type: String,
      enum: ['draft', 'submitted-to-provider', 'reviewed-by-provider', 'completed'],
      default: 'draft',
    },
    submissionData: submissionDataSchema,
    formData: {
      type: Schema.Types.Mixed,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeReason: String,
  },
  {
    timestamps: true,
  }
);

/** @index documentId + versionNumber — fast look-up of a specific version. */
clientDocumentVersionSchema.index({ documentId: 1, versionNumber: -1 });
/** @index documentId + createdAt — chronological version history. */
clientDocumentVersionSchema.index({ documentId: 1, createdAt: -1 });

// Add virtual id property
clientDocumentVersionSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

const ClientDocumentVersion = mongoose.model<IClientDocumentVersion>(
  'ClientDocumentVersion',
  clientDocumentVersionSchema
);

export default ClientDocumentVersion;
