import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NHM2_LEAN_CAMPAIGN_CERTIFICATE_CONTRACT_VERSION,
  type Nhm2LeanCampaignCertificateV1,
  type Nhm2LeanRationalV1,
  isNhm2LeanCampaignCertificateV1,
} from "../../shared/contracts/nhm2-lean-campaign-certificate.v1";

const EXPECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const DEFAULT_RUN_ROOT = path.join(
  "artifacts",
  "research",
  "full-solve",
  "profile-campaign-runs",
  EXPECTED_PROFILE_ID,
);

type JsonRecord = Record<string, unknown>;

type EmitOptions = {
  runRoot: string;
  frontierPath: string;
  outJson: string;
  outLean: string;
};

const asRecord = (value: unknown, label: string): JsonRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label}:expected_record`);
  }
  return value as JsonRecord;
};

const asBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readJson = (filePath: string): JsonRecord => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing_artifact:${filePath}`);
  }
  return asRecord(JSON.parse(fs.readFileSync(filePath, "utf8")), filePath);
};

const sha256File = (filePath: string): string =>
  createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const normalizePath = (filePath: string): string => filePath.replaceAll("\\", "/");

const decimalToRationalParts = (value: number): { numerator: bigint; denominator: bigint; text: string } => {
  if (!Number.isFinite(value)) {
    throw new Error(`non_finite_rational:${value}`);
  }
  const text = value.toString();
  let mantissa = text;
  let exponent = 0;
  const eIndex = text.search(/e/i);
  if (eIndex >= 0) {
    mantissa = text.slice(0, eIndex);
    exponent = Number.parseInt(text.slice(eIndex + 1), 10);
  }
  const negative = mantissa.startsWith("-");
  const cleanMantissa = negative ? mantissa.slice(1) : mantissa;
  const [whole, frac = ""] = cleanMantissa.split(".");
  const digits = `${whole}${frac}`.replace(/^0+(?=\d)/, "") || "0";
  let numerator = BigInt(digits);
  let denominator = 10n ** BigInt(frac.length);
  if (exponent > 0) {
    numerator *= 10n ** BigInt(exponent);
  } else if (exponent < 0) {
    denominator *= 10n ** BigInt(-exponent);
  }
  if (negative) numerator = -numerator;
  const divisor = gcd(abs(numerator), denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
    text,
  };
};

const abs = (value: bigint): bigint => (value < 0n ? -value : value);

const gcd = (a: bigint, b: bigint): bigint => {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0n ? 1n : x;
};

export const rationalFromNumber = (value: number): Nhm2LeanRationalV1 => {
  const parts = decimalToRationalParts(value);
  return {
    text: parts.text,
    numerator: parts.numerator.toString(),
    denominator: parts.denominator.toString(),
    lean: `(${parts.numerator.toString()} : Rat) / (${parts.denominator.toString()} : Rat)`,
  };
};

const getNested = (record: JsonRecord, pathParts: string[]): unknown =>
  pathParts.reduce<unknown>((value, key) => (asRecordOrNull(value)?.[key] ?? null), record);

const asRecordOrNull = (value: unknown): JsonRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null;

const artifact = (runRoot: string, fileName: string): string => path.join(runRoot, fileName);

const requiredArtifacts = (options: EmitOptions): Record<string, string> => ({
  profileFrontier: options.frontierPath,
  timeDependentSourceCampaign: artifact(options.runRoot, "nhm2-time-dependent-source-campaign.json"),
  candidateMetricProfileSpec: artifact(options.runRoot, "nhm2-candidate-metric-profile-spec.json"),
  observerRobustEnergyConditions: artifact(options.runRoot, "nhm2-observer-robust-energy-conditions.json"),
  qeiWorldlineDossier: artifact(options.runRoot, "nhm2-qei-worldline-dossier.json"),
  regionalFullTensorResidual: artifact(options.runRoot, "nhm2-regional-full-tensor-residual.json"),
  frequencyConvergenceEvidence: artifact(options.runRoot, "nhm2-frequency-convergence-evidence.json"),
  dynamicEffectiveGeometryEvidence: artifact(options.runRoot, "nhm2-dynamic-effective-geometry-evidence.json"),
  switchingCovariantConservationEvidence: artifact(
    options.runRoot,
    "nhm2-switching-covariant-conservation-evidence.json",
  ),
  campaignStabilityEvidence: artifact(options.runRoot, "nhm2-campaign-stability-evidence.json"),
});

