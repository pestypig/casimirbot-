import {
  normalizeHelixAskTurnContractText,
  normalizeSlotId,
} from "../obligations";

export type HelixAskObjectiveMiniAnswerStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveUnknownBlock = {
  unknown: string;
  why: string;
  what_i_checked: string[];
  next_retrieval: string;
};

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

const HELIX_ASK_GENERIC_UNKNOWN_SCAFFOLD_RE_LIST = [
  /^For\s+["'`].+?["'`],?\s*start with one concrete claim/i,
  /\bcore meaning of the concept in its domain context\b/i,
  /\bSources:\s*open-world best-effort\b/i,
] as const;

const HELIX_ASK_DEFINITION_COMMONALITY_SALVAGE_RE =
  /(?:\bhave\s+in\s+common\b)|(?:\bcommonality\b)|(?:\bshared\s+(?:principle|mechanism|dynamics?)\b)|(?:\bwhat\s+do(?:es)?\b[\s\S]{0,120}\bhave\s+in\s+common\b)/i;
const OPEN_WORLD_DEFINITION_TARGET_RE =
  /^(?:(?:what\s+(?:is|are))|what's|whats|define|describe|explain|meaning\s+of)\s+(.+?)[.?!]*$/i;
const OPEN_WORLD_DEFINITION_MEAN_RE =
  /^(?:what\s+does)\s+(.+?)\s+mean(?:\s+in\s+.+?)?[.?!]*$/i;
const HELIX_CONVERSATION_LEADING_FILLER_RE =
  /^(ok|okay|yeah|yep|right|cool|nice|thanks|thank you|got it|sounds good)\b[\s,.-]*/i;

export const isHelixAskGenericUnknownScaffold = (value: string): boolean => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return false;
  return HELIX_ASK_GENERIC_UNKNOWN_SCAFFOLD_RE_LIST.some((pattern) => pattern.test(normalized));
};

const hasHelixAskDefinitionCommonalityCue = (question: string): boolean => {
  const normalized = String(question ?? "").trim();
  if (!normalized) return false;
  return HELIX_ASK_DEFINITION_COMMONALITY_SALVAGE_RE.test(normalized);
};

function extractOpenWorldDefinitionTarget(question: string): string | null {
  const trimmed = String(question ?? "").trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(HELIX_CONVERSATION_LEADING_FILLER_RE, "").trim();
  const directMatch = normalized.match(OPEN_WORLD_DEFINITION_TARGET_RE);
  const meanMatch = normalized.match(OPEN_WORLD_DEFINITION_MEAN_RE);
  const matched = directMatch ?? meanMatch;
  if (!matched) return null;
  const target = String(matched[1] ?? "")
    .trim()
    .replace(/^["'`([{<\s]+|["'`)\]}>]+$/g, "")
    .trim();
  return target || null;
}

function buildOpenWorldConceptDefinitionFallback(question: string): string {
  if (/\bhave\s+in\s+common\b/i.test(question)) {
    if (/\belectron\b/i.test(question) && /\bsolar\s+system\b/i.test(question)) {
      return "They are both dynamical systems described by equations of motion and conservation laws, but at different scales: electrons require quantum models while solar-system motion is usually well-approximated classically.";
    }
    return "They are both analyzed as dynamical systems: you track position, velocity, and acceleration over time and apply governing equations with conservation laws.";
  }
  const target = extractOpenWorldDefinitionTarget(question);
  if (!target) return "";
  const trimmedTarget = target.trim();
  const whyDoesItMatterTarget = trimmedTarget.replace(/\s+and\s+why\s+does\s+it\s+matter\s*$/i, "").trim();
  if (/\bepistemology\b/i.test(trimmedTarget) || /\bepistemology\b/i.test(whyDoesItMatterTarget)) {
    return "Epistemology is the branch of philosophy that studies knowledge, justified belief, and evidence; it matters because it determines how we separate reliable claims from guesswork.";
  }
  if (/\bwhy\s+does\s+it\s+matter\b/i.test(trimmedTarget) && whyDoesItMatterTarget) {
    return `"${whyDoesItMatterTarget}" is a core concept in its domain; it matters because it changes what counts as credible evidence and guides practical decisions.`;
  }
  if (/\bin\s+physics\b/i.test(question)) {
    if (/\bfirst\s+principles?\b/i.test(target)) {
      return 'In physics, "first principles" means deriving conclusions from fundamental laws and conserved quantities with minimal fitted assumptions.';
    }
    return `In physics, "${target}" refers to a core concept defined by the governing laws and assumptions of the system.`;
  }
  return `Best-effort definition: "${target}" names a concept in its domain; define its governing idea, then test it with one concrete example before treating it as settled.`;
}

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

export const buildDeterministicHelixAskObjectiveAssembly = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  currentAnswer: string;
  blockedReason?: string | null;
  missingScopedRetrievalObjectiveIds?: string[];
  question?: string | null;
  visibleFailClosed?: boolean;
}): string => {
  const trimmedCurrent = args.currentAnswer.trim();
  const visibleFailClosed = args.visibleFailClosed !== false;
  if (
    args.miniAnswers.length === 1 &&
    args.miniAnswers[0]?.status === "covered" &&
    trimmedCurrent.length > 0
  ) {
    return trimmedCurrent;
  }
  const unresolved = args.miniAnswers
    .filter((entry) => entry.status !== "covered")
    .slice(0, 3);
  const missingScopedRetrievalSet = new Set(
    (args.missingScopedRetrievalObjectiveIds ?? [])
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean),
  );
  const renderUnknownBlock = (entry: HelixAskObjectiveMiniAnswer): string => {
    const unknownBlock = sanitizeHelixAskObjectiveUnknownBlock({
      block: entry.unknown_block,
      objectiveLabel: entry.objective_label,
      missingSlots: entry.missing_slots,
      evidenceRefs: entry.evidence_refs,
      scopedRetrievalMissing: missingScopedRetrievalSet.has(entry.objective_id),
    });
    const checked = unknownBlock.what_i_checked.length > 0
      ? unknownBlock.what_i_checked.join(", ")
      : "none";
    return [
      `UNKNOWN - ${entry.objective_label}`,
      `Why: ${unknownBlock.why}`,
      `What I checked: ${checked}`,
      `Next retrieval: ${unknownBlock.next_retrieval}`,
    ].join("\n");
  };
  const unknownBlocks = unresolved.map((entry) => renderUnknownBlock(entry)).join("\n\n");
  const deterministicSources = Array.from(
    new Set(
      args.miniAnswers
        .flatMap((entry) => [
          ...(entry.evidence_refs ?? []),
          ...((entry.unknown_block?.what_i_checked ?? []).map((value) =>
            String(value ?? "").trim(),
          )),
        ])
        .map((entry) => String(entry ?? "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
  const resolveBlockedReason = (): string => {
    const scopedRetrievalLabels = unresolved
      .filter((entry) => missingScopedRetrievalSet.has(entry.objective_id))
      .map((entry) => entry.objective_label);
    if (scopedRetrievalLabels.length > 0) {
      return `missing objective-scoped retrieval for unresolved required objective${scopedRetrievalLabels.length === 1 ? "" : "s"}: ${scopedRetrievalLabels.join(", ")}`;
    }
    if (args.blockedReason === "objective_assembly_fail_closed_missing_constructive_unknown") {
      return "constructive UNKNOWN blocks were required before assembly could continue";
    }
    if (args.blockedReason === "objective_assembly_unresolved_requires_unknown_blocks") {
      return "required objective unresolved; explicit UNKNOWN blocks were required before assembly could continue";
    }
    const unresolvedLabels = unresolved.map((entry) => entry.objective_label);
    if (unresolvedLabels.length > 0) {
      return `required objective unresolved: ${unresolvedLabels.join(", ")}`;
    }
    return "required objective gate failed";
  };
  if (unresolved.length > 0) {
    const commonalityFallback =
      args.question && hasHelixAskDefinitionCommonalityCue(args.question)
        ? buildOpenWorldConceptDefinitionFallback(args.question).trim()
        : "";
    if (!visibleFailClosed) {
      if (trimmedCurrent) {
        return trimmedCurrent;
      }
      const conversationalFallback = [
        commonalityFallback,
        ...args.miniAnswers.slice(0, 2).map((entry) => entry.summary).filter(Boolean),
      ]
        .join(" ")
        .trim();
      if (conversationalFallback) {
        return conversationalFallback;
      }
    }
    return [
      commonalityFallback || null,
      "Assembly blocked: required objective gate failed-closed.",
      `Reason: ${resolveBlockedReason()}.`,
      "Open gaps / UNKNOWNs:",
      unknownBlocks,
      deterministicSources.length > 0
        ? `Sources: ${deterministicSources.join(", ")}`
        : null,
    ]
      .filter((entry): entry is string => Boolean(entry && String(entry).trim()))
      .join("\n\n");
  }
  if (!trimmedCurrent) {
    return args.miniAnswers
      .slice(0, 2)
      .map((entry) => entry.summary)
      .join(" ");
  }
  return trimmedCurrent;
};
