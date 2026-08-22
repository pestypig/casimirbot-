"""Additive corrected MPFR256/equilibrated N=64 frozen-core successor.

This module implements only the preregistered v3 implementation correction.  The
public entry point is zero-argument, reads exact-pinned predecessor input source
bytes, and returns an authority-neutral immutable diagnostic result.  It does
not mutate the predecessor, write output files, admit a candidate, or grant
replay, Theory Graph, physical, propulsion, or transport authority.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
from types import ModuleType
from typing import Final, Iterator

import gmpy2


SUCCESSOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_frozen_core_newton/v3"
)
COMPARISON_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_frozen_core_newton_comparison/v2"
)
COMPARISON_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-newton-comparison/v2\n"
)
STATE_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-newton-state/v2\n"
)
RESIDUAL_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/frozen-core-newton-residual/v2\n"
)

PROPOSAL_SHA256: Final[str] = (
    "04edae6ed2d594053e0763e5a2f72d1df206b66531d21734ceb66f59641f455e"
)
PROPOSAL_SIZE_BYTES: Final[int] = 5_569
PREDECESSOR_FAILURE_RECEIPT_SHA256: Final[str] = (
    "cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb"
)
PREDECESSOR_STATE_SHA256: Final[str] = (
    "601af0c0de01be4bb5a2abc0dc743cae57397a50c9406720856ae396c7325e50"
)
PREDECESSOR_RESIDUAL_SHA256: Final[str] = (
    "13418bbf6f97925754b7dd999b1e70e2d2495d2efb4993f61ee98cf4be62dc17"
)

SPECTRAL_SOURCE_SHA256: Final[str] = (
    "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7"
)
SPECTRAL_SOURCE_SIZE_BYTES: Final[int] = 19_045
INITIALIZER_SOURCE_SHA256: Final[str] = (
    "1edb2e612603cec67118390d11f875a07e3fb1640f63d319b23bf725b016f235"
)
INITIALIZER_SOURCE_SIZE_BYTES: Final[int] = 36_770
GMPY2_EXTENSION_SHA256: Final[str] = (
    "56f2bf12ffd4ca523f403bd2b6ce13069800cc2fc4332cf5de3537a34e8c76fb"
)
GMPY2_EXTENSION_SIZE_BYTES: Final[int] = 442_368
MPFR_DLL_SHA256: Final[str] = (
    "95b280f52d24a1fe1e024877ee325a629c3424e12961d27f84daec73d02c4bd8"
)
MPFR_DLL_SIZE_BYTES: Final[int] = 904_297
GMP_DLL_SHA256: Final[str] = (
    "829adcf025d22e641c6816b431fbe5b226a39b390c7205192d480151646fe9c9"
)
GMP_DLL_SIZE_BYTES: Final[int] = 1_083_865

NODE_COUNT: Final[int] = 64
ORDER: Final[int] = 129
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_000_000
MPFR_EMAX: Final[int] = 1_000_000
MAXIMUM_ACCEPTED_UPDATES: Final[int] = 48
BACKTRACK_TRIAL_COUNT: Final[int] = 25
ARMIJO_C_EXPONENT: Final[int] = -12
EQUATION_THRESHOLD_EXPONENT: Final[int] = -40
STEP_THRESHOLD_EXPONENT: Final[int] = -42
CONSECUTIVE_REQUIRED: Final[int] = 2

_HERE: Final[Path] = Path(__file__).resolve().parent
_TOOLS: Final[Path] = _HERE.parent
_REPOSITORY: Final[Path] = _TOOLS.parent
_PRODUCER: Final[Path] = _TOOLS / "nhm2-spherical-boson-star-seed" / "producer"
_PROPOSAL: Final[Path] = (
    _REPOSITORY
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-core-successor-v3-proposal.md"
)


class MpfrCoreSuccessorError(RuntimeError):
    """Typed fail-closed implementation error."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenAcceptedUpdate:
    update_ordinal: int
    alpha_exponent: int
    raw_equation_linf: str
    scaled_step_linf: str
    row_scale_span: str
    column_scale_span: str
    consecutive_qualifying_count: int


