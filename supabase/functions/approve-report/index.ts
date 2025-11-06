// Approve Report Edge Function - Moderator Action
// Changes report status from 'pending' to 'approved' or 'rejected'
// SECURITY HARDENED: Role validation, audit logging, rate limiting

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  verifyModerator,
  logModeratorAction,
  validateReportId,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/security.ts";

interface ApproveReportPayload {
  report_id: number;
  action: 'approved' | 'rejected';
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify moderator authentication and role
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyModerator(supabaseClient, authHeader);

    if (!authResult.success) {
      return createErrorResponse(authResult.error, authResult.status, origin);
    }

    const moderator = authResult.user;

    // Rate limiting for moderators (100 actions per hour)
    const rateLimitResult = await checkRateLimit(
      `approve:${moderator.id}`,
      100,
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`,
        429,
        origin
      );
    }

    // Parse JSON with error handling
    let payload: ApproveReportPayload;
    try {
      payload = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400, origin);
    }

    // Validate required fields
    if (!payload.report_id || !payload.action) {
      return createErrorResponse(
        'Missing required fields: report_id, action',
        400,
        origin
      );
    }

    // Validate report ID
    const reportIdValidation = validateReportId(payload.report_id);
    if (!reportIdValidation.valid) {
      return createErrorResponse(reportIdValidation.error!, 400, origin);
    }

    // Validate action
    if (!['approved', 'rejected'].includes(payload.action)) {
      return createErrorResponse(
        'Invalid action. Must be "approved" or "rejected"',
        400,
        origin
      );
    }

    // Check if report exists
    const { data: report, error: lookupError } = await supabaseClient
      .from('reports')
      .select('id, status')
      .eq('id', payload.report_id)
      .single();

    if (lookupError || !report) {
      return createErrorResponse('Report not found', 404, origin);
    }

    if (report.status !== 'pending') {
      return createErrorResponse(
        `Report has already been reviewed (status: ${report.status})`,
        400,
        origin
      );
    }

    // Update report status
    const { data: updated, error: updateError } = await supabaseClient
      .from('reports')
      .update({
        status: payload.action,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.report_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report status:', updateError);
      return createErrorResponse('Failed to update report status', 500, origin);
    }

    // Log moderator action for audit trail
    await logModeratorAction(
      supabaseClient,
      payload.report_id,
      moderator.id,
      payload.action === 'approved' ? 'approve' : 'reject'
    );

    return createSuccessResponse({
      report: updated,
      message: `Report #${payload.report_id} has been ${payload.action}`,
      moderator_id: moderator.id,
    }, origin);

  } catch (error) {
    console.error('Approve report error:', error);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while processing your request. Please try again later.',
      500,
      origin
    );
  }
});
