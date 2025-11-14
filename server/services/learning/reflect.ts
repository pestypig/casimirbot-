import crypto from "node:crypto";
import type { TTaskTrace, TMemoryRecord } from "@shared/essence-persona";
import { putMemoryRecord } from "../essence/memory-store";

type EssenceLike = { essence_id?: string; essenceId?: string };

const collectEssenceRefs = (trace?: TTaskTrace | null): string[] => {
  if (!trace?.steps?.length) {
    return [];
  }
  const found = new Set<string>();
  const seen = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === "object") {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
      const essenceId = (value as EssenceLike).essence_id ?? (value as EssenceLike).essenceId;
      if (typeof essenceId === "string" && essenceId.trim()) {
        found.add(essenceId.trim());
      }
      const output = (value as { output?: unknown }).output;
      if (output) {
        visit(output);
      }
      const artifacts = (value as { artifacts?: unknown }).artifacts;
      if (artifacts) {
        visit(artifacts);
      }
    }
  };

  trace.steps.forEach((step) => visit(step));
  return Array.from(found);
};

export async function writeTaskReflection(trace: TTaskTrace, summary: string, personaId: string): Promise<string> {
  const id = crypto.randomUUID();
  const essenceRefs = collectEssenceRefs(trace);
  const now = new Date().toISOString();
  const rows: string[] = [
    `Task: ${trace?.goal ?? "unknown"}`,
    `Result: ${summary}`,
    trace?.notes ? `Notes: ${trace.notes}` : undefined,
    essenceRefs.length ? `Artifacts: ${essenceRefs.join(", ")}` : undefined,
  ].filter(Boolean) as string[];

  const record: TMemoryRecord = {
    id,
    owner_id: personaId,
    created_at: now,
    kind: "procedural",
    keys: ["reflection", `task:${trace?.id ?? "unknown"}`, ...essenceRefs.map((essId) => `essence:${essId}`)],
    text: rows.join("\n"),
    visibility: "private",
    essence_id: essenceRefs[0],
  };
  await putMemoryRecord(record);
  return id;
}
