import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplateMilestone {
  title: string;
  description?: string;
  weekOffset: number;
  category: 'physical' | 'emotional' | 'feeding' | 'self_care' | 'general';
}

export interface ITemplateSection {
  title: string;
  description?: string;
  milestones: ITemplateMilestone[];
}

export interface ICarePlanTemplateDocument extends Document {
  name: string;
  description?: string;
  targetCondition: string;
  sections: ITemplateSection[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICarePlanTemplateModel extends Model<ICarePlanTemplateDocument> {
  findActive(): Promise<ICarePlanTemplateDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     CarePlanTemplate:
 *       type: object
 *       required:
 *         - name
 *         - targetCondition
 *         - sections
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         targetCondition:
 *           type: string
 *         sections:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               milestones:
 *                 type: array
 *                 items:
 *                   type: object
 *         isActive:
 *           type: boolean
 */

const templateMilestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    weekOffset: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['physical', 'emotional', 'feeding', 'self_care', 'general'],
      default: 'general',
    },
  },
  { _id: true }
);

const templateSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    milestones: [templateMilestoneSchema],
  },
  { _id: true }
);

const carePlanTemplateSchema = new Schema<ICarePlanTemplateDocument>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    targetCondition: {
      type: String,
      required: [true, 'Target condition is required'],
    },
    sections: [templateSectionSchema],
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

carePlanTemplateSchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort({ name: 1 });
};

carePlanTemplateSchema.index({ isActive: 1 });
carePlanTemplateSchema.index({ targetCondition: 1 });

const CarePlanTemplate = mongoose.model<
  ICarePlanTemplateDocument,
  ICarePlanTemplateModel
>('CarePlanTemplate', carePlanTemplateSchema);

export default CarePlanTemplate;
