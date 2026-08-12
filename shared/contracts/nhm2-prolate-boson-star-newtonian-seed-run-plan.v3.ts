import { createHash } from "node:crypto";

import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-numeric-materialization-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_OPERATION_GRAPH_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-postprojection-policy.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_LITERAL_SEAL_STATUS,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-run-plan.v2";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed-run-plan.v1";
import {
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
} from "./nhm2-prolate-boson-star-newtonian-seed.v1";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ARTIFACT_ID =
  "nhm2.prolate_boson_star.newtonian_seed.run_plan" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CONTRACT_VERSION =
  "v3" as const;

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const sha256Hex = (...chunks: readonly string[]): string => {
  const hash = createHash("sha256");
  for (const chunk of chunks) hash.update(chunk, "utf8");
  return hash.digest("hex");
};

const assertLiteral = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const EXPECTED_PREDECESSORS = Object.freeze({
  runPlanV2: Object.freeze({
    sha256: "c2483042ce046e2226e83ef9a3e90b381fe583483c0810ebd99d0af643c52f3f",
    canonicalSizeBytes: 128_964,
    sealStatus: "sealed_preregistration_read_only_red_team_clear",
  }),
  runPlanV2Registry: Object.freeze({
    sha256: "3aae03da02aca1ec23210eeba24536bca6cca880241c18778bf335fad78df284",
    canonicalSizeBytes: 52_841,
  }),
  numericMaterializationPolicy: Object.freeze({
    sha256: "ec9905f87b5d11c902a5b292772bdc11ec755ecd00fa08949382f42f1671652d",
    canonicalSizeBytes: 243_240,
    canonicalPlainSha256:
      "3ab28f4e777e201a0b6dac73cf637af901d28f2b86db590d18aced5d89e75b40",
    sealStatus: "sealed_preregistration_read_only_red_team_clear",
  }),
  postprojectionPolicy: Object.freeze({
    sha256: "8894ad4c3fe5c104d8e97a8488ea8a203d35934938798f0be7ae7c13573d8072",
    canonicalSizeBytes: 220_450,
    canonicalPlainSha256:
      "e5cc63fe4f22831ab18bc33ec8f608ea23cbe934cf2160f5be47f9bb2680d2c1",
    sealStatus: "sealed_preregistration_read_only_red_team_clear",
  }),
});

assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING.sha256 ===
    EXPECTED_PREDECESSORS.runPlanV2.sha256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING.canonicalSizeBytes ===
      EXPECTED_PREDECESSORS.runPlanV2.canonicalSizeBytes &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_LITERAL_SEAL_STATUS ===
      EXPECTED_PREDECESSORS.runPlanV2.sealStatus,
  "run-plan-v3 requires the exact sealed run-plan-v2 predecessor",
);
assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.sha256 ===
    EXPECTED_PREDECESSORS.runPlanV2Registry.sha256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING.canonicalSizeBytes ===
      EXPECTED_PREDECESSORS.runPlanV2Registry.canonicalSizeBytes,
  "run-plan-v3 requires the exact sealed v2 evidence registry",
);
assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING.sha256 ===
    EXPECTED_PREDECESSORS.numericMaterializationPolicy.sha256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING.canonicalSizeBytes ===
      EXPECTED_PREDECESSORS.numericMaterializationPolicy.canonicalSizeBytes &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_LITERAL_SEAL_STATUS ===
      EXPECTED_PREDECESSORS.numericMaterializationPolicy.sealStatus &&
    sha256Hex(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_CANONICAL_JSON,
    ) ===
      EXPECTED_PREDECESSORS.numericMaterializationPolicy.canonicalPlainSha256,
  "run-plan-v3 requires the exact sealed numeric-materialization policy bytes",
);
assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING.sha256 ===
    EXPECTED_PREDECESSORS.postprojectionPolicy.sha256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING.canonicalSizeBytes ===
      EXPECTED_PREDECESSORS.postprojectionPolicy.canonicalSizeBytes &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_LITERAL_SEAL_STATUS ===
      EXPECTED_PREDECESSORS.postprojectionPolicy.sealStatus &&
    sha256Hex(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_CANONICAL_JSON,
    ) === EXPECTED_PREDECESSORS.postprojectionPolicy.canonicalPlainSha256,
  "run-plan-v3 requires the exact sealed postprojection policy bytes",
);

const BASE_INPUT_ABSOLUTE_PATHS = Object.freeze([
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.inputPathInventories
    .baseInputAbsolutePathOrder,
  "/run/input/08-numeric-materialization-policy-v1.canonical.json",
  "/run/input/09-postprojection-policy-v1.canonical.json",
] as const);
const STAGING32_ABSOLUTE_PATHS = Object.freeze([
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.inputPathInventories
    .stagingAbsoluteArrayPathOrder,
] as const);
const RAW6_ABSOLUTE_PATHS = Object.freeze(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.rawEvidenceInventory.map(
    ({ relativePath }) => `/run/postprojection-evidence/${relativePath}`,
  ),
);
const VERIFIER_CHANNEL_PATH =
  "/run/broker-channel/verifier-runtime-evidence.v3.canonical.json" as const;
const ASSEMBLER_CHANNEL_PATH =
  "/run/broker-channel/assembler-runtime-evidence.v3.canonical.json" as const;
const COMPOSITE_REPLAY_PATH =
  "/run/replay/seed-verifier-replay-bundle.canonical.json" as const;
const VERIFIER_ENFORCEMENT_PATH =
  "/run/attestation/verifier-stage-enforcement-receipt.canonical.json" as const;
const FINAL_DESCRIPTOR_PATH =
  "/run/output/seed-descriptor.canonical.json" as const;
