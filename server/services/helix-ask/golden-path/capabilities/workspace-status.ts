import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import {
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathWorkspaceStatusDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathWorkspaceStatusRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)) return true;
  const requestedCapability = readString(body.requested_capability ?? body.requestedCapability);
  if (requestedCapability === HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
};

export const workspaceStatusSummaryText = (observation: RecordLike): string => {
  const counts = readRecord(observation.capability_counts) ?? {};
  return `Workspace OS status completed: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
};

export const buildGoldenPathWorkspaceStatusObservation = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike => {
  const statusRecord = readRecord(args.body.workspace_os_status) ?? readRecord(args.body.workspaceOsStatus) ?? {};
  const countsRecord = readRecord(statusRecord.counts) ?? readRecord(statusRecord.capability_counts) ?? {};
  const total = readNumber(countsRecord.total) ?? 0;
  const available = readNumber(countsRecord.available) ?? 0;
  const degraded = readNumber(countsRecord.degraded) ?? 0;
  const blocked = readNumber(countsRecord.blocked) ?? 0;
  const error = readNumber(countsRecord.error) ?? 0;
  const unknown = readNumber(countsRecord.unknown) ?? Math.max(0, total - available - degraded - blocked - error);
  return {
    schema: "helix.workspace_os_status_observation.v1",
    artifact_id: `${args.turnId}:workspace_os_status_observation`,
    created_at_ms: args.createdAtMs,
    capability_key: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    status: readString(statusRecord.status) ?? "available",
    capability_counts: {
      total,
      available,
      degraded,
      blocked,
      error,
      unknown,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildHelixAskGoldenPathWorkspaceStatusPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathWorkspaceStatusDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-workspace-status",
    });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const observationArtifactId = readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:workspace_status_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_status_answer";
  const answerText = workspaceStatusSummaryText(workspaceObservation);
  return buildGoldenPathCapabilitySuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind: "workspace_status_diagnostic",
    sourceTarget: "workspace_os",
    family: "workspace_status",
    classifierReasons: ["explicit_workspace_status_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    observedArtifactKind: "workspace_os_status_observation",
    observationPayload: workspaceObservation,
    terminalPayloadField: "workspace_status_answer",
    terminalPayloadSchema: "helix.workspace_status_answer.v1",
    answerText,
    status: "workspace_status",
    route: "golden_path_runtime / workspace_status",
    requiredObservationKinds,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};


export const requiredObservationKinds = ["workspace_os_status_observation"] as const;
export const requiredTerminalKinds = ["workspace_status_answer"] as const;
export const isRequested = isHelixAskGoldenPathWorkspaceStatusRequested;
export const buildPayload = buildHelixAskGoldenPathWorkspaceStatusPayload;
