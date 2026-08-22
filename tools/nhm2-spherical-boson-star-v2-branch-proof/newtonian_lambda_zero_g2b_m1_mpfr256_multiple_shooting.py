"""Bounded MPFR256 multiple-shooting engine for the G2B-M1 review.

Program gate: G2B-M1 — MPFR256 global-center implementation review
Workstream: versioned classical-branch repair review
Capability or component: fixed 16-segment variational multiple shooting
Current maturity: private calculation engine; candidate execution disabled
Target maturity: audited engine eligible for a separately frozen one-shot run
Required frozen inputs: G2-R1 receipt, G2B-A failure, and active M1 packet
Required evidence: runtime pins, exact origin jets, variational replay, fixed
  topology, deterministic linear algebra, context restoration, hostile tests
Stop/fail criteria: binding/context drift, flag, nonfinite value, topology drift,
  pivot failure, unauthorized public execution, or authority promotion
Explicit non-goals: candidate execution, proof, lamp, physical/propulsion/
  transport authority, threshold change, or result-derived method selection
Downstream gate unlocked: one separately frozen G2B-M1 one-shot proposal
"""

from __future__ import annotations

from contextlib import contextmanager
import bisect
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import site
import struct
import sys
from types import MappingProxyType
from typing import Final, Iterator, NoReturn, Sequence


def _load_gmpy2():
    try:
        import gmpy2 as loaded

        return loaded
    except ModuleNotFoundError:
        user_site = Path(site.getusersitepackages()).resolve()
        if str(user_site) not in sys.path:
            sys.path.insert(0, str(user_site))
        import gmpy2 as loaded

        return loaded


gmpy2 = _load_gmpy2()


__all__ = ["G2BM1ImplementationBlocked", "observe_g2b_m1_implementation"]

ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m1-mpfr256-global-center-review.md"
)
PACKET_SHA256: Final[str] = (
    "c9082bbde6ca210fc1ee4c13d35fa3d2dde6bc579767e933673660176e58cf76"
)
PACKET_SIZE_BYTES: Final[int] = 9_327

GLOBAL_CENTER_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-global-root-primary-v1.json"
)
GLOBAL_CENTER_SHA256: Final[str] = (
    "d0b0f74da5eb2512fe23e4bb049aa1d68cef6d9c9f590af993027b4af6509f30"
)
GLOBAL_CENTER_SIZE_BYTES: Final[int] = 196_505

GMPY2_VERSION: Final[str] = "2.3.1"
MPFR_VERSION: Final[str] = "MPFR 4.2.2"
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

PRECISION_BITS: Final[int] = 256
EMIN: Final[int] = -1_000_000
EMAX: Final[int] = 1_000_000
EPSILON: Final[Fraction] = Fraction(1, 4_096)
OUTER_RADIUS: Final[Fraction] = Fraction(32)
ORIGIN_MAXIMUM_INDEX: Final[int] = 16
OUTPUT_INTERVALS: Final[int] = 8_192
OUTPUT_NODE_COUNT: Final[int] = OUTPUT_INTERVALS + 1
SEGMENT_COUNT: Final[int] = 16
SEGMENT_INTERVAL_COUNT: Final[int] = 512
UNKNOWN_COUNT: Final[int] = 62
REFINEMENT_SUBSTEPS: Final[tuple[int, int]] = (4, 8)
MAXIMUM_NEWTON_ITERATIONS: Final[int] = 12
DAMPING_DENOMINATORS: Final[tuple[int, ...]] = (
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    128,
    256,
)

AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "candidateAuthority": False,
        "proofAuthority": False,
        "executionAuthority": False,
        "diagnosticLampAuthority": False,
        "physicalAuthority": False,
        "propulsionAuthority": False,
        "transportAuthority": False,
    }
)

_TEST_MARKER: Final = object()


