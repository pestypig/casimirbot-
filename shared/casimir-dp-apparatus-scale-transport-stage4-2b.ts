// math-stage: diagnostic
import { z } from "zod";
import { C, G, HBAR } from "./physics-const";

export const CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_INPUT_VERSION =
  "casimir_dp_apparatus_scale_transport_stage4_2b_input/1" as const;

export const CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_RESULT_VERSION =
  "casimir_dp_apparatus_scale_transport_stage4_2b_result/1" as const;

export const CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_FAILURE_ORDER = [
  "STA_FORBIDDEN_BULK_MASS_RECONSTRUCTION",
  "STA_AUTHORITY_INTEGRITY_INVALID",
  "STA_RECEIPT_INTEGRITY_INVALID",
  "STA_DENSITY_PROVENANCE_INVALID",
  "STA_PREPARATION_FIDELITY_INVALID",
  "STA_COMPOSITION_LEDGER_INVALID",
  "STA_MASS_CONSERVATION_FAILED",
  "STA_BRANCH_SWAP_SYMMETRY_FAILED",
  "STA_HIDDEN_OBJECT_MUTATION",
  "STA_CONDITIONAL_BOUNDARY_IDENTITY_FAILED",
  "STA_NUMERICAL_NULL_RECOVERY_FAILED",
  "STA_SENSITIVITY_MISMATCH_BUDGET_EXCEEDED",
  "STA_UNIT_ROUNDTRIP_FAILED",
  "STA_PROVENANCE_ANCESTRY_INVALID",
] as const;

export type CasimirDpApparatusScaleTransportStage4_2BFailureCode =
  typeof CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_FAILURE_ORDER[number];

const SHA256 = /^[a-f0-9]{64}$/;
const NonEmpty = z.string().min(1);
const Finite = z.number().finite();
const PositiveFinite = Finite.positive();
const NonnegativeFinite = Finite.nonnegative();
const Vector3 = z.tuple([Finite, Finite, Finite]);

const HashedReceipt = z.object({
  receipt_id: NonEmpty,
  artifact_path: NonEmpty,
  provenance_class: z.enum(["measured", "design_class", "simulated"]),
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
}).strict();

const CompositionComponent = z.object({
  component_id: NonEmpty,
  material_id: NonEmpty,
  mass_fraction: NonnegativeFinite,
  mass_fraction_standard_uncertainty: NonnegativeFinite,
  accounting_role: z.enum([
    "measured_bulk_component",
    "chemical_or_isotopic_constraint",
    "coating_or_inclusion",
    "electron_rest_mass_only",
    "selected_qcd_term_only",
  ]),
}).strict();

const PreparationFidelity = z.object({
  preparation_class: z.enum(["assumed_design", "simulated", "measured"]),
  fidelity: z.number().min(0).max(1),
  standard_uncertainty: NonnegativeFinite,
  receipt: HashedReceipt,
}).strict();

const DensityCell = z.object({
  cell_id: NonEmpty,
  center_m: Vector3,
  volume_m3: PositiveFinite,
  branch_a_density_kg_m3: NonnegativeFinite,
  branch_b_density_kg_m3: NonnegativeFinite,
}).strict();

const BoundaryState = z.object({
  boundary_state_id: NonEmpty,
  boundary_condition: z.enum([
    "boundary_on",
    "boundary_off",
    "dummy_boundary",
    "detuned_boundary",
  ]),
  surface_distance_m: PositiveFinite,
  orientation_unit_vector: Vector3,
  hold_time_s: NonnegativeFinite,
  density_provenance: z.enum([
    "measured",
    "design_class",
    "simulated_only",
    "unregistered",
  ]),
  density_receipt: HashedReceipt,
  wavepacket_receipt: HashedReceipt,
  trajectory_receipt: HashedReceipt,
  preparation_fidelity: PreparationFidelity,
  mobile_object_mass_a_kg: PositiveFinite,
  mobile_object_mass_b_kg: PositiveFinite,
  mobile_object_material_id: NonEmpty,
  expected_joint_branch_mass_kg: PositiveFinite,
  density_cells: z.array(DensityCell).min(2),
  branch_swap_probe: z.object({
    branch_a_density_kg_m3: z.array(NonnegativeFinite).min(2),
    branch_b_density_kg_m3: z.array(NonnegativeFinite).min(2),
  }).strict(),
  dp_binding: z.object({
    mass_density_convention: NonEmpty,
    smearing_kernel_id: NonEmpty,
    smearing_kernel_sha256: z.string().regex(SHA256),
    trajectory_sha256: z.string().regex(SHA256),
    model_parameters_sha256: z.string().regex(SHA256),
  }).strict(),
}).strict().superRefine((state, context) => {
  const cellIds = state.density_cells.map((cell) => cell.cell_id);
  if (new Set(cellIds).size !== cellIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["density_cells"],
      message: "Density-cell ids must be unique within a boundary state.",
    });
  }
  const expectedLength = state.density_cells.length;
  if (
    state.branch_swap_probe.branch_a_density_kg_m3.length !== expectedLength ||
    state.branch_swap_probe.branch_b_density_kg_m3.length !== expectedLength
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["branch_swap_probe"],
      message: "Branch-swap probe arrays must match the density-cell count.",
    });
  }
});

