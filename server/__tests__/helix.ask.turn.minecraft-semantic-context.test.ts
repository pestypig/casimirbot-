import express from "express";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import { __resetHelixThreadLedgerStore } from "../services/helix-thread/ledger";
import { clearCategorizationEventsForTest } from "../services/situation-room/categorization-bus";
import { clearSyntheticEvidenceForTest } from "../services/situation-room/synthetic-evidence-ledger";
import { resetSituationThreadBindings } from "../services/situation-room/thread-binding-store";
import { ingestWorldEvent, resetWorldEventIngestState } from "../services/situation-room/world-event-ingest";

const threadId = "helix-ask:desktop";

const readFixture = (name: string): HelixWorldEvent[] => {
  const filePath = path.resolve(process.cwd(), "fixtures/minecraft/world-sense", name);
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as HelixWorldEvent);
};

const replayFixture = async (name: string) => {
  for (const event of readFixture(name)) {
    await ingestWorldEvent(event, {
      appendToThread: true,
      threadId,
      turnId: "turn:semantic-context",
    });
  }
};

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

describe("Helix Ask Minecraft semantic context", () => {
  beforeEach(() => {
    __resetHelixThreadLedgerStore();
    resetWorldEventIngestState();
    resetSituationThreadBindings();
    clearCategorizationEventsForTest();
    clearSyntheticEvidenceForTest();
  });

  it("answers farm/use questions from compact semantic utility evidence", async () => {
    const app = await createApp();
    await replayFixture("chicken-egg-flow.jsonl");

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Is this a chicken farm and what are the chickens useful for in Minecraft?",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    expect(response.body.final_answer_source).toBe("artifact_synthesis");
    expect(String(response.body.answer)).toMatch(/Semantic reference/i);
    expect(String(response.body.answer)).toMatch(/egg-source farm/i);
    expect(String(response.body.answer)).toMatch(/Status: confirmed; confidence 0\.85/i);
    expect(String(response.body.answer)).toMatch(/plugin did not emit a gameplay meaning label/i);
    expect(response.body.situation_context_pack?.utility_hypotheses?.[0]?.assistant_answer).toBe(false);
    expect(response.body.situation_context_pack?.semantic_reference_hits?.[0]?.raw_reference_included).toBe(false);
    expect(JSON.stringify(response.body.situation_context_pack ?? {})).not.toMatch(/entity_cluster_sample.*entity_cluster_sample/);
  }, 20000);

  it("keeps open-field animals below farm interpretation", async () => {
    const app = await createApp();
    await replayFixture("random-animals-no-farm.jsonl");

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Is this chicken area a farm in Minecraft?",
        sessionId: threadId,
        debug: true,
      })
      .expect(200);

    expect(String(response.body.answer)).toMatch(/Chicken utility context|entity cluster/i);
    expect(String(response.body.answer)).toMatch(/confidence 0\.35/i);
    expect(String(response.body.answer)).toMatch(/Containment context is not established/i);
  }, 20000);
});
