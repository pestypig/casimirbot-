import {
  CASIMIR_SPEC_BENCHMARK_DIFFICULTIES,
  CASIMIR_SPEC_BENCHMARK_DOMAINS,
  CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA,
  CASIMIR_SPEC_BENCHMARK_SPLITS,
  CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1,
  computeCasimirSpecFrozenArtifactValueHashesV1,
  validateCasimirSpecBenchmarkPublicFreezeV1,
  type CasimirSpecBenchmarkAggregateCountsV1,
  type CasimirSpecBenchmarkFrozenArtifactRefV1,
  type CasimirSpecBenchmarkPublicFreezeV1,
} from "./casimir-spec-benchmark-case-pack.v1";
import {
  canonicalizeCasimirSpecValueV1,
  computeCasimirSpecValueSha256V1,
} from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_SPEC_BENCHMARK_CUSTODIAN_FREEZE_RECEIPT_SCHEMA_VERSION =
  "casimir_spec_benchmark_custodian_freeze_receipt/v1" as const;
export const CASIMIR_SPEC_BENCHMARK_EXTERNAL_TIMESTAMP_RECEIPT_SCHEMA_VERSION =
  "casimir_spec_benchmark_external_timestamp_receipt/v1" as const;
export const CASIMIR_SPEC_BENCHMARK_FREEZE_READINESS_SCHEMA_VERSION =
  "casimir_spec_benchmark_freeze_readiness/v1" as const;

export const CASIMIR_SPEC_FROZEN_VCR_RUBRIC_AUTHORITY_V1 = {
  ...CASIMIR_SPEC_VCR_RUBRIC_AUTHORITY_V1,
  status: "frozen_design_no_results",
} as const;

export const CASIMIR_SPEC_BENCHMARK_REQUIRED_RUN_PINS_V1 = [
  "public_development_pack_sha256",
  "hidden_bundle_commitment_sha256",
  "source_packet_projection_sha256",
  "policy_semantic_and_external_commitment_sha256",
  "repo_commit",
  "workflow_versions",
  "contract_versions",
  "graph_snapshot_sha256",
  "catalog_snapshot_sha256",
  "retrieval_corpus_and_index_sha256",
  "exact_model_id_and_api_provider_version",
  "reasoning_effort",
  "temperature_top_p_context_and_output_limits",
  "task_system_developer_prompt_sha256",
  "base_tool_manifest_sha256",
  "per_arm_capability_delta_sha256",
  "retry_timeout_policy",
  "commitment_derived_schedule_artifact_sha256",
  "per_call_schedule_conformance_receipt_sha256",
  "external_timestamp_receipt_sha256",
  "isolated_sink_conformance_receipt_sha256",
  "token_cost_and_latency_accounting_boundary",
  "seed_and_observed_seed_support",
  "lean_toolchain_and_import_sha256",
  "evaluator_version",
  "trusted_rater_identity_qualification_conflict_receipt_sha256",
  "arm_neutral_vcr_rubric_sha256",
  "adjudication_protocol_and_algorithm_sha256",
  "vcr_and_false_certification_outcome_derivation_contract_sha256",
  "account_policy_version_and_account_mode",
  "tenant_and_auth_mode",
  "isolated_sink_identity",
  "hardware_runtime_class",
  "run_timestamp",
] as const;

export type CasimirSpecBenchmarkCustodianFreezeReceiptV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_CUSTODIAN_FREEZE_RECEIPT_SCHEMA_VERSION;
  receiptId: string;
  receiptArtifactSha256: string;
  benchmarkId: string;
  publicFreezeSha256: string;
  hiddenBundleCommitmentSha256: string;
  aggregateCountsSha256: string;
  validatorImplementationId: string;
  validatorRevisionSha256: string;
  validationContract: "validateCasimirSpecBenchmarkBundleV1";
  bundleValidation: "passed";
  calibrationAcceptance: "passed";
  validatedAt: string;
  candidateDeveloperDisclosure: "public_freeze_only";
  hiddenContentDisclosure: "withheld_from_candidate_developers";
  independentCustodian: true;
};

