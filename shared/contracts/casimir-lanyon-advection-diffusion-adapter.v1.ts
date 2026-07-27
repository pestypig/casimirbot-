import { createHash } from "node:crypto";

import { computeCasimirSpecValueSha256V1 } from "./casimir-spec-scientific-claim-ir.v1";

export const CASIMIR_LANYON_ADAPTER_POLICY_ARTIFACT_ID =
  "casimir_lanyon_advection_diffusion_adapter_policy" as const;
export const CASIMIR_LANYON_ADAPTER_POLICY_SCHEMA_VERSION =
  "casimir_lanyon_advection_diffusion_adapter_policy/v1" as const;
export const CASIMIR_LANYON_ADAPTER_POLICY_HASH_DOMAIN =
  "casimir-lanyon-advection-diffusion-adapter-policy/v1" as const;
export const CASIMIR_LANYON_ADAPTER_CONTRACT_ID =
  "casimir-lanyon-adapter/v1" as const;
export const CASIMIR_LANYON_PRODUCER_ID = "lanyon" as const;
export const CASIMIR_LANYON_REPOSITORY_URI =
  "https://github.com/lanyonai/AdvectionDiffusion" as const;
export const CASIMIR_LANYON_PINNED_COMMIT =
  "3d19be11e101121d8187230977f5a5aeba0daefe" as const;
export const CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256 =
  "36171309e943cf220db8ef02405164ca4d0f692720bfa256d76a8b63e4876d8a" as const;

export const CASIMIR_LANYON_CASE_KINDS = [
  "linear_advection",
  "advection_diffusion_isotropic",
  "advection_diffusion_full",
] as const;
export type CasimirLanyonCaseKindV1 =
  (typeof CASIMIR_LANYON_CASE_KINDS)[number];

export type CasimirLanyonSourceArtifactV1 = {
  logicalPath: string;
  sha256: string;
  sizeBytes: number;
};

export type CasimirLanyonAdvectionDiffusionCaseV1 = {
  caseId: string;
  kind: CasimirLanyonCaseKindV1;
  dimensions: 1 | 2 | 3;
  specification: CasimirLanyonSourceArtifactV1;
  formalSource: CasimirLanyonSourceArtifactV1;
  implementationSource: CasimirLanyonSourceArtifactV1;
};

export type CasimirLanyonAdapterPolicyV1 = {
  artifactId: typeof CASIMIR_LANYON_ADAPTER_POLICY_ARTIFACT_ID;
  schemaVersion: typeof CASIMIR_LANYON_ADAPTER_POLICY_SCHEMA_VERSION;
  policyId: "casimir.lanyon.advection-diffusion.snapshot.2026-07-24";
  artifactSha256: string;
  producerId: typeof CASIMIR_LANYON_PRODUCER_ID;
  adapterContractId: typeof CASIMIR_LANYON_ADAPTER_CONTRACT_ID;
  repository: {
    uri: typeof CASIMIR_LANYON_REPOSITORY_URI;
    commitSha: typeof CASIMIR_LANYON_PINNED_COMMIT;
    selectedSourceTreeSha256: typeof CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256;
    selectedArtifactCount: 27;
  };
  cases: CasimirLanyonAdvectionDiffusionCaseV1[];
  admission: {
    developerOnly: true;
    readOnly: true;
    exactSourceBytesRequired: true;
    symlinksAllowed: false;
    networkExecutionAllowed: false;
    producerOutputTrusted: false;
  };
  authority: {
    outputRole: "adapter_admission_policy";
    scientificAuthority: false;
    formalAuthority: false;
    numericalAuthority: false;
    empiricalAuthority: false;
    physicalAuthority: false;
    assistantAnswer: false;
    terminalEligible: false;
  };
};

type BuildPolicyInput = Omit<CasimirLanyonAdapterPolicyV1, "artifactSha256">;

const artifact = (
  logicalPath: string,
  sha256: string,
  sizeBytes: number,
): CasimirLanyonSourceArtifactV1 => ({
  logicalPath,
  sha256,
  sizeBytes,
});

