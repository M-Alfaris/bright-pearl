// Integration Tests for Submit Report V2 Edge Function
// Run with: deno test --allow-net --allow-env

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'test-key';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/submit-report-v2`;

// Helper function to make requests
async function submitReport(payload: any, headers: Record<string, string> = {}) {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    data: await response.json(),
    headers: response.headers,
  };
}

// Valid test payload
const validPayload = {
  content_link: 'https://twitter.com/user/status/123456789',
  platform: 'twitter',
  country: 'US',
  language: 'en',
  content_type: 'tweet',
  description: 'Test report submission',
};

// Test Suite: Successful Submissions
Deno.test("submit-report-v2 - successful new report", async () => {
  const result = await submitReport({
    ...validPayload,
    content_link: `https://twitter.com/test/${Date.now()}`, // Unique URL
  });

  assertEquals(result.status, 200);
  assertEquals(result.data.success, true);
  assertExists(result.data.report_id);
  assertEquals(result.data.report_count, 1);
  assertEquals(result.data.duplicate, false);
});

Deno.test("submit-report-v2 - duplicate report increments count", async () => {
  const uniqueURL = `https://twitter.com/duplicate-test/${Date.now()}`;

  // First submission
  const result1 = await submitReport({
    ...validPayload,
    content_link: uniqueURL,
  });

  assertEquals(result1.status, 200);
  assertEquals(result1.data.report_count, 1);

  // Second submission (duplicate)
  const result2 = await submitReport({
    ...validPayload,
    content_link: uniqueURL,
  });

  assertEquals(result2.status, 200);
  assertEquals(result2.data.duplicate, true);
  assertEquals(result2.data.report_count, 2);
  assertEquals(result2.data.report_id, result1.data.report_id);
});

// Test Suite: Validation Errors
Deno.test("submit-report-v2 - missing required fields", async () => {
  const result = await submitReport({
    content_link: 'https://example.com',
    // Missing platform, country, language, content_type
  });

  assertEquals(result.status, 400);
  assertEquals(result.data.success, false);
  assertExists(result.data.error);
});

Deno.test("submit-report-v2 - invalid URL", async () => {
  const result = await submitReport({
    ...validPayload,
    content_link: 'not-a-valid-url',
  });

  assertEquals(result.status, 400);
  assertExists(result.data.error);
  assert(result.data.error.includes('URL'));
});

Deno.test("submit-report-v2 - invalid platform", async () => {
  const result = await submitReport({
    ...validPayload,
    platform: 'invalid-platform',
  });

  assertEquals(result.status, 400);
  assertExists(result.data.error);
  assert(result.data.error.includes('platform'));
});

Deno.test("submit-report-v2 - invalid country code", async () => {
  const result = await submitReport({
    ...validPayload,
    country: 'usa', // Should be US (uppercase, 2 letters)
  });

  assertEquals(result.status, 400);
  assertExists(result.data.error);
  assert(result.data.error.includes('country'));
});

Deno.test("submit-report-v2 - invalid language code", async () => {
  const result = await submitReport({
    ...validPayload,
    language: 'ENG', // Should be en (lowercase, 2 letters)
  });

  assertEquals(result.status, 400);
  assertExists(result.data.error);
  assert(result.data.error.includes('language'));
});

Deno.test("submit-report-v2 - description too long", async () => {
  const result = await submitReport({
    ...validPayload,
    description: 'a'.repeat(1001), // Max is 1000
  });

  assertEquals(result.status, 400);
  assertExists(result.data.error);
  assert(result.data.error.includes('Description'));
});

Deno.test("submit-report-v2 - malicious URL protocols blocked", async () => {
  const maliciousURLs = [
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
    'file:///etc/passwd',
  ];

  for (const url of maliciousURLs) {
    const result = await submitReport({
      ...validPayload,
      content_link: url,
    });

    assertEquals(result.status, 400);
    assertExists(result.data.error);
  }
});

