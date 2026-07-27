// math-stage: reduced-order
import { createHash } from "node:crypto";
import { z } from "zod";
import { C2, G, HBAR } from "./physics-const";

const C4 = C2 * C2;
const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();
const PositiveFinite = z.number().finite().positive();
const NonnegativeFinite = z.number().finite().nonnegative();
const EvidenceClass = z.enum([
  "synthetic",
  "measured",
  "design_assumption",
  "source_backed_calculation",
]);

export const CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS = [
  "field_interaction_energy",
  "plates_and_coatings",
  "supports_and_stresses",
  "actuators_and_modulation_work",
  "electrostatic_and_patch",
  "elastic_strain",
  "thermal_state_and_heat_flow",
  "trapped_probe_state",
  "control_electronics_nearby",
  "boundary_and_surface_terms",
] as const;

const ComponentCategory = z.enum(CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS);

const LedgerComponent = z.object({
  component_id: z.string().min(1),
  category: ComponentCategory,
  signed_energy_J: Finite,
  source_ref: z.string().min(1),
  provenance_sha256: Sha256,
  internal_transfer_id: z.string().min(1).nullable(),
}).strict();

function covarianceIsSymmetric(
  covariance: number[][],
  relativeTolerance = 1e-12,
): boolean {
  let scale = 0;
  for (const row of covariance) {
    for (const value of row) scale = Math.max(scale, Math.abs(value));
  }
  for (let row = 0; row < covariance.length; row += 1) {
    for (let column = row + 1; column < covariance.length; column += 1) {
      if (
        Math.abs(covariance[row][column] - covariance[column][row]) >
        relativeTolerance * scale
      ) {
        return false;
      }
    }
  }
  return true;
}

function covarianceIsPositiveSemidefinite(covariance: number[][]): boolean {
  const size = covariance.length;
  const lower = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0)
  );
  const diagonal = new Array<number>(size).fill(0);
  const scale = Math.max(
    ...covariance.map((row) => Math.max(...row.map((value) => Math.abs(value)))),
  );
  const tolerance = scale * 1e-12;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < row; column += 1) {
      let residual = covariance[row][column];
      for (let index = 0; index < column; index += 1) {
        residual -=
          lower[row][index] * diagonal[index] * lower[column][index];
      }
      if (Math.abs(diagonal[column]) <= tolerance) {
        if (Math.abs(residual) > tolerance) return false;
        lower[row][column] = 0;
      } else {
        lower[row][column] = residual / diagonal[column];
      }
    }
    let pivot = covariance[row][row];
    for (let index = 0; index < row; index += 1) {
      pivot -= lower[row][index] ** 2 * diagonal[index];
    }
    if (pivot < -tolerance) return false;
    diagonal[row] = Math.max(0, pivot);
    lower[row][row] = 1;
  }
  return true;
}

const ApparatusState = z.object({
  state_id: z.string().min(1),
  components: z.array(LedgerComponent).min(1),
  covariance_J2: z.array(z.array(Finite).min(1)).min(1),
  covariance_receipt_sha256: Sha256,
  conservation: z.object({
    closed_apparatus: z.literal(true),
    signed_energy_balance_residual_J: Finite,
    tolerance_J: PositiveFinite,
    receipt_sha256: Sha256,
  }).strict(),
  geometry_receipt_sha256: Sha256,
}).strict().superRefine((state, context) => {
  const ids = state.components.map((component) => component.component_id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["components"],
      message: "component ids must be unique within an apparatus state",
    });
  }
  if (
    state.covariance_J2.length !== state.components.length ||
    state.covariance_J2.some(
      (row) => row.length !== state.components.length,
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["covariance_J2"],
      message: "covariance_J2 must be square in component order",
    });
    return;
  }
  if (!covarianceIsSymmetric(state.covariance_J2)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["covariance_J2"],
      message: "covariance_J2 must be symmetric",
    });
  }
  if (!covarianceIsPositiveSemidefinite(state.covariance_J2)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["covariance_J2"],
      message: "covariance_J2 must be positive semidefinite",
    });
  }
});