class G2BM1ImplementationBlocked(RuntimeError):
    """Typed fail-closed review or private-engine error."""

    def __init__(
        self, code: str, detail: str = "", evidence: object | None = None
    ) -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail
        self.evidence = evidence


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM1ImplementationBlocked(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _verify_file(path: Path, size: int, digest: str, label: str) -> None:
    try:
        before = path.stat()
        raw = path.read_bytes()
        after = path.stat()
    except OSError as error:
        raise G2BM1ImplementationBlocked(
            f"{label}_unavailable", type(error).__name__
        ) from error
    identity = lambda value: (
        value.st_dev,
        value.st_ino,
        value.st_size,
        value.st_mtime_ns,
    )
    if identity(before) != identity(after):
        _fail(f"{label}_changed_during_read")
    if len(raw) != size or _sha256(raw) != digest:
        _fail(f"{label}_binding_mismatch")


def _verify_static_inputs() -> None:
    _verify_file(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify_file(
        GLOBAL_CENTER_PATH,
        GLOBAL_CENTER_SIZE_BYTES,
        GLOBAL_CENTER_SHA256,
        "global_center",
    )


def _verify_runtime() -> tuple[str, str, str]:
    if gmpy2.version() != GMPY2_VERSION or gmpy2.mpfr_version() != MPFR_VERSION:
        _fail("g2b_m1_mpfr_version_mismatch")
    extension = Path(gmpy2.gmpy2.__file__).resolve(strict=True)
    libraries = extension.parent.parent / "gmpy2.libs"
    mpfr = libraries / "libmpfr-6.dll"
    gmp = libraries / "libgmp-10.dll"
    _verify_file(
        extension,
        GMPY2_EXTENSION_SIZE_BYTES,
        GMPY2_EXTENSION_SHA256,
        "gmpy2_extension",
    )
    _verify_file(mpfr, MPFR_DLL_SIZE_BYTES, MPFR_DLL_SHA256, "mpfr_dll")
    _verify_file(gmp, GMP_DLL_SIZE_BYTES, GMP_DLL_SHA256, "gmp_dll")
    return str(extension), str(mpfr), str(gmp)


def _context_template():
    context = gmpy2.get_context().copy()
    context.precision = PRECISION_BITS
    context.round = gmpy2.RoundToNearest
    context.emin = EMIN
    context.emax = EMAX
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
def _mpfr_context() -> Iterator[object]:
    before = gmpy2.get_context().copy()
    forbidden = False
    try:
        with gmpy2.context(_context_template()):
            active = gmpy2.get_context()
            active.clear_flags()
            try:
                yield active
            finally:
                forbidden = any(
                    (
                        active.invalid,
                        active.divzero,
                        active.overflow,
                        active.underflow,
                        active.erange,
                    )
                )
    finally:
        after = gmpy2.get_context()
        names = (
            "precision",
            "round",
            "emin",
            "emax",
            "subnormalize",
            "trap_underflow",
            "trap_overflow",
            "trap_inexact",
            "trap_invalid",
            "trap_erange",
            "trap_divzero",
            "allow_complex",
            "rational_division",
            "allow_release_gil",
        )
        if any(getattr(after, name) != getattr(before, name) for name in names):
            _fail("g2b_m1_mpfr_context_restore_failed")
    if forbidden:
        _fail("g2b_m1_forbidden_mpfr_flag")


def _mp(value: Fraction | int | str | float):
    if isinstance(value, Fraction):
        return gmpy2.mpfr(gmpy2.mpq(value.numerator, value.denominator))
    if type(value) is float:
        return gmpy2.mpfr(value)
    return gmpy2.mpfr(value)


def _finite(value: object, label: str):
    result = gmpy2.mpfr(value)
    if not gmpy2.is_finite(result):
        _fail("g2b_m1_nonfinite", label)
    return gmpy2.mpfr(0) if gmpy2.is_zero(result) else result


def _origin_jet(vc: object, nu: object):
    vc = _finite(vc, "origin_vc")
    nu = _finite(nu, "origin_nu")
    one = gmpy2.mpfr(1)
    zero = gmpy2.mpfr(0)
    a = [one]
    b = [vc]
    da_vc = [zero]
    db_vc = [one]
    da_nu = [zero]
    db_nu = [zero]
    for shell in range(ORIGIN_MAXIMUM_INDEX):
        denominator = gmpy2.mpfr((2 * shell + 2) * (2 * shell + 3))
        ba = sum((b[k] * a[shell - k] for k in range(shell + 1)), zero)
        aa = sum((a[k] * a[shell - k] for k in range(shell + 1)), zero)
        dba_vc = sum(
            (
                db_vc[k] * a[shell - k] + b[k] * da_vc[shell - k]
                for k in range(shell + 1)
            ),
            zero,
        )
        daa_vc = sum(
            (
                da_vc[k] * a[shell - k] + a[k] * da_vc[shell - k]
                for k in range(shell + 1)
            ),
            zero,
        )
        dba_nu = sum(
            (
                db_nu[k] * a[shell - k] + b[k] * da_nu[shell - k]
                for k in range(shell + 1)
            ),
            zero,
        )
        daa_nu = sum(
            (
                da_nu[k] * a[shell - k] + a[k] * da_nu[shell - k]
                for k in range(shell + 1)
            ),
            zero,
        )
        a.append(2 * (ba - nu * a[shell]) / denominator)
        b.append(aa / denominator)
        da_vc.append(2 * (dba_vc - nu * da_vc[shell]) / denominator)
        db_vc.append(daa_vc / denominator)
        da_nu.append(
            2 * (dba_nu - a[shell] - nu * da_nu[shell]) / denominator
        )
        db_nu.append(daa_nu / denominator)
    x = _mp(EPSILON)
    x2 = x * x

    def evaluate(coefficients: Sequence[object]) -> tuple[object, object]:
        value = gmpy2.mpfr(0)
        derivative = gmpy2.mpfr(0)
        power = gmpy2.mpfr(1)
        derivative_power = x
        for index, coefficient in enumerate(coefficients):
            value += coefficient * power
            if index:
                derivative += 2 * index * coefficient * derivative_power
                derivative_power *= x2
            power *= x2
        return _finite(value, "origin_value"), _finite(
            derivative, "origin_derivative"
        )

    u, p = evaluate(a)
    potential, q = evaluate(b)
    du_vc, dp_vc = evaluate(da_vc)
    dv_vc, dq_vc = evaluate(db_vc)
    du_nu, dp_nu = evaluate(da_nu)
    dv_nu, dq_nu = evaluate(db_nu)
    return (
        (u, p, potential, q),
        (du_vc, dp_vc, dv_vc, dq_vc),
        (du_nu, dp_nu, dv_nu, dq_nu),
    )


def _state_rhs(x: object, state: Sequence[object], nu: object):
    if len(state) != 4:
        _fail("g2b_m1_state_shape")
    x = _finite(x, "rhs_x")
    if not x > 0:
        _fail("g2b_m1_x_not_positive")
    u, p, potential, q = (_finite(value, "rhs_state") for value in state)
    nu = _finite(nu, "rhs_nu")
    return (
        p,
        2 * (potential - nu) * u - 2 * p / x,
        q,
        u * u - 2 * q / x,
    )


def _state_matrix(x: object, state: Sequence[object], nu: object):
    x = _finite(x, "matrix_x")
    u, _p, potential, _q = state
    zero = gmpy2.mpfr(0)
    one = gmpy2.mpfr(1)
    return (
        (zero, one, zero, zero),
        (2 * (potential - nu), -2 / x, 2 * u, zero),
        (zero, zero, zero, one),
        (2 * u, zero, zero, -2 / x),
    )


def _augmented_rhs(x: object, vector: Sequence[object], nu: object):
    if len(vector) != 24:
        _fail("g2b_m1_augmented_shape")
    state = tuple(vector[:4])
    phi = tuple(
        tuple(vector[4 + 4 * row + col] for col in range(4)) for row in range(4)
    )
    sensitivity = tuple(vector[20:24])
    state_rhs = _state_rhs(x, state, nu)
    matrix = _state_matrix(x, state, nu)
    phi_rhs = tuple(
        sum((matrix[row][k] * phi[k][col] for k in range(4)), gmpy2.mpfr(0))
        for row in range(4)
        for col in range(4)
    )
    source = (gmpy2.mpfr(0), -2 * state[0], gmpy2.mpfr(0), gmpy2.mpfr(0))
    sensitivity_rhs = tuple(
        sum(
            (matrix[row][k] * sensitivity[k] for k in range(4)),
            source[row],
        )
        for row in range(4)
    )
    return (*state_rhs, *phi_rhs, *sensitivity_rhs)


def _rk4_step(rhs, x: object, vector: Sequence[object], step: object, nu: object):
    half = step / 2
    k1 = rhs(x, vector, nu)
    stage2 = tuple(vector[i] + half * k1[i] for i in range(len(vector)))
    k2 = rhs(x + half, stage2, nu)
    stage3 = tuple(vector[i] + half * k2[i] for i in range(len(vector)))
    k3 = rhs(x + half, stage3, nu)
    stage4 = tuple(vector[i] + step * k3[i] for i in range(len(vector)))
    k4 = rhs(x + step, stage4, nu)
    sixth = step / 6
    return tuple(
        _finite(
            vector[i] + sixth * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]),
            "rk4_output",
        )
        for i in range(len(vector))
    )


