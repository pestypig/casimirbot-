import {
  buildGoldenPathRouteGateLedgerArtifact,
  buildGoldenPathTypedFailureLedgerArtifact,
} from "./artifact-ledger";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
} from "./compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  type RecordLike,
} from "./core";
import { buildGoldenPathCompoundDebugMirror } from "./debug-mirror";
import { buildGoldenPathCompoundRuntimeStatus } from "./runtime-status";
import { buildGoldenPathSolverTrace } from "./solver-trace";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTypedFailureTerminalResult,
} from "./terminal-envelope";

export const buildGoldenPathCompoundTypedFailurePayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  terminalResultId: string;
  requiredTerminalKind: string;
  classifierReasons: readonly string[];
  hashGoalFrame: (value: unknown) => string;
  status: string;
  route: string;
  requiredObservationKinds: readonly string[];
  planArgs?: RecordLike;
  errorCode: string;
  brokenRail: string;
  missingRequirement: string;
  text: string;
  compoundSubgoalCount?: number;
}): RecordLike => {
  const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
    turnId: args.turnId,
    requiredTerminalKind: args.requiredTerminalKind,
    classifierReasons: args.classifierReasons,
  });
  const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
    turnId: args.turnId,
    requiredTerminalKind: args.requiredTerminalKind,
    satisfaction: "not_satisfied",
    selectedTerminalArtifactKind: "typed_failure",
    missingRequirements: [args.missingRequirement],
    firstBrokenRail: args.brokenRail,
  });
  const goalHash = args.hashGoalFrame(canonicalGoalFrame);
  const terminalResult = buildGoldenPathTypedFailureTerminalResult({
    resultId: args.terminalResultId,
    artifactId: `${args.turnId}:typed_failure`,
    text: args.text,
    supportRefs: [args.routeGateArtifactId],
  });
  const compoundSubgoalCount = args.compoundSubgoalCount ?? 2;

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
    golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
      status: args.status,
      executed: false,
      firstBrokenRail: args.brokenRail,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCompoundCapabilityPlan({
      executedCapability: null,
      ...(args.planArgs ? { planArgs: args.planArgs } : {}),
      requiredObservationKinds: args.requiredObservationKinds,
      requiredTerminalKind: args.requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: args.route,
      firstBrokenRail: args.brokenRail,
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: false,
      requestedCapability: "compound_capability_contract",
      selectedCapability: "compound_capability_contract",
      executedCapability: null,
      terminalArtifactKind: "typed_failure",
      firstBrokenRail: args.brokenRail,
      terminalErrorCode: args.errorCode,
      extra: { compound_subgoal_count: compoundSubgoalCount },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: args.routeGateArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        terminalEligible: false,
        requestedCapability: "compound_capability_contract",
      }),
      buildGoldenPathTypedFailureLedgerArtifact({
        artifactId: terminalResult.artifact_id,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        terminalResult,
        errorCode: args.errorCode,
        firstBrokenRail: args.brokenRail,
        includeSupportRefs: true,
      }),
    ],
    debug: buildGoldenPathCompoundDebugMirror({
      status: args.status,
      executed: false,
      terminalResult,
      firstBrokenRail: args.brokenRail,
      terminalErrorCode: args.errorCode,
      goalSatisfactionEvaluation,
    }),
  };
};