export const CASIMIR_LANYON_ADVECTION_DIFFUSION_CASES_V1: readonly CasimirLanyonAdvectionDiffusionCaseV1[] =
  [
    {
      caseId: "advection_diffusion_full_1d",
      kind: "advection_diffusion_full",
      dimensions: 1,
      specification: artifact(
        "specifications/advection_diffusion_full_1d.rkt",
        "9eae33f713875c567fcae890af1de1a58e0610e46ba45ff3ee423d2e138605e9",
        1785,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_full_1d.lean",
        "e1fab3be5a2aa3117477c996d7bed494fb3b0d382526e40e3a5e57008ac7d870",
        16733,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_full_1d.c",
        "ea3f4f7534475c719fa94cd96c380faa90c6eedd2f587b513b9b9658cb1beb75",
        20960,
      ),
    },
    {
      caseId: "advection_diffusion_full_2d",
      kind: "advection_diffusion_full",
      dimensions: 2,
      specification: artifact(
        "specifications/advection_diffusion_full_2d.rkt",
        "28983731a8cadd9f8261fd59c50b63b8870115d8a41b86d0a3481e40aa37b56c",
        3279,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_full_2d.lean",
        "d2185401cf922485c774389d4873bdb7a5269a221910d55aff6954ed3777e8a9",
        35418,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_full_2d.c",
        "c5f1b2eb99efa8081cf50c490266bcf0c1cd49ba2dbab2285df110647019efe9",
        42316,
      ),
    },
    {
      caseId: "advection_diffusion_full_3d",
      kind: "advection_diffusion_full",
      dimensions: 3,
      specification: artifact(
        "specifications/advection_diffusion_full_3d.rkt",
        "235501abd0b2e57e9a2c1f470adddd1054df5d50bff458b18e79e8e1d3e00951",
        5154,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_full_3d.lean",
        "ddba9bf0e844a1b44c1ee158d5744ca41b51ea8a3bf7f0fa8f2dfd2c39bb2cf8",
        63065,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_full_3d.c",
        "c0bfd72ce5a029bf97bc2b0e21faef026b1dffa3eca06ae108194aefe0b0877a",
        70041,
      ),
    },
    {
      caseId: "advection_diffusion_iso_1d",
      kind: "advection_diffusion_isotropic",
      dimensions: 1,
      specification: artifact(
        "specifications/advection_diffusion_iso_1d.rkt",
        "282876247f5c8f6e6bc69fadc787ffa4372440586adf642e8ef20f3b52951deb",
        1777,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_iso_1d.lean",
        "03e214d486837d08d3dd0aaa38ffb10c612fea81a8be0507d87daf8eaf8646c5",
        16666,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_iso_1d.c",
        "5d148fe4da6ea8a4b5f09fa2ec75abf236bdaf7750f7dccae63cef4c70a17df9",
        20665,
      ),
    },
    {
      caseId: "advection_diffusion_iso_2d",
      kind: "advection_diffusion_isotropic",
      dimensions: 2,
      specification: artifact(
        "specifications/advection_diffusion_iso_2d.rkt",
        "b3f2e159ab51d8be95299a215b6733bd6b81d0b6d3a53a2200d6b5eb71315556",
        3175,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_iso_2d.lean",
        "09fcc4719d27d62dd06bb9bfab106f2eaaaeca7800cc50bafe548206c3d32008",
        33615,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_iso_2d.c",
        "e92f8a1bd72eeeed6546b552e3591274a5fd6788c127b78af5d1e2888f27e2a7",
        40295,
      ),
    },
    {
      caseId: "advection_diffusion_iso_3d",
      kind: "advection_diffusion_isotropic",
      dimensions: 3,
      specification: artifact(
        "specifications/advection_diffusion_iso_3d.rkt",
        "4ecda46c2c55b48cb94c29f2726f22b6c7f3a336605e1345bdd304fe5abd02e4",
        4924,
      ),
      formalSource: artifact(
        "proofs/advection_diffusion_iso_3d.lean",
        "32da929941230ac85e3e3f26f439642ce4f7ecc3c6ee96230c0cc47ce4caf2f2",
        56256,
      ),
      implementationSource: artifact(
        "implementations/advection_diffusion_iso_3d.c",
        "f31e13f183aec73b0f1d9d20229ce7bd905aee963cd614c3ca97e9550a8542e7",
        63566,
      ),
    },
    {
      caseId: "linear_advection_1d",
      kind: "linear_advection",
      dimensions: 1,
      specification: artifact(
        "specifications/linear_advection_1d.rkt",
        "437871e5ac994a677454f8ddfc8bd7f08fd65b88b0b1345b6ef71af25a38c12b",
        1446,
      ),
      formalSource: artifact(
        "proofs/linear_advection_1d.lean",
        "95b2c8385fbbe7a53bda00240798d3cff7c72bd413c71b7d46b8a2940d60fc39",
        13990,
      ),
      implementationSource: artifact(
        "implementations/linear_advection_1d.c",
        "2b298277ae491d5ce9b0d4b0706ad482d39ea66453976d2a01d2b66948fb42fe",
        15859,
      ),
    },
    {
      caseId: "linear_advection_2d",
      kind: "linear_advection",
      dimensions: 2,
      specification: artifact(
        "specifications/linear_advection_2d.rkt",
        "61180efa18f160c4b5303c6a0ff1fa4d5b4c56d44817510bcd8af51e69e4666b",
        2327,
      ),
      formalSource: artifact(
        "proofs/linear_advection_2d.lean",
        "ca8ecc30add309adfd902301b2bfb6de08af21663d2f7212b28e2b9ca1f64520",
        25363,
      ),
      implementationSource: artifact(
        "implementations/linear_advection_2d.c",
        "2c6db5e808f502a2f402ac98474b07720eb76da3e653ad095e8d84a3a1520e2b",
        29158,
      ),
    },
    {
      caseId: "linear_advection_3d",
      kind: "linear_advection",
      dimensions: 3,
      specification: artifact(
        "specifications/linear_advection_3d.rkt",
        "1f0a3354ef9e7d4ab43663f8f409c88febf4aaa055c04c67079a6f0e58fceb12",
        3201,
      ),
      formalSource: artifact(
        "proofs/linear_advection_3d.lean",
        "e8494ac20e2562b1e27c1de42c81485178b00f8f6dae3eb7ec67dcda7b07c7cb",
        37901,
      ),
      implementationSource: artifact(
        "implementations/linear_advection_3d.c",
        "6fad1ae97c60769f181c508f151c5289c565c2bc903116ae0ac7178ca37405c0",
        43376,
      ),
    },
  ] as const;

