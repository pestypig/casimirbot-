import crypto from "node:crypto";
import {
  buildDefaultHelixSharedRealtimeRoomConsent,
  type HelixSharedRealtimeRoomConsent,
  type HelixSharedRealtimeRoomPresence,
  type HelixSharedRealtimeRoomRole,
  type HelixSharedRealtimeRoomStatus,
} from "@shared/helix-shared-realtime-room";
import { SharedRealtimeRoomDomainError } from "./domain-error";
import type { AuditMetadata, AuditMetadataValue, MemberRow } from "./types";

const DEFAULT_ROOM_TITLE = "Shared GPT Live";
const MAX_ROOM_TITLE_LENGTH = 120;
const DEFAULT_INVITE_TTL_MS = 15 * 60_000;
const MIN_INVITE_TTL_MS = 60_000;
const MAX_INVITE_TTL_MS = 24 * 60 * 60_000;

export const nowIso = (): string => new Date().toISOString();

export const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const isoOrNull = (value: Date | string | null | undefined): string | null =>
  value == null ? null : iso(value);

export const cleanRequired = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      `${field} is required.`,
    );
  }
  return normalized;
};

export const normalizeTitle = (value?: string | null): string => {
  const normalized = value?.trim() || DEFAULT_ROOM_TITLE;
  if (normalized.length > MAX_ROOM_TITLE_LENGTH) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      `Room titles are limited to ${MAX_ROOM_TITLE_LENGTH} characters.`,
    );
  }
  return normalized;
};

export const normalizeInviteTtl = (value?: number | null): number => {
  if (value == null) return DEFAULT_INVITE_TTL_MS;
  if (!Number.isFinite(value) || value <= 0) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "Invite lifetime must be a positive number of milliseconds.",
    );
  }
  return Math.max(MIN_INVITE_TTL_MS, Math.min(MAX_INVITE_TTL_MS, Math.floor(value)));
};

export const roomStatus = (value: string): HelixSharedRealtimeRoomStatus => {
  if (
    value === "waiting_for_consent" ||
    value === "ready" ||
    value === "active" ||
    value === "closed"
  ) {
    return value;
  }
  return "waiting_for_participant";
};

export const memberRole = (value: string): HelixSharedRealtimeRoomRole =>
  value === "owner" ? "owner" : "participant";

export const memberPresence = (value: string): HelixSharedRealtimeRoomPresence => {
  if (value === "away" || value === "left") return value;
  return "present";
};

export const SHARED_REALTIME_ROOM_PRESENCE_STALE_MS = 60_000;

export const effectiveMemberPresence = (
  member: Pick<MemberRow, "presence" | "last_seen_at">,
  nowMs = Date.now(),
): HelixSharedRealtimeRoomPresence => {
  const stored = memberPresence(member.presence);
  if (stored !== "present") return stored;
  const lastSeenMs = new Date(member.last_seen_at).getTime();
  return Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= SHARED_REALTIME_ROOM_PRESENCE_STALE_MS
    ? "present"
    : "away";
};

const jsonRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
};

export const normalizeConsent = (value: unknown): HelixSharedRealtimeRoomConsent => {
  const base = buildDefaultHelixSharedRealtimeRoomConsent();
  const record = jsonRecord(value);
  const version = typeof record.consent_version === "number" && Number.isInteger(record.consent_version)
    ? Math.max(0, record.consent_version)
    : 0;
  return {
    ...base,
    microphone_to_room: record.microphone_to_room === true,
    microphone_to_model: record.microphone_to_model === true,
    transcript_to_room: record.transcript_to_room === true,
    screen_to_model: record.screen_to_model === true,
    screen_thumbnail_to_room: record.screen_thumbnail_to_room === true,
    model_audio_output: record.model_audio_output === true,
    consent_version: version,
    consent_receipt_ref:
      typeof record.consent_receipt_ref === "string" && record.consent_receipt_ref.trim()
        ? record.consent_receipt_ref.trim()
        : null,
    updated_at:
      typeof record.updated_at === "string" && record.updated_at.trim()
        ? record.updated_at.trim()
        : null,
  };
};

export const normalizeAuditMetadata = (value: unknown): AuditMetadata => {
  const record = jsonRecord(value);
  const metadata: AuditMetadata = {};
  for (const [key, item] of Object.entries(record)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null ||
      (Array.isArray(item) && item.every((entry) => typeof entry === "string"))
    ) {
      metadata[key] = item as AuditMetadataValue;
    }
  }
  return metadata;
};

export const createId = (
  kind: "room" | "participant" | "invite" | "event" | "consent",
): string => `shared_realtime_${kind}:${crypto.randomUUID()}`;

export const createInviteCode = (): string =>
  `helix_live_${crypto.randomBytes(24).toString("base64url")}`;

export const hashInviteCode = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const isUniqueViolation = (error: unknown): boolean =>
  Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505",
  );
