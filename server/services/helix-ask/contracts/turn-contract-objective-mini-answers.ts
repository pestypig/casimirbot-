import { normalizeSlotId } from "../obligations";
import type { HelixAskEvidencePackObligationCoverage } from "../obligation-coverage";
import type { HelixAskTurnContractObjectiveSupport } from "./turn-contract-objective-support";
import {
  inferHelixAskObjectiveSlotHitsFromEvidence,
  normalizeHelixAskObjectiveLabelKey,
} from "./turn-contract-objective-evidence";
import {
  buildHelixAskObjectiveUnknownBlock,
  type HelixAskObjectiveUnknownBlock,
} from "./turn-contract-objective-unknown";

export type HelixAskObjectiveLoopStateForMiniAnswer = {
  objective_id: string;
  objective_label: string;
  required_slots: string[];
  matched_slots: string[];
  status: string;
  retrieval_confidence?: number;
};

export type HelixAskObjectiveMiniAnswerStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveMiniAnswer = {
  objective_id: string;
  objective_label: string;
  status: HelixAskObjectiveMiniAnswerStatus;
  matched_slots: string[];
  missing_slots: string[];
  evidence_refs: string[];
  linked_evidence_refs?: string[];
  summary: string;
  unknown_block?: HelixAskObjectiveUnknownBlock;
};

const clampHelixAskObjectiveUnitInterval = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const buildHelixAskObjectiveMiniAnswers = (args: {
  states: HelixAskObjectiveLoopStateForMiniAnswer[];
  support: HelixAskTurnContractObjectiveSupport[];
  obligationCoverage: HelixAskEvidencePackObligationCoverage[];
  objectiveRetrievalSelectedFiles?: Array<{
    objective_id: string;
    pass_index: number;
    files: string[];
  }>;
  fallbackEvidenceRefs?: string[];
  enableHeuristicInference?: boolean;
}): HelixAskObjectiveMiniAnswer[] => {
  if (args.states.length === 0) return [];
  const supportByLabel = new Map(
    args.support.map((entry) => [normalizeHelixAskObjectiveLabelKey(entry.objective), entry] as const),
  );
  const objectiveFilesById = new Map<string, string[]>();
  for (const entry of args.objectiveRetrievalSelectedFiles ?? []) {
    const objectiveId = String(entry.objective_id ?? "").trim();
    if (!objectiveId) continue;
    const prior = objectiveFilesById.get(objectiveId) ?? [];
    const merged = Array.from(
      new Set(
        [...prior, ...(Array.isArray(entry.files) ? entry.files : [])]
          .map((filePath) => String(filePath ?? "").trim())
          .filter(Boolean),
      ),
    ).slice(0, 24);
    objectiveFilesById.set(objectiveId, merged);
  }
  const fallbackEvidence = (args.fallbackEvidenceRefs ?? []).slice(0, 8);
  const answers: HelixAskObjectiveMiniAnswer[] = [];
  const enableHeuristicInference = args.enableHeuristicInference !== false;
  for (const state of args.states) {
    const objectiveKey = normalizeHelixAskObjectiveLabelKey(state.objective_label);
    const support = supportByLabel.get(objectiveKey);
    const objectiveTokens = new Set(
      objectiveKey
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
    );
    const matchingCoverage = args.obligationCoverage.filter((coverage) => {
      const coverageKey = normalizeHelixAskObjectiveLabelKey(coverage.label);
      if (!coverageKey) return false;
      if (coverageKey === objectiveKey || coverageKey.includes(objectiveKey) || objectiveKey.includes(coverageKey)) {
        return true;
      }
      const coverageTokens = coverageKey.split(/\s+/).filter((token) => token.length >= 3);
      const overlap = coverageTokens.filter((token) => objectiveTokens.has(token)).length;
      return overlap >= 2;
    });
    const objectiveEvidenceRefs = objectiveFilesById.get(state.objective_id) ?? [];
    const rawEvidenceRefs = Array.from(
      new Set(
        [
          ...objectiveEvidenceRefs,
          ...(support?.matched_slots ?? []),
          ...matchingCoverage.flatMap((entry) => entry.evidence_refs),
          ...matchingCoverage.flatMap((entry) => entry.code_refs),
          ...matchingCoverage.flatMap((entry) => entry.doc_refs),
        ]
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    );
    const linkedEvidenceRefs = rawEvidenceRefs.slice(0, 8);
    const evidenceRefs = linkedEvidenceRefs;
    const inferenceEvidenceRefs = rawEvidenceRefs.slice(0, 16);
    const retrievalConfidence = clampHelixAskObjectiveUnitInterval(
      Number(state.retrieval_confidence ?? 0),
    );
    const inferredSlots = enableHeuristicInference
      ? inferHelixAskObjectiveSlotHitsFromEvidence(
          state.required_slots,
          state.objective_label,
          inferenceEvidenceRefs.length > 0 ? inferenceEvidenceRefs : evidenceRefs,
        )
      : [];
    const retrievalReasoningSlot = state.required_slots.find(
      (slot) => normalizeSlotId(slot) === "retrieval-reasoning",
    );
    if (
      retrievalReasoningSlot &&
      !inferredSlots.includes(retrievalReasoningSlot) &&
      retrievalConfidence > 0 &&
      (inferenceEvidenceRefs.length > 0 || evidenceRefs.length > 0)
    ) {
      inferredSlots.push(retrievalReasoningSlot);
    }
    const matchedSlots = Array.from(
      new Set([
        ...state.matched_slots,
        ...(support?.matched_slots ?? []),
        ...inferredSlots,
      ]),
    ).filter(Boolean);
    const missingSlots =
      state.required_slots.length > 0
        ? state.required_slots.filter((slot) => !matchedSlots.includes(slot))
        : [];
    let effectiveMissingSlots = missingSlots;
    let status: HelixAskObjectiveMiniAnswerStatus =
      state.status === "blocked"
        ? "blocked"
        : missingSlots.length === 0
          ? "covered"
          : "partial";
    if (status === "covered" && retrievalConfidence <= 0 && linkedEvidenceRefs.length === 0) {
      status = "partial";
      effectiveMissingSlots = effectiveMissingSlots.length > 0 ? effectiveMissingSlots : ["evidence"];
    }
    const evidencePreview = (evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidence).slice(0, 4);
    const summary = [
      `${state.objective_label}: ${status === "covered" ? "covered" : status === "partial" ? "partially covered" : "blocked"}.`,
      evidencePreview.length > 0
        ? `Evidence: ${evidencePreview.join(", ")}.`
        : "Evidence: none captured.",
      effectiveMissingSlots.length > 0
        ? `Missing slots: ${effectiveMissingSlots.join(", ")}.`
        : "Missing slots: none.",
    ].join(" ");
    const unknownBlock =
      status === "covered"
        ? undefined
        : buildHelixAskObjectiveUnknownBlock({
            objectiveLabel: state.objective_label,
            missingSlots: effectiveMissingSlots,
            evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidence,
          });
    answers.push({
      objective_id: state.objective_id,
      objective_label: state.objective_label,
      status,
      matched_slots: matchedSlots,
      missing_slots: effectiveMissingSlots,
      evidence_refs: evidenceRefs.length > 0 ? evidenceRefs : fallbackEvidence,
      linked_evidence_refs: linkedEvidenceRefs,
      summary,
      unknown_block: unknownBlock,
    });
  }
  return answers;
};
