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
import type { HelixVisualFrameEvidence } from "@shared/helix-visual-frame-evidence";
import { getLatestEnvironmentStateSnapshot } from "../situation-room/environment-state-snapshot-window";
import { resolveStagePlaySourceWindow } from "../situation-room/stage-play-source-window";
import { listVisualFrameEvidence } from "../situation-room/visual-snapshot-store";
import { getLatestStagePlayAskCheckpointReceipt } from "./stage-play-ask-checkpoint-store";
import {
  evaluateStagePlayCheckpointFreshness,
  type StagePlayCheckpointFreshnessV1,
} from "./stage-play-checkpoint-freshness";
import {
  listStagePlayPerturbationEvents,
  recordStagePlayPerturbationFromGraph,
} from "./stage-play-perturbation-event-store";
import type { StagePlayPerturbationEventV1 } from "@shared/contracts/stage-play-perturbation-event.v1";
import {
  completeStagePlayCheckpointRequestForGraph,
  listStagePlayCheckpointRequests,
  recordStagePlayCheckpointRequestFromPerturbation,
} from "./stage-play-checkpoint-queue";
import type { StagePlayCheckpointRequestV1 } from "@shared/contracts/stage-play-checkpoint-request.v1";
import {
  listStagePlayActiveMicroReasonerPromptsForSource,
  listStagePlayMicroReasonerRuns,
  listStagePlayProcessedMailPackets,
} from "./stage-play-processed-mail-packet-store";
import {
  listStagePlayAgentGoalSessions,
  listStagePlayGoalContextUpdates,
} from "./stage-play-goal-context-store";
import type {
  AgentGoalSessionV1,
  WorkstationGoalContextUpdateV1,
} from "@shared/contracts/workstation-goal-context.v1";

export type BuildStagePlayGraphFromWorldInput = {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  objective?: string | null;
  now?: Date;
  askCheckpointReceipt?: StagePlayAskCheckpointReceiptV1 | null;
  readOnly?: boolean;
};

export type StagePlayAskCheckpointReceiptV1 = {
  askTurnId?: string | null;
  solverTraceRef?: string | null;
  terminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
  graphId?: string | null;
  checkpointRequestId?: string | null;
  createdAt?: string | null;
  sourceWindowRefs?: string[];
  sourceArtifactRefs?: string[];
  completedSolverPath: boolean;
  answerText?: string | null;
  evidenceRefs?: string[];
  voicePolicy?: {
    voiceEligible?: boolean;
    evidenceRefs?: string[];
    reasonCodes?: string[];
  } | null;
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

const compactPreview = (value: string | null | undefined, fallback: string, max = 150): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim() || fallback;
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
};

const refsMatching = (refs: string[], pattern: RegExp): string[] =>
  refs.filter((ref) => pattern.test(ref));

const latestVisualEvidenceForGraph = (input: {
  threadId: string;
  sourceIds?: string[];
}): HelixVisualFrameEvidence | null => {
  const sourceIds = new Set(input.sourceIds ?? []);
  const entries = listVisualFrameEvidence({ threadId: input.threadId, limit: 24 })
    .filter((entry) => sourceIds.size === 0 || sourceIds.has(entry.source_id));
  return entries.at(-1) ?? null;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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
  dataTray?: StagePlayBadgeV1["dataTray"];
  checkpoint?: StagePlayBadgeV1["checkpoint"];
  output?: StagePlayBadgeV1["output"];
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
  dataTray: input.dataTray,
  checkpoint: input.checkpoint,
  output: input.output,
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

const perturbationTitle = (reason: StagePlayPerturbationEventV1["reason"]): string =>
  reason.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const perturbationBadgeId = (event: StagePlayPerturbationEventV1): string =>
  `perturbation.${event.perturbationId.split(":").pop() ?? hashShort(event.perturbationId, 10)}`;

const addPerturbationBadges = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  perturbations: StagePlayPerturbationEventV1[],
): void => {
  const existingBadgeIds = new Set(badges.map((entry) => entry.id));
  for (const event of perturbations.filter((entry) => entry.materiality !== "minor").slice(0, 6)) {
    const badgeId = perturbationBadgeId(event);
    const affectedBadgeIds = event.affectedBadgeIds.filter((badgeId) => existingBadgeIds.has(badgeId));
    pushBadge(badges, badge({
      id: badgeId,
      title: perturbationTitle(event.reason),
      plainMeaning: "A material source-window change has perturbed the current Stage Play interpretation.",
      whyItMatters: "Perturbations show why a prior interpretation or answer snapshot may need a fresh checkpoint instead of being treated as current.",
      kind: "perturbation",
      status: event.materiality === "critical" ? "blocked" : "candidate",
      subjects: affectedBadgeIds,
      tags: ["perturbation", event.reason, event.materiality, event.checkpointSuggested ? "checkpoint_suggested" : "pulse_only"],
      sourceRefs: [{ kind: "stage_play_perturbation_event", id: event.perturbationId }],
      evidenceRefs: unique([event.perturbationId, ...event.evidenceRefs]),
      confidence: event.materiality === "critical" ? 0.86 : 0.74,
      missingEvidence: event.checkpointSuggested
        ? ["A fresh Helix Ask checkpoint is suggested before treating output as current."]
        : [],
      reasonCodes: [
        "stage_play_perturbation_event",
        `perturbation_${event.reason}`,
        `materiality_${event.materiality}`,
      ],
      dataTray: {
        title: "Perturbation",
        summary: `${perturbationTitle(event.reason)} changed ${affectedBadgeIds.length} badge(s); checkpoint ${event.checkpointSuggested ? "suggested" : "not requested"}.`,
        updatedAt: event.createdAt,
        freshness: "fresh",
        confidence: event.materiality === "critical" ? 0.86 : 0.74,
        evidenceRefs: unique([event.perturbationId, ...event.evidenceRefs]),
      },
      admission: "auto",
    }));
    for (const affectedBadgeId of affectedBadgeIds.slice(0, 12)) {
      pushEdge(edges, {
        from: badgeId,
        to: affectedBadgeId,
        relation: "needs_check",
        label: "perturbs",
        evidenceRefs: [event.perturbationId],
        reasonCodes: [`perturbation_${event.reason}`],
      });
    }
    for (const answerSnapshotId of event.staleAnswerSnapshotIds.filter((badgeId) => existingBadgeIds.has(badgeId))) {
      pushEdge(edges, {
        from: badgeId,
        to: answerSnapshotId,
        relation: "supersedes",
        label: "supersedes answer snapshot",
        evidenceRefs: [event.perturbationId],
        reasonCodes: ["answer_snapshot_requires_recheck"],
      });
    }
    existingBadgeIds.add(badgeId);
  }
};

const addLatestPerturbationNode = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  perturbations: StagePlayPerturbationEventV1[],
): string | null => {
  const latest = [...perturbations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  if (!latest) return null;
  const evidenceRefs = unique([latest.perturbationId, ...latest.evidenceRefs]);
  const badgeId = pushBadge(badges, badge({
    id: "perturbation.latest",
    title: "latest perturbation",
    plainMeaning: "Stable node for the latest source-window perturbation affecting this Stage Play job.",
    whyItMatters: "Frame-level changes stream through this node; only meaningful perturbations are promoted into separate perturbation badges.",
    kind: "perturbation",
    status: latest.materiality === "critical" ? "blocked" : latest.checkpointSuggested ? "candidate" : "observed",
    subjects: latest.affectedBadgeIds,
    tags: ["pipeline", "perturbation", "latest", latest.reason, latest.materiality],
    sourceRefs: [{ kind: "stage_play_perturbation_event", id: latest.perturbationId }],
    evidenceRefs,
    confidence: latest.materiality === "critical" ? 0.86 : latest.materiality === "meaningful" ? 0.74 : 0.58,
    missingEvidence: latest.checkpointSuggested
      ? ["A bounded Helix Ask checkpoint is suggested before treating answer output as current."]
      : [],
    reasonCodes: [
      "stage_play_latest_perturbation",
      `perturbation_${latest.reason}`,
      `materiality_${latest.materiality}`,
    ],
    dataTray: {
      title: "Latest perturbation",
      summary: `${perturbationTitle(latest.reason)} (${latest.materiality}); checkpoint ${latest.checkpointSuggested ? "suggested" : "not requested"}.`,
      updatedAt: latest.createdAt,
      freshness: "fresh",
      confidence: latest.materiality === "minor" ? 0.58 : 0.74,
      evidenceRefs,
    },
    admission: "auto",
  }));
  for (const affectedBadgeId of latest.affectedBadgeIds.slice(0, 10)) {
    if (!badges.some((entry) => entry.id === affectedBadgeId)) continue;
    pushEdge(edges, {
      from: badgeId,
      to: affectedBadgeId,
      relation: "needs_check",
      label: "latest perturbation affects node",
      evidenceRefs: [latest.perturbationId],
      reasonCodes: ["latest_perturbation_affects_badge"],
    });
  }
  if (badges.some((entry) => entry.id === "possibilities.current")) {
    pushEdge(edges, {
      from: badgeId,
      to: "possibilities.current",
      relation: "feeds",
      label: "latest perturbation updates current possibilities",
      evidenceRefs: [latest.perturbationId],
      reasonCodes: ["latest_perturbation_updates_possibilities"],
    });
  }
  return badgeId;
};

const checkpointRequestTitle = (reason: StagePlayCheckpointRequestV1["reason"]): string =>
  reason.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const checkpointRequestBadgeId = (request: StagePlayCheckpointRequestV1): string =>
  `checkpoint_request.${request.checkpointRequestId.split(":").pop() ?? hashShort(request.checkpointRequestId, 10)}`;

const checkpointRequestMatchesGraph = (
  request: StagePlayCheckpointRequestV1,
  graphId: string,
): boolean =>
  request.graphId === graphId || request.currentGraphRefs.includes(graphId);

const checkpointRequestGraphPriority = (
  request: StagePlayCheckpointRequestV1,
  graphId: string,
): number => {
  const currentGraph = checkpointRequestMatchesGraph(request, graphId);
  if (currentGraph && request.status === "running") return 0;
  if (currentGraph && request.reason === "user_requested_checkpoint") return 1;
  if (currentGraph && request.status === "queued") return 2;
  if (request.status === "running") return 3;
  if (request.reason === "user_requested_checkpoint") return 4;
  if (request.status === "queued") return 5;
  return 6;
};

const prioritizeCheckpointRequestsForGraph = (
  checkpointRequests: StagePlayCheckpointRequestV1[],
  graphId: string,
): StagePlayCheckpointRequestV1[] =>
  checkpointRequests
    .map((request, index) => ({ request, index }))
    .sort((left, right) => {
      const priorityDelta =
        checkpointRequestGraphPriority(left.request, graphId) -
        checkpointRequestGraphPriority(right.request, graphId);
      if (priorityDelta !== 0) return priorityDelta;
      return right.index - left.index;
    })
    .map((entry) => entry.request);

const addCheckpointRequestBadges = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  checkpointRequests: StagePlayCheckpointRequestV1[],
  perturbations: StagePlayPerturbationEventV1[],
): void => {
  const existingBadgeIds = new Set(badges.map((entry) => entry.id));
  const perturbationBadgeIdsByRef = new Map(perturbations.map((event) => [event.perturbationId, perturbationBadgeId(event)]));
  for (const [index, request] of checkpointRequests
    .filter((entry) => entry.status === "queued" || entry.status === "running" || entry.status === "blocked")
    .slice(0, 6)
    .entries()) {
    const badgeId = index === 0 && (request.status === "queued" || request.status === "running")
      ? "checkpoint_request.queued"
      : checkpointRequestBadgeId(request);
    const status = request.status === "running"
      ? "observed"
      : request.status === "blocked"
        ? "blocked"
        : "ask_user_required";
    pushBadge(badges, badge({
      id: badgeId,
      title: `Checkpoint Request: ${checkpointRequestTitle(request.reason)}`,
      plainMeaning: "A bounded Helix Ask checkpoint has been requested for the current Stage Play job.",
      whyItMatters: "Checkpoint requests bridge continuous observation into visible Ask turns without creating a hidden reasoning loop.",
      kind: "checkpoint_request",
      status,
      subjects: [request.jobId, request.graphId],
      tags: [
        "checkpoint_request",
        request.reason,
        request.status,
        request.checkpointPolicy.autoRunEligible ? "auto_run_eligible" : "manual_run_first",
      ],
      sourceRefs: [{ kind: "stage_play_checkpoint_request", id: request.checkpointRequestId }],
      evidenceRefs: unique([
        request.checkpointRequestId,
        ...request.currentGraphRefs,
        ...request.compactObservationRefs,
        ...request.perturbationRefs,
        ...request.priorAnswerSnapshotRefs,
      ]),
      confidence: request.status === "running" ? 0.82 : request.status === "blocked" ? 0.54 : 0.72,
      missingEvidence: request.missingEvidence,
      reasonCodes: [
        "stage_play_checkpoint_request",
        `checkpoint_reason_${request.reason}`,
        `checkpoint_status_${request.status}`,
        request.checkpointPolicy.requiresUserApproval ? "requires_user_approval" : "auto_policy",
      ],
      dataTray: {
        title: "Checkpoint request",
        summary: `${checkpointRequestTitle(request.reason)} is ${request.status}; ${request.checkpointPolicy.autoRunEligible ? "auto eligible" : "visible queue first"}.`,
        freshness: request.status === "queued" || request.status === "running" ? "fresh" : "stale",
        confidence: request.status === "running" ? 0.82 : 0.72,
        evidenceRefs: unique([
          request.checkpointRequestId,
          ...request.currentGraphRefs,
          ...request.perturbationRefs,
        ]),
        inputRefs: unique([
          ...request.currentGraphRefs,
          ...request.compactObservationRefs,
          ...request.perturbationRefs,
          ...request.priorAnswerSnapshotRefs,
        ]),
        inputPreview: "graph + projected interpretation + prompt",
        transformLabel: "checkpoint request queue",
        outputRefs: [request.checkpointRequestId],
        outputPreview: `${request.checkpointRequestId} status: ${request.status}`,
        skipped: request.missingEvidence,
      },
      admission: "ask_user",
    }));
    for (const perturbationRef of request.perturbationRefs) {
      const sourceBadgeId = perturbationBadgeIdsByRef.get(perturbationRef);
      if (sourceBadgeId && existingBadgeIds.has(sourceBadgeId)) {
        pushEdge(edges, {
          from: sourceBadgeId,
          to: badgeId,
          relation: "recommends",
          label: "queues checkpoint",
          evidenceRefs: [request.checkpointRequestId, perturbationRef],
          reasonCodes: ["perturbation_checkpoint_request"],
        });
      }
    }
    if (existingBadgeIds.has("helix_ask.checkpoint.latest")) {
      if (existingBadgeIds.has("possibilities.current")) {
        pushEdge(edges, {
          from: "possibilities.current",
          to: badgeId,
          relation: "recommends",
          label: "current possibilities request a bounded checkpoint",
          evidenceRefs: [request.checkpointRequestId],
          reasonCodes: ["possibilities_checkpoint_request"],
        });
      }
      if (existingBadgeIds.has("perturbation.latest") && request.perturbationRefs.length > 0) {
        pushEdge(edges, {
          from: "perturbation.latest",
          to: badgeId,
          relation: "recommends",
          label: "latest perturbation requests bounded checkpoint",
          evidenceRefs: [request.checkpointRequestId, ...request.perturbationRefs],
          reasonCodes: ["latest_perturbation_checkpoint_request"],
        });
      }
      pushEdge(edges, {
        from: badgeId,
        to: "helix_ask.checkpoint.latest",
        relation: "needs_check",
        label: "awaits Ask checkpoint",
        evidenceRefs: [request.checkpointRequestId],
        reasonCodes: ["checkpoint_request_awaits_ask"],
      });
    }
    existingBadgeIds.add(badgeId);
  }
};

