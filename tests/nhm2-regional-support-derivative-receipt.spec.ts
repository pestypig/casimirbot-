import { describe, expect, it } from "vitest";

import {
  buildNhm2RegionalSupportDerivativeReceipt,
  isNhm2RegionalSupportDerivativeReceipt,
} from "../shared/contracts/nhm2-regional-support-derivative-receipt.v1";

const completeKernel = (
  kernelId: "kernel:hull_wall:smootherstep_c2" | "kernel:wall_exterior:smootherstep_c2",
) => ({
  kernelId,
  supportRegion:
    kernelId === "kernel:hull_wall:smootherstep_c2"
      ? ("hull_wall_transition" as const)
      : ("wall_exterior_transition" as const),
  derivativeTermsAvailable: true,
  derivativeRef: `derivative.${kernelId}`,
  partialDerivativeComponents: {
    dt: true,
    dx: true,
    dy: true,
    dz: true,
  },
  maxAbsPartialMuW: 1,
  widthMeters: 1,
  blockers: [],
});

describe("nhm2_regional_support_derivative_receipt/v1", () => {
  it("accepts a complete same-chart support derivative receipt", () => {
    const receipt = buildNhm2RegionalSupportDerivativeReceipt({
      generatedAt: "2026-06-14T00:00:00.000Z",
      runId: "run-1",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      derivativeBasis: "chart",
      derivativeRef: "derivative.supports.json",
      partialMuWAvailable: true,
      covariantDerivativeSupportAvailable: true,
      transitionKernels: [
        completeKernel("kernel:hull_wall:smootherstep_c2"),
        completeKernel("kernel:wall_exterior:smootherstep_c2"),
      ],
    });

    expect(receipt.summary.derivativeSupportComplete).toBe(true);
    expect(receipt.summary.missingKernelIds).toEqual([]);
    expect(receipt.summary.blockers).toEqual([]);
    expect(isNhm2RegionalSupportDerivativeReceipt(receipt)).toBe(true);
  });

  it("keeps incomplete derivative support explicit", () => {
    const receipt = buildNhm2RegionalSupportDerivativeReceipt({
      generatedAt: "2026-06-14T00:00:00.000Z",
      runId: "run-1",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      chartId: "comoving_cartesian",
      derivativeBasis: "chart",
      derivativeRef: null,
      partialMuWAvailable: false,
      covariantDerivativeSupportAvailable: true,
      transitionKernels: [
        {
          ...completeKernel("kernel:hull_wall:smootherstep_c2"),
          derivativeTermsAvailable: false,
          derivativeRef: null,
          partialDerivativeComponents: {
            dt: true,
            dx: true,
            dy: false,
            dz: true,
          },
        },
      ],
    });

    expect(receipt.summary.derivativeSupportComplete).toBe(false);
    expect(receipt.summary.missingKernelIds).toEqual([
      "kernel:wall_exterior:smootherstep_c2",
    ]);
    expect(receipt.summary.blockers).toContain("partial_mu_W_R_missing");
    expect(receipt.summary.blockers).toContain("support_derivative_ref_missing");
    expect(receipt.summary.blockers).toContain(
      "kernel:hull_wall:smootherstep_c2:derivative_terms_missing",
    );
    expect(isNhm2RegionalSupportDerivativeReceipt(receipt)).toBe(true);
  });
});
