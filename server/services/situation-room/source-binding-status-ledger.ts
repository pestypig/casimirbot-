import crypto from "node:crypto";
import type { HelixSourceBindingStatus } from "@shared/helix-source-binding-status";
import {
  HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA,
  type HelixSourceBindingStatusLedgerState,
  type HelixSourceBindingStatusLedgerTransition,
} from "@shared/helix-source-binding-status-ledger";

const transitions: HelixSourceBindingStatusLedgerTransition[] = [];
const latestStateByKey = new Map<string, HelixSourceBindingStatusLedgerState>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const keyFor = (input: { source_id: string; thread_id?: string | null; modality: string }): string =>
  [input.thread_id ?? "none", input.source_id, input.modality].join("::");

const transition = (input: {
  source_id: string;
  thread_id?: string | null;
  environment_id?: string | null;
  situation_run_id?: string | null;
  modality: string;
  from: HelixSourceBindingStatusLedgerState;
  to: HelixSourceBindingStatusLedgerState;
  reason: string;
  evidence_refs?: string[];
  now?: string;
}): HelixSourceBindingStatusLedgerTransition => {
  const createdAt = input.now ?? new Date().toISOString();
  const entry: HelixSourceBindingStatusLedgerTransition = {
    schema: HELIX_SOURCE_BINDING_STATUS_LEDGER_SCHEMA,
    transition_id: `binding-transition:${hashShort([
      input.source_id,
      input.thread_id ?? null,
      input.modality,
      input.from,
      input.to,
      input.reason,
      createdAt,
    ])}`,
    source_id: input.source_id,
    thread_id: input.thread_id ?? null,
    environment_id: input.environment_id ?? null,
    situation_run_id: input.situation_run_id ?? null,
    modality: input.modality,
    from: input.from,
    to: input.to,
    reason: input.reason,
    evidence_refs: input.evidence_refs ?? [],
    created_at: createdAt,
    assistant_answer: false,
    raw_content_included: false,
  };
  transitions.push(entry);
  latestStateByKey.set(keyFor(input), input.to);
  return entry;
};

export function recordSourceBindingStatusTransitions(input: {
  statuses: HelixSourceBindingStatus[];
  reason: string;
  now?: string;
}): HelixSourceBindingStatusLedgerTransition[] {
  const recorded: HelixSourceBindingStatusLedgerTransition[] = [];
  for (const status of input.statuses) {
    const key = keyFor(status);
    const previous = latestStateByKey.get(key) ?? "missing";
    if (previous === status.status) continue;
    recorded.push(transition({
      source_id: status.source_id,
      thread_id: status.thread_id,
      environment_id: status.environment_id,
      situation_run_id: status.situation_run_id,
      modality: status.modality,
      from: previous,
      to: status.status,
      reason: input.reason,
      evidence_refs: status.evidence_refs,
      now: input.now,
    }));
  }
  return recorded;
}

export function recordSourceBindingRepairCandidate(input: {
  source_id: string;
  thread_id?: string | null;
  modality: string;
  reason: string;
  evidence_refs?: string[];
  now?: string;
}): HelixSourceBindingStatusLedgerTransition {
  const key = keyFor(input);
  const previous = latestStateByKey.get(key) ?? "observed_unbound";
  return transition({
    ...input,
    from: previous,
    to: "repair_candidate_created",
  });
}

export function recordSourceBindingRepairAccepted(input: {
  source_id: string;
  thread_id?: string | null;
  environment_id?: string | null;
  situation_run_id?: string | null;
  modality: string;
  reason: string;
  evidence_refs?: string[];
  now?: string;
}): HelixSourceBindingStatusLedgerTransition {
  const key = keyFor(input);
  const previous = latestStateByKey.get(key) ?? "repair_candidate_created";
  return transition({
    ...input,
    from: previous,
    to: "repair_accepted",
  });
}

export function listSourceBindingStatusLedger(input?: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
}): HelixSourceBindingStatusLedgerTransition[] {
  const limit = Math.max(1, Math.min(input?.limit ?? 50, 500));
  return transitions
    .filter((entry) => !input?.threadId || entry.thread_id === input.threadId)
    .filter((entry) => !input?.sourceId || entry.source_id === input.sourceId)
    .slice(-limit);
}

export function resetSourceBindingStatusLedgerForTest(): void {
  transitions.length = 0;
  latestStateByKey.clear();
}
