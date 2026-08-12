export type SolarVisionTask =
  | "full_disk_context"
  | "dkist_416_khi_tracking"
  | "radiative_mhd_forward_model"
  | "spectropolarimetric_inversion"
  | "explanation_qc";

export type SolarModelRouteRequest = {
  task: SolarVisionTask;
  instrument: string;
  passbandCenterNm: number | null;
  spatialResolutionKm: number | null;
  cadenceSeconds: number | null;
  fieldOfViewClass: "full_disk" | "active_region" | "fastcam_patch";
  requiresWorldCoordinates: boolean;
  requiredOutputSchema: string;
};

export type SolarModelRegistryEntry = {
  modelId: string;
  displayName: string;
  tasks: SolarVisionTask[];
  instruments: string[];
  passbandNm: { min: number; max: number } | null;
  spatialResolutionKm: { min: number; max: number } | null;
  cadenceSeconds: { min: number; max: number } | null;
  fieldOfViewClasses: SolarModelRouteRequest["fieldOfViewClass"][];
  supportsWorldCoordinates: boolean;
  outputSchemas: string[];
  trainingDatasetHashes: string[];
  calibrationVersion: string;
  benchmarkStatus: "instrument_native" | "simulation_trained" | "domain_shifted" | "explanation_only";
  permittedClaimTier: "diagnostic" | "reduced_order";
  measurementAuthority: "deterministic_numerical_pipeline" | "model_inference_only";
};

export const SOLAR_MODEL_REGISTRY: readonly SolarModelRegistryEntry[] = [
  {
    modelId: "surya-sdo-context",
    displayName: "Surya SDO context encoder",
    tasks: ["full_disk_context"],
    instruments: ["SDO_AIA", "SDO_HMI"],
    passbandNm: null,
    spatialResolutionKm: { min: 300, max: 2_000 },
    cadenceSeconds: { min: 45, max: 7_200 },
    fieldOfViewClasses: ["full_disk", "active_region"],
    supportsWorldCoordinates: false,
    outputSchemas: ["solar_full_disk_context/v1"],
    trainingDatasetHashes: ["registry://surya/sdo-training-manifest"],
    calibrationVersion: "sdo-native-v1",
    benchmarkStatus: "instrument_native",
    permittedClaimTier: "diagnostic",
    measurementAuthority: "model_inference_only",
  },
  {
    modelId: "dkist-fastcam-416-khi-temporal-v1",
    displayName: "DKIST FastCam temporal KHI detector",
    tasks: ["dkist_416_khi_tracking"],
    instruments: ["DKIST_FastCam"],
    passbandNm: { min: 415.75, max: 416.25 },
    spatialResolutionKm: { min: 5, max: 25 },
    cadenceSeconds: { min: 1, max: 5 },
    fieldOfViewClasses: ["fastcam_patch"],
    supportsWorldCoordinates: true,
    outputSchemas: ["solar_khi_observation/v1", "solar_khi_measurement/v1"],
    trainingDatasetHashes: ["registry://dkist-fastcam/muram-forward-labels-v1"],
    calibrationVersion: "dkist-fastcam-416-forward-model-v1",
    benchmarkStatus: "simulation_trained",
    permittedClaimTier: "diagnostic",
    measurementAuthority: "deterministic_numerical_pipeline",
  },
  {
    modelId: "muram-rh-416-forward",
    displayName: "MURaM/RH 416 nm forward model",
    tasks: ["radiative_mhd_forward_model"],
    instruments: ["DKIST_FastCam", "DKIST_VBI"],
    passbandNm: { min: 415.3, max: 416.7 },
    spatialResolutionKm: { min: 5, max: 100 },
    cadenceSeconds: { min: 1, max: 60 },
    fieldOfViewClasses: ["fastcam_patch", "active_region"],
    supportsWorldCoordinates: true,
    outputSchemas: ["solar_radiative_mhd_residual/v1"],
    trainingDatasetHashes: ["registry://muram/fastcam-khi-public-cubes"],
    calibrationVersion: "rh-415.32-416.7-filter-v1",
    benchmarkStatus: "simulation_trained",
    permittedClaimTier: "reduced_order",
    measurementAuthority: "deterministic_numerical_pipeline",
  },
  {
    modelId: "spin4d-dkist-stokes",
    displayName: "SPIn4D-style Stokes inversion",
    tasks: ["spectropolarimetric_inversion"],
    instruments: ["DKIST_ViSP", "DKIST_VTF"],
    passbandNm: null,
    spatialResolutionKm: { min: 5, max: 200 },
    cadenceSeconds: { min: 1, max: 600 },
    fieldOfViewClasses: ["fastcam_patch", "active_region"],
    supportsWorldCoordinates: true,
    outputSchemas: ["solar_photospheric_state_vector/v1"],
    trainingDatasetHashes: ["registry://spin4d/radiation-mhd-stokes"],
    calibrationVersion: "stokes-inversion-v1",
    benchmarkStatus: "domain_shifted",
    permittedClaimTier: "diagnostic",
    measurementAuthority: "model_inference_only",
  },
  {
    modelId: "stage-play-solar-visual-qc",
    displayName: "Solar visual explanation/QC shade",
    tasks: ["explanation_qc"],
    instruments: ["DKIST_FastCam", "DKIST_VBI", "SDO_AIA", "SDO_HMI"],
    passbandNm: null,
    spatialResolutionKm: null,
    cadenceSeconds: null,
    fieldOfViewClasses: ["full_disk", "active_region", "fastcam_patch"],
    supportsWorldCoordinates: false,
    outputSchemas: ["solar_visual_qc_note/v1"],
    trainingDatasetHashes: [],
    calibrationVersion: "prompt-profile-v1",
    benchmarkStatus: "explanation_only",
    permittedClaimTier: "diagnostic",
    measurementAuthority: "model_inference_only",
  },
] as const;

