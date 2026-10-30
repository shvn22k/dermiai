import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env.public";
import type { Database } from "@/lib/supabase/database.types";

/** Browser client (publishable key + user session). Used for signed direct uploads to Storage. */
export function createClient() {
  const { url, publishableKey } = publicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
