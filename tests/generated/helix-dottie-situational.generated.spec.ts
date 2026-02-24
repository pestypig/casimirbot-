import { readFileSync } from "node:fs";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { missionBoardRouter } from "../../server/routes/mission-board";
import { resetVoiceRouteState, voiceRouter } from "../../server/routes/voice";

type Scenario = {
  id: string;
  intent: string;
  voice?: Record<string, unknown>;
  contextEvent?: { missionId: string; eventId: string; ts: string };
  ack?: { missionId: string; eventId: string; ackRefId: string; ts: string };
  expected: Record<string, unknown>;
};

const fixturePath = "artifacts/test-inputs/helix-dottie-situational-2026-02-24T18-42-10Z.json";
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as { scenarios: Scenario[] };

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mission-board", missionBoardRouter);
  app.use("/api/voice", voiceRouter);
  return app;
};

describe("helix dottie generated situational-awareness", () => {
  beforeEach(() => {
    process.env.TTS_BASE_URL = "";
    process.env.VOICE_PROXY_DRY_RUN = "1";
    resetVoiceRouteState();
  });

  it("validates deterministic scenarios from fixture", async () => {
    const app = buildApp();
    const observed: Record<string, unknown> = {};

    for (const scenario of fixture.scenarios) {
      if (scenario.contextEvent) {
        const res = await request(app)
          .post(`/api/mission-board/${scenario.contextEvent.missionId}/context-events`)
          .send({
            eventId: scenario.contextEvent.eventId,
            eventType: "action_required",
            classification: "action",
            text: `Seed ${scenario.id}`,
            ts: scenario.contextEvent.ts,
            tier: "tier1",
            sessionState: "active",
            evidenceRefs: ["docs/helix-ask-flow.md#L1"],
          });
        expect(res.status).toBe(200);
      }

      if (scenario.voice) {
        const res = await request(app).post("/api/voice/speak").send(scenario.voice);
        expect(res.status).toBe(200);
        const expectedSuppressed = scenario.expected.suppressed;
        if (expectedSuppressed === true) {
          expect(res.body.suppressed).toBe(true);
          expect(res.body.reason).toBe(scenario.expected.reason);
          observed[scenario.id] = { suppressed: res.body.suppressed, reason: res.body.reason };
        } else {
          expect(res.body.ok).toBe(true);
          expect(res.body.suppressed).toBeUndefined();
          observed[scenario.id] = { allowed: true };
        }
      }

      if (scenario.ack) {
        const ack = await request(app)
          .post(`/api/mission-board/${scenario.ack.missionId}/ack`)
          .send({
            eventId: scenario.ack.eventId,
            ackRefId: scenario.ack.ackRefId,
            actorId: "operator-generated",
            ts: scenario.ack.ts,
          });
        expect(ack.status).toBe(200);
        expect(ack.body.receipt.ackRefId).toBe(scenario.expected.ackRefId);
        expect(ack.body.metrics.trigger_to_debrief_closed_ms).toBe(scenario.expected.trigger_to_debrief_closed_ms);

        const events = await request(app)
          .get(`/api/mission-board/${scenario.ack.missionId}/events`)
          .query({ limit: 50 });
        expect(events.status).toBe(200);
        const debrief = events.body.events.find((event: { type: string }) => event.type === "debrief");
        expect(debrief.ackRefId).toBe(scenario.expected.ackRefId);
        expect(debrief.metrics.trigger_to_debrief_closed_ms).toBe(scenario.expected.trigger_to_debrief_closed_ms);
        observed[scenario.id] = {
          ackRefId: ack.body.receipt.ackRefId,
          trigger_to_debrief_closed_ms: ack.body.metrics.trigger_to_debrief_closed_ms,
        };
      }
    }

    expect(observed["S13-replay-consistency-1"]).toEqual(observed["S14-replay-consistency-2"]);
    expect(fixture.scenarios.length).toBeGreaterThanOrEqual(14);
  });
});
