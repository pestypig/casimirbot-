export const REALTIME_TEXTURE_PACK_HARNESS_SCHEMA =
  "helix.realtime_texture_pack.harness.v1" as const;
export const REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS = 45_000;
export const REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_MAX_DIRECTIVE_LENGTH = 1_000;

export const REALTIME_TEXTURE_PACK_HARNESS_ACTIONS = [
  "show_overlay",
  "reveal_original",
  "stop",
] as const;

export type RealtimeTexturePackHarnessAction =
  (typeof REALTIME_TEXTURE_PACK_HARNESS_ACTIONS)[number];

export const REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS = [
  "set_visual_direction_profile",
  "set_custom_visual_directive",
  "set_dynamic_cue_policy",
  "pin_current_direction",
  "resume_dynamic_direction",
  "clear_agent_visual_direction",
] as const;

export type RealtimeTexturePackVisualDirectionCommandKind =
  (typeof REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS)[number];

export type RealtimeTexturePackVisualDirectionCommandArguments =
  | { command: "set_visual_direction_profile"; preset_id: "playable" | "painterly" | "custom" }
  | { command: "set_custom_visual_directive"; custom_visual_directive: string }
  | {
      command: "set_dynamic_cue_policy";
      enabled_cue_families: Array<
        "dimension" | "biome" | "time" | "weather" | "lighting" |
        "activity" | "hazards" | "focus" | "workflow"
      >;
    }
  | { command: "pin_current_direction" }
  | { command: "resume_dynamic_direction" }
  | { command: "clear_agent_visual_direction" };

export type RealtimeTexturePackHarnessVisualDirectionState = {
  control_enabled: boolean;
  mode: "static_prompt_only" | "environment_reactive";
  preset_id: "playable" | "painterly" | "custom";
  configuration_revision: number;
  pinned: boolean;
  enabled_cue_families: string[];
  selected_targets: Array<"native_shader" | "dynamic_material" | "resource_pack" | "overlay">;
  source_binding_id: string | null;
  source_binding_revision: number | null;
  environment_binding_id: string | null;
  compatibility_state: "supported" | "degraded" | "stale" | "incompatible" | "disconnected";
  cue_packet_id: string | null;
  prompt_revision_id: string | null;
  visual_treatment_revision_id: string | null;
  cue_state: "current_cue" | "static_fallback";
  fallback_reason: string | null;
};

export type RealtimeTexturePackHarnessClientState = {
  capture_active: boolean;
  overlay_visible: boolean;
  session_status: string;
  visual_direction?: RealtimeTexturePackHarnessVisualDirectionState;
};

export type RealtimeTexturePackHarnessCommand = {
  command_id: string;
  action: RealtimeTexturePackHarnessAction | RealtimeTexturePackVisualDirectionCommandKind;
  created_at: string;
  expected_configuration_revision?: number;
  arguments?: RealtimeTexturePackVisualDirectionCommandArguments;
};

export const isRealtimeTexturePackHarnessAction = (
  value: unknown,
): value is RealtimeTexturePackHarnessAction =>
  typeof value === "string" &&
  (REALTIME_TEXTURE_PACK_HARNESS_ACTIONS as readonly string[]).includes(value);

export const isRealtimeTexturePackVisualDirectionCommand = (
  value: unknown,
): value is RealtimeTexturePackVisualDirectionCommandKind =>
  typeof value === "string" &&
  (REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_COMMANDS as readonly string[]).includes(value);

const cueFamilies = [
  "dimension", "biome", "time", "weather", "lighting", "activity",
  "hazards", "focus", "workflow",
] as const;
const visualTargets = ["native_shader", "dynamic_material", "resource_pack", "overlay"] as const;
const exactKeys = (record: Record<string, unknown>, keys: string[]): boolean =>
  Object.keys(record).every((key) => keys.includes(key));

