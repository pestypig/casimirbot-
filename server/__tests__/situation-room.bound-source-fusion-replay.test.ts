import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  ensureLiveSituationRunForEnvironment,
  resetLiveSituationRunsForTest,
} from "../services/situation-room/live-situation-run-store";
import {
  listObservationJournalEntries,
  resetObservationJournalForTest,
} from "../services/situation-room/observation-journal-store";
import {
  listLiveFieldEvaluations,
  resetLiveFieldEvaluationsForTest,
} from "../services/situation-room/live-field-evaluation-store";
import { resetLiveFieldWorkerRunsForTest } from "../services/situation-room/live-field-worker-run-store";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";
import {
  listProcedureEpochLedger,
  resetProcedureEpochLedgerForTest,
} from "../services/situation-room/procedure-epoch-ledger-store";
import { resetProcedureEpochClosuresForTest } from "../services/situation-room/procedure-epoch-closure";
import { resetWorldEventIngestState } from "../services/situation-room/world-event-ingest";
import { resetSituationThreadBindings } from "../services/situation-room/thread-binding-store";
import {
  listSituationSourceBindings,
  resetSituationSourceBindingsForTest,
} from "../services/situation-room/situation-source-binding-store";
import { resetSourceBindingStatusLedgerForTest } from "../services/situation-room/source-binding-status-ledger";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const seedVisualRun = () => {
  const now = "2026-05-18T16:00:00.000Z";
  const { environment } = createLiveAnswerEnvironment({
    thread_id: "helix-ask:fusion",
    created_turn_id: "ask:fusion-seed",
    objective: "Fuse visual and Minehut world-event sources.",
    preset: "custom",
    source_ids: ["visual_source:fusion"],
    now,
  });
  const run = ensureLiveSituationRunForEnvironment({ environment, advanceEpoch: false, now });
  return { environment, run };
};

const minehutDamage = (suffix: string, ts: string): HelixWorldEvent => ({
  schema: "helix.world_event.v1",
  world_id: "minecraft:minehut",
  room_id: "room:minecraft-minehut",
  source_id: "source:minecraft-server",
  ts,
  actor_id: "player:datdampig",
  actor_label: "DatDamPig",
  event_type: "player_damage",
  location: { dimension: "minecraft:the_nether", x: 104, y: 64, z: -32 },
  health_delta: { current_health: 5, delta: -7 },
  text: `DatDamPig took damage near a blaze spawner ${suffix}.`,
  evidence_refs: [`world_event:${suffix}`],
  meta: { hostile_nearby: true, mob: "blaze" },
});

describe("bound source fusion and replay-window procedure runtime", () => {
  beforeEach(() => {
    resetLiveAnswerEnvironments();
    resetLiveSituationRunsForTest();
    resetObservationJournalForTest();
    resetLiveFieldEvaluationsForTest();
    resetLiveFieldWorkersForTest();
    resetLiveFieldWorkerRunsForTest();
    resetProcedureEpochLedgerForTest();
    resetProcedureEpochClosuresForTest();
    resetWorldEventIngestState();
    resetSituationThreadBindings();
    resetSituationSourceBindingsForTest();
    resetSourceBindingStatusLedgerForTest();
  });

  it("excludes old unbound Minehut events, fuses future bound events, and imports old events only by replay window", async () => {
    const app = await createApp();
    const { run } = seedVisualRun();

    const unbound = await request(app)
      .post("/api/agi/situation/world-event")
      .send(minehutDamage("old-unbound", "2026-05-18T16:00:05.000Z"))
      .expect(200);

    expect(unbound.body).toMatchObject({
      appended: false,
      source_binding_procedure: {
        schema: "helix.source_binding_epoch_bridge_receipt.v1",
        status: "observed_unbound",
        repair_candidate_created: true,
        field_evaluation_refs: [],
      },
    });
    expect(listLiveFieldEvaluations({ threadId: "helix-ask:fusion", fieldKey: "risk", includeExpired: true })).toHaveLength(0);
    expect(listObservationJournalEntries({ threadId: "helix-ask:fusion" })).toHaveLength(0);

    const attach = await request(app)
      .post("/api/agi/situation/source-binding/attach-source-to-active-run")
      .send({
        thread_id: "helix-ask:fusion",
        situation_run_id: run.situation_run_id,
        environment_id: run.environment_id,
        room_id: "room:minecraft-minehut",
        source_id: "source:minecraft-server",
        world_id: "minecraft:minehut",
        modality: "world_event",
      })
      .expect(200);

    expect(attach.body).toMatchObject({
      ok: true,
      situation_source_binding: {
        schema: "helix.situation_source_binding.v1",
        status: "bound",
        replay_policy: "future_only",
      },
    });
    const bindingId = attach.body.situation_source_binding.binding_id;
    expect(listSituationSourceBindings({ threadId: "helix-ask:fusion", sourceId: "source:minecraft-server", modality: "world_event" }).at(-1)).toMatchObject({
      binding_id: bindingId,
      replay_policy: "future_only",
    });

    const future = await request(app)
      .post("/api/agi/situation/world-event")
      .send(minehutDamage("future-bound", "2026-05-18T16:00:10.000Z"))
      .expect(200);

    expect(future.body).toMatchObject({
      appended: true,
      source_binding_procedure: {
        status: "bound",
        replay_status: "live",
        binding_id: bindingId,
      },
    });
    expect(future.body.source_binding_procedure.field_evaluation_refs.length).toBeGreaterThan(0);
    const liveRisk = listLiveFieldEvaluations({
      threadId: "helix-ask:fusion",
      fieldKey: "risk",
      includeExpired: true,
    });
    expect(liveRisk.at(-1)).toMatchObject({
      field_key: "risk",
      status: "supported",
      corroboration_state: expect.objectContaining({ world_event: "present" }),
    });
    expect(liveRisk.at(-1)?.evidence_refs.join(" ")).toContain("future-bound");
    expect(liveRisk.at(-1)?.evidence_refs.join(" ")).not.toContain("old-unbound");
    expect(listProcedureEpochLedger({ threadId: "helix-ask:fusion" }).some((entry) => entry.item_kind === "field_evaluation")).toBe(true);

    const replay = await request(app)
      .post(`/api/agi/situation/source-binding/${encodeURIComponent(bindingId)}/replay-window`)
      .send({
        start_ts: "2026-05-18T16:00:00.000Z",
        end_ts: "2026-05-18T16:00:06.000Z",
        max_events: 10,
        reason: "import the old unbound Minehut event for comparison",
      })
      .expect(200);

    expect(replay.body).toMatchObject({
      ok: true,
      action_id: "situation-room.replay_source_window_into_run",
      replayed_count: 1,
      raw_content_included: false,
    });
    expect(replay.body.bridge_receipts[0]).toMatchObject({
      replay_status: "replayed",
      source_set: {
        replayed_observation_refs: expect.any(Array),
      },
    });
    const replayedObservations = listObservationJournalEntries({ threadId: "helix-ask:fusion" })
      .filter((entry) => entry.replay_status === "replayed");
    expect(replayedObservations).toHaveLength(1);
    expect(replayedObservations[0]).toMatchObject({
      source_binding_id: bindingId,
      raw_content_included: false,
      assistant_answer: false,
    });
    expect(listProcedureEpochLedger({ threadId: "helix-ask:fusion" }).some((entry) =>
      /Replayed world-event observation/.test(entry.summary)
    )).toBe(true);
  }, 90_000);
});
