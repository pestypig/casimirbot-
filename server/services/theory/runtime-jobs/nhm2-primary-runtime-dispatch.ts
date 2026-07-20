import path from "node:path";

import { nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest } from "../../../../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  buildTheoryRuntimeReceiptV1,
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryRuntimeRunRequestV1 } from "../../../../shared/contracts/theory-runtime-run-request.v1";
import { getTheoryRuntimeEntrypoint } from "../../../../shared/theory/runtime-entrypoints";
import { THEORY_RUNTIME_WORKSTATION_GRAPH_ID } from "../../../../shared/theory/runtime-execution-policy";
import {
  admitNhm2TheoryCandidatePlan,
  type Nhm2TheoryCandidatePlanAdmission,
} from "../nhm2-theory-candidate-plan-admission";
import {
  executeNhm2TheoryCandidatePrimary,
  type ExecuteNhm2TheoryCandidatePrimaryResult,
} from "../nhm2-theory-candidate-primary-executor";
import type { TheoryRuntimeSpawnExecutor } from "../runtime-adapters";
import {
  readTheoryRuntimeRunRequestStatus,
  updateTheoryRuntimeRunRequestStatus,
} from "../theory-runtime-run-request-manifest";
import {
  readTheoryRuntimeReceiptArtifact,
  writeTheoryRuntimeReceiptArtifact,
} from "../theory-runtime-receipt-store";

export const NHM2_PRIMARY_RUNTIME_ID =
  "nhm2.experiment_ready_theory.primary" as const;
export const NHM2_PRIMARY_OUTER_LAUNCH_HANDLER_ID =
  "server.theory_runtime.nhm2_primary_dispatch/v1" as const;

type PrimaryExecutor = typeof executeNhm2TheoryCandidatePrimary;
type PrimaryAdmission = typeof admitNhm2TheoryCandidatePlan;

export type Nhm2PrimaryRuntimeDispatchDependencies = {
  admitPlan?: PrimaryAdmission;
  executePrimary?: PrimaryExecutor;
};

function entrypoint() {
  const registered = getTheoryRuntimeEntrypoint(NHM2_PRIMARY_RUNTIME_ID);
  if (!registered) {
    throw new Error(
      `Dedicated runtime ${NHM2_PRIMARY_RUNTIME_ID} is not registered.`,
    );
  }
  return registered;
}

function exactStringArray(left: readonly string[], right: readonly string[]) {
  return JSON.stringify([...left]) === JSON.stringify([...right]);
}

const PRIMARY_MANDATORY_FALSE_SCALAR_KEYS = [
  "primaryComparisonProjectionReady",
  "experimentReadyTheoryClosureClaimAllowed",
  "physicalViabilityClaimAllowed",
  "transportClaimAllowed",
  "propulsionClaimAllowed",
  "routeEtaClaimAllowed",
  "speedAuthorityClaimAllowed",
] as const;

const PRIMARY_EXECUTOR_SCALAR_KEYS = [
  "expectedEvidenceCount",
  "primaryEvidenceRootCount",
  "supplementaryRunOwnedArtifactCount",
  "totalRunOwnedArtifactCount",
  "freshEvidenceCount",
  "predictionFreezeReady",
  "hermeticDependencyTreeAttested",
  "runtimeNodeModulesRequired",
  "hostSpecificDiagnosticRuntimeClosure",
  "operatingSystemHermeticityAsserted",
  "nodeRuntimeReproducibilityAsserted",
  "inheritedProcessEnvironment",
  "primaryNumericalEvidenceReady",
  "primaryNumericalEvidenceFalsified",
  "primaryComparisonProjectionAssessmentPublished",
  ...PRIMARY_MANDATORY_FALSE_SCALAR_KEYS,
] as const;

const PRIMARY_EXECUTOR_GATE_KEYS = [
  "runtime_execution",
  "runtime_execution_provenance",
  "runtime_artifact_freshness",
  "run_owned_nested_reference_closure",
  "primary_evidence_inventory",
  "primary_numerical_evidence",
  "primary_comparison_projection",
  "experiment_ready_theory_closure",
  "prediction_falsifier_freeze",
] as const;

const PRIMARY_DISPATCH_FAILURE_GATE_KEYS = [
  "runtime_execution",
  "runtime_execution_provenance",
  "primary_comparison_projection",
  "experiment_ready_theory_closure",
] as const;

function hasExactRecordKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return exactStringArray(Object.keys(value).sort(), [...expected].sort());
}

