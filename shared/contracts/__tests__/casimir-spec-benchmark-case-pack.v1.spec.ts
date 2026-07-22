import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import trackedRubric from "../../../configs/casimir-spec-vcr-rubric.v1.json";
import {
  CASIMIR_SPEC_BENCHMARK_CANDIDATE_PACK_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_CASE_PACK_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_COMMITMENT_REVEAL_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_DIFFICULTIES,
  CASIMIR_SPEC_BENCHMARK_DOMAINS,
  CASIMIR_SPEC_BENCHMARK_HIDDEN_GOLD_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA,
  CASIMIR_SPEC_BENCHMARK_PUBLIC_FREEZE_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_RATING_PACKET_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_RATING_SCHEMA_VERSION,
  CASIMIR_SPEC_BENCHMARK_SOURCE_USING_ARMS,
  CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
  CASIMIR_SPEC_VCR_CRITERIA,
  CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1,
  computeCasimirSpecBenchmarkAggregateCountsV1,
  computeCasimirSpecBenchmarkVcrV1,
  computeCasimirSpecFrozenArtifactValueHashesV1,
  computeCasimirSpecHiddenBundleCommitmentV1,
  computeCasimirSpecHiddenBundleHashesV1,
  deriveCasimirSpecBenchmarkCandidatePackV1,
  deriveCasimirSpecBenchmarkPublicDevelopmentPackV1,
  validateCasimirSpecBenchmarkBundleV1,
  validateCasimirSpecBenchmarkCandidatePackV1,
  validateCasimirSpecBenchmarkCasePackV1,
  validateCasimirSpecBenchmarkHiddenGoldBundleV1,
  validateCasimirSpecBenchmarkPublicFreezeV1,
  validateCasimirSpecBenchmarkRatingPacketV1,
  validateCasimirSpecBenchmarkRatingV1,
  validateCasimirSpecVcrRubricAuthorityV1,
  verifyCasimirSpecHiddenBundleCommitmentRevealV1,
  type CasimirSpecBenchmarkCandidatePackV1,
  type CasimirSpecBenchmarkCasePackV1,
  type CasimirSpecBenchmarkCaseV1,
  type CasimirSpecBenchmarkFrozenArtifactRefV1,
  type CasimirSpecBenchmarkHiddenBundleCommitmentRevealV1,
  type CasimirSpecBenchmarkHiddenGoldBundleV1,
  type CasimirSpecBenchmarkHiddenGoldCaseV1,
  type CasimirSpecBenchmarkPublicFreezeV1,
  type CasimirSpecBenchmarkRatingPacketV1,
  type CasimirSpecBenchmarkRatingV1,
  type CasimirSpecBenchmarkRevealArtifactsV1,
} from "../casimir-spec-benchmark-case-pack.v1";
import {
  canonicalizeCasimirSpecValueV1,
  computeCasimirSpecValueSha256V1,
} from "../casimir-spec-scientific-claim-ir.v1";

const encoder = new TextEncoder();
const opaqueId = (value: number): string =>
  value.toString(16).padStart(32, "0");
const digest = (value: number): string => (value % 16).toString(16).repeat(64);
const jsonBytes = (value: unknown): Uint8Array =>
  encoder.encode(canonicalizeCasimirSpecValueV1(value));

const syncSha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const candidateArtifactValue = (
  artifactId: string,
): Record<string, unknown> => ({
  schemaVersion: "casimir_spec_candidate_artifact/v1",
  artifactId,
  payload: `opaque-candidate-content:${artifactId}`,
});

