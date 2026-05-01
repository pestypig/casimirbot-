import type { MathEvidenceCandidate, MathEvidenceKind } from "./calculatorEvidenceContract";
import { detectEquationsInDocument } from "./equationDetector";
import { deriveCalculatorRelations, extractTableCalculatorFields } from "./tableEvidenceExtractor";
import type { MathEvidenceDocument } from "./mathTokenizer";
import { includesFolded, uniqueStrings } from "./mathTokenizer";

export type ScoredMathEvidenceDocument = {
  doc: MathEvidenceDocument;
  candidate: MathEvidenceCandidate;
};

const classifySourceRole = (doc: MathEvidenceDocument): MathEvidenceCandidate["source_role"] => {
  const lower = doc.path.toLowerCase();
  if (lower.endsWith(".json.md") || lower.includes("/artifacts/")) return "artifact_json";
  if (lower.includes("table") || lower.includes("comparison")) return "data_table";
  if (lower.includes("/audits/")) return "audit_doc";
  if (lower.includes("/runbook") || lower.includes("runbook")) return "runbook";
  if (lower.includes("/research/")) return "scientific_report";
  return "unknown";
};

const sourceRoleScore = (role: MathEvidenceCandidate["source_role"]): number =>
  role === "scientific_report" ? 8 : role === "audit_doc" || role === "data_table" ? 5 : role === "runbook" ? -4 : 0;

export const scoreMathEvidenceDocument = (args: {
  doc: MathEvidenceDocument;
  query: string;
  targetTerms: string[];
  preferredEvidenceKinds: MathEvidenceKind[];
}): ScoredMathEvidenceDocument => {
  const equations = detectEquationsInDocument(args.doc);
  const fields = extractTableCalculatorFields(args.doc);
  const relations = deriveCalculatorRelations(fields);
  const haystack = `${args.doc.path}\n${args.doc.title ?? ""}\n${args.doc.text}`;
  const matchedTerms = uniqueStrings(args.targetTerms.filter((term) => includesFolded(haystack, term)));
  const missingTerms = uniqueStrings(args.targetTerms.filter((term) => !includesFolded(haystack, term)));
  const sourceRole = classifySourceRole(args.doc);
  const evidenceKindsFound = uniqueStrings([
    equations.length ? "explicit_equation" : null,
    fields.length ? "table_key_value" : null,
    relations.length ? "derived_relation" : null,
    /properVsCoordinate_ratio|coordinateVsClassical_ratio|shortens ship proper time/i.test(args.doc.text)
      ? "interpretive_metric"
      : null,
  ]) as MathEvidenceKind[];

  const explicitFormulaScore =
    equations.length * 12 +
    equations.filter((entry) => entry.calculator_usable).length * 18 +
    (args.doc.text.includes("properTimeS_expected") ? 20 : 0) +
    (args.doc.text.includes("coordinateTimeS") ? 8 : 0) +
    (args.doc.text.includes("centerlineDtauDt") ? 8 : 0);
  const tableEvidenceScore =
    fields.filter((field) => field.semantic_role !== "unknown").length * 7 +
    (fields.some((field) => field.semantic_role === "alpha") ? 12 : 0) +
    (fields.some((field) => field.semantic_role === "proper_vs_coordinate_ratio") ? 10 : 0) +
    (fields.some((field) => field.semantic_role === "coordinate_vs_classical_ratio") ? 8 : 0);
  const calculatorUsabilityScore =
    (equations.some((entry) => entry.calculator_usable) ? 25 : 0) +
    relations.length * 15 +
    (fields.some((field) => field.semantic_role === "alpha") && relations.length ? 12 : 0);
  const topicAnchorScore = matchedTerms.length * 4 + (/\bNHM2\b/i.test(haystack) ? 8 : 0);
  const queryPathScore =
    (/\bmission[-\s]?time\b/i.test(args.query) && /mission-time-comparison/i.test(args.doc.path) ? 40 : 0) +
    (/\b0p7000\b/i.test(args.query) && /0p7000/i.test(args.doc.path) ? 20 : 0) +
    (/\bproperVsCoordinate_ratio\b/i.test(args.query) && /mission-time-comparison/i.test(args.doc.path) ? 10 : 0) +
    (/\bcoordinateVsClassical_ratio\b/i.test(args.query) && /mission-time-comparison/i.test(args.doc.path) ? 10 : 0);
  const preferredKindScore = args.preferredEvidenceKinds.reduce(
    (sum, kind) => sum + (evidenceKindsFound.includes(kind) ? 10 : 0),
    0,
  );
  const prefersTableEvidence =
    args.preferredEvidenceKinds[0] === "table_key_value" || args.preferredEvidenceKinds[0] === "derived_relation";
  const totalScore =
    (prefersTableEvidence ? 0 : explicitFormulaScore) +
    tableEvidenceScore +
    calculatorUsabilityScore +
    topicAnchorScore +
    queryPathScore +
    preferredKindScore +
    sourceRoleScore(sourceRole);

  return {
    doc: args.doc,
    candidate: {
      path: args.doc.path,
      title: args.doc.title,
      source_role: sourceRole,
      explicit_formula_score: explicitFormulaScore,
      table_evidence_score: tableEvidenceScore,
      calculator_usability_score: calculatorUsabilityScore,
      topic_anchor_score: topicAnchorScore,
      matched_terms: matchedTerms,
      missing_terms: missingTerms,
      evidence_kinds_found: evidenceKindsFound,
      total_score: totalScore,
      rejection_reason: totalScore <= 0 ? "no_math_evidence_score" : undefined,
    },
  };
};
