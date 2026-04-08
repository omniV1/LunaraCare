/**
 * @module AvailabilitySlot
 * Mongoose model for provider time-slot availability.
 * Maps to the MongoDB `availabilityslots` collection.
 * Each slot represents a bookable window (HH:mm format) on a given date,
 * optionally recurring on a specific day of the week.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** A single bookable time-slot owned by a provider. */
export interface IAvailabilitySlotDocument extends Document {
  providerId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;   // e.g. "09:00"
  endTime: string;      // e.g. "10:00"
  isBooked: boolean;
  appointmentId?: mongoose.Types.ObjectId;
  recurring: boolean;
  dayOfWeek?: number;   // 0 = Sunday … 6 = Saturday (for recurring templates)
  createdAt: Date;
  updatedAt: Date;
}

/** Static helpers on the AvailabilitySlot model. */
export interface IAvailabilitySlotModel extends Model<IAvailabilitySlotDocument> {
  /**
   * Return unbooked slots for a provider within a date range, sorted chronologically.
   * @param providerId - Provider's ObjectId.
   * @param from - Start of the date range (inclusive).
   * @param to - End of the date range (inclusive).
   */
  findAvailable(
    providerId: mongoose.Types.ObjectId,
    from: Date,
    to: Date
  ): Promise<IAvailabilitySlotDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     AvailabilitySlot:
 *       type: object
 *       required:
 *         - providerId
 *         - date
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: string
 *         providerId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           description: "HH:mm format"
 *         endTime:
 *           type: string
 *           description: "HH:mm format"
 *         isBooked:
 *           type: boolean
 *         recurring:
 *           type: boolean
 *         dayOfWeek:
 *           type: number
 */

const availabilitySlotSchema = new Schema<IAvailabilitySlotDocument>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
    },
  },
  { timestamps: true }
);

availabilitySlotSchema.statics.findAvailable = function (
  providerId: mongoose.Types.ObjectId,
  from: Date,
  to: Date
) {
  return this.find({
    providerId,
    date: { $gte: from, $lte: to },
    isBooked: false,
  }).sort({ date: 1, startTime: 1 });
};

/** @index providerId + date — fast calendar look-ups for a given provider. */
availabilitySlotSchema.index({ providerId: 1, date: 1 });
/** @index providerId + isBooked — quickly find open slots. */
availabilitySlotSchema.index({ providerId: 1, isBooked: 1 });

const AvailabilitySlot = mongoose.model<
  IAvailabilitySlotDocument,
  IAvailabilitySlotModel
>('AvailabilitySlot', availabilitySlotSchema);

export default AvailabilitySlot;