const isCompletedAskCheckpointReceipt = (
  receipt: StagePlayAskCheckpointReceiptV1 | null | undefined,
): receipt is StagePlayAskCheckpointReceiptV1 =>
  Boolean(
    receipt &&
    receipt.completedSolverPath === true &&
    (isNonEmptyString(receipt.askTurnId) || isNonEmptyString(receipt.solverTraceRef)),
  );

const checkpointCandidateFromReceipt = (
  receipt: StagePlayAskCheckpointReceiptV1 | null | undefined,
) => receipt
  ? {
      checkpointId: receipt.askTurnId ?? receipt.solverTraceRef ?? null,
      graphId: receipt.graphId ?? null,
      createdAt: receipt.createdAt ?? null,
      modelReviewed: isCompletedAskCheckpointReceipt(receipt),
      sourceWindowRefs: receipt.sourceWindowRefs ?? null,
      sourceArtifactRefs: receipt.sourceArtifactRefs ?? null,
      evidenceRefs: receipt.evidenceRefs ?? null,
    }
  : null;

const addPipelineSkeleton = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    observerId: string;
    interpreterId?: string | null;
    graphId?: string | null;
    sourceRefs: StagePlayBadgeSourceRefV1[];
    evidenceRefs: string[];
    sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
    generatedAt: string;
    askCheckpointReceipt?: StagePlayAskCheckpointReceiptV1 | null;
    checkpointFreshness?: StagePlayCheckpointFreshnessV1 | null;
    latestVisualEvidence?: HelixVisualFrameEvidence | null;
  },
): void => {
  if (input.sources.length === 0) return;

  const selectedCount = input.sources.filter((source) => source.selectedForStagePlay).length;
  const activeCount = input.sources.filter((source) => source.status === "active").length;
  const sourceEvidenceRefs = unique([
    ...input.evidenceRefs,
    ...input.sources.flatMap((source) => source.evidenceRefs),
  ]);
  const skeletonEvidenceRefs = sourceEvidenceRefs.length > 0 ? sourceEvidenceRefs : input.evidenceRefs;
  const hasCompactEvidence = skeletonEvidenceRefs.length > 0;
  const visualFrameRefs = refsMatching(skeletonEvidenceRefs, /^visual_frame:/);
  const visualEvidenceRefs = unique([
    ...refsMatching(skeletonEvidenceRefs, /^visual_evidence:/),
    ...(input.latestVisualEvidence?.evidence_id ? [input.latestVisualEvidence.evidence_id] : []),
  ]);
  const compactInputRefs = visualFrameRefs.length > 0
    ? visualFrameRefs
    : input.sources.flatMap((source) => source.evidenceRefs).slice(0, 6);
  const compactOutputRefs = visualEvidenceRefs.length > 0
    ? visualEvidenceRefs
    : skeletonEvidenceRefs.slice(0, 6);
  const compactOutputPreview = input.latestVisualEvidence?.summary
    ? compactPreview(input.latestVisualEvidence.summary, "Latest compact evidence is available.")
    : null;
  const existingStageBoundCount = badges.filter((entry) =>
    [
      "setting",
      "actor",
      "prop",
      "resource",
      "hazard",
      "constraint",
      "goal",
      "world_state",
      "fusion",
    ].includes(entry.kind)
  ).length;
  const existingProceduralBindings = badges.filter((entry) =>
    entry.kind === "procedural_binding" && entry.id !== "procedural_binding.active"
  );
  const checkpointFreshness = input.checkpointFreshness ?? null;
  const completedCheckpoint = checkpointFreshness?.fresh === true && isCompletedAskCheckpointReceipt(input.askCheckpointReceipt)
    ? input.askCheckpointReceipt
    : null;
  const checkpointCandidateWasRejected = Boolean(
    checkpointFreshness &&
    !checkpointFreshness.fresh &&
    checkpointFreshness.reason !== "no_checkpoint",
  );
  const checkpointMissingSummary = checkpointCandidateWasRejected
    ? "No current model-reviewed checkpoint."
    : "No answer snapshot yet.";
  const checkpointMissingEvidence = completedCheckpoint
    ? []
    : unique([
        checkpointFreshness?.reason === "no_checkpoint"
          ? "A completed Ask turn/debug receipt with solver completion is required."
          : `Checkpoint freshness failed: ${checkpointFreshness?.reason ?? "no_checkpoint"}.`,
        ...(checkpointFreshness?.staleBecause ?? []),
      ]);
  const checkpointEvidenceRefs = unique([
    ...skeletonEvidenceRefs,
    ...(checkpointFreshness ? [`checkpoint_freshness:${checkpointFreshness.reason}`] : []),
    ...(completedCheckpoint?.evidenceRefs ?? []),
    ...(completedCheckpoint?.askTurnId ? [completedCheckpoint.askTurnId] : []),
    ...(completedCheckpoint?.solverTraceRef ? [completedCheckpoint.solverTraceRef] : []),
  ]);
  const answerText = completedCheckpoint?.answerText?.trim() ?? "";
  const voicePolicyEligible = completedCheckpoint?.voicePolicy?.voiceEligible === true;

  const compactObservationId = pushBadge(badges, badge({
    id: "compact_observation.latest",
    title: "compact observation",
    plainMeaning: "Latest compact source-window evidence available to Stage Play.",
    whyItMatters: "Compact observations carry source evidence into the stage while keeping large source payloads outside the graph.",
    kind: "compact_observation",
    status: hasCompactEvidence ? "observed" : "missing_evidence",
    subjects: input.sources.map((source) => source.sourceId),
    tags: ["pipeline", "compact_observation", ...unique(input.sources.map((source) => source.modality))],
    sourceRefs: input.sourceRefs,
    evidenceRefs: skeletonEvidenceRefs,
    confidence: hasCompactEvidence ? 0.76 : 0.35,
    missingEvidence: hasCompactEvidence ? [] : ["Admitted compact source observation evidence is not available yet."],
    reasonCodes: ["stage_play_pipeline_skeleton", "compact_source_window"],
    dataTray: {
      title: "Latest compact window",
      summary: hasCompactEvidence
        ? `Observed ${activeCount} active source(s), ${selectedCount} selected for Stage Play.`
        : "Waiting for admitted compact observation evidence.",
      updatedAt: input.generatedAt,
      freshness: hasCompactEvidence ? "fresh" : "missing",
      confidence: hasCompactEvidence ? 0.76 : 0.35,
      evidenceRefs: skeletonEvidenceRefs,
      inputRefs: compactInputRefs,
      inputPreview: compactInputRefs.length > 0 ? compactInputRefs.slice(0, 3).join(", ") : null,
      transformLabel: visualFrameRefs.length > 0 || input.latestVisualEvidence
        ? "visual frame analyze -> compact evidence"
        : "compact source window",
      outputRefs: compactOutputRefs,
      outputPreview: compactOutputPreview ?? (hasCompactEvidence
        ? `Observed ${activeCount} active source(s), ${selectedCount} selected for Stage Play.`
        : "Waiting for admitted compact observation evidence."),
    },
    admission: "auto",
  }));

  const stageInterpretationId = pushBadge(badges, badge({
    id: "stage_interpretation.current",
    title: "stage interpretation",
    plainMeaning: "Current interpreted stage bounds derived from compact observations.",
    whyItMatters: "Stage interpretation is the boundary between observed source facts and the procedural space the agent can review.",
    kind: "stage_interpretation",
    status: existingStageBoundCount > 0 ? "observed" : "missing_evidence",
    subjects: input.sources.map((source) => source.sourceId),
    tags: ["pipeline", "stage_interpretation"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: skeletonEvidenceRefs,
    confidence: existingStageBoundCount > 0 ? 0.74 : 0.38,
    missingEvidence: existingStageBoundCount > 0 ? [] : ["Interpreted stage bounds have not been assembled yet."],
    reasonCodes: ["stage_play_pipeline_skeleton", "stage_bounds_projection"],
    dataTray: {
      title: "Current stage bounds",
      summary: existingStageBoundCount > 0
        ? `${existingStageBoundCount} interpreted bound badge(s) are active in this stage.`
        : "No interpreted stage bounds are active yet.",
      updatedAt: input.generatedAt,
      freshness: hasCompactEvidence ? "fresh" : "missing",
      confidence: existingStageBoundCount > 0 ? 0.74 : 0.38,
      evidenceRefs: skeletonEvidenceRefs,
    },
    admission: "auto",
  }));

  const activeProcedureId = pushBadge(badges, badge({
    id: "procedural_binding.active",
    title: "active procedure",
    plainMeaning: "Aggregate view of the procedural bindings currently assembled from the stage.",
    whyItMatters: "The active procedure node shows whether the graph has combined observations into traceable action-language candidates.",
    kind: "procedural_binding",
    status: existingProceduralBindings.length > 0 ? "candidate" : "missing_evidence",
    subjects: existingProceduralBindings.map((entry) => entry.id),
    tags: ["pipeline", "procedural_binding", "active_procedure"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: unique([
      ...skeletonEvidenceRefs,
      ...existingProceduralBindings.flatMap((entry) => entry.evidenceRefs),
    ]),
    confidence: existingProceduralBindings.length > 0 ? 0.72 : 0.36,
    missingEvidence: existingProceduralBindings.length > 0 ? [] : ["No procedural bindings have been assembled for this stage yet."],
    reasonCodes: ["stage_play_pipeline_skeleton", "procedural_binding_aggregate"],
    dataTray: {
      title: "Active procedure",
      summary: existingProceduralBindings.length > 0
        ? `${existingProceduralBindings.length} procedural binding(s) are available for review.`
        : "No procedural bindings have been assembled for this stage yet.",
      updatedAt: input.generatedAt,
      freshness: hasCompactEvidence ? "fresh" : "missing",
      confidence: existingProceduralBindings.length > 0 ? 0.72 : 0.36,
      evidenceRefs: unique([
        ...skeletonEvidenceRefs,
        ...existingProceduralBindings.flatMap((entry) => entry.evidenceRefs),
      ]),
    },
    admission: "auto",
  }));

  const checkpointId = pushBadge(badges, badge({
    id: "helix_ask.checkpoint.latest",
    title: "Helix Ask checkpoint",
    plainMeaning: completedCheckpoint
      ? "Helix Ask completed a model-reviewed checkpoint over the Stage Play evidence."
      : "No completed Helix Ask checkpoint has reviewed this stage yet.",
    whyItMatters: "Checkpoint badges distinguish evidence projection from an upheld answer produced after the agent observes the graph.",
    kind: "helix_ask_checkpoint",
    status: completedCheckpoint ? "observed" : "missing_evidence",
    subjects: [completedCheckpoint?.askTurnId ?? "helix_ask"],
    tags: ["pipeline", "helix_ask", "checkpoint", completedCheckpoint ? "model_reviewed" : "missing_checkpoint", ...(checkpointCandidateWasRejected ? ["stale_checkpoint"] : [])],
    sourceRefs: input.sourceRefs,
    evidenceRefs: checkpointEvidenceRefs,
    confidence: completedCheckpoint ? 0.86 : 0.34,
    missingEvidence: checkpointMissingEvidence,
    reasonCodes: [
      "stage_play_pipeline_skeleton",
      completedCheckpoint ? "completed_solver_path" : "missing_model_reviewed_checkpoint",
      ...(checkpointFreshness ? [`checkpoint_freshness_${checkpointFreshness.reason}`] : []),
    ],
    dataTray: {
      title: "Latest Ask checkpoint",
      summary: completedCheckpoint
        ? "Model-reviewed checkpoint is available for this stage."
        : checkpointMissingSummary,
      updatedAt: input.generatedAt,
      freshness: completedCheckpoint ? "fresh" : "missing",
      confidence: completedCheckpoint ? 0.86 : 0.34,
      evidenceRefs: checkpointEvidenceRefs,
      inputRefs: unique([activeProcedureId, ...checkpointEvidenceRefs.slice(0, 5)]),
      inputPreview: completedCheckpoint ? "Stage Play graph plus checkpoint evidence." : "Stage Play graph is waiting for checkpoint review.",
      transformLabel: "model-reviewed Helix Ask checkpoint",
      outputRefs: unique([
        ...(completedCheckpoint?.askTurnId ? [completedCheckpoint.askTurnId] : []),
        ...(completedCheckpoint?.solverTraceRef ? [completedCheckpoint.solverTraceRef] : []),
      ]),
      outputPreview: completedCheckpoint ? "Model-reviewed checkpoint completed." : checkpointMissingSummary,
      blockedUntil: completedCheckpoint ? null : "model-reviewed Helix Ask checkpoint",
    },
    checkpoint: {
      askTurnId: completedCheckpoint?.askTurnId ?? null,
      solverTraceRef: completedCheckpoint?.solverTraceRef ?? null,
      terminalArtifactKind: completedCheckpoint?.terminalArtifactKind ?? null,
      finalAnswerSource: completedCheckpoint?.finalAnswerSource ?? null,
      modelReviewed: Boolean(completedCheckpoint),
    },
    admission: "auto",
  }));

  const answerSnapshotId = pushBadge(badges, badge({
    id: "answer_snapshot.latest",
    title: "answer snapshot",
    plainMeaning: completedCheckpoint
      ? "Latest upheld answer snapshot from a model-reviewed checkpoint."
      : "Answer snapshot is waiting for a model-reviewed checkpoint.",
    whyItMatters: "Answer snapshots keep output text separate from source observations and diagnostic graph projection.",
    kind: "answer_snapshot",
    status: completedCheckpoint ? "observed" : "missing_evidence",
    subjects: [completedCheckpoint?.askTurnId ?? "helix_ask"],
    tags: ["pipeline", "answer_snapshot", completedCheckpoint ? "model_reviewed" : "missing_checkpoint"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: checkpointEvidenceRefs,
    confidence: completedCheckpoint ? 0.82 : 0.32,
    missingEvidence: completedCheckpoint ? [] : ["A model-reviewed Ask checkpoint is required before an answer snapshot is upheld."],
    reasonCodes: [
      "stage_play_pipeline_skeleton",
      completedCheckpoint ? "answer_snapshot_from_checkpoint" : "missing_answer_snapshot",
    ],
    dataTray: {
      title: "Upheld answer",
      summary: completedCheckpoint
        ? answerText || "Model-reviewed checkpoint is available; no answer text was supplied to the graph builder."
        : "No upheld answer snapshot is available yet.",
      updatedAt: input.generatedAt,
      freshness: completedCheckpoint ? "fresh" : "missing",
      confidence: completedCheckpoint ? 0.82 : 0.32,
      evidenceRefs: checkpointEvidenceRefs,
      inputRefs: unique([
        checkpointId,
        ...checkpointEvidenceRefs.slice(0, 5),
      ]),
      inputPreview: completedCheckpoint ? "Completed checkpoint consumed Stage Play evidence." : "Checkpoint request has not produced reviewed answer evidence.",
      transformLabel: "answer snapshot promotion",
      outputRefs: completedCheckpoint ? ["answer_snapshot.latest"] : [],
      outputPreview: completedCheckpoint
        ? compactPreview(answerText, "Model-reviewed checkpoint is available.")
        : "No answer snapshot yet.",
      blockedUntil: completedCheckpoint ? null : "model-reviewed Helix Ask checkpoint",
    },
    output: {
      lineKey: "recommendation",
      text: completedCheckpoint
        ? answerText || "Model-reviewed checkpoint is available."
        : checkpointMissingSummary,
      state: completedCheckpoint ? "model_reviewed" : "stale",
      voiceEligible: false,
    },
    admission: "auto",
  }));

  const liveOutputEvidenceRefs = completedCheckpoint
    ? unique([...checkpointEvidenceRefs, answerSnapshotId])
    : checkpointEvidenceRefs;
  const liveOutputId = pushBadge(badges, badge({
    id: "live_output.current",
    title: "live output",
    plainMeaning: completedCheckpoint
      ? "Current live output can display the model-reviewed answer snapshot."
      : "Current live output is waiting for a model-reviewed answer snapshot.",
    whyItMatters: "Live output is the display target for reviewed answer snapshots; it is not produced directly from source evidence.",
    kind: "live_output",
    status: completedCheckpoint ? "observed" : "missing_evidence",
    subjects: ["live_answer"],
    tags: ["pipeline", "live_output", completedCheckpoint ? "model_reviewed" : "waiting_for_checkpoint"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: liveOutputEvidenceRefs,
    confidence: completedCheckpoint ? 0.8 : 0.32,
    missingEvidence: completedCheckpoint ? [] : ["Live output requires a model-reviewed answer snapshot."],
    reasonCodes: [
      "stage_play_pipeline_skeleton",
      completedCheckpoint ? "live_output_from_answer_snapshot" : "missing_live_output_checkpoint",
    ],
    dataTray: {
      title: "Current live output",
      summary: completedCheckpoint
        ? "Live output is backed by the latest model-reviewed answer snapshot."
        : "Waiting for answer snapshot before displaying an upheld live response.",
      updatedAt: input.generatedAt,
      freshness: completedCheckpoint ? "fresh" : "missing",
      confidence: completedCheckpoint ? 0.8 : 0.32,
      evidenceRefs: liveOutputEvidenceRefs,
      inputRefs: unique([
        input.graphId ?? "stage_play_badge_graph",
        ...skeletonEvidenceRefs.slice(0, 5),
      ]),
      inputPreview: "Stage Play graph plus projected interpretation lanes.",
      transformLabel: "output lane reducer",
      outputRefs: ["risk", "possibilities", "unknowns", "next_check"],
      outputPreview: completedCheckpoint
        ? "Reviewed output can display the answer snapshot."
        : "risk, possibilities, unknowns, next_check",
      skipped: completedCheckpoint ? [] : ["recommendation", "answer_snapshot", "voice_output"],
      blockedUntil: completedCheckpoint ? null : "model-reviewed Helix Ask checkpoint for answer_snapshot / voice_output",
    },
    output: {
      lineKey: "live_output",
      text: completedCheckpoint
        ? answerText || "Model-reviewed answer snapshot is available."
        : "No model-reviewed live output is available for this stage yet.",
      state: completedCheckpoint ? "model_reviewed" : "stale",
      voiceEligible: false,
    },
    admission: "auto",
  }));

  const voiceOutputId = completedCheckpoint && voicePolicyEligible
    ? pushBadge(badges, badge({
        id: "voice_output.current",
        title: "voice output",
        plainMeaning: "Current voice output is eligible only because an explicit voice policy cites the reviewed answer snapshot.",
        whyItMatters: "Voice output must speak from a model-reviewed answer snapshot, never from raw Stage Play projection.",
        kind: "voice_output",
        status: "observed",
        subjects: ["voice_output"],
        tags: ["pipeline", "voice_output", "model_reviewed", "voice_policy"],
        sourceRefs: input.sourceRefs,
        evidenceRefs: unique([
          ...checkpointEvidenceRefs,
          answerSnapshotId,
          ...(completedCheckpoint.voicePolicy?.evidenceRefs ?? []),
        ]),
        confidence: 0.78,
        reasonCodes: unique([
          "stage_play_pipeline_skeleton",
          "explicit_voice_policy",
          "voice_output_from_answer_snapshot",
          "voice_cites_answer_snapshot",
          ...(completedCheckpoint.voicePolicy?.reasonCodes ?? []),
        ]),
        dataTray: {
          title: "Current voice output",
          summary: "Voice output cites the model-reviewed answer snapshot and an explicit voice policy.",
          updatedAt: input.generatedAt,
          freshness: "fresh",
          confidence: 0.78,
          evidenceRefs: unique([
            ...checkpointEvidenceRefs,
            answerSnapshotId,
            ...(completedCheckpoint.voicePolicy?.evidenceRefs ?? []),
          ]),
        },
        output: {
          lineKey: "voice_output",
          text: answerText || "Model-reviewed answer snapshot is available for voice output.",
          state: "model_reviewed",
          voiceEligible: true,
        },
        admission: "auto",
      }))
    : null;

  pushEdge(edges, {
    from: input.observerId,
    to: compactObservationId,
    relation: "feeds",
    label: "observer source custody feeds compact observation",
    evidenceRefs: skeletonEvidenceRefs,
    reasonCodes: ["pipeline_observer_compact_observation"],
  });
  if (input.interpreterId) {
    pushEdge(edges, {
      from: compactObservationId,
      to: input.interpreterId,
      relation: "feeds",
      label: "compact observation feeds Stage Play interpreter",
      evidenceRefs: skeletonEvidenceRefs,
      reasonCodes: ["pipeline_compact_interpreter"],
    });
    pushEdge(edges, {
      from: input.interpreterId,
      to: stageInterpretationId,
      relation: "interprets",
      label: "interpreter produces current stage interpretation",
      evidenceRefs: skeletonEvidenceRefs,
      reasonCodes: ["pipeline_interpreter_stage_interpretation"],
    });
  } else {
    pushEdge(edges, {
      from: compactObservationId,
      to: stageInterpretationId,
      relation: "interprets",
      label: "compact observation seeds current stage interpretation",
      evidenceRefs: skeletonEvidenceRefs,
      reasonCodes: ["pipeline_compact_stage_interpretation"],
    });
  }
  pushEdge(edges, {
    from: stageInterpretationId,
    to: activeProcedureId,
    relation: "produces",
    label: "stage interpretation produces active procedural binding aggregate",
    evidenceRefs: skeletonEvidenceRefs,
    reasonCodes: ["pipeline_stage_procedure"],
  });
  for (const procedural of existingProceduralBindings.slice(0, 12)) {
    pushEdge(edges, {
      from: procedural.id,
      to: activeProcedureId,
      relation: "composes_with",
      label: "specific procedural binding contributes to active procedure",
      evidenceRefs: procedural.evidenceRefs,
      reasonCodes: ["pipeline_specific_procedure_aggregate"],
    });
  }
  pushEdge(edges, {
    from: activeProcedureId,
    to: checkpointId,
    relation: "feeds",
    label: "active procedure feeds Helix Ask checkpoint review",
    evidenceRefs: checkpointEvidenceRefs,
    reasonCodes: ["pipeline_procedure_checkpoint"],
  });
  pushEdge(edges, {
    from: checkpointId,
    to: answerSnapshotId,
    relation: "produces",
    label: "model-reviewed checkpoint produces answer snapshot",
    evidenceRefs: checkpointEvidenceRefs,
    reasonCodes: ["pipeline_checkpoint_answer_snapshot"],
  });
  pushEdge(edges, {
    from: answerSnapshotId,
    to: liveOutputId,
    relation: "produces",
    label: "answer snapshot produces current live output",
    evidenceRefs: checkpointEvidenceRefs,
    reasonCodes: ["pipeline_answer_live_output"],
  });
  if (voiceOutputId) {
    pushEdge(edges, {
      from: answerSnapshotId,
      to: voiceOutputId,
      relation: "produces",
      label: "answer snapshot produces policy-gated voice output",
      evidenceRefs: unique([
        ...checkpointEvidenceRefs,
        answerSnapshotId,
        ...(completedCheckpoint.voicePolicy?.evidenceRefs ?? []),
      ]),
      reasonCodes: ["pipeline_answer_voice_output", "explicit_voice_policy"],
    });
  }
};

const addVisualCaptureCheckpointChain = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    observerId: string;
    sourceRefs: StagePlayBadgeSourceRefV1[];
    evidenceRefs: string[];
    sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
    generatedAt: string;
    latestVisualEvidence?: HelixVisualFrameEvidence | null;
  },
): void => {
  const visualSources = input.sources.filter((source) =>
    source.selectedForStagePlay &&
    source.status === "active" &&
    /visual|screen|frame/i.test(source.modality)
  );
  if (visualSources.length === 0) return;
  const visualEvidenceRefs = unique([
    ...input.evidenceRefs,
    ...visualSources.flatMap((source) => source.evidenceRefs),
    ...(input.latestVisualEvidence?.frame_id ? [input.latestVisualEvidence.frame_id] : []),
    ...(input.latestVisualEvidence?.evidence_id ? [input.latestVisualEvidence.evidence_id] : []),
  ]);
  const visualSourceRefs = unique(visualSources.map((source) => source.sourceId));
  const latestFrameRefs = unique([
    ...refsMatching(visualEvidenceRefs, /^visual_frame:/),
    ...(input.latestVisualEvidence?.frame_id ? [input.latestVisualEvidence.frame_id] : []),
  ]);
  const latestCompactRefs = unique([
    ...refsMatching(visualEvidenceRefs, /^visual_evidence:/),
    ...(input.latestVisualEvidence?.evidence_id ? [input.latestVisualEvidence.evidence_id] : []),
  ]);
  const latestVisualSummary = input.latestVisualEvidence?.summary
    ? compactPreview(input.latestVisualEvidence.summary, "Latest visual compact evidence is available.")
    : null;
  const sourceId = pushBadge(badges, badge({
    id: "source.visual_frame.active",
    title: "visual frame source",
    plainMeaning: "A selected active visual source is feeding the Stage Play graph.",
    whyItMatters: "This stable source node shows visual custody before any scene interpretation or checkpoint request.",
    kind: "source",
    status: "observed",
    subjects: visualSources.map((source) => source.sourceId),
    tags: ["pipeline", "visual_capture_job", "visual_frame", "active_source"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: visualEvidenceRefs,
    liveBindings: visualSources.map((source) =>
      makeBinding("source_modality", source.evidenceRefs, `${source.modality}:${source.status}:${source.cadenceMs ?? "cadence_unknown"}`)
    ),
    confidence: 0.82,
    reasonCodes: ["visual_capture_source_active"],
    dataTray: {
      title: "Visual source",
      summary: `${visualSources.length} active visual source(s); cadence ${visualSources[0]?.cadenceMs ? `${visualSources[0]?.cadenceMs}ms` : "unknown"}.`,
      updatedAt: input.generatedAt,
      freshness: "fresh",
      confidence: 0.82,
      evidenceRefs: visualEvidenceRefs,
      inputRefs: visualSourceRefs,
      inputPreview: visualSourceRefs.join(", ") || null,
      transformLabel: "Visual frame producer / source descriptor",
      outputRefs: latestFrameRefs.length > 0 ? latestFrameRefs : visualEvidenceRefs.slice(0, 4),
      outputPreview: `${visualSources[0]?.status ?? "active"}${latestFrameRefs[0] ? ` -> ${latestFrameRefs[0]}` : ""}`,
    },
    admission: "auto",
  }));
  const compactVisualId = pushBadge(badges, badge({
    id: "compact_observation.latest_visual",
    title: "latest visual compact observation",
    plainMeaning: "The latest visual source evidence has been compacted for Stage Play interpretation.",
    whyItMatters: "The graph can cite visual compact facts without embedding raw frames or transcripts.",
    kind: "compact_observation",
    status: visualEvidenceRefs.length > 0 ? "observed" : "missing_evidence",
    subjects: visualSources.map((source) => source.sourceId),
    tags: ["pipeline", "visual_capture_job", "compact_observation", "latest_visual"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: visualEvidenceRefs,
    liveBindings: visualSources.map((source) =>
      makeBinding("source_status", source.evidenceRefs, `${source.sourceId}:visual_compact_window`)
    ),
    confidence: visualEvidenceRefs.length > 0 ? 0.76 : 0.35,
    missingEvidence: visualEvidenceRefs.length > 0 ? [] : ["Latest compact visual observation is not available yet."],
    reasonCodes: ["latest_visual_compact_observation"],
    dataTray: {
      title: "Latest visual",
      summary: "Latest visual frame compacted into Stage Play evidence.",
      updatedAt: input.generatedAt,
      freshness: visualEvidenceRefs.length > 0 ? "fresh" : "missing",
      confidence: visualEvidenceRefs.length > 0 ? 0.76 : 0.35,
      evidenceRefs: visualEvidenceRefs,
      inputRefs: latestFrameRefs.length > 0 ? latestFrameRefs : visualSources.flatMap((source) => source.evidenceRefs).slice(0, 4),
      inputPreview: latestFrameRefs[0] ?? "Waiting for visual frame refs.",
      transformLabel: "visual frame analyze -> compact evidence",
      outputRefs: latestCompactRefs.length > 0 ? latestCompactRefs : visualEvidenceRefs.slice(0, 4),
      outputPreview: latestVisualSummary ?? "Latest visual frame compacted into Stage Play evidence.",
    },
    admission: "auto",
  }));
  const visualInterpreterId = pushBadge(badges, badge({
    id: "interpreter.visual_scene",
    title: "visual scene interpreter",
    plainMeaning: "Interpreter slot that reduces compact visual evidence into scene bounds.",
    whyItMatters: "This is the checkpoint setup work: visual facts are interpreted before Helix Ask reasons over them.",
    kind: "interpreter",
    status: "candidate",
    subjects: visualSources.map((source) => source.sourceId),
    tags: ["pipeline", "visual_capture_job", "visual_scene_interpreter", "evidence_only"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: visualEvidenceRefs,
    liveBindings: visualSources.map((source) =>
      makeBinding("source_status", source.evidenceRefs, `${source.modality}:interpreting`)
    ),
    confidence: 0.72,
    reasonCodes: ["visual_scene_interpreter"],
    dataTray: {
      title: "Visual interpreter",
      summary: "Ready to reduce the latest visual compact observation into scene bounds.",
      updatedAt: input.generatedAt,
      freshness: "fresh",
      confidence: 0.72,
      evidenceRefs: visualEvidenceRefs,
      inputRefs: unique([
        ...latestCompactRefs,
        ...input.sourceRefs.filter((ref) => ref.kind === "live_source_descriptor").map((ref) => ref.id).slice(0, 4),
      ]),
      inputPreview: latestVisualSummary ?? "Latest visual compact observation plus source descriptors.",
      transformLabel: "reflect_stage_play_context",
      outputRefs: ["setting.visual_scene", "actor.observed_subject", "possibilities.current"],
      outputPreview: "scene bounds and possibilities pending final graph summary",
    },
    admission: "auto",
  }));
  const supportingPossibilities = badges.filter((entry) =>
    entry.kind === "procedural_binding" && entry.id !== "possibilities.current"
  );
  const possibilityId = pushBadge(badges, badge({
    id: "possibilities.current",
    title: "current possibilities",
    plainMeaning: "Stable aggregate of possible next checks and procedural bindings from the visual stage.",
    whyItMatters: "Possibilities are the bounded action space Helix Ask can reason over; they are not a final answer.",
    kind: "procedural_binding",
    status: supportingPossibilities.length > 0 ? "candidate" : "missing_evidence",
    subjects: supportingPossibilities.map((entry) => entry.id),
    tags: ["pipeline", "visual_capture_job", "possibilities", "current"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: unique([
      ...visualEvidenceRefs,
      ...supportingPossibilities.flatMap((entry) => entry.evidenceRefs),
    ]),
    confidence: supportingPossibilities.length > 0 ? 0.72 : 0.42,
    missingEvidence: supportingPossibilities.length > 0 ? [] : ["No procedural possibilities have been assembled from the visual scene yet."],
    reasonCodes: ["visual_stage_possibility_aggregate"],
    dataTray: {
      title: "Possibilities",
      summary: supportingPossibilities.length > 0
        ? `${supportingPossibilities.length} procedural possibility node(s) are active.`
        : "Waiting for interpreted scene bounds to assemble possibilities.",
      updatedAt: input.generatedAt,
      freshness: "fresh",
      confidence: supportingPossibilities.length > 0 ? 0.72 : 0.42,
      evidenceRefs: unique([
        ...visualEvidenceRefs,
        ...supportingPossibilities.flatMap((entry) => entry.evidenceRefs),
      ]),
    },
    admission: "auto",
  }));

  pushEdge(edges, {
    from: input.observerId,
    to: sourceId,
    relation: "feeds",
    label: "observer routes active visual source",
    evidenceRefs: visualEvidenceRefs,
    reasonCodes: ["visual_chain_observer_source"],
  });
  pushEdge(edges, {
    from: sourceId,
    to: compactVisualId,
    relation: "feeds",
    label: "visual source feeds latest compact visual observation",
    evidenceRefs: visualEvidenceRefs,
    reasonCodes: ["visual_chain_source_compact"],
  });
  pushEdge(edges, {
    from: compactVisualId,
    to: visualInterpreterId,
    relation: "feeds",
    label: "latest visual compact observation feeds visual scene interpreter",
    evidenceRefs: visualEvidenceRefs,
    reasonCodes: ["visual_chain_compact_interpreter"],
  });
  for (const targetId of ["setting.visual_scene", "actor.observed_subject"]) {
    if (!badges.some((entry) => entry.id === targetId)) continue;
    pushEdge(edges, {
      from: visualInterpreterId,
      to: targetId,
      relation: "interprets",
      label: "visual scene interpreter produces scene-bound node",
      evidenceRefs: visualEvidenceRefs,
      reasonCodes: ["visual_chain_interpreter_bound"],
    });
  }
  const possibilitySources = ["setting.visual_scene", "actor.observed_subject", "stage_interpretation.current"]
    .filter((id) => badges.some((entry) => entry.id === id));
  for (const source of possibilitySources) {
    pushEdge(edges, {
      from: source,
      to: possibilityId,
      relation: "produces",
      label: "scene bound contributes to current possibilities",
      evidenceRefs: visualEvidenceRefs,
      reasonCodes: ["visual_chain_bound_possibility"],
    });
  }
};

const uniqueBy = <T>(items: T[], keyOf: (item: T) => string): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

const collectMicroReasonerState = (sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"]) => {
  const prompts = uniqueBy(
    sources.flatMap((source) =>
      listStagePlayActiveMicroReasonerPromptsForSource({
        sourceId: source.sourceId,
        sourceKind: source.modality,
        limit: 14,
      })
    ),
    (prompt) => prompt.promptId,
  );
  const runs = uniqueBy(
    sources.flatMap((source) =>
      listStagePlayMicroReasonerRuns({
        sourceId: source.sourceId,
        limit: 20,
      })
    ),
    (run) => run.runId,
  );
  const packets = uniqueBy(
    sources.flatMap((source) =>
      listStagePlayProcessedMailPackets({
        sourceId: source.sourceId,
        limit: 20,
      })
    ),
    (packet) => packet.packetId,
  );
  return { prompts, runs, packets };
};

const statePlanePacketBadgeId = (packetId: string): string =>
  `workstation_state_plane.packet.${hashShort(packetId, 12)}`;

const statePlaneDeckRunBadgeId = (runId: string): string =>
  `workstation_state_plane.deck_run.${hashShort(runId, 12)}`;

const statePlaneDeckPromptBadgeId = (promptId: string): string =>
  `workstation_state_plane.deck_prompt.${hashShort(promptId, 12)}`;

const goalContextUpdateBadgeId = (updateId: string): string =>
  `goal_context_update.${hashShort(updateId, 12)}`;

const agentGoalSessionBadgeId = (goalId: string): string =>
  `agent_goal_session.${hashShort(goalId, 12)}`;

const packetRoutesToGate = (recommendedNext: string): boolean =>
  recommendedNext === "request_more_evidence" ||
  recommendedNext === "request_stage_play_checkpoint" ||
  recommendedNext === "request_voice_callout" ||
  recommendedNext === "draft_text_answer";

const packetRoutesToOutput = (recommendedNext: string): boolean =>
  recommendedNext === "record_interpretation" ||
  recommendedNext === "draft_text_answer" ||
  recommendedNext === "request_voice_callout";

const addWorkstationStatePlaneBadges = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    observerId: string;
    interpreterId?: string | null;
    graphId: string;
    sourceRefs: StagePlayBadgeSourceRefV1[];
    evidenceRefs: string[];
    sources: StagePlayBadgeGraphV1["sourceWindow"]["sources"];
    generatedAt: string;
    checkpointFreshness?: StagePlayCheckpointFreshnessV1 | null;
    microReasoners: ReturnType<typeof collectMicroReasonerState>;
    goalContextUpdates: WorkstationGoalContextUpdateV1[];
    agentGoalSessions: AgentGoalSessionV1[];
  },
): void => {
  const sourceBadgeIds = badges.filter((entry) => entry.kind === "source").map((entry) => entry.id);
  const gateBadgeIds = badges
    .filter((entry) =>
      entry.kind === "admission_gate" ||
      entry.kind === "helix_ask_checkpoint" ||
      entry.kind === "ask_checkpoint" ||
      entry.kind === "checkpoint_request" ||
      entry.kind === "recommended_check" ||
      entry.kind === "missing_evidence"
    )
    .map((entry) => entry.id);
  const processBadgeIds = badges
    .filter((entry) =>
      entry.kind === "compact_observation" ||
      entry.kind === "fusion" ||
      entry.kind === "interpreter" ||
      entry.kind === "stage_interpretation" ||
      entry.kind === "procedural_binding"
    )
    .map((entry) => entry.id);
  const outputBadgeIds = badges
    .filter((entry) => entry.kind === "answer_snapshot" || entry.kind === "live_output" || entry.kind === "voice_output")
    .map((entry) => entry.id);
  const controlBadgeIds = badges
    .filter((entry) => entry.kind === "checkpoint_request" || entry.kind === "perturbation")
    .map((entry) => entry.id);
  const activeSourceCount = input.sources.filter((source) => source.status === "active").length;
  const selectedSourceCount = input.sources.filter((source) => source.selectedForStagePlay).length;
  const promptRefs = input.microReasoners.prompts.map((prompt) => prompt.promptId);
  const runRefs = input.microReasoners.runs.map((run) => run.runId);
  const packetRefs = input.microReasoners.packets.map((packet) => packet.packetId);
  const goalContextRefs = input.goalContextUpdates.map((update) => update.updateId);
  const agentGoalRefs = input.agentGoalSessions.map((session) => session.goalId);
  const statePlaneEvidenceRefs = unique([
    input.graphId,
    ...input.evidenceRefs,
    ...input.sources.flatMap((source) => source.evidenceRefs),
    ...promptRefs,
    ...runRefs,
    ...packetRefs,
    ...goalContextRefs,
    ...agentGoalRefs,
  ]);
  const statePlaneSourceRefs = uniqueBy(
    [
      ...input.sourceRefs,
      { kind: "synthetic_evidence" as const, id: input.graphId },
      ...promptRefs.slice(0, 8).map((id) => ({ kind: "synthetic_evidence" as const, id })),
      ...runRefs.slice(0, 8).map((id) => ({ kind: "synthetic_evidence" as const, id })),
      ...packetRefs.slice(0, 8).map((id) => ({ kind: "synthetic_evidence" as const, id })),
      ...goalContextRefs.slice(0, 8).map((id) => ({ kind: "workstation_goal_context_update" as const, id })),
      ...agentGoalRefs.slice(0, 6).map((id) => ({ kind: "agent_goal_session" as const, id })),
    ],
    (ref) => `${ref.kind}:${ref.id}`,
  );
  const rootId = pushBadge(badges, badge({
    id: "workstation_state_plane.current",
    title: "Workstation state plane",
    plainMeaning: "Read-only circuit map of the current workstation graph: sources, gates, buffers, transforms, outputs, and control signals.",
    whyItMatters: "The agent can inspect this stable process state instead of rebuilding live-source and MicroDeck context from scattered UI panels.",
    kind: "workstation_state_plane",
    status: input.sources.length > 0 || input.microReasoners.prompts.length > 0 ? "observed" : "missing_evidence",
    subjects: unique([
      input.graphId,
      ...input.sources.map((source) => source.sourceId),
      ...promptRefs.slice(0, 8),
    ]),
    tags: ["workstation_state_plane", "circuit_map", "evidence_only", "agent_reflection_surface"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: input.sources.length > 0 ? 0.82 : 0.42,
    missingEvidence: input.sources.length > 0 ? [] : ["No admitted live source is available for the workstation state plane."],
    reasonCodes: ["workstation_state_plane", "process_graph_reflection", "not_terminal_authority"],
    dataTray: {
      title: "State plane",
      summary: `Maps ${input.sources.length} source(s), ${input.microReasoners.prompts.length} MicroDeck prompt(s), ${input.microReasoners.runs.length} run(s), ${input.microReasoners.packets.length} packet(s), ${goalContextRefs.length} goal-context update(s), and ${agentGoalRefs.length} active goal session(s).`,
      updatedAt: input.generatedAt,
      freshness: input.sources.length > 0 ? "fresh" : "missing",
      confidence: input.sources.length > 0 ? 0.82 : 0.42,
      evidenceRefs: statePlaneEvidenceRefs,
      inputRefs: unique(input.sources.map((source) => source.sourceId)).slice(0, 8),
      inputPreview: `${activeSourceCount} active / ${selectedSourceCount} selected source(s)`,
      transformLabel: "workstation graph reducer",
      outputRefs: [input.graphId],
      outputPreview: "evidence-only process graph and goal-context overlay",
    },
    admission: "auto",
  }));

  const sourceBusId = pushBadge(badges, badge({
    id: "workstation_state_plane.source_bus",
    title: "Source bus",
    plainMeaning: "All admitted source handles and producer receipts enter the workstation graph through this bus.",
    whyItMatters: "A source bus gives the agent a single place to inspect source custody, freshness, cadence, and routing before reflection.",
    kind: "workstation_state_plane",
    status: activeSourceCount > 0 ? "observed" : "missing_evidence",
    subjects: input.sources.map((source) => source.sourceId),
    tags: ["workstation_state_plane", "source_bus", "live_sources"],
    sourceRefs: input.sourceRefs,
    evidenceRefs: unique([...input.evidenceRefs, ...input.sources.flatMap((source) => source.evidenceRefs)]),
    confidence: activeSourceCount > 0 ? 0.82 : 0.38,
    missingEvidence: activeSourceCount > 0 ? [] : ["A live source must be active before source-bus observations can refresh."],
    reasonCodes: ["source_bus", "source_custody"],
    dataTray: {
      title: "Source bus",
      summary: `${activeSourceCount} active source(s); ${selectedSourceCount} selected for Stage Play.`,
      updatedAt: input.generatedAt,
      freshness: activeSourceCount > 0 ? "fresh" : "missing",
      confidence: activeSourceCount > 0 ? 0.82 : 0.38,
      evidenceRefs: unique([...input.evidenceRefs, ...input.sources.flatMap((source) => source.evidenceRefs)]),
      inputRefs: input.sources.map((source) => source.sourceId).slice(0, 8),
      transformLabel: "source custody -> graph source badges",
      outputRefs: sourceBadgeIds.slice(0, 10),
      outputPreview: sourceBadgeIds.length > 0 ? `${sourceBadgeIds.length} source badge(s)` : "source badges pending",
    },
    admission: "auto",
  }));

  const gateId = pushBadge(badges, badge({
    id: "workstation_state_plane.gates",
    title: "Admission gates",
    plainMeaning: "Route, checkpoint, missing-evidence, and output gates constrain what can be treated as current.",
    whyItMatters: "Gates keep receipts and projections from becoming answer authority until the solver path and route product contract allow it.",
    kind: "workstation_state_plane",
    status: gateBadgeIds.length > 0 ? "observed" : "candidate",
    subjects: gateBadgeIds,
    tags: ["workstation_state_plane", "gates", "route_authority", "terminal_boundary"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: gateBadgeIds.length > 0 ? 0.78 : 0.5,
    missingEvidence: input.checkpointFreshness?.fresh === true
      ? []
      : ["A fresh model-reviewed checkpoint is needed before output lanes can be upheld as current."],
    reasonCodes: ["admission_gates", "route_authority_boundary", input.checkpointFreshness?.reason ?? "checkpoint_unknown"],
    dataTray: {
      title: "Gates",
      summary: `${gateBadgeIds.length} gate/checkpoint node(s); checkpoint ${input.checkpointFreshness?.reason ?? "unknown"}.`,
      updatedAt: input.generatedAt,
      freshness: input.checkpointFreshness?.fresh === true ? "fresh" : "missing",
      confidence: gateBadgeIds.length > 0 ? 0.78 : 0.5,
      evidenceRefs: statePlaneEvidenceRefs,
      inputRefs: gateBadgeIds.slice(0, 8),
      transformLabel: "route authority / checkpoint freshness",
      outputRefs: outputBadgeIds.slice(0, 8),
      outputPreview: outputBadgeIds.length > 0 ? `${outputBadgeIds.length} gated output node(s)` : "output gates pending",
    },
    admission: "auto",
  }));

  const bufferId = pushBadge(badges, badge({
    id: "workstation_state_plane.microdeck_buffer",
    title: "MicroDeck buffer",
    plainMeaning: "Active MicroDeck prompts, recent micro-reasoner runs, and processed mail packets are queryable buffers for reflection.",
    whyItMatters: "This offsets Ask latency by letting the agent read structured process packets instead of reassembling live-source context every turn.",
    kind: "workstation_state_plane",
    status: promptRefs.length > 0 || runRefs.length > 0 || packetRefs.length > 0 ? "observed" : "candidate",
    subjects: unique([...promptRefs.slice(0, 10), ...runRefs.slice(0, 10), ...packetRefs.slice(0, 10)]),
    tags: ["workstation_state_plane", "microdeck_buffer", "micro_reasoners", "process_memory"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: unique([...promptRefs, ...runRefs, ...packetRefs]),
    confidence: packetRefs.length > 0 ? 0.82 : promptRefs.length > 0 ? 0.72 : 0.44,
    missingEvidence: runRefs.length > 0 || packetRefs.length > 0
      ? []
      : ["No recent MicroDeck run or processed packet has been recorded for the current source window."],
    reasonCodes: ["microdeck_buffer", "synthetic_process_data", "reflection_cache"],
    dataTray: {
      title: "MicroDeck buffer",
      summary: `${promptRefs.length} prompt(s), ${runRefs.length} run(s), ${packetRefs.length} processed packet(s).`,
      updatedAt: input.generatedAt,
      freshness: runRefs.length > 0 || packetRefs.length > 0 ? "fresh" : promptRefs.length > 0 ? "unknown" : "missing",
      confidence: packetRefs.length > 0 ? 0.82 : promptRefs.length > 0 ? 0.72 : 0.44,
      evidenceRefs: unique([...promptRefs, ...runRefs, ...packetRefs]),
      inputRefs: promptRefs.slice(0, 8),
      inputPreview: promptRefs.slice(0, 3).join(", ") || null,
      transformLabel: "MicroDeck prompt/run buffer",
      outputRefs: unique([...runRefs, ...packetRefs]).slice(0, 10),
      outputPreview: packetRefs.length > 0 ? `${packetRefs.length} packet(s) ready` : "packet output pending",
    },
    admission: "auto",
  }));

  const processLoopId = pushBadge(badges, badge({
    id: "workstation_state_plane.process_loop",
    title: "Process loop",
    plainMeaning: "The continuous workstation work is represented as source mail, MicroDeck buffers, graph reduction, and checkpoint requests.",
    whyItMatters: "The loop is visible as state and receipts; it is not a hidden Ask answer loop.",
    kind: "workstation_state_plane",
    status: processBadgeIds.length > 0 ? "observed" : "candidate",
    subjects: processBadgeIds.slice(0, 12),
    tags: ["workstation_state_plane", "process_loop", "mail_loop", "graph_reducer"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: processBadgeIds.length > 0 ? 0.78 : 0.46,
    missingEvidence: processBadgeIds.length > 0 ? [] : ["No process-loop evidence node has been assembled yet."],
    reasonCodes: ["process_loop", "deterministic_workstation_workflow"],
    dataTray: {
      title: "Process loop",
      summary: `${processBadgeIds.length} transform/procedure node(s) connected.`,
      updatedAt: input.generatedAt,
      freshness: processBadgeIds.length > 0 ? "fresh" : "missing",
      confidence: processBadgeIds.length > 0 ? 0.78 : 0.46,
      evidenceRefs: statePlaneEvidenceRefs,
      inputRefs: unique([sourceBusId, bufferId, ...(input.interpreterId ? [input.interpreterId] : [])]),
      transformLabel: "mail loop -> MicroDeck -> graph reducer",
      outputRefs: unique([input.graphId, ...processBadgeIds.slice(0, 8)]),
      outputPreview: "structured process state for Ask reflection",
    },
    admission: "auto",
  }));

  const outputBusId = pushBadge(badges, badge({
    id: "workstation_state_plane.output_bus",
    title: "Output bus",
    plainMeaning: "Live Answer, answer snapshot, and voice output lanes are grouped here as read-only projections.",
    whyItMatters: "Output lanes are easy to inspect without confusing projections, receipts, or voice text with answer authority.",
    kind: "workstation_state_plane",
    status: outputBadgeIds.length > 0 ? "observed" : "candidate",
    subjects: outputBadgeIds,
    tags: ["workstation_state_plane", "output_bus", "live_answer", "voice_boundary"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: outputBadgeIds.length > 0 ? 0.76 : 0.45,
    missingEvidence: outputBadgeIds.length > 0 ? [] : ["No output-lane badge has been assembled yet."],
    reasonCodes: ["output_bus", "projection_boundary"],
    dataTray: {
      title: "Output bus",
      summary: `${outputBadgeIds.length} output node(s) grouped behind authority gates.`,
      updatedAt: input.generatedAt,
      freshness: outputBadgeIds.length > 0 ? "fresh" : "missing",
      confidence: outputBadgeIds.length > 0 ? 0.76 : 0.45,
      evidenceRefs: statePlaneEvidenceRefs,
      inputRefs: unique([gateId, processLoopId]),
      transformLabel: "authority-gated output projection",
      outputRefs: outputBadgeIds,
      outputPreview: outputBadgeIds.join(", ") || "output lanes pending",
    },
    admission: "auto",
  }));

  const controlId = pushBadge(badges, badge({
    id: "workstation_state_plane.control_signals",
    title: "Control signals",
    plainMeaning: "Perturbations and checkpoint requests are represented as control signals over the workstation graph.",
    whyItMatters: "Control signals can suggest visible checks or user approval without silently starting a new reasoning path.",
    kind: "workstation_state_plane",
    status: controlBadgeIds.length > 0 ? "observed" : "candidate",
    subjects: controlBadgeIds,
    tags: ["workstation_state_plane", "control_signals", "checkpoint_queue", "perturbations"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: controlBadgeIds.length > 0 ? 0.74 : 0.46,
    missingEvidence: controlBadgeIds.length > 0 ? [] : ["No perturbation or checkpoint control signal is active."],
    reasonCodes: ["control_signals", "visible_checkpoints"],
    dataTray: {
      title: "Control signals",
      summary: `${controlBadgeIds.length} perturbation/checkpoint signal(s).`,
      updatedAt: input.generatedAt,
      freshness: controlBadgeIds.length > 0 ? "fresh" : "unknown",
      confidence: controlBadgeIds.length > 0 ? 0.74 : 0.46,
      evidenceRefs: statePlaneEvidenceRefs,
      inputRefs: controlBadgeIds.slice(0, 8),
      transformLabel: "perturbation / checkpoint signal",
      outputRefs: gateBadgeIds.slice(0, 8),
      outputPreview: gateBadgeIds.length > 0 ? `${gateBadgeIds.length} gate target(s)` : "gate targets pending",
    },
    admission: "auto",
  }));

  const goalContextBusId = pushBadge(badges, badge({
    id: "workstation_state_plane.goal_context_bus",
    title: "Goal context bus",
    plainMeaning: "Durable goal-context updates and active goal sessions are grouped here as queryable process state.",
    whyItMatters: "The agent can inspect continuous workstation outputs without treating receipts, projections, or MicroDeck products as final answers.",
    kind: "workstation_state_plane",
    status: goalContextRefs.length > 0 || agentGoalRefs.length > 0 ? "observed" : "candidate",
    subjects: unique([...goalContextRefs.slice(0, 12), ...agentGoalRefs.slice(0, 8)]),
    tags: ["workstation_state_plane", "goal_context_bus", "goal_context", "terminal_authority_boundary"],
    sourceRefs: statePlaneSourceRefs,
    evidenceRefs: statePlaneEvidenceRefs,
    confidence: goalContextRefs.length > 0 || agentGoalRefs.length > 0 ? 0.8 : 0.46,
    missingEvidence: goalContextRefs.length > 0 || agentGoalRefs.length > 0
      ? []
      : ["No goal-context updates or active goal sessions have been recorded for this thread."],
    reasonCodes: ["goal_context_bus", "deterministic_runtime_surface", "not_terminal_authority"],
    dataTray: {
      title: "Goal context bus",
      summary: `${goalContextRefs.length} update(s), ${agentGoalRefs.length} active goal session(s), all observation-only.`,
      updatedAt: input.generatedAt,
      freshness: goalContextRefs.length > 0 || agentGoalRefs.length > 0 ? "fresh" : "unknown",
      confidence: goalContextRefs.length > 0 || agentGoalRefs.length > 0 ? 0.8 : 0.46,
      evidenceRefs: unique([...goalContextRefs, ...agentGoalRefs]),
      inputRefs: unique([...processBadgeIds.slice(0, 6), ...packetRefs.slice(0, 6), ...runRefs.slice(0, 6)]),
      inputPreview: "GoalContextUpdate records remain non-terminal observations.",
      transformLabel: "goal context update index",
      outputRefs: unique([...goalContextRefs.slice(0, 12), ...agentGoalRefs.slice(0, 8)]),
      outputPreview: "queryable context for active agent goals",
    },
    admission: "auto",
  }));

  const goalSessionBadgeIdsByGoalId = new Map<string, string>();
  for (const session of input.agentGoalSessions.slice(0, 8)) {
    const sessionId = agentGoalSessionBadgeId(session.goalId);
    goalSessionBadgeIdsByGoalId.set(session.goalId, sessionId);
    const latestCheckpoint = session.checkpoints.at(-1) ?? null;
    const sessionEvidenceRefs = unique([
      session.goalId,
      ...session.sourceRefs,
      ...session.loopRefs,
      ...session.constructRefs,
      ...(latestCheckpoint?.evidenceRefs ?? []),
    ]);
    pushBadge(badges, badge({
      id: sessionId,
      title: `Goal session: ${session.userVisibleSummary}`,
      plainMeaning: "A durable agent goal session is tracking allowed context feeds and actuator bounds.",
      whyItMatters: "Goal sessions let the agent inspect and steer deterministic workstation loops without becoming the long-running host.",
      kind: "agent_goal_session",
      status: session.status === "active" ? "observed" : session.status === "blocked" ? "blocked" : "stale",
      subjects: unique([session.goalId, ...session.sourceRefs.slice(0, 6), ...session.loopRefs.slice(0, 6)]),
      tags: [
        "agent_goal_session",
        session.status,
        session.cadence.kind,
        session.authority.finalReportsRequireTerminalAuthority ? "terminal_authority_required" : "terminal_authority_missing",
      ],
      sourceRefs: uniqueBy(
        [
          { kind: "agent_goal_session" as const, id: session.goalId },
          ...session.sourceRefs.slice(0, 8).map((id) => ({ kind: "synthetic_evidence" as const, id })),
        ],
        (ref) => `${ref.kind}:${ref.id}`,
      ),
      evidenceRefs: sessionEvidenceRefs,
      confidence: session.status === "active" ? 0.82 : session.status === "blocked" ? 0.58 : 0.5,
      missingEvidence: session.authority.finalReportsRequireTerminalAuthority
        ? []
        : ["Final reports must require terminal authority."],
      reasonCodes: ["agent_goal_session", "goal_directed_operator_context", "terminal_authority_required"],
      dataTray: {
        title: session.userVisibleSummary,
        summary: `${session.contextFeeds.length} feed(s), ${session.allowedActuators.length} allowed actuator(s), ${session.checkpoints.length} checkpoint(s).`,
        updatedAt: latestCheckpoint ? new Date(latestCheckpoint.createdAtMs).toISOString() : input.generatedAt,
        freshness: session.status === "active" ? "fresh" : session.status === "blocked" ? "stale" : "unknown",
        confidence: session.status === "active" ? 0.82 : session.status === "blocked" ? 0.58 : 0.5,
        evidenceRefs: sessionEvidenceRefs,
        inputRefs: session.contextFeeds.map((feed) => feed.sourceKind).slice(0, 10),
        inputPreview: session.objective,
        transformLabel: "agent goal session policy",
        outputRefs: unique([session.goalId, ...(latestCheckpoint?.evidenceRefs ?? [])]).slice(0, 12),
        outputPreview: latestCheckpoint?.summary ?? "awaiting first checkpoint",
        skipped: session.stopConditions.slice(0, 4),
        blockedUntil: session.authority.finalReportsRequireTerminalAuthority ? "completed solver path selects final report" : "terminal authority policy",
      },
      admission: "auto",
    }));
    pushEdge(edges, {
      from: goalContextBusId,
      to: sessionId,
      relation: "contains",
      label: "goal context bus contains active goal session",
      evidenceRefs: sessionEvidenceRefs,
      reasonCodes: ["goal_context_bus_contains_session"],
    });
    if (session.allowedActuators.length > 0) {
      pushEdge(edges, {
        from: sessionId,
        to: controlId,
        relation: "constrains",
        label: "agent goal actuator policy bounds control signals",
        evidenceRefs: unique([...sessionEvidenceRefs, ...session.allowedActuators]),
        reasonCodes: ["agent_goal_session_bounds_control_signals", "agent_actuator_policy"],
      });
    }
    if (
      session.allowedActuators.includes("bind_narrator") ||
      session.allowedActuators.includes("narrator_bind_stream") ||
      session.allowedActuators.includes("narrator_say")
    ) {
      pushEdge(edges, {
        from: sessionId,
        to: outputBusId,
        relation: "constrains",
        label: "agent goal narrator actuator policy bounds output bus",
        evidenceRefs: unique([...sessionEvidenceRefs, ...session.allowedActuators]),
        reasonCodes: ["agent_goal_session_bounds_output_bus", "narrator_actuator_policy"],
      });
    }
  }

  for (const update of input.goalContextUpdates.slice(0, 12)) {
    const updateId = goalContextUpdateBadgeId(update.updateId);
    const dispatchKinds = update.suggestedDispatch.map((action) => action.kind);
    const updateEvidenceRefs = unique([
      update.updateId,
      update.contentRef,
      ...update.evidenceRefs,
      ...update.receiptRefs,
      ...update.sourceRefs,
      ...update.loopRefs,
    ]);
    const feedPolicyRefs = updateEvidenceRefs.filter((ref) =>
      ref.startsWith("context_feed:") ||
      ref.startsWith("allowed_actuator:") ||
      ref.startsWith("workstation_context_feed:") ||
      ref.startsWith("workstation_actuator:")
    );
    const feedPolicyReasonCodes = feedPolicyRefs.length > 0
      ? ["feed_query_policy", "agent_goal_feed_policy", "actuator_policy_ref"]
      : [];
    pushBadge(badges, badge({
      id: updateId,
      title: `Goal update: ${update.updateKind.replace(/_/g, " ")}`,
      plainMeaning: "A durable workstation goal-context update was recorded as evidence for future agent turns.",
      whyItMatters: "These updates are the deterministic runtime substrate: queryable, freshness-aware, and explicitly non-terminal.",
      kind: "goal_context_update",
      status: update.freshness.status === "blocked" ? "blocked" : update.freshness.status === "stale" ? "stale" : "observed",
      subjects: unique([update.updateId, update.contentRef, update.goalRelevance?.goalId, ...update.sourceRefs.slice(0, 6)].filter(isNonEmptyString)),
      tags: [
        "goal_context_update",
        update.producerKind,
        update.updateKind,
        update.freshness.status,
        ...dispatchKinds.map((kind) => `dispatch:${kind}`),
      ],
      sourceRefs: uniqueBy(
        [
          { kind: "workstation_goal_context_update" as const, id: update.updateId },
          ...update.sourceRefs.slice(0, 8).map((id) => ({ kind: "synthetic_evidence" as const, id })),
        ],
        (ref) => `${ref.kind}:${ref.id}`,
      ),
      evidenceRefs: updateEvidenceRefs,
      confidence: update.freshness.status === "fresh" ? 0.82 : update.freshness.status === "blocked" ? 0.58 : 0.66,
      missingEvidence: update.freshness.status === "blocked" ? ["The update is blocked until its missing requirement is satisfied."] : [],
      reasonCodes: [
        "goal_context_update",
        update.producerKind,
        update.updateKind,
        "observation_not_terminal_authority",
        ...feedPolicyReasonCodes,
      ],
      dataTray: {
        title: update.updateKind.replace(/_/g, " "),
        summary: update.preview,
        updatedAt: new Date(update.createdAtMs).toISOString(),
        freshness: update.freshness.status,
        confidence: update.freshness.status === "fresh" ? 0.82 : update.freshness.status === "blocked" ? 0.58 : 0.66,
        evidenceRefs: updateEvidenceRefs,
        inputRefs: unique([...update.sourceRefs, ...update.loopRefs]).slice(0, 10),
        inputPreview: update.goalRelevance?.reason ?? update.contentRef,
        transformLabel: `${update.producerKind} -> ${update.updateKind}`,
        outputRefs: unique([update.contentRef, ...dispatchKinds, ...feedPolicyRefs]).slice(0, 12),
        outputPreview: dispatchKinds.length > 0 ? `dispatch: ${dispatchKinds.join(", ")}` : "no dispatch suggested",
        skipped: [
          "assistant_answer=false",
          "terminal_eligible=false",
          "raw_content_included=false",
        ],
        blockedUntil: update.authority.postToolModelStepRequired ? "post-tool model step and terminal authority" : null,
      },
      admission: "auto",
    }));
    pushEdge(edges, {
      from: goalContextBusId,
      to: updateId,
      relation: "contains",
      label: "goal context bus contains update",
      evidenceRefs: updateEvidenceRefs,
      reasonCodes: ["goal_context_bus_contains_update"],
    });
    if (feedPolicyRefs.length > 0) {
      pushEdge(edges, {
        from: updateId,
        to: controlId,
        relation: "constrains",
        label: "feed query policy bounds agent actuator",
        evidenceRefs: feedPolicyRefs,
        reasonCodes: ["feed_query_policy_bounds_actuator", "agent_goal_feed_policy"],
      });
    }
    const isStreamContextUpdate =
      update.producerKind === "audio_capture" ||
      update.producerKind === "transcription_loop" ||
      update.producerKind === "translation_loop";
    const isOutputContextUpdate =
      update.producerKind === "translation_loop" ||
      update.producerKind === "live_answer" ||
      update.producerKind === "narrator" ||
      update.updateKind === "translated_transcript" ||
      dispatchKinds.includes("update_live_answer") ||
      dispatchKinds.includes("speak_narrator") ||
      dispatchKinds.includes("bind_narrator_stream");
    if (isStreamContextUpdate) {
      pushEdge(edges, {
        from: updateId,
        to: sourceBusId,
        relation: "feeds",
        label: "stream goal-context update feeds source bus",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: ["stream_goal_context_update_feeds_source_bus", update.producerKind],
      });
    }
    if (isStreamContextUpdate && !dispatchKinds.includes("set_loop_state")) {
      pushEdge(edges, {
        from: updateId,
        to: processLoopId,
        relation: "feeds",
        label: "stream goal-context update feeds process loop",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: ["stream_goal_context_update_feeds_process_loop", update.producerKind],
      });
    }
    if (isOutputContextUpdate) {
      pushEdge(edges, {
        from: updateId,
        to: outputBusId,
        relation: "feeds",
        label: "output goal-context update feeds output bus",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: ["goal_context_update_feeds_output_bus", update.producerKind, update.updateKind],
      });
    }
    if (
      update.producerKind === "route_watch" ||
      update.producerKind === "automation" ||
      update.updateKind === "automation_status"
    ) {
      pushEdge(edges, {
        from: updateId,
        to: controlId,
        relation: "feeds",
        label: update.producerKind === "automation" || update.updateKind === "automation_status"
          ? "automation update feeds control signals"
          : "route-watch update feeds control signals",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: [
          update.producerKind === "automation" || update.updateKind === "automation_status"
            ? "automation_update_feeds_control"
            : "route_watch_update_feeds_control",
        ],
      });
    }
    if (dispatchKinds.includes("set_loop_state")) {
      pushEdge(edges, {
        from: updateId,
        to: processLoopId,
        relation: "feeds",
        label: "goal-context dispatch updates process loop state",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: ["goal_context_dispatch_feeds_process_loop"],
      });
    }
    const sessionId = update.goalRelevance?.goalId
      ? goalSessionBadgeIdsByGoalId.get(update.goalRelevance.goalId)
      : null;
    if (sessionId) {
      pushEdge(edges, {
        from: updateId,
        to: sessionId,
        relation: "feeds",
        label: "goal-context update feeds agent goal session",
        evidenceRefs: updateEvidenceRefs,
        reasonCodes: ["goal_context_update_feeds_session"],
      });
    }
  }

  const runPromptIds = new Set(input.microReasoners.runs.map((run) => run.promptId).filter(isNonEmptyString));
  const circuitPrompts = uniqueBy(
    [
      ...input.microReasoners.prompts.filter((prompt) => runPromptIds.has(prompt.promptId)),
      ...input.microReasoners.prompts.slice(-12),
    ],
    (prompt) => prompt.promptId,
  );
  const promptBadgeIdsByPromptId = new Map<string, string>();
  for (const prompt of circuitPrompts) {
    const promptId = statePlaneDeckPromptBadgeId(prompt.promptId);
    promptBadgeIdsByPromptId.set(prompt.promptId, promptId);
    pushBadge(badges, badge({
      id: promptId,
      title: `MicroDeck prompt: ${prompt.title}`,
      plainMeaning: `Active ${prompt.role} MicroDeck prompt available to process live-source packets.`,
      whyItMatters: "Showing prompts as individual circuit elements makes the live deck configuration inspectable without treating prompt text as an answer.",
      kind: "workstation_state_plane",
      status: prompt.active ? "observed" : "stale",
      subjects: [prompt.promptId, prompt.role],
      tags: ["workstation_state_plane", "microdeck_prompt", "micro_reasoner", prompt.role],
      sourceRefs: [{ kind: "synthetic_evidence", id: prompt.promptId }],
      evidenceRefs: [prompt.promptId],
      confidence: prompt.active ? 0.78 : 0.48,
      reasonCodes: ["microdeck_prompt", "packet_circuit_component", "not_terminal_authority"],
      dataTray: {
        title: prompt.title,
        summary: `${prompt.role}; ${prompt.modelPreference}; ${prompt.inputSchemaName} -> ${prompt.outputSchemaName}.`,
        updatedAt: prompt.updatedAt,
        freshness: prompt.active ? "fresh" : "stale",
        confidence: prompt.active ? 0.78 : 0.48,
        evidenceRefs: [prompt.promptId],
        inputRefs: [prompt.inputSchemaName],
        inputPreview: prompt.role,
        transformLabel: "MicroDeck prompt policy",
        outputRefs: [prompt.outputSchemaName],
        outputPreview: `${prompt.maxInputItems} input item(s); ${prompt.maxOutputTokens ?? "default"} output token budget`,
      },
      admission: "auto",
    }));
    pushEdge(edges, {
      from: bufferId,
      to: promptId,
      relation: "contains",
      label: "MicroDeck buffer contains active prompt",
      evidenceRefs: [prompt.promptId],
      reasonCodes: ["microdeck_buffer_contains_prompt"],
    });
  }

  const runBadgeIdsByRunId = new Map<string, string>();
  for (const run of input.microReasoners.runs.slice(-12)) {
    const runId = statePlaneDeckRunBadgeId(run.runId);
    runBadgeIdsByRunId.set(run.runId, runId);
    const runEvidenceRefs = unique([run.runId, ...run.inputRefs, ...run.outputRefs]);
    pushBadge(badges, badge({
      id: runId,
      title: `Deck run: ${run.role}`,
      plainMeaning: `A recent MicroDeck run processed source mail for ${run.sourceId}.`,
      whyItMatters: "Deck-run nodes let packet traffic show which micro-reasoners transformed a source packet and whether those jobs were independent or chained.",
      kind: "workstation_state_plane",
      status: run.status === "completed" ? "observed" : run.status === "failed" ? "blocked" : "candidate",
      subjects: unique([run.runId, run.sourceId, run.role, ...(run.promptId ? [run.promptId] : [])]),
      tags: [
        "workstation_state_plane",
        "microdeck_run",
        "packet_circuit",
        run.role,
        run.deckExecutionMode ?? "execution_mode_unknown",
      ],
      sourceRefs: uniqueBy(
        [
          { kind: "synthetic_evidence" as const, id: run.runId },
          ...(run.promptId ? [{ kind: "synthetic_evidence" as const, id: run.promptId }] : []),
        ],
        (ref) => `${ref.kind}:${ref.id}`,
      ),
      evidenceRefs: runEvidenceRefs,
      confidence: run.status === "completed" ? 0.8 : run.status === "failed" ? 0.52 : 0.62,
      missingEvidence: run.missingEvidence ?? [],
      reasonCodes: ["microdeck_run", "packet_circuit_component", run.status],
      dataTray: {
        title: `${run.role} run`,
        summary: `${run.status}; ${run.reasoningMode ?? "reasoning mode unknown"}; source ${run.sourceId}.`,
        updatedAt: run.completedAt ?? run.startedAt,
        freshness: run.status === "completed" ? "fresh" : run.status === "failed" ? "stale" : "unknown",
        confidence: run.status === "completed" ? 0.8 : run.status === "failed" ? 0.52 : 0.62,
        evidenceRefs: runEvidenceRefs,
        inputRefs: unique([run.sourceId, ...run.mailIds, ...run.inputRefs]).slice(0, 10),
        inputPreview: compactPreview(run.inputPreview, `${run.mailIds.length} mail item(s)`, 140),
        transformLabel: run.deckRunPlan
          ? `MicroDeck ${run.deckRunPlan} / ${run.deckExecutionMode ?? "execution"}`
          : "MicroDeck run",
        outputRefs: unique([run.runId, ...run.outputRefs]).slice(0, 10),
        outputPreview: compactPreview(run.outputPreview, run.selectedDecision ?? run.status, 140),
        skipped: run.missingEvidence?.slice(0, 5),
      },
      admission: "auto",
    }));
    pushEdge(edges, {
      from: bufferId,
      to: runId,
      relation: "contains",
      label: "MicroDeck buffer contains recent run",
      evidenceRefs: runEvidenceRefs,
      reasonCodes: ["microdeck_buffer_contains_run"],
    });
    pushEdge(edges, {
      from: sourceBusId,
      to: runId,
      relation: "feeds",
      label: "source bus feeds MicroDeck run",
      evidenceRefs: runEvidenceRefs,
      reasonCodes: ["source_bus_feeds_microdeck_run"],
    });
    if (run.promptId) {
      const promptId = promptBadgeIdsByPromptId.get(run.promptId);
      if (promptId) {
        pushEdge(edges, {
          from: promptId,
          to: runId,
          relation: "feeds",
          label: "prompt policy feeds deck run",
          evidenceRefs: unique([run.promptId, run.runId]),
          reasonCodes: ["microdeck_prompt_feeds_run"],
        });
      }
    }
  }

  const packetBadgeIdsByPacketId = new Map<string, string>();
  for (const packet of input.microReasoners.packets.slice(-10)) {
    const packetId = statePlanePacketBadgeId(packet.packetId);
    packetBadgeIdsByPacketId.set(packet.packetId, packetId);
    const packetEvidenceRefs = unique([
      packet.packetId,
      ...packet.mailIds,
      ...packet.visualEvidenceRefs,
      ...packet.evidenceRefs,
      ...packet.microReasonerRunRefs,
    ]);
    pushBadge(badges, badge({
      id: packetId,
      title: `Packet: ${packet.resolutionState}`,
      plainMeaning: `Processed source packet from ${packet.sourceId} with MicroDeck run refs and routing disposition.`,
      whyItMatters: "Packet nodes make each live-source journey debuggable: source receipts, MicroDeck transforms, gate decisions, and output destinations stay separated per packet.",
      kind: "workstation_state_plane",
      status: packet.resolutionState === "deferred_for_pressure" ? "stale" : "observed",
      subjects: unique([packet.packetId, packet.sourceId, ...packet.mailIds, ...packet.microReasonerRunRefs.slice(0, 6)]),
      tags: [
        "workstation_state_plane",
        "processed_mail_packet",
        "packet_circuit",
        packet.resolutionState,
        packet.recommendedNext,
        packet.salience.level,
      ],
      sourceRefs: uniqueBy(
        [
          { kind: "synthetic_evidence" as const, id: packet.packetId },
          ...packet.mailIds.map((id) => ({ kind: "synthetic_evidence" as const, id })),
          ...packet.microReasonerRunRefs.map((id) => ({ kind: "synthetic_evidence" as const, id })),
        ],
        (ref) => `${ref.kind}:${ref.id}`,
      ),
      evidenceRefs: packetEvidenceRefs,
      confidence: packet.resolutionState === "processed_packet_ready" ? 0.82 : 0.72,
      missingEvidence: packet.uncertainties.slice(0, 5),
      reasonCodes: ["processed_mail_packet", "packet_circuit_trace", packet.resolutionState, packet.recommendedNext],
      dataTray: {
        title: packet.packetId,
        summary: `${packet.sourceId}; ${packet.resolutionState}; next ${packet.recommendedNext}; salience ${packet.salience.level}.`,
        updatedAt: packet.createdAt,
        freshness: packet.resolutionState === "deferred_for_pressure" ? "stale" : "fresh",
        confidence: packet.resolutionState === "processed_packet_ready" ? 0.82 : 0.72,
        evidenceRefs: packetEvidenceRefs,
        inputRefs: unique([packet.sourceId, ...packet.mailIds, ...packet.visualEvidenceRefs]).slice(0, 10),
        inputPreview: packet.mailIds.join(", ") || packet.sourceId,
        transformLabel: "source mail -> MicroDeck packet circuit",
        outputRefs: unique([
          ...packet.microReasonerRunRefs,
          ...packet.evidenceRefs,
          packet.recommendedNext,
        ]).slice(0, 12),
        outputPreview: compactPreview(
          [
            packet.observedFacts[0],
            packet.inferredFacts[0],
            `recommended: ${packet.recommendedNext}`,
          ].filter(Boolean).join(" | "),
          packet.resolutionState,
          170,
        ),
        skipped: packet.uncertainties.slice(0, 5),
        blockedUntil: packetRoutesToGate(packet.recommendedNext) ? "route authority / checkpoint gate" : null,
      },
      admission: "auto",
    }));
    pushEdge(edges, {
      from: sourceBusId,
      to: packetId,
      relation: "feeds",
      label: "source bus feeds packet",
      evidenceRefs: packetEvidenceRefs,
      reasonCodes: ["source_bus_feeds_packet"],
    });
    pushEdge(edges, {
      from: processLoopId,
      to: packetId,
      relation: "contains",
      label: "process loop contains packet trace",
      evidenceRefs: packetEvidenceRefs,
      reasonCodes: ["process_loop_contains_packet"],
    });
    for (const runRef of packet.microReasonerRunRefs.slice(0, 10)) {
      const runId = runBadgeIdsByRunId.get(runRef);
      if (!runId) continue;
      pushEdge(edges, {
        from: runId,
        to: packetId,
        relation: "produces",
        label: "MicroDeck run contributes to packet",
        evidenceRefs: unique([runRef, packet.packetId]),
        reasonCodes: ["microdeck_run_produces_packet"],
      });
    }
    if (packetRoutesToGate(packet.recommendedNext)) {
      pushEdge(edges, {
        from: packetId,
        to: gateId,
        relation: "needs_check",
        label: "packet route needs gate review",
        evidenceRefs: packetEvidenceRefs,
        reasonCodes: ["packet_route_needs_gate", packet.recommendedNext],
      });
    }
    if (packetRoutesToOutput(packet.recommendedNext)) {
      pushEdge(edges, {
        from: packetId,
        to: outputBusId,
        relation: "feeds",
        label: "packet route feeds output lane",
        evidenceRefs: packetEvidenceRefs,
        reasonCodes: ["packet_route_feeds_output", packet.recommendedNext],
      });
    }
  }

  for (const childId of [sourceBusId, gateId, bufferId, processLoopId, outputBusId, controlId, goalContextBusId]) {
    pushEdge(edges, {
      from: rootId,
      to: childId,
      relation: "contains",
      label: "state plane contains circuit role",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["workstation_state_plane_contains_role"],
    });
  }
  pushEdge(edges, {
    from: sourceBusId,
    to: input.observerId,
    relation: "feeds",
    label: "source bus feeds observer custody",
    evidenceRefs: statePlaneEvidenceRefs,
    reasonCodes: ["source_bus_feeds_observer"],
  });
  if (input.interpreterId) {
    pushEdge(edges, {
      from: bufferId,
      to: input.interpreterId,
      relation: "feeds",
      label: "MicroDeck buffer feeds interpreter reflection",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["microdeck_feeds_interpreter"],
    });
  }
  for (const sourceBadgeId of sourceBadgeIds.slice(0, 12)) {
    pushEdge(edges, {
      from: sourceBusId,
      to: sourceBadgeId,
      relation: "contains",
      label: "source bus groups source badge",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["source_bus_groups_source"],
    });
  }
  for (const processBadgeId of processBadgeIds.slice(0, 16)) {
    pushEdge(edges, {
      from: processLoopId,
      to: processBadgeId,
      relation: "contains",
      label: "process loop groups transform badge",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["process_loop_groups_transform"],
    });
  }
  for (const outputBadgeId of outputBadgeIds.slice(0, 8)) {
    pushEdge(edges, {
      from: outputBusId,
      to: outputBadgeId,
      relation: "contains",
      label: "output bus groups projection badge",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["output_bus_groups_projection"],
    });
  }
  pushEdge(edges, {
    from: gateId,
    to: outputBusId,
    relation: "constrains",
    label: "gates constrain output projection",
    evidenceRefs: statePlaneEvidenceRefs,
    reasonCodes: ["gates_constrain_outputs"],
  });
  pushEdge(edges, {
    from: processLoopId,
    to: outputBusId,
    relation: "produces",
    label: "process loop produces output candidates",
    evidenceRefs: statePlaneEvidenceRefs,
    reasonCodes: ["process_loop_produces_outputs"],
  });
  for (const controlBadgeId of controlBadgeIds.slice(0, 8)) {
    pushEdge(edges, {
      from: controlId,
      to: controlBadgeId,
      relation: "contains",
      label: "control signal groups checkpoint or perturbation",
      evidenceRefs: statePlaneEvidenceRefs,
      reasonCodes: ["control_signal_groups_checkpoint"],
    });
  }
};

const applyStagePlayProcessingSummaryTrays = (
  badges: StagePlayBadgeV1[],
  input: {
    graphId: string;
    generatedAt: string;
  },
): void => {
  const badgeCount = badges.length;
  const affordanceCount = badges.filter((entry) => entry.kind === "affordance").length;
  const blockedCount = badges.filter((entry) => entry.kind === "blocked_affordance" || entry.status === "blocked").length;
  const outputPreview = `graph badges: ${badgeCount}; affordances: ${affordanceCount}; blocked: ${blockedCount}`;
  for (const id of ["interpreter.stage_play_reflection", "interpreter.visual_scene"]) {
    const entry = badges.find((badgeEntry) => badgeEntry.id === id);
    if (!entry?.dataTray) continue;
    entry.dataTray = {
      ...entry.dataTray,
      updatedAt: input.generatedAt,
      outputRefs: unique([...(entry.dataTray.outputRefs ?? []), input.graphId]),
      outputPreview,
    };
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
  const readOnly = input.readOnly === true;
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
  const graphId = !roomId && !hasAdmittedSourceWindowRefs
    ? `stage_play_badge_graph:${hashShort([input.threadId, "missing-room", resolvedAt])}`
    : `stage_play_badge_graph:${hashShort([
        input.threadId,
        roomId,
        sourceWindow.latestSnapshotRefs,
        sourceWindow.latestObservationRefs,
        sourceWindow.sourceRoutes.map((route) => [
          route.sourceId,
          route.modality,
          route.routeTo,
          route.selected,
        ]),
        input.objective ?? null,
      ])}`;
  const jobId = `stage_play_job:${hashShort([
    input.threadId,
    roomId,
    sourceWindow.environmentId ?? input.environmentId ?? null,
    input.sourceId ?? null,
  ])}`;
  const graphGoalContextUpdates = listStagePlayGoalContextUpdates({
    threadId: input.threadId,
    sourceRef: input.sourceId ?? null,
    limit: 24,
  });
  const graphAgentGoalSessions = listStagePlayAgentGoalSessions({
    threadId: input.threadId,
    sourceRef: input.sourceId ?? null,
    limit: 12,
  });
  const askCheckpointReceiptCandidate = input.askCheckpointReceipt ?? getLatestStagePlayAskCheckpointReceipt({
    threadId: input.threadId,
    roomId,
    environmentId: sourceWindow.environmentId ?? input.environmentId ?? null,
    graphId,
  });
  if (!roomId && !hasAdmittedSourceWindowRefs) {
    const missingBadges: StagePlayBadgeV1[] = [];
    const missingEdges: StagePlayBadgeGraphV1["edges"] = [];
    const missingObserverId = pushBadge(missingBadges, observerBadge({
      sourceRefs: [],
      evidenceRefs: [],
      sources: sourceWindow.sources,
    }));
    const missingGraphSourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
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
    };
    const checkpointFreshness = evaluateStagePlayCheckpointFreshness({
      graph: buildStagePlayBadgeGraphV1({
        generatedAt: resolvedAt,
        graphId,
        title: "Stage Play Badge Graph",
        description: "No room source window has been admitted yet.",
        sourceWindow: missingGraphSourceWindow,
        badges: [],
        edges: [],
        recommendedActions: [],
      }),
      checkpoint: checkpointCandidateFromReceipt(askCheckpointReceiptCandidate),
    });
    const askCheckpointReceipt = checkpointFreshness.fresh ? askCheckpointReceiptCandidate : null;
    if (askCheckpointReceipt && !readOnly) {
      completeStagePlayCheckpointRequestForGraph({
        graphId,
        checkpointRequestId: askCheckpointReceipt.checkpointRequestId,
        now: resolvedAt,
      });
    }
    addPipelineSkeleton(missingBadges, missingEdges, {
      observerId: missingObserverId,
      graphId,
      sourceRefs: [],
      evidenceRefs: [],
      sources: sourceWindow.sources,
      generatedAt: resolvedAt,
      askCheckpointReceipt,
      checkpointFreshness,
      latestVisualEvidence: null,
    });
    addVisualCaptureCheckpointChain(missingBadges, missingEdges, {
      observerId: missingObserverId,
      sourceRefs: [],
      evidenceRefs: [],
      sources: sourceWindow.sources,
      generatedAt: resolvedAt,
      latestVisualEvidence: null,
    });
    const baseGraph = buildStagePlayBadgeGraphV1({
      generatedAt: resolvedAt,
      graphId,
      title: "Stage Play Badge Graph",
      description: "No room source window has been admitted yet.",
      sourceWindow: missingGraphSourceWindow,
      badges: missingBadges,
      edges: missingEdges,
      recommendedActions: [],
    });
    const perturbationResult = readOnly
      ? {
          event: null,
          latestEvents: listStagePlayPerturbationEvents({ jobId, limit: 10 }),
        }
      : recordStagePlayPerturbationFromGraph({
          jobId,
          graph: baseGraph,
          now: resolvedAt,
        });
    if (!readOnly) {
      recordStagePlayCheckpointRequestFromPerturbation({
        jobId,
        graph: baseGraph,
        perturbation: perturbationResult.event,
        objective: input.objective ?? baseGraph.description,
        now: resolvedAt,
      });
    }
    const checkpointRequests = prioritizeCheckpointRequestsForGraph(
      listStagePlayCheckpointRequests({ jobId, limit: 10 }),
      graphId,
    );
    addLatestPerturbationNode(missingBadges, missingEdges, perturbationResult.latestEvents);
    addPerturbationBadges(missingBadges, missingEdges, perturbationResult.latestEvents);
    addCheckpointRequestBadges(missingBadges, missingEdges, checkpointRequests, perturbationResult.latestEvents);
    addWorkstationStatePlaneBadges(missingBadges, missingEdges, {
      observerId: missingObserverId,
      graphId,
      sourceRefs: [],
      evidenceRefs: [],
      sources: sourceWindow.sources,
      generatedAt: resolvedAt,
      checkpointFreshness,
      microReasoners: collectMicroReasonerState(sourceWindow.sources),
      goalContextUpdates: graphGoalContextUpdates,
      agentGoalSessions: graphAgentGoalSessions,
    });
    applyStagePlayProcessingSummaryTrays(missingBadges, {
      graphId,
      generatedAt: resolvedAt,
    });
    return buildStagePlayBadgeGraphV1({
      generatedAt: resolvedAt,
      graphId,
      title: "Stage Play Badge Graph",
      description: "No room source window has been admitted yet.",
      sourceWindow: missingGraphSourceWindow,
      badges: missingBadges,
      edges: missingEdges,
      recommendedActions: [],
      perturbations: perturbationResult.latestEvents,
      checkpointRequests,
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
  const latestVisualEvidence = latestVisualEvidenceForGraph({
    threadId: input.threadId,
    sourceIds: sourceWindow.sources.map((source) => source.sourceId),
  });
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
    const visualOutputRefs = latestVisualEvidence?.source_id === descriptor.sourceId
      ? unique([latestVisualEvidence.frame_id, latestVisualEvidence.evidence_id])
      : [];
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
      dataTray: {
        title: descriptor.modality.replace(/_/g, " "),
        summary: `Source ${descriptor.state}; ${descriptor.latestObservationRefs.length} latest observation ref(s).`,
        updatedAt: resolvedAt,
        freshness: descriptor.state === "stale" || descriptor.state === "paused" ? "stale" : "fresh",
        confidence: descriptor.state === "active" || descriptor.state === "active_interval" ? 0.84 : 0.62,
        evidenceRefs: unique([descriptor.descriptorId, ...(matchingProducer ? [matchingProducer.producerId] : []), ...descriptor.latestObservationRefs]),
        inputRefs: [descriptor.sourceId],
        inputPreview: descriptor.sourceId,
        transformLabel: /visual|frame|screen/i.test(descriptor.modality)
          ? "Visual frame producer / source descriptor"
          : "live source descriptor",
        outputRefs: visualOutputRefs.length > 0
          ? visualOutputRefs
          : unique([...(matchingProducer?.latestChunkId ? [matchingProducer.latestChunkId] : []), ...descriptor.latestObservationRefs]).slice(0, 5),
        outputPreview: visualOutputRefs[0]
          ? `${descriptor.state} -> ${visualOutputRefs[0]}`
          : `${descriptor.state}; ${matchingProducer?.latestChunkId ?? "no latest frame chunk"}`,
      },
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
    const visualOutputRefs = latestVisualEvidence?.source_id === producer.sourceId
      ? unique([latestVisualEvidence.frame_id, latestVisualEvidence.evidence_id])
      : [];
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
      dataTray: {
        title: producer.modality.replace(/_/g, " "),
        summary: `Producer ${producer.status}; ${producer.latestChunkId ?? "no latest chunk"}.`,
        updatedAt: resolvedAt,
        freshness: producer.status === "stale" || producer.status === "paused" ? "stale" : "fresh",
        confidence: producer.status === "active" ? 0.78 : 0.58,
        evidenceRefs: unique([producer.producerId, producer.latestChunkId].filter(Boolean) as string[]),
        inputRefs: [producer.sourceId],
        inputPreview: producer.sourceId,
        transformLabel: /visual|frame|screen/i.test(producer.modality)
          ? "Visual frame producer / source descriptor"
          : "live source producer",
        outputRefs: visualOutputRefs.length > 0
          ? visualOutputRefs
          : unique([producer.latestChunkId].filter(Boolean) as string[]),
        outputPreview: visualOutputRefs[0]
          ? `${producer.status} -> ${visualOutputRefs[0]}`
          : `${producer.status}; ${producer.latestChunkId ?? "no latest frame chunk"}`,
      },
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
    dataTray: {
      title: "Stage Play interpreter",
      summary: "reflect_stage_play_context reduces compact evidence into graph badges.",
      updatedAt: resolvedAt,
      freshness: sourceRefs.length > 0 ? "fresh" : "missing",
      confidence: sourceRefs.length > 0 ? 0.76 : 0.4,
      evidenceRefs,
      inputRefs: unique([
        ...(latestVisualEvidence?.evidence_id ? [latestVisualEvidence.evidence_id] : []),
        ...sourceWindow.latestSourceDescriptorRefs.slice(0, 4),
      ]),
      inputPreview: latestVisualEvidence?.summary
        ? compactPreview(latestVisualEvidence.summary, "Latest compact visual evidence.")
        : "Compact source window and live source descriptors.",
      transformLabel: "reflect_stage_play_context",
      outputRefs: [graphId],
      outputPreview: "graph badges pending",
    },
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

  const graphSourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
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
  };
  const checkpointFreshness = evaluateStagePlayCheckpointFreshness({
    graph: buildStagePlayBadgeGraphV1({
      generatedAt: resolvedAt,
      graphId,
      title: "Stage Play Badge Graph",
      description: "Deterministic badge graph reducer over the compact Stage Play source window.",
      sourceWindow: graphSourceWindow,
      badges: [],
      edges: [],
      recommendedActions: [],
    }),
    checkpoint: checkpointCandidateFromReceipt(askCheckpointReceiptCandidate),
  });
  const askCheckpointReceipt = checkpointFreshness.fresh ? askCheckpointReceiptCandidate : null;
  if (askCheckpointReceipt && !readOnly) {
    completeStagePlayCheckpointRequestForGraph({
      graphId,
      checkpointRequestId: askCheckpointReceipt.checkpointRequestId,
      now: resolvedAt,
    });
  }

  addPipelineSkeleton(badges, edges, {
    observerId,
    interpreterId,
    graphId,
    sourceRefs,
    evidenceRefs,
    sources: sourceWindow.sources,
    generatedAt: resolvedAt,
    askCheckpointReceipt,
    checkpointFreshness,
    latestVisualEvidence,
  });
  addVisualCaptureCheckpointChain(badges, edges, {
    observerId,
    sourceRefs,
    evidenceRefs,
    sources: sourceWindow.sources,
    generatedAt: resolvedAt,
    latestVisualEvidence,
  });
  const baseGraph = buildStagePlayBadgeGraphV1({
    generatedAt: resolvedAt,
    graphId,
    title: "Stage Play Badge Graph",
    description: "Deterministic badge graph reducer over the compact Stage Play source window.",
    sourceWindow: graphSourceWindow,
    badges,
    edges,
    recommendedActions,
  });
  const perturbationResult = readOnly
    ? {
        event: null,
        latestEvents: listStagePlayPerturbationEvents({ jobId, limit: 10 }),
      }
    : recordStagePlayPerturbationFromGraph({
        jobId,
        graph: baseGraph,
        now: resolvedAt,
      });
  if (!readOnly) {
    recordStagePlayCheckpointRequestFromPerturbation({
      jobId,
      graph: baseGraph,
      perturbation: perturbationResult.event,
      objective: input.objective ?? baseGraph.description,
      now: resolvedAt,
    });
  }
  const checkpointRequests = prioritizeCheckpointRequestsForGraph(
    listStagePlayCheckpointRequests({ jobId, limit: 10 }),
    graphId,
  );
  addLatestPerturbationNode(badges, edges, perturbationResult.latestEvents);
  addPerturbationBadges(badges, edges, perturbationResult.latestEvents);
  addCheckpointRequestBadges(badges, edges, checkpointRequests, perturbationResult.latestEvents);
  addWorkstationStatePlaneBadges(badges, edges, {
    observerId,
    interpreterId,
    graphId,
    sourceRefs,
    evidenceRefs,
    sources: sourceWindow.sources,
    generatedAt: resolvedAt,
    checkpointFreshness,
    microReasoners: collectMicroReasonerState(sourceWindow.sources),
    goalContextUpdates: graphGoalContextUpdates,
    agentGoalSessions: graphAgentGoalSessions,
  });
  applyStagePlayProcessingSummaryTrays(badges, {
    graphId,
    generatedAt: resolvedAt,
  });

  return buildStagePlayBadgeGraphV1({
    generatedAt: resolvedAt,
    graphId,
    title: "Stage Play Badge Graph",
    description: "Deterministic badge graph reducer over the compact Stage Play source window.",
    sourceWindow: graphSourceWindow,
    badges,
    edges,
    recommendedActions,
    perturbations: perturbationResult.latestEvents,
    checkpointRequests,
  });
}