const AuthorityBinding = z.object({
  authority_id: z.enum(["stage4_1", "stage4_2a"]),
  artifact_path: NonEmpty,
  expected_sha256: z.string().regex(SHA256),
  actual_sha256: z.string().regex(SHA256),
  integrity_verified: z.boolean(),
}).strict();

const CovarianceAncestry = z.object({
  ancestry_id: NonEmpty,
  quantity_ids: z.array(NonEmpty).min(2),
  relationship: z.enum(["shared_ancestor", "independent"]),
  treatment: z.enum([
    "full_cross_covariance",
    "not_claimed_independent",
    "treated_as_independent",
  ]),
}).strict();

export const CasimirDpApparatusScaleTransportStage4_2BInput = z.object({
  schema_version: z.literal(
    CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_INPUT_VERSION,
  ),
  campaign_id: z.literal(
    "casimir-dp-apparatus-scale-transport-stage4-2b-v1",
  ),
  evidence_class: z.enum([
    "synthetic_fixture",
    "design_forecast",
    "measured_calibration",
  ]),
  claim_ceiling: z.literal(
    "composition_aware_branch_density_parameter_transport_only",
  ),
  promotion_allowed: z.literal(false),
  authority_bindings: z.array(AuthorityBinding).length(2),
  object: z.object({
    object_id: NonEmpty,
    material_id: NonEmpty,
    total_mass_kg: PositiveFinite,
    total_mass_standard_uncertainty_kg: NonnegativeFinite,
    mass_accounting_basis: z.enum([
      "measured_total_mass",
      "design_class_bulk_density_geometry",
      "electron_rest_mass_reconstruction",
      "selected_qcd_term_reconstruction",
    ]),
    density_provenance: z.enum([
      "measured",
      "design_class",
      "simulated_only",
      "unregistered",
    ]),
    mass_receipt: HashedReceipt,
    composition_receipt: HashedReceipt,
    geometry_receipt: HashedReceipt,
    characteristic_radius_m: PositiveFinite,
    shape: z.enum(["sphere", "ellipsoid", "finite_mesh"]),
    porosity_fraction: z.number().min(0).max(1),
    coating_thickness_m: NonnegativeFinite,
    composition: z.array(CompositionComponent).min(1),
  }).strict(),
  scales: z.object({
    branch_separation_m: NonnegativeFinite,
    smearing_length_m: PositiveFinite,
    hold_time_s: NonnegativeFinite,
  }).strict(),
  boundary_states: z.array(BoundaryState).min(2),
  registered_boundary_pair: z.object({
    reference_state_id: NonEmpty,
    comparison_state_id: NonEmpty,
    complete_joint_system_equivalence_required: z.boolean(),
  }).strict(),
  sensitivity_budget: z.object({
    dp_chi_per_l1_mismatch_kg: NonnegativeFinite,
    ordinary_chi_per_l1_mismatch_kg: NonnegativeFinite,
    convergence_l1_mass_error_kg: NonnegativeFinite,
    systematic_fraction: z.number().min(0).max(1),
    target_standard_uncertainty: PositiveFinite,
  }).strict(),
  covariance_ancestry: z.array(CovarianceAncestry),
  unit_registry: z.object({
    c_m_s: PositiveFinite,
    hbar_J_s: PositiveFinite,
    gravitational_constant_m3_kg_s2: PositiveFinite,
    kilogram_per_dalton: PositiveFinite,
    meter_per_nanometer: PositiveFinite,
  }).strict(),
  tolerances: z.object({
    mass_absolute_kg: NonnegativeFinite,
    mass_relative: NonnegativeFinite,
    composition_absolute: NonnegativeFinite,
    branch_swap_absolute_kg: NonnegativeFinite,
    density_identity_absolute_kg: NonnegativeFinite,
    density_identity_relative: NonnegativeFinite,
    unit_relative: NonnegativeFinite,
  }).strict(),
}).strict().superRefine((input, context) => {
  const authorityIds = input.authority_bindings.map(
    (binding) => binding.authority_id,
  );
  if (
    new Set(authorityIds).size !== 2 ||
    !authorityIds.includes("stage4_1") ||
    !authorityIds.includes("stage4_2a")
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["authority_bindings"],
      message: "Exactly one Stage-4.1 and one Stage-4.2A authority are required.",
    });
  }
  const boundaryIds = input.boundary_states.map(
    (state) => state.boundary_state_id,
  );
  if (new Set(boundaryIds).size !== boundaryIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["boundary_states"],
      message: "Boundary-state ids must be unique.",
    });
  }
  const pair = input.registered_boundary_pair;
  if (
    pair.reference_state_id === pair.comparison_state_id ||
    !boundaryIds.includes(pair.reference_state_id) ||
    !boundaryIds.includes(pair.comparison_state_id)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["registered_boundary_pair"],
      message: "The registered pair must name two different supplied states.",
    });
  }
});

