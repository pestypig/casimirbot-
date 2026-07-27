// math-stage: diagnostic
import { z } from "zod";
import { HBAR } from "./physics-const";
import {
  CasimirDpDpCompanionInput,
  CASIMIR_DP_DP_MODEL_ID,
  evaluateCasimirDpDpCompanion,
  evaluateCasimirDpDpRegisteredPoint,
  sha256CasimirDpDpParameterManifest,
} from "./casimir-dp-dp-companion";
import {
  computeDpCollapse,
  DpCollapseInput,
  type TDpCollapseInput,
} from "./dp-collapse";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Finite = z.number().finite();
const NonnegativeFinite = Finite.nonnegative();
const PositiveFinite = Finite.positive();

export const CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256 =
  "4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6" as const;

const HashedReceipt = z.object({
  source_ref: z.string().min(1),
  expected_sha256: Sha256,
  actual_sha256: Sha256,
  integrity_verified: z.boolean(),
}).strict();

const ExperimentalEquivalence = z.object({
  complete_joint_system_checked: z.boolean(),
  density_trajectories_and_smearing_equivalent: z.boolean(),
  branch_preparation_fidelity_class: z.enum([
    "assumed",
    "simulated",
    "measured",
  ]),
  sensitivity_weighted_delta_chi: Finite,
  standard_uncertainty_chi: NonnegativeFinite,
  systematic_allocation_chi: PositiveFinite,
  receipt: HashedReceipt,
}).strict();

const BranchDensityCell = z.object({
  cell_id: z.string().min(1),
  blind_boundary_label: z.string().min(1),
  boundary_equivalence_group: z.string().min(1),
  object_configuration_id: z.string().min(1),
  mass_kg: PositiveFinite,
  radius_m: PositiveFinite,
  branch_separation_m: NonnegativeFinite,
  hold_time_s: NonnegativeFinite,
  delta_rho_receipt_sha256: Sha256,
  experimental_equivalence: ExperimentalEquivalence,
}).strict();

const NumericalResolutionRun = z.object({
  resolution_id: z.string().min(1),
  nominal_resolution_m: PositiveFinite,
  input_receipt: HashedReceipt,
  dp_input: DpCollapseInput,
}).strict();

const NumericalCase = z.object({
  case_id: z.string().min(1),
  cell_id: z.string().min(1),
  resolution_runs: z.array(NumericalResolutionRun).min(3),
  subvoxel_shift_probe: z.object({
    displacement_fraction_of_finest_voxel: z.number().gt(0).lt(1),
    input_receipt: HashedReceipt,
    dp_input: DpCollapseInput,
  }).strict(),
}).strict();

const ExternalBoundMap = z.object({
  bound_id: z.literal("xenonnt_2026_markovian_dp_radiation"),
  source_ref: z.literal("doi:10.1103/2jm3-4976"),
  confidence_level: z.literal(0.9),
  local_significance_sigma: z.literal(0.2),
  external_R0_lower_bound_m: z.literal(4.9e-10),
  parameter_map: z.object({
    relation: z.literal("stage_r0_m=factor_times_external_R0_m"),
    factor: PositiveFinite,
    kernel_shape_match: z.boolean(),
    width_convention_match: z.boolean(),
    normalization_match: z.boolean(),
    constituent_prescription_match: z.boolean(),
    temporal_noise_convention_match: z.boolean(),
    radiation_kernel_match: z.boolean(),
    master_equation_version_match: z.boolean(),
    receipt: HashedReceipt,
  }).strict(),
}).strict();

const BoundaryExtension = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("unmodified_newtonian_mass_density_dp"),
    boundary_variable_in_generator: z.literal(false),
  }).strict(),
  z.object({
    kind: z.literal("separately_registered_modifier"),
    boundary_variable_in_generator: z.literal(true),
    scored_separately_from_named_dp: z.boolean(),
    modifier_id: z.string().min(1),
    registry_receipt: HashedReceipt,
  }).strict(),
]);

