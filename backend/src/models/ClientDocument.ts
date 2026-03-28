import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFileAttachment {
  cloudinaryUrl: string; // URL to access the file (GridFS or legacy)
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  gridfsFileId?: string; // GridFS file ID for storage/deletion
  supabasePath?: string; // Legacy field for backwards compatibility
}

export interface ISubmissionData {
  submittedDate?: Date;
  reviewedDate?: Date;
  providerNotes?: string;
  providerFeedback?: string;
}

export interface IClientDocument extends Document {
  title: string;
  documentType:
    | 'emotional-survey'
    | 'health-assessment'
    | 'personal-assessment'
    | 'feeding-log'
    | 'sleep-log'
    | 'mood-check-in'
    | 'recovery-notes'
    | 'progress-photo' // legacy only; not suggested for new documents
    | 'other';
  uploadedBy: mongoose.Types.ObjectId;
  assignedProvider?: mongoose.Types.ObjectId;
  files: IFileAttachment[];
  submissionStatus: 'draft' | 'submitted-to-provider' | 'reviewed-by-provider' | 'completed';
  submissionData?: ISubmissionData;
  formData?: Record<string, unknown>; // Store survey responses, assessment scores, etc.
  privacyLevel: 'client-only' | 'client-and-provider' | 'care-team';
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClientDocumentModel extends Model<IClientDocument> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<IClientDocument[]>;
  findByProvider(providerId: mongoose.Types.ObjectId): Promise<IClientDocument[]>;
  findByStatus(status: string): Promise<IClientDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ClientDocument:
 *       type: object
 *       required:
 *         - title
 *         - documentType
 *         - uploadedBy
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated document ID
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Document title
 *         documentType:
 *           type: string
 *           enum: [emotional-survey, health-assessment, personal-assessment, feeding-log, sleep-log, mood-check-in, recovery-notes, other]
 *           description: Type of document
 *         uploadedBy:
 *           type: string
 *           description: Client who uploaded the document
 *         assignedProvider:
 *           type: string
 *           description: Provider who can access this document
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               cloudinaryUrl:
 *                 type: string
 *                 description: URL to access the file (GridFS `/api/files/{fileId}` or legacy)
 *               gridfsFileId:
 *                 type: string
 *                 description: GridFS file id (recommended for Mongo storage)
 *               originalFileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               uploadDate:
 *                 type: string
 *                 format: date-time
 *           description: Array of uploaded files
 *         submissionStatus:
 *           type: string
 *           enum: [draft, submitted-to-provider, reviewed-by-provider, completed]
 *           default: draft
 *         submissionData:
 *           type: object
 *           description: Tracking data for submission and review
 *         formData:
 *           type: object
 *           description: Additional form data or survey responses
 *         privacyLevel:
 *           type: string
 *           enum: [client-only, client-and-provider, care-team]
 *           default: client-and-provider
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Optional due date for submission
 */

const fileAttachmentSchema = new Schema<IFileAttachment>(
  {
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    gridfsFileId: {
      type: String,
      required: false,
    },
    supabasePath: {
      type: String,
      required: false, // Legacy field for backwards compatibility
    },
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

const clientDocumentSchema = new Schema<IClientDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    documentType: {
      type: String,
      enum: {
        values: [
          'emotional-survey',
          'health-assessment',
          'personal-assessment',
          'feeding-log',
          'sleep-log',
          'mood-check-in',
          'recovery-notes',
          'progress-photo', // legacy
          'other',
        ],
        message: 'Invalid document type',
      },
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    files: [fileAttachmentSchema],
    submissionStatus: {
      type: String,
      enum: {
        values: ['draft', 'submitted-to-provider', 'reviewed-by-provider', 'completed'],
        message: 'Invalid submission status',
      },
      default: 'draft',
    },
    submissionData: submissionDataSchema,
    formData: {
      type: Schema.Types.Mixed,
    },
    privacyLevel: {
      type: String,
      enum: {
        values: ['client-only', 'client-and-provider', 'care-team'],
        message: 'Invalid privacy level',
      },
      default: 'client-and-provider',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual id property
clientDocumentSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

// Indexes
clientDocumentSchema.index({ uploadedBy: 1, documentType: 1 });
clientDocumentSchema.index({ assignedProvider: 1, submissionStatus: 1 });
clientDocumentSchema.index({ submissionStatus: 1 });
clientDocumentSchema.index({ dueDate: 1 });
clientDocumentSchema.index({ createdAt: -1 });
// Text index for search across title and notes
clientDocumentSchema.index({ title: 'text', notes: 'text' });

// Static: find documents by user
clientDocumentSchema.static('findByUser', function (userId: mongoose.Types.ObjectId) {
  return this.find({ uploadedBy: userId })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email');
});

// Static: find documents by provider
clientDocumentSchema.static('findByProvider', function (providerId: mongoose.Types.ObjectId) {
  return this.find({
    assignedProvider: providerId,
    privacyLevel: { $ne: 'client-only' },
  })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName email');
});

// Static: find documents by status
clientDocumentSchema.static('findByStatus', function (status: string) {
  return this.find({ submissionStatus: status })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email');
});

const ClientDocument = mongoose.model<IClientDocument, IClientDocumentModel>(
  'ClientDocument',
  clientDocumentSchema
);

export default ClientDocument;
