"""One-shot selected-center MPFR-native projection for G2B-M4.

Program gate: G2B-M4 — selected-center MPFR-native projection
Workstream: lambda-zero proof-center recovery
Capability or component: full selected refinement and fixed DCT-I ladder
Current maturity: private preregistered one-shot implementation
Target maturity: passing projected core duty or terminal falsifier
Required frozen inputs: M1 engine, M2 codec, selected M3 receipt/source
Required evidence: exact M3 replay and every fixed projection ordinal
Stop/fail criteria: one execution; all modes fixed; no retry or retune
Explicit non-goals: changed center/rail/ODE/point/branch or authority promotion
Downstream gate unlocked: remaining G2B classical proof duties after exact pass
"""

from __future__ import annotations

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
    / "nhm2-spherical-boson-star-v2-g2b-m4-mpfr-native-projection.md"
)
PACKET_SHA256: Final[str] = (
    "ab66dc59d4857df268efe84e46c3f0dfa6dea6474102df56aaa77eb7e81eb80d"
)
PACKET_SIZE_BYTES: Final[int] = 2_377
M3_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m3_local_center_refinement.py"
)
M3_SOURCE_SHA256: Final[str] = (
    "c116db73eb5ab438f4a1f3e4ce964795315e757ee78033552a8ffaf0a8ac3140"
)
M3_SOURCE_SIZE_BYTES: Final[int] = 14_024
M3_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m3-local-center-refinement-v1.json"
)
M3_RECEIPT_RAW_SHA256: Final[str] = (
    "38bb7bb9cf52f0f0008442f9c8c212279f85d9d323eab69b66ec1eea061fa88d"
)
M3_RECEIPT_SIZE_BYTES: Final[int] = 18_479
M3_RECEIPT_SELF_SHA256: Final[str] = (
    "198f65decd9fe7616a523a066d80898b582fdf630921bafaa9557858a5aeb212"
)
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m4-mpfr-native-projection-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m4-mpfr-native-projection/v1\n"
)

SELECTED_SUBSTEPS: Final[int] = 256
SOLVE_REFINEMENTS: Final[tuple[int, ...]] = (4, 8)
MODE_COUNTS: Final[tuple[int, ...]] = (128, 256, 512)
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "diagnosticLampAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BM4Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM4Error(code, detail)


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
        _fail("g2b_m4_static_binding_drift", label)
    return raw


def _load_m3():
    _verify(M3_SOURCE_PATH, M3_SOURCE_SIZE_BYTES, M3_SOURCE_SHA256, "m3_source")
    spec = importlib.util.spec_from_file_location("g2b_m4_m3", M3_SOURCE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_m4_m3_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _verify_m3_receipt(m3) -> dict[str, object]:
    raw = _verify(
        M3_RECEIPT_PATH,
        M3_RECEIPT_SIZE_BYTES,
        M3_RECEIPT_RAW_SHA256,
        "m3_receipt",
    )
    root = json.loads(raw)
    if type(root) is not dict or root.get("receiptSha256") != M3_RECEIPT_SELF_SHA256:
        _fail("g2b_m4_m3_receipt_invalid")
    unsigned = dict(root)
    expected = unsigned.pop("receiptSha256")
    payload = _canonical(unsigned)
    observed = _sha256(
        m3.RECEIPT_DOMAIN + struct.pack("<Q", len(payload)) + payload
    )
    if (
        observed != expected
        or root.get("decision") != "MPFR_LOCAL_CENTER_SELECTED"
        or root.get("selectedSubstepsPerOutputInterval") != SELECTED_SUBSTEPS
    ):
        _fail("g2b_m4_m3_receipt_invalid")
    observations = root.get("centerObservations")
    if type(observations) is not list or len(observations) != 4:
        _fail("g2b_m4_m3_receipt_invalid")
    selected = observations[-1]
    if selected.get("substepsPerOutputInterval") != SELECTED_SUBSTEPS:
        _fail("g2b_m4_m3_receipt_invalid")
    return root


def _materialize_full(engine, variables: Sequence[object]):
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
                SELECTED_SUBSTEPS,
                augmented=False,
            )
            for row_ordinal in range(4):
                rows[row_ordinal].append(current[row_ordinal])
    if any(len(row) != engine.OUTPUT_NODE_COUNT for row in rows):
        _fail("g2b_m4_materialized_state_shape")
    return tuple(tuple(row) for row in rows)


