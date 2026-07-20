import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
} from "./nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS,
} from "./nhm2-experiment-ready-theory-closure.v1";
import {
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID,
  NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
} from "./nhm2-formal-kernel-replay-manifest.v1";

export {
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION,
  NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID,
} from "./nhm2-formal-kernel-replay-manifest.v1";

export const NHM2_FORMAL_MANIFEST_CERTIFICATE_CONTRACT_VERSION =
  "nhm2_formal_manifest_certificate/v1" as const;

export const NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_IDS = [
  ...NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS,
] as const;

export const NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_EVIDENCE_SCOPE =
  Object.freeze(
    Object.entries(
      NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
    )
      .map(([evidenceId, contractVersion]) => ({ evidenceId, contractVersion }))
      .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
  );

export const NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_SCOPE =
  Object.freeze(
    Object.entries(NHM2_EXPERIMENT_READY_THEORY_CLOSURE_REQUIRED_CHECKS)
      .flatMap(([evidenceId, checkIds]) =>
        (checkIds as readonly string[]).map(
          (checkId) => `${evidenceId}:${checkId}`,
        ),
      )
      .sort(),
  );

export type Nhm2FormalManifestCertificateCheckId =
  (typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_IDS)[number];
export type Nhm2FormalManifestCertificateStatus = "pass" | "blocked" | "fail";

export type Nhm2FormalManifestCertificateHashedArtifactV1 = {
  path: string | null;
  sha256: string | null;
};

export type Nhm2FormalManifestCertificateBindingV1 =
  Nhm2FormalManifestCertificateHashedArtifactV1 & {
    artifactId: string | null;
    contractVersion: string | null;
  };

export type Nhm2FormalManifestCertificateKernelReplayBindingV1 = {
  manifest: Nhm2FormalManifestCertificateBindingV1;
  preRunSourceLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
  preRunSourceArtifacts: Nhm2FormalManifestCertificateHashedArtifactV1[];
  kernelBinary: Nhm2FormalManifestCertificateHashedArtifactV1;
  theoremReplayLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
  usedAxiomLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
  usedAssumptionLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
  aggregateReplayTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
  claimLockProof: Nhm2FormalManifestCertificateHashedArtifactV1;
  claimLockTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
};

export type Nhm2FormalManifestCertificateInvocationV1 = {
  entrypoint: string | null;
  command: string | null;
  args: string[];
  cwd: string | null;
  environment: Array<{
    name: string | null;
    valueKind: "literal" | "candidate_manifest_raw_sha256" | null;
    value: string | null;
  }>;
  outputDirectory: string | null;
};

type ExecutionIdentity = {
  requestId: string | null;
  runId: string | null;
  receiptId: string | null;
  runtimeId: string | null;
  implementationId: string | null;
  independenceGroup: string | null;
};

export type Nhm2FormalManifestCertificateV1 = {
  contractVersion: typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_CONTRACT_VERSION;
  generatedAt: string | null;
  identity: {
    candidateId: string | null;
    candidateManifestId: string | null;
    candidateManifest: Nhm2FormalManifestCertificateBindingV1;
    numericPolicySet: Nhm2FormalManifestCertificateHashedArtifactV1 & {
      policySetId: string | null;
      semanticSha256: string | null;
    };
    laneId: "nhm2_shift_lapse" | null;
    profile: Nhm2FormalManifestCertificateBindingV1 & {
      selectedProfileId: string | null;
    };
    chart: Nhm2FormalManifestCertificateBindingV1 & {
      chartId: string | null;
    };
    atlas: Nhm2FormalManifestCertificateBindingV1 & {
      atlasId: string | null;
    };
    units: Nhm2FormalManifestCertificateBindingV1 & {
      unitsId: string | null;
    };
    normalization: Nhm2FormalManifestCertificateBindingV1 & {
      normalizationId: string | null;
    };
    candidateGitSha: string | null;
    priorExecutions: {
      primaryNumerical: ExecutionIdentity;
      independentNumerical: ExecutionIdentity;
    };
    formalPlan: {
      planRole: "formal_kernel" | null;
      requestId: string | null;
      runId: string | null;
      receiptId: string | null;
      runtimeId: string | null;
      sourceCommitSha: string | null;
      deterministicSeed: string | null;
      solver: Nhm2FormalManifestCertificateBindingV1 & {
        solverId: string | null;
        solverVersion: string | null;
        implementationId: string | null;
        independenceGroup: string | null;
      };
      environmentLock: Nhm2FormalManifestCertificateBindingV1 & {
        environmentId: string | null;
      };
      expectedInvocation: Nhm2FormalManifestCertificateInvocationV1;
    };
  };
  manifestMerkleCommitment: {
    algorithm: "sha256_binary_merkle_v1" | null;
    leafOrdering: "utf8_path_ascending" | null;
    pinnedMerkleRoot: string | null;
    recomputedMerkleRoot: string | null;
    leafCount: number | null;
    leafLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
    recomputationTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
  };
  sourceHashRecomputation: {
    sources: Array<{
      sourceId: string | null;
      path: string | null;
      sha256: string | null;
      expectedSha256: string | null;
      recomputedSha256: string | null;
    }>;
    expectedSourceCount: number | null;
    recomputedSourceCount: number | null;
    mismatchCount: number | null;
    expectedHashLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
    recomputedHashLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
    recomputationTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
  };
  formalKernelReplay: Nhm2FormalManifestCertificateKernelReplayBindingV1;
  theoremScope: {
    candidateContractVersion: string | null;
    candidateManifestId: string | null;
    candidateManifestSha256: string | null;
    numericPolicySetSemanticSha256: string | null;
    evidenceContracts: Array<{
      evidenceId: string | null;
      contractVersion: string | null;
    }>;
    requiredChecks: string[];
    scopeManifest: Nhm2FormalManifestCertificateHashedArtifactV1;
    theoremSource: Nhm2FormalManifestCertificateHashedArtifactV1;
  };
  kernelReplay: {
    replayMode: "cold_trusted_kernel" | null;
    kernelId: string | null;
    kernelVersion: string | null;
    kernelBinary: Nhm2FormalManifestCertificateHashedArtifactV1;
    theoremBundle: Nhm2FormalManifestCertificateHashedArtifactV1;
    proofTerm: Nhm2FormalManifestCertificateHashedArtifactV1;
    replayTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
    expectedTheoremCount: number | null;
    replayedTheoremCount: number | null;
    exitCode: number | null;
  };
  assumptions: {
    entries: Array<{
      assumptionId: string | null;
      kind: "typed_hypothesis" | "definition" | "empirical_placeholder" | null;
      valueType:
        | "proposition"
        | "real"
        | "integer"
        | "tensor"
        | "worldline"
        | "artifact_hash"
        | null;
      scopeRef: string | null;
      typeStatement: string | null;
      evidence: Nhm2FormalManifestCertificateHashedArtifactV1;
    }>;
    unscopedAssumptionCount: number | null;
    unscopedBooleanCount: number | null;
    assumptionLedger: Nhm2FormalManifestCertificateHashedArtifactV1;
    booleanScanReport: Nhm2FormalManifestCertificateHashedArtifactV1;
  };
  claimLockTheorem: {
    theoremId:
      typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID | null;
    proposition:
      typeof NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION | null;
    proofTerm: Nhm2FormalManifestCertificateHashedArtifactV1;
    replayTranscript: Nhm2FormalManifestCertificateHashedArtifactV1;
    kernelResult: "proved" | null;
    physicalViabilityStatus: "blocked_pending_empirical_receipts" | null;
    physicalViabilityClaimAllowed: false | null;
    transportClaimAllowed: false | null;
    propulsionClaimAllowed: false | null;
    routeEtaClaimAllowed: false | null;
    speedAuthorityClaimAllowed: false | null;
    empiricalReceiptsRequired: true | null;
  };
  checks: Array<{
    checkId: Nhm2FormalManifestCertificateCheckId;
    status: Nhm2FormalManifestCertificateStatus;
    blockers: string[];
  }>;
  status: Nhm2FormalManifestCertificateStatus;
  formalManifestCertificateReady: boolean;
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    formalProofOnly: true;
    rawArtifactContainsPreallocatedIdsAndPreRunHashesOnly: true;
    persistedReceiptReferencesForbidden: true;
    postRunEnvelopeReferencesForbidden: true;
    physicalViability: false;
    transport: false;
    propulsion: false;
    routeEta: false;
    certifiedSpeed: false;
  };
};

