// Tiny helpers so route files don't repeat Response boilerplate.

export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function jsonError(status: number, message: string, extras?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({ ok: false, error: message, ...(extras ?? {}) }),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}
