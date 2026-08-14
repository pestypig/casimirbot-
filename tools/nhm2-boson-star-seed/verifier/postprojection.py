"""Independent replay of the frozen MPFR-256 postprojection map.

The producer's NumPy projection is intentionally not imported.  This module
starts from the six securely retained raw-node byte strings, regenerates the
analytic angular coordinate, executes the identity-weight normal equations in
the exact frozen loop order, applies the frozen masks and phase rule, and
compares complete reconstructed byte strings with N32.

The result is arithmetic evidence only.  It does not establish runtime
provenance, same-attempt execution, registration, seed admission, or any
physical claim.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
import struct
from typing import Final, Generic, Sequence, TypeVar

from .errors import block
from .mpfr_backend import MpfrBackend
from .rndn256 import MpfrRndn256Arithmetic, Rndn256Arithmetic
from .v3_inputs import (
    N32_INVENTORY,
    R6_INVENTORY,
    N32Observation,
    R6Observation,
    r6_domain_sha256,
)


ValueT = TypeVar("ValueT")

_LEVELS: Final[tuple[tuple[str, int, int], ...]] = (
    ("L0", 64, 32),
    ("L1", 96, 48),
    ("L2", 128, 64),
)
_N32_ROLE_COUNT: Final[int] = 8
_SCALAR_BASE_ROLE: Final[int] = 2
_POTENTIAL_BASE_ROLE: Final[int] = 3
_SCALAR_MULTIPOLE_ROLE: Final[int] = 6
_POTENTIAL_MULTIPOLE_ROLE: Final[int] = 7
_ANALYTIC_Z_PINS: Final[tuple[tuple[int, str], ...]] = (
    (32, "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152"),
    (48, "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c"),
    (64, "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28"),
)


@dataclass(frozen=True, slots=True)
class PostprojectionLevelReplay:
    level_id: str
    radial_node_count: int
    angular_node_count: int
    mode_count: int
    provisional_a1_bits: str
    final_a1_bits: str
    phase_sign: int
    computed_scalar_multipole_bytes: bytes
    computed_potential_multipole_bytes: bytes
    computed_scalar_base_bytes: bytes
    computed_potential_base_bytes: bytes
    scalar_multipole_match: bool
    potential_multipole_match: bool
    scalar_base_match: bool
    potential_base_match: bool
    all_symbolic_masks_positive_zero: bool
    all_matches: bool

    def __post_init__(self) -> None:
        expected_level = next(
            (entry for entry in _LEVELS if entry[0] == self.level_id), None
        )
        exact_boolean_fields = (
            self.scalar_multipole_match,
            self.potential_multipole_match,
            self.scalar_base_match,
            self.potential_base_match,
            self.all_symbolic_masks_positive_zero,
            self.all_matches,
        )
        if (
            type(self.level_id) is not str
            or not self.level_id
            or type(self.radial_node_count) is not int
            or type(self.angular_node_count) is not int
            or type(self.mode_count) is not int
            or self.radial_node_count <= 0
            or self.angular_node_count <= 0
            or self.angular_node_count % 2 != 0
            or (
                expected_level is not None
                and (
                    self.level_id,
                    self.radial_node_count,
                    self.angular_node_count,
                )
                != expected_level
            )
            or self.mode_count != self.angular_node_count // 2
            or type(self.phase_sign) is not int
            or self.phase_sign not in (-1, 1)
            or type(self.provisional_a1_bits) is not str
            or type(self.final_a1_bits) is not str
            or not _is_canonical_finite_f64_bits(self.provisional_a1_bits)
            or not _is_canonical_positive_f64_bits(self.final_a1_bits)
            or any(type(value) is not bool for value in exact_boolean_fields)
        ):
            block(
                "postprojection",
                "exact_level_replay_shape_required",
                repr(self.level_id),
            )
        expected_multipole_bytes = 8 * self.radial_node_count * self.mode_count
        expected_base_bytes = (
            8 * self.radial_node_count * self.angular_node_count
        )
        for label, payload, expected_size in (
            (
                "computed_scalar_multipole_bytes",
                self.computed_scalar_multipole_bytes,
                expected_multipole_bytes,
            ),
            (
                "computed_potential_multipole_bytes",
                self.computed_potential_multipole_bytes,
                expected_multipole_bytes,
            ),
            (
                "computed_scalar_base_bytes",
                self.computed_scalar_base_bytes,
                expected_base_bytes,
            ),
            (
                "computed_potential_base_bytes",
                self.computed_potential_base_bytes,
                expected_base_bytes,
            ),
        ):
            _require_canonical_finite_f64le_payload(payload, expected_size, label)
        expected_all_matches = (
            self.scalar_multipole_match
            and self.potential_multipole_match
            and self.scalar_base_match
            and self.potential_base_match
            and self.all_symbolic_masks_positive_zero
        )
        if self.all_matches is not expected_all_matches:
            block(
                "postprojection",
                "level_replay_conjunction_mismatch",
                self.level_id,
            )


@dataclass(frozen=True, slots=True)
class PostprojectionMathReplay:
    levels: tuple[PostprojectionLevelReplay, ...]
    all_levels_match: bool
    verifier_calculation_implemented: bool = True
    runtime_conformance_established: bool = False
    observation_provenance_established: bool = False
    same_attempt_established: bool = False
    authoritative_registration_allowed: bool = False
    seed_admission_granted: bool = False
    artifact_admission_granted: bool = False
    physical_claim_allowed: bool = False

    def __post_init__(self) -> None:
        if (
            type(self.levels) is not tuple
            or len(self.levels) != len(_LEVELS)
            or any(type(level) is not PostprojectionLevelReplay for level in self.levels)
            or any(
                (
                    level.level_id,
                    level.radial_node_count,
                    level.angular_node_count,
                )
                != expected
                for level, expected in zip(self.levels, _LEVELS, strict=True)
            )
            or type(self.all_levels_match) is not bool
            or self.all_levels_match
            is not all(level.all_matches for level in self.levels)
            or self.verifier_calculation_implemented is not True
            or self.runtime_conformance_established is not False
            or self.observation_provenance_established is not False
            or self.same_attempt_established is not False
            or self.authoritative_registration_allowed is not False
            or self.seed_admission_granted is not False
            or self.artifact_admission_granted is not False
            or self.physical_claim_allowed is not False
        ):
            block(
                "postprojection",
                "exact_non_authoritative_result_shape_required",
                "math_replay",
            )


class _Work(Generic[ValueT]):
    """Small exact-operation helper with explicit destination ownership."""

    __slots__ = ("arithmetic",)

    def __init__(self, arithmetic: Rndn256Arithmetic[ValueT]) -> None:
        self.arithmetic = arithmetic

    def fresh_int(self, value: int) -> ValueT:
        result = self.arithmetic.new()
        self.arithmetic.set_int(result, value)
        return result

    def fresh_f64(self, value: float) -> ValueT:
        result = self.arithmetic.new()
        self.arithmetic.set_f64(result, value)
        return result

    def fresh_rational(self, numerator: int, denominator: int) -> ValueT:
        result = self.arithmetic.new()
        self.arithmetic.set_rational(result, numerator, denominator)
        return result

    def fresh_copy(self, source: ValueT) -> ValueT:
        result = self.arithmetic.new()
        self.arithmetic.copy(result, source)
        return result

    def close(self) -> None:
        return


def _decode_f64le(raw: bytes, count: int, label: str) -> tuple[float, ...]:
    if type(raw) is not bytes or len(raw) != 8 * count:
        block("postprojection", "exact_f64le_byte_length_required", label)
    result: list[float] = []
    for index in range(count):
        chunk = raw[8 * index : 8 * (index + 1)]
        bits = int.from_bytes(chunk, "little", signed=False)
        if bits == 0x8000000000000000:
            block("postprojection", "negative_zero_forbidden", f"{label}:{index}")
        value = struct.unpack("<d", chunk)[0]
        if not math.isfinite(value):
            block("postprojection", "finite_binary64_required", f"{label}:{index}")
        result.append(value)
    return tuple(result)


def _f64_bytes(values: Sequence[float]) -> bytes:
    output = bytearray(8 * len(values))
    for index, value in enumerate(values):
        if not math.isfinite(value):
            block("postprojection", "nonfinite_output_barrier", str(index))
        canonical = 0.0 if value == 0.0 else value
        struct.pack_into("<d", output, 8 * index, canonical)
    return bytes(output)


def _f64_bits(value: float) -> str:
    canonical = 0.0 if value == 0.0 else value
    return struct.pack(">d", canonical).hex()


def _is_canonical_finite_f64_bits(bits: str) -> bool:
    if (
        type(bits) is not str
        or len(bits) != 16
        or any(character not in "0123456789abcdef" for character in bits)
        or bits == "8000000000000000"
    ):
        return False
    return math.isfinite(struct.unpack(">d", bytes.fromhex(bits))[0])


def _is_canonical_positive_f64_bits(bits: str) -> bool:
    return _is_canonical_finite_f64_bits(bits) and struct.unpack(
        ">d", bytes.fromhex(bits)
    )[0] > 0.0


def _require_canonical_finite_f64le_payload(
    payload: bytes, expected_size: int, label: str
) -> None:
    if type(payload) is not bytes or len(payload) != expected_size:
        block("postprojection", "exact_result_payload_size_required", label)
    for offset in range(0, expected_size, 8):
        chunk = payload[offset : offset + 8]
        if chunk == b"\x00\x00\x00\x00\x00\x00\x00\x80" or not math.isfinite(
            struct.unpack("<d", chunk)[0]
        ):
            block(
                "postprojection",
                "canonical_finite_result_payload_required",
                f"{label}:{offset // 8}",
            )


def _validate_observations(
    n32: Sequence[N32Observation], r6: Sequence[R6Observation]
) -> tuple[tuple[N32Observation, ...], tuple[R6Observation, ...]]:
    if type(n32) is not tuple or type(r6) is not tuple:
        block("postprojection", "exact_observation_tuples_required", "N32_and_R6")
    frozen_n32 = n32
    frozen_r6 = r6
    if len(frozen_n32) != len(N32_INVENTORY):
        block("postprojection", "exact_n32_inventory_required", str(len(frozen_n32)))
    if len(frozen_r6) != len(R6_INVENTORY):
        block("postprojection", "exact_r6_inventory_required", str(len(frozen_r6)))
    for spec, observation in zip(N32_INVENTORY, frozen_n32, strict=True):
        if type(observation) is not N32Observation:
            block("postprojection", "exact_n32_observation_type_required", spec.relative_path)
        if (
            type(observation.inventory_index) is not int
            or type(observation.relative_path) is not str
            or type(observation.path) is not str
            or type(observation.byte_length) is not int
            or type(observation.raw_bytes) is not bytes
            or type(observation.plain_sha256) is not str
        ):
            block(
                "postprojection",
                "exact_n32_observation_field_types_required",
                spec.relative_path,
            )
        if (
            observation.inventory_index != spec.inventory_index
            or observation.relative_path != spec.relative_path
            or observation.path != spec.canonical_absolute_path
            or observation.byte_length != spec.byte_length
            or len(observation.raw_bytes) != spec.byte_length
            or hashlib.sha256(observation.raw_bytes).hexdigest()
            != observation.plain_sha256
        ):
            block("postprojection", "n32_observation_inventory_mismatch", spec.relative_path)
    for spec, observation in zip(R6_INVENTORY, frozen_r6, strict=True):
        if type(observation) is not R6Observation:
            block("postprojection", "exact_r6_observation_type_required", spec.relative_path)
        if (
            type(observation.evidence_index) is not int
            or type(observation.relative_path) is not str
            or type(observation.path) is not str
            or type(observation.byte_length) is not int
            or type(observation.raw_bytes) is not bytes
            or type(observation.plain_sha256) is not str
            or type(observation.domain_sha256) is not str
        ):
            block(
                "postprojection",
                "exact_r6_observation_field_types_required",
                spec.relative_path,
            )
        if (
            observation.evidence_index != spec.evidence_index
            or observation.relative_path != spec.relative_path
            or observation.path != spec.canonical_absolute_path
            or observation.byte_length != spec.byte_length
            or len(observation.raw_bytes) != spec.byte_length
            or hashlib.sha256(observation.raw_bytes).hexdigest()
            != observation.plain_sha256
            or r6_domain_sha256(spec, observation.raw_bytes)
            != observation.domain_sha256
        ):
            block("postprojection", "r6_observation_inventory_mismatch", spec.relative_path)
    return frozen_n32, frozen_r6


def _analytic_z(
    work: _Work[ValueT], pi: ValueT, angular_count: int
) -> list[float]:
    arithmetic = work.arithmetic
    values: list[float] = []
    serialized = bytearray()
    for index in range(angular_count):
        arithmetic.clear_flags()
        if index == 0:
            rho = work.fresh_int(0)
            theta = work.fresh_int(0)
            z = work.fresh_int(1)
            try:
                z_bits = arithmetic.get_f64(z)
                serialized.extend(struct.pack("<d", z_bits))
                reinjected = work.fresh_f64(z_bits)
                arithmetic.clear(reinjected)
                values.append(z_bits)
            finally:
                arithmetic.clear(z)
                arithmetic.clear(theta)
                arithmetic.clear(rho)
            continue
        if index == angular_count - 1:
            # The frozen endpoint still executes theta=RN256(pi/exact_2),
            # while rho=exact_1 and z=symbolic_+0 require no arithmetic.
            rho = work.fresh_int(1)
            two = work.fresh_int(2)
            endpoint_theta = arithmetic.new()
            z = work.fresh_int(0)
            try:
                arithmetic.divide(endpoint_theta, pi, two)
                z_bits = arithmetic.get_f64(z)
                serialized.extend(struct.pack("<d", z_bits))
                reinjected = work.fresh_f64(z_bits)
                arithmetic.clear(reinjected)
                values.append(z_bits)
            finally:
                arithmetic.clear(z)
                arithmetic.clear(endpoint_theta)
                arithmetic.clear(two)
                arithmetic.clear(rho)
            continue
        index_value = work.fresh_int(index)
        argument = arithmetic.new()
        denominator = work.fresh_int(angular_count - 1)
        lobatto_cosine = arithmetic.new()
        one = work.fresh_int(1)
        difference = arithmetic.new()
        two = work.fresh_int(2)
        rho = arithmetic.new()
        theta_numerator = arithmetic.new()
        four = work.fresh_int(4)
        theta = arithmetic.new()
        z = arithmetic.new()
        try:
            arithmetic.multiply(argument, pi, index_value)
            arithmetic.divide(argument, argument, denominator)
            arithmetic.cosine(lobatto_cosine, argument)
            arithmetic.subtract(difference, one, lobatto_cosine)
            # rho is part of the imported common program even though the
            # postprojection z-only context deliberately skips rhoBits.
            arithmetic.divide(rho, difference, two)
            arithmetic.multiply(theta_numerator, pi, difference)
            arithmetic.divide(theta, theta_numerator, four)
            arithmetic.cosine(z, theta)
            # The imported graph has a z-only binary64 barrier followed by
            # exact reinjection before Legendre evaluation.
            z_bits = arithmetic.get_f64(z)
            serialized.extend(struct.pack("<d", z_bits))
            reinjected = work.fresh_f64(z_bits)
            arithmetic.clear(reinjected)
            values.append(z_bits)
        finally:
            arithmetic.clear(z)
            arithmetic.clear(theta)
            arithmetic.clear(four)
            arithmetic.clear(theta_numerator)
            arithmetic.clear(rho)
            arithmetic.clear(two)
            arithmetic.clear(difference)
            arithmetic.clear(one)
            arithmetic.clear(lobatto_cosine)
            arithmetic.clear(denominator)
            arithmetic.clear(argument)
            arithmetic.clear(index_value)
    expected_sha256 = next(
        (digest for count, digest in _ANALYTIC_Z_PINS if count == angular_count),
        None,
    )
    if expected_sha256 is None:
        block(
            "postprojection",
            "frozen_analytic_z_pin_required",
            str(angular_count),
        )
    if hashlib.sha256(serialized).hexdigest() != expected_sha256:
        block(
            "postprojection",
            "serialized_analytic_z_pin_mismatch",
            str(angular_count),
        )
    return values


def _basis(
    work: _Work[ValueT], z_values: Sequence[float], mode_count: int, *, odd: bool
) -> list[list[ValueT]]:
    arithmetic = work.arithmetic
    maximum = 2 * mode_count - (1 if odd else 2)
    selected_parity = 1 if odd else 0
    rows: list[list[ValueT]] = []
    for z_bits in z_values:
        arithmetic.clear_flags()
        z = work.fresh_f64(z_bits)
        modes: list[ValueT] = [work.fresh_int(1)]
        if maximum >= 1:
            modes.append(z)
        for ell in range(1, maximum):
            coefficient = work.fresh_int(2 * ell + 1)
            t0 = arithmetic.new()
            t1 = arithmetic.new()
            ell_value = work.fresh_int(ell)
            t2 = arithmetic.new()
            t3 = arithmetic.new()
            divisor = work.fresh_int(ell + 1)
            next_mode = arithmetic.new()
            try:
                arithmetic.multiply(t0, coefficient, z)
                arithmetic.multiply(t1, t0, modes[ell])
                arithmetic.multiply(t2, ell_value, modes[ell - 1])
                arithmetic.subtract(t3, t1, t2)
                arithmetic.divide(next_mode, t3, divisor)
                modes.append(next_mode)
            finally:
                arithmetic.clear(divisor)
                arithmetic.clear(t3)
                arithmetic.clear(t2)
                arithmetic.clear(ell_value)
                arithmetic.clear(t1)
                arithmetic.clear(t0)
                arithmetic.clear(coefficient)
        row: list[ValueT] = []
        for degree in range(selected_parity, maximum + 1, 2):
            row.append(modes[degree])
        for degree, value in enumerate(modes):
            if degree % 2 != selected_parity:
                arithmetic.clear(value)
        if maximum < 1:
            arithmetic.clear(z)
        if len(row) != mode_count:
            block("postprojection", "basis_mode_count_invariant", str(len(row)))
        rows.append(row)
    return rows


def _gram_and_cholesky(
    work: _Work[ValueT], basis: Sequence[Sequence[ValueT]]
) -> tuple[list[list[ValueT]], list[list[ValueT]]]:
    arithmetic = work.arithmetic
    angular_count = len(basis)
    mode_count = len(basis[0])
    gram_optional: list[list[ValueT | None]] = [
        [None for _ in range(mode_count)] for _ in range(mode_count)
    ]
    product = arithmetic.new()
    try:
        for left in range(mode_count):
            for right in range(left + 1):
                arithmetic.clear_flags()
                accumulator = work.fresh_int(0)
                try:
                    for index in range(angular_count):
                        arithmetic.multiply(
                            product, basis[index][left], basis[index][right]
                        )
                        arithmetic.add(accumulator, accumulator, product)
                    gram_optional[left][right] = accumulator
                    if left != right:
                        symmetric = arithmetic.new()
                        arithmetic.copy(symmetric, accumulator)
                        gram_optional[right][left] = symmetric
                except BaseException:
                    arithmetic.clear(accumulator)
                    raise
    finally:
        arithmetic.clear(product)

    if any(value is None for row in gram_optional for value in row):
        block("postprojection", "incomplete_gram_matrix", str(mode_count))
    gram: list[list[ValueT]] = [
        [value for value in row if value is not None] for row in gram_optional
    ]

    factor_optional: list[list[ValueT | None]] = [
        [None for _ in range(mode_count)] for _ in range(mode_count)
    ]
    product = arithmetic.new()
    try:
        for row in range(mode_count):
            arithmetic.clear_flags()
            for column in range(row):
                residual = arithmetic.new()
                arithmetic.copy(residual, gram[row][column])
                try:
                    for inner in range(column):
                        left = factor_optional[row][inner]
                        right = factor_optional[column][inner]
                        if left is None or right is None:
                            block(
                                "postprojection",
                                "incomplete_cholesky_factor",
                                f"{row}:{column}:{inner}",
                            )
                        arithmetic.multiply(product, left, right)
                        arithmetic.subtract(residual, residual, product)
                    divisor = factor_optional[column][column]
                    if divisor is None:
                        block(
                            "postprojection",
                            "incomplete_cholesky_diagonal",
                            str(column),
                        )
                    value = arithmetic.new()
                    arithmetic.divide(value, residual, divisor)
                    factor_optional[row][column] = value
                finally:
                    arithmetic.clear(residual)
            residual = arithmetic.new()
            arithmetic.copy(residual, gram[row][row])
            try:
                for inner in range(row):
                    entry = factor_optional[row][inner]
                    if entry is None:
                        block(
                            "postprojection",
                            "incomplete_cholesky_factor",
                            f"{row}:{inner}",
                        )
                    arithmetic.multiply(product, entry, entry)
                    arithmetic.subtract(residual, residual, product)
                if arithmetic.compare_zero(residual) <= 0:
                    block("postprojection", "nonpositive_cholesky_pivot", str(row))
                diagonal = arithmetic.new()
                arithmetic.square_root(diagonal, residual)
                if arithmetic.compare_zero(diagonal) <= 0:
                    arithmetic.clear(diagonal)
                    block("postprojection", "nonpositive_cholesky_diagonal", str(row))
                factor_optional[row][row] = diagonal
            finally:
                arithmetic.clear(residual)
    finally:
        arithmetic.clear(product)
    factor = [
        [value for value in row[: row_index + 1] if value is not None]
        for row_index, row in enumerate(factor_optional)
    ]
    if any(len(row) != row_index + 1 for row_index, row in enumerate(factor)):
        block("postprojection", "incomplete_cholesky_factor", str(mode_count))
    return gram, factor


def _project_rows(
    work: _Work[ValueT],
    basis: Sequence[Sequence[ValueT]],
    factor: Sequence[Sequence[ValueT]],
    raw_values: Sequence[float],
    radial_count: int,
) -> list[float]:
    arithmetic = work.arithmetic
    angular_count = len(basis)
    mode_count = len(basis[0])
    output = [0.0] * (radial_count * mode_count)
    product = arithmetic.new()
    accumulator = arithmetic.new()
    try:
        for radial in range(radial_count):
            arithmetic.clear_flags()
            y = [work.fresh_f64(raw_values[radial * angular_count + k]) for k in range(angular_count)]
            h: list[ValueT] = []
            forward: list[ValueT] = []
            coefficients_optional: list[ValueT | None] = [None] * mode_count
            try:
                for mode in range(mode_count):
                    arithmetic.set_int(accumulator, 0)
                    for angular in range(angular_count):
                        arithmetic.multiply(product, basis[angular][mode], y[angular])
                        arithmetic.add(accumulator, accumulator, product)
                    h.append(work.fresh_copy(accumulator))
                for row in range(mode_count):
                    arithmetic.copy(accumulator, h[row])
                    for inner in range(row):
                        arithmetic.multiply(product, factor[row][inner], forward[inner])
                        arithmetic.subtract(accumulator, accumulator, product)
                    forward_value = arithmetic.new()
                    arithmetic.divide(
                        forward_value, accumulator, factor[row][row]
                    )
                    forward.append(forward_value)
                for row in range(mode_count - 1, -1, -1):
                    arithmetic.copy(accumulator, forward[row])
                    for inner in range(row + 1, mode_count):
                        coefficient = coefficients_optional[inner]
                        if coefficient is None:
                            block(
                                "postprojection",
                                "incomplete_backward_solution",
                                f"{radial}:{inner}",
                            )
                        arithmetic.multiply(product, factor[inner][row], coefficient)
                        arithmetic.subtract(accumulator, accumulator, product)
                    coefficient = arithmetic.new()
                    arithmetic.divide(coefficient, accumulator, factor[row][row])
                    coefficients_optional[row] = coefficient
                if any(value is None for value in coefficients_optional):
                    block(
                        "postprojection",
                        "incomplete_backward_solution",
                        str(radial),
                    )
                coefficients = [
                    value for value in coefficients_optional if value is not None
                ]
                # The solve runs backward, but the frozen traversal and the
                # one coefficient barrier run q-ascending after the complete
                # row solution exists.
                for mode in range(mode_count):
                    output[radial * mode_count + mode] = arithmetic.get_f64(
                        coefficients[mode]
                    )
            finally:
                for value in coefficients_optional:
                    if value is not None:
                        arithmetic.clear(value)
                for value in forward:
                    arithmetic.clear(value)
                for value in h:
                    arithmetic.clear(value)
                for value in y:
                    arithmetic.clear(value)
    finally:
        arithmetic.clear(accumulator)
        arithmetic.clear(product)
    return output


def _mask_multipoles(
    scalar: list[float], potential: list[float], radial_count: int, mode_count: int
) -> None:
    for mode in range(mode_count):
        scalar[mode] = 0.0
        scalar[(radial_count - 1) * mode_count + mode] = 0.0
        potential[(radial_count - 1) * mode_count + mode] = 0.0


def _dct_a1(
    work: _Work[ValueT],
    pi: ValueT,
    coefficients: Sequence[float],
    radial_count: int,
    mode_count: int,
) -> ValueT:
    arithmetic = work.arithmetic
    n = radial_count - 1
    total_a1 = work.fresh_int(0)
    product = arithmetic.new()
    accumulator = arithmetic.new()
    angle = arithmetic.new()
    cosine = arithmetic.new()
    term = arithmetic.new()
    derivative_sum = arithmetic.new()
    try:
        for mode in range(mode_count):
            arithmetic.clear_flags()
            f = [
                work.fresh_f64(coefficients[j * mode_count + mode])
                for j in range(radial_count)
            ]
            dct: list[ValueT] = []
            try:
                for order in range(radial_count):
                    initial_half = work.fresh_rational(1, 2)
                    try:
                        arithmetic.multiply(accumulator, initial_half, f[0])
                    finally:
                        arithmetic.clear(initial_half)
                    for radial in range(1, n):
                        order_value = work.fresh_int(order)
                        try:
                            arithmetic.multiply(angle, pi, order_value)
                        finally:
                            arithmetic.clear(order_value)
                        radial_value = work.fresh_int(radial)
                        try:
                            arithmetic.multiply(angle, angle, radial_value)
                        finally:
                            arithmetic.clear(radial_value)
                        n_value = work.fresh_int(n)
                        try:
                            arithmetic.divide(angle, angle, n_value)
                        finally:
                            arithmetic.clear(n_value)
                        arithmetic.cosine(cosine, angle)
                        arithmetic.multiply(term, f[radial], cosine)
                        arithmetic.add(accumulator, accumulator, term)
                    endpoint_half = work.fresh_rational(1, 2)
                    endpoint = arithmetic.new()
                    endpoint_sign = work.fresh_int(-1 if order % 2 else 1)
                    try:
                        arithmetic.multiply(endpoint, endpoint_half, f[n])
                        arithmetic.multiply(endpoint, endpoint, endpoint_sign)
                        arithmetic.add(accumulator, accumulator, endpoint)
                    finally:
                        arithmetic.clear(endpoint_sign)
                        arithmetic.clear(endpoint)
                        arithmetic.clear(endpoint_half)
                    two_over_n = work.fresh_rational(2, n)
                    dct_value = arithmetic.new()
                    try:
                        arithmetic.multiply(dct_value, two_over_n, accumulator)
                    finally:
                        arithmetic.clear(two_over_n)
                    dct.append(dct_value)
                two = work.fresh_int(2)
                try:
                    arithmetic.divide(dct[0], dct[0], two)
                finally:
                    arithmetic.clear(two)
                two = work.fresh_int(2)
                try:
                    arithmetic.divide(dct[n], dct[n], two)
                finally:
                    arithmetic.clear(two)
                arithmetic.set_int(derivative_sum, 0)
                for order in range(1, radial_count):
                    order_squared = work.fresh_int(order * order)
                    try:
                        arithmetic.multiply(product, order_squared, dct[order])
                    finally:
                        arithmetic.clear(order_squared)
                    arithmetic.add(derivative_sum, derivative_sum, product)
                negative_two = work.fresh_int(-2)
                try:
                    arithmetic.multiply(product, negative_two, derivative_sum)
                finally:
                    arithmetic.clear(negative_two)
                arithmetic.add(total_a1, total_a1, product)
            finally:
                for value in dct:
                    arithmetic.clear(value)
                for value in f:
                    arithmetic.clear(value)
        return total_a1
    finally:
        arithmetic.clear(derivative_sum)
        arithmetic.clear(term)
        arithmetic.clear(cosine)
        arithmetic.clear(angle)
        arithmetic.clear(accumulator)
        arithmetic.clear(product)


def _reconstruct(
    work: _Work[ValueT],
    z_values: Sequence[float],
    coefficients: Sequence[float],
    radial_count: int,
    mode_count: int,
    *,
    scalar: bool,
) -> list[float]:
    arithmetic = work.arithmetic
    angular_count = len(z_values)
    maximum = 2 * mode_count - (1 if scalar else 2)
    selected_parity = 1 if scalar else 0
    output = [0.0] * (radial_count * angular_count)
    accumulator = arithmetic.new()
    product = arithmetic.new()
    coefficient = arithmetic.new()
    try:
        for radial in range(radial_count):
            for angular in range(angular_count):
                arithmetic.clear_flags()
                masked = radial == radial_count - 1
                if scalar:
                    masked = masked or radial == 0 or angular == angular_count - 1
                if masked:
                    output[radial * angular_count + angular] = 0.0
                    continue
                z = work.fresh_f64(z_values[angular])
                modes: list[ValueT] = [work.fresh_int(1)]
                if maximum >= 1:
                    modes.append(z)
                try:
                    for ell in range(1, maximum):
                        coefficient_value = work.fresh_int(2 * ell + 1)
                        t0 = arithmetic.new()
                        t1 = arithmetic.new()
                        ell_value = work.fresh_int(ell)
                        t2 = arithmetic.new()
                        t3 = arithmetic.new()
                        divisor = work.fresh_int(ell + 1)
                        next_mode = arithmetic.new()
                        try:
                            arithmetic.multiply(t0, coefficient_value, z)
                            arithmetic.multiply(t1, t0, modes[ell])
                            arithmetic.multiply(t2, ell_value, modes[ell - 1])
                            arithmetic.subtract(t3, t1, t2)
                            arithmetic.divide(next_mode, t3, divisor)
                            modes.append(next_mode)
                        finally:
                            arithmetic.clear(divisor)
                            arithmetic.clear(t3)
                            arithmetic.clear(t2)
                            arithmetic.clear(ell_value)
                            arithmetic.clear(t1)
                            arithmetic.clear(t0)
                            arithmetic.clear(coefficient_value)
                    selected = [
                        modes[degree]
                        for degree in range(selected_parity, maximum + 1, 2)
                    ]
                    if len(selected) != mode_count:
                        block(
                            "postprojection",
                            "reconstruction_mode_count_invariant",
                            str(len(selected)),
                        )
                    arithmetic.set_int(accumulator, 0)
                    for mode in range(mode_count):
                        arithmetic.set_f64(
                            coefficient,
                            coefficients[radial * mode_count + mode],
                        )
                        arithmetic.multiply(product, coefficient, selected[mode])
                        arithmetic.add(accumulator, accumulator, product)
                    output[radial * angular_count + angular] = arithmetic.get_f64(
                        accumulator
                    )
                finally:
                    for value in modes:
                        arithmetic.clear(value)
                    if maximum < 1:
                        arithmetic.clear(z)
    finally:
        arithmetic.clear(coefficient)
        arithmetic.clear(product)
        arithmetic.clear(accumulator)
    return output


def _all_masks_positive_zero(
    scalar_multipoles: bytes,
    potential_multipoles: bytes,
    scalar_base: bytes,
    potential_base: bytes,
    radial_count: int,
    angular_count: int,
) -> bool:
    zero = b"\x00" * 8
    mode_count = angular_count // 2
    scalar_multipole_indices = tuple(range(mode_count)) + tuple(
        range((radial_count - 1) * mode_count, radial_count * mode_count)
    )
    potential_multipole_indices = tuple(
        range((radial_count - 1) * mode_count, radial_count * mode_count)
    )
    scalar_base_indices = set(range(angular_count))
    scalar_base_indices.update(
        range((radial_count - 1) * angular_count, radial_count * angular_count)
    )
    scalar_base_indices.update(
        radial * angular_count + angular_count - 1 for radial in range(radial_count)
    )
    potential_base_indices = tuple(
        range((radial_count - 1) * angular_count, radial_count * angular_count)
    )
    return all(
        raw[8 * index : 8 * (index + 1)] == zero
        for raw, indices in (
            (scalar_multipoles, scalar_multipole_indices),
            (potential_multipoles, potential_multipole_indices),
            (scalar_base, tuple(scalar_base_indices)),
            (potential_base, potential_base_indices),
        )
        for index in indices
    )


def _clear_matrix(arithmetic: Rndn256Arithmetic[ValueT], matrix: Sequence[Sequence[ValueT]]) -> None:
    for row in matrix:
        for value in row:
            arithmetic.clear(value)


def _project_field(
    work: _Work[ValueT],
    z_values: Sequence[float],
    raw_values: Sequence[float],
    radial_count: int,
    mode_count: int,
    *,
    odd: bool,
) -> list[float]:
    arithmetic = work.arithmetic
    basis = _basis(work, z_values, mode_count, odd=odd)
    gram, factor = _gram_and_cholesky(work, basis)
    try:
        return _project_rows(work, basis, factor, raw_values, radial_count)
    finally:
        _clear_matrix(arithmetic, factor)
        _clear_matrix(arithmetic, gram)
        _clear_matrix(arithmetic, basis)


def _replay_level(
    work: _Work[ValueT],
    level_id: str,
    radial_count: int,
    angular_count: int,
    raw_scalar_bytes: bytes,
    raw_potential_bytes: bytes,
    expected_scalar_multipole_bytes: bytes,
    expected_potential_multipole_bytes: bytes,
    expected_scalar_base_bytes: bytes,
    expected_potential_base_bytes: bytes,
) -> PostprojectionLevelReplay:
    arithmetic = work.arithmetic
    mode_count = angular_count // 2
    raw_count = radial_count * angular_count
    raw_scalar = _decode_f64le(raw_scalar_bytes, raw_count, f"{level_id}:raw_scalar")
    raw_potential = _decode_f64le(raw_potential_bytes, raw_count, f"{level_id}:raw_potential")
    pi = arithmetic.new()
    arithmetic.constant_pi(pi)
    z_values = _analytic_z(work, pi, angular_count)
    try:
        scalar_coefficients = _project_field(
            work,
            z_values,
            raw_scalar,
            radial_count,
            mode_count,
            odd=True,
        )
        potential_coefficients = _project_field(
            work,
            z_values,
            raw_potential,
            radial_count,
            mode_count,
            odd=False,
        )
        _mask_multipoles(
            scalar_coefficients, potential_coefficients, radial_count, mode_count
        )
        provisional_a1 = _dct_a1(
            work, pi, scalar_coefficients, radial_count, mode_count
        )
        try:
            phase_comparison = arithmetic.compare_zero(provisional_a1)
            if phase_comparison == 0:
                block("postprojection", "zero_scalar_phase_rejected", level_id)
            provisional_a1_bits = _f64_bits(arithmetic.get_f64(provisional_a1))
            phase_sign = 1 if phase_comparison > 0 else -1
        finally:
            arithmetic.clear(provisional_a1)
        if phase_sign == -1:
            scalar_coefficients = [
                0.0 if value == 0.0 else -value for value in scalar_coefficients
            ]
        final_a1 = _dct_a1(
            work, pi, scalar_coefficients, radial_count, mode_count
        )
        try:
            if arithmetic.compare_zero(final_a1) <= 0:
                block("postprojection", "final_scalar_phase_not_positive", level_id)
            final_a1_value = arithmetic.get_f64(final_a1)
            if final_a1_value <= 0.0:
                block("postprojection", "final_a1_binary64_not_positive", level_id)
            final_a1_bits = _f64_bits(final_a1_value)
        finally:
            arithmetic.clear(final_a1)

        scalar_base = _reconstruct(
            work,
            z_values,
            scalar_coefficients,
            radial_count,
            mode_count,
            scalar=True,
        )
        potential_base = _reconstruct(
            work,
            z_values,
            potential_coefficients,
            radial_count,
            mode_count,
            scalar=False,
        )
        scalar_multipole_bytes = _f64_bytes(scalar_coefficients)
        potential_multipole_bytes = _f64_bytes(potential_coefficients)
        scalar_base_bytes = _f64_bytes(scalar_base)
        potential_base_bytes = _f64_bytes(potential_base)
        masks_positive = _all_masks_positive_zero(
            scalar_multipole_bytes,
            potential_multipole_bytes,
            scalar_base_bytes,
            potential_base_bytes,
            radial_count,
            angular_count,
        )
        scalar_multipole_match = (
            scalar_multipole_bytes == expected_scalar_multipole_bytes
        )
        potential_multipole_match = (
            potential_multipole_bytes == expected_potential_multipole_bytes
        )
        scalar_base_match = scalar_base_bytes == expected_scalar_base_bytes
        potential_base_match = potential_base_bytes == expected_potential_base_bytes
        all_matches = (
            scalar_multipole_match
            and potential_multipole_match
            and scalar_base_match
            and potential_base_match
            and masks_positive
        )
        return PostprojectionLevelReplay(
            level_id=level_id,
            radial_node_count=radial_count,
            angular_node_count=angular_count,
            mode_count=mode_count,
            provisional_a1_bits=provisional_a1_bits,
            final_a1_bits=final_a1_bits,
            phase_sign=phase_sign,
            computed_scalar_multipole_bytes=scalar_multipole_bytes,
            computed_potential_multipole_bytes=potential_multipole_bytes,
            computed_scalar_base_bytes=scalar_base_bytes,
            computed_potential_base_bytes=potential_base_bytes,
            scalar_multipole_match=scalar_multipole_match,
            potential_multipole_match=potential_multipole_match,
            scalar_base_match=scalar_base_match,
            potential_base_match=potential_base_match,
            all_symbolic_masks_positive_zero=masks_positive,
            all_matches=all_matches,
        )
    finally:
        arithmetic.clear(pi)


def _replay_with_arithmetic(
    arithmetic: Rndn256Arithmetic[ValueT],
    n32: Sequence[N32Observation],
    r6: Sequence[R6Observation],
) -> PostprojectionMathReplay:
    frozen_n32, frozen_r6 = _validate_observations(n32, r6)
    work = _Work(arithmetic)
    levels: list[PostprojectionLevelReplay] = []
    try:
        for level_index, (level_id, radial_count, angular_count) in enumerate(_LEVELS):
            n32_base = level_index * _N32_ROLE_COUNT
            r6_base = level_index * 2
            levels.append(
                _replay_level(
                    work,
                    level_id,
                    radial_count,
                    angular_count,
                    frozen_r6[r6_base].raw_bytes,
                    frozen_r6[r6_base + 1].raw_bytes,
                    frozen_n32[n32_base + _SCALAR_MULTIPOLE_ROLE].raw_bytes,
                    frozen_n32[n32_base + _POTENTIAL_MULTIPOLE_ROLE].raw_bytes,
                    frozen_n32[n32_base + _SCALAR_BASE_ROLE].raw_bytes,
                    frozen_n32[n32_base + _POTENTIAL_BASE_ROLE].raw_bytes,
                )
            )
    finally:
        work.close()
    frozen_levels = tuple(levels)
    return PostprojectionMathReplay(
        levels=frozen_levels,
        all_levels_match=len(frozen_levels) == 3
        and all(level.all_matches for level in frozen_levels),
    )


def replay_postprojection_math(
    backend: MpfrBackend,
    n32: Sequence[N32Observation],
    r6: Sequence[R6Observation],
) -> PostprojectionMathReplay:
    """Replay all three levels with one already-attested MPFR/GMP backend."""

    arithmetic = MpfrRndn256Arithmetic(backend)
    try:
        return _replay_with_arithmetic(arithmetic, n32, r6)
    finally:
        arithmetic.close()


__all__ = [
    "PostprojectionLevelReplay",
    "PostprojectionMathReplay",
    "replay_postprojection_math",
]
