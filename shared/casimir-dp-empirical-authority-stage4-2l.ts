// math-stage: diagnostic
import { createHash } from "node:crypto";
import {
  CasimirDpApparatusDesignManifestStage4_2L,
  CasimirDpEmpiricalAuthorityFixtureStage4_2L,
  type CasimirDpApparatusDesignManifestStage4_2L as ApparatusManifest,
  type CasimirDpEmpiricalAuthorityFixtureStage4_2L as Fixture,
  type CasimirDpEmpiricalAuthorityStage4_2LConfig as Config,
} from "./contracts/casimir-dp-empirical-authority-stage4-2l.v1";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value == null || typeof value !== "object") return Object.is(value, -0) ? 0 : value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}

export function sha256CasimirDpEmpiricalAuthorityStage4_2L(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
}

function sinc(value: number): number {
  if (Math.abs(value) < 1e-5) {
    const square = value * value;
    return 1 - square / 6 + square * square / 120;
  }
  return Math.sin(value) / value;
}

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

function rectangularSolidAngleAnalytic(args: { x: number; y: number; z: number; halfX: number; halfY: number }): number {
  const xs = [-args.halfX - args.x, args.halfX - args.x];
  const ys = [-args.halfY - args.y, args.halfY - args.y];
  let omega = 0;
  for (let ix = 0; ix < 2; ix += 1) {
    for (let iy = 0; iy < 2; iy += 1) {
      const x = xs[ix];
      const y = ys[iy];
      const r = Math.sqrt(x * x + y * y + args.z * args.z);
      const sign = (ix === iy) ? 1 : -1;
      omega += sign * Math.atan2(x * y, args.z * r);
    }
  }
  return Math.abs(omega);
}

function rectangularSolidAngleMidpoint(args: { x: number; y: number; z: number; halfX: number; halfY: number; panels: number }): number {
  const dx = 2 * args.halfX / args.panels;
  const dy = 2 * args.halfY / args.panels;
  let sum = 0;
  for (let ix = 0; ix < args.panels; ix += 1) {
    const px = -args.halfX + (ix + 0.5) * dx - args.x;
    for (let iy = 0; iy < args.panels; iy += 1) {
      const py = -args.halfY + (iy + 0.5) * dy - args.y;
      const r2 = px * px + py * py + args.z * args.z;
      sum += args.z / (r2 * Math.sqrt(r2));
    }
  }
  return sum * dx * dy;
}

function spherePolarizabilityStatic(fixture: Fixture, apparatus: ApparatusManifest): number {
  const epsilon = fixture.material_response.literature_proxy_static_permittivity;
  return 4 * Math.PI * fixture.constants.epsilon0_F_m * apparatus.object.radius_m ** 3 *
    (epsilon - 1) / (epsilon + 2);
}

function retardedCpInfinitePlaneEnergy(fixture: Fixture, apparatus: ApparatusManifest, distanceM: number): number {
  const alpha0 = spherePolarizabilityStatic(fixture, apparatus);
  return -3 * fixture.constants.hbar_J_s * fixture.constants.c_m_s * alpha0 /
    (32 * Math.PI ** 2 * fixture.constants.epsilon0_F_m * distanceM ** 4);
}

function finiteRectangleEnergy(args: {
  fixture: Fixture;
  apparatus: ApparatusManifest;
  point: [number, number, number];
  method: "analytic" | "midpoint";
}): { energy_J: number; solid_angle_sr: number; geometry_factor: number } {
  const halfX = args.apparatus.boundary.size_x_m / 2;
  const halfY = args.apparatus.boundary.size_y_m / 2;
  const common = { x: args.point[0], y: args.point[1], z: args.point[2], halfX, halfY };
  const omega = args.method === "analytic"
    ? rectangularSolidAngleAnalytic(common)
    : rectangularSolidAngleMidpoint({ ...common, panels: args.fixture.finite_geometry.quadrature_panels_per_axis });
  const factor = Math.max(0, Math.min(1, omega / (2 * Math.PI)));
  return {
    energy_J: retardedCpInfinitePlaneEnergy(args.fixture, args.apparatus, args.point[2]) * factor,
    solid_angle_sr: omega,
    geometry_factor: factor,
  };
}

