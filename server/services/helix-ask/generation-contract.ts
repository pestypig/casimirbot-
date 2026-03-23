import {
  computePromptResearchGenerationBudget,
  type GenerationBudget,
  type SectionOverflowPolicy,
} from "./budget";
import type { PromptResearchContract } from "./prompt-research-contract";

export type PromptResearchGenerationContract = {
  mode: "default" | "research_contract";
  budget: GenerationBudget | null;
  required_section_titles: string[];
  support_section_titles: string[];
  section_overflow_policy: SectionOverflowPolicy;
  sectional_compose_required: boolean;
};

export type PromptResearchSectionalComposePlanSection = {
  title: string;
  obligation_ids?: string[];
  evidence_refs?: string[];
  must_answer?: string[];
};

export type PromptResearchSectionalComposeObligationEvidence = {
  obligation_id: string;
  status: "covered" | "partial" | "missing";
  supporting_repo_paths: string[];
  supporting_snippets: string[];
};

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

const normalizeSectionKey = (value: string): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const headingPresent = (text: string, title: string): boolean => {
  const normalizedTitle = String(title ?? "").trim();
  if (!normalizedTitle) return false;
  const escaped = normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n)\\s*(?:#{1,6}\\s*)?${escaped}\\s*:`, "im").test(text);
};

const renderUnknownLines = (items: string[], unknownMarker: string, fallbackLabel: string): string => {
  const normalizedItems = unique(items);
  if (normalizedItems.length === 0) {
    return `- ${fallbackLabel}: ${unknownMarker}.`;
  }
  return normalizedItems
    .slice(0, 6)
    .map((item) => `- ${item}: ${unknownMarker}.`)
    .join("\n");
};

const buildPromptResearchSectionBodyFromEvidence = (args: {
  title: string;
  planSections?: PromptResearchSectionalComposePlanSection[];
  obligationEvidence?: PromptResearchSectionalComposeObligationEvidence[];
}): string => {
  const titleKey = normalizeSectionKey(args.title);
  if (!titleKey) return "";
  const matchedPlanSections = (args.planSections ?? []).filter(
    (section) => normalizeSectionKey(section.title) === titleKey,
  );
  const obligationIds = unique(
    matchedPlanSections.flatMap((section) => section.obligation_ids ?? []),
  );
  const evidence = (args.obligationEvidence ?? []).filter((entry) =>
    obligationIds.includes(entry.obligation_id),
  );
  const snippets = unique(
    evidence.flatMap((entry) => entry.supporting_snippets ?? []).filter(Boolean),
  ).slice(0, 3);
  const sources = unique(
    evidence.flatMap((entry) => entry.supporting_repo_paths ?? []).filter(Boolean),
  ).slice(0, 4);
  const blocks: string[] = [];
  if (snippets.length > 0) {
    blocks.push(...snippets);
  }
  if (sources.length > 0) {
    blocks.push(`Sources: ${sources.join(", ")}`);
  }
  return blocks.join("\n\n").trim();
};

