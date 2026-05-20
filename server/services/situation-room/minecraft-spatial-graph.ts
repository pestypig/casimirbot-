import crypto from "node:crypto";
import type { HelixMinecraftSeedMapClaim } from "@shared/helix-minecraft-seed-map";
import type {
  HelixMinecraftAskContextPolicy,
  HelixMinecraftEvidenceLayer,
  HelixMinecraftEvidenceTrust,
  HelixMinecraftInstructionAuthority,
} from "@shared/helix-minecraft-evidence";
import type { HelixMinecraftSpatialEpisode } from "@shared/helix-minecraft-spatial-episode";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";
import type { HelixMinecraftWorldSenseContext } from "@shared/helix-minecraft-world-sense";

export type MinecraftSpatialGraphNodeKind =
  | "current_position"
  | "observed_block_area"
  | "structure_candidate"
  | "biome_region"
  | "waypoint"
  | "hazard"
  | "unknown_gap";

export type MinecraftSpatialGraphTraversal =
  | "walk_likely"
  | "jump_likely"
  | "swim_possible"
  | "dig_required"
  | "bridge_required"
  | "unknown";

export type MinecraftSpatialGraphNode = {
  node_id: string;
  dimension: string;
  position: { x: number; y?: number | null; z: number };
  kind: MinecraftSpatialGraphNodeKind;
  label: string;
  confidence: number;
  evidence_layer: HelixMinecraftEvidenceLayer;
  evidence_trust: HelixMinecraftEvidenceTrust;
  instruction_authority: HelixMinecraftInstructionAuthority;
  ask_context_policy: HelixMinecraftAskContextPolicy;
  source: "observed_world_event" | "seed_worldgen" | "hybrid_seed_observed";
  sensor_scope: "player_observable" | "sensor_observable" | "unknown";
  limitations: string[];
  may_support_recommendation: boolean;
  evidence_refs: string[];
};

export type MinecraftSpatialGraphEdge = {
  edge_id: string;
  from_node_id: string;
  to_node_id: string;
  traversal: MinecraftSpatialGraphTraversal;
  distance_blocks: number;
  direction: string;
  estimated_risk: "low" | "medium" | "high" | "unknown";
  blockers: string[];
  missing_evidence: string[];
};

export type MinecraftSpatialGraph = {
  schema: "helix.minecraft_spatial_graph.v1";
  graph_id: string;
  room_id: string;
  world_id: string;
  dimension: string;
  nodes: MinecraftSpatialGraphNode[];
  edges: MinecraftSpatialGraphEdge[];
  candidate_target_node_id?: string | null;
  summary: string;
  missing_evidence: string[];
  evidence_refs: string[];
  ts: string;
  deterministic: true;
  model_invoked: false;
  context_policy: "compact_context_pack_only";
  raw_logs_included: false;
};

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const distance2d = (from: { x: number; z: number }, to: { x: number; z: number }): number =>
  Math.round(Math.hypot(to.x - from.x, to.z - from.z));

export const directionBetween = (from: { x: number; z: number }, to: { x: number; z: number }): string => {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) < 1 && Math.abs(dz) < 1) return "here";
  const eastWest = Math.abs(dx) < 32 ? "" : dx >= 0 ? "east" : "west";
  const northSouth = Math.abs(dz) < 32 ? "" : dz >= 0 ? "south" : "north";
  return [northSouth, eastWest].filter(Boolean).join("-") || (Math.abs(dx) >= Math.abs(dz) ? eastWest : northSouth);
};

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const nodeKindForClaim = (claim: HelixMinecraftSeedMapClaim): MinecraftSpatialGraphNodeKind => {
  if (claim.kind === "biome") return "biome_region";
  if (claim.kind === "structure_candidate") return "structure_candidate";
  return "waypoint";
};

const riskFromContext = (context?: HelixMinecraftWorldSenseContext | null): "low" | "medium" | "high" | "unknown" => {
  const notes = [...(context?.environment_notes ?? []), ...(context?.missing_evidence ?? [])].join(" ").toLowerCase();
  if (/lava|hostile|fire|fall/.test(notes)) return "medium";
  if (!context) return "unknown";
  return "low";
};

