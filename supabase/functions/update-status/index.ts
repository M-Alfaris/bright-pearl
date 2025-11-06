// Update Status Edge Function
// Manual or cron updater for activity_status
// Used to mark content as 'deleted' when it's been removed from platform

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateStatusPayload {
  report_id: number;
  activity_status: 'active' | 'deleted';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from auth header (moderator only)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated (moderator)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: UpdateStatusPayload = await req.json();

    // Validation
    if (!payload.report_id || !payload.activity_status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: report_id, activity_status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['active', 'deleted'].includes(payload.activity_status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid activity_status. Must be "active" or "deleted"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if report exists
    const { data: report, error: lookupError } = await supabaseClient
      .from('reports')
      .select('id, activity_status, content_link')
      .eq('id', payload.report_id)
      .single();

    if (lookupError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update activity status
    const { data: updated, error: updateError } = await supabaseClient
      .from('reports')
      .update({
        activity_status: payload.activity_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.report_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        report: updated,
        message: `Report #${payload.report_id} activity status updated to ${payload.activity_status}`,
        previous_status: report.activity_status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update status error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
