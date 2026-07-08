import { describe, expect, it } from "vitest";

import {
  buildHelixAskHardBackendEntrypointRouteMetadata,
  requiresHelixAskBackendEntrypoint,
  resolveHelixAskBackendEntrypointFamily,
} from "../HelixAskBackendEntrypointPolicy";
import { buildHelixAskMinimalRuntimeSubmitPlan } from "../HelixAskMinimalRuntimeSubmitPlan";
import { buildHelixAskMinimalRuntimeTurnPayload } from "../HelixAskMinimalRuntimeTransport";

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
});
