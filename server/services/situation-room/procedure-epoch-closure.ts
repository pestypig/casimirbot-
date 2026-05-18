import crypto from "node:crypto";
import {
  HELIX_PROCEDURE_EPOCH_CLOSURE_SCHEMA,
  type HelixProcedureEpochClosure,
  type HelixProcedureEpochClosureStatus,
} from "@shared/helix-procedure-epoch-closure";
import { appendProcedureEpochLedgerItem } from "./procedure-epoch-ledger-store";

const closuresByRun = new Map<string, HelixProcedureEpochClosure[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function recordProcedureEpochClosure(input: {
  situation_run_id: string;
  thread_id: string;
  environment_id: string;
  source_binding_id: string;
  epoch: number;
  status: HelixProcedureEpochClosureStatus;
  card_updated: boolean;
  confidence_changes?: string[];
  pending_actions?: string[];
  next_epoch_triggers?: string[];
  created_at?: string;
}): HelixProcedureEpochClosure {
  const createdAt = input.created_at ?? new Date().toISOString();
  const closure: HelixProcedureEpochClosure = {
    schema: HELIX_PROCEDURE_EPOCH_CLOSURE_SCHEMA,
    closure_id: `procedure_epoch_closure:${hashShort([
      input.situation_run_id,
      input.epoch,
      input.status,
      createdAt,
    ])}`,
    situation_run_id: input.situation_run_id,
    thread_id: input.thread_id,
    environment_id: input.environment_id,
    source_binding_id: input.source_binding_id,
    epoch: input.epoch,
    status: input.status,
    card_updated: input.card_updated,
    confidence_changes: Array.from(new Set(input.confidence_changes ?? [])).slice(-24),
    pending_actions: Array.from(new Set(input.pending_actions ?? [])).slice(-24),
    next_epoch_triggers: Array.from(new Set(input.next_epoch_triggers ?? [])).slice(-24),
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = closuresByRun.get(closure.situation_run_id) ?? [];
  closuresByRun.set(closure.situation_run_id, [
    ...existing.filter((entry: HelixProcedureEpochClosure) => entry.closure_id !== closure.closure_id),
    closure,
  ].slice(-600));
  appendProcedureEpochLedgerItem({
    situation_run_id: closure.situation_run_id,
    source_binding_id: closure.source_binding_id,
    thread_id: closure.thread_id,
    environment_id: closure.environment_id,
    epoch: closure.epoch,
    item_kind: "epoch_closure",
    item_ref: closure.closure_id,
    summary: `Epoch closed as ${closure.status}.`,
    causality_refs: [
      ...closure.confidence_changes,
      ...closure.pending_actions,
    ],
    created_at: closure.created_at,
  });
  return closure;
}

export function listProcedureEpochClosures(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  closureId?: string | null;
  limit?: number;
} = {}): HelixProcedureEpochClosure[] {
  const limit = Math.max(0, Math.min(600, Math.trunc(input.limit ?? 200)));
  return (Array.from(closuresByRun.values()).flat() as HelixProcedureEpochClosure[])
    .filter((entry: HelixProcedureEpochClosure) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixProcedureEpochClosure) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixProcedureEpochClosure) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixProcedureEpochClosure) => !input.closureId || entry.closure_id === input.closureId)
    .sort((a: HelixProcedureEpochClosure, b: HelixProcedureEpochClosure) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function getProcedureEpochClosure(closureId: string): HelixProcedureEpochClosure | null {
  return listProcedureEpochClosures({ closureId, limit: 1 })[0] ?? null;
}

export function resetProcedureEpochClosuresForTest(): void {
  closuresByRun.clear();
}
