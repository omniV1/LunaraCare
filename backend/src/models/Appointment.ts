import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppointmentDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  type?: 'virtual' | 'in_person';
  notes?: string;
  requestedBy: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  availabilitySlotId?: mongoose.Types.ObjectId;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointmentModel extends Model<IAppointmentDocument> {
  findByClient(clientId: mongoose.Types.ObjectId): Promise<IAppointmentDocument[]>;
  findByProvider(providerId: mongoose.Types.ObjectId): Promise<IAppointmentDocument[]>;
  findUpcoming(userId: mongoose.Types.ObjectId, role: string): Promise<IAppointmentDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - clientId
 *         - providerId
 *         - startTime
 *         - endTime
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated appointment ID
 *         clientId:
 *           type: string
 *           description: Reference to the client user ID
 *         providerId:
 *           type: string
 *           description: Reference to the provider user ID
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [requested, confirmed, scheduled, completed, cancelled]
 *           default: requested
 *         type:
 *           type: string
 *           enum: [virtual, in_person]
 *         notes:
 *           type: string
 *         requestedBy:
 *           type: string
 *           description: User ID of whoever requested the appointment
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *         cancellationReason:
 *           type: string
 *         cancelledBy:
 *           type: string
 *         availabilitySlotId:
 *           type: string
 *         reminderSentAt:
 *           type: string
 *           format: date-time
 */

const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'scheduled', 'completed', 'cancelled'],
      default: 'requested',
    },
    type: {
      type: String,
      enum: ['virtual', 'in_person'],
      default: 'virtual',
    },
    notes: {
      type: String,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    confirmedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    availabilitySlotId: {
      type: Schema.Types.ObjectId,
      ref: 'AvailabilitySlot',
    },
    reminderSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.static('findByClient', function (clientId: mongoose.Types.ObjectId) {
  return this.find({ clientId }).sort({ startTime: -1 }).exec();
});

appointmentSchema.static('findByProvider', function (providerId: mongoose.Types.ObjectId) {
  return this.find({ providerId }).sort({ startTime: -1 }).exec();
});

appointmentSchema.static(
  'findUpcoming',
  function (userId: mongoose.Types.ObjectId, role: string) {
    const filter =
      role === 'provider' ? { providerId: userId } : { clientId: userId };
    return this.find({
      ...filter,
      startTime: { $gte: new Date() },
      status: { $in: ['requested', 'confirmed', 'scheduled'] },
    })
      .sort({ startTime: 1 })
      .exec();
  }
);

appointmentSchema.index({ clientId: 1, startTime: -1 });
appointmentSchema.index({ providerId: 1, startTime: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ startTime: 1, status: 1 });

const Appointment = mongoose.model<IAppointmentDocument, IAppointmentModel>(
  'Appointment',
  appointmentSchema
);
export default Appointment;
