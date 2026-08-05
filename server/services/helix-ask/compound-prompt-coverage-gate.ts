import {
  buildHelixCompoundPromptContract,
  type HelixCompoundPromptContract,
} from "./prompt-interpretation";

type RecordLike = Record<string, unknown>;

export type HelixCompoundRequirementResolution = {
  requirement_id: string;
  status: "answered" | "blocked_with_reason" | "failed_closed";
  reason?: string;
  answer_excerpt?: string;
  evidence_refs?: string[];
  terminal_visible: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCompoundPromptCoverageGate = {
  schema: "helix.compound_prompt_coverage_gate.v1";
  applies: boolean;
  passed: boolean;
  decision: "PASS" | "FAIL_CLOSED" | "NOT_APPLICABLE";
  reason: string;
  required_count: number;
  answered_count: number;
  blocked_count: number;
  failed_closed_count: number;
  unresolved_requirement_ids: string[];
  non_visible_blocked_requirement_ids: string[];
  resolutions: HelixCompoundRequirementResolution[];
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCompoundPromptCoverageGateInput = {
  contract?: HelixCompoundPromptContract | RecordLike | null;
  promptText?: string | null;
  finalAnswerText?: string | null;
  terminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
  selectedEvidenceRefs?: string[];
  proposedResolutions?: Array<{
    requirement_id: string;
    status: "answered" | "blocked_with_reason" | "failed_closed";
    reason?: string;
    evidence_refs?: string[];
  }>;
};

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "answer",
  "because",
  "before",
  "being",
  "could",
  "explain",
  "include",
  "should",
  "their",
  "there",
  "these",
  "thing",
  "those",
  "through",
  "using",
  "where",
  "which",
  "while",
  "would",
]);

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const normalizeId = (value: unknown): string => readString(value).toUpperCase();

const readRequirementArray = (value: unknown): HelixCompoundPromptContract["requirements"] =>
  Array.isArray(value)
    ? value
        .map((entry: unknown) => (entry && typeof entry === "object" && !Array.isArray(entry) ? entry as RecordLike : null))
        .filter((entry: RecordLike | null): entry is RecordLike => Boolean(entry))
        .map((entry: RecordLike) => ({
          id: readString(entry.id),
          text: readString(entry.text),
          span: entry.span && typeof entry.span === "object" && !Array.isArray(entry.span)
            ? entry.span as { start: number; end: number }
            : undefined,
          kind: readString(entry.kind) as HelixCompoundPromptContract["requirements"][number]["kind"],
          required: entry.required !== false,
          depends_on: Array.isArray(entry.depends_on)
            ? entry.depends_on.filter((item: unknown): item is string => typeof item === "string")
            : [],
          status: readString(entry.status) as HelixCompoundPromptContract["requirements"][number]["status"],
        }))
        .filter((entry: HelixCompoundPromptContract["requirements"][number]) => entry.id && entry.text)
    : [];

const coerceContract = (
  contract: HelixCompoundPromptContract | RecordLike | null | undefined,
  promptText?: string | null,
): HelixCompoundPromptContract | null => {
  if (contract && readString((contract as RecordLike).schema) === "helix.compound_prompt_contract.v1") {
    return {
      ...(contract as HelixCompoundPromptContract),
      requirements: readRequirementArray((contract as RecordLike).requirements),
    };
  }
  const prompt = readString(promptText);
  return prompt ? buildHelixCompoundPromptContract(prompt, []) : null;
};

