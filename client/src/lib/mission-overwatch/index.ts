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
