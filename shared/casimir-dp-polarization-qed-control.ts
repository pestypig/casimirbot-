// math-stage: exploratory
import { z } from "zod";

const SHA256 = /^[a-f0-9]{64}$/;
const SQRT_HALF = 1 / Math.sqrt(2);

const Complex = z.object({
  re: z.number().finite(),
  im: z.number().finite(),
});
const ComplexVector2 = z.tuple([Complex, Complex]);
const ComplexMatrix2 = z.tuple([
  z.tuple([Complex, Complex]),
  z.tuple([Complex, Complex]),
]);
const Vector3 = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const HashedReceipt = z.object({
  receipt_id: z.string().min(1),
  source_ref: z.string().min(1),
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
  model_binding_sha256: z.string().regex(SHA256),
  evidence_class: z.enum([
    "measured",
    "literature_anchored",
    "synthetic_fixture",
  ]),
});

const PolarizationBasis = z.enum(["te_tm", "circular_rcp_lcp"]);

const PolarizationState = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("jones_vector"),
    basis: PolarizationBasis,
    amplitudes: ComplexVector2,
  }),
  z.object({
    kind: z.literal("coherency_matrix"),
    basis: PolarizationBasis,
    matrix: ComplexMatrix2,
  }),
  z.object({
    kind: z.literal("stokes"),
    basis: z.literal("te_tm"),
    stokes: z.tuple([
      z.number().nonnegative(),
      z.number().finite(),
      z.number().finite(),
      z.number().finite(),
    ]),
  }),
]);

const ReflectionResponse = z.object({
  response_id: z.string().min(1),
  model_binding_sha256: z.string().regex(SHA256),
  receipt_id: z.string().min(1),
  matrix_basis: PolarizationBasis,
  reflection_jones: ComplexMatrix2,
  boundary_kind: z.enum(["opaque_reflector", "no_boundary"]),
  symmetry_class: z.enum([
    "reciprocal_achiral",
    "reciprocal_chiral",
    "no_boundary",
  ]),
  reciprocal_confirmed: z.boolean(),
  mirror_pair_id: z.string().min(1).nullable(),
  mirror_handedness: z.union([
    z.literal(-1),
    z.literal(0),
    z.literal(1),
  ]),
});

const ControlObservables = z.object({
  reported_absorbed_power_W: z.number().nonnegative(),
  reported_heating_rate_s: z.number().nonnegative(),
  reported_axial_force_N: z.number().finite(),
  reported_axial_torque_magnitude_N_m: z.number().nonnegative(),
  reported_trap_omega_rad_s: z.number().positive(),
  branch_state_ref: z.string().min(1),
  branch_state_sha256: z.string().regex(SHA256),
});

const PolarizationCell = z.object({
  cell_id: z.string().min(1),
  model_binding_sha256: z.string().regex(SHA256),
  response_id: z.string().min(1),
  state_receipt_id: z.string().min(1),
  controls_receipt_id: z.string().min(1),
  polarization_label: z.enum(["RCP", "LCP"]),
  polarization_state: PolarizationState,
  green_projection_m_inv: z.number().nonnegative(),
  polarizability_projection_SI: z.number().nonnegative(),
  coupling_multiplier: z.number().nonnegative(),
  incident_power_W: z.number().nonnegative(),
  hold_time_s: z.number().positive(),
  controls: ControlObservables,
});

const MatchedPair = z.object({
  pair_id: z.string().min(1),
  rcp_cell_id: z.string().min(1),
  lcp_cell_id: z.string().min(1),
});

const DoubleContrast = z.object({
  contrast_id: z.string().min(1),
  chiral_plus_rcp_cell_id: z.string().min(1),
  chiral_plus_lcp_cell_id: z.string().min(1),
  mirror_rcp_cell_id: z.string().min(1),
  mirror_lcp_cell_id: z.string().min(1),
});

