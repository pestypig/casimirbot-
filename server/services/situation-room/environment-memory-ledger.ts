import type { EnvironmentContainerSummary, HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";

const containersByRoom = new Map<string, Map<string, EnvironmentContainerSummary>>();

export function updateEnvironmentMemoryLedger(snapshot: HelixEnvironmentStateSnapshot): {
  known_containers: EnvironmentContainerSummary[];
  assistant_answer: false;
  raw_content_included: false;
} {
  const roomLedger = containersByRoom.get(snapshot.room_id) ?? new Map<string, EnvironmentContainerSummary>();
  for (const container of snapshot.object_state?.nearby_containers ?? []) {
    roomLedger.set(container.container_ref, {
      ...container,
      last_verified_at: container.last_verified_at ?? snapshot.ts,
    });
  }
  containersByRoom.set(snapshot.room_id, roomLedger);
  return {
    known_containers: Array.from(roomLedger.values()),
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function listKnownEnvironmentContainers(roomId: string): EnvironmentContainerSummary[] {
  return Array.from((containersByRoom.get(roomId) ?? new Map()).values());
}

export function resetEnvironmentMemoryLedgersForTest(): void {
  containersByRoom.clear();
}

