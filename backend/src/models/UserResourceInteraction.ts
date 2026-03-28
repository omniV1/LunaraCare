import mongoose, { Schema, Document, Model } from 'mongoose';

// User Resource Interaction interface
export interface IUserResourceInteraction extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  interactionType: 'view' | 'download' | 'favorite' | 'rating';
  rating?: number;
  createdAt: Date;
}

// User Interaction Model interface
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

userResourceInteractionSchema.index({ user: 1, resource: 1, interactionType: 1 });

const UserResourceInteraction = mongoose.model<
  IUserResourceInteraction,
  IUserResourceInteractionModel
>('UserResourceInteraction', userResourceInteractionSchema);

export default UserResourceInteraction;
