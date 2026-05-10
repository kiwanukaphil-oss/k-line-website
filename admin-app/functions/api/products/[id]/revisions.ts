// GET /api/products/:id/revisions
// Lists the recent saved snapshots for a product, newest first. Returns
// metadata + a partial preview snapshot so the history panel can show
// "name was X" without a second round trip per row. We cap at 50 — that
// covers a few weeks of normal editing without flooding the UI.

import { jsonOk } from "../../../_lib/json";
import type { Env } from "../../../_lib/types";

interface RevisionRow {
  id: number;
  snapshot: string;
  created_at: number;
  created_by: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string;

  const result = await env.DB.prepare(
    "SELECT id, snapshot, created_at, created_by FROM revisions " +
      "WHERE entity_type = 'products' AND entity_id = ? " +
      "ORDER BY created_at DESC LIMIT 50"
  )
    .bind(id)
    .all<RevisionRow>();

  // Decoding the JSON snapshot per row is cheap at this scale; failures
  // (corrupted snapshot) fall back to a stub so the row is still visible
  // and restorable rather than disappearing silently.
  const revisions = (result.results ?? []).map((row) => {
    let preview: { name?: string; price?: number; status?: string } = {};
    try {
      const parsed = JSON.parse(row.snapshot) as { name?: string; price?: number; status?: string };
      preview = { name: parsed.name, price: parsed.price, status: parsed.status };
    } catch {
      preview = { name: "[corrupted snapshot]" };
    }
    return {
      id: row.id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      preview
    };
  });

  return jsonOk({ revisions });
};
