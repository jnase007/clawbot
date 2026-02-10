import { config } from '../../config/index.js';
import { addContact } from '../../db/repository.js';
import { logAction } from '../../db/repository.js';
import type { Platform } from '../../db/types.js';

const APOLLO_API_BASE = 'https://api.apollo.io/v1';

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  title: string;
  linkedin_url: string;
  organization_name: string;
  organization?: {
    name: string;
    website_url: string;
    industry: string;
    estimated_num_employees: number;
  };
  city: string;
  state: string;
  country: string;
}

interface ApolloSearchResult {
  people: ApolloContact[];
  total_entries: number;
  page: number;
  per_page: number;
}

interface LeadSearchOptions {
  // Company filters
  companyDomains?: string[];
  companyNames?: string[];
  industries?: string[];
  employeeCountMin?: number;
  employeeCountMax?: number;
  
  // Person filters
  titles?: string[];
  seniorityLevels?: string[]; // 'c_suite', 'vp', 'director', 'manager', 'senior', 'entry'
  departments?: string[]; // 'marketing', 'sales', 'engineering', 'operations', 'finance', 'hr'
  
  // Location filters
  locations?: string[];
  countries?: string[];
  
  // Pagination
  page?: number;
  perPage?: number;
}

/**
 * Get Apollo API key
 */
function getApiKey(): string {
  if (!config.APOLLO_API_KEY) {
    throw new Error('Apollo API key not configured. Add APOLLO_API_KEY to your .env file.');
  }
  return config.APOLLO_API_KEY;
}

/**
 * Make authenticated request to Apollo API
 */
