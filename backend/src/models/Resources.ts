/**
 * @module Resource
 * Educational resources (articles, guides, media) for postpartum care.
 * Maps to the MongoDB `resources` collection.
 * Resources are targeted by postpartum week and pregnancy week for the
 * recommendation engine, support difficulty levels, full-text search,
 * and a draft/publish workflow.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** Resource document with content, targeting metadata, and publication state. */
export interface IResource extends Document {
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  targetWeeks: number[];
  targetPregnancyWeeks: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Static query helpers on the Resource model. */
export interface IResourceModel extends Model<IResource> {
  /** Return published resources with optional extra filters, sorted newest first. */
  findPublished(filters?: Partial<Record<string, unknown>>): Promise<IResource[]>;
}

/**
 * Swagger documentation for the Resource Model
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - content
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated resource ID
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Resource title
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Short summary of the resource
 *         content:
 *           type: string
 *           description: Full content of the resource
 *         category:
 *           type: string
 *           description: Resource category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Searchable tags for the resource
 *         targetWeeks:
 *           type: array
 *           items:
 *             type: number
 *           description: Recommended postpartum weeks this resource targets
 *         targetPregnancyWeeks:
 *           type: array
 *           items:
 *             type: number
 *           description: Recommended pregnancy weeks this resource targets
 *         difficulty:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: Suggested difficulty level
 *         isPublished:
 *           type: boolean
 *           description: Whether the resource is visible to end users
 *         fileUrl:
 *           type: string
 *           description: Optional URL to a downloadable file
 *         thumbnailUrl:
 *           type: string
 *           description: Public URL of the resource thumbnail image
 *         author:
 *           type: string
 *           description: Mongo ObjectId of the author (User) - automatically set from authenticated user, do not include in request body
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: When the resource was published
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

// Resource Schema
const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [500000, 'Content cannot exceed 500KB'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    tags: { type: [{ type: String, index: true }], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 tags allowed'] },
    targetWeeks: [{ type: Number, min: 1, max: 52, index: true }],
    targetPregnancyWeeks: [{ type: Number, min: 1, max: 42, index: true }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    fileUrl: { type: String },
    thumbnailUrl: { type: String },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: { type: Boolean, default: false, index: true },
    publishDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add a virtual id property to match appointments and expose id (not _id)
resourceSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

/** @index Full-text search across title, description, content, and tags. */
resourceSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });
resourceSchema.index({ category: 1, isPublished: 1 });
resourceSchema.index({ targetWeeks: 1, difficulty: 1 });
resourceSchema.index({ targetPregnancyWeeks: 1, difficulty: 1 });
resourceSchema.index({ createdAt: -1 });

// Static: find published resources with optional filters
resourceSchema.static('findPublished', function (filters: Partial<Record<string, unknown>> = {}) {
  return this.find({ isPublished: true, ...filters })
    .sort({ createdAt: -1 })
    .populate('author', 'firstName lastName');
});

// Resource model
const Resource = mongoose.model<IResource, IResourceModel>('Resource', resourceSchema);

export default Resource;
