// POST /api/publish
// Fires the Cloudflare Pages deploy hook for the public storefront. The
// build that follows runs `npm run build:all`, which starts with
// scripts/build-from-d1.mjs — that script regenerates products.js from
// the latest published rows in D1, so anything Manager-published is live
// within ~90 seconds.
//
// We also write an audit_log entry so the activity feed can show "Publish
// triggered by X at Y". The deploy hook URL is a Pages secret
// (KLINEMEN_DEPLOY_HOOK) created via `wrangler pages secret put`.

import { getUserEmail } from "../_lib/auth";
import { writeAudit } from "../_lib/audit";
import { jsonError, jsonOk } from "../_lib/json";

interface Env {
  DB: D1Database;
  KLINEMEN_DEPLOY_HOOK: string;
}

interface DeployHookResponse {
  success?: boolean;
  result?: {
    id?: string;
    short_id?: string;
  };
  errors?: Array<{ code: number; message: string }>;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.KLINEMEN_DEPLOY_HOOK) {
    return jsonError(500, "KLINEMEN_DEPLOY_HOOK secret is not set on the Pages project");
  }

  const userEmail = getUserEmail(request);

  const hookRes = await fetch(env.KLINEMEN_DEPLOY_HOOK, { method: "POST" });
  let hookBody: DeployHookResponse | null = null;
  try {
    hookBody = (await hookRes.json()) as DeployHookResponse;
  } catch {
    // Hook didn't return JSON; fall through with hookBody=null.
  }

  if (!hookRes.ok || hookBody?.success === false) {
    const message =
      hookBody?.errors?.[0]?.message ?? `Deploy hook returned HTTP ${hookRes.status}`;
    await writeAudit(env.DB, {
      action: "update",
      entityType: "site",
      entityId: "public",
      userEmail,
      details: { event: "publish_failed", message }
    });
    return jsonError(hookRes.status === 200 ? 502 : hookRes.status, message);
  }

  await writeAudit(env.DB, {
    action: "update",
    entityType: "site",
    entityId: "public",
    userEmail,
    details: {
      event: "publish_triggered",
      deploymentId: hookBody?.result?.id ?? null
    }
  });

  return jsonOk({
    ok: true,
    deploymentId: hookBody?.result?.id ?? null,
    shortId: hookBody?.result?.short_id ?? null
  });
};