export const CasimirDpPolarizationQedControlInput = z.object({
  schema_version: z.literal("casimir_dp_polarization_qed_control/1"),
  evidence_class: z.enum([
    "measured",
    "literature_anchored",
    "synthetic_fixture",
  ]),
  model_binding_sha256: z.string().regex(SHA256),
  model_maturity: z.literal("exploratory_reduced_order_diagnostic"),
  polarization_convention: z.object({
    phasor_convention: z.literal("Re[E exp(-i omega t)]"),
    propagation_direction_lab: Vector3,
    te_direction_lab: Vector3,
    tm_direction_lab: Vector3,
    observation_direction: z.literal("looking_along_propagation"),
    circular_basis_order: z.tuple([
      z.literal("RCP"),
      z.literal("LCP"),
    ]),
    rcp_definition: z.literal("(TE-i*TM)/sqrt(2)"),
    lcp_definition: z.literal("(TE+i*TM)/sqrt(2)"),
    stokes_s3_definition: z.literal("I_RCP-I_LCP=2*Im(C_TE,TM)"),
  }),
  receipts: z.array(HashedReceipt).min(3),
  forward_model: z.object({
    receipt_id: z.string().min(1),
    green_reference_m_inv: z.number().positive(),
    polarizability_reference_SI: z.number().positive(),
    incident_power_reference_W: z.number().positive(),
    phase_coefficient_rad: z.number().finite(),
    ramsey_chi_coefficient: z.number().nonnegative(),
    axial_force_coefficient_N: z.number().finite(),
    heating_coefficient_W: z.number().nonnegative(),
    axial_torque_coefficient_N_m: z.number().nonnegative(),
    trap_shift_coefficient_rad_s: z.number().finite(),
    formula_ref: z.string().min(1),
  }),
  responses: z.array(ReflectionResponse).min(4),
  cells: z.array(PolarizationCell).min(8),
  matched_pairs: z.array(MatchedPair).min(3),
  double_contrasts: z.array(DoubleContrast).min(1),
  tolerances: z.object({
    frame_orthonormal_absolute: z.number().nonnegative(),
    state_hermitian_absolute: z.number().nonnegative(),
    state_psd_absolute: z.number().nonnegative(),
    helicity_label_absolute: z.number().nonnegative(),
    passivity_absolute: z.number().nonnegative(),
    symmetry_absolute: z.number().nonnegative(),
    basis_invariance_relative: z.number().nonnegative(),
    matched_relative: z.number().nonnegative(),
    matched_force_absolute_N: z.number().nonnegative(),
    matched_torque_absolute_N_m: z.number().nonnegative(),
    zero_limit_absolute: z.number().nonnegative(),
  }),
  sensitivity: z.object({
    anchor_cell_id: z.string().min(1),
    fractional_perturbation: z.number().positive().max(0.5),
    minimum_fractional_output_change: z.number().nonnegative(),
  }),
}).superRefine((input, context) => {
  const unique = (
    values: string[],
    path: (string | number)[],
    label: string,
  ) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: `${label} values must be unique.`,
      });
    }
  };

  unique(
    input.receipts.map((receipt) => receipt.receipt_id),
    ["receipts"],
    "receipt_id",
  );
  unique(
    input.responses.map((response) => response.response_id),
    ["responses"],
    "response_id",
  );
  unique(
    input.cells.map((cell) => cell.cell_id),
    ["cells"],
    "cell_id",
  );
  unique(
    input.matched_pairs.map((pair) => pair.pair_id),
    ["matched_pairs"],
    "pair_id",
  );
  unique(
    input.double_contrasts.map((contrast) => contrast.contrast_id),
    ["double_contrasts"],
    "contrast_id",
  );

  const receiptIds = new Set(
    input.receipts.map((receipt) => receipt.receipt_id),
  );
  const responseIds = new Set(
    input.responses.map((response) => response.response_id),
  );
  const cellIds = new Set(input.cells.map((cell) => cell.cell_id));
  const requireReceipt = (
    receiptId: string,
    path: (string | number)[],
  ) => {
    if (!receiptIds.has(receiptId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: `Unknown receipt_id ${receiptId}.`,
      });
    }
  };
  requireReceipt(input.forward_model.receipt_id, [
    "forward_model",
    "receipt_id",
  ]);
  input.responses.forEach((response, index) => {
    requireReceipt(response.receipt_id, ["responses", index, "receipt_id"]);
    if (response.boundary_kind === "no_boundary") {
      if (
        response.symmetry_class !== "no_boundary" ||
        response.mirror_handedness !== 0 ||
        response.mirror_pair_id != null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responses", index],
          message:
            "A no-boundary response must use no_boundary symmetry and no mirror registration.",
        });
      }
    } else if (response.symmetry_class === "reciprocal_achiral") {
      if (
        response.mirror_handedness !== 0 ||
        response.mirror_pair_id != null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responses", index],
          message:
            "A reciprocal-achiral response must have zero handedness and no mirror pair.",
        });
      }
    } else if (
      response.mirror_handedness === 0 ||
      response.mirror_pair_id == null
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responses", index],
        message:
          "A reciprocal-chiral response requires nonzero handedness and a mirror pair.",
      });
    }
  });
  input.cells.forEach((cell, index) => {
    if (!responseIds.has(cell.response_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cells", index, "response_id"],
        message: `Unknown response_id ${cell.response_id}.`,
      });
    }
    requireReceipt(cell.state_receipt_id, [
      "cells",
      index,
      "state_receipt_id",
    ]);
    requireReceipt(cell.controls_receipt_id, [
      "cells",
      index,
      "controls_receipt_id",
    ]);
  });
  input.matched_pairs.forEach((pair, index) => {
    for (const field of ["rcp_cell_id", "lcp_cell_id"] as const) {
      if (!cellIds.has(pair[field])) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["matched_pairs", index, field],
          message: `Unknown cell_id ${pair[field]}.`,
        });
      }
    }
  });
  input.double_contrasts.forEach((contrast, index) => {
    for (const field of [
      "chiral_plus_rcp_cell_id",
      "chiral_plus_lcp_cell_id",
      "mirror_rcp_cell_id",
      "mirror_lcp_cell_id",
    ] as const) {
      if (!cellIds.has(contrast[field])) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["double_contrasts", index, field],
          message: `Unknown cell_id ${contrast[field]}.`,
        });
      }
    }
  });
  if (!cellIds.has(input.sensitivity.anchor_cell_id)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sensitivity", "anchor_cell_id"],
      message: `Unknown anchor cell ${input.sensitivity.anchor_cell_id}.`,
    });
  }
});

export type CasimirDpPolarizationQedControlInput = z.infer<
  typeof CasimirDpPolarizationQedControlInput
>;

