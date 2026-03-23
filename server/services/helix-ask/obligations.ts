export type HelixAskAnswerPlanFamily =
  | "definition_overview"
  | "mechanism_process"
  | "equation_formalism"
  | "comparison_tradeoff"
  | "troubleshooting_diagnosis"
  | "implementation_code_path"
  | "roadmap_planning"
  | "recommendation_decision"
  | "general_overview";

export type HelixAskTurnContractObjective = {
  label: string;
  required_slots: string[];
  query_hints: string[];
};

export type HelixAskAnswerObligationKind =
  | "direct_answer"
  | "definition"
  | "mechanism"
  | "comparison"
  | "implementation"
  | "process"
  | "change"
  | "diagnosis"
  | "roadmap"
  | "uncertainty";

export type HelixAskAnswerFormatEvidenceKind = "doc" | "code" | "test" | "runtime";

export type HelixAskAnswerFormatSectionKind =
  | "answer"
  | "definition"
  | "mechanism"
  | "comparison"
  | "repo"
  | "diagnosis"
  | "roadmap"
  | "gaps"
  | "sources";

export type HelixAskAnswerObligation = {
  id: string;
  label: string;
  kind: HelixAskAnswerObligationKind;
  required: boolean;
  required_slots: string[];
  preferred_evidence: HelixAskAnswerFormatEvidenceKind[];
  objective_label?: string | null;
  section_title?: string | null;
};

export type HelixAskAnswerPlanSectionLike = {
  id?: string;
  title: string;
  required: boolean;
  must_answer?: string[];
  required_slots?: string[];
  preferred_evidence?: HelixAskAnswerFormatEvidenceKind[];
  kind?: HelixAskAnswerFormatSectionKind;
  objective_label?: string | null;
};

const clipText = (value: string | undefined, limit: number): string =>
  String(value ?? "").slice(0, Math.max(0, limit));

