import crypto from "node:crypto";
import {
  HELIX_CONTINUOUS_CATEGORIZATION_JOB_RECEIPT_SCHEMA,
  HELIX_CONTINUOUS_CATEGORIZATION_JOB_SCHEMA,
  type ContinuousCategorizationJob,
  type ContinuousCategorizationJobPolicy,
  type ContinuousCategorizationJobReceipt,
  type ContinuousCategorizationJobStatus,
  type ContinuousCategorizationSourceFamily,
} from "@shared/helix-continuous-categorization-job";

const jobsById = new Map<string, ContinuousCategorizationJob>();
const receiptsByJobId = new Map<string, ContinuousCategorizationJobReceipt[]>();

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value: unknown) => String(value ?? "").trim()).filter(Boolean)));

const defaultPolicy = (input?: Partial<ContinuousCategorizationJobPolicy>): ContinuousCategorizationJobPolicy => ({
  mode: input?.mode ?? "windowed",
  evidence_budget: input?.evidence_budget ?? "compact",
  surface_policy: input?.surface_policy ?? "danger_progress",
  archive_on_stop: input?.archive_on_stop ?? true,
  profile_archive_policy: input?.profile_archive_policy ?? "compact_summary_only",
});

const receipt = (input: {
  job: ContinuousCategorizationJob;
  action: ContinuousCategorizationJobReceipt["action"];
  ok?: boolean;
  summary: string;
  evidenceRefs?: string[];
  now?: string;
}): ContinuousCategorizationJobReceipt => {
  const ts = input.now ?? new Date().toISOString();
  const next: ContinuousCategorizationJobReceipt = {
    schema: HELIX_CONTINUOUS_CATEGORIZATION_JOB_RECEIPT_SCHEMA,
    receipt_id: `categorization_job_receipt:${hashShort([input.job.job_id, input.action, ts, input.summary], 18)}`,
    job_id: input.job.job_id,
    thread_id: input.job.thread_id,
    action: input.action,
    ok: input.ok !== false,
    status: input.job.status,
    summary: input.summary,
    evidence_refs: uniqueStrings(input.evidenceRefs ?? input.job.latest_evidence_refs),
    raw_logs_included: false,
    assistant_answer: false,
    ts,
  };
  const existing = receiptsByJobId.get(input.job.job_id) ?? [];
  receiptsByJobId.set(input.job.job_id, [...existing, next].slice(-200));
  return next;
};

export function startContinuousCategorizationJob(input: {
  threadId: string;
  profileId?: string | null;
  roomId?: string | null;
  sourceFamily: ContinuousCategorizationSourceFamily;
  sourceIds?: string[];
  worldId?: string | null;
  objective: string;
  policy?: Partial<ContinuousCategorizationJobPolicy>;
  now?: string;
}): { job: ContinuousCategorizationJob; receipt: ContinuousCategorizationJobReceipt } {
  const now = input.now ?? new Date().toISOString();
  const jobId = `categorization_job:${hashShort([
    input.threadId,
    input.roomId ?? null,
    input.sourceFamily,
    input.sourceIds ?? [],
    input.worldId ?? null,
    input.objective,
  ])}`;
  const existing = jobsById.get(jobId);
  if (existing && existing.status !== "stopped" && existing.status !== "archived") {
    const reused = {
      ...existing,
      status: "active" as const,
      updated_at: now,
    };
    jobsById.set(jobId, reused);
    return {
      job: reused,
      receipt: receipt({
        job: reused,
        action: "start",
        summary: `Reused active continuous categorization job for ${input.sourceFamily}.`,
        now,
      }),
    };
  }
  const job: ContinuousCategorizationJob = {
    schema: HELIX_CONTINUOUS_CATEGORIZATION_JOB_SCHEMA,
    job_id: jobId,
    thread_id: input.threadId,
    profile_id: input.profileId ?? null,
    room_id: input.roomId ?? null,
    source_family: input.sourceFamily,
    source_ids: uniqueStrings(input.sourceIds ?? []),
    world_id: input.worldId ?? null,
    objective: input.objective,
    status: "active",
    policy: defaultPolicy(input.policy),
    counters: {
      source_events_seen: 0,
      categorization_events: 0,
      synthetic_evidence: 0,
      utility_hypotheses: 0,
      pattern_candidates: 0,
    },
    latest_summary: null,
    latest_evidence_refs: [],
    last_event_ts: null,
    archive_id: null,
    raw_logs_included: false,
    assistant_answer: false,
    created_at: now,
    updated_at: now,
  };
  jobsById.set(job.job_id, job);
  return {
    job,
    receipt: receipt({
      job,
      action: "start",
      summary: `Started continuous categorization job for ${input.sourceFamily}.`,
      now,
    }),
  };
}