function assertQueuedRequestIdentity(input: {
  request: TheoryRuntimeRunRequestV1;
  admission: Nhm2TheoryCandidatePlanAdmission;
}): void {
  const registered = entrypoint();
  const request = input.request;
  if (
    request.requestId !== input.admission.plan.requestId ||
    request.runtimeId !== NHM2_PRIMARY_RUNTIME_ID ||
    request.graphId !== THEORY_RUNTIME_WORKSTATION_GRAPH_ID ||
    request.requestedScope !== "full" ||
    request.status !== "queued" ||
    !exactStringArray(request.badgeIds, registered.ownedBadgeIds) ||
    !exactStringArray(
      request.outputArtifactGlobs,
      registered.outputArtifactGlobs,
    ) ||
    Object.keys(request.args).length !== 1 ||
    request.args.candidateManifestPath !== input.admission.manifestPath
  ) {
    throw new Error(
      "Dedicated primary executor created a request outside the admitted server-owned launch identity.",
    );
  }
}

function expectedReceiptId(requestId: string): string {
  return nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
    NHM2_PRIMARY_RUNTIME_ID,
    requestId,
  );
}

function assertDedicatedReceiptIdentity(input: {
  request: TheoryRuntimeRunRequestV1;
  receipt: TheoryRuntimeReceiptV1;
}): void {
  const registered = entrypoint();
  const receipt = input.receipt;
  const adapter = receipt.args.adapter;
  const hasDedicatedOutputShape =
    (adapter === "nhm2_theory_candidate_primary_executor" &&
      hasExactRecordKeys(
        receipt.outputs.scalars,
        PRIMARY_EXECUTOR_SCALAR_KEYS,
      ) &&
      hasExactRecordKeys(receipt.outputs.gates, PRIMARY_EXECUTOR_GATE_KEYS)) ||
    (adapter === "nhm2_theory_candidate_primary_dispatch_failure" &&
      receipt.status === "failed" &&
      hasExactRecordKeys(
        receipt.outputs.scalars,
        PRIMARY_MANDATORY_FALSE_SCALAR_KEYS,
      ) &&
      hasExactRecordKeys(
        receipt.outputs.gates,
        PRIMARY_DISPATCH_FAILURE_GATE_KEYS,
      ));
  if (
    !isTheoryRuntimeReceiptV1(receipt) ||
    receipt.runtimeId !== NHM2_PRIMARY_RUNTIME_ID ||
    receipt.receiptId !== expectedReceiptId(input.request.requestId) ||
    receipt.graphId !== THEORY_RUNTIME_WORKSTATION_GRAPH_ID ||
    !exactStringArray(receipt.badgeIds, registered.ownedBadgeIds) ||
    receipt.claimBoundary.currentTier !== "diagnostic" ||
    receipt.claimBoundary.maximumTier !== "reduced_order" ||
    receipt.claimBoundary.promotionAllowed !== false ||
    receipt.args.requestId !== input.request.requestId ||
    receipt.args.outerLaunchHandler !== NHM2_PRIMARY_OUTER_LAUNCH_HANDLER_ID ||
    typeof receipt.args.innerProducerEntrypoint !== "string" ||
    !hasDedicatedOutputShape ||
    receipt.outputs.gates.primary_comparison_projection !== "not_ready" ||
    receipt.outputs.gates.experiment_ready_theory_closure !== "not_ready" ||
    PRIMARY_MANDATORY_FALSE_SCALAR_KEYS.some(
      (key) => receipt.outputs.scalars[key] !== false,
    )
  ) {
    throw new Error(
      "Dedicated primary executor returned a receipt outside the immutable server-owned launch identity.",
    );
  }
  if (
    !receipt.outputs.missingSignals.includes(
      "primary_comparison_projection_not_ready",
    ) ||
    !receipt.outputs.missingSignals.includes(
      "experiment_ready_theory_closure_not_ready",
    )
  ) {
    throw new Error(
      "Dedicated primary receipt omitted a mandatory fail-closed projection or closure blocker.",
    );
  }
}

export async function admitNhm2PrimaryRuntimeLaunch(
  input: {
    projectRoot?: string;
    candidateManifestPath: string;
  },
  dependencies: Nhm2PrimaryRuntimeDispatchDependencies = {},
): Promise<Nhm2TheoryCandidatePlanAdmission> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const admission = await (
    dependencies.admitPlan ?? admitNhm2TheoryCandidatePlan
  )({
    projectRoot,
    candidateManifestPath: input.candidateManifestPath,
    planRole: "primary_numerical",
    executionStartsAt: new Date().toISOString(),
    requireCleanSourceTree: true,
  });
  if (
    admission.plan.runtimeId !== NHM2_PRIMARY_RUNTIME_ID ||
    admission.manifestPath !== input.candidateManifestPath
  ) {
    throw new Error(
      "Primary launch admission did not preserve the requested manifest and dedicated runtime identity.",
    );
  }
  return admission;
}

