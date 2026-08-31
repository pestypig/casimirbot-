import {
  REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS,
  isRealtimeTexturePackHarnessAction,
  isRealtimeTexturePackVisualDirectionCommand,
  parseRealtimeTexturePackVisualDirectionCommandArguments,
  type RealtimeTexturePackHarnessAction,
  type RealtimeTexturePackVisualDirectionCommandKind,
} from "@shared/realtime-texture-pack-harness";
import type { HelixWorkstationCapabilityManifest } from "./types";
import { realtimeTexturePackHarnessStore } from "./realtime-texture-pack-harness-store";
import { inspectAttendedFalControlProjection } from "../../realtime-texture-pack/attended-fal-runtime";

export const REALTIME_TEXTURE_PACK_HARNESS_CAPABILITY_PREFIX =
  "realtime_texture_pack." as const;
export const REALTIME_TEXTURE_PACK_HARNESS_CAPABILITIES = new Set([
  "realtime_texture_pack.inspect",
  "realtime_texture_pack.show_overlay",
  "realtime_texture_pack.reveal_original",
  "realtime_texture_pack.stop",
  ...REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.map(
    (command) => `realtime_texture_pack.${command}`,
  ),
]);

const base = {
  schema: "helix.workstation_tool_gateway.capability.v1" as const,
  panel_id: "image-lens",
  code_mutation: false as const,
  shell_access: false as const,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  post_tool_model_step_required: true as const,
  input_schema: { type: "object", additionalProperties: false, properties: {} },
  output_observation_schema: "helix.realtime_texture_pack.harness.v1",
  observation_schema: "helix.realtime_texture_pack.harness.v1",
  assistant_answer: false as const,
  raw_content_included: false as const,
};

export const realtimeTexturePackHarnessManifests: HelixWorkstationCapabilityManifest[] = [
  {
    ...base,
    capability_id: "realtime_texture_pack.inspect",
    label: "Inspect Realtime Texture Pack harness",
    description: "Reads the sanitized state of the current developer-enabled Image Lens control lease. It exposes no pixels or prompt text.",
    action_id: "realtime_texture_pack.inspect",
    mode: "observe",
    mutating: false,
    permission_profile_required: "observe",
    safety_tags: ["developer_only", "read_only", "receipt_only", "no_pixels", "non_terminal"],
  },
  ...(["show_overlay", "reveal_original", "stop"] as RealtimeTexturePackHarnessAction[]).map((action) => ({
    ...base,
    capability_id: `realtime_texture_pack.${action}`,
    label: `${action === "show_overlay" ? "Show" : action === "reveal_original" ? "Reveal original for" : "Stop"} Realtime Texture Pack`,
    description: `Queues ${action} for the currently captured source only when Image Lens has an active user-enabled control lease. It cannot start capture or select a source.`,
    action_id: `realtime_texture_pack.${action}`,
    mode: "act" as const,
    mutating: true,
    permission_profile_required: "act" as const,
    safety_tags: ["developer_only", "affirmative_operator_command_required", "active_user_lease_required", "no_capture_start", "receipt_only", "non_terminal"],
  })),
  ...REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS.map((command) => ({
    ...base,
    capability_id: `realtime_texture_pack.${command}`,
    label: command.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
    description: "Queues one bounded visual-direction configuration change for the existing capture. It cannot select sources/providers, arm billing, inspect pixels, retrieve prompt bodies, or steer the environment.",
    action_id: `realtime_texture_pack.${command}`,
    mode: "act" as const,
    mutating: true,
    permission_profile_required: "act" as const,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        expected_configuration_revision: { type: "integer", minimum: 0 },
        ...(command === "set_visual_direction_profile"
          ? { preset_id: { type: "string", enum: ["playable", "painterly", "custom"] } }
          : {}),
        ...(command === "set_custom_visual_directive"
          ? { custom_visual_directive: { type: "string", maxLength: 1_000 } }
          : {}),
        ...(command === "set_dynamic_cue_policy"
          ? { enabled_cue_families: { type: "array", uniqueItems: true, items: { type: "string", enum: ["dimension", "biome", "time", "weather", "lighting", "activity", "hazards", "focus", "workflow"] } } }
          : {}),
      },
      required: [
        "expected_configuration_revision",
        ...(command === "set_visual_direction_profile" ? ["preset_id"] : []),
        ...(command === "set_custom_visual_directive" ? ["custom_visual_directive"] : []),
        ...(command === "set_dynamic_cue_policy" ? ["enabled_cue_families"] : []),
      ],
    },
    safety_tags: [
      "developer_only",
      "affirmative_operator_command_required",
      "active_visual_direction_lease_required",
      "monotonic_configuration_revision",
      "no_prompt_body_receipt",
      "no_capture_or_billing_authority",
      "receipt_only",
      "non_terminal",
    ],
  })),
];

