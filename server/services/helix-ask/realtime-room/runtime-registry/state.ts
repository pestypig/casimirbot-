import crypto from "node:crypto";
import type {
  HelixSharedRealtimeRoomErrorCode,
  HelixSharedRealtimeRoomRuntime,
  HelixSharedRealtimeRoomTransportOwner,
  HelixSharedRealtimeRoomVisualFrame,
} from "@shared/helix-shared-realtime-room";

export const SHARED_REALTIME_ROOM_FRAME_TTL_MS = 10 * 60_000;
export const SHARED_REALTIME_ROOM_THUMBNAIL_TTL_MS = 2 * 60_000;
export const SHARED_REALTIME_ROOM_MAX_VISUAL_FRAMES = 20;
export const SHARED_REALTIME_ROOM_MAX_PROVIDER_ITEMS = 6;
export const SHARED_REALTIME_ROOM_MAX_THUMBNAIL_CHARS = 512 * 1024;

export const DEFAULT_FLOOR_LEASE_MS = 5_000;
export const MIN_FLOOR_LEASE_MS = 1_000;
export const MAX_FLOOR_LEASE_MS = 15_000;

export type StoredVisualFrame = {
  frame: HelixSharedRealtimeRoomVisualFrame;
  expiresAtMs: number;
  providerItemId: string | null;
};

export type ProviderItemEntry = {
  itemId: string;
  frameRef: string;
};

export type ActiveSpeakerFloor = {
  participantId: string;
  epoch: number;
  acquiredAtMs: number;
  leaseExpiresAtMs: number;
};

export type RuntimeRecord = {
  roomId: string;
  runtime: HelixSharedRealtimeRoomRuntime;
  admittedRealtimeSessionId: string | null;
  providerCallId: string | null;
  boundRequesterRef: string | null;
  floor: ActiveSpeakerFloor | null;
  floorEpoch: number;
  frames: StoredVisualFrame[];
  providerItems: ProviderItemEntry[];
};

type RuntimeBindingOwner = {
  roomId: string;
  runtimeId: string;
};

const records = new Map<string, RuntimeRecord>();
const realtimeSessionBindings = new Map<string, RuntimeBindingOwner>();
const providerCallBindings = new Map<string, RuntimeBindingOwner>();

export const iso = (value: number): string => new Date(value).toISOString();

export const digest = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const hashRef = (
  kind: string,
  value: string | null | undefined,
): string | null => value ? `${kind}:sha256:${digest(value).slice(0, 24)}` : null;

export const readRef = (value: unknown, max = 260): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= max ? normalized : null;
};

export const readModel = (value: unknown): string | null => {
  const model = readRef(value, 128);
  return model && /^[A-Za-z0-9._:-]+$/.test(model) ? model : null;
};

export const cloneRuntime = (
  runtime: HelixSharedRealtimeRoomRuntime,
): HelixSharedRealtimeRoomRuntime => ({
  ...runtime,
  limitations: [...runtime.limitations],
});

const emptyRuntime = (nowMs: number): HelixSharedRealtimeRoomRuntime => ({
  runtime_id: null,
  state: "idle",
  topology: "single_shared_model",
  transport_owner: "unbound",
  model: null,
  active_speaker_participant_id: null,
  provider_session_ref_hash: null,
  realtime_session_ref_hash: null,
  reserved_by_participant_id: null,
  started_at: null,
  updated_at: iso(nowMs),
  limitations: ["shared_model_runtime_not_reserved"],
});

export const ensureRuntimeRecord = (roomId: string, nowMs: number): RuntimeRecord => {
  const existing = records.get(roomId);
  if (existing) return existing;
  const created: RuntimeRecord = {
    roomId,
    runtime: emptyRuntime(nowMs),
    admittedRealtimeSessionId: null,
    providerCallId: null,
    boundRequesterRef: null,
    floor: null,
    floorEpoch: 0,
    frames: [],
    providerItems: [],
  };
  records.set(roomId, created);
  return created;
};

export const transportLimitations = (
  transportOwner: Exclude<HelixSharedRealtimeRoomTransportOwner, "unbound">,
  active: boolean,
): string[] => transportOwner === "host_browser"
  ? [
      "host_browser_transport_is_one_provider_peer_not_room_media_fanout",
      "additional_participants_do_not_receive_provider_audio_until_room_media_bridge",
    ]
  : active
    ? ["room_media_bridge_is_transport_only_and_has_no_answer_authority"]
    : ["room_media_bridge_contract_reserved_not_started"];

export const releaseExpiredFloor = (record: RuntimeRecord, nowMs: number): void => {
  if (!record.floor || record.floor.leaseExpiresAtMs > nowMs) return;
  record.floor = null;
  record.runtime = {
    ...record.runtime,
    active_speaker_participant_id: null,
    updated_at: iso(nowMs),
  };
};

export const pruneFrames = (record: RuntimeRecord, nowMs: number): void => {
  record.frames = record.frames
    .filter((entry) => entry.expiresAtMs > nowMs)
    .map((entry) => {
      const previewExpiresAt = entry.frame.preview_expires_at
        ? Date.parse(entry.frame.preview_expires_at)
        : Number.NaN;
      if (
        !entry.frame.preview_data_url ||
        !Number.isFinite(previewExpiresAt) ||
        previewExpiresAt > nowMs
      ) {
        return entry;
      }
      return {
        ...entry,
        frame: {
          ...entry.frame,
          preview_data_url: null,
          raw_content_included: false,
        },
      };
    });
};

