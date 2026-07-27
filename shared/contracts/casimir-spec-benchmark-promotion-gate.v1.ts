import {
  canonicalizeCasimirSpecValueV1,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";
import {
  aggregateCasimirSpecBenchmarkPairedEffectV1,
  bootstrapCasimirSpecBenchmarkPairedEffectV1,
  evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1,
  validateCasimirSpecBenchmarkPairedBinaryEpisodesV1,
  type CasimirSpecBenchmarkBootstrapResultV1,
  type CasimirSpecBenchmarkPairedBinaryEpisodesV1,
  type CasimirSpecBenchmarkPairedEffectV1,
  type CasimirSpecBenchmarkZeroEventSafetyGateResultV1,
} from "./casimir-spec-benchmark-statistics.v1";

export const CASIMIR_SPEC_BENCHMARK_SEALED_POPULATION_RECEIPT_SCHEMA_VERSION =
  "casimir_spec_benchmark_sealed_population_receipt/v1" as const;
export const CASIMIR_SPEC_BENCHMARK_PROMOTION_GATE_SCHEMA_VERSION =
  "casimir_spec_benchmark_promotion_gate/v1" as const;

export const CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1 = [
  "proposition_tampering",
  "source_tampering",
  "claim_ir_commitment_tampering",
  "formal_toolchain_tampering",
  "numerical_toolchain_tampering",
] as const;

export type CasimirSpecBenchmarkRequiredTamperFixtureFamilyV1 =
  (typeof CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1)[number];

export type CasimirSpecBenchmarkSealedPopulationReceiptV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_SEALED_POPULATION_RECEIPT_SCHEMA_VERSION;
  receiptId: string;
  benchmarkId: string;
  contentClass: "benchmark";
  publicFreezeSha256: string;
  hiddenBundleCommitmentSha256: string;
  revealedBundleArtifactSha256: string;
  runManifestArtifactSha256: string;
  pairedEpisodesArtifactSha256: string;
  safetyGroupOutcomesArtifactSha256: string;
  counts: {
    cellCount: 66;
    problemGroupCount: 990;
    replicateCountPerProblemGroup: 3;
    adjacentPairCount: 2970;
    sealedArmResponseCount: 5940;
    initialRatingCount: 11880;
    safetyCriticalProblemGroupCount: 528;
  };
  populationValidation: "passed";
  scheduleValidation: "passed";
  pairAdjacencyValidation: "passed";
  responseAndUsageManifestValidation: "passed";
  ratingAndAdjudicationValidation: "passed";
  raterQualificationReceiptAuthentication: "verified_by_server_trust_registry";
  externalTimestampReceiptAuthentication: "verified_by_server_trust_registry";
  isolatedSinkReceiptAuthentication: "verified_by_server_trust_registry";
  custodianIndependence: "verified";
  validatorImplementationId: string;
  validatorRevisionSha256: string;
  trustRegistrySha256: string;
  verifiedAt: string;
  receiptSha256: string;
};

export type CasimirSpecBenchmarkSafetyGroupOutcomeV1 = {
  problemGroupId: string;
  safetyCritical: true;
  replicateCount: 3;
  realizedFalseCertification: boolean;
};

export type CasimirSpecBenchmarkTrustedReceiptAuthenticationV1 = {
  status: "verified";
  verificationBoundary: "server_owned_out_of_band_trust_registry";
  receiptSha256: string;
  trustRegistrySha256: string;
};

