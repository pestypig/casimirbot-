import {
  buildAskEvidencePackFromAllowlist,
  type SanitizedAskEvidenceItem,
} from "./live-scenario-ask-allowlist.ts";

export type MinecraftAskEvidencePack = {
  schema: "helix.minecraft_ask_evidence_pack.v1";
  room_id: string;
  thread_id: string;
  raw_transcript_included: false;
  raw_image_included: false;
  hidden_ask_turns_created: 0;
  items: SanitizedAskEvidenceItem[];
};

export function buildMinecraftAskEvidencePack(input: {
  room_id: string;
  thread_id: string;
  items: unknown[];
}): MinecraftAskEvidencePack {
  const pack = buildAskEvidencePackFromAllowlist({
    items: input.items,
    now: new Date(0).toISOString(),
  });

  return {
    schema: "helix.minecraft_ask_evidence_pack.v1",
    room_id: input.room_id,
    thread_id: input.thread_id,
    raw_transcript_included: false,
    raw_image_included: false,
    hidden_ask_turns_created: 0,
    items: pack.items,
  };
}
