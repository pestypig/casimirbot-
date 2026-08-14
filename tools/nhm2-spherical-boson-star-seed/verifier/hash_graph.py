"""Independent hash primitives for the frozen spherical seed interchange.

This module implements only recipes that are closed by the interchange policy.
It intentionally does not invent recipes for command argv, the static-input
aggregate, freshness inventories, or the dirty-tree digest.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from types import MappingProxyType
from typing import Final
import struct
import unicodedata


DESCRIPTOR_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/descriptor/v1\n"
)
INPUT_BINDING_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-directed-proof/input-binding/v1\n"
)
MANIFEST_AGGREGATE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/manifest/v1\n"
)
OUTPUT_ROOT_IDENTITY_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/output-root/v1\n"
)
PAYLOAD_BINDING_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/primary-payload/v1\n"
)

MAXIMUM_SAFE_INTEGER: Final[int] = (1 << 53) - 1
MAXIMUM_DESCRIPTOR_BYTES: Final[int] = 1_048_576
MAXIMUM_MANIFEST_BYTES: Final[int] = 8_388_608
MAXIMUM_MANIFEST_ENTRIES: Final[int] = 8_192
MAXIMUM_PATH_UTF8_BYTES: Final[int] = 4_096

_EXPECTED_PRIMARY_PAYLOADS: Final = (
    ("scalars.f64le", 72),
    ("coefficients/core_L2_u.f64le", 1_024),
    ("coefficients/core_L2_V.f64le", 1_024),
    ("coefficients/tail_H.f64le", 256),
    ("coefficients/tail_Q.f64le", 256),
)


class HashGraphError(ValueError):
    """Typed fail-closed hash-graph rejection."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class PayloadHashInput:
    path: str
    size_bytes: int
    raw_sha256: str

    def __post_init__(self) -> None:
        _validate_relative_path(self.path)
        _validate_safe_nonnegative_integer(self.size_bytes, "size_bytes")
        _decode_sha256(self.raw_sha256, "raw_sha256")


def _u64le(value: int) -> bytes:
    _validate_safe_nonnegative_integer(value, "u64")
    return struct.pack("<Q", value)


def _validate_safe_nonnegative_integer(value: object, field: str) -> int:
    if type(value) is not int or value < 0 or value > MAXIMUM_SAFE_INTEGER:
        raise HashGraphError("safe_nonnegative_integer_invalid", field)
    return value


