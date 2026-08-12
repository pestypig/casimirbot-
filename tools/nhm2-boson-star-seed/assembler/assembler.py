"""Fail-closed NHM2 trusted seed-container assembler.

This module has assembly authority only.  It does not import producer or
verifier code, execute scientific operators, or grant final artifact/physics
authority.  The external broker remains responsible for the OCI, mount,
seccomp, cgroup, quota, deadline, and post-exit evidence chain.
"""

from __future__ import annotations

import ctypes
import hashlib
import json
import math
import os
import re
import stat
import struct
import sys
from dataclasses import dataclass
from typing import Any, Iterable, Mapping, Sequence


class AssemblyError(RuntimeError):
    """A deterministic fail-closed assembly error."""


def _fail(code: str) -> None:
    raise AssemblyError(code)


MAX_SAFE_INTEGER = 9_007_199_254_740_991
MIB = 1024 * 1024
RUN_REQUEST_MAXIMUM_BYTES = 1 * MIB
REPLAY_BUNDLE_MAXIMUM_BYTES = 16 * MIB
ENFORCEMENT_RECEIPT_MAXIMUM_BYTES = 1 * MIB
DESCRIPTOR_MAXIMUM_BYTES = 16 * MIB
ARRAY_TOTAL_BYTES = 6_482_304
ARRAY_TOTAL_ELEMENTS = 810_288
ARRAY_HASH_DOMAIN = (
    "nhm2.prolate_boson_star.newtonian_2p_seed.array.sha256.v1\n"
)
# Frozen run-plan state: runtimeTypedInterpreterBinding is null and
# executableValidationAuthorityPresent is false.  This is intentionally not a
# flag, environment variable, CLI switch, or injectable callback.  Enabling
# descriptor production requires a new hash-bound contract/source revision.
EXECUTABLE_CLOSED_SCHEMA_AUTHORITY_BINDING = None
REPLAY_INSTANCE_DOMAIN = (
    "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle/v1\n"
)
RUN_REQUEST_DOMAIN = (
    "nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n"
)

RUN_PLAN_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed_run_plan",
    "contractVersion": "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
    "sha256": "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
    "canonicalSizeBytes": 261169,
}
SEED_CONTRACT_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed",
    "contractVersion": "nhm2_prolate_boson_star_newtonian_seed/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed/v1\n",
    "sha256": "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
    "canonicalSizeBytes": 50226,
}
CANDIDATE_PLAN_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_coherent_candidate_plan",
    "contractVersion": "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
    "candidateId": "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
    "sha256Domain": "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
    "sha256": "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
    "canonicalSizeBytes": 134951,
}
BRANCH_BVP_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_branch_bvp",
    "contractVersion": "nhm2_prolate_boson_star_branch_bvp/v1",
    "sha256Domain": "nhm2-prolate-boson-star-branch-bvp/v1\n",
    "sha256": "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
    "canonicalSizeBytes": 17355,
}
OUTPUT_DESCRIPTOR_SCHEMA_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed.output_descriptor_schema",
    "schemaVersion": "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor_schema/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-output-descriptor-schema/v1\n",
    "sha256": "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58",
    "canonicalSizeBytes": 56194,
}
PROOF_REPLAY_PROTOCOL_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol",
    "protocolVersion": "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-proof-replay-protocol/v1\n",
    "sha256": "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b",
    "canonicalSizeBytes": 46365,
}
REPLAY_BUNDLE_SCHEMA_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle_schema",
    "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle_schema/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle-schema/v1\n",
    "sha256": "e9e2742d6e3fa1c2549a7bbeee0e917bba311920732078040de10e3d6995fa78",
    "canonicalSizeBytes": 5492,
}
CONTROL_PLANE_REGISTRY_BINDING = {
    "artifactId": "nhm2.prolate_boson_star_newtonian_seed.control_plane_evidence_grammar_registry",
    "registryVersion": "nhm2.prolate_boson_star.newtonian_seed.control_plane_evidence_grammar_registry/v1",
    "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-control-plane-evidence-grammar-registry/v1\n",
    "sha256": "b048a86ef1932cc06bd2d1c829011aa1df8341621ded24e4be13c8fdc4c54c9e",
    "canonicalSizeBytes": 120618,
}

LEVELS = (
    ("L0", 64, 32, "production_base_solve"),
    ("L1", 96, 48, "production_refinement"),
    ("L2", 128, 64, "production_refinement_and_seed_payload"),
    (
        "AUDIT",
        256,
        128,
        "independent_recomputation_only_no_solve_no_retune",
    ),
)
ROLE_NAMES = (
    "newtonian_seed.grid.rho_nodes",
    "newtonian_seed.grid.theta_nodes",
    "newtonian_seed.base.scalar_u0",
    "newtonian_seed.base.potential_V0",
    "newtonian_seed.target.scalar_u_A",
    "newtonian_seed.target.potential_V_A",
    "newtonian_seed.multipole.scalar_odd",
    "newtonian_seed.multipole.potential_even",
)
ROLE_STEMS = (
    "rho_nodes",
    "theta_nodes",
    "base_scalar_u0",
    "base_potential_V0",
    "target_scalar_u_A",
    "target_potential_V_A",
    "multipole_scalar_odd",
    "multipole_potential_even",
)
AMPLITUDES = tuple(
    {"stage": stage, "exact": f"2^-{16 - stage}", "value": 2.0 ** -(16 - stage)}
    for stage in range(7)
)
GRID_DEFINITIONS = tuple(
    {
        "id": level_id,
        "radialNodeCount": radial,
        "angularNodeCount": angular,
        "duty": duty,
    }
    for level_id, radial, angular, duty in LEVELS
)


def _shape(role_index: int, radial: int, angular: int) -> list[int]:
    if role_index == 0:
        return [radial]
    if role_index == 1:
        return [angular]
    if role_index in (4, 5):
        return [7, radial, angular]
    if role_index in (6, 7):
        return [radial, (angular + 1) // 2]
    return [radial, angular]


def _frozen_inventory() -> tuple[dict[str, Any], ...]:
    result: list[dict[str, Any]] = []
    for level_index, (level_id, radial, angular, _duty) in enumerate(LEVELS):
        for role_index, role in enumerate(ROLE_NAMES):
            shape = _shape(role_index, radial, angular)
            element_count = math.prod(shape)
            result.append(
                {
                    "inventoryIndex": level_index * len(ROLE_NAMES) + role_index,
                    "levelIndex": level_index,
                    "roleIndex": role_index,
                    "levelId": level_id,
                    "role": role,
                    "relativePath": (
                        f"arrays/{level_id}/{role_index:02d}-{ROLE_STEMS[role_index]}.f64le"
                    ),
                    "dtype": "float64_le",
                    "order": "C_row_major",
                    "shape": shape,
                    "elementCount": element_count,
                    "byteLength": element_count * 8,
                }
            )
    return tuple(result)


FROZEN_ARRAY_INVENTORY = _frozen_inventory()
if (
    len(FROZEN_ARRAY_INVENTORY) != 32
    or sum(item["elementCount"] for item in FROZEN_ARRAY_INVENTORY)
    != ARRAY_TOTAL_ELEMENTS
    or sum(item["byteLength"] for item in FROZEN_ARRAY_INVENTORY)
    != ARRAY_TOTAL_BYTES
):
    raise RuntimeError("frozen_array_inventory_internal_drift")

EXPLICIT_DIRECTORIES = (
    "arrays",
    "arrays/L0",
    "arrays/L1",
    "arrays/L2",
    "arrays/AUDIT",
)
ARRAY_PATHS = tuple(item["relativePath"] for item in FROZEN_ARRAY_INVENTORY)
DESCRIPTOR_PATH = "seed-descriptor.canonical.json"
BASE_INPUT_PATHS = (
    "00-seed-run-request.v1.json",
    "01-candidate-plan-v2.canonical.json",
    "02-branch-bvp-v1.canonical.json",
    "03-newtonian-seed-v1.canonical.json",
    "04-proof-replay-protocol.v1.canonical.json",
    "05-output-descriptor-schema.v1.canonical.json",
    "06-verifier-replay-bundle-schema.v1.canonical.json",
    "07-control-plane-evidence-grammar-registry.v1.canonical.json",
)
BASE_HASH_BOUND_INPUTS = {
    BASE_INPUT_PATHS[1]: CANDIDATE_PLAN_BINDING,
    BASE_INPUT_PATHS[2]: BRANCH_BVP_BINDING,
    BASE_INPUT_PATHS[3]: SEED_CONTRACT_BINDING,
    BASE_INPUT_PATHS[4]: PROOF_REPLAY_PROTOCOL_BINDING,
    BASE_INPUT_PATHS[5]: OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    BASE_INPUT_PATHS[6]: REPLAY_BUNDLE_SCHEMA_BINDING,
    BASE_INPUT_PATHS[7]: CONTROL_PLANE_REGISTRY_BINDING,
}

_CONTROL_BINDING_KEYS = frozenset(
    {"bindingVersion", "artifactKind", "sha256Domain", "sha256", "canonicalSizeBytes"}
)
_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_OCI_SHA256_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def _profile(artifact_kind: str, domain: str) -> tuple[str, str]:
    return artifact_kind, domain


CONTROL_BINDING_PROFILES = {
    "seedRunRequest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.run_request",
        RUN_REQUEST_DOMAIN,
    ),
    "isolatedWorkerCapability": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.isolated_worker_capability",
        "nhm2-prolate-boson-star-newtonian-seed-isolated-worker-capability/v1\n",
    ),
    "schedulerLease": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.scheduler_lease",
        "nhm2-prolate-boson-star-newtonian-seed-scheduler-lease/v1\n",
    ),
    "producerSourceClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-manifest/v1\n",
    ),
    "producerSourceClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-ledger/v1\n",
    ),
    "producerToolchainClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-manifest/v1\n",
    ),
    "producerToolchainClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-ledger/v1\n",
    ),
    "producerSeccompPolicy": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_seccomp_policy",
        "nhm2-prolate-boson-star-newtonian-seed-producer-seccomp-policy/v1\n",
    ),
    "producerQuotaCapability": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.producer_quota_capability",
        "nhm2-prolate-boson-star-newtonian-seed-producer-quota-capability/v1\n",
    ),
    "verifierSourceClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-manifest/v1\n",
    ),
    "verifierSourceClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-ledger/v1\n",
    ),
    "verifierToolchainClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-manifest/v1\n",
    ),
    "verifierToolchainClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-ledger/v1\n",
    ),
    "verifierSeccompPolicy": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_seccomp_policy",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-seccomp-policy/v1\n",
    ),
    "verifierQuotaCapability": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_quota_capability",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-quota-capability/v1\n",
    ),
    "assemblerSourceClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-manifest/v1\n",
    ),
    "assemblerSourceClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-ledger/v1\n",
    ),
    "assemblerToolchainClosureManifest": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_manifest",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-manifest/v1\n",
    ),
    "assemblerToolchainClosureLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-ledger/v1\n",
    ),
    "assemblerSeccompPolicy": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_seccomp_policy",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-seccomp-policy/v1\n",
    ),
    "assemblerQuotaCapability": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.assembler_quota_capability",
        "nhm2-prolate-boson-star-newtonian-seed-assembler-quota-capability/v1\n",
    ),
    "crossStageSeparationReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.cross_stage_separation_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-cross-stage-separation-receipt/v1\n",
    ),
    "verifierProofKernel": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_proof_kernel",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-proof-kernel/v1\n",
    ),
    "verifierMpfrGmpRuntime": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_mpfr_gmp_runtime",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-mpfr-gmp-runtime/v1\n",
    ),
    "stageInputLedgerConstructionPolicy": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.stage_input_ledger_construction_policy",
        "nhm2-prolate-boson-star-newtonian-seed-stage-input-ledger-construction-policy/v1\n",
    ),
    "exactOutputInventory": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.exact_output_inventory",
        "nhm2-prolate-boson-star-newtonian-seed-exact-output-inventory/v1\n",
    ),
    "verifierInputLedger": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_input_ledger",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-input-ledger/v1\n",
    ),
    "verifierLaunchEnvelope": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_launch_envelope",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-launch-envelope/v1\n",
    ),
    "verifierSeccompLoadReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_seccomp_load_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-seccomp-load-receipt/v1\n",
    ),
    "verifierQuotaSetupReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_quota_setup_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-quota-setup-receipt/v1\n",
    ),
    "absoluteDeadlineReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.absolute_deadline_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-absolute-deadline-receipt/v1\n",
    ),
    "verifierClosedOutputObservation": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_closed_output_observation",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-closed-output-observation/v1\n",
    ),
    "observationCaptureReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.observation_capture_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-observation-capture-receipt/v1\n",
    ),
    "verifierEnforcementReceipt": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_enforcement_receipt",
        "nhm2-prolate-boson-star-newtonian-seed-verifier-enforcement-receipt/v1\n",
    ),
    "verifierReplayBundleInstance": _profile(
        "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle",
        REPLAY_INSTANCE_DOMAIN,
    ),
}

