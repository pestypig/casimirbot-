"""Server publication boundary for the five spherical-seed primary operands.

The frozen interchange describes a Linux, directory-fd-owned, no-overwrite
publication protocol.  This module implements that protocol and the exact
descriptor/receipt hash graph, but it deliberately does *not* invent the
missing server-to-process authentication handoff.  ``publish_primary_operands``
therefore fails before inspecting either caller object.  The adjacent test
module injects an in-memory syscall/context harness directly into the internal
protocol helpers; this production module exposes no positive test publisher or
test issuer that could be paired with the native Linux adapter.

The future production handoff must be one of the following server-owned
boundaries before this entry point can be activated:

* an inherited, sealed, read-only file descriptor containing the canonical
  context plus an outer-controller nonce and exact preseal binding; or
* a canonical context and preseal signed by a separately pinned server key,
  with replay protection and the output/failure directory descriptors passed
  out of band.

Neither a private Python constructor nor possession of operand bytes is server
authentication.  Structural publication grants no solve, proof, replay, lamp,
candidate, Theory Graph, or physical authority.
"""

from __future__ import annotations

import ctypes
from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
import json
import os
import platform
import re
import stat
import struct
import sys
import time
from types import MappingProxyType
from typing import ClassVar, Final
import unicodedata


PUBLISHER_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_seed_primary_operand_publisher/v1"
)
SERVER_PUBLICATION_CONTEXT_ISSUER_PRESENT: Final[bool] = False
PRODUCTION_PUBLICATION_ENABLED: Final[bool] = False
CANDIDATE_ID: Final[str] = (
    "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1"
)
CANDIDATE_PLAN_SHA256: Final[str] = (
    "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d"
)
TOLERANCE_POLICY_SHA256: Final[str] = (
    "867d96458940149f386d7153dff06c95ae336af222f5f42d8903fb18a728448d"
)
BRANCH_BVP_SHA256: Final[str] = (
    "ce00d2b6048d8c22e6dedd4526a8548373916525ef9adb75fcea48e67dc7e557"
)

SEMANTIC_SEED_SHA256: Final[str] = (
    "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c"
)
OPERATION_PREPOLICY_SHA256: Final[str] = (
    "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24"
)
PRIMARY_NUMERICS_POLICY_SHA256: Final[str] = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
DIRECTED_PROOF_ARCHITECTURE_SHA256: Final[str] = (
    "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99"
)
DIRECTED_PROOF_OPERATOR_SHA256: Final[str] = (
    "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b"
)
INTERCHANGE_POLICY_SHA256: Final[str] = (
    "827eb79c27137dd1649b35884c945c2d6809483acf25c7fd68d2a3ed80936f95"
)

SEMANTIC_SEED_CANONICAL_SIZE_BYTES: Final[int] = 18_894
OPERATION_PREPOLICY_CANONICAL_SIZE_BYTES: Final[int] = 32_308
PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 80_055
DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES: Final[int] = 42_778
DIRECTED_PROOF_OPERATOR_CANONICAL_SIZE_BYTES: Final[int] = 34_695
INTERCHANGE_POLICY_CANONICAL_SIZE_BYTES: Final[int] = 67_853

DESCRIPTOR_SCHEMA_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_descriptor/v1"
)
RECEIPT_SCHEMA_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_receipt/v1"
)
FAILURE_RECEIPT_SCHEMA_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_newtonian_seed_failure_receipt/v1"
)

DESCRIPTOR_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/descriptor/v1\n"
)
PAYLOAD_BINDING_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/primary-payload/v1\n"
)
INPUT_BINDING_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-directed-proof/input-binding/v1\n"
)
OUTPUT_ROOT_IDENTITY_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/output-root/v1\n"
)

SCALAR_ORDER: Final[tuple[str, ...]] = (
    "nu0",
    "Vc",
    "N0",
    "C",
    "kappa",
    "sigma",
    "lambda",
    "nu_star",
    "wSeed",
)
PAYLOAD_SPECS: Final[tuple[tuple[str, str, int, int], ...]] = (
    ("scalars.f64le", "primary_scalar_operands", 9, 72),
    (
        "coefficients/core_L2_u.f64le",
        "primary_L2_scalar_Chebyshev_coefficients",
        128,
        1_024,
    ),
    (
        "coefficients/core_L2_V.f64le",
        "primary_L2_potential_Chebyshev_coefficients",
        128,
        1_024,
    ),
    (
        "coefficients/tail_H.f64le",
        "primary_tail_H_Chebyshev_coefficients",
        32,
        256,
    ),
    (
        "coefficients/tail_Q.f64le",
        "primary_tail_Q_Chebyshev_coefficients",
        32,
        256,
    ),
)
WRITE_ORDER: Final[tuple[str, ...]] = (
    "scalars.f64le",
    "coefficients/core_L2_u.f64le",
    "coefficients/core_L2_V.f64le",
    "coefficients/tail_H.f64le",
    "coefficients/tail_Q.f64le",
    "descriptor.json",
    "receipt.json",
)
CANONICAL_INVENTORY_ORDER: Final[tuple[str, ...]] = (
    "descriptor.json",
    "scalars.f64le",
    "coefficients/core_L2_u.f64le",
    "coefficients/core_L2_V.f64le",
    "coefficients/tail_H.f64le",
    "coefficients/tail_Q.f64le",
    "receipt.json",
)
TOTAL_PAYLOAD_BYTES: Final[int] = 2_632
TOTAL_PAYLOAD_ELEMENTS: Final[int] = 329
MAXIMUM_DESCRIPTOR_BYTES: Final[int] = 1_048_576
MAXIMUM_RECEIPT_BYTES: Final[int] = 1_048_576
MAXIMUM_FAILURE_RECEIPT_BYTES: Final[int] = 262_144
MAXIMUM_ARGV_ENTRIES: Final[int] = 256
MAXIMUM_FRESHNESS_ENTRIES: Final[int] = 8_192
MAXIMUM_STRING_UTF8_BYTES: Final[int] = 65_536
MAXIMUM_PATH_UTF8_BYTES: Final[int] = 4_096
MAXIMUM_FINAL_ROOT_LEAF_UTF8_BYTES: Final[int] = 217

PUBLICATION_BLOCKERS: Final[tuple[str, ...]] = (
    "server_publication_context_issuer_absent",
    "fixed_native_mpfr_65536_arena_not_implemented",
    "fixed_float64_262144_arena_not_implemented",
    "fixed_uint32_257_arena_not_implemented",
    "hash_bound_runtime_closure_instance_absent",
    "authenticated_preexecution_preseal_instance_absent",
    "command_argv_hash_recipe_not_closed",
    "integrated_seed_solve_acceptance_absent",
    "directed_proof_acceptance_absent",
)
REQUIRED_SERVER_CONTEXT_HANDOFF: Final[tuple[str, ...]] = (
    "inherited_sealed_read_only_context_fd_plus_outer_controller_nonce_and_preseal_binding",
    "or_canonical_context_and_preseal_signed_by_a_pinned_server_key_with_replay_protection_and_out_of_band_directory_fds",
)

AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "implementationClosureComplete": False,
        "fixedNativeArenaRuntimeComplete": False,
        "runtimeClosureComplete": False,
        "authenticatedPreexecutionPresealPresent": False,
        "integratedSolveAccepted": False,
        "directedProofAccepted": False,
        "executionAuthorized": False,
        "candidateAccepted": False,
        "seedAccepted": False,
        "branchAccepted": False,
        "replayAuthority": False,
        "independentAgreement": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "theoryGraphAuthority": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

_HEX32 = re.compile(r"^[0-9a-f]{32}$")
_HEX40 = re.compile(r"^[0-9a-f]{40}$")
_HEX64 = re.compile(r"^[0-9a-f]{64}$")
_COUNTER = re.compile(r"^(?:0|[1-9][0-9]{0,38})$")
_UTC = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{9}Z$"
)
_MEDIA_TYPE = re.compile(
    r"^[!#$%&'*+.^_`|~0-9A-Za-z-]+/[!#$%&'*+.^_`|~0-9A-Za-z-]+$"
)
_FORBIDDEN_ROLE_TOKENS: Final[frozenset[str]] = frozenset(
    {
        "declared_lever_tensor",
        "declaredlevertensor",
        "lever",
        "lever_tensor",
        "levertensor",
        "lever_tensor_role",
        "declared_tile_tensor",
        "declaredtiletensor",
        "tile",
        "tiles",
        "tile_id",
        "tileid",
        "tile_role",
        "tilerole",
        "tile_tensor",
        "tiletensor",
        "tile_weight",
        "tileweight",
        "tile_gain",
        "tilegain",
        "tile_schedule",
        "tileschedule",
        "warp_control_tensor",
        "external_source_tensor",
    }
)


class PrimaryOperandPublisherError(RuntimeError):
    """Typed fail-closed publisher rejection."""

    def __init__(
        self,
        code: str,
        detail: str = "root",
        *,
        failure_publication: "FrozenFailurePublication | None" = None,
    ) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail
        self.failure_publication = failure_publication


@dataclass(frozen=True, slots=True)
class FrozenPayloadPublicationBinding:
    path: str
    semantic_role: str
    element_count: int
    size_bytes: int
    raw_sha256: str
    payload_sha256: str


