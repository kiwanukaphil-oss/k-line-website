// Identifies the authenticated user from a request that has already passed
// Cloudflare Access at the edge. Same logic as the Phase 1a /healthz
// handler — extracted here so every route file uses one canonical
// implementation.
//
// Sources, in order of preference:
//   1. cf-access-authenticated-user-email header (documented contract)
//   2. CF_Authorization JWT cookie payload (fallback for Pages configs
//      where the header doesn't propagate)
//
// Returns "anonymous" if neither yields an email — which only happens when
// a request bypasses Access, e.g. a direct hit on the *.pages.dev URL. The
// audit log still records that string so we have a trace.

export function getUserEmail(request: Request): string {
  const headerEmail = request.headers.get("cf-access-authenticated-user-email");
  if (headerEmail) return headerEmail;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return "anonymous";

  const match = cookieHeader.match(/CF_Authorization=([^;]+)/);
  if (!match) return "anonymous";

  try {
    const payloadSegment = match[1].split(".")[1];
    if (!payloadSegment) return "anonymous";

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (base64.length % 4)) % 4;
    const json = atob(base64 + "=".repeat(padding));
    const payload = JSON.parse(json) as { email?: string };

    return payload.email ?? "anonymous";
  } catch {
    return "anonymous";
  }
}