RUN_REQUEST_KEYS = frozenset(
    {
        "schemaVersion",
        "runPlanBinding",
        "candidatePlanV2Binding",
        "branchBvpV1Binding",
        "seedContractBinding",
        "outputDescriptorSchemaBinding",
        "proofReplayProtocolBinding",
        "verifierReplayBundleSchemaBinding",
        "controlPlaneEvidenceGrammarRegistryBinding",
        "isolatedWorkerCapabilityBinding",
        "schedulerLeaseBinding",
        "producerSourceManifestBinding",
        "producerSourceLedgerBinding",
        "producerToolchainManifestBinding",
        "producerToolchainLedgerBinding",
        "producerSeccompPolicyBinding",
        "producerQuotaCapabilityBinding",
        "producerOciImageDigest",
        "verifierSourceManifestBinding",
        "verifierSourceLedgerBinding",
        "verifierToolchainManifestBinding",
        "verifierToolchainLedgerBinding",
        "verifierSeccompPolicyBinding",
        "verifierQuotaCapabilityBinding",
        "verifierOciImageDigest",
        "assemblerSourceManifestBinding",
        "assemblerSourceLedgerBinding",
        "assemblerToolchainManifestBinding",
        "assemblerToolchainLedgerBinding",
        "assemblerSeccompPolicyBinding",
        "assemblerQuotaCapabilityBinding",
        "assemblerOciImageDigest",
        "crossStageSeparationReceiptBinding",
        "verifierProofKernelBinding",
        "verifierMpfrGmpRuntimeBinding",
        "stageInputLedgerConstructionPolicyBinding",
        "exactOutputInventoryBinding",
    }
)

RUN_REQUEST_PROFILE_FIELDS = {
    "isolatedWorkerCapabilityBinding": "isolatedWorkerCapability",
    "schedulerLeaseBinding": "schedulerLease",
    "producerSourceManifestBinding": "producerSourceClosureManifest",
    "producerSourceLedgerBinding": "producerSourceClosureLedger",
    "producerToolchainManifestBinding": "producerToolchainClosureManifest",
    "producerToolchainLedgerBinding": "producerToolchainClosureLedger",
    "producerSeccompPolicyBinding": "producerSeccompPolicy",
    "producerQuotaCapabilityBinding": "producerQuotaCapability",
    "verifierSourceManifestBinding": "verifierSourceClosureManifest",
    "verifierSourceLedgerBinding": "verifierSourceClosureLedger",
    "verifierToolchainManifestBinding": "verifierToolchainClosureManifest",
    "verifierToolchainLedgerBinding": "verifierToolchainClosureLedger",
    "verifierSeccompPolicyBinding": "verifierSeccompPolicy",
    "verifierQuotaCapabilityBinding": "verifierQuotaCapability",
    "assemblerSourceManifestBinding": "assemblerSourceClosureManifest",
    "assemblerSourceLedgerBinding": "assemblerSourceClosureLedger",
    "assemblerToolchainManifestBinding": "assemblerToolchainClosureManifest",
    "assemblerToolchainLedgerBinding": "assemblerToolchainClosureLedger",
    "assemblerSeccompPolicyBinding": "assemblerSeccompPolicy",
    "assemblerQuotaCapabilityBinding": "assemblerQuotaCapability",
    "crossStageSeparationReceiptBinding": "crossStageSeparationReceipt",
    "verifierProofKernelBinding": "verifierProofKernel",
    "verifierMpfrGmpRuntimeBinding": "verifierMpfrGmpRuntime",
    "stageInputLedgerConstructionPolicyBinding": "stageInputLedgerConstructionPolicy",
    "exactOutputInventoryBinding": "exactOutputInventory",
}

REPLAY_KEYS = frozenset(
    {
        "schemaVersion",
        "runPlanBinding",
        "runRequestBinding",
        "seedContractBinding",
        "candidatePlanV2Binding",
        "branchBvpV1Binding",
        "outputDescriptorSchemaBinding",
        "proofReplayProtocolBinding",
        "absoluteDeadlineBinding",
        "verifierSourceLedgerBinding",
        "verifierToolchainLedgerBinding",
        "verifierInputLedgerBinding",
        "verifierOciImageDigest",
        "observedArrayInventory",
        "serverRecomputedGateReport",
        "serverRecomputedScalarMetadata",
        "continuousNodelessProofReceipt",
        "continuousPeakProofReceipt",
        "numericalOriginSeriesDefectReceipt",
    }
)

ENFORCEMENT_RECEIPT_KEYS = frozenset(
    {
        "schemaVersion",
        "stageId",
        "runPlanBinding",
        "runRequestBinding",
        "launchEnvelopeBinding",
        "sourceManifestBinding",
        "sourceLedgerBinding",
        "toolchainManifestBinding",
        "toolchainLedgerBinding",
        "inputLedgerBinding",
        "ociImageDigest",
        "capabilityBinding",
        "sandboxAndSeccompPolicyBinding",
        "seccompLoadReceiptBinding",
        "schedulerLeaseBinding",
        "quotaCapabilityBinding",
        "quotaSetupReceiptBinding",
        "absoluteDeadlineBinding",
        "clockId",
        "monotonicStartNanoseconds",
        "secureInputRereadStartMonotonicNanoseconds",
        "secureInputRereadEndMonotonicNanoseconds",
        "stageWorkStartMonotonicNanoseconds",
        "stageWorkEndMonotonicNanoseconds",
        "outputCloseAndFsyncStartMonotonicNanoseconds",
        "outputCloseAndFsyncEndMonotonicNanoseconds",
        "monotonicEndNanoseconds",
        "postExitReceiptAssemblyStartMonotonicNanoseconds",
        "memoryPeakBytes",
        "memoryMaxBytes",
        "memoryOomEvents",
        "memoryOomKillEvents",
        "pidsPeak",
        "pidsMaxEvents",
        "seccompViolationCount",
        "toolchainParentExactFirstLevelInventoryObserved",
        "stdoutBytes",
        "stderrBytes",
        "mountIdentityStableThroughStage",
        "projectInheritanceStableThroughStage",
        "descendantOutputFileCount",
        "allDescendantOutputsCarrySetupDeviceAndProjectId",
        "writableMountPeakBytes",
        "writableMountPeakInodes",
        "writableMountQuotaExceeded",
        "rlimitFsizeBytes",
        "rlimitFsizeExceeded",
        "exitCode",
        "timedOut",
        "killed",
        "cgroupPopulatedZero",
        "closedStageOutputObservationBinding",
        "observationCaptureReceiptBinding",
    }
)

ARRAY_ENTRY_KEYS = frozenset(
    {
        "inventoryIndex",
        "levelIndex",
        "roleIndex",
        "levelId",
        "role",
        "relativePath",
        "dtype",
        "order",
        "shape",
        "elementCount",
        "byteLength",
        "sha256",
    }
)

SCALAR_METADATA_KEYS = frozenset(
    {
        "A0",
        "nu0",
        "a1",
        "Vc",
        "xPeak0",
        "rhoPeak0",
        "kappa0",
        "C0",
        "aInfinityOverCosThetaInterval",
        "xTail",
        "rhoTail",
        "perTarget",
        "perSolveInterior",
        "authoritativeGlobalObservables",
    }
)
TARGET_METADATA_KEYS = frozenset(
    {"stage", "amplitudeExact", "amplitude", "lambda", "nu", "wSeed", "rhoPeak"}
)
INTERIOR_SOLVE_METADATA_KEYS = frozenset({"levelId", "A32", "N32", "T32", "W32"})
GLOBAL_OBSERVABLE_KEYS = frozenset(
    {
        "subject",
        "NInterval",
        "N",
        "TInterval",
        "T",
        "WInterval",
        "W",
        "P_VInterval",
        "P_V",
        "NFluxInterval",
        "N_flux",
    }
)
GATE_REPORT_KEYS = frozenset(
    {
        "schemaVersion",
        "interiorLevelGates",
        "auditGate",
        "authoritativeGlobalIdentityGate",
        "targetGates",
        "D01",
        "D12",
        "differenceRatio",
        "L1ToL2FieldRelativeLInf",
        "L1ToL2InteriorObservableRelativeDifference",
        "auditDiscreteNodelessPassed",
        "auditNegativePotentialPassed",
        "continuousNodelessProofPassed",
        "continuousPeakProofPassed",
        "numericalOriginSeriesDefectPassed",
        "allPassed",
    }
)
INTERIOR_GATE_KEYS = frozenset(
    {
        "levelId",
        "scope",
        "schrodingerNormalizedLInf",
        "poissonNormalizedLInf",
        "boundaryAndParityLInf",
        "radialTailRelative",
        "angularTailRelative",
        "passed",
    }
)
AUDIT_GATE_KEYS = frozenset(
    {"scope", "schrodingerNormalizedLInf", "poissonNormalizedLInf", "boundaryAndParityLInf", "passed"}
)
GLOBAL_GATE_KEYS = frozenset(
    {
        "subject",
        "virialRelativeDefect",
        "eigenvalueRelativeDefect",
        "poissonEnergyRelativeDefect",
        "gaussFluxRelativeDefect",
        "passed",
    }
)
TARGET_GATE_KEYS = frozenset(
    {
        "stage",
        "scope",
        "amplitudeAbsoluteError",
        "scalarScalingRelativeLInf",
        "potentialScalingRelativeLInf",
        "targetBoundStatePassed",
        "passed",
    }
)

