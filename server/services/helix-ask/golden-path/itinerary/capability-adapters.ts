import { HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA } from "../../../../../shared/helix-scholarly-research-observation";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  isHelixAskGoldenPathCalculatorSolveRequested,
  readCalculatorExpression,
} from "../capabilities/calculator";
import {
  findGoldenPathDocLocationMatches,
  isHelixAskGoldenPathDocsLocateRequested,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  isHelixAskGoldenPathScholarlyResearchRequested,
  readCompactScholarlyPapers,
  readScholarlyResearchQuery,
} from "../capabilities/scholarly-research";
import {
  isHelixAskGoldenPathTheoryReflectionRequested,
  readTheoryReflectionAnchors,
  readTheoryReflectionTopic,
} from "../capabilities/theory-reflection";
import {
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import { buildHelixReflectionObservationLayers } from "../reflection-answer-guidance";
import { buildGoldenPathPromptCivilizationBoundsToolResult } from "../reflection-prompt-evidence";

export type GoldenPathItineraryTurnContext = {
  turnId: string;
  createdAtMs: number;
  promptText: string;
};

export type GoldenPathItineraryObservation = {
  subgoalIdSuffix: string;
  requestedCapability: string;
  selectedCapability?: string;
  executedCapability?: string;
  args: RecordLike;
  observationKind: string;
  observationRef: string;
  terminalContributionKind: string;
  payload: RecordLike;
  producerItemId: string;
  terminalEligible: false;
  summaryLine: string;
  workstationActions?: readonly RecordLike[];
};

export type GoldenPathItineraryAdapterFailure = {
  errorCode: string;
  brokenRail: "argument_extraction" | "observation" | "capability_execution";
  missingRequirement: string;
  text: string;
};

export type GoldenPathItineraryAdapterResult =
  | { ok: true; observation: GoldenPathItineraryObservation }
  | { ok: false; failure: GoldenPathItineraryAdapterFailure };

export type GoldenPathItineraryAdapter = {
  capability: string;
  order: number;
  detectIntent: (body: RecordLike) => boolean;
  buildObservation: (args: {
    body: RecordLike;
    turn: GoldenPathItineraryTurnContext;
    priorObservations: readonly GoldenPathItineraryObservation[];
  }) => GoldenPathItineraryAdapterResult;
};

const promptIncludes = (body: RecordLike, pattern: RegExp): boolean =>
  pattern.test(readHelixAskGoldenPathPrompt(body).toLowerCase());

const readItineraryCalculatorExpression = (body: RecordLike): string | null => {
  const direct = readCalculatorExpression(body);
  if (direct) return direct;
  const promptText = readHelixAskGoldenPathPrompt(body);
  const match = promptText.match(
    /\b\d+(?:\.\d+)?\s*(?:[+\-*/^]|×|x)\s*\d+(?:\.\d+)?(?:\s*(?:[+\-*/^]|×|x)\s*\d+(?:\.\d+)?)*\b/i,
  );
  return match?.[0]?.replace(/×/g, "*").replace(/\bx\b/gi, "*").trim() ?? null;
};

const promptRequestsConcreteDocsLookup = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathDocsLocateRequested(body)) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  if (/\b(?:docs?-viewer\.locate_in_doc|locate\s+(?:in\s+)?(?:the\s+)?(?:doc|document)|open\s+(?:the\s+)?(?:doc|document)|cite\s+(?:the\s+)?(?:doc|document|white\s*paper)|current\s+(?:doc|document)|white\s*paper)\b/.test(prompt)) {
    return true;
  }
  if (/\bdocs\/[^\s,.;:)]+/i.test(prompt)) return true;
  if (/\.(?:md|pdf|docx?|txt)\b/i.test(prompt)) return true;
  return false;
};

