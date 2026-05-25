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
  cleanup();
});

describe("TheoryBadgeGraphPanel", () => {
  it("renders graph inspection surfaces and loads a payload into the scientific calculator", async () => {
    renderPanel();

    expect(await screen.findByText("Theory Badge Graph")).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Energy density proxy" }));

    expect(await screen.findByText("Assumptions")).toBeTruthy();
    expect(screen.getByText("Units")).toBeTruthy();

    fireEvent.click(await screen.findByRole("button", { name: /Load to Calculator/i }));

    await waitFor(() => {
      expect(useScientificCalculatorStore.getState().currentLatex).toBe("\\rho = \\frac{E}{V}");
    });
  });
});
