import { rankPathsByPrecedence } from "./retrieval-contract";
import type { HelixAskAnswerObligation } from "./obligations";

export type HelixAskEvidencePackObligationCoverageStatus = "covered" | "partial" | "missing";

export type HelixAskEvidencePackObligationCoverage = {
  obligation_id: string;
  label: string;
  kind: string;
  status: HelixAskEvidencePackObligationCoverageStatus;
  matched_slots: string[];
  missing_slots: string[];
  evidence_refs: string[];
  doc_refs: string[];
  code_refs: string[];
};

const normalizeSlotId = (value: string): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const isCodeRef = (entry: string): boolean =>
  /\.(?:ts|tsx|js|mjs|cjs|py|go|rs|java|kt|cpp|cc|c|cs)(?::\d+)?$/i.test(entry) ||
  /(?:^|\/)(?:server|client|modules|shared|scripts|tools)\//i.test(entry);

export const selectHelixAskObligationEvidenceRefs = (args: {
  obligation: HelixAskAnswerObligation;
  allowedCitations: string[];
  precedencePaths?: string[];
  prioritizeCitations?: (citations: string[], limit?: number) => string[];
}): { evidenceRefs: string[]; docRefs: string[]; codeRefs: string[] } => {
  const citations = rankPathsByPrecedence(
    (args.prioritizeCitations?.(args.allowedCitations, 12) ?? unique(args.allowedCitations)).slice(0, 12),
    args.precedencePaths ?? [],
    12,
  );
  const codeRefs = citations.filter((entry) => isCodeRef(entry));
  const docRefs = citations.filter((entry) => !codeRefs.includes(entry));
  const preferred = args.obligation.preferred_evidence;
  const evidenceRefs = [
    ...(preferred.includes("code") ? codeRefs : []),
    ...(preferred.includes("doc") ? docRefs : []),
    ...(preferred.includes("runtime") || preferred.includes("test") ? citations : []),
    ...citations,
  ];
  return {
    evidenceRefs: unique(evidenceRefs).slice(0, 6),
    docRefs: docRefs.slice(0, 4),
    codeRefs: codeRefs.slice(0, 4),
  };
};

export const buildHelixAskTurnContractObligationCoverage = (args: {
  obligations: HelixAskAnswerObligation[];
  coveredSlots: string[];
  allowedCitations: string[];
  precedencePaths?: string[];
  prioritizeCitations?: (citations: string[], limit?: number) => string[];
}): HelixAskEvidencePackObligationCoverage[] => {
  const covered = new Set(args.coveredSlots.map((slot) => normalizeSlotId(slot)).filter(Boolean));
  return args.obligations.map((obligation) => {
    const requiredSlots = obligation.required_slots.map((slot) => normalizeSlotId(slot)).filter(Boolean);
    const matchedSlots = requiredSlots.filter((slot) => covered.has(slot));
    const missingSlots = requiredSlots.filter((slot) => !covered.has(slot));
    const evidenceRefs = selectHelixAskObligationEvidenceRefs({
      obligation,
      allowedCitations: args.allowedCitations,
      precedencePaths: args.precedencePaths,
      prioritizeCitations: args.prioritizeCitations,
    });
    const status: HelixAskEvidencePackObligationCoverageStatus =
      missingSlots.length === 0 && (matchedSlots.length > 0 || requiredSlots.length === 0)
        ? "covered"
        : matchedSlots.length > 0 || evidenceRefs.evidenceRefs.length > 0
          ? "partial"
          : "missing";
    return {
      obligation_id: obligation.id,
      label: obligation.label,
      kind: obligation.kind,
      status,
      matched_slots: matchedSlots,
      missing_slots: missingSlots,
      evidence_refs: evidenceRefs.evidenceRefs,
      doc_refs: evidenceRefs.docRefs,
      code_refs: evidenceRefs.codeRefs,
    };
  });
};