export function reduceMinecraftSpatialGraph(input: {
  roomId: string;
  worldId: string;
  spatialEvent?: HelixMinecraftSpatialEvent | null;
  spatialEpisode?: HelixMinecraftSpatialEpisode | null;
  worldSenseContext?: HelixMinecraftWorldSenseContext | null;
  seedClaims: HelixMinecraftSeedMapClaim[];
  selectedTargetLabel?: string | null;
}): MinecraftSpatialGraph | null {
  if (!input.spatialEvent || input.seedClaims.length === 0) return null;
  const dimension = input.spatialEvent.dimension;
  const currentNode: MinecraftSpatialGraphNode = {
    node_id: `minecraft_spatial_node:${hashShort([input.spatialEvent.event_id, "current"], 16)}`,
    dimension,
    position: input.spatialEvent.location,
    kind: "current_position",
    label: input.spatialEvent.actor_label ? `${input.spatialEvent.actor_label} current position` : "current position",
    confidence: 0.92,
    evidence_layer: "observed_current_world",
    evidence_trust: "server_observation",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    source: "observed_world_event",
    sensor_scope: "player_observable",
    limitations: [],
    may_support_recommendation: true,
    evidence_refs: input.spatialEvent.evidence_refs,
  };
  const nodes: MinecraftSpatialGraphNode[] = [currentNode];
  if (input.spatialEpisode) {
    nodes.push({
      node_id: `minecraft_spatial_node:${hashShort([input.spatialEpisode.episode_id, "observed_area"], 16)}`,
      dimension,
      position: {
        x: Math.round((input.spatialEpisode.bounding_box.min.x + input.spatialEpisode.bounding_box.max.x) / 2),
        y: Math.round((input.spatialEpisode.bounding_box.min.y + input.spatialEpisode.bounding_box.max.y) / 2),
        z: Math.round((input.spatialEpisode.bounding_box.min.z + input.spatialEpisode.bounding_box.max.z) / 2),
      },
      kind: "observed_block_area",
      label: "recent observed block area",
      confidence: 0.84,
      evidence_layer: "observed_current_world",
      evidence_trust: "server_observation",
      instruction_authority: "none",
      ask_context_policy: "evidence_only",
      source: "observed_world_event",
      sensor_scope: "player_observable",
      limitations: input.spatialEpisode.known_unknowns,
      may_support_recommendation: true,
      evidence_refs: input.spatialEpisode.evidence_refs,
    });
  }

  for (const claim of input.seedClaims.filter((claim) => claim.dimension === dimension)) {
    nodes.push({
      node_id: `minecraft_spatial_node:${hashShort([claim.claim_id], 16)}`,
      dimension: claim.dimension,
      position: claim.position,
      kind: nodeKindForClaim(claim),
      label: claim.label,
      confidence: clamp(claim.confidence),
      evidence_layer: claim.evidence_layer,
      evidence_trust: claim.evidence_trust,
      instruction_authority: claim.instruction_authority,
      ask_context_policy: claim.ask_context_policy,
      source: claim.source,
      sensor_scope: claim.sensor_scope === "sensor_observable" ? "sensor_observable" : "unknown",
      limitations: claim.limitations,
      may_support_recommendation: claim.may_support_recommendation,
      evidence_refs: claim.evidence_refs,
    });
  }

  const seedTargetNodes = nodes
    .filter((node) => node.source === "seed_worldgen" && (node.kind === "structure_candidate" || node.kind === "waypoint"))
    .sort((a, b) => distance2d(currentNode.position, a.position) - distance2d(currentNode.position, b.position));
  const selected = input.selectedTargetLabel?.toLowerCase() ?? null;
  const targetNode = selected
    ? seedTargetNodes.find((node) => node.label.toLowerCase().includes(selected) || selected.includes(node.label.toLowerCase())) ?? seedTargetNodes[0]
    : seedTargetNodes[0];
  const contextRisk = riskFromContext(input.worldSenseContext);
  const edges: MinecraftSpatialGraphEdge[] = seedTargetNodes.slice(0, 4).map((node) => {
    const distance = distance2d(currentNode.position, node.position);
    const hasUnknownY = node.position.y === null || node.position.y === undefined || node.limitations.includes("target_y_unknown");
    const missingEvidence = uniqueStrings([
      "No block-level terrain scan for the route.",
      hasUnknownY ? "No Y coordinate for the target structure candidate." : "",
      contextRisk === "unknown" ? "No recent hostile/light samples along the route." : "",
    ]);
    return {
      edge_id: `minecraft_spatial_edge:${hashShort([currentNode.node_id, node.node_id, distance], 16)}`,
      from_node_id: currentNode.node_id,
      to_node_id: node.node_id,
      traversal: distance > 160 || hasUnknownY ? "unknown" : "walk_likely",
      distance_blocks: distance,
      direction: directionBetween(currentNode.position, node.position),
      estimated_risk: contextRisk,
      blockers: hasUnknownY ? ["target_y_unknown"] : [],
      missing_evidence: missingEvidence,
    };
  });
  const missingEvidence = uniqueStrings([
    ...input.seedClaims.flatMap((claim) => claim.limitations),
    ...edges.flatMap((edge) => edge.missing_evidence),
  ]);
  const evidenceRefs = uniqueStrings([
    ...input.spatialEvent.evidence_refs,
    ...(input.spatialEpisode?.evidence_refs ?? []),
    ...(input.worldSenseContext?.evidence_refs ?? []),
    ...input.seedClaims.flatMap((claim) => claim.evidence_refs),
  ]).slice(-48);
  const summary = targetNode
    ? `Nearest seed-map candidate is ${targetNode.label} ${directionBetween(currentNode.position, targetNode.position)} at about ${distance2d(currentNode.position, targetNode.position)} blocks.`
    : "No seed-map structure candidate is available for route rehearsal.";
  return {
    schema: "helix.minecraft_spatial_graph.v1",
    graph_id: `minecraft_spatial_graph:${hashShort([input.roomId, input.worldId, currentNode.position, nodes.map((node) => node.node_id)], 18)}`,
    room_id: input.roomId,
    world_id: input.worldId,
    dimension,
    nodes,
    edges,
    candidate_target_node_id: targetNode?.node_id ?? null,
    summary,
    missing_evidence: missingEvidence.slice(-16),
    evidence_refs: evidenceRefs,
    ts: input.spatialEvent.ts,
    deterministic: true,
    model_invoked: false,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
  };
}
