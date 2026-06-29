import {
  buildGoldenPathRouteGateLedgerArtifact,
  buildGoldenPathTypedFailureLedgerArtifact,
  buildGoldenPathTypedFailureTerminalErrorLedgerArtifact,
} from "./artifact-ledger";
import { buildGoldenPathCapabilityGoalSatisfactionEvaluation, buildGoldenPathCapabilityPlan } from "./capability-contract";
import { HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA, type RecordLike } from "./core";
import { buildGoldenPathCapabilityDebugMirror } from "./debug-mirror";
import { buildGoldenPathRuntimeStatus } from "./runtime-status";
import { buildGoldenPathSolverTrace } from "./solver-trace";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTypedFailureTerminalResult,
} from "./terminal-envelope";

export const buildGoldenPathCapabilityTypedFailurePayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  terminalResultId: string;
  requiredTerminalKind: string;
  answerScope?: string;
  canonicalGoalFrameExtra?: RecordLike;
  goalKind: string;
  classifierReasons: readonly string[];
  requestedCapability: string;
  selectedCapability?: string;
  sourceTarget: string;
  family: string;
  planArgs?: RecordLike;
  requiredObservationKinds: readonly string[];
  status: string;
  route: string;
  errorCode: string;
  brokenRail: string;
  missingRequirement: string;
  text: string;
  terminalArtifactId?: string;
  supportRefs?: string[];
  includeRuntimeStatus?: boolean;
  routeGate?: string;
  routeGateTerminalEligible?: boolean;
  includeRouteGateGoalHash?: boolean;
  debugStatus?: string;
  debugPrivateRuntimeLoopEntered?: boolean;
  debugTerminalResultCount?: number;
  observedArtifactKind?: string | null;
  observedArtifactRef?: string | null;
  terminalArtifactRef?: string;
  terminalResultIdInRuntimeStatus?: string;
  completedSolverPath?: boolean;
  goalSatisfaction?: string;
  routeAuthorityOk?: boolean;
  terminalAuthorityOk?: boolean;
  solverTraceExtra?: RecordLike;
  includeGoalSatisfactionInDebug?: boolean;
  includeLedgerSupportRefs?: boolean;
  includeTerminalErrorCodeInSolverTrace?: boolean;
  includeFirstBrokenRailInTerminalAuthority?: boolean;
  useTerminalErrorLedgerArtifact?: boolean;
  includeGoalHashInTerminalErrorLedger?: boolean;
  hashGoalFrame: (value: unknown) => string;
}): RecordLike => {
  const selectedCapability = args.selectedCapability ?? args.requestedCapability;
  const terminalArtifactId = args.terminalArtifactId ?? `${args.turnId}:typed_failure`;
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: args.turnId,
    goal_kind: args.goalKind,
    answer_scope: args.answerScope ?? "current_turn",
    required_terminal_kind: args.requiredTerminalKind,
    ...(args.canonicalGoalFrameExtra ?? {}),
    classifier_reasons: args.classifierReasons,
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
    turnId: args.turnId,
    goalKind: args.goalKind,
    requiredTerminalKind: args.requiredTerminalKind,
    satisfaction: "not_satisfied",
    selectedTerminalArtifactKind: "typed_failure",
    missingRequirements: [args.missingRequirement],
    firstBrokenRail: args.brokenRail,
  });
  const goalHash = args.hashGoalFrame(canonicalGoalFrame);
  const terminalResult = buildGoldenPathTypedFailureTerminalResult({
    resultId: args.terminalResultId,
    artifactId: terminalArtifactId,
    text: args.text,
    supportRefs: args.supportRefs ?? [args.routeGateArtifactId],
  });

  return {
    ok: false,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: args.turnId,
    trace_id: args.traceId,
    session_id: args.sessionId,
    thread_id: args.threadId,
    prompt_text: args.promptText,
    ...buildGoldenPathTypedFailureResponseProjection({
      terminalResult,
      terminalErrorCode: args.errorCode,
    }),
    ...(args.includeRuntimeStatus === false
      ? {}
      : {
          golden_path_runtime: buildGoldenPathRuntimeStatus({
            status: args.status,
            requestedCapability: args.requestedCapability,
            selectedCapability,
            executedCapability: null,
            ...(typeof args.observedArtifactKind !== "undefined"
              ? { observedArtifactKind: args.observedArtifactKind }
              : {}),
            ...(typeof args.observedArtifactRef !== "undefined" ? { observedArtifactRef: args.observedArtifactRef } : {}),
            terminalArtifactRef: args.terminalArtifactRef,
            terminalResultId: args.terminalResultIdInRuntimeStatus,
            firstBrokenRail: args.brokenRail,
            routeGate: args.routeGate,
          }),
        }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: args.requestedCapability,
      ...(args.selectedCapability ? { selectedCapability } : {}),
      executedCapability: null,
      sourceTarget: args.sourceTarget,
      family: args.family,
      ...(args.planArgs ? { planArgs: args.planArgs } : {}),
      requiredObservationKinds: args.requiredObservationKinds,
      requiredTerminalKind: args.requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: args.route,
      ...(typeof args.completedSolverPath === "boolean" ? { completedSolverPath: args.completedSolverPath } : {}),
      ...(args.includeFirstBrokenRailInTerminalAuthority ? { firstBrokenRail: args.brokenRail } : {}),
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: args.completedSolverPath ?? false,
      routeAuthorityOk: args.routeAuthorityOk,
      terminalAuthorityOk: args.terminalAuthorityOk,
      goalSatisfaction: args.goalSatisfaction,
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability: null,
      ...(typeof args.observedArtifactKind !== "undefined" ? { observedArtifactKind: args.observedArtifactKind } : {}),
      ...(typeof args.observedArtifactRef !== "undefined" ? { observedArtifactRef: args.observedArtifactRef } : {}),
      firstBrokenRail: args.brokenRail,
      terminalArtifactKind: "typed_failure",
      ...(args.includeTerminalErrorCodeInSolverTrace ? { terminalErrorCode: args.errorCode } : {}),
      extra: args.solverTraceExtra,
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: args.routeGateArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        terminalEligible: args.routeGateTerminalEligible,
        ...(args.includeRouteGateGoalHash === false ? {} : { goalHash }),
        requestedCapability: args.requestedCapability,
      }),
      args.useTerminalErrorLedgerArtifact
        ? buildGoldenPathTypedFailureTerminalErrorLedgerArtifact({
            artifactId: terminalArtifactId,
            turnId: args.turnId,
            createdAtMs: args.createdAtMs,
            ...(args.includeGoalHashInTerminalErrorLedger ? { goalHash } : {}),
            terminalResult,
            terminalErrorCode: args.errorCode,
            firstBrokenRail: args.brokenRail,
            includeSupportRefs: args.includeLedgerSupportRefs,
          })
        : buildGoldenPathTypedFailureLedgerArtifact({
            artifactId: terminalArtifactId,
            turnId: args.turnId,
            createdAtMs: args.createdAtMs,
            goalHash,
            terminalResult,
            errorCode: args.errorCode,
            firstBrokenRail: args.brokenRail,
            includeSupportRefs: args.includeLedgerSupportRefs,
          }),
    ],
    debug: buildGoldenPathCapabilityDebugMirror({
      status: args.debugStatus,
      privateRuntimeLoopEntered: args.debugPrivateRuntimeLoopEntered,
      terminalResultCount: args.debugTerminalResultCount,
      requestedCapability: args.requestedCapability,
      selectedCapability,
      executedCapability: null,
      ...(typeof args.observedArtifactKind !== "undefined" ? { observedArtifactKind: args.observedArtifactKind ?? undefined } : {}),
      ...(typeof args.observedArtifactRef !== "undefined" ? { observedArtifactRef: args.observedArtifactRef ?? undefined } : {}),
      terminalResult,
      firstBrokenRail: args.brokenRail,
      terminalErrorCode: args.errorCode,
      ...(args.includeGoalSatisfactionInDebug ? { goalSatisfactionEvaluation } : {}),
    }),
  };
};
