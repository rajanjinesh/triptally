import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for API routes only. Uses the secret key, which must never
 * reach the browser (no NEXT_PUBLIC_ prefix, never imported by client components).
 */
export function supabase() {
  if (typeof window !== "undefined") {
    throw new Error("The Supabase secret key can only be used on the server.");
  }
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
