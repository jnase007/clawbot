import { getSupabaseClient } from '../../db/supabase.js';
import { logAction, getTemplate, updateContactStatus } from '../../db/repository.js';
import { sendTemplatedEmail } from '../email/index.js';
import type { OutreachContact, Platform } from '../../db/types.js';

const supabase = () => getSupabaseClient();

interface DripStep {
  delay: number; // hours after previous step
  templateId: string;
  condition?: 'no_reply' | 'no_open' | 'always';
}

interface DripSequence {
  id: string;
  name: string;
  platform: Platform;
  steps: DripStep[];
  isActive: boolean;
}

interface ContactInSequence {
  contactId: string;
  sequenceId: string;
  currentStep: number;
  startedAt: Date;
  lastStepAt: Date;
  status: 'active' | 'completed' | 'paused' | 'unsubscribed';
}

// Default sequences for ProjectHunter.ai
const DEFAULT_SEQUENCES: Omit<DripSequence, 'id'>[] = [
  {
    name: 'Developer Onboarding',
    platform: 'email',
    steps: [
      { delay: 0, templateId: 'welcome', condition: 'always' },
      { delay: 48, templateId: 'case-study', condition: 'no_reply' },
      { delay: 96, templateId: 'first-bounty', condition: 'no_reply' },
      { delay: 168, templateId: 'success-story', condition: 'no_reply' },
    ],
    isActive: true,
  },
  {
    name: 'Lead Nurture',
    platform: 'email',
    steps: [
      { delay: 0, templateId: 'intro', condition: 'always' },
      { delay: 72, templateId: 'value-prop', condition: 'no_reply' },
      { delay: 144, templateId: 'social-proof', condition: 'no_reply' },
      { delay: 240, templateId: 'final-cta', condition: 'no_reply' },
    ],
    isActive: true,
  },
];

/**
 * Create a new drip sequence
 */
export async function createSequence(
  sequence: Omit<DripSequence, 'id'>
): Promise<string> {
  const { data, error } = await supabase()
    .from('drip_sequences')
    .insert({
      name: sequence.name,
      platform: sequence.platform,
      steps: sequence.steps,
      is_active: sequence.isActive,
    })
    .select('id')
    .single();

  if (error) {
    console.log('Drip sequences table not found, returning mock ID');
    return `seq_${Date.now()}`;
  }

  return data.id;
}

/**
 * Add a contact to a drip sequence
 */
export async function addToSequence(
  contactId: string,
  sequenceId: string
): Promise<void> {
  const { error } = await supabase()
    .from('contacts_in_sequences')
    .upsert({
      contact_id: contactId,
      sequence_id: sequenceId,
      current_step: 0,
      started_at: new Date().toISOString(),
      last_step_at: new Date().toISOString(),
      status: 'active',
    });

  if (error) {
    console.log('Contacts in sequences table not found');
  }

  await logAction(
    'email',
    'add_to_sequence',
    true,
    contactId,
    undefined,
    { sequenceId }
  );
}

/**
 * Process pending drip steps
 */
export async function processDripSteps(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  console.log('📧 Processing drip sequence steps...');

  const result = { processed: 0, sent: 0, errors: 0 };

  // Get active contacts in sequences
  const { data: activeContacts, error: contactsError } = await supabase()
    .from('contacts_in_sequences')
    .select(`
      *,
      sequence:drip_sequences(*),
      contact:outreach_contacts(*)
    `)
    .eq('status', 'active');

  if (contactsError || !activeContacts) {
    console.log('No drip tables configured, skipping');
    return result;
  }

  const now = new Date();

  for (const record of activeContacts) {
    result.processed++;

    const sequence = record.sequence as DripSequence;
    const contact = record.contact as OutreachContact;
    const currentStep = record.current_step;
    const lastStepAt = new Date(record.last_step_at);

    // Check if there's a next step
    if (currentStep >= sequence.steps.length) {
      // Sequence completed
      await supabase()
        .from('contacts_in_sequences')
        .update({ status: 'completed' })
        .eq('id', record.id);
      continue;
    }

    const step = sequence.steps[currentStep];
    const hoursElapsed = (now.getTime() - lastStepAt.getTime()) / (1000 * 60 * 60);

    // Check if delay has passed
    if (hoursElapsed < step.delay) {
      continue;
    }

    // Check condition
    if (step.condition === 'no_reply') {
      // Check if contact has replied
      const { count } = await supabase()
        .from('outreach_logs')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', contact.id)
        .eq('action', 'reply_received');

      if (count && count > 0) {
        // Contact replied, complete sequence
        await supabase()
          .from('contacts_in_sequences')
          .update({ status: 'completed' })
          .eq('id', record.id);
        continue;
      }
    }

    // Get template and send
    const template = await getTemplate(step.templateId);
    if (!template) {
      console.log(`Template ${step.templateId} not found, skipping`);
      result.errors++;
      continue;
    }

    const sendResult = await sendTemplatedEmail(contact, template);

    if (sendResult.success) {
      result.sent++;
      
      // Update to next step
      await supabase()
        .from('contacts_in_sequences')
        .update({
          current_step: currentStep + 1,
          last_step_at: now.toISOString(),
        })
        .eq('id', record.id);

      await logAction(
        'email',
        'drip_step_sent',
        true,
        contact.id,
        step.templateId,
        { sequenceId: sequence.id, step: currentStep }
      );
    } else {
      result.errors++;
    }
  }

  console.log(`✅ Drip processing complete: ${result.sent} sent, ${result.errors} errors`);
  return result;
}

/**
 * Pause a contact in a sequence
 */
export async function pauseInSequence(contactId: string): Promise<void> {
  await supabase()
    .from('contacts_in_sequences')
    .update({ status: 'paused' })
    .eq('contact_id', contactId)
    .eq('status', 'active');
}

/**
 * Resume a paused contact
 */
export async function resumeInSequence(contactId: string): Promise<void> {
  await supabase()
    .from('contacts_in_sequences')
    .update({ status: 'active' })
    .eq('contact_id', contactId)
    .eq('status', 'paused');
}

/**
 * Get sequence analytics
 */
export async function getSequenceAnalytics(sequenceId: string): Promise<{
  totalEnrolled: number;
  active: number;
  completed: number;
  unsubscribed: number;
  stepStats: Array<{ step: number; sent: number; opened: number; replied: number }>;
}> {
  const { data: contacts } = await supabase()
    .from('contacts_in_sequences')
    .select('*')
    .eq('sequence_id', sequenceId);

  const analytics = {
    totalEnrolled: contacts?.length || 0,
    active: contacts?.filter(c => c.status === 'active').length || 0,
    completed: contacts?.filter(c => c.status === 'completed').length || 0,
    unsubscribed: contacts?.filter(c => c.status === 'unsubscribed').length || 0,
    stepStats: [],
  };

  return analytics;
}

// Skill metadata
export const dripSequencesSkillMetadata = {
  name: 'drip_sequences',
  description: 'Automated email drip sequences for lead nurturing',
  functions: [
    {
      name: 'createSequence',
      description: 'Create a new drip sequence',
      parameters: {
        name: 'Sequence name',
        platform: 'Platform (email)',
        steps: 'Array of steps with delays and templates',
      },
    },
    {
      name: 'addToSequence',
      description: 'Add a contact to a drip sequence',
      parameters: {
        contactId: 'Contact ID',
        sequenceId: 'Sequence ID',
      },
    },
    {
      name: 'processDripSteps',
      description: 'Process all pending drip steps',
      parameters: {},
    },
  ],
};
