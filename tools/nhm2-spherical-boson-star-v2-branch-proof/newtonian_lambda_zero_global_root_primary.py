"""One-shot approximate lambda-zero global-root producer.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: preregistered global Schrödinger–Poisson root center
Current maturity: bounded calculation implementation; no executed root
Target maturity: immutable approximate-center or first-failure receipt
Required frozen inputs: lambda-zero definition, directed proof/operator, and
  global-root attempt proposal
Required evidence: exact bytes, exclusive output, full state, replay screens
Stop/fail criteria: any preregistered first failure or output collision
Explicit non-goals: proof, acceptance, branch execution, lamp, or authority
Downstream gate unlocked: directed global-profile proof-center ingestion only

The numerical result of this module is never a proof.  All authority fields in
every receipt are permanently false.
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import struct
import sys
from types import MappingProxyType
from typing import Final

import numpy as np
import scipy
from scipy.integrate import solve_bvp


ATTEMPT_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_lambda_zero_global_root_primary/v1"
)
PROPOSAL_PATH: Final[Path] = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-lambda-zero-global-root-attempt.md"
)
PROPOSAL_SHA256: Final[str] = (
    "4c64d6111368e737318b5c1a4b05db767590e7a24f78f4242d8079b006a9b72b"
)
PROPOSAL_SIZE_BYTES: Final[int] = 6_172
LAMBDA_ZERO_DEFINITION_SHA256: Final[str] = (
    "bb8dc226a11d3189357f75da67b8ea7b189c09b9b0091fc42aabac4da66f629f"
)
LAMBDA_ZERO_DEFINITION_SIZE_BYTES: Final[int] = 8_157
DIRECTED_PROOF_SHA256: Final[str] = (
    "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99"
)
DIRECTED_PROOF_SIZE_BYTES: Final[int] = 42_778
DIRECTED_OPERATOR_SOURCE_SHA256: Final[str] = (
    "084e92c9cb927293a227e076092e7b21f0cce525b92e2a0f35d0ae109e17103a"
)
DIRECTED_OPERATOR_SOURCE_SIZE_BYTES: Final[int] = 54_712

EPSILON: Final[float] = 2.0**-12
OUTER_RADIUS: Final[float] = 32.0
INITIAL_NODE_COUNT: Final[int] = 513
MAXIMUM_NODE_COUNT: Final[int] = 16_385
ORIGIN_MAXIMUM_INDEX: Final[int] = 16
SOLVER_TOLERANCE: Final[float] = 2.0**-32
BOUNDARY_TOLERANCE: Final[float] = 2.0**-40
REPLAY_POINT_COUNT: Final[int] = 4_097
RMS_RESIDUAL_LIMIT: Final[float] = 2.0**-31
BOUNDARY_RESIDUAL_LIMIT: Final[float] = 2.0**-36
REPLAY_RESIDUAL_LIMIT: Final[float] = 2.0**-24
INITIAL_VC: Final[float] = -1.5
INITIAL_NU: Final[float] = -0.5
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/lambda-zero-global-root-primary/v1\n"
)

AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "groundStateAccepted": False,
        "proofComplete": False,
        "executionAuthority": False,
        "candidateAuthority": False,
        "replayAuthority": False,
        "diagnosticLampAuthority": False,
        "physicalAuthority": False,
        "propulsionAuthority": False,
        "transportAuthority": False,
    }
)


class GlobalRootAttemptError(RuntimeError):
    """Typed, chronology-preserving one-shot attempt failure."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code if not detail else f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _u64le(value: int) -> bytes:
    return struct.pack("<Q", value)


def _f64_hex(value: float) -> str:
    if not math.isfinite(value):
        raise GlobalRootAttemptError("global_root_nonfinite_value")
    raw = struct.pack(">d", value)
    if raw == bytes.fromhex("8000000000000000"):
        raise GlobalRootAttemptError("global_root_negative_zero")
    return raw.hex()


def _canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical_bytes(unsigned)
    return _sha256(RECEIPT_DOMAIN + _u64le(len(raw)) + raw)