const maxRegionalResidual = (regional: JsonRecord): number => {
  const regions = Array.isArray(regional.regions) ? regional.regions : [];
  const values: number[] = [];
  for (const region of regions) {
    const components = Array.isArray(asRecordOrNull(region)?.componentResiduals)
      ? (asRecordOrNull(region)?.componentResiduals as unknown[])
      : [];
    for (const component of components) {
      const rel = asNumber(asRecordOrNull(component)?.relResidual);
      if (rel != null) values.push(Math.abs(rel));
    }
  }
  return values.length > 0 ? Math.max(...values) : Number.POSITIVE_INFINITY;
};

const residualTolerance = (regional: JsonRecord): number => {
  const regions = Array.isArray(regional.regions) ? regional.regions : [];
  for (const region of regions) {
    const components = Array.isArray(asRecordOrNull(region)?.componentResiduals)
      ? (asRecordOrNull(region)?.componentResiduals as unknown[])
      : [];
    for (const component of components) {
      const passWindow = asRecordOrNull(asRecordOrNull(component)?.passWindow);
      const tolerance = asNumber(passWindow?.toleranceAbsSI);
      if (tolerance != null) return tolerance;
    }
  }
  return Number.NaN;
};

const maxFrequencyResidual = (frequency: JsonRecord): number => {
  const entries = Array.isArray(frequency.entries) ? frequency.entries : [];
  const values = entries
    .map((entry) => Math.abs(asNumber(asRecordOrNull(entry)?.residualLInf) ?? Number.POSITIVE_INFINITY))
    .filter(Number.isFinite);
  return values.length > 0 ? Math.max(...values) : Number.POSITIVE_INFINITY;
};

const minQeiMargin = (qei: JsonRecord): number => {
  const worldlines = Array.isArray(qei.worldlines) ? qei.worldlines : [];
  const margins = worldlines
    .map((worldline) => asNumber(asRecordOrNull(asRecordOrNull(worldline)?.margin)?.valueSI))
    .filter((value): value is number => value != null);
  return margins.length > 0 ? Math.min(...margins) : Number.NEGATIVE_INFINITY;
};

const tensorAvailability = (regional: JsonRecord): {
  hasT00: boolean;
  hasT0i: boolean;
  hasDiagonalTij: boolean;
  hasOffDiagonalTij: boolean;
  missingComponentIds: string[];
} => {
  const requiredComponents = Array.isArray(regional.requiredComponents)
    ? regional.requiredComponents.map(String)
    : [];
  const missing = new Set<string>();
  const regions = Array.isArray(regional.regions) ? regional.regions : [];
  for (const region of regions) {
    const record = asRecordOrNull(region);
    const missingMetric = Array.isArray(record?.missingMetricComponentIds)
      ? record.missingMetricComponentIds
      : [];
    const missingTile = Array.isArray(record?.missingTileComponentIds)
      ? record.missingTileComponentIds
      : [];
    for (const id of missingMetric) {
      missing.add(String(id));
    }
    for (const id of missingTile) {
      missing.add(String(id));
    }
  }
  const has = (id: string) => requiredComponents.includes(id) && !missing.has(id);
  return {
    hasT00: has("T00"),
    hasT0i: ["T01", "T02", "T03"].every(has),
    hasDiagonalTij: ["T11", "T22", "T33"].every(has),
    hasOffDiagonalTij: ["T12", "T13", "T23"].every(has),
    missingComponentIds: [...missing].sort(),
  };
};

const nonEulerianObserverPass = (observer: JsonRecord): boolean => {
  const families = Array.isArray(observer.observerFamilies) ? observer.observerFamilies : [];
  return families.some((entry) => {
    const record = asRecordOrNull(entry);
    const familyId = asString(record?.familyId);
    return familyId != null && familyId !== "eulerian" && familyId !== "continuous_optimizer" && record?.status === "pass";
  });
};

const robustFamilyStatusPass = (observer: JsonRecord): boolean => {
  const families = Array.isArray(observer.observerFamilies) ? observer.observerFamilies : [];
  return families.some((entry) => {
    const record = asRecordOrNull(entry);
    const familyId = asString(record?.familyId);
    return (
      familyId != null &&
      familyId !== "eulerian" &&
      familyId !== "continuous_optimizer" &&
      record?.status === "pass"
    );
  });
};

const continuousOptimizerImplemented = (observer: JsonRecord): boolean => {
  const families = Array.isArray(observer.observerFamilies) ? observer.observerFamilies : [];
  return families.some((entry) => {
    const record = asRecordOrNull(entry);
    return record?.familyId === "continuous_optimizer" && record.status === "pass" && record.optimizerUsed === true;
  });
};

