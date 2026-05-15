import crypto from "node:crypto";
import {
  HELIX_DERIVED_EQUATION_SCHEMA,
  type HelixDerivedEquation,
} from "@shared/helix-derived-equation";
import type { HelixDocEquationExtraction } from "@shared/helix-doc-equation-extraction";
import type { HelixVisualExtractionEvidence } from "@shared/helix-visual-extraction-evidence";

const hashShort = (parts: unknown[]): string =>
  crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 16);

type CountEntry = {
  count: number;
  source: "slot" | "count_list";
  confidence: number;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readUnclearSlotSet = (extraction: HelixVisualExtractionEvidence): Set<number> => {
  const unclear = extraction.structured_result.unclear_slots;
  if (!Array.isArray(unclear)) return new Set();
  const slots = unclear
    .map((value: unknown) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const match = value.match(/\d+/);
        return match ? Number(match[0]) : null;
      }
      const record = asRecord(value);
      const slot = Number(record?.slot);
      return Number.isFinite(slot) ? slot : null;
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return new Set(slots);
};

export function readReliableCountEntriesFromVisualExtraction(
  extraction: HelixVisualExtractionEvidence,
  options: { minConfidence?: number } = {},
): CountEntry[] {
  const minConfidence = options.minConfidence ?? 0.6;
  const unclearSlots = readUnclearSlotSet(extraction);
  const scopedSlots =
    extraction.extraction_goal === "inventory_counts"
      ? extraction.structured_result.inventory_slots ?? extraction.structured_result.hotbar_slots
      : extraction.structured_result.hotbar_slots ?? extraction.structured_result.inventory_slots;
  if (Array.isArray(scopedSlots)) {
    return scopedSlots
      .map((entry: unknown): CountEntry | null => {
        const record = asRecord(entry);
        if (!record) return null;
        const slot = Number(record.slot);
        const count = Number(record.count);
        const confidence = Number(record.confidence ?? extraction.confidence ?? 0);
        const visible = record.visible !== false;
        if (!visible) return null;
        if (!Number.isFinite(count) || count < 0) return null;
        if (Number.isFinite(slot) && unclearSlots.has(slot)) return null;
        if (!Number.isFinite(confidence) || confidence < minConfidence) return null;
        return { count, source: "slot", confidence };
      })
      .filter((entry): entry is CountEntry => Boolean(entry));
  }
  if (extraction.uncertainty.length > 0 || extraction.confidence < minConfidence) return [];
  const counts = extraction.structured_result.counts;
  if (!Array.isArray(counts)) return [];
  return counts
    .map((value: unknown): CountEntry | null => {
      const count = Number(value);
      return Number.isFinite(count) && count >= 0
        ? { count, source: "count_list", confidence: extraction.confidence }
        : null;
    })
    .filter((entry): entry is CountEntry => Boolean(entry));
}

export function readCountsFromVisualExtraction(extraction: HelixVisualExtractionEvidence): number[] {
  return readReliableCountEntriesFromVisualExtraction(extraction).map((entry) => entry.count);
}

export function buildDerivedEquationFromVisualExtraction(input: {
  threadId: string;
  turnId: string;
  extraction: HelixVisualExtractionEvidence;
  createdAt?: string;
}): HelixDerivedEquation | null {
  const counts = readCountsFromVisualExtraction(input.extraction);
  if (counts.length === 0) return null;
  const expression = counts.join(" + ");
  return {
    schema: HELIX_DERIVED_EQUATION_SCHEMA,
    equation_id: `derived-equation:${hashShort([input.threadId, input.turnId, input.extraction.extraction_id, expression])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    derived_from_refs: [input.extraction.extraction_id, ...input.extraction.source_evidence_refs],
    expression,
    expression_language: "plain_math",
    purpose: "calculator_input",
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function buildDerivedEquationFromDocEquationExtraction(input: {
  threadId: string;
  turnId: string;
  extraction: HelixDocEquationExtraction;
  createdAt?: string;
}): HelixDerivedEquation | null {
  const expression = input.extraction.normalized_expression?.trim() || input.extraction.equation_text.trim();
  if (!expression) return null;
  return {
    schema: HELIX_DERIVED_EQUATION_SCHEMA,
    equation_id: `derived-equation:${hashShort([input.threadId, input.turnId, input.extraction.extraction_id, expression])}`,
    thread_id: input.threadId,
    turn_id: input.turnId,
    derived_from_refs: [input.extraction.extraction_id, ...input.extraction.evidence_refs],
    expression,
    expression_language: /\\[a-zA-Z]+|\^|_/.test(expression) ? "latex" : "plain_math",
    purpose: "calculator_input",
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.createdAt ?? new Date().toISOString(),
  };
}

export function evaluateSimpleSumExpression(expression: string): number | null {
  if (!/^\s*\d+(?:\s*\+\s*\d+)*\s*$/.test(expression)) return null;
  const values = expression.split("+").map((part: string) => Number(part.trim()));
  if (values.some((value: number) => !Number.isFinite(value))) return null;
  return values.reduce((sum: number, value: number) => sum + value, 0);
}