const extractRequirementTags = (
  finalAnswerText: string,
): Map<string, { state: "answered" | "blocked" | "failed"; excerpt: string }> => {
  const tags = new Map<string, { state: "answered" | "blocked" | "failed"; excerpt: string }>();
  const pattern = /\[REQ:([A-Z0-9_-]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(finalAnswerText))) {
    const rawId = normalizeId(match[1]);
    const modifier = rawId.endsWith("_BLOCKED")
      ? "BLOCKED"
      : rawId.endsWith("_FAILED")
        ? "FAILED"
        : "";
    const id = modifier ? rawId.replace(/_(?:BLOCKED|FAILED)$/u, "") : rawId;
    const lineEnd = finalAnswerText.indexOf("\n", pattern.lastIndex);
    const excerpt = finalAnswerText
      .slice(pattern.lastIndex, lineEnd >= 0 ? lineEnd : Math.min(finalAnswerText.length, pattern.lastIndex + 240))
      .replace(/\s+/g, " ")
      .trim();
    tags.set(id, {
      state: modifier === "BLOCKED" ? "blocked" : modifier === "FAILED" ? "failed" : "answered",
      excerpt,
    });
  }
  return tags;
};

const keywordsForRequirement = (text: string): string[] =>
  Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word: string) => word.length >= 5 && !STOPWORDS.has(word)),
    ),
  ).slice(0, 10);

const phraseForRequirement = (text: string): string => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word: string) => word.length > 0 && !STOPWORDS.has(word));
  return words.slice(0, 5).join(" ");
};

const isAnsweredByText = (requirementText: string, normalizedAnswer: string): boolean => {
  const phrase = phraseForRequirement(requirementText);
  if (phrase.length >= 18 && normalizedAnswer.includes(phrase)) return true;
  const keywords = keywordsForRequirement(requirementText);
  if (keywords.length === 0) return false;
  const matches = keywords.filter((keyword: string) => normalizedAnswer.includes(keyword)).length;
  return matches >= Math.min(2, keywords.length);
};

const visibleNonCompletionForRequirement = (
  requirementText: string,
  finalAnswerText: string,
): string | null => {
  const requirementKeywords = keywordsForRequirement(requirementText);
  if (requirementKeywords.length === 0) return null;
  const segments = finalAnswerText
    .split(/(?:\r?\n)+|(?<=[.!?])\s+/u)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const nonCompletionPattern =
    /\b(?:cannot|can't|could not|couldn't|unable to|do not have|don't have|did not|didn't|not completed|not complete|not performed|not executed|not verified|not available|missing|remains? (?:unfinished|unresolved|incomplete))\b/i;
  const mentionsKeyword = (segment: string, keyword: string): boolean => {
    const words = segment
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const singularKeyword = keyword.endsWith("s")
      ? keyword.slice(0, -1)
      : keyword;
    const yInflectionPrefix = keyword.endsWith("y")
      ? `${keyword.slice(0, -1)}i`
      : null;
    return words.some(
      (word) =>
        word === keyword ||
        word.startsWith(keyword) ||
        (singularKeyword.length >= 5 &&
          (word === singularKeyword || word.startsWith(singularKeyword))) ||
        Boolean(yInflectionPrefix && word.startsWith(yInflectionPrefix)),
    );
  };
  const matchCount = (segment: string): number => {
    return requirementKeywords.filter((keyword) =>
      mentionsKeyword(segment, keyword),
    ).length;
  };
  let nonCompletionListContext = false;
  const segmentRecords = segments.map((segment) => {
    const directNonCompletion = nonCompletionPattern.test(segment);
    const listItem = /^\s*[-*•]\s+/u.test(segment);
    const contextualNonCompletion = nonCompletionListContext && listItem;
    if (directNonCompletion && /:\s*$/u.test(segment)) {
      nonCompletionListContext = true;
    } else if (!contextualNonCompletion) {
      nonCompletionListContext = false;
    }
    return {
      segment,
      nonCompletion: directNonCompletion || contextualNonCompletion,
    };
  });
  const strongestPositiveMatch = segmentRecords
    .filter((record) => !record.nonCompletion)
    .reduce(
      (strongest, record) =>
        Math.max(strongest, matchCount(record.segment)),
      0,
    );
  for (const record of segmentRecords) {
    const { segment } = record;
    const normalizedSegment = segment.toLowerCase();
    if (!record.nonCompletion) continue;
    const matchingKeywordCount = matchCount(normalizedSegment);
    const stronglyNamesRequirement =
      matchingKeywordCount >=
      Math.min(
        requirementKeywords.length,
        Math.max(2, Math.ceil(requirementKeywords.length * 0.6)),
      );
    // A truthful non-completion sentence often names only the unfinished
    // operations (for example, "set/restore/re-query") rather than repeating
    // the entire user requirement. Treat two distinctive requirement terms as
    // sufficient only when that sentence is a stronger match than any
    // positive result sentence. This preserves an already reported sub-result
    // while preventing the missing remainder from being counted as complete.
    const namesRequirement =
      stronglyNamesRequirement ||
      (matchingKeywordCount >= Math.min(2, requirementKeywords.length) &&
        matchingKeywordCount > strongestPositiveMatch);
    if (!namesRequirement) continue;
    return segment.slice(0, 320);
  }
  return null;
};

