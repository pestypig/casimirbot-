import { describe, expect, it } from "vitest";
import {
  CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1,
  CASIMIR_SPEC_BENCHMARK_SEALED_POPULATION_RECEIPT_SCHEMA_VERSION,
  assessCasimirSpecBenchmarkPromotionV1,
  unsafeSealCasimirSpecBenchmarkPopulationReceiptV1,
  validateCasimirSpecBenchmarkSealedPopulationReceiptV1,
  type CasimirSpecBenchmarkSafetyGroupOutcomeV1,
} from "../casimir-spec-benchmark-promotion-gate.v1";
import {
  CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION,
  type CasimirSpecBenchmarkPairedBinaryEpisodesV1,
} from "../casimir-spec-benchmark-statistics.v1";
import { computeCasimirSpecValueSha256V1 } from "../casimir-spec-scientific-claim-ir.v1";

const HASH = "a".repeat(64);
const SEED = "0123456789abcdef".repeat(4);

function productionPopulation(): {
  pairedEpisodes: CasimirSpecBenchmarkPairedBinaryEpisodesV1;
  safetyGroupOutcomes: CasimirSpecBenchmarkSafetyGroupOutcomeV1[];
} {
  const episodes: CasimirSpecBenchmarkPairedBinaryEpisodesV1["episodes"] = [];
  const safetyGroupOutcomes: CasimirSpecBenchmarkSafetyGroupOutcomeV1[] = [];
  for (let cellIndex = 0; cellIndex < 66; cellIndex += 1) {
    const cellId = `cell-${String(cellIndex).padStart(2, "0")}`;
    for (let groupIndex = 0; groupIndex < 15; groupIndex += 1) {
      const problemGroupId = `${cellId}:group-${String(groupIndex).padStart(2, "0")}`;
      for (const replicateId of ["1", "2", "3"]) {
        episodes.push(
          {
            cellId,
            problemGroupId,
            replicateId,
            armId: "baseline",
            executionStatus: "completed",
            outcome: 0,
          },
          {
            cellId,
            problemGroupId,
            replicateId,
            armId: "candidate",
            executionStatus: "completed",
            outcome: 1,
          },
        );
      }
      if (groupIndex < 8) {
        safetyGroupOutcomes.push({
          problemGroupId,
          safetyCritical: true,
          replicateCount: 3,
          realizedFalseCertification: false,
        });
      }
    }
  }
  return {
    pairedEpisodes: {
      schemaVersion: CASIMIR_SPEC_BENCHMARK_PAIRED_EPISODES_SCHEMA_VERSION,
      arms: { baseline: "baseline", candidate: "candidate" },
      expectedReplicateIds: ["1", "2", "3"],
      episodes,
    },
    safetyGroupOutcomes,
  };
}

async function admittedFixture() {
  const population = productionPopulation();
  const pairedEpisodesArtifactSha256 = await computeCasimirSpecValueSha256V1(
    population.pairedEpisodes,
  );
  const safetyGroupOutcomesArtifactSha256 =
    await computeCasimirSpecValueSha256V1(population.safetyGroupOutcomes);
  const receipt = await unsafeSealCasimirSpecBenchmarkPopulationReceiptV1({
    schemaVersion:
      CASIMIR_SPEC_BENCHMARK_SEALED_POPULATION_RECEIPT_SCHEMA_VERSION,
    receiptId: "sealed-population:benchmark-v1",
    benchmarkId: "casimir-spec-benchmark-v1",
    contentClass: "benchmark",
    publicFreezeSha256: HASH,
    hiddenBundleCommitmentSha256: "b".repeat(64),
    revealedBundleArtifactSha256: "c".repeat(64),
    runManifestArtifactSha256: "d".repeat(64),
    pairedEpisodesArtifactSha256,
    safetyGroupOutcomesArtifactSha256,
    counts: {
      cellCount: 66,
      problemGroupCount: 990,
      replicateCountPerProblemGroup: 3,
      adjacentPairCount: 2970,
      sealedArmResponseCount: 5940,
      initialRatingCount: 11880,
      safetyCriticalProblemGroupCount: 528,
    },
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
    validatorImplementationId: "casimir-benchmark-sealed-population-verifier",
    validatorRevisionSha256: "e".repeat(64),
    trustRegistrySha256: "f".repeat(64),
    verifiedAt: "2026-07-25T20:30:00.000Z",
  });
  return { ...population, receipt };
}

