"""Independent producer-side MPFR-256 postprojection map.

This module implements the complete in-memory L0/L1/L2 raw-nodal to
parity-multipole and same-level base-reconstruction map frozen by the
postprojection policy.  It deliberately imports no verifier code, performs no
filesystem mutation, emits no receipt, and grants no runtime, seed, solver,
scientific, gate, certificate, or physical authority.

The public boundary accepts only the two exact immutable little-endian
binary64 raw arrays for one frozen level.  Every arithmetic primitive is a
separate MPFR operation at precision 256 with round-to-nearest/ties-to-even,
under the frozen exponent range.  Binary64 exists only at the named raw input,
coefficient, phase-receipt, accepted-multipole, and final-reconstruction
barriers.

This is intentionally a diagnostic algorithm slice rather than a frozen
run-plan implementation: the currently frozen producer toolchain duty does not
close over the gmpy2 package.  A separately bound additive toolchain successor
is required before this code could acquire runtime compatibility or execution
authority.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, fields
import hashlib
from types import MappingProxyType
import struct
import threading
from typing import Final, Mapping, Sequence

import gmpy2


PRODUCER_POSTPROJECTION_SLICE_VERSION: Final[str] = (
    "nhm2_prolate_boson_star_newtonian_seed_producer_postprojection_slice/v1"
)
FROZEN_OPERATION_GRAPH_SHA256: Final[str] = (
    "091ec81bbe981363bb7e1b83897d2e18eede13f04ce17a45da955fb4814c3148"
)
FROZEN_OPERATION_GRAPH_CANONICAL_SIZE_BYTES: Final[int] = 28_272
FROZEN_BOUNDED_FIXTURES_SHA256: Final[str] = (
    "65d8ed4408cc5155952136961b548eab7a210b86a458cdcab91a4db5f6a192a8"
)
FROZEN_BOUNDED_FIXTURES_CANONICAL_SIZE_BYTES: Final[int] = 3_759

PRECISION_BITS: Final[int] = 256
ROUNDING_MODE: Final[int] = gmpy2.RoundToNearest
EMIN: Final[int] = -1_000_000
EMAX: Final[int] = 1_000_000

PINNED_GMPY2_VERSION: Final[str] = "2.3.1"
PINNED_MPFR_VERSION: Final[str] = "MPFR 4.2.2"
PINNED_GMP_VERSION: Final[str] = "GMP 6.3.0"

LEVEL_SHAPES: Final[Mapping[str, tuple[int, int]]] = MappingProxyType(
    {
        "L0": (64, 32),
        "L1": (96, 48),
        "L2": (128, 64),
    }
)
ANALYTIC_Z_F64LE_SHA256: Final[Mapping[str, str]] = MappingProxyType(
    {
        "L0": "43df86c4df06c23912e5081c50dacc95770cdb42ead94e76843b5cf1783b6152",
        "L1": "59b550cace75f27d7e0d09842d2a27c705865ab449a1a3a89e54a0b4afb3d46c",
        "L2": "e1a253f71ce0a71d52f062be5d20a817df5c8b2d6e86859464058d2a8ec26c28",
    }
)

AUTHORITY_LOCKS: Final[Mapping[str, bool]] = MappingProxyType(
    {
        "runtimeAuthority": False,
        "executionAuthority": False,
        "runPlanCompatibility": False,
        "gmpy2ToolchainDutyClosed": False,
        "producerProjectionAuthority": False,
        "replayReceiptAuthority": False,
        "seedAdmissionAuthority": False,
        "artifactAdmissionAuthority": False,
        "scientificAuthority": False,
        "gateAuthority": False,
        "certificateAuthority": False,
        "physicalAuthority": False,
        "propulsionAuthority": False,
        "transportAuthority": False,
    }
)

TOOLCHAIN_COMPATIBILITY: Final[Mapping[str, object]] = MappingProxyType(
    {
        "diagnosticOnly": True,
        "runPlanCompatible": False,
        "gmpy2ToolchainDutyClosed": False,
        "toolchainSuccessorRequired": True,
        "blocker": (
            "frozen_producer_toolchain_duty_does_not_close_over_gmpy2;"
            "additive_bound_toolchain_successor_required"
        ),
    }
)

_RUNTIME_LOCK = threading.Lock()
_SIGN_BIT = 1 << 63
_EXPONENT_MASK = 0x7FF << 52
_NEGATIVE_ZERO_BITS = _SIGN_BIT


class ProducerPostprojectionSliceError(RuntimeError):
    """Deterministic fail-closed error for this non-authoritative slice."""

    def __init__(self, code: str, detail: str | None = None) -> None:
        if type(code) is not str or not code:
            raise TypeError("error code must be an exact nonempty string")
        self.code = code
        self.detail = detail
        super().__init__(code if detail is None else f"{code}:{detail}")


@dataclass(frozen=True, slots=True)
class PrimitiveCounts:
    """Named frozen injection, primitive, barrier, and flag-clear call sites.

    Data-dependent helper canonicalization of a rounded signed zero is not an
    additional graph site and is therefore not counted here.
    """

    integer_set: int = 0
    symbolic_zero_set: int = 0
    binary64_set: int = 0
    rational_set: int = 0
    value_copy: int = 0
    const_pi: int = 0
    add: int = 0
    sub: int = 0
    mul: int = 0
    div: int = 0
    sqrt: int = 0
    cos: int = 0
    get_d: int = 0
    flag_clear: int = 0

    @property
    def arithmetic_total(self) -> int:
        return (
            self.const_pi
            + self.add
            + self.sub
            + self.mul
            + self.div
            + self.sqrt
            + self.cos
        )

    @property
    def primitive_total(self) -> int:
        """Frozen injections, arithmetic, barriers, and flag clears.

        Non-arithmetic immutable MPFR value copies are exposed separately.
        """

        return (
            self.integer_set
            + self.symbolic_zero_set
            + self.binary64_set
            + self.rational_set
            + self.arithmetic_total
            + self.get_d
            + self.flag_clear
        )

    @property
    def graph_site_total(self) -> int:
        return self.primitive_total + self.value_copy


@dataclass(frozen=True, slots=True)
class FrozenWorkPlan:
    level_id: str
    radial_node_count: int
    angular_node_count: int
    mode_count: int
    raw_array_byte_length: int
    multipole_array_byte_length: int
    base_array_byte_length: int
    scalar_multipole_mask_count: int
    potential_multipole_mask_count: int
    scalar_base_mask_count: int
    potential_base_mask_count: int
    total_input_byte_length: int
    total_output_byte_length: int
    analytic_z_record_count: int
    parity_basis_record_count: int
    gram_record_count: int
    cholesky_pivot_count: int
    projected_raw_row_count: int
    projection_coefficient_barrier_count: int
    phase_dct_record_count: int
    phase_dct_radial_mode_count: int
    reconstruction_slot_count: int
    reconstruction_evaluator_call_count: int
    symbolic_reconstruction_mask_count: int
    expected_counts: PrimitiveCounts


@dataclass(frozen=True, slots=True)
class PostprojectionLevelBytes:
    """Four frozen array payloads plus diagnostic-only internal observations."""

    schema_version: str
    level_id: str
    scalar_multipole_f64le: bytes
    potential_multipole_f64le: bytes
    base_scalar_f64le: bytes
    base_potential_f64le: bytes
    analytic_z_f64le_sha256: str
    scalar_phase_sign: int
    provisional_a1_bits: str
    final_a1_bits: str
    odd_cholesky_pivot_count: int
    even_cholesky_pivot_count: int
    work_plan: FrozenWorkPlan
    observed_counts: PrimitiveCounts
    diagnostic_map_evaluated_in_memory: bool
    output_emitted: bool
    receipt_emitted: bool
    solver_wired: bool
    diagnostic_only: bool
    run_plan_compatible: bool
    gmpy2_toolchain_duty_closed: bool
    toolchain_successor_required: bool
    toolchain_blocker: str
    runtime_authority: bool
    execution_authority: bool
    seed_admission_authority: bool
    scientific_authority: bool
    physical_authority: bool


class _MutableCounts:
    __slots__ = tuple(field.name for field in fields(PrimitiveCounts))

    def __init__(self) -> None:
        for name in self.__slots__:
            setattr(self, name, 0)

    def increment(self, name: str) -> None:
        setattr(self, name, getattr(self, name) + 1)

    def freeze(self) -> PrimitiveCounts:
        return PrimitiveCounts(
            **{name: int(getattr(self, name)) for name in self.__slots__}
        )


def _blocked(code: str, detail: str | None = None) -> None:
    raise ProducerPostprojectionSliceError(code, detail)


def _make_context() -> gmpy2.context:
    context = gmpy2.context(
        precision=PRECISION_BITS,
        round=ROUNDING_MODE,
        emin=EMIN,
        emax=EMAX,
        subnormalize=False,
        trap_underflow=False,
        trap_overflow=False,
        trap_inexact=False,
        trap_invalid=False,
        trap_erange=False,
        trap_divzero=False,
        allow_complex=False,
        rational_division=False,
        allow_release_gil=False,
    )
    return context


def _guard_runtime_identity() -> None:
    observed = (
        gmpy2.version(),
        gmpy2.mpfr_version(),
        gmpy2.mp_version(),
    )
    expected = (
        PINNED_GMPY2_VERSION,
        PINNED_MPFR_VERSION,
        PINNED_GMP_VERSION,
    )
    if observed != expected:
        _blocked("producer_mpfr_runtime_identity_mismatch", repr(observed))


def _guard_active_context(context: gmpy2.context) -> None:
    if (
        context.precision != PRECISION_BITS
        or context.round != ROUNDING_MODE
        or context.emin != EMIN
        or context.emax != EMAX
        or context.subnormalize is not False
        or context.allow_complex is not False
        or context.rational_division is not False
        or context.allow_release_gil is not False
    ):
        _blocked("producer_mpfr_context_mismatch")


def _guard_binary64_rndn_semantics(context: gmpy2.context) -> None:
    """Check ties-to-even and gradual underflow before the frozen graph."""

    cases = (
        (gmpy2.mpq(1, 1 << 1074), 0x0000_0000_0000_0001),
        (gmpy2.mpq(1, 1 << 1075), 0x0000_0000_0000_0000),
        (gmpy2.mpq(3, 1 << 1075), 0x0000_0000_0000_0002),
        (
            gmpy2.mpq((1 << 53) + 1, 1 << 53),
            0x3FF0_0000_0000_0000,
        ),
        (
            gmpy2.mpq((1 << 53) + 3, 1 << 53),
            0x3FF0_0000_0000_0002,
        ),
    )
    observed = tuple(
        struct.unpack(">Q", struct.pack(">d", float(gmpy2.mpfr(value, 256))))[0]
        for value, _ in cases
    )
    expected = tuple(bits for _, bits in cases)
    context.clear_flags()
    if observed != expected:
        _blocked("producer_binary64_rndn_or_gradual_underflow_mismatch")


class _Kernel:
    __slots__ = ("context", "counts")

    def __init__(self, context: gmpy2.context) -> None:
        self.context = context
        self.counts = _MutableCounts()

    def clear_flags(self) -> None:
        self.context.clear_flags()
        self.counts.increment("flag_clear")

    def _checked(self, value: gmpy2.mpfr, label: str) -> gmpy2.mpfr:
        if value.precision != PRECISION_BITS or not gmpy2.is_finite(value):
            _blocked("nonfinite_or_wrong_precision_mpfr", label)
        if value == 0:
            return gmpy2.mpfr(0, PRECISION_BITS)
        return value

    def integer(self, value: int) -> gmpy2.mpfr:
        if type(value) is not int:
            _blocked("exact_integer_required")
        self.counts.increment("integer_set")
        return self._checked(gmpy2.mpfr(value, PRECISION_BITS), "integer")

    def symbolic_zero(self) -> gmpy2.mpfr:
        self.counts.increment("symbolic_zero_set")
        return self._checked(gmpy2.mpfr(0, PRECISION_BITS), "zero")

    def from_float(self, value: float, label: str) -> gmpy2.mpfr:
        if type(value) is not float:
            _blocked("exact_binary64_required", label)
        self.counts.increment("binary64_set")
        return self._checked(gmpy2.mpfr(value, PRECISION_BITS), label)

    def rational(self, numerator: int, denominator: int) -> gmpy2.mpfr:
        if (
            type(numerator) is not int
            or type(denominator) is not int
            or denominator <= 0
        ):
            _blocked("canonical_exact_rational_required")
        self.counts.increment("rational_set")
        rational = gmpy2.mpq(numerator, denominator)
        return self._checked(gmpy2.mpfr(rational, PRECISION_BITS), "rational")

    def value_copy(self, value: gmpy2.mpfr) -> gmpy2.mpfr:
        """Materialize the contract's non-arithmetic MPFR value-copy site."""

        self.counts.increment("value_copy")
        return self._checked(copy.copy(value), "copy")

    def add(self, left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
        self.counts.increment("add")
        return self._checked(gmpy2.add(left, right), "add")

    def sub(self, left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
        self.counts.increment("sub")
        return self._checked(gmpy2.sub(left, right), "sub")

    def mul(self, left: gmpy2.mpfr, right: gmpy2.mpfr) -> gmpy2.mpfr:
        self.counts.increment("mul")
        return self._checked(gmpy2.mul(left, right), "mul")

    def div(self, numerator: gmpy2.mpfr, denominator: gmpy2.mpfr) -> gmpy2.mpfr:
        if denominator == 0:
            _blocked("mpfr_division_by_zero")
        self.counts.increment("div")
        return self._checked(gmpy2.div(numerator, denominator), "div")

    def sqrt(self, value: gmpy2.mpfr) -> gmpy2.mpfr:
        if value <= 0:
            _blocked("nonpositive_cholesky_pivot")
        self.counts.increment("sqrt")
        return self._checked(gmpy2.sqrt(value), "sqrt")

    def cos(self, value: gmpy2.mpfr) -> gmpy2.mpfr:
        self.counts.increment("cos")
        return self._checked(gmpy2.cos(value), "cos")

    def const_pi(self) -> gmpy2.mpfr:
        self.counts.increment("const_pi")
        return self._checked(gmpy2.const_pi(PRECISION_BITS), "const_pi")

    def get_d_bits(self, value: gmpy2.mpfr, label: str) -> str:
        self.counts.increment("get_d")
        binary64 = float(value)
        raw_bits = struct.unpack(">Q", struct.pack(">d", binary64))[0]
        if (raw_bits & _EXPONENT_MASK) == _EXPONENT_MASK:
            _blocked("nonfinite_binary64_barrier", label)
        if (raw_bits & ~_SIGN_BIT) == 0:
            raw_bits = 0
        return f"{raw_bits:016x}"


def _bits_to_float(bits: str, label: str) -> float:
    if type(bits) is not str or len(bits) != 16:
        _blocked("exact_binary64_bits_required", label)
    try:
        raw_bits = int(bits, 16)
    except ValueError:
        _blocked("exact_binary64_bits_required", label)
    if bits != f"{raw_bits:016x}":
        _blocked("lowercase_binary64_bits_required", label)
    if raw_bits == _NEGATIVE_ZERO_BITS:
        _blocked("negative_zero_forbidden", label)
    if (raw_bits & _EXPONENT_MASK) == _EXPONENT_MASK:
        _blocked("finite_binary64_required", label)
    return struct.unpack(">d", struct.pack(">Q", raw_bits))[0]


def _raw_f64le_to_rows(
    raw: bytes,
    radial_count: int,
    angular_count: int,
    label: str,
) -> list[list[str]]:
    if type(raw) is not bytes:
        _blocked("exact_immutable_bytes_required", label)
    expected = 8 * radial_count * angular_count
    if len(raw) != expected:
        _blocked("raw_array_byte_length_mismatch", label)
    rows: list[list[str]] = []
    offset = 0
    for radial_index in range(radial_count):
        row: list[str] = []
        for angular_index in range(angular_count):
            raw_bits = int.from_bytes(raw[offset : offset + 8], "little")
            bits = f"{raw_bits:016x}"
            _bits_to_float(bits, f"{label}:{radial_index}:{angular_index}")
            row.append(bits)
            offset += 8
        rows.append(row)
    if offset != expected:
        _blocked("raw_array_consumption_mismatch", label)
    return rows


def _bits_matrix_to_f64le(rows: Sequence[Sequence[str]], label: str) -> bytes:
    payload = bytearray()
    for row_index, row in enumerate(rows):
        for column_index, bits in enumerate(row):
            _bits_to_float(bits, f"{label}:{row_index}:{column_index}")
            payload.extend(int(bits, 16).to_bytes(8, "little"))
    return bytes(payload)


def _sign_flip_nonzero(bits: str) -> str:
    raw_bits = int(bits, 16)
    if (raw_bits & ~_SIGN_BIT) == 0:
        return "0000000000000000"
    return f"{raw_bits ^ _SIGN_BIT:016x}"


def _regenerate_analytic_z_bits(
    kernel: _Kernel,
    level_id: str,
    angular_count: int,
) -> tuple[list[str], gmpy2.mpfr]:
    pi256 = kernel.const_pi()
    result: list[str] = []
    for angular_index in range(angular_count):
        kernel.clear_flags()
        if angular_index == 0:
            # The exact prefix assigns symbolic rho=theta=+0 before exact z=1.
            kernel.symbolic_zero()
            kernel.symbolic_zero()
            result.append(
                kernel.get_d_bits(
                    kernel.integer(1),
                    "serialized_analytic_z_bits",
                )
            )
            continue
        if angular_index == angular_count - 1:
            # The imported endpoint graph still forms theta=RN256(pi/2), but
            # z is the required symbolic +0 before its included get-d barrier.
            kernel.integer(1)  # Exact endpoint rho, intentionally not reused.
            kernel.div(pi256, kernel.integer(2))
            result.append(
                kernel.get_d_bits(
                    kernel.symbolic_zero(),
                    "serialized_analytic_z_bits",
                )
            )
            continue
        argument = kernel.mul(pi256, kernel.integer(angular_index))
        argument = kernel.div(argument, kernel.integer(angular_count - 1))
        cosine = kernel.cos(argument)
        difference = kernel.sub(kernel.integer(1), cosine)
        # Required imported mapped-node prefix operation.  rho does not flow
        # onward in this z-only slice, but the operation may not be elided.
        kernel.div(difference, kernel.integer(2))
        theta_numerator = kernel.mul(pi256, difference)
        theta = kernel.div(theta_numerator, kernel.integer(4))
        z = kernel.cos(theta)
        result.append(kernel.get_d_bits(z, "serialized_analytic_z_bits"))

    raw = _bits_matrix_to_f64le((result,), f"{level_id}:analytic_z")
    digest = hashlib.sha256(raw).hexdigest()
    if digest != ANALYTIC_Z_F64LE_SHA256[level_id]:
        _blocked("analytic_z_bits_mismatch", f"{level_id}:{digest}")
    return result, pi256


def _legendre_basis(
    kernel: _Kernel,
    z_bits: Sequence[str],
    mode_count: int,
    *,
    odd: bool,
) -> list[list[gmpy2.mpfr]]:
    degrees = tuple(2 * q + (1 if odd else 0) for q in range(mode_count))
    basis: list[list[gmpy2.mpfr]] = []
    for angular_index, bits in enumerate(z_bits):
        kernel.clear_flags()
        basis.append(
            _legendre_row(
                kernel,
                bits,
                degrees,
                f"projection_basis:z:{angular_index}",
            )
        )
    return basis


def _legendre_row(
    kernel: _Kernel,
    z_bits: str,
    degrees: Sequence[int],
    label: str,
) -> list[gmpy2.mpfr]:
    maximum = degrees[-1]
    z = kernel.from_float(_bits_to_float(z_bits, label), label)
    polynomials = [kernel.integer(1)]
    if maximum >= 1:
        polynomials.append(z)
    for ell in range(1, maximum):
        t0 = kernel.mul(kernel.integer(2 * ell + 1), z)
        t1 = kernel.mul(t0, polynomials[ell])
        t2 = kernel.mul(kernel.integer(ell), polynomials[ell - 1])
        t3 = kernel.sub(t1, t2)
        polynomials.append(kernel.div(t3, kernel.integer(ell + 1)))
    return [polynomials[degree] for degree in degrees]


def _gram(
    kernel: _Kernel,
    basis: Sequence[Sequence[gmpy2.mpfr]],
    mode_count: int,
) -> list[list[gmpy2.mpfr]]:
    gram: list[list[gmpy2.mpfr | None]] = [
        [None for _ in range(mode_count)] for _ in range(mode_count)
    ]
    for a in range(mode_count):
        for b in range(a + 1):
            kernel.clear_flags()
            accumulator = kernel.integer(0)
            for row in basis:
                product = kernel.mul(row[a], row[b])
                accumulator = kernel.add(accumulator, product)
            gram[a][b] = accumulator
            gram[b][a] = kernel.value_copy(accumulator)
    if any(value is None for row in gram for value in row):
        _blocked("internal_incomplete_gram")
    return [[value for value in row if value is not None] for row in gram]


def _cholesky(
    kernel: _Kernel,
    gram: Sequence[Sequence[gmpy2.mpfr]],
    mode_count: int,
    label: str,
) -> list[list[gmpy2.mpfr]]:
    lower: list[list[gmpy2.mpfr | None]] = [
        [None for _ in range(mode_count)] for _ in range(mode_count)
    ]
    for row in range(mode_count):
        kernel.clear_flags()
        for column in range(row):
            accumulator = gram[row][column]
            for inner in range(column):
                left = lower[row][inner]
                right = lower[column][inner]
                if left is None or right is None:
                    _blocked("internal_incomplete_cholesky")
                product = kernel.mul(left, right)
                accumulator = kernel.sub(accumulator, product)
            divisor = lower[column][column]
            if divisor is None:
                _blocked("internal_incomplete_cholesky")
            lower[row][column] = kernel.div(
                accumulator,
                divisor,
            )
        diagonal_residual = gram[row][row]
        for inner in range(row):
            entry = lower[row][inner]
            if entry is None:
                _blocked("internal_incomplete_cholesky")
            square = kernel.mul(entry, entry)
            diagonal_residual = kernel.sub(diagonal_residual, square)
        if not gmpy2.is_finite(diagonal_residual) or diagonal_residual <= 0:
            _blocked(f"{label}_cholesky_nonpositive_pivot", str(row))
        diagonal = kernel.sqrt(diagonal_residual)
        if not gmpy2.is_finite(diagonal) or diagonal <= 0:
            _blocked(f"{label}_cholesky_nonpositive_diagonal", str(row))
        lower[row][row] = diagonal
    return [[value for value in row[: row_index + 1] if value is not None]
            for row_index, row in enumerate(lower)]


def _project_row(
    kernel: _Kernel,
    raw_bits: Sequence[str],
    basis: Sequence[Sequence[gmpy2.mpfr]],
    lower: Sequence[Sequence[gmpy2.mpfr]],
    mode_count: int,
    label: str,
) -> list[str]:
    kernel.clear_flags()
    if len(raw_bits) != len(basis):
        _blocked("projection_row_width_mismatch", label)
    y = [
        kernel.from_float(
            _bits_to_float(bits, f"{label}:raw:{index}"),
            f"{label}:raw:{index}",
        )
        for index, bits in enumerate(raw_bits)
    ]
    right_hand_side: list[gmpy2.mpfr] = []
    for mode in range(mode_count):
        accumulator = kernel.integer(0)
        for angular_index, value in enumerate(y):
            product = kernel.mul(basis[angular_index][mode], value)
            accumulator = kernel.add(accumulator, product)
        right_hand_side.append(accumulator)

    intermediate: list[gmpy2.mpfr] = []
    for row in range(mode_count):
        accumulator = right_hand_side[row]
        for inner in range(row):
            product = kernel.mul(lower[row][inner], intermediate[inner])
            accumulator = kernel.sub(accumulator, product)
        intermediate.append(kernel.div(accumulator, lower[row][row]))

    coefficients: list[gmpy2.mpfr | None] = [None] * mode_count
    for row in range(mode_count - 1, -1, -1):
        accumulator = intermediate[row]
        for inner in range(row + 1, mode_count):
            coefficient = coefficients[inner]
            if coefficient is None:
                _blocked("internal_incomplete_backward_solve")
            product = kernel.mul(lower[inner][row], coefficient)
            accumulator = kernel.sub(accumulator, product)
        coefficients[row] = kernel.div(accumulator, lower[row][row])

    if any(value is None for value in coefficients):
        _blocked("internal_incomplete_backward_solve")
    return [
        kernel.get_d_bits(value, "provisionalPostprojectionCoefficientBits")
        for value in coefficients
        if value is not None
    ]


def _dct_i(
    kernel: _Kernel,
    source_bits: Sequence[str],
    pi256: gmpy2.mpfr,
    label: str,
) -> list[gmpy2.mpfr]:
    radial_count = len(source_bits)
    if radial_count < 2:
        _blocked("dct_source_too_short", label)
    n = radial_count - 1
    source = [
        kernel.from_float(
            _bits_to_float(bits, f"{label}:source:{index}"),
            f"{label}:source:{index}",
        )
        for index, bits in enumerate(source_bits)
    ]
    # These are the imported rational-injection operands, not MPFR division
    # shortcuts.  1/2 is exact; 2/n is independently reinjected for every m
    # at the location of the frozen nested RN256 expression.
    coefficients: list[gmpy2.mpfr] = []
    for mode in range(radial_count):
        initial_half = kernel.rational(1, 2)
        accumulator = kernel.mul(initial_half, source[0])
        for radial_index in range(1, n):
            angle = kernel.mul(pi256, kernel.integer(mode))
            angle = kernel.mul(angle, kernel.integer(radial_index))
            angle = kernel.div(angle, kernel.integer(n))
            cosine = kernel.cos(angle)
            term = kernel.mul(source[radial_index], cosine)
            accumulator = kernel.add(accumulator, term)
        endpoint_sign = kernel.integer(-1 if mode % 2 else 1)
        endpoint_half = kernel.rational(1, 2)
        endpoint = kernel.mul(endpoint_half, source[n])
        endpoint = kernel.mul(endpoint, endpoint_sign)
        accumulator = kernel.add(accumulator, endpoint)
        two_over_n = kernel.rational(2, n)
        coefficients.append(kernel.mul(two_over_n, accumulator))
    coefficients[0] = kernel.div(coefficients[0], kernel.integer(2))
    coefficients[n] = kernel.div(coefficients[n], kernel.integer(2))
    return coefficients


def _phase_a1(
    kernel: _Kernel,
    scalar_bits: Sequence[Sequence[str]],
    pi256: gmpy2.mpfr,
    label: str,
) -> gmpy2.mpfr:
    radial_count = len(scalar_bits)
    mode_count = len(scalar_bits[0])
    candidate = kernel.integer(0)
    for mode in range(mode_count):
        kernel.clear_flags()
        radial_sequence = [scalar_bits[row][mode] for row in range(radial_count)]
        dct = _dct_i(kernel, radial_sequence, pi256, f"{label}:q{mode}")
        derivative = kernel.integer(0)
        for radial_mode in range(1, radial_count):
            term = kernel.mul(
                kernel.integer(radial_mode * radial_mode),
                dct[radial_mode],
            )
            derivative = kernel.add(derivative, term)
        a1_mode = kernel.mul(kernel.integer(-2), derivative)
        candidate = kernel.add(candidate, a1_mode)
    return candidate


def _reconstruct(
    kernel: _Kernel,
    coefficient_bits: Sequence[Sequence[str]],
    z_bits: Sequence[str],
    *,
    scalar: bool,
    label: str,
) -> list[list[str]]:
    radial_count = len(coefficient_bits)
    angular_count = len(z_bits)
    mode_count = len(coefficient_bits[0])
    degrees = tuple(2 * q + (1 if scalar else 0) for q in range(mode_count))
    result: list[list[str]] = []
    for radial_index in range(radial_count):
        row: list[str] = []
        for angular_index in range(angular_count):
            kernel.clear_flags()
            masked = (
                radial_index == radial_count - 1
                or (
                    scalar
                    and (
                        radial_index == 0
                        or angular_index == angular_count - 1
                    )
                )
            )
            if masked:
                row.append("0000000000000000")
                continue
            basis_row = _legendre_row(
                kernel,
                z_bits[angular_index],
                degrees,
                f"{label}:z:{radial_index}:{angular_index}",
            )
            accumulator = kernel.integer(0)
            for mode in range(mode_count):
                coefficient = kernel.from_float(
                    _bits_to_float(
                        coefficient_bits[radial_index][mode],
                        f"{label}:coefficient:{radial_index}:{mode}",
                    ),
                    f"{label}:coefficient:{radial_index}:{mode}",
                )
                product = kernel.mul(coefficient, basis_row[mode])
                accumulator = kernel.add(accumulator, product)
            row.append(
                kernel.get_d_bits(accumulator, "final_ordered_array_element_bits")
            )
        result.append(row)
    return result


def frozen_work_plan(level_id: str) -> FrozenWorkPlan:
    """Return the exact primitive/resource plan without executing MPFR."""

    if type(level_id) is not str or level_id not in LEVEL_SHAPES:
        _blocked("frozen_level_id_required", repr(level_id))
    radial_count, angular_count = LEVEL_SHAPES[level_id]
    mode_count = angular_count // 2
    n = radial_count - 1
    triangular = mode_count * (mode_count + 1) // 2

    z_interior = angular_count - 2
    basis_recurrences = angular_count * (2 * angular_count - 5)
    gram_terms = 2 * triangular * angular_count
    cholesky_products_per_parity = (
        mode_count * (mode_count - 1) * (mode_count + 1) // 6
    )
    cholesky_divisions_per_parity = mode_count * (mode_count - 1) // 2

    projection_rows = 2 * radial_count
    projection_rhs_terms = mode_count * angular_count
    projection_solve_products = mode_count * (mode_count - 1)

    dct_mul_per_mode = (n + 1) * (3 * n + 1)
    dct_div_per_mode = n * n + 1
    dct_add_per_mode = n * (n + 1)
    dct_cos_per_mode = n * n - 1
    phase_passes = 2
    phase_records = phase_passes * mode_count

    scalar_base_masks = 2 * angular_count + radial_count - 2
    potential_base_masks = angular_count
    scalar_unmasked = radial_count * angular_count - scalar_base_masks
    potential_unmasked = radial_count * angular_count - potential_base_masks
    reconstruction_elements = scalar_unmasked + potential_unmasked
    reconstruction_legendre_recurrences = (
        scalar_unmasked * (angular_count - 2)
        + potential_unmasked * (angular_count - 3)
    )
    dct_integer_sets_per_record = radial_count * (3 * radial_count - 5) + 2
    phase_integer_sets_per_record = (
        dct_integer_sets_per_record + radial_count + 1
    )

    expected_counts = PrimitiveCounts(
        integer_set=(
            5 * angular_count
            - 7
            + 2 * angular_count
            + 3 * basis_recurrences
            + 2 * triangular
            + projection_rows * mode_count
            + phase_passes
            + phase_records * phase_integer_sets_per_record
            + 2 * reconstruction_elements
            + 3 * reconstruction_legendre_recurrences
        ),
        symbolic_zero_set=3,
        binary64_set=(
            projection_rows * angular_count
            + 2 * angular_count
            + phase_records * radial_count
            + reconstruction_elements
            + reconstruction_elements * mode_count
        ),
        rational_set=phase_records * 3 * radial_count,
        value_copy=2 * triangular,
        const_pi=1,
        add=(
            gram_terms
            + projection_rows * projection_rhs_terms
            + phase_records * (dct_add_per_mode + n + 1)
            + reconstruction_elements * mode_count
        ),
        sub=(
            z_interior
            + basis_recurrences
            + reconstruction_legendre_recurrences
            + 2 * cholesky_products_per_parity
            + projection_rows * projection_solve_products
        ),
        mul=(
            2 * z_interior
            + 3 * basis_recurrences
            + 3 * reconstruction_legendre_recurrences
            + gram_terms
            + 2 * cholesky_products_per_parity
            + projection_rows
            * (projection_rhs_terms + projection_solve_products)
            + phase_records * (dct_mul_per_mode + n + 1)
            + reconstruction_elements * mode_count
        ),
        div=(
            3 * z_interior
            + 1
            + basis_recurrences
            + reconstruction_legendre_recurrences
            + 2 * cholesky_divisions_per_parity
            + projection_rows * (2 * mode_count)
            + phase_records * dct_div_per_mode
        ),
        sqrt=2 * mode_count,
        cos=2 * z_interior + phase_records * dct_cos_per_mode,
        get_d=(
            angular_count
            + projection_rows * mode_count
            + 2
            + reconstruction_elements
        ),
        flag_clear=(
            angular_count
            + 2 * angular_count
            + 2 * triangular
            + 2 * mode_count
            + projection_rows
            + phase_records
            + 2 * radial_count * angular_count
        ),
    )
    return FrozenWorkPlan(
        level_id=level_id,
        radial_node_count=radial_count,
        angular_node_count=angular_count,
        mode_count=mode_count,
        raw_array_byte_length=8 * radial_count * angular_count,
        multipole_array_byte_length=8 * radial_count * mode_count,
        base_array_byte_length=8 * radial_count * angular_count,
        scalar_multipole_mask_count=2 * mode_count,
        potential_multipole_mask_count=mode_count,
        scalar_base_mask_count=scalar_base_masks,
        potential_base_mask_count=potential_base_masks,
        total_input_byte_length=16 * radial_count * angular_count,
        total_output_byte_length=(
            16 * radial_count * mode_count
            + 16 * radial_count * angular_count
        ),
        analytic_z_record_count=angular_count,
        parity_basis_record_count=2 * angular_count,
        gram_record_count=2 * triangular,
        cholesky_pivot_count=2 * mode_count,
        projected_raw_row_count=projection_rows,
        projection_coefficient_barrier_count=(
            projection_rows * mode_count
        ),
        phase_dct_record_count=phase_records,
        phase_dct_radial_mode_count=(
            phase_records * radial_count
        ),
        reconstruction_slot_count=2 * radial_count * angular_count,
        reconstruction_evaluator_call_count=reconstruction_elements,
        symbolic_reconstruction_mask_count=(
            scalar_base_masks + potential_base_masks
        ),
        expected_counts=expected_counts,
    )


def postproject_level_bytes(
    level_id: str,
    raw_scalar_f64le: bytes,
    raw_potential_f64le: bytes,
) -> PostprojectionLevelBytes:
    """Execute one complete frozen level map entirely in memory.

    The result is candidate producer arithmetic only.  It is not emitted,
    registered, compared by an independent verifier, or admitted downstream.
    """

    plan = frozen_work_plan(level_id)
    raw_scalar = _raw_f64le_to_rows(
        raw_scalar_f64le,
        plan.radial_node_count,
        plan.angular_node_count,
        f"{level_id}:scalar",
    )
    raw_potential = _raw_f64le_to_rows(
        raw_potential_f64le,
        plan.radial_node_count,
        plan.angular_node_count,
        f"{level_id}:potential",
    )
    _guard_runtime_identity()
    if not _RUNTIME_LOCK.acquire(blocking=False):
        _blocked("concurrent_producer_mpfr_context_mutation_forbidden")
    try:
        context = _make_context()
        with context:
            active = gmpy2.get_context()
            _guard_active_context(active)
            _guard_binary64_rndn_semantics(active)
            kernel = _Kernel(active)
            z_bits, pi256 = _regenerate_analytic_z_bits(
                kernel,
                level_id,
                plan.angular_node_count,
            )
            odd_basis = _legendre_basis(
                kernel,
                z_bits,
                plan.mode_count,
                odd=True,
            )
            odd_gram = _gram(kernel, odd_basis, plan.mode_count)
            odd_lower = _cholesky(
                kernel,
                odd_gram,
                plan.mode_count,
                "odd",
            )
            scalar_coefficients: list[list[str]] = []
            for radial_index, row in enumerate(raw_scalar):
                scalar_coefficients.append(
                    _project_row(
                        kernel,
                        row,
                        odd_basis,
                        odd_lower,
                        plan.mode_count,
                        f"{level_id}:scalar:{radial_index}",
                    )
                )

            even_basis = _legendre_basis(
                kernel,
                z_bits,
                plan.mode_count,
                odd=False,
            )
            even_gram = _gram(kernel, even_basis, plan.mode_count)
            even_lower = _cholesky(
                kernel,
                even_gram,
                plan.mode_count,
                "even",
            )
            potential_coefficients: list[list[str]] = []
            for radial_index, row in enumerate(raw_potential):
                potential_coefficients.append(
                    _project_row(
                        kernel,
                        row,
                        even_basis,
                        even_lower,
                        plan.mode_count,
                        f"{level_id}:potential:{radial_index}",
                    )
                )

            for radial_index in (0, plan.radial_node_count - 1):
                scalar_coefficients[radial_index] = [
                    "0000000000000000"
                ] * plan.mode_count
            potential_coefficients[-1] = [
                "0000000000000000"
            ] * plan.mode_count

            provisional_a1 = _phase_a1(
                kernel,
                scalar_coefficients,
                pi256,
                f"{level_id}:provisional",
            )
            if not gmpy2.is_finite(provisional_a1) or provisional_a1 == 0:
                _blocked("phase_a1_zero_or_nonfinite", level_id)
            phase_sign = 1 if provisional_a1 > 0 else -1
            provisional_a1_bits = kernel.get_d_bits(
                provisional_a1,
                "provisionalA1ReceiptBits",
            )
            if phase_sign < 0:
                scalar_coefficients = [
                    [_sign_flip_nonzero(bits) for bits in row]
                    for row in scalar_coefficients
                ]

            final_a1 = _phase_a1(
                kernel,
                scalar_coefficients,
                pi256,
                f"{level_id}:final",
            )
            if not gmpy2.is_finite(final_a1) or final_a1 <= 0:
                _blocked("phase_final_a1_not_positive", level_id)
            final_a1_bits = kernel.get_d_bits(
                final_a1,
                "finalA1ReceiptBits",
            )
            if _bits_to_float(final_a1_bits, f"{level_id}:final_a1") <= 0:
                _blocked("phase_final_a1_binary64_not_positive", level_id)

            base_scalar = _reconstruct(
                kernel,
                scalar_coefficients,
                z_bits,
                scalar=True,
                label=f"{level_id}:base_scalar",
            )
            base_potential = _reconstruct(
                kernel,
                potential_coefficients,
                z_bits,
                scalar=False,
                label=f"{level_id}:base_potential",
            )
            observed_counts = kernel.counts.freeze()
            if observed_counts != plan.expected_counts:
                _blocked(
                    "primitive_call_count_mismatch",
                    f"{observed_counts!r}!={plan.expected_counts!r}",
                )

            scalar_multipole_bytes = _bits_matrix_to_f64le(
                scalar_coefficients,
                f"{level_id}:scalar_multipole",
            )
            potential_multipole_bytes = _bits_matrix_to_f64le(
                potential_coefficients,
                f"{level_id}:potential_multipole",
            )
            base_scalar_bytes = _bits_matrix_to_f64le(
                base_scalar,
                f"{level_id}:base_scalar",
            )
            base_potential_bytes = _bits_matrix_to_f64le(
                base_potential,
                f"{level_id}:base_potential",
            )

            if (
                len(scalar_multipole_bytes) != plan.multipole_array_byte_length
                or len(potential_multipole_bytes)
                != plan.multipole_array_byte_length
                or len(base_scalar_bytes) != plan.base_array_byte_length
                or len(base_potential_bytes) != plan.base_array_byte_length
            ):
                _blocked("postprojection_output_byte_length_mismatch", level_id)
    finally:
        _RUNTIME_LOCK.release()

    return PostprojectionLevelBytes(
        schema_version=PRODUCER_POSTPROJECTION_SLICE_VERSION,
        level_id=level_id,
        scalar_multipole_f64le=scalar_multipole_bytes,
        potential_multipole_f64le=potential_multipole_bytes,
        base_scalar_f64le=base_scalar_bytes,
        base_potential_f64le=base_potential_bytes,
        analytic_z_f64le_sha256=ANALYTIC_Z_F64LE_SHA256[level_id],
        scalar_phase_sign=phase_sign,
        provisional_a1_bits=provisional_a1_bits,
        final_a1_bits=final_a1_bits,
        odd_cholesky_pivot_count=plan.mode_count,
        even_cholesky_pivot_count=plan.mode_count,
        work_plan=plan,
        observed_counts=observed_counts,
        diagnostic_map_evaluated_in_memory=True,
        output_emitted=False,
        receipt_emitted=False,
        solver_wired=False,
        diagnostic_only=True,
        run_plan_compatible=False,
        gmpy2_toolchain_duty_closed=False,
        toolchain_successor_required=True,
        toolchain_blocker=str(TOOLCHAIN_COMPATIBILITY["blocker"]),
        runtime_authority=False,
        execution_authority=False,
        seed_admission_authority=False,
        scientific_authority=False,
        physical_authority=False,
    )


__all__ = (
    "ANALYTIC_Z_F64LE_SHA256",
    "AUTHORITY_LOCKS",
    "EMAX",
    "EMIN",
    "FROZEN_BOUNDED_FIXTURES_CANONICAL_SIZE_BYTES",
    "FROZEN_BOUNDED_FIXTURES_SHA256",
    "FROZEN_OPERATION_GRAPH_CANONICAL_SIZE_BYTES",
    "FROZEN_OPERATION_GRAPH_SHA256",
    "FrozenWorkPlan",
    "LEVEL_SHAPES",
    "PINNED_GMPY2_VERSION",
    "PINNED_GMP_VERSION",
    "PINNED_MPFR_VERSION",
    "PRECISION_BITS",
    "PRODUCER_POSTPROJECTION_SLICE_VERSION",
    "PostprojectionLevelBytes",
    "PrimitiveCounts",
    "ProducerPostprojectionSliceError",
    "ROUNDING_MODE",
    "TOOLCHAIN_COMPATIBILITY",
    "frozen_work_plan",
    "postproject_level_bytes",
)
