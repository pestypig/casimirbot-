export const REALTIME_TEXTURE_PACK_CONFIG_SCHEMA =
  "casimir.realtime_texture_pack.config.v1" as const;
export const REALTIME_TEXTURE_PACK_TRANSFORM_REQUEST_SCHEMA =
  "casimir.realtime_texture_pack.transform_request.v1" as const;
export const REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA =
  "casimir.realtime_texture_pack.projection_frame.v1" as const;
export const REALTIME_TEXTURE_PACK_SESSION_STATE_SCHEMA =
  "casimir.realtime_texture_pack.session_state.v1" as const;

export const REALTIME_TEXTURE_PACK_BASELINE_FPS = 1 as const;
export const REALTIME_TEXTURE_PACK_BASELINE_WIDTH = 512 as const;
export const REALTIME_TEXTURE_PACK_BASELINE_HEIGHT = 288 as const;
export const REALTIME_TEXTURE_PACK_BASELINE_STALE_AFTER_MS = 2_500 as const;
export const REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH = 2_000 as const;
export const REALTIME_TEXTURE_PACK_MAX_FRAME_DATA_URL_BYTES = 2 * 1024 * 1024;

export const REALTIME_TEXTURE_PACK_PRESETS = [
  {
    id: "playable",
    version: "realtime_texture_pack.playable.v1",
    label: "Playable",
    prompt: "Preserve geometry, silhouettes, navigation landmarks, and readable HUD regions while applying a restrained coherent game-art treatment.",
  },
  {
    id: "painterly",
    version: "realtime_texture_pack.painterly.v1",
    label: "Painterly",
    prompt: "Render the scene as a coherent painterly environment while preserving composition and large-scale geometry.",
  },
  {
    id: "custom",
    version: "realtime_texture_pack.custom.v1",
    label: "Custom",
    prompt: "Preserve the source composition and apply the user's requested visual treatment.",
  },
] as const;

export type RealtimeTexturePackPresetId =
  (typeof REALTIME_TEXTURE_PACK_PRESETS)[number]["id"];
export type RealtimeTexturePackSourceOrigin = "browser_getDisplayMedia";
export type RealtimeTexturePackSourceSurface =
  | "window"
  | "screen"
  | "browser_tab";
export type RealtimeTexturePackProviderState =
  | "local_only"
  | "api_not_connected"
  | "connected"
  | "error";
export type RealtimeTexturePackSessionStatus =
  | "idle"
  | "source_selected"
  | "previewing"
  | "overlay_active"
  | "reveal_original"
  | "degraded"
  | "stopped"
  | "error";

export type RealtimeTexturePackConfigV1 = {
  schema: typeof REALTIME_TEXTURE_PACK_CONFIG_SCHEMA;
  session_id: string;
  source_id: string;
  source_origin: RealtimeTexturePackSourceOrigin;
  source_surface: RealtimeTexturePackSourceSurface;
  preset_id: RealtimeTexturePackPresetId;
  custom_prompt: string;
  requested_fps: number;
  source_width: number;
  source_height: number;
  stale_after_ms: number;
  provider_id: string;
  authoritative: false;
  authority_class: "non_authoritative_projection";
};

export type RealtimeTexturePackTransformRequestV1 = {
  schema: typeof REALTIME_TEXTURE_PACK_TRANSFORM_REQUEST_SCHEMA;
  request_id: string;
  session_id: string;
  source_frame_id: string;
  source_captured_at: string;
  source_image_data_url: string;
  prompt: string;
  preset_id: RealtimeTexturePackPresetId;
  preset_version: string;
  requested_output: {
    width: number;
    height: number;
  };
  authoritative: false;
  authority_class: "non_authoritative_projection_input";
};

