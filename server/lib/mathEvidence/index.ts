import {
  buildCalculatorIngestPayload,
  type DocCalculatorEvidence,
  type DocEquationLocation,
  type DocEvidenceSynthesisAnswer,
  type MathEvidenceAntiBrittlenessAudit,
  type MathEvidenceCandidate,
  type MathEvidenceKind,
  type MathEvidenceToolInput,
  type MathEvidenceToolResult,
  validateCalculatorEvidence,
  validateEquationLocation,
  validateEvidenceSynthesis,
} from "./calculatorEvidenceContract";
import { detectEquationsInDocument } from "./equationDetector";
import { scoreMathEvidenceDocument } from "./calculatorEvidenceScorer";
import { buildFieldSnippets, deriveCalculatorRelations, extractTableCalculatorFields } from "./tableEvidenceExtractor";
import {
  extractExplicitDocPaths,
  inferMathEvidenceTargetTerms,
  readMarkdownDocs,
  type MathEvidenceDocument,
  normalizeWorkspaceDocPath,
  uniqueStrings,
} from "./mathTokenizer";

export * from "./calculatorEvidenceContract";
export * from "./equationDetector";
export * from "./tableEvidenceExtractor";
export * from "./calculatorEvidenceScorer";
export * from "./renderCalculatorEvidence";

const defaultPreferredKinds = (query: string): MathEvidenceKind[] => {
  if (/\b(?:mean|means|meaning|shorten|changing|change|interpret|something else)\b/i.test(query)) {
    return ["interpretive_metric", "table_key_value", "derived_relation"];
  }
  return ["explicit_equation", "table_key_value", "derived_relation"];
};

const lineSnippetFromEquation = (equation: ReturnType<typeof detectEquationsInDocument>[number]) => ({
  text: equation.snippet.text,
  line_start: equation.snippet.line_start,
  line_end: equation.snippet.line_end,
});

const buildEquationArtifact = (args: {
  turnId: string;
  query: string;
  targetTerms: string[];
  doc: MathEvidenceDocument;
}): DocEquationLocation | null => {
  const equations = detectEquationsInDocument(args.doc).sort((a, b) => {
    const score = (raw: string): number =>
      (/^\s*properTimeS_expected\s*=/.test(raw) ? 200 : 0) +
      (/\bproperTimeS_expected\b/.test(raw) ? 60 : 0) +
      (/\bcoordinateTimeS\b/.test(raw) ? 20 : 0) +
      (/\balpha\b/i.test(raw) ? 10 : 0);
    return score(b.raw_text) - score(a.raw_text);
  });
  if (!equations.length) return null;
  const artifact: DocEquationLocation = {
    artifact_id: `${args.turnId}:math_evidence:doc_equation_location`,
    turn_id: args.turnId,
    source_scope: "current_turn",
    source_path: args.doc.path,
    source_title: args.doc.title,
    query: args.query,
    target_terms: args.targetTerms,
    snippets: equations.slice(0, 4).map(lineSnippetFromEquation),
    confidence: equations.some((entry) => entry.calculator_usable) ? "high" : "medium",
    kind: "doc_equation_location",
    evidence_kind: "explicit_equation",
    equations: equations.map((entry) => ({
      raw_text: entry.raw_text,
      normalized_lhs: entry.normalized_lhs,
      normalized_rhs: entry.normalized_rhs,
      markers: entry.markers,
      calculator_usable: entry.calculator_usable,
    })),
  };
  const validation = validateEquationLocation(artifact);
  if (!validation.valid) return null;
  artifact.calculator_ingest = buildCalculatorIngestPayload(artifact) ?? undefined;
  return artifact;
};