describe("Casimir Spec sealed benchmark promotion gate", () => {
  it("admits only an exact authenticated population that passes every promotion gate", async () => {
    const fixture = await admittedFixture();
    expect(
      await validateCasimirSpecBenchmarkSealedPopulationReceiptV1(
        fixture.receipt,
      ),
    ).toEqual([]);

    const result = await assessCasimirSpecBenchmarkPromotionV1({
      assessedAt: "2026-07-25T20:31:00.000Z",
      sealedPopulationReceipt: fixture.receipt,
      trustedReceiptAuthentication: {
        status: "verified",
        verificationBoundary: "server_owned_out_of_band_trust_registry",
        receiptSha256: fixture.receipt.receiptSha256,
        trustRegistrySha256: fixture.receipt.trustRegistrySha256,
      },
      pairedEpisodes: fixture.pairedEpisodes,
      safetyGroupOutcomes: fixture.safetyGroupOutcomes,
      bootstrapSeedMaterial: SEED,
      hardGateRegressions: [],
      detectedTamperFixtureFamilies: [
        ...CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1,
      ],
      pdeLanyonEffectReportedSeparately: true,
      replayArtifactsReproducible: true,
    });

    expect(result.status).toBe("promotion_eligible");
    expect(result.blockers).toEqual([]);
    expect(result.pairedEffect?.pointEstimate).toBe(1);
    expect(result.bootstrap?.drawCount).toBe(99_999);
    expect(result.bootstrap?.lower95).toBe(1);
    expect(result.safetyGate).toMatchObject({
      passed: true,
      observedSafetyCriticalProblemGroupFailures: 0,
      independentProblemGroupCount: 528,
    });
    expect(result.safetyGate?.upperConfidenceBound95).toBeLessThan(0.01);
    expect(Object.values(result.checks).every(Boolean)).toBe(true);
    expect(result.claimBoundary.scientificAuthority).toBe(false);
    expect(result.claimBoundary.physicalTruthAuthority).toBe(false);
    expect(result.claimBoundary.terminalEligible).toBe(false);
  }, 120_000);

  it("blocks a forged population receipt and realized false certification", async () => {
    const fixture = await admittedFixture();
    const forged = structuredClone(fixture.receipt);
    forged.receiptSha256 = "0".repeat(64);
    fixture.safetyGroupOutcomes[0].realizedFalseCertification = true;

    const result = await assessCasimirSpecBenchmarkPromotionV1({
      assessedAt: "2026-07-25T20:32:00.000Z",
      sealedPopulationReceipt: forged,
      trustedReceiptAuthentication: {
        status: "verified",
        verificationBoundary: "server_owned_out_of_band_trust_registry",
        receiptSha256: fixture.receipt.receiptSha256,
        trustRegistrySha256: fixture.receipt.trustRegistrySha256,
      },
      pairedEpisodes: fixture.pairedEpisodes,
      safetyGroupOutcomes: fixture.safetyGroupOutcomes,
      bootstrapSeedMaterial: SEED,
      hardGateRegressions: [],
      detectedTamperFixtureFamilies: [
        ...CASIMIR_SPEC_BENCHMARK_REQUIRED_TAMPER_FIXTURE_FAMILIES_V1,
      ],
      pdeLanyonEffectReportedSeparately: true,
      replayArtifactsReproducible: true,
    });

    expect(result.status).toBe("promotion_blocked");
    expect(result.checks.sealedPopulationAuthenticated).toBe(false);
    expect(result.checks.zeroEventSafetyGatePassed).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining([
        "sealed_population_invalid",
        "safety_population_commitment_mismatch",
        "false_certification_safety_gate_failed",
      ]),
    );
    expect(result.claimBoundary.assistantAnswer).toBe(false);
  });
});
