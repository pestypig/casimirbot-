"""Independent, bounded decoder for spherical-seed primary operands.

This module deliberately imports no producer implementation.  It validates the
five byte payloads at the primary-to-verifier boundary before a future directed
proof backend is allowed to see any numeric value.  Successful decoding grants
no seed, proof, replay, lamp, or physical authority.
"""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from struct import unpack
from types import MappingProxyType
from typing import Final


PAYLOAD_HASH_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-newtonian-seed-interchange/"
    b"primary-payload/v1\n"
)


@dataclass(frozen=True, slots=True)
class PayloadSpec:
    path: str
    semantic_role: str
    element_count: int

    @property
    def size_bytes(self) -> int:
        return self.element_count * 8


PRIMARY_PAYLOAD_SPECS: Final[tuple[PayloadSpec, ...]] = (
    PayloadSpec("scalars.f64le", "primary_scalar_operands", 9),
    PayloadSpec(
        "coefficients/core_L2_u.f64le",
        "primary_L2_scalar_Chebyshev_coefficients",
        128,
    ),
    PayloadSpec(
        "coefficients/core_L2_V.f64le",
        "primary_L2_potential_Chebyshev_coefficients",
        128,
    ),
    PayloadSpec(
        "coefficients/tail_H.f64le",
        "primary_tail_H_Chebyshev_coefficients",
        32,
    ),
    PayloadSpec(
        "coefficients/tail_Q.f64le",
        "primary_tail_Q_Chebyshev_coefficients",
        32,
    ),
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

TOTAL_ELEMENT_COUNT: Final[int] = sum(
    spec.element_count for spec in PRIMARY_PAYLOAD_SPECS
)
TOTAL_BYTE_COUNT: Final[int] = sum(spec.size_bytes for spec in PRIMARY_PAYLOAD_SPECS)


class PrimaryPayloadError(ValueError):
    """Typed fail-closed boundary error with a stable machine code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenDecodedPayload:
    spec: PayloadSpec
    raw_bytes: bytes
    raw_sha256: str
    payload_sha256: str
    values: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class FrozenPrimaryOperands:
    payloads: tuple[FrozenDecodedPayload, ...]

    def payload(self, path: str) -> FrozenDecodedPayload:
        if type(path) is not str:
            raise PrimaryPayloadError("payload_path_type_invalid", type(path).__name__)
        for payload in self.payloads:
            if payload.spec.path == path:
                return payload
        raise PrimaryPayloadError("payload_path_unknown", path)

    def scalar(self, name: str) -> float:
        if type(name) is not str:
            raise PrimaryPayloadError("scalar_name_type_invalid", type(name).__name__)
        try:
            ordinal = SCALAR_ORDER.index(name)
        except ValueError as error:
            raise PrimaryPayloadError("scalar_name_unknown", name) from error
        return self.payloads[0].values[ordinal]


def _u64le(value: int) -> bytes:
    if type(value) is not int or value < 0 or value >= 1 << 64:
        raise PrimaryPayloadError("u64_domain_invalid", repr(value))
    return value.to_bytes(8, "little", signed=False)


def _payload_binding_sha256(spec: PayloadSpec, raw_sha256: str) -> str:
    path_bytes = spec.path.encode("utf-8", errors="strict")
    digest = sha256()
    digest.update(PAYLOAD_HASH_DOMAIN)
    digest.update(_u64le(len(path_bytes)))
    digest.update(path_bytes)
    digest.update(_u64le(spec.size_bytes))
    digest.update(bytes.fromhex(raw_sha256))
    return digest.hexdigest()


def _freeze_payload_bytes(spec: PayloadSpec, raw: bytes) -> tuple[bytes, str, str]:
    if type(raw) is not bytes:
        raise PrimaryPayloadError("payload_bytes_type_invalid", spec.path)
    if len(raw) != spec.size_bytes:
        raise PrimaryPayloadError(
            "payload_size_mismatch", f"{spec.path}:{len(raw)}/{spec.size_bytes}"
        )

    frozen_raw = bytes(raw)
    raw_digest = sha256(frozen_raw).hexdigest()
    return frozen_raw, raw_digest, _payload_binding_sha256(spec, raw_digest)


def _first_nonfinite(
    frozen_payloads: tuple[tuple[PayloadSpec, bytes, str, str], ...],
) -> tuple[PayloadSpec, int] | None:
    for spec, raw, _raw_digest, _payload_digest in frozen_payloads:
        for ordinal in range(spec.element_count):
            start = ordinal * 8
            bits = int.from_bytes(raw[start : start + 8], "little", signed=False)
            if ((bits >> 52) & 0x7FF) == 0x7FF:
                return spec, ordinal
    return None


def _first_negative_zero(
    frozen_payloads: tuple[tuple[PayloadSpec, bytes, str, str], ...],
) -> tuple[PayloadSpec, int] | None:
    for spec, raw, _raw_digest, _payload_digest in frozen_payloads:
        for ordinal in range(spec.element_count):
            start = ordinal * 8
            if raw[start : start + 8] == b"\x00\x00\x00\x00\x00\x00\x00\x80":
                return spec, ordinal
    return None


def _decode_validated_payload(
    spec: PayloadSpec, raw: bytes, raw_digest: str, payload_digest: str
) -> FrozenDecodedPayload:
    values = tuple(
        unpack("<d", raw[ordinal * 8 : ordinal * 8 + 8])[0]
        for ordinal in range(spec.element_count)
    )
    return FrozenDecodedPayload(
        spec=spec,
        raw_bytes=raw,
        raw_sha256=raw_digest,
        payload_sha256=payload_digest,
        values=values,
    )


def _freeze_inventory(
    payloads: tuple[tuple[str, bytes], ...],
) -> tuple[tuple[PayloadSpec, bytes, str, str], ...]:
    if type(payloads) is not tuple:
        raise PrimaryPayloadError("payload_inventory_type_invalid", type(payloads).__name__)
    if len(payloads) != len(PRIMARY_PAYLOAD_SPECS):
        raise PrimaryPayloadError(
            "payload_inventory_count_mismatch",
            f"{len(payloads)}/{len(PRIMARY_PAYLOAD_SPECS)}",
        )

    frozen_payloads: list[tuple[PayloadSpec, bytes, str, str]] = []
    for ordinal, spec in enumerate(PRIMARY_PAYLOAD_SPECS):
        entry = payloads[ordinal]
        if type(entry) is not tuple or len(entry) != 2:
            raise PrimaryPayloadError("payload_entry_shape_invalid", str(ordinal))
        path, raw = entry
        if type(path) is not str:
            raise PrimaryPayloadError("payload_path_type_invalid", str(ordinal))
        if path != spec.path:
            raise PrimaryPayloadError(
                "payload_path_or_order_mismatch", f"{ordinal}:{path!r}/{spec.path!r}"
            )
        frozen_raw, raw_digest, payload_digest = _freeze_payload_bytes(spec, raw)
        frozen_payloads.append((spec, frozen_raw, raw_digest, payload_digest))
    return tuple(frozen_payloads)


def _decode_frozen_inventory(
    frozen_payloads: tuple[tuple[PayloadSpec, bytes, str, str], ...],
) -> FrozenPrimaryOperands:
    nonfinite = _first_nonfinite(frozen_payloads)
    if nonfinite is not None:
        spec, ordinal = nonfinite
        raise PrimaryPayloadError(
            "numeric_payload_nonfinite", f"{spec.path}:{ordinal}"
        )
    negative_zero = _first_negative_zero(frozen_payloads)
    if negative_zero is not None:
        spec, ordinal = negative_zero
        raise PrimaryPayloadError(
            "numeric_payload_negative_zero", f"{spec.path}:{ordinal}"
        )
    return FrozenPrimaryOperands(
        payloads=tuple(_decode_validated_payload(*entry) for entry in frozen_payloads)
    )


def decode_primary_payloads(
    payloads: tuple[tuple[str, bytes], ...],
) -> FrozenPrimaryOperands:
    """Decode exactly five immutable payloads in the frozen interchange order."""

    return _decode_frozen_inventory(_freeze_inventory(payloads))


def decode_bound_primary_payloads(
    payloads: tuple[tuple[str, bytes], ...],
    expected_hashes: tuple[tuple[str, str], ...],
) -> FrozenPrimaryOperands:
    """Verify every raw/binding hash before global numeric classification."""

    if type(expected_hashes) is not tuple or len(expected_hashes) != len(
        PRIMARY_PAYLOAD_SPECS
    ):
        raise PrimaryPayloadError("expected_hash_inventory_invalid", "root")
    frozen = _freeze_inventory(payloads)
    for ordinal, (spec, _raw, raw_digest, payload_digest) in enumerate(frozen):
        expected = expected_hashes[ordinal]
        if (
            type(expected) is not tuple
            or len(expected) != 2
            or type(expected[0]) is not str
            or type(expected[1]) is not str
        ):
            raise PrimaryPayloadError("expected_hash_entry_invalid", str(ordinal))
        if expected != (raw_digest, payload_digest):
            raise PrimaryPayloadError(
                "numeric_payload_hash_or_shape_mismatch", spec.path
            )
    return _decode_frozen_inventory(frozen)


AUTHORITY_LOCKS: Final = MappingProxyType({
    "proofInterchangeComplete": False,
    "implementationClosureComplete": False,
    "runtimeClosureComplete": False,
    "executionAuthorized": False,
    "executionObserved": False,
    "primaryOperandsAccepted": False,
    "directedDutiesAccepted": False,
    "seedAccepted": False,
    "replayAuthority": False,
    "independentAgreement": False,
    "semiclassicalStressNoiseLamp": False,
    "semiclassicalConstraintAlgebraLamp": False,
    "physicalViability": False,
    "propulsion": False,
    "transport": False,
})


if (
    len(PRIMARY_PAYLOAD_SPECS) != 5
    or TOTAL_ELEMENT_COUNT != 329
    or TOTAL_BYTE_COUNT != 2632
    or len(SCALAR_ORDER) != PRIMARY_PAYLOAD_SPECS[0].element_count
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("spherical_seed_verifier_f64le_inventory_invariant")
