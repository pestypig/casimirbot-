import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerEnvironmentPreset,
} from "@shared/helix-live-answer-environment";
import type { StagePlayBadgeGraphV1 } from "@shared/contracts/stage-play-badge-graph.v1";
import { validateStagePlayBadgeGraphV1 } from "@shared/contracts/stage-play-badge-graph.v1";
import {
  createLiveAnswerEnvironment,
  getActiveLiveAnswerEnvironmentForRoom,
  getActiveLiveAnswerEnvironmentForSource,
  getActiveLiveAnswerEnvironmentForThread,
  getLiveAnswerEnvironment,
} from "../situation-room/live-answer-environment-store";
import { buildStagePlayGraphFromWorld } from "./stage-play-badge-graph-builder";
import {
  buildStagePlayOutputLaneProjectionV1,
  ensureLiveAnswerEnvironmentHasStagePlayLines,
  reduceLiveAnswerEnvironmentFromStagePlayGraph,
  STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA,
  type StagePlayOutputLaneProjectionV1,
} from "./stage-play-output-lane-reducer";

export type StagePlayProjectLiveAnswerPreferredPreset =
  | "minecraft_run_monitor"
  | "environment_run_monitor"
  | "custom";

export type StagePlayProjectLiveAnswerRequest = {
  threadId?: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
  objective?: string | null;
  ensureStagePlayLineSchema?: boolean;
  createIfMissing?: boolean;
  preferredPreset?: StagePlayProjectLiveAnswerPreferredPreset;
};

export type StagePlayProjectLiveAnswerReason =
  | "projected"
  | "no_active_environment"
  | "line_schema_mismatch"
  | "no_line_changes"
  | "graph_invalid"
  | "environment_not_active";

export type StagePlayProjectLiveAnswerResponse = {
  ok: boolean;
  schema: "stage_play_live_answer_projection_response/v1";
  graph: StagePlayBadgeGraphV1;
  outputLaneProjection: StagePlayOutputLaneProjectionV1;
  liveAnswerDelta: LiveAnswerEnvironmentDelta | null;
  liveAnswerEnvironment: LiveAnswerEnvironment | null;
  projectedLineKeys: string[];
  skippedLineKeys: string[];
  reason: StagePlayProjectLiveAnswerReason;
  validationIssues?: string[];
  lineSchemaDelta?: LiveAnswerEnvironmentDelta | null;
  environmentEnsure?: {
    created: boolean;
    repairedLineSchema: boolean;
    missingBefore: string[];
    addedLineKeys: string[];
  };
  assistant_answer: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  terminal_eligible: false;
};

const DEFAULT_STAGE_PLAY_THREAD_ID = "stage-play-panel";

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const presetForCreate = (
  preset?: StagePlayProjectLiveAnswerPreferredPreset | null,
): LiveAnswerEnvironmentPreset =>
  preset === "minecraft_run_monitor" || preset === "environment_run_monitor" || preset === "custom"
    ? preset
    : "environment_run_monitor";

const selectedSourceIdsForGraph = (graph: StagePlayBadgeGraphV1, sourceId?: string | null): string[] =>
  uniqueStrings([
    sourceId,
    ...graph.sourceWindow.sources
      .filter((source) => source.selectedForStagePlay || source.evidenceRefs.length > 0)
      .map((source) => source.sourceId),
  ]);

const resolveLiveAnswerEnvironment = (input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  sourceId?: string | null;
}): LiveAnswerEnvironment | null =>
  (input.environmentId ? getLiveAnswerEnvironment(input.environmentId) : null) ??
  (input.roomId ? getActiveLiveAnswerEnvironmentForRoom(input.roomId) : null) ??
  (input.sourceId ? getActiveLiveAnswerEnvironmentForSource(input.sourceId) : null) ??
  getActiveLiveAnswerEnvironmentForThread(input.threadId);

const missingStagePlayLineKeys = (environment: LiveAnswerEnvironment | null): string[] => {
  const existingKeys = new Set(environment?.lines.map((line) => line.key) ?? []);
  return STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA
    .map((line) => line.key)
    .filter((key) => !existingKeys.has(key));
};

const createStagePlayLiveAnswerEnvironment = (input: {
  threadId: string;
  roomId?: string | null;
  sourceIds: string[];
  objective?: string | null;
  graph?: StagePlayBadgeGraphV1 | null;
  graphId?: string | null;
  preferredPreset?: StagePlayProjectLiveAnswerPreferredPreset | null;
  ensureStagePlayLineSchema?: boolean;
  now: string;
}): LiveAnswerEnvironment => createLiveAnswerEnvironment({
  thread_id: input.threadId,
  created_turn_id: "turn:stage-play-projection",
  objective: input.objective ?? input.graph?.title ?? "Project Stage Play evidence to Live Answer.",
  room_id: input.roomId ?? input.graph?.sourceWindow.roomId ?? null,
  source_ids: input.sourceIds,
  graph_id: input.graphId ?? input.graph?.graphId ?? null,
  preset: presetForCreate(input.preferredPreset),
  line_schema: input.ensureStagePlayLineSchema || input.preferredPreset === "custom"
    ? STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA
    : null,
  now: input.now,
}).environment;

