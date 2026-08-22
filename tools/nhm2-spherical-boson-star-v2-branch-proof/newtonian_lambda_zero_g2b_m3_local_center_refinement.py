"""One-shot fixed local-center refinement ladder for G2B-M3.

Program gate: G2B-M3 — fixed local-center refinement ladder
Workstream: lambda-zero center recovery
Capability or component: MPFR256 prefix integration and exact local jet
Current maturity: private preregistered one-shot implementation
Target maturity: immutable selected center or terminal convergence falsifier
Required frozen inputs: M1 engine, M2 receipt/source, M2-R1 review, M3 packet
Required evidence: four jets/residuals and three adjacent comparisons
Stop/fail criteria: one execution; all ordinals fixed; no retry or retune
Explicit non-goals: projection, changed rail/point/ODE, or authority promotion
Downstream gate unlocked: MPFR-native projection successor after exact pass
"""

from __future__ import annotations

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
    / "nhm2-spherical-boson-star-v2-g2b-m3-local-center-refinement.md"
)
PACKET_SHA256: Final[str] = (
    "2eb9afaf3ad87a7f8baa658fdce5bb58329c35c3f58ffb071e4a05644a1c516e"
)
PACKET_SIZE_BYTES: Final[int] = 2_279
REVIEW_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m2-r1-review-result.md"
)
REVIEW_SHA256: Final[str] = (
    "e6c18b093c66d3c2147005f7cbe159c5921cab35d45671091f5e488c63f929c6"
)
REVIEW_SIZE_BYTES: Final[int] = 2_487
M2_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m2_mpfr_native_proof_representation.py"
)
M2_SOURCE_SHA256: Final[str] = (
    "8d6bf64423005a007257c2e6d1f64011eead9f02b65bb5401712205a60288f99"
)
M2_SOURCE_SIZE_BYTES: Final[int] = 29_644
M2_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m2-mpfr-native-proof-representation-v1.json"
)
M2_RECEIPT_RAW_SHA256: Final[str] = (
    "9ab9ef772af00e7d2b130eb3319058a70514389995fdda5099985b1088087df8"
)
M2_RECEIPT_SIZE_BYTES: Final[int] = 3_020
M2_RECEIPT_SELF_SHA256: Final[str] = (
    "bd0dcd77a870c412d1211507be3ea56f8c7a3cf027125a84a158c16e873bc448"
)
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m3-local-center-refinement-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m3-local-center-refinement/v1\n"
)

POINT_X: Final[Fraction] = Fraction(1, 128)
MARGIN: Final[Fraction] = Fraction(1, 4 * 10**10)
SOLVE_REFINEMENTS: Final[tuple[int, ...]] = (4, 8)
LOCAL_REFINEMENTS: Final[tuple[int, ...]] = (32, 64, 128, 256)
POINT_INTERVAL_ORDINAL: Final[int] = 80
JET_AGREEMENT_LIMIT: Final[Fraction] = Fraction(1, 2**60)
AUTHORITY_NAMES: Final[tuple[str, ...]] = (
    "candidateAuthority",
    "proofAuthority",
    "executionAuthority",
    "diagnosticLampAuthority",
    "physicalAuthority",
    "propulsionAuthority",
    "transportAuthority",
)


class G2BM3Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM3Error(code, detail)


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
        _fail("g2b_m3_static_binding_drift", label)
    return raw


