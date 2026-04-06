type Vec3 = [number, number, number];

export type WarpChartLabel =
  | "lab_cartesian"
  | "comoving_cartesian"
  | "spherical_comoving"
  | "unspecified";

export type DtGammaPolicy = "assumed_zero" | "computed" | "unknown";

export type WarpMetricFamily =
  | "natario"
  | "natario_sdf"
  | "nhm2_shift_lapse"
  | "alcubierre"
  | "vdb"
  | "unknown";

export type WarpMetricFamilyAuthorityStatus =
  | "canonical_bounded_baseline_solve_family"
  | "candidate_authoritative_solve_family"
  | "secondary_metric_family";

export type WarpMetricTransportCertificationStatus =
  | "bounded_transport_proof_bearing_baseline"
  | "bounded_transport_fail_closed_reference_only"
  | "bounded_transport_not_promoted";

export type WarpMetricFamilySemantics = {
  familyAuthorityStatus: WarpMetricFamilyAuthorityStatus;
  transportCertificationStatus: WarpMetricTransportCertificationStatus;
  semanticsNote: string;
};

export type WarpAlphaProfileKind = "unit" | "linear_gradient_tapered";
export type WarpAlphaGradientAxis = "x_ship" | "y_port" | "z_zenith" | "unspecified";
export type WarpAlphaInteriorSupportKind = "bubble_interior" | "hull_interior";
export type WarpShiftLapseProfileId =
  | "baseline_mild_gradient_v1"
  | "stage1_centerline_alpha_0p9975_v1"
  | "stage1_centerline_alpha_0p995_v1"
  | "stage1_centerline_alpha_0p9925_v1"
  | "stage1_centerline_alpha_0p9900_v1"
  | "stage1_centerline_alpha_0p9875_v1"
  | "stage1_centerline_alpha_0p9850_v1"
  | "stage1_centerline_alpha_0p9825_v1"
  | "stage1_centerline_alpha_0p9800_v1"
  | "stage1_centerline_alpha_0p9775_v1"
  | "stage1_centerline_alpha_0p9750_v1"
  | "stage1_centerline_alpha_0p9725_v1"
  | "stage1_centerline_alpha_0p9700_v1"
  | "stage1_centerline_alpha_0p9675_v1"
  | "stage1_centerline_alpha_0p9650_v1"
  | "stage1_centerline_alpha_0p9625_v1"
  | "stage1_centerline_alpha_0p9600_v1"
  | "stage1_centerline_alpha_0p9575_v1"
  | "stage1_centerline_alpha_0p9550_v1"
  | "stage1_centerline_alpha_0p9525_v1"
  | "stage1_centerline_alpha_0p9500_v1"
  | "stage1_centerline_alpha_0p9475_v1"
  | "stage1_centerline_alpha_0p9450_v1"
  | "stage1_centerline_alpha_0p9425_v1"
  | "stage1_centerline_alpha_0p9400_v1"
  | "stage1_centerline_alpha_0p9375_v1"
  | "stage1_centerline_alpha_0p9350_v1"
  | "stage1_centerline_alpha_0p9325_v1"
  | "stage1_centerline_alpha_0p9300_v1"
  | "stage1_centerline_alpha_0p9275_v1"
  | "stage1_centerline_alpha_0p9250_v1"
  | "stage1_centerline_alpha_0p9225_v1"
  | "stage1_centerline_alpha_0p9200_v1"
  | "stage1_centerline_alpha_0p9175_v1"
  | "stage1_centerline_alpha_0p9150_v1"
  | "stage1_centerline_alpha_0p9125_v1"
  | "stage1_centerline_alpha_0p9100_v1"
  | "stage1_centerline_alpha_0p9075_v1"
  | "stage1_centerline_alpha_0p9050_v1"
  | "stage1_centerline_alpha_0p9025_v1"
  | "stage1_centerline_alpha_0p9000_v1"
  | "stage1_centerline_alpha_0p8975_v1"
  | "stage1_centerline_alpha_0p8950_v1"
  | "stage1_centerline_alpha_0p8925_v1"
  | "stage1_centerline_alpha_0p8900_v1"
  | "stage1_centerline_alpha_0p8875_v1"
  | "stage1_centerline_alpha_0p8850_v1"
  | "stage1_centerline_alpha_0p8825_v1"
  | "stage1_centerline_alpha_0p8800_v1"
  | "stage1_centerline_alpha_0p8775_v1"
  | "stage1_centerline_alpha_0p8750_v1"
  | "stage1_centerline_alpha_0p8725_v1"
  | "stage1_centerline_alpha_0p8700_v1"
  | "stage1_centerline_alpha_0p8675_v1"
  | "stage1_centerline_alpha_0p8650_v1"
  | "stage1_centerline_alpha_0p8625_v1"
  | "stage1_centerline_alpha_0p8600_v1"
  | "stage1_centerline_alpha_0p8575_v1"
  | "stage1_centerline_alpha_0p8550_v1"
  | "stage1_centerline_alpha_0p8525_v1"
  | "stage1_centerline_alpha_0p8500_v1"
  | "stage1_centerline_alpha_0p8475_v1"
  | "stage1_centerline_alpha_0p8450_v1"
  | "stage1_centerline_alpha_0p8425_v1"
  | "stage1_centerline_alpha_0p8400_v1"
  | "stage1_centerline_alpha_0p8375_v1"
  | "stage1_centerline_alpha_0p8350_v1"
  | "stage1_centerline_alpha_0p8325_v1"
  | "stage1_centerline_alpha_0p8300_v1"
  | "stage1_centerline_alpha_0p8275_v1"
  | "stage1_centerline_alpha_0p8250_v1"
  | "stage1_centerline_alpha_0p8225_v1"
  | "stage1_centerline_alpha_0p8200_v1"
  | "stage1_centerline_alpha_0p8175_v1"
  | "stage1_centerline_alpha_0p8150_v1"
  | "stage1_centerline_alpha_0p8125_v1"
  | "stage1_centerline_alpha_0p8100_v1"
  | "stage1_centerline_alpha_0p8075_v1"
  | "stage1_centerline_alpha_0p8050_v1"
  | "stage1_centerline_alpha_0p8025_v1"
  | "stage1_centerline_alpha_0p8000_v1"
  | "stage1_centerline_alpha_0p7975_v1"
  | "stage1_centerline_alpha_0p7950_v1"
  | "stage1_centerline_alpha_0p7925_v1"
  | "stage1_centerline_alpha_0p7900_v1"
  | "stage1_centerline_alpha_0p7875_v1"
  | "stage1_centerline_alpha_0p7850_v1"
  | "stage1_centerline_alpha_0p7825_v1"
  | "stage1_centerline_alpha_0p7800_v1"
  | "stage1_centerline_alpha_0p7775_v1"
  | "stage1_centerline_alpha_0p7750_v1"
  | "stage1_centerline_alpha_0p7725_v1"
  | "stage1_centerline_alpha_0p7700_v1";
export type WarpShiftLapseProfileStage =
  | "baseline_reference_profile"
  | "controlled_tuning_stage_1";
export type WarpShiftLapseProfile = {
  profileId: WarpShiftLapseProfileId;
  profileStage: WarpShiftLapseProfileStage;
  profileLabel: string;
  profileNote: string;
  alphaCenterlineDefault: number;
};

export type WarpLapseReferenceCalibration = {
  targetCabinGravity_si: number;
  targetCabinHeight_m: number;
  expectedAlphaGradientGeom: number;
  calibrationNote: string;
};