async function rawSha256(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

const artifactRef = (
  value: number,
): CasimirSpecBenchmarkFrozenArtifactRefV1 => {
  const artifactId = opaqueId(value);
  const artifactValue = candidateArtifactValue(artifactId);
  const bytes = jsonBytes(artifactValue);
  return {
    artifactId,
    portablePath: `artifacts/casimir-spec/candidate/${artifactId}.json`,
    schemaVersion: "casimir_spec_candidate_artifact/v1",
    rawSha256: syncSha256(bytes),
    sizeBytes: bytes.byteLength,
    mediaType: "application/json",
    frozen: true,
    semanticSha256: syncSha256(
      canonicalizeCasimirSpecValueV1({
        domain: "casimir-spec-frozen-artifact-semantic/v1",
        value: artifactValue,
      }),
    ),
    artifactSha256: syncSha256(
      canonicalizeCasimirSpecValueV1({
        domain: "casimir-spec-frozen-artifact-whole/v1",
        value: artifactValue,
      }),
    ),
  };
};

async function frozenJsonRef(
  value: Record<string, unknown>,
  id: number,
  portablePath: string,
): Promise<{
  ref: CasimirSpecBenchmarkFrozenArtifactRefV1;
  bytes: Uint8Array;
}> {
  const bytes = jsonBytes(value);
  const hashes = await computeCasimirSpecFrozenArtifactValueHashesV1(value);
  return {
    bytes,
    ref: {
      artifactId: opaqueId(id),
      portablePath,
      schemaVersion: String(value.schemaVersion),
      rawSha256: await rawSha256(bytes),
      sizeBytes: bytes.byteLength,
      mediaType: "application/json",
      frozen: true,
      semanticSha256: hashes.semanticSha256,
      artifactSha256: hashes.artifactSha256,
    },
  };
}

function makeCase(
  value: number,
  overrides: Partial<CasimirSpecBenchmarkCaseV1> = {},
): CasimirSpecBenchmarkCaseV1 {
  const sourceProjectionRef = artifactRef(value + 100);
  const retrievalProjectionRef = artifactRef(value + 150);
  const taskProjectionRef = artifactRef(value + 200);
  const base: CasimirSpecBenchmarkCaseV1 = {
    caseId: opaqueId(value),
    problemGroupId: opaqueId(value + 3000),
    leakageComponentId: opaqueId(value + 5000),
    isolationKeys: {
      underlyingProblemIds: [opaqueId(value + 7000)],
      paraphraseFamilyIds: [opaqueId(value + 9000)],
      notationFamilyIds: [opaqueId(value + 11000)],
      sourceVariantFamilyIds: [opaqueId(value + 13000)],
      templateAncestryIds: [opaqueId(value + 15000)],
      goldSemanticFamilyIds: [opaqueId(value + 17000)],
      discriminatingSourceSha256s: [digest(value + 19000)],
    },
    split: "public",
    domain: "physics_astronomy",
    primaryStratum: "open_world_abstention",
    difficulty: "adversarial",
    safetyCritical: true,
    backendEligibility: { lean: "eligible", lanyonPde: "eligible" },
    taskProjectionRef,
    sourceProjectionRef,
    retrievalProjectionRef,
    sourceParity: [],
  };
  const result = { ...base, ...overrides };
  if (!overrides.sourceParity) {
    result.sourceParity = CASIMIR_SPEC_BENCHMARK_SOURCE_USING_ARMS.map(
      (armId) => ({
        armId,
        initialSourceProjectionRef: structuredClone(result.sourceProjectionRef),
        initialRetrievalProjectionRef: structuredClone(
          result.retrievalProjectionRef,
        ),
      }),
    );
  }
  return result;
}

function makeGold(
  benchmarkCase: CasimirSpecBenchmarkCaseV1,
  value: number,
): CasimirSpecBenchmarkHiddenGoldCaseV1 {
  const requiredAssertionId = opaqueId(value + 21000);
  const forbiddenAssertionId = opaqueId(value + 23000);
  return {
    goldId: opaqueId(value + 25000),
    caseId: benchmarkCase.caseId,
    criteria: CASIMIR_SPEC_VCR_CRITERIA.map((criterionId) => ({ criterionId })),
    semanticCatalog: [
      {
        semanticId: opaqueId(value + 27000),
        kind: "proposition",
        canonicalStatement: "The exact required proposition and scope.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.sourceProjectionRef.artifactId,
            locator: "source:required-proposition",
          },
        ],
      },
      {
        semanticId: opaqueId(value + 29000),
        kind: "certification_boundary",
        canonicalStatement: "The prohibited physical certification boundary.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.sourceProjectionRef.artifactId,
            locator: "source:certification-boundary",
          },
        ],
      },
      {
        semanticId: opaqueId(value + 33000),
        kind: "uncertainty",
        canonicalStatement: "The required unknown.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.retrievalProjectionRef.artifactId,
            locator: "retrieval:unknown",
          },
        ],
      },
      {
        semanticId: opaqueId(value + 37000),
        kind: "exclusion",
        canonicalStatement: "The required excluded claim.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.retrievalProjectionRef.artifactId,
            locator: "retrieval:exclusion",
          },
        ],
      },
      {
        semanticId: opaqueId(value + 41000),
        kind: "blocker",
        canonicalStatement: "The required blocker.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.retrievalProjectionRef.artifactId,
            locator: "retrieval:blocker",
          },
        ],
      },
      {
        semanticId: opaqueId(value + 45000),
        kind: "unit",
        canonicalStatement: "The canonical unit for the numeric tolerance.",
        sourceSupport: [
          {
            artifactId: benchmarkCase.sourceProjectionRef.artifactId,
            locator: "source:unit",
          },
        ],
      },
    ],
    requiredAssertions: [
      {
        assertionId: requiredAssertionId,
        predicateId: "claim_scope_matches_source",
        argumentIds: [opaqueId(value + 27000)],
        polarity: "affirmed",
      },
    ],
    forbiddenAssertions: [
      {
        assertionId: forbiddenAssertionId,
        predicateId: "unsupported_physical_certification",
        argumentIds: [opaqueId(value + 29000)],
        polarity: "affirmed",
      },
    ],
    requiredUnknowns: [
      {
        itemId: opaqueId(value + 31000),
        predicateId: "unknown_required",
        subjectIds: [opaqueId(value + 33000)],
      },
    ],
    requiredExclusions: [
      {
        itemId: opaqueId(value + 35000),
        predicateId: "exclusion_required",
        subjectIds: [opaqueId(value + 37000)],
      },
    ],
    requiredBlockers: [
      {
        itemId: opaqueId(value + 39000),
        predicateId: "blocker_required",
        subjectIds: [opaqueId(value + 41000)],
      },
    ],
    numericTolerances: [
      {
        toleranceId: opaqueId(value + 43000),
        assertionId: requiredAssertionId,
        expectedValue: 1.25,
        absoluteTolerance: 0.01,
        relativeTolerance: 0,
        unitId: opaqueId(value + 45000),
      },
    ],
    falseCertificationOpportunities: [
      {
        opportunityId: opaqueId(value + 47000),
        forbiddenAssertionId,
        safetyCritical: benchmarkCase.safetyCritical,
      },
    ],
    backendEligibility: structuredClone(benchmarkCase.backendEligibility),
  };
}

const rubric = structuredClone(CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1);

type SyntheticFixture = {
  casePack: CasimirSpecBenchmarkCasePackV1;
  candidatePack: CasimirSpecBenchmarkCandidatePackV1;
  hiddenGold: CasimirSpecBenchmarkHiddenGoldBundleV1;
  freeze: CasimirSpecBenchmarkPublicFreezeV1;
  reveal: CasimirSpecBenchmarkHiddenBundleCommitmentRevealV1;
  artifacts: CasimirSpecBenchmarkRevealArtifactsV1;
  externalFreezeSha256: string;
};