export type CasimirSpecBenchmarkExternalTimestampReceiptV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_EXTERNAL_TIMESTAMP_RECEIPT_SCHEMA_VERSION;
  receiptId: string;
  receiptArtifactSha256: string;
  providerId: string;
  method: "rfc3161" | "transparency_log" | "trusted_notary";
  subjectKind: "casimir_spec_benchmark_public_freeze_sha256";
  subjectSha256: string;
  timestampedAt: string;
  verificationStatus: "verified";
  verifierId: string;
  verifierVersion: string;
  verifierKeyRegistrySha256: string;
  verifiedAt: string;
  independentOfCandidateSystem: true;
};

export type CasimirSpecBenchmarkFreezeReadinessBlockerV1 = {
  code: string;
  path: string;
  detail: string;
};

export type CasimirSpecBenchmarkFreezeReadinessV1 = {
  schemaVersion: typeof CASIMIR_SPEC_BENCHMARK_FREEZE_READINESS_SCHEMA_VERSION;
  assessedAt: string;
  benchmarkId: string | null;
  publicFreezeSha256: string | null;
  status: "ready_for_parser_development" | "blocked";
  parserDevelopmentAllowed: boolean;
  modelPromptTuningAllowed: boolean;
  blockers: CasimirSpecBenchmarkFreezeReadinessBlockerV1[];
  evidence: {
    publicFreezeValidated: boolean;
    policyArtifactValidated: boolean;
    rubricArtifactValidated: boolean;
    custodianReceiptValidated: boolean;
    externalTimestampReceiptValidated: boolean;
    designQuotasValidated: boolean;
  };
  claimBoundary: {
    benchmarkResult: false;
    preregistrationAuthority: false;
    scientificAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
    postToolModelStepRequired: true;
  };
};

export type AssessCasimirSpecBenchmarkFreezeReadinessV1Input = {
  publicFreezeValue: unknown;
  policyValue: unknown;
  policyBytes: Uint8Array;
  rubricValue: unknown;
  rubricBytes: Uint8Array;
  custodianReceiptValue: unknown;
  externalTimestampReceiptValue: unknown;
  assessedAt?: string;
};

const SHA256 = /^[a-f0-9]{64}$/;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && SHA256.test(value);
const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;
const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

function exactShape(
  value: unknown,
  keys: readonly string[],
  path: string,
  issues: string[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push(`shape_invalid:${path}:must be an object`);
    return false;
  }
  const expected = new Set(keys);
  const missing = keys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  const unexpected = Object.keys(value)
    .filter((key) => !expected.has(key))
    .sort(compareCodeUnits);
  if (missing.length > 0) {
    issues.push(`shape_invalid:${path}:missing fields ${missing.join(",")}`);
  }
  if (unexpected.length > 0) {
    issues.push(
      `shape_invalid:${path}:unexpected fields ${unexpected.join(",")}`,
    );
  }
  return true;
}

function requireString(
  value: unknown,
  path: string,
  issues: string[],
): value is string {
  if (!isNonEmptyString(value)) {
    issues.push(`non_empty_string_required:${path}:must be non-empty`);
    return false;
  }
  return true;
}

function requireSha(
  value: unknown,
  path: string,
  issues: string[],
): value is string {
  if (!isSha256(value)) {
    issues.push(`sha256_invalid:${path}:must be lowercase SHA-256`);
    return false;
  }
  return true;
}

function requireTimestamp(
  value: unknown,
  path: string,
  issues: string[],
): value is string {
  if (!isIsoTimestamp(value)) {
    issues.push(`timestamp_invalid:${path}:must be an exact ISO timestamp`);
    return false;
  }
  return true;
}

