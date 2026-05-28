import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const grRefractionPrompt =
  'In general relativity, do light cones at each point in space time deal with refraction indexes of materials, and if e=hf as Penrose puts it "mass clock" does the super position of matter have impact on refraction of light and what does this mean for the expanding light cone at the points representing the matter in space and time geometry hyper surface?';

describe("helix ask public commentary stream", () => {
  it("projects natural public commentary before terminal output for model-only physics turns", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: grRefractionPrompt,
        mode: "read",
        sessionId: `public-commentary-${Date.now()}`,
        debug: true,
      })
      .expect(200);

    const events = Array.isArray(response.body?.turn_events) ? response.body.turn_events : [];
    const terminalIndex = events.findIndex((event: any) => event?.type === "terminal_answer");
    const commentaryIndex = events.findIndex((event: any) => event?.type === "public_commentary");
    expect(commentaryIndex).toBeGreaterThanOrEqual(0);
    expect(terminalIndex).toBeGreaterThan(commentaryIndex);

    const timeline = Array.isArray(response.body?.public_commentary_timeline)
      ? response.body.public_commentary_timeline
      : [];
    expect(timeline.length).toBeGreaterThan(0);
    expect(response.body?.debug?.public_commentary_timeline).toEqual(timeline);
    expect(timeline[0]).toMatchObject({
      schema: "helix.ask_public_commentary_event.v1",
      timing: "turn_start",
      assistant_answer: false,
      raw_reasoning_included: false,
    });
    expect(timeline[0].text).toMatch(/separating|splitting/i);
    expect(timeline[0].text).toMatch(/light cones/i);
    expect(timeline[0].text).toMatch(/refraction/i);
    expect(timeline[0].text.trim()).not.toMatch(/^[{[]/);
    expect(timeline.map((event: any) => event.text).join("\n")).not.toMatch(
      /turn_purpose|why_this_capability|expected_artifacts|observation_summary/i,
    );

    const transcriptText = (response.body?.turn_transcript_events ?? [])
      .map((event: any) => event?.text)
      .join("\n");
    expect(transcriptText).toContain(timeline[0].text);
    expect(response.body?.terminal_answer_authority ?? response.body?.terminal_authority).toBeTruthy();
  });
});