export function ensureStagePlayLiveAnswerEnvironment(input: {
  threadId: string;
  roomId?: string | null;
  environmentId?: string | null;
  objective?: string | null;
  sourceIds?: string[];
  graphId?: string | null;
  now?: string;
}): {
  environment: LiveAnswerEnvironment;
  created: boolean;
  repairedLineSchema: boolean;
  missingBefore: string[];
  addedLineKeys: string[];
} {
  const now = input.now ?? new Date().toISOString();
  const explicitEnvironment = input.environmentId
    ? getLiveAnswerEnvironment(input.environmentId)
    : null;
  const activeEnvironment = explicitEnvironment ?? (
    input.roomId ? getActiveLiveAnswerEnvironmentForRoom(input.roomId) : null
  ) ?? getActiveLiveAnswerEnvironmentForThread(input.threadId);

  if (explicitEnvironment) {
    const missingBefore = missingStagePlayLineKeys(explicitEnvironment);
    if (explicitEnvironment.status !== "active" || missingBefore.length === 0) {
      return {
        environment: explicitEnvironment,
        created: false,
        repairedLineSchema: false,
        missingBefore,
        addedLineKeys: [],
      };
    }
    const ensured = ensureLiveAnswerEnvironmentHasStagePlayLines({
      environment: explicitEnvironment,
      now,
    });
    const environment = ensured?.environment ?? explicitEnvironment;
    const addedLineKeys = missingBefore.filter((key) =>
      environment.lines.some((line) => line.key === key)
    );
    return {
      environment,
      created: false,
      repairedLineSchema: addedLineKeys.length > 0,
      missingBefore,
      addedLineKeys,
    };
  }

  const missingBefore = missingStagePlayLineKeys(activeEnvironment);
  if (activeEnvironment && activeEnvironment.status === "active" && missingBefore.length === 0) {
    return {
      environment: activeEnvironment,
      created: false,
      repairedLineSchema: false,
      missingBefore: [],
      addedLineKeys: [],
    };
  }

  const environment = createStagePlayLiveAnswerEnvironment({
    threadId: input.threadId,
    roomId: input.roomId ?? activeEnvironment?.room_id ?? null,
    sourceIds: uniqueStrings(input.sourceIds ?? activeEnvironment?.source_ids ?? []),
    objective: input.objective ?? activeEnvironment?.objective ?? null,
    graphId: input.graphId ?? activeEnvironment?.graph_id ?? null,
    preferredPreset: "custom",
    ensureStagePlayLineSchema: true,
    now,
  });

  return {
    environment,
    created: true,
    repairedLineSchema: false,
    missingBefore: activeEnvironment ? missingBefore : STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA.map((line) => line.key),
    addedLineKeys: STAGE_PLAY_LIVE_ANSWER_LINE_SCHEMA.map((line) => line.key),
  };
}

const skippedLineKeysFor = (
  projection: StagePlayOutputLaneProjectionV1,
  environment: LiveAnswerEnvironment | null,
): string[] => {
  const environmentKeys = new Set(environment?.lines.map((line) => line.key) ?? []);
  return uniqueStrings(projection.lanes
    .filter((lane) => lane.lineUpdateAllowed)
    .map((lane) => lane.lineKey)
    .filter((key) => !environmentKeys.has(key)));
};

const updateAllowedSkippedLineKeysFor = (
  projection: StagePlayOutputLaneProjectionV1,
  environment: LiveAnswerEnvironment | null,
): string[] => skippedLineKeysFor(projection, environment);

