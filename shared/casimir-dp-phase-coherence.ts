// math-stage: diagnostic
import { z } from "zod";
import { HBAR, PI } from "./physics-const";

const EvidenceClass = z.enum([
  "measured",
  "literature_anchored",
  "design_assumption",
  "synthetic_validation",
]);

const EnergyTrace = z.object({
  state_id: z.string().min(1),
  time_s: z.array(z.number().nonnegative()).min(2),
  branch_a_energy_J: z.array(z.number()).min(2),
  branch_b_energy_J: z.array(z.number()).min(2),
  branch_a_standard_uncertainty_J: z.array(z.number().nonnegative()).nullable(),
  branch_b_standard_uncertainty_J: z.array(z.number().nonnegative()).nullable(),
  energy_model_class: z.enum([
    "qed_casimir_polder",
    "electrostatic",
    "thermal",
    "mechanical",
    "gravity",
    "candidate_bridge",
  ]),
  evidence_class: EvidenceClass,
  source_ref: z.string().min(1),
  raw_artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
}).superRefine((trace, context) => {
  const expected = trace.time_s.length;
  for (let index = 1; index < expected; index += 1) {
    if (trace.time_s[index] <= trace.time_s[index - 1]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["time_s", index],
        message: "time_s must be strictly increasing",
      });
    }
  }
  for (const field of [
    "branch_a_energy_J",
    "branch_b_energy_J",
  ] as const) {
    if (trace[field].length !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} must match time_s length`,
      });
    }
  }
  const uncertaintyFields = [
    "branch_a_standard_uncertainty_J",
    "branch_b_standard_uncertainty_J",
  ] as const;
  const uncertaintyPresence = uncertaintyFields.map((field) => trace[field] != null);
  if (uncertaintyPresence[0] !== uncertaintyPresence[1]) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["branch_a_standard_uncertainty_J"],
      message: "both branch uncertainty arrays must be supplied or both must be null",
    });
  }
  for (const field of uncertaintyFields) {
    if (trace[field] != null && trace[field]!.length !== expected) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} must match time_s length`,
      });
    }
  }
});

export const CasimirDpBoundaryPhaseInput = z.object({
  schema_version: z.literal("casimir_dp_boundary_phase/1"),
  sign_convention: z.literal("phase_a_minus_b"),
  boundary_contrast: z.literal("on_minus_off"),
  uncertainty_model: z.enum([
    "not_registered",
    "independent_samples_and_states",
  ]),
  uncertainty_model_ref: z.string().min(1).nullable(),
  uncertainty_artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  on_state_id: z.string().min(1),
  off_state_id: z.string().min(1),
  states: z.array(EnergyTrace).min(2),
}).superRefine((input, context) => {
  if (
    input.uncertainty_model === "independent_samples_and_states" &&
    input.uncertainty_model_ref == null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["uncertainty_model_ref"],
      message: "a registered uncertainty model requires a source reference",
    });
  }
});

export type CasimirDpBoundaryPhaseInput = z.infer<typeof CasimirDpBoundaryPhaseInput>;

function trapezoidalWeights(time_s: number[]): number[] {
  const weights = new Array<number>(time_s.length).fill(0);
  for (let index = 0; index < time_s.length - 1; index += 1) {
    const halfInterval = (time_s[index + 1] - time_s[index]) / 2;
    weights[index] += halfInterval;
    weights[index + 1] += halfInterval;
  }
  return weights;
}

function integrateEnergyTrace(trace: z.infer<typeof EnergyTrace>) {
  const weights = trapezoidalWeights(trace.time_s);
  let actionDifference = 0;
  let actionVariance = 0;
  for (let index = 0; index < weights.length; index += 1) {
    const energyDifference =
      trace.branch_a_energy_J[index] - trace.branch_b_energy_J[index];
    actionDifference += weights[index] * energyDifference;
    if (
      trace.branch_a_standard_uncertainty_J != null &&
      trace.branch_b_standard_uncertainty_J != null
    ) {
      actionVariance += weights[index] ** 2 * (
        trace.branch_a_standard_uncertainty_J[index] ** 2 +
        trace.branch_b_standard_uncertainty_J[index] ** 2
      );
    }
  }
  return {
    action_difference_J_s: actionDifference,
    phase_rad: -actionDifference / HBAR,
    phase_standard_uncertainty_rad:
      trace.branch_a_standard_uncertainty_J == null
        ? null
        : Math.sqrt(actionVariance) / HBAR,
  };
}

