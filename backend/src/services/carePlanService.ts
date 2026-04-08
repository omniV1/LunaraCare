/**
 * @module services/carePlanService
 * CRUD and milestone tracking for client care plans. Supports template-based
 * plan creation, section/milestone updates, and progress calculation.
 * Operates on the CarePlan and CarePlanTemplate models.
 */

import mongoose from 'mongoose';
import CarePlan, { ICarePlanDocument, ISection, IMilestone } from '../models/CarePlan';
import CarePlanTemplate, { ICarePlanTemplateDocument } from '../models/CarePlanTemplate';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// ── Input types ──────────────────────────────────────────────────────────────

/** Fields for creating a new care plan (optionally from a template). */
export interface CreateCarePlanInput {
  clientId: string;
  title: string;
  templateId?: string;
  description?: string;
  sections?: unknown[];
}

/** Mutable fields when updating an existing care plan. */
export interface UpdateCarePlanInput {
  title?: string;
  description?: string;
  status?: string;
  sections?: unknown[];
}

/** Fields for updating a milestone's status and notes. */
export interface UpdateMilestoneInput {
  status: string;
  notes?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Apply optional field updates to a care plan document. */
function applyCarePlanFields(
  carePlan: InstanceType<typeof CarePlan>,
  data: UpdateCarePlanInput
): void {
  const { title, description, status, sections } = data;
  if (title !== undefined) carePlan.title = title;
  if (description !== undefined) carePlan.description = description;
  if (status !== undefined) carePlan.set('status', status);
  if (sections !== undefined) carePlan.set('sections', sections);
}

/** Locate a milestone by ID across all sections and apply the update. */
function applyMilestoneUpdate(
  sections: ISection[],
  milestoneId: string,
  status: string,
  notes?: string
): boolean {
  for (const section of sections) {
    const milestone = (section.milestones as (IMilestone & { _id?: mongoose.Types.ObjectId })[]).find(
      (m) => String(m._id) === milestoneId
    );
    if (!milestone) continue;

    milestone.status = status as IMilestone['status'];
    if (status === 'completed') {
      milestone.completedAt = new Date();
    }
    if (notes !== undefined) {
      milestone.notes = notes;
    }
    return true;
  }
  return false;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * List active care plan templates.
 *
 * @returns Templates sorted alphabetically by name
 */
export async function listTemplates(): Promise<ICarePlanTemplateDocument[]> {
  return CarePlanTemplate.find({ isActive: true }).sort({ name: 1 });
}

/**
 * Create a care plan template.
 *
 * @param data - Template name, condition, and section/milestone structure
 * @param userId - ID of the user creating the template
 * @returns The newly created template document
 */
export async function createTemplate(
  data: {
    name: string;
    description?: string;
    targetCondition: string;
    sections: Array<{
      title: string;
      description?: string;
      milestones?: Array<{
        title: string;
        description?: string;
        weekOffset: number;
        category?: string;
      }>;
    }>;
  },
  userId: mongoose.Types.ObjectId
): Promise<ICarePlanTemplateDocument> {
  const sections = (data.sections ?? []).map((s) => ({
    title: s.title,
    description: s.description,
    milestones: (s.milestones ?? []).map((m) => ({
      title: m.title,
      description: m.description,
      weekOffset: m.weekOffset,
      category: m.category ?? 'general',
    })),
  }));

  const template = await CarePlanTemplate.create({
    name: data.name,
    description: data.description,
    targetCondition: data.targetCondition,
    isActive: true,
    createdBy: userId,
    sections,
  });

  return template;
}

/**
 * Get care plans for the authenticated client.
 *
 * @param userId - Client's user ObjectId
 * @returns Care plans and total count
 */
export async function getMyCarePlans(
  userId: mongoose.Types.ObjectId
): Promise<{ carePlans: ICarePlanDocument[]; count: number }> {
  const carePlans = await CarePlan.find({ clientId: userId }).sort({ createdAt: -1 });
  return { carePlans, count: carePlans.length };
}

/**
 * Get care plans for a specific client (provider/admin view).
 *
 * @param clientUserId - Target client's user ID string
 * @returns Care plans and total count
 */
export async function getCarePlansByClient(
  clientUserId: string
): Promise<{ carePlans: ICarePlanDocument[]; count: number }> {
  const carePlans = await CarePlan.find({ clientId: clientUserId }).sort({ createdAt: -1 });
  return { carePlans, count: carePlans.length };
}

/**
 * Create a care plan, optionally from a template.
 *
 * @param data - Plan details including optional templateId
 * @param providerId - Provider's ObjectId assigned as plan owner
 * @returns The newly created care plan
 * @throws NotFoundError — template not found
 */
export async function createCarePlan(
  data: CreateCarePlanInput,
  providerId: mongoose.Types.ObjectId
): Promise<ICarePlanDocument> {
  let sections = data.sections ?? [];

  if (data.templateId) {
    const template = await CarePlanTemplate.findById(data.templateId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }
    sections = template.sections.map((s) => ({
      title: s.title,
      description: s.description,
      milestones: s.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        weekOffset: m.weekOffset,
        category: m.category,
        status: 'pending',
      })),
    }));
  }

  const carePlan = new CarePlan({
    clientId: data.clientId,
    providerId,
    templateId: data.templateId,
    title: data.title,
    description: data.description,
    sections,
  });

  await carePlan.save();
  return carePlan;
}

/**
 * Update a care plan.
 *
 * @param carePlanId - Care plan ObjectId
 * @param data - Fields to update
 * @param userId - Authenticated user's ObjectId
 * @param userRole - Caller's role for authorization
 * @returns The updated care plan
 * @throws NotFoundError  — care plan not found
 * @throws ForbiddenError — caller is not the owner and not provider/admin
 */
export async function updateCarePlan(
  carePlanId: string,
  data: UpdateCarePlanInput,
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<ICarePlanDocument> {
  const carePlan = await CarePlan.findById(carePlanId);
  if (!carePlan) {
    throw new NotFoundError('Care plan not found');
  }

  const isOwner = carePlan.providerId.toString() === String(userId);
  if (!isOwner && userRole !== 'provider' && userRole !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }

  applyCarePlanFields(carePlan, data);
  await carePlan.save();
  return carePlan;
}

/**
 * Update a milestone within a care plan.
 *
 * @param carePlanId - Care plan ObjectId
 * @param milestoneId - Milestone subdocument ID
 * @param data - New status and optional notes
 * @param userId - Authenticated user's ObjectId
 * @param userRole - Caller's role for authorization
 * @returns Updated care plan and recalculated progress percentage
 * @throws NotFoundError  — care plan or milestone not found
 * @throws ForbiddenError — caller not authorized
 */
export async function updateMilestone(
  carePlanId: string,
  milestoneId: string,
  data: UpdateMilestoneInput,
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<{ carePlan: ICarePlanDocument; progress: number }> {
  const carePlan = await CarePlan.findById(carePlanId);
  if (!carePlan) {
    throw new NotFoundError('Care plan not found');
  }

  const isProvider = carePlan.providerId.toString() === String(userId);
  const isClient = carePlan.clientId.toString() === String(userId);
  if (!isProvider && !isClient && userRole !== 'provider' && userRole !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }

  const found = applyMilestoneUpdate(carePlan.sections, milestoneId, data.status, data.notes);
  if (!found) {
    throw new NotFoundError('Milestone not found');
  }

  await carePlan.save();
  return { carePlan, progress: carePlan.progress };
}
