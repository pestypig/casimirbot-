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
    Line: ({
      from,
      to,
    }: {
      from: [number, number];
      to: [number, number];
    }) =>
      ReactActual.createElement("line", {
        "data-testid": "civilization-bounds-edge",
        "data-from": from.join(","),
        "data-to": to.join(","),
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
  it("renders the diagnostic atlas controls and seeded nation vectors", () => {
    render(<CivilizationBoundsRoadmap />);

    expect(screen.getByText("Civilization Bounds Atlas")).toBeTruthy();
    expect(screen.getByText("Material")).toBeTruthy();
    expect(screen.getByText("Governance")).toBeTruthy();
    expect(screen.getByLabelText("dependency edges")).toBeTruthy();
    expect(screen.getByLabelText("event pulse")).toBeTruthy();
    expect(screen.getByLabelText("missing evidence")).toBeTruthy();
    expect(screen.getByText("ideal bounds")).toBeTruthy();
    expect(screen.getByTestId("mock-civilization-map")).toBeTruthy();
    expect(screen.getAllByTestId("civilization-bounds-badge").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("civilization-bounds-edge").length).toBeGreaterThan(0);

    expect(screen.queryByText(/Active partners/i)).toBeNull();
    expect(screen.queryByText(/Focus site/i)).toBeNull();
    expect(screen.queryByText(/Projection map - bubble partners/i)).toBeNull();
    expect(screen.queryByText(/Anchor nm-gap metrology/i)).toBeNull();
    expect(screen.queryByText(/Assumes Casimir/i)).toBeNull();
  });

  it("updates the country inspector when a nation marker is selected", () => {
    render(<CivilizationBoundsRoadmap />);

    const markers = screen.getAllByTestId("civilization-bounds-badge");
    fireEvent.click(markers[1]);

    const inspector = screen.getByTestId("civilization-bounds-country-inspector");
    expect(inspector.textContent).toContain("China");
    expect(inspector.textContent).toContain("confidence");
    expect(inspector.textContent).toContain("missing");
    expect(inspector.textContent).toContain("sources");
    expect(inspector.textContent).not.toMatch(/Host early|Mass-produce|Build one of the global/i);
  });

  it("can hide dependency edges without removing nation vectors", () => {
    render(<CivilizationBoundsRoadmap />);

    fireEvent.click(screen.getByLabelText("dependency edges"));

    expect(screen.queryAllByTestId("civilization-bounds-edge")).toHaveLength(0);
    expect(screen.getAllByTestId("civilization-bounds-badge").length).toBeGreaterThan(0);
  });
});
