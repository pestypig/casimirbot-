import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "./artifact-ledger";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
} from "./compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./core";
import { buildGoldenPathCompoundDebugMirror } from "./debug-mirror";
import { buildGoldenPathCompoundRuntimeStatus } from "./runtime-status";
import { buildGoldenPathSolverTrace } from "./solver-trace";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTerminalResult,
} from "./terminal-envelope";

type BuildGoalSatisfactionArtifact = (args: {
  turnId: string;
  goalHash: string;
  evaluation: RecordLike;
  createdAtMs: number;
}) => RecordLike;

export const buildGoldenPathCompoundSuccessPayload = (args: {
  turnId: string;
  traceId: string;
  sessionId?: string;
  threadId?: string;
  promptText: string;
  createdAtMs: number;
  routeGateArtifactId: string;
  terminalResultId: string;
  terminalArtifactId: string;
  requiredTerminalKind: string;
  classifierReasons: readonly string[];
  includeWorkspaceContextFields?: boolean;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: BuildGoalSatisfactionArtifact;
  answerText: string;
  supportArtifactRefs: readonly string[];
  status: string;
  route: string;
  observedArtifactRef: string;
  requiredObservationKinds: readonly string[];
  observationFields: RecordLike;
  observationLedgerArtifacts: (args: { goalHash: string }) => readonly RecordLike[];
  compoundCapabilityContract: RecordLike;
  routeGateTerminalEligible?: boolean;
  includeRouteGatePromptText?: boolean;
  answerProducerItemId?: string;
  compoundSubgoalCount?: number;
}): RecordLike => {
  const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
    turnId: args.turnId,
    requiredTerminalKind: args.requiredTerminalKind,
    classifierReasons: args.classifierReasons,
    includeWorkspaceContextFields: args.includeWorkspaceContextFields,
  });
  const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
    turnId: args.turnId,
    requiredTerminalKind: args.requiredTerminalKind,
  });
  const goalHash = args.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.buildGoalSatisfactionEvaluationArtifact({
    turnId: args.turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs: args.createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = buildGoldenPathTerminalResult({
    resultId: args.terminalResultId,
    artifactId: args.terminalArtifactId,
    artifactKind: args.requiredTerminalKind,
    finalAnswerSource: args.requiredTerminalKind,
    text: args.answerText,
    supportRefs: [...args.supportArtifactRefs, args.routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });
  const compoundSubgoalCount = args.compoundSubgoalCount ?? 2;

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: args.turnId,
    trace_id: args.traceId,
    session_id: args.sessionId,
    thread_id: args.threadId,
    prompt_text: args.promptText,
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
      status: args.status,
      executed: true,
      observedArtifactRef: args.observedArtifactRef,
      terminalArtifactRef: args.terminalArtifactId,
      terminalResultId: args.terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: args.compoundCapabilityContract,
    ...args.observationFields,
    compound_evidence_synthesis_answer: buildGoldenPathCompoundEvidenceSynthesisAnswer({
      text: terminalResult.text,
      supportRefs: terminalResult.support_refs,
      satisfiedSubgoalCount: compoundSubgoalCount,
    }),
    capability_plan: buildGoldenPathCompoundCapabilityPlan({
      requiredObservationKinds: args.requiredObservationKinds,
      requiredTerminalKind: args.requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: args.route,
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: "compound_capability_contract",
      selectedCapability: "compound_capability_contract",
      executedCapability: "compound_capability_contract",
      observedArtifactKind: "compound_subgoal_observations",
      observedArtifactRef: args.observedArtifactRef,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        compound_subgoal_count: compoundSubgoalCount,
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: args.routeGateArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        terminalEligible: args.routeGateTerminalEligible,
        ...(args.includeRouteGatePromptText === false ? {} : { promptText: args.promptText }),
        requestedCapability: "compound_capability_contract",
        compoundCapabilityContract: args.compoundCapabilityContract,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      ...args.observationLedgerArtifacts({ goalHash }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: args.terminalArtifactId,
        turnId: args.turnId,
        createdAtMs: args.createdAtMs,
        goalHash,
        kind: args.requiredTerminalKind,
        producerItemId: args.answerProducerItemId,
        payloadSchema: "helix.compound_evidence_synthesis_answer.v1",
        terminalResult,
        extraPayload: { satisfied_subgoal_count: compoundSubgoalCount },
      }),
    ],
    debug: buildGoldenPathCompoundDebugMirror({
      status: args.status,
      executed: true,
      terminalResult,
      compoundCapabilityContract: args.compoundCapabilityContract,
      goalSatisfactionEvaluation,
    }),
  };
};