type ComplexValue = z.infer<typeof Complex>;
type ComplexVector2Value = z.infer<typeof ComplexVector2>;
type ComplexMatrix2Value = z.infer<typeof ComplexMatrix2>;
type PolarizationStateValue = z.infer<typeof PolarizationState>;
type ReflectionResponseValue = z.infer<typeof ReflectionResponse>;
type PolarizationCellValue = z.infer<typeof PolarizationCell>;

const ZERO: ComplexValue = { re: 0, im: 0 };
const LINEAR_TO_CIRCULAR: ComplexMatrix2Value = [
  [
    { re: SQRT_HALF, im: 0 },
    { re: 0, im: SQRT_HALF },
  ],
  [
    { re: SQRT_HALF, im: 0 },
    { re: 0, im: -SQRT_HALF },
  ],
];

function add(left: ComplexValue, right: ComplexValue): ComplexValue {
  return { re: left.re + right.re, im: left.im + right.im };
}

function multiply(left: ComplexValue, right: ComplexValue): ComplexValue {
  return {
    re: left.re * right.re - left.im * right.im,
    im: left.re * right.im + left.im * right.re,
  };
}

function conjugate(value: ComplexValue): ComplexValue {
  return { re: value.re, im: -value.im };
}

function scale(value: ComplexValue, factor: number): ComplexValue {
  return { re: value.re * factor, im: value.im * factor };
}

function magnitude(value: ComplexValue): number {
  return Math.hypot(value.re, value.im);
}

function matrixMultiply(
  left: ComplexMatrix2Value,
  right: ComplexMatrix2Value,
): ComplexMatrix2Value {
  return [0, 1].map((row) =>
    [0, 1].map((column) =>
      add(
        multiply(left[row][0], right[0][column]),
        multiply(left[row][1], right[1][column]),
      )
    )
  ) as ComplexMatrix2Value;
}

function dagger(matrix: ComplexMatrix2Value): ComplexMatrix2Value {
  return [
    [conjugate(matrix[0][0]), conjugate(matrix[1][0])],
    [conjugate(matrix[0][1]), conjugate(matrix[1][1])],
  ];
}

function matrixScale(
  matrix: ComplexMatrix2Value,
  factor: number,
): ComplexMatrix2Value {
  return matrix.map((row) =>
    row.map((value) => scale(value, factor))
  ) as ComplexMatrix2Value;
}

function outerProduct(vector: ComplexVector2Value): ComplexMatrix2Value {
  return vector.map((left) =>
    vector.map((right) => multiply(left, conjugate(right)))
  ) as ComplexMatrix2Value;
}

function trace(matrix: ComplexMatrix2Value): ComplexValue {
  return add(matrix[0][0], matrix[1][1]);
}

function basisTransform(
  matrix: ComplexMatrix2Value,
  from: z.infer<typeof PolarizationBasis>,
  to: z.infer<typeof PolarizationBasis>,
): ComplexMatrix2Value {
  if (from === to) return matrix;
  if (from === "te_tm") {
    return matrixMultiply(
      matrixMultiply(LINEAR_TO_CIRCULAR, matrix),
      dagger(LINEAR_TO_CIRCULAR),
    );
  }
  return matrixMultiply(
    matrixMultiply(dagger(LINEAR_TO_CIRCULAR), matrix),
    LINEAR_TO_CIRCULAR,
  );
}

function stateCoherencyTeTm(
  state: PolarizationStateValue,
): ComplexMatrix2Value {
  if (state.kind === "stokes") {
    const [s0, s1, s2, s3] = state.stokes;
    return [
      [
        { re: (s0 + s1) / 2, im: 0 },
        { re: s2 / 2, im: s3 / 2 },
      ],
      [
        { re: s2 / 2, im: -s3 / 2 },
        { re: (s0 - s1) / 2, im: 0 },
      ],
    ];
  }
  const matrix = state.kind === "jones_vector"
    ? outerProduct(state.amplitudes)
    : state.matrix;
  return basisTransform(matrix, state.basis, "te_tm");
}

function responseTeTm(
  response: ReflectionResponseValue,
): ComplexMatrix2Value {
  return basisTransform(
    response.reflection_jones,
    response.matrix_basis,
    "te_tm",
  );
}

function maximumMatrixDifference(
  left: ComplexMatrix2Value,
  right: ComplexMatrix2Value,
): number {
  let maximum = 0;
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      maximum = Math.max(
        maximum,
        magnitude({
          re: left[row][column].re - right[row][column].re,
          im: left[row][column].im - right[row][column].im,
        }),
      );
    }
  }
  return maximum;
}

function hermitianError(matrix: ComplexMatrix2Value): number {
  return maximumMatrixDifference(matrix, dagger(matrix));
}

function minimumHermitianEigenvalue(matrix: ComplexMatrix2Value): number {
  const a = matrix[0][0].re;
  const d = matrix[1][1].re;
  const offDiagonalMagnitude = magnitude(matrix[0][1]);
  return (
    a +
    d -
    Math.sqrt((a - d) ** 2 + 4 * offDiagonalMagnitude ** 2)
  ) / 2;
}

function maximumHermitianEigenvalue(matrix: ComplexMatrix2Value): number {
  const a = matrix[0][0].re;
  const d = matrix[1][1].re;
  const offDiagonalMagnitude = magnitude(matrix[0][1]);
  return (
    a +
    d +
    Math.sqrt((a - d) ** 2 + 4 * offDiagonalMagnitude ** 2)
  ) / 2;
}

