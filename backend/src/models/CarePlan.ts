/**
 * @module CarePlan
 * Mongoose model for personalised postpartum care plans.
 * Maps to the MongoDB `careplans` collection.
 * A care plan is built from sections containing milestones; progress (0-100)
 * is auto-calculated on save. Optionally seeded from a {@link CarePlanTemplate}.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** A single trackable goal within a care-plan section. */
export interface IMilestone {
  title: string;
  description?: string;
  weekOffset: number;
  category: 'physical' | 'emotional' | 'feeding' | 'self_care' | 'general';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  notes?: string;
}

/** Logical grouping of milestones (e.g. "Physical Recovery", "Emotional Wellness"). */
export interface ISection {
  title: string;
  description?: string;
  milestones: IMilestone[];
}

/** Care plan document linking a client to a provider with progress tracking. */
export interface ICarePlanDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  sections: ISection[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  startDate: Date;
  endDate?: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Static helpers on the CarePlan model. */
export interface ICarePlanModel extends Model<ICarePlanDocument> {
  /** Return all care plans for a client, newest first. */
  findByClient(clientId: mongoose.Types.ObjectId): Promise<ICarePlanDocument[]>;
  /** Return all care plans managed by a provider, newest first. */
  findByProvider(providerId: mongoose.Types.ObjectId): Promise<ICarePlanDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CarePlan:
 *       type: object
 *       required:
 *         - clientId
 *         - providerId
 *         - title
 *         - sections
 *       properties:
 *         id:
 *           type: string
 *         clientId:
 *           type: string
 *         providerId:
 *           type: string
 *         templateId:
 *           type: string
 *         title:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, completed, paused, archived]
 *         progress:
 *           type: number
 *           description: Completion percentage (0-100)
 *         sections:
 *           type: array
 *           items:
 *             type: object
 */

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    weekOffset: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['physical', 'emotional', 'feeding', 'self_care', 'general'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    completedAt: { type: Date },
    notes: { type: String, maxlength: 1000 },
  },
  { _id: true }
);

const sectionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    milestones: [milestoneSchema],
  },
  { _id: true }
);

const carePlanSchema = new Schema<ICarePlanDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider ID is required'],
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'CarePlanTemplate',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    sections: [sectionSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'archived'],
      default: 'active',
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

/**
 * Pre-save hook: recalculates `progress` as the percentage of milestones
 * that are completed or skipped across all sections.
 */
carePlanSchema.pre<ICarePlanDocument>('save', function (next) {
  const allMilestones = this.sections.flatMap(s => s.milestones);
  if (allMilestones.length === 0) {
    this.progress = 0;
  } else {
    const done = allMilestones.filter(
      m => m.status === 'completed' || m.status === 'skipped'
    ).length;
    this.progress = Math.round((done / allMilestones.length) * 100);
  }
  next();
});

carePlanSchema.statics.findByClient = function (clientId: mongoose.Types.ObjectId) {
  return this.find({ clientId }).sort({ createdAt: -1 });
};

carePlanSchema.statics.findByProvider = function (providerId: mongoose.Types.ObjectId) {
  return this.find({ providerId }).sort({ createdAt: -1 });
};

carePlanSchema.index({ clientId: 1 });
carePlanSchema.index({ providerId: 1 });
carePlanSchema.index({ status: 1 });

const CarePlan = mongoose.model<ICarePlanDocument, ICarePlanModel>(
  'CarePlan',
  carePlanSchema
);

export default CarePlan;
