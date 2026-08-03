import type { HelixEnvironmentSourceHeartbeat } from "@shared/helix-environment-source-manifest";
import {
  assertHelixRoomSourceNamespaceAdmission,
  isHelixRoomSourceIngressSourceId,
  matchesHelixRoomSourceAdmission,
  type HelixRoomSourceAdmission,
} from "@shared/helix-room-source-ingress";

const heartbeatsBySource = new Map<string, HelixEnvironmentSourceHeartbeat>();

export const ENVIRONMENT_SOURCE_HEARTBEAT_STALE_MS = 45_000;
export const ENVIRONMENT_SOURCE_HEARTBEAT_STOPPED_MS = 120_000;

export function recordEnvironmentSourceHeartbeat(
  heartbeat: HelixEnvironmentSourceHeartbeat,
  options: {
    sourceAdmission?: HelixRoomSourceAdmission | null;
  } = {},
): HelixEnvironmentSourceHeartbeat {
  assertHelixRoomSourceNamespaceAdmission(
    {
      source_id: heartbeat.source_id,
      room_id: heartbeat.room_id,
      domain_adapter: heartbeat.domain_adapter,
    },
    options.sourceAdmission,
  );
  if (heartbeat.assistant_answer !== false) throw new Error("environment heartbeat cannot be an assistant answer");
  if (heartbeat.raw_content_included !== false) throw new Error("environment heartbeat cannot include raw content");
  heartbeatsBySource.set(heartbeat.source_id, heartbeat);
  return heartbeat;
}

export function getEnvironmentSourceHeartbeat(
  sourceId: string,
  options: {
    sourceAdmission?: HelixRoomSourceAdmission | null;
  } = {},
): HelixEnvironmentSourceHeartbeat | null {
  const heartbeat = heartbeatsBySource.get(sourceId) ?? null;
  if (
    heartbeat &&
    isHelixRoomSourceIngressSourceId(heartbeat.source_id) &&
    !matchesHelixRoomSourceAdmission(
      {
        source_id: heartbeat.source_id,
        room_id: heartbeat.room_id,
        domain_adapter: heartbeat.domain_adapter,
      },
      options.sourceAdmission,
    )
  ) {
    return null;
  }
  return heartbeat;
}

/**
 * Exact-identity server lookup for trusted policy services. This does not
 * accept a caller-selected room or adapter mismatch and never projects source
 * credentials. HTTP routes must continue to use admission-scoped lookups.
 */
export function getEnvironmentSourceHeartbeatForServerIdentity(input: {
  sourceId: string;
  roomId: string;
  domainAdapter: string;
}): HelixEnvironmentSourceHeartbeat | null {
  const heartbeat = heartbeatsBySource.get(input.sourceId) ?? null;
  if (
    !heartbeat ||
    heartbeat.room_id !== input.roomId ||
    heartbeat.domain_adapter !== input.domainAdapter
  ) {
    return null;
  }
  return heartbeat;
}

export function listEnvironmentSourceHeartbeats(input?: {
  roomId?: string | null;
  sourceAdmission?: HelixRoomSourceAdmission | null;
}): HelixEnvironmentSourceHeartbeat[] {
  return Array.from(heartbeatsBySource.values()).filter((heartbeat) => {
    if (
      isHelixRoomSourceIngressSourceId(heartbeat.source_id) &&
      !matchesHelixRoomSourceAdmission(
        {
          source_id: heartbeat.source_id,
          room_id: heartbeat.room_id,
          domain_adapter: heartbeat.domain_adapter,
        },
        input?.sourceAdmission,
      )
    ) {
      return false;
    }
    return input?.roomId ? heartbeat.room_id === input.roomId : true;
  });
}

export function removeEnvironmentSourceHeartbeats(input: {
  sourceId?: string | null;
  roomId?: string | null;
}): number {
  let removed = 0;
  for (const [sourceId, heartbeat] of heartbeatsBySource.entries()) {
    if (input.sourceId && sourceId !== input.sourceId) continue;
    if (input.roomId && heartbeat.room_id !== input.roomId) continue;
    heartbeatsBySource.delete(sourceId);
    removed += 1;
  }
  return removed;
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