export function updateContinuousCategorizationJob(input: {
  jobId: string;
  status?: ContinuousCategorizationJobStatus;
  latestSummary?: string | null;
  evidenceRefs?: string[];
  countersDelta?: Partial<ContinuousCategorizationJob["counters"]>;
  lastEventTs?: string | null;
  archiveId?: string | null;
  now?: string;
}): ContinuousCategorizationJob | null {
  const existing = jobsById.get(input.jobId);
  if (!existing) return null;
  const counters = { ...existing.counters };
  for (const [key, value] of Object.entries(input.countersDelta ?? {}) as Array<[keyof ContinuousCategorizationJob["counters"], number]>) {
    counters[key] += value;
  }
  const next: ContinuousCategorizationJob = {
    ...existing,
    status: input.status ?? existing.status,
    counters,
    latest_summary: input.latestSummary ?? existing.latest_summary ?? null,
    latest_evidence_refs: input.evidenceRefs ? uniqueStrings(input.evidenceRefs).slice(-24) : existing.latest_evidence_refs,
    last_event_ts: input.lastEventTs ?? existing.last_event_ts ?? null,
    archive_id: input.archiveId ?? existing.archive_id ?? null,
    updated_at: input.now ?? new Date().toISOString(),
  };
  jobsById.set(next.job_id, next);
  return next;
}

export function setContinuousCategorizationJobStatus(input: {
  jobId: string;
  status: ContinuousCategorizationJobStatus;
  action: "pause" | "resume" | "stop" | "archive";
  archiveId?: string | null;
  now?: string;
}): { job: ContinuousCategorizationJob | null; receipt: ContinuousCategorizationJobReceipt | null } {
  const job = updateContinuousCategorizationJob({
    jobId: input.jobId,
    status: input.status,
    archiveId: input.archiveId ?? null,
    now: input.now,
  });
  if (!job) return { job: null, receipt: null };
  return {
    job,
    receipt: receipt({
      job,
      action: input.action,
      summary: `Continuous categorization job ${input.action} recorded.`,
      now: input.now,
    }),
  };
}

export function recordContinuousCategorizationJobReceipt(input: {
  job: ContinuousCategorizationJob;
  action: ContinuousCategorizationJobReceipt["action"];
  summary: string;
  evidenceRefs?: string[];
  now?: string;
}): ContinuousCategorizationJobReceipt {
  return receipt(input);
}

export function getContinuousCategorizationJob(jobId: string): ContinuousCategorizationJob | null {
  return jobsById.get(jobId) ?? null;
}

export function listContinuousCategorizationJobs(input: {
  threadId?: string | null;
  roomId?: string | null;
  status?: ContinuousCategorizationJobStatus | "any";
} = {}): ContinuousCategorizationJob[] {
  return Array.from(jobsById.values()).filter((job: ContinuousCategorizationJob) => {
    if (input.threadId && job.thread_id !== input.threadId) return false;
    if (input.roomId && job.room_id !== input.roomId) return false;
    if (input.status && input.status !== "any" && job.status !== input.status) return false;
    return true;
  });
}

export function listContinuousCategorizationJobReceipts(jobId: string): ContinuousCategorizationJobReceipt[] {
  return [...(receiptsByJobId.get(jobId) ?? [])];
}

export function clearContinuousCategorizationJobsForTest(): void {
  jobsById.clear();
  receiptsByJobId.clear();
}
