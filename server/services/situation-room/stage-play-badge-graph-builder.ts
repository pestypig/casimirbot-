import crypto from "node:crypto";
import {
  buildStagePlayBadgeGraphV1,
  type StagePlayBadgeEdgeRelationV1,
  type StagePlayBadgeGraphV1,
  type StagePlayBadgeSourceRefV1,
  type StagePlayBadgeStatusV1,
  type StagePlayBadgeV1,
  type StagePlayIntentVerbV1,
  type StagePlayLiveBindingKindV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import type {
  EnvironmentCellSummary,
  HelixEnvironmentStateSnapshot,
} from "@shared/helix-environment-state-snapshot";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { HelixEnvironmentAffordanceContext } from "./environment-affordance-reducer";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniq = <T>(items: T[]): T[] => Array.from(new Set(items));

const slug = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "unknown";

const hasTag = (cell: EnvironmentCellSummary, pattern: RegExp): boolean =>
  (cell.tags ?? []).some((tag) => pattern.test(tag)) || pattern.test(cell.cell_type);

const cellLabel = (cell: EnvironmentCellSummary): string =>
  cell.position
    ? `${cell.cell_type} @ ${cell.position.x},${cell.position.y},${cell.position.z ?? "?"}`
    : cell.cell_type;

const compactCellValue = (cell: EnvironmentCellSummary): string =>
  [
    cell.cell_type,
    cell.position ? `${cell.position.x},${cell.position.y},${cell.position.z ?? "?"}` : null,
    cell.tags?.length ? cell.tags.join("|") : null,
  ].filter(Boolean).join(" ");

const graphEvidenceRefs = (
  snapshot: HelixEnvironmentStateSnapshot,
  observations: LiveSourceObservation[],
): string[] =>
  uniq([
    snapshot.snapshot_id,
    ...snapshot.evidence_refs,
    ...observations.map((observation) => observation.observation_id),
    ...observations.flatMap((observation) => observation.evidence_refs),
  ]).filter(Boolean);

const sourceFreshness = (
  observations: LiveSourceObservation[],
): "fresh" | "stale" | "missing" | "mixed" | "unknown" => {
  const statuses = uniq(observations.map((observation) => observation.freshness.status));
  if (statuses.length === 0) return "unknown";
  if (statuses.length > 1) return "mixed";
  const status = statuses[0];
  return status === "blocked" ? "missing" : status;
};

const baseSourceRefs = (
  snapshot: HelixEnvironmentStateSnapshot,
  observations: LiveSourceObservation[],
): StagePlayBadgeSourceRefV1[] => [
  {
    kind: "environment_state_snapshot",
    id: snapshot.snapshot_id,
    note: "Rich environment-state snapshot supplies transient world truth.",
  },
  ...observations.map((observation) => ({
    kind: "live_source_observation" as const,
    id: observation.observation_id,
    note: "Compact admitted live-source observation linked to richer evidence refs.",
  })),
];

const pushUniqueBadge = (badges: StagePlayBadgeV1[], badge: StagePlayBadgeV1): void => {
  if (!badges.some((entry) => entry.id === badge.id)) badges.push(badge);
};

const pushUniqueEdge = (
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    id: string;
    from: string;
    to: string;
    relation: StagePlayBadgeEdgeRelationV1;
    label: string;
    evidenceRefs: string[];
    reasonCodes?: string[];
  },
): void => {
  if (!edges.some((entry) => entry.id === input.id)) {
    edges.push({
      id: input.id,
      from: input.from,
      to: input.to,
      relation: input.relation,
      label: input.label,
      evidenceRefs: input.evidenceRefs,
      reasonCodes: input.reasonCodes ?? [],
    });
  }
};