export const buildPromptResearchSectionalComposeRepair = (args: {
  contract: PromptResearchContract | null | undefined;
  text: string;
  generationContract?: PromptResearchGenerationContract | null;
  planSections?: PromptResearchSectionalComposePlanSection[];
  obligationEvidence?: PromptResearchSectionalComposeObligationEvidence[];
}): { text: string; appended_titles: string[]; used: boolean } => {
  const contract = args.contract;
  const originalText = String(args.text ?? "").trim();
  if (!contract || contract.mode !== "research_contract" || !originalText) {
    return {
      text: originalText,
      appended_titles: [],
      used: false,
    };
  }
  const unknownMarker = contract.fail_closed_behavior.unknown_marker?.trim() || "UNKNOWN";
  const requiredTitles = unique(
    args.generationContract?.required_section_titles ??
      contract.required_top_level_structure.map((section) => section.title),
  );
  const supportTitles = unique(
    args.generationContract?.support_section_titles ?? [
      contract.appendix_requirements.length > 0 ? "Derivation Appendix" : null,
      contract.claim_discipline.length > 0 ? "Claim Discipline" : null,
      contract.self_check.length > 0 ? "Self-Check" : null,
      contract.provenance_table_schema.length > 0 ? "Provenance Table" : null,
    ].filter(Boolean) as string[],
  );
  const shouldCompose =
    Boolean(args.generationContract?.sectional_compose_required) ||
    requiredTitles.some((title) => !headingPresent(originalText, title)) ||
    supportTitles.some((title) => title !== "Provenance Table" && !headingPresent(originalText, title));
  if (!shouldCompose) {
    return {
      text: originalText,
      appended_titles: [],
      used: false,
    };
  }

  let nextText = originalText;
  const appendedTitles: string[] = [];
  const appendSection = (title: string, body: string): void => {
    const normalizedTitle = String(title ?? "").trim();
    const normalizedBody = String(body ?? "").trim();
    if (!normalizedTitle || !normalizedBody || headingPresent(nextText, normalizedTitle)) return;
    nextText = `${nextText}\n\n${normalizedTitle}:\n${normalizedBody}`.trim();
    appendedTitles.push(normalizedTitle);
  };

  for (const title of requiredTitles) {
    if (headingPresent(nextText, title)) continue;
    const evidenceBody = buildPromptResearchSectionBodyFromEvidence({
      title,
      planSections: args.planSections,
      obligationEvidence: args.obligationEvidence,
    });
    const sectionContract = contract.required_top_level_structure.find(
      (section) => normalizeSectionKey(section.title) === normalizeSectionKey(title),
    );
    const fallbackBody = renderUnknownLines(
      sectionContract?.must_cover ?? [],
      unknownMarker,
      title,
    );
    appendSection(title, evidenceBody || fallbackBody);
  }

  for (const title of supportTitles) {
    if (title === "Provenance Table" || headingPresent(nextText, title)) continue;
    if (normalizeSectionKey(title) === normalizeSectionKey("Derivation Appendix")) {
      appendSection(
        title,
        renderUnknownLines(contract.appendix_requirements, unknownMarker, title),
      );
      continue;
    }
    if (normalizeSectionKey(title) === normalizeSectionKey("Claim Discipline")) {
      appendSection(
        title,
        renderUnknownLines(contract.claim_discipline, unknownMarker, title),
      );
      continue;
    }
    if (normalizeSectionKey(title) === normalizeSectionKey("Self-Check")) {
      const checklist = unique(contract.self_check).slice(0, 8);
      appendSection(
        title,
        checklist.length > 0 ? checklist.map((entry) => `- ${entry}`).join("\n") : `- ${unknownMarker}.`,
      );
      continue;
    }
    appendSection(title, `- ${title}: ${unknownMarker}.`);
  }

  return {
    text: nextText,
    appended_titles: appendedTitles,
    used: appendedTitles.length > 0,
  };
};

export const buildPromptResearchGenerationContract = (args: {
  contract: PromptResearchContract | null | undefined;
  answerCap: number;
}): PromptResearchGenerationContract | null => {
  const contract = args.contract;
  if (!contract || contract.mode !== "research_contract") return null;
  const budget = computePromptResearchGenerationBudget({
    contract,
    answerCap: args.answerCap,
  });
  const supportSectionTitles = [
    contract.appendix_requirements.length > 0 ? "Derivation Appendix" : null,
    contract.provenance_table_schema.length > 0 ? "Provenance Table" : null,
    contract.claim_discipline.length > 0 ? "Claim Discipline" : null,
    contract.self_check.length > 0 ? "Self-Check" : null,
  ].filter(Boolean) as string[];
  return {
    mode: "research_contract",
    budget,
    required_section_titles: unique(
      contract.required_top_level_structure.map((section) => section.title),
    ),
    support_section_titles: unique(supportSectionTitles),
    section_overflow_policy: budget?.section_overflow_policy ?? "single_pass",
    sectional_compose_required: budget?.section_overflow_policy === "sectional_compose",
  };
};
