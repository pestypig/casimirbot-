// math-stage: diagnostic
import { z } from "zod";

/**
 * Stage-4 congruence is a typed preflight, not a manifold calculator.  It
 * checks dimensions, semantics, tensor structure, representation conventions,
 * and provenance together so that equal units cannot silently become a
 * physical transfer law.
 */

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();
const NonnegativeFinite = Finite.nonnegative();
const PositiveFinite = Finite.positive();

const SiDimensionVector = z.object({
  mass: z.number().int(),
  length: z.number().int(),
  time: z.number().int(),
  current: z.number().int(),
  temperature: z.number().int(),
  amount: z.number().int(),
  luminous_intensity: z.number().int(),
}).strict();

export type CasimirDpSiDimensionVector = z.infer<typeof SiDimensionVector>;

const IndexVariance = z.enum([
  "covariant",
  "contravariant",
  "cartesian",
]);

const TensorContract = z.object({
  rank: z.number().int().nonnegative().max(4),
  index_variance: z.array(IndexVariance),
  symmetry: z.enum([
    "scalar",
    "none",
    "symmetric",
    "hermitian",
    "reciprocal",
    "pair_symmetric",
    "retarded_rank4",
  ]),
}).strict().superRefine((tensor, context) => {
  if (tensor.index_variance.length !== tensor.rank) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["index_variance"],
      message: "index_variance length must equal tensor rank",
    });
  }
  if (tensor.rank === 0 && tensor.symmetry !== "scalar") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["symmetry"],
      message: "rank-zero quantities must declare scalar symmetry",
    });
  }
});

const RepresentationContract = z.object({
  frame_id: z.string().min(1),
  basis_id: z.string().min(1),
  gauge_id: z.string().min(1),
}).strict();

const SpectralContract = z.object({
  measure: z.enum([
    "not_spectral",
    "time_domain",
    "frequency_hz",
    "angular_frequency_rad_s",
    "per_hz",
    "per_rad_s",
    "four_frequency",
  ]),
  fourier_convention: z.string().min(1),
  psd_sidedness: z.enum([
    "not_applicable",
    "one_sided",
    "two_sided",
  ]),
  canonical_jacobian: PositiveFinite,
}).strict();

const RenormalizationContract = z.object({
  prescription: z.string().min(1),
  reference_state: z.string().min(1),
}).strict();

const IntegrityReceipt = z.object({
  source_ref: z.string().min(1),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.boolean(),
}).strict();

const TransformReceipt = z.object({
  transform_id: z.string().min(1),
  source_ref: z.string().min(1),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.boolean(),
}).strict();

const CongruenceDescriptor = z.object({
  si_dimension: SiDimensionVector,
  semantic_quantity_id: z.string().min(1),
  tensor: TensorContract,
  representation: RepresentationContract,
  spectral: SpectralContract,
  renormalization: RenormalizationContract,
  evidence_receipt: IntegrityReceipt,
  transform_receipt: TransformReceipt,
}).strict();

const QuantityRole = z.enum([
  "green_tensor",
  "polarizability_tensor",
  "force_noise_psd",
  "energy_difference_psd",
  "coherence_exponent",
  "renormalized_stress_energy_tensor",
  "stress_noise_kernel",
  "retarded_metric_response",
  "metric_perturbation",
  "coherence_phase",
  "collapse_rate",
  "scalar_pressure",
  "t00_scalar",
  "compton_angular_frequency",
  "dp_rate",
  "cavity_angular_frequency",
]);

const CongruenceQuantity = z.object({
  quantity_id: z.string().min(1),
  role: QuantityRole,
  descriptor: CongruenceDescriptor,
}).strict();

const DimensionPower = z.object({
  quantity_id: z.string().min(1),
  power: z.number().int(),
}).strict();

const EdgeKind = z.enum([
  "green_alpha_to_force_noise",
  "force_noise_to_energy_noise",
  "energy_noise_to_chi",
  "stress_noise_to_retarded_response",
  "retarded_response_to_metric",
  "metric_to_phase",
  "metric_to_rate",
  "frequency_transfer_kernel",
]);