type PrimitiveEvidence = Omit<
  Nhm2FormalManifestCertificateV1,
  | "contractVersion"
  | "checks"
  | "status"
  | "formalManifestCertificateReady"
  | "blockers"
  | "claimBoundary"
>;

type DeepPartial<T> =
  T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> | null }
      : T;

export type BuildNhm2FormalManifestCertificateInput =
  DeepPartial<PrimitiveEvidence>;

type CheckDraft = {
  checkId: Nhm2FormalManifestCertificateCheckId;
  missing: string[];
  failures: string[];
};

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const CONTRACT_VERSION = /^[a-z0-9][a-z0-9_.-]*\/v[1-9][0-9]*$/i;
const REQUIRED_ENVIRONMENT = [
  "NHM2_ATLAS_SHA256",
  "NHM2_CANDIDATE_ID",
  "NHM2_CANDIDATE_MANIFEST_SHA256",
  "NHM2_CHART_ID",
  "NHM2_NORMALIZATION_SHA256",
  "NHM2_OUTPUT_DIR",
  "NHM2_RUN_ID",
  "NHM2_SELECTED_PROFILE_ID",
  "NHM2_UNITS_SHA256",
  "THEORY_RUNTIME_ID",
  "THEORY_RUNTIME_RECEIPT_ID",
  "THEORY_RUNTIME_REQUEST_ID",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);
const record = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};
const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const integer = (value: unknown): number | null => {
  const parsed = finite(value);
  return parsed != null && Number.isInteger(parsed) ? parsed : null;
};
const unique = (values: string[]): string[] => [...new Set(values)];
const isIsoTimestamp = (value: string): boolean => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
};

const artifact = (
  value: unknown,
): Nhm2FormalManifestCertificateHashedArtifactV1 => {
  const source = record(value);
  return { path: text(source.path), sha256: text(source.sha256) };
};
const binding = (value: unknown): Nhm2FormalManifestCertificateBindingV1 => {
  const source = record(value);
  return {
    artifactId: text(source.artifactId),
    contractVersion: text(source.contractVersion),
    ...artifact(source),
  };
};
const execution = (value: unknown): ExecutionIdentity => {
  const source = record(value);
  return {
    requestId: text(source.requestId),
    runId: text(source.runId),
    receiptId: text(source.receiptId),
    runtimeId: text(source.runtimeId),
    implementationId: text(source.implementationId),
    independenceGroup: text(source.independenceGroup),
  };
};
const invocation = (
  value: unknown,
): Nhm2FormalManifestCertificateInvocationV1 => {
  const source = record(value);
  return {
    entrypoint: text(source.entrypoint),
    command: text(source.command),
    args: Array.isArray(source.args)
      ? source.args.map(text).filter((entry): entry is string => entry != null)
      : [],
    cwd: text(source.cwd),
    environment: Array.isArray(source.environment)
      ? source.environment.map((raw) => {
          const entry = record(raw);
          return {
            name: text(entry.name),
            valueKind:
              entry.valueKind === "literal" ||
              entry.valueKind === "candidate_manifest_raw_sha256"
                ? entry.valueKind
                : null,
            value: text(entry.value),
          };
        })
      : [],
    outputDirectory: text(source.outputDirectory),
  };
};

