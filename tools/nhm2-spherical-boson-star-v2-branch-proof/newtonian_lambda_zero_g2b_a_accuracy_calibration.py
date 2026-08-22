"""Finite preregistered binary64 accuracy calibration for G2B-A.

Program gate: G2B-A — higher-accuracy global-center calibration
Workstream: versioned classical-branch repair review
Capability or component: fixed three-ordinal global-center accuracy ladder
Current maturity: G2-R1 selects upstream global-center accuracy repair
Target maturity: immutable configuration-class selection receipt
Required frozen inputs: G2B-A packet and immutable v1/G2-R1 implementations
Required evidence: fresh solves, exact point residuals, screens, and provenance
Stop/fail criteria: first binding, solver, arithmetic, selection, or collision error
Explicit non-goals: replacement center, projection, branch solve, or authority
Downstream gate unlocked: one versioned G2B center or MPFR/spectral proposal
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import platform
import struct
import sys
from types import MappingProxyType, ModuleType
from typing import Final

import numpy as np
import scipy
from scipy.integrate import solve_bvp


CALIBRATION_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_v2_g2b_a_accuracy_calibration/v1"
)
ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-a-global-center-accuracy-calibration.md"
)
PACKET_RAW_SHA256: Final[str] = (
    "4d9a68bcfc14c2d570d0a7800774e9a2a429e0cda46dd3053301d9b13a954808"
)
PACKET_SIZE_BYTES: Final[int] = 4_101
G2_R1_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2-r1-exact-hermite-diagnosis-v1.json"
)
G2_R1_RECEIPT_RAW_SHA256: Final[str] = (
    "b372e7d6103809be75138970e641638918bf9ec2a03ca32b95ed6fc87a8405c8"
)
G2_R1_RECEIPT_SIZE_BYTES: Final[int] = 4_266
G2_R1_RECEIPT_SHA256: Final[str] = (
    "86633508a20c79b56d7ed0455102fd1c35f206e521dbda8e3e9d79b85aef243f"
)
GLOBAL_SOURCE_PATH: Final[Path] = (
    ROOT
    / "tools"
    / "nhm2-spherical-boson-star-v2-branch-proof"
    / "newtonian_lambda_zero_global_root_primary.py"
)
GLOBAL_SOURCE_RAW_SHA256: Final[str] = (
    "f370d563acfb7d1f1f967895f5789a5dfeba1760d418b34dd665abbef92132c6"
)
GLOBAL_SOURCE_SIZE_BYTES: Final[int] = 23_629
DIAGNOSIS_SOURCE_PATH: Final[Path] = (
    ROOT
    / "tools"
    / "nhm2-spherical-boson-star-v2-branch-proof"
    / "newtonian_lambda_zero_g2_r1_exact_hermite_diagnosis.py"
)
DIAGNOSIS_SOURCE_RAW_SHA256: Final[str] = (
    "da768ee4937d4ead436f8064a7542b113d9a82449e99860ef7edbbacd4784f8e"
)
DIAGNOSIS_SOURCE_SIZE_BYTES: Final[int] = 18_257
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-a-global-center-accuracy-calibration-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-a-global-center-accuracy-calibration/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
RAIL: Final[Fraction] = Fraction(1, 10_000_000_000)
SAFETY_LIMIT: Final[Fraction] = RAIL / 4
MAXIMUM_NODES: Final[int] = 65_537
DENSE_REPLAY_POINTS: Final[int] = 16_385
BOUNDARY_LIMIT: Final[float] = 2.0**-44
CONFIGURATIONS: Final[tuple[tuple[int, float], ...]] = (
    (0, 2.0**-36),
    (1, 2.0**-40),
    (2, 2.0**-44),
)
AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "proofComplete": False,
        "groundStateAccepted": False,
        "executionAuthority": False,
        "candidateAuthority": False,
        "replayAuthority": False,
        "diagnosticLampAuthority": False,
        "physicalAuthority": False,
        "propulsionAuthority": False,
        "transportAuthority": False,
    }
)


class AccuracyCalibrationError(RuntimeError):
    """Typed fail-closed calibration error."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(code if not detail else f"{code}:{detail}")
        self.code = code
        self.detail = detail


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _read_bound(path: Path, size: int, digest: str, code: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        raise AccuracyCalibrationError(code)
    return raw


def _load_module(path: Path, name: str) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise AccuracyCalibrationError("calibration_dependency_loader_invalid", name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _f64_hex(value: float, label: str) -> str:
    if not math.isfinite(value):
        raise AccuracyCalibrationError("calibration_nonfinite_value", label)
    raw = struct.pack(">d", value)
    if raw == bytes.fromhex("8000000000000000"):
        raise AccuracyCalibrationError("calibration_negative_zero", label)
    return raw.hex()


def _fraction_json(value: Fraction) -> dict[str, str]:
    return {
        "denominator": str(value.denominator),
        "numerator": str(value.numerator),
    }


def _exact_point_residual(
    mesh_words: list[str],
    state_words: list[list[str]],
    nu_word: str,
    exact: ModuleType,
) -> Fraction:
    mesh = tuple(
        exact._binary64_fraction_hex(word, f"mesh[{index}]")
        for index, word in enumerate(mesh_words)
    )
    intervals = [
        index
        for index in range(len(mesh) - 1)
        if mesh[index] < POINT_X < mesh[index + 1]
    ]
    if len(intervals) != 1:
        raise AccuracyCalibrationError("calibration_unique_interval_absent")
    left = intervals[0]
    rows = tuple(
        tuple(
            exact._binary64_fraction_hex(word, f"state[{row}][{column}]")
            for column, word in enumerate(words)
        )
        for row, words in enumerate(state_words)
    )
    u, u_x, u_xx = exact._hermite_jet(
        mesh[left],
        mesh[left + 1],
        rows[0][left],
        rows[0][left + 1],
        rows[1][left],
        rows[1][left + 1],
        POINT_X,
        "u",
    )
    potential, _v_x, _v_xx = exact._hermite_jet(
        mesh[left],
        mesh[left + 1],
        rows[2][left],
        rows[2][left + 1],
        rows[3][left],
        rows[3][left + 1],
        POINT_X,
        "V",
    )
    nu = exact._binary64_fraction_hex(nu_word, "nu")
    residual = -Fraction(1, 2) * (u_xx + 2 * u_x / POINT_X)
    residual += (potential - nu) * u
    denominator = Fraction(1)
    denominator += abs(u_xx / 2)
    denominator += abs(u_x / POINT_X)
    denominator += abs(potential * u)
    denominator += abs(nu * u)
    return abs(residual) / denominator


def _dense_replay(solution: object, primary: ModuleType) -> float:
    mesh = np.linspace(primary.EPSILON, primary.OUTER_RADIUS, DENSE_REPLAY_POINTS)
    state = np.asarray(solution.sol(mesh), dtype=np.float64)
    derivative = np.asarray(solution.sol(mesh, 1), dtype=np.float64)
    expected = primary._ode(mesh, state, np.asarray(solution.p, dtype=np.float64))
    difference = np.abs(derivative - expected)
    scale = 1.0 + np.abs(derivative) + np.abs(expected)
    return float(np.max(difference / scale))


def _observation(
    ordinal: int,
    tolerance: float,
    primary: ModuleType,
    exact: ModuleType,
) -> dict[str, object]:
    mesh = primary._initial_mesh()
    initial = primary._initial_state(mesh)
    initial_digest = _sha256(mesh.tobytes() + initial.tobytes())
    solution = solve_bvp(
        primary._ode,
        primary._boundary,
        mesh,
        initial,
        p=np.asarray([primary.INITIAL_VC, primary.INITIAL_NU], dtype=np.float64),
        fun_jac=primary._ode_jacobian,
        bc_jac=primary._boundary_jacobian,
        tol=tolerance,
        bc_tol=BOUNDARY_LIMIT,
        max_nodes=MAXIMUM_NODES,
        verbose=0,
    )
    state = np.asarray(solution.y, dtype=np.float64)
    parameters = np.asarray(solution.p, dtype=np.float64)
    solved_mesh = np.asarray(solution.x, dtype=np.float64)
    if (
        state.shape != (4, solved_mesh.size)
        or parameters.shape != (2,)
        or solved_mesh.size > MAXIMUM_NODES
    ):
        raise AccuracyCalibrationError("calibration_solution_shape_invalid")
    mesh_words = [
        _f64_hex(float(value), f"mesh[{index}]")
        for index, value in enumerate(solved_mesh)
    ]
    state_words = [
        [
            _f64_hex(float(value), f"state[{row}][{column}]")
            for column, value in enumerate(state[row])
        ]
        for row in range(4)
    ]
    parameter_words = {
        "VcF64Hex": _f64_hex(float(parameters[0]), "Vc"),
        "nuF64Hex": _f64_hex(float(parameters[1]), "nu"),
    }
    screens, summary = primary._screen(solution)
    rms = float(np.max(np.asarray(solution.rms_residuals, dtype=np.float64)))
    boundary = primary._boundary(state[:, 0], state[:, -1], parameters)
    boundary_max = float(np.max(np.abs(boundary)))
    dense = _dense_replay(solution, primary)
    exact_residual = _exact_point_residual(
        mesh_words,
        state_words,
        parameter_words["nuF64Hex"],
        exact,
    )
    eligible = (
        bool(solution.success)
        and int(solution.status) == 0
        and solved_mesh.size <= MAXIMUM_NODES
        and rms <= tolerance
        and boundary_max <= BOUNDARY_LIMIT
        and Fraction.from_float(dense) <= SAFETY_LIMIT
        and exact_residual <= SAFETY_LIMIT
        and all(record["passed"] is True for record in screens)
    )
    return {
        "boundaryResidualF64Hex": _f64_hex(boundary_max, "boundary"),
        "denseReplayResidualF64Hex": _f64_hex(dense, "dense_replay"),
        "eligible": eligible,
        "exactHermiteResidual": _fraction_json(exact_residual),
        "initialStateDigestSha256": initial_digest,
        "maximumRmsResidualF64Hex": _f64_hex(rms, "rms"),
        "meshF64Hex": mesh_words,
        "nodeCount": int(solved_mesh.size),
        "ordinal": ordinal,
        "parameters": parameter_words,
        "screens": screens,
        "solverMessage": str(solution.message)[:256],
        "solverStatus": int(solution.status),
        "solverSuccess": bool(solution.success),
        "stateOrder": ["u", "uPrime", "V", "VPrime"],
        "stateRowsF64Hex": state_words,
        "summary": {
            key: _f64_hex(float(value), f"summary.{key}")
            for key, value in summary.items()
        },
        "toleranceF64Hex": _f64_hex(tolerance, "tolerance"),
    }


def _select_ordinal(observations: list[dict[str, object]]) -> int | None:
    if [item.get("ordinal") for item in observations] != [0, 1, 2]:
        raise AccuracyCalibrationError("calibration_observation_order_invalid")
    eligible = [
        item["ordinal"]
        for item in observations
        if item.get("eligible") is True
    ]
    return min(eligible) if eligible else None


def materialize_accuracy_calibration() -> str:
    if OUTPUT_PATH.exists() or OUTPUT_PATH.is_symlink():
        raise AccuracyCalibrationError("calibration_output_collision")
    _read_bound(
        PACKET_PATH,
        PACKET_SIZE_BYTES,
        PACKET_RAW_SHA256,
        "calibration_packet_binding_mismatch",
    )
    _read_bound(
        G2_R1_RECEIPT_PATH,
        G2_R1_RECEIPT_SIZE_BYTES,
        G2_R1_RECEIPT_RAW_SHA256,
        "calibration_g2_r1_binding_mismatch",
    )
    _read_bound(
        GLOBAL_SOURCE_PATH,
        GLOBAL_SOURCE_SIZE_BYTES,
        GLOBAL_SOURCE_RAW_SHA256,
        "calibration_global_source_binding_mismatch",
    )
    _read_bound(
        DIAGNOSIS_SOURCE_PATH,
        DIAGNOSIS_SOURCE_SIZE_BYTES,
        DIAGNOSIS_SOURCE_RAW_SHA256,
        "calibration_diagnosis_source_binding_mismatch",
    )
    receipt = json.loads(G2_R1_RECEIPT_PATH.read_text(encoding="ascii"))
    if (
        receipt.get("receiptSha256") != G2_R1_RECEIPT_SHA256
        or receipt.get("result", {}).get("decision")
        != "UPSTREAM_GLOBAL_CENTER_ACCURACY_SUCCESSOR_REQUIRED"
    ):
        raise AccuracyCalibrationError("calibration_g2_r1_decision_invalid")
    primary = _load_module(GLOBAL_SOURCE_PATH, "g2b_a_global_primary_dependency")
    exact = _load_module(DIAGNOSIS_SOURCE_PATH, "g2b_a_exact_dependency")
    observations = [
        _observation(ordinal, tolerance, primary, exact)
        for ordinal, tolerance in CONFIGURATIONS
    ]
    initial_digests = {item["initialStateDigestSha256"] for item in observations}
    if len(initial_digests) != 1:
        raise AccuracyCalibrationError("calibration_initialization_drift")
    selected = _select_ordinal(observations)
    decision = (
        "BINARY64_CONFIGURATION_SELECTED"
        if selected is not None
        else "BINARY64_CALIBRATION_EXHAUSTED_MPFR_OR_SPECTRAL_REQUIRED"
    )
    source_raw = Path(__file__).resolve().read_bytes()
    executable = Path(sys.executable).resolve()
    unsigned = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_a_accuracy_calibration",
        "authorityLocks": dict(AUTHORITY_LOCKS),
        "calibrationVersion": CALIBRATION_VERSION,
        "decision": decision,
        "diagnosisSourceRawSha256": DIAGNOSIS_SOURCE_RAW_SHA256,
        "g2R1ReceiptSha256": G2_R1_RECEIPT_SHA256,
        "globalSourceRawSha256": GLOBAL_SOURCE_RAW_SHA256,
        "noRetune": True,
        "observations": observations,
        "packetRawSha256": PACKET_RAW_SHA256,
        "runtime": {
            "executablePath": executable.as_posix(),
            "executableSha256": _sha256(executable.read_bytes()),
            "numpyVersion": np.__version__,
            "platform": platform.platform(),
            "pythonVersion": platform.python_version(),
            "scipyVersion": scipy.__version__,
        },
        "selectedOrdinal": selected,
        "selectionSafetyLimit": _fraction_json(SAFETY_LIMIT),
        "sourceRawSha256": _sha256(source_raw),
        "sourceRawSizeBytes": len(source_raw),
    }
    raw = _canonical_bytes(unsigned)
    full = dict(unsigned)
    full["receiptSha256"] = _sha256(
        RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw
    )
    output = _canonical_bytes(full)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(OUTPUT_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb", closefd=True) as stream:
            stream.write(output)
            stream.flush()
            os.fsync(stream.fileno())
    except BaseException:
        try:
            OUTPUT_PATH.unlink()
        except OSError:
            pass
        raise
    return full["receiptSha256"]


if (
    CONFIGURATIONS
    != ((0, 2.0**-36), (1, 2.0**-40), (2, 2.0**-44))
    or MAXIMUM_NODES != 65_537
    or DENSE_REPLAY_POINTS != 16_385
    or np.__version__ != "2.3.2"
    or scipy.__version__ != "1.16.1"
    or any(AUTHORITY_LOCKS.values())
):
    raise RuntimeError("g2b_a_accuracy_calibration_invariant")


if __name__ == "__main__":
    print(materialize_accuracy_calibration())


__all__ = ("AccuracyCalibrationError", "materialize_accuracy_calibration")