def _selected_observation(root: dict[str, object]) -> dict[str, object]:
    observations = root["centerObservations"]
    selected = observations[-1]
    if (
        selected["ordinal"] != 3
        or selected["substepsPerOutputInterval"] != SELECTED_SUBSTEPS
    ):
        _fail("g2b_m4_selected_observation_invalid")
    return selected


def _replay_selected_center(m2, engine, variables, rows, expected) -> dict[str, object]:
    mesh = engine._output_mesh_binary64()
    jet = m2._center_jet(mesh, rows, variables[1])
    residual = m2._center_residual(jet, variables[1])
    observed = {
        "centerNormalizedResidualExact": m2._fraction_record(residual),
        "jet": [m2._dyadic(value) for value in jet],
        "ordinal": 3,
        "substepsPerOutputInterval": SELECTED_SUBSTEPS,
    }
    if _canonical(observed) != _canonical(expected):
        _fail("g2b_m4_selected_center_replay_mismatch")
    return observed


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
        _fail("g2b_m4_output_collision")
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    m3 = _load_m3()
    m3_receipt = _verify_m3_receipt(m3)
    m2 = m3._load_module(
        m3.M2_SOURCE_PATH,
        "g2b_m4_m2",
        m3.M2_SOURCE_SIZE_BYTES,
        m3.M2_SOURCE_SHA256,
    )
    engine = m2._load_engine()
    stage = "runtime_admission"
    completed = []
    selected_center_replay = None
    projection_records = None
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
            fine_rows = engine._materialize_state_rows(fine, SOLVE_REFINEMENTS[1])
            completed.append({"chronology": list(fine_chronology), "ordinal": 1})
            stage = "cross_refinement"
            maximum_difference, richardson = engine._compare_refinements(
                coarse, fine, coarse_rows, fine_rows
            )
            matching = m2._screen_solution(engine, fine, fine_rows)
            stage = "full_selected_materialization"
            selected_rows = _materialize_full(engine, fine)
            stage = "selected_center_replay"
            selected_center_replay = _replay_selected_center(
                m2,
                engine,
                fine,
                selected_rows,
                _selected_observation(m3_receipt),
            )
            stage = "projection_ladder"
            projection_records, selected_mode = m2._projection_ladder(
                engine, fine, selected_rows
            )
        decision = (
            "MPFR_PROJECTION_SELECTED"
            if selected_mode is not None
            else "MPFR_PROJECTION_FAILED"
        )
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m4_projection",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "completedSolveRefinements": completed,
            "decision": decision,
            "m3ReceiptSha256": M3_RECEIPT_SELF_SHA256,
            "maximumCrossRefinementDifference": m2._dyadic(maximum_difference),
            "maximumMatchingResidual": m2._dyadic(matching),
            "noCandidateSolve": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "projectionRecords": projection_records,
            "richardsonEstimate": m2._dyadic(richardson),
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
            "runtimeBinding": runtime,
            "selectedCenterReplay": selected_center_replay,
            "selectedModeCount": selected_mode,
            "selectedSubstepsPerOutputInterval": SELECTED_SUBSTEPS,
        }
    except Exception as error:
        if isinstance(
            error,
            (
                G2BM4Error,
                m3.G2BM3Error,
                m2.G2BM2Error,
                engine.G2BM1ImplementationBlocked,
            ),
        ):
            code = error.code
            detail = error.detail
        else:
            code = "g2b_m4_untyped_exception"
            detail = type(error).__name__
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m4_projection",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "completedSolveRefinements": completed,
            "decision": "MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED",
            "firstFailure": {"code": code, "detail": detail, "stage": stage},
            "m3ReceiptSha256": M3_RECEIPT_SELF_SHA256,
            "noCandidateSolve": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "projectionRecords": projection_records,
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
            "selectedCenterReplay": selected_center_replay,
            "selectedSubstepsPerOutputInterval": SELECTED_SUBSTEPS,
        }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    _exclusive_write(OUTPUT_PATH, _canonical(full))
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m4_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if (
    SELECTED_SUBSTEPS != 256
    or SOLVE_REFINEMENTS != (4, 8)
    or MODE_COUNTS != (128, 256, 512)
):
    raise RuntimeError("g2b_m4_static_invariant")


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