NODELESS_RECEIPT_KEYS = frozenset(
    {
        "schemaVersion", "proofKernelBinding", "protocolBinding",
        "sourceL2ScalarSha256", "sourceL2PotentialSha256", "xTail", "rhoTail",
        "acceptedCompactBoxCount", "coverRecordCount", "maximumDepthUsed",
        "coverTraceSha256", "minimumCompactLowerBound", "scaledExteriorVariable",
        "totalNInterval", "totalNRepresentative", "CInterval", "CRepresentative",
        "pRepresentative", "coulombConsistencyRelativeDefect", "coulombSelectorTraceSha256",
        "coulombSearchIntervalCount", "coulombSearchMaximumDepth", "interiorNInterval",
        "tailMassInterval", "scalarBoundaryLiftSha256", "scalarBoundaryLiftRecordCount",
        "potentialBoundaryLiftSha256", "potentialBoundaryLiftRecordCount",
        "leadingScalarCorrectionCoefficientIntervals", "aInfinityOverCosThetaGlobalInterval",
        "tailScalarRepresentativeCoefficients", "tailPotentialRepresentativeCoefficients",
        "tailScalarContinuationCoefficientIntervals", "tailPotentialContinuationCoefficientIntervals",
        "tailCoefficientInventorySha256", "representativeContinuumSha256",
        "scalarWeightedRemainderRatioUpper", "potentialWeightedRemainderAbsoluteUpper",
        "tailRadiiY", "tailRadiiZ", "tailRadius", "tailContractionUpper",
        "joinValueDefectUpper", "joinDerivativeDefectUpper",
        "tailSchrodingerNormalizedLInf", "tailPoissonNormalizedLInf",
        "interiorJoinSchrodingerNormalizedLimit", "exteriorJoinSchrodingerNormalizedLimit",
        "interiorJoinPoissonNormalizedLimit", "exteriorJoinPoissonNormalizedLimit",
        "auditBaseScalarEntryCount", "prescribedBoundaryPositiveZeroNodeCount",
        "eligibleNonBoundaryNodeCount", "strictPositiveEligibleNodeCount",
        "certifiedTailUnderflowPositiveZeroEligibleNodeCount", "negativeOrNegativeZeroNodeCount",
        "exteriorRoundingTraceSha256", "exteriorRoundingRecordCount", "passed",
    }
)
ORIGIN_RECEIPT_KEYS = frozenset(
    {
        "schemaVersion", "proofKernelBinding", "protocolBinding",
        "sourceL2ScalarSha256", "sourceL2PotentialSha256", "a1Interval", "VcInterval",
        "a3Interval", "b2Interval", "b4Interval", "scalarX1Ell1AxisRepresentativeDefect",
        "scalarX1NonEll1Defect", "scalarX2AllMultipoleDefect", "scalarX3P1IdentityDefect",
        "scalarX3NonEll1Ell3Defect", "scalarX4AllMultipoleDefect",
        "potentialX0NonEll0Defect", "potentialX1AllMultipoleDefect",
        "potentialX2Ell0AndEllGe4Defect", "potentialX3AllMultipoleDefect",
        "potentialX4P0IdentityDefect", "potentialX4P2IdentityDefect",
        "potentialX4NonEll0Ell2Ell4Defect", "derivativeMultipoleTraceSha256",
        "extractionRecordCount", "passed",
    }
)
PEAK_RECEIPT_KEYS = frozenset(
    {
        "schemaVersion", "proofKernelBinding", "protocolBinding",
        "sourceL2ScalarSha256", "sourceL2PotentialSha256",
        "sourceTailCoefficientInventorySha256", "sourceRepresentativeContinuumSha256",
        "stationaryCandidateCount", "stationaryRecordCount", "originValueCoverRecordCount",
        "physicalDerivativeRecordCount", "c1JoinValueCoverRecordCount", "uniquePeakBoxIndex",
        "acceptedBoxCount", "maximumDepthUsed", "stationaryTraceSha256", "rhoPeakInterval",
        "thetaPeakInterval", "xPeakInterval", "A0Interval", "largestHessianEigenvalueUpper",
        "radialHessianEigenvalueUpper", "regularTransverseHessianEigenvalueUpper",
        "hessianDeterminantLower", "globalDominanceMarginLower",
        "interiorCandidateValueLower", "exteriorTailSupremumUpper",
        "scaledExteriorRadialDecreaseLower", "exteriorStationaryMaximizerCount", "passed",
    }
)


def _exact_keys(value: Any, expected: frozenset[str], code: str) -> Mapping[str, Any]:
    if not isinstance(value, dict) or frozenset(value.keys()) != expected:
        _fail(code)
    return value


def _reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            _fail("canonical_json_duplicate_key")
        result[key] = value
    return result


def _parse_json_int(raw: str) -> int:
    if raw == "-0":
        _fail("canonical_json_negative_zero")
    value = int(raw)
    if abs(value) > MAX_SAFE_INTEGER:
        _fail("canonical_json_integer_not_exact_binary64")
    return value


def _parse_json_float(raw: str) -> float:
    value = float(raw)
    if not math.isfinite(value):
        _fail("canonical_json_nonfinite_number")
    if value == 0.0 and raw.startswith("-"):
        _fail("canonical_json_negative_zero")
    return value


def _reject_json_constant(_raw: str) -> None:
    _fail("canonical_json_nonfinite_number")


def _validate_unicode(value: str) -> None:
    for char in value:
        codepoint = ord(char)
        if codepoint == 0 or 0xD800 <= codepoint <= 0xDFFF:
            _fail("canonical_json_invalid_unicode")


def _encode_ecmascript_number(value: int | float) -> str:
    if isinstance(value, bool):
        _fail("canonical_json_boolean_used_as_number")
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            _fail("canonical_json_integer_not_exact_binary64")
        return str(value)
    if not math.isfinite(value):
        _fail("canonical_json_nonfinite_number")
    if value == 0.0:
        if math.copysign(1.0, value) < 0:
            _fail("canonical_json_negative_zero")
        return "0"
    sign_prefix = "-" if value < 0 else ""
    absolute = abs(value)
    rendered = repr(absolute).lower()
    if "e" in rendered:
        coefficient, exponent_raw = rendered.split("e", 1)
        exponent = int(exponent_raw)
    else:
        coefficient, exponent = rendered, 0
    if "." in coefficient:
        whole, fraction = coefficient.split(".", 1)
        digits = whole + fraction
        decimal_position = len(whole) + exponent
    else:
        digits = coefficient
        decimal_position = len(coefficient) + exponent
    leading = len(digits) - len(digits.lstrip("0"))
    digits = digits.lstrip("0")
    decimal_position -= leading
    digits = digits.rstrip("0") or "0"
    if 1e-6 <= absolute < 1e21:
        if decimal_position <= 0:
            body = "0." + ("0" * -decimal_position) + digits
        elif decimal_position >= len(digits):
            body = digits + ("0" * (decimal_position - len(digits)))
        else:
            body = digits[:decimal_position] + "." + digits[decimal_position:]
        return sign_prefix + body
    scientific_exponent = decimal_position - 1
    mantissa = digits[0] + (("." + digits[1:]) if len(digits) > 1 else "")
    exponent_text = (
        f"+{scientific_exponent}" if scientific_exponent >= 0 else str(scientific_exponent)
    )
    return f"{sign_prefix}{mantissa}e{exponent_text}"


def _utf16_sort_key(value: str) -> bytes:
    _validate_unicode(value)
    return value.encode("utf-16-be")


def canonical_json_text(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return _encode_ecmascript_number(value)
    if isinstance(value, str):
        _validate_unicode(value)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, (list, tuple)):
        return "[" + ",".join(canonical_json_text(item) for item in value) + "]"
    if isinstance(value, dict):
        for key in value:
            if not isinstance(key, str):
                _fail("canonical_json_non_string_object_key")
        parts = []
        for key in sorted(value.keys(), key=_utf16_sort_key):
            parts.append(canonical_json_text(key) + ":" + canonical_json_text(value[key]))
        return "{" + ",".join(parts) + "}"
    _fail("canonical_json_unsupported_value")
    raise AssertionError("unreachable")


def canonical_json_bytes(value: Any) -> bytes:
    try:
        return canonical_json_text(value).encode("utf-8", "strict")
    except UnicodeError as exc:
        raise AssemblyError("canonical_json_invalid_utf8") from exc


def parse_exact_canonical_json(raw: bytes, maximum_bytes: int, label: str) -> Any:
    if not raw or len(raw) > maximum_bytes or raw.startswith(b"\xef\xbb\xbf"):
        _fail(f"{label}_raw_size_or_bom_invalid")
    try:
        text = raw.decode("utf-8", "strict")
        value = json.loads(
            text,
            object_pairs_hook=_reject_duplicate_pairs,
            parse_int=_parse_json_int,
            parse_float=_parse_json_float,
            parse_constant=_reject_json_constant,
        )
    except AssemblyError:
        raise
    except (UnicodeError, json.JSONDecodeError, ValueError, OverflowError) as exc:
        raise AssemblyError(f"{label}_json_parse_invalid") from exc
    if canonical_json_bytes(value) != raw:
        _fail(f"{label}_raw_bytes_not_exact_canonical_utf8")
    _bounded_plain_tree(value, label)
    return value


def _bounded_plain_tree(value: Any, label: str) -> None:
    stack: list[tuple[Any, int]] = [(value, 0)]
    nodes = 0
    total_string_bytes = 0
    while stack:
        current, depth = stack.pop()
        nodes += 1
        if nodes > 50_000 or depth > 24:
            _fail(f"{label}_tree_budget_exceeded")
        if isinstance(current, str):
            _validate_unicode(current)
            length = len(current.encode("utf-8"))
            if length > 16_384:
                _fail(f"{label}_string_budget_exceeded")
            total_string_bytes += length
            if total_string_bytes > 2 * MIB:
                _fail(f"{label}_total_string_budget_exceeded")
        elif isinstance(current, list):
            if len(current) > 4096:
                _fail(f"{label}_array_budget_exceeded")
            stack.extend((child, depth + 1) for child in current)
        elif isinstance(current, dict):
            if len(current) > 128:
                _fail(f"{label}_object_budget_exceeded")
            for key, child in current.items():
                if not isinstance(key, str) or len(key.encode("utf-8")) > 256:
                    _fail(f"{label}_property_name_invalid")
                stack.append((child, depth + 1))
        elif current is not None and not isinstance(current, (bool, int, float)):
            _fail(f"{label}_non_plain_value")


def domain_binding(raw: bytes, profile_name: str) -> dict[str, Any]:
    artifact_kind, domain = CONTROL_BINDING_PROFILES[profile_name]
    return {
        "bindingVersion": "nhm2.control_plane.domain_hash_binding/v1",
        "artifactKind": artifact_kind,
        "sha256Domain": domain,
        "sha256": hashlib.sha256(domain.encode("utf-8") + raw).hexdigest(),
        "canonicalSizeBytes": len(raw),
    }


def validate_hash_bound_canonical_input(
    raw: bytes,
    binding: Mapping[str, Any],
    label: str,
) -> Any:
    value = parse_exact_canonical_json(raw, RUN_REQUEST_MAXIMUM_BYTES, label)
    domain = binding.get("sha256Domain")
    expected_sha256 = binding.get("sha256")
    expected_size = binding.get("canonicalSizeBytes")
    if (
        not isinstance(domain, str)
        or not isinstance(expected_sha256, str)
        or len(raw) != expected_size
        or hashlib.sha256(domain.encode("utf-8") + raw).hexdigest() != expected_sha256
    ):
        _fail(f"{label}_frozen_binding_mismatch")
    return value


def _validate_control_binding(value: Any, profile_name: str, code: str) -> None:
    binding = _exact_keys(value, _CONTROL_BINDING_KEYS, code)
    artifact_kind, domain = CONTROL_BINDING_PROFILES[profile_name]
    if (
        binding["bindingVersion"] != "nhm2.control_plane.domain_hash_binding/v1"
        or binding["artifactKind"] != artifact_kind
        or binding["sha256Domain"] != domain
        or not isinstance(binding["sha256"], str)
        or _SHA256_RE.fullmatch(binding["sha256"]) is None
        or not _safe_nonnegative_integer(binding["canonicalSizeBytes"])
    ):
        _fail(code)


def _safe_nonnegative_integer(value: Any) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= MAX_SAFE_INTEGER


def _finite_number(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(float(value))
        and not (float(value) == 0.0 and math.copysign(1.0, float(value)) < 0)
    )


