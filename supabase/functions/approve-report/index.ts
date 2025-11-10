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
import { createRequestLogger, logStartup } from "../_shared/logger.ts";

logStartup('approve-report', '2.0.0');

interface ApproveReportPayload {
  report_id: number;
  action: 'approved' | 'rejected';
}

serve(async (req) => {
  const logger = createRequestLogger(req);
  const timer = logger.startTimer();
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  logger.logRequest(req.method, '/approve-report', { origin });

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
    logger.info('Verifying moderator authentication');
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
    logger.info('Updating report status', {
      reportId: payload.report_id,
      action: payload.action,
      moderatorId: moderator.id
    });

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
      logger.error('Failed to update report status', updateError as any, {
        reportId: payload.report_id,
        action: payload.action,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      logger.logDatabaseOperation('UPDATE', 'reports', false);
      return createErrorResponse('Failed to update report status', 500, origin);
    }

    logger.logDatabaseOperation('UPDATE', 'reports', true);

    // Log moderator action for audit trail
    const auditAction = payload.action === 'approved' ? 'approve' : 'reject';
    logger.info('Logging moderator action', { action: auditAction });

    await logModeratorAction(
      supabaseClient,
      payload.report_id,
      moderator.id,
      auditAction
    );

    logger.logModeratorAction(moderator.id, auditAction, payload.report_id, true);

    const duration = timer();
    logger.logResponse(req.method, '/approve-report', 200, duration);

    return createSuccessResponse({
      report: updated,
      message: `Report #${payload.report_id} has been ${payload.action}`,
      moderator_id: moderator.id,
    }, origin);

  } catch (error) {
    logger.critical('Unhandled error in approve-report', error as Error, {
      errorType: (error as Error).constructor.name,
      errorMessage: (error as Error).message
    });
    const duration = timer();
    logger.logResponse(req.method, '/approve-report', 500, duration);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while processing your request. Please try again later.',
      500,
      origin
    );
  }
});
