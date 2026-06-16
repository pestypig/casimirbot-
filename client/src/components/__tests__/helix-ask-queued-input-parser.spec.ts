import { beforeAll, describe, expect, it } from "vitest";

let parseHelixAskQueuedQuestionsInput: typeof import("@/components/helix/HelixAskPill").parseHelixAskQueuedQuestionsInput;
let buildHelixAskRepliesFromChatSession: typeof import("@/components/helix/HelixAskPill").buildHelixAskRepliesFromChatSession;
let buildHelixAskHardBackendEntrypointRouteMetadata: typeof import("@/components/helix/HelixAskPill").buildHelixAskHardBackendEntrypointRouteMetadata;
let requiresHelixAskBackendEntrypoint: typeof import("@/components/helix/HelixAskPill").requiresHelixAskBackendEntrypoint;
let shouldUseHelixAskBackendTurnEntrypoint: typeof import("@/components/helix/HelixAskPill").shouldUseHelixAskBackendTurnEntrypoint;
let buildHelixPillDebugExportEnvelopeFromMasterPayload: typeof import("@/components/helix/HelixAskPill").buildHelixDebugExportEnvelopeFromMasterPayload;
let buildHelixDebugExportEnvelopeFromMasterPayload: typeof import("@/lib/agi/debugExport").buildHelixDebugExportEnvelopeFromMasterPayload;

beforeAll(async () => {
  (globalThis as Record<string, unknown>).__HELIX_ASK_JOB_TIMEOUT_MS__ = "1200000";
  ({
    buildHelixAskHardBackendEntrypointRouteMetadata,
    buildHelixAskRepliesFromChatSession,
    buildHelixDebugExportEnvelopeFromMasterPayload: buildHelixPillDebugExportEnvelopeFromMasterPayload,
    parseHelixAskQueuedQuestionsInput,
    requiresHelixAskBackendEntrypoint,
    shouldUseHelixAskBackendTurnEntrypoint,
  } = await import("@/components/helix/HelixAskPill"));
  ({ buildHelixDebugExportEnvelopeFromMasterPayload } = await import("@/lib/agi/debugExport"));
});

describe("Helix Ask queued input parser", () => {
  it("preserves multiline prompt instructions as one user turn", () => {
    const prompt = [
      "Call scientific-calculator.solve_expression with this exact expression: ((sqrt(81)+ln(e^3))*7-5^2)/2.",
      "",
      "Use the calculator tool, wait for its observation, re-enter the calculator receipt as evidence, then answer from the calculator-backed terminal result only. Do not answer from mental math or a model-synthesized fallback.",
    ].join("\n");

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt.trim()]);
  });

  it("preserves delimiter-looking text as content instead of creating queued turns", () => {
    const prompt = "First paragraph\n---\nSecond paragraph";

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt]);
  });

  it("preserves numbered question labels as content instead of creating queued turns", () => {
    const prompt = "Question 1: First turn\nPrompt 2: Second turn";

    expect(parseHelixAskQueuedQuestionsInput(prompt)).toEqual([prompt]);
  });
});