def _verify_proposal() -> None:
    raw = PROPOSAL_PATH.read_bytes()
    if len(raw) != PROPOSAL_SIZE_BYTES or _sha256(raw) != PROPOSAL_SHA256:
        raise GlobalRootAttemptError("global_root_proposal_binding_mismatch")


def _origin_coefficients(
    vc_value: float, nu_value: float
) -> tuple[tuple[Fraction, ...], tuple[Fraction, ...]]:
    vc = Fraction.from_float(vc_value)
    nu = Fraction.from_float(nu_value)
    a = [Fraction(1)]
    b = [vc]
    for shell in range(ORIGIN_MAXIMUM_INDEX):
        denominator = Fraction((2 * shell + 2) * (2 * shell + 3))
        ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
        aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
        a.append(2 * (ba - nu * a[shell]) / denominator)
        b.append(aa / denominator)
    return tuple(a), tuple(b)


def _origin_coefficients_with_derivatives(
    vc_value: float, nu_value: float
) -> tuple[
    tuple[Fraction, ...],
    tuple[Fraction, ...],
    tuple[tuple[Fraction, ...], tuple[Fraction, ...]],
    tuple[tuple[Fraction, ...], tuple[Fraction, ...]],
]:
    vc = Fraction.from_float(vc_value)
    nu = Fraction.from_float(nu_value)
    a = [Fraction(1)]
    b = [vc]
    da_vc = [Fraction(0)]
    db_vc = [Fraction(1)]
    da_nu = [Fraction(0)]
    db_nu = [Fraction(0)]
    for shell in range(ORIGIN_MAXIMUM_INDEX):
        denominator = Fraction((2 * shell + 2) * (2 * shell + 3))
        ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
        aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
        dba_vc = sum(
            db_vc[k] * a[shell - k] + b[k] * da_vc[shell - k]
            for k in range(shell + 1)
        )
        daa_vc = sum(
            da_vc[k] * a[shell - k] + a[k] * da_vc[shell - k]
            for k in range(shell + 1)
        )
        dba_nu = sum(
            db_nu[k] * a[shell - k] + b[k] * da_nu[shell - k]
            for k in range(shell + 1)
        )
        daa_nu = sum(
            da_nu[k] * a[shell - k] + a[k] * da_nu[shell - k]
            for k in range(shell + 1)
        )
        a.append(2 * (ba - nu * a[shell]) / denominator)
        b.append(aa / denominator)
        da_vc.append(
            2 * (dba_vc - nu * da_vc[shell]) / denominator
        )
        db_vc.append(daa_vc / denominator)
        da_nu.append(
            2
            * (dba_nu - a[shell] - nu * da_nu[shell])
            / denominator
        )
        db_nu.append(daa_nu / denominator)
    return (
        tuple(a),
        tuple(b),
        (tuple(da_vc), tuple(db_vc)),
        (tuple(da_nu), tuple(db_nu)),
    )


def _series_value(coefficients: tuple[Fraction, ...], x: float) -> float:
    x_fraction = Fraction.from_float(x)
    x_squared = x_fraction * x_fraction
    value = Fraction(0)
    power = Fraction(1)
    for coefficient in coefficients:
        value += coefficient * power
        power *= x_squared
    return float(value)


def _series_derivative(coefficients: tuple[Fraction, ...], x: float) -> float:
    x_fraction = Fraction.from_float(x)
    x_squared = x_fraction * x_fraction
    value = Fraction(0)
    power = x_fraction
    for index in range(1, len(coefficients)):
        value += 2 * index * coefficients[index] * power
        power *= x_squared
    return float(value)


def _origin_state(vc_value: float, nu_value: float) -> np.ndarray:
    a, b = _origin_coefficients(vc_value, nu_value)
    return np.asarray(
        [
            _series_value(a, EPSILON),
            _series_derivative(a, EPSILON),
            _series_value(b, EPSILON),
            _series_derivative(b, EPSILON),
        ],
        dtype=np.float64,
    )


