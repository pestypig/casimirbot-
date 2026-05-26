import { describe, expect, it } from "vitest";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTokamakPlasmaTheoryBadgesV1 } from "../tokamak-plasma-theory-badges";

describe("Tokamak plasma theory badges", () => {
  it("defines loadable scalar badges and runtime boundary context", () => {
    const branch = buildTokamakPlasmaTheoryBadgesV1();
    expect(branch.badges.some((badge) => badge.id === "tokamak.plasma.beta_proxy")).toBe(true);
    expect(branch.badges.some((badge) => badge.id === "tokamak.claim_boundary.diagnostic_proxy")).toBe(true);
    expect(branch.badges.filter((badge) => badge.calculatorPayloads.length > 0).length).toBeGreaterThanOrEqual(7);
    expect(JSON.stringify(branch)).not.toMatch(/stability confirmed|control validation|disruption prediction validated/i);
  });

  it("is merged into the main theory graph", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    expect(graph.badges.some((badge) => badge.id === "tokamak.runtime.energy_field")).toBe(true);
    expect(graph.edges.some((edge) => edge.id === "tokamak_magnetic_pressure_feeds_beta")).toBe(true);
  });
});
