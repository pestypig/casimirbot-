// math-stage: reduced-order
import { createHash } from "node:crypto";
import { z } from "zod";
import { G, HBAR, PI } from "./physics-const";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const PositiveFinite = z.number().finite().positive();
const NonnegativeFinite = z.number().finite().nonnegative();
const EvidenceClass = z.enum([
  "synthetic",
  "measured",
  "design_assumption",
  "source_backed_calculation",
]);

export const CASIMIR_DP_DP_MODEL_ID =
  "diosi_1989_gaussian_regularized_nondissipative" as const;

export const CASIMIR_DP_DP_MODEL_REGISTRATION = {
  model_id: CASIMIR_DP_DP_MODEL_ID,
  model_version: "1",
  lane: "named_dynamical_dp",
  primary_sources: [
    {
      doi: "10.1103/PhysRevA.40.1165",
      role: "mass_density_master_equation",
    },
    {
      doi: "10.1103/PhysRevA.90.062105",
      role: "gaussian_regularization_and_energy_increase",
    },
    {
      doi: "10.1038/s41567-020-1008-4",
      role: "radiation_companion_constraint_on_natural_dp",
    },
  ],
  equations: {
    branch_self_energy:
      "E_G=G*m^2*(1/(sqrt(pi)*R0)-erf(d/(2*R0))/d)",
    coherence_rate: "Gamma_DP=E_G/hbar",
    master_equation_diffusion:
      "D_pp=G*hbar*m^2/(12*sqrt(pi)*R0^3)",
    per_axis_momentum_variance:
      "d<p_i^2>/dt=2*D_pp",
    heating: "dE/dt=3*D_pp/m=G*hbar*m/(4*sqrt(pi)*R0^3)",
  },
  domain:
    "Single effective particle with a Gaussian-smeared mass-density operator; nondissipative regularized DP dynamics.",
  does_not_supply:
    "A Casimir-boundary coupling, a unique Penrose-OR line shape, or a radiation prediction without a charged-constituent apparatus mapping.",
} as const;

const ParameterManifest = z.object({
  schema_version: z.literal("casimir_dp_dp_parameter_manifest/1"),
  model_id: z.literal(CASIMIR_DP_DP_MODEL_ID),
  model_version: z.literal("1"),
  physical_regularization: z.object({
    kind: z.literal("gaussian_mass_density_smearing"),
    R0_m: PositiveFinite,
  }).strict(),
  numerical_regularization: z.object({
    kind: z.literal("fourier_simpson_quadrature"),
    softening_m: NonnegativeFinite,
    used_as_physical_cutoff: z.literal(false),
    integration_upper_u: z.number().gte(6).lte(16),
    even_intervals: z.number().int().min(256).max(65_536)
      .refine((value) => value % 2 === 0, "even_intervals must be even"),
    crosscheck_relative_tolerance: PositiveFinite.lte(0.01),
  }).strict(),
  composition: z.object({
    kind: z.literal("single_effective_particle"),
    density_profile: z.literal("gaussian_smeared_point"),
  }).strict(),
  dynamics: z.object({
    dissipation: z.literal("none"),
    dissipative_temperature_K: z.null(),
    friction_s: z.null(),
  }).strict(),
  scan: z.object({
    masses_kg: z.array(NonnegativeFinite).min(1),
    branch_separations_m: z.array(NonnegativeFinite).min(1),
    hold_times_s: z.array(NonnegativeFinite).min(1),
  }).strict(),
}).strict().superRefine((manifest, context) => {
  for (const [field, values] of Object.entries(manifest.scan)) {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scan", field],
        message: `${field} must contain unique frozen values`,
      });
    }
  }
});

const BoundaryCell = z.object({
  blind_boundary_label: z.string().min(1),
  delta_rho_receipt_sha256: Sha256,
}).strict();