const normalize = (
  input: BuildNhm2FormalManifestCertificateInput,
): PrimitiveEvidence => {
  const root = record(input);
  const identity = record(root.identity);
  const policy = record(identity.numericPolicySet);
  const profile = record(identity.profile);
  const chart = record(identity.chart);
  const atlas = record(identity.atlas);
  const units = record(identity.units);
  const normalization = record(identity.normalization);
  const prior = record(identity.priorExecutions);
  const plan = record(identity.formalPlan);
  const solver = record(plan.solver);
  const environment = record(plan.environmentLock);
  const merkle = record(root.manifestMerkleCommitment);
  const hashes = record(root.sourceHashRecomputation);
  const formalReplay = record(root.formalKernelReplay);
  const scope = record(root.theoremScope);
  const kernel = record(root.kernelReplay);
  const assumptions = record(root.assumptions);
  const locks = record(root.claimLockTheorem);
  return {
    generatedAt: text(root.generatedAt),
    identity: {
      candidateId: text(identity.candidateId),
      candidateManifestId: text(identity.candidateManifestId),
      candidateManifest: binding(identity.candidateManifest),
      numericPolicySet: {
        ...artifact(policy),
        policySetId: text(policy.policySetId),
        semanticSha256: text(policy.semanticSha256),
      },
      laneId: identity.laneId === "nhm2_shift_lapse" ? identity.laneId : null,
      profile: {
        ...binding(profile),
        selectedProfileId: text(profile.selectedProfileId),
      },
      chart: { ...binding(chart), chartId: text(chart.chartId) },
      atlas: { ...binding(atlas), atlasId: text(atlas.atlasId) },
      units: { ...binding(units), unitsId: text(units.unitsId) },
      normalization: {
        ...binding(normalization),
        normalizationId: text(normalization.normalizationId),
      },
      candidateGitSha: text(identity.candidateGitSha),
      priorExecutions: {
        primaryNumerical: execution(record(prior).primaryNumerical),
        independentNumerical: execution(record(prior).independentNumerical),
      },
      formalPlan: {
        planRole: plan.planRole === "formal_kernel" ? plan.planRole : null,
        requestId: text(plan.requestId),
        runId: text(plan.runId),
        receiptId: text(plan.receiptId),
        runtimeId: text(plan.runtimeId),
        sourceCommitSha: text(plan.sourceCommitSha),
        deterministicSeed: text(plan.deterministicSeed),
        solver: {
          ...binding(solver),
          solverId: text(solver.solverId),
          solverVersion: text(solver.solverVersion),
          implementationId: text(solver.implementationId),
          independenceGroup: text(solver.independenceGroup),
        },
        environmentLock: {
          ...binding(environment),
          environmentId: text(environment.environmentId),
        },
        expectedInvocation: invocation(plan.expectedInvocation),
      },
    },
    manifestMerkleCommitment: {
      algorithm:
        merkle.algorithm === "sha256_binary_merkle_v1"
          ? merkle.algorithm
          : null,
      leafOrdering:
        merkle.leafOrdering === "utf8_path_ascending"
          ? merkle.leafOrdering
          : null,
      pinnedMerkleRoot: text(merkle.pinnedMerkleRoot),
      recomputedMerkleRoot: text(merkle.recomputedMerkleRoot),
      leafCount: integer(merkle.leafCount),
      leafLedger: artifact(merkle.leafLedger),
      recomputationTranscript: artifact(merkle.recomputationTranscript),
    },
    sourceHashRecomputation: {
      sources: Array.isArray(hashes.sources)
        ? hashes.sources.map((raw) => {
            const source = record(raw);
            return {
              sourceId: text(source.sourceId),
              path: text(source.path),
              sha256: text(source.sha256),
              expectedSha256: text(source.expectedSha256),
              recomputedSha256: text(source.recomputedSha256),
            };
          })
        : [],
      expectedSourceCount: integer(hashes.expectedSourceCount),
      recomputedSourceCount: integer(hashes.recomputedSourceCount),
      mismatchCount: integer(hashes.mismatchCount),
      expectedHashLedger: artifact(hashes.expectedHashLedger),
      recomputedHashLedger: artifact(hashes.recomputedHashLedger),
      recomputationTranscript: artifact(hashes.recomputationTranscript),
    },
    formalKernelReplay: {
      manifest: binding(formalReplay.manifest),
      preRunSourceLedger: artifact(formalReplay.preRunSourceLedger),
      preRunSourceArtifacts: Array.isArray(formalReplay.preRunSourceArtifacts)
        ? formalReplay.preRunSourceArtifacts.map(artifact)
        : [],
      kernelBinary: artifact(formalReplay.kernelBinary),
      theoremReplayLedger: artifact(formalReplay.theoremReplayLedger),
      usedAxiomLedger: artifact(formalReplay.usedAxiomLedger),
      usedAssumptionLedger: artifact(formalReplay.usedAssumptionLedger),
      aggregateReplayTranscript: artifact(
        formalReplay.aggregateReplayTranscript,
      ),
      claimLockProof: artifact(formalReplay.claimLockProof),
      claimLockTranscript: artifact(formalReplay.claimLockTranscript),
    },
    theoremScope: {
      candidateContractVersion: text(scope.candidateContractVersion),
      candidateManifestId: text(scope.candidateManifestId),
      candidateManifestSha256: text(scope.candidateManifestSha256),
      numericPolicySetSemanticSha256: text(
        scope.numericPolicySetSemanticSha256,
      ),
      evidenceContracts: Array.isArray(scope.evidenceContracts)
        ? scope.evidenceContracts.map((raw) => {
            const entry = record(raw);
            return {
              evidenceId: text(entry.evidenceId),
              contractVersion: text(entry.contractVersion),
            };
          })
        : [],
      requiredChecks: Array.isArray(scope.requiredChecks)
        ? scope.requiredChecks
            .map(text)
            .filter((entry): entry is string => entry != null)
        : [],
      scopeManifest: artifact(scope.scopeManifest),
      theoremSource: artifact(scope.theoremSource),
    },
    kernelReplay: {
      replayMode:
        kernel.replayMode === "cold_trusted_kernel" ? kernel.replayMode : null,
      kernelId: text(kernel.kernelId),
      kernelVersion: text(kernel.kernelVersion),
      kernelBinary: artifact(kernel.kernelBinary),
      theoremBundle: artifact(kernel.theoremBundle),
      proofTerm: artifact(kernel.proofTerm),
      replayTranscript: artifact(kernel.replayTranscript),
      expectedTheoremCount: integer(kernel.expectedTheoremCount),
      replayedTheoremCount: integer(kernel.replayedTheoremCount),
      exitCode: integer(kernel.exitCode),
    },
    assumptions: {
      entries: Array.isArray(assumptions.entries)
        ? assumptions.entries.map((raw) => {
            const entry = record(raw);
            return {
              assumptionId: text(entry.assumptionId),
              kind:
                entry.kind === "typed_hypothesis" ||
                entry.kind === "definition" ||
                entry.kind === "empirical_placeholder"
                  ? entry.kind
                  : null,
              valueType:
                entry.valueType === "proposition" ||
                entry.valueType === "real" ||
                entry.valueType === "integer" ||
                entry.valueType === "tensor" ||
                entry.valueType === "worldline" ||
                entry.valueType === "artifact_hash"
                  ? entry.valueType
                  : null,
              scopeRef: text(entry.scopeRef),
              typeStatement: text(entry.typeStatement),
              evidence: artifact(entry.evidence),
            };
          })
        : [],
      unscopedAssumptionCount: integer(assumptions.unscopedAssumptionCount),
      unscopedBooleanCount: integer(assumptions.unscopedBooleanCount),
      assumptionLedger: artifact(assumptions.assumptionLedger),
      booleanScanReport: artifact(assumptions.booleanScanReport),
    },
    claimLockTheorem: {
      theoremId:
        locks.theoremId ===
        NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_THEOREM_ID
          ? locks.theoremId
          : null,
      proposition:
        locks.proposition ===
        NHM2_FORMAL_MANIFEST_CERTIFICATE_CLAIM_LOCK_PROPOSITION
          ? locks.proposition
          : null,
      proofTerm: artifact(locks.proofTerm),
      replayTranscript: artifact(locks.replayTranscript),
      kernelResult: locks.kernelResult === "proved" ? locks.kernelResult : null,
      physicalViabilityStatus:
        locks.physicalViabilityStatus === "blocked_pending_empirical_receipts"
          ? locks.physicalViabilityStatus
          : null,
      physicalViabilityClaimAllowed:
        locks.physicalViabilityClaimAllowed === false ? false : null,
      transportClaimAllowed:
        locks.transportClaimAllowed === false ? false : null,
      propulsionClaimAllowed:
        locks.propulsionClaimAllowed === false ? false : null,
      routeEtaClaimAllowed: locks.routeEtaClaimAllowed === false ? false : null,
      speedAuthorityClaimAllowed:
        locks.speedAuthorityClaimAllowed === false ? false : null,
      empiricalReceiptsRequired:
        locks.empiricalReceiptsRequired === true ? true : null,
    },
  };
};

