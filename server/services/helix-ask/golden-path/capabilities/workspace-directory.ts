import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
  executeWorkspaceDirectoryResolveTool,
} from "../../workspace-directory-resolver";
import {
  buildGoldenPathTypedFailureTerminalErrorLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import { buildGoldenPathCapabilityTerminalObservationSuccessPayload } from "../capability-terminal-observation-success";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  readHelixAskGoldenPathPrompt,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";

export type HelixAskGoldenPathWorkspaceDirectoryDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathWorkspaceDirectoryRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) ||
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-workspace-directory:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const query = readWorkspaceDirectoryQuery(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_directory_resolution";
  const goalKind = "workspace_directory_resolution";

  if (!query) {
    const failureText =
      "I could not complete this golden-path Ask turn because workspace-directory.resolve was requested without a path, URI, or query.";
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_workspace_directory_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
      turnId,
      goalKind,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: ["workspace_directory_query"],
      firstBrokenRail: "argument_extraction",
    });
    const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult = buildGoldenPathTypedFailureTerminalResult({
      resultId: terminalResultId,
      artifactId: terminalArtifactId,
      text: failureText,
      supportRefs: [routeGateArtifactId],
    });
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      ...buildGoldenPathTypedFailureResponseProjection({
        terminalResult,
        terminalErrorCode: "missing_workspace_directory_query",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        sourceTarget: "workspace_directory",
        family: "workspace_directory",
        executedCapability: null,
        requiredObservationKinds: ["workspace_directory_resolution"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / workspace_directory_resolution",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selectedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: "argument_extraction",
        terminalArtifactKind: "typed_failure",
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        }),
        buildGoldenPathTypedFailureTerminalErrorLedgerArtifact({
          artifactId: terminalArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          terminalResult,
          terminalErrorCode: "missing_workspace_directory_query",
          firstBrokenRail: "argument_extraction",
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        requestedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selectedCapability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: "argument_extraction",
        terminalErrorCode: "missing_workspace_directory_query",
      }),
    };
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