@dataclass(frozen=True, slots=True)
class FrozenMpfrCoreSuccessorResult:
    status: str
    failure_code: str | None
    accepted_update_count: int
    dense_solve_count: int
    full_evaluation_count: int
    trial_attempt_count: int
    residual_only_evaluation_count: int
    accepted_alpha_exponents: tuple[int, ...]
    accepted_updates: tuple[FrozenAcceptedUpdate, ...]
    current_state_sha256: str
    current_residual_sha256: str
    projected_state_sha256: str | None
    projected_residual_sha256: str | None
    comparison_wire: str | None
    comparison_sha256: str | None
    raw_equation_linf: str
    scaled_step_linf: str | None
    projection_raw_equation_linf: str | None
    predecessor_failure_receipt_sha256: str
    proposal_sha256: str
    proposal_size_bytes: int
    spectral_source_sha256: str
    initializer_source_sha256: str
    gmpy2_extension_sha256: str
    mpfr_dll_sha256: str
    gmp_dll_sha256: str
    observed_gmpy2_version: str
    observed_mpfr_version: str
    numerical_go: bool
    predecessor_reinterpreted: bool = False
    retry_allowed: bool = False
    retune_allowed: bool = False
    alternate_initializer_used: bool = False
    source_disjoint_agreement: bool = False
    runtime_disjoint_independent_replay: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    candidate_output_materialized: bool = False
    output_present: bool = False
    output_accepted: bool = False
    branch_accepted: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _sha256_file(
    path: Path, expected_size: int, expected_hash: str, label: str
) -> None:
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise MpfrCoreSuccessorError(
            f"{label}_unavailable", type(error).__name__
        ) from error
    if (
        len(payload) != expected_size
        or hashlib.sha256(payload).hexdigest() != expected_hash
    ):
        raise MpfrCoreSuccessorError(f"{label}_binding_mismatch", "raw")


