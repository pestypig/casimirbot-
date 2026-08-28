import { describe, expect, it } from "vitest";
import {
  REALTIME_TEXTURE_PACK_BASELINE_FPS,
  REALTIME_TEXTURE_PACK_BASELINE_HEIGHT,
  REALTIME_TEXTURE_PACK_BASELINE_WIDTH,
  buildLocalPassthroughProjectionFrame,
  buildRealtimeTexturePackConfig,
  buildRealtimeTexturePackTransformRequest,
  parseRealtimeTexturePackConfig,
  parseRealtimeTexturePackProjectionFrame,
} from "../realtime-texture-pack";

const SOURCE_DATA_URL = "data:image/jpeg;base64,cmVhbC1zb3VyY2UtZnJhbWU=";

const buildFixture = () => {
  const config = buildRealtimeTexturePackConfig({
    sessionId: "texture-session:1",
    sourceId: "visual-source:game-window",
    sourceSurface: "window",
    presetId: "playable",
    customPrompt: "soft watercolor forest",
  });
  const request = buildRealtimeTexturePackTransformRequest({
    config,
    requestId: "texture-request:1",
    sourceFrameId: "source-frame:1",
    sourceCapturedAt: "2026-08-27T18:00:00.000Z",
    sourceImageDataUrl: SOURCE_DATA_URL,
  });
  const projection = buildLocalPassthroughProjectionFrame({
    request,
    projectionFrameId: "projection-frame:1",
    completedAt: "2026-08-27T18:00:00.050Z",
  });
  return { config, request, projection };
};

describe("Realtime Texture Pack shared contract", () => {
  it("freezes the minimum expandable baseline without granting authority", () => {
    const { config } = buildFixture();

    expect(config).toMatchObject({
      requested_fps: REALTIME_TEXTURE_PACK_BASELINE_FPS,
      source_width: REALTIME_TEXTURE_PACK_BASELINE_WIDTH,
      source_height: REALTIME_TEXTURE_PACK_BASELINE_HEIGHT,
      provider_id: "local_passthrough",
      authoritative: false,
      authority_class: "non_authoritative_projection",
    });
  });

  it("preserves exact source, request, and session linkage through local passthrough", () => {
    const { request, projection } = buildFixture();

    expect(projection).toMatchObject({
      request_id: request.request_id,
      session_id: request.session_id,
      source_frame_id: request.source_frame_id,
      source_captured_at: request.source_captured_at,
      projection_image_data_url: request.source_image_data_url,
      provider_id: "local_passthrough",
      provider_model: "local_copy_v1",
      authoritative: false,
      interpolated: false,
    });
    expect(parseRealtimeTexturePackProjectionFrame(projection)).toBe(projection);
  });

  it("rejects projection authority escalation", () => {
    const { projection } = buildFixture();
    const poisoned = {
      ...projection,
      authoritative: true,
      authority_class: "environment_observation",
    } as unknown as typeof projection;

    expect(() => parseRealtimeTexturePackProjectionFrame(poisoned)).toThrow(
      "realtime_texture_pack_authority_claim_rejected",
    );
  });

  it("rejects invalid identity, timestamp, data URL, and oversized prompt inputs", () => {
    expect(() => buildRealtimeTexturePackConfig({
      sessionId: " ",
      sourceId: "visual-source:1",
      sourceSurface: "window",
    })).toThrow("session_id_required");

    const config = buildRealtimeTexturePackConfig({
      sessionId: "texture-session:1",
      sourceId: "visual-source:1",
      sourceSurface: "window",
    });
    expect(() => buildRealtimeTexturePackTransformRequest({
      config,
      requestId: "request:1",
      sourceFrameId: "frame:1",
      sourceCapturedAt: "not-a-date",
      sourceImageDataUrl: SOURCE_DATA_URL,
    })).toThrow("source_captured_at_invalid");
    expect(() => buildRealtimeTexturePackTransformRequest({
      config,
      requestId: "request:1",
      sourceFrameId: "frame:1",
      sourceCapturedAt: "2026-08-27T18:00:00.000Z",
      sourceImageDataUrl: "https://example.com/frame.jpg",
    })).toThrow("source_image_data_url_invalid");
    expect(() => buildRealtimeTexturePackConfig({
      sessionId: "texture-session:1",
      sourceId: "visual-source:1",
      sourceSurface: "window",
      customPrompt: "x".repeat(2_001),
    })).toThrow("realtime_texture_pack_prompt_too_long");
  });

  it("rejects attempts to silently raise rate or resolution in the v1 packet", () => {
    const { config } = buildFixture();
    expect(() => parseRealtimeTexturePackConfig({
      ...config,
      requested_fps: 8,
    })).toThrow("realtime_texture_pack_fps_out_of_scope");
    expect(() => parseRealtimeTexturePackConfig({
      ...config,
      source_width: 1_024,
    })).toThrow("realtime_texture_pack_dimensions_out_of_scope");
  });
});
