// Writes an entry to the audit_log table. Every CRUD operation on an
// editable entity goes through here so the approval workflow (Phase 1j) and
// the activity feed have a single source of truth.

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "submit_for_review"
  | "approve"
  | "reject";

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userEmail: string;
  details?: Record<string, unknown>;
}

export async function writeAudit(db: D1Database, entry: AuditEntry): Promise<void> {
  await db
    .prepare(
      "INSERT INTO audit_log (action, entity_type, entity_id, user_email, details) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.userEmail,
      entry.details ? JSON.stringify(entry.details) : null
    )
    .run();
}
