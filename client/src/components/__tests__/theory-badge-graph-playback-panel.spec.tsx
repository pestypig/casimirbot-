// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TheoryBadgeGraphPanel from "../panels/TheoryBadgeGraphPanel";
import { useTheoryBadgePlaybackStore } from "@/store/useTheoryBadgePlaybackStore";
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
  cleanup();
});

describe("TheoryBadgeGraphPanel playback", () => {
  it("runs a badge path and renders solved and skipped playback rows", async () => {
    renderPanel();

    fireEvent.click(await screen.findByText("QEI sampling window"));
    fireEvent.click(await screen.findByRole("button", { name: /Run Path to Badge/i }));

    expect(await screen.findByText("Path Playback")).toBeTruthy();
    expect(screen.getByText("Copy Playback JSON")).toBeTruthy();

    await waitFor(() => {
      expect(useTheoryBadgePlaybackStore.getState().status).toBe("complete");
    });

    expect((await screen.findAllByText("solved")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("skipped").length).toBeGreaterThan(0);
    expect(screen.getByText("Copy Playback Markdown")).toBeTruthy();
  });
});
