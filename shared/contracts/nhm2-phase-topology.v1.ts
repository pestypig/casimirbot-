export const NHM2_PHASE_TOPOLOGY_ARTIFACT_ID = "nhm2_phase_topology";
export const NHM2_PHASE_TOPOLOGY_SCHEMA_VERSION = "nhm2_phase_topology/v1";

export type Nhm2PhaseTopologyStatus = "pass" | "review" | "fail" | "unavailable";

export type Nhm2PhaseDefect = {
  id: string;
  charge: 1 | -1;
  theta01: number;
  phi01: number;
  amplitude: number;
  confidence: number;
};

export type Nhm2PhaseTopologyArtifact = {
  artifactId: typeof NHM2_PHASE_TOPOLOGY_ARTIFACT_ID;
  schemaVersion: typeof NHM2_PHASE_TOPOLOGY_SCHEMA_VERSION;

  status: Nhm2PhaseTopologyStatus;
  reasonCodes: string[];

  method: "sector_complex_field_winding/v1";
  sourcePath: "state.phaseSchedule";
  claimScope: "strobe_pattern_diagnostic_not_metric_source";

  schedule: {
    N: number;
    phase01: number;
    sectorPeriod_ms: number;
    tau_s_ms: number;
    sampler: string;
    negativeCount: number;
    positiveCount: number;
  };

  field: {
    gridTheta: number;
    gridPhi: number;
    amplitudeEpsilon: number;
    windingTolerance: number;
  };

  defects: {
    count: number;
    positiveCount: number;
    negativeCount: number;
    density: number;
    netCharge: number;
    closeOppositePairs: number;
    creationCount: number | null;
    annihilationCount: number | null;
    maxSeamJump_rad: number;
  };

  velocities: {
    patternMax_mps: number | null;
    patternMaxOverC: number | null;
    superluminalPatternObserved: boolean;
    matchedDefectSpeedMax_mps: number | null;
    transportInterpretation: "pattern_only_no_energy_or_signal_claim";
  };

  seams: {
    seamBand01: number;
    defectsNearSeams: number;
    seamConcentration: number;
    maxSectorPhaseJump_rad: number;
  };

  phaseSpace: {
    speedBins_mps: number[];
    speedCounts: number[];
    distanceBins_m: number[];
    sameChargePairCounts: number[];
    oppositeChargePairCounts: number[];
  };

  thresholds: {
    defectDensityReview: number;
    defectDensityFail: number;
    closeOppositePairsReview: number;
    maxSeamJumpReview_rad: number;
  };

  researchBasis: {
    phaseSingularityRefs: string[];
    qiGuardrailRefs: string[];
    casimirContextRefs: string[];
    claimLimitations: string[];
  };

  claimLimit: {
    metricSourceAdmitted: false;
    energyTransportAdmitted: false;
    signalTransportAdmitted: false;
    strobePatternDiagnosticAdmitted: true;
    uncertainty: "experimental_analogy_not_validated_metric_source";
  };

  notes: string[];
};
