import crypto from "node:crypto";
import {
  HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
  type HelixActionRehearsalRequest,
  type HelixActionRehearsalResult,
} from "@shared/helix-action-rehearsal";
import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const foodPattern = /(?:apple|bread|carrot|potato|beef|porkchop|chicken|mutton|rabbit|stew|soup|melon|cookie|fish|cod|salmon|food)/i;

const minutesOld = (value: string | null | undefined, now: string): number | null => {
  if (!value) return null;
  const then = Date.parse(value);
  const parsedNow = Date.parse(now);
  if (!Number.isFinite(then) || !Number.isFinite(parsedNow)) return null;
  return Math.max(0, (parsedNow - then) / 60_000);
};

export function rehearseMinecraftGraph(input: {
  graph: HelixPossibilityGraph;
  request: HelixActionRehearsalRequest;
  environmentState: HelixEnvironmentStateSnapshot;
  now?: string;
}): HelixActionRehearsalResult {
  const now = input.now ?? new Date().toISOString();
  const containers = input.environmentState.object_state?.nearby_containers ?? [];
  const foodContainer = containers.find((container) =>
    (container.contents_summary ?? []).some((item) => foodPattern.test(item.item_type) && item.count > 0)
  );
  const age = minutesOld(foodContainer?.last_verified_at ?? input.environmentState.ts, now);
  const routeUnknown = !foodContainer && input.graph.nodes.some((node) => node.kind === "navigation");
  const staleContainer = typeof age === "number" && age > 30;
  const blockers: HelixActionRehearsalResult["blockers"] = [];
  if (!foodContainer) {
    blockers.push({
      code: "container_food_not_verified",
      summary: "No fresh structured container state confirms available food.",
      severity: "critical",
      evidence_refs: input.environmentState.evidence_refs,
    });
  }
  if (staleContainer) {
    blockers.push({
      code: "container_memory_stale",
      summary: `Container contents were last verified about ${Math.round(age ?? 0)} minutes ago.`,
      severity: "warn",
      evidence_refs: input.environmentState.evidence_refs,
    });
  }
  if (routeUnknown) {
    blockers.push({
      code: "route_unknown",
      summary: "Route or reachability is not verified in the latest snapshot.",
      severity: "warn",
      evidence_refs: input.environmentState.evidence_refs,
    });
  }
  const feasibility = blockers.some((blocker) => blocker.severity === "critical")
    ? "blocked"
    : blockers.length > 0
      ? "partial"
      : "feasible";
  const recommendationGate = feasibility === "feasible"
    ? "safe_to_suggest"
    : feasibility === "partial"
      ? "suggest_with_caveat"
      : "do_not_suggest";
  return {
    schema: HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
    result_id: `action_rehearsal_result:${hashShort([input.request.request_id, input.environmentState.snapshot_id, blockers])}`,
    request_id: input.request.request_id,
    graph_id: input.graph.graph_id,
    feasibility,
    confidence: feasibility === "feasible" ? 0.82 : feasibility === "partial" ? 0.58 : 0.24,
    checked_nodes: input.graph.nodes.map((node) => ({
      node_id: node.node_id,
      status: blockers.some((blocker) => blocker.severity === "critical") && node.kind === "inventory_action"
        ? "failed"
        : staleContainer && (node.kind === "inventory_action" || node.kind === "verify")
          ? "risky"
          : "passed",
      summary: node.kind === "inventory_action"
        ? foodContainer
          ? "Container food state is available for read-only rehearsal."
          : "Container food state is not verified."
        : "Node survived structural read-only rehearsal.",
      evidence_refs: node.evidence_refs,
    })),
    blockers,
    expected_outcome: foodContainer
      ? `Actor can plausibly retrieve ${(foodContainer.contents_summary ?? []).find((item) => foodPattern.test(item.item_type))?.item_type ?? "food"} before continuing.`
      : null,
    recommendation_gate: recommendationGate,
    tested_in: input.request.rehearsal_mode,
    side_effects_performed: false,
    model_invoked: false,
    deterministic: true,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}
