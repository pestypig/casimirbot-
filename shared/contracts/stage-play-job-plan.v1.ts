export const STAGE_PLAY_JOB_PLAN_ARTIFACT_ID =
  "stage_play_job_plan" as const;
export const STAGE_PLAY_JOB_PLAN_SCHEMA_VERSION =
  "stage_play_job_plan/v1" as const;

export const STAGE_PLAY_JOB_PLAN_DOMAINS = [
  "narrative_media",
  "minecraft_world",
  "browser_task",
  "custom",
] as const;

export const STAGE_PLAY_JOB_PLAN_SOURCE_ROUTES = [
  "narrative_stage_play",
  "world_stage_play",
  "visual_context",
  "debug_only",
] as const;

export const STAGE_PLAY_JOB_PLAN_NODE_KINDS = [
  "observer",
  "source",
  "compact_observation",
  "interpreter",
  "stage_bounds",
  "perturbation",
  "possibility_state",
  "checkpoint_request",
  "helix_ask_checkpoint",
  "answer_snapshot",
  "validation_feedback",
  "live_output",
] as const;

export const STAGE_PLAY_JOB_PLAN_READINESS_STATUSES = [
  "ready",
  "missing",
  "blocked",
] as const;

export const STAGE_PLAY_JOB_PLAN_PREDICTION_HORIZONS = [
  "next_scene_beat",
  "next_2_to_5_beats",
] as const;

export type StagePlayJobPlanDomainV1 = (typeof STAGE_PLAY_JOB_PLAN_DOMAINS)[number];
export type StagePlayJobPlanSourceRouteV1 = (typeof STAGE_PLAY_JOB_PLAN_SOURCE_ROUTES)[number];
export type StagePlayJobPlanNodeKindV1 = (typeof STAGE_PLAY_JOB_PLAN_NODE_KINDS)[number];
export type StagePlayJobPlanReadinessStatusV1 = (typeof STAGE_PLAY_JOB_PLAN_READINESS_STATUSES)[number];
export type StagePlayJobPlanPredictionHorizonV1 = (typeof STAGE_PLAY_JOB_PLAN_PREDICTION_HORIZONS)[number];

export type StagePlayJobPlanV1 = {
  artifactId: typeof STAGE_PLAY_JOB_PLAN_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_JOB_PLAN_SCHEMA_VERSION;
  jobObjective: string;
  domain: StagePlayJobPlanDomainV1;
  requiredSources: Array<{
    modality: "visual_frame" | "audio_transcript" | "world_event" | string;
    label: string;
    required: boolean;
    recommendedCadenceMs?: number | null;
    routeTo: StagePlayJobPlanSourceRouteV1;
  }>;
  nodeChain: Array<{
    nodeId: string;
    nodeKind: StagePlayJobPlanNodeKindV1;
    label: string;
    requiredInputs: string[];
    expectedOutputs: string[];
  }>;
  missingSetup: string[];
  readinessChecks: Array<{
    check: string;
    status: StagePlayJobPlanReadinessStatusV1;
    nextAction?: string | null;
  }>;
  checkpointPolicy: {
    triggerOnFirstObservation: boolean;
    triggerOnSceneChange: boolean;
    triggerOnPredictionHorizonExpired: boolean;
    minMsSinceLastCheckpoint: number;
    manualUserPriority: true;
  };
  predictionPolicy?: {
    enabled: boolean;
    horizon: StagePlayJobPlanPredictionHorizonV1;
    validateAgainstNextWindow: boolean;
  };
  assistant_answer: false;
  context_role: "tool_evidence";
};

export type BuildStagePlayJobPlanV1Input = Omit<
  StagePlayJobPlanV1,
  "artifactId" | "schemaVersion" | "assistant_answer" | "context_role"
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const validString = (values: readonly string[], value: unknown): boolean =>
  typeof value === "string" && values.includes(value);

