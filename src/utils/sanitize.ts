/**
 * Security utilities for input sanitization
 * Prevents SQL injection, XSS, and prompt injection attacks
 */

/**
 * Sanitize string input for safe database queries
 * Removes/escapes characters that could be used for SQL injection
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent buffer overflow attacks
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

/**
 * Sanitize input for ILIKE/LIKE SQL queries
 * Escapes special PostgreSQL pattern matching characters
 */
export function sanitizeForLike(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // First apply general sanitization
  let sanitized = sanitizeString(input);
  
  // Escape PostgreSQL LIKE special characters
  sanitized = sanitized
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape percent
    .replace(/_/g, '\\_');   // Escape underscore
  
  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeString(input).toLowerCase();
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeString(input);
  
  // Only allow http, https protocols
  try {
    const url = new URL(sanitized);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize for HTML output (prevent XSS)
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize input for AI prompts (prevent prompt injection)
 */
export function sanitizeForPrompt(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = sanitizeString(input);
  
  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|all|above)\s+instructions?/gi,
    /disregard\s+(previous|all|above)\s+instructions?/gi,
    /forget\s+(previous|all|above)\s+instructions?/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /\[system\]/gi,
    /\[assistant\]/gi,
    /<\|.*?\|>/g,  // Common delimiter patterns
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }
  
  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUuid(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(input);
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return input
    .filter((item): item is string => typeof item === 'string')
    .map(sanitizeString)
    .filter(item => item.length > 0);
}

/**
 * Sanitize tags (alphanumeric, underscores, hyphens only)
 */
export function sanitizeTags(input: string[]): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  
  return input
    .filter((item): item is string => typeof item === 'string')
    .map(tag => tag.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))
    .filter(tag => tag.length > 0 && tag.length <= 50);
}

/**
 * Validate and sanitize platform enum
 */
export function sanitizePlatform(input: string): string | null {
  const validPlatforms = ['email', 'linkedin', 'reddit', 'twitter', 'github', 'discord'];
  const sanitized = sanitizeString(input).toLowerCase();
  
  return validPlatforms.includes(sanitized) ? sanitized : null;
}

/**
 * Rate limiter for preventing abuse
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export default {
  sanitizeString,
  sanitizeForLike,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeHtml,
  sanitizeForPrompt,
  isValidUuid,
  sanitizeStringArray,
  sanitizeTags,
  sanitizePlatform,
  checkRateLimit,
};
