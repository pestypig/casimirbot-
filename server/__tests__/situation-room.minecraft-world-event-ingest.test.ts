import express from "express";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  __resetHelixThreadLedgerStore,
  getHelixThreadLedgerEvents,
} from "../services/helix-thread/ledger";
import {
  ingestWorldEvent,
  resetWorldEventIngestState,
} from "../services/situation-room/world-event-ingest";
import { resetSituationThreadBindings } from "../services/situation-room/thread-binding-store";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const readFixture = (name: string): HelixWorldEvent[] => {
  const filePath = path.resolve(process.cwd(), "fixtures/minecraft", name);
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as HelixWorldEvent);
};

describe("Minecraft world-event ingest", () => {
  beforeEach(() => {
    delete process.env.HELIX_WORLD_EVENT_REQUIRE_TOKEN;
    delete process.env.HELIX_WORLD_EVENT_DEV_TOKEN;
    delete process.env.HELIX_WORLD_EVENT_MAX_BATCH;
    __resetHelixThreadLedgerStore();
    resetWorldEventIngestState();
    resetSituationThreadBindings();
  });

  it("normalizes a valid world event into a minecraft_event signal", async () => {
    const [event] = readFixture("nether-low-health.jsonl");
    const result = await ingestWorldEvent(event, { appendToThread: false });

    expect(result).toMatchObject({
      ok: true,
      appended: false,
      reason: "no_thread_context",
      signal: {
        source: "minecraft_event",
        event_type: "player_damage",
        actor: "Dan",
      },
    });
    expect(result.signal_id).toContain("world-event:paper:local:player_damage");
  });

  it("returns a safe no-thread response when thread context is absent", async () => {
    const app = await createApp();
    const [event] = readFixture("nether-low-health.jsonl");

    const response = await request(app)
      .post("/api/agi/situation/world-event")
      .send(event)
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      appended: false,
      reason: "no_thread_context",
      schema: "helix.world_event_ingest_response.v1",
    });
  }, 15000);

  it("emits risk salience for low health near danger", async () => {
    const [event] = readFixture("nether-low-health.jsonl");
    const result = await ingestWorldEvent(event, { appendToThread: false });

    expect(result.salience_receipt).toMatchObject({
      reason: "risk_detected",
      priority: "warn",
      should_notify_helix: true,
      should_speak: false,
    });
  });

  it("emits goal progress when an objective confirms item acquisition", async () => {
    const events = readFixture("blaze-rod-goal-progress.jsonl");
    let result = await ingestWorldEvent(events[0], { appendToThread: false });
    result = await ingestWorldEvent(events[1], { appendToThread: false });

    expect(result.salience_receipt).toMatchObject({
      reason: "goal_progress",
      priority: "info",
    });
    expect(result.goal_hypotheses?.some((goal) => goal.goal_label === "collect blaze rods")).toBe(
      true,
    );
  });

  it("emits goal-blocked salience for an explicit blocked objective", async () => {
    const events = readFixture("goal-blocked-looping.jsonl");
    let result = await ingestWorldEvent(events[0], { appendToThread: false });
    result = await ingestWorldEvent(events[1], { appendToThread: false });
    result = await ingestWorldEvent(events[2], { appendToThread: false });

    expect(result.salience_receipt).toMatchObject({
      reason: "goal_blocked",
      priority: "action",
    });
  });

  it("emits source health salience on bridge disconnect", async () => {
    const [event] = readFixture("source-health-disconnect.jsonl");
    const result = await ingestWorldEvent(event, { appendToThread: false });

    expect(result.salience_receipt).toMatchObject({
      reason: "source_health",
      priority: "warn",
    });
  });

  it("does not emit salience for quiet routine events", async () => {
    const [event] = readFixture("quiet-noop.jsonl");
    const result = await ingestWorldEvent(event, { appendToThread: false });

    expect(result.salience_receipt).toBeNull();
    expect(result.salience_receipt_id).toBeNull();
  });

  it("records detected Minecraft source ids for binding diagnostics", async () => {
    const app = await createApp();
    const [event] = readFixture("nether-low-health.jsonl");

    await request(app).post("/api/agi/situation/world-event").send(event).expect(200);
    const response = await request(app).get("/api/agi/situation/world-event/sources").expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      schema: "helix.world_event_sources.v1",
      sources: [
        {
          room_id: event.room_id,
          source_id: event.source_id,
          world_id: event.world_id,
          latest_event_type: event.event_type,
          event_count: 1,
        },
      ],
    });
  }, 15000);

  it("treats routine location samples as projection-only by default", async () => {
    const event: HelixWorldEvent = {
      schema: "helix.world_event.v1",
      world_id: "minecraft:minehut",
      room_id: "room:minecraft-minehut",
      source_id: "source:minecraft-server",
      ts: "2026-05-05T07:30:00.000Z",
      actor_id: "player:datdampig",
      actor_label: "DatDamPig",
      event_type: "player_location_sample",
      location: { dimension: "minecraft:overworld", x: 280, y: 66, z: -405 },
      evidence_refs: ["minecraft:minecraft:minehut:event:location"],
      meta: {},
    };

    const result = await ingestWorldEvent(event, { appendToThread: false });

    expect(result.salience_receipt).toBeNull();
    expect(result.debug).toMatchObject({
      append_reason: "projection_only",
      salience_class: "projection_only",
    });
  });

  it("preserves timestamp ordering through the batch endpoint", async () => {
    const app = await createApp();
    const events = [
      readFixture("source-health-disconnect.jsonl")[0],
      readFixture("nether-low-health.jsonl")[0],
    ];

    const response = await request(app)
      .post("/api/agi/situation/world-event/batch")
      .send({ events })
      .expect(200);

    expect(response.body.results.map((result: { event_type: string }) => result.event_type)).toEqual([
      "player_damage",
      "source_disconnected",
    ]);
  }, 15000);

  it("returns deterministic replay results across repeated runs", async () => {
    const app = await createApp();
    const events = readFixture("blaze-rod-goal-progress.jsonl");

    const first = await request(app)
      .post("/api/agi/situation/world-event/replay")
      .send({ reset: true, events })
      .expect(200);
    const second = await request(app)
      .post("/api/agi/situation/world-event/replay")
      .send({ reset: true, events })
      .expect(200);

    expect(second.body).toEqual(first.body);
  }, 15000);

  it("returns deterministic 400 for invalid world event schema", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/situation/world-event")
      .send({ schema: "wrong" })
      .expect(400);

    expect(response.body).toMatchObject({
      ok: false,
      error: "invalid_world_event",
    });
  }, 15000);

  it("requires a dev bearer token when configured", async () => {
    process.env.HELIX_WORLD_EVENT_REQUIRE_TOKEN = "1";
    process.env.HELIX_WORLD_EVENT_DEV_TOKEN = "dev-local-token";
    const app = await createApp();

    await request(app).get("/api/agi/situation/world-event/health").expect(401);
    const response = await request(app)
      .get("/api/agi/situation/world-event/health")
      .set("Authorization", "Bearer dev-local-token")
      .expect(200);
    expect(response.body).toMatchObject({
      ok: true,
      service: "helix-world-event-ingest",
    });
  }, 15000);

  it("appends a toolObservation item when thread context is present", async () => {
    const app = await createApp();
    const [event] = readFixture("nether-low-health.jsonl");

    const response = await request(app)
      .post("/api/agi/situation/world-event?thread_id=thread:mc&turn_id=turn:mc")
      .send(event)
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      appended: true,
      thread_id: "thread:mc",
      turn_id: "turn:mc",
    });
    const events = getHelixThreadLedgerEvents({ threadId: "thread:mc" });
    expect(events.some((entry) => entry.observation_ref?.schema === "helix.standby_thread_observation.v1")).toBe(
      true,
    );
    const observation = events.find(
      (entry) =>
        entry.observation_ref?.schema === "helix.standby_thread_observation.v1" &&
        Array.isArray(entry.observation_ref.semantic_events),
    )
      ?.observation_ref as
      | {
          semantic_events?: Array<{ schema: string; tags: string[] }>;
          narration_receipts?: Array<{ schema: string; text: string }>;
          predictions?: Array<{ schema: string; predicted_goal: string }>;
          interjection_decision?: string;
        }
      | undefined;
    expect(observation?.semantic_events?.[0]).toMatchObject({
      schema: "helix.situation_semantic_event.v1",
      tags: expect.arrayContaining(["risk"]),
    });
    expect(observation?.narration_receipts?.[0]).toMatchObject({
      schema: "helix.situation_narration_receipt.v1",
    });
    expect(observation?.predictions?.[0]).toMatchObject({
      schema: "helix.situation_prediction.v1",
      predicted_goal: "survive immediate danger",
    });
    expect(observation?.interjection_decision).toBe("text_callout");
    expect(events.some((entry) => entry.item_type === "answer")).toBe(false);
  }, 15000);

  it("reports binding mismatch when an existing source binding uses different plugin ids", async () => {
    const app = await createApp();
    const [event] = readFixture("nether-low-health.jsonl");

    await request(app)
      .post("/api/agi/situation/thread-binding")
      .send({
        room_id: event.room_id,
        source_id: "source:local-ui-generated",
        world_id: "minecraft:local",
        thread_id: "thread:mismatch",
        mode: "standby_receipts",
        append_policy: "salient_only",
      })
      .expect(200);

    const response = await request(app).post("/api/agi/situation/world-event").send(event).expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      appended: false,
      reason: "binding_mismatch",
      debug: {
        append_reason: "binding_mismatch",
        salience_class: "salience_candidate",
      },
    });
    expect(getHelixThreadLedgerEvents({ threadId: "thread:mismatch" })).toHaveLength(0);
  }, 15000);
});
