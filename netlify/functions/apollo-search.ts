import type { Handler, HandlerEvent } from '@netlify/functions';

const APOLLO_API_URL = 'https://api.apollo.io/v1/mixed_people/api_search';

interface RequestBody {
  query?: string;
  titles?: string[];
  industries?: string[];
  locations?: string[];
  companySize?: string;
  limit?: number;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const apiKey = process.env.APOLLO_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Apollo API key not configured',
          message: 'Add APOLLO_API_KEY to Netlify environment variables'
        }),
      };
    }

    const body: RequestBody = JSON.parse(event.body || '{}');
    const { 
      query = '', 
      titles = ['Marketing Director', 'CMO', 'Marketing Manager'],
      industries = ['Hospital & Health Care', 'Medical Practice'],
      locations = ['United States'],
      companySize = '',
      limit = 25 
    } = body;

    // Build Apollo API request
    const apolloBody: any = {
      api_key: apiKey,
      per_page: limit,
      page: 1,
      person_titles: titles,
      person_locations: locations,
    };

    if (query) {
      apolloBody.q_keywords = query;
    }

    if (industries.length > 0) {
      apolloBody.q_organization_public_info_industries = industries.join('\n');
    }

    if (companySize) {
      apolloBody.organization_num_employees_ranges = [companySize];
    }

    const response = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(apolloBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform to cleaner format
    const leads = (data.people || []).map((person: any) => ({
      id: person.id,
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      firstName: person.first_name,
      lastName: person.last_name,
      title: person.title,
      company: person.organization?.name || person.organization_name,
      email: person.email,
      phone: person.phone_numbers?.[0]?.number,
      linkedin: person.linkedin_url,
      location: person.city ? `${person.city}, ${person.state}` : person.country,
      industry: person.organization?.industry,
      companySize: person.organization?.estimated_num_employees,
      companyWebsite: person.organization?.website_url,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        leads,
        total: data.pagination?.total_entries || leads.length,
        page: data.pagination?.page || 1,
        perPage: data.pagination?.per_page || limit,
      }),
    };

  } catch (error) {
    console.error('Apollo search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};
