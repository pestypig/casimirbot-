import type { DocEvidenceSnippet } from "./calculatorEvidenceContract";
import type { MathEvidenceDocument } from "./mathTokenizer";
import { lineWindow } from "./mathTokenizer";

export type DetectedEquation = {
  raw_text: string;
  normalized_lhs?: string;
  normalized_rhs?: string;
  markers: string[];
  calculator_usable: boolean;
  line_start: number;
  line_end: number;
  snippet: DocEvidenceSnippet;
};

export const collectEquationMarkers = (text: string): string[] => {
  const markers = new Set<string>();
  const specs: Array<[string, RegExp]> = [
    ["=", /=/],
    ["tau", /\btau\b/i],
    ["alpha", /\balpha\b/i],
    ["formula", /\bformulas?\b/i],
    ["equation", /\bequations?\b/i],
    ["relation", /\brelations?\b/i],
    ["coordinateTimeS", /\bcoordinateTimeS\b/i],
    ["properTimeS_expected", /\bproperTimeS_expected\b/i],
    ["centerlineDtauDt", /\bcenterlineDtauDt\b/i],
  ];
  for (const [label, pattern] of specs) {
    if (pattern.test(text)) markers.add(label);
  }
  if (/\b[a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?\s*=/.test(text)) markers.add("assignment");
  return Array.from(markers);
};

export const isExplicitEquationLine = (line: string): boolean => {
  const text = line.replace(/`/g, "").replace(/\s+/g, " ").trim();
  if (!text || /^\|/.test(text)) return false;
  const hasAssignment = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?\s*=\s*[-+()a-zA-Z0-9_.*\/\s]+$/.test(text);
  if (!hasAssignment) return false;
  return /\b(?:properTimeS_expected|properMinusCoordinateS_expected|coordinateTimeS|centerlineDtauDt|alpha|tau|T)\b/.test(text);
};

const normalizeEquationParts = (line: string): { lhs?: string; rhs?: string } => {
  const cleaned = line.replace(/`/g, "").trim();
  const match = cleaned.match(/^([^=]+?)=(.+)$/);
  if (!match) return {};
  return {
    lhs: match[1]?.trim(),
    rhs: match[2]?.trim(),
  };
};

export const detectEquationsInDocument = (doc: MathEvidenceDocument): DetectedEquation[] =>
  doc.lines.flatMap((line, index) => {
    if (!isExplicitEquationLine(line)) return [];
    const markers = collectEquationMarkers(line);
    const parts = normalizeEquationParts(line);
    const snippet = lineWindow(doc.lines, index, 1);
    return [
      {
        raw_text: line.replace(/`/g, "").trim(),
        normalized_lhs: parts.lhs,
        normalized_rhs: parts.rhs,
        markers,
        calculator_usable:
          /\b(?:properTimeS_expected|coordinateTimeS|alpha|T|centerlineDtauDt)\b/.test(line) && markers.includes("="),
        line_start: index + 1,
        line_end: index + 1,
        snippet,
      },
    ];
  });
