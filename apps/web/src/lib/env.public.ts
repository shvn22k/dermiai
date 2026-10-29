import { z } from "zod";

// NEXT_PUBLIC_* must be referenced literally so Next.js can inline them into the browser bundle.
const PublicEnv = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

/** True when both Supabase public vars are set (lets local UI work run without Supabase). */
export function hasPublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function publicEnv(): z.infer<typeof PublicEnv> {
  return PublicEnv.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