const policyWithoutHash = (): BuildPolicyInput => ({
  artifactId: CASIMIR_LANYON_ADAPTER_POLICY_ARTIFACT_ID,
  schemaVersion: CASIMIR_LANYON_ADAPTER_POLICY_SCHEMA_VERSION,
  policyId: "casimir.lanyon.advection-diffusion.snapshot.2026-07-24",
  producerId: CASIMIR_LANYON_PRODUCER_ID,
  adapterContractId: CASIMIR_LANYON_ADAPTER_CONTRACT_ID,
  repository: {
    uri: CASIMIR_LANYON_REPOSITORY_URI,
    commitSha: CASIMIR_LANYON_PINNED_COMMIT,
    selectedSourceTreeSha256: CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256,
    selectedArtifactCount: 27,
  },
  cases: CASIMIR_LANYON_ADVECTION_DIFFUSION_CASES_V1.map((entry) => ({
    ...entry,
    specification: { ...entry.specification },
    formalSource: { ...entry.formalSource },
    implementationSource: { ...entry.implementationSource },
  })),
  admission: {
    developerOnly: true,
    readOnly: true,
    exactSourceBytesRequired: true,
    symlinksAllowed: false,
    networkExecutionAllowed: false,
    producerOutputTrusted: false,
  },
  authority: {
    outputRole: "adapter_admission_policy",
    scientificAuthority: false,
    formalAuthority: false,
    numericalAuthority: false,
    empiricalAuthority: false,
    physicalAuthority: false,
    assistantAnswer: false,
    terminalEligible: false,
  },
});

const selectedArtifacts = (
  cases: readonly CasimirLanyonAdvectionDiffusionCaseV1[],
): CasimirLanyonSourceArtifactV1[] =>
  cases
    .flatMap((entry) => [
      entry.specification,
      entry.formalSource,
      entry.implementationSource,
    ])
    .sort((left, right) =>
      left.logicalPath.localeCompare(right.logicalPath, "en"),
    );

export function computeCasimirLanyonSelectedSourceTreeSha256V1(
  cases: readonly CasimirLanyonAdvectionDiffusionCaseV1[],
): string {
  const manifest = `${selectedArtifacts(cases)
    .map((entry) => `${entry.logicalPath}\t${entry.sha256}\t${entry.sizeBytes}`)
    .join("\n")}\n`;
  return createHash("sha256").update(manifest, "utf8").digest("hex");
}

export async function buildCasimirLanyonAdapterPolicyV1(): Promise<CasimirLanyonAdapterPolicyV1> {
  const withoutHash = policyWithoutHash();
  return {
    ...withoutHash,
    artifactSha256: await computeCasimirSpecValueSha256V1({
      domain: CASIMIR_LANYON_ADAPTER_POLICY_HASH_DOMAIN,
      value: withoutHash,
    }),
  };
}

const isSha256 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isSafeRelativePath = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("/") &&
  !/^[a-zA-Z]:[\\/]/.test(value) &&
  !value.split(/[\\/]/).includes("..");

export async function validateCasimirLanyonAdapterPolicyIntegrityV1(
  value: unknown,
): Promise<string[]> {
  const issues: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value))
    return ["policy must be an object"];
  const policy = value as Record<string, unknown>;
  if (policy.artifactId !== CASIMIR_LANYON_ADAPTER_POLICY_ARTIFACT_ID)
    issues.push("artifactId is invalid");
  if (policy.schemaVersion !== CASIMIR_LANYON_ADAPTER_POLICY_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  if (!isSha256(policy.artifactSha256))
    issues.push("artifactSha256 must be lowercase SHA-256");
  const expected = await buildCasimirLanyonAdapterPolicyV1();
  if (JSON.stringify(policy) !== JSON.stringify(expected))
    issues.push("policy must exactly equal the pinned adapter policy");
  if (
    computeCasimirLanyonSelectedSourceTreeSha256V1(expected.cases) !==
    CASIMIR_LANYON_SELECTED_SOURCE_TREE_SHA256
  ) {
    issues.push("selected source tree hash does not match pinned source bytes");
  }
  const paths = selectedArtifacts(expected.cases).map(
    (entry) => entry.logicalPath,
  );
  if (
    paths.length !== 27 ||
    new Set(paths).size !== 27 ||
    paths.some((entry) => !isSafeRelativePath(entry))
  ) {
    issues.push("pinned source paths must contain 27 safe unique entries");
  }
  return issues;
}