export type WarpMetricLapseSummary = {
  alphaCenterline: number;
  alphaMin: number;
  alphaMax: number;
  alphaProfileKind: WarpAlphaProfileKind;
  alphaGradientAxis: WarpAlphaGradientAxis;
  alphaGradientVec_m_inv?: Vec3;
  alphaInteriorSupportKind?: WarpAlphaInteriorSupportKind;
  alphaWallTaper_m?: number;
  diagnosticTier?: "diagnostic";
  signConvention?: string;
  shiftLapseProfileId?: string;
  shiftLapseProfileStage?: string;
  shiftLapseProfileLabel?: string;
  shiftLapseProfileNote?: string;
};

const SPEED_OF_LIGHT_MPS = 299_792_458;
const STANDARD_GRAVITY_MPS2 = 9.80665;

export const DEFAULT_MILD_CABIN_GRAVITY_SI = 0.5 * STANDARD_GRAVITY_MPS2;
export const DEFAULT_MILD_CABIN_HEIGHT_M = 2.5;

export const deriveWarpAlphaGradientGeomFromGravity = (
  targetCabinGravity_si: number,
): number => {
  const gravity = Math.max(0, Number.isFinite(targetCabinGravity_si) ? targetCabinGravity_si : 0);
  return gravity / (SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);
};

export const buildMildCabinGravityReferenceCalibration = (options?: {
  targetCabinGravity_si?: number;
  targetCabinHeight_m?: number;
}): WarpLapseReferenceCalibration => {
  const targetCabinGravity_si = Math.max(
    0,
    Number.isFinite(options?.targetCabinGravity_si)
      ? Number(options?.targetCabinGravity_si)
      : DEFAULT_MILD_CABIN_GRAVITY_SI,
  );
  const targetCabinHeight_m = Math.max(
    1e-6,
    Number.isFinite(options?.targetCabinHeight_m)
      ? Number(options?.targetCabinHeight_m)
      : DEFAULT_MILD_CABIN_HEIGHT_M,
  );
  return {
    targetCabinGravity_si,
    targetCabinHeight_m,
    expectedAlphaGradientGeom: deriveWarpAlphaGradientGeomFromGravity(targetCabinGravity_si),
    calibrationNote:
      "Weak-field ADM calibration: partial_i alpha ~= g_i / c^2. This reference targets mild local cabin gravity only and does not imply strong centerline lapse suppression.",
  };
};

export const DEFAULT_MILD_CABIN_GRAVITY_REFERENCE =
  buildMildCabinGravityReferenceCalibration();
export const DEFAULT_MILD_CABIN_ALPHA_GRADIENT_GEOM =
  DEFAULT_MILD_CABIN_GRAVITY_REFERENCE.expectedAlphaGradientGeom;
export const DEFAULT_WARP_SHIFT_LAPSE_PROFILE_ID: WarpShiftLapseProfileId =
  "baseline_mild_gradient_v1";
export const DEFAULT_SELECTED_SHIFT_LAPSE_PROFILE_ID: WarpShiftLapseProfileId =
  "stage1_centerline_alpha_0p995_v1";
export const STAGE1_CENTERLINE_ALPHA_ROBUSTNESS_SWEEP_PROFILE_IDS: WarpShiftLapseProfileId[] =
  [
    "stage1_centerline_alpha_0p9975_v1",
    DEFAULT_SELECTED_SHIFT_LAPSE_PROFILE_ID,
    "stage1_centerline_alpha_0p9925_v1",
    "stage1_centerline_alpha_0p9900_v1",
  ];
export const STAGE1_CENTERLINE_ALPHA_STRONGER_BOUNDARY_SWEEP_PROFILE_IDS: WarpShiftLapseProfileId[] =
  [
    "stage1_centerline_alpha_0p9875_v1",
    "stage1_centerline_alpha_0p9850_v1",
    "stage1_centerline_alpha_0p9825_v1",
    "stage1_centerline_alpha_0p9800_v1",
    "stage1_centerline_alpha_0p9775_v1",
    "stage1_centerline_alpha_0p9750_v1",
    "stage1_centerline_alpha_0p9725_v1",
    "stage1_centerline_alpha_0p9700_v1",
    "stage1_centerline_alpha_0p9675_v1",
    "stage1_centerline_alpha_0p9650_v1",
    "stage1_centerline_alpha_0p9625_v1",
    "stage1_centerline_alpha_0p9600_v1",
    "stage1_centerline_alpha_0p9575_v1",
    "stage1_centerline_alpha_0p9550_v1",
    "stage1_centerline_alpha_0p9525_v1",
    "stage1_centerline_alpha_0p9500_v1",
    "stage1_centerline_alpha_0p9475_v1",
    "stage1_centerline_alpha_0p9450_v1",
    "stage1_centerline_alpha_0p9425_v1",
    "stage1_centerline_alpha_0p9400_v1",
    "stage1_centerline_alpha_0p9375_v1",
    "stage1_centerline_alpha_0p9350_v1",
    "stage1_centerline_alpha_0p9325_v1",
    "stage1_centerline_alpha_0p9300_v1",
    "stage1_centerline_alpha_0p9275_v1",
    "stage1_centerline_alpha_0p9250_v1",
    "stage1_centerline_alpha_0p9225_v1",
    "stage1_centerline_alpha_0p9200_v1",
    "stage1_centerline_alpha_0p9175_v1",
    "stage1_centerline_alpha_0p9150_v1",
    "stage1_centerline_alpha_0p9125_v1",
    "stage1_centerline_alpha_0p9100_v1",
    "stage1_centerline_alpha_0p9075_v1",
    "stage1_centerline_alpha_0p9050_v1",
    "stage1_centerline_alpha_0p9025_v1",
    "stage1_centerline_alpha_0p9000_v1",
    "stage1_centerline_alpha_0p8975_v1",
    "stage1_centerline_alpha_0p8950_v1",
    "stage1_centerline_alpha_0p8925_v1",
    "stage1_centerline_alpha_0p8900_v1",
    "stage1_centerline_alpha_0p8875_v1",
    "stage1_centerline_alpha_0p8850_v1",
    "stage1_centerline_alpha_0p8825_v1",
    "stage1_centerline_alpha_0p8800_v1",
    "stage1_centerline_alpha_0p8775_v1",
    "stage1_centerline_alpha_0p8750_v1",
    "stage1_centerline_alpha_0p8725_v1",
    "stage1_centerline_alpha_0p8700_v1",
    "stage1_centerline_alpha_0p8675_v1",
    "stage1_centerline_alpha_0p8650_v1",
    "stage1_centerline_alpha_0p8625_v1",
    "stage1_centerline_alpha_0p8600_v1",
    "stage1_centerline_alpha_0p8575_v1",
    "stage1_centerline_alpha_0p8550_v1",
    "stage1_centerline_alpha_0p8525_v1",
    "stage1_centerline_alpha_0p8500_v1",
    "stage1_centerline_alpha_0p8475_v1",
    "stage1_centerline_alpha_0p8450_v1",
    "stage1_centerline_alpha_0p8425_v1",
    "stage1_centerline_alpha_0p8400_v1",
    "stage1_centerline_alpha_0p8375_v1",
    "stage1_centerline_alpha_0p8350_v1",
    "stage1_centerline_alpha_0p8325_v1",
    "stage1_centerline_alpha_0p8300_v1",
    "stage1_centerline_alpha_0p8275_v1",
    "stage1_centerline_alpha_0p8250_v1",
    "stage1_centerline_alpha_0p8225_v1",
    "stage1_centerline_alpha_0p8200_v1",
    "stage1_centerline_alpha_0p8175_v1",
    "stage1_centerline_alpha_0p8150_v1",
    "stage1_centerline_alpha_0p8125_v1",
    "stage1_centerline_alpha_0p8100_v1",
    "stage1_centerline_alpha_0p8075_v1",
    "stage1_centerline_alpha_0p8050_v1",
    "stage1_centerline_alpha_0p8025_v1",
    "stage1_centerline_alpha_0p8000_v1",
    "stage1_centerline_alpha_0p7975_v1",
    "stage1_centerline_alpha_0p7950_v1",
    "stage1_centerline_alpha_0p7925_v1",
    "stage1_centerline_alpha_0p7900_v1",
    "stage1_centerline_alpha_0p7875_v1",
    "stage1_centerline_alpha_0p7850_v1",
    "stage1_centerline_alpha_0p7825_v1",
    "stage1_centerline_alpha_0p7800_v1",
    "stage1_centerline_alpha_0p7775_v1",
    "stage1_centerline_alpha_0p7750_v1",
    "stage1_centerline_alpha_0p7725_v1",
    "stage1_centerline_alpha_0p7700_v1",
  ];

