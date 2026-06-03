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
import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionV1,
} from "@shared/contracts/helix-recommended-action-admission.v1";
import type {
  EnvironmentCellSummary,
  EnvironmentItemSummary,
  EnvironmentObjectSummary,
  HelixEnvironmentStateSnapshot,
} from "@shared/helix-environment-state-snapshot";
import { getLatestEnvironmentStateSnapshot } from "../situation-room/environment-state-snapshot-window";
import { resolveStagePlaySourceWindow } from "../situation-room/stage-play-source-window";

export type BuildStagePlayGraphFromWorldInput = {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  objective?: string | null;
  now?: Date;
};

export type BuildStagePlayRecommendedActionAdmissionInput = {
  graph: StagePlayBadgeGraphV1;
  prompt?: string;
  sourceReceiptId?: string | null;
  generatedAt?: string;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const lower = (value: string | null | undefined): string => String(value ?? "").toLowerCase();

const hasText = (value: string | null | undefined, pattern: RegExp): boolean => pattern.test(lower(value));

const hasCellTag = (cell: EnvironmentCellSummary, pattern: RegExp): boolean =>
  pattern.test(lower(cell.cell_type)) || (cell.tags ?? []).some((tag) => pattern.test(lower(tag)));

const hasItem = (item: EnvironmentItemSummary | null | undefined, pattern: RegExp): boolean =>
  Boolean(item && (pattern.test(lower(item.item_type)) || (item.tags ?? []).some((tag) => pattern.test(lower(tag)))));

const itemSubject = (item: EnvironmentItemSummary): string => item.item_ref ?? item.item_type;

const compactPosition = (cell: EnvironmentCellSummary): string | null =>
  cell.position ? `${cell.position.x},${cell.position.y},${cell.position.z ?? "?"}` : null;

const sourceRefIds = (refs: StagePlayBadgeSourceRefV1[]): string[] => refs.map((ref) => ref.id);

const makeSourceRefs = (input: {
  sourceDescriptorRefs?: string[];
  sourceProducerRefs?: string[];
  observationRefs: string[];
  snapshotRefs: string[];
  deltaOverlayRefs: string[];
  chunkSampleRefs: string[];
  navigationRefs: string[];
  routeSolverObservationRefs: string[];
  worldSenseContextRefs: string[];
  eventWindowRefs: string[];
  rawSessionBufferRefs?: string[];
}): StagePlayBadgeSourceRefV1[] => [
  ...(input.sourceDescriptorRefs ?? []).map((id) => ({ kind: "live_source_descriptor" as const, id })),
  ...(input.sourceProducerRefs ?? []).map((id) => ({ kind: "live_source_producer" as const, id })),
  ...input.observationRefs.map((id) => ({ kind: "live_source_observation" as const, id })),
  ...input.snapshotRefs.map((id) => ({ kind: "environment_state_snapshot" as const, id })),
  ...input.deltaOverlayRefs.map((id) => ({ kind: "world_delta_overlay" as const, id })),
  ...input.chunkSampleRefs.map((id) => ({ kind: "chunk_snapshot_sample" as const, id })),
  ...input.navigationRefs.map((id) => ({ kind: "navigation_state" as const, id })),
  ...input.routeSolverObservationRefs.map((id) => ({ kind: "route_solver_observation" as const, id })),
  ...input.worldSenseContextRefs.map((id) => ({ kind: "world_sense_context" as const, id })),
  ...input.eventWindowRefs.map((id) => ({ kind: "world_event" as const, id })),
  ...(input.rawSessionBufferRefs ?? []).map((id) => ({ kind: "stage_play_raw_session_buffer_entry" as const, id })),
];

const badge = (input: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  kind: StagePlayBadgeV1["kind"];
  status?: StagePlayBadgeStatusV1;
  subjects?: string[];
  tags?: string[];
  sourceRefs: StagePlayBadgeSourceRefV1[];
  evidenceRefs: string[];
  confidence?: number;
  reasonCodes?: string[];
  liveBindings?: StagePlayBadgeV1["liveBindings"];
  intentVerb?: StagePlayIntentVerbV1;
  actorId?: string | null;
  targetId?: string | null;
  preserves?: string[];
  requires?: string[];
  blocks?: string[];
  missingEvidence?: string[];
  admission?: StagePlayBadgeV1["admission"];
}): StagePlayBadgeV1 => ({
  id: input.id,
  title: input.title,
  plainMeaning: input.plainMeaning,
  whyItMatters: input.whyItMatters,
  kind: input.kind,
  status: input.status ?? "observed",
  subjects: input.subjects ?? [],
  tags: input.tags ?? [],
  liveBindings: input.liveBindings ?? [],
  sourceRefs: input.sourceRefs,
  evidenceRefs: input.evidenceRefs,
  confidence: input.confidence ?? 0.74,
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

const makeBinding = (
  bindingKind: StagePlayLiveBindingKindV1,
  sourceRefIdsValue: string[],
  compactValue?: string | number | boolean | null,
): StagePlayBadgeV1["liveBindings"][number] => ({
  bindingKind,
  sourceRefIds: sourceRefIdsValue,
  freshness: "fresh",
  confidence: 0.78,
  compactValue: compactValue ?? null,
});

const pushBadge = (badges: StagePlayBadgeV1[], next: StagePlayBadgeV1): string => {
  if (!badges.some((entry) => entry.id === next.id)) badges.push(next);
  return next.id;
};

const pushEdge = (
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    from: string;
    to: string;
    relation: StagePlayBadgeEdgeRelationV1;
    label: string;
    evidenceRefs: string[];
    reasonCodes?: string[];
  },
): void => {
  const id = `edge:${input.from}:${input.relation}:${input.to}`;
  if (!edges.some((edge) => edge.id === id)) {
    edges.push({
      id,
      from: input.from,
      to: input.to,
      relation: input.relation,
      label: input.label,
      evidenceRefs: input.evidenceRefs,
      reasonCodes: input.reasonCodes ?? [],
    });
  }
};

const dimensionSettingId = (snapshot: HelixEnvironmentStateSnapshot | null): "setting.overworld" | "setting.nether" | "setting.end" | null => {
  const text = lower([
    snapshot?.coordinate_frame?.dimension,
    snapshot?.world_id,
    snapshot?.domain_specific?.minecraft ? "minecraft" : "",
  ].filter(Boolean).join(" "));
  if (/nether/.test(text)) return "setting.nether";
  if (/\bend\b|the_end|end/.test(text)) return "setting.end";
  if (/overworld|minecraft/.test(text)) return "setting.overworld";
  return null;
};

const classifyEntityBadgeId = (entity: EnvironmentObjectSummary): string => {
  const text = lower(`${entity.object_type} ${(entity.tags ?? []).join(" ")} ${(entity.classification ?? []).join(" ")}`);
  if (/creeper/.test(text)) return "actor.creeper.nearby";
  if (/zombie/.test(text)) return "actor.zombie.nearby";
  if (/villager/.test(text)) return "actor.villager.nearby";
  if (/item/.test(text)) return "actor.item_entity.nearby";
  return `actor.${text.replace(/minecraft:/g, "").replace(/[^a-z0-9]+/g, "_") || "entity"}.nearby`;
};

const addIntent = (
  badges: StagePlayBadgeV1[],
  sourceRefs: StagePlayBadgeSourceRefV1[],
  evidenceRefs: string[],
  input: {
    id: string;
    title: string;
    verb: StagePlayIntentVerbV1;
    preserves?: string[];
    requires?: string[];
    blocks?: string[];
  },
): string => pushBadge(badges, badge({
  id: input.id,
  title: input.title,
  plainMeaning: "Composable procedural verb available for Stage Play reasoning.",
  whyItMatters: "Intent modules are the action-language primitives that combine into traceable procedural bindings.",
  kind: "intent_module",
  status: "candidate",
  tags: ["intent_module", input.verb],
  sourceRefs,
  evidenceRefs,
  confidence: 0.72,
  reasonCodes: ["deterministic_intent_module"],
  intentVerb: input.verb,
  preserves: input.preserves,
  requires: input.requires,
  blocks: input.blocks,
  admission: "auto",
}));

const observerBadge = (input: {
  sourceRefs: StagePlayBadgeSourceRefV1[];
  evidenceRefs: string[];
  sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
}): StagePlayBadgeV1 => {
  const selectedCount = input.sources.filter((source) => source.selectedForStagePlay).length;
  const activeCount = input.sources.filter((source) => source.status === "active").length;
  const missingCount = input.sources.filter((source) =>
    source.status === "configured_missing" || source.status === "permission_required" || source.status === "waiting_for_client"
  ).length;
  return badge({
    id: "observer.live_sources",
    title: "Observer",
    plainMeaning: "Source custody and routing for the Stage Play window.",
    whyItMatters: "Observer is the first tile: it shows which live sources exist, what is missing, and which sources may feed Stage Play before any story or world facts are interpreted.",
    kind: "observer",
    status: selectedCount > 0 ? "observed" : "missing_evidence",
    subjects: input.sources.map((source) => source.sourceId),
    tags: [
      "observer",
      "source_custody",
      "stage_play_routing",
      ...unique(input.sources.map((source) => source.modality)),
      ...unique(input.sources.map((source) => source.routeTo)),
    ],
    sourceRefs: input.sourceRefs,
    evidenceRefs: input.evidenceRefs,
    confidence: input.sources.length > 0 ? Math.max(0.35, Math.min(0.92, input.sources.reduce((sum, source) => sum + source.fidelityScore, 0) / input.sources.length)) : 0.35,
    liveBindings: [
      makeBinding("source_status", sourceRefIds(input.sourceRefs), `active:${activeCount} selected:${selectedCount} missing:${missingCount}`),
      ...input.sources.slice(0, 8).map((source) =>
        makeBinding("source_modality", source.evidenceRefs, `${source.modality}:${source.status}:${source.routeTo}`)
      ),
    ],
    reasonCodes: ["observer_source_custody", "stage_play_source_routing"],
    admission: "auto",
  });
};

const sourceRouteOf = (source: StagePlayBadgeGraphV1["sourceWindow"]["sources"][number]) =>
  source.route ?? {
    sourceId: source.sourceId,
    modality: source.modality,
    routeTo: source.routeTo,
    selected: source.selectedForStagePlay,
    confidence: source.fidelityScore,
    freshness: source.status,
  };

const isSourceUsableForFusion = (source: StagePlayBadgeGraphV1["sourceWindow"]["sources"][number]): boolean =>
  source.evidenceRefs.length > 0 &&
  (source.status === "active" || source.status === "stale") &&
  source.routeTo !== "debug_only";

const modalityMatches = (
  source: StagePlayBadgeGraphV1["sourceWindow"]["sources"][number],
  pattern: RegExp,
): boolean => pattern.test(lower(source.modality));

const addFusionBadges = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    observerId: string;
    interpreterId: string;
    sourceRefs: StagePlayBadgeSourceRefV1[];
    evidenceRefs: string[];
    sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
  },
): void => {
  const sources = input.sources;
  const visualSources = sources.filter((source) =>
    modalityMatches(source, /visual|screen_capture|browser_tab_visual/)
  );
  const audioSources = sources.filter((source) =>
    modalityMatches(source, /audio|transcript|browser_tab_audio/)
  );
  const worldSources = sources.filter((source) =>
    modalityMatches(source, /minecraft|world_event|environment_state|environment_affordance/)
  );
  const activeVisual = visualSources.filter(isSourceUsableForFusion);
  const activeAudio = audioSources.filter(isSourceUsableForFusion);
  const activeWorld = worldSources.filter(isSourceUsableForFusion);
  const fusionEvidence = unique([
    ...input.evidenceRefs,
    ...sources.flatMap((source) => source.evidenceRefs),
  ]);
  const sourceBadgeIdsFor = (
    selectedSources: StagePlayBadgeGraphV1["sourceWindow"]["sources"],
  ): string[] =>
    badges
      .filter((entry) => entry.kind === "source" && selectedSources.some((source) => entry.subjects.includes(source.sourceId)))
      .map((entry) => entry.id);
  const pushFusion = (fusion: {
    id: string;
    title: string;
    meaning: string;
    status: StagePlayBadgeStatusV1;
    selectedSources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
    reasonCodes: string[];
    confidence: number;
    missingEvidence?: string[];
  }) => {
    const selectedSourceIds = unique(fusion.selectedSources.map((source) => source.sourceId));
    const badgeId = pushBadge(badges, badge({
      id: fusion.id,
      title: fusion.title,
      plainMeaning: fusion.meaning,
      whyItMatters: "Fusion badges show whether a stage fact came from audio-only, visual-only, world-only, or combined source evidence.",
      kind: "fusion",
      status: fusion.status,
      subjects: selectedSourceIds,
      tags: [
        "fusion",
        ...unique(fusion.selectedSources.map((source) => source.modality)),
        ...unique(fusion.selectedSources.map((source) => source.routeTo)),
      ],
      sourceRefs: input.sourceRefs,
      evidenceRefs: unique([
        ...fusionEvidence,
        ...fusion.selectedSources.flatMap((source) => source.evidenceRefs),
      ]),
      confidence: fusion.confidence,
      liveBindings: fusion.selectedSources.map((source) => {
        const route = sourceRouteOf(source);
        return makeBinding("source_modality", source.evidenceRefs, `${route.modality}->${route.routeTo}:${route.freshness}:${route.confidence.toFixed(2)}`);
      }),
      reasonCodes: fusion.reasonCodes,
      missingEvidence: fusion.missingEvidence ?? [],
      admission: "auto",
    }));
    pushEdge(edges, {
      from: input.observerId,
      to: badgeId,
      relation: "observes",
      label: "observer compares routed source modalities",
      evidenceRefs: fusionEvidence,
      reasonCodes: ["observer_source_fusion"],
    });
    pushEdge(edges, {
      from: badgeId,
      to: input.interpreterId,
      relation: "feeds",
      label: "fusion node feeds compact interpretation",
      evidenceRefs: fusionEvidence,
      reasonCodes: ["fusion_interpreter_binding"],
    });
    for (const sourceBadgeId of sourceBadgeIdsFor(fusion.selectedSources)) {
      pushEdge(edges, {
        from: sourceBadgeId,
        to: badgeId,
        relation: "feeds",
        label: "routed source contributes to fusion node",
        evidenceRefs: fusionEvidence,
        reasonCodes: ["source_fusion_binding"],
      });
    }
  };

  if (activeAudio.length > 0 && activeVisual.length > 0) {
    const selectedSources = [...activeAudio, ...activeVisual];
    pushFusion({
      id: "fusion.audio_visual_scene",
      title: "audio + visual scene",
      meaning: "Audio/transcript and visual frame sources are both available for the same compact Stage Play window.",
      status: "observed",
      selectedSources,
      reasonCodes: ["audio_visual_same_window", "compact_scene_observation_candidate"],
      confidence: Math.min(0.9, selectedSources.reduce((sum, source) => sum + source.fidelityScore, 0) / selectedSources.length + 0.08),
    });
  }

  if (activeWorld.length > 0 && activeVisual.length > 0) {
    const selectedSources = [...activeWorld, ...activeVisual];
    pushFusion({
      id: "fusion.world_event_visual_alignment",
      title: "world + visual alignment",
      meaning: "World-event or environment-state evidence and visual evidence are both available to strengthen observed state.",
      status: "observed",
      selectedSources,
      reasonCodes: ["world_event_visual_same_window", "stronger_observed_state"],
      confidence: Math.min(0.92, selectedSources.reduce((sum, source) => sum + source.fidelityScore, 0) / selectedSources.length + 0.1),
    });
  }

  const conflictText = lower(sources.map((source) => [
    source.contribution,
    source.missingReason,
    source.nextRequiredAction,
    ...source.evidenceRefs,
  ].filter(Boolean).join(" ")).join(" "));
  if (activeAudio.length > 0 && activeVisual.length > 0 && /conflict|contradict|mismatch|different actor|identity split/.test(conflictText)) {
    pushFusion({
      id: "fusion.source_conflict",
      title: "source conflict",
      meaning: "Compact routed sources carry an explicit conflict or mismatch marker that needs review before prediction.",
      status: "blocked",
      selectedSources: [...activeAudio, ...activeVisual],
      reasonCodes: ["source_conflict", "requires_user_review"],
      confidence: 0.74,
      missingEvidence: ["Resolve the compact source conflict before treating the fused scene as stable."],
    });
  }

  if (activeVisual.length > 0 && activeAudio.length === 0) {
    pushFusion({
      id: "fusion.missing_modality",
      title: "missing audio modality",
      meaning: "Visual context is available, but audio/transcript evidence is missing for narrative intent and dialogue.",
      status: "missing_evidence",
      selectedSources: visualSources.length > 0 ? visualSources : activeVisual,
      reasonCodes: ["visual_active_audio_missing", "missing_modality"],
      confidence: 0.62,
      missingEvidence: ["Attach browser audio transcript or microphone transcript for narrative Stage Play fusion."],
    });
  } else if (activeAudio.length > 0 && activeVisual.length === 0) {
    pushFusion({
      id: "fusion.missing_modality",
      title: "missing visual grounding",
      meaning: "Audio/transcript context is available, but visual grounding is missing for setting, actors, and action state.",
      status: "missing_evidence",
      selectedSources: audioSources.length > 0 ? audioSources : activeAudio,
      reasonCodes: ["audio_active_visual_missing", "missing_visual_grounding"],
      confidence: 0.62,
      missingEvidence: ["Start visual interval capture to ground narrative Stage Play predictions."],
    });
  }
};