def _identity_augmented(state: Sequence[object]):
    zero = gmpy2.mpfr(0)
    one = gmpy2.mpfr(1)
    phi = tuple(one if row == col else zero for row in range(4) for col in range(4))
    return (*tuple(state), *phi, zero, zero, zero, zero)


def _integrate_interval(
    vector: Sequence[object],
    left: object,
    right: object,
    nu: object,
    substeps: int,
    *,
    augmented: bool,
):
    if type(substeps) is not int or substeps <= 0:
        _fail("g2b_m1_substeps_invalid")
    step = (right - left) / substeps
    x = left
    rhs = _augmented_rhs if augmented else _state_rhs
    current = tuple(vector)
    for _ordinal in range(substeps):
        current = _rk4_step(rhs, x, current, step, nu)
        x += step
    return current


def _output_mesh_binary64() -> tuple[float, ...]:
    epsilon = float(EPSILON)
    radius = float(OUTER_RADIUS)
    mesh = tuple(
        epsilon
        + (radius - epsilon)
        * (1.0 - math.cos(math.pi * ordinal / OUTPUT_INTERVALS))
        / 2.0
        for ordinal in range(OUTPUT_NODE_COUNT)
    )
    if (
        len(mesh) != OUTPUT_NODE_COUNT
        or mesh[0] != epsilon
        or mesh[-1] != radius
        or any(not math.isfinite(value) for value in mesh)
        or any(not mesh[index] < mesh[index + 1] for index in range(OUTPUT_INTERVALS))
    ):
        _fail("g2b_m1_output_mesh_invalid")
    return mesh


