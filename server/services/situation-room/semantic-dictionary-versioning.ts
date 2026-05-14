import crypto from "node:crypto";
import {
  HELIX_SEMANTIC_DICTIONARY_VERSION_SCHEMA,
  type HelixSemanticDictionaryVersion,
} from "@shared/helix-semantic-dictionary-version";
import { loadMinecraftSemanticEntries } from "./minecraft-semantic-reference-loader";

const hash = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function getMinecraftSemanticDictionaryVersion(): HelixSemanticDictionaryVersion {
  const entries = loadMinecraftSemanticEntries();
  const contentHash = hash(entries);
  return {
    schema: HELIX_SEMANTIC_DICTIONARY_VERSION_SCHEMA,
    dictionary_id: "minecraft-semantic-dictionary",
    game_id: "minecraft",
    version_id: `minecraft-semantic:${contentHash.slice(0, 16)}`,
    entry_count: entries.length,
    content_hash: contentHash,
    source_paths: [
      "docs/knowledge/minecraft/entities.json",
      "docs/knowledge/minecraft/items.json",
      "docs/knowledge/minecraft/blocks.json",
      "docs/knowledge/minecraft/patterns.json",
    ],
    generated_at: new Date().toISOString(),
    raw_reference_included: false,
    assistant_answer: false,
  };
}
