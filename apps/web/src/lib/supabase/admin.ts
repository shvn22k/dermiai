import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env.public";

/**
 * Service-role client: BYPASSES Row Level Security. Only for trusted server jobs
 * (e.g. the reminders cron). Never use it to serve a user request you could serve with RLS.
 */
export function createAdminClient() {
  return createSupabaseClient(publicEnv().url, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