export function projectStagePlayLiveAnswer(
  input: StagePlayProjectLiveAnswerRequest & { now?: Date | string },
): StagePlayProjectLiveAnswerResponse {
  const now = input.now instanceof Date
    ? input.now.toISOString()
    : typeof input.now === "string"
      ? input.now
      : new Date().toISOString();
  const threadId = input.threadId?.trim() || DEFAULT_STAGE_PLAY_THREAD_ID;
  const graph = buildStagePlayGraphFromWorld({
    threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
    objective: input.objective ?? null,
    now: new Date(now),
  });
  const outputLaneProjection = buildStagePlayOutputLaneProjectionV1({
    graph,
    generatedAt: now,
  });
  const validationIssues = validateStagePlayBadgeGraphV1(graph);
  const baseAuthority = {
    assistant_answer: false as const,
    raw_content_included: false as const,
    context_role: "tool_evidence" as const,
    terminal_eligible: false as const,
  };

  if (validationIssues.length > 0) {
    return {
      ok: false,
      schema: "stage_play_live_answer_projection_response/v1",
      graph,
      outputLaneProjection,
      liveAnswerDelta: null,
      liveAnswerEnvironment: null,
      projectedLineKeys: [],
      skippedLineKeys: outputLaneProjection.lanes.map((lane) => lane.lineKey),
      reason: "graph_invalid",
      validationIssues,
      lineSchemaDelta: null,
      environmentEnsure: undefined,
      ...baseAuthority,
    };
  }

  let liveAnswerEnvironment = resolveLiveAnswerEnvironment({
    threadId,
    roomId: input.roomId ?? null,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
  });

  let environmentEnsure: StagePlayProjectLiveAnswerResponse["environmentEnsure"] | undefined;
  if (input.createIfMissing || input.ensureStagePlayLineSchema) {
    const ensuredEnvironment = ensureStagePlayLiveAnswerEnvironment({
      threadId,
      roomId: input.roomId ?? null,
      environmentId: input.environmentId ?? null,
      objective: input.objective ?? null,
      sourceIds: selectedSourceIdsForGraph(graph, input.sourceId ?? null),
      graphId: graph.graphId,
      now,
    });
    liveAnswerEnvironment = ensuredEnvironment.environment;
    environmentEnsure = {
      created: ensuredEnvironment.created,
      repairedLineSchema: ensuredEnvironment.repairedLineSchema,
      missingBefore: ensuredEnvironment.missingBefore,
      addedLineKeys: ensuredEnvironment.addedLineKeys,
    };
  }

  if (!liveAnswerEnvironment) {
    return {
      ok: true,
      schema: "stage_play_live_answer_projection_response/v1",
      graph,
      outputLaneProjection,
      liveAnswerDelta: null,
      liveAnswerEnvironment: null,
      projectedLineKeys: [],
      skippedLineKeys: skippedLineKeysFor(outputLaneProjection, null),
      reason: "no_active_environment",
      lineSchemaDelta: null,
      environmentEnsure,
      ...baseAuthority,
    };
  }

  if (liveAnswerEnvironment.status !== "active") {
    return {
      ok: true,
      schema: "stage_play_live_answer_projection_response/v1",
      graph,
      outputLaneProjection,
      liveAnswerDelta: null,
      liveAnswerEnvironment,
      projectedLineKeys: [],
      skippedLineKeys: skippedLineKeysFor(outputLaneProjection, liveAnswerEnvironment),
      reason: "environment_not_active",
      lineSchemaDelta: null,
      environmentEnsure,
      ...baseAuthority,
    };
  }

  let lineSchemaDelta: LiveAnswerEnvironmentDelta | null = null;
  if (input.ensureStagePlayLineSchema) {
    const ensured = ensureLiveAnswerEnvironmentHasStagePlayLines({
      environment: liveAnswerEnvironment,
      now,
    });
    if (ensured) {
      liveAnswerEnvironment = ensured.environment;
      lineSchemaDelta = ensured.delta;
    }
  }

  const updateAllowedSkipped = updateAllowedSkippedLineKeysFor(outputLaneProjection, liveAnswerEnvironment);
  if (updateAllowedSkipped.length > 0) {
    return {
      ok: true,
      schema: "stage_play_live_answer_projection_response/v1",
      graph,
      outputLaneProjection,
      liveAnswerDelta: null,
      liveAnswerEnvironment,
      projectedLineKeys: [],
      skippedLineKeys: skippedLineKeysFor(outputLaneProjection, liveAnswerEnvironment),
      reason: "line_schema_mismatch",
      lineSchemaDelta,
      environmentEnsure,
      ...baseAuthority,
    };
  }

  const reduction = reduceLiveAnswerEnvironmentFromStagePlayGraph({
    environment: liveAnswerEnvironment,
    graph,
    now,
  });

  return {
    ok: true,
    schema: "stage_play_live_answer_projection_response/v1",
    graph,
    outputLaneProjection: reduction?.projection ?? outputLaneProjection,
    liveAnswerDelta: reduction?.delta ?? null,
    liveAnswerEnvironment: reduction?.environment ?? liveAnswerEnvironment,
    projectedLineKeys: reduction?.delta.changed_line_keys ?? [],
    skippedLineKeys: skippedLineKeysFor(outputLaneProjection, reduction?.environment ?? liveAnswerEnvironment),
    reason: reduction ? "projected" : "no_line_changes",
    lineSchemaDelta,
    environmentEnsure,
    ...baseAuthority,
  };
}