const draft = (checkId: Nhm2FormalManifestCertificateCheckId): CheckDraft => ({
  checkId,
  missing: [],
  failures: [],
});
const requireText = (
  value: string | null,
  label: string,
  check: CheckDraft,
) => {
  if (value == null) check.missing.push(`${label}_missing`);
};
const requireSha = (value: string | null, label: string, check: CheckDraft) => {
  if (value == null) check.missing.push(`${label}_sha256_missing`);
  else if (!SHA256.test(value)) check.failures.push(`${label}_sha256_invalid`);
};
const requireGitSha = (
  value: string | null,
  label: string,
  check: CheckDraft,
) => {
  if (value == null) check.missing.push(`${label}_missing`);
  else if (!GIT_SHA.test(value)) check.failures.push(`${label}_invalid`);
};
const requireArtifact = (
  value: Nhm2FormalManifestCertificateHashedArtifactV1,
  label: string,
  check: CheckDraft,
) => {
  requireText(value.path, `${label}_path`, check);
  requireSha(value.sha256, label, check);
};
const requireBinding = (
  value: Nhm2FormalManifestCertificateBindingV1,
  label: string,
  check: CheckDraft,
) => {
  requireArtifact(value, label, check);
  requireText(value.artifactId, `${label}_artifact_id`, check);
  if (value.contractVersion == null)
    check.missing.push(`${label}_contract_version_missing`);
  else if (!CONTRACT_VERSION.test(value.contractVersion))
    check.failures.push(`${label}_contract_version_invalid`);
};

const sameArtifact = (
  left: Nhm2FormalManifestCertificateHashedArtifactV1,
  right: Nhm2FormalManifestCertificateHashedArtifactV1,
): boolean =>
  left.path != null &&
  left.sha256 != null &&
  left.path === right.path &&
  left.sha256 === right.sha256;

const compareUtf8 = (left: string, right: string): number =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

const addIdentity = (core: PrimitiveEvidence, check: CheckDraft): void => {
  const identity = core.identity;
  if (core.generatedAt == null) check.missing.push("generated_at_missing");
  else if (!isIsoTimestamp(core.generatedAt))
    check.failures.push("generated_at_invalid");
  requireText(identity.candidateId, "candidate_id", check);
  requireText(identity.candidateManifestId, "candidate_manifest_id", check);
  requireBinding(identity.candidateManifest, "candidate_manifest", check);
  if (
    identity.candidateManifest.contractVersion != null &&
    identity.candidateManifest.contractVersion !==
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION
  )
    check.failures.push("candidate_manifest_contract_version_mismatch");
  requireArtifact(identity.numericPolicySet, "numeric_policy_set", check);
  requireText(
    identity.numericPolicySet.policySetId,
    "numeric_policy_set_id",
    check,
  );
  requireSha(
    identity.numericPolicySet.semanticSha256,
    "numeric_policy_set_semantic",
    check,
  );
  if (identity.laneId == null) check.missing.push("lane_id_missing");
  requireBinding(identity.profile, "profile", check);
  requireText(identity.profile.selectedProfileId, "selected_profile_id", check);
  requireBinding(identity.chart, "chart", check);
  requireText(identity.chart.chartId, "chart_id", check);
  requireBinding(identity.atlas, "atlas", check);
  requireText(identity.atlas.atlasId, "atlas_id", check);
  requireBinding(identity.units, "units", check);
  requireText(identity.units.unitsId, "units_id", check);
  requireBinding(identity.normalization, "normalization", check);
  requireText(
    identity.normalization.normalizationId,
    "normalization_id",
    check,
  );
  requireGitSha(identity.candidateGitSha, "candidate_git_sha", check);
};