def validate_run_request(value: Any, raw: bytes) -> dict[str, Any]:
    request = dict(_exact_keys(value, RUN_REQUEST_KEYS, "run_request_exact_keys_invalid"))
    fixed = {
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.run_request/v1",
        "runPlanBinding": RUN_PLAN_BINDING,
        "candidatePlanV2Binding": CANDIDATE_PLAN_BINDING,
        "branchBvpV1Binding": BRANCH_BVP_BINDING,
        "seedContractBinding": SEED_CONTRACT_BINDING,
        "outputDescriptorSchemaBinding": OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        "proofReplayProtocolBinding": PROOF_REPLAY_PROTOCOL_BINDING,
        "verifierReplayBundleSchemaBinding": REPLAY_BUNDLE_SCHEMA_BINDING,
        "controlPlaneEvidenceGrammarRegistryBinding": CONTROL_PLANE_REGISTRY_BINDING,
    }
    for key, expected in fixed.items():
        if request[key] != expected:
            _fail(f"run_request_{key}_binding_mismatch")
    for field, profile in RUN_REQUEST_PROFILE_FIELDS.items():
        _validate_control_binding(request[field], profile, f"run_request_{field}_invalid")
    for field in ("producerOciImageDigest", "verifierOciImageDigest", "assemblerOciImageDigest"):
        if not isinstance(request[field], str) or _OCI_SHA256_RE.fullmatch(request[field]) is None:
            _fail(f"run_request_{field}_invalid")
    request["_computedBinding"] = domain_binding(raw, "seedRunRequest")
    return request


def _validate_runtime_binding(value: Any, code: str) -> None:
    binding = _exact_keys(
        value,
        frozenset({"artifactId", "contractVersion", "sha256Domain", "sha256", "canonicalSizeBytes"}),
        code,
    )
    if (
        not isinstance(binding["artifactId"], str)
        or not binding["artifactId"]
        or not isinstance(binding["contractVersion"], str)
        or not binding["contractVersion"]
        or not isinstance(binding["sha256Domain"], str)
        or not binding["sha256Domain"]
        or not isinstance(binding["sha256"], str)
        or _SHA256_RE.fullmatch(binding["sha256"]) is None
        or not _safe_nonnegative_integer(binding["canonicalSizeBytes"])
        or binding["canonicalSizeBytes"] == 0
    ):
        _fail(code)


def _validate_interval(value: Any, code: str, *, positive: bool = False, zero: bool = False) -> None:
    interval = _exact_keys(value, frozenset({"lower", "upper"}), code)
    lower, upper = interval["lower"], interval["upper"]
    if not _finite_number(lower) or not _finite_number(upper) or lower > upper:
        _fail(code)
    if positive and lower <= 0:
        _fail(code)
    if zero and (lower != 0 or upper != 0):
        _fail(code)


def _validate_scalar_metadata(value: Any) -> None:
    scalar = _exact_keys(value, SCALAR_METADATA_KEYS, "replay_scalar_metadata_keys_invalid")
    if (
        scalar["nu0"] != -0.5
        or scalar["kappa0"] != 1
        or scalar["xTail"] != 32
        or scalar["rhoTail"] != 32 / 33
    ):
        _fail("replay_scalar_metadata_literals_invalid")
    positive_fields = ("A0", "a1", "xPeak0", "rhoPeak0", "C0")
    if any(not _finite_number(scalar[field]) or scalar[field] <= 0 for field in positive_fields):
        _fail("replay_scalar_metadata_positive_fields_invalid")
    if not _finite_number(scalar["Vc"]) or scalar["Vc"] >= 0:
        _fail("replay_scalar_metadata_Vc_invalid")
    _validate_interval(
        scalar["aInfinityOverCosThetaInterval"],
        "replay_scalar_metadata_angular_interval_invalid",
        positive=True,
    )
    targets = scalar["perTarget"]
    if not isinstance(targets, list) or len(targets) != 7:
        _fail("replay_scalar_metadata_per_target_invalid")
    for index, target in enumerate(targets):
        item = _exact_keys(target, TARGET_METADATA_KEYS, "replay_scalar_target_keys_invalid")
        if (
            item["stage"] != index
            or item["amplitudeExact"] != AMPLITUDES[index]["exact"]
            or item["amplitude"] != AMPLITUDES[index]["value"]
            or any(not _finite_number(item[field]) for field in ("lambda", "nu", "wSeed", "rhoPeak"))
            or not 0 < item["lambda"] < 1
            or not -0.5 < item["nu"] < 0
            or not 0 < item["wSeed"] < 1
            or not 0 < item["rhoPeak"] < 1
        ):
            _fail("replay_scalar_target_value_invalid")
    solves = scalar["perSolveInterior"]
    if not isinstance(solves, list) or len(solves) != 3:
        _fail("replay_scalar_metadata_per_solve_invalid")
    for index, solve in enumerate(solves):
        item = _exact_keys(solve, INTERIOR_SOLVE_METADATA_KEYS, "replay_scalar_solve_keys_invalid")
        if item["levelId"] != LEVELS[index][0] or any(
            not _finite_number(item[field]) for field in ("A32", "N32", "T32", "W32")
        ) or any(item[field] <= 0 for field in ("A32", "N32", "T32")) or item["W32"] >= 0:
            _fail("replay_scalar_solve_value_invalid")
    global_values = _exact_keys(
        scalar["authoritativeGlobalObservables"],
        GLOBAL_OBSERVABLE_KEYS,
        "replay_global_observable_keys_invalid",
    )
    if global_values["subject"] != "deterministic_L2_piecewise_representative_only":
        _fail("replay_global_observable_subject_invalid")
    for name in ("NInterval", "TInterval", "P_VInterval", "NFluxInterval"):
        _validate_interval(global_values[name], "replay_global_positive_interval_invalid", positive=True)
    _validate_interval(global_values["WInterval"], "replay_global_W_interval_invalid")
    if global_values["WInterval"]["upper"] >= 0:
        _fail("replay_global_W_interval_sign_invalid")
    for field in ("N", "T", "P_V", "N_flux"):
        if not _finite_number(global_values[field]) or global_values[field] <= 0:
            _fail("replay_global_representative_invalid")
    if not _finite_number(global_values["W"]) or global_values["W"] >= 0:
        _fail("replay_global_W_representative_invalid")
    interval_pairs = (
        ("NInterval", "N"),
        ("TInterval", "T"),
        ("WInterval", "W"),
        ("P_VInterval", "P_V"),
        ("NFluxInterval", "N_flux"),
    )
    for interval_field, representative_field in interval_pairs:
        interval = global_values[interval_field]
        representative = global_values[representative_field]
        if not interval["lower"] <= representative <= interval["upper"]:
            _fail("replay_global_representative_not_in_interval")


def _require_true_fields(value: Mapping[str, Any], fields: Iterable[str], code: str) -> None:
    if any(value.get(field) is not True for field in fields):
        _fail(code)


def _validate_sha256_fields(value: Mapping[str, Any], fields: Iterable[str], code: str) -> None:
    if any(
        not isinstance(value.get(field), str)
        or _SHA256_RE.fullmatch(value[field]) is None
        for field in fields
    ):
        _fail(code)


def _bounded_nonnegative_number(value: Any, maximum: float) -> bool:
    return _finite_number(value) and 0 <= value <= maximum


def _validate_gate_report(value: Any) -> None:
    report = _exact_keys(value, GATE_REPORT_KEYS, "replay_gate_report_keys_invalid")
    if report["schemaVersion"] != "nhm2.newtonian_seed.gate_report/v1":
        _fail("replay_gate_report_version_invalid")
    interior = report["interiorLevelGates"]
    if not isinstance(interior, list) or len(interior) != 3:
        _fail("replay_interior_gate_count_invalid")
    for index, gate in enumerate(interior):
        item = _exact_keys(gate, INTERIOR_GATE_KEYS, "replay_interior_gate_keys_invalid")
        if (
            item["levelId"] != LEVELS[index][0]
            or item["scope"] != "0<=x<=32_only"
            or item["passed"] is not True
        ):
            _fail("replay_interior_gate_literal_invalid")
        metric_limits = {
            "schrodingerNormalizedLInf": 1e-10,
            "poissonNormalizedLInf": 1e-10,
            "boundaryAndParityLInf": 1e-12,
            "radialTailRelative": 1e-10,
            "angularTailRelative": 1e-10,
        }
        if any(
            not _finite_number(item[field]) or not 0 <= item[field] <= limit
            for field, limit in metric_limits.items()
        ):
            _fail("replay_interior_gate_metric_invalid")
    audit = _exact_keys(report["auditGate"], AUDIT_GATE_KEYS, "replay_audit_gate_keys_invalid")
    if (
        audit["scope"] != "resampling_of_deterministic_L2_piecewise_representative"
        or audit["passed"] is not True
    ):
        _fail("replay_audit_gate_literal_invalid")
    if any(
        not _finite_number(audit[field])
        or not 0 <= audit[field] <= (1e-12 if field == "boundaryAndParityLInf" else 1e-10)
        for field in ("schrodingerNormalizedLInf", "poissonNormalizedLInf", "boundaryAndParityLInf")
    ):
        _fail("replay_audit_gate_metric_invalid")
    global_gate = _exact_keys(
        report["authoritativeGlobalIdentityGate"],
        GLOBAL_GATE_KEYS,
        "replay_global_gate_keys_invalid",
    )
    if (
        global_gate["subject"] != "deterministic_L2_piecewise_representative_only"
        or global_gate["passed"] is not True
    ):
        _fail("replay_global_gate_literal_invalid")
    if any(
        not _finite_number(global_gate[field]) or not 0 <= global_gate[field] <= 1e-9
        for field in (
            "virialRelativeDefect",
            "eigenvalueRelativeDefect",
            "poissonEnergyRelativeDefect",
            "gaussFluxRelativeDefect",
        )
    ):
        _fail("replay_global_gate_metric_invalid")
    targets = report["targetGates"]
    if not isinstance(targets, list) or len(targets) != 7:
        _fail("replay_target_gate_count_invalid")
    for index, gate in enumerate(targets):
        item = _exact_keys(gate, TARGET_GATE_KEYS, "replay_target_gate_keys_invalid")
        if (
            item["stage"] != index
            or item["scope"] != "authoritative_piecewise_L2_and_AUDIT_only"
            or item["targetBoundStatePassed"] is not True
            or item["passed"] is not True
        ):
            _fail("replay_target_gate_literal_invalid")
        target_limits = {
            "amplitudeAbsoluteError": 2.0 ** -30,
            "scalarScalingRelativeLInf": 1e-12,
            "potentialScalingRelativeLInf": 1e-12,
        }
        if any(
            not _finite_number(item[field]) or not 0 <= item[field] <= limit
            for field, limit in target_limits.items()
        ):
            _fail("replay_target_gate_metric_invalid")
    numeric_limits = {
        "L1ToL2FieldRelativeLInf": 1e-8,
        "L1ToL2InteriorObservableRelativeDifference": 1e-9,
    }
    if any(
        not _finite_number(report[field]) or report[field] < 0
        for field in ("D01", "D12", "differenceRatio")
    ) or any(
        not _finite_number(report[field]) or not 0 <= report[field] <= limit
        for field, limit in numeric_limits.items()
    ):
        _fail("replay_gate_report_metric_invalid")
    if report["L1ToL2FieldRelativeLInf"] != report["D12"]:
        _fail("replay_gate_report_D12_alias_invalid")
    if report["D12"] == 0:
        if report["D01"] != 0 or report["differenceRatio"] != 0:
            _fail("replay_gate_report_zero_difference_ratio_invalid")
    elif report["differenceRatio"] != report["D01"] / report["D12"] or report["differenceRatio"] < 4:
        _fail("replay_gate_report_difference_ratio_invalid")
    _require_true_fields(
        report,
        (
            "auditDiscreteNodelessPassed",
            "auditNegativePotentialPassed",
            "continuousNodelessProofPassed",
            "continuousPeakProofPassed",
            "numericalOriginSeriesDefectPassed",
            "allPassed",
        ),
        "replay_gate_report_not_all_passed",
    )


