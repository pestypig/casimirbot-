"""R2 one-shot rerun deleting only the disproved midpoint screen."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PROPOSAL_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m1-r2-proposal.md"
)
PROPOSAL_SHA256: Final[str] = (
    "452a627e1ffa6035622c0d352efbfdc980a0c88dbf5f8c6d1f5347450214dacb"
)
PROPOSAL_SIZE_BYTES: Final[int] = 2_372
R1_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-r1-midpoint-screen-diagnosis-v1.json"
)
R1_RECEIPT_SHA256: Final[str] = (
    "d386b18118217714b2f0fae1e024fda859b176cac2083a4e41fbeb3e102a3523"
)
R1_RECEIPT_SIZE_BYTES: Final[int] = 1_348
R1_RECEIPT_SELF_SHA256: Final[str] = (
    "2b93eaac7c939d2bfc4e7cbdc92873f87b1f233669f3cce71395de6967d63300"
)
M1_RUNNER_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_one_shot.py"
)
M1_RUNNER_SHA256: Final[str] = (
    "550f35b86c62c634e84a5a693e4394f42e403f25cc890dcbb45d93b30322a2b7"
)
M1_RUNNER_SIZE_BYTES: Final[int] = 20_818
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m1-r2-mpfr256-global-center-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m1-r2-mpfr256-global-center/v1\n"
)


class G2BM1R2Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM1R2Error(code, detail)


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _verify(path: Path, size: int, digest: str, label: str) -> bytes:
    raw = path.read_bytes()
    if len(raw) != size or _sha256(raw) != digest:
        _fail(f"{label}_binding_mismatch")
    return raw


def _canonical(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=True,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("ascii")


def _load_m1_runner():
    _verify(M1_RUNNER_PATH, M1_RUNNER_SIZE_BYTES, M1_RUNNER_SHA256, "m1_runner")
    specification = importlib.util.spec_from_file_location(
        "g2b_m1_r2_frozen_runner", M1_RUNNER_PATH
    )
    if specification is None or specification.loader is None:
        _fail("m1_runner_specification_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


def _verify_r1_receipt() -> None:
    value = json.loads(
        _verify(
            R1_RECEIPT_PATH,
            R1_RECEIPT_SIZE_BYTES,
            R1_RECEIPT_SHA256,
            "r1_receipt",
        )
    )
    if (
        type(value) is not dict
        or value.get("receiptSha256") != R1_RECEIPT_SELF_SHA256
        or value.get("decision") != "REPAIR_GLOBAL_BINARY64_MIDPOINT_SCREEN"
        or value.get("noCandidateStateRead") is not True
        or value.get("noCandidateSolve") is not True
    ):
        _fail("r1_receipt_decision_invalid")


def _screen_without_midpoint(engine, variables, rows):
    residual, _unused = engine._system(variables, 8, jacobian=False)
    matching = engine._maximum_absolute(residual)
    if matching > engine.gmpy2.exp2(-180):
        _fail("g2b_m1_r2_matching_screen_failed")
    vc, nu = variables[:2]
    radius = engine.gmpy2.mpfr(32)
    mass = radius * radius * rows[3][-1]
    if not vc < nu < 0 or not mass > 0:
        _fail("g2b_m1_r2_parameter_screen_failed")
    if any(not value > 0 for value in rows[0]):
        _fail("g2b_m1_r2_u_positive_screen_failed")
    if any(not value <= 0 for value in rows[1]):
        _fail("g2b_m1_r2_u_monotonic_screen_failed")
    if any(not value < 0 for value in rows[2]):
        _fail("g2b_m1_r2_potential_sign_screen_failed")
    if any(not value >= 0 for value in rows[3]):
        _fail("g2b_m1_r2_potential_monotonic_screen_failed")
    kappa = engine.gmpy2.sqrt(-2 * nu)
    sigma = mass / kappa - 1
    if not kappa > 0 or not sigma + 1 > 0:
        _fail("g2b_m1_r2_derived_sign_screen_failed")
    return matching


def _fraction_record(value) -> dict[str, str]:
    return {"denominator": str(value.denominator), "numerator": str(value.numerator)}


def _self_hash(unsigned: dict[str, object]) -> str:
    raw = _canonical(unsigned)
    return _sha256(RECEIPT_DOMAIN + struct.pack("<Q", len(raw)) + raw)


def execute_once() -> str:
    if OUTPUT_PATH.exists():
        _fail("g2b_m1_r2_output_collision")
    _verify(PROPOSAL_PATH, PROPOSAL_SIZE_BYTES, PROPOSAL_SHA256, "proposal")
    _verify_r1_receipt()
    m1 = _load_m1_runner()
    engine = m1._load_engine()
    stage = "runtime_admission"
    completed: list[dict[str, object]] = []
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
            stage = "unchanged_solution_screens"
            matching = _screen_without_midpoint(engine, fine, fine_rows)
            stage = "encoding"
            center = m1._encoded_center(
                engine, fine, fine_rows, fine_chronology, runtime
            )
        stage = "exact_classifiers"
        center_residual = m1._exact_center_residual(center)
        projected_residual = None
        projection_failure = None
        try:
            projected_residual = m1._exact_projected_residual(center)
        except Exception as error:
            projection_failure = {
                "code": getattr(error, "code", type(error).__name__),
                "detail": getattr(error, "detail", ""),
            }
        if center_residual > m1.CENTER_MARGIN:
            decision = "GLOBAL_CENTER_SUCCESSOR_FAILED"
        elif projected_residual is None or projected_residual > m1.CENTER_MARGIN:
            decision = "CENTER_RECOVERED_CODEC_OR_MODE_SUCCESSOR_REQUIRED"
        else:
            decision = "CENTER_AND_FROZEN_PROJECTION_RECOVERED"
        unsigned = {
            "artifactId": (
                "nhm2.spherical_boson_star_v2.g2b_m1_r2_mpfr256_global_center"
            ),
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
            "maximumMatchingResidual": str(matching),
            "midpointScreenDeletedByR1Receipt": R1_RECEIPT_SELF_SHA256,
            "noRetune": True,
            "projectionFailure": projection_failure,
            "proposalRawSha256": PROPOSAL_SHA256,
            "richardsonEstimate": str(richardson),
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    except Exception as error:
        code = getattr(error, "code", "g2b_m1_r2_untyped_exception")
        detail = getattr(error, "detail", type(error).__name__)
        unsigned = {
            "artifactId": (
                "nhm2.spherical_boson_star_v2.g2b_m1_r2_mpfr256_global_center"
            ),
            "authorityLocks": dict(engine.AUTHORITY_LOCKS),
            "completedRefinements": completed,
            "decision": "CALCULATION_FAIL",
            "firstFailure": {
                "code": code,
                "detail": detail,
                "evidence": getattr(error, "evidence", None),
                "stage": stage,
            },
            "midpointScreenDeletedByR1Receipt": R1_RECEIPT_SELF_SHA256,
            "noRetune": True,
            "proposalRawSha256": PROPOSAL_SHA256,
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    descriptor = os.open(
        OUTPUT_PATH,
        os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_BINARY", 0),
        0o600,
    )
    with os.fdopen(descriptor, "wb", closefd=True) as handle:
        handle.write(_canonical(full))
        handle.flush()
        os.fsync(handle.fileno())
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m1_r2_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