const addFailure = (failures: string[], ok: boolean, field: string): void => {
  if (!ok) failures.push(field);
};

const allClaimLocksClosed = (locks: Nhm2LeanCampaignCertificateV1["claimLocks"]): boolean =>
  !locks.physicalViabilityClaimAllowed &&
  !locks.transportClaimAllowed &&
  !locks.routeEtaClaimAllowed &&
  !locks.propulsionClaimAllowed &&
  !locks.certifiedWarpSpeedClaimAllowed;

export const buildLeanCampaignCertificate = (options: EmitOptions): Nhm2LeanCampaignCertificateV1 => {
  const artifacts = requiredArtifacts(options);
  const json = Object.fromEntries(
    Object.entries(artifacts).map(([id, filePath]) => [id, readJson(filePath)]),
  );
  const hashes = Object.entries(artifacts).map(([artifactId, filePath]) => ({
    artifactId,
    path: normalizePath(filePath),
    sha256: sha256File(filePath),
  }));

  const campaign = json.timeDependentSourceCampaign;
  const profile = json.candidateMetricProfileSpec;
  const observer = json.observerRobustEnergyConditions;
  const qei = json.qeiWorldlineDossier;
  const regional = json.regionalFullTensorResidual;
  const frequency = json.frequencyConvergenceEvidence;
  const dynamicGeometry = json.dynamicEffectiveGeometryEvidence;
  const switching = json.switchingCovariantConservationEvidence;
  const stability = json.campaignStabilityEvidence;
  const frontier = json.profileFrontier;

  const profileId = asString(campaign.selectedProfileId) ?? "";
  const chartId = asString(campaign.chartId) ?? "";
  const tensor = tensorAvailability(regional);
  const maxResidual = maxRegionalResidual(regional);
  const tolerance = residualTolerance(regional);
  const conservationResidual = asNumber(switching.overallResidualLInf) ?? Number.POSITIVE_INFINITY;
  const conservationTolerance = asNumber(switching.toleranceLInf) ?? Number.NaN;
  const frequencyResidual = maxFrequencyResidual(frequency);
  const frequencyTolerance = asNumber(frequency.toleranceLInf) ?? Number.NaN;
  const dynamicResidual = asNumber(dynamicGeometry.residualLInf) ?? Number.POSITIVE_INFINITY;
  const dynamicBound = 0;
  const qeiMargin = minQeiMargin(qei);
  const qeiMarginBound = 0;
  const qeiSummary = asRecord(getNested(qei, ["summary"]), "qei.summary");
  const observerSummary = asRecord(getNested(observer, ["summary"]), "observer.summary");
  const campaignSummary = asRecord(getNested(campaign, ["summary"]), "campaign.summary");
  const frontierSummary = asRecord(getNested(frontier, ["summary"]), "frontier.summary");
  const tripClocking = asRecord(getNested(profile, ["tripClockingDiagnostic"]), "profile.tripClockingDiagnostic");
  const claimBoundary = asRecord(getNested(campaign, ["claimBoundary"]), "campaign.claimBoundary");
  const sourceIndependence = asRecord(getNested(campaign, ["sourceIndependence"]), "campaign.sourceIndependence");
  const robustObserverConditionReceiptsPass =
    robustFamilyStatusPass(observer) &&
    asBoolean(observerSummary.robustCheckComplete) === true &&
    asBoolean(observerSummary.anyViolation) === false;

  const claimLocks = {
    physicalViabilityClaimAllowed: asBoolean(claimBoundary.physicalViabilityClaimAllowed) ?? true,
    transportClaimAllowed: asBoolean(claimBoundary.transportClaimAllowed) ?? true,
    routeEtaClaimAllowed:
      (asBoolean(claimBoundary.routeEtaClaimAllowed) ?? asBoolean(tripClocking.routeEtaCertified)) ?? true,
    propulsionClaimAllowed: asBoolean(claimBoundary.propulsionClaimAllowed) ?? true,
    certifiedWarpSpeedClaimAllowed: false,
  };

  const missingOrFailedFields: string[] = [];
  addFailure(missingOrFailedFields, profileId === EXPECTED_PROFILE_ID, "identity.profileMatchesExpected");
  addFailure(missingOrFailedFields, chartId === "comoving_cartesian", "identity.chartMatchesCampaign");
  addFailure(missingOrFailedFields, hashes.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)), "identity.artifactHashesPresent");
  addFailure(
    missingOrFailedFields,
    asString(campaign.atlasHash) === asString(observer.atlasHash) &&
      asString(campaign.atlasHash) === asString(qei.atlasHash) &&
      asString(campaign.atlasHash) === asString(regional.expectedAtlasHash),
    "identity.atlasHashMatches",
  );
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.campaignPass) === true, "campaign.campaignPass");
  addFailure(missingOrFailedFields, asBoolean(frontierSummary.profileCampaignFrontierComplete) === true, "frontier.profileCampaignFrontierComplete");
  addFailure(
    missingOrFailedFields,
    asBoolean(sourceIndependence.independentlyDerivedTileMaterialTensor) === true,
    "sourceIndependence.independentlyDerivedTileMaterialTensor",
  );
  addFailure(
    missingOrFailedFields,
    asBoolean(sourceIndependence.copiedFromMetricRequiredTensor) === false,
    "sourceIndependence.notCopiedFromMetricRequiredTensor",
  );
  addFailure(
    missingOrFailedFields,
    asBoolean(sourceIndependence.fittedToMetricResidual) === false,
    "sourceIndependence.notFittedToMetricResidual",
  );
  addFailure(
    missingOrFailedFields,
    asBoolean(sourceIndependence.targetEchoDetected) === false,
    "sourceIndependence.noTargetEcho",
  );
  addFailure(missingOrFailedFields, tensor.hasT00, "tensor.hasT00");
  addFailure(missingOrFailedFields, tensor.hasT0i, "tensor.hasT0i");
  addFailure(missingOrFailedFields, tensor.hasDiagonalTij, "tensor.hasDiagonalTij");
  addFailure(missingOrFailedFields, tensor.hasOffDiagonalTij, "tensor.hasOffDiagonalTij");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.fullRegionalTensorClosurePass) === true, "tensor.fullRegionalTensorClosurePass");
  addFailure(missingOrFailedFields, maxResidual <= tolerance, "tensor.maxRegionalResidualWithinTolerance");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.switchingConservationPass) === true, "conservation.switchingConservationPass");
  addFailure(missingOrFailedFields, switching.conservationStatus === "pass", "conservation.covariantConservationPass");
  addFailure(missingOrFailedFields, conservationResidual <= conservationTolerance, "conservation.overallResidualWithinTolerance");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.frequencyConvergencePass) === true, "frequency.frequencyConvergencePass");
  addFailure(missingOrFailedFields, asBoolean(frequency.fixedCycleAverageSource) === true, "frequency.fixedCycleAverageSource");
  addFailure(missingOrFailedFields, frequencyResidual <= frequencyTolerance, "frequency.maxResidualWithinTolerance");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.dynamicGeometryAgreementPass) === true, "dynamicGeometry.dynamicGeometryAgreementPass");
  addFailure(missingOrFailedFields, asBoolean(dynamicGeometry.cycleAverageSourceFixed) === true, "dynamicGeometry.cycleAverageSourceFixed");
  addFailure(missingOrFailedFields, asBoolean(dynamicGeometry.bounded) === true, "dynamicGeometry.bounded");
  addFailure(missingOrFailedFields, dynamicResidual <= dynamicBound, "dynamicGeometry.residualWithinBound");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.observerFamilyPass) === true, "observer.observerFamilyPass");
  addFailure(missingOrFailedFields, asBoolean(observerSummary.eulerianOnly) === false, "observer.notEulerianOnly");
  addFailure(missingOrFailedFields, asBoolean(observerSummary.robustCheckComplete) === true, "observer.robustCheckComplete");
  addFailure(missingOrFailedFields, asBoolean(observerSummary.anyViolation) === false, "observer.noViolation");
  addFailure(missingOrFailedFields, nonEulerianObserverPass(observer), "observer.hasNonEulerianFamilyPass");
  addFailure(missingOrFailedFields, robustObserverConditionReceiptsPass, "observer.wecReceipt");
  addFailure(missingOrFailedFields, robustObserverConditionReceiptsPass, "observer.necReceipt");
  addFailure(missingOrFailedFields, robustObserverConditionReceiptsPass, "observer.decReceipt");
  addFailure(missingOrFailedFields, robustObserverConditionReceiptsPass, "observer.secReceipt");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.qeiReceiptsPass) === true, "qei.qeiReceiptsPass");
  addFailure(missingOrFailedFields, asBoolean(qeiSummary.hasWallWorldline) === true, "qei.hasWallWorldline");
  addFailure(missingOrFailedFields, asBoolean(qeiSummary.dossierComplete) === true, "qei.dossierComplete");
  addFailure(missingOrFailedFields, asBoolean(qeiSummary.allMarginsPass) === true, "qei.allMarginsPass");
  addFailure(missingOrFailedFields, asBoolean(qeiSummary.anyProxy) === false, "qei.noProxy");
  addFailure(missingOrFailedFields, qeiMargin >= qeiMarginBound, "qei.minMarginWithinBound");
  addFailure(missingOrFailedFields, asBoolean(campaignSummary.stabilityPass) === true, "stability.stabilityPass");
  addFailure(missingOrFailedFields, stability.horizonStatus === "pass", "stability.horizonStatus");
  addFailure(missingOrFailedFields, stability.blueshiftStatus === "pass", "stability.blueshiftStatus");
  addFailure(missingOrFailedFields, stability.particleAccumulationStatus === "pass", "stability.particleAccumulationStatus");
  addFailure(missingOrFailedFields, stability.perturbativeStabilityStatus === "pass", "stability.perturbativeStabilityStatus");
  addFailure(missingOrFailedFields, allClaimLocksClosed(claimLocks), "claimLocks.closed");

  const certificate: Nhm2LeanCampaignCertificateV1 = {
    contractVersion: NHM2_LEAN_CAMPAIGN_CERTIFICATE_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    laneId: asString(campaign.laneId) ?? "",
    selectedProfileId: profileId,
    runId: asString(campaign.runId) ?? "",
    chartId,
    artifactHashes: hashes,
    identity: {
      expectedProfileId: EXPECTED_PROFILE_ID,
      profileMatchesExpected: profileId === EXPECTED_PROFILE_ID,
      chartMatchesCampaign: chartId === "comoving_cartesian",
      artifactHashesPresent: hashes.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)),
      atlasHashMatches:
        asString(campaign.atlasHash) === asString(observer.atlasHash) &&
        asString(campaign.atlasHash) === asString(qei.atlasHash) &&
        asString(campaign.atlasHash) === asString(regional.expectedAtlasHash),
    },
    tensor: {
      ...tensor,
      fullTensorClosurePass: asBoolean(campaignSummary.fullRegionalTensorClosurePass) === true,
      maxRegionalResidual: rationalFromNumber(maxResidual),
      regionalResidualTolerance: rationalFromNumber(tolerance),
    },
    sourceIndependence: {
      independentlyDerivedTileMaterialTensor:
        asBoolean(sourceIndependence.independentlyDerivedTileMaterialTensor) ?? false,
      copiedFromMetricRequiredTensor:
        asBoolean(sourceIndependence.copiedFromMetricRequiredTensor) ?? true,
      fittedToMetricResidual: asBoolean(sourceIndependence.fittedToMetricResidual) ?? true,
      targetEchoDetected: asBoolean(sourceIndependence.targetEchoDetected) ?? true,
      sourceIndependencePass:
        asBoolean(sourceIndependence.independentlyDerivedTileMaterialTensor) === true &&
        asBoolean(sourceIndependence.copiedFromMetricRequiredTensor) === false &&
        asBoolean(sourceIndependence.fittedToMetricResidual) === false &&
        asBoolean(sourceIndependence.targetEchoDetected) === false,
    },
    conservation: {
      switchingConservationPass: asBoolean(campaignSummary.switchingConservationPass) === true,
      covariantConservationPass: switching.conservationStatus === "pass",
      overallResidualLInf: rationalFromNumber(conservationResidual),
      toleranceLInf: rationalFromNumber(conservationTolerance),
    },
    frequency: {
      frequencyConvergencePass: asBoolean(campaignSummary.frequencyConvergencePass) === true,
      fixedCycleAverageSource: asBoolean(frequency.fixedCycleAverageSource) ?? false,
      maxResidualLInf: rationalFromNumber(frequencyResidual),
      toleranceLInf: rationalFromNumber(frequencyTolerance),
    },
    dynamicGeometry: {
      dynamicGeometryAgreementPass: asBoolean(campaignSummary.dynamicGeometryAgreementPass) === true,
      cycleAverageSourceFixed: asBoolean(dynamicGeometry.cycleAverageSourceFixed) ?? false,
      residualLInf: rationalFromNumber(dynamicResidual),
      residualBoundLInf: rationalFromNumber(dynamicBound),
    },
    observer: {
      observerFamilyPass: asBoolean(campaignSummary.observerFamilyPass) === true,
      eulerianOnly: asBoolean(observerSummary.eulerianOnly) ?? true,
      robustCheckComplete: asBoolean(observerSummary.robustCheckComplete) ?? false,
      anyViolation: asBoolean(observerSummary.anyViolation) ?? true,
      hasNonEulerianFamilyPass: nonEulerianObserverPass(observer),
      continuousOptimizerImplemented: continuousOptimizerImplemented(observer),
      wecReceipt: robustObserverConditionReceiptsPass,
      necReceipt: robustObserverConditionReceiptsPass,
      decReceipt: robustObserverConditionReceiptsPass,
      secReceipt: robustObserverConditionReceiptsPass,
    },
    qei: {
      qeiReceiptsPass: asBoolean(campaignSummary.qeiReceiptsPass) === true,
      hasWallWorldline: asBoolean(qeiSummary.hasWallWorldline) ?? false,
      dossierComplete: asBoolean(qeiSummary.dossierComplete) ?? false,
      allMarginsPass: asBoolean(qeiSummary.allMarginsPass) ?? false,
      anyProxy: asBoolean(qeiSummary.anyProxy) ?? true,
      minMarginSI: rationalFromNumber(qeiMargin),
      marginBoundSI: rationalFromNumber(qeiMarginBound),
    },
    stability: {
      stabilityPass: asBoolean(campaignSummary.stabilityPass) === true,
      horizonStatus: asString(stability.horizonStatus) ?? "missing",
      blueshiftStatus: asString(stability.blueshiftStatus) ?? "missing",
      particleAccumulationStatus: asString(stability.particleAccumulationStatus) ?? "missing",
      perturbativeStabilityStatus: asString(stability.perturbativeStabilityStatus) ?? "missing",
    },
    clocking: {
      alphaCenterline: rationalFromNumber(asNumber(profile.alphaCenterline) ?? Number.NaN),
      coordinateTimeSeconds: rationalFromNumber(asNumber(tripClocking.coordinateTimeSeconds) ?? Number.NaN),
      shipProperTimeSeconds: rationalFromNumber(asNumber(tripClocking.shipProperTimeSeconds) ?? Number.NaN),
      routeEtaCertified: asBoolean(tripClocking.routeEtaCertified) ?? true,
    },
    claimLocks,
    certificate: {
      diagnosticCampaignAdmissible: missingOrFailedFields.length === 0,
      missingOrFailedFields,
      leanModulePath: normalizePath(options.outLean),
      jsonArtifactPath: normalizePath(options.outJson),
    },
    claimBoundary: {
      diagnosticOnly: true,
      leanCertificateDoesNotValidateNumericalSolver: true,
      leanCertificateDoesNotProvePhysicalViability: true,
      leanCertificateDoesNotCertifyRouteEta: true,
      leanCertificateDoesNotCertifySpeed: true,
    },
  };

  if (!isNhm2LeanCampaignCertificateV1(certificate)) {
    throw new Error("built certificate failed nhm2_lean_campaign_certificate/v1 validation");
  }
  return certificate;
};