def _verify_static_bindings() -> None:
    _sha256_file(_PROPOSAL, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal")
    _sha256_file(
        _PRODUCER / "spectral.py",
        SPECTRAL_SOURCE_SIZE_BYTES,
        SPECTRAL_SOURCE_SHA256,
        "spectral_source",
    )
    _sha256_file(
        _PRODUCER / "core_initializer.py",
        INITIALIZER_SOURCE_SIZE_BYTES,
        INITIALIZER_SOURCE_SHA256,
        "initializer_source",
    )
    extension = Path(gmpy2.gmpy2.__file__).resolve()
    _sha256_file(
        extension,
        GMPY2_EXTENSION_SIZE_BYTES,
        GMPY2_EXTENSION_SHA256,
        "gmpy2_extension",
    )
    library_root = extension.parent.parent / "gmpy2.libs"
    _sha256_file(
        library_root / "libmpfr-6.dll",
        MPFR_DLL_SIZE_BYTES,
        MPFR_DLL_SHA256,
        "mpfr_runtime",
    )
    _sha256_file(
        library_root / "libgmp-10.dll",
        GMP_DLL_SIZE_BYTES,
        GMP_DLL_SHA256,
        "gmp_runtime",
    )
    if gmpy2.version() != "2.3.1" or gmpy2.mpfr_version() != "MPFR 4.2.2":
        raise MpfrCoreSuccessorError("mpfr_runtime_version_mismatch", "version")


def _load_initializer() -> ModuleType:
    path = _PRODUCER / "core_initializer.py"
    source = path.read_bytes()
    module = ModuleType("_nhm2_v2_successor_bound_initializer_1edb2e61")
    module.__file__ = str(path)
    module.__package__ = ""
    missing = object()
    previous = sys.modules.get(module.__name__, missing)
    sys.modules[module.__name__] = module
    try:
        code = compile(source, str(path), "exec", dont_inherit=True, optimize=0)
        exec(code, module.__dict__)
    except Exception as error:
        raise MpfrCoreSuccessorError(
            "initializer_private_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is missing:
            del sys.modules[module.__name__]
        else:
            sys.modules[module.__name__] = previous
    return module


def _context_template() -> gmpy2.context:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
    template.round = gmpy2.RoundToNearest
    template.emin = MPFR_EMIN
    template.emax = MPFR_EMAX
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    template.clear_flags()
    return template


@contextmanager
def _owned_context() -> Iterator[gmpy2.context]:
    with gmpy2.context(_context_template()):
        context = gmpy2.get_context()
        context.clear_flags()
        yield context


def _check_flags(context: gmpy2.context, operation: str) -> None:
    forbidden = tuple(
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    )
    if forbidden:
        raise MpfrCoreSuccessorError(
            "mpfr_forbidden_flag", f"{operation}:{','.join(forbidden)}"
        )
    context.clear_flags()


def _lift_f64(value: float) -> gmpy2.mpfr:
    if type(value) is not float or not math.isfinite(value):
        raise MpfrCoreSuccessorError("binary64_input_invalid", type(value).__name__)
    numerator, denominator = value.as_integer_ratio()
    return gmpy2.mpfr(gmpy2.mpq(numerator, denominator))


def _encode_mpfr(value: gmpy2.mpfr) -> str:
    if not gmpy2.is_finite(value):
        raise MpfrCoreSuccessorError("mpfr_encoding_nonfinite", "value")
    numerator, denominator = value.as_integer_ratio()
    numerator = int(numerator)
    denominator = int(denominator)
    if numerator == 0:
        return "0:0:0:256:C"
    sign = -1 if numerator < 0 else 1
    mantissa = abs(numerator)
    exponent = -(denominator.bit_length() - 1)
    while mantissa & 1 == 0:
        mantissa >>= 1
        exponent += 1
    return f"{sign}:{mantissa:x}:{exponent}:256:C"


def _canonical_hash(domain: bytes, values: list[gmpy2.mpfr]) -> str:
    wire = json.dumps(
        [_encode_mpfr(value) for value in values],
        ensure_ascii=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(domain + len(wire).to_bytes(8, "little") + wire).hexdigest()


def _metric(value: gmpy2.mpfr) -> str:
    return _encode_mpfr(value)


def _dot(
    matrix: list[list[gmpy2.mpfr]],
    row: int,
    state: list[gmpy2.mpfr],
    offset: int,
) -> gmpy2.mpfr:
    result = gmpy2.mpfr(0)
    for column in range(NODE_COUNT):
        result += matrix[row][column] * state[offset + column]
    return result


def _laplacian(
    rho: list[gmpy2.mpfr],
    first: list[list[gmpy2.mpfr]],
    second: list[list[gmpy2.mpfr]],
    row: int,
    state: list[gmpy2.mpfr],
    offset: int,
) -> gmpy2.mpfr:
    one_minus = 1 - rho[row]
    return one_minus**4 * (
        _dot(second, row, state, offset)
        + 2 * _dot(first, row, state, offset) / rho[row]
    )


def _evaluate(
    rho: list[gmpy2.mpfr],
    first: list[list[gmpy2.mpfr]],
    second: list[list[gmpy2.mpfr]],
    state: list[gmpy2.mpfr],
    *,
    jacobian_required: bool,
) -> tuple[list[gmpy2.mpfr], list[list[gmpy2.mpfr]] | None, bool]:
    residual = [gmpy2.mpfr(0) for _ in range(ORDER)]
    nu = state[2 * NODE_COUNT]
    for row in range(NODE_COUNT):
        if row == 0:
            residual[row] = _dot(first, 0, state, 0)
        elif row == NODE_COUNT - 1:
            residual[row] = state[NODE_COUNT - 1]
        else:
            residual[row] = (
                -gmpy2.mpfr("0.5")
                * _laplacian(rho, first, second, row, state, 0)
                + (state[NODE_COUNT + row] - nu) * state[row]
            )
    for row in range(NODE_COUNT):
        target = NODE_COUNT + row
        if row == 0:
            residual[target] = _dot(first, 0, state, NODE_COUNT)
        elif row == NODE_COUNT - 1:
            residual[target] = state[2 * NODE_COUNT - 1]
        else:
            residual[target] = _laplacian(
                rho, first, second, row, state, NODE_COUNT
            ) - state[row] * state[row]
    residual[2 * NODE_COUNT] = state[0] - 1

    domain_valid = bool(nu < 0 and gmpy2.mpfr(2) ** -10 * nu > -gmpy2.mpfr("0.5"))
    if not jacobian_required:
        return residual, None, domain_valid

    jacobian = [
        [gmpy2.mpfr(0) for _ in range(ORDER)] for _ in range(ORDER)
    ]
    for row in range(ORDER):
        for column in range(ORDER):
            if row < NODE_COUNT:
                if row == 0:
                    value = first[0][column] if column < NODE_COUNT else 0
                elif row == NODE_COUNT - 1:
                    value = 1 if column == NODE_COUNT - 1 else 0
                elif column < NODE_COUNT:
                    one_minus = 1 - rho[row]
                    l_entry = one_minus**4 * (
                        second[row][column] + 2 * first[row][column] / rho[row]
                    )
                    value = -gmpy2.mpfr("0.5") * l_entry
                    if column == row:
                        value += state[NODE_COUNT + row] - nu
                elif column < 2 * NODE_COUNT:
                    value = state[row] if column == NODE_COUNT + row else 0
                else:
                    value = -state[row]
            elif row < 2 * NODE_COUNT:
                potential_row = row - NODE_COUNT
                if potential_row == 0:
                    value = (
                        first[0][column - NODE_COUNT]
                        if NODE_COUNT <= column < 2 * NODE_COUNT
                        else 0
                    )
                elif potential_row == NODE_COUNT - 1:
                    value = 1 if column == 2 * NODE_COUNT - 1 else 0
                elif column < NODE_COUNT:
                    value = -2 * state[potential_row] if column == potential_row else 0
                elif column < 2 * NODE_COUNT:
                    one_minus = 1 - rho[potential_row]
                    value = one_minus**4 * (
                        second[potential_row][column - NODE_COUNT]
                        + 2
                        * first[potential_row][column - NODE_COUNT]
                        / rho[potential_row]
                    )
                else:
                    value = 0
            else:
                value = 1 if column == 0 else 0
            jacobian[row][column] = gmpy2.mpfr(value)
    return residual, jacobian, domain_valid


def _linf(values: list[gmpy2.mpfr]) -> gmpy2.mpfr:
    maximum = gmpy2.mpfr(0)
    for value in values:
        magnitude = abs(value)
        if magnitude > maximum:
            maximum = magnitude
    return maximum


def _merit(values: list[gmpy2.mpfr]) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    total = gmpy2.mpfr(0)
    for value in values:
        total += value * value
    return total, total / 2


def _solve_equilibrated(
    jacobian: list[list[gmpy2.mpfr]], residual: list[gmpy2.mpfr]
) -> tuple[list[gmpy2.mpfr], gmpy2.mpfr, gmpy2.mpfr]:
    row_scales: list[gmpy2.mpfr] = []
    row_normalized: list[list[gmpy2.mpfr]] = []
    rhs: list[gmpy2.mpfr] = []
    for row in range(len(jacobian)):
        scale = max(abs(value) for value in jacobian[row])
        if scale <= 0 or not gmpy2.is_finite(scale):
            raise MpfrCoreSuccessorError("equilibration_row_scale_invalid", str(row))
        row_scales.append(scale)
        row_normalized.append([value / scale for value in jacobian[row]])
        rhs.append(-residual[row] / scale)
    column_scales: list[gmpy2.mpfr] = []
    for column in range(len(jacobian)):
        scale = max(abs(row_normalized[row][column]) for row in range(len(jacobian)))
        if scale <= 0 or not gmpy2.is_finite(scale):
            raise MpfrCoreSuccessorError(
                "equilibration_column_scale_invalid", str(column)
            )
        column_scales.append(scale)
    original_matrix = [
        [
            row_normalized[row][column] / column_scales[column]
            for column in range(len(jacobian))
        ]
        for row in range(len(jacobian))
    ]
    original_rhs = list(rhs)
    matrix = [list(row) for row in original_matrix]
    order = len(matrix)
    pivots: list[int] = []
    for pivot_column in range(order):
        pivot_row = max(
            range(pivot_column, order),
            key=lambda row: abs(matrix[row][pivot_column]),
        )
        if matrix[pivot_row][pivot_column] == 0:
            raise MpfrCoreSuccessorError(
                "equilibrated_dense_solve_singular", str(pivot_column)
            )
        if pivot_row != pivot_column:
            matrix[pivot_column], matrix[pivot_row] = (
                matrix[pivot_row],
                matrix[pivot_column],
            )
        pivots.append(pivot_row)
        pivot = matrix[pivot_column][pivot_column]
        for row in range(pivot_column + 1, order):
            factor = matrix[row][pivot_column] / pivot
            matrix[row][pivot_column] = factor
            if factor == 0:
                continue
            for column in range(pivot_column + 1, order):
                matrix[row][column] -= factor * matrix[pivot_column][column]

    def factored_solve(selected_rhs: list[gmpy2.mpfr]) -> list[gmpy2.mpfr]:
        solved = list(selected_rhs)
        for pivot_column, pivot_row in enumerate(pivots):
            if pivot_row != pivot_column:
                solved[pivot_column], solved[pivot_row] = (
                    solved[pivot_row],
                    solved[pivot_column],
                )
        for pivot_column in range(order):
            for row in range(pivot_column + 1, order):
                solved[row] -= matrix[row][pivot_column] * solved[pivot_column]
        result = [gmpy2.mpfr(0) for _ in range(order)]
        for row in range(order - 1, -1, -1):
            value = solved[row]
            for column in range(row + 1, order):
                value -= matrix[row][column] * result[column]
            result[row] = value / matrix[row][row]
        return result

    y = factored_solve(original_rhs)
    for _ in range(3):
        refinement_residual: list[gmpy2.mpfr] = []
        for row in range(order):
            product = gmpy2.mpfr(0)
            for column in range(order):
                product += original_matrix[row][column] * y[column]
            refinement_residual.append(original_rhs[row] - product)
        correction = factored_solve(refinement_residual)
        y = [y[index] + correction[index] for index in range(order)]
    direction = [y[column] / column_scales[column] for column in range(order)]
    return (
        direction,
        max(row_scales) / min(row_scales),
        max(column_scales) / min(column_scales),
    )


def _linear_defect_linf(
    jacobian: list[list[gmpy2.mpfr]],
    residual: list[gmpy2.mpfr],
    direction: list[gmpy2.mpfr],
) -> gmpy2.mpfr:
    defects: list[gmpy2.mpfr] = []
    for row in range(len(jacobian)):
        value = residual[row]
        for column in range(len(direction)):
            value += jacobian[row][column] * direction[column]
        defects.append(value)
    return _linf(defects)


def _initial_linear_defect_diagnostic(solver=_solve_equilibrated) -> str:
    """Evaluate only the frozen initial N=64 linear solve; never run Newton."""

    _verify_static_bindings()
    initializer_module = _load_initializer()
    spectral = initializer_module._spectral_module.generate_lobatto_spectral_primitive(
        NODE_COUNT
    )
    initializer = initializer_module.materialize_fixed_l0_initializer(spectral)
    if initializer.node_count != NODE_COUNT or len(initializer.z) != ORDER:
        raise MpfrCoreSuccessorError("frozen_input_shape_mismatch", "N64")
    with _owned_context() as context:
        rho = [_lift_f64(value) for value in spectral.rho]
        first = [
            [_lift_f64(value) for value in row]
            for row in spectral.first_derivative
        ]
        second = [
            [_lift_f64(value) for value in row]
            for row in spectral.second_derivative
        ]
        current = [_lift_f64(value) for value in initializer.z]
        residual, jacobian, domain_valid = _evaluate(
            rho, first, second, current, jacobian_required=True
        )
        if not domain_valid or jacobian is None:
            raise MpfrCoreSuccessorError("initial_linear_fixture_invalid", "N64")
        direction, _, _ = solver(jacobian, residual)
        defect = _linear_defect_linf(jacobian, residual, direction)
        _check_flags(context, "initial_linear_defect_diagnostic")
        return _metric(defect)


def _scaled_step_linf(
    step: list[gmpy2.mpfr], accepted_state: list[gmpy2.mpfr]
) -> gmpy2.mpfr:
    maximum = gmpy2.mpfr(0)
    for index, value in enumerate(step):
        denominator = max(gmpy2.mpfr(1), abs(accepted_state[index]))
        maximum = max(maximum, abs(value) / denominator)
    return maximum


def _comparison(state: list[gmpy2.mpfr]) -> tuple[str, str]:
    words: list[str] = []
    for value in state:
        projected = float(value)
        if not math.isfinite(projected):
            raise MpfrCoreSuccessorError("comparison_binary64_nonfinite", "state")
        words.append(struct.pack(">d", projected).hex())
    wire = json.dumps(
        {
            "comparisonVersion": COMPARISON_VERSION,
            "nodeCount": NODE_COUNT,
            "projectedStateF64BeWordHex": words,
        },
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )
    payload = wire.encode("utf-8")
    digest = hashlib.sha256(
        COMPARISON_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()
    return wire, digest


def _make_result(
    *,
    status: str,
    failure_code: str | None,
    current: list[gmpy2.mpfr],
    residual: list[gmpy2.mpfr],
    projected: list[gmpy2.mpfr] | None,
    projected_residual: list[gmpy2.mpfr] | None,
    accepted_updates: list[FrozenAcceptedUpdate],
    dense_solve_count: int,
    full_evaluation_count: int,
    trial_attempt_count: int,
    residual_only_evaluation_count: int,
    last_step: gmpy2.mpfr | None,
) -> FrozenMpfrCoreSuccessorResult:
    wire = digest = None
    if projected is not None:
        wire, digest = _comparison(projected)
    return FrozenMpfrCoreSuccessorResult(
        status=status,
        failure_code=failure_code,
        accepted_update_count=len(accepted_updates),
        dense_solve_count=dense_solve_count,
        full_evaluation_count=full_evaluation_count,
        trial_attempt_count=trial_attempt_count,
        residual_only_evaluation_count=residual_only_evaluation_count,
        accepted_alpha_exponents=tuple(
            item.alpha_exponent for item in accepted_updates
        ),
        accepted_updates=tuple(accepted_updates),
        current_state_sha256=_canonical_hash(STATE_DOMAIN, current),
        current_residual_sha256=_canonical_hash(RESIDUAL_DOMAIN, residual),
        projected_state_sha256=(
            _canonical_hash(STATE_DOMAIN, projected) if projected is not None else None
        ),
        projected_residual_sha256=(
            _canonical_hash(RESIDUAL_DOMAIN, projected_residual)
            if projected_residual is not None
            else None
        ),
        comparison_wire=wire,
        comparison_sha256=digest,
        raw_equation_linf=_metric(_linf(residual)),
        scaled_step_linf=_metric(last_step) if last_step is not None else None,
        projection_raw_equation_linf=(
            _metric(_linf(projected_residual))
            if projected_residual is not None
            else None
        ),
        predecessor_failure_receipt_sha256=PREDECESSOR_FAILURE_RECEIPT_SHA256,
        proposal_sha256=PROPOSAL_SHA256,
        proposal_size_bytes=PROPOSAL_SIZE_BYTES,
        spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
        initializer_source_sha256=INITIALIZER_SOURCE_SHA256,
        gmpy2_extension_sha256=GMPY2_EXTENSION_SHA256,
        mpfr_dll_sha256=MPFR_DLL_SHA256,
        gmp_dll_sha256=GMP_DLL_SHA256,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
        numerical_go=status == "GO",
    )


def run_frozen_n64_successor() -> FrozenMpfrCoreSuccessorResult:
    """Run exactly one in-memory v3 N=64 diagnostic graph."""

    _verify_static_bindings()
    initializer_module = _load_initializer()
    spectral = initializer_module._spectral_module.generate_lobatto_spectral_primitive(
        NODE_COUNT
    )
    initializer = initializer_module.materialize_fixed_l0_initializer(spectral)
    if initializer.node_count != NODE_COUNT or len(initializer.z) != ORDER:
        raise MpfrCoreSuccessorError("frozen_input_shape_mismatch", "N64")

    with _owned_context() as context:
        rho = [_lift_f64(value) for value in spectral.rho]
        first = [
            [_lift_f64(value) for value in row]
            for row in spectral.first_derivative
        ]
        second = [
            [_lift_f64(value) for value in row]
            for row in spectral.second_derivative
        ]
        current = [_lift_f64(value) for value in initializer.z]
        _check_flags(context, "input_lift")
        residual, jacobian, domain_valid = _evaluate(
            rho, first, second, current, jacobian_required=True
        )
        _check_flags(context, "initial_evaluation")
        if not domain_valid or jacobian is None:
            return _make_result(
                status="FAIL",
                failure_code="initial_domain_invalid_without_retry",
                current=current,
                residual=residual,
                projected=None,
                projected_residual=None,
                accepted_updates=[],
                dense_solve_count=0,
                full_evaluation_count=1,
                trial_attempt_count=0,
                residual_only_evaluation_count=0,
                last_step=None,
            )
        current_sum_squares, current_phi = _merit(residual)
        _check_flags(context, "initial_merit")
        accepted_updates: list[FrozenAcceptedUpdate] = []
        dense_solve_count = 0
        full_evaluation_count = 1
        trial_attempt_count = 0
        consecutive = 0
        last_step: gmpy2.mpfr | None = None
        equation_threshold = gmpy2.mpfr(2) ** EQUATION_THRESHOLD_EXPONENT
        step_threshold = gmpy2.mpfr(2) ** STEP_THRESHOLD_EXPONENT
        armijo_c = gmpy2.mpfr(2) ** ARMIJO_C_EXPONENT

        for update_ordinal in range(1, MAXIMUM_ACCEPTED_UPDATES + 1):
            dense_solve_count += 1
            direction, row_span, column_span = _solve_equilibrated(
                jacobian, residual
            )
            _check_flags(context, f"solve[{update_ordinal}]")
            accepted = None
            for exponent in range(BACKTRACK_TRIAL_COUNT):
                trial_attempt_count += 1
                alpha = gmpy2.mpfr(2) ** -exponent
                step = [alpha * value for value in direction]
                trial = [current[index] + step[index] for index in range(ORDER)]
                trial_residual, trial_jacobian, trial_domain_valid = _evaluate(
                    rho, first, second, trial, jacobian_required=True
                )
                full_evaluation_count += 1
                _check_flags(context, f"trial[{update_ordinal},{exponent}]")
                if not trial_domain_valid or trial_jacobian is None:
                    continue
                trial_sum_squares, trial_phi = _merit(trial_residual)
                armijo_rhs = current_phi - armijo_c * alpha * current_sum_squares
                _check_flags(context, f"armijo[{update_ordinal},{exponent}]")
                if trial_phi <= armijo_rhs:
                    accepted = (
                        exponent,
                        step,
                        trial,
                        trial_residual,
                        trial_jacobian,
                        trial_sum_squares,
                        trial_phi,
                    )
                    break
            if accepted is None:
                return _make_result(
                    status="FAIL",
                    failure_code="armijo_schedule_exhausted_without_retry",
                    current=current,
                    residual=residual,
                    projected=None,
                    projected_residual=None,
                    accepted_updates=accepted_updates,
                    dense_solve_count=dense_solve_count,
                    full_evaluation_count=full_evaluation_count,
                    trial_attempt_count=trial_attempt_count,
                    residual_only_evaluation_count=0,
                    last_step=last_step,
                )
            (
                exponent,
                step,
                current,
                residual,
                jacobian,
                current_sum_squares,
                current_phi,
            ) = accepted
            raw_linf = _linf(residual)
            last_step = _scaled_step_linf(step, current)
            if raw_linf <= equation_threshold and last_step <= step_threshold:
                consecutive += 1
            else:
                consecutive = 0
            accepted_updates.append(
                FrozenAcceptedUpdate(
                    update_ordinal=update_ordinal,
                    alpha_exponent=exponent,
                    raw_equation_linf=_metric(raw_linf),
                    scaled_step_linf=_metric(last_step),
                    row_scale_span=_metric(row_span),
                    column_scale_span=_metric(column_span),
                    consecutive_qualifying_count=consecutive,
                )
            )
            if consecutive == CONSECUTIVE_REQUIRED:
                projected = list(current)
                projected[NODE_COUNT - 1] = gmpy2.mpfr(0)
                projected[2 * NODE_COUNT - 1] = gmpy2.mpfr(0)
                projected_residual, _, projected_domain = _evaluate(
                    rho, first, second, projected, jacobian_required=False
                )
                _check_flags(context, "projection")
                if (
                    not projected_domain
                    or _linf(projected_residual) > equation_threshold
                ):
                    return _make_result(
                        status="FAIL",
                        failure_code="projection_residual_gate_failed_without_retry",
                        current=current,
                        residual=residual,
                        projected=projected,
                        projected_residual=projected_residual,
                        accepted_updates=accepted_updates,
                        dense_solve_count=dense_solve_count,
                        full_evaluation_count=full_evaluation_count,
                        trial_attempt_count=trial_attempt_count,
                        residual_only_evaluation_count=1,
                        last_step=last_step,
                    )
                return _make_result(
                    status="GO",
                    failure_code=None,
                    current=current,
                    residual=residual,
                    projected=projected,
                    projected_residual=projected_residual,
                    accepted_updates=accepted_updates,
                    dense_solve_count=dense_solve_count,
                    full_evaluation_count=full_evaluation_count,
                    trial_attempt_count=trial_attempt_count,
                    residual_only_evaluation_count=1,
                    last_step=last_step,
                )
        return _make_result(
            status="FAIL",
            failure_code="maximum_updates_reached_without_retry",
            current=current,
            residual=residual,
            projected=None,
            projected_residual=None,
            accepted_updates=accepted_updates,
            dense_solve_count=dense_solve_count,
            full_evaluation_count=full_evaluation_count,
            trial_attempt_count=trial_attempt_count,
            residual_only_evaluation_count=0,
            last_step=last_step,
        )


__all__ = [
    "FrozenAcceptedUpdate",
    "FrozenMpfrCoreSuccessorResult",
    "MpfrCoreSuccessorError",
    "run_frozen_n64_successor",
]


