"""One-shot MPFR256 global-center execution for the frozen G2B-M1 proposal."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn, Sequence


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PROPOSAL_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m1-one-shot-proposal.md"
)
PROPOSAL_SHA256: Final[str] = (
    "be3f5be7494375e646b2908f71024518b62075fbb72f8da3dc70e1725c222bb0"
)
PROPOSAL_SIZE_BYTES: Final[int] = 4_176
ENGINE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_mpfr256_multiple_shooting.py"
)
ENGINE_SHA256: Final[str] = (
    "85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de"
)
ENGINE_SIZE_BYTES: Final[int] = 32_381
ENGINE_SPEC_PATH: Final[Path] = Path(__file__).with_name(
    "test_newtonian_lambda_zero_g2b_m1_mpfr256_multiple_shooting.py"
)
ENGINE_SPEC_SHA256: Final[str] = (
    "0e5367640f8bfc62e114a03ee56e2f6f4765f922ab510933ed666a96c002c8cf"
)
ENGINE_SPEC_SIZE_BYTES: Final[int] = 9_654
PROJECTION_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_proof_center_projection.py"
)
PROJECTION_SHA256: Final[str] = (
    "a859191d2989c3b1e03a96d1f7dd000a80e1425021da87e3ae3687cfff02f33b"
)
PROJECTION_SIZE_BYTES: Final[int] = 15_771
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-mpfr256-global-center-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m1-mpfr256-global-center/v1\n"
)
POINT_X: Final[Fraction] = Fraction(1, 128)
CENTER_MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)
MIDPOINT_LIMIT: Final[float] = 1.0e-10
CORE_MODE_COUNT: Final[int] = 128
MAXIMUM_RATIONAL_BITS: Final[int] = 2_000_000


class G2BM1OneShotError(RuntimeError):
    """Typed one-shot runner or exact-screen error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM1OneShotError(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        before = path.stat()
        raw = path.read_bytes()
        after = path.stat()
    except OSError as error:
        raise G2BM1OneShotError(f"{label}_unavailable", type(error).__name__) from error
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
    return raw


def _load_engine():
    _verify(ENGINE_PATH, ENGINE_SIZE_BYTES, ENGINE_SHA256, "engine")
    specification = importlib.util.spec_from_file_location(
        "g2b_m1_frozen_engine", ENGINE_PATH
    )
    if specification is None or specification.loader is None:
        _fail("g2b_m1_engine_specification_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


def _load_projection():
    _verify(PROJECTION_PATH, PROJECTION_SIZE_BYTES, PROJECTION_SHA256, "projection")
    specification = importlib.util.spec_from_file_location(
        "g2b_m1_frozen_projection", PROJECTION_PATH
    )
    if specification is None or specification.loader is None:
        _fail("g2b_m1_projection_specification_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


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


def _f64_hex(value: float, label: str) -> str:
    if not math.isfinite(value):
        _fail("g2b_m1_encoded_nonfinite", label)
    raw = struct.pack(">d", value)
    if raw == bytes.fromhex("8000000000000000"):
        _fail("g2b_m1_encoded_negative_zero", label)
    return raw.hex()


def _fraction_from_f64_hex(word: str) -> Fraction:
    bits = int(word, 16)
    sign = -1 if bits >> 63 else 1
    exponent = (bits >> 52) & 0x7FF
    fraction = bits & ((1 << 52) - 1)
    if exponent == 0x7FF or bits == 1 << 63:
        _fail("g2b_m1_exact_word_invalid")
    if exponent == 0:
        significand = fraction
        shift = -1074
    else:
        significand = (1 << 52) | fraction
        shift = exponent - 1023 - 52
    value = Fraction(sign * significand)
    return value * (1 << shift) if shift >= 0 else value / (1 << -shift)


def _check_fraction(value: Fraction, label: str) -> Fraction:
    if (
        value.numerator.bit_length() > MAXIMUM_RATIONAL_BITS
        or value.denominator.bit_length() > MAXIMUM_RATIONAL_BITS
    ):
        _fail("g2b_m1_rational_budget_exceeded", label)
    return value


def _hermite_jet(x0, x1, y0, y1, m0, m1, x):
    if not x0 < x < x1:
        _fail("g2b_m1_exact_point_not_inside")
    width = x1 - x0
    coordinate = (x - x0) / width
    value = (2 * coordinate**3 - 3 * coordinate**2 + 1) * y0
    value += (coordinate**3 - 2 * coordinate**2 + coordinate) * width * m0
    value += (-2 * coordinate**3 + 3 * coordinate**2) * y1
    value += (coordinate**3 - coordinate**2) * width * m1
    first = (6 * coordinate**2 - 6 * coordinate) * y0
    first += (3 * coordinate**2 - 4 * coordinate + 1) * width * m0
    first += (-6 * coordinate**2 + 6 * coordinate) * y1
    first += (3 * coordinate**2 - 2 * coordinate) * width * m1
    second = (12 * coordinate - 6) * y0
    second += (6 * coordinate - 4) * width * m0
    second += (-12 * coordinate + 6) * y1
    second += (6 * coordinate - 2) * width * m1
    return tuple(
        _check_fraction(item, f"hermite_{ordinal}")
        for ordinal, item in enumerate((value, first / width, second / width**2))
    )


def _exact_center_residual(center: dict[str, object]) -> Fraction:
    mesh_words = center["meshF64Hex"]
    rows_words = center["stateRowsF64Hex"]
    parameters = center["parameters"]
    mesh = tuple(_fraction_from_f64_hex(word) for word in mesh_words)
    rows = tuple(
        tuple(_fraction_from_f64_hex(word) for word in row) for row in rows_words
    )
    interval = next(
        (
            ordinal
            for ordinal in range(len(mesh) - 1)
            if mesh[ordinal] < POINT_X < mesh[ordinal + 1]
        ),
        None,
    )
    if interval is None:
        _fail("g2b_m1_exact_interval_missing")
    u, ux, uxx = _hermite_jet(
        mesh[interval],
        mesh[interval + 1],
        rows[0][interval],
        rows[0][interval + 1],
        rows[1][interval],
        rows[1][interval + 1],
        POINT_X,
    )
    potential, _vx, _vxx = _hermite_jet(
        mesh[interval],
        mesh[interval + 1],
        rows[2][interval],
        rows[2][interval + 1],
        rows[3][interval],
        rows[3][interval + 1],
        POINT_X,
    )
    nu = _fraction_from_f64_hex(parameters["nuF64Hex"])
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return _check_fraction(abs(residual) / denominator, "center_normalized")


def _chebyshev_derivative(coefficients: tuple[Fraction, ...]):
    if len(coefficients) <= 1:
        return (Fraction(0),)
    derivative = [Fraction(0)] * len(coefficients)
    last = len(coefficients) - 1
    derivative[last - 1] = 2 * last * coefficients[last]
    for index in range(last - 2, -1, -1):
        derivative[index] = 2 * (index + 1) * coefficients[index + 1]
        if index + 2 < len(derivative):
            derivative[index] += derivative[index + 2]
    derivative[0] /= 2
    return tuple(derivative[:-1])


def _chebyshev_value(coefficients, coordinate):
    previous = Fraction(1)
    result = coefficients[0]
    if len(coefficients) == 1:
        return result
    current = coordinate
    result += coefficients[1] * current
    for mode in range(2, len(coefficients)):
        following = 2 * coordinate * current - previous
        result += coefficients[mode] * following
        previous, current = current, following
    return result


def _float_hermite_value(x, x0, x1, y0, y1, m0, m1):
    width = x1 - x0
    coordinate = (x - x0) / width
    return (
        (2 * coordinate**3 - 3 * coordinate**2 + 1) * y0
        + (coordinate**3 - 2 * coordinate**2 + coordinate) * width * m0
        + (-2 * coordinate**3 + 3 * coordinate**2) * y1
        + (coordinate**3 - coordinate**2) * width * m1
    )


def _fraction_from_f64le(raw: bytes) -> Fraction:
    return _fraction_from_f64_hex(raw[::-1].hex())


def _exact_projected_residual(center: dict[str, object]) -> Fraction:
    projection = _load_projection()
    _diagnostics, payloads = projection._project(center)
    u_raw = payloads["coefficients/core_L2_u.f64le"]
    v_raw = payloads["coefficients/core_L2_V.f64le"]
    scalar_raw = payloads["scalars.f64le"]
    u_coefficients = tuple(
        _fraction_from_f64le(u_raw[index * 8 : (index + 1) * 8])
        for index in range(CORE_MODE_COUNT)
    )
    v_coefficients = tuple(
        _fraction_from_f64le(v_raw[index * 8 : (index + 1) * 8])
        for index in range(CORE_MODE_COUNT)
    )
    rho = POINT_X / (1 + POINT_X)
    coordinate = 2 * rho - 1
    u_first = _chebyshev_derivative(u_coefficients)
    u_second = _chebyshev_derivative(u_first)
    u = _chebyshev_value(u_coefficients, coordinate)
    rho_first = 2 * _chebyshev_value(u_first, coordinate)
    rho_second = 4 * _chebyshev_value(u_second, coordinate)
    one_minus = 1 - rho
    ux = one_minus**2 * rho_first
    uxx = one_minus**4 * rho_second - 2 * one_minus**3 * rho_first
    potential = _chebyshev_value(v_coefficients, coordinate)
    nu = _fraction_from_f64le(scalar_raw[:8])
    residual = -Fraction(1, 2) * (uxx + 2 * ux / POINT_X)
    residual += (potential - nu) * u
    denominator = 1 + abs(uxx / 2) + abs(ux / POINT_X)
    denominator += abs(potential * u) + abs(nu * u)
    return _check_fraction(abs(residual) / denominator, "projected_normalized")


def _fraction_record(value: Fraction) -> dict[str, str]:
    return {"denominator": str(value.denominator), "numerator": str(value.numerator)}


def _classify(center_residual: Fraction, projected_residual: Fraction) -> str:
    if center_residual > CENTER_MARGIN:
        return "GLOBAL_CENTER_SUCCESSOR_FAILED"
    if projected_residual > CENTER_MARGIN:
        return "CENTER_RECOVERED_CODEC_OR_MODE_SUCCESSOR_REQUIRED"
    return "CENTER_AND_FROZEN_PROJECTION_RECOVERED"


def _float_hermite_jet(x, x0, x1, y0, y1, m0, m1):
    width = x1 - x0
    coordinate = (x - x0) / width
    value = _float_hermite_value(x, x0, x1, y0, y1, m0, m1)
    first = (6 * coordinate**2 - 6 * coordinate) * y0
    first += (3 * coordinate**2 - 4 * coordinate + 1) * width * m0
    first += (-6 * coordinate**2 + 6 * coordinate) * y1
    first += (3 * coordinate**2 - 2 * coordinate) * width * m1
    second = (12 * coordinate - 6) * y0
    second += (6 * coordinate - 4) * width * m0
    second += (-12 * coordinate + 6) * y1
    second += (6 * coordinate - 2) * width * m1
    return value, first / width, second / (width * width)


def _screen_solution(engine, variables, rows):
    residual, _unused = engine._system(variables, 8, jacobian=False)
    matching = engine._maximum_absolute(residual)
    if matching > engine.gmpy2.exp2(-180):
        _fail("g2b_m1_matching_screen_failed")
    vc, nu = variables[:2]
    radius = engine.gmpy2.mpfr(32)
    mass = radius * radius * rows[3][-1]
    if not vc < nu < 0 or not mass > 0:
        _fail("g2b_m1_parameter_screen_failed")
    if any(not value > 0 for value in rows[0]):
        _fail("g2b_m1_u_positive_screen_failed")
    if any(not value <= 0 for value in rows[1]):
        _fail("g2b_m1_u_monotonic_screen_failed")
    if any(not value < 0 for value in rows[2]):
        _fail("g2b_m1_potential_sign_screen_failed")
    if any(not value >= 0 for value in rows[3]):
        _fail("g2b_m1_potential_monotonic_screen_failed")
    kappa = engine.gmpy2.sqrt(-2 * nu)
    sigma = mass / kappa - 1
    if not kappa > 0 or not sigma + 1 > 0:
        _fail("g2b_m1_derived_sign_screen_failed")
    mesh = engine._output_mesh_binary64()
    state = tuple(tuple(float(value) for value in row) for row in rows)
    nu_float = float(nu)
    maximum_midpoint = 0.0
    for ordinal in range(len(mesh) - 1):
        midpoint = (mesh[ordinal] + mesh[ordinal + 1]) / 2
        u, ux, uxx = _float_hermite_jet(
            midpoint,
            mesh[ordinal],
            mesh[ordinal + 1],
            state[0][ordinal],
            state[0][ordinal + 1],
            state[1][ordinal],
            state[1][ordinal + 1],
        )
        potential, vx, vxx = _float_hermite_jet(
            midpoint,
            mesh[ordinal],
            mesh[ordinal + 1],
            state[2][ordinal],
            state[2][ordinal + 1],
            state[3][ordinal],
            state[3][ordinal + 1],
        )
        schrodinger = uxx - (
            2 * (potential - nu_float) * u - 2 * ux / midpoint
        )
        poisson = vxx - (u * u - 2 * vx / midpoint)
        schrodinger_scale = 1 + abs(uxx) + abs(2 * (potential - nu_float) * u)
        schrodinger_scale += abs(2 * ux / midpoint)
        poisson_scale = 1 + abs(vxx) + abs(u * u) + abs(2 * vx / midpoint)
        maximum_midpoint = max(
            maximum_midpoint,
            abs(schrodinger) / schrodinger_scale,
            abs(poisson) / poisson_scale,
        )
    if not math.isfinite(maximum_midpoint) or maximum_midpoint > MIDPOINT_LIMIT:
        _fail("g2b_m1_midpoint_replay_failed")
    return matching, maximum_midpoint


def _encoded_center(engine, variables, rows, chronology, runtime):
    mesh = engine._output_mesh_binary64()
    state = tuple(tuple(float(value) for value in row) for row in rows)
    vc, nu = (float(variables[0]), float(variables[1]))
    radius = 32.0
    mass = radius * radius * state[3][-1]
    kappa = math.sqrt(-2 * nu)
    sigma = mass / kappa - 1
    return {
        "meshF64Hex": [_f64_hex(value, "mesh") for value in mesh],
        "parameters": {"VcF64Hex": _f64_hex(vc, "Vc"), "nuF64Hex": _f64_hex(nu, "nu")},
        "stateRowsF64Hex": [
            [_f64_hex(value, "state") for value in row] for row in state
        ],
        "summaryF64Hex": {
            "kappa": _f64_hex(kappa, "kappa"),
            "mass": _f64_hex(mass, "mass"),
            "sigma": _f64_hex(sigma, "sigma"),
        },
        "fineNewtonChronology": list(chronology),
        "runtimeBinding": runtime,
    }


def execute_one_shot() -> str:
    if OUTPUT_PATH.exists():
        _fail("g2b_m1_output_collision")
    _verify(PROPOSAL_PATH, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal")
    _verify(ENGINE_SPEC_PATH, ENGINE_SPEC_SIZE_BYTES, ENGINE_SPEC_SHA256, "engine_spec")
    engine = _load_engine()
    stage = "runtime_admission"
    completed: list[dict[str, object]] = []
    unsigned: dict[str, object]
    try:
        engine._verify_static_inputs()
        runtime_paths = engine._verify_runtime()
        runtime = {
            "gmpy2Version": engine.gmpy2.version(),
            "mpfrVersion": engine.gmpy2.mpfr_version(),
            "paths": list(runtime_paths),
            "loadedByteIdentityAuthenticated": False,
            "sourceRuntimeDisjointReplayAuthority": False,
        }
        with engine._mpfr_context():
            stage = "coarse_refinement"
            coarse, coarse_chronology = engine._newton_refinement(
                engine._initial_unknowns(), 4
            )
            coarse_rows = engine._materialize_state_rows(coarse, 4)
            completed.append({"ordinal": 0, "chronology": list(coarse_chronology)})
            stage = "fine_refinement"
            fine, fine_chronology = engine._newton_refinement(
                engine._initial_unknowns(), 8
            )
            fine_rows = engine._materialize_state_rows(fine, 8)
            completed.append({"ordinal": 1, "chronology": list(fine_chronology)})
            stage = "cross_refinement"
            maximum_difference, richardson = engine._compare_refinements(
                coarse, fine, coarse_rows, fine_rows
            )
            stage = "fine_solution_screens"
            matching_residual, midpoint_residual = _screen_solution(
                engine, fine, fine_rows
            )
            stage = "encoding"
            center = _encoded_center(engine, fine, fine_rows, fine_chronology, runtime)
        stage = "exact_center_screen"
        center_residual = _exact_center_residual(center)
        projected_residual = None
        projection_failure = None
        try:
            projected_residual = _exact_projected_residual(center)
        except Exception as error:
            projection_failure = {
                "code": getattr(error, "code", type(error).__name__),
                "detail": getattr(error, "detail", ""),
            }
        if center_residual > CENTER_MARGIN:
            decision = "GLOBAL_CENTER_SUCCESSOR_FAILED"
        elif projected_residual is None:
            decision = "CENTER_RECOVERED_CODEC_OR_MODE_SUCCESSOR_REQUIRED"
        else:
            decision = _classify(center_residual, projected_residual)
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m1_mpfr256_global_center",
            "authorityLocks": dict(engine.AUTHORITY_LOCKS),
            "center": center,
            "completedRefinements": completed,
            "decision": decision,
            "exactCenterNormalizedResidual": _fraction_record(center_residual),
            "exactProjectedNormalizedResidual": (
                _fraction_record(projected_residual)
                if projected_residual is not None
                else None
            ),
            "maximumCrossRefinementDifference": str(maximum_difference),
            "maximumMatchingResidual": str(matching_residual),
            "maximumMidpointReplayResidualF64Hex": _f64_hex(
                midpoint_residual, "midpoint_residual"
            ),
            "noRetune": True,
            "proposalRawSha256": PROPOSAL_SHA256,
            "projectionFailure": projection_failure,
            "richardsonEstimate": str(richardson),
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    except Exception as error:
        if isinstance(error, (G2BM1OneShotError, engine.G2BM1ImplementationBlocked)):
            code = error.code
            detail = error.detail
            evidence = getattr(error, "evidence", None)
        else:
            code = "g2b_m1_untyped_exception"
            detail = type(error).__name__
            evidence = None
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m1_mpfr256_global_center",
            "authorityLocks": dict(engine.AUTHORITY_LOCKS),
            "completedRefinements": completed,
            "decision": "CALCULATION_FAIL",
            "firstFailure": {
                "code": code,
                "detail": detail,
                "evidence": evidence,
                "stage": stage,
            },
            "noRetune": True,
            "proposalRawSha256": PROPOSAL_SHA256,
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    _exclusive_write(OUTPUT_PATH, _canonical(full))
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m1_exact_command_required")
    sys.stdout.write(execute_one_shot() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
