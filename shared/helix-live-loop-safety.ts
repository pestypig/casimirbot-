import { createHash } from "node:crypto";

export type LiveLoopOutputKind =
  | "typed_evidence"
  | "live_line_update"
  | "salience_candidate"
  | "policy_receipt"
  | "operator_referral"
  | "ask_turn_candidate";

export type LiveLoopForbiddenOutputKind =
  | "hidden_ask_turn"
  | "system_instruction"
  | "assistant_message"
  | "ungated_recommendation"
  | "provider_command";

export type LiveLoopSafetyReceipt = {
  schema: "helix.live_loop_safety_receipt.v1";
  receipt_id: string;
  loop_id: string;
  checked_output_count: number;
  forbidden_output_count: 0;
  forbidden_outputs: never[];
  allowed_output_kinds: LiveLoopOutputKind[];
  raw_transcript_included: false;
  raw_image_included: false;
  raw_audio_included: false;
  raw_logs_included: false;
  assistant_answer: false;
  created_at: string;
};

export function assertLiveLoopOutputSafe(outputs: unknown[]): LiveLoopSafetyReceipt {
  for (const output of outputs) {
    assertNoInstructionAuthority(output);
    assertNoHiddenAskTurn(output);
    assertNoSurfaceText(output);
    assertNoUngatedRecommendation(output);
    assertRawContentExcluded(output);
  }

  return {
    schema: "helix.live_loop_safety_receipt.v1",
    receipt_id: `live_loop_safety:${hashShort(outputs)}`,
    loop_id: "live_scenario_loop",
    checked_output_count: outputs.length,
    forbidden_output_count: 0,
    forbidden_outputs: [],
    allowed_output_kinds: inferAllowedOutputKinds(outputs),
    raw_transcript_included: false,
    raw_image_included: false,
    raw_audio_included: false,
    raw_logs_included: false,
    assistant_answer: false,
    created_at: new Date().toISOString(),
  };
}

function assertNoInstructionAuthority(output: unknown): void {
  visitObjects(output, (value) => {
    if (value.instruction_authority !== undefined && value.instruction_authority !== "none") {
      throw new Error("Live loop output has instruction authority.");
    }
    if (
      value.ask_instruction_authority !== undefined &&
      value.ask_instruction_authority !== "none"
    ) {
      throw new Error("Live loop output has Ask instruction authority.");
    }
    if (value.role === "system" || value.context_role === "system_instruction") {
      throw new Error("Live loop output contains a system instruction.");
    }
  });
}

function assertNoHiddenAskTurn(output: unknown): void {
  visitObjects(output, (value) => {
    if (value.creates_ask_turn === true || value.hidden_ask_turn === true) {
      throw new Error("Live loop output creates a hidden Ask turn.");
    }
  });
}

function assertNoSurfaceText(output: unknown): void {
  visitObjects(output, (value) => {
    if (typeof value.surface_text === "string" || typeof value.ui_candidate_text === "string") {
      throw new Error("Live loop output contains ungated surface text.");
    }
  });
}

function assertNoUngatedRecommendation(output: unknown): void {
  visitObjects(output, (value) => {
    if (
      typeof value.recommendation === "string" &&
      value.may_update_recommendation_line !== true
    ) {
      throw new Error("Live loop output contains ungated recommendation.");
    }
    if (
      value.key === "recommendation" &&
      value.ask_admissible !== false &&
      value.may_update_recommendation_line !== true
    ) {
      throw new Error("Live loop recommendation line is Ask-admissible or ungated.");
    }
  });
}

function assertRawContentExcluded(output: unknown): void {
  visitObjects(output, (value) => {
    for (const field of [
      "raw_user_text_included",
      "raw_transcript_included",
      "raw_image_included",
      "raw_audio_included",
      "raw_logs_included",
      "raw_content_included",
      "raw_caption_included",
    ]) {
      if (value[field] === true) {
        throw new Error(`Live loop output includes raw content: ${field}`);
      }
    }
  });
}

function inferAllowedOutputKinds(outputs: unknown[]): LiveLoopOutputKind[] {
  const kinds = new Set<LiveLoopOutputKind>();
  for (const output of outputs) {
    visitObjects(output, (value) => {
      if (value.context_role === "tool_evidence") {
        kinds.add("typed_evidence");
      }
      if (value.context_role === "policy_receipt") {
        kinds.add("policy_receipt");
      }
      if (value.context_role === "operator_referral") {
        kinds.add("operator_referral");
      }
      if (value.salience_candidate === true) {
        kinds.add("salience_candidate");
      }
      if (value.natural_language_scope === "ui_summary_only") {
        kinds.add("live_line_update");
      }
      if (value.direct_address_candidate === true) {
        kinds.add("ask_turn_candidate");
      }
    });
  }

  return [...kinds].sort();
}

function visitObjects(value: unknown, visit: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      visitObjects(item, visit);
    }
    return;
  }

  const objectValue = value as Record<string, unknown>;
  visit(objectValue);
  for (const nested of Object.values(objectValue)) {
    visitObjects(nested, visit);
  }
}

function hashShort(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 12);
}
