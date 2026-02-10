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
    
    // Handle new format from Discovery page
    if (body.clientName && body.discoveryData) {
      const { clientName, industry, websiteUrl, discoveryData } = body;
      
      // Find or create client
      let client;
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .eq('name', clientName.trim())
        .limit(1);
      
      if (existingClients && existingClients.length > 0) {
        client = existingClients[0];
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: clientName.trim(),
            company: clientName.trim(),
            industry: industry || 'General',
            website: websiteUrl,
            stage: 'discovery',
            status: 'prospect',
          })
          .select()
          .single();
        
        if (clientError) throw clientError;
        client = newClient;
      }
      
      // Save or update discovery
      const discoveryPayload: any = {
        client_id: client.id,
        business_description: discoveryData.businessDescription || '',
        target_audience: discoveryData.targetAudience || '',
        unique_value_proposition: discoveryData.uniqueValueProposition || '',
        current_marketing_channels: Array.isArray(discoveryData.currentMarketingChannels) 
          ? discoveryData.currentMarketingChannels 
          : [],
        current_monthly_budget: discoveryData.currentMonthlyBudget || null,
        current_pain_points: Array.isArray(discoveryData.currentPainPoints) 
          ? discoveryData.currentPainPoints 
          : [],
        competitors: Array.isArray(discoveryData.competitors) 
          ? discoveryData.competitors 
          : [],
        competitor_analysis: discoveryData.competitorAnalysis || '',
        primary_goals: Array.isArray(discoveryData.primaryGoals) 
          ? discoveryData.primaryGoals 
          : [],
        success_metrics: Array.isArray(discoveryData.successMetrics) 
          ? discoveryData.successMetrics 
          : [],
        timeline: discoveryData.timeline || '',
        existing_tools: Array.isArray(discoveryData.existingTools) 
          ? discoveryData.existingTools 
          : [],
        social_presence: discoveryData.socialProfiles || '',
        discovery_notes: discoveryData.discoveryNotes || '',
        website_analysis: discoveryData.websiteAnalysis || null,
        tone: discoveryData.tone || '',
        keywords: Array.isArray(discoveryData.keywords) 
          ? discoveryData.keywords 
          : [],
      };
      
      // Check if discovery already exists
      const { data: existingDiscoveries, error: checkError } = await supabase
        .from('client_discoveries')
        .select('id')
        .eq('client_id', client.id)
        .limit(1);
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }
      
      const existingDiscovery = existingDiscoveries && existingDiscoveries.length > 0 ? existingDiscoveries[0] : null;
      
      let discovery;
      if (existingDiscovery) {
        // Update existing discovery
        const { data: updatedDiscovery, error: updateError } = await supabase
          .from('client_discoveries')
          .update(discoveryPayload)
          .eq('client_id', client.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        discovery = updatedDiscovery;
      } else {
        // Create new discovery
        const { data: newDiscovery, error: discoveryError } = await supabase
          .from('client_discoveries')
          .insert(discoveryPayload)
          .select()
          .single();
        
        if (discoveryError) throw discoveryError;
        discovery = newDiscovery;
      }
      
      // Update client stage and website if needed
      await supabase
        .from('clients')
        .update({ 
          stage: 'strategy',
          industry: industry || client.industry,
          website: websiteUrl || client.website,
        })
        .eq('id', client.id);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          client,
          discovery,
          message: 'Discovery saved successfully' 
        }),
      };
    }
    
    // Handle legacy format with action field
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
          body: JSON.stringify({ error: 'Invalid action or missing required fields' }),
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Database error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error && 'code' in error ? { code: (error as any).code } : {};
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database operation failed', 
        message: errorMessage,
        details: errorDetails,
        // Include helpful hints for common errors
        hint: errorMessage.includes('column') 
          ? 'Database schema mismatch. Run migration 007_fix_discovery_columns.sql'
          : errorMessage.includes('relation') 
          ? 'Table does not exist. Run all SQL migrations in order.'
          : errorMessage.includes('permission') || errorMessage.includes('RLS')
          ? 'Row Level Security issue. Check Supabase RLS policies.'
          : undefined
      }),
    };
  }
};
