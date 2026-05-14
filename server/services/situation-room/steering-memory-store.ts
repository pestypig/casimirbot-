import crypto from "node:crypto";
import {
  HELIX_STEERING_MEMORY_SCHEMA,
  type HelixSteeringMemory,
  type HelixSteeringMemoryArchive,
} from "@shared/helix-steering-memory";
import type { HelixUserSteeringEvidence } from "@shared/helix-user-steering-evidence";

const memoriesByProfile = new Map<string, HelixSteeringMemory[]>();
const archivesByProfile = new Map<string, HelixSteeringMemoryArchive[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const profileKey = (profileId?: string | null): string => profileId?.trim() || "local-profile";

const confidenceEffectForSteering = (effect: HelixUserSteeringEvidence["effect"]): HelixSteeringMemory["confidence_effect"] => {
  if (effect === "confirm") return "confirm";
  if (effect === "reject") return "contradict";
  if (effect === "refine_goal" || effect === "rename" || effect === "add_missing_evidence_target") return "clarify";
  if (effect === "set_priority") return "raise";
  return "clarify";
};

export function recordSteeringMemory(input: {
  steering: HelixUserSteeringEvidence;
  profileId?: string | null;
  now?: string;
}): HelixSteeringMemory {
  const profileId = profileKey(input.profileId);
  const memory: HelixSteeringMemory = {
    schema: HELIX_STEERING_MEMORY_SCHEMA,
    steering_id: input.steering.steering_id,
    thread_id: input.steering.thread_id,
    profile_id: profileId,
    user_claim: input.steering.user_claim,
    normalized_claim: input.steering.normalized_claim ?? input.steering.user_claim,
    target_hypothesis_ids: input.steering.target_hypothesis_ids,
    evidence_refs: input.steering.evidence_refs,
    confidence_effect: confidenceEffectForSteering(input.steering.effect),
    next_checks: input.steering.next_checks,
    raw_content_included: false,
    assistant_answer: false,
    created_at: input.now ?? input.steering.created_at,
  };
  const existing = memoriesByProfile.get(profileId) ?? [];
  const withoutDuplicate = existing.filter((entry) => entry.steering_id !== memory.steering_id);
  memoriesByProfile.set(profileId, [...withoutDuplicate, memory].slice(-500));
  return memory;
}

export function listSteeringMemory(input: {
  profileId?: string | null;
  threadId?: string | null;
}): HelixSteeringMemory[] {
  const memories = memoriesByProfile.get(profileKey(input.profileId)) ?? [];
  return memories.filter((memory) => !input.threadId || memory.thread_id === input.threadId);
}

export function archiveSteeringMemory(input: {
  profileId?: string | null;
  threadId: string;
  now?: string;
}): HelixSteeringMemoryArchive {
  const profileId = profileKey(input.profileId);
  const now = input.now ?? new Date().toISOString();
  const memories = listSteeringMemory({ profileId, threadId: input.threadId });
  const archive: HelixSteeringMemoryArchive = {
    schema: "helix.steering_memory_archive.v1",
    archive_id: `steering_memory_archive:${hashShort([profileId, input.threadId, memories.map((entry) => entry.steering_id), now])}`,
    thread_id: input.threadId,
    profile_id: profileId,
    memories,
    raw_logs_included: false,
    assistant_answer: false,
    created_at: now,
  };
  const existing = archivesByProfile.get(profileId) ?? [];
  archivesByProfile.set(profileId, [...existing, archive].slice(-100));
  return archive;
}

export function listSteeringMemoryArchives(profileId?: string | null): HelixSteeringMemoryArchive[] {
  return [...(archivesByProfile.get(profileKey(profileId)) ?? [])];
}

export function clearSteeringMemoryForTest(): void {
  memoriesByProfile.clear();
  archivesByProfile.clear();
}