export type CasimirDpApparatusScaleTransportStage4_2BInput = z.infer<
  typeof CasimirDpApparatusScaleTransportStage4_2BInput
>;

type Failure = {
  code: CasimirDpApparatusScaleTransportStage4_2BFailureCode;
  path: string;
  message: string;
};

type BoundaryStateValue = z.infer<typeof BoundaryState>;
type HashedReceiptValue = z.infer<typeof HashedReceipt>;

function addFailure(
  failures: Failure[],
  condition: boolean,
  code: CasimirDpApparatusScaleTransportStage4_2BFailureCode,
  path: string,
  message: string,
): void {
  if (condition) failures.push({ code, path, message });
}

function sortFailures(failures: Failure[]): Failure[] {
  const order = new Map(
    CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_FAILURE_ORDER.map(
      (code, index) => [code, index],
    ),
  );
  return [...failures].sort((left, right) => {
    const orderDifference =
      (order.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.code) ?? Number.MAX_SAFE_INTEGER);
    return orderDifference === 0
      ? left.path.localeCompare(right.path)
      : orderDifference;
  });
}

function receiptPass(receipt: HashedReceiptValue): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function closeAbsoluteRelative(
  left: number,
  right: number,
  absoluteTolerance: number,
  relativeTolerance: number,
): boolean {
  return Math.abs(left - right) <=
    absoluteTolerance +
      relativeTolerance * Math.max(Math.abs(left), Math.abs(right));
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function integratedMass(
  state: BoundaryStateValue,
  branch: "a" | "b",
): number {
  return state.density_cells.reduce(
    (sum, cell) =>
      sum +
      (
        branch === "a"
          ? cell.branch_a_density_kg_m3
          : cell.branch_b_density_kg_m3
      ) * cell.volume_m3,
    0,
  );
}

function deltaCellMasses(state: BoundaryStateValue): number[] {
  return state.density_cells.map(
    (cell) =>
      (
        cell.branch_a_density_kg_m3 -
        cell.branch_b_density_kg_m3
      ) * cell.volume_m3,
  );
}

function cellsHaveSameGeometry(
  left: BoundaryStateValue,
  right: BoundaryStateValue,
): boolean {
  return left.density_cells.length === right.density_cells.length &&
    left.density_cells.every((cell, index) => {
      const counterpart = right.density_cells[index];
      return counterpart !== undefined &&
        counterpart.cell_id === cell.cell_id &&
        counterpart.volume_m3 === cell.volume_m3 &&
        counterpart.center_m.every(
          (coordinate, coordinateIndex) =>
            coordinate === counterpart.center_m[coordinateIndex],
        );
    });
}

function bindingEqual(
  left: BoundaryStateValue,
  right: BoundaryStateValue,
): boolean {
  return left.dp_binding.mass_density_convention ===
      right.dp_binding.mass_density_convention &&
    left.dp_binding.smearing_kernel_id ===
      right.dp_binding.smearing_kernel_id &&
    left.dp_binding.smearing_kernel_sha256 ===
      right.dp_binding.smearing_kernel_sha256 &&
    left.dp_binding.trajectory_sha256 ===
      right.dp_binding.trajectory_sha256 &&
    left.dp_binding.model_parameters_sha256 ===
      right.dp_binding.model_parameters_sha256;
}

/**
 * Validates the composition-aware mass and branch-density inputs that may be
 * transported into a named DP calculation. This runtime intentionally stops
 * before evaluating E_G: shared constants and scale identities are parameter
 * transport, not evidence for collapse or a Casimir-to-DP bridge.
 */
export function evaluateCasimirDpApparatusScaleTransportStage4_2B(
  rawInput: unknown,
) {
  const input = CasimirDpApparatusScaleTransportStage4_2BInput.parse(
    rawInput,
  );
  const failures: Failure[] = [];
  const object = input.object;
  const tolerances = input.tolerances;

  const forbiddenMassReconstruction =
    object.mass_accounting_basis ===
      "electron_rest_mass_reconstruction" ||
    object.mass_accounting_basis ===
      "selected_qcd_term_reconstruction" ||
    object.composition.some(
      (component) =>
        component.accounting_role === "electron_rest_mass_only" ||
        component.accounting_role === "selected_qcd_term_only",
    );
  addFailure(
    failures,
    forbiddenMassReconstruction,
    "STA_FORBIDDEN_BULK_MASS_RECONSTRUCTION",
    "object.mass_accounting_basis",
    "Bulk object mass must come from measured total mass or a registered design-class density/geometry model, never an electron-only or selected-QCD-term reconstruction.",
  );

  const authorityPass = input.authority_bindings.every(
    (binding) =>
      binding.integrity_verified &&
      binding.expected_sha256 === binding.actual_sha256,
  );
  addFailure(
    failures,
    !authorityPass,
    "STA_AUTHORITY_INTEGRITY_INVALID",
    "authority_bindings",
    "Stage-4.1 and Stage-4.2A authority bindings must reproduce their complete SHA-256 identities.",
  );

  const receipts = [
    object.mass_receipt,
    object.composition_receipt,
    object.geometry_receipt,
    ...input.boundary_states.flatMap((state) => [
      state.density_receipt,
      state.wavepacket_receipt,
      state.trajectory_receipt,
      state.preparation_fidelity.receipt,
    ]),
  ];
  addFailure(
    failures,
    receipts.some((receipt) => !receiptPass(receipt)),
    "STA_RECEIPT_INTEGRITY_INVALID",
    "receipts",
    "Every mass, composition, geometry, density, wavepacket, trajectory, and preparation receipt must pass content-integrity verification.",
  );

  const densityProvenancePass =
    ["measured", "design_class"].includes(object.density_provenance) &&
    input.boundary_states.every((state) =>
      ["measured", "design_class"].includes(state.density_provenance) &&
      state.density_receipt.provenance_class === state.density_provenance
    );
  addFailure(
    failures,
    !densityProvenancePass,
    "STA_DENSITY_PROVENANCE_INVALID",
    "boundary_states.density_provenance",
    "Branch density must be measured or explicitly design-class; an unregistered or simulation-only density is not an admissible DP input.",
  );

  const preparationRows = input.boundary_states.map((state) => {
    const preparation = state.preparation_fidelity;
    const expectedReceiptClass =
      preparation.preparation_class === "assumed_design"
        ? "design_class"
        : preparation.preparation_class;
    const classPass =
      preparation.receipt.provenance_class === expectedReceiptClass;
    const uncertaintyPass =
      preparation.standard_uncertainty <= 1 &&
      preparation.fidelity + preparation.standard_uncertainty <=
        1 + Number.EPSILON * 8;
    return {
      boundary_state_id: state.boundary_state_id,
      preparation_class: preparation.preparation_class,
      fidelity: preparation.fidelity,
      standard_uncertainty: preparation.standard_uncertainty,
      receipt_provenance_class:
        preparation.receipt.provenance_class,
      gate:
        classPass && uncertaintyPass
          ? "pass" as const
          : "not_ready" as const,
    };
  });
  addFailure(
    failures,
    preparationRows.some((row) => row.gate !== "pass"),
    "STA_PREPARATION_FIDELITY_INVALID",
    "boundary_states.preparation_fidelity",
    "Assumed, simulated, and measured preparation fidelity must remain typed and agree with receipt provenance.",
  );

  const componentIds = object.composition.map(
    (component) => component.component_id,
  );
  const massFractionSum = object.composition.reduce(
    (sum, component) => sum + component.mass_fraction,
    0,
  );
  const compositionPass =
    new Set(componentIds).size === componentIds.length &&
    Math.abs(massFractionSum - 1) <=
      tolerances.composition_absolute;
  addFailure(
    failures,
    !compositionPass,
    "STA_COMPOSITION_LEDGER_INVALID",
    "object.composition",
    "Composition component ids must be unique and their mass fractions must close to unity.",
  );

  const stateRows = input.boundary_states.map((state) => {
    const integratedMassA = integratedMass(state, "a");
    const integratedMassB = integratedMass(state, "b");
    const expectedMass = state.expected_joint_branch_mass_kg;
    const massAConserved = closeAbsoluteRelative(
      integratedMassA,
      expectedMass,
      tolerances.mass_absolute_kg,
      tolerances.mass_relative,
    );
    const massBConserved = closeAbsoluteRelative(
      integratedMassB,
      expectedMass,
      tolerances.mass_absolute_kg,
      tolerances.mass_relative,
    );
    const pairedMassConserved = closeAbsoluteRelative(
      integratedMassA,
      integratedMassB,
      tolerances.mass_absolute_kg,
      tolerances.mass_relative,
    );

    const swappedA = state.branch_swap_probe.branch_a_density_kg_m3;
    const swappedB = state.branch_swap_probe.branch_b_density_kg_m3;
    let branchSwapResidualKg = 0;
    for (let index = 0; index < state.density_cells.length; index += 1) {
      const cell = state.density_cells[index];
      branchSwapResidualKg +=
        Math.abs(swappedA[index] - cell.branch_b_density_kg_m3) *
          cell.volume_m3 +
        Math.abs(swappedB[index] - cell.branch_a_density_kg_m3) *
          cell.volume_m3;
    }
    const branchSwapPass =
      branchSwapResidualKg <= tolerances.branch_swap_absolute_kg;
    const objectMassPass =
      closeAbsoluteRelative(
        state.mobile_object_mass_a_kg,
        object.total_mass_kg,
        tolerances.mass_absolute_kg,
        tolerances.mass_relative,
      ) &&
      closeAbsoluteRelative(
        state.mobile_object_mass_b_kg,
        object.total_mass_kg,
        tolerances.mass_absolute_kg,
        tolerances.mass_relative,
      );
    const materialPass =
      state.mobile_object_material_id === object.material_id;

    return {
      boundary_state_id: state.boundary_state_id,
      density_reference: {
        receipt_id: state.density_receipt.receipt_id,
        artifact_path: state.density_receipt.artifact_path,
        sha256: state.density_receipt.actual_sha256,
        provenance_class: state.density_receipt.provenance_class,
      },
      rho_a_cell_count: state.density_cells.length,
      rho_b_cell_count: state.density_cells.length,
      delta_rho_cell_count: state.density_cells.length,
      integrated_branch_a_mass_kg: integratedMassA,
      integrated_branch_b_mass_kg: integratedMassB,
      expected_joint_branch_mass_kg: expectedMass,
      mass_conservation_residual_a_kg:
        integratedMassA - expectedMass,
      mass_conservation_residual_b_kg:
        integratedMassB - expectedMass,
      mass_conservation_gate:
        massAConserved && massBConserved && pairedMassConserved
          ? "pass" as const
          : "not_ready" as const,
      branch_swap_residual_kg: branchSwapResidualKg,
      branch_swap_gate:
        branchSwapPass ? "pass" as const : "not_ready" as const,
      mobile_object_mass_gate:
        objectMassPass ? "pass" as const : "not_ready" as const,
      mobile_object_material_gate:
        materialPass ? "pass" as const : "not_ready" as const,
    };
  });
  addFailure(
    failures,
    stateRows.some((row) => row.mass_conservation_gate !== "pass"),
    "STA_MASS_CONSERVATION_FAILED",
    "boundary_states.density_cells",
    "Both branches must integrate to the registered joint-system mass within the absolute-plus-relative mass tolerance.",
  );
  addFailure(
    failures,
    stateRows.some((row) => row.branch_swap_gate !== "pass"),
    "STA_BRANCH_SWAP_SYMMETRY_FAILED",
    "boundary_states.branch_swap_probe",
    "The explicit branch-swap probe must reproduce rho_B,rho_A and negate delta rho.",
  );
  addFailure(
    failures,
    stateRows.some(
      (row) =>
        row.mobile_object_mass_gate !== "pass" ||
        row.mobile_object_material_gate !== "pass",
    ),
    "STA_HIDDEN_OBJECT_MUTATION",
    "boundary_states.mobile_object",
    "Boundary states may not silently mutate the within-object mass or material.",
  );

  const referenceState = input.boundary_states.find(
    (state) =>
      state.boundary_state_id ===
      input.registered_boundary_pair.reference_state_id,
  )!;
  const comparisonState = input.boundary_states.find(
    (state) =>
      state.boundary_state_id ===
      input.registered_boundary_pair.comparison_state_id,
  )!;
  const referenceDelta = deltaCellMasses(referenceState);
  const comparisonDelta = deltaCellMasses(comparisonState);
  const sameGeometry = cellsHaveSameGeometry(
    referenceState,
    comparisonState,
  );
  const sameBinding = bindingEqual(referenceState, comparisonState);
  const exactDeltaEquality =
    referenceDelta.length === comparisonDelta.length &&
    referenceDelta.every(
      (value, index) => value === comparisonDelta[index],
    );
  const symbolicIdentityRecovered =
    sameGeometry && sameBinding && exactDeltaEquality;

  const deltaScaleKg = Math.max(
    referenceDelta.reduce((sum, value) => sum + Math.abs(value), 0),
    comparisonDelta.reduce((sum, value) => sum + Math.abs(value), 0),
  );
  const l1MismatchKg: number | null =
    sameGeometry && referenceDelta.length === comparisonDelta.length
      ? referenceDelta.reduce(
        (sum, value, index) =>
          sum + Math.abs(value - comparisonDelta[index]),
        0,
      )
      : null;
  const numericalNullToleranceKg =
    tolerances.density_identity_absolute_kg +
    tolerances.density_identity_relative * deltaScaleKg +
    input.sensitivity_budget.convergence_l1_mass_error_kg;
  const numericalNullRecovered =
    sameGeometry &&
    sameBinding &&
    l1MismatchKg !== null &&
    l1MismatchKg <= numericalNullToleranceKg;

  const exactIdentityRequired =
    input.registered_boundary_pair
      .complete_joint_system_equivalence_required;
  addFailure(
    failures,
    exactIdentityRequired && !symbolicIdentityRecovered,
    "STA_CONDITIONAL_BOUNDARY_IDENTITY_FAILED",
    "registered_boundary_pair",
    "The registered exact conditional boundary identity requires identical delta-rho geometry, trajectory, smearing, and model-parameter inputs.",
  );
  addFailure(
    failures,
    !numericalNullRecovered,
    "STA_NUMERICAL_NULL_RECOVERY_FAILED",
    "registered_boundary_pair",
    "The boundary-state delta-rho mismatch exceeds the absolute-plus-relative numerical tolerance derived from convergence error.",
  );

  const dpMismatchChi =
    l1MismatchKg === null
      ? null
      : l1MismatchKg *
        input.sensitivity_budget.dp_chi_per_l1_mismatch_kg;
  const ordinaryMismatchChi =
    l1MismatchKg === null
      ? null
      : l1MismatchKg *
        input.sensitivity_budget.ordinary_chi_per_l1_mismatch_kg;
  const combinedMismatchChi =
    dpMismatchChi === null || ordinaryMismatchChi === null
      ? null
      : dpMismatchChi + ordinaryMismatchChi;
  const allocatedSystematicChi =
    input.sensitivity_budget.systematic_fraction *
    input.sensitivity_budget.target_standard_uncertainty;
  const mismatchBudgetPass =
    combinedMismatchChi !== null &&
    Number.isFinite(combinedMismatchChi) &&
    combinedMismatchChi < allocatedSystematicChi;
  addFailure(
    failures,
    !mismatchBudgetPass,
    "STA_SENSITIVITY_MISMATCH_BUDGET_EXCEEDED",
    "sensitivity_budget",
    "Sensitivity-weighted DP plus ordinary branch mismatch must remain strictly below its preregistered systematic allocation.",
  );

  const registry = input.unit_registry;
  const unitChecks = {
    c_m_s: relativeDifference(registry.c_m_s, C),
    hbar_J_s: relativeDifference(registry.hbar_J_s, HBAR),
    gravitational_constant_m3_kg_s2: relativeDifference(
      registry.gravitational_constant_m3_kg_s2,
      G,
    ),
    kilogram_per_dalton: relativeDifference(
      registry.kilogram_per_dalton,
      1.660_539_066_60e-27,
    ),
    meter_per_nanometer: relativeDifference(
      registry.meter_per_nanometer,
      1e-9,
    ),
  };
  const massDa =
    object.total_mass_kg / registry.kilogram_per_dalton;
  const massRoundTripKg =
    massDa * registry.kilogram_per_dalton;
  const radiusNm =
    object.characteristic_radius_m / registry.meter_per_nanometer;
  const radiusRoundTripM =
    radiusNm * registry.meter_per_nanometer;
  const restEnergyJ = object.total_mass_kg * registry.c_m_s ** 2;
  const restMassRoundTripKg = restEnergyJ / registry.c_m_s ** 2;
  const unitRoundTripMaximumRelativeError = Math.max(
    ...Object.values(unitChecks),
    relativeDifference(massRoundTripKg, object.total_mass_kg),
    relativeDifference(radiusRoundTripM, object.characteristic_radius_m),
    relativeDifference(restMassRoundTripKg, object.total_mass_kg),
  );
  const unitGate =
    unitRoundTripMaximumRelativeError <= tolerances.unit_relative;
  addFailure(
    failures,
    !unitGate,
    "STA_UNIT_ROUNDTRIP_FAILED",
    "unit_registry",
    "SI, dalton, nanometre, rest-energy, and natural-scale constants must reproduce the canonical registry within tolerance.",
  );

  const ancestryIds = input.covariance_ancestry.map(
    (row) => row.ancestry_id,
  );
  const ancestryPass =
    new Set(ancestryIds).size === ancestryIds.length &&
    input.covariance_ancestry.every(
      (row) =>
        row.relationship !== "shared_ancestor" ||
        row.treatment !== "treated_as_independent",
    );
  addFailure(
    failures,
    !ancestryPass,
    "STA_PROVENANCE_ANCESTRY_INVALID",
    "covariance_ancestry",
    "Shared source ancestry must use full cross-covariance or remain explicitly non-independent.",
  );

  const sorted = sortFailures(failures);
  const failureCodes = new Set(sorted.map((failure) => failure.code));
  const gateFor = (
    ...codes: CasimirDpApparatusScaleTransportStage4_2BFailureCode[]
  ) => codes.some((code) => failureCodes.has(code))
    ? "not_ready" as const
    : "pass" as const;
  const planckMassKg = Math.sqrt(
    registry.hbar_J_s * registry.c_m_s /
      registry.gravitational_constant_m3_kg_s2,
  );
  const radius = object.characteristic_radius_m;

  return {
    schema_version:
      CASIMIR_DP_APPARATUS_SCALE_TRANSPORT_STAGE4_2B_RESULT_VERSION,
    campaign_id: input.campaign_id,
    evidence_class: input.evidence_class,
    claim_ceiling: input.claim_ceiling,
    status: sorted.length === 0
      ? "pass" as const
      : "not_ready" as const,
    failures: sorted,
    first_failure_code: sorted[0]?.code ?? null,
    object_ledger: {
      object_id: object.object_id,
      material_id: object.material_id,
      total_mass_kg: object.total_mass_kg,
      total_mass_standard_uncertainty_kg:
        object.total_mass_standard_uncertainty_kg,
      total_mass_Da: massDa,
      mass_accounting_basis: object.mass_accounting_basis,
      density_provenance: object.density_provenance,
      characteristic_radius_m: radius,
      shape: object.shape,
      porosity_fraction: object.porosity_fraction,
      coating_thickness_m: object.coating_thickness_m,
      mass_is_complete_measured_or_design_class_bulk_mass:
        !forbiddenMassReconstruction,
    },
    composition_and_approximation_ledger: {
      components: object.composition,
      mass_fraction_sum: massFractionSum,
      continuum_or_discrete_density_choice:
        referenceState.dp_binding.mass_density_convention,
      electron_mass_benchmark_is_bulk_mass_source: false as const,
      selected_qcd_terms_are_separate_dp_sources: false as const,
      measured_total_mass_includes_binding_accounting:
        object.mass_accounting_basis === "measured_total_mass",
    },
    preparation_fidelity_ledger: preparationRows,
    branch_density_ledger: stateRows,
    dimensionless_scale_vector: {
      mass_over_planck_mass: object.total_mass_kg / planckMassKg,
      branch_separation_over_radius:
        input.scales.branch_separation_m / radius,
      smearing_length_over_radius:
        input.scales.smearing_length_m / radius,
      c_hold_time_over_radius:
        registry.c_m_s * input.scales.hold_time_s / radius,
      gravitational_coupling:
        registry.gravitational_constant_m3_kg_s2 *
        object.total_mass_kg ** 2 /
        (registry.hbar_J_s * registry.c_m_s),
      planck_mass_kg: planckMassKg,
      interpretation:
        "dimensionless_reparameterization_not_planck_scale_access" as const,
    },
    complete_joint_system_boundary_equivalence: {
      reference_state_id: referenceState.boundary_state_id,
      comparison_state_id: comparisonState.boundary_state_id,
      exact_equivalence_required: exactIdentityRequired,
      same_cell_geometry: sameGeometry,
      same_dp_binding: sameBinding,
      exact_delta_rho_equality: exactDeltaEquality,
      symbolic_identity: {
        expression:
          "identical_delta_rho_smearing_trajectory_parameters_implies_delta_boundary_Gamma_DP_equals_0" as const,
        recovered: symbolicIdentityRecovered,
        gate:
          !exactIdentityRequired || symbolicIdentityRecovered
            ? "pass" as const
            : "not_ready" as const,
      },
      numerical_recovery: {
        l1_delta_rho_mismatch_kg: l1MismatchKg,
        delta_rho_l1_scale_kg: deltaScaleKg,
        absolute_tolerance_kg:
          tolerances.density_identity_absolute_kg,
        relative_tolerance:
          tolerances.density_identity_relative,
        convergence_error_allowance_kg:
          input.sensitivity_budget.convergence_l1_mass_error_kg,
        combined_absolute_plus_relative_tolerance_kg:
          numericalNullToleranceKg,
        relative_only_tolerance_used: false as const,
        gate:
          numericalNullRecovered
            ? "pass" as const
            : "not_ready" as const,
      },
      experimental_mismatch: {
        dp_delta_chi_bound: dpMismatchChi,
        ordinary_delta_chi_bound: ordinaryMismatchChi,
        combined_delta_chi_bound: combinedMismatchChi,
        allocated_systematic_chi: allocatedSystematicChi,
        strict_inequality_required: true as const,
        gate:
          mismatchBudgetPass
            ? "pass" as const
            : "not_ready" as const,
      },
      interpretation:
        symbolicIdentityRecovered && numericalNullRecovered
          ? "registered_newtonian_mass_density_dp_boundary_contribution_cancels_conditionally" as const
          : "conditional_dp_boundary_identity_not_admitted" as const,
    },
    unit_and_convention_round_trips: {
      registry_relative_errors: unitChecks,
      mass_Da: massDa,
      mass_round_trip_kg: massRoundTripKg,
      radius_nm: radiusNm,
      radius_round_trip_m: radiusRoundTripM,
      rest_energy_J: restEnergyJ,
      rest_mass_round_trip_kg: restMassRoundTripKg,
      maximum_relative_error: unitRoundTripMaximumRelativeError,
      tolerance: tolerances.unit_relative,
      gate: unitGate ? "pass" as const : "not_ready" as const,
    },
    parameter_transport_dag: {
      nodes: [
        "mass_composition_geometry_receipts",
        "rho_a_rho_b",
        "delta_rho",
        "registered_smearing_and_trajectory",
        "runtime_d_dp_density_functional",
        "frozen_chi_dp",
      ] as const,
      edges: [
        ["mass_composition_geometry_receipts", "rho_a_rho_b"],
        ["rho_a_rho_b", "delta_rho"],
        ["delta_rho", "registered_smearing_and_trajectory"],
        [
          "registered_smearing_and_trajectory",
          "runtime_d_dp_density_functional",
        ],
        ["runtime_d_dp_density_functional", "frozen_chi_dp"],
      ] as const,
      every_edge_requires_units_source_uncertainty_and_hash: true as const,
      evidential_transport_claimed: false as const,
    },
    covariance_ancestry_ledger: input.covariance_ancestry,
    no_bridge_ledger: [
      {
        source: "electron_mass_higgs_anchor_stage4_2a",
        forbidden_target: "nanoparticle_bulk_mass_or_dp_rate",
        observable_bridge_edges: 0,
      },
      {
        source: "shared_energy_or_frequency_units",
        forbidden_target: "collapse_clock",
        observable_bridge_edges: 0,
      },
      {
        source: "casimir_boundary_condition",
        forbidden_target: "unmodified_newtonian_mass_density_dp_term",
        observable_bridge_edges: 0,
      },
    ] as const,
    final_gates: {
      authority_integrity:
        gateFor("STA_AUTHORITY_INTEGRITY_INVALID"),
      artifact_integrity:
        gateFor("STA_RECEIPT_INTEGRITY_INVALID"),
      admissible_density_provenance:
        gateFor("STA_DENSITY_PROVENANCE_INVALID"),
      preparation_fidelity_typing:
        gateFor("STA_PREPARATION_FIDELITY_INVALID"),
      composition_and_mass_accounting:
        gateFor(
          "STA_FORBIDDEN_BULK_MASS_RECONSTRUCTION",
          "STA_COMPOSITION_LEDGER_INVALID",
        ),
      mass_conservation:
        gateFor("STA_MASS_CONSERVATION_FAILED"),
      branch_swap_symmetry:
        gateFor("STA_BRANCH_SWAP_SYMMETRY_FAILED"),
      no_hidden_object_mutation:
        gateFor("STA_HIDDEN_OBJECT_MUTATION"),
      conditional_boundary_identity:
        gateFor(
          "STA_CONDITIONAL_BOUNDARY_IDENTITY_FAILED",
          "STA_NUMERICAL_NULL_RECOVERY_FAILED",
        ),
      sensitivity_weighted_mismatch:
        gateFor("STA_SENSITIVITY_MISMATCH_BUDGET_EXCEEDED"),
      unit_dimension_closure:
        gateFor("STA_UNIT_ROUNDTRIP_FAILED"),
      covariance_ancestry:
        gateFor("STA_PROVENANCE_ANCESTRY_INVALID"),
      measured_evidence: "not_ready" as const,
      collapse_identification: "blocked" as const,
      manifold_dynamics: "blocked" as const,
      physical_viability: "not_evaluated" as const,
      publication_claim:
        "composition_aware_branch_density_parameter_transport_only" as const,
    },
    promotion_allowed: false as const,
    observable_bridge_edges_added: 0 as const,
  };
}

export type CasimirDpApparatusScaleTransportStage4_2BResult =
  ReturnType<
    typeof evaluateCasimirDpApparatusScaleTransportStage4_2B
  >;
