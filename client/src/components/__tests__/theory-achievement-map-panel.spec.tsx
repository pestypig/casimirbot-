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
  useScientificCalculatorStore.setState({ currentLatex: "" });
  cleanup();
});

describe("TheoryBadgeGraphPanel achievement map", () => {
  it("loads a badge equation to the calculator without opening an inspector popup", async () => {
    renderPanel();

    expect(await screen.findByText("Achievement Map")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Rest Energy" }));

    expect(screen.getByText(/Selected: Rest Energy/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Load to Calculator/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inspector List" })).toBeNull();

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
    expect(screen.getByText(/Selected: QEI sampling window/)).toBeTruthy();
  });
});
