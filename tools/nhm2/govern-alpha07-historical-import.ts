import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildTheoryRuntimeOutputManifestV1,
  validateTheoryRuntimeOutputManifestV1,
  type TheoryRuntimeOutputManifestEntryV1,
  type TheoryRuntimeOutputManifestV1,
} from "../../shared/contracts/theory-runtime-receipt.v1";
import {
  NHM2_ALPHA07_EXPECTED_CERTIFICATE_PIN_IDS as EXPECTED_CERTIFICATE_PIN_IDS,
  NHM2_ALPHA07_EXPECTED_PACKAGE_ARTIFACTS,
  NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
  NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT,
  NHM2_ALPHA07_IMPORT_MANIFEST_NAME,
  NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
  NHM2_ALPHA07_PACKAGE_DIRECTORY,
  NHM2_ALPHA07_PROFILE_FRONTIER_PATH,
  NHM2_ALPHA07_PROFILE_ID,
  NHM2_ALPHA07_SOURCE_COMMIT,
} from "../../shared/theory/nhm2-alpha07-historical-import-governance";

export {
  NHM2_ALPHA07_EXPECTED_PACKAGE_ARTIFACTS,
  NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
  NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT,
  NHM2_ALPHA07_IMPORT_MANIFEST_NAME,
  NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
  NHM2_ALPHA07_PACKAGE_DIRECTORY,
  NHM2_ALPHA07_PROFILE_ID,
  NHM2_ALPHA07_SOURCE_COMMIT,
} from "../../shared/theory/nhm2-alpha07-historical-import-governance";
const REQUIRED_GRID_REGION_IDS = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
  "hull_wall_transition",
  "wall_exterior_transition",
] as const;
const REQUIRED_TENSOR_REGION_IDS = [
  "global",
  "hull",
  "wall",
  "exterior_shell",
] as const;
const REQUIRED_SYMMETRIC_TENSOR_COMPONENT_IDS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const;
const REQUIRED_BRICK_TENSOR_CHANNEL_IDS = [
  "rho",
  "Sx",
  "Sy",
  "Sz",
  "S_xx",
  "S_xy",
  "S_xz",
  "S_yy",
  "S_yz",
  "S_zz",
] as const;
const REQUIRED_OBSERVER_FAMILY_IDS = [
  "eulerian",
  "boosted_timelike_grid",
  "null_direction_grid",
  "algebraic_type_i",
  "continuous_optimizer",
] as const;
const REQUIRED_QEI_WORLDLINE_IDS = [
  "qei:wall:atlas",
  "qei:hull_wall_transition:atlas",
  "qei:wall_exterior_transition:atlas",
] as const;

// These three binary-shaped JSON artifacts predate a top-level generatedAt.
// Their preserved source-package mtimes are normalized here so a clean checkout
// does not rewrite the manifest merely because Git assigned new filesystem mtimes.
const HISTORICAL_MODIFIED_AT_FALLBACKS: Readonly<Record<string, string>> = {
  "nhm2-dynamic-geometry-sample.brick.json": "2026-06-19T19:03:11.003Z",
  "nhm2-effective-geometry-reference.brick.json": "2026-06-19T19:03:10.876Z",
  "nhm2-tile-counterpart-conservation.json": "2026-06-19T19:03:10.652Z",
};

type JsonRecord = Record<string, unknown>;

type InspectedJsonArtifact = {
  packageRelativePath: string;
  repoRelativePath: string;
  absolutePath: string;
  bytes: Buffer;
  json: JsonRecord | null;
  entry: TheoryRuntimeOutputManifestEntryV1;
};

export type Nhm2Alpha07HistoricalPackageInspection = {
  repoRoot: string;
  packageDirectory: string;
  manifestPath: string;
  artifacts: InspectedJsonArtifact[];
  issues: string[];
};

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const normalizeRepoPath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\//, "");

const compareStrings = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const sha256 = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");

