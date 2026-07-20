import path from "node:path";

import {
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
  NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
  NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
} from "../../../shared/contracts/nhm2-independent-numerical-execution-descriptor.v1";

export const NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_ARTIFACT_ID =
  "nhm2.independent_runtime_plan_admission_observation" as const;
export const NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_CONTRACT_VERSION =
  "nhm2_independent_runtime_plan_admission_observation/v1" as const;

export type Nhm2IndependentRuntimeServerPolicyResolutionV1 = {
  status: "not_configured";
  authority: "server_owned_policy_resolver";
  policyArtifactId: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID;
  policyContractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION;
  policyId: null;
  policySemanticSha256: null;
  descriptorContractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION;
  blocker: "server_owned_independent_runtime_policy_not_configured";
};

export type Nhm2IndependentRuntimePlanAdmissionInputV1 = {
  projectRoot: string;
  candidateManifestPath: string;
};

export type Nhm2IndependentRuntimePlanAdmissionObservationV1 = {
  artifactId: typeof NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_ARTIFACT_ID;
  contractVersion: typeof NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_CONTRACT_VERSION;
  generatedAt: string;
  status: "not_configured";
  candidate: {
    projectRoot: string;
    manifestPath: string;
    manifestReadAttempted: false;
    manifestSha256: null;
    candidateId: null;
  };
  serverPolicy: Nhm2IndependentRuntimeServerPolicyResolutionV1;
  externalDescriptor: {
    contractVersion: typeof NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION;
    observationAttempted: false;
    descriptorPath: null;
    descriptorSha256: null;
    schemaValidated: false;
  };
  primaryReceipt: {
    observationAttempted: false;
    receiptPath: null;
    receiptSha256: null;
    filesystemVerified: false;
  };
  preseal: {
    status: "not_created";
    persistenceAttempted: false;
    createOnlyRequired: true;
    hashAddressRequired: true;
    path: null;
    sha256: null;
  };
  process: {
    launchAttempted: false;
    launchPermitted: false;
    observation: null;
  };
  blockers: ["server_owned_independent_runtime_policy_not_configured"];
  safeguards: {
    callerPolicyInjectionAccepted: false;
    callerPresealInjectionAccepted: false;
    callerProcessExecutorAccepted: false;
    persistenceEnabled: false;
  };
  claimLocks: {
    runtimePlanAdmitted: false;
    presealEstablished: false;
    externalExecutionObserved: false;
    independentImplementationLineageEstablished: false;
    independentContentLineageExclusionEstablished: false;
    independentNumericalReplicationReady: false;
    theoryClosureEstablished: false;
    empiricalValidationEstablished: false;
    physicalViabilityEstablished: false;
    transportEstablished: false;
    propulsionEstablished: false;
    routeEtaEstablished: false;
    certifiedSpeedEstablished: false;
  };
};

export class Nhm2IndependentRuntimePlanAdmissionError extends Error {
  readonly code: "admission_input_invalid";

  constructor(message: string) {
    super(message);
    this.name = "Nhm2IndependentRuntimePlanAdmissionError";
    this.code = "admission_input_invalid";
  }
}

const exactInputKeys = (value: object): boolean => {
  const keys = Object.keys(value).sort();
  return (
    keys.length === 2 &&
    keys[0] === "candidateManifestPath" &&
    keys[1] === "projectRoot"
  );
};

const normalizeCandidatePath = (input: {
  projectRoot: string;
  candidateManifestPath: string;
}): { projectRoot: string; manifestPath: string } => {
  if (
    input.projectRoot.trim().length === 0 ||
    input.candidateManifestPath.trim().length === 0 ||
    input.projectRoot.includes("\0") ||
    input.candidateManifestPath.includes("\0")
  ) {
    throw new Nhm2IndependentRuntimePlanAdmissionError(
      "Project root and candidate manifest path must be non-empty, NUL-free strings.",
    );
  }
  const projectRoot = path.resolve(input.projectRoot);
  const absoluteManifest = path.isAbsolute(input.candidateManifestPath)
    ? path.resolve(input.candidateManifestPath)
    : path.resolve(projectRoot, input.candidateManifestPath);
  const relative = path.relative(projectRoot, absoluteManifest);
  if (
    relative.length === 0 ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Nhm2IndependentRuntimePlanAdmissionError(
      "Candidate manifest path must resolve strictly beneath the project root.",
    );
  }
  return {
    projectRoot,
    manifestPath: relative.split(path.sep).join("/"),
  };
};