export type RealtimeTexturePackProjectionFrameV1 = {
  schema: typeof REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA;
  projection_frame_id: string;
  request_id: string;
  session_id: string;
  source_frame_id: string;
  source_captured_at: string;
  projection_completed_at: string;
  projection_image_data_url: string;
  provider_id: string;
  provider_model: string;
  authoritative: false;
  authority_class: "non_authoritative_projection";
  interpolated: boolean;
};

export type RealtimeTexturePackSessionStateV1 = {
  schema: typeof REALTIME_TEXTURE_PACK_SESSION_STATE_SCHEMA;
  session_id: string;
  status: RealtimeTexturePackSessionStatus;
  overlay_visible: boolean;
  capture_active: boolean;
  provider_state: RealtimeTexturePackProviderState;
  last_source_frame_id: string | null;
  last_projection_frame_id: string | null;
  frame_age_ms: number | null;
  dropped_frame_count: number;
  failure_reason: string | null;
  authoritative: false;
  authority_class: "non_authoritative_projection_state";
};

export type RealtimeTexturePackProviderV1 = {
  readonly provider_id: string;
  transform(
    request: RealtimeTexturePackTransformRequestV1,
  ): Promise<RealtimeTexturePackProjectionFrameV1>;
};

type RealtimeTexturePackConfigInput = {
  sessionId: string;
  sourceId: string;
  sourceSurface: RealtimeTexturePackSourceSurface;
  presetId?: RealtimeTexturePackPresetId;
  customPrompt?: string;
  providerId?: string;
};