def _f64_from_hex(word: object, label: str) -> float:
    if type(word) is not str or len(word) != 16:
        _fail("g2b_m1_f64_word_invalid", label)
    try:
        raw = bytes.fromhex(word)
    except ValueError as error:
        raise G2BM1ImplementationBlocked(
            "g2b_m1_f64_word_invalid", label
        ) from error
    value = struct.unpack(">d", raw)[0]
    if not math.isfinite(value) or raw == bytes.fromhex("8000000000000000"):
        _fail("g2b_m1_f64_value_invalid", label)
    return value


def _load_initializer():
    _verify_file(
        GLOBAL_CENTER_PATH,
        GLOBAL_CENTER_SIZE_BYTES,
        GLOBAL_CENTER_SHA256,
        "global_center",
    )
    try:
        root = json.loads(GLOBAL_CENTER_PATH.read_bytes())
    except (ValueError, TypeError) as error:
        raise G2BM1ImplementationBlocked(
            "g2b_m1_global_center_json_invalid", type(error).__name__
        ) from error
    if type(root) is not dict or root.get("decision") != "CALCULATION_CENTER_ONLY":
        _fail("g2b_m1_global_center_schema_invalid")
    mesh_words = root.get("meshF64Hex")
    rows_words = root.get("stateRowsF64Hex")
    parameters = root.get("parameters")
    if (
        type(mesh_words) is not list
        or type(rows_words) is not list
        or len(rows_words) != 4
        or type(parameters) is not dict
        or any(
            type(row) is not list or len(row) != len(mesh_words)
            for row in rows_words
        )
    ):
        _fail("g2b_m1_global_center_shape_invalid")
    mesh = tuple(
        _f64_from_hex(word, f"mesh_{ordinal}")
        for ordinal, word in enumerate(mesh_words)
    )
    rows = tuple(
        tuple(
            _f64_from_hex(word, f"state_{row_ordinal}_{ordinal}")
            for ordinal, word in enumerate(row)
        )
        for row_ordinal, row in enumerate(rows_words)
    )
    vc = _f64_from_hex(parameters.get("VcF64Hex"), "Vc")
    nu = _f64_from_hex(parameters.get("nuF64Hex"), "nu")
    if (
        len(mesh) < 2
        or mesh[0] != float(EPSILON)
        or mesh[-1] != float(OUTER_RADIUS)
        or any(not mesh[index] < mesh[index + 1] for index in range(len(mesh) - 1))
    ):
        _fail("g2b_m1_global_center_mesh_invalid")
    return mesh, rows, vc, nu