const addFormalPlan = (core: PrimitiveEvidence, check: CheckDraft): void => {
  const identity = core.identity;
  const plan = identity.formalPlan;
  if (plan.planRole == null) check.missing.push("formal_plan_role_missing");
  for (const [label, value] of [
    ["request_id", plan.requestId],
    ["run_id", plan.runId],
    ["receipt_id", plan.receiptId],
    ["runtime_id", plan.runtimeId],
    ["source_commit_sha", plan.sourceCommitSha],
    ["deterministic_seed", plan.deterministicSeed],
  ] as const)
    requireText(value, `formal_${label}`, check);
  requireGitSha(plan.sourceCommitSha, "formal_source_commit_sha", check);
  requireBinding(plan.solver, "formal_solver", check);
  requireText(plan.solver.solverId, "formal_solver_id", check);
  requireText(plan.solver.solverVersion, "formal_solver_version", check);
  requireText(plan.solver.implementationId, "formal_implementation_id", check);
  requireText(
    plan.solver.independenceGroup,
    "formal_independence_group",
    check,
  );
  requireBinding(plan.environmentLock, "formal_environment_lock", check);
  requireText(
    plan.environmentLock.environmentId,
    "formal_environment_id",
    check,
  );
  if (
    plan.requestId != null &&
    plan.runtimeId != null &&
    plan.receiptId != null &&
    plan.receiptId !==
      nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
        plan.runtimeId,
        plan.requestId,
      )
  )
    check.failures.push("formal_receipt_id_not_deterministic");

  const invocationValue = plan.expectedInvocation;
  requireText(invocationValue.entrypoint, "planned_entrypoint", check);
  requireText(invocationValue.command, "planned_command", check);
  if (invocationValue.args.length === 0)
    check.missing.push("planned_args_missing");
  requireText(invocationValue.cwd, "planned_cwd", check);
  requireText(
    invocationValue.outputDirectory,
    "planned_output_directory",
    check,
  );
  const names = invocationValue.environment.map((entry) => entry.name);
  if (names.length === 0) {
    check.missing.push("planned_environment_missing");
  } else if (
    names.some((name) => name == null) ||
    new Set(names).size !== names.length ||
    names.length !== REQUIRED_ENVIRONMENT.length ||
    REQUIRED_ENVIRONMENT.some((name) => !names.includes(name))
  )
    check.failures.push("planned_environment_key_set_invalid");
  if (
    names.some(
      (name, index) => index > 0 && (name ?? "") < (names[index - 1] ?? ""),
    )
  )
    check.failures.push("planned_environment_not_canonical");
  const expected = new Map<string, string | null>([
    ["NHM2_ATLAS_SHA256", identity.atlas.sha256],
    ["NHM2_CANDIDATE_ID", identity.candidateId],
    ["NHM2_CHART_ID", identity.chart.chartId],
    ["NHM2_NORMALIZATION_SHA256", identity.normalization.sha256],
    ["NHM2_OUTPUT_DIR", invocationValue.outputDirectory],
    ["NHM2_RUN_ID", plan.runId],
    ["NHM2_SELECTED_PROFILE_ID", identity.profile.selectedProfileId],
    ["NHM2_UNITS_SHA256", identity.units.sha256],
    ["THEORY_RUNTIME_ID", plan.runtimeId],
    ["THEORY_RUNTIME_RECEIPT_ID", plan.receiptId],
    ["THEORY_RUNTIME_REQUEST_ID", plan.requestId],
  ]);
  for (const [name, expectedValue] of expected) {
    const entry = invocationValue.environment.find(
      (item) => item.name === name,
    );
    if (
      entry != null &&
      (entry.valueKind !== "literal" || entry.value !== expectedValue)
    )
      check.failures.push(`planned_environment_${name.toLowerCase()}_mismatch`);
  }
  const manifestEntry = invocationValue.environment.find(
    (entry) => entry.name === "NHM2_CANDIDATE_MANIFEST_SHA256",
  );
  if (
    manifestEntry != null &&
    (manifestEntry.valueKind !== "candidate_manifest_raw_sha256" ||
      manifestEntry.value !== null)
  )
    check.failures.push("planned_candidate_manifest_sha_resolver_invalid");

  const prior = [
    ["primary", identity.priorExecutions.primaryNumerical],
    ["independent", identity.priorExecutions.independentNumerical],
  ] as const;
  for (const [label, executionValue] of prior) {
    for (const [field, value] of Object.entries(executionValue))
      requireText(value, `${label}_${field}`, check);
    for (const [field, priorValue, formalValue] of [
      ["request", executionValue.requestId, plan.requestId],
      ["run", executionValue.runId, plan.runId],
      ["receipt", executionValue.receiptId, plan.receiptId],
      ["runtime", executionValue.runtimeId, plan.runtimeId],
      [
        "implementation",
        executionValue.implementationId,
        plan.solver.implementationId,
      ],
      [
        "independence_group",
        executionValue.independenceGroup,
        plan.solver.independenceGroup,
      ],
    ] as const) {
      if (
        priorValue != null &&
        formalValue != null &&
        priorValue === formalValue
      )
        check.failures.push(`formal_${field}_not_distinct_from_${label}`);
    }
  }
  const primary = identity.priorExecutions.primaryNumerical;
  const independent = identity.priorExecutions.independentNumerical;
  if (
    primary.implementationId != null &&
    independent.implementationId != null &&
    primary.implementationId === independent.implementationId
  )
    check.failures.push("prior_numerical_implementations_not_distinct");
  if (
    primary.independenceGroup != null &&
    independent.independenceGroup != null &&
    primary.independenceGroup === independent.independenceGroup
  )
    check.failures.push("prior_numerical_independence_groups_not_distinct");
};

