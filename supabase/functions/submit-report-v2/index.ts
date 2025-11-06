// Simplified Submit Report Edge Function with Deduplication
// GDPR-compliant, rate-limited, no PII storage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitReportPayload {
  content_link: string;
  platform: string;
  country: string;
  language: string;
  content_type: string;
  description?: string; // Optional context for moderators
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

    const payload: SubmitReportPayload = await req.json();

    // Validation
    if (!payload.content_link || !payload.platform || !payload.country ||
        !payload.language || !payload.content_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate platform
    const validPlatforms = ['twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other'];
    if (!validPlatforms.includes(payload.platform)) {
      return new Response(
        JSON.stringify({ error: 'Invalid platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get and hash IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const ipHash = await hashIP(ip);

    // Rate limiting check (5 per hour per IP)
    const rateLimitResult = await checkRateLimit(ipHash);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many submissions. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`,
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

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          report_id: existing.id,
          message: 'Thank you. This content has been reported before. Your report has been added to the count.',
          report_count: existing.report_count + 1,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          report_id: data.id,
          message: 'Thank you for your report. It will be reviewed by our moderators.',
          report_count: 1,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Submit report error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper: Normalize URL (remove tracking parameters)
function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                           'fbclid', 'gclid', 'msclkid', 'ref', 'source'];

    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));

    // Return lowercase normalized URL
    return urlObj.toString().toLowerCase().trim();
  } catch {
    // If URL is invalid, return lowercase trimmed version
    return url.toLowerCase().trim();
  }
}

// Helper: Hash IP address (SHA-256)
async function hashIP(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Rate limiting with Deno KV
interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
  const kv = await Deno.openKv();
  const key = ['rate_limit', 'submit_v2', ipHash];
  const limit = 5;
  const windowMs = 60 * 60 * 1000; // 1 hour

  try {
    const result = await kv.get(key);
    const now = Date.now();

    if (result.value) {
      const data = result.value as { count: number; resetAt: number };

      if (now > data.resetAt) {
        await kv.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
      }

      if (data.count >= limit) {
        const retryAfter = Math.ceil((data.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
      }

      await kv.set(key, { count: data.count + 1, resetAt: data.resetAt });
      return { allowed: true, retryAfter: 0 };
    } else {
      await kv.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }
  } finally {
    kv.close();
  }
}