const makeBadge = (input: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  kind: StagePlayBadgeV1["kind"];
  status?: StagePlayBadgeStatusV1;
  subjects: string[];
  tags?: string[];
  sourceRefs: StagePlayBadgeSourceRefV1[];
  evidenceRefs: string[];
  confidence?: number;
  reasonCodes?: string[];
  missingEvidence?: string[];
  liveBindings?: StagePlayBadgeV1["liveBindings"];
  intentVerb?: StagePlayIntentVerbV1;
  actorId?: string | null;
  targetId?: string | null;
  preserves?: string[];
  requires?: string[];
  blocks?: string[];
  admission?: "auto" | "ask_user" | "blocked" | null;
}): StagePlayBadgeV1 => ({
  id: input.id,
  title: input.title,
  plainMeaning: input.plainMeaning,
  whyItMatters: input.whyItMatters,
  kind: input.kind,
  status: input.status ?? "observed",
  subjects: input.subjects,
  tags: input.tags ?? [],
  liveBindings: input.liveBindings ?? [],
  sourceRefs: input.sourceRefs,
  evidenceRefs: input.evidenceRefs,
  confidence: input.confidence ?? 0.72,
  missingEvidence: input.missingEvidence ?? [],
  reasonCodes: input.reasonCodes ?? [],
  intentModule: input.intentVerb
    ? {
        verb: input.intentVerb,
        actorId: input.actorId ?? null,
        targetId: input.targetId ?? null,
        preserves: input.preserves ?? [],
        requires: input.requires ?? [],
        blocks: input.blocks ?? [],
      }
    : undefined,
  admission: input.admission ?? null,
});

const liveBindingForCell = (
  cell: EnvironmentCellSummary,
  bindingKind: StagePlayLiveBindingKindV1,
  sourceRefIds: string[],
): StagePlayBadgeV1["liveBindings"][number] => ({
  bindingKind,
  sourceRefIds,
  freshness: "fresh",
  confidence: 0.78,
  compactValue: compactCellValue(cell),
});

