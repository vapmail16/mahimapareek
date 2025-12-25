import { Resend } from 'resend';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import { InternalServerError } from '../utils/errors';

// Initialize Resend client
let resend: Resend | null = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || config.email.apiKey;
  
  if (!apiKey || apiKey === 'your-resend-api-key-here') {
    logger.warn('RESEND_API_KEY not configured, emails will not be sent');
    return null;
  }
  
  // Always create new client in tests (to pick up mocks)
  if (process.env.NODE_ENV === 'test') {
    return new Resend(apiKey);
  }
  
  if (!resend) {
    resend = new Resend(apiKey);
  }
  
  return resend;
};

/**
 * Mask email for display (PII protection)
 */
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  return `${localPart[0]}***@${domain}`;
};

/**
 * Render email template with data
 */
export const renderTemplate = (templateName: string, data: Record<string, any>): string => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates/emails',
      `${templateName}.hbs`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Mask email in data for display
    const safeData = {
      ...data,
      email: data.email ? maskEmail(data.email) : data.email,
      year: data.year || new Date().getFullYear(),
      appName: data.appName || process.env.APP_NAME || 'App Template',
    };

    return template(safeData);
  } catch (error: any) {
    logger.error('Failed to render email template', {
      templateName,
      error: error.message,
    });
    throw new Error(`Failed to render template: ${error.message}`);
  }
};

/**
 * Send email using Resend
 */
const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  const client = getResendClient();

  if (!client) {
    logger.warn('Email not sent - Resend not configured', {
      to: options.to,
      subject: options.subject,
    });
    return { id: 'mock-email-id' };
  }

  try {
    const result = await client.emails.send({
      from: config.email.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    // Check if send was successful
    if ('error' in result && result.error) {
      throw new Error(result.error.message);
    }

    logger.info('Email sent successfully', {
      emailId: result.data?.id,
      to: options.to,
      subject: options.subject,
    });

    return result;
  } catch (error: any) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error: error.message,
    });
    throw new InternalServerError('Failed to send email');
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (params: {
  to: string;
  name?: string;
  actionUrl?: string;
}) => {
  const html = renderTemplate('welcome', {
    name: params.name || 'User',
    email: params.to,
    actionUrl: params.actionUrl || `${config.frontendUrl}/dashboard`,
  });

  return sendEmail({
    to: params.to,
    subject: `Welcome to ${process.env.APP_NAME || 'App Template'}!`,
    html,
  });
};

/**
 * Send email verification email
 */
export const sendVerificationEmail = async (params: {
  to: string;
  name?: string;
  token: string;
}) => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${params.token}`;

  const html = renderTemplate('verify-email', {
    name: params.name || 'User',
    email: params.to,
    verificationUrl,
    expiryHours: 24,
  });

  return sendEmail({
    to: params.to,
    subject: 'Verify Your Email Address',
    html,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (params: {
  to: string;
  name?: string;
  token: string;
}) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${params.token}`;

  const html = renderTemplate('reset-password', {
    name: params.name || 'User',
    email: params.to,
    resetUrl,
    expiryHours: 1,
  });

  return sendEmail({
    to: params.to,
    subject: 'Reset Your Password',
    html,
  });
};

/**
 * Send generic notification email
 */
export const sendNotificationEmail = async (params: {
  to: string;
  subject: string;
  title: string;
  message: string;
  name?: string;
  actionUrl?: string;
  actionText?: string;
}) => {
  const html = renderTemplate('notification', {
    name: params.name || 'User',
    email: params.to,
    title: params.title,
    message: params.message,
    actionUrl: params.actionUrl,
    actionText: params.actionText || 'View Details',
  });

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html,
  });
};

