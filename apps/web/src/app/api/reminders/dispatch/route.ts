import { json, serverError, unauthorized } from "@/lib/http";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /api/reminders/dispatch
 *
 * Vercel Cron target: dispatch due reminders.
 * Verifies Authorization: Bearer ${CRON_SECRET} when CRON_SECRET is configured.
 */
export async function GET(request: Request) {
  const cronSecret = serverEnv().CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return unauthorized("Invalid or missing cron authorization header");
    }
  }

  try {
    const admin = createAdminClient();
    const now = new Date();
    const currentHourMinute = now.toTimeString().slice(0, 5); // e.g. "18:00"
    const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6

    // Find enabled reminders matching current time
    const { data: dueReminders, error } = await admin
      .from("reminders")
      .select("id, user_id, title, channel, repeat_days")
      .eq("enabled", true)
      .eq("time", currentHourMinute);

    if (error) {
      return serverError("Failed to query due reminders", error.message);
    }

    const eligible = (dueReminders || []).filter((r) => {
      if (!r.repeat_days || r.repeat_days.length === 0) return true;
      return r.repeat_days.includes(currentDayIndex);
    });

    if (eligible.length > 0) {
      const ids = eligible.map((r) => r.id);
      await admin
        .from("reminders")
        .update({ sent_at: now.toISOString() })
        .in("id", ids);
    }

    return json({
      dispatched: eligible.length,
      timestamp: now.toISOString(),
      reminders: eligible.map((r) => ({ id: r.id, title: r.title, channel: r.channel })),
    });
  } catch (err) {
    return serverError(
      "Reminder dispatch failed",
      err instanceof Error ? err.message : String(err),
    );
  }
}
