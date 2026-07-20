import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { Nhm2TheoryCandidatePlanAdmission } from "./nhm2-theory-candidate-plan-admission";
import {
  assessNhm2PrimaryComparisonProjection,
  isNhm2PrimaryComparisonProjectionAssessmentV1,
  type Nhm2PrimaryComparisonProjectionAssessmentV1,
} from "./nhm2-primary-comparison-projection-assessor";
import type { Nhm2PrimaryRawRunPublication } from "./nhm2-primary-raw-run-publisher";
import { createTheoryRuntimeJsonFile } from "./runtime-atomic-json-store";

export const NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_FILENAME =
  "primary-comparison-projection-assessment.v1.json" as const;

export type Nhm2PrimaryComparisonProjectionAssessmentPublication = {
  status: "not_ready";
  outputPath: string;
  sha256: string;
  sizeBytes: number;
  assessment: Nhm2PrimaryComparisonProjectionAssessmentV1;
  supplementaryRootPaths: readonly [string];
};

const normalizeRepoPath = (value: string): string => value.replace(/\\/g, "/");

const sameFilesystemPath = (left: string, right: string): boolean => {
  const normalizedLeft = path.normalize(left);
  const normalizedRight = path.normalize(right);
  return process.platform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
};

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
};

const assertClosedClaimBoundary = (
  assessment: Nhm2PrimaryComparisonProjectionAssessmentV1,
): void => {
  const boundary = assessment.claimBoundary;
  if (
    assessment.status !== "not_ready" ||
    assessment.primaryComparisonProjectionReady !== false ||
    boundary.diagnosticComparisonInputOnly !== true ||
    boundary.metadataAssessmentIsNotArrayReplay !== true ||
    boundary.independentComparisonStillRequired !== true ||
    boundary.empiricalReceiptsStillRequired !== true ||
    boundary.theoryClosureEstablished !== false ||
    boundary.physicalViabilityEstablished !== false ||
    boundary.transportEstablished !== false ||
    boundary.propulsionEstablished !== false ||
    boundary.routeEtaEstablished !== false ||
    boundary.certifiedSpeedEstablished !== false
  ) {
    throw new Error(
      "Primary comparison projection assessment widened its closed claim boundary.",
    );
  }
};

const assertTargetAbsent = async (target: string): Promise<void> => {
  try {
    await fs.lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(
    "Primary comparison projection assessment target already exists and is immutable.",
  );
};

/**
 * P0 server-owned bridge. It records the verified raw-run observation and the
 * exact projection blockers, but deliberately supplies no projection manifest
 * and creates no projected arrays. The child and runtime caller have no input
 * surface through which they can author comparison authority.
 */
export async function publishNhm2PrimaryComparisonProjectionAssessment(input: {
  projectRoot: string;
  admission: Nhm2TheoryCandidatePlanAdmission;
  rawPublication: Nhm2PrimaryRawRunPublication;
}): Promise<Nhm2PrimaryComparisonProjectionAssessmentPublication> {
  const projectRoot = path.resolve(input.projectRoot);
  const outputRoot = path.resolve(projectRoot, input.admission.outputDirectory);
  if (!isInside(projectRoot, outputRoot) || outputRoot === projectRoot) {
    throw new Error(
      "Primary comparison projection assessment output root escaped the project.",
    );
  }
  if (input.rawPublication.rawVerification.verified !== true) {
    throw new Error(
      "Primary comparison projection assessment requires a verified raw publication.",
    );
  }
  const rootStat = await fs.lstat(outputRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(
      "Primary comparison projection assessment output root is not a regular directory.",
    );
  }
  const outputRootRealPath = await fs.realpath(outputRoot);
  if (
    !sameFilesystemPath(
      outputRootRealPath,
      input.rawPublication.rawVerification.runRootRealPath,
    )
  ) {
    throw new Error(
      "Primary comparison projection assessment raw-run root identity mismatch.",
    );
  }
  if (
    input.rawPublication.rawVerification.manifest.identity.candidateId !==
      input.admission.manifest.bindings.candidate.candidateId ||
    input.rawPublication.rawVerification.manifest.execution.runId !==
      input.admission.plan.runId ||
    input.rawPublication.rawManifestSha256 !==
      input.rawPublication.rawVerification.manifestSha256
  ) {
    throw new Error(
      "Primary comparison projection assessment raw publication identity mismatch.",
    );
  }

  const assessment = await assessNhm2PrimaryComparisonProjection({
    manifest: null,
    rawVerification: input.rawPublication.rawVerification,
  });
  if (!isNhm2PrimaryComparisonProjectionAssessmentV1(assessment)) {
    throw new Error(
      "Primary comparison projection assessment failed its exact contract guard.",
    );
  }
  assertClosedClaimBoundary(assessment);
  if (
    assessment.source.rawFilesystemVerificationObserved !== true ||
    assessment.source.rawFilesystemVerificationBoundToProjectionManifest !==
      false ||
    assessment.source.rawManifestSha256 !==
      input.rawPublication.rawManifestSha256 ||
    assessment.source.manifestArtifactId !== null ||
    assessment.source.manifestContractVersion !== null ||
    assessment.source.manifestSha256 !== null ||
    !assessment.blockers.includes("projection_manifest_missing") ||
    !assessment.blockers.includes(
      "server_owned_projection_operator_replay_not_implemented",
    )
  ) {
    throw new Error(
      "Primary comparison projection P0 assessment did not preserve its fail-closed boundary.",
    );
  }

  const absoluteOutputPath = path.join(
    outputRoot,
    NHM2_PRIMARY_COMPARISON_PROJECTION_ASSESSMENT_FILENAME,
  );
  await assertTargetAbsent(absoluteOutputPath);
  await createTheoryRuntimeJsonFile(absoluteOutputPath, assessment);

  const persistedStat = await fs.lstat(absoluteOutputPath);
  if (
    persistedStat.isSymbolicLink() ||
    !persistedStat.isFile() ||
    persistedStat.nlink !== 1
  ) {
    throw new Error(
      "Primary comparison projection assessment is not a unique regular file.",
    );
  }
  const persistedRealPath = await fs.realpath(absoluteOutputPath);
  if (!isInside(outputRootRealPath, persistedRealPath)) {
    throw new Error(
      "Primary comparison projection assessment escaped its verified run root.",
    );
  }
  if (!sameFilesystemPath(await fs.realpath(outputRoot), outputRootRealPath)) {
    throw new Error(
      "Primary comparison projection assessment output root changed during publication.",
    );
  }
  const bytes = await fs.readFile(absoluteOutputPath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `Primary comparison projection assessment readback is invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (
    !isNhm2PrimaryComparisonProjectionAssessmentV1(parsed) ||
    JSON.stringify(parsed) !== JSON.stringify(assessment)
  ) {
    throw new Error(
      "Primary comparison projection assessment readback differs from the server-owned value.",
    );
  }

  const outputPath = normalizeRepoPath(
    path.relative(projectRoot, absoluteOutputPath),
  );
  return {
    status: "not_ready",
    outputPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
    assessment,
    supplementaryRootPaths: [outputPath],
  };
}
