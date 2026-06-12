import { describe, expect, it } from "vitest";

import {
  ELEMENT_ORIGIN_PROFILE_BY_SYMBOL,
  ELEMENT_ORIGIN_REGISTRY,
  ELEMENT_Z_LOOKUP,
} from "@shared/periodic-table";

describe("ELEMENT_Z_LOOKUP", () => {
  it("covers all 118 elements", () => {
    expect(ELEMENT_Z_LOOKUP).toHaveLength(118);
    expect(ELEMENT_Z_LOOKUP[0]).toEqual({ name: "hydrogen", Z: 1 });
    expect(ELEMENT_Z_LOOKUP[117]).toEqual({ name: "oganesson", Z: 118 });
  });
});

describe("ELEMENT_ORIGIN_REGISTRY", () => {
  it("keeps all 118 elements with origin, observable, and source metadata", () => {
    expect(ELEMENT_ORIGIN_REGISTRY).toHaveLength(118);

    for (const entry of ELEMENT_ORIGIN_REGISTRY) {
      expect(entry.symbol).toMatch(/^[A-Z][a-z]?$/);
      expect(entry.name).toBeTruthy();
      expect(entry.Z).toBeGreaterThan(0);
      expect(entry.originFamilies.length).toBeGreaterThan(0);
      expect(entry.originFamilies).toContain(entry.primaryOrigin);
      expect(entry.originSummary).toBeTruthy();
      expect(entry.observableRoutes.length).toBeGreaterThan(0);
      expect(entry.evidenceNotes.length).toBeGreaterThan(0);
      expect(entry.claimBoundaryNotes.length).toBeGreaterThan(0);
      expect(entry.sourceKeys.length).toBeGreaterThan(0);
    }
  });

  it("has an explicit origin profile for every element symbol", () => {
    const registrySymbols = ELEMENT_ORIGIN_REGISTRY.map((entry) => entry.symbol);

    expect(Object.keys(ELEMENT_ORIGIN_PROFILE_BY_SYMBOL).sort()).toEqual([...registrySymbols].sort());
    for (const symbol of registrySymbols) {
      const profile = ELEMENT_ORIGIN_PROFILE_BY_SYMBOL[symbol];
      expect(profile.originSummary).toBeTruthy();
      expect(profile.originFamilies.length).toBeGreaterThan(0);
      expect(profile.evidenceNotes?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("assigns representative elements to expected origin families", () => {
    const bySymbol = new Map(ELEMENT_ORIGIN_REGISTRY.map((entry) => [entry.symbol, entry]));

    expect(bySymbol.get("H")?.originFamilies).toContain("big_bang_nucleosynthesis");
    expect(bySymbol.get("He")?.originFamilies).toEqual(
      expect.arrayContaining(["big_bang_nucleosynthesis", "hydrogen_burning"]),
    );
    expect(bySymbol.get("C")?.originFamilies).toContain("helium_burning_triple_alpha");
    expect(bySymbol.get("O")?.originFamilies).toContain("alpha_capture");
    expect(bySymbol.get("Fe")?.originFamilies).toEqual(
      expect.arrayContaining(["advanced_stellar_burning", "explosive_nucleosynthesis"]),
    );
    expect(bySymbol.get("Li")?.originFamilies).toContain("cosmic_ray_spallation");
    expect(bySymbol.get("Be")?.originFamilies).toContain("cosmic_ray_spallation");
    expect(bySymbol.get("B")?.originFamilies).toContain("cosmic_ray_spallation");
    expect(bySymbol.get("Sr")?.originFamilies).toContain("s_process");
    expect(bySymbol.get("Ba")?.originFamilies).toContain("s_process");
    expect(bySymbol.get("Pb")?.originFamilies).toContain("s_process");
    expect(bySymbol.get("Au")?.originFamilies).toContain("r_process");
    expect(bySymbol.get("U")?.originFamilies).toContain("r_process");
    expect(bySymbol.get("Og")?.originFamilies).toContain("synthetic_lab");
  });
});