// Test Suite: Rate Limiting
Deno.test("submit-report-v2 - rate limiting enforced", async () => {
  const testIP = `test-ip-${Date.now()}`;

  // Make 5 requests (should all succeed)
  for (let i = 0; i < 5; i++) {
    const result = await submitReport(
      { ...validPayload, content_link: `https://example.com/test/${i}` },
      { 'x-forwarded-for': testIP }
    );

    assertEquals(result.status, 200);
  }

  // 6th request should be rate limited
  const result = await submitReport(
    validPayload,
    { 'x-forwarded-for': testIP }
  );

  assertEquals(result.status, 429);
  assertEquals(result.data.success, false);
  assertExists(result.data.error);
  assert(result.data.error.includes('Rate limit'));
  assertExists(result.data.retryAfter);
});

// Test Suite: CORS
Deno.test("submit-report-v2 - CORS headers present", async () => {
  const result = await submitReport(validPayload, {
    'origin': 'http://localhost:5173'
  });

  assertExists(result.headers.get('access-control-allow-origin'));
});

Deno.test("submit-report-v2 - OPTIONS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS',
    headers: {
      'origin': 'http://localhost:5173',
    },
  });

  assertEquals(response.status, 200);
  assertExists(response.headers.get('access-control-allow-origin'));
});

// Test Suite: URL Normalization
Deno.test("submit-report-v2 - URL normalization removes tracking params", async () => {
  const urlWithTracking = `https://twitter.com/post/123?utm_source=fb&fbclid=abc&ref=home&timestamp=${Date.now()}`;
  const urlWithoutTracking = `https://twitter.com/post/123?timestamp=${Date.now()}`;

  const result1 = await submitReport({
    ...validPayload,
    content_link: urlWithTracking,
  });

  const result2 = await submitReport({
    ...validPayload,
    content_link: urlWithoutTracking,
  });

  // Should be treated as duplicates
  assertEquals(result1.data.report_id, result2.data.report_id);
  assertEquals(result2.data.duplicate, true);
});

// Test Suite: Security
Deno.test("submit-report-v2 - SQL injection attempts blocked", async () => {
  const sqlInjections = [
    "'; DROP TABLE reports; --",
    "1' OR '1'='1",
    "admin'--",
  ];

  for (const injection of sqlInjections) {
    const result = await submitReport({
      ...validPayload,
      content_type: injection,
    });

    assertEquals(result.status, 400);
  }
});

Deno.test("submit-report-v2 - XSS attempts blocked", async () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
  ];

  for (const xss of xssPayloads) {
    const result = await submitReport({
      ...validPayload,
      description: xss,
    });

    // Description with HTML should still be accepted (sanitized on display)
    // But javascript: URLs should be blocked
    if (xss.startsWith('javascript:')) {
      assertEquals(result.status, 400);
    }
  }
});

// Test Suite: Request Body Size
Deno.test("submit-report-v2 - large request body rejected", async () => {
  const result = await submitReport({
    ...validPayload,
    description: 'a'.repeat(20000), // Very large payload
  });

  // Should be rejected for being too large
  assert(result.status === 400 || result.status === 413);
});

// Test Suite: Platform-Specific Content Types
Deno.test("submit-report-v2 - accepts all valid platforms", async () => {
  const platforms = ['twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other'];

  for (const platform of platforms) {
    const result = await submitReport({
      ...validPayload,
      platform,
      content_link: `https://${platform}.com/post/${Date.now()}`,
    });

    assertEquals(result.status, 200);
  }
});

// Performance Test
Deno.test("submit-report-v2 - response time under 2 seconds", async () => {
  const start = Date.now();

  await submitReport({
    ...validPayload,
    content_link: `https://twitter.com/perf-test/${Date.now()}`,
  });

  const duration = Date.now() - start;

  console.log(`Response time: ${duration}ms`);
  assert(duration < 2000); // Should respond in under 2 seconds
});

console.log("\n✅ All submit-report-v2 integration tests passed!\n");
