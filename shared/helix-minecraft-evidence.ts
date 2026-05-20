export type {
  AskContextPolicy,
  AskInstructionAuthority,
  InstructionAuthority,
  LiveEvidenceLayer as EvidenceLayer,
  LiveEvidenceTrust as EvidenceTrust,
  LiveScenarioSafetyEnvelope,
} from "./helix-live-scenario-evidence.ts";

import type {
  AskContextPolicy,
  InstructionAuthority,
  LiveScenarioContextRole,
} from "./helix-live-scenario-evidence.ts";

export type ContextRole = LiveScenarioContextRole | "ui_summary";

export type NaturalLanguageScope =
  | "ui_summary_only"
  | "operator_summary_only";

export type EvidenceSafety = {
  context_role: ContextRole;
  instruction_authority: InstructionAuthority;
  ask_instruction_authority: InstructionAuthority;
  ask_context_policy: AskContextPolicy;
  creates_ask_turn: false;
  turn_triggered: false;
  raw_user_text_included?: false;
  raw_transcript_included?: false;
  raw_image_included?: false;
  raw_caption_included?: false;
  natural_language_scope?: NaturalLanguageScope;
  ask_admissible: boolean;
};

export const TOOL_EVIDENCE_SAFETY: EvidenceSafety = Object.freeze({
  context_role: "tool_evidence",
  instruction_authority: "none",
  ask_instruction_authority: "none",
  ask_context_policy: "evidence_only",
  creates_ask_turn: false,
  turn_triggered: false,
  raw_user_text_included: false,
  raw_transcript_included: false,
  raw_image_included: false,
  raw_caption_included: false,
  ask_admissible: true,
});

export function toolEvidenceSafety(
  overrides: Partial<EvidenceSafety> = {},
): EvidenceSafety {
  return {
    ...TOOL_EVIDENCE_SAFETY,
    ...overrides,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    creates_ask_turn: false,
    turn_triggered: false,
  };
}

export function isAskAdmissibleEvidence(value: unknown): value is EvidenceSafety {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EvidenceSafety>;
  return (
    candidate.ask_admissible === true &&
    candidate.instruction_authority === "none" &&
    candidate.ask_instruction_authority === "none" &&
    candidate.creates_ask_turn === false &&
    candidate.turn_triggered === false &&
    candidate.natural_language_scope === undefined &&
    candidate.ask_context_policy !== "not_admissible"
  );
}

export function assertEvidenceHasNoInstructionAuthority(value: unknown): void {
  if (!value || typeof value !== "object") {
    throw new Error("Evidence item must be an object.");
  }

  const candidate = value as Partial<EvidenceSafety>;
  if (candidate.instruction_authority !== "none") {
    throw new Error("Evidence item has non-none instruction_authority.");
  }
  if (candidate.ask_instruction_authority !== "none") {
    throw new Error("Evidence item has non-none ask_instruction_authority.");
  }
  if (candidate.creates_ask_turn !== false) {
    throw new Error("Evidence item may create an Ask turn.");
  }
  if (candidate.turn_triggered !== false) {
    throw new Error("Evidence item was turn-triggered.");
  }
}

export function makeId(prefix: string, seed: string | number): string {
  return `${prefix}_${String(seed).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