const TensorSource = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("absent"),
    missing_fields: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    status: z.literal("provided"),
    complete_delta_T_munu: z.boolean(),
    delta_T_munu_receipt_sha256: Sha256,
    solver_receipt_sha256: Sha256,
    covered_component_categories: z.array(ComponentCategory).min(1),
    basis_frame: z.string().min(1),
    coordinate_gauge: z.string().min(1),
    boundary_and_surface_terms_included: z.boolean(),
    conservation_residual: NonnegativeFinite,
    conservation_tolerance: PositiveFinite,
    weak_field_solution: z.object({
      potential_at_probe_branch_a_m2_s2: Finite,
      potential_at_probe_branch_b_m2_s2: Finite,
      approximation: z.string().min(1),
    }).strict(),
  }).strict(),
]);

export const CasimirDpGravityUpperBoundInput = z.object({
  schema_version: z.literal("casimir_dp_gravity_upper_bound/1"),
  evidence_class: EvidenceClass,
  contrast: z.object({
    state_a_id: z.string().min(1),
    state_b_id: z.string().min(1),
    convention: z.literal("state_a_minus_state_b"),
  }).strict(),
  states: z.array(ApparatusState).length(2),
  contrast_covariance_model: z.literal("independent_state_ledgers"),
  local_gravitational_acceleration_m_s2: PositiveFinite,
  upper_bound_sigma: PositiveFinite,
  far_field_detector_distance_m: PositiveFinite,
  probe: z.object({
    mass_kg: PositiveFinite,
    coherent_hold_time_s: PositiveFinite,
    detector_phase_sensitivity_rad: PositiveFinite,
  }).strict(),
  tensor_source: TensorSource,
}).strict().superRefine((input, context) => {
  const stateIds = input.states.map((state) => state.state_id);
  if (new Set(stateIds).size !== stateIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["states"],
      message: "apparatus state ids must be unique",
    });
  }
  for (const contrastId of [
    input.contrast.state_a_id,
    input.contrast.state_b_id,
  ]) {
    if (!stateIds.includes(contrastId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contrast"],
        message: `contrast state ${contrastId} is missing`,
      });
    }
  }
});

export type CasimirDpGravityUpperBoundInput = z.infer<
  typeof CasimirDpGravityUpperBoundInput
>;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") {
    return Object.is(value, -0) ? 0 : value;
  }
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  );
};

export function sha256CasimirDpGravityLedger(
  input: CasimirDpGravityUpperBoundInput,
): string {
  const parsed = CasimirDpGravityUpperBoundInput.parse(input);
  return createHash("sha256")
    .update(
      JSON.stringify(canonicalize({
        contrast: parsed.contrast,
        states: parsed.states,
        contrast_covariance_model: parsed.contrast_covariance_model,
      })),
      "utf8",
    )
    .digest("hex");
}

function sumCovariance(covariance: number[][]): number {
  let sum = 0;
  for (const row of covariance) {
    for (const value of row) sum += value;
  }
  return Math.max(0, sum);
}

function requiredCategoryCoverage(
  state: z.infer<typeof ApparatusState>,
): {
  missing: string[];
  present: string[];
} {
  const present = new Set(
    state.components.map((component) => component.category),
  );
  return {
    missing: CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS.filter(
      (category) => !present.has(category),
    ),
    present: [...present].sort(),
  };
}

function internalTransferAudit(state: z.infer<typeof ApparatusState>) {
  const groups = new Map<string, number>();
  for (const component of state.components) {
    if (component.internal_transfer_id == null) continue;
    groups.set(
      component.internal_transfer_id,
      (groups.get(component.internal_transfer_id) ?? 0) +
        component.signed_energy_J,
    );
  }
  const rows = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([transferId, signedNet]) => ({
      internal_transfer_id: transferId,
      signed_net_J: signedNet,
      gate:
        Math.abs(signedNet) <= state.conservation.tolerance_J
          ? "pass" as const
          : "not_ready" as const,
    }));
  return {
    rows,
    gate: rows.every((row) => row.gate === "pass")
      ? "pass" as const
      : "not_ready" as const,
  };
}

