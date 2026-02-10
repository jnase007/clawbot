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

// ============ ASCII ART & BRANDING ============

const LOGO = `
${chalk.green(`
 ██████╗██╗      █████╗ ██╗    ██╗██████╗  ██████╗ ████████╗
██╔════╝██║     ██╔══██╗██║    ██║██╔══██╗██╔═══██╗╚══██╔══╝
██║     ██║     ███████║██║ █╗ ██║██████╔╝██║   ██║   ██║   
██║     ██║     ██╔══██║██║███╗██║██╔══██╗██║   ██║   ██║   
╚██████╗███████╗██║  ██║╚███╔███╔╝██████╔╝╚██████╔╝   ██║   
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝  ╚═════╝    ╚═╝   
`)}
${chalk.gray('━'.repeat(65))}
${chalk.cyan('   🦀 AI-POWERED MARKETING OUTREACH FOR PROJECTHUNTER.AI')}
${chalk.gray('━'.repeat(65))}
`;

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private frameIndex = 0;
  private message: string;

  constructor(message: string) {
    this.message = message;
  }

  start() {
    this.interval = setInterval(() => {
      process.stdout.write(`\r${chalk.green(SPINNER_FRAMES[this.frameIndex])} ${chalk.cyan(this.message)}`);
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
    }, 80);
  }

  stop(success = true) {
    if (this.interval) {
      clearInterval(this.interval);
      const icon = success ? chalk.green('✓') : chalk.red('✗');
      console.log(`\r${icon} ${this.message}`);
    }
  }

  update(message: string) {
    this.message = message;
  }
}

function printHeader() {
  console.clear();
  console.log(LOGO);
}

function printSection(title: string) {
  console.log();
  console.log(chalk.gray('┌─') + chalk.cyan(` ${title} `) + chalk.gray('─'.repeat(50 - title.length)));
}

function printSuccess(message: string) {
  console.log(chalk.green('  ✓ ') + message);
}

function printError(message: string) {
  console.log(chalk.red('  ✗ ') + message);
}

function printInfo(label: string, value: string | number) {
  console.log(chalk.gray('  │ ') + chalk.cyan(label + ':') + ' ' + chalk.white(value));
}

function printTable(headers: string[], rows: string[][]) {
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => String(r[i] || '').length)) + 2
  );

  console.log();
  console.log(
    chalk.gray('  ') +
    headers.map((h, i) => chalk.cyan(h.padEnd(colWidths[i]))).join(chalk.gray(' │ '))
  );
  console.log(chalk.gray('  ' + '─'.repeat(colWidths.reduce((a, b) => a + b + 3, 0))));
  
  for (const row of rows) {
    console.log(
      chalk.gray('  ') +
      row.map((cell, i) => String(cell || '').padEnd(colWidths[i])).join(chalk.gray(' │ '))
    );
  }
}

// ============ PROGRAM SETUP ============

const program = new Command();

program
  .name('clawbot')
  .description('🦀 ClawBot - AI Marketing Outreach for ProjectHunter.ai')
  .version('2.0.0')
  .hook('preAction', () => {
    printHeader();
  });

// ============ AGENT COMMAND ============

program
  .command('agent')
  .description('Run the AI agent with a natural language message')
  .argument('<message>', 'Task for the agent to execute')
  .action(async (message: string) => {
    printSection('AI AGENT');
    
    const spinner = new Spinner('Initializing neural network...');
    spinner.start();
    
    try {
      await new Promise(r => setTimeout(r, 500));
      spinner.update('Processing your request...');
      
      const result = await runAgent(message);
      spinner.stop(true);
      
      console.log();
      console.log(chalk.gray('┌─') + chalk.green(' RESPONSE ') + chalk.gray('─'.repeat(50)));
      console.log(chalk.gray('│'));
      result.split('\n').forEach(line => {
        console.log(chalk.gray('│ ') + line);
      });
      console.log(chalk.gray('│'));
      console.log(chalk.gray('└' + '─'.repeat(60)));
    } catch (error) {
      spinner.stop(false);
      printError(`Agent error: ${error}`);
      process.exit(1);
    }
  });

// ============ STATUS COMMAND ============

