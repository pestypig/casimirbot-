import type { HelixInterpretedEventKind } from "@shared/helix-interpreted-event-log";

const recentKeysByThread = new Map<string, Map<string, number>>();

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

export function buildInterpretedLogDedupeKey(input: {
  kind: HelixInterpretedEventKind;
  summary: string;
  evidence_refs?: string[];
  related_ids?: string[];
}): string {
  return [
    input.kind,
    normalize(input.summary),
    [...(input.evidence_refs ?? []), ...(input.related_ids ?? [])].map(normalize).sort().join("|"),
  ].join("::");
}

export function shouldSuppressInterpretedLogDuplicate(input: {
  thread_id: string;
  kind: HelixInterpretedEventKind;
  summary: string;
  evidence_refs?: string[];
  related_ids?: string[];
  now_ms?: number;
  cooldown_ms?: number;
}): { suppress: boolean; key: string; reason?: "duplicate" | "cooldown" } {
  const now = input.now_ms ?? Date.now();
  const cooldown = Math.max(0, input.cooldown_ms ?? 90_000);
  const key = buildInterpretedLogDedupeKey(input);
  const threadMap = recentKeysByThread.get(input.thread_id) ?? new Map<string, number>();
  const previous = threadMap.get(key);
  if (typeof previous === "number" && now - previous < cooldown) {
    recentKeysByThread.set(input.thread_id, threadMap);
    return { suppress: true, key, reason: "cooldown" };
  }
  threadMap.set(key, now);
  recentKeysByThread.set(input.thread_id, threadMap);
  return { suppress: false, key };
}

export function clearInterpretedLogDedupeForTest(): void {
  recentKeysByThread.clear();
}