async function makeFixture(
  suppliedCases: CasimirSpecBenchmarkCaseV1[] = [makeCase(1)],
): Promise<SyntheticFixture> {
  const cases = [...suppliedCases].sort((left, right) =>
    left.caseId.localeCompare(right.caseId),
  );
  const casePack: CasimirSpecBenchmarkCasePackV1 = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_CASE_PACK_SCHEMA_VERSION,
    benchmarkId: "synthetic-case-pack-contract-conformance",
    contentClass: "synthetic_conformance_only_not_benchmark",
    visibility: "custodian_only_case_metadata",
    cases,
  };
  const candidatePack = deriveCasimirSpecBenchmarkCandidatePackV1(casePack);
  const hiddenGold: CasimirSpecBenchmarkHiddenGoldBundleV1 = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_HIDDEN_GOLD_SCHEMA_VERSION,
    benchmarkId: casePack.benchmarkId,
    contentClass: casePack.contentClass,
    visibility: "evaluator_only_hidden_gold",
    goldCases: cases.map((entry, index) => makeGold(entry, index + 1)),
  };
  const casePackBytes = jsonBytes(casePack);
  const publicDevelopmentPack =
    deriveCasimirSpecBenchmarkPublicDevelopmentPackV1(casePack, candidatePack);
  const [candidateArtifact, publicDevelopmentArtifact, rubricArtifact] =
    await Promise.all([
      frozenJsonRef(
        candidatePack as unknown as Record<string, unknown>,
        49001,
        "artifacts/casimir-spec/restricted/candidate-pack.json",
      ),
      frozenJsonRef(
        publicDevelopmentPack,
        49000,
        "artifacts/casimir-spec/freeze/public-development-pack.json",
      ),
      frozenJsonRef(
        rubric,
        49002,
        "artifacts/casimir-spec/freeze/vcr-rubric.json",
      ),
    ]);
  const closureSpecs = [
    ["policy", 49003],
    ["prompt_bundle", 49004],
    ["tool_arm_manifest", 49005],
    ["model_sampling_account_pins", 49006],
    ["evaluator_adjudication", 49007],
    ["statistics_outcome", 49008],
    ["source_delivery_policy", 49009],
    ["schedule_derivation", 49010],
    ["leakage_audit", 49011],
    ["calibration_acceptance", 49012],
  ] as const;
  const closureArtifacts = await Promise.all(
    closureSpecs.map(([name, id]) =>
      frozenJsonRef(
        {
          schemaVersion: `casimir_spec_${name}/v1`,
          benchmarkId: casePack.benchmarkId,
          status: "synthetic_conformance_only",
        },
        id,
        `artifacts/casimir-spec/freeze/${name.replaceAll("_", "-")}.json`,
      ),
    ),
  );
  const hiddenGoldBytes = jsonBytes(hiddenGold);
  const hiddenBundleHashes = await computeCasimirSpecHiddenBundleHashesV1(
    casePack,
    casePackBytes,
    candidatePack,
    candidateArtifact.bytes,
    Object.fromEntries(
      candidatePack.candidateProjections.flatMap((projection) =>
        [
          projection.taskProjectionRef,
          projection.sourceProjectionRef,
          projection.retrievalProjectionRef,
        ].map((ref) => [
          ref.artifactId,
          {
            value: candidateArtifactValue(ref.artifactId),
            bytes: jsonBytes(candidateArtifactValue(ref.artifactId)),
          },
        ]),
      ),
    ),
    hiddenGold,
    hiddenGoldBytes,
  );
  const salt = new Uint8Array(32).fill(7);
  const commitmentSha256 = await computeCasimirSpecHiddenBundleCommitmentV1(
    CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
    salt,
    hiddenBundleHashes.semanticSha256,
    hiddenBundleHashes.artifactSha256,
  );
  const freeze: CasimirSpecBenchmarkPublicFreezeV1 = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_PUBLIC_FREEZE_SCHEMA_VERSION,
    benchmarkId: casePack.benchmarkId,
    contentClass: casePack.contentClass,
    visibility: "public_commitment_no_hidden_content",
    status: "synthetic_conformance_only_not_a_benchmark_freeze",
    frozenAt: "2026-07-21T12:00:00.000Z",
    designClosureRefs: {
      policyRef: closureArtifacts[0].ref,
      publicDevelopmentPackRef: publicDevelopmentArtifact.ref,
      rubricRef: rubricArtifact.ref,
      promptBundleRef: closureArtifacts[1].ref,
      toolArmManifestRef: closureArtifacts[2].ref,
      modelSamplingAccountPinsRef: closureArtifacts[3].ref,
      evaluatorAdjudicationRef: closureArtifacts[4].ref,
      statisticsOutcomeRef: closureArtifacts[5].ref,
      sourceDeliveryPolicyRef: closureArtifacts[6].ref,
      scheduleDerivationRef: closureArtifacts[7].ref,
      leakageAuditRef: closureArtifacts[8].ref,
      calibrationAcceptanceRef: closureArtifacts[9].ref,
    },
    hiddenBundleCommitment: {
      algorithm: "sha256_domain_zero_salt_semantic_artifact",
      domain: CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
      commitmentSha256,
      saltDisclosure: "withheld_32_bytes_until_reveal",
    },
    aggregateCounts: computeCasimirSpecBenchmarkAggregateCountsV1(
      casePack,
      hiddenGold,
    ),
  };
  const reveal: CasimirSpecBenchmarkHiddenBundleCommitmentRevealV1 = {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_COMMITMENT_REVEAL_SCHEMA_VERSION,
    domain: CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
    saltHex: Array.from(salt, (entry) =>
      entry.toString(16).padStart(2, "0"),
    ).join(""),
    hiddenBundleSemanticSha256: hiddenBundleHashes.semanticSha256,
    hiddenBundleArtifactSha256: hiddenBundleHashes.artifactSha256,
  };
  const publicArtifactsById: CasimirSpecBenchmarkRevealArtifactsV1["publicArtifactsById"] =
    {};
  publicArtifactsById[publicDevelopmentArtifact.ref.artifactId] = {
    value: publicDevelopmentPack,
    bytes: publicDevelopmentArtifact.bytes,
  };
  publicArtifactsById[rubricArtifact.ref.artifactId] = {
    value: rubric,
    bytes: rubricArtifact.bytes,
  };
  closureArtifacts.forEach((artifact, index) => {
    const [name] = closureSpecs[index];
    publicArtifactsById[artifact.ref.artifactId] = {
      value: {
        schemaVersion: `casimir_spec_${name}/v1`,
        benchmarkId: casePack.benchmarkId,
        status: "synthetic_conformance_only",
      },
      bytes: artifact.bytes,
    };
  });
  const restrictedArtifactsById: CasimirSpecBenchmarkRevealArtifactsV1["restrictedArtifactsById"] =
    {};
  for (const projection of candidatePack.candidateProjections) {
    for (const ref of [
      projection.taskProjectionRef,
      projection.sourceProjectionRef,
      projection.retrievalProjectionRef,
    ]) {
      restrictedArtifactsById[ref.artifactId] = {
        value: candidateArtifactValue(ref.artifactId),
        bytes: jsonBytes(candidateArtifactValue(ref.artifactId)),
      };
    }
  }
  const artifacts: CasimirSpecBenchmarkRevealArtifactsV1 = {
    casePackValue: casePack,
    casePackBytes,
    candidatePackValue: candidatePack,
    candidatePackBytes: candidateArtifact.bytes,
    restrictedArtifactsById,
    hiddenGoldValue: hiddenGold,
    hiddenGoldBytes,
    publicArtifactsById,
  };
  return {
    casePack,
    candidatePack,
    hiddenGold,
    freeze,
    reveal,
    artifacts,
    externalFreezeSha256: await computeCasimirSpecValueSha256V1(freeze),
  };
}

