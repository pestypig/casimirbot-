import {
  inferHelixAskAnswerPlanSectionEvidenceKinds,
  inferHelixAskAnswerPlanSectionKindFromShape,
  normalizeHelixAskAnswerFormatEvidenceKinds,
  normalizeHelixAskAnswerFormatSectionKind,
  normalizeHelixAskAnswerObligationLabel,
  normalizeHelixAskTurnContractText,
  normalizeSlotId,
  type HelixAskAnswerFormatEvidenceKind,
  type HelixAskAnswerFormatSectionKind,
  type HelixAskAnswerObligation,
  type HelixAskAnswerPlanFamily,
  type HelixAskAnswerPlanSectionLike,
  type HelixAskTurnContractObjective,
} from "./obligations";
import type { HelixAskEvidencePackObligationCoverage } from "./obligation-coverage";

export type HelixAskAnswerPlanSection = {
  id: string;
  title: string;
  required: boolean;
  must_answer?: string[];
  required_slots?: string[];
  preferred_evidence?: HelixAskAnswerFormatEvidenceKind[];
  kind?: HelixAskAnswerFormatSectionKind;
  objective_label?: string | null;
  obligation_ids?: string[];
  coverage_status?: "covered" | "partial" | "missing";
  evidence_refs?: string[];
  matched_slots?: string[];
  missing_slots?: string[];
};

