import crypto from "node:crypto";
import {
  HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA,
  type HelixClarificationNeed,
  type HelixClarificationQuestionProposal,
} from "@shared/helix-clarification-dialogue";
import { buildAgenticRequestInputFromClarification } from "../helix-ask/agentic-request-input-planner";
import {
  clarificationQuestionForNeed,
  rankClarificationNeed,
  rankClarificationNeeds,
} from "./clarification-ranker";
import {
  markClarificationQuestionDismissed,
  recordClarificationQuestion,
  recordSuppressedClarificationQuestion,
} from "./clarification-question-store";

const proposalsByThread = new Map<string, HelixClarificationQuestionProposal[]>();
const answeredNeedIds = new Set<string>();
const dismissedProposalIds = new Set<string>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function proposeClarificationQuestion(input: {
  need: HelixClarificationNeed;
  surfacePolicy?: HelixClarificationQuestionProposal["surface_policy"];
  roomId?: string | null;
  now?: string;
}): HelixClarificationQuestionProposal | null {
  if (answeredNeedIds.has(input.need.need_id)) return null;
  const existing = proposalsByThread.get(input.need.thread_id)?.find((proposal) => proposal.need_id === input.need.need_id);
  if (existing && !dismissedProposalIds.has(existing.proposal_id)) return existing;
  const ranking = rankClarificationNeed({
    need: input.need,
    roomId: input.roomId ?? null,
    now: input.now,
  });
  if (ranking.suppress_reason) {
    recordSuppressedClarificationQuestion({
      ranking,
      needId: input.need.need_id,
      now: input.now,
    });
    return null;
  }
  const now = input.now ?? new Date().toISOString();
  const proposal: HelixClarificationQuestionProposal = {
    schema: HELIX_CLARIFICATION_QUESTION_PROPOSAL_SCHEMA,
    proposal_id: `clarification_question:${hashShort([input.need.need_id, clarificationQuestionForNeed(input.need)])}`,
    thread_id: input.need.thread_id,
    need_id: input.need.need_id,
    question: clarificationQuestionForNeed(input.need),
    options: ranking.answer_options ?? ["Yes", "No", "Something else"],
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
    ranking,
    request_input: buildAgenticRequestInputFromClarification({ ranking }),
  };
  const existingList = proposalsByThread.get(proposal.thread_id) ?? [];
  proposalsByThread.set(proposal.thread_id, [...existingList, proposal].slice(-100));
  recordClarificationQuestion({
    proposal,
    roomId: input.roomId ?? null,
    ranking,
    status: proposal.surface_policy === "silent_log" ? "suppressed" : "pending",
    now,
  });
  return proposal;
}

export function planClarificationQuestions(input: {
  needs: HelixClarificationNeed[];
  visibleBudget?: number;
  roomId?: string | null;
}): HelixClarificationQuestionProposal[] {
  const visibleBudget = Math.max(0, input.visibleBudget ?? 1);
  let visibleCount = 0;
  const proposals: HelixClarificationQuestionProposal[] = [];
  const rankings = rankClarificationNeeds({
    needs: input.needs,
    roomId: input.roomId ?? null,
  });
  for (const ranking of rankings) {
    const need = input.needs.find((candidate) => candidate.need_id === ranking.question_id.replace(/^clarification_question:/, ""))
      ?? input.needs.find((candidate) => ranking.question_id === `clarification_question:${hashShort([candidate.need_id, clarificationQuestionForNeed(candidate)])}`)
      ?? null;
    if (!need) continue;
    const surfacePolicy = visibleCount < visibleBudget && !ranking.suppress_reason ? "show_text" : "silent_log";
    const proposal = proposeClarificationQuestion({ need, surfacePolicy, roomId: input.roomId ?? null });
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
  markClarificationQuestionDismissed(proposalId);
}

export function clearClarificationQuestionProposalsForTest(): void {
  proposalsByThread.clear();
  answeredNeedIds.clear();
  dismissedProposalIds.clear();
}