const CongruenceEdge = z.object({
  edge_id: z.string().min(1),
  kind: EdgeKind,
  source_quantity_ids: z.array(z.string().min(1)).min(1),
  target_quantity_id: z.string().min(1),
  descriptor: CongruenceDescriptor,
  dimension_transform: z.object({
    source_powers: z.array(DimensionPower).min(1),
    kernel_dimension: SiDimensionVector,
  }).strict(),
  semantic_mapping: z.object({
    equation_id: z.string().min(1),
    mapping_description: z.string().min(1),
    passed: z.boolean(),
  }).strict(),
  tensor_mapping: z.object({
    contraction_description: z.string().min(1),
    passed: z.boolean(),
  }).strict(),
  representation_mapping: z.object({
    frame_basis_map: z.string().min(1),
    gauge_map: z.string().min(1),
    passed: z.boolean(),
  }).strict(),
  explicit_coupling_or_fdt_ref: z.string().min(1).nullable(),
  sourced_transfer_kernel_ref: z.string().min(1).nullable(),
  source_term_kind: z.enum([
    "not_applicable",
    "full_renormalized_tensor",
    "scalar_pressure",
    "t00_scalar",
  ]),
}).strict();

const ExpectedRoleContract = {
  green_tensor: {
    dimension: dim(0, -1, 0, 0, 0, 0, 0),
    rank: 2,
  },
  polarizability_tensor: {
    dimension: dim(-1, 0, 4, 2, 0, 0, 0),
    rank: 2,
  },
  force_noise_psd: {
    dimension: dim(2, 2, -3, 0, 0, 0, 0),
    rank: 2,
  },
  energy_difference_psd: {
    dimension: dim(2, 4, -3, 0, 0, 0, 0),
    rank: 0,
  },
  coherence_exponent: {
    dimension: dim(0, 0, 0, 0, 0, 0, 0),
    rank: 0,
  },
  renormalized_stress_energy_tensor: {
    dimension: dim(1, -1, -2, 0, 0, 0, 0),
    rank: 2,
  },
  stress_noise_kernel: {
    dimension: dim(2, -2, -4, 0, 0, 0, 0),
    rank: 4,
  },
  retarded_metric_response: {
    dimension: dim(-1, 1, 2, 0, 0, 0, 0),
    rank: 4,
  },
  metric_perturbation: {
    dimension: dim(0, 0, 0, 0, 0, 0, 0),
    rank: 2,
  },
  coherence_phase: {
    dimension: dim(0, 0, 0, 0, 0, 0, 0),
    rank: 0,
  },
  collapse_rate: {
    dimension: dim(0, 0, -1, 0, 0, 0, 0),
    rank: 0,
  },
  scalar_pressure: {
    dimension: dim(1, -1, -2, 0, 0, 0, 0),
    rank: 0,
  },
  t00_scalar: {
    dimension: dim(1, -1, -2, 0, 0, 0, 0),
    rank: 0,
  },
  compton_angular_frequency: {
    dimension: dim(0, 0, -1, 0, 0, 0, 0),
    rank: 0,
  },
  dp_rate: {
    dimension: dim(0, 0, -1, 0, 0, 0, 0),
    rank: 0,
  },
  cavity_angular_frequency: {
    dimension: dim(0, 0, -1, 0, 0, 0, 0),
    rank: 0,
  },
} as const;

