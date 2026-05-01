import type {
  DocCalculatorEvidence,
  DocEquationLocation,
  DocEvidenceSynthesisAnswer,
  MathEvidenceToolResult,
} from "./calculatorEvidenceContract";

const clip = (text: string, limit = 360): string => (text.length > limit ? `${text.slice(0, limit - 1)}...` : text);

export const renderEquationLocation = (artifact: DocEquationLocation): string => {
  const equation = artifact.equations.find((entry) => entry.calculator_usable) ?? artifact.equations[0];
  const snippet = artifact.snippets[0];
  const lineLabel = snippet?.line_start ? `:L${snippet.line_start}${snippet.line_end && snippet.line_end !== snippet.line_start ? `-L${snippet.line_end}` : ""}` : "";
  return [
    "Equation-bearing source:",
    "",
    `Document: ${artifact.source_title ?? artifact.source_path}`,
    `Path: ${artifact.source_path}${lineLabel}`,
    equation?.markers?.length ? `Equation markers: ${equation.markers.join(", ")}` : null,
    "",
    "Snippet:",
    clip(equation?.raw_text ?? snippet?.text ?? ""),
    "",
    "Open location 1",
  ].filter((line): line is string => line !== null).join("\n");
};

export const renderCalculatorEvidence = (artifact: DocCalculatorEvidence): string => {
  const relation = artifact.derived_relations[0];
  const fieldLines = artifact.fields.slice(0, 8).map((field) => {
    const line = field.line_start ? ` (L${field.line_start})` : "";
    return `- ${field.name} = ${field.value}${line}`;
  });
  return [
    "Calculator-usable evidence:",
    "",
    `Document: ${artifact.source_title ?? artifact.source_path}`,
    `Path: ${artifact.source_path}`,
    `Evidence class: ${artifact.evidence_kind}`,
    relation ? `Derived relation: ${relation.expression}` : null,
    "",
    "Fields:",
    ...fieldLines,
    artifact.calculator_ingest?.assumptions.length ? "" : null,
    artifact.calculator_ingest?.assumptions.length ? "Assumptions:" : null,
    ...(artifact.calculator_ingest?.assumptions.map((entry) => `- ${entry}`) ?? []),
    "",
    "Open location 1",
  ].filter((line): line is string => line !== null).join("\n");
};

export const renderEvidenceSynthesis = (artifact: DocEvidenceSynthesisAnswer): string => artifact.answer_text;

export const renderMathEvidenceArtifact = (
  artifact: MathEvidenceToolResult["selected_artifact"],
): string | null => {
  if (!artifact) return null;
  if (artifact.kind === "doc_equation_location") return renderEquationLocation(artifact);
  if (artifact.kind === "doc_calculator_evidence") return renderCalculatorEvidence(artifact);
  return renderEvidenceSynthesis(artifact);
};
