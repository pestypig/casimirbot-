import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, Link2, PanelLeftClose, PanelLeftOpen, RadioTower, Search, Volume2, Waypoints } from "lucide-react";
import type {
  StagePlayBadgeEdgeV1,
  StagePlayBadgeGraphRecommendedActionV1,
  StagePlayBadgeGraphV1,
  StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import type {
  StagePlayLiveSourceJobStateV1,
  StagePlayLiveSourceMailDecisionV1,
  StagePlayLiveSourceMailItemV1,
  AskTurnTranscriptRowDraftV1,
  StagePlayMicroReasonerPromptV1,
  StagePlayMicroReasonerRoleV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
  StagePlayLiveSourceMailTranscriptEntryV1,
  StagePlayLiveSourceNarrativeStateV1,
  StagePlayLiveSourceWatchJobPolicyV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type {
  StagePlayLiveSourceInterpreterProfileComparisonV1,
  StagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import type { StagePlayVisualObserverProfileV1 } from "@shared/contracts/stage-play-visual-observer-profile.v1";
import type {
  StagePlayLiveSourceMailWakeRequestV1,
  StagePlayLiveSourceMailWakeResultV1,
} from "@shared/contracts/stage-play-live-source-mail-wake.v1";
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
import { launchHelixAskPrompt } from "@/lib/helix/ask-prompt-launch";
import {
  STAGE_PLAY_LIVE_SOURCE_MAIL_REFRESH_EVENT,
  type StagePlayLiveSourceMailRefreshEventDetail,
} from "@/lib/helix/liveSourceMailRefreshEvent";

const STAGE_PLAY_PANEL_THREAD_ID = "helix-ask:desktop";
const STAGE_PLAY_MAILBOX_QUERY_KEY = [
  "/api/helix/stage-play/live-source-mail",
  STAGE_PLAY_PANEL_THREAD_ID,
  STAGE_PLAY_PANEL_THREAD_ID,
] as const;
const STAGE_PLAY_TRANSCRIPT_QUERY_KEY = [
  "/api/helix/stage-play/live-source-mail/transcript",
  STAGE_PLAY_PANEL_THREAD_ID,
  STAGE_PLAY_PANEL_THREAD_ID,
] as const;

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
  checkpointOnlySkipped: string[];
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
  checkpointOnlySkipped: string[];
  reason: StagePlayProjectLiveAnswerResponse["reason"] | "request_failed";
  updatedAt: string;
  message: string;
};

type StagePlayCheckpointQueueAction =
  | "run"
  | "skip"
  | "pause_job"
  | "resume_job"
  | "clear_queued"
  | "end_live_job";

type StagePlayCheckpointQueueStatus = {
  action: StagePlayCheckpointQueueAction;
  reason: string;
  message: string;
  updatedAt: string;
  ok: boolean;
} | null;

type StagePlayCheckpointRequest = NonNullable<StagePlayBadgeGraphV1["checkpointRequests"]>[number];

type StagePlayLiveSourceMailListResponse = {
  ok: boolean;
  schema: "stage_play_live_source_mail_list_response/v1";
  requestedThreadId?: string;
  mailboxThreadId?: string;
  mailboxThreadResolution?: Record<string, unknown>;
  wakeAdmissionCycle?: {
    deferredWakeIds?: string[];
    runtimeAdmission?: {
      admitted?: boolean;
      action?: string;
      reason?: string;
      pressureLevel?: string;
      checkedAt?: string;
      source?: string;
      memory?: {
        heapUsedMiB?: number;
        rssMiB?: number;
      };
      limits?: {
        maxHeapUsedMiB?: number;
        maxRssMiB?: number;
      };
      localBypass?: {
        applied?: boolean;
        reason?: string;
      } | null;
    } | null;
    continuation?: {
      scheduled?: boolean;
      reason?: string;
      runnableWakeIds?: string[];
    } | null;
    status?: string;
    reason?: string;
  } | null;
  mailItems?: StagePlayLiveSourceMailItemV1[];
  jobStates?: StagePlayLiveSourceJobStateV1[];
  watchJobPolicies?: StagePlayLiveSourceWatchJobPolicyV1[];
  interpreterProfiles?: StagePlayLiveSourceInterpreterProfileV1[];
  interpreterProfileComparisons?: StagePlayLiveSourceInterpreterProfileComparisonV1[];
  visualObserverProfiles?: StagePlayVisualObserverProfileV1[];
  activeVisualObserverProfile?: StagePlayVisualObserverProfileV1 | null;
  microReasonerPrompts?: StagePlayMicroReasonerPromptV1[];
  microReasonerRuns?: StagePlayMicroReasonerRunV1[];
  processedMailPackets?: StagePlayProcessedMailPacketV1[];
  decisions?: StagePlayLiveSourceMailDecisionV1[];
  narrativeStates?: StagePlayLiveSourceNarrativeStateV1[];
  wakeRequests?: StagePlayLiveSourceMailWakeRequestV1[];
  wakeResults?: StagePlayLiveSourceMailWakeResultV1[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

type StagePlayLiveSourceMailTranscriptResponse = {
  ok: boolean;
  schema: "stage_play_live_source_mail_transcript_response/v1";
  requestedThreadId?: string;
  mailboxThreadId?: string;
  threadId?: string;
  roomId?: string | null;
  environmentId?: string | null;
  entries?: StagePlayLiveSourceMailTranscriptEntryV1[];
  transcriptRows?: AskTurnTranscriptRowDraftV1[];
  transcriptEntryIds?: string[];
  evidenceRefs?: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

type StagePlayGraphDisplayMode = "observer_mail_loop_v1" | "full_graph";

type StagePlayMailLoopNode = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  preview: string;
  statusChips?: string[];
  statusBand?: {
    title: string;
    lines: string[];
    tone: "pressure" | "blocked" | "good" | "pending";
  } | null;
  payloadRows?: Array<{
    label: string;
    value: string;
    tone?: "default" | "good" | "warn" | "blocked";
  }>;
  edgeToNext?: {
    label: string;
    tone: "connected" | "pending" | "blocked";
  } | null;
  inputLabel: string;
  inputRefs: string[];
  inputPreview: string;
  transformLabel: string;
  outputLabel: string;
  outputRefs: string[];
  outputPreview: string;
  blockedUntil?: string | null;
  inspector?: {
    kind: "interpreter_profile" | "micro_reasoner_prompt" | "visual_observer_profile";
    title: string;
    profileId?: string;
    promptId?: string;
    linkedNoteId?: string | null;
    linkedNoteTitle?: string | null;
    body: string;
  } | null;
};

const isActiveStagePlayCheckpointRequest = (request: StagePlayCheckpointRequest): boolean =>
  request.status === "queued" || request.status === "running";

const graphHasCurrentModelReviewedAnswerSnapshot = (
  graph: StagePlayBadgeGraphV1 | null | undefined,
): boolean =>
  Boolean(graph?.badges.some((badge) =>
    badge.kind === "answer_snapshot" &&
    badge.status === "observed" &&
    badge.output?.state === "model_reviewed"
  ));

const stagePlayCheckpointRequestMatchesGraph = (
  request: StagePlayCheckpointRequest,
  graph: StagePlayBadgeGraphV1,
): boolean =>
  request.graphId === graph.graphId || request.currentGraphRefs.includes(graph.graphId);

const stagePlayCheckpointRequestPriority = (
  request: StagePlayCheckpointRequest,
  graph: StagePlayBadgeGraphV1,
): number => {
  const currentGraph = stagePlayCheckpointRequestMatchesGraph(request, graph);
  if (currentGraph && request.status === "running") return 0;
  if (currentGraph && request.reason === "user_requested_checkpoint") return 1;
  if (currentGraph && request.status === "queued") return 2;
  if (request.status === "running") return 3;
  if (request.reason === "user_requested_checkpoint") return 4;
  if (request.status === "queued") return 5;
  return 6;
};

const selectStagePlayVisibleCheckpointRequest = (
  graph: StagePlayBadgeGraphV1 | null | undefined,
): StagePlayCheckpointRequest | null => {
  const indexedRequests = (graph?.checkpointRequests ?? [])
    .map((request, index) => ({ request, index }))
    .filter((entry) => isActiveStagePlayCheckpointRequest(entry.request))
    .filter((entry) =>
      !(
        graphHasCurrentModelReviewedAnswerSnapshot(graph) &&
        entry.request.status === "running" &&
        stagePlayCheckpointRequestMatchesGraph(entry.request, graph as StagePlayBadgeGraphV1)
      )
    );
  if (!graph || indexedRequests.length === 0) return null;
  indexedRequests.sort((left, right) => {
    const priorityDelta =
      stagePlayCheckpointRequestPriority(left.request, graph) -
      stagePlayCheckpointRequestPriority(right.request, graph);
    if (priorityDelta !== 0) return priorityDelta;
    return right.index - left.index;
  });
  return indexedRequests[0]?.request ?? null;
};

type StagePlayLaneId =
  | "observer"
  | "compact_observation"
  | "stage_bounds"
  | "affordances_missing_checks"
  | "procedural_bindings"
  | "helix_ask_checkpoint"
  | "answer_snapshot"
  | "validation_feedback"
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
  { id: "validation_feedback", title: "Validation Feedback" },
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

async function fetchStagePlayLiveSourceMail(input: {
  threadId: string;
  mailboxThreadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<StagePlayLiveSourceMailListResponse> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.mailboxThreadId) params.set("mailboxThreadId", input.mailboxThreadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  params.set("limit", "20");
  const response = await fetch(`/api/helix/stage-play/live-source-mail?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play live-source mail request failed: ${response.status}`);
  }
  return await response.json() as StagePlayLiveSourceMailListResponse;
}

async function fetchStagePlayLiveSourceMailTranscript(input: {
  threadId: string;
  mailboxThreadId?: string | null;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<StagePlayLiveSourceMailTranscriptResponse> {
  const params = new URLSearchParams();
  params.set("threadId", input.threadId);
  if (input.mailboxThreadId) params.set("mailboxThreadId", input.mailboxThreadId);
  if (input.roomId) params.set("roomId", input.roomId);
  if (input.environmentId) params.set("environmentId", input.environmentId);
  params.set("limit", "80");
  const response = await fetch(`/api/helix/stage-play/live-source-mail/transcript?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Stage Play live-source mail transcript request failed: ${response.status}`);
  }
  return await response.json() as StagePlayLiveSourceMailTranscriptResponse;
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

const STAGE_PLAY_STEERING_ROW_KINDS = new Set<AskTurnTranscriptRowDraftV1["rowKind"]>([
  "voice_steering_received",
  "voice_steering_queued",
  "voice_steering_applied",
  "voice_steering_deferred",
  "voice_steering_rejected",
  "voice_steering_cancel_requested",
  "steering_ack_receipt",
]);

function isStagePlaySteeringTranscriptRow(row: AskTurnTranscriptRowDraftV1): boolean {
  return STAGE_PLAY_STEERING_ROW_KINDS.has(row.rowKind);
}

function stagePlaySteeringRowLabel(rowKind: AskTurnTranscriptRowDraftV1["rowKind"]): string {
  if (rowKind === "voice_steering_received") return "Voice steering received";
  if (rowKind === "voice_steering_queued") return "Voice steering queued";
  if (rowKind === "voice_steering_applied") return "Voice steering applied";
  if (rowKind === "voice_steering_deferred") return "Voice steering deferred";
  if (rowKind === "voice_steering_rejected") return "Voice steering rejected";
  if (rowKind === "voice_steering_cancel_requested") return "Voice steering cancel";
  if (rowKind === "steering_ack_receipt") return "Steering ack receipt";
  return labelize(rowKind);
}

function compactStagePlayText(value: string | null | undefined, fallback: string, max = 160): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1)).trimEnd()}...` : text;
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
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint" || badge.kind === "checkpoint_request" || badge.kind === "perturbation") return "helix_ask_checkpoint";
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
    lane: "validation_feedback",
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
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint") return "Model checkpoint boundary";
  if (badge.kind === "checkpoint_request") return "Queued checkpoint request";
  if (badge.kind === "answer_snapshot") return "Model-reviewed answer snapshot";
  if (badge.kind === "live_output" || badge.kind === "voice_output") return "Reviewed output lane";
  if (badge.kind === "perturbation") return "Source-window perturbation";
  if (badge.kind === "fusion") return "Source fusion state";
  if (badge.kind === "procedural_binding") return `Assembles: ${proceduralExpression(badge)}`;
  if (badge.kind === "intent_module") return `Verb: ${proceduralExpression(badge)}`;
  if (badge.kind === "affordance") return "Available move candidate";
  if (badge.kind === "blocked_affordance") return "Blocked move boundary";
  if (badge.kind === "hazard") return "Constrains possible moves";
  if (badge.kind === "resource" || badge.kind === "prop") return "Can support or block a procedure";
  return "Observed stage condition";
}

function selectedNodeConsoleTitle(badge: StagePlayBadgeV1 | null): string {
  if (!badge) return "Builder Palette";
  if (badge.kind === "observer") return "Observer Source Setup";
  if (badge.kind === "source") return "Source Routing";
  if (badge.kind === "compact_observation") return "Compact Observation Evidence";
  if (badge.kind === "procedural_binding") return "Procedural Binding";
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint") return "Helix Ask Checkpoint";
  if (badge.kind === "checkpoint_request") return "Checkpoint Request";
  if (badge.kind === "answer_snapshot") return "Answer Snapshot";
  if (badge.kind === "live_output") return "Live Output";
  if (badge.kind === "voice_output") return "Voice Output";
  if (badge.kind === "perturbation") return "Perturbation";
  if (badge.id === "interpreter.stage_play_reflection") return "Stage Interpreter";
  return labelize(badge.kind);
}

function selectedNodeConsoleDescription(badge: StagePlayBadgeV1 | null): string {
  if (!badge) {
    return "Add node types, watch live evidence fill them, and assemble procedures without granting execution.";
  }
  if (badge.kind === "observer") return "Configure source custody, routing, cadence, and audit buffers.";
  if (badge.kind === "source") return "Route this source into Stage Play and inspect its evidence custody.";
  if (badge.kind === "compact_observation") return "Inspect compact facts, evidence refs, and raw-buffer audit links.";
  if (badge.kind === "procedural_binding") return "Inspect the expression and badges that support this procedure.";
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint") return "Inspect Ask turn refs, tool observation refs, and solver/debug status.";
  if (badge.kind === "checkpoint_request") return "Inspect the queued checkpoint request and live-job queue controls.";
  if (badge.kind === "answer_snapshot") return "Inspect the upheld model-reviewed answer and supporting refs.";
  if (badge.kind === "perturbation") return "Inspect source-window changes, affected badges, and whether a checkpoint is suggested.";
  if (badge.kind === "live_output" || badge.kind === "voice_output") {
    return "Inspect projection state, output text, refs, and voice eligibility.";
  }
  if (badge.id === "interpreter.stage_play_reflection") {
    return "Project current Stage Play evidence lanes into Live Interpretation without creating answer snapshot authority.";
  }
  return "Inspect the selected node without mixing in unrelated builder controls.";
}

function inspectorTestIdForBadge(badge: StagePlayBadgeV1): string {
  if (badge.kind === "observer") return "stage-play-observer-node-controls";
  if (badge.kind === "source") return "stage-play-source-node-controls";
  if (badge.kind === "compact_observation") return "stage-play-compact-observation-node-controls";
  if (badge.kind === "procedural_binding") return "stage-play-procedural-binding-node-controls";
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint") return "stage-play-ask-checkpoint-node-controls";
  if (badge.kind === "checkpoint_request") return "stage-play-checkpoint-request-node-controls";
  if (badge.kind === "answer_snapshot") return "stage-play-answer-snapshot-node-controls";
  if (badge.kind === "live_output") return "stage-play-live-output-node-controls";
  if (badge.kind === "voice_output") return "stage-play-voice-output-node-controls";
  if (badge.kind === "perturbation") return "stage-play-perturbation-node-controls";
  if (badge.id === "interpreter.stage_play_reflection") return "stage-play-interpreter-node-controls";
  return "stage-play-selected-node-controls";
}

function badgeReferenceTokens(badge: StagePlayBadgeV1): Set<string> {
  return new Set([
    badge.id,
    ...badge.evidenceRefs,
    ...(badge.dataTray?.evidenceRefs ?? []),
    ...badge.sourceRefs.map((ref) => ref.id),
    ...badge.sourceRefs.map((ref) => `${ref.kind}:${ref.id}`),
  ]);
}

function isModelReviewedAnswerSnapshot(badge: StagePlayBadgeV1): boolean {
  const modelReviewedMarkers = [...badge.tags, ...badge.reasonCodes].some((value) =>
    /model_reviewed|model_authored|answer_snapshot_from_checkpoint|answer_snapshot_from_model_authored_checkpoint/i.test(value)
  );
  return (
    badge.kind === "answer_snapshot" &&
    badge.output?.state === "model_reviewed" &&
    (badge.checkpoint?.modelReviewed === true || modelReviewedMarkers)
  );
}

function findCitedModelReviewedAnswerSnapshot(
  badge: StagePlayBadgeV1,
  answerSnapshots: StagePlayBadgeV1[],
): StagePlayBadgeV1 | null {
  const refs = badgeReferenceTokens(badge);
  return answerSnapshots.find((snapshot) => {
    if (!isModelReviewedAnswerSnapshot(snapshot)) return false;
    const snapshotRefs = badgeReferenceTokens(snapshot);
    return refs.has(snapshot.id) ||
      refs.has(`badge:${snapshot.id}`) ||
      refs.has(`stage_play_badge:${snapshot.id}`) ||
      Array.from(snapshotRefs).some((ref) => refs.has(ref) && /answer_snapshot/i.test(ref));
  }) ?? null;
}

function compactTrayText(value: string | null | undefined, fallback: string): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > 120 ? `${text.slice(0, 117).trimEnd()}...` : text;
}

type StagePlayBadgeTrayView = {
  title: string;
  metric: string;
  summary: string;
  detail: string;
};

function compactTrayMetric(value: string | number | null | undefined, fallback: string): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > 34 ? `${text.slice(0, 31).trimEnd()}...` : text;
}

function stagePlayDataFlowRefs(badge: StagePlayBadgeV1): string[] {
  return uniqueSorted([
    ...(badge.dataTray?.inputRefs ?? []),
    ...(badge.dataTray?.outputRefs ?? []),
    ...(badge.dataTray?.evidenceRefs ?? []),
  ]);
}

function hasStagePlayDataFlowTray(badge: StagePlayBadgeV1): boolean {
  return Boolean(
    badge.dataTray?.transformLabel ||
      badge.dataTray?.inputRefs?.length ||
      badge.dataTray?.outputRefs?.length ||
      badge.dataTray?.inputPreview ||
      badge.dataTray?.outputPreview ||
      badge.dataTray?.skipped?.length ||
      badge.dataTray?.blockedUntil,
  );
}

function copyStagePlayRefs(refs: string[]): void {
  if (refs.length === 0) return;
  void navigator.clipboard?.writeText(refs.join("\n")).catch(() => undefined);
}

function CopyStagePlayRefsButton({ refs, label = "Copy refs" }: { refs: string[]; label?: string }) {
  if (refs.length === 0) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        copyStagePlayRefs(refs);
      }}
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-700 text-slate-400 hover:border-cyan-500 hover:text-cyan-100"
      aria-label={label}
      title={label}
      data-testid="stage-play-copy-data-flow-refs"
    >
      <Copy className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}

function firstLiveBindingSummary(badge: StagePlayBadgeV1): string | null {
  const binding = badge.liveBindings.find((entry) =>
    entry.compactValue !== null && entry.compactValue !== undefined && entry.compactValue !== ""
  );
  return binding ? `${labelize(binding.bindingKind)}: ${String(binding.compactValue)}` : null;
}

function routeAuthorityPassed(badge: StagePlayBadgeV1): boolean {
  return badge.reasonCodes.some((code) =>
    /route_authority|terminal_authority|completed_solver_path|model_authored|solver_completed/i.test(code)
  );
}

function observerTrayView(badge: StagePlayBadgeV1, sources: StagePlayObserverSource[]): StagePlayBadgeTrayView {
  const visualSource = sources.find((source) => /visual|frame|screen/i.test(source.modality));
  const sceneSource = sources.find((source) => source.contribution.trim().length > 0);
  const selectedCount = sources.filter((source) => source.selectedForStagePlay).length;
  const activeCount = sources.filter((source) => source.status === "active").length;
  const evidenceCount = new Set([
    ...badge.evidenceRefs,
    ...(badge.dataTray?.evidenceRefs ?? []),
    ...sources.flatMap((source) => source.evidenceRefs),
  ]).size;
  const visualStatus = visualSource
    ? `${labelize(visualSource.modality)} ${labelize(visualSource.status)}`
    : "visual frame missing";
  return {
    title: badge.dataTray?.title ?? "Observer",
    metric: compactTrayMetric(badge.dataTray?.freshness ?? `${selectedCount}/${sources.length} routed`, "unknown"),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ?? `${visualStatus} - ${badge.dataTray?.summary ?? sceneSource?.contribution ?? badge.plainMeaning}`,
      "No live source summary yet.",
    ),
    detail: compactTrayText(
      `${activeCount} active | ${evidenceCount} refs | freshness ${badge.dataTray?.freshness ?? "unknown"}`,
      "No source custody state.",
    ),
  };
}

function compactObservationTrayView(badge: StagePlayBadgeV1): StagePlayBadgeTrayView {
  return {
    title: badge.dataTray?.title ?? "Compact observation",
    metric: compactTrayMetric(
      badge.dataTray?.confidence !== undefined && badge.dataTray?.confidence !== null
        ? `confidence ${badge.dataTray.confidence.toFixed(2)}`
        : `confidence ${badge.confidence.toFixed(2)}`,
      "confidence unknown",
    ),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ?? badge.dataTray?.summary ?? firstLiveBindingSummary(badge) ?? badge.plainMeaning,
      "No compact fact summary yet.",
    ),
    detail: compactTrayText(
      badge.dataTray?.transformLabel ?? badge.sourceRefs[0]?.id ?? badge.evidenceRefs[0] ?? "source window pending",
      "source window pending",
    ),
  };
}

function askCheckpointTrayView(badge: StagePlayBadgeV1): StagePlayBadgeTrayView {
  const checkpoint = badge.checkpoint;
  const solverState = checkpoint?.modelReviewed ? "solver completed" : "solver pending";
  const routeState = routeAuthorityPassed(badge) || checkpoint?.modelReviewed ? "route authority passed" : "route authority pending";
  return {
    title: badge.dataTray?.title ?? "Ask checkpoint",
    metric: compactTrayMetric(checkpoint?.askTurnId ?? "no turn", "no turn"),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ?? badge.dataTray?.summary ?? `${solverState}; ${checkpoint?.modelReviewed ? "model reviewed" : "not reviewed"}`,
      "No answer snapshot yet.",
    ),
    detail: compactTrayText(
      `${routeState} | ${checkpoint?.terminalArtifactKind ?? "no terminal artifact"}`,
      "route authority pending",
    ),
  };
}

function answerSnapshotTrayView(badge: StagePlayBadgeV1): StagePlayBadgeTrayView {
  return {
    title: badge.dataTray?.title ?? "Answer snapshot",
    metric: compactTrayMetric(badge.dataTray?.updatedAt ? formatStagePlayClock(badge.dataTray.updatedAt) : "no update", "no update"),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ?? badge.output?.text ?? badge.dataTray?.summary ?? badge.plainMeaning,
      "No upheld answer snapshot yet.",
    ),
    detail: compactTrayText(
      `${badge.evidenceRefs.length} refs | ${badge.output?.state ? labelize(badge.output.state) : "not projected"}`,
      "0 refs",
    ),
  };
}

function outputTrayView(badge: StagePlayBadgeV1): StagePlayBadgeTrayView {
  const outputState = badge.output?.state ?? "draft";
  return {
    title: badge.dataTray?.title ?? badge.output?.lineKey ?? labelize(badge.kind),
    metric: compactTrayMetric(labelize(outputState), "draft"),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ?? badge.output?.text ?? badge.dataTray?.summary ?? badge.plainMeaning,
      "No output text projected yet.",
    ),
    detail: compactTrayText(
      `${badge.evidenceRefs.length} refs | voice ${badge.output?.voiceEligible ? "eligible" : "locked"}`,
      "voice locked",
    ),
  };
}

function badgeTrayView(badge: StagePlayBadgeV1, observerSources: StagePlayObserverSource[]): StagePlayBadgeTrayView {
  if (badge.kind === "observer") return observerTrayView(badge, observerSources);
  if (badge.kind === "compact_observation") return compactObservationTrayView(badge);
  if (badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint") return askCheckpointTrayView(badge);
  if (badge.kind === "answer_snapshot") return answerSnapshotTrayView(badge);
  if (badge.kind === "live_output" || badge.kind === "voice_output") return outputTrayView(badge);
  return {
    title: badge.dataTray?.title ?? badge.output?.lineKey ?? labelize(badge.kind),
    metric: compactTrayMetric(
      badge.dataTray?.freshness ?? badge.output?.state ?? badge.confidence.toFixed(2),
      badge.confidence.toFixed(2),
    ),
    summary: compactTrayText(
      badge.dataTray?.outputPreview ??
        badge.dataTray?.summary ??
        badge.output?.text ??
        firstLiveBindingSummary(badge) ??
        badge.missingEvidence[0] ??
        badge.reasonCodes[0] ??
        badge.plainMeaning,
      "No compact tray data yet.",
    ),
    detail: compactTrayText(
      badge.dataTray?.transformLabel ?? `${badge.evidenceRefs.length} evidence ref(s)`,
      "0 evidence ref(s)",
    ),
  };
}

function syntheticNodeTrayView(node: StagePlaySyntheticNode): StagePlayBadgeTrayView {
  return {
    title: labelize(node.kind),
    metric: compactTrayMetric(labelize(node.status), "unknown"),
    summary: compactTrayText(
      node.evidenceRefs[0] ??
        (node.relatedBadgeIds.length > 0 ? `${node.relatedBadgeIds.length} related badge(s)` : null),
      "Synthetic output from graph evidence.",
    ),
    detail: compactTrayText(`${node.evidenceRefs.length} evidence ref(s)`, "0 evidence ref(s)"),
  };
}

const latestStagePlayMailItem = (
  items: StagePlayLiveSourceMailItemV1[],
  predicate?: (item: StagePlayLiveSourceMailItemV1) => boolean,
): StagePlayLiveSourceMailItemV1 | null => {
  const matching = predicate ? items.filter(predicate) : items;
  return matching.slice().sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1) ?? null;
};

const latestStagePlayMailDecision = (
  decisions: StagePlayLiveSourceMailDecisionV1[],
  mailId?: string | null,
): StagePlayLiveSourceMailDecisionV1 | null => {
  const matching = mailId
    ? decisions.filter((decision) => decision.mailIds.includes(mailId))
    : decisions;
  return matching.slice().sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1) ?? null;
};

const latestStagePlayNarrativeStateForDecision = (
  states: StagePlayLiveSourceNarrativeStateV1[],
  decision: StagePlayLiveSourceMailDecisionV1 | null,
): StagePlayLiveSourceNarrativeStateV1 | null => {
  if (!decision) return null;
  const byRef = decision.narrativeStateRef
    ? states.find((state) => state.narrativeStateId === decision.narrativeStateRef)
    : null;
  if (byRef) return byRef;
  return states
    .filter((state) =>
      state.lastDecisionRef === decision.decisionId ||
      state.mailBatchRefs.some((mailId) => decision.mailIds.includes(mailId))
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1) ?? null;
};

const latestStagePlayMailWakeRequest = (
  wakes: StagePlayLiveSourceMailWakeRequestV1[],
  mailId?: string | null,
): StagePlayLiveSourceMailWakeRequestV1 | null => {
  const matching = mailId
    ? wakes.filter((wake) => wake.mailIds.includes(mailId))
    : wakes;
  return matching.slice().sort((left, right) => left.queuedAt.localeCompare(right.queuedAt)).at(-1) ?? null;
};

const latestStagePlayMailWakeResult = (
  results: StagePlayLiveSourceMailWakeResultV1[],
  wakeRequestId?: string | null,
): StagePlayLiveSourceMailWakeResultV1 | null => {
  const matching = wakeRequestId
    ? results.filter((result) => result.wakeRequestId === wakeRequestId)
    : results;
  return matching.slice().sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1) ?? null;
};

const isStagePlayMailWakePressureResult = (
  result: StagePlayLiveSourceMailWakeResultV1,
): boolean =>
  result.status === "deferred_for_pressure" ||
  /(?:pressure|runtime_memory|503)/i.test(result.failedReason ?? "");

const isStagePlayMailWakeAskAttemptResult = (
  result: StagePlayLiveSourceMailWakeResultV1,
): boolean =>
  result.status === "completed" ||
  result.status === "failed_terminal" ||
  result.status === "skipped" ||
  Boolean(result.askTurnId) ||
  result.decisionIds.length > 0 ||
  (
    result.status === "failed_retryable" &&
    !isStagePlayMailWakePressureResult(result)
  );

function resolveActiveWatchPolicy(input: {
  jobStates: StagePlayLiveSourceJobStateV1[];
  policies: StagePlayLiveSourceWatchJobPolicyV1[];
  sourceId?: string | null;
}): {
  activeJob: StagePlayLiveSourceJobStateV1 | null;
  activePolicy: StagePlayLiveSourceWatchJobPolicyV1 | null;
  reason: "direct_job_ref" | "source_match" | "latest_armed_policy" | "policy_without_job_state" | "no_policy";
} {
  const policiesById = new Map(input.policies.map((policy) => [policy.policyId, policy]));
  const findJobForPolicy = (policy: StagePlayLiveSourceWatchJobPolicyV1): StagePlayLiveSourceJobStateV1 | null =>
    [...input.jobStates].reverse().find((job) =>
      job.jobId === policy.jobId ||
      job.watchJobPolicyRef === policy.policyId
    ) ?? null;
  const activeJobWithPolicy = [...input.jobStates]
    .reverse()
    .find((job) =>
      (job.status === "armed" || job.status === "checking") &&
      Boolean(job.watchJobPolicyRef && policiesById.has(job.watchJobPolicyRef))
    );
  if (activeJobWithPolicy?.watchJobPolicyRef) {
    const directPolicy = policiesById.get(activeJobWithPolicy.watchJobPolicyRef) ?? null;
    if (directPolicy) {
      return {
        activeJob: activeJobWithPolicy,
        activePolicy: directPolicy,
        reason: "direct_job_ref",
      };
    }
  }

  const sourceMatchedPolicy = input.sourceId
    ? [...input.policies].reverse().find((policy) =>
      policy.status === "armed" &&
      policy.sourceIds.includes(input.sourceId as string)
    ) ?? null
    : null;
  if (sourceMatchedPolicy) {
    return {
      activeJob: findJobForPolicy(sourceMatchedPolicy),
      activePolicy: sourceMatchedPolicy,
      reason: "source_match",
    };
  }

  const latestArmedPolicy = [...input.policies].reverse().find((policy) => policy.status === "armed") ?? null;
  if (latestArmedPolicy) {
    return {
      activeJob: findJobForPolicy(latestArmedPolicy),
      activePolicy: latestArmedPolicy,
      reason: "latest_armed_policy",
    };
  }

  const latestPolicy = input.policies.at(-1) ?? null;
  if (latestPolicy) {
    return {
      activeJob: findJobForPolicy(latestPolicy),
      activePolicy: latestPolicy,
      reason: "policy_without_job_state",
    };
  }

  return {
    activeJob: null,
    activePolicy: null,
    reason: "no_policy",
  };
}

function resolveActiveInterpreterProfile(input: {
  profiles: StagePlayLiveSourceInterpreterProfileV1[];
  activeJob?: StagePlayLiveSourceJobStateV1 | null;
  activePolicy?: StagePlayLiveSourceWatchJobPolicyV1 | null;
  sourceKind?: string | null;
}): {
  activeProfile: StagePlayLiveSourceInterpreterProfileV1 | null;
  reason:
    | "direct_job_ref"
    | "direct_policy_ref"
    | "source_kind_match"
    | "unscoped_active_profile"
    | "latest_active_profile"
    | "latest_profile"
    | "no_profile";
} {
  const activeProfiles = input.profiles.filter((profile) => profile.status === "active");
  const directJobProfile = input.activeJob
    ? [...activeProfiles].reverse().find((profile) => profile.jobId === input.activeJob?.jobId) ?? null
    : null;
  if (directJobProfile) {
    return { activeProfile: directJobProfile, reason: "direct_job_ref" };
  }

  const directPolicyProfile = input.activePolicy
    ? [...activeProfiles].reverse().find((profile) => profile.policyId === input.activePolicy?.policyId) ?? null
    : null;
  if (directPolicyProfile) {
    return { activeProfile: directPolicyProfile, reason: "direct_policy_ref" };
  }

  const sourceKindProfile = input.sourceKind
    ? [...activeProfiles].reverse().find((profile) => profile.sourceKinds.includes(input.sourceKind as string)) ?? null
    : null;
  if (sourceKindProfile) {
    return { activeProfile: sourceKindProfile, reason: "source_kind_match" };
  }

  const unscopedActiveProfile =
    [...activeProfiles].reverse().find((profile) => !profile.jobId && !profile.policyId) ?? null;
  if (unscopedActiveProfile) {
    return { activeProfile: unscopedActiveProfile, reason: "unscoped_active_profile" };
  }

  const latestActiveProfile = activeProfiles.at(-1) ?? null;
  if (latestActiveProfile) {
    return { activeProfile: latestActiveProfile, reason: "latest_active_profile" };
  }

  const latestProfile = input.profiles.at(-1) ?? null;
  if (latestProfile) {
    return { activeProfile: latestProfile, reason: "latest_profile" };
  }

  return { activeProfile: null, reason: "no_profile" };
}

const MICRO_REASONER_DISPLAY: Record<StagePlayMicroReasonerRoleV1, {
  title: string;
  subtitle: string;
  missingPreview: string;
}> = {
  claim_extractor: {
    title: "Claim Extractor",
    subtitle: "summary -> claimlets",
    missingPreview: "waiting for claim extraction",
  },
  observation_classifier: {
    title: "Observed / Inferred Classifier",
    subtitle: "stable vs changed facts",
    missingPreview: "waiting for classified observations",
  },
  profile_comparator: {
    title: "Interpreter Profile Comparator",
    subtitle: "profile lens over facts",
    missingPreview: "waiting for profile comparison",
  },
  delta_extractor: {
    title: "Delta Extractor",
    subtitle: "prior state -> current delta",
    missingPreview: "waiting for delta extraction",
  },
  prediction_validator: {
    title: "Prediction Validator",
    subtitle: "prior prediction check",
    missingPreview: "waiting for prediction validation",
  },
  salience_scorer: {
    title: "Salience / Voice Candidate",
    subtitle: "wake + voice scoring",
    missingPreview: "waiting for salience score",
  },
  decision_selector: {
    title: "Decision Selector",
    subtitle: "packet -> procedural next step",
    missingPreview: "waiting for decision selection",
  },
  voice_callout_drafter: {
    title: "Voice Draft",
    subtitle: "voice candidate -> draft receipt",
    missingPreview: "waiting for voice draft",
  },
  packet_composer: {
    title: "Processed Packet",
    subtitle: "structured packet composer",
    missingPreview: "waiting for processed packet",
  },
};

const latestMicroReasonerRunForRole = (
  runs: StagePlayMicroReasonerRunV1[],
  role: StagePlayMicroReasonerRoleV1,
  mailIds: string[],
): StagePlayMicroReasonerRunV1 | null => {
  const mailIdSet = new Set(mailIds);
  return runs
    .filter((run) => run.role === role)
    .filter((run) => mailIdSet.size === 0 || run.mailIds.some((mailId) => mailIdSet.has(mailId)))
    .at(-1) ?? null;
};

const activeMicroReasonerPromptForRole = (
  prompts: StagePlayMicroReasonerPromptV1[],
  role: StagePlayMicroReasonerRoleV1,
): StagePlayMicroReasonerPromptV1 | null =>
  prompts.filter((prompt) => prompt.active && prompt.role === role).at(-1) ??
  prompts.filter((prompt) => prompt.role === role).at(-1) ??
  null;

const makeMicroReasonerNode = (input: {
  role: StagePlayMicroReasonerRoleV1;
  run: StagePlayMicroReasonerRunV1 | null;
  prompt: StagePlayMicroReasonerPromptV1 | null;
  packet: StagePlayProcessedMailPacketV1 | null;
  fallbackInputRefs: string[];
  fallbackInputPreview: string;
  fallbackOutputPreview?: string | null;
  edgeLabel: string;
  edgeTone: "connected" | "pending" | "blocked";
}): StagePlayMailLoopNode => {
  const display = MICRO_REASONER_DISPLAY[input.role];
  const modelLabel = input.run?.modelUsed ?? input.prompt?.modelPreference ?? "not run";
  const latencyLabel = input.run?.latencyMs == null ? "pending" : `${input.run.latencyMs}ms`;
  const promptLabel = input.prompt
    ? `${input.prompt.title} v${input.prompt.version}`
    : "prompt missing";
  const status = input.run?.status ?? (input.prompt ? "ready" : "missing");
  return {
    id: `observer_mail_loop:micro_reasoner:${input.role}`,
    title: display.title,
    subtitle: display.subtitle,
    status,
    preview: input.run?.outputPreview ?? input.fallbackOutputPreview ?? display.missingPreview,
    statusChips: [
      input.prompt?.modelPreference ?? null,
      input.run?.latencyMs != null ? latencyLabel : null,
    ].filter((entry): entry is string => Boolean(entry)),
    payloadRows: [
      {
        label: "Prompt used",
        value: promptLabel,
        tone: input.prompt ? "good" : "blocked",
      },
      {
        label: "Latest input",
        value: input.run?.inputPreview ?? input.fallbackInputPreview,
        tone: input.run ? "good" : "warn",
      },
      {
        label: "Latest output",
        value: input.run?.outputPreview ?? input.fallbackOutputPreview ?? "No run output yet.",
        tone: input.run ? "good" : "warn",
      },
      {
        label: "Model/tool",
        value: `${modelLabel} | ${latencyLabel}`,
      },
    ],
    edgeToNext: {
      label: input.edgeLabel,
      tone: input.edgeTone,
    },
    inputLabel: "Input",
    inputRefs: input.run?.inputRefs ?? input.fallbackInputRefs,
    inputPreview: input.run?.inputPreview ?? input.fallbackInputPreview,
    transformLabel: input.prompt
      ? `${input.prompt.title} v${input.prompt.version} -> ${input.prompt.outputSchemaName}`
      : `${display.title} prompt missing`,
    outputLabel: "Output",
    outputRefs: input.run?.outputRefs ?? (input.role === "packet_composer" && input.packet ? [input.packet.packetId] : []),
    outputPreview: input.run?.outputPreview ?? input.fallbackOutputPreview ?? display.missingPreview,
    inspector: input.prompt ? {
      kind: "micro_reasoner_prompt",
      title: input.prompt.title,
      promptId: input.prompt.promptId,
      linkedNoteId: input.prompt.linkedNoteId,
      body: [
        `Role: ${input.prompt.role}`,
        `Version: ${input.prompt.version}`,
        `Active: ${input.prompt.active}`,
        `Model preference: ${input.prompt.modelPreference}`,
        `Input schema: ${input.prompt.inputSchemaName}`,
        `Output schema: ${input.prompt.outputSchemaName}`,
        "",
        input.prompt.template,
      ].join("\n"),
    } : null,
  };
};

function buildObserverMailLoopNodes(input: {
  graph: StagePlayBadgeGraphV1;
  mailbox: StagePlayLiveSourceMailListResponse | null | undefined;
  transcript: StagePlayLiveSourceMailTranscriptResponse | null | undefined;
}): StagePlayMailLoopNode[] {
  const { graph, mailbox, transcript } = input;
  const mailItems = mailbox?.mailItems ?? [];
  const jobStates = mailbox?.jobStates ?? [];
  const decisions = mailbox?.decisions ?? [];
  const narrativeStates = mailbox?.narrativeStates ?? [];
  const wakeRequests = mailbox?.wakeRequests ?? [];
  const wakeResults = mailbox?.wakeResults ?? [];
  const interpreterProfiles = mailbox?.interpreterProfiles ?? [];
  const interpreterProfileComparisons = mailbox?.interpreterProfileComparisons ?? [];
  const visualObserverProfiles = mailbox?.visualObserverProfiles ?? [];
  const microReasonerPrompts = mailbox?.microReasonerPrompts ?? [];
  const microReasonerRuns = mailbox?.microReasonerRuns ?? [];
  const processedMailPackets = mailbox?.processedMailPackets ?? [];
  const transcriptRows = transcript?.transcriptRows ?? transcript?.entries?.map((entry) => entry.row) ?? [];
  const steeringRows = transcriptRows.filter(isStagePlaySteeringTranscriptRow);
  const latestSteeringRow = steeringRows.at(-1) ?? null;
  const latestSteeringAck = steeringRows.filter((row) => row.rowKind === "steering_ack_receipt").at(-1) ?? null;
  const latestSteeringDecisionRow =
    steeringRows
      .filter((row) =>
        row.rowKind !== "voice_steering_received" &&
        row.rowKind !== "steering_ack_receipt"
      )
      .at(-1) ?? null;
  const latestSteeringReceived = steeringRows.filter((row) => row.rowKind === "voice_steering_received").at(-1) ?? null;
  const steeringStatusRow = latestSteeringDecisionRow ?? latestSteeringAck ?? latestSteeringReceived ?? latestSteeringRow;
  const steeringStatus = steeringStatusRow?.rowKind ?? "not_observed";
  const steeringTone =
    steeringStatus === "voice_steering_rejected" || steeringStatus === "voice_steering_cancel_requested"
      ? "blocked"
      : steeringStatus === "voice_steering_deferred" || steeringStatus === "voice_steering_queued" || steeringStatus === "voice_steering_received"
        ? "warn"
        : steeringStatus === "voice_steering_applied" || steeringStatus === "steering_ack_receipt"
          ? "good"
          : "default";
  const steeringStatusText = steeringStatusRow
    ? stagePlaySteeringRowLabel(steeringStatusRow.rowKind)
    : "No steering timeline evidence yet.";
  const steeringPreview = steeringStatusRow
    ? `${steeringStatusText}: ${compactStagePlayText(steeringStatusRow.body, steeringStatusText)}`
    : "No voice steering row has been recorded for this Stage Play mailbox.";
  const steeringEventRefs = uniqueSorted([
    ...(transcript?.transcriptEntryIds ?? []),
    ...(transcript?.evidenceRefs ?? []),
    ...steeringRows.flatMap((row) => [
      row.source.artifactId ?? "",
      ...row.evidenceRefs,
    ]),
  ].filter(Boolean));
  const mailboxThreadId = mailbox?.mailboxThreadId ?? STAGE_PLAY_PANEL_THREAD_ID;
  const requestedThreadId = mailbox?.requestedThreadId ?? STAGE_PLAY_PANEL_THREAD_ID;
  const visualMail = latestStagePlayMailItem(mailItems, (item) => item.sourceKind === "visual_frame") ?? latestStagePlayMailItem(mailItems);
  const visualSource = graph.sourceWindow.sources.find((source) =>
    source.modality === "visual_frame" && source.status === "active"
  ) ?? graph.sourceWindow.sources.find((source) => source.modality === "visual_frame") ?? null;
  const activeVisualObserverProfile = mailbox?.activeVisualObserverProfile ??
    visualObserverProfiles.find((profile) =>
      profile.status === "active" &&
      (visualSource?.sourceId ? profile.sourceIds.includes(visualSource.sourceId) : false)
    ) ??
    null;
  const latestVisualObserverProfileRef = visualMail?.evidenceRefs.find((ref) =>
    ref.startsWith("stage_play_visual_observer_profile:")
  ) ?? activeVisualObserverProfile?.profileId ?? null;
  const latestVisualPromptHashRef = visualMail?.evidenceRefs.find((ref) =>
    ref.startsWith("visual_prompt_hash:")
  ) ?? (activeVisualObserverProfile?.promptHash ? `visual_prompt_hash:${activeVisualObserverProfile.promptHash}` : null);
  const visualObserverTitle =
    activeVisualObserverProfile?.title ??
    (latestVisualObserverProfileRef ? "Profile-stamped evidence" : "Generic Visual Observer");
  const visualObserverPromptPreview =
    activeVisualObserverProfile?.prompt
      ? activeVisualObserverProfile.prompt.replace(/\s+/g, " ").trim()
      : latestVisualObserverProfileRef
        ? "Latest evidence was produced with an observer profile."
        : "Generic capture prompt is active until a source-bound shade is applied.";
  const watchPolicyResolution = resolveActiveWatchPolicy({
    jobStates,
    policies: mailbox?.watchJobPolicies ?? [],
    sourceId: visualSource?.sourceId ?? visualMail?.sourceId ?? null,
  });
  const activeJob = watchPolicyResolution.activeJob;
  const latestPolicy = watchPolicyResolution.activePolicy;
  const unreadCount = mailItems.filter((item) => item.status === "unread").length;
  const deliveredCount = mailItems.filter((item) => item.status === "delivered_to_ask").length;
  const visualBacklogCount = mailItems.filter((item) => item.sourceKind === "visual_frame" && item.status === "unread").length;
  const retryWakeCount = wakeRequests.filter((wake) => wake.status === "failed_retryable").length;
  const pressureWakeCount = wakeRequests.filter((wake) => wake.status === "deferred_for_pressure").length;
  const askWakeRequestCount = wakeRequests.filter((wake) =>
    wake.status === "queued" ||
    wake.status === "running" ||
    wake.status === "failed_retryable" ||
    wake.status === "deferred_for_pressure"
  ).length;
  const queuedWakeMailCount = wakeRequests
    .filter((wake) => wake.status === "queued")
    .reduce((total, wake) => total + wake.mailIds.length, 0);
  const runningWakeMailCount = wakeRequests
    .filter((wake) => wake.status === "running")
    .reduce((total, wake) => total + wake.mailIds.length, 0);
  const retryWakeMailCount = wakeRequests
    .filter((wake) => wake.status === "failed_retryable")
    .reduce((total, wake) => total + wake.mailIds.length, 0);
  const pressureWakeMailCount = wakeRequests
    .filter((wake) => wake.status === "deferred_for_pressure")
    .reduce((total, wake) => total + wake.mailIds.length, 0);
  const wakeBacklogMailCount = queuedWakeMailCount + runningWakeMailCount + retryWakeMailCount + pressureWakeMailCount;
  const behindCount = Math.max(0, unreadCount + deliveredCount + wakeBacklogMailCount);
  const latestDecision =
    latestStagePlayMailDecision(decisions, visualMail?.mailId) ??
    latestStagePlayMailDecision(decisions, jobStates.at(-1)?.lastMailId ?? null) ??
    latestStagePlayMailDecision(decisions);
  const latestNarrativeState = latestStagePlayNarrativeStateForDecision(narrativeStates, latestDecision);
  const latestWake =
    latestStagePlayMailWakeRequest(wakeRequests, visualMail?.mailId) ??
    latestStagePlayMailWakeRequest(wakeRequests);
  const latestAskAttemptWakeResult =
    latestStagePlayMailWakeResult(wakeResults.filter(isStagePlayMailWakeAskAttemptResult), latestWake?.wakeRequestId ?? null) ??
    latestStagePlayMailWakeResult(wakeResults.filter(isStagePlayMailWakeAskAttemptResult));
  const latestPressureWakeResult =
    latestStagePlayMailWakeResult(wakeResults.filter(isStagePlayMailWakePressureResult), latestWake?.wakeRequestId ?? null) ??
    latestStagePlayMailWakeResult(wakeResults.filter(isStagePlayMailWakePressureResult));
  const latestWakeResult =
    latestAskAttemptWakeResult ??
    latestStagePlayMailWakeResult(wakeResults, latestWake?.wakeRequestId ?? null) ??
    latestStagePlayMailWakeResult(wakeResults);
  const wakeById = new Map(wakeRequests.map((wake) => [wake.wakeRequestId, wake]));
  const displayWake = latestWakeResult
    ? wakeById.get(latestWakeResult.wakeRequestId) ?? latestWake
    : latestWake;
  const pressureIsSecondary =
    Boolean(latestPressureWakeResult) &&
    latestPressureWakeResult?.wakeResultId !== latestWakeResult?.wakeResultId;
  const latestWakeStatus = latestWakeResult?.status ?? displayWake?.status ?? null;
  const latestWakeFailureReason = latestWakeResult?.failedReason ?? displayWake?.failureReason ?? null;
  const latestWakeAskTurnId = latestWakeResult?.askTurnId ?? displayWake?.askTurnId ?? null;
  const latestWakeDecisionIds = latestWakeResult?.decisionIds ?? displayWake?.decisionIds ?? [];
  const hasWatchPolicy = Boolean(latestPolicy);
  const manualCheckpointWithoutPolicy = Boolean(
    latestDecision &&
    latestDecision.nextLoopState === "armed_for_next_summary" &&
    !hasWatchPolicy
  );
  const interpreterProfileResolution = resolveActiveInterpreterProfile({
    profiles: interpreterProfiles,
    activeJob,
    activePolicy: latestPolicy,
    sourceKind: visualMail?.sourceKind ?? visualSource?.modality ?? null,
  });
  const activeInterpreterProfile = interpreterProfileResolution.activeProfile;
  const latestProfileComparison =
    interpreterProfileComparisons
      .filter((comparison) =>
        (latestDecision?.profileComparisonRefs ?? []).includes(comparison.comparisonId) ||
        (visualMail?.mailId ? comparison.mailIds.includes(visualMail.mailId) : false) ||
        (latestNarrativeState?.narrativeStateId ? comparison.narrativeStateRef === latestNarrativeState.narrativeStateId : false)
      )
      .at(-1) ??
    interpreterProfileComparisons.at(-1) ??
    null;
  const latestProcessedPacket =
    processedMailPackets
      .filter((packet) =>
        visualMail?.mailId ? packet.mailIds.includes(visualMail.mailId) : true
      )
      .at(-1) ??
    processedMailPackets.at(-1) ??
    null;
  const processedPacketMailIds = latestProcessedPacket?.mailIds ?? (visualMail?.mailId ? [visualMail.mailId] : []);
  const microRun = (role: StagePlayMicroReasonerRoleV1) =>
    latestMicroReasonerRunForRole(microReasonerRuns, role, processedPacketMailIds);
  const microPrompt = (role: StagePlayMicroReasonerRoleV1) =>
    activeMicroReasonerPromptForRole(microReasonerPrompts, role);
  const observerOutputRefs = uniqueSorted([
    mailboxThreadId,
    visualSource?.sourceId ?? "",
    activeJob?.jobId ?? "",
    visualMail?.mailId ?? "",
  ].filter(Boolean));
  const mailInputRefs = uniqueSorted([
    visualMail?.sourceRefs.frameRef ?? "",
    visualMail?.sourceRefs.evidenceRef ?? "",
    visualMail?.sourceRefs.observationRef ?? "",
  ].filter(Boolean));
  const decisionInputRefs = uniqueSorted([
    ...(latestDecision?.mailIds ?? (visualMail?.mailId ? [visualMail.mailId] : [])),
  ]);
  const wakeInputRefs = uniqueSorted([
    ...(displayWake?.mailIds ?? (visualMail?.mailId ? [visualMail.mailId] : [])),
  ]);
  const profileInputRefs = uniqueSorted([
    activeInterpreterProfile?.policyId ?? "",
    activeInterpreterProfile?.jobId ?? activeJob?.jobId ?? "",
  ].filter(Boolean));
  const comparisonInputRefs = uniqueSorted([
    activeInterpreterProfile?.profileId ?? "",
    visualMail?.mailId ?? "",
    latestNarrativeState?.narrativeStateId ?? "",
  ].filter(Boolean));
  const queuedRunningText = `queued ${queuedWakeMailCount} / running ${runningWakeMailCount}`;
  const latestWakeAskText = latestWakeAskTurnId ? `latest ask ${latestWakeAskTurnId}` : "no Ask turn yet";
  const pressureText = latestWakeStatus === "deferred_for_pressure"
    ? `deferred for pressure; ${unreadCount} unread retained`
    : null;
  const secondaryPressureText = pressureIsSecondary
    ? `auto pressure retained ${unreadCount} unread`
    : null;
  const deferredWakeIds = uniqueSorted([
    ...(mailbox?.wakeAdmissionCycle?.deferredWakeIds ?? []),
    ...wakeRequests
      .filter((wake) => wake.status === "deferred_for_pressure")
      .map((wake) => wake.wakeRequestId),
  ]);
  const pressureDisplayWake = displayWake?.status === "deferred_for_pressure"
    ? displayWake
    : wakeRequests.filter((wake) => wake.status === "deferred_for_pressure").at(-1) ?? null;
  const pressureNextRetryAt = pressureDisplayWake?.nextRetryAt ?? null;
  const runtimePressureReason =
    mailbox?.wakeAdmissionCycle?.runtimeAdmission?.reason ??
    latestWakeFailureReason ??
    pressureDisplayWake?.failureReason ??
    null;
  const runtimePressureLevel = mailbox?.wakeAdmissionCycle?.runtimeAdmission?.pressureLevel ?? null;
  const runtimeAdmission = mailbox?.wakeAdmissionCycle?.runtimeAdmission ?? null;
  const runtimeMemoryText = runtimeAdmission?.memory && runtimeAdmission?.limits
    ? `Memory: heap ${runtimeAdmission.memory.heapUsedMiB ?? "?"}/${runtimeAdmission.limits.maxHeapUsedMiB ?? "?"} MiB; rss ${runtimeAdmission.memory.rssMiB ?? "?"}/${runtimeAdmission.limits.maxRssMiB ?? "?"} MiB`
    : null;
  const localBypassText = runtimeAdmission?.localBypass?.applied
    ? `Local wake bypass: ${runtimeAdmission.localBypass.reason}`
    : null;
  const continuation = mailbox?.wakeAdmissionCycle?.continuation ?? null;
  const continuationRunnableWakeIds = continuation?.runnableWakeIds ?? [];
  const continuationRetainedMailCount = continuationRunnableWakeIds
    .map((wakeId) => wakeById.get(wakeId))
    .filter((wake): wake is StagePlayLiveSourceMailWakeRequestV1 => Boolean(wake))
    .reduce((total, wake) => total + wake.mailIds.length, 0);
  const continuationReason = continuation?.reason ?? null;
  const continuationStateText = continuation
    ? continuation.scheduled
      ? `scheduled (${labelize(continuationReason ?? "runnable_wake_remaining")})`
      : continuationReason === "manual_cycle_no_auto_continuation"
        ? "manual cycle no auto continuation"
        : continuationReason === "wake_runner_disabled"
          ? "deferred; wake runner disabled"
          : continuationReason === "no_runnable_wake_remaining"
            ? "armed for next summary"
            : labelize(continuationReason ?? "deferred")
    : latestPolicy
      ? "armed for next summary"
      : "no watch policy";
  const pressureContinuationText = continuation
    ? continuation.scheduled
      ? `Auto continuation: scheduled (${labelize(continuation.reason ?? "runnable_wake_remaining")})`
      : `Auto continuation: waiting for pressure release (${labelize(continuation.reason ?? "runtime_pressure")})`
    : "Auto continuation: waiting for pressure release";
  const wakePressureActive = latestWakeStatus === "deferred_for_pressure" || pressureWakeCount > 0 || deferredWakeIds.length > 0;
  const wakePressureBand = wakePressureActive
    ? {
        title: "Wake admission",
        lines: [
          "Deferred before Ask wake",
          `${visualBacklogCount} raw visual backlog retained`,
          pressureNextRetryAt ? `Next retry: ${formatStagePlayClock(pressureNextRetryAt)}` : null,
          runtimePressureLevel ? `Pressure: ${labelize(runtimePressureLevel)}` : null,
          runtimePressureReason ? `Reason: ${labelize(runtimePressureReason)}` : null,
          runtimeMemoryText,
          localBypassText,
          pressureContinuationText,
        ].filter((line): line is string => Boolean(line)),
        tone: "pressure" as const,
      }
    : null;
  const wakeContinuationActive =
    Boolean(latestPolicy) &&
    !wakePressureActive &&
    Boolean(
      continuation ||
      latestWakeStatus === "completed" ||
      latestDecision?.nextLoopState === "armed_for_next_summary" ||
      activeJob?.nextLoopState === "armed_for_next_summary",
    );
  const wakeContinuationBand = wakeContinuationActive
    ? {
        title: "Continuation",
        lines: [
          latestWakeStatus === "completed" ? "Batch completed." : latestDecision ? "Manual checkpoint completed." : "Watch job active.",
          `Continuation: ${continuationStateText}`,
          `Loop state: ${latestDecision?.nextLoopState ?? activeJob?.nextLoopState ?? "armed_for_next_summary"}`,
          continuationRetainedMailCount > 0
            ? `Unread retained: ${continuationRetainedMailCount}`
            : unreadCount > 0
              ? `Unread retained: ${unreadCount}`
              : null,
          continuationRunnableWakeIds.length > 0 ? `Runnable wakes: ${continuationRunnableWakeIds.length}` : null,
        ].filter((line): line is string => Boolean(line)),
        tone: continuation?.scheduled ? "good" as const : "pending" as const,
      }
    : null;
  const latestDecisionText = latestDecision
    ? `${latestDecision.decision}: ${latestDecision.rationalePreview || latestDecision.decisionId}`
    : "no decision yet";
  const outputPreview = manualCheckpointWithoutPolicy
    ? latestNarrativeState
      ? `manual interpretation checkpoint: ${latestNarrativeState.interpretedSituation.userRelevantMeaning || latestNarrativeState.currentSceneSummary}`
      : "manual checkpoint complete; configure a watch job to continue automatically"
    : latestDecision?.voiceCalloutDraft?.text
    ? `voice draft: ${latestDecision.voiceCalloutDraft.text}`
    : latestDecision?.textAnswerDraft?.text
      ? `text answer: ${latestDecision.textAnswerDraft.text}`
      : latestNarrativeState
        ? `interpretation: ${latestNarrativeState.interpretedSituation.userRelevantMeaning || latestNarrativeState.currentSceneSummary}`
      : latestDecision?.decision === "wait_for_next_summary"
        ? "no output yet; armed for next source update"
        : latestDecision?.requestedTool?.toolName
          ? `requested tool: ${latestDecision.requestedTool.toolName}`
          : "no output yet";
  return [
    {
      id: "observer_mail_loop:observer",
      title: "Visual Source",
      subtitle: "source registry",
      status: visualSource?.status ?? "waiting",
      preview: visualSource
        ? `source ${visualSource.status}: ${visualSource.sourceId}`
        : "visual source not active",
      statusChips: [
        graph.sourceWindow.freshness,
        visualBacklogCount > 0 ? `${visualBacklogCount} visual backlog` : "visual backlog clear",
      ].filter((entry): entry is string => Boolean(entry)),
      payloadRows: [
        {
          label: "Source",
          value: `${visualSource?.sourceId ?? visualMail?.sourceId ?? "visual source pending"} | ${visualSource?.status ?? "unknown"} | ${graph.sourceWindow.freshness}`,
          tone: graph.sourceWindow.freshness === "fresh" ? "good" : "warn",
        },
        {
          label: "Objective",
          value: latestPolicy?.objectiveText ??
            (manualCheckpointWithoutPolicy
              ? "Manual checkpoint only. Configure a watch job to keep interpreting new mail."
              : activeJob?.objective ?? visualMail?.objective?.text ?? "No watch objective armed yet."),
          tone: latestPolicy ? "good" : "warn",
        },
        {
          label: "Mailbox",
          value: mailboxThreadId,
          tone: mailboxThreadId === STAGE_PLAY_PANEL_THREAD_ID ? "good" : "warn",
        },
        {
          label: "Processing",
          value: latestPolicy
            ? `${latestPolicy.interpretationMode ?? "latest_scene_answer"} | ${latestPolicy.mailProcessingMode ?? "latest_only"} | ${latestPolicy.outputCadence ?? "every_batch"}`
            : "No processing policy yet.",
          tone: latestPolicy ? "good" : "warn",
        },
      ],
      edgeToNext: {
        label: activeVisualObserverProfile ? "observer prompt" : visualSource ? "generic observer" : "source missing",
        tone: visualSource ? (activeVisualObserverProfile || latestVisualObserverProfileRef ? "connected" : "pending") : "blocked",
      },
      inputLabel: "Input",
      inputRefs: ["source registry"],
      inputPreview: "source registry",
      transformLabel: `source registry -> live-source mailbox (${mailboxThreadId})`,
      outputLabel: "Output",
      outputRefs: observerOutputRefs,
      outputPreview: `${visualSource?.sourceId ?? "visual_source missing"} ${visualSource?.status ?? "unknown"} | mailbox ${mailboxThreadId} | visual backlog ${visualBacklogCount} | delivered ${deliveredCount}`,
    },
    {
      id: "observer_mail_loop:observer_shades",
      title: "Observer Shades",
      subtitle: "visual model prompt lens",
      status: activeVisualObserverProfile || latestVisualObserverProfileRef ? "active" : "generic",
      preview: `${visualObserverTitle}; ${latestVisualPromptHashRef ?? "no prompt hash yet"}`,
      statusChips: [
        activeVisualObserverProfile?.domain ?? "generic",
        activeVisualObserverProfile?.outputMode ?? "prose",
      ].filter((entry): entry is string => Boolean(entry)),
      payloadRows: [
        {
          label: "Profile",
          value: visualObserverTitle,
          tone: activeVisualObserverProfile || latestVisualObserverProfileRef ? "good" : "warn",
        },
        {
          label: "Output",
          value: activeVisualObserverProfile?.outputMode ?? "generic prose fallback",
        },
        {
          label: "Prompt",
          value: visualObserverPromptPreview,
          tone: activeVisualObserverProfile ? "good" : "warn",
        },
        {
          label: "Hash",
          value: latestVisualPromptHashRef ?? "No visual prompt hash stamped yet.",
          tone: latestVisualPromptHashRef ? "good" : "warn",
        },
      ],
      edgeToNext: {
        label: visualMail ? "profiled mail" : visualSource ? "waiting for evidence" : "source missing",
        tone: visualMail ? "connected" : visualSource ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: uniqueSorted([visualSource?.sourceId ?? "", activeVisualObserverProfile?.profileId ?? ""].filter(Boolean)),
      inputPreview: visualSource?.sourceId ?? "visual source missing",
      transformLabel: activeVisualObserverProfile
        ? `${activeVisualObserverProfile.title} -> visual-frame/analyze`
        : "generic visual capture prompt -> visual-frame/analyze",
      outputLabel: "Output",
      outputRefs: uniqueSorted([
        latestVisualObserverProfileRef ?? "",
        latestVisualPromptHashRef ?? "",
        visualMail?.sourceRefs.evidenceRef ?? "",
      ].filter(Boolean)),
      outputPreview: visualMail?.summary.preview ?? "No latest visual evidence yet.",
      inspector: activeVisualObserverProfile ? {
        kind: "visual_observer_profile",
        title: activeVisualObserverProfile.title,
        profileId: activeVisualObserverProfile.profileId,
        linkedNoteId: activeVisualObserverProfile.linkedNoteId,
        body: [
          `Domain: ${activeVisualObserverProfile.domain}`,
          `Output: ${activeVisualObserverProfile.outputMode}`,
          `Prompt hash: ${activeVisualObserverProfile.promptHash}`,
          `Sources: ${activeVisualObserverProfile.sourceIds.join(", ") || "not source-bound"}`,
          "",
          activeVisualObserverProfile.prompt,
        ].join("\n"),
      } : null,
    },
    {
      id: "observer_mail_loop:visual_mail",
      title: "Visual Backlog",
      subtitle: "raw observer mail, not Ask queue",
      status: visualMail?.status ?? "missing",
      preview: visualMail
        ? `${visualBacklogCount} visual backlog; latest ${visualMail.summary.preview}`
        : "no compact mail yet",
      statusChips: [
        visualBacklogCount > 0 ? `${visualBacklogCount} observer backlog` : "observer backlog clear",
        askWakeRequestCount > 0 ? `${askWakeRequestCount} Ask wake request(s)` : "no Ask wake",
      ].filter((entry): entry is string => Boolean(entry)),
      payloadRows: [
        {
          label: "Latest",
          value: visualMail?.summary.preview ?? "No compact summary yet.",
          tone: visualMail ? "good" : "warn",
        },
        {
          label: "Observer backlog",
          value: `${visualBacklogCount} raw visual unread | ${deliveredCount} delivered to Ask/read path`,
          tone: visualBacklogCount > 0 ? "warn" : "default",
        },
        {
          label: "Ask wake queue",
          value: `${queuedWakeMailCount} queued mail | ${runningWakeMailCount} running | ${retryWakeMailCount} retry | ${pressureWakeMailCount} pressure-deferred`,
          tone: askWakeRequestCount > 0 ? "warn" : "default",
        },
        {
          label: "Namespace",
          value: `requested ${requestedThreadId} -> mailbox ${mailboxThreadId}`,
          tone: mailboxThreadId === STAGE_PLAY_PANEL_THREAD_ID ? "good" : "warn",
        },
      ],
      edgeToNext: {
        label: activeInterpreterProfile ? "profile lens" : latestPolicy ? "watch policy" : "no policy",
        tone: activeInterpreterProfile ? "connected" : latestPolicy ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: mailInputRefs,
      inputPreview: mailInputRefs.length > 0
        ? `${mailInputRefs.slice(0, 2).join(", ")} | mailbox ${mailboxThreadId}`
        : `visual_frame / visual_evidence pending | mailbox ${mailboxThreadId}`,
      transformLabel: "visual summary enqueue -> mailbox item",
      outputLabel: "Output",
      outputRefs: visualMail ? [visualMail.mailId, ...visualMail.evidenceRefs] : [],
      outputPreview: visualMail
        ? `summary preview: ${visualMail.summary.preview}; status ${visualMail.status}`
        : "summary preview: none yet; status missing",
    },
    makeMicroReasonerNode({
      role: "claim_extractor",
      run: microRun("claim_extractor"),
      prompt: microPrompt("claim_extractor"),
      packet: latestProcessedPacket,
      fallbackInputRefs: visualMail ? [visualMail.mailId, ...visualMail.evidenceRefs] : [],
      fallbackInputPreview: visualMail?.summary.preview ?? "compact visual-summary mail pending",
      fallbackOutputPreview: latestProcessedPacket?.observedFacts.slice(0, 3).join(" | ") ?? null,
      edgeLabel: microRun("observation_classifier") ? "classified" : "needs classifier",
      edgeTone: microRun("observation_classifier") ? "connected" : visualMail ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "observation_classifier",
      run: microRun("observation_classifier"),
      prompt: microPrompt("observation_classifier"),
      packet: latestProcessedPacket,
      fallbackInputRefs: microRun("claim_extractor")?.outputRefs ?? [],
      fallbackInputPreview: microRun("claim_extractor")?.outputPreview ?? "claimlets pending",
      fallbackOutputPreview: latestProcessedPacket
        ? `stable ${latestProcessedPacket.stableFactsUsed.slice(0, 2).join(" | ") || "none"}; changed ${latestProcessedPacket.changedFacts.slice(0, 2).join(" | ") || "none"}`
        : null,
      edgeLabel: activeInterpreterProfile ? "profile lens" : "profile optional",
      edgeTone: activeInterpreterProfile ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    {
      id: "observer_mail_loop:interpreter_profile",
      title: "Interpreter Profile",
      subtitle: "interpretation contract",
      status: activeInterpreterProfile?.status ?? "missing",
      preview: activeInterpreterProfile
        ? `${activeInterpreterProfile.title} | Domain: ${activeInterpreterProfile.domain} | Voice: ${activeInterpreterProfile.outputStyle.voiceStyle}`
        : "no active interpreter profile",
      statusChips: activeInterpreterProfile
        ? [
            activeInterpreterProfile.domain,
            activeInterpreterProfile.outputStyle.voiceStyle,
            interpreterProfileResolution.reason,
          ]
        : [hasWatchPolicy ? "watch policy only" : "policy missing"],
      payloadRows: [
        {
          label: "Contract",
          value: activeInterpreterProfile?.title ??
            latestPolicy?.objectiveText ??
            "No active interpreter profile or watch policy.",
          tone: activeInterpreterProfile ? "good" : latestPolicy ? "warn" : "blocked",
        },
        {
          label: "Watch",
          value: activeInterpreterProfile?.salienceCriteria.slice(0, 3).join(", ") || latestPolicy?.importanceCriteria.slice(0, 3).join(", ") || "criteria pending",
          tone: activeInterpreterProfile || latestPolicy ? "good" : "warn",
        },
        {
          label: "Suppress",
          value: activeInterpreterProfile?.suppressCriteria.slice(0, 2).join(", ") || latestPolicy?.suppressCriteria.slice(0, 2).join(", ") || "none",
        },
        {
          label: "Policy resolution",
          value: watchPolicyResolution.reason,
          tone: latestPolicy ? "good" : "blocked",
        },
        {
          label: "Mode",
          value: latestPolicy
            ? `${latestPolicy.interpretationMode ?? "latest_scene_answer"} / ${latestPolicy.mailProcessingMode ?? "latest_only"} / ${latestPolicy.outputCadence ?? "every_batch"}`
            : "no active watch policy",
          tone: latestPolicy ? "good" : "blocked",
        },
        {
          label: "Profile resolution",
          value: interpreterProfileResolution.reason,
          tone: activeInterpreterProfile ? "good" : "blocked",
        },
      ],
      edgeToNext: {
        label: latestProfileComparison ? "comparison" : activeInterpreterProfile ? "needs comparison" : "profile missing",
        tone: latestProfileComparison ? "connected" : activeInterpreterProfile ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: profileInputRefs,
      inputPreview: profileInputRefs.length > 0 ? profileInputRefs.join(", ") : "watch job / policy",
      transformLabel: `profile contract -> comparison lens; policy resolution: ${watchPolicyResolution.reason}`,
      outputLabel: "Output",
      outputRefs: activeInterpreterProfile ? [activeInterpreterProfile.profileId, ...activeInterpreterProfile.evidenceRefs] : [],
      outputPreview: activeInterpreterProfile
        ? [
            activeInterpreterProfile.title,
            "Active",
            `Domain: ${activeInterpreterProfile.domain}`,
            `Voice: ${activeInterpreterProfile.outputStyle.voiceStyle}`,
            `Suppressed: ${activeInterpreterProfile.suppressCriteria.slice(0, 2).join(", ") || "none"}`,
            `Watch: ${activeInterpreterProfile.salienceCriteria.slice(0, 3).join(", ") || "profile criteria"}`,
          ].join(" | ")
        : "Use watch policy only.",
      inspector: activeInterpreterProfile ? {
        kind: "interpreter_profile",
        title: activeInterpreterProfile.title,
        profileId: activeInterpreterProfile.profileId,
        linkedNoteId: activeInterpreterProfile.linkedNoteId,
        linkedNoteTitle: activeInterpreterProfile.linkedNoteTitle,
        body: [
          `Status: ${activeInterpreterProfile.status}`,
          `Domain: ${activeInterpreterProfile.domain}`,
          `Voice: ${activeInterpreterProfile.outputStyle.voiceStyle}`,
          `Guidelines: ${activeInterpreterProfile.interpretationGuidelines}`,
          `Salience: ${activeInterpreterProfile.salienceCriteria.join(", ") || "none"}`,
          `Suppress: ${activeInterpreterProfile.suppressCriteria.join(", ") || "none"}`,
          `Risk: ${activeInterpreterProfile.riskCriteria.join(", ") || "none"}`,
          `Opportunity: ${activeInterpreterProfile.opportunityCriteria.join(", ") || "none"}`,
        ].join("\n"),
      } : null,
    },
    {
      id: "observer_mail_loop:profile_comparison",
      title: "Interpreter Profile Comparator",
      subtitle: "profile lens over mail",
      status: latestProfileComparison?.recommendedDecision ?? "pending",
      preview: latestProfileComparison
        ? `Matched: ${latestProfileComparison.matchedCriteria.slice(0, 2).join(", ") || "none"}; Recommended: ${latestProfileComparison.recommendedDecision}`
        : activeInterpreterProfile
          ? "waiting for comparison receipt"
          : "no profile comparison",
      statusChips: latestProfileComparison
        ? [
            latestProfileComparison.matchedCriteria.length ? `${latestProfileComparison.matchedCriteria.length} matched` : "no matches",
            latestProfileComparison.suppressedCriteria.length ? `${latestProfileComparison.suppressedCriteria.length} suppressed` : null,
          ].filter((entry): entry is string => Boolean(entry))
        : ["evidence only"],
      payloadRows: [
        {
          label: "Prompt used",
          value: microPrompt("profile_comparator")
            ? `${microPrompt("profile_comparator")?.title} v${microPrompt("profile_comparator")?.version}`
            : "prompt missing",
          tone: microPrompt("profile_comparator") ? "good" : "blocked",
        },
        {
          label: "Observed",
          value: microRun("profile_comparator")?.inputPreview ||
            latestProfileComparison?.observedFacts.slice(0, 2).join("; ") ||
            visualMail?.summary.preview ||
            "No comparison input yet.",
          tone: latestProfileComparison ? "good" : visualMail ? "warn" : "blocked",
        },
        {
          label: "Latest output",
          value: microRun("profile_comparator")?.outputPreview ||
            latestProfileComparison?.matchedCriteria.join(", ") ||
            "none",
        },
        {
          label: "Model/tool",
          value: `${microRun("profile_comparator")?.modelUsed ?? microPrompt("profile_comparator")?.modelPreference ?? "not run"} | ${
            microRun("profile_comparator")?.latencyMs == null ? "pending" : `${microRun("profile_comparator")?.latencyMs}ms`
          } | ${latestProfileComparison?.recommendedDecision ?? "pending"}`,
          tone: latestProfileComparison ? "good" : "warn",
        },
      ],
      edgeToNext: {
        label: displayWake ? "wake queued" : visualMail ? "needs wake" : "mail missing",
        tone: displayWake ? "connected" : visualMail ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: comparisonInputRefs,
      inputPreview: comparisonInputRefs.length > 0 ? comparisonInputRefs.join(", ") : "mail + profile + narrative",
      transformLabel: "profile + mail + narrative -> comparison receipt",
      outputLabel: "Output",
      outputRefs: latestProfileComparison ? [latestProfileComparison.comparisonId, ...latestProfileComparison.evidenceRefs] : [],
      outputPreview: latestProfileComparison
        ? [
            `Matched: ${latestProfileComparison.matchedCriteria.join(", ") || "none"}.`,
            `Suppressed: ${latestProfileComparison.suppressedCriteria.join(", ") || "none"}.`,
            `Recommended: ${latestProfileComparison.recommendedDecision}.`,
          ].join(" ")
        : "No profile comparison receipt yet.",
    },
    makeMicroReasonerNode({
      role: "delta_extractor",
      run: microRun("delta_extractor"),
      prompt: microPrompt("delta_extractor"),
      packet: latestProcessedPacket,
      fallbackInputRefs: uniqueSorted([
        latestNarrativeState?.narrativeStateId ?? "",
        ...(visualMail ? [visualMail.mailId] : []),
      ].filter(Boolean)),
      fallbackInputPreview: latestNarrativeState?.runningStorySummary ?? visualMail?.summary.preview ?? "prior state + mail pending",
      fallbackOutputPreview: latestProcessedPacket?.changedFacts.join(" | ") ?? null,
      edgeLabel: microRun("prediction_validator") ? "prediction checked" : "needs prediction check",
      edgeTone: microRun("prediction_validator") ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "prediction_validator",
      run: microRun("prediction_validator"),
      prompt: microPrompt("prediction_validator"),
      packet: latestProcessedPacket,
      fallbackInputRefs: uniqueSorted([
        latestProcessedPacket?.priorPredictionRef ?? "",
        ...(latestProcessedPacket?.mailIds ?? []),
      ].filter(Boolean)),
      fallbackInputPreview: latestProcessedPacket?.priorPredictionRef ?? "prior prediction pending",
      fallbackOutputPreview: latestProcessedPacket?.predictionValidation
        ? `${latestProcessedPacket.predictionValidation.result}; new ${latestProcessedPacket.predictionValidation.newSignals.join(", ") || "none"}`
        : null,
      edgeLabel: microRun("salience_scorer") ? "salience scored" : "needs salience",
      edgeTone: microRun("salience_scorer") ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "salience_scorer",
      run: microRun("salience_scorer"),
      prompt: microPrompt("salience_scorer"),
      packet: latestProcessedPacket,
      fallbackInputRefs: latestProcessedPacket ? [
        ...latestProcessedPacket.changedFacts,
        ...latestProcessedPacket.riskMatches,
        ...latestProcessedPacket.voiceCalloutMatches,
      ] : [],
      fallbackInputPreview: latestProcessedPacket
        ? `changed ${latestProcessedPacket.changedFacts.length}; voice matches ${latestProcessedPacket.voiceCalloutMatches.length}`
        : "salience inputs pending",
      fallbackOutputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.salience.level}; voice ${latestProcessedPacket.salience.voiceCandidate ? "candidate" : "no"}; recommended ${latestProcessedPacket.recommendedNext}`
        : null,
      edgeLabel: microRun("decision_selector") ? "decision selected" : "needs decision",
      edgeTone: microRun("decision_selector") ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "decision_selector",
      run: microRun("decision_selector"),
      prompt: microPrompt("decision_selector"),
      packet: latestProcessedPacket,
      fallbackInputRefs: latestProcessedPacket ? [
        latestProcessedPacket.packetId,
        ...latestProcessedPacket.microReasonerRunRefs,
      ] : [],
      fallbackInputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.recommendedNext}; ${latestProcessedPacket.salience.level}`
        : "processed packet pending",
      fallbackOutputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.recommendedNext}; next ${latestProcessedPacket.recommendedNext === "wait_for_next_summary" ? "none" : "record decision"}`
        : null,
      edgeLabel: latestProcessedPacket?.recommendedNext === "request_voice_callout"
        ? microRun("voice_callout_drafter") ? "voice draft" : "needs voice draft"
        : microRun("packet_composer") ? "packet ready" : "needs packet",
      edgeTone: latestProcessedPacket?.recommendedNext === "request_voice_callout"
        ? microRun("voice_callout_drafter") ? "connected" : latestProcessedPacket ? "pending" : "blocked"
        : microRun("packet_composer") ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "voice_callout_drafter",
      run: microRun("voice_callout_drafter"),
      prompt: microPrompt("voice_callout_drafter"),
      packet: latestProcessedPacket,
      fallbackInputRefs: latestProcessedPacket ? [
        latestProcessedPacket.packetId,
        ...latestProcessedPacket.salience.reasons,
      ] : [],
      fallbackInputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.salience.level}; ${latestProcessedPacket.salience.reasons.slice(0, 2).join(" | ") || "no reason"}`
        : "voice candidate pending",
      fallbackOutputPreview: latestProcessedPacket?.salience.calloutDraft ?? null,
      edgeLabel: microRun("packet_composer") ? "packet ready" : "needs packet",
      edgeTone: microRun("packet_composer") ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    makeMicroReasonerNode({
      role: "packet_composer",
      run: microRun("packet_composer"),
      prompt: microPrompt("packet_composer"),
      packet: latestProcessedPacket,
      fallbackInputRefs: latestProcessedPacket?.microReasonerRunRefs ?? [],
      fallbackInputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.mailIds.length} mail; ${latestProcessedPacket.resolutionState}`
        : "processed packet pending",
      fallbackOutputPreview: latestProcessedPacket
        ? `${latestProcessedPacket.recommendedNext}; ${latestProcessedPacket.resolutionState}; ${latestProcessedPacket.observedFacts.slice(0, 2).join(" | ")}`
        : null,
      edgeLabel: displayWake ? "Ask wake" : "decision needed",
      edgeTone: displayWake ? "connected" : latestProcessedPacket ? "pending" : "blocked",
    }),
    {
      id: "observer_mail_loop:ask_wake",
      title: "Wake Ask",
      subtitle: "mail wake admission",
      status: latestWakeStatus ?? (unreadCount > 0 ? "queued pending" : "missing"),
      preview: manualCheckpointWithoutPolicy && unreadCount > 0
        ? `manual checkpoint completed; ${unreadCount} unread retained until a watch policy is configured`
        : pressureText
        ? pressureText
        : latestWakeStatus
          ? `${latestWakeStatus}${latestWakeFailureReason ? `: ${latestWakeFailureReason}` : ""}; ${latestWakeAskText}; ${unreadCount} unread retained${secondaryPressureText ? `; ${secondaryPressureText}` : ""}`
        : `${queuedRunningText}; waiting for mail`,
      statusChips: [
        manualCheckpointWithoutPolicy ? "policy missing" : null,
        wakeContinuationActive ? "continuation armed" : null,
        queuedWakeMailCount > 0 ? `${queuedWakeMailCount} queued mail` : null,
        runningWakeMailCount > 0 ? `${runningWakeMailCount} running mail` : null,
        wakePressureActive ? "wake pressure" : null,
        pressureWakeMailCount > 0 ? `${pressureWakeMailCount} retained mail` : null,
        retryWakeCount > 0 ? "retrying" : null,
      ].filter((entry): entry is string => Boolean(entry)),
      statusBand: wakePressureBand ?? wakeContinuationBand,
      payloadRows: [
        {
          label: "Tool",
          value: `live_env.read_live_source_mail${latestWakeAskTurnId ? ` -> ${latestWakeAskTurnId}` : ""}`,
          tone: latestWakeAskTurnId ? "good" : displayWake ? "warn" : "default",
        },
        {
          label: "Wake",
          value: manualCheckpointWithoutPolicy
            ? "watch policy missing; configure a standing job before automatic interpretation"
            : latestWakeStatus
            ? `${latestWakeStatus}${latestWakeFailureReason ? `; ${latestWakeFailureReason}` : ""}`
            : unreadCount > 0 ? "unread mail waiting" : "no wake request",
          tone: manualCheckpointWithoutPolicy ||
            latestWakeStatus === "failed_retryable" || latestWakeStatus === "failed_terminal"
            ? "blocked"
            : latestWakeStatus === "deferred_for_pressure" || unreadCount > 0 ? "warn" : latestWakeStatus ? "good" : "default",
        },
        {
          label: wakePressureActive ? "Pressure" : "Continuation",
          value: wakePressureActive
            ? `deferred; ${unreadCount} unread retained${pressureNextRetryAt ? `; next retry ${formatStagePlayClock(pressureNextRetryAt)}` : ""}`
            : `${continuationStateText}${continuationRetainedMailCount > 0 ? `; ${continuationRetainedMailCount} unread retained` : ""}`,
          tone: wakePressureActive ? "warn" : wakeContinuationActive ? "good" : "default",
        },
      ],
      edgeToNext: {
        label: manualCheckpointWithoutPolicy
          ? "policy missing"
          : latestDecision ? "decision" : latestWakeStatus === "deferred_for_pressure" ? "deferred" : displayWake ? "running/pending" : "wake missing",
        tone: manualCheckpointWithoutPolicy
          ? "blocked"
          : latestDecision ? "connected" : latestWakeStatus === "deferred_for_pressure" ? "pending" : latestWakeStatus === "failed_terminal" ? "blocked" : displayWake ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: wakeInputRefs,
      inputPreview: wakeInputRefs.length > 0 ? wakeInputRefs.join(", ") : "unread mail ids pending",
      transformLabel: "unread mail -> Helix Ask wake turn",
      outputLabel: "Output",
      outputRefs: displayWake ? uniqueSorted([
        displayWake.wakeRequestId,
        latestWakeResult?.wakeResultId ?? "",
        latestWakeAskTurnId ?? "",
        ...latestWakeDecisionIds,
        ...displayWake.evidenceRefs,
        ...(latestWakeResult?.evidenceRefs ?? []),
      ].filter(Boolean)) : [],
      outputPreview: latestWakeStatus
        ? manualCheckpointWithoutPolicy
          ? `manual checkpoint complete; ${unreadCount} unread retained; configure live_env.configure_live_source_watch_job for the continuing loop`
          : latestWakeStatus === "deferred_for_pressure"
          ? `deferred_for_pressure; ${runtimePressureReason ?? "runtime pressure"}; ${unreadCount} unread retained${pressureNextRetryAt ? `; next retry ${formatStagePlayClock(pressureNextRetryAt)}` : ""}; ${pressureContinuationText}`
          : `${latestWakeStatus}${latestWakeFailureReason ? `; ${latestWakeFailureReason}` : ""}${latestWakeAskTurnId ? `; ask ${latestWakeAskTurnId}` : ""}${latestWakeDecisionIds.length > 0 ? `; decisions ${latestWakeDecisionIds.length}` : ""}; continuation ${continuationStateText}; ${continuationRetainedMailCount || unreadCount} unread retained${secondaryPressureText ? `; ${secondaryPressureText}` : ""}`
        : unreadCount > 0
          ? "unread mail is waiting for wake admission"
          : "no wake request yet",
    },
    {
      id: "observer_mail_loop:ask_decision",
      title: "Decision",
      subtitle: "mail reader + model decision",
      status: latestDecision?.decision ?? (deliveredCount > 0 ? "delivered_to_ask" : "awaiting_mail_read"),
      preview: latestDecisionText,
      statusChips: [
        latestDecision?.modelReviewed ? "model reviewed" : null,
        latestDecision?.mailIds.length ? `${latestDecision.mailIds.length} mail` : null,
      ].filter((entry): entry is string => Boolean(entry)),
      payloadRows: [
        {
          label: "Decision",
          value: latestDecision?.decision ?? "No model decision yet.",
          tone: latestDecision ? "good" : "warn",
        },
        {
          label: "Reason",
          value: latestDecision?.rationalePreview || "Waiting for Ask to record a decision.",
        },
        {
          label: "Refs",
          value: latestDecision?.decisionId ?? "decision ref pending",
        },
      ],
      edgeToNext: {
        label: steeringRows.length > 0 ? "steering audit" : latestDecision ? "output state" : "decision missing",
        tone: latestDecision ? "connected" : "pending",
      },
      inputLabel: "Input",
      inputRefs: decisionInputRefs,
      inputPreview: decisionInputRefs.length > 0 ? decisionInputRefs.join(", ") : "mail item ids pending",
      transformLabel: "live_env.read_live_source_mail -> live_env.record_live_source_mail_decision",
      outputLabel: "Output",
      outputRefs: latestDecision ? [latestDecision.decisionId, ...latestDecision.evidenceRefs] : [],
      outputPreview: latestDecision?.decision ?? (unreadCount > 0 ? "awaiting Ask mail read" : "wait_for_next_summary"),
    },
    {
      id: "observer_mail_loop:steering",
      title: "Steering",
      subtitle: "voice steering timeline",
      status: steeringStatus,
      preview: steeringPreview,
      statusChips: [
        steeringRows.length > 0 ? `${steeringRows.length} row${steeringRows.length === 1 ? "" : "s"}` : "no rows",
        latestSteeringAck ? "ack receipt" : null,
      ].filter((entry): entry is string => Boolean(entry)),
      statusBand: steeringRows.length > 0
        ? {
            title: "Steering timeline",
            lines: [
              latestSteeringReceived ? `Heard: ${compactStagePlayText(latestSteeringReceived.body, "voice steering received", 82)}` : null,
              latestSteeringDecisionRow ? `Decision: ${stagePlaySteeringRowLabel(latestSteeringDecisionRow.rowKind)}` : "Decision: not recorded yet",
              latestSteeringAck ? `Ack: ${compactStagePlayText(latestSteeringAck.body, "receipt recorded", 82)}` : "Ack: no receipt yet",
            ].filter((line): line is string => Boolean(line)),
            tone: steeringTone === "good" ? "good" : steeringTone === "blocked" ? "blocked" : "pending",
          }
        : null,
      payloadRows: [
        {
          label: "Status",
          value: steeringStatusText,
          tone: steeringTone,
        },
        {
          label: "Target",
          value: steeringStatusRow?.source.artifactId ?? latestWakeAskTurnId ?? "No target turn evidence yet.",
          tone: steeringStatusRow ? "good" : "default",
        },
        {
          label: "Debug",
          value: steeringRows.length > 0
            ? "Transcript rows back voice_steering_debug; receipts remain evidence-only."
            : "Waiting for voice_steering_debug rows from live transcript.",
          tone: steeringRows.length > 0 ? "good" : "warn",
        },
      ],
      edgeToNext: {
        label: steeringRows.length > 0 ? "visible timeline" : "no steering",
        tone: steeringRows.length > 0 ? "connected" : latestDecision ? "pending" : "blocked",
      },
      inputLabel: "Input",
      inputRefs: steeringRows.flatMap((row) => row.evidenceRefs).slice(0, 8),
      inputPreview: latestSteeringReceived?.body
        ? compactStagePlayText(latestSteeringReceived.body, "voice steering received")
        : "voice steering transcript rows pending",
      transformLabel: "voice steering event/decision/ack -> console timeline",
      outputLabel: "Output",
      outputRefs: steeringEventRefs.slice(0, 12),
      outputPreview: steeringRows.length > 0
        ? steeringRows.slice(-3).map((row) => stagePlaySteeringRowLabel(row.rowKind)).join(" -> ")
        : "no steering timeline rows observed",
    },
    {
      id: "observer_mail_loop:output_wait",
      title: "Output / Wait",
      subtitle: "text answer / voice draft / wait",
      status: manualCheckpointWithoutPolicy
        ? "policy missing"
        : latestDecision?.nextLoopState ?? activeJob?.nextLoopState ?? "armed_for_next_summary",
      preview: outputPreview,
      statusChips: [
        latestDecision?.voicePolicy?.voiceEnabled ? "voice enabled" : "voice off",
        manualCheckpointWithoutPolicy ? "configure watch job" : activeJob?.status ? `job ${activeJob.status}` : null,
        wakeContinuationActive ? "armed" : null,
      ].filter((entry): entry is string => Boolean(entry)),
      statusBand: wakePressureBand ?? wakeContinuationBand,
      payloadRows: [
        {
          label: "Output",
          value: outputPreview,
          tone: latestDecision ? "good" : "default",
        },
        {
          label: "Watch next",
          value: manualCheckpointWithoutPolicy
            ? "A watch-next target was produced for this checkpoint, but no standing watch policy is armed for future mail."
            : latestNarrativeState?.watchNext?.reason ?? latestDecision?.nextLoopState ?? activeJob?.nextLoopState ?? "armed for next summary",
          tone: manualCheckpointWithoutPolicy ? "warn" : latestNarrativeState?.watchNext?.reason ? "good" : "default",
        },
        {
          label: "Loop",
          value: manualCheckpointWithoutPolicy
            ? "Missing inner loop: configure a live-source watch job so new mail re-enters Ask under a stored objective."
            : latestPolicy
              ? `Watch policy: ${latestPolicy.interpretationMode ?? "armed"}; mail ${latestPolicy.mailProcessingMode ?? "latest_only"}; cadence ${latestPolicy.outputCadence ?? "every_batch"}; continuation ${continuationStateText}`
              : "No watch policy.",
          tone: manualCheckpointWithoutPolicy ? "blocked" : latestPolicy ? "good" : "warn",
        },
        {
          label: "Retained",
          value: `${continuationRetainedMailCount || unreadCount} unread retained`,
          tone: continuationRetainedMailCount > 0 || unreadCount > 0 ? "warn" : "good",
        },
      ],
      edgeToNext: null,
      inputLabel: "Input",
      inputRefs: latestDecision ? [latestDecision.decisionId] : [],
      inputPreview: latestDecision?.decisionId ?? "decision id pending",
      transformLabel: "decision receipt -> output policy",
      outputLabel: "Output",
      outputRefs: uniqueSorted([
        latestDecision?.voiceCalloutDraft?.text ? "voice_callout_draft" : "",
        latestDecision?.textAnswerDraft?.text ? "text_answer_draft" : "",
        latestNarrativeState?.narrativeStateId ?? "",
        latestDecision?.requestedTool?.toolName ?? "",
      ].filter(Boolean)),
      outputPreview,
      blockedUntil: latestDecision?.voiceCalloutDraft?.requiresConfirmation
        ? "voice confirmation"
        : latestNarrativeState?.watchNext?.reason
          ? `watch next: ${latestNarrativeState.watchNext.reason}`
          : null,
    },
  ];
}