const isTerminalFailure = (terminalArtifactKind?: string | null, finalAnswerSource?: string | null): boolean => {
  const terminalKind = readString(terminalArtifactKind);
  const source = readString(finalAnswerSource);
  return terminalKind === "typed_failure" || terminalKind === "fail_closed" || source === "typed_failure" || source === "fail_closed";
};

const emptyGate = (reason: string): HelixCompoundPromptCoverageGate => ({
  schema: "helix.compound_prompt_coverage_gate.v1",
  applies: false,
  passed: true,
  decision: "NOT_APPLICABLE",
  reason,
  required_count: 0,
  answered_count: 0,
  blocked_count: 0,
  failed_closed_count: 0,
  unresolved_requirement_ids: [],
  non_visible_blocked_requirement_ids: [],
  resolutions: [],
  assistant_answer: false,
  raw_content_included: false,
});

export const evaluateCompoundPromptCoverageGate = (
  input: HelixCompoundPromptCoverageGateInput,
): HelixCompoundPromptCoverageGate => {
  if (
    readString(input.terminalArtifactKind) === "capability_help_summary" ||
    readString(input.finalAnswerSource) === "capability_help_summary"
  ) {
    return emptyGate("capability_help_terminal");
  }
  const contract = coerceContract(input.contract, input.promptText);
  if (!contract) return emptyGate("compound_prompt_contract_missing");

  const required = contract.requirements.filter((requirement: HelixCompoundPromptContract["requirements"][number]) => requirement.required);
  if (required.length <= 1) return emptyGate("single_requirement_prompt");

  const finalAnswerText = readString(input.finalAnswerText);
  const normalizedAnswer = finalAnswerText.toLowerCase();
  const tags = extractRequirementTags(finalAnswerText);
  const proposed = new Map(
    (input.proposedResolutions ?? []).map((entry: NonNullable<HelixCompoundPromptCoverageGateInput["proposedResolutions"]>[number]) => [normalizeId(entry.requirement_id), entry]),
  );
  const terminalFailure = isTerminalFailure(input.terminalArtifactKind, input.finalAnswerSource);
  const allowPartialAnswer = contract.output_contract?.allow_partial_answer === true;

  const resolutions = required.map((requirement: HelixCompoundPromptContract["requirements"][number]): HelixCompoundRequirementResolution => {
    const id = normalizeId(requirement.id);
    const tagged = tags.get(id);
    const proposedResolution = proposed.get(id);

    if (terminalFailure) {
      return {
        requirement_id: requirement.id,
        status: "failed_closed",
        reason: "terminal failed closed before a partial success answer could be authoritative",
        evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: true,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    if (tagged?.state === "blocked") {
      return {
        requirement_id: requirement.id,
        status: "blocked_with_reason",
        reason: tagged.excerpt || proposedResolution?.reason || "blocked requirement was marked in final answer",
        answer_excerpt: tagged.excerpt,
        evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: tagged.excerpt.length > 0,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    if (tagged?.state === "failed") {
      return {
        requirement_id: requirement.id,
        status: "blocked_with_reason",
        reason: tagged.excerpt || proposedResolution?.reason || "requirement was marked failed in final answer",
        answer_excerpt: tagged.excerpt,
        evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: tagged.excerpt.length > 0,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    const visibleNonCompletion = visibleNonCompletionForRequirement(
      requirement.text,
      finalAnswerText,
    );
    if (visibleNonCompletion) {
      return {
        requirement_id: requirement.id,
        status: "blocked_with_reason",
        reason: visibleNonCompletion,
        answer_excerpt: visibleNonCompletion,
        evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: true,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    if (proposedResolution?.status === "answered") {
      return {
        requirement_id: requirement.id,
        status: "answered",
        reason:
          readString(proposedResolution.reason) ||
          "trusted current-turn evidence resolved the requirement",
        evidence_refs:
          proposedResolution.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: true,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    if (tagged?.state === "answered" || isAnsweredByText(requirement.text, normalizedAnswer)) {
      return {
        requirement_id: requirement.id,
        status: "answered",
        answer_excerpt: tagged?.excerpt,
        evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: true,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    if (proposedResolution?.status === "blocked_with_reason") {
      const reason = readString(proposedResolution.reason);
      const reasonVisible = reason ? normalizedAnswer.includes(reason.toLowerCase()) : false;
      return {
        requirement_id: requirement.id,
        status: "blocked_with_reason",
        reason: reason || "blocked requirement was not explained in the terminal answer",
        evidence_refs: proposedResolution.evidence_refs ?? input.selectedEvidenceRefs ?? [],
        terminal_visible: reasonVisible,
        assistant_answer: false,
        raw_content_included: false,
      };
    }

    return {
      requirement_id: requirement.id,
      status: "blocked_with_reason",
      reason: "required compound prompt item was not resolved in the terminal answer",
      evidence_refs: proposedResolution?.evidence_refs ?? input.selectedEvidenceRefs ?? [],
      terminal_visible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
  });

  const unresolved = resolutions
    .filter(
      (resolution: HelixCompoundRequirementResolution) =>
        resolution.status === "blocked_with_reason" &&
        (!resolution.terminal_visible || !allowPartialAnswer),
    )
    .map((resolution: HelixCompoundRequirementResolution) => resolution.requirement_id);
  const nonVisibleBlocked = resolutions
    .filter((resolution: HelixCompoundRequirementResolution) => resolution.status === "blocked_with_reason" && !resolution.terminal_visible)
    .map((resolution: HelixCompoundRequirementResolution) => resolution.requirement_id);
  const passed = unresolved.length === 0 && nonVisibleBlocked.length === 0;

  return {
    schema: "helix.compound_prompt_coverage_gate.v1",
    applies: true,
    passed,
    decision: passed ? "PASS" : "FAIL_CLOSED",
    reason: passed
      ? "all required compound prompt items were answered, allowed as visibly blocked, or failed closed"
      : allowPartialAnswer
        ? "required compound prompt items were missing or blocked without a visible reason"
        : "required compound prompt items were missing or blocked while partial answers were disallowed",
    required_count: required.length,
    answered_count: resolutions.filter((resolution: HelixCompoundRequirementResolution) => resolution.status === "answered").length,
    blocked_count: resolutions.filter((resolution: HelixCompoundRequirementResolution) => resolution.status === "blocked_with_reason").length,
    failed_closed_count: resolutions.filter((resolution: HelixCompoundRequirementResolution) => resolution.status === "failed_closed").length,
    unresolved_requirement_ids: unresolved,
    non_visible_blocked_requirement_ids: nonVisibleBlocked,
    resolutions,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const buildCompoundCoverageFailureMessage = (gate: HelixCompoundPromptCoverageGate): string => {
  const missing = gate.unresolved_requirement_ids.length > 0
    ? gate.unresolved_requirement_ids.join(", ")
    : "unknown";
  const invisible = gate.non_visible_blocked_requirement_ids.length > 0
    ? ` Non-visible blocked requirements: ${gate.non_visible_blocked_requirement_ids.join(", ")}.`
    : "";
  return `I could not complete this Ask turn because required compound prompt items were not resolved before terminal authority. Missing requirements: ${missing}.${invisible}`;
};
