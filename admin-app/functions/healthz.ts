// Pages Function: liveness check.
// Cloudflare Access enforces auth at the edge before this handler runs.
// User-email extraction is shared with every other route via _lib/auth.

import { getUserEmail } from "./_lib/auth";
import { jsonOk } from "./_lib/json";

export const onRequestGet: PagesFunction = async ({ request }) => {
  return jsonOk({
    ok: true,
    service: "klinemen-admin",
    phase: "1d",
    user: getUserEmail(request)
  });
};