async function apolloRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${APOLLO_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Search for leads/contacts in Apollo
 */
export async function searchLeads(options: LeadSearchOptions): Promise<{
  leads: ApolloContact[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const {
    companyDomains,
    companyNames,
    industries,
    employeeCountMin,
    employeeCountMax,
    titles,
    seniorityLevels,
    departments,
    locations,
    countries,
    page = 1,
    perPage = 25,
  } = options;

  // Build the search query
  const searchBody: Record<string, unknown> = {
    page,
    per_page: perPage,
  };

  // Company filters
  if (companyDomains?.length) {
    searchBody.organization_domains = companyDomains;
  }
  if (companyNames?.length) {
    searchBody.organization_names = companyNames;
  }
  if (industries?.length) {
    searchBody.organization_industry_tag_ids = industries;
  }
  if (employeeCountMin || employeeCountMax) {
    searchBody.organization_num_employees_ranges = [
      `${employeeCountMin || 1},${employeeCountMax || 1000000}`
    ];
  }

  // Person filters
  if (titles?.length) {
    searchBody.person_titles = titles;
  }
  if (seniorityLevels?.length) {
    searchBody.person_seniorities = seniorityLevels;
  }
  if (departments?.length) {
    searchBody.person_departments = departments;
  }

  // Location filters
  if (locations?.length) {
    searchBody.person_locations = locations;
  }
  if (countries?.length) {
    searchBody.organization_locations = countries;
  }

  const result = await apolloRequest<ApolloSearchResult>('/mixed_people/api_search', 'POST', searchBody);

  const totalPages = Math.ceil((result.total_entries || 0) / perPage);

  await logAction(
    'email' as Platform,
    'apollo_search_leads',
    true,
    undefined,
    undefined,
    { 
      total: result.total_entries,
      page: result.page || page,
      filters: options 
    }
  );

  return {
    leads: result.people || [],
    total: result.total_entries || 0,
    page: result.page || page,
    totalPages,
  };
}

/**
 * Search for leads by company domain(s)
 */
export async function searchByCompany(
  domains: string[],
  options?: {
    titles?: string[];
    seniorityLevels?: string[];
    departments?: string[];
    limit?: number;
  }
): Promise<ApolloContact[]> {
  const result = await searchLeads({
    companyDomains: domains,
    titles: options?.titles,
    seniorityLevels: options?.seniorityLevels,
    departments: options?.departments,
    perPage: options?.limit || 25,
  });

  return result.leads;
}

/**
 * Search for leads by job title
 */
export async function searchByTitle(
  titles: string[],
  options?: {
    industries?: string[];
    employeeCountMin?: number;
    employeeCountMax?: number;
    locations?: string[];
    limit?: number;
  }
): Promise<ApolloContact[]> {
  const result = await searchLeads({
    titles,
    industries: options?.industries,
    employeeCountMin: options?.employeeCountMin,
    employeeCountMax: options?.employeeCountMax,
    locations: options?.locations,
    perPage: options?.limit || 25,
  });

  return result.leads;
}

/**
 * Import leads from Apollo into ClawBot contacts
 */
export async function importLeadsToContacts(
  leads: ApolloContact[],
  options?: {
    platform?: Platform;
    tags?: string[];
  }
): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const platform = options?.platform || 'email';
  const baseTags = options?.tags || ['apollo', 'lead'];
  
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      // Determine handle based on platform
      let handle: string;
      if (platform === 'linkedin' && lead.linkedin_url) {
        handle = lead.linkedin_url;
      } else if (platform === 'email' && lead.email) {
        handle = lead.email;
      } else if (lead.email) {
        handle = lead.email;
      } else if (lead.linkedin_url) {
        handle = lead.linkedin_url;
      } else {
        skipped++;
        continue;
      }

      // Build tags
      const tags = [...baseTags];
      if (lead.title) tags.push(lead.title.toLowerCase().replace(/\s+/g, '_'));
      if (lead.organization_name) tags.push(lead.organization_name.toLowerCase().replace(/\s+/g, '_'));

      // Add to contacts
      await addContact(
        platform,
        handle,
        lead.name || `${lead.first_name} ${lead.last_name}`,
        lead.email,
        tags
      );

      imported++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${lead.email || lead.name}: ${msg}`);
    }
  }

  await logAction(
    platform,
    'apollo_import_leads',
    errors.length === 0,
    undefined,
    undefined,
    { imported, skipped, errorCount: errors.length }
  );

  return { imported, skipped, errors };
}

/**
 * Quick search and import leads for a company
 */
export async function quickImportFromCompany(
  domain: string,
  options?: {
    titles?: string[];
    seniorityLevels?: string[];
    limit?: number;
    platform?: Platform;
    tags?: string[];
  }
): Promise<{
  found: number;
  imported: number;
  leads: ApolloContact[];
}> {
  console.log(`\n🔍 Searching Apollo for leads at ${domain}...`);

  const leads = await searchByCompany([domain], {
    titles: options?.titles,
    seniorityLevels: options?.seniorityLevels || ['c_suite', 'vp', 'director', 'manager'],
    limit: options?.limit || 50,
  });

  console.log(`   Found ${leads.length} leads`);

  if (leads.length === 0) {
    return { found: 0, imported: 0, leads: [] };
  }

  const result = await importLeadsToContacts(leads, {
    platform: options?.platform || 'email',
    tags: options?.tags || ['apollo', domain.replace(/\./g, '_')],
  });

  console.log(`   Imported ${result.imported} contacts`);

  return {
    found: leads.length,
    imported: result.imported,
    leads,
  };
}

/**
 * Enrich a contact with Apollo data
 */
export async function enrichContact(email: string): Promise<ApolloContact | null> {
  try {
    const result = await apolloRequest<{ person: ApolloContact }>('/people/match', 'POST', {
      email,
    });

    return result.person || null;
  } catch (error) {
    console.error(`Failed to enrich ${email}:`, error);
    return null;
  }
}

/**
 * Bulk enrich contacts
 */
export async function bulkEnrich(emails: string[]): Promise<{
  enriched: ApolloContact[];
  failed: string[];
}> {
  const enriched: ApolloContact[] = [];
  const failed: string[] = [];

  // Apollo has rate limits, so we process in batches
  const batchSize = 10;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (email) => {
        const result = await enrichContact(email);
        if (result) {
          enriched.push(result);
        } else {
          failed.push(email);
        }
      })
    );

    // Small delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return { enriched, failed };
}

// Skill metadata
export const apolloSkillMetadata = {
  name: 'apollo',
  description: 'Lead generation and contact enrichment using Apollo.io',
  functions: [
    {
      name: 'searchLeads',
      description: 'Search for leads with various filters',
      parameters: {
        companyDomains: 'Company domain(s) to search',
        titles: 'Job titles to filter by',
        seniorityLevels: 'Seniority levels (c_suite, vp, director, manager)',
      },
    },
    {
      name: 'searchByCompany',
      description: 'Find leads at specific companies',
      parameters: {
        domains: 'Company domains',
        titles: 'Job titles to filter',
      },
    },
    {
      name: 'quickImportFromCompany',
      description: 'Search and import leads from a company in one step',
      parameters: {
        domain: 'Company domain',
        limit: 'Max leads to import',
      },
    },
    {
      name: 'enrichContact',
      description: 'Get full details for a contact by email',
      parameters: {
        email: 'Email to enrich',
      },
    },
  ],
};

export default {
  searchLeads,
  searchByCompany,
  searchByTitle,
  importLeadsToContacts,
  quickImportFromCompany,
  enrichContact,
  bulkEnrich,
  apolloSkillMetadata,
};
