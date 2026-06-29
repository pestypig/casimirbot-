import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import { buildHelixReflectionObservationLayers } from "../reflection-answer-guidance";

export type HelixAskGoldenPathTheoryReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathTheoryReflectionRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
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
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-theory",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:helix_theory_context_reflection_tool_receipt`;
  const terminalArtifactId = `${turnId}:theory_context_reflection_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "theory_context_reflection_answer";
  const goalKind = "theory_context_reflection";
  const topic = readTheoryReflectionTopic(args.body);
  const anchors = readTheoryReflectionAnchors(args.body);

  if (!topic) {
    const failureText =
      "I could not complete this golden-path theory reflection turn because no reflection topic was provided.";
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
      canonicalGoalFrameExtra: {
        allows_workspace_context: true,
        allows_prior_artifacts: false,
      },
      classifierReasons: ["explicit_theory_reflection_request"],
      requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      sourceTarget: "theory_context",
      family: "theory_context_reflection",
      requiredObservationKinds: ["helix_theory_context_reflection_tool_receipt"],
      status: "theory_context_reflection_missing_topic",
      route: "golden_path_runtime / theory_context_reflection",
      errorCode: "missing_theory_reflection_topic",
      brokenRail: "argument_extraction",
      missingRequirement: "theory_reflection_topic",
      text: failureText,
      routeGate: "enabled_explicit_request",
      routeGateTerminalEligible: false,
      includeRouteGateGoalHash: false,
      debugStatus: "theory_context_reflection_missing_topic",
      debugPrivateRuntimeLoopEntered: false,
      observedArtifactKind: null,
      observedArtifactRef: null,
      terminalArtifactRef: `${turnId}:typed_failure`,
      terminalResultIdInRuntimeStatus: terminalResultId,
      completedSolverPath: false,
      goalSatisfaction: "not_satisfied",
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      solverTraceExtra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
      includeGoalSatisfactionInDebug: true,
      includeLedgerSupportRefs: true,
      includeTerminalErrorCodeInSolverTrace: true,
      includeFirstBrokenRailInTerminalAuthority: true,
      useTerminalErrorLedgerArtifact: true,
      hashGoalFrame: args.deps.hashGoalFrame,
    });
  }

  const answerText = [
    `Theory context reflection for: ${topic}`,
    anchors.length > 0
      ? `Use the supplied anchors to bound the answer: ${anchors.join("; ")}.`
      : "No explicit theory anchors were supplied, so the answer must stay at concept-routing level.",
    "This can guide what claims are allowed, conditional, or missing; it is not numerical proof or terminal scientific authority.",
  ].join("\n");
  const reflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [topic, ...anchors],
    locatorRationale:
      "The theory reflection was selected because the turn asks for concept routing, theory context, or bounded interpretation.",
    supportRefs: anchors,
    constraintsIntroduced: [
      "Theory reflection can shape the claim boundary but does not prove the theory.",
      "Unanchored claims must stay exploratory.",
      "Numerical, scientific, or implementation claims require separate evidence.",
    ],
    missingEvidence: anchors.length > 0 ? [] : ["theory_anchor_refs"],
    confidence: anchors.length > 0 ? "medium" : "low",
    maturity: "exploratory",
    practicalFraming:
      "Treat the topic as a concept route and identify what evidence would be needed before stronger claims.",
    allowedClaims: [
      "The topic can be discussed as a bounded concept route.",
      "Anchors may constrain how the final answer frames the concept.",
    ],
    conditionalClaims: [
      "Specific mechanism or implementation claims are conditional on retrieved support evidence.",
    ],
    blockedClaims: [
      "Do not claim scientific proof.",
      "Do not claim numerical validation.",
      "Do not claim implementation readiness from theory reflection alone.",
    ],
    reasoningMoves: [
      "Name the topic and anchors.",
      "State the claim boundary introduced by the anchors.",
      "Identify missing support before stronger claims.",
      "Hand off bounded wording to terminal synthesis.",
    ],
    suggestedAnswerShape: [
      "Start with the concept route.",
      "Name the anchors or say that anchors are missing.",
      "Separate exploratory claims from evidence-backed claims.",
      "Give the next retrieval or verification step.",
    ],
    wordingGuidance:
      "Use theory reflection as bounded answer guidance; avoid presenting the receipt as proof or a final scientific conclusion.",
    compoundHandoffNotes: {
      research: "Use retrieved sources to fill missing support before strengthening theory claims.",
      docs: "Use document anchors as support refs for any implementation or repository claim.",
      calculator: "Only compute quantities explicitly provided by a separate evidence observation.",
    },
  });
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    reflection_mode: "golden_path_deterministic_context",
    ...reflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
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
      answer_guidance: reflectionLayers.answer_guidance,
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
