"""Independent, authority-neutral admission of the frozen spherical-v2 bytes.

This module deliberately shares no imports with the TypeScript server replayer.
It duplicates the sealed 68-file ABI and performs a second implementation of
the byte-level admission phases.  It does not observe a filesystem, establish
freshness/provenance, recompute the semiclassical science, or unlock claims.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from json import dumps
from math import prod
from struct import unpack_from
from types import MappingProxyType
from typing import Final, Mapping
from weakref import WeakKeyDictionary


CANDIDATE_ID: Final = (
    "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1"
)
INPUT_CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_raw_inventory_input/v1"
)
RECEIPT_CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_independent_raw_inventory_replayer/v1"
)
RECEIPT_ARTIFACT_ID: Final = (
    "nhm2.spherical_boson_star_v2_independent_raw_inventory_admission_receipt"
)
SCHEMA_ARTIFACT_ID: Final = "nhm2.spherical_boson_star_v2_raw_replay_schema"
SCHEMA_CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_raw_replay_schema/v1"
)
SCHEMA_SHA256_DOMAIN: Final = (
    "nhm2-spherical-boson-star-v2-raw-replay-schema/v1\n"
)
SCHEMA_SHA256: Final = (
    "96f5816f9d04b9d3b14a228ab821c3224974f47839ace6d7c7819f77c6a223ff"
)
SCHEMA_CANONICAL_SIZE_BYTES: Final = 163_818
RAW_HASH_CLOSURE_SHA256_DOMAIN: Final = (
    "nhm2-spherical-boson-star-v2-raw-hash-closure/v1\n"
)
EXACT_FILE_COUNT: Final = 68
EXACT_AGGREGATE_BYTES: Final = 6_693_376
MAXIMUM_PER_FILE_BYTES: Final = 3_276_800
FLOAT64_BYTES: Final = 8


@dataclass(frozen=True, slots=True)
class FileDescriptor:
    file_ordinal: int
    path: str
    role: str
    shape: tuple[int, ...]
    size_bytes: int
    nonnegative: bool


def _fixed_descriptor(
    ordinal: int,
    filename: str,
    role: str,
    shape: tuple[int, ...],
    *,
    nonnegative: bool,
) -> FileDescriptor:
    return FileDescriptor(
        file_ordinal=ordinal,
        path=f"{{outputDirectory}}/fixed/{filename}.f64le",
        role=role,
        shape=shape,
        size_bytes=prod(shape) * FLOAT64_BYTES,
        nonnegative=nonnegative,
    )


_FAMILY_ROLE_ORDER: Final = MappingProxyType(
    {
        "H_H": ("computed", "target", "residual", "absolute_uncertainty95"),
        "H_Hi": ("computed", "target", "residual", "absolute_uncertainty95"),
        "Hi_Hj": ("computed", "target", "residual", "absolute_uncertainty95"),
        "antisymmetry": (
            "forward",
            "reverse",
            "residual",
            "absolute_uncertainty95",
        ),
        "jacobi": (
            "term_1",
            "term_2",
            "term_3",
            "residual",
            "absolute_uncertainty95",
        ),
    }
)


def _build_descriptors() -> tuple[FileDescriptor, ...]:
    result = [
        _fixed_descriptor(
            0,
            "00-noise_kernel",
            "noise_kernel",
            (64, 64, 100),
            nonnegative=False,
        ),
        _fixed_descriptor(
            1,
            "01-noise_kernel_absolute_uncertainty95",
            "noise_kernel_absolute_uncertainty95",
            (64, 64, 100),
            nonnegative=True,
        ),
        _fixed_descriptor(
            2,
            "02-mean_rset",
            "mean_rset",
            (64, 10),
            nonnegative=False,
        ),
        _fixed_descriptor(
            3,
            "03-mean_rset_absolute_uncertainty95",
            "mean_rset_absolute_uncertainty95",
            (64, 10),
            nonnegative=True,
        ),
        _fixed_descriptor(
            4,
            "04-smearing_weights",
            "smearing_weights",
            (64,),
            nonnegative=True,
        ),
    ]
    ordinal = len(result)
    for level in range(3):
        level_id = f"level_{level}"
        for family, roles in _FAMILY_ROLE_ORDER.items():
            for operand_role in roles:
                result.append(
                    FileDescriptor(
                        file_ordinal=ordinal,
                        path=(
                            f"{{outputDirectory}}/{level_id}/{family}/"
                            f"{operand_role}.f64le"
                        ),
                        role=(
                            f"constraint_operand.{level_id}.{family}."
                            f"{operand_role}"
                        ),
                        shape=(64, 4),
                        size_bytes=64 * 4 * FLOAT64_BYTES,
                        nonnegative=operand_role == "absolute_uncertainty95",
                    )
                )
                ordinal += 1
    return tuple(result)


FILE_DESCRIPTORS: Final = _build_descriptors()
NONNEGATIVE_FILE_ORDINALS: Final = tuple(
    descriptor.file_ordinal
    for descriptor in FILE_DESCRIPTORS
    if descriptor.nonnegative
)


@dataclass(frozen=True, slots=True)
class Blocker:
    code: str
    phase: str
    pointer: str | None
    detail: str


@dataclass(frozen=True, slots=True, weakref_slot=True, eq=False)
class Receipt:
    artifact_id: str
    contract_version: str
    server_owned: bool
    independent_implementation: bool
    diagnostic_only: bool
    calculation_only: bool
    disposition: str
    calculation_ready: bool
    first_blocker: str | None
    blockers: tuple[Blocker, ...]
    candidate_id: str | None
    raw_hash_closure_sha256: str | None
    raw_hash_bindings: tuple[Mapping[str, object], ...]
    authority_boundary: Mapping[str, bool]


_AUTHORITY_BOUNDARY: Final = MappingProxyType(
    {
        "callerObservationAuthority": False,
        "filesystemReadPerformed": False,
        "filesystemSecurityVerified": False,
        "freshnessVerified": False,
        "preexecutionSkeletonVerified": False,
        "scientificPresealVerified": False,
        "executionProvenanceVerified": False,
        "staticScientificInputClosureVerified": False,
        "scientificRecomputationPerformed": False,
        "replayPerformed": False,
        "independentAgreement": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "theoryGraphPromotion": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
        "certificateAuthority": False,
    }
)

_INVENTORIES: "WeakKeyDictionary[Receipt, tuple[bytes, ...]]" = WeakKeyDictionary()

_ROOT_KEYS: Final = frozenset(
    {"contractVersion", "candidateId", "schemaBinding", "files"}
)
_SCHEMA_KEYS: Final = frozenset(
    {
        "artifactId",
        "contractVersion",
        "candidateId",
        "sha256Domain",
        "sha256",
        "canonicalSizeBytes",
        "mediaType",
    }
)
_FILE_KEYS: Final = frozenset(
    {"fileOrdinal", "path", "role", "shape", "sizeBytes", "sha256", "bytes"}
)


def schema_binding() -> dict[str, object]:
    return {
        "artifactId": SCHEMA_ARTIFACT_ID,
        "contractVersion": SCHEMA_CONTRACT_VERSION,
        "candidateId": CANDIDATE_ID,
        "sha256Domain": SCHEMA_SHA256_DOMAIN,
        "sha256": SCHEMA_SHA256,
        "canonicalSizeBytes": SCHEMA_CANONICAL_SIZE_BYTES,
        "mediaType": "application/json",
    }


def _receipt(blocker: Blocker | None, *, bindings=(), closure=None) -> Receipt:
    accepted = blocker is None
    return Receipt(
        artifact_id=RECEIPT_ARTIFACT_ID,
        contract_version=RECEIPT_CONTRACT_VERSION,
        server_owned=True,
        independent_implementation=True,
        diagnostic_only=True,
        calculation_only=True,
        disposition="accepted" if accepted else "rejected",
        calculation_ready=accepted,
        first_blocker=None if blocker is None else blocker.code,
        blockers=() if blocker is None else (blocker,),
        candidate_id=CANDIDATE_ID if accepted else None,
        raw_hash_closure_sha256=closure if accepted else None,
        raw_hash_bindings=tuple(bindings) if accepted else (),
        authority_boundary=_AUTHORITY_BOUNDARY,
    )


def _reject(code: str, phase: str, pointer: str | None, detail: str) -> Receipt:
    return _receipt(Blocker(code=code, phase=phase, pointer=pointer, detail=detail))


def _is_sha256(value: object) -> bool:
    return (
        type(value) is str
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _has_exact_string_keys(
    value: object, expected: frozenset[str]
) -> bool:
    if type(value) is not dict or len(value) != len(expected):
        return False
    keys = tuple(value.keys())
    return (
        len(keys) == len(expected)
        and all(type(key) is str for key in keys)
        and frozenset(keys) == expected
    )


def _is_exact_string(value: object, expected: str) -> bool:
    return type(value) is str and len(value) == len(expected) and value == expected


def _capture(input_value: object) -> tuple[list[dict[str, object]], Receipt | None]:
    if not _has_exact_string_keys(input_value, _ROOT_KEYS):
        return [], _reject(
            "input_shape_invalid", "structure", None, "Root must be an exact dict."
        )
    contract_version = input_value["contractVersion"]
    candidate_id = input_value["candidateId"]
    binding = input_value["schemaBinding"]
    files = input_value["files"]
    if not _is_exact_string(contract_version, INPUT_CONTRACT_VERSION):
        return [], _reject(
            "input_shape_invalid",
            "structure",
            "/contractVersion",
            "Input contract version mismatch.",
        )
    if not _is_exact_string(candidate_id, CANDIDATE_ID):
        return [], _reject(
            "candidate_id_mismatch",
            "structure",
            "/candidateId",
            "Candidate identity mismatch.",
        )
    expected_binding = schema_binding()
    if not _has_exact_string_keys(binding, _SCHEMA_KEYS):
        return [], _reject(
            "schema_binding_mismatch",
            "structure",
            "/schemaBinding",
            "Schema binding mismatch.",
        )
    for key, expected in expected_binding.items():
        observed = binding[key]
        if type(expected) is str:
            if not _is_exact_string(observed, expected):
                return [], _reject(
                    "schema_binding_mismatch",
                    "structure",
                    f"/schemaBinding/{key}",
                    "Schema binding mismatch.",
                )
        elif type(observed) is not int or observed != expected:
            return [], _reject(
                "schema_binding_mismatch",
                "structure",
                f"/schemaBinding/{key}",
                "Schema binding mismatch.",
            )
    if type(files) is not list or len(files) != EXACT_FILE_COUNT:
        return [], _reject(
            "inventory_count_invalid",
            "structure",
            "/files",
            "Exactly 68 file observations are required.",
        )
    captured: list[dict[str, object]] = []
    for ordinal, descriptor in enumerate(FILE_DESCRIPTORS):
        observation = files[ordinal]
        pointer = f"/files/{ordinal}"
        if not _has_exact_string_keys(observation, _FILE_KEYS):
            return [], _reject(
                "inventory_descriptor_mismatch",
                "structure",
                pointer,
                "File observation must be an exact dict.",
            )
        observed_ordinal = observation["fileOrdinal"]
        observed_path = observation["path"]
        observed_role = observation["role"]
        observed_shape = observation["shape"]
        observed_size = observation["sizeBytes"]
        observed_hash = observation["sha256"]
        observed_bytes = observation["bytes"]
        if (
            type(observed_ordinal) is not int
            or observed_ordinal != descriptor.file_ordinal
            or not _is_exact_string(observed_path, descriptor.path)
            or not _is_exact_string(observed_role, descriptor.role)
            or type(observed_shape) is not list
            or len(observed_shape) != len(descriptor.shape)
            or any(type(dimension) is not int for dimension in observed_shape)
            or tuple(observed_shape) != descriptor.shape
            or type(observed_size) is not int
            or type(observed_hash) is not str
        ):
            return [], _reject(
                "inventory_descriptor_mismatch",
                "structure",
                pointer,
                "Ordinal, path, role, or shape differs from the sealed ABI.",
            )
        if type(observed_bytes) is not bytes:
            return [], _reject(
                "file_bytes_invalid",
                "structure",
                f"{pointer}/bytes",
                "Only exact immutable built-in bytes are admitted.",
            )
        captured.append(observation)
    return captured, None


def _hash_bindings(hashes: list[str]) -> tuple[Mapping[str, object], ...]:
    return tuple(
        MappingProxyType(
            {
                "fileOrdinal": descriptor.file_ordinal,
                "path": descriptor.path,
                "role": descriptor.role,
                "shape": descriptor.shape,
                "sizeBytes": descriptor.size_bytes,
                "sha256": hashes[descriptor.file_ordinal],
            }
        )
        for descriptor in FILE_DESCRIPTORS
    )


def _closure_hash(bindings: tuple[Mapping[str, object], ...]) -> str:
    json_bindings = [
        {
            "fileOrdinal": binding["fileOrdinal"],
            "path": binding["path"],
            "role": binding["role"],
            "shape": list(binding["shape"]),
            "sizeBytes": binding["sizeBytes"],
            "sha256": binding["sha256"],
        }
        for binding in bindings
    ]
    canonical = dumps(json_bindings, ensure_ascii=False, separators=(",", ":"))
    return sha256((RAW_HASH_CLOSURE_SHA256_DOMAIN + canonical).encode("utf-8")).hexdigest()


def admit_raw_inventory(input_value: object) -> Receipt:
    """Admit exact immutable bytes with deterministic global phase precedence."""

    captured, failure = _capture(input_value)
    if failure is not None:
        return failure

    aggregate = 0
    for ordinal, (observation, descriptor) in enumerate(
        zip(captured, FILE_DESCRIPTORS, strict=True)
    ):
        raw = observation["bytes"]
        claimed_size = observation["sizeBytes"]
        if (
            type(claimed_size) is not int
            or claimed_size != descriptor.size_bytes
            or len(raw) != descriptor.size_bytes
        ):
            return _reject(
                "file_size_mismatch",
                "hash_or_size",
                f"/files/{ordinal}/sizeBytes",
                "Claimed, intrinsic, and sealed sizes must match.",
            )
        if len(raw) > MAXIMUM_PER_FILE_BYTES:
            return _reject(
                "file_size_cap_exceeded",
                "hash_or_size",
                f"/files/{ordinal}/bytes",
                "Per-file byte cap exceeded.",
            )
        aggregate += len(raw)
    if aggregate != EXACT_AGGREGATE_BYTES:
        return _reject(
            "aggregate_size_mismatch",
            "hash_or_size",
            "/files",
            "Aggregate raw byte size mismatch.",
        )

    hashes: list[str] = []
    for ordinal, observation in enumerate(captured):
        claimed_hash = observation["sha256"]
        if not _is_sha256(claimed_hash):
            return _reject(
                "file_sha256_invalid",
                "hash_or_size",
                f"/files/{ordinal}/sha256",
                "Claimed SHA-256 must be lowercase hexadecimal.",
            )
        observed_hash = sha256(observation["bytes"]).hexdigest()
        if observed_hash != claimed_hash:
            return _reject(
                "file_sha256_mismatch",
                "hash_or_size",
                f"/files/{ordinal}/sha256",
                "Claimed and recomputed SHA-256 differ.",
            )
        hashes.append(observed_hash)

    # IEEE-754 bit classification is completed for all files before any float
    # values are decoded. Exponent=0x7ff denotes infinity or NaN.
    for ordinal, observation in enumerate(captured):
        raw = observation["bytes"]
        for byte_offset in range(0, len(raw), FLOAT64_BYTES):
            word = unpack_from("<Q", raw, byte_offset)[0]
            if ((word >> 52) & 0x7FF) == 0x7FF:
                return _reject(
                    "decoded_nonfinite",
                    "nonfinite",
                    f"/files/{ordinal}/bytes/{byte_offset}",
                    "A nonfinite binary64 word was observed.",
                )

    for ordinal, observation in enumerate(captured):
        raw = observation["bytes"]
        for byte_offset in range(0, len(raw), FLOAT64_BYTES):
            if unpack_from("<Q", raw, byte_offset)[0] == 0x8000000000000000:
                return _reject(
                    "decoded_negative_zero",
                    "negative_zero",
                    f"/files/{ordinal}/bytes/{byte_offset}",
                    "A negative-zero binary64 word was observed.",
                )

    for ordinal in NONNEGATIVE_FILE_ORDINALS:
        raw = captured[ordinal]["bytes"]
        for byte_offset in range(0, len(raw), FLOAT64_BYTES):
            if unpack_from("<Q", raw, byte_offset)[0] >> 63:
                return _reject(
                    "decoded_role_sensitive_negative",
                    "role_sensitive_nonnegative",
                    f"/files/{ordinal}/bytes/{byte_offset}",
                    "A role constrained to nonnegative values was negative.",
                )

    bindings = _hash_bindings(hashes)
    receipt = _receipt(None, bindings=bindings, closure=_closure_hash(bindings))
    _INVENTORIES[receipt] = tuple(observation["bytes"] for observation in captured)
    return receipt


def has_private_admitted_inventory(receipt: object) -> bool:
    """Prove exact receipt identity without reading any caller-controlled field."""

    return type(receipt) is Receipt and _INVENTORIES.get(receipt) is not None


def get_admitted_float64_length(receipt: object, file_ordinal: int) -> int | None:
    if (
        type(file_ordinal) is not int
        or file_ordinal < 0
        or file_ordinal >= EXACT_FILE_COUNT
    ):
        return None
    inventory = _INVENTORIES.get(receipt) if type(receipt) is Receipt else None
    return None if inventory is None else len(inventory[file_ordinal]) // FLOAT64_BYTES


def get_admitted_raw_sha256(receipt: object, file_ordinal: int) -> str | None:
    """Rehash one privately admitted byte string without exposing its bytes."""

    if (
        type(file_ordinal) is not int
        or file_ordinal < 0
        or file_ordinal >= EXACT_FILE_COUNT
    ):
        return None
    inventory = _INVENTORIES.get(receipt) if type(receipt) is Receipt else None
    return None if inventory is None else sha256(inventory[file_ordinal]).hexdigest()


def read_admitted_float64(
    receipt: object, file_ordinal: int, element_ordinal: int
) -> float | None:
    if (
        type(file_ordinal) is not int
        or type(element_ordinal) is not int
        or file_ordinal < 0
        or file_ordinal >= EXACT_FILE_COUNT
        or element_ordinal < 0
    ):
        return None
    inventory = _INVENTORIES.get(receipt) if type(receipt) is Receipt else None
    if inventory is None:
        return None
    raw = inventory[file_ordinal]
    byte_offset = element_ordinal * FLOAT64_BYTES
    if byte_offset >= len(raw):
        return None
    return unpack_from("<d", raw, byte_offset)[0]


if (
    len(FILE_DESCRIPTORS) != EXACT_FILE_COUNT
    or sum(item.size_bytes for item in FILE_DESCRIPTORS) != EXACT_AGGREGATE_BYTES
    or NONNEGATIVE_FILE_ORDINALS
    != (1, 3, 4, 8, 12, 16, 20, 25, 29, 33, 37, 41, 46, 50, 54, 58, 62, 67)
):
    raise RuntimeError("spherical_v2_independent_raw_inventory_constants_invalid")