const FINAL_DESCRIPTOR_INSTANCE_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-v3/final-descriptor-instance/v1\n" as const;
const FINAL_OUTPUT_ARRAY_PATHS = Object.freeze(
  STAGING32_ABSOLUTE_PATHS.map((path) =>
    path.replace("/run/staging/", "/run/output/"),
  ),
);
const FINAL_OUTPUT_FILE_PATHS = Object.freeze([
  ...FINAL_OUTPUT_ARRAY_PATHS,
  FINAL_DESCRIPTOR_PATH,
] as const);
const FINAL_OUTPUT_DIRECTORY_PATHS = Object.freeze([
  "/run/output/arrays",
  "/run/output/arrays/L0",
  "/run/output/arrays/L1",
  "/run/output/arrays/L2",
  "/run/output/arrays/AUDIT",
] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POLICY_INPUT_PROFILES =
  deepFreeze([
    {
      ordinal: 8,
      absolutePath:
        "/run/input/08-numeric-materialization-policy-v1.canonical.json",
      byteLength:
        EXPECTED_PREDECESSORS.numericMaterializationPolicy.canonicalSizeBytes,
      plainSha256:
        EXPECTED_PREDECESSORS.numericMaterializationPolicy.canonicalPlainSha256,
      domainSeparatedBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    },
    {
      ordinal: 9,
      absolutePath: "/run/input/09-postprojection-policy-v1.canonical.json",
      byteLength: EXPECTED_PREDECESSORS.postprojectionPolicy.canonicalSizeBytes,
      plainSha256:
        EXPECTED_PREDECESSORS.postprojectionPolicy.canonicalPlainSha256,
      domainSeparatedBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
    },
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES =
  deepFreeze({
    inheritedV2BaseInputProfile:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.inputPathInventories
        .inheritedV1BaseInputProfile,
    inheritedBaseInputExactFileCount: 8,
    staticPolicyInputExactFileCount: 2,
    baseInputAbsolutePathOrder: BASE_INPUT_ABSOLUTE_PATHS,
    commonRunRequestObjectIdentity:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.commonRunRequestPolicy,
    commonRunRequestMayContainV3RuntimeEvidence: false,
    producer: {
      preChannelInputLedgerFilePathOrder: BASE_INPUT_ABSOLUTE_PATHS,
      preChannelInputLedgerFileCount: 10,
      launchVisibleFilePathOrder: BASE_INPUT_ABSOLUTE_PATHS,
      launchVisibleFileCount: 10,
      brokerChannelPath: null,
    },
    verifier: {
      preChannelInputLedgerFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING32_ABSOLUTE_PATHS,
        ...RAW6_ABSOLUTE_PATHS,
      ],
      preChannelInputLedgerFileCount: 48,
      staging32OrdinalRange: [10, 41],
      raw6OrdinalRange: [42, 47],
      channelObservationContextualPosition: 48,
      brokerChannelPath: VERIFIER_CHANNEL_PATH,
      launchVisibleFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING32_ABSOLUTE_PATHS,
        ...RAW6_ABSOLUTE_PATHS,
        VERIFIER_CHANNEL_PATH,
      ],
      launchVisibleFileCount: 49,
    },
    assembler: {
      preChannelInputLedgerFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING32_ABSOLUTE_PATHS,
        COMPOSITE_REPLAY_PATH,
        VERIFIER_ENFORCEMENT_PATH,
      ],
      preChannelInputLedgerFileCount: 44,
      staging32OrdinalRange: [10, 41],
      compositeReplayOrdinal: 42,
      verifierEnforcementReceiptOrdinal: 43,
      channelObservationContextualPosition: 44,
      brokerChannelPath: ASSEMBLER_CHANNEL_PATH,
      launchVisibleFilePathOrder: [
        ...BASE_INPUT_ABSOLUTE_PATHS,
        ...STAGING32_ABSOLUTE_PATHS,
        COMPOSITE_REPLAY_PATH,
        VERIFIER_ENFORCEMENT_PATH,
        ASSEMBLER_CHANNEL_PATH,
      ],
      launchVisibleFileCount: 45,
      rawEvidenceRootMounted: false,
    },
    roots: {
      input: "/run/input",
      numericStaging32: "/run/staging",
      postprojectionRaw6: "/run/postprojection-evidence",
      replay: "/run/replay",
      attestation: "/run/attestation",
      output: "/run/output",
      pairwiseIdentityDistinctRequired: true,
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATIONS =
  deepFreeze({
    producer: {
      executableAbsolutePath:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations.producer
          .executableAbsolutePath,
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-producer/source/producer/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--numeric-materialization-policy",
        "/run/input/08-numeric-materialization-policy-v1.canonical.json",
        "--postprojection-policy",
        "/run/input/09-postprojection-policy-v1.canonical.json",
        "--output-root",
        "/run/staging",
        "--postprojection-evidence-root",
        "/run/postprojection-evidence",
      ],
      workingDirectory: "/run/staging",
      environment: {
        ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations
          .producer.environment,
        TMPDIR: "/run/staging",
      },
    },
    verifier: {
      executableAbsolutePath:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations.verifier
          .executableAbsolutePath,
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-verifier/source/verifier/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--numeric-materialization-policy",
        "/run/input/08-numeric-materialization-policy-v1.canonical.json",
        "--postprojection-policy",
        "/run/input/09-postprojection-policy-v1.canonical.json",
        "--staging-root",
        "/run/staging",
        "--postprojection-evidence-root",
        "/run/postprojection-evidence",
        "--replay-bundle",
        COMPOSITE_REPLAY_PATH,
        "--broker-runtime-evidence",
        VERIFIER_CHANNEL_PATH,
      ],
      workingDirectory: "/run/replay",
      environment: {
        ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations
          .verifier.environment,
        TMPDIR: "/run/replay",
      },
    },
    assembler: {
      executableAbsolutePath:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations.assembler
          .executableAbsolutePath,
      argvAfterExecutable: [
        "-I",
        "-S",
        "-B",
        "-X",
        "utf8",
        "/opt/nhm2-assembler/source/assembler/bootstrap.py",
        "--input-manifest",
        "/run/input/00-seed-run-request.v1.json",
        "--numeric-materialization-policy",
        "/run/input/08-numeric-materialization-policy-v1.canonical.json",
        "--postprojection-policy",
        "/run/input/09-postprojection-policy-v1.canonical.json",
        "--staging-root",
        "/run/staging",
        "--replay-bundle",
        COMPOSITE_REPLAY_PATH,
        "--verifier-enforcement-receipt",
        VERIFIER_ENFORCEMENT_PATH,
        "--broker-runtime-evidence",
        ASSEMBLER_CHANNEL_PATH,
        "--output-root",
        "/run/output",
      ],
      workingDirectory: "/run/output",
      environment: {
        ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.invocations
          .assembler.environment,
        TMPDIR: "/run/output",
      },
    },
    exactArgvEnvironmentAndWorkingDirectoryRequired: true,
    shellOrStringCommandParsingAllowed: false,
    stdin: "closed",
    commonRunRequestPathRemainsV1: true,
    rawEvidenceRootMountedByAssembler: false,
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256 =
  deepFreeze({
    producer: sha256Hex(
      canonicalJson(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATIONS.producer,
      ),
    ),
    verifier: sha256Hex(
      canonicalJson(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATIONS.verifier,
      ),
    ),
    assembler: sha256Hex(
      canonicalJson(
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATIONS.assembler,
      ),
    ),
  } as const);

const bindSchema = <
  T extends Readonly<{ artifactId: string; schemaVersion: string }>,
>(
  schema: T,
  sha256Domain: string,
) => {
  const canonical = canonicalJson(schema);
  return Object.freeze({
    artifactId: schema.artifactId,
    schemaVersion: schema.schemaVersion,
    sha256Domain,
    sha256: sha256Hex(sha256Domain, canonical),
    canonicalSizeBytes: Buffer.byteLength(canonical, "utf8"),
  } as const);
};

const FIVE_MUTABLE_ROOTS = Object.freeze([
  "/run/staging",
  "/run/postprojection-evidence",
  "/run/replay",
  "/run/attestation",
  "/run/output",
] as const);
const EXACT_STAGE_IDS = Object.freeze([
  "untrusted_seed_producer",
  "trusted_independent_verifier",
  "trusted_descriptor_assembler",
] as const);

const V3_SCHEMA_DOMAINS = deepFreeze({
  rootPrestateReceipt:
    "nhm2-prolate-boson-star-newtonian-seed-v3-root-prestate-receipt-schema/v1\n",
  numericStaging32RootPostState:
    "nhm2-prolate-boson-star-newtonian-seed-v3-numeric-staging32-root-poststate-schema/v1\n",
  replayRootPostState:
    "nhm2-prolate-boson-star-newtonian-seed-v3-replay-root-poststate-schema/v1\n",
  fiveRootPreparation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-five-root-preparation-schema/v1\n",
  producerClosedOutput38:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-closed-output38-schema/v1\n",
  fullProducerEnforcement:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-producer-enforcement-schema/v1\n",
  genericStageControlEvidence:
    "nhm2-prolate-boson-star-newtonian-seed-v3-generic-stage-control-evidence-schema/v1\n",
  secureStaging32Observation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-secure-staging32-observation-schema/v1\n",
  secureRawEvidence6Observation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-secure-raw-evidence6-observation-schema/v1\n",
  postexitSecureStaging32Reread:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-secure-staging32-reread-schema/v1\n",
  postexitSecureRawEvidence6Reread:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-secure-raw-evidence6-reread-schema/v1\n",
  producerNumericImplementation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-numeric-implementation-schema/v1\n",
  stageRuntimeConformance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-stage-runtime-conformance-schema/v1\n",
  untrustedCandidatePWrapper:
    "nhm2-prolate-boson-star-newtonian-seed-v3-untrusted-candidate-P-wrapper-schema/v1\n",
  postexitPostprojectionAcceptance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-postprojection-acceptance-schema/v1\n",
  postexitFinalFullSeedAdmission:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-final-full-seed-admission-schema/v1\n",
  numericStaging32Composite:
    "nhm2-prolate-boson-star-newtonian-seed-v3-numeric-staging32-composite-schema/v1\n",
  rawEvidence6Composite:
    "nhm2-prolate-boson-star-newtonian-seed-v3-raw-evidence6-composite-schema/v1\n",
  candidateInstanceIdentity:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-instance-identity-schema/v1\n",
  stageInputLedger:
    "nhm2-prolate-boson-star-newtonian-seed-v3-stage-input-ledger-schema/v1\n",
  stageLaunchEnvelope:
    "nhm2-prolate-boson-star-newtonian-seed-v3-stage-launch-envelope-schema/v1\n",
  verifierRuntimeChannel:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-runtime-channel-schema/v1\n",
  verifierPrelaunchContextRejection:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-prelaunch-context-rejection-schema/v1\n",
  candidateFullSeedGateEvidence:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-full-seed-gate-evidence-schema/v1\n",
  candidateNWrapper:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-N-wrapper-schema/v1\n",
  compositeReplayBundle:
    "nhm2-prolate-boson-star-newtonian-seed-v3-composite-replay-bundle-schema/v1\n",
  verifierClosedOutput:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-closed-output-schema/v1\n",
  fullVerifierEnforcement:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-verifier-enforcement-schema/v1\n",
  brokerRuntimeSeparation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-broker-runtime-separation-schema/v1\n",
  typedInterpreterValidation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-typed-interpreter-validation-schema/v1\n",
  atomicNestedRegistration:
    "nhm2-prolate-boson-star-newtonian-seed-v3-atomic-nested-registration-schema/v1\n",
  assemblerRuntimeChannel:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-runtime-channel-schema/v1\n",
  attestationRootPostState:
    "nhm2-prolate-boson-star-newtonian-seed-v3-attestation-root-poststate-schema/v1\n",
  assemblerClosedOutput:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-closed-output-schema/v1\n",
  fullAssemblerEnforcement:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-assembler-enforcement-schema/v1\n",
  finalContainerObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-container-observation-schema/v1\n",
  finalDescriptorObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-descriptor-observation-schema/v1\n",
  finalProjectionEquality:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-projection-equality-schema/v1\n",
  finalArtifactBindingReceipt:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-artifact-binding-receipt-schema/v1\n",
  finalAdmission:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-admission-schema/v1\n",
  runtimeInstanceInterpretationRejection:
    "nhm2-prolate-boson-star-newtonian-seed-v3-runtime-instance-interpretation-rejection-schema/v1\n",
  registry:
    "nhm2-prolate-boson-star-newtonian-seed-v3-evidence-schema-registry/v1\n",
});

const IMPORTED_NUMERIC_VERIFIER_DAG =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1
    .selectionDAG.verifierAdmissibilityDAG;
const IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.runtimeClosureSchemas;

const ROOT_LISTING_HASH_POLICY = deepFreeze({
  algorithm: "SHA-256",
  byteOrder: "network_big_endian",
  textEncoding: "UTF-8",
  pathNormalization: "exact_relative_POSIX_bytes_no_dot_dot_no_empty_component",
  entryOrder: "unsigned_UTF8_lexicographic_relativePath_then_entryType",
  preimage: [
    "exact_domain_UTF8_with_terminal_LF",
    "entryCount_u64be",
    "for_each_entry_entryType_u8_directory_0_file_1",
    "relativePath_utf8ByteLength_u32be_then_exact_UTF8_bytes",
    "deviceId_u64be",
    "inode_u64be",
    "mountId_u64be",
    "mode_u32be",
    "ownerUid_u64be",
    "ownerGid_u64be",
    "linkCount_u64be",
    "byteLength_u64be_zero_for_directory",
    "plainContentSha256_exact32bytes_all_zero_for_directory",
  ],
  delimiterOrJsonEncodingAllowed: false,
  duplicateOrSparseEntryAllowed: false,
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ROOT_PRESTATE_RECEIPT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.root_prestate_receipt_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_root_prestate_receipt_schema/v1",
    listingHashPolicy: {
      ...ROOT_LISTING_HASH_POLICY,
      domain:
        "nhm2-prolate-boson-star-newtonian-seed-v3-empty-root-listing/v1\n",
      emptyPreimage:
        "domain_UTF8_followed_by_exact_eight_zero_bytes_for_entryCount_u64be_0",
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "absoluteRootPath",
        "deviceId",
        "inode",
        "mountId",
        "ownerUid",
        "ownerGid",
        "modeOctal",
        "linkCount",
        "recursiveEntryCount",
        "listingSha256",
        "secureResolution",
        "observationMonotonicNanoseconds",
        "empty",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_root_prestate_receipt/v1",
        absoluteRootPath: "one_exact_five-root_profile_path",
        deviceId: "canonical_unsigned_decimal",
        inode: "canonical_unsigned_decimal",
        mountId: "canonical_unsigned_decimal",
        ownerUid: "canonical_unsigned_decimal",
        ownerGid: "canonical_unsigned_decimal",
        modeOctal: "exact_4_digit_octal_directory_mode",
        linkCount: "safe_positive_integer",
        recursiveEntryCount: "literal_0",
        listingSha256: "plain_SHA256_of_exact_empty_recursive_listing_preimage",
        secureResolution:
          "literal_openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV",
        observationMonotonicNanoseconds: "canonical_unsigned_decimal",
        empty: "literal_true",
      },
      crossFieldInvariants: [
        "the_root_is_a_real_directory_with_no_symlink_magiclink_reparse-point_alias_device socket_fifo_or_cross-device_descendant",
        "recursiveEntryCount_is_zero_and_listingSha256_recomputes_from_the_exact_empty_listing_preimage",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.numeric_staging32_root_poststate_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_numeric_staging32_root_poststate_schema/v1",
    listingHashPolicy: {
      ...ROOT_LISTING_HASH_POLICY,
      domain:
        "nhm2-prolate-boson-star-newtonian-seed-v3-numeric-staging32-root-listing/v1\n",
      exactEntryCount: 37,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "absoluteRootPath",
        "deviceId",
        "inode",
        "mountId",
        "ownerUid",
        "ownerGid",
        "modeOctal",
        "linkCount",
        "recursiveDirectoryPathOrder",
        "recursiveFilePathOrder",
        "recursiveEntryCount",
        "listingSha256",
        "secureResolution",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_numeric_staging32_root_poststate/v1",
        absoluteRootPath: "literal_/run/staging",
        deviceId: "canonical_unsigned_decimal",
        inode: "canonical_unsigned_decimal",
        mountId: "canonical_unsigned_decimal",
        ownerUid: "canonical_unsigned_decimal",
        ownerGid: "canonical_unsigned_decimal",
        modeOctal: "exact_4_digit_octal_directory_mode",
        linkCount: "safe_positive_integer",
        recursiveDirectoryPathOrder: [
          "arrays",
          "arrays/L0",
          "arrays/L1",
          "arrays/L2",
          "arrays/AUDIT",
        ],
        recursiveFilePathOrder: STAGING32_ABSOLUTE_PATHS.map((path) =>
          path.slice("/run/staging/".length),
        ),
        recursiveEntryCount: "literal_37",
        listingSha256: "plain_SHA256_of_exact_typed_recursive_listing_preimage",
        secureResolution:
          "literal_openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV",
      },
      crossFieldInvariants: [
        "the_listing_contains_exactly_five_declared_directories_and_32_declared_regular_single-link_files_in_frozen_order",
        "listingSha256_binds_entry_type_relative-path_device_inode_mountId_mode_owner_linkCount_size_and_no-extra_recursive_enumeration",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_REPLAY_ROOT_POST_STATE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.replay_root_poststate_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_replay_root_poststate_schema/v1",
    listingHashPolicy: {
      ...ROOT_LISTING_HASH_POLICY,
      domain:
        "nhm2-prolate-boson-star-newtonian-seed-v3-replay-root-listing/v1\n",
      exactEntryCount: 1,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "absoluteRootPath",
        "deviceId",
        "inode",
        "mountId",
        "recursiveEntryCount",
        "exactRelativeFilePathOrder",
        "listingSha256",
        "secureResolution",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_replay_root_poststate/v1",
        absoluteRootPath: "literal_/run/replay",
        deviceId: "canonical_unsigned_decimal",
        inode: "canonical_unsigned_decimal",
        mountId: "canonical_unsigned_decimal",
        recursiveEntryCount: "literal_1",
        exactRelativeFilePathOrder: [
          COMPOSITE_REPLAY_PATH.slice("/run/replay/".length),
        ],
        listingSha256: "plain_SHA256_of_exact_one-file_typed_listing_preimage",
        secureResolution:
          "literal_openat2_RESOLVE_BENEATH_NO_SYMLINKS_NO_MAGICLINKS_NO_XDEV",
      },
      crossFieldInvariants: [
        "the_replay_root_contains_exactly_one_regular_single-link_file_and_no_directories_links_aliases_devices_sockets_fifos_or_mount-crossings",
        "listingSha256_cross-binds_the_exact_composite_file_observation_path_identity_size_and_plain-hash",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FIVE_ROOT_PREPARATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.five_root_preparation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_five_root_preparation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "runAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "preparationStartMonotonicNanoseconds",
        "preparationEndMonotonicNanoseconds",
        "rootPrestateReceipts",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_five_root_preparation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding:
          "one_exact_inherited_v1_common_request_binding",
        sameAttemptId: "exact_128_bit_lowercase_hex_attempt_identifier",
        schedulerLeaseBinding:
          "trusted_scheduler_lease_binding_issuing_sameAttemptId",
        runAttemptBinding:
          "trusted_global_run-attempt_binding_cryptographically_binding_lease_provider_and_sameAttemptId_without_aliasing_any_stage-scoped_worker_attempt",
        absoluteDeadlineReceiptBinding:
          "binding_valid_against_imported_v2_absoluteDeadlineReceipt_primitive",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        preparationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        preparationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootPrestateReceipts: {
          kind: "tuple",
          exactLength: 5,
          exactAbsoluteRootPathOrder: FIVE_MUTABLE_ROOTS,
          itemSchema:
            NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ROOT_PRESTATE_RECEIPT_SCHEMA,
          extraEntriesAllowed: false,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "schedulerLeaseBinding_and_runAttemptBinding_resolve_to_one_trusted_global_run_identity;each_stage_uses_a_distinct_stage-scoped_worker-attempt_binding_issued_under_that_same_lease_run_and_sameAttemptId",
        "all_five_roots_are_identity-distinct_from_each_other_/run/input_all_/opt_stage_roots_and_both_broker-channel_roots",
        "every_root_is_empty_at_prestate_with_no_links_aliases_reparse-points_devices_sockets_fifos_or_cross-device_mounts",
        "staging_and_postprojection-evidence_prestate_close_before_producer_quota_setup;replay_before_verifier_quota_setup;attestation_and_output_before_assembler_quota_setup",
        "preparationStart_is_not_after_preparationEnd_and_both_are_strictly_before_the_absolute_deadline",
        "the_receipt_contains_no_future_stage_output_enforcement_channel_replay_registration_or_artifact_binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_CLOSED_OUTPUT38_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.producer_closed_output38_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_producer_closed_output38_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "producerLaunchEnvelopeBinding",
        "fiveRootPreparationReceiptBinding",
        "clockId",
        "producerExitMonotonicNanoseconds",
        "producerCgroupEmptyMonotonicNanoseconds",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "numericStaging32RootPostStateObservation",
        "numericStaging32RootPostStateObservationBinding",
        "rawEvidence6RootPostStateObservation",
        "rawEvidence6RootPostStateObservationBinding",
        "numericStaging32Observations",
        "rawEvidence6Observations",
        "totalFileCount",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_producer_closed_output38/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "one_exact_common_request_binding",
        sameAttemptId: "same_attempt_as_producer_launch_envelope",
        producerLaunchEnvelopeBinding:
          "exact_v3_producer_launch_envelope_binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive_v3_five_root_preparation_receipt_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        producerExitMonotonicNanoseconds: "canonical_unsigned_decimal",
        producerCgroupEmptyMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        numericStaging32RootPostStateObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA,
        numericStaging32RootPostStateObservationBinding:
          "exact_recomputed_binding_of_the_numeric-root_post-state_observation",
        rawEvidence6RootPostStateObservation:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6PostStateRootObservation,
        rawEvidence6RootPostStateObservationBinding:
          "exact_recomputed_binding_of_the_raw6-root_post-state_observation_compatible_with_the_sealed_postpolicy_schema",
        numericStaging32Observations: {
          kind: "tuple",
          exactLength: 32,
          exactAbsolutePathOrder: STAGING32_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        rawEvidence6Observations: {
          kind: "tuple",
          exactLength: 6,
          exactAbsolutePathOrder: RAW6_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        totalFileCount: "literal_38",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "the_two_root_observation_tuples_are_disjoint_exactly_32_plus_6_and_no_combined_38-file_mount_or_staging_alias_exists",
        "producerExit_is_not_after_cgroupEmpty_is_not_after_observationStart_is_not_after_observationEnd",
        "every_observation_is_a_post-exit_broker_secure_reread_of_one_regular_single-link_exact-size_file_with_stat-read-stat_identity_stability",
        "both_root_post-state_observations_bind_root_device_inode_mountId_recursive_entry-count_listing-hash_and_exact_declared_directories_and_files_with_no_extras_links_aliases_or_mount_crossings",
        "numericStaging32RootPostStateObservation_entries_cross-bind_one-to-one_in_exact_path_order_to_numericStaging32Observations_and_rawEvidence6RootPostStateObservation_entries_cross-bind_one-to-one_to_rawEvidence6Observations",
        "this_pre-enforcement_observation_contains_no_producer_enforcement_receipt_binding_or_later_secure-closure_binding",
      ],
    },
  } as const);

const IMPORTED_V1_STAGE_ENFORCEMENT_SCHEMA =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
    .schemas.stageEnforcementReceipt;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_GENERIC_STAGE_CONTROL_EVIDENCE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.generic_stage_control_evidence_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_generic_stage_control_evidence_schema/v1",
    importedGenericControlSourceRegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
    topLevel: {
      kind: "object",
      exactKeys: [...IMPORTED_V1_STAGE_ENFORCEMENT_SCHEMA.exactKeys],
      extraKeysAllowed: false,
      fields: {
        ...IMPORTED_V1_STAGE_ENFORCEMENT_SCHEMA.fieldTypes,
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_generic_stage_control_evidence/v1",
        runPlanBinding: "exact_future_sealed_v3_binding",
        runRequestBinding: "exact_unchanged_v1_common_request_binding",
        closedStageOutputObservationBinding:
          "exact_additive_v3_stage-specific_closed-output_observation_binding",
      },
      retainedGenericCrossFieldInvariants:
        IMPORTED_V1_STAGE_ENFORCEMENT_SCHEMA.crossFieldInvariants.filter(
          (_invariant, index) => index !== 7 && index !== 12,
        ),
      explicitlyRemovedInvariants: [
        "inherited_index_7_base8_plus32_verifier-work_invariant_is_not_part_of_v3",
        "inherited_index_12_verifier-specific_old-replay-output_invariant_is_not_part_of_the_generic_schema",
      ],
      additiveStageWorkInvariantSource:
        "fullProducerEnforcement_or_fullVerifierEnforcement_schema_crossFieldInvariants",
      stageProfiles: {
        untrusted_seed_producer: {
          descendantOutputFileCount: 38,
          exactOutputRoots: ["/run/staging", "/run/postprojection-evidence"],
          secureInputRereadDuty:
            "base10_policy_bytes_and_bindings_before_producer_work",
          stageWorkDuty:
            "policy-conforming_exact32_numeric_and_exact6_raw_preprojection_materialization",
          outputCloseAndFsyncDuty:
            "close_and_fsync_all_38_files_then_both_directories_before_exit_and_O38",
          closedOutputProfile: "producerClosedOutput38",
        },
        trusted_independent_verifier: {
          descendantOutputFileCount: 1,
          exactOutputRoots: ["/run/replay"],
          secureInputRereadDuty:
            "base10_plus_S32_plus_S6_plus_channel_independent_secure_reread_and_rehash",
          stageWorkDuty:
            "independent_candidate_P_then_conditional_N_then_conditional_gate-evidence",
          outputCloseAndFsyncDuty:
            "exclusive_one-composite_canonical_write_file-fsync_directory-fsync_and_close",
          closedOutputProfile: "verifierClosedOutput",
          maximumSingleOutputFileBytes: 32 * 1024 * 1024,
          rlimitFsizeBytes: 32 * 1024 * 1024,
        },
        trusted_descriptor_assembler: {
          descendantOutputFileCount: 33,
          exactOutputRoots: ["/run/output"],
          secureInputRereadDuty:
            "base10_plus_S32_plus_composite_plus_full-verifier-E_plus_channel_with_exact-one_attestation-root_revalidation",
          stageWorkDuty:
            "exclusive_copy_exact32_verified_arrays_then_schema-valid_canonical_descriptor_last-write",
          outputCloseAndFsyncDuty:
            "close-and-fsync_32_arrays_then_write-close-fsync_descriptor_last_then_fsync_all_five_directories_and_output-root",
          closedOutputProfile: "assemblerClosedOutput",
          maximumSingleOutputFileBytes: 16 * 1024 * 1024,
          maximumAggregateOutputBytes: 32 * 1024 * 1024,
          rlimitFsizeBytes: 16 * 1024 * 1024,
        },
      },
      stageIdMustSelectExactlyOneProfile: true,
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_STAGING32_OBSERVATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.secure_staging32_observation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_secure_staging32_observation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "producerClosedOutput38ObservationBinding",
        "producerFullEnforcementReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "rootPostStateObservation",
        "arrayObservations",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_secure_staging32_observation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_producer_attempt",
        producerClosedOutput38ObservationBinding:
          "exact_pre-enforcement_O38_binding",
        producerFullEnforcementReceiptBinding:
          "exact_positive_full-producer-E_binding_that_recursively_binds_O38",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootPostStateObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA,
        arrayObservations: {
          kind: "tuple",
          exactLength: 32,
          exactAbsolutePathOrder: STAGING32_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "full-producer-E_closes_before_observationStart_and_observationEnd_is_before_verifier_channel_assembly",
        "root_and_32_entries_are_fresh_post-E_secure_rereads_recursively_equal_in_identity_path_size_and_plain-hash_to_O38_S32_while_recomputed_independently",
        "root_is_identity-distinct_from_raw6_input_replay_attestation_output_opt_and_channel_roots_and_has_no_extras_links_aliases_or_mount-crossings",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_RAW_EVIDENCE6_OBSERVATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.secure_raw_evidence6_observation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_secure_raw_evidence6_observation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "producerClosedOutput38ObservationBinding",
        "producerFullEnforcementReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "rootPostStateObservation",
        "arrayObservations",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_secure_raw_evidence6_observation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_producer_attempt",
        producerClosedOutput38ObservationBinding:
          "exact_pre-enforcement_O38_binding",
        producerFullEnforcementReceiptBinding:
          "exact_positive_full-producer-E_binding_that_recursively_binds_O38",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootPostStateObservation:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6PostStateRootObservation,
        arrayObservations: {
          kind: "tuple",
          exactLength: 6,
          exactAbsolutePathOrder: RAW6_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "full-producer-E_closes_before_observationStart_and_observationEnd_is_before_verifier_channel_assembly",
        "root_and_6_entries_are_fresh_post-E_secure_rereads_recursively_equal_in_identity_path_size_and_plain-hash_to_O38_raw6_while_recomputed_independently",
        "rootPostStateObservation_is_losslessly_valid_against_the_exact_sealed_postpolicy_raw6PostStateRootObservation_schema",
        "root_is_identity-distinct_from_S32_input_replay_attestation_output_opt_and_channel_roots_and_has_no_extras_links_aliases_or_mount-crossings",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.postexit_secure_staging32_reread_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_postexit_secure_staging32_reread_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "candidateInstanceIdentityBinding",
        "numericStaging32CompositeBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "rootPostStateObservation",
        "arrayObservations",
        "writerOrWritableAliasCount",
        "namespaceMutationCount",
        "rootMountedReadOnlyAtObservationEnd",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_postexit_secure_staging32_reread/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_global_candidate_attempt",
        candidateInstanceIdentityBinding:
          "exact_preexisting_channel-admitted_candidate-identity_binding",
        numericStaging32CompositeBinding:
          "exact_pre-verifier_S32-N32_composite_binding_nested_in_candidate identity",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_full-verifier-E_binding_closed_before_this_reread",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_runtime-separation_binding_closed_before_this_reread",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootPostStateObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA,
        arrayObservations: {
          kind: "tuple",
          exactLength: 32,
          exactAbsolutePathOrder: STAGING32_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        writerOrWritableAliasCount: "literal_0",
        namespaceMutationCount: "literal_0",
        rootMountedReadOnlyAtObservationEnd: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "full-verifier-E_and_broker-runtime-separation_close_strictly_before_observationStart_observationStart_is_not_after_observationEnd_and_observationEnd_is_strictly_before_deadline_and_before_any_unmount",
        "this_is_a_distinct_postexit_schema_and_does_not_inherit_the_pre-channel_secureStaging32Observation chronology",
        "root_and_all_32_file_observations_are_fresh_secure_stat-read-stat_rereads_recursively_equal_in_identity_path_size_and_plain-hash_to_the_candidate-identity_nested_S32_composite_and_full-E_postexit observation",
        "the_root_remains_read-only_identity-stable_and_available_for_the_later_terminal-positive_assembler_path_without_any_future-assembler binding in this value",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.postexit_secure_raw_evidence6_reread_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_postexit_secure_raw_evidence6_reread_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "candidateInstanceIdentityBinding",
        "rawEvidence6CompositeBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "rootPostStateObservation",
        "arrayObservations",
        "writerOrWritableAliasCount",
        "namespaceMutationCount",
        "rootMountedReadOnlyAtObservationEnd",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_postexit_secure_raw_evidence6_reread/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_global_candidate_attempt",
        candidateInstanceIdentityBinding:
          "exact_preexisting_channel-admitted_candidate-identity_binding",
        rawEvidence6CompositeBinding:
          "exact_pre-verifier_S6-R6_composite_binding_nested_in_candidate identity",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_full-verifier-E_binding_closed_before_this_reread",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_runtime-separation_binding_closed_before_this_reread",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootPostStateObservation:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6PostStateRootObservation,
        arrayObservations: {
          kind: "tuple",
          exactLength: 6,
          exactAbsolutePathOrder: RAW6_ABSOLUTE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        writerOrWritableAliasCount: "literal_0",
        namespaceMutationCount: "literal_0",
        rootMountedReadOnlyAtObservationEnd: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "full-verifier-E_and_broker-runtime-separation_close_strictly_before_observationStart_observationStart_is_not_after_observationEnd_and_observationEnd_is_strictly_before_deadline_and_before_any_unmount",
        "this_is_a_distinct_postexit_schema_and_does_not_inherit_the_pre-channel_secureRawEvidence6Observation chronology",
        "root_and_all_6_file_observations_are_fresh_secure_stat-read-stat_rereads_recursively_equal_in_identity_path_size_and_plain-hash_to_the_candidate-identity_nested_S6_composite_and_full-E_postexit observation",
        "raw6_may_be_unmounted_only_after_this_value_and_its_multi-recipe_hash-crosswalk_are_closed;there_is_no_assembler_raw6_mount_or_future-assembler binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_NUMERIC_IMPLEMENTATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.producer_numeric_implementation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_producer_numeric_implementation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "numericMaterializationPolicyBinding",
        "numericOperationGraphBinding",
        "sourceManifestBinding",
        "sourceLedgerBinding",
        "toolchainManifestBinding",
        "toolchainLedgerBinding",
        "executableDigest",
        "launchInvocationSha256",
        "mpfrGmpRuntimeManifestBinding",
        "implementationLanguage",
        "producerImportsVerifierSource",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_producer_numeric_implementation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        numericMaterializationPolicyBinding:
          "exact_sealed_numeric-policy_binding",
        numericOperationGraphBinding:
          "exact_sealed_numeric-operation-graph_binding",
        sourceManifestBinding: "exact_bound_producer_source_manifest",
        sourceLedgerBinding: "exact_bound_producer_source_ledger",
        toolchainManifestBinding: "exact_bound_producer_toolchain_manifest",
        toolchainLedgerBinding: "exact_bound_producer_toolchain_ledger",
        executableDigest: "exact_lowercase_SHA256_of_bound_producer_executable",
        launchInvocationSha256:
          "exact_plain_SHA256_of_v3_producer_invocation_profile",
        mpfrGmpRuntimeManifestBinding:
          "exact_bound_prelaunch_MPFR-GMP_binary_ABI_version_and_expected-setting_manifest_without_dynamic-conformance_claims",
        implementationLanguage:
          "literal_Python_bootstrap_plus_bound_native_MPFR_GMP",
        producerImportsVerifierSource: "literal_false",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_source_toolchain_executable_launch_runtime_policy_and_operation-graph_bindings_recursively_equal_the_v3_producer_launch-envelope_and_full-producer-E",
        "this_static-plus-launch implementation binding_grants_no_execution_artifact_scientific_or_physical_authority_without_full_runtime_enforcement",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_RUNTIME_CONFORMANCE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.stage_runtime_conformance_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_stage_runtime_conformance_schema/v1",
    importedExactInnerSchema:
      IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.mpfrGmpRuntimeConformanceReceipt,
    discriminator: "disposition",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "disposition",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "stageId",
        "stageWorkerAttemptBinding",
        "launchEnvelopeBinding",
        "clockId",
        "stageStartMonotonicNanoseconds",
        "conformanceStartMonotonicNanoseconds",
        "conformanceEndMonotonicNanoseconds",
        "firstPolicyWorkMonotonicNanosecondsOrNull",
        "noPolicyArithmeticBegan",
        "mpfrGmpRuntimeManifestBinding",
        "innerMpfrGmpRuntimeConformanceReceiptOrNull",
        "innerMpfrGmpRuntimeConformanceReceiptBindingOrNull",
        "failureCodeOrNull",
        "passed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_stage_runtime_conformance/v1",
        disposition: "literal_conformant_or_rejection",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        stageId:
          "literal_untrusted_seed_producer_or_trusted_independent_verifier",
        stageWorkerAttemptBinding:
          "exact_stage-scoped_scheduler-issued_worker-attempt_binding",
        launchEnvelopeBinding:
          "exact_preexisting_launch-envelope_binding_for_stageId_and_stageWorkerAttemptBinding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        stageStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        conformanceStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        conformanceEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        firstPolicyWorkMonotonicNanosecondsOrNull:
          "canonical_unsigned_decimal_for_conformant_or_literal_null_for_rejection",
        noPolicyArithmeticBegan:
          "literal_false_for_conformant_and_true_for_rejection",
        mpfrGmpRuntimeManifestBinding:
          "exact_prelaunch_binary_ABI_version_and_expected-setting_manifest_binding_from_launch-envelope",
        innerMpfrGmpRuntimeConformanceReceiptOrNull:
          "exact_value_valid_against_the_imported_sealed_receipt_for_positive-match_or_null_only_when_unformable_or_failed",
        innerMpfrGmpRuntimeConformanceReceiptBindingOrNull:
          "exact_recomputed_sealed-postpolicy_binding_of_the_embedded_inner_receipt_or_null_with_the_value",
        failureCodeOrNull:
          "null_for_positive-match_or_one_closed_deterministic_runtime-conformance_failure_code",
        passed: "literal_true_for_conformant_and_false_for_rejection",
      },
      stageProfiles: {
        producer: {
          stageId: "untrusted_seed_producer",
          workerAttemptField: "producerWorkerAttemptBinding",
          fullEnforcementField: "producerStageRuntimeConformanceBinding",
        },
        verifier: {
          stageId: "trusted_independent_verifier",
          workerAttemptField: "verifierWorkerAttemptBinding",
          fullEnforcementField: "verifierStageRuntimeConformanceBinding",
        },
      },
      failureCodeEnum: [
        "runtime_manifest_mismatch",
        "mpfr_or_gmp_binary_or_ABI_mismatch",
        "exponent_range_configuration_failed",
        "rounding_or_flag_boundary_check_failed",
        "gradual_underflow_or_FTZ_DAZ_check_failed",
        "runtime_canary_failed",
        "inner_receipt_unformable",
      ],
      dispositionProfiles: {
        conformant: {
          innerMpfrGmpRuntimeConformanceReceiptOrNull: "non-null",
          innerMpfrGmpRuntimeConformanceReceiptBindingOrNull: "non-null",
          failureCodeOrNull: null,
          firstPolicyWorkMonotonicNanosecondsOrNull: "non-null",
          noPolicyArithmeticBegan: false,
          passed: true,
        },
        rejection: {
          innerMpfrGmpRuntimeConformanceReceiptOrNull:
            "value_if_formable_else_null",
          innerMpfrGmpRuntimeConformanceReceiptBindingOrNull:
            "binding_if_value_formable_else_null",
          failureCodeOrNull: "one_closed_enum_value",
          firstPolicyWorkMonotonicNanosecondsOrNull: null,
          noPolicyArithmeticBegan: true,
          passed: false,
        },
      },
      crossFieldInvariants: [
        "stageStart_is_not_after_conformanceStart_and_conformanceStart_is_strictly_before_conformanceEnd;conformant_requires_conformanceEnd_strictly_before_non-null_firstPolicyWork_while_rejection_requires_null_firstPolicyWork_and_noPolicyArithmeticBegan_true",
        "stageId_stageWorkerAttemptBinding_and_launchEnvelopeBinding_recursively_equal_one_scheduler-issued_stage_launch_and_cannot_be_replayed_for_the_other_stage_or_attempt",
        "when_formable_the_inner_receipt_common-request_successor-run_binary_versions_ABIs_and_expected-settings_recursively_equal_the_wrapper_manifest_and_launch-envelope;value_and_binding_nullability_are_identical",
        "the_inner_sealed_receipt_alone_has_no_stage_attempt_or_chronology_authority;only_this_exact_wrapper_binding_is_accepted_by_full-producer-E_or_full-verifier-E_and_full-producer-E_requires_conformant",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_PRODUCER_ENFORCEMENT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.full_producer_enforcement_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_full_producer_enforcement_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "stageId",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "producerWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "inputLedgerBinding",
        "launchEnvelopeBinding",
        "quotaCapabilityBinding",
        "quotaSetupReceiptBinding",
        "seccompPolicyBinding",
        "seccompLoadReceiptBinding",
        "sourceManifestBinding",
        "toolchainManifestBinding",
        "numericOperationGraphBinding",
        "postprojectionOperationGraphBinding",
        "mpfrGmpRuntimeManifestBinding",
        "producerStageRuntimeConformanceBinding",
        "producerNumericImplementationBinding",
        "producerProjectionImplementationBinding",
        "ociImageDigest",
        "genericControlEvidence",
        "genericControlEvidenceBinding",
        "closedOutput38ObservationBinding",
        "clockId",
        "monotonicStartNanoseconds",
        "monotonicEndNanoseconds",
        "exitCode",
        "cgroupPopulatedZero",
        "networkDenied",
        "quotaAndDeadlinePassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_full_producer_enforcement/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        stageId: "literal_untrusted_seed_producer",
        sameAttemptId:
          "exact_same_attempt_across_prestate_ledger_envelope_and_output",
        schedulerLeaseBinding:
          "trusted_scheduler_lease_binding_issuing_the_worker_attempt",
        producerWorkerAttemptBinding:
          "trusted_worker-attempt_binding_that_cryptographically_binds_sameAttemptId_lease_provider_cgroup_and_launch",
        absoluteDeadlineReceiptBinding:
          "exact_preexisting_absolute_deadline_receipt_binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive_v3_five_root_preparation_receipt_binding",
        inputLedgerBinding: "exact_v3_producer_base10_input_ledger_binding",
        launchEnvelopeBinding: "exact_v3_producer_launch_envelope_binding",
        quotaCapabilityBinding: "bound_producer_quota_capability",
        quotaSetupReceiptBinding:
          "positive_prelaunch_producer_quota_setup_receipt",
        seccompPolicyBinding: "bound_producer_seccomp_policy",
        seccompLoadReceiptBinding:
          "positive_preexec_producer_seccomp_load_receipt",
        sourceManifestBinding: "bound_producer_source_manifest",
        toolchainManifestBinding: "bound_producer_toolchain_manifest",
        numericOperationGraphBinding:
          "exact_sealed_numeric_materialization_operation-graph_binding",
        postprojectionOperationGraphBinding:
          "exact_sealed_postprojection_operation-graph_binding",
        mpfrGmpRuntimeManifestBinding:
          "exact_prelaunch_MPFR-GMP_binary_ABI_and_expected-setting_manifest_binding",
        producerStageRuntimeConformanceBinding:
          "exact_positive-match_v3_stage-runtime-conformance_wrapper_binding_for_producerWorkerAttemptBinding_computed_post-start_pre-work_and_embedding_the_exact_sealed_MPFR-GMP_receipt;rejection_yields_no_O38_or_verifier_path",
        producerNumericImplementationBinding:
          "exact_bound_numeric-policy-conforming_producer_implementation_binding",
        producerProjectionImplementationBinding:
          "exact_bound_postpolicy-conforming_producer_projection_implementation_binding",
        ociImageDigest: "exact_bound_linux_x86_64_oci_image_digest",
        genericControlEvidence:
          "exact_value_valid_against_v3_genericStageControlEvidence_with_all_memory_OOM_pids_seccomp_capability_source-toolchain-ledger_capture_mount-project_quota-inode_RLIMIT_deadline_exit_timeout-kill_cgroup_output-and-fsync_fields",
        genericControlEvidenceBinding:
          "exact_recomputed_binding_of_genericControlEvidence",
        closedOutput38ObservationBinding:
          "exact_positive_v3_producer_closed_output38_observation_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        monotonicStartNanoseconds: "canonical_unsigned_decimal",
        monotonicEndNanoseconds: "canonical_unsigned_decimal",
        exitCode: "literal_0",
        cgroupPopulatedZero: "literal_true",
        networkDenied: "literal_true",
        quotaAndDeadlinePassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "base10_input_ledger_and_launch_envelope_resolve_exact_policy_observations_8_and_9_and_no_common-request_future-evidence",
        "launchEnvelopeBinding_recursively_binds_the_exact_numeric-and-postprojection_operation-graphs_prelaunch_MPFR-GMP_runtime-manifest_and_both_producer_implementation_bindings;after_start_before_work_the_stage-scoped_conformance_receipt_is_computed_and_full-E_binds_it",
        "both_output_roots_are_the_exact_identity-distinct_prepared_roots_and_the_closed-output38_observation_is_after_exit_and_cgroup-empty",
        "quota_seccomp_deadline_source_toolchain_image_mount_namespace_network_and_process-thread_limits_are_all_bound_and_positive",
        "genericControlEvidence_recursively_equals_the_stage_fields_launch-envelope_ledger_source-and-toolchain_ledgers_quota_seccomp_deadline_output_observation_and_same_scheduler-issued_attempt",
        "closedOutput38ObservationBinding_recomputes_from_raw_canonical_observation_bytes_and_recursively_binds_this_same_attempt_without_binding_this_enforcement_receipt",
        "this_receipt_closes_before_post-enforcement_S32_and_S6_secure_rereads_and_cannot_bind_or_predict_them",
      ],
    },
  } as const);

assertLiteral(
  Object.is(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.replayReceiptSchema,
  ),
  "run-plan-v3 requires the exact sealed candidate-P schema singleton",
);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.numeric_staging32_composite_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_numeric_staging32_composite_schema/v1",
    importedExactSchemas: {
      numericN32Manifest:
        IMPORTED_NUMERIC_VERIFIER_DAG.producer32ArrayStagingEvidenceSchema,
      sealedPostpolicyS32ToN32Projection:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.numericStaging32SecureToManifestProjectionReceipt,
      sealedPostpolicyNumericStaging32RuntimeClosure:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.numericStaging32RuntimeClosure,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerFullEnforcementReceiptBinding",
        "v3SecureStaging32ObservationClosure",
        "v3SecureStaging32ObservationClosureBinding",
        "importedV2CompatibleS32Projection",
        "importedV2CompatibleS32ProjectionBinding",
        "numericPolicyN32Manifest",
        "numericPolicyN32ManifestBinding",
        "sealedPostpolicyS32ToN32ProjectionReceipt",
        "sealedPostpolicyS32ToN32ProjectionReceiptBinding",
        "sealedPostpolicyNumericStaging32RuntimeClosure",
        "sealedPostpolicyNumericStaging32RuntimeClosureBinding",
        "entryCount",
        "projectionEqualities",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_numeric_staging32_composite/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        producerFullEnforcementReceiptBinding:
          "exact_positive_v3_full_producer_enforcement_binding",
        v3SecureStaging32ObservationClosure:
          "exact_self-contained_value_valid_against_v3_secureStaging32Observation",
        v3SecureStaging32ObservationClosureBinding:
          "exact_recomputed_post-enforcement_v3_S32_secure-reread_closure_binding",
        importedV2CompatibleS32Projection:
          "exact_self-contained_lossless_projection_value_valid_against_the_sealed_v2_secureStagingObservationClosure_schema",
        importedV2CompatibleS32ProjectionBinding:
          "exact_recomputed_binding_of_importedV2CompatibleS32Projection_without_reusing_the_v2_instance_schema_as_the_v3_top-level_schema",
        numericPolicyN32Manifest:
          "exact_self-contained_value_valid_against_the_imported_sealed_numeric_producer32ArrayStagingEvidenceSchema",
        numericPolicyN32ManifestBinding:
          "exact_recomputed_binding_of_numericPolicyN32Manifest",
        sealedPostpolicyS32ToN32ProjectionReceipt:
          "exact_self-contained_positive_value_valid_against_the_imported_sealed_postpolicy_numericStaging32SecureToManifestProjectionReceipt",
        sealedPostpolicyS32ToN32ProjectionReceiptBinding:
          "exact_recomputed_positive_binding_of_sealedPostpolicyS32ToN32ProjectionReceipt",
        sealedPostpolicyNumericStaging32RuntimeClosure:
          "exact_value_valid_against_the_imported_sealed_postpolicy_numericStaging32RuntimeClosure_schema",
        sealedPostpolicyNumericStaging32RuntimeClosureBinding:
          "exact_recomputed_binding_of_the_embedded_sealed-postpolicy-compatible_runtime_closure",
        entryCount: "literal_32",
        projectionEqualities: {
          kind: "tuple",
          exactLength: 32,
          order: "inventoryIndex_ascending_0_through_31",
          itemExactKeys: [
            "inventoryIndex",
            "secureObservationIndex",
            "manifestEntryIndex",
            "absolutePath",
            "relativePath",
            "byteLength",
            "securePlainSha256",
            "manifestRawArraySha256",
            "fieldwiseMatched",
          ],
          itemFields: {
            inventoryIndex: "literal_same_index_0_through_31",
            secureObservationIndex: "literal_same_index_0_through_31",
            manifestEntryIndex: "literal_same_index_0_through_31",
            absolutePath: "literal_frozen_S32_absolute_path_at_index",
            relativePath:
              "literal_frozen_numeric_inventory_relative_path_at_index",
            byteLength: "literal_frozen_numeric_inventory_byteLength_at_index",
            securePlainSha256:
              "exact_plain_SHA256_from_secure_fileObservation_at_index",
            manifestRawArraySha256:
              "exact_plain_SHA256_from_N32_manifest_at_index",
            fieldwiseMatched: "literal_true",
          },
          itemSemantics:
            "all_indices_equal_the_same_literal_index_paths_and_sizes_equal_the_frozen_inventory_securePlainSha256_equals_the_same_securely-reread_raw_bytes_plain_SHA256_manifestRawArraySha256_and_fieldwiseMatched_is_literal_true",
          extraEntriesAllowed: false,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_five_component_values_are_self-contained_once_in_this_composite_and_every_binding_recomputes_from_its_exact value;all resolve to one v3 run common-request full-producer-enforcement and post-E pre-verifier snapshot",
        "S32_and_N32_are_distinct_objects_and_the_projection_receipt_proves_exact_index_path_shape_size_dtype_order_and_plain-hash_equality_for_all_32_entries",
        "sealedPostpolicyNumericStaging32RuntimeClosure_recursively_binds_the_importedV2CompatibleS32ProjectionBinding_numericPolicyN32ManifestBinding_and_sealedPostpolicyS32ToN32ProjectionReceiptBinding_without_renaming_or_substitution",
        "the_v3_secure_closure_is_observed_only_after_the_full_producer_enforcement_receipt_and_contains_no_raw6_entries",
        "no_domain-separated_binding_digest_is_substituted_for_a_plain_file-observation_digest",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.raw_evidence6_composite_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_raw_evidence6_composite_schema/v1",
    importedExactSchemas: {
      sealedPostpolicyRaw6SecureObservationClosure:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6SecureObservationClosure,
      sealedPostpolicyR6Manifest:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6Manifest,
      sealedPostpolicyS6ToR6Projection:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6SecureToManifestProjectionReceipt,
      sealedPostpolicyRawEvidenceRuntimeClosure:
        IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.rawEvidenceRuntimeClosure,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "producerFullEnforcementReceiptBinding",
        "v3SecureRaw6ObservationClosure",
        "v3SecureRaw6ObservationClosureBinding",
        "sealedPostpolicyCompatibleS6Projection",
        "sealedPostpolicyCompatibleS6ProjectionBinding",
        "postprojectionPolicyR6Manifest",
        "postprojectionPolicyR6ManifestBinding",
        "sealedPostpolicyS6ToR6ProjectionReceipt",
        "sealedPostpolicyS6ToR6ProjectionReceiptBinding",
        "sealedPostpolicyRawEvidenceRuntimeClosure",
        "sealedPostpolicyRawEvidenceRuntimeClosureBinding",
        "entryCount",
        "projectionEqualities",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_raw_evidence6_composite/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        producerFullEnforcementReceiptBinding:
          "exact_positive_v3_full_producer_enforcement_binding",
        v3SecureRaw6ObservationClosure:
          "exact_self-contained_value_valid_against_v3_secureRawEvidence6Observation",
        v3SecureRaw6ObservationClosureBinding:
          "exact_recomputed_post-enforcement_v3_S6_secure-reread_closure_binding",
        sealedPostpolicyCompatibleS6Projection:
          "exact_self-contained_lossless_projection_value_valid_against_the_imported_sealed_postpolicy_raw6SecureObservationClosure_schema",
        sealedPostpolicyCompatibleS6ProjectionBinding:
          "exact_recomputed_binding_of_sealedPostpolicyCompatibleS6Projection",
        postprojectionPolicyR6Manifest:
          "exact_self-contained_value_valid_against_the_imported_sealed_postpolicy_raw6Manifest_schema",
        postprojectionPolicyR6ManifestBinding:
          "exact_recomputed_binding_of_postprojectionPolicyR6Manifest",
        sealedPostpolicyS6ToR6ProjectionReceipt:
          "exact_self-contained_positive_value_valid_against_the_imported_sealed_postpolicy_raw6SecureToManifestProjectionReceipt",
        sealedPostpolicyS6ToR6ProjectionReceiptBinding:
          "exact_recomputed_positive_binding_of_sealedPostpolicyS6ToR6ProjectionReceipt",
        sealedPostpolicyRawEvidenceRuntimeClosure:
          "exact_value_valid_against_the_imported_sealed_postpolicy_rawEvidenceRuntimeClosure_schema",
        sealedPostpolicyRawEvidenceRuntimeClosureBinding:
          "exact_recomputed_binding_of_the_embedded_sealed-postpolicy-compatible_runtime_closure",
        entryCount: "literal_6",
        projectionEqualities: {
          kind: "tuple",
          exactLength: 6,
          order: "evidenceIndex_ascending_0_through_5",
          itemExactKeys: [
            "evidenceIndex",
            "secureObservationIndex",
            "manifestEntryIndex",
            "absolutePath",
            "relativePath",
            "byteLength",
            "securePlainSha256",
            "manifestPlainSha256",
            "manifestDomainSha256",
            "fieldwiseMatched",
          ],
          itemFields: {
            evidenceIndex: "literal_same_index_0_through_5",
            secureObservationIndex: "literal_same_index_0_through_5",
            manifestEntryIndex: "literal_same_index_0_through_5",
            absolutePath: "literal_frozen_raw6_absolute_path_at_index",
            relativePath:
              "literal_frozen_raw6_inventory_relative_path_at_index",
            byteLength: "literal_frozen_raw6_inventory_byteLength_at_index",
            securePlainSha256:
              "exact_plain_SHA256_from_secure_fileObservation_at_index",
            manifestPlainSha256: "exact_plain_SHA256_from_R6_manifest_at_index",
            manifestDomainSha256:
              "exact_domain-separated_SHA256_recomputed_from_the_same_raw_bytes_at_index",
            fieldwiseMatched: "literal_true",
          },
          itemSemantics:
            "all_indices_equal_paths_shapes_sizes_dtype_order_and_plain_hashes_equal_the_frozen_raw6_inventory_and_domainSha256_recomputes_from_the_same_secure_raw_bytes_under_the_sealed_postpolicy_per-array_domain",
          extraEntriesAllowed: false,
        },
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_five_component_values_are_self-contained_once_in_this_composite_and_every binding recomputes from its exact value;all resolve to one v3 run common-request full-producer-enforcement and the same post-E pre-verifier snapshot as S32-N32",
        "S6_and_R6_are_distinct_objects_and_the_projection_receipt_proves_all_six_exact_fieldwise_equalities",
        "sealedPostpolicyRawEvidenceRuntimeClosure_recursively_binds_the_sealedPostpolicyCompatibleS6ProjectionBinding_postprojectionPolicyR6ManifestBinding_and_sealedPostpolicyS6ToR6ProjectionReceiptBinding_without_renaming_or_substitution",
        "the_v3_secure_closure_contains_only_the_exact_six_/run/postprojection-evidence_files_and_no_staging32_entry",
        "S6_root_is_identity-distinct_from_S32_input_replay_attestation_output_opt_and_channel_roots",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_INSTANCE_IDENTITY_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.candidate_instance_identity_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_candidate_instance_identity_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "commonRunRequestBinding",
        "producerFullEnforcementReceipt",
        "producerFullEnforcementReceiptBinding",
        "numericStaging32Composite",
        "numericStaging32CompositeBinding",
        "rawEvidence6Composite",
        "rawEvidence6CompositeBinding",
        "sealedPostpolicyCandidateInstanceIdentity",
        "sealedPostpolicyCandidateInstanceIdentityBinding",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_candidate_instance_identity/v1",
        commonRunRequestBinding: "one_exact_common_request_binding",
        producerFullEnforcementReceipt:
          "one_exact_self-contained_value_valid_against_v3_fullProducerEnforcement",
        producerFullEnforcementReceiptBinding:
          "one_exact_positive_binding_recomputed_from_the_embedded_full-producer-E_value",
        numericStaging32Composite:
          "one_exact_self-contained_value_valid_against_v3_numericStaging32Composite",
        numericStaging32CompositeBinding:
          "one_exact_positive_binding_recomputed_from_the_embedded_S32-N32_composite",
        rawEvidence6Composite:
          "one_exact_self-contained_value_valid_against_v3_rawEvidence6Composite",
        rawEvidence6CompositeBinding:
          "one_exact_positive_binding_recomputed_from_the_embedded_S6-R6_composite",
        sealedPostpolicyCandidateInstanceIdentity:
          "exact_value_valid_against_the_imported_sealed_postpolicy_candidateInstanceIdentity_schema_with_its_original_exact_keys_commonRunRequestBinding_producerEnforcementReceiptBinding_numericStaging32RuntimeClosureBinding_rawEvidenceRuntimeClosureBinding",
        sealedPostpolicyCandidateInstanceIdentityBinding:
          "exact_recomputed_binding_of_the_embedded_sealed-postpolicy_candidate_identity_value",
      },
      crossFieldInvariants: [
        "all_three_embedded_values_are_self-contained_and_each_binding_recomputes_from_its_exact_value;both_composites_recursively_bind_this_exact_commonRunRequestBinding_producerFullEnforcementReceiptBinding_successorRunPlanBinding_sameAttemptId_and_post-E_pre-verifier_snapshot",
        "sealedPostpolicyCandidateInstanceIdentity.commonRunRequestBinding_equals_commonRunRequestBinding;producerEnforcementReceiptBinding_equals_producerFullEnforcementReceiptBinding;numericStaging32RuntimeClosureBinding_equals_the_exact_sealedPostpolicyNumericStaging32RuntimeClosureBinding_nested_in_the_numeric_composite;rawEvidenceRuntimeClosureBinding_equals_the_exact_sealedPostpolicyRawEvidenceRuntimeClosureBinding_nested_in_the_raw_composite",
        "mixing_any_binding_from_another_candidate_run_attempt_producer-receipt_or_snapshot_is_a_typed_hard_rejection",
        "the_numeric_and_raw_roots_and_entry_sets_are_nonoverlapping_and_neither_composite_aliases_the_other",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INPUT_LEDGER_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.stage_input_ledger_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_stage_input_ledger_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "stageId",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "stageWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "quotaSetupReceiptBinding",
        "seccompLoadReceiptBinding",
        "requiredFileCount",
        "requiredFilePathOrder",
        "fileObservations",
        "priorStageReceiptBindings",
        "ledgerSha256Domain",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_stage_input_ledger/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding:
          "exact_binding_recomputed_from_fileObservations[0]",
        stageId: "one_exact_stage_id_with_the_matching_profile",
        sameAttemptId: "exact_128_bit_lowercase_hex_attempt_identifier",
        schedulerLeaseBinding: "trusted_scheduler_lease_binding_for_this_stage",
        stageWorkerAttemptBinding:
          "trusted_worker-attempt_binding_issuing_sameAttemptId_for_this_stage",
        absoluteDeadlineReceiptBinding:
          "exact_preexisting_absolute_deadline_receipt_binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive_v3_five_root_preparation_receipt_binding",
        quotaSetupReceiptBinding:
          "exact_stage_profile_quota_setup_receipt_binding",
        seccompLoadReceiptBinding:
          "exact_stage_profile_seccomp_load_receipt_binding",
        requiredFileCount: "literal_from_exact_stage_profile",
        requiredFilePathOrder: "literal_tuple_from_exact_stage_profile",
        fileObservations: {
          kind: "tuple",
          exactLength: "literal_from_exact_stage_profile",
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        priorStageReceiptBindings: {
          kind: "exact_named_binding_tuple",
          exactNameOrderByStageProfile: {
            untrusted_seed_producer: [],
            trusted_independent_verifier: [
              "producer_full_enforcement_receipt_binding",
              "numeric_staging32_composite_binding",
              "raw_evidence6_composite_binding",
              "candidate_instance_identity_binding",
            ],
            trusted_descriptor_assembler: [
              "producer_full_enforcement_receipt_binding",
              "verifier_full_enforcement_receipt_binding",
              "composite_replay_bundle_binding",
              "broker_runtime_separation_receipt_binding",
              "typed_interpreter_validation_receipt_binding",
              "atomic_nested_registration_receipt_binding",
            ],
          },
          itemExactKeys: ["name", "binding"],
          itemFields: {
            name: "literal_from_exact_stage_profile_order",
            binding:
              "non-null_control-plane_binding_matching_the_named_registry_profile",
          },
          extraEntriesAllowed: false,
        },
        ledgerSha256Domain:
          "exact_unique_stage_profile_domain_with_terminal_LF",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "the_first_8_observations_recursively_equal_the_inherited_v1_base_profile_and_common_request_bytes_are_unchanged",
        "observations[8]_and_[9]_are_exact_policy_canonical_UTF8_bytes_with_the_frozen_plain_SHA256_sizes_and_independently_recomputed_domain-separated_sealed_bindings",
        "producer_profile_is_exact_base10;verifier_profile_is_base10_plus_S32_at_10..41_plus_raw6_at_42..47;assembler_profile_is_base10_plus_S32_at_10..41_plus_composite42_plus_fresh-full-verifier-E43",
        "no_ledger_contains_its_future_channel_instance_or_launch-envelope_binding_and_assembler_contains_no_raw6_mount_or_observation",
      ],
    },
    stageProfiles: {
      producer: {
        stageId: "untrusted_seed_producer",
        requiredFileCount: 10,
        requiredFilePathOrder: BASE_INPUT_ABSOLUTE_PATHS,
        priorStageReceiptBindingNames: [],
        ledgerSha256Domain:
          "nhm2-prolate-boson-star-newtonian-seed-v3-producer-input-ledger/v1\n",
      },
      verifier: {
        stageId: "trusted_independent_verifier",
        requiredFileCount: 48,
        requiredFilePathOrder:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES
            .verifier.preChannelInputLedgerFilePathOrder,
        priorStageReceiptBindingNames: [
          "producer_full_enforcement_receipt_binding",
          "numeric_staging32_composite_binding",
          "raw_evidence6_composite_binding",
          "candidate_instance_identity_binding",
        ],
        ledgerSha256Domain:
          "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-input-ledger/v1\n",
      },
      assembler: {
        stageId: "trusted_descriptor_assembler",
        requiredFileCount: 44,
        requiredFilePathOrder:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES
            .assembler.preChannelInputLedgerFilePathOrder,
        priorStageReceiptBindingNames: [
          "producer_full_enforcement_receipt_binding",
          "verifier_full_enforcement_receipt_binding",
          "composite_replay_bundle_binding",
          "broker_runtime_separation_receipt_binding",
          "typed_interpreter_validation_receipt_binding",
          "atomic_nested_registration_receipt_binding",
        ],
        ledgerSha256Domain:
          "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-input-ledger/v1\n",
      },
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_LAUNCH_ENVELOPE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.stage_launch_envelope_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_stage_launch_envelope_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "stageId",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "stageWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "inputLedgerBinding",
        "exactInvocationSha256",
        "sourceManifestBinding",
        "toolchainManifestBinding",
        "ociImageDigest",
        "quotaCapabilityBinding",
        "quotaSetupReceiptBinding",
        "seccompPolicyBinding",
        "seccompLoadReceiptBinding",
        "mountProfile",
        "numericStaging32MountObservationBindingOrNull",
        "rawEvidence6MountObservationBindingOrNull",
        "attestationRootPostStateObservationBindingOrNull",
        "outputRootPrestateReceiptBindingOrNull",
        "channelAbsolutePathOrNull",
        "channelSchemaBindingOrNull",
        "channelInstanceBindingOrNull",
        "channelObservationBindingOrNull",
        "typedInterpreterBindingOrNull",
        "independentProofKernelBindingOrNull",
        "independentProofKernelToolchainBindingOrNull",
        "verifierExecutableBindingOrNull",
        "numericOperationGraphBindingOrNull",
        "postprojectionOperationGraphBindingOrNull",
        "mpfrGmpRuntimeManifestBindingOrNull",
        "producerNumericImplementationBindingOrNull",
        "producerProjectionImplementationBindingOrNull",
        "verifierProjectionImplementationBindingOrNull",
        "implementationSeparationReceiptBindingOrNull",
        "clockId",
        "launchEnvelopeSealMonotonicNanoseconds",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_stage_launch_envelope/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        stageId: "one_exact_stage_id_with_matching_stage_profile",
        sameAttemptId: "exact_same_attempt_as_input_ledger",
        schedulerLeaseBinding:
          "exact_same_trusted_scheduler_lease_as_ledger_and_preparation",
        stageWorkerAttemptBinding:
          "exact_same_stage-scoped_worker-attempt_as_ledger_issued_under_the_global_preparation_run-and-lease",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        inputLedgerBinding:
          "exact_already-closed_v3_stage_input_ledger_binding",
        exactInvocationSha256:
          "plain_SHA256_of_exact_stage_invocation_profile_bytes",
        sourceManifestBinding: "exact_stage_source_manifest_binding",
        toolchainManifestBinding: "exact_stage_toolchain_manifest_binding",
        ociImageDigest: "exact_bound_linux_x86_64_oci_image_digest",
        quotaCapabilityBinding: "exact_stage_quota_capability_binding",
        quotaSetupReceiptBinding:
          "exact_positive_prelaunch_quota_setup_receipt_binding",
        seccompPolicyBinding: "exact_stage_seccomp_policy_binding",
        seccompLoadReceiptBinding:
          "exact_positive_preexec_seccomp_load_receipt_binding",
        mountProfile: "exact_literal_stage_mount_profile",
        numericStaging32MountObservationBindingOrNull:
          "producer_null;verifier_exact_S32_launch_observation_binding;assembler_exact_S32_launch_observation_binding",
        rawEvidence6MountObservationBindingOrNull:
          "producer_null;verifier_exact_S6_launch_observation_binding;assembler_literal_null",
        attestationRootPostStateObservationBindingOrNull:
          "assembler_exact_positive_exact-one_attestation-root-poststate_binding;producer_and_verifier_null",
        outputRootPrestateReceiptBindingOrNull:
          "assembler_exact_prepared-empty-output-root_receipt_binding;producer_and_verifier_null",
        channelAbsolutePathOrNull:
          "producer_null;verifier_or_assembler_exact_stage_channel_path",
        channelSchemaBindingOrNull:
          "producer_null;verifier_or_assembler_exact_v3_channel_schema_binding",
        channelInstanceBindingOrNull:
          "producer_null;verifier_or_assembler_exact_preexisting_channel_instance_binding",
        channelObservationBindingOrNull:
          "producer_null;verifier_or_assembler_exact_secure_channel_observation_binding",
        typedInterpreterBindingOrNull:
          "producer_null;verifier_or_assembler_non-null_closed-schema_typed-interpreter_binding",
        independentProofKernelBindingOrNull:
          "verifier_non-null_exact_independent-proof-kernel_binding;producer_and_assembler_null",
        independentProofKernelToolchainBindingOrNull:
          "verifier_non-null_exact_prelaunch_binding;producer_and_assembler_null",
        verifierExecutableBindingOrNull:
          "verifier_non-null_exact_bound_independent-verifier_executable_binding;producer_and_assembler_null",
        numericOperationGraphBindingOrNull:
          "producer_and_verifier_exact_sealed_numeric_operation-graph_binding;assembler_null",
        postprojectionOperationGraphBindingOrNull:
          "producer_and_verifier_exact_sealed_postprojection_operation-graph_binding;assembler_null",
        mpfrGmpRuntimeManifestBindingOrNull:
          "producer_and_verifier_non-null_exact_prelaunch_binary_ABI_and_expected-setting_manifest_binding_without_dynamic_conformance;assembler_null",
        producerNumericImplementationBindingOrNull:
          "producer_non-null_exact_numeric-policy-conforming_implementation_binding;verifier_and_assembler_null",
        producerProjectionImplementationBindingOrNull:
          "producer_and_verifier_non-null_exact_sealed-postpolicy_static_implementation_binding;assembler_null",
        verifierProjectionImplementationBindingOrNull:
          "verifier_non-null_exact_different_sealed-postpolicy_static_implementation_binding;producer_and_assembler_null",
        implementationSeparationReceiptBindingOrNull:
          "verifier_non-null_exact_positive_sealed-postpolicy_static-separation_binding;producer_and_assembler_null",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        launchEnvelopeSealMonotonicNanoseconds: "canonical_unsigned_decimal",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "input_ledger_closes_before_any_stage_channel;verifier_or_assembler_channel_then_seals_without_launch-envelope_binding;secure_channel_observation_then_closes;launch-envelope_finally_binds_the_exact_channel_instance_and_observation",
        "producer_has_no_broker_channel_and_sees_only_base10;verifier_channel_is_contextual_observation48_and_sole_visible49_extra;assembler_channel_is_contextual_observation44_and_sole_visible45_extra",
        "verifier_launch_binds_both_identity-distinct_read-only_S32_and_S6_mount_observations;assembler_binds_only_S32_plus_the_exact-one_read-only_attestation-root-poststate_and_prepared-empty-output-root_and_explicitly_has_no_raw6_mount",
        "producer_launch_recursively_binds_numeric-and-postprojection-operation-graphs_MPFR-GMP_runtime_producer-numeric-and-postprojection-implementation_bindings_without_a_channel;verifier_launch_recursively_binds_its_exact_preexisting_source-manifest_toolchain-manifest_executable_OCI-image_typed-interpreter_independent-proof-kernel_proof-kernel-toolchain_operation-graphs_runtime_projection-implementation_and_static-separation_bindings_embedded_in_the_channel",
        "exactInvocationSha256_equals_the_corresponding_literal_NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256_value_for_stageId_and_the_bound_source-toolchain-executable_invocation_recursively_matches_those_exact_argv_environment working-directory and stdin bytes",
        "the_envelope_contains_no_future_preexec_revalidation_exit_enforcement_output_separation_interpretation_registration_or_artifact_binding",
      ],
    },
    stageProfiles: {
      producer: {
        stageId: "untrusted_seed_producer",
        exactInvocationPlainSha256:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256.producer,
        launchVisibleFileCount: 10,
        channelObservationContextualPosition: null,
        channelAbsolutePath: null,
        mountAccess: {
          "/run/input": "read_only_exact10",
          "/run/staging": "write_only_prepared_output_root",
          "/run/postprojection-evidence": "write_only_prepared_output_root",
        },
      },
      verifier: {
        stageId: "trusted_independent_verifier",
        exactInvocationPlainSha256:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256.verifier,
        launchVisibleFileCount: 49,
        channelObservationContextualPosition: 48,
        channelAbsolutePath: VERIFIER_CHANNEL_PATH,
        mountAccess: {
          "/run/input": "read_only_exact10",
          "/run/staging": "read_only_exact32",
          "/run/postprojection-evidence": "read_only_exact6",
          "/run/replay": "write_only_prepared_output_root",
          [VERIFIER_CHANNEL_PATH]: "read_only_exact_one_file",
        },
      },
      assembler: {
        stageId: "trusted_descriptor_assembler",
        exactInvocationPlainSha256:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256.assembler,
        launchVisibleFileCount: 45,
        channelObservationContextualPosition: 44,
        channelAbsolutePath: ASSEMBLER_CHANNEL_PATH,
        mountAccess: {
          "/run/input": "read_only_exact10",
          "/run/staging": "read_only_exact32",
          "/run/replay": "read_only_exact_one_composite",
          "/run/attestation": "read_only_exact_one_full_verifier_receipt",
          "/run/output": "write_only_prepared_output_root",
          [ASSEMBLER_CHANNEL_PATH]: "read_only_exact_one_file",
        },
        forbiddenMounts: ["/run/postprojection-evidence"],
      },
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_RUNTIME_CHANNEL_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.verifier_runtime_channel_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_verifier_runtime_channel_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "evidenceSchemaRegistryBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "producerWorkerAttemptBinding",
        "verifierWorkerAttemptBinding",
        "absoluteDeadlineReceipt",
        "absoluteDeadlineReceiptBinding",
        "replayRootPrestateReceiptBinding",
        "verifierQuotaSetupReceiptBinding",
        "verifierSeccompLoadReceiptBinding",
        "verifierInputLedgerBinding",
        "producerFullEnforcementReceiptBinding",
        "numericStaging32CompositeBinding",
        "rawEvidence6CompositeBinding",
        "candidateInstanceIdentity",
        "candidateInstanceIdentityBinding",
        "verifierSourceManifestBinding",
        "verifierToolchainManifestBinding",
        "verifierExecutableBinding",
        "verifierOciImageDigest",
        "independentProofKernelBinding",
        "independentProofKernelToolchainBinding",
        "numericOperationGraphBinding",
        "postprojectionOperationGraphBinding",
        "mpfrGmpRuntimeManifestBinding",
        "producerProjectionImplementation",
        "producerProjectionImplementationBinding",
        "verifierProjectionImplementation",
        "verifierProjectionImplementationBinding",
        "implementationSeparationReceipt",
        "implementationSeparationReceiptBinding",
        "typedInterpreterBinding",
        "clockId",
        "channelAssemblyStartMonotonicNanoseconds",
        "channelSealMonotonicNanoseconds",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_verifier_runtime_channel/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        evidenceSchemaRegistryBinding:
          "exact_future_sealed_v3_registry_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_attempt_as_full_producer_enforcement",
        schedulerLeaseBinding:
          "exact_same_trusted_scheduler_lease_as_preparation_producer-E_and_verifier-ledger",
        producerWorkerAttemptBinding:
          "exact_stage-scoped_producer_worker-attempt_recursively_bound_by_full-producer-E",
        verifierWorkerAttemptBinding:
          "distinct_stage-scoped_verifier_worker-attempt_bound_by_verifier-ledger_and_future-launch_under_the_same_global_run lease and_sameAttemptId",
        absoluteDeadlineReceipt:
          "value_valid_against_importedV2.schemas.absoluteDeadlineReceipt",
        absoluteDeadlineReceiptBinding:
          "exact_recomputed_binding_of_embedded_deadline_receipt",
        replayRootPrestateReceiptBinding:
          "exact_replay_entry_from_five-root-preparation_receipt",
        verifierQuotaSetupReceiptBinding:
          "exact_positive_prelaunch_quota_receipt",
        verifierSeccompLoadReceiptBinding:
          "exact_positive_preexec_seccomp_receipt",
        verifierInputLedgerBinding:
          "exact_closed_base10_plus_S32_plus_S6_ledger",
        producerFullEnforcementReceiptBinding:
          "exact_binding_recursively_resolved_from_embedded_candidateInstanceIdentity.producerFullEnforcementReceipt",
        numericStaging32CompositeBinding:
          "exact_binding_recursively_resolved_from_embedded_candidateInstanceIdentity.numericStaging32Composite",
        rawEvidence6CompositeBinding:
          "exact_binding_recursively_resolved_from_embedded_candidateInstanceIdentity.rawEvidence6Composite",
        candidateInstanceIdentity:
          "value_valid_against_v3_candidate_instance_identity_schema",
        candidateInstanceIdentityBinding:
          "exact_recomputed_binding_of_embedded_candidate_identity",
        verifierSourceManifestBinding:
          "non-null_exact_bound_independent-verifier_source-manifest_binding",
        verifierToolchainManifestBinding:
          "non-null_exact_bound_independent-verifier_toolchain-manifest_binding_distinct_from_the_proof-kernel-toolchain",
        verifierExecutableBinding:
          "non-null_exact_bound_independent-verifier_executable_binding",
        verifierOciImageDigest:
          "non-null_exact_bound_linux_x86_64_verifier_OCI-image_digest",
        independentProofKernelBinding:
          "non-null_exact_bound_independent_complete_seed-v1_proof-kernel_binding_distinct_from_its_toolchain",
        independentProofKernelToolchainBinding:
          "non-null_exact_bound_independent_proof-kernel_toolchain",
        numericOperationGraphBinding:
          "exact_sealed_numeric_operation-graph_binding",
        postprojectionOperationGraphBinding:
          "exact_sealed_postprojection_operation-graph_binding",
        mpfrGmpRuntimeManifestBinding:
          "exact_prelaunch_MPFR-GMP_binary_ABI_version_and_expected-setting_manifest_binding_without_dynamic-conformance_claims",
        producerProjectionImplementation:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.producerProjectionImplementation,
        producerProjectionImplementationBinding:
          "exact_recomputed_static_binding_of_the_embedded_producer_implementation_value",
        verifierProjectionImplementation:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.verifierProjectionImplementation,
        verifierProjectionImplementationBinding:
          "exact_recomputed_static_binding_of_the_embedded_independent_verifier_implementation_value",
        implementationSeparationReceipt:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.implementationSeparationReceipt,
        implementationSeparationReceiptBinding:
          "exact_recomputed_positive_static_binding_of_the_embedded_separation_receipt",
        typedInterpreterBinding:
          "non-null_closed-schema_typed-interpreter_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        channelAssemblyStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        channelSealMonotonicNanoseconds: "canonical_unsigned_decimal",
      },
      crossFieldInvariants: [
        "schedulerLeaseBinding_and_sameAttemptId_equal_the_global_run;producerWorkerAttemptBinding_and_verifierWorkerAttemptBinding_are_distinct_stage-scoped_attempts_issued_under_it_and_recursively_equal_their_respective_ledger-envelope-E_lineages",
        "candidateInstanceIdentity_is_the_single_self-contained_owner_of_full-producer-E_S32-N32_and_S6-R6_values_and_bindings;the_channel_does_not_duplicate_those_large_values_as_siblings",
        "all_bindings_resolve_to_one_run_attempt_and_candidate identity recursively binds the same embedded common-request full-producer-enforcement and two composites",
        "the_channel_is_sealed_after_the_48-entry_verifier_input_ledger_and_before_launch-envelope_seal_and_contains_no_own_binding_launch-envelope_or_future_verifier evidence",
        "both_S32_and_S6_secure_composites_are_post-E_pre-verifier_closures_and_their_plain-hash_crosswalks_are_exact",
        "all_prelaunch_verifier-source-manifest_verifier-toolchain-manifest_verifier-executable_verifier-OCI-image_typed-interpreter_MPFR-GMP-manifest_projection-implementation_static-separation_operation-graph_independent-proof-kernel_and_proof-kernel-toolchain_inputs_are_non-null_closed_before_channel-seal_and_recursively_bind_the_same_common-run_policies_full-producer-E_and_candidate_identity;the_verifier-toolchain_and_proof-kernel-toolchain_are_distinct_bindings;dynamic_verifier_conformance_is_computed_only_after_start_before_P",
        "static_implementationSeparationReceipt_is_non-authoritative_and_does_not_replace_the_required_post-exit_same-attempt_brokerRuntimeSeparationReceipt",
        "candidate_P_N_F_values_or_bindings_are_absent_because_they_are_future_verifier_computations",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.verifier_prelaunch_context_rejection_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_verifier_prelaunch_context_rejection_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "disposition",
        "successorRunPlanBinding",
        "evidenceSchemaRegistryBinding",
        "commonRunRequestBindingOrNull",
        "sameAttemptIdOrNull",
        "schedulerLeaseBindingOrNull",
        "verifierWorkerAttemptBindingOrNull",
        "absoluteDeadlineReceiptBindingOrNull",
        "verifierQuotaSetupReceiptBindingOrNull",
        "verifierSeccompLoadReceiptBindingOrNull",
        "producerFullEnforcementReceiptBindingOrNull",
        "numericStaging32CompositeBindingOrNull",
        "rawEvidence6CompositeBindingOrNull",
        "candidateInstanceIdentityBindingOrNull",
        "verifierSourceManifestBindingOrNull",
        "verifierToolchainManifestBindingOrNull",
        "verifierExecutableBindingOrNull",
        "verifierOciImageDigestOrNull",
        "typedInterpreterBindingOrNull",
        "independentProofKernelBindingOrNull",
        "independentProofKernelToolchainBindingOrNull",
        "mpfrGmpRuntimeManifestBindingOrNull",
        "producerProjectionImplementationBindingOrNull",
        "verifierProjectionImplementationBindingOrNull",
        "implementationSeparationReceiptBindingOrNull",
        "attemptedVerifierInputLedgerBindingOrNull",
        "attemptedVerifierRuntimeChannelBindingOrNull",
        "attemptedVerifierLaunchEnvelopeBindingOrNull",
        "failureCode",
        "firstFailedContextField",
        "clockId",
        "contextEvaluationStartMonotonicNanoseconds",
        "rejectionReceiptCloseMonotonicNanoseconds",
        "verifierLaunchEnvelopeBinding",
        "compositeReplayBundleBinding",
        "verifierFullEnforcementReceiptBinding",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "assemblerLaunchEnvelopeBinding",
        "verifierLaunchAuthorized",
        "executionAuthorized",
        "registrationAllowed",
        "seedAdmissionGranted",
        "artifactAccepted",
        "scientificAdmissionGranted",
        "physicalAuthorityGranted",
        "propulsionAuthorityGranted",
        "transportAuthorityGranted",
        "validatedContextRequired",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_verifier_prelaunch_context_rejection/v1",
        disposition: "literal_broker_prelaunch_context_rejection",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        evidenceSchemaRegistryBinding:
          "exact_future_sealed_v3_registry_binding",
        commonRunRequestBindingOrNull:
          "exact_validated_common-request_binding_if_formed_before_failure_else_null",
        sameAttemptIdOrNull:
          "exact_scheduler-issued_global-attempt_identifier_if_formed_else_null",
        schedulerLeaseBindingOrNull:
          "exact_trusted_scheduler-lease_binding_if_formed_else_null",
        verifierWorkerAttemptBindingOrNull:
          "exact_stage-scoped_verifier-worker-attempt_binding_issued_under_schedulerLeaseBindingOrNull_and_sameAttemptIdOrNull_if_formed_else_null",
        absoluteDeadlineReceiptBindingOrNull:
          "exact_positive_absolute-deadline_receipt_binding_if_formed_else_null",
        verifierQuotaSetupReceiptBindingOrNull:
          "exact_positive_verifier-quota-setup_receipt_binding_if_formed_else_null",
        verifierSeccompLoadReceiptBindingOrNull:
          "exact_positive_verifier-seccomp-load_receipt_binding_if_formed_else_null",
        producerFullEnforcementReceiptBindingOrNull:
          "exact_positive_full-producer-E_binding_if_validated_before_failure_else_null",
        numericStaging32CompositeBindingOrNull:
          "exact_positive_S32-N32-composite_binding_if_validated_before_failure_else_null",
        rawEvidence6CompositeBindingOrNull:
          "exact_positive_S6-R6-composite_binding_if_validated_before_failure_else_null",
        candidateInstanceIdentityBindingOrNull:
          "exact_additive-v3_candidate-identity_binding_if_formed_and_validated_else_null",
        verifierSourceManifestBindingOrNull:
          "exact_independent-verifier_source-manifest_binding_if_validated_before_failure_else_null",
        verifierToolchainManifestBindingOrNull:
          "exact_independent-verifier_toolchain-manifest_binding_if_validated_before_failure_else_null_and_distinct_from_the_proof-kernel-toolchain",
        verifierExecutableBindingOrNull:
          "exact_independent-verifier_executable_binding_if_validated_before_failure_else_null",
        verifierOciImageDigestOrNull:
          "exact_linux_x86_64_verifier_OCI-image_digest_if_validated_before_failure_else_null",
        typedInterpreterBindingOrNull:
          "exact_closed-schema_typed-interpreter_binding_if_validated_before_failure_else_null",
        independentProofKernelBindingOrNull:
          "exact_independent_complete_seed-v1_proof-kernel_binding_if_validated_before_failure_else_null",
        independentProofKernelToolchainBindingOrNull:
          "exact_independent-proof-kernel-toolchain_binding_if_validated_before_failure_else_null",
        mpfrGmpRuntimeManifestBindingOrNull:
          "exact_prelaunch_MPFR-GMP-runtime-manifest_binding_if_validated_before_failure_else_null",
        producerProjectionImplementationBindingOrNull:
          "exact_static_producer-projection-implementation_binding_if_validated_before failure else null",
        verifierProjectionImplementationBindingOrNull:
          "exact_distinct_static_verifier-projection-implementation_binding_if_validated before failure else null",
        implementationSeparationReceiptBindingOrNull:
          "exact_positive_static-separation-receipt_binding_if_validated_before failure else null",
        attemptedVerifierInputLedgerBindingOrNull:
          "exact_closed_48-entry-ledger_binding_if_formation_reached_and_succeeded_else_null",
        attemptedVerifierRuntimeChannelBindingOrNull:
          "untrusted_attempted_channel-instance_binding_only_if_channel-formation_reached_else_null_never_launch-authoritative",
        attemptedVerifierLaunchEnvelopeBindingOrNull:
          "untrusted_attempted_launch-envelope-instance_binding_only_if_envelope-formation_reached_else_null_never_launch-authoritative;the_valid_verifierLaunchEnvelopeBinding_remains_null_on_every_rejection",
        failureCode: "one_literal_from_failureCodeEnum",
        firstFailedContextField: "one_literal_from_firstFailedContextFieldEnum",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        contextEvaluationStartMonotonicNanoseconds:
          "canonical_unsigned_decimal",
        rejectionReceiptCloseMonotonicNanoseconds: "canonical_unsigned_decimal",
        verifierLaunchEnvelopeBinding: "literal_null",
        compositeReplayBundleBinding: "literal_null",
        verifierFullEnforcementReceiptBinding: "literal_null",
        typedInterpreterValidationReceiptBinding: "literal_null",
        atomicNestedRegistrationReceiptBinding: "literal_null",
        assemblerLaunchEnvelopeBinding: "literal_null",
        verifierLaunchAuthorized: "literal_false",
        executionAuthorized: "literal_false",
        registrationAllowed: "literal_false",
        seedAdmissionGranted: "literal_false",
        artifactAccepted: "literal_false",
        scientificAdmissionGranted: "literal_false",
        physicalAuthorityGranted: "literal_false",
        propulsionAuthorityGranted: "literal_false",
        transportAuthorityGranted: "literal_false",
        validatedContextRequired: "literal_true",
        allPassed: "literal_false",
      },
      failureCodeEnum: [
        "common_run_request_or_policy_input_invalid",
        "producer_full_enforcement_missing_or_invalid",
        "numeric_staging32_composite_missing_or_invalid",
        "raw_evidence6_composite_missing_or_invalid",
        "candidate_instance_identity_missing_or_mixed",
        "verifier_source_toolchain_executable_or_oci_missing_or_invalid",
        "typed_interpreter_missing_or_invalid",
        "mpfr_gmp_runtime_manifest_missing_or_invalid",
        "proof_kernel_or_toolchain_missing_or_invalid",
        "static_implementation_or_separation_missing_or_invalid",
        "scheduler_lease_or_worker_attempt_missing_or_invalid",
        "deadline_quota_or_seccomp_prerequisite_missing_or_invalid",
        "verifier_input_ledger_formation_failed",
        "verifier_channel_formation_or_secure_observation_failed",
        "verifier_launch_envelope_formation_failed",
      ],
      firstFailedContextFieldEnum: [
        "commonRunRequestOrPolicyInputs",
        "producerFullEnforcementReceiptBinding",
        "numericStaging32CompositeBinding",
        "rawEvidence6CompositeBinding",
        "candidateInstanceIdentityBinding",
        "verifierSourceToolchainExecutableOrOciBinding",
        "typedInterpreterBinding",
        "mpfrGmpRuntimeManifestBinding",
        "independentProofKernelOrToolchainBinding",
        "staticImplementationOrSeparationBinding",
        "schedulerLeaseOrWorkerAttemptBinding",
        "deadlineQuotaOrSeccompPrerequisiteBinding",
        "verifierInputLedgerBinding",
        "verifierRuntimeChannelBindingOrObservation",
        "verifierLaunchEnvelopeBindingOrObservation",
      ],
      deterministicFailurePrecedence: [
        "common_run_request_or_policy_input_invalid",
        "scheduler_lease_or_worker_attempt_missing_or_invalid",
        "deadline_quota_or_seccomp_prerequisite_missing_or_invalid",
        "producer_full_enforcement_missing_or_invalid",
        "numeric_staging32_composite_missing_or_invalid",
        "raw_evidence6_composite_missing_or_invalid",
        "candidate_instance_identity_missing_or_mixed",
        "verifier_source_toolchain_executable_or_oci_missing_or_invalid",
        "typed_interpreter_missing_or_invalid",
        "mpfr_gmp_runtime_manifest_missing_or_invalid",
        "proof_kernel_or_toolchain_missing_or_invalid",
        "static_implementation_or_separation_missing_or_invalid",
        "verifier_input_ledger_formation_failed",
        "verifier_channel_formation_or_secure_observation_failed",
        "verifier_launch_envelope_formation_failed",
      ],
      crossFieldInvariants: [
        "failureCode_and_firstFailedContextField_are_the_same-index_semantic_pair_and_the_first_failure_is_selected_by_deterministicFailurePrecedence",
        "every_nullable_context_binding_is_non-null_only_if_that_dependency_was_schema-valid_domain-rehashed_same-attempt_and_completed_before_the_first failure;no later dependency may be non-null",
        "scheduler_lease_or_worker_attempt_missing_or_invalid_records_schedulerLeaseBindingOrNull_and_verifierWorkerAttemptBindingOrNull_independently_so_a_present_lease_with_missing_or_invalid_stage-attempt_is_not_collapsed_into_an_ambiguous_null pair",
        "proof_kernel_or_toolchain_missing_or_invalid_records_independentProofKernelBindingOrNull_and_independentProofKernelToolchainBindingOrNull_independently_and_never_treats_the_verifierToolchainManifestBindingOrNull_as_the_distinct_proof-kernel-toolchain",
        "validatedContextRequired_is_true_and_a_positive_verifier_launch_requires_non-null_schema-valid_same-attempt_source-manifest_toolchain-manifest_executable_OCI-image_typed-interpreter_independent-proof-kernel_and_proof-kernel-toolchain_bindings_in_addition_to_every_other_channel prerequisite",
        "contextEvaluationStart_is_not_after_rejectionReceiptClose_and_close_is_strictly_before_the_absolute-deadline_if_that_prerequisite_was formable",
        "no_valid_or_admitted_verifierLaunchEnvelopeBinding_composite_full-verifier-E_interpreter-registration_assembler-or-artifact evidence_exists_on_this branch;attemptedVerifierLaunchEnvelopeBindingOrNull_may_hold_only_an_untrusted_non-authoritative_attempt_on_the_exact_envelope-formation-failure_branch_and_can_never_authorize_launch",
        "this_schema_is_distinct_from_runtimeInstanceInterpretationRejection_which_handles_one_bounded asserted runtime object and from_the_postlaunch-formable_candidate-P-rejection subset",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.untrusted_candidate_P_wrapper_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_untrusted_candidate_P_wrapper_schema/v1",
    importedExactCandidatePSchema:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
    importedExactCandidatePSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "wrapperDisposition",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "candidateInstanceIdentityBinding",
        "verifierStageRuntimeConformance",
        "verifierStageRuntimeConformanceBinding",
        "candidateP",
        "candidatePReceiptInstanceBinding",
        "brokerSameAttemptEstablished",
        "runtimeIsolationEstablished",
        "authoritativeRegistrationAllowed",
        "scientificAdmissionGranted",
        "seedAdmissionGranted",
        "artifactAdmissionGranted",
        "acceptedOnlyAsUntrustedCandidateEvidence",
        "wrapperValidated",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_untrusted_candidate_P_wrapper/v1",
        wrapperDisposition: "literal_match_or_postlaunch_formable_rejection",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        candidateInstanceIdentityBinding:
          "exact_additive-v3_candidate-instance-identity_binding_from_the_verifier-channel_not_the_compact_sealed-postpolicy_identity binding",
        verifierStageRuntimeConformance:
          "exact_value_valid_against_v3_stageRuntimeConformance_for_the_verifier_attempt;conformant_when_candidateP_matches_and_for_every_non-runtime candidateP rejection;typed_rejection_if-and-only-if_candidateP.failureCode_is_runtime_binding_mismatch",
        verifierStageRuntimeConformanceBinding:
          "exact_recomputed_binding_of_the_embedded_stage-runtime-conformance_wrapper",
        candidateP:
          "exact_value_valid_against_the_imported_sealed_postprojection_match-or-rejection_schema",
        candidatePReceiptInstanceBinding:
          "exact_recomputed_binding_under_the_imported_candidate-P_receiptInstanceBindingPolicy_for_candidateP",
        brokerSameAttemptEstablished: "literal_false",
        runtimeIsolationEstablished: "literal_false",
        authoritativeRegistrationAllowed: "literal_false",
        scientificAdmissionGranted: "literal_false",
        seedAdmissionGranted: "literal_false",
        artifactAdmissionGranted: "literal_false",
        acceptedOnlyAsUntrustedCandidateEvidence: "literal_true",
        wrapperValidated: "literal_true",
      },
      wrapperDispositionProfiles: {
        match: {
          candidatePOutcome: "match",
          verifierStageRuntimeConformanceDisposition: "conformant",
          allSealedCandidatePMatchDependenciesNonNullAndEqualChannel: true,
          candidatePCompactIdentityBridge:
            "candidateP.candidateInstanceIdentity_and_candidateInstanceIdentityBinding_equal_channel.candidateInstanceIdentity.sealedPostpolicyCandidateInstanceIdentity_and_binding",
        },
        postlaunch_formable_rejection: {
          candidatePOutcome: "rejection",
          verifierStageRuntimeConformanceDisposition:
            "conformant_for_every_candidateP_failureCode_except_runtime_binding_mismatch;rejection_exactly_for_runtime_binding_mismatch",
          runtimeRejectionIffCandidatePFailureCode: "runtime_binding_mismatch",
          successorRunPlanBindingOrNull: "non-null_exact_v3",
          candidateInstanceIdentityOrNull:
            "non-null_exact_channel_identity_nested_sealedPostpolicyCandidateInstanceIdentity_value",
          candidateInstanceIdentityBindingOrNull:
            "non-null_exact_channel_identity_nested_sealedPostpolicyCandidateInstanceIdentityBinding",
          numericStaging32RuntimeClosureBindingOrNull:
            "non-null_exact_prevalidated_channel_projection",
          rawEvidenceRuntimeClosureBindingOrNull:
            "non-null_exact_prevalidated_channel_projection",
          attemptedProducerProjectionImplementationBindingOrNull: "non-null",
          attemptedVerifierProjectionImplementationBindingOrNull: "non-null",
          attemptedImplementationSeparationReceiptBindingOrNull: "non-null",
          attemptedMpfrGmpRuntimeBindingOrNull:
            "non-null_exact_inner_binding_or_null_only_with_formable_stage-runtime-conformance_rejection",
          candidatePCompactIdentityBridge:
            "candidateP.candidateInstanceIdentityOrNull_and_binding_equal_channel.candidateInstanceIdentity.sealedPostpolicyCandidateInstanceIdentity_and_binding",
        },
      },
      crossFieldInvariants: [
        "candidateP_preserves_every_exact_match-or-rejection_key_and_all_six_sealed_authority_flags_literal_false_without_projection_renaming_or_omission",
        "wrapper.candidateInstanceIdentityBinding_equals_the_channel_additive-v3_candidateInstanceIdentity_binding;on_match_candidateP.candidateInstanceIdentity_and_candidateInstanceIdentityBinding_equal_the_channel_identity's_nested_sealedPostpolicyCandidateInstanceIdentity_value-and-binding;on_postlaunch-formable-rejection_the_sealed_OrNull fields_are_non-null_and_equal_that_same_nested_compact_value-and-binding",
        "the_additive-v3_candidate-identity_domain-and-binding_and_the_compact-sealed-postpolicy_candidate-identity_domain-and-binding_are_distinct_and_neither_digest_may_be_substituted_for_the_other",
        "the_wrapper_common-request_successor-run_runtime-conformance_and_receipt-instance bindings recursively equal candidateP and the preexisting verifier context;for candidateP match candidateP.mpfrGmpRuntimeBinding equals verifierStageRuntimeConformance.innerMpfrGmpRuntimeConformanceReceiptBindingOrNull and runtime disposition is conformant",
        "verifierStageRuntimeConformance.disposition_is_conformant_for_candidateP_match_and_for_every_postlaunch-formable_candidateP_rejection_except_failureCode_runtime_binding_mismatch;it_is_rejection_if-and-only-if_candidateP.failureCode_is_runtime_binding_mismatch_with_attemptedMpfrGmpRuntimeBindingOrNull_equal_to_the_wrapper_attempted-inner-binding_or_null_and_that_branch_short-circuits_N_and_gate-evidence",
        "the_postlaunch_formable_rejection_profile_covers_only_failures_after_a_schema-valid_prevalidated_channel_and_launch;missing_or_invalid_run_policy_Eprod_S32_S6_identity_scheduler-attempt_deadline-quota-seccomp_source-manifest_verifier-toolchain_executable_OCI-image_typed-interpreter_MPFR-GMP-runtime-manifest_actual-proof-kernel_proof-kernel-toolchain_static-implementation_static-separation_ledger_channel-or-envelope evidence_is_a_broker_prelaunch_rejection_with_no_verifier_composite_or_full-verifier-E",
        "this_wrapper_binding_is_untrusted_candidate_evidence_only;the_later_registered_positive-P_node_is_a_distinct_postexit_postprojection-acceptance_receipt",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.candidate_full_seed_gate_evidence_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_candidate_full_seed_gate_evidence_schema/v1",
    importedExactSeedDescriptorSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    importedExactValueSchemas: {
      observedArrayInventory:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.arrayInventory,
      scalarMetadata:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.scalarMetadata,
      serverRecomputedGateReport:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.serverRecomputedGateReport,
      continuousNodelessProofReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.continuousNodelessProofReceipt,
      numericalOriginSeriesDefectReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.numericalOriginSeriesDefectReceipt,
      continuousPeakProofReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA
          .topLevel.fields.continuousPeakProofReceipt,
    },
    discriminator: "disposition",
    exactKeys: [
      "schemaVersion",
      "disposition",
      "successorRunPlanBinding",
      "commonRunRequestBinding",
      "candidateInstanceIdentityBinding",
      "candidatePWrapperBinding",
      "candidateNWrapperBinding",
      "verifierStageRuntimeConformanceBinding",
      "observedArrayInventory",
      "scalarMetadataOrNull",
      "serverRecomputedGateReportOrNull",
      "continuousNodelessProofReceiptOrNull",
      "numericalOriginSeriesDefectReceiptOrNull",
      "continuousPeakProofReceiptOrNull",
      "postprojectionAcceptanceReceiptBinding",
      "rejectionCodeOrNull",
      "gateEvidenceComplete",
      "seedAdmissionGranted",
      "artifactAccepted",
      "authoritativeAdmissionGranted",
    ],
    extraKeysAllowed: false,
    fields: {
      schemaVersion:
        "literal_nhm2_prolate_boson_star_newtonian_seed_v3_candidate_full_seed_gate_evidence/v1",
      disposition: "literal_gate_evidence_complete_or_rejection",
      successorRunPlanBinding: "exact_future_sealed_v3_binding",
      commonRunRequestBinding: "exact_same_common_request_binding",
      candidateInstanceIdentityBinding: "exact_same_candidate_identity_binding",
      candidatePWrapperBinding:
        "exact_positive-untrusted-P_wrapper_binding_for_the_same_composite",
      candidateNWrapperBinding:
        "exact_positive-N_wrapper_binding_for_the_same_composite",
      verifierStageRuntimeConformanceBinding:
        "exact_same_attempt-scoped_wrapper_binding_as_candidate-P-and-N",
      observedArrayInventory:
        "exact_value_valid_against_the_imported_seed-v1_output_descriptor_arrayInventory_field_schema_and_cross-bound_to_N32",
      scalarMetadataOrNull:
        "exact_value_valid_against_the_imported_seed-v1_scalarMetadata_field_schema_for_gate-evidence-complete_or_null_only_when_a_closed_prerequisite_failure_prevents_its_valid_formation",
      serverRecomputedGateReportOrNull:
        "non-null_only_for_gate-evidence-complete_and_exact_value_valid_against_the_imported_seed-v1_serverRecomputedGateReport_field_schema",
      continuousNodelessProofReceiptOrNull:
        "non-null_only_for_gate-evidence-complete_and_exact_value_valid_against_the_imported_seed-v1_continuousNodelessProofReceipt_field_schema",
      numericalOriginSeriesDefectReceiptOrNull:
        "non-null_only_for_gate-evidence-complete_and_exact_value_valid_against_the_imported_seed-v1_numericalOriginSeriesDefectReceipt_field_schema_without_claiming_exact_origin_regularity",
      continuousPeakProofReceiptOrNull:
        "non-null_only_for_gate-evidence-complete_and_exact_value_valid_against_the_imported_seed-v1_continuousPeakProofReceipt_field_schema",
      postprojectionAcceptanceReceiptBinding:
        "literal_null_because_candidate-P_is_untrusted_and_post-exit_interpretation_is_required",
      rejectionCodeOrNull:
        "null_for_gate-evidence-complete_or_one_closed_typed_rejection_code",
      gateEvidenceComplete:
        "literal_true_only_for_gate-evidence-complete_else_false",
      seedAdmissionGranted: "literal_false",
      artifactAccepted: "literal_false",
      authoritativeAdmissionGranted: "literal_false",
    },
    rejectionCodeEnum: [
      "complete_seed_v1_gate_report_missing_or_rejected",
      "continuous_nodeless_proof_missing_or_rejected",
      "numerical_origin_series_defect_receipt_missing_or_rejected",
      "continuous_peak_proof_receipt_missing_or_rejected",
      "scalar_metadata_prerequisite_missing_or_rejected",
      "candidate_identity_or_dependency_mismatch",
    ],
    dispositionProfiles: {
      gate_evidence_complete: {
        allFourGateEvidenceValuesNonNull: true,
        scalarMetadataOrNull: "non-null",
        rejectionCodeOrNull: null,
        postprojectionAcceptanceReceiptBinding: null,
        gateEvidenceComplete: true,
        seedAdmissionGranted: false,
        artifactAccepted: false,
        authoritativeAdmissionGranted: false,
      },
      rejection: {
        atLeastOneGateEvidenceValueNullOrRejected: true,
        scalarMetadataOrNull:
          "non-null_if_all_prerequisites_allow_valid_formation_else_null",
        scalarMetadataNullRequiresFailureCode:
          "scalar_metadata_prerequisite_missing_or_rejected_or_the_first_closed_prerequisite_failure_code",
        rejectionCodeMustBeOneClosedEnumValue: true,
        postprojectionAcceptanceReceiptBinding: null,
        gateEvidenceComplete: false,
        seedAdmissionGranted: false,
        artifactAccepted: false,
        authoritativeAdmissionGranted: false,
      },
    },
    crossFieldInvariants: [
      "the_pre-exit_value_is_candidate_gate_evidence_only_even_when_gate-report_nodeless_numerical-origin-defect_and_peak_values_are_present;it_cannot_claim_full-seed_duty_completion_without_post-exit_authoritative_postprojection_acceptance",
      "observedArrayInventory_scalarMetadataOrNull_and_all_four_verifier-generated_gate-or-proof_values_are_self-contained_in_the_single_composite_file_and_covered_by_the_one_candidate-full-seed-gate-evidence_wrapper_binding;binding-only_evidence_is_forbidden",
      "observedArrayInventory_scalarMetadata_and_all_four_verifier-generated_values_cross-bind_the_same_N32_array-hashes_continuum_source common-run_candidate-identity_and_positive-N_wrapper;A0_rhoPeak0_xPeak0_a1_Vc_C0_and_N_cross-invariants_resolve_without_duplicating_the_positive-N_representative-tuple_or_match-payload",
      "continuousNodelessProofReceiptOrNull.proofKernelBinding_numericalOriginSeriesDefectReceiptOrNull.proofKernelBinding_and_continuousPeakProofReceiptOrNull.proofKernelBinding_are_equal_for_every_formable_non-null_value_in_both_complete-and-rejection profiles and equal_the_preexisting_channel.independentProofKernelBinding_and_launchEnvelope.independentProofKernelBindingOrNull;these_actual-kernel_bindings_must_never_equal_or_substitute_for_independentProofKernelToolchainBinding_and_the_pre-exit_gate-evidence_contains_no_future_fullVerifierE reference",
      "rejection_is_typed_untrusted_candidate_evidence_and_never_grants_seed_artifact_scientific_physical_propulsion_or_transport_authority",
    ],
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.candidate_N_wrapper_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_candidate_N_wrapper_schema/v1",
    importedExactSchemas: {
      numericRejection:
        IMPORTED_NUMERIC_VERIFIER_DAG
          .numericMaterializationMatchOrRejectionSchema.rejection,
      positiveNumericReplayBundle:
        IMPORTED_NUMERIC_VERIFIER_DAG.verifierNumericMaterializationReplayBundleSchema,
      multipolePassThroughValidationReceipt:
        IMPORTED_NUMERIC_VERIFIER_DAG.multipolePassThroughValidationReceiptSchema,
      continuousNodelessProofCoreResult:
        IMPORTED_NUMERIC_VERIFIER_DAG.continuousNodelessProofCoreResultSchema,
      exteriorHLowerBoundEvidence:
        IMPORTED_NUMERIC_VERIFIER_DAG.exteriorHLowerBoundEvidenceSchema,
    },
    discriminator: "disposition",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "disposition",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "candidateInstanceIdentityBinding",
        "verifierStageRuntimeConformanceBinding",
        "numericRejectionOrNull",
        "positiveNumericReplayBundleOrNull",
        "positiveNumericReplayBundleBindingOrNull",
        "multipolePassThroughValidationReceiptOrNull",
        "multipolePassThroughValidationReceiptBindingOrNull",
        "exteriorHLowerBoundEvidenceOrNull",
        "exteriorHLowerBoundEvidenceBindingOrNull",
        "continuousNodelessProofCoreResultOrNull",
        "continuousNodelessProofCoreResultBindingOrNull",
        "wrapperPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_candidate_N_wrapper/v1",
        disposition: "literal_positive_match_or_rejection",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        candidateInstanceIdentityBinding:
          "exact_same_v3_candidate-instance-identity_binding",
        verifierStageRuntimeConformanceBinding:
          "exact_same_attempt-scoped_binding_as_the_preceding_candidate-P_wrapper",
        numericRejectionOrNull:
          "non-null_exact_imported_numeric-rejection_value_only_for_rejection;the_sealed_rejectionBinding_is_literal_null_and_is_not_invented_here",
        positiveNumericReplayBundleOrNull:
          "non-null_exact_imported_positive-numeric-replay value_only_for_positive-match_and_the_sole_tuple-bearing_object",
        positiveNumericReplayBundleBindingOrNull:
          "non-null_exact_recomputed_imported_positive binding_only_for_positive-match",
        multipolePassThroughValidationReceiptOrNull:
          "non-null_exact_imported_value_only_for_positive-match",
        multipolePassThroughValidationReceiptBindingOrNull:
          "non-null_exact_recomputed_imported_binding_only_with_the_value",
        exteriorHLowerBoundEvidenceOrNull:
          "non-null_exact_imported_value_only_for_positive-match",
        exteriorHLowerBoundEvidenceBindingOrNull:
          "non-null_exact_recomputed_imported_binding_only_with_the_value",
        continuousNodelessProofCoreResultOrNull:
          "non-null_exact_imported_value_only_for_positive-match",
        continuousNodelessProofCoreResultBindingOrNull:
          "non-null_exact_recomputed_imported_binding_only_with_the_value",
        wrapperPassed:
          "literal_true_for_positive-match_and_literal_false_for_rejection",
      },
      forbiddenKeys: [
        "representativeTuple",
        "representativeTupleSha256",
        "representativeContinuumSha256",
        "separateNumericMaterializationMatch",
        "separateNumericMaterializationMatchBinding",
      ],
      dispositionProfiles: {
        positive_match: {
          numericRejectionOrNull: null,
          positiveNumericReplayBundleOrNull: "non-null",
          positiveNumericReplayBundleBindingOrNull: "non-null",
          allThreeAuxiliaryValuesAndBindingsNonNull: true,
          numericStagingBridge:
            "positiveNumericReplayBundleOrNull.stagingBinding_and_its_nested_numericMaterializationMatch.stagingBinding_both_equal_channel_candidateIdentity.numericStaging32Composite.numericPolicyN32ManifestBinding",
          wrapperPassed: true,
        },
        rejection: {
          numericRejectionOrNull: "non-null_exact_sealed_rejection_value",
          positiveNumericReplayBundleOrNull: null,
          positiveNumericReplayBundleBindingOrNull: null,
          allThreeAuxiliaryValuesAndBindingsNull: true,
          wrapperPassed: false,
          sealedNumericRejectionBinding: null,
          numericStagingBridge:
            "numericRejectionOrNull.stagingBindingOrNull_equals_channel_candidateIdentity.numericStaging32Composite.numericPolicyN32ManifestBinding_when_formable_and_is_null_only_under_the_exact_sealed_unformable-rule",
        },
      },
      crossFieldInvariants: [
        "positive-match_embeds_the_actual_replay_and_three_actual_auxiliary_values;their_recomputed_bindings_equal_the_validationReceiptBinding_exteriorHLowerBoundEvidenceBinding_and_nodelessProofCoreBinding_named_by_the_same_replay",
        "positive-match_recursively_binds_one_policy_operation-graph_staging_proof-kernel_common-run_candidate-identity_runtime-conformance_and_source-L2_hash_pair",
        "the_only_imported-N_fields_named_proofKernelBinding_are_exteriorHLowerBoundEvidenceOrNull.proofKernelBinding_and_continuousNodelessProofCoreResultOrNull.proofKernelBinding;both_mean_the_independent-proof-kernel-toolchain_binding_and_equal_the_preexisting_channel.independentProofKernelToolchainBinding_and_launchEnvelope.independentProofKernelToolchainBindingOrNull;positiveNumericReplayBundleOrNull_and_multipolePassThroughValidationReceiptOrNull_have_no_such_field_and_bind_those_sibling_values_only_through_their_exact_evidence-binding fields;the_toolchain_binding_must_not_equal_or_substitute_for_the_distinct_actual-kernel channel.independentProofKernelBinding_or_launchEnvelope.independentProofKernelBindingOrNull_and_the_pre-exit_N-wrapper_contains_no_future_fullVerifierE reference",
        "positiveNumericReplayBundleOrNull.stagingBinding_and_its_nested_numericMaterializationMatch.stagingBinding_equal_the_numericPolicyN32ManifestBinding_nested_in_the_channel_additive_candidateIdentity.numericStaging32Composite;the_outer_v3_candidate-identity_runtime-and-common-run_bindings_are_context_and_are_not_invented_as_fields_inside_the_sealed_N_value",
        "for_rejection_numericRejectionOrNull.stagingBindingOrNull_equals_that_same_nested_N32-manifest_binding_whenever_the_sealed_rejection_is_formable_and_may_be_null_only_when_the_exact_sealed_numeric-rejection_schema_declares_the_staging_binding_unformable",
        "substituting_a_different_N32_manifest_or_stagingBinding_under_a_fixed_outer_candidateInstanceIdentityBinding_is_a_typed_hard_candidate-mixing_rejection",
        "the_wrapper_has_one_additive_v3_binding_in_both_variants_but_never_presents_that_wrapper_binding_as_the_absent_sealed_numeric-rejection_binding",
        "no_wrapper-level_representative-tuple_tuple-hash_continuum-hash_or_separate-positive-match_field_is_allowed;the_nested_positiveNumericReplayBundleOrNull_is_the_sole_tuple-and-match carrier",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.composite_replay_bundle_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_composite_replay_bundle_schema/v1",
    importedExactCandidateSchemas: {
      candidatePPostprojectionMatchOrRejection:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
      candidatePPostprojectionSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
      candidateNNumericMatchOrRejection:
        IMPORTED_NUMERIC_VERIFIER_DAG.numericMaterializationMatchOrRejectionSchema,
      positiveCandidateNNumericReplayBundle:
        IMPORTED_NUMERIC_VERIFIER_DAG.verifierNumericMaterializationReplayBundleSchema,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "verifierLaunchEnvelopeBinding",
        "producerFullEnforcementReceiptBinding",
        "candidateInstanceIdentityBinding",
        "postprojectionPolicyBinding",
        "numericMaterializationPolicyBinding",
        "candidatePWrapper",
        "candidatePWrapperBinding",
        "candidateNWrapperOrNull",
        "candidateNWrapperBindingOrNull",
        "candidateFullSeedGateEvidenceOrNull",
        "candidateFullSeedGateEvidenceBindingOrNull",
        "outcome",
        "dependencyOrder",
        "closedBeforeVerifierExit",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_composite_replay_bundle/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier_attempt",
        verifierLaunchEnvelopeBinding:
          "exact_preexisting_verifier_launch_envelope_binding",
        producerFullEnforcementReceiptBinding:
          "exact_binding_recursively_named_by_candidate_identity",
        candidateInstanceIdentityBinding: "exact_v3_candidate_identity_binding",
        postprojectionPolicyBinding:
          "exact_sealed_postprojection_policy_binding",
        numericMaterializationPolicyBinding:
          "exact_sealed_numeric_policy_binding",
        candidatePWrapper:
          "exact_value_valid_against_v3_untrusted-candidate-P-wrapper_with_the_raw_imported_P_value_nested_and_all_authority_flags_false",
        candidatePWrapperBinding:
          "exact_recomputed_v3_wrapper_binding_not_an_authoritative_postprojection-acceptance_binding",
        candidateNWrapperOrNull:
          "null_if_P_rejects_else_one_exact_value_valid_against_v3_candidate-N-wrapper_rejection-or-positive-match_schema",
        candidateNWrapperBindingOrNull:
          "null_with_the_value_else_exact_recomputed_additive_wrapper_binding_including_for_numeric-rejection_without_inventing_a_sealed_rejection_binding",
        candidateFullSeedGateEvidenceOrNull:
          "non-null_only_after_positive-N_and_exact_value_valid_against_v3_candidate-full-seed-gate-evidence_schema",
        candidateFullSeedGateEvidenceBindingOrNull:
          "null_unless_candidate-gate-evidence_is_present_else_exact_recomputed_binding",
        outcome:
          "exact_closed_enum_P_rejection_or_P_match_N_rejection_or_PN_match_gate_evidence_rejection_or_PN_match_gate_evidence_complete",
        dependencyOrder: "literal_tuple_[P,N,gate_evidence]",
        closedBeforeVerifierExit: "literal_true",
      },
      forbiddenTopLevelKeys: [
        "representativeTuple",
        "representativeTupleSha256",
        "representativeContinuumSha256",
        "numericMaterializationMatch",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
      ],
      outcomeProfiles: {
        P_rejection: {
          candidatePWrapperDisposition: "postlaunch_formable_rejection",
          candidateNWrapperOrNull: null,
          candidateNWrapperBindingOrNull: null,
          candidateFullSeedGateEvidenceOrNull: null,
          candidateFullSeedGateEvidenceBindingOrNull: null,
        },
        P_match_N_rejection: {
          candidatePWrapperDisposition: "match",
          candidateNWrapperOrNull: "non-null_rejection",
          candidateNWrapperBindingOrNull: "non-null_additive_wrapper_binding",
          candidateFullSeedGateEvidenceOrNull: null,
          candidateFullSeedGateEvidenceBindingOrNull: null,
        },
        PN_match_gate_evidence_rejection: {
          candidatePWrapperDisposition: "match",
          candidateNWrapperOrNull: "non-null_positive_match",
          candidateNWrapperBindingOrNull: "non-null",
          candidateFullSeedGateEvidenceOrNull: "non-null_rejection",
          candidateFullSeedGateEvidenceBindingOrNull: "non-null",
        },
        PN_match_gate_evidence_complete: {
          candidatePWrapperDisposition: "match",
          candidateNWrapperOrNull: "non-null_positive_match",
          candidateNWrapperBindingOrNull: "non-null",
          candidateFullSeedGateEvidenceOrNull:
            "non-null_gate_evidence_complete",
          candidateFullSeedGateEvidenceBindingOrNull: "non-null",
        },
      },
      crossFieldInvariants: [
        "candidate_P_is_computed_first;candidate_N_is_computed_only_after_positive_P;candidate_gate-evidence_is_computed_only_after_positive_N;rejection_short-circuits_all_later_values_and_bindings",
        "P-match_N-rejection_has_one_non-null_additive_N-wrapper_which_embeds_the_typed_sealed_N-rejection_value_but_does_not_invent_a_sealed_N-rejection_binding;gate-evidence_is_exactly_absent",
        "the_positive_N-wrapper's_nested_imported_replay_is_the_sole_representative-tuple-bearing_and_positive-N-match_object;the_outer_composite_duplicates_no_tuple_tuple-hash_continuum-hash_or_positive-match_payload",
        "within_the_postlaunch_schema-valid_channel_subset_all_four_outcome_profiles_exhaustively_fix_candidate-P-wrapper_disposition_and_every_nullable_N-and-gate-evidence_value-and-binding;prelaunch_context_failures_have_no_composite_and_no_mixed_or_unlisted_variant_is_valid",
        "all_nested_values_bind_one_candidate_identity_common-request_run_attempt_and_frozen_policy_pair;mixing_candidates_is_a_typed_hard_rejection",
        "candidate-P_N_and_gate-evidence_recursively_bind_candidatePWrapper.verifierStageRuntimeConformanceBinding_whose_conformant_innerMpfrGmpRuntimeConformanceReceiptBindingOrNull_was_computed_after-start-before-P;the_inner_receipt_is_not_a_prelaunch_or_canary-only_authority_claim_and_the_pre-exit_composite_contains_no_future_full-verifier-E reference",
        "the_bundle_is_the_verifier's_exactly_one_closed_output_file_and_contains_no_future_full-verifier-enforcement_separation_interpreter_registration_or_assembler_evidence",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_CLOSED_OUTPUT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.verifier_closed_output_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_verifier_closed_output_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "verifierLaunchEnvelopeBinding",
        "clockId",
        "verifierExitMonotonicNanoseconds",
        "verifierCgroupEmptyMonotonicNanoseconds",
        "observationMonotonicNanoseconds",
        "replayRootPostStateObservation",
        "replayRootPostStateObservationBinding",
        "replayRootRecursiveEntryCount",
        "compositeReplayBundleObservation",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_verifier_closed_output/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier_attempt",
        verifierLaunchEnvelopeBinding:
          "exact_preexisting_verifier_launch_envelope_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        verifierExitMonotonicNanoseconds: "canonical_unsigned_decimal",
        verifierCgroupEmptyMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationMonotonicNanoseconds: "canonical_unsigned_decimal",
        replayRootPostStateObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_REPLAY_ROOT_POST_STATE_SCHEMA,
        replayRootPostStateObservationBinding:
          "exact_recomputed_binding_of_the_replay-root_post-state_observation",
        replayRootRecursiveEntryCount: "literal_1",
        compositeReplayBundleObservation:
          "importedV2.schemas.fileObservation_at_exact_composite_replay_path",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "the_composite_bundle_was_closed_and_file-fsynced_and_the_replay_directory_fsynced_before_verifier_exit",
        "verifierExit_is_not_after_cgroupEmpty_is_not_after_observation_and_all_are_before_the_absolute_deadline",
        "replay_root_contains_exactly_one_regular_single-link_file_at_the_composite_path_and_no_standalone_P_N_F_summary_descriptor_or_extra",
        "replayRootPostStateObservation_listingSha256_and_entry_count_cross-bind_one-to-one_to_compositeReplayBundleObservation_path_identity_size_and_plain-hash",
        "this_observation_contains_no_future_full-verifier-enforcement_receipt_binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_VERIFIER_ENFORCEMENT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.full_verifier_enforcement_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_full_verifier_enforcement_schema/v1",
    intentionallyDoesNotReuse:
      "v1_or_v2_stageEnforcementReceipt_instance_schema_or_its_base8_plus32_verifier_work_invariant",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "commonRunRequestBinding",
        "stageId",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "verifierWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "inputLedgerBinding",
        "launchEnvelopeBinding",
        "quotaCapabilityBinding",
        "quotaSetupReceiptBinding",
        "seccompPolicyBinding",
        "seccompLoadReceiptBinding",
        "sourceManifestBinding",
        "toolchainManifestBinding",
        "verifierExecutableBinding",
        "proofKernelBinding",
        "independentProofKernelToolchainBinding",
        "typedInterpreterBinding",
        "numericOperationGraphBinding",
        "postprojectionOperationGraphBinding",
        "mpfrGmpRuntimeManifestBinding",
        "verifierStageRuntimeConformanceBinding",
        "producerProjectionImplementationBinding",
        "verifierProjectionImplementationBinding",
        "implementationSeparationReceiptBinding",
        "ociImageDigest",
        "genericControlEvidence",
        "genericControlEvidenceBinding",
        "channelInstanceBinding",
        "channelLaunchObservationBinding",
        "channelPreExecObservationBinding",
        "channelBootstrapReadObservationBinding",
        "channelPostExitObservationBinding",
        "numericS32LaunchObservationBinding",
        "numericS32PreExecObservationBinding",
        "numericS32BootstrapReadObservationBinding",
        "numericS32PostExitObservationBinding",
        "rawS6LaunchObservationBinding",
        "rawS6PreExecObservationBinding",
        "rawS6BootstrapReadObservationBinding",
        "rawS6PostExitObservationBinding",
        "verifierClosedOutputObservationBinding",
        "compositeReplayBundleBinding",
        "clockId",
        "channelPreExecRevalidationMonotonicNanoseconds",
        "monotonicStartNanoseconds",
        "bootstrapReadMonotonicNanoseconds",
        "monotonicEndNanoseconds",
        "postExitObservationMonotonicNanoseconds",
        "exitCode",
        "cgroupPopulatedZero",
        "channelWriterOrWritableAliasCount",
        "channelNamespaceMutationCount",
        "numericRootWriterOrWritableAliasCount",
        "numericRootNamespaceMutationCount",
        "rawRootWriterOrWritableAliasCount",
        "rawRootNamespaceMutationCount",
        "bothEvidenceMountsReadOnlyThroughCgroupEmpty",
        "networkDenied",
        "quotaAndDeadlinePassed",
        "singleCompositeOutputLifecyclePassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_full_verifier_enforcement/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        stageId: "literal_trusted_independent_verifier",
        sameAttemptId:
          "exact_same_attempt_across_channel_ledger_envelope_and_output",
        schedulerLeaseBinding:
          "trusted_scheduler_lease_binding_issuing_the_same_worker-attempt_identity",
        verifierWorkerAttemptBinding:
          "trusted_worker-attempt_binding_recursively_equal_to_the_verifier_launch_and_full-producer_lineage",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive_v3_five_root_preparation_receipt_binding",
        inputLedgerBinding: "exact_v3_48-entry_verifier_input_ledger_binding",
        launchEnvelopeBinding: "exact_v3_verifier_launch_envelope_binding",
        quotaCapabilityBinding: "bound_verifier_quota_capability",
        quotaSetupReceiptBinding:
          "positive_prelaunch_verifier_quota_setup_receipt",
        seccompPolicyBinding: "bound_verifier_seccomp_policy",
        seccompLoadReceiptBinding:
          "positive_preexec_verifier_seccomp_load_receipt",
        sourceManifestBinding: "bound_independent_verifier_source_manifest",
        toolchainManifestBinding:
          "bound_independent_verifier_toolchain_manifest",
        verifierExecutableBinding:
          "exact_bound_independent-verifier_executable_binding_available_before_launch",
        proofKernelBinding:
          "exact_independent_complete_seed-v1_proof-kernel_binding_available_before_launch_and_recursively_equal_to_channel.independentProofKernelBinding_and_launchEnvelope.independentProofKernelBindingOrNull",
        independentProofKernelToolchainBinding:
          "bound_independent_proof-kernel_toolchain_available_before_verifier_launch",
        typedInterpreterBinding:
          "exact_closed-schema_typed-interpreter_binding_available_before_verifier_launch",
        numericOperationGraphBinding:
          "exact_sealed_numeric_materialization_operation-graph_binding",
        postprojectionOperationGraphBinding:
          "exact_sealed_postprojection_operation-graph_binding",
        mpfrGmpRuntimeManifestBinding:
          "exact_prelaunch_MPFR-GMP_binary_ABI_and_expected-setting_manifest_binding",
        verifierStageRuntimeConformanceBinding:
          "exact_v3_stage-runtime-conformance_wrapper_binding_recursively_equal_to_the_candidate-P-wrapper_and_verifierWorkerAttemptBinding;may_be_typed_rejection_only_when_N_and_gate-evidence_are_absent_and_transport-enforcement_remains_positive",
        producerProjectionImplementationBinding:
          "exact_static_binding_valid_against_sealed_postpolicy_producerProjectionImplementation_schema",
        verifierProjectionImplementationBinding:
          "exact_different_static_binding_valid_against_sealed_postpolicy_verifierProjectionImplementation_schema",
        implementationSeparationReceiptBinding:
          "exact_positive_static_binding_valid_against_sealed_postpolicy_implementationSeparationReceipt_schema",
        ociImageDigest: "exact_bound_linux_x86_64_oci_image_digest",
        genericControlEvidence:
          "exact_value_valid_against_v3_genericStageControlEvidence_with_all_memory_OOM_pids_seccomp_capability_source-toolchain-ledger_capture_mount-project_quota-inode_RLIMIT_deadline_exit_timeout-kill_cgroup_output-and-fsync_fields",
        genericControlEvidenceBinding:
          "exact_recomputed_binding_of_genericControlEvidence",
        channelInstanceBinding:
          "exact_launched_verifier_channel_instance_binding",
        channelLaunchObservationBinding:
          "exact_observation_bound_by_the_launch_envelope",
        channelPreExecObservationBinding:
          "fresh_preexec_recursive_equal_observation",
        channelBootstrapReadObservationBinding:
          "fresh_bootstrap-first-read_recursive_equal_observation",
        channelPostExitObservationBinding:
          "fresh_postexit_before-unmount_recursive_equal_observation",
        numericS32LaunchObservationBinding:
          "exact_read-only_S32_mount_observation_bound_by_launch_envelope",
        numericS32PreExecObservationBinding:
          "fresh_preexec_recursive_equal_S32_root_and_32-file_observation",
        numericS32BootstrapReadObservationBinding:
          "fresh_bootstrap-first-read_recursive_equal_S32_observation",
        numericS32PostExitObservationBinding:
          "fresh_postexit_recursive_equal_S32_observation",
        rawS6LaunchObservationBinding:
          "exact_read-only_S6_mount_observation_bound_by_launch_envelope",
        rawS6PreExecObservationBinding:
          "fresh_preexec_recursive_equal_S6_root_and_6-file_observation",
        rawS6BootstrapReadObservationBinding:
          "fresh_bootstrap-first-read_recursive_equal_S6_observation",
        rawS6PostExitObservationBinding:
          "fresh_postexit_recursive_equal_S6_observation",
        verifierClosedOutputObservationBinding:
          "exact_positive_v3_verifier_closed-output_binding",
        compositeReplayBundleBinding:
          "exact_domain-separated_binding_of_the_only_closed_replay_file",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        channelPreExecRevalidationMonotonicNanoseconds:
          "canonical_unsigned_decimal",
        monotonicStartNanoseconds: "canonical_unsigned_decimal",
        bootstrapReadMonotonicNanoseconds: "canonical_unsigned_decimal",
        monotonicEndNanoseconds: "canonical_unsigned_decimal",
        postExitObservationMonotonicNanoseconds: "canonical_unsigned_decimal",
        exitCode: "literal_0",
        cgroupPopulatedZero: "literal_true",
        channelWriterOrWritableAliasCount: "literal_0",
        channelNamespaceMutationCount: "literal_0",
        numericRootWriterOrWritableAliasCount: "literal_0",
        numericRootNamespaceMutationCount: "literal_0",
        rawRootWriterOrWritableAliasCount: "literal_0",
        rawRootNamespaceMutationCount: "literal_0",
        bothEvidenceMountsReadOnlyThroughCgroupEmpty: "literal_true",
        networkDenied: "literal_true",
        quotaAndDeadlinePassed: "literal_true",
        singleCompositeOutputLifecyclePassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "launch-envelope-seal_is_not_after_preexec-revalidation_which_is_strictly_before_exec_start;start_is_not_after_bootstrap-read_is_not_after_end_is_not_after_postexit-observation_and_all_are_before_deadline",
        "channel_launch_preexec_bootstrap_and_postexit_observations_are_recursively_equal_in_path_device_inode_linkCount_type_size_times_plain-hash_secure-resolution_and_stat-read-stat_identity",
        "S32_and_S6_each_have_launch_preexec_bootstrap_and_postexit_observations_recursively_equal_for_root_identity_exact_paths_sizes_and_plain_hashes_and_each_mount_remains_read-only_through_exit_and_cgroup-empty",
        "S6_root_is_identity-distinct_from_S32_input_replay_attestation_output_opt_and_channel_roots_with_zero_writer_alias_or_namespace_mutation_counts",
        "genericControlEvidence_recursively_equals_the_full_v3_launch_ledger_channel_source-toolchain-ledger_quota_seccomp_deadline_output-and-capture_evidence_without_reusing_the_removed_base8-plus32_work_invariant",
        "sourceManifestBinding_toolchainManifestBinding_verifierExecutableBinding_ociImageDigest_typedInterpreterBinding_proofKernelBinding_and_independentProofKernelToolchainBinding_recursively_equal_the_prevalidated_channel_and_verifier-launch-envelope_values;proofKernelBinding_is_the_actual_independent-kernel_binding_while_independentProofKernelToolchainBinding_is_the_distinct_toolchain_binding_and_cross-substitution_is_forbidden",
        "verifierWorkerAttemptBinding_and_schedulerLeaseBinding_match_the_verifier_stage_issuance_in_the_launch-envelope_and_are_distinct_from_the_producer_worker-attempt_under_the_same_global_run;full-producer_exit_and_cgroup-empty_then_S32/S6_closure_end_are_strictly_before_verifier_preexec_and_start",
        "singleCompositeOutputLifecyclePassed_means_only_that_exactly_one_composite file was closed and file-fsynced and its replay directory fsynced before verifier exit followed by cgroup-empty and postexit observation;full-verifier-E_does_not_parse_or_validate_candidate_P-N-gate dependencies and_candidateDependencyOrderValidated_exists_only_in_the_later_typedInterpreterValidation",
        "verifierClosedOutputObservationBinding_recomputes_after_exit_and_cgroup-empty_and_the_full_enforcement_receipt_never predicts its own later file observation or binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BROKER_RUNTIME_SEPARATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.broker_runtime_separation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_broker_runtime_separation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "producerWorkerAttemptBinding",
        "verifierWorkerAttemptBinding",
        "producerFullEnforcementReceiptBinding",
        "verifierFullEnforcementReceiptBinding",
        "producerSourceManifestBinding",
        "verifierSourceManifestBinding",
        "producerToolchainManifestBinding",
        "verifierToolchainManifestBinding",
        "producerExecutableDigest",
        "verifierExecutableDigest",
        "producerCgroupIdentity",
        "verifierCgroupIdentity",
        "producerCgroupEmptyMonotonicNanoseconds",
        "secureCompositeClosuresEndMonotonicNanoseconds",
        "verifierPreExecMonotonicNanoseconds",
        "verifierStartMonotonicNanoseconds",
        "verifierFullEnforcementPostExitObservationMonotonicNanoseconds",
        "clockId",
        "separationObservationStartMonotonicNanoseconds",
        "separationReceiptCloseMonotonicNanoseconds",
        "sharedSourceImportCount",
        "sharedWritableMountCount",
        "ipcNetworkOrCallbackPathCount",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_broker_runtime_separation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_attempt_as_both_enforcement_receipts",
        schedulerLeaseBinding:
          "exact_same_trusted_scheduler_lease_recursively_bound_by_both_launch-and-enforcement_lineages",
        producerWorkerAttemptBinding:
          "exact_stage-scoped_attempt_recursively_bound_by_full-producer-E",
        verifierWorkerAttemptBinding:
          "different_exact_stage-scoped_attempt_recursively_bound_by_full-verifier-E",
        producerFullEnforcementReceiptBinding:
          "exact_positive_full_producer_enforcement_binding",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_full_verifier_enforcement_binding",
        producerSourceManifestBinding:
          "exact_recursive_value_from_full-producer-E_and_its_launch-envelope",
        verifierSourceManifestBinding:
          "exact_recursive_value_from_full-verifier-E_and_its_launch-envelope",
        producerToolchainManifestBinding:
          "exact_recursive_value_from_full-producer-E_and_its_launch-envelope",
        verifierToolchainManifestBinding:
          "exact_recursive_value_from_full-verifier-E_and_its_launch-envelope",
        producerExecutableDigest:
          "exact_recursive_executable_digest_from_full-producer-E_bound_toolchain_and_launch_invocation",
        verifierExecutableDigest:
          "different_exact_recursive_executable_digest_from_full-verifier-E_bound_toolchain_and_launch_invocation",
        producerCgroupIdentity:
          "exact_recursive_cgroup_identity_from_full-producer-E_generic-control-evidence",
        verifierCgroupIdentity:
          "different_exact_recursive_cgroup_identity_from_full-verifier-E_generic-control-evidence",
        producerCgroupEmptyMonotonicNanoseconds:
          "exact_recursive_time_from_full-producer-E_and_O38",
        secureCompositeClosuresEndMonotonicNanoseconds:
          "maximum_exact_end_time_of_post-E_S32_and_S6_secure_observation_closures",
        verifierPreExecMonotonicNanoseconds:
          "exact_recursive_time_from_full-verifier-E",
        verifierStartMonotonicNanoseconds:
          "exact_recursive_time_from_full-verifier-E",
        verifierFullEnforcementPostExitObservationMonotonicNanoseconds:
          "exact_recursive_postexit-observation_time_from_full-verifier-E",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        separationObservationStartMonotonicNanoseconds:
          "canonical_unsigned_decimal_not_before_full-verifier-E_postexit-observation",
        separationReceiptCloseMonotonicNanoseconds:
          "canonical_unsigned_decimal_not_before_separation-observation-start_and_strictly_before_any_postexit_evidence-reread",
        sharedSourceImportCount: "literal_0",
        sharedWritableMountCount: "literal_0",
        ipcNetworkOrCallbackPathCount: "literal_0",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "producer_and_verifier_source_toolchain_executable_image_cgroup_and_writable-mount_identities_are_distinct_and_broker-observed",
        "producerWorkerAttemptBinding_and_verifierWorkerAttemptBinding_are_distinct_but_both_are_issued_under_schedulerLeaseBinding_and_the_same_global_run_and_sameAttemptId",
        "the_verifier_import_graph_contains_no_producer_source_package_module_bytecode_generated-data_or_callback",
        "no_network_ipc_shared-memory_shared-writable-mount_or_in-process_execution_path_connects_the_two_stages",
        "static_policy_separation_claims_alone_cannot_satisfy_this_same-attempt_runtime_receipt",
        "producerCgroupEmpty_is_strictly_before_both_secure-closure_end_times_which_are_strictly_before_verifierPreExec_which_is_strictly_before_verifierStart",
        "verifierFullEnforcementPostExitObservationMonotonicNanoseconds_is_not_after_separationObservationStartMonotonicNanoseconds_is_not_after_separationReceiptCloseMonotonicNanoseconds;later_postexit-S32-and-S6-reread_schemas_cross-bind_this_exact_close_and_start_strictly_after_it",
        "no_source_toolchain_executable_or_cgroup_identity_is_freely_asserted;each_recursively_equals_the_corresponding_full-enforcement_and_launch evidence",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.postexit_postprojection_acceptance_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_postexit_postprojection_acceptance_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "candidateInstanceIdentityBinding",
        "compositeReplayBundleBinding",
        "candidatePWrapperBinding",
        "candidatePReceiptInstanceBinding",
        "verifierStageRuntimeConformanceBinding",
        "producerFullEnforcementReceiptBinding",
        "numericStaging32CompositeBinding",
        "rawEvidence6CompositeBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterBinding",
        "producerProjectionImplementationBinding",
        "verifierProjectionImplementationBinding",
        "implementationSeparationReceiptBinding",
        "clockId",
        "acceptanceMonotonicNanoseconds",
        "candidatePostprojectionMathMatched",
        "brokerSameAttemptEstablished",
        "runtimeIsolationEstablished",
        "runtimeMappingAccepted",
        "postprojectionAcceptanceGranted",
        "scientificAdmissionGranted",
        "seedAdmissionGranted",
        "artifactAdmissionGranted",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_postexit_postprojection_acceptance/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier_attempt",
        candidateInstanceIdentityBinding:
          "exact_same_embedded_candidate-identity_binding",
        compositeReplayBundleBinding:
          "exact_securely-observed_postexit_composite_binding",
        candidatePWrapperBinding:
          "exact_nested_untrusted-P-wrapper_binding_with_candidateP_outcome_match",
        candidatePReceiptInstanceBinding:
          "exact_inner_sealed_candidate-P_receipt-instance_binding_named_by_the_wrapper",
        verifierStageRuntimeConformanceBinding:
          "exact_conformant_attempt-scoped_binding_nested_in_the_P-wrapper",
        producerFullEnforcementReceiptBinding:
          "exact_positive_Eprod_binding_from_candidate-identity",
        numericStaging32CompositeBinding:
          "exact_positive_S32-N32_binding_from_candidate-identity",
        rawEvidence6CompositeBinding:
          "exact_positive_S6-R6_binding_from_candidate-identity",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_postexit_transport-and-OS_enforcement_binding",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_same-attempt_runtime-separation_binding",
        typedInterpreterBinding:
          "exact_preexisting_complete_closed-schema_interpreter_identity_not_the_enclosing_validation-receipt_binding",
        producerProjectionImplementationBinding:
          "exact_static_producer_projection_implementation_binding",
        verifierProjectionImplementationBinding:
          "exact_distinct_static_verifier_projection_implementation_binding",
        implementationSeparationReceiptBinding:
          "exact_positive_static-separation_receipt_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        acceptanceMonotonicNanoseconds: "canonical_unsigned_decimal",
        candidatePostprojectionMathMatched: "literal_true",
        brokerSameAttemptEstablished: "literal_true",
        runtimeIsolationEstablished: "literal_true",
        runtimeMappingAccepted: "literal_true",
        postprojectionAcceptanceGranted: "literal_true",
        scientificAdmissionGranted: "literal_false",
        seedAdmissionGranted: "literal_false",
        artifactAdmissionGranted: "literal_false",
        allPassed: "literal_true",
      },
      forbiddenKeys: [
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "assemblerLaunchEnvelopeBinding",
      ],
      crossFieldInvariants: [
        "the_acceptance_is_created_postexit_inside_typed-interpreter-validation_only_after_exact_composite_full-E_runtime-separation_channel-mapping_and_static-implementation_validation",
        "raw_candidate-P_remains_untrusted;this_distinct_postexit_receipt_is_the_only_positive-P_node_eligible_for_later_atomic_registration",
        "every_identity_runtime-composite_and_implementation_binding_recursively_equals_the_securely-observed_channel_composite_and_full-E_for_one_attempt",
        "the_value_does_not_bind_its_future_enclosing_interpreter-validation_receipt_and_therefore_introduces_no_hash_cycle",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.postexit_final_full_seed_admission_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_postexit_final_full_seed_admission_schema/v1",
    discriminator: "disposition",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "disposition",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "candidateInstanceIdentityBinding",
        "compositeReplayBundleBinding",
        "postprojectionAcceptanceReceiptBinding",
        "candidateNWrapperBinding",
        "positiveNumericReplayBundleBinding",
        "candidateFullSeedGateEvidenceBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterBinding",
        "validatedDutyPathOrder",
        "allFiveDutyValuesPresentAndSchemaValid",
        "rejectionCodeOrNull",
        "seedAdmissionGranted",
        "scientificAdmissionGranted",
        "artifactAdmissionGranted",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_postexit_final_full_seed_admission/v1",
        disposition: "literal_match_or_rejection",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier_attempt",
        candidateInstanceIdentityBinding:
          "exact_same_candidate-identity_binding",
        compositeReplayBundleBinding:
          "exact_securely-observed_composite_binding",
        postprojectionAcceptanceReceiptBinding:
          "exact_interpreter-created_positive-P-acceptance_binding",
        candidateNWrapperBinding:
          "exact_nested_positive-match_N-wrapper_binding",
        positiveNumericReplayBundleBinding:
          "exact_nested_positive-N-replay_binding_named_by_candidateNWrapper",
        candidateFullSeedGateEvidenceBinding:
          "exact_nested_gate-evidence-wrapper_binding",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_full-verifier-E_binding",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_runtime-separation_binding",
        typedInterpreterBinding:
          "exact_preexisting_complete_interpreter_identity_not_the_enclosing_validation-receipt binding",
        validatedDutyPathOrder:
          "literal_tuple_[postprojectionAcceptanceReceipt,serverRecomputedGateReport,continuousNodelessProofReceipt,numericalOriginSeriesDefectReceipt,continuousPeakProofReceipt]",
        allFiveDutyValuesPresentAndSchemaValid:
          "literal_true_for_match_and_false_for_rejection",
        rejectionCodeOrNull:
          "null_for_match_or_one_closed_gate-evidence_rejection_code",
        seedAdmissionGranted: "literal_true_for_match_and_false_for_rejection",
        scientificAdmissionGranted: "literal_false",
        artifactAdmissionGranted: "literal_false",
        allPassed: "literal_true_for_match_and_false_for_rejection",
      },
      dispositionProfiles: {
        match: {
          candidateNGatePrerequisites:
            "positive_match_and_gate_evidence_complete",
          allFiveDutyValuesPresentAndSchemaValid: true,
          rejectionCodeOrNull: null,
          seedAdmissionGranted: true,
          scientificAdmissionGranted: false,
          artifactAdmissionGranted: false,
          allPassed: true,
        },
        rejection: {
          candidateNGatePrerequisites:
            "positive_match_and_gate_evidence_rejection",
          allFiveDutyValuesPresentAndSchemaValid: false,
          rejectionCodeOrNull: "one_closed_gate-evidence_rejection_code",
          seedAdmissionGranted: false,
          scientificAdmissionGranted: false,
          artifactAdmissionGranted: false,
          allPassed: false,
        },
      },
      forbiddenKeys: [
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "assemblerLaunchEnvelopeBinding",
      ],
      crossFieldInvariants: [
        "the_result_is_created_postexit_inside_typed-interpreter-validation_after_positive-P-acceptance_and_positive-N-wrapper_validation;candidate-gate-evidence_rejection_yields_only_the_typed_rejection_variant",
        "match_requires_the_five_exact_duty_classes_in_validatedDutyPathOrder_and_cross-checks_scalar-metadata_array-inventory_continuum_source_and_candidate identity against the sole positive-N replay",
        "the_value_does_not_bind_its_future_enclosing_interpreter-validation_receipt_and_only_the_match_binding_is_eligible_for_atomic_registration_or_assembler_launch",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.typed_interpreter_validation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_typed_interpreter_validation_schema/v1",
    evidenceByteHashPolicies: {
      plainFileObservation:
        "SHA256(exact_raw_bytes)_with_no_domain_or_length_prefix",
      seedV1Array: {
        domain:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
            .arraySha256Domain,
        recipe:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
            .arrayHashRecipe,
      },
      postprojectionRawEvidence:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1.rawEvidenceHashPolicy,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "evidenceSchemaRegistryBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "typedInterpreterBinding",
        "compositeReplayBundleBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "rawVerifierChannelObservation",
        "rawVerifierChannelInstanceBinding",
        "rawCompositeReplayAbsolutePath",
        "rawCompositeReplayObservation",
        "rawCompositeReplayObservationMonotonicNanoseconds",
        "verifierFullEnforcementDurableWriteReceipt",
        "rawVerifierEnforcementAbsolutePath",
        "rawVerifierEnforcementObservation",
        "rawVerifierEnforcementObservationMonotonicNanoseconds",
        "postexitEvidenceRereadStartMonotonicNanoseconds",
        "postexitEvidenceRereadEndMonotonicNanoseconds",
        "postexitSecureStaging32ObservationClosure",
        "postexitSecureStaging32ObservationClosureBinding",
        "postexitSecureRawEvidence6ObservationClosure",
        "postexitSecureRawEvidence6ObservationClosureBinding",
        "postexitEvidenceHashCrosswalk",
        "evidenceRootsReadOnlyUntilRereadEnd",
        "validatedCompositeOutcome",
        "postprojectionAcceptanceReceiptOrNull",
        "postprojectionAcceptanceReceiptBindingOrNull",
        "validatedFinalFullSeedAdmissionOrRejectionOrNull",
        "validatedFinalFullSeedResultBindingOrNull",
        "terminalPositiveAdmissionEligible",
        "allExactSchemasClosed",
        "allDomainHashesRecomputed",
        "candidateDependencyOrderValidated",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_typed_interpreter_validation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        evidenceSchemaRegistryBinding:
          "exact_future_sealed_v3_registry_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier_attempt",
        typedInterpreterBinding: "complete_closed-schema_interpreter_binding",
        compositeReplayBundleBinding: "exact_observed_composite_binding",
        verifierFullEnforcementReceiptBinding:
          "exact_observed_full-verifier-E_binding",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_separation_binding",
        rawVerifierChannelObservation:
          "fresh_postexit_secure_fileObservation_of_the_exact_launched_verifier-channel_raw_bytes_with_plain-hash_size_identity_stability_and_recanonicalization_checked",
        rawVerifierChannelInstanceBinding:
          "exact_domain-separated_channel-instance_binding_recomputed_from_rawVerifierChannelObservation_bytes_and_equal_to_the_launch-envelope_and_full-E_channel binding",
        rawCompositeReplayAbsolutePath: COMPOSITE_REPLAY_PATH,
        rawCompositeReplayObservation:
          "fresh_postexit_secure_fileObservation_whose_raw_bytes_equal_recanonicalized_UTF8_with_its_own_pre-assembler_binding_plain-hash-and-size;future_assembler_ledger42_must_recursively_equal_it",
        rawCompositeReplayObservationMonotonicNanoseconds:
          "canonical_unsigned_decimal_after_verifier-closed-output_and_full-verifier-E_close",
        verifierFullEnforcementDurableWriteReceipt: {
          kind: "object",
          exactKeys: [
            "absolutePath",
            "verifierFullEnforcementReceiptBinding",
            "canonicalSizeBytes",
            "canonicalPlainSha256",
            "clockId",
            "exclusiveWriteStartMonotonicNanoseconds",
            "fileCloseAndFsyncEndMonotonicNanoseconds",
            "parentDirectoryFsyncEndMonotonicNanoseconds",
            "oExclUsed",
            "allPassed",
          ],
          extraKeysAllowed: false,
          fields: {
            absolutePath: VERIFIER_ENFORCEMENT_PATH,
            verifierFullEnforcementReceiptBinding:
              "exact_domain-separated_binding_recomputed_from_the_same_raw_canonical_full-E_bytes",
            canonicalSizeBytes:
              "exact_safe_integer_byteLength_of_the_raw_canonical_full-E_bytes",
            canonicalPlainSha256:
              "plain_SHA256_of_the_same_raw_canonical_full-E_bytes",
            clockId: "literal_CLOCK_MONOTONIC_RAW",
            exclusiveWriteStartMonotonicNanoseconds:
              "canonical_unsigned_decimal",
            fileCloseAndFsyncEndMonotonicNanoseconds:
              "canonical_unsigned_decimal",
            parentDirectoryFsyncEndMonotonicNanoseconds:
              "canonical_unsigned_decimal",
            oExclUsed: "literal_true",
            allPassed: "literal_true",
          },
        },
        rawVerifierEnforcementAbsolutePath: VERIFIER_ENFORCEMENT_PATH,
        rawVerifierEnforcementObservation:
          "fresh_postexit_secure_fileObservation_whose_raw_bytes_equal_recanonicalized_UTF8_with_its_own_pre-assembler_binding_plain-hash-and-size;future_assembler_ledger43_must_recursively_equal_it",
        rawVerifierEnforcementObservationMonotonicNanoseconds:
          "canonical_unsigned_decimal_not_before_verifierFullEnforcementDurableWriteReceipt.parentDirectoryFsyncEndMonotonicNanoseconds",
        postexitEvidenceRereadStartMonotonicNanoseconds:
          "canonical_unsigned_decimal_equal_to_the_minimum_of_the_two_nested_postexit-reread observationStart values_and_strictly_after_full-verifier-E_and_runtime-separation close",
        postexitEvidenceRereadEndMonotonicNanoseconds:
          "canonical_unsigned_decimal_equal_to_the_maximum_of_the_two_nested_postexit-reread observationEnd values_not_before_reread-start_and_strictly_before_deadline_and_any evidence-root unmount",
        postexitSecureStaging32ObservationClosure:
          "fresh_post-full-verifier-E_self-contained_value_valid_against_v3_postexitSecureStaging32Reread_recomputed_from_exact_raw_bytes_before_unmount",
        postexitSecureStaging32ObservationClosureBinding:
          "exact_binding_recomputed_from_the_fresh_postexit_S32_closure_value",
        postexitSecureRawEvidence6ObservationClosure:
          "fresh_post-full-verifier-E_self-contained_value_valid_against_v3_postexitSecureRawEvidence6Reread_recomputed_from_exact_raw_bytes_before_unmount",
        postexitSecureRawEvidence6ObservationClosureBinding:
          "exact_binding_recomputed_from_the_fresh_postexit_S6_closure_value",
        postexitEvidenceHashCrosswalk: {
          kind: "object",
          exactKeys: ["numeric32Entries", "raw6Entries", "allPassed"],
          extraKeysAllowed: false,
          fields: {
            numeric32Entries: {
              kind: "tuple",
              exactLength: 32,
              order: "inventoryIndex_ascending_0_through_31",
              itemExactKeys: [
                "inventoryIndex",
                "absolutePath",
                "relativePath",
                "role",
                "byteLength",
                "freshPlainSha256",
                "secureObservationPlainSha256",
                "numericManifestRawArraySha256",
                "seedV1ArrayDomainSha256",
                "candidateGateEvidenceArraySha256OrNull",
                "allRecipesRecomputedFromSameRawBytes",
              ],
              itemFields: {
                inventoryIndex: "literal_same_index_0_through_31",
                absolutePath: "literal_frozen_S32_path_at_index",
                relativePath: "literal_seed-v1_inventory_relativePath_at_index",
                role: "literal_seed-v1_inventory_role_at_index",
                byteLength: "literal_seed-v1_inventory_byteLength_at_index",
                freshPlainSha256:
                  "plain_SHA256_recomputed_while_streaming_the_fresh_postexit_raw_bytes",
                secureObservationPlainSha256:
                  "exact_equal_fileObservation.sha256_from_postexitSecureStaging32ObservationClosure",
                numericManifestRawArraySha256:
                  "exact_equal_plain_hash_from_the_candidate-identity_nested_N32_manifest",
                seedV1ArrayDomainSha256:
                  "independently_recomputed_seed-v1_length-delimited_path-role-byteLength-domain_hash_from_the_same_raw_bytes",
                candidateGateEvidenceArraySha256OrNull:
                  "null_when_gate-evidence_absent_else_exact_equal_seed-v1-domain_hash_from_observedArrayInventory",
                allRecipesRecomputedFromSameRawBytes: "literal_true",
              },
              itemExtraKeysAllowed: false,
              extraEntriesAllowed: false,
            },
            raw6Entries: {
              kind: "tuple",
              exactLength: 6,
              order: "evidenceIndex_ascending_0_through_5",
              itemExactKeys: [
                "evidenceIndex",
                "absolutePath",
                "relativePath",
                "byteLength",
                "freshPlainSha256",
                "secureObservationPlainSha256",
                "rawManifestPlainSha256",
                "postprojectionDomainSha256",
                "rawManifestDomainSha256",
                "allRecipesRecomputedFromSameRawBytes",
              ],
              itemFields: {
                evidenceIndex: "literal_same_index_0_through_5",
                absolutePath: "literal_frozen_S6_path_at_index",
                relativePath:
                  "literal_postprojection_inventory_relativePath_at_index",
                byteLength:
                  "literal_postprojection_inventory_byteLength_at_index",
                freshPlainSha256:
                  "plain_SHA256_recomputed_while_streaming_the_fresh_postexit_raw_bytes",
                secureObservationPlainSha256:
                  "exact_equal_fileObservation.sha256_from_postexitSecureRawEvidence6ObservationClosure",
                rawManifestPlainSha256:
                  "exact_equal_plainSha256_from_the_candidate-identity_nested_R6_manifest",
                postprojectionDomainSha256:
                  "independently_recomputed_digest_under_the_exact_sealed_postprojection_rawEvidenceHashPolicy_from_the_same_raw_bytes_and_static_inventory_fields",
                rawManifestDomainSha256:
                  "exact_equal_domainSha256_from_the_candidate-identity_nested_R6_manifest",
                allRecipesRecomputedFromSameRawBytes: "literal_true",
              },
              itemExtraKeysAllowed: false,
              extraEntriesAllowed: false,
            },
            allPassed: "literal_true",
          },
        },
        evidenceRootsReadOnlyUntilRereadEnd: "literal_true",
        validatedCompositeOutcome:
          "exact_closed_composite_outcome_enum_recomputed_from_nested_values",
        postprojectionAcceptanceReceiptOrNull:
          "null_for_P-rejection_else_one_exact_value_valid_against_v3_postexitPostprojectionAcceptance_created_inside_this_validation_without_binding_this_enclosing_receipt",
        postprojectionAcceptanceReceiptBindingOrNull:
          "exact_recomputed_binding_of_postprojectionAcceptanceReceiptOrNull_or_literal_null",
        validatedFinalFullSeedAdmissionOrRejectionOrNull:
          "null_until_positive-N;otherwise_one_exact_match-or-rejection_value_valid_against_v3_postexitFinalFullSeedAdmission_created_inside_this_validation_without_binding_this_enclosing_receipt",
        validatedFinalFullSeedResultBindingOrNull:
          "exact_recomputed_postexit-final-result binding_or_null_with_the_value;only_match_is_registration-eligible",
        terminalPositiveAdmissionEligible:
          "literal_true_only_for_PN_match_gate_evidence_complete_with_positive_P-acceptance_positive-N-and_final-match_else_false",
        allExactSchemasClosed: "literal_true",
        allDomainHashesRecomputed: "literal_true",
        candidateDependencyOrderValidated: "literal_true",
        allPassed: "literal_true",
      },
      outcomeProfiles: {
        P_rejection: {
          postprojectionAcceptanceReceiptOrNull: null,
          postprojectionAcceptanceReceiptBindingOrNull: null,
          validatedFinalFullSeedAdmissionOrRejectionOrNull: null,
          validatedFinalFullSeedResultBindingOrNull: null,
          terminalPositiveAdmissionEligible: false,
        },
        P_match_N_rejection: {
          postprojectionAcceptanceReceiptOrNull: "non-null_positive",
          postprojectionAcceptanceReceiptBindingOrNull: "non-null",
          validatedFinalFullSeedAdmissionOrRejectionOrNull: null,
          validatedFinalFullSeedResultBindingOrNull: null,
          terminalPositiveAdmissionEligible: false,
        },
        PN_match_gate_evidence_rejection: {
          postprojectionAcceptanceReceiptOrNull: "non-null_positive",
          postprojectionAcceptanceReceiptBindingOrNull: "non-null",
          validatedFinalFullSeedAdmissionOrRejectionOrNull:
            "non-null_rejection",
          validatedFinalFullSeedResultBindingOrNull: "non-null_diagnostic",
          terminalPositiveAdmissionEligible: false,
        },
        PN_match_gate_evidence_complete: {
          postprojectionAcceptanceReceiptOrNull: "non-null_positive",
          postprojectionAcceptanceReceiptBindingOrNull: "non-null",
          validatedFinalFullSeedAdmissionOrRejectionOrNull: "non-null_match",
          validatedFinalFullSeedResultBindingOrNull: "non-null_positive",
          terminalPositiveAdmissionEligible: true,
        },
      },
      crossFieldInvariants: [
        "the_interpreter_is_bound_before_validation_and_supports_every_recursive_union_profile_primitive_domain_and_cross-field_rule_in_the_v3_registry",
        "plain_raw_file_SHA256_is_not_confused_with_any_domain-separated_binding_SHA256_and_both_are_recomputed_from_the_same_exact_bytes",
        "rawVerifierChannelObservation_is_a_fresh_postexit_reread_of_the_exact_launched_channel_and_is_required_to_parse_and_recompute_the_embedded_candidate-identity_Eprod_S32-N32_and_S6-R6_values_instead_of_trusting_binding_strings",
        "rawCompositeReplayObservation.absolutePath_equals_rawCompositeReplayAbsolutePath_equals_COMPOSITE_REPLAY_PATH_and_rawVerifierEnforcementObservation.absolutePath_equals_rawVerifierEnforcementAbsolutePath_equals_VERIFIER_ENFORCEMENT_PATH",
        "for_every_postlaunch_composite_outcome_full-verifier-E_is_schema-validated_recanonicalized_bound_written_once_with_O_EXCL_closed_file-fsynced_and_parent-directory-fsynced_before_the_fresh_rawVerifierEnforcementObservation;only_the_later_exact-one-attestation-root-observation_and_assembler path are conditional on terminal-positive admission",
        "verifierFullEnforcementDurableWriteReceipt.verifierFullEnforcementReceiptBinding_equals_the_outer verifierFullEnforcementReceiptBinding_its_plain-hash-and-size_equal_rawVerifierEnforcementObservation_and_its_parentDirectoryFsyncEnd_is_not_after_rawVerifierEnforcementObservationMonotonicNanoseconds",
        "rawCompositeReplayObservationMonotonicNanoseconds_is_after_the_bound_verifierClosedOutput_and_full-E-close;both_fresh_raw-file-observation_times_are_not_after_the_resolved_brokerRuntimeSeparationReceipt.separationObservationStart_which_is_not_after_its_close_and_both_occur_before_postexit-evidence-reread-and-typed-validation close",
        "after_full-verifier-E_and_runtime-separation_the_interpreter_freshly_rereads_all_32_S32_and_all_6_S6_files_while_both_roots_remain_read-only_mounted_and_identity-stable;it_finishes_every_plain_seed-v1-array-domain_and_postprojection-domain_hash_recipe_before_any_unmount",
        "both_nested_postexit-reread_values_use_CLOCK_MONOTONIC_RAW_and_the_same_full-verifier-E_runtime-separation_deadline_candidate-identity context;separationReceiptClose_is_strictly_before_each_nested_observationStart_outer-rereadStart_is_their_minimum_and_outer-rereadEnd_is_their_maximum",
        "fresh_postexit_S32_and_S6_closures_recursively_equal_launch_preexec_bootstrap_full-E-and-candidate-identity observations in root/file identity_path_size_and_plain-hash while their new bindings are recomputed_from_the_fresh_values",
        "numeric_plain_SHA256_values_match_S32_and_N32_but_are_never_substituted_for_seed-v1_length-delimited_array-domain hashes;raw6_plain_SHA256_values_match_S6_and_R6_but_are_never_substituted_for_postprojection-domain hashes",
        "candidate_P-wrapper_is_valid_untrusted_evidence;candidate-N-wrapper_is_present_only_after_P-match;gate-evidence_is_absent_for_P-match-N-rejection;all_candidate_bindings share one identity",
        "candidate-P_never_substitutes_for_postprojection-acceptance;the_interpreter_creates_and_binds_that_acceptance_post-exit_in_full_same-attempt_context_before_final-F_validation",
        "the_validation_receipt_contains_no_assembler-ledger_channel-envelope_or_launch_binding;later_assembler_ledger_observations_must_equal_the_already-closed_fresh_observations_without_reverse_reference",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATOMIC_NESTED_REGISTRATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.atomic_nested_registration_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_atomic_nested_registration_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "compositeReplayBundleBinding",
        "verifierFullEnforcementReceiptBinding",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterValidationReceiptBinding",
        "candidatePWrapperBinding",
        "candidateNWrapperBindingOrNull",
        "candidateFullSeedGateEvidenceBindingOrNull",
        "postprojectionAcceptanceReceiptBindingOrNull",
        "validatedFinalFullSeedResultBindingOrNull",
        "compositeOutcome",
        "registrationOrder",
        "registeredNodeBindings",
        "registeredNodeCount",
        "atomicCommitId",
        "commitMonotonicNanoseconds",
        "allOrNoneCommitted",
        "assemblerLaunchEligible",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_atomic_nested_registration/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_attempt_as_validated_composite",
        compositeReplayBundleBinding: "exact_validated_composite_binding",
        verifierFullEnforcementReceiptBinding:
          "exact_positive_full-verifier-E_binding",
        brokerRuntimeSeparationReceiptBinding:
          "exact_positive_runtime-separation_binding",
        typedInterpreterValidationReceiptBinding:
          "exact_positive_complete-interpreter-validation_binding",
        candidatePWrapperBinding:
          "exact_nested_untrusted-P-wrapper_evidence-binding_not_registered_as_a_positive-P-node",
        candidateNWrapperBindingOrNull:
          "null_for_P-rejection_else_exact_nested_N-wrapper_binding;only_positive-match_N-wrapper_is_registerable",
        candidateFullSeedGateEvidenceBindingOrNull:
          "null_until_positive-N_else_exact_nested_gate-evidence_wrapper_binding_used_as_provenance_only",
        postprojectionAcceptanceReceiptBindingOrNull:
          "null_for_P-rejection_else_exact_postexit_interpreter-created_positive-P-acceptance binding",
        validatedFinalFullSeedResultBindingOrNull:
          "null_before_gate-evidence_else_exact_postexit_final-F_match-or-diagnostic-rejection_binding;only_match_is_registerable",
        compositeOutcome: "exact_closed_four-value_composite_outcome",
        registrationOrder: "exact_literal_node-name_tuple_from_outcomeProfiles",
        registeredNodeBindings:
          "exact_binding_tuple_corresponding_one-to-one_to_registrationOrder",
        registeredNodeCount: "literal_0_1_2_or_3_from_outcomeProfiles",
        atomicCommitId: "exact_128_bit_lowercase_hex_commit_identifier",
        commitMonotonicNanoseconds: "canonical_unsigned_decimal",
        allOrNoneCommitted: "literal_true",
        assemblerLaunchEligible:
          "literal_true_only_for_PN_match_gate_evidence_complete_else_false",
        allPassed: "literal_true",
      },
      outcomeProfiles: {
        P_rejection: {
          candidateNWrapperBindingOrNull: null,
          candidateFullSeedGateEvidenceBindingOrNull: null,
          postprojectionAcceptanceReceiptBindingOrNull: null,
          validatedFinalFullSeedResultBindingOrNull: null,
          registrationOrder: [],
          registeredNodeBindings: [],
          registeredNodeCount: 0,
          assemblerLaunchEligible: false,
        },
        P_match_N_rejection: {
          candidateNWrapperBindingOrNull: "non-null_rejection_provenance",
          candidateFullSeedGateEvidenceBindingOrNull: null,
          postprojectionAcceptanceReceiptBindingOrNull: "non-null_positive",
          validatedFinalFullSeedResultBindingOrNull: null,
          registrationOrder: ["postprojectionAcceptance"],
          registeredNodeBindings: ["postprojectionAcceptanceReceiptBinding"],
          registeredNodeCount: 1,
          assemblerLaunchEligible: false,
        },
        PN_match_gate_evidence_rejection: {
          candidateNWrapperBindingOrNull: "non-null_positive",
          candidateFullSeedGateEvidenceBindingOrNull:
            "non-null_rejection_provenance",
          postprojectionAcceptanceReceiptBindingOrNull: "non-null_positive",
          validatedFinalFullSeedResultBindingOrNull:
            "non-null_diagnostic_rejection",
          registrationOrder: ["postprojectionAcceptance", "candidateNWrapper"],
          registeredNodeBindings: [
            "postprojectionAcceptanceReceiptBinding",
            "candidateNWrapperBinding",
          ],
          registeredNodeCount: 2,
          assemblerLaunchEligible: false,
        },
        PN_match_gate_evidence_complete: {
          candidateNWrapperBindingOrNull: "non-null_positive",
          candidateFullSeedGateEvidenceBindingOrNull:
            "non-null_complete_provenance",
          postprojectionAcceptanceReceiptBindingOrNull: "non-null_positive",
          validatedFinalFullSeedResultBindingOrNull: "non-null_match",
          registrationOrder: [
            "postprojectionAcceptance",
            "candidateNWrapper",
            "validatedFinalFullSeedAdmission",
          ],
          registeredNodeBindings: [
            "postprojectionAcceptanceReceiptBinding",
            "candidateNWrapperBinding",
            "validatedFinalFullSeedResultBinding",
          ],
          registeredNodeCount: 3,
          assemblerLaunchEligible: true,
        },
      },
      crossFieldInvariants: [
        "registration_occurs_only_after_verifier_exit_cgroup-empty_full-E_runtime-separation_and_typed-interpretation",
        "each_outcome_registers_only_the_available_positive_nodes_in_dependency order with no partial visibility;typed rejection values and preexit P-or-gate wrappers are never registered as positive nodes",
        "the_registerable_N_node_is_candidateNWrapperBindingOrNull_when_its_disposition_is_positive-match;its_nested_positive replay is support and is not a second registered N node",
        "candidatePWrapperBinding_and_candidateFullSeedGateEvidenceBindingOrNull_are_provenance_only;raw candidate-P is never described as registered or authoritative and candidate mixing is impossible",
        "assembler_launch_requires_the_terminal_complete profile_registeredNodeCount3_terminalPositiveAdmissionEligible_true_and_exact_registered_[Paccept,Nwrapper,Fmatch]_chain",
        "assembler_input-ledger_channel_envelope_launch_and_output_evidence_are_future_and_absent",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.assembler_runtime_channel_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_assembler_runtime_channel_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "predecessorRunPlanV2Binding",
        "evidenceSchemaRegistryBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "assemblerWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "attestationRootPrestateReceiptBinding",
        "attestationRootPostStateObservation",
        "attestationRootPostStateObservationBinding",
        "outputRootPrestateReceiptBinding",
        "assemblerQuotaSetupReceiptBinding",
        "assemblerSeccompLoadReceiptBinding",
        "assemblerInputLedgerBinding",
        "verifierClosedOutputObservation",
        "verifierClosedOutputObservationBinding",
        "freshVerifierFullEnforcementObservation",
        "verifierFullEnforcementReceiptBinding",
        "compositeReplayBundleBinding",
        "compositeReplayRawPlainSha256",
        "compositeReplayCanonicalSizeBytes",
        "brokerRuntimeSeparationReceipt",
        "brokerRuntimeSeparationReceiptBinding",
        "typedInterpreterValidationReceipt",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceipt",
        "atomicNestedRegistrationReceiptBinding",
        "candidatePWrapperBinding",
        "candidateNWrapperBinding",
        "candidateFullSeedGateEvidenceBinding",
        "positiveNumericReplayBundleBinding",
        "postprojectionAcceptanceReceiptBinding",
        "validatedFinalFullSeedAdmissionBinding",
        "compositeOutcome",
        "assemblerLaunchEligible",
        "typedInterpreterBinding",
        "clockId",
        "channelAssemblyStartMonotonicNanoseconds",
        "channelSealMonotonicNanoseconds",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_assembler_runtime_channel/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        predecessorRunPlanV2Binding: "exact_sealed_v2_binding",
        evidenceSchemaRegistryBinding:
          "exact_future_sealed_v3_registry_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_attempt_as_atomic_registration",
        schedulerLeaseBinding:
          "exact_same_trusted_scheduler-lease_binding_as_the_three-stage_chain",
        assemblerWorkerAttemptBinding:
          "distinct_stage-scoped_assembler-worker-attempt_binding_issued_under_schedulerLeaseBinding_and_sameAttemptId",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        attestationRootPrestateReceiptBinding:
          "exact_attestation_entry_from_five-root-preparation",
        attestationRootPostStateObservation:
          "exact_value_valid_against_v3_attestationRootPostState_with_only_the_fresh_full-verifier-E_file",
        attestationRootPostStateObservationBinding:
          "exact_recomputed_binding_of_the_embedded_exact-one_attestation-root value",
        outputRootPrestateReceiptBinding:
          "exact_output_entry_from_five-root-preparation",
        assemblerQuotaSetupReceiptBinding:
          "exact_positive_prelaunch_quota_receipt",
        assemblerSeccompLoadReceiptBinding:
          "exact_positive_preexec_seccomp_receipt",
        assemblerInputLedgerBinding: "exact_closed_44-entry_assembler_ledger",
        verifierClosedOutputObservation:
          "exact_self-contained_value_valid_against_v3_verifierClosedOutput",
        verifierClosedOutputObservationBinding:
          "exact_recomputed_binding_of_the_embedded_positive_one-file_verifier-closed-output value",
        freshVerifierFullEnforcementObservation:
          "fresh_importedV2.schemas.fileObservation_at_exact_attestation_path_not_reused_from_any_prior_ordinal",
        verifierFullEnforcementReceiptBinding:
          "exact_domain-separated_binding_recomputed_from_the_fresh_raw_receipt_bytes",
        compositeReplayBundleBinding:
          "exact_domain-separated_binding_recomputed_from_ledger42_raw_bytes",
        compositeReplayRawPlainSha256:
          "plain_SHA256_of_the_exact_ledger42_raw_canonical_bytes",
        compositeReplayCanonicalSizeBytes: "exact_ledger42_raw_byte_length",
        brokerRuntimeSeparationReceipt:
          "exact_self-contained_value_valid_against_v3_brokerRuntimeSeparation",
        brokerRuntimeSeparationReceiptBinding:
          "exact_recomputed_positive_same-attempt_binding_of_the_embedded_value",
        typedInterpreterValidationReceipt:
          "exact_self-contained_value_valid_against_v3_typedInterpreterValidation_with_terminalPositiveAdmissionEligible_true",
        typedInterpreterValidationReceiptBinding:
          "exact_recomputed_positive_same-attempt_binding_of_the_embedded_value",
        atomicNestedRegistrationReceipt:
          "exact_self-contained_terminal value_valid_against_v3_atomicNestedRegistration",
        atomicNestedRegistrationReceiptBinding:
          "exact_recomputed_positive_same-attempt_binding_of_the_embedded_value",
        candidatePWrapperBinding:
          "exact_nested_untrusted-P-wrapper_provenance binding_not_a_registered_positive-P-node",
        candidateNWrapperBinding:
          "exact_registered_positive-match_N-wrapper_binding",
        candidateFullSeedGateEvidenceBinding:
          "exact_nested_gate-evidence-complete_provenance binding",
        positiveNumericReplayBundleBinding:
          "exact_non-null_nested_positive-N-replay_support_binding_named_by_the_registered_positive-match_N-wrapper_and_not_a_separate_registered_node",
        postprojectionAcceptanceReceiptBinding:
          "exact_non-null_post-exit_interpreter-created_postprojection-acceptance_binding",
        validatedFinalFullSeedAdmissionBinding:
          "exact_non-null_post-exit_validated-and-registered_final-F-match_binding",
        compositeOutcome: "literal_PN_match_gate_evidence_complete",
        assemblerLaunchEligible: "literal_true",
        typedInterpreterBinding: "exact_same_complete_interpreter_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        channelAssemblyStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        channelSealMonotonicNanoseconds: "canonical_unsigned_decimal",
      },
      forbiddenKeys: [
        "rawEvidence6MountObservation",
        "rawEvidence6Composite",
        "representativeTuple",
        "representativeTupleSha256",
        "representativeContinuumSha256",
        "standaloneCandidatePPath",
      ],
      crossFieldInvariants: [
        "assembler_ledger42_is_the_exact_composite_and_ledger43_is_a_fresh_secure_observation_of_full-verifier-E_with_plain-and-domain-hashes_recomputed_separately",
        "the_channel_seals_only_after_atomic_nested_registration_and_after_the_44-entry_ledger_then_the_launch-envelope_binds_the_exact_channel_instance_and_observation",
        "assembler_has_no_raw6_mount_observation_or_direct_tuple;the_sole_representative_tuple_if_present_is_nested_only_in_the_positive_N_replay_bundle_inside_ledger42",
        "verifierClosedOutput_brokerRuntimeSeparation_typedInterpreterValidation_and_atomicNestedRegistration_values_are_each_embedded_once_and_their_bindings_recompute;the_composite_and_full-verifier-E_remain_only_ledger42-and-43_raw files and are not duplicated",
        "assembler_launch_is_forbidden_unless_compositeOutcome_is_exactly_PN_match_gate_evidence_complete_positive-N_postprojection-acceptance_final-F_full-E_runtime-separation_typed-interpretation_terminalPositiveAdmissionEligible_and_atomic-three-node-registration_are_all_non-null positive for one attempt",
        "any_P_N_or_F_rejection_terminates_without_assembler_channel_acceptance_launch_descriptor_or_artifact_even_if_typed_rejection_evidence_is_recorded",
        "the_channel_contains_no_own_binding_launch-envelope_future-assembler-enforcement_final-descriptor_or_artifact-admission_binding",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATTESTATION_ROOT_POST_STATE_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.attestation_root_poststate_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_attestation_root_poststate_schema/v1",
    listingHashPolicy: ROOT_LISTING_HASH_POLICY,
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "attestationRootPrestateReceiptBinding",
        "verifierFullEnforcementReceiptBinding",
        "clockId",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "rootAbsolutePath",
        "rootMountId",
        "rootDeviceId",
        "rootInode",
        "rootModeFileType",
        "rootListingSha256",
        "rootEntryCount",
        "fullVerifierEnforcementFileObservation",
        "secureResolutionPassed",
        "statReadStatStable",
        "noExtraEntriesPassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_attestation_root_poststate/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_verifier-and-assembler_run_attempt",
        attestationRootPrestateReceiptBinding:
          "exact_empty_attestation-root_prestate_from_five-root-preparation",
        verifierFullEnforcementReceiptBinding:
          "exact_binding_recomputed_from_the_only_regular-file_raw_canonical bytes",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        rootAbsolutePath: "literal_/run/attestation",
        rootMountId: "canonical_unsigned_decimal",
        rootDeviceId: "canonical_unsigned_decimal",
        rootInode: "canonical_unsigned_decimal",
        rootModeFileType: "literal_directory",
        rootListingSha256:
          "plain_SHA256_of_listingHashPolicy_domain_and_exact_one-file typed record",
        rootEntryCount: "literal_1",
        fullVerifierEnforcementFileObservation:
          "exact_importedV2.schemas.fileObservation_at_VERIFIER_ENFORCEMENT_PATH",
        secureResolutionPassed: "literal_true",
        statReadStatStable: "literal_true",
        noExtraEntriesPassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "the_root_contains_exactly_one_regular_single-link_file_at_VERIFIER_ENFORCEMENT_PATH_and_no_directories_links_aliases_devices_sockets_fifos_or_mount-crossings",
        "the_file_observation_plain_sha256_and_byteLength_recompute_from_the_exact_raw_canonical_full-verifier-E_bytes_while_verifierFullEnforcementReceiptBinding_recomputes_separately_under_its_registered_domain",
        "this_observation_closes_before_assembler-ledger43_channel-and-launch;root_and_file_identity_remain_read-only_and_stable_through_assembler_exit-and-cgroup-empty",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_CLOSED_OUTPUT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.assembler_closed_output_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_assembler_closed_output_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "sameAttemptId",
        "assemblerLaunchEnvelopeBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "assemblerExitMonotonicNanoseconds",
        "assemblerCgroupEmptyMonotonicNanoseconds",
        "observationStartMonotonicNanoseconds",
        "observationEndMonotonicNanoseconds",
        "outputRootPrestateReceiptBinding",
        "requiredFileCount",
        "requiredFilePathOrder",
        "requiredDirectoryPathOrder",
        "fileObservations",
        "directoryObservations",
        "descriptorObservationOrdinal",
        "descriptorWasLastFilesystemWrite",
        "aggregateLogicalBytes",
        "closedInventoryPassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_assembler_closed_output/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        sameAttemptId: "exact_same_assembler_attempt",
        assemblerLaunchEnvelopeBinding:
          "exact_preexisting_assembler-launch binding",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        assemblerExitMonotonicNanoseconds: "canonical_unsigned_decimal",
        assemblerCgroupEmptyMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        observationEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        outputRootPrestateReceiptBinding:
          "exact_empty_prepared-output-root_receipt_from_five-root-preparation",
        requiredFileCount: "literal_33",
        requiredFilePathOrder: FINAL_OUTPUT_FILE_PATHS,
        requiredDirectoryPathOrder: FINAL_OUTPUT_DIRECTORY_PATHS,
        fileObservations: {
          kind: "tuple",
          exactLength: 33,
          exactAbsolutePathOrder: FINAL_OUTPUT_FILE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        directoryObservations: {
          kind: "tuple",
          exactLength: 5,
          exactAbsolutePathOrder: FINAL_OUTPUT_DIRECTORY_PATHS,
          itemSchema:
            "importedPrimitiveSchemaRegistry.schemas.directoryObservation",
          extraEntriesAllowed: false,
        },
        descriptorObservationOrdinal: "literal_32",
        descriptorWasLastFilesystemWrite: "literal_true",
        aggregateLogicalBytes:
          "exact_safe-integer_sum_of_all_33_fileObservations.byteLength",
        closedInventoryPassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "assemblerExit_is_not_after_cgroupEmpty_is_not_after_observationStart_is_not_after_observationEnd_and_observationEnd_is_strictly_before_deadline",
        "file0-through31_are_exclusive-O_EXCL_copies_of_the_exact_S32_input_bytes_in_inventory order and file32 is the exact schema-valid canonical descriptor written after every array and as the unique last filesystem write",
        "the_output-root_contains_exactly_the_five_declared_directories_and_33_regular_single-link files with no extras aliases links mount-crossings or namespace mutation",
        "all_files_and_directories_are_fsynced_and_closed_before_assembler_exit_and_the_broker_observation_occurs_only_after_exit-and-cgroup-empty",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_ASSEMBLER_ENFORCEMENT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.full_assembler_enforcement_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_full_assembler_enforcement_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "stageId",
        "sameAttemptId",
        "schedulerLeaseBinding",
        "assemblerWorkerAttemptBinding",
        "absoluteDeadlineReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "inputLedgerBinding",
        "launchEnvelopeBinding",
        "assemblerRuntimeChannelBinding",
        "quotaCapabilityBinding",
        "quotaSetupReceiptBinding",
        "seccompPolicyBinding",
        "seccompLoadReceiptBinding",
        "sourceManifestBinding",
        "toolchainManifestBinding",
        "ociImageDigest",
        "genericControlEvidence",
        "genericControlEvidenceBinding",
        "attestationRootLaunchObservationBinding",
        "attestationRootPreExecObservationBinding",
        "attestationRootBootstrapReadObservationBinding",
        "attestationRootPostExitObservationBinding",
        "numericS32LaunchObservationBinding",
        "numericS32PreExecObservationBinding",
        "numericS32BootstrapReadObservationBinding",
        "numericS32PostExitObservationBinding",
        "channelLaunchObservationBinding",
        "channelPreExecObservationBinding",
        "channelBootstrapReadObservationBinding",
        "channelPostExitObservationBinding",
        "closedOutputObservationBinding",
        "clockId",
        "monotonicStartNanoseconds",
        "monotonicEndNanoseconds",
        "exitCode",
        "cgroupPopulatedZero",
        "attestationRootWriterOrWritableAliasCount",
        "attestationRootNamespaceMutationCount",
        "numericRootWriterOrWritableAliasCount",
        "numericRootNamespaceMutationCount",
        "channelWriterOrWritableAliasCount",
        "channelNamespaceMutationCount",
        "networkDenied",
        "quotaAndDeadlinePassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_full_assembler_enforcement/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        stageId: "literal_trusted_descriptor_assembler",
        sameAttemptId: "exact_same_three-stage_run_attempt",
        schedulerLeaseBinding: "exact_same_trusted_scheduler lease",
        assemblerWorkerAttemptBinding:
          "exact_distinct_stage-scoped_attempt_issued_under_the_same_run-and-lease",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive_five-root-preparation binding",
        inputLedgerBinding: "exact_closed_44-entry_assembler-ledger binding",
        launchEnvelopeBinding: "exact_assembler-launch-envelope binding",
        assemblerRuntimeChannelBinding:
          "exact_launched-assembler-channel binding",
        quotaCapabilityBinding: "bound_assembler_quota capability",
        quotaSetupReceiptBinding: "positive_prelaunch_assembler quota receipt",
        seccompPolicyBinding: "bound_assembler_seccomp policy",
        seccompLoadReceiptBinding: "positive_preexec_assembler seccomp receipt",
        sourceManifestBinding: "bound_trusted-assembler_source manifest",
        toolchainManifestBinding: "bound_trusted-assembler_toolchain manifest",
        ociImageDigest: "exact_bound_linux_x86_64_oci_image digest",
        genericControlEvidence:
          "exact_value_valid_against_v3_genericStageControlEvidence_with_trusted_descriptor_assembler profile",
        genericControlEvidenceBinding:
          "exact_recomputed_binding_of_genericControlEvidence",
        attestationRootLaunchObservationBinding:
          "exact_attestation-root-poststate binding from launch envelope",
        attestationRootPreExecObservationBinding:
          "fresh_recursive-equal_preexec observation",
        attestationRootBootstrapReadObservationBinding:
          "fresh_recursive-equal_bootstrap-first-read observation",
        attestationRootPostExitObservationBinding:
          "fresh_recursive-equal_postexit-before-unmount observation",
        numericS32LaunchObservationBinding:
          "exact_read-only_S32 observation from launch envelope",
        numericS32PreExecObservationBinding:
          "fresh_recursive-equal_preexec_S32 observation",
        numericS32BootstrapReadObservationBinding:
          "fresh_recursive-equal_bootstrap-first-read_S32 observation",
        numericS32PostExitObservationBinding:
          "fresh_recursive-equal_postexit_S32 observation",
        channelLaunchObservationBinding:
          "exact_channel observation from launch envelope",
        channelPreExecObservationBinding:
          "fresh_recursive-equal_preexec_channel observation",
        channelBootstrapReadObservationBinding:
          "fresh_recursive-equal_bootstrap-first-read_channel observation",
        channelPostExitObservationBinding:
          "fresh_recursive-equal_postexit_channel observation",
        closedOutputObservationBinding:
          "exact_positive_assembler-closed-output binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        monotonicStartNanoseconds: "canonical_unsigned_decimal",
        monotonicEndNanoseconds: "canonical_unsigned_decimal",
        exitCode: "literal_0",
        cgroupPopulatedZero: "literal_true",
        attestationRootWriterOrWritableAliasCount: "literal_0",
        attestationRootNamespaceMutationCount: "literal_0",
        numericRootWriterOrWritableAliasCount: "literal_0",
        numericRootNamespaceMutationCount: "literal_0",
        channelWriterOrWritableAliasCount: "literal_0",
        channelNamespaceMutationCount: "literal_0",
        networkDenied: "literal_true",
        quotaAndDeadlinePassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "genericControlEvidence_recursively_equals_the_assembler-ledger_launch_channel_source-toolchain_quota_seccomp_deadline_and_O33 fields and selects_only_the_trusted-descriptor-assembler profile",
        "attestation-root_S32_and-channel identities_are_read-only_recursive-equal_at_launch_preexec_bootstrap-first-read_and_postexit_with_zero_writers_aliases_or_namespace mutations through cgroup-empty",
        "the_exact-one_attestation-root observation and ledger43 file observation name the_same full-verifier-E raw bytes and domain binding while assembler has no raw6 mount or observation",
        "O33_closes_after_descriptor-last write exit-and-cgroup-empty and before_this full-E;the receipt binds no future final-descriptor_container_projection_or-admission evidence",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_DESCRIPTOR_OBSERVATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.final_descriptor_observation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_final_descriptor_observation_schema/v1",
    descriptorInstanceBindingDomain: FINAL_DESCRIPTOR_INSTANCE_DOMAIN,
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "assemblerFullEnforcementReceiptBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
        "descriptorAbsolutePath",
        "descriptorFileObservation",
        "outputDescriptorSchemaBinding",
        "descriptorInstanceBinding",
        "canonicalByteLength",
        "canonicalPlainSha256",
        "rawBytesEqualRecanonicalizedUtf8",
        "descriptorWasLastFilesystemWrite",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_final_descriptor_observation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request binding",
        assemblerFullEnforcementReceiptBinding:
          "exact_positive_full-assembler-E binding closed before this phase",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        phaseStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        phaseEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        descriptorAbsolutePath: FINAL_DESCRIPTOR_PATH,
        descriptorFileObservation:
          "fresh_secure_post-E_importedV2.schemas.fileObservation",
        outputDescriptorSchemaBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        descriptorInstanceBinding:
          "exact_SHA256_of_descriptorInstanceBindingDomain_plus_schema-valid_recanonicalized_descriptor_UTF8",
        canonicalByteLength:
          "exact_descriptorFileObservation.byteLength_at_most_16MiB",
        canonicalPlainSha256:
          "exact_descriptorFileObservation.sha256_plain_hash",
        rawBytesEqualRecanonicalizedUtf8: "literal_true",
        descriptorWasLastFilesystemWrite: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "plain_SHA256_and_domain-separated_descriptorInstanceBinding_recompute_separately_from_the_same_exact_raw_schema-valid canonical bytes",
        "phase_starts_after_full-assembler-E_closes_phaseStart_is_not_after_phaseEnd_and_phaseEnd_is_strictly_before_deadline",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_CONTAINER_OBSERVATION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.final_container_observation_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_final_container_observation_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "assemblerFullEnforcementReceiptBinding",
        "assemblerClosedOutputObservationBinding",
        "finalDescriptorObservationBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
        "requiredFileCount",
        "requiredFilePathOrder",
        "requiredDirectoryPathOrder",
        "fileObservations",
        "directoryObservations",
        "descriptorObservationOrdinal",
        "descriptorWasLastFilesystemWrite",
        "closedInventoryPassed",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_final_container_observation/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request binding",
        assemblerFullEnforcementReceiptBinding:
          "exact_positive_full-assembler-E binding",
        assemblerClosedOutputObservationBinding: "exact_pre-E_O33 binding",
        finalDescriptorObservationBinding:
          "exact_preexisting_post-E_descriptor observation binding",
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        phaseStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        phaseEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        requiredFileCount: "literal_33",
        requiredFilePathOrder: FINAL_OUTPUT_FILE_PATHS,
        requiredDirectoryPathOrder: FINAL_OUTPUT_DIRECTORY_PATHS,
        fileObservations: {
          kind: "tuple",
          exactLength: 33,
          exactAbsolutePathOrder: FINAL_OUTPUT_FILE_PATHS,
          itemSchema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
          extraEntriesAllowed: false,
        },
        directoryObservations: {
          kind: "tuple",
          exactLength: 5,
          exactAbsolutePathOrder: FINAL_OUTPUT_DIRECTORY_PATHS,
          itemSchema:
            "importedPrimitiveSchemaRegistry.schemas.directoryObservation",
          extraEntriesAllowed: false,
        },
        descriptorObservationOrdinal: "literal_32",
        descriptorWasLastFilesystemWrite: "literal_true",
        closedInventoryPassed: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_33_file-and-five-directory_observations_are_fresh_post-full-assembler-E secure rereads recursively equal O33 identities sizes and hashes with exact-no-extra closure",
        "fileObservations32_recursively_equals_the_finalDescriptorObservation raw-file observation and all 32 array observations equal S32 bytes one-to-one",
        "descriptor phaseEnd is not after container phaseStart_container phaseStart is not after phaseEnd_and phaseEnd is strictly before deadline",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_PROJECTION_EQUALITY_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.final_projection_equality_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_final_projection_equality_schema/v1",
    seedV1ArrayHashPolicy: {
      domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .arraySha256Domain,
      recipe:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .arrayHashRecipe,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "compositeReplayBundleBinding",
        "candidateNWrapperBinding",
        "candidateFullSeedGateEvidenceBinding",
        "validatedFinalFullSeedAdmissionBinding",
        "finalDescriptorObservationBinding",
        "finalContainerObservationBinding",
        "clockId",
        "phaseStartMonotonicNanoseconds",
        "phaseEndMonotonicNanoseconds",
        "fieldComparisons",
        "arrayByteComparisons",
        "finalArrayBytesMatchObservedInventory",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_final_projection_equality/v1",
        successorRunPlanBinding: "exact_future_sealed_v3 binding",
        commonRunRequestBinding: "exact_same_common_request binding",
        compositeReplayBundleBinding:
          "exact_terminal-positive_composite binding",
        candidateNWrapperBinding: "exact_nested_positive-N-wrapper binding",
        candidateFullSeedGateEvidenceBinding:
          "exact_nested_gate-evidence-complete binding",
        validatedFinalFullSeedAdmissionBinding:
          "exact_postexit_final-F-match binding",
        finalDescriptorObservationBinding:
          "exact_post-E_descriptor observation binding",
        finalContainerObservationBinding:
          "exact_post-E_final-container observation binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        phaseStartMonotonicNanoseconds: "canonical_unsigned_decimal",
        phaseEndMonotonicNanoseconds: "canonical_unsigned_decimal",
        fieldComparisons: {
          kind: "tuple",
          exactLength: 6,
          exactPointerOrder: [
            [
              "/candidateFullSeedGateEvidenceOrNull/scalarMetadataOrNull",
              "/scalarMetadata",
            ],
            [
              "/candidateFullSeedGateEvidenceOrNull/serverRecomputedGateReportOrNull",
              "/serverRecomputedGateReport",
            ],
            [
              "/candidateFullSeedGateEvidenceOrNull/continuousNodelessProofReceiptOrNull",
              "/continuousNodelessProofReceipt",
            ],
            [
              "/candidateFullSeedGateEvidenceOrNull/continuousPeakProofReceiptOrNull",
              "/continuousPeakProofReceipt",
            ],
            [
              "/candidateFullSeedGateEvidenceOrNull/numericalOriginSeriesDefectReceiptOrNull",
              "/numericalOriginSeriesDefectReceipt",
            ],
            [
              "/candidateFullSeedGateEvidenceOrNull/observedArrayInventory",
              "/arrayInventory",
            ],
          ],
          itemExactKeys: [
            "ordinal",
            "sourceJsonPointer",
            "targetJsonPointer",
            "sourceCanonicalUtf8Sha256",
            "targetCanonicalUtf8Sha256",
            "canonicalBytesEqual",
            "recursiveValuesEqual",
          ],
          itemFields: {
            ordinal: "literal_same_index_0_through_5",
            sourceJsonPointer: "exact_source_pointer_at_ordinal",
            targetJsonPointer: "exact_target_pointer_at_ordinal",
            sourceCanonicalUtf8Sha256:
              "exact_plain_SHA256_of_the_source_value_recanonicalized_UTF8",
            targetCanonicalUtf8Sha256:
              "exact_plain_SHA256_of_the_target_value_recanonicalized_UTF8",
            canonicalBytesEqual: "literal_true",
            recursiveValuesEqual: "literal_true",
          },
          itemExtraKeysAllowed: false,
          extraEntriesAllowed: false,
        },
        arrayByteComparisons: {
          kind: "tuple",
          exactLength: 32,
          order: "inventoryIndex_ascending_0_through_31",
          itemExactKeys: [
            "inventoryIndex",
            "sourceStagingAbsolutePath",
            "finalOutputAbsolutePath",
            "relativePath",
            "role",
            "byteLength",
            "sourceStagingPlainSha256",
            "numericManifestRawArraySha256",
            "finalOutputPlainSha256",
            "seedV1ArrayDomainSha256",
            "descriptorInventorySha256",
            "rawBytesEqual",
            "allHashRecipesRecomputed",
          ],
          itemFields: {
            inventoryIndex: "literal_same_index_0_through_31",
            sourceStagingAbsolutePath: "literal_frozen_S32_path_at_index",
            finalOutputAbsolutePath:
              "literal_frozen_final-output_path_at_index",
            relativePath: "literal_seed-v1_inventory_relativePath_at_index",
            role: "literal_seed-v1_inventory_role_at_index",
            byteLength: "literal_seed-v1_inventory_byteLength_at_index",
            sourceStagingPlainSha256:
              "plain_SHA256_of_the_securely_reread_S32_raw_bytes",
            numericManifestRawArraySha256:
              "exact_equal_plain_SHA256_from_the_nested_numeric_N32_manifest",
            finalOutputPlainSha256:
              "plain_SHA256_of_the_securely_reread_final-output_raw_bytes",
            seedV1ArrayDomainSha256:
              "independently_recomputed_SHA256_under_seedV1ArrayHashPolicy_from_relativePath_role_byteLength_and_the_same_final-output_raw_bytes",
            descriptorInventorySha256:
              "exact_seed-v1_domain_SHA256_from_the_schema-valid_descriptor_arrayInventory_entry",
            rawBytesEqual: "literal_true",
            allHashRecipesRecomputed: "literal_true",
          },
          itemExtraKeysAllowed: false,
          extraEntriesAllowed: false,
        },
        finalArrayBytesMatchObservedInventory: "literal_true",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_six_source values are extracted from the exact nested terminal gate-evidence and positive-N chain while targets are extracted from the securely reread schema-valid descriptor;each pair is independently recanonicalized and byte-equal",
        "all_32_final-array_raw-bytes_equal_the_corresponding_S32_bytes;S32_N32_and_final-file-observation_plain_SHA256_values_are_equal_while_descriptorInventory.sha256_is_not_plain and instead equals an independent seed-v1 length-delimited path-role-byteLength-domain digest recomputed from those same bytes",
        "projection phase starts after final-container observation closes_and_ends strictly before deadline",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.final_artifact_binding_receipt_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_final_artifact_binding_receipt_schema/v1",
    importedSeedV1ArtifactHashPolicy: {
      artifactKind:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .artifactKind,
      sha256Domain:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .sha256Domain,
      artifactHashRecipe:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
          .artifactHashRecipe,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "finalDescriptorObservationBinding",
        "finalContainerObservationBinding",
        "finalProjectionEqualityReceiptBinding",
        "outputDescriptorSchemaBinding",
        "absoluteDeadlineReceiptBinding",
        "clockId",
        "formationMonotonicNanoseconds",
        "canonicalDescriptorPlainSha256",
        "finalArtifactBinding",
        "arrayInventoryClosesAll32FinalArrayBytes",
        "artifactIdentityFormed",
        "artifactAccepted",
        "scientificAdmissionGranted",
        "physicalAuthorityGranted",
        "propulsionAuthorityGranted",
        "transportAuthorityGranted",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_final_artifact_binding_receipt/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        commonRunRequestBinding: "exact_same_common_request_binding",
        finalDescriptorObservationBinding:
          "exact_positive_schema-valid_final-descriptor_observation_binding",
        finalContainerObservationBinding:
          "exact_positive_exact33-and-five-directory_final-container binding",
        finalProjectionEqualityReceiptBinding:
          "exact_positive_descriptor-and-array_projection-equality binding",
        outputDescriptorSchemaBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        absoluteDeadlineReceiptBinding: "exact_preexisting_deadline_binding",
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        formationMonotonicNanoseconds: "canonical_unsigned_decimal",
        canonicalDescriptorPlainSha256:
          "exact_plain_SHA256_from_finalDescriptorObservation_over_the_same_raw_canonical_UTF8_bytes",
        finalArtifactBinding: {
          kind: "object",
          exactKeys: [
            "artifactKind",
            "sha256Domain",
            "canonicalDescriptorUtf8ByteLength",
            "sha256",
          ],
          extraKeysAllowed: false,
          fields: {
            artifactKind:
              NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
                .artifactKind,
            sha256Domain:
              NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1.outputArtifactPolicy
                .sha256Domain,
            canonicalDescriptorUtf8ByteLength:
              "exact_finalDescriptorObservation.canonicalByteLength",
            sha256:
              "exact_SHA256_of_utf8_sha256Domain_then_0x0a_then_u64be_canonicalDescriptorUtf8ByteLength_then_the_exact_same_raw_schema-valid_canonical_descriptor_UTF8_bytes",
          },
        },
        arrayInventoryClosesAll32FinalArrayBytes: "literal_true",
        artifactIdentityFormed: "literal_true",
        artifactAccepted:
          "literal_false_until_the_later_finalAdmission_receipt",
        scientificAdmissionGranted: "literal_false",
        physicalAuthorityGranted: "literal_false",
        propulsionAuthorityGranted: "literal_false",
        transportAuthorityGranted: "literal_false",
        allPassed: "literal_true",
      },
      forbiddenKeys: ["finalAdmissionReceiptBinding", "seedArtifactAccepted"],
      crossFieldInvariants: [
        "finalArtifactBinding.sha256_recomputes_under_the_exact_imported_seed-v1_outputArtifactPolicy.artifactHashRecipe_from_the_same_raw_descriptor_bytes_used_for_plain_SHA256_and_the_distinct_v3_descriptorInstanceBinding;none_of_the_three_digests_is_substituted_for_another",
        "the_schema-valid_descriptor_arrayInventory_domain-hashes_and_byteLengths_together_with_finalProjectionEqualityReceiptBinding_close_all_32_securely-reread_final-array bytes",
        "formation_occurs_after_final-projection-equality_and_strictly_before_deadline_but_does_not_predict_or_grant_the_later_final-admission_artifact_acceptance",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ADMISSION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.final_admission_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_final_admission_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "commonRunRequestBinding",
        "absoluteDeadlineReceiptBinding",
        "fiveRootPreparationReceiptBinding",
        "producerFullEnforcementReceiptBinding",
        "verifierFullEnforcementReceiptBinding",
        "assemblerFullEnforcementReceiptBinding",
        "compositeReplayBundleBinding",
        "typedInterpreterValidationReceiptBinding",
        "atomicNestedRegistrationReceiptBinding",
        "finalDescriptorObservationBinding",
        "finalContainerObservationBinding",
        "finalProjectionEqualityReceiptBinding",
        "finalArtifactBindingReceipt",
        "finalArtifactBindingReceiptBinding",
        "outputDescriptorSchemaBinding",
        "clockId",
        "admissionMonotonicNanoseconds",
        "threeStageQuotaDeviceProjectPairsDistinct",
        "seedArtifactAccepted",
        "physicalAuthorityGranted",
        "propulsionAuthorityGranted",
        "transportAuthorityGranted",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_final_admission/v1",
        successorRunPlanBinding: "exact_future_sealed_v3 binding",
        commonRunRequestBinding: "exact_same_common_request binding",
        absoluteDeadlineReceiptBinding: "exact_preexisting deadline binding",
        fiveRootPreparationReceiptBinding:
          "exact_positive five-root-preparation binding",
        producerFullEnforcementReceiptBinding:
          "exact_positive full-producer-E binding",
        verifierFullEnforcementReceiptBinding:
          "exact_positive full-verifier-E binding",
        assemblerFullEnforcementReceiptBinding:
          "exact_positive full-assembler-E binding",
        compositeReplayBundleBinding:
          "exact_terminal-positive composite binding",
        typedInterpreterValidationReceiptBinding:
          "exact_terminal-positive typed-interpretation binding",
        atomicNestedRegistrationReceiptBinding:
          "exact_terminal-three-node atomic-registration binding",
        finalDescriptorObservationBinding:
          "exact_positive descriptor observation binding",
        finalContainerObservationBinding:
          "exact_positive final-container binding",
        finalProjectionEqualityReceiptBinding:
          "exact_positive descriptor-and-array projection binding",
        finalArtifactBindingReceipt:
          "exact_self-contained_value_valid_against_v3_finalArtifactBindingReceipt_with_artifactAccepted_false",
        finalArtifactBindingReceiptBinding:
          "exact_recomputed_binding_of_the_embedded_final-artifact-binding receipt",
        outputDescriptorSchemaBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        clockId: "literal_CLOCK_MONOTONIC_RAW",
        admissionMonotonicNanoseconds: "canonical_unsigned_decimal",
        threeStageQuotaDeviceProjectPairsDistinct: "literal_true",
        seedArtifactAccepted: "literal_true",
        physicalAuthorityGranted: "literal_false",
        propulsionAuthorityGranted: "literal_false",
        transportAuthorityGranted: "literal_false",
        allPassed: "literal_true",
      },
      crossFieldInvariants: [
        "all_bindings_resolve_to_one_run_attempt_three-stage enforcement chain candidate identity terminal composite accepted interpreter atomic P-N-F registration exact output bytes and one seed-v1-policy finalArtifactBinding",
        "descriptor_phaseEnd_is_not_after_container_phaseStart_container_phaseEnd_is_not_after_projection phaseStart_projection phaseEnd_is_not_after_finalArtifactBindingReceipt.formationMonotonicNanoseconds_which_is_not_after_admission_and admission is strictly before deadline",
        "the_three_quota-device-project pairs are pairwise distinct and each full-E proves inherited project quota seccomp capability resource and cgroup-empty controls",
        "seedArtifactAccepted grants only this frozen diagnostic seed artifact acceptance and never physical propulsion transport Casimir source or spacetime viability authority",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.runtime_instance_interpretation_rejection_schema",
    schemaVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_runtime_instance_interpretation_rejection_schema/v1",
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "successorRunPlanBinding",
        "evidenceSchemaRegistryBinding",
        "runtimeProfile",
        "attemptedFileObservationOrNull",
        "attemptedInstanceBindingOrNull",
        "declaredByteLengthOrNull",
        "observedByteLengthOrNull",
        "maximumCanonicalUtf8BytesOrNull",
        "failureCode",
        "firstJsonPointerOrNull",
        "firstByteOffsetOrNull",
        "canonicalizationCompleted",
        "bindingCreated",
        "interpretationAccepted",
        "registrationAllowed",
        "executionAuthorized",
        "seedAdmissionGranted",
        "artifactAccepted",
        "scientificAdmissionGranted",
        "physicalAuthorityGranted",
        "propulsionAuthorityGranted",
        "transportAuthorityGranted",
        "allPassed",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion:
          "literal_nhm2_prolate_boson_star_newtonian_seed_v3_runtime_instance_interpretation_rejection/v1",
        successorRunPlanBinding: "exact_future_sealed_v3_binding",
        evidenceSchemaRegistryBinding:
          "exact_future_sealed_v3_registry_binding",
        runtimeProfile:
          "one_exact_known_runtime-profile_key_or_the_exact_untrusted_nonempty_string_that_triggered_unknown_runtime_profile",
        attemptedFileObservationOrNull:
          "exact_secure_fileObservation_if_formable_else_null",
        attemptedInstanceBindingOrNull:
          "untrusted_asserted_binding_if_present_else_null_never_accepted_or_registered",
        declaredByteLengthOrNull:
          "nonnegative_safe_integer_from_lstat_or_null_if_unavailable",
        observedByteLengthOrNull:
          "nonnegative_safe_integer_stream-count_or_null_if_read_never_started",
        maximumCanonicalUtf8BytesOrNull:
          "exact_literal_cap_selected_by_a_known_runtimeProfile_or_null_exactly_for_unknown_runtime_profile",
        failureCode: "one_literal_from_failureCodeEnum",
        firstJsonPointerOrNull:
          "RFC6901_pointer_to_first_structural_failure_or_null_for_preparse_file_failure",
        firstByteOffsetOrNull:
          "nonnegative_safe_integer_first_failure_offset_or_null_when_unavailable",
        canonicalizationCompleted:
          "literal_true_for_raw-canonical-mismatch_or_post-canonical_schema-union_cross-field-or-asserted-binding_mismatch_and_literal_false_for_pre-read_or_tokenizer_failures",
        bindingCreated: "literal_false",
        interpretationAccepted: "literal_false",
        registrationAllowed: "literal_false",
        executionAuthorized: "literal_false",
        seedAdmissionGranted: "literal_false",
        artifactAccepted: "literal_false",
        scientificAdmissionGranted: "literal_false",
        physicalAuthorityGranted: "literal_false",
        propulsionAuthorityGranted: "literal_false",
        transportAuthorityGranted: "literal_false",
        allPassed: "literal_false",
      },
      failureCodeEnum: [
        "file_size_cap_exceeded",
        "maximum_depth_exceeded",
        "maximum_total_nodes_exceeded",
        "maximum_total_object_keys_exceeded",
        "maximum_keys_per_object_exceeded",
        "maximum_array_length_exceeded",
        "maximum_string_utf8_bytes_exceeded",
        "maximum_numeric_token_bytes_exceeded",
        "duplicate_object_key",
        "invalid_json_token_or_encoding",
        "negative_zero_forbidden",
        "raw_bytes_not_equal_recanonicalized_utf8",
        "secure_file_resolution_or_identity_changed",
        "declared_observed_size_or_unexpected_eof",
        "unknown_runtime_profile",
        "exact_schema_or_union_profile_mismatch",
        "cross_field_invariant_mismatch",
        "asserted_instance_binding_mismatch",
      ],
      deterministicFailurePrecedence: [
        "unknown_runtime_profile",
        "secure_file_resolution_or_identity_changed",
        "declared_observed_size_or_unexpected_eof",
        "file_size_cap_exceeded",
        "maximum_depth_exceeded",
        "maximum_total_nodes_exceeded",
        "maximum_total_object_keys_exceeded",
        "maximum_keys_per_object_exceeded",
        "maximum_array_length_exceeded",
        "maximum_string_utf8_bytes_exceeded",
        "maximum_numeric_token_bytes_exceeded",
        "duplicate_object_key",
        "invalid_json_token_or_encoding",
        "negative_zero_forbidden",
        "raw_bytes_not_equal_recanonicalized_utf8",
        "exact_schema_or_union_profile_mismatch",
        "cross_field_invariant_mismatch",
        "asserted_instance_binding_mismatch",
      ],
      failureProfiles: {
        raw_bytes_not_equal_recanonicalized_utf8: {
          parseCompleted: true,
          boundedStructureValidationCompleted: true,
          canonicalizationCompleted: true,
          bindingCreated: false,
        },
        postCanonicalValidationFailureCodes: {
          codes: [
            "exact_schema_or_union_profile_mismatch",
            "cross_field_invariant_mismatch",
            "asserted_instance_binding_mismatch",
          ],
          parseCompleted: true,
          boundedStructureValidationCompleted: true,
          canonicalizationCompleted: true,
          bindingCreated: false,
        },
        preReadOrTokenizerFailureCodes: {
          codes: [
            "file_size_cap_exceeded",
            "maximum_depth_exceeded",
            "maximum_total_nodes_exceeded",
            "maximum_total_object_keys_exceeded",
            "maximum_keys_per_object_exceeded",
            "maximum_array_length_exceeded",
            "maximum_string_utf8_bytes_exceeded",
            "maximum_numeric_token_bytes_exceeded",
            "duplicate_object_key",
            "invalid_json_token_or_encoding",
            "negative_zero_forbidden",
            "secure_file_resolution_or_identity_changed",
            "declared_observed_size_or_unexpected_eof",
          ],
          canonicalizationCompleted: false,
          bindingCreated: false,
        },
        unknown_runtime_profile: {
          runtimeProfile: "unrecognized_nonempty_string",
          attemptedFileObservationOrNull: null,
          attemptedInstanceBindingOrNull: null,
          declaredByteLengthOrNull: null,
          observedByteLengthOrNull: null,
          maximumCanonicalUtf8BytesOrNull: null,
          firstJsonPointerOrNull: null,
          firstByteOffsetOrNull: null,
          canonicalizationCompleted: false,
          bindingCreated: false,
          interpretationAccepted: false,
          registrationAllowed: false,
          executionAuthorized: false,
          seedAdmissionGranted: false,
          artifactAccepted: false,
          scientificAdmissionGranted: false,
          physicalAuthorityGranted: false,
          propulsionAuthorityGranted: false,
          transportAuthorityGranted: false,
          allPassed: false,
        },
      },
      crossFieldInvariants: [
        "file_size_cap_exceeded_is_emitted_after_lstat_or_by_reading_exactly_one_bounded_sentinel_byte_at_cap-plus-one_before_allocation_or_parse_and_never_after_truncation;observedByteLengthOrNull_is_at_most_maximumCanonicalUtf8BytesOrNull_plus_one_on_that_known-profile path",
        "unknown_runtime_profile_has_no_selected_cap_maximumCanonicalUtf8BytesOrNull_is_null_and_no_file_read_parse_canonicalization_binding_or_registration_begins",
        "every_structural_failure_is_emitted_by_the_bounded_duplicate-aware tokenizer_before_materializing_an_over-budget_node_or_collection",
        "canonicalizationCompleted_is_true_for_raw_bytes_not_equal_recanonicalized_utf8_and_for_the_three_post-canonical_schema-union_cross-field-or-asserted-binding_mismatch_codes_and_is_false_for_every_pre-read_or-tokenizer rejection",
        "when_multiple_failures_are_observable_the_emitted_failureCode_is_the_first_exact_entry_in_deterministicFailurePrecedence;the_event-order_is_unknown-profile_before_secure-pre-read-identity_before_declared-or-observed-size-and-cap-sentinel before tokenizer structural rails in_the_listed_order before raw-canonical equality before exact-schema-or-union before cross-field invariants before asserted-instance-binding equality",
        "no_failure_variant_creates_a_domain binding canonical value interpreter acceptance registration execution artifact scientific physical propulsion or transport authority",
      ],
    },
  } as const);

const V3_RUNTIME_DOMAINS = deepFreeze({
  rootPrestateReceiptInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-root-prestate-receipt/v1\n",
  numericStaging32RootPostStateInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-numeric-staging32-root-poststate/v1\n",
  replayRootPostStateInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-replay-root-poststate/v1\n",
  fiveRootPreparationInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-five-root-preparation/v1\n",
  producerClosedOutput38Instance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-closed-output38/v1\n",
  fullProducerEnforcementInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-producer-enforcement/v1\n",
  genericStageControlEvidenceInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-generic-stage-control-evidence/v1\n",
  secureStaging32ObservationInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-secure-staging32-observation/v1\n",
  secureRawEvidence6ObservationInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-secure-raw-evidence6-observation/v1\n",
  postexitSecureStaging32RereadInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-secure-staging32-reread/v1\n",
  postexitSecureRawEvidence6RereadInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-secure-raw-evidence6-reread/v1\n",
  producerNumericImplementationInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-numeric-implementation/v1\n",
  stageRuntimeConformanceInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-stage-runtime-conformance/v1\n",
  numericStaging32CompositeInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-numeric-staging32-composite/v1\n",
  rawEvidence6CompositeInstance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-raw-evidence6-composite/v1\n",
  candidateInstanceIdentity:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-instance-identity/v1\n",
  producerInputLedger:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-input-ledger/v1\n",
  verifierInputLedger:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-input-ledger/v1\n",
  assemblerInputLedger:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-input-ledger/v1\n",
  producerLaunchEnvelope:
    "nhm2-prolate-boson-star-newtonian-seed-v3-producer-launch-envelope/v1\n",
  verifierLaunchEnvelope:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-launch-envelope/v1\n",
  assemblerLaunchEnvelope:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-launch-envelope/v1\n",
  verifierRuntimeChannel:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-runtime-channel/v1\n",
  verifierPrelaunchContextRejection:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-prelaunch-context-rejection/v1\n",
  verifierChannelObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-channel-observation/v1\n",
  candidateFullSeedGateEvidence:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-full-seed-gate-evidence/v1\n",
  untrustedCandidatePWrapper:
    "nhm2-prolate-boson-star-newtonian-seed-v3-untrusted-candidate-P-wrapper/v1\n",
  candidateNWrapper:
    "nhm2-prolate-boson-star-newtonian-seed-v3-candidate-N-wrapper/v1\n",
  postexitPostprojectionAcceptance:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-postprojection-acceptance/v1\n",
  postexitFinalFullSeedAdmission:
    "nhm2-prolate-boson-star-newtonian-seed-v3-postexit-final-full-seed-admission/v1\n",
  compositeReplayBundle:
    "nhm2-prolate-boson-star-newtonian-seed-v3-composite-replay-bundle/v1\n",
  verifierClosedOutput:
    "nhm2-prolate-boson-star-newtonian-seed-v3-verifier-closed-output/v1\n",
  fullVerifierEnforcement:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-verifier-enforcement/v1\n",
  brokerRuntimeSeparation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-broker-runtime-separation/v1\n",
  typedInterpreterValidation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-typed-interpreter-validation/v1\n",
  atomicNestedRegistration:
    "nhm2-prolate-boson-star-newtonian-seed-v3-atomic-nested-registration/v1\n",
  assemblerRuntimeChannel:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-runtime-channel/v1\n",
  assemblerChannelObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-channel-observation/v1\n",
  attestationRootPostState:
    "nhm2-prolate-boson-star-newtonian-seed-v3-attestation-root-poststate/v1\n",
  assemblerClosedOutput:
    "nhm2-prolate-boson-star-newtonian-seed-v3-assembler-closed-output/v1\n",
  fullAssemblerEnforcement:
    "nhm2-prolate-boson-star-newtonian-seed-v3-full-assembler-enforcement/v1\n",
  finalDescriptorInstance: FINAL_DESCRIPTOR_INSTANCE_DOMAIN,
  finalDescriptorObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-descriptor-observation/v1\n",
  finalContainerObservation:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-container-observation/v1\n",
  finalProjectionEquality:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-projection-equality/v1\n",
  finalArtifactBindingReceipt:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-artifact-binding-receipt/v1\n",
  finalAdmission:
    "nhm2-prolate-boson-star-newtonian-seed-v3-final-admission/v1\n",
  runtimeInstanceInterpretationRejection:
    "nhm2-prolate-boson-star-newtonian-seed-v3-runtime-instance-interpretation-rejection/v1\n",
});

const FIVE_ROOT_PREPARATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FIVE_ROOT_PREPARATION_SCHEMA,
  V3_SCHEMA_DOMAINS.fiveRootPreparation,
);
const ROOT_PRESTATE_RECEIPT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ROOT_PRESTATE_RECEIPT_SCHEMA,
  V3_SCHEMA_DOMAINS.rootPrestateReceipt,
);
const NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA,
  V3_SCHEMA_DOMAINS.numericStaging32RootPostState,
);
const REPLAY_ROOT_POST_STATE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_REPLAY_ROOT_POST_STATE_SCHEMA,
  V3_SCHEMA_DOMAINS.replayRootPostState,
);
const PRODUCER_CLOSED_OUTPUT38_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_CLOSED_OUTPUT38_SCHEMA,
  V3_SCHEMA_DOMAINS.producerClosedOutput38,
);
const FULL_PRODUCER_ENFORCEMENT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_PRODUCER_ENFORCEMENT_SCHEMA,
  V3_SCHEMA_DOMAINS.fullProducerEnforcement,
);
const GENERIC_STAGE_CONTROL_EVIDENCE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_GENERIC_STAGE_CONTROL_EVIDENCE_SCHEMA,
  V3_SCHEMA_DOMAINS.genericStageControlEvidence,
);
const SECURE_STAGING32_OBSERVATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_STAGING32_OBSERVATION_SCHEMA,
  V3_SCHEMA_DOMAINS.secureStaging32Observation,
);
const SECURE_RAW_EVIDENCE6_OBSERVATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_RAW_EVIDENCE6_OBSERVATION_SCHEMA,
  V3_SCHEMA_DOMAINS.secureRawEvidence6Observation,
);
const POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA,
  V3_SCHEMA_DOMAINS.postexitSecureStaging32Reread,
);
const POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA,
  V3_SCHEMA_DOMAINS.postexitSecureRawEvidence6Reread,
);
const PRODUCER_NUMERIC_IMPLEMENTATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_NUMERIC_IMPLEMENTATION_SCHEMA,
  V3_SCHEMA_DOMAINS.producerNumericImplementation,
);
const STAGE_RUNTIME_CONFORMANCE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_RUNTIME_CONFORMANCE_SCHEMA,
  V3_SCHEMA_DOMAINS.stageRuntimeConformance,
);
const NUMERIC_STAGING32_COMPOSITE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA,
  V3_SCHEMA_DOMAINS.numericStaging32Composite,
);
const RAW_EVIDENCE6_COMPOSITE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA,
  V3_SCHEMA_DOMAINS.rawEvidence6Composite,
);
const CANDIDATE_INSTANCE_IDENTITY_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_INSTANCE_IDENTITY_SCHEMA,
  V3_SCHEMA_DOMAINS.candidateInstanceIdentity,
);
const STAGE_INPUT_LEDGER_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INPUT_LEDGER_SCHEMA,
  V3_SCHEMA_DOMAINS.stageInputLedger,
);
const STAGE_LAUNCH_ENVELOPE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_LAUNCH_ENVELOPE_SCHEMA,
  V3_SCHEMA_DOMAINS.stageLaunchEnvelope,
);
const VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
  V3_SCHEMA_DOMAINS.verifierRuntimeChannel,
);
const VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA,
  V3_SCHEMA_DOMAINS.verifierPrelaunchContextRejection,
);
const UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA,
  V3_SCHEMA_DOMAINS.untrustedCandidatePWrapper,
);
const CANDIDATE_N_WRAPPER_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA,
  V3_SCHEMA_DOMAINS.candidateNWrapper,
);
const POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA,
  V3_SCHEMA_DOMAINS.postexitPostprojectionAcceptance,
);
const POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA,
  V3_SCHEMA_DOMAINS.postexitFinalFullSeedAdmission,
);
const CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA,
  V3_SCHEMA_DOMAINS.candidateFullSeedGateEvidence,
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA_BINDING =
  bindSchema(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
    V3_SCHEMA_DOMAINS.compositeReplayBundle,
  );
