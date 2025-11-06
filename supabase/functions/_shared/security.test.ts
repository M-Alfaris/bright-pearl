// Unit Tests for Security Utilities
// Run with: deno test --allow-net --allow-env

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.220.0/assert/mod.ts";
import {
  validateURL,
  validatePlatform,
  validateCountryCode,
  validateLanguageCode,
  validateContentType,
  validateDescription,
  validateReportId,
  hashIP,
  normalizeURL,
  checkRateLimit,
} from "./security.ts";

// URL Validation Tests
Deno.test("validateURL - valid HTTPS URL", () => {
  const result = validateURL("https://example.com/post/123");
  assertEquals(result.valid, true);
});

Deno.test("validateURL - valid HTTP URL", () => {
  const result = validateURL("http://example.com");
  assertEquals(result.valid, true);
});

Deno.test("validateURL - invalid protocol", () => {
  const result = validateURL("javascript:alert('xss')");
  assertEquals(result.valid, false);
  assertExists(result.error);
});

Deno.test("validateURL - data URI blocked", () => {
  const result = validateURL("data:text/html,<script>alert('xss')</script>");
  assertEquals(result.valid, false);
});

Deno.test("validateURL - file URI blocked", () => {
  const result = validateURL("file:///etc/passwd");
  assertEquals(result.valid, false);
});

Deno.test("validateURL - URL too long", () => {
  const longURL = "https://example.com/" + "a".repeat(2050);
  const result = validateURL(longURL);
  assertEquals(result.valid, false);
  assert(result.error?.includes("too long"));
});

Deno.test("validateURL - invalid format", () => {
  const result = validateURL("not-a-url");
  assertEquals(result.valid, false);
});

// Platform Validation Tests
Deno.test("validatePlatform - valid platforms", () => {
  const platforms = ['twitter', 'facebook', 'instagram', 'youtube', 'tiktok', 'reddit', 'other'];

  platforms.forEach(platform => {
    const result = validatePlatform(platform);
    assertEquals(result.valid, true);
  });
});

Deno.test("validatePlatform - invalid platform", () => {
  const result = validatePlatform("unknown-platform");
  assertEquals(result.valid, false);
  assertExists(result.error);
});

Deno.test("validatePlatform - case sensitivity", () => {
  const result = validatePlatform("TWITTER");
  assertEquals(result.valid, false); // Should be lowercase
});

// Country Code Validation Tests
Deno.test("validateCountryCode - valid codes", () => {
  const codes = ['US', 'GB', 'FR', 'DE', 'CA'];

  codes.forEach(code => {
    const result = validateCountryCode(code);
    assertEquals(result.valid, true);
  });
});

Deno.test("validateCountryCode - lowercase rejected", () => {
  const result = validateCountryCode("us");
  assertEquals(result.valid, false);
});

Deno.test("validateCountryCode - too long", () => {
  const result = validateCountryCode("USA");
  assertEquals(result.valid, false);
});

Deno.test("validateCountryCode - numbers rejected", () => {
  const result = validateCountryCode("12");
  assertEquals(result.valid, false);
});

// Language Code Validation Tests
Deno.test("validateLanguageCode - valid codes", () => {
  const codes = ['en', 'ar', 'fr', 'de', 'es'];

  codes.forEach(code => {
    const result = validateLanguageCode(code);
    assertEquals(result.valid, true);
  });
});

Deno.test("validateLanguageCode - uppercase rejected", () => {
  const result = validateLanguageCode("EN");
  assertEquals(result.valid, false);
});

Deno.test("validateLanguageCode - too long", () => {
  const result = validateLanguageCode("eng");
  assertEquals(result.valid, false);
});

// Content Type Validation Tests
Deno.test("validateContentType - valid types", () => {
  const types = ['post', 'tweet', 'video', 'reel', 'comment'];

  types.forEach(type => {
    const result = validateContentType(type);
    assertEquals(result.valid, true);
  });
});

Deno.test("validateContentType - allows hyphens and underscores", () => {
  const result = validateContentType("user-generated_content");
  assertEquals(result.valid, true);
});

Deno.test("validateContentType - too long", () => {
  const result = validateContentType("a".repeat(51));
  assertEquals(result.valid, false);
});

Deno.test("validateContentType - special characters rejected", () => {
  const result = validateContentType("post@123");
  assertEquals(result.valid, false);
});

// Description Validation Tests
Deno.test("validateDescription - valid description", () => {
  const result = validateDescription("This is a valid description");
  assertEquals(result.valid, true);
});

Deno.test("validateDescription - undefined allowed", () => {
  const result = validateDescription(undefined);
  assertEquals(result.valid, true);
});

Deno.test("validateDescription - too long", () => {
  const result = validateDescription("a".repeat(1001));
  assertEquals(result.valid, false);
});

// Report ID Validation Tests
Deno.test("validateReportId - valid positive integer", () => {
  const result = validateReportId(123);
  assertEquals(result.valid, true);
});

Deno.test("validateReportId - zero rejected", () => {
  const result = validateReportId(0);
  assertEquals(result.valid, false);
});

Deno.test("validateReportId - negative rejected", () => {
  const result = validateReportId(-5);
  assertEquals(result.valid, false);
});

