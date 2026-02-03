import puppeteer, { Browser, Page } from 'puppeteer';
import Handlebars from 'handlebars';
import PQueue from 'p-queue';
import { config } from '../../config/index.js';
import { getTemplate, logAction, updateContactStatus, getPendingContacts } from '../../db/repository.js';
import type { OutreachContact, Template } from '../../db/types.js';

let browser: Browser | null = null;
let page: Page | null = null;
let dailyMessageCount = 0;
let lastResetDate = new Date().toDateString();

/**
 * Reset daily counter if it's a new day
 */
function checkDailyReset(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyMessageCount = 0;
    lastResetDate = today;
  }
}

/**
 * Check if we've hit the daily limit
 */
function canSendMessage(): boolean {
  checkDailyReset();
  return dailyMessageCount < config.LINKEDIN_DAILY_LIMIT;
}

/**
 * Compile a template with variables
 */
function compileTemplate(template: string, variables: Record<string, string>): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

// ============ LINKEDIN API (if available) ============

interface LinkedInAPIResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Post an update via LinkedIn API
 */
export async function postUpdateAPI(content: string): Promise<LinkedInAPIResult> {
  if (!config.LINKEDIN_ACCESS_TOKEN) {
    return { success: false, error: 'LinkedIn API token not configured' };
  }

  try {
    // LinkedIn API v2 - Share endpoint
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: 'urn:li:person:me', // Will need actual URN
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `API error: ${response.status} - ${error}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown API error' 
    };
  }
}

// ============ BROWSER AUTOMATION ============

/**
 * Initialize browser for LinkedIn automation
 */
async function initBrowser(): Promise<Page> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      userDataDir: './user_data/linkedin', // Persist session
    });
  }

  if (!page || page.isClosed()) {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
  }

  return page;
}

/**
 * Check if logged into LinkedIn
 */
async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2', timeout: 30000 });
    const url = page.url();
    return !url.includes('login') && !url.includes('authwall');
  } catch {
    return false;
  }
}

/**
 * Login to LinkedIn via browser
 */
async function loginLinkedIn(page: Page): Promise<boolean> {
  if (!config.LINKEDIN_EMAIL || !config.LINKEDIN_PASSWORD) {
    console.error('LinkedIn credentials not configured');
    return false;
  }

  try {
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
    
    // Enter credentials
    await page.type('#username', config.LINKEDIN_EMAIL, { delay: 50 });
    await page.type('#password', config.LINKEDIN_PASSWORD, { delay: 50 });
    
    // Click sign in
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if login successful
    const url = page.url();
    if (url.includes('checkpoint') || url.includes('challenge')) {
      console.error('LinkedIn security checkpoint detected - manual intervention required');
      return false;
    }
    
    return !url.includes('login');
  } catch (error) {
    console.error('LinkedIn login error:', error);
    return false;
  }
}

/**
 * Ensure we're logged into LinkedIn
 */
async function ensureLoggedIn(): Promise<Page | null> {
  const page = await initBrowser();
  
  if (await isLoggedIn(page)) {
    return page;
  }
  
  console.log('🔐 Logging into LinkedIn...');
  const success = await loginLinkedIn(page);
  
  if (!success) {
    console.error('❌ Failed to login to LinkedIn');
    return null;
  }
  
  console.log('✅ LinkedIn login successful');
  return page;
}

interface LinkedInResult {
  success: boolean;
  error?: string;
}

/**
 * Post an update via browser automation
 */
export async function postUpdateBrowser(content: string): Promise<LinkedInResult> {
  const page = await ensureLoggedIn();
  if (!page) {
    return { success: false, error: 'Not logged in' };
  }

  try {
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
    
    // Click "Start a post"
    await page.click('button.share-box-feed-entry__trigger');
    await page.waitForSelector('div.ql-editor[data-placeholder]', { timeout: 5000 });
    
    // Type the content
    await page.type('div.ql-editor', content, { delay: 20 });
    
    // Wait a moment, then post
    await new Promise(r => setTimeout(r, 1000));
    await page.click('button.share-actions__primary-action');
    
    // Wait for post to complete
    await new Promise(r => setTimeout(r, 3000));
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send a connection request with note
 */
export async function sendConnectionRequest(
  profileUrl: string,
  note: string
): Promise<LinkedInResult> {
  if (!canSendMessage()) {
    return { success: false, error: 'Daily limit reached' };
  }

  const page = await ensureLoggedIn();
  if (!page) {
    return { success: false, error: 'Not logged in' };
  }

  try {
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    
    // Look for Connect button
    const connectButton = await page.$('button[aria-label*="Connect"]');
    if (!connectButton) {
      return { success: false, error: 'Connect button not found - may already be connected' };
    }
    
    await connectButton.click();
    await page.waitForSelector('button[aria-label="Add a note"]', { timeout: 5000 });
    
    // Add note
    await page.click('button[aria-label="Add a note"]');
    await page.waitForSelector('textarea[name="message"]', { timeout: 5000 });
    await page.type('textarea[name="message"]', note.substring(0, 300), { delay: 20 }); // 300 char limit
    
    // Send
    await page.click('button[aria-label="Send now"]');
    await new Promise(r => setTimeout(r, 2000));
    
    dailyMessageCount++;
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send a direct message to a connection
 */
export async function sendDirectMessage(
  profileUrl: string,
  message: string
): Promise<LinkedInResult> {
  if (!canSendMessage()) {
    return { success: false, error: 'Daily limit reached' };
  }

  const page = await ensureLoggedIn();
  if (!page) {
    return { success: false, error: 'Not logged in' };
  }

  try {
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    
    // Look for Message button
    const messageButton = await page.$('button[aria-label*="Message"]');
    if (!messageButton) {
      return { success: false, error: 'Message button not found - may not be connected' };
    }
    
    await messageButton.click();
    await page.waitForSelector('div.msg-form__contenteditable', { timeout: 5000 });
    
    // Type message
    await page.type('div.msg-form__contenteditable', message, { delay: 20 });
    
    // Send
    await page.click('button.msg-form__send-button');
    await new Promise(r => setTimeout(r, 2000));
    
    dailyMessageCount++;
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Post an update (tries API first, falls back to browser)
 */
export async function postUpdate(content: string): Promise<LinkedInResult> {
  // Try API first if configured
  if (config.LINKEDIN_ACCESS_TOKEN) {
    console.log('📝 Posting via LinkedIn API...');
    const apiResult = await postUpdateAPI(content);
    
    if (apiResult.success) {
      await logAction('linkedin', 'post_update', true, undefined, undefined, { 
        method: 'api',
        contentLength: content.length 
      });
      return { success: true };
    }
    
    console.log('API failed, falling back to browser automation...');
  }
  
  // Fall back to browser
  console.log('📝 Posting via browser automation...');
  const result = await postUpdateBrowser(content);
  
  await logAction('linkedin', 'post_update', result.success, undefined, undefined, {
    method: 'browser',
    contentLength: content.length,
  }, undefined, result.error);
  
  return result;
}

interface CampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ handle: string; error: string }>;
}

/**
 * Run LinkedIn outreach campaign
 */
export async function runLinkedInOutreach(
  templateId: string,
  limit = 20
): Promise<CampaignResult> {
  console.log('💼 Starting LinkedIn outreach campaign...');
  
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const contacts = await getPendingContacts('linkedin', limit);
  console.log(`Found ${contacts.length} pending LinkedIn contacts`);

  const queue = new PQueue({
    concurrency: 1,
    interval: 30000, // 1 message per 30 seconds for safety
    intervalCap: 1,
  });

  const result: CampaignResult = {
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const contact of contacts) {
    if (!canSendMessage()) {
      console.log('⚠️ Daily limit reached, stopping campaign');
      break;
    }

    await queue.add(async () => {
      const profileUrl = contact.handle.startsWith('http') 
        ? contact.handle 
        : `https://www.linkedin.com/in/${contact.handle}`;

      const variables: Record<string, string> = {
        name: contact.name || 'there',
        field: (contact.notes as Record<string, string>)?.field || 'tech',
      };

      const message = compileTemplate(template.content, variables);
      console.log(`💬 Messaging ${contact.name || contact.handle}...`);

      const sendResult = await sendDirectMessage(profileUrl, message);

      if (sendResult.success) {
        result.sent++;
        await updateContactStatus(contact.id, 'sent');
        await logAction('linkedin', 'send_message', true, contact.id, templateId);
        console.log(`  ✅ Sent (${result.sent}/${result.total})`);
      } else {
        result.failed++;
        result.errors.push({ handle: contact.handle, error: sendResult.error || 'Unknown error' });
        await logAction('linkedin', 'send_message', false, contact.id, templateId, undefined, undefined, sendResult.error);
        console.log(`  ❌ Failed: ${sendResult.error}`);
      }
    });
  }

  await queue.onIdle();
  return result;
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

// Skill metadata
export const linkedinSkillMetadata = {
  name: 'linkedin_outreach',
  description: 'Handle LinkedIn marketing: post updates and send messages for ProjectHunter.ai',
  functions: [
    {
      name: 'postUpdate',
      description: 'Post a status update on LinkedIn',
      parameters: {
        content: 'The post content (max 3000 characters)',
      },
    },
    {
      name: 'sendDirectMessage',
      description: 'Send a direct message to a LinkedIn connection',
      parameters: {
        profileUrl: 'LinkedIn profile URL of the recipient',
        message: 'The message to send',
      },
    },
    {
      name: 'runLinkedInOutreach',
      description: 'Run outreach campaign to pending LinkedIn contacts',
      parameters: {
        templateId: 'UUID of the template to use',
        limit: 'Maximum contacts to message (default: 20)',
      },
    },
  ],
};
