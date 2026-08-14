import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1";
import { NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING } from "./nhm2-spherical-boson-star-newtonian-seed-interchange.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import { NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING } from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_initializer_bridge" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_initializer_bridge/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID =
  "nhm2.spherical_boson_star_v2_initializer_binding" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION =
  "nhm2_spherical_boson_star_v2_initializer_binding/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-bridge/initializer-binding/v1\n" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS = Object.freeze([
  Object.freeze({ path: "scalars.f64le", sizeBytes: 72 }),
  Object.freeze({ path: "coefficients/core_L2_u.f64le", sizeBytes: 1024 }),
  Object.freeze({ path: "coefficients/core_L2_V.f64le", sizeBytes: 1024 }),
  Object.freeze({ path: "coefficients/tail_H.f64le", sizeBytes: 256 }),
  Object.freeze({ path: "coefficients/tail_Q.f64le", sizeBytes: 256 }),
] as const);

export type Nhm2SphericalBosonStarV2InitializerPayloadBindingV1 = Readonly<{
  path: (typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS)[number]["path"];
  rawSha256: string;
  sizeBytes: 72 | 1024 | 256;
}>;

export type Nhm2SphericalBosonStarV2InitializerBindingV1 = Readonly<{
  artifactId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID;
  contractVersion: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION;
  attemptOrdinal: 1;
  authorityFalse: true;
  sourceCandidateId: string;
  targetCandidateId: typeof NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID;
  sourceInputBindingSha256: string;
  sourceProofSummaryRawSha256: string;
  sourceProofConclusion: "all_directed_duties_passed_without_seed_or_solution_authority";
  orderedPayloadBindings: readonly [
    Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
    Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
    Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
    Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
    Nhm2SphericalBosonStarV2InitializerPayloadBindingV1,
  ];
  initializerBindingSha256: string;
  claimLocks: typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS;
}>;

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS =
  Object.freeze({
    sourceCandidateAuthorityImported: false as const,
    sourceToleranceAuthorityImported: false as const,
    sourceRuntimeAuthorityImported: false as const,
    sourceReplayAuthorityImported: false as const,
    sourceProofAuthorityImported: false as const,
    v2CandidateAuthority: false as const,
    v2BranchAuthority: false as const,
    v2NoFoldAuthority: false as const,
    v2NondegeneracyAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    independentAgreement: false as const,
    semiclassicalStressNoiseLamp: false as const,
    semiclassicalConstraintAlgebraLamp: false as const,
    diagnosticPass: false as const,
    theoryGraphPromotion: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
  });

const policyBinding = (
  binding: Readonly<{
    artifactId: string;
    policyVersion?: string;
    contractVersion?: string;
    candidateId?: string;
    sha256Domain: string;
    sha256: string;
    canonicalSizeBytes: number;
    mediaType?: string;
  }>,
) =>
  Object.freeze({
    artifactId: binding.artifactId,
    version: binding.policyVersion ?? binding.contractVersion ?? "",
    candidateId: binding.candidateId ?? null,
    sha256Domain: binding.sha256Domain,
    sha256: binding.sha256,
    canonicalSizeBytes: binding.canonicalSizeBytes,
    mediaType: binding.mediaType ?? "application/json",
  });