const leanBool = (value: boolean): string => (value ? "true" : "false");

const leanString = (value: string): string => JSON.stringify(value);

const writeLeanModule = (certificate: Nhm2LeanCampaignCertificateV1, outLean: string): void => {
  const lines = [
    "import NHM2Formal.Certificate",
    "",
    "/-!",
    "Generated by tools/nhm2/emit-lean-campaign-certificate.ts.",
    "This file is a Lean-facing proof certificate for the current NHM2 diagnostic campaign.",
    "Do not edit by hand; regenerate with `npm run formal:nhm2:certificate:emit`.",
    "-/",
    "",
    "namespace NHM2Formal.Generated.CurrentCampaignCertificate",
    "",
    "open NHM2Formal",
    "",
    "def current0p7000Certificate : CampaignCertificate := {",
    `  selectedProfileId := ${leanString(certificate.selectedProfileId)}`,
    `  profileMatchesExpected := ${leanBool(certificate.identity.profileMatchesExpected)}`,
    `  chartMatchesCampaign := ${leanBool(certificate.identity.chartMatchesCampaign)}`,
    `  artifactHashesPresent := ${leanBool(certificate.identity.artifactHashesPresent)}`,
    `  atlasHashMatches := ${leanBool(certificate.identity.atlasHashMatches)}`,
    `  hasT00 := ${leanBool(certificate.tensor.hasT00)}`,
    `  hasT0i := ${leanBool(certificate.tensor.hasT0i)}`,
    `  hasDiagonalTij := ${leanBool(certificate.tensor.hasDiagonalTij)}`,
    `  hasOffDiagonalTij := ${leanBool(certificate.tensor.hasOffDiagonalTij)}`,
    `  fullTensorClosurePass := ${leanBool(certificate.tensor.fullTensorClosurePass)}`,
    `  maxRegionalResidual := ${certificate.tensor.maxRegionalResidual.lean}`,
    `  regionalResidualTolerance := ${certificate.tensor.regionalResidualTolerance.lean}`,
    `  independentlyDerivedTileMaterialTensor := ${leanBool(certificate.sourceIndependence.independentlyDerivedTileMaterialTensor)}`,
    `  copiedFromMetricRequiredTensor := ${leanBool(certificate.sourceIndependence.copiedFromMetricRequiredTensor)}`,
    `  fittedToMetricResidual := ${leanBool(certificate.sourceIndependence.fittedToMetricResidual)}`,
    `  targetEchoDetected := ${leanBool(certificate.sourceIndependence.targetEchoDetected)}`,
    `  sourceIndependencePass := ${leanBool(certificate.sourceIndependence.sourceIndependencePass)}`,
    `  switchingConservationPass := ${leanBool(certificate.conservation.switchingConservationPass)}`,
    `  covariantConservationPass := ${leanBool(certificate.conservation.covariantConservationPass)}`,
    `  conservationResidualLInf := ${certificate.conservation.overallResidualLInf.lean}`,
    `  conservationToleranceLInf := ${certificate.conservation.toleranceLInf.lean}`,
    `  frequencyConvergencePass := ${leanBool(certificate.frequency.frequencyConvergencePass)}`,
    `  frequencyFixedCycleAverageSource := ${leanBool(certificate.frequency.fixedCycleAverageSource)}`,
    `  frequencyMaxResidualLInf := ${certificate.frequency.maxResidualLInf.lean}`,
    `  frequencyToleranceLInf := ${certificate.frequency.toleranceLInf.lean}`,
    `  dynamicGeometryAgreementPass := ${leanBool(certificate.dynamicGeometry.dynamicGeometryAgreementPass)}`,
    `  dynamicCycleAverageSourceFixed := ${leanBool(certificate.dynamicGeometry.cycleAverageSourceFixed)}`,
    `  dynamicResidualLInf := ${certificate.dynamicGeometry.residualLInf.lean}`,
    `  dynamicResidualBoundLInf := ${certificate.dynamicGeometry.residualBoundLInf.lean}`,
    `  observerFamilyPass := ${leanBool(certificate.observer.observerFamilyPass)}`,
    `  eulerianOnly := ${leanBool(certificate.observer.eulerianOnly)}`,
    `  robustCheckComplete := ${leanBool(certificate.observer.robustCheckComplete)}`,
    `  anyObserverViolation := ${leanBool(certificate.observer.anyViolation)}`,
    `  hasNonEulerianFamilyPass := ${leanBool(certificate.observer.hasNonEulerianFamilyPass)}`,
    `  wecReceipt := ${leanBool(certificate.observer.wecReceipt)}`,
    `  necReceipt := ${leanBool(certificate.observer.necReceipt)}`,
    `  decReceipt := ${leanBool(certificate.observer.decReceipt)}`,
    `  secReceipt := ${leanBool(certificate.observer.secReceipt)}`,
    `  qeiReceiptsPass := ${leanBool(certificate.qei.qeiReceiptsPass)}`,
    `  hasWallWorldline := ${leanBool(certificate.qei.hasWallWorldline)}`,
    `  qeiDossierComplete := ${leanBool(certificate.qei.dossierComplete)}`,
    `  qeiAllMarginsPass := ${leanBool(certificate.qei.allMarginsPass)}`,
    `  qeiAnyProxy := ${leanBool(certificate.qei.anyProxy)}`,
    `  qeiMinMarginSI := ${certificate.qei.minMarginSI.lean}`,
    `  qeiMarginBoundSI := ${certificate.qei.marginBoundSI.lean}`,
    `  stabilityPass := ${leanBool(certificate.stability.stabilityPass)}`,
    `  horizonPass := ${leanBool(certificate.stability.horizonStatus === "pass")}`,
    `  blueshiftPass := ${leanBool(certificate.stability.blueshiftStatus === "pass")}`,
    `  particleAccumulationPass := ${leanBool(certificate.stability.particleAccumulationStatus === "pass")}`,
    `  perturbativeStabilityPass := ${leanBool(certificate.stability.perturbativeStabilityStatus === "pass")}`,
    `  alphaCenterline := ${certificate.clocking.alphaCenterline.lean}`,
    `  coordinateTimeSeconds := ${certificate.clocking.coordinateTimeSeconds.lean}`,
    `  shipProperTimeSeconds := ${certificate.clocking.shipProperTimeSeconds.lean}`,
    `  routeEtaCertified := ${leanBool(certificate.clocking.routeEtaCertified)}`,
    `  physicalViabilityClaimAllowed := ${leanBool(certificate.claimLocks.physicalViabilityClaimAllowed)}`,
    `  transportClaimAllowed := ${leanBool(certificate.claimLocks.transportClaimAllowed)}`,
    `  routeEtaClaimAllowed := ${leanBool(certificate.claimLocks.routeEtaClaimAllowed)}`,
    `  propulsionClaimAllowed := ${leanBool(certificate.claimLocks.propulsionClaimAllowed)}`,
    `  certifiedWarpSpeedClaimAllowed := ${leanBool(certificate.claimLocks.certifiedWarpSpeedClaimAllowed)}`,
    "}",
    "",
    "theorem current0p7000_boundsPass : CampaignCertificateBoundsPass current0p7000Certificate := by",
    "  dsimp [",
    "    CampaignCertificateBoundsPass,",
    "    CampaignCertificateBoundsPassBool,",
    "    current0p7000Certificate",
    "  ]",
    "  native_decide",
    "",
    "theorem current0p7000_gatesPass : CampaignCertificateGatesPass current0p7000Certificate := by",
    "  dsimp [",
    "    CampaignCertificateGatesPass,",
    "    CampaignCertificateGatesPassBool,",
    "    current0p7000Certificate",
    "  ]",
    "  native_decide",
    "",
    "theorem current0p7000_claimLocksClosed : CampaignCertificateClaimLocksClosed current0p7000Certificate := by",
    "  dsimp [",
    "    CampaignCertificateClaimLocksClosed,",
    "    CampaignCertificateClaimLocksClosedBool,",
    "    current0p7000Certificate",
    "  ]",
    "  native_decide",
    "",
    "theorem current0p7000_diagnosticCampaignAdmissible :",
    "    DiagnosticCampaignAdmissible current0p7000Certificate := by",
    "  exact diagnosticCampaignAdmissible_of_certificate",
    "    current0p7000Certificate",
    "    current0p7000_boundsPass",
    "    current0p7000_gatesPass",
    "    current0p7000_claimLocksClosed",
    "",
    "theorem current0p7000_claimLocksRemainClosed :",
    "    CampaignCertificateClaimLocksClosed current0p7000Certificate := by",
    "  exact diagnosticCampaignAdmissible_preserves_claim_locks",
    "    current0p7000Certificate",
    "    current0p7000_diagnosticCampaignAdmissible",
    "",
    "end NHM2Formal.Generated.CurrentCampaignCertificate",
    "",
  ];
  fs.mkdirSync(path.dirname(outLean), { recursive: true });
  fs.writeFileSync(outLean, `${lines.join("\n")}`, "utf8");
};