def _load_module(path: Path, name: str, size: int, digest: str):
    _verify(path, size, digest, name)
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        _fail("g2b_m3_module_spec_unavailable", name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _verify_m2_receipt(m2) -> dict[str, object]:
    raw = _verify(
        M2_RECEIPT_PATH,
        M2_RECEIPT_SIZE_BYTES,
        M2_RECEIPT_RAW_SHA256,
        "m2_receipt",
    )
    root = json.loads(raw)
    if type(root) is not dict or root.get("receiptSha256") != M2_RECEIPT_SELF_SHA256:
        _fail("g2b_m3_m2_receipt_invalid")
    unsigned = dict(root)
    expected = unsigned.pop("receiptSha256")
    observed = _sha256(
        m2.RECEIPT_DOMAIN
        + struct.pack("<Q", len(_canonical(unsigned)))
        + _canonical(unsigned)
    )
    if (
        observed != expected
        or root.get("decision") != "MPFR_NATIVE_SOLVE_OR_REFINEMENT_FAILED"
        or root.get("firstFailure", {}).get("code")
        != "g2b_m2_center_refinement_disagreement"
    ):
        _fail("g2b_m3_m2_receipt_invalid")
    return root


def _partial_rows(engine, variables: Sequence[object], substeps: int):
    if substeps not in LOCAL_REFINEMENTS:
        _fail("g2b_m3_local_refinement_not_frozen")
    _vc, nu = variables[:2]
    origin, _unused_vc, _unused_nu = engine._origin_jet(*variables[:2])
    mesh = engine._output_mesh_binary64()
    current = tuple(origin)
    rows: list[list[object]] = [[value] for value in origin]
    for ordinal in range(POINT_INTERVAL_ORDINAL + 1):
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
    expected = POINT_INTERVAL_ORDINAL + 2
    if any(len(row) != expected for row in rows):
        _fail("g2b_m3_partial_state_shape")
    return mesh[:expected], tuple(tuple(row) for row in rows)


def _comparison_records(m2, observations):
    records = []
    selected = None
    for ordinal in range(len(observations) - 1):
        coarse = observations[ordinal]
        fine = observations[ordinal + 1]
        maximum = max(
            m2._normalized_difference(left, right)
            for left, right in zip(coarse["jet"], fine["jet"], strict=True)
        )
        eligible = (
            maximum <= JET_AGREEMENT_LIMIT
            and coarse["residual"] <= MARGIN
            and fine["residual"] <= MARGIN
        )
        if eligible and selected is None:
            selected = fine["substeps"]
        records.append(
            {
                "coarseSubsteps": coarse["substeps"],
                "eligible": eligible,
                "fineSubsteps": fine["substeps"],
                "maximumNormalizedJetDifferenceExact": m2._fraction_record(maximum),
                "ordinal": ordinal,
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
        _fail("g2b_m3_output_collision")
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    _verify(REVIEW_PATH, REVIEW_SIZE_BYTES, REVIEW_SHA256, "review")
    m2 = _load_module(
        M2_SOURCE_PATH,
        "g2b_m3_m2",
        M2_SOURCE_SIZE_BYTES,
        M2_SOURCE_SHA256,
    )
    _verify_m2_receipt(m2)
    engine = m2._load_engine()
    stage = "runtime_admission"
    completed = []
    observations = []
    comparisons = []
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
            stage = "local_center_ladder"
            for ordinal, substeps in enumerate(LOCAL_REFINEMENTS):
                mesh, rows = _partial_rows(engine, fine, substeps)
                jet = m2._center_jet(mesh, rows, fine[1])
                residual = m2._center_residual(jet, fine[1])
                observations.append(
                    {
                        "jet": jet,
                        "ordinal": ordinal,
                        "residual": residual,
                        "substeps": substeps,
                    }
                )
            comparisons, selected = _comparison_records(m2, observations)
        decision = (
            "MPFR_LOCAL_CENTER_SELECTED"
            if selected is not None
            else "MPFR_LOCAL_CENTER_CONVERGENCE_FAILED"
        )
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m3_local_center",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "centerObservations": [
                {
                    "centerNormalizedResidualExact": m2._fraction_record(
                        observation["residual"]
                    ),
                    "jet": [m2._dyadic(value) for value in observation["jet"]],
                    "ordinal": observation["ordinal"],
                    "substepsPerOutputInterval": observation["substeps"],
                }
                for observation in observations
            ],
            "completedSolveRefinements": completed,
            "decision": decision,
            "localComparisonRecords": comparisons,
            "maximumCrossRefinementDifference": m2._dyadic(maximum_difference),
            "maximumMatchingResidual": m2._dyadic(matching),
            "m2ReceiptSha256": M2_RECEIPT_SELF_SHA256,
            "noCandidateSolve": True,
            "noProjection": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "reviewRawSha256": REVIEW_SHA256,
            "richardsonEstimate": m2._dyadic(richardson),
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
            "runtimeBinding": runtime,
            "selectedSubstepsPerOutputInterval": selected,
        }
    except Exception as error:
        if isinstance(
            error,
            (G2BM3Error, m2.G2BM2Error, engine.G2BM1ImplementationBlocked),
        ):
            code = error.code
            detail = error.detail
        else:
            code = "g2b_m3_untyped_exception"
            detail = type(error).__name__
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m3_local_center",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "centerObservations": [
                {
                    "centerNormalizedResidualExact": m2._fraction_record(
                        observation["residual"]
                    ),
                    "jet": [m2._dyadic(value) for value in observation["jet"]],
                    "ordinal": observation["ordinal"],
                    "substepsPerOutputInterval": observation["substeps"],
                }
                for observation in observations
            ],
            "completedSolveRefinements": completed,
            "decision": "MPFR_LOCAL_CENTER_SOLVE_FAILED",
            "firstFailure": {"code": code, "detail": detail, "stage": stage},
            "localComparisonRecords": comparisons,
            "m2ReceiptSha256": M2_RECEIPT_SELF_SHA256,
            "noCandidateSolve": True,
            "noProjection": True,
            "noRetune": True,
            "packetRawSha256": PACKET_SHA256,
            "reviewRawSha256": REVIEW_SHA256,
            "runnerSourceRawSha256": _sha256(Path(__file__).read_bytes()),
        }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned)
    _exclusive_write(OUTPUT_PATH, _canonical(full))
    return full["receiptSha256"]


def _main(arguments: list[str]) -> int:
    if arguments != ["--execute-once"]:
        _fail("g2b_m3_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if (
    SOLVE_REFINEMENTS != (4, 8)
    or LOCAL_REFINEMENTS != (32, 64, 128, 256)
    or POINT_INTERVAL_ORDINAL != 80
    or JET_AGREEMENT_LIMIT != Fraction(1, 2**60)
    or MARGIN != Fraction(1, 4 * 10**10)
):
    raise RuntimeError("g2b_m3_static_invariant")


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
