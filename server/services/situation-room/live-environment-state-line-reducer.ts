import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
} from "@shared/helix-live-answer-environment";
import type { HelixActionRehearsalResult } from "@shared/helix-action-rehearsal";
import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import { updateLiveAnswerEnvironment } from "./live-answer-environment-store";
import { reduceEnvironmentAffordances } from "./environment-affordance-reducer";
import { updateEnvironmentMemoryLedger } from "./environment-memory-ledger";
import { buildPossibilityGraph } from "./possibility-graph-builder";
import { rehearsePossibilityGraph } from "./action-rehearsal-engine";
import { reduceEnvironmentStateSnapshot } from "./environment-state-snapshot-reducer";

const hasLine = (environment: LiveAnswerEnvironment, key: string): boolean =>
  environment.lines.some((line) => line.key === key);

const graphSummary = (graph: HelixPossibilityGraph | null): string =>
  graph
    ? `Possible: ${graph.nodes.filter((node) => node.kind !== "start").map((node) => node.label).join(" -> ")}.`
    : "No action graph generated yet.";

const rehearsalSummary = (result: HelixActionRehearsalResult | null): string =>
  result
    ? `${result.feasibility}; gate ${result.recommendation_gate}${result.blockers.length ? `; blockers: ${result.blockers.map((blocker) => blocker.summary).join("; ")}` : ""}.`
    : "No rehearsal result yet.";

const recommendationSummary = (graph: HelixPossibilityGraph | null, result: HelixActionRehearsalResult | null): string => {
  if (!graph || !result) return "Awaiting rehearsal before recommending action.";
  const takeNode = graph.nodes.find((node) => node.kind === "inventory_action");
  if (result.recommendation_gate === "safe_to_suggest") return `Recommended: ${takeNode?.label ?? "follow rehearsed procedure"}.`;
  if (result.recommendation_gate === "suggest_with_caveat") return `Possible with caveat: ${takeNode?.label ?? "follow candidate procedure"}; ${result.blockers.map((blocker) => blocker.summary).join("; ")}`;
  if (result.recommendation_gate === "needs_user_confirmation") return "Needs operator or user confirmation before recommendation.";
  return "Do not suggest this procedure from current evidence.";
};

export function reduceLiveAnswerEnvironmentFromEnvironmentStateSnapshot(input: {
  environment: LiveAnswerEnvironment | null;
  snapshot: HelixEnvironmentStateSnapshot;
  threadId: string;
  objective?: string | null;
  now?: string;
}): {
  environment: LiveAnswerEnvironment;
  delta: LiveAnswerEnvironmentDelta;
  possibility_graph: HelixPossibilityGraph | null;
  rehearsal_result: HelixActionRehearsalResult | null;
} | null {
  const environment = input.environment;
  if (!environment || environment.status !== "active") return null;
  const now = input.now ?? input.snapshot.ts;
  const reduction = reduceEnvironmentStateSnapshot(input.snapshot);
  const affordances = reduceEnvironmentAffordances(input.snapshot);
  const memory = updateEnvironmentMemoryLedger(input.snapshot);
  const graph = buildPossibilityGraph({
    objective: input.objective ?? environment.objective,
    threadId: input.threadId,
    environmentId: environment.environment_id,
    environmentState: input.snapshot,
    affordanceContext: affordances,
    memoryLedger: memory,
    source: "live_answer_panel",
    now,
  });
  const rehearsal = graph
    ? rehearsePossibilityGraph({ graph, environmentState: input.snapshot, now }).result
    : null;
  const evidenceRefs = Array.from(new Set([
    input.snapshot.snapshot_id,
    ...input.snapshot.evidence_refs,
    ...(graph ? [graph.graph_id] : []),
    ...(rehearsal ? [rehearsal.result_id] : []),
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
  setLine("possibilities", graphSummary(graph), graph ? 0.72 : 0.45);
  setLine("rehearsal", rehearsalSummary(rehearsal), rehearsal ? 0.74 : 0.45);
  setLine("recommendation", recommendationSummary(graph, rehearsal), rehearsal?.recommendation_gate === "safe_to_suggest" ? 0.78 : 0.52);
  setLine("unknowns", reduction.unknowns, 0.62);
  setLine("next_check", graph ? "Watch changed state sections and refresh rehearsal before surfacing a final suggestion." : "Watch changed state sections and request rehearsal for candidate suggestions.", 0.65);
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
  } : null;
}

