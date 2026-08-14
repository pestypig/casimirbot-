type LocalPersistenceRow = Record<string, unknown>;

export type LocalPersistenceTables = Record<
  string,
  Array<LocalPersistenceRow>
>;

export type LocalEnvironmentPersistenceCompactionOptions = {
  maxCatalogRowsPerBinding: number;
  maxEventRowsPerBindingPlane: number;
  maxDigestRowsPerSubject: number;
  maxHeartbeatRowsPerAuthority: number;
};

export type LocalEnvironmentPersistenceCompactionResult = {
  tables: LocalPersistenceTables;
  changedTables: string[];
  discardedRowCount: number;
};

const rowString = (row: LocalPersistenceRow, key: string): string =>
  typeof row[key] === "string" ? row[key].trim() : "";

const observedAtMs = (row: LocalPersistenceRow): number => {
  const parsed = Date.parse(rowString(row, "observed_at"));
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

const timestampMs = (
  row: LocalPersistenceRow,
  keys: readonly string[],
): number => {
  for (const key of keys) {
    const parsed = Date.parse(rowString(row, key));
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NEGATIVE_INFINITY;
};

const newestRowsPerIdentity = (
  rows: LocalPersistenceRow[],
  identity: (row: LocalPersistenceRow) => string,
  maxRows: number,
  timestampKeys: readonly string[],
): LocalPersistenceRow[] => {
  const limit = Math.max(1, Math.floor(maxRows));
  const grouped = new Map<
    string,
    Array<{ row: LocalPersistenceRow; index: number }>
  >();
  rows.forEach((row, index) => {
    const key = identity(row);
    const entries = grouped.get(key) ?? [];
    entries.push({ row, index });
    grouped.set(key, entries);
  });
  return [...grouped.values()].flatMap((entries) =>
    entries
      .sort((left, right) => {
        const timeDelta =
          timestampMs(right.row, timestampKeys) -
          timestampMs(left.row, timestampKeys);
        return timeDelta || right.index - left.index;
      })
      .slice(0, limit)
      .map(({ row }) => row),
  );
};

/**
 * Situation digests are derived, rolling projections of the durable raw event
 * ledger. A high-frequency local connector can otherwise persist thousands of
 * near-duplicate projections and make pg-mem duplicate hundreds of MiB at
 * startup. Keep a recent window per bound subject and execution plane in the
 * local development snapshot; production databases and the raw event ledger
 * are untouched.
 */
export const compactLocalEnvironmentSituationDigestRows = (
  rows: LocalPersistenceRow[],
  maxRowsPerSubject: number,
): LocalPersistenceRow[] => {
  const limit = Math.max(1, Math.floor(maxRowsPerSubject));
  const grouped = new Map<
    string,
    Array<{ row: LocalPersistenceRow; index: number }>
  >();
  rows.forEach((row, index) => {
    const identity = [
      rowString(row, "environment_binding_id"),
      rowString(row, "producer_plane"),
      rowString(row, "subject_ref"),
    ].join("\u0000");
    const entries = grouped.get(identity) ?? [];
    entries.push({ row, index });
    grouped.set(identity, entries);
  });

  return [...grouped.values()].flatMap((entries) =>
    entries
      .sort((left, right) => {
        const observedDelta = observedAtMs(right.row) - observedAtMs(left.row);
        return observedDelta || right.index - left.index;
      })
      .slice(0, limit)
      .map(({ row }) => row),
  );
};

const compactCapabilityCatalogRows = (input: {
  catalogs: LocalPersistenceRow[];
  probeRequests: LocalPersistenceRow[];
  actionRequests: LocalPersistenceRow[];
  maxRowsPerBinding: number;
}): LocalPersistenceRow[] => {
  const referencedCatalogIds = new Set(
    [...input.probeRequests, ...input.actionRequests]
      .map((row) => rowString(row, "catalog_snapshot_id"))
      .filter(Boolean),
  );
  const newest = newestRowsPerIdentity(
    input.catalogs,
    (row) => rowString(row, "environment_binding_id"),
    input.maxRowsPerBinding,
    ["frozen_at", "expires_at"],
  );
  const retainedIds = new Set(
    newest
      .map((row) => rowString(row, "catalog_snapshot_id"))
      .filter(Boolean),
  );
  for (const id of referencedCatalogIds) retainedIds.add(id);
  return input.catalogs.filter((row) =>
    retainedIds.has(rowString(row, "catalog_snapshot_id")),
  );
};

const compactEventLedgerRows = (input: {
  events: LocalPersistenceRow[];
  batches: LocalPersistenceRow[];
  maxRowsPerBindingPlane: number;
}): { events: LocalPersistenceRow[]; batches: LocalPersistenceRow[] } => {
  const events = newestRowsPerIdentity(
    input.events,
    (row) =>
      [
        rowString(row, "environment_binding_id"),
        rowString(row, "producer_plane"),
      ].join("\u0000"),
    input.maxRowsPerBindingPlane,
    ["observed_at", "occurred_at"],
  );
  const retainedBatchIds = new Set(
    events.map((row) => rowString(row, "batch_id")).filter(Boolean),
  );
  return {
    events,
    batches: input.batches.filter((row) =>
      retainedBatchIds.has(rowString(row, "batch_id")),
    ),
  };
};

/**
 * Bounds high-frequency connector projections in the local pg-mem snapshot.
 * Production databases are untouched. Authority, requests, results, workflow
 * receipts, and every capability catalog referenced by a durable request are
 * retained; only redundant rolling telemetry history is reduced.
 */
export const compactLocalEnvironmentPersistenceTables = (
  input: LocalPersistenceTables,
  options: LocalEnvironmentPersistenceCompactionOptions,
): LocalEnvironmentPersistenceCompactionResult => {
  const tables: LocalPersistenceTables = { ...input };
  const changedTables: string[] = [];
  let discardedRowCount = 0;
  const replace = (table: string, rows: LocalPersistenceRow[]): void => {
    const previous = tables[table] ?? [];
    tables[table] = rows;
    const discarded = Math.max(0, previous.length - rows.length);
    if (discarded > 0) {
      changedTables.push(table);
      discardedRowCount += discarded;
    }
  };

  replace(
    "helix_environment_capability_catalog_snapshots",
    compactCapabilityCatalogRows({
      catalogs: tables.helix_environment_capability_catalog_snapshots ?? [],
      probeRequests: tables.helix_environment_probe_requests ?? [],
      actionRequests: tables.helix_environment_action_requests ?? [],
      maxRowsPerBinding: options.maxCatalogRowsPerBinding,
    }),
  );

  const eventLedger = compactEventLedgerRows({
    events: tables.helix_environment_events ?? [],
    batches: tables.helix_environment_event_batches ?? [],
    maxRowsPerBindingPlane: options.maxEventRowsPerBindingPlane,
  });
  replace("helix_environment_events", eventLedger.events);
  replace("helix_environment_event_batches", eventLedger.batches);

  replace(
    "helix_environment_situation_digests",
    compactLocalEnvironmentSituationDigestRows(
      tables.helix_environment_situation_digests ?? [],
      options.maxDigestRowsPerSubject,
    ),
  );

  replace(
    "helix_environment_action_connector_heartbeats",
    newestRowsPerIdentity(
      tables.helix_environment_action_connector_heartbeats ?? [],
      (row) => rowString(row, "action_authority_id"),
      options.maxHeartbeatRowsPerAuthority,
      ["received_at", "created_at"],
    ),
  );

  return { tables, changedTables, discardedRowCount };
};
