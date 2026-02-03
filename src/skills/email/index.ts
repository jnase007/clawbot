import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import PQueue from 'p-queue';
import { config } from '../../config/index.js';
import { getTemplate, logAction, updateContactStatus, getPendingContacts } from '../../db/repository.js';
import type { OutreachContact, Template } from '../../db/types.js';

let transporter: Transporter | null = null;

/**
 * Initialize the email transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
      throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS.');
    }

    transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_PORT === 465,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Compile a template with variables
 */
function compileTemplate(
  template: string,
  variables: Record<string, string>
): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments?: Array<{ filename: string; path: string }>
): Promise<EmailResult> {
  try {
    const transport = getTransporter();
    
    const result = await transport.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
      text: body,
      attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email to a contact using a template
 */
export async function sendTemplatedEmail(
  contact: OutreachContact,
  template: Template,
  extraVariables?: Record<string, string>
): Promise<EmailResult> {
  const email = contact.email || contact.handle;
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  const variables: Record<string, string> = {
    name: contact.name || 'there',
    email,
    ...extraVariables,
  };

  const subject = template.subject 
    ? compileTemplate(template.subject, variables)
    : 'Message from ProjectHunter.ai';
  
  const body = compileTemplate(template.content, variables);

  const result = await sendEmail(email, subject, body);

  // Log the action
  await logAction(
    'email',
    'send_email',
    result.success,
    contact.id,
    template.id,
    { to: email, subject },
    result.messageId,
    result.error
  );

  // Update contact status
  if (result.success) {
    await updateContactStatus(contact.id, 'sent');
  }

  return result;
}

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send a campaign to multiple contacts
 */
export async function sendCampaign(
  contacts: OutreachContact[],
  templateId: string,
  extraVariables?: Record<string, string>
): Promise<CampaignResult> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Rate-limited queue
  const queue = new PQueue({
    concurrency: 1,
    interval: 1000,
    intervalCap: config.EMAIL_RATE_LIMIT,
  });

  const result: CampaignResult = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  const tasks = contacts.map((contact) =>
    queue.add(async () => {
      const email = contact.email || contact.handle;
      console.log(`📧 Sending to ${email}...`);
      
      const sendResult = await sendTemplatedEmail(contact, template, extraVariables);
      
      if (sendResult.success) {
        result.sent++;
        console.log(`  ✅ Sent (${result.sent}/${result.total})`);
      } else {
        result.failed++;
        result.errors.push({ email, error: sendResult.error || 'Unknown error' });
        console.log(`  ❌ Failed: ${sendResult.error}`);
      }
    })
  );

  await Promise.all(tasks);

  // Log campaign summary
  await logAction(
    'email',
    'campaign_complete',
    result.failed === 0,
    undefined,
    templateId,
    { total: result.total, sent: result.sent, failed: result.failed }
  );

  return result;
}

/**
 * Run email outreach for pending contacts
 */
export async function runEmailOutreach(
  templateId: string,
  limit = 50
): Promise<CampaignResult> {
  console.log('📬 Starting email outreach campaign...');
  
  const contacts = await getPendingContacts('email', limit);
  console.log(`Found ${contacts.length} pending email contacts`);

  if (contacts.length === 0) {
    return { total: 0, sent: 0, failed: 0, errors: [] };
  }

  return sendCampaign(contacts, templateId);
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}

// Skill metadata for agent integration
export const emailSkillMetadata = {
  name: 'email_outreach',
  description: 'Send marketing emails to contacts for ProjectHunter.ai outreach',
  functions: [
    {
      name: 'sendEmail',
      description: 'Send a single email to a recipient',
      parameters: {
        to: 'Email address of recipient',
        subject: 'Email subject line',
        body: 'Email body content',
      },
    },
    {
      name: 'runEmailOutreach',
      description: 'Run email outreach campaign to pending contacts using a template',
      parameters: {
        templateId: 'UUID of the email template to use',
        limit: 'Maximum number of contacts to email (default: 50)',
      },
    },
    {
      name: 'verifyEmailConfig',
      description: 'Verify that email SMTP configuration is working',
      parameters: {},
    },
  ],
};
