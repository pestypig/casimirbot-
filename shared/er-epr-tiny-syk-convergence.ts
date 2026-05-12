export type TinySykValidationNumericalMethod =
  | "matrix_exponential_taylor"
  | "matrix_exponential_pade"
  | "exact_diagonalization";

export type TinySykNumericalAgreement = {
  passed: boolean;
  methods: TinySykValidationNumericalMethod[];
  tolerances: number[];
  maxObservedDelta: number;
  blocker?: "exact_diagonalization_not_implemented" | "method_disagreement" | "unsupported_method";
  notes: string[];
};

export function evaluateTinySykNumericalAgreement(args: {
  methods: TinySykValidationNumericalMethod[];
  tolerances: number[];
  requireMethodAgreement: boolean;
  maxAllowedMethodDelta: number;
}): TinySykNumericalAgreement {
  if (args.methods.includes("exact_diagonalization")) {
    return {
      passed: false,
      methods: args.methods,
      tolerances: args.tolerances,
      maxObservedDelta: Number.POSITIVE_INFINITY,
      blocker: "exact_diagonalization_not_implemented",
      notes: ["exact_diagonalization was requested but no Hermitian eigensolver path is implemented in this patch."],
    };
  }
  const unsupported = args.methods.find((method) => method !== "matrix_exponential_taylor");
  if (unsupported) {
    return {
      passed: false,
      methods: args.methods,
      tolerances: args.tolerances,
      maxObservedDelta: Number.POSITIVE_INFINITY,
      blocker: "unsupported_method",
      notes: [`${unsupported} is reserved for future method-agreement work.`],
    };
  }
  const spread = toleranceSpread(args.tolerances);
  const passed = !args.requireMethodAgreement || spread <= args.maxAllowedMethodDelta;
  return {
    passed,
    methods: args.methods,
    tolerances: args.tolerances,
    maxObservedDelta: spread,
    blocker: passed ? undefined : "method_disagreement",
    notes: [
      "Current validation records Taylor matrix evolution only.",
      "Reports must not label Taylor evolution as exact diagonalization.",
    ],
  };
}

function toleranceSpread(tolerances: number[]): number {
  if (tolerances.length < 2) return 0;
  return Math.max(...tolerances) - Math.min(...tolerances);
}