def _hermite_pair(
    x: float,
    left_x: float,
    right_x: float,
    left_value: float,
    right_value: float,
    left_derivative: float,
    right_derivative: float,
) -> tuple[float, float]:
    width = right_x - left_x
    t = (x - left_x) / width
    t2 = t * t
    t3 = t2 * t
    h00 = 2 * t3 - 3 * t2 + 1
    h10 = t3 - 2 * t2 + t
    h01 = -2 * t3 + 3 * t2
    h11 = t3 - t2
    value = (
        h00 * left_value
        + h10 * width * left_derivative
        + h01 * right_value
        + h11 * width * right_derivative
    )
    derivative = (
        (6 * t2 - 6 * t) * left_value / width
        + (3 * t2 - 4 * t + 1) * left_derivative
        + (-6 * t2 + 6 * t) * right_value / width
        + (3 * t2 - 2 * t) * right_derivative
    )
    if not math.isfinite(value) or not math.isfinite(derivative):
        _fail("g2b_m1_initializer_hermite_nonfinite")
    return value, derivative


def _initializer_state(
    x: float, mesh: Sequence[float], rows: Sequence[Sequence[float]]
) -> tuple[float, float, float, float]:
    if x < mesh[0] or x > mesh[-1]:
        _fail("g2b_m1_initializer_point_out_of_range")
    right = bisect.bisect_left(mesh, x)
    if right < len(mesh) and mesh[right] == x:
        return tuple(row[right] for row in rows)  # type: ignore[return-value]
    if right == 0 or right == len(mesh):
        _fail("g2b_m1_initializer_interval_missing")
    left = right - 1
    u, p = _hermite_pair(
        x,
        mesh[left],
        mesh[right],
        rows[0][left],
        rows[0][right],
        rows[1][left],
        rows[1][right],
    )
    potential, q = _hermite_pair(
        x,
        mesh[left],
        mesh[right],
        rows[2][left],
        rows[2][right],
        rows[3][left],
        rows[3][right],
    )
    return u, p, potential, q


def _initial_unknowns():
    mesh, rows, vc, nu = _load_initializer()
    output_mesh = _output_mesh_binary64()
    values = [gmpy2.mpfr(vc), gmpy2.mpfr(nu)]
    for segment in range(1, SEGMENT_COUNT):
        state = _initializer_state(
            output_mesh[segment * SEGMENT_INTERVAL_COUNT], mesh, rows
        )
        values.extend(gmpy2.mpfr(value) for value in state)
    if len(values) != UNKNOWN_COUNT:
        _fail("g2b_m1_initial_unknown_count")
    return tuple(values)


def _propagate_segment(
    start: Sequence[object],
    nu: object,
    segment: int,
    substeps: int,
    *,
    augmented: bool,
):
    if type(segment) is not int or not 0 <= segment < SEGMENT_COUNT:
        _fail("g2b_m1_segment_invalid")
    mesh = _output_mesh_binary64()
    current = _identity_augmented(start) if augmented else tuple(start)
    first = segment * SEGMENT_INTERVAL_COUNT
    last = first + SEGMENT_INTERVAL_COUNT
    for ordinal in range(first, last):
        current = _integrate_interval(
            current,
            gmpy2.mpfr(mesh[ordinal]),
            gmpy2.mpfr(mesh[ordinal + 1]),
            nu,
            substeps,
            augmented=augmented,
        )
    return current


