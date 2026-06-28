import {
  normalizeHelixAskAnswerFormatEvidenceKinds,
  normalizeHelixAskAnswerFormatSectionKind,
  type HelixAskAnswerPlanSectionLike,
  type HelixAskAnswerPlanFamily,
} from "../obligations";
import type { HelixAskObjectivePlannerPassSection } from "../objectives/objective-llm-contracts";
import type { PromptResearchContract } from "../prompt-research-contract";
import { buildHelixAskPromptResearchPlannerSections } from "./turn-contract-objective-planning";

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

export const selectHelixAskTurnContractPlannerSectionSource = (args: {
  plannerSections?: HelixAskObjectivePlannerPassSection[] | null;
  researchContract?: PromptResearchContract | null;
  family: HelixAskAnswerPlanFamily;
}): HelixAskObjectivePlannerPassSection[] => {
  if (args.plannerSections?.length) {
    return args.researchContract
      ? buildHelixAskPromptResearchPlannerSections({
          contract: args.researchContract,
          family: args.family,
        })
      : args.plannerSections;
  }
  return args.researchContract
    ? buildHelixAskPromptResearchPlannerSections({
        contract: args.researchContract,
        family: args.family,
      })
    : [];
};