@dataclass(frozen=True, slots=True)
class FrozenPrimaryOperandPublication:
    final_root: str
    descriptor_plain_sha256: str
    descriptor_sha256: str
    input_binding_sha256: str
    payload_bindings: tuple[FrozenPayloadPublicationBinding, ...]
    descriptor_size_bytes: int
    receipt_plain_sha256: str
    receipt_size_bytes: int
    publisher_version: str
    blockers: tuple[str, ...]
    publication_mode: str
    atomic_publication_observed: ClassVar[bool] = False
    structural_protocol_test_completed: ClassVar[bool] = True
    production_publication_observed: ClassVar[bool] = False
    receipt_authority_false: ClassVar[bool] = True
    publication_receipt_authoritative: ClassVar[bool] = False
    provenance_authoritative: ClassVar[bool] = False
    implementation_closure_complete: ClassVar[bool] = False
    runtime_closure_complete: ClassVar[bool] = False
    authenticated_preseal_present: ClassVar[bool] = False
    integrated_solve_accepted: ClassVar[bool] = False
    directed_proof_accepted: ClassVar[bool] = False
    candidate_accepted: ClassVar[bool] = False
    replay_authority: ClassVar[bool] = False
    independent_agreement: ClassVar[bool] = False
    semiclassical_stress_noise_lamp: ClassVar[bool] = False
    semiclassical_constraint_algebra_lamp: ClassVar[bool] = False
    diagnostic_pass_authority: ClassVar[bool] = False
    physical_viability: ClassVar[bool] = False
    propulsion: ClassVar[bool] = False
    transport: ClassVar[bool] = False


@dataclass(frozen=True, slots=True)
class FrozenFailurePublication:
    failure_root: str
    failure_stage: str
    failure_code: str
    receipt_plain_sha256: str
    receipt_size_bytes: int
    primary_input_binding_sha256: str | None
    publication_mode: str
    atomic_publication_observed: ClassVar[bool] = False
    structural_protocol_test_completed: ClassVar[bool] = True
    production_failure_publication_observed: ClassVar[bool] = False
    authority_false: ClassVar[bool] = True
    failure_receipt_authoritative: ClassVar[bool] = False
    candidate_accepted: ClassVar[bool] = False
    retry_allowed: ClassVar[bool] = False
    retune_allowed: ClassVar[bool] = False
    physical_viability: ClassVar[bool] = False
    propulsion: ClassVar[bool] = False
    transport: ClassVar[bool] = False


@dataclass(frozen=True, slots=True)
class _RawBinding:
    media_type: str
    path: str
    sha256: str
    size_bytes: int


@dataclass(frozen=True, slots=True)
class _FileStat:
    change_time_nanoseconds: str
    device: str
    inode: str
    mode_octal: str
    modify_time_nanoseconds: str
    sha256: str
    size_bytes: int


@dataclass(frozen=True, slots=True)
class _FreshnessObservation:
    path: str
    preopen: _FileStat
    postread: _FileStat


class _FrozenPrimaryOperands:
    __slots__ = (
        "scalar_buffers_f64le",
        "core_l2_u_f64le",
        "core_l2_v_f64le",
        "tail_h_f64le",
        "tail_q_f64le",
    )

    def __init__(self, sentinel: object, values: tuple[object, ...]) -> None:
        if sentinel is not _TEST_CONSTRUCTION_SENTINEL:
            raise PrimaryOperandPublisherError("test_operand_constructor_forbidden")
        (
            self.scalar_buffers_f64le,
            self.core_l2_u_f64le,
            self.core_l2_v_f64le,
            self.tail_h_f64le,
            self.tail_q_f64le,
        ) = values


class _AuthenticatedPublicationContext:
    __slots__ = (
        "attempt_ordinal",
        "candidate_id",
        "candidate_plan_sha256",
        "tolerance_policy_sha256",
        "branch_bvp_sha256",
        "semantic_seed_sha256",
        "operation_prepolicy_sha256",
        "primary_numerics_policy_sha256",
        "directed_proof_architecture_sha256",
        "directed_proof_operator_sha256",
        "interchange_policy_sha256",
        "expected_raw_payload_sha256",
        "expected_input_binding_sha256",
        "command_argv_sha256",
        "static_input_aggregate_sha256",
        "commit40",
        "command_argv",
        "dirty_tree_digest_sha256",
        "source_manifest_binding",
        "toolchain_manifest_binding",
        "executable_binding",
        "runtime_manifest_binding",
        "preexecution_preseal_binding",
        "freshness_observations",
        "monotonic_start_nanoseconds",
        "monotonic_end_nanoseconds",
        "monotonic_elapsed_nanoseconds",
        "wall_start_utc",
        "wall_end_utc",
        "publication_prepared_wall_utc",
        "final_root",
        "failure_root",
        "output_root_identity_sha256",
        "failure_root_identity_sha256",
        "context_hmac_sha256",
    )

    def __init__(self, sentinel: object, values: dict[str, object]) -> None:
        if sentinel is not _TEST_CONSTRUCTION_SENTINEL:
            raise PrimaryOperandPublisherError("publication_context_constructor_forbidden")
        for slot in self.__slots__:
            setattr(self, slot, values[slot])


_TEST_CONSTRUCTION_SENTINEL: Final[object] = object()


def _u64le(value: int) -> bytes:
    if type(value) is not int or value < 0 or value >= 1 << 64:
        raise PrimaryOperandPublisherError("safe_nonnegative_integer_invalid", "u64")
    return struct.pack("<Q", value)


def _hash_bytes(raw: bytes) -> str:
    if type(raw) is not bytes:
        raise PrimaryOperandPublisherError("byte_buffer_type_invalid")
    return sha256(raw).hexdigest()


def _require_hash(value: object, detail: str) -> str:
    if type(value) is not str or _HEX64.fullmatch(value) is None:
        raise PrimaryOperandPublisherError("sha256_invalid", detail)
    return value


def _require_counter(value: object, detail: str) -> str:
    if type(value) is not str or _COUNTER.fullmatch(value) is None:
        raise PrimaryOperandPublisherError("decimal_counter_invalid", detail)
    return value


def _string_bytes(
    value: object, detail: str, maximum: int = MAXIMUM_STRING_UTF8_BYTES
) -> bytes:
    if type(value) is not str or "\x00" in value:
        raise PrimaryOperandPublisherError("utf8_string_invalid", detail)
    try:
        raw = value.encode("utf-8", "strict")
    except UnicodeEncodeError as error:
        raise PrimaryOperandPublisherError("utf8_string_invalid", detail) from error
    if not raw or len(raw) > maximum:
        raise PrimaryOperandPublisherError("utf8_string_size_invalid", detail)
    return raw


def _relative_path(value: object, detail: str) -> str:
    raw = _string_bytes(value, detail, MAXIMUM_PATH_UTF8_BYTES)
    assert type(value) is str
    segments = value.split("/")
    if (
        unicodedata.normalize("NFC", value) != value
        or value.startswith("/")
        or value.endswith("/")
        or "\\" in value
        or (len(segments[0]) >= 2 and segments[0][0].isalpha() and segments[0][1] == ":")
        or any(
            segment in ("", ".", "..")
            or len(segment.encode("utf-8", "strict")) > 255
            for segment in segments
        )
        or len(raw) > MAXIMUM_PATH_UTF8_BYTES
    ):
        raise PrimaryOperandPublisherError("relative_path_invalid", detail)
    return value


def _absolute_posix_root(value: object, detail: str) -> str:
    raw = _string_bytes(value, detail, MAXIMUM_PATH_UTF8_BYTES)
    assert type(value) is str
    segments = value.split("/")
    if (
        unicodedata.normalize("NFC", value) != value
        or not value.startswith("/")
        or value == "/"
        or value.endswith("/")
        or "\\" in value
        or any(
            segment in ("", ".", "..")
            or len(segment.encode("utf-8", "strict")) > 255
            for segment in segments[1:]
        )
        or len(segments[-1].encode("utf-8", "strict"))
        > MAXIMUM_FINAL_ROOT_LEAF_UTF8_BYTES
        or len(raw) > MAXIMUM_PATH_UTF8_BYTES
    ):
        raise PrimaryOperandPublisherError("absolute_output_root_invalid", detail)
    return value


def _identifier_segments(value: str) -> tuple[str, ...]:
    normalized = unicodedata.normalize("NFKC", value)
    normalized = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", normalized).lower()
    return tuple(segment for segment in re.split(r"[^a-z0-9]+", normalized) if segment)


def _reject_forbidden_role(value: str, detail: str) -> None:
    normalized = unicodedata.normalize("NFKC", value).lower()
    segments = _identifier_segments(value)
    identifiers = tuple(
        identifier
        for identifier in re.split(r"[/.]+", normalized)
        if identifier
    )
    if (
        any(identifier in _FORBIDDEN_ROLE_TOKENS for identifier in identifiers)
        or "lever" in segments
        or "tile" in segments
        or "tiles" in segments
    ):
        raise PrimaryOperandPublisherError("forbidden_lever_or_tile_role", detail)


def _timestamp_key(value: object, detail: str) -> tuple[int, ...]:
    if type(value) is not str or _UTC.fullmatch(value) is None:
        raise PrimaryOperandPublisherError("utc_timestamp_invalid", detail)
    try:
        instant = datetime(
            int(value[0:4]),
            int(value[5:7]),
            int(value[8:10]),
            int(value[11:13]),
            int(value[14:16]),
            int(value[17:19]),
            tzinfo=timezone.utc,
        )
    except ValueError as error:
        raise PrimaryOperandPublisherError("utc_timestamp_invalid", detail) from error
    return (
        instant.year,
        instant.month,
        instant.day,
        instant.hour,
        instant.minute,
        instant.second,
        int(value[20:29]),
    )