function branchPhase(args: {
  fixture: Fixture;
  apparatus: ApparatusManifest;
  lateralCenteringM?: number;
  gapDeltaM?: number;
  branchTiltRad?: number;
  plateTiltRad?: number;
  method?: "analytic" | "midpoint";
}) {
  const center = args.apparatus.object.nominal_center_m;
  const d = args.apparatus.superposition.separation_m;
  const effectiveTilt = (args.branchTiltRad ?? 0) - (args.plateTiltRad ?? 0);
  const vector: [number, number, number] = [d * Math.cos(effectiveTilt), 0, d * Math.sin(effectiveTilt)];
  const base: [number, number, number] = [center[0] + (args.lateralCenteringM ?? 0), center[1], center[2] + (args.gapDeltaM ?? 0)];
  const a: [number, number, number] = [base[0] - vector[0] / 2, base[1], base[2] - vector[2] / 2];
  const b: [number, number, number] = [base[0] + vector[0] / 2, base[1], base[2] + vector[2] / 2];
  const energyA = finiteRectangleEnergy({ fixture: args.fixture, apparatus: args.apparatus, point: a, method: args.method ?? "analytic" });
  const energyB = finiteRectangleEnergy({ fixture: args.fixture, apparatus: args.apparatus, point: b, method: args.method ?? "analytic" });
  const deltaEnergy = energyB.energy_J - energyA.energy_J;
  return {
    branch_a: { point_m: a, ...energyA },
    branch_b: { point_m: b, ...energyB },
    delta_energy_J: deltaEnergy,
    phase_rad: deltaEnergy * args.apparatus.superposition.hold_time_s / args.fixture.constants.hbar_J_s,
  };
}

function centralDerivative(step: number, evaluate: (offset: number) => number): number {
  return (evaluate(step) - evaluate(-step)) / (2 * step);
}

function homogeneousSphereFormFactor(value: number): number {
  if (Math.abs(value) < 1e-4) {
    const square = value * value;
    return 1 - square / 10 + square * square / 280;
  }
  return 3 * (Math.sin(value) - value * Math.cos(value)) / (value ** 3);
}

function simpsonIntegral(integrand: (value: number) => number, upper: number, intervals: number): number {
  const step = upper / intervals;
  let sum = 0;
  for (let index = 0; index <= intervals; index += 1) {
    const value = index * step;
    const weight = index === 0 || index === intervals ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * integrand(value);
  }
  return sum * step / 3;
}

function densityFormFactor(id: Fixture["density_representations"][number]["id"], qR: number, shellFraction: number): number {
  if (id === "single_effective_gaussian") return 1;
  if (id === "homogeneous_sphere") return homogeneousSphereFormFactor(qR);
  if (id === "thin_shell") return sinc(qR);
  const coreRadiusRatio = 0.98;
  return (1 - shellFraction) * homogeneousSphereFormFactor(coreRadiusRatio * qR) + shellFraction * sinc(qR);
}

function dpEnergyForRepresentation(args: {
  fixture: Fixture;
  apparatus: ApparatusManifest;
  representation: Fixture["density_representations"][number];
  regularizationM: number;
  upper: number;
  intervals: number;
}): number {
  const radiusRatio = args.apparatus.object.radius_m / args.regularizationM;
  const separationRatio = args.apparatus.superposition.separation_m / args.regularizationM;
  const integral = simpsonIntegral((u) => {
    const form = densityFormFactor(args.representation.id, radiusRatio * u, args.representation.shell_mass_fraction);
    return Math.exp(-u * u) * form * form * (1 - sinc(separationRatio * u));
  }, args.upper, args.intervals);
  return 2 * args.fixture.constants.G_m3_kg_s2 * args.apparatus.object.mass_kg ** 2 * integral /
    (Math.PI * args.regularizationM);
}

function qlbeLocalizationFactor(args: { separationM: number; gasMassKg: number; speedMPerS: number; hbar: number; points: number }): number {
  let sum = 0;
  for (let index = 0; index < args.points; index += 1) {
    const cosine = -1 + 2 * (index + 0.5) / args.points;
    const momentumTransfer = args.gasMassKg * args.speedMPerS * Math.sqrt(2 * (1 - cosine));
    sum += 1 - sinc(momentumTransfer * args.separationM / args.hbar);
  }
  return sum / args.points;
}

