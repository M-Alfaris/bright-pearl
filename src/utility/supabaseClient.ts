import { createClient } from "@refinedev/supabase";

// Use environment variables for Supabase configuration
// These MUST be set in .env file (see .env.example) - NO FALLBACKS for security
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set. ' +
    'Please check your .env file and ensure both variables are configured.'
  );
}

// Validate URL format
try {
  new URL(SUPABASE_URL);
} catch {
  throw new Error(
    'Invalid VITE_SUPABASE_URL: Must be a valid URL (e.g., https://your-project.supabase.co)'
  );
}

// Validate that it's a Supabase URL
if (!SUPABASE_URL.includes('supabase.co') && !SUPABASE_URL.includes('localhost')) {
  console.warn(
    'Warning: VITE_SUPABASE_URL does not appear to be a Supabase URL. ' +
    'Expected format: https://your-project.supabase.co'
  );
}

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
  },
});
