"""Frozen producer-side constants for the NHM2 Newtonian 2p seed.

This module deliberately contains no admission, descriptor, proof-receipt, or
claim logic.  It is a numerical producer projection of the sealed contracts;
the independent verifier remains the only gate authority.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath
import re
from typing import Any, Mapping


SOURCE_ROOT = PurePosixPath("/opt/nhm2-producer/source/producer")
BOOTSTRAP_PATH = SOURCE_ROOT / "bootstrap.py"
TOOLCHAIN_ROOT = PurePosixPath("/opt/nhm2-producer/toolchain")
PYTHON_EXECUTABLE = TOOLCHAIN_ROOT / "python/bin/python3"
INPUT_MANIFEST_PATH = PurePosixPath("/run/input/00-seed-run-request.v1.json")
OUTPUT_ROOT = PurePosixPath("/run/staging")

EXACT_ARGV = (
    str(PYTHON_EXECUTABLE),
    "-I",
    "-S",
    "-B",
    "-X",
    "utf8",
    str(BOOTSTRAP_PATH),
    "--input-manifest",
    str(INPUT_MANIFEST_PATH),
    "--output-root",
    str(OUTPUT_ROOT),
)

EXACT_ENVIRONMENT = {
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
    "TMPDIR": str(OUTPUT_ROOT),
    "TZ": "UTC",
    "VECLIB_MAXIMUM_THREADS": "1",
}


@dataclass(frozen=True)
class GridLevel:
    level_id: str
    radial_count: int
    angular_count: int
    solved: bool


GRID_LEVELS = (
    GridLevel("L0", 64, 32, True),
    GridLevel("L1", 96, 48, True),
    GridLevel("L2", 128, 64, True),
    GridLevel("AUDIT", 256, 128, False),
)

NU_BASE = -0.5
X_TAIL = 32.0
RHO_TAIL = 32.0 / 33.0
AMPLITUDES = tuple(2.0**power for power in range(-16, -9))


@dataclass(frozen=True)
class ArraySpec:
    inventory_index: int
    level_id: str
    role_index: int
    role: str
    relative_path: str
    shape: tuple[int, ...]
    element_count: int
    byte_length: int


_ROLES = (
    ("newtonian_seed.grid.rho_nodes", "rho_nodes"),
    ("newtonian_seed.grid.theta_nodes", "theta_nodes"),
    ("newtonian_seed.base.scalar_u0", "base_scalar_u0"),
    ("newtonian_seed.base.potential_V0", "base_potential_V0"),
    ("newtonian_seed.target.scalar_u_A", "target_scalar_u_A"),
    ("newtonian_seed.target.potential_V_A", "target_potential_V_A"),
    ("newtonian_seed.multipole.scalar_odd", "multipole_scalar_odd"),
    ("newtonian_seed.multipole.potential_even", "multipole_potential_even"),
)


def _shape(role_index: int, nr: int, nt: int) -> tuple[int, ...]:
    if role_index == 0:
        return (nr,)
    if role_index == 1:
        return (nt,)
    if role_index in (4, 5):
        return (len(AMPLITUDES), nr, nt)
    if role_index in (6, 7):
        return (nr, (nt + 1) // 2)
    return (nr, nt)


def _inventory() -> tuple[ArraySpec, ...]:
    result: list[ArraySpec] = []
    for level_index, level in enumerate(GRID_LEVELS):
        for role_index, (role, stem) in enumerate(_ROLES):
            shape = _shape(role_index, level.radial_count, level.angular_count)
            count = 1
            for extent in shape:
                count *= extent
            result.append(
                ArraySpec(
                    inventory_index=level_index * len(_ROLES) + role_index,
                    level_id=level.level_id,
                    role_index=role_index,
                    role=role,
                    relative_path=(
                        f"arrays/{level.level_id}/{role_index:02d}-{stem}.f64le"
                    ),
                    shape=shape,
                    element_count=count,
                    byte_length=8 * count,
                )
            )
    return tuple(result)


OUTPUT_INVENTORY = _inventory()
OUTPUT_RELATIVE_PATHS = tuple(item.relative_path for item in OUTPUT_INVENTORY)
OUTPUT_ABSOLUTE_PATHS = tuple(str(OUTPUT_ROOT / item.relative_path) for item in OUTPUT_INVENTORY)
OUTPUT_ELEMENT_COUNT = sum(item.element_count for item in OUTPUT_INVENTORY)
OUTPUT_BYTE_LENGTH = sum(item.byte_length for item in OUTPUT_INVENTORY)

if (
    len(OUTPUT_INVENTORY) != 32
    or OUTPUT_ELEMENT_COUNT != 810_288
    or OUTPUT_BYTE_LENGTH != 6_482_304
):
    raise RuntimeError("frozen_output_inventory_invariant_failed")


def _binding(
    *,
    artifact_id: str,
    version_key: str,
    version: str,
    domain: str,
    digest: str,
    size: int,
    candidate_id: str | None = None,
) -> Mapping[str, object]:
    value: dict[str, object] = {
        "artifactId": artifact_id,
        version_key: version,
        "sha256Domain": domain,
        "sha256": digest,
        "canonicalSizeBytes": size,
    }
    if candidate_id is not None:
        # Candidate v2 freezes candidateId before sha256Domain in its singleton;
        # mapping equality is semantic, not insertion-order based.
        value["candidateId"] = candidate_id
    return value


AUTHORITATIVE_BINDINGS: Mapping[str, Mapping[str, object]] = {
    "runPlanBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed_run_plan",
        version_key="contractVersion",
        version="nhm2_prolate_boson_star_newtonian_seed_run_plan/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed-run-plan/v1\n",
        digest="3facc28fc62c9515a4c751f47ac9b6d90ab1179216d3d7c29c2a37b48e7e8f41",
        size=261_169,
    ),
    "candidatePlanV2Binding": _binding(
        artifact_id="nhm2.prolate_boson_star_coherent_candidate_plan",
        version_key="contractVersion",
        version="nhm2_prolate_boson_star_coherent_candidate_plan/v2",
        candidate_id="nhm2.semiclassical_v3.prolate_boson_star_2p_weak_field_plan/v2",
        domain="nhm2-prolate-boson-star-coherent-candidate-plan/v2\n",
        digest="945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14",
        size=134_951,
    ),
    "branchBvpV1Binding": _binding(
        artifact_id="nhm2.prolate_boson_star_branch_bvp",
        version_key="contractVersion",
        version="nhm2_prolate_boson_star_branch_bvp/v1",
        domain="nhm2-prolate-boson-star-branch-bvp/v1\n",
        digest="4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747",
        size=17_355,
    ),
    "seedContractBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed",
        version_key="contractVersion",
        version="nhm2_prolate_boson_star_newtonian_seed/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed/v1\n",
        digest="e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea",
        size=50_226,
    ),
    "proofReplayProtocolBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol",
        version_key="protocolVersion",
        version="nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed-proof-replay-protocol/v1\n",
        digest="c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b",
        size=46_365,
    ),
    "outputDescriptorSchemaBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed.output_descriptor_schema",
        version_key="schemaVersion",
        version="nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor_schema/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed-output-descriptor-schema/v1\n",
        digest="deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58",
        size=56_194,
    ),
    "verifierReplayBundleSchemaBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed.verifier_replay_bundle_schema",
        version_key="schemaVersion",
        version="nhm2.prolate_boson_star.newtonian_seed.verifier_replay_bundle_schema/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed-verifier-replay-bundle-schema/v1\n",
        digest="e9e2742d6e3fa1c2549a7bbeee0e917bba311920732078040de10e3d6995fa78",
        size=5_492,
    ),
    "controlPlaneEvidenceGrammarRegistryBinding": _binding(
        artifact_id="nhm2.prolate_boson_star_newtonian_seed.control_plane_evidence_grammar_registry",
        version_key="registryVersion",
        version="nhm2.prolate_boson_star.newtonian_seed.control_plane_evidence_grammar_registry/v1",
        domain="nhm2-prolate-boson-star-newtonian-seed-control-plane-evidence-grammar-registry/v1\n",
        digest="b048a86ef1932cc06bd2d1c829011aa1df8341621ded24e4be13c8fdc4c54c9e",
        size=120_618,
    ),
}

RUN_REQUEST_SCHEMA_VERSION = "nhm2.prolate_boson_star.newtonian_seed.run_request/v1"
RUN_REQUEST_KEYS = (
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

_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_OCI_SHA256 = re.compile(r"^sha256:[0-9a-f]{64}$")
_CONTROL_BINDING_KEYS = {
    "bindingVersion",
    "artifactKind",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
}


def _require_control_binding(name: str, value: Any) -> None:
    if not isinstance(value, dict) or set(value) != _CONTROL_BINDING_KEYS:
        raise ValueError(f"{name}: invalid control-plane binding keys")
    if value["bindingVersion"] != "nhm2.control_plane.domain_hash_binding/v1":
        raise ValueError(f"{name}: invalid bindingVersion")
    if not isinstance(value["artifactKind"], str) or not value["artifactKind"]:
        raise ValueError(f"{name}: invalid artifactKind")
    if not isinstance(value["sha256Domain"], str) or not value["sha256Domain"].endswith("\n"):
        raise ValueError(f"{name}: invalid sha256Domain")
    if not isinstance(value["sha256"], str) or _SHA256.fullmatch(value["sha256"]) is None:
        raise ValueError(f"{name}: invalid sha256")
    if type(value["canonicalSizeBytes"]) is not int or value["canonicalSizeBytes"] < 0:
        raise ValueError(f"{name}: invalid canonicalSizeBytes")


def validate_run_request(value: Any) -> Mapping[str, Any]:
    """Validate only producer-relevant, already broker-bound request structure.

    This is defense in depth, not a replacement for trusted broker schema replay.
    """

    if not isinstance(value, dict) or tuple(value.keys()) != RUN_REQUEST_KEYS:
        raise ValueError("run request keys/order differ from the frozen schema")
    if value["schemaVersion"] != RUN_REQUEST_SCHEMA_VERSION:
        raise ValueError("run request schemaVersion mismatch")
    for name, expected in AUTHORITATIVE_BINDINGS.items():
        if value[name] != expected:
            raise ValueError(f"{name}: authoritative singleton mismatch")

    oci_names = (
        "producerOciImageDigest",
        "verifierOciImageDigest",
        "assemblerOciImageDigest",
    )
    for name in oci_names:
        item = value[name]
        if not isinstance(item, str) or _OCI_SHA256.fullmatch(item) is None:
            raise ValueError(f"{name}: invalid OCI digest")

    dynamic_bindings = set(RUN_REQUEST_KEYS[9:]) - set(oci_names)
    for name in sorted(dynamic_bindings):
        _require_control_binding(name, value[name])
    return value


UNEMITTED_VERIFIER_DUTIES = (
    "no output descriptor or artifact binding",
    "no server-recomputed residual, boundary, parity, convergence, tail, scaling, or identity gate report",
    "no MPFR-256 continuous nodeless cover/receipt",
    "no MPFR-256 unique global peak and dominance cover/receipt",
    "no MPFR-256 numerical origin-series defect receipt",
    "no interval Coulomb-root uniqueness, radii-polynomial, or tail-remainder certificate",
    "no secure observation, runtime-enforcement, trusted assembly, or final-admission receipt",
    "no relativistic branch solution and no semiclassical-v3 authority",
)
