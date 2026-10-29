/** Placeholder response for scaffolded routes. */
export function notImplemented(route: string): Response {
  return Response.json({ error: "not_implemented", route }, { status: 501 });
}
