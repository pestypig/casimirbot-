"""One-shot MPFR-native proof representation for G2B-M2.

Program gate: G2B-M2 — MPFR-native proof representation
Workstream: lambda-zero center recovery
Capability or component: high-precision center and spectral codec
Current maturity: private preregistered one-shot implementation
Target maturity: immutable pass or terminal falsifier receipt
Required frozen inputs: M2 packet, audited M1 engine, immutable R3 receipt
Required evidence: fixed solve/refinement, center, and projection chronology
Stop/fail criteria: first failure terminal; exclusive output; no retry or retune
Explicit non-goals: candidate admission, threshold changes, lamp or physical claims
Downstream gate unlocked: remaining G2B classical proof duties after exact pass
"""

from __future__ import annotations

import bisect
from fractions import Fraction
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn, Sequence


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m2-mpfr-native-proof-representation.md"
)
PACKET_SHA256: Final[str] = (
    "465901e7e6ba9aaf3c35df5d8ac0e4a6f3b2941068298892c262b25ac34a2bfa"
)
PACKET_SIZE_BYTES: Final[int] = 4_235
ENGINE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_mpfr256_multiple_shooting.py"
)
ENGINE_SHA256: Final[str] = (
    "85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de"
)
ENGINE_SIZE_BYTES: Final[int] = 32_381
R3_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-r3-representation-diagnosis-v1.json"
)
R3_RAW_SHA256: Final[str] = (
    "a38707c616f19160f3b0ea923d86657f487d198c9a7b6a0cfbe506dde2213387"
)
R3_SIZE_BYTES: Final[int] = 9_818
R3_SELF_SHA256: Final[str] = (
    "85638ae9944b0ea60e7290174d8ebf615d7385803b83afe9644fb0676bbdb3af"
)
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m2-mpfr-native-proof-representation-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m2-mpfr-native-proof-representation/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)
SOLVE_REFINEMENTS: Final[tuple[int, ...]] = (4, 8)
MATERIALIZATION_REFINEMENTS: Final[tuple[int, ...]] = (8, 16, 32)
MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)
MATCHING_LIMIT_EXPONENT: Final[int] = -180
CROSS_LIMIT_EXPONENT: Final[int] = -40
RICHARDSON_LIMIT_EXPONENT: Final[int] = -44
JET_AGREEMENT_LIMIT: Final[Fraction] = Fraction(1, 2**60)
NODE_LIMIT_EXPONENT: Final[int] = -40
JOIN_LIMIT_EXPONENT: Final[int] = -28
ENDPOINT_LIMIT_EXPONENT: Final[int] = -40

AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "diagnosticLampAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BM2Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM2Error(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        _fail("g2b_m2_static_binding_drift", label)
    return raw


