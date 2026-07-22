import { useCallback, useMemo, useState } from "react";
import type {
  HelixSharedRealtimeRoom,
  HelixSharedRealtimeRoomConsentPatch,
  HelixSharedRealtimeRoomDebug,
  HelixSharedRealtimeRoomParticipant,
  HelixSharedRealtimeRoomVisualFrame,
} from "@shared/helix-shared-realtime-room";
import {
  helixSharedLiveRoomApi,
  type HelixSharedLiveRoomApi,
} from "./SharedLiveRoomApi";
import { readHelixSharedLiveRoomSelfParticipant } from "./SharedLiveRoomViewModel";
import {
  sortHelixSharedLiveRooms,
  useSharedLiveRoomSync,
} from "./useSharedLiveRoomSync";
import {
  useSharedLiveRoomVisualIngress,
  type HelixSharedLiveRoomFrameUploadState,
} from "./useSharedLiveRoomVisualIngress";

export type { HelixSharedLiveRoomFrameUploadState } from "./useSharedLiveRoomVisualIngress";

export type HelixSharedLiveRoomAction =
  | "loading"
  | "create"
  | "join"
  | "open"
  | "invite"
  | "consent"
  | "reserve"
  | "bind"
  | "floor"
  | "debug"
  | "leave";

export type HelixSharedLiveRoomController = {
  rooms: HelixSharedRealtimeRoom[];
  room: HelixSharedRealtimeRoom | null;
  selfParticipant: HelixSharedRealtimeRoomParticipant | null;
  frames: HelixSharedRealtimeRoomVisualFrame[];
  debug: HelixSharedRealtimeRoomDebug | null;
  inviteCode: string | null;
  inviteExpiresAt: string | null;
  busyAction: HelixSharedLiveRoomAction | null;
  error: string | null;
  runtimeActive: boolean;
  realtimeSessionId: string | null;
  frameUpload: HelixSharedLiveRoomFrameUploadState;
  clearError(): void;
  createRoom(title?: string): Promise<boolean>;
  joinRoom(inviteCode: string): Promise<boolean>;
  openRoom(roomId: string): Promise<boolean>;
  createInvite(): Promise<boolean>;
  patchOwnConsent(consent: HelixSharedRealtimeRoomConsentPatch): Promise<boolean>;
  reserveRuntime(): Promise<boolean>;
  bindRuntime(): Promise<boolean>;
  takeFloor(): Promise<boolean>;
  refreshDebug(): Promise<boolean>;
  leaveRoom(): Promise<boolean>;
};

export type UseHelixSharedLiveRoomOptions = {
  realtimeSessionId: string | null;
  runtimeActive: boolean;
  realtimeModel: string;
  visualInputEnabled: boolean;
  api?: HelixSharedLiveRoomApi;
};

const safeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) return error.message.trim().slice(0, 360);
  return "Shared Live Room request failed.";
};

