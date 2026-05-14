import type { GameSemanticEntry } from "./helix-game-semantic-dictionary";

export const HELIX_GAME_AFFORDANCE_REFERENCE_SCHEMA =
  "helix.game_affordance_reference.v1" as const;

export type GameAffordanceReference = {
  schema: typeof HELIX_GAME_AFFORDANCE_REFERENCE_SCHEMA;
  game_id: string;
  subject_ref: string;
  semantic_entry_refs: string[];
  affordances: NonNullable<GameSemanticEntry["affordances"]>;
  raw_reference_included: false;
  assistant_answer: false;
};