function issueCodes(issues: string[]): string[] {
  return issues.map(
    (entry) => entry.slice(0, entry.indexOf(":")).split(".").at(-1) ?? entry,
  );
}

function makeRatingPacket(
  gold: CasimirSpecBenchmarkHiddenGoldCaseV1,
  artifactUsage: {
    emittedOrReliedUpon: boolean;
    integrityOutcome: "vacuous_no_artifact" | "verified" | "failed";
  } = {
    emittedOrReliedUpon: false,
    integrityOutcome: "vacuous_no_artifact",
  },
): CasimirSpecBenchmarkRatingPacketV1 {
  return {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_RATING_PACKET_SCHEMA_VERSION,
    visibility: "blinded_evaluator_packet",
    blinding: "metadata_blinded_not_content_blinded",
    ratingPacketId: opaqueId(51000),
    caseId: gold.caseId,
    candidateResponseRef: artifactRef(51001),
    artifactUsage: {
      derivation: "sealed_candidate_response_and_tool_manifest",
      ...artifactUsage,
      sealedUsageManifestRef: artifactRef(51002),
    },
    hiddenGoldCaseId: gold.goldId,
  };
}

function makeRating(
  gold: CasimirSpecBenchmarkHiddenGoldCaseV1,
  packet: CasimirSpecBenchmarkRatingPacketV1,
): CasimirSpecBenchmarkRatingV1 {
  return {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_RATING_SCHEMA_VERSION,
    blinding: "metadata_blinded_not_content_blinded",
    ratingId: opaqueId(53000),
    ratingPacketId: packet.ratingPacketId,
    caseId: gold.caseId,
    criteria: gold.criteria.map((entry, index) => ({
      criterionId: entry.criterionId,
      rating: "pass",
      reason: "Synthetic conformance judgment with bound evidence.",
      evidence: [
        {
          evidenceId: opaqueId(54000 + index),
          artifactId: packet.candidateResponseRef.artifactId,
          locator: `response-node:${index}`,
        },
      ],
    })),
    falseCertificationJudgments: gold.falseCertificationOpportunities.map(
      (entry, index) => ({
        opportunityId: entry.opportunityId,
        outcome: "not_realized",
        reason: "The prohibited certification was not present.",
        evidence: [
          {
            evidenceId: opaqueId(56000 + index),
            artifactId: packet.candidateResponseRef.artifactId,
            locator: `certification-check:${index}`,
          },
        ],
      }),
    ),
  };
}

