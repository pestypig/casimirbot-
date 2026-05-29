import { describe, expect, it } from "vitest";
import { isTheoryRuntimeMathTraceV1 } from "../../contracts/theory-runtime-math-trace.v1";
import {
  buildStaticCasimirRuntimeTraceV1,
  buildStaticGrTensorTraceV1,
  buildStaticSolarRuntimeTraceV1,
} from "../runtime-traces";

const NO_BACKEND_WARNING = "Static reference trace only; no backend runtime executed.";
const SCALAR_CUT_WARNING = "Scalar cuts may be sent to the scientific calculator.";

const builders = [
  ["GR tensor", buildStaticGrTensorTraceV1],
  ["Casimir", buildStaticCasimirRuntimeTraceV1],
  ["Solar", buildStaticSolarRuntimeTraceV1],
] as const;

describe("static/reference runtime math traces", () => {
  it.each(builders)("%s builder returns a valid trace with scalar cuts and static warnings", (_label, buildTrace) => {
    const trace = buildTrace({ generatedAt: "2026-05-29T00:00:00.000Z" });

    expect(isTheoryRuntimeMathTraceV1(trace)).toBe(true);
    expect(trace.summary.scalarCutCount).toBeGreaterThanOrEqual(1);
    expect(trace.steps.some((step) => step.scalarCuts.length > 0)).toBe(true);
    expect(trace.steps.every((step) => step.computedBy === "static_reference_trace")).toBe(true);
    expect(trace.steps.every((step) => step.warnings.includes(NO_BACKEND_WARNING))).toBe(true);
    expect(trace.steps.every((step) => step.warnings.includes(SCALAR_CUT_WARNING))).toBe(true);
    expect(JSON.stringify(trace)).not.toMatch(/\b(validated propulsion|proven warp|confirmed physical mechanism)\b/i);
  });

  it("GR tensor trace includes the expected reference chain", () => {
    const trace = buildStaticGrTensorTraceV1();

    expect(trace.steps.map((step) => step.title)).toEqual([
      "Metric Input",
      "Inverse Metric",
      "Christoffel Symbols",
      "Riemann Tensor",
      "Ricci Tensor",
      "Ricci Scalar",
      "Einstein Tensor",
      "Stress-Energy Relation",
      "Scalar Cut: Source Residual",
    ]);
  });

  it("Casimir trace includes energy, pressure, mass, and frequency proxy cuts", () => {
    const trace = buildStaticCasimirRuntimeTraceV1();

    expect(trace.steps.map((step) => step.title)).toEqual([
      "Static Casimir Energy Density Reference",
      "Pressure Reference",
      "Output Energy Proxy",
      "Mass Equivalent Proxy",
      "Energy Frequency Proxy",
    ]);
    expect(trace.steps.flatMap((step) => step.scalarCuts).map((cut) => cut.expression)).toEqual(
      expect.arrayContaining(["m_eq = E_out / c^2", "f_eq = E_out / h"]),
    );
  });

  it("Solar trace includes photon energy and Doppler velocity cuts", () => {
    const trace = buildStaticSolarRuntimeTraceV1();

    expect(trace.steps.map((step) => step.title)).toEqual([
      "Wavelength / Frequency Reference",
      "Photon Energy",
      "Doppler Shift Reference",
      "Doppler Velocity Scalar Cut",
    ]);
    expect(trace.steps.flatMap((step) => step.scalarCuts).map((cut) => cut.expression)).toEqual(
      expect.arrayContaining(["E = h*c/lambda", "z = (lambda_obs - lambda0) / lambda0", "v = c*z"]),
    );
  });
});
