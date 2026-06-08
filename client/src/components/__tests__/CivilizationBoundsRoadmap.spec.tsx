// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CivilizationBoundsRoadmap from "../CivilizationBoundsRoadmap";

vi.mock("react-simple-maps", async () => {
  const ReactActual = await import("react");
  return {
    ComposableMap: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement("svg", { "data-testid": "mock-civilization-map" }, children),
    Geographies: ({
      children,
    }: {
      children: (args: { geographies: Array<{ rsmKey: string }> }) => React.ReactNode;
    }) =>
      ReactActual.createElement(
        "g",
        { "data-testid": "mock-geographies" },
        children({ geographies: [{ rsmKey: "earth" }] }),
      ),
    Geography: ({ geography }: { geography: { rsmKey: string } }) =>
      ReactActual.createElement("path", {
        "data-testid": "mock-geography",
        "data-rsm-key": geography.rsmKey,
      }),
    Marker: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) =>
      ReactActual.createElement(
        "g",
        { "data-testid": "civilization-bounds-badge", onClick },
        children,
      ),
  };
});

afterEach(() => {
  cleanup();
});

describe("CivilizationBoundsRoadmap", () => {
  it("renders the compact phase and badge map without old partner prose", () => {
    render(<CivilizationBoundsRoadmap />);

    expect(screen.getByText("Civilization Bounds Roadmap")).toBeTruthy();
    expect(screen.getByLabelText("Civilization bounds phase year")).toBeTruthy();
    expect(screen.getByText("P0")).toBeTruthy();
    expect(screen.getByText("ideal bounds")).toBeTruthy();
    expect(screen.getByTestId("mock-civilization-map")).toBeTruthy();
    expect(screen.getAllByTestId("civilization-bounds-badge").length).toBeGreaterThan(0);

    expect(screen.queryByText(/Active partners/i)).toBeNull();
    expect(screen.queryByText(/Focus site/i)).toBeNull();
    expect(screen.queryByText(/Projection map - bubble partners/i)).toBeNull();
    expect(screen.queryByText(/Anchor nm-gap metrology/i)).toBeNull();
    expect(screen.queryByText(/Assumes Casimir/i)).toBeNull();
  });

  it("opens only a tiny badge inspector on selection", () => {
    render(<CivilizationBoundsRoadmap />);

    fireEvent.click(screen.getAllByTestId("civilization-bounds-badge")[0]);

    const inspector = screen.getByTestId("civilization-bounds-badge-inspector");
    expect(inspector.textContent).toContain("kind");
    expect(inspector.textContent).toContain("confidence");
    expect(inspector.textContent).toContain("claim tier");
    expect(inspector.textContent).toContain("missing");
    expect(inspector.textContent).not.toMatch(/Host early|Mass-produce|Build one of the global/i);
  });
});
