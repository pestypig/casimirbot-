import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityExplicitlyRequested,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathZenGraphReflectionDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathZenGraphReflectionRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityExplicitlyRequested(body, [HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY) ||
    /\b(?:zen\s+graph|ideology\s+context|ideology\s+lens|right\s+speech|two-key|two\s+key|fruition|moral\s+guilt|missing\s+considerations?)\b/.test(prompt)
  );
};


export const readCompactZenGraphReflectionToolResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.zen_graph_reflection_tool_result) ??
    readRecord(body.zenGraphReflectionToolResult) ??
    readRecord(body.helix_zen_graph_reflection_tool_result) ??
    readRecord(body.helixZenGraphReflectionToolResult) ??
    readRecord(body.ideology_context_reflection_tool_result) ??
    readRecord(body.ideologyContextReflectionToolResult);
  if (direct) return direct;
  const reflection = readRecord(body.ideology_context_reflection) ?? readRecord(body.ideologyContextReflection);
  return reflection ? { reflection } : null;
};


export const buildHelixAskGoldenPathZenGraphReflectionPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathZenGraphReflectionDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-zen",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:helix_zen_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:ideology_context_reflection_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "ideology_context_reflection_answer";
  const goalKind = "ideology_context_reflection";
  const compactResult = readCompactZenGraphReflectionToolResult(args.body);
  const reflection = readRecord(compactResult?.reflection);

  if (!compactResult || !reflection) {
    const failureText =
      "I could not complete this golden-path ideology reflection turn because no compact zen graph reflection tool result was provided.";
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
      answerScope: "runtime_evidence",
      goalKind,
      classifierReasons: ["explicit_zen_graph_reflection_request"],
      requestedCapability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      sourceTarget: "zen_graph",
      family: "ideology_context_reflection",
      requiredObservationKinds: ["helix_zen_graph_reflection_tool_result"],
      status: "ideology_context_reflection_missing_result",
      route: "golden_path_runtime / ideology_context_reflection",
      errorCode: "missing_zen_graph_reflection_tool_result",
      brokenRail: "observation",
      missingRequirement: "helix_zen_graph_reflection_tool_result",
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
  const answerText = [
    "Ideology context reflection completed.",
    `Reflection: ${reflectionId}`,
    `Input: ${inputSummary}`,
    `Activated lenses: ${activatedTraits.length}; tensions: ${tensions.length}; recommended actions: ${recommendedActions.length}.`,
    `Procedural classifications: ${proceduralClassifications.length}; badge locator matches: ${locatorMatches.length}; admissions: ${admissions.length}.`,
    fruition ? "Fruition procedure evidence is present as support, not final authority." : null,
    "The zen graph receipt is evidence-only; this answer is a synthesis summary and does not grant moral, character, policy, or execution authority.",
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
  const zenGraphReceipt = {
    schema: "helix_zen_graph_reflection_tool_result.v1",
    kind: "helix_zen_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: evidenceRefs,
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
    answerScope: "runtime_evidence",
    sourceTarget: "zen_graph",
    family: "ideology_context_reflection",
    planArgs: { reflection_id: reflectionId, input_summary: inputSummary },
    classifierReasons: ["explicit_zen_graph_reflection_request"],
    allowsWorkspaceContext: false,
    includeWorkspaceContextFields: false,
    requestedCapability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    observedArtifactKind: "helix_zen_graph_reflection_tool_result",
    observationPayload: zenGraphReceipt,
    terminalPayloadField: "ideology_context_reflection_answer",
    terminalPayloadSchema: "helix.ideology_context_reflection_answer.v1",
    terminalPayloadExtra: { reflection_id: reflectionId },
    answerText,
    status: "ideology_context_reflection",
    route: "golden_path_runtime / ideology_context_reflection",
    requiredObservationKinds: ["helix_zen_graph_reflection_tool_result"],
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
    answerLedgerExtraPayload: {
      reflection_id: reflectionId,
    },
    additionalTopLevelFields: ({ goalSatisfactionArtifact }) => ({
      model_turn_input: {
        schema: "helix.ask_model_turn_input.v1",
        turn_id: turnId,
        prompt_text: promptText,
        available_capabilities: [HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY],
        function_call_outputs: [
          {
            call_id: `${turnId}:call:zen_graph_reflection`,
            name: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
            output_ref: observationArtifactId,
            output_kind: "helix_zen_graph_reflection_tool_result",
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

export const requiredObservationKinds = ["helix_zen_graph_reflection_tool_result"] as const;
export const requiredTerminalKinds = ["zen_graph_reflection_answer"] as const;
export const isRequested = isHelixAskGoldenPathZenGraphReflectionRequested;
export const buildPayload = buildHelixAskGoldenPathZenGraphReflectionPayload;
