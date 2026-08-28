export const REALTIME_TEXTURE_PACK_HARNESS_SCHEMA =
  "helix.realtime_texture_pack.harness.v1" as const;
export const REALTIME_TEXTURE_PACK_HARNESS_LEASE_TTL_MS = 45_000;

export const REALTIME_TEXTURE_PACK_HARNESS_ACTIONS = [
  "show_overlay",
  "reveal_original",
  "stop",
] as const;

export type RealtimeTexturePackHarnessAction =
  (typeof REALTIME_TEXTURE_PACK_HARNESS_ACTIONS)[number];

export type RealtimeTexturePackHarnessClientState = {
  capture_active: boolean;
  overlay_visible: boolean;
  session_status: string;
};

export type RealtimeTexturePackHarnessCommand = {
  command_id: string;
  action: RealtimeTexturePackHarnessAction;
  created_at: string;
};

export const isRealtimeTexturePackHarnessAction = (
  value: unknown,
): value is RealtimeTexturePackHarnessAction =>
  typeof value === "string" &&
  (REALTIME_TEXTURE_PACK_HARNESS_ACTIONS as readonly string[]).includes(value);

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
  };
};