def _canonical_json(value: object) -> bytes:
    def encode(item: object) -> bytes:
        if item is None:
            return b"null"
        if type(item) is bool:
            return b"true" if item else b"false"
        if type(item) is int:
            if item < 0 or item > (1 << 53) - 1:
                raise PrimaryOperandPublisherError("canonical_json_integer_invalid")
            return str(item).encode("ascii")
        if type(item) is str:
            _string_bytes(item, "canonical_json_string")
            return json.dumps(
                item, ensure_ascii=False, allow_nan=False, separators=(",", ":")
            ).encode("utf-8", "strict")
        if type(item) is list or type(item) is tuple:
            return b"[" + b",".join(encode(entry) for entry in item) + b"]"
        if type(item) is dict:
            if any(type(key) is not str for key in item):
                raise PrimaryOperandPublisherError("canonical_json_key_invalid")
            keys = sorted(item, key=lambda key: key.encode("utf-16-be", "strict"))
            return b"{" + b",".join(encode(key) + b":" + encode(item[key]) for key in keys) + b"}"
        raise PrimaryOperandPublisherError(
            "canonical_json_type_invalid", type(item).__name__
        )

    return encode(value)


def _policy_binding(
    artifact_id: str,
    canonical_size_bytes: int,
    policy_version: str,
    digest: str,
    domain: str,
) -> dict[str, object]:
    return {
        "artifactId": artifact_id,
        "canonicalSizeBytes": canonical_size_bytes,
        "policyVersion": policy_version,
        "sha256": digest,
        "sha256Domain": domain,
    }


def _policy_bindings() -> dict[str, object]:
    return {
        "directedProofArchitecture": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed_directed_proof",
            DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed_directed_proof/v1",
            DIRECTED_PROOF_ARCHITECTURE_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed-directed-proof/v1\n",
        ),
        "directedProofOperator": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed_directed_proof_operator",
            DIRECTED_PROOF_OPERATOR_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed_directed_proof_operator/v1",
            DIRECTED_PROOF_OPERATOR_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator/v1\n",
        ),
        "interchangePolicy": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed_interchange",
            INTERCHANGE_POLICY_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed_interchange/v1",
            INTERCHANGE_POLICY_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed-interchange/v1\n",
        ),
        "operationPrepolicy": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed_operation_policy",
            OPERATION_PREPOLICY_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed_operation_policy/v1",
            OPERATION_PREPOLICY_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed-operation-policy/v1\n",
        ),
        "primaryNumericsPolicy": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed_primary_numerics",
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed_primary_numerics/v1",
            PRIMARY_NUMERICS_POLICY_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n",
        ),
        "semanticSeed": _policy_binding(
            "nhm2.spherical_boson_star_newtonian_seed",
            SEMANTIC_SEED_CANONICAL_SIZE_BYTES,
            "nhm2_spherical_boson_star_newtonian_seed/v1",
            SEMANTIC_SEED_SHA256,
            "nhm2-spherical-boson-star-newtonian-seed/v1\n",
        ),
    }


def _raw_binding_json(value: _RawBinding) -> dict[str, object]:
    return {
        "mediaType": value.media_type,
        "path": value.path,
        "sha256": value.sha256,
        "sizeBytes": value.size_bytes,
    }


def _file_stat_json(value: _FileStat) -> dict[str, object]:
    return {
        "changeTimeNanoseconds": value.change_time_nanoseconds,
        "device": value.device,
        "inode": value.inode,
        "modeOctal": value.mode_octal,
        "modifyTimeNanoseconds": value.modify_time_nanoseconds,
        "sha256": value.sha256,
        "sizeBytes": value.size_bytes,
    }


def _freshness_json(value: _FreshnessObservation) -> dict[str, object]:
    return {
        "path": value.path,
        "postread": _file_stat_json(value.postread),
        "preopen": _file_stat_json(value.preopen),
        "stable": True,
    }


def _output_root_identity_sha256(root: str) -> str:
    raw = _string_bytes(root, "output_root", MAXIMUM_PATH_UTF8_BYTES)
    return sha256(OUTPUT_ROOT_IDENTITY_DOMAIN + _u64le(len(raw)) + raw).hexdigest()


def _payload_binding_sha256(path: str, size_bytes: int, raw_sha256: str) -> str:
    path_raw = _relative_path(path, "payload_path").encode("utf-8", "strict")
    return sha256(
        PAYLOAD_BINDING_DOMAIN
        + _u64le(len(path_raw))
        + path_raw
        + _u64le(size_bytes)
        + bytes.fromhex(_require_hash(raw_sha256, "payload_raw_sha256"))
    ).hexdigest()


def _descriptor_sha256(raw: bytes) -> str:
    if type(raw) is not bytes or not 0 < len(raw) <= MAXIMUM_DESCRIPTOR_BYTES:
        raise PrimaryOperandPublisherError("descriptor_size_invalid")
    return sha256(DESCRIPTOR_HASH_DOMAIN + _u64le(len(raw)) + raw).hexdigest()


def _input_binding_sha256(
    descriptor_sha256: str,
    payloads: tuple[FrozenPayloadPublicationBinding, ...],
) -> str:
    digest = sha256()
    digest.update(INPUT_BINDING_DOMAIN)
    digest.update(bytes.fromhex(_require_hash(descriptor_sha256, "descriptor_sha256")))
    if type(payloads) is not tuple or len(payloads) != len(PAYLOAD_SPECS):
        raise PrimaryOperandPublisherError("payload_inventory_invalid")
    for payload, spec in zip(payloads, PAYLOAD_SPECS, strict=True):
        path, _role, _count, size = spec
        if type(payload) is not FrozenPayloadPublicationBinding:
            raise PrimaryOperandPublisherError("payload_binding_type_invalid")
        if payload.path != path or payload.size_bytes != size:
            raise PrimaryOperandPublisherError("payload_inventory_invalid", path)
        path_raw = path.encode("utf-8", "strict")
        digest.update(_u64le(len(path_raw)))
        digest.update(path_raw)
        digest.update(_u64le(size))
        digest.update(bytes.fromhex(payload.raw_sha256))
    return digest.hexdigest()


def _snapshot_operand_payloads(
    value: object,
) -> tuple[tuple[str, bytes], ...]:
    if type(value) is not _FrozenPrimaryOperands:
        raise PrimaryOperandPublisherError("numeric_payload_hash_or_shape_mismatch", "type")
    scalars = value.scalar_buffers_f64le
    if type(scalars) is not tuple or len(scalars) != 9:
        raise PrimaryOperandPublisherError(
            "numeric_payload_hash_or_shape_mismatch", "scalars"
        )
    if any(type(item) is not bytes or len(item) != 8 for item in scalars):
        raise PrimaryOperandPublisherError(
            "numeric_payload_hash_or_shape_mismatch", "scalar_buffers"
        )
    if len({id(item) for item in scalars}) != 9:
        raise PrimaryOperandPublisherError(
            "numeric_payload_hash_or_shape_mismatch", "scalar_buffer_alias"
        )
    raw_values = (
        b"".join(scalars),
        value.core_l2_u_f64le,
        value.core_l2_v_f64le,
        value.tail_h_f64le,
        value.tail_q_f64le,
    )
    if len({id(raw) for raw in raw_values}) != 5:
        raise PrimaryOperandPublisherError(
            "numeric_payload_hash_or_shape_mismatch", "payload_buffer_alias"
        )
    output: list[tuple[str, bytes]] = []
    for raw, spec in zip(raw_values, PAYLOAD_SPECS, strict=True):
        path, _role, _count, size = spec
        if type(raw) is not bytes or len(raw) != size:
            raise PrimaryOperandPublisherError(
                "numeric_payload_hash_or_shape_mismatch", path
            )
        frozen = memoryview(raw).tobytes()
        if frozen is raw or len(frozen) != size:
            raise PrimaryOperandPublisherError(
                "numeric_payload_hash_or_shape_mismatch", f"{path}:fresh_buffer"
            )
        output.append((path, frozen))
    return tuple(output)