export const normalizeSlotId = (value: string): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeHelixAskTurnContractText = (value: string, maxChars: number): string => {
  const cleaned = String(value ?? "")
    .replace(/\b(?:docs|server|client|modules|shared|scripts|tests|apps|packages|cli)\/[A-Za-z0-9_./-]+\b/gi, " ")
    .replace(/^\s*sources?\s*:\s*/gim, " ")
    .replace(/[`#*]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned ? clipText(cleaned, maxChars).trim() : "";
};

export const normalizeHelixAskAnswerFormatSectionKind = (
  value: string,
  fallback: HelixAskAnswerFormatSectionKind,
): HelixAskAnswerFormatSectionKind => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  switch (normalized) {
    case "answer":
    case "short_answer":
    case "direct_answer":
      return "answer";
    case "definition":
    case "summary":
      return "definition";
    case "mechanism":
    case "explanation":
    case "process":
      return "mechanism";
    case "comparison":
    case "tradeoff":
      return "comparison";
    case "repo":
    case "implementation":
    case "code":
    case "code_path":
    case "call_chain":
      return "repo";
    case "diagnosis":
    case "troubleshooting":
      return "diagnosis";
    case "roadmap":
    case "planning":
      return "roadmap";
    case "gaps":
    case "uncertainty":
    case "open_gaps":
      return "gaps";
    case "sources":
      return "sources";
    default:
      return fallback;
  }
};

export const normalizeHelixAskAnswerFormatEvidenceKinds = (
  values: unknown,
  fallback: HelixAskAnswerFormatEvidenceKind[],
): HelixAskAnswerFormatEvidenceKind[] => {
  const pool = Array.isArray(values) ? values : [];
  const out: HelixAskAnswerFormatEvidenceKind[] = [];
  for (const entry of pool) {
    const normalized = String(entry ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (
      normalized === "doc" ||
      normalized === "code" ||
      normalized === "test" ||
      normalized === "runtime"
    ) {
      if (!out.includes(normalized)) out.push(normalized);
    }
  }
  return out.length > 0 ? out : fallback;
};

const extractHelixAskTurnObjectiveTerms = (value: string, maxTerms = 3): string[] => {
  const signal = normalizeHelixAskTurnContractText(value, 240)
    .toLowerCase()
    .replace(/[^\w\s-]+/g, " ");
  const terms = signal
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 4)
    .filter(
      (entry) =>
        ![
          "what",
          "when",
          "where",
          "which",
          "while",
          "with",
          "from",
          "this",
          "that",
          "into",
          "about",
          "would",
          "could",
          "should",
          "their",
          "there",
          "explain",
          "describe",
          "answer",
        ].includes(entry),
    );
  return Array.from(new Set(terms)).slice(0, Math.max(1, maxTerms));
};

export const inferHelixAskAnswerPlanSectionKindFromShape = (args: {
  family: HelixAskAnswerPlanFamily;
  id: string;
  title: string;
  requiredSlots: string[];
}): HelixAskAnswerFormatSectionKind => {
  const signal = `${args.id} ${args.title} ${args.requiredSlots.join(" ")}`.toLowerCase();
  if (/(?:^| )sources?(?: |$)/.test(signal)) return "sources";
  if (/(?:gap|uncertainty|open)/.test(signal)) return "gaps";
  if (/(?:diagnos|fix|check|symptom|cause)/.test(signal)) return "diagnosis";
  if (/(?:repo|code|path|call_chain|module|implementation|runtime)/.test(signal)) return "repo";
  if (/(?:compare|difference|tradeoff|improvement|versus|vs)/.test(signal)) return "comparison";
  if (/(?:roadmap|phase|milestone|next|plan)/.test(signal)) return "roadmap";
  if (/(?:definition|term|summary)/.test(signal)) return "definition";
  if (/(?:mechanism|process|how_it_works|how_it_is_solved|inputs|outputs|constraint)/.test(signal)) {
    return "mechanism";
  }
  switch (args.family) {
    case "definition_overview":
      return "definition";
    case "comparison_tradeoff":
      return "comparison";
    case "implementation_code_path":
      return "repo";
    case "roadmap_planning":
      return "roadmap";
    case "troubleshooting_diagnosis":
      return "diagnosis";
    case "mechanism_process":
      return "mechanism";
    default:
      return "answer";
  }
};

export const inferHelixAskAnswerPlanSectionEvidenceKinds = (args: {
  kind: HelixAskAnswerFormatSectionKind;
  requiredSlots: string[];
}): HelixAskAnswerFormatEvidenceKind[] => {
  const slots = args.requiredSlots.join(" ").toLowerCase();
  switch (args.kind) {
    case "sources":
      return ["doc", "code"];
    case "gaps":
      return ["doc", "code", "runtime"];
    case "repo":
      return ["code", "doc", "runtime"];
    case "comparison":
      return slots.includes("code_path") ? ["doc", "code"] : ["doc", "runtime"];
    case "diagnosis":
      return ["runtime", "code", "doc"];
    case "roadmap":
      return ["doc", "code", "runtime"];
    case "mechanism":
      return slots.includes("code_path") ? ["doc", "code"] : ["doc", "runtime"];
    case "definition":
      return ["doc", "code"];
    case "answer":
    default:
      return ["doc", "code"];
  }
};

export const normalizeHelixAskAnswerObligationLabel = (value: string, fallback: string): string => {
  const normalized = normalizeHelixAskTurnContractText(value, 160)
    .replace(/^\s*(?:plan\s+for|notes:\s+see)\s+/i, "")
    .replace(/\s*[?]+\s*$/g, "")
    .trim();
  return normalized || fallback;
};

const mapHelixAskSectionKindToObligationKind = (
  kind: HelixAskAnswerFormatSectionKind,
): HelixAskAnswerObligationKind => {
  switch (kind) {
    case "definition":
      return "definition";
    case "mechanism":
      return "mechanism";
    case "comparison":
      return "comparison";
    case "repo":
      return "implementation";
    case "diagnosis":
      return "diagnosis";
    case "roadmap":
      return "roadmap";
    case "gaps":
      return "uncertainty";
    case "answer":
    default:
      return "direct_answer";
  }
};

const inferHelixAskAnswerObligationKind = (args: {
  family: HelixAskAnswerPlanFamily;
  label: string;
  requiredSlots: string[];
  sectionKind?: HelixAskAnswerFormatSectionKind | null;
}): HelixAskAnswerObligationKind => {
  if (args.sectionKind) return mapHelixAskSectionKindToObligationKind(args.sectionKind);
  const signal = `${args.label} ${args.requiredSlots.join(" ")}`.toLowerCase();
  if (/(?:compare|difference|versus|vs\.?|tradeoff|improvement)/.test(signal)) return "comparison";
  if (/(?:why|mechanism|process|flow|works?|solved?|computed?|derived?)/.test(signal)) return "mechanism";
  if (/(?:repo|code|path|module|file|call\s+chain|implementation|runtime)/.test(signal)) return "implementation";
  if (/(?:check|cause|fix|diagnos|failure|problem|issue)/.test(signal)) return "diagnosis";
  if (/(?:plan|roadmap|next\s+steps?|milestone|phase|rollout|change)/.test(signal)) return "roadmap";
  if (/(?:uncertain|unknown|gap|missing)/.test(signal)) return "uncertainty";
  if (/(?:what\s+is|define|definition|term)/.test(signal)) return "definition";
  switch (args.family) {
    case "definition_overview":
      return "definition";
    case "mechanism_process":
    case "equation_formalism":
      return "mechanism";
    case "comparison_tradeoff":
      return "comparison";
    case "implementation_code_path":
      return "implementation";
    case "troubleshooting_diagnosis":
      return "diagnosis";
    case "roadmap_planning":
      return "roadmap";
    default:
      return "direct_answer";
  }
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

export const createHelixAskAnswerObligation = (args: {
  id: string;
  label: string;
  family: HelixAskAnswerPlanFamily;
  required: boolean;
  requiredSlots?: string[];
  preferredEvidence?: HelixAskAnswerFormatEvidenceKind[];
  sectionKind?: HelixAskAnswerFormatSectionKind | null;
  objectiveLabel?: string | null;
  sectionTitle?: string | null;
}): HelixAskAnswerObligation => {
  const requiredSlots = (args.requiredSlots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean);
  const kind = inferHelixAskAnswerObligationKind({
    family: args.family,
    label: args.label,
    requiredSlots,
    sectionKind: args.sectionKind ?? null,
  });
  const preferredEvidence =
    args.preferredEvidence ??
    inferHelixAskAnswerPlanSectionEvidenceKinds({
      kind:
        args.sectionKind ??
        (kind === "definition"
          ? "definition"
          : kind === "mechanism" || kind === "process"
            ? "mechanism"
            : kind === "comparison"
              ? "comparison"
              : kind === "implementation"
                ? "repo"
                : kind === "diagnosis"
                  ? "diagnosis"
                  : kind === "roadmap" || kind === "change"
                    ? "roadmap"
                    : kind === "uncertainty"
                      ? "gaps"
                      : "answer"),
      requiredSlots,
    });
  return {
    id: slugifyHelixAskAnswerPlanSectionId(args.id, "obligation"),
    label: normalizeHelixAskAnswerObligationLabel(args.label, args.sectionTitle ?? args.id),
    kind,
    required: args.required,
    required_slots: requiredSlots.slice(0, 6),
    preferred_evidence: preferredEvidence.slice(0, 4),
    objective_label: args.objectiveLabel ?? null,
    section_title: args.sectionTitle ?? null,
  };
};

const doesHelixAskPlannerSectionCoverObjective = (args: {
  objective: HelixAskTurnContractObjective;
  sections: Array<{
    title?: string | null;
    must_answer?: string[] | null;
    objective_label?: string | null;
    required_slots?: string[] | null;
  }>;
}): boolean => {
  const objectiveTerms = extractHelixAskTurnObjectiveTerms(args.objective.label, 4);
  const objectiveSlots = new Set(
    (args.objective.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean),
  );
  if (objectiveTerms.length === 0 && objectiveSlots.size === 0) return false;
  return args.sections.some((section) => {
    const sectionText = [
      section.title ?? "",
      section.objective_label ?? "",
      ...(section.must_answer ?? []),
      ...((section.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean) as string[]),
    ]
      .join(" ")
      .toLowerCase();
    const termOverlap = objectiveTerms.filter((term) => sectionText.includes(term.toLowerCase())).length;
    const sectionSlots = new Set(
      (section.required_slots ?? []).map((slot) => normalizeSlotId(slot)).filter(Boolean),
    );
    const slotOverlap = Array.from(objectiveSlots).filter((slot) => sectionSlots.has(slot)).length;
    if (termOverlap >= Math.min(2, objectiveTerms.length)) return true;
    if (termOverlap >= 1 && slotOverlap >= 1) return true;
    if (objectiveTerms.length === 0 && slotOverlap >= 1) return true;
    return false;
  });
};

export const buildHelixAskTurnContractObligations = (args: {
  question: string;
  family: HelixAskAnswerPlanFamily;
  objectives: HelixAskTurnContractObjective[];
  requiredSlots: string[];
  plannerSections?: HelixAskAnswerPlanSectionLike[];
  fallbackSections: HelixAskAnswerPlanSectionLike[];
  requiresRepoEvidence: boolean;
}): HelixAskAnswerObligation[] => {
  const obligations: HelixAskAnswerObligation[] = [];
  const seen = new Set<string>();
  const pushObligation = (obligation: HelixAskAnswerObligation | null): void => {
    if (!obligation) return;
    const key = `${obligation.kind}:${obligation.label}`.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    obligations.push(obligation);
  };
  const plannerSections = (args.plannerSections ?? []).filter(
    (section) => (section.kind ?? "answer") !== "sources",
  );
  const fallbackSections = args.fallbackSections ?? [];
  if (
    plannerSections.length > 0 ||
    !fallbackSections.some((section) =>
      (section.kind ?? "answer") === "answer" || (section.kind ?? "answer") === "definition",
    )
  ) {
    pushObligation(
      createHelixAskAnswerObligation({
        id: "direct_answer",
        label: args.objectives[0]?.label ?? args.question,
        family: args.family,
        required: true,
        requiredSlots: args.objectives[0]?.required_slots ?? args.requiredSlots.slice(0, 3),
        sectionKind: "answer",
        objectiveLabel: args.objectives[0]?.label ?? null,
        sectionTitle: "Direct Answer",
      }),
    );
  }
  if (plannerSections.length > 0) {
    for (const section of plannerSections.slice(0, 8)) {
      if ((section.kind ?? "answer") === "answer" && /direct answer/i.test(section.title)) continue;
      pushObligation(
        createHelixAskAnswerObligation({
          id: section.id ?? section.title,
          label: section.must_answer?.[0] ?? section.objective_label ?? section.title,
          family: args.family,
          required: section.required !== false,
          requiredSlots: section.required_slots ?? [],
          preferredEvidence: section.preferred_evidence ?? [],
          sectionKind: section.kind ?? null,
          objectiveLabel: section.objective_label ?? null,
          sectionTitle: section.title,
        }),
      );
    }
    for (const [index, objective] of args.objectives.entries()) {
      const sectionKind = inferHelixAskAnswerPlanSectionKindFromShape({
        family: args.family,
        id: objective.label,
        title: objective.label,
        requiredSlots: objective.required_slots,
      });
      if (index === 0 && (sectionKind === "definition" || sectionKind === "answer")) continue;
      if (doesHelixAskPlannerSectionCoverObjective({ objective, sections: plannerSections })) continue;
      pushObligation(
        createHelixAskAnswerObligation({
          id: `objective_${index + 1}`,
          label: objective.label,
          family: args.family,
          required: true,
          requiredSlots: objective.required_slots,
          sectionKind,
          objectiveLabel: objective.label,
          sectionTitle:
            index === 0 && sectionKind === "definition"
              ? "Definition"
              : sectionKind === "repo" &&
                  /\bhow\b.*\b(?:codebase|repo)\b/i.test(objective.label)
                ? "How it is solved in codebase"
                : null,
        }),
      );
    }
  } else {
    for (const section of fallbackSections) {
      if ((section.kind ?? "answer") === "sources") continue;
      pushObligation(
        createHelixAskAnswerObligation({
          id: section.id ?? section.title,
          label: section.must_answer?.[0] ?? section.objective_label ?? section.title,
          family: args.family,
          required: section.required,
          requiredSlots: section.required_slots ?? [],
          preferredEvidence: section.preferred_evidence ?? [],
          sectionKind: section.kind ?? null,
          objectiveLabel: section.objective_label ?? args.objectives[0]?.label ?? null,
          sectionTitle: section.title,
        }),
      );
    }
    const fallbackKinds = new Set(
      fallbackSections
        .filter((section) => (section.kind ?? "answer") !== "sources")
        .map((section) => section.kind ?? "answer"),
    );
    for (const [index, objective] of args.objectives.entries()) {
      const sectionKind = inferHelixAskAnswerPlanSectionKindFromShape({
        family: args.family,
        id: objective.label,
        title: objective.label,
        requiredSlots: objective.required_slots,
      });
      if (index === 0 && (sectionKind === "definition" || sectionKind === "answer")) continue;
      if (fallbackKinds.has(sectionKind)) continue;
      pushObligation(
        createHelixAskAnswerObligation({
          id: `objective_${index + 1}`,
          label: objective.label,
          family: args.family,
          required: true,
          requiredSlots: objective.required_slots,
          sectionKind,
          objectiveLabel: objective.label,
          sectionTitle:
            index === 0 && sectionKind === "definition"
              ? "Definition"
              : sectionKind === "repo" &&
                  /\bhow\b.*\b(?:codebase|repo)\b/i.test(objective.label)
                ? "How it is solved in codebase"
                : null,
        }),
      );
    }
  }
  if (
    (args.requiresRepoEvidence || obligations.length > 2) &&
    !obligations.some((obligation) => obligation.kind === "uncertainty")
  ) {
    pushObligation(
      createHelixAskAnswerObligation({
        id: "open_gaps",
        label: "State what remains uncertain or under-evidenced in this turn.",
        family: args.family,
        required: args.requiresRepoEvidence || obligations.length > 2,
        requiredSlots: ["failure_path"],
        sectionKind: "gaps",
        sectionTitle: args.family === "roadmap_planning" ? "Evidence Gaps" : "Open Gaps",
      }),
    );
  }
  return obligations.slice(0, 8);
};
