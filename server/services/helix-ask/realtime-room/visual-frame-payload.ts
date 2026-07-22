import crypto from "node:crypto";
import type { HelixSharedRealtimeRoomVisualSourceSurface } from "@shared/helix-shared-realtime-room";

export const HELIX_SHARED_ROOM_MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const HELIX_SHARED_ROOM_MAX_PREVIEW_BYTES = 256 * 1024;

const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i;
const SAFE_SOURCE_ID_PATTERN = /^[A-Za-z0-9._:-]{1,180}$/;
const SOURCE_SURFACES = new Set<HelixSharedRealtimeRoomVisualSourceSurface>([
  "browser_tab",
  "desktop_window",
  "screen_share_window",
  "device_camera",
  "manual_upload",
]);

export type NormalizedHelixSharedRoomVisualFramePayload = {
  sourceId: string;
  sourceSurface: HelixSharedRealtimeRoomVisualSourceSurface;
  capturedAt: string;
  sequence: number;
  imageDataUrl: string;
  imageHash: string;
  imageBytes: number;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  previewDataUrl: string | null;
  previewHash: string | null;
  previewBytes: number | null;
};

export class HelixSharedRoomVisualFramePayloadError extends Error {
  readonly code = "shared_realtime_room_visual_frame_invalid" as const;

  constructor(readonly reason: string) {
    super(reason);
    this.name = "HelixSharedRoomVisualFramePayloadError";
  }
}

const parseImageDataUrl = (input: unknown, maxBytes: number): {
  dataUrl: string;
  hash: string;
  bytes: number;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
} => {
  if (typeof input !== "string") {
    throw new HelixSharedRoomVisualFramePayloadError("image_data_url_required");
  }
  const match = DATA_URL_PATTERN.exec(input.trim());
  if (!match) {
    throw new HelixSharedRoomVisualFramePayloadError("image_data_url_invalid");
  }
  const mediaType = match[1].toLowerCase() as "image/jpeg" | "image/png" | "image/webp";
  const base64 = match[2].replace(/\s+/g, "");
  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    throw new HelixSharedRoomVisualFramePayloadError("image_base64_invalid");
  }
  if (bytes.length === 0 || bytes.length > maxBytes) {
    throw new HelixSharedRoomVisualFramePayloadError(
      bytes.length === 0 ? "image_empty" : "image_too_large",
    );
  }
  if (bytes.toString("base64").replace(/=+$/u, "") !== base64.replace(/=+$/u, "")) {
    throw new HelixSharedRoomVisualFramePayloadError("image_base64_invalid");
  }
  return {
    dataUrl: `data:${mediaType};base64,${base64}`,
    hash: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`,
    bytes: bytes.length,
    mediaType,
  };
};

const readCapturedAt = (value: unknown, nowMs: number): string => {
  const parsedMs = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (!Number.isFinite(parsedMs)) {
    throw new HelixSharedRoomVisualFramePayloadError("captured_at_invalid");
  }
  if (parsedMs > nowMs + 60_000 || parsedMs < nowMs - 24 * 60 * 60_000) {
    throw new HelixSharedRoomVisualFramePayloadError("captured_at_outside_window");
  }
  return new Date(parsedMs).toISOString();
};

export const normalizeHelixSharedRoomVisualFramePayload = (
  value: unknown,
  nowMs = Date.now(),
): NormalizedHelixSharedRoomVisualFramePayload => {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const sourceId = typeof record.source_id === "string" ? record.source_id.trim() : "";
  if (!SAFE_SOURCE_ID_PATTERN.test(sourceId)) {
    throw new HelixSharedRoomVisualFramePayloadError("source_id_invalid");
  }
  if (!SOURCE_SURFACES.has(record.source_surface as HelixSharedRealtimeRoomVisualSourceSurface)) {
    throw new HelixSharedRoomVisualFramePayloadError("source_surface_invalid");
  }
  const sequenceValue = Number(record.sequence);
  const sequence = Number.isFinite(sequenceValue) && sequenceValue >= 0
    ? Math.trunc(sequenceValue)
    : 0;
  const image = parseImageDataUrl(record.image_data_url, HELIX_SHARED_ROOM_MAX_IMAGE_BYTES);
  const preview = record.preview_data_url === undefined || record.preview_data_url === null
    ? image.bytes <= HELIX_SHARED_ROOM_MAX_PREVIEW_BYTES
      ? image
      : null
    : parseImageDataUrl(record.preview_data_url, HELIX_SHARED_ROOM_MAX_PREVIEW_BYTES);
  return {
    sourceId,
    sourceSurface: record.source_surface as HelixSharedRealtimeRoomVisualSourceSurface,
    capturedAt: readCapturedAt(record.captured_at, nowMs),
    sequence,
    imageDataUrl: image.dataUrl,
    imageHash: image.hash,
    imageBytes: image.bytes,
    mediaType: image.mediaType,
    previewDataUrl: preview?.dataUrl ?? null,
    previewHash: preview?.hash ?? null,
    previewBytes: preview?.bytes ?? null,
  };
};