def _classify_numeric_payloads(payloads: tuple[tuple[str, bytes], ...]) -> None:
    for path, raw in payloads:
        for ordinal in range(len(raw) // 8):
            bits = int.from_bytes(raw[8 * ordinal : 8 * ordinal + 8], "little")
            if ((bits >> 52) & 0x7FF) == 0x7FF:
                raise PrimaryOperandPublisherError(
                    "numeric_payload_nonfinite", f"{path}:{ordinal}"
                )
    for path, raw in payloads:
        for ordinal in range(len(raw) // 8):
            if raw[8 * ordinal : 8 * ordinal + 8] == b"\x00\x00\x00\x00\x00\x00\x00\x80":
                raise PrimaryOperandPublisherError(
                    "numeric_payload_negative_zero", f"{path}:{ordinal}"
                )


def _payload_bindings(
    payloads: tuple[tuple[str, bytes], ...]
) -> tuple[FrozenPayloadPublicationBinding, ...]:
    output: list[FrozenPayloadPublicationBinding] = []
    for (observed_path, raw), spec in zip(payloads, PAYLOAD_SPECS, strict=True):
        path, role, count, size = spec
        if observed_path != path or len(raw) != size:
            raise PrimaryOperandPublisherError(
                "numeric_payload_hash_or_shape_mismatch", path
            )
        raw_hash = _hash_bytes(raw)
        output.append(
            FrozenPayloadPublicationBinding(
                path=path,
                semantic_role=role,
                element_count=count,
                size_bytes=size,
                raw_sha256=raw_hash,
                payload_sha256=_payload_binding_sha256(path, size, raw_hash),
            )
        )
    return tuple(output)


def _payload_binding_json(value: FrozenPayloadPublicationBinding) -> dict[str, object]:
    return {
        "elementCount": value.element_count,
        "elementType": "IEEE754_binary64_little_endian",
        "path": value.path,
        "payloadSha256": value.payload_sha256,
        "rawSha256": value.raw_sha256,
        "semanticRole": value.semantic_role,
        "sizeBytes": value.size_bytes,
    }


def _validate_raw_binding(
    value: object, field: str, expected_media_type: str
) -> _RawBinding:
    if type(value) is not _RawBinding:
        raise PrimaryOperandPublisherError("provenance_binding_type_invalid", field)
    if (
        type(value.media_type) is not str
        or _MEDIA_TYPE.fullmatch(value.media_type) is None
        or not value.media_type.isascii()
        or value.media_type != expected_media_type
    ):
        raise PrimaryOperandPublisherError("provenance_binding_media_type_invalid", field)
    _relative_path(value.path, f"{field}.path")
    _reject_forbidden_role(value.path, f"{field}.path")
    _require_hash(value.sha256, f"{field}.sha256")
    if type(value.size_bytes) is not int or not 0 <= value.size_bytes <= (1 << 53) - 1:
        raise PrimaryOperandPublisherError("provenance_binding_size_invalid", field)
    return value


def _validate_file_stat(value: object, detail: str) -> _FileStat:
    if type(value) is not _FileStat:
        raise PrimaryOperandPublisherError("freshness_file_stat_type_invalid", detail)
    for field_name in (
        "change_time_nanoseconds",
        "device",
        "inode",
        "modify_time_nanoseconds",
    ):
        _require_counter(getattr(value, field_name), f"{detail}.{field_name}")
    if type(value.mode_octal) is not str or re.fullmatch(r"^[0-7]{4}$", value.mode_octal) is None:
        raise PrimaryOperandPublisherError("freshness_mode_invalid", detail)
    _require_hash(value.sha256, f"{detail}.sha256")
    if type(value.size_bytes) is not int or not 0 <= value.size_bytes <= (1 << 53) - 1:
        raise PrimaryOperandPublisherError("freshness_size_invalid", detail)
    return value


def _validate_context(value: _AuthenticatedPublicationContext) -> None:
    if type(value) is not _AuthenticatedPublicationContext:
        raise PrimaryOperandPublisherError("publication_context_type_invalid")
    exacts = (
        (value.attempt_ordinal, 1, "attempt_ordinal"),
        (value.candidate_id, CANDIDATE_ID, "candidate_id"),
        (value.candidate_plan_sha256, CANDIDATE_PLAN_SHA256, "candidate_plan_sha256"),
        (value.tolerance_policy_sha256, TOLERANCE_POLICY_SHA256, "tolerance_policy_sha256"),
        (value.branch_bvp_sha256, BRANCH_BVP_SHA256, "branch_bvp_sha256"),
        (value.semantic_seed_sha256, SEMANTIC_SEED_SHA256, "semantic_seed_sha256"),
        (
            value.operation_prepolicy_sha256,
            OPERATION_PREPOLICY_SHA256,
            "operation_prepolicy_sha256",
        ),
        (
            value.primary_numerics_policy_sha256,
            PRIMARY_NUMERICS_POLICY_SHA256,
            "primary_numerics_policy_sha256",
        ),
        (
            value.directed_proof_architecture_sha256,
            DIRECTED_PROOF_ARCHITECTURE_SHA256,
            "directed_proof_architecture_sha256",
        ),
        (
            value.directed_proof_operator_sha256,
            DIRECTED_PROOF_OPERATOR_SHA256,
            "directed_proof_operator_sha256",
        ),
        (
            value.interchange_policy_sha256,
            INTERCHANGE_POLICY_SHA256,
            "interchange_policy_sha256",
        ),
    )
    if any(type(observed) is not type(expected) or observed != expected for observed, expected, _ in exacts):
        detail = next(
            label
            for observed, expected, label in exacts
            if type(observed) is not type(expected) or observed != expected
        )
        raise PrimaryOperandPublisherError("publication_context_binding_mismatch", detail)
    if type(value.expected_raw_payload_sha256) is not tuple or len(value.expected_raw_payload_sha256) != 5:
        raise PrimaryOperandPublisherError("publication_context_binding_mismatch", "payload_hashes")
    for ordinal, digest in enumerate(value.expected_raw_payload_sha256):
        _require_hash(digest, f"expected_payload_hashes[{ordinal}]")
    _require_hash(value.expected_input_binding_sha256, "expected_input_binding_sha256")
    _require_hash(value.command_argv_sha256, "command_argv_sha256")
    _require_hash(value.static_input_aggregate_sha256, "static_input_aggregate_sha256")
    _require_hash(value.output_root_identity_sha256, "output_root_identity_sha256")
    _require_hash(value.failure_root_identity_sha256, "failure_root_identity_sha256")
    _require_hash(value.context_hmac_sha256, "context_hmac_sha256")
    if type(value.commit40) is not str or _HEX40.fullmatch(value.commit40) is None:
        raise PrimaryOperandPublisherError("commit_or_dirty_tree_mismatch", "commit40")
    _require_hash(value.dirty_tree_digest_sha256, "dirty_tree_digest_sha256")
    if (
        type(value.command_argv) is not tuple
        or not 1 <= len(value.command_argv) <= MAXIMUM_ARGV_ENTRIES
    ):
        raise PrimaryOperandPublisherError("command_or_timing_mismatch", "argv")
    argv_utf8_bytes = 0
    for ordinal, item in enumerate(value.command_argv):
        argv_utf8_bytes += len(_string_bytes(item, f"argv[{ordinal}]"))
        if argv_utf8_bytes > MAXIMUM_DESCRIPTOR_BYTES:
            raise PrimaryOperandPublisherError(
                "resource_preflight_failure", "argv_utf8_bytes"
            )
    # The interchange freezes the field and exact argv tuple but not the hash
    # recipe.  The future server/preseal issuer must authenticate their
    # relationship; this authority-false publisher must not invent it.

    bindings = (
        _validate_raw_binding(value.source_manifest_binding, "source", "application/json"),
        _validate_raw_binding(value.toolchain_manifest_binding, "toolchain", "application/json"),
        _validate_raw_binding(value.executable_binding, "executable", "application/octet-stream"),
        _validate_raw_binding(value.runtime_manifest_binding, "runtime", "application/json"),
        _validate_raw_binding(value.preexecution_preseal_binding, "preseal", "application/json"),
    )
    binding_by_path = {binding.path: binding for binding in bindings}
    folded = {unicodedata.normalize("NFC", binding.path.casefold()) for binding in bindings}
    if len(binding_by_path) != 5 or len(folded) != 5:
        raise PrimaryOperandPublisherError("freshness_mismatch", "binding_paths")

    observations = value.freshness_observations
    if (
        type(observations) is not tuple
        or len(observations) != len(bindings)
        or len(observations) > MAXIMUM_FRESHNESS_ENTRIES
    ):
        raise PrimaryOperandPublisherError("freshness_mismatch", "inventory")
    observed_paths: list[str] = []
    for ordinal, observation in enumerate(observations):
        if type(observation) is not _FreshnessObservation:
            raise PrimaryOperandPublisherError("freshness_mismatch", str(ordinal))
        _relative_path(observation.path, f"freshness[{ordinal}].path")
        _reject_forbidden_role(observation.path, f"freshness[{ordinal}].path")
        preopen = _validate_file_stat(observation.preopen, f"freshness[{ordinal}].preopen")
        postread = _validate_file_stat(observation.postread, f"freshness[{ordinal}].postread")
        binding = binding_by_path.get(observation.path)
        if (
            preopen != postread
            or binding is None
            or preopen.sha256 != binding.sha256
            or preopen.size_bytes != binding.size_bytes
        ):
            raise PrimaryOperandPublisherError("freshness_mismatch", observation.path)
        observed_paths.append(observation.path)
    if (
        observed_paths != sorted(observed_paths, key=lambda item: item.encode("utf-8"))
        or len(set(observed_paths)) != len(observed_paths)
        or set(observed_paths) != set(binding_by_path)
    ):
        raise PrimaryOperandPublisherError("freshness_mismatch", "order_or_coverage")

    start = _require_counter(value.monotonic_start_nanoseconds, "monotonic_start")
    end = _require_counter(value.monotonic_end_nanoseconds, "monotonic_end")
    elapsed = _require_counter(value.monotonic_elapsed_nanoseconds, "elapsed")
    if int(end) < int(start) or int(end) - int(start) != int(elapsed):
        raise PrimaryOperandPublisherError("command_or_timing_mismatch", "monotonic")
    wall_start = _timestamp_key(value.wall_start_utc, "wall_start")
    wall_end = _timestamp_key(value.wall_end_utc, "wall_end")
    prepared = _timestamp_key(value.publication_prepared_wall_utc, "publication_prepared")
    if wall_end < wall_start or prepared < wall_end:
        raise PrimaryOperandPublisherError("command_or_timing_mismatch", "wall")

    final_root = _absolute_posix_root(value.final_root, "final_root")
    failure_root = _absolute_posix_root(value.failure_root, "failure_root")
    _reject_forbidden_role(final_root, "final_root")
    _reject_forbidden_role(failure_root, "failure_root")
    if final_root == failure_root or unicodedata.normalize(
        "NFC", final_root.casefold()
    ) == unicodedata.normalize("NFC", failure_root.casefold()):
        raise PrimaryOperandPublisherError("absolute_output_root_invalid", "roots_alias")
    final_parent, _separator, _final_name = final_root.rpartition("/")
    failure_parent, _separator, _failure_name = failure_root.rpartition("/")
    if final_parent != failure_parent:
        raise PrimaryOperandPublisherError("absolute_output_root_invalid", "parent_mismatch")
    if _output_root_identity_sha256(final_root) != value.output_root_identity_sha256:
        raise PrimaryOperandPublisherError("publication_context_binding_mismatch", "output_root_identity")
    if _output_root_identity_sha256(failure_root) != value.failure_root_identity_sha256:
        raise PrimaryOperandPublisherError("publication_context_binding_mismatch", "failure_root_identity")


def _context_json(value: _AuthenticatedPublicationContext, *, include_hmac: bool) -> dict[str, object]:
    result: dict[str, object] = {
        "attemptOrdinal": value.attempt_ordinal,
        "branchBvpSha256": value.branch_bvp_sha256,
        "candidateId": value.candidate_id,
        "candidatePlanSha256": value.candidate_plan_sha256,
        "commandArgv": list(value.command_argv),
        "commandArgvSha256": value.command_argv_sha256,
        "commit40": value.commit40,
        "directedProofArchitectureSha256": value.directed_proof_architecture_sha256,
        "directedProofOperatorSha256": value.directed_proof_operator_sha256,
        "dirtyTreeDigestSha256": value.dirty_tree_digest_sha256,
        "executableBinding": _raw_binding_json(value.executable_binding),
        "expectedInputBindingSha256": value.expected_input_binding_sha256,
        "expectedRawPayloadSha256": list(value.expected_raw_payload_sha256),
        "failureRoot": value.failure_root,
        "failureRootIdentitySha256": value.failure_root_identity_sha256,
        "finalRoot": value.final_root,
        "freshnessObservations": [_freshness_json(item) for item in value.freshness_observations],
        "monotonicElapsedNanoseconds": value.monotonic_elapsed_nanoseconds,
        "monotonicEndNanoseconds": value.monotonic_end_nanoseconds,
        "monotonicStartNanoseconds": value.monotonic_start_nanoseconds,
        "outputRootIdentitySha256": value.output_root_identity_sha256,
        "interchangePolicySha256": value.interchange_policy_sha256,
        "operationPrepolicySha256": value.operation_prepolicy_sha256,
        "preexecutionPresealBinding": _raw_binding_json(value.preexecution_preseal_binding),
        "publicationPreparedWallUtc": value.publication_prepared_wall_utc,
        "runtimeManifestBinding": _raw_binding_json(value.runtime_manifest_binding),
        "sourceManifestBinding": _raw_binding_json(value.source_manifest_binding),
        "staticInputAggregateSha256": value.static_input_aggregate_sha256,
        "semanticSeedSha256": value.semantic_seed_sha256,
        "tolerancePolicySha256": value.tolerance_policy_sha256,
        "primaryNumericsPolicySha256": value.primary_numerics_policy_sha256,
        "toolchainManifestBinding": _raw_binding_json(value.toolchain_manifest_binding),
        "wallEndUtc": value.wall_end_utc,
        "wallStartUtc": value.wall_start_utc,
    }
    if include_hmac:
        result["contextHmacSha256"] = value.context_hmac_sha256
    return result


def _provenance_json(value: _AuthenticatedPublicationContext) -> dict[str, object]:
    return {
        "commandArgv": list(value.command_argv),
        "commit40": value.commit40,
        "dirtyTreeDigestSha256": value.dirty_tree_digest_sha256,
        "executableBinding": _raw_binding_json(value.executable_binding),
        "freshnessObservations": [_freshness_json(item) for item in value.freshness_observations],
        "outputRootIdentitySha256": value.output_root_identity_sha256,
        "preexecutionPresealBinding": _raw_binding_json(value.preexecution_preseal_binding),
        "runtimeManifestBinding": _raw_binding_json(value.runtime_manifest_binding),
        "sourceManifestBinding": _raw_binding_json(value.source_manifest_binding),
        "timing": {
            "monotonicElapsedNanoseconds": value.monotonic_elapsed_nanoseconds,
            "monotonicEndNanoseconds": value.monotonic_end_nanoseconds,
            "monotonicStartNanoseconds": value.monotonic_start_nanoseconds,
            "wallEndUtc": value.wall_end_utc,
            "wallStartUtc": value.wall_start_utc,
        },
        "toolchainManifestBinding": _raw_binding_json(value.toolchain_manifest_binding),
    }


def _descriptor_bytes(
    context: _AuthenticatedPublicationContext,
    payloads: tuple[FrozenPayloadPublicationBinding, ...],
) -> bytes:
    raw = _canonical_json(
        {
            "attemptOrdinal": 1,
            "authorityFalse": True,
            "candidateId": CANDIDATE_ID,
            "orderedPayloadBindings": [_payload_binding_json(item) for item in payloads],
            "policyBindings": _policy_bindings(),
            "provenance": _provenance_json(context),
            "schemaVersion": DESCRIPTOR_SCHEMA_VERSION,
        }
    )
    if not 0 < len(raw) <= MAXIMUM_DESCRIPTOR_BYTES:
        raise PrimaryOperandPublisherError("resource_preflight_failure", "descriptor_bytes")
    return raw


@dataclass(slots=True)
class _LinuxPublicationHandle:
    parent_fd: int
    temp_fd: int | None
    parent_path: str
    final_name: str
    temp_name: str | None
    parent_device: int
    temp_inode: int | None
    directory_inodes: dict[str, int]
    file_inodes: dict[str, int]
    renamed: bool = False


class _LinuxKernel:
    """Native Linux syscall adapter for the frozen atomic protocol."""

    __slots__ = ("_libc", "_openat2_number", "_renameat2_number")

    _RESOLVE_NO_XDEV = 0x01
    _RESOLVE_NO_MAGICLINKS = 0x02
    _RESOLVE_NO_SYMLINKS = 0x04
    _RESOLVE_BENEATH = 0x08
    _RENAME_NOREPLACE = 1

    class _OpenHow(ctypes.Structure):
        _fields_ = (
            ("flags", ctypes.c_uint64),
            ("mode", ctypes.c_uint64),
            ("resolve", ctypes.c_uint64),
        )

    def __init__(self) -> None:
        if sys.platform != "linux":
            raise PrimaryOperandPublisherError("linux_local_filesystem_required")
        machine = platform.machine().lower()
        numbers = {
            "x86_64": (437, 316),
            "amd64": (437, 316),
            "aarch64": (437, 276),
            "arm64": (437, 276),
        }
        if machine not in numbers:
            raise PrimaryOperandPublisherError("linux_syscall_abi_not_registered", machine)
        self._openat2_number, self._renameat2_number = numbers[machine]
        self._libc = ctypes.CDLL(None, use_errno=True)
        self._libc.syscall.restype = ctypes.c_long

    def _syscall(self, number: int, *arguments: object) -> int:
        result = int(self._libc.syscall(ctypes.c_long(number), *arguments))
        if result < 0:
            error_number = ctypes.get_errno()
            raise OSError(error_number, os.strerror(error_number))
        return result

    def _openat2(self, directory_fd: int, path: str, flags: int, mode: int = 0) -> int:
        raw = _relative_path(path, "openat2_path").encode("utf-8", "strict")
        how = self._OpenHow(
            flags=flags,
            mode=mode,
            resolve=(
                self._RESOLVE_BENEATH
                | self._RESOLVE_NO_SYMLINKS
                | self._RESOLVE_NO_MAGICLINKS
                | self._RESOLVE_NO_XDEV
            ),
        )
        return self._syscall(
            self._openat2_number,
            ctypes.c_int(directory_fd),
            ctypes.c_char_p(raw),
            ctypes.byref(how),
            ctypes.c_size_t(ctypes.sizeof(how)),
        )

    def resource_preflight(self, total_bytes: int) -> None:
        if sys.platform != "linux" or type(total_bytes) is not int or total_bytes <= 0:
            raise PrimaryOperandPublisherError("resource_preflight_failure", "host_or_bytes")
        if total_bytes > MAXIMUM_DESCRIPTOR_BYTES + MAXIMUM_RECEIPT_BYTES + TOTAL_PAYLOAD_BYTES:
            raise PrimaryOperandPublisherError("resource_preflight_failure", "byte_budget")

    def require_publication_prepared_not_future(self, timestamp: str) -> None:
        _timestamp_key(timestamp, "publication_prepared")
        base = datetime(
            int(timestamp[0:4]),
            int(timestamp[5:7]),
            int(timestamp[8:10]),
            int(timestamp[11:13]),
            int(timestamp[14:16]),
            int(timestamp[17:19]),
            int(timestamp[20:26]),
            tzinfo=timezone.utc,
        )
        prepared_nanoseconds = int(base.timestamp()) * 1_000_000_000 + int(
            timestamp[20:29]
        )
        if prepared_nanoseconds > time.time_ns():
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "publication_prepared_in_future"
            )

    def open_parent(self, final_root: str) -> _LinuxPublicationHandle:
        root = _absolute_posix_root(final_root, "final_root")
        parent_path, _separator, final_name = root.rpartition("/")
        components = tuple(component for component in parent_path.split("/") if component)
        flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
        current = os.open("/", flags)
        try:
            for component in components:
                next_fd = self._openat2(current, component, flags)
                os.close(current)
                current = next_fd
            parent_stat = os.fstat(current)
            if (
                not stat.S_ISDIR(parent_stat.st_mode)
                or parent_stat.st_uid != os.geteuid()
                or parent_stat.st_gid != os.getegid()
            ):
                raise PrimaryOperandPublisherError("primary_publication_failure", "parent_owner")
            return _LinuxPublicationHandle(
                parent_fd=current,
                temp_fd=None,
                parent_path=parent_path,
                final_name=final_name,
                temp_name=None,
                parent_device=parent_stat.st_dev,
                temp_inode=None,
                directory_inodes={},
                file_inodes={},
            )
        except Exception:
            os.close(current)
            raise

    def require_local_filesystem(self, handle: _LinuxPublicationHandle) -> None:
        parent_stat = os.fstat(handle.parent_fd)
        device = f"{os.major(parent_stat.st_dev)}:{os.minor(parent_stat.st_dev)}"
        try:
            with open("/proc/self/mountinfo", "r", encoding="utf-8") as stream:
                mountinfo = stream.read().splitlines()
        except OSError as error:
            raise PrimaryOperandPublisherError("primary_publication_failure", "mountinfo") from error
        filesystem_types = {
            line.split(" - ", 1)[1].split()[0]
            for line in mountinfo
            if len(line.split()) > 2 and line.split()[2] == device and " - " in line
        }
        admitted_local = {
            "bcachefs",
            "btrfs",
            "ext2",
            "ext3",
            "ext4",
            "f2fs",
            "overlay",
            "xfs",
            "zfs",
        }
        if not filesystem_types or not filesystem_types.issubset(admitted_local):
            raise PrimaryOperandPublisherError("primary_publication_failure", "nonlocal_filesystem")

    def require_final_absent(self, handle: _LinuxPublicationHandle) -> None:
        try:
            os.stat(handle.final_name, dir_fd=handle.parent_fd, follow_symlinks=False)
        except FileNotFoundError:
            return
        raise PrimaryOperandPublisherError("primary_publication_failure", "final_root_exists")

    def getrandom_nonce(self) -> str:
        raw = os.getrandom(16, 0)
        if type(raw) is not bytes or len(raw) != 16:
            raise PrimaryOperandPublisherError("primary_publication_failure", "getrandom")
        return raw.hex()

    def create_temp(self, handle: _LinuxPublicationHandle, nonce: str) -> None:
        if _HEX32.fullmatch(nonce) is None:
            raise PrimaryOperandPublisherError("primary_publication_failure", "nonce")
        temp_name = f".{handle.final_name}.tmp.{nonce}"
        os.mkdir(temp_name, 0o700, dir_fd=handle.parent_fd)
        handle.temp_name = temp_name
        flags = os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW
        temp_fd = self._openat2(handle.parent_fd, temp_name, flags)
        handle.temp_fd = temp_fd
        observed = os.fstat(temp_fd)
        handle.temp_inode = observed.st_ino
        parent = os.fstat(handle.parent_fd)
        if (
            not stat.S_ISDIR(observed.st_mode)
            or stat.S_IMODE(observed.st_mode) != 0o700
            or observed.st_uid != os.geteuid()
            or observed.st_gid != os.getegid()
            or observed.st_dev != handle.parent_device
            or observed.st_ino == parent.st_ino
        ):
            raise PrimaryOperandPublisherError("primary_publication_failure", "temp_metadata")

    def mkdir(self, handle: _LinuxPublicationHandle, relative_path: str, mode: int) -> None:
        if handle.temp_fd is None or mode != 0o700:
            raise PrimaryOperandPublisherError("primary_publication_failure", "mkdir_state")
        path = _relative_path(relative_path, "mkdir_path")
        if path in handle.directory_inodes:
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "directory_reuse"
            )
        os.mkdir(path, mode, dir_fd=handle.temp_fd)
        descriptor = self._openat2(
            handle.temp_fd,
            path,
            os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
        )
        try:
            observed = os.fstat(descriptor)
            if (
                not stat.S_ISDIR(observed.st_mode)
                or stat.S_IMODE(observed.st_mode) != 0o700
                or observed.st_dev != handle.parent_device
                or observed.st_uid != os.geteuid()
                or observed.st_gid != os.getegid()
                or observed.st_ino == handle.temp_inode
                or observed.st_ino in handle.directory_inodes.values()
            ):
                raise PrimaryOperandPublisherError("primary_publication_failure", "directory_metadata")
            handle.directory_inodes[path] = observed.st_ino
        finally:
            os.close(descriptor)

    def _open_file_parent(self, handle: _LinuxPublicationHandle, path: str) -> tuple[int, str, bool]:
        if handle.temp_fd is None:
            raise PrimaryOperandPublisherError("primary_publication_failure", "temp_not_open")
        parent, separator, name = path.rpartition("/")
        if not separator:
            return handle.temp_fd, path, False
        descriptor = self._openat2(
            handle.temp_fd,
            parent,
            os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
        )
        return descriptor, name, True

    @staticmethod
    def _stable_stat(value: os.stat_result) -> tuple[int, ...]:
        return (
            value.st_dev,
            value.st_ino,
            value.st_mode,
            value.st_nlink,
            value.st_uid,
            value.st_gid,
            value.st_size,
            value.st_mtime_ns,
            value.st_ctime_ns,
        )

    def write_verified_file(
        self, handle: _LinuxPublicationHandle, relative_path: str, raw: bytes
    ) -> None:
        path = _relative_path(relative_path, "write_path")
        if type(raw) is not bytes:
            raise PrimaryOperandPublisherError("primary_publication_failure", "write_type")
        if path in handle.file_inodes:
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "file_reuse"
            )
        parent_fd, name, owned_parent = self._open_file_parent(handle, path)
        descriptor = -1
        try:
            descriptor = os.open(
                name,
                os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
                0o600,
                dir_fd=parent_fd,
            )
            observed = os.fstat(descriptor)
            if (
                not stat.S_ISREG(observed.st_mode)
                or stat.S_IMODE(observed.st_mode) != 0o600
                or observed.st_nlink != 1
                or observed.st_uid != os.geteuid()
                or observed.st_gid != os.getegid()
                or observed.st_dev != handle.parent_device
                or observed.st_ino == handle.temp_inode
                or observed.st_ino in handle.directory_inodes.values()
                or observed.st_ino in handle.file_inodes.values()
            ):
                raise PrimaryOperandPublisherError("primary_publication_failure", f"file_metadata:{path}")
            handle.file_inodes[path] = observed.st_ino
            offset = 0
            while offset < len(raw):
                written = os.write(descriptor, raw[offset:])
                if written <= 0:
                    raise PrimaryOperandPublisherError("primary_publication_failure", f"short_write:{path}")
                offset += written
            os.fdatasync(descriptor)
            os.fsync(descriptor)
            os.fchmod(descriptor, 0o400)
            os.fsync(descriptor)
        finally:
            if descriptor >= 0:
                os.close(descriptor)
            if owned_parent:
                os.close(parent_fd)

        read_fd = self._openat2(
            handle.temp_fd if handle.temp_fd is not None else -1,
            path,
            os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW,
        )
        try:
            before = os.fstat(read_fd)
            if (
                not stat.S_ISREG(before.st_mode)
                or stat.S_IMODE(before.st_mode) != 0o400
                or before.st_size != len(raw)
                or before.st_nlink != 1
                or before.st_uid != os.geteuid()
                or before.st_gid != os.getegid()
                or before.st_dev != handle.parent_device
                or before.st_ino != handle.file_inodes.get(path)
            ):
                raise PrimaryOperandPublisherError("primary_publication_failure", f"readback_metadata:{path}")
            chunks: list[bytes] = []
            remaining = len(raw)
            while remaining:
                chunk = os.read(read_fd, remaining)
                if not chunk:
                    raise PrimaryOperandPublisherError("primary_publication_failure", f"short_read:{path}")
                chunks.append(chunk)
                remaining -= len(chunk)
            if os.read(read_fd, 1) != b"":
                raise PrimaryOperandPublisherError("primary_publication_failure", f"long_read:{path}")
            after = os.fstat(read_fd)
            observed_raw = b"".join(chunks)
            if self._stable_stat(before) != self._stable_stat(after) or observed_raw != raw:
                raise PrimaryOperandPublisherError("primary_publication_failure", f"readback_mismatch:{path}")
        finally:
            os.close(read_fd)

    def fsync_directory(self, handle: _LinuxPublicationHandle, relative_path: str) -> None:
        if handle.temp_fd is None:
            raise PrimaryOperandPublisherError("primary_publication_failure", "temp_not_open")
        if relative_path == ".":
            os.fsync(handle.temp_fd)
            return
        descriptor = self._openat2(
            handle.temp_fd,
            _relative_path(relative_path, "fsync_dir"),
            os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
        )
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)

    def fsync_parent(self, handle: _LinuxPublicationHandle) -> None:
        os.fsync(handle.parent_fd)

    def rename_noreplace(self, handle: _LinuxPublicationHandle) -> None:
        if handle.temp_name is None:
            raise PrimaryOperandPublisherError("primary_publication_failure", "temp_name_missing")
        self._syscall(
            self._renameat2_number,
            ctypes.c_int(handle.parent_fd),
            ctypes.c_char_p(handle.temp_name.encode("utf-8")),
            ctypes.c_int(handle.parent_fd),
            ctypes.c_char_p(handle.final_name.encode("utf-8")),
            ctypes.c_uint(self._RENAME_NOREPLACE),
        )
        handle.renamed = True

    def final_readback(
        self,
        handle: _LinuxPublicationHandle,
        files: tuple[tuple[str, bytes], ...],
        directories: tuple[str, ...],
    ) -> None:
        root_fd = self._openat2(
            handle.parent_fd,
            handle.final_name,
            os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
        )
        try:
            root_stat = os.fstat(root_fd)
            if (
                not stat.S_ISDIR(root_stat.st_mode)
                or stat.S_IMODE(root_stat.st_mode) != 0o700
                or root_stat.st_dev != handle.parent_device
                or handle.temp_inode is None
                or root_stat.st_ino != handle.temp_inode
                or root_stat.st_uid != os.geteuid()
                or root_stat.st_gid != os.getegid()
            ):
                raise PrimaryOperandPublisherError("primary_publication_failure", "final_root_metadata")
            expected_top = {path.split("/", 1)[0] for path, _raw in files}.union(
                path.split("/", 1)[0] for path in directories
            )
            if set(os.listdir(root_fd)) != expected_top:
                raise PrimaryOperandPublisherError("primary_publication_failure", "final_inventory")
            if (
                set(handle.directory_inodes) != set(directories)
                or len(set(handle.directory_inodes.values())) != len(directories)
            ):
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "final_directory_lineage"
                )
            for directory in directories:
                descriptor = self._openat2(
                    root_fd,
                    directory,
                    os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
                )
                try:
                    observed = os.fstat(descriptor)
                    observed_children = set(os.listdir(descriptor))
                    observed_after = os.fstat(descriptor)
                    expected_children = {
                        path.split("/", 1)[1]
                        for path, _raw in files
                        if path.startswith(directory + "/") and "/" not in path.split("/", 1)[1]
                    }
                    if (
                        not stat.S_ISDIR(observed.st_mode)
                        or stat.S_IMODE(observed.st_mode) != 0o700
                        or observed.st_dev != handle.parent_device
                        or observed.st_uid != os.geteuid()
                        or observed.st_gid != os.getegid()
                        or observed.st_ino
                        != handle.directory_inodes.get(directory)
                        or observed.st_ino == root_stat.st_ino
                        or self._stable_stat(observed)
                        != self._stable_stat(observed_after)
                        or observed_children != expected_children
                    ):
                        raise PrimaryOperandPublisherError("primary_publication_failure", f"final_directory:{directory}")
                finally:
                    os.close(descriptor)
            expected_file_paths = {path for path, _raw in files}
            if (
                set(handle.file_inodes) != expected_file_paths
                or len(set(handle.file_inodes.values())) != len(expected_file_paths)
            ):
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "final_file_lineage"
                )
            inodes: set[tuple[int, int]] = set()
            for path, expected in files:
                descriptor = self._openat2(
                    root_fd,
                    path,
                    os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW,
                )
                try:
                    before = os.fstat(descriptor)
                    observed = bytearray()
                    while len(observed) < len(expected):
                        chunk = os.read(descriptor, len(expected) - len(observed))
                        if not chunk:
                            break
                        observed.extend(chunk)
                    after = os.fstat(descriptor)
                    inode = (before.st_dev, before.st_ino)
                    if (
                        not stat.S_ISREG(before.st_mode)
                        or stat.S_IMODE(before.st_mode) != 0o400
                        or before.st_nlink != 1
                        or before.st_uid != os.geteuid()
                        or before.st_gid != os.getegid()
                        or before.st_dev != handle.parent_device
                        or before.st_ino != handle.file_inodes.get(path)
                        or inode in inodes
                        or self._stable_stat(before) != self._stable_stat(after)
                        or bytes(observed) != expected
                        or os.read(descriptor, 1) != b""
                    ):
                        raise PrimaryOperandPublisherError("primary_publication_failure", f"final_readback:{path}")
                    inodes.add(inode)
                finally:
                    os.close(descriptor)
            root_after = os.fstat(root_fd)
            if (
                self._stable_stat(root_stat) != self._stable_stat(root_after)
                or set(os.listdir(root_fd)) != expected_top
            ):
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "final_root_unstable"
                )
        finally:
            os.close(root_fd)

    def quarantine(self, handle: _LinuxPublicationHandle) -> None:
        if handle.temp_name is None:
            return
        descriptor = handle.temp_fd
        owned_descriptor = False
        if descriptor is None:
            lookup_name = handle.final_name if handle.renamed else handle.temp_name
            descriptor = self._openat2(
                handle.parent_fd,
                lookup_name,
                os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC | os.O_NOFOLLOW,
            )
            owned_descriptor = True
        namespace_name = handle.final_name if handle.renamed else handle.temp_name
        namespace_descriptor: int | None = None
        namespace_open_error: OSError | None = None
        try:
            namespace_descriptor = self._openat2(
                handle.parent_fd,
                namespace_name,
                os.O_RDONLY
                | os.O_DIRECTORY
                | os.O_CLOEXEC
                | os.O_NOFOLLOW,
            )
        except OSError as error:
            namespace_open_error = error
        try:
            observed = os.fstat(descriptor)
            if (
                not stat.S_ISDIR(observed.st_mode)
                or observed.st_dev != handle.parent_device
                or handle.temp_inode is None
                or observed.st_ino != handle.temp_inode
            ):
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "quarantine_lineage"
                )
            os.fchmod(descriptor, 0o000)
            if stat.S_IMODE(os.fstat(descriptor).st_mode) != 0o000:
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "quarantine_mode"
                )
            os.fsync(descriptor)
            os.fsync(handle.parent_fd)
            if namespace_open_error is not None:
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure",
                    "quarantine_namespace",
                ) from namespace_open_error
            if namespace_descriptor is not None:
                namespace_observed = os.fstat(namespace_descriptor)
                if (namespace_observed.st_dev, namespace_observed.st_ino) != (
                    observed.st_dev,
                    observed.st_ino,
                ):
                    if (
                        not stat.S_ISDIR(namespace_observed.st_mode)
                        or namespace_observed.st_dev != handle.parent_device
                        or namespace_observed.st_uid != os.geteuid()
                        or namespace_observed.st_gid != os.getegid()
                    ):
                        raise PrimaryOperandPublisherError(
                            "primary_publication_failure",
                            "quarantine_namespace",
                        )
                    os.fchmod(namespace_descriptor, 0o000)
                    os.fsync(namespace_descriptor)
                if (
                    stat.S_IMODE(os.fstat(namespace_descriptor).st_mode)
                    != 0o000
                ):
                    raise PrimaryOperandPublisherError(
                        "primary_publication_failure",
                        "quarantine_namespace_mode",
                    )
                os.fsync(handle.parent_fd)
                namespace_stat = os.stat(
                    namespace_name,
                    dir_fd=handle.parent_fd,
                    follow_symlinks=False,
                )
                if (
                    not stat.S_ISDIR(namespace_stat.st_mode)
                    or stat.S_IMODE(namespace_stat.st_mode) != 0o000
                    or namespace_stat.st_dev != handle.parent_device
                    or namespace_stat.st_uid != os.geteuid()
                    or namespace_stat.st_gid != os.getegid()
                ):
                    raise PrimaryOperandPublisherError(
                        "primary_publication_failure",
                        "quarantine_namespace",
                    )
        finally:
            if namespace_descriptor is not None:
                os.close(namespace_descriptor)
            if owned_descriptor:
                os.close(descriptor)

    def close(self, handle: _LinuxPublicationHandle) -> None:
        if handle.temp_fd is not None:
            os.close(handle.temp_fd)
            handle.temp_fd = None
        os.close(handle.parent_fd)