const parseArgs = (): EmitOptions => {
  const args = process.argv.slice(2);
  const readArg = (name: string, fallback: string): string => {
    const index = args.indexOf(name);
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
  };
  return {
    runRoot: readArg("--run-root", DEFAULT_RUN_ROOT),
    frontierPath: readArg(
      "--frontier",
      path.join("artifacts", "research", "full-solve", "profile-search", "nhm2-profile-campaign-frontier-latest.json"),
    ),
    outJson: readArg(
      "--out-json",
      path.join(DEFAULT_RUN_ROOT, "nhm2-lean-campaign-certificate.json"),
    ),
    outLean: readArg(
      "--out-lean",
      path.join("formal", "lean", "NHM2Formal", "Generated", "CurrentCampaignCertificate.lean"),
    ),
  };
};

const main = (): void => {
  const options = parseArgs();
  const certificate = buildLeanCampaignCertificate(options);
  fs.mkdirSync(path.dirname(options.outJson), { recursive: true });
  fs.writeFileSync(options.outJson, `${JSON.stringify(certificate, null, 2)}\n`, "utf8");
  writeLeanModule(certificate, options.outLean);
  if (!certificate.certificate.diagnosticCampaignAdmissible) {
    throw new Error(
      `lean campaign certificate failed closed: ${certificate.certificate.missingOrFailedFields.join(",")}`,
    );
  }
  console.log(`wrote ${options.outJson}`);
  console.log(`wrote ${options.outLean}`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