export function evaluateCasimirDpGravityUpperBound(
  rawInput: CasimirDpGravityUpperBoundInput,
) {
  const input = CasimirDpGravityUpperBoundInput.parse(rawInput);
  const stateResults = input.states.map((state) => {
    const coverage = requiredCategoryCoverage(state);
    const internalTransfers = internalTransferAudit(state);
    const signedEnergy = state.components.reduce(
      (sum, component) => sum + component.signed_energy_J,
      0,
    );
    const variance = sumCovariance(state.covariance_J2);
    const conservationPass =
      Math.abs(state.conservation.signed_energy_balance_residual_J) <=
        state.conservation.tolerance_J;
    const gate =
      coverage.missing.length === 0 &&
        internalTransfers.gate === "pass" &&
        conservationPass
        ? "pass" as const
        : "not_ready" as const;
    return {
      state_id: state.state_id,
      components: state.components,
      signed_total_energy_J: signedEnergy,
      total_energy_standard_uncertainty_J: Math.sqrt(variance),
      component_coverage: coverage,
      internal_transfer_audit: internalTransfers,
      conservation: {
        ...state.conservation,
        gate: conservationPass ? "pass" as const : "not_ready" as const,
      },
      covariance_receipt_sha256: state.covariance_receipt_sha256,
      geometry_receipt_sha256: state.geometry_receipt_sha256,
      gate,
    };
  });
  const stateA = stateResults.find(
    (state) => state.state_id === input.contrast.state_a_id,
  )!;
  const stateB = stateResults.find(
    (state) => state.state_id === input.contrast.state_b_id,
  )!;
  const ledgerPass = stateResults.every((state) => state.gate === "pass");
  const deltaEnergy = stateA.signed_total_energy_J -
    stateB.signed_total_energy_J;
  const deltaVariance =
    stateA.total_energy_standard_uncertainty_J ** 2 +
    stateB.total_energy_standard_uncertainty_J ** 2;
  const deltaStandardUncertainty = Math.sqrt(deltaVariance);
  const energyMagnitudeUpperBound =
    Math.abs(deltaEnergy) +
    input.upper_bound_sigma * deltaStandardUncertainty;
  const deltaMass = deltaEnergy / C2;
  const massMagnitudeUpperBound = energyMagnitudeUpperBound / C2;
  const deltaWeight =
    input.local_gravitational_acceleration_m_s2 * deltaMass;
  const weightMagnitudeUpperBound =
    input.local_gravitational_acceleration_m_s2 * massMagnitudeUpperBound;
  const farFieldSignedH00 =
    2 * G * deltaEnergy /
    (input.far_field_detector_distance_m * C4);
  const farFieldH00MagnitudeUpperBound =
    2 * G * energyMagnitudeUpperBound /
    (input.far_field_detector_distance_m * C4);

  const tensorFailures: string[] = [];
  if (!ledgerPass) tensorFailures.push("complete_scalar_ledger");
  if (input.tensor_source.status === "absent") {
    tensorFailures.push(...input.tensor_source.missing_fields);
  } else {
    if (!input.tensor_source.complete_delta_T_munu) {
      tensorFailures.push("complete_delta_T_munu");
    }
    const tensorCoverage = new Set(
      input.tensor_source.covered_component_categories,
    );
    for (const category of CASIMIR_DP_GRAVITY_REQUIRED_COMPONENTS) {
      if (!tensorCoverage.has(category)) {
        tensorFailures.push(`tensor_component:${category}`);
      }
    }
    if (!input.tensor_source.boundary_and_surface_terms_included) {
      tensorFailures.push("tensor_boundary_and_surface_terms");
    }
    if (
      input.tensor_source.conservation_residual >
      input.tensor_source.conservation_tolerance
    ) {
      tensorFailures.push("tensor_conservation");
    }
  }
  const uniqueTensorFailures = [...new Set(tensorFailures)];
  const tensorGate = uniqueTensorFailures.length === 0
    ? "pass" as const
    : "blocked" as const;
  const potentialDifference =
    input.tensor_source.status === "provided" && tensorGate === "pass"
      ? input.tensor_source.weak_field_solution
          .potential_at_probe_branch_a_m2_s2 -
        input.tensor_source.weak_field_solution
          .potential_at_probe_branch_b_m2_s2
      : null;
  const ordinaryPhase =
    potentialDifference == null
      ? null
      : -input.probe.mass_kg * potentialDifference *
        input.probe.coherent_hold_time_s / HBAR;
  const synthetic = input.evidence_class === "synthetic";
  const ledgerHash = sha256CasimirDpGravityLedger(input);

  return {
    schema_version: "casimir_dp_gravity_upper_bound_result/1" as const,
    status: ledgerPass ? "diagnostic" as const : "not_ready" as const,
    evidence_class: input.evidence_class,
    maximum_claim:
      ledgerPass
        ? tensorGate === "pass"
          ? "tensor_diagnostic" as const
          : "scalar_upper_bound" as const
        : "incomplete_ledger_no_upper_bound" as const,
    ledger_sha256: ledgerHash,
    signed_component_ledger: {
      states: stateResults,
      contrast: input.contrast,
      contrast_covariance_model: input.contrast_covariance_model,
      gate: ledgerPass ? "pass" as const : "not_ready" as const,
    },
    scalar_upper_bound: {
      status: ledgerPass ? "pass" as const : "not_ready" as const,
      signed_Delta_E_app_J: deltaEnergy,
      magnitude_Delta_E_app_J: Math.abs(deltaEnergy),
      standard_uncertainty_J: deltaStandardUncertainty,
      upper_bound_sigma: input.upper_bound_sigma,
      magnitude_upper_bound_J: energyMagnitudeUpperBound,
      signed_Delta_m_app_kg: deltaMass,
      magnitude_Delta_m_app_kg: Math.abs(deltaMass),
      mass_magnitude_upper_bound_kg: massMagnitudeUpperBound,
      signed_Delta_F_weight_N: deltaWeight,
      magnitude_Delta_F_weight_N: Math.abs(deltaWeight),
      weight_magnitude_upper_bound_N: weightMagnitudeUpperBound,
      local_gravitational_acceleration_m_s2:
        input.local_gravitational_acceleration_m_s2,
      source_quantity: "complete_apparatus_state_energy_contrast" as const,
      pressure_or_plate_force_used_as_weight: false as const,
      nhm2_amplification_used: false as const,
    },
    far_field_sensitivity_triage: {
      status: ledgerPass ? "diagnostic" as const : "not_ready" as const,
      detector_distance_m: input.far_field_detector_distance_m,
      signed_Delta_h00: farFieldSignedH00,
      magnitude_upper_bound_Delta_h00: farFieldH00MagnitudeUpperBound,
      approximation:
        "|Delta h00|~2G|Delta E_app|/(r*c^4), scalar far-field weak-field sensitivity triage only" as const,
      measured_curvature_result: false as const,
    },
    tensor_source_gate: {
      status: tensorGate,
      first_failure: uniqueTensorFailures[0] ?? null,
      missing_or_invalid_fields: uniqueTensorFailures,
      complete_conserved_tensor_admitted: tensorGate === "pass",
      interaction_only_scalar_satisfies_tensor_gate: false as const,
    },
    ordinary_gravitational_phase: {
      status: tensorGate === "pass" ? "diagnostic" as const : "blocked" as const,
      potential_difference_A_minus_B_m2_s2: potentialDifference,
      phase_rad: ordinaryPhase,
      detector_sensitivity_ratio:
        ordinaryPhase == null
          ? null
          : Math.abs(ordinaryPhase) /
            input.probe.detector_phase_sensitivity_rad,
      phase_role:
        "boundary_state_complete_apparatus_potential_contrast" as const,
      ambient_earth_tilt_phase_included: false as const,
      unitary_phase_not_collapse_rate: true as const,
      solver_receipt_sha256:
        input.tensor_source.status === "provided"
          ? input.tensor_source.solver_receipt_sha256
          : null,
    },
    measured_gravitational_response: {
      status: "not_ready" as const,
      reason:
        synthetic
          ? "Synthetic ledger validates bookkeeping only."
          : "No independent measured weight, metric, or multi-probe response was supplied.",
    },
    claim_boundaries: [
      "Casimir pressure and internal plate force are not substituted for Delta E_app/c^2.",
      "The scalar far-field estimate is not a measured curvature result.",
      "A complete conserved tensor source is required before admitting an ordinary gravitational phase.",
      "The ordinary boundary-state gravitational phase is distinct from the ambient Earth-gravity tilt control.",
      "No NHM2 amplification factor is imported.",
      "This runtime does not identify objective collapse or manifold dynamics.",
    ],
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
  };
}
