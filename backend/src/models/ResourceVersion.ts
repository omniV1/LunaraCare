/**
 * @module ResourceVersion
 * Immutable snapshot of a Resource at a point in time.
 * Maps to the MongoDB `resourceversions` collection.
 * Created on every resource update for full revision history,
 * including content, metadata, targeting weeks, and publication state.
 */
import mongoose, { Schema, Document } from 'mongoose';

/** Immutable version record capturing a resource's state at a revision point. */
export interface IResourceVersion extends Document {
  resourceId: mongoose.Types.ObjectId;
  versionNumber: number;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  targetWeeks: number[];
  targetPregnancyWeeks: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  changedBy: mongoose.Types.ObjectId; // User who made the change
  changeReason?: string; // Optional reason for the change
  createdAt: Date;
}

// Resource Version Schema
const resourceVersionSchema = new Schema<IResourceVersion>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    targetWeeks: [Number],
    targetPregnancyWeeks: [Number],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    fileUrl: String,
    thumbnailUrl: String,
    isPublished: {
      type: Boolean,
      default: false,
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

/** @index resourceId + versionNumber — fast look-up of a specific revision. */
resourceVersionSchema.index({ resourceId: 1, versionNumber: -1 });
/** @index resourceId + createdAt — chronological version history. */
resourceVersionSchema.index({ resourceId: 1, createdAt: -1 });

// Add virtual id property
resourceVersionSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

const ResourceVersion = mongoose.model<IResourceVersion>('ResourceVersion', resourceVersionSchema);

export default ResourceVersion;