const requireBoundedId = (value: unknown, field: string): string => {
  if (typeof value !== "string") throw new Error(`${field}_required`);
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field}_required`);
  if (normalized.length > 200) throw new Error(`${field}_too_long`);
  return normalized;
};

const requireIsoTimestamp = (value: unknown, field: string): string => {
  const timestamp = requireBoundedId(value, field);
  if (!Number.isFinite(Date.parse(timestamp))) throw new Error(`${field}_invalid`);
  return timestamp;
};

const requireImageDataUrl = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)) {
    throw new Error(`${field}_invalid`);
  }
  if (value.length > REALTIME_TEXTURE_PACK_MAX_FRAME_DATA_URL_BYTES) {
    throw new Error(`${field}_too_large`);
  }
  return value;
};

const requireFalseAuthority = (
  authoritative: unknown,
  authorityClass: unknown,
  expectedClass: string,
): void => {
  if (authoritative !== false || authorityClass !== expectedClass) {
    throw new Error("realtime_texture_pack_authority_claim_rejected");
  }
};

export const getRealtimeTexturePackPreset = (
  presetId: RealtimeTexturePackPresetId,
) => {
  const preset = REALTIME_TEXTURE_PACK_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error("realtime_texture_pack_preset_invalid");
  return preset;
};

export const buildRealtimeTexturePackPrompt = (
  presetId: RealtimeTexturePackPresetId,
  customPrompt = "",
): string => {
  const preset = getRealtimeTexturePackPreset(presetId);
  const custom = customPrompt.trim();
  if (custom.length > REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH) {
    throw new Error("realtime_texture_pack_prompt_too_long");
  }
  return custom ? `${preset.prompt}\nUser treatment: ${custom}` : preset.prompt;
};

export const buildRealtimeTexturePackConfig = (
  input: RealtimeTexturePackConfigInput,
): RealtimeTexturePackConfigV1 => {
  const presetId = input.presetId ?? "playable";
  getRealtimeTexturePackPreset(presetId);
  const customPrompt = input.customPrompt?.trim() ?? "";
  if (customPrompt.length > REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH) {
    throw new Error("realtime_texture_pack_prompt_too_long");
  }
  return {
    schema: REALTIME_TEXTURE_PACK_CONFIG_SCHEMA,
    session_id: requireBoundedId(input.sessionId, "session_id"),
    source_id: requireBoundedId(input.sourceId, "source_id"),
    source_origin: "browser_getDisplayMedia",
    source_surface: input.sourceSurface,
    preset_id: presetId,
    custom_prompt: customPrompt,
    requested_fps: REALTIME_TEXTURE_PACK_BASELINE_FPS,
    source_width: REALTIME_TEXTURE_PACK_BASELINE_WIDTH,
    source_height: REALTIME_TEXTURE_PACK_BASELINE_HEIGHT,
    stale_after_ms: REALTIME_TEXTURE_PACK_BASELINE_STALE_AFTER_MS,
    provider_id: requireBoundedId(input.providerId ?? "local_passthrough", "provider_id"),
    authoritative: false,
    authority_class: "non_authoritative_projection",
  };
};

export const buildRealtimeTexturePackTransformRequest = (input: {
  config: RealtimeTexturePackConfigV1;
  requestId: string;
  sourceFrameId: string;
  sourceCapturedAt: string;
  sourceImageDataUrl: string;
}): RealtimeTexturePackTransformRequestV1 => {
  parseRealtimeTexturePackConfig(input.config);
  const preset = getRealtimeTexturePackPreset(input.config.preset_id);
  return {
    schema: REALTIME_TEXTURE_PACK_TRANSFORM_REQUEST_SCHEMA,
    request_id: requireBoundedId(input.requestId, "request_id"),
    session_id: input.config.session_id,
    source_frame_id: requireBoundedId(input.sourceFrameId, "source_frame_id"),
    source_captured_at: requireIsoTimestamp(input.sourceCapturedAt, "source_captured_at"),
    source_image_data_url: requireImageDataUrl(input.sourceImageDataUrl, "source_image_data_url"),
    prompt: buildRealtimeTexturePackPrompt(input.config.preset_id, input.config.custom_prompt),
    preset_id: input.config.preset_id,
    preset_version: preset.version,
    requested_output: {
      width: input.config.source_width,
      height: input.config.source_height,
    },
    authoritative: false,
    authority_class: "non_authoritative_projection_input",
  };
};

export const buildLocalPassthroughProjectionFrame = (input: {
  request: RealtimeTexturePackTransformRequestV1;
  projectionFrameId: string;
  completedAt: string;
}): RealtimeTexturePackProjectionFrameV1 => {
  parseRealtimeTexturePackTransformRequest(input.request);
  return {
    schema: REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA,
    projection_frame_id: requireBoundedId(input.projectionFrameId, "projection_frame_id"),
    request_id: input.request.request_id,
    session_id: input.request.session_id,
    source_frame_id: input.request.source_frame_id,
    source_captured_at: input.request.source_captured_at,
    projection_completed_at: requireIsoTimestamp(input.completedAt, "projection_completed_at"),
    projection_image_data_url: input.request.source_image_data_url,
    provider_id: "local_passthrough",
    provider_model: "local_copy_v1",
    authoritative: false,
    authority_class: "non_authoritative_projection",
    interpolated: false,
  };
};

export const parseRealtimeTexturePackConfig = (
  value: RealtimeTexturePackConfigV1,
): RealtimeTexturePackConfigV1 => {
  if (value?.schema !== REALTIME_TEXTURE_PACK_CONFIG_SCHEMA) {
    throw new Error("realtime_texture_pack_config_schema_invalid");
  }
  requireBoundedId(value.session_id, "session_id");
  requireBoundedId(value.source_id, "source_id");
  requireBoundedId(value.provider_id, "provider_id");
  getRealtimeTexturePackPreset(value.preset_id);
  if (value.requested_fps !== REALTIME_TEXTURE_PACK_BASELINE_FPS) {
    throw new Error("realtime_texture_pack_fps_out_of_scope");
  }
  if (
    value.source_width !== REALTIME_TEXTURE_PACK_BASELINE_WIDTH ||
    value.source_height !== REALTIME_TEXTURE_PACK_BASELINE_HEIGHT
  ) {
    throw new Error("realtime_texture_pack_dimensions_out_of_scope");
  }
  if (value.stale_after_ms !== REALTIME_TEXTURE_PACK_BASELINE_STALE_AFTER_MS) {
    throw new Error("realtime_texture_pack_freshness_out_of_scope");
  }
  requireFalseAuthority(value.authoritative, value.authority_class, "non_authoritative_projection");
  buildRealtimeTexturePackPrompt(value.preset_id, value.custom_prompt);
  return value;
};

export const parseRealtimeTexturePackTransformRequest = (
  value: RealtimeTexturePackTransformRequestV1,
): RealtimeTexturePackTransformRequestV1 => {
  if (value?.schema !== REALTIME_TEXTURE_PACK_TRANSFORM_REQUEST_SCHEMA) {
    throw new Error("realtime_texture_pack_request_schema_invalid");
  }
  requireBoundedId(value.request_id, "request_id");
  requireBoundedId(value.session_id, "session_id");
  requireBoundedId(value.source_frame_id, "source_frame_id");
  requireIsoTimestamp(value.source_captured_at, "source_captured_at");
  requireImageDataUrl(value.source_image_data_url, "source_image_data_url");
  getRealtimeTexturePackPreset(value.preset_id);
  if (value.prompt.length > REALTIME_TEXTURE_PACK_MAX_PROMPT_LENGTH + 400) {
    throw new Error("realtime_texture_pack_prompt_too_long");
  }
  if (
    value.requested_output.width !== REALTIME_TEXTURE_PACK_BASELINE_WIDTH ||
    value.requested_output.height !== REALTIME_TEXTURE_PACK_BASELINE_HEIGHT
  ) {
    throw new Error("realtime_texture_pack_dimensions_out_of_scope");
  }
  requireFalseAuthority(
    value.authoritative,
    value.authority_class,
    "non_authoritative_projection_input",
  );
  return value;
};

export const parseRealtimeTexturePackProjectionFrame = (
  value: RealtimeTexturePackProjectionFrameV1,
): RealtimeTexturePackProjectionFrameV1 => {
  if (value?.schema !== REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA) {
    throw new Error("realtime_texture_pack_projection_schema_invalid");
  }
  requireBoundedId(value.projection_frame_id, "projection_frame_id");
  requireBoundedId(value.request_id, "request_id");
  requireBoundedId(value.session_id, "session_id");
  requireBoundedId(value.source_frame_id, "source_frame_id");
  requireIsoTimestamp(value.source_captured_at, "source_captured_at");
  requireIsoTimestamp(value.projection_completed_at, "projection_completed_at");
  requireImageDataUrl(value.projection_image_data_url, "projection_image_data_url");
  requireBoundedId(value.provider_id, "provider_id");
  requireBoundedId(value.provider_model, "provider_model");
  requireFalseAuthority(value.authoritative, value.authority_class, "non_authoritative_projection");
  return value;
};

export const buildRealtimeTexturePackSessionState = (input: {
  sessionId: string;
  status?: RealtimeTexturePackSessionStatus;
}): RealtimeTexturePackSessionStateV1 => ({
  schema: REALTIME_TEXTURE_PACK_SESSION_STATE_SCHEMA,
  session_id: requireBoundedId(input.sessionId, "session_id"),
  status: input.status ?? "idle",
  overlay_visible: false,
  capture_active: false,
  provider_state: "local_only",
  last_source_frame_id: null,
  last_projection_frame_id: null,
  frame_age_ms: null,
  dropped_frame_count: 0,
  failure_reason: null,
  authoritative: false,
  authority_class: "non_authoritative_projection_state",
});

export const createLocalPassthroughRealtimeTexturePackProvider = (): RealtimeTexturePackProviderV1 => ({
  provider_id: "local_passthrough",
  transform: async (request) => buildLocalPassthroughProjectionFrame({
    request,
    projectionFrameId: `projection:${request.request_id}`,
    completedAt: new Date().toISOString(),
  }),
});
