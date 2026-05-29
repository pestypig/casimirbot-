import {
  buildTheoryRuntimeMathTraceV1,
  type TheoryRuntimeMathStepV1,
  type TheoryRuntimeMathTraceV1,
} from "../../contracts/theory-runtime-math-trace.v1";

const STATIC_TRACE_WARNING = "Static reference trace only; no backend runtime executed.";
const SCALAR_CUT_WARNING = "Scalar cuts may be sent to the scientific calculator.";

export type StaticSolarRuntimeTraceInput = {
  graphId?: string;
  runtimeId?: string;
  traceId?: string;
  badgeIds?: string[];
  generatedAt?: string;
};

function makeStep(input: Omit<TheoryRuntimeMathStepV1, "warnings" | "computedBy">): TheoryRuntimeMathStepV1 {
  return {
    ...input,
    computedBy: "static_reference_trace",
    warnings: [STATIC_TRACE_WARNING, SCALAR_CUT_WARNING],
  };
}

export function buildStaticSolarRuntimeTraceV1(input: StaticSolarRuntimeTraceInput = {}): TheoryRuntimeMathTraceV1 {
  const steps: TheoryRuntimeMathStepV1[] = [
    makeStep({
      id: "wavelength-frequency-reference",
      index: 1,
      title: "Wavelength / Frequency Reference",
      operatorKind: "reference",
      displayLatex: "f=\\frac{c}{\\lambda}",
      expression: "f = c / lambda",
      inputSymbols: ["c", "lambda"],
      outputSymbols: ["f"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "photon-energy-reference",
      index: 2,
      title: "Photon Energy",
      operatorKind: "scalar_cut",
      displayLatex: "E=\\frac{hc}{\\lambda}",
      expression: "E = h*c/lambda",
      inputSymbols: ["h", "c", "lambda"],
      outputSymbols: ["E"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "photon-energy-cut",
          label: "Photon energy",
          expression: "E = h*c/lambda",
          displayLatex: "E=\\frac{hc}{\\lambda}",
          targetVariable: "E",
          calculatorArtifactV1: null,
        },
      ],
    }),
    makeStep({
      id: "doppler-shift-reference",
      index: 3,
      title: "Doppler Shift Reference",
      operatorKind: "scalar_cut",
      displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
      expression: "z = (lambda_obs - lambda0) / lambda0",
      inputSymbols: ["lambda_obs", "lambda0"],
      outputSymbols: ["z"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "doppler-shift-cut",
          label: "Doppler shift",
          expression: "z = (lambda_obs - lambda0) / lambda0",
          displayLatex: "z=\\frac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}",
          targetVariable: "z",
          calculatorArtifactV1: null,
        },
      ],
    }),
    makeStep({
      id: "doppler-velocity-scalar-cut",
      index: 4,
      title: "Doppler Velocity Scalar Cut",
      operatorKind: "scalar_cut",
      displayLatex: "v=cz",
      expression: "v = c*z",
      inputSymbols: ["c", "z"],
      outputSymbols: ["v"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "doppler-velocity-cut",
          label: "Doppler velocity proxy",
          expression: "v = c*z",
          displayLatex: "v=cz",
          targetVariable: "v",
          calculatorArtifactV1: null,
        },
      ],
    }),
  ];

  return buildTheoryRuntimeMathTraceV1({
    generatedAt: input.generatedAt,
    traceId: input.traceId ?? "static-solar-runtime-trace",
    runtimeId: input.runtimeId ?? "runtime.static.solar_spectrum.reference",
    graphId: input.graphId ?? "nhm2-theory-badge-graph",
    badgeIds: input.badgeIds ?? [
      "solar.spectrum.photon_energy",
      "solar.spectrum.doppler_shift",
      "solar.spectrum.radial_velocity_proxy",
    ],
    request: {
      family: "solar_spectrum",
      target: "Static solar spectrum reference chain",
      chart: "wavelength_reference",
      assumptions: [
        "Reference notation only.",
        "No backend runtime executed.",
        "Scalar cuts may be sent to the scientific calculator.",
      ],
    },
    steps,
    summary: {
      claimBoundaryNotes: [
        "Observational proxy reference only; does not replace a solar atmosphere or radiative-transfer model.",
      ],
    },
  });
}
