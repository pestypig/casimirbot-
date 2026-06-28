import {
  normalizeHelixAskAnswerFormatEvidenceKinds,
  normalizeHelixAskAnswerFormatSectionKind,
  type HelixAskAnswerPlanSectionLike,
} from "../obligations";
import type { HelixAskObjectivePlannerPassSection } from "../objectives/objective-llm-contracts";

export const buildHelixAskTurnContractPlannerSections = (
  sections: HelixAskObjectivePlannerPassSection[],
): HelixAskAnswerPlanSectionLike[] =>
  sections.map((section) => ({
    id: section.id ?? section.title ?? "section",
    title: section.title ?? "Section",
    required: section.required !== false,
    must_answer: section.must_answer ?? [],
    required_slots: section.required_slots ?? [],
    preferred_evidence: normalizeHelixAskAnswerFormatEvidenceKinds(section.preferred_evidence ?? [], []),
    kind: normalizeHelixAskAnswerFormatSectionKind(String(section.kind ?? ""), "answer"),
    objective_label: null,
  }));
