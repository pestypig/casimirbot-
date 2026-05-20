import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA,
  type HelixMinecraftRouteRehearsal,
  type HelixMinecraftRouteStage,
  type HelixMinecraftRouteRehearsalStep,
} from "@shared/helix-minecraft-route-rehearsal";
import type { HelixMinecraftSeedMapClaim } from "@shared/helix-minecraft-seed-map";
import type { MinecraftSpatialGraph, MinecraftSpatialGraphNode } from "./minecraft-spatial-graph";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const roundConfidence = (value: number): number => Math.round(clamp(value) * 100) / 100;

const missingEvidenceCodes = (values: string[]): Array<"target_y_unknown" | "route_corridor_unobserved" | "provider_report_unverified" | "unknown"> => {
  const text = values.join(" ").toLowerCase();
  return Array.from(new Set([
    /y coordinate|target_y_unknown/.test(text) ? "target_y_unknown" as const : null,
    /block-level terrain|route/.test(text) ? "route_corridor_unobserved" as const : null,
    /seed-map/.test(text) ? "provider_report_unverified" as const : null,
  ].filter((entry): entry is "target_y_unknown" | "route_corridor_unobserved" | "provider_report_unverified" => Boolean(entry))));
};

const confidenceWord = (confidence: number): "candidate" | "likely" | "unknown" => {
  if (confidence >= 0.7) return "likely";
  if (confidence >= 0.45) return "candidate";
  return "unknown";
};

const targetTypeForNode = (node: MinecraftSpatialGraphNode): HelixMinecraftRouteStage["target_type"] => {
  if (node.kind === "structure_candidate") return "structure_candidate";
  if (node.kind === "waypoint") return "waypoint";
  return "unknown";
};

const seedClaimFromNode = (node: MinecraftSpatialGraphNode): HelixMinecraftSeedMapClaim | null => {
  if (node.source !== "seed_worldgen") return null;
  return null;
};