const validateStringArray = (path: string, value: unknown, issues: string[]): void => {
  if (!Array.isArray(value)) {
    issues.push(`${path} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    if (!readString(entry)) issues.push(`${path}[${index}] must be a non-empty string`);
  }
};

export function buildStagePlayJobPlanV1(input: BuildStagePlayJobPlanV1Input): StagePlayJobPlanV1 {
  return {
    artifactId: STAGE_PLAY_JOB_PLAN_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_JOB_PLAN_SCHEMA_VERSION,
    ...input,
    assistant_answer: false,
    context_role: "tool_evidence",
  };
}

export function validateStagePlayJobPlanV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["value must be an object"];
  if (value.artifactId !== STAGE_PLAY_JOB_PLAN_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_JOB_PLAN_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_JOB_PLAN_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_JOB_PLAN_SCHEMA_VERSION}`);
  }
  if (!readString(value.jobObjective)) issues.push("jobObjective must be a non-empty string");
  if (!validString(STAGE_PLAY_JOB_PLAN_DOMAINS, value.domain)) issues.push("domain is invalid");
  if (!Array.isArray(value.requiredSources)) {
    issues.push("requiredSources must be an array");
  } else {
    for (const [index, source] of value.requiredSources.entries()) {
      const prefix = `requiredSources[${index}]`;
      if (!isRecord(source)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!readString(source.modality)) issues.push(`${prefix}.modality must be a non-empty string`);
      if (!readString(source.label)) issues.push(`${prefix}.label must be a non-empty string`);
      if (typeof source.required !== "boolean") issues.push(`${prefix}.required must be boolean`);
      if (
        source.recommendedCadenceMs != null &&
        (typeof source.recommendedCadenceMs !== "number" ||
          !Number.isFinite(source.recommendedCadenceMs) ||
          source.recommendedCadenceMs <= 0)
      ) {
        issues.push(`${prefix}.recommendedCadenceMs must be a positive finite number or null`);
      }
      if (!validString(STAGE_PLAY_JOB_PLAN_SOURCE_ROUTES, source.routeTo)) {
        issues.push(`${prefix}.routeTo is invalid`);
      }
    }
  }
  if (!Array.isArray(value.nodeChain)) {
    issues.push("nodeChain must be an array");
  } else {
    const ids = new Set<string>();
    for (const [index, node] of value.nodeChain.entries()) {
      const prefix = `nodeChain[${index}]`;
      if (!isRecord(node)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      const nodeId = readString(node.nodeId);
      if (!nodeId) {
        issues.push(`${prefix}.nodeId must be a non-empty string`);
      } else if (ids.has(nodeId)) {
        issues.push(`${prefix}.nodeId must be unique`);
      } else {
        ids.add(nodeId);
      }
      if (!validString(STAGE_PLAY_JOB_PLAN_NODE_KINDS, node.nodeKind)) {
        issues.push(`${prefix}.nodeKind is invalid`);
      }
      if (!readString(node.label)) issues.push(`${prefix}.label must be a non-empty string`);
      validateStringArray(`${prefix}.requiredInputs`, node.requiredInputs, issues);
      validateStringArray(`${prefix}.expectedOutputs`, node.expectedOutputs, issues);
    }
  }
  validateStringArray("missingSetup", value.missingSetup, issues);
  if (!Array.isArray(value.readinessChecks)) {
    issues.push("readinessChecks must be an array");
  } else {
    for (const [index, check] of value.readinessChecks.entries()) {
      const prefix = `readinessChecks[${index}]`;
      if (!isRecord(check)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!readString(check.check)) issues.push(`${prefix}.check must be a non-empty string`);
      if (!validString(STAGE_PLAY_JOB_PLAN_READINESS_STATUSES, check.status)) {
        issues.push(`${prefix}.status is invalid`);
      }
      if (check.nextAction != null && !readString(check.nextAction)) {
        issues.push(`${prefix}.nextAction must be a non-empty string or null`);
      }
    }
  }
  if (!isRecord(value.checkpointPolicy)) {
    issues.push("checkpointPolicy must be an object");
  } else {
    for (const key of ["triggerOnFirstObservation", "triggerOnSceneChange", "triggerOnPredictionHorizonExpired"]) {
      if (typeof value.checkpointPolicy[key] !== "boolean") {
        issues.push(`checkpointPolicy.${key} must be boolean`);
      }
    }
    if (
      typeof value.checkpointPolicy.minMsSinceLastCheckpoint !== "number" ||
      !Number.isFinite(value.checkpointPolicy.minMsSinceLastCheckpoint) ||
      value.checkpointPolicy.minMsSinceLastCheckpoint < 0
    ) {
      issues.push("checkpointPolicy.minMsSinceLastCheckpoint must be a non-negative finite number");
    }
    if (value.checkpointPolicy.manualUserPriority !== true) {
      issues.push("checkpointPolicy.manualUserPriority must be true");
    }
  }
  if (value.predictionPolicy != null) {
    if (!isRecord(value.predictionPolicy)) {
      issues.push("predictionPolicy must be an object");
    } else {
      if (typeof value.predictionPolicy.enabled !== "boolean") issues.push("predictionPolicy.enabled must be boolean");
      if (!validString(STAGE_PLAY_JOB_PLAN_PREDICTION_HORIZONS, value.predictionPolicy.horizon)) {
        issues.push("predictionPolicy.horizon is invalid");
      }
      if (typeof value.predictionPolicy.validateAgainstNextWindow !== "boolean") {
        issues.push("predictionPolicy.validateAgainstNextWindow must be boolean");
      }
    }
  }
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  return issues;
}

export function isStagePlayJobPlanV1(value: unknown): value is StagePlayJobPlanV1 {
  return validateStagePlayJobPlanV1(value).length === 0;
}
