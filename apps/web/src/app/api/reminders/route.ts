import { badRequest, json, serverError, unauthorized } from "@/lib/http";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/reminders
 *
 * User skin-health reminders & routine schedules.
 */

/** GET: list reminders for signed-in user */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  const { data: list, error } = await supabase
    .from("reminders")
    .select("*, cases (id, title)")
    .order("time", { ascending: true });

  if (error) {
    return serverError("Failed to fetch reminders", error.message);
  }

  const formatted = list.map((r) => ({
    id: r.id,
    title: r.title,
    time: r.time,
    repeat: r.repeat_pattern,
    repeatDays: r.repeat_days,
    meta: r.meta,
    caseId: r.case_id,
    caseLabel: r.cases?.title ? r.cases.title.split(" ").at(-1) : undefined,
    enabled: r.enabled,
    channel: r.channel,
  }));

  return json({ reminders: formatted });
}

/** POST: create reminder */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: {
    title?: string;
    reminder_type?: string;
    time?: string;
    repeat_pattern?: string;
    repeat_days?: number[];
    case_id?: string;
    meta?: string;
    enabled?: boolean;
    channel?: "email" | "push";
  };

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const title = body.title?.trim();
  const time = body.time?.trim();

  if (!title || !time) {
    return badRequest("'title' and 'time' (HH:MM) are required");
  }

  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      title,
      reminder_type: body.reminder_type || "Medication",
      time,
      repeat_pattern: body.repeat_pattern || "Every day",
      repeat_days: body.repeat_days ?? [0, 1, 2, 3, 4, 5, 6],
      case_id: body.case_id || null,
      meta: body.meta?.trim() || null,
      enabled: body.enabled !== false,
      channel: body.channel || "email",
    })
    .select()
    .single();

  if (error || !reminder) {
    return serverError("Failed to create reminder", error?.message);
  }

  return json(reminder, 201);
}

/** PATCH: toggle reminder enabled state or update timing */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: { id?: string; enabled?: boolean; time?: string; repeat_pattern?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body.id) {
    return badRequest("Reminder 'id' is required");
  }

  const updates: TablesUpdate<"reminders"> = {};
  if (body.enabled !== undefined) updates.enabled = body.enabled;
  if (body.time !== undefined) updates.time = body.time;
  if (body.repeat_pattern !== undefined) updates.repeat_pattern = body.repeat_pattern;

  const { data: updated, error } = await supabase
    .from("reminders")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error || !updated) {
    return serverError("Failed to update reminder", error?.message);
  }

  return json(updated);
}
