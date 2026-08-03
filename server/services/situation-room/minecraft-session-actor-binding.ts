import type { EvidenceSafety } from "../../../shared/helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "../../../shared/helix-minecraft-evidence.ts";
import type { ResolvedRoomEnvironmentSubject } from
  "../environment-connectors/subjects/subject-binding-store";

export type MinecraftDiscordActorBinding = EvidenceSafety & {
  binding_id: string;
  room_id: string;
  thread_id: string;
  profile_id?: string | null;
  discord_session_id?: string | null;
  discord_speaker_id?: string | null;
  minecraft_actor_id: string;
  minecraft_actor_label?: string | null;
  confidence: number;
  source: "manual_link" | "session_link" | "server_auth" | "unknown";
};

export function createMinecraftDiscordActorBinding(
  input: Omit<MinecraftDiscordActorBinding, keyof EvidenceSafety>,
): MinecraftDiscordActorBinding {
  return {
    ...toolEvidenceSafety(),
    ...input,
  };
}

export function hasUsableActorBinding(
  binding: MinecraftDiscordActorBinding | null | undefined,
  minConfidence = 0.75,
): binding is MinecraftDiscordActorBinding {
  return Boolean(binding && binding.confidence >= minConfidence && binding.source !== "unknown");
}

/**
 * Compatibility projection for the retired Discord-named route-monitoring
 * contract. New room probes must resolve RoomEnvironmentSubjectBinding first;
 * this adapter must never become a second identity store.
 */
export function projectMinecraftActorBindingFromEnvironmentSubject(input: {
  roomId: string;
  threadId: string;
  profileId?: string | null;
  subject: ResolvedRoomEnvironmentSubject;
}): MinecraftDiscordActorBinding {
  const source: MinecraftDiscordActorBinding["source"] =
    input.subject.verificationMethod === "server_auth"
      ? "server_auth"
      : input.subject.verificationMethod === "self_claim"
        ? "manual_link"
        : "session_link";
  return createMinecraftDiscordActorBinding({
    binding_id: input.subject.subjectBindingId,
    room_id: input.roomId,
    thread_id: input.threadId,
    profile_id: input.profileId ?? null,
    minecraft_actor_id: input.subject.subjectNativeId,
    minecraft_actor_label: input.subject.subjectLabel,
    confidence: input.subject.confidence,
    source,
  });
}