def _matvec(matrix, vector):
    return tuple(
        sum(
            (matrix[row][column] * vector[column] for column in range(4)),
            gmpy2.mpfr(0),
        )
        for row in range(4)
    )


def _system(variables: Sequence[object], substeps: int, *, jacobian: bool):
    if len(variables) != UNKNOWN_COUNT:
        _fail("g2b_m1_unknown_shape")
    values = tuple(_finite(value, "unknown") for value in variables)
    vc, nu = values[:2]
    if not vc < nu < 0:
        _fail("g2b_m1_parameter_signs_invalid")
    origin, origin_vc, origin_nu = _origin_jet(vc, nu)
    zero = gmpy2.mpfr(0)
    residual = [zero for _ in range(UNKNOWN_COUNT)]
    matrix = (
        [[zero for _ in range(UNKNOWN_COUNT)] for _ in range(UNKNOWN_COUNT)]
        if jacobian
        else None
    )
    final_state = None
    final_derivatives: dict[int, tuple[object, ...]] = {}
    for segment in range(SEGMENT_COUNT):
        if segment == 0:
            start = origin
        else:
            offset = 2 + 4 * (segment - 1)
            start = values[offset : offset + 4]
        propagated = _propagate_segment(
            start, nu, segment, substeps, augmented=jacobian
        )
        end = tuple(propagated[:4])
        derivatives: dict[int, tuple[object, ...]] = {}
        if jacobian:
            phi = tuple(
                tuple(propagated[4 + 4 * row + column] for column in range(4))
                for row in range(4)
            )
            nu_sensitivity = tuple(propagated[20:24])
            if segment == 0:
                derivatives[0] = _matvec(phi, origin_vc)
                origin_nu_end = _matvec(phi, origin_nu)
                derivatives[1] = tuple(
                    origin_nu_end[row] + nu_sensitivity[row] for row in range(4)
                )
            else:
                offset = 2 + 4 * (segment - 1)
                for column in range(4):
                    derivatives[offset + column] = tuple(
                        phi[row][column] for row in range(4)
                    )
                derivatives[1] = nu_sensitivity
        if segment < SEGMENT_COUNT - 1:
            next_offset = 2 + 4 * segment
            row_offset = 4 * segment
            for row in range(4):
                residual[row_offset + row] = end[row] - values[next_offset + row]
                if matrix is not None:
                    for column, derivative in derivatives.items():
                        matrix[row_offset + row][column] = derivative[row]
                    matrix[row_offset + row][next_offset + row] = -1
        else:
            final_state = end
            final_derivatives = derivatives
    if final_state is None:
        _fail("g2b_m1_final_state_missing")
    radius = _mp(OUTER_RADIUS)
    u, p, potential, q = final_state
    kappa = gmpy2.sqrt(-2 * nu)
    coefficient = kappa + 1 / radius - radius * q / kappa
    tail = (q + potential / radius, p + coefficient * u)
    residual[-2:] = tail
    if matrix is not None:
        tail_y = (
            (zero, zero, 1 / radius, 1),
            (coefficient, 1, zero, -radius * u / kappa),
        )
        for row in range(2):
            output_row = UNKNOWN_COUNT - 2 + row
            for column, derivative in final_derivatives.items():
                matrix[output_row][column] = sum(
                    (tail_y[row][state] * derivative[state] for state in range(4)),
                    zero,
                )
        matrix[-1][1] += -u / kappa - radius * q * u / (kappa * kappa * kappa)
    if any(not gmpy2.is_finite(value) for value in residual):
        _fail("g2b_m1_residual_nonfinite")
    return tuple(residual), matrix


def _maximum_absolute(values: Sequence[object]):
    return max((abs(value) for value in values), default=gmpy2.mpfr(0))


