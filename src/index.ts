/**
 * ClawBot - AI Marketing Outreach for ProjectHunter.ai
 * 
 * A multi-platform marketing automation bot that handles:
 * - Email campaigns via SMTP/Nodemailer
 * - LinkedIn posts and messages
 * - Reddit posts, comments, and DMs
 * 
 * Powered by Supabase for data storage and OpenAI for intelligent automation.
 */

export * from './config/index.js';
export * from './db/repository.js';
export * from './db/types.js';
export * from './skills/email/index.js';
export * from './skills/linkedin/index.js';
export * from './skills/reddit/index.js';
export * from './agent/orchestrator.js';

import { runAgent } from './agent/orchestrator.js';

// Default export for programmatic usage
export default {
  runAgent,
};

// If run directly, show help
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`
🦀 ClawBot - AI Marketing Outreach for ProjectHunter.ai

Usage:
  npm run agent -- "Your task here"
  
Examples:
  npm run agent -- "Run email outreach to pending contacts"
  npm run agent -- "Post a LinkedIn update about our new AI marketplace"
  npm run agent -- "Check outreach stats"

For CLI commands:
  npx tsx src/cli.ts --help
`);
}
