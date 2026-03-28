import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     PushSubscription:
 *       type: object
 *       required:
 *         - userId
 *         - endpoint
 *         - keys
 *       properties:
 *         userId:
 *           type: string
 *           description: Reference to the User who owns this subscription
 *         endpoint:
 *           type: string
 *           description: Push service endpoint URL
 *         keys:
 *           type: object
 *           properties:
 *             p256dh:
 *               type: string
 *             auth:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    endpoint: {
      type: String,
      required: [true, 'Push endpoint is required'],
      unique: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, 'p256dh key is required'],
      },
      auth: {
        type: String,
        required: [true, 'auth key is required'],
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 });

const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema
);

export default PushSubscription;