const BRIDGE_POLICY = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CONTRACT_VERSION,
  maturity:
    "stage_2_preexecution_initializer_semantics_bridge_without_candidate_or_replay_authority",
  frozenBeforeTargetExecution: true,
  sourceCandidateId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
  targetCandidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  candidateIdentityRule: {
    sourceAndTargetMustBeDistinct: true,
    sourceIdentityMayAppearOnlyInEvidenceBindings: true,
    everyTargetDescriptorAndReceiptUsesTargetCandidateId: true,
    automaticV3UpgradeAllowed: false,
    v3CandidateManifestPresealRuntimeReceiptOrReplayMayBeInherited: false,
  },
  bindings: {
    targetV2Freeze: policyBinding({
      ...NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
      policyVersion:
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.contractVersion,
    }),
    semanticSeed: policyBinding(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
    ),
    operationPrepolicy: policyBinding(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING,
    ),
    primaryNumerics: policyBinding(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
    ),
    directedProofArchitecture: policyBinding(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING,
    ),
    directedProofOperator: policyBinding(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING,
    ),
    interchange: policyBinding({
      ...NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING,
      candidateId:
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId,
    }),
    v2ToleranceAuthority:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  },
  admittedSourceEvidence: {
    sourceDescriptorRemainsSourceCandidateEvidence: true,
    sourceInputBindingRequired: true,
    sourceDirectedProofSummaryRequired: true,
    sourceDirectedProofConclusionRequired:
      "all_directed_duties_passed_without_seed_or_solution_authority",
    exactFivePayloadInventory:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS,
    verifierMustRecomputeEveryDerivedSeedAndBvpInitializerValueFromPayloadBytes: true,
    producerDerivedMetricOrVerdictMayBeImported: false,
  },
  initializerSemantics: {
    scope:
      "one_non_authoritative_initial_guess_for_the_distinct_v2_relativistic_spherical_branch",
    exactScaling: "lambda=2^-5",
    varphiInit: "varphi_init(x)=u_star(x)",
    F0Init: "F0_init(x)=V_star(x)",
    F1Init: "F1_init(x)=-V_star(x)",
    wInit: "w_init=sqrt(1+2*nu_star)",
    targetOriginAmplitude: "2^-10",
    relativisticBvpMustResolveFrequencyAgain: true,
    establishesRelativisticResidualPass: false,
    establishesBranchIdentity: false,
    establishesNoFold: false,
    establishesMetricDemandNondegeneracy: false,
    establishesSemiclassicalReplay: false,
  },
  toleranceBoundary: {
    sourceV3NamedToleranceArtifactHasV2Authority: false,
    approvedV2ReplayPolicyIsSoleSemiclassicalReplayToleranceAuthority: true,
    bridgeMayRelaxChangeOrSelectV2Thresholds: false,
    observedSourceOrTargetResultMayChangeThresholds: false,
  },
  initializerBindingSchema: {
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION,
    exactKeyOrder: [
      "artifactId",
      "attemptOrdinal",
      "authorityFalse",
      "claimLocks",
      "contractVersion",
      "initializerBindingSha256",
      "orderedPayloadBindings",
      "sourceCandidateId",
      "sourceInputBindingSha256",
      "sourceProofConclusion",
      "sourceProofSummaryRawSha256",
      "targetCandidateId",
    ],
    hashDomain: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_SHA256_DOMAIN,
    hashRecipe:
      "SHA256(domain_utf8||bridgePolicySha256_32||v2FreezeSha256_32||sourceInputBindingSha256_32||sourceProofSummaryRawSha256_32||u64le(5)||for_each_payload_in_literal_order(u64le(path_utf8_length)||path_utf8||u64le(sizeBytes)||rawSha256_32))",
    selfHashFieldExcludedFromHashInputs: true,
  },
  attemptPolicy: {
    maximumAttempts: 1,
    retryAllowed: false,
    retuneAllowed: false,
    alternateInitializerOrBranchFallbackAllowed: false,
    failedSeedProofOrBvpSolveDisposition:
      "fail_the_distinct_frozen_v2_candidate_without_retuning",
  },
  completionBoundary: {
    policyComplete: true,
    initializerInstancePresent: false,
    targetBranchExecuted: false,
    targetNondegeneracyEstablished: false,
    targetReplayExecuted: false,
  },
  unresolved: {
    initializerBinding: null,
    targetBranchReceipt: null,
    targetNondegeneracyReceipt: null,
    targetReplayReceipt: null,
  },
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>))
    deepFreeze(child, seen);
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE =
  deepFreeze(BRIDGE_POLICY);

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-initializer-bridge/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE);
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_SHA256 =
  "c5c4c45755e0dc682694f8a107c31780d85d860b2a71be567a2cfe0d06300631" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_CANONICAL_SIZE_BYTES =
  7715 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CONTRACT_VERSION,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

