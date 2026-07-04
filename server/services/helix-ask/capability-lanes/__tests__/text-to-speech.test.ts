import { beforeEach, describe, expect, it } from "vitest";
import {
  HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA,
  type HelixTextToSpeechOneShotRequest,
} from "@shared/helix-text-to-speech-lane";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { resetInterimVoiceCalloutsForTest } from "../../interim-voice-callout-store";
import { runTextToSpeechSpeakText } from "../text-to-speech";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

const request = (
  input: Partial<HelixTextToSpeechOneShotRequest>,
): HelixTextToSpeechOneShotRequest => ({
  schema: HELIX_TEXT_TO_SPEECH_ONE_SHOT_REQUEST_SCHEMA,
  capability: "text_to_speech.speak_text",
  text: "Read this governed lane receipt aloud.",
  voice: "calm",
  profile: null,
  locale: "en-US",
  requested_backend_provider: null,
  turn_id: "turn-text-to-speech",
  thread_id: "helix-ask:desktop",
  source_observation_ref: "ask:observation:source-text",
  assistant_answer: false,
  terminal_eligible: false,
  ...input,
});

beforeEach(() => {
  resetInterimVoiceCalloutsForTest();
});

describe("text_to_speech.speak_text lane", () => {
  it("returns a non-terminal playback receipt and client handoff observation", () => {
    const result = runTextToSpeechSpeakText({
      provider: buildProvider("codex"),
      request: request({ requested_backend_provider: "text_to_speech.elevenlabs" }),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      schema: "helix.text_to_speech.one_shot_result.v1",
      ok: true,
      lane_id: "text_to_speech",
      capability: "text_to_speech.speak_text",
      selected_runtime_agent_provider: "codex",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.lane_resolve_trace).toMatchObject({
      requested_lane: "text_to_speech",
      requested_backend_provider: "text_to_speech.elevenlabs",
      selected_backend_provider: "text_to_speech.existing_voice_service",
      selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
      availability_status: "dry_run",
      permission_status: "admitted",
      execution_status: "executed_observation_only",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.receipt).toMatchObject({
      schema: "helix.text_to_speech.receipt.v1",
      lane_id: "text_to_speech",
      tool: "text_to_speech.speak_text",
      capability: "text_to_speech.speak_text",
      selected_runtime_agent_provider: "codex",
      requested_backend_provider: "text_to_speech.elevenlabs",
      selected_backend_provider: "text_to_speech.existing_voice_service",
      playback_status: "pending",
      provider_playback_status: "awaiting_client_playback",
      playback_request_ref: expect.any(String),
      client_playback_receipt_ref: null,
      source_observation_ref: "ask:observation:source-text",
      voice_profile: "calm",
      locale: "en-US",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation).toBe(result.receipt);
    expect(result.observation_packet).toMatchObject({
      schema: "helix.agent_step_observation_packet.v1",
      capability_key: "text_to_speech.speak_text",
      action: "speak_text",
      status: "client_pending",
      receipts: [
        expect.objectContaining({
          receipt_ref: result.receipt?.receipt_ref,
          kind: "text_to_speech_playback",
          status: "pending",
        }),
      ],
      backend_selection_decision: expect.objectContaining({
        owner: "helix",
        outcome: "fallback_selected",
        selected_backend_provider: "text_to_speech.existing_voice_service",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        terminal_authority_owner: "helix",
      }),
      state_delta: {
        text_to_speech_receipt: expect.objectContaining({
          receipt_ref: result.receipt?.receipt_ref,
        }),
        text_to_speech_client_playback_handoff: expect.objectContaining({
          schema: "helix.interim_voice_callout_tool_result.v1",
          ok: true,
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          ask_context_policy: "evidence_only",
        }),
      },
      typed_handoff_contract: expect.objectContaining({
        produced_affordance_kinds: ["voice_playback_receipt"],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("fails closed without making a voice receipt when text is missing", () => {
    const result = runTextToSpeechSpeakText({
      provider: buildProvider("helix"),
      request: request({ text: "   " }),
      env: {} as NodeJS.ProcessEnv,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "missing_text",
      receipt: null,
      observation: null,
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.lane_resolve_trace).toMatchObject({
      execution_status: "not_executed_shadow_only",
      blocked_reason: "missing_text",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(result.observation_packet).toMatchObject({
      status: "missing_input",
      receipts: [],
      missing_requirements: [
        expect.objectContaining({
          code: "missing_text",
          repair_action: "provide_text",
        }),
      ],
      typed_handoff_contract: expect.objectContaining({
        produced_affordance_kinds: [],
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
