// Get Public Reports Edge Function
// Returns approved reports with 60-second caching
// Display format: "Content #<id> – <content_type> on <platform>"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=60', // 60 second cache
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const platform = url.searchParams.get('platform');
    const country = url.searchParams.get('country');
    const language = url.searchParams.get('language');
    const activityStatus = url.searchParams.get('activity_status') || 'active';

    // Validate pagination
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid pagination parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query using the public_reports view
    let query = supabaseClient
      .from('public_reports')
      .select('*', { count: 'exact' });

    // Apply filters
    if (platform) {
      query = query.eq('platform', platform);
    }
    if (country) {
      query = query.eq('country', country);
    }
    if (language) {
      query = query.eq('language', language);
    }
    // Only filter by activity_status if it's not 'all'
    // The view already filters to approved only, so 'all' means all approved (active + deleted)
    if (activityStatus && activityStatus !== 'all') {
      query = query.eq('activity_status', activityStatus);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) throw error;

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages,
        },
        filters: {
          platform,
          country,
          language,
          activity_status: activityStatus,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Total-Count': (count || 0).toString(),
        }
      }
    );

  } catch (error) {
    console.error('Get public reports error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
