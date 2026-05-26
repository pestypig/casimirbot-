// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TheoryBadgeGraphPanel from "../panels/TheoryBadgeGraphPanel";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryBadgePlaybackStore } from "@/store/useTheoryBadgePlaybackStore";
import { useTheoryMapOverlayStore } from "@/store/useTheoryMapOverlayStore";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async () => buildNhm2TheoryBadgeGraphV1(),
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TheoryBadgeGraphPanel />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  useTheoryBadgePlaybackStore.getState().clearPlayback();
  useTheoryBadgeGraphPanelStore.getState().resetPanelMemory();
  useTheoryMapOverlayStore.getState().clearOverlay();
  useScientificCalculatorStore.setState({
    currentLatex: "",
    lastTheoryLoadout: null,
    activeTheoryLoadoutItemIndex: null,
  });
  cleanup();
});

describe("TheoryBadgeGraphPanel achievement map", () => {
  it("loads a badge equation to the calculator without opening an inspector popup", async () => {
    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }));

    expect(screen.queryByText(/Selected: Rest Energy/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Load to Calculator/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inspector List" })).toBeNull();
    expect(screen.queryByText("Achievements")).toBeNull();
    expect(screen.queryByText("Done")).toBeNull();

    await waitFor(() => {
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("E_0=mc^2");
    });
  });

  it("supports multi-select tracing and path playback controls", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }), { ctrlKey: true });
    fireEvent.click(await screen.findByRole("button", { name: "QEI sampling window" }), { ctrlKey: true });

    expect(await screen.findByText("Trace Selected Badges")).toBeTruthy();
    expect(screen.getByText(/Shared ancestors:/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Run Selected Trace/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Run Selected Trace/i }));

    await waitFor(
      () => {
        expect(useTheoryBadgePlaybackStore.getState().status).toBe("complete");
      },
      { timeout: 8000 },
    );
  });

  it("uses the StarSim stellar evolution lens to light mapped badges and load scalar formulas", async () => {
    renderPanel();

    const starSimLensButton = await screen.findByRole("button", { name: "Stellar Evolution atlas lens" });
    expect(starSimLensButton).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Select Main Sequence" }));

    await waitFor(() => {
      expect(useTheoryMapOverlayStore.getState().highlightedBadgeIds).toEqual(
        expect.arrayContaining([
          "starsim.observable.surface_temperature_proxy",
          "starsim.fusion.pp_chain_prior",
          "starsim.runtime.evaluate_fusion_microphysics",
          "starsim.claim_boundary.stage1_reduced_order_prior",
        ]),
      );
    });

    fireEvent.click(screen.getByText("T_eff = T_sun*(L/(R^2))^(1/4)"));

    await waitFor(() => {
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "T_{eff}=T_{sun}\\left(\\frac{L}{R^2}\\right)^{1/4}",
      );
    });
  });

  it("persists the picked StarSim object binding and exposes its loadout to the calculator", async () => {
    const firstRender = renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Select Red Giant" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use K1III red giant object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().selectedStarSimStageId).toBe("starsim.lifecycle.red_giant");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedStarSimObjectBindingId).toBe("red-giant-k1iii");
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.label).toBe("K1III red giant");
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "T_eff = 5772*(65/(12^2))^(1/4)",
      );
    });

    firstRender.unmount();
    renderPanel();

    expect(await screen.findByRole("button", { name: "Use K1III red giant object binding" })).toBeTruthy();
    expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.items.length).toBeGreaterThan(1);
  });

  it("collapses the StarSim lens when its atlas block is clicked again", async () => {
    renderPanel();

    const starSimLensButton = await screen.findByRole("button", { name: "Stellar Evolution atlas lens" });
    expect(await screen.findByText("Stellar Evolution")).toBeTruthy();

    fireEvent.click(starSimLensButton);

    expect(screen.queryByText("Stellar Evolution")).toBeNull();
    expect(screen.getByTestId("theory-achievement-map-scrollport")).toBeTruthy();

    fireEvent.click(starSimLensButton);

    expect(await screen.findByText("Stellar Evolution")).toBeTruthy();
  });

  it("remembers whether the StarSim lens is collapsed across remounts", async () => {
    const firstRender = renderPanel();

    const starSimLensButton = await screen.findByRole("button", { name: "Stellar Evolution atlas lens" });
    expect(await screen.findByText("Stellar Evolution")).toBeTruthy();

    fireEvent.click(starSimLensButton);

    expect(screen.queryByText("Stellar Evolution")).toBeNull();
    expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBeNull();

    firstRender.unmount();
    renderPanel();

    expect(await screen.findByRole("button", { name: "Stellar Evolution atlas lens" })).toBeTruthy();
    expect(screen.queryByText("Stellar Evolution")).toBeNull();
  });

  it("uses the cosmic distance ladder lens to load object-bound redshift rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Cosmic Distance Ladder atlas lens" }));
    expect(await screen.findByText("Distance Ladder")).toBeTruthy();

    fireEvent.click(await screen.findByRole("button", { name: "Select Spectral Shift" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use H-alpha z≈0.1 object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("cosmic_distance_ladder");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCosmicDistanceRungId).toBe("cosmic.ladder.spectral_shift");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCosmicDistanceObjectBindingId).toBe("h-alpha-redshift-0p1");
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe("cosmic_distance_object");
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "z = (721.91 - 656.28) / 656.28",
      );
    });
  });

  it("uses the solar spectrum lens to load object-bound observation rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Solar Surface & Spectrum atlas lens" }));

    expect(await screen.findByText("Surface & Spectrum")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select H-alpha Shift" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();
    expect(useScientificCalculatorStore.getState().currentLatex).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Select H-alpha Shift" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use H-alpha shifted line observation binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("solar_surface_spectrum");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedSolarSpectrumGroupId).toBe("solar.observation.halpha_shift");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedSolarSpectrumObjectBindingId).toBe("halpha-slight-redshift");
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "solar_spectrum_observation",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("E = 6.62607015e-34*299792458/6.5628e-7");
    });
  });

  it("uses the Casimir cavity lens to load object-bound cavity rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Casimir Cavities atlas lens" }));

    expect(await screen.findByText("Cavities")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select Parallel Plate Tile" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();
    expect(useScientificCalculatorStore.getState().currentLatex).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Select Parallel Plate Tile" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use 1 nm / 25 cm2 tile object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("casimir_cavity_modes");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCasimirCavityGroupId).toBe(
        "casimir.cavity.parallel_plate_tile",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCasimirCavityObjectBindingId).toBe(
        "ideal-1nm-25cm2-tile",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "casimir_cavity_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "E_area = -(3.141592653589793^2*3.16152677e-26)/(720*1e-9^3)",
      );
    });
  });

  it("uses the Warp / GR / NHM2 lens to load object-bound diagnostic rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Warp / GR / NHM2 atlas lens" }));

    expect(await screen.findByText("NHM2 Diagnostics")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select Geometry Sample" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select Diagnostic Path" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample diagnostic path object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("warp_gr_nhm2");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedWarpGrNhm2GroupId).toBe("warp.nhm2.diagnostic_path");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedWarpGrNhm2ObjectBindingId).toBe(
        "sample-diagnostic-path",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "nhm2_diagnostic_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("t_proper = 1 + 0.1");
    });
  });

  it("uses the QEI / Stress-Energy lens to load object-bound diagnostic rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "QEI / Stress-Energy atlas lens" }));

    expect(await screen.findByText("Stress-Energy")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select QEI Margin" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select QEI Margin" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample QEI margin object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("qei_stress_energy");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedQeiStressEnergyGroupId).toBe(
        "qei.stress_energy.qei_margin",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedQeiStressEnergyObjectBindingId).toBe(
        "sample-qei-margin",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "nhm2_diagnostic_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("qei_margin = 1 - 0.9");
    });
  });

  it("opens generic atlas lens panels for planned blocks without auto-loading calculator rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Galactic Dynamics atlas lens" }));

    expect(await screen.findByText("Galactic Dynamics")).toBeTruthy();
    expect(screen.getByText("Mapped Badges")).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();
    expect(useScientificCalculatorStore.getState().currentLatex).toBe("");
  });

  it("uses the Tokamak Plasma lens to load object-bound plasma rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Tokamak Plasma atlas lens" }));

    expect(await screen.findByText("Plasma")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select Pressure / Beta" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select Pressure / Beta" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample H-mode beta object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("tokamak_plasma");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedTokamakPlasmaGroupId).toBe(
        "tokamak.plasma.pressure_beta",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedTokamakPlasmaObjectBindingId).toBe(
        "sample-hmode-beta",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "tokamak_plasma_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "p_B = 5.3^2/(2*0.00000125663706212)",
      );
    });
  });

  it("remembers selected badges and viewport position across remounts", async () => {
    const firstRender = renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }), { ctrlKey: true });
    fireEvent.click(await screen.findByRole("button", { name: "QEI sampling window" }), { ctrlKey: true });

    const scrollport = screen.getByTestId("theory-achievement-map-scrollport");
    scrollport.scrollLeft = 240;
    scrollport.scrollTop = 160;
    fireEvent.scroll(scrollport);

    expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeIds).toEqual([
      "physics.relativity.rest_energy",
      "nhm2.qei.sampling_window",
    ]);
    expect(useTheoryBadgeGraphPanelStore.getState().viewport).toEqual({
      scrollLeft: 240,
      scrollTop: 160,
    });

    firstRender.unmount();
    renderPanel();

    expect(await screen.findByText("Trace Selected Badges")).toBeTruthy();
    expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeId).toBe("nhm2.qei.sampling_window");
  });
});
