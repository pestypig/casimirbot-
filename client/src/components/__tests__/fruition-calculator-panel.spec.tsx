// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildZenGraphLaunchReflectionArtifacts } from "@/lib/zen-graph/fruitionLaunchArtifact";
import { useFruitionCalculatorStore } from "@/store/useFruitionCalculatorStore";
import FruitionCalculatorPanel from "../panels/FruitionCalculatorPanel";

afterEach(() => {
  useFruitionCalculatorStore.getState().clear();
  cleanup();
});

describe("FruitionCalculatorPanel", () => {
  it("renders the standalone Fruition calculator expression view", () => {
    render(<FruitionCalculatorPanel />);

    expect(screen.getByTestId("fruition-calculator-panel")).toBeTruthy();
    expect(screen.getByText("Fruition Calculator")).toBeTruthy();
    expect(screen.getByText("Procedural expression")).toBeTruthy();
    expect(screen.getByText("Result posture")).toBeTruthy();
    expect(screen.getAllByText(/first principle/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/supports/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Evidence only/i)).toBeTruthy();
    expect(screen.getByText(/Agent executable: false/i)).toBeTruthy();
  });

  it("renders a Zen Badge Graph-loaded expression from the calculator store", () => {
    const { fruition } = buildZenGraphLaunchReflectionArtifacts();
    useFruitionCalculatorStore.getState().loadExpression(fruition, { source: "zen_badge_graph" });

    render(<FruitionCalculatorPanel />);

    expect(screen.getByText(fruition.expression)).toBeTruthy();
    expect(screen.getByText(`${fruition.terms.length} terms`)).toBeTruthy();
    expect(screen.getByText(`${fruition.operators.length} operators`)).toBeTruthy();
    expect(screen.getByText("1 history entries")).toBeTruthy();
  });
});
