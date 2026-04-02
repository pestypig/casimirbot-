export const ADM_GRAVITY_DIAGNOSTIC_LANE_ID =
  "adm_lane_reference_local_static_shift_plus_lapse" as const;

export type AdmGravityDiagnosticLaneId =
  typeof ADM_GRAVITY_DIAGNOSTIC_LANE_ID;

export type AdmGravityDiagnosticLaneConvention = {
  lane_id: AdmGravityDiagnosticLaneId;
  observer_family: "grid_static_local" | "eulerian_n_local";
  observer_definition_id: string;
  observer_inputs_required: string[];
  foliation: string;
  foliation_definition: string;
  sign_convention: string;
  required_fields: string[];
  is_reference_only: boolean;
  is_authoritative_for_readiness: boolean;
  semantics_closed: boolean;
  proof_status: "secondary_companion_only";
  notes: string;
};

export const ADM_GRAVITY_DIAGNOSTIC_LANE_CONVENTIONS: Record<
  AdmGravityDiagnosticLaneId,
  AdmGravityDiagnosticLaneConvention
> = {
  [ADM_GRAVITY_DIAGNOSTIC_LANE_ID]: {
    lane_id: ADM_GRAVITY_DIAGNOSTIC_LANE_ID,
    observer_family: "grid_static_local",
    observer_definition_id: "obs.grid_static_local_shift_plus_lapse_v1",
    observer_inputs_required: [
      "alpha",
      "alpha_grad_x",
      "alpha_grad_y",
      "alpha_grad_z",
      "eulerian_accel_geom_mag",
      "beta_over_alpha_mag",
    ],
    foliation: "comoving_cartesian_3p1",
    foliation_definition:
      "Local static and Eulerian companion diagnostics on the same fixed comoving Cartesian 3+1 foliation as Lane A.",
    sign_convention:
      "alphaGradientVec_m_inv is resolved on x_ship/y_port/z_zenith; eulerian_accel_geom_i = partial_i alpha / alpha; beta_over_alpha_mag = |beta| / alpha.",
    required_fields: [
      "alpha",
      "alpha_grad_x",
      "alpha_grad_y",
      "alpha_grad_z",
      "eulerian_accel_geom_x",
      "eulerian_accel_geom_y",
      "eulerian_accel_geom_z",
      "eulerian_accel_geom_mag",
      "beta_over_alpha_mag",
    ],
    is_reference_only: true,
    is_authoritative_for_readiness: false,
    semantics_closed: true,
    proof_status: "secondary_companion_only",
    notes:
      "Secondary ADM gravity companion only. Lane A remains authoritative for readiness and morphology claims.",
  },
};

export const isAdmGravityDiagnosticLaneId = (
  value: string | null | undefined,
): value is AdmGravityDiagnosticLaneId => value === ADM_GRAVITY_DIAGNOSTIC_LANE_ID;

export const normalizeAdmGravityDiagnosticLaneId = (
  value: string | null | undefined,
): AdmGravityDiagnosticLaneId =>
  isAdmGravityDiagnosticLaneId(value) ? value : ADM_GRAVITY_DIAGNOSTIC_LANE_ID;