const ExternalBound = z.object({
  bound_id: z.string().min(1),
  observable: z.enum([
    "heating_W",
    "heating_W_per_kg",
    "per_axis_momentum_variance_rate_kg2_m2_s3",
  ]),
  upper_limit: PositiveFinite,
  unit: z.enum(["W", "W kg^-1", "kg^2 m^2 s^-3"]),
  source_ref: z.string().min(1),
  receipt_sha256: Sha256,
}).strict().superRefine((bound, context) => {
  const requiredUnit = {
    heating_W: "W",
    heating_W_per_kg: "W kg^-1",
    per_axis_momentum_variance_rate_kg2_m2_s3: "kg^2 m^2 s^-3",
  }[bound.observable];
  if (bound.unit !== requiredUnit) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unit"],
      message: `unit must be ${requiredUnit} for ${bound.observable}`,
    });
  }
});

export const CasimirDpDpCompanionInput = z.object({
  schema_version: z.literal("casimir_dp_dp_companion/1"),
  evidence_class: EvidenceClass,
  parameter_manifest: ParameterManifest,
  parameter_manifest_sha256: Sha256,
  fixed_branch_boundary_cells: z.array(BoundaryCell).min(2),
  heating_mapping: z.object({
    status: z.literal("registered"),
    source_ref: z.literal("doi:10.1103/PhysRevA.90.062105"),
    observable: z.literal("center_of_mass_energy_increase"),
  }).strict(),
  radiation_mapping: z.object({
    status: z.literal("absent"),
    missing_fields: z.array(z.string().min(1)).min(1),
  }).strict(),
  external_bounds: z.array(ExternalBound),
}).strict().superRefine((input, context) => {
  const labels = input.fixed_branch_boundary_cells.map(
    (cell) => cell.blind_boundary_label,
  );
  if (new Set(labels).size !== labels.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fixed_branch_boundary_cells"],
      message: "blind boundary labels must be unique",
    });
  }
});

export type CasimirDpDpCompanionInput = z.infer<
  typeof CasimirDpDpCompanionInput
>;
export type CasimirDpDpParameterManifest = z.infer<typeof ParameterManifest>;

export const CasimirDpDpRegisteredPointInput = z.object({
  mass_kg: NonnegativeFinite,
  branch_separation_m: NonnegativeFinite,
  parameter_manifest: ParameterManifest,
  parameter_manifest_sha256: Sha256,
}).strict();

export type CasimirDpDpRegisteredPointInput = z.infer<
  typeof CasimirDpDpRegisteredPointInput
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

export function sha256CasimirDpDpParameterManifest(
  manifest: CasimirDpDpParameterManifest,
): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(ParameterManifest.parse(manifest))), "utf8")
    .digest("hex");
}

function erfApprox(x: number): number {
  if (x === 0) return 0;
  const sign = x < 0 ? -1 : 1;
  const absolute = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absolute);
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t -
      0.284496736) * t +
      0.254829592) *
    t;
  return sign * (1 - polynomial * Math.exp(-absolute * absolute));
}

export function gaussianDpEnergyAnalytic(
  mass_kg: number,
  separation_m: number,
  R0_m: number,
): number {
  if (mass_kg === 0 || separation_m === 0) return 0;
  const x = separation_m / (2 * R0_m);
  const saturation = G * mass_kg * mass_kg / (Math.sqrt(PI) * R0_m);
  if (Math.abs(x) <= 0.5) {
    const x2 = x * x;
    let power = x2;
    let factorial = 1;
    let dimensionless = 0;
    for (let order = 1; order <= 18; order += 1) {
      factorial *= order;
      dimensionless +=
        (order % 2 === 1 ? 1 : -1) *
        power /
        (factorial * (2 * order + 1));
      power *= x2;
    }
    return Math.max(0, saturation * dimensionless);
  }
  const crossRatio =
    Math.sqrt(PI) * R0_m * erfApprox(x) / separation_m;
  return Math.max(0, saturation * (1 - crossRatio));
}

function sinc(value: number): number {
  const absolute = Math.abs(value);
  if (absolute < 1e-3) {
    const squared = value * value;
    return 1 - squared / 6 + squared * squared / 120 -
      squared * squared * squared / 5040;
  }
  return Math.sin(value) / value;
}

