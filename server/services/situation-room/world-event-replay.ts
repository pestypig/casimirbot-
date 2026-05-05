import type {
  SituationGoalHypothesis,
  SituationInterjectionProposal,
  SituationSalienceReceipt,
  SituationStateProjection,
} from "@shared/helix-situation-standby";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { HelixStandbyObservationBatchReceipt } from "@shared/helix-standby-observation-batch";
import {
  ingestWorldEventBatch,
  ingestWorldEvent,
  resetWorldEventIngestState,
  type WorldEventIngestResult,
} from "./world-event-ingest";

export type WorldEventReplayResult = {
  ok: true;
  schema: "helix.world_event_replay_response.v1";
  room_id?: string | null;
  results: WorldEventIngestResult[];
  projections: SituationStateProjection[];
  goal_hypotheses: SituationGoalHypothesis[];
  salience_receipts: SituationSalienceReceipt[];
  interjection_proposals: SituationInterjectionProposal[];
  batch_receipts?: HelixStandbyObservationBatchReceipt[];
};

export const replayWorldEvents = async (args: {
  roomId?: string | null;
  reset?: boolean;
  dryRun?: boolean;
  forceThreadId?: string | null;
  forceRoomId?: string | null;
  deterministicNow?: string | null;
  events: HelixWorldEvent[];
}): Promise<WorldEventReplayResult> => {
  if (args.reset !== false) {
    resetWorldEventIngestState();
  }
  const ordered = args.events
    .slice()
    .map((event: HelixWorldEvent): HelixWorldEvent =>
      args.forceRoomId || args.roomId ? { ...event, room_id: args.forceRoomId ?? args.roomId ?? event.room_id } : event,
    )
    .sort(
      (a: HelixWorldEvent, b: HelixWorldEvent) =>
        a.ts.localeCompare(b.ts) || a.event_type.localeCompare(b.event_type),
    );
  const batch = args.dryRun === false && args.forceThreadId
    ? await ingestWorldEventBatch(ordered, {
        threadId: args.forceThreadId ?? null,
        now: args.deterministicNow ? () => new Date(args.deterministicNow ?? "") : undefined,
      })
    : null;
  const results: WorldEventIngestResult[] = batch?.results ?? [];
  if (!batch) {
    for (const event of ordered) {
      results.push(await ingestWorldEvent(event, { appendToThread: false }));
    }
  }

  const projections = results
    .map((result: WorldEventIngestResult) => result.projection)
    .filter(
      (projection: SituationStateProjection | undefined): projection is SituationStateProjection =>
        Boolean(projection),
    );
  const goalsById = new Map<string, SituationGoalHypothesis>();
  for (const result of results) {
    for (const goal of result.goal_hypotheses ?? []) {
      goalsById.set(goal.hypothesis_id, goal);
    }
  }

  return {
    ok: true,
    schema: "helix.world_event_replay_response.v1",
    room_id: args.roomId ?? null,
    results,
    projections,
    goal_hypotheses: Array.from(goalsById.values()).sort(
      (a: SituationGoalHypothesis, b: SituationGoalHypothesis) =>
        a.hypothesis_id.localeCompare(b.hypothesis_id),
    ),
    salience_receipts: results
      .map((result: WorldEventIngestResult) => result.salience_receipt)
      .filter(
        (receipt: SituationSalienceReceipt | null | undefined): receipt is SituationSalienceReceipt =>
          Boolean(receipt),
      ),
    interjection_proposals: results
      .map((result: WorldEventIngestResult) => result.interjection_proposal)
      .filter(
        (
          proposal: SituationInterjectionProposal | null | undefined,
        ): proposal is SituationInterjectionProposal => Boolean(proposal),
      ),
    batch_receipts: batch?.batch_receipts ?? [],
  };
};
