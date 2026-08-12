"""Frozen verifier-side projection of the sealed NHM2 seed contracts.

This module deliberately contains no producer or assembler imports.  These
constants are implementation inputs that must be hash-bound by the verifier
source closure before this code can ever become execution evidence.
"""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Final, Mapping

RUN_PLAN_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed_run_plan",
        "contractVersion": "nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
        "sha256": "3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
        "canonicalSizeBytes": 261169,
    }
)
CANDIDATE_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_coherent_candidate_plan",
        "contractVersion": "nhm2_prolate_boson_star_coherent_candidate_plan/v2",
        "candidateId": "nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
        "sha256Domain": "nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
        "sha256": "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
        "canonicalSizeBytes": 134951,
    }
)
BRANCH_BVP_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_branch_bvp",
        "contractVersion": "nhm2_prolate_boson_star_branch_bvp/v1",
        "sha256Domain": "nhm2-prolate-boson-star-branch-bvp/v1\n",
        "sha256": "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
        "canonicalSizeBytes": 17355,
    }
)
SEED_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed",
        "contractVersion": "nhm2_prolate_boson_star_newtonian_seed/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed/v1\n",
        "sha256": "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
        "canonicalSizeBytes": 50226,
    }
)
PROOF_PROTOCOL_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol",
        "protocolVersion": "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-proof-replay-protocol/v1\n",
        "sha256": "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b",
        "canonicalSizeBytes": 46365,
    }
)
DESCRIPTOR_SCHEMA_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed.output_descriptor_schema",
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor_schema/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-output-descriptor-schema/v1\n",
        "sha256": "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58",
        "canonicalSizeBytes": 56194,
    }
)
REPLAY_BUNDLE_SCHEMA_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle_schema",
        "schemaVersion": "nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle_schema/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle-schema/v1\n",
        "sha256": "e9e2742d6e3fa1c2549a7bbeee0e917bba311920732078040de10e3d6995fa78",
        "canonicalSizeBytes": 5492,
    }
)
EVIDENCE_REGISTRY_BINDING: Final[Mapping[str, object]] = MappingProxyType(
    {
        "artifactId": "nhm2.prolate_boson_star_newtonian_seed.control_plane_evidence_grammar_registry",
        "registryVersion": "nhm2.prolate_boson_star.newtonian_seed.control_plane_evidence_grammar_registry/v1",
        "sha256Domain": "nhm2-prolate-boson-star-newtonian-seed-control-plane-evidence-grammar-registry/v1\n",
        "sha256": "b048a86ef1932cc06bd2d1c829011aa1df8341621ded24e4be13c8fdc4c54c9e",
        "canonicalSizeBytes": 120618,
    }
)

RUN_REQUEST_EXPECTED_KEYS: Final[tuple[str, ...]] = (
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
)

STATIC_RUN_REQUEST_BINDINGS: Final[Mapping[str, Mapping[str, object]]] = (
    MappingProxyType(
        {
            "runPlanBinding": RUN_PLAN_BINDING,
            "candidatePlanV2Binding": CANDIDATE_BINDING,
            "branchBvpV1Binding": BRANCH_BVP_BINDING,
            "seedContractBinding": SEED_BINDING,
            "outputDescriptorSchemaBinding": DESCRIPTOR_SCHEMA_BINDING,
            "proofReplayProtocolBinding": PROOF_PROTOCOL_BINDING,
            "verifierReplayBundleSchemaBinding": REPLAY_BUNDLE_SCHEMA_BINDING,
            "controlPlaneEvidenceGrammarRegistryBinding": EVIDENCE_REGISTRY_BINDING,
        }
    )
)

