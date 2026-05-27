import { describe, expect, it } from "vitest";

import type { HelixRawToolResult, HelixRuntimeToolCallV1 } from "@shared/helix-agent-step-observation-packet";
import {
  buildSituationRoomLiveJobObservationPacket,
} from "../services/helix-ask/tool-router/helix-tool-observation-packet";

const makeCall = (action = "construct.create_from_recipe"): HelixRuntimeToolCallV1 => ({
  schema: "helix.runtime_tool_call.v1",
  call_id: "call:dottie",
  turn_id: "turn:dottie",
  decision_id: "decision:dottie",
  capability_key: `situation-room-pipelines.${action}`,
  panel_id: "situation-room-pipelines",
  action,
  runtime_shape: "run_panel_action",
  args: {},
  validation: { ok: true, violations: [] },
  policy: {
    mutating: true,
    manual_only: false,
    explicit_attachment_only: false,
    confirmation_required: false,
    terminal_eligible: false,
  },
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

describe("Situation Room live-job observation re-entry packets", () => {
  it("observationizes a blocked Dottie live-job receipt without preserving panel prose", () => {
    const result: HelixRawToolResult = {
      ok: true,
      summary: "Created Situation Room construct recipe auntie_dottie_witness.",
      raw: {
        artifact: {
          live_job_contract: {
            schema: "helix.situation_room_live_job_contract.v1",
            contract_id: "contract:dottie",
            turn_id: "turn:dottie",
            name: "Auntie Dottie Minecraft Watch",
            purpose: "voice_witness",
            selected_recipe: "auntie_dottie_minecraft_watch",
            operating_prompt: "Watch my Minecraft route while I play.",
            operating_prompt_history: [],
            compiled_policy: { trigger_rules: [], stop_conditions: [] },
            source_requirements: [{
              source_kind: "minecraft_world_events",
              required: true,
              status: "missing",
              missing_reason: "Minecraft source is not connected.",
            }],
            output_bindings: [],
            voice_policy: "propose_only",
            authority_policy: {
              assistant_answer: false,
              construct_answer_authority: "witness_only",
              helix_ask_terminal_authority_required: true,
            },
            runtime_status: "blocked",
            diagnostics: [],
            assistant_answer: false,
            raw_content_included: false,
          },
          construct_observation: {
            schema: "helix.situation_room_construct_observation.v1",
            observation_id: "observation:dottie",
            turn_id: "turn:dottie",
            action: "construct.create_from_recipe",
            live_job_contract_ref: "contract:dottie",
            construct_ids: ["construct:dottie"],
            created_constructs: [{
              construct_id: "construct:dottie",
              name: "Auntie Dottie",
              role: "observer",
              authority: "witness_only",
              status: "blocked",
            }],
            missing_inputs: ["minecraft_world_events"],
            policy_state: {
              voice_policy: "propose_only",
              spoken: false,
              confirm_speak_receipt_present: false,
              output_authority: "proposal",
            },
            output_bindings: ["typed_commentary", "voice_proposal"],
            source_status: [{
              source_kind: "minecraft_world_events",
              status: "missing",
              message: "Minecraft source is not connected.",
            }],
            diagnostics: [],
            terminal_eligible: false,
            panel_generated_answer: false,
            next_step_authority: "agent_step_decision",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      },
    };

    const packet = buildSituationRoomLiveJobObservationPacket({
      turnId: "turn:dottie",
      iteration: 1,
      call: makeCall(),
      result,
    });

    expect(packet.schema).toBe("helix.agent_step_observation_packet.v1");
    expect(packet.status).toBe("missing_input");
    expect(packet.terminal_eligible).toBe(false);
    expect(packet.post_tool_model_step_required).toBe(true);
    expect(packet.assistant_answer).toBe(false);
    expect(packet.observation_summary).toContain("Live job status: blocked");
    expect(packet.observation_summary).toContain("Voice policy: propose_only");
    expect(packet.observation_summary).toContain("spoken: false");
    expect(packet.observation_summary).toContain("source:minecraft_world_events");
    expect(packet.observation_summary).not.toContain("Created Situation Room construct recipe");
    expect(packet.produced_artifact_refs).toEqual(expect.arrayContaining([
      "contract:dottie",
      "observation:dottie",
      "construct:dottie",
    ]));
    expect(packet.missing_requirements).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "source:minecraft_world_events" }),
    ]));
  });

  it("marks confirm-speak receipts as spoken only on the confirm action", () => {
    const packet = buildSituationRoomLiveJobObservationPacket({
      turnId: "turn:dottie",
      iteration: 2,
      call: makeCall("voice_delivery.confirm_speak"),
      result: {
        ok: true,
        raw: {
          artifact: {
            construct_observation: {
              schema: "helix.situation_room_construct_observation.v1",
              observation_id: "observation:spoken",
              turn_id: "turn:dottie",
              action: "voice_delivery.confirm_speak",
              construct_ids: [],
              created_constructs: [],
              missing_inputs: [],
              policy_state: {
                voice_policy: "confirm_speak_required",
                spoken: true,
                confirm_speak_receipt_present: true,
                output_authority: "confirmed_spoken",
              },
              output_bindings: ["voice_proposal"],
              source_status: [],
              diagnostics: [],
              terminal_eligible: false,
              panel_generated_answer: false,
              next_step_authority: "agent_step_decision",
              assistant_answer: false,
              raw_content_included: false,
            },
          },
        },
      },
    });

    expect(packet.status).toBe("succeeded");
    expect(packet.observation_summary).toContain("spoken: true");
    expect(packet.observation_summary).toContain("confirm-speak receipt: true");
    expect(packet.terminal_eligible).toBe(false);
  });
});
