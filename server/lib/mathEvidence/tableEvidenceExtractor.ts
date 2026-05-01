import type { CalculatorSemanticRole, DocCalculatorEvidence, MathEvidenceConfidence } from "./calculatorEvidenceContract";
import type { MathEvidenceDocument } from "./mathTokenizer";
import { lineWindow } from "./mathTokenizer";

export type TableCalculatorFieldBinding = {
  raw_key: string;
  normalized_key: string;
  value: string | number;
  semantic_role: CalculatorSemanticRole;
  source_path: string;
  line_start?: number;
  line_end?: number;
  raw_text: string;
  confidence: MathEvidenceConfidence;
};

export const normalizeFieldKey = (key: string): string => key.trim().toLowerCase().replace(/[._\-\s]+/g, "");

export const classifyCalculatorField = (rawKey: string): CalculatorSemanticRole => {
  const key = normalizeFieldKey(rawKey);
  if (!key) return "unknown";
  if (key.includes("propervscoordinateratio")) return "proper_vs_coordinate_ratio";
  if (key.includes("coordinatevsclassicalratio")) return "coordinate_vs_classical_ratio";
  if (key.includes("warppropertimeestimate") || key === "propertimes") return "proper_time";
  if (key.includes("warpcoordinatetimeestimate") || key === "coordinatetimes") return "coordinate_time";
  if (key.includes("shiftlapsecenterlinedtaudt") || key.includes("centerlinedtaudt") || key.includes("centerlinealpha")) {
    return "alpha";
  }
  if (key === "alpha") return "alpha";
  return "unknown";
};

const parseValue = (raw: string): string | number => {
  const trimmed = raw.trim();
  const numeric = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : trimmed;
};

export const extractTableCalculatorFields = (doc: MathEvidenceDocument): TableCalculatorFieldBinding[] =>
  doc.lines.flatMap((line, index) => {
    const fields: TableCalculatorFieldBinding[] = [];
    const add = (key: string, value: string, rawText: string): void => {
      const semanticRole = classifyCalculatorField(key);
      if (semanticRole === "unknown") return;
      fields.push({
        raw_key: key.trim(),
        normalized_key: normalizeFieldKey(key),
        value: parseValue(value),
        semantic_role: semanticRole,
        source_path: doc.path,
        line_start: index + 1,
        line_end: index + 1,
        raw_text: rawText.trim(),
        confidence: "high",
      });
    };

    const tableMatch = line.match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if (tableMatch) add(tableMatch[1] ?? "", tableMatch[2] ?? "", line);

    for (const match of line.matchAll(/\b([A-Za-z_][A-Za-z0-9_.-]+)\s*[:=]\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/gi)) {
      add(match[1] ?? "", match[2] ?? "", match[0] ?? line);
    }
    return fields;
  });

export const deriveCalculatorRelations = (
  fields: TableCalculatorFieldBinding[],
): DocCalculatorEvidence["derived_relations"] => {
  const alpha = fields.find((field) => field.semantic_role === "alpha");
  const properRatio = fields.find((field) => field.semantic_role === "proper_vs_coordinate_ratio");
  const coordinateRatio = fields.find((field) => field.semantic_role === "coordinate_vs_classical_ratio");
  const relations: DocCalculatorEvidence["derived_relations"] = [];
  if (alpha) {
    relations.push({
      expression: "proper_time = alpha * coordinate_time",
      derived_from_fields: [alpha.raw_key],
      derivation_rule: "alpha_times_coordinate_time",
      confidence: "high",
    });
  }
  if (properRatio) {
    relations.push({
      expression: "proper_time = properVsCoordinate_ratio * coordinate_time",
      derived_from_fields: [properRatio.raw_key],
      derivation_rule: "ratio_interpretation",
      confidence: coordinateRatio ? "high" : "medium",
    });
  }
  return relations;
};

export const buildFieldSnippets = (doc: MathEvidenceDocument, fields: TableCalculatorFieldBinding[]) => {
  const seen = new Set<number>();
  return fields
    .filter((field) => typeof field.line_start === "number")
    .flatMap((field) => {
      const line = Number(field.line_start);
      if (seen.has(line)) return [];
      seen.add(line);
      return [lineWindow(doc.lines, line - 1, 1)];
    });
};