# Exact run-request field -> registered binding-profile projection.  This is
# intentionally explicit so a digest valid for one closure class cannot be
# swapped into another field.
DYNAMIC_RUN_REQUEST_BINDING_PROFILES: Final[
    Mapping[str, tuple[str, str]]
] = MappingProxyType(
    {
        "isolatedWorkerCapabilityBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.isolated_worker_capability",
            "nhm2-prolate-boson-star-newtonian-seed-isolated-worker-capability/v1\n",
        ),
        "schedulerLeaseBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.scheduler_lease",
            "nhm2-prolate-boson-star-newtonian-seed-scheduler-lease/v1\n",
        ),
        "producerSourceManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-manifest/v1\n",
        ),
        "producerSourceLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_source_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-producer-source-closure-ledger/v1\n",
        ),
        "producerToolchainManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-manifest/v1\n",
        ),
        "producerToolchainLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_toolchain_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-producer-toolchain-closure-ledger/v1\n",
        ),
        "producerSeccompPolicyBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_seccomp_policy",
            "nhm2-prolate-boson-star-newtonian-seed-producer-seccomp-policy/v1\n",
        ),
        "producerQuotaCapabilityBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.producer_quota_capability",
            "nhm2-prolate-boson-star-newtonian-seed-producer-quota-capability/v1\n",
        ),
        "verifierSourceManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-manifest/v1\n",
        ),
        "verifierSourceLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_source_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-source-closure-ledger/v1\n",
        ),
        "verifierToolchainManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-manifest/v1\n",
        ),
        "verifierToolchainLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_toolchain_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-toolchain-closure-ledger/v1\n",
        ),
        "verifierSeccompPolicyBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_seccomp_policy",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-seccomp-policy/v1\n",
        ),
        "verifierQuotaCapabilityBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_quota_capability",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-quota-capability/v1\n",
        ),
        "assemblerSourceManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-manifest/v1\n",
        ),
        "assemblerSourceLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_source_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-source-closure-ledger/v1\n",
        ),
        "assemblerToolchainManifestBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_manifest",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-manifest/v1\n",
        ),
        "assemblerToolchainLedgerBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_toolchain_closure_ledger",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-toolchain-closure-ledger/v1\n",
        ),
        "assemblerSeccompPolicyBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_seccomp_policy",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-seccomp-policy/v1\n",
        ),
        "assemblerQuotaCapabilityBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.assembler_quota_capability",
            "nhm2-prolate-boson-star-newtonian-seed-assembler-quota-capability/v1\n",
        ),
        "crossStageSeparationReceiptBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.cross_stage_separation_receipt",
            "nhm2-prolate-boson-star-newtonian-seed-cross-stage-separation-receipt/v1\n",
        ),
        "verifierProofKernelBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_proof_kernel",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-proof-kernel/v1\n",
        ),
        "verifierMpfrGmpRuntimeBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.verifier_mpfr_gmp_runtime",
            "nhm2-prolate-boson-star-newtonian-seed-verifier-mpfr-gmp-runtime/v1\n",
        ),
        "stageInputLedgerConstructionPolicyBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.stage_input_ledger_construction_policy",
            "nhm2-prolate-boson-star-newtonian-seed-stage-input-ledger-construction-policy/v1\n",
        ),
        "exactOutputInventoryBinding": (
            "nhm2.prolate_boson_star_newtonian_seed.exact_output_inventory",
            "nhm2-prolate-boson-star-newtonian-seed-exact-output-inventory/v1\n",
        ),
    }
)
DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES: Final[Mapping[str, int]] = (
    MappingProxyType(
        {
            **{
                field: 67_108_864
                for field in (
                    "producerSourceManifestBinding",
                    "producerSourceLedgerBinding",
                    "producerToolchainManifestBinding",
                    "producerToolchainLedgerBinding",
                    "verifierSourceManifestBinding",
                    "verifierSourceLedgerBinding",
                    "verifierToolchainManifestBinding",
                    "verifierToolchainLedgerBinding",
                    "assemblerSourceManifestBinding",
                    "assemblerSourceLedgerBinding",
                    "assemblerToolchainManifestBinding",
                    "assemblerToolchainLedgerBinding",
                )
            },
            **{
                field: 262_144
                for field in (
                    "schedulerLeaseBinding",
                    "producerQuotaCapabilityBinding",
                    "verifierQuotaCapabilityBinding",
                    "assemblerQuotaCapabilityBinding",
                )
            },
            **{
                field: 1_048_576
                for field in DYNAMIC_RUN_REQUEST_BINDING_PROFILES
                if field
                not in {
                    "schedulerLeaseBinding",
                    "producerQuotaCapabilityBinding",
                    "verifierQuotaCapabilityBinding",
                    "assemblerQuotaCapabilityBinding",
                    "producerSourceManifestBinding",
                    "producerSourceLedgerBinding",
                    "producerToolchainManifestBinding",
                    "producerToolchainLedgerBinding",
                    "verifierSourceManifestBinding",
                    "verifierSourceLedgerBinding",
                    "verifierToolchainManifestBinding",
                    "verifierToolchainLedgerBinding",
                    "assemblerSourceManifestBinding",
                    "assemblerSourceLedgerBinding",
                    "assemblerToolchainManifestBinding",
                    "assemblerToolchainLedgerBinding",
                }
            },
        }
    )
)

