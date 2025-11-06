// Shared security utilities for Edge Functions
// Centralized security functions to ensure consistency across all endpoints

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - RESTRICTED to specific origins for security
// Update this list with your actual frontend domains
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bright-pearl.netlify.app',
  // Add your production domain here
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Moderator role validation
export interface AuthResult {
  user: any;
  isModerator: boolean;
}

export async function verifyModerator(
  supabaseClient: SupabaseClient,
  authHeader: string | null
): Promise<{ success: false; error: string; status: number } | { success: true; user: any }> {
  if (!authHeader) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401,
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired authentication token',
        status: 401,
      };
    }

    // CRITICAL: Verify moderator role
    const userRole = user.raw_user_meta_data?.role || user.user_metadata?.role;

    if (userRole !== 'moderator') {
      return {
        success: false,
        error: 'Insufficient permissions. Moderator role required.',
        status: 403,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Authentication verification error:', error);
    return {
      success: false,
      error: 'Authentication verification failed',
      status: 500,
    };
  }
}

// Audit logging
export async function logModeratorAction(
  supabaseClient: SupabaseClient,
  reportId: number,
  moderatorId: string,
  action: 'approve' | 'reject' | 'update_status'
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('moderator_actions')
      .insert({
        report_id: reportId,
        moderator_id: moderatorId,
        action: action,
      });

    if (error) {
      console.error('Failed to log moderator action:', error);
      // Don't fail the main operation if logging fails
      // but ensure it's logged for monitoring
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Input validation utilities
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateURL(url: string): ValidationResult {
  // Check length
  if (url.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 characters)' };
  }

  // Parse URL
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check protocol (only allow http and https)
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { valid: false, error: 'Invalid URL protocol. Only http and https are allowed.' };
  }

  // Check for localhost/private IPs in production
  const hostname = urlObj.hostname.toLowerCase();
  const privatePatterns = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '172.16.', '192.168.'];

  if (privatePatterns.some(pattern => hostname.includes(pattern))) {
    // Allow in development, block in production
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    if (isProduction) {
      return { valid: false, error: 'Private/local URLs are not allowed' };
    }
  }

  return { valid: true };
}

export function validatePlatform(platform: string): ValidationResult {
  const validPlatforms = ['twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other'];

  if (!validPlatforms.includes(platform.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
    };
  }

  return { valid: true };
}

export function validateCountryCode(country: string): ValidationResult {
  // ISO 3166-1 alpha-2 format: exactly 2 uppercase letters
  if (!/^[A-Z]{2}$/.test(country)) {
    return {
      valid: false,
      error: 'Invalid country code. Must be ISO 3166-1 alpha-2 format (e.g., US, GB, FR)'
    };
  }

  return { valid: true };
}

export function validateLanguageCode(language: string): ValidationResult {
  // ISO 639-1 format: exactly 2 lowercase letters
  if (!/^[a-z]{2}$/.test(language)) {
    return {
      valid: false,
      error: 'Invalid language code. Must be ISO 639-1 format (e.g., en, ar, fr)'
    };
  }

  return { valid: true };
}

export function validateContentType(contentType: string): ValidationResult {
  if (contentType.length > 50) {
    return { valid: false, error: 'Content type too long (max 50 characters)' };
  }

  if (!/^[a-z0-9_-]+$/.test(contentType)) {
    return {
      valid: false,
      error: 'Invalid content type. Only lowercase letters, numbers, hyphens and underscores allowed.'
    };
  }

  return { valid: true };
}

export function validateDescription(description: string | undefined): ValidationResult {
  if (description === undefined || description === null) {
    return { valid: true };
  }

  if (description.length > 1000) {
    return { valid: false, error: 'Description too long (max 1000 characters)' };
  }

  return { valid: true };
}

export function validateReportId(reportId: any): ValidationResult {
  const id = Number(reportId);

  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    return { valid: false, error: 'Invalid report ID. Must be a positive integer.' };
  }

  return { valid: true };
}

// Rate limiting with Deno KV
export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const kv = await Deno.openKv();
  const rateLimitKey = ['rate_limit', key];

  try {
    const result = await kv.get(rateLimitKey);
    const now = Date.now();

    if (result.value) {
      const data = result.value as { count: number; resetAt: number };

      if (now > data.resetAt) {
        // Window expired, reset counter
        await kv.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
      }

      if (data.count >= limit) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((data.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
      }

      // Increment counter
      await kv.set(rateLimitKey, { count: data.count + 1, resetAt: data.resetAt });
      return { allowed: true, retryAfter: 0 };
    } else {
      // First request
      await kv.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }
  } finally {
    kv.close();
  }
}

// Generic error response (prevents information leakage)
export function createErrorResponse(
  message: string,
  status: number,
  origin: string | null
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/json',
      },
    }
  );
}

// Success response helper
export function createSuccessResponse(
  data: any,
  origin: string | null,
  additionalHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/json',
        ...additionalHeaders,
      },
    }
  );
}

// Hash IP address (SHA-256)
export async function hashIP(ip: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// URL normalization (remove tracking parameters)
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove common tracking parameters
    const paramsToRemove = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source', '_hsenc', '_hsmi',
      'mc_cid', 'mc_eid', 'mkt_tok'
    ];

    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));

    // Return lowercase normalized URL
    return urlObj.toString().toLowerCase().trim();
  } catch {
    // If URL is invalid, return lowercase trimmed version
    return url.toLowerCase().trim();
  }
}
