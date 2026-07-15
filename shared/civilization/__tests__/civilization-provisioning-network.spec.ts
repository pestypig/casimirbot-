import { describe, expect, it } from "vitest";
import { validateCivilizationProvisioningNetworkV1 } from "../../contracts/civilization-provisioning-network.v1";
import { buildCivilizationProvisioningNetworkV1 } from "../build-civilization-provisioning-network";

describe("Civilization Provisioning Network", () => {
  it("builds an evidence-only provisioning receipt without a scalar civilization score", () => {
    const artifact = buildCivilizationProvisioningNetworkV1({
      text: [
        "Trace a cross-border water and energy supply project.",
        "Include transport energy, maintenance, buffers, research cooperation, tax and market contributions,",
        "and a bottleneck that may shift unequal burdens between jurisdictions.",
      ].join(" "),
      refs: ["turn:provisioning"],
    });

    expect(artifact).not.toBeNull();
    expect(validateCivilizationProvisioningNetworkV1(artifact)).toEqual([]);
    expect(artifact?.system.boundary).toBe("trade_bloc");
    expect(artifact?.needs.map((need) => need.primitive)).toEqual(
      expect.arrayContaining(["usable_energy", "water_or_working_medium"]),
    );
    expect(artifact?.cooperationProjects).toHaveLength(1);
    expect(artifact?.moralNodeIds).toEqual(
      expect.arrayContaining(["need-before-allocation", "cooperation-without-assimilation"]),
    );
    expect(artifact?.authority).toMatchObject({
      terminal_eligible: false,
      policy_finality: false,
      biological_policy_derivation: false,
      overall_efficiency_score_allowed: false,
    });
    expect(artifact).not.toHaveProperty("civilizationBalanceScore");
    expect(artifact).not.toHaveProperty("overallEfficiencyScore");
  });

  it("does not turn an organism analogy into budget or policy authority", () => {
    const artifact = buildCivilizationProvisioningNetworkV1({
      text: "A plant captures energy directly. Does that mean every society should use the same tax budget?",
    });

    expect(artifact).not.toBeNull();
    expect(artifact?.authority.biological_policy_derivation).toBe(false);
    expect(artifact?.authority.budget_authority).toBe(false);
    expect(artifact?.missingEvidence).toContain("absolute_and_relative_contributions");
  });

  it("rejects later attempts to attach a global efficiency score", () => {
    const artifact = buildCivilizationProvisioningNetworkV1({ text: "Map water supply and transport logistics." });
    expect(validateCivilizationProvisioningNetworkV1({ ...artifact, overallEfficiencyScore: 0.9 })).toContain(
      "overallEfficiencyScore is forbidden",
    );
  });
});