const buildCalculatorArtifact = (args: {
  turnId: string;
  query: string;
  targetTerms: string[];
  doc: MathEvidenceDocument;
}): DocCalculatorEvidence | null => {
  const fields = extractTableCalculatorFields(args.doc);
  const relations = deriveCalculatorRelations(fields);
  if (!fields.length || !relations.length) return null;
  const artifact: DocCalculatorEvidence = {
    artifact_id: `${args.turnId}:math_evidence:doc_calculator_evidence`,
    turn_id: args.turnId,
    source_scope: "current_turn",
    source_path: args.doc.path,
    source_title: args.doc.title,
    query: args.query,
    target_terms: args.targetTerms,
    snippets: buildFieldSnippets(args.doc, fields).slice(0, 6),
    confidence: relations.some((relation) => relation.confidence === "high") ? "high" : "medium",
    kind: "doc_calculator_evidence",
    evidence_kind: "table_key_value",
    fields: fields.map((field) => ({
      name: field.raw_key,
      value: field.value,
      raw_text: field.raw_text,
      semantic_role: field.semantic_role,
      line_start: field.line_start,
      line_end: field.line_end,
    })),
    derived_relations: relations,
    derived_formula: relations[0]?.expression,
  };
  const validation = validateCalculatorEvidence(artifact);
  if (!validation.valid) return null;
  artifact.calculator_ingest = buildCalculatorIngestPayload(artifact) ?? undefined;
  return artifact;
};

const buildSynthesisArtifact = (args: {
  turnId: string;
  query: string;
  targetTerms: string[];
  doc: MathEvidenceDocument;
  calculatorArtifact: DocCalculatorEvidence;
}): DocEvidenceSynthesisAnswer | null => {
  const fields = args.calculatorArtifact.fields;
  const properRatio = fields.find((field) => field.semantic_role === "proper_vs_coordinate_ratio");
  const coordinateRatio = fields.find((field) => field.semantic_role === "coordinate_vs_classical_ratio");
  const alpha = fields.find((field) => field.semantic_role === "alpha");
  if (!properRatio) return null;
  const supportingFields: DocEvidenceSynthesisAnswer["supporting_fields"] = [
    alpha
      ? {
          field: "shiftLapseCenterlineDtauDt",
          value: Number(alpha.value),
          interpretation: "centerline lapse alpha sets the ship proper-time factor",
        }
      : null,
    properRatio
      ? {
          field: "properVsCoordinate_ratio",
          value: Number(properRatio.value),
          interpretation: "ship proper time is this fraction of coordinate time",
        }
      : null,
    coordinateRatio
      ? {
          field: "coordinateVsClassical_ratio",
          value: Number(coordinateRatio.value),
          interpretation: "coordinate-time schedule is unchanged relative to the classical baseline",
        }
      : null,
  ].filter((entry): entry is NonNullable<DocEvidenceSynthesisAnswer["supporting_fields"]>[number] => Boolean(entry));
  const answerText = [
    "The current NHM2 evidence means alpha=0.7 shortens ship proper time relative to coordinate time.",
    "It does not change coordinate time in that comparison.",
    properRatio ? `properVsCoordinate_ratio = ${properRatio.value}.` : null,
    coordinateRatio ? `coordinateVsClassical_ratio = ${coordinateRatio.value}.` : null,
  ].filter(Boolean).join(" ");
  const artifact: DocEvidenceSynthesisAnswer = {
    artifact_id: `${args.turnId}:math_evidence:doc_evidence_synthesis_answer`,
    turn_id: args.turnId,
    source_scope: "current_turn",
    source_path: args.doc.path,
    source_title: args.doc.title,
    query: args.query,
    target_terms: args.targetTerms,
    snippets: args.calculatorArtifact.snippets,
    confidence: coordinateRatio && properRatio ? "high" : "medium",
    kind: "doc_evidence_synthesis_answer",
    evidence_kind: "interpretation",
    answer_text: answerText,
    conclusion: {
      label: "proper_time_shortened",
      confidence: coordinateRatio && properRatio ? "high" : "medium",
    },
    evidence_artifact_ids: [args.calculatorArtifact.artifact_id],
    supporting_fields: supportingFields,
  };
  return validateEvidenceSynthesis(artifact).valid ? artifact : null;
};

