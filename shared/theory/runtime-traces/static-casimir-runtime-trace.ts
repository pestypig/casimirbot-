import {
  buildTheoryRuntimeMathTraceV1,
  type TheoryRuntimeMathStepV1,
  type TheoryRuntimeMathTraceV1,
} from "../../contracts/theory-runtime-math-trace.v1";

const STATIC_TRACE_WARNING = "Static reference trace only; no backend runtime executed.";
const SCALAR_CUT_WARNING = "Scalar cuts may be sent to the scientific calculator.";

export type StaticCasimirRuntimeTraceInput = {
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

export function buildStaticCasimirRuntimeTraceV1(
  input: StaticCasimirRuntimeTraceInput = {},
): TheoryRuntimeMathTraceV1 {
  const steps: TheoryRuntimeMathStepV1[] = [
    makeStep({
      id: "static-casimir-energy-density",
      index: 1,
      title: "Static Casimir Energy Density Reference",
      operatorKind: "reference",
      displayLatex: "\\rho_{Casimir}=-\\frac{\\pi^2\\hbar c}{720a^4}",
      expression: "rho_Casimir = -(pi^2*hbar*c)/(720*a^4)",
      inputSymbols: ["hbar", "c", "a"],
      outputSymbols: ["rho_Casimir"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "casimir-pressure-reference",
      index: 2,
      title: "Pressure Reference",
      operatorKind: "reference",
      displayLatex: "P_{Casimir}=-\\frac{\\pi^2\\hbar c}{240a^4}",
      expression: "P_Casimir = -(pi^2*hbar*c)/(240*a^4)",
      inputSymbols: ["hbar", "c", "a"],
      outputSymbols: ["P_Casimir"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "output-energy-proxy",
      index: 3,
      title: "Output Energy Proxy",
      operatorKind: "field_sample",
      displayLatex: "E_{out}=\\rho_{Casimir}V_{eff}",
      expression: "E_out = rho_Casimir * V_eff",
      inputSymbols: ["rho_Casimir", "V_eff"],
      outputSymbols: ["E_out"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "mass-equivalent-proxy",
      index: 4,
      title: "Mass Equivalent Proxy",
      operatorKind: "scalar_cut",
      displayLatex: "m_{eq}=\\frac{E_{out}}{c^2}",
      expression: "m_eq = E_out / c^2",
      inputSymbols: ["E_out", "c"],
      outputSymbols: ["m_eq"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "mass-equivalent-cut",
          label: "Mass equivalent proxy",
          expression: "m_eq = E_out / c^2",
          displayLatex: "m_{eq}=\\frac{E_{out}}{c^2}",
          targetVariable: "m_eq",
          calculatorArtifactV1: null,
        },
      ],
    }),
    makeStep({
      id: "frequency-equivalent-proxy",
      index: 5,
      title: "Energy Frequency Proxy",
      operatorKind: "scalar_cut",
      displayLatex: "f_{eq}=\\frac{E_{out}}{h}",
      expression: "f_eq = E_out / h",
      inputSymbols: ["E_out", "h"],
      outputSymbols: ["f_eq"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "frequency-equivalent-cut",
          label: "Energy frequency proxy",
          expression: "f_eq = E_out / h",
          displayLatex: "f_{eq}=\\frac{E_{out}}{h}",
          targetVariable: "f_eq",
          calculatorArtifactV1: null,
        },
      ],
    }),
  ];

  return buildTheoryRuntimeMathTraceV1({
    generatedAt: input.generatedAt,
    traceId: input.traceId ?? "static-casimir-runtime-trace",
    runtimeId: input.runtimeId ?? "runtime.static.casimir.reference",
    graphId: input.graphId ?? "nhm2-theory-badge-graph",
    badgeIds: input.badgeIds ?? [
      "casimir.cavity.static_energy_density",
      "casimir.cavity.energy_output_proxy",
      "casimir.cavity.mass_equivalent_proxy",
    ],
    request: {
      family: "casimir_field",
      target: "Static Casimir reference chain",
      chart: "parallel_plate_reference",
      assumptions: [
        "Reference notation only.",
        "No backend runtime executed.",
        "Scalar cuts may be sent to the scientific calculator.",
      ],
    },
    steps,
    summary: {
      claimBoundaryNotes: [
        "Static/reference trace only; does not prove propulsion or a physical mechanism.",
      ],
    },
  });
}