export function validateCasimirSpecBenchmarkCustodianFreezeReceiptV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactShape(
      value,
      [
        "schemaVersion",
        "receiptId",
        "receiptArtifactSha256",
        "benchmarkId",
        "publicFreezeSha256",
        "hiddenBundleCommitmentSha256",
        "aggregateCountsSha256",
        "validatorImplementationId",
        "validatorRevisionSha256",
        "validationContract",
        "bundleValidation",
        "calibrationAcceptance",
        "validatedAt",
        "candidateDeveloperDisclosure",
        "hiddenContentDisclosure",
        "independentCustodian",
      ],
      "$",
      issues,
    )
  ) {
    return issues;
  }
  if (
    value.schemaVersion !==
    CASIMIR_SPEC_BENCHMARK_CUSTODIAN_FREEZE_RECEIPT_SCHEMA_VERSION
  ) {
    issues.push("schema_version_invalid:$.schemaVersion");
  }
  for (const field of [
    "receiptId",
    "benchmarkId",
    "validatorImplementationId",
  ] as const) {
    requireString(value[field], `$.${field}`, issues);
  }
  for (const field of [
    "receiptArtifactSha256",
    "publicFreezeSha256",
    "hiddenBundleCommitmentSha256",
    "aggregateCountsSha256",
    "validatorRevisionSha256",
  ] as const) {
    requireSha(value[field], `$.${field}`, issues);
  }
  requireTimestamp(value.validatedAt, "$.validatedAt", issues);
  const requiredLiterals = {
    validationContract: "validateCasimirSpecBenchmarkBundleV1",
    bundleValidation: "passed",
    calibrationAcceptance: "passed",
    candidateDeveloperDisclosure: "public_freeze_only",
    hiddenContentDisclosure: "withheld_from_candidate_developers",
    independentCustodian: true,
  } as const;
  for (const [field, expected] of Object.entries(requiredLiterals)) {
    if (value[field] !== expected) {
      issues.push(`literal_invalid:$.${field}:must be ${String(expected)}`);
    }
  }
  return issues;
}

export function validateCasimirSpecBenchmarkExternalTimestampReceiptV1(
  value: unknown,
): string[] {
  const issues: string[] = [];
  if (
    !exactShape(
      value,
      [
        "schemaVersion",
        "receiptId",
        "receiptArtifactSha256",
        "providerId",
        "method",
        "subjectKind",
        "subjectSha256",
        "timestampedAt",
        "verificationStatus",
        "verifierId",
        "verifierVersion",
        "verifierKeyRegistrySha256",
        "verifiedAt",
        "independentOfCandidateSystem",
      ],
      "$",
      issues,
    )
  ) {
    return issues;
  }
  if (
    value.schemaVersion !==
    CASIMIR_SPEC_BENCHMARK_EXTERNAL_TIMESTAMP_RECEIPT_SCHEMA_VERSION
  ) {
    issues.push("schema_version_invalid:$.schemaVersion");
  }
  for (const field of [
    "receiptId",
    "providerId",
    "verifierId",
    "verifierVersion",
  ] as const) {
    requireString(value[field], `$.${field}`, issues);
  }
  for (const field of [
    "receiptArtifactSha256",
    "subjectSha256",
    "verifierKeyRegistrySha256",
  ] as const) {
    requireSha(value[field], `$.${field}`, issues);
  }
  requireTimestamp(value.timestampedAt, "$.timestampedAt", issues);
  requireTimestamp(value.verifiedAt, "$.verifiedAt", issues);
  if (
    isIsoTimestamp(value.timestampedAt) &&
    isIsoTimestamp(value.verifiedAt) &&
    value.verifiedAt < value.timestampedAt
  ) {
    issues.push(
      "timestamp_order_invalid:$.verifiedAt:cannot precede timestampedAt",
    );
  }
  if (
    !["rfc3161", "transparency_log", "trusted_notary"].includes(
      String(value.method),
    )
  ) {
    issues.push("method_invalid:$.method");
  }
  if (value.subjectKind !== "casimir_spec_benchmark_public_freeze_sha256") {
    issues.push("subject_kind_invalid:$.subjectKind");
  }
  if (value.verificationStatus !== "verified") {
    issues.push("verification_status_invalid:$.verificationStatus");
  }
  if (value.independentOfCandidateSystem !== true) {
    issues.push(
      "timestamp_independence_invalid:$.independentOfCandidateSystem:must be true",
    );
  }
  return issues;
}