export function rehearseMinecraftRoute(input: {
  graph: MinecraftSpatialGraph | null;
  actorLabel?: string | null;
}): HelixMinecraftRouteRehearsal | null {
  const graph = input.graph;
  if (!graph?.candidate_target_node_id) return null;
  const current = graph.nodes.find((node) => node.kind === "current_position");
  const target = graph.nodes.find((node) => node.node_id === graph.candidate_target_node_id);
  if (!current || !target) return null;
  const edge = graph.edges.find((entry) => entry.from_node_id === current.node_id && entry.to_node_id === target.node_id);
  if (!edge) return null;
  const unknownTerrain = edge.missing_evidence.some((entry) => /block-level terrain|route/i.test(entry));
  const targetYUnknown = edge.missing_evidence.some((entry) => /Y coordinate/i.test(entry));
  const riskPenalty = edge.estimated_risk === "high" ? 0.22 : edge.estimated_risk === "medium" ? 0.12 : edge.estimated_risk === "unknown" ? 0.1 : 0;
  const confidence = roundConfidence(
    target.confidence -
      (unknownTerrain ? 0.18 : 0) -
      (targetYUnknown ? 0.1 : 0) -
      riskPenalty -
      (edge.traversal === "unknown" ? 0.08 : 0),
  );
  const middleDistance = Math.max(0, edge.distance_blocks - 300);
  const steps: HelixMinecraftRouteRehearsalStep[] = [
    {
      label: `Leave current observed area toward ${edge.direction}`,
      direction: edge.direction,
      distance_blocks: Math.min(180, edge.distance_blocks),
      risk: edge.estimated_risk,
      requirement: edge.traversal === "walk_likely" ? "walk" as const : "unknown" as const,
    },
    ...(middleDistance > 80
      ? [{
          label: "Cross unobserved terrain gap",
          direction: edge.direction,
          distance_blocks: middleDistance,
          risk: "unknown" as const,
          requirement: "unknown" as const,
        }]
      : []),
    {
      label: `Approach ${target.label} chunk`,
      direction: edge.direction,
      distance_blocks: Math.min(160, edge.distance_blocks),
      risk: targetYUnknown ? "unknown" : edge.estimated_risk,
      requirement: targetYUnknown ? "unknown" as const : "walk" as const,
    },
  ].slice(0, 3);
  const word = confidenceWord(confidence);
  const routeSummary =
    `${word[0].toUpperCase()}${word.slice(1)} route candidate: ${target.label} is ${edge.direction} at about ${edge.distance_blocks} blocks. ` +
    `Walkability evidence is ${edge.traversal === "walk_likely" ? "likely" : "unknown"}; this is route math only.`;
  const evidenceRefs = uniqueStrings([
    ...graph.evidence_refs,
    ...current.evidence_refs,
    ...target.evidence_refs,
  ]).slice(-48);
  const stage: HelixMinecraftRouteStage = {
    stage_id: `minecraft_route_stage:${hashShort([graph.graph_id, current.node_id, target.node_id], 16)}`,
    label: `Candidate path to ${target.label}`,
    from_dimension: current.dimension,
    to_dimension: target.dimension,
    from: current.position,
    to: target.position,
    target_type: targetTypeForNode(target),
    route_basis: uniqueStrings([
      current.evidence_layer,
      target.evidence_layer,
      ...graph.nodes
        .filter((node) => node.kind === "observed_block_area")
        .map((node) => node.evidence_layer),
    ]) as HelixMinecraftRouteStage["route_basis"],
    reachable_confidence: confidence,
    risk: edge.estimated_risk,
    missing_evidence: uniqueStrings([...edge.missing_evidence, ...target.limitations]).slice(0, 8),
    missing_evidence_codes: missingEvidenceCodes([...edge.missing_evidence, ...target.limitations]),
  };
  const targetClaim = seedClaimFromNode(target);
  const missingEvidence = uniqueStrings([
    ...graph.missing_evidence,
    ...edge.missing_evidence,
    ...target.limitations,
    target.may_support_recommendation ? "" : "Seed-map route claims may not support recommendation without the recommendation gate.",
  ]).slice(0, 12);
  return {
    schema: HELIX_MINECRAFT_ROUTE_REHEARSAL_SCHEMA,
    rehearsal_id: `minecraft_route_rehearsal:${hashShort([graph.graph_id, target.node_id, edge.edge_id, confidence], 18)}`,
    room_id: graph.room_id,
    world_id: graph.world_id,
    actor_label: input.actorLabel ?? null,
    evidence_trust: "route_math",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    objective_id: `minecraft_route_objective:auto:${hashShort([graph.graph_id, target.node_id], 14)}`,
    route_kind: target.source === "seed_worldgen" ? "structure_seek" : "single_dimension_waypoint",
    from: { dimension: current.dimension, ...current.position },
    stages: [stage],
    candidate_next_waypoint: {
      label: target.label,
      dimension: target.dimension,
      x: target.position.x,
      y: target.position.y ?? null,
      z: target.position.z,
      expected_direction: edge.direction,
      confidence,
      display_label_scope: "ui_only",
      ask_context_admissible: false,
    },
    route_confidence: confidence,
    raw_user_text_included: false,
    derived_by_deterministic_reducer: true,
    normalized_by_deterministic_reducer: true,
    model_invoked_by_helix: false,
    ts: graph.ts,
    route_basis: stage.route_basis,
    provider_confidence: null,
    helix_fused_confidence: confidence,
    confidence_basis: ["server_blocks", "seed_forecast", "route_math"],
    missing_evidence_codes: missingEvidenceCodes(missingEvidence),
    route_summary_scope: "ui_candidate_only",
    ask_context_admissible: false,
    to: target.position,
    target_label: target.label,
    target_claim: targetClaim,
    route_summary: routeSummary,
    steps,
    reachable_confidence: confidence,
    missing_evidence: missingEvidence,
    evidence_refs: evidenceRefs,
    deterministic: true,
    model_invoked: false,
    raw_logs_included: false,
    context_policy: "compact_context_pack_only",
  };
}