const deriveChecks = (core: PrimitiveEvidence): CheckDraft[] => {
  const checks = new Map(
    NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_IDS.map((id) => [
      id,
      draft(id),
    ]),
  );
  const get = (id: Nhm2FormalManifestCertificateCheckId) => checks.get(id)!;

  const merkle = get("candidate_manifest_merkle_root_pinned");
  addIdentity(core, merkle);
  if (core.manifestMerkleCommitment.algorithm == null)
    merkle.missing.push("merkle_algorithm_missing");
  if (core.manifestMerkleCommitment.leafOrdering == null)
    merkle.missing.push("merkle_leaf_ordering_missing");
  requireSha(
    core.manifestMerkleCommitment.pinnedMerkleRoot,
    "pinned_merkle_root",
    merkle,
  );
  requireSha(
    core.manifestMerkleCommitment.recomputedMerkleRoot,
    "recomputed_merkle_root",
    merkle,
  );
  if (
    core.manifestMerkleCommitment.pinnedMerkleRoot != null &&
    core.manifestMerkleCommitment.recomputedMerkleRoot != null &&
    core.manifestMerkleCommitment.pinnedMerkleRoot !==
      core.manifestMerkleCommitment.recomputedMerkleRoot
  )
    merkle.failures.push("candidate_manifest_merkle_root_mismatch");
  if (
    core.manifestMerkleCommitment.leafCount == null ||
    core.manifestMerkleCommitment.leafCount <= 0
  )
    merkle.missing.push("merkle_leaf_count_missing_or_invalid");
  requireArtifact(
    core.manifestMerkleCommitment.leafLedger,
    "merkle_leaf_ledger",
    merkle,
  );
  requireArtifact(
    core.manifestMerkleCommitment.recomputationTranscript,
    "merkle_recomputation_transcript",
    merkle,
  );
  requireArtifact(
    core.formalKernelReplay.preRunSourceLedger,
    "formal_replay_pre_run_source_ledger",
    merkle,
  );
  if (
    core.formalKernelReplay.preRunSourceLedger.path != null &&
    core.formalKernelReplay.preRunSourceLedger.sha256 != null &&
    !sameArtifact(
      core.formalKernelReplay.preRunSourceLedger,
      core.manifestMerkleCommitment.leafLedger,
    )
  )
    merkle.failures.push("formal_replay_source_ledger_not_merkle_leaf_ledger");

  const sources = get("source_artifact_hashes_recomputed");
  requireArtifact(
    core.sourceHashRecomputation.expectedHashLedger,
    "expected_source_hash_ledger",
    sources,
  );
  requireArtifact(
    core.sourceHashRecomputation.recomputedHashLedger,
    "recomputed_source_hash_ledger",
    sources,
  );
  requireArtifact(
    core.sourceHashRecomputation.recomputationTranscript,
    "source_hash_recomputation_transcript",
    sources,
  );
  if (core.sourceHashRecomputation.sources.length === 0)
    sources.missing.push("source_hash_entries_missing");
  const sourceIds = core.sourceHashRecomputation.sources.map(
    (entry) => entry.sourceId,
  );
  if (
    sourceIds.some((entry) => entry == null) ||
    new Set(sourceIds).size !== sourceIds.length
  )
    sources.failures.push("source_hash_ids_missing_or_duplicate");
  let derivedMismatches = 0;
  for (const entry of core.sourceHashRecomputation.sources) {
    requireText(entry.path, "source_path", sources);
    requireSha(entry.sha256, "source_artifact", sources);
    requireSha(entry.expectedSha256, "source_expected", sources);
    requireSha(entry.recomputedSha256, "source_recomputed", sources);
    if (
      entry.sha256 != null &&
      entry.expectedSha256 != null &&
      entry.recomputedSha256 != null &&
      (entry.sha256 !== entry.expectedSha256 ||
        entry.sha256 !== entry.recomputedSha256)
    )
      derivedMismatches += 1;
  }
  const sourceCount = core.sourceHashRecomputation.sources.length;
  const sourcePaths = core.sourceHashRecomputation.sources.map(
    (entry) => entry.path,
  );
  if (
    sourcePaths.some((path) => path == null) ||
    sourcePaths.some(
      (path, index) =>
        index > 0 && compareUtf8(sourcePaths[index - 1] ?? "", path ?? "") >= 0,
    )
  )
    sources.failures.push("source_paths_not_exact_sorted_unique");
  if (core.sourceHashRecomputation.expectedSourceCount == null)
    sources.missing.push("expected_source_count_missing");
  else if (core.sourceHashRecomputation.expectedSourceCount !== sourceCount)
    sources.failures.push("expected_source_count_mismatch");
  if (core.sourceHashRecomputation.recomputedSourceCount == null)
    sources.missing.push("recomputed_source_count_missing");
  else if (core.sourceHashRecomputation.recomputedSourceCount !== sourceCount)
    sources.failures.push("recomputed_source_count_mismatch");
  if (core.sourceHashRecomputation.mismatchCount == null)
    sources.missing.push("source_mismatch_count_missing");
  else if (core.sourceHashRecomputation.mismatchCount !== derivedMismatches)
    sources.failures.push("source_mismatch_count_not_derived");
  if (derivedMismatches > 0)
    sources.failures.push("source_hash_mismatch_present");
  if (
    core.manifestMerkleCommitment.leafCount != null &&
    core.manifestMerkleCommitment.leafCount !== sourceCount
  )
    sources.failures.push("merkle_leaf_count_not_source_count");
  for (const artifactValue of core.formalKernelReplay.preRunSourceArtifacts)
    requireArtifact(
      artifactValue,
      "formal_replay_pre_run_source_artifact",
      sources,
    );
  const expectedReplaySources = core.sourceHashRecomputation.sources.map(
    (entry) => ({ path: entry.path, sha256: entry.sha256 }),
  );
  if (
    JSON.stringify(core.formalKernelReplay.preRunSourceArtifacts) !==
    JSON.stringify(expectedReplaySources)
  )
    sources.failures.push("formal_replay_pre_run_source_artifacts_not_exact");

  const scope = get("theorem_scope_matches_candidate_contract");
  if (core.theoremScope.candidateContractVersion == null)
    scope.missing.push("candidate_contract_version_missing");
  else if (
    core.theoremScope.candidateContractVersion !==
    NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_CONTRACT_VERSION
  )
    scope.failures.push("candidate_contract_version_mismatch");
  if (core.theoremScope.candidateManifestId == null)
    scope.missing.push("scope_candidate_manifest_id_missing");
  else if (
    core.theoremScope.candidateManifestId !== core.identity.candidateManifestId
  )
    scope.failures.push("scope_candidate_manifest_id_mismatch");
  requireSha(
    core.theoremScope.candidateManifestSha256,
    "scope_candidate_manifest",
    scope,
  );
  if (
    core.theoremScope.candidateManifestSha256 != null &&
    core.theoremScope.candidateManifestSha256 !==
      core.identity.candidateManifest.sha256
  )
    scope.failures.push("scope_candidate_manifest_sha_mismatch");
  requireSha(
    core.theoremScope.numericPolicySetSemanticSha256,
    "scope_numeric_policy_semantic",
    scope,
  );
  if (
    core.theoremScope.numericPolicySetSemanticSha256 != null &&
    core.theoremScope.numericPolicySetSemanticSha256 !==
      core.identity.numericPolicySet.semanticSha256
  )
    scope.failures.push("scope_numeric_policy_semantic_sha_mismatch");
  const actualEvidenceScope = [...core.theoremScope.evidenceContracts].sort(
    (left, right) =>
      (left.evidenceId ?? "").localeCompare(right.evidenceId ?? ""),
  );
  if (actualEvidenceScope.length === 0) {
    scope.missing.push("theorem_evidence_contract_scope_missing");
  } else if (
    JSON.stringify(actualEvidenceScope) !==
    JSON.stringify(NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_EVIDENCE_SCOPE)
  )
    scope.failures.push("theorem_evidence_contract_scope_not_exact");
  const actualChecks = [...core.theoremScope.requiredChecks].sort();
  if (actualChecks.length === 0) {
    scope.missing.push("theorem_required_check_scope_missing");
  } else if (
    JSON.stringify(actualChecks) !==
    JSON.stringify(NHM2_FORMAL_MANIFEST_CERTIFICATE_REQUIRED_CHECK_SCOPE)
  )
    scope.failures.push("theorem_required_check_scope_not_exact");
  requireArtifact(
    core.theoremScope.scopeManifest,
    "theorem_scope_manifest",
    scope,
  );
  requireArtifact(core.theoremScope.theoremSource, "theorem_source", scope);

  const kernel = get("independent_kernel_replay_pass");
  addFormalPlan(core, kernel);
  requireBinding(
    core.formalKernelReplay.manifest,
    "formal_kernel_replay_manifest",
    kernel,
  );
  if (
    core.formalKernelReplay.manifest.artifactId != null &&
    core.formalKernelReplay.manifest.artifactId !==
      NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_ARTIFACT_ID
  )
    kernel.failures.push("formal_kernel_replay_manifest_artifact_id_mismatch");
  if (
    core.formalKernelReplay.manifest.contractVersion != null &&
    core.formalKernelReplay.manifest.contractVersion !==
      NHM2_FORMAL_KERNEL_REPLAY_MANIFEST_CONTRACT_VERSION
  )
    kernel.failures.push("formal_kernel_replay_manifest_contract_mismatch");
  requireArtifact(
    core.formalKernelReplay.kernelBinary,
    "formal_replay_kernel_binary",
    kernel,
  );
  requireArtifact(
    core.formalKernelReplay.theoremReplayLedger,
    "formal_replay_theorem_ledger",
    kernel,
  );
  requireArtifact(
    core.formalKernelReplay.aggregateReplayTranscript,
    "formal_replay_aggregate_transcript",
    kernel,
  );
  if (core.kernelReplay.replayMode == null)
    kernel.missing.push("kernel_replay_mode_missing");
  requireText(core.kernelReplay.kernelId, "kernel_id", kernel);
  requireText(core.kernelReplay.kernelVersion, "kernel_version", kernel);
  requireArtifact(
    core.kernelReplay.kernelBinary,
    "trusted_kernel_binary",
    kernel,
  );
  requireArtifact(
    core.kernelReplay.theoremBundle,
    "kernel_theorem_bundle",
    kernel,
  );
  requireArtifact(core.kernelReplay.proofTerm, "kernel_proof_term", kernel);
  requireArtifact(
    core.kernelReplay.replayTranscript,
    "kernel_replay_transcript",
    kernel,
  );
  if (
    core.kernelReplay.expectedTheoremCount == null ||
    core.kernelReplay.expectedTheoremCount <= 0
  )
    kernel.missing.push("expected_theorem_count_missing_or_invalid");
  if (
    core.kernelReplay.replayedTheoremCount == null ||
    core.kernelReplay.replayedTheoremCount <= 0
  )
    kernel.missing.push("replayed_theorem_count_missing_or_invalid");
  if (
    core.kernelReplay.expectedTheoremCount != null &&
    core.kernelReplay.replayedTheoremCount != null &&
    core.kernelReplay.expectedTheoremCount !==
      core.kernelReplay.replayedTheoremCount
  )
    kernel.failures.push("kernel_theorem_replay_incomplete");
  if (core.kernelReplay.exitCode == null)
    kernel.missing.push("kernel_exit_code_missing");
  else if (core.kernelReplay.exitCode !== 0)
    kernel.failures.push("kernel_replay_failed");
  if (
    core.kernelReplay.kernelId != null &&
    core.identity.formalPlan.solver.solverId != null &&
    core.kernelReplay.kernelId !== core.identity.formalPlan.solver.solverId
  )
    kernel.failures.push("kernel_id_not_planned_solver");
  if (
    core.kernelReplay.kernelVersion != null &&
    core.identity.formalPlan.solver.solverVersion != null &&
    core.kernelReplay.kernelVersion !==
      core.identity.formalPlan.solver.solverVersion
  )
    kernel.failures.push("kernel_version_not_planned_solver_version");
  if (
    core.formalKernelReplay.kernelBinary.path != null &&
    core.formalKernelReplay.kernelBinary.sha256 != null &&
    (!sameArtifact(
      core.formalKernelReplay.kernelBinary,
      core.kernelReplay.kernelBinary,
    ) ||
      !sameArtifact(
        core.formalKernelReplay.kernelBinary,
        core.identity.formalPlan.solver,
      ))
  )
    kernel.failures.push("formal_replay_kernel_binary_not_exactly_planned");
  if (
    core.formalKernelReplay.aggregateReplayTranscript.path != null &&
    core.formalKernelReplay.aggregateReplayTranscript.sha256 != null &&
    !sameArtifact(
      core.formalKernelReplay.aggregateReplayTranscript,
      core.kernelReplay.replayTranscript,
    )
  )
    kernel.failures.push("formal_replay_aggregate_transcript_mismatch");

  const assumptions = get("no_unscoped_assumption_booleans");
  requireArtifact(
    core.assumptions.assumptionLedger,
    "assumption_ledger",
    assumptions,
  );
  requireArtifact(
    core.assumptions.booleanScanReport,
    "boolean_scan_report",
    assumptions,
  );
  requireArtifact(
    core.formalKernelReplay.usedAxiomLedger,
    "formal_replay_used_axiom_ledger",
    assumptions,
  );
  requireArtifact(
    core.formalKernelReplay.usedAssumptionLedger,
    "formal_replay_used_assumption_ledger",
    assumptions,
  );
  if (
    core.formalKernelReplay.usedAssumptionLedger.path != null &&
    core.formalKernelReplay.usedAssumptionLedger.sha256 != null &&
    !sameArtifact(
      core.formalKernelReplay.usedAssumptionLedger,
      core.assumptions.assumptionLedger,
    )
  )
    assumptions.failures.push("formal_replay_assumption_ledger_mismatch");
  const assumptionIds = core.assumptions.entries.map(
    (entry) => entry.assumptionId,
  );
  if (
    assumptionIds.some((entry) => entry == null) ||
    new Set(assumptionIds).size !== assumptionIds.length
  )
    assumptions.failures.push("assumption_ids_missing_or_duplicate");
  for (const entry of core.assumptions.entries) {
    if (entry.kind == null) assumptions.missing.push("assumption_kind_missing");
    if (entry.valueType == null)
      assumptions.missing.push("assumption_value_type_missing");
    requireText(entry.scopeRef, "assumption_scope_ref", assumptions);
    requireText(entry.typeStatement, "assumption_type_statement", assumptions);
    requireArtifact(entry.evidence, "assumption_evidence", assumptions);
  }
  if (core.assumptions.unscopedAssumptionCount == null)
    assumptions.missing.push("unscoped_assumption_count_missing");
  else if (core.assumptions.unscopedAssumptionCount !== 0)
    assumptions.failures.push("unscoped_assumptions_present");
  if (core.assumptions.unscopedBooleanCount == null)
    assumptions.missing.push("unscoped_boolean_count_missing");
  else if (core.assumptions.unscopedBooleanCount !== 0)
    assumptions.failures.push("unscoped_assumption_booleans_present");

  const locks = get("physical_transport_propulsion_claim_locks_proved");
  if (core.claimLockTheorem.theoremId == null)
    locks.missing.push("claim_lock_theorem_id_missing");
  if (core.claimLockTheorem.proposition == null)
    locks.missing.push("claim_lock_proposition_missing");
  requireArtifact(
    core.claimLockTheorem.proofTerm,
    "claim_lock_proof_term",
    locks,
  );
  requireArtifact(
    core.claimLockTheorem.replayTranscript,
    "claim_lock_replay",
    locks,
  );
  requireArtifact(
    core.formalKernelReplay.claimLockProof,
    "formal_replay_claim_lock_proof",
    locks,
  );
  requireArtifact(
    core.formalKernelReplay.claimLockTranscript,
    "formal_replay_claim_lock_transcript",
    locks,
  );
  if (core.claimLockTheorem.kernelResult == null)
    locks.missing.push("claim_lock_kernel_result_missing");
  if (core.claimLockTheorem.physicalViabilityStatus == null)
    locks.missing.push("physical_viability_blocked_status_missing");
  const falseLocks = [
    ["physical_viability", core.claimLockTheorem.physicalViabilityClaimAllowed],
    ["transport", core.claimLockTheorem.transportClaimAllowed],
    ["propulsion", core.claimLockTheorem.propulsionClaimAllowed],
    ["route_eta", core.claimLockTheorem.routeEtaClaimAllowed],
    ["certified_speed", core.claimLockTheorem.speedAuthorityClaimAllowed],
  ] as const;
  for (const [label, value] of falseLocks) {
    if (value == null) locks.missing.push(`${label}_false_lock_missing`);
  }
  if (core.claimLockTheorem.empiricalReceiptsRequired == null)
    locks.missing.push("empirical_receipts_required_theorem_missing");
  if (
    core.claimLockTheorem.proofTerm.sha256 != null &&
    core.kernelReplay.proofTerm.sha256 != null &&
    core.claimLockTheorem.proofTerm.sha256 !==
      core.kernelReplay.proofTerm.sha256
  )
    locks.failures.push("claim_lock_proof_not_kernel_replayed_proof");
  if (
    core.formalKernelReplay.claimLockProof.path != null &&
    core.formalKernelReplay.claimLockProof.sha256 != null &&
    !sameArtifact(
      core.formalKernelReplay.claimLockProof,
      core.claimLockTheorem.proofTerm,
    )
  )
    locks.failures.push("formal_replay_claim_lock_proof_mismatch");
  if (
    core.formalKernelReplay.claimLockTranscript.path != null &&
    core.formalKernelReplay.claimLockTranscript.sha256 != null &&
    !sameArtifact(
      core.formalKernelReplay.claimLockTranscript,
      core.claimLockTheorem.replayTranscript,
    )
  )
    locks.failures.push("formal_replay_claim_lock_transcript_mismatch");

  return [...checks.values()];
};

