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

describe("helix ask E68 debug export endpoint", () => {
  it("returns a canonical active-turn debug export matching the completed turn", async () => {
    const app = createApp();
    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open Scientific Calculator",
        mode: "read",
        debug: true,
        sessionId: `e68-debug-export-${Date.now()}`,
      })
      .expect(200);

    const turnId = turn.body?.turn_id;
    expect(turnId).toBeTruthy();
    const debugExport = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`)
      .expect(200);

    expect(debugExport.body?.ok).toBe(true);
    expect(debugExport.body?.payload?.schema).toBe("helix.ask.debug_export.v1");
    expect(debugExport.body?.payload?.active_turn_id).toBe(turnId);
    expect(debugExport.body?.payload?.active_prompt).toBe("Open Scientific Calculator");
    expect(debugExport.body?.payload?.selected_final_answer).toBe(turn.body?.selected_final_answer);
    expect(debugExport.body?.payload?.resolved_turn_summary?.terminal_artifact_kind).toBe(turn.body?.terminal_artifact_kind);
    expect(debugExport.body?.payload?.payload_hash).toEqual(expect.any(String));
    expect(debugExport.body.payload.payload_hash.length).toBeGreaterThan(12);
    expect(Array.isArray(debugExport.body?.payload?.current_turn_artifact_ledger)).toBe(true);
    expect(debugExport.body?.payload).toHaveProperty("terminal_candidate_rejections");
    expect(debugExport.body?.payload).toHaveProperty("evidence_reentry_proof");
    expect(debugExport.body?.payload).toHaveProperty("terminal_authority_single_writer");
    expect(debugExport.body?.payload?.artifact_query_index).toMatchObject({
      schema: "helix.artifact_query_index.v1",
      turn_id: turnId,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(Array.isArray(debugExport.body?.payload?.artifact_query_index?.artifact_refs)).toBe(true);
    expect(Array.isArray(debugExport.body?.payload?.artifact_query_index?.queryable_artifact_keys)).toBe(true);
  }, 60000);

  it("returns a typed debug failure for missing turn ids", async () => {
    const app = createApp();
    const response = await request(app)
      .get("/api/agi/ask/turn/not-a-real-turn/debug-export")
      .expect(404);

    expect(response.body?.ok).toBe(false);
    expect(response.body?.terminal_error_code).toBe("debug_export_turn_not_found");
  });

  it("returns replay-safe reasoning battle stage beats for a completed turn", async () => {
    const app = createApp();
    const turn = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Open Scientific Calculator",
        mode: "read",
        debug: true,
        sessionId: `e68-battle-stage-${Date.now()}`,
      })
      .expect(200);

    const turnId = turn.body?.turn_id;
    expect(turnId).toBeTruthy();
    const response = await request(app)
      .get(`/api/agi/ask/turn/${encodeURIComponent(turnId)}/reasoning-battle-stage`)
      .expect(200);

    expect(response.body?.ok).toBe(true);
    expect(response.body?.schema).toBe("helix.reasoning_battle_stage_response.v1");
    expect(response.body?.battle_stage).toMatchObject({
      schema: "helix.reasoning_battle_stage.v1",
      turn_id: turnId,
      source: "debug_payload_cache",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(Array.isArray(response.body?.battle_stage?.beats)).toBe(true);
    expect(response.body.battle_stage.beats.length).toBeGreaterThan(0);
    expect(response.body.battle_stage.beats.length).toBeLessThanOrEqual(10);
    expect(response.body.battle_stage.beats.every((beat: any) => beat.raw_content_included === false)).toBe(true);
    const selectedFinalAnswer = typeof turn.body?.selected_final_answer === "string" ? turn.body.selected_final_answer : "";
    if (selectedFinalAnswer) {
      expect(JSON.stringify(response.body.battle_stage.beats)).not.toContain(selectedFinalAnswer);
    }
  }, 60000);
});
