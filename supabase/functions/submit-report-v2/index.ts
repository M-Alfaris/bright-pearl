// Simplified Submit Report Edge Function with Deduplication
// GDPR-compliant, rate-limited, no PII storage
// SECURITY HARDENED: Input validation, rate limiting, audit logging

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  validateURL,
  validatePlatform,
  validateCountryCode,
  validateLanguageCode,
  validateContentType,
  validateDescription,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  hashIP,
  normalizeURL,
} from "../_shared/security.ts";
import { createRequestLogger, logStartup } from "../_shared/logger.ts";

logStartup('submit-report-v2', '2.0.0');

interface SubmitReportPayload {
  content_link: string;
  platform: string;
  country: string;
  language: string;
  content_type: string;
  description?: string; // Optional context for moderators
}

serve(async (req) => {
  const logger = createRequestLogger(req);
  const timer = logger.startTimer();
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  logger.logRequest(req.method, '/submit-report-v2', { origin });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    logger.debug('Supabase client initialized');

    // Validate request body size (max 10KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) {
      logger.warn('Request body too large', { contentLength });
      return createErrorResponse('Request body too large (max 10KB)', 413, origin);
    }

    // Parse JSON with error handling
    let payload: SubmitReportPayload;
    try {
      payload = await req.json();
      logger.debug('Request payload parsed', {
        platform: payload.platform,
        country: payload.country,
        hasDescription: !!payload.description
      });
    } catch (error) {
      logger.error('Failed to parse JSON', error as Error);
      return createErrorResponse('Invalid JSON in request body', 400, origin);
    }

    // Validate required fields
    if (!payload.content_link || !payload.platform || !payload.country ||
        !payload.language || !payload.content_type) {
      logger.logValidationError('required_fields', payload, 'Missing required fields');
      return createErrorResponse(
        'Missing required fields: content_link, platform, country, language, content_type',
        400,
        origin
      );
    }

    logger.info('Starting comprehensive validation');

    // Comprehensive input validation
    const urlValidation = validateURL(payload.content_link);
    if (!urlValidation.valid) {
      logger.logValidationError('content_link', payload.content_link, urlValidation.error!);
      return createErrorResponse(urlValidation.error!, 400, origin);
    }

    const platformValidation = validatePlatform(payload.platform);
    if (!platformValidation.valid) {
      logger.logValidationError('platform', payload.platform, platformValidation.error!);
      return createErrorResponse(platformValidation.error!, 400, origin);
    }

    const countryValidation = validateCountryCode(payload.country);
    if (!countryValidation.valid) {
      logger.logValidationError('country', payload.country, countryValidation.error!);
      return createErrorResponse(countryValidation.error!, 400, origin);
    }

    const languageValidation = validateLanguageCode(payload.language);
    if (!languageValidation.valid) {
      logger.logValidationError('language', payload.language, languageValidation.error!);
      return createErrorResponse(languageValidation.error!, 400, origin);
    }

    const contentTypeValidation = validateContentType(payload.content_type);
    if (!contentTypeValidation.valid) {
      logger.logValidationError('content_type', payload.content_type, contentTypeValidation.error!);
      return createErrorResponse(contentTypeValidation.error!, 400, origin);
    }

    const descriptionValidation = validateDescription(payload.description);
    if (!descriptionValidation.valid) {
      logger.logValidationError('description', payload.description, descriptionValidation.error!);
      return createErrorResponse(descriptionValidation.error!, 400, origin);
    }

    logger.info('All validations passed');

    // Get and hash IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
              req.headers.get('x-real-ip') ||
              'unknown';
    const ipHash = await hashIP(ip);

    logger.debug('IP hashed for rate limiting', { ipHash: ipHash.substring(0, 8) + '...' });

    // Rate limiting check (5 per hour per IP)
    const rateLimitResult = await checkRateLimit(
      `submit_v2:${ipHash}`,
      5,
      60 * 60 * 1000 // 1 hour
    );

    logger.logRateLimit(!rateLimitResult.allowed, `submit_v2:${ipHash}`, 5);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for IP', {
        ipHash: ipHash.substring(0, 8) + '...',
        retryAfter: rateLimitResult.retryAfter
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: `Too many submissions. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`,
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter.toString(),
          }
        }
      );
    }

    // Normalize URL (remove tracking params)
    const normalizedLink = normalizeURL(payload.content_link);
    logger.debug('URL normalized', {
      original: payload.content_link.substring(0, 50) + '...',
      normalized: normalizedLink.substring(0, 50) + '...'
    });

    // Check if this content already exists (deduplication)
    logger.info('Checking for duplicate report');
    const { data: existing, error: lookupError } = await supabaseClient
      .from('reports')
      .select('id, report_count')
      .eq('content_link_normalized', normalizedLink)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      logger.error('Database lookup error', lookupError as any, {
        code: lookupError.code,
        details: lookupError.details,
        hint: lookupError.hint
      });
      throw lookupError;
    }

    if (existing) {
      // Content exists - increment report_count
      logger.info('Duplicate report found, incrementing count', {
        reportId: existing.id,
        currentCount: existing.report_count
      });

      const { error: updateError } = await supabaseClient
        .from('reports')
        .update({ report_count: existing.report_count + 1 })
        .eq('id', existing.id);

      if (updateError) {
        logger.error('Failed to update report count', updateError as any, {
          reportId: existing.id,
          code: updateError.code,
          details: updateError.details
        });
        logger.logDatabaseOperation('UPDATE', 'reports', false);
        return createErrorResponse('Failed to update report', 500, origin);
      }

      logger.logDatabaseOperation('UPDATE', 'reports', true);
      logger.info('Report count incremented successfully', {
        reportId: existing.id,
        newCount: existing.report_count + 1
      });

      const duration = timer();
      logger.logResponse(req.method, '/submit-report-v2', 200, duration);

      return createSuccessResponse({
        report_id: existing.id,
        message: 'Thank you. This content has been reported before. Your report has been added to the count.',
        report_count: existing.report_count + 1,
        duplicate: true,
      }, origin);
    } else {
      // New content - insert new record
      logger.info('Creating new report', {
        platform: payload.platform,
        country: payload.country,
        hasDescription: !!payload.description
      });

      const { data, error: insertError} = await supabaseClient
        .from('reports')
        .insert({
          content_link: payload.content_link,
          content_link_normalized: normalizedLink,
          platform: payload.platform,
          country: payload.country,
          language: payload.language,
          content_type: payload.content_type,
          description: payload.description || null,
          submitter_ip_hash: ipHash,
          status: 'pending',
          activity_status: 'active',
          report_count: 1,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to insert new report', insertError as any, {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        });
        logger.logDatabaseOperation('INSERT', 'reports', false);
        return createErrorResponse('Failed to submit report', 500, origin);
      }

      logger.logDatabaseOperation('INSERT', 'reports', true);
      logger.info('New report created successfully', { reportId: data.id });

      const duration = timer();
      logger.logResponse(req.method, '/submit-report-v2', 200, duration);

      return createSuccessResponse({
        report_id: data.id,
        message: 'Thank you for your report. It will be reviewed by our moderators.',
        report_count: 1,
        duplicate: false,
      }, origin);
    }

  } catch (error) {
    logger.critical('Unhandled error in submit-report-v2', error as Error, {
      errorType: (error as Error).constructor.name,
      errorMessage: (error as Error).message
    });
    const duration = timer();
    logger.logResponse(req.method, '/submit-report-v2', 500, duration);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while processing your request. Please try again later.',
      500,
      origin
    );
  }
});