const WARP_SHIFT_LAPSE_PROFILE_TABLE: Record<
  WarpShiftLapseProfileId,
  WarpShiftLapseProfile
> = {
  baseline_mild_gradient_v1: {
    profileId: "baseline_mild_gradient_v1",
    profileStage: "baseline_reference_profile",
    profileLabel: "Baseline mild lapse reference",
    profileNote:
      "Baseline NHM2 shift+lapse reference profile: centerline alpha remains unity and the existing mild diagnostic gradient/support settings remain unchanged.",
    alphaCenterlineDefault: 1,
  },
  stage1_centerline_alpha_0p9975_v1: {
    profileId: "stage1_centerline_alpha_0p9975_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9975",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse robustness-sweep profile: centerline alpha is reduced to 0.9975 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9975,
  },
  stage1_centerline_alpha_0p995_v1: {
    profileId: "stage1_centerline_alpha_0p995_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.995",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse tuning profile: centerline alpha is reduced to 0.995 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.995,
  },
  stage1_centerline_alpha_0p9925_v1: {
    profileId: "stage1_centerline_alpha_0p9925_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9925",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse robustness-sweep profile: centerline alpha is reduced to 0.9925 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9925,
  },
  stage1_centerline_alpha_0p9900_v1: {
    profileId: "stage1_centerline_alpha_0p9900_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9900",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse robustness-sweep profile: centerline alpha is reduced to 0.9900 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.99,
  },
  stage1_centerline_alpha_0p9875_v1: {
    profileId: "stage1_centerline_alpha_0p9875_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9875",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary profile: centerline alpha is reduced to 0.9875 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9875,
  },
  stage1_centerline_alpha_0p9850_v1: {
    profileId: "stage1_centerline_alpha_0p9850_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9850",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary profile: centerline alpha is reduced to 0.9850 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.985,
  },
  stage1_centerline_alpha_0p9825_v1: {
    profileId: "stage1_centerline_alpha_0p9825_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9825",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary profile: centerline alpha is reduced to 0.9825 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9825,
  },
  stage1_centerline_alpha_0p9800_v1: {
    profileId: "stage1_centerline_alpha_0p9800_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9800",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary profile: centerline alpha is reduced to 0.9800 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.98,
  },
  stage1_centerline_alpha_0p9775_v1: {
    profileId: "stage1_centerline_alpha_0p9775_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9775",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9775 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9775,
  },
  stage1_centerline_alpha_0p9750_v1: {
    profileId: "stage1_centerline_alpha_0p9750_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9750",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9750 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.975,
  },
  stage1_centerline_alpha_0p9725_v1: {
    profileId: "stage1_centerline_alpha_0p9725_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9725",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9725 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9725,
  },
  stage1_centerline_alpha_0p9700_v1: {
    profileId: "stage1_centerline_alpha_0p9700_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9700",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9700 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.97,
  },
  stage1_centerline_alpha_0p9675_v1: {
    profileId: "stage1_centerline_alpha_0p9675_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9675",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9675 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9675,
  },
  stage1_centerline_alpha_0p9650_v1: {
    profileId: "stage1_centerline_alpha_0p9650_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9650",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9650 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.965,
  },
  stage1_centerline_alpha_0p9625_v1: {
    profileId: "stage1_centerline_alpha_0p9625_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9625",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9625 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9625,
  },
  stage1_centerline_alpha_0p9600_v1: {
    profileId: "stage1_centerline_alpha_0p9600_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9600",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9600 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.96,
  },
  stage1_centerline_alpha_0p9575_v1: {
    profileId: "stage1_centerline_alpha_0p9575_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9575",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9575 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9575,
  },
  stage1_centerline_alpha_0p9550_v1: {
    profileId: "stage1_centerline_alpha_0p9550_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9550",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9550 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.955,
  },
  stage1_centerline_alpha_0p9525_v1: {
    profileId: "stage1_centerline_alpha_0p9525_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9525",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9525 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9525,
  },
  stage1_centerline_alpha_0p9500_v1: {
    profileId: "stage1_centerline_alpha_0p9500_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9500",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9500 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.95,
  },
  stage1_centerline_alpha_0p9475_v1: {
    profileId: "stage1_centerline_alpha_0p9475_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9475",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9475 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9475,
  },
  stage1_centerline_alpha_0p9450_v1: {
    profileId: "stage1_centerline_alpha_0p9450_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9450",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9450 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.945,
  },
  stage1_centerline_alpha_0p9425_v1: {
    profileId: "stage1_centerline_alpha_0p9425_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9425",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9425 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9425,
  },
  stage1_centerline_alpha_0p9400_v1: {
    profileId: "stage1_centerline_alpha_0p9400_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9400",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9400 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.94,
  },
  stage1_centerline_alpha_0p9375_v1: {
    profileId: "stage1_centerline_alpha_0p9375_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9375",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9375 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9375,
  },
  stage1_centerline_alpha_0p9350_v1: {
    profileId: "stage1_centerline_alpha_0p9350_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9350",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9350 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.935,
  },
  stage1_centerline_alpha_0p9325_v1: {
    profileId: "stage1_centerline_alpha_0p9325_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9325",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9325 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9325,
  },
  stage1_centerline_alpha_0p9300_v1: {
    profileId: "stage1_centerline_alpha_0p9300_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9300",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9300 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.93,
  },
  stage1_centerline_alpha_0p9275_v1: {
    profileId: "stage1_centerline_alpha_0p9275_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9275",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9275 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9275,
  },
  stage1_centerline_alpha_0p9250_v1: {
    profileId: "stage1_centerline_alpha_0p9250_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9250",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9250 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.925,
  },
  stage1_centerline_alpha_0p9225_v1: {
    profileId: "stage1_centerline_alpha_0p9225_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9225",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9225 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9225,
  },
  stage1_centerline_alpha_0p9200_v1: {
    profileId: "stage1_centerline_alpha_0p9200_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9200",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9200 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.92,
  },
  stage1_centerline_alpha_0p9175_v1: {
    profileId: "stage1_centerline_alpha_0p9175_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9175",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9175 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9175,
  },
  stage1_centerline_alpha_0p9150_v1: {
    profileId: "stage1_centerline_alpha_0p9150_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9150",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9150 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.915,
  },
  stage1_centerline_alpha_0p9125_v1: {
    profileId: "stage1_centerline_alpha_0p9125_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9125",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9125 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9125,
  },
  stage1_centerline_alpha_0p9100_v1: {
    profileId: "stage1_centerline_alpha_0p9100_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9100",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9100 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.91,
  },
  stage1_centerline_alpha_0p9075_v1: {
    profileId: "stage1_centerline_alpha_0p9075_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9075",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9075 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9075,
  },
  stage1_centerline_alpha_0p9050_v1: {
    profileId: "stage1_centerline_alpha_0p9050_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9050",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9050 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.905,
  },
  stage1_centerline_alpha_0p9025_v1: {
    profileId: "stage1_centerline_alpha_0p9025_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9025",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9025 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9025,
  },
  stage1_centerline_alpha_0p9000_v1: {
    profileId: "stage1_centerline_alpha_0p9000_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.9000",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.9000 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.9,
  },
  stage1_centerline_alpha_0p8975_v1: {
    profileId: "stage1_centerline_alpha_0p8975_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8975",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8975 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8975,
  },
  stage1_centerline_alpha_0p8950_v1: {
    profileId: "stage1_centerline_alpha_0p8950_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8950",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8950 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.895,
  },
  stage1_centerline_alpha_0p8925_v1: {
    profileId: "stage1_centerline_alpha_0p8925_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8925",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8925 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8925,
  },
  stage1_centerline_alpha_0p8900_v1: {
    profileId: "stage1_centerline_alpha_0p8900_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8900",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8900 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.89,
  },
  stage1_centerline_alpha_0p8875_v1: {
    profileId: "stage1_centerline_alpha_0p8875_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8875",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8875 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8875,
  },
  stage1_centerline_alpha_0p8850_v1: {
    profileId: "stage1_centerline_alpha_0p8850_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8850",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8850 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.885,
  },
  stage1_centerline_alpha_0p8825_v1: {
    profileId: "stage1_centerline_alpha_0p8825_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8825",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8825 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8825,
  },
  stage1_centerline_alpha_0p8800_v1: {
    profileId: "stage1_centerline_alpha_0p8800_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8800",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8800 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.88,
  },
  stage1_centerline_alpha_0p8775_v1: {
    profileId: "stage1_centerline_alpha_0p8775_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8775",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8775 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8775,
  },
  stage1_centerline_alpha_0p8750_v1: {
    profileId: "stage1_centerline_alpha_0p8750_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8750",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8750 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.875,
  },
  stage1_centerline_alpha_0p8725_v1: {
    profileId: "stage1_centerline_alpha_0p8725_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8725",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8725 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8725,
  },
  stage1_centerline_alpha_0p8700_v1: {
    profileId: "stage1_centerline_alpha_0p8700_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8700",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8700 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.87,
  },
  stage1_centerline_alpha_0p8675_v1: {
    profileId: "stage1_centerline_alpha_0p8675_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8675",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8675 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8675,
  },
  stage1_centerline_alpha_0p8650_v1: {
    profileId: "stage1_centerline_alpha_0p8650_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8650",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8650 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.865,
  },
  stage1_centerline_alpha_0p8625_v1: {
    profileId: "stage1_centerline_alpha_0p8625_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8625",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8625 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8625,
  },
  stage1_centerline_alpha_0p8600_v1: {
    profileId: "stage1_centerline_alpha_0p8600_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8600",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8600 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.86,
  },
  stage1_centerline_alpha_0p8575_v1: {
    profileId: "stage1_centerline_alpha_0p8575_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8575",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8575 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8575,
  },
  stage1_centerline_alpha_0p8550_v1: {
    profileId: "stage1_centerline_alpha_0p8550_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8550",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8550 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.855,
  },
  stage1_centerline_alpha_0p8525_v1: {
    profileId: "stage1_centerline_alpha_0p8525_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8525",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8525 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8525,
  },
  stage1_centerline_alpha_0p8500_v1: {
    profileId: "stage1_centerline_alpha_0p8500_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8500",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8500 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.85,
  },
  stage1_centerline_alpha_0p8475_v1: {
    profileId: "stage1_centerline_alpha_0p8475_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8475",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8475 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8475,
  },
  stage1_centerline_alpha_0p8450_v1: {
    profileId: "stage1_centerline_alpha_0p8450_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8450",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8450 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.845,
  },
  stage1_centerline_alpha_0p8425_v1: {
    profileId: "stage1_centerline_alpha_0p8425_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8425",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8425 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8425,
  },
  stage1_centerline_alpha_0p8400_v1: {
    profileId: "stage1_centerline_alpha_0p8400_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8400",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8400 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.84,
  },
  stage1_centerline_alpha_0p8375_v1: {
    profileId: "stage1_centerline_alpha_0p8375_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8375",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8375 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8375,
  },
  stage1_centerline_alpha_0p8350_v1: {
    profileId: "stage1_centerline_alpha_0p8350_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8350",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8350 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.835,
  },
  stage1_centerline_alpha_0p8325_v1: {
    profileId: "stage1_centerline_alpha_0p8325_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8325",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8325 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8325,
  },
  stage1_centerline_alpha_0p8300_v1: {
    profileId: "stage1_centerline_alpha_0p8300_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8300",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8300 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.83,
  },
  stage1_centerline_alpha_0p8275_v1: {
    profileId: "stage1_centerline_alpha_0p8275_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8275",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8275 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8275,
  },
  stage1_centerline_alpha_0p8250_v1: {
    profileId: "stage1_centerline_alpha_0p8250_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8250",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8250 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.825,
  },
  stage1_centerline_alpha_0p8225_v1: {
    profileId: "stage1_centerline_alpha_0p8225_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8225",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8225 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8225,
  },
  stage1_centerline_alpha_0p8200_v1: {
    profileId: "stage1_centerline_alpha_0p8200_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8200",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8200 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.82,
  },
  stage1_centerline_alpha_0p8175_v1: {
    profileId: "stage1_centerline_alpha_0p8175_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8175",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8175 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8175,
  },
  stage1_centerline_alpha_0p8150_v1: {
    profileId: "stage1_centerline_alpha_0p8150_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8150",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8150 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.815,
  },
  stage1_centerline_alpha_0p8125_v1: {
    profileId: "stage1_centerline_alpha_0p8125_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8125",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8125 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8125,
  },
  stage1_centerline_alpha_0p8100_v1: {
    profileId: "stage1_centerline_alpha_0p8100_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8100",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8100 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.81,
  },
  stage1_centerline_alpha_0p8075_v1: {
    profileId: "stage1_centerline_alpha_0p8075_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8075",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8075 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8075,
  },
  stage1_centerline_alpha_0p8050_v1: {
    profileId: "stage1_centerline_alpha_0p8050_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8050",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8050 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.805,
  },
  stage1_centerline_alpha_0p8025_v1: {
    profileId: "stage1_centerline_alpha_0p8025_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8025",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8025 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8025,
  },
  stage1_centerline_alpha_0p8000_v1: {
    profileId: "stage1_centerline_alpha_0p8000_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.8000",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.8000 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.8,
  },
  stage1_centerline_alpha_0p7975_v1: {
    profileId: "stage1_centerline_alpha_0p7975_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7975",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7975 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7975,
  },
  stage1_centerline_alpha_0p7950_v1: {
    profileId: "stage1_centerline_alpha_0p7950_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7950",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7950 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.795,
  },
  stage1_centerline_alpha_0p7925_v1: {
    profileId: "stage1_centerline_alpha_0p7925_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7925",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7925 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7925,
  },
  stage1_centerline_alpha_0p7900_v1: {
    profileId: "stage1_centerline_alpha_0p7900_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7900",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7900 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.79,
  },
  stage1_centerline_alpha_0p7875_v1: {
    profileId: "stage1_centerline_alpha_0p7875_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7875",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7875 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7875,
  },
  stage1_centerline_alpha_0p7850_v1: {
    profileId: "stage1_centerline_alpha_0p7850_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7850",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7850 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.785,
  },
  stage1_centerline_alpha_0p7825_v1: {
    profileId: "stage1_centerline_alpha_0p7825_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7825",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7825 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7825,
  },
  stage1_centerline_alpha_0p7800_v1: {
    profileId: "stage1_centerline_alpha_0p7800_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7800",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7800 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.78,
  },
  stage1_centerline_alpha_0p7775_v1: {
    profileId: "stage1_centerline_alpha_0p7775_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7775",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7775 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7775,
  },
  stage1_centerline_alpha_0p7750_v1: {
    profileId: "stage1_centerline_alpha_0p7750_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7750",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7750 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.775,
  },
  stage1_centerline_alpha_0p7725_v1: {
    profileId: "stage1_centerline_alpha_0p7725_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7725",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7725 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.7725,
  },
  stage1_centerline_alpha_0p7700_v1: {
    profileId: "stage1_centerline_alpha_0p7700_v1",
    profileStage: "controlled_tuning_stage_1",
    profileLabel: "Stage 1 centerline alpha 0.7700",
    profileNote:
      "Controlled stage-1 NHM2 shift+lapse stronger-side boundary extension profile: centerline alpha is reduced to 0.7700 while the existing mild diagnostic gradient, support, and taper settings remain unchanged.",
    alphaCenterlineDefault: 0.77,
  },
};