const within = (value: number | null, domain: { min: number; max: number } | null): boolean =>
  value === null || domain === null || (value >= domain.min && value <= domain.max);

export type SolarModelRoute = {
  selected: SolarModelRegistryEntry;
  score: number;
  rejected: Array<{ modelId: string; reason: string }>;
  numericalMeasurementRequired: true;
};

export function routeSolarModel(request: SolarModelRouteRequest): SolarModelRoute {
  const scored = SOLAR_MODEL_REGISTRY.map((entry) => {
    const reasons: string[] = [];
    if (!entry.tasks.some((task) => task === request.task)) reasons.push("task_mismatch");
    if (!entry.instruments.some((instrument) => instrument === request.instrument)) reasons.push("instrument_mismatch");
    if (!entry.fieldOfViewClasses.some((field) => field === request.fieldOfViewClass)) reasons.push("field_of_view_mismatch");
    if (!within(request.passbandCenterNm, entry.passbandNm)) reasons.push("passband_domain_shift");
    if (!within(request.spatialResolutionKm, entry.spatialResolutionKm)) reasons.push("spatial_resolution_domain_shift");
    if (!within(request.cadenceSeconds, entry.cadenceSeconds)) reasons.push("cadence_domain_shift");
    if (request.requiresWorldCoordinates && !entry.supportsWorldCoordinates) reasons.push("world_coordinates_unsupported");
    if (!entry.outputSchemas.some((schema) => schema === request.requiredOutputSchema)) reasons.push("output_schema_mismatch");
    return { entry, reasons, score: 10 - reasons.length * 2 };
  });
  const eligible = scored.filter((candidate) => candidate.reasons.length === 0).sort((a, b) => b.score - a.score);
  if (!eligible.length) {
    const reason = scored.map((candidate) => `${candidate.entry.modelId}:${candidate.reasons.join(",")}`).join(";");
    throw new Error(`solar_model_route_unavailable:${reason}`);
  }
  return {
    selected: eligible[0].entry,
    score: eligible[0].score,
    rejected: scored
      .filter((candidate) => candidate.reasons.length > 0)
      .map((candidate) => ({ modelId: candidate.entry.modelId, reason: candidate.reasons.join(",") })),
    numericalMeasurementRequired: true,
  };
}
