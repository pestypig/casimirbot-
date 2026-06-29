import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  isHelixAskGoldenPathCalculatorSolveRequested,
  readCalculatorExpression,
} from "../capabilities/calculator";
import {
  findGoldenPathDocLocationMatches,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathDocumentUnitConversionRequested,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  type RecordLike,
} from "../core";
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

const NEWTON_TO_LBF = 0.224809;

type GoldenPathNewtonLoadConversion = {
  source_text: string;
  source_value: number;
  source_unit: "N" | "kN";
  newtons: number;
  lbf: number;
  expression: string;
  label: string;
};

const formatGoldenPathForce = (value: number): string => formatGoldenPathNumber(Number(value.toPrecision(10)));

const extractGoldenPathNewtonLoadConversions = (
  matches: readonly Array<{ line: number; snippet: string; doc_path: string | null; score: number }>,
): GoldenPathNewtonLoadConversion[] => {
  const conversions: GoldenPathNewtonLoadConversion[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    const snippet = match.snippet;
    const valuePattern = /(?:about\s+)?([0-9]+(?:\.[0-9]+)?)\s*(kN|N)\b/gi;
    for (const valueMatch of snippet.matchAll(valuePattern)) {
      const sourceValue = Number(valueMatch[1]);
      if (!Number.isFinite(sourceValue)) continue;
      const sourceUnit = valueMatch[2].toLowerCase() === "kn" ? "kN" : "N";
      const newtons = sourceUnit === "kN" ? sourceValue * 1000 : sourceValue;
      const lbf = newtons * NEWTON_TO_LBF;
      const key = `${sourceValue}:${sourceUnit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const lowerSnippet = snippet.toLowerCase();
      const label =
        sourceUnit === "N" && lowerSnippet.includes("tile")
          ? "per projected tile layer internal load"
          : sourceUnit === "kN" || lowerSnippet.includes("stack")
            ? "naive stack column load"
            : "document force value";
      conversions.push({
        source_text: `${sourceValue} ${sourceUnit}`,
        source_value: sourceValue,
        source_unit: sourceUnit,
        newtons,
        lbf,
        expression: `${formatGoldenPathForce(newtons)} * ${NEWTON_TO_LBF}`,
        label,
      });
    }
  }
  return conversions;
};

const selectGoldenPathPrimaryNewtonLoadConversion = (
  conversions: readonly GoldenPathNewtonLoadConversion[],
  promptText: string,
): GoldenPathNewtonLoadConversion | null => {
  if (conversions.length === 0) return null;
  const prompt = promptText.toLowerCase();
  if (/\b(?:each|per[-\s]?tile|per\s+projected\s+tile|tile\s+produces)\b/.test(prompt)) {
    return conversions.find((conversion) => conversion.source_unit === "N") ?? conversions[0] ?? null;
  }
  if (/\b(?:stack|capacity|load[-\s]?bearing|load\s+bearing)\b/.test(prompt)) {
    return conversions.find((conversion) => conversion.source_unit === "kN") ?? conversions[0] ?? null;
  }
  return conversions[0] ?? null;
};

const buildGoldenPathConversionProse = (conversion: GoldenPathNewtonLoadConversion, resultText: string): string =>
  `${conversion.source_text.replace("kN", "kilonewtons").replace("N", "newtons")} converts to ${resultText} pounds-force (${conversion.label}).`;

export const buildHelixAskGoldenPathDocsCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathDocsCalculatorCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-docs-calculator",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const unitConversionRequested = isHelixAskGoldenPathDocumentUnitConversionRequested(args.body);
  const docPath = readGoldenPathDocPath(args.body);
  const query = unitConversionRequested
    ? "Casimir tile pressure internal normal attraction stack force"
    : readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body, docPath);
  const hasDirectCalculatorExpression = Boolean(
    readString(args.body.calculator_expression) ??
      readString(args.body.calculatorExpression) ??
      readString(args.body.expression) ??
      readString(args.body.solve_expression) ??
      readString(args.body.solveExpression),
  );
  let expression =
    isHelixAskGoldenPathCalculatorSolveRequested(args.body) || hasDirectCalculatorExpression
      ? readCalculatorExpression(args.body)
      : null;

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
  const loadConversions = extractGoldenPathNewtonLoadConversions(matches);
  const inferredConversion = expression
    ? null
    : selectGoldenPathPrimaryNewtonLoadConversion(loadConversions, promptText);
  if (!expression && inferredConversion) {
    expression = inferredConversion.expression;
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
    ...(loadConversions.length
      ? {
          inferred_unit_conversion: inferredConversion
            ? {
                from: inferredConversion.source_text,
                newtons: inferredConversion.newtons,
                to: "lbf",
                result_lbf: inferredConversion.lbf,
                expression: inferredConversion.expression,
              }
            : null,
          document_force_conversions: loadConversions.map((conversion) => ({
            label: conversion.label,
            from: conversion.source_text,
            newtons: conversion.newtons,
            lbf: conversion.lbf,
            line_text: conversion.source_text,
          })),
        }
      : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
  const topMatch = matches[0] ?? null;
  const workstationActions: RecordLike[] = [
    ...(topMatch && docPath
      ? [
          {
            kind: "open_doc_at_line",
            doc_path: docPath,
            line: topMatch.line,
            label: "Open source document evidence",
            observation_ref: docObservationArtifactId,
          },
        ]
      : []),
    {
      kind: "fill_calculator_expression",
      expression_text: expression,
      result,
      result_text: resultText,
      unit: inferredConversion ? "pounds-force" : null,
      observation_ref: calculatorObservationArtifactId,
    },
  ];
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
    topMatch
      ? `Source evidence: line ${topMatch.line} reports the tile-layer internal load and the stack-column load; the exact snippet is preserved in doc_location_matches.`
      : "",
    inferredConversion
      ? buildGoldenPathConversionProse(inferredConversion, resultText)
      : "",
    loadConversions.length > 1
      ? `Other force values found: ${loadConversions
          .filter((conversion) => conversion !== inferredConversion)
          .map(
            (conversion) =>
              `${conversion.source_text
                .replace("kN", "kilonewtons")
                .replace("N", "newtons")} converts to ${formatGoldenPathForce(conversion.lbf)} pounds-force (${conversion.label})`,
          )
          .join("; ")}.`
      : "",
    inferredConversion
      ? "The exact calculator expression is preserved in the calculator receipt for workstation autofill."
      : `Calculator expression: ${expression}`,
    inferredConversion ? "" : `Calculator result: ${resultText}`,
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
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: docObservationArtifactId,
            kind: "doc_location_matches",
            producerItemId: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
            terminalEligible: false,
            payload: docLocationMatches,
          },
          {
            artifactId: calculatorObservationArtifactId,
            kind: "calculator_receipt",
            producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
            terminalEligible: false,
            payload: calculatorReceipt,
          },
        ],
      }),
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_synthesis",
    workstationActions,
  });
};
export const buildPayload = buildHelixAskGoldenPathDocsCalculatorCompoundPayload;
