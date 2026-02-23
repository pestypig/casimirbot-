import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_DB_URL = process.env.DATABASE_URL;
const ORIGINAL_STORE = process.env.MISSION_BOARD_STORE;
const ORIGINAL_USE_INMEM = process.env.USE_INMEM_MISSION_BOARD_STORE;

const missionId = "mission-persistence-1";

const resetDb = async (): Promise<void> => {
  const { resetDbClient } = await import("../server/db/client");
  await resetDbClient();
};

const buildApp = async () => {
  const { missionBoardRouter } = await import("../server/routes/mission-board");
  const app = express();
  app.use(express.json());
  app.use("/api/mission-board", missionBoardRouter);
  return app;
};

describe("mission board persistence", () => {
  beforeEach(async () => {
    await resetDb();
    process.env.DATABASE_URL = "pg-mem://mission-board-persistence";
    process.env.MISSION_BOARD_STORE = "db";
    delete process.env.USE_INMEM_MISSION_BOARD_STORE;
    vi.resetModules();
  });

  afterEach(async () => {
    process.env.DATABASE_URL = ORIGINAL_DB_URL;
    process.env.MISSION_BOARD_STORE = ORIGINAL_STORE;
    process.env.USE_INMEM_MISSION_BOARD_STORE = ORIGINAL_USE_INMEM;
    vi.resetModules();
    await resetDb();
  });

  it("writes actions and acknowledgments to mission_board_events table", async () => {
    const app = await buildApp();

    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "persist-action-1",
      type: "ESCALATE_TO_COMMAND",
      requestedAt: "2026-02-22T03:00:00.000Z",
    });
    await request(app).post(`/api/mission-board/${missionId}/ack`).send({
      eventId: "persist-action-1",
      actorId: "operator-persist",
      ts: "2026-02-22T03:00:05.000Z",
    });

    const { ensureDatabase, getPool } = await import("../server/db/client");
    await ensureDatabase();
    const pool = getPool();
    const { rows } = await pool.query<{
      id: string;
      mission_id: string;
      type: string;
      classification: string;
    }>(
      `SELECT id, mission_id, type, classification
       FROM mission_board_events
       WHERE mission_id = $1
       ORDER BY event_ts ASC, id ASC`,
      [missionId],
    );

    expect(rows.map((row) => row.id)).toEqual([
      "persist-action-1",
      `ack:persist-action-1:${Date.parse("2026-02-22T03:00:05.000Z")}`,
    ]);
    expect(rows.map((row) => row.type)).toEqual(["action_required", "state_change"]);
    expect(rows.map((row) => row.classification)).toEqual(["critical", "info"]);
    expect(new Set(rows.map((row) => row.mission_id))).toEqual(new Set([missionId]));
  });

  it("replays snapshot from persisted events after store reset", async () => {
    const app = await buildApp();

    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "persist-action-2",
      type: "ESCALATE_TO_COMMAND",
      requestedAt: "2026-02-22T03:10:00.000Z",
    });

    const { __resetMissionBoardStoreForTest } = await import(
      "../server/services/mission-overwatch/mission-board-store"
    );
    __resetMissionBoardStoreForTest();

    const replaySnapshot = await request(app).get(`/api/mission-board/${missionId}`);
    expect(replaySnapshot.status).toBe(200);
    expect(replaySnapshot.body.snapshot).toMatchObject({
      missionId,
      unresolvedCritical: 1,
      status: "degraded",
    });

    const replayEvents = await request(app)
      .get(`/api/mission-board/${missionId}/events`)
      .query({ limit: 10 });
    expect(replayEvents.status).toBe(200);
    expect(replayEvents.body.events).toHaveLength(1);
    expect(replayEvents.body.events[0]).toMatchObject({
      eventId: "persist-action-2",
      type: "action_required",
      classification: "critical",
    });
  });
});
