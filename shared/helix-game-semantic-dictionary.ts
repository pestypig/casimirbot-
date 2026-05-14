export const HELIX_GAME_SEMANTIC_ENTRY_SCHEMA =
  "helix.game_semantic_entry.v1" as const;

export const HELIX_GAME_SEMANTIC_LOOKUP_RECEIPT_SCHEMA =
  "helix.game_semantic_lookup_receipt.v1" as const;

export type GameSemanticEntryKind =
  | "entity"
  | "item"
  | "block"
  | "biome"
  | "structure"
  | "mechanic";

export type GameSemanticEntry = {
  schema: typeof HELIX_GAME_SEMANTIC_ENTRY_SCHEMA;
  game_id: "minecraft" | string;
  entry_id: string;
  kind: GameSemanticEntryKind;
  label: string;
  categories: string[];
  resources?: Array<{
    item_id: string;
    source:
      | "periodic_drop"
      | "kill_drop"
      | "block_drop"
      | "crafting"
      | "interaction"
      | "container_flow";
    uses: string[];
  }>;
  interactions?: Array<{
    interaction_id: string;
    requires?: string[];
    produces?: string[];
    meaning_hints?: string[];
  }>;
  affordances?: Array<{
    affordance_id: string;
    description: string;
    evidence_indicators: string[];
    missing_evidence_questions: string[];
  }>;
  caution_notes?: string[];
};

export type GameSemanticLookupReceipt = {
  schema: typeof HELIX_GAME_SEMANTIC_LOOKUP_RECEIPT_SCHEMA;
  lookup_id: string;
  thread_id: string;
  query_refs: string[];
  matched_entry_ids: string[];
  compact_summary: string;
  raw_reference_included: false;
  assistant_answer: false;
  ts: string;
};