def _validate_proof_receipts(replay: Mapping[str, Any], request: Mapping[str, Any]) -> None:
    nodeless = _exact_keys(
        replay["continuousNodelessProofReceipt"],
        NODELESS_RECEIPT_KEYS,
        "replay_nodeless_receipt_keys_invalid",
    )
    peak = _exact_keys(
        replay["continuousPeakProofReceipt"],
        PEAK_RECEIPT_KEYS,
        "replay_peak_receipt_keys_invalid",
    )
    origin = _exact_keys(
        replay["numericalOriginSeriesDefectReceipt"],
        ORIGIN_RECEIPT_KEYS,
        "replay_origin_receipt_keys_invalid",
    )
    expected_versions = (
        (nodeless, "nhm2.newtonian_seed.nodeless_proof_receipt/v1"),
        (peak, "nhm2.newtonian_seed.peak_proof_receipt/v1"),
        (origin, "nhm2.newtonian_seed.numerical_origin_series_defect_receipt/v1"),
    )
    for receipt, version in expected_versions:
        if receipt["schemaVersion"] != version or receipt["passed"] is not True:
            _fail("replay_proof_receipt_version_or_pass_invalid")
        if receipt["protocolBinding"] != PROOF_REPLAY_PROTOCOL_BINDING:
            _fail("replay_proof_protocol_binding_invalid")
        _validate_runtime_binding(receipt["proofKernelBinding"], "replay_proof_kernel_binding_invalid")
    if not (
        nodeless["proofKernelBinding"]
        == peak["proofKernelBinding"]
        == origin["proofKernelBinding"]
    ):
        _fail("replay_proof_kernel_bindings_disagree")
    _validate_sha256_fields(
        nodeless,
        (
            "sourceL2ScalarSha256",
            "sourceL2PotentialSha256",
            "coverTraceSha256",
            "coulombSelectorTraceSha256",
            "scalarBoundaryLiftSha256",
            "potentialBoundaryLiftSha256",
            "tailCoefficientInventorySha256",
            "representativeContinuumSha256",
            "exteriorRoundingTraceSha256",
        ),
        "replay_nodeless_sha256_invalid",
    )
    _validate_sha256_fields(
        peak,
        (
            "sourceL2ScalarSha256",
            "sourceL2PotentialSha256",
            "sourceTailCoefficientInventorySha256",
            "sourceRepresentativeContinuumSha256",
            "stationaryTraceSha256",
        ),
        "replay_peak_sha256_invalid",
    )
    _validate_sha256_fields(
        origin,
        (
            "sourceL2ScalarSha256",
            "sourceL2PotentialSha256",
            "derivativeMultipoleTraceSha256",
        ),
        "replay_origin_sha256_invalid",
    )
    inventory = replay["observedArrayInventory"]
    scalar_hash = inventory[22]["sha256"]
    potential_hash = inventory[23]["sha256"]
    for receipt in (nodeless, peak, origin):
        if (
            receipt["sourceL2ScalarSha256"] != scalar_hash
            or receipt["sourceL2PotentialSha256"] != potential_hash
        ):
            _fail("replay_proof_source_array_hash_invalid")
    if (
        peak["sourceTailCoefficientInventorySha256"]
        != nodeless["tailCoefficientInventorySha256"]
        or peak["sourceRepresentativeContinuumSha256"]
        != nodeless["representativeContinuumSha256"]
    ):
        _fail("replay_peak_nodeless_closure_hash_invalid")
    if (
        nodeless["xTail"] != 32
        or nodeless["rhoTail"] != 32 / 33
        or nodeless["scalarBoundaryLiftRecordCount"] != 32
        or nodeless["potentialBoundaryLiftRecordCount"] != 32
        or nodeless["auditBaseScalarEntryCount"] != 32768
        or nodeless["prescribedBoundaryPositiveZeroNodeCount"] != 510
        or nodeless["eligibleNonBoundaryNodeCount"] != 32258
        or nodeless["negativeOrNegativeZeroNodeCount"] != 0
        or nodeless["exteriorRoundingRecordCount"] != 524288
        or origin["extractionRecordCount"] != 320
        or peak["exteriorStationaryMaximizerCount"] != 0
        or nodeless["scaledExteriorVariable"]
        != "H_u=u_rep/(exp(-kappa*x)*x^pRepresentative*cos(theta))"
        or nodeless["joinValueDefectUpper"] != 0
        or nodeless["joinDerivativeDefectUpper"] != 0
    ):
        _fail("replay_proof_receipt_frozen_literal_invalid")
    nodeless_count_bounds = {
        "acceptedCompactBoxCount": (1, 262144),
        "coverRecordCount": (1, 262144),
        "maximumDepthUsed": (0, 24),
        "coulombSearchIntervalCount": (1, 65536),
        "coulombSearchMaximumDepth": (0, 32),
        "strictPositiveEligibleNodeCount": (0, 32258),
        "certifiedTailUnderflowPositiveZeroEligibleNodeCount": (0, 32258),
    }
    for field, (lower, upper) in nodeless_count_bounds.items():
        if not _safe_nonnegative_integer(nodeless[field]) or not lower <= nodeless[field] <= upper:
            _fail("replay_nodeless_count_invalid")
    if (
        nodeless["coverRecordCount"] < nodeless["acceptedCompactBoxCount"]
        or nodeless["strictPositiveEligibleNodeCount"]
        + nodeless["certifiedTailUnderflowPositiveZeroEligibleNodeCount"]
        != nodeless["eligibleNonBoundaryNodeCount"]
    ):
        _fail("replay_nodeless_count_cross_invariant_invalid")
    length_fields = (
        (nodeless["leadingScalarCorrectionCoefficientIntervals"], 64, True),
        (nodeless["tailScalarRepresentativeCoefficients"], 1088, False),
        (nodeless["tailPotentialRepresentativeCoefficients"], 1088, False),
        (nodeless["tailScalarContinuationCoefficientIntervals"], 1088, True),
        (nodeless["tailPotentialContinuationCoefficientIntervals"], 1088, True),
    )
    for sequence, length, intervals in length_fields:
        if not isinstance(sequence, list) or len(sequence) != length:
            _fail("replay_nodeless_tuple_length_invalid")
        if intervals:
            for interval in sequence:
                _validate_interval(interval, "replay_nodeless_interval_tuple_invalid")
        elif any(not _finite_number(item) for item in sequence):
            _fail("replay_nodeless_coefficient_tuple_invalid")
    for field in ("totalNInterval", "CInterval", "interiorNInterval", "tailMassInterval"):
        _validate_interval(nodeless[field], "replay_nodeless_interval_invalid", positive=True)
    _validate_interval(
        nodeless["aInfinityOverCosThetaGlobalInterval"],
        "replay_nodeless_angular_interval_invalid",
        positive=True,
    )
    for field in ("a1Interval",):
        _validate_interval(origin[field], "replay_origin_positive_interval_invalid", positive=True)
    for field in ("VcInterval", "a3Interval", "b2Interval", "b4Interval"):
        _validate_interval(origin[field], "replay_origin_interval_invalid")
    if origin["VcInterval"]["upper"] >= 0:
        _fail("replay_origin_Vc_interval_sign_invalid")
    origin_defect_fields = (
        "scalarX1Ell1AxisRepresentativeDefect",
        "scalarX1NonEll1Defect",
        "scalarX2AllMultipoleDefect",
        "scalarX3P1IdentityDefect",
        "scalarX3NonEll1Ell3Defect",
        "scalarX4AllMultipoleDefect",
        "potentialX0NonEll0Defect",
        "potentialX1AllMultipoleDefect",
        "potentialX2Ell0AndEllGe4Defect",
        "potentialX3AllMultipoleDefect",
        "potentialX4P0IdentityDefect",
        "potentialX4P2IdentityDefect",
        "potentialX4NonEll0Ell2Ell4Defect",
    )
    if any(not _bounded_nonnegative_number(origin[field], 1e-10) for field in origin_defect_fields):
        _fail("replay_origin_defect_bound_invalid")
    _validate_interval(peak["rhoPeakInterval"], "replay_peak_rho_interval_invalid", positive=True)
    _validate_interval(peak["thetaPeakInterval"], "replay_peak_theta_interval_invalid", zero=True)
    _validate_interval(peak["xPeakInterval"], "replay_peak_x_interval_invalid", positive=True)
    _validate_interval(peak["A0Interval"], "replay_peak_A0_interval_invalid", positive=True)
    if peak["rhoPeakInterval"]["upper"] >= 32 / 33:
        _fail("replay_peak_rho_interval_domain_invalid")
    peak_count_bounds = {
        "stationaryCandidateCount": (1, 262144),
        "stationaryRecordCount": (1, 262144),
        "originValueCoverRecordCount": (1, 262143),
        "physicalDerivativeRecordCount": (1, 262143),
        "c1JoinValueCoverRecordCount": (1, 262143),
        "uniquePeakBoxIndex": (0, 262143),
        "acceptedBoxCount": (1, 262144),
        "maximumDepthUsed": (0, 56),
    }
    for field, (lower, upper) in peak_count_bounds.items():
        if not _safe_nonnegative_integer(peak[field]) or not lower <= peak[field] <= upper:
            _fail("replay_peak_count_invalid")
    if (
        peak["stationaryRecordCount"]
        != peak["originValueCoverRecordCount"]
        + peak["physicalDerivativeRecordCount"]
        + peak["c1JoinValueCoverRecordCount"]
        or peak["stationaryCandidateCount"] > peak["acceptedBoxCount"]
        or peak["acceptedBoxCount"] > peak["stationaryRecordCount"]
        or peak["uniquePeakBoxIndex"] >= peak["stationaryRecordCount"]
    ):
        _fail("replay_peak_count_cross_invariant_invalid")
    strictly_positive_peak_fields = (
        "hessianDeterminantLower",
        "globalDominanceMarginLower",
        "interiorCandidateValueLower",
        "scaledExteriorRadialDecreaseLower",
    )
    if any(
        not _finite_number(peak[field]) or peak[field] <= 0
        for field in strictly_positive_peak_fields
    ) or any(
        not _finite_number(peak[field]) or peak[field] >= 0
        for field in (
            "largestHessianEigenvalueUpper",
            "radialHessianEigenvalueUpper",
            "regularTransverseHessianEigenvalueUpper",
        )
    ) or not _finite_number(peak["exteriorTailSupremumUpper"]) or peak["exteriorTailSupremumUpper"] < 0:
        _fail("replay_peak_numeric_bound_invalid")
    positive_nodeless_fields = (
        "minimumCompactLowerBound",
        "totalNRepresentative",
        "CRepresentative",
        "tailRadius",
    )
    if any(
        not _finite_number(nodeless[field]) or nodeless[field] <= 0
        for field in positive_nodeless_fields
    ):
        _fail("replay_nodeless_positive_field_invalid")
    nodeless_unit_upper_fields = (
        "scalarWeightedRemainderRatioUpper",
        "tailContractionUpper",
    )
    if any(
        not _finite_number(nodeless[field]) or not 0 <= nodeless[field] < 1
        for field in nodeless_unit_upper_fields
    ):
        _fail("replay_nodeless_contraction_field_invalid")
    nodeless_nonnegative_fields = (
        "coulombConsistencyRelativeDefect",
        "potentialWeightedRemainderAbsoluteUpper",
        "tailRadiiY",
        "tailRadiiZ",
        "tailSchrodingerNormalizedLInf",
        "tailPoissonNormalizedLInf",
        "interiorJoinSchrodingerNormalizedLimit",
        "exteriorJoinSchrodingerNormalizedLimit",
        "interiorJoinPoissonNormalizedLimit",
        "exteriorJoinPoissonNormalizedLimit",
    )
    if any(not _finite_number(nodeless[field]) or nodeless[field] < 0 for field in nodeless_nonnegative_fields):
        _fail("replay_nodeless_nonnegative_field_invalid")
    if (
        nodeless["coulombConsistencyRelativeDefect"] > 1e-12
        or any(
            nodeless[field] > 1e-10
            for field in (
                "tailSchrodingerNormalizedLInf",
                "tailPoissonNormalizedLInf",
                "interiorJoinSchrodingerNormalizedLimit",
                "exteriorJoinSchrodingerNormalizedLimit",
                "interiorJoinPoissonNormalizedLimit",
                "exteriorJoinPoissonNormalizedLimit",
            )
        )
    ):
        _fail("replay_nodeless_defect_bound_invalid")
    scalar = replay["serverRecomputedScalarMetadata"]
    globals_value = scalar["authoritativeGlobalObservables"]
    if (
        scalar["C0"] != nodeless["CRepresentative"]
        or globals_value["N"] != nodeless["totalNRepresentative"]
        or globals_value["NInterval"] != nodeless["totalNInterval"]
        or not origin["a1Interval"]["lower"] <= scalar["a1"] <= origin["a1Interval"]["upper"]
        or not origin["VcInterval"]["lower"] <= scalar["Vc"] <= origin["VcInterval"]["upper"]
        or not peak["A0Interval"]["lower"] <= scalar["A0"] <= peak["A0Interval"]["upper"]
        or not peak["rhoPeakInterval"]["lower"] <= scalar["rhoPeak0"] <= peak["rhoPeakInterval"]["upper"]
        or not peak["xPeakInterval"]["lower"] <= scalar["xPeak0"] <= peak["xPeakInterval"]["upper"]
    ):
        _fail("replay_scalar_proof_projection_invariant_invalid")
    # The run request closes the verifier proof-kernel artifact, while the imported
    # proof receipts use a differently shaped runtime binding.  Equality cannot be
    # established here without the separately bound proof-kernel artifact bytes.
    _validate_control_binding(
        request["verifierProofKernelBinding"],
        "verifierProofKernel",
        "run_request_verifier_proof_kernel_binding_invalid",
    )


