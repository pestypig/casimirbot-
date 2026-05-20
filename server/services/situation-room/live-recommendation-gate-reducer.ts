import crypto from "node:crypto";
import type { HelixActionRehearsalResult } from "@shared/helix-action-rehearsal";
import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import {
  HELIX_RECOMMENDATION_GATE_SCHEMA,
  type HelixRecommendationGate,
  type HelixRecommendationGateStatus,
} from "@shared/helix-recommendation-gate";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type { HelixEnvironmentAffordanceContext } from "./environment-affordance-reducer";

export type RecommendationGateLineValue = {
  value: string;
  confidence?: number | null;
  evidence_refs?: string[];
  source: "deterministic_reducer";
  model_invoked: false;
  deterministic: true;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const label = (value: string): string =>
  value.replace(/minecraft:/g, "").replace(/_/g, " ");

const actionLabel = (graph: HelixPossibilityGraph): string =>
  graph.nodes.find((node) => node.kind === "inventory_action")?.label ??
  graph.nodes.find((node) => node.kind !== "start")?.label ??
  "follow the rehearsed procedure";

const graphSummary = (graph: HelixPossibilityGraph | null): string =>
  graph
    ? `Candidate: ${graph.nodes.filter((node) => node.kind !== "start").map((node) => node.label).join(" -> ")}.`
    : "No candidate procedure graph.";

const rehearsalSummary = (result: HelixActionRehearsalResult | null): string => {
  if (!result) return "Not rehearsed yet.";
  if (result.feasibility === "feasible") return "Dry-run passed: route and resource checks are feasible.";
  if (result.feasibility === "partial") return `Partial: ${result.blockers.map((blocker) => blocker.summary).join("; ") || "some checks were inconclusive"}.`;
  if (result.feasibility === "blocked") return `Blocked: ${result.blockers.map((blocker) => blocker.summary).join("; ") || "rehearsal failed"}.`;
  if (result.feasibility === "risky") return `Risky: ${result.blockers.map((blocker) => blocker.summary).join("; ") || "risk exceeded the gate"}.`;
  return "Rehearsal could not determine feasibility.";
};

const statusFrom = (input: {
  graph: HelixPossibilityGraph | null;
  rehearsal: HelixActionRehearsalResult | null;
  snapshot: HelixEnvironmentStateSnapshot | null;
}): HelixRecommendationGateStatus => {
  if (!input.graph) return "not_considered";
  if (input.snapshot && !input.graph.source_snapshot_refs.includes(input.snapshot.snapshot_id)) return "stale";
  if (!input.rehearsal) return "awaiting_rehearsal";
  if (input.rehearsal.recommendation_gate === "needs_user_confirmation") return "needs_user_confirmation";
  if (input.rehearsal.recommendation_gate === "safe_to_suggest" && input.rehearsal.feasibility === "feasible") return "safe_to_suggest";
  if (input.rehearsal.recommendation_gate === "suggest_with_caveat" || input.rehearsal.feasibility === "partial") return "suggest_with_caveat";
  return "blocked";
};

export function buildRecommendationGate(input: {
  environment: LiveAnswerEnvironment | null;
  snapshot: HelixEnvironmentStateSnapshot | null;
  affordanceContext?: HelixEnvironmentAffordanceContext | null;
  graph?: HelixPossibilityGraph | null;
  rehearsal?: HelixActionRehearsalResult | null;
  objective: string;
  threadId: string;
  now?: string;
}): HelixRecommendationGate {
  const now = input.now ?? new Date().toISOString();
  const graph = input.graph ?? null;
  const rehearsal = input.rehearsal ?? null;
  const snapshot = input.snapshot ?? null;
  const status = statusFrom({ graph, rehearsal, snapshot });
  const blockers = (rehearsal?.blockers ?? []).map((blocker) => ({
    code: blocker.code,
    summary: blocker.summary,
    severity: blocker.severity === "critical" ? "critical" as const : "warn" as const,
    evidence_refs: blocker.evidence_refs,
  }));
  const recommendationText = graph && (status === "safe_to_suggest" || status === "needs_user_confirmation")
    ? `${actionLabel(graph)}.`
    : graph && status === "suggest_with_caveat"
      ? `Recheck the evidence, then consider: ${actionLabel(graph)}.`
      : null;
  const caveatText = status === "suggest_with_caveat"
    ? blockers.map((blocker) => blocker.summary).join("; ") || "Rehearsal was only partial."
    : null;
  const evidenceRefs = Array.from(new Set([
    ...(snapshot ? [snapshot.snapshot_id, ...snapshot.evidence_refs] : []),
    ...(graph ? [graph.graph_id, ...graph.source_snapshot_refs] : []),
    ...(rehearsal ? [rehearsal.result_id, ...rehearsal.blockers.flatMap((blocker) => blocker.evidence_refs)] : []),
  ])).slice(-32);
  return {
    schema: HELIX_RECOMMENDATION_GATE_SCHEMA,
    gate_id: `recommendation_gate:${hashShort([
      input.threadId,
      input.environment?.environment_id ?? null,
      snapshot?.snapshot_id ?? null,
      graph?.graph_id ?? null,
      rehearsal?.result_id ?? null,
      status,
    ])}`,
    thread_id: input.threadId,
    environment_id: input.environment?.environment_id ?? null,
    domain: snapshot?.domain ?? graph?.domain ?? "custom",
    objective: input.objective,
    possibility_graph_id: graph?.graph_id ?? null,
    rehearsal_result_id: rehearsal?.result_id ?? null,
    status,
    recommendation_text: recommendationText,
    caveat_text: caveatText,
    reason: status === "not_considered"
      ? "No possibility graph exists."
      : status === "awaiting_rehearsal"
        ? "Possibility graph exists, but no rehearsal result has validated it."
        : status === "stale"
          ? "Possibility graph is stale relative to the newest snapshot."
          : status === "blocked"
            ? "Rehearsal blocked the recommendation."
            : status === "suggest_with_caveat"
              ? "Rehearsal partially validated the graph with caveats."
              : status === "needs_user_confirmation"
                ? "The next step needs explicit user confirmation."
                : "Rehearsal validated the graph as safe to suggest.",
    blockers,
    evidence_refs: evidenceRefs,
    source_snapshot_refs: Array.from(new Set([
      ...(snapshot ? [snapshot.snapshot_id] : []),
      ...(graph?.source_snapshot_refs ?? []),
    ])),
    side_effects_performed: false,
    require_human_approval_for_execution: true,
    deterministic: rehearsal?.deterministic !== false,
    model_invoked: rehearsal?.model_invoked === true || graph?.model_invoked === true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}

export function lineValuesFromRecommendationGate(input: {
  gate: HelixRecommendationGate;
  graph?: HelixPossibilityGraph | null;
  rehearsal?: HelixActionRehearsalResult | null;
  affordanceContext?: HelixEnvironmentAffordanceContext | null;
}): Record<string, RecommendationGateLineValue> {
  const refs = input.gate.evidence_refs;
  const values: Record<string, RecommendationGateLineValue> = {};
  if (input.graph) {
    values.possibilities = {
      value: graphSummary(input.graph),
      confidence: 0.72,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  if (input.rehearsal) {
    values.rehearsal = {
      value: rehearsalSummary(input.rehearsal),
      confidence: input.rehearsal.confidence,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  } else if (input.graph) {
    values.rehearsal = {
      value: "Not rehearsed yet.",
      confidence: 0.45,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  if (
    input.gate.status === "safe_to_suggest" ||
    input.gate.status === "suggest_with_caveat" ||
    input.gate.status === "needs_user_confirmation"
  ) {
    values.recommendation = {
      value: [
        input.gate.recommendation_text ?? "Needs user confirmation before suggesting action.",
        input.gate.caveat_text ? `Caveat: ${input.gate.caveat_text}` : null,
      ].filter(Boolean).join(" "),
      confidence: input.gate.status === "safe_to_suggest" ? 0.8 : 0.6,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  if (input.gate.blockers.length > 0 || input.gate.status === "stale" || input.gate.status === "blocked") {
    values.unknowns = {
      value: `${input.gate.status}: ${input.gate.blockers.map((blocker) => blocker.summary).join("; ") || input.gate.reason}`,
      confidence: 0.7,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  values.next_check = {
    value: input.gate.status === "awaiting_rehearsal"
      ? "Run read-only rehearsal before surfacing a recommendation."
      : input.gate.status === "safe_to_suggest"
        ? "Refresh state before acting; execution still requires human approval."
        : input.gate.status === "suggest_with_caveat"
          ? "Refresh stale or partial checks before relying on the procedure."
          : input.gate.status === "blocked"
            ? "Resolve blockers before reconsidering this procedure."
            : input.gate.status === "stale"
              ? "Regenerate the graph from the newest snapshot."
              : "Watch changed state sections and request rehearsal for candidate suggestions.",
    confidence: 0.66,
    evidence_refs: refs,
    source: "deterministic_reducer",
    model_invoked: false,
    deterministic: true,
  };
  if (input.affordanceContext && input.affordanceContext.visible.length > 0 && !values.possibilities && input.gate.status !== "safe_to_suggest") {
    values.possibilities = {
      value: `Visible affordances: ${input.affordanceContext.visible.map(label).join(", ")}. No candidate procedure graph yet.`,
      confidence: 0.5,
      evidence_refs: refs,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  }
  return values;
}

