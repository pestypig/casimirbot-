import { normalizeSlotId } from "../obligations";
import { normalizeHelixAskTurnContractText } from "./turn-contract-text";

export type HelixAskObjectiveUnknownBlock = {
  unknown: string;
  why: string;
  what_i_checked: string[];
  next_retrieval: string;
};

export const buildHelixAskObjectiveUnknownBlock = (args: {
  objectiveLabel: string;
  missingSlots: string[];
  evidenceRefs: string[];
  scopedRetrievalMissing?: boolean;
}): HelixAskObjectiveUnknownBlock => {
  const missingSlots = Array.from(
    new Set((args.missingSlots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
  ).slice(0, 8);
  const missingLine = missingSlots.length > 0 ? missingSlots.join(", ") : "evidence";
  const checked = Array.from(
    new Set((args.evidenceRefs ?? []).map((entry) => String(entry ?? "").trim()).filter(Boolean)),
  ).slice(0, 6);
  const whatChecked = checked.length > 0
    ? checked
    : [
        args.scopedRetrievalMissing
          ? `No objective-scoped retrieval pass was recorded for "${args.objectiveLabel}".`
          : `No objective-local evidence was captured for "${args.objectiveLabel}".`,
      ];
  return {
    unknown: normalizeHelixAskTurnContractText(
      `Required objective unresolved: ${args.objectiveLabel}.`,
      220,
    ),
    why: normalizeHelixAskTurnContractText(
      args.scopedRetrievalMissing
        ? `required objective unresolved because no objective-scoped retrieval pass was recorded and slots remain missing: ${missingLine}`
        : `required objective unresolved; missing ${missingLine}`,
      220,
    ),
    what_i_checked: whatChecked,
    next_retrieval: normalizeHelixAskTurnContractText(
      `Run objective-scoped retrieval for "${args.objectiveLabel}" and collect evidence for slots: ${missingLine}.`,
      220,
    ),
  };
};

const HELIX_ASK_GENERIC_UNKNOWN_SCAFFOLD_RE_LIST = [
  /^For\s+["'`].+?["'`],?\s*start with one concrete claim/i,
  /\bcore meaning of the concept in its domain context\b/i,
  /\bSources:\s*open-world best-effort\b/i,
] as const;

export const isHelixAskGenericUnknownScaffold = (value: string): boolean => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return false;
  return HELIX_ASK_GENERIC_UNKNOWN_SCAFFOLD_RE_LIST.some((pattern) => pattern.test(normalized));
};

export const sanitizeHelixAskObjectiveUnknownBlock = (args: {
  objectiveLabel: string;
  missingSlots: string[];
  evidenceRefs: string[];
  block?: HelixAskObjectiveUnknownBlock;
  scopedRetrievalMissing?: boolean;
}): HelixAskObjectiveUnknownBlock => {
  const fallback = buildHelixAskObjectiveUnknownBlock({
    objectiveLabel: args.objectiveLabel,
    missingSlots: args.missingSlots,
    evidenceRefs: args.evidenceRefs,
    scopedRetrievalMissing: args.scopedRetrievalMissing,
  });
  const block = args.block;
  if (!block) return fallback;
  const candidate: HelixAskObjectiveUnknownBlock = {
    unknown:
      normalizeHelixAskTurnContractText(String(block.unknown ?? "").trim(), 220) ||
      fallback.unknown,
    why:
      normalizeHelixAskTurnContractText(String(block.why ?? "").trim(), 220) ||
      fallback.why,
    what_i_checked: Array.from(
      new Set(
        (Array.isArray(block.what_i_checked) ? block.what_i_checked : [])
          .map((entry) => String(entry ?? "").trim())
          .filter((entry) => entry.length > 0 && !isHelixAskGenericUnknownScaffold(entry)),
      ),
    ).slice(0, 6),
    next_retrieval:
      normalizeHelixAskTurnContractText(String(block.next_retrieval ?? "").trim(), 220) ||
      fallback.next_retrieval,
  };
  if (candidate.what_i_checked.length === 0) {
    candidate.what_i_checked = fallback.what_i_checked;
  }
  const combined = [
    candidate.unknown,
    candidate.why,
    candidate.what_i_checked.join(" "),
    candidate.next_retrieval,
  ].join("\n");
  return isHelixAskGenericUnknownScaffold(combined) ? fallback : candidate;
};
