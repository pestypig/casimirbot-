type Row = Record<string, unknown>;

/** Snapshot row order is arbitrary. Place recorded parents before children;
 * unresolved/cyclic rows still reach normal FK validation, never fabricated
 * roots. Iterative traversal also bounds stack use for long retained chains. */
export function orderLocalTemporalAdmissions(rows: Row[]): Row[] {
  const key = (id: unknown, hash: unknown) => JSON.stringify([id, hash]);
  const children = new Map<string, number[]>();
  const queue: number[] = [];
  rows.forEach((row, index) => {
    if (row.previous_plan_id == null && row.previous_plan_hash == null) {
      queue.push(index);
    } else {
      const parent = key(row.previous_plan_id, row.previous_plan_hash);
      const group = children.get(parent) ?? [];
      group.push(index);
      children.set(parent, group);
    }
  });
  const visited = new Set<number>();
  const ordered: Row[] = [];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor];
    if (visited.has(index)) continue;
    visited.add(index);
    const row = rows[index];
    ordered.push(row);
    const ownKey = key(row.plan_id, row.plan_hash);
    const descendants = children.get(ownKey);
    children.delete(ownKey);
    if (descendants) for (const child of descendants) queue.push(child);
  }
  rows.forEach((row, index) => { if (!visited.has(index)) ordered.push(row); });
  return ordered;
}
