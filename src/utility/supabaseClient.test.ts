// Unit tests for Supabase client configuration
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Supabase Client Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should throw error if VITE_SUPABASE_URL is missing', async () => {
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Mock missing URL
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

    try {
      await import('./supabaseClient');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Missing required environment variables');
    }

    // Restore
    vi.stubEnv('VITE_SUPABASE_URL', originalUrl);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', originalKey);
  });

  it('should throw error if VITE_SUPABASE_ANON_KEY is missing', async () => {
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Mock missing key
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    try {
      await import('./supabaseClient');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Missing required environment variables');
    }

    // Restore
    vi.stubEnv('VITE_SUPABASE_URL', originalUrl);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', originalKey);
  });

  it('should validate URL format', async () => {
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Mock invalid URL
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-valid-url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

    try {
      await import('./supabaseClient');
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain('Invalid VITE_SUPABASE_URL');
    }

    // Restore
    vi.stubEnv('VITE_SUPABASE_URL', originalUrl);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', originalKey);
  });

  it('should accept valid Supabase URL', () => {
    // This test verifies the module loads successfully with valid env vars
    // Already set in setup.ts
    expect(() => {
      require('./supabaseClient');
    }).not.toThrow();
  });
});