def _publication_receipt_bytes(
    context: _AuthenticatedPublicationContext,
    payloads: tuple[FrozenPayloadPublicationBinding, ...],
    descriptor_raw: bytes,
    input_binding_sha256: str,
    nonce: str,
) -> bytes:
    if _HEX32.fullmatch(nonce) is None:
        raise PrimaryOperandPublisherError("primary_publication_failure", "nonce")
    raw = _canonical_json(
        {
            "authorityFalse": True,
            "candidateId": CANDIDATE_ID,
            "descriptorBinding": {
                "mediaType": "application/json",
                "path": "descriptor.json",
                "sha256": _hash_bytes(descriptor_raw),
                "sizeBytes": len(descriptor_raw),
            },
            "inputBindingSha256": input_binding_sha256,
            "orderedPayloadBindings": [_payload_binding_json(item) for item in payloads],
            "publication": {
                "finalRoot": context.final_root,
                "parentDirectoryFsyncRequired": True,
                "publicationMethod": "renameat2_RENAME_NOREPLACE_then_parent_fsync",
                "publicationPreparedWallUtc": context.publication_prepared_wall_utc,
                "tempRootNonceSha256": sha256(nonce.encode("ascii")).hexdigest(),
            },
            "schemaVersion": RECEIPT_SCHEMA_VERSION,
        }
    )
    if not 0 < len(raw) <= MAXIMUM_RECEIPT_BYTES:
        raise PrimaryOperandPublisherError("resource_preflight_failure", "receipt_bytes")
    return raw


