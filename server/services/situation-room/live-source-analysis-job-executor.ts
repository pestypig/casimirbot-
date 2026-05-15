import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import {
  getLiveSourceAnalysisJob,
  getLiveSourceChunk,
  listLiveSourceAnalysisJobs,
  updateLiveSourceAnalysisJob,
} from "./live-source-chunk-buffer";
import { dispatchLiveSourceAnalysisJob } from "./live-source-analysis-job-dispatcher";
import { routeLiveSourceAnalysisOutput } from "./live-source-analysis-output-router";

const maxJobsPerRun = 4;

export type LiveSourceAnalysisExecution = {
  schema: "helix.live_source_analysis_execution.v1";
  ok: boolean;
  job: HelixLiveSourceAnalysisJob | null;
  output: ReturnType<typeof routeLiveSourceAnalysisOutput> | null;
  error?: string | null;
  next_required_action?: string | null;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

const execution = (input: Omit<LiveSourceAnalysisExecution, "schema" | "assistant_answer" | "raw_content_included" | "context_policy">): LiveSourceAnalysisExecution => ({
  schema: "helix.live_source_analysis_execution.v1",
  ...input,
  assistant_answer: false,
  raw_content_included: false,
  context_policy: "compact_context_pack_only",
});

export function runLiveSourceAnalysisJob(jobId: string): LiveSourceAnalysisExecution {
  const existing = getLiveSourceAnalysisJob(jobId);
  if (!existing) {
    return execution({
      ok: false,
      job: null,
      output: null,
      error: "analysis_job_not_found",
      next_required_action: "query_analysis_jobs",
    });
  }
  if (existing.status === "completed" || existing.status === "failed" || existing.status === "suppressed") {
    return execution({
      ok: true,
      job: existing,
      output: null,
      error: null,
      next_required_action: null,
    });
  }
  const chunk = getLiveSourceChunk(existing.chunk_id);
  if (!chunk) {
    const failed = updateLiveSourceAnalysisJob({
      jobId,
      status: "failed",
      outputRefs: ["capture_frame_now"],
      summary: "Analysis job could not find its source chunk; capture or resend the source chunk.",
    }) ?? existing;
    return execution({
      ok: false,
      job: failed,
      output: null,
      error: "source_chunk_not_found",
      next_required_action: "capture_frame_now",
    });
  }
  const running = updateLiveSourceAnalysisJob({
    jobId,
    status: "running",
    summary: "Live source analysis job started.",
  }) ?? existing;
  const result = dispatchLiveSourceAnalysisJob({ job: running, chunk });
  const completed = updateLiveSourceAnalysisJob({
    jobId,
    status: result.status,
    outputRefs: result.output_refs,
    summary: result.summary,
  }) ?? running;
  const routed = routeLiveSourceAnalysisOutput({
    job: completed,
    chunk,
    status: result.status,
    summary: result.summary,
    outputRefs: result.output_refs,
    lineValues: result.line_values,
    modelInvoked: result.model_invoked,
  });
  return execution({
    ok: result.status === "completed",
    job: completed,
    output: routed,
    error: result.status === "completed" ? null : result.summary,
    next_required_action: result.next_required_action ?? null,
  });
}

export function runDueLiveSourceAnalysisJobs(input: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
} = {}): LiveSourceAnalysisExecution[] {
  const due = listLiveSourceAnalysisJobs({
    threadId: input.threadId ?? null,
    sourceId: input.sourceId ?? null,
    status: "queued",
    limit: Math.min(input.limit ?? maxJobsPerRun, maxJobsPerRun),
  });
  return due.map((job: HelixLiveSourceAnalysisJob) => runLiveSourceAnalysisJob(job.job_id));
}