def _origin_parameter_jacobian(vc_value: float, nu_value: float) -> np.ndarray:
    _a, _b, vc_derivatives, nu_derivatives = (
        _origin_coefficients_with_derivatives(vc_value, nu_value)
    )
    output = np.empty((4, 2), dtype=np.float64)
    for column, (da, db) in enumerate((vc_derivatives, nu_derivatives)):
        output[:, column] = (
            _series_value(da, EPSILON),
            _series_derivative(da, EPSILON),
            _series_value(db, EPSILON),
            _series_derivative(db, EPSILON),
        )
    return output


def _ode(x: np.ndarray, state: np.ndarray, parameters: np.ndarray) -> np.ndarray:
    nu_value = float(parameters[1])
    u, u_prime, potential, potential_prime = state
    return np.vstack(
        (
            u_prime,
            2.0 * (potential - nu_value) * u - 2.0 * u_prime / x,
            potential_prime,
            u * u - 2.0 * potential_prime / x,
        )
    )


def _ode_jacobian(
    x: np.ndarray, state: np.ndarray, parameters: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    nu_value = float(parameters[1])
    u, _u_prime, potential, _potential_prime = state
    count = x.size
    state_jacobian = np.zeros((4, 4, count), dtype=np.float64)
    parameter_jacobian = np.zeros((4, 2, count), dtype=np.float64)
    state_jacobian[0, 1, :] = 1.0
    state_jacobian[1, 0, :] = 2.0 * (potential - nu_value)
    state_jacobian[1, 1, :] = -2.0 / x
    state_jacobian[1, 2, :] = 2.0 * u
    parameter_jacobian[1, 1, :] = -2.0 * u
    state_jacobian[2, 3, :] = 1.0
    state_jacobian[3, 0, :] = 2.0 * u
    state_jacobian[3, 3, :] = -2.0 / x
    return state_jacobian, parameter_jacobian


def _boundary(
    left: np.ndarray, right: np.ndarray, parameters: np.ndarray
) -> np.ndarray:
    vc_value, nu_value = (float(parameters[0]), float(parameters[1]))
    if not nu_value < 0.0:
        return np.full(6, math.inf, dtype=np.float64)
    origin = _origin_state(vc_value, nu_value)
    kappa = math.sqrt(-2.0 * nu_value)
    mass = OUTER_RADIUS * OUTER_RADIUS * float(right[3])
    sigma = mass / kappa - 1.0
    return np.concatenate(
        (
            left - origin,
            np.asarray(
                [
                    right[3] + right[2] / OUTER_RADIUS,
                    right[1]
                    + (kappa - sigma / OUTER_RADIUS) * right[0],
                ],
                dtype=np.float64,
            ),
        )
    )


def _boundary_jacobian(
    left: np.ndarray, right: np.ndarray, parameters: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    del left
    vc_value, nu_value = (float(parameters[0]), float(parameters[1]))
    kappa = math.sqrt(-2.0 * nu_value)
    left_jacobian = np.zeros((6, 4), dtype=np.float64)
    right_jacobian = np.zeros((6, 4), dtype=np.float64)
    parameter_jacobian = np.zeros((6, 2), dtype=np.float64)
    left_jacobian[:4, :] = np.eye(4, dtype=np.float64)
    parameter_jacobian[:4, :] = -_origin_parameter_jacobian(
        vc_value, nu_value
    )
    right_jacobian[4, 2] = 1.0 / OUTER_RADIUS
    right_jacobian[4, 3] = 1.0
    coefficient = (
        kappa
        + 1.0 / OUTER_RADIUS
        - OUTER_RADIUS * float(right[3]) / kappa
    )
    right_jacobian[5, 0] = coefficient
    right_jacobian[5, 1] = 1.0
    right_jacobian[5, 3] = -OUTER_RADIUS * float(right[0]) / kappa
    parameter_jacobian[5, 1] = (
        -float(right[0])
        * (1.0 + OUTER_RADIUS * float(right[3]) / (kappa * kappa))
        / kappa
    )
    return left_jacobian, right_jacobian, parameter_jacobian


def _initial_mesh() -> np.ndarray:
    ordinal = np.arange(INITIAL_NODE_COUNT, dtype=np.float64)
    unit = (1.0 - np.cos(np.pi * ordinal / (INITIAL_NODE_COUNT - 1))) / 2.0
    return EPSILON + (OUTER_RADIUS - EPSILON) * unit


def _initial_state(mesh: np.ndarray) -> np.ndarray:
    u = np.exp(-(mesh * mesh) / 2.0)
    u_prime = -mesh * u
    denominator = np.sqrt(1.0 + mesh * mesh)
    potential = -1.5 / denominator
    potential_prime = 1.5 * mesh / (denominator * denominator * denominator)
    return np.vstack((u, u_prime, potential, potential_prime))


def _normalized_replay_residual(solution: object) -> float:
    mesh = np.linspace(EPSILON, OUTER_RADIUS, REPLAY_POINT_COUNT)
    state = np.asarray(solution.sol(mesh), dtype=np.float64)
    derivative = np.asarray(solution.sol(mesh, 1), dtype=np.float64)
    expected = _ode(mesh, state, np.asarray(solution.p, dtype=np.float64))
    difference = np.abs(derivative - expected)
    scale = 1.0 + np.abs(derivative) + np.abs(expected)
    return float(np.max(difference / scale))


def _screen(solution: object) -> tuple[list[dict[str, object]], dict[str, float]]:
    state = np.asarray(solution.y, dtype=np.float64)
    parameters = np.asarray(solution.p, dtype=np.float64)
    mesh = np.asarray(solution.x, dtype=np.float64)
    boundary = _boundary(state[:, 0], state[:, -1], parameters)
    vc_value, nu_value = float(parameters[0]), float(parameters[1])
    mass = OUTER_RADIUS * OUTER_RADIUS * float(state[3, -1])
    kappa = math.sqrt(-2.0 * nu_value) if nu_value < 0.0 else math.nan
    sigma = mass / kappa - 1.0 if kappa > 0.0 else math.nan
    rms = float(np.max(np.asarray(solution.rms_residuals, dtype=np.float64)))
    boundary_max = float(np.max(np.abs(boundary)))
    replay = _normalized_replay_residual(solution)
    origin = _origin_state(vc_value, nu_value)
    origin_error = float(np.max(np.abs(state[:, 0] - origin)))
    tail_error = float(np.max(np.abs(boundary[4:])))
    checks = [
        ("solver_status", bool(solution.success) and int(solution.status) == 0),
        ("node_budget", mesh.size <= MAXIMUM_NODE_COUNT),
        (
            "finite_nonnegative_zero",
            bool(np.all(np.isfinite(mesh)))
            and bool(np.all(np.isfinite(state)))
            and bool(np.all(np.isfinite(parameters))),
        ),
        ("parameter_signs", vc_value < nu_value < 0.0 and mass > 0.0),
        ("derived_signs", kappa > 0.0 and sigma + 1.0 > 0.0),
        ("u_positive", bool(np.all(state[0] > 0.0))),
        ("u_nonincreasing", bool(np.all(state[1] <= 0.0))),
        ("V_negative", bool(np.all(state[2] < 0.0))),
        ("V_nondecreasing", bool(np.all(state[3] >= 0.0))),
        ("rms_residual", rms <= RMS_RESIDUAL_LIMIT),
        ("boundary_residual", boundary_max <= BOUNDARY_RESIDUAL_LIMIT),
        ("uniform_replay_residual", replay <= REPLAY_RESIDUAL_LIMIT),
        ("origin_reproduction", origin_error <= BOUNDARY_RESIDUAL_LIMIT),
        ("tail_reproduction", tail_error <= BOUNDARY_RESIDUAL_LIMIT),
    ]
    records = [
        {"ordinal": index, "checkId": name, "passed": passed}
        for index, (name, passed) in enumerate(checks)
    ]
    for name, passed in checks:
        if not passed:
            raise GlobalRootAttemptError("global_root_screen_failed", name)
    return records, {
        "mass": mass,
        "kappa": kappa,
        "sigma": sigma,
        "maximumRmsResidual": rms,
        "maximumBoundaryResidual": boundary_max,
        "uniformReplayResidual": replay,
        "originReproductionError": origin_error,
        "tailReproductionError": tail_error,
    }


def _runtime_binding() -> dict[str, object]:
    executable = Path(sys.executable).resolve()
    numpy_path = Path(np.__file__).resolve()
    scipy_path = Path(scipy.__file__).resolve()
    return {
        "pythonVersion": platform.python_version(),
        "pythonExecutablePath": executable.as_posix(),
        "pythonExecutableSha256": _sha256(executable.read_bytes()),
        "numpyVersion": np.__version__,
        "numpyModulePath": numpy_path.as_posix(),
        "numpyModuleSha256": _sha256(numpy_path.read_bytes()),
        "scipyVersion": scipy.__version__,
        "scipyModulePath": scipy_path.as_posix(),
        "scipyModuleSha256": _sha256(scipy_path.read_bytes()),
        "binary64Format": "IEEE_754_binary64_little_endian",
    }


def _command_binding(target: Path) -> list[str]:
    return [
        Path(sys.executable).resolve().as_posix(),
        "-I",
        "-B",
        Path(__file__).resolve().as_posix(),
        "--execute-once",
        target.as_posix(),
    ]


def _attempt_unsigned(
    solution: object, source_raw: bytes, target: Path
) -> dict[str, object]:
    checks, summary = _screen(solution)
    mesh = tuple(float(value) for value in solution.x)
    state = tuple(
        tuple(float(value) for value in row) for row in solution.y
    )
    parameters = tuple(float(value) for value in solution.p)
    for value in (*mesh, *parameters, *(item for row in state for item in row)):
        _f64_hex(value)
    return {
        "artifactId": "nhm2.spherical_boson_star_v2.lambda_zero_global_root_primary",
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "attemptVersion": ATTEMPT_VERSION,
        "command": _command_binding(target),
        "decision": "CALCULATION_CENTER_ONLY",
        "dependencyBindings": {
            "directedOperatorSourceSha256": DIRECTED_OPERATOR_SOURCE_SHA256,
            "directedOperatorSourceSizeBytes": DIRECTED_OPERATOR_SOURCE_SIZE_BYTES,
            "directedProofSemanticSha256": DIRECTED_PROOF_SHA256,
            "directedProofSemanticSizeBytes": DIRECTED_PROOF_SIZE_BYTES,
            "lambdaZeroDefinitionSemanticSha256": LAMBDA_ZERO_DEFINITION_SHA256,
            "lambdaZeroDefinitionSemanticSizeBytes": LAMBDA_ZERO_DEFINITION_SIZE_BYTES,
            "proposalRawSha256": PROPOSAL_SHA256,
            "proposalRawSizeBytes": PROPOSAL_SIZE_BYTES,
            "sourceRawSha256": _sha256(source_raw),
            "sourceRawSizeBytes": len(source_raw),
        },
        "meshF64Hex": [_f64_hex(value) for value in mesh],
        "noRetune": True,
        "parameters": {
            "VcF64Hex": _f64_hex(parameters[0]),
            "nuF64Hex": _f64_hex(parameters[1]),
        },
        "runtimeBinding": _runtime_binding(),
        "screens": checks,
        "solver": {
            "initialNodeCount": INITIAL_NODE_COUNT,
            "maximumNodeCount": MAXIMUM_NODE_COUNT,
            "message": str(solution.message),
            "nodeCount": len(mesh),
            "status": int(solution.status),
            "success": bool(solution.success),
            "tolF64Hex": _f64_hex(SOLVER_TOLERANCE),
            "bcTolF64Hex": _f64_hex(BOUNDARY_TOLERANCE),
        },
        "stateOrder": ["u", "uPrime", "V", "VPrime"],
        "stateRowsF64Hex": [
            [_f64_hex(value) for value in row] for row in state
        ],
        "summaryF64Hex": {
            key: _f64_hex(value) for key, value in sorted(summary.items())
        },
    }


def _failure_unsigned(
    error: Exception,
    source_raw: bytes,
    solution: object | None,
    target: Path,
) -> dict[str, object]:
    if isinstance(error, GlobalRootAttemptError):
        code = error.code
        detail = error.detail
    else:
        code = "global_root_solver_exception"
        detail = type(error).__name__
    solver_evidence: dict[str, object] | None = None
    state_evidence: dict[str, object] | None = None
    if solution is not None:
        solver_evidence = {
            "message": str(solution.message),
            "nodeCount": int(np.asarray(solution.x).size),
            "status": int(solution.status),
            "success": bool(solution.success),
        }
        mesh = np.asarray(solution.x, dtype=np.float64)
        state = np.asarray(solution.y, dtype=np.float64)
        parameters = np.asarray(solution.p, dtype=np.float64)
        if (
            mesh.ndim == 1
            and state.shape == (4, mesh.size)
            and parameters.shape == (2,)
            and mesh.size <= MAXIMUM_NODE_COUNT
            and np.all(np.isfinite(mesh))
            and np.all(np.isfinite(state))
            and np.all(np.isfinite(parameters))
        ):
            try:
                state_evidence = {
                    "meshF64Hex": [_f64_hex(float(value)) for value in mesh],
                    "parametersF64Hex": [
                        _f64_hex(float(value)) for value in parameters
                    ],
                    "stateRowsF64Hex": [
                        [_f64_hex(float(value)) for value in row]
                        for row in state
                    ],
                }
            except GlobalRootAttemptError:
                state_evidence = None
    return {
        "artifactId": "nhm2.spherical_boson_star_v2.lambda_zero_global_root_primary",
        "attemptVersion": ATTEMPT_VERSION,
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "command": _command_binding(target),
        "decision": "CALCULATION_FAIL",
        "dependencyBindings": {
            "proposalRawSha256": PROPOSAL_SHA256,
            "proposalRawSizeBytes": PROPOSAL_SIZE_BYTES,
            "sourceRawSha256": _sha256(source_raw),
            "sourceRawSizeBytes": len(source_raw),
        },
        "firstFailure": {"code": code, "detail": detail},
        "noRetune": True,
        "runtimeBinding": _runtime_binding(),
        "solver": solver_evidence,
        "stateAtFailure": state_evidence,
    }


def _exclusive_write(path: Path, raw: bytes) -> None:
    descriptor = os.open(
        path,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    try:
        with os.fdopen(descriptor, "wb", closefd=True) as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        raise


def execute_one_global_root_attempt(output_path: str) -> str:
    """Run the preregistered calculation once and exclusively persist it."""

    if type(output_path) is not str or not output_path:
        raise GlobalRootAttemptError("global_root_output_path_invalid")
    _verify_proposal()
    target = Path(output_path).resolve()
    if target.exists():
        raise GlobalRootAttemptError("global_root_output_collision")
    source_raw = Path(__file__).resolve().read_bytes()
    mesh = _initial_mesh()
    initial = _initial_state(mesh)
    solution = None
    try:
        solution = solve_bvp(
            _ode,
            _boundary,
            mesh,
            initial,
            p=np.asarray([INITIAL_VC, INITIAL_NU], dtype=np.float64),
            fun_jac=_ode_jacobian,
            bc_jac=_boundary_jacobian,
            tol=SOLVER_TOLERANCE,
            bc_tol=BOUNDARY_TOLERANCE,
            max_nodes=MAXIMUM_NODE_COUNT,
            verbose=0,
        )
        unsigned = _attempt_unsigned(solution, source_raw, target)
    except Exception as error:
        unsigned = _failure_unsigned(error, source_raw, solution, target)
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    raw = _canonical_bytes(full)
    _exclusive_write(target, raw)
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if len(arguments) != 2 or arguments[0] != "--execute-once":
        raise GlobalRootAttemptError("global_root_exact_command_required")
    digest = execute_one_global_root_attempt(arguments[1])
    sys.stdout.write(digest + "\n")
    return 0


if (
    EPSILON != 2.0**-12
    or OUTER_RADIUS != 32.0
    or INITIAL_NODE_COUNT != 513
    or MAXIMUM_NODE_COUNT != 16_385
    or ORIGIN_MAXIMUM_INDEX != 16
    or REPLAY_POINT_COUNT != 4_097
    or scipy.__version__ != "1.16.1"
    or np.__version__ != "2.3.2"
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("lambda_zero_global_root_primary_invariant")


__all__ = [
    "AUTHORITY_LOCKS",
    "ATTEMPT_VERSION",
    "GlobalRootAttemptError",
    "execute_one_global_root_attempt",
]


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