export const resolveWarpShiftLapseProfile = (
  profileId?: string | null,
): WarpShiftLapseProfile => {
  const normalized = profileId?.trim();
  if (
    normalized &&
    Object.prototype.hasOwnProperty.call(WARP_SHIFT_LAPSE_PROFILE_TABLE, normalized)
  ) {
    return WARP_SHIFT_LAPSE_PROFILE_TABLE[
      normalized as WarpShiftLapseProfileId
    ];
  }
  return WARP_SHIFT_LAPSE_PROFILE_TABLE[DEFAULT_WARP_SHIFT_LAPSE_PROFILE_ID];
};

export type WarpChartContract = {
  label: WarpChartLabel;
  dtGammaPolicy: DtGammaPolicy;
  coordinateMap?: string;
  notes?: string;
  contractStatus?: "ok" | "override" | "unknown";
  contractReason?: string;
};

type ShiftVectorField = {
  amplitude?: number;
  evaluateShiftVector?: (x: number, y: number, z: number) => Vec3;
};

type HodgeDiagnostics = {
  maxDiv?: number;
  rmsDiv?: number;
  maxCurl?: number;
  rmsCurl?: number;
  grid?: [number, number, number];
  domain?: { min: Vec3; max: Vec3 };
};

type VdbConformalDiagnostics = {
  bMin?: number;
  bMax?: number;
  bprimeMin?: number;
  bprimeMax?: number;
  bdoubleMin?: number;
  bdoubleMax?: number;
  betaAmplitude?: number;
};

