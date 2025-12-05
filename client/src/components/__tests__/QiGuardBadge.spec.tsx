// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, beforeEach, afterEach, it, vi, type Mock } from "vitest";
import { QiGuardBadge } from "../QiGuardBadge";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import type { PipelineSnapshot } from "@/types/pipeline";

vi.mock("@/hooks/use-energy-pipeline", () => ({
  useEnergyPipeline: vi.fn(),
}));

const mockUseEnergyPipeline = useEnergyPipeline as unknown as Mock;

const setPipeline = (snapshot?: PipelineSnapshot) => {
  mockUseEnergyPipeline.mockReturnValue({ data: snapshot });
};

describe("QiGuardBadge", () => {
  beforeEach(() => {
    mockUseEnergyPipeline.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders green status with normalized window and both zeta values", () => {
    setPipeline({
      qiGuardrail: {
        marginRatioRaw: 0.2,
        marginRatio: 0.2,
        sumWindowDt: 1.001,
      },
    });

    render(<QiGuardBadge />);

    const badge = screen.getByTestId("qi-guard-badge");
    expect(badge.getAttribute("data-tone")).toBe("green");
    expect(screen.getByText(/\u03b6_raw:0\.20/)).toBeInTheDocument();
    expect(screen.getByText(/\u03b6:0\.20/)).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
    expect(screen.queryByTestId("qi-guard-badge-dt-warning")).not.toBeInTheDocument();
  });

  it("shows amber tone for high raw zeta and surfaces distinct raw/clamped values in the tooltip", () => {
    setPipeline({
      qiGuardrail: {
        marginRatioRaw: 0.99,
        marginRatio: 0.95,
      },
    });

    render(<QiGuardBadge />);

    const badge = screen.getByTestId("qi-guard-badge");
    expect(badge.getAttribute("data-tone")).toBe("amber");
    expect(screen.getByText("Watch")).toBeInTheDocument();
    const title = badge.getAttribute("title") ?? "";
    expect(title).toMatch(/\u03b6_raw=0\.99/i);
    expect(title).toMatch(/\u03b6=0\.95\s*\(policy\/clamped\)/i);
  });

  it("derives red tone from unclamped raw margin and surfaces the guard metrics", () => {
    setPipeline({
      qiGuardrail: {
        marginRatioRaw: 2.65,
        marginRatio: 1,
        lhs_Jm3: -47.71,
        bound_Jm3: -18,
      },
    });

    render(<QiGuardBadge />);

    const badge = screen.getByTestId("qi-guard-badge");
    expect(badge.getAttribute("data-tone")).toBe("red");
    expect(screen.getByText("At risk")).toBeInTheDocument();
    expect(screen.getByText(/\u03b6_raw:2\.65/)).toBeInTheDocument();
    expect(screen.getByText(/\u03b6:1\.00/)).toBeInTheDocument();
    expect(screen.getByText(/lhs:-47\.71/)).toBeInTheDocument();
    expect(screen.getByText(/bound:-18\.00/)).toBeInTheDocument();
    const title = badge.getAttribute("title") ?? "";
    expect(title).toMatch(/\u03b6_raw=2\.65/i);
    expect(title).toMatch(/\u03b6=1\.00\s*\(policy\/clamped\)/i);
  });

  it("falls back to clamped zeta when raw is missing and still renders both labels", () => {
    setPipeline({
      qiGuardrail: {
        marginRatio: 0.97,
      },
    });

    render(<QiGuardBadge />);

    const badge = screen.getByTestId("qi-guard-badge");
    expect(badge.getAttribute("data-tone")).toBe("amber");
    expect(screen.getByText("Watch")).toBeInTheDocument();
    expect(screen.getByText(/\u03b6_raw:\u2014/)).toBeInTheDocument();
    expect(screen.getByText(/\u03b6:0\.97/)).toBeInTheDocument();
  });

  it("shows integration window warning when \u03a3dt deviates from unity", () => {
    setPipeline({
      qiGuardrail: {
        marginRatioRaw: 0.6,
        sumWindowDt: 1.07,
      },
    });

    render(<QiGuardBadge />);

    const badge = screen.getByTestId("qi-guard-badge");
    expect(badge.getAttribute("title")).toContain("Window not normalized (\u03a3 g\u00b7dt = 1.070)");
    expect(screen.getByTestId("qi-guard-badge-dt-warning")).toHaveTextContent(
      "Window not normalized (\u03a3 g\u00b7dt = 1.070)",
    );
  });
});
