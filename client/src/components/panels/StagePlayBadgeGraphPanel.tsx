import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Link2, PanelLeftClose, PanelLeftOpen, RadioTower, Search, Waypoints } from "lucide-react";
import type {
  StagePlayBadgeEdgeV1,
  StagePlayBadgeGraphRecommendedActionV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import type { StagePlayRawSessionBufferEntryV1 } from "@shared/stage-play-raw-session-buffer";
import type {
  StagePlayBuilderCatalogV1,
  StagePlayGraphDraftValidationV1,
  StagePlaySourceHandleV1,
  StagePlaySourceQueryV1,
} from "@shared/contracts/stage-play-builder.v1";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  diffStagePlayBadgeGraphs,
  hasStagePlayGraphDiff,
  type StagePlayGraphDiff,
} from "@/lib/stage-play/stagePlayGraphDiff";
import { useStagePlayBadgeGraphPanelStore } from "@/store/useStagePlayBadgeGraphPanelStore";
import {
  selectActiveLiveAnswerEnvironment,
  useLiveAnswerEnvironmentStore,
} from "@/store/useLiveAnswerEnvironmentStore";
import {
  getActiveVisualFrameStream,
  getLatestActiveVisualFrameStream,
  startVisualFrameProducerInterval,
  stopVisualFrameProducerInterval,
} from "@/lib/helix/visualFrameProducer";

const STAGE_PLAY_PANEL_THREAD_ID = "helix-ask:desktop";

const STAGE_PLAY_SOURCE_SETUP_DEFAULTS = {
  routeTo: "narrative_stage_play",
  visualCadenceMs: 10_000,
  audioWindowMs: 10_000,
  compactObservationWindowMs: 10_000,
  rawRetention: "session_ttl",
} as const;

const STAGE_PLAY_VISUAL_CADENCE_OPTIONS = [5_000, 10_000, 15_000, 30_000] as const;

type StagePlayNodeBuilderType = {
  kind: StagePlayBadgeV1["kind"];
  label: string;
  role: string;
};

type DraftStagePlayNodeParameter = {
  id: string;
  key: string;
  value: string;
};

type DraftStagePlayNode = StagePlayNodeBuilderType & {
  id: string;
  x: number;
  y: number;
  parameters: DraftStagePlayNodeParameter[];
};

type HeldStagePlayNode = StagePlayNodeBuilderType & {
  clientX: number;
  clientY: number;
};

type StagePlaySourceOption = {
  id: string;
  sourceId: string;
  label: string;
  sourceClass: string;
  status: string;
  descriptorId?: string | null;
  producerId?: string | null;
  surface?: string | null;
  origin?: string | null;
  cadenceMs?: number | null;
  latestRef?: string | null;
  latestEvidenceRefs: string[];
};

type StagePlayBuilderContextResponse = {
  artifactId: "stage_play_builder_context";
  schemaVersion: "stage_play_builder_context/v1";
  generatedAt: string;
  catalog: StagePlayBuilderCatalogV1;
  sourceQuery: StagePlaySourceQueryV1;
  authority: StagePlayBuilderCatalogV1["authority"];
};

type StagePlayObserverSource = StagePlayBadgeGraphV1["sourceWindow"]["sources"][number];

type StagePlayObserverDraftAction =
  | "use_for_stage_play"
  | "route_to_narrative"
  | "route_to_minecraft_world"
  | "start_visual_interval"
  | "attach_audio_transcript"
  | "pause_source"
  | "clear_session_buffer";

type StagePlayVisualCaptureSurface = "browser_tab" | "screen";

type StagePlayAudioTranscriptSource = "browser_audio" | "microphone";

type StagePlaySourceSetupStatus = {
  level: "idle" | "working" | "ok" | "error";
  message: string;
};

type StagePlaySourceAuditMode = "source_evidence" | "compact_observation" | "raw_buffer";

type StagePlaySourceAuditSelection = {
  source: StagePlayObserverSource;
  mode: StagePlaySourceAuditMode;
} | null;

type StagePlayRawSessionBufferListResponse = {
  ok: boolean;
  schema: "stage_play_raw_session_buffer_list/v1";
  sessionId: string;
  threadId: string;
  roomId?: string | null;
  sourceId?: string | null;
  entries: StagePlayRawSessionBufferEntryV1[];
  assistant_answer: false;
  context_role: "audit_buffer_not_graph";
};

type StagePlayProjectLiveAnswerResponse = {
  ok: boolean;
  schema: "stage_play_live_answer_projection_response/v1";
  projectedLineKeys: string[];
  skippedLineKeys: string[];
  reason:
    | "projected"
    | "no_active_environment"
    | "line_schema_mismatch"
    | "no_line_changes"
    | "graph_invalid"
    | "environment_not_active";
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  terminal_eligible: false;
};

type StagePlayProjectionStatus = {
  projectedLineKeys: string[];
  skippedLineKeys: string[];
  reason: StagePlayProjectLiveAnswerResponse["reason"] | "request_failed";
  updatedAt: string;
  message: string;
};

type StagePlayLaneId =
  | "observer"
  | "compact_observation"
  | "stage_bounds"
  | "affordances_missing_checks"
  | "procedural_bindings"
  | "helix_ask_checkpoint"
  | "answer_snapshot"
  | "live_voice_output";

type StagePlayOutputNodeKind =
  | "live_answer"
  | "feedback"
  | "next_check"
  | "prediction"
  | "validation"
  | "handoff";

type StagePlaySyntheticNodeKind = StagePlayOutputNodeKind | "compact_observation";

type StagePlaySyntheticNode = {
  id: string;
  kind: StagePlaySyntheticNodeKind;
  lane: StagePlayLaneId;
  title: string;
  status: "observed" | "candidate" | "blocked" | "missing_evidence" | "available";
  evidenceRefs: string[];
  relatedBadgeIds: string[];
};

type StagePlayRemovedBadgeGhost = {
  id: string;
  title: string;
  kind: StagePlayBadgeV1["kind"];
  status: StagePlayBadgeV1["status"];
  lane: StagePlayLaneId;
  rowIndex: number;
};

type StagePlayTooltipPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

type StagePlayFloatingTooltip =
  | {
      key: string;
      kind: "badge";
      position: StagePlayTooltipPosition;
      badge: StagePlayBadgeV1;
      observerSources: StagePlayObserverSource[];
    }
  | {
      key: string;
      kind: "output";
      position: StagePlayTooltipPosition;
      node: StagePlaySyntheticNode;
    }
  | {
      key: string;
      kind: "draft";
      position: StagePlayTooltipPosition;
      node: DraftStagePlayNode;
    };

const STAGE_PLAY_LANES: Array<{ id: StagePlayLaneId; title: string }> = [
  { id: "observer", title: "Observer" },
  { id: "compact_observation", title: "Compact Observation" },
  { id: "stage_bounds", title: "Stage Bounds" },
  { id: "affordances_missing_checks", title: "Affordances / Missing Checks" },
  { id: "procedural_bindings", title: "Procedural Bindings" },
  { id: "helix_ask_checkpoint", title: "Helix Ask Checkpoint" },
  { id: "answer_snapshot", title: "Answer Snapshot" },
  { id: "live_voice_output", title: "Live / Voice Output" },
];

const NODE_WIDTH = 220;
const NODE_HEIGHT = 88;
const DATA_TRAY_HEIGHT = 74;
const ROW_GAP = 36;
const LANE_GAP = 96;
const CANVAS_PADDING_X = 72;
const CANVAS_PADDING_Y = 64;
const NODE_SLOT_HEIGHT = NODE_HEIGHT + DATA_TRAY_HEIGHT + ROW_GAP;
const LANE_STRIDE = NODE_WIDTH + LANE_GAP;

async function fetchStagePlayBadgeGraph(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<StagePlayBadgeGraphV1> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  const response = await fetch(`/api/helix/stage-play/graph?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play graph request failed: ${response.status}`);
  }
  return await response.json() as StagePlayBadgeGraphV1;
}

async function fetchStagePlayBuilderContext(input: {
  threadId: string;
  environmentId?: string | null;
}): Promise<StagePlayBuilderContextResponse> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  const response = await fetch(`/api/helix/stage-play/builder?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play builder request failed: ${response.status}`);
  }
  return await response.json() as StagePlayBuilderContextResponse;
}

async function fetchStagePlayRawSessionBuffer(input: {
  threadId: string;
  roomId?: string | null;
  sourceId?: string | null;
}): Promise<StagePlayRawSessionBufferListResponse> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.sourceId) params.set("sourceId", input.sourceId);
  const response = await fetch(`/api/helix/stage-play/raw-session-buffer?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play raw session buffer request failed: ${response.status}`);
  }
  return await response.json() as StagePlayRawSessionBufferListResponse;
}

async function projectStagePlayLiveAnswer(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  objective?: string | null;
}): Promise<StagePlayProjectLiveAnswerResponse> {
  const response = await fetch("/api/helix/stage-play/project-live-answer", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: input.threadId,
      roomId: input.roomId,
      environmentId: input.environmentId,
      objective: input.objective,
      ensureStagePlayLineSchema: true,
      createIfMissing: true,
      preferredPreset: "minecraft_run_monitor",
    }),
  });
  if (!response.ok) {
    throw new Error(`Stage Play projection failed: ${response.status}`);
  }
  return await response.json() as StagePlayProjectLiveAnswerResponse;
}

async function validateStagePlayDraft(input: {
  threadId: string;
  environmentId?: string | null;
  draft: unknown;
}): Promise<StagePlayGraphDraftValidationV1> {
  const response = await fetch("/api/helix/stage-play/draft/validate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: input.threadId,
      environmentId: input.environmentId ?? null,
      draft: input.draft,
    }),
  });
  if (!response.ok && response.status !== 422) {
    throw new Error(`Stage Play draft validation failed: ${response.status}`);
  }
  return await response.json() as StagePlayGraphDraftValidationV1;
}

function sourceOptionFromHandle(handle: StagePlaySourceHandleV1): StagePlaySourceOption {
  const latestObservationRef = [...handle.latestEvidenceRefs].reverse().find((ref) => /observation/i.test(ref));
  return {
    id: handle.descriptorId ?? handle.producerId ?? handle.sourceId,
    sourceId: handle.sourceId,
    label: handle.label ?? (handle.surface ? `${labelize(handle.sourceClass)} on ${labelize(handle.surface)}` : handle.sourceId),
    sourceClass: handle.sourceClass,
    status: handle.status,
    descriptorId: handle.descriptorId ?? null,
    producerId: handle.producerId ?? null,
    surface: handle.surface ?? null,
    origin: handle.origin ?? null,
    cadenceMs: handle.cadenceMs ?? null,
    latestRef: latestObservationRef ?? handle.latestEvidenceRefs.at(-1) ?? null,
    latestEvidenceRefs: handle.latestEvidenceRefs,
  };
}

const isRawBufferRef = (ref: string): boolean =>
  ref.startsWith("stage_play_raw_session_buffer_entry:");

const isCompactObservationRef = (ref: string): boolean =>
  !isRawBufferRef(ref) && /(?:observation|snapshot|chunk|evidence|visual|transcript|event|descriptor|producer|capability)/i.test(ref);

function labelize(value: string): string {
  return value.replace(/[._-]/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b));
}