export type WarpMetricAdapterSnapshot = {
  family: WarpMetricFamily;
  familyAuthorityStatus: WarpMetricFamilyAuthorityStatus;
  transportCertificationStatus: WarpMetricTransportCertificationStatus;
  semanticsNote: string;
  chart: WarpChartContract;
  alpha: number;
  lapseSummary?: WarpMetricLapseSummary;
  gammaDiag: [number, number, number];
  betaSource: "shiftVectorField" | "none";
  requestedFieldType?: string;
  betaDiagnostics?: {
    method:
      | "hodge-grid"
      | "finite-diff"
      | "hodge-grid+conformal"
      | "finite-diff+conformal"
      | "not-computed";
    thetaMax?: number;
    thetaRms?: number;
    divBetaMaxAbs?: number;
    divBetaRms?: number;
    curlMax?: number;
    curlRms?: number;
    thetaConformalMax?: number;
    thetaConformalRms?: number;
    bPrimeOverBMax?: number;
    bDoubleOverBMax?: number;
    sampleCount?: number;
    step_m?: number;
    note?: string;
  };
};

export type WarpMetricAdapterInput = {
  family: WarpMetricFamily;
  chart?: Partial<WarpChartContract>;
  alpha?: number;
  lapseSummary?: WarpMetricLapseSummary;
  gammaDiag?: [number, number, number];
  shiftVectorField?: ShiftVectorField;
  requestedFieldType?: string;
  hodgeDiagnostics?: HodgeDiagnostics;
  vdbConformalDiagnostics?: VdbConformalDiagnostics;
  betaDiagnostics?: WarpMetricAdapterSnapshot["betaDiagnostics"];
  expansionScalar?: number;
  curlMagnitude?: number;
  sampleScale_m?: number;
  sampleCount?: number;
  dtGammaProvided?: boolean;
  note?: string;
};

const DEFAULT_CHART: WarpChartContract = {
  label: "comoving_cartesian",
  dtGammaPolicy: "assumed_zero",
};

const DEFAULT_DT_GAMMA_POLICY: Record<WarpChartLabel, DtGammaPolicy> = {
  lab_cartesian: "computed",
  comoving_cartesian: "assumed_zero",
  spherical_comoving: "assumed_zero",
  unspecified: "unknown",
};

const DEFAULT_CHART_DESCRIPTIONS: Record<
  WarpChartLabel,
  { coordinateMap?: string; notes?: string }
> = {
  lab_cartesian: {
    coordinateMap: "lab frame (t, x, y, z)",
    notes: "lab slicing; dt gamma computed when available",
  },
  comoving_cartesian: {
    coordinateMap: "comoving_cartesian: x' = x - x_s(t), t = t",
    notes: "bubble-centered chart; dt gamma assumed zero",
  },
  spherical_comoving: {
    coordinateMap: "spherical_comoving: (r,theta,phi) with x-axis as polar",
    notes: "comoving spherical chart for divergence-free shift fields",
  },
  unspecified: {
    coordinateMap: "unspecified",
    notes: "chart label or coordinate map not provided",
  },
};

