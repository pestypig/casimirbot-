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

export type HelixAskObjectiveMiniValidation = {
  total: number;
  covered: number;
  partial: number;
  blocked: number;
  unresolved: number;
};

export type HelixAskObjectiveMiniSynthStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveMiniSynthObjective = {
  objective_id: string;
  status: HelixAskObjectiveMiniSynthStatus;
  matched_slots: string[];
  missing_slots: string[];
  summary?: string;
  evidence_refs: string[];
  unknown_block?: HelixAskObjectiveUnknownBlock;
};

export type HelixAskObjectiveMiniSynth = {
  objectives: HelixAskObjectiveMiniSynthObjective[];
};

export type HelixAskObjectiveMiniSynthLoopState = {
  objective_id: string;
  required_slots: string[];
};

export type HelixAskObjectiveMiniCritiqueStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveMiniCritiqueObjective = {
  objective_id: string;
  status: HelixAskObjectiveMiniCritiqueStatus;
  missing_slots: string[];
  reason?: string;
};

export type HelixAskObjectiveMiniCritique = {
  objectives: HelixAskObjectiveMiniCritiqueObjective[];
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

export const summarizeHelixAskObjectiveMiniValidation = (
  miniAnswers: HelixAskObjectiveMiniAnswer[],
): HelixAskObjectiveMiniValidation => {
  const total = miniAnswers.length;
  const covered = miniAnswers.filter((entry) => entry.status === "covered").length;
  const partial = miniAnswers.filter((entry) => entry.status === "partial").length;
  const blocked = miniAnswers.filter((entry) => entry.status === "blocked").length;
  const unresolved = Math.max(0, total - covered);
  return {
    total,
    covered,
    partial,
    blocked,
    unresolved,
  };
};

export const buildHelixAskObjectiveMiniSynthPrompt = (args: {
  question: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const objectiveBlocks = args.miniAnswers
    .map((entry, index) => {
      const matched = entry.matched_slots.join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      const evidence = entry.evidence_refs.slice(0, 6).join(", ") || "none";
      return [
        `${index + 1}. objective_id=${entry.objective_id}`,
        `label=${entry.objective_label}`,
        `baseline_status=${entry.status}`,
        `matched_slots=${matched}`,
        `missing_slots=${missing}`,
        `evidence_refs=${evidence}`,
        `summary=${entry.summary}`,
      ].join("\n");
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective mini-synthesizer.",
    "Return strict JSON only. No markdown. No commentary.",
    "Schema:",
    '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","matched_slots":["slot-id"],"missing_slots":["slot-id"],"summary":"string","evidence_refs":["path"],"unknown_block":{"unknown":"string","why":"string","what_i_checked":["string"],"next_retrieval":"string"}}] }',
    "Rules:",
    "- Include each objective_id exactly once.",
    "- Use only objective-local evidence refs already provided unless absolutely needed.",
    "- If status=covered, missing_slots must be empty.",
    "- If status=partial|blocked, include meaningful missing_slots.",
    "- Keep summary concise.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveBlocks,
  ].join("\n");
};

export const buildHelixAskObjectiveMiniCritiquePrompt = (args: {
  question: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const objectiveBlocks = args.miniAnswers
    .map((entry, index) => {
      const matched = entry.matched_slots.join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      const evidence = entry.evidence_refs.slice(0, 6).join(", ") || "none";
      return [
        `${index + 1}. objective_id=${entry.objective_id}`,
        `label=${entry.objective_label}`,
        `current_status=${entry.status}`,
        `matched_slots=${matched}`,
        `missing_slots=${missing}`,
        `evidence_refs=${evidence}`,
        `summary=${entry.summary}`,
      ].join("\n");
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective mini-critic.",
    "Return strict JSON only. No markdown. No commentary.",
    "Schema:",
    '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","missing_slots":["slot-id"],"reason":"string"}] }',
    "Rules:",
    "- Include each objective_id exactly once.",
    "- Status must be one of covered|partial|blocked.",
    "- missing_slots must use only slot ids from that objective context when possible.",
    "- If status=covered, missing_slots must be empty.",
    "- Keep reason brief.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveBlocks,
  ].join("\n");
};

export const buildHelixAskObjectiveAssemblyPrompt = (args: {
  question: string;
  currentAnswer: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const hasUnresolvedObjectives = args.miniAnswers.some((entry) => entry.status !== "covered");
  const objectiveLines = args.miniAnswers
    .map((entry, index) => {
      const evidence = entry.evidence_refs.slice(0, 4).join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      return `${index + 1}. ${entry.objective_label}\nstatus=${entry.status}\nmissing=${missing}\nevidence=${evidence}\nsummary=${entry.summary}`;
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective assembler.",
    "Return a concise final answer only, no JSON and no debug metadata.",
    "Preserve existing citations and uncertainty statements.",
    ...(hasUnresolvedObjectives
      ? [
          "If any objective remains partial or blocked, fail closed: emit an assembly-blocked reason plus objective-local UNKNOWN blocks only.",
          "For every objective with status=partial or status=blocked, emit an explicit UNKNOWN block with: UNKNOWN, Why, What I checked, Next retrieval.",
          'Forbidden in UNKNOWN output: "start with one concrete claim", "core meaning of the concept in its domain context", and "Sources: open-world best-effort".',
        ]
      : [
          "All objectives are covered.",
          "Do not emit fail-closed or UNKNOWN scaffolds.",
          'Forbidden tokens/headers: "UNKNOWN", "Assembly blocked:", "Open gaps / UNKNOWNs:", "Why:", "What I checked:", "Next retrieval:".',
          "If the current draft contains blocked/unknown scaffolds, rewrite it into a direct covered answer using objective summaries and evidence.",
        ]),
    "Never present unresolved objectives as complete.",
    "Use objective checkpoints internally; do not expose planner/checkpoint labels or status fields in the final answer.",
    "Use the same language as the current answer unless responseLanguage explicitly requests a different language.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveLines,
    "",
    "Current answer draft:",
    args.currentAnswer,
  ].join("\n");
};

export const applyHelixAskObjectiveMiniSynth = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  synth: HelixAskObjectiveMiniSynth;
  objectiveStates: HelixAskObjectiveMiniSynthLoopState[];
}): HelixAskObjectiveMiniAnswer[] => {
  const synthById = new Map(
    args.synth.objectives.map((entry) => [entry.objective_id, entry] as const),
  );
  const stateById = new Map(
    args.objectiveStates.map((entry) => [entry.objective_id, entry] as const),
  );
  return args.miniAnswers.map((entry) => {
    const synth = synthById.get(entry.objective_id);
    if (!synth) return entry;
    const state = stateById.get(entry.objective_id);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const matchedSlots = Array.from(
      new Set(synth.matched_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const missingSlotsFromSynth = Array.from(
      new Set(synth.missing_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const missingSlots =
      synth.status === "covered"
        ? []
        : missingSlotsFromSynth.length > 0
          ? missingSlotsFromSynth
          : requiredSlots.filter((slot) => !matchedSlots.includes(slot));
    const evidenceRefs = Array.from(
      new Set([...(synth.evidence_refs ?? []), ...entry.evidence_refs].filter(Boolean)),
    ).slice(0, 8);
    const unknownBlock =
      synth.status === "covered"
        ? undefined
        : sanitizeHelixAskObjectiveUnknownBlock({
            objectiveLabel: entry.objective_label,
            missingSlots,
            evidenceRefs,
            block: synth.unknown_block ?? entry.unknown_block,
          });
    return {
      ...entry,
      status: synth.status,
      matched_slots: synth.status === "covered"
        ? Array.from(new Set([...requiredSlots, ...matchedSlots]))
        : matchedSlots,
      missing_slots: missingSlots,
      evidence_refs: evidenceRefs,
      summary:
        synth.summary && synth.summary.trim().length > 0
          ? synth.summary
          : entry.summary,
      unknown_block: unknownBlock,
    };
  });
};

export const applyHelixAskObjectiveMiniCritique = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  critique: HelixAskObjectiveMiniCritique;
  objectiveStates: HelixAskObjectiveMiniSynthLoopState[];
}): HelixAskObjectiveMiniAnswer[] => {
  const critiqueById = new Map(
    args.critique.objectives.map((entry) => [entry.objective_id, entry] as const),
  );
  const stateById = new Map(
    args.objectiveStates.map((entry) => [entry.objective_id, entry] as const),
  );
  return args.miniAnswers.map((entry) => {
    const critique = critiqueById.get(entry.objective_id);
    if (!critique) return entry;
    const state = stateById.get(entry.objective_id);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const filteredMissing = Array.from(
      new Set(critique.missing_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const status = critique.status;
    const missingSlots =
      status === "covered"
        ? []
        : filteredMissing.length > 0
          ? filteredMissing
          : status === "partial"
            ? entry.missing_slots
            : filteredMissing;
    const matchedSlots = requiredSlots.filter((slot) => !missingSlots.includes(slot));
    const reasonSentence = critique.reason ? ` LLM critic: ${critique.reason}.` : "";
    const unknownBlock =
      status === "covered"
        ? undefined
        : buildHelixAskObjectiveUnknownBlock({
            objectiveLabel: entry.objective_label,
            missingSlots,
            evidenceRefs: entry.evidence_refs,
          });
    return {
      ...entry,
      status,
      matched_slots: matchedSlots,
      missing_slots: missingSlots,
      summary: `${entry.summary}${reasonSentence}`.trim(),
      unknown_block: unknownBlock,
    };
  });
};
