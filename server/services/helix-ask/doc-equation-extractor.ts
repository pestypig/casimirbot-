import crypto from "node:crypto";
import {
  HELIX_DOC_EQUATION_EXTRACTION_SCHEMA,
  type HelixDocEquationExtraction,
} from "@shared/helix-doc-equation-extraction";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const compact = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const stripMarkdown = (value: string): string =>
  value
    .replace(/`+/g, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .trim();

const normalizeEquationExpression = (value: string): string | null => {
  const text = stripMarkdown(value)
    .replace(/\\tau/g, "tau")
    .replace(/\\alpha/g, "alpha")
    .replace(/\\cdot|×/g, "*")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const assignment = text.match(/\b([A-Za-z_][A-Za-z0-9_]*(?:\([^)]*\))?)\s*=\s*([^.;|]+)/);
  if (assignment) return `${assignment[1].trim()} = ${assignment[2].trim()}`;
  const relation = text.match(/\b(?:tau|proper[_\s-]*time|T|alpha)\b[^.;|]*[=+\-*/^][^.;|]*/i)?.[0];
  return relation ? relation.trim() : null;
};

export function extractDocEquationFromText(input: {
  threadId: string;
  turnId: string;
  sourceDocPath: string;
  sourceTitle?: string | null;
  text: string;
  evidenceRefs?: string[];
  createdAt?: string;
}): HelixDocEquationExtraction | null {
  const lines = input.text.split(/\r?\n/);
  const candidates = lines
    .map((line, index) => ({ line: stripMarkdown(line), index }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, index }) => ({
      line,
      index,
      normalized: normalizeEquationExpression(line),
      score:
        (/\b(?:tau|alpha|proper[_\s-]*time|coordinate[_\s-]*time|T)\b/i.test(line) ? 0.35 : 0) +
        (/[=]/.test(line) ? 0.35 : 0) +
        (/[+\-*/^]|\\frac|\\sqrt/i.test(line) ? 0.2 : 0) +
        (/\b(?:equation|formula|relation|metric|lapse)\b/i.test(line) ? 0.1 : 0),
    }))
    .filter((candidate) => candidate.normalized && candidate.score >= 0.45)
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best?.normalized) return null;
  const caveats: string[] = [];
  if (best.score < 0.8) caveats.push("Equation candidate is heuristic and should be reviewed against the source document.");
  return {
    schema: HELIX_DOC_EQUATION_EXTRACTION_SCHEMA,
    extraction_id: `doc-equation:${hashShort([input.threadId, input.turnId, input.sourceDocPath, best.normalized])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    source_doc_path: input.sourceDocPath,
    source_title: input.sourceTitle ?? null,
    equation_text: compact(best.line),
    normalized_expression: best.normalized,
    location_hint: `line ${best.index + 1}`,
    confidence: Math.min(0.95, Math.max(0.45, best.score)),
    caveats,
    evidence_refs: input.evidenceRefs ?? [],
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildDerivedExpressionFromDocEquation(extraction: HelixDocEquationExtraction): string | null {
  return extraction.normalized_expression ?? normalizeEquationExpression(extraction.equation_text);
}

