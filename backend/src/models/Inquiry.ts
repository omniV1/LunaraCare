/**
 * @module Inquiry
 * Public-facing contact/inquiry form submissions.
 * Maps to the MongoDB `inquiries` collection.
 * Tracks the lifecycle of prospective-client inquiries from `new` through
 * `contacted`, `converted` (to registered client), or `closed`.
 */
import mongoose, { Document, Schema } from 'mongoose';

/** A contact-form submission from a prospective client. */
export interface IInquiry extends Document {
  name: string;
  email: string;
  phone?: string;
  message: string;
  dueDate?: Date;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  notes?: string;
  respondedAt?: Date;
  respondedBy?: mongoose.Types.ObjectId;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Inquiry:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *           enum: [new, contacted, converted, closed]
 *         dueDate:
 *           type: string
 *           format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 */
const inquirySchema = new Schema<IInquiry>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new',
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    respondedAt: {
      type: Date,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/** @index status + createdAt — newest-first listing filtered by workflow state. */
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ email: 1 });

const Inquiry = mongoose.model<IInquiry>('Inquiry', inquirySchema);

export default Inquiry;
