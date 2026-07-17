import { describe, expect, it } from "vitest";

import { evaluateHelixReplitParityFixture } from "../../scripts/helix-replit-parity-static";

describe("Helix Ask local/Replit parity fixture", () => {
  it("binds the prior superconductivity answer and produces the canonical exact badge", async () => {
    const result = await evaluateHelixReplitParityFixture();

    expect(result.schema).toBe("helix.replit_parity_static_result.v1");
    expect(result.parity_contract_sha256).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.scenarios).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "theory_badge_graph_superconductivity_referent",
        referent_source_ref: "chat.final_answer.previous:parity-superconductivity",
        exact_badge_ids: expect.arrayContaining([
          "low_temp.superconductivity.zero_dc_resistance_bounds",
        ]),
      }),
    ]));
  });
});
