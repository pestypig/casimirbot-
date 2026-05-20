import type { HelixEnvironmentSourceHeartbeat } from "@shared/helix-environment-source-manifest";

const heartbeatsBySource = new Map<string, HelixEnvironmentSourceHeartbeat>();

export const ENVIRONMENT_SOURCE_HEARTBEAT_STALE_MS = 45_000;
export const ENVIRONMENT_SOURCE_HEARTBEAT_STOPPED_MS = 120_000;

export function recordEnvironmentSourceHeartbeat(
  heartbeat: HelixEnvironmentSourceHeartbeat,
): HelixEnvironmentSourceHeartbeat {
  if (heartbeat.assistant_answer !== false) throw new Error("environment heartbeat cannot be an assistant answer");
  if (heartbeat.raw_content_included !== false) throw new Error("environment heartbeat cannot include raw content");
  heartbeatsBySource.set(heartbeat.source_id, heartbeat);
  return heartbeat;
}

export function getEnvironmentSourceHeartbeat(sourceId: string): HelixEnvironmentSourceHeartbeat | null {
  return heartbeatsBySource.get(sourceId) ?? null;
}

export function listEnvironmentSourceHeartbeats(input?: {
  roomId?: string | null;
}): HelixEnvironmentSourceHeartbeat[] {
  return Array.from(heartbeatsBySource.values()).filter((heartbeat) =>
    input?.roomId ? heartbeat.room_id === input.roomId : true
  );
}

export function projectEnvironmentSourceHeartbeatStatus(input: {
  heartbeat: HelixEnvironmentSourceHeartbeat | null;
  now?: string;
}): HelixEnvironmentSourceHeartbeat["status"] | "missing" {
  const heartbeat = input.heartbeat;
  if (!heartbeat) return "missing";
  if (heartbeat.status === "error" || heartbeat.status === "paused") return heartbeat.status;
  const now = Date.parse(input.now ?? new Date().toISOString());
  const created = Date.parse(heartbeat.created_at);
  if (!Number.isFinite(now) || !Number.isFinite(created)) return heartbeat.status;
  const ageMs = now - created;
  if (ageMs >= ENVIRONMENT_SOURCE_HEARTBEAT_STOPPED_MS) return "error";
  if (ageMs >= ENVIRONMENT_SOURCE_HEARTBEAT_STALE_MS) return "stale";
  return heartbeat.status;
}

export function resetEnvironmentSourceHeartbeatStoreForTest(): void {
  heartbeatsBySource.clear();
}
