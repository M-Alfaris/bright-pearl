// Get Public Reports Edge Function
// Returns approved reports with 60-second caching
// Display format: "Content #<id> – <content_type> on <platform>"
// SECURITY HARDENED: Rate limiting, input validation

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getCorsHeaders,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  hashIP,
} from "../_shared/security.ts";
import { createRequestLogger, logStartup } from "../_shared/logger.ts";

logStartup('get-public-reports', '2.0.0');

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Rate limiting (1000 requests per hour per IP for public endpoint)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
              req.headers.get('x-real-ip') ||
              'unknown';
    const ipHash = await hashIP(ip);

    const rateLimitResult = await checkRateLimit(
      `get_public:${ipHash}`,
      1000,
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`,
        429,
        origin
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const platform = url.searchParams.get('platform');
    const country = url.searchParams.get('country');
    const language = url.searchParams.get('language');
    const activityStatus = url.searchParams.get('activity_status') || 'active';

    // Validate pagination
    if (page < 1 || page > 10000) {
      return createErrorResponse('Invalid page number (must be 1-10000)', 400, origin);
    }

    if (pageSize < 1 || pageSize > 100) {
      return createErrorResponse('Invalid page size (must be 1-100)', 400, origin);
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

    if (error) {
      console.error('Database query error:', error);
      return createErrorResponse('Failed to fetch reports', 500, origin);
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return createSuccessResponse({
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
    }, origin, {
      'X-Total-Count': (count || 0).toString(),
      'Cache-Control': 'public, max-age=60', // 60 second cache
    });

  } catch (error) {
    console.error('Get public reports error:', error);
    // Generic error message to prevent information leakage
    return createErrorResponse(
      'An error occurred while fetching reports. Please try again later.',
      500,
      origin
    );
  }
});
