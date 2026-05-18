import crypto from "node:crypto";
import {
  HELIX_PROCEDURE_EPOCH_LEDGER_ITEM_SCHEMA,
  type HelixProcedureEpochLedgerItem,
  type HelixProcedureEpochLedgerItemKind,
  type HelixProcedureEpochReplay,
} from "@shared/helix-procedure-epoch-ledger";

const ledgerByRun = new Map<string, HelixProcedureEpochLedgerItem[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function appendProcedureEpochLedgerItem(input: {
  situation_run_id: string;
  source_binding_id: string;
  thread_id: string;
  environment_id: string;
  epoch: number;
  item_kind: HelixProcedureEpochLedgerItemKind;
  item_ref: string;
  summary: string;
  causality_refs?: string[];
  created_at?: string;
}): HelixProcedureEpochLedgerItem {
  const createdAt = input.created_at ?? new Date().toISOString();
  const item: HelixProcedureEpochLedgerItem = {
    schema: HELIX_PROCEDURE_EPOCH_LEDGER_ITEM_SCHEMA,
    ledger_item_id: `procedure_ledger:${hashShort([
      input.situation_run_id,
      input.epoch,
      input.item_kind,
      input.item_ref,
      createdAt,
    ])}`,
    situation_run_id: input.situation_run_id,
    source_binding_id: input.source_binding_id,
    thread_id: input.thread_id,
    environment_id: input.environment_id,
    epoch: input.epoch,
    item_kind: input.item_kind,
    item_ref: input.item_ref,
    summary: input.summary.slice(0, 600),
    causality_refs: Array.from(new Set(input.causality_refs ?? [])).slice(-24),
    assistant_answer: false,
    raw_content_included: false,
    created_at: createdAt,
  };
  const existing = ledgerByRun.get(item.situation_run_id) ?? [];
  ledgerByRun.set(item.situation_run_id, [
    ...existing.filter((entry: HelixProcedureEpochLedgerItem) => entry.ledger_item_id !== item.ledger_item_id),
    item,
  ].slice(-1200));
  return item;
}

export function listProcedureEpochLedger(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  epoch?: number | null;
  limit?: number;
} = {}): HelixProcedureEpochLedgerItem[] {
  const limit = Math.max(0, Math.min(1200, Math.trunc(input.limit ?? 300)));
  return (Array.from(ledgerByRun.values()).flat() as HelixProcedureEpochLedgerItem[])
    .filter((entry: HelixProcedureEpochLedgerItem) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry: HelixProcedureEpochLedgerItem) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry: HelixProcedureEpochLedgerItem) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .filter((entry: HelixProcedureEpochLedgerItem) => input.epoch === undefined || input.epoch === null || entry.epoch === input.epoch)
    .sort((a: HelixProcedureEpochLedgerItem, b: HelixProcedureEpochLedgerItem) => a.created_at.localeCompare(b.created_at))
    .slice(-limit);
}

export function buildProcedureEpochReplay(input: {
  closureId?: string | null;
  situationRunId: string;
  epoch: number;
}): HelixProcedureEpochReplay {
  const ledgerItems = listProcedureEpochLedger({
    situationRunId: input.situationRunId,
    epoch: input.epoch,
    limit: 1000,
  });
  const selectedEvidenceRefs = Array.from(new Set(
    ledgerItems.flatMap((entry: HelixProcedureEpochLedgerItem) =>
      entry.item_kind === "observation" || entry.item_kind === "field_evaluation" || entry.item_kind === "probe_result"
        ? [entry.item_ref, ...entry.causality_refs]
        : entry.causality_refs,
    ),
  )).slice(-80);
  return {
    schema: "helix.procedure_epoch_replay.v1",
    closure_id: input.closureId ?? null,
    situation_run_id: input.situationRunId,
    source_binding_id: ledgerItems.at(-1)?.source_binding_id ?? null,
    thread_id: ledgerItems.at(-1)?.thread_id ?? null,
    environment_id: ledgerItems.at(-1)?.environment_id ?? null,
    epoch: input.epoch,
    ledger_items: ledgerItems,
    causality_graph: ledgerItems.flatMap((entry: HelixProcedureEpochLedgerItem) =>
      entry.causality_refs.map((ref: string) => ({ from: ref, to: entry.item_ref })),
    ),
    selected_evidence_refs: selectedEvidenceRefs,
    terminal_policy_state: "non_terminal_replay",
    poison_authority_status: {
      assistant_answer: false,
      raw_content_included: false,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function resetProcedureEpochLedgerForTest(): void {
  ledgerByRun.clear();
}
