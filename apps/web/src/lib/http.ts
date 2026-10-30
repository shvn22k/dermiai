/** HTTP helpers for route handlers */

export function notImplemented(route: string): Response {
  return Response.json({ error: "not_implemented", route }, { status: 501 });
}

export function json(data: unknown, status = 200, init?: ResponseInit): Response {
  return Response.json(data, { status, ...init });
}

export function badRequest(message: string, details?: unknown): Response {
  return Response.json({ error: "bad_request", message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ error: "unauthorized", message }, { status: 401 });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: "not_found", message }, { status: 404 });
}

export function serverError(message = "Internal server error", details?: unknown): Response {
  return Response.json({ error: "server_error", message, details }, { status: 500 });
}
