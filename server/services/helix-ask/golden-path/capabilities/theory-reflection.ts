import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathTypedFailureTerminalErrorLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathCapabilityGoalSatisfactionEvaluation,
  buildGoldenPathCapabilityPlan,
} from "../capability-contract";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityDebugMirror } from "../debug-mirror";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTypedFailureResponseProjection,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathTheoryReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathTheoryReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY) ||
    /\b(?:reflect|reflection|theory\s+context|concept\s+route|theory\s+badge\s+graph)\b/.test(prompt)
  );
};


export const readTheoryReflectionTopic = (body: RecordLike): string | null => {
  const direct =
    readString(body.topic) ??
    readString(body.concept) ??
    readString(body.theory_topic) ??
    readString(body.theoryTopic) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/helix_ask\.reflect_theory_context/gi, "")
    .replace(/\b(?:reflect|reflection|theory\s+context|concept\s+route|theory\s+badge\s+graph|on|about|for|use)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

export const readTheoryReflectionAnchors = (body: RecordLike): string[] => {
  const direct =
    readStringArray(body.anchors).length > 0
      ? readStringArray(body.anchors)
      : readStringArray(body.theory_anchors).length > 0
        ? readStringArray(body.theory_anchors)
        : readStringArray(body.theoryAnchors);
  if (direct.length > 0) return direct.slice(0, 6);
  const context = readString(body.context) ?? readString(body.theory_context) ?? readString(body.theoryContext);
  if (!context) return [];
  return context
    .split(/\r?\n|[.;]/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
};


export const buildHelixAskGoldenPathTheoryReflectionPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathTheoryReflectionDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-theory:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:helix_theory_context_reflection_tool_receipt`;
  const terminalArtifactId = `${turnId}:theory_context_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "theory_context_reflection_answer";
  const goalKind = "theory_context_reflection";
  const topic = readTheoryReflectionTopic(args.body);
  const anchors = readTheoryReflectionAnchors(args.body);

  if (!topic) {
    const failureText =
      "I could not complete this golden-path theory reflection turn because no reflection topic was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      allows_workspace_context: true,
      allows_prior_artifacts: false,
      classifier_reasons: ["explicit_theory_reflection_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = buildGoldenPathCapabilityGoalSatisfactionEvaluation({
      turnId,
      goalKind,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: ["theory_reflection_topic"],
      firstBrokenRail: "argument_extraction",
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
        terminalErrorCode: "missing_theory_reflection_topic",
      }),
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "theory_context_reflection_missing_topic",
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactRef: terminalResult.artifact_id,
        terminalResultId,
        routeGate: "enabled_explicit_request",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        sourceTarget: "theory_context",
        family: "theory_context_reflection",
        executedCapability: null,
        requiredObservationKinds: ["helix_theory_context_reflection_tool_receipt"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / theory_context_reflection",
        completedSolverPath: false,
        firstBrokenRail: "argument_extraction",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        routeAuthorityOk: true,
        terminalAuthorityOk: true,
        goalSatisfaction: "not_satisfied",
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executedCapability: null,
        observedArtifactKind: null,
        observedArtifactRef: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: "argument_extraction",
        terminalErrorCode: "missing_theory_reflection_topic",
        extra: {
          solver_risk_flags: [],
          solver_short_circuit_flags: [],
        },
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          terminalEligible: false,
          requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        }),
        buildGoldenPathTypedFailureTerminalErrorLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          terminalResult,
          terminalErrorCode: "missing_theory_reflection_topic",
          firstBrokenRail: "argument_extraction",
          includeSupportRefs: true,
        }),
      ],
      debug: buildGoldenPathCapabilityDebugMirror({
        status: "theory_context_reflection_missing_topic",
        privateRuntimeLoopEntered: false,
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executedCapability: null,
        terminalResult,
        firstBrokenRail: "argument_extraction",
        terminalErrorCode: "missing_theory_reflection_topic",
        goalSatisfactionEvaluation,
      }),
    };
  }

  const answerText = [
    `Theory context reflection for: ${topic}`,
    anchors.length > 0
      ? `Relevant anchors: ${anchors.join("; ")}.`
      : "No explicit theory anchors were supplied, so this answer stays at a concept-routing level.",
    "Use this as reflection context, not as numerical proof or terminal scientific authority.",
  ].join("\n");
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    reflection_mode: "golden_path_deterministic_context",
    assistant_answer: false,
    raw_content_included: false,
  };

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
    goalKind,
    sourceTarget: "theory_context",
    family: "theory_context_reflection",
    planArgs: { topic, anchors },
    classifierReasons: ["explicit_theory_reflection_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    observedArtifactKind: "helix_theory_context_reflection_tool_receipt",
    observationPayload: reflectionReceipt,
    terminalPayloadField: "theory_context_reflection_answer",
    terminalPayloadSchema: "helix.theory_context_reflection_answer.v1",
    terminalPayloadExtra: { topic, anchors },
    answerText,
    status: "theory_context_reflection",
    route: "golden_path_runtime / theory_context_reflection",
    requiredObservationKinds: ["helix_theory_context_reflection_tool_receipt"],
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
    answerLedgerExtraPayload: {
      topic,
      anchors,
    },
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:theory_reflection`,
            name: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "helix_theory_context_reflection_tool_receipt",
          },
        ],
        model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
        loop_policy: {
          max_model_steps: 1,
          private_runtime_loop_entered: false,
        },
        assistant_answer: false,
        raw_content_included: false,
      },
    }),
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};

export const requiredObservationKinds = ["helix_theory_context_reflection_tool_receipt"] as const;
export const requiredTerminalKinds = ["theory_context_reflection_answer"] as const;
export const isRequested = isHelixAskGoldenPathTheoryReflectionRequested;
export const buildPayload = buildHelixAskGoldenPathTheoryReflectionPayload;
