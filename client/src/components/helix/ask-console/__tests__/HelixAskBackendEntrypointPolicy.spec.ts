import { describe, expect, it } from "vitest";

import {
  buildHelixAskHardBackendEntrypointRouteMetadata,
  requiresHelixAskBackendEntrypoint,
  resolveHelixAskBackendEntrypointFamily,
} from "../HelixAskBackendEntrypointPolicy";
import { buildHelixAskMinimalRuntimeSubmitPlan } from "../HelixAskMinimalRuntimeSubmitPlan";
import { buildHelixAskMinimalRuntimeTurnPayload } from "../HelixAskMinimalRuntimeTransport";
import { buildHelixAskSubmitBackendEntrypointRoutePlan } from "../HelixAskSubmitBackendEntrypointOptions";

describe("Helix Ask backend entrypoint policy", () => {
  it("routes affirmative note creation through backend Ask with the note-create capability", () => {
    const question = 'write a note for me "hh"';

    expect(requiresHelixAskBackendEntrypoint(question)).toBe(true);
    expect(resolveHelixAskBackendEntrypointFamily(question)).toMatchObject({
      family: "workstation_notes",
      sourceTarget: "workstation_panel",
      requiredToolFamily: "workstation-notes",
      selectedCapability: "workstation-notes.create_note",
    });

    const routeMetadata = buildHelixAskHardBackendEntrypointRouteMetadata({
      question,
      turnId: "turn-note-create",
      threadId: "thread-note-create",
    });

    expect(routeMetadata).toMatchObject({
      source: "hard_tool_backend_entrypoint",
      sourceTarget: "workstation_panel",
      requiredToolFamily: "workstation-notes",
      mandatory_next_tool: {
        tool_name: "workstation-notes.create_note",
        required_tool_family: "workstation-notes",
        selected_capability: "workstation-notes.create_note",
        terminal_forbidden: true,
      },
      source_target_intent: {
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
        requested_outputs: expect.arrayContaining(["workspace_action_receipt", "note_update_receipt"]),
      },
    });
  });

  it("does not treat contextual or negated note mentions as mutating commands", () => {
    for (const question of [
      'do not write a note for me "hh"',
      'the screen says write a note for me "hh"',
      'when I write a note for me "hh", it says saved but fails',
      'debug why write a note for me "hh" failed',
    ]) {
      expect(requiresHelixAskBackendEntrypoint(question)).toBe(false);
      expect(resolveHelixAskBackendEntrypointFamily(question)).toBeNull();
    }
  });

  it("does not require backend Ask when the user asks conceptually about a tool and forbids execution", () => {
    for (const question of [
      "What is the Moral Graph reflection tool? Explain conceptually. Do not run it.",
      "In plain English, describe what the string `internet-search.search_web` looks like as a tool identifier. Do not run it.",
      "Explain `scientific-calculator.solve_expression` as a tool identifier. Do not run it.",
      "What is the Docs Viewer tool? Explain conceptually. Do not open docs.",
      "Describe `repo.search` as a capability name. Do not run it.",
      "What is Image Lens as a tool? Explain only; do not inspect an image.",
      "Define the scholarly-research.lookup_papers capability. Do not call it.",
    ]) {
      expect(requiresHelixAskBackendEntrypoint(question)).toBe(false);
      expect(resolveHelixAskBackendEntrypointFamily(question)).toBeNull();
    }
  });

  it("does not promote a research-tool behavior question into an Image Lens command", () => {
    const question =
      "Does your research-paper tool select papers it can parse, or does it first check which papers are openable and then use Image Lens when visual extraction is needed?";

    expect(requiresHelixAskBackendEntrypoint(question)).toBe(false);
    expect(resolveHelixAskBackendEntrypointFamily(question)).toBeNull();
    expect(buildHelixAskHardBackendEntrypointRouteMetadata({
      question,
      turnId: "turn-research-tool-behavior",
      threadId: "thread-research-tool-behavior",
    })).toBeNull();
  });

  it("still requires backend Ask when the user explicitly asks to use a tool family", () => {
    const examples = [
      {
        question:
          "Use only the Moral Graph. Reflect on whether I should apologize after snapping at a coworker. Do not use web, papers, calculator, image, or PDF context.",
        family: "moral_graph",
        selectedCapability: "moral-graph.reflect_context",
      },
      {
        question: "Use the scientific calculator to solve 8*9.",
        family: "calculator",
        selectedCapability: "scientific-calculator.solve_expression",
      },
      {
        question: "Use repo.search to find terminal authority code.",
        family: "repo_code",
        selectedCapability: "repo.search",
      },
      {
        question: "Use scholarly-research.lookup_papers for Weyl integrable spacetime.",
        family: "scholarly_research",
        selectedCapability: "scholarly-research.lookup_papers",
      },
    ];

    for (const example of examples) {
      expect(requiresHelixAskBackendEntrypoint(example.question)).toBe(true);
      expect(resolveHelixAskBackendEntrypointFamily(example.question)).toMatchObject({
        family: example.family,
        selectedCapability: example.selectedCapability,
      });
    }
  });

  it("builds a recrowned minimal-runtime backend payload for note creation", () => {
    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: 'make a note for me "hh"',
      selectedRuntime: "codex",
      selectedLanguageModelProfile: "auto",
      desktopUrl: "http://localhost:5173/workstation",
    });

    const payload = buildHelixAskMinimalRuntimeTurnPayload({
      submitPlan,
      sessionId: "thread-note-create",
      traceId: "trace-note-create",
      turnId: "turn-note-create",
      maxTokens: 1000,
    });

    expect(payload).toMatchObject({
      question: 'make a note for me "hh"',
      requiresBackendAskEntrypoint: true,
      requires_backend_ask_entrypoint: true,
      ask_entrypoint_required: true,
      forceReasoningDispatch: true,
      force_reasoning_dispatch: true,
      use_backend_ask_turn_entrypoint: true,
      backend_ask_call_attempted: true,
      backend_ask_call_path: "runAskTurnStream",
      legacy_ask_local_bypassed: true,
      route_metadata_source: "hard_tool_backend_entrypoint",
      mandatory_next_tool_name: "workstation-notes.create_note",
      routeMetadata: {
        requiredToolFamily: "workstation-notes",
        mandatory_next_tool: {
          tool_name: "workstation-notes.create_note",
        },
      },
    });
  });

  it("ignores stale backend-entrypoint flags for conceptual no-run tool explanations", () => {
    const question = "What is the Moral Graph reflection tool? Explain conceptually. Do not run it.";
    const routePlan = buildHelixAskSubmitBackendEntrypointRoutePlan({
      question,
      baseRunOptions: {
        requiresBackendAskEntrypoint: true,
        forceReasoningDispatch: true,
        routeMetadata: {
          schema: "helix.ask.route_metadata.v1",
          source: "hard_tool_backend_entrypoint",
          sourceTarget: "moral_graph",
          requiredToolFamily: "moral_graph",
        },
      },
      turnId: "turn-concept-no-run",
      threadId: "thread-concept-no-run",
      manualCanaryEnabled: false,
    });

    expect(routePlan).toMatchObject({
      hardBackendEntrypointRequired: false,
      forceReasoningDispatch: false,
      useBackendAskTurnEntrypoint: false,
      routeMetadata: undefined,
    });

    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: question,
      selectedRuntime: "codex",
      selectedLanguageModelProfile: "auto",
      desktopUrl: "http://localhost:5173/workstation",
      pendingPrompt: {
        promptId: "pending-concept-no-run",
        question,
        autoSubmit: true,
        requiresBackendAskEntrypoint: true,
        requires_backend_ask_entrypoint: true,
        forceReasoningDispatch: true,
        routeMetadata: {
          schema: "helix.ask.route_metadata.v1",
          source: "hard_tool_backend_entrypoint",
          sourceTarget: "moral_graph",
          requiredToolFamily: "moral_graph",
        },
        createdAt: Date.now(),
      },
    });

    const payload = buildHelixAskMinimalRuntimeTurnPayload({
      submitPlan,
      sessionId: "thread-concept-no-run",
      traceId: "trace-concept-no-run",
      turnId: "turn-concept-no-run",
      maxTokens: 1000,
    });

    expect(payload).toMatchObject({ question });
    expect(payload?.requiresBackendAskEntrypoint).toBeUndefined();
    expect(payload?.requires_backend_ask_entrypoint).toBeUndefined();
    expect(payload?.forceReasoningDispatch).toBeUndefined();
    expect(payload?.force_reasoning_dispatch).toBeUndefined();
    expect(payload?.routeMetadata).toBeUndefined();
    expect(payload?.route_metadata).toBeUndefined();
    expect(payload?.ask_entrypoint_required).toBeUndefined();
    expect(payload?.hard_backend_entrypoint_required).toBeUndefined();
    expect(payload?.backend_ask_call_attempted).toBeUndefined();
    expect(payload?.mandatory_next_tool_name).toBeUndefined();
  });
});
