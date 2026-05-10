import { useEffect, useState } from "preact/hooks";

// Liveness + auth + catalog summary, same status panel that's been here
// since Phase 1a. Now lives at /  (the root route).

type HealthStatus = "checking" | "ok" | "error";

type HealthPayload = {
  ok: boolean;
  service?: string;
  phase?: string;
  user?: string;
};

type CatalogCount = number | "checking" | "error";

export function Dashboard() {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [payload, setPayload] = useState<HealthPayload | null>(null);
  const [catalogCount, setCatalogCount] = useState<CatalogCount>("checking");

  useEffect(() => {
    fetch("/healthz")
      .then(async (r) => {
        if (!r.ok) {
          setStatus("error");
          return;
        }
        const data = (await r.json()) as HealthPayload;
        setPayload(data);
        setStatus(data.ok ? "ok" : "error");
      })
      .catch(() => setStatus("error"));

    fetch("/api/products/count")
      .then(async (r) => {
        if (!r.ok) {
          setCatalogCount("error");
          return;
        }
        const data = (await r.json()) as { count: number };
        setCatalogCount(data.count);
      })
      .catch(() => setCatalogCount("error"));
  }, []);

  const catalogDisplay =
    catalogCount === "checking" ? "checking…"
      : catalogCount === "error" ? "unavailable"
        : `${catalogCount} published`;

  return (
    <div class="page page-dashboard">
      <h1 class="page-title">Dashboard</h1>

      <section class="status" data-status={status}>
        <p class="status-row">
          <span class="status-label">API</span>
          <span class="status-value">{status === "checking" ? "checking…" : status}</span>
        </p>
        {payload?.user && (
          <p class="status-row">
            <span class="status-label">Signed in</span>
            <span class="status-value">{payload.user}</span>
          </p>
        )}
        {payload?.phase && (
          <p class="status-row">
            <span class="status-label">Phase</span>
            <span class="status-value">{payload.phase}</span>
          </p>
        )}
        <p class="status-row">
          <span class="status-label">Catalog</span>
          <span class="status-value">{catalogDisplay}</span>
        </p>
      </section>

      <p class="placeholder">
        Phase 1d-ii: catalog browsing. Editor surfaces land in 1d-iii; autosave + undo in 1d-iv.
      </p>
    </div>
  );
}
