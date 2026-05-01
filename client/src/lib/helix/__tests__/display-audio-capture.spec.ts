import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
});

import { startDisplayAudioSituationSession } from "@/lib/helix/display-audio-capture";

type FakeTrack = {
  kind: "audio" | "video";
  stop: ReturnType<typeof vi.fn>;
  getSettings?: () => Record<string, unknown>;
  addEventListener?: ReturnType<typeof vi.fn>;
};

class FakeMediaStream {
  tracks: FakeTrack[];

  constructor(tracks: FakeTrack[] = []) {
    this.tracks = tracks;
  }

  getTracks(): FakeTrack[] {
    return this.tracks;
  }

  getAudioTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === "audio");
  }

  getVideoTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === "video");
  }
}

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);

  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onerror: ((event: { error?: Error }) => void) | null = null;
  mimeType: string;
  timeslice: number | null = null;

  constructor(
    public stream: FakeMediaStream,
    options?: { mimeType?: string },
  ) {
    this.mimeType = options?.mimeType ?? "";
    FakeMediaRecorder.instances.push(this);
  }

  start(timeslice?: number): void {
    this.state = "recording";
    this.timeslice = timeslice ?? null;
  }

  stop(): void {
    this.state = "inactive";
  }

  emit(data: Blob): void {
    this.ondataavailable?.({ data });
  }
}

const installMediaGlobals = (stream: FakeMediaStream): ReturnType<typeof vi.fn> => {
  FakeMediaRecorder.instances = [];
  const getDisplayMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal("MediaStream", FakeMediaStream);
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getDisplayMedia,
    },
  });
  return getDisplayMedia;
};

describe("display audio situation session", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests display audio, transcribes recorder chunks, and emits situation events", async () => {
    const audioTrack: FakeTrack = { kind: "audio", stop: vi.fn(), addEventListener: vi.fn() };
    const videoTrack: FakeTrack = {
      kind: "video",
      stop: vi.fn(),
      addEventListener: vi.fn(),
      getSettings: () => ({ displaySurface: "browser" }),
    };
    const stream = new FakeMediaStream([audioTrack, videoTrack]);
    const getDisplayMedia = installMediaGlobals(stream);
    const transcribe = vi.fn().mockResolvedValue({
      ok: true,
      text: "Rowan needs food.",
      language: "en",
      confidence: 0.91,
      engine: "openai_transcribe",
    });
    const events: unknown[] = [];

    const session = await startDisplayAudioSituationSession({
      roomId: "room-1",
      missionId: "mission-1",
      threadId: "thread-1",
      captureSessionId: "capture-1",
      chunkMs: 5000,
      transcribe,
      onEvent: (event) => events.push(event),
      isDottiePlaybackActive: () => true,
    });

    expect(getDisplayMedia).toHaveBeenCalledWith({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    expect(session.source).toBe("display_tab_audio");
    expect(FakeMediaRecorder.instances[0]?.timeslice).toBe(5000);

    FakeMediaRecorder.instances[0]?.emit(new Blob(["audio"], { type: "audio/webm" }));

    await vi.waitFor(() => expect(events).toHaveLength(1));
    expect(transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        room_id: "room-1",
        mission_id: "mission-1",
        thread_id: "thread-1",
        capture_session_id: "capture-1",
        chunk_index: 0,
        capture_source: "display_tab_audio",
        command_lane_enabled: false,
      }),
    );
    expect(events[0]).toMatchObject({
      room_id: "room-1",
      mission_id: "mission-1",
      thread_id: "thread-1",
      source: "display_tab_audio",
      event_type: "voice_transcript",
      text: "Rowan needs food.",
      capture_session_id: "capture-1",
      chunk_index: 0,
      meta: {
        confidence: 0.91,
        language: "en",
        engine: "openai_transcribe",
        possible_tts_echo: true,
      },
    });

    session.stop();
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
    expect(videoTrack.stop).toHaveBeenCalledTimes(1);
  });

  it("fails clearly and stops tracks when the selected source has no audio track", async () => {
    const videoTrack: FakeTrack = {
      kind: "video",
      stop: vi.fn(),
      getSettings: () => ({ displaySurface: "window" }),
    };
    installMediaGlobals(new FakeMediaStream([videoTrack]));

    await expect(
      startDisplayAudioSituationSession({
        roomId: "room-1",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("Selected source did not provide an audio track.");
    expect(videoTrack.stop).toHaveBeenCalledTimes(1);
  });
});