def _newton_refinement(initial: Sequence[object], substeps: int):
    if substeps not in REFINEMENT_SUBSTEPS:
        _fail("g2b_m1_refinement_not_frozen")
    variables = tuple(_finite(value, "newton_initial") for value in initial)
    convergence_limit = gmpy2.exp2(-180)
    chronology: list[dict[str, object]] = []
    try:
        for iteration in range(MAXIMUM_NEWTON_ITERATIONS):
            residual, jacobian = _system(variables, substeps, jacobian=True)
            if jacobian is None:
                _fail("g2b_m1_jacobian_missing")
            before = _maximum_absolute(residual)
            if before <= convergence_limit:
                chronology.append(
                    {
                        "iteration": iteration,
                        "maximumResidual": str(before),
                        "decision": "CONVERGED",
                    }
                )
                return variables, tuple(chronology)
            correction = _scaled_partial_pivot_solve(
                jacobian, tuple(-value for value in residual)
            )
            accepted = None
            for damping_ordinal, denominator in enumerate(DAMPING_DENOMINATORS):
                damping = gmpy2.mpfr(1) / denominator
                candidate = tuple(
                    variables[index] + damping * correction[index]
                    for index in range(UNKNOWN_COUNT)
                )
                try:
                    candidate_residual, _unused = _system(
                        candidate, substeps, jacobian=False
                    )
                except G2BM1ImplementationBlocked:
                    continue
                after = _maximum_absolute(candidate_residual)
                if after < before:
                    accepted = (candidate, damping_ordinal, denominator, after)
                    break
            if accepted is None:
                _fail("g2b_m1_newton_no_decreasing_damping", str(iteration))
            variables, damping_ordinal, denominator, after = accepted
            chronology.append(
                {
                    "iteration": iteration,
                    "maximumResidualBefore": str(before),
                    "dampingOrdinal": damping_ordinal,
                    "dampingDenominator": denominator,
                    "maximumResidualAfter": str(after),
                    "decision": "CONTINUE",
                }
            )
    except G2BM1ImplementationBlocked as error:
        error.evidence = {
            "chronology": tuple(chronology),
            "iteration": len(chronology),
            "substepsPerOutputInterval": substeps,
        }
        raise
    final_residual, _unused = _system(variables, substeps, jacobian=False)
    if _maximum_absolute(final_residual) > convergence_limit:
        _fail("g2b_m1_newton_iteration_limit")
    return variables, tuple(chronology)


def _materialize_state_rows(variables: Sequence[object], substeps: int):
    if substeps not in REFINEMENT_SUBSTEPS:
        _fail("g2b_m1_refinement_not_frozen")
    vc, nu = variables[:2]
    origin, _origin_vc, _origin_nu = _origin_jet(vc, nu)
    mesh = _output_mesh_binary64()
    rows: list[list[object]] = [[value] for value in origin]
    for segment in range(SEGMENT_COUNT):
        if segment == 0:
            current = tuple(origin)
        else:
            offset = 2 + 4 * (segment - 1)
            current = tuple(variables[offset : offset + 4])
            for row in range(4):
                rows[row][-1] = current[row]
        first = segment * SEGMENT_INTERVAL_COUNT
        last = first + SEGMENT_INTERVAL_COUNT
        for ordinal in range(first, last):
            current = _integrate_interval(
                current,
                gmpy2.mpfr(mesh[ordinal]),
                gmpy2.mpfr(mesh[ordinal + 1]),
                nu,
                substeps,
                augmented=False,
            )
            for row in range(4):
                rows[row].append(current[row])
    if any(len(row) != OUTPUT_NODE_COUNT for row in rows):
        _fail("g2b_m1_materialized_state_shape")
    return tuple(tuple(row) for row in rows)


def _normalized_difference(left: object, right: object):
    return abs(left - right) / (1 + abs(left) + abs(right))


def _compare_refinements(coarse_variables, fine_variables, coarse_rows, fine_rows):
    maximum = gmpy2.mpfr(0)
    for left, right in zip(coarse_variables[:2], fine_variables[:2], strict=True):
        maximum = max(maximum, _normalized_difference(left, right))
    for coarse_row, fine_row in zip(coarse_rows, fine_rows, strict=True):
        for left, right in zip(coarse_row, fine_row, strict=True):
            maximum = max(maximum, _normalized_difference(left, right))
    if maximum > gmpy2.exp2(-40):
        _fail("g2b_m1_cross_refinement_disagreement")
    richardson = maximum / 15
    if richardson > gmpy2.exp2(-44):
        _fail("g2b_m1_richardson_estimate_failed")
    return maximum, richardson