def _load_engine():
    _verify(ENGINE_PATH, ENGINE_SIZE_BYTES, ENGINE_SHA256, "engine")
    spec = importlib.util.spec_from_file_location("g2b_m2_engine", ENGINE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_m2_engine_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _verify_r3() -> dict[str, object]:
    raw = _verify(R3_PATH, R3_SIZE_BYTES, R3_RAW_SHA256, "r3_receipt")
    root = json.loads(raw)
    if type(root) is not dict or root.get("receiptSha256") != R3_SELF_SHA256:
        _fail("g2b_m2_r3_receipt_invalid")
    unsigned = dict(root)
    expected = unsigned.pop("receiptSha256")
    payload = _canonical(unsigned)
    domain = (
        b"nhm2-spherical-boson-star-v2/"
        b"g2b-m1-r3-representation-diagnosis/v1\n"
    )
    observed = _sha256(domain + struct.pack("<Q", len(payload)) + payload)
    if (
        observed != expected
        or root.get("decision") != "QUINTIC_CENTER_REPRESENTATION_FAILED"
    ):
        _fail("g2b_m2_r3_receipt_invalid")
    return root


def _fraction(value: object) -> Fraction:
    if type(value) is Fraction:
        return value
    if type(value) is float:
        return Fraction.from_float(value)
    method = getattr(value, "as_mantissa_exp", None)
    if method is None:
        _fail("g2b_m2_dyadic_value_required")
    mantissa_raw, exponent_raw = method()
    mantissa = int(mantissa_raw)
    exponent = int(exponent_raw)
    if mantissa == 0:
        return Fraction(0)
    if exponent >= 0:
        return Fraction(mantissa * (1 << exponent))
    return Fraction(mantissa, 1 << (-exponent))


def _dyadic(value: object) -> dict[str, object]:
    fraction = _fraction(value)
    if fraction == 0:
        return {
            "encoding": "canonical_exact_dyadic",
            "exponent2": 0,
            "mantissaHex": "0",
            "sourcePrecisionBits": 256,
        }
    numerator = fraction.numerator
    denominator = fraction.denominator
    exponent = -(denominator.bit_length() - 1)
    while numerator % 2 == 0:
        numerator //= 2
        exponent += 1
    sign = "-" if numerator < 0 else ""
    return {
        "encoding": "canonical_exact_dyadic",
        "exponent2": exponent,
        "mantissaHex": sign + format(abs(numerator), "x"),
        "sourcePrecisionBits": 256,
    }


def _fraction_record(value: Fraction) -> dict[str, str]:
    return {
        "denominator": str(value.denominator),
        "numerator": str(value.numerator),
    }


def _normalized_difference(left: Fraction, right: Fraction) -> Fraction:
    return abs(left - right) / (1 + abs(left) + abs(right))


def _endpoint_seconds(
    x: Fraction,
    u: Fraction,
    ux: Fraction,
    potential: Fraction,
    potential_x: Fraction,
    nu: Fraction,
) -> tuple[Fraction, Fraction]:
    uxx = 2 * (potential - nu) * u - 2 * ux / x
    potential_xx = u * u - 2 * potential_x / x
    return uxx, potential_xx


def _quintic_coefficients(
    y0: Fraction,
    m0: Fraction,
    s0: Fraction,
    y1: Fraction,
    m1: Fraction,
    s1: Fraction,
    width: Fraction,
) -> tuple[Fraction, ...]:
    a0 = y0
    a1 = width * m0
    a2 = width * width * s0 / 2
    value_gap = y1 - a0 - a1 - a2
    first_gap = width * m1 - a1 - 2 * a2
    second_gap = width * width * s1 - 2 * a2
    a3 = 10 * value_gap - 4 * first_gap + second_gap / 2
    a4 = -15 * value_gap + 7 * first_gap - second_gap
    a5 = 6 * value_gap - 3 * first_gap + second_gap / 2
    return a0, a1, a2, a3, a4, a5


def _quintic_jet(
    coefficients: Sequence[Fraction], coordinate: Fraction, width: Fraction
) -> tuple[Fraction, Fraction, Fraction]:
    value = sum(
        coefficient * coordinate**ordinal
        for ordinal, coefficient in enumerate(coefficients)
    )
    first = sum(
        ordinal * coefficient * coordinate ** (ordinal - 1)
        for ordinal, coefficient in enumerate(coefficients)
        if ordinal >= 1
    )
    second = sum(
        ordinal * (ordinal - 1) * coefficient * coordinate ** (ordinal - 2)
        for ordinal, coefficient in enumerate(coefficients)
        if ordinal >= 2
    )
    return value, first / width, second / (width * width)


def _center_jet(
    mesh: Sequence[float], rows: Sequence[Sequence[object]], nu_value: object
) -> tuple[Fraction, ...]:
    exact_mesh = tuple(Fraction.from_float(value) for value in mesh)
    interval = next(
        (
            ordinal
            for ordinal in range(len(exact_mesh) - 1)
            if exact_mesh[ordinal] < POINT_X < exact_mesh[ordinal + 1]
        ),
        None,
    )
    if interval is None:
        _fail("g2b_m2_center_interval_missing")
    left = exact_mesh[interval]
    right = exact_mesh[interval + 1]
    width = right - left
    nu = _fraction(nu_value)
    left_state = tuple(_fraction(row[interval]) for row in rows)
    right_state = tuple(_fraction(row[interval + 1]) for row in rows)
    left_seconds = _endpoint_seconds(left, *left_state, nu)
    right_seconds = _endpoint_seconds(right, *right_state, nu)
    coordinate = (POINT_X - left) / width
    u_jet = _quintic_jet(
        _quintic_coefficients(
            left_state[0],
            left_state[1],
            left_seconds[0],
            right_state[0],
            right_state[1],
            right_seconds[0],
            width,
        ),
        coordinate,
        width,
    )
    potential_jet = _quintic_jet(
        _quintic_coefficients(
            left_state[2],
            left_state[3],
            left_seconds[1],
            right_state[2],
            right_state[3],
            right_seconds[1],
            width,
        ),
        coordinate,
        width,
    )
    return (*u_jet, *potential_jet)


def _center_residual(jet: Sequence[Fraction], nu_value: object) -> Fraction:
    u, ux, uxx, potential, _potential_x, _potential_xx = jet
    nu = _fraction(nu_value)
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return abs(residual) / denominator


def _materialize_rows(engine, variables: Sequence[object], substeps: int):
    if substeps not in MATERIALIZATION_REFINEMENTS:
        _fail("g2b_m2_materialization_refinement_not_frozen")
    _vc, nu = variables[:2]
    origin, _unused_vc, _unused_nu = engine._origin_jet(*variables[:2])
    mesh = engine._output_mesh_binary64()
    rows: list[list[object]] = [[value] for value in origin]
    for segment in range(engine.SEGMENT_COUNT):
        if segment == 0:
            current = tuple(origin)
        else:
            offset = 2 + 4 * (segment - 1)
            current = tuple(variables[offset : offset + 4])
            for row_ordinal in range(4):
                rows[row_ordinal][-1] = current[row_ordinal]
        first = segment * engine.SEGMENT_INTERVAL_COUNT
        last = first + engine.SEGMENT_INTERVAL_COUNT
        for ordinal in range(first, last):
            current = engine._integrate_interval(
                current,
                engine.gmpy2.mpfr(mesh[ordinal]),
                engine.gmpy2.mpfr(mesh[ordinal + 1]),
                nu,
                substeps,
                augmented=False,
            )
            for row_ordinal in range(4):
                rows[row_ordinal].append(current[row_ordinal])
    if any(len(row) != engine.OUTPUT_NODE_COUNT for row in rows):
        _fail("g2b_m2_materialized_state_shape")
    return tuple(tuple(row) for row in rows)


def _screen_solution(engine, variables, rows) -> object:
    residual, _unused = engine._system(variables, 8, jacobian=False)
    matching = engine._maximum_absolute(residual)
    if matching > engine.gmpy2.exp2(MATCHING_LIMIT_EXPONENT):
        _fail("g2b_m2_matching_screen_failed")
    vc, nu = variables[:2]
    radius = engine.gmpy2.mpfr(32)
    mass = radius * radius * rows[3][-1]
    if not vc < nu < 0 or not mass > 0:
        _fail("g2b_m2_parameter_screen_failed")
    if any(not value > 0 for value in rows[0]):
        _fail("g2b_m2_u_positive_screen_failed")
    if any(not value <= 0 for value in rows[1]):
        _fail("g2b_m2_u_monotonic_screen_failed")
    if any(not value < 0 for value in rows[2]):
        _fail("g2b_m2_potential_sign_screen_failed")
    if any(not value >= 0 for value in rows[3]):
        _fail("g2b_m2_potential_monotonic_screen_failed")
    kappa = engine.gmpy2.sqrt(-2 * nu)
    sigma = mass / kappa - 1
    if not kappa > 0 or not sigma + 1 > 0:
        _fail("g2b_m2_derived_sign_screen_failed")
    return matching


def _mpfr_from_fraction(engine, value: Fraction):
    return engine.gmpy2.mpfr(value.numerator) / engine.gmpy2.mpfr(value.denominator)


def _origin_coefficients(engine, vc, nu):
    zero = engine.gmpy2.mpfr(0)
    one = engine.gmpy2.mpfr(1)
    a = [one]
    b = [engine.gmpy2.mpfr(vc)]
    for shell in range(16):
        denominator = engine.gmpy2.mpfr((2 * shell + 2) * (2 * shell + 3))
        ba = sum(
            (b[index] * a[shell - index] for index in range(shell + 1)),
            zero,
        )
        aa = sum(
            (a[index] * a[shell - index] for index in range(shell + 1)),
            zero,
        )
        a.append(2 * (ba - nu * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


def _series(engine, coefficients, x):
    return sum(
        (
            coefficient * x ** (2 * ordinal)
            for ordinal, coefficient in enumerate(coefficients)
        ),
        engine.gmpy2.mpfr(0),
    )


def _mpfr_endpoint_seconds(engine, x, state, nu):
    u, ux, potential, potential_x = state
    return (
        2 * (potential - nu) * u - 2 * ux / x,
        u * u - 2 * potential_x / x,
    )


def _mpfr_quintic_value(
    engine,
    x,
    x0,
    x1,
    y0,
    m0,
    s0,
    y1,
    m1,
    s1,
):
    width = x1 - x0
    a0 = y0
    a1 = width * m0
    a2 = width * width * s0 / 2
    value_gap = y1 - a0 - a1 - a2
    first_gap = width * m1 - a1 - 2 * a2
    second_gap = width * width * s1 - 2 * a2
    coefficients = (
        a0,
        a1,
        a2,
        10 * value_gap - 4 * first_gap + second_gap / 2,
        -15 * value_gap + 7 * first_gap - second_gap,
        6 * value_gap - 3 * first_gap + second_gap / 2,
    )
    coordinate = (x - x0) / width
    return sum(
        (
            coefficient * coordinate**ordinal
            for ordinal, coefficient in enumerate(coefficients)
        ),
        engine.gmpy2.mpfr(0),
    )


def _profile(engine, variables, rows):
    mesh = tuple(
        engine.gmpy2.mpfr(value) for value in engine._output_mesh_binary64()
    )
    vc, nu = variables[:2]
    origin_u, origin_v = _origin_coefficients(engine, vc, nu)
    seconds = tuple(
        _mpfr_endpoint_seconds(
            engine,
            mesh[ordinal],
            tuple(row[ordinal] for row in rows),
            nu,
        )
        for ordinal in range(len(mesh))
    )
    radius = engine.gmpy2.mpfr(32)
    mass = radius * radius * rows[3][-1]
    kappa = engine.gmpy2.sqrt(-2 * nu)
    sigma = mass / kappa - 1
    epsilon = engine.gmpy2.mpfr(1) / 4096

    def profile(x):
        if x < epsilon:
            return _series(engine, origin_u, x), _series(engine, origin_v, x)
        if x <= radius:
            right = bisect.bisect_left(mesh, x)
            if right < len(mesh) and mesh[right] == x:
                return rows[0][right], rows[2][right]
            if right == 0 or right >= len(mesh):
                _fail("g2b_m2_profile_interval_missing")
            left = right - 1
            return (
                _mpfr_quintic_value(
                    engine,
                    x,
                    mesh[left],
                    mesh[right],
                    rows[0][left],
                    rows[1][left],
                    seconds[left][0],
                    rows[0][right],
                    rows[1][right],
                    seconds[right][0],
                ),
                _mpfr_quintic_value(
                    engine,
                    x,
                    mesh[left],
                    mesh[right],
                    rows[2][left],
                    rows[3][left],
                    seconds[left][1],
                    rows[2][right],
                    rows[3][right],
                    seconds[right][1],
                ),
            )
        u = rows[0][-1] * engine.gmpy2.exp(-kappa * (x - radius))
        u *= engine.gmpy2.pow(x / radius, sigma)
        return u, -mass / x

    return profile, nu, rows


def _dct(engine, values):
    denominator = len(values) - 1
    pi = engine.gmpy2.const_pi()
    two = engine.gmpy2.mpfr(2)
    output = []
    for mode in range(len(values)):
        total = engine.gmpy2.mpfr(0)
        for ordinal, value in enumerate(values):
            weight = engine.gmpy2.mpfr("0.5") if ordinal in (0, denominator) else 1
            angle = pi * mode * (denominator - ordinal) / denominator
            total += weight * value * engine.gmpy2.cos(angle)
        coefficient = two * total / denominator
        if mode in (0, denominator):
            coefficient *= engine.gmpy2.mpfr("0.5")
        output.append(+coefficient)
    return tuple(output)


def _mpfr_evaluate(engine, coefficients, rho):
    coordinate = 2 * rho - 1
    coordinate = max(engine.gmpy2.mpfr(-1), min(engine.gmpy2.mpfr(1), coordinate))
    theta = engine.gmpy2.acos(coordinate)
    return sum(
        (
            coefficient * engine.gmpy2.cos(mode * theta)
            for mode, coefficient in enumerate(coefficients)
        ),
        engine.gmpy2.mpfr(0),
    )


def _chebyshev_derivative(coefficients: tuple[Fraction, ...]):
    count = len(coefficients)
    if count <= 1:
        return (Fraction(0),)
    output = [Fraction(0)] * count
    output[-2] = 2 * (count - 1) * coefficients[-1]
    for index in range(count - 3, -1, -1):
        output[index] = output[index + 2] + 2 * (index + 1) * coefficients[index + 1]
    output[0] /= 2
    return tuple(output[:-1])


def _chebyshev_value(coefficients: Sequence[Fraction], coordinate: Fraction):
    if not coefficients:
        return Fraction(0)
    previous = Fraction(1)
    total = coefficients[0]
    if len(coefficients) == 1:
        return total
    current = coordinate
    total += coefficients[1] * current
    for mode in range(2, len(coefficients)):
        following = 2 * coordinate * current - previous
        total += coefficients[mode] * following
        previous, current = current, following
    return total


def _projected_residual(u_coefficients, v_coefficients, nu_value) -> Fraction:
    u_exact = tuple(_fraction(value) for value in u_coefficients)
    v_exact = tuple(_fraction(value) for value in v_coefficients)
    rho = POINT_X / (1 + POINT_X)
    coordinate = 2 * rho - 1
    first = _chebyshev_derivative(u_exact)
    second = _chebyshev_derivative(first)
    u = _chebyshev_value(u_exact, coordinate)
    rho_first = 2 * _chebyshev_value(first, coordinate)
    rho_second = 4 * _chebyshev_value(second, coordinate)
    one_minus = 1 - rho
    ux = one_minus**2 * rho_first
    uxx = one_minus**4 * rho_second - 2 * one_minus**3 * rho_first
    potential = _chebyshev_value(v_exact, coordinate)
    nu = _fraction(nu_value)
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return abs(residual) / denominator


def _coefficient_binding(values) -> dict[str, object]:
    encoded = [_dyadic(value) for value in values]
    raw = _canonical(encoded)
    return {
        "canonicalDyadics": encoded,
        "rawSha256": _sha256(raw),
        "sizeBytes": len(raw),
    }


def _projection_ladder(engine, variables, rows):
    profile, nu, state_rows = _profile(engine, variables, rows)
    records = []
    selected = None
    for ordinal, count in enumerate(MODE_COUNTS):
        denominator = count - 1
        pi = engine.gmpy2.const_pi()
        rho_nodes = tuple(
            (1 - engine.gmpy2.cos(pi * index / denominator)) / 2
            for index in range(count)
        )
        samples = tuple(
            (engine.gmpy2.mpfr(0), engine.gmpy2.mpfr(0))
            if index == denominator
            else profile(rho / (1 - rho))
            for index, rho in enumerate(rho_nodes)
        )
        u_coefficients = _dct(engine, tuple(value[0] for value in samples))
        v_coefficients = _dct(engine, tuple(value[1] for value in samples))
        node_error = engine.gmpy2.mpfr(0)
        for coefficients, component in (
            (u_coefficients, 0),
            (v_coefficients, 1),
        ):
            for rho, sample in zip(rho_nodes, samples, strict=True):
                difference = abs(
                    _mpfr_evaluate(engine, coefficients, rho) - sample[component]
                )
                node_error = max(node_error, difference / (1 + abs(sample[component])))
        join_rho = engine.gmpy2.mpfr(32) / 33
        join_error = max(
            abs(_mpfr_evaluate(engine, u_coefficients, join_rho) - state_rows[0][-1]),
            abs(_mpfr_evaluate(engine, v_coefficients, join_rho) - state_rows[2][-1]),
        )
        endpoint_error = max(
            abs(_mpfr_evaluate(engine, u_coefficients, engine.gmpy2.mpfr(0)) - 1),
            abs(
                _mpfr_evaluate(engine, v_coefficients, engine.gmpy2.mpfr(0))
                - variables[0]
            ),
            abs(_mpfr_evaluate(engine, u_coefficients, engine.gmpy2.mpfr(1))),
            abs(_mpfr_evaluate(engine, v_coefficients, engine.gmpy2.mpfr(1))),
        )
        residual = _projected_residual(u_coefficients, v_coefficients, nu)
        eligible = (
            residual <= MARGIN
            and node_error <= engine.gmpy2.exp2(NODE_LIMIT_EXPONENT)
            and join_error <= engine.gmpy2.exp2(JOIN_LIMIT_EXPONENT)
            and endpoint_error <= engine.gmpy2.exp2(ENDPOINT_LIMIT_EXPONENT)
        )
        if eligible and selected is None:
            selected = count
        records.append(
            {
                "eligible": eligible,
                "endpointError": _dyadic(endpoint_error),
                "joinError": _dyadic(join_error),
                "modeCount": count,
                "nodeError": _dyadic(node_error),
                "ordinal": ordinal,
                "projectedNormalizedResidualExact": _fraction_record(residual),
                "uCoefficientBinding": _coefficient_binding(u_coefficients),
                "vCoefficientBinding": _coefficient_binding(v_coefficients),
            }
        )
    return records, selected


def _self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def _exclusive_write(path: Path, raw: bytes) -> None:
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())


def execute_once() -> str:
    if OUTPUT_PATH.exists():
        _fail("g2b_m2_output_collision")
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify_r3()
    engine = _load_engine()
    stage = "runtime_admission"
    completed = []
    unsigned: dict[str, object]
    try:
        engine._verify_static_inputs()
        runtime_paths = engine._verify_runtime()
        runtime = {
            "gmpy2Version": engine.gmpy2.version(),
            "loadedByteIdentityAuthenticated": False,
            "mpfrVersion": engine.gmpy2.mpfr_version(),
            "paths": list(runtime_paths),
            "runtimeDisjointIndependentReplayAuthority": False,
        }
        with engine._mpfr_context():
            stage = "coarse_refinement"
            coarse, coarse_chronology = engine._newton_refinement(
                engine._initial_unknowns(), SOLVE_REFINEMENTS[0]
            )
            coarse_rows = engine._materialize_state_rows(
                coarse, SOLVE_REFINEMENTS[0]
            )
            completed.append(
                {"chronology": list(coarse_chronology), "ordinal": 0}
            )
            stage = "fine_refinement"
            fine, fine_chronology = engine._newton_refinement(
                engine._initial_unknowns(), SOLVE_REFINEMENTS[1]
            )
            fine_rows = _materialize_rows(
                engine, fine, MATERIALIZATION_REFINEMENTS[0]
            )
            completed.append({"chronology": list(fine_chronology), "ordinal": 1})
            stage = "cross_refinement"
            maximum_difference, richardson = engine._compare_refinements(
                coarse, fine, coarse_rows, fine_rows
            )
            if maximum_difference > engine.gmpy2.exp2(CROSS_LIMIT_EXPONENT):
                _fail("g2b_m2_cross_refinement_failed")
            if richardson > engine.gmpy2.exp2(RICHARDSON_LIMIT_EXPONENT):
                _fail("g2b_m2_richardson_failed")
            stage = "fine_solution_screens"
            matching = _screen_solution(engine, fine, fine_rows)
            stage = "center_materialization"
            materialized = [(MATERIALIZATION_REFINEMENTS[0], fine_rows)]
            for substeps in MATERIALIZATION_REFINEMENTS[1:]:
                materialized.append(
                    (substeps, _materialize_rows(engine, fine, substeps))
                )
            mesh = engine._output_mesh_binary64()
            jets = [
                (substeps, _center_jet(mesh, rows, fine[1]))
                for substeps, rows in materialized
            ]
            maximum_jet_difference = max(
                _normalized_difference(left, right)
                for left, right in zip(jets[-2][1], jets[-1][1], strict=True)
            )
            if maximum_jet_difference > JET_AGREEMENT_LIMIT:
                _fail("g2b_m2_center_refinement_disagreement")
            center_residual = _center_residual(jets[-1][1], fine[1])
            projection_records = None
            selected_mode = None
            if center_residual <= MARGIN:
                stage = "projection_ladder"
                projection_records, selected_mode = _projection_ladder(
                    engine, fine, materialized[-1][1]
                )
        if center_residual > MARGIN:
            decision = "MPFR_NATIVE_CENTER_RESIDUAL_FAILED"
        elif selected_mode is None:
            decision = "MPFR_NATIVE_PROJECTION_FAILED"
        else:
            decision = "MPFR_NATIVE_PROOF_REPRESENTATION_SELECTED"
        unsigned = {
            "artifactId": (
                "nhm2.spherical_boson_star_v2."
                "g2b_m2_mpfr_native_proof_representation"
            ),
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "centerJets": [
                {
                    "components": [_dyadic(value) for value in jet],
                    "substepsPerOutputInterval": substeps,
                }
                for substeps, jet in jets
            ],
            "centerNormalizedResidualExact": _fraction_record(center_residual),
            "completedSolveRefinements": completed,
            "decision": decision,
            "maximumCrossRefinementDifference": _dyadic(maximum_difference),
            "maximumJetRefinementDifferenceExact": _fraction_record(
                maximum_jet_difference
            ),
            "maximumMatchingResidual": _dyadic(matching),
            "noCandidateSolve": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "projectionRecords": projection_records,
            "r3ReceiptSha256": R3_SELF_SHA256,
            "richardsonEstimate": _dyadic(richardson),
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
            "runtimeBinding": runtime,
            "selectedModeCount": selected_mode,
        }
    except Exception as error:
        if isinstance(error, (G2BM2Error, engine.G2BM1ImplementationBlocked)):
            code = error.code
            detail = error.detail
        else:
            code = "g2b_m2_untyped_exception"
            detail = type(error).__name__
        unsigned = {
            "artifactId": (
                "nhm2.spherical_boson_star_v2."
                "g2b_m2_mpfr_native_proof_representation"
            ),
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "completedSolveRefinements": completed,
            "decision": "MPFR_NATIVE_SOLVE_OR_REFINEMENT_FAILED",
            "firstFailure": {"code": code, "detail": detail, "stage": stage},
            "noCandidateSolve": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "r3ReceiptSha256": R3_SELF_SHA256,
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    _exclusive_write(OUTPUT_PATH, _canonical(full))
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m2_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if (
    SOLVE_REFINEMENTS != (4, 8)
    or MATERIALIZATION_REFINEMENTS != (8, 16, 32)
    or MODE_COUNTS != (128, 256, 512)
    or MARGIN != Fraction(1, 4 * 10**10)
):
    raise RuntimeError("g2b_m2_static_invariant")


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
