/**
 * @module services/emailService
 * Transactional email delivery via Nodemailer/Gmail SMTP. Provides
 * HTML+text templates for welcome, password-reset, login-notification,
 * and appointment lifecycle emails. Includes XSS-safe data escaping
 * and Gmail sender-address resolution.
 */

import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import logger from '../utils/logger';

function esc(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escData(data: EmailTemplateData): EmailTemplateData {
  const safe: EmailTemplateData = {};
  for (const [key, val] of Object.entries(data)) {
    safe[key] = typeof val === 'string' ? esc(val) : val;
  }
  return safe;
}

/** Template interpolation variables keyed by placeholder name. */
export interface EmailTemplateData {
  firstName?: string;
  verificationUrl?: string;
  resetUrl?: string;
  clientName?: string;
  doulaName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  appointmentNotes?: string;
  [key: string]: string | undefined;
}

/** An email template with subject line and HTML/text renderers. */
export interface EmailTemplate {
  subject: string;
  html: (data: EmailTemplateData) => string;
  text: (data: EmailTemplateData) => string;
}

/** Options for sending a templated email. */
export interface SendEmailOptions {
  to: string;
  template: string;
  data: EmailTemplateData;
  subject?: string;
}

/** Options for sending a raw (non-templated) email. */
export interface SendRawEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter using Gmail SMTP
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number.parseInt(process.env.EMAIL_PORT ?? '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!, // Use app password for Gmail
    },
  });
};

let warnedGmailFromMismatch = false;

/**
 * Gmail authenticates as EMAIL_USER but often rejects the actual message if the
 * From header is a different address (unless that address is a verified "Send mail as" alias).
 * verify() does not catch this — only sendMail does.
 *
 * Default: use EMAIL_USER as From when using smtp.gmail.com and EMAIL_FROM differs.
 * Set EMAIL_SMTP_ALLOW_FROM_ALIAS=true if EMAIL_FROM is a verified Gmail alias.
 */
function resolveMailFrom(): { name: string; address: string } {
  const name = process.env.EMAIL_FROM_NAME ?? 'LUNARA Platform';
  const user = (process.env.EMAIL_USER ?? '').trim();
  const fromEnv = (process.env.EMAIL_FROM ?? '').trim();
  const host = (process.env.EMAIL_HOST ?? 'smtp.gmail.com').trim();
  const isGmailSmtp = host === 'smtp.gmail.com';

  let address = fromEnv || user;

  if (
    isGmailSmtp &&
    user &&
    fromEnv &&
    fromEnv.toLowerCase() !== user.toLowerCase() &&
    process.env.EMAIL_SMTP_ALLOW_FROM_ALIAS !== 'true'
  ) {
    if (!warnedGmailFromMismatch) {
      warnedGmailFromMismatch = true;
      logger.warn(
        `[email] EMAIL_FROM (${fromEnv}) ≠ EMAIL_USER (${user}) on Gmail SMTP. ` +
          `Using EMAIL_USER as the sender so mail is accepted. ` +
          `To send as ${fromEnv}, add it in Gmail as a verified "Send mail as" alias and set EMAIL_SMTP_ALLOW_FROM_ALIAS=true, ` +
          `or set EMAIL_FROM to the same address as EMAIL_USER.`
      );
    }
    address = user;
  }

  return { name, address };
}

/**
 * Email templates
 */
