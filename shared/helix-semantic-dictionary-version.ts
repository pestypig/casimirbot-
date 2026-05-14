export const HELIX_SEMANTIC_DICTIONARY_VERSION_SCHEMA = "helix.semantic_dictionary_version.v1" as const;

export type HelixSemanticDictionaryVersion = {
  schema: typeof HELIX_SEMANTIC_DICTIONARY_VERSION_SCHEMA;
  dictionary_id: string;
  game_id: "minecraft" | string;
  version_id: string;
  entry_count: number;
  content_hash: string;
  source_paths: string[];
  generated_at: string;
  raw_reference_included: false;
  assistant_answer: false;
};