const canonicalIso = (value: string | null): string | null => {
  if (value == null || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};

const isPortableRepoPath = (value: string): boolean =>
  value.length > 0 &&
  !value.includes("\\") &&
  !path.posix.isAbsolute(value) &&
  !path.win32.isAbsolute(value) &&
  !value.split("/").includes("..");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

const looksLikeAbsoluteWorkstationPath = (value: string): boolean => {
  const candidate = value.trim();
  if (candidate.length === 0) return false;
  if (path.win32.isAbsolute(candidate) || path.posix.isAbsolute(candidate)) return true;
  return /^file:\/\/(?:\/?[A-Za-z]:|\/{1,3})/i.test(candidate);
};

const scanForAbsoluteWorkstationPaths = (
  value: unknown,
  location: string,
  issues: string[],
): void => {
  if (typeof value === "string") {
    if (looksLikeAbsoluteWorkstationPath(value)) {
      issues.push(`absolute workstation path at ${location}: ${value}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      scanForAbsoluteWorkstationPaths(entry, `${location}[${index}]`, issues),
    );
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    scanForAbsoluteWorkstationPaths(entry, `${location}.${key}`, issues);
  }
};

const artifactModifiedAt = (
  fileName: string,
  json: JsonRecord | null,
): string | null => {
  const topLevel = canonicalIso(asString(json?.generatedAt));
  if (topLevel != null) return topLevel;
  const runIdentity = isRecord(json?.runIdentity) ? json.runIdentity : null;
  const nestedCreatedAt = canonicalIso(asString(runIdentity?.createdAt));
  if (nestedCreatedAt != null) return nestedCreatedAt;
  return HISTORICAL_MODIFIED_AT_FALLBACKS[fileName] ?? null;
};

async function collectPackageFiles(directory: string): Promise<string[]> {
  const collected: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((left, right) => compareStrings(left.name, right.name));
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`symbolic links are not permitted in the historical package: ${absolutePath}`);
      }
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile()) {
        collected.push(absolutePath);
      }
    }
  };
  await visit(directory);
  return collected.sort(compareStrings);
}

function addSetDifferenceIssues(input: {
  expected: ReadonlySet<string>;
  actual: ReadonlySet<string>;
  missingPrefix: string;
  extraPrefix: string;
  issues: string[];
}): void {
  for (const expected of Array.from(input.expected).sort(compareStrings)) {
    if (!input.actual.has(expected)) input.issues.push(`${input.missingPrefix}: ${expected}`);
  }
  for (const actual of Array.from(input.actual).sort(compareStrings)) {
    if (!input.expected.has(actual)) input.issues.push(`${input.extraPrefix}: ${actual}`);
  }
}

const asRecordArray = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const isFinitePositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

function validateExactIds(input: {
  label: string;
  expected: readonly string[];
  actual: Iterable<string>;
  issues: string[];
}): void {
  addSetDifferenceIssues({
    expected: new Set(input.expected),
    actual: new Set(input.actual),
    missingPrefix: `missing ${input.label}`,
    extraPrefix: `unexpected ${input.label}`,
    issues: input.issues,
  });
}

function packageArtifactJson(
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>,
  fileName: string,
  issues: string[],
): JsonRecord | null {
  const repoRelativePath = `${NHM2_ALPHA07_PACKAGE_DIRECTORY}/${fileName}`;
  const json = artifactByPath.get(repoRelativePath)?.json ?? null;
  if (json == null) issues.push(`semantic evidence artifact is unavailable: ${repoRelativePath}`);
  return json;
}

async function readRepoJson(
  repoRoot: string,
  repoRelativePath: string,
  issues: string[],
): Promise<{ bytes: Buffer; json: JsonRecord } | null> {
  if (!isPortableRepoPath(repoRelativePath)) {
    issues.push(`certificate pin path is not portable: ${repoRelativePath}`);
    return null;
  }
  const absolutePath = path.resolve(repoRoot, ...repoRelativePath.split("/"));
  if (!isInside(repoRoot, absolutePath)) {
    issues.push(`certificate pin escapes the repository: ${repoRelativePath}`);
    return null;
  }
  try {
    const bytes = await fs.readFile(absolutePath);
    const parsed: unknown = JSON.parse(bytes.toString("utf8"));
    if (!isRecord(parsed)) {
      issues.push(`certificate pin target must contain a JSON object: ${repoRelativePath}`);
      return null;
    }
    scanForAbsoluteWorkstationPaths(parsed, repoRelativePath, issues);
    return { bytes, json: parsed };
  } catch (error) {
    issues.push(`certificate pin target is unreadable: ${repoRelativePath}: ${(error as Error).message}`);
    return null;
  }
}

function validateReferenceRun(
  referenceRun: JsonRecord | null,
  issues: string[],
): void {
  if (referenceRun == null) {
    issues.push("nhm2-reference-run.json must contain a JSON object");
    return;
  }
  const repo = isRecord(referenceRun.repo) ? referenceRun.repo : null;
  if (repo?.commitSha !== NHM2_ALPHA07_SOURCE_COMMIT) {
    issues.push(`reference-run source commit must be ${NHM2_ALPHA07_SOURCE_COMMIT}`);
  }
  if (repo?.dirtyTreeStatus !== "dirty") {
    issues.push("reference-run must preserve dirtyTreeStatus=dirty for this historical import");
  }
  if (referenceRun.runId !== NHM2_ALPHA07_PROFILE_ID) {
    issues.push(`reference-run runId must be ${NHM2_ALPHA07_PROFILE_ID}`);
  }
  const claimLock = isRecord(referenceRun.claimLock) ? referenceRun.claimLock : null;
  if (claimLock?.validationClaimAllowed !== false) {
    issues.push("reference-run validationClaimAllowed must remain false");
  }
  if (claimLock?.currentClaimTier !== "unknown" || claimLock?.maximumClaimTier !== "unknown") {
    issues.push("reference-run physical claim tiers must remain unknown");
  }
  if (claimLock?.latestAliasForbidden !== true) {
    issues.push("reference-run latestAliasForbidden must remain true");
  }
}

function validateProfileFrontier(
  frontierArtifact: JsonRecord,
  issues: string[],
): void {
  if (frontierArtifact.contractVersion !== "nhm2_profile_campaign_frontier/v1") {
    issues.push("profile-frontier certificate input has the wrong contractVersion");
  }
  if (frontierArtifact.laneId !== "nhm2_shift_lapse") {
    issues.push("profile-frontier certificate input must remain on the nhm2_shift_lapse lane");
  }
  const frontier = isRecord(frontierArtifact.frontier) ? frontierArtifact.frontier : null;
  if (frontier?.fastestCampaignAdmissibleProfileId !== NHM2_ALPHA07_PROFILE_ID) {
    issues.push("profile-frontier certificate input no longer selects the alpha=0.7 profile");
  }
  if (frontier?.recommendedNextProfileId !== NHM2_ALPHA07_PROFILE_ID) {
    issues.push("profile-frontier certificate input no longer recommends the alpha=0.7 profile");
  }
  const claimBoundary = isRecord(frontierArtifact.claimBoundary)
    ? frontierArtifact.claimBoundary
    : null;
  if (claimBoundary?.diagnosticOnly !== true) {
    issues.push("profile-frontier certificate input must remain diagnosticOnly");
  }
  for (const field of [
    "physicalViabilityClaimAllowed",
    "transportClaimAllowed",
    "routeEtaClaimAllowed",
    "propulsionClaimAllowed",
  ] as const) {
    if (claimBoundary?.[field] !== false) {
      issues.push(`profile-frontier certificate input ${field} must remain false`);
    }
  }
}

async function validateLeanCertificatePins(input: {
  repoRoot: string;
  certificate: JsonRecord | null;
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>;
  issues: string[];
}): Promise<void> {
  const { certificate, issues } = input;
  if (certificate == null) {
    issues.push("nhm2-lean-campaign-certificate.json must contain a JSON object");
    return;
  }
  const pins = certificate.artifactHashes;
  if (!Array.isArray(pins) || pins.length !== EXPECTED_CERTIFICATE_PIN_IDS.length) {
    issues.push(`Lean certificate must contain exactly ${EXPECTED_CERTIFICATE_PIN_IDS.length} artifact pins`);
    return;
  }

  const actualIds = new Set<string>();
  const actualPaths = new Set<string>();
  for (const [index, pinValue] of pins.entries()) {
    if (!isRecord(pinValue)) {
      issues.push(`Lean certificate pin ${index} must be an object`);
      continue;
    }
    const artifactId = asString(pinValue.artifactId);
    const pinPath = asString(pinValue.path);
    const expectedSha = asString(pinValue.sha256)?.toLowerCase() ?? null;
    if (artifactId == null) {
      issues.push(`Lean certificate pin ${index} has no artifactId`);
    } else if (actualIds.has(artifactId)) {
      issues.push(`Lean certificate has duplicate artifactId: ${artifactId}`);
    } else {
      actualIds.add(artifactId);
    }
    if (pinPath == null) {
      issues.push(`Lean certificate pin ${index} has no path`);
      continue;
    }
    if (actualPaths.has(pinPath)) issues.push(`Lean certificate has duplicate path: ${pinPath}`);
    actualPaths.add(pinPath);
    if (expectedSha == null || !/^[a-f0-9]{64}$/.test(expectedSha)) {
      issues.push(`Lean certificate pin has invalid SHA-256: ${pinPath}`);
      continue;
    }
    const target = await readRepoJson(input.repoRoot, pinPath, issues);
    if (target == null) continue;
    const actualSha = sha256(target.bytes);
    if (actualSha !== expectedSha) {
      issues.push(`Lean certificate pin hash mismatch: ${pinPath}`);
    }
    const packageEntry = input.artifactByPath.get(pinPath)?.entry;
    if (packageEntry != null && packageEntry.sha256 !== expectedSha) {
      issues.push(`package manifest disagrees with Lean certificate pin: ${pinPath}`);
    }
    if (artifactId === "profileFrontier") {
      if (pinPath !== NHM2_ALPHA07_PROFILE_FRONTIER_PATH) {
        issues.push(
          `profileFrontier pin must reference ${NHM2_ALPHA07_PROFILE_FRONTIER_PATH}`,
        );
      }
      validateProfileFrontier(target.json, issues);
    }
  }

  addSetDifferenceIssues({
    expected: new Set(EXPECTED_CERTIFICATE_PIN_IDS),
    actual: actualIds,
    missingPrefix: "missing expected Lean certificate pin",
    extraPrefix: "unexpected Lean certificate pin",
    issues,
  });

  const claimLocks = isRecord(certificate.claimLocks) ? certificate.claimLocks : null;
  for (const field of [
    "physicalViabilityClaimAllowed",
    "transportClaimAllowed",
    "routeEtaClaimAllowed",
    "propulsionClaimAllowed",
    "certifiedWarpSpeedClaimAllowed",
  ] as const) {
    if (claimLocks?.[field] !== false) issues.push(`Lean certificate ${field} must remain false`);
  }
  const claimBoundary = isRecord(certificate.claimBoundary) ? certificate.claimBoundary : null;
  for (const field of [
    "diagnosticOnly",
    "leanCertificateDoesNotValidateNumericalSolver",
    "leanCertificateDoesNotProvePhysicalViability",
    "leanCertificateDoesNotCertifyRouteEta",
    "leanCertificateDoesNotCertifySpeed",
  ] as const) {
    if (claimBoundary?.[field] !== true) issues.push(`Lean certificate ${field} must remain true`);
  }
}

function validateGridAndTensorEvidence(
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>,
  issues: string[],
): void {
  const grid = packageArtifactJson(
    artifactByPath,
    "nhm2-candidate-campaign-grid.json",
    issues,
  );
  const regionSamples = isRecord(grid?.regionSamples) ? grid.regionSamples : null;
  if (regionSamples == null) {
    issues.push("candidate grid must expose regionSamples and mask references");
  } else {
    validateExactIds({
      label: "campaign-grid region",
      expected: REQUIRED_GRID_REGION_IDS,
      actual: Object.keys(regionSamples),
      issues,
    });
    for (const regionId of REQUIRED_GRID_REGION_IDS) {
      const region = isRecord(regionSamples[regionId]) ? regionSamples[regionId] : null;
      if (!isFinitePositiveNumber(region?.sampleCount)) {
        issues.push(`campaign-grid region ${regionId} must retain a positive sampleCount`);
      }
      if (asString(region?.maskRef) == null) {
        issues.push(`campaign-grid region ${regionId} must retain its maskRef`);
      }
      if (asString(region?.supportFunctionRef) == null) {
        issues.push(`campaign-grid region ${regionId} must retain its supportFunctionRef`);
      }
    }
  }

  const source = packageArtifactJson(
    artifactByPath,
    "nhm2-candidate-tile-effective-full-tensor-source.json",
    issues,
  );
  const sourceModel = isRecord(source?.sourceModel) ? source.sourceModel : null;
  if (sourceModel?.sourceModelId !== "candidate_declared_tile_effective_tensor_lever_model") {
    issues.push("source tensor must retain its declared sourceModelId producer identity");
  }
  if (sourceModel?.sourceModelVersion !== "v1") {
    issues.push("source tensor must retain sourceModelVersion=v1");
  }
  if (sourceModel?.sourceSideOnly !== true || sourceModel?.notDerivedFromMetricRequiredTensor !== true) {
    issues.push("source tensor must retain its source-side-only provenance assertions");
  }

  const sourceRegions = asRecordArray(source?.regions);
  const sourceRegionMap = new Map(
    sourceRegions.map((region) => [asString(region.regionId) ?? "", region] as const),
  );
  if (sourceRegionMap.size !== sourceRegions.length) {
    issues.push("source tensor regions must have unique non-empty regionId values");
  }
  validateExactIds({
    label: "source-tensor region",
    expected: REQUIRED_TENSOR_REGION_IDS,
    actual: sourceRegionMap.keys(),
    issues,
  });
  for (const regionId of REQUIRED_TENSOR_REGION_IDS) {
    const region = sourceRegionMap.get(regionId);
    const tensor = isRecord(region?.tensor) ? region.tensor : null;
    if (tensor == null) {
      issues.push(`source-tensor region ${regionId} must retain its full tensor object`);
    } else {
      validateExactIds({
        label: `source-tensor ${regionId} component`,
        expected: REQUIRED_SYMMETRIC_TENSOR_COMPONENT_IDS,
        actual: Object.keys(tensor),
        issues,
      });
      for (const componentId of REQUIRED_SYMMETRIC_TENSOR_COMPONENT_IDS) {
        const value = tensor[componentId];
        if (typeof value !== "number" || !Number.isFinite(value)) {
          issues.push(`source-tensor ${regionId}.${componentId} must retain a finite encoded value`);
        }
      }
    }
    if (asString(region?.regionMaskRef) == null) {
      issues.push(`source-tensor region ${regionId} must retain its regionMaskRef`);
    }
    if (region?.normalizationBasis !== "sample_count") {
      issues.push(`source-tensor region ${regionId} normalizationBasis must remain sample_count`);
    }
    if (!isFinitePositiveNumber(region?.sampleCount)) {
      issues.push(`source-tensor region ${regionId} must retain a positive sampleCount`);
    }
    const provenance = isRecord(region?.provenance) ? region.provenance : null;
    if (asString(provenance?.producerModule) == null || asString(provenance?.producerFunction) == null) {
      issues.push(`source-tensor region ${regionId} must retain producer module/function identity`);
    }
    if (provenance?.notDerivedFromMetricRequiredTensor !== true) {
      issues.push(`source-tensor region ${regionId} must retain non-metric-echo provenance`);
    }
  }

  const ledger = packageArtifactJson(
    artifactByPath,
    "nhm2-source-component-authority-ledger.json",
    issues,
  );
  const ledgerRegions = asRecordArray(ledger?.regions);
  const ledgerRegionMap = new Map(
    ledgerRegions.map((region) => [asString(region.regionId) ?? "", region] as const),
  );
  validateExactIds({
    label: "component-ledger region",
    expected: REQUIRED_TENSOR_REGION_IDS,
    actual: ledgerRegionMap.keys(),
    issues,
  });
  for (const regionId of REQUIRED_TENSOR_REGION_IDS) {
    const region = ledgerRegionMap.get(regionId);
    if (region?.normalizationBasis !== "sample_count") {
      issues.push(`component-ledger region ${regionId} normalizationBasis must remain sample_count`);
    }
    if (asString(region?.regionMaskRef) == null) {
      issues.push(`component-ledger region ${regionId} must retain its regionMaskRef`);
    }
    const components = asRecordArray(region?.components);
    const componentIds = components
      .map((component) => asString(component.componentId))
      .filter((value): value is string => value != null);
    validateExactIds({
      label: `component-ledger ${regionId} component`,
      expected: REQUIRED_SYMMETRIC_TENSOR_COMPONENT_IDS,
      actual: componentIds,
      issues,
    });
    if (new Set(componentIds).size !== components.length) {
      issues.push(`component-ledger region ${regionId} must have unique componentId values`);
    }
    for (const component of components) {
      const componentId = asString(component.componentId) ?? "unknown";
      if (typeof component.valueSI !== "number" || !Number.isFinite(component.valueSI)) {
        issues.push(`component-ledger ${regionId}.${componentId} must retain a finite valueSI`);
      }
      const provenance = isRecord(component.provenance) ? component.provenance : null;
      if (
        asString(provenance?.sourceModelId) == null ||
        asString(provenance?.sourceModelVersion) == null
      ) {
        issues.push(`component-ledger ${regionId}.${componentId} must retain source-model provenance`);
      }
    }
  }

  for (const brickFile of [
    "nhm2-dynamic-geometry-sample.brick.json",
    "nhm2-effective-geometry-reference.brick.json",
  ]) {
    const brick = packageArtifactJson(artifactByPath, brickFile, issues);
    const channelOrder = Array.isArray(brick?.channelOrder)
      ? brick.channelOrder.filter((value): value is string => typeof value === "string")
      : [];
    const channels = isRecord(brick?.channels) ? brick.channels : null;
    for (const channelId of ["tile_support_mask", ...REQUIRED_BRICK_TENSOR_CHANNEL_IDS]) {
      if (!channelOrder.includes(channelId)) {
        issues.push(`${brickFile} must retain channelOrder entry ${channelId}`);
      }
      const channel = channels != null && isRecord(channels[channelId]) ? channels[channelId] : null;
      if (asString(channel?.data) == null) {
        issues.push(`${brickFile} must retain encoded channel data for ${channelId}`);
      }
    }
  }
}

function validateObserverEvidence(
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>,
  issues: string[],
): void {
  const observer = packageArtifactJson(
    artifactByPath,
    "nhm2-observer-robust-energy-conditions.json",
    issues,
  );
  const families = asRecordArray(observer?.observerFamilies);
  const familyMap = new Map(
    families.map((family) => [asString(family.familyId) ?? "", family] as const),
  );
  validateExactIds({
    label: "observer family",
    expected: REQUIRED_OBSERVER_FAMILY_IDS,
    actual: familyMap.keys(),
    issues,
  });
  for (const familyId of REQUIRED_OBSERVER_FAMILY_IDS.slice(0, -1)) {
    const family = familyMap.get(familyId);
    if (!isFinitePositiveNumber(family?.sampleCount)) {
      issues.push(`observer family ${familyId} must retain a positive sampleCount`);
    }
    if (!isRecord(family?.worstCase)) {
      issues.push(`observer family ${familyId} must retain worstCase evidence`);
    }
  }
  const continuous = familyMap.get("continuous_optimizer");
  if (
    continuous?.status !== "not_run" ||
    continuous?.optimizerUsed !== false ||
    !Array.isArray(continuous?.blockers) ||
    !continuous.blockers.includes("continuous_optimizer_not_implemented")
  ) {
    issues.push("observer evidence must explicitly preserve the unimplemented continuous optimizer limitation");
  }
  const summary = isRecord(observer?.summary) ? observer.summary : null;
  if (summary?.eulerianOnly !== false) {
    issues.push("observer evidence must preserve its non-Eulerian finite-family coverage assertion");
  }
  const claimBoundary = isRecord(observer?.claimBoundary) ? observer.claimBoundary : null;
  if (claimBoundary?.diagnosticOnly !== true || claimBoundary?.friendlyObserverCannotProveWec !== true) {
    issues.push("observer evidence must retain its diagnostic-only claim boundary");
  }
}

function validateQeiEvidence(
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>,
  issues: string[],
): void {
  const plan = packageArtifactJson(
    artifactByPath,
    "nhm2-qei-worldline-sample-plan.json",
    issues,
  );
  const planWorldlines = asRecordArray(plan?.worldlines);
  const planMap = new Map(
    planWorldlines.map((worldline) => [asString(worldline.worldlineId) ?? "", worldline] as const),
  );
  validateExactIds({
    label: "QEI sample-plan worldline",
    expected: REQUIRED_QEI_WORLDLINE_IDS,
    actual: planMap.keys(),
    issues,
  });
  for (const worldlineId of REQUIRED_QEI_WORLDLINE_IDS) {
    const worldline = planMap.get(worldlineId);
    if (!isFinitePositiveNumber(worldline?.sampleCount)) {
      issues.push(`QEI sample-plan worldline ${worldlineId} must retain a positive sampleCount`);
    }
    for (const field of ["regionId", "sampleLocationsRef", "sampleMethod", "sourceTensorRef"] as const) {
      if (asString(worldline?.[field]) == null) {
        issues.push(`QEI sample-plan worldline ${worldlineId} must retain ${field}`);
      }
    }
  }
  const planSummary = isRecord(plan?.summary) ? plan.summary : null;
  if (planSummary?.pointwiseTensorRequired !== true || planSummary?.planComplete !== false) {
    issues.push("QEI sample plan must preserve its pointwise-tensor requirement and incomplete status");
  }
  const planBoundary = isRecord(plan?.claimBoundary) ? plan.claimBoundary : null;
  if (
    planBoundary?.diagnosticOnly !== true ||
    planBoundary?.samplePlanDoesNotProveQeiPass !== true
  ) {
    issues.push("QEI sample plan must retain its diagnostic-only non-proof boundary");
  }

  const dossier = packageArtifactJson(
    artifactByPath,
    "nhm2-qei-worldline-dossier.json",
    issues,
  );
  const dossierWorldlines = asRecordArray(dossier?.worldlines);
  const dossierMap = new Map(
    dossierWorldlines.map((worldline) => [asString(worldline.worldlineId) ?? "", worldline] as const),
  );
  validateExactIds({
    label: "QEI dossier worldline",
    expected: REQUIRED_QEI_WORLDLINE_IDS,
    actual: dossierMap.keys(),
    issues,
  });
  for (const worldlineId of REQUIRED_QEI_WORLDLINE_IDS) {
    const worldline = dossierMap.get(worldlineId);
    const samplingFunction = isRecord(worldline?.samplingFunction)
      ? worldline.samplingFunction
      : null;
    if (
      asString(samplingFunction?.kind) == null ||
      !isFinitePositiveNumber(samplingFunction?.tauSeconds) ||
      samplingFunction?.normalized !== true
    ) {
      issues.push(`QEI dossier worldline ${worldlineId} must retain normalized sampling-function evidence`);
    }
    for (const surface of ["sampledRho", "bound", "margin"] as const) {
      if (!isRecord(worldline?.[surface])) {
        issues.push(`QEI dossier worldline ${worldlineId} must retain ${surface} evidence`);
      }
    }
    const sampledRho = isRecord(worldline?.sampledRho) ? worldline.sampledRho : null;
    const bound = isRecord(worldline?.bound) ? worldline.bound : null;
    if (asString(sampledRho?.provenanceRef) == null || asString(bound?.provenanceRef) == null) {
      issues.push(`QEI dossier worldline ${worldlineId} must retain source and bound provenance`);
    }
  }
  const dossierBoundary = isRecord(dossier?.claimBoundary) ? dossier.claimBoundary : null;
  if (
    dossierBoundary?.diagnosticOnly !== true ||
    dossierBoundary?.scalarMarginCannotSubstituteForDossier !== true
  ) {
    issues.push("QEI dossier must retain its diagnostic-only claim boundary");
  }
}

function validateSemanticEvidenceCompleteness(
  artifactByPath: ReadonlyMap<string, InspectedJsonArtifact>,
  issues: string[],
): void {
  validateGridAndTensorEvidence(artifactByPath, issues);
  validateObserverEvidence(artifactByPath, issues);
  validateQeiEvidence(artifactByPath, issues);
}

export async function inspectNhm2Alpha07HistoricalPackage(input: {
  repoRoot?: string;
} = {}): Promise<Nhm2Alpha07HistoricalPackageInspection> {
  const repoRoot = path.resolve(input.repoRoot ?? process.cwd());
  const packageDirectory = path.resolve(
    repoRoot,
    ...NHM2_ALPHA07_PACKAGE_DIRECTORY.split("/"),
  );
  const manifestPath = path.resolve(
    repoRoot,
    ...NHM2_ALPHA07_IMPORT_MANIFEST_PATH.split("/"),
  );
  const issues: string[] = [];
  const artifacts: InspectedJsonArtifact[] = [];

  if (!isInside(repoRoot, packageDirectory)) {
    return {
      repoRoot,
      packageDirectory,
      manifestPath,
      artifacts,
      issues: ["historical package directory must remain inside the repository"],
    };
  }

  let packageFiles: string[] = [];
  try {
    packageFiles = await collectPackageFiles(packageDirectory);
  } catch (error) {
    issues.push(`unable to enumerate historical package: ${(error as Error).message}`);
  }
  const artifactFiles = packageFiles.filter(
    (filePath) => path.resolve(filePath) !== manifestPath,
  );
  const actualPackagePaths = new Set(
    artifactFiles.map((filePath) =>
      normalizeRepoPath(path.relative(packageDirectory, filePath)),
    ),
  );
  addSetDifferenceIssues({
    expected: new Set(NHM2_ALPHA07_EXPECTED_PACKAGE_ARTIFACTS),
    actual: actualPackagePaths,
    missingPrefix: "missing historical package artifact",
    extraPrefix: "unexpected historical package artifact",
    issues,
  });

  for (const absolutePath of artifactFiles.sort(compareStrings)) {
    const packageRelativePath = normalizeRepoPath(
      path.relative(packageDirectory, absolutePath),
    );
    const repoRelativePath = normalizeRepoPath(path.relative(repoRoot, absolutePath));
    if (!isPortableRepoPath(repoRelativePath)) {
      issues.push(`package artifact path is not portable: ${repoRelativePath}`);
    }
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(absolutePath);
    } catch (error) {
      issues.push(`unable to read package artifact ${repoRelativePath}: ${(error as Error).message}`);
      continue;
    }
    let json: JsonRecord | null = null;
    try {
      const parsed: unknown = JSON.parse(bytes.toString("utf8"));
      if (isRecord(parsed)) json = parsed;
      else issues.push(`package artifact must contain a JSON object: ${repoRelativePath}`);
    } catch (error) {
      issues.push(`invalid package JSON ${repoRelativePath}: ${(error as Error).message}`);
    }
    if (json != null) scanForAbsoluteWorkstationPaths(json, repoRelativePath, issues);
    const modifiedAt = artifactModifiedAt(packageRelativePath, json);
    if (modifiedAt == null) {
      issues.push(`package artifact has no governed historical modifiedAt: ${repoRelativePath}`);
    }
    artifacts.push({
      packageRelativePath,
      repoRelativePath,
      absolutePath,
      bytes,
      json,
      entry: {
        path: repoRelativePath,
        sha256: sha256(bytes),
        sizeBytes: bytes.byteLength,
        modifiedAt: modifiedAt ?? NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT,
        freshness: "preexisting",
      },
    });
  }
  artifacts.sort((left, right) => compareStrings(left.repoRelativePath, right.repoRelativePath));

  const artifactByPath = new Map(
    artifacts.map((artifact) => [artifact.repoRelativePath, artifact] as const),
  );
  validateSemanticEvidenceCompleteness(artifactByPath, issues);
  validateReferenceRun(
    artifactByPath.get(`${NHM2_ALPHA07_PACKAGE_DIRECTORY}/nhm2-reference-run.json`)?.json ?? null,
    issues,
  );
  await validateLeanCertificatePins({
    repoRoot,
    certificate:
      artifactByPath.get(
        `${NHM2_ALPHA07_PACKAGE_DIRECTORY}/nhm2-lean-campaign-certificate.json`,
      )?.json ?? null,
    artifactByPath,
    issues,
  });

  return { repoRoot, packageDirectory, manifestPath, artifacts, issues };
}

function manifestFromInspection(
  inspection: Nhm2Alpha07HistoricalPackageInspection,
): TheoryRuntimeOutputManifestV1 {
  return buildTheoryRuntimeOutputManifestV1({
    generatedAt: NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT,
    requestId: null,
    runtimeId: NHM2_ALPHA07_HISTORICAL_RUNTIME_ID,
    gitSha: NHM2_ALPHA07_SOURCE_COMMIT,
    startedAt: null,
    completedAt: null,
    outputDirectory: NHM2_ALPHA07_PACKAGE_DIRECTORY,
    boundToExecution: false,
    manifestPath: NHM2_ALPHA07_IMPORT_MANIFEST_PATH,
    manifestSha256: null,
    entries: inspection.artifacts.map((artifact) => artifact.entry),
  });
}

export const renderNhm2Alpha07HistoricalImportManifest = (
  manifest: TheoryRuntimeOutputManifestV1,
): string => `${JSON.stringify(manifest, null, 2)}\n`;

export async function buildNhm2Alpha07HistoricalImportManifest(input: {
  repoRoot?: string;
} = {}): Promise<TheoryRuntimeOutputManifestV1> {
  const inspection = await inspectNhm2Alpha07HistoricalPackage(input);
  if (inspection.issues.length > 0) {
    throw new Error(
      `NHM2 alpha=0.7 historical package is not governable:\n- ${inspection.issues.join("\n- ")}`,
    );
  }
  return manifestFromInspection(inspection);
}

function validateManifestSemantics(
  manifest: TheoryRuntimeOutputManifestV1,
  issues: string[],
): void {
  if (manifest.generatedAt !== NHM2_ALPHA07_IMPORT_MANIFEST_GENERATED_AT) {
    issues.push("historical import manifest generatedAt is not the governed import timestamp");
  }
  if (manifest.requestId !== null) issues.push("historical import requestId must be null");
  if (manifest.runtimeId !== NHM2_ALPHA07_HISTORICAL_RUNTIME_ID) {
    issues.push(`historical import runtimeId must be ${NHM2_ALPHA07_HISTORICAL_RUNTIME_ID}`);
  }
  if (manifest.gitSha !== NHM2_ALPHA07_SOURCE_COMMIT) {
    issues.push(`historical import gitSha must be ${NHM2_ALPHA07_SOURCE_COMMIT}`);
  }
  if (manifest.startedAt !== null || manifest.completedAt !== null) {
    issues.push("historical import must not assert an execution interval");
  }
  if (manifest.outputDirectory !== NHM2_ALPHA07_PACKAGE_DIRECTORY) {
    issues.push("historical import outputDirectory must be the portable package path");
  }
  if (manifest.boundToExecution !== false) {
    issues.push("historical import boundToExecution must remain false");
  }
  if (manifest.manifestPath !== NHM2_ALPHA07_IMPORT_MANIFEST_PATH) {
    issues.push("historical import manifestPath must be portable and point to itself");
  }
  if (manifest.manifestSha256 !== null) {
    issues.push("self-referential historical import manifestSha256 must remain null");
  }
  for (const entry of manifest.entries) {
    if (!isPortableRepoPath(entry.path)) issues.push(`manifest entry path is not portable: ${entry.path}`);
    if (entry.freshness !== "preexisting") {
      issues.push(`historical import freshness must be preexisting: ${entry.path}`);
    }
  }
}

export async function validateNhm2Alpha07HistoricalImportManifest(input: {
  repoRoot?: string;
} = {}): Promise<string[]> {
  const inspection = await inspectNhm2Alpha07HistoricalPackage(input);
  const issues = [...inspection.issues];
  let manifestValue: unknown;
  try {
    manifestValue = JSON.parse(await fs.readFile(inspection.manifestPath, "utf8"));
  } catch (error) {
    issues.push(`historical import manifest is unreadable: ${(error as Error).message}`);
    return issues;
  }
  const contractIssues = validateTheoryRuntimeOutputManifestV1(manifestValue);
  issues.push(...contractIssues.map((issue) => `manifest contract: ${issue}`));
  if (contractIssues.length > 0 || !isRecord(manifestValue)) return issues;
  const manifest = manifestValue as TheoryRuntimeOutputManifestV1;
  validateManifestSemantics(manifest, issues);

  const manifestPaths = new Set(manifest.entries.map((entry) => entry.path));
  if (manifestPaths.size !== manifest.entries.length) {
    issues.push("historical import manifest contains duplicate artifact paths");
  }
  const inspectedPaths = new Set(
    inspection.artifacts.map((artifact) => artifact.repoRelativePath),
  );
  addSetDifferenceIssues({
    expected: inspectedPaths,
    actual: manifestPaths,
    missingPrefix: "unmanifested package artifact",
    extraPrefix: "manifest entry has no package artifact",
    issues,
  });
  const manifestByPath = new Map(manifest.entries.map((entry) => [entry.path, entry] as const));
  for (const artifact of inspection.artifacts) {
    const entry = manifestByPath.get(artifact.repoRelativePath);
    if (entry == null) continue;
    if (entry.sha256.toLowerCase() !== artifact.entry.sha256) {
      issues.push(`manifest SHA-256 mismatch: ${artifact.repoRelativePath}`);
    }
    if (entry.sizeBytes !== artifact.entry.sizeBytes) {
      issues.push(`manifest size mismatch: ${artifact.repoRelativePath}`);
    }
    if (entry.modifiedAt !== artifact.entry.modifiedAt) {
      issues.push(`manifest modifiedAt mismatch: ${artifact.repoRelativePath}`);
    }
  }

  if (inspection.issues.length === 0) {
    const expected = manifestFromInspection(inspection);
    if (
      renderNhm2Alpha07HistoricalImportManifest(manifest) !==
      renderNhm2Alpha07HistoricalImportManifest(expected)
    ) {
      issues.push("historical import manifest is not the deterministic canonical rendering");
    }
  }
  return Array.from(new Set(issues));
}

export async function writeNhm2Alpha07HistoricalImportManifest(input: {
  repoRoot?: string;
} = {}): Promise<TheoryRuntimeOutputManifestV1> {
  const repoRoot = path.resolve(input.repoRoot ?? process.cwd());
  const manifest = await buildNhm2Alpha07HistoricalImportManifest({ repoRoot });
  const manifestPath = path.resolve(
    repoRoot,
    ...NHM2_ALPHA07_IMPORT_MANIFEST_PATH.split("/"),
  );
  await fs.writeFile(
    manifestPath,
    renderNhm2Alpha07HistoricalImportManifest(manifest),
    "utf8",
  );
  const issues = await validateNhm2Alpha07HistoricalImportManifest({ repoRoot });
  if (issues.length > 0) {
    throw new Error(`written manifest failed validation:\n- ${issues.join("\n- ")}`);
  }
  return manifest;
}

const parseMode = (argv: readonly string[]): "check" | "write" => {
  const check = argv.includes("--check");
  const write = argv.includes("--write");
  const unknown = argv.filter((arg) => arg !== "--check" && arg !== "--write");
  if (unknown.length > 0) throw new Error(`unknown arguments: ${unknown.join(", ")}`);
  if (check && write) throw new Error("choose exactly one of --check or --write");
  return write ? "write" : "check";
};

const main = async (): Promise<void> => {
  const mode = parseMode(process.argv.slice(2));
  if (mode === "write") {
    const manifest = await writeNhm2Alpha07HistoricalImportManifest();
    process.stdout.write(
      `wrote ${manifest.manifestPath} (${manifest.entries.length} preexisting artifacts; boundToExecution=false)\n`,
    );
    return;
  }
  const issues = await validateNhm2Alpha07HistoricalImportManifest();
  if (issues.length > 0) {
    throw new Error(`NHM2 alpha=0.7 historical import check failed:\n- ${issues.join("\n- ")}`);
  }
  process.stdout.write(
    `PASS ${NHM2_ALPHA07_IMPORT_MANIFEST_PATH} (${NHM2_ALPHA07_EXPECTED_PACKAGE_ARTIFACTS.length} preexisting artifacts; 10 Lean pins; no execution binding)\n`,
  );
};

const invokedPath = process.argv[1] ? path.normalize(path.resolve(process.argv[1])) : "";
const modulePath = path.normalize(fileURLToPath(import.meta.url));
if (invokedPath.toLowerCase() === modulePath.toLowerCase()) {
  main().catch((error) => {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exitCode = 1;
  });
}