def _failure_receipt_bytes(
    context: _AuthenticatedPublicationContext,
    *,
    stage: str,
    code: str,
    input_binding_sha256: str | None,
) -> bytes:
    raw = _canonical_json(
        {
            "attemptOrdinal": 1,
            "authorityFalse": True,
            "candidateId": CANDIDATE_ID,
            "commandArgvSha256": context.command_argv_sha256,
            "commit40": context.commit40,
            "detailSha256": None,
            "failureCode": code,
            "failureStage": stage,
            "interchangePolicyBinding": _policy_bindings()["interchangePolicy"],
            "monotonicElapsedNanoseconds": context.monotonic_elapsed_nanoseconds,
            "primaryInputBindingSha256": input_binding_sha256,
            "schemaVersion": FAILURE_RECEIPT_SCHEMA_VERSION,
            "wallEndUtc": context.wall_end_utc,
            "wallStartUtc": context.wall_start_utc,
        }
    )
    if not 0 < len(raw) <= MAXIMUM_FAILURE_RECEIPT_BYTES:
        raise PrimaryOperandPublisherError("failure_publication_failure", "receipt_bytes")
    return raw


def _atomic_publish(
    kernel: object,
    final_root: str,
    directories: tuple[str, ...],
    files_without_receipt: tuple[tuple[str, bytes], ...],
    receipt_builder: object,
    *,
    receipt_path: str = "receipt.json",
) -> tuple[bytes, str]:
    final_root = _absolute_posix_root(final_root, "atomic_final_root")
    if (
        type(directories) is not tuple
        or not 0 <= len(directories) <= 64
        or type(files_without_receipt) is not tuple
        or not 0 <= len(files_without_receipt) <= 64
    ):
        raise PrimaryOperandPublisherError(
            "primary_publication_failure", "static_inventory_shape"
        )
    validated_directories: list[str] = []
    directory_aliases: set[str] = set()
    for ordinal, directory in enumerate(directories):
        path = _relative_path(directory, f"directory[{ordinal}]")
        _reject_forbidden_role(path, f"directory[{ordinal}]")
        alias = unicodedata.normalize("NFC", path.casefold())
        parent, separator, _name = path.rpartition("/")
        if (
            alias in directory_aliases
            or (separator and parent not in validated_directories)
        ):
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "static_directory_inventory"
            )
        directory_aliases.add(alias)
        validated_directories.append(path)
    validated_files: list[tuple[str, bytes]] = []
    file_aliases: set[str] = set()
    static_file_bytes = 0
    for ordinal, item in enumerate(files_without_receipt):
        if type(item) is not tuple or len(item) != 2:
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "static_file_inventory"
            )
        path = _relative_path(item[0], f"file[{ordinal}].path")
        _reject_forbidden_role(path, f"file[{ordinal}].path")
        raw = item[1]
        if type(raw) is not bytes:
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "static_file_bytes"
            )
        parent, separator, _name = path.rpartition("/")
        alias = unicodedata.normalize("NFC", path.casefold())
        static_file_bytes += len(raw)
        if (
            alias in file_aliases
            or alias in directory_aliases
            or (separator and parent not in validated_directories)
            or static_file_bytes
            > TOTAL_PAYLOAD_BYTES + MAXIMUM_DESCRIPTOR_BYTES
        ):
            raise PrimaryOperandPublisherError(
                "primary_publication_failure", "static_file_inventory"
            )
        file_aliases.add(alias)
        validated_files.append((path, raw))
    receipt_path = _relative_path(receipt_path, "receipt_path")
    _reject_forbidden_role(receipt_path, "receipt_path")
    receipt_parent, separator, _name = receipt_path.rpartition("/")
    receipt_alias = unicodedata.normalize("NFC", receipt_path.casefold())
    if (
        receipt_alias in file_aliases
        or receipt_alias in directory_aliases
        or (separator and receipt_parent not in validated_directories)
    ):
        raise PrimaryOperandPublisherError(
            "primary_publication_failure", "static_receipt_inventory"
        )
    directories = tuple(validated_directories)
    files_without_receipt = tuple(validated_files)
    handle = None
    try:
        handle = kernel.open_parent(final_root)
        kernel.require_local_filesystem(handle)
        kernel.require_final_absent(handle)
        nonce = kernel.getrandom_nonce()
        if type(nonce) is not str or _HEX32.fullmatch(nonce) is None:
            raise PrimaryOperandPublisherError("primary_publication_failure", "nonce")
        receipt_raw = receipt_builder(nonce)
        if type(receipt_raw) is not bytes:
            raise PrimaryOperandPublisherError("primary_publication_failure", "receipt_type")
        all_files = files_without_receipt + ((receipt_path, receipt_raw),)
        kernel.create_temp(handle, nonce)
        for directory in directories:
            kernel.mkdir(handle, directory, 0o700)
        for path, raw in all_files:
            kernel.write_verified_file(handle, path, raw)
        for directory in reversed(directories):
            kernel.fsync_directory(handle, directory)
        kernel.fsync_directory(handle, ".")
        kernel.fsync_parent(handle)
        kernel.rename_noreplace(handle)
        kernel.fsync_parent(handle)
        kernel.final_readback(handle, all_files, directories)
        return receipt_raw, nonce
    except PrimaryOperandPublisherError:
        if (
            handle is not None
            and getattr(handle, "temp_name", None) is not None
        ):
            try:
                kernel.quarantine(handle)
            except Exception as quarantine_error:
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "quarantine_failure"
                ) from quarantine_error
        raise
    except Exception as error:
        if (
            handle is not None
            and getattr(handle, "temp_name", None) is not None
        ):
            try:
                kernel.quarantine(handle)
            except Exception as quarantine_error:
                raise PrimaryOperandPublisherError(
                    "primary_publication_failure", "quarantine_failure"
                ) from quarantine_error
        raise PrimaryOperandPublisherError(
            "primary_publication_failure", type(error).__name__
        ) from error
    finally:
        if handle is not None:
            try:
                kernel.close(handle)
            except Exception:
                pass


