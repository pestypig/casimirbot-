import crypto from "node:crypto";
import {
  HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA,
  type HelixClarificationNeed,
  type HelixClarificationQuestionProposal,
} from "@shared/helix-clarification-dialogue";

const proposalsByThread = new Map<string, HelixClarificationQuestionProposal[]>();
const answeredNeedIds = new Set<string>();
const dismissedProposalIds = new Set<string>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const questionForNeed = (need: HelixClarificationNeed): string => {
  const missing = need.missing_evidence[0] ?? "the intended use";
  if (need.trigger === "user_goal_unknown") return "What are you trying to accomplish in this situation right now?";
  if (/lava|fluid|light/i.test(missing)) return "Is the side channel meant for lava lighting, drainage, or something else?";
  if (/egg|hopper|chest|container|breeding|feed|farm/i.test(missing)) {
    return "Is this animal cluster intended as a farm, temporary storage, or something else?";
  }
  return `Can you clarify this hypothesis? Missing evidence: ${missing}`;
};

export function proposeClarificationQuestion(input: {
  need: HelixClarificationNeed;
  surfacePolicy?: HelixClarificationQuestionProposal["surface_policy"];
  now?: string;
}): HelixClarificationQuestionProposal | null {
  if (answeredNeedIds.has(input.need.need_id)) return null;
  const existing = proposalsByThread.get(input.need.thread_id)?.find((proposal) => proposal.need_id === input.need.need_id);
  if (existing && !dismissedProposalIds.has(existing.proposal_id)) return existing;
  if (input.need.importance === "low" && input.need.trigger !== "manual_review") {
    return null;
  }
  const now = input.now ?? new Date().toISOString();
  const proposal: HelixClarificationQuestionProposal = {
    schema: HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA,
    proposal_id: `clarification_question:${hashShort([input.need.need_id, questionForNeed(input.need)])}`,
    thread_id: input.need.thread_id,
    need_id: input.need.need_id,
    question: questionForNeed(input.need),
    options: ["Yes", "No", "Something else"],
    freeform_allowed: true,
    expected_effect: input.need.trigger === "user_goal_unknown"
      ? "set_user_goal"
      : input.need.trigger === "new_pattern_candidate"
        ? "create_pattern_candidate"
        : "raise_confidence",
    surface_policy: input.surfacePolicy ?? (input.need.importance === "high" ? "show_text" : "silent_log"),
    created_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  const existingList = proposalsByThread.get(proposal.thread_id) ?? [];
  proposalsByThread.set(proposal.thread_id, [...existingList, proposal].slice(-100));
  return proposal;
}

export function planClarificationQuestions(input: {
  needs: HelixClarificationNeed[];
  visibleBudget?: number;
}): HelixClarificationQuestionProposal[] {
  const visibleBudget = Math.max(0, input.visibleBudget ?? 1);
  let visibleCount = 0;
  const proposals: HelixClarificationQuestionProposal[] = [];
  for (const need of input.needs.sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return rank[b.importance] - rank[a.importance] || b.created_at.localeCompare(a.created_at);
  })) {
    const surfacePolicy = visibleCount < visibleBudget && need.importance !== "low" ? "show_text" : "silent_log";
    const proposal = proposeClarificationQuestion({ need, surfacePolicy });
    if (!proposal) continue;
    if (proposal.surface_policy !== "silent_log") visibleCount += 1;
    proposals.push(proposal);
  }
  return proposals;
}

export function listClarificationQuestionProposals(threadId: string): HelixClarificationQuestionProposal[] {
  return (proposalsByThread.get(threadId) ?? []).filter((proposal) => !dismissedProposalIds.has(proposal.proposal_id));
}

export function markClarificationNeedAnswered(needId: string): void {
  answeredNeedIds.add(needId);
}

export function dismissClarificationQuestionProposal(proposalId: string): void {
  dismissedProposalIds.add(proposalId);
}

export function clearClarificationQuestionProposalsForTest(): void {
  proposalsByThread.clear();
  answeredNeedIds.clear();
  dismissedProposalIds.clear();
}