program
  .command('status')
  .description('Show system status and statistics')
  .action(async () => {
    printSection('SYSTEM STATUS');
    
    const spinner = new Spinner('Fetching system data...');
    spinner.start();
    
    try {
      const stats = await getOutreachStats();
      spinner.stop(true);
      
      console.log();
      console.log(chalk.green('  ● SYSTEM ONLINE'));
      console.log();
      
      printInfo('Total Targets', stats.totalContacts);
      printInfo('Email Contacts', stats.byPlatform.email);
      printInfo('LinkedIn Contacts', stats.byPlatform.linkedin);
      printInfo('Reddit Contacts', stats.byPlatform.reddit);
      console.log();
      printInfo('Recent Activity', `${stats.recentActivity} (7 days)`);
      
      // Status breakdown
      console.log();
      console.log(chalk.gray('  │ ') + chalk.cyan('By Status:'));
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        if (count > 0) {
          const bar = '█'.repeat(Math.min(20, Math.ceil((count / stats.totalContacts) * 20)));
          console.log(chalk.gray('  │   ') + 
            chalk.white(status.padEnd(12)) + 
            chalk.green(bar) + 
            chalk.gray(` ${count}`)
          );
        }
      });
      
      console.log();
      console.log(chalk.gray('└' + '─'.repeat(60)));
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

// ============ EMAIL COMMANDS ============

const email = program.command('email').description('📧 Email outreach commands');

email
  .command('verify')
  .description('Verify email SMTP configuration')
  .action(async () => {
    printSection('EMAIL VERIFICATION');
    
    const spinner = new Spinner('Testing SMTP connection...');
    spinner.start();
    
    const ok = await verifyEmailConfig();
    spinner.stop(ok);
    
    if (ok) {
      printSuccess('Email configuration verified');
    } else {
      printError('Email configuration failed');
    }
    
    process.exit(ok ? 0 : 1);
  });

email
  .command('campaign')
  .description('Run email outreach campaign')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .option('-l, --limit <number>', 'Max contacts', '50')
  .action(async (options) => {
    printSection('EMAIL CAMPAIGN');
    
    const spinner = new Spinner('Launching campaign...');
    spinner.start();
    
    const result = await runEmailOutreach(options.template, parseInt(options.limit));
    spinner.stop(result.failed === 0);
    
    console.log();
    printInfo('Total', result.total);
    printInfo('Sent', chalk.green(String(result.sent)));
    printInfo('Failed', result.failed > 0 ? chalk.red(String(result.failed)) : '0');
    
    if (result.errors.length > 0) {
      console.log();
      console.log(chalk.red('  Errors:'));
      result.errors.slice(0, 5).forEach(err => {
        console.log(chalk.gray('    • ') + `${err.email}: ${err.error}`);
      });
    }
  });

// ============ LINKEDIN COMMANDS ============

const linkedin = program.command('linkedin').description('💼 LinkedIn outreach commands');

linkedin
  .command('post')
  .description('Post an update on LinkedIn')
  .argument('<content>', 'Post content')
  .action(async (content: string) => {
    printSection('LINKEDIN POST');
    
    const spinner = new Spinner('Publishing to LinkedIn...');
    spinner.start();
    
    const result = await linkedinPost(content);
    spinner.stop(result.success);
    
    if (result.success) {
      printSuccess('Posted successfully');
    } else {
      printError(`Failed: ${result.error}`);
    }
  });

linkedin
  .command('campaign')
  .description('Run LinkedIn message campaign')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .option('-l, --limit <number>', 'Max contacts', '20')
  .action(async (options) => {
    printSection('LINKEDIN CAMPAIGN');
    
    const spinner = new Spinner('Launching LinkedIn campaign...');
    spinner.start();
    
    const result = await runLinkedInOutreach(options.template, parseInt(options.limit));
    spinner.stop(result.failed === 0);
    
    console.log();
    printInfo('Sent', chalk.green(String(result.sent)));
    printInfo('Failed', result.failed > 0 ? chalk.red(String(result.failed)) : '0');
  });

// ============ REDDIT COMMANDS ============

const reddit = program.command('reddit').description('🔴 Reddit outreach commands');

reddit
  .command('verify')
  .description('Verify Reddit API configuration')
  .action(async () => {
    printSection('REDDIT VERIFICATION');
    
    const spinner = new Spinner('Testing Reddit API...');
    spinner.start();
    
    const ok = await verifyRedditConfig();
    spinner.stop(ok);
    
    process.exit(ok ? 0 : 1);
  });

reddit
  .command('post')
  .description('Post to subreddits')
  .requiredOption('-t, --template <id>', 'Template UUID')
  .requiredOption('-s, --subreddits <list>', 'Comma-separated subreddit names')
  .action(async (options) => {
    printSection('REDDIT CAMPAIGN');
    
    const subreddits = options.subreddits.split(',').map((s: string) => s.trim());
    
    const spinner = new Spinner(`Posting to ${subreddits.length} subreddits...`);
    spinner.start();
    
    const result = await runRedditPostCampaign(options.template, subreddits);
    spinner.stop(result.failed === 0);
    
    console.log();
    printInfo('Posted', chalk.green(String(result.sent)));
    printInfo('Failed', result.failed > 0 ? chalk.red(String(result.failed)) : '0');
  });

// ============ CONTACTS COMMANDS ============

const contacts = program.command('contacts').description('👥 Manage outreach contacts');

contacts
  .command('add')
  .description('Add a new contact')
  .requiredOption('-p, --platform <platform>', 'Platform (email, linkedin, reddit)')
  .requiredOption('-h, --handle <handle>', 'Email, profile URL, or username')
  .option('-n, --name <name>', 'Contact name')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    printSection('ADD CONTACT');
    
    const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
    
    const spinner = new Spinner('Adding contact...');
    spinner.start();
    
    const contact = await addContact(
      options.platform as Platform,
      options.handle,
      options.name,
      undefined,
      tags
    );
    
    spinner.stop(true);
    printSuccess(`Contact added: ${contact.id}`);
  });

