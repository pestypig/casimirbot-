"""Source-disjoint MPFR256 replay of the frozen N=64 v2 core policy.

This implementation intentionally does not import or inspect the primary v2
solver.  It shares only the preregistered proposal, exact predecessor input
sources, and the authenticated workstation MPFR/GMP runtime.  Its linear path
uses a Gauss-Jordan inverse with three residual refinements rather than the
primary LU path.  Shared runtime lineage remains an explicit blocker.
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


REPLAY_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_frozen_core_newton_replay/v2"
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
    "07495f17b37bfe4942794b14e90cb201d636caca0356fe66df57d112c8e43da1"
)
PROPOSAL_SIZE_BYTES: Final[int] = 12_872
PREDECESSOR_FAILURE_RECEIPT_SHA256: Final[str] = (
    "cb9c36432486b4138ad01b8c8beebaca4eecb480fdd54a9a5f57a5030c4ed0cb"
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
PRECISION_BITS: Final[int] = 256
MAXIMUM_UPDATES: Final[int] = 48
TRIAL_COUNT: Final[int] = 25

_HERE: Final[Path] = Path(__file__).resolve().parent
_TOOLS: Final[Path] = _HERE.parent
_REPOSITORY: Final[Path] = _TOOLS.parent
_PRODUCER: Final[Path] = _TOOLS / "nhm2-spherical-boson-star-seed" / "producer"
_PROPOSAL: Final[Path] = (
    _REPOSITORY
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-equilibrated-mpfr-core-successor-proposal.md"
)


class MpfrCoreReplayError(RuntimeError):
    def __init__(self, code: str, detail: str) -> None:
        super().__init__(f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class FrozenReplayUpdate:
    ordinal: int
    alpha_exponent: int
    equation_linf: str
    step_linf: str
    row_scale_span: str
    column_scale_span: str
    consecutive: int


@dataclass(frozen=True, slots=True)
class FrozenMpfrCoreReplayResult:
    status: str
    failure_code: str | None
    updates: tuple[FrozenReplayUpdate, ...]
    dense_solve_count: int
    full_evaluation_count: int
    trial_attempt_count: int
    current_state_sha256: str
    current_residual_sha256: str
    projected_state_sha256: str | None
    projected_residual_sha256: str | None
    comparison_wire: str | None
    comparison_sha256: str | None
    raw_equation_linf: str
    projection_raw_equation_linf: str | None
    numerical_go: bool
    source_disjoint_from_primary: bool = True
    runtime_disjoint_independent_replay: bool = False
    shared_runtime_lineage_blocker: str = (
        "primary_and_replay_share_workstation_MPFR_GMP_lineage"
    )
    retry_allowed: bool = False
    retune_allowed: bool = False
    candidate_execution_authorized: bool = False
    candidate_executed: bool = False
    output_present: bool = False
    replay_authority: bool = False
    theory_graph_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False


def _bound_file(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        payload = path.read_bytes()
    except OSError as error:
        raise MpfrCoreReplayError(
            f"{label}_unavailable", type(error).__name__
        ) from error
    if len(payload) != size or hashlib.sha256(payload).hexdigest() != digest:
        raise MpfrCoreReplayError(f"{label}_binding_mismatch", "raw")
    return payload


def _verify_bindings() -> None:
    _bound_file(_PROPOSAL, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal")
    _bound_file(
        _PRODUCER / "spectral.py",
        SPECTRAL_SOURCE_SIZE_BYTES,
        SPECTRAL_SOURCE_SHA256,
        "spectral",
    )
    _bound_file(
        _PRODUCER / "core_initializer.py",
        INITIALIZER_SOURCE_SIZE_BYTES,
        INITIALIZER_SOURCE_SHA256,
        "initializer",
    )
    extension = Path(gmpy2.gmpy2.__file__).resolve()
    _bound_file(
        extension,
        GMPY2_EXTENSION_SIZE_BYTES,
        GMPY2_EXTENSION_SHA256,
        "gmpy2",
    )
    libraries = extension.parent.parent / "gmpy2.libs"
    _bound_file(
        libraries / "libmpfr-6.dll",
        MPFR_DLL_SIZE_BYTES,
        MPFR_DLL_SHA256,
        "mpfr",
    )
    _bound_file(
        libraries / "libgmp-10.dll",
        GMP_DLL_SIZE_BYTES,
        GMP_DLL_SHA256,
        "gmp",
    )
    if gmpy2.version() != "2.3.1" or gmpy2.mpfr_version() != "MPFR 4.2.2":
        raise MpfrCoreReplayError("runtime_version_mismatch", "MPFR_GMP")


def _initializer_module() -> ModuleType:
    path = _PRODUCER / "core_initializer.py"
    payload = _bound_file(
        path,
        INITIALIZER_SOURCE_SIZE_BYTES,
        INITIALIZER_SOURCE_SHA256,
        "initializer",
    )
    module = ModuleType("_nhm2_v2_replay_initializer_1edb2e61")
    module.__file__ = str(path)
    module.__package__ = ""
    previous = sys.modules.get(module.__name__)
    sys.modules[module.__name__] = module
    try:
        code = compile(payload, str(path), "exec", dont_inherit=True, optimize=0)
        exec(code, module.__dict__)
    except Exception as error:
        raise MpfrCoreReplayError(
            "initializer_private_load_failed", type(error).__name__
        ) from error
    finally:
        if previous is None:
            del sys.modules[module.__name__]
        else:
            sys.modules[module.__name__] = previous
    return module


def _template() -> gmpy2.context:
    context = gmpy2.get_context().copy()
    context.precision = PRECISION_BITS
    context.round = gmpy2.RoundToNearest
    context.emin = -1_000_000
    context.emax = 1_000_000
    context.subnormalize = False
    context.trap_underflow = False
    context.trap_overflow = False
    context.trap_inexact = False
    context.trap_invalid = False
    context.trap_erange = False
    context.trap_divzero = False
    context.allow_complex = False
    context.rational_division = False
    context.allow_release_gil = False
    context.clear_flags()
    return context


@contextmanager
def _context() -> Iterator[gmpy2.context]:
    with gmpy2.context(_template()):
        selected = gmpy2.get_context()
        selected.clear_flags()
        yield selected


def _flags(context: gmpy2.context, operation: str) -> None:
    found = [
        name
        for name in ("invalid", "divzero", "overflow", "underflow", "erange")
        if bool(getattr(context, name))
    ]
    if found:
        raise MpfrCoreReplayError(
            "replay_forbidden_mpfr_flag", f"{operation}:{','.join(found)}"
        )
    context.clear_flags()


def _exact_float(value: float) -> gmpy2.mpfr:
    if type(value) is not float or not math.isfinite(value):
        raise MpfrCoreReplayError("replay_binary64_input_invalid", "type")
    numerator, denominator = value.as_integer_ratio()
    return gmpy2.mpfr(gmpy2.mpq(numerator, denominator))


def _encoded(value: gmpy2.mpfr) -> str:
    numerator, denominator = value.as_integer_ratio()
    numerator = int(numerator)
    denominator = int(denominator)
    if numerator == 0:
        return "0:0:0:256:C"
    sign = -1 if numerator < 0 else 1
    mantissa = abs(numerator)
    exponent = 1 - denominator.bit_length()
    while mantissa % 2 == 0:
        mantissa //= 2
        exponent += 1
    return f"{sign}:{mantissa:x}:{exponent}:256:C"


def _hash_vector(domain: bytes, values: list[gmpy2.mpfr]) -> str:
    payload = json.dumps(
        [_encoded(value) for value in values], separators=(",", ":")
    ).encode()
    return hashlib.sha256(
        domain + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()


def _radial_matrix(
    rho: list[gmpy2.mpfr],
    first: list[list[gmpy2.mpfr]],
    second: list[list[gmpy2.mpfr]],
) -> list[list[gmpy2.mpfr]]:
    radial = [[gmpy2.mpfr(0) for _ in range(NODE_COUNT)] for _ in range(NODE_COUNT)]
    for row in range(1, NODE_COUNT - 1):
        factor = (1 - rho[row]) ** 4
        for column in range(NODE_COUNT):
            radial[row][column] = factor * (
                second[row][column] + 2 * first[row][column] / rho[row]
            )
    return radial


def _row_product(
    matrix: list[list[gmpy2.mpfr]],
    row: int,
    values: list[gmpy2.mpfr],
    offset: int,
) -> gmpy2.mpfr:
    products = [
        matrix[row][column] * values[offset + column]
        for column in range(NODE_COUNT)
    ]
    total = gmpy2.mpfr(0)
    for product in products:
        total += product
    return total


def _system(
    first: list[list[gmpy2.mpfr]],
    radial: list[list[gmpy2.mpfr]],
    state: list[gmpy2.mpfr],
    *,
    need_jacobian: bool,
) -> tuple[list[gmpy2.mpfr], list[list[gmpy2.mpfr]] | None, bool]:
    residual = [gmpy2.mpfr(0) for _ in range(ORDER)]
    nu = state[-1]
    residual[0] = _row_product(first, 0, state, 0)
    residual[NODE_COUNT - 1] = state[NODE_COUNT - 1]
    residual[NODE_COUNT] = _row_product(first, 0, state, NODE_COUNT)
    residual[2 * NODE_COUNT - 1] = state[2 * NODE_COUNT - 1]
    for row in range(1, NODE_COUNT - 1):
        residual[row] = (
            -_row_product(radial, row, state, 0) / 2
            + (state[NODE_COUNT + row] - nu) * state[row]
        )
        residual[NODE_COUNT + row] = (
            _row_product(radial, row, state, NODE_COUNT)
            - state[row] * state[row]
        )
    residual[-1] = state[0] - 1
    valid = bool(nu < 0 and nu * (gmpy2.mpfr(2) ** -10) > -gmpy2.mpfr("0.5"))
    if not need_jacobian:
        return residual, None, valid

    jacobian = [[gmpy2.mpfr(0) for _ in range(ORDER)] for _ in range(ORDER)]
    jacobian[0][:NODE_COUNT] = list(first[0])
    jacobian[NODE_COUNT - 1][NODE_COUNT - 1] = 1
    jacobian[NODE_COUNT][NODE_COUNT : 2 * NODE_COUNT] = list(first[0])
    jacobian[2 * NODE_COUNT - 1][2 * NODE_COUNT - 1] = 1
    jacobian[-1][0] = 1
    for row in range(1, NODE_COUNT - 1):
        for column in range(NODE_COUNT):
            jacobian[row][column] = -radial[row][column] / 2
            jacobian[NODE_COUNT + row][NODE_COUNT + column] = radial[row][column]
        jacobian[row][row] += state[NODE_COUNT + row] - nu
        jacobian[row][NODE_COUNT + row] = state[row]
        jacobian[row][-1] = -state[row]
        jacobian[NODE_COUNT + row][row] = -2 * state[row]
    return residual, jacobian, valid


def _maximum(values: list[gmpy2.mpfr]) -> gmpy2.mpfr:
    return max(abs(value) for value in values)


def _sum_squares(values: list[gmpy2.mpfr]) -> gmpy2.mpfr:
    total = gmpy2.mpfr(0)
    for value in values:
        total += value**2
    return total


def _inverse_equilibrated(
    jacobian: list[list[gmpy2.mpfr]], residual: list[gmpy2.mpfr]
) -> tuple[list[gmpy2.mpfr], gmpy2.mpfr, gmpy2.mpfr]:
    row_scale = [max(abs(value) for value in row) for row in jacobian]
    if any(value <= 0 or not gmpy2.is_finite(value) for value in row_scale):
        raise MpfrCoreReplayError("replay_row_scale_invalid", "value")
    row_matrix = [
        [jacobian[row][column] / row_scale[row] for column in range(ORDER)]
        for row in range(ORDER)
    ]
    column_scale = [
        max(abs(row_matrix[row][column]) for row in range(ORDER))
        for column in range(ORDER)
    ]
    if any(value <= 0 or not gmpy2.is_finite(value) for value in column_scale):
        raise MpfrCoreReplayError("replay_column_scale_invalid", "value")
    original = [
        [row_matrix[row][column] / column_scale[column] for column in range(ORDER)]
        for row in range(ORDER)
    ]
    right = [-residual[row] / row_scale[row] for row in range(ORDER)]
    augmented = [
        list(original[row])
        + [gmpy2.mpfr(1 if row == column else 0) for column in range(ORDER)]
        for row in range(ORDER)
    ]
    width = 2 * ORDER
    for column in range(ORDER):
        pivot_row = max(
            range(column, ORDER), key=lambda row: abs(augmented[row][column])
        )
        pivot = augmented[pivot_row][column]
        if pivot == 0:
            raise MpfrCoreReplayError("replay_dense_solve_singular", str(column))
        augmented[column], augmented[pivot_row] = (
            augmented[pivot_row],
            augmented[column],
        )
        pivot = augmented[column][column]
        for index in range(width):
            augmented[column][index] /= pivot
        for row in range(ORDER):
            if row == column:
                continue
            factor = augmented[row][column]
            if factor == 0:
                continue
            augmented[row][column] = gmpy2.mpfr(0)
            for index in range(column + 1, width):
                augmented[row][index] -= factor * augmented[column][index]
    inverse = [row[ORDER:] for row in augmented]

    def apply_inverse(vector: list[gmpy2.mpfr]) -> list[gmpy2.mpfr]:
        output: list[gmpy2.mpfr] = []
        for row in range(ORDER):
            value = gmpy2.mpfr(0)
            for column in range(ORDER):
                value += inverse[row][column] * vector[column]
            output.append(value)
        return output

    scaled_direction = apply_inverse(right)
    for _ in range(3):
        defect: list[gmpy2.mpfr] = []
        for row in range(ORDER):
            product = gmpy2.mpfr(0)
            for column in range(ORDER):
                product += original[row][column] * scaled_direction[column]
            defect.append(right[row] - product)
        correction = apply_inverse(defect)
        scaled_direction = [
            scaled_direction[index] + correction[index] for index in range(ORDER)
        ]
    direction = [
        scaled_direction[index] / column_scale[index] for index in range(ORDER)
    ]
    return (
        direction,
        max(row_scale) / min(row_scale),
        max(column_scale) / min(column_scale),
    )


def _step_norm(step: list[gmpy2.mpfr], state: list[gmpy2.mpfr]) -> gmpy2.mpfr:
    return max(
        abs(step[index]) / max(gmpy2.mpfr(1), abs(state[index]))
        for index in range(ORDER)
    )


def _comparison(state: list[gmpy2.mpfr]) -> tuple[str, str]:
    words = [struct.pack(">d", float(value)).hex() for value in state]
    wire = json.dumps(
        {
            "comparisonVersion": COMPARISON_VERSION,
            "nodeCount": NODE_COUNT,
            "projectedStateF64BeWordHex": words,
        },
        separators=(",", ":"),
        sort_keys=True,
    )
    payload = wire.encode()
    digest = hashlib.sha256(
        COMPARISON_DOMAIN + len(payload).to_bytes(8, "little") + payload
    ).hexdigest()
    return wire, digest


def _result(
    *,
    status: str,
    failure: str | None,
    current: list[gmpy2.mpfr],
    residual: list[gmpy2.mpfr],
    projected: list[gmpy2.mpfr] | None,
    projected_residual: list[gmpy2.mpfr] | None,
    updates: list[FrozenReplayUpdate],
    solves: int,
    evaluations: int,
    trials: int,
) -> FrozenMpfrCoreReplayResult:
    wire = digest = None
    if projected is not None:
        wire, digest = _comparison(projected)
    return FrozenMpfrCoreReplayResult(
        status=status,
        failure_code=failure,
        updates=tuple(updates),
        dense_solve_count=solves,
        full_evaluation_count=evaluations,
        trial_attempt_count=trials,
        current_state_sha256=_hash_vector(STATE_DOMAIN, current),
        current_residual_sha256=_hash_vector(RESIDUAL_DOMAIN, residual),
        projected_state_sha256=(
            _hash_vector(STATE_DOMAIN, projected) if projected is not None else None
        ),
        projected_residual_sha256=(
            _hash_vector(RESIDUAL_DOMAIN, projected_residual)
            if projected_residual is not None
            else None
        ),
        comparison_wire=wire,
        comparison_sha256=digest,
        raw_equation_linf=_encoded(_maximum(residual)),
        projection_raw_equation_linf=(
            _encoded(_maximum(projected_residual))
            if projected_residual is not None
            else None
        ),
        numerical_go=status == "GO",
    )


def replay_frozen_n64_successor() -> FrozenMpfrCoreReplayResult:
    """Execute the source-disjoint zero-input N=64 v2 graph exactly once."""

    _verify_bindings()
    initializer = _initializer_module()
    spectral = initializer._spectral_module.generate_lobatto_spectral_primitive(
        NODE_COUNT
    )
    initial = initializer.materialize_fixed_l0_initializer(spectral)
    with _context() as context:
        rho = [_exact_float(value) for value in spectral.rho]
        first = [
            [_exact_float(value) for value in row]
            for row in spectral.first_derivative
        ]
        second = [
            [_exact_float(value) for value in row]
            for row in spectral.second_derivative
        ]
        radial = _radial_matrix(rho, first, second)
        current = [_exact_float(value) for value in initial.z]
        _flags(context, "inputs")
        residual, jacobian, valid = _system(
            first, radial, current, need_jacobian=True
        )
        _flags(context, "initial")
        if not valid or jacobian is None:
            return _result(
                status="FAIL",
                failure="initial_domain_invalid_without_retry",
                current=current,
                residual=residual,
                projected=None,
                projected_residual=None,
                updates=[],
                solves=0,
                evaluations=1,
                trials=0,
            )
        sum_squares = _sum_squares(residual)
        phi = sum_squares / 2
        equation_gate = gmpy2.mpfr(2) ** -40
        step_gate = gmpy2.mpfr(2) ** -42
        armijo = gmpy2.mpfr(2) ** -12
        updates: list[FrozenReplayUpdate] = []
        evaluations = 1
        trials = 0
        consecutive = 0
        for ordinal in range(1, MAXIMUM_UPDATES + 1):
            direction, row_span, column_span = _inverse_equilibrated(
                jacobian, residual
            )
            _flags(context, f"solve[{ordinal}]")
            accepted = None
            for exponent in range(TRIAL_COUNT):
                trials += 1
                alpha = gmpy2.mpfr(2) ** -exponent
                step = [alpha * value for value in direction]
                trial_state = [
                    current[index] + step[index] for index in range(ORDER)
                ]
                trial_residual, trial_jacobian, trial_valid = _system(
                    first, radial, trial_state, need_jacobian=True
                )
                evaluations += 1
                _flags(context, f"trial[{ordinal},{exponent}]")
                if not trial_valid or trial_jacobian is None:
                    continue
                trial_squares = _sum_squares(trial_residual)
                trial_phi = trial_squares / 2
                if trial_phi <= phi - armijo * alpha * sum_squares:
                    accepted = (
                        exponent,
                        step,
                        trial_state,
                        trial_residual,
                        trial_jacobian,
                        trial_squares,
                        trial_phi,
                    )
                    break
            if accepted is None:
                return _result(
                    status="FAIL",
                    failure="armijo_schedule_exhausted_without_retry",
                    current=current,
                    residual=residual,
                    projected=None,
                    projected_residual=None,
                    updates=updates,
                    solves=ordinal,
                    evaluations=evaluations,
                    trials=trials,
                )
            (
                exponent,
                step,
                current,
                residual,
                jacobian,
                sum_squares,
                phi,
            ) = accepted
            equation_linf = _maximum(residual)
            step_linf = _step_norm(step, current)
            consecutive = (
                consecutive + 1
                if equation_linf <= equation_gate and step_linf <= step_gate
                else 0
            )
            updates.append(
                FrozenReplayUpdate(
                    ordinal=ordinal,
                    alpha_exponent=exponent,
                    equation_linf=_encoded(equation_linf),
                    step_linf=_encoded(step_linf),
                    row_scale_span=_encoded(row_span),
                    column_scale_span=_encoded(column_span),
                    consecutive=consecutive,
                )
            )
            if consecutive == 2:
                projected = list(current)
                projected[NODE_COUNT - 1] = gmpy2.mpfr(0)
                projected[2 * NODE_COUNT - 1] = gmpy2.mpfr(0)
                projected_residual, _, projected_valid = _system(
                    first, radial, projected, need_jacobian=False
                )
                _flags(context, "projection")
                if not projected_valid or _maximum(projected_residual) > equation_gate:
                    return _result(
                        status="FAIL",
                        failure="projection_residual_gate_failed_without_retry",
                        current=current,
                        residual=residual,
                        projected=projected,
                        projected_residual=projected_residual,
                        updates=updates,
                        solves=ordinal,
                        evaluations=evaluations,
                        trials=trials,
                    )
                return _result(
                    status="GO",
                    failure=None,
                    current=current,
                    residual=residual,
                    projected=projected,
                    projected_residual=projected_residual,
                    updates=updates,
                    solves=ordinal,
                    evaluations=evaluations,
                    trials=trials,
                )
        return _result(
            status="FAIL",
            failure="maximum_updates_reached_without_retry",
            current=current,
            residual=residual,
            projected=None,
            projected_residual=None,
            updates=updates,
            solves=MAXIMUM_UPDATES,
            evaluations=evaluations,
            trials=trials,
        )


__all__ = [
    "FrozenMpfrCoreReplayResult",
    "FrozenReplayUpdate",
    "MpfrCoreReplayError",
    "replay_frozen_n64_successor",
]
