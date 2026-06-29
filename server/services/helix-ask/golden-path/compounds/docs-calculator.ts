import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  readCalculatorExpression,
} from "../capabilities/calculator";
import {
  findGoldenPathDocLocationMatches,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundCapabilityContract,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import { buildGoldenPathCompoundSuccessPayload } from "../compound-success";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readString,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathTypedFailureLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathCompoundRuntimeStatus } from "../runtime-status";
import { buildGoldenPathCompoundDebugMirror } from "../debug-mirror";

export type HelixAskGoldenPathDocsCalculatorCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["doc_location_matches", "calculator_receipt"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    observation_kind: "doc_location_matches",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    observation_kind: "calculator_receipt",
  },
] as const;
export const isRequested = isHelixAskGoldenPathDocsCalculatorCompoundRequested;
export const buildHelixAskGoldenPathDocsCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathDocsCalculatorCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-docs-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);
  const expression = readCalculatorExpression(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches"
      | "missing_calculator_expression"
      | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "observation" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    return buildGoldenPathCompoundTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      classifierReasons: ["explicit_docs_calculator_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "docs_calculator_compound_failed",
      route: "golden_path_runtime / docs_calculator_compound",
      requiredObservationKinds,
      planArgs: { doc_path: docPath, query, expression },
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs/calculator turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs/calculator turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path docs/calculator turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path docs/calculator turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const resultText = formatGoldenPathNumber(result);
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "docs_locate",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observationKind: "doc_location_matches",
        observationRef: docObservationArtifactId,
        terminalContributionKind: "doc_location_matches",
      },
      {
        subgoalIdSuffix: "calculator",
        requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observationKind: "calculator_receipt",
        observationRef: calculatorObservationArtifactId,
        terminalContributionKind: "workstation_tool_evaluation",
      },
    ],
  });
  const answerText = [
    "Compound docs/calculator synthesis completed.",
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    `Calculator expression: ${expression}`,
    `Calculator result: ${resultText}`,
    "The document evidence and calculator receipt are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_docs_calculator_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [docObservationArtifactId, calculatorObservationArtifactId],
    status: "docs_calculator_compound",
    route: "golden_path_runtime / docs_calculator_compound",
    observedArtifactRef: docObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      doc_location_matches: docLocationMatches,
      calculator_receipt: calculatorReceipt,
    },
    observationLedgerArtifacts: ({ goalHash }) => [
      buildGoldenPathObservationLedgerArtifact({
        artifactId: docObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "doc_location_matches",
        producerItemId: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        terminalEligible: false,
        payload: docLocationMatches,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: calculatorObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "calculator_receipt",
        producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        terminalEligible: false,
        payload: calculatorReceipt,
      }),
    ],
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_synthesis",
  });
};
export const buildPayload = buildHelixAskGoldenPathDocsCalculatorCompoundPayload;