export function computeCasimirDpBoundaryPhase(rawInput: CasimirDpBoundaryPhaseInput) {
  const input = CasimirDpBoundaryPhaseInput.parse(rawInput);
  const ids = input.states.map((state) => state.state_id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("casimir_dp_boundary_phase_duplicate_state_id");
  }
  const on = input.states.find((state) => state.state_id === input.on_state_id);
  const off = input.states.find((state) => state.state_id === input.off_state_id);
  if (on == null || off == null) {
    throw new Error("casimir_dp_boundary_phase_contrast_state_missing");
  }

  const stateResults = input.states.map((state) => ({
    state_id: state.state_id,
    energy_model_class: state.energy_model_class,
    evidence_class: state.evidence_class,
    source_ref: state.source_ref,
    raw_artifact_sha256: state.raw_artifact_sha256,
    ...integrateEnergyTrace(state),
  }));
  const onResult = stateResults.find((state) => state.state_id === input.on_state_id)!;
  const offResult = stateResults.find((state) => state.state_id === input.off_state_id)!;
  const contrastVariance =
    onResult.phase_standard_uncertainty_rad == null ||
    offResult.phase_standard_uncertainty_rad == null
      ? null
      : onResult.phase_standard_uncertainty_rad ** 2 +
        offResult.phase_standard_uncertainty_rad ** 2;
  const measuredEvidenceReady = stateResults.every(
    (state) =>
      state.evidence_class === "measured" &&
      state.raw_artifact_sha256 != null,
  ) &&
    input.states.every(
      (state) =>
        state.branch_a_standard_uncertainty_J != null &&
        state.branch_b_standard_uncertainty_J != null,
    ) &&
    input.uncertainty_model === "independent_samples_and_states" &&
    input.uncertainty_model_ref != null &&
    input.uncertainty_artifact_sha256 != null;

  return {
    schema_version: "casimir_dp_boundary_phase_result/1" as const,
    sign_convention: input.sign_convention,
    boundary_contrast: input.boundary_contrast,
    uncertainty_model: input.uncertainty_model,
    uncertainty_model_ref: input.uncertainty_model_ref,
    uncertainty_artifact_sha256: input.uncertainty_artifact_sha256,
    states: stateResults,
    boundary_phase_contrast_rad: onResult.phase_rad - offResult.phase_rad,
    boundary_phase_standard_uncertainty_rad:
      contrastVariance == null ? null : Math.sqrt(contrastVariance),
    measured_evidence_gate: measuredEvidenceReady
      ? "pass" as const
      : "not_ready" as const,
    model_authority: "ordinary_branch_action_phase_diagnostic" as const,
    uncertainty_authority:
      input.uncertainty_model === "independent_samples_and_states"
        ? "registered_independent_sample_and_state_approximation" as const
        : "not_registered" as const,
    collapse_identification: "blocked" as const,
  };
}

export const CasimirDpInterferenceInput = z.object({
  schema_version: z.literal("casimir_dp_interference/1"),
  visibility: z.number().min(0).max(1),
  phase_rad: z.number(),
});

export type CasimirDpInterferenceInput = z.infer<typeof CasimirDpInterferenceInput>;