export function buildStagePlayBadgeGraph(input: {
  environmentState: HelixEnvironmentStateSnapshot;
  liveSourceObservations?: LiveSourceObservation[];
  affordanceContext?: HelixEnvironmentAffordanceContext | null;
  objective?: string | null;
  now?: string;
}): StagePlayBadgeGraphV1 {
  const snapshot = input.environmentState;
  const observations = input.liveSourceObservations ?? [];
  const generatedAt = input.now ?? new Date().toISOString();
  const evidenceRefs = graphEvidenceRefs(snapshot, observations);
  const sourceRefs = baseSourceRefs(snapshot, observations);
  const sourceRefIds = sourceRefs.map((ref) => ref.id);
  const actorId = snapshot.actor_id ?? "actor:player";
  const settingBadgeId = `setting:${slug(snapshot.world_id ?? snapshot.room_id)}`;
  const actorBadgeId = `actor:${slug(actorId)}`;
  const badges: StagePlayBadgeV1[] = [];
  const edges: StagePlayBadgeGraphV1["edges"] = [];
  const recommendedActions: StagePlayBadgeGraphV1["recommendedActions"] = [];

  pushUniqueBadge(badges, makeBadge({
    id: settingBadgeId,
    title: snapshot.world_id ?? snapshot.room_id,
    plainMeaning: "The transient setting currently supplied by live world evidence.",
    whyItMatters: "Stage Play reasoning must bind actions to the current setting instead of assuming a static world.",
    kind: "setting",
    subjects: [snapshot.domain, snapshot.room_id],
    tags: ["transient_setting", snapshot.domain],
    sourceRefs,
    evidenceRefs,
    reasonCodes: ["environment_state_snapshot"],
  }));
  pushUniqueBadge(badges, makeBadge({
    id: actorBadgeId,
    title: snapshot.actor_label ?? actorId,
    plainMeaning: "The player or actor whose possible moves are being reflected.",
    whyItMatters: "Affordances are actor-relative; health, pose, inventory, and nearby cells change what can be done.",
    kind: "actor",
    subjects: [actorId],
    tags: ["actor_state"],
    sourceRefs,
    evidenceRefs,
    liveBindings: [
      {
        bindingKind: "actor_pose",
        sourceRefIds,
        freshness: "fresh",
        confidence: 0.82,
        compactValue: snapshot.actor_state?.pose?.position
          ? `${snapshot.actor_state.pose.position.x},${snapshot.actor_state.pose.position.y},${snapshot.actor_state.pose.position.z ?? "?"}`
          : null,
      },
    ],
    reasonCodes: ["actor_state_observed"],
  }));
  pushUniqueEdge(edges, {
    id: `edge:${actorBadgeId}:observes:${settingBadgeId}`,
    from: actorBadgeId,
    to: settingBadgeId,
    relation: "observes",
    label: "actor is observed in transient setting",
    evidenceRefs,
    reasonCodes: ["actor_setting_binding"],
  });

  for (const entity of snapshot.object_state?.nearby_entities ?? []) {
    const badgeId = `entity:${slug(entity.object_ref || entity.object_type)}`;
    pushUniqueBadge(badges, makeBadge({
      id: badgeId,
      title: entity.object_type,
      plainMeaning: entity.distance != null ? `Nearby entity at distance ${entity.distance}.` : "Nearby entity observed.",
      whyItMatters: "Nearby entities can become targets, threats, blockers, or social/action constraints.",
      kind: "world_state",
      subjects: [entity.object_ref, entity.object_type].filter(Boolean),
      tags: entity.tags ?? entity.classification ?? [],
      sourceRefs,
      evidenceRefs,
      liveBindings: [{
        bindingKind: "nearby_entity",
        sourceRefIds,
        freshness: "fresh",
        confidence: 0.78,
        compactValue: entity.object_type,
      }],
      reasonCodes: ["nearby_entity_observed"],
    }));
    pushUniqueEdge(edges, {
      id: `edge:${badgeId}:located_near:${actorBadgeId}`,
      from: badgeId,
      to: actorBadgeId,
      relation: "located_near",
      label: "entity is near actor",
      evidenceRefs,
      reasonCodes: ["nearby_entity"],
    });
  }

  for (const item of snapshot.inventory_state?.carried_items ?? []) {
    const badgeId = `inventory:${slug(item.item_ref ?? item.item_type)}`;
    pushUniqueBadge(badges, makeBadge({
      id: badgeId,
      title: item.item_type,
      plainMeaning: `Inventory item observed with count ${item.count}.`,
      whyItMatters: "Inventory items become props or resources for procedural intent modules.",
      kind: "prop",
      status: "available",
      subjects: [item.item_ref ?? item.item_type],
      tags: item.tags ?? [],
      sourceRefs,
      evidenceRefs,
      liveBindings: [{
        bindingKind: "inventory_item",
        sourceRefIds,
        freshness: "fresh",
        confidence: 0.76,
        compactValue: item.count,
      }],
      reasonCodes: ["inventory_item_observed"],
    }));
  }

  const localCells = snapshot.local_map?.salient_cells ?? [];
  const gatewayBlocks = snapshot.chunk_snapshot_summary?.gateway_blocks ?? [];
  const bridgeLikeBlocks = snapshot.chunk_snapshot_summary?.bridge_like_blocks ?? [];
  const hazardCells = snapshot.chunk_snapshot_summary?.hazard_cells ?? [];
  const routeCells = snapshot.chunk_snapshot_summary?.route_corridor_cells ?? [];
  const surfaceCells = snapshot.chunk_snapshot_summary?.surface_cells ?? [];
  const allCells = uniq([
    ...localCells,
    ...gatewayBlocks,
    ...bridgeLikeBlocks,
    ...hazardCells,
    ...routeCells,
    ...surfaceCells,
  ]);

  for (const cell of allCells.slice(0, 48)) {
    const hazard = hasTag(cell, /hazard|void|drop|lava|water/i);
    const gateway = hasTag(cell, /gateway|portal/i);
    const traversable = hasTag(cell, /traversable|walkable|bridge_like/i);
    const badgeId = `cell:${slug(cell.cell_ref || cellLabel(cell))}`;
    const bindingKind: StagePlayLiveBindingKindV1 = gateway
      ? "portal_or_gateway"
      : hazard
        ? "hazard_cell"
        : traversable
          ? "floor_block"
          : "adjacent_block";
    pushUniqueBadge(badges, makeBadge({
      id: badgeId,
      title: cellLabel(cell),
      plainMeaning: "Local world cell sampled from rich environment evidence.",
      whyItMatters: "Cells define immediate movement, pathing, hazard, bridge, and gateway bounds.",
      kind: hazard ? "hazard" : gateway ? "world_state" : "world_state",
      status: hazard ? "blocked" : "observed",
      subjects: [cell.cell_ref || cell.cell_type],
      tags: cell.tags ?? [],
      sourceRefs: [
        ...sourceRefs,
        { kind: "chunk_snapshot_sample", id: cell.cell_ref || badgeId, note: cell.cell_type },
      ],
      evidenceRefs,
      liveBindings: [liveBindingForCell(cell, bindingKind, sourceRefIds)],
      confidence: 0.78,
      reasonCodes: ["local_cell_observed"],
    }));
    pushUniqueEdge(edges, {
      id: `edge:${badgeId}:sourced_by:${settingBadgeId}`,
      from: badgeId,
      to: settingBadgeId,
      relation: "sourced_by",
      label: "cell updates from current environment snapshot",
      evidenceRefs,
      reasonCodes: ["snapshot_cell_binding"],
    });
  }

  const traversableCells = allCells.filter((cell) => hasTag(cell, /traversable|walkable|bridge_like/i));
  const dangerousCells = allCells.filter((cell) => hasTag(cell, /hazard|void|drop|lava|water/i));

  if (traversableCells.length > 0) {
    const badgeId = "affordance:move_through_traversable_cells";
    pushUniqueBadge(badges, makeBadge({
      id: badgeId,
      title: "Move through traversable cells",
      plainMeaning: "A movement affordance is currently available through sampled traversable cells.",
      whyItMatters: "The agent can reason about movement only inside the current passability bounds.",
      kind: "affordance",
      status: "available",
      subjects: [actorId, ...traversableCells.map((cell) => cell.cell_ref).filter(Boolean).slice(0, 8)],
      tags: ["movement", "passability"],
      sourceRefs,
      evidenceRefs,
      liveBindings: traversableCells.slice(0, 8).map((cell) => liveBindingForCell(cell, "floor_block", sourceRefIds)),
      intentVerb: "move",
      actorId,
      requires: ["fresh environment snapshot", "local passability candidates"],
      admission: "auto",
      reasonCodes: ["local_passability_available"],
    }));
    pushUniqueEdge(edges, {
      id: `edge:${settingBadgeId}:enables:${badgeId}`,
      from: settingBadgeId,
      to: badgeId,
      relation: "enables",
      label: "current setting enables local movement",
      evidenceRefs,
      reasonCodes: ["passability_bound"],
    });
  }

  if (bridgeLikeBlocks.length > 0) {
    const affordanceId = "affordance:use_bridge_like_blocks";
    const bindingId = "binding:bridge_path";
    pushUniqueBadge(badges, makeBadge({
      id: affordanceId,
      title: "Use bridge-like blocks",
      plainMeaning: "Bridge-like blocks are present in the sampled chunk/route evidence.",
      whyItMatters: "Bridge-like cells can support route reasoning, but still need freshness and fall-risk checks.",
      kind: "affordance",
      status: "candidate",
      subjects: [actorId, ...bridgeLikeBlocks.map((cell) => cell.cell_ref).filter(Boolean)],
      tags: ["bridge_like", "navigation"],
      sourceRefs,
      evidenceRefs,
      liveBindings: bridgeLikeBlocks.map((cell) => liveBindingForCell(cell, "floor_block", sourceRefIds)),
      intentVerb: "bridge",
      actorId,
      preserves: ["floor_continuity"],
      requires: ["bridge-like cells remain traversable"],
      admission: "auto",
      reasonCodes: ["bridge_like_blocks_observed"],
    }));
    pushUniqueBadge(badges, makeBadge({
      id: bindingId,
      title: "Bridge path",
      plainMeaning: "A procedural binding can combine bridge observation, floor preservation, and forward movement.",
      whyItMatters: "This describes a possible action grammar, not a command to execute.",
      kind: "procedural_binding",
      status: "candidate",
      subjects: [actorId, affordanceId],
      tags: ["bridge", "procedural_binding"],
      sourceRefs,
      evidenceRefs,
      intentVerb: "bridge",
      actorId,
      preserves: ["floor_continuity"],
      requires: ["freshness", "fall risk", "hostile entity proximity"],
      admission: "auto",
      reasonCodes: ["observe_bridge_like_blocks+preserve_floor+move_forward"],
    }));
    pushUniqueEdge(edges, {
      id: `edge:${affordanceId}:produces:${bindingId}`,
      from: affordanceId,
      to: bindingId,
      relation: "produces",
      label: "bridge affordance contributes to bridge path binding",
      evidenceRefs,
      reasonCodes: ["procedural_composition"],
    });
  }

  if (gatewayBlocks.length > 0) {
    const badgeId = "affordance:inspect_gateway_or_portal";
    pushUniqueBadge(badges, makeBadge({
      id: badgeId,
      title: "Inspect gateway or portal",
      plainMeaning: "Gateway or portal blocks are visible in the sampled world evidence.",
      whyItMatters: "Gateway actions are high-context; the graph can show the candidate without granting execution.",
      kind: "affordance",
      status: "ask_user_required",
      subjects: [actorId, ...gatewayBlocks.map((cell) => cell.cell_ref).filter(Boolean)],
      tags: ["portal_or_gateway", "navigation"],
      sourceRefs,
      evidenceRefs,
      liveBindings: gatewayBlocks.map((cell) => liveBindingForCell(cell, "portal_or_gateway", sourceRefIds)),
      intentVerb: "enter_portal",
      actorId,
      requires: ["safe approach route", "user confirmation"],
      admission: "ask_user",
      confidence: 0.68,
      reasonCodes: ["gateway_or_portal_observed"],
    }));
    recommendedActions.push({
      id: "action:explain_gateway_candidate",
      label: "Explain gateway candidate",
      actionType: "explain_candidate",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["gateway_or_portal_observed", "diagnostic_only"],
      evidenceRefs,
      missingEvidence: [],
    });
  }

  if (dangerousCells.length > 0) {
    const blockedId = "blocked:move_into_hazard_cells";
    const bindingId = "binding:tactical_retreat";
    pushUniqueBadge(badges, makeBadge({
      id: blockedId,
      title: "Move into hazard cells",
      plainMeaning: "Movement into sampled hazard/drop/liquid cells is blocked by current evidence.",
      whyItMatters: "Blocked affordances tell the model what should not be recommended under current bounds.",
      kind: "blocked_affordance",
      status: "blocked",
      subjects: [actorId, ...dangerousCells.map((cell) => cell.cell_ref).filter(Boolean).slice(0, 8)],
      tags: ["hazard", "blocked_move"],
      sourceRefs,
      evidenceRefs,
      liveBindings: dangerousCells.slice(0, 8).map((cell) => liveBindingForCell(cell, "hazard_cell", sourceRefIds)),
      intentVerb: "avoid",
      actorId,
      blocks: ["move_into_hazard_cells"],
      admission: "blocked",
      confidence: 0.84,
      reasonCodes: ["local_hazard_cells_observed"],
    }));
    pushUniqueBadge(badges, makeBadge({
      id: bindingId,
      title: "Tactical retreat",
      plainMeaning: "A procedural binding can combine hazard observation, moving away, and maintaining awareness.",
      whyItMatters: "This gives the agent a traceable action grammar for explaining safer movement.",
      kind: "procedural_binding",
      status: "candidate",
      subjects: [actorId, blockedId],
      tags: ["retreat", "hazard_avoidance"],
      sourceRefs,
      evidenceRefs,
      intentVerb: "retreat",
      actorId,
      preserves: ["line_of_sight"],
      requires: ["freshness", "safe adjacent cell", "fall risk"],
      admission: "auto",
      reasonCodes: ["observe_hazard+move_away+maintain_line_of_sight"],
    }));
    pushUniqueEdge(edges, {
      id: `edge:${blockedId}:blocks:${actorBadgeId}`,
      from: blockedId,
      to: actorBadgeId,
      relation: "blocks",
      label: "hazard cells block direct movement choices",
      evidenceRefs,
      reasonCodes: ["blocked_affordance"],
    });
    pushUniqueEdge(edges, {
      id: `edge:${blockedId}:produces:${bindingId}`,
      from: blockedId,
      to: bindingId,
      relation: "produces",
      label: "blocked movement motivates retreat binding",
      evidenceRefs,
      reasonCodes: ["procedural_replan"],
    });
    recommendedActions.push({
      id: "action:blocked_move_notice",
      label: "Show blocked move notice",
      actionType: "blocked_move_notice",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["local_hazard_cells_observed", "diagnostic_only"],
      evidenceRefs,
      missingEvidence: [],
    });
  }

  for (const itemType of input.affordanceContext?.usable ?? []) {
    pushUniqueBadge(badges, makeBadge({
      id: `affordance:use:${slug(itemType)}`,
      title: `Use ${itemType}`,
      plainMeaning: "A usable item/container affordance is present in the current environment affordance context.",
      whyItMatters: "Usable props can become procedural modules, but still need user/action admission before mutation.",
      kind: "affordance",
      status: "ask_user_required",
      subjects: [actorId, itemType],
      tags: ["usable", "prop"],
      sourceRefs,
      evidenceRefs,
      liveBindings: [{
        bindingKind: "inventory_item",
        sourceRefIds,
        freshness: "fresh",
        confidence: 0.66,
        compactValue: itemType,
      }],
      intentVerb: "open",
      actorId,
      targetId: itemType,
      requires: ["item or container remains available", "user confirmation"],
      admission: "ask_user",
      confidence: 0.66,
      reasonCodes: ["usable_affordance_context"],
    }));
  }

  const graphId = `stage_play_badge_graph:${hashShort([
    snapshot.snapshot_id,
    input.objective ?? "",
    observations.map((entry) => entry.observation_id),
  ])}`;

  return buildStagePlayBadgeGraphV1({
    generatedAt,
    graphId,
    title: "Stage Play Badge Graph",
    description: "Evidence-only bounded action-world reflection over live environment state.",
    sourceWindow: {
      threadId: observations[0]?.thread_id ?? null,
      roomId: snapshot.room_id,
      worldId: snapshot.world_id ?? null,
      environmentId: observations[0]?.environment_id ?? null,
      fromTs: observations[0]?.observed_at ?? snapshot.ts,
      toTs: snapshot.ts,
      latestObservationRefs: observations.map((observation) => observation.observation_id),
      latestSnapshotRefs: [snapshot.snapshot_id],
      latestDeltaOverlayRefs: [],
      latestNavigationRefs: snapshot.route_state?.evidence_refs ?? [],
      freshness: sourceFreshness(observations),
    },
    badges,
    edges,
    recommendedActions,
  });
}
