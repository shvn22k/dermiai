import "server-only";
import { z } from "zod";

// Validated lazily (on first use) so `next build` works without runtime secrets.
const ServerEnv = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_IMAGES_BUCKET: z.string().min(1).default("skin-images"),
  VISION_ENDPOINT_URL: z.url(),
  LLM_ENDPOINT_URL: z.url(),
  MODEL_AUTH_MODE: z.enum(["bearer", "gcp-oidc"]).default("bearer"),
  MODEL_ENDPOINT_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnv>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= ServerEnv.parse(process.env);
  return cached;
}