const VERIFIER_CLOSED_OUTPUT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_CLOSED_OUTPUT_SCHEMA,
  V3_SCHEMA_DOMAINS.verifierClosedOutput,
);
const FULL_VERIFIER_ENFORCEMENT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_VERIFIER_ENFORCEMENT_SCHEMA,
  V3_SCHEMA_DOMAINS.fullVerifierEnforcement,
);
const BROKER_RUNTIME_SEPARATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BROKER_RUNTIME_SEPARATION_SCHEMA,
  V3_SCHEMA_DOMAINS.brokerRuntimeSeparation,
);
const TYPED_INTERPRETER_VALIDATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA,
  V3_SCHEMA_DOMAINS.typedInterpreterValidation,
);
const ATOMIC_NESTED_REGISTRATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATOMIC_NESTED_REGISTRATION_SCHEMA,
  V3_SCHEMA_DOMAINS.atomicNestedRegistration,
);
const ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
  V3_SCHEMA_DOMAINS.assemblerRuntimeChannel,
);
const ATTESTATION_ROOT_POST_STATE_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATTESTATION_ROOT_POST_STATE_SCHEMA,
  V3_SCHEMA_DOMAINS.attestationRootPostState,
);
const ASSEMBLER_CLOSED_OUTPUT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_CLOSED_OUTPUT_SCHEMA,
  V3_SCHEMA_DOMAINS.assemblerClosedOutput,
);
const FULL_ASSEMBLER_ENFORCEMENT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_ASSEMBLER_ENFORCEMENT_SCHEMA,
  V3_SCHEMA_DOMAINS.fullAssemblerEnforcement,
);
const FINAL_DESCRIPTOR_OBSERVATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_DESCRIPTOR_OBSERVATION_SCHEMA,
  V3_SCHEMA_DOMAINS.finalDescriptorObservation,
);
const FINAL_CONTAINER_OBSERVATION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_CONTAINER_OBSERVATION_SCHEMA,
  V3_SCHEMA_DOMAINS.finalContainerObservation,
);
const FINAL_PROJECTION_EQUALITY_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_PROJECTION_EQUALITY_SCHEMA,
  V3_SCHEMA_DOMAINS.finalProjectionEquality,
);
const FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA,
  V3_SCHEMA_DOMAINS.finalArtifactBindingReceipt,
);
const FINAL_ADMISSION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ADMISSION_SCHEMA,
  V3_SCHEMA_DOMAINS.finalAdmission,
);
const RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA_BINDING = bindSchema(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA,
  V3_SCHEMA_DOMAINS.runtimeInstanceInterpretationRejection,
);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS =
  deepFreeze({
    rootPrestateReceipt: ROOT_PRESTATE_RECEIPT_SCHEMA_BINDING,
    numericStaging32RootPostState:
      NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA_BINDING,
    replayRootPostState: REPLAY_ROOT_POST_STATE_SCHEMA_BINDING,
    fiveRootPreparation: FIVE_ROOT_PREPARATION_SCHEMA_BINDING,
    producerClosedOutput38: PRODUCER_CLOSED_OUTPUT38_SCHEMA_BINDING,
    fullProducerEnforcement: FULL_PRODUCER_ENFORCEMENT_SCHEMA_BINDING,
    genericStageControlEvidence: GENERIC_STAGE_CONTROL_EVIDENCE_SCHEMA_BINDING,
    secureStaging32Observation: SECURE_STAGING32_OBSERVATION_SCHEMA_BINDING,
    secureRawEvidence6Observation:
      SECURE_RAW_EVIDENCE6_OBSERVATION_SCHEMA_BINDING,
    postexitSecureStaging32Reread:
      POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA_BINDING,
    postexitSecureRawEvidence6Reread:
      POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA_BINDING,
    producerNumericImplementation:
      PRODUCER_NUMERIC_IMPLEMENTATION_SCHEMA_BINDING,
    stageRuntimeConformance: STAGE_RUNTIME_CONFORMANCE_SCHEMA_BINDING,
    numericStaging32Composite: NUMERIC_STAGING32_COMPOSITE_SCHEMA_BINDING,
    rawEvidence6Composite: RAW_EVIDENCE6_COMPOSITE_SCHEMA_BINDING,
    candidateInstanceIdentity: CANDIDATE_INSTANCE_IDENTITY_SCHEMA_BINDING,
    stageInputLedger: STAGE_INPUT_LEDGER_SCHEMA_BINDING,
    stageLaunchEnvelope: STAGE_LAUNCH_ENVELOPE_SCHEMA_BINDING,
    verifierRuntimeChannel: VERIFIER_RUNTIME_CHANNEL_SCHEMA_BINDING,
    verifierPrelaunchContextRejection:
      VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA_BINDING,
    untrustedCandidatePWrapper: UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA_BINDING,
    candidateNWrapper: CANDIDATE_N_WRAPPER_SCHEMA_BINDING,
    postexitPostprojectionAcceptance:
      POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA_BINDING,
    postexitFinalFullSeedAdmission:
      POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA_BINDING,
    candidateFullSeedGateEvidence:
      CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA_BINDING,
    compositeReplayBundle:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA_BINDING,
    verifierClosedOutput: VERIFIER_CLOSED_OUTPUT_SCHEMA_BINDING,
    fullVerifierEnforcement: FULL_VERIFIER_ENFORCEMENT_SCHEMA_BINDING,
    brokerRuntimeSeparation: BROKER_RUNTIME_SEPARATION_SCHEMA_BINDING,
    typedInterpreterValidation: TYPED_INTERPRETER_VALIDATION_SCHEMA_BINDING,
    atomicNestedRegistration: ATOMIC_NESTED_REGISTRATION_SCHEMA_BINDING,
    assemblerRuntimeChannel: ASSEMBLER_RUNTIME_CHANNEL_SCHEMA_BINDING,
    attestationRootPostState: ATTESTATION_ROOT_POST_STATE_SCHEMA_BINDING,
    assemblerClosedOutput: ASSEMBLER_CLOSED_OUTPUT_SCHEMA_BINDING,
    fullAssemblerEnforcement: FULL_ASSEMBLER_ENFORCEMENT_SCHEMA_BINDING,
    finalDescriptorObservation: FINAL_DESCRIPTOR_OBSERVATION_SCHEMA_BINDING,
    finalContainerObservation: FINAL_CONTAINER_OBSERVATION_SCHEMA_BINDING,
    finalProjectionEquality: FINAL_PROJECTION_EQUALITY_SCHEMA_BINDING,
    finalArtifactBindingReceipt: FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA_BINDING,
    finalAdmission: FINAL_ADMISSION_SCHEMA_BINDING,
    runtimeInstanceInterpretationRejection:
      RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA_BINDING,
  } as const);

