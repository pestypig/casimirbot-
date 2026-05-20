import type { EvidenceSafety } from "../../../shared/helix-minecraft-evidence.ts";
import { toolEvidenceSafety } from "../../../shared/helix-minecraft-evidence.ts";

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
