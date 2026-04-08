/**
 * @module CheckIn
 * Daily wellness check-in submitted by postpartum clients.
 * Maps to the MongoDB `checkins` collection.
 * Records mood score (1-10), physical symptoms from a fixed vocabulary,
 * and optional free-text notes. A unique compound index on userId + date
 * enforces one check-in per client per day.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** Allowed physical symptom values for check-in forms. */
export const PHYSICAL_SYMPTOMS = [
  'fatigue',
  'sleep_issues',
  'appetite_changes',
  'anxiety',
  'pain',
  'headache',
  'nausea',
  'dizziness',
  'breast_soreness',
  'bleeding',
] as const;

/** Union type derived from the PHYSICAL_SYMPTOMS tuple. */
export type PhysicalSymptom = (typeof PHYSICAL_SYMPTOMS)[number];

/** A single daily check-in record for a client. */
export interface ICheckInDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  moodScore: number;
  physicalSymptoms: PhysicalSymptom[];
  notes?: string;
  sharedWithProvider: boolean;
  providerReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Static helpers on the CheckIn model. */
export interface ICheckInModel extends Model<ICheckInDocument> {
  /**
   * Return recent check-ins for a user, newest first.
   * @param userId - The client's ObjectId.
   * @param limit - Maximum results (default 30).
   */
  findByUser(
    userId: mongoose.Types.ObjectId,
    limit?: number
  ): Promise<ICheckInDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CheckIn:
 *       type: object
 *       required:
 *         - userId
 *         - date
 *         - moodScore
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         moodScore:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         physicalSymptoms:
 *           type: array
 *           items:
 *             type: string
 *             enum: [fatigue, sleep_issues, appetite_changes, anxiety, pain, headache, nausea, dizziness, breast_soreness, bleeding]
 *         notes:
 *           type: string
 *         sharedWithProvider:
 *           type: boolean
 */

const checkInSchema = new Schema<ICheckInDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    moodScore: {
      type: Number,
      required: [true, 'Mood score is required'],
      min: [1, 'Mood score must be at least 1'],
      max: [10, 'Mood score cannot exceed 10'],
    },
    physicalSymptoms: [
      {
        type: String,
        enum: PHYSICAL_SYMPTOMS,
      },
    ],
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    sharedWithProvider: {
      type: Boolean,
      default: false,
    },
    providerReviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

checkInSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
  limit = 30
) {
  return this.find({ userId }).sort({ date: -1 }).limit(limit).exec();
};

/** @index Unique compound index — enforces one check-in per user per day. */
checkInSchema.index({ userId: 1, date: -1 }, { unique: true });

const CheckIn = mongoose.model<ICheckInDocument, ICheckInModel>(
  'CheckIn',
  checkInSchema
);

export default CheckIn;
