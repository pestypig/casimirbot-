import { describe, expect, it } from "vitest";

import { resolveProviderCompoundPromptContract } from "../provider-compound-contract";

describe("provider compound contract projection", () => {
  it("derives the canonical compound contract before provider tool continuation", () => {
    const contract = resolveProviderCompoundPromptContract({
      payload: {},
      promptText:
        'Safely test the gamerule now. First query "/gamerule doDaylightCycle". Then restore it and query it again to verify restoration.',
    });

    expect(contract).toMatchObject({
      schema: "helix.compound_prompt_contract.v1",
      requirements: [
        expect.objectContaining({ id: "R1" }),
        expect.objectContaining({ id: "R2", depends_on: ["R1"] }),
      ],
      output_contract: expect.objectContaining({
        allow_partial_answer: false,
      }),
    });
  });

  it("preserves an already projected canonical contract", () => {
    const existing = resolveProviderCompoundPromptContract({
      payload: {},
      promptText:
        "Test the first requirement now. Then test the second requirement.",
    });
    expect(existing).not.toBeNull();

    expect(
      resolveProviderCompoundPromptContract({
        payload: { compound_prompt_contract: existing },
        promptText: "Different prompt text that must not replace the contract.",
      }),
    ).toBe(existing);
  });
});
