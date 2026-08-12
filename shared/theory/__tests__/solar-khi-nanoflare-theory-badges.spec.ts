import { describe, expect, it } from "vitest";
import { isTheoryBadgeGraphV1 } from "../../contracts/theory-badge-graph.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import { buildSolarKhiNanoflareTheoryBadgesV1 } from "../solar-khi-nanoflare-theory-badges";

describe("solar KHI/nanoflare theory badges", () => {
  it("integrates the native-resolution branch into the governed graph", () => {
    const branch = buildSolarKhiNanoflareTheoryBadgesV1();
    const graph = buildHelixTheoryBadgeGraphV1();
    const ids = graph.badges.map((badge) => badge.id);

    expect(branch.badges).toHaveLength(9);
    expect(ids).toEqual(expect.arrayContaining([
      "stellar.energy.surface_transport_balance",
      "solar.photosphere.magnetic_boundary_shear",
      "solar.photosphere.khi_growth_observable",
      "solar.photosphere.khi_turbulent_diffusivity",
      "solar.mhd.footpoint_poynting_flux",
      "solar.mhd.flux_braiding_proxy",
      "solar.nanoflare.event_population",
      "solar.cross_scale.khi_nanoflare_gate",
      "stellar.flux_rope.cat_branch_boundary",
    ]));
    expect(isTheoryBadgeGraphV1(graph)).toBe(true);
  });

  it("publishes the canonical scalar summaries while keeping images and tracks as artifacts", () => {
    const branch = buildSolarKhiNanoflareTheoryBadgesV1();
    const observables = branch.badges.flatMap((badge) => badge.observables ?? []);
    const canonicalIds = observables.map((observable) => observable.canonicalObservableId);

    expect(canonicalIds).toEqual(expect.arrayContaining([
      "khi_wavelength_m",
      "khi_growth_rate_s_inv",
      "khi_phase_speed_m_s",
      "khi_shear_thickness_m",
      "khi_turbulent_diffusivity_m2_s",
      "boundary_curvature_rms_m_inv",
      "boundary_track_persistence",
      "poynting_flux_W_m2",
      "helicity_injection_Wb2_s",
      "current_sheet_area_m2",
      "nanoflare_rate_s_inv",
      "nanoflare_energy_J",
      "topology_branch_entropy",
    ]));
    expect(canonicalIds).not.toContain("vortex_mask");
    expect(canonicalIds).not.toContain("image_cube");
  });

  it("keeps causal and quantum promotions fail-closed", () => {
    const branch = buildSolarKhiNanoflareTheoryBadgesV1();
    const gate = branch.badges.find((badge) => badge.id === "solar.cross_scale.khi_nanoflare_gate");
    const catBoundary = branch.badges.find((badge) => badge.id === "stellar.flux_rope.cat_branch_boundary");
    const serialized = JSON.stringify(branch);

    expect(gate?.claimBoundary.promotionAllowed).toBe(false);
    expect(gate?.assumptions.join(" ")).toMatch(/unseen active regions/i);
    expect(gate?.assumptions.join(" ")).toMatch(/Time-shuffled and spatially displaced/i);
    expect(catBoundary?.status).toBe("blocked");
    expect(catBoundary?.assumptions.join(" ")).toMatch(/classical inference weights/i);
    expect(serialized).not.toMatch(/physical quantum superposition observed|KHI causes nanoflares|fusion phase reaches the photosphere/i);
  });
});
