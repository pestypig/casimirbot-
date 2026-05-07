import { beforeEach, describe, expect, it } from "vitest";
import type { SituationEpisode } from "@shared/helix-situation-episode";
import {
  __resetHelixThreadLedgerStore,
  getHelixThreadLedgerEvents,
} from "../services/helix-thread/ledger";
import { appendVisibleStandbyReasoningTurn } from "../services/situation-room/standby-reasoning-trace";

const episode: SituationEpisode = {
  schema: "helix.situation_episode.v1",
  episode_id: "episode:risk",
  room_id: "room:minecraft",
  world_id: "minecraft:minehut",
  graph_id: null,
  actor_id: "player:datdampig",
  actor_label: "DatDamPig",
  episode_type: "combat_risk",
  from_ts: "2026-05-07T12:00:00.000Z",
  to_ts: "2026-05-07T12:00:05.000Z",
  event_ids: ["event:damage"],
  evidence_refs: ["mc:damage"],
  summary_seed: "DatDamPig entered danger at 4 health.",
};

describe("visible standby reasoning trace", () => {
  beforeEach(() => __resetHelixThreadLedgerStore());

  it("creates an auxiliary trace with visible observation, plan, and non-primary answer items", () => {
    const result = appendVisibleStandbyReasoningTurn({
      threadId: "helix-ask:desktop",
      workId: "standby_work:risk",
      episode,
      now: () => new Date("2026-05-07T12:00:06.000Z"),
    });

    expect(result.result).toMatchObject({
      schema: "helix.standby_reasoning_result.v1",
      decision: "text_callout",
    });
    const events = getHelixThreadLedgerEvents({ threadId: "helix-ask:desktop" });
    expect(events.some((entry) => entry.turn_kind === "auxiliary" && entry.meta?.visibility === "standby_trace")).toBe(
      true,
    );
    expect(events.some((entry) => entry.item_type === "toolObservation")).toBe(true);
    expect(events.some((entry) => entry.item_type === "plan")).toBe(true);
    expect(
      events.some(
        (entry) =>
          entry.item_type === "answer" &&
          entry.meta?.kind === "standby_reasoning_result" &&
          entry.meta?.primary_user_visible === false,
      ),
    ).toBe(true);
  });
});
