import { useEffect, useState } from "preact/hooks";

type HealthStatus = "checking" | "ok" | "error";

type HealthPayload = {
  ok: boolean;
  service?: string;
  phase?: string;
  user?: string;
};

export function App() {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [payload, setPayload] = useState<HealthPayload | null>(null);

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
  }, []);

  return (
    <main class="shell">
      <header class="brand">
        <h1>K-LINE MEN</h1>
        <p class="tagline">Admin dashboard</p>
      </header>

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
      </section>

      <p class="placeholder">
        Phase 1a scaffold. Editor surfaces — products, homepage, looks — land in Phase 1d.
      </p>
    </main>
  );
}