export function computeCasimirDpInterference(rawInput: CasimirDpInterferenceInput) {
  const input = CasimirDpInterferenceInput.parse(rawInput);
  const analysisPhases = [0, PI / 2, PI, 3 * PI / 2] as const;
  const probabilities = analysisPhases.map((analysisPhaseRad) => {
    const plus =
      0.5 * (
        1 +
        input.visibility * Math.cos(input.phase_rad + analysisPhaseRad)
      );
    return {
      analysis_phase_rad: analysisPhaseRad,
      p_plus: plus,
      p_minus: 1 - plus,
    };
  });
  const cosineQuadrature = probabilities[0].p_plus - probabilities[2].p_plus;
  const sineQuadrature = probabilities[3].p_plus - probabilities[1].p_plus;
  const reconstructedVisibility = Math.hypot(cosineQuadrature, sineQuadrature);
  const reconstructedPhase = Math.atan2(sineQuadrature, cosineQuadrature);

  return {
    schema_version: "casimir_dp_interference_result/1" as const,
    probabilities,
    cosine_quadrature: cosineQuadrature,
    sine_quadrature: sineQuadrature,
    reconstructed_visibility: reconstructedVisibility,
    reconstructed_phase_rad: reconstructedPhase,
    model_authority: "two_port_interference_readout" as const,
    collapse_identification: "blocked" as const,
  };
}

export function coherenceVisibilityFromRate(args: {
  initial_visibility: number;
  rate_s: number;
  observation_time_s: number;
}): number {
  if (
    !(args.initial_visibility >= 0 && args.initial_visibility <= 1) ||
    !(args.rate_s >= 0) ||
    !(args.observation_time_s >= 0)
  ) {
    throw new Error("casimir_dp_visibility_rate_invalid_input");
  }
  return args.initial_visibility * Math.exp(-args.rate_s * args.observation_time_s);
}

export function coherenceRateFromVisibility(args: {
  initial_visibility: number;
  final_visibility: number;
  observation_time_s: number;
}): number {
  if (
    !(args.initial_visibility > 0 && args.initial_visibility <= 1) ||
    !(args.final_visibility > 0 && args.final_visibility <= args.initial_visibility) ||
    !(args.observation_time_s > 0)
  ) {
    throw new Error("casimir_dp_visibility_fit_invalid_input");
  }
  return -Math.log(args.final_visibility / args.initial_visibility) /
    args.observation_time_s;
}

export function staticForceProjectionPhase(args: {
  projected_differential_force_N: number;
  branch_separation_m: number;
  observation_time_s: number;
}): number {
  if (!(args.branch_separation_m > 0) || !(args.observation_time_s > 0)) {
    throw new Error("casimir_dp_force_phase_invalid_input");
  }
  return (
    args.projected_differential_force_N *
    args.branch_separation_m *
    args.observation_time_s /
    HBAR
  );
}

export function ambientGravityPhaseControl(args: {
  mass_kg: number;
  gravitational_acceleration_m_s2: number;
  branch_separation_m: number;
  observation_time_s: number;
  maximum_boundary_correlated_phase_rad: number;
}) {
  if (
    !(args.mass_kg > 0) ||
    !(args.gravitational_acceleration_m_s2 > 0) ||
    !(args.branch_separation_m > 0) ||
    !(args.observation_time_s > 0) ||
    !(args.maximum_boundary_correlated_phase_rad > 0)
  ) {
    throw new Error("casimir_dp_ambient_gravity_phase_invalid_input");
  }
  const phasePerVerticalMetre =
    args.mass_kg *
    args.gravitational_acceleration_m_s2 *
    args.observation_time_s /
    HBAR;
  const fullyVerticalPhase =
    phasePerVerticalMetre * args.branch_separation_m;
  const maximumBoundaryCorrelatedVerticalProjection =
    args.maximum_boundary_correlated_phase_rad / phasePerVerticalMetre;
  return {
    schema_version: "casimir_dp_ambient_gravity_phase_control/1" as const,
    fully_vertical_phase_rad: fullyVerticalPhase,
    phase_per_vertical_metre_rad_m: phasePerVerticalMetre,
    maximum_boundary_correlated_vertical_projection_m:
      maximumBoundaryCorrelatedVerticalProjection,
    maximum_small_angle_tilt_rad:
      maximumBoundaryCorrelatedVerticalProjection / args.branch_separation_m,
    status: "high_risk_measured_control_required" as const,
    interpretation:
      "Ordinary unitary matter-wave phase control; not an OR collapse rate.",
  };
}
