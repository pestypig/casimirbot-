import type { HelixClarificationQuestionProposal } from "@shared/helix-clarification-dialogue";
import type { HelixClarificationRanking } from "@shared/helix-clarification-ranking";

export type ClarificationQuestionStatus =
  | "pending"
  | "answered"
  | "dismissed"
  | "suppressed";

export type StoredClarificationQuestion = {
  question_id: string;
  thread_id: string;
  room_id?: string | null;
  need_id: string;
  question: string;
  answer_options: string[];
  status: ClarificationQuestionStatus;
  ranking?: HelixClarificationRanking | null;
  proposal?: HelixClarificationQuestionProposal | null;
  answer?: string | null;
  created_at: string;
  updated_at: string;
  assistant_answer: false;
  raw_content_included: false;
};

const questionsByThread = new Map<string, StoredClarificationQuestion[]>();

const normalizeQuestion = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").replace(/[?.!]+$/g, "").trim();

const getThreadQuestions = (threadId: string): StoredClarificationQuestion[] =>
  questionsByThread.get(threadId) ?? [];

export function recordClarificationQuestion(input: {
  proposal: HelixClarificationQuestionProposal;
  roomId?: string | null;
  ranking?: HelixClarificationRanking | null;
  status?: ClarificationQuestionStatus;
  now?: string;
}): StoredClarificationQuestion {
  const now = input.now ?? new Date().toISOString();
  const question: StoredClarificationQuestion = {
    question_id: input.proposal.proposal_id,
    thread_id: input.proposal.thread_id,
    room_id: input.roomId ?? input.ranking?.room_id ?? null,
    need_id: input.proposal.need_id,
    question: input.proposal.question,
    answer_options: input.proposal.options ?? [],
    status: input.status ?? "pending",
    ranking: input.ranking ?? input.proposal.ranking ?? null,
    proposal: input.proposal,
    answer: null,
    created_at: input.proposal.created_at,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  const existing = getThreadQuestions(question.thread_id);
  const withoutDuplicate = existing.filter((entry) => entry.question_id !== question.question_id);
  questionsByThread.set(question.thread_id, [...withoutDuplicate, question].slice(-200));
  return question;
}

export function recordSuppressedClarificationQuestion(input: {
  ranking: HelixClarificationRanking;
  needId: string;
  now?: string;
}): StoredClarificationQuestion {
  const now = input.now ?? new Date().toISOString();
  const question: StoredClarificationQuestion = {
    question_id: input.ranking.question_id,
    thread_id: input.ranking.thread_id,
    room_id: input.ranking.room_id ?? null,
    need_id: input.needId,
    question: input.ranking.candidate_question,
    answer_options: input.ranking.answer_options ?? [],
    status: "suppressed",
    ranking: input.ranking,
    proposal: null,
    answer: null,
    created_at: input.ranking.created_at,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  const existing = getThreadQuestions(question.thread_id);
  const withoutDuplicate = existing.filter((entry) => entry.question_id !== question.question_id);
  questionsByThread.set(question.thread_id, [...withoutDuplicate, question].slice(-200));
  return question;
}

export function listClarificationQuestions(input: {
  threadId: string;
  roomId?: string | null;
  status?: ClarificationQuestionStatus | "any";
}): StoredClarificationQuestion[] {
  return getThreadQuestions(input.threadId)
    .filter((entry) => !input.roomId || entry.room_id === input.roomId)
    .filter((entry) => !input.status || input.status === "any" || entry.status === input.status);
}

export function getClarificationQuestion(questionId: string): StoredClarificationQuestion | null {
  for (const questions of questionsByThread.values()) {
    const found = questions.find((entry) => entry.question_id === questionId);
    if (found) return found;
  }
  return null;
}

export function hasRecentSimilarClarificationQuestion(input: {
  threadId: string;
  question: string;
  now?: string;
  cooldownMs?: number;
}): boolean {
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  const cooldownMs = input.cooldownMs ?? 10 * 60 * 1000;
  const normalized = normalizeQuestion(input.question);
  return getThreadQuestions(input.threadId).some((entry) => {
    if (entry.status === "dismissed" || entry.status === "suppressed") return false;
    if (normalizeQuestion(entry.question) !== normalized) return false;
    const created = Date.parse(entry.created_at);
    return Number.isFinite(created) && Number.isFinite(nowMs) && nowMs - created <= cooldownMs;
  });
}

export function markClarificationQuestionAnswered(input: {
  questionId: string;
  answer: string;
  now?: string;
}): StoredClarificationQuestion | null {
  const now = input.now ?? new Date().toISOString();
  for (const [threadId, questions] of questionsByThread.entries()) {
    const next = questions.map((entry) => entry.question_id === input.questionId
      ? {
          ...entry,
          status: "answered" as const,
          answer: input.answer,
          updated_at: now,
        }
      : entry);
    if (next !== questions && next.some((entry) => entry.question_id === input.questionId && entry.status === "answered")) {
      questionsByThread.set(threadId, next);
      return next.find((entry) => entry.question_id === input.questionId) ?? null;
    }
  }
  return null;
}

export function markClarificationQuestionDismissed(questionId: string, now = new Date().toISOString()): StoredClarificationQuestion | null {
  for (const [threadId, questions] of questionsByThread.entries()) {
    let found: StoredClarificationQuestion | null = null;
    const next = questions.map((entry) => {
      if (entry.question_id !== questionId) return entry;
      found = {
        ...entry,
        status: "dismissed" as const,
        updated_at: now,
      };
      return found;
    });
    if (found) {
      questionsByThread.set(threadId, next);
      return found;
    }
  }
  return null;
}

export function clearClarificationQuestionStoreForTest(): void {
  questionsByThread.clear();
}