describe("casimir_spec_benchmark_case_pack/v1", () => {
  it("matches the frozen policy domain, difficulty, and nine-gate vocabularies", () => {
    expect(CASIMIR_SPEC_BENCHMARK_DOMAINS).toEqual([
      "formal_mathematics_statistics",
      "physics_astronomy",
      "chemistry_materials",
      "life_health_science",
      "earth_environment_space_science",
      "engineering_computational_science",
    ]);
    expect(CASIMIR_SPEC_BENCHMARK_DIFFICULTIES).toEqual([
      "direct",
      "compositional",
      "adversarial",
    ]);
    expect(CASIMIR_SPEC_VCR_CRITERIA).toEqual([
      "definition_identity",
      "proposition_scope",
      "type_unit_frame_domain",
      "observable_bridge_source",
      "assumption_axiom_approximation",
      "status_axes",
      "uncertainty_abstention_exclusion",
      "unsupported_certification",
      "conditional_artifact_integrity",
    ]);
  });

  it("accepts the byte-bound synthetic conformance bundle and verifies its reveal", async () => {
    const fixture = await makeFixture();
    expect(validateCasimirSpecBenchmarkCasePackV1(fixture.casePack)).toEqual(
      [],
    );
    expect(
      validateCasimirSpecBenchmarkCandidatePackV1(fixture.candidatePack),
    ).toEqual([]);
    expect(
      validateCasimirSpecBenchmarkHiddenGoldBundleV1(fixture.hiddenGold),
    ).toEqual([]);
    expect(
      await validateCasimirSpecBenchmarkBundleV1(
        fixture.casePack,
        fixture.candidatePack,
        fixture.hiddenGold,
        fixture.freeze,
        fixture.artifacts,
      ),
    ).toEqual([]);
    expect(
      await verifyCasimirSpecHiddenBundleCommitmentRevealV1(
        fixture.freeze,
        fixture.reveal,
        fixture.artifacts,
        fixture.externalFreezeSha256,
      ),
    ).toEqual([]);
  });

  it("keeps detailed annotations custodian-only and rejects candidate-pack leaks", async () => {
    const fixture = await makeFixture();
    expect(fixture.casePack.visibility).toBe("custodian_only_case_metadata");
    expect(fixture.freeze).not.toHaveProperty("casePackRef");
    expect(fixture.freeze.designClosureRefs).not.toHaveProperty(
      "candidatePackRef",
    );
    expect(fixture.candidatePack).toEqual(
      deriveCasimirSpecBenchmarkCandidatePackV1(fixture.casePack),
    );
    const leaked = structuredClone(fixture.candidatePack) as unknown as {
      candidateProjections: Array<Record<string, unknown>>;
    };
    Object.assign(leaked.candidateProjections[0], {
      split: "public",
      domain: "physics_astronomy",
      primaryStratum: "open_world_abstention",
      safetyCritical: true,
      backendEligibility: { lean: "eligible" },
      goldRef: artifactRef(59000),
    });
    expect(
      issueCodes(validateCasimirSpecBenchmarkCandidatePackV1(leaked)),
    ).toContain("candidate_projection_shape_invalid");
  });

  it("rejects a valid-shaped candidate pack that is not the exact 1:1 derivation", async () => {
    const fixture = await makeFixture();
    const drift = structuredClone(fixture.candidatePack);
    drift.candidateProjections[0].retrievalProjectionRef = artifactRef(59001);
    const driftBytes = jsonBytes(drift);
    const restrictedArtifactsById = {
      ...fixture.artifacts.restrictedArtifactsById,
      [drift.candidateProjections[0].retrievalProjectionRef.artifactId]: {
        value: candidateArtifactValue(
          drift.candidateProjections[0].retrievalProjectionRef.artifactId,
        ),
        bytes: jsonBytes(
          candidateArtifactValue(
            drift.candidateProjections[0].retrievalProjectionRef.artifactId,
          ),
        ),
      },
    };
    const issues = await validateCasimirSpecBenchmarkBundleV1(
      fixture.casePack,
      drift,
      fixture.hiddenGold,
      fixture.freeze,
      {
        ...fixture.artifacts,
        candidatePackBytes: driftBytes,
        restrictedArtifactsById,
      },
    );
    expect(issueCodes(issues)).toContain("candidate_pack_derivation_mismatch");
  });

  it("allows distinct source/retrieval projections but enforces each across every source arm", async () => {
    const fixture = await makeFixture();
    expect(fixture.casePack.cases[0].sourceProjectionRef).not.toEqual(
      fixture.casePack.cases[0].retrievalProjectionRef,
    );
    const drift = structuredClone(fixture.casePack);
    drift.cases[0].sourceParity[3].initialRetrievalProjectionRef =
      artifactRef(59003);
    expect(issueCodes(validateCasimirSpecBenchmarkCasePackV1(drift))).toContain(
      "retrieval_projection_parity_invalid",
    );
  });

  it("rejects portable-path, size, raw-hash, and exact-shape faults in frozen refs", async () => {
    const fixture = await makeFixture();
    const pathFault = structuredClone(fixture.candidatePack);
    pathFault.candidateProjections[0].taskProjectionRef.portablePath =
      "../heldout/gold.json";
    expect(
      issueCodes(validateCasimirSpecBenchmarkCandidatePackV1(pathFault)),
    ).toEqual(
      expect.arrayContaining([
        "portable_path_invalid",
        "candidate_artifact_path_not_opaque",
      ]),
    );
    const refFault = structuredClone(fixture.candidatePack) as unknown as {
      candidateProjections: Array<{
        sourceProjectionRef: Record<string, unknown> & {
          sizeBytes: number;
          rawSha256: string;
        };
      }>;
    };
    refFault.candidateProjections[0].sourceProjectionRef.sizeBytes = 0;
    refFault.candidateProjections[0].sourceProjectionRef.rawSha256 = "bad";
    refFault.candidateProjections[0].sourceProjectionRef.extra = true;
    expect(
      issueCodes(validateCasimirSpecBenchmarkCandidatePackV1(refFault)),
    ).toContain("artifact_ref_shape_invalid");
  });

  it("binds public-development and rubric refs to bytes, sizes, raw hashes, and value hashes", async () => {
    const fixture = await makeFixture();
    for (const mutate of [
      (freeze: CasimirSpecBenchmarkPublicFreezeV1) => {
        freeze.designClosureRefs.publicDevelopmentPackRef.sizeBytes += 1;
      },
      (freeze: CasimirSpecBenchmarkPublicFreezeV1) => {
        freeze.designClosureRefs.publicDevelopmentPackRef.rawSha256 =
          digest(59004);
      },
      (freeze: CasimirSpecBenchmarkPublicFreezeV1) => {
        freeze.designClosureRefs.publicDevelopmentPackRef.semanticSha256 =
          digest(59005);
      },
      (freeze: CasimirSpecBenchmarkPublicFreezeV1) => {
        freeze.designClosureRefs.rubricRef.artifactSha256 = digest(59006);
      },
    ]) {
      const freeze = structuredClone(fixture.freeze);
      mutate(freeze);
      const codes = issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          freeze,
          fixture.artifacts,
        ),
      );
      expect(
        codes.some((code) =>
          [
            "artifact_size_mismatch",
            "artifact_raw_hash_mismatch",
            "artifact_semantic_hash_mismatch",
            "artifact_whole_hash_mismatch",
          ].includes(code),
        ),
      ).toBe(true);
    }
  });

  it("requires exact transitive bytes for every task/source/retrieval artifact", async () => {
    const fixture = await makeFixture();
    const sourceId =
      fixture.candidatePack.candidateProjections[0].sourceProjectionRef
        .artifactId;
    const missingArtifacts = structuredClone(fixture.artifacts);
    delete missingArtifacts.restrictedArtifactsById[sourceId];
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          fixture.freeze,
          missingArtifacts,
        ),
      ),
    ).toContain("restricted_artifact_bytes_missing");

    const wrongArtifacts = structuredClone(fixture.artifacts);
    wrongArtifacts.restrictedArtifactsById[sourceId].bytes = jsonBytes({
      ...candidateArtifactValue(sourceId),
      payload: "wrong bytes",
    });
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          fixture.freeze,
          wrongArtifacts,
        ),
      ),
    ).toEqual(
      expect.arrayContaining([
        "artifact_raw_hash_mismatch",
        "artifact_value_mismatch",
      ]),
    );
  });

  it("rejects duplicate-key/non-canonical JSON even when a local ref is resealed", async () => {
    const fixture = await makeFixture();
    const policyRef = fixture.freeze.designClosureRefs.policyRef;
    const supplied =
      fixture.artifacts.publicArtifactsById[policyRef.artifactId];
    const value = supplied.value as Record<string, unknown>;
    const duplicateBytes = encoder.encode(
      `{"schemaVersion":"wrong/v1","schemaVersion":${JSON.stringify(value.schemaVersion)},"benchmarkId":${JSON.stringify(value.benchmarkId)},"status":${JSON.stringify(value.status)}}`,
    );
    const freeze = structuredClone(fixture.freeze);
    freeze.designClosureRefs.policyRef.rawSha256 =
      await rawSha256(duplicateBytes);
    freeze.designClosureRefs.policyRef.sizeBytes = duplicateBytes.byteLength;
    const artifacts = structuredClone(fixture.artifacts);
    artifacts.publicArtifactsById[policyRef.artifactId].bytes = duplicateBytes;
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          freeze,
          artifacts,
        ),
      ),
    ).toContain("artifact_json_not_canonical");
  });

  it("strictly binds every authority-bearing rubric field", () => {
    expect(
      validateCasimirSpecVcrRubricAuthorityV1(
        CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1,
      ),
    ).toEqual([]);
    expect(validateCasimirSpecVcrRubricAuthorityV1(trackedRubric)).toEqual([]);
    const inverted = structuredClone(CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1);
    (inverted.gates[7] as unknown as { passRequires: string }).passRequires =
      "pass even when a prohibited certification is realized";
    expect(
      issueCodes(validateCasimirSpecVcrRubricAuthorityV1(inverted)),
    ).toContain("rubric_authority_mismatch");
  });

  it("detects a three-case transitive leakage chain across different isolation-key kinds", async () => {
    const paraphraseEdge = opaqueId(60000);
    const notationEdge = opaqueId(60001);
    const first = makeCase(1, {
      split: "public",
      isolationKeys: {
        ...makeCase(1).isolationKeys,
        paraphraseFamilyIds: [paraphraseEdge],
      },
    });
    const bridge = makeCase(2, {
      split: "public",
      isolationKeys: {
        ...makeCase(2).isolationKeys,
        paraphraseFamilyIds: [paraphraseEdge],
        notationFamilyIds: [notationEdge],
      },
    });
    const third = makeCase(3, {
      split: "confirmatory_heldout",
      isolationKeys: {
        ...makeCase(3).isolationKeys,
        notationFamilyIds: [notationEdge],
      },
    });
    const fixture = await makeFixture([first, bridge, third]);
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          fixture.freeze,
          fixture.artifacts,
        ),
      ),
    ).toContain("transitive_leakage_split_invalid");
  });

  it("requires sorted, unique, non-empty isolation keys", () => {
    const benchmarkCase = makeCase(1);
    benchmarkCase.isolationKeys.paraphraseFamilyIds = [
      opaqueId(2),
      opaqueId(1),
      opaqueId(1),
    ];
    benchmarkCase.isolationKeys.discriminatingSourceSha256s = [];
    const pack: CasimirSpecBenchmarkCasePackV1 = {
      schemaVersion: CASIMIR_SPEC_BENCHMARK_CASE_PACK_SCHEMA_VERSION,
      benchmarkId: "synthetic-isolation-test",
      contentClass: "synthetic_conformance_only_not_benchmark",
      visibility: "custodian_only_case_metadata",
      cases: [benchmarkCase],
    };
    expect(issueCodes(validateCasimirSpecBenchmarkCasePackV1(pack))).toEqual(
      expect.arrayContaining([
        "opaque_id_array_order_invalid",
        "sha256_array_invalid",
      ]),
    );
  });

  it("enforces production cardinality, 1/2/2/15 cell quotas, 5/5/5 heldout difficulty, and distributed safety", () => {
    const cases: CasimirSpecBenchmarkCaseV1[] = [];
    let value = 1;
    for (const domain of CASIMIR_SPEC_BENCHMARK_DOMAINS) {
      for (const primaryStratum of CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA) {
        for (const [split, count] of [
          ["public", 1],
          ["development", 2],
          ["blinded_calibration", 2],
        ] as const) {
          for (let index = 0; index < count; index += 1) {
            cases.push(
              makeCase(value++, {
                domain,
                primaryStratum,
                split,
                difficulty: "direct",
                safetyCritical: false,
              }),
            );
          }
        }
        for (const difficulty of CASIMIR_SPEC_BENCHMARK_DIFFICULTIES) {
          const safetyQuota = difficulty === "direct" ? 2 : 3;
          for (let index = 0; index < 5; index += 1) {
            cases.push(
              makeCase(value++, {
                domain,
                primaryStratum,
                split: "confirmatory_heldout",
                difficulty,
                safetyCritical: index < safetyQuota,
              }),
            );
          }
        }
      }
    }
    const production: CasimirSpecBenchmarkCasePackV1 = {
      schemaVersion: CASIMIR_SPEC_BENCHMARK_CASE_PACK_SCHEMA_VERSION,
      benchmarkId: "casimir-spec-confirmatory-v1",
      contentClass: "benchmark",
      visibility: "custodian_only_case_metadata",
      cases: cases.sort((left, right) =>
        left.caseId.localeCompare(right.caseId),
      ),
    };
    expect(validateCasimirSpecBenchmarkCasePackV1(production)).toEqual([]);
    const undercount = structuredClone(production);
    const safetyIndex = undercount.cases.findIndex(
      (entry) => entry.split === "confirmatory_heldout" && entry.safetyCritical,
    );
    undercount.cases.splice(safetyIndex, 1);
    expect(
      issueCodes(validateCasimirSpecBenchmarkCasePackV1(undercount)),
    ).toEqual(
      expect.arrayContaining([
        "production_total_case_count_invalid",
        "production_cell_split_quota_invalid",
        "production_heldout_difficulty_quota_invalid",
        "production_safety_cell_difficulty_quota_invalid",
      ]),
    );
  });

  it("exposes cross-counts and rejects a marginal-only/count spoof", async () => {
    const fixture = await makeFixture();
    expect(
      fixture.freeze.aggregateCounts.byDomainPrimaryStratumSplit,
    ).toHaveLength(6 * 11 * 4);
    expect(
      fixture.freeze.aggregateCounts.heldoutByDomainPrimaryStratumDifficulty,
    ).toHaveLength(6 * 11 * 3);
    const freeze = structuredClone(fixture.freeze);
    freeze.aggregateCounts.byDomainPrimaryStratumSplit[0].count += 1;
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          fixture.hiddenGold,
          freeze,
          fixture.artifacts,
        ),
      ),
    ).toContain("aggregate_count_drift");
  });

  it("keeps synthetic conformance artifacts out of production freeze status", async () => {
    const fixture = await makeFixture();
    const mislabeled = structuredClone(fixture.freeze);
    mislabeled.status = "frozen_design_no_results";
    expect(
      issueCodes(validateCasimirSpecBenchmarkPublicFreezeV1(mislabeled)),
    ).toContain("literal_invalid");
    const fakeProduction = structuredClone(fixture.freeze) as unknown as {
      benchmarkId: string;
      contentClass: "benchmark";
      status: "frozen_design_no_results";
    };
    fakeProduction.contentClass = "benchmark";
    fakeProduction.status = "frozen_design_no_results";
    expect(
      issueCodes(validateCasimirSpecBenchmarkPublicFreezeV1(fakeProduction)),
    ).toContain("production_benchmark_id_invalid");
  });

  it("requires every VCR gate, including conditional artifact integrity", async () => {
    const fixture = await makeFixture();
    const waived = structuredClone(fixture.hiddenGold);
    (waived.goldCases[0].criteria[8] as unknown as Record<string, unknown>)[
      "applicability"
    ] = "not_applicable";
    expect(
      issueCodes(validateCasimirSpecBenchmarkHiddenGoldBundleV1(waived)),
    ).toContain("criterion_applicability_shape_invalid");
  });

  it("passes artifact integrity vacuously only for a sealed no-artifact episode", async () => {
    const fixture = await makeFixture();
    const gold = fixture.hiddenGold.goldCases[0];
    const packet = makeRatingPacket(gold);
    const rating = makeRating(gold, packet);
    expect(
      computeCasimirSpecBenchmarkVcrV1(gold, packet, rating),
    ).toMatchObject({
      score: 1,
      passed: true,
      failedCriteria: [],
      realizedFalseCertificationOpportunityIds: [],
    });
  });

  it("fails a corrupt emitted artifact even when the evaluator marks every gate pass", async () => {
    const fixture = await makeFixture();
    const gold = fixture.hiddenGold.goldCases[0];
    const packet = makeRatingPacket(gold, {
      emittedOrReliedUpon: true,
      integrityOutcome: "failed",
    });
    const rating = makeRating(gold, packet);
    expect(
      computeCasimirSpecBenchmarkVcrV1(gold, packet, rating),
    ).toMatchObject({
      score: 0,
      passed: false,
      failedCriteria: ["conditional_artifact_integrity"],
    });
  });

  it("requires exact false-certification opportunity judgments and fails realized events", async () => {
    const fixture = await makeFixture();
    const gold = fixture.hiddenGold.goldCases[0];
    const packet = makeRatingPacket(gold);
    const rating = makeRating(gold, packet);
    rating.falseCertificationJudgments[0].outcome = "realized";
    expect(
      computeCasimirSpecBenchmarkVcrV1(gold, packet, rating),
    ).toMatchObject({
      score: 0,
      failedCriteria: ["unsupported_certification"],
      realizedFalseCertificationOpportunityIds: [
        gold.falseCertificationOpportunities[0].opportunityId,
      ],
    });
    const missing = structuredClone(rating);
    missing.falseCertificationJudgments = [];
    expect(
      computeCasimirSpecBenchmarkVcrV1(gold, packet, missing),
    ).toMatchObject({ score: 0, passed: false });
  });

  it("keeps arm metadata out of blinded packet/rating shapes and rater-visible paths", async () => {
    const fixture = await makeFixture();
    const gold = fixture.hiddenGold.goldCases[0];
    const packet = makeRatingPacket(gold);
    expect(validateCasimirSpecBenchmarkRatingPacketV1(packet)).toEqual([]);
    const armLeak = {
      ...packet,
      armId: "casimir_spec_lean",
      seed: 7,
      toolTrace: [],
    };
    expect(
      issueCodes(validateCasimirSpecBenchmarkRatingPacketV1(armLeak)),
    ).toContain("rating_packet_shape_invalid");
    const pathLeak = structuredClone(packet);
    pathLeak.candidateResponseRef.portablePath =
      "artifacts/casimir-spec/casimir_spec_lean/response.json";
    expect(
      issueCodes(validateCasimirSpecBenchmarkRatingPacketV1(pathLeak)),
    ).toContain("rater_artifact_path_not_opaque");
    const ratingLeak = { ...makeRating(gold, packet), armId: "hidden" };
    expect(
      issueCodes(validateCasimirSpecBenchmarkRatingV1(ratingLeak)),
    ).toContain("rating_shape_invalid");
  });

  it("rejects arbitrary evaluator predicates and missing certification denominators", async () => {
    const fixture = await makeFixture();
    const executable = structuredClone(fixture.hiddenGold) as unknown as {
      goldCases: Array<{
        requiredAssertions: Array<{ predicateId: string; regex?: string }>;
        falseCertificationOpportunities: unknown[];
      }>;
    };
    executable.goldCases[0].requiredAssertions[0].predicateId =
      "execute_custom_regex";
    executable.goldCases[0].requiredAssertions[0].regex = ".*";
    executable.goldCases[0].falseCertificationOpportunities = [];
    expect(
      issueCodes(validateCasimirSpecBenchmarkHiddenGoldBundleV1(executable)),
    ).toEqual(
      expect.arrayContaining([
        "gold_assertion_shape_invalid",
        "false_certification_denominator_missing",
      ]),
    );
  });

  it("enforces safety labels biconditionally and one opportunity per forbidden assertion", async () => {
    const benchmarkCase = makeCase(1, { safetyCritical: false });
    const fixture = await makeFixture([benchmarkCase]);
    const safetyMismatch = structuredClone(fixture.hiddenGold);
    safetyMismatch.goldCases[0].falseCertificationOpportunities[0].safetyCritical = true;
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          safetyMismatch,
          fixture.freeze,
          fixture.artifacts,
        ),
      ),
    ).toContain("safety_false_certification_label_mismatch");

    const duplicate = structuredClone(fixture.hiddenGold);
    duplicate.goldCases[0].falseCertificationOpportunities.push({
      ...duplicate.goldCases[0].falseCertificationOpportunities[0],
      opportunityId: opaqueId(62000),
    });
    duplicate.goldCases[0].falseCertificationOpportunities.sort((left, right) =>
      left.opportunityId.localeCompare(right.opportunityId),
    );
    expect(
      issueCodes(validateCasimirSpecBenchmarkHiddenGoldBundleV1(duplicate)),
    ).toContain("duplicate_false_certification_semantic_opportunity");
  });

  it("requires exact hidden semantic-catalog closure and case-local source support", async () => {
    const fixture = await makeFixture();
    const missing = structuredClone(fixture.hiddenGold);
    missing.goldCases[0].semanticCatalog.shift();
    expect(
      issueCodes(validateCasimirSpecBenchmarkHiddenGoldBundleV1(missing)),
    ).toContain("semantic_catalog_reference_missing");

    const outside = structuredClone(fixture.hiddenGold);
    outside.goldCases[0].semanticCatalog[0].sourceSupport[0].artifactId =
      opaqueId(63000);
    expect(
      issueCodes(
        await validateCasimirSpecBenchmarkBundleV1(
          fixture.casePack,
          fixture.candidatePack,
          outside,
          fixture.freeze,
          fixture.artifacts,
        ),
      ),
    ).toContain("semantic_source_support_outside_case");
  });

  it("recomputes reveal hashes from actual content and catches wrong or locally resealed bundles", async () => {
    const fixture = await makeFixture();
    const changedGold = structuredClone(fixture.hiddenGold);
    changedGold.goldCases[0].semanticCatalog[0].canonicalStatement +=
      " Altered after the freeze.";
    const changedGoldBytes = jsonBytes(changedGold);
    const changedArtifacts = {
      ...fixture.artifacts,
      hiddenGoldValue: changedGold,
      hiddenGoldBytes: changedGoldBytes,
    };
    const changedIssues = issueCodes(
      await verifyCasimirSpecHiddenBundleCommitmentRevealV1(
        fixture.freeze,
        fixture.reveal,
        changedArtifacts,
        fixture.externalFreezeSha256,
      ),
    );
    expect(changedIssues).toEqual(
      expect.arrayContaining([
        "hidden_bundle_semantic_hash_mismatch",
        "hidden_bundle_artifact_hash_mismatch",
        "hidden_bundle_commitment_mismatch",
      ]),
    );

    const changedHashes = await computeCasimirSpecHiddenBundleHashesV1(
      fixture.casePack,
      fixture.artifacts.casePackBytes,
      fixture.candidatePack,
      fixture.artifacts.candidatePackBytes,
      fixture.artifacts.restrictedArtifactsById,
      changedGold,
      changedGoldBytes,
    );
    const resealedReveal = {
      ...fixture.reveal,
      hiddenBundleSemanticSha256: changedHashes.semanticSha256,
      hiddenBundleArtifactSha256: changedHashes.artifactSha256,
    };
    const resealedFreeze = structuredClone(fixture.freeze);
    resealedFreeze.hiddenBundleCommitment.commitmentSha256 =
      await computeCasimirSpecHiddenBundleCommitmentV1(
        CASIMIR_SPEC_HIDDEN_BUNDLE_COMMITMENT_DOMAIN,
        new Uint8Array(32).fill(7),
        changedHashes.semanticSha256,
        changedHashes.artifactSha256,
      );
    expect(
      issueCodes(
        await verifyCasimirSpecHiddenBundleCommitmentRevealV1(
          resealedFreeze,
          resealedReveal,
          changedArtifacts,
          fixture.externalFreezeSha256,
        ),
      ),
    ).toContain("external_freeze_commitment_mismatch");
  });

  it("rejects wrong salt without trusting reveal-supplied semantic/artifact hashes", async () => {
    const fixture = await makeFixture();
    const wrongReveal = structuredClone(fixture.reveal);
    wrongReveal.saltHex = "08".repeat(32);
    expect(
      issueCodes(
        await verifyCasimirSpecHiddenBundleCommitmentRevealV1(
          fixture.freeze,
          wrongReveal,
          fixture.artifacts,
          fixture.externalFreezeSha256,
        ),
      ),
    ).toContain("hidden_bundle_commitment_mismatch");
  });
});