def _failure_stage_for(code: str) -> str:
    if code in (
        "numeric_payload_hash_or_shape_mismatch",
        "numeric_payload_nonfinite",
        "numeric_payload_negative_zero",
    ):
        return "numeric_decode"
    if code == "resource_preflight_failure":
        return "primary_execution"
    return "primary_publication"


def _publish_failure_receipt(
    context: _AuthenticatedPublicationContext,
    kernel: object,
    *,
    stage: str,
    code: str,
    input_binding_sha256: str | None,
) -> FrozenFailurePublication:
    raw = _failure_receipt_bytes(
        context,
        stage=stage,
        code=code,
        input_binding_sha256=input_binding_sha256,
    )
    try:
        receipt, _nonce = _atomic_publish(
            kernel,
            context.failure_root,
            ("failure",),
            (),
            lambda _ignored_nonce: raw,
            receipt_path="failure/receipt.json",
        )
    except Exception as error:
        raise PrimaryOperandPublisherError(
            "failure_publication_failure", type(error).__name__
        ) from error
    return FrozenFailurePublication(
        failure_root=context.failure_root,
        failure_stage=stage,
        failure_code=code,
        receipt_plain_sha256=_hash_bytes(receipt),
        receipt_size_bytes=len(receipt),
        primary_input_binding_sha256=input_binding_sha256,
        publication_mode="test_only_deterministic_syscall_harness",
    )


