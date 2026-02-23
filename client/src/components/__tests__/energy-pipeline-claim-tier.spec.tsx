// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useEnergyPipelineMock = vi.fn();
const useSwitchModeMock = vi.fn();

vi.mock("@/hooks/use-energy-pipeline", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-energy-pipeline")>("@/hooks/use-energy-pipeline");
  return {
    ...actual,
    useEnergyPipeline: (...args: unknown[]) => useEnergyPipelineMock(...args),
    useSwitchMode: (...args: unknown[]) => useSwitchModeMock(...args),
  };
});

import { LiveEnergyPipeline } from "@/components/live-energy-pipeline";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("LiveEnergyPipeline claim tier / provenance surfacing", () => {
  beforeEach(() => {
    useSwitchModeMock.mockReturnValue({ mutate: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    useEnergyPipelineMock.mockReset();
    useSwitchModeMock.mockReset();
  });

  const baseProps = {
    gammaGeo: 26,
    qFactor: 1e9,
    duty: 0.14,
    sagDepth: 0,
    temperature: 300,
    tileArea: 1,
    shipRadius: 82,
  };

  it("renders backend claim tier + provenance and avoids certified wording at diagnostic tier", () => {
    useEnergyPipelineMock.mockReturnValue({
      data: {
        claim_tier: "diagnostic",
        provenance_class: "simulation",
        currentMode: "hover",
        dutyCycle: 0.1,
        qCavity: 1e9,
        gammaGeo: 26,
        gammaVanDenBroeck: 1e11,
        modulationFreq_GHz: 15,
      },
    });

    render(<TooltipProvider><LiveEnergyPipeline {...baseProps} /></TooltipProvider>);

    expect(screen.getByTestId("live-claim-tier-value").textContent).toBe("diagnostic");
    expect(screen.getByTestId("live-provenance-class-value").textContent).toBe("simulation");
    expect(screen.getByTestId("live-maturity-language-value").textContent).toBe("Diagnostic evidence");
    expect(screen.queryByText("Certified evidence")).toBeNull();
  });

  it("shows certified wording only for certified tier", () => {
    useEnergyPipelineMock.mockReturnValue({
      data: {
        claim_tier: "certified",
        provenance_class: "hardware",
        currentMode: "hover",
      },
    });

    render(<TooltipProvider><LiveEnergyPipeline {...baseProps} /></TooltipProvider>);

    expect(screen.getByTestId("live-maturity-language-value").textContent).toBe("Certified evidence");
  });

  it("switches QI derivation labels between Public and Academic audience modes", () => {
    useEnergyPipelineMock.mockReturnValue({
      data: {
        claim_tier: "diagnostic",
        provenance_class: "simulation",
        currentMode: "hover",
        qi: { margin: 0.3, bound: -2, avg: -1, tau_s_ms: 1, sampler: "unit", samples: 2 },
        qiBadge: "ok",
        qiGuardrail: {
          metricDerived: false,
          metricDerivedSource: "pipeline",
        },
      },
    });

    render(<TooltipProvider><LiveEnergyPipeline {...baseProps} /></TooltipProvider>);

    expect(screen.getByText(/OK · operational estimate/)).toBeInTheDocument();

    const audienceControl = screen.getByTestId("audience-mode-control");
    fireEvent.click(within(audienceControl).getByRole("combobox"));
    fireEvent.click(screen.getByText("Academic"));

    expect(screen.getByText(/OK · proxy-derived \(pipeline\)/)).toBeInTheDocument();
  });
});
