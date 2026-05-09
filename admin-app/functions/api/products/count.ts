// Pages Function: catalog count snapshot.
// Returns the number of published products. Used by the Phase 1b demo so the
// admin scaffold can show "189 products in catalog" without hand-running
// `wrangler d1 execute`. Same Cloudflare Access gate as every other admin
// route — the function only sees authenticated requests.

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM products WHERE status = 'published'"
  ).first<{ count: number }>();

  return new Response(
    JSON.stringify({ count: row?.count ?? 0 }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
};