LEVELS: Final[tuple[tuple[str, int, int], ...]] = (
    ("L0", 64, 32),
    ("L1", 96, 48),
    ("L2", 128, 64),
    ("AUDIT", 256, 128),
)
ROLES: Final[tuple[str, ...]] = (
    "newtonian_seed.grid.rho_nodes",
    "newtonian_seed.grid.theta_nodes",
    "newtonian_seed.base.scalar_u0",
    "newtonian_seed.base.potential_V0",
    "newtonian_seed.target.scalar_u_A",
    "newtonian_seed.target.potential_V_A",
    "newtonian_seed.multipole.scalar_odd",
    "newtonian_seed.multipole.potential_even",
)
ROLE_STEMS: Final[tuple[str, ...]] = (
    "rho_nodes",
    "theta_nodes",
    "base_scalar_u0",
    "base_potential_V0",
    "target_scalar_u_A",
    "target_potential_V_A",
    "multipole_scalar_odd",
    "multipole_potential_even",
)


@dataclass(frozen=True, slots=True)
class ArraySpec:
    inventory_index: int
    level_index: int
    role_index: int
    level_id: str
    role: str
    relative_path: str
    shape: tuple[int, ...]
    element_count: int
    byte_length: int
    dtype: str = "float64_le"
    order: str = "C_row_major"