const failure = (error: string, harness: unknown) => ({
  ok: false as const,
  status: "blocked" as const,
  error,
  summary: `Realtime Texture Pack control blocked: ${error}.`,
  observation: { harness, requested_state_observed: false, assistant_answer: false, terminal_eligible: false, raw_content_included: false },
});

export const executeRealtimeTexturePackHarnessGatewayCapability = (input: {
  capabilityId: string;
  profileId?: string | null;
  arguments?: Record<string, unknown>;
}) => {
  const profileId = input.profileId?.trim();
  if (!profileId) return failure("trusted_profile_required", null);
  const action = input.capabilityId.slice(REALTIME_TEXTURE_PACK_HARNESS_CAPABILITY_PREFIX.length);
  if (action === "inspect") {
    const harness = realtimeTexturePackHarnessStore.inspect(profileId);
    const attendedProvider = inspectAttendedFalControlProjection(profileId);
    return {
      ok: true as const,
      status: "completed" as const,
      summary: harness.lease_active
        ? "Realtime Texture Pack agent control lease is active."
        : "Realtime Texture Pack agent control lease is inactive.",
      observation: {
        harness,
        attended_provider: attendedProvider,
        requested_state_observed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
    };
  }
  if (!isRealtimeTexturePackHarnessAction(action)) {
    if (!isRealtimeTexturePackVisualDirectionCommand(action)) {
      return failure("unsupported_control_action", realtimeTexturePackHarnessStore.inspect(profileId));
    }
    const expectedRevision = input.arguments?.expected_configuration_revision;
    const commandArguments = parseRealtimeTexturePackVisualDirectionCommandArguments({
      command: action as RealtimeTexturePackVisualDirectionCommandKind,
      ...(action === "set_visual_direction_profile"
        ? { preset_id: input.arguments?.preset_id }
        : {}),
      ...(action === "set_custom_visual_directive"
        ? { custom_visual_directive: input.arguments?.custom_visual_directive }
        : {}),
      ...(action === "set_dynamic_cue_policy"
        ? { enabled_cue_families: input.arguments?.enabled_cue_families }
        : {}),
    });
    if (!commandArguments || typeof expectedRevision !== "number" || !Number.isInteger(expectedRevision)) {
      return failure("visual_direction_command_arguments_invalid", realtimeTexturePackHarnessStore.inspect(profileId));
    }
    const queued = realtimeTexturePackHarnessStore.enqueueVisualDirection({
      profileId,
      arguments: commandArguments,
      expectedConfigurationRevision: expectedRevision,
    });
    if (!queued.ok) return failure(queued.error, queued.harness);
    return {
      ok: true as const,
      status: "queued" as const,
      summary: `Realtime Texture Pack ${action} command queued for Image Lens acknowledgement.`,
      observation: {
        command_receipt: queued.receipt,
        harness: queued.harness,
        requested_state_observed: false,
        queued_receipt_not_execution_proof: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
    };
  }
  const result = realtimeTexturePackHarnessStore.enqueue(profileId, action);
  if (!result.ok) return failure(result.error, result.harness);
  return {
    ok: true as const,
    status: "queued" as const,
    summary: `Realtime Texture Pack ${action} command queued for Image Lens acknowledgement.`,
    observation: {
      command: result.command,
      harness: result.harness,
      requested_state_observed: false,
      queued_receipt_not_execution_proof: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    },
  };
};