const result = (check: CheckDraft) => ({
  checkId: check.checkId,
  status: (check.failures.length > 0
    ? "fail"
    : check.missing.length > 0
      ? "blocked"
      : "pass") as Nhm2FormalManifestCertificateStatus,
  blockers: unique([...check.missing, ...check.failures]),
});

export const buildNhm2FormalManifestCertificate = (
  input: BuildNhm2FormalManifestCertificateInput = {},
): Nhm2FormalManifestCertificateV1 => {
  const core = normalize(input);
  const checks = deriveChecks(core).map(result);
  const blockers = checks.flatMap((check) =>
    check.blockers.map((blocker) => `${check.checkId}:${blocker}`),
  );
  const status: Nhm2FormalManifestCertificateStatus = checks.some(
    (check) => check.status === "fail",
  )
    ? "fail"
    : checks.some((check) => check.status === "blocked")
      ? "blocked"
      : "pass";
  return {
    contractVersion: NHM2_FORMAL_MANIFEST_CERTIFICATE_CONTRACT_VERSION,
    ...core,
    checks,
    status,
    formalManifestCertificateReady: status === "pass",
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      formalProofOnly: true,
      rawArtifactContainsPreallocatedIdsAndPreRunHashesOnly: true,
      persistedReceiptReferencesForbidden: true,
      postRunEnvelopeReferencesForbidden: true,
      physicalViability: false,
      transport: false,
      propulsion: false,
      routeEta: false,
      certifiedSpeed: false,
    },
  };
};

const isJson = (value: unknown): boolean => {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJson);
  return isRecord(value) && Object.values(value).every(isJson);
};
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
};

export const isNhm2FormalManifestCertificate = (
  value: unknown,
): value is Nhm2FormalManifestCertificateV1 => {
  if (!isRecord(value) || !isJson(value)) return false;
  if (
    value.contractVersion !== NHM2_FORMAL_MANIFEST_CERTIFICATE_CONTRACT_VERSION
  )
    return false;
  const rebuilt = buildNhm2FormalManifestCertificate({
    generatedAt: value.generatedAt,
    identity: value.identity,
    manifestMerkleCommitment: value.manifestMerkleCommitment,
    sourceHashRecomputation: value.sourceHashRecomputation,
    formalKernelReplay: value.formalKernelReplay,
    theoremScope: value.theoremScope,
    kernelReplay: value.kernelReplay,
    assumptions: value.assumptions,
    claimLockTheorem: value.claimLockTheorem,
  } as BuildNhm2FormalManifestCertificateInput);
  return (
    JSON.stringify(canonical(value)) === JSON.stringify(canonical(rebuilt))
  );
};