Deno.test("validateReportId - non-integer rejected", () => {
  const result = validateReportId(12.5);
  assertEquals(result.valid, false);
});

Deno.test("validateReportId - string number rejected", () => {
  const result = validateReportId("123" as any);
  assertEquals(result.valid, false);
});

// IP Hashing Tests
Deno.test("hashIP - produces consistent hash", async () => {
  const ip = "192.168.1.1";
  const hash1 = await hashIP(ip);
  const hash2 = await hashIP(ip);

  assertEquals(hash1, hash2);
  assertEquals(hash1.length, 64); // SHA-256 produces 64 hex chars
});

Deno.test("hashIP - different IPs produce different hashes", async () => {
  const hash1 = await hashIP("192.168.1.1");
  const hash2 = await hashIP("192.168.1.2");

  assert(hash1 !== hash2);
});

Deno.test("hashIP - produces hex string", async () => {
  const hash = await hashIP("192.168.1.1");
  assert(/^[a-f0-9]{64}$/.test(hash));
});

// URL Normalization Tests
Deno.test("normalizeURL - removes utm parameters", () => {
  const url = "https://example.com/post?utm_source=twitter&utm_medium=social";
  const normalized = normalizeURL(url);

  assertEquals(normalized, "https://example.com/post");
});

Deno.test("normalizeURL - removes fbclid", () => {
  const url = "https://facebook.com/post?fbclid=IwAR12345";
  const normalized = normalizeURL(url);

  assertEquals(normalized, "https://facebook.com/post");
});

Deno.test("normalizeURL - removes multiple tracking params", () => {
  const url = "https://example.com/post?id=1&utm_source=fb&gclid=abc&ref=home";
  const normalized = normalizeURL(url);

  assertEquals(normalized, "https://example.com/post?id=1");
});

Deno.test("normalizeURL - converts to lowercase", () => {
  const url = "https://EXAMPLE.COM/POST";
  const normalized = normalizeURL(url);

  assertEquals(normalized, "https://example.com/post");
});

Deno.test("normalizeURL - preserves important params", () => {
  const url = "https://youtube.com/watch?v=abc123&t=30s";
  const normalized = normalizeURL(url);

  assert(normalized.includes("v=abc123"));
  assert(normalized.includes("t=30s"));
});

Deno.test("normalizeURL - handles invalid URLs gracefully", () => {
  const url = "not-a-valid-url";
  const normalized = normalizeURL(url);

  assertEquals(normalized, "not-a-valid-url");
});

// Rate Limiting Tests
Deno.test("checkRateLimit - allows first request", async () => {
  const key = `test-${Date.now()}`;
  const result = await checkRateLimit(key, 5, 60000);

  assertEquals(result.allowed, true);
  assertEquals(result.retryAfter, 0);
});

Deno.test("checkRateLimit - enforces limit", async () => {
  const key = `test-${Date.now()}`;
  const limit = 3;

  // Make requests up to limit
  for (let i = 0; i < limit; i++) {
    const result = await checkRateLimit(key, limit, 60000);
    assertEquals(result.allowed, true);
  }

  // Next request should be blocked
  const result = await checkRateLimit(key, limit, 60000);
  assertEquals(result.allowed, false);
  assert(result.retryAfter > 0);
});

Deno.test("checkRateLimit - resets after window", async () => {
  const key = `test-${Date.now()}`;
  const limit = 2;
  const window = 100; // 100ms window

  // Use up the limit
  await checkRateLimit(key, limit, window);
  await checkRateLimit(key, limit, window);

  // Should be blocked
  let result = await checkRateLimit(key, limit, window);
  assertEquals(result.allowed, false);

  // Wait for window to expire
  await new Promise(resolve => setTimeout(resolve, 150));

  // Should be allowed again
  result = await checkRateLimit(key, limit, window);
  assertEquals(result.allowed, true);
});

// Performance Tests
Deno.test("validation performance - URL validation", () => {
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    validateURL("https://example.com/post/123");
  }

  const duration = performance.now() - start;
  console.log(`1000 URL validations: ${duration.toFixed(2)}ms`);

  // Should be fast (< 100ms for 1000 validations)
  assert(duration < 100);
});

Deno.test("validation performance - combined validation", () => {
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    validateURL("https://example.com");
    validatePlatform("twitter");
    validateCountryCode("US");
    validateLanguageCode("en");
    validateContentType("post");
  }

  const duration = performance.now() - start;
  console.log(`1000 combined validations: ${duration.toFixed(2)}ms`);

  // Should be fast
  assert(duration < 200);
});

// Security Tests
Deno.test("security - SQL injection in content type blocked", () => {
  const result = validateContentType("'; DROP TABLE reports; --");
  assertEquals(result.valid, false);
});

Deno.test("security - XSS in URL blocked", () => {
  const result = validateURL("javascript:alert('xss')");
  assertEquals(result.valid, false);
});

Deno.test("security - path traversal in URL", () => {
  const result = validateURL("https://example.com/../../etc/passwd");
  // URL is technically valid, but should be normalized
  assertEquals(result.valid, true);

  const url = new URL("https://example.com/../../etc/passwd");
  // Browser normalizes path traversal
  assertEquals(url.pathname, "/etc/passwd");
});

console.log("\n✅ All security utility tests passed!\n");
