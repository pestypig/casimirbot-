// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useProofPackMock = vi.fn();
const useMathStageGateMock = vi.fn();
const useGrConstraintContractMock = vi.fn();

vi.mock("@/hooks/useProofPack", () => ({
  useProofPack: (...args: unknown[]) => useProofPackMock(...args),
}));

vi.mock("@/hooks/useMathStageGate", () => ({
  useMathStageGate: (...args: unknown[]) => useMathStageGateMock(...args),
}));

vi.mock("@/hooks/useGrConstraintContract", () => ({
  useGrConstraintContract: (...args: unknown[]) => useGrConstraintContractMock(...args),
}));

import { FrontProofsLedger } from "@/components/FrontProofsLedger";
import { NeedleCavityBubblePanel } from "@/components/NeedleCavityBubblePanel";
import { WarpProofPanel } from "@/components/WarpProofPanel";

const makeProofPack = () =>
  ({
    values: {
      ts_ratio: { value: 50, source: "pipeline.TS_ratio", proxy: false },
      zeta: { value: 0.5, source: "pipeline.zeta", proxy: false },
      ford_roman_ok: { value: true, source: "pipeline.fordRomanCompliance", proxy: false },
      ts_metric_derived: {
        value: true,
        source: "derived:ts_metric_derived",
        proxy: false,
      },
      ts_metric_source: {
        value: "warp.metricAdapter+clocking",
        source: "derived:ts_metric_source",
        proxy: false,
      },
      ts_metric_reason: {
        value: "TS_ratio from proper-distance timing with explicit chart contract",
        source: "derived:ts_metric_reason",
        proxy: false,
      },
      qi_strict_mode: {
        value: true,
        source: "guardrail.qi.strict.mode",
        proxy: false,
      },
      qi_strict_ok: {
        value: true,
        source: "guardrail.qi.strict.ok",
        proxy: false,
      },
      qi_strict_reason: {
        value: "strict metric source satisfied",
        source: "guardrail.qi.strict.reason",
        proxy: false,
      },
      qi_rho_source: {
        value: "warp.metric.T00.natario.shift",
        source: "pipeline.qi.rhoSource",
        proxy: false,
      },
      qi_metric_derived: {
        value: true,
        source: "pipeline.qi.metricDerived",
        proxy: false,
      },
      qi_metric_source: {
        value: "warp.metricAdapter+clocking",
        source: "pipeline.qi.metricSource",
        proxy: false,
      },
      qi_metric_reason: {
        value: "TS_ratio from proper-distance timing with explicit chart contract",
        source: "pipeline.qi.metricReason",
        proxy: false,
      },
    },
  }) as any;

describe("TS strict proof-pack rendering", () => {
  beforeEach(() => {
    useProofPackMock.mockReturnValue({
      data: makeProofPack(),
      isLoading: false,
      error: null,
    });
    useMathStageGateMock.mockReturnValue({
      pending: false,
      stage: "diagnostic",
      ok: true,
      reasons: [],
      modules: [],
    });
    useGrConstraintContractMock.mockReturnValue({
      data: null,
      isFetching: false,
      isError: false,
    });
  });

  afterEach(() => {
    cleanup();
    useProofPackMock.mockReset();
    useMathStageGateMock.mockReset();
    useGrConstraintContractMock.mockReset();
  });

  it("shows ts strict row in FrontProofsLedger", () => {
    render(<FrontProofsLedger />);
    expect(screen.getByText("TS strict congruence")).toBeDefined();
    expect(screen.getByText(/source = warp\.metricAdapter\+clocking/i)).toBeDefined();
    expect(screen.getByText("QI metric path")).toBeDefined();
  });

  it("shows ts strict fields in WarpProofPanel CL3 section", () => {
    render(<WarpProofPanel />);
    expect(screen.getByText("ts_metric_source")).toBeDefined();
    expect(screen.getAllByText("warp.metricAdapter+clocking").length).toBeGreaterThan(0);
  });

  it("shows ts strict row in NeedleCavityBubblePanel", () => {
    render(<NeedleCavityBubblePanel />);
    expect(screen.getAllByText("TS strict congruence").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/warp\.metricAdapter\+clocking/i).length).toBeGreaterThan(0);
    expect(screen.getByText("QI metric path")).toBeDefined();
  });
});
