import { notImplemented } from "@/lib/http";

/**
 * /api/reminders/dispatch
 *
 * Vercel Cron target: send due reminders. Must verify `Authorization: Bearer ${CRON_SECRET}`.
 */

/** GET: dispatch due reminders */
export async function GET() {
  return notImplemented("GET /api/reminders/dispatch");
}