def validate_observed_inventory(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list) or len(value) != 32:
        _fail("replay_observed_inventory_count_invalid")
    result: list[dict[str, Any]] = []
    seen_paths: set[str] = set()
    for index, candidate in enumerate(value):
        entry = dict(_exact_keys(candidate, ARRAY_ENTRY_KEYS, "replay_array_entry_keys_invalid"))
        expected = FROZEN_ARRAY_INVENTORY[index]
        for field, expected_value in expected.items():
            if entry[field] != expected_value:
                _fail(f"replay_array_static_field_mismatch_{index}_{field}")
        if not isinstance(entry["sha256"], str) or _SHA256_RE.fullmatch(entry["sha256"]) is None:
            _fail(f"replay_array_sha256_invalid_{index}")
        if entry["relativePath"] in seen_paths:
            _fail("replay_array_path_duplicate")
        seen_paths.add(entry["relativePath"])
        result.append(entry)
    return result


def validate_replay_bundle(value: Any, raw: bytes, request: Mapping[str, Any]) -> dict[str, Any]:
    replay = dict(_exact_keys(value, REPLAY_KEYS, "replay_bundle_exact_keys_invalid"))
    fixed = {
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle/v1",
        "runPlanBinding": RUN_PLAN_BINDING,
        "runRequestBinding": request["_computedBinding"],
        "seedContractBinding": SEED_CONTRACT_BINDING,
        "candidatePlanV2Binding": CANDIDATE_PLAN_BINDING,
        "branchBvpV1Binding": BRANCH_BVP_BINDING,
        "outputDescriptorSchemaBinding": OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
        "proofReplayProtocolBinding": PROOF_REPLAY_PROTOCOL_BINDING,
        "verifierSourceLedgerBinding": request["verifierSourceLedgerBinding"],
        "verifierToolchainLedgerBinding": request["verifierToolchainLedgerBinding"],
        "verifierOciImageDigest": request["verifierOciImageDigest"],
    }
    for key, expected in fixed.items():
        if replay[key] != expected:
            _fail(f"replay_bundle_{key}_mismatch")
    _validate_control_binding(
        replay["absoluteDeadlineBinding"],
        "absoluteDeadlineReceipt",
        "replay_deadline_binding_invalid",
    )
    _validate_control_binding(
        replay["verifierInputLedgerBinding"],
        "verifierInputLedger",
        "replay_input_ledger_binding_invalid",
    )
    replay["observedArrayInventory"] = validate_observed_inventory(
        replay["observedArrayInventory"]
    )
    _validate_gate_report(replay["serverRecomputedGateReport"])
    _validate_scalar_metadata(replay["serverRecomputedScalarMetadata"])
    _validate_proof_receipts(replay, request)
    replay["_computedBinding"] = domain_binding(raw, "verifierReplayBundleInstance")
    return replay


def _unsigned_decimal(value: Any, code: str) -> int:
    if not isinstance(value, str) or re.fullmatch(r"0|[1-9][0-9]*", value) is None:
        _fail(code)
    return int(value)


def validate_verifier_enforcement_receipt(
    value: Any,
    request: Mapping[str, Any],
    replay: Mapping[str, Any],
) -> dict[str, Any]:
    receipt = dict(
        _exact_keys(value, ENFORCEMENT_RECEIPT_KEYS, "verifier_receipt_exact_keys_invalid")
    )
    if (
        receipt["schemaVersion"]
        != "nhm2.prolate_boson_star.newtonian_seed.stage_enforcement_receipt/v1"
        or receipt["stageId"] != "trusted_independent_verifier"
        or receipt["runPlanBinding"] != RUN_PLAN_BINDING
        or receipt["runRequestBinding"] != request["_computedBinding"]
        or receipt["sourceManifestBinding"] != request["verifierSourceManifestBinding"]
        or receipt["sourceLedgerBinding"] != request["verifierSourceLedgerBinding"]
        or receipt["toolchainManifestBinding"] != request["verifierToolchainManifestBinding"]
        or receipt["toolchainLedgerBinding"] != request["verifierToolchainLedgerBinding"]
        or receipt["ociImageDigest"] != request["verifierOciImageDigest"]
        or receipt["capabilityBinding"] != request["isolatedWorkerCapabilityBinding"]
        or receipt["sandboxAndSeccompPolicyBinding"] != request["verifierSeccompPolicyBinding"]
        or receipt["schedulerLeaseBinding"] != request["schedulerLeaseBinding"]
        or receipt["quotaCapabilityBinding"] != request["verifierQuotaCapabilityBinding"]
        or receipt["absoluteDeadlineBinding"] != replay["absoluteDeadlineBinding"]
    ):
        _fail("verifier_receipt_frozen_or_run_binding_mismatch")
    receipt_profiles = {
        "launchEnvelopeBinding": "verifierLaunchEnvelope",
        "inputLedgerBinding": "verifierInputLedger",
        "seccompLoadReceiptBinding": "verifierSeccompLoadReceipt",
        "quotaSetupReceiptBinding": "verifierQuotaSetupReceipt",
        "closedStageOutputObservationBinding": "verifierClosedOutputObservation",
        "observationCaptureReceiptBinding": "observationCaptureReceipt",
    }
    for field, profile in receipt_profiles.items():
        _validate_control_binding(receipt[field], profile, f"verifier_receipt_{field}_invalid")
    if receipt["inputLedgerBinding"] != replay["verifierInputLedgerBinding"]:
        _fail("verifier_receipt_replay_input_ledger_binding_mismatch")
    phase_fields = (
        "monotonicStartNanoseconds",
        "secureInputRereadStartMonotonicNanoseconds",
        "secureInputRereadEndMonotonicNanoseconds",
        "stageWorkStartMonotonicNanoseconds",
        "stageWorkEndMonotonicNanoseconds",
        "outputCloseAndFsyncStartMonotonicNanoseconds",
        "outputCloseAndFsyncEndMonotonicNanoseconds",
        "monotonicEndNanoseconds",
        "postExitReceiptAssemblyStartMonotonicNanoseconds",
    )
    phases = [_unsigned_decimal(receipt[field], "verifier_receipt_phase_invalid") for field in phase_fields]
    if receipt["clockId"] != "CLOCK_MONOTONIC_RAW" or phases != sorted(phases):
        _fail("verifier_receipt_phase_order_invalid")
    if phases[-1] <= phases[-2]:
        _fail("verifier_receipt_post_exit_not_after_cgroup_empty")
    exact_values = {
        "memoryMaxBytes": 805306368,
        "memoryOomEvents": 0,
        "memoryOomKillEvents": 0,
        "pidsMaxEvents": 0,
        "seccompViolationCount": 0,
        "toolchainParentExactFirstLevelInventoryObserved": True,
        "mountIdentityStableThroughStage": True,
        "projectInheritanceStableThroughStage": True,
        "descendantOutputFileCount": 1,
        "allDescendantOutputsCarrySetupDeviceAndProjectId": True,
        "writableMountQuotaExceeded": False,
        "rlimitFsizeBytes": 16 * MIB,
        "rlimitFsizeExceeded": False,
        "exitCode": 0,
        "timedOut": False,
        "killed": False,
        "cgroupPopulatedZero": True,
    }
    for field, expected in exact_values.items():
        if receipt[field] != expected:
            _fail(f"verifier_receipt_{field}_not_admissible")
    bounded_values = {
        "memoryPeakBytes": 805306368,
        "pidsPeak": 1,
        "stdoutBytes": 1 * MIB,
        "stderrBytes": 1 * MIB,
        "writableMountPeakBytes": 20 * MIB,
        "writableMountPeakInodes": 8,
    }
    for field, maximum in bounded_values.items():
        if not _safe_nonnegative_integer(receipt[field]) or receipt[field] > maximum:
            _fail(f"verifier_receipt_{field}_limit_invalid")
    # closedStageOutputObservationBinding is intentionally opaque here: the
    # invocation does not supply the observation artifact whose single file
    # tuple resolves it to replay['_computedBinding'].  The broker must resolve
    # that edge before launch; accepting the binding object is not claiming it.
    return receipt


def require_executable_closed_schema_authority() -> None:
    if EXECUTABLE_CLOSED_SCHEMA_AUTHORITY_BINDING is None:
        _fail("closed_schema_typed_interpreter_authority_absent")
    _fail("unrecognized_closed_schema_typed_interpreter_authority")


def array_digest(relative_path: str, role: str, raw: bytes) -> str:
    path_bytes = relative_path.encode("utf-8")
    role_bytes = role.encode("utf-8")
    digest = hashlib.sha256()
    digest.update(ARRAY_HASH_DOMAIN.encode("utf-8"))
    digest.update(struct.pack(">Q", len(path_bytes)))
    digest.update(path_bytes)
    digest.update(struct.pack(">Q", len(role_bytes)))
    digest.update(role_bytes)
    digest.update(struct.pack(">Q", len(raw)))
    digest.update(raw)
    return digest.hexdigest()


def _canonical_relative_path(value: str) -> tuple[str, ...]:
    if (
        not value
        or value.startswith("/")
        or value.endswith("/")
        or "//" in value
        or "\\" in value
        or "\x00" in value
    ):
        _fail("noncanonical_relative_path")
    parts = tuple(value.split("/"))
    if any(part in ("", ".", "..") for part in parts):
        _fail("noncanonical_relative_path")
    if any(any(ord(char) < 0x20 or ord(char) > 0x7E for char in part) for part in parts):
        _fail("non_ascii_relative_path")
    return parts