export function useHelixSharedLiveRoom(
  options: UseHelixSharedLiveRoomOptions,
): HelixSharedLiveRoomController {
  const api = options.api ?? helixSharedLiveRoomApi;
  const [rooms, setRooms] = useState<HelixSharedRealtimeRoom[]>([]);
  const [room, setRoom] = useState<HelixSharedRealtimeRoom | null>(null);
  const [frames, setFrames] = useState<HelixSharedRealtimeRoomVisualFrame[]>([]);
  const [debug, setDebug] = useState<HelixSharedRealtimeRoomDebug | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<HelixSharedLiveRoomAction | null>("loading");
  const [error, setError] = useState<string | null>(null);

  const applyRoom = useCallback((nextRoom: HelixSharedRealtimeRoom): void => {
    setRoom(nextRoom);
    setRooms((current) => sortHelixSharedLiveRooms([
      nextRoom,
      ...current.filter((candidate) => candidate.room_id !== nextRoom.room_id),
    ]));
  }, []);

  const runRoomAction = useCallback(async <T,>(
    action: HelixSharedLiveRoomAction,
    operation: () => Promise<T>,
  ): Promise<T | null> => {
    setBusyAction(action);
    setError(null);
    try {
      return await operation();
    } catch (actionError) {
      setError(safeErrorMessage(actionError));
      return null;
    } finally {
      setBusyAction(null);
    }
  }, []);

  const handleInitialRooms = useCallback((availableRooms: HelixSharedRealtimeRoom[]): void => {
    setRooms(availableRooms);
    const resumable = availableRooms.find((candidate) => candidate.status !== "closed") ?? null;
    setRoom((current) => current ?? resumable);
  }, []);
  const handleSyncError = useCallback((syncError: unknown): void => {
    setError(safeErrorMessage(syncError));
  }, []);
  const handleLoading = useCallback((loading: boolean): void => {
    setBusyAction((current) => loading ? current ?? "loading" : current === "loading" ? null : current);
  }, []);
  const clearRoomArtifacts = useCallback((): void => {
    setFrames([]);
    setDebug(null);
  }, []);

  const activeRoomId = room?.room_id ?? null;
  useSharedLiveRoomSync({
    api,
    activeRoomId,
    onInitialRooms: handleInitialRooms,
    onRoom: applyRoom,
    onFrames: setFrames,
    onClearRoomArtifacts: clearRoomArtifacts,
    onError: handleSyncError,
    onLoading: handleLoading,
  });

  const selfParticipant = useMemo(
    () => readHelixSharedLiveRoomSelfParticipant(room),
    [room],
  );
  const visualRouteAuthorized = Boolean(
    selfParticipant?.consent.screen_to_model ||
    selfParticipant?.consent.screen_thumbnail_to_room,
  );
  const { frameUpload, resetVisualIngress } = useSharedLiveRoomVisualIngress({
    api,
    roomId: activeRoomId,
    enabled: options.visualInputEnabled && visualRouteAuthorized,
    onFrames: setFrames,
  });

  const createRoom = useCallback(async (title?: string): Promise<boolean> => {
    const nextRoom = await runRoomAction("create", () => api.createRoom(title));
    if (!nextRoom) return false;
    resetVisualIngress();
    applyRoom(nextRoom);
    setFrames([]);
    setDebug(null);
    setInviteCode(null);
    setInviteExpiresAt(null);
    return true;
  }, [api, applyRoom, resetVisualIngress, runRoomAction]);

  const joinRoom = useCallback(async (invite: string): Promise<boolean> => {
    const inviteCodeValue = invite.trim();
    if (!inviteCodeValue) {
      setError("Enter an invite code to join a Shared Live Room.");
      return false;
    }
    const nextRoom = await runRoomAction("join", () => api.joinRoom(inviteCodeValue));
    if (!nextRoom) return false;
    resetVisualIngress();
    applyRoom(nextRoom);
    setInviteCode(null);
    setInviteExpiresAt(null);
    return true;
  }, [api, applyRoom, resetVisualIngress, runRoomAction]);

  const openRoom = useCallback(async (roomId: string): Promise<boolean> => {
    const nextRoom = await runRoomAction("open", () => api.getRoom(roomId));
    if (!nextRoom) return false;
    resetVisualIngress();
    applyRoom(nextRoom);
    return true;
  }, [api, applyRoom, resetVisualIngress, runRoomAction]);

  const createInvite = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    const invitation = await runRoomAction("invite", () => api.createInvite(activeRoomId));
    if (!invitation) return false;
    applyRoom(invitation.room);
    setInviteCode(invitation.inviteCode);
    setInviteExpiresAt(invitation.expiresAt);
    return true;
  }, [activeRoomId, api, applyRoom, runRoomAction]);

  const patchOwnConsent = useCallback(async (
    consent: HelixSharedRealtimeRoomConsentPatch,
  ): Promise<boolean> => {
    if (!activeRoomId) return false;
    const nextRoom = await runRoomAction("consent", () => api.patchConsent(activeRoomId, consent));
    if (!nextRoom) return false;
    applyRoom(nextRoom);
    return true;
  }, [activeRoomId, api, applyRoom, runRoomAction]);

  const reserveRuntime = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    const nextRoom = await runRoomAction("reserve", () =>
      api.reserveRuntime(activeRoomId, options.realtimeModel));
    if (!nextRoom) return false;
    applyRoom(nextRoom);
    return true;
  }, [activeRoomId, api, applyRoom, options.realtimeModel, runRoomAction]);

  const bindRuntime = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    if (!options.realtimeSessionId) {
      setError("Start GPT Live before binding the host browser session to this room.");
      return false;
    }
    const nextRoom = await runRoomAction("bind", () =>
      api.bindRuntime(activeRoomId, options.realtimeSessionId as string));
    if (!nextRoom) return false;
    applyRoom(nextRoom);
    return true;
  }, [activeRoomId, api, applyRoom, options.realtimeSessionId, runRoomAction]);

  const takeFloor = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    const nextRoom = await runRoomAction("floor", () => api.takeFloor(activeRoomId));
    if (!nextRoom) return false;
    applyRoom(nextRoom);
    return true;
  }, [activeRoomId, api, applyRoom, runRoomAction]);

  const refreshDebug = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    const nextDebug = await runRoomAction("debug", () => api.getDebug(activeRoomId));
    if (!nextDebug) return false;
    setDebug(nextDebug);
    return true;
  }, [activeRoomId, api, runRoomAction]);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!activeRoomId) return false;
    const outcome = await runRoomAction("leave", async () => ({
      room: await api.leaveRoom(activeRoomId),
    }));
    if (!outcome) return false;
    resetVisualIngress();
    setRoom(null);
    setRooms((current) => current.filter((candidate) => candidate.room_id !== activeRoomId));
    setFrames([]);
    setDebug(null);
    setInviteCode(null);
    setInviteExpiresAt(null);
    return true;
  }, [activeRoomId, api, resetVisualIngress, runRoomAction]);

  const clearError = useCallback((): void => setError(null), []);
  return {
    rooms,
    room,
    selfParticipant,
    frames,
    debug,
    inviteCode,
    inviteExpiresAt,
    busyAction,
    error,
    runtimeActive: options.runtimeActive,
    realtimeSessionId: options.realtimeSessionId,
    frameUpload,
    clearError,
    createRoom,
    joinRoom,
    openRoom,
    createInvite,
    patchOwnConsent,
    reserveRuntime,
    bindRuntime,
    takeFloor,
    refreshDebug,
    leaveRoom,
  };
}
