import mongoose, { Schema, Document, Model } from 'mongoose';

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

export type PhysicalSymptom = (typeof PHYSICAL_SYMPTOMS)[number];

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

export interface ICheckInModel extends Model<ICheckInDocument> {
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

checkInSchema.index({ userId: 1, date: -1 }, { unique: true });

const CheckIn = mongoose.model<ICheckInDocument, ICheckInModel>(
  'CheckIn',
  checkInSchema
);

export default CheckIn;
