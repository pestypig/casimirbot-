export type MissionBoardSnapshot = {
  missionId: string;
  phase: "observe" | "plan" | "retrieve" | "gate" | "synthesize" | "verify" | "execute" | "debrief";
  status: "active" | "degraded" | "blocked" | "complete" | "aborted";
  updatedAt: string;
  unresolvedCritical: number;
};

export type MissionBoardEvent = {
  eventId: string;
  missionId: string;
  type: "state_change" | "threat_update" | "timer_update" | "action_required" | "debrief";
  classification: "info" | "warn" | "critical" | "action";
  text: string;
  ts: string;
  evidenceRefs: string[];
};

type MissionApiError = {
  error: string;
  message: string;
  details?: unknown;
};

const readJson = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => ({}))) as T & MissionApiError;
  if (!response.ok) {
    const message = (data as MissionApiError).message || response.statusText;
    throw new Error(message);
  }
  return data;
};

export async function fetchMissionSnapshot(missionId: string): Promise<MissionBoardSnapshot> {
  const response = await fetch(`/api/mission-board/${encodeURIComponent(missionId)}`);
  const data = await readJson<{ snapshot: MissionBoardSnapshot }>(response);
  return data.snapshot;
}

export async function fetchMissionEvents(
  missionId: string,
  options?: { cursor?: number; limit?: number },
): Promise<{ events: MissionBoardEvent[]; nextCursor: number | null }> {
  const params = new URLSearchParams();
  if (Number.isFinite(options?.cursor)) params.set("cursor", String(options?.cursor));
  if (Number.isFinite(options?.limit)) params.set("limit", String(options?.limit));
  const query = params.toString();
  const response = await fetch(
    `/api/mission-board/${encodeURIComponent(missionId)}/events${query ? `?${query}` : ""}`,
  );
  const data = await readJson<{
    events: MissionBoardEvent[];
    nextCursor: number | null;
  }>(response);
  return {
    events: data.events,
    nextCursor: data.nextCursor,
  };
}

export async function postMissionAction(missionId: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/mission-board/${encodeURIComponent(missionId)}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<{
    receipt: { actionId: string; missionId: string; ts: string; status: string };
    snapshot: MissionBoardSnapshot;
  }>(response);
}

export async function postMissionAck(
  missionId: string,
  payload: { eventId: string; actorId?: string; note?: string },
) {
  const response = await fetch(`/api/mission-board/${encodeURIComponent(missionId)}/ack`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<{
    receipt: { missionId: string; eventId: string; actorId: string | null; ts: string };
    snapshot: MissionBoardSnapshot;
  }>(response);
}


export type MissionVoiceModeControls = {
  voiceEnabled: boolean;
  criticalOnly: boolean;
  muteWhileTyping: boolean;
};

export const DEFAULT_MISSION_VOICE_MODE_CONTROLS: MissionVoiceModeControls = {
  voiceEnabled: true,
  criticalOnly: false,
  muteWhileTyping: true,
};

const MISSION_VOICE_MODE_KEY = "helix:mission-voice-mode:v1";

export function readMissionVoiceModeControls(): MissionVoiceModeControls {
  if (typeof window === "undefined") return { ...DEFAULT_MISSION_VOICE_MODE_CONTROLS };
  try {
    const raw = window.localStorage.getItem(MISSION_VOICE_MODE_KEY);
    if (!raw) return { ...DEFAULT_MISSION_VOICE_MODE_CONTROLS };
    const parsed = JSON.parse(raw) as Partial<MissionVoiceModeControls>;
    return {
      voiceEnabled:
        typeof parsed.voiceEnabled === "boolean"
          ? parsed.voiceEnabled
          : DEFAULT_MISSION_VOICE_MODE_CONTROLS.voiceEnabled,
      criticalOnly:
        typeof parsed.criticalOnly === "boolean"
          ? parsed.criticalOnly
          : DEFAULT_MISSION_VOICE_MODE_CONTROLS.criticalOnly,
      muteWhileTyping:
        typeof parsed.muteWhileTyping === "boolean"
          ? parsed.muteWhileTyping
          : DEFAULT_MISSION_VOICE_MODE_CONTROLS.muteWhileTyping,
    };
  } catch {
    return { ...DEFAULT_MISSION_VOICE_MODE_CONTROLS };
  }
}

export function writeMissionVoiceModeControls(next: MissionVoiceModeControls): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MISSION_VOICE_MODE_KEY, JSON.stringify(next));
}

export function shouldSpeakMissionEvent(options: {
  controls: MissionVoiceModeControls;
  classification: MissionBoardEvent["classification"];
  isUserTyping: boolean;
}): boolean {
  const { controls, classification, isUserTyping } = options;
  if (!controls.voiceEnabled) return false;
  if (controls.muteWhileTyping && isUserTyping) return false;
  if (controls.criticalOnly && classification !== "critical" && classification !== "action") return false;
  return true;
}