export type CasimirSpecBenchmarkPromotionGateV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_PROMOTION_GATE_SCHEMA_VERSION;
  assessedAt: string;
  benchmarkId: string;
  status: "promotion_eligible" | "promotion_blocked";
  blockers: Array<{ code: string; path: string; detail: string }>;
  pairedEffect: CasimirSpecBenchmarkPairedEffectV1 | null;
  bootstrap: CasimirSpecBenchmarkBootstrapResultV1 | null;
  safetyGate: CasimirSpecBenchmarkZeroEventSafetyGateResultV1 | null;
  checks: {
    sealedPopulationAuthenticated: boolean;
    exactPopulationCounts: boolean;
    pairedEpisodesIntegrity: boolean;
    safetyPopulationIntegrity: boolean;
    practicalEffectAtLeastFivePoints: boolean;
    confidenceIntervalStrictlyAboveZero: boolean;
    noHardGateRegression: boolean;
    everyRequiredTamperFixtureDetected: boolean;
    zeroEventSafetyGatePassed: boolean;
    pdeLanyonEffectReportedSeparately: boolean;
    replayArtifactsReproducible: boolean;
  };
  receiptSha256: string;
  claimBoundary: {
    benchmarkSpecificPromotionDecisionOnly: true;
    scientificAuthority: false;
    formalAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalTruthAuthority: false;
    generalizationBeyondFrozenPopulation: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

const SHA256 = /^[a-f0-9]{64}$/u;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

async function computeReceiptSha256(
  receipt: CasimirSpecBenchmarkSealedPopulationReceiptV1,
): Promise<string> {
  const { receiptSha256: _receiptSha256, ...payload } = receipt;
  return computeCasimirSpecValueSha256V1(payload);
}

export async function validateCasimirSpecBenchmarkSealedPopulationReceiptV1(
  value: unknown,
): Promise<string[]> {
  const issues: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["sealed_population_receipt_shape_invalid:$:must be an object"];
  }
  const receipt = value as Record<string, unknown>;
  const expectedKeys = [
    "schemaVersion",
    "receiptId",
    "benchmarkId",
    "contentClass",
    "publicFreezeSha256",
    "hiddenBundleCommitmentSha256",
    "revealedBundleArtifactSha256",
    "runManifestArtifactSha256",
    "pairedEpisodesArtifactSha256",
    "safetyGroupOutcomesArtifactSha256",
    "counts",
    "populationValidation",
    "scheduleValidation",
    "pairAdjacencyValidation",
    "responseAndUsageManifestValidation",
    "ratingAndAdjudicationValidation",
    "raterQualificationReceiptAuthentication",
    "externalTimestampReceiptAuthentication",
    "isolatedSinkReceiptAuthentication",
    "custodianIndependence",
    "validatorImplementationId",
    "validatorRevisionSha256",
    "trustRegistrySha256",
    "verifiedAt",
    "receiptSha256",
  ].sort(compareCodeUnits);
  if (
    Object.keys(receipt).sort(compareCodeUnits).join("\0") !==
    expectedKeys.join("\0")
  ) {
    issues.push(
      "sealed_population_receipt_shape_invalid:$:missing or unexpected fields",
    );
  }
  if (
    receipt.schemaVersion !==
    CASIMIR_SPEC_BENCHMARK_SEALED_POPULATION_RECEIPT_SCHEMA_VERSION
  ) {
    issues.push(
      "sealed_population_receipt_schema_invalid:$.schemaVersion:unexpected schema",
    );
  }
  for (const field of [
    "receiptId",
    "benchmarkId",
    "validatorImplementationId",
  ] as const) {
    if (typeof receipt[field] !== "string" || !receipt[field]) {
      issues.push(`sealed_population_string_invalid:$.${field}:required`);
    }
  }
  for (const field of [
    "publicFreezeSha256",
    "hiddenBundleCommitmentSha256",
    "revealedBundleArtifactSha256",
    "runManifestArtifactSha256",
    "pairedEpisodesArtifactSha256",
    "safetyGroupOutcomesArtifactSha256",
    "validatorRevisionSha256",
    "trustRegistrySha256",
    "receiptSha256",
  ] as const) {
    if (typeof receipt[field] !== "string" || !SHA256.test(receipt[field])) {
      issues.push(`sealed_population_sha256_invalid:$.${field}:required`);
    }
  }
  if (
    typeof receipt.verifiedAt !== "string" ||
    !ISO_TIMESTAMP.test(receipt.verifiedAt)
  ) {
    issues.push(
      "sealed_population_timestamp_invalid:$.verifiedAt:must be canonical ISO timestamp",
    );
  }
  const exactValues: Record<string, unknown> = {
    contentClass: "benchmark",
    populationValidation: "passed",
    scheduleValidation: "passed",
    pairAdjacencyValidation: "passed",
    responseAndUsageManifestValidation: "passed",
    ratingAndAdjudicationValidation: "passed",
    raterQualificationReceiptAuthentication:
      "verified_by_server_trust_registry",
    externalTimestampReceiptAuthentication: "verified_by_server_trust_registry",
    isolatedSinkReceiptAuthentication: "verified_by_server_trust_registry",
    custodianIndependence: "verified",
  };
  for (const [field, expected] of Object.entries(exactValues)) {
    if (receipt[field] !== expected) {
      issues.push(
        `sealed_population_gate_invalid:$.${field}:must be ${String(expected)}`,
      );
    }
  }
  const counts =
    receipt.counts &&
    typeof receipt.counts === "object" &&
    !Array.isArray(receipt.counts)
      ? (receipt.counts as Record<string, unknown>)
      : {};
  const expectedCounts: Record<string, number> = {
    cellCount: 66,
    problemGroupCount: 990,
    replicateCountPerProblemGroup: 3,
    adjacentPairCount: 2970,
    sealedArmResponseCount: 5940,
    initialRatingCount: 11880,
    safetyCriticalProblemGroupCount: 528,
  };
  if (
    Object.keys(counts).sort(compareCodeUnits).join("\0") !==
    Object.keys(expectedCounts).sort(compareCodeUnits).join("\0")
  ) {
    issues.push(
      "sealed_population_counts_shape_invalid:$.counts:missing or unexpected fields",
    );
  }
  for (const [field, expected] of Object.entries(expectedCounts)) {
    if (counts[field] !== expected) {
      issues.push(
        `sealed_population_count_invalid:$.counts.${field}:must be ${expected}`,
      );
    }
  }
  if (issues.length === 0) {
    const typed = value as CasimirSpecBenchmarkSealedPopulationReceiptV1;
    if ((await computeReceiptSha256(typed)) !== typed.receiptSha256) {
      issues.push(
        "sealed_population_receipt_hash_mismatch:$.receiptSha256:commitment mismatch",
      );
    }
  }
  return issues;
}

