// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TheoryBadgeGraphPanel from "../panels/TheoryBadgeGraphPanel";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
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
  useScientificCalculatorStore.setState({
    currentLatex: "",
    lastTheoryLoadout: null,
    activeTheoryLoadoutItemIndex: null,
  });
  cleanup();
});

describe("TheoryBadgeGraphPanel", () => {
  it("renders the achievement map and loads a payload into the scientific calculator", async () => {
    renderPanel();

    expect(await screen.findByTestId("theory-achievement-map-scrollport")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Energy density proxy" }));

    await waitFor(() => {
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("\\rho = \\frac{E}{V}");
    });
  });
});
