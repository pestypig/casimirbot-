export const NHM2_LEAN_CAMPAIGN_CERTIFICATE_CONTRACT_VERSION =
  "nhm2_lean_campaign_certificate/v1" as const;

export type Nhm2LeanRationalV1 = {
  text: string;
  numerator: string;
  denominator: string;
  lean: string;
};

export type Nhm2LeanArtifactHashV1 = {
  artifactId: string;
  path: string;
  sha256: string;
};

export type Nhm2LeanCampaignCertificateV1 = {
  contractVersion: typeof NHM2_LEAN_CAMPAIGN_CERTIFICATE_CONTRACT_VERSION;
  generatedAt: string;
  laneId: string;
  selectedProfileId: string;
  runId: string;
  chartId: string;
  artifactHashes: Nhm2LeanArtifactHashV1[];
  identity: {
    expectedProfileId: string;
    profileMatchesExpected: boolean;
    chartMatchesCampaign: boolean;
    artifactHashesPresent: boolean;
    atlasHashMatches: boolean;
  };
  tensor: {
    hasT00: boolean;
    hasT0i: boolean;
    hasDiagonalTij: boolean;
    hasOffDiagonalTij: boolean;
    fullTensorClosurePass: boolean;
    missingComponentIds: string[];
    maxRegionalResidual: Nhm2LeanRationalV1;
    regionalResidualTolerance: Nhm2LeanRationalV1;
  };
  sourceIndependence: {
    independentlyDerivedTileMaterialTensor: boolean;
    copiedFromMetricRequiredTensor: boolean;
    fittedToMetricResidual: boolean;
    targetEchoDetected: boolean;
    sourceIndependencePass: boolean;
  };
  conservation: {
    switchingConservationPass: boolean;
    covariantConservationPass: boolean;
    overallResidualLInf: Nhm2LeanRationalV1;
    toleranceLInf: Nhm2LeanRationalV1;
  };
  frequency: {
    frequencyConvergencePass: boolean;
    fixedCycleAverageSource: boolean;
    maxResidualLInf: Nhm2LeanRationalV1;
    toleranceLInf: Nhm2LeanRationalV1;
  };
  dynamicGeometry: {
    dynamicGeometryAgreementPass: boolean;
    cycleAverageSourceFixed: boolean;
    residualLInf: Nhm2LeanRationalV1;
    residualBoundLInf: Nhm2LeanRationalV1;
  };
  observer: {
    observerFamilyPass: boolean;
    eulerianOnly: boolean;
    robustCheckComplete: boolean;
    anyViolation: boolean;
    hasNonEulerianFamilyPass: boolean;
    continuousOptimizerImplemented: boolean;
    wecReceipt: boolean;
    necReceipt: boolean;
    decReceipt: boolean;
    secReceipt: boolean;
  };
  qei: {
    qeiReceiptsPass: boolean;
    hasWallWorldline: boolean;
    dossierComplete: boolean;
    allMarginsPass: boolean;
    anyProxy: boolean;
    minMarginSI: Nhm2LeanRationalV1;
    marginBoundSI: Nhm2LeanRationalV1;
  };
  stability: {
    stabilityPass: boolean;
    horizonStatus: string;
    blueshiftStatus: string;
    particleAccumulationStatus: string;
    perturbativeStabilityStatus: string;
  };
  clocking: {
    alphaCenterline: Nhm2LeanRationalV1;
    coordinateTimeSeconds: Nhm2LeanRationalV1;
    shipProperTimeSeconds: Nhm2LeanRationalV1;
    routeEtaCertified: boolean;
  };
  claimLocks: {
    physicalViabilityClaimAllowed: boolean;
    transportClaimAllowed: boolean;
    routeEtaClaimAllowed: boolean;
    propulsionClaimAllowed: boolean;
    certifiedWarpSpeedClaimAllowed: boolean;
  };
  certificate: {
    diagnosticCampaignAdmissible: boolean;
    missingOrFailedFields: string[];
    leanModulePath: string;
    jsonArtifactPath: string;
  };
  claimBoundary: {
    diagnosticOnly: true;
    leanCertificateDoesNotValidateNumericalSolver: true;
    leanCertificateDoesNotProvePhysicalViability: true;
    leanCertificateDoesNotCertifyRouteEta: true;
    leanCertificateDoesNotCertifySpeed: true;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isRational = (value: unknown): value is Nhm2LeanRationalV1 =>
  isRecord(value) &&
  isString(value.text) &&
  isString(value.numerator) &&
  isString(value.denominator) &&
  isString(value.lean);

export const isNhm2LeanCampaignCertificateV1 = (
  value: unknown,
): value is Nhm2LeanCampaignCertificateV1 => {
  if (!isRecord(value)) return false;
  const identity = isRecord(value.identity) ? value.identity : null;
  const tensor = isRecord(value.tensor) ? value.tensor : null;
  const sourceIndependence = isRecord(value.sourceIndependence) ? value.sourceIndependence : null;
  const conservation = isRecord(value.conservation) ? value.conservation : null;
  const frequency = isRecord(value.frequency) ? value.frequency : null;
  const dynamicGeometry = isRecord(value.dynamicGeometry) ? value.dynamicGeometry : null;
  const observer = isRecord(value.observer) ? value.observer : null;
  const qei = isRecord(value.qei) ? value.qei : null;
  const stability = isRecord(value.stability) ? value.stability : null;
  const clocking = isRecord(value.clocking) ? value.clocking : null;
  const locks = isRecord(value.claimLocks) ? value.claimLocks : null;
  const certificate = isRecord(value.certificate) ? value.certificate : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_LEAN_CAMPAIGN_CERTIFICATE_CONTRACT_VERSION &&
    isString(value.generatedAt) &&
    isString(value.laneId) &&
    isString(value.selectedProfileId) &&
    isString(value.runId) &&
    isString(value.chartId) &&
    Array.isArray(value.artifactHashes) &&
    value.artifactHashes.every(
      (entry) =>
        isRecord(entry) &&
        isString(entry.artifactId) &&
        isString(entry.path) &&
        /^[a-f0-9]{64}$/i.test(String(entry.sha256)),
    ) &&
    identity != null &&
    isString(identity.expectedProfileId) &&
    isBoolean(identity.profileMatchesExpected) &&
    isBoolean(identity.chartMatchesCampaign) &&
    isBoolean(identity.artifactHashesPresent) &&
    isBoolean(identity.atlasHashMatches) &&
    tensor != null &&
    isBoolean(tensor.hasT00) &&
    isBoolean(tensor.hasT0i) &&
    isBoolean(tensor.hasDiagonalTij) &&
    isBoolean(tensor.hasOffDiagonalTij) &&
    isBoolean(tensor.fullTensorClosurePass) &&
    Array.isArray(tensor.missingComponentIds) &&
    tensor.missingComponentIds.every((entry) => typeof entry === "string") &&
    isRational(tensor.maxRegionalResidual) &&
    isRational(tensor.regionalResidualTolerance) &&
    sourceIndependence != null &&
    isBoolean(sourceIndependence.independentlyDerivedTileMaterialTensor) &&
    isBoolean(sourceIndependence.copiedFromMetricRequiredTensor) &&
    isBoolean(sourceIndependence.fittedToMetricResidual) &&
    isBoolean(sourceIndependence.targetEchoDetected) &&
    isBoolean(sourceIndependence.sourceIndependencePass) &&
    conservation != null &&
    isBoolean(conservation.switchingConservationPass) &&
    isBoolean(conservation.covariantConservationPass) &&
    isRational(conservation.overallResidualLInf) &&
    isRational(conservation.toleranceLInf) &&
    frequency != null &&
    isBoolean(frequency.frequencyConvergencePass) &&
    isBoolean(frequency.fixedCycleAverageSource) &&
    isRational(frequency.maxResidualLInf) &&
    isRational(frequency.toleranceLInf) &&
    dynamicGeometry != null &&
    isBoolean(dynamicGeometry.dynamicGeometryAgreementPass) &&
    isBoolean(dynamicGeometry.cycleAverageSourceFixed) &&
    isRational(dynamicGeometry.residualLInf) &&
    isRational(dynamicGeometry.residualBoundLInf) &&
    observer != null &&
    isBoolean(observer.observerFamilyPass) &&
    isBoolean(observer.eulerianOnly) &&
    isBoolean(observer.robustCheckComplete) &&
    isBoolean(observer.anyViolation) &&
    isBoolean(observer.hasNonEulerianFamilyPass) &&
    isBoolean(observer.continuousOptimizerImplemented) &&
    isBoolean(observer.wecReceipt) &&
    isBoolean(observer.necReceipt) &&
    isBoolean(observer.decReceipt) &&
    isBoolean(observer.secReceipt) &&
    qei != null &&
    isBoolean(qei.qeiReceiptsPass) &&
    isBoolean(qei.hasWallWorldline) &&
    isBoolean(qei.dossierComplete) &&
    isBoolean(qei.allMarginsPass) &&
    isBoolean(qei.anyProxy) &&
    isRational(qei.minMarginSI) &&
    isRational(qei.marginBoundSI) &&
    stability != null &&
    isBoolean(stability.stabilityPass) &&
    isString(stability.horizonStatus) &&
    isString(stability.blueshiftStatus) &&
    isString(stability.particleAccumulationStatus) &&
    isString(stability.perturbativeStabilityStatus) &&
    clocking != null &&
    isRational(clocking.alphaCenterline) &&
    isRational(clocking.coordinateTimeSeconds) &&
    isRational(clocking.shipProperTimeSeconds) &&
    isBoolean(clocking.routeEtaCertified) &&
    locks != null &&
    isBoolean(locks.physicalViabilityClaimAllowed) &&
    isBoolean(locks.transportClaimAllowed) &&
    isBoolean(locks.routeEtaClaimAllowed) &&
    isBoolean(locks.propulsionClaimAllowed) &&
    isBoolean(locks.certifiedWarpSpeedClaimAllowed) &&
    certificate != null &&
    isBoolean(certificate.diagnosticCampaignAdmissible) &&
    Array.isArray(certificate.missingOrFailedFields) &&
    certificate.missingOrFailedFields.every((entry) => typeof entry === "string") &&
    isString(certificate.leanModulePath) &&
    isString(certificate.jsonArtifactPath) &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.leanCertificateDoesNotValidateNumericalSolver === true &&
    boundary.leanCertificateDoesNotProvePhysicalViability === true &&
    boundary.leanCertificateDoesNotCertifyRouteEta === true &&
    boundary.leanCertificateDoesNotCertifySpeed === true
  );
};
