import { useEffect, useState } from "preact/hooks";
import type { RevisionListEntry } from "../lib/api";
import { listProductRevisions, restoreProductRevision } from "../lib/api";
import { formatRelative } from "../lib/format";
import { formatPrice } from "../lib/format";

// Slide-down panel below the editor showing the product's last 50 saves,
// each with a one-click "Restore" button. Restoring snapshots the current
// state first so the restore itself can be undone — there's never a
// destructive path here as long as you're inside the 30-day retention
// window.
//
// Parent owns visibility (open/closed) and provides a callback for what
// happens after restore (typically: refetch the product into the editor's
// form state).

interface Props {
  productId: string;
  // Bumping `refreshKey` from the parent triggers a refetch — used after
  // a save so the new revision shows up in the list immediately.
  refreshKey: number;
  onRestored: () => void;
}

export function RevisionHistory(props: Props) {
  const { productId, refreshKey, onRestored } = props;
  const [revisions, setRevisions] = useState<RevisionListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listProductRevisions(productId)
      .then(setRevisions)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load revisions"))
      .finally(() => setLoading(false));
  }, [productId, refreshKey]);

  const onRestore = async (revisionId: number) => {
    if (!window.confirm("Restore this version? Your current state is saved as a new revision so you can undo this restore.")) return;
    setRestoringId(revisionId);
    setError(null);
    try {
      await restoreProductRevision(productId, revisionId);
      onRestored();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <p class="history-loading">Loading history…</p>;
  if (error) return <p class="history-error">{error}</p>;
  if (revisions.length === 0) {
    return <p class="history-empty">No prior versions yet. Saves create revisions automatically.</p>;
  }

  return (
    <ul class="history-list">
      {revisions.map((r, i) => (
        <li key={r.id} class="history-row">
          <div class="history-row-meta">
            <span class="history-row-when">{formatRelative(r.createdAt)}</span>
            <span class="history-row-by">by {r.createdBy}</span>
          </div>
          <div class="history-row-preview">
            {r.preview.name && <span class="history-row-name">{r.preview.name}</span>}
            {r.preview.price !== undefined && <span class="history-row-price">{formatPrice(r.preview.price)}</span>}
            {r.preview.status && (
              <span class="history-row-status" data-status={r.preview.status}>
                {r.preview.status.replace("_", " ")}
              </span>
            )}
          </div>
          <button
            type="button"
            class="history-row-restore"
            onClick={() => void onRestore(r.id)}
            disabled={restoringId !== null || i === 0}
            title={i === 0 ? "This is the most recent version (already current)" : "Restore this version"}
          >
            {restoringId === r.id ? "Restoring…" : i === 0 ? "Current" : "Restore"}
          </button>
        </li>
      ))}
    </ul>
  );
}
