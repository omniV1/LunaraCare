/**
 * @module UserResourceInteraction
 * Tracks how users engage with educational resources (views, downloads, favourites, ratings).
 * Maps to the MongoDB `userresourceinteractions` collection.
 * Powers analytics dashboards and the resource recommendation engine.
 * Only `createdAt` is recorded — interactions are append-only.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** A single user interaction event with a resource. */
export interface IUserResourceInteraction extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  interactionType: 'view' | 'download' | 'favorite' | 'rating';
  rating?: number;
  createdAt: Date;
}

/** Model interface (no custom statics currently). */
export interface IUserResourceInteractionModel extends Model<IUserResourceInteraction> {}

/**
 * Swagger schema annotation
 * @swagger
 * components:
 *   schemas:
 *     UserResourceInteraction:
 *       type: object
 *       required:
 *         - user
 *         - resource
 *         - interactionType
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: string
 *           description: Reference to User
 *         resource:
 *           type: string
 *           description: Reference to Resource
 *         interactionType:
 *           type: string
 *           enum: [view, download, favorite, rating]
 *         rating:
 *           type: number
 *           description: Optional rating value
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Schema for user resource interaction
const userResourceInteractionSchema = new Schema<IUserResourceInteraction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    interactionType: {
      type: String,
      enum: ['view', 'download', 'favorite', 'rating'],
      required: true,
    },
    rating: {
      type: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/** @index user + resource + interactionType — efficient per-user interaction queries and dedup checks. */
userResourceInteractionSchema.index({ user: 1, resource: 1, interactionType: 1 });

const UserResourceInteraction = mongoose.model<
  IUserResourceInteraction,
  IUserResourceInteractionModel
>('UserResourceInteraction', userResourceInteractionSchema);

export default UserResourceInteraction;
