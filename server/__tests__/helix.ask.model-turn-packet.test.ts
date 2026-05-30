import { describe, expect, it } from "vitest";

import { buildHelixModelTurnPacket } from "../services/helix-ask/model-turn-packet";
import { coerceTestOverrideToModelTurnResult } from "../services/helix-ask/model-turn-executor";
import { applyModelTurnAssistantMessageAsFinalDraft } from "../services/helix-ask/model-turn-final-draft";

const richPrompt =
  'Can you relate to the theory concept badge ? "Yea but what exactly is a field anyways? Both electrons and photons are considered zero-dimensional point particles without physical volume, radius, or a hard surface. Since we are all made of these invisible building blocks we actually do not exist in the physical sense! dimension are mathematical representations of reality and that notation is also not real fields emerge from electron movement and this is known as a probability in a sphere"';

describe("Helix Ask model turn packet", () => {
  it("preserves full rich conceptual prompts", () => {
    const packet = buildHelixModelTurnPacket({
      turnId: "turn-1",
      promptText: richPrompt,
      payload: {
        canonical_goal_frame: { goal_kind: "model_only_concept" },
        route_product_contract: { schema: "helix.route_product_contract.v1" },
      },
      artifactLedger: [],
      outputBudget: {
        schema: "helix.final_answer_output_budget.v1",
        mode: "long",
        max_tokens: 4096,
      },
    });

    expect(packet.prompt_text).toBe(richPrompt);
    expect(JSON.stringify(packet)).toContain("field");
    expect(JSON.stringify(packet)).toContain("photon");
    expect(JSON.stringify(packet)).toContain("probability");
    expect(packet.loop_policy.require_model_authored_terminal).toBe(true);
  });

  it("materializes model turn assistant messages as final_answer_draft", () => {
    const packet = buildHelixModelTurnPacket({
      turnId: "turn-2",
      promptText: richPrompt,
      payload: {},
      artifactLedger: [],
      outputBudget: {
        schema: "helix.final_answer_output_budget.v1",
        mode: "long",
        max_tokens: 4096,
      },
    });
    const modelTurnResult = coerceTestOverrideToModelTurnResult({
      packet,
      override: {
        status: "assistant_message",
        text: "A field is the model system; electrons and photons are pointlike quanta, and probability clouds describe orbitals.",
      },
    });
    const payloadAfter = applyModelTurnAssistantMessageAsFinalDraft({
      turnId: "turn-2",
      payload: {},
      text: modelTurnResult.assistant_message_text ?? "",
      modelTurnResult,
      outputBudget: packet.output_budget,
    });

    expect(payloadAfter.final_answer_draft).toMatchObject({
      schema: "helix.final_answer_draft.v1",
      source: "model_turn",
      authority: "model_turn_assistant_message",
      output_budget: {
        schema: "helix.final_answer_output_budget.v1",
        mode: "long",
      },
    });
  });
});
