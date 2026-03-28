import mongoose from 'mongoose';
import Inquiry, { IInquiry } from '../models/Inquiry';
import { sendRawEmail } from './emailService';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// ── Input types ──────────────────────────────────────────────────────────────

export interface SubmitContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  dueDate?: string;
  ipAddress?: string;
}

export interface UpdateInquiryInput {
  status?: string;
  notes?: string;
}

export interface InquiryListQuery {
  status?: string;
  page?: string;
  limit?: string;
}

// ── Result types ─────────────────────────────────────────────────────────────

export interface InquiryListResult {
  data: IInquiry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Submit a contact form inquiry and send an email notification.
 */
export async function submitContactForm(
  data: SubmitContactInput
): Promise<{ message: string; status: string }> {
  const { name, email, phone, message, dueDate, ipAddress } = data;

  const inquiry = await Inquiry.create({
    name,
    email,
    phone,
    message,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    ipAddress,
  });

  // Notify provider via email (non-blocking)
  const notifyEmail = process.env.INQUIRY_NOTIFY_EMAIL ?? process.env.EMAIL_USER;
  if (notifyEmail) {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    sendRawEmail({
      to: notifyEmail,
      subject: `New Inquiry from ${name}`,
      html: `
        <h2>New Inquiry Received</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${esc(message).replace(/\n/g, '<br>')}</p>
        ${dueDate ? `<p><strong>Consultation Date:</strong> ${esc(dueDate)}</p>` : ''}
        <hr>
        <p><small>Inquiry ID: ${inquiry._id} | Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })}</small></p>
      `,
      text: `New Inquiry from ${name}\n\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ''}Message: ${message}\n${dueDate ? `Consultation Date: ${dueDate}\n` : ''}`,
    }).catch((err: unknown) => {
      logger.error('Failed to send inquiry notification email:', err);
    });
  }

  return {
    message: 'Thank you for your inquiry! We will get back to you within 24 hours.',
    status: 'success',
  };
}

/**
 * List inquiries with filtering and pagination (provider/admin).
 */
export async function listInquiries(query: InquiryListQuery): Promise<InquiryListResult> {
  const { status, page = '1', limit = '20' } = query;
  const filter: Record<string, unknown> = {};
  if (status && typeof status === 'string') filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Inquiry.countDocuments(filter),
  ]);

  return {
    data: inquiries as IInquiry[],
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Update an inquiry's status/notes (provider/admin).
 *
 * @throws NotFoundError — inquiry not found
 */
export async function updateInquiry(
  inquiryId: string,
  data: UpdateInquiryInput,
  responderId: mongoose.Types.ObjectId
): Promise<IInquiry> {
  const update: Record<string, unknown> = {};
  if (data.status) update.status = data.status;
  if (data.notes !== undefined) update.notes = data.notes;
  if (data.status === 'contacted') {
    update.respondedAt = new Date();
    update.respondedBy = responderId;
  }

  const inquiry = await Inquiry.findByIdAndUpdate(inquiryId, update, { new: true });
  if (!inquiry) {
    throw new NotFoundError('Inquiry not found');
  }

  return inquiry;
}
