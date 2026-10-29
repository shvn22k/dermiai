import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env.public";

/** Browser client (publishable key + user session). Used for signed direct uploads to Storage. */
export function createClient() {
  const { url, publishableKey } = publicEnv();
  return createBrowserClient(url, publishableKey);
}
