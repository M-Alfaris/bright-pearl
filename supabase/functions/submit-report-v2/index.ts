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

interface SubmitReportPayload {
  content_link: string;
  platform: string;
  country: string;
  language: string;
  content_type: string;
  description?: string; // Optional context for moderators
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

    // Validate request body size (max 10KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10240) {
      return createErrorResponse('Request body too large (max 10KB)', 413, origin);
    }

    // Parse JSON with error handling
    let payload: SubmitReportPayload;
    try {
      payload = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400, origin);
    }

    // Validate required fields
    if (!payload.content_link || !payload.platform || !payload.country ||
        !payload.language || !payload.content_type) {
      return createErrorResponse(
        'Missing required fields: content_link, platform, country, language, content_type',
        400,
        origin
      );
    }

    // Comprehensive input validation
    const urlValidation = validateURL(payload.content_link);
    if (!urlValidation.valid) {
      return createErrorResponse(urlValidation.error!, 400, origin);
    }

    const platformValidation = validatePlatform(payload.platform);
    if (!platformValidation.valid) {
      return createErrorResponse(platformValidation.error!, 400, origin);
    }

    const countryValidation = validateCountryCode(payload.country);
    if (!countryValidation.valid) {
      return createErrorResponse(countryValidation.error!, 400, origin);
    }

    const languageValidation = validateLanguageCode(payload.language);
    if (!languageValidation.valid) {
      return createErrorResponse(languageValidation.error!, 400, origin);
    }

    const contentTypeValidation = validateContentType(payload.content_type);
    if (!contentTypeValidation.valid) {
      return createErrorResponse(contentTypeValidation.error!, 400, origin);
    }

    const descriptionValidation = validateDescription(payload.description);
    if (!descriptionValidation.valid) {
      return createErrorResponse(descriptionValidation.error!, 400, origin);
    }

    // Get and hash IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
              req.headers.get('x-real-ip') ||
              'unknown';
    const ipHash = await hashIP(ip);

    // Rate limiting check (5 per hour per IP)
    const rateLimitResult = await checkRateLimit(
      `submit_v2:${ipHash}`,
      5,
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
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

    // Check if this content already exists (deduplication)
    const { data: existing, error: lookupError } = await supabaseClient
      .from('reports')
      .select('id, report_count')
      .eq('content_link_normalized', normalizedLink)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      throw lookupError;
    }

    if (existing) {
      // Content exists - increment report_count
      const { error: updateError } = await supabaseClient
        .from('reports')
        .update({ report_count: existing.report_count + 1 })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating report count:', updateError);
        return createErrorResponse('Failed to update report', 500, origin);
      }

      return createSuccessResponse({
        report_id: existing.id,
        message: 'Thank you. This content has been reported before. Your report has been added to the count.',
        report_count: existing.report_count + 1,
        duplicate: true,
      }, origin);
    } else {
      // New content - insert new record
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
        console.error('Error inserting new report:', insertError);
        return createErrorResponse('Failed to submit report', 500, origin);
      }

      return createSuccessResponse({
        report_id: data.id,
        message: 'Thank you for your report. It will be reviewed by our moderators.',
        report_count: 1,
        duplicate: false,
      }, origin);
    }

  } catch (error) {
    console.error('Submit report error:', error);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while processing your request. Please try again later.',
      500,
      origin
    );
  }
});