function stokesFromCoherency(matrix: ComplexMatrix2Value) {
  const s0 = matrix[0][0].re + matrix[1][1].re;
  const s1 = matrix[0][0].re - matrix[1][1].re;
  const s2 = matrix[0][1].re + matrix[1][0].re;
  const s3 = matrix[0][1].im - matrix[1][0].im;
  const polarizedMagnitude = Math.hypot(s1, s2, s3);
  return {
    s0,
    s1,
    s2,
    s3,
    degree_of_polarization:
      s0 > Number.MIN_VALUE ? polarizedMagnitude / s0 : Number.POSITIVE_INFINITY,
    normalized_helicity:
      s0 > Number.MIN_VALUE ? s3 / s0 : Number.NaN,
  };
}

function responseMetrics(
  coherency: ComplexMatrix2Value,
  response: ComplexMatrix2Value,
  boundaryKind: ReflectionResponseValue["boundary_kind"],
) {
  const intensity = trace(coherency).re;
  const reflectedCoherency = matrixMultiply(
    matrixMultiply(response, coherency),
    dagger(response),
  );
  const reflectedFraction = intensity > Number.MIN_VALUE
    ? trace(reflectedCoherency).re / intensity
    : Number.NaN;
  const overlap = intensity > Number.MIN_VALUE
    ? scale(trace(matrixMultiply(coherency, response)), 1 / intensity)
    : { re: Number.NaN, im: Number.NaN };
  const absorptionFraction = boundaryKind === "no_boundary"
    ? 0
    : Math.max(0, 1 - reflectedFraction);
  const inputStokes = stokesFromCoherency(coherency);
  const reflectedStokes = stokesFromCoherency(reflectedCoherency);
  return {
    reflected_fraction: reflectedFraction,
    absorption_fraction: absorptionFraction,
    overlap,
    input_helicity: inputStokes.normalized_helicity,
    reflected_helicity: Number.isFinite(reflectedStokes.normalized_helicity)
      ? reflectedStokes.normalized_helicity
      : 0,
  };
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function vectorNorm(vector: readonly number[]): number {
  return Math.hypot(...vector);
}

function dot(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function cross(
  left: readonly number[],
  right: readonly number[],
): [number, number, number] {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

type CellPrediction = {
  cell_id: string;
  response_id: string;
  polarization_label: "RCP" | "LCP";
  reflected_fraction: number;
  absorption_fraction: number;
  absorbed_optical_power_W: number;
  overlap: ComplexValue;
  input_helicity: number;
  reflected_helicity: number;
  phase_rad: number;
  ramsey_chi: number;
  coherence_decay_rate_s: number;
  axial_force_N: number;
  heating_W: number;
  axial_torque_N_m: number;
  trap_shift_rad_s: number;
};

function predictCell(
  cell: PolarizationCellValue,
  response: ReflectionResponseValue,
  forwardModel: CasimirDpPolarizationQedControlInput["forward_model"],
  perturbation?: {
    green?: number;
    alpha?: number;
    response?: number;
  },
): CellPrediction {
  const coherency = stateCoherencyTeTm(cell.polarization_state);
  const responseMatrix = matrixScale(
    responseTeTm(response),
    perturbation?.response ?? 1,
  );
  const metrics = responseMetrics(
    coherency,
    responseMatrix,
    response.boundary_kind,
  );
  const boundaryMultiplier = response.boundary_kind === "no_boundary" ? 0 : 1;
  const greenRatio =
    cell.green_projection_m_inv *
    (perturbation?.green ?? 1) /
    forwardModel.green_reference_m_inv;
  const alphaRatio =
    cell.polarizability_projection_SI *
    (perturbation?.alpha ?? 1) /
    forwardModel.polarizability_reference_SI;
  const powerRatio =
    cell.incident_power_W / forwardModel.incident_power_reference_W;
  const coupling =
    boundaryMultiplier *
    cell.coupling_multiplier *
    greenRatio *
    alphaRatio *
    powerRatio;
  const phase =
    forwardModel.phase_coefficient_rad * coupling * metrics.overlap.im;
  const ramseyChi =
    forwardModel.ramsey_chi_coefficient *
    coupling ** 2 *
    metrics.absorption_fraction;
  const axialForce =
    forwardModel.axial_force_coefficient_N *
    coupling *
    (metrics.reflected_fraction + metrics.absorption_fraction);
  const heating =
    forwardModel.heating_coefficient_W *
    coupling ** 2 *
    metrics.absorption_fraction;
  const axialTorque =
    forwardModel.axial_torque_coefficient_N_m *
    coupling *
    metrics.absorption_fraction *
    metrics.input_helicity;
  const trapShift =
    forwardModel.trap_shift_coefficient_rad_s *
    coupling *
    metrics.overlap.re;
  return {
    cell_id: cell.cell_id,
    response_id: response.response_id,
    polarization_label: cell.polarization_label,
    reflected_fraction: metrics.reflected_fraction,
    absorption_fraction: metrics.absorption_fraction,
    absorbed_optical_power_W:
      cell.incident_power_W * metrics.absorption_fraction,
    overlap: metrics.overlap,
    input_helicity: metrics.input_helicity,
    reflected_helicity: metrics.reflected_helicity,
    phase_rad: Object.is(phase, -0) ? 0 : phase,
    ramsey_chi: ramseyChi,
    coherence_decay_rate_s: ramseyChi / cell.hold_time_s,
    axial_force_N: axialForce,
    heating_W: heating,
    axial_torque_N_m: axialTorque,
    trap_shift_rad_s: trapShift,
  };
}

function predictionChange(
  baseline: CellPrediction,
  changed: CellPrediction,
) {
  const observables = [
    "phase_rad",
    "ramsey_chi",
    "coherence_decay_rate_s",
    "axial_force_N",
    "heating_W",
    "axial_torque_N_m",
    "trap_shift_rad_s",
  ] as const;
  const rows = observables.map((observable) => ({
    observable,
    baseline: baseline[observable],
    perturbed: changed[observable],
    fractional_change: relativeDifference(
      baseline[observable],
      changed[observable],
    ),
  }));
  return {
    rows,
    maximum_fractional_change: Math.max(
      ...rows.map((row) => row.fractional_change),
    ),
    changed_observable_count: rows.filter(
      (row) => row.fractional_change > 1e-12,
    ).length,
  };
}

export function evaluateCasimirDpPolarizationQedControl(
  rawInput: CasimirDpPolarizationQedControlInput,
) {
  const input = CasimirDpPolarizationQedControlInput.parse(rawInput);
  const receiptById = new Map(
    input.receipts.map((receipt) => [receipt.receipt_id, receipt]),
  );
  const responseById = new Map(
    input.responses.map((response) => [response.response_id, response]),
  );
  const cellById = new Map(
    input.cells.map((cell) => [cell.cell_id, cell]),
  );

  const receiptIntegrity = input.receipts.every((receipt) =>
    receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256
  );
  const sharedBinding = [
    ...input.receipts.map((receipt) => receipt.model_binding_sha256),
    ...input.responses.map((response) => response.model_binding_sha256),
    ...input.cells.map((cell) => cell.model_binding_sha256),
  ].every((binding) => binding === input.model_binding_sha256);
  const receiptReferencesBound =
    receiptById.has(input.forward_model.receipt_id) &&
    input.responses.every((response) => receiptById.has(response.receipt_id)) &&
    input.cells.every((cell) =>
      receiptById.has(cell.state_receipt_id) &&
      receiptById.has(cell.controls_receipt_id)
    );

  const convention = input.polarization_convention;
  const k = convention.propagation_direction_lab;
  const te = convention.te_direction_lab;
  const tm = convention.tm_direction_lab;
  const frameErrors = {
    propagation_norm: Math.abs(vectorNorm(k) - 1),
    te_norm: Math.abs(vectorNorm(te) - 1),
    tm_norm: Math.abs(vectorNorm(tm) - 1),
    k_dot_te: Math.abs(dot(k, te)),
    k_dot_tm: Math.abs(dot(k, tm)),
    te_dot_tm: Math.abs(dot(te, tm)),
    right_handed:
      vectorNorm(cross(te, tm).map((value, index) => value - k[index])),
  };
  const maximumFrameError = Math.max(...Object.values(frameErrors));
  const framePass =
    maximumFrameError <= input.tolerances.frame_orthonormal_absolute;

  const statePhysicality = input.cells.map((cell) => {
    const coherency = stateCoherencyTeTm(cell.polarization_state);
    const stokes = stokesFromCoherency(coherency);
    const maximumHermitianError = hermitianError(coherency);
    const minimumEigenvalue = minimumHermitianEigenvalue(coherency);
    const expectedHelicity = cell.polarization_label === "RCP" ? 1 : -1;
    const helicityLabelError = Math.abs(
      stokes.normalized_helicity - expectedHelicity,
    );
    const stokesPhysical =
      stokes.s0 > input.tolerances.state_psd_absolute &&
      stokes.degree_of_polarization <=
        1 + input.tolerances.state_psd_absolute;
    const gate =
      maximumHermitianError <=
        input.tolerances.state_hermitian_absolute &&
      minimumEigenvalue >= -input.tolerances.state_psd_absolute &&
      stokesPhysical &&
      helicityLabelError <= input.tolerances.helicity_label_absolute;
    return {
      cell_id: cell.cell_id,
      state_kind: cell.polarization_state.kind,
      stokes,
      maximum_hermitian_error: maximumHermitianError,
      minimum_eigenvalue: minimumEigenvalue,
      helicity_label_error: helicityLabelError,
      gate: gate ? "pass" as const : "not_ready" as const,
    };
  });
  const statesPass = statePhysicality.every((row) => row.gate === "pass");

  const responseDiagnostics = input.responses.map((response) => {
    const teTm = responseTeTm(response);
    const circular = basisTransform(teTm, "te_tm", "circular_rcp_lcp");
    const reflectanceOperator = matrixMultiply(dagger(teTm), teTm);
    const maximumReflectanceEigenvalue =
      maximumHermitianEigenvalue(reflectanceOperator);
    const passivityPass =
      maximumReflectanceEigenvalue <=
        1 + input.tolerances.passivity_absolute;
    const noBoundaryError = response.boundary_kind === "no_boundary"
      ? Math.max(
        ...response.reflection_jones.flat().map((value) => magnitude(value)),
      )
      : null;
    const noBoundaryPass =
      noBoundaryError == null ||
      noBoundaryError <= input.tolerances.zero_limit_absolute;
    const achiralError =
      response.symmetry_class === "reciprocal_achiral"
        ? Math.max(
          magnitude(circular[0][1]),
          magnitude(circular[1][0]),
          magnitude({
            re: circular[0][0].re - circular[1][1].re,
            im: circular[0][0].im - circular[1][1].im,
          }),
        )
        : null;
    const achiralPass =
      achiralError == null ||
      (
        response.reciprocal_confirmed &&
        achiralError <= input.tolerances.symmetry_absolute
      );
    const gate =
      passivityPass &&
      noBoundaryPass &&
      achiralPass &&
      (
        response.symmetry_class === "no_boundary" ||
        response.reciprocal_confirmed
      );
    return {
      response_id: response.response_id,
      symmetry_class: response.symmetry_class,
      mirror_pair_id: response.mirror_pair_id,
      mirror_handedness: response.mirror_handedness,
      maximum_reflectance_eigenvalue: maximumReflectanceEigenvalue,
      passivity_gate: passivityPass ? "pass" as const : "not_ready" as const,
      achiral_helicity_exchange_error: achiralError,
      achiral_reciprocity_gate:
        achiralPass ? "pass" as const : "not_ready" as const,
      no_boundary_matrix_error: noBoundaryError,
      no_boundary_gate:
        noBoundaryPass ? "pass" as const : "not_ready" as const,
      gate: gate ? "pass" as const : "not_ready" as const,
    };
  });

  const mirrorPairIds = new Set(
    input.responses.flatMap((response) =>
      response.mirror_pair_id == null ? [] : [response.mirror_pair_id]
    ),
  );
  const helicitySwap: ComplexMatrix2Value = [
    [ZERO, { re: 1, im: 0 }],
    [{ re: 1, im: 0 }, ZERO],
  ];
  const mirrorReversal = [...mirrorPairIds].map((mirrorPairId) => {
    const plus = input.responses.find((response) =>
      response.mirror_pair_id === mirrorPairId &&
      response.mirror_handedness === 1
    );
    const minus = input.responses.find((response) =>
      response.mirror_pair_id === mirrorPairId &&
      response.mirror_handedness === -1
    );
    const error = plus == null || minus == null
      ? Number.POSITIVE_INFINITY
      : maximumMatrixDifference(
        basisTransform(
          responseTeTm(minus),
          "te_tm",
          "circular_rcp_lcp",
        ),
        matrixMultiply(
          matrixMultiply(
            helicitySwap,
            basisTransform(
              responseTeTm(plus),
              "te_tm",
              "circular_rcp_lcp",
            ),
          ),
          helicitySwap,
        ),
      );
    return {
      mirror_pair_id: mirrorPairId,
      plus_response_id: plus?.response_id ?? null,
      minus_response_id: minus?.response_id ?? null,
      maximum_matrix_error: error,
      gate:
        error <= input.tolerances.symmetry_absolute
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  const responsesPass =
    responseDiagnostics.every((row) => row.gate === "pass") &&
    mirrorReversal.length > 0 &&
    mirrorReversal.every((row) => row.gate === "pass");

  const cells = input.cells.map((cell) => {
    const response = responseById.get(cell.response_id)!;
    return predictCell(cell, response, input.forward_model);
  });
  const predictionById = new Map(cells.map((cell) => [cell.cell_id, cell]));

  const basisRows = input.cells.map((cell) => {
    const response = responseById.get(cell.response_id)!;
    const coherencyTeTm = stateCoherencyTeTm(cell.polarization_state);
    const reflectionTeTm = responseTeTm(response);
    const teTmMetrics = responseMetrics(
      coherencyTeTm,
      reflectionTeTm,
      response.boundary_kind,
    );
    const circularMetrics = responseMetrics(
      basisTransform(coherencyTeTm, "te_tm", "circular_rcp_lcp"),
      basisTransform(reflectionTeTm, "te_tm", "circular_rcp_lcp"),
      response.boundary_kind,
    );
    const errors = {
      reflected_fraction: relativeDifference(
        teTmMetrics.reflected_fraction,
        circularMetrics.reflected_fraction,
      ),
      absorption_fraction: relativeDifference(
        teTmMetrics.absorption_fraction,
        circularMetrics.absorption_fraction,
      ),
      overlap_real: relativeDifference(
        teTmMetrics.overlap.re,
        circularMetrics.overlap.re,
      ),
      overlap_imaginary: relativeDifference(
        teTmMetrics.overlap.im,
        circularMetrics.overlap.im,
      ),
    };
    const maximumRelativeError = Math.max(...Object.values(errors));
    return {
      cell_id: cell.cell_id,
      component_relative_errors: errors,
      maximum_relative_error: maximumRelativeError,
      gate:
        maximumRelativeError <= input.tolerances.basis_invariance_relative
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  const basisPass = basisRows.every((row) => row.gate === "pass");

  const matchedControls = input.matched_pairs.map((pair) => {
    const rcpCell = cellById.get(pair.rcp_cell_id)!;
    const lcpCell = cellById.get(pair.lcp_cell_id)!;
    const rcp = predictionById.get(pair.rcp_cell_id)!;
    const lcp = predictionById.get(pair.lcp_cell_id)!;
    const sameResponse = rcpCell.response_id === lcpCell.response_id;
    const gates = {
      power:
        relativeDifference(
          rcpCell.incident_power_W,
          lcpCell.incident_power_W,
        ) <= input.tolerances.matched_relative,
      absorption:
        relativeDifference(
          rcpCell.controls.reported_absorbed_power_W,
          lcpCell.controls.reported_absorbed_power_W,
        ) <= input.tolerances.matched_relative &&
        relativeDifference(
          rcp.absorbed_optical_power_W,
          lcp.absorbed_optical_power_W,
        ) <= input.tolerances.matched_relative,
      heating:
        relativeDifference(
          rcpCell.controls.reported_heating_rate_s,
          lcpCell.controls.reported_heating_rate_s,
        ) <= input.tolerances.matched_relative &&
        relativeDifference(rcp.heating_W, lcp.heating_W) <=
          input.tolerances.matched_relative,
      force:
        Math.abs(
          rcpCell.controls.reported_axial_force_N -
          lcpCell.controls.reported_axial_force_N,
        ) <= input.tolerances.matched_force_absolute_N &&
        Math.abs(rcp.axial_force_N - lcp.axial_force_N) <=
          input.tolerances.matched_force_absolute_N,
      torque_magnitude:
        Math.abs(
          rcpCell.controls.reported_axial_torque_magnitude_N_m -
          lcpCell.controls.reported_axial_torque_magnitude_N_m,
        ) <= input.tolerances.matched_torque_absolute_N_m &&
        Math.abs(
          Math.abs(rcp.axial_torque_N_m) -
          Math.abs(lcp.axial_torque_N_m),
        ) <= input.tolerances.matched_torque_absolute_N_m,
      trap:
        relativeDifference(
          rcpCell.controls.reported_trap_omega_rad_s,
          lcpCell.controls.reported_trap_omega_rad_s,
        ) <= input.tolerances.matched_relative &&
        relativeDifference(rcp.trap_shift_rad_s, lcp.trap_shift_rad_s) <=
          input.tolerances.matched_relative,
      branch_state:
        rcpCell.controls.branch_state_ref ===
          lcpCell.controls.branch_state_ref &&
        rcpCell.controls.branch_state_sha256 ===
          lcpCell.controls.branch_state_sha256,
      response: sameResponse,
    };
    return {
      pair_id: pair.pair_id,
      rcp_cell_id: pair.rcp_cell_id,
      lcp_cell_id: pair.lcp_cell_id,
      gates: Object.fromEntries(
        Object.entries(gates).map(([key, pass]) => [
          key,
          pass ? "pass" as const : "not_ready" as const,
        ]),
      ),
      gate:
        Object.values(gates).every(Boolean)
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  const matchedControlsPass = matchedControls.every(
    (row) => row.gate === "pass",
  );

  const doubleContrasts = input.double_contrasts.map((contrast) => {
    const plusRcp = predictionById.get(
      contrast.chiral_plus_rcp_cell_id,
    )!;
    const plusLcp = predictionById.get(
      contrast.chiral_plus_lcp_cell_id,
    )!;
    const minusRcp = predictionById.get(contrast.mirror_rcp_cell_id)!;
    const minusLcp = predictionById.get(contrast.mirror_lcp_cell_id)!;
    const contrastValue = (field: keyof Pick<
      CellPrediction,
      | "phase_rad"
      | "ramsey_chi"
      | "coherence_decay_rate_s"
      | "axial_force_N"
      | "heating_W"
    >) =>
      0.5 * (
        (plusRcp[field] - plusLcp[field]) -
        (minusRcp[field] - minusLcp[field])
      );
    const plusResponse = responseById.get(plusRcp.response_id)!;
    const minusResponse = responseById.get(minusRcp.response_id)!;
    const mirrorRegistered =
      plusResponse.mirror_pair_id != null &&
      plusResponse.mirror_pair_id === minusResponse.mirror_pair_id &&
      plusResponse.mirror_handedness === 1 &&
      minusResponse.mirror_handedness === -1;
    return {
      contrast_id: contrast.contrast_id,
      formula:
        "0.5*((chiral_plus_RCP-chiral_plus_LCP)-(mirror_RCP-mirror_LCP))" as const,
      phase_rad: contrastValue("phase_rad"),
      ramsey_chi: contrastValue("ramsey_chi"),
      coherence_decay_rate_s:
        contrastValue("coherence_decay_rate_s"),
      axial_force_N: contrastValue("axial_force_N"),
      heating_W: contrastValue("heating_W"),
      mirror_registration_gate:
        mirrorRegistered ? "pass" as const : "not_ready" as const,
    };
  });
  const doubleContrastPass = doubleContrasts.every(
    (row) => row.mirror_registration_gate === "pass",
  );

  const anchorCell = cellById.get(input.sensitivity.anchor_cell_id)!;
  const anchorResponse = responseById.get(anchorCell.response_id)!;
  const anchorBaseline = predictionById.get(anchorCell.cell_id)!;
  const fraction = input.sensitivity.fractional_perturbation;
  const sensitivityRuns = [
    {
      parameter: "green_projection" as const,
      prediction: predictCell(
        anchorCell,
        anchorResponse,
        input.forward_model,
        { green: 1 + fraction },
      ),
    },
    {
      parameter: "polarizability_projection" as const,
      prediction: predictCell(
        anchorCell,
        anchorResponse,
        input.forward_model,
        { alpha: 1 + fraction },
      ),
    },
    {
      parameter: "reflection_response" as const,
      prediction: predictCell(
        anchorCell,
        anchorResponse,
        input.forward_model,
        { response: 1 - fraction },
      ),
    },
  ].map((run) => {
    const change = predictionChange(anchorBaseline, run.prediction);
    return {
      parameter: run.parameter,
      perturbation_fraction: fraction,
      ...change,
      gate:
        change.maximum_fractional_change >=
          input.sensitivity.minimum_fractional_output_change &&
        change.changed_observable_count > 0
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  const sensitivityPass = sensitivityRuns.every((row) => row.gate === "pass");

  const limitFields = [
    "phase_rad",
    "ramsey_chi",
    "coherence_decay_rate_s",
    "axial_force_N",
    "heating_W",
    "axial_torque_N_m",
    "trap_shift_rad_s",
  ] as const;
  const limitRows = input.cells.flatMap((cell) => {
    const response = responseById.get(cell.response_id)!;
    const limitKind = response.boundary_kind === "no_boundary"
      ? "no_boundary" as const
      : cell.coupling_multiplier === 0
        ? "zero_coupling" as const
        : null;
    if (limitKind == null) return [];
    const prediction = predictionById.get(cell.cell_id)!;
    const maximumMagnitude = Math.max(
      ...limitFields.map((field) => Math.abs(prediction[field])),
    );
    return [{
      cell_id: cell.cell_id,
      limit_kind: limitKind,
      maximum_interaction_output_magnitude: maximumMagnitude,
      gate:
        maximumMagnitude <= input.tolerances.zero_limit_absolute
          ? "pass" as const
          : "not_ready" as const,
    }];
  });
  const limitsPass =
    limitRows.some((row) => row.limit_kind === "zero_coupling") &&
    limitRows.some((row) => row.limit_kind === "no_boundary") &&
    limitRows.every((row) => row.gate === "pass");

  const measuredReceipts = input.receipts.every(
    (receipt) => receipt.evidence_class === "measured",
  );
  const measuredReady =
    input.evidence_class === "measured" &&
    measuredReceipts &&
    receiptIntegrity &&
    sharedBinding &&
    receiptReferencesBound &&
    framePass &&
    statesPass &&
    responsesPass &&
    basisPass &&
    matchedControlsPass &&
    doubleContrastPass &&
    sensitivityPass &&
    limitsPass;

  return {
    schema_version: "casimir_dp_polarization_qed_control_result/1" as const,
    provenance: {
      receipt_integrity_gate:
        receiptIntegrity ? "pass" as const : "not_ready" as const,
      shared_model_binding_gate:
        sharedBinding ? "pass" as const : "not_ready" as const,
      receipt_reference_gate:
        receiptReferencesBound ? "pass" as const : "not_ready" as const,
      model_binding_sha256: input.model_binding_sha256,
      forward_model_formula_ref: input.forward_model.formula_ref,
    },
    polarization_convention: {
      ...input.polarization_convention,
      linear_to_circular_unitary: LINEAR_TO_CIRCULAR,
      frame_component_errors: frameErrors,
      maximum_frame_error: maximumFrameError,
      frame_gate: framePass ? "pass" as const : "not_ready" as const,
    },
    state_physicality: {
      rows: statePhysicality,
      gate: statesPass ? "pass" as const : "not_ready" as const,
    },
    response_diagnostics: {
      rows: responseDiagnostics,
      mirror_reversal: mirrorReversal,
      gate: responsesPass ? "pass" as const : "not_ready" as const,
    },
    basis_invariance: {
      rows: basisRows,
      maximum_relative_error: Math.max(
        ...basisRows.map((row) => row.maximum_relative_error),
      ),
      gate: basisPass ? "pass" as const : "not_ready" as const,
    },
    cells,
    matched_controls: {
      rows: matchedControls,
      gate:
        matchedControlsPass ? "pass" as const : "not_ready" as const,
    },
    double_contrasts: {
      rows: doubleContrasts,
      gate: doubleContrastPass ? "pass" as const : "not_ready" as const,
      interpretation:
        "Mirror-odd polarization double contrasts are ordinary-QED controls; nonzero values do not identify collapse or manifold dynamics." as const,
    },
    sensitivity: {
      anchor_cell_id: anchorCell.cell_id,
      rows: sensitivityRuns,
      gate: sensitivityPass ? "pass" as const : "not_ready" as const,
    },
    limits: {
      rows: limitRows,
      gate: limitsPass ? "pass" as const : "not_ready" as const,
    },
    readiness: {
      measured_polarization_qed_lane:
        measuredReady
          ? "ready_for_scientific_comparison" as const
          : "not_ready" as const,
      evidence_class: input.evidence_class,
      maximum_claim: measuredReady
        ? "polarization_resolved_qed_control" as const
        : input.evidence_class === "synthetic_fixture"
          ? "synthetic_pipeline_validation" as const
          : "diagnostic_reduced_order_prediction" as const,
    },
    promotion_allowed:
      input.evidence_class !== "synthetic_fixture" && measuredReady,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    claim_boundaries: [
      "TE/TM and circular polarization are unitary bases of the same two-dimensional transverse field space; a basis change is not a new interaction.",
      "The normalized transfer coefficients are exploratory reduced-order controls and are not a first-principles finite-geometry Green-tensor solution.",
      "Circular-polarization, force, heating, torque, and trap controls can reject ordinary electromagnetic confounds but cannot identify objective collapse.",
      "Synthetic mirror reversal and sensitivity recovery validate software behavior only and cannot promote measured evidence.",
      "No polarization observable is connected to a DP or manifold kernel in this runtime.",
    ],
  };
}