function validateFrozenPolicy(
  value: unknown,
  publicFreeze: CasimirSpecBenchmarkPublicFreezeV1,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["policy_shape_invalid:$:must be an object"];
  if (value.schemaVersion !== "casimir_spec_benchmark_policy/v1") {
    issues.push("policy_schema_version_invalid:$.schemaVersion");
  }
  requireString(value.policyId, "$.policyId", issues);
  if (value.status !== "frozen_design_no_results") {
    issues.push("policy_not_frozen:$.status:must be frozen_design_no_results");
  }
  if (!isRecord(value.freezeState)) {
    issues.push("policy_freeze_state_invalid:$.freezeState");
  } else {
    if (value.freezeState.preregistered !== true) {
      issues.push("policy_not_preregistered:$.freezeState.preregistered");
    }
    if (value.freezeState.frozen !== true) {
      issues.push("policy_not_frozen:$.freezeState.frozen");
    }
    if (value.freezeState.frozenAt !== publicFreeze.frozenAt) {
      issues.push(
        "policy_freeze_time_mismatch:$.freezeState.frozenAt:must match public freeze",
      );
    }
    requireSha(
      value.freezeState.policySemanticSha256,
      "$.freezeState.policySemanticSha256",
      issues,
    );
    requireSha(
      value.freezeState.externalCommitmentSha256,
      "$.freezeState.externalCommitmentSha256",
      issues,
    );
    if (
      !Array.isArray(value.freezeState.blockers) ||
      value.freezeState.blockers.length !== 0
    ) {
      issues.push(
        "policy_freeze_blockers_present:$.freezeState.blockers:must be empty",
      );
    }
  }
  if (!isRecord(value.claimBoundary)) {
    issues.push("policy_claim_boundary_invalid:$.claimBoundary");
  } else {
    if (value.claimBoundary.preregistered !== true) {
      issues.push(
        "policy_claim_boundary_invalid:$.claimBoundary.preregistered",
      );
    }
    if (value.claimBoundary.frozen !== true) {
      issues.push("policy_claim_boundary_invalid:$.claimBoundary.frozen");
    }
    for (const field of [
      "resultsExist",
      "validatesTheory",
      "establishesGeneralIntelligence",
      "provesUniversalModelSuperiority",
      "promotionAllowedBeforeFrozenRun",
      "assistantAnswer",
      "terminalEligible",
    ] as const) {
      if (value.claimBoundary[field] !== false) {
        issues.push(`policy_claim_boundary_invalid:$.claimBoundary.${field}`);
      }
    }
  }
  if (
    !isRecord(value.promotionCriteria) ||
    value.promotionCriteria.status !== "blocked_until_frozen_run_results"
  ) {
    issues.push(
      "policy_promotion_status_invalid:$.promotionCriteria.status:must remain blocked until frozen results",
    );
  }
  if (!Array.isArray(value.runPins) || !value.runPins.every(isNonEmptyString)) {
    issues.push("policy_run_pins_invalid:$.runPins");
  } else {
    const pins = new Set(value.runPins);
    for (const required of CASIMIR_SPEC_BENCHMARK_REQUIRED_RUN_PINS_V1) {
      if (!pins.has(required)) {
        issues.push(`policy_run_pin_missing:$.runPins:${required}`);
      }
    }
    if (pins.size !== value.runPins.length) {
      issues.push("policy_run_pins_duplicate:$.runPins");
    }
  }
  return issues;
}

function validateFrozenRubric(value: unknown): string[] {
  try {
    return canonicalizeCasimirSpecValueV1(value) ===
      canonicalizeCasimirSpecValueV1(
        CASIMIR_SPEC_FROZEN_VCR_RUBRIC_AUTHORITY_V1,
      )
      ? []
      : [
          "rubric_not_frozen_authority:$:must exactly match the arm-neutral frozen VCR authority",
        ];
  } catch {
    return ["rubric_not_canonical:$:must be canonical JSON data"];
  }
}