export function evaluateCasimirDpEmpiricalAuthorityStage4_2L(args: {
  config: Config;
  fixture: Fixture;
  apparatus: ApparatusManifest;
}) {
  const fixture = CasimirDpEmpiricalAuthorityFixtureStage4_2L.parse(args.fixture);
  const apparatus = CasimirDpApparatusDesignManifestStage4_2L.parse(args.apparatus);
  const nominalAnalytic = branchPhase({ fixture, apparatus, method: "analytic" });
  const nominalMidpoint = branchPhase({ fixture, apparatus, method: "midpoint" });
  const energyCrosscheckError = Math.max(
    relativeError(nominalMidpoint.branch_a.energy_J, nominalAnalytic.branch_a.energy_J),
    relativeError(nominalMidpoint.branch_b.energy_J, nominalAnalytic.branch_b.energy_J),
  );
  const geometryCrosscheckGate = energyCrosscheckError <= args.config.numerical.geometry_crosscheck_relative_tolerance;

  const steps = fixture.phase_covariance.finite_difference;
  const jacobian = {
    lateral_centering_rad_per_m: centralDerivative(steps.lateral_centering_m, (offset) => branchPhase({ fixture, apparatus, lateralCenteringM: offset }).phase_rad),
    gap_rad_per_m: centralDerivative(steps.gap_m, (offset) => branchPhase({ fixture, apparatus, gapDeltaM: offset }).phase_rad),
    branch_tilt_rad_per_rad: centralDerivative(steps.branch_tilt_rad, (offset) => branchPhase({ fixture, apparatus, branchTiltRad: offset }).phase_rad),
    plate_tilt_rad_per_rad: centralDerivative(steps.plate_tilt_rad, (offset) => branchPhase({ fixture, apparatus, plateTiltRad: offset }).phase_rad),
  };
  const standardDeviations = fixture.phase_covariance.design_standard_deviations;
  const phaseVarianceContributions = {
    lateral_centering: (jacobian.lateral_centering_rad_per_m * standardDeviations.lateral_centering_m) ** 2,
    gap: (jacobian.gap_rad_per_m * standardDeviations.gap_m) ** 2,
    branch_tilt: (jacobian.branch_tilt_rad_per_rad * standardDeviations.branch_tilt_rad) ** 2,
    plate_tilt: (jacobian.plate_tilt_rad_per_rad * standardDeviations.plate_tilt_rad) ** 2,
  };
  const phaseVariance = Object.values(phaseVarianceContributions).reduce((sum, value) => sum + value, 0);
  const phaseSigma = Math.sqrt(phaseVariance);
  const controlRequirement = (derivative: number): number | null =>
    Math.abs(derivative) < 1e-30
      ? null
      : fixture.registered_dp.maximum_phase_jitter_rad / Math.abs(derivative);
  const requiredOneSigma = {
    lateral_centering_m: controlRequirement(jacobian.lateral_centering_rad_per_m),
    gap_m: controlRequirement(jacobian.gap_rad_per_m),
    branch_tilt_rad: controlRequirement(jacobian.branch_tilt_rad_per_rad),
    plate_tilt_rad: controlRequirement(jacobian.plate_tilt_rad_per_rad),
  };
  const phaseProxyGate = phaseSigma <= fixture.registered_dp.maximum_phase_jitter_rad;

  const gasRows = fixture.gas_environment.species.map((species) => {
    const partialPressure = fixture.gas_environment.total_pressure_Pa * species.pressure_fraction;
    const numberDensity = partialPressure / (fixture.constants.k_B_J_K * fixture.gas_environment.temperature_K);
    const meanSpeed = Math.sqrt(8 * fixture.constants.k_B_J_K * fixture.gas_environment.temperature_K / (Math.PI * species.molecular_mass_kg));
    const localizationFactor = qlbeLocalizationFactor({
      separationM: apparatus.superposition.separation_m,
      gasMassKg: species.molecular_mass_kg,
      speedMPerS: meanSpeed,
      hbar: fixture.constants.hbar_J_s,
      points: fixture.gas_environment.angular_quadrature_points,
    });
    const rate = numberDensity * meanSpeed * species.total_cross_section_m2 * localizationFactor;
    return { ...species, partial_pressure_Pa: partialPressure, number_density_m3: numberDensity, mean_speed_m_s: meanSpeed, localization_factor: localizationFactor, decoherence_rate_s: rate };
  });
  const qlbeRate = gasRows.reduce((sum, row) => sum + row.decoherence_rate_s, 0);
  const qlbeToDp = qlbeRate / fixture.registered_dp.rate_s;
  const pressureForTarget = fixture.gas_environment.total_pressure_Pa * fixture.gas_environment.target_fraction_of_dp_rate / qlbeToDp;
  const measuredQlbeReady = fixture.gas_environment.measured_species_receipt_available &&
    fixture.gas_environment.measured_temperature_receipt_available &&
    fixture.gas_environment.measured_differential_scattering_receipt_available &&
    fixture.gas_environment.confinement_kernel_receipt_available &&
    fixture.gas_environment.independent_pressure_calibration_available;

  const apparatusMassDa = apparatus.object.mass_kg / fixture.constants.dalton_kg;
  const statePreparation = {
    apparatus_mass_Da: apparatusMassDa,
    demonstrated_mass_Da: fixture.state_preparation.demonstrated_mass_Da,
    mass_ratio: apparatusMassDa / fixture.state_preparation.demonstrated_mass_Da,
    apparatus_separation_m: apparatus.superposition.separation_m,
    demonstrated_separation_m: fixture.state_preparation.demonstrated_separation_m,
    separation_ratio: apparatus.superposition.separation_m / fixture.state_preparation.demonstrated_separation_m,
    apparatus_diameter_m: 2 * apparatus.object.radius_m,
    demonstrated_diameter_m: fixture.state_preparation.demonstrated_particle_diameter_m,
    diameter_ratio: 2 * apparatus.object.radius_m / fixture.state_preparation.demonstrated_particle_diameter_m,
    apparatus_separation_to_diameter: apparatus.superposition.separation_m / (2 * apparatus.object.radius_m),
    demonstrated_separation_to_diameter: fixture.state_preparation.demonstrated_separation_m / fixture.state_preparation.demonstrated_particle_diameter_m,
    same_material: fixture.state_preparation.same_material,
    same_platform: fixture.state_preparation.same_platform,
    empirical_sequence: fixture.state_preparation.integrated_sequence_receipt_available ? "ready" as const : "not_ready" as const,
    scale_screen: "no_go_for_direct_demonstration_equivalence" as const,
  };

  const externalBound = {
    source_id: fixture.external_dp_bound.source_id,
    convention: fixture.external_dp_bound.convention,
    registered_R0_m: fixture.registered_dp.regularization_m,
    lower_R0_m_90CL: fixture.external_dp_bound.lower_R0_m_90CL,
    lower_R0_m_95CL: fixture.external_dp_bound.lower_R0_m_95CL,
    ratio_to_90CL_lower_bound: fixture.registered_dp.regularization_m / fixture.external_dp_bound.lower_R0_m_90CL,
    ratio_to_95CL_lower_bound: fixture.registered_dp.regularization_m / fixture.external_dp_bound.lower_R0_m_95CL,
    scalar_point_excluded: fixture.registered_dp.regularization_m <= fixture.external_dp_bound.lower_R0_m_90CL,
    exact_composite_mapping: fixture.external_dp_bound.exact_composite_mapping_receipt_available ? "ready" as const : "not_ready" as const,
    interpretation: "scalar_cutoff_screen_only_not_a_full_likelihood_or_composite_normalization_recast",
  };

  const densityGrid = fixture.density_representations.flatMap((representation) => fixture.regularization_grid_m.map((regularizationM) => {
    const energy = dpEnergyForRepresentation({
      fixture,
      apparatus,
      representation,
      regularizationM,
      upper: args.config.numerical.density_integration_upper_u,
      intervals: args.config.numerical.density_integration_intervals,
    });
    const rate = energy / fixture.constants.hbar_J_s;
    return { representation_id: representation.id, shell_mass_fraction: representation.shell_mass_fraction, regularization_m: regularizationM, E_G_J: energy, Gamma_s: rate, visibility_ratio: Math.exp(-rate * apparatus.superposition.hold_time_s) };
  }));
  const registeredRows = densityGrid.filter((row) => row.regularization_m === fixture.registered_dp.regularization_m);
  const registeredEnergies = registeredRows.map((row) => row.E_G_J);
  const densityEnvelope = {
    rows: registeredRows,
    minimum_E_G_J: Math.min(...registeredEnergies),
    maximum_E_G_J: Math.max(...registeredEnergies),
    maximum_to_minimum_ratio: Math.max(...registeredEnergies) / Math.min(...registeredEnergies),
    full_grid: densityGrid,
    authority: "computational_sensitivity_only_internal_mass_and_coating_metrology_not_ready",
  };

  const materialReady = fixture.material_response.specimen_measured_rows.length > 0 &&
    fixture.material_response.specimen_identity_matches && fixture.material_response.cryogenic_temperature_matches;
  const geometryReceiptsReady = Object.values(apparatus.receipts).every(Boolean);
  const fullGreenReady = fixture.finite_geometry.full_maxwell_green_receipt_available && fixture.finite_geometry.independent_solver_receipt_available;
  const phaseEmpiricalReady = fixture.phase_covariance.empirical_jacobian_receipt_available && fixture.phase_covariance.empirical_covariance_receipt_available;
  return {
    schema_version: "casimir_dp_empirical_authority_stage4_2l_result/1",
    apparatus_manifest: {
      manifest_id: apparatus.manifest_id,
      authority_class: apparatus.authority_class,
      branch_vector_m: apparatus.superposition.branch_vector_m,
      plate_normal: apparatus.boundary.normal,
      tangential_dot_product_m: apparatus.superposition.branch_vector_m.reduce((sum, value, index) => sum + value * apparatus.boundary.normal[index], 0),
      design_reference_frozen: true,
      as_built_receipts_ready: geometryReceiptsReady,
    },
    material_response: {
      ingestion_schema: fixture.material_response.ingestion_schema,
      specimen_measured_row_count: fixture.material_response.specimen_measured_rows.length,
      literature_proxy_source_id: fixture.material_response.literature_proxy_source_id,
      temperature_mismatch_K: Math.abs(fixture.material_response.literature_proxy_temperature_K - fixture.material_response.apparatus_temperature_K),
      measured_authority: materialReady ? "ready" as const : "not_ready" as const,
      rule: "literature_proxy_does_not_inherit_specimen_or_temperature_authority",
    },
    finite_geometry: {
      model_scope: "finite_rectangle_solid_angle_weighted_retarded_cp_surrogate_not_full_maxwell_green_tensor",
      nominal_analytic: nominalAnalytic,
      nominal_midpoint: nominalMidpoint,
      energy_crosscheck_relative_error: energyCrosscheckError,
      numerical_crosscheck_gate: geometryCrosscheckGate ? "pass" as const : "blocked" as const,
      full_maxwell_green_authority: fullGreenReady ? "ready" as const : "not_ready" as const,
    },
    phase_covariance: {
      jacobian,
      design_standard_deviations: standardDeviations,
      variance_contributions_rad2: phaseVarianceContributions,
      predicted_sigma_phi_rad: phaseSigma,
      maximum_sigma_phi_rad: fixture.registered_dp.maximum_phase_jitter_rad,
      required_one_sigma_controls: requiredOneSigma,
      synthetic_design_gate: phaseProxyGate ? "pass" as const : "no_go" as const,
      empirical_authority: phaseEmpiricalReady ? "ready" as const : "not_ready" as const,
    },
    qlbe: {
      model_scope: "isotropic_total_cross_section_qlbe_proxy_not_measured_differential_scattering",
      species: gasRows,
      total_decoherence_rate_s: qlbeRate,
      qlbe_to_dp_rate_ratio: qlbeToDp,
      pressure_for_target_fraction_of_dp_Pa: pressureForTarget,
      proxy_gate: qlbeToDp <= fixture.gas_environment.target_fraction_of_dp_rate ? "pass" as const : "no_go" as const,
      measured_authority: measuredQlbeReady ? "ready" as const : "not_ready" as const,
    },
    state_preparation: statePreparation,
    external_bound: externalBound,
    mass_density_robustness: densityEnvelope,
    hypothesis_separation: {
      ordinary_em_lane: "material_and_geometry_green_response_with_phase_covariance",
      ordinary_gas_lane: "quantum_linear_boltzmann_environmental_contraction",
      standard_dp_lane: "frozen_boundary_independent_mass_density_contraction",
      speculative_bridge_lane: "not_registered",
      observable_bridge_edges_added: 0,
    },
    outcome: {
      diagnostic_gate: geometryCrosscheckGate ? "pass" as const : "blocked" as const,
      apparatus_reference: "redesign_required_before_empirical_pilot" as const,
      residual_attribution: "blocked" as const,
      confirmatory_campaign_authorized: false,
      measured_evidence: "not_ready" as const,
      physical_viability: "not_evaluated" as const,
    },
  };
}