contacts
  .command('search')
  .description('Search contacts')
  .argument('<query>', 'Search query')
  .option('-p, --platform <platform>', 'Filter by platform')
  .action(async (query: string, options) => {
    printSection('SEARCH RESULTS');
    
    const spinner = new Spinner('Searching...');
    spinner.start();
    
    const results = await searchContacts(query, options.platform);
    spinner.stop(true);
    
    if (results.length === 0) {
      printInfo('Results', 'No contacts found');
    } else {
      printTable(
        ['Name', 'Handle', 'Platform', 'Status'],
        results.slice(0, 10).map(c => [
          c.name || '-',
          c.handle,
          c.platform,
          c.status
        ])
      );
      
      if (results.length > 10) {
        console.log(chalk.gray(`  ... and ${results.length - 10} more`));
      }
    }
  });

// ============ TEMPLATES COMMANDS ============

const templates = program.command('templates').description('📝 Manage message templates');

templates
  .command('list')
  .description('List templates for a platform')
  .requiredOption('-p, --platform <platform>', 'Platform (email, linkedin, reddit)')
  .action(async (options) => {
    printSection('TEMPLATES');
    
    const spinner = new Spinner('Loading templates...');
    spinner.start();
    
    const tpls = await getTemplatesByPlatform(options.platform as Platform);
    spinner.stop(true);
    
    if (tpls.length === 0) {
      printInfo('Templates', 'None found');
    } else {
      tpls.forEach(t => {
        console.log();
        console.log(chalk.gray('  ┌─ ') + chalk.cyan(t.name));
        console.log(chalk.gray('  │  ') + chalk.yellow('ID: ') + t.id);
        console.log(chalk.gray('  │  ') + chalk.yellow('Type: ') + t.type);
        console.log(chalk.gray('  │  ') + chalk.yellow('Vars: ') + (t.variables.join(', ') || 'none'));
        console.log(chalk.gray('  └──'));
      });
    }
  });

// ============ AGENT BUILDER COMMANDS ============

const agentBuilder = program.command('build').description('🤖 Build AI agents');

agentBuilder
  .command('templates')
  .description('List available agent templates')
  .action(async () => {
    printSection('AGENT TEMPLATES');
    
    const { listTemplates } = await import('./skills/agent_builder/index.js');
    const templates = listTemplates();
    
    templates.forEach(t => {
      console.log();
      console.log(chalk.gray('  ┌─ ') + chalk.cyan(t.name));
      console.log(chalk.gray('  │  ') + t.description);
      console.log(chalk.gray('  └──'));
    });
  });