def _require_linux() -> None:
    required = ("O_DIRECTORY", "O_NOFOLLOW", "O_CLOEXEC")
    if sys.platform != "linux" or os.name != "posix" or any(not hasattr(os, name) for name in required):
        _fail("linux_secure_file_primitives_required")


class _OpenHow(ctypes.Structure):
    _fields_ = (
        ("flags", ctypes.c_uint64),
        ("mode", ctypes.c_uint64),
        ("resolve", ctypes.c_uint64),
    )


_SYS_OPENAT2 = 437
_RESOLVE_NO_XDEV = 0x01
_RESOLVE_NO_MAGICLINKS = 0x02
_RESOLVE_NO_SYMLINKS = 0x04
_RESOLVE_BENEATH = 0x08
_OPENAT2_RESOLVE_POLICY = (
    _RESOLVE_BENEATH | _RESOLVE_NO_SYMLINKS | _RESOLVE_NO_MAGICLINKS | _RESOLVE_NO_XDEV
)


def _openat2(directory_fd: int, relative_path: str, flags: int, mode: int = 0) -> int:
    _require_linux()
    _canonical_relative_path(relative_path)
    machine = os.uname().machine
    if machine not in ("x86_64", "aarch64"):
        _fail("linux_openat2_architecture_not_preregistered")
    encoded = relative_path.encode("ascii", "strict")
    how = _OpenHow(flags=flags, mode=mode, resolve=_OPENAT2_RESOLVE_POLICY)
    libc = ctypes.CDLL(None, use_errno=True)
    syscall = libc.syscall
    syscall.restype = ctypes.c_long
    result = syscall(
        ctypes.c_long(_SYS_OPENAT2),
        ctypes.c_int(directory_fd),
        ctypes.c_char_p(encoded),
        ctypes.byref(how),
        ctypes.c_size_t(ctypes.sizeof(how)),
    )
    if result < 0:
        error_number = ctypes.get_errno()
        raise OSError(error_number, os.strerror(error_number), relative_path)
    return int(result)


def _mount_id(fd: int) -> int:
    path = f"/proc/self/fdinfo/{fd}"
    try:
        with open(path, "rb", buffering=0) as handle:
            raw = handle.read(16 * 1024)
    except OSError as exc:
        raise AssemblyError("linux_mount_id_observation_unavailable") from exc
    for line in raw.splitlines():
        if line.startswith(b"mnt_id:\t"):
            try:
                return int(line.split(b"\t", 1)[1])
            except ValueError as exc:
                raise AssemblyError("linux_mount_id_observation_invalid") from exc
    _fail("linux_mount_id_observation_missing")
    raise AssertionError("unreachable")


def _stat_identity(st: os.stat_result, mount_id: int) -> tuple[int, ...]:
    return (
        mount_id,
        st.st_dev,
        st.st_ino,
        stat.S_IFMT(st.st_mode),
        st.st_nlink,
        st.st_uid,
        st.st_gid,
        st.st_size,
        st.st_mtime_ns,
        st.st_ctime_ns,
    )


@dataclass(frozen=True)
class FileSnapshot:
    relative_path: str
    mount_id: int
    device_id: int
    inode: int
    link_count: int
    mode_file_type: int
    uid: int
    gid: int
    byte_length: int
    mtime_nanoseconds: int
    ctime_nanoseconds: int
    raw_sha256: str
    raw: bytes

    @property
    def stable_identity(self) -> tuple[int, ...]:
        return (
            self.mount_id,
            self.device_id,
            self.inode,
            self.mode_file_type,
            self.link_count,
            self.uid,
            self.gid,
            self.byte_length,
            self.mtime_nanoseconds,
            self.ctime_nanoseconds,
        )


class SecureRoot:
    def __init__(self, absolute_path: str):
        _require_linux()
        if not absolute_path.startswith("/") or absolute_path != os.path.normpath(absolute_path):
            _fail("secure_root_path_not_canonical_absolute_linux")
        self.absolute_path = absolute_path
        flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
        try:
            self.fd = os.open(absolute_path, flags)
        except OSError as exc:
            raise AssemblyError("secure_root_open_failed") from exc
        st = os.fstat(self.fd)
        if not stat.S_ISDIR(st.st_mode):
            self.close()
            _fail("secure_root_not_directory")
        self.mount_id = _mount_id(self.fd)
        self.identity = (self.mount_id, st.st_dev, st.st_ino)

    def close(self) -> None:
        fd = getattr(self, "fd", -1)
        if fd >= 0:
            os.close(fd)
            self.fd = -1

    def __enter__(self) -> "SecureRoot":
        return self

    def __exit__(self, _kind: Any, _value: Any, _traceback: Any) -> None:
        self.close()

    def _open_directory(self, relative_path: str) -> int:
        parts = _canonical_relative_path(relative_path) if relative_path else ()
        current = os.dup(self.fd)
        try:
            for part in parts:
                next_fd = _openat2(
                    current,
                    part,
                    os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC,
                )
                os.close(current)
                current = next_fd
                st = os.fstat(current)
                if not stat.S_ISDIR(st.st_mode) or _mount_id(current) != self.mount_id:
                    _fail("secure_directory_resolution_crossed_mount_or_type")
            return current
        except BaseException:
            os.close(current)
            raise

    def enumerate_tree(
        self,
        expected_directories: Sequence[str],
        expected_files: Sequence[str],
    ) -> dict[str, tuple[int, int, int]]:
        expected_directory_set = set(expected_directories)
        expected_file_set = set(expected_files)
        actual_directories: set[str] = set()
        actual_files: set[str] = set()
        directory_identities: dict[str, tuple[int, int, int]] = {}
        pending = [""]
        while pending:
            relative_directory = pending.pop()
            directory_fd = self._open_directory(relative_directory)
            try:
                for name in os.listdir(directory_fd):
                    _canonical_relative_path(name)
                    relative = f"{relative_directory}/{name}" if relative_directory else name
                    st = os.stat(name, dir_fd=directory_fd, follow_symlinks=False)
                    if stat.S_ISDIR(st.st_mode):
                        child_fd = _openat2(
                            directory_fd,
                            name,
                            os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC,
                        )
                        try:
                            child_mount = _mount_id(child_fd)
                            child_stat = os.fstat(child_fd)
                        finally:
                            os.close(child_fd)
                        if (
                            child_mount != self.mount_id
                            or _stat_identity(st, child_mount)
                            != _stat_identity(child_stat, child_mount)
                        ):
                            _fail("tree_directory_cross_mount_or_replaced")
                        identity = (child_mount, child_stat.st_dev, child_stat.st_ino)
                        if identity in directory_identities.values() or identity == self.identity:
                            _fail("tree_directory_alias_invalid")
                        directory_identities[relative] = identity
                        actual_directories.add(relative)
                        pending.append(relative)
                    elif stat.S_ISREG(st.st_mode):
                        if st.st_nlink != 1:
                            _fail("tree_file_hardlink_invalid")
                        actual_files.add(relative)
                    else:
                        _fail("tree_special_entry_invalid")
            finally:
                os.close(directory_fd)
        if actual_directories != expected_directory_set or actual_files != expected_file_set:
            _fail("tree_closed_inventory_mismatch")
        return directory_identities

    def read_file(self, relative_path: str, maximum_bytes: int) -> FileSnapshot:
        parts = _canonical_relative_path(relative_path)
        parent_path = "/".join(parts[:-1])
        basename = parts[-1]
        parent_fd = self._open_directory(parent_path)
        file_fd = -1
        try:
            before_path = os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
            if (
                not stat.S_ISREG(before_path.st_mode)
                or before_path.st_nlink != 1
                or before_path.st_size < 0
                or before_path.st_size > maximum_bytes
            ):
                _fail("secure_file_preopen_stat_invalid")
            file_fd = _openat2(
                parent_fd,
                basename,
                os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC,
            )
            opened = os.fstat(file_fd)
            mount_id = _mount_id(file_fd)
            if mount_id != self.mount_id or _stat_identity(before_path, mount_id) != _stat_identity(opened, mount_id):
                _fail("secure_file_open_identity_mismatch")
            chunks: list[bytes] = []
            remaining = opened.st_size
            while remaining:
                chunk = os.read(file_fd, min(1024 * 1024, remaining))
                if not chunk:
                    _fail("secure_file_short_read")
                chunks.append(chunk)
                remaining -= len(chunk)
            if os.read(file_fd, 1) != b"":
                _fail("secure_file_grew_during_read")
            raw = b"".join(chunks)
            after_handle = os.fstat(file_fd)
            after_path = os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
            expected_identity = _stat_identity(opened, mount_id)
            if (
                _stat_identity(after_handle, mount_id) != expected_identity
                or _stat_identity(after_path, mount_id) != expected_identity
                or len(raw) != opened.st_size
            ):
                _fail("secure_file_stat_read_stat_mutation")
            return FileSnapshot(
                relative_path=relative_path,
                mount_id=mount_id,
                device_id=opened.st_dev,
                inode=opened.st_ino,
                link_count=opened.st_nlink,
                mode_file_type=stat.S_IFMT(opened.st_mode),
                uid=opened.st_uid,
                gid=opened.st_gid,
                byte_length=opened.st_size,
                mtime_nanoseconds=opened.st_mtime_ns,
                ctime_nanoseconds=opened.st_ctime_ns,
                raw_sha256=hashlib.sha256(raw).hexdigest(),
                raw=raw,
            )
        except OSError as exc:
            raise AssemblyError("secure_file_read_failed") from exc
        finally:
            if file_fd >= 0:
                os.close(file_fd)
            os.close(parent_fd)

    def create_file_exclusive(self, relative_path: str, raw: bytes) -> FileSnapshot:
        parts = _canonical_relative_path(relative_path)
        parent_path = "/".join(parts[:-1])
        basename = parts[-1]
        parent_fd = self._open_directory(parent_path)
        file_fd = -1
        try:
            try:
                os.stat(basename, dir_fd=parent_fd, follow_symlinks=False)
            except FileNotFoundError:
                pass
            else:
                _fail("destination_preexisted")
            file_fd = _openat2(
                parent_fd,
                basename,
                os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
                0o600,
            )
            view = memoryview(raw)
            offset = 0
            while offset < len(view):
                written = os.write(file_fd, view[offset:])
                if written <= 0:
                    _fail("destination_write_short")
                offset += written
            os.fsync(file_fd)
            written_stat = os.fstat(file_fd)
            if (
                not stat.S_ISREG(written_stat.st_mode)
                or written_stat.st_nlink != 1
                or written_stat.st_size != len(raw)
                or _mount_id(file_fd) != self.mount_id
            ):
                _fail("destination_written_stat_invalid")
        except OSError as exc:
            raise AssemblyError("destination_exclusive_write_failed") from exc
        finally:
            if file_fd >= 0:
                os.close(file_fd)
            os.close(parent_fd)
        observed = self.read_file(relative_path, len(raw))
        if observed.raw != raw:
            _fail("destination_reread_bytes_mismatch")
        return observed

    def fsync_directories(self, relative_paths: Sequence[str]) -> None:
        for relative_path in relative_paths:
            directory_fd = self._open_directory(relative_path)
            try:
                os.fsync(directory_fd)
            except OSError as exc:
                raise AssemblyError("directory_fsync_failed") from exc
            finally:
                os.close(directory_fd)


def _same_snapshot(first: FileSnapshot, second: FileSnapshot) -> bool:
    return (
        first.relative_path == second.relative_path
        and first.stable_identity == second.stable_identity
        and first.raw_sha256 == second.raw_sha256
        and first.raw == second.raw
    )