const MIB = 1024 * 1024;
const V3_RUNTIME_PROFILE_CANONICAL_UTF8_CAPS = deepFreeze({
  rootPrestateReceipt: 2 * MIB,
  numericStaging32RootPostState: 2 * MIB,
  replayRootPostState: 2 * MIB,
  fiveRootPreparation: 2 * MIB,
  producerClosedOutput38: 4 * MIB,
  fullProducerEnforcement: 8 * MIB,
  genericStageControlEvidence: 8 * MIB,
  secureStaging32Observation: 4 * MIB,
  secureRawEvidence6Observation: 2 * MIB,
  postexitSecureStaging32Reread: 4 * MIB,
  postexitSecureRawEvidence6Reread: 2 * MIB,
  producerNumericImplementation: 2 * MIB,
  producerStageRuntimeConformance: 2 * MIB,
  verifierStageRuntimeConformance: 2 * MIB,
  numericStaging32Composite: 8 * MIB,
  rawEvidence6Composite: 4 * MIB,
  candidateInstanceIdentity: 24 * MIB,
  producerInputLedger: 4 * MIB,
  verifierInputLedger: 8 * MIB,
  assemblerInputLedger: 8 * MIB,
  producerLaunchEnvelope: 4 * MIB,
  verifierLaunchEnvelope: 4 * MIB,
  assemblerLaunchEnvelope: 4 * MIB,
  verifierRuntimeChannel: 32 * MIB,
  verifierPrelaunchContextRejection: 2 * MIB,
  untrustedCandidatePWrapper: 32 * MIB,
  candidateNWrapper: 32 * MIB,
  postexitPostprojectionAcceptance: 4 * MIB,
  postexitFinalFullSeedAdmission: 4 * MIB,
  compositeReplayBundle: 32 * MIB,
  candidateFullSeedGateEvidence: 32 * MIB,
  verifierClosedOutput: 4 * MIB,
  verifierChannelObservation: 2 * MIB,
  fullVerifierEnforcement: 8 * MIB,
  brokerRuntimeSeparation: 4 * MIB,
  typedInterpreterValidation: 8 * MIB,
  atomicNestedRegistration: 4 * MIB,
  assemblerRuntimeChannel: 8 * MIB,
  assemblerChannelObservation: 2 * MIB,
  attestationRootPostState: 2 * MIB,
  assemblerClosedOutput: 4 * MIB,
  fullAssemblerEnforcement: 8 * MIB,
  finalDescriptorInstance: 16 * MIB,
  finalDescriptorObservation: 2 * MIB,
  finalContainerObservation: 4 * MIB,
  finalProjectionEquality: 4 * MIB,
  finalArtifactBindingReceipt: 2 * MIB,
  finalAdmission: 2 * MIB,
  runtimeInstanceInterpretationRejection: 2 * MIB,
} as const);

