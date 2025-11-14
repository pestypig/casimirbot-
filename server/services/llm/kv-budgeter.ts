type Turn = { id: string; bytes: number };
type SessionKV = { bytes: number; turns: Turn[] };

const sessions = new Map<string, SessionKV>();

export function kvAdd(sessionId: string, turnId: string, bytes: number): void {
  const session = sessions.get(sessionId) ?? { bytes: 0, turns: [] };
  session.bytes += bytes;
  session.turns.push({ id: turnId, bytes });
  sessions.set(sessionId, session);
}

export function kvBudgetExceeded(sessionId: string, budgetBytes: number): boolean {
  const session = sessions.get(sessionId);
  return session ? session.bytes > budgetBytes : false;
}

export function kvEvictOldest(sessionId: string, targetBytes: number): string[] {
  const session = sessions.get(sessionId);
  if (!session) {
    return [];
  }
  const evicted: string[] = [];
  while (session.bytes > targetBytes && session.turns.length) {
    const turn = session.turns.shift()!;
    session.bytes -= turn.bytes;
    evicted.push(turn.id);
  }
  sessions.set(sessionId, session);
  return evicted;
}

export function kvReset(sessionId?: string): void {
  if (sessionId) {
    sessions.delete(sessionId);
    return;
  }
  sessions.clear();
}
