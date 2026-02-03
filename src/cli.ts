#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runAgent, executeCommand } from './agent/orchestrator.js';
import { 
  addContact, 
  getTemplatesByPlatform, 
  createTemplate,
  getOutreachStats,
  getRecentLogs,
  searchContacts 
} from './db/repository.js';
import { verifyEmailConfig, runEmailOutreach } from './skills/email/index.js';
import { runLinkedInOutreach, postUpdate as linkedinPost } from './skills/linkedin/index.js';
import { 
  runRedditPostCampaign, 
  runRedditMessageOutreach,
  verifyRedditConfig 
} from './skills/reddit/index.js';
import type { Platform, TemplateType } from './db/types.js';

const program = new Command();

program
  .name('clawbot')
  .description('🦀 ClawBot - AI Marketing Outreach for ProjectHunter.ai')
  .version('1.0.0');

// ============ AGENT COMMAND ============

program
  .command('agent')
  .description('Run the AI agent with a natural language message')
  .argument('<message>', 'Task for the agent to execute')
  .action(async (message: string) => {
    console.log(chalk.cyan('\n🦀 ClawBot Agent\n'));
    try {
      const result = await runAgent(message);
      console.log(chalk.green('\n📋 Result:\n'));
      console.log(result);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// ============ EMAIL COMMANDS ============

const email = program.command('email').description('Email outreach commands');

email
  .command('verify')
  .description('Verify email SMTP configuration')
  .action(async () => {
    const ok = await verifyEmailConfig();
    process.exit(ok ? 0 : 1);
  });

email
  .command('campaign')
  .description('Run email outreach campaign')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .option('-l, --limit <number>', 'Max contacts', '50')
  .action(async (options) => {
    console.log(chalk.cyan('\n📧 Starting Email Campaign\n'));
    const result = await runEmailOutreach(options.template, parseInt(options.limit));
    console.log(chalk.green('\n✅ Campaign Complete'));
    console.log(`   Sent: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);
  });

// ============ LINKEDIN COMMANDS ============

const linkedin = program.command('linkedin').description('LinkedIn outreach commands');

linkedin
  .command('post')
  .description('Post an update on LinkedIn')
  .argument('<content>', 'Post content')
  .action(async (content: string) => {
    console.log(chalk.cyan('\n💼 Posting to LinkedIn\n'));
    const result = await linkedinPost(content);
    if (result.success) {
      console.log(chalk.green('✅ Posted successfully'));
    } else {
      console.error(chalk.red('❌ Failed:'), result.error);
    }
  });

linkedin
  .command('campaign')
  .description('Run LinkedIn message campaign')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .option('-l, --limit <number>', 'Max contacts', '20')
  .action(async (options) => {
    console.log(chalk.cyan('\n💼 Starting LinkedIn Campaign\n'));
    const result = await runLinkedInOutreach(options.template, parseInt(options.limit));
    console.log(chalk.green('\n✅ Campaign Complete'));
    console.log(`   Sent: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);
  });

// ============ REDDIT COMMANDS ============

const reddit = program.command('reddit').description('Reddit outreach commands');

reddit
  .command('verify')
  .description('Verify Reddit API configuration')
  .action(async () => {
    const ok = await verifyRedditConfig();
    process.exit(ok ? 0 : 1);
  });

reddit
  .command('post-campaign')
  .description('Post to multiple subreddits')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .requiredOption('-s, --subreddits <list>', 'Comma-separated subreddit names')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔴 Starting Reddit Post Campaign\n'));
    const subreddits = options.subreddits.split(',').map((s: string) => s.trim());
    const result = await runRedditPostCampaign(options.template, subreddits);
    console.log(chalk.green('\n✅ Campaign Complete'));
    console.log(`   Posted: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);
  });

reddit
  .command('message-campaign')
  .description('Send Reddit DMs to pending contacts')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .option('-l, --limit <number>', 'Max messages', '20')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔴 Starting Reddit Message Campaign\n'));
    const result = await runRedditMessageOutreach(options.template, parseInt(options.limit));
    console.log(chalk.green('\n✅ Campaign Complete'));
    console.log(`   Sent: ${result.sent}`);
    console.log(`   Failed: ${result.failed}`);
  });

// ============ CONTACTS COMMANDS ============

const contacts = program.command('contacts').description('Manage outreach contacts');

contacts
  .command('add')
  .description('Add a new contact')
  .requiredOption('-p, --platform <platform>', 'Platform (email, linkedin, reddit)')
  .requiredOption('-h, --handle <handle>', 'Email, profile URL, or username')
  .option('-n, --name <name>', 'Contact name')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
    const contact = await addContact(
      options.platform as Platform,
      options.handle,
      options.name,
      undefined,
      tags
    );
    console.log(chalk.green('✅ Contact added:'), contact.id);
  });

contacts
  .command('search')
  .description('Search contacts')
  .argument('<query>', 'Search query')
  .option('-p, --platform <platform>', 'Filter by platform')
  .action(async (query: string, options) => {
    const results = await searchContacts(query, options.platform);
    console.log(chalk.cyan(`\n📋 Found ${results.length} contacts:\n`));
    results.forEach((c) => {
      console.log(`  ${c.name || c.handle} (${c.platform}) - ${c.status}`);
    });
  });

// ============ TEMPLATES COMMANDS ============

const templates = program.command('templates').description('Manage message templates');

templates
  .command('list')
  .description('List templates for a platform')
  .requiredOption('-p, --platform <platform>', 'Platform (email, linkedin, reddit)')
  .action(async (options) => {
    const tpls = await getTemplatesByPlatform(options.platform as Platform);
    console.log(chalk.cyan(`\n📝 Templates for ${options.platform}:\n`));
    tpls.forEach((t) => {
      console.log(`  ${chalk.yellow(t.id)}`);
      console.log(`    Name: ${t.name}`);
      console.log(`    Type: ${t.type}`);
      console.log(`    Variables: ${t.variables.join(', ') || 'none'}`);
      console.log();
    });
  });

templates
  .command('create')
  .description('Create a new template')
  .requiredOption('-p, --platform <platform>', 'Platform (email, linkedin, reddit)')
  .requiredOption('-T, --type <type>', 'Type (email, message, post, comment)')
  .requiredOption('-n, --name <name>', 'Template name')
  .requiredOption('-c, --content <content>', 'Template content (use {{var}} for variables)')
  .option('-s, --subject <subject>', 'Subject line (for email)')
  .action(async (options) => {
    const template = await createTemplate(
      options.platform as Platform,
      options.type as TemplateType,
      options.name,
      options.content,
      options.subject
    );
    console.log(chalk.green('✅ Template created:'), template.id);
  });

// ============ STATS COMMAND ============

program
  .command('stats')
  .description('Show outreach statistics')
  .action(async () => {
    const stats = await getOutreachStats();
    console.log(chalk.cyan('\n📊 Outreach Statistics\n'));
    console.log(`  Total Contacts: ${stats.totalContacts}`);
    console.log(`  Recent Activity: ${stats.recentActivity} (last 7 days)`);
    console.log();
    console.log('  By Platform:');
    Object.entries(stats.byPlatform).forEach(([p, count]) => {
      console.log(`    ${p}: ${count}`);
    });
    console.log();
    console.log('  By Status:');
    Object.entries(stats.byStatus).forEach(([s, count]) => {
      if (count > 0) console.log(`    ${s}: ${count}`);
    });
  });

// ============ LOGS COMMAND ============

program
  .command('logs')
  .description('Show recent activity logs')
  .option('-l, --limit <number>', 'Number of logs', '20')
  .option('-p, --platform <platform>', 'Filter by platform')
  .action(async (options) => {
    const logs = await getRecentLogs(parseInt(options.limit), options.platform);
    console.log(chalk.cyan('\n📜 Recent Logs\n'));
    logs.forEach((log) => {
      const status = log.success ? chalk.green('✓') : chalk.red('✗');
      const time = new Date(log.created_at).toLocaleString();
      console.log(`  ${status} [${log.platform}] ${log.action} - ${time}`);
      if (log.error) console.log(`    ${chalk.red(log.error)}`);
    });
  });

// Parse and run
program.parse();
