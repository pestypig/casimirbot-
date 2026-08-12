type LocalPersistenceRow = Record<string, unknown>;

const rowString = (row: LocalPersistenceRow, key: string): string =>
  typeof row[key] === "string" ? row[key].trim() : "";

const observedAtMs = (row: LocalPersistenceRow): number => {
  const parsed = Date.parse(rowString(row, "observed_at"));
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
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