agentBuilder
  .command('create')
  .description('Generate an agent from a template')
  .requiredOption('-t, --template <name>', 'Template name')
  .requiredOption('-n, --name <name>', 'Agent name')
  .option('-o, --output <dir>', 'Output directory', './generated_agents')
  .action(async (options) => {
    printSection('GENERATE AGENT');
    
    const spinner = new Spinner('Generating agent architecture...');
    spinner.start();
    
    try {
      const { generateFromTemplate, saveAgent } = await import('./skills/agent_builder/index.js');
      
      spinner.update('Building system prompt...');
      await new Promise(r => setTimeout(r, 500));
      
      spinner.update('Generating tools...');
      const agent = await generateFromTemplate(options.template, { name: options.name });
      
      spinner.update('Writing files...');
      const dir = await saveAgent(agent, options.output);
      
      spinner.stop(true);
      
      console.log();
      printSuccess(`Agent generated: ${agent.name}`);
      printInfo('ID', agent.id);
      printInfo('Location', dir);
      printInfo('Tools', agent.tools.length.toString());
      
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

agentBuilder
  .command('from-bounty')
  .description('Generate an agent from a bounty description')
  .argument('<description>', 'Bounty description')
  .option('-o, --output <dir>', 'Output directory', './generated_agents')
  .action(async (description: string, options) => {
    printSection('GENERATE FROM BOUNTY');
    
    const spinner = new Spinner('Analyzing bounty requirements...');
    spinner.start();
    
    try {
      const { generateAgentFromBounty, saveAgent } = await import('./skills/agent_builder/index.js');
      
      spinner.update('Extracting capabilities...');
      await new Promise(r => setTimeout(r, 500));
      
      spinner.update('Generating agent code...');
      const agent = await generateAgentFromBounty(description);
      
      spinner.update('Writing files...');
      const dir = await saveAgent(agent, options.output);
      
      spinner.stop(true);
      
      console.log();
      printSuccess(`Agent generated: ${agent.name}`);
      printInfo('ID', agent.id);
      printInfo('Location', dir);
      printInfo('Tools', agent.tools.length.toString());
      
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

// ============ APOLLO COMMANDS ============

const apollo = program.command('apollo').description('🎯 Apollo.io lead generation');

apollo
  .command('search')
  .description('Search for leads')
  .requiredOption('-d, --domain <domain>', 'Company domain to search')
  .option('-t, --titles <titles>', 'Comma-separated job titles')
  .option('-s, --seniority <levels>', 'Seniority levels (c_suite,vp,director,manager)', 'c_suite,vp,director,manager')
  .option('-l, --limit <number>', 'Max results', '25')
  .action(async (options) => {
    printSection('APOLLO LEAD SEARCH');
    
    const spinner = new Spinner(`Searching for leads at ${options.domain}...`);
    spinner.start();
    
    try {
      const { searchByCompany } = await import('./skills/apollo/index.js');
      
      const titles = options.titles ? options.titles.split(',').map((t: string) => t.trim()) : undefined;
      const seniority = options.seniority.split(',').map((s: string) => s.trim());
      
      const leads = await searchByCompany([options.domain], {
        titles,
        seniorityLevels: seniority,
        limit: parseInt(options.limit),
      });
      
      spinner.stop(true);
      
      if (leads.length === 0) {
        printInfo('Results', 'No leads found');
      } else {
        printTable(
          ['Name', 'Title', 'Email', 'Company'],
          leads.slice(0, 15).map(l => [
            l.name || `${l.first_name} ${l.last_name}`,
            (l.title || '').substring(0, 25),
            l.email || '-',
            (l.organization_name || '').substring(0, 20),
          ])
        );
        
        if (leads.length > 15) {
          console.log(chalk.gray(`  ... and ${leads.length - 15} more`));
        }
        
        console.log();
        printInfo('Total Found', leads.length.toString());
      }
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

apollo
  .command('import')
  .description('Search and import leads to contacts')
  .requiredOption('-d, --domain <domain>', 'Company domain')
  .option('-t, --titles <titles>', 'Comma-separated job titles')
  .option('-s, --seniority <levels>', 'Seniority levels', 'c_suite,vp,director,manager')
  .option('-l, --limit <number>', 'Max leads to import', '50')
  .option('-p, --platform <platform>', 'Platform for contacts (email, linkedin)', 'email')
  .action(async (options) => {
    printSection('APOLLO IMPORT');
    
    const spinner = new Spinner(`Importing leads from ${options.domain}...`);
    spinner.start();
    
    try {
      const { quickImportFromCompany } = await import('./skills/apollo/index.js');
      
      const titles = options.titles ? options.titles.split(',').map((t: string) => t.trim()) : undefined;
      const seniority = options.seniority.split(',').map((s: string) => s.trim());
      
      const result = await quickImportFromCompany(options.domain, {
        titles,
        seniorityLevels: seniority,
        limit: parseInt(options.limit),
        platform: options.platform,
      });
      
      spinner.stop(true);
      
      console.log();
      printInfo('Leads Found', result.found.toString());
      printInfo('Imported', chalk.green(result.imported.toString()));
      
      if (result.leads.length > 0) {
        console.log();
        console.log(chalk.cyan('  Sample leads imported:'));
        result.leads.slice(0, 5).forEach(lead => {
          console.log(chalk.gray('    • ') + 
            chalk.white(lead.name || lead.email) + 
            chalk.gray(` - ${lead.title || 'No title'}`)
          );
        });
      }
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

apollo
  .command('enrich')
  .description('Enrich a contact with Apollo data')
  .argument('<email>', 'Email to enrich')
  .action(async (email: string) => {
    printSection('APOLLO ENRICH');
    
    const spinner = new Spinner(`Enriching ${email}...`);
    spinner.start();
    
    try {
      const { enrichContact } = await import('./skills/apollo/index.js');
      
      const contact = await enrichContact(email);
      spinner.stop(!!contact);
      
      if (contact) {
        console.log();
        printInfo('Name', contact.name || `${contact.first_name} ${contact.last_name}`);
        printInfo('Title', contact.title || '-');
        printInfo('Company', contact.organization_name || '-');
        printInfo('LinkedIn', contact.linkedin_url || '-');
        printInfo('Location', [contact.city, contact.state, contact.country].filter(Boolean).join(', ') || '-');
      } else {
        printError('No data found for this email');
      }
    } catch (error) {
      spinner.stop(false);
      printError(`Error: ${error}`);
    }
  });

// ============ LOGS COMMAND ============

program
  .command('logs')
  .description('📜 Show recent activity logs')
  .option('-l, --limit <number>', 'Number of logs', '20')
  .option('-p, --platform <platform>', 'Filter by platform')
  .action(async (options) => {
    printSection('ACTIVITY LOGS');
    
    const spinner = new Spinner('Fetching logs...');
    spinner.start();
    
    const logs = await getRecentLogs(parseInt(options.limit), options.platform);
    spinner.stop(true);
    
    if (logs.length === 0) {
      printInfo('Logs', 'No activity yet');
    } else {
      logs.forEach(log => {
        const icon = log.success ? chalk.green('✓') : chalk.red('✗');
        const platformIcons: Record<string, string> = {
          email: '📧',
          linkedin: '💼',
          reddit: '🔴',
          twitter: '𝕏',
          github: '🐙',
          discord: '💬',
        };
        const platform = platformIcons[log.platform] || '📌';
        
        const time = new Date(log.created_at).toLocaleTimeString();
        
        console.log(
          chalk.gray('  ') +
          icon + ' ' +
          platform + ' ' +
          chalk.white(log.action.padEnd(25)) +
          chalk.gray(time)
        );
        
        if (log.error) {
          console.log(chalk.gray('       ') + chalk.red(log.error));
        }
      });
    }
  });

// ============ PARSE & RUN ============

program.parse();

// Show help if no args
if (!process.argv.slice(2).length) {
  printHeader();
  console.log(chalk.cyan('  Usage:') + ' clawbot <command> [options]');
  console.log();
  console.log(chalk.cyan('  Quick Start:'));
  console.log(chalk.gray('    $ ') + 'clawbot agent "Run email outreach"');
  console.log(chalk.gray('    $ ') + 'clawbot status');
  console.log(chalk.gray('    $ ') + 'clawbot --help');
  console.log();
}
