import { createClient } from '@supabase/supabase-js';
import type { Handler, HandlerEvent } from '@netlify/functions';

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Supabase not configured',
          message: 'Add SUPABASE_URL and SUPABASE_ANON_KEY to Netlify environment variables'
        }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = JSON.parse(event.body || '{}');
    const { action, data } = body;

    let result;

    switch (action) {
      case 'create_client':
        // Create client first
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: data.clientName,
            company: data.clientName,
            industry: data.industry || 'Healthcare',
            website: data.websiteUrl,
            stage: 'discovery',
            status: 'prospect',
          })
          .select()
          .single();

        if (clientError) throw clientError;
        result = { client, message: 'Client created successfully' };
        break;

      case 'save_discovery':
        // Save discovery data
        const { data: discovery, error: discoveryError } = await supabase
          .from('client_discoveries')
          .insert({
            client_id: data.clientId,
            business_description: data.businessDescription,
            target_audience: data.targetAudience,
            unique_value_proposition: data.uniqueValueProposition,
            current_marketing_channels: data.currentMarketingChannels,
            current_monthly_budget: data.currentMonthlyBudget,
            current_pain_points: data.currentPainPoints,
            competitors: data.competitors,
            competitor_analysis: data.competitorAnalysis,
            primary_goals: data.primaryGoals,
            success_metrics: data.successMetrics,
            timeline: data.timeline,
            existing_tools: data.existingTools,
            social_presence: data.socialProfiles,
            discovery_notes: data.discoveryNotes,
          })
          .select()
          .single();

        if (discoveryError) throw discoveryError;
        
        // Update client stage
        await supabase
          .from('clients')
          .update({ stage: 'strategy' })
          .eq('id', data.clientId);

        result = { discovery, message: 'Discovery saved successfully' };
        break;

      case 'create_and_save':
        // Create client AND save discovery in one go
        const { data: newClient, error: newClientError } = await supabase
          .from('clients')
          .insert({
            name: data.clientName,
            company: data.clientName,
            industry: data.industry || 'Healthcare',
            website: data.websiteUrl,
            stage: 'discovery',
            status: 'prospect',
          })
          .select()
          .single();

        if (newClientError) throw newClientError;

        const { data: newDiscovery, error: newDiscoveryError } = await supabase
          .from('client_discoveries')
          .insert({
            client_id: newClient.id,
            business_description: data.businessDescription,
            target_audience: data.targetAudience,
            unique_value_proposition: data.uniqueValueProposition,
            current_marketing_channels: data.currentMarketingChannels || [],
            current_monthly_budget: data.currentMonthlyBudget,
            current_pain_points: data.currentPainPoints || [],
            competitors: data.competitors || [],
            competitor_analysis: data.competitorAnalysis,
            primary_goals: data.primaryGoals || [],
            success_metrics: data.successMetrics || [],
            timeline: data.timeline,
            existing_tools: data.existingTools || [],
            social_presence: data.socialProfiles,
            discovery_notes: data.discoveryNotes,
          })
          .select()
          .single();

        if (newDiscoveryError) throw newDiscoveryError;

        // Update to strategy stage since discovery is complete
        await supabase
          .from('clients')
          .update({ stage: 'strategy' })
          .eq('id', newClient.id);

        result = { 
          client: newClient, 
          discovery: newDiscovery, 
          message: 'Client and discovery saved successfully' 
        };
        break;

      case 'get_clients':
        const { data: clients, error: getError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (getError) throw getError;
        result = { clients };
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database operation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
};