const addBinding = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  sourceRefs: StagePlayBadgeSourceRefV1[],
  evidenceRefs: string[],
  input: {
    id: string;
    title: string;
    components: string[];
    verb: StagePlayIntentVerbV1;
    reasonCode: string;
    preserves?: string[];
    requires?: string[];
    blocks?: string[];
  },
): void => {
  pushBadge(badges, badge({
    id: input.id,
    title: input.title,
    plainMeaning: `${input.components.join(" + ")} = ${input.id.replace(/^binding\./, "")}.`,
    whyItMatters: "Procedural bindings are recombinations that describe possible action grammar, not a command.",
    kind: "procedural_binding",
    status: "candidate",
    tags: ["procedural_binding"],
    sourceRefs,
    evidenceRefs,
    confidence: 0.76,
    reasonCodes: [input.reasonCode],
    intentVerb: input.verb,
    preserves: input.preserves,
    requires: input.requires,
    blocks: input.blocks,
    admission: "auto",
  }));
  for (const component of input.components) {
    pushEdge(edges, {
      from: component,
      to: input.id,
      relation: "composes_with",
      label: "component composes procedural binding",
      evidenceRefs,
      reasonCodes: ["procedural_composition"],
    });
  }
};

function stagePlayActionToAdmissionEntry(
  graph: StagePlayBadgeGraphV1,
  action: StagePlayBadgeGraphV1["recommendedActions"][number],
): HelixRecommendedActionAdmissionEntryV1 {
  const missing = action.missingEvidence.filter((entry) => entry.trim().length > 0);
  const blocked = action.admission === "blocked";
  const askUser = action.admission === "ask_user";
  const diagnosticAuto = action.admission === "auto";
  return {
    actionId: action.id,
    panelId: "stage-play-badge-graph",
    label: action.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: blocked || askUser ? "high" : "medium",
    risk: blocked ? "unknown" : askUser ? "mutating" : missing.length > 0 ? "claim_sensitive" : "read_only",
    admission: action.admission,
    requiresConfirmation: blocked || askUser,
    agentExecutable: false,
    reason: blocked
      ? "Stage Play blocked this candidate under current evidence."
      : askUser
        ? "Stage Play can recommend this candidate only as a user-confirmed world action."
        : "Stage Play can display this diagnostic candidate as evidence only.",
    reasonCode: blocked
      ? "unknown_action_not_allowlisted"
      : askUser
        ? "runtime_execution_requires_confirmation"
        : missing.length > 0
          ? "diagnostic_only_not_executable"
          : "read_only_allowlisted",
    source: {
      workstation: "stage-play",
      panel: "stage-play-badge-graph",
      panelId: "stage-play-badge-graph",
      tool: "stage-play-badge-graph-builder",
      artifact_type: graph.artifactId,
      artifact_id: graph.graphId,
    },
    display_policy: blocked ? "diagnostic_only" : askUser ? "actionable" : "diagnostic_only",
    evidenceRefs: action.evidenceRefs,
    evidenceRequirements: {
      missing,
      satisfied: action.evidenceRefs,
    },
    reasonCodes: ["stage_play_badge_graph", "evidence_only_authority", ...action.reasonCodes],
  };
}