/**
 * Server-owned default. No enrolled policy store exists yet, so admission must
 * stop before candidate, receipt, descriptor, preseal, or process observation.
 */
export async function resolveNhm2IndependentRuntimeServerPolicy(input: {
  projectRoot: string;
}): Promise<Nhm2IndependentRuntimeServerPolicyResolutionV1> {
  void input;
  return {
    status: "not_configured",
    authority: "server_owned_policy_resolver",
    policyArtifactId:
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_ARTIFACT_ID,
    policyContractVersion:
      NHM2_INDEPENDENT_NUMERICAL_APPROVED_TOOLCHAIN_POLICY_CONTRACT_VERSION,
    policyId: null,
    policySemanticSha256: null,
    descriptorContractVersion:
      NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
    blocker: "server_owned_independent_runtime_policy_not_configured",
  };
}

/**
 * Observation-only production API. It intentionally exposes no execute flag,
 * dependency injection, policy argument, receipt argument, or preseal bytes.
 */
export async function admitNhm2IndependentRuntimePlan(
  input: Nhm2IndependentRuntimePlanAdmissionInputV1,
): Promise<Nhm2IndependentRuntimePlanAdmissionObservationV1> {
  if (
    input == null ||
    typeof input !== "object" ||
    !exactInputKeys(input) ||
    typeof input.projectRoot !== "string" ||
    typeof input.candidateManifestPath !== "string"
  ) {
    throw new Nhm2IndependentRuntimePlanAdmissionError(
      "Admission accepts exactly projectRoot and candidateManifestPath.",
    );
  }
  const candidate = normalizeCandidatePath(input);
  const serverPolicy = await resolveNhm2IndependentRuntimeServerPolicy({
    projectRoot: candidate.projectRoot,
  });

  return {
    artifactId: NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_ARTIFACT_ID,
    contractVersion: NHM2_INDEPENDENT_RUNTIME_PLAN_ADMISSION_CONTRACT_VERSION,
    generatedAt: new Date().toISOString(),
    status: "not_configured",
    candidate: {
      ...candidate,
      manifestReadAttempted: false,
      manifestSha256: null,
      candidateId: null,
    },
    serverPolicy,
    externalDescriptor: {
      contractVersion:
        NHM2_INDEPENDENT_NUMERICAL_EXECUTION_DESCRIPTOR_CONTRACT_VERSION,
      observationAttempted: false,
      descriptorPath: null,
      descriptorSha256: null,
      schemaValidated: false,
    },
    primaryReceipt: {
      observationAttempted: false,
      receiptPath: null,
      receiptSha256: null,
      filesystemVerified: false,
    },
    preseal: {
      status: "not_created",
      persistenceAttempted: false,
      createOnlyRequired: true,
      hashAddressRequired: true,
      path: null,
      sha256: null,
    },
    process: {
      launchAttempted: false,
      launchPermitted: false,
      observation: null,
    },
    blockers: ["server_owned_independent_runtime_policy_not_configured"],
    safeguards: {
      callerPolicyInjectionAccepted: false,
      callerPresealInjectionAccepted: false,
      callerProcessExecutorAccepted: false,
      persistenceEnabled: false,
    },
    claimLocks: {
      runtimePlanAdmitted: false,
      presealEstablished: false,
      externalExecutionObserved: false,
      independentImplementationLineageEstablished: false,
      independentContentLineageExclusionEstablished: false,
      independentNumericalReplicationReady: false,
      theoryClosureEstablished: false,
      empiricalValidationEstablished: false,
      physicalViabilityEstablished: false,
      transportEstablished: false,
      propulsionEstablished: false,
      routeEtaEstablished: false,
      certifiedSpeedEstablished: false,
    },
  };
}
