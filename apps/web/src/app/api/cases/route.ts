import { badRequest, json, serverError, unauthorized } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/cases
 *
 * Cases owned by the signed-in user (Supabase Postgres, RLS).
 */

/** GET: list cases */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  const { data: userCases, error } = await supabase
    .from("cases")
    .select("*, case_images(id, storage_path, pain_level, created_at)")
    .order("updated_at", { ascending: false });

  if (error) {
    return serverError("Failed to fetch cases", error.message);
  }

  const formatted = userCases.map((c) => ({
    id: c.id,
    name: c.title,
    area: c.body_site,
    photos: c.case_images ? c.case_images.length : 0,
    status: c.status,
    updated: new Date(c.updated_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    angle: c.placeholder_angle,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));

  return json({ cases: formatted });
}

/** POST: create case */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return unauthorized();
  }

  let body: { title?: string; body_site?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const title = body.title?.trim();
  const bodySite = body.body_site?.trim();

  if (!title || !bodySite) {
    return badRequest("Both 'title' and 'body_site' are required");
  }

  const validStatuses = ["open", "healing", "resolved", "see-dermatologist"] as const;
  const status = validStatuses.includes(body.status as (typeof validStatuses)[number])
    ? (body.status as (typeof validStatuses)[number])
    : "open";

  const { data: newCase, error } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title,
      body_site: bodySite,
      status,
    })
    .select()
    .single();

  if (error || !newCase) {
    return serverError("Failed to create case", error?.message);
  }

  // Insert initial timeline event
  await supabase.from("case_events").insert({
    case_id: newCase.id,
    user_id: user.id,
    kind: "Consultation",
    title: "Case opened",
    detail: `Consultation started for ${bodySite}.`,
  });

  return json(newCase, 201);
}