export const parseRealtimeTexturePackVisualDirectionCommandArguments = (
  value: unknown,
): RealtimeTexturePackVisualDirectionCommandArguments | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const command = record.command;
  if (!isRealtimeTexturePackVisualDirectionCommand(command)) return null;
  if (command === "set_visual_direction_profile") {
    if (!exactKeys(record, ["command", "preset_id"])) return null;
    return record.preset_id === "playable" || record.preset_id === "painterly" || record.preset_id === "custom"
      ? { command, preset_id: record.preset_id }
      : null;
  }
  if (command === "set_custom_visual_directive") {
    if (!exactKeys(record, ["command", "custom_visual_directive"]) ||
        typeof record.custom_visual_directive !== "string" ||
        record.custom_visual_directive.trim().length > REALTIME_TEXTURE_PACK_VISUAL_DIRECTION_MAX_DIRECTIVE_LENGTH) {
      return null;
    }
    return { command, custom_visual_directive: record.custom_visual_directive.trim() };
  }
  if (command === "set_dynamic_cue_policy") {
    if (!exactKeys(record, ["command", "enabled_cue_families"]) ||
        !Array.isArray(record.enabled_cue_families)) return null;
    const requested = new Set(record.enabled_cue_families);
    if (requested.size !== record.enabled_cue_families.length ||
        [...requested].some((entry) => !cueFamilies.includes(entry as typeof cueFamilies[number]))) return null;
    return {
      command,
      enabled_cue_families: cueFamilies.filter((entry) => requested.has(entry)),
    };
  }
  return exactKeys(record, ["command"]) ? { command } : null;
};

const cleanId = (value: unknown): string | null =>
  typeof value === "string" && /^[a-zA-Z0-9:._/-]{1,320}$/.test(value.trim())
    ? value.trim()
    : null;

export const sanitizeRealtimeTexturePackVisualDirectionState = (
  value: unknown,
): RealtimeTexturePackHarnessVisualDirectionState => {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const enabled = new Set(Array.isArray(record.enabled_cue_families) ? record.enabled_cue_families : []);
  const targets = new Set(Array.isArray(record.selected_targets) ? record.selected_targets : []);
  const configurationRevision = typeof record.configuration_revision === "number" &&
    Number.isInteger(record.configuration_revision) && record.configuration_revision >= 0
    ? record.configuration_revision
    : 0;
  const sourceBindingRevision = typeof record.source_binding_revision === "number" &&
    Number.isInteger(record.source_binding_revision) && record.source_binding_revision > 0
    ? record.source_binding_revision
    : null;
  const compatibility = ["supported", "degraded", "stale", "incompatible", "disconnected"].includes(String(record.compatibility_state))
    ? record.compatibility_state as RealtimeTexturePackHarnessVisualDirectionState["compatibility_state"]
    : "disconnected";
  return {
    control_enabled: record.control_enabled === true,
    mode: record.mode === "environment_reactive" ? "environment_reactive" : "static_prompt_only",
    preset_id: record.preset_id === "painterly" || record.preset_id === "custom"
      ? record.preset_id
      : "playable",
    configuration_revision: configurationRevision,
    pinned: record.pinned === true,
    enabled_cue_families: cueFamilies.filter((entry) => enabled.has(entry)),
    selected_targets: visualTargets.filter((entry) => targets.has(entry)),
    source_binding_id: cleanId(record.source_binding_id),
    source_binding_revision: sourceBindingRevision,
    environment_binding_id: cleanId(record.environment_binding_id),
    compatibility_state: compatibility,
    cue_packet_id: cleanId(record.cue_packet_id),
    prompt_revision_id: cleanId(record.prompt_revision_id),
    visual_treatment_revision_id: cleanId(record.visual_treatment_revision_id),
    cue_state: record.cue_state === "current_cue" ? "current_cue" : "static_fallback",
    fallback_reason: typeof record.fallback_reason === "string" && record.fallback_reason.trim()
      ? record.fallback_reason.trim().slice(0, 160)
      : null,
  };
};

export const sanitizeRealtimeTexturePackHarnessClientState = (
  value: unknown,
): RealtimeTexturePackHarnessClientState => {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    capture_active: record.capture_active === true,
    overlay_visible: record.overlay_visible === true,
    session_status:
      typeof record.session_status === "string" && record.session_status.trim()
        ? record.session_status.trim().slice(0, 80)
        : "unknown",
    ...(record.visual_direction
      ? { visual_direction: sanitizeRealtimeTexturePackVisualDirectionState(record.visual_direction) }
      : {}),
  };
};