const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to LUNARA - Verify Your Email',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .button { display: inline-block; background-color: #8FBC8F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
            <p style="margin: 10px 0; color: #666;">Postpartum Support Platform</p>
          </div>
          <div class="content">
            <h2>Welcome, ${data.firstName}!</h2>
            <p>Thank you for joining LUNARA, your dedicated postpartum support platform. We're here to support you through your fourth trimester journey with personalized care and resources.</p>
            
            <p>To get started, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Complete your intake form for personalized care</li>
              <li>Connect with your assigned doula</li>
              <li>Access our curated resource library</li>
              <li>Schedule appointments and send messages</li>
              <li>Track your wellness and recovery progress</li>
            </ul>
            
            <p>If you didn't create this account, please ignore this email.</p>
            
            <p>This verification link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
            <p>If you have any questions, please contact us at support@lunaracare.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      Welcome to LUNARA, ${data.firstName}!
      
      Thank you for joining our postpartum support platform. To complete your registration, please verify your email address by visiting:
      
      ${data.verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      Best regards,
      The LUNARA Team
    `,
  },

  'password-reset': {
    subject: 'LUNARA - Password Reset Request',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .button { display: inline-block; background-color: #8FBC8F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
            <p style="margin: 10px 0; color: #666;">Postpartum Support Platform</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${data.firstName},</p>
            
            <p>We received a request to reset your password for your LUNARA account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 30 minutes for your security. If you didn't request this reset, please ignore this email - your password will remain unchanged.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
            <p>If you have any questions, please contact us at support@lunaracare.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      Password Reset Request - LUNARA
      
      Hello ${data.firstName},
      
      We received a request to reset your password. If you made this request, please visit the following link to reset your password:
      
      ${data.resetUrl}
      
      This link will expire in 30 minutes for your security.
      
      If you didn't request this reset, please ignore this email.
      
      Best regards,
      The LUNARA Team
    `,
  },

  'login-notification': {
    subject: 'LUNARA - New Login to Your Account',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Login - LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
          </div>
          <div class="content">
            <h2>New Login Detected</h2>
            <p>Hello ${data.firstName},</p>
            <p>We detected a new login to your LUNARA account.</p>
            <div class="details">
              <p><strong>Time:</strong> ${data.loginTime}</p>
              <p><strong>IP Address:</strong> ${data.ipAddress}</p>
            </div>
            <div class="warning">
              <strong>Wasn't you?</strong> If you didn't log in, please <a href="${data.resetUrl}">reset your password immediately</a> and consider enabling two-factor authentication in your account settings.
            </div>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      New Login Detected - LUNARA

      Hello ${data.firstName},

      We detected a new login to your LUNARA account.

      Time: ${data.loginTime}
      IP Address: ${data.ipAddress}

      If this wasn't you, please reset your password immediately at: ${data.resetUrl}

      The LUNARA Team
    `,
  },

  appointment: {
    subject: 'LUNARA - Appointment Confirmation',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation - LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .appointment-details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
            <p style="margin: 10px 0; color: #666;">Postpartum Support Platform</p>
          </div>
          <div class="content">
            <h2>Appointment Confirmed</h2>
            <p>Hello ${data.clientName},</p>

            <p>Your appointment with ${data.doulaName} has been confirmed!</p>

            <div class="appointment-details">
              <h3 style="margin-top: 0;">Appointment Details</h3>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> ${data.appointmentType}</p>
              ${data.appointmentNotes ? `<p><strong>Notes:</strong> ${data.appointmentNotes}</p>` : ''}
            </div>

            <p>We'll send you a reminder 24 hours before your appointment. If you need to reschedule or cancel, please log into your LUNARA account or contact your doula directly.</p>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
            <p>If you have any questions, please contact us at support@lunaracare.org</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      Appointment Confirmed - LUNARA

      Hello ${data.clientName},

      Your appointment with ${data.doulaName} has been confirmed!

      Appointment Details:
      Date: ${data.appointmentDate}
      Time: ${data.appointmentTime}
      Type: ${data.appointmentType}
      ${data.appointmentNotes ? `Notes: ${data.appointmentNotes}` : ''}

      We'll send you a reminder 24 hours before your appointment.

      Best regards,
      The LUNARA Team
    `,
  },

  'appointment-request': {
    subject: 'LUNARA - New Appointment Request',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Request - LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .appointment-details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .action-box { background-color: #e8f5e9; border: 1px solid #8FBC8F; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
            <p style="margin: 10px 0; color: #666;">Postpartum Support Platform</p>
          </div>
          <div class="content">
            <h2>New Appointment Request</h2>
            <p>Hello ${data.providerName},</p>
            <p><strong>${data.clientName}</strong> has requested an appointment with you.</p>
            <div class="appointment-details">
              <h3 style="margin-top: 0;">Request Details</h3>
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              <p><strong>Type:</strong> ${data.appointmentType}</p>
              ${data.appointmentNotes ? `<p><strong>Notes:</strong> ${data.appointmentNotes}</p>` : ''}
            </div>
            <div class="action-box">
              <p style="margin: 0;">Log in to your LUNARA provider dashboard to <strong>approve or decline</strong> this request.</p>
            </div>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      New Appointment Request - LUNARA

      Hello ${data.providerName},

      ${data.clientName} has requested an appointment with you.

      Request Details:
      Date: ${data.appointmentDate}
      Time: ${data.appointmentTime}
      Type: ${data.appointmentType}
      ${data.appointmentNotes ? `Notes: ${data.appointmentNotes}` : ''}

      Log in to your LUNARA provider dashboard to approve or decline this request.

      The LUNARA Team
    `,
  },

  'appointment-cancelled': {
    subject: 'LUNARA - Appointment Cancelled',
    html: (data: EmailTemplateData): string => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancelled - LUNARA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8FBC8F; }
          .content { padding: 30px 0; }
          .appointment-details { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #2F4F4F; margin: 0;">LUNARA</h1>
            <p style="margin: 10px 0; color: #666;">Postpartum Support Platform</p>
          </div>
          <div class="content">
            <h2>Appointment Cancelled</h2>
            <p>Hello ${data.clientName},</p>
            <p>Your appointment with <strong>${data.doulaName}</strong> has been cancelled.</p>
            <div class="appointment-details">
              <p><strong>Date:</strong> ${data.appointmentDate}</p>
              <p><strong>Time:</strong> ${data.appointmentTime}</p>
              ${data.appointmentNotes ? `<p><strong>Reason:</strong> ${data.appointmentNotes}</p>` : ''}
            </div>
            <p>Please log in to LUNARA to schedule a new appointment if needed.</p>
          </div>
          <div class="footer">
            <p>LUNARA - Supporting you through your postpartum journey</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: EmailTemplateData): string => `
      Appointment Cancelled - LUNARA

      Hello ${data.clientName},

      Your appointment with ${data.doulaName} has been cancelled.

      Date: ${data.appointmentDate}
      Time: ${data.appointmentTime}
      ${data.appointmentNotes ? `Reason: ${data.appointmentNotes}` : ''}

      Please log in to LUNARA to schedule a new appointment if needed.

      The LUNARA Team
    `,
  },
};

/**
 * Send an email using the specified template
 * @param options - Email options
 * @returns Promise that resolves when email is sent
 */
export const sendEmail = async (options: SendEmailOptions): Promise<nodemailer.SentMessageInfo> => {
  const { to, template, data, subject } = options;
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid recipient email address');
    }

    const transporter = createTransporter();
    const emailTemplate = emailTemplates[template];

    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const safeData = escData(data);

    const mailOptions: SendMailOptions = {
      from: resolveMailFrom(),
      to: to,
      subject: subject ?? emailTemplate.subject,
      html: emailTemplate.html(safeData),
      text: emailTemplate.text(data),
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: template="${template}" to="${to}" messageId=${result.messageId}`);
    return result;
  } catch (error) {
    logger.error(
      `Email send failed (template="${template}" to="${to}"). Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and that the sender is allowed (e.g. Gmail App Password).`,
      error
    );
    throw error;
  }
};

/**
 * Send a plain email without template
 * @param options - Email options
 * @returns Promise that resolves when email is sent
 */
export const sendRawEmail = async (options: SendRawEmailOptions): Promise<nodemailer.SentMessageInfo> => {
  const { to, subject, html, text } = options;
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid recipient email address');
    }

    const transporter = createTransporter();

    const mailOptions: SendMailOptions = {
      from: resolveMailFrom(),
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Raw email sent: to="${to}" messageId=${result.messageId}`);
    return result;
  } catch (error) {
    logger.error(
      `Raw email failed (to="${to}"). Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.`,
      error
    );
    throw error;
  }
};

/**
 * Test email configuration
 * @returns Promise that resolves to true if configuration is valid
 */
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration is valid');
    return true;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
};

/**
 * Validate email environment variables
 * @throws Error if required environment variables are missing
 */
export const validateEmailEnvironment = (): void => {
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required email environment variables: ${missingVars.join(', ')}`);
  }
};

export { emailTemplates };