export const deriveWarpMetricFamilySemantics = (
  family: WarpMetricFamily,
): WarpMetricFamilySemantics => {
  switch (family) {
    case "natario_sdf":
      return {
        familyAuthorityStatus: "canonical_bounded_baseline_solve_family",
        transportCertificationStatus: "bounded_transport_proof_bearing_baseline",
        semanticsNote:
          "Canonical bounded baseline full-solve family for the current proof-bearing transport stack.",
      };
    case "nhm2_shift_lapse":
      return {
        familyAuthorityStatus: "candidate_authoritative_solve_family",
        transportCertificationStatus: "bounded_transport_fail_closed_reference_only",
        semanticsNote:
          "Distinct full-solve family candidate in provenance/model-selection; default bounded transport certification remains fail-closed/reference-only unless an explicitly selected solve passes the authoritative shift-lapse transport-promotion gate.",
      };
    case "natario":
      return {
        familyAuthorityStatus: "secondary_metric_family",
        transportCertificationStatus: "bounded_transport_not_promoted",
        semanticsNote:
          "Metric-derived unit-lapse Natario family retained outside the current bounded-transport baseline surface.",
      };
    case "alcubierre":
      return {
        familyAuthorityStatus: "secondary_metric_family",
        transportCertificationStatus: "bounded_transport_not_promoted",
        semanticsNote:
          "Comparator metric family; not the bounded-transport baseline and not promoted for proof-bearing transport claims.",
      };
    case "vdb":
      return {
        familyAuthorityStatus: "secondary_metric_family",
        transportCertificationStatus: "bounded_transport_not_promoted",
        semanticsNote:
          "Auxiliary metric family used for reference/comparison semantics, not as a promoted bounded-transport family.",
      };
    default:
      return {
        familyAuthorityStatus: "secondary_metric_family",
        transportCertificationStatus: "bounded_transport_not_promoted",
        semanticsNote:
          "Metric family semantics are not promoted beyond secondary/reference use in the current bounded stack.",
      };
  }
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const smoothstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const normalize = (v: Vec3): Vec3 => {
  const m = Math.hypot(v[0], v[1], v[2]);
  if (!m) return [0, 0, 0];
  return [v[0] / m, v[1] / m, v[2] / m];
};

const normalizeBetaDiagnostics = (
  betaDiagnostics: WarpMetricAdapterSnapshot["betaDiagnostics"] | undefined,
): WarpMetricAdapterSnapshot["betaDiagnostics"] | undefined => {
  if (!betaDiagnostics) return betaDiagnostics;
  const normalized = { ...betaDiagnostics };
  const thetaMax = isFiniteNumber(normalized.thetaMax)
    ? normalized.thetaMax
    : isFiniteNumber(normalized.divBetaMaxAbs)
      ? normalized.divBetaMaxAbs
      : undefined;
  const thetaRms = isFiniteNumber(normalized.thetaRms)
    ? normalized.thetaRms
    : isFiniteNumber(normalized.divBetaRms)
      ? normalized.divBetaRms
      : undefined;
  if (thetaMax !== undefined) {
    normalized.thetaMax = thetaMax;
    normalized.divBetaMaxAbs = thetaMax;
  }
  if (thetaRms !== undefined) {
    normalized.thetaRms = thetaRms;
    normalized.divBetaRms = thetaRms;
  }
  return normalized;
};

const buildSamplePoints = (scale: number, count: number): Vec3[] => {
  const safeScale = Math.max(1e-9, Math.abs(scale));
  const radii = [safeScale * 0.5, safeScale];
  const directions: Vec3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];
  const points: Vec3[] = [[0, 0, 0]];
  for (const dir of directions) {
    const nd = normalize(dir);
    for (const r of radii) {
      points.push([nd[0] * r, nd[1] * r, nd[2] * r]);
      if (points.length >= count) return points;
    }
  }
  return points.slice(0, count);
};

const finiteDiffDiagnostics = (
  evaluate: (x: number, y: number, z: number) => Vec3,
  points: Vec3[],
  step: number,
) => {
  const h = Math.max(1e-9, Math.abs(step));
  let maxDiv = 0;
  let sumDiv2 = 0;
  let maxCurl = 0;
  let sumCurl2 = 0;
  let sampleCount = 0;

  for (const p of points) {
    const [x, y, z] = p;
    const xp = evaluate(x + h, y, z);
    const xm = evaluate(x - h, y, z);
    const yp = evaluate(x, y + h, z);
    const ym = evaluate(x, y - h, z);
    const zp = evaluate(x, y, z + h);
    const zm = evaluate(x, y, z - h);

    if (
      !xp.every(isFiniteNumber) ||
      !xm.every(isFiniteNumber) ||
      !yp.every(isFiniteNumber) ||
      !ym.every(isFiniteNumber) ||
      !zp.every(isFiniteNumber) ||
      !zm.every(isFiniteNumber)
    ) {
      continue;
    }

    const dBx_dx = (xp[0] - xm[0]) / (2 * h);
    const dBy_dx = (xp[1] - xm[1]) / (2 * h);
    const dBz_dx = (xp[2] - xm[2]) / (2 * h);
    const dBx_dy = (yp[0] - ym[0]) / (2 * h);
    const dBy_dy = (yp[1] - ym[1]) / (2 * h);
    const dBz_dy = (yp[2] - ym[2]) / (2 * h);
    const dBx_dz = (zp[0] - zm[0]) / (2 * h);
    const dBy_dz = (zp[1] - zm[1]) / (2 * h);
    const dBz_dz = (zp[2] - zm[2]) / (2 * h);

    const div = dBx_dx + dBy_dy + dBz_dz;
    const curlX = dBz_dy - dBy_dz;
    const curlY = dBx_dz - dBz_dx;
    const curlZ = dBy_dx - dBx_dy;
    const curlMag = Math.hypot(curlX, curlY, curlZ);

    if (Number.isFinite(div)) {
      maxDiv = Math.max(maxDiv, Math.abs(div));
      sumDiv2 += div * div;
    }
    if (Number.isFinite(curlMag)) {
      maxCurl = Math.max(maxCurl, Math.abs(curlMag));
      sumCurl2 += curlMag * curlMag;
    }
    sampleCount += 1;
  }

  if (sampleCount === 0) return null;
  return {
    maxDiv,
    rmsDiv: Math.sqrt(sumDiv2 / sampleCount),
    maxCurl,
    rmsCurl: Math.sqrt(sumCurl2 / sampleCount),
    sampleCount,
  };
};

const maxAbsPair = (a: unknown, b: unknown): number | undefined => {
  const an = isFiniteNumber(a) ? Math.abs(a) : undefined;
  const bn = isFiniteNumber(b) ? Math.abs(b) : undefined;
  if (an == null && bn == null) return undefined;
  return Math.max(an ?? 0, bn ?? 0);
};

const resolveAlphaGradientAxis = (gradient: Vec3 | undefined): WarpAlphaGradientAxis => {
  if (!gradient) return "unspecified";
  const [gx, gy, gz] = gradient.map((value) =>
    isFiniteNumber(value) ? Math.abs(value) : 0,
  ) as Vec3;
  const max = Math.max(gx, gy, gz);
  if (!(max > 0)) return "unspecified";
  if (max === gx) return "x_ship";
  if (max === gy) return "y_port";
  return "z_zenith";
};

