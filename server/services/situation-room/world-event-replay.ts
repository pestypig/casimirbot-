import type {
  SituationGoalHypothesis,
  SituationInterjectionProposal,
  SituationSalienceReceipt,
  SituationStateProjection,
} from "@shared/helix-situation-standby";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
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
};

export const replayWorldEvents = async (args: {
  roomId?: string | null;
  reset?: boolean;
  events: HelixWorldEvent[];
}): Promise<WorldEventReplayResult> => {
  if (args.reset !== false) {
    resetWorldEventIngestState();
  }
  const ordered = args.events
    .slice()
    .map((event: HelixWorldEvent): HelixWorldEvent =>
      args.roomId ? { ...event, room_id: args.roomId } : event,
    )
    .sort(
      (a: HelixWorldEvent, b: HelixWorldEvent) =>
        a.ts.localeCompare(b.ts) || a.event_type.localeCompare(b.event_type),
    );
  const results: WorldEventIngestResult[] = [];
  for (const event of ordered) {
    results.push(await ingestWorldEvent(event, { appendToThread: false }));
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
  };
};