def publish_primary_operands(
    publication_context: object,
    operands: object,
) -> FrozenPrimaryOperandPublication:
    """Fail closed until a real server-owned cross-process issuer exists.

    Both arguments are intentionally left untouched.  This prevents proxy,
    accessor, equality, iteration, or byte-buffer traps from executing at the
    unauthenticated production boundary.
    """

    raise PrimaryOperandPublisherError("server_publication_context_issuer_absent")


if (
    PAYLOAD_SPECS
    != (
        ("scalars.f64le", "primary_scalar_operands", 9, 72),
        (
            "coefficients/core_L2_u.f64le",
            "primary_L2_scalar_Chebyshev_coefficients",
            128,
            1_024,
        ),
        (
            "coefficients/core_L2_V.f64le",
            "primary_L2_potential_Chebyshev_coefficients",
            128,
            1_024,
        ),
        (
            "coefficients/tail_H.f64le",
            "primary_tail_H_Chebyshev_coefficients",
            32,
            256,
        ),
        (
            "coefficients/tail_Q.f64le",
            "primary_tail_Q_Chebyshev_coefficients",
            32,
            256,
        ),
    )
    or sum(item[2] for item in PAYLOAD_SPECS) != TOTAL_PAYLOAD_ELEMENTS
    or sum(item[3] for item in PAYLOAD_SPECS) != TOTAL_PAYLOAD_BYTES
    or any(AUTHORITY_LOCKS.values())
    or len(PUBLICATION_BLOCKERS) != 9
    or SERVER_PUBLICATION_CONTEXT_ISSUER_PRESENT
    or PRODUCTION_PUBLICATION_ENABLED
):
    raise RuntimeError("spherical_seed_primary_operand_publisher_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "CANONICAL_INVENTORY_ORDER",
    "DIRECTED_PROOF_ARCHITECTURE_CANONICAL_SIZE_BYTES",
    "DIRECTED_PROOF_ARCHITECTURE_SHA256",
    "DIRECTED_PROOF_OPERATOR_CANONICAL_SIZE_BYTES",
    "DIRECTED_PROOF_OPERATOR_SHA256",
    "FrozenFailurePublication",
    "FrozenPayloadPublicationBinding",
    "FrozenPrimaryOperandPublication",
    "INTERCHANGE_POLICY_CANONICAL_SIZE_BYTES",
    "INTERCHANGE_POLICY_SHA256",
    "OPERATION_PREPOLICY_CANONICAL_SIZE_BYTES",
    "OPERATION_PREPOLICY_SHA256",
    "PAYLOAD_SPECS",
    "PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES",
    "PRIMARY_NUMERICS_POLICY_SHA256",
    "PRODUCTION_PUBLICATION_ENABLED",
    "PUBLICATION_BLOCKERS",
    "PUBLISHER_VERSION",
    "PrimaryOperandPublisherError",
    "REQUIRED_SERVER_CONTEXT_HANDOFF",
    "SCALAR_ORDER",
    "SERVER_PUBLICATION_CONTEXT_ISSUER_PRESENT",
    "SEMANTIC_SEED_CANONICAL_SIZE_BYTES",
    "SEMANTIC_SEED_SHA256",
    "TOTAL_PAYLOAD_BYTES",
    "TOTAL_PAYLOAD_ELEMENTS",
    "WRITE_ORDER",
    "publish_primary_operands",
]