def _build_descriptor(replay: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor/v1",
        "artifactKind": "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
        "seedContractBinding": SEED_CONTRACT_BINDING,
        "candidatePlanV2Binding": CANDIDATE_PLAN_BINDING,
        "branchBvpV1Binding": BRANCH_BVP_BINDING,
        "levelOrder": ["L0", "L1", "L2", "AUDIT"],
        "gridDefinitions": list(GRID_DEFINITIONS),
        "amplitudeOrder": list(AMPLITUDES),
        "scalarMetadata": replay["serverRecomputedScalarMetadata"],
        "serverRecomputedGateReport": replay["serverRecomputedGateReport"],
        "continuousNodelessProofReceipt": replay["continuousNodelessProofReceipt"],
        "continuousPeakProofReceipt": replay["continuousPeakProofReceipt"],
        "numericalOriginSeriesDefectReceipt": replay["numericalOriginSeriesDefectReceipt"],
        "arrayInventory": replay["observedArrayInventory"],
        "arrayCount": 32,
        "float64ElementCount": ARRAY_TOTAL_ELEMENTS,
        "arrayByteLength": ARRAY_TOTAL_BYTES,
    }


@dataclass(frozen=True)
class AssemblyResult:
    descriptor_byte_length: int
    descriptor_raw_sha256: str
    replay_bundle_binding: Mapping[str, Any]
    copied_array_count: int


def assemble_seed_container(
    *,
    input_manifest_path: str,
    staging_root_path: str,
    replay_bundle_path: str,
    verifier_enforcement_receipt_path: str,
    output_root_path: str,
) -> AssemblyResult:
    """Assemble a fresh closed output tree; return no admission authority."""

    _require_linux()
    if (
        input_manifest_path != "/run/input/00-seed-run-request.v1.json"
        or staging_root_path != "/run/staging"
        or replay_bundle_path
        != "/run/replay/seed-verifier-replay-bundle.canonical.json"
        or verifier_enforcement_receipt_path
        != "/run/attestation/verifier-stage-enforcement-receipt.canonical.json"
        or output_root_path != "/run/output"
    ):
        _fail("frozen_assembler_path_argument_mismatch")
    manifest_root_path, manifest_name = os.path.split(input_manifest_path)
    replay_root_path, replay_name = os.path.split(replay_bundle_path)
    receipt_root_path, receipt_name = os.path.split(verifier_enforcement_receipt_path)
    if not manifest_root_path or not replay_root_path or not receipt_root_path:
        _fail("absolute_input_path_required")
    with (
        SecureRoot(manifest_root_path) as manifest_root,
        SecureRoot(staging_root_path) as staging_root,
        SecureRoot(replay_root_path) as replay_root,
        SecureRoot(receipt_root_path) as receipt_root,
        SecureRoot(output_root_path) as output_root,
    ):
        root_identities = {
            manifest_root.identity,
            staging_root.identity,
            replay_root.identity,
            receipt_root.identity,
            output_root.identity,
        }
        root_file_identities = {identity[1:] for identity in root_identities}
        if len(root_identities) != 5 or len(root_file_identities) != 5:
            _fail("input_or_output_root_alias_invalid")
        manifest_root.enumerate_tree((), BASE_INPUT_PATHS)
        staging_directory_identities = staging_root.enumerate_tree(
            EXPLICIT_DIRECTORIES, ARRAY_PATHS
        )
        replay_root.enumerate_tree((), (replay_name,))
        receipt_root.enumerate_tree((), (receipt_name,))
        output_directory_identities = output_root.enumerate_tree(EXPLICIT_DIRECTORIES, ())
        all_directory_file_ids = [
            *(identity[1:] for identity in root_identities),
            *(identity[1:] for identity in staging_directory_identities.values()),
            *(identity[1:] for identity in output_directory_identities.values()),
        ]
        if len(set(all_directory_file_ids)) != len(all_directory_file_ids):
            _fail("input_or_output_directory_alias_invalid")

        manifest_snapshot = manifest_root.read_file(manifest_name, RUN_REQUEST_MAXIMUM_BYTES)
        manifest_value = parse_exact_canonical_json(
            manifest_snapshot.raw, RUN_REQUEST_MAXIMUM_BYTES, "run_request"
        )
        request = validate_run_request(manifest_value, manifest_snapshot.raw)
        base_input_snapshots: dict[str, FileSnapshot] = {
            manifest_name: manifest_snapshot
        }
        for index, relative_path in enumerate(BASE_INPUT_PATHS[1:], start=1):
            snapshot = manifest_root.read_file(relative_path, RUN_REQUEST_MAXIMUM_BYTES)
            validate_hash_bound_canonical_input(
                snapshot.raw,
                BASE_HASH_BOUND_INPUTS[relative_path],
                f"base_input_{index}",
            )
            base_input_snapshots[relative_path] = snapshot

        replay_snapshot = replay_root.read_file(replay_name, REPLAY_BUNDLE_MAXIMUM_BYTES)
        replay_value = parse_exact_canonical_json(
            replay_snapshot.raw, REPLAY_BUNDLE_MAXIMUM_BYTES, "replay_bundle"
        )
        replay = validate_replay_bundle(replay_value, replay_snapshot.raw, request)

        receipt_snapshot = receipt_root.read_file(receipt_name, ENFORCEMENT_RECEIPT_MAXIMUM_BYTES)
        receipt_value = parse_exact_canonical_json(
            receipt_snapshot.raw,
            ENFORCEMENT_RECEIPT_MAXIMUM_BYTES,
            "verifier_enforcement_receipt",
        )
        validate_verifier_enforcement_receipt(receipt_value, request, replay)

        # No file under /run/output has been opened for writing at this point.
        # The bounded checks above cannot substitute for the frozen full
        # recursive replay/descriptor schema interpreter, whose authority is
        # explicitly absent in the current contract.
        require_executable_closed_schema_authority()

        source_snapshots: list[FileSnapshot] = []
        destination_snapshots: list[FileSnapshot] = []
        input_file_ids = {
            *((snapshot.device_id, snapshot.inode) for snapshot in base_input_snapshots.values()),
            (replay_snapshot.device_id, replay_snapshot.inode),
            (receipt_snapshot.device_id, receipt_snapshot.inode),
        }
        if len(input_file_ids) != 10:
            _fail("manifest_replay_or_receipt_file_alias_invalid")
        output_file_ids: set[tuple[int, int]] = set()
        for index, entry in enumerate(replay["observedArrayInventory"]):
            relative_path = entry["relativePath"]
            source = staging_root.read_file(relative_path, entry["byteLength"])
            if source.byte_length != entry["byteLength"]:
                _fail(f"staging_array_byte_length_mismatch_{index}")
            if array_digest(relative_path, entry["role"], source.raw) != entry["sha256"]:
                _fail(f"staging_array_domain_hash_mismatch_{index}")
            source_file_id = (source.device_id, source.inode)
            if source_file_id in input_file_ids:
                _fail(f"staging_array_file_alias_invalid_{index}")
            input_file_ids.add(source_file_id)
            destination = output_root.create_file_exclusive(relative_path, source.raw)
            if (
                destination.byte_length != source.byte_length
                or destination.raw_sha256 != source.raw_sha256
                or destination.raw != source.raw
                or destination.stable_identity[:3] == source.stable_identity[:3]
                or (destination.device_id, destination.inode) in input_file_ids
                or (destination.device_id, destination.inode) in output_file_ids
            ):
                _fail(f"copied_array_secure_reread_mismatch_{index}")
            output_file_ids.add((destination.device_id, destination.inode))
            source_snapshots.append(source)
            destination_snapshots.append(destination)

        # Close and persist all array files and their directory entries before
        # constructing or creating the unique descriptor commit marker.
        output_root.fsync_directories(("arrays/L0", "arrays/L1", "arrays/L2", "arrays/AUDIT", "arrays"))
        repeated_output_directories = output_root.enumerate_tree(
            EXPLICIT_DIRECTORIES, ARRAY_PATHS
        )
        repeated_staging_directories = staging_root.enumerate_tree(
            EXPLICIT_DIRECTORIES, ARRAY_PATHS
        )
        if repeated_output_directories != output_directory_identities:
            _fail("output_directory_identity_mutated_before_descriptor")
        if repeated_staging_directories != staging_directory_identities:
            _fail("staging_directory_identity_mutated_before_descriptor")
        for index, (entry, original) in enumerate(
            zip(replay["observedArrayInventory"], source_snapshots, strict=True)
        ):
            repeated = staging_root.read_file(entry["relativePath"], entry["byteLength"])
            if not _same_snapshot(original, repeated):
                _fail(f"staging_array_mutated_before_descriptor_{index}")
        manifest_root.enumerate_tree((), BASE_INPUT_PATHS)
        for relative_path, original in base_input_snapshots.items():
            repeated = manifest_root.read_file(relative_path, RUN_REQUEST_MAXIMUM_BYTES)
            if not _same_snapshot(original, repeated):
                _fail("base_input_mutated_before_descriptor")
        repeated_replay = replay_root.read_file(replay_name, REPLAY_BUNDLE_MAXIMUM_BYTES)
        repeated_receipt = receipt_root.read_file(receipt_name, ENFORCEMENT_RECEIPT_MAXIMUM_BYTES)
        if not _same_snapshot(replay_snapshot, repeated_replay):
            _fail("replay_bundle_mutated_before_descriptor")
        if not _same_snapshot(receipt_snapshot, repeated_receipt):
            _fail("verifier_receipt_mutated_before_descriptor")

        descriptor = _build_descriptor(replay)
        descriptor_raw = canonical_json_bytes(descriptor)
        if not descriptor_raw or len(descriptor_raw) > DESCRIPTOR_MAXIMUM_BYTES:
            _fail("descriptor_canonical_utf8_size_invalid")
        if parse_exact_canonical_json(
            descriptor_raw, DESCRIPTOR_MAXIMUM_BYTES, "output_descriptor"
        ) != descriptor:
            _fail("descriptor_recanonicalization_mismatch")
        descriptor_snapshot = output_root.create_file_exclusive(DESCRIPTOR_PATH, descriptor_raw)
        if (descriptor_snapshot.device_id, descriptor_snapshot.inode) in output_file_ids:
            _fail("descriptor_file_alias_invalid")
        output_root.fsync_directories(("",))
        if descriptor_snapshot.raw != descriptor_raw:
            _fail("descriptor_secure_reread_mismatch")
        final_output_directories = output_root.enumerate_tree(
            EXPLICIT_DIRECTORIES, (DESCRIPTOR_PATH,) + ARRAY_PATHS
        )
        if final_output_directories != output_directory_identities:
            _fail("output_directory_identity_mutated_after_descriptor")
        final_descriptor = output_root.read_file(DESCRIPTOR_PATH, DESCRIPTOR_MAXIMUM_BYTES)
        if not _same_snapshot(descriptor_snapshot, final_descriptor):
            _fail("descriptor_mutated_after_commit")
        for index, (entry, original) in enumerate(
            zip(replay["observedArrayInventory"], destination_snapshots, strict=True)
        ):
            final_array = output_root.read_file(entry["relativePath"], entry["byteLength"])
            if not _same_snapshot(original, final_array):
                _fail(f"final_array_mutated_after_descriptor_{index}")
            if array_digest(entry["relativePath"], entry["role"], final_array.raw) != entry["sha256"]:
                _fail(f"final_array_domain_hash_mismatch_{index}")
        return AssemblyResult(
            descriptor_byte_length=len(descriptor_raw),
            descriptor_raw_sha256=hashlib.sha256(descriptor_raw).hexdigest(),
            replay_bundle_binding=replay["_computedBinding"],
            copied_array_count=32,
        )
