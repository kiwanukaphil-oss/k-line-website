// Pages Function: liveness check.
// Cloudflare Access enforces auth at the edge before this handler runs, so an
// anonymous request never gets here — Access bounces it to Google login first.
// Phase 1a success criteria: a logged-in owner sees { ok: true } with their
// email reflected back; an anonymous request is bounced to Google login.

export const onRequestGet: PagesFunction = async ({ request }) => {
  const userEmail = request.headers.get("cf-access-authenticated-user-email") ?? "anonymous";

  return new Response(
    JSON.stringify({
      ok: true,
      service: "klinemen-admin",
      phase: "1a",
      user: userEmail
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
};
