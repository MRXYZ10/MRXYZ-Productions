import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.info("Supabase is not configured. MRXYZ Productions is using a local watchlist.");
}

// A syntactically valid inert client prevents missing credentials from crashing
// the app at import time. AuthProvider never calls it unless configured.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "http://127.0.0.1:54321",
  isSupabaseConfigured ? supabaseAnonKey : "mrxyz-local-development-only",
);
