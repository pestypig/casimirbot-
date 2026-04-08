export const OBSERVABLE_UNIVERSE_ACCORDION_ETA_SURFACE_ID =
  "nhm2_bounded_trip_estimate_product_surface/v1";

export const OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES = [
  "proper_time",
  "coordinate_time",
] as const;

export const OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY = {
  defaultOperatingProfileId: "stage1_centerline_alpha_0p8200_v1",
  supportedBandFloorProfileId: "stage1_centerline_alpha_0p8000_v1",
  supportedBandCeilingProfileId: "stage1_centerline_alpha_0p995_v1",
  evidenceFloorProfileId: "stage1_centerline_alpha_0p7700_v1",
  evidenceFloorCenterlineAlpha: 0.77,
  supportBufferDeltaCenterlineAlpha: 0.03,
  supportedBandStatus: "manually_reviewed_static_band",
  autoTracksEvidenceFloor: false,
  sourceBoundaryArtifactPath:
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json",
  sourceDefaultMissionTimeComparisonArtifactPath:
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8200_v1/nhm2-mission-time-comparison-latest.json",
  sourceSupportedFloorMissionTimeComparisonArtifactPath:
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p8000_v1/nhm2-mission-time-comparison-latest.json",
  sourceSupportedBandCeilingReferenceArtifactPath:
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json",
  sourceEvidenceFloorMissionTimeComparisonArtifactPath:
    "artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/stage1_centerline_alpha_0p7700_v1/nhm2-mission-time-comparison-latest.json",
} as const;

export type ObservableUniverseSupportedEtaMode =
  (typeof OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES)[number];