def _scaled_partial_pivot_solve(matrix, right_hand_side):
    size = len(right_hand_side)
    if size == 0 or len(matrix) != size or any(len(row) != size for row in matrix):
        _fail("g2b_m1_linear_shape")
    work = [[_finite(value, "linear_matrix") for value in row] for row in matrix]
    rhs = [_finite(value, "linear_rhs") for value in right_hand_side]
    scales = [max((abs(value) for value in row), default=gmpy2.mpfr(0)) for row in work]
    if any(scale == 0 for scale in scales):
        _fail("g2b_m1_linear_singular_scale")
    for column in range(size):
        pivot = max(
            range(column, size),
            key=lambda row: (abs(work[row][column]) / scales[row], -row),
        )
        if work[pivot][column] == 0:
            _fail("g2b_m1_linear_zero_pivot", str(column))
        if pivot != column:
            work[column], work[pivot] = work[pivot], work[column]
            rhs[column], rhs[pivot] = rhs[pivot], rhs[column]
            scales[column], scales[pivot] = scales[pivot], scales[column]
        for row in range(column + 1, size):
            factor = work[row][column] / work[column][column]
            work[row][column] = gmpy2.mpfr(0)
            for inner in range(column + 1, size):
                work[row][inner] -= factor * work[column][inner]
            rhs[row] -= factor * rhs[column]
    solution = [gmpy2.mpfr(0)] * size
    for row in range(size - 1, -1, -1):
        remainder = rhs[row] - sum(
            (work[row][column] * solution[column] for column in range(row + 1, size)),
            gmpy2.mpfr(0),
        )
        solution[row] = _finite(remainder / work[row][row], "linear_solution")
    return tuple(solution)


def _private_engine_self_check(marker: object) -> dict[str, object]:
    if marker is not _TEST_MARKER:
        _fail("g2b_m1_private_marker_required")
    _verify_static_inputs()
    runtime = _verify_runtime()
    with _mpfr_context():
        origin, derivative_vc, derivative_nu = _origin_jet(
            gmpy2.mpfr("-1.341763623490376"),
            gmpy2.mpfr("-0.692228684929245"),
        )
        augmented = _identity_augmented(origin)
        propagated = _integrate_interval(
            augmented,
            _mp(EPSILON),
            _mp(EPSILON) + gmpy2.mpfr("0.000001"),
            gmpy2.mpfr("-0.692228684929245"),
            2,
            augmented=True,
        )
        solution = _scaled_partial_pivot_solve(
            ((gmpy2.mpfr(3), gmpy2.mpfr(2)), (gmpy2.mpfr(1), gmpy2.mpfr(2))),
            (gmpy2.mpfr(5), gmpy2.mpfr(5)),
        )
        return {
            "authorityLocks": dict(AUTHORITY_LOCKS),
            "originFinite": all(gmpy2.is_finite(value) for value in origin),
            "originDerivativeVcFinite": all(
                gmpy2.is_finite(value) for value in derivative_vc
            ),
            "originDerivativeNuFinite": all(
                gmpy2.is_finite(value) for value in derivative_nu
            ),
            "propagatedCount": len(propagated),
            "runtimePaths": runtime,
            "segmentCount": SEGMENT_COUNT,
            "unknownCount": UNKNOWN_COUNT,
            "linearSolution": tuple(str(value) for value in solution),
        }


def observe_g2b_m1_implementation() -> NoReturn:
    """Keep candidate execution disabled during implementation review."""

    raise G2BM1ImplementationBlocked(
        "g2b_m1_one_shot_execution_not_preregistered"
    )


if (
    SEGMENT_COUNT * SEGMENT_INTERVAL_COUNT != OUTPUT_INTERVALS
    or UNKNOWN_COUNT != 2 + 4 * (SEGMENT_COUNT - 1)
    or REFINEMENT_SUBSTEPS != (4, 8)
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("g2b_m1_static_invariant")