export const CasimirDpTensorDimensionalCongruenceInput = z.object({
  schema_version: z.literal("casimir_dp_tensor_dimensional_congruence/1"),
  campaign_id: z.string().min(1),
  evidence_class: z.enum([
    "synthetic_fixture",
    "measured",
    "literature_anchored",
    "source_backed_calculation",
  ]),
  authority_receipt: IntegrityReceipt,
  quantities: z.array(CongruenceQuantity).min(1),
  edges: z.array(CongruenceEdge).min(1),
  convention_checks: z.object({
    planck_energy_J: PositiveFinite,
    frequency_Hz: PositiveFinite,
    angular_frequency_rad_s: PositiveFinite,
    planck_constant_J_s: PositiveFinite,
    reduced_planck_constant_J_s: PositiveFinite,
    relative_tolerance: NonnegativeFinite,
    psd_per_Hz: NonnegativeFinite,
    psd_per_rad_s: NonnegativeFinite,
    spectral_jacobian_relative_tolerance: NonnegativeFinite,
  }).strict(),
  physical_checks: z.object({
    stress_conservation_residual: NonnegativeFinite,
    stress_conservation_tolerance: NonnegativeFinite,
    stress_tensor_symmetry_passed: z.boolean(),
    stress_noise_pair_symmetry_passed: z.boolean(),
    gauge_constraints_passed: z.boolean(),
    covariance_minimum_eigenvalue: Finite,
    covariance_psd_tolerance: NonnegativeFinite,
  }).strict(),
  invariance_checks: z.object({
    basis_round_trip_relative_error: NonnegativeFinite,
    basis_round_trip_tolerance: NonnegativeFinite,
    unit_round_trip_relative_error: NonnegativeFinite,
    unit_round_trip_tolerance: NonnegativeFinite,
  }).strict(),
  recovery_limits: z.object({
    zero_coupling: z.boolean(),
    no_boundary_contrast: z.boolean(),
    standard_qed: z.boolean(),
    ordinary_gr: z.boolean(),
    standard_or_dp: z.boolean(),
  }).strict(),
}).strict().superRefine((input, context) => {
  const quantityIds = input.quantities.map((quantity) => quantity.quantity_id);
  if (new Set(quantityIds).size !== quantityIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantities"],
      message: "quantity ids must be unique",
    });
  }
  const known = new Set(quantityIds);
  const edgeIds = input.edges.map((edge) => edge.edge_id);
  if (new Set(edgeIds).size !== edgeIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["edges"],
      message: "edge ids must be unique",
    });
  }
  input.edges.forEach((edge, edgeIndex) => {
    for (const sourceId of edge.source_quantity_ids) {
      if (!known.has(sourceId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["edges", edgeIndex, "source_quantity_ids"],
          message: `unknown source quantity ${sourceId}`,
        });
      }
    }
    if (!known.has(edge.target_quantity_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["edges", edgeIndex, "target_quantity_id"],
        message: `unknown target quantity ${edge.target_quantity_id}`,
      });
    }
    const powerIds = edge.dimension_transform.source_powers.map(
      (row) => row.quantity_id,
    );
    if (
      powerIds.length !== edge.source_quantity_ids.length ||
      new Set(powerIds).size !== powerIds.length ||
      powerIds.some((id) => !edge.source_quantity_ids.includes(id))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["edges", edgeIndex, "dimension_transform", "source_powers"],
        message: "source powers must cover each source quantity exactly once",
      });
    }
  });
});

export type CasimirDpTensorDimensionalCongruenceInput = z.infer<
  typeof CasimirDpTensorDimensionalCongruenceInput
>;

export type CasimirDpCongruenceFailure = {
  code: string;
  path: string;
  reason: string;
};

export const CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER = [
  "CD_RECEIPT_INTEGRITY_FAILED",
  "CD_QUANTITY_DIMENSION_INVALID",
  "CD_QUANTITY_TENSOR_INVALID",
  "CD_EDGE_DIMENSIONAL_CLOSURE_FAILED",
  "CD_SEMANTIC_MAPPING_FAILED",
  "CD_TENSOR_MAPPING_FAILED",
  "CD_REPRESENTATION_MAPPING_FAILED",
  "CD_SPECTRAL_CONVENTION_MISMATCH",
  "CD_RENORMALIZATION_REFERENCE_MISSING",
  "CD_H_HBAR_2PI_MISMATCH",
  "CD_SPECTRAL_JACOBIAN_MISMATCH",
  "CD_GREEN_NOISE_COUPLING_MISSING",
  "CD_SCALAR_SOURCE_NOT_TENSOR",
  "CD_STRESS_CONSERVATION_FAILED",
  "CD_TENSOR_SYMMETRY_FAILED",
  "CD_GAUGE_CONSTRAINT_FAILED",
  "CD_COVARIANCE_NOT_PSD",
  "CD_BASIS_ROUND_TRIP_FAILED",
  "CD_UNIT_ROUND_TRIP_FAILED",
  "CD_RECOVERY_LIMIT_FAILED",
  "CD_QED_CHAIN_INCOMPLETE",
  "CD_BRIDGE_CHAIN_INCOMPLETE",
  "CD_UNSOURCED_FREQUENCY_KERNEL",
] as const;