export const CasimirDpDpScalingForecastStage4_2BInput = z.object({
  schema_version: z.literal("casimir_dp_dp_scaling_forecast_stage4_2b/1"),
  evidence_class: z.enum([
    "synthetic_fixture",
    "measured_calibration",
    "design_assumption",
  ]),
  applicability_manifest: z.object({
    model_id: z.literal(CASIMIR_DP_DP_MODEL_ID),
    model_version: z.literal("1"),
    generator: z.literal("newtonian_markovian_mass_density_dp"),
    temporal_noise: z.literal("white_markovian"),
    dissipation: z.literal("none"),
    density_prescription: z.literal("single_effective_gaussian_particle"),
    parameter_manifest_sha256: z.literal(
      CASIMIR_DP_STAGE3_NAMED_MANIFEST_SHA256,
    ),
    applicability_receipt: HashedReceipt,
    boundary_extension: BoundaryExtension,
  }).strict(),
  freeze: z.object({
    manifest_frozen_before_confirmatory: z.boolean(),
    parameters_retuned_after_held_out: z.boolean(),
    r0_retuned_after_held_out: z.boolean(),
    amplitude_fitted_to_confirmatory: z.boolean(),
    freeze_receipt: HashedReceipt,
  }).strict(),
  branch_density_ledger: z.object({
    cell_registry_sha256: Sha256,
    ledger_receipt: HashedReceipt,
    cells: z.array(BranchDensityCell).min(2),
  }).strict(),
  numerical_reconciliation: z.object({
    stage2_convention: z.literal("plummer_softened_density_diagnostic"),
    stage3_convention: z.literal(
      "gaussian_regularized_nondissipative_named_dp",
    ),
    dp_collapse_role: z.literal(
      "legacy_plummer_density_and_convergence_diagnostic_only",
    ),
    named_prediction_role: z.literal(
      "stage3_gaussian_analytic_with_fourier_crosscheck",
    ),
    kernels_vote_counted_as_independent_confirmation: z.literal(false),
    common_recovery_fixture_passed: z.boolean(),
    source_backed_selection_reason: z.string().min(1),
    reconciliation_receipt: HashedReceipt,
  }).strict(),
  numerical_contract: z.object({
    minimum_resolutions: z.number().int().min(3),
    convergence_relative_tolerance: PositiveFinite,
    convergence_absolute_tolerance_J: NonnegativeFinite,
    identical_branch_absolute_tolerance_J: NonnegativeFinite,
    branch_symmetry_relative_tolerance: PositiveFinite,
    branch_symmetry_absolute_tolerance_J: NonnegativeFinite,
    maximum_mass_relative_error: PositiveFinite,
    maximum_boundary_shell_mass_fraction: z.number().gte(0).lt(1),
    maximum_subvoxel_relative_sensitivity: PositiveFinite,
    maximum_subvoxel_absolute_sensitivity_J: NonnegativeFinite,
    boundary_null_relative_tolerance: PositiveFinite,
    boundary_null_absolute_tolerance_s: NonnegativeFinite,
  }).strict(),
  identity_recovery_input: DpCollapseInput,
  numerical_cases: z.array(NumericalCase).min(1),
  companion_input: CasimirDpDpCompanionInput,
  external_bound_ledger: z.array(ExternalBoundMap).min(1),
  companion_measurement_forecast: z.object({
    observable: z.enum([
      "heating_W",
      "heating_W_per_kg",
      "per_axis_momentum_variance_rate_kg2_m2_s3",
    ]),
    one_shot_standard_uncertainty: PositiveFinite,
    planned_independent_samples: z.number().int().positive(),
    applicable_to_named_model: z.boolean(),
    statistically_independent_of_coherence_channel: z.boolean(),
    independence_receipt: HashedReceipt,
    minimum_support_snr: z.number().gte(5),
  }).strict(),
}).strict().superRefine((input, context) => {
  const cells = input.branch_density_ledger.cells;
  const cellIds = cells.map((cell) => cell.cell_id);
  if (new Set(cellIds).size !== cellIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["branch_density_ledger", "cells"],
      message: "Branch-density cell IDs must be unique.",
    });
  }
  const boundaryLabels = cells.map((cell) => cell.blind_boundary_label);
  if (new Set(boundaryLabels).size !== boundaryLabels.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["branch_density_ledger", "cells"],
      message: "Blind boundary labels must be unique.",
    });
  }

  for (const [caseIndex, numericalCase] of input.numerical_cases.entries()) {
    if (!cellIds.includes(numericalCase.cell_id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numerical_cases", caseIndex, "cell_id"],
        message: "Every numerical case must reference a branch-density cell.",
      });
    }
    const runs = numericalCase.resolution_runs;
    if (runs.length < input.numerical_contract.minimum_resolutions) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numerical_cases", caseIndex, "resolution_runs"],
        message: "The registered minimum number of resolutions is required.",
      });
    }
    if (
      new Set(runs.map((run) => run.nominal_resolution_m)).size !== runs.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["numerical_cases", caseIndex, "resolution_runs"],
        message: "Numerical resolutions must be distinct.",
      });
    }
    for (const [runIndex, run] of runs.entries()) {
      const actualResolution = Math.max(...run.dp_input.grid.voxel_size_m);
      const mismatch = Math.abs(actualResolution - run.nominal_resolution_m) /
        Math.max(
          Math.abs(actualResolution),
          Math.abs(run.nominal_resolution_m),
          Number.MIN_VALUE,
        );
      if (mismatch > 1e-12) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            "numerical_cases",
            caseIndex,
            "resolution_runs",
            runIndex,
            "nominal_resolution_m",
          ],
          message:
            "Nominal resolution must equal the largest grid voxel dimension.",
        });
      }
    }
  }

  if (
    input.applicability_manifest.parameter_manifest_sha256 !==
      input.companion_input.parameter_manifest_sha256
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["applicability_manifest", "parameter_manifest_sha256"],
      message:
        "The applicability manifest must bind the exact companion parameter manifest.",
    });
  }

  const companionCells = new Map(
    input.companion_input.fixed_branch_boundary_cells.map((cell) => [
      cell.blind_boundary_label,
      cell.delta_rho_receipt_sha256,
    ]),
  );
  for (const [cellIndex, cell] of cells.entries()) {
    if (
      companionCells.get(cell.blind_boundary_label) !==
        cell.delta_rho_receipt_sha256
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["branch_density_ledger", "cells", cellIndex],
        message:
          "Each branch-density cell must match a companion boundary label and delta-rho receipt.",
      });
    }
  }
});