def _decode_sha256(value: object, field: str) -> bytes:
    if (
        type(value) is not str
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise HashGraphError("sha256_invalid", field)
    return bytes.fromhex(value)


def _validate_utf8_string(value: object, field: str, maximum_bytes: int) -> bytes:
    if type(value) is not str or "\x00" in value:
        raise HashGraphError("utf8_string_invalid", field)
    try:
        encoded = value.encode("utf-8", "strict")
    except UnicodeEncodeError as error:
        raise HashGraphError("utf8_string_invalid", field) from error
    if len(encoded) == 0 or len(encoded) > maximum_bytes:
        raise HashGraphError("utf8_string_size_invalid", field)
    return encoded


def _validate_relative_path(value: object) -> bytes:
    encoded = _validate_utf8_string(value, "path", MAXIMUM_PATH_UTF8_BYTES)
    assert type(value) is str
    if unicodedata.normalize("NFC", value) != value:
        raise HashGraphError("relative_path_not_nfc")
    if (
        value.startswith("/")
        or value.endswith("/")
        or "\\" in value
        or ":" in value.split("/", 1)[0]
    ):
        raise HashGraphError("relative_path_invalid")
    segments = value.split("/")
    if any(
        segment in ("", ".", "..")
        or len(segment.encode("utf-8")) > 255
        for segment in segments
    ):
        raise HashGraphError("relative_path_invalid")
    return encoded


def payload_binding_sha256(payload: PayloadHashInput) -> str:
    if type(payload) is not PayloadHashInput:
        raise HashGraphError("payload_hash_input_type_invalid")
    path_bytes = _validate_relative_path(payload.path)
    raw_hash = _decode_sha256(payload.raw_sha256, "raw_sha256")
    digest = sha256()
    digest.update(PAYLOAD_BINDING_DOMAIN)
    digest.update(_u64le(len(path_bytes)))
    digest.update(path_bytes)
    digest.update(_u64le(payload.size_bytes))
    digest.update(raw_hash)
    return digest.hexdigest()


def descriptor_sha256(canonical_descriptor_bytes: bytes) -> str:
    if type(canonical_descriptor_bytes) is not bytes:
        raise HashGraphError("descriptor_bytes_type_invalid")
    if not 0 < len(canonical_descriptor_bytes) <= MAXIMUM_DESCRIPTOR_BYTES:
        raise HashGraphError("descriptor_bytes_size_invalid")
    digest = sha256()
    digest.update(DESCRIPTOR_HASH_DOMAIN)
    digest.update(_u64le(len(canonical_descriptor_bytes)))
    digest.update(canonical_descriptor_bytes)
    return digest.hexdigest()


def input_binding_sha256(
    descriptor_hash: str, payloads: tuple[PayloadHashInput, ...]
) -> str:
    descriptor_hash_bytes = _decode_sha256(descriptor_hash, "descriptor_hash")
    if type(payloads) is not tuple or len(payloads) != len(
        _EXPECTED_PRIMARY_PAYLOADS
    ):
        raise HashGraphError("primary_payload_tuple_invalid")
    digest = sha256()
    digest.update(INPUT_BINDING_DOMAIN)
    digest.update(descriptor_hash_bytes)
    for ordinal, (payload, expected) in enumerate(
        zip(payloads, _EXPECTED_PRIMARY_PAYLOADS, strict=True)
    ):
        if type(payload) is not PayloadHashInput:
            raise HashGraphError("payload_hash_input_type_invalid", str(ordinal))
        expected_path, expected_size = expected
        if payload.path != expected_path or payload.size_bytes != expected_size:
            raise HashGraphError("primary_payload_inventory_invalid", str(ordinal))
        path_bytes = _validate_relative_path(payload.path)
        digest.update(_u64le(len(path_bytes)))
        digest.update(path_bytes)
        digest.update(_u64le(payload.size_bytes))
        digest.update(_decode_sha256(payload.raw_sha256, "raw_sha256"))
    return digest.hexdigest()


def manifest_aggregate_sha256(
    canonical_entry_bytes: tuple[bytes, ...],
) -> str:
    if (
        type(canonical_entry_bytes) is not tuple
        or not 1 <= len(canonical_entry_bytes) <= MAXIMUM_MANIFEST_ENTRIES
    ):
        raise HashGraphError("manifest_entry_tuple_invalid")
    total = 0
    digest = sha256()
    digest.update(MANIFEST_AGGREGATE_DOMAIN)
    digest.update(_u64le(len(canonical_entry_bytes)))
    for ordinal, entry in enumerate(canonical_entry_bytes):
        if type(entry) is not bytes or len(entry) == 0:
            raise HashGraphError("manifest_entry_bytes_invalid", str(ordinal))
        total += len(entry)
        if total > MAXIMUM_MANIFEST_BYTES:
            raise HashGraphError("manifest_entry_bytes_limit_exceeded")
        digest.update(_u64le(len(entry)))
        digest.update(entry)
    return digest.hexdigest()


def output_root_identity_sha256(absolute_root: str) -> str:
    root_bytes = _validate_utf8_string(
        absolute_root, "absolute_root", MAXIMUM_PATH_UTF8_BYTES
    )
    digest = sha256()
    digest.update(OUTPUT_ROOT_IDENTITY_DOMAIN)
    digest.update(_u64le(len(root_bytes)))
    digest.update(root_bytes)
    return digest.hexdigest()


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "executionAuthorized": False,
        "candidateAccepted": False,
        "replayAuthority": False,
        "independentAgreement": False,
        "diagnosticPass": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

if any(AUTHORITY_LOCKS.values()):
    raise RuntimeError("hash_graph_authority_lock_invalid")
