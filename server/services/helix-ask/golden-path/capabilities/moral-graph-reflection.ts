import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import { buildHelixReflectionObservationLayers } from "../reflection-answer-guidance";

export type HelixAskGoldenPathMoralGraphReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathMoralGraphReflectionRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\b(?:moral\s+graph|ideology\s+context|ideology\s+lens|right\s+speech|two-key|two\s+key|fruition|moral\s+guilt|missing\s+considerations?)\b/.test(prompt)
  );
};


export const readCompactMoralGraphReflectionToolResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.moral_graph_reflection_tool_result) ??
    readRecord(body.moralGraphReflectionToolResult) ??
    readRecord(body.helix_moral_graph_reflection_tool_result) ??
    readRecord(body.helixMoralGraphReflectionToolResult) ??
    readRecord(body.ideology_context_reflection_tool_result) ??
    readRecord(body.ideologyContextReflectionToolResult);
  if (direct) return direct;
  const reflection = readRecord(body.ideology_context_reflection) ?? readRecord(body.ideologyContextReflection);
  return reflection ? { reflection } : null;
};


export const buildHelixAskGoldenPathMoralGraphReflectionPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathMoralGraphReflectionDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-moral",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:helix_moral_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:ideology_context_reflection_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "ideology_context_reflection_answer";
  const goalKind = "ideology_context_reflection";
  const compactResult = readCompactMoralGraphReflectionToolResult(args.body);
  const reflection = readRecord(compactResult?.reflection);

  if (!compactResult || !reflection) {
    const failureText =
      "I could not complete this golden-path ideology reflection turn because no compact moral graph reflection tool result was provided.";
    return buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId: traceId ?? undefined,
      sessionId: sessionId ?? undefined,
      threadId: threadId ?? undefined,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      answerScope: "runtime_evidence",
      goalKind,
      classifierReasons: ["explicit_moral_graph_reflection_request"],
      requestedCapability: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
      sourceTarget: "moral_graph",
      family: "ideology_context_reflection",
      requiredObservationKinds: ["helix_moral_graph_reflection_tool_result"],
      status: "ideology_context_reflection_missing_result",
      route: "golden_path_runtime / ideology_context_reflection",
      errorCode: "missing_moral_graph_reflection_tool_result",
      brokenRail: "observation",
      missingRequirement: "helix_moral_graph_reflection_tool_result",
      text: failureText,
      routeGate: "enabled_explicit_request",
      routeGateTerminalEligible: false,
      includeRouteGateGoalHash: false,
      debugStatus: "ideology_context_reflection_missing_result",
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

  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? readHelixAskGoldenPathPrompt(args.body);
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? compactResult.recommendedActions,
  );
  const proceduralClassification = readRecord(
    compactResult.proceduralClassification ?? compactResult.procedural_classification,
  );
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(compactResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(compactResult.fruition);
  const admissions = readArray(compactResult.admissions);
  const refs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const evidenceRefs = [reflectionId, ...refs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const reflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [
      reflection,
      ...activatedTraits.slice(0, 4),
      ...tensions.slice(0, 4),
      ...locatorMatches.slice(0, 4),
    ],
    locatorRationale:
      "The moral graph reflection was selected because the turn asks for ideology context, moral/behavioral framing, or missing considerations.",
    supportRefs: evidenceRefs,
    constraintsIntroduced: [
      "Treat ideology graph matches as normative and procedural constraints, not as moral verdicts.",
      "Recommended actions are diagnostic moves until separate evidence and route authority support them.",
      "Admissions and locator matches bound wording but do not make the receipt terminal.",
    ],
    missingEvidence: refs.length > 0 ? [] : ["source_refs_for_ideology_context"],
    practicalFraming:
      "Use the graph location to explain how the prompt should be phrased and bounded without claiming final moral authority.",
    allowedClaims: [
      "The selected graph relation can shape the answer's caution, tone, and next evidence step.",
      "The answer may name tensions and recommended diagnostic moves as constraints.",
    ],
    conditionalClaims: [
      "Any stronger recommendation is conditional on support refs, admissions, and the route-product contract.",
    ],
    blockedClaims: [
      "Do not claim moral finality.",
      "Do not diagnose character or intent.",
      "Do not treat activated lenses, tensions, locator matches, or admissions as the final answer.",
    ],
    reasoningMoves: [
      "Interpret the user question through the selected graph relation.",
      "Name the relevant tension or procedural move.",
      "Explain what the relation allows and blocks.",
      "Hand off the constrained framing to terminal synthesis.",
    ],
    suggestedAnswerShape: [
      "Start with the bounded interpretation.",
      "Explain how the graph relation constrains the answer.",
      "State allowed and blocked claims.",
      "Give a concrete next evidence or review step.",
    ],
    wordingGuidance:
      "Write in natural prose about what the relation permits and forbids; do not expose lens or locator counts as the answer.",
    compoundHandoffNotes: {
      civilization_bounds: "Use this as normative wording guidance after capacity and evidence bounds are named.",
      docs: "Retrieve the cited ideology or policy source before making source-backed claims.",
      calculator: "No scalar computation is authorized by ideology reflection alone.",
    },
  });
  const answerText = [
    `The ideology reflection (${reflectionId}) treats the prompt as a bounded framing question: ${inputSummary}`,
    "It can shape wording, caution, and next diagnostic moves, but it cannot become a moral verdict or execution permission.",
    recommendedActions.length > 0
      ? "The safe move is to use the recommended actions as evidence-seeking steps, not as final authority."
      : "No recommended action evidence was supplied, so the answer should stay at framing level.",
    fruition ? "Fruition procedure evidence may support the phrasing, but it remains non-terminal." : null,
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
  const moralGraphReceipt = {
    schema: "helix_moral_graph_reflection_tool_result.v1",
    kind: "helix_moral_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: evidenceRefs,
    ...reflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  return buildGoldenPathCapabilitySuccessPayload({
    turnId,
    traceId: traceId ?? undefined,
    sessionId: sessionId ?? undefined,
    threadId: threadId ?? undefined,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    answerScope: "runtime_evidence",
    sourceTarget: "moral_graph",
    family: "ideology_context_reflection",
    planArgs: { reflection_id: reflectionId, input_summary: inputSummary },
    classifierReasons: ["explicit_moral_graph_reflection_request"],
    allowsWorkspaceContext: false,
    includeWorkspaceContextFields: false,
    requestedCapability: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
    observedArtifactKind: "helix_moral_graph_reflection_tool_result",
    observationPayload: moralGraphReceipt,
    terminalPayloadField: "ideology_context_reflection_answer",
    terminalPayloadSchema: "helix.ideology_context_reflection_answer.v1",
    terminalPayloadExtra: { reflection_id: reflectionId },
    answerText,
    status: "ideology_context_reflection",
    route: "golden_path_runtime / ideology_context_reflection",
    requiredObservationKinds: ["helix_moral_graph_reflection_tool_result"],
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
    answerLedgerExtraPayload: {
      reflection_id: reflectionId,
      answer_guidance: reflectionLayers.answer_guidance,
    },
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:moral_graph_reflection`,
            name: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "helix_moral_graph_reflection_tool_result",
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

export const requiredObservationKinds = ["helix_moral_graph_reflection_tool_result"] as const;
export const requiredTerminalKinds = ["moral_graph_reflection_answer"] as const;
export const isRequested = isHelixAskGoldenPathMoralGraphReflectionRequested;
export const buildPayload = buildHelixAskGoldenPathMoralGraphReflectionPayload;
