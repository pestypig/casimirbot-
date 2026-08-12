"""Immutable binary64 little-endian classification without float decoding.

This module deliberately provides bit classification only.  It does not perform
binary64 arithmetic, canonicalize payloads, or attach any verifier authority.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterator


_F64LE_BYTE_LENGTH = 8
_EXPONENT_MASK = 0x7FF
_FRACTION_MASK = 0x000F_FFFF_FFFF_FFFF


class F64LEBitsError(ValueError):
    """Raised when an exact binary64 bit-view precondition is not satisfied."""


class F64LEValidationError(F64LEBitsError):
    """A deterministic first-element validation failure."""

    __slots__ = ("code", "index")

    def __init__(self, code: str, index: int) -> None:
        self.code = code
        self.index = index
        super().__init__(f"{code}:index={index}")


def positive_zero_f64le_bytes() -> bytes:
    """Return the explicit binary64 little-endian positive-zero literal."""

    return b"\x00\x00\x00\x00\x00\x00\x00\x00"


@dataclass(frozen=True, slots=True)
class F64LEBits:
    """The exact bytes and classification fields of one binary64 encoding."""

    exact_bytes: bytes

    def __post_init__(self) -> None:
        if type(self.exact_bytes) is not bytes:
            raise F64LEBitsError("exact_bytes_type_required")
        if len(self.exact_bytes) != _F64LE_BYTE_LENGTH:
            raise F64LEBitsError("exactly_8_bytes_required")

    def _unsigned_bits(self) -> int:
        return int.from_bytes(self.exact_bytes, "little", signed=False)

    @property
    def sign_bit(self) -> int:
        return self._unsigned_bits() >> 63

    @property
    def exponent_bits(self) -> int:
        return (self._unsigned_bits() >> 52) & _EXPONENT_MASK

    @property
    def fraction_bits(self) -> int:
        return self._unsigned_bits() & _FRACTION_MASK

    @property
    def is_finite(self) -> bool:
        return self.exponent_bits != _EXPONENT_MASK

    @property
    def is_zero(self) -> bool:
        return self.exponent_bits == 0 and self.fraction_bits == 0

    @property
    def is_negative_zero(self) -> bool:
        return self.sign_bit == 1 and self.is_zero


@dataclass(frozen=True, slots=True)
class F64LEBitView:
    """An exact-count, immutable view over consecutive binary64 encodings."""

    exact_bytes: bytes
    expected_element_count: int
    expected_byte_count: int

    def __post_init__(self) -> None:
        if type(self.exact_bytes) is not bytes:
            raise F64LEBitsError("immutable_bytes_payload_required")
        if (
            type(self.expected_element_count) is not int
            or self.expected_element_count < 0
        ):
            raise F64LEBitsError("nonnegative_integer_element_count_required")
        if type(self.expected_byte_count) is not int or self.expected_byte_count < 0:
            raise F64LEBitsError("nonnegative_integer_byte_count_required")
        if self.expected_byte_count != self.expected_element_count * _F64LE_BYTE_LENGTH:
            raise F64LEBitsError("element_and_byte_expectations_disagree")
        actual_byte_count = len(self.exact_bytes)
        if actual_byte_count < self.expected_byte_count:
            raise F64LEBitsError("payload_truncated")
        if actual_byte_count > self.expected_byte_count:
            raise F64LEBitsError("payload_has_extra_bytes")

    @property
    def element_count(self) -> int:
        return self.expected_element_count

    @property
    def byte_count(self) -> int:
        return self.expected_byte_count

    def at(self, index: int) -> F64LEBits:
        """Return the element at an exact integer index."""

        if type(index) is not int:
            raise TypeError("integer_index_required")
        if index < 0 or index >= self.expected_element_count:
            raise IndexError("binary64_element_index_out_of_range")
        offset = index * _F64LE_BYTE_LENGTH
        return F64LEBits(self.exact_bytes[offset : offset + _F64LE_BYTE_LENGTH])

    def __iter__(self) -> Iterator[F64LEBits]:
        for index in range(self.expected_element_count):
            yield self.at(index)

    def iter_indexed(self) -> Iterator[tuple[int, F64LEBits]]:
        """Yield ``(index, element)`` pairs in ascending index order."""

        for index in range(self.expected_element_count):
            yield index, self.at(index)


def _require_exact_view(view: F64LEBitView) -> None:
    if type(view) is not F64LEBitView:
        raise F64LEBitsError("exact_f64le_bit_view_required")


def validate_finite(view: F64LEBitView) -> None:
    """Reject the first non-finite element in ascending index order."""

    _require_exact_view(view)
    for index, element in view.iter_indexed():
        if not element.is_finite:
            raise F64LEValidationError("nonfinite_binary64_forbidden", index)


def validate_no_negative_zero(view: F64LEBitView) -> None:
    """Reject the first negative-zero element in ascending index order."""

    _require_exact_view(view)
    for index, element in view.iter_indexed():
        if element.is_negative_zero:
            raise F64LEValidationError("negative_zero_forbidden", index)


def validate_finite_no_negative_zero(view: F64LEBitView) -> None:
    """Reject the first non-finite or negative-zero element by payload index."""

    _require_exact_view(view)
    for index, element in view.iter_indexed():
        if not element.is_finite:
            raise F64LEValidationError("nonfinite_binary64_forbidden", index)
        if element.is_negative_zero:
            raise F64LEValidationError("negative_zero_forbidden", index)
