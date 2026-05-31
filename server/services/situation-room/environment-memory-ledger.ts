import type { EnvironmentContainerSummary, HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";

export type EnvironmentContainerMemoryEntry = EnvironmentContainerSummary & {
  first_seen_at: string;
  last_seen_at: string;
  contents_last_verified_at?: string | null;
  memory_status: "contents_known" | "container_seen";
  evidence_refs: string[];
  instruction_authority: "none";
  ask_context_policy: "evidence_only";
  raw_content_included: false;
};

export type EnvironmentMemoryLedger = {
  schema: "helix.environment_memory_ledger.v1";
  room_id: string;
  world_id?: string | null;
  known_containers: EnvironmentContainerMemoryEntry[];
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  updated_at: string;
};

const containersByRoom = new Map<string, Map<string, EnvironmentContainerMemoryEntry>>();

const mergeContainerMemory = (
  previous: EnvironmentContainerMemoryEntry | undefined,
  container: EnvironmentContainerSummary,
  snapshot: HelixEnvironmentStateSnapshot,
): EnvironmentContainerMemoryEntry => {
  const contentsKnown = container.contents_known || (container.contents_summary?.length ?? 0) > 0;
  const previousContentsKnown = previous?.memory_status === "contents_known";
  const contentsSummary = contentsKnown
    ? container.contents_summary ?? []
    : previousContentsKnown
      ? previous?.contents_summary ?? []
      : container.contents_summary ?? [];
  const contentsHash = contentsKnown
    ? container.contents_hash ?? null
    : previousContentsKnown
      ? previous?.contents_hash ?? null
      : container.contents_hash ?? null;
  const contentsLastVerifiedAt = contentsKnown
    ? container.last_verified_at ?? snapshot.ts
    : previous?.contents_last_verified_at ?? previous?.last_verified_at ?? null;
  const evidenceRefs = Array.from(new Set([
    ...(previous?.evidence_refs ?? []),
    snapshot.snapshot_id,
    ...snapshot.evidence_refs,
  ])).slice(-48);

  return {
    ...container,
    contents_known: contentsKnown || previousContentsKnown,
    contents_summary: contentsSummary,
    contents_hash: contentsHash,
    last_verified_at: contentsLastVerifiedAt,
    first_seen_at: previous?.first_seen_at ?? snapshot.ts,
    last_seen_at: snapshot.ts,
    contents_last_verified_at: contentsLastVerifiedAt,
    memory_status: contentsKnown || previousContentsKnown ? "contents_known" : "container_seen",
    evidence_refs: evidenceRefs,
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    raw_content_included: false,
  };
};

export function updateEnvironmentMemoryLedger(snapshot: HelixEnvironmentStateSnapshot): EnvironmentMemoryLedger {
  const roomLedger = containersByRoom.get(snapshot.room_id) ?? new Map<string, EnvironmentContainerMemoryEntry>();
  for (const container of snapshot.object_state?.nearby_containers ?? []) {
    roomLedger.set(container.container_ref, mergeContainerMemory(roomLedger.get(container.container_ref), container, snapshot));
  }
  containersByRoom.set(snapshot.room_id, roomLedger);
  const knownContainers = Array.from(roomLedger.values())
    .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at) || a.container_ref.localeCompare(b.container_ref));
  return {
    schema: "helix.environment_memory_ledger.v1",
    room_id: snapshot.room_id,
    world_id: snapshot.world_id ?? null,
    known_containers: knownContainers,
    evidence_refs: Array.from(new Set(knownContainers.flatMap((entry) => entry.evidence_refs))).slice(-96),
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    updated_at: snapshot.ts,
  };
}

export function listKnownEnvironmentContainers(roomId: string): EnvironmentContainerMemoryEntry[] {
  return Array.from((containersByRoom.get(roomId) ?? new Map()).values());
}

export function resetEnvironmentMemoryLedgersForTest(): void {
  containersByRoom.clear();
}