const SHA256 = /^[a-f0-9]{64}$/;
const u64le = (value: number): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new TypeError("initializer_bridge_u64_invalid");
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64LE(BigInt(value));
  return bytes;
};
const hashBytes = (value: string): Buffer => {
  if (!SHA256.test(value) || /^0{64}$/.test(value))
    throw new TypeError("initializer_bridge_sha256_invalid");
  return Buffer.from(value, "hex");
};

export const computeNhm2SphericalBosonStarV2InitializerBindingSha256 = (
  sourceInputBindingSha256: string,
  sourceProofSummaryRawSha256: string,
  orderedPayloadBindings: readonly Nhm2SphericalBosonStarV2InitializerPayloadBindingV1[],
): string => {
  if (
    !Array.isArray(orderedPayloadBindings) ||
    orderedPayloadBindings.length !==
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS.length
  )
    throw new TypeError("initializer_bridge_payload_inventory_invalid");
  const hash = createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_SHA256_DOMAIN,
      "utf8",
    )
    .update(hashBytes(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256))
    .update(
      hashBytes(NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING.sha256),
    )
    .update(hashBytes(sourceInputBindingSha256))
    .update(hashBytes(sourceProofSummaryRawSha256))
    .update(u64le(orderedPayloadBindings.length));
  orderedPayloadBindings.forEach((entry, index) => {
    const expected = NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_PAYLOADS[index];
    if (
      entry == null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      isProxy(entry) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(entry)) ||
      !exactKeys(entry as unknown as Record<string, unknown>, [
        "path",
        "rawSha256",
        "sizeBytes",
      ]) ||
      entry.path !== expected?.path ||
      entry.sizeBytes !== expected.sizeBytes
    )
      throw new TypeError(
        `initializer_bridge_payload_binding_invalid:${index}`,
      );
    const pathBytes = Buffer.from(entry.path, "utf8");
    hash
      .update(u64le(pathBytes.length))
      .update(pathBytes)
      .update(u64le(entry.sizeBytes))
      .update(hashBytes(entry.rawSha256));
  });
  return hash.digest("hex");
};

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
) => {
  const keys = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    keys.length === sortedExpected.length &&
    keys.every((key, index) => key === sortedExpected[index])
  );
};

