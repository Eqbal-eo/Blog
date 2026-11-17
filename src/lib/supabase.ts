import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client. It uses the secret service-role key, which bypasses
// row level security: RLS is enabled on every table with no policies, so the
// public anon key can read nothing. `server-only` keeps this module (and the
// key) out of client bundles.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // Failing loudly beats the alternative: with RLS on, a wrong key returns
  // empty results instead of an error.
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
