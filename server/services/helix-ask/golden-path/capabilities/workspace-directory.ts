import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
  executeWorkspaceDirectoryResolveTool,
} from "../../workspace-directory-resolver";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import { buildGoldenPathCapabilityTerminalObservationSuccessPayload } from "../capability-terminal-observation-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathWorkspaceDirectoryDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathWorkspaceDirectoryRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\bworkspace[_\s-]?directory(?:[_\s-]?resolve|[_\s-]?resolution)?\b/.test(prompt)
  );
};

export const readWorkspaceDirectoryQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.workspace_directory_query) ??
    readString(body.workspaceDirectoryQuery) ??
    readString(body.query) ??
    readString(body.uri) ??
    readString(body.path) ??
    readString(body.target);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const afterCapability = prompt.match(/workspace-directory\.resolve(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].trim();
  const docPathMatch = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  if (docPathMatch?.[0]) return docPathMatch[0].replace(/[),.;:!?]+$/g, "");
  const forMatch = prompt.match(/\b(?:for|resolve|locate|find)\s+([A-Za-z0-9._/\\:-]{4,})/i);
  return forMatch?.[1]?.replace(/[),.;:!?]+$/g, "") ?? null;
};


export const buildHelixAskGoldenPathWorkspaceDirectoryPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathWorkspaceDirectoryDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-workspace-directory",
    });
  const query = readWorkspaceDirectoryQuery(args.body);
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "workspace_directory_resolution";
  const goalKind = "workspace_directory_resolution";

  if (!query) {
    const failureText =
      "I could not complete this golden-path Ask turn because workspace-directory.resolve was requested without a path, URI, or query.";
    const terminalArtifactId = `${turnId}:typed_failure`;
    return buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      goalKind,
      classifierReasons: ["explicit_workspace_directory_request"],
      requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      sourceTarget: "workspace_directory",
      family: "workspace_directory",
      requiredObservationKinds: ["workspace_directory_resolution"],
      status: "workspace_directory_resolution_missing_query",
      route: "golden_path_runtime / workspace_directory_resolution",
      errorCode: "missing_workspace_directory_query",
      brokenRail: "argument_extraction",
      missingRequirement: "workspace_directory_query",
      text: failureText,
      terminalArtifactId,
      includeRuntimeStatus: false,
      useTerminalErrorLedgerArtifact: true,
      includeGoalHashInTerminalErrorLedger: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });
  }

  const callId = `${turnId}:call:workspace_directory_resolve`;
  const resolution = executeWorkspaceDirectoryResolveTool({
    turnId,
    callId,
    query,
    workspaceRoot: readString(args.body.workspace_root) ?? readString(args.body.workspaceRoot) ?? process.cwd(),
  });
  const answerText = [
    `Workspace directory resolution for: ${query}`,
    `Status: ${resolution.status}`,
    resolution.selected_doc_path ? `Selected doc: ${resolution.selected_doc_path}` : null,
    resolution.selected_uri ? `Selected URI: ${resolution.selected_uri}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return buildGoldenPathCapabilityTerminalObservationSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId: resolution.artifact_id,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    sourceTarget: "workspace_directory",
    family: "workspace_directory",
    classifierReasons: ["explicit_workspace_directory_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
    observedArtifactKind: "workspace_directory_resolution",
    observationPayload: resolution,
    answerText,
    status: "workspace_directory_resolution",
    route: "golden_path_runtime / workspace_directory_resolution",
    requiredObservationKinds: ["workspace_directory_resolution"],
    includeRuntimeRouteGate: false,
    includeRuntimeLegacyFallbackPossibleWhenUnhandled: false,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["workspace_directory_resolution"] as const;
export const requiredTerminalKinds = ["workspace_directory_resolution"] as const;
export const isRequested = isHelixAskGoldenPathWorkspaceDirectoryRequested;
export const buildPayload = buildHelixAskGoldenPathWorkspaceDirectoryPayload;
