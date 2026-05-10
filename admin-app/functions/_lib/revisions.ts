// Snapshots an entity's full state to the revisions table. Called *before*
// a destructive change so the snapshot represents the prior value — the
// thing the one-click undo restores. The snapshot is whatever JSON the
// caller passes (typically the full assembled entity, including child rows
// like product_images / sizes / occasions / badges).

export interface RevisionEntry {
  entityType: string;
  entityId: string;
  snapshot: unknown;
  userEmail: string;
}

export async function writeRevision(db: D1Database, entry: RevisionEntry): Promise<void> {
  await db
    .prepare(
      "INSERT INTO revisions (entity_type, entity_id, snapshot, created_by) VALUES (?, ?, ?, ?)"
    )
    .bind(
      entry.entityType,
      entry.entityId,
      JSON.stringify(entry.snapshot),
      entry.userEmail
    )
    .run();
}