export type CasimirDpDpScalingForecastStage4_2BInput = z.infer<
  typeof CasimirDpDpScalingForecastStage4_2BInput
>;

export type CasimirDpDpScalingForecastStage4_2BFailure = {
  code: string;
  reason: string;
};

export type CasimirDpDpScalingForecastStage4_2BResult = ReturnType<
  typeof evaluateCasimirDpDpScalingForecastStage4_2B
>;

function receiptPass(receipt: z.infer<typeof HashedReceipt>): boolean {
  return receipt.integrity_verified &&
    receipt.expected_sha256 === receipt.actual_sha256;
}

function relativeDifference(left: number, right: number): number {
  if (left === right) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function absolutePlusRelativePass(
  left: number,
  right: number,
  absoluteTolerance: number,
  relativeTolerance: number,
): boolean {
  return Math.abs(left - right) <=
    absoluteTolerance +
      relativeTolerance * Math.max(Math.abs(left), Math.abs(right));
}

function failure(
  code: string,
  reason: string,
): CasimirDpDpScalingForecastStage4_2BFailure {
  return { code, reason };
}

function swapBranches(input: TDpCollapseInput): TDpCollapseInput {
  return {
    ...input,
    branch_a: input.branch_b,
    branch_b: input.branch_a,
  };
}

function logarithmicSlope(
  rows: Array<{ x: number; y: number }>,
): number | null {
  const usable = rows.filter((row) => row.x > 0 && row.y > 0);
  if (usable.length < 2) return null;
  const sorted = [...usable].sort((left, right) => left.x - right.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.x === last.x || first.y === last.y) {
    return first.y === last.y ? 0 : null;
  }
  return Math.log(last.y / first.y) / Math.log(last.x / first.x);
}

export function evaluateCasimirDpDpScalingForecastStage4_2B(
  rawInput: CasimirDpDpScalingForecastStage4_2BInput,
) {
  const input = CasimirDpDpScalingForecastStage4_2BInput.parse(rawInput);
  const failures: CasimirDpDpScalingForecastStage4_2BFailure[] = [];
  const applicability = input.applicability_manifest;
  const freeze = input.freeze;
  const manifestHash = sha256CasimirDpDpParameterManifest(
    input.companion_input.parameter_manifest,
  );
  if (
    manifestHash !== input.companion_input.parameter_manifest_sha256 ||
    manifestHash !== applicability.parameter_manifest_sha256
  ) {
    failures.push(failure(
      "dp_parameter_manifest_hash_mismatch",
      "The named DP prediction must remain bound to one exact frozen parameter manifest.",
    ));
  }
  if (
    !freeze.manifest_frozen_before_confirmatory ||
    freeze.parameters_retuned_after_held_out ||
    freeze.r0_retuned_after_held_out ||
    freeze.amplitude_fitted_to_confirmatory
  ) {
    failures.push(failure(
      "post_hoc_dp_parameter_retuning",
      "The DP cutoff, amplitude, and all model parameters must remain frozen before held-out data.",
    ));
  }
  for (const receipt of [
    applicability.applicability_receipt,
    freeze.freeze_receipt,
    input.branch_density_ledger.ledger_receipt,
    input.numerical_reconciliation.reconciliation_receipt,
  ]) {
    if (!receiptPass(receipt)) {
      failures.push(failure(
        "dp_authority_receipt_invalid",
        "An applicability, freeze, density-ledger, or reconciliation receipt failed integrity.",
      ));
    }
  }
  if (
    !input.numerical_reconciliation.common_recovery_fixture_passed ||
    input.numerical_reconciliation
      .kernels_vote_counted_as_independent_confirmation
  ) {
    failures.push(failure(
      "dp_manifest_reconciliation_failed",
      "The Gaussian named prediction and legacy Plummer diagnostic require a passing common recovery fixture and cannot be vote-counted as independent confirmation.",
    ));
  }

  const extension = applicability.boundary_extension;
  if (
    extension.kind === "separately_registered_modifier" &&
    (
      !extension.scored_separately_from_named_dp ||
      !receiptPass(extension.registry_receipt)
    )
  ) {
    failures.push(failure(
      "unregistered_dp_boundary_term",
      "A boundary modifier must be registry-bound and scored separately from the unmodified named DP generator.",
    ));
  }

  const companion = evaluateCasimirDpDpCompanion(input.companion_input);
  const namedRows = companion.named_dynamical_dp.rows;
  if (namedRows.some((row) => row.E_G_analytic_J < 0 || row.Gamma_DP_s < 0)) {
    failures.push(failure(
      "negative_dp_rate",
      "The registered DP convention requires nonnegative E_G and Gamma_DP.",
    ));
  }
  if (namedRows.some((row) => row.E_G_crosscheck_gate !== "pass")) {
    failures.push(failure(
      "named_dp_fourier_crosscheck_failed",
      "The named Gaussian prediction failed its independent Fourier quadrature crosscheck.",
    ));
  }

  const contract = input.numerical_contract;
  const identity = computeDpCollapse(input.identity_recovery_input);
  const identityGate =
    identity.deltaE_J <= contract.identical_branch_absolute_tolerance_J;
  if (!identityGate) {
    failures.push(failure(
      "identical_branch_energy_nonzero",
      "The numerical DP diagnostic must recover E_G=0 for identical branches under an absolute tolerance.",
    ));
  }

  const numericalCases = input.numerical_cases.map((numericalCase) => {
    const cell = input.branch_density_ledger.cells.find(
      (candidate) => candidate.cell_id === numericalCase.cell_id,
    )!;
    const runs = numericalCase.resolution_runs
      .map((run) => ({
        ...run,
        receipt_gate: receiptPass(run.input_receipt)
          ? "pass" as const
          : "not_ready" as const,
        result: computeDpCollapse(run.dp_input),
      }))
      .sort((left, right) =>
        right.nominal_resolution_m - left.nominal_resolution_m
      );
    const finest = runs[runs.length - 1];
    const penultimate = runs[runs.length - 2];
    const convergenceAbsoluteError = Math.abs(
      finest.result.deltaE_J - penultimate.result.deltaE_J,
    );
    const convergenceRelativeError = relativeDifference(
      finest.result.deltaE_J,
      penultimate.result.deltaE_J,
    );
    const convergenceGate = absolutePlusRelativePass(
      finest.result.deltaE_J,
      penultimate.result.deltaE_J,
      contract.convergence_absolute_tolerance_J,
      contract.convergence_relative_tolerance,
    );
    const swapped = computeDpCollapse(swapBranches(finest.dp_input));
    const symmetryAbsoluteError = Math.abs(
      finest.result.deltaE_J - swapped.deltaE_J,
    );
    const symmetryRelativeError = relativeDifference(
      finest.result.deltaE_J,
      swapped.deltaE_J,
    );
    const symmetryGate = absolutePlusRelativePass(
      finest.result.deltaE_J,
      swapped.deltaE_J,
      contract.branch_symmetry_absolute_tolerance_J,
      contract.branch_symmetry_relative_tolerance,
    );
    const subvoxel = computeDpCollapse(
      numericalCase.subvoxel_shift_probe.dp_input,
    );
    const subvoxelAbsoluteSensitivity = Math.abs(
      finest.result.deltaE_J - subvoxel.deltaE_J,
    );
    const subvoxelRelativeSensitivity = relativeDifference(
      finest.result.deltaE_J,
      subvoxel.deltaE_J,
    );
    const subvoxelGate = absolutePlusRelativePass(
      finest.result.deltaE_J,
      subvoxel.deltaE_J,
      contract.maximum_subvoxel_absolute_sensitivity_J,
      contract.maximum_subvoxel_relative_sensitivity,
    );
    const massRelativeErrors = runs.flatMap((run) => [
      relativeDifference(run.result.mass_a_kg, cell.mass_kg),
      relativeDifference(run.result.mass_b_kg, cell.mass_kg),
      relativeDifference(run.result.mass_a_kg, run.result.mass_b_kg),
    ]);
    const maximumMassRelativeError = Math.max(...massRelativeErrors);
    const massGate =
      maximumMassRelativeError <= contract.maximum_mass_relative_error;
    const maximumBoundaryShellFraction = Math.max(...runs.flatMap((run) => [
      run.result.boundary_shell_mass_fraction_a,
      run.result.boundary_shell_mass_fraction_b,
    ]));
    const domainGate =
      maximumBoundaryShellFraction <=
        contract.maximum_boundary_shell_mass_fraction;
    const receiptGate =
      runs.every((run) => run.receipt_gate === "pass") &&
      receiptPass(numericalCase.subvoxel_shift_probe.input_receipt);
    const gate =
      runs.length >= contract.minimum_resolutions &&
      receiptGate &&
      convergenceGate &&
      symmetryGate &&
      subvoxelGate &&
      massGate &&
      domainGate;
    return {
      case_id: numericalCase.case_id,
      cell_id: numericalCase.cell_id,
      numerical_role:
        "legacy_plummer_density_and_convergence_diagnostic_only" as const,
      gate: gate ? "pass" as const : "not_ready" as const,
      resolution_rows: runs.map((run) => ({
        resolution_id: run.resolution_id,
        nominal_resolution_m: run.nominal_resolution_m,
        E_G_J: run.result.deltaE_J,
        mass_a_kg: run.result.mass_a_kg,
        mass_b_kg: run.result.mass_b_kg,
        boundary_shell_mass_fraction_a:
          run.result.boundary_shell_mass_fraction_a,
        boundary_shell_mass_fraction_b:
          run.result.boundary_shell_mass_fraction_b,
        receipt_gate: run.receipt_gate,
      })),
      finest_E_G_J: finest.result.deltaE_J,
      convergence_absolute_error_J: convergenceAbsoluteError,
      convergence_relative_error: convergenceRelativeError,
      convergence_gate: convergenceGate ? "pass" as const : "not_ready" as const,
      branch_symmetry_absolute_error_J: symmetryAbsoluteError,
      branch_symmetry_relative_error: symmetryRelativeError,
      branch_symmetry_gate: symmetryGate ? "pass" as const : "not_ready" as const,
      maximum_mass_relative_error: maximumMassRelativeError,
      mass_conservation_gate: massGate ? "pass" as const : "not_ready" as const,
      maximum_boundary_shell_mass_fraction: maximumBoundaryShellFraction,
      domain_containment_gate: domainGate ? "pass" as const : "not_ready" as const,
      subvoxel_absolute_sensitivity_J: subvoxelAbsoluteSensitivity,
      subvoxel_relative_sensitivity: subvoxelRelativeSensitivity,
      subvoxel_sensitivity_gate:
        subvoxelGate ? "pass" as const : "not_ready" as const,
    };
  });
  if (numericalCases.some((row) => row.gate !== "pass")) {
    failures.push(failure(
      "dp_multiresolution_convergence_failed",
      "Mass conservation, domain containment, symmetry, sub-voxel, receipt, and multi-resolution gates must pass before numerical sensitivity is reported.",
    ));
  }

  const registeredCellPoints = new Map(
    input.branch_density_ledger.cells.map((cell) => [
      cell.cell_id,
      evaluateCasimirDpDpRegisteredPoint({
        mass_kg: cell.mass_kg,
        branch_separation_m: cell.branch_separation_m,
        parameter_manifest: input.companion_input.parameter_manifest,
        parameter_manifest_sha256: manifestHash,
      }),
    ]),
  );
  const cellPredictions = input.branch_density_ledger.cells.map((cell) => {
    const named = registeredCellPoints.get(cell.cell_id)!;
    if (named.E_G_crosscheck_gate !== "pass") {
      failures.push(failure(
        "branch_cell_registered_point_crosscheck_failed",
        `Cell ${cell.cell_id} failed the frozen registered-generator Fourier cross-check.`,
      ));
    }
    const holdTime = cell.hold_time_s;
    return {
        cell_id: cell.cell_id,
        blind_boundary_label: cell.blind_boundary_label,
        object_configuration_id: cell.object_configuration_id,
        mass_kg: cell.mass_kg,
        radius_m: cell.radius_m,
        branch_separation_m: cell.branch_separation_m,
        hold_time_s: holdTime,
        E_G_J: named.E_G_analytic_J,
        E_G_fourier_crosscheck_J: named.E_G_fourier_crosscheck_J,
        Gamma_DP_s: named.Gamma_DP_s,
        chi_DP: named.Gamma_DP_s * holdTime,
        visibility_ratio: Math.exp(-named.Gamma_DP_s * holdTime),
        parameter_manifest_sha256: manifestHash,
        cell_registry_sha256:
          input.branch_density_ledger.cell_registry_sha256,
        evaluation_scope:
          "registered_generator_campaign_point" as const,
      };
  });

  const uniqueMassRows = new Map<string, { x: number; y: number }>();
  const uniqueSeparationRows = new Map<string, { x: number; y: number }>();
  for (const row of namedRows) {
    if (row.mass_kg > 0 && row.branch_separation_m > 0 && row.Gamma_DP_s > 0) {
      uniqueMassRows.set(
        `${row.mass_kg.toPrecision(15)}`,
        { x: row.mass_kg, y: row.Gamma_DP_s },
      );
      uniqueSeparationRows.set(
        `${row.branch_separation_m.toPrecision(15)}`,
        { x: row.branch_separation_m, y: row.Gamma_DP_s },
      );
    }
  }
  const massSensitivity = logarithmicSlope([...uniqueMassRows.values()]);
  const separationSensitivity = logarithmicSlope(
    [...uniqueSeparationRows.values()],
  );
  const holdSensitivity =
    namedRows.some((row) => row.Gamma_DP_s > 0) ? 1 : null;

  const externalBounds = input.external_bound_ledger.map((bound) => {
    const map = bound.parameter_map;
    const compatible =
      receiptPass(map.receipt) &&
      map.kernel_shape_match &&
      map.width_convention_match &&
      map.normalization_match &&
      map.constituent_prescription_match &&
      map.temporal_noise_convention_match &&
      map.radiation_kernel_match &&
      map.master_equation_version_match;
    const rawMappedLowerBound =
      map.factor * bound.external_R0_lower_bound_m;
    const mappedLowerBound =
      compatible && Number.isFinite(rawMappedLowerBound)
        ? rawMappedLowerBound
        : null;
    const chosenR0 =
      input.companion_input.parameter_manifest.physical_regularization.R0_m;
    return {
      bound_id: bound.bound_id,
      source_ref: bound.source_ref,
      confidence_level: bound.confidence_level,
      local_significance_sigma: bound.local_significance_sigma,
      parameter_map_gate: compatible
        ? "compatible" as const
        : "contextual_only" as const,
      mapped_stage_r0_lower_bound_m: mappedLowerBound,
      chosen_stage_r0_m: chosenR0,
      region_comparison:
        mappedLowerBound == null
          ? "not_admitted_numerically" as const
          : chosenR0 < mappedLowerBound
            ? "disfavored" as const
            : "not_disfavored" as const,
      interpretation:
        compatible
          ? "The bound is admitted only for the explicitly matched Markovian radiation implementation."
          : "The external result is contextual and does not truncate the Stage-4.2B parameter region.",
    };
  });
  const externalDisfavored = externalBounds.some(
    (bound) => bound.region_comparison === "disfavored",
  );

  const forecast = input.companion_measurement_forecast;
  const selectedCompanionSignal = Math.max(...namedRows.map((row) => {
    if (forecast.observable === "heating_W") return row.heating_W;
    if (forecast.observable === "heating_W_per_kg") {
      return row.heating_W_per_kg ?? 0;
    }
    return row.per_axis_momentum_variance_rate_kg2_m2_s3;
  }));
  const forecastStandardUncertainty =
    forecast.one_shot_standard_uncertainty /
    Math.sqrt(forecast.planned_independent_samples);
  const rawCompanionSnr =
    selectedCompanionSignal / forecastStandardUncertainty;
  const companionSnr = Number.isFinite(rawCompanionSnr)
    ? rawCompanionSnr
    : null;
  const independentCompanionPowered =
    forecast.applicable_to_named_model &&
    forecast.statistically_independent_of_coherence_channel &&
    receiptPass(forecast.independence_receipt) &&
    companionSnr != null &&
    companionSnr >= forecast.minimum_support_snr;

  const analyticBoundaryIdentityApplicable =
    extension.kind === "unmodified_newtonian_mass_density_dp" &&
    !extension.boundary_variable_in_generator;
  const numericalBoundaryRows = new Map<
    string,
    typeof input.branch_density_ledger.cells
  >();
  for (const cell of input.branch_density_ledger.cells) {
    const rows = numericalBoundaryRows.get(cell.boundary_equivalence_group) ?? [];
    rows.push(cell);
    numericalBoundaryRows.set(cell.boundary_equivalence_group, rows);
  }
  const boundaryNumericalRecoveries = [...numericalBoundaryRows.entries()]
    .map(([groupId, cells]) => {
      const receiptIdentity =
        new Set(cells.map((cell) => cell.delta_rho_receipt_sha256)).size === 1;
      const rates = cells.map((cell) =>
        registeredCellPoints.get(cell.cell_id)?.Gamma_DP_s ?? Number.NaN
      );
      const finiteRates = rates.every(Number.isFinite);
      const minimum = finiteRates ? Math.min(...rates) : Number.NaN;
      const maximum = finiteRates ? Math.max(...rates) : Number.NaN;
      const error = finiteRates ? maximum - minimum : Number.NaN;
      const recoveryPass =
        analyticBoundaryIdentityApplicable &&
        receiptIdentity &&
        cells.length >= 2 &&
        new Set(cells.map((cell) => cell.blind_boundary_label)).size >= 2 &&
        finiteRates &&
        absolutePlusRelativePass(
          maximum,
          minimum,
          contract.boundary_null_absolute_tolerance_s,
          contract.boundary_null_relative_tolerance,
        );
      return {
        boundary_equivalence_group: groupId,
        delta_rho_receipts_identical: receiptIdentity,
        boundary_cell_count: cells.length,
        rate_difference_s: finiteRates ? error : null,
        gate: recoveryPass
          ? "pass" as const
          : receiptIdentity
            ? "not_ready" as const
            : "not_applicable" as const,
      };
    });
  const numericalBoundaryGate =
    boundaryNumericalRecoveries.length > 0 &&
    boundaryNumericalRecoveries.every((row) => row.gate === "pass");
  const experimentalEquivalenceRows =
    input.branch_density_ledger.cells.map((cell) => {
      const equivalence = cell.experimental_equivalence;
      const upperMismatch = Math.abs(equivalence.sensitivity_weighted_delta_chi) +
        equivalence.standard_uncertainty_chi;
      const pass =
        receiptPass(equivalence.receipt) &&
        equivalence.complete_joint_system_checked &&
        equivalence.density_trajectories_and_smearing_equivalent &&
        equivalence.branch_preparation_fidelity_class === "measured" &&
        upperMismatch <= equivalence.systematic_allocation_chi;
      return {
        cell_id: cell.cell_id,
        preparation_fidelity_class:
          equivalence.branch_preparation_fidelity_class,
        upper_sensitivity_weighted_mismatch_chi: upperMismatch,
        systematic_allocation_chi: equivalence.systematic_allocation_chi,
        measured_preparation_required: true as const,
        gate: pass ? "pass" as const : "not_ready" as const,
      };
    });
  const experimentalEquivalenceGate =
    experimentalEquivalenceRows.every((row) => row.gate === "pass");

  const hardNumericalGate =
    identityGate &&
    numericalCases.every((row) => row.gate === "pass") &&
    namedRows.every((row) => row.E_G_crosscheck_gate === "pass");
  const gate = failures.length === 0 && hardNumericalGate
    ? "pass" as const
    : "blocked" as const;
  const supportPathGate =
    gate === "pass" &&
    independentCompanionPowered &&
    !externalDisfavored &&
    experimentalEquivalenceGate
      ? "eligible_after_measured_held_out_scaling_and_replication" as const
      : "compatibility_or_exclusion_only" as const;

  return {
    schema_version:
      "casimir_dp_dp_scaling_forecast_stage4_2b_result/1" as const,
    gate,
    first_failure: failures[0] ?? null,
    failures,
    model_registration: companion.model_registration,
    parameter_manifest_sha256: manifestHash,
    named_dp_prediction: {
      gate:
        namedRows.every((row) => row.E_G_crosscheck_gate === "pass")
          ? "pass" as const
          : "not_ready" as const,
      convention: "Gamma_DP=E_G/hbar" as const,
      cell_registry_sha256:
        input.branch_density_ledger.cell_registry_sha256,
      rows: cellPredictions,
      signature_vectors: {
        mass_kg: cellPredictions.map((row) => row.mass_kg),
        radius_m: cellPredictions.map((row) => row.radius_m),
        branch_separation_m:
          cellPredictions.map((row) => row.branch_separation_m),
        hold_time_s: cellPredictions.map((row) => row.hold_time_s),
        Gamma_DP_s: cellPredictions.map((row) => row.Gamma_DP_s),
        chi_DP: cellPredictions.map((row) => row.chi_DP),
      },
      logarithmic_sensitivities: {
        mass: massSensitivity,
        radius: 0,
        radius_interpretation:
          "Object radius is not an input to the registered single-effective-Gaussian-particle model; zero is a model limitation, not a universal DP prediction.",
        branch_separation: separationSensitivity,
        hold_time: holdSensitivity,
      },
    },
    numerical_density_diagnostic: {
      gate:
        hardNumericalGate ? "pass" as const : "not_ready" as const,
      identity_recovery: {
        E_G_J: identity.deltaE_J,
        absolute_tolerance_J:
          contract.identical_branch_absolute_tolerance_J,
        gate: identityGate ? "pass" as const : "not_ready" as const,
      },
      cases: numericalCases,
      reconciliation:
        input.numerical_reconciliation,
      claim_boundary:
        "The Plummer dp-collapse replay audits density transport, convergence, domain containment, mass, symmetry, and sub-voxel sensitivity; it is not vote-counted as an independent validation of the Gaussian named-model rate.",
    },
    external_bound_mapping: {
      rows: externalBounds,
      parameter_region_status:
        externalDisfavored
          ? "disfavored" as const
          : externalBounds.some(
            (row) => row.parameter_map_gate === "compatible",
          )
            ? "not_disfavored_within_admitted_maps" as const
            : "contextual_only" as const,
    },
    companion_forecast: {
      observable: forecast.observable,
      predicted_signal: selectedCompanionSignal,
      forecast_standard_uncertainty: forecastStandardUncertainty,
      forecast_snr: companionSnr,
      minimum_support_snr: forecast.minimum_support_snr,
      independently_powered: independentCompanionPowered,
      named_dp_support_role:
        independentCompanionPowered
          ? "independently_powered_applicable_companion" as const
          : "compatibility_or_exclusion_only" as const,
      companion_runtime: companion,
    },
    conditional_boundary_null: {
      analytic_identity: {
        status: analyticBoundaryIdentityApplicable
          ? "applies_to_registered_generator" as const
          : "not_applicable_to_separate_modifier" as const,
        rate_difference_s: analyticBoundaryIdentityApplicable ? 0 : null,
        scope:
          "The identity applies only when the complete joint-system branch density, smearing, trajectories, and named-model parameters are fixed.",
      },
      numerical_recovery: {
        gate:
          numericalBoundaryGate ? "pass" as const : "not_ready" as const,
        rows: boundaryNumericalRecoveries,
      },
      experimental_branch_equivalence: {
        gate:
          experimentalEquivalenceGate ? "pass" as const : "not_ready" as const,
        rows: experimentalEquivalenceRows,
      },
      boundary_null_claim_allowed:
        analyticBoundaryIdentityApplicable &&
        numericalBoundaryGate &&
        experimentalEquivalenceGate,
      bridge_inferred: false as const,
    },
    named_dp_support_path: supportPathGate,
    evidence_class: input.evidence_class,
    maximum_claim:
      input.evidence_class === "synthetic_fixture"
        ? "synthetic_dp_scaling_and_companion_forecast_only" as const
        : gate === "pass"
          ? "named_dp_parameter_region_forecast" as const
          : "not_ready" as const,
    measured_evidence: "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
    physical_viability: "not_evaluated" as const,
    claim_boundaries: [
      "E=mc^2 and Gamma=E_G/hbar provide parameter transport; they do not independently establish collapse.",
      "The analytic, numerical, and experimental boundary-null statements are separate gates.",
      "An unpowered companion limits a DP-shaped coherence result to compatibility or exclusion.",
      "A compatible external bound applies only to its explicitly mapped Markovian radiation implementation.",
      "Synthetic fixtures validate software behavior and cannot promote measured evidence.",
    ],
  };
}