function countById(
  entries: Array<{ id: string; count: number }>,
): Map<string, number> {
  return new Map(entries.map((entry) => [entry.id, entry.count]));
}

function validateDesignQuotas(
  counts: CasimirSpecBenchmarkAggregateCountsV1,
): string[] {
  const issues: string[] = [];
  if (counts.totalCases !== 1_320) {
    issues.push(
      "freeze_count_invalid:$.aggregateCounts.totalCases:must be 1320",
    );
  }
  const splitCounts = countById(counts.bySplit);
  const expectedSplits: Record<string, number> = {
    public: 66,
    development: 132,
    blinded_calibration: 132,
    confirmatory_heldout: 990,
  };
  for (const split of CASIMIR_SPEC_BENCHMARK_SPLITS) {
    if (splitCounts.get(split) !== expectedSplits[split]) {
      issues.push(
        `freeze_split_count_invalid:$.aggregateCounts.bySplit.${split}:must be ${expectedSplits[split]}`,
      );
    }
  }
  const domainCounts = countById(counts.byDomain);
  for (const domain of CASIMIR_SPEC_BENCHMARK_DOMAINS) {
    if (domainCounts.get(domain) !== 220) {
      issues.push(
        `freeze_domain_count_invalid:$.aggregateCounts.byDomain.${domain}:must be 220`,
      );
    }
  }
  const stratumCounts = countById(counts.byPrimaryStratum);
  for (const stratum of CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA) {
    if (stratumCounts.get(stratum) !== 120) {
      issues.push(
        `freeze_stratum_count_invalid:$.aggregateCounts.byPrimaryStratum.${stratum}:must be 120`,
      );
    }
  }
  const expectedPerSplit: Record<string, number> = {
    public: 1,
    development: 2,
    blinded_calibration: 2,
    confirmatory_heldout: 15,
  };
  const cells = new Map(
    counts.byDomainPrimaryStratumSplit.map((entry) => [
      `${entry.domain}:${entry.primaryStratum}:${entry.split}`,
      entry.count,
    ]),
  );
  for (const domain of CASIMIR_SPEC_BENCHMARK_DOMAINS) {
    for (const stratum of CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA) {
      for (const split of CASIMIR_SPEC_BENCHMARK_SPLITS) {
        if (
          cells.get(`${domain}:${stratum}:${split}`) !== expectedPerSplit[split]
        ) {
          issues.push(
            `freeze_cell_count_invalid:$.aggregateCounts.byDomainPrimaryStratumSplit.${domain}.${stratum}.${split}`,
          );
        }
      }
    }
  }
  const heldoutDifficulty = new Map(
    counts.heldoutByDomainPrimaryStratumDifficulty.map((entry) => [
      `${entry.domain}:${entry.primaryStratum}:${entry.difficulty}`,
      entry.count,
    ]),
  );
  for (const domain of CASIMIR_SPEC_BENCHMARK_DOMAINS) {
    for (const stratum of CASIMIR_SPEC_BENCHMARK_PRIMARY_STRATA) {
      for (const difficulty of CASIMIR_SPEC_BENCHMARK_DIFFICULTIES) {
        if (heldoutDifficulty.get(`${domain}:${stratum}:${difficulty}`) !== 5) {
          issues.push(
            `freeze_heldout_difficulty_invalid:$.aggregateCounts.heldoutByDomainPrimaryStratumDifficulty.${domain}.${stratum}.${difficulty}`,
          );
        }
      }
    }
  }
  if (counts.safetyCriticalCases < 528) {
    issues.push(
      "freeze_safety_population_invalid:$.aggregateCounts.safetyCriticalCases:must be at least 528",
    );
  }
  if (counts.safetyCriticalFalseCertificationOpportunities < 528) {
    issues.push(
      "freeze_safety_opportunities_invalid:$.aggregateCounts.safetyCriticalFalseCertificationOpportunities:must be at least 528",
    );
  }
  return issues;
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function validateFrozenArtifactBinding(
  ref: CasimirSpecBenchmarkFrozenArtifactRefV1,
  value: unknown,
  bytes: Uint8Array,
  path: string,
): Promise<string[]> {
  const issues: string[] = [];
  if (!(bytes instanceof Uint8Array)) {
    return [`artifact_bytes_invalid:${path}:must be Uint8Array`];
  }
  if (bytes.byteLength !== ref.sizeBytes) {
    issues.push(`artifact_size_mismatch:${path}.sizeBytes`);
  }
  if ((await sha256Bytes(bytes)) !== ref.rawSha256) {
    issues.push(`artifact_raw_hash_mismatch:${path}.rawSha256`);
  }
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed = JSON.parse(decoded) as unknown;
    const canonicalValue = canonicalizeCasimirSpecValueV1(value);
    if (canonicalizeCasimirSpecValueV1(parsed) !== canonicalValue) {
      issues.push(`artifact_value_bytes_mismatch:${path}`);
    }
    if (decoded !== canonicalValue) {
      issues.push(
        `artifact_json_not_canonical:${path}:duplicate keys and alternate encodings are forbidden`,
      );
    }
  } catch {
    issues.push(`artifact_json_invalid:${path}:must be exact UTF-8 JSON`);
  }
  const hashes = await computeCasimirSpecFrozenArtifactValueHashesV1(value);
  if (hashes.semanticSha256 !== ref.semanticSha256) {
    issues.push(`artifact_semantic_hash_mismatch:${path}.semanticSha256`);
  }
  if (hashes.artifactSha256 !== ref.artifactSha256) {
    issues.push(`artifact_whole_hash_mismatch:${path}.artifactSha256`);
  }
  if (!isRecord(value) || value.schemaVersion !== ref.schemaVersion) {
    issues.push(`artifact_schema_version_mismatch:${path}.schemaVersion`);
  }
  return issues;
}

