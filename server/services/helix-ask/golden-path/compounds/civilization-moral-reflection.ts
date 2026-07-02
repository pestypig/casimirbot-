import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { readCompactCivilizationBoundsToolResult } from "../capabilities/civilization-bounds-reflection";
import { readCompactMoralGraphReflectionToolResult } from "../capabilities/moral-graph-reflection";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
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

export type HelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = [
  "helix_civilization_bounds_tool_result",
  "helix_moral_graph_reflection_tool_result",
] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    observation_kind: "helix_civilization_bounds_tool_result",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
    observation_kind: "helix_moral_graph_reflection_tool_result",
  },
] as const;
export const isRequested = isHelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundRequested;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter((value) => value.length > 0)));

const buildPromptCivilizationBoundsToolResult = (promptText: string): RecordLike => {
  const lower = promptText.toLowerCase();
  const systems = uniqueStrings([
    lower.includes("energy") ? "energy_budget" : "",
    lower.includes("material") || lower.includes("inventory") ? "material_inventory" : "",
    lower.includes("fair") || lower.includes("justice") ? "fairness_distribution" : "",
    lower.includes("review") || lower.includes("gate") ? "review_gates" : "",
  ]);
  const collaborationBounds = uniqueStrings([
    lower.includes("energy") ? "energy limits must be expressed as bounded capacity, not aspiration" : "",
    lower.includes("material") || lower.includes("inventory")
      ? "material inventory must be checked before claiming feasibility"
      : "",
    lower.includes("fair") || lower.includes("justice")
      ? "fairness constraints must be represented as operating conditions"
      : "",
    lower.includes("review") || lower.includes("gate")
      ? "review gates must remain explicit before stronger authority is granted"
      : "",
  ]);
  const roadmap = {
    roadmapId: "civilization-bounds:prompt-produced",
    title: "Prompt-produced Civilization Bounds Roadmap",
    systems: systems.length > 0 ? systems : ["bounded_possibility_review"],
    badges: ["energy", "material_inventory", "fairness", "review_gates"].filter((badge) =>
      lower.includes(badge.replace("_", " ")),
    ),
    collaborationBounds:
      collaborationBounds.length > 0
        ? collaborationBounds
        : ["dream claims must be bounded by capacity, evidence, and review gates"],
    missingEvidence: ["quantified_energy_budget", "material_inventory_source", "review_gate_owner"],
    prompt_text: promptText,
  };
  return {
    roadmap,
    bridgeContext: {
      source: "prompt_produced_golden_path_civilization_bounds",
      prompt_text: promptText,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildPromptMoralGraphReflectionToolResult = (promptText: string): RecordLike => {
  const lower = promptText.toLowerCase();
  const activatedTraits = uniqueStrings([
    lower.includes("dream") || lower.includes("possible") ? "right_aspiration" : "",
    lower.includes("fair") ? "fairness_and_non_harm" : "",
    lower.includes("energy") || lower.includes("material") ? "material_truthfulness" : "",
    lower.includes("review") || lower.includes("gate") ? "review_before_commitment" : "",
  ]);
  const tensions = uniqueStrings([
    lower.includes("dream") ? "aspiration_vs_capacity" : "",
    lower.includes("possible") ? "possibility_vs_evidence" : "",
    lower.includes("fair") ? "fairness_vs_resource_allocation" : "",
  ]);
  const reflection = {
    reflectionId: "moral-graph:prompt-produced",
    input: {
      summary: promptText,
      refs: ["civilization-bounds:prompt-produced"],
    },
    activated_traits: activatedTraits.length > 0 ? activatedTraits : ["right_view", "right_effort"],
    tensions: tensions.length > 0 ? tensions : ["aspiration_vs_verification"],
    recommended_actions: [
      "name the dream as a hypothesis",
      "bind claims to energy and material constraints",
      "apply fairness and review gates before action",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    reflection,
    proceduralClassification: {
      classifications: ["bounded_reflection", "review_gate_required"],
    },
    locator: {
      matches: ["energy", "material inventory", "fairness", "review gates"].filter((term) => lower.includes(term)),
    },
    fruition: {
      procedure: "treat dreams as directional hypotheses constrained by evidence and review",
    },
    admissions: ["reflection is advisory and must not override evidence or capability receipts"],
  };
};

export const buildHelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-civilization-moral",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const civilizationObservationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const moralObservationArtifactId = `${turnId}:helix_moral_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const promptProducedCivilizationResult = buildPromptCivilizationBoundsToolResult(promptText);
  const promptProducedMoralResult = buildPromptMoralGraphReflectionToolResult(promptText);
  const civilizationResult = readCompactCivilizationBoundsToolResult(args.body) ?? promptProducedCivilizationResult;
  const roadmap = readRecord(civilizationResult?.roadmap);
  const moralResult = readCompactMoralGraphReflectionToolResult(args.body) ?? promptProducedMoralResult;
  const reflection = readRecord(moralResult?.reflection);

  const makeFailurePayload = (params: {
    errorCode: "missing_civilization_bounds_tool_result" | "missing_moral_graph_reflection_tool_result";
    brokenRail: "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    return buildGoldenPathCompoundTypedFailurePayload({
      turnId,
      traceId: traceId ?? undefined,
      sessionId: sessionId ?? undefined,
      threadId: threadId ?? undefined,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      classifierReasons: ["explicit_civilization_bounds_moral_reflection_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "civilization_bounds_moral_reflection_compound_failed",
      route: "golden_path_runtime / civilization_bounds_moral_reflection_compound",
      requiredObservationKinds,
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
  };

  if (!civilizationResult || !roadmap) {
    return makeFailurePayload({
      errorCode: "missing_civilization_bounds_tool_result",
      brokenRail: "observation",
      missingRequirement: "helix_civilization_bounds_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact civilization-bounds evidence was provided.",
    });
  }
  if (!moralResult || !reflection) {
    return makeFailurePayload({
      errorCode: "missing_moral_graph_reflection_tool_result",
      brokenRail: "observation",
      missingRequirement: "helix_moral_graph_reflection_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact moral graph reflection evidence was provided.",
    });
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const systems = readArray(roadmap.systems);
  const badges = readArray(roadmap.badges);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const civilizationMissingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const civilizationBridgeContext = readRecord(civilizationResult.bridgeContext ?? civilizationResult.bridge_context);
  const civilizationEvidenceRefs = [roadmapId, ...civilizationMissingEvidence]
    .filter((ref): ref is string => ref.length > 0)
    .slice(0, 8);
  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? promptText;
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? moralResult.recommendedActions,
  );
  const proceduralClassification = readRecord(moralResult.proceduralClassification ?? moralResult.procedural_classification);
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(moralResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(moralResult.fruition);
  const admissions = readArray(moralResult.admissions);
  const moralRefs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const moralEvidenceRefs = [reflectionId, ...moralRefs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const civilizationReflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [roadmap, ...systems.slice(0, 4), ...badges.slice(0, 4), ...collaborationBounds.slice(0, 4)],
    locatorRationale:
      "The civilization-bounds roadmap was selected because the turn asks whether a possibility can become actionable under capacity, materials, fairness, and review constraints.",
    supportRefs: civilizationEvidenceRefs,
    constraintsIntroduced: [
      "Treat the possibility as a bounded hypothesis, not as feasibility proof.",
      "Energy or capacity claims require quantified support before actionability.",
      "Material inventory, fairness, and review gates must be satisfied before readiness claims.",
    ],
    missingEvidence: civilizationMissingEvidence,
    practicalFraming:
      "Start from civilization bounds: the idea may be explored, but feasibility and actionability stay conditional on evidence.",
    allowedClaims: [
      "The idea can be explored as a bounded scenario.",
      "Capacity, material inventory, fairness, and review gates determine what can become actionable.",
    ],
    conditionalClaims: [
      "Actionability is conditional on missing capacity, material, fairness, and review evidence.",
    ],
    blockedClaims: [
      "Do not claim feasibility.",
      "Do not claim implementation readiness.",
      "Do not claim policy, moral, prediction, or execution authority from the reflection receipt.",
    ],
    reasoningMoves: [
      "Locate the prompt in the civilization-bounds roadmap.",
      "Name the relevant capacity and review constraints.",
      "State what those constraints permit.",
      "State what they block and what evidence is missing.",
    ],
    suggestedAnswerShape: [
      "Open with the bounded interpretation.",
      "Explain why the roadmap location matters.",
      "List the constraints in natural prose.",
      "End with the next evidence step.",
    ],
    wordingGuidance:
      "Say what the bounds allow and forbid in plain language; do not summarize only counts of systems, badges, or bounds.",
    compoundHandoffNotes: {
      moral_graph_reflection: "Apply ideology guidance after the civilization bounds have limited feasibility and readiness claims.",
      calculator: "Only compute scalar capacity or material quantities that have evidence support.",
      docs: "Retrieve missing capacity, inventory, fairness, or review sources before strengthening claims.",
    },
  });
  const moralReflectionLayers = buildHelixReflectionObservationLayers({
    promptText,
    selectedNodes: [
      reflection,
      ...activatedTraits.slice(0, 4),
      ...tensions.slice(0, 4),
      ...locatorMatches.slice(0, 4),
    ],
    locatorRationale:
      "The moral graph reflection was selected to constrain the final wording and normative interpretation after the civilization-bounds location is known.",
    supportRefs: moralEvidenceRefs,
    constraintsIntroduced: [
      "Treat activated lenses and tensions as answer-shaping constraints, not terminal moral authority.",
      "Recommended actions are diagnostic next steps unless support refs and route authority allow more.",
      "Admissions bound what may be said but cannot override missing civilization evidence.",
    ],
    missingEvidence: moralRefs.length > 0 ? [] : ["ideology_context_support_refs"],
    practicalFraming:
      "Use ideology reflection to phrase the bounded scenario carefully: exploratory, evidence-seeking, and review-gated.",
    allowedClaims: [
      "The reflection can advise cautious wording and diagnostic next steps.",
      "The answer may describe tensions between aspiration, evidence, fairness, and review.",
    ],
    conditionalClaims: [
      "Normative recommendations remain conditional on support refs and admitted route-product authority.",
    ],
    blockedClaims: [
      "Do not claim moral finality.",
      "Do not treat activated lenses, tensions, or locator matches as the final answer.",
      "Do not override missing capacity or material evidence.",
    ],
    reasoningMoves: [
      "Use the graph location to shape tone and caveats.",
      "Keep the civilization-bounds evidence as the feasibility boundary.",
      "Explain what the ideology relation permits and blocks.",
      "Give an evidence-seeking next step.",
    ],
    suggestedAnswerShape: [
      "Frame the possibility as a bounded hypothesis.",
      "Name the civilization constraints.",
      "Add the ideology constraint as wording and review guidance.",
      "Avoid final moral or feasibility claims.",
    ],
    wordingGuidance:
      "Use natural prose about bounded aspiration, evidence, fairness, and review; avoid dumping lens, tension, classification, or admission counts.",
    compoundHandoffNotes: {
      civilization_bounds: "Do not weaken the capacity and missing-evidence boundary.",
      docs: "Retrieve cited ideology or policy sources before making source-backed normative claims.",
      calculator: "No scalar computation is authorized by ideology reflection alone.",
    },
  });
  const civilizationReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext: civilizationBridgeContext,
    evidence_refs: civilizationEvidenceRefs,
    ...civilizationReflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const moralReceipt = {
    schema: "helix_moral_graph_reflection_tool_result.v1",
    kind: "helix_moral_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: moralEvidenceRefs,
    ...moralReflectionLayers,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "civilization_bounds",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        args: { roadmap_id: roadmapId, title },
        observationKind: "helix_civilization_bounds_tool_result",
        observationRef: civilizationObservationArtifactId,
        terminalContributionKind: "civilization_bounds_reflection_answer",
      },
      {
        subgoalIdSuffix: "moral_graph_reflection",
        requestedCapability: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
        args: { reflection_id: reflectionId, input_summary: inputSummary },
        observationKind: "helix_moral_graph_reflection_tool_result",
        observationRef: moralObservationArtifactId,
        terminalContributionKind: "ideology_context_reflection_answer",
      },
    ],
  });
  const answerText = [
    `The reflection treats the prompt as a bounded hypothesis located in ${title} (${roadmapId}), not as proof that the idea is feasible or ready to act on.`,
    "The safe claim is that the possibility can be explored under civilization constraints: capacity, material inventory, fairness, and explicit review gates determine whether it can become actionable.",
    civilizationMissingEvidence.length > 0
      ? `The missing evidence still matters: ${civilizationMissingEvidence.slice(0, 3).join(", ")}.`
      : "No compact missing-evidence list was provided, so feasibility and readiness have to remain conditional.",
    `The ideology reflection (${reflectionId}) shapes the wording: treat aspiration as evidence-seeking and review-gated, not as moral finality or execution permission.`,
    recommendedActions.length > 0
      ? "The next usable move is to ask for the concrete capacity, material, fairness, or review evidence before making a stronger claim."
      : "The next usable move is to retrieve concrete support before strengthening the reflection.",
  ].join("\n");
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId: traceId ?? undefined,
    sessionId: sessionId ?? undefined,
    threadId: threadId ?? undefined,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_civilization_bounds_moral_reflection_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [civilizationObservationArtifactId, moralObservationArtifactId],
    status: "civilization_bounds_moral_reflection_compound",
    route: "golden_path_runtime / civilization_bounds_moral_reflection_compound",
    observedArtifactRef: civilizationObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      helix_civilization_bounds_tool_result: civilizationReceipt,
      helix_moral_graph_reflection_tool_result: moralReceipt,
    },
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: civilizationObservationArtifactId,
            kind: "helix_civilization_bounds_tool_result",
            producerItemId: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
            terminalEligible: false,
            payload: civilizationReceipt,
          },
          {
            artifactId: moralObservationArtifactId,
            kind: "helix_moral_graph_reflection_tool_result",
            producerItemId: HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
            terminalEligible: false,
            payload: moralReceipt,
          },
        ],
      }),
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    includeRouteGatePromptText: false,
  });
};
export const buildPayload = buildHelixAskGoldenPathCivilizationBoundsMoralReflectionCompoundPayload;