export async function readNhm2PrimaryRuntimeReceipt(input: {
  projectRoot?: string;
  request: TheoryRuntimeRunRequestV1;
}): Promise<TheoryRuntimeReceiptV1 | null> {
  if (input.request.runtimeId !== NHM2_PRIMARY_RUNTIME_ID) {
    throw new Error(
      `Request ${input.request.requestId} is not a dedicated NHM2 primary request.`,
    );
  }
  const persisted = await readTheoryRuntimeReceiptArtifact({
    projectRoot: path.resolve(input.projectRoot ?? process.cwd()),
    runtimeId: NHM2_PRIMARY_RUNTIME_ID,
    requestId: input.request.requestId,
    receiptId: expectedReceiptId(input.request.requestId),
  });
  if (!persisted) return null;
  assertDedicatedReceiptIdentity({
    request: input.request,
    receipt: persisted.receipt,
  });
  return persisted.receipt;
}

async function persistOrVerifyDedicatedReceipt(input: {
  projectRoot: string;
  request: TheoryRuntimeRunRequestV1;
  receipt: TheoryRuntimeReceiptV1;
}): Promise<TheoryRuntimeReceiptV1> {
  assertDedicatedReceiptIdentity(input);
  let persisted = await readNhm2PrimaryRuntimeReceipt(input);
  if (!persisted) {
    try {
      await writeTheoryRuntimeReceiptArtifact({
        projectRoot: input.projectRoot,
        requestId: input.request.requestId,
        receipt: input.receipt,
      });
    } catch (error) {
      persisted = await readNhm2PrimaryRuntimeReceipt(input);
      if (!persisted) throw error;
    }
    persisted ??= await readNhm2PrimaryRuntimeReceipt(input);
  }
  if (!persisted) {
    throw new Error("Dedicated primary receipt was not durably persisted.");
  }
  if (JSON.stringify(persisted) !== JSON.stringify(input.receipt)) {
    throw new Error(
      "Dedicated primary immutable receipt differs from the executor result.",
    );
  }
  return persisted;
}

function requestStatusForReceipt(
  receipt: TheoryRuntimeReceiptV1,
): "completed" | "failed" | "timeout" {
  if (receipt.status === "timeout" || receipt.execution?.timedOut) {
    return "timeout";
  }
  return receipt.status === "completed" && receipt.execution?.exitCode === 0
    ? "completed"
    : "failed";
}

async function finalizeRequestFromReceipt(input: {
  projectRoot: string;
  request: TheoryRuntimeRunRequestV1;
  receipt: TheoryRuntimeReceiptV1;
}): Promise<void> {
  const status = requestStatusForReceipt(input.receipt);
  await updateTheoryRuntimeRunRequestStatus({
    projectRoot: input.projectRoot,
    requestId: input.request.requestId,
    status,
    updatedAt: input.receipt.provenance.completedAt ?? undefined,
    heartbeat: {
      stage: status,
      message:
        status === "completed"
          ? "Primary process completed with fresh fail-closed diagnostic evidence."
          : (input.receipt.outputs.warnings[0] ??
            "Dedicated primary launch failed."),
      progress: 1,
    },
  });
}

function buildDispatchFailureReceipt(input: {
  request: TheoryRuntimeRunRequestV1;
  error: unknown;
}): TheoryRuntimeReceiptV1 {
  const registered = entrypoint();
  const completedAt = new Date().toISOString();
  const message =
    input.error instanceof Error ? input.error.message : String(input.error);
  return buildTheoryRuntimeReceiptV1({
    generatedAt: completedAt,
    receiptId: expectedReceiptId(input.request.requestId),
    runtimeId: NHM2_PRIMARY_RUNTIME_ID,
    graphId: THEORY_RUNTIME_WORKSTATION_GRAPH_ID,
    badgeIds: [...registered.ownedBadgeIds],
    command: registered.command,
    args: {
      adapter: "nhm2_theory_candidate_primary_dispatch_failure",
      outerLaunchHandler: NHM2_PRIMARY_OUTER_LAUNCH_HANDLER_ID,
      innerProducerEntrypoint: registered.command,
      requestId: input.request.requestId,
      candidateManifestPath: input.request.args.candidateManifestPath,
      producerSpawnStatus: "not_proven",
    },
    status: "failed",
    outputs: {
      artifacts: [],
      scalars: {
        primaryComparisonProjectionReady: false,
        experimentReadyTheoryClosureClaimAllowed: false,
        physicalViabilityClaimAllowed: false,
        transportClaimAllowed: false,
        propulsionClaimAllowed: false,
        routeEtaClaimAllowed: false,
        speedAuthorityClaimAllowed: false,
      },
      units: {},
      gates: {
        runtime_execution: "fail",
        runtime_execution_provenance: "fail",
        primary_comparison_projection: "not_ready",
        experiment_ready_theory_closure: "not_ready",
      },
      missingSignals: [
        "runtime_execution_failed_before_immutable_primary_receipt",
        "runtime_environment_dependency_tree_unattested",
        "primary_comparison_projection_not_ready",
        "experiment_ready_theory_closure_not_ready",
      ],
      warnings: [
        message,
        "The outer launch handler terminalized this request without promoting physical, transport, propulsion, ETA, or speed claims.",
      ],
    },
    provenance: {
      gitSha: null,
      startedAt: input.request.createdAt,
      completedAt,
      durationMs: Math.max(
        0,
        Date.parse(completedAt) - Date.parse(input.request.createdAt),
      ),
    },
    claimBoundary: {
      currentTier: "diagnostic",
      maximumTier: "reduced_order",
      promotionAllowed: false,
      promotionBlockedBy: [
        ...registered.claimBoundary.promotionRequires,
        "runtime_execution_failed_before_immutable_primary_receipt",
        "runtime_environment_dependency_tree_unattested",
        "empirical_receipts_required_for_physical_promotion",
      ],
    },
  });
}