const V3_RUNTIME_INSTANCE_RESOURCE_POLICY = deepFreeze({
  maximumCanonicalUtf8BytesByRuntimeProfile:
    V3_RUNTIME_PROFILE_CANONICAL_UTF8_CAPS,
  rawObservedTargetMaximumCanonicalUtf8Bytes: {
    verifierChannelObservation: 32 * MIB,
    assemblerChannelObservation: 8 * MIB,
    compositeReplayBundleObservation: 32 * MIB,
    finalDescriptorCanonicalBytes: 16 * MIB,
  },
  verifierCompositeOutputMaximumBytes: 32 * MIB,
  preReadPolicy: {
    lstatBeforeOpenRequired: true,
    noFollowAndBeneathResolutionRequired: true,
    exactRegularFileRequired: true,
    declaredSizeCheckedBeforeAllocationOrParse: true,
    rejectSizeGreaterThanProfileCapBeforeAllocationOrParse: true,
    boundedStreamingSha256BeforeParse: true,
    bytesReadBeyondDeclaredOrProfileCapAllowedOnlyForSentinel: true,
    maximumSentinelBytesBeyondCap: 1,
    capPlusOneSentinelReadRequiredWhenDeclaredSizeDoesNotAlreadyReject: true,
    truncationAllowed: false,
    partialHashBindingOrRegistrationAllowed: false,
    capPlusOneFailureCode: "file_size_cap_exceeded",
  },
  tokenizerAndStructureBudgets: {
    maximumDepth: 256,
    maximumTotalNodes: 1_500_000,
    maximumTotalObjectKeys: 1_000_000,
    maximumKeysPerObject: 16_384,
    maximumArrayLength: 524_288,
    maximumUtf8BytesPerString: 1 * MIB,
    maximumNumericTokenBytes: 128,
    duplicateKeyDetectionBeforeObjectMaterializationRequired: true,
    sparseArrayAllowed: false,
    accessorProxyOrHostObjectAllowed: false,
    nonfiniteOrNegativeZeroAllowed: false,
    overBudgetOutcome:
      "deterministic_typed_rejection_before_canonicalization_hash_binding_interpretation_or_registration",
  },
  exactCrossBindings: [
    "compositeReplayBundle_profile_cap_equals_verifierCompositeOutputMaximumBytes_and_full-verifier_generic-control_RLIMIT_FSIZE_quota_output-close_and_file-observation_byteLength_upper-bound",
    "verifierRuntimeChannel_profile_cap_equals_rawObservedTargetMaximumCanonicalUtf8Bytes.verifierChannelObservation_and_every_channel_file-observation_target cap",
    "assemblerRuntimeChannel_profile_cap_equals_rawObservedTargetMaximumCanonicalUtf8Bytes.assemblerChannelObservation_and_every_channel_file-observation_target cap",
    "finalDescriptorInstance_profile_cap_equals_rawObservedTargetMaximumCanonicalUtf8Bytes.finalDescriptorCanonicalBytes_and_finalDescriptorObservation.canonicalByteLength_upper-bound",
    "the_primary_outer_file_cap_is_checked_before_parsing_but_does_not_replace_per-node_depth_key_array_string_numeric-token_or_cumulative budgets",
    "maximumUtf8BytesPerString_is_one_MiB_strictly_below_the_smallest_two-MiB_runtime-profile_file-cap_so_a_coherent_in-cap_document_can_reach_and_trigger_the_string rail",
    "no_v1_v2_numeric-policy_or_postprojection-policy_static_snapshot_limit_is_treated_as_v3_runtime-instance coverage",
  ],
  rawObservedTargetCoverage: {
    everyRawTargetKeyReferencedByExactlyOneBindingProfile: true,
    verifierChannelObservation:
      "bindingProfiles.verifierChannelObservation_and_verifierRuntimeChannel_profile_and_channel-file-observation cap_are_all_32MiB",
    assemblerChannelObservation:
      "bindingProfiles.assemblerChannelObservation_and_assemblerRuntimeChannel_profile_and_channel-file-observation cap_are_all_8MiB",
    compositeReplayBundleObservation:
      "bindingProfiles.compositeReplayBundle_composite-profile_verifier-output-quota_and_RLIMIT_FSIZE_are_all_32MiB",
    finalDescriptorCanonicalBytes:
      "bindingProfiles.finalDescriptorInstance_descriptor-target-and_full-assembler_single-output_RLIMIT_FSIZE caps_are_all_16MiB",
  },
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY =
  deepFreeze({
    artifactId:
      "nhm2.prolate_boson_star.newtonian_seed.v3.evidence_schema_registry",
    registryVersion:
      "nhm2_prolate_boson_star_newtonian_seed_v3_evidence_schema_registry/v1",
    status: "sealed_preregistration_read_only_red_team_clear",
    authority:
      "nonexecuting_closed_schema_preregistration_without_typed_interpreter",
    sealedDependencies: {
      runPlanV2Binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
      runPlanV2RegistryBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
      numericMaterializationPolicyBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
      numericSelectionDagBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_SELECTION_DAG_BINDING,
      postprojectionPolicyBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
      postprojectionCandidatePSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA_BINDING,
      seedV1Binding: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
      outputDescriptorSchemaBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    },
    importedPrimitiveSchemaRegistry: {
      binding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
      v1ControlPlaneBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY_BINDING,
      schemas: {
        controlPlaneBinding:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
            .schemas.controlPlaneBinding,
        fileObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
            .schemas.fileObservation,
        absoluteDeadlineReceipt:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
            .schemas.absoluteDeadlineReceipt,
        commonRunRequest:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY
            .schemas.commonRunRequest,
        directoryObservation:
          NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V1_CONTROL_PLANE_EVIDENCE_GRAMMAR_REGISTRY
            .schemas.directoryObservation,
      },
      allowedPrimitiveAndSchemaPaths: [
        "schemas.controlPlaneBinding",
        "schemas.fileObservation",
        "schemas.absoluteDeadlineReceipt",
        "schemas.commonRunRequest",
        "schemas.directoryObservation",
      ],
      schemaSources: {
        directoryObservation: "v1ControlPlaneBinding",
        allOtherListedSchemas: "binding",
      },
      importedInstanceSchemasMayBeReusedAsV3TopLevelInstances: false,
    },
    importedOutputDescriptorSchema:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
    importedPolicySchemas: {
      candidatePPostprojectionMatchOrRejection:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA,
      candidateNNumericMatchOrRejection:
        IMPORTED_NUMERIC_VERIFIER_DAG.numericMaterializationMatchOrRejectionSchema,
      positiveCandidateNNumericReplayBundle:
        IMPORTED_NUMERIC_VERIFIER_DAG.verifierNumericMaterializationReplayBundleSchema,
      numericN32Manifest:
        IMPORTED_NUMERIC_VERIFIER_DAG.producer32ArrayStagingEvidenceSchema,
      postpolicyRuntimeCompositeSchemas: {
        raw6SecureObservationClosure:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6SecureObservationClosure,
        raw6Manifest: IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6Manifest,
        raw6SecureToManifestProjectionReceipt:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.raw6SecureToManifestProjectionReceipt,
        rawEvidenceRuntimeClosure:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.rawEvidenceRuntimeClosure,
        numericStaging32SecureToManifestProjectionReceipt:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.numericStaging32SecureToManifestProjectionReceipt,
        numericStaging32RuntimeClosure:
          IMPORTED_POSTPROJECTION_RUNTIME_SCHEMAS.numericStaging32RuntimeClosure,
      },
      candidatePAuthorityRemainsExactlyAsSealedFalse:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_REPLAY_RECEIPT_SCHEMA.authorityBoundary,
    },
    canonicalization: "RFC8785_JSON_Canonicalization_Scheme_UTF8",
    bindingHashRecipe:
      "SHA256(UTF8(exact_registered_domain_with_terminal_LF)||exact_schema-validated_recanonicalized_UTF8_bytes)",
    fileObservationHashRecipe:
      "fileObservation.sha256_is_plain_SHA256_of_exact_raw_bytes_and_is_never_reused_as_a_domain-separated_binding_digest",
    recursiveRules: {
      exactKeysAtEveryObjectDepth: true,
      extraKeysAllowed: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      duplicateKeysAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowed: false,
      rawBytesMustEqualRecanonicalizedUtf8Exactly: true,
    },
    runtimeInstanceResourcePolicy: V3_RUNTIME_INSTANCE_RESOURCE_POLICY,
    domains: {
      schemaBindings: V3_SCHEMA_DOMAINS,
      runtimeInstances: V3_RUNTIME_DOMAINS,
    },
    schemas: {
      rootPrestateReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ROOT_PRESTATE_RECEIPT_SCHEMA,
      numericStaging32RootPostState:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_ROOT_POST_STATE_SCHEMA,
      replayRootPostState:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_REPLAY_ROOT_POST_STATE_SCHEMA,
      fiveRootPreparation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FIVE_ROOT_PREPARATION_SCHEMA,
      producerClosedOutput38:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_CLOSED_OUTPUT38_SCHEMA,
      fullProducerEnforcement:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_PRODUCER_ENFORCEMENT_SCHEMA,
      genericStageControlEvidence:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_GENERIC_STAGE_CONTROL_EVIDENCE_SCHEMA,
      secureStaging32Observation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_STAGING32_OBSERVATION_SCHEMA,
      secureRawEvidence6Observation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SECURE_RAW_EVIDENCE6_OBSERVATION_SCHEMA,
      postexitSecureStaging32Reread:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_STAGING32_REREAD_SCHEMA,
      postexitSecureRawEvidence6Reread:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_SECURE_RAW_EVIDENCE6_REREAD_SCHEMA,
      producerNumericImplementation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_PRODUCER_NUMERIC_IMPLEMENTATION_SCHEMA,
      stageRuntimeConformance:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_RUNTIME_CONFORMANCE_SCHEMA,
      numericStaging32Composite:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_NUMERIC_STAGING32_COMPOSITE_SCHEMA,
      rawEvidence6Composite:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RAW_EVIDENCE6_COMPOSITE_SCHEMA,
      candidateInstanceIdentity:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_INSTANCE_IDENTITY_SCHEMA,
      stageInputLedger:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INPUT_LEDGER_SCHEMA,
      stageLaunchEnvelope:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_LAUNCH_ENVELOPE_SCHEMA,
      verifierRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_RUNTIME_CHANNEL_SCHEMA,
      verifierPrelaunchContextRejection:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_PRELAUNCH_CONTEXT_REJECTION_SCHEMA,
      untrustedCandidatePWrapper:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_UNTRUSTED_CANDIDATE_P_WRAPPER_SCHEMA,
      candidateNWrapper:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_N_WRAPPER_SCHEMA,
      postexitPostprojectionAcceptance:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_POSTPROJECTION_ACCEPTANCE_SCHEMA,
      postexitFinalFullSeedAdmission:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POSTEXIT_FINAL_FULL_SEED_ADMISSION_SCHEMA,
      candidateFullSeedGateEvidence:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANDIDATE_FULL_SEED_GATE_EVIDENCE_SCHEMA,
      compositeReplayBundle:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_COMPOSITE_REPLAY_BUNDLE_SCHEMA,
      verifierClosedOutput:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_VERIFIER_CLOSED_OUTPUT_SCHEMA,
      fullVerifierEnforcement:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_VERIFIER_ENFORCEMENT_SCHEMA,
      brokerRuntimeSeparation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BROKER_RUNTIME_SEPARATION_SCHEMA,
      typedInterpreterValidation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_TYPED_INTERPRETER_VALIDATION_SCHEMA,
      atomicNestedRegistration:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATOMIC_NESTED_REGISTRATION_SCHEMA,
      assemblerRuntimeChannel:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_RUNTIME_CHANNEL_SCHEMA,
      attestationRootPostState:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ATTESTATION_ROOT_POST_STATE_SCHEMA,
      assemblerClosedOutput:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ASSEMBLER_CLOSED_OUTPUT_SCHEMA,
      fullAssemblerEnforcement:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FULL_ASSEMBLER_ENFORCEMENT_SCHEMA,
      finalDescriptorObservation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_DESCRIPTOR_OBSERVATION_SCHEMA,
      finalContainerObservation:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_CONTAINER_OBSERVATION_SCHEMA,
      finalProjectionEquality:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_PROJECTION_EQUALITY_SCHEMA,
      finalArtifactBindingReceipt:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ARTIFACT_BINDING_RECEIPT_SCHEMA,
      finalAdmission:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_FINAL_ADMISSION_SCHEMA,
      runtimeInstanceInterpretationRejection:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_RUNTIME_INSTANCE_INTERPRETATION_REJECTION_SCHEMA,
    },
    schemaBindings:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SCHEMA_BINDINGS,
    bindingProfileSchemaBindingPolicy: {
      requiredBindingRecordKeys: [
        "artifactId",
        "sha256Domain",
        "sha256",
        "canonicalSizeBytes",
      ],
      versionDiscriminatorRequired: "schemaVersion_or_registryVersion",
      schemaObjectMayOccupySchemaBindingField: false,
      importedRegistrySelectionRequiresRegistryBindingPlusExplicitSchemaAndExactPath: true,
    },
    bindingProfiles: {
      rootPrestateReceipt: {
        schemaBinding: "schemaBindings.rootPrestateReceipt",
        domain: "domains.runtimeInstances.rootPrestateReceiptInstance",
      },
      numericStaging32RootPostState: {
        schemaBinding: "schemaBindings.numericStaging32RootPostState",
        domain:
          "domains.runtimeInstances.numericStaging32RootPostStateInstance",
      },
      replayRootPostState: {
        schemaBinding: "schemaBindings.replayRootPostState",
        domain: "domains.runtimeInstances.replayRootPostStateInstance",
      },
      fiveRootPreparation: {
        schemaBinding: "schemaBindings.fiveRootPreparation",
        domain: "domains.runtimeInstances.fiveRootPreparationInstance",
      },
      producerClosedOutput38: {
        schemaBinding: "schemaBindings.producerClosedOutput38",
        domain: "domains.runtimeInstances.producerClosedOutput38Instance",
      },
      fullProducerEnforcement: {
        schemaBinding: "schemaBindings.fullProducerEnforcement",
        domain: "domains.runtimeInstances.fullProducerEnforcementInstance",
      },
      genericStageControlEvidence: {
        schemaBinding: "schemaBindings.genericStageControlEvidence",
        domain: "domains.runtimeInstances.genericStageControlEvidenceInstance",
      },
      secureStaging32Observation: {
        schemaBinding: "schemaBindings.secureStaging32Observation",
        domain: "domains.runtimeInstances.secureStaging32ObservationInstance",
      },
      secureRawEvidence6Observation: {
        schemaBinding: "schemaBindings.secureRawEvidence6Observation",
        domain:
          "domains.runtimeInstances.secureRawEvidence6ObservationInstance",
      },
      postexitSecureStaging32Reread: {
        schemaBinding: "schemaBindings.postexitSecureStaging32Reread",
        domain:
          "domains.runtimeInstances.postexitSecureStaging32RereadInstance",
      },
      postexitSecureRawEvidence6Reread: {
        schemaBinding: "schemaBindings.postexitSecureRawEvidence6Reread",
        domain:
          "domains.runtimeInstances.postexitSecureRawEvidence6RereadInstance",
      },
      producerNumericImplementation: {
        schemaBinding: "schemaBindings.producerNumericImplementation",
        domain:
          "domains.runtimeInstances.producerNumericImplementationInstance",
      },
      producerStageRuntimeConformance: {
        schemaBinding: "schemaBindings.stageRuntimeConformance",
        domain: "domains.runtimeInstances.stageRuntimeConformanceInstance",
        stageProfile:
          "schemas.stageRuntimeConformance.topLevel.stageProfiles.producer",
      },
      verifierStageRuntimeConformance: {
        schemaBinding: "schemaBindings.stageRuntimeConformance",
        domain: "domains.runtimeInstances.stageRuntimeConformanceInstance",
        stageProfile:
          "schemas.stageRuntimeConformance.topLevel.stageProfiles.verifier",
      },
      numericStaging32Composite: {
        schemaBinding: "schemaBindings.numericStaging32Composite",
        domain: "domains.runtimeInstances.numericStaging32CompositeInstance",
      },
      rawEvidence6Composite: {
        schemaBinding: "schemaBindings.rawEvidence6Composite",
        domain: "domains.runtimeInstances.rawEvidence6CompositeInstance",
      },
      candidateInstanceIdentity: {
        schemaBinding: "schemaBindings.candidateInstanceIdentity",
        domain: "domains.runtimeInstances.candidateInstanceIdentity",
      },
      producerInputLedger: {
        schemaBinding: "schemaBindings.stageInputLedger",
        domain: "domains.runtimeInstances.producerInputLedger",
      },
      verifierInputLedger: {
        schemaBinding: "schemaBindings.stageInputLedger",
        domain: "domains.runtimeInstances.verifierInputLedger",
      },
      assemblerInputLedger: {
        schemaBinding: "schemaBindings.stageInputLedger",
        domain: "domains.runtimeInstances.assemblerInputLedger",
      },
      producerLaunchEnvelope: {
        schemaBinding: "schemaBindings.stageLaunchEnvelope",
        domain: "domains.runtimeInstances.producerLaunchEnvelope",
      },
      verifierLaunchEnvelope: {
        schemaBinding: "schemaBindings.stageLaunchEnvelope",
        domain: "domains.runtimeInstances.verifierLaunchEnvelope",
      },
      assemblerLaunchEnvelope: {
        schemaBinding: "schemaBindings.stageLaunchEnvelope",
        domain: "domains.runtimeInstances.assemblerLaunchEnvelope",
      },
      verifierRuntimeChannel: {
        schemaBinding: "schemaBindings.verifierRuntimeChannel",
        domain: "domains.runtimeInstances.verifierRuntimeChannel",
      },
      verifierPrelaunchContextRejection: {
        schemaBinding: "schemaBindings.verifierPrelaunchContextRejection",
        domain: "domains.runtimeInstances.verifierPrelaunchContextRejection",
      },
      untrustedCandidatePWrapper: {
        schemaBinding: "schemaBindings.untrustedCandidatePWrapper",
        domain: "domains.runtimeInstances.untrustedCandidatePWrapper",
      },
      candidateNWrapper: {
        schemaBinding: "schemaBindings.candidateNWrapper",
        domain: "domains.runtimeInstances.candidateNWrapper",
      },
      postexitPostprojectionAcceptance: {
        schemaBinding: "schemaBindings.postexitPostprojectionAcceptance",
        domain: "domains.runtimeInstances.postexitPostprojectionAcceptance",
      },
      postexitFinalFullSeedAdmission: {
        schemaBinding: "schemaBindings.postexitFinalFullSeedAdmission",
        domain: "domains.runtimeInstances.postexitFinalFullSeedAdmission",
      },
      compositeReplayBundle: {
        schemaBinding: "schemaBindings.compositeReplayBundle",
        domain: "domains.runtimeInstances.compositeReplayBundle",
        rawObservedTarget:
          "runtimeInstanceResourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes.compositeReplayBundleObservation",
      },
      candidateFullSeedGateEvidence: {
        schemaBinding: "schemaBindings.candidateFullSeedGateEvidence",
        domain: "domains.runtimeInstances.candidateFullSeedGateEvidence",
      },
      verifierClosedOutput: {
        schemaBinding: "schemaBindings.verifierClosedOutput",
        domain: "domains.runtimeInstances.verifierClosedOutput",
      },
      verifierChannelObservation: {
        schemaBinding: "importedPrimitiveSchemaRegistry.binding",
        schema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
        schemaBindingSelectsExactPath: "schemas.fileObservation",
        domain: "domains.runtimeInstances.verifierChannelObservation",
        rawObservedTarget:
          "runtimeInstanceResourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes.verifierChannelObservation",
      },
      fullVerifierEnforcement: {
        schemaBinding: "schemaBindings.fullVerifierEnforcement",
        domain: "domains.runtimeInstances.fullVerifierEnforcement",
      },
      brokerRuntimeSeparation: {
        schemaBinding: "schemaBindings.brokerRuntimeSeparation",
        domain: "domains.runtimeInstances.brokerRuntimeSeparation",
      },
      typedInterpreterValidation: {
        schemaBinding: "schemaBindings.typedInterpreterValidation",
        domain: "domains.runtimeInstances.typedInterpreterValidation",
      },
      atomicNestedRegistration: {
        schemaBinding: "schemaBindings.atomicNestedRegistration",
        domain: "domains.runtimeInstances.atomicNestedRegistration",
      },
      assemblerRuntimeChannel: {
        schemaBinding: "schemaBindings.assemblerRuntimeChannel",
        domain: "domains.runtimeInstances.assemblerRuntimeChannel",
      },
      assemblerChannelObservation: {
        schemaBinding: "importedPrimitiveSchemaRegistry.binding",
        schema: "importedPrimitiveSchemaRegistry.schemas.fileObservation",
        schemaBindingSelectsExactPath: "schemas.fileObservation",
        domain: "domains.runtimeInstances.assemblerChannelObservation",
        rawObservedTarget:
          "runtimeInstanceResourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes.assemblerChannelObservation",
      },
      attestationRootPostState: {
        schemaBinding: "schemaBindings.attestationRootPostState",
        domain: "domains.runtimeInstances.attestationRootPostState",
      },
      assemblerClosedOutput: {
        schemaBinding: "schemaBindings.assemblerClosedOutput",
        domain: "domains.runtimeInstances.assemblerClosedOutput",
      },
      fullAssemblerEnforcement: {
        schemaBinding: "schemaBindings.fullAssemblerEnforcement",
        domain: "domains.runtimeInstances.fullAssemblerEnforcement",
        stageProfile:
          "schemas.genericStageControlEvidence.topLevel.stageProfiles.trusted_descriptor_assembler",
      },
      finalDescriptorInstance: {
        schemaBinding: "sealedDependencies.outputDescriptorSchemaBinding",
        schema: "importedOutputDescriptorSchema",
        domain: "domains.runtimeInstances.finalDescriptorInstance",
        rawObservedTarget:
          "runtimeInstanceResourcePolicy.rawObservedTargetMaximumCanonicalUtf8Bytes.finalDescriptorCanonicalBytes",
      },
      finalDescriptorObservation: {
        schemaBinding: "schemaBindings.finalDescriptorObservation",
        domain: "domains.runtimeInstances.finalDescriptorObservation",
      },
      finalContainerObservation: {
        schemaBinding: "schemaBindings.finalContainerObservation",
        domain: "domains.runtimeInstances.finalContainerObservation",
      },
      finalProjectionEquality: {
        schemaBinding: "schemaBindings.finalProjectionEquality",
        domain: "domains.runtimeInstances.finalProjectionEquality",
      },
      finalArtifactBindingReceipt: {
        schemaBinding: "schemaBindings.finalArtifactBindingReceipt",
        domain: "domains.runtimeInstances.finalArtifactBindingReceipt",
      },
      finalAdmission: {
        schemaBinding: "schemaBindings.finalAdmission",
        domain: "domains.runtimeInstances.finalAdmission",
      },
      runtimeInstanceInterpretationRejection: {
        schemaBinding: "schemaBindings.runtimeInstanceInterpretationRejection",
        domain:
          "domains.runtimeInstances.runtimeInstanceInterpretationRejection",
      },
    },
    exactStageProfiles: {
      stageIds: EXACT_STAGE_IDS,
      policyInputProfiles:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POLICY_INPUT_PROFILES,
      inputPathInventories:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES,
    },
    chronology: {
      exactAcyclicOrder: [
        "five_root_prestate_and_stage_quota_seccomp_deadline_setup",
        "producer_base10_ledger_then_launch-envelope_then_launch",
        "producer_writes_exact32_and_exact6_then_closes_fsyncs_exits_and_cgroup-empty",
        "O38_pre-enforcement_broker_closed-output_observation",
        "full_producer_E_binding_O38_without_future_secure-closure_bindings",
        "post-E_secure_S32_and_S6_rereads",
        "N32_and_R6_manifests_then_exact_S-to-manifest_projection_receipts_then_two_composites",
        "candidate_identity_binding_common-request_full-E_and_both_composites",
        "broker_prelaunch-context-validation_then_either_typed-verifierPrelaunchContextRejection-with-no-launch-or-the_validated_context_continues",
        "verifier_48-ledger_then_channel-seal-observation_then_launch-envelope_then_preexec-revalidation_then_launch",
        "single_verifier_candidate_P_then_conditional_N_then_conditional_F_then_one_composite_close-fsync_exit_cgroup-empty",
        "verifier_closed-output-observation_then_full-verifier-E_then_O_EXCL-write-close-file-fsync-parent-directory-fsync_at_/run/attestation/verifier-stage-enforcement-receipt.canonical.json_then_fresh-raw-E-observation_before_broker-runtime-separation-and-interpretation_for_every_postlaunch-outcome",
        "broker_runtime-separation_then_complete-typed-interpretation_then_atomic_nested_P-N-F_registration",
        "terminal-positive-only_exact-one_attestation-root_full-verifier-E_observation_before_assembler-ledger43",
        "assembler_44-ledger_then_channel-seal-observation_then_launch-envelope_then_launch",
        "assembler_writes_exact32_arrays_then_descriptor-last_closes_fsyncs_exits_and_cgroup-empty_then_O33",
        "full_assembler_E_binds_O33_without_predicting_future_final observations",
        "fresh_final_descriptor_observation_then_fresh_exact33-and-five-directory_final-container_observation",
        "descriptor-and-array_projection-equality_then_seed-v1-policy_final-artifact-binding-receipt_then_terminal_final-admission_strictly_before_deadline",
      ],
      temporalCycleAllowed: false,
      commonRunRequestMayContainFutureEvidence: false,
      runtimeEvidenceMayBindUnsealedOrDifferentV3Bytes: false,
    },
    hashDag: {
      staticOrder: [
        "sealed_v2_numeric_and_postprojection_dependencies",
        "v3_schema_bindings",
        "v3_evidence_registry_binding",
        "v3_run-plan_binding",
      ],
      runtimeOrderBeginsOnlyAfterLiteralV3Seal: true,
      schemaOrRegistryMayContainV3RootBinding: false,
      runtimeInstancesMustBindTheFutureExactSealedV3Root: true,
      futureInstanceHashPreregistrationAllowed: false,
    },
    runtimeTypedInterpreterBinding: null,
    executableValidationAuthorityPresent: false,
    executionAuthorityPresent: false,
    artifactOrScientificAuthorityPresent: false,
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_CANONICAL_JSON =
  canonicalJson(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_SHA256_DOMAIN =
  V3_SCHEMA_DOMAINS.registry;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY.artifactId,
    registryVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY.registryVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_SHA256_DOMAIN,
    sha256: sha256Hex(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_SHA256_DOMAIN,
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_CANONICAL_JSON,
    ),
    canonicalSizeBytes: Buffer.byteLength(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_CANONICAL_JSON,
      "utf8",
    ),
  } as const);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-v3-evidence-schema-registry/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256 =
  "14f800a2675d6ecc23ebdfc5ba62d4efcde1b70961be8b6fed146fda5bd2d89f" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES =
  837250 as const;
assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_SHA256_DOMAIN ===
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256_DOMAIN &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING.sha256 ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_SHA256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING.canonicalSizeBytes ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_EXPECTED_CANONICAL_SIZE_BYTES,
  "nhm2_prolate_boson_star_newtonian_seed_run_plan_v3_evidence_schema_registry_literal_binding_drift",
);

const V3_NULL_RUNTIME_BINDINGS = deepFreeze({
  eligibleLinuxWorkerProviderBinding: null,
  schedulerLeaseBinding: null,
  globalRunAttemptBinding: null,
  producerWorkerAttemptBinding: null,
  verifierWorkerAttemptBinding: null,
  assemblerWorkerAttemptBinding: null,
  producerSourceManifestBinding: null,
  producerToolchainManifestBinding: null,
  producerExecutableBinding: null,
  verifierSourceManifestBinding: null,
  verifierToolchainManifestBinding: null,
  verifierExecutableBinding: null,
  assemblerSourceManifestBinding: null,
  assemblerToolchainManifestBinding: null,
  assemblerExecutableBinding: null,
  independentProofKernelBinding: null,
  independentProofKernelToolchainBinding: null,
  mpfrGmpRuntimeManifestBinding: null,
  producerNumericImplementationBinding: null,
  producerProjectionImplementationBinding: null,
  verifierProjectionImplementationBinding: null,
  implementationSeparationReceiptBinding: null,
  typedInterpreterBinding: null,
  rootPrestateReceiptBinding: null,
  numericStaging32RootPostStateBinding: null,
  replayRootPostStateBinding: null,
  fiveRootPreparationReceiptBinding: null,
  absoluteDeadlineReceiptBinding: null,
  producerQuotaCapabilityBinding: null,
  producerQuotaSetupReceiptBinding: null,
  producerSeccompPolicyBinding: null,
  producerSeccompLoadReceiptBinding: null,
  producerInputLedgerBinding: null,
  producerLaunchEnvelopeBinding: null,
  producerGenericStageControlEvidenceBinding: null,
  producerStageRuntimeConformanceBinding: null,
  producerExact38ClosedOutputObservationBinding: null,
  producerFullEnforcementReceiptBinding: null,
  preVerifierSecureStaging32ObservationBinding: null,
  preVerifierSecureRawEvidence6ObservationBinding: null,
  numericStaging32CompositeBinding: null,
  rawEvidence6CompositeBinding: null,
  candidateInstanceIdentityBinding: null,
  verifierQuotaCapabilityBinding: null,
  verifierQuotaSetupReceiptBinding: null,
  verifierSeccompPolicyBinding: null,
  verifierSeccompLoadReceiptBinding: null,
  verifierInputLedgerBinding: null,
  verifierRuntimeChannelBinding: null,
  verifierPrelaunchContextRejectionBinding: null,
  verifierChannelObservationBinding: null,
  verifierLaunchEnvelopeBinding: null,
  verifierGenericStageControlEvidenceBinding: null,
  verifierStageRuntimeConformanceBinding: null,
  candidatePWrapperBinding: null,
  candidateNWrapperBinding: null,
  candidateFullSeedGateEvidenceBinding: null,
  compositeReplayBundleBinding: null,
  verifierClosedOutputObservationBinding: null,
  verifierFullEnforcementReceiptBinding: null,
  brokerRuntimeSeparationReceiptBinding: null,
  postexitSecureStaging32RereadBinding: null,
  postexitSecureRawEvidence6RereadBinding: null,
  postexitPostprojectionAcceptanceReceiptBinding: null,
  postexitValidatedFinalFullSeedResultBinding: null,
  typedInterpreterValidationReceiptBinding: null,
  atomicNestedRegistrationReceiptBinding: null,
  attestationRootPostStateObservationBinding: null,
  assemblerQuotaCapabilityBinding: null,
  assemblerQuotaSetupReceiptBinding: null,
  assemblerSeccompPolicyBinding: null,
  assemblerSeccompLoadReceiptBinding: null,
  assemblerInputLedgerBinding: null,
  assemblerRuntimeChannelBinding: null,
  assemblerChannelObservationBinding: null,
  assemblerLaunchEnvelopeBinding: null,
  assemblerGenericStageControlEvidenceBinding: null,
  assemblerClosedOutputObservationBinding: null,
  assemblerFullEnforcementReceiptBinding: null,
  finalDescriptorInstanceBinding: null,
  finalDescriptorObservationBinding: null,
  finalContainerObservationBinding: null,
  finalProjectionEqualityReceiptBinding: null,
  finalArtifactBindingReceiptBinding: null,
  finalAdmissionReceiptBinding: null,
  finalArtifactBinding: null,
  runtimeInstanceInterpretationRejectionBinding: null,
} as const);

const V3_CLAIM_LOCK_KEYS = Object.freeze([
  "successorV3StaticPolicyInputsAccepted",
  "successorV3ProducerExact38OutputAccepted",
  "successorV3NumericStaging32RuntimeClosureAccepted",
  "successorV3RawEvidence6RuntimeClosureAccepted",
  "successorV3CandidateInstanceIdentityAccepted",
  "successorV3VerifierPrelaunchContextAccepted",
  "successorV3CandidatePostprojectionMathMatched",
  "successorV3CandidateNumericMaterializationMatched",
  "successorV3CandidateFullSeedGateEvidenceCompleted",
  "successorV3ValidatedFinalFullSeedAdmissionMatched",
  "successorV3CompositeReplayBundleAccepted",
  "successorV3BrokerRuntimeSeparationAccepted",
  "successorV3AtomicNestedRegistrationAccepted",
  "successorV3AssemblerAccepted",
  "successorV3FinalDescriptorObserved",
  "successorV3FinalContainerClosed",
  "successorV3FinalProjectionEqualityAccepted",
  "successorV3FinalArtifactAccepted",
] as const);

const CLAIM_LOCK_KEYS = Object.freeze([
  ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.claimLockKeys,
  ...V3_CLAIM_LOCK_KEYS,
]);
const CLAIM_LOCKS = deepFreeze(
  Object.fromEntries(CLAIM_LOCK_KEYS.map((key) => [key, false])) as Record<
    (typeof CLAIM_LOCK_KEYS)[number],
    false
  >,
);

const CONTRACT = {
  artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ARTIFACT_ID,
  contractVersion:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CONTRACT_VERSION,
  status: "sealed_preregistration_read_only_red_team_clear",
  authority:
    "nonexecuting_additive_successor_run_plan_for_numeric_postprojection_and_full_seed_replay",
  maturity:
    "diagnostic_execution_contract_sealed_preregistration_no_capability_no_execution_no_artifact",
  predecessors: {
    runPlanV2Binding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_BINDING,
    runPlanV2RegistryBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2_RUNTIME_CHANNEL_SCHEMA_REGISTRY_BINDING,
    numericMaterializationPolicyBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_NUMERIC_MATERIALIZATION_POLICY_V1_BINDING,
    postprojectionPolicyBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_POSTPROJECTION_POLICY_V1_BINDING,
    predecessorSingletonIdentityRequired: true,
    predecessorSemanticsMayBeWeakened: false,
  },
  sourceClosureDisposition: {
    producer:
      "source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    verifier:
      "source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    assembler:
      "source_exists_only_as_new_unsealed_files_pending_review_and_source_closure_manifest",
    everySourceToolchainExecutableAndImageBinding: null,
    sourcePresenceGrantsExecutionAuthority: false,
  },
  providerPolicy: {
    ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.providerPolicy,
    onlyExecutionTarget: "external_linux_oci_cgroup_v2_worker",
    currentHostFallbackAllowed: false,
    windowsProviderLaunchAllowed: false,
    defaultProviderLaunchAllowed: false,
    hostNodeExecutorAllowed: false,
    providerBinding: null,
    launchAuthorityPresent: false,
  },
  commonRunRequestPolicy:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.commonRunRequestPolicy,
  inputPathInventories:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_INPUT_PATH_INVENTORIES,
  policyInputProfiles:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_POLICY_INPUT_PROFILES,
  stageInvocations:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATIONS,
  stageInvocationPlainSha256:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_STAGE_INVOCATION_PLAIN_SHA256,
  evidenceSchemaRegistryBinding:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EVIDENCE_SCHEMA_REGISTRY_BINDING,
  requiredStageOrder: [
    "untrusted_seed_producer",
    "trusted_independent_verifier",
    "trusted_descriptor_assembler",
  ],
  verifierAdmissionBoundary: {
    validatedContextRequiredBeforeLedgerChannelEnvelopeOrLaunch:
      "common-request_and_both-policy-bytes_full-producer-E_S32-N32_S6-R6_candidate-identity_scheduler-lease_worker-attempt_deadline_quota-capability-and-setup_seccomp-policy-and-load_verifier-source-manifest_verifier-toolchain-manifest_verifier-executable_verifier-OCI-image_typed-interpreter_MPFR-GMP-runtime-manifest_distinct-actual-independent-proof-kernel_and-independent-proof-kernel-toolchain_static-implementations_static-separation_then-exact-ledger_channel-secure-observation_and-launch-envelope-seal",
    failedContextOutcome:
      "one_bound_verifierPrelaunchContextRejection_and_no_valid-or-admitted_verifierLaunchEnvelopeBinding_composite_full-verifier-E_interpreter-registration_assembler-or-artifact evidence;attemptedVerifierLaunchEnvelopeBindingOrNull_may_exist_only_as_untrusted_non-authoritative_envelope-formation-failure evidence",
    launchedVerifierRejectionScope:
      "only_postlaunch-formable_dynamic-runtime-or-independent-math-byte-disagreements_under_a_schema-valid_prevalidated_context",
    currentContractHasLaunchAuthority: false,
  },
  candidateComputationOrder: {
    oneVerifierProcess: true,
    preExitOrder: [
      "candidate_postprojection_P",
      "candidate_numeric_materialization_N_if_P_matches",
      "candidate_full_seed_gate_evidence_if_N_matches",
      "one_composite_replay_bundle_close_and_fsync",
      "verifier_exit",
    ],
    postExitOrder: [
      "full_verifier_enforcement_then_durable-O_EXCL-write-close-file-fsync-parent-directory-fsync_at_/run/attestation/verifier-stage-enforcement-receipt.canonical.json_and-fresh-raw-observation_for_every_postlaunch-outcome",
      "broker_runtime_separation_then_fresh_postexit_S32_S6_reread_and_typed_interpretation",
      "atomic_dependency_ordered_available_positive_P_N_F_registration",
      "exact-one_attestation-root_observation_of_full-verifier-E_only_for_terminal-positive-chain",
      "assembler_launch_if_and_only_if_outcome_is_PN_match_gate_evidence_complete_interpreter_terminalPositiveAdmissionEligible_and_atomic_registration_contains_exact_[Paccept,Nwrapper,Fmatch]",
      "assembler_O33_then_full-assembler-E",
      "fresh_final-descriptor_then-fresh-final-container_observations",
      "final_descriptor-array_projection-equality_then_seed-v1-policy_final-artifact-binding-receipt_then_terminal-final-admission",
    ],
    rejectionTermination:
      "every_P_N_or_gate-evidence_rejection_records_only_its_permitted_typed_diagnostic_nodes_after_the_mandatory_full-E_durable-attestation-file-write-and-fresh-raw-observation_but_terminates_before_the_terminal-positive_exact-one-attestation-root-poststate-observation-and-closure_assembler-ledger_channel launch output or artifact",
    standalonePostprojectionReceiptPathAllowed: false,
    secondVerifierStageAllowed: false,
    compositeReplayBundlePath: COMPOSITE_REPLAY_PATH,
  },
  schemaImplementationState: {
    exactStageInvocationProfilesPresent: true,
    additiveFiveRootPreparationSchemaPresent: true,
    additiveProducerExact38ClosedOutputSchemaPresent: true,
    additiveFullProducerEnforcementSchemaPresent: true,
    numericStaging32RuntimeClosureSchemaPresent: true,
    rawEvidence6RuntimeClosureSchemaPresent: true,
    distinctPostexitS32AndS6RereadSchemasPresent: true,
    producerNumericImplementationSchemaPresent: true,
    stageRuntimeConformanceWrapperSchemaPresent: true,
    additiveVerifierLedgerChannelEnvelopeSchemaPresent: true,
    verifierPrelaunchContextRejectionSchemaPresent: true,
    additiveCompositeReplaySchemaPresent: true,
    additiveFullVerifierEnforcementSchemaPresent: true,
    brokerRuntimeSeparationSchemaPresent: true,
    completeTypedInterpreterSchemaPresent: true,
    atomicNestedRegistrationSchemaPresent: true,
    additiveAssemblerLedgerChannelSchemaPresent: true,
    additiveAssemblerClosedOutputAndEnforcementSchemasPresent: true,
    exactOneAttestationRootSchemaPresent: true,
    finalDescriptorContainerProjectionAndAdmissionSchemasPresent: true,
    finalSeedV1ArtifactBindingReceiptSchemaPresent: true,
    boundedRuntimeInterpretationRejectionSchemaPresent: true,
  },
  externalBindings: {
    ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.externalBindings,
    numericMaterializationPolicyFileObservationBinding: null,
    postprojectionPolicyFileObservationBinding: null,
    ...V3_NULL_RUNTIME_BINDINGS,
  },
  executionState: {
    ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.executionState,
    ...V3_NULL_RUNTIME_BINDINGS,
    executionAuthorized: false,
    executed: false,
    artifactAccepted: false,
    producerLaunched: false,
    verifierLaunched: false,
    assemblerLaunched: false,
    typedInterpretationCompleted: false,
    atomicRegistrationCompleted: false,
    finalAdmissionGranted: false,
    scientificAdmissionGranted: false,
    physicalAuthorityGranted: false,
    propulsionAuthorityGranted: false,
    transportAuthorityGranted: false,
  },
  blockers: [
    "no_runtime_instance_including_five-root-preparation_stage-ledgers_channels_envelopes_enforcement_receipts_composite_interpreter_registration_or_final-output-evidence_is_bound",
    "eligible_external_Linux_x86_64_worker_provider_absent",
    "attested_MPFR_GMP_runtime_independent_proof-kernel_and_all_three_source_toolchain_executable_closures_absent",
    "producer_numeric_producer_projection_and_independent_verifier_projection_implementations_and_same-attempt_separation_evidence_absent",
    "full_seed_v1_continuous_proof_and_gate_receipts_absent",
    "typed_interpreter_provider_and_atomic_content-addressed_registration_implementation_absent",
    "trusted_descriptor_assembler_source-toolchain-runtime_closure_and_terminal_projection-admission_evidence_absent",
    "no_execution_output_artifact_scientific_physical_propulsion_or_transport_authority",
  ],
  inheritedClaimLockKeys:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V2.claimLockKeys,
  successorV3ClaimLockKeys: V3_CLAIM_LOCK_KEYS,
  claimLockKeys: CLAIM_LOCK_KEYS,
  claimLocks: CLAIM_LOCKS,
} as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3 =
  deepFreeze(CONTRACT);
export type Nhm2ProlateBosonStarNewtonianSeedRunPlanV3 =
  typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-run-plan/v3\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256 =
  sha256Hex(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN,
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_JSON,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-run-plan/v3\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256 =
  "ac223c9b79b621b39d25fe9807492e030da916d8f2c6453a30b612de4ae6562c" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES =
  54136 as const;
assertLiteral(
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN ===
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256_DOMAIN &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256 ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_SHA256 &&
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_SIZE_BYTES ===
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_EXPECTED_CANONICAL_SIZE_BYTES,
  "nhm2_prolate_boson_star_newtonian_seed_run_plan_v3_literal_binding_drift",
);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_BINDING =
  Object.freeze({
    artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_ARTIFACT_ID,
    contractVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CONTRACT_VERSION,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256_DOMAIN,
    sha256: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_CANONICAL_SIZE_BYTES,
  } as const);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_RUN_PLAN_V3_LITERAL_SEAL_STATUS =
  "sealed_preregistration_read_only_red_team_clear" as const;
