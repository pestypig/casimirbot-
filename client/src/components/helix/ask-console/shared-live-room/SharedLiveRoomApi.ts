import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomConsentPatch,
  HelixSharedRealtimeRoomDebug,
  HelixSharedRealtimeRoomErrorCode,
  HelixSharedRealtimeRoomPresence,
  HelixSharedRealtimeRoomResponse,
  HelixSharedRealtimeRoomVisualFrame,
  HelixSharedRealtimeRoomVisualSourceSurface,
} from "@shared/helix-shared-realtime-room";

const SHARED_REALTIME_ROOMS_PATH = "/api/agi/realtime/rooms";

type JsonRecord = Record<string, unknown>;

export type HelixSharedLiveRoomVisualFrameUpload = {
  source_id: string;
  source_surface: HelixSharedRealtimeRoomVisualSourceSurface;
  captured_at: string;
  sequence: number;
  image_data_url: string;
  image_hash: string;
  preview_hash?: string | null;
  preview_data_url?: string | null;
};

export class HelixSharedLiveRoomApiError extends Error {
  readonly code: HelixSharedRealtimeRoomErrorCode | "shared_realtime_room_request_failed";
  readonly status: number;

  constructor(input: {
    code?: HelixSharedRealtimeRoomErrorCode | null;
    message?: string | null;
    status: number;
  }) {
    super(input.message?.trim() || input.code || "Shared Live Room request failed.");
    this.name = "HelixSharedLiveRoomApiError";
    this.code = input.code ?? "shared_realtime_room_request_failed";
    this.status = input.status;
  }
}

const roomPath = (roomId: string, suffix = ""): string =>
  `${SHARED_REALTIME_ROOMS_PATH}/${encodeURIComponent(roomId)}${suffix}`;

const parseResponse = (value: unknown): HelixSharedRealtimeRoomResponse | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<HelixSharedRealtimeRoomResponse>;
  return candidate.schema === "helix.shared_realtime_room.response.v1"
    ? candidate as HelixSharedRealtimeRoomResponse
    : null;
};

const requestSharedRoomJson = async (
  path: string,
  init: RequestInit = {},
): Promise<HelixSharedRealtimeRoomResponse> => {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const payload = parseResponse(await response.json().catch(() => null));
  if (!response.ok || payload?.ok !== true) {
    throw new HelixSharedLiveRoomApiError({
      code: payload?.error ?? null,
      message: payload?.message ?? null,
      status: response.status,
    });
  }
  return payload;
};

const requireRoom = (response: HelixSharedRealtimeRoomResponse): HelixSharedRealtimeRoom => {
  if (response.room) return response.room;
  throw new HelixSharedLiveRoomApiError({
    code: "shared_realtime_room_unavailable",
    message: "The room response did not include a room projection.",
    status: 502,
  });
};

const postRoomMutation = async (
  roomId: string,
  suffix: string,
  body: JsonRecord = {},
  method: "POST" | "PATCH" = "POST",
): Promise<HelixSharedRealtimeRoomResponse> =>
  requestSharedRoomJson(roomPath(roomId, suffix), {
    method,
    body: JSON.stringify(body),
  });

export type HelixSharedLiveRoomApi = {
  listRooms(): Promise<HelixSharedRealtimeRoom[]>;
  createRoom(title?: string): Promise<HelixSharedRealtimeRoom>;
  joinRoom(inviteCode: string): Promise<HelixSharedRealtimeRoom>;
  getRoom(roomId: string): Promise<HelixSharedRealtimeRoom>;
  createInvite(roomId: string): Promise<{
    room: HelixSharedRealtimeRoom;
    inviteCode: string;
    expiresAt: string | null;
  }>;
  patchConsent(
    roomId: string,
    consent: HelixSharedRealtimeRoomConsentPatch,
  ): Promise<HelixSharedRealtimeRoom>;
  updatePresence(
    roomId: string,
    presence: Exclude<HelixSharedRealtimeRoomPresence, "left">,
  ): Promise<HelixSharedRealtimeRoom>;
  reserveRuntime(roomId: string, model: string): Promise<HelixSharedRealtimeRoom>;
  bindRuntime(roomId: string, realtimeSessionId: string): Promise<HelixSharedRealtimeRoom>;
  takeFloor(roomId: string): Promise<HelixSharedRealtimeRoom>;
  listVisualFrames(roomId: string): Promise<HelixSharedRealtimeRoomVisualFrame[]>;
  uploadVisualFrame(
    roomId: string,
    frame: HelixSharedLiveRoomVisualFrameUpload,
  ): Promise<HelixSharedRealtimeRoomResponse>;
  getDebug(roomId: string): Promise<HelixSharedRealtimeRoomDebug | null>;
  leaveRoom(roomId: string): Promise<HelixSharedRealtimeRoom | null>;
};

export const helixSharedLiveRoomApi: HelixSharedLiveRoomApi = {
  async listRooms() {
    const response = await requestSharedRoomJson(SHARED_REALTIME_ROOMS_PATH);
    return response.rooms ?? [];
  },

  async createRoom(title) {
    const response = await requestSharedRoomJson(SHARED_REALTIME_ROOMS_PATH, {
      method: "POST",
      body: JSON.stringify({ title: title?.trim() || undefined }),
    });
    return requireRoom(response);
  },

  async joinRoom(inviteCode) {
    const response = await requestSharedRoomJson(`${SHARED_REALTIME_ROOMS_PATH}/join`, {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode.trim() }),
    });
    return requireRoom(response);
  },

  async getRoom(roomId) {
    return requireRoom(await requestSharedRoomJson(roomPath(roomId)));
  },

  async createInvite(roomId) {
    const response = await postRoomMutation(roomId, "/invites");
    const inviteCode = response.invite_code?.trim();
    if (!inviteCode) {
      throw new HelixSharedLiveRoomApiError({
        code: "shared_realtime_room_unavailable",
        message: "The invite response did not include an invite code.",
        status: 502,
      });
    }
    return {
      room: requireRoom(response),
      inviteCode,
      expiresAt: response.invite_expires_at ?? null,
    };
  },

  async patchConsent(roomId, consent) {
    return requireRoom(await postRoomMutation(roomId, "/consent", { consent }, "PATCH"));
  },

  async updatePresence(roomId, presence) {
    return requireRoom(await postRoomMutation(roomId, "/presence", { presence }));
  },

  async reserveRuntime(roomId, model) {
    return requireRoom(await postRoomMutation(roomId, "/runtime/reserve", { model }));
  },

  async bindRuntime(roomId, realtimeSessionId) {
    return requireRoom(await postRoomMutation(roomId, "/runtime/bind", {
      realtime_session_id: realtimeSessionId,
    }));
  },

  async takeFloor(roomId) {
    return requireRoom(await postRoomMutation(roomId, "/runtime/floor"));
  },

  async listVisualFrames(roomId) {
    const response = await requestSharedRoomJson(roomPath(roomId, "/visual-frames"));
    return response.frames ?? [];
  },

  async uploadVisualFrame(roomId, frame) {
    return postRoomMutation(roomId, "/visual-frames", frame as unknown as JsonRecord);
  },

  async getDebug(roomId) {
    const response = await requestSharedRoomJson(roomPath(roomId, "/debug"));
    return response.debug ?? null;
  },

  async leaveRoom(roomId) {
    const response = await postRoomMutation(roomId, "/leave");
    return response.room;
  },
};