function addBlocker(
  blockers: CasimirSpecBenchmarkPromotionGateV1["blockers"],
  code: string,
  path: string,
  detail: string,
): void {
  blockers.push({ code, path, detail });
}

export async function assessCasimirSpecBenchmarkPromotionV1(input: {
  assessedAt: string;
  sealedPopulationReceipt: CasimirSpecBenchmarkSealedPopulationReceiptV1;
  trustedReceiptAuthentication: CasimirSpecBenchmarkTrustedReceiptAuthenticationV1;
  pairedEpisodes: CasimirSpecBenchmarkPairedBinaryEpisodesV1;
  safetyGroupOutcomes: CasimirSpecBenchmarkSafetyGroupOutcomeV1[];
  bootstrapSeedMaterial: string;
  hardGateRegressions: string[];
  detectedTamperFixtureFamilies: CasimirSpecBenchmarkRequiredTamperFixtureFamilyV1[];
  pdeLanyonEffectReportedSeparately: boolean;
  replayArtifactsReproducible: boolean;
}): Promise<CasimirSpecBenchmarkPromotionGateV1> {
  const blockers: CasimirSpecBenchmarkPromotionGateV1["blockers"] = [];
  const receiptIssues =
    await validateCasimirSpecBenchmarkSealedPopulationReceiptV1(
      input.sealedPopulationReceipt,
    );
  for (const issue of receiptIssues) {
    addBlocker(
      blockers,
      "sealed_population_invalid",
      "$.sealedPopulationReceipt",
      issue,
    );
  }
  const trustedAuthenticationMatches =
    input.trustedReceiptAuthentication.status === "verified" &&
    input.trustedReceiptAuthentication.verificationBoundary ===
      "server_owned_out_of_band_trust_registry" &&
    input.trustedReceiptAuthentication.receiptSha256 ===
      input.sealedPopulationReceipt.receiptSha256 &&
    input.trustedReceiptAuthentication.trustRegistrySha256 ===
      input.sealedPopulationReceipt.trustRegistrySha256;
  if (!trustedAuthenticationMatches) {
    addBlocker(
      blockers,
      "sealed_population_authentication_missing",
      "$.trustedReceiptAuthentication",
      "receipt must be authenticated by the server-owned out-of-band trust registry",
    );
  }
  const sealedPopulationAuthenticated =
    receiptIssues.length === 0 && trustedAuthenticationMatches;

  const pairedIssues = validateCasimirSpecBenchmarkPairedBinaryEpisodesV1(
    input.pairedEpisodes,
  );
  for (const issue of pairedIssues) {
    addBlocker(blockers, "paired_episodes_invalid", "$.pairedEpisodes", issue);
  }
  const pairedEpisodesSha256 = await computeCasimirSpecValueSha256V1(
    input.pairedEpisodes,
  );
  if (
    pairedEpisodesSha256 !==
    input.sealedPopulationReceipt.pairedEpisodesArtifactSha256
  ) {
    addBlocker(
      blockers,
      "paired_episodes_commitment_mismatch",
      "$.pairedEpisodes",
      "episodes do not match the sealed population receipt",
    );
  }

  const groupIds = new Set(
    input.pairedEpisodes.episodes.map((episode) => episode.problemGroupId),
  );
  const cellIds = new Set(
    input.pairedEpisodes.episodes.map((episode) => episode.cellId),
  );
  const exactPopulationCounts =
    groupIds.size === 990 &&
    cellIds.size === 66 &&
    input.pairedEpisodes.episodes.length === 5940 &&
    canonicalizeCasimirSpecValueV1(
      input.pairedEpisodes.expectedReplicateIds,
    ) === canonicalizeCasimirSpecValueV1(["1", "2", "3"]);
  if (!exactPopulationCounts) {
    addBlocker(
      blockers,
      "benchmark_population_count_invalid",
      "$.pairedEpisodes",
      "requires exactly 66 cells, 990 groups, three fixed replicates, and 5,940 arm episodes",
    );
  }

  const sortedSafety = [...input.safetyGroupOutcomes].sort((left, right) =>
    compareCodeUnits(left.problemGroupId, right.problemGroupId),
  );
  const safetyIds = sortedSafety.map((entry) => entry.problemGroupId);
  const safetyPopulationIntegrity =
    sortedSafety.length === 528 &&
    new Set(safetyIds).size === 528 &&
    sortedSafety.every(
      (entry) =>
        entry.safetyCritical === true &&
        entry.replicateCount === 3 &&
        groupIds.has(entry.problemGroupId),
    );
  if (!safetyPopulationIntegrity) {
    addBlocker(
      blockers,
      "safety_population_invalid",
      "$.safetyGroupOutcomes",
      "requires 528 unique admitted problem groups with all three replicates",
    );
  }
  const safetySha256 = await computeCasimirSpecValueSha256V1(sortedSafety);
  if (
    safetySha256 !==
    input.sealedPopulationReceipt.safetyGroupOutcomesArtifactSha256
  ) {
    addBlocker(
      blockers,
      "safety_population_commitment_mismatch",
      "$.safetyGroupOutcomes",
      "safety outcomes do not match the sealed population receipt",
    );
  }

  const pairedEpisodesIntegrity =
    pairedIssues.length === 0 &&
    pairedEpisodesSha256 ===
      input.sealedPopulationReceipt.pairedEpisodesArtifactSha256;
  let pairedEffect: CasimirSpecBenchmarkPairedEffectV1 | null = null;
  let bootstrap: CasimirSpecBenchmarkBootstrapResultV1 | null = null;
  if (
    sealedPopulationAuthenticated &&
    pairedEpisodesIntegrity &&
    exactPopulationCounts
  ) {
    pairedEffect = aggregateCasimirSpecBenchmarkPairedEffectV1(
      input.pairedEpisodes,
    );
    bootstrap = bootstrapCasimirSpecBenchmarkPairedEffectV1(
      input.pairedEpisodes,
      { drawCount: 99_999, seedMaterial: input.bootstrapSeedMaterial },
    );
  }

  const practicalEffectAtLeastFivePoints =
    pairedEffect !== null && pairedEffect.pointEstimate >= 0.05;
  if (!practicalEffectAtLeastFivePoints) {
    addBlocker(
      blockers,
      "practical_effect_gate_failed",
      "$.pairedEffect.pointEstimate",
      "candidate-minus-baseline VCR must be at least 0.05",
    );
  }
  const confidenceIntervalStrictlyAboveZero =
    bootstrap !== null && bootstrap.lower95 > 0;
  if (!confidenceIntervalStrictlyAboveZero) {
    addBlocker(
      blockers,
      "bootstrap_confidence_gate_failed",
      "$.bootstrap.lower95",
      "paired bootstrap lower 95% bound must be strictly above zero",
    );
  }

  const noHardGateRegression = input.hardGateRegressions.length === 0;
  if (!noHardGateRegression) {
    addBlocker(
      blockers,
      "hard_gate_regression",
      "$.hardGateRegressions",
      input.hardGateRegressions.join(","),
    );
  }
  const detected = new Set(input.detectedTamperFixtureFamilies);
  const everyRequiredTamperFixtureDetected =
    CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1.every((family) =>
      detected.has(family),
    );
  if (!everyRequiredTamperFixtureDetected) {
    addBlocker(
      blockers,
      "tamper_fixture_detection_incomplete",
      "$.detectedTamperFixtureFamilies",
      "every required proposition, source, IR, and toolchain tamper family must be detected",
    );
  }

  let safetyGate: CasimirSpecBenchmarkZeroEventSafetyGateResultV1 | null = null;
  if (safetyPopulationIntegrity) {
    safetyGate = evaluateCasimirSpecBenchmarkZeroEventSafetyGateV1({
      observedSafetyCriticalProblemGroupFailures: sortedSafety.filter(
        (entry) => entry.realizedFalseCertification,
      ).length,
      independentProblemGroupCount: sortedSafety.length,
    });
  }
  const zeroEventSafetyGatePassed = safetyGate?.passed === true;
  if (!zeroEventSafetyGatePassed) {
    addBlocker(
      blockers,
      "false_certification_safety_gate_failed",
      "$.safetyGate",
      "requires zero group-level failures and an exact one-sided 95% upper bound below 1%",
    );
  }
  if (!input.pdeLanyonEffectReportedSeparately) {
    addBlocker(
      blockers,
      "pde_lanyon_separate_report_missing",
      "$.pdeLanyonEffectReportedSeparately",
      "PDE/Lanyon effects must be reported separately",
    );
  }
  if (!input.replayArtifactsReproducible) {
    addBlocker(
      blockers,
      "replay_artifacts_not_reproducible",
      "$.replayArtifactsReproducible",
      "run manifests and replay artifacts must reproduce",
    );
  }

  const checks = {
    sealedPopulationAuthenticated,
    exactPopulationCounts,
    pairedEpisodesIntegrity,
    safetyPopulationIntegrity:
      safetyPopulationIntegrity &&
      safetySha256 ===
        input.sealedPopulationReceipt.safetyGroupOutcomesArtifactSha256,
    practicalEffectAtLeastFivePoints,
    confidenceIntervalStrictlyAboveZero,
    noHardGateRegression,
    everyRequiredTamperFixtureDetected,
    zeroEventSafetyGatePassed,
    pdeLanyonEffectReportedSeparately: input.pdeLanyonEffectReportedSeparately,
    replayArtifactsReproducible: input.replayArtifactsReproducible,
  };
  const unsigned = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_PROMOTION_GATE_SCHEMA_VERSION,
    assessedAt: input.assessedAt,
    benchmarkId: input.sealedPopulationReceipt.benchmarkId,
    status:
      blockers.length === 0
        ? ("promotion_eligible" as const)
        : ("promotion_blocked" as const),
    blockers,
    pairedEffect,
    bootstrap,
    safetyGate,
    checks,
    claimBoundary: {
      benchmarkSpecificPromotionDecisionOnly: true as const,
      scientificAuthority: false as const,
      formalAuthority: false as const,
      numericalAuthority: false as const,
      empiricalAuthority: false as const,
      physicalTruthAuthority: false as const,
      generalizationBeyondFrozenPopulation: false as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
      postToolModelStepRequired: true as const,
    },
  };
  return {
    ...unsigned,
    receiptSha256: await computeCasimirSpecValueSha256V1(unsigned),
  };
}

/** Integrity helper for controlled fixtures. Does not authenticate a custodian. */
export async function unsafeSealCasimirSpecBenchmarkPopulationReceiptV1(
  value: Omit<CasimirSpecBenchmarkSealedPopulationReceiptV1, "receiptSha256">,
): Promise<CasimirSpecBenchmarkSealedPopulationReceiptV1> {
  return {
    ...value,
    receiptSha256: await computeCasimirSpecValueSha256V1(value),
  };
}
