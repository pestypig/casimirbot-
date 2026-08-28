import {
  isRealtimeTexturePackHarnessAction,
  type RealtimeTexturePackHarnessAction,
} from "@shared/realtime-texture-pack-harness";
import type { HelixWorkstationCapabilityManifest } from "./types";
import { realtimeTexturePackHarnessStore } from "./realtime-texture-pack-harness-store";

export const REALTIME_TEXTURE_PACK_HARNESS_CAPABILITY_PREFIX =
  "realtime_texture_pack." as const;
export const REALTIME_TEXTURE_PACK_HARNESS_CAPABILITIES = new Set([
  "realtime_texture_pack.inspect",
  "realtime_texture_pack.show_overlay",
  "realtime_texture_pack.reveal_original",
  "realtime_texture_pack.stop",
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
}) => {
  const profileId = input.profileId?.trim();
  if (!profileId) return failure("trusted_profile_required", null);
  const action = input.capabilityId.slice(REALTIME_TEXTURE_PACK_HARNESS_CAPABILITY_PREFIX.length);
  if (action === "inspect") {
    const harness = realtimeTexturePackHarnessStore.inspect(profileId);
    return {
      ok: true as const,
      status: "completed" as const,
      summary: harness.lease_active
        ? "Realtime Texture Pack agent control lease is active."
        : "Realtime Texture Pack agent control lease is inactive.",
      observation: { harness, requested_state_observed: true, assistant_answer: false, terminal_eligible: false, raw_content_included: false },
    };
  }
  if (!isRealtimeTexturePackHarnessAction(action)) {
    return failure("unsupported_control_action", realtimeTexturePackHarnessStore.inspect(profileId));
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
