import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { missionBoardRouter } from "../server/routes/mission-board";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mission-board", missionBoardRouter);
  return app;
};

const uniqueMissionId = () => `mission-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

describe("mission board routes", () => {
  it("returns default snapshot for a new mission", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    const res = await request(app).get(`/api/mission-board/${missionId}`);

    expect(res.status).toBe(200);
    expect(res.body.snapshot).toMatchObject({
      missionId,
      phase: "observe",
      status: "active",
      unresolvedCritical: 0,
    });
  });

  it("records action events and exposes deterministic cursor pagination", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-b",
      type: "verify",
      requestedAt: "2026-02-22T00:00:02.000Z",
    });
    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-a",
      type: "retrieve",
      requestedAt: "2026-02-22T00:00:01.000Z",
    });
    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-c",
      type: "execute",
      requestedAt: "2026-02-22T00:00:03.000Z",
    });

    const page1 = await request(app).get(`/api/mission-board/${missionId}/events`).query({
      limit: 2,
      cursor: 0,
    });
    expect(page1.status).toBe(200);
    expect(page1.body.cursor).toBe(0);
    expect(page1.body.nextCursor).toBe(2);
    expect(page1.body.events.map((event: { eventId: string }) => event.eventId)).toEqual([
      "action-a",
      "action-b",
    ]);

    const page2 = await request(app).get(`/api/mission-board/${missionId}/events`).query({
      limit: 2,
      cursor: page1.body.nextCursor,
    });
    expect(page2.status).toBe(200);
    expect(page2.body.cursor).toBe(2);
    expect(page2.body.nextCursor).toBeNull();
    expect(page2.body.events.map((event: { eventId: string }) => event.eventId)).toEqual(["action-c"]);
  });

  it("surfaces critical escalation action in mission snapshot", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    const res = await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-escalate",
      type: "ESCALATE_TO_COMMAND",
      status: "accepted",
      requestedAt: "2026-02-22T00:10:00.000Z",
    });

    expect(res.status).toBe(200);
    expect(res.body.receipt.actionId).toBe("action-escalate");
    expect(res.body.snapshot.status).toBe("degraded");
    expect(res.body.snapshot.unresolvedCritical).toBe(1);
  });

  it("records acknowledgments as state_change events", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-ack-target",
      type: "verify",
      requestedAt: "2026-02-22T00:20:00.000Z",
    });

    const ack = await request(app).post(`/api/mission-board/${missionId}/ack`).send({
      eventId: "action-ack-target",
      actorId: "operator-1",
      note: "Acknowledged and proceeding",
      ts: "2026-02-22T00:20:05.000Z",
    });

    expect(ack.status).toBe(200);
    expect(ack.body.receipt).toMatchObject({
      missionId,
      eventId: "action-ack-target",
      actorId: "operator-1",
    });
    expect(ack.body.snapshot.status).toBe("active");

    const events = await request(app).get(`/api/mission-board/${missionId}/events`).query({ limit: 20 });
    expect(events.status).toBe(200);
    const ackEvent = (events.body.events as Array<{ text: string; type: string; evidenceRefs: string[] }>).find(
      (event) => event.text.includes("Acknowledged and proceeding"),
    );
    expect(ackEvent?.type).toBe("state_change");
    expect(ackEvent?.evidenceRefs).toContain("action-ack-target");
  });

  it("acknowledgment clears unresolved critical count for referenced critical event", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    const criticalAction = await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      actionId: "action-critical-target",
      type: "ESCALATE_TO_COMMAND",
      requestedAt: "2026-02-22T00:30:00.000Z",
    });
    expect(criticalAction.status).toBe(200);
    expect(criticalAction.body.snapshot.unresolvedCritical).toBe(1);
    expect(criticalAction.body.snapshot.status).toBe("degraded");

    const ack = await request(app).post(`/api/mission-board/${missionId}/ack`).send({
      eventId: "action-critical-target",
      actorId: "operator-2",
      ts: "2026-02-22T00:30:10.000Z",
    });
    expect(ack.status).toBe(200);
    expect(ack.body.snapshot.unresolvedCritical).toBe(0);
    expect(ack.body.snapshot.status).toBe("active");
  });

  it("meets lightweight snapshot/events latency budget", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    const snapshotStart = Date.now();
    const snapshot = await request(app).get(`/api/mission-board/${missionId}`);
    const snapshotLatencyMs = Date.now() - snapshotStart;

    const eventsStart = Date.now();
    const events = await request(app).get(`/api/mission-board/${missionId}/events`).query({ limit: 10 });
    const eventsLatencyMs = Date.now() - eventsStart;

    expect(snapshot.status).toBe(200);
    expect(events.status).toBe(200);
    expect(snapshotLatencyMs).toBeLessThan(250);
    expect(eventsLatencyMs).toBeLessThan(250);
  });

  it("returns deterministic invalid request envelope", async () => {
    const app = buildApp();
    const missionId = uniqueMissionId();

    const res = await request(app).post(`/api/mission-board/${missionId}/actions`).send({
      type: "unsupported-action",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("mission_board_invalid_request");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.details).toBeTruthy();
  });
});
