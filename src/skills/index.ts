/**
 * ClawBot Skills Index
 * 
 * All outreach skills exported from one place for easy importing.
 */

// Core platform skills
export * from './email/index.js';
export * from './linkedin/index.js';
export * from './reddit/index.js';
export * from './twitter/index.js';

// Advanced skills
export * from './multi_poster/index.js';
export * from './engagement/index.js';
export * from './github_community/index.js';

// Skill metadata for agent
export { emailSkillMetadata } from './email/index.js';
export { linkedinSkillMetadata } from './linkedin/index.js';
export { redditSkillMetadata } from './reddit/index.js';
export { twitterSkillMetadata } from './twitter/index.js';
export { multiPosterSkillMetadata } from './multi_poster/index.js';
export { engagementSkillMetadata } from './engagement/index.js';
export { githubCommunitySkillMetadata } from './github_community/index.js';
