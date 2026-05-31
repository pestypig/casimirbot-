import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
} from "@shared/helix-live-answer-environment";
import type { HelixActionRehearsalResult } from "@shared/helix-action-rehearsal";
import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import type { HelixRecommendationGate } from "@shared/helix-recommendation-gate";
import { updateLiveAnswerEnvironment } from "./live-answer-environment-store";
import { reduceEnvironmentAffordances } from "./environment-affordance-reducer";
import { updateEnvironmentMemoryLedger } from "./environment-memory-ledger";
import { updateEnvironmentRiskResourceLedgerFromSnapshot } from "./environment-risk-resource-ledger";
import { buildPossibilityGraph } from "./possibility-graph-builder";
import { rehearsePossibilityGraph } from "./action-rehearsal-engine";
import { reduceEnvironmentStateSnapshot } from "./environment-state-snapshot-reducer";
import {
  auditEnvironmentSourceContract,
  type EnvironmentSourceContractAudit,
} from "./environment-source-contract-validator";
import { isRedundantEnvironmentStateSnapshot } from "./environment-state-snapshot-window";
import {
  buildRecommendationGate,
  lineValuesFromRecommendationGate,
} from "./live-recommendation-gate-reducer";

const hasLine = (environment: LiveAnswerEnvironment, key: string): boolean =>
  environment.lines.some((line) => line.key === key);

export function reduceLiveAnswerEnvironmentFromEnvironmentStateSnapshot(input: {
  environment: LiveAnswerEnvironment | null;
  snapshot: HelixEnvironmentStateSnapshot;
  threadId: string;
  objective?: string | null;
  autoRehearse?: boolean;
  now?: string;
}): {
  environment: LiveAnswerEnvironment;
  delta: LiveAnswerEnvironmentDelta;
  possibility_graph: HelixPossibilityGraph | null;
  rehearsal_result: HelixActionRehearsalResult | null;
  recommendation_gate: HelixRecommendationGate;
  contract_audits: EnvironmentSourceContractAudit[];
} | null {
  const environment = input.environment;
  if (!environment || environment.status !== "active") return null;
  const now = input.now ?? input.snapshot.ts;
  const snapshotAudit = auditEnvironmentSourceContract({ subject: input.snapshot, now });
  if (!snapshotAudit.ok || isRedundantEnvironmentStateSnapshot(input.snapshot)) return null;
  const reduction = reduceEnvironmentStateSnapshot(input.snapshot);
  const affordances = reduceEnvironmentAffordances(input.snapshot);
  const affordanceAudit = auditEnvironmentSourceContract({ subject: affordances, now });
  const memory = updateEnvironmentMemoryLedger(input.snapshot);
  updateEnvironmentRiskResourceLedgerFromSnapshot(input.snapshot);
  const graphCandidate = buildPossibilityGraph({
    objective: input.objective ?? environment.objective,
    threadId: input.threadId,
    environmentId: environment.environment_id,
    environmentState: input.snapshot,
    affordanceContext: affordances,
    memoryLedger: memory,
    source: "live_answer_panel",
    now,
  });
  const graphAudit = graphCandidate
    ? auditEnvironmentSourceContract({ subject: graphCandidate, now })
    : null;
  const graph = graphAudit?.ok ? graphCandidate : null;
  const rehearsalPack = graph && input.autoRehearse !== false
    ? rehearsePossibilityGraph({ graph, environmentState: input.snapshot, now })
    : null;
  const requestAudit = rehearsalPack
    ? auditEnvironmentSourceContract({ subject: rehearsalPack.request, now })
    : null;
  const rehearsalAudit = rehearsalPack
    ? auditEnvironmentSourceContract({
        subject: rehearsalPack.result,
        rehearsalRequest: rehearsalPack.request,
        now,
      })
    : null;
  const rehearsal = requestAudit?.ok && rehearsalAudit?.ok
    ? rehearsalPack?.result ?? null
    : null;
  const gate = buildRecommendationGate({
    environment,
    snapshot: input.snapshot,
    affordanceContext: affordances,
    graph,
    rehearsal,
    objective: input.objective ?? environment.objective,
    threadId: input.threadId,
    now,
  });
  const gateAudit = auditEnvironmentSourceContract({ subject: gate, now });
  if (!gateAudit.ok) return null;
  const evidenceRefs = Array.from(new Set([
    input.snapshot.snapshot_id,
    ...input.snapshot.evidence_refs,
    ...(graph ? [graph.graph_id] : []),
    ...(rehearsal ? [rehearsal.result_id] : []),
    gate.gate_id,
  ])).slice(-24);
  const lineValues: Parameters<typeof updateLiveAnswerEnvironment>[0]["line_values"] = {};
  const setLine = (key: string, value: string, confidence = 0.72) => {
    if (!hasLine(environment, key)) return;
    lineValues[key] = {
      value,
      confidence,
      evidence_refs: evidenceRefs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  };
  setLine("situation", reduction.situation, 0.76);
  setLine("now", reduction.situation, 0.7);
  setLine("actor_state", reduction.actor_state, 0.76);
  setLine("resources", reduction.resources, 0.74);
  setLine("affordances", [
    affordances.visible.length ? `Visible: ${affordances.visible.join(", ")}` : null,
    affordances.reachable.length ? `Reachable: ${affordances.reachable.join(", ")}` : null,
    affordances.usable.length ? `Usable: ${affordances.usable.join(", ")}` : null,
  ].filter(Boolean).join(". ") || "Awaiting affordance reducer or latest focus target.", 0.68);
  setLine("risk", reduction.risk, reduction.risk.startsWith("No risk") ? 0.55 : 0.82);
  setLine("unknowns", reduction.unknowns, 0.62);
  for (const [key, value] of Object.entries(lineValuesFromRecommendationGate({
    gate,
    graph,
    rehearsal,
    affordanceContext: affordances,
  }))) {
    setLine(key, value.value, value.confidence ?? 0.66);
    if (lineValues[key]) {
      lineValues[key] = {
        ...lineValues[key],
        evidence_refs: Array.from(new Set([...(value.evidence_refs ?? []), ...evidenceRefs])).slice(-24),
      };
    }
  }
  if (Object.keys(lineValues).length === 0) return null;
  const delta = updateLiveAnswerEnvironment({
    environment_id: environment.environment_id,
    reason: rehearsal ? "line_reasoning_update" : "source_event",
    line_values: lineValues,
    latest_summary: reduction.situation,
    evidence_refs: evidenceRefs,
    now,
    source_event_count: 1,
  });
  return delta ? {
    environment: delta.environment,
    delta: delta.delta,
    possibility_graph: graph,
    rehearsal_result: rehearsal,
    recommendation_gate: gate,
    contract_audits: [
      snapshotAudit,
      affordanceAudit,
      ...(graphAudit ? [graphAudit] : []),
      ...(requestAudit ? [requestAudit] : []),
      ...(rehearsalAudit ? [rehearsalAudit] : []),
      gateAudit,
    ],
  } : null;
}
