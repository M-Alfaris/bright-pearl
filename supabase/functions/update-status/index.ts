// Update Status Edge Function
// Manual or cron updater for activity_status
// Used to mark content as 'deleted' when it's been removed from platform
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
import { createRequestLogger, logStartup } from "../_shared/logger.ts";

logStartup('update-status', '2.0.0');

interface UpdateStatusPayload {
  report_id: number;
  activity_status: 'active' | 'deleted';
}

serve(async (req) => {
  const logger = createRequestLogger(req);
  const timer = logger.startTimer();
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  logger.logRequest(req.method, '/update-status', { origin });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    logger.debug('Supabase client initialized');

    // Verify moderator authentication and role
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyModerator(supabaseClient, authHeader);

    if (!authResult.success) {
      logger.logAuthentication(false, undefined, authResult.error);
      return createErrorResponse(authResult.error, authResult.status, origin);
    }

    const moderator = authResult.user;
    logger.logAuthentication(true, moderator.id);
    logger.setContext({ moderatorId: moderator.id });

    // Rate limiting for moderators (100 actions per hour)
    const rateLimitResult = await checkRateLimit(
      `update_status:${moderator.id}`,
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
    let payload: UpdateStatusPayload;
    try {
      payload = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400, origin);
    }

    // Validate required fields
    if (!payload.report_id || !payload.activity_status) {
      return createErrorResponse(
        'Missing required fields: report_id, activity_status',
        400,
        origin
      );
    }

    // Validate report ID
    const reportIdValidation = validateReportId(payload.report_id);
    if (!reportIdValidation.valid) {
      return createErrorResponse(reportIdValidation.error!, 400, origin);
    }

    // Validate activity status
    if (!['active', 'deleted'].includes(payload.activity_status)) {
      return createErrorResponse(
        'Invalid activity_status. Must be "active" or "deleted"',
        400,
        origin
      );
    }

    // Check if report exists
    const { data: report, error: lookupError } = await supabaseClient
      .from('reports')
      .select('id, activity_status, content_link')
      .eq('id', payload.report_id)
      .single();

    if (lookupError || !report) {
      return createErrorResponse('Report not found', 404, origin);
    }

    // Update activity status
    logger.info('Updating activity status', {
      reportId: payload.report_id,
      activityStatus: payload.activity_status,
      previousStatus: report.activity_status
    });

    const { data: updated, error: updateError } = await supabaseClient
      .from('reports')
      .update({
        activity_status: payload.activity_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.report_id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update activity status', updateError as any, {
        reportId: payload.report_id,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      logger.logDatabaseOperation('UPDATE', 'reports', false);
      return createErrorResponse('Failed to update activity status', 500, origin);
    }

    logger.logDatabaseOperation('UPDATE', 'reports', true);

    // Log moderator action for audit trail
    logger.info('Logging moderator action for update_status');
    await logModeratorAction(
      supabaseClient,
      payload.report_id,
      moderator.id,
      'update_status'
    );

    logger.logModeratorAction(moderator.id, 'update_status', payload.report_id, true);

    const duration = timer();
    logger.logResponse(req.method, '/update-status', 200, duration);

    return createSuccessResponse({
      report: updated,
      message: `Report #${payload.report_id} activity status updated to ${payload.activity_status}`,
      previous_status: report.activity_status,
      moderator_id: moderator.id,
    }, origin);

  } catch (error) {
    logger.critical('Unhandled error in update-status', error as Error, {
      errorType: (error as Error).constructor.name,
      errorMessage: (error as Error).message
    });
    const duration = timer();
    logger.logResponse(req.method, '/update-status', 500, duration);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while processing your request. Please try again later.',
      500,
      origin
    );
  }
});
