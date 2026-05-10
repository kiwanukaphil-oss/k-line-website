// Display helpers used across pages.

// UGX is whole-shilling — no decimals on the storefront. Group separators
// keep large numbers (UGX 480,000) readable.
export function formatPrice(amount: number): string {
  return `UGX ${amount.toLocaleString("en-US")}`;
}

// Renders a unix-epoch-ms timestamp as a short relative string ("2h ago",
// "3d ago", "Mar 12") so the catalog "Updated" column doesn't waste width.
export function formatRelative(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.round(diffHr / 24);
  if (diffDays < 14) return `${diffDays}d ago`;
  return new Date(timestampMs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
