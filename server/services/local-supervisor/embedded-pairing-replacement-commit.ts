import { replaceQueryArgs$, type IMemoryDb } from "pg-mem";

export type PreparedPairingWrite = Readonly<{ sql: string; values: readonly unknown[] }>;

/** Server-internal embedded storage primitive only. Callers prepare encrypted
 * payloads and validate human/provider scope before entering this synchronous
 * section. It must never accept a callback or await between backup and restore.
 * Native durability and PostgreSQL transactions are separate caller obligations.
 * Not yet wired into production pairing acceptance. */
export function commitEmbeddedPairingReplacement(
  db: IMemoryDb,
  writes: readonly [PreparedPairingWrite, PreparedPairingWrite],
): boolean {
  // Only the two ledger CAS writes are allowed here, not schema changes or a
  // general SQL batch. No SQL supplied by a browser/provider enters this port.
  for (const write of writes) {
    if (!/^UPDATE helix_pairing_ledger\s/iu.test(write.sql) || write.sql.includes(";")) {
      throw new Error("pairing_atomic_write_invalid");
    }
  }
  // Use the installed pg adapter's own exported parameter formatter. Direct
  // parameterized prepare/bind fails indexed filters in this pg-mem version.
  const prepared = writes.map(write => db.public.prepare(replaceQueryArgs$(write.sql, [...write.values])).bind());
  const backup = db.backup();
  try {
    for (const query of prepared) {
      const result = query.executeAll();
      if (result.rowCount !== 1) {
        backup.restore();
        return false;
      }
    }
    return true;
  } catch (error) {
    backup.restore();
    throw error;
  }
}