export function buildStagePlayRecommendedActionAdmissionV1(
  input: BuildStagePlayRecommendedActionAdmissionInput,
): HelixRecommendedActionAdmissionV1 {
  const evidenceRefs = unique([
    ...(input.graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(input.graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...input.graph.sourceWindow.latestObservationRefs,
    ...input.graph.sourceWindow.latestSnapshotRefs,
    ...input.graph.sourceWindow.latestDeltaOverlayRefs,
    ...input.graph.sourceWindow.latestNavigationRefs,
    ...input.graph.recommendedActions.flatMap((action) => action.evidenceRefs),
  ]);
  const missing = unique(input.graph.recommendedActions.flatMap((action) => action.missingEvidence));
  return buildHelixRecommendedActionAdmissionV1({
    generatedAt: input.generatedAt ?? input.graph.generatedAt,
    admissionId: `stage_play_recommended_action_admission:${hashShort([
      input.graph.graphId,
      input.graph.recommendedActions.map((action) => action.id),
    ])}`,
    prompt: input.prompt ?? "Stage Play graph recommended action admission.",
    sourceReceiptId: input.sourceReceiptId ?? null,
    source: {
      workstation: "stage-play",
      panel: "stage-play-badge-graph",
      panelId: "stage-play-badge-graph",
      tool: "stage-play-badge-graph-builder",
      artifact_type: input.graph.artifactId,
      artifact_id: input.graph.graphId,
    },
    actions: input.graph.recommendedActions.map((action) => stagePlayActionToAdmissionEntry(input.graph, action)),
    evidenceRefs,
    evidenceRequirements: {
      missing,
      satisfied: evidenceRefs,
    },
    reasonCodes: ["stage_play_badge_graph", "evidence_only_authority", "not_agent_executable"],
  });
}

export function buildStagePlayGraphFromWorld(input: BuildStagePlayGraphFromWorldInput): StagePlayBadgeGraphV1 {
  const now = input.now ?? new Date();
  const resolvedAt = now.toISOString();
  const roomId = input.roomId ?? null;
  const sourceWindow = resolveStagePlaySourceWindow({
    threadId: input.threadId,
    roomId,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    now: resolvedAt,
  });
  const hasAdmittedSourceWindowRefs = [
    ...sourceWindow.latestObservationRefs,
    ...sourceWindow.latestSnapshotRefs,
    ...sourceWindow.latestDeltaOverlayRefs,
    ...sourceWindow.latestNavigationRefs,
    ...(sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(sourceWindow.latestSourceProducerRefs ?? []),
    ...(sourceWindow.latestRawSessionBufferRefs ?? []),
  ].length > 0;
  if (!roomId && !hasAdmittedSourceWindowRefs) {
    return buildStagePlayBadgeGraphV1({
      generatedAt: resolvedAt,
      graphId: `stage_play_badge_graph:${hashShort([input.threadId, "missing-room", resolvedAt])}`,
      title: "Stage Play Badge Graph",
      description: "No room source window has been admitted yet.",
      sourceWindow: {
        threadId: input.threadId,
        roomId,
        worldId: null,
        environmentId: input.environmentId ?? null,
        fromTs: null,
        toTs: resolvedAt,
        latestObservationRefs: [],
        latestSourceDescriptorRefs: [],
        latestSourceProducerRefs: [],
        latestRawSessionBufferRefs: [],
        sources: sourceWindow.sources,
        sourceRoutes: sourceWindow.sourceRoutes,
        latestSnapshotRefs: [],
        latestDeltaOverlayRefs: [],
        latestNavigationRefs: [],
        freshness: "missing" as const,
      },
      badges: [observerBadge({ sourceRefs: [], evidenceRefs: [], sources: sourceWindow.sources })],
      edges: [],
      recommendedActions: [],
    });
  }

  const snapshot = roomId ? getLatestEnvironmentStateSnapshot(roomId) : null;
  const sourceRefs = makeSourceRefs({
    sourceDescriptorRefs: sourceWindow.latestSourceDescriptorRefs,
    sourceProducerRefs: sourceWindow.latestSourceProducerRefs,
    observationRefs: sourceWindow.latestObservationRefs,
    snapshotRefs: sourceWindow.latestSnapshotRefs,
    deltaOverlayRefs: sourceWindow.latestDeltaOverlayRefs,
    chunkSampleRefs: sourceWindow.latestChunkSnapshotSampleRefs,
    navigationRefs: sourceWindow.latestNavigationRefs,
    routeSolverObservationRefs: sourceWindow.latestRouteSolverObservationRefs,
    worldSenseContextRefs: sourceWindow.latestWorldSenseContextRefs,
    eventWindowRefs: sourceWindow.latestEventWindowRefs,
    rawSessionBufferRefs: sourceWindow.latestRawSessionBufferRefs,
  });
  const evidenceRefs = sourceWindow.evidenceRefs;
  const sourceIds = sourceRefIds(sourceRefs);
  const badges: StagePlayBadgeV1[] = [];
  const edges: StagePlayBadgeGraphV1["edges"] = [];
  const recommendedActions: StagePlayBadgeGraphV1["recommendedActions"] = [];
  const observerId = pushBadge(badges, observerBadge({
    sourceRefs,
    evidenceRefs,
    sources: sourceWindow.sources,
  }));

  const sourceBadgeIds: string[] = [];
  for (const descriptor of sourceWindow.compactFacts.sourceDescriptors) {
    const matchingProducer = sourceWindow.compactFacts.sourceProducers.find((producer) => producer.sourceId === descriptor.sourceId) ?? null;
    const refs = makeSourceRefs({
      sourceDescriptorRefs: [descriptor.descriptorId],
      sourceProducerRefs: matchingProducer ? [matchingProducer.producerId] : [],
      observationRefs: descriptor.latestObservationRefs,
      snapshotRefs: [],
      deltaOverlayRefs: [],
      chunkSampleRefs: [],
      navigationRefs: [],
      routeSolverObservationRefs: [],
      worldSenseContextRefs: [],
      eventWindowRefs: [],
    });
    const refIds = sourceRefIds(refs);
    sourceBadgeIds.push(pushBadge(badges, badge({
      id: `source.${hashShort([descriptor.sourceId, descriptor.modality], 10)}`,
      title: descriptor.modality.replace(/_/g, " "),
      plainMeaning: "A live source handle is available for Stage Play interpretation.",
      whyItMatters: "Source badges show which admitted feed can be wired into the interpreter before any world-state claims are formed.",
      kind: "source",
      status: descriptor.state === "stale" || descriptor.state === "paused" ? "stale" : "observed",
      subjects: [descriptor.sourceId],
      tags: ["source", descriptor.modality, descriptor.surface, descriptor.origin, descriptor.state],
      sourceRefs: refs,
      evidenceRefs: unique([descriptor.descriptorId, ...(matchingProducer ? [matchingProducer.producerId] : []), ...descriptor.latestObservationRefs]),
      confidence: descriptor.state === "active" || descriptor.state === "active_interval" ? 0.84 : 0.62,
      liveBindings: [
        makeBinding("source_descriptor", refIds, descriptor.descriptorId),
        ...(matchingProducer ? [makeBinding("source_producer", refIds, matchingProducer.producerId)] : []),
        makeBinding("source_modality", refIds, descriptor.modality),
        makeBinding("source_status", refIds, descriptor.state),
        ...(descriptor.cadenceMs != null ? [makeBinding("source_cadence", refIds, descriptor.cadenceMs)] : []),
      ],
      reasonCodes: ["live_source_descriptor"],
      admission: "auto",
    })));
  }
  for (const producer of sourceWindow.compactFacts.sourceProducers) {
    if (sourceWindow.compactFacts.sourceDescriptors.some((descriptor) => descriptor.sourceId === producer.sourceId)) continue;
    const refs = makeSourceRefs({
      sourceDescriptorRefs: [],
      sourceProducerRefs: [producer.producerId],
      observationRefs: [],
      snapshotRefs: [],
      deltaOverlayRefs: [],
      chunkSampleRefs: [],
      navigationRefs: [],
      routeSolverObservationRefs: [],
      worldSenseContextRefs: [],
      eventWindowRefs: [],
    });
    const refIds = sourceRefIds(refs);
    sourceBadgeIds.push(pushBadge(badges, badge({
      id: `source.${hashShort([producer.sourceId, producer.modality], 10)}`,
      title: producer.modality.replace(/_/g, " "),
      plainMeaning: "A live source producer exists for Stage Play interpretation.",
      whyItMatters: "Producer-only source badges can be bound later to a descriptor or interpreter job.",
      kind: "source",
      status: producer.status === "stale" || producer.status === "paused" ? "stale" : "observed",
      subjects: [producer.sourceId],
      tags: ["source", producer.modality, producer.status, producer.captureMode],
      sourceRefs: refs,
      evidenceRefs: unique([producer.producerId, producer.latestChunkId].filter(Boolean) as string[]),
      confidence: producer.status === "active" ? 0.78 : 0.58,
      liveBindings: [
        makeBinding("source_producer", refIds, producer.producerId),
        makeBinding("source_modality", refIds, producer.modality),
        makeBinding("source_status", refIds, producer.status),
        ...(producer.cadenceMs != null ? [makeBinding("source_cadence", refIds, producer.cadenceMs)] : []),
      ],
      reasonCodes: ["live_source_producer"],
      admission: "auto",
    })));
  }
  const interpreterId = pushBadge(badges, badge({
    id: "interpreter.stage_play_reflection",
    title: "Stage Play interpreter",
    plainMeaning: "A compact interpretation job can reduce selected sources into stage facts and procedural bindings.",
    whyItMatters: "The interpreter node is the continual reflection boundary: it may produce evidence, but it cannot answer or act.",
    kind: "interpreter",
    status: sourceRefs.length > 0 ? "candidate" : "missing_evidence",
    subjects: [input.threadId, roomId].filter((subject): subject is string => Boolean(subject)),
    tags: ["interpreter", "reflect_stage_play_context", "evidence_only"],
    sourceRefs,
    evidenceRefs,
    confidence: sourceRefs.length > 0 ? 0.76 : 0.4,
    liveBindings: [
      makeBinding("source_status", sourceIds, sourceWindow.freshness),
      makeBinding("route_state", sourceIds, sourceWindow.compactFacts.navigation?.routeStatus ?? "unknown"),
    ],
    reasonCodes: ["stage_play_interpreter", "compact_source_window"],
    admission: "auto",
  }));
  for (const sourceBadgeId of sourceBadgeIds) {
    pushEdge(edges, {
      from: observerId,
      to: sourceBadgeId,
      relation: "observes",
      label: "observer tracks source custody and routing",
      evidenceRefs,
      reasonCodes: ["observer_source_routing"],
    });
    pushEdge(edges, {
      from: sourceBadgeId,
      to: interpreterId,
      relation: "feeds",
      label: "source handle feeds Stage Play interpreter",
      evidenceRefs,
      reasonCodes: ["source_interpreter_binding"],
    });
  }
  pushEdge(edges, {
    from: observerId,
    to: interpreterId,
    relation: "feeds",
    label: "observer routes selected source handles to the interpreter boundary",
    evidenceRefs,
    reasonCodes: ["observer_interpreter_routing"],
  });
  addFusionBadges(badges, edges, {
    observerId,
    interpreterId,
    sourceRefs,
    evidenceRefs,
    sources: sourceWindow.sources,
  });

  const settingIds: string[] = [];
  const dimensionId = dimensionSettingId(snapshot);
  if (dimensionId) {
    settingIds.push(pushBadge(badges, badge({
      id: dimensionId,
      title: dimensionId.replace("setting.", ""),
      plainMeaning: "Current Minecraft dimension inferred from admitted environment evidence.",
      whyItMatters: "Dimension bounds change hazards, portal meaning, route assumptions, and available movement.",
      kind: "setting",
      tags: ["dimension"],
      sourceRefs,
      evidenceRefs,
      reasonCodes: ["snapshot_dimension"],
    })));
  }
  if (sourceWindow.compactFacts.environmentSnapshot?.localMap) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.local_map",
      title: "local map",
      plainMeaning: "A local map sample is available around the player.",
      whyItMatters: "Local map facts bound immediate movement and nearby hazards.",
      kind: "setting",
      tags: ["local_map"],
      sourceRefs,
      evidenceRefs,
      liveBindings: [makeBinding("floor_block", sourceIds, sourceWindow.compactFacts.environmentSnapshot.localMap.salientCellCount)],
      reasonCodes: ["local_map_available"],
    })));
  }
  if ((sourceWindow.compactFacts.environmentSnapshot?.chunkSnapshot?.routeCorridorCellCount ?? 0) > 0) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.route_corridor",
      title: "route corridor",
      plainMeaning: "Route corridor cells are present in the chunk snapshot sample.",
      whyItMatters: "Route corridor evidence narrows possible navigation choices.",
      kind: "setting",
      tags: ["route_corridor"],
      sourceRefs,
      evidenceRefs,
      reasonCodes: ["route_corridor_sample"],
    })));
  }
  const routeText = lower([input.objective, sourceWindow.compactFacts.navigation?.routeStatus].join(" "));
  if (/tunnel|dig|mine/.test(routeText)) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.tunnel",
      title: "tunnel",
      plainMeaning: "The current objective or route evidence is tunnel-facing.",
      whyItMatters: "Tunnel settings require passability updates and escape checks.",
      kind: "setting",
      tags: ["tunnel"],
      sourceRefs,
      evidenceRefs,
      reasonCodes: ["objective_tunnel_context"],
    })));
  }
  if ((sourceWindow.compactFacts.environmentSnapshot?.chunkSnapshot?.bridgeLikeBlockCount ?? 0) > 0) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.bridge",
      title: "bridge",
      plainMeaning: "Bridge-like blocks are visible in the current chunk sample.",
      whyItMatters: "Bridge settings support forward movement only if floor continuity is preserved.",
      kind: "setting",
      tags: ["bridge"],
      sourceRefs,
      evidenceRefs,
      reasonCodes: ["bridge_like_cells"],
    })));
  }
  if ((sourceWindow.compactFacts.environmentSnapshot?.chunkSnapshot?.gatewayBlockCount ?? 0) > 0) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.gateway_area",
      title: "gateway area",
      plainMeaning: "Gateway or portal-like blocks are visible in current evidence.",
      whyItMatters: "Gateway areas require confirmation before portal/action recommendations.",
      kind: "setting",
      status: "ask_user_required",
      tags: ["gateway"],
      sourceRefs,
      evidenceRefs,
      liveBindings: [makeBinding("portal_or_gateway", sourceIds, "visible")],
      reasonCodes: ["gateway_blocks_visible"],
    })));
  }
  const narrativeSources = sourceWindow.sources.filter((source) =>
    source.selectedForStagePlay && source.routeTo === "narrative_stage_play"
  );
  const activeVisualNarrativeSources = narrativeSources.filter((source) =>
    modalityMatches(source, /visual|screen|frame/) && source.status === "active"
  );
  const activeAudioNarrativeSources = narrativeSources.filter((source) =>
    modalityMatches(source, /audio|transcript/) && source.status === "active"
  );
  const hasNarrativeVisual = activeVisualNarrativeSources.length > 0;
  const hasNarrativeAudio = activeAudioNarrativeSources.length > 0;
  const hasVisualNarrativeSource = hasNarrativeVisual;
  const hasVisualOnlyNarrativeSource = hasNarrativeVisual && !hasNarrativeAudio;
  if (hasVisualNarrativeSource) {
    settingIds.push(pushBadge(badges, badge({
      id: "setting.visual_scene",
      title: "visual scene window",
      plainMeaning: "A compact visual source window is available for narrative Stage Play setup.",
      whyItMatters: "Visual-only Stage Play can bound setting and continuity checks, but it still needs dialogue or objective evidence before strong narrative claims.",
      kind: "setting",
      status: "candidate",
      tags: ["narrative_stage_play", "visual_scene", "compact_observation_window"],
      sourceRefs,
      evidenceRefs: unique([
        ...evidenceRefs,
        ...activeVisualNarrativeSources.flatMap((source) => source.evidenceRefs),
      ]),
      liveBindings: activeVisualNarrativeSources.map((source) =>
        makeBinding("source_modality", source.evidenceRefs, `${source.modality}:${source.routeTo}:${source.status}`)
      ),
      confidence: hasVisualOnlyNarrativeSource ? 0.62 : 0.72,
      missingEvidence: hasVisualOnlyNarrativeSource
        ? ["Attach audio transcript or declare a narrative objective before treating the scene as fully grounded."]
        : [],
      reasonCodes: ["visual_narrative_source_window"],
      admission: "auto",
    })));
  }

  const actorId = pushBadge(badges, badge({
    id: "actor.player",
    title: "player",
    plainMeaning: "The player actor is present in the current source window.",
    whyItMatters: "Affordances are bound to the player pose, inventory, health, and nearby environment.",
    kind: "actor",
    subjects: [snapshot?.actor_id ?? "player"],
    tags: ["player"],
    sourceRefs,
    evidenceRefs,
    liveBindings: [makeBinding("actor_pose", sourceIds, snapshot?.actor_state?.pose?.position ? "pose observed" : null)],
    reasonCodes: ["player_actor"],
  }));
  pushEdge(edges, {
    from: interpreterId,
    to: actorId,
    relation: "interprets",
    label: "interpreter reduces source window into actor badge",
    evidenceRefs,
    reasonCodes: ["interpreter_actor_binding"],
  });
  if (hasVisualNarrativeSource) {
    const observedSubjectId = pushBadge(badges, badge({
      id: "actor.observed_subject",
      title: "observed subject",
      plainMeaning: "A subject is visually present enough to anchor a narrative Stage Play window.",
      whyItMatters: "This bounds the stage to observable participants without naming or judging them from visual evidence alone.",
      kind: "actor",
      status: "candidate",
      subjects: activeVisualNarrativeSources.map((source) => source.sourceId),
      tags: ["narrative_stage_play", "visual_subject", "needs_identity_confirmation"],
      sourceRefs,
      evidenceRefs: unique([
        ...evidenceRefs,
        ...activeVisualNarrativeSources.flatMap((source) => source.evidenceRefs),
      ]),
      liveBindings: activeVisualNarrativeSources.map((source) =>
        makeBinding("source_modality", source.evidenceRefs, `${source.modality}:${source.status}`)
      ),
      confidence: 0.58,
      missingEvidence: ["Confirm actor identity or role before using this as a named narrative actor."],
      reasonCodes: ["visual_subject_anchor", "identity_confirmation_missing"],
      admission: "auto",
    }));
    pushEdge(edges, {
      from: interpreterId,
      to: observedSubjectId,
      relation: "interprets",
      label: "interpreter creates a visual subject anchor",
      evidenceRefs,
      reasonCodes: ["visual_subject_anchor"],
    });
    if (settingIds.includes("setting.visual_scene")) {
      pushEdge(edges, {
        from: observedSubjectId,
        to: "setting.visual_scene",
        relation: "observes",
        label: "visual subject is bounded by the visual scene window",
        evidenceRefs,
        reasonCodes: ["visual_subject_scene_binding"],
      });
    }
  }
  for (const entity of snapshot?.object_state?.nearby_entities ?? []) {
    const id = classifyEntityBadgeId(entity);
    const entityId = pushBadge(badges, badge({
      id,
      title: id.replace(/^actor\./, "").replace(/\.nearby$/, ""),
      plainMeaning: "Nearby entity observed in object-state evidence.",
      whyItMatters: "Nearby entities can become threats, blockers, targets, or social constraints.",
      kind: "actor",
      subjects: [entity.object_ref, entity.object_type].filter(Boolean),
      tags: ["nearby_entity", ...(entity.tags ?? []), ...(entity.classification ?? [])],
      sourceRefs,
      evidenceRefs,
      liveBindings: [makeBinding("nearby_entity", sourceIds, entity.object_type)],
      confidence: 0.78,
      reasonCodes: ["nearby_entity"],
    }));
    pushEdge(edges, {
      from: entityId,
      to: actorId,
      relation: "located_near",
      label: "nearby actor is located near player",
      evidenceRefs,
      reasonCodes: ["nearby_entity"],
    });
  }

  const selected = snapshot?.inventory_state?.selected_item ?? null;
  const carried = snapshot?.inventory_state?.carried_items ?? [];
  const equipped = snapshot?.inventory_state?.equipped_items ?? [];
  const inventory = unique([selected, ...carried, ...equipped].filter(Boolean) as EnvironmentItemSummary[]);
  const hasCobblestone = inventory.some((item) => hasItem(item, /cobblestone|stone|dirt|plank|block/));
  const shieldEquipped = equipped.some((item) => hasItem(item, /shield/)) || hasItem(selected, /shield/);
  if (hasCobblestone) {
    pushBadge(badges, badge({
      id: "resource.cobblestone.available",
      title: "cobblestone available",
      plainMeaning: "A placeable block resource is available in inventory.",
      whyItMatters: "Placeable blocks enable bridge and defensive barrier procedures.",
      kind: "resource",
      status: "available",
      subjects: inventory.filter((item) => hasItem(item, /cobblestone|stone|dirt|plank|block/)).map(itemSubject),
      tags: ["placeable_block"],
      sourceRefs,
      evidenceRefs,
      liveBindings: [makeBinding("inventory_item", sourceIds, "placeable block")],
      reasonCodes: ["placeable_block_available"],
    }));
  }
  if (shieldEquipped) {
    pushBadge(badges, badge({
      id: "resource.shield.equipped",
      title: "shield equipped",
      plainMeaning: "Shield is selected or equipped in inventory evidence.",
      whyItMatters: "A shield changes defensive affordances and close-range risk.",
      kind: "resource",
      status: "available",
      tags: ["shield", "defense"],
      sourceRefs,
      evidenceRefs,
      liveBindings: [makeBinding("inventory_item", sourceIds, "shield")],
      reasonCodes: ["shield_available"],
    }));
  }

  const localCells = snapshot?.local_map?.salient_cells ?? [];
  const chunk = snapshot?.chunk_snapshot_summary;
  const allCells = unique([
    ...localCells,
    ...(chunk?.surface_cells ?? []),
    ...(chunk?.route_corridor_cells ?? []),
    ...(chunk?.gateway_blocks ?? []),
    ...(chunk?.bridge_like_blocks ?? []),
    ...(chunk?.hazard_cells ?? []),
  ]);
  const doorCells = allCells.filter((cell) => hasCellTag(cell, /door|trapdoor|fence|gate/));
  const gatewayCells = [...(chunk?.gateway_blocks ?? []), ...allCells.filter((cell) => hasCellTag(cell, /gateway|portal/))];
  const bridgeCells = [...(chunk?.bridge_like_blocks ?? []), ...allCells.filter((cell) => hasCellTag(cell, /bridge_like|bridge/))];
  if (doorCells.length > 0) {
    pushBadge(badges, badge({
      id: "prop.door.nearby",
      title: "door nearby",
      plainMeaning: "Door, trapdoor, fence, or gate-like block is nearby.",
      whyItMatters: "Door-like props can enable or constrain route transitions.",
      kind: "prop",
      tags: ["door_or_gate"],
      sourceRefs,
      evidenceRefs,
      liveBindings: doorCells.slice(0, 3).map((cell) => makeBinding("door_or_gate", sourceIds, compactPosition(cell))),
      reasonCodes: ["door_like_cell"],
    }));
  }
  if (gatewayCells.length > 0) {
    pushBadge(badges, badge({
      id: "prop.gateway_block.visible",
      title: "gateway block visible",
      plainMeaning: "Gateway or portal block is visible in sampled world state.",
      whyItMatters: "Gateway visibility creates an inspection candidate, not permission to enter.",
      kind: "prop",
      status: "ask_user_required",
      tags: ["gateway", "portal"],
      sourceRefs,
      evidenceRefs,
      liveBindings: gatewayCells.slice(0, 3).map((cell) => makeBinding("portal_or_gateway", sourceIds, compactPosition(cell))),
      reasonCodes: ["gateway_block_visible"],
    }));
  }
  if (bridgeCells.length > 0) {
    pushBadge(badges, badge({
      id: "prop.bridge_like_block.nearby",
      title: "bridge-like block nearby",
      plainMeaning: "Bridge-like block evidence is present near the route or local map.",
      whyItMatters: "Bridge-like blocks can support floor-preserving movement procedures.",
      kind: "prop",
      tags: ["bridge_like"],
      sourceRefs,
      evidenceRefs,
      liveBindings: bridgeCells.slice(0, 3).map((cell) => makeBinding("floor_block", sourceIds, compactPosition(cell))),
      reasonCodes: ["bridge_like_block"],
    }));
  }
  for (const container of snapshot?.object_state?.nearby_containers ?? []) {
    pushBadge(badges, badge({
      id: `prop.container.nearby.${hashShort(container.container_ref, 8)}`,
      title: container.container_type,
      plainMeaning: "Nearby container observed in object-state evidence.",
      whyItMatters: "Containers can be props for use/open affordances, but mutation still requires user confirmation.",
      kind: "prop",
      status: "ask_user_required",
      subjects: [container.container_ref],
      tags: ["container"],
      sourceRefs,
      evidenceRefs,
      confidence: 0.7,
      reasonCodes: ["nearby_container"],
    }));
  }

  const riskFlags = unique(sourceWindow.compactFacts.routeSolverObservations.flatMap((observation) => observation.riskFlags));
  const eventTypes = sourceWindow.compactFacts.eventWindow.eventTypes;
  const entityText = lower((snapshot?.object_state?.nearby_entities ?? []).flatMap((entity) => [
    entity.object_type,
    ...(entity.tags ?? []),
    ...(entity.classification ?? []),
  ]).join(" "));
  const hazardCells = [...(chunk?.hazard_cells ?? []), ...allCells.filter((cell) => hasCellTag(cell, /hazard|void|drop|lava|water|fall/))];
  const hasLava = riskFlags.includes("lava") || hazardCells.some((cell) => hasCellTag(cell, /lava/));
  const hasVoid = riskFlags.includes("void_fall") || hazardCells.some((cell) => hasCellTag(cell, /void|drop|fall/));
  const hasHostile = riskFlags.includes("hostiles") || /creeper|zombie|skeleton|hostile/.test(entityText) || eventTypes.includes("hostile_context_sample");
  const lowHealth = typeof snapshot?.actor_state?.health === "number" && snapshot.actor_state.health <= 8;
  const lowLight = riskFlags.includes("low_light") || eventTypes.includes("light_context_sample");
  const fallRisk = hasVoid || riskFlags.some((risk) => /water_crossing|unknown_gateway/.test(risk));
  const hazardSpecs = [
    ["hazard.lava_nearby", hasLava, "lava nearby", "Lava risk is present in hazard cells or route risk flags."],
    ["hazard.void_drop", hasVoid, "void/drop", "Void or drop risk is present in hazard cells or route risk flags."],
    ["hazard.hostile_nearby", hasHostile, "hostile nearby", "Hostile entity context is near enough to affect action choice."],
    ["hazard.low_health", lowHealth, "low health", "Actor health is low in the current snapshot."],
    ["hazard.fall_risk", fallRisk, "fall risk", "Route or local-map evidence includes fall-risk conditions."],
    ["hazard.low_light", lowLight, "low light", "Low-light route risk or light sample context is present."],
  ] as const;
  for (const [id, present, title, meaning] of hazardSpecs) {
    if (!present) continue;
    pushBadge(badges, badge({
      id,
      title,
      plainMeaning: meaning,
      whyItMatters: "Hazard badges constrain which affordances should remain available or blocked.",
      kind: "hazard",
      status: "blocked",
      tags: ["hazard"],
      sourceRefs,
      evidenceRefs,
      liveBindings: id.includes("void") || id.includes("fall") || id.includes("lava")
        ? [makeBinding("hazard_cell", sourceIds, id)]
        : [],
      confidence: id === "hazard.low_health" ? 0.86 : 0.78,
      reasonCodes: [id.replace(/\./g, "_")],
    }));
  }

  const traversable = allCells.some((cell) => hasCellTag(cell, /walkable|traversable|surface|route_corridor|bridge_like/));
  const objectiveText = lower(input.objective);
  const movementRequirements = unique(sourceWindow.compactFacts.routeSolverObservations.flatMap((observation) => observation.movementRequirements));
  const canMine = /mine|tunnel|dig/.test(objectiveText) || movementRequirements.includes("dig");
  const canJump = movementRequirements.includes("jump") || allCells.some((cell) => hasCellTag(cell, /step_up|jump/));
  const canStepUp = allCells.some((cell) => hasCellTag(cell, /step_up|stairs|slab/)) || movementRequirements.includes("ascend");
  const affordanceSpecs: Array<[string, boolean, string, StagePlayIntentVerbV1, string[]]> = [
    ["affordance.observe", sourceRefs.length > 0 || hasNarrativeVisual, "observe", "observe", ["evidence_available"]],
    ["affordance.move_forward", traversable, "move forward", "move", ["traversable_cells"]],
    ["affordance.step_up", canStepUp, "step up", "step_up", ["step_up_candidate"]],
    ["affordance.jump", canJump, "jump", "jump", ["jump_candidate"]],
    ["affordance.mine_block", canMine, "mine block", "mine", ["mine_or_tunnel_context"]],
    ["affordance.place_block", hasCobblestone, "place block", "place_block", ["placeable_block_available"]],
    ["affordance.bridge", hasCobblestone && (bridgeCells.length > 0 || movementRequirements.includes("bridge")), "bridge", "bridge", ["bridge_context"]],
    ["affordance.retreat", hasHostile || hasLava || hasVoid || lowHealth, "retreat", "retreat", ["risk_context"]],
    ["affordance.equip_shield", shieldEquipped, "equip shield", "equip", ["shield_available"]],
    ["affordance.open_door", doorCells.length > 0, "open door", "open", ["door_like_cell"]],
    ["affordance.enter_portal", gatewayCells.length > 0, "enter portal", "enter_portal", ["gateway_visible"]],
  ];
  for (const [id, present, title, verb, reasons] of affordanceSpecs) {
    if (!present) continue;
    pushBadge(badges, badge({
      id,
      title,
      plainMeaning: "A possible action affordance derived from current local bindings.",
      whyItMatters: "Affordance badges expose what is possible or candidate under current world bounds.",
      kind: "affordance",
      status: id === "affordance.enter_portal" ? "ask_user_required" : "available",
      tags: ["affordance", verb],
      sourceRefs,
      evidenceRefs,
      confidence: id === "affordance.enter_portal" ? 0.62 : 0.76,
      reasonCodes: reasons,
      intentVerb: verb,
      actorId,
      admission: id === "affordance.enter_portal" || id === "affordance.open_door" ? "ask_user" : "auto",
    }));
  }

  const missingEvidence = unique([
    ...sourceWindow.compactFacts.routeSolverObservations.flatMap((observation) => observation.missingEvidence),
    ...(sourceWindow.compactFacts.navigation?.missingEvidence ?? []),
    ...(sourceWindow.compactFacts.worldSense?.missingEvidence ?? []),
  ]);
  const blockedSpecs: Array<[string, boolean, string, string[]]> = [
    ["blocked.engage_close_range", hasHostile, "engage close range", ["hostile_nearby"]],
    ["blocked.drop_down", hasVoid || fallRisk, "drop down", ["fall_risk"]],
    ["blocked.step_into_lava", hasLava, "step into lava", ["lava_nearby"]],
    ["blocked.mine_without_escape", canMine && (hasHostile || hasVoid || missingEvidence.length > 0), "mine without escape", ["escape_check_missing"]],
    ["blocked.path_unknown_chunk", riskFlags.includes("unknown_gateway") || missingEvidence.some((entry) => /chunk|gateway|route/i.test(entry)), "path unknown chunk", ["unknown_chunk_or_route"]],
    ["blocked.enter_gateway_unconfirmed", gatewayCells.length > 0 && (riskFlags.includes("unknown_gateway") || missingEvidence.length > 0), "enter gateway unconfirmed", ["gateway_unconfirmed"]],
  ];
  for (const [id, present, title, reasons] of blockedSpecs) {
    if (!present) continue;
    pushBadge(badges, badge({
      id,
      title,
      plainMeaning: "This affordance is blocked under current evidence or missing checks.",
      whyItMatters: "Blocked affordances tell the agent what should not be recommended as the next move.",
      kind: "blocked_affordance",
      status: "blocked",
      tags: ["blocked_affordance"],
      sourceRefs,
      evidenceRefs,
      confidence: 0.82,
      reasonCodes: reasons,
      blocks: [id],
      intentVerb: "avoid",
      actorId,
      admission: "blocked",
    }));
  }

  const intentMoveAway = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.move_away",
    title: "move away",
    verb: "move_away",
    requires: ["hazard or threat context"],
  });
  const intentPreserveSelf = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.preserve_self",
    title: "preserve self",
    verb: "avoid",
    preserves: ["player safety"],
  });
  const intentMaintainLineOfSight = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.maintain_line_of_sight",
    title: "maintain line of sight",
    verb: "maintain_line_of_sight",
    preserves: ["threat visibility"],
  });
  const intentPlaceBlock = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.place_block",
    title: "place block",
    verb: "place_block",
    requires: ["placeable block"],
  });
  const intentPreserveFloor = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.preserve_floor",
    title: "preserve floor",
    verb: "bridge",
    preserves: ["floor continuity"],
  });
  const intentUpdatePassability = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.update_passability",
    title: "update passability",
    verb: "observe",
    requires: ["fresh local map"],
  });
  const intentReplanPath = addIntent(badges, sourceRefs, evidenceRefs, {
    id: "intent.replan_path",
    title: "replan path",
    verb: "move",
    requires: ["updated passability"],
  });
  if (hasVisualNarrativeSource) {
    const intentObserve = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.observe",
      title: "observe",
      verb: "observe",
      requires: ["fresh visual frame"],
    });
    const intentSeekConfirmation = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.seek_confirmation",
      title: "seek confirmation",
      verb: "seek_confirmation",
      requires: ["missing narrative grounding"],
    });
    const intentCompareNextFrame = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.compare_next_frame",
      title: "compare next frame",
      verb: "observe",
      requires: ["next visual frame"],
    });
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.scene_checkpoint",
      title: "scene checkpoint",
      components: [intentObserve, "affordance.observe", intentSeekConfirmation],
      verb: "observe",
      reasonCode: "observe+seek_confirmation=scene_checkpoint",
      preserves: ["source custody", "claim accuracy"],
      requires: ["fresh visual frame"],
    });
    if (hasVisualOnlyNarrativeSource) {
      const missingAudioId = pushBadge(badges, badge({
        id: "missing_evidence.audio_transcript",
        title: "audio transcript missing",
        plainMeaning: "Visual narrative Stage Play is active, but no active audio/transcript source is routed into the stage.",
        whyItMatters: "Narrative intent and dialogue should not be inferred from visual frames alone when transcript evidence is missing.",
        kind: "missing_evidence",
        status: "missing_evidence",
        subjects: activeVisualNarrativeSources.map((source) => source.sourceId),
        tags: ["narrative_stage_play", "audio_transcript", "missing_modality"],
        sourceRefs,
        evidenceRefs: unique([
          ...evidenceRefs,
          ...activeVisualNarrativeSources.flatMap((source) => source.evidenceRefs),
        ]),
        confidence: 0.78,
        missingEvidence: ["Audio/transcript source is needed for narrative intent."],
        reasonCodes: ["visual_active_audio_missing", "narrative_stage_play"],
        admission: "auto",
      }));
      const audioCheckId = pushBadge(badges, badge({
        id: "recommended_check.attach_audio_transcript",
        title: "attach audio transcript",
        plainMeaning: "Attach audio/transcript evidence before treating dialogue or intent as grounded.",
        whyItMatters: "The graph can still do visual continuity checks, but narrative claims need transcript grounding.",
        kind: "recommended_check",
        status: "candidate",
        subjects: activeVisualNarrativeSources.map((source) => source.sourceId),
        tags: ["narrative_stage_play", "audio_transcript", "recommended_check"],
        sourceRefs,
        evidenceRefs: unique([
          ...evidenceRefs,
          ...activeVisualNarrativeSources.flatMap((source) => source.evidenceRefs),
        ]),
        confidence: 0.76,
        missingEvidence: ["Audio/transcript source is needed for narrative intent."],
        reasonCodes: ["visual_active_audio_missing", "narrative_stage_play"],
        admission: "auto",
      }));
      addBinding(badges, edges, sourceRefs, evidenceRefs, {
        id: "binding.narrative_context_gap",
        title: "narrative context gap",
        components: [intentObserve, missingAudioId, audioCheckId],
        verb: "seek_confirmation",
        reasonCode: "observe+missing_audio_check=narrative_context_gap",
        preserves: ["claim accuracy"],
        requires: ["audio transcript"],
      });
      pushEdge(edges, {
        from: audioCheckId,
        to: missingAudioId,
        relation: "needs_check",
        label: "audio transcript check addresses missing narrative modality",
        evidenceRefs,
        reasonCodes: ["visual_active_audio_missing", "narrative_stage_play"],
      });
      recommendedActions.push({
        id: "stage-action:attach-audio-transcript",
        label: "Attach audio transcript for narrative intent and dialogue.",
        actionType: "observe_more",
        admission: "auto",
        agentExecutable: false,
        reasonCodes: ["visual_active_audio_missing", "narrative_stage_play"],
        evidenceRefs,
        missingEvidence: ["Audio/transcript source is needed for narrative intent."],
      });
      recommendedActions.push({
        id: "stage-action:ask-user-objective",
        label: "Ask user what narrative question or prediction target to track.",
        actionType: "ask_user",
        admission: "ask_user",
        agentExecutable: false,
        reasonCodes: ["missing_user_objective", "narrative_stage_play"],
        evidenceRefs,
        missingEvidence: ["User objective for narrative prediction is not set."],
      });
    }
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.continuity_check",
      title: "continuity check",
      components: [intentObserve, intentCompareNextFrame, "affordance.observe"],
      verb: "observe",
      reasonCode: "observe+compare_next_frame=continuity_check",
      preserves: ["scene continuity", "claim accuracy"],
      requires: ["next visual frame"],
    });
    recommendedActions.push({
      id: "stage-action:capture-compare-next-frame",
      label: "Capture and compare the next visual frame.",
      actionType: "safe_diagnostic_overlay",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["visual_continuity_check", "narrative_stage_play"],
      evidenceRefs,
      missingEvidence: [],
    });
  }

  if (hasHostile || hasVoid || hasLava) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.tactical_retreat_tracking_threat",
      title: "tactical retreat tracking threat",
      components: [intentMoveAway, intentMaintainLineOfSight, "affordance.observe"],
      verb: "retreat",
      reasonCode: "move_away+maintain_line_of_sight+observe_threat",
      preserves: ["threat visibility", "player safety"],
    });
  }
  if (hasCobblestone && (bridgeCells.length > 0 || movementRequirements.includes("bridge"))) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.bridge_forward",
      title: "bridge forward",
      components: [intentPlaceBlock, intentPreserveFloor, "affordance.move_forward"],
      verb: "bridge",
      reasonCode: "place_block+preserve_floor+move_forward",
      preserves: ["floor continuity"],
      requires: ["placeable block", "forward traversable target"],
    });
  }
  if (canMine) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.tunnel_advance",
      title: "tunnel advance",
      components: ["affordance.mine_block", intentUpdatePassability, intentReplanPath],
      verb: "mine",
      reasonCode: "mine_block+update_passability+replan_path",
      requires: ["escape check", "fresh passability"],
    });
  }
  if (hasCobblestone && (hasHostile || hasVoid || hasLava)) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.defensive_retreat_barrier",
      title: "defensive retreat barrier",
      components: [intentPlaceBlock, intentMoveAway, intentMaintainLineOfSight],
      verb: "place_block",
      reasonCode: "place_block+move_away+maintain_line_of_sight",
      preserves: ["player safety", "threat visibility"],
    });
    recommendedActions.push({
      id: "stage-action:defensive-retreat-barrier",
      label: "Candidate: retreat while tracking threat and place blocks as barrier",
      actionType: "navigation_hint",
      admission: "ask_user",
      agentExecutable: false,
      reasonCodes: [
        "live_world_hazard_nearby",
        ...(lowHealth ? ["low_health_constraint"] : []),
        "requires_user_world_action",
      ],
      evidenceRefs,
      missingEvidence: [],
    });
  }

  for (const settingId of settingIds) {
    pushEdge(edges, {
      from: interpreterId,
      to: settingId,
      relation: "interprets",
      label: "interpreter reduces source window into setting badge",
      evidenceRefs,
      reasonCodes: ["interpreter_setting_binding"],
    });
    pushEdge(edges, {
      from: actorId,
      to: settingId,
      relation: "observes",
      label: "player is observed within setting",
      evidenceRefs,
      reasonCodes: ["actor_setting_binding"],
    });
  }
  for (const hazard of badges.filter((entry) => entry.kind === "hazard")) {
    for (const blocked of badges.filter((entry) => entry.kind === "blocked_affordance")) {
      pushEdge(edges, {
        from: hazard.id,
        to: blocked.id,
        relation: "blocks",
        label: "hazard constrains blocked affordance",
        evidenceRefs,
        reasonCodes: ["hazard_blocks_affordance"],
      });
    }
  }
  for (const resource of badges.filter((entry) => entry.kind === "resource" || entry.kind === "prop")) {
    for (const affordance of badges.filter((entry) =>
      entry.kind === "affordance" && /place_block|bridge|open|enter_portal|equip_shield/.test(entry.id)
    )) {
      pushEdge(edges, {
        from: resource.id,
        to: affordance.id,
        relation: "enables",
        label: "resource or prop enables affordance candidate",
        evidenceRefs,
        reasonCodes: ["resource_affordance_binding"],
      });
    }
  }

  if (hasHostile) {
    recommendedActions.push({
      id: "stage-action:engage-close-range",
      label: "Blocked: close-range engagement",
      actionType: "blocked_move_notice",
      admission: "blocked",
      agentExecutable: false,
      reasonCodes: [
        "explosive_threat_nearby",
        ...(lowHealth ? ["low_health_constraint"] : []),
      ],
      evidenceRefs,
      missingEvidence: [],
    });
  }
  if (gatewayCells.length > 0) {
    recommendedActions.push({
      id: "stage-action:ask-gateway-confirmation",
      label: "Ask for gateway confirmation",
      actionType: "ask_user",
      admission: "ask_user",
      agentExecutable: false,
      reasonCodes: ["gateway_unconfirmed", "stage_play_diagnostic"],
      evidenceRefs,
      missingEvidence: missingEvidence.length ? missingEvidence : ["Gateway destination needs confirmation."],
    });
  }
  if (missingEvidence.length > 0) {
    recommendedActions.push({
      id: "stage-action:observe-more-for-missing-checks",
      label: "Observe more for missing checks",
      actionType: "observe_more",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["missing_evidence", "diagnostic_only"],
      evidenceRefs,
      missingEvidence,
    });
  }

  return buildStagePlayBadgeGraphV1({
    generatedAt: resolvedAt,
    graphId: `stage_play_badge_graph:${hashShort([
      input.threadId,
      roomId,
      sourceWindow.latestSnapshotRefs,
      sourceWindow.latestObservationRefs,
      input.objective ?? null,
    ])}`,
    title: "Stage Play Badge Graph",
    description: "Deterministic badge graph reducer over the compact Stage Play source window.",
    sourceWindow: {
      threadId: input.threadId,
      roomId,
      worldId: sourceWindow.worldId ?? null,
      environmentId: sourceWindow.environmentId ?? input.environmentId ?? null,
      fromTs: sourceWindow.compactFacts.observations[0]?.observedAt ?? snapshot?.ts ?? null,
      toTs: sourceWindow.compactFacts.eventWindow.latestEventTs ?? snapshot?.ts ?? resolvedAt,
      latestObservationRefs: sourceWindow.latestObservationRefs,
      latestSourceDescriptorRefs: sourceWindow.latestSourceDescriptorRefs,
      latestSourceProducerRefs: sourceWindow.latestSourceProducerRefs,
      latestRawSessionBufferRefs: sourceWindow.latestRawSessionBufferRefs,
      sources: sourceWindow.sources,
      sourceRoutes: sourceWindow.sourceRoutes,
      latestSnapshotRefs: sourceWindow.latestSnapshotRefs,
      latestDeltaOverlayRefs: sourceWindow.latestDeltaOverlayRefs,
      latestNavigationRefs: unique([
        ...sourceWindow.latestNavigationRefs,
        ...sourceWindow.latestRouteSolverObservationRefs,
        ...sourceWindow.latestWorldSenseContextRefs,
        ...sourceWindow.latestChunkSnapshotSampleRefs,
        ...sourceWindow.latestEventWindowRefs,
      ]),
      freshness: sourceWindow.freshness,
    },
    badges,
    edges,
    recommendedActions,
  });
}
