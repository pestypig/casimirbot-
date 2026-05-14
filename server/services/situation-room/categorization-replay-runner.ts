import crypto from "node:crypto";
import {
  HELIX_CATEGORIZATION_REPLAY_RESULT_SCHEMA,
  type HelixCategorizationReplayResult,
} from "@shared/helix-categorization-replay";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import { queryEventJournal } from "./event-journal-store";
import { ingestWorldEvent, resetWorldEventIngestState } from "./world-event-ingest";
import { listPatternCandidates } from "./pattern-candidate-ledger";

const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export async function replayCategorizationWindow(input: {
  threadId: string;
  roomId?: string | null;
  fromTs?: string | null;
  toTs?: string | null;
  eventTypes?: string[];
  maxEvents?: number;
}): Promise<HelixCategorizationReplayResult> {
  const replayId = `categorization_replay:${hashShort([input.threadId, input.roomId, input.fromTs, input.toTs, Date.now()], 16)}`;
  const query = queryEventJournal({
    query_id: `${replayId}:query`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    from_ts: input.fromTs ?? null,
    to_ts: input.toTs ?? null,
    event_types: input.eventTypes ?? [],
    include_raw_events: true,
    limit: input.maxEvents ?? 100,
  });
  const events = query.events
    .map((record) => record.raw_event)
    .filter((event: HelixWorldEvent | undefined): event is HelixWorldEvent => Boolean(event))
    .sort((left: HelixWorldEvent, right: HelixWorldEvent) =>
      left.ts.localeCompare(right.ts) || left.event_type.localeCompare(right.event_type),
    );
  const replayThreadId = `helix-replay:${hashShort([input.threadId, replayId], 12)}`;
  resetWorldEventIngestState({
    preserveEventJournal: true,
    preserveSemanticLedgers: true,
  });
  let categorizationCount = 0;
  let syntheticEvidenceCount = 0;
  let utilityHypothesisCount = 0;
  for (const event of events) {
    const result = await ingestWorldEvent(event, {
      appendToThread: true,
      threadId: replayThreadId,
      turnId: `${replayId}:turn`,
    });
    categorizationCount += result.categorization_events?.length ?? 0;
    syntheticEvidenceCount += result.synthetic_evidence?.length ?? 0;
    utilityHypothesisCount += result.game_utility_hypotheses?.length ?? 0;
  }
  const patternCandidateCount = listPatternCandidates(replayThreadId).length;
  return {
    schema: HELIX_CATEGORIZATION_REPLAY_RESULT_SCHEMA,
    replay_id: replayId,
    replay_thread_id: replayThreadId,
    source_thread_id: input.threadId,
    room_id: input.roomId ?? null,
    event_count: events.length,
    categorization_count: categorizationCount,
    synthetic_evidence_count: syntheticEvidenceCount,
    utility_hypothesis_count: utilityHypothesisCount,
    pattern_candidate_count: patternCandidateCount,
    result_summary: `Replayed ${events.length} events into ${categorizationCount} categorization records, ${syntheticEvidenceCount} synthetic evidence records, and ${patternCandidateCount} pattern candidates.`,
    raw_content_included: false,
    assistant_answer: false,
    created_at: new Date().toISOString(),
  };
}