function toBlockers(
  entries: string[],
): CasimirSpecBenchmarkFreezeReadinessBlockerV1[] {
  return entries.map((entry) => {
    const [code = "freeze_readiness_invalid", path = "$", ...detail] =
      entry.split(":");
    return {
      code,
      path,
      detail: detail.join(":") || entry,
    };
  });
}

export async function assessCasimirSpecBenchmarkFreezeReadinessV1(
  input: AssessCasimirSpecBenchmarkFreezeReadinessV1Input,
): Promise<CasimirSpecBenchmarkFreezeReadinessV1> {
  const assessedAt = input.assessedAt ?? new Date().toISOString();
  const issues: string[] = [];
  const publicFreezeIssues = validateCasimirSpecBenchmarkPublicFreezeV1(
    input.publicFreezeValue,
  );
  issues.push(...publicFreezeIssues.map((entry) => `public_freeze.${entry}`));
  const publicFreeze =
    publicFreezeIssues.length === 0
      ? (input.publicFreezeValue as CasimirSpecBenchmarkPublicFreezeV1)
      : null;
  let publicFreezeSha256: string | null = null;
  let policyIssues: string[] = [];
  let rubricIssues: string[] = [];
  let custodianIssues = validateCasimirSpecBenchmarkCustodianFreezeReceiptV1(
    input.custodianReceiptValue,
  );
  let timestampIssues = validateCasimirSpecBenchmarkExternalTimestampReceiptV1(
    input.externalTimestampReceiptValue,
  );
  let quotaIssues: string[] = [];

  if (publicFreeze) {
    publicFreezeSha256 = await computeCasimirSpecValueSha256V1(publicFreeze);
    if (
      publicFreeze.contentClass !== "benchmark" ||
      publicFreeze.status !== "frozen_design_no_results"
    ) {
      issues.push(
        "public_freeze_not_production:$:synthetic conformance artifacts cannot unlock parser development",
      );
    }
    policyIssues = validateFrozenPolicy(input.policyValue, publicFreeze);
    rubricIssues = validateFrozenRubric(input.rubricValue);
    policyIssues.push(
      ...(await validateFrozenArtifactBinding(
        publicFreeze.designClosureRefs.policyRef,
        input.policyValue,
        input.policyBytes,
        "$.designClosureRefs.policyRef",
      )),
    );
    rubricIssues.push(
      ...(await validateFrozenArtifactBinding(
        publicFreeze.designClosureRefs.rubricRef,
        input.rubricValue,
        input.rubricBytes,
        "$.designClosureRefs.rubricRef",
      )),
    );
    quotaIssues = validateDesignQuotas(publicFreeze.aggregateCounts);

    if (isRecord(input.custodianReceiptValue)) {
      const receipt = input.custodianReceiptValue;
      const countsSha256 = await computeCasimirSpecValueSha256V1(
        publicFreeze.aggregateCounts,
      );
      if (receipt.benchmarkId !== publicFreeze.benchmarkId) {
        custodianIssues.push("custodian_benchmark_mismatch:$.benchmarkId");
      }
      if (receipt.publicFreezeSha256 !== publicFreezeSha256) {
        custodianIssues.push(
          "custodian_freeze_hash_mismatch:$.publicFreezeSha256",
        );
      }
      if (
        receipt.hiddenBundleCommitmentSha256 !==
        publicFreeze.hiddenBundleCommitment.commitmentSha256
      ) {
        custodianIssues.push(
          "custodian_hidden_commitment_mismatch:$.hiddenBundleCommitmentSha256",
        );
      }
      if (receipt.aggregateCountsSha256 !== countsSha256) {
        custodianIssues.push(
          "custodian_counts_hash_mismatch:$.aggregateCountsSha256",
        );
      }
      if (
        isIsoTimestamp(receipt.validatedAt) &&
        receipt.validatedAt < publicFreeze.frozenAt
      ) {
        custodianIssues.push(
          "custodian_time_invalid:$.validatedAt:cannot precede frozenAt",
        );
      }
    }
    if (isRecord(input.externalTimestampReceiptValue)) {
      const receipt = input.externalTimestampReceiptValue;
      if (receipt.subjectSha256 !== publicFreezeSha256) {
        timestampIssues.push(
          "external_timestamp_subject_mismatch:$.subjectSha256",
        );
      }
      if (
        isIsoTimestamp(receipt.timestampedAt) &&
        receipt.timestampedAt < publicFreeze.frozenAt
      ) {
        timestampIssues.push(
          "external_timestamp_order_invalid:$.timestampedAt:cannot precede frozenAt",
        );
      }
    }
  }

  issues.push(
    ...policyIssues,
    ...rubricIssues,
    ...custodianIssues,
    ...timestampIssues,
    ...quotaIssues,
  );
  const blockers = toBlockers([...new Set(issues)]);
  const ready = blockers.length === 0;
  return {
    schemaVersion: CASIMIR_SPEC_BENCHMARK_FREEZE_READINESS_SCHEMA_VERSION,
    assessedAt,
    benchmarkId: publicFreeze?.benchmarkId ?? null,
    publicFreezeSha256,
    status: ready ? "ready_for_parser_development" : "blocked",
    parserDevelopmentAllowed: ready,
    modelPromptTuningAllowed: ready,
    blockers,
    evidence: {
      publicFreezeValidated: publicFreezeIssues.length === 0,
      policyArtifactValidated:
        policyIssues.length === 0 && publicFreeze !== null,
      rubricArtifactValidated:
        rubricIssues.length === 0 && publicFreeze !== null,
      custodianReceiptValidated:
        custodianIssues.length === 0 && publicFreeze !== null,
      externalTimestampReceiptValidated:
        timestampIssues.length === 0 && publicFreeze !== null,
      designQuotasValidated: quotaIssues.length === 0 && publicFreeze !== null,
    },
    claimBoundary: {
      benchmarkResult: false,
      preregistrationAuthority: false,
      scientificAuthority: false,
      assistantAnswer: false,
      terminalEligible: false,
      postToolModelStepRequired: true,
    },
  };
}
