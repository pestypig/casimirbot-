import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let transcribeVoice: typeof import("@/lib/agi/api").transcribeVoice;
let runConversationTurn: typeof import("@/lib/agi/api").runConversationTurn;
let askLocal: typeof import("@/lib/agi/api").askLocal;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ transcribeVoice, runConversationTurn, askLocal } = await import("@/lib/agi/api"));
});

describe("transcribeVoice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads multipart audio and parses the JSON response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          text: "Captured transcript",
          language: "en",
          duration_ms: 1200,
          traceId: "trace-1",
          missionId: "mission-1",
          engine: "faster_whisper_local",
          segments: [],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const audio = new Blob(["voice-bytes"], { type: "audio/webm" });
    const res = await transcribeVoice({
      audio,
      traceId: "trace-1",
      missionId: "mission-1",
      durationMs: 1200,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/voice/transcribe",
      expect.objectContaining({ method: "POST" }),
    );
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    const body = options.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("traceId")).toBe("trace-1");
    expect(body.get("missionId")).toBe("mission-1");
    expect(body.get("durationMs")).toBe("1200");
    const audioEntry = body.get("audio") as File;
    expect(audioEntry).toBeTruthy();
    expect(audioEntry.name).toBe("helix-voice-input.webm");
    expect(audioEntry.type).toBe("audio/webm");
    expect(res).toMatchObject({
      ok: true,
      text: "Captured transcript",
      traceId: "trace-1",
      missionId: "mission-1",
      engine: "faster_whisper_local",
    });
  });
});

describe("runConversationTurn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts conversation-lane payload and parses classification + brief response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          traceId: "voice-trace-1",
          classification: {
            mode: "verify",
            confidence: 0.88,
            dispatch_hint: true,
            clarify_needed: false,
            reason: "Verification intent detected.",
            source: "llm",
          },
          brief: {
            text: "I will verify that claim and report pass/fail evidence next.",
            source: "llm",
          },
          dispatch: {
            dispatch_hint: true,
            reason: "dispatch:verify",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await runConversationTurn({
      transcript: "Please verify this claim before acting.",
      sessionId: "session-1",
      traceId: "voice-trace-1",
      missionId: "mission-1",
      sourceLanguage: "en",
      translated: false,
      recentTurns: ["user: prior line", "dottie: prior brief"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agi/ask/conversation-turn",
      expect.objectContaining({ method: "POST" }),
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toMatchObject({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(JSON.parse(String(request.body))).toEqual({
      transcript: "Please verify this claim before acting.",
      sessionId: "session-1",
      traceId: "voice-trace-1",
      missionId: "mission-1",
      sourceLanguage: "en",
      translated: false,
      recentTurns: ["user: prior line", "dottie: prior brief"],
    });
    expect(response.classification?.mode).toBe("verify");
    expect(response.brief?.text).toContain("verify");
    expect(response.dispatch?.dispatch_hint).toBe(true);
  });
});

describe("askLocal capsule ids", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caps capsule ids to 12 in job payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-capsule-limit",
            status: "pending",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-capsule-limit",
            status: "completed",
            result: { text: "ok" },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const capsuleIds = Array.from({ length: 20 }, (_entry, index) => `HXFP-${String(index).padStart(6, "0")}`);
    await askLocal(undefined, {
      question: "test additive capsules",
      capsuleIds,
    });

    const createRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(createRequest.body)) as { capsuleIds?: string[] };
    expect(payload.capsuleIds).toEqual(capsuleIds.slice(0, 12));
  });

  it("recovers from job-missing interrupted fallback by retrying direct ask", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-missing-race",
            status: "queued",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "not_found",
          }),
          {
            status: 404,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            text: "Recovered direct ask answer.",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await askLocal(undefined, {
      question: "how do we solve the warp level in codebase?",
    });

    expect(response.text).toBe("Recovered direct ask answer.");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/agi/ask/jobs");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/api/agi/ask/jobs/job-missing-race");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/agi/ask");
  });

  it("maps blocked multilang responses to deterministic text when final text is missing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-blocked-gate",
            status: "queued",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-blocked-gate",
            status: "completed",
            result: {
              ok: false,
              error: "multilang_dispatch_blocked",
              message: "Translation confidence is too low to dispatch retrieval safely.",
              fail_reason: "HELIX_INTERPRETER_DISPATCH_BLOCKED",
              fail_class: "multilang_confidence_gate",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await askLocal(undefined, {
      question: "Okay, explain what a warp bubble is in the codebase.",
    });

    expect(response.text).toBe("Translation confidence is too low to dispatch retrieval safely.");
    expect(response.fail_reason).toBe("HELIX_INTERPRETER_DISPATCH_BLOCKED");
    expect(response.fail_class).toBe("multilang_confidence_gate");
  });
});
