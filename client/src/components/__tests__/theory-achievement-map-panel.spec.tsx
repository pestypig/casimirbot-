// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TheoryBadgeGraphPanel from "../panels/TheoryBadgeGraphPanel";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryBadgePlaybackStore } from "@/store/useTheoryBadgePlaybackStore";
import { useTheoryCompoundRunStore } from "@/store/useTheoryCompoundRunStore";
import { useTheoryMapOverlayStore } from "@/store/useTheoryMapOverlayStore";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { buildTheoryContextReflectionV1 } from "@shared/contracts/theory-context-reflection.v1";

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
  useTheoryCompoundRunStore.getState().clearTheoryRun();
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
  it("renders no discussion soft region when reflection overlay is empty", async () => {
    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    expect(screen.queryByTestId("discussion-soft-region")).toBeNull();
    expect(screen.queryByTestId("discussion-zone-legend")).toBeNull();
  });

  it("zooms the achievement map with floating controls and plus/minus keys", async () => {
    renderPanel();

    const scrollport = await screen.findByTestId("theory-achievement-map-scrollport");
    const initialZoom = Number(scrollport.getAttribute("data-zoom-level"));

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    await waitFor(() => {
      expect(Number(scrollport.getAttribute("data-zoom-level"))).toBeGreaterThan(initialZoom);
    });

    const zoomedIn = Number(scrollport.getAttribute("data-zoom-level"));
    fireEvent.keyDown(window, { key: "-", code: "Minus" });

    await waitFor(() => {
      expect(Number(scrollport.getAttribute("data-zoom-level"))).toBeLessThan(zoomedIn);
    });

    const zoomedOut = Number(scrollport.getAttribute("data-zoom-level"));
    fireEvent.keyDown(window, { key: "+", code: "Equal" });

    await waitFor(() => {
      expect(Number(scrollport.getAttribute("data-zoom-level"))).toBeGreaterThan(zoomedOut);
    });
  });

  it("keeps reflection receipts as backend memory with a live answer rail block", async () => {
    const artifact = buildTheoryContextReflectionV1({
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:inspector-test",
      graphId: "nhm2-theory-badge-graph",
      input: {
        prompt: "Where does source residual and QEI fit?",
        conversationContext: null,
        mentionedEquations: [],
        mentionedSymbols: ["qei_margin", "R_source"],
        mentionedDomains: ["warp_gr_nhm2"],
        source: "helix_ask",
        confidenceMode: "soft_locator",
      },
      exactMatches: [],
      likelyMatches: [],
      inferredDomains: [
        {
          atlasBlockId: "warp_gr_nhm2",
          title: "Warp / GR / NHM2",
          score: 0.91,
          reasons: ["domain term match"],
        },
      ],
      overlay: {
        centerBadgeIds: ["nhm2.qei.sampling_window"],
        highlightedBadgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
        highlightedEdgeIds: [],
        heatByBadgeId: {
          "nhm2.qei.sampling_window": 1,
          "nhm2.closure.source_residual": 0.7,
        },
        exactBadgeIds: ["nhm2.qei.sampling_window"],
        likelyBadgeIds: ["nhm2.closure.source_residual"],
        softRegion: {
          id: "discussion-zone:inspector-test",
          label: "Current discussion zone",
          badgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
          confidence: 0.8,
          tone: "green",
          meaning: "discussion_context_not_proof",
        },
      },
      evidenceForAsk: {
        summary: "The discussion appears near QEI and source residual.",
        claimBoundaries: ["Diagnostic-only context."],
        recommendedNextActions: [
          {
            actionId: "theory-badge-graph.build_compound_theory_run",
            label: "Build compound theory run",
            panelId: "theory-badge-graph",
            args: {},
            mutatesCalculator: false,
            solves: false,
          },
        ],
      },
    });
    useTheoryMapOverlayStore.getState().setReflectionOverlay(artifact);

    renderPanel();

    expect(await screen.findByRole("button", { name: "Live answer theory context" })).toBeTruthy();
    expect(screen.queryByTestId("discussion-zone-legend")).toBeNull();
    expect(screen.queryByTestId("reflection-receipt-inspector")).toBeNull();
    expect(screen.queryByText("The discussion appears near QEI and source residual.")).toBeNull();
    expect(useTheoryMapOverlayStore.getState().lastReflectionArtifact).toBe(artifact);
  });

  it("renders theory probability terrain for live reflection uncertainty", async () => {
    const artifact = buildTheoryContextReflectionV1({
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:probability-terrain-test",
      graphId: "nhm2-theory-badge-graph",
      input: {
        prompt: "Where do photon energy and solar spectrum belong?",
        conversationContext: null,
        mentionedEquations: ["E = h*f"],
        mentionedSymbols: ["E", "h", "f"],
        mentionedDomains: ["solar_surface_spectrum"],
        source: "helix_ask",
        confidenceMode: "soft_locator",
      },
      exactMatches: [],
      likelyMatches: [],
      inferredDomains: [],
      overlay: {
        centerBadgeIds: ["solar.spectrum.photon_energy"],
        highlightedBadgeIds: ["solar.spectrum.photon_energy"],
        highlightedEdgeIds: [],
        heatByBadgeId: { "solar.spectrum.photon_energy": 1 },
        exactBadgeIds: ["solar.spectrum.photon_energy"],
        likelyBadgeIds: [],
        uncertainty: {
          badgeProbabilityById: { "solar.spectrum.photon_energy": 1 },
          renderChunkProbabilityById: { "theory:0:0": 1 },
          semanticChunkProbabilityById: { "theory:abstract_formal:solar:canonical": 1 },
          priorEntropyBits: 0,
          posteriorEntropyBits: 0,
          informationGainBits: 0,
          normalizedMass: 1,
          uncertaintyMode: "focused",
        },
        softRegion: {
          id: "discussion-zone:probability-terrain-test",
          label: "Current discussion zone",
          badgeIds: ["solar.spectrum.photon_energy"],
          confidence: 0.9,
          tone: "green",
          meaning: "discussion_context_not_proof",
        },
      },
      evidenceForAsk: {
        summary: "The discussion appears near photon energy.",
        claimBoundaries: [],
        recommendedNextActions: [],
      },
    });
    useTheoryMapOverlayStore.getState().setReflectionOverlay(artifact);

    renderPanel();

    expect(await screen.findByTestId("theory-probability-terrain-field")).toBeTruthy();
    expect(screen.getAllByTestId("probability-terrain-contour").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("discussion-soft-region")).toBeNull();
  });

  it("lets atlas lenses change the map without losing the live answer context", async () => {
    const artifact = buildTheoryContextReflectionV1({
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:live-context-test",
      graphId: "nhm2-theory-badge-graph",
      input: {
        prompt: "Where does E=hf fit?",
        conversationContext: null,
        mentionedEquations: ["E = h*f"],
        mentionedSymbols: ["E", "h", "f"],
        mentionedDomains: ["solar_surface_spectrum"],
        source: "helix_ask",
        confidenceMode: "soft_locator",
      },
      exactMatches: [],
      likelyMatches: [],
      inferredDomains: [],
      overlay: {
        centerBadgeIds: ["solar.spectrum.photon_energy"],
        highlightedBadgeIds: ["solar.spectrum.photon_energy"],
        highlightedEdgeIds: [],
        heatByBadgeId: { "solar.spectrum.photon_energy": 1 },
        exactBadgeIds: ["solar.spectrum.photon_energy"],
        likelyBadgeIds: [],
        softRegion: {
          id: "discussion-zone:live-context-test",
          label: "Current discussion zone",
          badgeIds: ["solar.spectrum.photon_energy"],
          confidence: 0.9,
          tone: "green",
          meaning: "discussion_context_not_proof",
        },
      },
      evidenceForAsk: {
        summary: "The discussion appears near photon energy.",
        claimBoundaries: [],
        recommendedNextActions: [],
      },
    });
    useTheoryMapOverlayStore.getState().setReflectionOverlay(artifact);

    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Solar Surface & Spectrum atlas lens" }));
    expect(useTheoryMapOverlayStore.getState().source).toBe("multi_select");
    expect(useTheoryMapOverlayStore.getState().lastReflectionArtifact).toBe(artifact);

    fireEvent.click(screen.getByRole("button", { name: "Live answer theory context" }));
    expect(useTheoryMapOverlayStore.getState().source).toBe("discussion_reflection");
    expect(useTheoryMapOverlayStore.getState().highlightedBadgeIds).toEqual(["solar.spectrum.photon_energy"]);
  });

  it("keeps discussion soft regions hidden from the front-facing map", async () => {
    const artifact = buildTheoryContextReflectionV1({
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:map-test",
      graphId: "nhm2-theory-badge-graph",
      input: {
        prompt: "Discuss QEI margin and source residual.",
        conversationContext: null,
        mentionedEquations: [],
        mentionedSymbols: ["qei_margin", "R_source"],
        mentionedDomains: ["warp_gr_nhm2"],
        source: "helix_ask",
        confidenceMode: "soft_locator",
      },
      exactMatches: [],
      likelyMatches: [],
      inferredDomains: [],
      overlay: {
        centerBadgeIds: ["nhm2.qei.sampling_window"],
        highlightedBadgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
        highlightedEdgeIds: [],
        heatByBadgeId: {
          "nhm2.qei.sampling_window": 1,
          "nhm2.closure.source_residual": 0.7,
        },
        exactBadgeIds: ["nhm2.qei.sampling_window"],
        likelyBadgeIds: ["nhm2.closure.source_residual"],
        softRegion: {
          id: "discussion-zone:map-test",
          label: "Current discussion zone",
          badgeIds: ["nhm2.qei.sampling_window", "nhm2.closure.source_residual"],
          confidence: 0.8,
          tone: "green",
          meaning: "discussion_context_not_proof",
        },
      },
      evidenceForAsk: {
        summary: "The discussion appears near QEI and source residual.",
        claimBoundaries: ["Diagnostic-only context."],
        recommendedNextActions: [],
      },
    });
    useTheoryMapOverlayStore.getState().setReflectionOverlay(artifact);

    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    expect(screen.queryByTestId("discussion-soft-region")).toBeNull();
    expect(screen.queryByText("Current discussion zone")).toBeNull();
    expect(screen.getByRole("button", { name: "QEI badge replay margin" })).not.toHaveAttribute(
      "data-discussion-match",
    );
    expect(screen.getByRole("button", { name: "Source residual" })).not.toHaveAttribute("data-discussion-match");
  });

  it("keeps claim-boundary badge styling without discussion marker rings", async () => {
    const artifact = buildTheoryContextReflectionV1({
      generatedAt: "2026-05-31T00:00:00.000Z",
      reflectionId: "reflection:boundary-test",
      graphId: "nhm2-theory-badge-graph",
      input: {
        prompt: "Discuss diagnostic-only claim boundary.",
        conversationContext: null,
        mentionedEquations: [],
        mentionedSymbols: [],
        mentionedDomains: ["warp_gr_nhm2"],
        source: "helix_ask",
        confidenceMode: "soft_locator",
      },
      exactMatches: [],
      likelyMatches: [],
      inferredDomains: [],
      overlay: {
        centerBadgeIds: ["nhm2.claim_boundary.diagnostic_only"],
        highlightedBadgeIds: ["nhm2.claim_boundary.diagnostic_only"],
        highlightedEdgeIds: [],
        heatByBadgeId: { "nhm2.claim_boundary.diagnostic_only": 1 },
        exactBadgeIds: ["nhm2.claim_boundary.diagnostic_only"],
        likelyBadgeIds: [],
        softRegion: {
          id: "discussion-zone:boundary-test",
          label: "Current discussion zone",
          badgeIds: ["nhm2.claim_boundary.diagnostic_only"],
          confidence: 0.9,
          tone: "green",
          meaning: "discussion_context_not_proof",
        },
      },
      evidenceForAsk: {
        summary: "The discussion appears near the NHM2 claim boundary.",
        claimBoundaries: ["Diagnostic-only context."],
        recommendedNextActions: [],
      },
    });
    useTheoryMapOverlayStore.getState().setReflectionOverlay(artifact);

    renderPanel();
    const boundary = await screen.findByRole("button", { name: "Diagnostic-only claim boundary" });

    expect(boundary).not.toHaveAttribute("data-discussion-match");
    expect(boundary.className).toMatch(/border-amber-300/);
    expect(boundary.className).not.toMatch(/ring-emerald/);
  });

  it("loads a badge equation to the calculator without opening an inspector popup", async () => {
    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Load Theory Run" })).toBeNull();
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

  it("does not put theory-run controls directly on the badge graph", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Einstein field equation" }));

    expect(screen.queryByRole("button", { name: "Load Theory Run" })).toBeNull();
    expect(screen.queryByText("Concept Map")).toBeNull();
    expect(screen.queryByText("Execution Map")).toBeNull();
    expect(screen.queryByText("Evidence Map")).toBeNull();
  });

  it("loads tensor reference badges as compound theory runs", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Einstein field equation" }));

    await waitFor(() => {
      const runState = useTheoryCompoundRunStore.getState();
      expect(runState.activeTheoryRun?.targetBadgeIds).toContain("physics.gr.einstein_field_equation");
      expect(runState.activeRuntimeTrace?.request.family).toBe("gr_tensor");
      expect(runState.selectedTheoryRunRowId).toBeTruthy();
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout).toBeNull();
    });
  });

  it("clears a stale runtime theory run when a scalar badge is selected", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Einstein field equation" }));

    await waitFor(() => {
      expect(useTheoryCompoundRunStore.getState().activeTheoryRun?.targetBadgeIds).toContain(
        "physics.gr.einstein_field_equation",
      );
    });

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }));

    await waitFor(() => {
      expect(useTheoryCompoundRunStore.getState().activeTheoryRun).toBeNull();
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("E_0=mc^2");
    });
  });

  it("keeps route metadata in hover text instead of visible graph labels", async () => {
    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Einstein field equation" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Einstein field equation" }).getAttribute("title")).toMatch(
        /reference|tensor|gate|boundary|scalar/i,
      );
    });
    expect(screen.queryByText("reference")).toBeNull();
    expect(screen.queryByText("scalar")).toBeNull();
  });

  it("keeps atlas block settings visual without a graph-level load button", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Solar Surface & Spectrum atlas lens" }));

    await waitFor(() => {
      expect(useTheoryMapOverlayStore.getState().highlightedBadgeIds).toContain("solar.spectrum.photon_energy");
    });
    expect(screen.queryByRole("button", { name: "Load Atlas Block Theory Run" })).toBeNull();
  });

  it("clears selected badges when clicking empty graph space", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }), { altKey: true });
    fireEvent.click(await screen.findByRole("button", { name: "QEI badge replay margin" }), { altKey: true });

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeIds).toEqual([
        "physics.relativity.rest_energy",
        "nhm2.qei.sampling_window",
      ]);
    });

    fireEvent.click(screen.getByTestId("theory-achievement-map-scrollport").firstElementChild as Element);

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeIds).toEqual([]);
      expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeId).toBeNull();
    });
  });

  it("supports multi-select path highlighting without extra trace controls", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }), { ctrlKey: true });
    fireEvent.click(await screen.findByRole("button", { name: "QEI badge replay margin" }), { ctrlKey: true });

    expect(screen.queryByText("Trace Selected Badges")).toBeNull();
    expect(screen.queryByRole("button", { name: /Run Selected Trace/i })).toBeNull();
    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeIds).toEqual([
        "physics.relativity.rest_energy",
        "nhm2.qei.sampling_window",
      ]);
    });
    expect(screen.getByRole("button", { name: "QEI badge replay margin" }).className).toContain("ring");
  });

  it("uses the StarSim stellar evolution lens to light mapped badges and load scalar formulas", async () => {
    renderPanel();

    const starSimLensButton = await screen.findByRole("button", { name: "Stellar Evolution atlas lens" });
    expect(starSimLensButton).toBeTruthy();
    fireEvent.click(starSimLensButton);
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

    fireEvent.click(await screen.findByRole("button", { name: "Stellar Evolution atlas lens" }));
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
    expect(screen.queryByText("Stellar Evolution")).toBeNull();

    fireEvent.click(starSimLensButton);

    expect(await screen.findByText("Stellar Evolution")).toBeTruthy();

    fireEvent.click(starSimLensButton);

    expect(screen.queryByText("Stellar Evolution")).toBeNull();
    expect(screen.getByTestId("theory-achievement-map-scrollport")).toBeTruthy();
  });

  it("remembers whether the StarSim lens is collapsed across remounts", async () => {
    const firstRender = renderPanel();

    const starSimLensButton = await screen.findByRole("button", { name: "Stellar Evolution atlas lens" });
    expect(screen.queryByText("Stellar Evolution")).toBeNull();

    fireEvent.click(starSimLensButton);
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

  it("loads the Warp / GR / NHM2 diagnostic preset as an artifact-backed theory run", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Warp / GR / NHM2 atlas lens" }));
    fireEvent.click(await screen.findByRole("button", { name: "Select Diagnostic Path" }));

    await waitFor(() => {
      const run = useTheoryCompoundRunStore.getState().activeTheoryRun;
      expect(run?.targetBadgeIds).toContain("nhm2.tensor.same_chart_full_tensor");
      expect(run?.targetBadgeIds).toContain("nhm2.closure.wall_t00_source_residual");
      expect(run?.targetBadgeIds).toContain("nhm2.qei.worldline_dossier");
      expect(run?.summary.rowCount).toBeGreaterThan(0);
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
      expect(useTheoryCompoundRunStore.getState().activeTheoryRun?.targetBadgeIds).toContain(
        "nhm2.tensor.same_chart_full_tensor",
      );
      expect(useTheoryCompoundRunStore.getState().activeTheoryRun?.targetBadgeIds).toContain(
        "nhm2.energy_condition.observer_robust_gate",
      );
    });
  });

  it("uses the QEI / Stress-Energy lens to load object-bound diagnostic rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "QEI / Stress-Energy atlas lens" }));

    expect(await screen.findByText("Stress-Energy")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select QEI Badge Replay Margin" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select QEI Badge Replay Margin" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample QEI badge replay margin object binding" }));

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

  it("uses the Curvature / Collapse lens to load object-bound benchmark rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Curvature / Collapse atlas lens" }));

    expect(screen.getByTestId("theory-atlas-lens-overlay").className).toContain("absolute");
    expect(await screen.findByText("Collapse")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select Curvature Proxy" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select Curvature Proxy" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample curvature proxy object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("curvature_collapse");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCurvatureCollapseGroupId).toBe(
        "curvature.proxy.kappa",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCurvatureCollapseObjectBindingId).toBe(
        "sample-curvature-proxy",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "curvature_collapse_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("kappa_body = 6.217e-27*1000");
    });

    fireEvent.click(screen.getByRole("button", { name: "Curvature / Collapse atlas lens" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBeNull();
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCurvatureCollapseGroupId).toBe(
        "curvature.proxy.kappa",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCurvatureCollapseObjectBindingId).toBe(
        "sample-curvature-proxy",
      );
      expect(useTheoryMapOverlayStore.getState().highlightedBadgeIds).toContain(
        "curvature.proxy.body_density",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("kappa_body = 6.217e-27*1000");
    });
    expect(screen.getByRole("button", { name: "Body Curvature Proxy" }).style.boxShadow).toContain(
      "rgba(16, 185, 129",
    );

    expect(screen.queryByRole("button", { name: "Load Atlas Block Theory Run" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Curvature / Collapse atlas lens" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("curvature_collapse");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedCurvatureCollapseObjectBindingId).toBe(
        "sample-curvature-proxy",
      );
    });
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

  it("uses the Galactic Dynamics lens to load object-bound map rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Galactic Dynamics atlas lens" }));

    expect(await screen.findByText("Dynamics")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select Map Geometry" })).toBeTruthy();
    expect(screen.queryByText("Load Examples")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Select Map Geometry" }));
    fireEvent.click(await screen.findByRole("button", { name: "Use Sample local stream object binding" }));

    await waitFor(() => {
      expect(useTheoryBadgeGraphPanelStore.getState().activeAtlasLensId).toBe("galactic_dynamics");
      expect(useTheoryBadgeGraphPanelStore.getState().selectedGalacticDynamicsGroupId).toBe(
        "galactic.map.geometry",
      );
      expect(useTheoryBadgeGraphPanelStore.getState().selectedGalacticDynamicsObjectBindingId).toBe(
        "sample-local-stream",
      );
      expect(useScientificCalculatorStore.getState().lastTheoryLoadout?.objectContext?.kind).toBe(
        "galactic_dynamics_object",
      );
      expect(useScientificCalculatorStore.getState().currentLatex).toBe(
        "distance_pc = sqrt(3^2 + 4^2 + 12^2)",
      );
    });
  });

  it("remembers selected badges and viewport position across remounts", async () => {
    const firstRender = renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }), { ctrlKey: true });
    fireEvent.click(await screen.findByRole("button", { name: "QEI badge replay margin" }), { ctrlKey: true });

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

    expect(screen.queryByText("Trace Selected Badges")).toBeNull();
    expect(useTheoryBadgeGraphPanelStore.getState().selectedBadgeId).toBe("nhm2.qei.sampling_window");
  });
});
