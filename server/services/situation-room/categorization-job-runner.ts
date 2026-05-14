import type { HelixCategorizationEvent } from "@shared/helix-categorization-event";
import type { HelixSyntheticEvidence } from "@shared/helix-synthetic-evidence";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { GameUtilityHypothesis } from "@shared/helix-game-utility-hypothesis";
import type {
  ContinuousCategorizationJob,
  ContinuousCategorizationJobReceipt,
} from "@shared/helix-continuous-categorization-job";
import {
  listContinuousCategorizationJobs,
  recordContinuousCategorizationJobReceipt,
  updateContinuousCategorizationJob,
} from "./continuous-categorization-job-store";
import { listPatternCandidates } from "./pattern-candidate-ledger";

const sourceMatches = (job: ContinuousCategorizationJob, event: HelixWorldEvent): boolean => {
  if (job.status !== "active") return false;
  if (job.source_family === "minecraft_events" && !event.world_id.startsWith("minecraft:")) return false;
  if (job.room_id && job.room_id !== event.room_id) return false;
  if (job.world_id && job.world_id !== event.world_id) return false;
  if (job.source_ids.length > 0 && event.source_id && !job.source_ids.includes(event.source_id)) return false;
  return true;
};

export function processWorldEventForCategorizationJobs(input: {
  event: HelixWorldEvent;
  threadId?: string | null;
  categorizationEvents: HelixCategorizationEvent[];
  syntheticEvidence: HelixSyntheticEvidence[];
  utilityHypotheses: GameUtilityHypothesis[];
}): ContinuousCategorizationJobReceipt[] {
  const jobs = listContinuousCategorizationJobs({
    threadId: input.threadId ?? undefined,
    roomId: input.event.room_id,
    status: "active",
  }).filter((job: ContinuousCategorizationJob) => sourceMatches(job, input.event));
  const receipts: ContinuousCategorizationJobReceipt[] = [];
  for (const job of jobs) {
    const patternCandidateCount = listPatternCandidates(job.thread_id).length;
    const evidenceRefs = [
      ...input.event.evidence_refs,
      ...input.categorizationEvents.flatMap((event: HelixCategorizationEvent) => event.evidence_refs),
      ...input.syntheticEvidence.map((evidence: HelixSyntheticEvidence) => evidence.evidence_id),
      ...input.utilityHypotheses.map((hypothesis: GameUtilityHypothesis) => hypothesis.hypothesis_id),
    ];
    const updated = updateContinuousCategorizationJob({
      jobId: job.job_id,
      latestSummary: `${input.event.event_type} processed: ${input.categorizationEvents.length} categories, ${input.syntheticEvidence.length} evidence records, ${input.utilityHypotheses.length} utility hypotheses.`,
      evidenceRefs,
      lastEventTs: input.event.ts,
      countersDelta: {
        source_events_seen: 1,
        categorization_events: input.categorizationEvents.length,
        synthetic_evidence: input.syntheticEvidence.length,
        utility_hypotheses: input.utilityHypotheses.length,
        pattern_candidates: Math.max(0, patternCandidateCount - job.counters.pattern_candidates),
      },
      now: input.event.ts,
    });
    if (!updated) continue;
    receipts.push(recordContinuousCategorizationJobReceipt({
      job: updated,
      action: "process_event",
      summary: updated.latest_summary ?? "Processed source event for categorization job.",
      evidenceRefs,
      now: input.event.ts,
    }));
  }
  return receipts;
}
