// Pages Function: liveness check.
// Cloudflare Access enforces auth at the edge before this handler runs, so an
// anonymous request never gets here — Access bounces it to Google login first.
// Phase 1a success criteria: a logged-in owner sees { ok: true } with their
// email reflected back; an anonymous request is bounced to Google login.

export const onRequestGet: PagesFunction = async ({ request }) => {
  const userEmail = identifyUser(request);

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

// Extracts the authenticated user's email from a request that has already
// passed Cloudflare Access at the edge. Two sources, in order of preference:
//
// 1. The cf-access-authenticated-user-email header. Cloudflare *should* add
//    this on every Access-protected request, but in some Pages configurations
//    the header doesn't make it through. We try it first because it's the
//    documented contract.
//
// 2. The CF_Authorization cookie's JWT payload. Access sets this cookie after
//    a successful login; the email is one of its claims. Access already
//    verified the JWT signature at the edge before this function ran, so we
//    don't re-verify here — we just decode the payload and read the email.
//    If the cookie were forged, Access would have rejected the request before
//    it reached this function.
//
// Returns "anonymous" if neither source yields an email — which should only
// happen for requests that bypassed Access entirely (e.g. direct hits to the
// underlying *.pages.dev URL), and those return no sensitive data.
function identifyUser(request: Request): string {
  const headerEmail = request.headers.get("cf-access-authenticated-user-email");
  if (headerEmail) return headerEmail;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return "anonymous";

  const match = cookieHeader.match(/CF_Authorization=([^;]+)/);
  if (!match) return "anonymous";

  try {
    const payloadSegment = match[1].split(".")[1];
    if (!payloadSegment) return "anonymous";

    // base64url → base64: swap -/_ and pad to a multiple of 4
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const json = atob(base64 + "=".repeat(padding));
    const payload = JSON.parse(json) as { email?: string };

    return payload.email ?? "anonymous";
  } catch {
    return "anonymous";
  }
}