export function gaussianDpEnergyFourierCrosscheck(args: {
  mass_kg: number;
  separation_m: number;
  R0_m: number;
  integration_upper_u: number;
  even_intervals: number;
}): number {
  if (args.mass_kg === 0 || args.separation_m === 0) return 0;
  const ratio = args.separation_m / args.R0_m;
  const step = args.integration_upper_u / args.even_intervals;
  const integrand = (u: number) =>
    Math.exp(-u * u) * (1 - sinc(u * ratio));
  let sum = integrand(0) + integrand(args.integration_upper_u);
  for (let index = 1; index < args.even_intervals; index += 1) {
    sum += (index % 2 === 0 ? 2 : 4) * integrand(index * step);
  }
  const integral = sum * step / 3;
  return 2 * G * args.mass_kg * args.mass_kg * integral /
    (PI * args.R0_m);
}

function relativeDifference(left: number, right: number): number {
  if (left === 0 && right === 0) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

/**
 * Evaluate one campaign point with the exact registered Stage-3 generator.
 * The frozen scan remains a recovery fixture; it is not a restriction to only
 * the mass/separation coordinates listed in that fixture.
 */
export function evaluateCasimirDpDpRegisteredPoint(
  rawInput: CasimirDpDpRegisteredPointInput,
) {
  const input = CasimirDpDpRegisteredPointInput.parse(rawInput);
  const manifestHash = sha256CasimirDpDpParameterManifest(
    input.parameter_manifest,
  );
  if (manifestHash !== input.parameter_manifest_sha256) {
    throw new Error(
      `casimir_dp_dp_parameter_manifest_hash_mismatch:${manifestHash}`,
    );
  }

  const R0 = input.parameter_manifest.physical_regularization.R0_m;
  const numerical = input.parameter_manifest.numerical_regularization;
  const analyticEnergy = gaussianDpEnergyAnalytic(
    input.mass_kg,
    input.branch_separation_m,
    R0,
  );
  const numericalEnergy = gaussianDpEnergyFourierCrosscheck({
    mass_kg: input.mass_kg,
    separation_m: input.branch_separation_m,
    R0_m: R0,
    integration_upper_u: numerical.integration_upper_u,
    even_intervals: numerical.even_intervals,
  });
  const crosscheckError = relativeDifference(
    analyticEnergy,
    numericalEnergy,
  );
  const rate = analyticEnergy / HBAR;
  const tau = rate === 0 ? null : 1 / rate;
  const diffusion =
    G * HBAR * input.mass_kg * input.mass_kg /
    (12 * Math.sqrt(PI) * R0 ** 3);
  const perAxisMomentumVarianceRate = 2 * diffusion;
  const heating =
    input.mass_kg === 0 ? 0 : 3 * diffusion / input.mass_kg;
  const heatingPerKg =
    input.mass_kg === 0 ? null : heating / input.mass_kg;
  const saturationEnergy =
    G * input.mass_kg * input.mass_kg / (Math.sqrt(PI) * R0);

  return {
    mass_kg: input.mass_kg,
    branch_separation_m: input.branch_separation_m,
    E_G_analytic_J: analyticEnergy,
    E_G_fourier_crosscheck_J: numericalEnergy,
    E_G_crosscheck_relative_error: crosscheckError,
    E_G_crosscheck_gate:
      crosscheckError <= numerical.crosscheck_relative_tolerance
        ? "pass" as const
        : "not_ready" as const,
    saturation_E_G_J: saturationEnergy,
    saturation_fraction:
      saturationEnergy === 0 ? 0 : analyticEnergy / saturationEnergy,
    Gamma_DP_s: rate,
    tau_DP_s: tau,
    coherence: input.parameter_manifest.scan.hold_times_s.map(
      (holdTime) => ({
        hold_time_s: holdTime,
        visibility_ratio: Math.exp(-rate * holdTime),
      }),
    ),
    master_equation_D_pp_kg2_m2_s3: diffusion,
    per_axis_momentum_variance_rate_kg2_m2_s3:
      perAxisMomentumVarianceRate,
    heating_W: heating,
    heating_W_per_kg: heatingPerKg,
    parameter_manifest_sha256: manifestHash,
  };
}

export function evaluateCasimirDpDpCompanion(
  rawInput: CasimirDpDpCompanionInput,
) {
  const input = CasimirDpDpCompanionInput.parse(rawInput);
  const manifestHash = sha256CasimirDpDpParameterManifest(
    input.parameter_manifest,
  );
  if (manifestHash !== input.parameter_manifest_sha256) {
    throw new Error(
      `casimir_dp_dp_parameter_manifest_hash_mismatch:${manifestHash}`,
    );
  }

  const R0 = input.parameter_manifest.physical_regularization.R0_m;
  const numerical =
    input.parameter_manifest.numerical_regularization;
  const rows = input.parameter_manifest.scan.masses_kg.flatMap((mass) =>
    input.parameter_manifest.scan.branch_separations_m.flatMap((separation) => {
      const analyticEnergy = gaussianDpEnergyAnalytic(mass, separation, R0);
      const numericalEnergy = gaussianDpEnergyFourierCrosscheck({
        mass_kg: mass,
        separation_m: separation,
        R0_m: R0,
        integration_upper_u: numerical.integration_upper_u,
        even_intervals: numerical.even_intervals,
      });
      const crosscheckError = relativeDifference(
        analyticEnergy,
        numericalEnergy,
      );
      const rate = analyticEnergy / HBAR;
      const tau = rate === 0 ? null : 1 / rate;
      const diffusion =
        G * HBAR * mass * mass /
        (12 * Math.sqrt(PI) * R0 ** 3);
      const perAxisMomentumVarianceRate = 2 * diffusion;
      const heating = mass === 0 ? 0 : 3 * diffusion / mass;
      const heatingPerKg = mass === 0 ? null : heating / mass;
      const saturationEnergy =
        G * mass * mass / (Math.sqrt(PI) * R0);
      return [{
        mass_kg: mass,
        branch_separation_m: separation,
        E_G_analytic_J: analyticEnergy,
        E_G_fourier_crosscheck_J: numericalEnergy,
        E_G_crosscheck_relative_error: crosscheckError,
        E_G_crosscheck_gate:
          crosscheckError <= numerical.crosscheck_relative_tolerance
            ? "pass" as const
            : "not_ready" as const,
        saturation_E_G_J: saturationEnergy,
        saturation_fraction:
          saturationEnergy === 0 ? 0 : analyticEnergy / saturationEnergy,
        Gamma_DP_s: rate,
        tau_DP_s: tau,
        coherence: input.parameter_manifest.scan.hold_times_s.map(
          (holdTime) => ({
            hold_time_s: holdTime,
            visibility_ratio: Math.exp(-rate * holdTime),
          }),
        ),
        master_equation_D_pp_kg2_m2_s3: diffusion,
        per_axis_momentum_variance_rate_kg2_m2_s3:
          perAxisMomentumVarianceRate,
        heating_W: heating,
        heating_W_per_kg: heatingPerKg,
        parameter_manifest_sha256: manifestHash,
      }];
    })
  );

  const allCrosschecksPass = rows.every(
    (row) => row.E_G_crosscheck_gate === "pass",
  );
  const densityReceipts = input.fixed_branch_boundary_cells.map(
    (cell) => cell.delta_rho_receipt_sha256,
  );
  const fixedBranchNull = new Set(densityReceipts).size === 1;
  const maxima = {
    heating_W: Math.max(...rows.map((row) => row.heating_W)),
    heating_W_per_kg: Math.max(
      ...rows.map((row) => row.heating_W_per_kg ?? 0),
    ),
    per_axis_momentum_variance_rate_kg2_m2_s3: Math.max(
      ...rows.map(
        (row) => row.per_axis_momentum_variance_rate_kg2_m2_s3,
      ),
    ),
  };
  const boundComparisons = input.external_bounds.map((bound) => {
    const predicted = maxima[bound.observable];
    return {
      ...bound,
      predicted_maximum: predicted,
      ratio_to_upper_limit: predicted / bound.upper_limit,
      comparison: predicted > bound.upper_limit
        ? "exceeds" as const
        : "within" as const,
      parameter_manifest_sha256: manifestHash,
    };
  });
  const exceedsBound = boundComparisons.some(
    (comparison) => comparison.comparison === "exceeds",
  );
  const synthetic = input.evidence_class === "synthetic";
  const status = !allCrosschecksPass || !fixedBranchNull
    ? "not_ready" as const
    : synthetic
    ? "diagnostic" as const
    : exceedsBound
    ? "disfavored" as const
    : "consistent" as const;

  return {
    schema_version: "casimir_dp_dp_companion_result/1" as const,
    status,
    evidence_class: input.evidence_class,
    maximum_claim: synthetic
      ? "software_validation_only" as const
      : "named_model_parameter_region_constraint" as const,
    model_registration: CASIMIR_DP_DP_MODEL_REGISTRATION,
    parameter_manifest_sha256: manifestHash,
    parameter_roles: {
      physical_cutoff: {
        field: "physical_regularization.R0_m" as const,
        value_m: R0,
        enters_DP_dynamics: true as const,
      },
      numerical_softening: {
        field: "numerical_regularization.softening_m" as const,
        value_m: numerical.softening_m,
        enters_DP_dynamics: false as const,
      },
      roles_are_distinct: true as const,
      values_are_numerically_distinct:
        R0 !== numerical.softening_m,
    },
    penrose_or_heuristic: {
      status: allCrosschecksPass ? "diagnostic" as const : "not_ready" as const,
      convention: "tau_OR_order_of_magnitude=hbar/E_G" as const,
      rows: rows.map((row) => ({
        mass_kg: row.mass_kg,
        branch_separation_m: row.branch_separation_m,
        E_G_J: row.E_G_analytic_J,
        E_G_independent_crosscheck_J: row.E_G_fourier_crosscheck_J,
        relative_error: row.E_G_crosscheck_relative_error,
        Gamma_OR_s: row.Gamma_DP_s,
        tau_OR_s: row.tau_DP_s,
      })),
      parameter_manifest_sha256: manifestHash,
      claim_ceiling: "lifetime_compatibility_or_exclusion_only" as const,
      generative_master_equation_supplied: false as const,
    },
    named_dynamical_dp: {
      rows,
      diffusion_convention:
        "D_pp is the coefficient of -D_pp/hbar^2 sum_i[x_i,[x_i,rho]]; d<p_i^2>/dt=2D_pp." as const,
      heating_mapping: input.heating_mapping,
      radiation: {
        status: "blocked" as const,
        predicted_spectrum: null,
        analysis_band_Hz: null,
        missing_fields: input.radiation_mapping.missing_fields,
        reason:
          "No dimensional proxy is substituted for a charged-constituent radiation mapping.",
        parameter_manifest_sha256: manifestHash,
      },
      external_bound_comparisons: boundComparisons,
      parameter_region_comparison:
        synthetic
          ? "not_ready_synthetic_only" as const
          : exceedsBound
          ? "disfavored" as const
          : "not_disfavored_within_registered_bounds" as const,
      parameter_manifest_sha256: manifestHash,
      claim_ceiling: "one_named_dynamical_dp_implementation" as const,
    },
    fixed_branch_boundary_null: {
      gate: fixedBranchNull ? "pass" as const : "not_ready" as const,
      cells: input.fixed_branch_boundary_cells,
      rate_difference_s: fixedBranchNull ? 0 : null,
      interpretation:
        "The registered standard OR/DP model has no static Casimir-boundary variable at fixed delta_rho.",
      bridge_inferred: false as const,
    },
    natural_parameter_free_dp_reference: {
      status: "ruled_out_by_registered_radiation_experiment" as const,
      source_ref: "doi:10.1038/s41567-020-1008-4",
      scope:
        "This source-backed exclusion does not exclude every regularized or dissipative DP variant or the Penrose lifetime heuristic.",
    },
    measured_evidence_gate:
      input.evidence_class === "measured"
        ? "requires_joint_provenance_and_power_review" as const
        : "not_ready" as const,
    collapse_identification: "blocked" as const,
    manifold_dynamics: "blocked" as const,
  };
}
