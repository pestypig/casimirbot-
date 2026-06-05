import { describe, expect, it } from "vitest";
import type { PhysicsAtlasBlockV1 } from "../../contracts/physics-atlas.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildHelixPhysicsAtlasV1, buildPhysicsAtlasBlocks } from "../physics-atlas-blocks";

describe("physics atlas blocks", () => {
  it("includes the finite rail domains and source references", () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const atlas = buildHelixPhysicsAtlasV1({ graph });
    const blocks = buildPhysicsAtlasBlocks({ graph });
    const byId = new Map(atlas.blocks.map((block: PhysicsAtlasBlockV1) => [block.id, block]));

    expect(blocks.map((block: PhysicsAtlasBlockV1) => block.glyph)).toEqual([
      "★",
      "C",
      "z",
      "☀",
      "▣",
      "G",
      "N",
      "Q",
      "⊙",
      "◎",
      "κ",
    ]);
    expect(byId.get("stellar_evolution")?.status).toBe("active");
    expect(byId.get("stellar_evolution")?.repoPathHints).toContain("shared/theory/starsim-stellar-evolution-map.ts");
    expect(byId.get("cosmic_distance_ladder")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.status).toBe("active");
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.spectrum.photon_energy",
    );
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.reference.solar_product_registry",
    );
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.sunquake.flare_coupling_window",
    );
    expect(byId.get("solar_surface_spectrum")?.primaryBadgeIds).toContain(
      "solar.nanoflare.heating_proxy",
    );
    expect(byId.get("stellar_evolution")?.primaryBadgeIds).toContain(
      "stellar.structure.hydrostatic_equilibrium",
    );
    expect(byId.get("stellar_evolution")?.primaryBadgeIds).toContain(
      "stellar.nucleosynthesis.reaction_network_context",
    );
    expect(byId.get("stellar_evolution")?.primaryBadgeIds).toContain(
      "starsim.reference.stellar_spectral_abundance_context",
    );
    expect(byId.get("stellar_evolution")?.primaryBadgeIds).toContain(
      "stellar.spectroscopy.atomic_line_identification_context",
    );
    expect(byId.get("stellar_evolution")?.primaryBadgeIds).toContain(
      "stellar.spectroscopy.abundance_proxy_equivalent_width",
    );
    expect(byId.get("stellar_evolution")?.claimBoundaryBadgeIds).toContain(
      "astrochemistry.claim_boundary.spectral_identification_only",
    );
    expect(byId.get("astrochemistry_prebiotic")?.status).toBe("seed");
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "astrochemistry.fullerene.c60_stellar_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "starsim.nucleosynthesis.element_yield_prior",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "astrochemistry.spectroscopy.molecular_band_identification_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "astrochemistry.claim_boundary.spectral_identification_only",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "astrochemistry.pah.spectral_family_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "prebiotic.inventory.meteoritic_organics_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "prebiotic.photochemistry.radiation_processing_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "prebiotic.surface_catalysis.mineral_aqueous_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "prebiotic.aromatic_ring.coupled_oscillator_context",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "prebiotic.coherence.decoherence_lifetime_gate",
    );
    expect(byId.get("astrochemistry_prebiotic")?.primaryBadgeIds).toContain(
      "biophysics.membrane.open_system_entropy_flow",
    );
    expect(byId.get("astrochemistry_prebiotic")?.claimBoundaryBadgeIds).toContain(
      "prebiotic.claim_boundary.dopamine_not_pah_shortcut",
    );
    expect(byId.get("astrochemistry_prebiotic")?.claimBoundaryBadgeIds).toContain(
      "orch_or.claim_boundary.prebiotic_consciousness_exploratory_only",
    );
    expect(byId.get("casimir_cavity_modes")?.repoPathHints).toContain("modules/sim_core/static-casimir.ts");
    expect(byId.get("nhm2_full_solve")?.status).toBe("seed");
    expect(byId.get("nhm2_full_solve")?.primaryBadgeIds).toContain(
      "nhm2.observer.eulerian_normal",
    );
    expect(byId.get("nhm2_full_solve")?.primaryBadgeIds).toContain(
      "nhm2.tensor.metric_required_stress_energy",
    );
    expect(byId.get("nhm2_full_solve")?.primaryBadgeIds).toContain(
      "nhm2.closure.same_basis_regional_residual",
    );
    expect(byId.get("nhm2_full_solve")?.claimBoundaryBadgeIds).toContain(
      "nhm2.claim_boundary.diagnostic_only",
    );
    expect(byId.get("galactic_dynamics")?.primaryBadgeIds).toContain(
      "tidal.love_number.displacement_response",
    );
    expect(byId.get("galactic_dynamics")?.claimBoundaryBadgeIds).toContain(
      "tidal.claim_boundary.material_response_only",
    );
    expect(byId.get("galactic_dynamics")?.repoPathHints).toContain(
      "shared/theory/granular-tidal-love-number-theory-badges.ts",
    );
    expect(byId.get("curvature_collapse")?.status).toBe("active");
    expect(byId.get("curvature_collapse")?.primaryBadgeIds).toContain("curvature.proxy.body_density");
    expect(byId.get("curvature_collapse")?.primaryBadgeIds).toContain("orch_or.microtubule.coherence_window");
    expect(byId.get("curvature_collapse")?.claimBoundaryBadgeIds).toContain(
      "orch_or.claim_boundary.exploratory_only",
    );
    expect(byId.get("curvature_collapse")?.repoPathHints).toContain(
      "shared/theory/orch-or-coherence-theory-badges.ts",
    );
  });
});