export const readRuntimeRecord = (
  roomId: unknown,
  nowMs = Date.now(),
): RuntimeRecord | null => {
  const normalized = readRef(roomId);
  if (!normalized) return null;
  const record = records.get(normalized) ?? null;
  if (!record) return null;
  releaseExpiredFloor(record, nowMs);
  pruneFrames(record, nowMs);
  return record;
};

export const runtimeResult = (
  record: RuntimeRecord | null,
  error: HelixSharedRealtimeRoomErrorCode | null,
  extra: Record<string, unknown> = {},
) => ({
  ok: error === null,
  error,
  runtime: record ? cloneRuntime(record.runtime) : null,
  ...extra,
});

const sameBinding = (
  owner: RuntimeBindingOwner | undefined,
  record: RuntimeRecord,
  runtimeId: string,
): boolean => Boolean(
  owner && owner.roomId === record.roomId && owner.runtimeId === runtimeId,
);

export const claimRealtimeSessionBinding = (
  record: RuntimeRecord,
  runtimeId: string,
  realtimeSessionId: string,
): boolean => {
  const owner = realtimeSessionBindings.get(realtimeSessionId);
  if (owner && !sameBinding(owner, record, runtimeId)) return false;
  if (
    record.admittedRealtimeSessionId &&
    record.admittedRealtimeSessionId !== realtimeSessionId
  ) {
    return false;
  }
  record.admittedRealtimeSessionId = realtimeSessionId;
  realtimeSessionBindings.set(realtimeSessionId, { roomId: record.roomId, runtimeId });
  return true;
};

export const claimProviderCallBinding = (
  record: RuntimeRecord,
  runtimeId: string,
  providerCallId: string,
): boolean => {
  const owner = providerCallBindings.get(providerCallId);
  if (owner && !sameBinding(owner, record, runtimeId)) return false;
  if (record.providerCallId && record.providerCallId !== providerCallId) return false;
  record.providerCallId = providerCallId;
  providerCallBindings.set(providerCallId, { roomId: record.roomId, runtimeId });
  return true;
};

/**
 * Claims both private transport identifiers as one synchronous transaction.
 * Every conflict is checked before either record or reverse index is mutated.
 */
export const claimTransportBindings = (
  record: RuntimeRecord,
  runtimeId: string,
  realtimeSessionId: string,
  providerCallId: string,
  requesterRef: string,
): boolean => {
  const sessionOwner = realtimeSessionBindings.get(realtimeSessionId);
  const providerOwner = providerCallBindings.get(providerCallId);
  const sessionAvailable =
    (!sessionOwner || sameBinding(sessionOwner, record, runtimeId)) &&
    (!record.admittedRealtimeSessionId ||
      record.admittedRealtimeSessionId === realtimeSessionId);
  const providerAvailable =
    (!providerOwner || sameBinding(providerOwner, record, runtimeId)) &&
    (!record.providerCallId || record.providerCallId === providerCallId);
  if (!sessionAvailable || !providerAvailable) return false;

  record.admittedRealtimeSessionId = realtimeSessionId;
  record.providerCallId = providerCallId;
  record.boundRequesterRef = requesterRef;
  const owner = { roomId: record.roomId, runtimeId };
  realtimeSessionBindings.set(realtimeSessionId, owner);
  providerCallBindings.set(providerCallId, owner);
  return true;
};

export const clearRuntimeBindings = (record: RuntimeRecord): void => {
  const runtimeId = record.runtime.runtime_id;
  if (record.admittedRealtimeSessionId) {
    const owner = realtimeSessionBindings.get(record.admittedRealtimeSessionId);
    if (!owner || (owner.roomId === record.roomId && owner.runtimeId === runtimeId)) {
      realtimeSessionBindings.delete(record.admittedRealtimeSessionId);
    }
  }
  if (record.providerCallId) {
    const owner = providerCallBindings.get(record.providerCallId);
    if (!owner || (owner.roomId === record.roomId && owner.runtimeId === runtimeId)) {
      providerCallBindings.delete(record.providerCallId);
    }
  }
  record.admittedRealtimeSessionId = null;
  record.providerCallId = null;
  record.boundRequesterRef = null;
};

export type SharedRealtimeRoomRuntimeSessionBinding = {
  roomId: string;
  runtimeId: string;
  realtimeSessionId: string;
  providerCallId: string | null;
};

export const readRuntimeBindingByRealtimeSessionId = (
  realtimeSessionIdInput: unknown,
  nowMs = Date.now(),
): SharedRealtimeRoomRuntimeSessionBinding | null => {
  const realtimeSessionId = readRef(realtimeSessionIdInput);
  if (!realtimeSessionId) return null;
  const owner = realtimeSessionBindings.get(realtimeSessionId);
  if (!owner) return null;
  const record = readRuntimeRecord(owner.roomId, nowMs);
  if (
    !record ||
    record.runtime.runtime_id !== owner.runtimeId ||
    record.admittedRealtimeSessionId !== realtimeSessionId ||
    record.runtime.state === "closed"
  ) {
    realtimeSessionBindings.delete(realtimeSessionId);
    return null;
  }
  return {
    roomId: record.roomId,
    runtimeId: owner.runtimeId,
    realtimeSessionId,
    providerCallId: record.providerCallId,
  };
};

export const resetRuntimeRegistryStateForTests = (): void => {
  records.clear();
  realtimeSessionBindings.clear();
  providerCallBindings.clear();
};