def _shape(role_index: int, nr: int, ntheta: int) -> tuple[int, ...]:
    if role_index == 0:
        return (nr,)
    if role_index == 1:
        return (ntheta,)
    if role_index in (4, 5):
        return (7, nr, ntheta)
    if role_index in (6, 7):
        return (nr, (ntheta + 1) // 2)
    return (nr, ntheta)


def _inventory() -> tuple[ArraySpec, ...]:
    entries: list[ArraySpec] = []
    for level_index, (level_id, nr, ntheta) in enumerate(LEVELS):
        for role_index, role in enumerate(ROLES):
            shape = _shape(role_index, nr, ntheta)
            count = 1
            for extent in shape:
                count *= extent
            entries.append(
                ArraySpec(
                    inventory_index=level_index * len(ROLES) + role_index,
                    level_index=level_index,
                    role_index=role_index,
                    level_id=level_id,
                    role=role,
                    relative_path=(
                        f"arrays/{level_id}/{role_index:02d}-{ROLE_STEMS[role_index]}.f64le"
                    ),
                    shape=shape,
                    element_count=count,
                    byte_length=count * 8,
                )
            )
    return tuple(entries)


ARRAY_INVENTORY: Final[tuple[ArraySpec, ...]] = _inventory()
ARRAY_SHA256_DOMAIN: Final[bytes] = (
    b"nhm2.prolate_boson_star.newtonian_2p_seed.array.sha256.v1\n"
)
TOTAL_ARRAY_BYTES: Final[int] = sum(item.byte_length for item in ARRAY_INVENTORY)
TOTAL_ARRAY_ELEMENTS: Final[int] = sum(
    item.element_count for item in ARRAY_INVENTORY
)

if (
    len(ARRAY_INVENTORY) != 32
    or TOTAL_ARRAY_BYTES != 6_482_304
    or TOTAL_ARRAY_ELEMENTS != 810_288
):
    raise RuntimeError("frozen_array_inventory_drift")

RUN_REQUEST_PATH: Final[str] = "/run/input/00-seed-run-request.v1.json"
STAGING_ROOT: Final[str] = "/run/staging"
REPLAY_BUNDLE_PATH: Final[str] = (
    "/run/replay/seed-verifier-replay-bundle.canonical.json"
)
BOOTSTRAP_PATH: Final[str] = (
    "/opt/nhm2-verifier/source/verifier/bootstrap.py"
)
SOURCE_ROOT: Final[str] = "/opt/nhm2-verifier/source"
PYTHON_STDLIB_ROOT: Final[str] = (
    "/opt/nhm2-verifier/toolchain/python/lib/python3.13"
)
PYTHON_DYNLOAD_ROOT: Final[str] = (
    "/opt/nhm2-verifier/toolchain/python/lib/python3.13/lib-dynload"
)
GMP_LIBRARY_PATH: Final[str] = (
    "/opt/nhm2-verifier/toolchain/lib/libgmp.so.10"
)
MPFR_LIBRARY_PATH: Final[str] = (
    "/opt/nhm2-verifier/toolchain/lib/libmpfr.so.6"
)
VERIFIER_ENVIRONMENT: Final[Mapping[str, str]] = MappingProxyType(
    {
        "BLIS_NUM_THREADS": "1",
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "MKL_DYNAMIC": "FALSE",
        "MKL_NUM_THREADS": "1",
        "NUMEXPR_NUM_THREADS": "1",
        "OMP_DYNAMIC": "FALSE",
        "OMP_NUM_THREADS": "1",
        "OMP_THREAD_LIMIT": "1",
        "OPENBLAS_NUM_THREADS": "1",
        "TMPDIR": "/run/replay",
        "TZ": "UTC",
        "VECLIB_MAXIMUM_THREADS": "1",
    }
)

AMPLITUDES: Final[tuple[float, ...]] = tuple(2.0 ** exponent for exponent in range(-16, -9))
RHO_TAIL: Final[float] = 32.0 / 33.0
NU0: Final[float] = -0.5

THRESHOLDS: Final[Mapping[str, float]] = MappingProxyType(
    {
        "production_schrodinger_linf": 1.0e-10,
        "production_poisson_linf": 1.0e-10,
        "audit_schrodinger_linf": 1.0e-10,
        "audit_poisson_linf": 1.0e-10,
        "boundary_parity_linf": 1.0e-12,
        "target_amplitude_absolute": 2.0**-30,
        "l1_l2_field_relative": 1.0e-8,
        "difference_ratio": 4.0,
        "l1_l2_interior_observable_relative": 1.0e-9,
        "identity_relative": 1.0e-9,
        "radial_spectral_tail_relative": 1.0e-10,
        "angular_spectral_tail_relative": 1.0e-10,
        "target_scaling_relative": 1.0e-12,
    }
)

REPLAY_BUNDLE_MAXIMUM_BYTES: Final[int] = 16 * 1024 * 1024
RUN_REQUEST_BINDING_VERSION: Final[str] = (
    "nhm2.control_plane.domain_hash_binding/v1"
)
RUN_REQUEST_ARTIFACT_KIND: Final[str] = (
    "nhm2.prolate_boson_star_newtonian_seed.run_request"
)
RUN_REQUEST_SHA256_DOMAIN: Final[bytes] = (
    b"nhm2-prolate-boson-star-newtonian-seed-run-request/v1\n"
)

AUTHORITY_LOCKS: Final[Mapping[str, bool]] = MappingProxyType(
    {
        "bundleEmitted": False,
        "artifactAccepted": False,
        "seedAccepted": False,
        "branchSolved": False,
        "candidateAdmissible": False,
        "physicalViabilityEstablished": False,
        "propulsionClaimAllowed": False,
        "transportClaimAllowed": False,
    }
)