const normalizeCitations = (citations: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const citation of citations) {
    const normalized = String(citation ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const slugifyHelixAskAnswerPlanSectionId = (value: string, fallback: string): string => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[`"']/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
};

const normalizeHelixAskAnswerPlanInlineText = (value: string, maxChars: number): string =>
  String(value ?? "")
    .replace(/\b(?:docs|server|client|modules|shared|scripts|tests|apps|packages|cli)\/[A-Za-z0-9_./-]+\b/gi, " ")
    .replace(/^\s*sources?\s*:\s*/gim, " ")
    .replace(/[`#*]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, Math.max(0, maxChars))
    .trim();

export const createHelixAskAnswerPlanSection = (args: {
  id: string;
  title: string;
  required: boolean;
  family: HelixAskAnswerPlanFamily;
  requiredSlots?: string[];
  mustAnswer?: string[];
  preferredEvidence?: HelixAskAnswerFormatEvidenceKind[];
  kind?: HelixAskAnswerFormatSectionKind;
  objectiveLabel?: string | null;
  obligationIds?: string[];
  coverageStatus?: "covered" | "partial" | "missing";
  evidenceRefs?: string[];
  matchedSlots?: string[];
  missingSlots?: string[];
}): HelixAskAnswerPlanSection => {
  const requiredSlots = (args.requiredSlots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean);
  const normalizedMustAnswer = (args.mustAnswer ?? [args.title])
    .map((entry) => normalizeHelixAskAnswerPlanInlineText(entry, 160))
    .filter(Boolean)
    .slice(0, 4);
  const inferredKind =
    args.kind ??
    inferHelixAskAnswerPlanSectionKindFromShape({
      family: args.family,
      id: args.id,
      title: args.title,
      requiredSlots,
    });
  const preferredEvidence =
    args.preferredEvidence ??
    inferHelixAskAnswerPlanSectionEvidenceKinds({ kind: inferredKind, requiredSlots });
  return {
    id: slugifyHelixAskAnswerPlanSectionId(args.id, "section"),
    title: normalizeHelixAskAnswerPlanInlineText(args.title, 72) || args.title,
    required: args.required,
    must_answer: normalizedMustAnswer.length > 0 ? normalizedMustAnswer : [args.title],
    required_slots: requiredSlots.slice(0, 6),
    preferred_evidence: preferredEvidence.slice(0, 4),
    kind: inferredKind,
    objective_label: args.objectiveLabel ?? null,
    obligation_ids: Array.from(
      new Set((args.obligationIds ?? []).map((entry) => String(entry ?? "").trim()).filter(Boolean)),
    ).slice(0, 6),
    coverage_status: args.coverageStatus,
    evidence_refs: normalizeCitations(args.evidenceRefs ?? []).slice(0, 6),
    matched_slots: Array.from(
      new Set((args.matchedSlots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
    ).slice(0, 6),
    missing_slots: Array.from(
      new Set((args.missingSlots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean)),
    ).slice(0, 6),
  };
};

const buildHelixAskObjectiveSectionTitle = (args: {
  family: HelixAskAnswerPlanFamily;
  objective: HelixAskTurnContractObjective;
  index: number;
  question: string;
  kind: HelixAskAnswerFormatSectionKind;
}): string => {
  const label = normalizeHelixAskTurnContractText(args.objective.label, 84) || `Objective ${args.index + 1}`;
  const lower = `${label} ${args.question}`.toLowerCase();
  if (args.kind === "comparison") {
    if (/\btraditional(?:ly)?\b/.test(lower) && /\bneedle\s+hull(?:\s+(?:mark|mk)\s*2)?|mark\s*2|mk\s*2\b/.test(lower)) {
      return "Traditional Solve vs Needle Hull Mark 2";
    }
    return args.index === 0 ? "Key Comparison" : label;
  }
  if (args.kind === "repo") {
    if (/\bneedle\s+hull(?:\s+(?:mark|mk)\s*2)?|mark\s*2|mk\s*2\b/.test(lower)) {
      return "Needle Hull Mark 2 In Repo";
    }
    return args.index === 0 ? "Implementation In Repo" : label;
  }
  if (args.kind === "mechanism") {
    if (/\btraditional(?:ly)?\b/.test(lower)) {
      return "Traditional Solve";
    }
    if (/\bneedle\s+hull(?:\s+(?:mark|mk)\s*2)?|mark\s*2|mk\s*2\b/.test(lower)) {
      return "Needle Hull Mark 2 Improvement";
    }
    return args.index === 0 ? "How It Works" : label;
  }
  if (args.kind === "definition") return args.index === 0 ? "Direct Answer" : label;
  if (args.kind === "diagnosis") return args.index === 0 ? "Diagnosis" : label;
  if (args.kind === "roadmap") return args.index === 0 ? "Implementation Roadmap" : label;
  return label;
};

const buildHelixAskObligationSectionTitle = (args: {
  obligation: HelixAskAnswerObligation;
  index: number;
}): string => {
  const explicitSectionTitle = normalizeHelixAskAnswerObligationLabel(
    args.obligation.section_title ?? "",
    "",
  );
  if (explicitSectionTitle) return explicitSectionTitle;
  const label = normalizeHelixAskAnswerObligationLabel(
    args.obligation.label,
    `Section ${args.index + 1}`,
  );
  const preferLabel =
    label.length <= 72 &&
    !/^(?:what|how|why|where|which|who|when|whether)\b/i.test(label) &&
    !/^state what remains\b/i.test(label);
  switch (args.obligation.kind) {
    case "direct_answer":
      return "Direct Answer";
    case "definition":
      return preferLabel ? label : "Definition";
    case "mechanism":
    case "process":
      return preferLabel ? label : "How It Works";
    case "comparison":
      return preferLabel ? label : "Comparison";
    case "implementation":
      return preferLabel ? label : "Implementation In Repo";
    case "diagnosis":
      return preferLabel ? label : "Diagnosis";
    case "roadmap":
    case "change":
      return preferLabel ? label : "Implementation Roadmap";
    case "uncertainty":
      return args.obligation.section_title ?? "Open Gaps";
    default:
      return label;
  }
};

export const buildHelixAskAnswerPlanSections = (args: {
  question: string;
  family: HelixAskAnswerPlanFamily;
  objectives: HelixAskTurnContractObjective[];
  requiredSlots: string[];
  plannerSections?: HelixAskAnswerPlanSectionLike[];
  obligations?: HelixAskAnswerObligation[];
  obligationCoverage?: HelixAskEvidencePackObligationCoverage[];
  requiresRepoEvidence: boolean;
  fallbackSections: HelixAskAnswerPlanSectionLike[];
}): HelixAskAnswerPlanSection[] => {
  const fallbackSections = args.fallbackSections ?? [];
  const obligationCoverageById = new Map(
    (args.obligationCoverage ?? []).map((coverage) => [coverage.obligation_id, coverage] as const),
  );
  const normalizedObligations = (args.obligations ?? [])
    .map((obligation) => {
      const label = normalizeHelixAskAnswerObligationLabel(obligation.label, obligation.id);
      if (!label) return null;
      return { ...obligation, label };
    })
    .filter((obligation): obligation is HelixAskAnswerObligation => Boolean(obligation));
  if (normalizedObligations.length > 0) {
    const sections: HelixAskAnswerPlanSection[] = [];
    const seen = new Set<string>();
    const pushSection = (section: HelixAskAnswerPlanSection): void => {
      const key = `${section.id}:${section.title}`.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      sections.push(section);
    };
    for (const [index, obligation] of normalizedObligations.entries()) {
      if (obligation.kind === "uncertainty") continue;
      const coverage = obligationCoverageById.get(obligation.id);
      const kind: HelixAskAnswerFormatSectionKind =
        obligation.kind === "definition"
          ? "definition"
          : obligation.kind === "mechanism" || obligation.kind === "process"
            ? "mechanism"
            : obligation.kind === "comparison"
              ? "comparison"
              : obligation.kind === "implementation"
                ? "repo"
                : obligation.kind === "diagnosis"
                  ? "diagnosis"
                  : obligation.kind === "roadmap" || obligation.kind === "change"
                ? "roadmap"
                    : "answer";
      const normalizedDefinitionRepoTitle =
        args.family === "definition_overview" && args.requiresRepoEvidence && kind === "repo"
          ? "Repo anchors"
          : buildHelixAskObligationSectionTitle({ obligation, index });
      if (
        args.family === "definition_overview" &&
        args.requiresRepoEvidence &&
        (normalizedDefinitionRepoTitle.toLowerCase() === "why it matters" ||
          normalizedDefinitionRepoTitle.toLowerCase() === "key terms")
      ) {
        continue;
      }
      pushSection(
        createHelixAskAnswerPlanSection({
          id: obligation.id,
          title: normalizedDefinitionRepoTitle,
          required: obligation.required,
          family: args.family,
          requiredSlots: obligation.required_slots,
          mustAnswer: [obligation.label],
          preferredEvidence: obligation.preferred_evidence,
          kind,
          objectiveLabel: obligation.objective_label ?? obligation.label,
          obligationIds: [obligation.id],
          coverageStatus: coverage?.status,
          evidenceRefs: coverage?.evidence_refs ?? [],
          matchedSlots: coverage?.matched_slots ?? [],
          missingSlots: coverage?.missing_slots ?? [],
        }),
      );
    }
    if (
      args.family === "definition_overview" &&
      args.requiresRepoEvidence &&
      !sections.some((section) => section.title.toLowerCase() === "repo anchors")
    ) {
      const implementationCoverage = (args.obligationCoverage ?? []).find(
        (coverage) => coverage.kind === "implementation",
      );
      pushSection(
        createHelixAskAnswerPlanSection({
          id: "repo_anchors",
          title: "Repo anchors",
          required: true,
          family: args.family,
          requiredSlots: implementationCoverage?.matched_slots ?? ["code_path"],
          mustAnswer: ["Map the strongest repo anchors for this definition."],
          preferredEvidence: ["code", "doc"],
          kind: "repo",
          objectiveLabel: "Repo anchors",
          obligationIds: implementationCoverage ? [implementationCoverage.obligation_id] : [],
          coverageStatus: implementationCoverage?.status ?? "partial",
          evidenceRefs: implementationCoverage?.evidence_refs ?? [],
          matchedSlots: implementationCoverage?.matched_slots ?? [],
          missingSlots: implementationCoverage?.missing_slots ?? [],
        }),
      );
    }
    const gapCoverage = (args.obligationCoverage ?? []).filter((coverage) => coverage.status !== "covered");
    const gapObligation =
      normalizedObligations.find((obligation) => obligation.kind === "uncertainty") ?? null;
    if (gapObligation || gapCoverage.length > 0) {
      pushSection(
        createHelixAskAnswerPlanSection({
          id: gapObligation?.id ?? "open_gaps",
          title:
            gapObligation?.section_title ??
            (args.family === "roadmap_planning" ? "Evidence Gaps" : "Open Gaps"),
          required: gapObligation?.required ?? args.requiresRepoEvidence,
          family: args.family,
          requiredSlots: gapCoverage.flatMap((coverage) => coverage.missing_slots).slice(0, 6),
          mustAnswer: [
            gapObligation?.label ??
              "State what remains uncertain or under-evidenced in this turn.",
          ],
          preferredEvidence: ["doc", "code", "runtime"],
          kind: "gaps",
          objectiveLabel: gapObligation?.objective_label ?? null,
          obligationIds: gapCoverage.map((coverage) => coverage.obligation_id),
          coverageStatus:
            gapCoverage.some((coverage) => coverage.status === "missing")
              ? "missing"
              : gapCoverage.length > 0
                ? "partial"
                : "covered",
          evidenceRefs: gapCoverage.flatMap((coverage) => coverage.evidence_refs).slice(0, 6),
          matchedSlots: gapCoverage.flatMap((coverage) => coverage.matched_slots).slice(0, 6),
          missingSlots: gapCoverage.flatMap((coverage) => coverage.missing_slots).slice(0, 6),
        }),
      );
    }
    pushSection(
      createHelixAskAnswerPlanSection({
        id: "sources",
        title: "Sources",
        required: true,
        family: args.family,
        kind: "sources",
        mustAnswer: ["List the locked repo sources used for this answer."],
      }),
    );
    return sections.slice(0, 8);
  }
  const normalizedPlannerSections = (args.plannerSections ?? [])
    .map((section, index) => {
      const title = normalizeHelixAskTurnContractText(section.title ?? "", 72);
      if (!title) return null;
      const requiredSlots = (section.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean);
      return createHelixAskAnswerPlanSection({
        id: section.id ?? `${title}_${index + 1}`,
        title,
        required: section.required !== false,
        family: args.family,
        requiredSlots,
        mustAnswer: section.must_answer ?? [title],
        preferredEvidence: normalizeHelixAskAnswerFormatEvidenceKinds(
          section.preferred_evidence ?? [],
          inferHelixAskAnswerPlanSectionEvidenceKinds({
            kind: normalizeHelixAskAnswerFormatSectionKind(
              String(section.kind ?? ""),
              inferHelixAskAnswerPlanSectionKindFromShape({
                family: args.family,
                id: section.id ?? title,
                title,
                requiredSlots,
              }),
            ),
            requiredSlots,
          }),
        ),
        kind: normalizeHelixAskAnswerFormatSectionKind(
          String(section.kind ?? ""),
          inferHelixAskAnswerPlanSectionKindFromShape({
            family: args.family,
            id: section.id ?? title,
            title,
            requiredSlots,
          }),
        ),
        objectiveLabel: section.objective_label ?? null,
      });
    })
    .filter((section): section is HelixAskAnswerPlanSection => Boolean(section));
  if (normalizedPlannerSections.length > 0) {
    const planned = normalizedPlannerSections.slice(0, 8);
    if (!planned.some((section) => section.kind === "gaps")) {
      planned.splice(
        Math.max(1, planned.length),
        0,
        createHelixAskAnswerPlanSection({
          id: "open_gaps",
          title: args.family === "roadmap_planning" ? "Evidence Gaps" : "Open Gaps",
          required: args.requiresRepoEvidence,
          family: args.family,
          kind: "gaps",
          requiredSlots: ["failure_path"],
          mustAnswer: ["State what remains weak or only partially evidenced."],
        }),
      );
    }
    if (!planned.some((section) => section.kind === "sources")) {
      planned.push(
        createHelixAskAnswerPlanSection({
          id: "sources",
          title: "Sources",
          required: true,
          family: args.family,
          kind: "sources",
        }),
      );
    }
    return planned.slice(0, 8);
  }
  const shouldBuildObjectiveShape =
    (args.objectives.length > 1 &&
      args.question.trim().length >= 140 &&
      args.family !== "roadmap_planning" &&
      args.family !== "implementation_code_path" &&
      args.family !== "comparison_tradeoff") ||
    ((args.family === "mechanism_process" || args.family === "general_overview") &&
      /\b(?:traditional(?:ly)?|improvement|better|difference|compare|versus|vs\.?|needle\s+hull(?:\s+(?:mark|mk)\s*2)?|mark\s*2|mk\s*2)\b/i.test(
        args.question,
      ));
  if (!shouldBuildObjectiveShape) {
    return fallbackSections.map((section) =>
      createHelixAskAnswerPlanSection({
        id: section.id ?? section.title,
        title: section.title,
        required: section.required,
        family: args.family,
        requiredSlots: section.required_slots,
        mustAnswer: section.must_answer,
        preferredEvidence: section.preferred_evidence,
        kind: section.kind,
        objectiveLabel: section.objective_label ?? null,
      }),
    );
  }
  const sections: HelixAskAnswerPlanSection[] = [];
  const pushSection = (section: HelixAskAnswerPlanSection): void => {
    const titleKey = section.title.trim().toLowerCase();
    const idKey = section.id.trim().toLowerCase();
    if (sections.some((entry) => entry.id.trim().toLowerCase() === idKey || entry.title.trim().toLowerCase() === titleKey)) {
      return;
    }
    sections.push(section);
  };
  pushSection(
    createHelixAskAnswerPlanSection({
      id: args.family === "definition_overview" ? "definition" : "direct_answer",
      title: args.family === "definition_overview" ? "Definition" : "Direct Answer",
      required: true,
      family: args.family,
      kind: args.family === "definition_overview" ? "definition" : "answer",
      requiredSlots: args.requiredSlots.slice(0, 3),
      mustAnswer: [args.objectives[0]?.label ?? args.question],
    }),
  );
  for (const [index, objective] of args.objectives.entries()) {
    const requiredSlots = objective.required_slots.map((slot) => normalizeSlotId(slot)).filter(Boolean);
    const kind = inferHelixAskAnswerPlanSectionKindFromShape({
      family: args.family,
      id: objective.label,
      title: objective.label,
      requiredSlots,
    });
    const title = buildHelixAskObjectiveSectionTitle({
      family: args.family,
      objective,
      index,
      question: args.question,
      kind,
    });
    pushSection(
      createHelixAskAnswerPlanSection({
        id: title,
        title,
        required: true,
        family: args.family,
        kind,
        requiredSlots,
        mustAnswer: [objective.label],
        objectiveLabel: objective.label,
      }),
    );
  }
  if (
    args.requiresRepoEvidence &&
    !sections.some((section) => section.kind === "repo") &&
    args.requiredSlots.some((slot) => slot === "code_path" || slot === "repo_mapping" || slot === "implementation_touchpoints")
  ) {
    pushSection(
      createHelixAskAnswerPlanSection({
        id: "implementation_in_repo",
        title: "Implementation In Repo",
        required: true,
        family: args.family,
        kind: "repo",
        requiredSlots: ["code_path"],
        mustAnswer: ["Map the strongest repo implementation anchors."],
      }),
    );
  }
  pushSection(
    createHelixAskAnswerPlanSection({
      id: args.family === "roadmap_planning" ? "evidence_gaps" : "open_gaps",
      title: args.family === "roadmap_planning" ? "Evidence Gaps" : "Open Gaps",
      required: args.requiresRepoEvidence || args.objectives.length > 1,
      family: args.family,
      kind: "gaps",
      requiredSlots: ["failure_path"],
      mustAnswer: ["State what remains uncertain or under-evidenced in this turn."],
    }),
  );
  pushSection(
    createHelixAskAnswerPlanSection({
      id: "sources",
      title: "Sources",
      required: true,
      family: args.family,
      kind: "sources",
      mustAnswer: ["List the locked repo sources used for this answer."],
    }),
  );
  return sections.slice(0, 8);
};