function readClientCoordinate(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatStagePlayClock(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusTone(status: string): string {
  if (status === "blocked") return "border-rose-700 bg-rose-950/40 text-rose-100";
  if (status === "missing_evidence") return "border-amber-700 bg-amber-950/40 text-amber-100";
  if (status === "candidate" || status === "ask_user_required") return "border-cyan-700 bg-cyan-950/40 text-cyan-100";
  if (status === "available" || status === "observed") return "border-emerald-700 bg-emerald-950/35 text-emerald-100";
  return "border-slate-700 bg-slate-950/70 text-slate-200";
}

function kindTone(kind: string): string {
  if (kind === "observer") return "border-amber-800/70 bg-amber-950/25";
  if (kind === "source") return "border-sky-800/70 bg-sky-950/25";
  if (kind === "fusion") return "border-indigo-800/70 bg-indigo-950/25";
  if (kind === "interpreter") return "border-fuchsia-800/70 bg-fuchsia-950/25";
  if (kind === "hazard" || kind === "blocked_affordance") return "border-rose-800/70 bg-rose-950/25";
  if (kind === "procedural_binding" || kind === "intent_module") return "border-violet-800/70 bg-violet-950/25";
  if (kind === "affordance" || kind === "resource") return "border-emerald-800/70 bg-emerald-950/25";
  if (kind === "setting" || kind === "actor") return "border-cyan-800/70 bg-cyan-950/25";
  return "border-slate-800 bg-slate-950/70";
}

function laneForBadge(badge: StagePlayBadgeV1): StagePlayLaneId {
  if (badge.kind === "observer" || badge.kind === "source") return "observer";
  if (badge.kind === "compact_observation" || badge.kind === "fusion" || badge.kind === "interpreter") {
    return "compact_observation";
  }
  if (
    badge.kind === "setting" ||
    badge.kind === "actor" ||
    badge.kind === "prop" ||
    badge.kind === "resource" ||
    badge.kind === "hazard" ||
    badge.kind === "constraint" ||
    badge.kind === "goal" ||
    badge.kind === "world_state"
  ) return "stage_bounds";
  if (
    badge.kind === "affordance" ||
    badge.kind === "blocked_affordance" ||
    badge.kind === "recommended_check" ||
    badge.kind === "missing_evidence" ||
    badge.kind === "admission_gate"
  ) return "affordances_missing_checks";
  if (badge.kind === "intent_module" || badge.kind === "procedural_binding") return "procedural_bindings";
  if (badge.kind === "ask_checkpoint") return "helix_ask_checkpoint";
  if (badge.kind === "answer_snapshot") return "answer_snapshot";
  if (badge.kind === "live_output" || badge.kind === "voice_output") return "live_voice_output";
  return "stage_bounds";
}

function laneForDraftNode(node: DraftStagePlayNode): StagePlayLaneId {
  return laneForBadge(node as unknown as StagePlayBadgeV1);
}

function removedGhostsForDiff(
  previous: StagePlayBadgeGraphV1,
  diff: StagePlayGraphDiff,
): StagePlayRemovedBadgeGhost[] {
  return diff.removedBadgeIds
    .map((id) => {
      const badge = previous.badges.find((entry) => entry.id === id);
      if (!badge) return null;
      const lane = laneForBadge(badge);
      const rowIndex = previous.badges
        .filter((entry) => laneForBadge(entry) === lane)
        .findIndex((entry) => entry.id === badge.id);
      return {
        id: badge.id,
        title: badge.title,
        kind: badge.kind,
        status: badge.status,
        lane,
        rowIndex: Math.max(0, rowIndex),
      };
    })
    .filter((entry): entry is StagePlayRemovedBadgeGhost => Boolean(entry));
}

function compactRefTitle(ref: string): string {
  if (ref.includes(":")) return ref.split(":").slice(0, 2).join(":");
  return ref;
}

function syntheticNodeTone(node: StagePlaySyntheticNode): string {
  if (node.kind === "prediction") return "border-cyan-700 bg-cyan-950/35 text-cyan-100";
  if (node.kind === "validation") {
    return node.status === "blocked"
      ? "border-rose-700 bg-rose-950/35 text-rose-100"
      : "border-emerald-700 bg-emerald-950/30 text-emerald-100";
  }
  if (node.kind === "live_answer") return "border-slate-500 bg-slate-900/85 text-slate-100";
  if (node.kind === "handoff") return "border-violet-700 bg-violet-950/35 text-violet-100";
  if (node.kind === "compact_observation") return "border-sky-700 bg-sky-950/30 text-sky-100";
  if (node.status === "blocked") return "border-rose-700 bg-rose-950/35 text-rose-100";
  if (node.status === "missing_evidence") return "border-amber-700 bg-amber-950/35 text-amber-100";
  return "border-amber-700 bg-amber-950/25 text-amber-100";
}

function collectGraphRefs(graph: StagePlayBadgeGraphV1): string[] {
  return uniqueSorted([
    ...graph.sourceWindow.latestObservationRefs,
    ...(graph.sourceWindow.latestSourceDescriptorRefs ?? []),
    ...(graph.sourceWindow.latestSourceProducerRefs ?? []),
    ...(graph.sourceWindow.latestRawSessionBufferRefs ?? []),
    ...graph.sourceWindow.latestSnapshotRefs,
    ...graph.sourceWindow.latestDeltaOverlayRefs,
    ...graph.sourceWindow.latestNavigationRefs,
    ...graph.sourceWindow.sources.flatMap((source) => source.evidenceRefs),
    ...graph.badges.flatMap((badge) => [
      ...badge.evidenceRefs,
      ...badge.sourceRefs.map((ref) => ref.id),
    ]),
    ...graph.recommendedActions.flatMap((action) => action.evidenceRefs),
  ]);
}

function outputNodesForGraph(graph: StagePlayBadgeGraphV1): StagePlaySyntheticNode[] {
  const graphRefs = collectGraphRefs(graph);
  const compactObservationRefs = uniqueSorted([
    ...graph.sourceWindow.latestObservationRefs,
    ...graphRefs.filter((ref) => /stage_play_compact_observation|live_source_observation|visual_observation|audio_transcript|transcript_observation/i.test(ref)),
  ]);
  const predictionRefs = graphRefs.filter((ref) => /stage_play_prediction_hypothesis/i.test(ref));
  const validationRefs = graphRefs.filter((ref) => /stage_play_prediction_validation/i.test(ref));
  const liveAnswerSources = graph.sourceWindow.sources.filter((source) => source.routeTo === "live_answer_output");
  const compactNodes: StagePlaySyntheticNode[] = compactObservationRefs.slice(0, 10).map((ref) => ({
    id: `synthetic:compact:${ref}`,
    kind: "compact_observation",
    lane: "compact_observation",
    title: compactRefTitle(ref),
    status: "observed",
    evidenceRefs: [ref],
    relatedBadgeIds: graph.badges
      .filter((badge) => badge.evidenceRefs.includes(ref) || badge.sourceRefs.some((sourceRef) => sourceRef.id === ref))
      .map((badge) => badge.id),
  }));
  const predictionNodes: StagePlaySyntheticNode[] = predictionRefs.slice(0, 8).map((ref) => ({
    id: `synthetic:prediction:${ref}`,
    kind: "prediction",
    lane: "affordances_missing_checks",
    title: compactRefTitle(ref),
    status: "candidate",
    evidenceRefs: [ref],
    relatedBadgeIds: [],
  }));
  const validationNodes: StagePlaySyntheticNode[] = validationRefs.slice(0, 8).map((ref) => ({
    id: `synthetic:validation:${ref}`,
    kind: "validation",
    lane: "answer_snapshot",
    title: compactRefTitle(ref),
    status: /missed|blocked|fail/i.test(ref) ? "blocked" : "observed",
    evidenceRefs: [ref],
    relatedBadgeIds: [],
  }));
  const nextCheckNodes: StagePlaySyntheticNode[] = graph.recommendedActions.map((action) => ({
    id: `synthetic:action:${action.id}`,
    kind: action.admission === "ask_user" ? "handoff" : "next_check",
    lane: "affordances_missing_checks",
    title: action.label,
    status: action.admission === "blocked"
      ? "blocked"
      : action.missingEvidence.length > 0
        ? "missing_evidence"
        : "candidate",
    evidenceRefs: action.evidenceRefs,
    relatedBadgeIds: graph.badges
      .filter((badge) =>
        action.evidenceRefs.some((ref) => badge.evidenceRefs.includes(ref)) ||
        action.reasonCodes.some((code) => badge.reasonCodes.includes(code))
      )
      .map((badge) => badge.id),
  }));
  const liveAnswerNodes: StagePlaySyntheticNode[] = liveAnswerSources.map((source) => ({
    id: `synthetic:live-answer:${source.sourceId}:${source.modality}`,
    kind: "live_answer",
    lane: "live_voice_output",
    title: labelize(source.modality),
    status: source.status === "active" ? "observed" : source.status === "configured_missing" ? "missing_evidence" : "candidate",
    evidenceRefs: source.evidenceRefs,
    relatedBadgeIds: [],
  }));
  return [...compactNodes, ...predictionNodes, ...nextCheckNodes, ...validationNodes, ...liveAnswerNodes];
}

function proceduralExpression(badge: StagePlayBadgeV1): string {
  if (badge.intentModule) {
    return [
      badge.intentModule.verb,
      ...(badge.intentModule.requires ?? []),
      ...(badge.intentModule.preserves ?? []),
      ...(badge.intentModule.blocks ?? []),
    ].filter(Boolean).join(" + ");
  }
  return badge.reasonCodes.join(" + ");
}

function badgeActionLine(badge: StagePlayBadgeV1): string {
  if (badge.kind === "observer") return "Source custody and routing";
  if (badge.kind === "source") return "Routed live source";
  if (badge.kind === "compact_observation") return "Compact source window";
  if (badge.kind === "stage_interpretation") return "Current interpreted stage bounds";
  if (badge.kind === "ask_checkpoint") return "Model checkpoint boundary";
  if (badge.kind === "answer_snapshot") return "Model-reviewed answer snapshot";
  if (badge.kind === "live_output" || badge.kind === "voice_output") return "Reviewed output lane";
  if (badge.kind === "fusion") return "Source fusion state";
  if (badge.kind === "procedural_binding") return `Assembles: ${proceduralExpression(badge)}`;
  if (badge.kind === "intent_module") return `Verb: ${proceduralExpression(badge)}`;
  if (badge.kind === "affordance") return "Available move candidate";
  if (badge.kind === "blocked_affordance") return "Blocked move boundary";
  if (badge.kind === "hazard") return "Constrains possible moves";
  if (badge.kind === "resource" || badge.kind === "prop") return "Can support or block a procedure";
  return "Observed stage condition";
}

function compactTrayText(value: string | null | undefined, fallback: string): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > 120 ? `${text.slice(0, 117).trimEnd()}...` : text;
}

function badgeTrayTitle(badge: StagePlayBadgeV1): string {
  return badge.dataTray?.title ?? badge.output?.lineKey ?? labelize(badge.kind);
}

function badgeTraySummary(badge: StagePlayBadgeV1): string {
  const binding = badge.liveBindings.find((entry) =>
    entry.compactValue !== null && entry.compactValue !== undefined && entry.compactValue !== ""
  );
  return compactTrayText(
    badge.dataTray?.summary ??
      badge.output?.text ??
      (binding ? `${labelize(binding.bindingKind)}: ${String(binding.compactValue)}` : null) ??
      badge.missingEvidence[0] ??
      badge.reasonCodes[0] ??
      badge.plainMeaning,
    "No compact tray data yet.",
  );
}

function syntheticNodeTraySummary(node: StagePlaySyntheticNode): string {
  return compactTrayText(
    node.evidenceRefs[0] ??
      (node.relatedBadgeIds.length > 0 ? `${node.relatedBadgeIds.length} related badge(s)` : null),
    "Synthetic output from graph evidence.",
  );
}

function StagePlayToolActivityStrip({
  graph,
  diff,
  projectionStatus,
}: {
  graph: StagePlayBadgeGraphV1;
  diff: StagePlayGraphDiff | null;
  projectionStatus: StagePlayProjectionStatus | null;
}) {
  const sourceFreshnessChanged = diff?.sourceWindowChanged === true;
  const missingCount = graph.summary.missingEvidenceCount;
  const summaryText = `Built Stage Play Badge Graph with ${graph.summary.badgeCount} badge(s), ${graph.summary.affordanceCount} affordance(s), and ${graph.summary.blockedAffordanceCount} blocked move(s).`;
  const skippedText = projectionStatus?.skippedLineKeys
    .map((key) => key === "recommendation" ? "recommendation requires model review" : key)
    .join(", ");
  return (
    <div
      data-testid="stage-play-tool-activity-strip"
      className={`absolute bottom-3 left-1/2 z-20 max-w-[calc(100%-7rem)] -translate-x-1/2 rounded-md border bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-2xl ${
        sourceFreshnessChanged
          ? "border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.22)]"
          : "border-slate-800"
      }`}
      title={summaryText}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="font-semibold text-cyan-100">Latest reflect_stage_play_context</span>
        <span className="font-mono text-slate-400">{formatStagePlayClock(graph.generatedAt)}</span>
        <span>{graph.summary.badgeCount} badges</span>
        <span>{graph.summary.affordanceCount} affordances</span>
        <span>{graph.summary.blockedAffordanceCount} blocked</span>
        <span>{graph.summary.proceduralBindingCount} procedural bindings</span>
        <span className={missingCount > 0 ? "text-amber-100" : "text-slate-400"}>{missingCount} missing checks</span>
        <span className={sourceFreshnessChanged ? "text-amber-100" : "text-slate-400"}>
          source freshness: {graph.sourceWindow.freshness}
        </span>
        {diff && hasStagePlayGraphDiff(diff) ? (
          <span className="font-mono text-[11px] text-emerald-200">
            +{diff.addedBadgeIds.length} / ~{diff.updatedBadgeIds.length} / -{diff.removedBadgeIds.length}
          </span>
        ) : null}
        {projectionStatus ? (
          <span className="basis-full text-center font-mono text-[11px] text-emerald-100">
            Projected {projectionStatus.projectedLineKeys.length} lines: {projectionStatus.projectedLineKeys.join(", ") || "none"}
            {projectionStatus.skippedLineKeys.length > 0 ? (
              <span className="text-amber-100"> | Skipped: {skippedText}</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

const STAGE_PLAY_NODE_BUILDER_TYPES: StagePlayNodeBuilderType[] = [
  { kind: "observer", label: "Observer", role: "source custody and routing" },
  { kind: "source", label: "Source Class", role: "live feed handle to wire in" },
  { kind: "fusion", label: "Fusion", role: "multi-source alignment or missing modality" },
  { kind: "interpreter", label: "Interpreter Job", role: "continual reflection over source refs" },
  { kind: "setting", label: "Setting", role: "where the scene is bounded" },
  { kind: "actor", label: "Actor", role: "who can act or be acted on" },
  { kind: "prop", label: "Prop", role: "nearby object or world feature" },
  { kind: "resource", label: "Resource", role: "usable inventory or material" },
  { kind: "hazard", label: "Hazard", role: "danger that constrains movement" },
  { kind: "constraint", label: "Constraint", role: "rule limiting possible moves" },
  { kind: "goal", label: "Goal", role: "desired state or objective" },
  { kind: "world_state", label: "World State", role: "current observed condition" },
  { kind: "affordance", label: "Affordance", role: "move currently available" },
  { kind: "blocked_affordance", label: "Blocked Move", role: "move ruled out by evidence" },
  { kind: "intent_module", label: "Intent Module", role: "verb building block" },
  { kind: "procedural_binding", label: "Procedure", role: "combined action pattern" },
  { kind: "recommended_check", label: "Check", role: "missing validation step" },
  { kind: "admission_gate", label: "Gate", role: "permission boundary" },
  { kind: "missing_evidence", label: "Missing Evidence", role: "unknown fact to resolve" },
];

const STAGE_PLAY_SOURCE_CLASSES = [
  "world_event",
  "environment_state",
  "environment_affordance",
  "visual_frame",
  "audio_transcript",
  "text_chat",
  "screen_summary",
  "minecraft_world_events",
  "calculator_stream",
  "simulation_stream",
  "document_context",
  "note_context",
  "procedure_graph",
  "process_graph",
] as const;

function defaultDraftParametersForNode(node: StagePlayNodeBuilderType): DraftStagePlayNodeParameter[] {
  const presets: Record<StagePlayBadgeV1["kind"], [string, string][]> = {
    observer: [["role", "source_custody"], ["route_policy", "evidence_only"], ["selected_sources", ""]],
    source: [["source_class", ""], ["source_id", ""], ["status", ""], ["descriptor_ref", ""], ["producer_ref", ""], ["latest_ref", ""]],
    fusion: [["fusion_rule", ""], ["input_modalities", ""], ["result", ""]],
    interpreter: [["tool", "live_env.reflect_stage_play_context"], ["cadence", ""], ["input_sources", ""], ["output", "stage_play_badge_graph"]],
    setting: [["dimension", ""], ["biome_or_area", ""], ["bounds", ""]],
    actor: [["entity_id", ""], ["state", ""], ["relation", ""]],
    prop: [["object_or_block", ""], ["position", ""], ["state", ""]],
    resource: [["item_or_material", ""], ["count", ""], ["availability", ""]],
    hazard: [["hazard_type", ""], ["severity", ""], ["radius_or_position", ""]],
    constraint: [["rule", ""], ["applies_to", ""], ["reason", ""]],
    goal: [["target_state", ""], ["priority", ""], ["success_check", ""]],
    world_state: [["observation", ""], ["freshness", ""], ["source_ref", ""]],
    affordance: [["action", ""], ["precondition", ""], ["possible_effect", ""]],
    blocked_affordance: [["blocked_action", ""], ["blocked_by", ""], ["missing_check", ""]],
    intent_module: [["verb", ""], ["target", ""], ["preserves", ""]],
    procedural_binding: [["expression", ""], ["requires", ""], ["possible_result", ""]],
    recommended_check: [["check", ""], ["evidence_needed", ""], ["status", ""]],
    admission_gate: [["gate", ""], ["admission", ""], ["authority", "evidence_only"]],
    missing_evidence: [["question", ""], ["needed_ref", ""], ["status", "missing"]],
  };

  return presets[node.kind].map(([key, value], index) => ({
    id: `${node.kind}:param:${index + 1}`,
    key,
    value,
  }));
}

function readDraftParameter(node: DraftStagePlayNode, key: string): string {
  return node.parameters.find((parameter) => parameter.key === key)?.value ?? "";
}

function setDraftParameterValue(node: DraftStagePlayNode, key: string, value: string): DraftStagePlayNode {
  const index = node.parameters.findIndex((parameter) => parameter.key === key);
  if (index >= 0) {
    return {
      ...node,
      parameters: node.parameters.map((parameter, parameterIndex) =>
        parameterIndex === index ? { ...parameter, value } : parameter,
      ),
    };
  }
  return {
    ...node,
    parameters: [
      ...node.parameters,
      {
        id: `${node.id}:param:${key}`,
        key,
        value,
      },
    ],
  };
}

function draftParameterRecord(node: DraftStagePlayNode): Record<string, string> {
  return Object.fromEntries(
    node.parameters
      .map((parameter) => [parameter.key.trim(), parameter.value.trim()] as const)
      .filter(([key]) => key.length > 0),
  );
}

function splitEvidenceRefs(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function draftNodeEvidenceRefs(node: DraftStagePlayNode): string[] {
  const parameters = draftParameterRecord(node);
  return uniqueSorted([
    ...splitEvidenceRefs(parameters.descriptor_ref),
    ...splitEvidenceRefs(parameters.producer_ref),
    ...splitEvidenceRefs(parameters.latest_ref),
    ...splitEvidenceRefs(parameters.source_ref),
    ...splitEvidenceRefs(parameters.evidence_ref),
  ]);
}

function buildDraftEdges(nodes: DraftStagePlayNode[]) {
  const edges: { from: string; to: string; relation: string; label: string }[] = [];
  let edgeCount = 0;
  const observerNodes = nodes.filter((node) => node.kind === "observer");
  const sourceNodes = nodes.filter((node) => node.kind === "source");
  const interpreterNodes = nodes.filter((node) => node.kind === "interpreter");
  const intentNodes = nodes.filter((node) => node.kind === "intent_module");
  const procedureNodes = nodes.filter((node) => node.kind === "procedural_binding");
  const affordanceNodes = nodes.filter((node) => node.kind === "affordance" || node.kind === "blocked_affordance");
  const constraintNodes = nodes.filter((node) => node.kind === "hazard" || node.kind === "constraint" || node.kind === "missing_evidence");
  const addEdge = (from: DraftStagePlayNode, to: DraftStagePlayNode, relation: string, label: string) => {
    edgeCount += 1;
    edges.push({
      from: from.id,
      to: to.id,
      relation,
      label: `${edgeCount}. ${label}`,
    });
  };

  for (const observer of observerNodes) {
    for (const source of sourceNodes) addEdge(observer, source, "observes", "observer tracks source custody");
    for (const interpreter of interpreterNodes) addEdge(observer, interpreter, "feeds", "observer routes sources to interpreter");
  }
  for (const source of sourceNodes) {
    for (const interpreter of interpreterNodes) addEdge(source, interpreter, "feeds", "source feeds interpreter");
  }
  for (const interpreter of interpreterNodes) {
    for (const node of nodes.filter((entry) => entry.kind !== "source" && entry.kind !== "interpreter")) {
      addEdge(interpreter, node, "interprets", "interpreter produces stage fact");
    }
  }
  for (const intent of intentNodes) {
    for (const procedure of procedureNodes) addEdge(intent, procedure, "composes_with", "intent composes procedure");
  }
  for (const constraint of constraintNodes) {
    for (const affordance of affordanceNodes) addEdge(constraint, affordance, "constrains", "constraint bounds affordance");
  }
  return edges;
}

function buildStagePlayDraftFromNodes(input: {
  draftNodes: DraftStagePlayNode[];
  objective?: string | null;
}) {
  const cadenceCandidate = input.draftNodes
    .flatMap((node) => [
      readDraftParameter(node, "cadence_ms"),
      readDraftParameter(node, "cadence"),
    ])
    .map((value) => Number.parseInt(value, 10))
    .find((value) => Number.isFinite(value) && value > 0);
  return {
    artifactId: "stage_play_graph_draft",
    schemaVersion: "stage_play_graph_draft/v1",
    draftId: "stage_play_panel_draft",
    objective: input.objective ?? "Assemble a Stage Play evidence graph from admitted source handles.",
    nodes: input.draftNodes.map((node) => {
      const parameters = draftParameterRecord(node);
      return {
        id: node.id,
        kind: node.kind,
        title: node.label,
        bind: node.kind === "source"
          ? {
              sourceClass: parameters.source_class || null,
              sourceId: parameters.source_id || null,
            }
          : null,
        parameters,
        evidenceRefs: draftNodeEvidenceRefs(node),
      };
    }),
    edges: buildDraftEdges(input.draftNodes),
    checkpointPolicy: {
      cadenceMs: cadenceCandidate ?? null,
      completeEachWindow: true,
      standingJobRemainsOpen: true,
    },
  };
}

function BadgeButton({
  badge,
  selected,
  onSelect,
}: {
  badge: StagePlayBadgeV1;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition ${
        selected
          ? "border-cyan-500 bg-cyan-950/45 text-cyan-50"
          : `${kindTone(badge.kind)} text-slate-100 hover:border-slate-600`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{badge.title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-slate-400">{badge.plainMeaning}</div>
        </div>
        {badge.kind === "blocked_affordance" || badge.status === "blocked" ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-label="Blocked move" />
        ) : badge.kind === "procedural_binding" ? (
          <Waypoints className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-label="Procedural binding" />
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(badge.kind)}
        </Badge>
        <Badge variant="outline" className={`text-[10px] ${statusTone(badge.status)}`}>
          {labelize(badge.status)}
        </Badge>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
          {badge.confidence.toFixed(2)}
        </Badge>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-2 text-sm text-slate-200">{children}</div>
    </section>
  );
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function floatingTooltipPosition(rect: DOMRect | null | undefined, input: {
  width?: number;
  estimatedHeight?: number;
} = {}): StagePlayTooltipPosition {
  const margin = 12;
  const width = Math.min(input.width ?? 256, Math.max(220, window.innerWidth - margin * 2));
  const maxHeight = Math.max(140, window.innerHeight - margin * 2);
  const estimatedHeight = Math.min(input.estimatedHeight ?? 240, maxHeight);
  if (!rect) {
    return {
      left: margin,
      top: margin,
      width,
      maxHeight,
    };
  }
  const preferredBelow = rect.bottom + 8;
  const preferredAbove = rect.top - estimatedHeight - 8;
  const top = preferredBelow + estimatedHeight <= window.innerHeight - margin
    ? preferredBelow
    : preferredAbove >= margin
      ? preferredAbove
      : clampNumber(rect.top + rect.height / 2 - estimatedHeight / 2, margin, window.innerHeight - margin - estimatedHeight);
  return {
    left: clampNumber(rect.left + rect.width / 2 - width / 2, margin, window.innerWidth - margin - width),
    top,
    width,
    maxHeight,
  };
}

function StagePlayFloatingTooltipView({ tooltip }: { tooltip: StagePlayFloatingTooltip | null }) {
  if (!tooltip) return null;
  if (tooltip.kind === "badge") {
    const { badge, observerSources } = tooltip;
    return (
      <div
        className="pointer-events-none fixed z-[80] overflow-y-auto rounded-md border border-cyan-700/70 bg-slate-950/95 p-3 text-left text-xs text-slate-100 shadow-2xl"
        style={{
          left: tooltip.position.left,
          top: tooltip.position.top,
          width: tooltip.position.width,
          maxHeight: tooltip.position.maxHeight,
        }}
        data-testid="stage-play-floating-tooltip"
      >
        <div className="font-semibold text-cyan-100">{badge.title}</div>
        <div className="mt-1 text-slate-300">{badgeActionLine(badge)}</div>
        <div className="mt-2 font-mono text-[11px] leading-snug text-cyan-100">
          {proceduralExpression(badge) || labelize(badge.kind)}
        </div>
        <div className="mt-2 text-[11px] leading-relaxed text-slate-400">{badge.plainMeaning}</div>
        {badge.kind === "observer" ? (
          <div className="mt-2 space-y-1">
            {observerSources.slice(0, 5).map((source) => (
              <div key={`${source.sourceId}:${source.modality}`} className="rounded border border-slate-800 bg-black/20 px-2 py-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] text-slate-200">{labelize(source.modality)}</span>
                  <span className="text-[10px] text-slate-500">{labelize(source.status)}</span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-amber-100">
                  {source.routeTo} {source.cadenceMs ? `@ ${source.cadenceMs}ms` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{labelize(badge.kind)}</span>
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{labelize(badge.status)}</span>
          {badge.admission ? (
            <span className="rounded border border-amber-700 px-1.5 py-0.5 text-[10px] text-amber-100">{labelize(badge.admission)}</span>
          ) : null}
        </div>
      </div>
    );
  }
  if (tooltip.kind === "output") {
    const { node } = tooltip;
    return (
      <div
        className="pointer-events-none fixed z-[80] overflow-y-auto rounded-md border border-amber-700/70 bg-slate-950/95 p-3 text-left text-xs text-slate-100 shadow-2xl"
        style={{
          left: tooltip.position.left,
          top: tooltip.position.top,
          width: tooltip.position.width,
          maxHeight: tooltip.position.maxHeight,
        }}
        data-testid="stage-play-floating-tooltip"
      >
        <div className="font-semibold text-amber-100">{node.title}</div>
        <div className="mt-1 text-slate-300">{labelize(node.kind)}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{labelize(node.status)}</span>
          <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">{node.evidenceRefs.length} ref(s)</span>
        </div>
        <div className="mt-2 space-y-1 font-mono text-[10px] text-slate-500">
          {node.evidenceRefs.slice(0, 4).map((ref) => <div key={ref} className="truncate">{ref}</div>)}
        </div>
      </div>
    );
  }
  const { node } = tooltip;
  return (
    <div
      className="pointer-events-none fixed z-[80] overflow-y-auto rounded-md border border-cyan-700/70 bg-slate-950/95 p-2 text-left text-xs text-slate-100 shadow-2xl"
      style={{
        left: tooltip.position.left,
        top: tooltip.position.top,
        width: tooltip.position.width,
        maxHeight: tooltip.position.maxHeight,
      }}
      data-testid="stage-play-floating-tooltip"
    >
      <div className="font-semibold text-cyan-100">{node.label}</div>
      <div className="mt-1 text-slate-300">{node.role}</div>
      <div className="mt-1 font-mono text-[10px] text-cyan-100">draft.{node.kind} / {laneForDraftNode(node)}</div>
      <div className="mt-1 text-[10px] text-slate-400">{node.parameters.length} parameter(s)</div>
    </div>
  );
}

function StagePlayGraphCanvas({
  graph,
  graphDiff,
  removedBadgeGhosts,
  selectedBadgeIds,
  selectedBadgeId,
  draftNodes,
  selectedDraftNodeId,
  scrollportRef,
  onSelect,
  onSelectDraftNode,
  onProjectLiveAnswer,
}: {
  graph: StagePlayBadgeGraphV1;
  graphDiff: StagePlayGraphDiff | null;
  removedBadgeGhosts: StagePlayRemovedBadgeGhost[];
  selectedBadgeIds: string[];
  selectedBadgeId: string | null;
  draftNodes: DraftStagePlayNode[];
  selectedDraftNodeId: string | null;
  scrollportRef: React.RefObject<HTMLDivElement>;
  onSelect: (badgeId: string) => void;
  onSelectDraftNode: (nodeId: string) => void;
  onProjectLiveAnswer: () => void;
}) {
  const outputNodes = useMemo(() => outputNodesForGraph(graph), [graph]);
  const [floatingTooltip, setFloatingTooltip] = useState<StagePlayFloatingTooltip | null>(null);
  const lanes = useMemo(() => STAGE_PLAY_LANES.map((lane) => ({
    ...lane,
    badges: graph.badges.filter((badge) => laneForBadge(badge) === lane.id),
    outputNodes: outputNodes.filter((node) => node.lane === lane.id),
  })), [graph.badges, outputNodes]);

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    lanes.forEach((lane, laneIndex) => {
      lane.badges.forEach((badge, rowIndex) => {
        const left = CANVAS_PADDING_X + laneIndex * LANE_STRIDE;
        const top = CANVAS_PADDING_Y + rowIndex * NODE_SLOT_HEIGHT;
        map.set(badge.id, {
          x: left + NODE_WIDTH / 2,
          y: top + NODE_HEIGHT / 2,
        });
      });
    });
    return map;
  }, [lanes]);

  const outputPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    lanes.forEach((lane, laneIndex) => {
      lane.outputNodes.forEach((node, outputIndex) => {
        const left = CANVAS_PADDING_X + laneIndex * LANE_STRIDE;
        const top = CANVAS_PADDING_Y + (lane.badges.length + outputIndex) * NODE_SLOT_HEIGHT;
        map.set(node.id, {
          x: left + NODE_WIDTH / 2,
          y: top + NODE_HEIGHT / 2,
        });
      });
    });
    return map;
  }, [lanes]);

  const width = Math.max(
    1900,
    CANVAS_PADDING_X * 2 + STAGE_PLAY_LANES.length * NODE_WIDTH + (STAGE_PLAY_LANES.length - 1) * LANE_GAP,
    ...draftNodes.map((node) => node.x + NODE_WIDTH),
  );
  const height = Math.max(
    520,
    CANVAS_PADDING_Y * 2 + Math.max(...lanes.map((lane) => lane.badges.length + lane.outputNodes.length), 1) * NODE_SLOT_HEIGHT,
    ...draftNodes.map((node) => node.y + NODE_HEIGHT + DATA_TRAY_HEIGHT),
  );
  const selectedSet = new Set(selectedBadgeIds);
  const addedBadgeIds = new Set(graphDiff?.addedBadgeIds ?? []);
  const updatedBadgeIds = new Set(graphDiff?.updatedBadgeIds ?? []);
  const updatedActionIds = new Set(graphDiff?.updatedActionIds ?? []);
  const relatedEdgeIds = new Set(
    graph.edges
      .filter((edge: StagePlayBadgeEdgeV1) =>
        selectedBadgeId ? edge.from === selectedBadgeId || edge.to === selectedBadgeId : false,
      )
      .map((edge: StagePlayBadgeEdgeV1) => edge.id),
  );

  return (
    <div
      ref={scrollportRef}
      className="relative min-h-0 flex-1 overflow-auto rounded-md border border-slate-800 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.16)_1px,transparent_0)] [background-size:22px_22px]"
      data-testid="stage-play-badge-graph-scrollport"
    >
      <svg width={width} height={height} className="absolute left-0 top-0">
        <defs>
          <marker id="stage-play-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgb(100 116 139)" />
          </marker>
          <marker id="stage-play-dashed-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="rgb(180 83 9)" />
          </marker>
        </defs>
        {graph.edges.map((edge: StagePlayBadgeEdgeV1) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          const active = relatedEdgeIds.has(edge.id) || selectedSet.has(edge.from) || selectedSet.has(edge.to);
          const forward = to.x >= from.x;
          const curve = Math.max(42, Math.abs(to.x - from.x) * 0.48);
          const startX = from.x + (forward ? NODE_WIDTH / 2 : -NODE_WIDTH / 2);
          const endX = to.x - (forward ? NODE_WIDTH / 2 : -NODE_WIDTH / 2);
          return (
            <g key={edge.id}>
              <path
                d={`M ${startX} ${from.y} C ${startX + (forward ? curve : -curve)} ${from.y}, ${endX - (forward ? curve : -curve)} ${to.y}, ${endX} ${to.y}`}
                fill="none"
                stroke={active ? "rgb(34 211 238)" : "rgb(51 65 85)"}
                strokeWidth={active ? 2 : 1}
                markerEnd="url(#stage-play-arrow)"
              />
            </g>
          );
        })}
        {outputNodes.flatMap((node) => node.relatedBadgeIds.slice(0, 4).map((badgeId) => {
          const from = positions.get(badgeId);
          const to = outputPositions.get(node.id);
          if (!from || !to) return null;
          const active = selectedSet.has(badgeId);
          return (
            <path
              key={`${node.id}:${badgeId}`}
              d={`M ${from.x + NODE_WIDTH / 2} ${from.y} C ${from.x + NODE_WIDTH / 2 + 34} ${from.y}, ${to.x - NODE_WIDTH / 2 - 34} ${to.y}, ${to.x - NODE_WIDTH / 2} ${to.y}`}
              fill="none"
              stroke={active ? "rgb(251 191 36)" : "rgb(120 113 108)"}
              strokeDasharray="4 4"
              strokeWidth={active ? 2 : 1}
              markerEnd="url(#stage-play-dashed-arrow)"
            />
          );
        }))}
      </svg>
      <div className="relative" style={{ width, height }}>
        {lanes.map((lane, laneIndex) => (
          <div
            key={lane.id}
            className="pointer-events-none absolute bottom-0 top-0 border-l border-slate-900/55"
            style={{ left: CANVAS_PADDING_X + laneIndex * LANE_STRIDE - LANE_GAP / 2, width: NODE_WIDTH + LANE_GAP }}
            data-testid={`stage-play-lane-${lane.id}`}
            aria-hidden="true"
          />
        ))}
        {graph.badges.map((badge: StagePlayBadgeV1) => {
          const point = positions.get(badge.id);
          if (!point) return null;
          const active = selectedBadgeId === badge.id || selectedSet.has(badge.id);
          const observerSources = badge.kind === "observer" ? graph.sourceWindow.sources ?? [] : [];
          const selectedObserverSourceCount = observerSources.filter((source) => source.selectedForStagePlay).length;
          const isBlocked = badge.kind === "blocked_affordance" || badge.status === "blocked";
          const isMissing = badge.kind === "missing_evidence" || badge.status === "missing_evidence";
          const canProjectFromBadge = badge.id === "interpreter.stage_play_reflection";
          const isNew = addedBadgeIds.has(badge.id);
          const isUpdated = updatedBadgeIds.has(badge.id) || (badge.kind === "observer" && graphDiff?.sourceWindowChanged === true);
          const pulseClass = isNew
            ? "animate-pulse ring-2 ring-emerald-300/70 shadow-[0_0_26px_rgba(52,211,153,0.28)]"
            : isUpdated
              ? "ring-1 ring-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.22)]"
              : isMissing
                ? "animate-pulse"
                : "";
          const trayTone = isMissing
            ? "border-amber-800/70 bg-amber-950/25 text-amber-100"
            : isBlocked
              ? "border-rose-800/70 bg-rose-950/25 text-rose-100"
              : "border-slate-800 bg-slate-950/80 text-slate-300";
          return (
            <div
              key={badge.id}
              className="absolute"
              data-testid="stage-play-node-slot"
              style={{
                left: point.x - NODE_WIDTH / 2,
                top: point.y - NODE_HEIGHT / 2,
                width: NODE_WIDTH,
                height: NODE_HEIGHT + DATA_TRAY_HEIGHT,
              }}
              onMouseEnter={(event) => {
                const key = `badge:${badge.id}`;
                setFloatingTooltip({
                  key,
                  kind: "badge",
                  badge,
                  observerSources,
                  position: floatingTooltipPosition(
                    event.currentTarget?.getBoundingClientRect(),
                    { estimatedHeight: badge.kind === "observer" ? 340 : 230 },
                  ),
                });
              }}
              onMouseMove={(event) => {
                const key = `badge:${badge.id}`;
                const rect = event.currentTarget?.getBoundingClientRect();
                setFloatingTooltip((current) => current?.key === key
                  ? {
                      ...current,
                      position: floatingTooltipPosition(
                        rect,
                        { estimatedHeight: badge.kind === "observer" ? 340 : 230 },
                      ),
                    }
                  : current);
              }}
              onMouseLeave={() => {
                const key = `badge:${badge.id}`;
                setFloatingTooltip((current) => current?.key === key ? null : current);
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(badge.id)}
                className={`relative flex flex-col items-center justify-center rounded-md border px-3 text-center text-xs transition ${
                  active
                    ? "border-cyan-400 bg-cyan-950/70 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                    : isBlocked
                      ? "border-rose-600 bg-rose-950/35 text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.25)] hover:border-rose-400"
                      : isMissing
                        ? "border-amber-600 bg-amber-950/35 text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)] hover:border-amber-400"
                      : `${kindTone(badge.kind)} text-slate-200 hover:border-slate-500`
                } ${pulseClass}`}
                style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
                aria-label={badge.title}
                data-testid="stage-play-graph-node"
              >
                {isBlocked ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-rose-200 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                  />
                ) : null}
                {badge.kind === "observer" ? (
                  <RadioTower className="h-5 w-5 text-amber-100" aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`${badge.kind === "procedural_binding" ? "h-5 w-12 rounded-sm" : "h-3.5 w-3.5 rounded-full"} border ${
                      active
                        ? "border-cyan-100 bg-cyan-300"
                        : badge.status === "blocked"
                          ? "border-rose-300 bg-rose-500/80"
                          : badge.kind === "procedural_binding"
                            ? "border-violet-300 bg-violet-500/80"
                            : badge.kind === "intent_module"
                              ? "border-cyan-300 bg-cyan-500/80"
                              : "border-slate-300 bg-slate-500/80"
                    }`}
                  />
                )}
                {badge.kind === "observer" ? (
                  <>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100">Observer</span>
                    <span className="font-mono text-[9px] text-slate-400">{selectedObserverSourceCount}/{observerSources.length} routed</span>
                  </>
                ) : null}
              </button>
              <div
                className={`mt-2 overflow-hidden rounded-md border px-2 py-1.5 text-[10px] shadow-[0_8px_18px_rgba(2,6,23,0.28)] ${trayTone}`}
                style={{ width: NODE_WIDTH, height: DATA_TRAY_HEIGHT }}
                data-testid="stage-play-data-tray"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold uppercase tracking-wide">{badgeTrayTitle(badge)}</span>
                  <span className="shrink-0 font-mono text-[9px] text-slate-500">{badge.confidence.toFixed(2)}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">
                  {badgeTraySummary(badge)}
                </div>
                {canProjectFromBadge ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onProjectLiveAnswer();
                    }}
                    className="mt-1 h-5 w-full rounded border border-emerald-700 bg-emerald-950/70 px-2 text-[9px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                    data-testid="stage-play-project-live-answer-interpreter"
                  >
                    Project to Live Answer
                  </button>
                ) : (
                  <div className="mt-1 truncate font-mono text-[9px] text-slate-600">{badge.evidenceRefs.length} evidence ref(s)</div>
                )}
              </div>
            </div>
          );
        })}
        {removedBadgeGhosts.map((ghost) => {
          const laneIndex = STAGE_PLAY_LANES.findIndex((lane) => lane.id === ghost.lane);
          const left = CANVAS_PADDING_X + Math.max(0, laneIndex) * LANE_STRIDE;
          const top = CANVAS_PADDING_Y + ghost.rowIndex * NODE_SLOT_HEIGHT;
          const point = {
            x: left + NODE_WIDTH / 2,
            y: top + NODE_HEIGHT / 2,
          };
          return (
            <div
              key={`removed:${ghost.id}`}
              className="pointer-events-none absolute flex items-center justify-center rounded-md border border-slate-700 bg-slate-900/45 px-2 text-center text-[10px] uppercase tracking-wide text-slate-400 opacity-50 shadow-[0_0_18px_rgba(148,163,184,0.16)]"
              style={{
                left: point.x - NODE_WIDTH / 2,
                top: point.y - NODE_HEIGHT / 2,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
              }}
              data-testid="stage-play-removed-ghost"
            >
              <span className="truncate">removed {labelize(ghost.kind)}</span>
            </div>
          );
        })}
        {outputNodes.map((node) => {
          const point = outputPositions.get(node.id);
          if (!point) return null;
          const actionId = node.id.startsWith("synthetic:action:")
            ? node.id.replace("synthetic:action:", "")
            : null;
          const outputPulse = actionId && updatedActionIds.has(actionId)
            ? "ring-1 ring-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.22)]"
            : node.status === "missing_evidence"
              ? "animate-pulse"
              : "";
          const left = point.x - NODE_WIDTH / 2;
          const top = point.y - NODE_HEIGHT / 2;
          const trayTone = node.status === "missing_evidence"
            ? "border-amber-800/70 bg-amber-950/25 text-amber-100"
            : node.status === "blocked"
              ? "border-rose-800/70 bg-rose-950/25 text-rose-100"
              : "border-slate-800 bg-slate-950/80 text-slate-300";
          return (
            <div
              key={node.id}
              className="absolute"
              data-testid="stage-play-node-slot"
              style={{ left, top, width: NODE_WIDTH, height: NODE_HEIGHT + DATA_TRAY_HEIGHT }}
            >
              <button
                type="button"
                onClick={() => {
                  if (node.relatedBadgeIds[0]) onSelect(node.relatedBadgeIds[0]);
                }}
                className={`flex items-center justify-center rounded-md border px-2 text-center text-[10px] font-semibold uppercase tracking-wide transition ${syntheticNodeTone(node)} hover:border-cyan-400 ${outputPulse}`}
                style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
                aria-label={node.title}
                data-testid="stage-play-output-node"
                onMouseEnter={(event) => {
                  const key = `output:${node.id}`;
                  setFloatingTooltip({
                    key,
                    kind: "output",
                    node,
                    position: floatingTooltipPosition(event.currentTarget?.getBoundingClientRect(), { estimatedHeight: 190 }),
                  });
                }}
                onMouseMove={(event) => {
                  const key = `output:${node.id}`;
                  const rect = event.currentTarget?.getBoundingClientRect();
                  setFloatingTooltip((current) => current?.key === key
                    ? {
                        ...current,
                        position: floatingTooltipPosition(rect, { estimatedHeight: 190 }),
                      }
                    : current);
                }}
                onMouseLeave={() => {
                  const key = `output:${node.id}`;
                  setFloatingTooltip((current) => current?.key === key ? null : current);
                }}
              >
                {node.kind === "validation" ? (
                  <span className="text-base" aria-hidden="true">{node.status === "blocked" ? "x" : "ok"}</span>
                ) : node.kind === "prediction" ? (
                  <span aria-hidden="true">-&gt;</span>
                ) : node.kind === "live_answer" ? (
                  <span className="font-mono text-[10px]" aria-hidden="true">OUT</span>
                ) : node.status === "missing_evidence" ? (
                  <span aria-hidden="true">?</span>
                ) : (
                  <span aria-hidden="true">.</span>
                )}
              </button>
              <div
                className={`mt-2 overflow-hidden rounded-md border px-2 py-1.5 text-[10px] shadow-[0_8px_18px_rgba(2,6,23,0.28)] ${trayTone}`}
                style={{ width: NODE_WIDTH, height: DATA_TRAY_HEIGHT }}
                data-testid="stage-play-data-tray"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold uppercase tracking-wide">{labelize(node.kind)}</span>
                  <span className="shrink-0 font-mono text-[9px] text-slate-500">{labelize(node.status)}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">
                  {syntheticNodeTraySummary(node)}
                </div>
                {node.kind === "live_answer" ? (
                  <button
                    type="button"
                    onClick={onProjectLiveAnswer}
                    className="mt-1 h-5 w-full rounded border border-emerald-700 bg-emerald-950/80 px-2 text-[9px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                    data-testid="stage-play-project-live-answer-output"
                  >
                    Project to Live Answer
                  </button>
                ) : (
                  <div className="mt-1 truncate font-mono text-[9px] text-slate-600">{node.evidenceRefs.length} evidence ref(s)</div>
                )}
              </div>
            </div>
          );
        })}
        {draftNodes.map((node) => (
          <button
            type="button"
            key={node.id}
            className={`absolute flex h-12 w-12 items-center justify-center rounded-sm border-2 shadow-lg transition ${
              selectedDraftNodeId === node.id
                ? "border-cyan-300 bg-cyan-950/70 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                : kindTone(node.kind)
            }`}
            style={{ left: node.x - 24, top: node.y - 24 }}
            aria-label={`Draft ${node.label} node`}
            data-testid="stage-play-draft-node"
            onClick={() => onSelectDraftNode(node.id)}
            onMouseEnter={(event) => {
              const key = `draft:${node.id}`;
              setFloatingTooltip({
                key,
                kind: "draft",
                node,
                position: floatingTooltipPosition(event.currentTarget?.getBoundingClientRect(), { width: 224, estimatedHeight: 130 }),
              });
            }}
            onMouseMove={(event) => {
              const key = `draft:${node.id}`;
              const rect = event.currentTarget?.getBoundingClientRect();
              setFloatingTooltip((current) => current?.key === key
                ? {
                    ...current,
                    position: floatingTooltipPosition(rect, { width: 224, estimatedHeight: 130 }),
                  }
                : current);
            }}
            onMouseLeave={() => {
              const key = `draft:${node.id}`;
              setFloatingTooltip((current) => current?.key === key ? null : current);
            }}
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-sm border border-cyan-200 bg-cyan-400/80"
            />
          </button>
        ))}
        <StagePlayFloatingTooltipView tooltip={floatingTooltip} />
      </div>
    </div>
  );
}

function DraftNodeParameterEditor({
  node,
  sourceOptions,
  draftValidation,
  onClose,
  onRemove,
  onUpdateParameter,
  onAddParameter,
  onSetSourceClass,
  onApplySourceOption,
}: {
  node: DraftStagePlayNode;
  sourceOptions: StagePlaySourceOption[];
  draftValidation?: StagePlayGraphDraftValidationV1 | null;
  onClose: () => void;
  onRemove: (nodeId: string) => void;
  onUpdateParameter: (nodeId: string, parameterId: string, field: "key" | "value", value: string) => void;
  onAddParameter: (nodeId: string) => void;
  onSetSourceClass: (nodeId: string, sourceClass: string) => void;
  onApplySourceOption: (nodeId: string, option: StagePlaySourceOption) => void;
}) {
  const selectedSourceClass = readDraftParameter(node, "source_class");
  const matchingSourceOptions = sourceOptions.filter((option) =>
    !selectedSourceClass || option.sourceClass === selectedSourceClass,
  );
  const sourceClassOptions = Array.from(new Set([
    ...STAGE_PLAY_SOURCE_CLASSES,
    ...sourceOptions.map((option) => option.sourceClass),
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return (
    <aside
      data-testid="stage-play-draft-parameter-editor"
      className="absolute right-3 top-3 z-30 w-80 rounded-md border border-slate-800 bg-slate-950/95 p-3 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Draft Parameters</div>
          <div className="mt-0.5 text-base font-semibold leading-tight">{node.label}</div>
          <div className="mt-1 font-mono text-[11px] text-slate-500">draft.{node.kind}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRemove(node.id)}
            className="rounded border border-rose-800/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-200 hover:border-rose-500"
            aria-label="Remove draft node"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
            aria-label="Close draft parameters"
          >
            Close
          </button>
        </div>
      </div>

      {node.kind === "source" ? (
        <div className="mt-3 rounded-md border border-sky-800/70 bg-sky-950/20 p-3">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-sky-200">
            Source class
            <select
              value={selectedSourceClass}
              onChange={(event) => onSetSourceClass(node.id, event.target.value)}
              className="mt-1 h-8 w-full rounded border border-slate-800 bg-slate-950 px-2 text-xs normal-case tracking-normal text-slate-100 outline-none focus:border-sky-500"
              aria-label="Source class"
            >
              <option value="">Choose source class</option>
              {sourceClassOptions.map((sourceClass) => (
                <option key={sourceClass} value={sourceClass}>{labelize(sourceClass)}</option>
              ))}
            </select>
          </label>
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Active sources</div>
            {matchingSourceOptions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2 text-[11px] text-slate-500">
                No matching source handle is active for this class.
              </div>
            ) : matchingSourceOptions.slice(0, 8).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onApplySourceOption(node.id, option)}
                className="w-full rounded border border-slate-800 bg-black/20 p-2 text-left text-xs text-slate-200 hover:border-sky-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{option.label}</span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">{labelize(option.status)}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-sky-100">{option.sourceClass} / {option.sourceId}</div>
                <div className="mt-1 truncate text-[10px] text-slate-500">
                  {option.descriptorId ?? "no descriptor"} / {option.producerId ?? "no producer"}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {node.parameters.map((parameter) => (
          <div key={parameter.id} className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <Input
              value={parameter.key}
              onChange={(event) => onUpdateParameter(node.id, parameter.id, "key", event.target.value)}
              aria-label={`Parameter key ${parameter.key}`}
              className="h-8 border-slate-800 bg-slate-950 text-xs text-slate-100"
            />
            <Input
              value={parameter.value}
              onChange={(event) => onUpdateParameter(node.id, parameter.id, "value", event.target.value)}
              aria-label={`Parameter value ${parameter.key}`}
              placeholder="value"
              className="h-8 border-slate-800 bg-slate-950 text-xs text-slate-100 placeholder:text-slate-600"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddParameter(node.id)}
        className="mt-3 w-full rounded-md border border-cyan-700 bg-cyan-950/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:border-cyan-400"
      >
        Add parameter
      </button>
      <div className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Manual parameters stay local until a future admission path explicitly persists them.
      </div>
      <div
        data-testid="stage-play-draft-validation-status"
        className={`mt-3 rounded-md border p-3 text-xs ${
          draftValidation?.ok
            ? "border-emerald-800 bg-emerald-950/25 text-emerald-100"
            : draftValidation
              ? "border-amber-800 bg-amber-950/25 text-amber-100"
              : "border-slate-800 bg-black/20 text-slate-400"
        }`}
      >
        <div className="font-semibold">
          {draftValidation?.ok ? "Draft accepted" : draftValidation ? "Draft needs checks" : "Draft not submitted"}
        </div>
        {draftValidation ? (
          <div className="mt-2 space-y-1">
            <div className="font-mono text-[10px] text-slate-300">{draftValidation.schemaVersion}</div>
            {draftValidation.resolvedSourceIds.length > 0 ? (
              <div>Resolved source: {draftValidation.resolvedSourceIds.join(", ")}</div>
            ) : null}
            {draftValidation.issues.slice(0, 3).map((issue) => (
              <div key={issue}>Issue: {issue}</div>
            ))}
            {draftValidation.warnings.slice(0, 2).map((warning) => (
              <div key={warning}>Warning: {warning}</div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function StagePlayBindingOverlay({
  graph,
  builderContext,
  sourceOptions,
  draftNodeCount,
  draftValidation,
  query,
  setQuery,
  groupedBadges,
  activeFilterKind,
  setActiveFilterKind,
  selectedBadgeId,
  selectedBadgeIds,
  setSelectedBadgeIds,
  toggleSelectedBadgeId,
  selectedBadge,
  relatedEdges,
  relatedBadges,
  relatedActions,
  onStartBuilderDrag,
  onObserverDraftAction,
  sourceSetupCadenceMs,
  sourceSetupStatus,
  onSetSourceSetupCadenceMs,
  onStartVisualSourceSetup,
  onAttachAudioTranscriptSource,
  onPauseVisualSourceSetup,
  onProjectLiveAnswer,
  sourceAuditSelection,
  rawSessionBufferEntries,
  rawSessionBufferLoading,
  onOpenSourceAudit,
  onClearRawSessionBuffer,
  onClose,
}: {
  graph: StagePlayBadgeGraphV1;
  builderContext?: StagePlayBuilderContextResponse | null;
  sourceOptions: StagePlaySourceOption[];
  draftNodeCount: number;
  draftValidation?: StagePlayGraphDraftValidationV1 | null;
  query: string;
  setQuery: (value: string) => void;
  groupedBadges: { kind: string; badges: StagePlayBadgeV1[] }[];
  activeFilterKind: string | null;
  setActiveFilterKind: (kind: string | null) => void;
  selectedBadgeId: string | null;
  selectedBadgeIds: string[];
  setSelectedBadgeIds: (badgeIds: string[]) => void;
  toggleSelectedBadgeId: (badgeId: string) => void;
  selectedBadge: StagePlayBadgeV1 | null;
  relatedEdges: StagePlayBadgeEdgeV1[];
  relatedBadges: StagePlayBadgeV1[];
  relatedActions: StagePlayBadgeGraphRecommendedActionV1[];
  onStartBuilderDrag: (nodeType: StagePlayNodeBuilderType, event: React.PointerEvent<HTMLButtonElement>) => void;
  onObserverDraftAction: (source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction) => void;
  sourceSetupCadenceMs: number;
  sourceSetupStatus: StagePlaySourceSetupStatus;
  onSetSourceSetupCadenceMs: (cadenceMs: number) => void;
  onStartVisualSourceSetup: (surface: StagePlayVisualCaptureSurface) => void;
  onAttachAudioTranscriptSource: (source: StagePlayAudioTranscriptSource) => void;
  onPauseVisualSourceSetup: () => void;
  onProjectLiveAnswer: () => void;
  sourceAuditSelection: StagePlaySourceAuditSelection;
  rawSessionBufferEntries: StagePlayRawSessionBufferEntryV1[];
  rawSessionBufferLoading: boolean;
  onOpenSourceAudit: (source: StagePlayObserverSource, mode: StagePlaySourceAuditMode) => void;
  onClearRawSessionBuffer: (source: StagePlayObserverSource | null) => void;
  onClose: () => void;
}) {
  const selectedBadges = graph.badges.filter((badge) => selectedBadgeIds.includes(badge.id));
  const selectedExpression = selectedBadges.length > 0
    ? selectedBadges.map((badge) => proceduralExpression(badge) || badge.id).join(" + ")
    : "Click badges in the map to assemble a procedural trace.";
  const liveNodeGroups = activeFilterKind ? groupedBadges : [];
  const visibleBadges = liveNodeGroups.flatMap((group) => group.badges);

  function addNodeType(kind: StagePlayBadgeV1["kind"]) {
    const matchingIds = graph.badges.filter((badge) => badge.kind === kind).map((badge) => badge.id);
    setActiveFilterKind(kind);
    if (matchingIds.length > 0) {
      setSelectedBadgeIds(Array.from(new Set([...selectedBadgeIds, ...matchingIds])));
    }
  }

  return (
    <aside
      data-testid="stage-play-binding-overlay"
      className="absolute bottom-3 left-3 top-3 z-30 flex w-[340px] flex-col rounded-md border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Stage Console</div>
          <div className="mt-0.5 text-base font-semibold leading-tight">Builder Palette</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Add node types, watch live evidence fill them, and assemble procedures without granting execution.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500 hover:text-slate-100"
          aria-label="Close Stage Play console"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-slate-800 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search live badges"
            className="h-9 border-slate-800 bg-slate-950 pl-8 text-slate-100 placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <Section title="Builder Palette">
          <div className="space-y-2">
            {STAGE_PLAY_NODE_BUILDER_TYPES.map((nodeType) => {
              const count = graph.summary.kindCounts[nodeType.kind] ?? 0;
              const active = activeFilterKind === nodeType.kind;
              return (
                <button
                  key={nodeType.kind}
                  type="button"
                  onPointerDown={(event) => onStartBuilderDrag(nodeType, event)}
                  onClick={() => addNodeType(nodeType.kind)}
                  className={`w-full rounded-md border p-2 text-left transition ${
                    active
                      ? "border-cyan-500 bg-cyan-950/45"
                      : "border-slate-800 bg-black/20 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{nodeType.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{nodeType.role}</div>
                    </div>
                    <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Tool assembly">
          <div data-testid="stage-play-builder-artifacts" className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {builderContext?.catalog.schemaVersion ?? "stage_play_builder_catalog/v1"}
              </Badge>
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {builderContext?.sourceQuery.schemaVersion ?? "stage_play_source_query/v1"}
              </Badge>
              <Badge variant="outline" className="border-cyan-800 text-cyan-100">
                {draftValidation?.schemaVersion ?? "stage_play_graph_draft_validation/v1"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">{sourceOptions.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">sources</div>
              </div>
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">{draftNodeCount}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">draft nodes</div>
              </div>
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-mono text-sm text-slate-100">
                  {draftValidation ? (draftValidation.ok ? "ok" : "check") : "idle"}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">validation</div>
              </div>
            </div>
            {draftValidation ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-semibold text-slate-200">
                  {draftValidation.ok ? "Draft accepted by builder contract." : "Draft needs checks before reflection."}
                </div>
                {draftValidation.issues.length > 0 ? (
                  <div className="mt-1 text-amber-100">{draftValidation.issues[0]}</div>
                ) : draftValidation.warnings.length > 0 ? (
                  <div className="mt-1 text-slate-400">{draftValidation.warnings[0]}</div>
                ) : (
                  <div className="mt-1 text-slate-400">Evidence-only validation; no execution permission granted.</div>
                )}
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="Source handles">
          <div className="space-y-1.5 text-xs">
            {sourceOptions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-black/20 p-2 text-slate-500">
                No active source handles are available to stage.
              </div>
            ) : sourceOptions.slice(0, 6).map((option) => (
              <div key={option.id} className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-100">{option.label}</span>
                  <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">{labelize(option.status)}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[10px] text-cyan-100">{option.sourceClass} / {option.sourceId}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Procedure Trace">
          <div className="font-mono text-xs leading-relaxed text-cyan-100">{selectedExpression}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedBadges.map((badge) => (
              <Badge key={badge.id} variant="outline" className="border-cyan-700 text-cyan-100">
                {badge.title}
              </Badge>
            ))}
          </div>
        </Section>

        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {activeFilterKind ? `${labelize(activeFilterKind)} evidence nodes` : "Evidence Nodes"}
            </div>
            {activeFilterKind ? (
              <button
                type="button"
                onClick={() => setActiveFilterKind(null)}
                className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
              >
                Show all
              </button>
            ) : null}
          </div>
          {!activeFilterKind ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
              Choose a builder palette type above to stage matching evidence nodes onto the graph assembly.
            </div>
          ) : visibleBadges.length === 0 ? (
            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
              This node type is ready for tool-call assembly, but no admitted live source has filled it yet.
            </div>
          ) : liveNodeGroups.map((group) => (
            <div key={group.kind}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{labelize(group.kind)}</div>
              <div className="space-y-2">
                {group.badges.map((badge) => (
                  <BadgeButton
                    key={badge.id}
                    badge={badge}
                    selected={selectedBadgeId === badge.id || selectedBadgeIds.includes(badge.id)}
                    onSelect={() => toggleSelectedBadgeId(badge.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Inspector
            badge={selectedBadge}
            relatedEdges={relatedEdges}
            relatedBadges={relatedBadges}
            relatedActions={relatedActions}
            observerSources={graph.sourceWindow.sources}
            onObserverDraftAction={onObserverDraftAction}
            sourceSetupCadenceMs={sourceSetupCadenceMs}
            sourceSetupStatus={sourceSetupStatus}
            onSetSourceSetupCadenceMs={onSetSourceSetupCadenceMs}
            onStartVisualSourceSetup={onStartVisualSourceSetup}
            onAttachAudioTranscriptSource={onAttachAudioTranscriptSource}
            onPauseVisualSourceSetup={onPauseVisualSourceSetup}
            onProjectLiveAnswer={onProjectLiveAnswer}
            sourceAuditSelection={sourceAuditSelection}
            rawSessionBufferEntries={rawSessionBufferEntries}
            rawSessionBufferLoading={rawSessionBufferLoading}
            onOpenSourceAudit={onOpenSourceAudit}
            onClearRawSessionBuffer={onClearRawSessionBuffer}
          />
        </div>
      </div>
    </aside>
  );
}

function Inspector({
  badge,
  relatedEdges,
  relatedBadges,
  relatedActions,
  observerSources,
  onObserverDraftAction,
  sourceSetupCadenceMs,
  sourceSetupStatus,
  onSetSourceSetupCadenceMs,
  onStartVisualSourceSetup,
  onAttachAudioTranscriptSource,
  onPauseVisualSourceSetup,
  onProjectLiveAnswer,
  sourceAuditSelection,
  rawSessionBufferEntries,
  rawSessionBufferLoading,
  onOpenSourceAudit,
  onClearRawSessionBuffer,
}: {
  badge: StagePlayBadgeV1 | null;
  relatedEdges: StagePlayBadgeEdgeV1[];
  relatedBadges: StagePlayBadgeV1[];
  relatedActions: StagePlayBadgeGraphRecommendedActionV1[];
  observerSources: StagePlayObserverSource[];
  onObserverDraftAction: (source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction) => void;
  sourceSetupCadenceMs: number;
  sourceSetupStatus: StagePlaySourceSetupStatus;
  onSetSourceSetupCadenceMs: (cadenceMs: number) => void;
  onStartVisualSourceSetup: (surface: StagePlayVisualCaptureSurface) => void;
  onAttachAudioTranscriptSource: (source: StagePlayAudioTranscriptSource) => void;
  onPauseVisualSourceSetup: () => void;
  onProjectLiveAnswer: () => void;
  sourceAuditSelection: StagePlaySourceAuditSelection;
  rawSessionBufferEntries: StagePlayRawSessionBufferEntryV1[];
  rawSessionBufferLoading: boolean;
  onOpenSourceAudit: (source: StagePlayObserverSource, mode: StagePlaySourceAuditMode) => void;
  onClearRawSessionBuffer: (source: StagePlayObserverSource | null) => void;
}) {
  if (!badge) {
    return (
      <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4 text-sm text-slate-400">
        Select a Stage Play badge to inspect live bindings, affordances, procedural bindings, evidence, and admission.
      </aside>
    );
  }

  const expression = proceduralExpression(badge);
  const sourceControl = badge.kind === "source"
    ? observerSources.find((source) =>
      badge.subjects.includes(source.sourceId) ||
      badge.evidenceRefs.some((ref) => source.evidenceRefs.includes(ref)) ||
      badge.sourceRefs.some((ref) => source.evidenceRefs.includes(ref.id))
    ) ?? null
    : null;

  return (
    <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-50">{badge.title}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{badge.id}</div>
        </div>
        <Badge variant="outline" className={statusTone(badge.status)}>
          {labelize(badge.status)}
        </Badge>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Section title="Meaning">
          <p>{badge.plainMeaning}</p>
          <p className="mt-2 text-xs text-slate-400">{badge.whyItMatters}</p>
        </Section>

        {badge.kind === "observer" ? (
          <>
          <Section title="Source Setup">
            <div className="space-y-3">
              <div className="rounded border border-slate-800 bg-black/20 p-2 text-[11px] leading-relaxed text-slate-400">
                <div className="font-semibold uppercase tracking-wide text-amber-100">Narrative test defaults</div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <div>Route: <span className="font-mono text-slate-200">{STAGE_PLAY_SOURCE_SETUP_DEFAULTS.routeTo}</span></div>
                  <div>Visual: <span className="font-mono text-slate-200">{STAGE_PLAY_SOURCE_SETUP_DEFAULTS.visualCadenceMs / 1000}s</span></div>
                  <div>Audio: <span className="font-mono text-slate-200">{STAGE_PLAY_SOURCE_SETUP_DEFAULTS.audioWindowMs / 1000}s</span></div>
                  <div>Window: <span className="font-mono text-slate-200">{STAGE_PLAY_SOURCE_SETUP_DEFAULTS.compactObservationWindowMs / 1000}s</span></div>
                  <div className="col-span-2">Raw retention: <span className="font-mono text-slate-200">{STAGE_PLAY_SOURCE_SETUP_DEFAULTS.rawRetention}</span></div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Set visual cadence</div>
                <div className="flex flex-wrap gap-1">
                  {STAGE_PLAY_VISUAL_CADENCE_OPTIONS.map((cadenceMs) => (
                    <button
                      key={cadenceMs}
                      type="button"
                      onClick={() => onSetSourceSetupCadenceMs(cadenceMs)}
                      className={`rounded border px-2 py-1 text-[10px] font-semibold ${
                        sourceSetupCadenceMs === cadenceMs
                          ? "border-cyan-500 bg-cyan-950/40 text-cyan-100"
                          : "border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-100"
                      }`}
                    >
                      {cadenceMs / 1000}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onStartVisualSourceSetup("browser_tab")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Capture browser tab visual
                </button>
                <button
                  type="button"
                  onClick={() => onStartVisualSourceSetup("screen")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Capture screen visual
                </button>
                <button
                  type="button"
                  onClick={() => onAttachAudioTranscriptSource("browser_audio")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Attach browser audio transcript
                </button>
                <button
                  type="button"
                  onClick={() => onAttachAudioTranscriptSource("microphone")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Attach microphone transcript
                </button>
                <button
                  type="button"
                  onClick={() => onObserverDraftAction(observerSources.find((source) => source.selectedForStagePlay) ?? observerSources[0] ?? null, "use_for_stage_play")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Use source for Stage Play
                </button>
                <button
                  type="button"
                  onClick={onPauseVisualSourceSetup}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Pause source
                </button>
                <button
                  type="button"
                  onClick={onProjectLiveAnswer}
                  className="col-span-2 rounded border border-emerald-700 bg-emerald-950/25 px-2 py-1.5 text-[10px] font-semibold text-emerald-100 hover:border-emerald-400"
                  data-testid="stage-play-project-live-answer"
                >
                  Project to Live Answer
                </button>
              </div>

              {sourceSetupStatus.message ? (
                <div className={`rounded border p-2 text-[11px] ${
                  sourceSetupStatus.level === "error"
                    ? "border-rose-800 bg-rose-950/25 text-rose-100"
                    : sourceSetupStatus.level === "ok"
                      ? "border-emerald-800 bg-emerald-950/25 text-emerald-100"
                      : sourceSetupStatus.level === "working"
                        ? "border-cyan-800 bg-cyan-950/25 text-cyan-100"
                        : "border-slate-800 bg-black/20 text-slate-400"
                }`}>
                  {sourceSetupStatus.message}
                </div>
              ) : null}
              <div className="text-[11px] leading-relaxed text-slate-500">
                Visual capture is owned by the visual source producer. Audio transcript attachment is registered as source setup and reflected after source capability evidence exists.
              </div>
            </div>
          </Section>

          <Section title="Observer Source Routes">
            <div className="space-y-2">
              {observerSources.length === 0 ? (
                <div className="text-slate-500">No source routes are registered yet.</div>
              ) : observerSources.map((source) => (
                <div key={`${source.sourceId}:${source.modality}`} className="rounded border border-slate-800 bg-black/20 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">{labelize(source.modality)}</div>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{source.sourceId}</div>
                    </div>
                    <Badge variant="outline" className={statusTone(source.status === "active" ? "observed" : source.status === "configured_missing" ? "missing_evidence" : source.status)}>
                      {labelize(source.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>Route: <span className="font-mono text-amber-100">{source.routeTo}</span></div>
                    <div>Selected: <span className="font-mono text-slate-200">{source.selectedForStagePlay ? "yes" : "no"}</span></div>
                    <div>Fidelity: <span className="font-mono text-slate-200">{source.fidelityScore.toFixed(2)}</span></div>
                    <div>Cadence: <span className="font-mono text-slate-200">{source.cadenceMs ? `${source.cadenceMs}ms` : "none"}</span></div>
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-slate-400">{source.contribution}</div>
                  {source.missingReason || source.nextRequiredAction ? (
                    <div className="mt-2 rounded border border-amber-900/60 bg-amber-950/20 p-2 text-[11px] text-amber-100">
                      {source.missingReason ?? source.nextRequiredAction}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => onObserverDraftAction(source, "use_for_stage_play")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Use for Stage Play
                    </button>
                    <button
                      type="button"
                      onClick={() => onObserverDraftAction(source, "route_to_narrative")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Route to Narrative
                    </button>
                    <button
                      type="button"
                      onClick={() => onObserverDraftAction(source, "route_to_minecraft_world")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Route to Minecraft World
                    </button>
                    {source.modality === "visual_frame" ? (
                      <button
                        type="button"
                        onClick={() => onObserverDraftAction(source, "start_visual_interval")}
                        className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                      >
                        Start visual interval
                      </button>
                    ) : null}
                    {source.modality === "audio_transcript" ? (
                      <button
                        type="button"
                        onClick={() => onObserverDraftAction(source, "attach_audio_transcript")}
                        className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                      >
                        Attach audio transcript
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onObserverDraftAction(source, "pause_source")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Pause source
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSourceAudit(source, "source_evidence")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Review source evidence
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSourceAudit(source, "compact_observation")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Open compact observation
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSourceAudit(source, "raw_buffer")}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                    >
                      Open raw buffer preview
                    </button>
                    <button
                      type="button"
                      onClick={() => onClearRawSessionBuffer(source)}
                      className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-amber-500 hover:text-amber-100"
                    >
                      Clear raw buffer
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onClearRawSessionBuffer(null)}
                className="w-full rounded border border-slate-700 px-2 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
              >
                Clear session buffer
              </button>
              <div className="text-[11px] leading-relaxed text-slate-500">
                Routing controls create local draft requests. Audit controls operate on the separate raw session buffer; the graph updates only after source capability or evidence refs exist.
              </div>
            </div>
          </Section>

          {sourceAuditSelection ? (
            <Section title="Source Evidence Audit">
              <div className="space-y-2 text-xs">
                <div className="rounded border border-slate-800 bg-black/20 p-2">
                  <div className="font-semibold text-slate-100">{labelize(sourceAuditSelection.source.modality)}</div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">{sourceAuditSelection.source.sourceId}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="border-slate-700 text-slate-300">{labelize(sourceAuditSelection.mode)}</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300">audit buffer, not graph</Badge>
                  </div>
                </div>
                {sourceAuditSelection.mode === "source_evidence" ? (
                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                    {sourceAuditSelection.source.evidenceRefs.length > 0
                      ? sourceAuditSelection.source.evidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                      : <div>No source evidence refs recorded.</div>}
                  </div>
                ) : null}
                {sourceAuditSelection.mode === "compact_observation" ? (
                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                    {sourceAuditSelection.source.evidenceRefs.filter(isCompactObservationRef).length > 0
                      ? sourceAuditSelection.source.evidenceRefs.filter(isCompactObservationRef).map((ref) => <div key={ref}>{ref}</div>)
                      : <div>No compact observation refs recorded.</div>}
                  </div>
                ) : null}
                {sourceAuditSelection.mode === "raw_buffer" ? (
                  <div className="space-y-2">
                    {rawSessionBufferLoading ? (
                      <div className="text-slate-500">Loading raw buffer previews...</div>
                    ) : rawSessionBufferEntries.length > 0 ? rawSessionBufferEntries.map((entry) => (
                      <div key={entry.entryId} className="rounded border border-slate-800 bg-black/20 p-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className="border-slate-700 text-slate-300">{labelize(entry.rawKind)}</Badge>
                          <Badge variant="outline" className="border-slate-700 text-slate-300">{entry.retention.policy}</Badge>
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-slate-500">{entry.entryId}</div>
                        <div className="mt-1 font-mono text-[10px] text-slate-500">{entry.rawRef}</div>
                        {entry.rawTextPreview ? (
                          <div className="mt-2 rounded border border-slate-800 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-300">
                            {entry.rawTextPreview}
                          </div>
                        ) : null}
                      </div>
                    )) : (
                      <div className="text-slate-500">No raw buffer preview entries for this source.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}
          </>
        ) : null}

        {badge.kind === "source" && sourceControl ? (
          <Section title="Source Route Controls">
            <div className="space-y-2 text-xs">
              <div className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-100">{labelize(sourceControl.modality)}</div>
                    <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{sourceControl.sourceId}</div>
                  </div>
                  <Badge variant="outline" className={statusTone(sourceControl.status === "active" ? "observed" : sourceControl.status === "configured_missing" ? "missing_evidence" : sourceControl.status)}>
                    {labelize(sourceControl.status)}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>Route: <span className="font-mono text-amber-100">{sourceControl.routeTo}</span></div>
                  <div>Selected: <span className="font-mono text-slate-200">{sourceControl.selectedForStagePlay ? "yes" : "no"}</span></div>
                  <div>Fidelity: <span className="font-mono text-slate-200">{sourceControl.fidelityScore.toFixed(2)}</span></div>
                  <div>Cadence: <span className="font-mono text-slate-200">{sourceControl.cadenceMs ? `${sourceControl.cadenceMs}ms` : "none"}</span></div>
                </div>
                <div className="mt-2 text-[11px] leading-relaxed text-slate-400">{sourceControl.contribution}</div>
              </div>

              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => onObserverDraftAction(sourceControl, "use_for_stage_play")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Use for Stage Play
                </button>
                <button
                  type="button"
                  onClick={() => onObserverDraftAction(sourceControl, "route_to_narrative")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Route to Narrative
                </button>
                <button
                  type="button"
                  onClick={() => onObserverDraftAction(sourceControl, "route_to_minecraft_world")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Route to Minecraft World
                </button>
                {sourceControl.modality === "visual_frame" ? (
                  <button
                    type="button"
                    onClick={() => onObserverDraftAction(sourceControl, "start_visual_interval")}
                    className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                  >
                    Start visual interval
                  </button>
                ) : null}
                {sourceControl.modality === "audio_transcript" ? (
                  <button
                    type="button"
                    onClick={() => onObserverDraftAction(sourceControl, "attach_audio_transcript")}
                    className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                  >
                    Attach audio transcript
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onObserverDraftAction(sourceControl, "pause_source")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Pause source
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSourceAudit(sourceControl, "source_evidence")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Review source evidence
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSourceAudit(sourceControl, "compact_observation")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Open compact observation
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSourceAudit(sourceControl, "raw_buffer")}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-cyan-500 hover:text-cyan-100"
                >
                  Open raw buffer preview
                </button>
                <button
                  type="button"
                  onClick={() => onClearRawSessionBuffer(sourceControl)}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-amber-500 hover:text-amber-100"
                >
                  Clear raw buffer
                </button>
              </div>

              {sourceControl.missingReason || sourceControl.nextRequiredAction ? (
                <div className="rounded border border-amber-900/60 bg-amber-950/20 p-2 text-[11px] text-amber-100">
                  {sourceControl.missingReason ?? sourceControl.nextRequiredAction}
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {badge.id === "interpreter.stage_play_reflection" ? (
          <Section title="Live Answer Projection">
            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                Project current Stage Play evidence lanes into the Live Answer environment. This is a deterministic evidence projection, not assistant answer authority.
              </p>
              <button
                type="button"
                onClick={onProjectLiveAnswer}
                className="w-full rounded border border-emerald-700 bg-emerald-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                data-testid="stage-play-project-live-answer-inspector"
              >
                Project to Live Answer
              </button>
            </div>
          </Section>
        ) : null}

        <Section title="Live Bindings">
          {badge.liveBindings.length > 0 ? (
            <div className="space-y-2">
              {badge.liveBindings.map((binding, index) => (
                <div key={`${binding.bindingKind}-${index}`} className="rounded border border-slate-800 bg-black/20 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                      {labelize(binding.bindingKind)}
                    </Badge>
                    <span className="text-xs text-slate-400">{binding.freshness}</span>
                    <span className="font-mono text-[10px] text-slate-500">{binding.confidence.toFixed(2)}</span>
                  </div>
                  {binding.compactValue !== undefined && binding.compactValue !== null ? (
                    <div className="mt-1 font-mono text-xs text-slate-300">{String(binding.compactValue)}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500">No live binding attached to this badge.</span>
          )}
        </Section>

        <Section title="Affordance / Blocked Move">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {labelize(badge.kind)}
            </Badge>
            {badge.admission ? (
              <Badge variant="outline" className={statusTone(badge.admission === "blocked" ? "blocked" : badge.status)}>
                {labelize(badge.admission)}
              </Badge>
            ) : null}
          </div>
        </Section>

        <Section title="Intent Module">
          {badge.intentModule ? (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Verb:</span>{" "}
                <span className="font-mono text-cyan-200">{badge.intentModule.verb}</span>
              </div>
              {badge.intentModule.requires?.length ? <div>Requires: {badge.intentModule.requires.join(", ")}</div> : null}
              {badge.intentModule.preserves?.length ? <div>Preserves: {badge.intentModule.preserves.join(", ")}</div> : null}
              {badge.intentModule.blocks?.length ? <div>Blocks: {badge.intentModule.blocks.join(", ")}</div> : null}
            </div>
          ) : (
            <span className="text-slate-500">No intent verb is attached to this badge.</span>
          )}
        </Section>

        <Section title="Procedural Binding">
          <div className="rounded border border-slate-800 bg-black/30 p-2 font-mono text-xs text-cyan-100">
            {expression || "No procedural expression for this badge."}
          </div>
        </Section>

        <Section title="Missing Evidence">
          {badge.missingEvidence.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-xs text-amber-100">
              {badge.missingEvidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <span className="text-slate-500">No missing evidence recorded.</span>
          )}
        </Section>

        <Section title="Admission">
          <div className="space-y-2 text-xs">
            <div>Badge admission: <span className="font-mono text-slate-200">{badge.admission ?? "none"}</span></div>
            {relatedActions.map((action) => (
              <div key={action.id} className="rounded border border-slate-800 bg-black/20 p-2">
                <div className="font-semibold text-slate-100">{action.label}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className={statusTone(action.admission === "blocked" ? "blocked" : "candidate")}>
                    {labelize(action.admission)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    {labelize(action.actionType)}
                  </Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    agent executable: false
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Source Refs">
          <div className="space-y-1 font-mono text-xs text-slate-400">
            {badge.sourceRefs.length > 0 ? badge.sourceRefs.map((ref) => (
              <div key={`${ref.kind}:${ref.id}`}>{ref.kind}: {ref.id}</div>
            )) : <span>No source refs.</span>}
          </div>
        </Section>

        <Section title="Related Badges">
          <div className="space-y-2">
            {relatedEdges.map((edge) => (
              <div key={edge.id} className="rounded border border-slate-800 bg-black/20 p-2 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <Link2 className="h-3.5 w-3.5 text-slate-500" />
                  {labelize(edge.relation)}: {edge.label}
                </div>
              </div>
            ))}
            {relatedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {relatedBadges.map((related) => (
                  <Badge key={related.id} variant="outline" className="border-slate-700 text-slate-300">
                    {related.title}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      </div>
    </aside>
  );
}

export default function StagePlayBadgeGraphPanel() {
  const [query, setQuery] = useState("");
  const [bindingOverlayOpen, setBindingOverlayOpen] = useState(false);
  const [draftNodes, setDraftNodes] = useState<DraftStagePlayNode[]>([]);
  const [selectedDraftNodeId, setSelectedDraftNodeId] = useState<string | null>(null);
  const [heldNode, setHeldNode] = useState<HeldStagePlayNode | null>(null);
  const [sourceSetupCadenceMs, setSourceSetupCadenceMs] = useState<number>(STAGE_PLAY_SOURCE_SETUP_DEFAULTS.visualCadenceMs);
  const [sourceSetupStatus, setSourceSetupStatus] = useState<StagePlaySourceSetupStatus>({
    level: "idle",
    message: "",
  });
  const [projectionStatus, setProjectionStatus] = useState<StagePlayProjectionStatus | null>(null);
  const [sourceAuditSelection, setSourceAuditSelection] = useState<StagePlaySourceAuditSelection>(null);
  const [graphDiff, setGraphDiff] = useState<StagePlayGraphDiff | null>(null);
  const [removedBadgeGhosts, setRemovedBadgeGhosts] = useState<StagePlayRemovedBadgeGhost[]>([]);
  const graphScrollportRef = useRef<HTMLDivElement>(null);
  const previousGraphRef = useRef<StagePlayBadgeGraphV1 | null>(null);
  const graphDiffClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removedGhostClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftNodeCountRef = useRef(0);
  const draftParameterCountRef = useRef(0);
  const activeEnvironment = useLiveAnswerEnvironmentStore((state) =>
    selectActiveLiveAnswerEnvironment(state, STAGE_PLAY_PANEL_THREAD_ID),
  );
  const loadLiveAnswerEnvironment = useLiveAnswerEnvironmentStore((state) => state.loadLiveAnswerEnvironment);
  const threadId = activeEnvironment?.thread_id ?? STAGE_PLAY_PANEL_THREAD_ID;
  const roomId = activeEnvironment?.room_id ?? null;
  const environmentId = activeEnvironment?.environment_id ?? null;
  const selectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeId);
  const selectedBadgeIds = useStagePlayBadgeGraphPanelStore((state) => state.selectedBadgeIds);
  const activeFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.activeFilterKind);
  const setSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.setSelectedBadgeId);
  const setSelectedBadgeIds = useStagePlayBadgeGraphPanelStore((state) => state.setSelectedBadgeIds);
  const toggleSelectedBadgeId = useStagePlayBadgeGraphPanelStore((state) => state.toggleSelectedBadgeId);
  const setActiveFilterKind = useStagePlayBadgeGraphPanelStore((state) => state.setActiveFilterKind);
  const graphQuery = useQuery<StagePlayBadgeGraphV1>({
    queryKey: [
      "/api/helix/stage-play/graph",
      threadId,
      roomId,
      environmentId,
    ],
    queryFn: () => fetchStagePlayBadgeGraph({ threadId, roomId, environmentId }),
    refetchInterval: 1000,
  });
  const { data: graph, isLoading, error } = graphQuery;
  const rawSessionBufferQuery = useQuery<StagePlayRawSessionBufferListResponse>({
    queryKey: [
      "/api/helix/stage-play/raw-session-buffer",
      threadId,
      roomId,
      sourceAuditSelection?.source.sourceId ?? null,
    ],
    queryFn: () => fetchStagePlayRawSessionBuffer({
      threadId,
      roomId,
      sourceId: sourceAuditSelection?.source.sourceId ?? null,
    }),
    enabled: Boolean(sourceAuditSelection),
    refetchInterval: sourceAuditSelection?.mode === "raw_buffer" ? 1000 : false,
  });
  const builderContextQuery = useQuery<StagePlayBuilderContextResponse>({
    queryKey: [
      "/api/helix/stage-play/builder",
      threadId,
      environmentId,
    ],
    queryFn: () => fetchStagePlayBuilderContext({ threadId, environmentId }),
    refetchInterval: 2000,
  });
  const builderContext = builderContextQuery.data ?? null;
  const sourceOptions = useMemo(
    () => (builderContext?.sourceQuery.sourceHandles ?? []).map(sourceOptionFromHandle),
    [builderContext?.sourceQuery.sourceHandles],
  );
  const draftForValidation = useMemo(
    () => buildStagePlayDraftFromNodes({
      draftNodes,
      objective: graph?.description ?? graph?.title ?? null,
    }),
    [draftNodes, graph?.description, graph?.title],
  );
  const draftValidationKey = useMemo(
    () => JSON.stringify(draftForValidation),
    [draftForValidation],
  );
  const { data: draftValidation = null } = useQuery<StagePlayGraphDraftValidationV1>({
    queryKey: [
      "/api/helix/stage-play/draft/validate",
      threadId,
      environmentId,
      draftValidationKey,
    ],
    queryFn: () => validateStagePlayDraft({
      threadId,
      environmentId,
      draft: draftForValidation,
    }),
    enabled: draftNodes.length > 0,
  });

  useEffect(() => {
    return () => {
      if (graphDiffClearTimerRef.current) clearTimeout(graphDiffClearTimerRef.current);
      if (removedGhostClearTimerRef.current) clearTimeout(removedGhostClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!graph) return;
    const previousGraph = previousGraphRef.current;
    if (previousGraph) {
      const nextDiff = diffStagePlayBadgeGraphs(previousGraph, graph);
      if (hasStagePlayGraphDiff(nextDiff)) {
        setGraphDiff(nextDiff);
        setRemovedBadgeGhosts(removedGhostsForDiff(previousGraph, nextDiff));
        if (graphDiffClearTimerRef.current) clearTimeout(graphDiffClearTimerRef.current);
        if (removedGhostClearTimerRef.current) clearTimeout(removedGhostClearTimerRef.current);
        graphDiffClearTimerRef.current = setTimeout(() => setGraphDiff(null), 1800);
        removedGhostClearTimerRef.current = setTimeout(() => setRemovedBadgeGhosts([]), 1000);
      }
    }
    previousGraphRef.current = graph;
  }, [graph]);

  const filteredBadges = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (graph?.badges ?? []).filter((badge: StagePlayBadgeV1) => {
      const haystack = [
        badge.id,
        badge.title,
        badge.plainMeaning,
        badge.whyItMatters,
        badge.kind,
        badge.status,
        ...badge.subjects,
        ...badge.tags,
        ...badge.reasonCodes,
      ].join(" ").toLowerCase();
      return (
        (needle.length === 0 || haystack.includes(needle)) &&
        (!activeFilterKind || badge.kind === activeFilterKind)
      );
    });
  }, [activeFilterKind, graph?.badges, query]);

  const groupedBadges = useMemo(() => {
    return uniqueSorted(filteredBadges.map((badge) => badge.kind)).map((kind) => ({
      kind,
      badges: filteredBadges.filter((badge: StagePlayBadgeV1) => badge.kind === kind),
    })).filter((group) => group.badges.length > 0);
  }, [filteredBadges]);

  useEffect(() => {
    if (!graph) return;
    if (filteredBadges.length === 0) {
      setSelectedBadgeId(null);
      return;
    }
    if (selectedBadgeId && !filteredBadges.some((badge) => badge.id === selectedBadgeId)) {
      setSelectedBadgeId(null);
    }
  }, [filteredBadges, graph, selectedBadgeId, setSelectedBadgeId]);

  const selectedBadge = useMemo(
    () => graph?.badges.find((badge) => badge.id === selectedBadgeId) ?? null,
    [graph?.badges, selectedBadgeId],
  );
  function selectGraphBadge(badgeId: string) {
    const badge = graph?.badges.find((entry) => entry.id === badgeId) ?? null;
    toggleSelectedBadgeId(badgeId);
    if (badge?.kind === "observer") {
      setActiveFilterKind("observer");
      setBindingOverlayOpen(false);
    } else if (badge?.kind) {
      setActiveFilterKind(badge.kind);
    }
  }
  const relatedEdges = useMemo(
    () => graph && selectedBadge
      ? graph.edges.filter((edge) => edge.from === selectedBadge.id || edge.to === selectedBadge.id)
      : [],
    [graph, selectedBadge],
  );
  const relatedBadges = useMemo(() => {
    if (!graph || !selectedBadge) return [];
    const ids = new Set(relatedEdges.flatMap((edge) => [edge.from, edge.to]).filter((id) => id !== selectedBadge.id));
    return graph.badges.filter((badge) => ids.has(badge.id));
  }, [graph, relatedEdges, selectedBadge]);
  const relatedActions = useMemo(
    () => graph && selectedBadge
      ? graph.recommendedActions.filter((action) =>
        action.evidenceRefs.some((ref) => selectedBadge.evidenceRefs.includes(ref)) ||
        action.reasonCodes.some((code) => selectedBadge.reasonCodes.includes(code)),
      )
      : [],
    [graph, selectedBadge],
  );

  function scrollGraphNearEdge(clientX: number, clientY: number) {
    const scrollport = graphScrollportRef.current;
    if (!scrollport) return;
    const rect = scrollport.getBoundingClientRect();
    const threshold = 56;
    const maxStep = 22;
    const leftPressure = Math.max(0, threshold - (clientX - rect.left));
    const rightPressure = Math.max(0, threshold - (rect.right - clientX));
    const topPressure = Math.max(0, threshold - (clientY - rect.top));
    const bottomPressure = Math.max(0, threshold - (rect.bottom - clientY));
    const left = rightPressure > 0
      ? Math.ceil((rightPressure / threshold) * maxStep)
      : leftPressure > 0
        ? -Math.ceil((leftPressure / threshold) * maxStep)
        : 0;
    const top = bottomPressure > 0
      ? Math.ceil((bottomPressure / threshold) * maxStep)
      : topPressure > 0
        ? -Math.ceil((topPressure / threshold) * maxStep)
        : 0;
    if (left !== 0 || top !== 0) {
      scrollport.scrollBy({ left, top });
    }
  }

  function startBuilderDrag(nodeType: StagePlayNodeBuilderType, event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setBindingOverlayOpen(false);
    setHeldNode({
      ...nodeType,
      clientX: readClientCoordinate(event.clientX),
      clientY: readClientCoordinate(event.clientY),
    });
  }

  function updateDraftParameter(nodeId: string, parameterId: string, field: "key" | "value", value: string) {
    setDraftNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              parameters: node.parameters.map((parameter) =>
                parameter.id === parameterId ? { ...parameter, [field]: value } : parameter,
              ),
            }
          : node,
      ),
    );
  }

  function addDraftParameter(nodeId: string) {
    draftParameterCountRef.current += 1;
    setDraftNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              parameters: [
                ...node.parameters,
                {
                  id: `${node.id}:param:custom:${draftParameterCountRef.current}`,
                  key: "parameter",
                  value: "",
                },
              ],
            }
          : node,
      ),
    );
  }

  function removeDraftNode(nodeId: string) {
    setDraftNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setSelectedDraftNodeId((current) => current === nodeId ? null : current);
  }

  function setDraftSourceClass(nodeId: string, sourceClass: string) {
    setDraftNodes((nodes) =>
      nodes.map((node) => node.id === nodeId ? setDraftParameterValue(node, "source_class", sourceClass) : node),
    );
  }

  function applyDraftSourceOption(nodeId: string, option: StagePlaySourceOption) {
    setDraftNodes((nodes) =>
      nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return [
          ["source_class", option.sourceClass],
          ["source_id", option.sourceId],
          ["status", option.status],
          ["descriptor_ref", option.descriptorId ?? ""],
          ["producer_ref", option.producerId ?? ""],
          ["latest_ref", option.latestRef ?? ""],
          ["surface", option.surface ?? ""],
          ["origin", option.origin ?? ""],
          ["cadence_ms", option.cadenceMs != null ? String(option.cadenceMs) : ""],
        ].reduce<DraftStagePlayNode>(
          (updated, [key, value]) => setDraftParameterValue(updated, key, value),
          node,
        );
      }),
    );
  }

  function addObserverDraftAction(source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction) {
    draftNodeCountRef.current += 1;
    const actionLabel = labelize(action);
    const nodeType: StagePlayNodeBuilderType = {
      kind: action === "clear_session_buffer" ? "recommended_check" : "source",
      label: action === "clear_session_buffer" ? "Clear session buffer" : `Source request: ${actionLabel}`,
      role: "local user draft request",
    };
    const parameters: [string, string][] = action === "clear_session_buffer"
      ? [
          ["check", "clear_session_buffer"],
          ["status", "local_draft_only"],
          ["authority", "user_action_required"],
        ]
      : [
          ["source_class", source?.modality ?? ""],
          ["source_id", source?.sourceId ?? ""],
          ["status", source?.status ?? ""],
          ["route_to", action === "route_to_narrative" ? "narrative_stage_play" : action === "route_to_minecraft_world" ? "world_stage_play" : source?.routeTo ?? ""],
          ["requested_action", action],
          ["selected_for_stage_play", action === "use_for_stage_play" ? "true" : String(source?.selectedForStagePlay ?? false)],
          ["latest_ref", source?.evidenceRefs.at(-1) ?? ""],
          ["draft_only", "true"],
        ];
    const nextNode: DraftStagePlayNode = {
      ...nodeType,
      id: `draft:${nodeType.kind}:${draftNodeCountRef.current}`,
      x: 96 + draftNodeCountRef.current * 18,
      y: 96 + draftNodeCountRef.current * 28,
      parameters: parameters.map(([key, value], index) => ({
        id: `${nodeType.kind}:observer-action:${draftNodeCountRef.current}:${index + 1}`,
        key,
        value,
      })),
    };
    setDraftNodes((nodes) => [...nodes, nextNode]);
    setSelectedDraftNodeId(nextNode.id);
  }

  function routeTargetForObserverAction(source: StagePlayObserverSource, action: StagePlayObserverDraftAction): string | null {
    if (action === "route_to_narrative") return "narrative_stage_play";
    if (action === "route_to_minecraft_world") return "world_stage_play";
    if (action === "use_for_stage_play") return source.routeTo;
    return null;
  }

  async function persistObserverSourceRoute(source: StagePlayObserverSource, action: StagePlayObserverDraftAction) {
    const routeTo = routeTargetForObserverAction(source, action);
    if (!routeTo) return;
    setSourceSetupStatus({
      level: "working",
      message: `Updating ${labelize(source.modality)} route for Stage Play...`,
    });
    try {
      await postJson("/api/helix/stage-play/source-route", {
        threadId,
        roomId,
        environmentId,
        sourceId: source.sourceId,
        modality: source.modality,
        routeTo,
        selectedForStagePlay: true,
        evidenceRefs: source.evidenceRefs.slice(-6),
      });
      setSourceSetupStatus({
        level: "ok",
        message: `${labelize(source.modality)} routed to ${routeTo}.`,
      });
      await Promise.all([graphQuery.refetch(), builderContextQuery.refetch()]);
    } catch (error) {
      setSourceSetupStatus({
        level: "error",
        message: error instanceof Error ? error.message : "stage_play_source_route_update_failed",
      });
    }
  }

  function handleObserverDraftAction(source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction) {
    addObserverDraftAction(source, action);
    if (source) {
      void persistObserverSourceRoute(source, action);
    }
  }

  async function handleProjectLiveAnswer() {
    setSourceSetupStatus({
      level: "working",
      message: "Projecting Stage Play evidence lanes into Live Answer...",
    });
    try {
      const result = await projectStagePlayLiveAnswer({
        threadId,
        roomId,
        environmentId,
        objective: activeEnvironment?.objective ?? graph?.description ?? graph?.title ?? "Project Stage Play graph into Live Answer.",
      });
      const message = result.reason === "projected"
        ? `Projected ${result.projectedLineKeys.length} Stage Play line(s) to Live Answer.`
        : result.reason === "no_line_changes"
          ? "Stage Play projection ran; no Live Answer lines changed."
          : `${labelize(result.reason)}: ${result.skippedLineKeys.slice(0, 4).join(", ")}`;
      setProjectionStatus({
        projectedLineKeys: result.projectedLineKeys,
        skippedLineKeys: result.skippedLineKeys,
        reason: result.reason,
        updatedAt: new Date().toISOString(),
        message,
      });
      setSourceSetupStatus({
        level: result.reason === "projected" || result.reason === "no_line_changes" ? "ok" : "error",
        message,
      });
      await Promise.all([
        graphQuery.refetch(),
        builderContextQuery.refetch(),
        loadLiveAnswerEnvironment(threadId),
      ]);
    } catch (error) {
      setSourceSetupStatus({
        level: "error",
        message: error instanceof Error ? error.message : "stage_play_live_answer_projection_failed",
      });
      setProjectionStatus({
        projectedLineKeys: [],
        skippedLineKeys: [],
        reason: "request_failed",
        updatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "stage_play_live_answer_projection_failed",
      });
    }
  }

  async function postJson(path: string, body?: Record<string, unknown>): Promise<any> {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(typeof payload?.error === "string" ? payload.error : `request_failed:${response.status}`);
    }
    return payload;
  }

  function sourceSetupDraft(source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction, extra: [string, string][] = []) {
    addObserverDraftAction(source, action);
    if (extra.length === 0) return;
    setDraftNodes((nodes) =>
      nodes.map((node, index) =>
        index === nodes.length - 1
          ? {
              ...node,
              parameters: [
                ...node.parameters,
                ...extra.map(([key, value], extraIndex) => ({
                  id: `${node.id}:setup:${extraIndex + 1}`,
                  key,
                  value,
                })),
              ],
            }
          : node,
      ),
    );
  }

  function openSourceAudit(source: StagePlayObserverSource, mode: StagePlaySourceAuditMode) {
    setSourceAuditSelection({ source, mode });
  }

  async function clearRawSessionBuffer(source: StagePlayObserverSource | null) {
    try {
      await postJson("/api/helix/stage-play/raw-session-buffer/clear", {
        threadId,
        roomId,
        sourceId: source?.sourceId ?? null,
      });
      if (!source) addObserverDraftAction(null, "clear_session_buffer");
      setSourceSetupStatus({
        level: "ok",
        message: source
          ? `Cleared raw buffer entries for ${source.sourceId}.`
          : "Cleared raw session buffer entries for this Stage Play window.",
      });
      await Promise.all([rawSessionBufferQuery.refetch(), graphQuery.refetch(), builderContextQuery.refetch()]);
    } catch (error) {
      setSourceSetupStatus({
        level: "error",
        message: error instanceof Error ? error.message : "raw_session_buffer_clear_failed",
      });
    }
  }

  function existingVisualSourceId(): string | null {
    const routed = graph?.sourceWindow.sources.find((source) =>
      source.modality === "visual_frame" &&
      source.sourceId &&
      !source.sourceId.startsWith("missing:") &&
      !source.sourceId.startsWith("source:visual-frame")
    );
    return routed?.sourceId ?? getLatestActiveVisualFrameStream(threadId)?.sourceId ?? null;
  }

  async function requestVisualSetupStream(surface: StagePlayVisualCaptureSurface): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("screen_capture_not_available_in_this_browser");
    }
    const displaySurface = surface === "browser_tab" ? "browser" : "monitor";
    return navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface } as MediaTrackConstraints,
      audio: false,
    });
  }

  async function ensureVisualSetupSource(surface: StagePlayVisualCaptureSurface): Promise<string> {
    const existingSourceId = existingVisualSourceId();
    const response = await postJson("/api/agi/situation/visual-source/start", {
      source_id: existingSourceId ?? `source:visual_frame:${threadId}`,
      thread_id: threadId,
      room_id: roomId,
      environment_id: environmentId,
      capture_mode: "interval",
      source_surface: surface,
      status: "permission_required",
      cadence_ms: sourceSetupCadenceMs,
      raw_image_storage_policy: "ephemeral",
    });
    const source = response?.source ?? response?.receipt?.source ?? null;
    const sourceId = typeof source?.source_id === "string" ? source.source_id : existingSourceId;
    if (!sourceId) throw new Error("visual_source_registration_failed");
    return sourceId;
  }

  async function startVisualSourceSetup(surface: StagePlayVisualCaptureSurface) {
    let stream: MediaStream | null = null;
    let ownsStream = false;
    const label = surface === "browser_tab" ? "browser tab visual" : "screen visual";
    setSourceSetupStatus({ level: "working", message: `Requesting ${label} capture permission...` });
    try {
      const sourceId = await ensureVisualSetupSource(surface);
      stream = getActiveVisualFrameStream(sourceId) ?? getLatestActiveVisualFrameStream(threadId)?.stream ?? null;
      if (!stream) {
        stream = await requestVisualSetupStream(surface);
        ownsStream = true;
      }
      const result = await startVisualFrameProducerInterval({
        sourceId,
        threadId,
        roomId,
        environmentId,
        cadenceMs: sourceSetupCadenceMs,
        stream,
        postJson,
        preserveExistingStream: !ownsStream,
        prompt: "Summarize this live visual frame as compact Stage Play source evidence for narrative or world-state interpretation. Include uncertainty and avoid raw text transcription unless it is necessary as compact evidence.",
      });
      stream = null;
      sourceSetupDraft(
        {
          sourceId,
          modality: "visual_frame",
          status: "active",
          contribution: `${label} interval producer requested from Stage Play setup.`,
          fidelityScore: 0.8,
          selectedForStagePlay: true,
          routeTo: STAGE_PLAY_SOURCE_SETUP_DEFAULTS.routeTo,
          cadenceMs: sourceSetupCadenceMs,
          lastEventTs: new Date().toISOString(),
          missingReason: null,
          nextRequiredAction: null,
          evidenceRefs: [result.evidence_id, result.frame_id].filter((ref): ref is string => Boolean(ref)),
        },
        "start_visual_interval",
        [
          ["capture_surface", surface],
          ["visual_cadence_ms", String(sourceSetupCadenceMs)],
          ["route_to", STAGE_PLAY_SOURCE_SETUP_DEFAULTS.routeTo],
          ["compact_observation_window_ms", String(STAGE_PLAY_SOURCE_SETUP_DEFAULTS.compactObservationWindowMs)],
          ["raw_retention", STAGE_PLAY_SOURCE_SETUP_DEFAULTS.rawRetention],
        ],
      );
      setSourceSetupStatus({
        level: "ok",
        message: `${label} interval active every ${sourceSetupCadenceMs / 1000}s. ${result.summary}`,
      });
      await Promise.all([graphQuery.refetch(), builderContextQuery.refetch()]);
    } catch (error) {
      if (ownsStream) stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setSourceSetupStatus({
        level: "error",
        message: error instanceof Error ? error.message : "visual_source_setup_failed",
      });
    }
  }

  async function attachAudioTranscriptSource(source: StagePlayAudioTranscriptSource) {
    const label = source === "browser_audio" ? "browser audio transcript" : "microphone transcript";
    setSourceSetupStatus({ level: "working", message: `Requesting ${label} setup...` });
    try {
      const { useSituationRoomStore } = await import("@/store/useSituationRoomStore");
      const situationRoom = useSituationRoomStore.getState();
      const localRoomId = situationRoom.active_room_id && situationRoom.rooms[situationRoom.active_room_id]
        ? situationRoom.active_room_id
        : situationRoom.createRoom("Stage Play Source Setup").room_id;
      const attached = source === "browser_audio"
        ? await situationRoom.attachDisplayAudioSource(localRoomId, "Stage Play browser audio")
        : await situationRoom.attachMicAudioSource(localRoomId, "Stage Play microphone");
      const sourceId = attached?.source_id ?? `audio_transcript:${threadId}`;
      await postJson("/api/agi/situation/audio-source/permission-granted", {
        source_id: sourceId,
        thread_id: threadId,
        room_id: roomId,
        ts: new Date().toISOString(),
      }).catch(() => null);
      sourceSetupDraft(
        {
          sourceId,
          modality: "audio_transcript",
          status: attached?.status === "active" ? "active" : "waiting_for_client",
          contribution: `${label} requested from Stage Play source setup.`,
          fidelityScore: attached?.status === "active" ? 0.72 : 0.3,
          selectedForStagePlay: attached?.status === "active",
          routeTo: STAGE_PLAY_SOURCE_SETUP_DEFAULTS.routeTo,
          cadenceMs: STAGE_PLAY_SOURCE_SETUP_DEFAULTS.audioWindowMs,
          lastEventTs: new Date().toISOString(),
          missingReason: attached?.status === "active" ? null : "Audio capture did not become active yet.",
          nextRequiredAction: attached?.status === "active" ? null : "Confirm audio capture permission",
          evidenceRefs: attached ? [`situation-room:${attached.room_id}:${attached.source_id}`] : [],
        },
        "attach_audio_transcript",
        [
          ["capture_source", source],
          ["audio_window_ms", String(STAGE_PLAY_SOURCE_SETUP_DEFAULTS.audioWindowMs)],
          ["route_to", STAGE_PLAY_SOURCE_SETUP_DEFAULTS.routeTo],
          ["compact_observation_window_ms", String(STAGE_PLAY_SOURCE_SETUP_DEFAULTS.compactObservationWindowMs)],
          ["raw_retention", STAGE_PLAY_SOURCE_SETUP_DEFAULTS.rawRetention],
        ],
      );
      setSourceSetupStatus({
        level: attached?.status === "active" ? "ok" : "error",
        message: attached?.status === "active"
          ? `${label} attached. Transcript chunks remain source evidence, not assistant answers.`
          : attached?.last_error ?? `${label} setup did not become active.`,
      });
      await Promise.all([graphQuery.refetch(), builderContextQuery.refetch()]);
    } catch (error) {
      setSourceSetupStatus({
        level: "error",
        message: error instanceof Error ? error.message : "audio_transcript_setup_failed",
      });
    }
  }

  async function pauseVisualSourceSetup() {
    const sourceId = existingVisualSourceId();
    if (!sourceId) {
      setSourceSetupStatus({ level: "error", message: "No visual source is registered." });
      return;
    }
    stopVisualFrameProducerInterval(sourceId, { stopStream: false });
    await postJson("/api/agi/situation/live-source/producer/heartbeat", {
      source_id: sourceId,
      thread_id: threadId,
      environment_id: environmentId,
      client_stream_confirmed: Boolean(getActiveVisualFrameStream(sourceId)),
      status: "paused",
      ts: new Date().toISOString(),
    }).catch(() => null);
    sourceSetupDraft(
      graph?.sourceWindow.sources.find((source) => source.sourceId === sourceId) ?? null,
      "pause_source",
      [["visual_cadence_ms", String(sourceSetupCadenceMs)]],
    );
    setSourceSetupStatus({ level: "ok", message: "Paused visual interval capture; existing stream ownership stayed with the visual producer." });
    await Promise.all([graphQuery.refetch(), builderContextQuery.refetch()]);
  }

  useEffect(() => {
    if (!heldNode) return;

    function handlePointerMove(event: PointerEvent) {
      const clientX = readClientCoordinate(event.clientX);
      const clientY = readClientCoordinate(event.clientY);
      setHeldNode((node) => node ? { ...node, clientX, clientY } : null);
      scrollGraphNearEdge(clientX, clientY);
    }

    function handlePointerUp(event: PointerEvent) {
      const scrollport = graphScrollportRef.current;
      setHeldNode((node) => {
        if (!node || !scrollport) return null;
        const rect = scrollport.getBoundingClientRect();
        const clientX = readClientCoordinate(event.clientX);
        const clientY = readClientCoordinate(event.clientY);
        const x = Math.max(32, Math.round(clientX - rect.left + scrollport.scrollLeft));
        const y = Math.max(32, Math.round(clientY - rect.top + scrollport.scrollTop));
        draftNodeCountRef.current += 1;
        setDraftNodes((nodes) => [
          ...nodes,
          {
            id: `draft:${node.kind}:${draftNodeCountRef.current}`,
            kind: node.kind,
            label: node.label,
            role: node.role,
            x,
            y,
            parameters: defaultDraftParametersForNode(node),
          },
        ]);
        setSelectedDraftNodeId(`draft:${node.kind}:${draftNodeCountRef.current}`);
        return null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [heldNode]);

  useEffect(() => {
    if (!heldNode) return;
    const timer = window.setInterval(() => {
      scrollGraphNearEdge(heldNode.clientX, heldNode.clientY);
    }, 40);
    return () => window.clearInterval(timer);
  }, [heldNode]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">Loading Stage Play Badge Graph...</div>;
  }

  if (error || !graph) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 p-6 text-sm text-rose-200">
        Stage Play graph failed to load.
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-slate-950 text-slate-100">
      <div className="relative min-h-0 flex-1">
        {!bindingOverlayOpen ? (
          <button
            type="button"
            onClick={() => setBindingOverlayOpen(true)}
            className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 shadow-xl hover:border-cyan-500"
            aria-label="Open Stage Play console"
          >
            <PanelLeftOpen className="h-4 w-4" />
            Console
          </button>
        ) : null}

        {bindingOverlayOpen ? (
          <StagePlayBindingOverlay
            graph={graph}
            builderContext={builderContext}
            sourceOptions={sourceOptions}
            draftNodeCount={draftNodes.length}
            draftValidation={draftValidation}
            query={query}
            setQuery={setQuery}
            groupedBadges={groupedBadges}
            activeFilterKind={activeFilterKind}
            setActiveFilterKind={setActiveFilterKind}
            selectedBadgeId={selectedBadgeId}
            selectedBadgeIds={selectedBadgeIds}
            setSelectedBadgeIds={setSelectedBadgeIds}
            toggleSelectedBadgeId={toggleSelectedBadgeId}
            selectedBadge={selectedBadge}
            relatedEdges={relatedEdges}
            relatedBadges={relatedBadges}
            relatedActions={relatedActions}
            onStartBuilderDrag={startBuilderDrag}
            onObserverDraftAction={handleObserverDraftAction}
            sourceSetupCadenceMs={sourceSetupCadenceMs}
            sourceSetupStatus={sourceSetupStatus}
            onSetSourceSetupCadenceMs={setSourceSetupCadenceMs}
            onStartVisualSourceSetup={startVisualSourceSetup}
            onAttachAudioTranscriptSource={attachAudioTranscriptSource}
            onPauseVisualSourceSetup={pauseVisualSourceSetup}
            onProjectLiveAnswer={handleProjectLiveAnswer}
            sourceAuditSelection={sourceAuditSelection}
            rawSessionBufferEntries={rawSessionBufferQuery.data?.entries ?? []}
            rawSessionBufferLoading={rawSessionBufferQuery.isLoading}
            onOpenSourceAudit={openSourceAudit}
            onClearRawSessionBuffer={clearRawSessionBuffer}
            onClose={() => setBindingOverlayOpen(false)}
          />
        ) : null}

        {heldNode ? (
          <div
            className={`pointer-events-none fixed z-50 flex h-16 w-16 items-center justify-center rounded-sm border-2 shadow-2xl ${kindTone(heldNode.kind)}`}
            style={{ left: heldNode.clientX - 32, top: heldNode.clientY - 32 }}
            data-testid="stage-play-held-builder-node"
            aria-hidden="true"
          >
            <span className="h-5 w-5 rounded-sm border border-cyan-100 bg-cyan-300" />
          </div>
        ) : null}

        <StagePlayToolActivityStrip graph={graph} diff={graphDiff} projectionStatus={projectionStatus} />

        {selectedDraftNodeId ? (
          (() => {
            const selectedDraftNode = draftNodes.find((node) => node.id === selectedDraftNodeId) ?? null;
            return selectedDraftNode ? (
              <DraftNodeParameterEditor
                node={selectedDraftNode}
                sourceOptions={sourceOptions}
                draftValidation={draftValidation}
                onClose={() => setSelectedDraftNodeId(null)}
                onRemove={removeDraftNode}
                onUpdateParameter={updateDraftParameter}
                onAddParameter={addDraftParameter}
                onSetSourceClass={setDraftSourceClass}
                onApplySourceOption={applyDraftSourceOption}
              />
            ) : null;
          })()
        ) : null}

        {selectedBadge && (selectedBadge.kind === "observer" || selectedBadge.kind === "source" || selectedBadge.id === "interpreter.stage_play_reflection") ? (
          <aside
            className={`absolute right-3 top-3 z-40 max-h-[calc(100%-1.5rem)] w-[380px] overflow-y-auto rounded-md border bg-slate-950/95 p-2 shadow-2xl ${
              selectedBadge.kind === "observer"
                ? "border-amber-800/80"
                : selectedBadge.kind === "source"
                  ? "border-sky-800/80"
                  : "border-fuchsia-800/80"
            }`}
            data-testid={
              selectedBadge.kind === "observer"
                ? "stage-play-observer-node-controls"
                : selectedBadge.kind === "source"
                  ? "stage-play-source-node-controls"
                  : "stage-play-interpreter-node-controls"
            }
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className={`text-xs font-semibold uppercase tracking-wide ${
                selectedBadge.kind === "observer"
                  ? "text-amber-100"
                  : selectedBadge.kind === "source"
                    ? "text-sky-100"
                    : "text-fuchsia-100"
              }`}>
                {selectedBadge.kind === "observer"
                  ? "Observer node controls"
                  : selectedBadge.kind === "source"
                    ? "Source node controls"
                    : "Interpreter node controls"}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBadgeId(null)}
                className="rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-slate-500"
                aria-label={
                  selectedBadge.kind === "observer"
                    ? "Close Observer node controls"
                    : selectedBadge.kind === "source"
                      ? "Close Source node controls"
                      : "Close Interpreter node controls"
                }
              >
                Close
              </button>
            </div>
            <Inspector
              badge={selectedBadge}
              relatedEdges={relatedEdges}
              relatedBadges={relatedBadges}
              relatedActions={relatedActions}
              observerSources={graph.sourceWindow.sources}
              onObserverDraftAction={handleObserverDraftAction}
              sourceSetupCadenceMs={sourceSetupCadenceMs}
              sourceSetupStatus={sourceSetupStatus}
              onSetSourceSetupCadenceMs={setSourceSetupCadenceMs}
              onStartVisualSourceSetup={startVisualSourceSetup}
              onAttachAudioTranscriptSource={attachAudioTranscriptSource}
              onPauseVisualSourceSetup={pauseVisualSourceSetup}
              onProjectLiveAnswer={handleProjectLiveAnswer}
              sourceAuditSelection={sourceAuditSelection}
              rawSessionBufferEntries={rawSessionBufferQuery.data?.entries ?? []}
              rawSessionBufferLoading={rawSessionBufferQuery.isLoading}
              onOpenSourceAudit={openSourceAudit}
              onClearRawSessionBuffer={clearRawSessionBuffer}
            />
          </aside>
        ) : null}

        <main className="flex h-full min-h-0 flex-col">
          <StagePlayGraphCanvas
            graph={graph}
            graphDiff={graphDiff}
            removedBadgeGhosts={removedBadgeGhosts}
            selectedBadgeIds={selectedBadgeIds}
            selectedBadgeId={selectedBadgeId}
            draftNodes={draftNodes}
            selectedDraftNodeId={selectedDraftNodeId}
            scrollportRef={graphScrollportRef}
            onSelect={selectGraphBadge}
            onSelectDraftNode={setSelectedDraftNodeId}
            onProjectLiveAnswer={handleProjectLiveAnswer}
          />
        </main>
      </div>
    </div>
  );
}