const docsAdapter: GoldenPathItineraryAdapter = {
  capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  order: 10,
  detectIntent: promptRequestsConcreteDocsLookup,
  buildObservation: ({ body, turn }) => {
    const prompt = turn.promptText.toLowerCase();
    const docPath = readGoldenPathDocPath(body);
    const query =
      /\b(?:casimir|tile|newtons?|kilonewtons?|load|force|capacity)\b/.test(prompt)
        ? "Casimir tile pressure internal normal attraction stack force claim boundary"
        : readGoldenPathDocLocateQuery(body);
    const docContent = readGoldenPathDocContent(body, docPath);
    if (!query) {
      return {
        ok: false,
        failure: {
          errorCode: "missing_doc_location_query",
          brokenRail: "argument_extraction",
          missingRequirement: "doc_location_query",
          text: "I could not complete this golden-path itinerary because no document query was available.",
        },
      };
    }
    if (!docContent) {
      return {
        ok: false,
        failure: {
          errorCode: "missing_doc_content",
          brokenRail: "observation",
          missingRequirement: "doc_content",
          text: "I could not complete this golden-path itinerary because no readable document content was available.",
        },
      };
    }
    const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
    if (matches.length === 0) {
      return {
        ok: false,
        failure: {
          errorCode: "no_doc_location_matches",
          brokenRail: "observation",
          missingRequirement: "doc_location_matches",
          text: `I could not locate matching document evidence for: ${query}`,
        },
      };
    }
    const observationRef = `${turn.turnId}:doc_location_matches`;
    const payload = {
      schema: "helix.doc_location_matches.v1",
      capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      doc_path: docPath,
      query,
      match_count: matches.length,
      matches,
      assistant_answer: false,
      raw_content_included: false,
    };
    const topMatch = matches[0] ?? null;
    return {
      ok: true,
      observation: {
        subgoalIdSuffix: "docs_locate",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observationKind: "doc_location_matches",
        observationRef,
        terminalContributionKind: "doc_location_matches",
        payload,
        producerItemId: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        terminalEligible: false,
        summaryLine: topMatch
          ? `Document evidence: line ${topMatch.line} is the strongest match for "${query}".`
          : `Document evidence located for "${query}".`,
        workstationActions:
          topMatch && docPath
            ? [
                {
                  kind: "open_doc_at_line",
                  doc_path: docPath,
                  line: topMatch.line,
                  label: "Open source document evidence",
                  observation_ref: observationRef,
                },
              ]
            : [],
      },
    };
  },
};

const calculatorAdapter: GoldenPathItineraryAdapter = {
  capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  order: 20,
  detectIntent: (body) =>
    isHelixAskGoldenPathCalculatorSolveRequested(body) ||
    promptIncludes(body, /\b(?:calculate|compute|solve|calculator)\b/),
  buildObservation: ({ body, turn }) => {
    const expression = readItineraryCalculatorExpression(body);
    if (!expression) {
      return {
        ok: false,
        failure: {
          errorCode: "missing_calculator_expression",
          brokenRail: "argument_extraction",
          missingRequirement: "calculator_expression",
          text: "I could not complete this golden-path itinerary because no calculator expression was available.",
        },
      };
    }
    const result = evaluateGoldenPathCalculatorExpression(expression);
    if (result === null) {
      return {
        ok: false,
        failure: {
          errorCode: "invalid_calculator_expression",
          brokenRail: "capability_execution",
          missingRequirement: "calculator_receipt",
          text: `I could not evaluate the requested calculator expression: ${expression}`,
        },
      };
    }
    const resultText = formatGoldenPathNumber(result);
    const observationRef = `${turn.turnId}:calculator_receipt`;
    return {
      ok: true,
      observation: {
        subgoalIdSuffix: "calculator",
        requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observationKind: "calculator_receipt",
        observationRef,
        terminalContributionKind: "workstation_tool_evaluation",
        payload: {
          schema: "helix.calculator_receipt.v1",
          capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
          expression,
          result,
          result_text: resultText,
          unit: null,
          assistant_answer: false,
          raw_content_included: false,
        },
        producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        terminalEligible: false,
        summaryLine: `Calculator result: ${expression} = ${resultText}.`,
        workstationActions: [
          {
            kind: "fill_calculator_expression",
            expression_text: expression,
            result,
            result_text: resultText,
            unit: null,
            observation_ref: observationRef,
          },
        ],
      },
    };
  },
};

