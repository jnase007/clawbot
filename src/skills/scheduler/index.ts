import { getSupabaseClient } from '../../db/supabase.js';
import { logAction } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';

const supabase = () => getSupabaseClient();

// Optimal posting times by platform (hour in UTC)
const OPTIMAL_TIMES: Record<string, { days: number[]; hours: number[] }> = {
  linkedin: {
    days: [1, 2, 3, 4], // Mon-Thu
    hours: [7, 8, 12, 17, 18], // Morning, lunch, evening
  },
  twitter: {
    days: [1, 2, 3, 4, 5], // Mon-Fri
    hours: [9, 12, 15, 17, 21], // Spread through day
  },
  reddit: {
    days: [0, 1, 2, 3, 4, 5, 6], // Any day
    hours: [6, 7, 8, 14, 15], // Early morning, afternoon
  },
  email: {
    days: [1, 2, 3, 4], // Mon-Thu
    hours: [9, 10, 14, 15], // Business hours
  },
};

interface ScheduledTask {
  id: string;
  type: 'campaign' | 'post' | 'engagement';
  platform: Platform | 'twitter';
  scheduledFor: Date;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

/**
 * Get the next optimal posting time for a platform
 */
export function getNextOptimalTime(platform: string): Date {
  const config = OPTIMAL_TIMES[platform] || OPTIMAL_TIMES.email;
  const now = new Date();
  
  // Find next optimal slot
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayOfWeek = checkDate.getDay();
    
    if (config.days.includes(dayOfWeek)) {
      for (const hour of config.hours) {
        const slotTime = new Date(checkDate);
        slotTime.setHours(hour, 0, 0, 0);
        
        if (slotTime > now) {
          return slotTime;
        }
      }
    }
  }
  
  // Fallback: tomorrow at first optimal hour
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(config.hours[0], 0, 0, 0);
  return tomorrow;
}

/**
 * Calculate optimal times for a week
 */
export function getWeeklySchedule(platform: string): Date[] {
  const config = OPTIMAL_TIMES[platform] || OPTIMAL_TIMES.email;
  const now = new Date();
  const schedule: Date[] = [];
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayOfWeek = checkDate.getDay();
    
    if (config.days.includes(dayOfWeek)) {
      // Pick 1-2 optimal times per day
      const selectedHours = config.hours.slice(0, 2);
      for (const hour of selectedHours) {
        const slotTime = new Date(checkDate);
        slotTime.setHours(hour, 0, 0, 0);
        if (slotTime > now) {
          schedule.push(slotTime);
        }
      }
    }
  }
  
  return schedule;
}

/**
 * Schedule a task for later execution
 */
export async function scheduleTask(task: Omit<ScheduledTask, 'id' | 'status'>): Promise<string> {
  const { data, error } = await supabase()
    .from('scheduled_tasks')
    .insert({
      type: task.type,
      platform: task.platform,
      scheduled_for: task.scheduledFor.toISOString(),
      payload: task.payload,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.log('Scheduled tasks table not found, logging instead');
    await logAction(
      task.platform as Platform,
      'schedule_task',
      true,
      undefined,
      undefined,
      { 
        scheduledFor: task.scheduledFor.toISOString(),
        type: task.type,
        payload: task.payload,
      }
    );
    return 'logged';
  }

  return data.id;
}

/**
 * Get pending scheduled tasks
 */
export async function getPendingTasks(): Promise<ScheduledTask[]> {
  const { data, error } = await supabase()
    .from('scheduled_tasks')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) {
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    type: t.type,
    platform: t.platform,
    scheduledFor: new Date(t.scheduled_for),
    payload: t.payload,
    status: t.status,
  }));
}

/**
 * Schedule a campaign for optimal times
 */
export async function scheduleCampaign(options: {
  platform: Platform | 'twitter';
  templateId: string;
  contactCount: number;
  spreadOverDays?: number;
}): Promise<{ taskIds: string[]; schedule: Date[] }> {
  const { platform, templateId, contactCount, spreadOverDays = 7 } = options;
  
  // Get weekly schedule
  const schedule = getWeeklySchedule(platform).slice(0, spreadOverDays * 2);
  
  // Distribute contacts across time slots
  const contactsPerSlot = Math.ceil(contactCount / schedule.length);
  const taskIds: string[] = [];
  
  for (let i = 0; i < schedule.length; i++) {
    const taskId = await scheduleTask({
      type: 'campaign',
      platform,
      scheduledFor: schedule[i],
      payload: {
        templateId,
        batchIndex: i,
        batchSize: contactsPerSlot,
        offset: i * contactsPerSlot,
      },
    });
    taskIds.push(taskId);
  }

  console.log(`📅 Scheduled ${taskIds.length} campaign batches across ${spreadOverDays} days`);

  return { taskIds, schedule };
}

/**
 * Schedule recurring post (e.g., "Bounty of the Week")
 */
export async function scheduleRecurringPost(options: {
  platform: Platform | 'twitter';
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  hour?: number;
}): Promise<string[]> {
  const { platform, templateId, frequency, dayOfWeek = 1, hour = 10 } = options;
  
  const taskIds: string[] = [];
  const now = new Date();
  
  // Schedule next 4 occurrences
  for (let i = 0; i < 4; i++) {
    const scheduledFor = new Date(now);
    
    switch (frequency) {
      case 'daily':
        scheduledFor.setDate(scheduledFor.getDate() + i);
        break;
      case 'weekly':
        scheduledFor.setDate(scheduledFor.getDate() + (i * 7));
        // Adjust to target day of week
        const currentDay = scheduledFor.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7;
        scheduledFor.setDate(scheduledFor.getDate() + daysUntil);
        break;
      case 'monthly':
        scheduledFor.setMonth(scheduledFor.getMonth() + i);
        break;
    }
    
    scheduledFor.setHours(hour, 0, 0, 0);
    
    if (scheduledFor > now) {
      const taskId = await scheduleTask({
        type: 'post',
        platform,
        scheduledFor,
        payload: { templateId, recurring: true, frequency },
      });
      taskIds.push(taskId);
    }
  }

  return taskIds;
}

// Skill metadata
export const schedulerSkillMetadata = {
  name: 'scheduler',
  description: 'Smart scheduling for optimal posting times',
  functions: [
    {
      name: 'getNextOptimalTime',
      description: 'Get next optimal posting time for a platform',
      parameters: { platform: 'Target platform' },
    },
    {
      name: 'scheduleCampaign',
      description: 'Schedule a campaign across optimal time slots',
      parameters: {
        platform: 'Target platform',
        templateId: 'Template to use',
        contactCount: 'Number of contacts',
        spreadOverDays: 'Days to spread over',
      },
    },
    {
      name: 'scheduleRecurringPost',
      description: 'Schedule recurring posts (e.g., weekly)',
      parameters: {
        platform: 'Target platform',
        templateId: 'Template to use',
        frequency: 'daily, weekly, or monthly',
      },
    },
  ],
};