describe("Helix Ask backend entrypoint projection guard", () => {
  const hardCalculatorPrompt =
    "Call scientific-calculator.solve_expression with this exact expression: ((sqrt(81)+ln(e^3))*7-5^2)/2, use the calculator tool, wait for calculator_receipt, re-enter that receipt as evidence, and answer only from the calculator-backed terminal result; do not answer from mental math or model-synthesized fallback.";

  it("classifies explicit tool-family prompts as backend Ask entrypoint required", () => {
    expect(requiresHelixAskBackendEntrypoint(hardCalculatorPrompt)).toBe(true);
    expect(requiresHelixAskBackendEntrypoint("What should I cook for dinner tonight?")).toBe(false);
  });

  it("builds hard backend Ask route metadata for explicit calculator tool prompts", () => {
    const metadata = buildHelixAskHardBackendEntrypointRouteMetadata({
      question: hardCalculatorPrompt,
      turnId: "ask:calculator-turn",
      threadId: "session-1",
    }) as Record<string, unknown>;
    const sourceTarget = metadata.source_target_intent as Record<string, unknown>;
    const mandatoryNextTool = metadata.mandatory_next_tool as Record<string, unknown>;

    expect(metadata.source).toBe("hard_tool_backend_entrypoint");
    expect(metadata.sourceTarget).toBe("calculator_stream");
    expect(metadata.requiredToolFamily).toBe("calculator");
    expect(sourceTarget).toMatchObject({
      schema: "helix.ask_source_target_intent.v1",
      target_source: "calculator_stream",
      target_kind: "calculator_stream",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "hard_tool_family_backend_entrypoint_required",
    });
    expect(sourceTarget.suppressed_routes).toEqual(
      expect.arrayContaining(["durable_chat_session", "client_projection", "evidence_finalization_fallback", "no_tool_direct"]),
    );
    expect(mandatoryNextTool).toMatchObject({
      schema: "helix.mandatory_next_tool.v1",
      tool_name: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      required_tool_family: "calculator",
      terminal_forbidden: true,
      missing_required_evidence: "calculator_receipt",
    });
  });

  it("uses backend Ask turn entrypoint for hard tool prompts even when the manual canary is off", () => {
    expect(
      shouldUseHelixAskBackendTurnEntrypoint({
        manualCanaryEnabled: false,
        hardBackendEntrypointRequired: true,
      }),
    ).toBe(true);
    expect(
      shouldUseHelixAskBackendTurnEntrypoint({
        manualCanaryEnabled: false,
        hardBackendEntrypointRequired: false,
      }),
    ).toBe(false);
  });

  it("does not build hard backend Ask route metadata for ordinary chat", () => {
    expect(
      buildHelixAskHardBackendEntrypointRouteMetadata({
        question: "What should I cook for dinner tonight?",
        turnId: "ask:ordinary-turn",
        threadId: "session-ordinary",
      }),
    ).toBeNull();
  });

  it("fails closed instead of projecting a durable chat final for hard calculator prompts", () => {
    const [reply] = buildHelixAskRepliesFromChatSession({
      id: "session-1",
      title: "Helix Ask",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
      personaId: "default",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: hardCalculatorPrompt,
          at: "2026-06-16T00:00:00.000Z",
          tokens: 1,
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "I need retrieval before finalizing this claim.",
          at: "2026-06-16T00:00:01.000Z",
          tokens: 1,
        },
      ],
    } as never);

    expect(reply.content).toBe("This prompt requires the backend Ask solver path before a final answer can be shown.");
    expect(reply.ok).toBe(false);
    expect(reply.final_answer_source).toBe("typed_failure");
    expect(reply.terminal_artifact_kind).toBe("typed_failure");
    expect(reply.terminal_error_code).toBe("backend_ask_entry_required");
    expect(reply.debug?.ask_entrypoint_required).toBe(true);
    expect(reply.debug?.ask_entrypoint_observed).toBe(false);
    expect(reply.debug?.blocked_projection_kind).toBe("durable_chat_session");
  });

  it("allows ordinary durable chat projections that do not require the Ask solver entrypoint", () => {
    const [reply] = buildHelixAskRepliesFromChatSession({
      id: "session-2",
      title: "Helix Ask",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
      personaId: "default",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: "Say hello in one sentence.",
          at: "2026-06-16T00:00:00.000Z",
          tokens: 1,
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "Hello.",
          at: "2026-06-16T00:00:01.000Z",
          tokens: 1,
        },
      ],
    } as never);

    expect(reply.content).toBe("Hello.");
    expect(reply.ok).toBe(true);
    expect(reply.final_answer_source).toBe("durable_chat_session");
    expect(reply.debug?.ask_entrypoint_required).toBe(false);
  });

  it("does not treat an ask-shaped durable chat trace id as backend entrypoint evidence", () => {
    const [reply] = buildHelixAskRepliesFromChatSession({
      id: "session-3",
      title: "Helix Ask",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
      personaId: "default",
      messages: [
        {
          id: "user-1",
          role: "user",
          traceId: "ask:calculator-turn",
          content: hardCalculatorPrompt,
          at: "2026-06-16T00:00:00.000Z",
          tokens: 1,
        },
        {
          id: "assistant-1",
          role: "assistant",
          traceId: "ask:calculator-turn",
          content: "Calculator-backed answer.",
          at: "2026-06-16T00:00:01.000Z",
          tokens: 1,
        },
      ],
    } as never);

    expect(reply.content).toBe("This prompt requires the backend Ask solver path before a final answer can be shown.");
    expect(reply.ok).toBe(false);
    expect(reply.final_answer_source).toBe("typed_failure");
    expect(reply.terminal_error_code).toBe("backend_ask_entry_required");
    expect(reply.debug?.ask_entrypoint_required).toBe(true);
    expect(reply.debug?.ask_entrypoint_observed).toBe(false);
    expect(reply.debug?.blocked_projection_kind).toBe("durable_chat_session");
  });

  it("exposes backend entrypoint failure fields in debug export", () => {
    const [reply] = buildHelixAskRepliesFromChatSession({
      id: "session-4",
      title: "Helix Ask",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
      personaId: "default",
      messages: [
        {
          id: "user-1",
          role: "user",
          content: hardCalculatorPrompt,
          at: "2026-06-16T00:00:00.000Z",
          tokens: 1,
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "I need retrieval before finalizing this claim.",
          at: "2026-06-16T00:00:01.000Z",
          tokens: 1,
        },
      ],
    } as never);

    const debugExport = JSON.parse(
      buildHelixDebugExportEnvelopeFromMasterPayload(
        { id: reply.id, question: reply.question, content: reply.content },
        { ...reply, debug: reply.debug } as Record<string, unknown>,
      ),
    ) as Record<string, unknown>;

    expect(debugExport.ask_entrypoint_required).toBe(true);
    expect(debugExport.ask_entrypoint_observed).toBe(false);
    expect(debugExport.ask_entrypoint_failure_code).toBe("backend_ask_entry_required");
    expect(debugExport.blocked_projection_kind).toBe("durable_chat_session");
    expect(debugExport.final_answer_source).toBe("typed_failure");
    expect(debugExport.terminal_artifact_kind).toBe("typed_failure");
  });

  it("exposes backend entrypoint failure fields in the Helix Ask pill debug export", () => {
    const [reply] = buildHelixAskRepliesFromChatSession({
      id: "session-5",
      title: "Helix Ask",
      createdAt: "2026-06-16T00:00:00.000Z",
      updatedAt: "2026-06-16T00:00:01.000Z",
      personaId: "default",
      messages: [
        {
          id: "user-1",
          role: "user",
          traceId: "ask:calculator-turn",
          content: hardCalculatorPrompt,
          at: "2026-06-16T00:00:00.000Z",
          tokens: 1,
        },
        {
          id: "assistant-1",
          role: "assistant",
          traceId: "ask:calculator-turn",
          content: "I need retrieval before finalizing this claim.",
          at: "2026-06-16T00:00:01.000Z",
          tokens: 1,
        },
      ],
    } as never);

    const debugExport = JSON.parse(
      buildHelixPillDebugExportEnvelopeFromMasterPayload(reply, {
        selectedDebugQuestion: reply.question,
        selectedDebugFinalAnswer: reply.content,
        finalAnswer: reply.content,
        debug: reply.debug,
      } as Record<string, unknown>),
    ) as Record<string, unknown>;

    expect(debugExport.selected_final_answer).toBe(
      "This prompt requires the backend Ask solver path before a final answer can be shown.",
    );
    expect(debugExport.final_answer_source).toBe("typed_failure");
    expect(debugExport.terminal_artifact_kind).toBe("typed_failure");
    expect(debugExport.terminal_error_code).toBe("backend_ask_entry_required");
    expect(debugExport.ask_entrypoint_required).toBe(true);
    expect(debugExport.ask_entrypoint_observed).toBe(false);
    expect(debugExport.ask_entrypoint_failure_code).toBe("backend_ask_entry_required");
    expect(debugExport.blocked_projection_kind).toBe("durable_chat_session");
    expect((debugExport.ui_debug_parity_harness as Record<string, unknown>).ui_answer_equals_selected_final_answer).toBe(true);
  });
});