const sanitizeLapseSummary = (
  summary: WarpMetricLapseSummary | undefined,
): WarpMetricLapseSummary | undefined => {
  if (!summary) return undefined;
  const alphaCenterline = isFiniteNumber(summary.alphaCenterline)
    ? Math.max(1e-6, summary.alphaCenterline)
    : 1;
  const alphaMinRaw = isFiniteNumber(summary.alphaMin) ? summary.alphaMin : alphaCenterline;
  const alphaMaxRaw = isFiniteNumber(summary.alphaMax) ? summary.alphaMax : alphaCenterline;
  const alphaMin = Math.max(1e-6, Math.min(alphaMinRaw, alphaMaxRaw));
  const alphaMax = Math.max(alphaMin, alphaMaxRaw);
  const alphaGradientVec =
    Array.isArray(summary.alphaGradientVec_m_inv) &&
    summary.alphaGradientVec_m_inv.length >= 3 &&
    summary.alphaGradientVec_m_inv.every(isFiniteNumber)
      ? ([
          Number(summary.alphaGradientVec_m_inv[0]),
          Number(summary.alphaGradientVec_m_inv[1]),
          Number(summary.alphaGradientVec_m_inv[2]),
        ] as Vec3)
      : undefined;
  const alphaGradientAxis =
    summary.alphaGradientAxis && summary.alphaGradientAxis !== "unspecified"
      ? summary.alphaGradientAxis
      : resolveAlphaGradientAxis(alphaGradientVec);
  return {
    alphaCenterline,
    alphaMin,
    alphaMax,
    alphaProfileKind:
      summary.alphaProfileKind === "linear_gradient_tapered"
        ? "linear_gradient_tapered"
        : "unit",
    alphaGradientAxis,
    ...(alphaGradientVec ? { alphaGradientVec_m_inv: alphaGradientVec } : {}),
    ...(summary.alphaInteriorSupportKind
      ? { alphaInteriorSupportKind: summary.alphaInteriorSupportKind }
      : {}),
    ...(isFiniteNumber(summary.alphaWallTaper_m)
      ? { alphaWallTaper_m: Math.max(1e-6, summary.alphaWallTaper_m) }
      : {}),
    diagnosticTier: "diagnostic",
    ...(typeof summary.shiftLapseProfileId === "string" &&
    summary.shiftLapseProfileId.length > 0
      ? { shiftLapseProfileId: summary.shiftLapseProfileId }
      : {}),
    ...(typeof summary.shiftLapseProfileStage === "string" &&
    summary.shiftLapseProfileStage.length > 0
      ? { shiftLapseProfileStage: summary.shiftLapseProfileStage }
      : {}),
    ...(typeof summary.shiftLapseProfileLabel === "string" &&
    summary.shiftLapseProfileLabel.length > 0
      ? { shiftLapseProfileLabel: summary.shiftLapseProfileLabel }
      : {}),
    ...(typeof summary.shiftLapseProfileNote === "string" &&
    summary.shiftLapseProfileNote.length > 0
      ? { shiftLapseProfileNote: summary.shiftLapseProfileNote }
      : {}),
    ...(typeof summary.signConvention === "string" && summary.signConvention.length > 0
      ? { signConvention: summary.signConvention }
      : {}),
  };
};

export const evaluateWarpMetricLapseField = (args: {
  lapseSummary?: WarpMetricLapseSummary;
  point: Vec3;
  hullAxes?: Vec3;
  bubbleRadius_m?: number;
}): number => {
  const summary = sanitizeLapseSummary(args.lapseSummary);
  if (!summary || summary.alphaProfileKind === "unit") {
    return summary?.alphaCenterline ?? 1;
  }
  const gradient = summary.alphaGradientVec_m_inv ?? [0, 0, 0];
  const targetAlpha =
    summary.alphaCenterline +
    gradient[0] * args.point[0] +
    gradient[1] * args.point[1] +
    gradient[2] * args.point[2];
  let support = 1;
  if (summary.alphaInteriorSupportKind === "bubble_interior") {
    const radius = Math.max(1e-6, Math.abs(args.bubbleRadius_m ?? 0));
    if (radius > 0) {
      const rNorm = Math.hypot(args.point[0], args.point[1], args.point[2]) / radius;
      const taper = Math.max(1e-6, (summary.alphaWallTaper_m ?? radius * 0.1) / radius);
      support = smoothstep((1 - rNorm) / taper);
    }
  } else if (summary.alphaInteriorSupportKind === "hull_interior") {
    const axes = args.hullAxes;
    if (axes && axes.every((value) => isFiniteNumber(value) && value > 0)) {
      const normalizedRadius = Math.sqrt(
        (args.point[0] / Math.max(axes[0], 1e-6)) ** 2 +
          (args.point[1] / Math.max(axes[1], 1e-6)) ** 2 +
          (args.point[2] / Math.max(axes[2], 1e-6)) ** 2,
      );
      const minAxis = Math.max(1e-6, Math.min(axes[0], axes[1], axes[2]));
      const taper = Math.max(1e-6, summary.alphaWallTaper_m ?? minAxis * 0.1);
      const inwardDistance = (1 - normalizedRadius) * minAxis;
      support = normalizedRadius < 1 ? smoothstep(inwardDistance / taper) : 0;
    }
  }
  const blended = 1 + support * (targetAlpha - 1);
  return clamp(blended, summary.alphaMin, summary.alphaMax);
};

const computeVdbConformalCorrection = (
  diagnostics: VdbConformalDiagnostics | undefined,
  fallbackBetaAmplitude: number | undefined,
): {
  thetaConformalMax: number;
  thetaConformalRms: number;
  bPrimeOverBMax: number;
  bDoubleOverBMax: number;
  betaAmplitude: number;
} | null => {
  if (!diagnostics) return null;
  const bPrimeMaxAbs = maxAbsPair(diagnostics.bprimeMin, diagnostics.bprimeMax);
  const bDoubleMaxAbs = maxAbsPair(diagnostics.bdoubleMin, diagnostics.bdoubleMax);
  const bMin = isFiniteNumber(diagnostics.bMin) ? diagnostics.bMin : undefined;
  const bMax = isFiniteNumber(diagnostics.bMax) ? diagnostics.bMax : undefined;
  const bRef =
    bMin != null && bMax != null && bMin > 0 && bMax > 0
      ? Math.sqrt(bMin * bMax)
      : bMin != null && bMin > 0
        ? bMin
        : bMax != null && bMax > 0
          ? bMax
          : undefined;
  const betaAmplitude =
    isFiniteNumber(diagnostics.betaAmplitude) && diagnostics.betaAmplitude >= 0
      ? diagnostics.betaAmplitude
      : isFiniteNumber(fallbackBetaAmplitude) && fallbackBetaAmplitude >= 0
        ? fallbackBetaAmplitude
        : 0;

  if (
    bRef == null ||
    !isFiniteNumber(bPrimeMaxAbs) ||
    bPrimeMaxAbs <= 0 ||
    !isFiniteNumber(betaAmplitude) ||
    betaAmplitude <= 0
  ) {
    return null;
  }

  const bPrimeOverBMax = bPrimeMaxAbs / Math.max(1e-12, bRef);
  const bDoubleOverBMax =
    isFiniteNumber(bDoubleMaxAbs) && bDoubleMaxAbs > 0
      ? bDoubleMaxAbs / Math.max(1e-12, bRef)
      : 0;
  // For gamma_ij = B(r)^2 delta_ij, divergence term includes +3*beta^k*partial_k ln(B).
  const thetaConformalMax = 3 * betaAmplitude * bPrimeOverBMax;
  const thetaConformalRms = thetaConformalMax / Math.sqrt(3);
  return {
    thetaConformalMax,
    thetaConformalRms,
    bPrimeOverBMax,
    bDoubleOverBMax,
    betaAmplitude,
  };
};

