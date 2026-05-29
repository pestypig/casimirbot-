import {
  buildTheoryRuntimeMathTraceV1,
  type TheoryRuntimeMathStepV1,
  type TheoryRuntimeMathTraceV1,
} from "../../contracts/theory-runtime-math-trace.v1";

const STATIC_TRACE_WARNING = "Static reference trace only; no backend runtime executed.";
const SCALAR_CUT_WARNING = "Scalar cuts may be sent to the scientific calculator.";

export type StaticGrTensorTraceInput = {
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

export function buildStaticGrTensorTraceV1(input: StaticGrTensorTraceInput = {}): TheoryRuntimeMathTraceV1 {
  const steps: TheoryRuntimeMathStepV1[] = [
    makeStep({
      id: "metric-input",
      index: 1,
      title: "Metric Input",
      operatorKind: "tensor_definition",
      displayLatex: "g_{\\mu\\nu}(x)",
      expression: null,
      inputSymbols: ["x"],
      outputSymbols: ["g_{mu nu}"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "inverse-metric",
      index: 2,
      title: "Inverse Metric",
      operatorKind: "component_expansion",
      displayLatex: "g^{\\mu\\alpha}g_{\\alpha\\nu}=\\delta^{\\mu}_{\\nu}",
      expression: null,
      inputSymbols: ["g_{mu nu}"],
      outputSymbols: ["g^{mu nu}"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "christoffel-symbols",
      index: 3,
      title: "Christoffel Symbols",
      operatorKind: "component_expansion",
      displayLatex:
        "\\Gamma^{\\rho}_{\\mu\\nu}=\\frac{1}{2}g^{\\rho\\sigma}(\\partial_{\\mu}g_{\\nu\\sigma}+\\partial_{\\nu}g_{\\mu\\sigma}-\\partial_{\\sigma}g_{\\mu\\nu})",
      expression: null,
      inputSymbols: ["g_{mu nu}", "g^{mu nu}"],
      outputSymbols: ["Gamma^rho_mu_nu"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "riemann-tensor",
      index: 4,
      title: "Riemann Tensor",
      operatorKind: "tensor_definition",
      displayLatex:
        "R^{\\rho}_{\\ \\sigma\\mu\\nu}=\\partial_{\\mu}\\Gamma^{\\rho}_{\\nu\\sigma}-\\partial_{\\nu}\\Gamma^{\\rho}_{\\mu\\sigma}+\\Gamma^{\\rho}_{\\mu\\lambda}\\Gamma^{\\lambda}_{\\nu\\sigma}-\\Gamma^{\\rho}_{\\nu\\lambda}\\Gamma^{\\lambda}_{\\mu\\sigma}",
      expression: null,
      inputSymbols: ["Gamma^rho_mu_nu"],
      outputSymbols: ["R^rho_sigma_mu_nu"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "ricci-tensor",
      index: 5,
      title: "Ricci Tensor",
      operatorKind: "component_expansion",
      displayLatex: "R_{\\mu\\nu}=R^{\\rho}_{\\ \\mu\\rho\\nu}",
      expression: null,
      inputSymbols: ["R^rho_sigma_mu_nu"],
      outputSymbols: ["R_mu_nu"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "ricci-scalar",
      index: 6,
      title: "Ricci Scalar",
      operatorKind: "region_aggregate",
      displayLatex: "R=g^{\\mu\\nu}R_{\\mu\\nu}",
      expression: null,
      inputSymbols: ["g^{mu nu}", "R_mu_nu"],
      outputSymbols: ["R"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "einstein-tensor",
      index: 7,
      title: "Einstein Tensor",
      operatorKind: "tensor_definition",
      displayLatex: "G_{\\mu\\nu}=R_{\\mu\\nu}-\\frac{1}{2}Rg_{\\mu\\nu}",
      expression: null,
      inputSymbols: ["R_mu_nu", "R", "g_{mu nu}"],
      outputSymbols: ["G_mu_nu"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "stress-energy-relation",
      index: 8,
      title: "Stress-Energy Relation",
      operatorKind: "reference",
      displayLatex: "G_{\\mu\\nu}=\\frac{8\\pi G}{c^4}T_{\\mu\\nu}",
      expression: null,
      inputSymbols: ["G_mu_nu"],
      outputSymbols: ["T_mu_nu"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [],
    }),
    makeStep({
      id: "source-residual-scalar-cut",
      index: 9,
      title: "Scalar Cut: Source Residual",
      operatorKind: "scalar_cut",
      displayLatex: "R_{source}=source_{required}-source_{available}",
      expression: "R_source = source_required - source_available",
      inputSymbols: ["source_required", "source_available"],
      outputSymbols: ["R_source"],
      status: "computed",
      artifactRef: null,
      scalarCuts: [
        {
          id: "source-residual-cut",
          label: "Source residual",
          expression: "R_source = source_required - source_available",
          displayLatex: "R_{source}=source_{required}-source_{available}",
          targetVariable: "R_source",
          calculatorArtifactV1: null,
        },
      ],
    }),
  ];

  return buildTheoryRuntimeMathTraceV1({
    generatedAt: input.generatedAt,
    traceId: input.traceId ?? "static-gr-tensor-trace",
    runtimeId: input.runtimeId ?? "runtime.static.gr_tensor.reference",
    graphId: input.graphId ?? "nhm2-theory-badge-graph",
    badgeIds: input.badgeIds ?? [
      "physics.gr.einstein_field_equation",
      "physics.fields.stress_energy_tensor",
      "nhm2.closure.source_residual",
    ],
    request: {
      family: "gr_tensor",
      target: "Static GR tensor reference chain",
      chart: "reference",
      assumptions: [
        "Reference notation only.",
        "No backend runtime executed.",
        "Scalar cuts may be sent to the scientific calculator.",
      ],
    },
    steps,
    summary: {
      claimBoundaryNotes: [
        "Static/reference trace only; does not validate NHM2 or confirm a physical mechanism.",
      ],
    },
  });
}
