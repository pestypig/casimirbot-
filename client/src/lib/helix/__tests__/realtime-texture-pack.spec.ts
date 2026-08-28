import { describe, expect, it, vi } from "vitest";
import { createRealtimeTexturePackPreviewController } from "../realtimeTexturePack";

const SOURCE_FRAME = "data:image/jpeg;base64,c291cmNl";

const makeSource = (surface: "window" | "screen" = "window") => {
  const stop = vi.fn();
  const endedListeners: Array<() => void> = [];
  const videoTrack = {
    readyState: "live",
    stop,
    addEventListener: vi.fn((event: string, listener: () => void) => {
      if (event === "ended") endedListeners.push(listener);
    }),
  } as unknown as MediaStreamTrack;
  const stream = {
    getTracks: () => [videoTrack],
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => [],
  } as unknown as MediaStream;
  return {
    result: {
      ok: true as const,
      kind: "screen" as const,
      stream,
      videoTrack,
      sourceOrigin: "browser_getDisplayMedia" as const,
      surface,
      displayAudioRequested: false,
      audioTrackAvailable: false,
    },
    stop,
    end: () => endedListeners.forEach((listener) => listener()),
  };
};

describe("Realtime Texture Pack preview controller", () => {
  it("runs a one-frame local passthrough preview with no provider egress", async () => {
    const source = makeSource();
    const frames: unknown[] = [];
    const states: unknown[] = [];
    const intervals: Array<() => void> = [];
    const controller = createRealtimeTexturePackPreviewController({
      requestSource: async () => source.result,
      captureFrame: async () => SOURCE_FRAME,
      resizeFrame: async (frame) => frame,
      now: () => new Date("2026-08-27T18:00:00.000Z"),
      setInterval: (callback) => {
        intervals.push(callback);
        return 7;
      },
      clearInterval: vi.fn(),
      onFrame: (frame) => frames.push(frame),
      onState: (state) => states.push(state),
    });

    await controller.start({ presetId: "playable", customPrompt: "watercolor" });
    await vi.waitFor(() => expect(frames).toHaveLength(1));

    expect(controller.getState()).toMatchObject({
      status: "previewing",
      capture_active: true,
      provider_state: "local_only",
      failure_reason: null,
      authoritative: false,
    });
    expect(frames[0]).toMatchObject({
      projection_image_data_url: SOURCE_FRAME,
      provider_id: "local_passthrough",
      authoritative: false,
    });
    expect(intervals).toHaveLength(1);
    expect(states.length).toBeGreaterThan(1);
  });

  it("rejects a whole-display source to prevent overlay recursion", async () => {
    const source = makeSource("screen");
    const captureFrame = vi.fn(async () => SOURCE_FRAME);
    const controller = createRealtimeTexturePackPreviewController({
      requestSource: async () => source.result,
      captureFrame,
    });

    const state = await controller.start({ presetId: "playable", customPrompt: "" });

    expect(state).toMatchObject({
      status: "error",
      capture_active: false,
      failure_reason: "realtime_texture_pack_window_source_required",
    });
    expect(source.stop).toHaveBeenCalledOnce();
    expect(captureFrame).not.toHaveBeenCalled();
  });

  it("stops tracks and ignores a late frame after user cancellation", async () => {
    const source = makeSource();
    const deferredCapture: { resolve?: (value: string) => void } = {};
    const frames: unknown[] = [];
    const controller = createRealtimeTexturePackPreviewController({
      requestSource: async () => source.result,
      captureFrame: async () => new Promise<string>((resolve) => {
        deferredCapture.resolve = resolve;
      }),
      resizeFrame: async (frame) => frame,
      setInterval: () => 9,
      clearInterval: vi.fn(),
      onFrame: (frame) => frames.push(frame),
    });

    await controller.start({ presetId: "custom", customPrompt: "ink" });
    expect(controller.stop()).toMatchObject({ status: "stopped", capture_active: false });
    deferredCapture.resolve?.(SOURCE_FRAME);
    await Promise.resolve();
    await Promise.resolve();

    expect(source.stop).toHaveBeenCalledOnce();
    expect(frames).toEqual([]);
  });
});