export const buildWarpMetricAdapterSnapshot = (
  input: WarpMetricAdapterInput,
): WarpMetricAdapterSnapshot => {
  const familySemantics = deriveWarpMetricFamilySemantics(input.family);
  const requestedChart = input.chart ?? {};
  const label = requestedChart.label ?? DEFAULT_CHART.label;
  const defaultPolicy = DEFAULT_DT_GAMMA_POLICY[label];
  const dtGammaPolicy = requestedChart.dtGammaPolicy ?? defaultPolicy;
  const dtGammaProvided = input.dtGammaProvided === true;
  const defaultDesc = DEFAULT_CHART_DESCRIPTIONS[label];
  let notes = requestedChart.notes ?? defaultDesc?.notes;
  const coordinateMap =
    requestedChart.coordinateMap ?? defaultDesc?.coordinateMap;
  if (
    requestedChart.dtGammaPolicy &&
    requestedChart.dtGammaPolicy !== defaultPolicy
  ) {
    const note = `dtGammaPolicy override (${requestedChart.dtGammaPolicy}) for chart ${label}`;
    notes = notes ? `${notes}; ${note}` : note;
  }
  let contractStatus: WarpChartContract["contractStatus"] = "ok";
  let contractReason: string | undefined;
  if (label === "unspecified" || dtGammaPolicy === "unknown") {
    contractStatus = "unknown";
    contractReason = "chart label or dtGammaPolicy unspecified";
  } else if (
    requestedChart.dtGammaPolicy &&
    requestedChart.dtGammaPolicy !== defaultPolicy
  ) {
    contractStatus = "override";
    contractReason = `dtGammaPolicy override from ${defaultPolicy} to ${requestedChart.dtGammaPolicy} for chart ${label}`;
  } else if (dtGammaPolicy === "computed" && !dtGammaProvided) {
    contractStatus = "unknown";
    contractReason = "dtGammaPolicy computed but dtGamma data not provided";
  }
  if (!contractReason && contractStatus === "ok") {
    contractReason = "ok";
  }
  const chart: WarpChartContract = {
    ...DEFAULT_CHART,
    ...requestedChart,
    label,
    dtGammaPolicy,
    ...(notes ? { notes } : {}),
    ...(coordinateMap ? { coordinateMap } : {}),
    ...(contractStatus ? { contractStatus } : {}),
    ...(contractReason ? { contractReason } : {}),
  };
  const alpha = isFiniteNumber(input.alpha) ? input.alpha : 1;
  const lapseSummary = sanitizeLapseSummary(input.lapseSummary);
  const gammaDiag = input.gammaDiag ?? [1, 1, 1];
  const shift = input.shiftVectorField;
  const hasShift = !!shift?.evaluateShiftVector;

  let betaDiagnostics: WarpMetricAdapterSnapshot["betaDiagnostics"] | undefined =
    input.betaDiagnostics ? { ...input.betaDiagnostics } : undefined;
  if (betaDiagnostics && !betaDiagnostics.method) {
    betaDiagnostics.method = "not-computed";
  }
  if (!betaDiagnostics && input.hodgeDiagnostics) {
    betaDiagnostics = {
      method: "hodge-grid",
      thetaMax: input.hodgeDiagnostics.maxDiv,
      thetaRms: input.hodgeDiagnostics.rmsDiv,
      curlMax: input.hodgeDiagnostics.maxCurl,
      curlRms: input.hodgeDiagnostics.rmsCurl,
      note: "Derived from Helmholtz-Hodge diagnostics grid.",
    };
  } else if (!betaDiagnostics && hasShift) {
    const scale = Math.max(1e-9, input.sampleScale_m ?? 1);
    const step = clamp(scale * 0.02, 1e-9, scale);
    const sampleCount = Math.max(12, Math.floor(input.sampleCount ?? 32));
    const points = buildSamplePoints(scale, sampleCount);
    const diag = finiteDiffDiagnostics(shift!.evaluateShiftVector!, points, step);
    if (diag) {
      betaDiagnostics = {
        method: "finite-diff",
        thetaMax: diag.maxDiv,
        thetaRms: diag.rmsDiv,
        curlMax: diag.maxCurl,
        curlRms: diag.rmsCurl,
        sampleCount: diag.sampleCount,
        step_m: step,
        note: "Central-difference estimate from shiftVectorField.",
      };
    } else {
      betaDiagnostics = {
        method: "not-computed",
        note: "Shift vector returned non-finite samples.",
      };
    }
  } else if (
    !betaDiagnostics &&
    (isFiniteNumber(input.expansionScalar) || isFiniteNumber(input.curlMagnitude))
  ) {
    betaDiagnostics = {
      method: "not-computed",
      thetaMax: input.expansionScalar,
      curlMax: input.curlMagnitude,
      note: "Scalar diagnostics present but derivative-based checks not computed.",
    };
  }

  if (input.note && betaDiagnostics) {
    betaDiagnostics.note = betaDiagnostics.note
      ? `${betaDiagnostics.note} ${input.note}`
      : input.note;
  }

  if (input.vdbConformalDiagnostics) {
    const conformal = computeVdbConformalCorrection(
      input.vdbConformalDiagnostics,
      shift?.amplitude,
    );
    if (conformal && !betaDiagnostics) {
      betaDiagnostics = {
        method: "not-computed",
        thetaConformalMax: conformal.thetaConformalMax,
        thetaConformalRms: conformal.thetaConformalRms,
        bPrimeOverBMax: conformal.bPrimeOverBMax,
        bDoubleOverBMax: conformal.bDoubleOverBMax,
        note: `VdB conformal diagnostics available (|grad ln B|max=${conformal.bPrimeOverBMax.toExponential(
          3,
        )}) but no base shift diagnostics were provided.`,
      };
    } else if (conformal && betaDiagnostics) {
      const baseThetaMax = isFiniteNumber(betaDiagnostics.thetaMax)
        ? Math.abs(betaDiagnostics.thetaMax)
        : 0;
      const baseThetaRms = isFiniteNumber(betaDiagnostics.thetaRms)
        ? Math.abs(betaDiagnostics.thetaRms)
        : baseThetaMax;
      betaDiagnostics.thetaConformalMax = conformal.thetaConformalMax;
      betaDiagnostics.thetaConformalRms = conformal.thetaConformalRms;
      betaDiagnostics.bPrimeOverBMax = conformal.bPrimeOverBMax;
      betaDiagnostics.bDoubleOverBMax = conformal.bDoubleOverBMax;
      betaDiagnostics.thetaMax = baseThetaMax + conformal.thetaConformalMax;
      betaDiagnostics.thetaRms = Math.hypot(baseThetaRms, conformal.thetaConformalRms);
      if (betaDiagnostics.method === "finite-diff") {
        betaDiagnostics.method = "finite-diff+conformal";
      } else if (betaDiagnostics.method === "hodge-grid") {
        betaDiagnostics.method = "hodge-grid+conformal";
      }
      const conformalNote = `VdB conformal correction (+3 beta*grad ln B) applied with |grad ln B|max=${conformal.bPrimeOverBMax.toExponential(
        3,
      )}, betaAmp=${conformal.betaAmplitude.toExponential(3)}.`;
      betaDiagnostics.note = betaDiagnostics.note
        ? `${betaDiagnostics.note} ${conformalNote}`
        : conformalNote;
    }
  }

  betaDiagnostics = normalizeBetaDiagnostics(betaDiagnostics);

  return {
    family: input.family,
    familyAuthorityStatus: familySemantics.familyAuthorityStatus,
    transportCertificationStatus: familySemantics.transportCertificationStatus,
    semanticsNote: familySemantics.semanticsNote,
    chart,
    alpha,
    ...(lapseSummary ? { lapseSummary } : {}),
    gammaDiag,
    betaSource: hasShift ? "shiftVectorField" : "none",
    ...(input.requestedFieldType
      ? { requestedFieldType: input.requestedFieldType }
      : {}),
    ...(betaDiagnostics ? { betaDiagnostics } : {}),
  };
};