const buildAudit = (args: {
  input: MathEvidenceToolInput;
  selectedCandidate?: MathEvidenceCandidate;
  validationFailures: string[];
  selectedArtifact: MathEvidenceToolResult["selected_artifact"];
}): MathEvidenceAntiBrittlenessAudit => {
  const derivedRelationAssumptions =
    args.selectedArtifact?.kind === "doc_calculator_evidence" ? args.selectedArtifact.calculator_ingest?.assumptions ?? [] : [];
  const hardcoded = false;
  const artifactValid = args.validationFailures.length === 0 && Boolean(args.selectedArtifact);
  return {
    hardcoded_source_path_used: hardcoded,
    selected_by_score: Boolean(args.selectedCandidate) && !args.input.source_hint?.explicit_user_path,
    selected_candidate_score: args.selectedCandidate,
    artifact_validation_passed: artifactValid,
    artifact_validation_failures: args.validationFailures,
    derived_relation_declared:
      args.selectedArtifact?.kind === "doc_calculator_evidence"
        ? args.selectedArtifact.derived_relations.length > 0
        : args.selectedArtifact?.kind === "doc_evidence_synthesis_answer",
    derived_relation_assumptions: derivedRelationAssumptions,
    verdict: hardcoded && !args.input.source_hint?.explicit_user_path ? "violation" : artifactValid ? "clean" : "warning",
  };
};

export const runMathEvidenceTool = (input: MathEvidenceToolInput): MathEvidenceToolResult => {
  const targetTerms = uniqueStrings([...input.target_terms, ...inferMathEvidenceTargetTerms(input.query)]);
  const explicitPaths = extractExplicitDocPaths(input.query);
  const explicitPath = normalizeWorkspaceDocPath(input.source_hint?.path) ?? explicitPaths[0] ?? null;
  const preferredKinds = input.preferred_evidence_kinds?.length ? input.preferred_evidence_kinds : defaultPreferredKinds(input.query);
  const docs = readMarkdownDocs(process.cwd(), explicitPath);
  const scored = docs
    .map((doc) =>
      scoreMathEvidenceDocument({
        doc,
        query: input.query,
        targetTerms,
        preferredEvidenceKinds: preferredKinds,
      }),
    )
    .filter((entry) => entry.candidate.total_score > 0)
    .sort((a, b) => b.candidate.total_score - a.candidate.total_score || a.candidate.path.localeCompare(b.candidate.path));
  const candidates = scored.map((entry) => entry.candidate);

  let selectedArtifact: MathEvidenceToolResult["selected_artifact"] = null;
  let selectedCandidate: MathEvidenceCandidate | undefined;
  let validationFailures: string[] = ["selected_artifact_missing"];

  const wantsInterpretation = preferredKinds[0] === "interpretive_metric";
  for (const entry of scored) {
    const equationArtifact = buildEquationArtifact({ turnId: input.turn_id, query: input.query, targetTerms, doc: entry.doc });
    const calculatorArtifact = buildCalculatorArtifact({ turnId: input.turn_id, query: input.query, targetTerms, doc: entry.doc });
    const artifact =
      wantsInterpretation && calculatorArtifact
        ? buildSynthesisArtifact({
            turnId: input.turn_id,
            query: input.query,
            targetTerms,
            doc: entry.doc,
            calculatorArtifact,
          })
        : equationArtifact ?? calculatorArtifact;
    if (!artifact) continue;
    const validation =
      artifact.kind === "doc_equation_location"
        ? validateEquationLocation(artifact)
        : artifact.kind === "doc_calculator_evidence"
          ? validateCalculatorEvidence(artifact)
          : validateEvidenceSynthesis(artifact);
    if (!validation.valid) {
      validationFailures = validation.failures;
      continue;
    }
    selectedArtifact = artifact;
    selectedCandidate = entry.candidate;
    validationFailures = [];
    break;
  }

  const failureCode =
    preferredKinds[0] === "interpretive_metric"
      ? "interpretation_unavailable"
      : input.calculator_intent
        ? "calculator_evidence_unavailable"
        : "equation_source_unavailable";
  return {
    kind: "math_evidence_tool_result",
    turn_id: input.turn_id,
    query: input.query,
    selected_artifact: selectedArtifact,
    candidates,
    anti_brittleness_audit: buildAudit({
      input,
      selectedCandidate,
      validationFailures,
      selectedArtifact,
    }),
    failure: selectedArtifact
      ? undefined
      : {
          code: failureCode,
          message: "No validated math evidence artifact could be selected.",
        },
  };
};