function dim(
  mass: number,
  length: number,
  time: number,
  current: number,
  temperature: number,
  amount: number,
  luminousIntensity: number,
): CasimirDpSiDimensionVector {
  return {
    mass,
    length,
    time,
    current,
    temperature,
    amount,
    luminous_intensity: luminousIntensity,
  };
}

const DIMENSION_KEYS = [
  "mass",
  "length",
  "time",
  "current",
  "temperature",
  "amount",
  "luminous_intensity",
] as const;

function sameDimension(
  left: CasimirDpSiDimensionVector,
  right: CasimirDpSiDimensionVector,
): boolean {
  return DIMENSION_KEYS.every((key) => left[key] === right[key]);
}

function addDimension(
  left: CasimirDpSiDimensionVector,
  right: CasimirDpSiDimensionVector,
  scale = 1,
): CasimirDpSiDimensionVector {
  const output = { ...left };
  for (const key of DIMENSION_KEYS) output[key] += scale * right[key];
  return output;
}

function receiptPass(
  receipt: z.infer<typeof IntegrityReceipt> | z.infer<typeof TransformReceipt>,
): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function relativeError(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function fail(
  code: string,
  path: string,
  reason: string,
): CasimirDpCongruenceFailure {
  return { code, path, reason };
}

function descriptorFailures(
  descriptor: z.infer<typeof CongruenceDescriptor>,
  path: string,
): CasimirDpCongruenceFailure[] {
  const failures: CasimirDpCongruenceFailure[] = [];
  if (!receiptPass(descriptor.evidence_receipt)) {
    failures.push(fail(
      "CD_RECEIPT_INTEGRITY_FAILED",
      `${path}.evidence_receipt`,
      "The evidence receipt must be hash-matched and integrity verified.",
    ));
  }
  if (!receiptPass(descriptor.transform_receipt)) {
    failures.push(fail(
      "CD_RECEIPT_INTEGRITY_FAILED",
      `${path}.transform_receipt`,
      "The representation/transform receipt must be hash-matched and integrity verified.",
    ));
  }
  if (
    descriptor.renormalization.prescription.trim().length === 0 ||
    descriptor.renormalization.reference_state.trim().length === 0
  ) {
    failures.push(fail(
      "CD_RENORMALIZATION_REFERENCE_MISSING",
      `${path}.renormalization`,
      "Every quantity and transform must identify its renormalization/reference convention.",
    ));
  }
  return failures;
}

function roleQuantity(
  quantities: CasimirDpTensorDimensionalCongruenceInput["quantities"],
  role: z.infer<typeof QuantityRole>,
) {
  return quantities.find((quantity) => quantity.role === role);
}

function edgeByKind(
  edges: CasimirDpTensorDimensionalCongruenceInput["edges"],
  kind: z.infer<typeof EdgeKind>,
) {
  return edges.find((edge) => edge.kind === kind);
}

function edgeDimension(
  edge: CasimirDpTensorDimensionalCongruenceInput["edges"][number],
  quantitiesById: Map<
    string,
    CasimirDpTensorDimensionalCongruenceInput["quantities"][number]
  >,
): CasimirDpSiDimensionVector {
  let output = { ...edge.dimension_transform.kernel_dimension };
  for (const row of edge.dimension_transform.source_powers) {
    const quantity = quantitiesById.get(row.quantity_id);
    if (quantity) {
      output = addDimension(
        output,
        quantity.descriptor.si_dimension,
        row.power,
      );
    }
  }
  return output;
}

function sortFailures(
  failures: CasimirDpCongruenceFailure[],
): CasimirDpCongruenceFailure[] {
  const order = new Map(
    CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER.map((code, index) => [
      code,
      index,
    ]),
  );
  return failures.sort((left, right) =>
    (order.get(left.code as typeof CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER[number]) ??
      Number.MAX_SAFE_INTEGER) -
    (order.get(right.code as typeof CASIMIR_DP_CONGRUENCE_FIRST_FAILURE_ORDER[number]) ??
      Number.MAX_SAFE_INTEGER)
  );
}

export function evaluateCasimirDpTensorDimensionalCongruence(
  rawInput: CasimirDpTensorDimensionalCongruenceInput,
) {
  const input = CasimirDpTensorDimensionalCongruenceInput.parse(rawInput);
  const failures: CasimirDpCongruenceFailure[] = [];
  const quantitiesById = new Map(
    input.quantities.map((quantity) => [quantity.quantity_id, quantity]),
  );

  if (!receiptPass(input.authority_receipt)) {
    failures.push(fail(
      "CD_RECEIPT_INTEGRITY_FAILED",
      "authority_receipt",
      "The Stage-4 authority receipt must be hash-matched and integrity verified.",
    ));
  }

  input.quantities.forEach((quantity, index) => {
    failures.push(...descriptorFailures(
      quantity.descriptor,
      `quantities[${index}].descriptor`,
    ));
    const expected = ExpectedRoleContract[quantity.role];
    if (!sameDimension(quantity.descriptor.si_dimension, expected.dimension)) {
      failures.push(fail(
        "CD_QUANTITY_DIMENSION_INVALID",
        `quantities[${index}].descriptor.si_dimension`,
        `${quantity.role} does not have its registered SI dimension vector.`,
      ));
    }
    if (quantity.descriptor.tensor.rank !== expected.rank) {
      failures.push(fail(
        "CD_QUANTITY_TENSOR_INVALID",
        `quantities[${index}].descriptor.tensor.rank`,
        `${quantity.role} does not have its registered tensor rank.`,
      ));
    }
  });

  input.edges.forEach((edge, index) => {
    failures.push(...descriptorFailures(
      edge.descriptor,
      `edges[${index}].descriptor`,
    ));
    const target = quantitiesById.get(edge.target_quantity_id);
    const computed = edgeDimension(edge, quantitiesById);
    if (
      target == null ||
      !sameDimension(computed, target.descriptor.si_dimension) ||
      !sameDimension(edge.descriptor.si_dimension, target.descriptor.si_dimension)
    ) {
      failures.push(fail(
        "CD_EDGE_DIMENSIONAL_CLOSURE_FAILED",
        `edges[${index}].dimension_transform`,
        "The source powers and explicit kernel dimension must close to the target dimension.",
      ));
    }
    if (
      !edge.semantic_mapping.passed ||
      edge.semantic_mapping.equation_id.trim().length === 0
    ) {
      failures.push(fail(
        "CD_SEMANTIC_MAPPING_FAILED",
        `edges[${index}].semantic_mapping`,
        "Dimensional equality is insufficient without an explicit semantic equation.",
      ));
    }
    if (!edge.tensor_mapping.passed) {
      failures.push(fail(
        "CD_TENSOR_MAPPING_FAILED",
        `edges[${index}].tensor_mapping`,
        "The tensor contraction/rank mapping did not pass.",
      ));
    }
    if (!edge.representation_mapping.passed) {
      failures.push(fail(
        "CD_REPRESENTATION_MAPPING_FAILED",
        `edges[${index}].representation_mapping`,
        "The frame, basis, or gauge mapping did not pass.",
      ));
    }
    if (
      edge.descriptor.spectral.measure === "per_hz" &&
      edge.descriptor.spectral.canonical_jacobian !== 1 / (2 * Math.PI)
    ) {
      failures.push(fail(
        "CD_SPECTRAL_CONVENTION_MISMATCH",
        `edges[${index}].descriptor.spectral`,
        "A per-Hz edge must explicitly carry the 1/(2*pi) Jacobian into the angular-frequency convention.",
      ));
    }
    if (
      edge.kind === "green_alpha_to_force_noise" &&
      edge.explicit_coupling_or_fdt_ref == null
    ) {
      failures.push(fail(
        "CD_GREEN_NOISE_COUPLING_MISSING",
        `edges[${index}].explicit_coupling_or_fdt_ref`,
        "A Green tensor and polarizability do not become force noise without an explicit sourced coupling/FDT mapping.",
      ));
    }
    if (
      (
        edge.kind === "stress_noise_to_retarded_response" ||
        edge.kind === "retarded_response_to_metric"
      ) &&
      edge.source_term_kind !== "full_renormalized_tensor"
    ) {
      failures.push(fail(
        "CD_SCALAR_SOURCE_NOT_TENSOR",
        `edges[${index}].source_term_kind`,
        "Scalar pressure or a scalar T00 value cannot substitute for a complete renormalized tensor source.",
      ));
    }
    if (
      edge.kind === "frequency_transfer_kernel" &&
      edge.sourced_transfer_kernel_ref == null
    ) {
      failures.push(fail(
        "CD_UNSOURCED_FREQUENCY_KERNEL",
        `edges[${index}].sourced_transfer_kernel_ref`,
        "Equal inverse-time units do not connect Compton, DP, and cavity frequencies without a sourced transfer kernel.",
      ));
    }
  });

  const convention = input.convention_checks;
  const energyFromHNu =
    convention.planck_constant_J_s * convention.frequency_Hz;
  const energyFromHbarOmega =
    convention.reduced_planck_constant_J_s *
    convention.angular_frequency_rad_s;
  const angularFrequencyExpected = 2 * Math.PI * convention.frequency_Hz;
  const hbarExpected = convention.planck_constant_J_s / (2 * Math.PI);
  const planckErrors = {
    h_nu: relativeError(convention.planck_energy_J, energyFromHNu),
    hbar_omega: relativeError(
      convention.planck_energy_J,
      energyFromHbarOmega,
    ),
    omega_2pi_nu: relativeError(
      convention.angular_frequency_rad_s,
      angularFrequencyExpected,
    ),
    hbar_h_over_2pi: relativeError(
      convention.reduced_planck_constant_J_s,
      hbarExpected,
    ),
  };
  const maximumPlanckError = Math.max(...Object.values(planckErrors));
  if (maximumPlanckError > convention.relative_tolerance) {
    failures.push(fail(
      "CD_H_HBAR_2PI_MISMATCH",
      "convention_checks",
      "E=h*nu=hbar*omega and omega=2*pi*nu must agree within tolerance.",
    ));
  }

  const expectedPsdPerRadS = convention.psd_per_Hz / (2 * Math.PI);
  const spectralJacobianError = relativeError(
    convention.psd_per_rad_s,
    expectedPsdPerRadS,
  );
  if (
    spectralJacobianError >
      convention.spectral_jacobian_relative_tolerance
  ) {
    failures.push(fail(
      "CD_SPECTRAL_JACOBIAN_MISMATCH",
      "convention_checks.psd_per_rad_s",
      "PSD conversion must satisfy S_omega=S_nu/(2*pi).",
    ));
  }

  const physical = input.physical_checks;
  if (
    physical.stress_conservation_residual >
      physical.stress_conservation_tolerance
  ) {
    failures.push(fail(
      "CD_STRESS_CONSERVATION_FAILED",
      "physical_checks.stress_conservation_residual",
      "The complete stress-energy source must close its registered conservation tolerance.",
    ));
  }
  if (
    !physical.stress_tensor_symmetry_passed ||
    !physical.stress_noise_pair_symmetry_passed
  ) {
    failures.push(fail(
      "CD_TENSOR_SYMMETRY_FAILED",
      "physical_checks",
      "Stress-energy and stress-noise tensor symmetry identities must pass.",
    ));
  }
  if (!physical.gauge_constraints_passed) {
    failures.push(fail(
      "CD_GAUGE_CONSTRAINT_FAILED",
      "physical_checks.gauge_constraints_passed",
      "The registered gravitational gauge and constraint checks must pass.",
    ));
  }
  if (
    physical.covariance_minimum_eigenvalue <
      -physical.covariance_psd_tolerance
  ) {
    failures.push(fail(
      "CD_COVARIANCE_NOT_PSD",
      "physical_checks.covariance_minimum_eigenvalue",
      "The physical noise covariance must be positive semidefinite within tolerance.",
    ));
  }

  const invariance = input.invariance_checks;
  if (
    invariance.basis_round_trip_relative_error >
      invariance.basis_round_trip_tolerance
  ) {
    failures.push(fail(
      "CD_BASIS_ROUND_TRIP_FAILED",
      "invariance_checks.basis_round_trip_relative_error",
      "The registered basis transform must round-trip within tolerance.",
    ));
  }
  if (
    invariance.unit_round_trip_relative_error >
      invariance.unit_round_trip_tolerance
  ) {
    failures.push(fail(
      "CD_UNIT_ROUND_TRIP_FAILED",
      "invariance_checks.unit_round_trip_relative_error",
      "The registered unit conversion must round-trip within tolerance.",
    ));
  }

  if (!Object.values(input.recovery_limits).every(Boolean)) {
    failures.push(fail(
      "CD_RECOVERY_LIMIT_FAILED",
      "recovery_limits",
      "Zero/null and standard-theory recovery limits must all pass.",
    ));
  }

  const qedRoles = [
    "green_tensor",
    "polarizability_tensor",
    "force_noise_psd",
    "energy_difference_psd",
    "coherence_exponent",
  ] as const;
  const qedKinds = [
    "green_alpha_to_force_noise",
    "force_noise_to_energy_noise",
    "energy_noise_to_chi",
  ] as const;
  const qedChainPresent =
    qedRoles.every((role) => roleQuantity(input.quantities, role) != null) &&
    qedKinds.every((kind) => edgeByKind(input.edges, kind) != null);
  if (!qedChainPresent) {
    failures.push(fail(
      "CD_QED_CHAIN_INCOMPLETE",
      "edges",
      "The admitted G/alpha -> S_FF -> S_DeltaU -> chi chain is incomplete.",
    ));
  }

  const bridgeRoles = [
    "renormalized_stress_energy_tensor",
    "stress_noise_kernel",
    "retarded_metric_response",
    "metric_perturbation",
    "coherence_phase",
    "collapse_rate",
  ] as const;
  const bridgeKinds = [
    "stress_noise_to_retarded_response",
    "retarded_response_to_metric",
    "metric_to_phase",
    "metric_to_rate",
  ] as const;
  const bridgeChainPresent =
    bridgeRoles.every((role) => roleQuantity(input.quantities, role) != null) &&
    bridgeKinds.every((kind) => edgeByKind(input.edges, kind) != null);
  if (!bridgeChainPresent) {
    failures.push(fail(
      "CD_BRIDGE_CHAIN_INCOMPLETE",
      "edges",
      "The registered T/N -> G_ret -> h -> phase/rate chain is incomplete.",
    ));
  }

  const frequencyRoles = [
    "compton_angular_frequency",
    "dp_rate",
    "cavity_angular_frequency",
  ] as const;
  const frequencyQuantities = frequencyRoles.map((role) =>
    roleQuantity(input.quantities, role)
  );
  const frequencyDimensionsMatch =
    frequencyQuantities.every((quantity) => quantity != null) &&
    frequencyQuantities.slice(1).every((quantity) =>
      sameDimension(
        frequencyQuantities[0]!.descriptor.si_dimension,
        quantity!.descriptor.si_dimension,
      )
    );
  const frequencyKernel = edgeByKind(input.edges, "frequency_transfer_kernel");
  const sourcedFrequencyKernel =
    frequencyKernel?.sourced_transfer_kernel_ref != null &&
    receiptPass(frequencyKernel.descriptor.transform_receipt);

  const orderedFailures = sortFailures(failures);
  const qedFailureCodes = new Set([
    "CD_GREEN_NOISE_COUPLING_MISSING",
    "CD_QED_CHAIN_INCOMPLETE",
    "CD_EDGE_DIMENSIONAL_CLOSURE_FAILED",
    "CD_SEMANTIC_MAPPING_FAILED",
    "CD_TENSOR_MAPPING_FAILED",
    "CD_REPRESENTATION_MAPPING_FAILED",
    "CD_RECEIPT_INTEGRITY_FAILED",
  ]);
  const bridgeFailureCodes = new Set([
    "CD_SCALAR_SOURCE_NOT_TENSOR",
    "CD_STRESS_CONSERVATION_FAILED",
    "CD_TENSOR_SYMMETRY_FAILED",
    "CD_GAUGE_CONSTRAINT_FAILED",
    "CD_COVARIANCE_NOT_PSD",
    "CD_BRIDGE_CHAIN_INCOMPLETE",
    "CD_EDGE_DIMENSIONAL_CLOSURE_FAILED",
    "CD_SEMANTIC_MAPPING_FAILED",
    "CD_TENSOR_MAPPING_FAILED",
    "CD_REPRESENTATION_MAPPING_FAILED",
    "CD_RECEIPT_INTEGRITY_FAILED",
  ]);
  const qedBlocked = orderedFailures.some((row) =>
    qedFailureCodes.has(row.code)
  );
  const bridgeBlocked = orderedFailures.some((row) =>
    bridgeFailureCodes.has(row.code)
  );

  return {
    schema_version: "casimir_dp_tensor_dimensional_congruence_result/1" as const,
    campaign_id: input.campaign_id,
    status:
      orderedFailures.length === 0 ? "pass" as const : "blocked" as const,
    first_failure_code: orderedFailures[0]?.code ?? null,
    failures: orderedFailures,
    convention_diagnostics: {
      planck_relative_errors: planckErrors,
      maximum_planck_relative_error: maximumPlanckError,
      h_hbar_2pi_gate:
        maximumPlanckError <= convention.relative_tolerance
          ? "pass" as const
          : "blocked" as const,
      spectral_jacobian_relative_error: spectralJacobianError,
      spectral_jacobian_gate:
        spectralJacobianError <=
            convention.spectral_jacobian_relative_tolerance
          ? "pass" as const
          : "blocked" as const,
    },
    qed_chain: {
      chain: "G_ij + alpha_ij -> S_FF_ij -> S_DeltaU -> chi" as const,
      status:
        qedChainPresent && !qedBlocked ? "pass" as const : "blocked" as const,
      explicit_coupling_required: true,
    },
    tensor_bridge_chain: {
      chain:
        "T_munu + N_munu_rho_sigma -> G_ret -> h_munu -> phase/rate" as const,
      status:
        bridgeChainPresent && !bridgeBlocked
          ? "registered_congruence_only" as const
          : "blocked" as const,
      numerical_bridge_output: null,
      empirically_validated: false as const,
    },
    frequency_non_bridge: {
      semantic_quantity_ids: frequencyQuantities
        .filter((quantity) => quantity != null)
        .map((quantity) => quantity!.descriptor.semantic_quantity_id),
      shared_dimension: frequencyDimensionsMatch
        ? "T^-1" as const
        : null,
      sourced_transfer_kernel_present: sourcedFrequencyKernel,
      status:
        frequencyDimensionsMatch && !sourcedFrequencyKernel
          ? "same_dimension_not_connected" as const
          : sourcedFrequencyKernel
            ? "connected_only_by_registered_kernel" as const
            : "blocked" as const,
    },
    invariance: {
      basis_round_trip_gate:
        invariance.basis_round_trip_relative_error <=
            invariance.basis_round_trip_tolerance
          ? "pass" as const
          : "blocked" as const,
      unit_round_trip_gate:
        invariance.unit_round_trip_relative_error <=
            invariance.unit_round_trip_tolerance
          ? "pass" as const
          : "blocked" as const,
    },
    evidence_class: input.evidence_class,
    promotion_allowed: false as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
    claim_ceiling: "diagnostic" as const,
    maximum_claim:
      input.evidence_class === "synthetic_fixture"
        ? "synthetic_congruence_validation" as const
        : "typed_congruence_preflight_only" as const,
    claim_boundaries: [
      "A matching SI dimension vector does not establish a semantic or causal connection.",
      "Tensor congruence registration does not calculate or validate a manifold response.",
      "Synthetic fixtures validate software and fail-closed behavior only.",
      "Circular polarization or frequency matching cannot by itself establish quantized spacetime.",
    ] as const,
  };
}
