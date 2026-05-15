import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { resetVisualSnapshotStoreForTest } from "../services/situation-room/visual-snapshot-store";
import {
  clearInterpretedEventLogForTest,
  listInterpretedEvents,
} from "../services/situation-room/interpreted-event-log-store";

const threadId = "helix-ask:desktop";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

describe("visual snapshot source routes", () => {
  beforeEach(() => {
    resetVisualSnapshotStoreForTest();
    clearInterpretedEventLogForTest();
  });

  it("starts a permission-bound visual source as a receipt, not an answer", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/situation/visual-source/start")
      .send({
        thread_id: threadId,
        room_id: "room:minecraft-minehut",
        source_id: "source:visual:minecraft-window",
        source_family: "screen_capture",
        source_surface: "minecraft_client_window",
        capture_mode: "manual",
        raw_image_storage_policy: "ephemeral",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      assistant_answer: false,
      raw_image_included: false,
      context_policy: "compact_context_pack_only",
      source: {
        schema: "helix.visual_snapshot_source.v1",
        thread_id: threadId,
        status: "active",
        source_surface: "minecraft_client_window",
        raw_image_storage_policy: "ephemeral",
        assistant_answer: false,
        raw_image_included: false,
      },
    });
  }, 15000);

  it("records frame metadata without exposing raw image bytes in public context", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/agi/situation/visual-source/start")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        source_surface: "minecraft_client_window",
      })
      .expect(200);

    const response = await request(app)
      .post("/api/agi/situation/visual-frame")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        image_ref: "ephemeral://frame/1",
        image_sha256: "a".repeat(64),
        mime_type: "image/png",
        related_event_refs: ["minecraft:event:slab-place"],
        player_position: {
          world_id: "minecraft:minehut",
          x: 10,
          y: 64,
          z: -5,
          yaw: 90,
          pitch: 10,
        },
      })
      .expect(200);

    expect(response.body.frame).toMatchObject({
      schema: "helix.visual_frame_record.v1",
      thread_id: threadId,
      source_id: "source:visual:minecraft-window",
      raw_image_included: false,
      assistant_answer: false,
      context_policy: "compact_context_pack_only",
    });
    expect(response.body.source_event).toMatchObject({
      item_type: "toolObservation",
      assistant_answer: false,
      raw_image_included: false,
    });
    expect(JSON.stringify(response.body)).not.toContain("data:image");
  }, 10000);

  it("activates permission-bound capture only after explicit permission grant", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/agi/situation/visual-source/start")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        source_surface: "minecraft_client_window",
        status: "permission_required",
      })
      .expect(200);

    const grantResponse = await request(app)
      .post("/api/agi/situation/visual-source/permission-granted")
      .send({
        source_id: "source:visual:minecraft-window",
        client_stream_confirmed: true,
      })
      .expect(200);

    expect(grantResponse.body).toMatchObject({
      ok: true,
      assistant_answer: false,
      raw_image_included: false,
      source: {
        source_id: "source:visual:minecraft-window",
        status: "active",
        assistant_answer: false,
        raw_image_included: false,
      },
    });
  }, 10000);

  it("captures a frame through the visual source handoff route as a tool observation", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/agi/situation/visual-source/start")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        source_surface: "minecraft_client_window",
        status: "permission_required",
      })
      .expect(200);
    await request(app)
      .post("/api/agi/situation/visual-source/permission-granted")
      .send({ source_id: "source:visual:minecraft-window", client_stream_confirmed: true })
      .expect(200);

    const response = await request(app)
      .post("/api/agi/situation/visual-source/capture-frame")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        image_ref: "ephemeral://frame/capture-now",
        image_sha256: "b".repeat(64),
        mime_type: "image/png",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      schema: "helix.visual_frame_capture_response.v1",
      source_event: {
        item_type: "toolObservation",
        source_family: "visual_snapshot",
        assistant_answer: false,
        raw_image_included: false,
      },
      assistant_answer: false,
      raw_image_included: false,
    });
  }, 10000);

  it("accepts an inline image for analysis while keeping raw bytes out of the response", async () => {
    const previousVisionBase = process.env.VISION_HTTP_BASE;
    const previousOpenAiKey = process.env.OPENAI_API_KEY;
    delete process.env.VISION_HTTP_BASE;
    delete process.env.OPENAI_API_KEY;
    const app = await createApp();

    let response: any;
    try {
      response = await request(app)
        .post("/api/agi/situation/visual-frame/analyze")
        .send({
          thread_id: threadId,
          source_id: "source:helix-ask-image-upload",
          image_base64:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
          prompt: "Describe the image for a Helix Ask test.",
        })
        .expect(200);
    } finally {
      if (previousVisionBase === undefined) delete process.env.VISION_HTTP_BASE;
      else process.env.VISION_HTTP_BASE = previousVisionBase;
      if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousOpenAiKey;
    }

    expect(response.body).toMatchObject({
      ok: true,
      assistant_answer: false,
      raw_image_included: false,
      context_policy: "compact_context_pack_only",
      evidence: {
        schema: "helix.visual_frame_evidence.v1",
        thread_id: threadId,
        source_id: "source:helix-ask-image-upload",
        raw_image_included: false,
        assistant_answer: false,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("iVBORw0KGgo");
    expect(JSON.stringify(response.body)).not.toContain("data:image");
  }, 10000);

  it("creates visual frame evidence and visual-event alignment as non-answer validation", async () => {
    const app = await createApp();
    await request(app)
      .post("/api/agi/situation/visual-source/start")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        source_surface: "minecraft_client_window",
      })
      .expect(200);
    const frameResponse = await request(app)
      .post("/api/agi/situation/visual-frame")
      .send({
        thread_id: threadId,
        source_id: "source:visual:minecraft-window",
        image_ref: "ephemeral://frame/farm",
        related_event_refs: ["minecraft:event:slab-place"],
      })
      .expect(200);

    const analysisResponse = await request(app)
      .post("/api/agi/situation/visual-frame/analyze")
      .send({
        thread_id: threadId,
        frame_id: frameResponse.body.frame.frame_id,
        image_model: "test-vision-model",
        summary: "The player view shows wheat rows, chickens, and slab blocks near a farm boundary.",
        detected_objects: ["wheat crops", "chickens", "cobblestone slabs"],
        detected_scene_relations: ["slabs appear around the crop boundary"],
        uncertainty: ["vertical relation between wheat and chickens is not fully proven"],
        supports_claims: [
          {
            claim: "decorating or editing a farm area",
            support_status: "partial",
            confidence: 0.71,
          },
        ],
      })
      .expect(200);

    expect(analysisResponse.body.evidence).toMatchObject({
      schema: "helix.visual_frame_evidence.v1",
      model_invoked: true,
      summary: "The player view shows wheat rows, chickens, and slab blocks near a farm boundary.",
      raw_image_included: false,
      assistant_answer: false,
      context_policy: "compact_context_pack_only",
    });
    expect(analysisResponse.body.validation).toMatchObject({
      kind: "visual_frame_evidence",
      model_invoked: true,
      assistant_answer: false,
      raw_image_included: false,
    });

    const alignmentResponse = await request(app)
      .post("/api/agi/situation/visual-frame/align-with-events")
      .send({
        thread_id: threadId,
        frame_ids: [frameResponse.body.frame.frame_id],
        event_refs: ["minecraft:event:slab-place"],
        place_id: "minecraft_place:farm_area",
        summary: "Visual wheat/chicken/slab evidence partially supports a farm decoration hypothesis.",
        confidence: 0.7,
        missing_evidence: ["query local entity/crop/container context near the player"],
      })
      .expect(200);

    expect(alignmentResponse.body.alignment).toMatchObject({
      schema: "helix.visual_event_alignment.v1",
      thread_id: threadId,
      assistant_answer: false,
      raw_image_included: false,
      context_policy: "compact_context_pack_only",
    });
    expect(alignmentResponse.body.synthetic_evidence).toMatchObject({
      kind: "visual_event_alignment",
      assistant_answer: false,
      raw_image_included: false,
    });
    expect(alignmentResponse.body.interpreted_event).toMatchObject({
      kind: "visual_event_alignment",
      source_family: "visual_snapshot",
      assistant_answer: false,
      raw_logs_included: false,
      context_policy: "compact_context_pack_only",
    });
    expect(listInterpretedEvents({ threadId, limit: 10 }).some((event) => event.kind === "visual_event_alignment")).toBe(true);
  }, 10000);
});
