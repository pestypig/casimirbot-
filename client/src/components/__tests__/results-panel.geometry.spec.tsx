// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ResultsPanel from "../results-panel";

vi.mock("@/hooks/use-energy-pipeline", () => ({
  useEnergyPipeline: () => ({
    data: {
      hull: { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
      bubble: { R: 2 },
    },
  }),
}));

vi.mock("@/components/chart-visualization", () => ({ default: () => null }));
vi.mock("@/components/dynamic-dashboard", () => ({ DynamicDashboard: () => null }));
vi.mock("../design-ledger", () => ({ DesignLedger: () => null }));
vi.mock("../visual-proof-charts", () => ({ VisualProofCharts: () => null }));
vi.mock("../verification-tab", () => ({ VerificationTab: () => null }));
vi.mock("../energy-pipeline", () => ({ EnergyPipeline: () => null }));
vi.mock("../phase-diagram", () => ({ default: () => null }));

describe("ResultsPanel geometry readouts", () => {
  it("shows hull and bubble radii in the main warp analysis cards", () => {
    render(
      <ResultsPanel
        simulation={
          {
            parameters: {
              moduleType: "warp",
              dynamicConfig: {
                burstLengthUs: 10,
                cycleLengthUs: 1000,
                sectorCount: 80,
              },
            },
            results: {
              geometricBlueshiftFactor: 1,
              totalExoticMass: 1,
              powerDraw: 1,
              isZeroExpansion: true,
              quantumSafetyStatus: "safe",
            },
            generatedFiles: [],
            logs: [],
          } as any
        }
        onDownloadFile={() => {}}
        onDownloadAll={() => {}}
        tileArea={100}
        hullReferenceRadius={503.5}
        onTileAreaChange={() => {}}
        onHullReferenceRadiusChange={() => {}}
        gammaGeo={1}
        qFactor={100000}
        duty={0.12}
        sagDepth={16}
        temperature={20}
        strokeAmplitude={1}
        burstTime={10}
        cycleTime={1000}
        xiPoints={64}
      />,
    );

    expect(screen.getByText("m (Hull Reference Radius)")).toBeInTheDocument();
    expect(screen.getByText("m (Bubble Radius)")).toBeInTheDocument();
    expect(screen.getByText("503.5")).toBeInTheDocument();
    expect(screen.getByText("2.0")).toBeInTheDocument();
  });
});
