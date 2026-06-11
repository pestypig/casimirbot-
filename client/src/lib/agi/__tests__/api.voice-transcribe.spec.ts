import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let transcribeVoice: typeof import("@/lib/agi/api").transcribeVoice;
let runConversationTurn: typeof import("@/lib/agi/api").runConversationTurn;
let askLocal: typeof import("@/lib/agi/api").askLocal;
let getVoiceCallDiagnosticsSnapshot: typeof import("@/lib/helix/voice-call-diagnostics").getVoiceCallDiagnosticsSnapshot;
let clearVoiceCallDiagnosticsSnapshot: typeof import("@/lib/helix/voice-call-diagnostics").clearVoiceCallDiagnosticsSnapshot;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({ transcribeVoice, runConversationTurn, askLocal } = await import("@/lib/agi/api"));
  ({ getVoiceCallDiagnosticsSnapshot, clearVoiceCallDiagnosticsSnapshot } = await import(
    "@/lib/helix/voice-call-diagnostics"
  ));
});

describe("transcribeVoice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearVoiceCallDiagnosticsSnapshot();
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
      room_id: "room-1",
      thread_id: "thread-1",
      capture_session_id: "capture-1",
      chunk_index: 3,
      capture_source: "display_tab_audio",
      command_lane_enabled: false,
      speaker_identity_enabled: true,
      speaker_policy_mode: "trusted_session",
      known_speaker_ids: ["spk_owner"],
      active_listener_speaker_ids: ["spk_owner"],
      unknown_speaker_behavior: "transcribe_only",
      audio_identity_session_id: "audio-session-1",
      speaker_id: "spk_owner",
      speaker_confidence: 0.92,
      speaker_role: "owner",
      speaker_authority: "command_allowed",
      overlapping_speech: false,
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
    expect(body.get("room_id")).toBe("room-1");
    expect(body.get("thread_id")).toBe("thread-1");
    expect(body.get("capture_session_id")).toBe("capture-1");
    expect(body.get("chunk_index")).toBe("3");
    expect(body.get("capture_source")).toBe("display_tab_audio");
    expect(body.get("command_lane_enabled")).toBe("0");
    expect(body.get("speaker_identity_enabled")).toBe("1");
    expect(body.get("speaker_policy_mode")).toBe("trusted_session");
    expect(body.get("known_speaker_ids")).toBe("spk_owner");
    expect(body.get("active_listener_speaker_ids")).toBe("spk_owner");
    expect(body.get("unknown_speaker_behavior")).toBe("transcribe_only");
    expect(body.get("audio_identity_session_id")).toBe("audio-session-1");
    expect(body.get("speaker_id")).toBe("spk_owner");
    expect(body.get("speaker_confidence")).toBe("0.92");
    expect(body.get("speaker_role")).toBe("owner");
    expect(body.get("speaker_authority")).toBe("command_allowed");
    expect(body.get("overlapping_speech")).toBe("0");
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
    const calls = getVoiceCallDiagnosticsSnapshot();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      kind: "transcribe",
      endpoint: "/api/voice/transcribe",
      ok: true,
      status: 200,
      responseKind: "json",
      traceId: "trace-1",
      missionId: "mission-1",
      audioBytes: 11,
      audioMimeType: "audio/webm",
      audioDurationMs: 1200,
    });
    expect(JSON.stringify(calls[0])).not.toContain("Captured transcript");
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
  beforeEach(() => {
    (globalThis as Record<string, unknown>).__HELIX_E8_14_LANE_PARITY__ = false;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__HELIX_E8_14_LANE_PARITY__;
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

  it("preserves full prompts when they contain a Question header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jobId: "job-compound-question-header",
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
            jobId: "job-compound-question-header",
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

    const prompt = [
      "Question: diagnose Helix Ask large prompt behavior",
      "",
      "Context:",
      "1. preserve global context",
      "2. compare with Codex compaction",
      "3. propose code changes",
    ].join("\n");
    await askLocal(prompt);

    const createRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(createRequest.body)) as Record<string, unknown>;
    expect(payload.prompt).toBe(prompt);
    expect(payload.raw_user_prompt).toBe(prompt);
    expect(payload.question).toBe(prompt);
    expect(payload.question_source).toBe("raw_prompt");
    expect(payload.extracted_question_label).toBe("diagnose Helix Ask large prompt behavior");
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

describe("askLocal lane parity default", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).__HELIX_E8_14_LANE_PARITY__;
    vi.unstubAllGlobals();
  });

  it("defaults to /api/agi/ask/turn when no explicit parity override is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "Turn path response.",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await askLocal(undefined, {
      question: "hello",
    });

    expect(response.text).toBe("Turn path response.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/agi/ask/turn");
  });

  it("serializes structured route_metadata for mailbox wake turns without prompt text embedding", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "Mailbox route accepted.",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await askLocal("Review the latest Stage Play live-source mailbox finding.", {
      question: "Review the latest Stage Play live-source mailbox finding.",
      route_metadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:api-client",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        allowedCapabilities: ["live_env.read_processed_live_source_mail"],
        forbiddenCapabilities: ["workspace_os.status"],
        evidenceRefs: ["stage_play_processed_mail_packet:api-client"],
        source_target_intent: {
          target_source: "live_source_mailbox",
          target_kind: "live_source_mailbox",
          strength: "hard",
        },
        mandatory_next_tool: {
          tool_name: "live_env.record_live_source_mail_decision",
          terminal_forbidden: true,
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/agi/ask/turn");
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body ?? "{}")) as Record<string, any>;
    expect(body.prompt).toBe("Review the latest Stage Play live-source mailbox finding.");
    expect(body.prompt).not.toContain("live_env.record_live_source_mail_decision");
    expect(body.route_metadata).toMatchObject({
      invocationKind: "stage_play_mail_wake",
      wakeRequestId: "stage_play_live_source_mail_wake:api-client",
      mailboxThreadId: "helix-ask:desktop",
      sourceTarget: "live_source_mailbox",
      requiredCanonicalGoal: "processed_mail_voice_decision",
      requiredPhase: "record_decision",
      allowedCapabilities: ["live_env.read_processed_live_source_mail"],
      forbiddenCapabilities: ["workspace_os.status"],
      evidenceRefs: ["stage_play_processed_mail_packet:api-client"],
    });
    expect(body.source_target_intent).toMatchObject({
      target_source: "live_source_mailbox",
      target_kind: "live_source_mailbox",
      strength: "hard",
    });
    expect(body.mandatory_next_tool).toMatchObject({
      tool_name: "live_env.record_live_source_mail_decision",
      terminal_forbidden: true,
    });
  });
});
