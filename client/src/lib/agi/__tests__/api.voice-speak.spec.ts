import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let speakVoice: typeof import("@/lib/agi/api").speakVoice;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ speakVoice } = await import("@/lib/agi/api"));
});

describe("speakVoice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps payload and parses JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, suppressed: true, reason: "voice_context_ineligible" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await speakVoice({
      text: "Read this",
      mode: "briefing",
      priority: "info",
      voice_profile_id: "ops",
      traceId: "trace-1",
      missionId: "mission-1",
      eventId: "event-1",
      contextTier: "tier1",
      sessionState: "active",
      voiceMode: "normal",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/voice/speak",
      expect.objectContaining({ method: "POST" }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toMatchObject({
      text: "Read this",
      mode: "briefing",
      priority: "info",
      voice_profile_id: "ops",
      traceId: "trace-1",
      missionId: "mission-1",
      eventId: "event-1",
      contextTier: "tier1",
      sessionState: "active",
      voiceMode: "normal",
    });
    expect(res.kind).toBe("json");
  });

  it("parses audio blob responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["audio-bytes"], { type: "audio/wav" }), {
          status: 200,
          headers: { "content-type": "audio/wav" },
        }),
      ),
    );

    const res = await speakVoice({ text: "audio" });
    expect(res.kind).toBe("audio");
  });
});