export const nhm2SphericalBosonStarV2InitializerBindingViolations = (
  value: unknown,
): string[] => {
  try {
    const safe = snapshot(value);
    if ("violation" in safe) return [`initializer_binding_${safe.violation}`];
    if (
      safe.value == null ||
      typeof safe.value !== "object" ||
      Array.isArray(safe.value)
    )
      return ["initializer_binding_plain_object_required"];
    const record = safe.value as Record<string, unknown>;
    if (
      !exactKeys(
        record,
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE.initializerBindingSchema
          .exactKeyOrder,
      )
    )
      return ["initializer_binding_shape_invalid"];
    const payloads = Array.isArray(record.orderedPayloadBindings)
      ? (record.orderedPayloadBindings as Nhm2SphericalBosonStarV2InitializerPayloadBindingV1[])
      : [];
    const claimLocks = record.claimLocks as Record<string, unknown> | null;
    if (
      record.artifactId !==
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_ARTIFACT_ID ||
      record.contractVersion !==
        NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BINDING_CONTRACT_VERSION ||
      record.attemptOrdinal !== 1 ||
      record.authorityFalse !== true ||
      record.sourceCandidateId !==
        NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.candidateId ||
      record.targetCandidateId !==
        NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID ||
      String(record.sourceCandidateId) === String(record.targetCandidateId) ||
      record.sourceProofConclusion !==
        "all_directed_duties_passed_without_seed_or_solution_authority" ||
      !SHA256.test(String(record.sourceInputBindingSha256)) ||
      /^0{64}$/.test(String(record.sourceInputBindingSha256)) ||
      !SHA256.test(String(record.sourceProofSummaryRawSha256)) ||
      /^0{64}$/.test(String(record.sourceProofSummaryRawSha256)) ||
      claimLocks == null ||
      !exactKeys(
        claimLocks,
        Object.keys(
          NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
        ),
      ) ||
      Object.values(claimLocks).some((entry) => entry !== false)
    )
      return ["initializer_binding_semantics_invalid"];
    const expectedHash =
      computeNhm2SphericalBosonStarV2InitializerBindingSha256(
        String(record.sourceInputBindingSha256),
        String(record.sourceProofSummaryRawSha256),
        payloads,
      );
    return record.initializerBindingSha256 === expectedHash
      ? []
      : ["initializer_binding_sha256_mismatch"];
  } catch {
    return ["initializer_binding_semantics_invalid"];
  }
};

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;
const snapshot = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget = { nodes: 0, utf8: 0 },
): SnapshotResult => {
  if (depth > 32) return { ok: false, violation: `depth:${pointer || "/"}` };
  budget.nodes += 1;
  if (budget.nodes > 32768)
    return { ok: false, violation: `nodes:${pointer || "/"}` };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isSafeInteger(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: `number:${pointer || "/"}` };
  if (typeof value === "string") {
    if (value.includes("\0") || /[\ud800-\udfff]/u.test(value))
      return { ok: false, violation: `string:${pointer || "/"}` };
    budget.utf8 += Buffer.byteLength(value, "utf8");
    return budget.utf8 <= 1048576
      ? { ok: true, value }
      : { ok: false, violation: `utf8:${pointer || "/"}` };
  }
  if (typeof value !== "object" || isProxy(value))
    return { ok: false, violation: `surface:${pointer || "/"}` };
  if (ancestors.has(value))
    return { ok: false, violation: `cycle:${pointer || "/"}` };
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > 8192 ||
      Reflect.ownKeys(value).some(
        (key) =>
          key !== "length" &&
          (typeof key !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(key)),
      ) ||
      Object.keys(value).length !== value.length
    )
      return { ok: false, violation: `array:${pointer || "/"}` };
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        return { ok: false, violation: `array:${pointer || "/"}` };
      const child = snapshot(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!child.ok) return child;
      output.push(child.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }
  if (![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    return { ok: false, violation: `object:${pointer || "/"}` };
  const keys = Reflect.ownKeys(value);
  if (keys.length > 256 || keys.some((key) => typeof key !== "string"))
    return { ok: false, violation: `object:${pointer || "/"}` };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      return { ok: false, violation: `property:${pointer}/${key}` };
    const child = snapshot(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!child.ok) return child;
    output[key] = child.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

export const nhm2SphericalBosonStarV2InitializerBridgeViolations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE) return [];
  const safe = snapshot(value);
  if ("violation" in safe) return [`initializer_bridge_${safe.violation}`];
  return canonicalJson(safe.value) ===
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_JSON
    ? ["initializer_bridge_external_copy_not_authoritative"]
    : ["initializer_bridge_semantic_mismatch"];
};

export const isNhm2SphericalBosonStarV2InitializerBridge = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE =>
  value === NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE;

if (
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_EXPECTED_CANONICAL_SIZE_BYTES ||
  String(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE.sourceCandidateId) ===
    String(NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE.targetCandidateId) ||
  Object.values(
    NHM2_SPHERICAL_BOSON_STAR_V2_INITIALIZER_BRIDGE_AUTHORITY_LOCKS,
  ).some((value) => value !== false)
) {
  throw new Error("nhm2_spherical_v2_initializer_bridge_invariant_violation");
}