function StagePlayObserverMailLoopCanvas({
  graph,
  mailbox,
  transcript,
}: {
  graph: StagePlayBadgeGraphV1;
  mailbox: StagePlayLiveSourceMailListResponse | null | undefined;
  transcript: StagePlayLiveSourceMailTranscriptResponse | null | undefined;
}) {
  const nodes = useMemo(() => buildObserverMailLoopNodes({ graph, mailbox, transcript }), [graph, mailbox, transcript]);
  const [selectedInspectorNodeId, setSelectedInspectorNodeId] = useState<string | null>(null);
  const selectedInspectorNode =
    nodes.find((node) => node.id === selectedInspectorNodeId && node.inspector) ??
    nodes.find((node) => node.inspector) ??
    null;
  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto rounded-md border border-slate-800 bg-slate-950/95 p-6"
      data-testid="stage-play-badge-graph-scrollport"
      data-stage-play-graph-mode="observer_mail_loop_v1"
    >
      <div
        className="grid items-start gap-6"
        style={{
          minWidth: `${Math.max(13, nodes.length) * 244}px`,
          gridTemplateColumns: `repeat(${nodes.length}, 220px)`,
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            className="relative"
            data-testid="stage-play-observer-mail-loop-node"
            title={`Refs: ${uniqueSorted([...node.inputRefs, ...node.outputRefs]).join(", ") || "none"}`}
          >
            <button
              type="button"
              onClick={() => node.inspector ? setSelectedInspectorNodeId(node.id) : undefined}
              className={`flex min-h-[218px] w-full flex-col justify-between rounded-md border px-3 py-3 text-center shadow-[0_12px_30px_rgba(2,6,23,0.3)] ${
                node.inspector && selectedInspectorNode?.id === node.id
                  ? "border-cyan-400 bg-cyan-950/40"
                  : "border-slate-700 bg-slate-900/80"
              } ${node.inspector ? "cursor-pointer hover:border-cyan-500" : "cursor-default"}`}
              aria-label={node.inspector ? `Open ${node.title} inspector` : node.title}
            >
              <div>
                <span className="text-xs font-semibold text-slate-100">{node.title}</span>
                <span className="mt-1 block font-mono text-[10px] text-cyan-200">{labelize(node.status)}</span>
                <span className="mt-1 block text-[10px] text-slate-500">{node.subtitle}</span>
              </div>
              <div className="mt-2 line-clamp-2 text-[11px] text-slate-200">{node.preview}</div>
              {node.payloadRows?.length ? (
                <div className="mt-2 space-y-1 text-left" data-testid="stage-play-mail-loop-node-payload">
                  {node.payloadRows.slice(0, 4).map((row) => (
                    <div
                      key={`${node.id}:${row.label}`}
                      className={`rounded border px-2 py-1 ${
                        row.tone === "good"
                          ? "border-emerald-900 bg-emerald-950/25"
                          : row.tone === "warn"
                            ? "border-amber-900 bg-amber-950/25"
                            : row.tone === "blocked"
                              ? "border-rose-900 bg-rose-950/25"
                              : "border-slate-800 bg-slate-950/45"
                      }`}
                    >
                      <div className="font-mono text-[8px] uppercase tracking-wide text-slate-500">{row.label}</div>
                      <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-200">{row.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {node.statusBand ? (
                <div
                  className={`mt-2 rounded border px-2 py-1 text-left ${
                    node.statusBand.tone === "pressure"
                      ? "border-amber-700 bg-amber-950/35 text-amber-100"
                      : node.statusBand.tone === "blocked"
                        ? "border-rose-800 bg-rose-950/35 text-rose-100"
                        : node.statusBand.tone === "good"
                          ? "border-emerald-800 bg-emerald-950/25 text-emerald-100"
                          : "border-slate-700 bg-slate-950/60 text-slate-200"
                  }`}
                >
                  <div className="text-[8px] font-semibold uppercase tracking-wide">{node.statusBand.title}</div>
                  <div className="mt-0.5 space-y-0.5">
                    {node.statusBand.lines.slice(0, 6).map((line) => (
                      <div key={line} className="line-clamp-1 text-[9px] leading-tight">{line}</div>
                    ))}
                  </div>
                </div>
              ) : null}
              {node.statusChips?.length ? (
                <span className="mt-1 flex max-w-full flex-wrap justify-center gap-1">
                  {node.statusChips.slice(0, 2).map((chip) => (
                    <span key={chip} className="rounded border border-slate-700 bg-slate-950/70 px-1.5 py-0.5 text-[9px] text-slate-300">
                      {chip}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
            <details
              className="mt-2 rounded-md border border-slate-800 bg-black/25 p-2 text-[10px] text-slate-300"
              data-testid="stage-play-mail-loop-node-tray"
            >
              <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                Details
              </summary>
              <div className="mt-2 space-y-2 text-left">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{node.inputLabel}</div>
                  <div className="mt-0.5 line-clamp-2 font-mono text-[10px] text-sky-100">{node.inputPreview}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Transform</div>
                  <div className="mt-0.5 line-clamp-2 font-mono text-[10px] text-cyan-100">{node.transformLabel}</div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{node.outputLabel}</div>
                  <div className="mt-0.5 line-clamp-3 font-mono text-[10px] text-emerald-100">{node.outputPreview}</div>
                </div>
                {node.blockedUntil ? (
                  <div className="rounded border border-amber-800 bg-amber-950/25 px-2 py-1 text-amber-100">
                    Blocked until: <span className="font-mono">{node.blockedUntil}</span>
                  </div>
                ) : null}
              </div>
            </details>
          </div>
        ))}
      </div>
      <div
        className="mt-4 grid gap-6 font-mono text-[10px] text-slate-500"
        style={{
          minWidth: `${Math.max(13, nodes.length) * 244}px`,
          gridTemplateColumns: `repeat(${nodes.length}, 220px)`,
        }}
      >
        {nodes.map((node, index) => (
          <div key={`${node.id}:edge`} className="flex items-center justify-center">
            {index < nodes.length - 1 ? (
              <div
                className={`flex w-full items-center gap-2 ${
                  node.edgeToNext?.tone === "connected"
                    ? "text-emerald-200"
                    : node.edgeToNext?.tone === "pending"
                      ? "text-amber-200"
                      : "text-rose-200"
                }`}
                data-testid="stage-play-mail-loop-edge"
              >
                <span
                  className={`h-px flex-1 ${
                    node.edgeToNext?.tone === "connected"
                      ? "bg-emerald-500"
                      : node.edgeToNext?.tone === "pending"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                <span className="max-w-[126px] truncate rounded border border-current/40 px-1.5 py-0.5">
                  {node.edgeToNext?.label ?? "not connected"}
                </span>
                <span
                  className={`h-px flex-1 ${
                    node.edgeToNext?.tone === "connected"
                      ? "bg-emerald-500"
                      : node.edgeToNext?.tone === "pending"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
              </div>
            ) : <span>end</span>}
          </div>
        ))}
      </div>
      {selectedInspectorNode?.inspector ? (
        <div
          className="mt-5 max-w-3xl rounded-md border border-cyan-900 bg-slate-950/85 p-4 text-sm text-slate-200"
          data-testid="stage-play-interpreter-profile-inspector"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                {selectedInspectorNode.inspector.kind === "micro_reasoner_prompt"
                  ? "Prompt inspector"
                  : "Profile inspector"}
              </div>
              <div className="mt-1 text-base font-semibold text-slate-50">{selectedInspectorNode.inspector.title}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-400">
                {selectedInspectorNode.inspector.promptId ?? selectedInspectorNode.inspector.profileId}
              </div>
            </div>
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded border border-slate-800 bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">
            {selectedInspectorNode.inspector.body}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!selectedInspectorNode.inspector.linkedNoteId}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
              title={selectedInspectorNode.inspector.linkedNoteId ?? "No linked note yet"}
            >
              Open linked note
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 opacity-45"
              title={selectedInspectorNode.inspector.kind === "micro_reasoner_prompt"
                ? "Prompt edit/fork route is not exposed in this panel yet."
                : "Profile note compile route is not exposed in this panel yet."}
            >
              {selectedInspectorNode.inspector.kind === "micro_reasoner_prompt" ? "Edit / fork prompt" : "Compile from note"}
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 opacity-45"
              title={selectedInspectorNode.inspector.kind === "micro_reasoner_prompt"
                ? "Prompt test route is not exposed in this panel yet."
                : "Profile status route is not exposed in this panel yet."}
            >
              {selectedInspectorNode.inspector.kind === "micro_reasoner_prompt" ? "Test latest mail" : "Pause / archive"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StagePlayToolActivityStrip({
  graph,
  diff,
  projectionStatus,
  checkpointQueueStatus,
  onCheckpointQueueAction,
}: {
  graph: StagePlayBadgeGraphV1;
  diff: StagePlayGraphDiff | null;
  projectionStatus: StagePlayProjectionStatus | null;
  checkpointQueueStatus: StagePlayCheckpointQueueStatus;
  onCheckpointQueueAction: (action: StagePlayCheckpointQueueAction, requestId?: string | null) => void;
}) {
  const sourceFreshnessChanged = diff?.sourceWindowChanged === true;
  const missingCount = graph.summary.missingEvidenceCount;
  const latestPerturbations = (graph.perturbations ?? []).slice(0, 5);
  const latestCheckpointPerturbation = latestPerturbations.find((event) => event.checkpointSuggested);
  const visibleCheckpointRequest = selectStagePlayVisibleCheckpointRequest(graph);
  const summaryText = `Built Stage Play Badge Graph with ${graph.summary.badgeCount} badge(s), ${graph.summary.affordanceCount} affordance(s), and ${graph.summary.blockedAffordanceCount} blocked move(s).`;
  const skippedText = projectionStatus?.skippedLineKeys
    .map((key) => key === "recommendation" ? "recommendation requires model review" : key)
    .join(", ");
  const checkpointOnlyText = projectionStatus?.checkpointOnlySkipped
    .map((key) => key === "recommendation" ? "checkpoint recommendation" : labelize(key))
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
        {latestPerturbations.length > 0 ? (
          <span className={latestCheckpointPerturbation ? "font-mono text-[11px] text-amber-100" : "font-mono text-[11px] text-cyan-100"}>
            perturbations: {latestPerturbations.map((event) => `${labelize(event.reason)}:${event.materiality}`).join(" | ")}
          </span>
        ) : null}
        {latestCheckpointPerturbation ? (
          <span className="basis-full text-center text-[11px] text-amber-100">
            Checkpoint suggested after {labelize(latestCheckpointPerturbation.reason)}; affected {latestCheckpointPerturbation.affectedBadgeIds.length} badge(s).
          </span>
        ) : null}
        {visibleCheckpointRequest ? (
          <span className="basis-full flex flex-wrap items-center justify-center gap-2 text-[11px] text-cyan-100">
            <span className="font-mono">
              checkpoint queue: {labelize(visibleCheckpointRequest.reason)} / {visibleCheckpointRequest.status}
            </span>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("run", visibleCheckpointRequest.checkpointRequestId)}
              disabled={visibleCheckpointRequest.status !== "queued"}
              className="rounded border border-cyan-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100 hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="stage-play-run-checkpoint"
            >
              Run checkpoint
            </button>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("skip", visibleCheckpointRequest.checkpointRequestId)}
              className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-amber-500 hover:text-amber-100"
              data-testid="stage-play-skip-checkpoint"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("pause_job")}
              className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-amber-500 hover:text-amber-100"
              data-testid="stage-play-pause-checkpoint-job"
            >
              Pause job
            </button>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("resume_job")}
              className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-emerald-500 hover:text-emerald-100"
              data-testid="stage-play-resume-checkpoint-job"
            >
              Resume job
            </button>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("clear_queued")}
              className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-rose-500 hover:text-rose-100"
              data-testid="stage-play-clear-checkpoint-queue"
            >
              Clear queued checkpoints
            </button>
            <button
              type="button"
              onClick={() => onCheckpointQueueAction("end_live_job")}
              className="rounded border border-rose-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100 hover:border-rose-500"
              data-testid="stage-play-end-checkpoint-job"
            >
              End live job
            </button>
          </span>
        ) : null}
        {checkpointQueueStatus ? (
          <span className={checkpointQueueStatus.ok ? "basis-full text-center text-[11px] text-emerald-100" : "basis-full text-center text-[11px] text-amber-100"}>
            {checkpointQueueStatus.message}
          </span>
        ) : null}
        {projectionStatus ? (
          <span className="basis-full text-center font-mono text-[11px] text-emerald-100">
            Projected {projectionStatus.projectedLineKeys.length} interpretation lanes: {projectionStatus.projectedLineKeys.join(", ") || "none"}
            {projectionStatus.skippedLineKeys.length > 0 ? (
              <span className="text-amber-100"> | Skipped: {skippedText}</span>
            ) : null}
            {projectionStatus.checkpointOnlySkipped.length > 0 ? (
              <span className="text-amber-100"> | Checkpoint-only: {checkpointOnlyText}</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function buildStagePlayCheckpointAskQuestion(input: {
  request: StagePlayCheckpointRequest;
  graph: StagePlayBadgeGraphV1;
  environmentId?: string | null;
  roomId?: string | null;
}): string {
  const checkpointFocus = input.request.question
    .replace(/\bproduce\b/gi, "summarize")
    .replace(/\brequest(?:ed)?\b/gi, "asked about")
    .replace(/\bqueue(?:d)?|enqueue(?:d)?\b/gi, "tracked")
    .replace(/\brun\b/gi, "review")
    .replace(/\bstart\b/gi, "begin")
    .replace(/\bcreate|make\b/gi, "describe");
  const sourceRefs = [
    ...input.graph.sourceWindow.latestObservationRefs,
    ...input.graph.sourceWindow.latestSnapshotRefs,
    ...input.graph.sourceWindow.latestNavigationRefs,
  ].filter(Boolean).slice(0, 6);
  return [
    "Use the Stage Play reflection capability live_env.reflect_stage_play_context.",
    "Reflect the active Stage Play Badge Graph and project the current Live Interpretation.",
    `Stage Play checkpoint handle: ${input.request.checkpointRequestId}.`,
    `Stage Play graph handle: ${input.graph.graphId}.`,
    input.environmentId ? `Live Interpretation environment handle: ${input.environmentId}.` : "",
    input.roomId ? `Stage room handle: ${input.roomId}.` : "",
    sourceRefs.length > 0 ? `Stage Play evidence handles: ${sourceRefs.join(", ")}.` : "",
    `Checkpoint focus: ${checkpointFocus}`,
    "Report checkpoint freshness, missing evidence, and whether a current model-reviewed Answer Snapshot exists after the reflection.",
    "Leave visual/audio capture cadence unchanged.",
  ].filter(Boolean).join("\n");
}

function buildStagePlayMailWakeAskQuestion(input: {
  wake: StagePlayLiveSourceMailWakeRequestV1;
  mailItems?: StagePlayLiveSourceMailItemV1[];
}): string {
  const mailPreviews = (input.mailItems ?? [])
    .filter((item) => input.wake.mailIds.includes(item.mailId))
    .map((item) => `${item.mailId}: ${item.summary.preview}`)
    .slice(0, 3);
  return [
    "Use live_env.read_live_source_mail for the active Stage Play live-source mailbox.",
    "Read the latest unread source update, then record a model-reviewed decision with live_env.record_live_source_mail_decision.",
    "If there is no user-facing change, record wait_for_next_summary.",
    "If there is a meaningful user-facing change, draft a concise text answer.",
    "If voice is allowed and the update is urgent, request a voice callout.",
    `Wake request: ${input.wake.wakeRequestId}.`,
    input.wake.mailIds.length > 0 ? `Mail refs: ${input.wake.mailIds.join(", ")}.` : "",
    input.wake.sourceIds.length > 0 ? `Source refs: ${input.wake.sourceIds.join(", ")}.` : "",
    mailPreviews.length > 0 ? `Mail previews:\n${mailPreviews.join("\n")}` : "",
  ].filter(Boolean).join("\n");
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
  { kind: "perturbation", label: "Perturbation", role: "source-window change that may stale output" },
  { kind: "checkpoint_request", label: "Checkpoint Request", role: "queued bounded Ask checkpoint" },
  { kind: "helix_ask_checkpoint", label: "Helix Ask Checkpoint", role: "visible model reasoning boundary" },
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
    compact_observation: [["window", ""], ["fact_summary", ""], ["evidence_refs", ""]],
    stage_interpretation: [["bounds", ""], ["interpretation", ""], ["source_refs", ""]],
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
    ask_checkpoint: [["ask_turn_id", ""], ["solver_trace_ref", ""], ["model_reviewed", "false"]],
    helix_ask_checkpoint: [["ask_turn_id", ""], ["solver_trace_ref", ""], ["model_reviewed", "false"]],
    answer_snapshot: [["line_key", "answer_snapshot"], ["answer_text", ""], ["model_reviewed", "false"]],
    live_output: [["line_key", ""], ["state", "draft"], ["voice_eligible", "false"]],
    voice_output: [["line_key", ""], ["state", "draft"], ["voice_eligible", "false"]],
    recommended_check: [["check", ""], ["evidence_needed", ""], ["status", ""]],
    admission_gate: [["gate", ""], ["admission", ""], ["authority", "evidence_only"]],
    perturbation: [["reason", ""], ["materiality", ""], ["affected_badges", ""]],
    checkpoint_request: [["reason", ""], ["status", "queued"], ["question", ""]],
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

function StagePlayDataFlowSection({ badge }: { badge: StagePlayBadgeV1 }) {
  if (!hasStagePlayDataFlowTray(badge)) return null;
  const inputRefs = badge.dataTray?.inputRefs ?? [];
  const outputRefs = badge.dataTray?.outputRefs ?? [];
  const skipped = badge.dataTray?.skipped ?? [];
  const copyRefs = stagePlayDataFlowRefs(badge);
  const renderRefs = (refs: string[], empty: string) => refs.length > 0 ? (
    <div className="mt-1 space-y-1 font-mono text-[11px] text-slate-400">
      {refs.slice(0, 8).map((ref) => <div key={ref} className="break-all">{ref}</div>)}
      {refs.length > 8 ? <div className="text-slate-600">+{refs.length - 8} more ref(s)</div> : null}
    </div>
  ) : (
    <div className="mt-1 text-xs text-slate-500">{empty}</div>
  );

  return (
    <Section title="Data Flow">
      <div className="space-y-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold uppercase tracking-wide text-slate-500">Input</div>
            {badge.dataTray?.inputPreview ? (
              <div className="mt-1 rounded border border-slate-800 bg-black/20 p-2 text-slate-300">
                {badge.dataTray.inputPreview}
              </div>
            ) : null}
            {renderRefs(inputRefs, "No input refs recorded.")}
          </div>
          <CopyStagePlayRefsButton refs={copyRefs} label={`Copy data flow refs for ${badge.title}`} />
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wide text-slate-500">Transform</div>
          <div className="mt-1 rounded border border-cyan-900/70 bg-cyan-950/15 p-2 font-mono text-cyan-100">
            {badge.dataTray?.transformLabel ?? "No transform label recorded."}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wide text-slate-500">Output</div>
          {badge.dataTray?.outputPreview ? (
            <div className="mt-1 rounded border border-emerald-900/70 bg-emerald-950/15 p-2 text-emerald-100">
              {badge.dataTray.outputPreview}
            </div>
          ) : null}
          {renderRefs(outputRefs, "No output refs recorded.")}
        </div>
        {skipped.length > 0 ? (
          <div>
            <div className="font-semibold uppercase tracking-wide text-slate-500">Skipped</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {skipped.map((entry) => (
                <Badge key={entry} variant="outline" className="border-amber-800 text-amber-100">
                  {labelize(entry)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {badge.dataTray?.blockedUntil ? (
          <div className="rounded border border-amber-900/70 bg-amber-950/20 p-2 text-amber-100">
            Blocked until: <span className="font-mono">{badge.dataTray.blockedUntil}</span>
          </div>
        ) : null}
      </div>
    </Section>
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
        {hasStagePlayDataFlowTray(badge) ? (
          <div className="mt-2 rounded border border-slate-800 bg-black/25 p-2 text-[10px] leading-relaxed">
            <div className="font-semibold uppercase tracking-wide text-slate-400">Data flow</div>
            {badge.dataTray?.inputPreview || badge.dataTray?.inputRefs?.length ? (
              <div className="mt-1">
                <span className="text-slate-500">Input:</span>{" "}
                <span className="font-mono text-slate-200">{badge.dataTray.inputPreview ?? badge.dataTray.inputRefs?.slice(0, 2).join(", ")}</span>
              </div>
            ) : null}
            {badge.dataTray?.transformLabel ? (
              <div>
                <span className="text-slate-500">Transform:</span>{" "}
                <span className="font-mono text-cyan-100">{badge.dataTray.transformLabel}</span>
              </div>
            ) : null}
            {badge.dataTray?.outputPreview || badge.dataTray?.outputRefs?.length ? (
              <div>
                <span className="text-slate-500">Output:</span>{" "}
                <span className="font-mono text-emerald-100">{badge.dataTray.outputPreview ?? badge.dataTray.outputRefs?.slice(0, 2).join(", ")}</span>
              </div>
            ) : null}
            {badge.dataTray?.skipped?.length ? (
              <div>
                <span className="text-slate-500">Skipped:</span>{" "}
                <span className="font-mono text-amber-100">{badge.dataTray.skipped.join(", ")}</span>
              </div>
            ) : null}
            {badge.dataTray?.blockedUntil ? (
              <div>
                <span className="text-slate-500">Blocked:</span>{" "}
                <span className="font-mono text-amber-100">{badge.dataTray.blockedUntil}</span>
              </div>
            ) : null}
          </div>
        ) : null}
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
  const perturbedBadgeIds = new Set(
    (graph.perturbations ?? []).slice(0, 5).flatMap((event) => event.affectedBadgeIds),
  );
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
          const isUpdated = updatedBadgeIds.has(badge.id) ||
            perturbedBadgeIds.has(badge.id) ||
            (badge.kind === "observer" && graphDiff?.sourceWindowChanged === true);
          const tray = badgeTrayView(badge, observerSources);
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
                  <span className="truncate font-semibold uppercase tracking-wide">{tray.title}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="truncate font-mono text-[9px] text-slate-500">{tray.metric}</span>
                    <CopyStagePlayRefsButton refs={stagePlayDataFlowRefs(badge)} label={`Copy refs for ${badge.title}`} />
                  </span>
                </div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">
                  {tray.summary}
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
                    Project Interpretation
                  </button>
                ) : (
                  <div className="mt-1 truncate font-mono text-[9px] text-slate-600">{tray.detail}</div>
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
          const tray = syntheticNodeTrayView(node);
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
                  <span className="truncate font-semibold uppercase tracking-wide">{tray.title}</span>
                  <span className="shrink-0 truncate font-mono text-[9px] text-slate-500">{tray.metric}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">
                  {tray.summary}
                </div>
                {node.kind === "live_answer" ? (
                  <button
                    type="button"
                    onClick={onProjectLiveAnswer}
                    className="mt-1 h-5 w-full rounded border border-emerald-700 bg-emerald-950/80 px-2 text-[9px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                    data-testid="stage-play-project-live-answer-output"
                  >
                    Project Interpretation
                  </button>
                ) : (
                  <div className="mt-1 truncate font-mono text-[9px] text-slate-600">{tray.detail}</div>
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
  onCheckpointQueueAction,
  sourceAuditSelection,
  rawSessionBufferEntries,
  rawSessionBufferLoading,
  onOpenSourceAudit,
  onClearRawSessionBuffer,
  onClearSelectedBadge,
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
  onCheckpointQueueAction: (action: StagePlayCheckpointQueueAction, requestId?: string | null) => void;
  sourceAuditSelection: StagePlaySourceAuditSelection;
  rawSessionBufferEntries: StagePlayRawSessionBufferEntryV1[];
  rawSessionBufferLoading: boolean;
  onOpenSourceAudit: (source: StagePlayObserverSource, mode: StagePlaySourceAuditMode) => void;
  onClearRawSessionBuffer: (source: StagePlayObserverSource | null) => void;
  onClearSelectedBadge: () => void;
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
  const consoleTitle = selectedNodeConsoleTitle(selectedBadge);
  const consoleDescription = selectedNodeConsoleDescription(selectedBadge);

  return (
    <aside
      data-testid="stage-play-binding-overlay"
      className="absolute bottom-3 left-3 top-3 z-30 flex w-[340px] flex-col rounded-md border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Stage Console</div>
          <div className="mt-0.5 text-base font-semibold leading-tight">{consoleTitle}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
            {consoleDescription}
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

      {!selectedBadge ? (
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
      ) : (
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 p-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-100">{selectedBadge.title}</div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{selectedBadge.id}</div>
          </div>
          <button
            type="button"
            onClick={onClearSelectedBadge}
            className="shrink-0 rounded border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-cyan-500 hover:text-cyan-100"
          >
            Builder Palette
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {selectedBadge ? (
          <Inspector
            badge={selectedBadge}
            relatedEdges={relatedEdges}
            relatedBadges={relatedBadges}
            relatedActions={relatedActions}
            observerSources={graph.sourceWindow.sources}
            answerSnapshots={graph.badges.filter((entry) => entry.kind === "answer_snapshot")}
            onObserverDraftAction={onObserverDraftAction}
            sourceSetupCadenceMs={sourceSetupCadenceMs}
            sourceSetupStatus={sourceSetupStatus}
            onSetSourceSetupCadenceMs={onSetSourceSetupCadenceMs}
            onStartVisualSourceSetup={onStartVisualSourceSetup}
            onAttachAudioTranscriptSource={onAttachAudioTranscriptSource}
            onPauseVisualSourceSetup={onPauseVisualSourceSetup}
            onProjectLiveAnswer={onProjectLiveAnswer}
            onCheckpointQueueAction={onCheckpointQueueAction}
            sourceAuditSelection={sourceAuditSelection}
            rawSessionBufferEntries={rawSessionBufferEntries}
            rawSessionBufferLoading={rawSessionBufferLoading}
            onOpenSourceAudit={onOpenSourceAudit}
            onClearRawSessionBuffer={onClearRawSessionBuffer}
          />
        ) : (
          <>
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

          </>
        )}
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
  answerSnapshots,
  onObserverDraftAction,
  sourceSetupCadenceMs,
  sourceSetupStatus,
  onSetSourceSetupCadenceMs,
  onStartVisualSourceSetup,
  onAttachAudioTranscriptSource,
  onPauseVisualSourceSetup,
  onProjectLiveAnswer,
  onCheckpointQueueAction,
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
  answerSnapshots: StagePlayBadgeV1[];
  onObserverDraftAction: (source: StagePlayObserverSource | null, action: StagePlayObserverDraftAction) => void;
  sourceSetupCadenceMs: number;
  sourceSetupStatus: StagePlaySourceSetupStatus;
  onSetSourceSetupCadenceMs: (cadenceMs: number) => void;
  onStartVisualSourceSetup: (surface: StagePlayVisualCaptureSurface) => void;
  onAttachAudioTranscriptSource: (source: StagePlayAudioTranscriptSource) => void;
  onPauseVisualSourceSetup: () => void;
  onProjectLiveAnswer: () => void;
  onCheckpointQueueAction: (action: StagePlayCheckpointQueueAction, requestId?: string | null) => void;
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
  const matchingObserverSources = observerSources.filter((source) =>
    badge.evidenceRefs.some((ref) => source.evidenceRefs.includes(ref)) ||
    badge.sourceRefs.some((ref) => source.evidenceRefs.includes(ref.id) || ref.id === source.sourceId) ||
    badge.subjects.includes(source.sourceId)
  );
  const displayEvidenceRefs = uniqueSorted([
    ...badge.evidenceRefs,
    ...(badge.dataTray?.evidenceRefs ?? []),
    ...badge.sourceRefs.map((ref) => `${ref.kind}:${ref.id}`),
  ]);
  const isOutputNode = badge.kind === "answer_snapshot" || badge.kind === "live_output" || badge.kind === "voice_output";
  const citedAnswerSnapshot = badge.kind === "live_output" || badge.kind === "voice_output"
    ? findCitedModelReviewedAnswerSnapshot(badge, answerSnapshots)
    : null;
  const voiceBoundaryPassed = Boolean(
    citedAnswerSnapshot &&
    badge.output?.voiceEligible === true &&
    badge.output.state === "model_reviewed",
  );
  const checkpointRequestId = badge.sourceRefs.find((ref) => ref.kind === "stage_play_checkpoint_request")?.id ??
    badge.evidenceRefs.find((ref) => ref.startsWith("stage_play_checkpoint_request:")) ??
    null;
  const isSelectedSpecificNode = [
    "observer",
    "source",
    "compact_observation",
    "procedural_binding",
    "ask_checkpoint",
    "helix_ask_checkpoint",
    "checkpoint_request",
    "answer_snapshot",
    "live_output",
    "voice_output",
  ].includes(badge.kind) || badge.id === "interpreter.stage_play_reflection";
  const showGenericLiveBindings = !isSelectedSpecificNode && badge.liveBindings.length > 0;
  const showAffordanceSection = badge.kind === "affordance" || badge.kind === "blocked_affordance";
  const showIntentSection = badge.kind === "intent_module";
  const showMissingEvidenceSection = badge.kind === "missing_evidence" || badge.missingEvidence.length > 0;
  const showAdmissionSection = !isOutputNode && (Boolean(badge.admission) || relatedActions.length > 0);
  const showGenericSourceRefs = !isSelectedSpecificNode && badge.sourceRefs.length > 0;
  const showGenericRelatedBadges = !["compact_observation", "ask_checkpoint", "helix_ask_checkpoint", "checkpoint_request", "answer_snapshot", "live_output", "voice_output"].includes(badge.kind) &&
    (relatedEdges.length > 0 || relatedBadges.length > 0);

  return (
    <aside
      className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/75 p-4"
      data-testid={inspectorTestIdForBadge(badge)}
    >
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

        <StagePlayDataFlowSection badge={badge} />

        {badge.kind === "compact_observation" ? (
          <>
            <Section title="Evidence Refs">
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {displayEvidenceRefs.length > 0
                  ? displayEvidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                  : <span>No evidence refs recorded.</span>}
              </div>
            </Section>
            <Section title="Audit Links">
              <div className="space-y-2 text-xs">
                {badge.dataTray?.summary ? (
                  <div className="rounded border border-slate-800 bg-black/20 p-2 text-slate-300">
                    {badge.dataTray.summary}
                  </div>
                ) : null}
                {matchingObserverSources.length > 0 ? matchingObserverSources.map((source) => (
                  <div key={`${source.sourceId}:audit`} className="rounded border border-slate-800 bg-black/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-slate-100">{labelize(source.modality)}</span>
                      <Badge variant="outline" className={statusTone(source.status === "active" ? "observed" : source.status === "configured_missing" ? "missing_evidence" : source.status)}>
                        {labelize(source.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
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
                    </div>
                  </div>
                )) : (
                  <div className="rounded border border-slate-800 bg-black/20 p-2 text-slate-500">
                    No routed source matched this compact observation yet.
                  </div>
                )}
              </div>
            </Section>
          </>
        ) : null}

        {badge.kind === "procedural_binding" ? (
          <>
            <Section title="Expression">
              <div className="rounded border border-slate-800 bg-black/30 p-2 font-mono text-xs text-cyan-100">
                {expression || "No procedural expression for this badge."}
              </div>
            </Section>
            <Section title="Supporting Badges">
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
                ) : (
                  <span className="text-slate-500">No supporting badge edges recorded.</span>
                )}
              </div>
            </Section>
          </>
        ) : null}

        {badge.kind === "ask_checkpoint" || badge.kind === "helix_ask_checkpoint" ? (
          <>
            <Section title="Ask Prompt">
              <div className="space-y-2 text-xs">
                <div>Turn id: <span className="font-mono text-slate-200">{badge.checkpoint?.askTurnId ?? "none"}</span></div>
                <div className="rounded border border-slate-800 bg-black/20 p-2 text-slate-500">
                  Raw prompt text is not embedded in the Stage Play graph; use the Ask turn/debug refs for audit.
                </div>
              </div>
            </Section>
            <Section title="Tool Observation">
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {displayEvidenceRefs.length > 0
                  ? displayEvidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                  : <span>No tool observation refs recorded.</span>}
              </div>
            </Section>
            <Section title="Solver / Debug Status">
              <div className="space-y-2 text-xs">
                <div>Model reviewed: <span className="font-mono text-slate-200">{badge.checkpoint?.modelReviewed ? "yes" : "no"}</span></div>
                <div>Solver trace: <span className="font-mono text-slate-200">{badge.checkpoint?.solverTraceRef ?? "none"}</span></div>
                <div>Terminal artifact: <span className="font-mono text-slate-200">{badge.checkpoint?.terminalArtifactKind ?? "none"}</span></div>
                <div>Final answer source: <span className="font-mono text-slate-200">{badge.checkpoint?.finalAnswerSource ?? "none"}</span></div>
                <div className="flex flex-wrap gap-1">
                  {badge.reasonCodes.map((code) => (
                    <Badge key={code} variant="outline" className="border-slate-700 text-slate-300">{code}</Badge>
                  ))}
                </div>
              </div>
            </Section>
          </>
        ) : null}

        {badge.kind === "checkpoint_request" ? (
          <>
            <Section title="Checkpoint Request">
              <div className="space-y-2 text-xs">
                <div>Status: <span className="font-mono text-slate-200">{labelize(badge.status)}</span></div>
                <div>Request ref: <span className="font-mono text-slate-200">{checkpointRequestId ?? "missing"}</span></div>
                <div className="rounded border border-slate-800 bg-black/20 p-2 leading-relaxed text-slate-300">
                  {badge.dataTray?.summary ?? "Queued checkpoint request waits for a bounded visible Ask turn."}
                </div>
                <div className="flex flex-wrap gap-1">
                  {badge.reasonCodes.map((code) => (
                    <Badge key={code} variant="outline" className="border-slate-700 text-slate-300">{code}</Badge>
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Queue Controls">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("run", checkpointRequestId)}
                  className="rounded border border-cyan-800 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-100 hover:border-cyan-400"
                  data-testid="stage-play-run-checkpoint-inspector"
                >
                  Run checkpoint
                </button>
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("skip", checkpointRequestId)}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-amber-500 hover:text-amber-100"
                  data-testid="stage-play-skip-checkpoint-inspector"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("pause_job")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-amber-500 hover:text-amber-100"
                >
                  Pause job
                </button>
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("resume_job")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-emerald-500 hover:text-emerald-100"
                >
                  Resume job
                </button>
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("clear_queued")}
                  className="rounded border border-slate-700 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 hover:border-rose-500 hover:text-rose-100"
                >
                  Clear queued checkpoints
                </button>
                <button
                  type="button"
                  onClick={() => onCheckpointQueueAction("end_live_job")}
                  className="rounded border border-rose-900 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100 hover:border-rose-500"
                >
                  End live job
                </button>
              </div>
            </Section>
            <Section title="Checkpoint Evidence">
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {displayEvidenceRefs.length > 0
                  ? displayEvidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                  : <span>No checkpoint request refs recorded.</span>}
              </div>
            </Section>
          </>
        ) : null}

        {badge.kind === "answer_snapshot" ? (
          <>
            <Section title="Upheld Answer">
              <div className="rounded border border-slate-800 bg-black/30 p-2 text-sm leading-relaxed text-slate-100">
                {badge.output?.text ?? badge.dataTray?.summary ?? "No upheld answer text recorded."}
              </div>
            </Section>
            <Section title="Source Refs">
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {displayEvidenceRefs.length > 0
                  ? displayEvidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                  : <span>No answer source refs recorded.</span>}
              </div>
            </Section>
          </>
        ) : null}

        {badge.kind === "live_output" || badge.kind === "voice_output" ? (
          <>
            <Section title="Projection State">
              <div className="space-y-2 text-xs">
                <div>Line key: <span className="font-mono text-slate-200">{badge.output?.lineKey ?? "none"}</span></div>
                <div>State: <span className="font-mono text-slate-200">{badge.output?.state ?? "draft"}</span></div>
                <div>Voice eligible: <span className="font-mono text-slate-200">{badge.output?.voiceEligible ? "yes" : "no"}</span></div>
              </div>
            </Section>
            <Section title="Voice Boundary">
              <div className="space-y-2 text-xs">
                <div>
                  Answer snapshot citation:{" "}
                  <span className="font-mono text-slate-200">{citedAnswerSnapshot?.id ?? "missing"}</span>
                </div>
                {voiceBoundaryPassed ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded border border-emerald-700 bg-emerald-950/30 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                    data-testid="stage-play-speak-reviewed-answer"
                  >
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Speak reviewed answer
                  </button>
                ) : (
                  <div
                    className="rounded border border-amber-900/60 bg-amber-950/20 p-2 text-amber-100"
                    data-testid="stage-play-voice-boundary-locked"
                  >
                    Voice locked until this output cites a model-reviewed answer snapshot. Raw Stage Play projections and Observer refs cannot speak.
                  </div>
                )}
              </div>
            </Section>
            <Section title="Output Text">
              <div className="rounded border border-slate-800 bg-black/30 p-2 text-sm leading-relaxed text-slate-100">
                {badge.output?.text ?? badge.dataTray?.summary ?? "No output text projected yet."}
              </div>
            </Section>
            <Section title="Source Refs">
              <div className="space-y-1 font-mono text-xs text-slate-400">
                {displayEvidenceRefs.length > 0
                  ? displayEvidenceRefs.map((ref) => <div key={ref}>{ref}</div>)
                  : <span>No output source refs recorded.</span>}
              </div>
            </Section>
          </>
        ) : null}

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
                  Project Interpretation
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
                Routing controls persist source custody overrides. Capture and audit controls remain local setup requests until source capability or evidence refs exist.
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
          <Section title="Live Interpretation Projection">
            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                Project current Stage Play evidence lanes into Live Interpretation. This is deterministic observation projection, not answer snapshot authority.
              </p>
              <button
                type="button"
                onClick={onProjectLiveAnswer}
                className="w-full rounded border border-emerald-700 bg-emerald-950/25 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 hover:border-emerald-400"
                data-testid="stage-play-project-live-answer-inspector"
              >
                Project Interpretation
              </button>
            </div>
          </Section>
        ) : null}

        {showGenericLiveBindings ? (
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
        ) : null}

        {showAffordanceSection ? (
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
        ) : null}

        {showIntentSection ? (
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
        ) : null}

        {!isSelectedSpecificNode && badge.kind !== "procedural_binding" ? (
        <Section title="Procedural Binding">
          <div className="rounded border border-slate-800 bg-black/30 p-2 font-mono text-xs text-cyan-100">
            {expression || "No procedural expression for this badge."}
          </div>
        </Section>
        ) : null}

        {showMissingEvidenceSection ? (
        <Section title="Missing Evidence">
          {badge.missingEvidence.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-xs text-amber-100">
              {badge.missingEvidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <span className="text-slate-500">No missing evidence recorded.</span>
          )}
        </Section>
        ) : null}

        {showAdmissionSection ? (
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
        ) : null}

        {showGenericSourceRefs ? (
        <Section title="Source Refs">
          <div className="space-y-1 font-mono text-xs text-slate-400">
            {badge.sourceRefs.length > 0 ? badge.sourceRefs.map((ref) => (
              <div key={`${ref.kind}:${ref.id}`}>{ref.kind}: {ref.id}</div>
            )) : <span>No source refs.</span>}
          </div>
        </Section>
        ) : null}

        {showGenericRelatedBadges ? (
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
        ) : null}
      </div>
    </aside>
  );
}

export default function StagePlayBadgeGraphPanel() {
  const queryClient = useQueryClient();
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
  const [checkpointQueueStatus, setCheckpointQueueStatus] = useState<StagePlayCheckpointQueueStatus>(null);
  const [sourceAuditSelection, setSourceAuditSelection] = useState<StagePlaySourceAuditSelection>(null);
  const [graphDiff, setGraphDiff] = useState<StagePlayGraphDiff | null>(null);
  const [removedBadgeGhosts, setRemovedBadgeGhosts] = useState<StagePlayRemovedBadgeGhost[]>([]);
  const [graphDisplayMode, setGraphDisplayMode] = useState<StagePlayGraphDisplayMode>("observer_mail_loop_v1");
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
  const mailboxQuery = useQuery<StagePlayLiveSourceMailListResponse>({
    queryKey: STAGE_PLAY_MAILBOX_QUERY_KEY,
    queryFn: () => fetchStagePlayLiveSourceMail({
      threadId: STAGE_PLAY_PANEL_THREAD_ID,
      mailboxThreadId: STAGE_PLAY_PANEL_THREAD_ID,
    }),
    refetchInterval: graphDisplayMode === "observer_mail_loop_v1" ? 1000 : false,
  });
  const mailbox = mailboxQuery.data ?? null;
  const transcriptQuery = useQuery<StagePlayLiveSourceMailTranscriptResponse>({
    queryKey: STAGE_PLAY_TRANSCRIPT_QUERY_KEY,
    queryFn: () => fetchStagePlayLiveSourceMailTranscript({
      threadId: STAGE_PLAY_PANEL_THREAD_ID,
      mailboxThreadId: STAGE_PLAY_PANEL_THREAD_ID,
    }),
    refetchInterval: graphDisplayMode === "observer_mail_loop_v1" ? 1000 : false,
  });
  const transcript = transcriptQuery.data ?? null;
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
    if (graphDisplayMode !== "observer_mail_loop_v1") return;
    void queryClient.invalidateQueries({ queryKey: STAGE_PLAY_MAILBOX_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: STAGE_PLAY_TRANSCRIPT_QUERY_KEY });
    void mailboxQuery.refetch();
    void transcriptQuery.refetch();
  }, [graphDisplayMode, mailboxQuery.refetch, queryClient, transcriptQuery.refetch]);

  useEffect(() => {
    const handleMailboxRefresh = (event: Event) => {
      const detail = (event as CustomEvent<StagePlayLiveSourceMailRefreshEventDetail>).detail;
      const mailboxThreadId = detail?.mailboxThreadId ?? detail?.threadId ?? STAGE_PLAY_PANEL_THREAD_ID;
      if (mailboxThreadId && mailboxThreadId !== STAGE_PLAY_PANEL_THREAD_ID) return;
      void queryClient.invalidateQueries({ queryKey: STAGE_PLAY_MAILBOX_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: STAGE_PLAY_TRANSCRIPT_QUERY_KEY });
      void mailboxQuery.refetch();
      void transcriptQuery.refetch();
    };
    window.addEventListener(STAGE_PLAY_LIVE_SOURCE_MAIL_REFRESH_EVENT, handleMailboxRefresh);
    return () => {
      window.removeEventListener(STAGE_PLAY_LIVE_SOURCE_MAIL_REFRESH_EVENT, handleMailboxRefresh);
    };
  }, [mailboxQuery.refetch, queryClient, transcriptQuery.refetch]);

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
      setBindingOverlayOpen(true);
    } else if (badge?.kind) {
      setActiveFilterKind(badge.kind);
      setBindingOverlayOpen(true);
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
    if (source && routeTargetForObserverAction(source, action)) {
      void persistObserverSourceRoute(source, action);
      return;
    }
    addObserverDraftAction(source, action);
  }

  async function handleProjectLiveAnswer() {
    setSourceSetupStatus({
      level: "working",
      message: "Projecting Stage Play evidence lanes into Live Interpretation...",
    });
    try {
      const result = await projectStagePlayLiveAnswer({
        threadId,
        roomId,
        environmentId,
        objective: activeEnvironment?.objective ?? graph?.description ?? graph?.title ?? "Project Stage Play graph into Live Interpretation.",
      });
      const message = result.reason === "projected"
        ? `Projected ${result.projectedLineKeys.length} Live Interpretation lane(s).`
        : result.reason === "no_line_changes"
          ? "Stage Play projection ran; no Live Interpretation lanes changed."
          : `${labelize(result.reason)}: ${result.skippedLineKeys.slice(0, 4).join(", ")}`;
      setProjectionStatus({
        projectedLineKeys: result.projectedLineKeys,
        skippedLineKeys: result.skippedLineKeys,
        checkpointOnlySkipped: result.checkpointOnlySkipped ?? [],
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
        checkpointOnlySkipped: [],
        reason: "request_failed",
        updatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "stage_play_live_answer_projection_failed",
      });
    }
  }

  async function handleCheckpointQueueAction(action: StagePlayCheckpointQueueAction, requestId?: string | null) {
    const request = requestId
      ? graph?.checkpointRequests?.find((entry) => entry.checkpointRequestId === requestId) ?? null
      : selectStagePlayVisibleCheckpointRequest(graph);
    const jobId = request?.jobId ?? graph?.checkpointRequests?.[0]?.jobId ?? null;
    if (!jobId) {
      setCheckpointQueueStatus({
        action,
        reason: "no_request",
        message: "No checkpoint request queue is active for this graph yet.",
        updatedAt: new Date().toISOString(),
        ok: false,
      });
      return;
    }
    setCheckpointQueueStatus({
      action,
      reason: "working",
      message: `${labelize(action)} checkpoint queue...`,
      updatedAt: new Date().toISOString(),
      ok: true,
    });
    try {
      const result = await postJson("/api/helix/stage-play/checkpoint-queue/action", {
        jobId,
        action,
        checkpointRequestId: requestId ?? request?.checkpointRequestId ?? null,
      });
      const resultRequest =
        result.request && typeof result.request === "object" && !Array.isArray(result.request)
          ? (result.request as StagePlayCheckpointRequest)
          : request;
      const launchedAskCheckpoint = action === "run" && Boolean(result.ok && resultRequest && graph);
      if (launchedAskCheckpoint && resultRequest && graph) {
        launchHelixAskPrompt({
          question: buildStagePlayCheckpointAskQuestion({
            request: resultRequest,
            graph,
            environmentId,
            roomId,
          }),
          autoSubmit: true,
          panelId: "stage-play-badge-graph",
          forceReasoningDispatch: true,
          suppressWorkstationPayloadActions: true,
        });
      }
      setCheckpointQueueStatus({
        action,
        reason: String(result.reason ?? "updated"),
        message: launchedAskCheckpoint
          ? "Run checkpoint: visible Helix Ask checkpoint turn launched."
          : `${labelize(action)}: ${labelize(String(result.reason ?? "updated"))}`,
        updatedAt: new Date().toISOString(),
        ok: Boolean(result.ok),
      });
      await graphQuery.refetch();
    } catch (error) {
      setCheckpointQueueStatus({
        action,
        reason: "request_failed",
        message: error instanceof Error ? error.message : "stage_play_checkpoint_queue_action_failed",
        updatedAt: new Date().toISOString(),
        ok: false,
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
        {graphDisplayMode === "full_graph" && !bindingOverlayOpen ? (
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

        <div className="absolute right-3 top-3 z-30 flex rounded-md border border-slate-800 bg-slate-950/90 p-1 text-[10px] font-semibold uppercase tracking-wide shadow-xl">
          <button
            type="button"
            onClick={() => {
              setGraphDisplayMode("observer_mail_loop_v1");
              setBindingOverlayOpen(false);
            }}
            className={`rounded px-2.5 py-1.5 ${
              graphDisplayMode === "observer_mail_loop_v1"
                ? "bg-cyan-950 text-cyan-100"
                : "text-slate-400 hover:text-slate-100"
            }`}
            aria-label="Show observer mail loop"
            data-testid="stage-play-observer-mail-loop-toggle"
          >
            Processed Mail Loop
          </button>
          <button
            type="button"
            onClick={() => setGraphDisplayMode("full_graph")}
            className={`rounded px-2.5 py-1.5 ${
              graphDisplayMode === "full_graph"
                ? "bg-cyan-950 text-cyan-100"
                : "text-slate-400 hover:text-slate-100"
            }`}
            aria-label="Show full Stage Play graph"
            data-testid="stage-play-full-graph-toggle"
          >
            Full Graph
          </button>
        </div>

        {graphDisplayMode === "full_graph" && bindingOverlayOpen ? (
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
            onCheckpointQueueAction={handleCheckpointQueueAction}
            sourceAuditSelection={sourceAuditSelection}
            rawSessionBufferEntries={rawSessionBufferQuery.data?.entries ?? []}
            rawSessionBufferLoading={rawSessionBufferQuery.isLoading}
            onOpenSourceAudit={openSourceAudit}
            onClearRawSessionBuffer={clearRawSessionBuffer}
            onClearSelectedBadge={() => {
              setSelectedBadgeId(null);
              setSelectedBadgeIds([]);
              setActiveFilterKind(null);
            }}
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

        {graphDisplayMode === "full_graph" ? (
          <StagePlayToolActivityStrip
            graph={graph}
            diff={graphDiff}
            projectionStatus={projectionStatus}
            checkpointQueueStatus={checkpointQueueStatus}
            onCheckpointQueueAction={handleCheckpointQueueAction}
          />
        ) : null}

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

        <main className="flex h-full min-h-0 flex-col">
          {graphDisplayMode === "observer_mail_loop_v1" ? (
            <StagePlayObserverMailLoopCanvas
              graph={graph}
              mailbox={mailbox}
              transcript={transcript}
            />
          ) : (
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
          )}
        </main>
      </div>
    </div>
  );
}
