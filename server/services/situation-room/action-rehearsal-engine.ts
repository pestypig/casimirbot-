import crypto from "node:crypto";
import {
  HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA,
  HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
  type HelixActionRehearsalRequest,
  type HelixActionRehearsalResult,
} from "@shared/helix-action-rehearsal";
import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";
import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import { rehearseMinecraftGraph } from "./minecraft-rehearsal-adapter";
import { validatePossibilityGraph } from "./possibility-graph-validator";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createActionRehearsalRequest(input: {
  graph: HelixPossibilityGraph;
  mode?: HelixActionRehearsalRequest["rehearsal_mode"];
}): HelixActionRehearsalRequest {
  return {
    schema: HELIX_ACTION_REHEARSAL_REQUEST_SCHEMA,
    request_id: `action_rehearsal_request:${hashShort([input.graph.graph_id, input.mode ?? "state_snapshot_only"])}`,
    graph_id: input.graph.graph_id,
    domain: input.graph.domain,
    rehearsal_mode: input.mode ?? "state_snapshot_only",
    allowed_effects: "simulation_only",
    require_human_approval_for_execution: true,
    evidence_refs: input.graph.source_snapshot_refs,
    assistant_answer: false,
  };
}

export function rehearsePossibilityGraph(input: {
  graph: HelixPossibilityGraph;
  environmentState: HelixEnvironmentStateSnapshot;
  request?: HelixActionRehearsalRequest | null;
  now?: string;
}): { request: HelixActionRehearsalRequest; result: HelixActionRehearsalResult } {
  const request = input.request ?? createActionRehearsalRequest({ graph: input.graph });
  const validation = validatePossibilityGraph(input.graph);
  if (!validation.ok) {
    const now = input.now ?? new Date().toISOString();
    return {
      request,
      result: {
        schema: HELIX_ACTION_REHEARSAL_RESULT_SCHEMA,
        result_id: `action_rehearsal_result:${hashShort([request.request_id, "invalid"])}`,
        request_id: request.request_id,
        graph_id: input.graph.graph_id,
        feasibility: "blocked",
        confidence: 0.2,
        checked_nodes: input.graph.nodes.map((node) => ({
          node_id: node.node_id,
          status: node.kind === "start" ? "passed" : "skipped",
          summary: "Graph validation failed before node rehearsal.",
          evidence_refs: node.evidence_refs,
        })),
        blockers: validation.issues.map((issue) => ({
          code: issue.code,
          summary: issue.summary,
          severity: issue.severity === "error" ? "critical" : "warn",
          evidence_refs: input.graph.source_snapshot_refs,
        })),
        recommendation_gate: "do_not_suggest",
        tested_in: request.rehearsal_mode,
        side_effects_performed: false,
        model_invoked: false,
        deterministic: true,
        assistant_answer: false,
        raw_content_included: false,
        context_policy: "compact_context_pack_only",
        created_at: now,
      },
    };
  }
  const result = input.graph.domain === "minecraft"
    ? rehearseMinecraftGraph({ graph: input.graph, request, environmentState: input.environmentState, now: input.now })
    : rehearseMinecraftGraph({ graph: input.graph, request, environmentState: input.environmentState, now: input.now });
  return { request, result };
}

