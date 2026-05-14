import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { planLiveLineToolRequest } from "../services/helix-ask/live-line-tool-request-planner";
import { createLiveAnswerEnvironment, resetLiveAnswerEnvironments } from "../services/situation-room/live-answer-environment-store";
import { clearLiveLineToolRequestStoreForTest } from "../services/situation-room/live-line-tool-request-store";
import { ingestWorldEvent, resetWorldEventIngestState } from "../services/situation-room/world-event-ingest";
import { __resetHelixThreadLedgerStore } from "../services/helix-thread/ledger";

const threadId = "helix-ask:desktop";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

describe("live line tool request run route", () => {
  beforeEach(() => {
    __resetHelixThreadLedgerStore();
    resetWorldEventIngestState();
    resetLiveAnswerEnvironments();
    clearLiveLineToolRequestStoreForTest();
  });

  it("plans executable checks from the active live answer environment", async () => {
    const app = await createApp();
    const { environment } = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:line-check-plan-route",
      objective: "Minecraft Cortana test monitor",
      room_id: "room:minecraft-minehut",
      source_ids: ["source:minecraft-server"],
      preset: "minecraft_run_monitor",
      mode: "active_companion",
    });

    const response = await request(app)
      .post("/api/agi/situation/live-line-tool-requests/plan")
      .send({
        thread_id: threadId,
        environment_id: environment.environment_id,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      thread_id: threadId,
      environment_id: environment.environment_id,
      assistant_answer: false,
      raw_logs_included: false,
    });
    expect(response.body.request_count).toBeGreaterThan(0);
    expect(response.body.requests[0]).toMatchObject({
      thread_id: threadId,
      assistant_answer: false,
      raw_content_included: false,
      status: "proposed",
    });
  }, 10000);

  it("runs a Minecraft event-window check and returns receipt-backed evaluation", async () => {
    const app = await createApp();
    await ingestWorldEvent({
      schema: "helix.world_event.v1",
      world_id: "minecraft:minehut",
      room_id: "room:minecraft-minehut",
      source_id: "source:minecraft-server",
      ts: "2026-05-14T20:00:00.000Z",
      actor_id: "minecraft:player:datdampig",
      actor_label: "DatDamPig",
      event_type: "hostile_nearby",
      location: { dimension: "minecraft:overworld", x: 1, y: 64, z: 1 },
      evidence_refs: ["mc:line-check:hostile:1"],
      meta: { entity_type: "minecraft:zombie", hostile_nearby: true },
    }, {
      appendToThread: true,
      threadId,
      turnId: "turn:line-check-route",
    });

    const planned = planLiveLineToolRequest({
      threadId,
      environmentId: "live_answer:test",
      line: {
        key: "risk",
        label: "Risk",
        value: "DatDamPig has a nearby Minecraft threat.",
        evidence_refs: ["mc:line-check:hostile:1"],
      },
    });

    const response = await request(app)
      .post("/api/agi/situation/live-line-tool-request/run")
      .send({
        thread_id: threadId,
        request_id: planned?.request_id,
        room_id: "room:minecraft-minehut",
        source_id: "source:minecraft-server",
        world_id: "minecraft:minehut",
      })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.dynamic_tool_call).toMatchObject({
      tool_id: "minecraft.query_event_window",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.receipt).toMatchObject({
      requested_tool: "minecraft.query_event_window",
      ok: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.evaluation).toMatchObject({
      supports_line: "supports",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(response.body.evaluation.confidence_delta).toBeGreaterThan(0);
    expect(response.body.receipt.observation.raw_content_included).toBe(false);
  });
});
