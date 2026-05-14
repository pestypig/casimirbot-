import crypto from "node:crypto";
import {
  HELIX_CLARIFICATION_NEED_SCHEMA,
  type HelixClarificationNeed,
  type HelixClarificationSourceFamily,
} from "@shared/helix-clarification-dialogue";
import { listGameUtilityHypotheses } from "./minecraft-entity-utility-reducer";
import { listPatternCandidates } from "./pattern-candidate-ledger";
import { listSyntheticEvidence } from "./synthetic-evidence-ledger";
import { listContinuousCategorizationJobs } from "./continuous-categorization-job-store";

const needsByThread = new Map<string, HelixClarificationNeed[]>();
const dismissedNeedIds = new Set<string>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));

const sourceFamilyForJob = (value?: string | null): HelixClarificationSourceFamily =>
  value === "minecraft_events" ||
  value === "discord_voice" ||
  value === "calculator_stream" ||
  value === "physics_simulation" ||
  value === "browser_transcript" ||
  value === "research_session" ||
  value === "custom"
    ? value
    : "custom";

export function detectClarificationNeeds(input: {
  threadId: string;
  roomId?: string | null;
  now?: string;
}): HelixClarificationNeed[] {
  const now = input.now ?? new Date().toISOString();
  const jobs = listContinuousCategorizationJobs({ threadId: input.threadId, roomId: input.roomId ?? null, status: "any" });
  const latestJob = jobs.at(-1) ?? null;
  const existing = needsByThread.get(input.threadId) ?? [];
  const nextById = new Map(existing.map((need) => [need.need_id, need]));
  for (const hypothesis of listGameUtilityHypotheses(input.threadId)) {
    if (input.roomId && hypothesis.room_id !== input.roomId) continue;
    if (hypothesis.missing_evidence.length === 0) continue;
    if (hypothesis.confidence < 0.45 || hypothesis.confidence >= 0.85) continue;
    const needId = `clarification_need:${hashShort([
      input.threadId,
      hypothesis.room_id,
      hypothesis.hypothesis_id,
      hypothesis.missing_evidence,
    ])}`;
    if (dismissedNeedIds.has(needId)) continue;
    nextById.set(needId, {
      schema: HELIX_CLARIFICATION_NEED_SCHEMA,
      need_id: needId,
      thread_id: input.threadId,
      job_id: latestJob?.job_id ?? null,
      environment_id: null,
      source_family: sourceFamilyForJob(latestJob?.source_family ?? "minecraft_events"),
      trigger: hypothesis.confidence >= 0.6 ? "missing_evidence" : "ambiguous_hypothesis",
      hypothesis_ids: [hypothesis.hypothesis_id],
      evidence_ids: uniqueStrings(hypothesis.supporting_evidence_refs),
      missing_evidence: uniqueStrings(hypothesis.missing_evidence).slice(0, 6),
      importance: hypothesis.confidence >= 0.6 ? "medium" : "low",
      question_budget: 1,
      created_at: now,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  for (const candidate of listPatternCandidates(input.threadId)) {
    if (input.roomId && candidate.room_id !== input.roomId) continue;
    if (candidate.missing_evidence.length === 0 || candidate.confidence >= 0.85) continue;
    const needId = `clarification_need:${hashShort([
      input.threadId,
      candidate.room_id,
      candidate.candidate_id,
      candidate.missing_evidence,
    ])}`;
    if (dismissedNeedIds.has(needId)) continue;
    nextById.set(needId, {
      schema: HELIX_CLARIFICATION_NEED_SCHEMA,
      need_id: needId,
      thread_id: input.threadId,
      job_id: latestJob?.job_id ?? null,
      environment_id: null,
      source_family: sourceFamilyForJob(latestJob?.source_family ?? "minecraft_events"),
      trigger: "new_pattern_candidate",
      hypothesis_ids: [candidate.candidate_id],
      evidence_ids: uniqueStrings(candidate.supporting_evidence_refs),
      missing_evidence: uniqueStrings(candidate.missing_evidence).slice(0, 6),
      importance: candidate.confidence >= 0.6 ? "medium" : "low",
      question_budget: 1,
      created_at: now,
      assistant_answer: false,
      raw_content_included: false,
    });
  }
  const evidence = listSyntheticEvidence(input.threadId);
  if (evidence.length === 0 && jobs.some((job) => job.status === "active")) {
    const needId = `clarification_need:${hashShort([input.threadId, input.roomId ?? null, "user_goal_unknown"])}`;
    if (!dismissedNeedIds.has(needId)) {
      nextById.set(needId, {
        schema: HELIX_CLARIFICATION_NEED_SCHEMA,
        need_id: needId,
        thread_id: input.threadId,
        job_id: latestJob?.job_id ?? null,
        environment_id: null,
        source_family: sourceFamilyForJob(latestJob?.source_family),
        trigger: "user_goal_unknown",
        hypothesis_ids: [],
        evidence_ids: [],
        missing_evidence: ["The user's current intent for the active situation is not established."],
        importance: "medium",
        question_budget: 1,
        created_at: now,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
  }
  const next = Array.from(nextById.values()).slice(-100);
  needsByThread.set(input.threadId, next);
  return next;
}

export function listClarificationNeeds(input: {
  threadId: string;
  roomId?: string | null;
}): HelixClarificationNeed[] {
  return [...(needsByThread.get(input.threadId) ?? [])];
}

export function getClarificationNeed(threadId: string, needId: string): HelixClarificationNeed | null {
  return needsByThread.get(threadId)?.find((need) => need.need_id === needId) ?? null;
}

export function dismissClarificationNeed(needId: string): boolean {
  dismissedNeedIds.add(needId);
  for (const [threadId, needs] of needsByThread.entries()) {
    needsByThread.set(threadId, needs.filter((need) => need.need_id !== needId));
  }
  return true;
}

export function clearClarificationNeedsForTest(): void {
  needsByThread.clear();
  dismissedNeedIds.clear();
}