const theoryReflectionAdapter: GoldenPathItineraryAdapter = {
  capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  order: 30,
  detectIntent: (body) => isHelixAskGoldenPathTheoryReflectionRequested(body),
  buildObservation: ({ body, turn, priorObservations }) => {
    const topic =
      readTheoryReflectionTopic(body) ??
      readScholarlyResearchQuery(body) ??
      readGoldenPathDocLocateQuery(body) ??
      "compound evidence claim boundary";
    const anchors = readTheoryReflectionAnchors(body);
    const sourceRefs = priorObservations.map((observation) => observation.observationRef);
    const reflectionLayers = buildHelixReflectionObservationLayers({
      promptText: turn.promptText,
      selectedNodes: [topic, ...anchors],
      locatorRationale:
        "The theory reflection was selected after earlier observations so terminal synthesis can explain claim limits rather than only list receipts.",
      supportRefs: [...sourceRefs, ...anchors].slice(0, 8),
      constraintsIntroduced: [
        "Earlier observations supply facts or scalar results.",
        "Reflection bounds interpretation and cannot override weak or missing source evidence.",
        "Scientific, physical, or implementation claims require separate proof.",
      ],
      missingEvidence: sourceRefs.length > 0 ? [] : ["source_observation_refs"],
      confidence: sourceRefs.length > 0 ? "medium" : "low",
      maturity: "diagnostic",
      practicalFraming:
        "Use reflection as bounded answer guidance after evidence has entered the turn.",
      allowedClaims: [
        "The answer may report facts from prior observations.",
        "The answer may state diagnostic claim boundaries.",
      ],
      conditionalClaims: ["Broader claims are conditional on independent corroboration."],
      blockedClaims: [
        "Do not claim physical viability.",
        "Do not claim implementation readiness.",
        "Do not treat reflection as proof.",
      ],
      reasoningMoves: [
        "Name the evidence-backed point.",
        "State the reflection boundary.",
        "Separate allowed claims from blocked claims.",
      ],
      suggestedAnswerShape: [
        "Answer the concrete question first.",
        "Explain how the reflection bounds the claim.",
        "State what remains unproven.",
      ],
      wordingGuidance:
        "Write a normal grounded answer; do not expose internal route names except as provenance when needed.",
    });
    const observationRef = `${turn.turnId}:helix_theory_context_reflection_tool_receipt`;
    return {
      ok: true,
      observation: {
        subgoalIdSuffix: "theory_reflection",
        requestedCapability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        args: { topic, anchors },
        observationKind: "helix_theory_context_reflection_tool_receipt",
        observationRef,
        terminalContributionKind: "theory_context_reflection_answer",
        payload: {
          schema: "helix.theory_context_reflection_tool_receipt.v1",
          capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
          topic,
          anchors,
          source_refs: sourceRefs,
          reflection_mode: "golden_path_itinerary_evidence_context",
          ...reflectionLayers,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        producerItemId: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        terminalEligible: false,
        summaryLine: `Theory reflection: ${topic}; it is used as claim-boundary guidance, not proof.`,
      },
    };
  },
};

const civilizationBoundsAdapter: GoldenPathItineraryAdapter = {
  capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  order: 40,
  detectIntent: (body) =>
    promptIncludes(body, /\b(?:civilization\s+bounds|civilization\s+roadmap|claim\s+boundary|diagnostic\s+only|system\s+bounds)\b/),
  buildObservation: ({ turn, priorObservations }) => {
    const result = buildGoldenPathPromptCivilizationBoundsToolResult(turn.promptText);
    const roadmap = readRecord(result.roadmap) ?? {};
    const observationRef = `${turn.turnId}:helix_civilization_bounds_tool_result`;
    return {
      ok: true,
      observation: {
        subgoalIdSuffix: "civilization_bounds",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        args: { roadmap_id: readString(roadmap.roadmapId) ?? "civilization-bounds:prompt-produced" },
        observationKind: "helix_civilization_bounds_tool_result",
        observationRef,
        terminalContributionKind: "civilization_bounds_reflection_answer",
        payload: {
          schema: "helix_civilization_bounds_tool_result.v1",
          kind: "helix_civilization_bounds_tool_result",
          tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
          roadmap,
          bridgeContext: readRecord(result.bridgeContext) ?? {},
          evidence_refs: priorObservations.map((observation) => observation.observationRef).slice(0, 8),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        },
        producerItemId: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        terminalEligible: false,
        summaryLine:
          "Civilization bounds: keep the answer diagnostic/source-bounded unless capacity, material, review, and independent validation evidence are supplied.",
      },
    };
  },
};

const scholarlyResearchAdapter: GoldenPathItineraryAdapter = {
  capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  order: 50,
  detectIntent: (body) => isHelixAskGoldenPathScholarlyResearchRequested(body),
  buildObservation: ({ body, turn }) => {
    const query =
      readScholarlyResearchQuery(body) ??
      readGoldenPathDocLocateQuery(body) ??
      "scholarly evidence for compound claim boundary";
    const suppliedPapers = readCompactScholarlyPapers(body);
    const normalizedPapers = suppliedPapers.slice(0, 5).map((paper, index) => {
      const evidenceRefs = readStringArray(paper.evidence_refs ?? paper.evidenceRefs);
      return {
        result_id: readString(paper.result_id) ?? readString(paper.resultId) ?? `${turn.turnId}:paper:${index + 1}`,
        title: readString(paper.title) ?? `Untitled paper ${index + 1}`,
        authors: readArray(paper.authors).map(readRecord).filter((author): author is RecordLike => Boolean(author)),
        year: readNumber(paper.year) ?? undefined,
        venue: readString(paper.venue) ?? undefined,
        abstract: readString(paper.abstract) ?? undefined,
        identifiers: readRecord(paper.identifiers) ?? {},
        evidence_refs: evidenceRefs.length ? evidenceRefs : [`scholarly:${index + 1}`],
        source_providers: readStringArray(paper.source_providers ?? paper.sourceProviders),
        confidence: readString(paper.confidence) ?? "medium",
      };
    });
    const observationRef = `${turn.turnId}:scholarly_research_observation`;
    const weakRefs =
      normalizedPapers.length > 0
        ? normalizedPapers.flatMap((paper) => paper.evidence_refs)
        : [`${observationRef}:provider_not_called`];
    return {
      ok: true,
      observation: {
        subgoalIdSuffix: "scholarly_research",
        requestedCapability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        args: { query },
        observationKind: "scholarly_research_observation",
        observationRef,
        terminalContributionKind: "scholarly_research_answer",
        payload: {
          schema: HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
          artifact_id: observationRef,
          turn_id: turn.turnId,
          capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          query,
          intent: readString(body.scholarly_intent) ?? readString(body.scholarlyIntent) ?? "paper_search",
          providers_considered: readStringArray(body.providers_considered ?? body.providersConsidered),
          providers_called: readStringArray(body.providers_called ?? body.providersCalled),
          evidence_refs: weakRefs.map((ref) => ({
            ref,
            provider: normalizedPapers.length > 0 ? "supplied_compact_evidence" : "not_called_in_golden_path",
            retrieved_at_ms: turn.createdAtMs,
          })),
          papers: normalizedPapers,
          missing_requirements: normalizedPapers.length > 0 ? [] : ["provider_backed_scholarly_results"],
          relevance_summary:
            normalizedPapers.length > 0
              ? "Compact scholarly metadata was supplied to the turn."
              : "No provider-backed scholarly results were supplied to the deterministic golden path; treat scholarly support as missing or weak.",
          selected_for_answer: true,
          assistant_answer: false,
          raw_content_included: false,
        },
        producerItemId: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        terminalEligible: false,
        summaryLine:
          normalizedPapers.length > 0
            ? `Scholarly support: ${normalizedPapers.length} compact paper record${normalizedPapers.length === 1 ? "" : "s"} supplied.`
            : "Scholarly support: no provider-backed paper results were supplied to this deterministic golden-path turn, so scholarly corroboration stays weak or missing.",
      },
    };
  },
};

export const goldenPathItineraryAdapters: readonly GoldenPathItineraryAdapter[] = [
  docsAdapter,
  calculatorAdapter,
  theoryReflectionAdapter,
  civilizationBoundsAdapter,
  scholarlyResearchAdapter,
];