export async function terminalizeNhm2PrimaryRuntimeFailure(input: {
  projectRoot?: string;
  request: TheoryRuntimeRunRequestV1;
  error: unknown;
}): Promise<TheoryRuntimeReceiptV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  const existing = await readNhm2PrimaryRuntimeReceipt({
    projectRoot,
    request: input.request,
  });
  const receipt = existing ?? buildDispatchFailureReceipt(input);
  const persisted = existing
    ? existing
    : await persistOrVerifyDedicatedReceipt({
        projectRoot,
        request: input.request,
        receipt,
      });
  await finalizeRequestFromReceipt({
    projectRoot,
    request: input.request,
    receipt: persisted,
  });
  return persisted;
}

export async function executeNhm2PrimaryRuntimeLaunch(
  input: {
    projectRoot?: string;
    admission: Nhm2TheoryCandidatePlanAdmission;
    spawnExecutor?: TheoryRuntimeSpawnExecutor;
    onRequestCreated: (
      request: TheoryRuntimeRunRequestV1,
    ) => void | Promise<void>;
  },
  dependencies: Nhm2PrimaryRuntimeDispatchDependencies = {},
): Promise<TheoryRuntimeReceiptV1> {
  const projectRoot = path.resolve(input.projectRoot ?? process.cwd());
  let createdRequest: TheoryRuntimeRunRequestV1 | null = null;
  try {
    const result: ExecuteNhm2TheoryCandidatePrimaryResult = await (
      dependencies.executePrimary ?? executeNhm2TheoryCandidatePrimary
    )(
      {
        projectRoot,
        candidateManifestPath: input.admission.manifestPath,
        execute: true,
      },
      {
        spawnExecutor: input.spawnExecutor,
        launchOwnership: {
          handlerId: NHM2_PRIMARY_OUTER_LAUNCH_HANDLER_ID,
          onRequestCreated: async ({ request }) => {
            if (createdRequest) {
              throw new Error(
                "Dedicated primary executor published its request more than once.",
              );
            }
            assertQueuedRequestIdentity({
              request,
              admission: input.admission,
            });
            const immutableProjection = structuredClone(request);
            createdRequest = immutableProjection;
            await input.onRequestCreated(structuredClone(immutableProjection));
            assertQueuedRequestIdentity({
              request: immutableProjection,
              admission: input.admission,
            });
          },
        },
      },
    );
    const publishedRequest = createdRequest as TheoryRuntimeRunRequestV1 | null;
    if (!publishedRequest) {
      throw new Error(
        "Dedicated primary executor completed without publishing its owned request.",
      );
    }
    if (
      result.requestId !== publishedRequest.requestId ||
      result.runtimeId !== NHM2_PRIMARY_RUNTIME_ID
    ) {
      throw new Error(
        "Dedicated primary executor result does not match its published request.",
      );
    }
    const persisted = await persistOrVerifyDedicatedReceipt({
      projectRoot,
      request: publishedRequest,
      receipt: result.receiptV1,
    });
    await finalizeRequestFromReceipt({
      projectRoot,
      request: publishedRequest,
      receipt: persisted,
    });
    return persisted;
  } catch (error) {
    if (!createdRequest) {
      const executorOwnedRequest = await readTheoryRuntimeRunRequestStatus({
        projectRoot,
        requestId: input.admission.plan.requestId,
      });
      if (!executorOwnedRequest) throw error;
      assertQueuedRequestIdentity({
        request: executorOwnedRequest,
        admission: input.admission,
      });
      await terminalizeNhm2PrimaryRuntimeFailure({
        projectRoot,
        request: executorOwnedRequest,
        error,
      });
      throw error;
    }
    return terminalizeNhm2PrimaryRuntimeFailure({
      projectRoot,
      request: createdRequest,
      error,
    });
  }
}
