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
      ...props
    }: {
      from: [number, number];
      to: [number, number];
      [key: string]: unknown;
    }) =>
      ReactActual.createElement("line", {
        "data-testid": "civilization-bounds-edge",
        "data-from": from.join(","),
        "data-to": to.join(","),
        ...props,
      }),
    Marker: ({
      children,
      onClick,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) =>
      ReactActual.createElement(
        "g",
        { "data-testid": "civilization-bounds-badge", onClick, ...props },
        children,
      ),
  };
});

afterEach(() => {
  cleanup();
});

describe("CivilizationBoundsRoadmap", () => {
  it("renders a map-first atlas without persistent control panels", () => {
    render(<CivilizationBoundsRoadmap />);

    expect(screen.getByTestId("mock-civilization-map")).toBeTruthy();
    expect(screen.getAllByTestId("civilization-bounds-badge").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("civilization-bounds-country-inspector")).toBeNull();
    expect(screen.queryAllByTestId("civilization-bounds-edge")).toHaveLength(0);

    expect(screen.queryByText("Civilization Bounds Atlas")).toBeNull();
    expect(screen.queryByRole("button", { name: "Material" })).toBeNull();
    expect(screen.queryByLabelText("dependency edges")).toBeNull();
    expect(screen.queryByLabelText("event pulse")).toBeNull();
    expect(screen.queryByLabelText("missing evidence")).toBeNull();
    expect(screen.queryByText("ideal bounds")).toBeNull();
    expect(screen.queryByText(/Active partners/i)).toBeNull();
    expect(screen.queryByText(/Focus site/i)).toBeNull();
    expect(screen.queryByText(/Projection map - bubble partners/i)).toBeNull();
    expect(screen.queryByText(/Anchor nm-gap metrology/i)).toBeNull();
    expect(screen.queryByText(/Assumes Casimir/i)).toBeNull();
  });

  it("opens a country receipt from a selected nation marker", () => {
    render(<CivilizationBoundsRoadmap />);

    const markers = screen.getAllByTestId("civilization-bounds-badge");
    fireEvent.click(markers[1]);

    const inspector = screen.getByTestId("civilization-bounds-country-inspector");
    expect(inspector.textContent).toContain("China");
    expect(inspector.textContent).toContain("Material");
    expect(inspector.textContent).toContain("Governance");
    expect(inspector.textContent).toContain("confidence");
    expect(inspector.textContent).toContain("missing");
    expect(inspector.textContent).toContain("sources");
    expect(screen.getAllByTestId("civilization-bounds-edge").length).toBeGreaterThan(0);
    expect(inspector.textContent).not.toMatch(/Host early|Mass-produce|Build one of the global/i);
  });

  it("compares selected countries and surfaces direct dependency relations", () => {
    render(<CivilizationBoundsRoadmap />);

    const markers = screen.getAllByTestId("civilization-bounds-badge");
    fireEvent.click(markers[1]);
    fireEvent.click(markers[2]);

    const inspector = screen.getByTestId("civilization-bounds-country-inspector");
    expect(inspector.textContent).toContain("Compare selected countries");
    expect(inspector.textContent).toContain("CHN + DEU");
    expect(inspector.textContent).toContain("China");
    expect(inspector.textContent).toContain("Germany");
    expect(inspector.textContent).toContain("Industrial trade dependency");
    expect(inspector.textContent).toContain("Material spread");
    expect(screen.getAllByTestId("civilization-bounds-edge").length).toBeGreaterThan(0);

    fireEvent.click(markers[1]);
    expect(screen.getByTestId("civilization-bounds-country-inspector").textContent).toContain(
      "Germany",
    );
  });
});
