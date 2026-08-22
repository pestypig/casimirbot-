"""One-shot tail-power API repair and unchanged projection for G2B-M5.

Program gate: G2B-M5 — sole tail exponent API repair and projection
Workstream: lambda-zero proof-center recovery
Capability or component: corrected tail evaluation plus unchanged M4 ladder
Current maturity: private preregistered one-shot implementation
Target maturity: passing projected core duty or terminal falsifier
Required frozen inputs: M4 receipt/source, M3 receipt, M2 codec, M1 engine
Required evidence: tail regression, exact center replay, every mode binding
Stop/fail criteria: one execution; sole repair only; no retry or retune
Explicit non-goals: mathematical, threshold, branch, or authority changes
Downstream gate unlocked: remaining G2B classical duties after exact pass
"""

from __future__ import annotations

import bisect
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
PACKET_PATH: Final[Path] = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2b-m5-tail-power-api-repair.md"
)
PACKET_SHA256: Final[str] = (
    "cba83258c91a95c48aa0eec400fe3045e0ec97bfbef3ddff4f93a2ec29e5d794"
)
PACKET_SIZE_BYTES: Final[int] = 1_974
M4_SOURCE_PATH: Final[Path] = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m4_mpfr_native_projection.py"
)
M4_SOURCE_SHA256: Final[str] = (
    "bc8789803aa6406464b977a777485848bf3f403dce53a89209acbdeb499c40ec"
)
M4_SOURCE_SIZE_BYTES: Final[int] = 13_066
M4_RECEIPT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m4-mpfr-native-projection-v1.json"
)
M4_RECEIPT_RAW_SHA256: Final[str] = (
    "6eb6e99806d91c02bfad8b89edf538b41ca8763ffe94e01e1244225f9c7501ed"
)
M4_RECEIPT_SIZE_BYTES: Final[int] = 6_232
M4_RECEIPT_SELF_SHA256: Final[str] = (
    "4bdccd085bb8f3efa67e3fa2123686347974c6c7798828e040ddbfc566bdc930"
)
OUTPUT_PATH: Final[Path] = (
    ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2b-m5-tail-power-api-repair-v1.json"
)
RECEIPT_DOMAIN: Final[bytes] = (
    b"nhm2-spherical-boson-star-v2/g2b-m5-tail-power-api-repair/v1\n"
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


class G2BM5Error(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise G2BM5Error(code, detail)


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
        _fail("g2b_m5_static_binding_drift", label)
    return raw


def _load_m4():
    _verify(M4_SOURCE_PATH, M4_SOURCE_SIZE_BYTES, M4_SOURCE_SHA256, "m4_source")
    spec = importlib.util.spec_from_file_location("g2b_m5_m4", M4_SOURCE_PATH)
    if spec is None or spec.loader is None:
        _fail("g2b_m5_m4_spec_unavailable")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _verify_m4_receipt(m4) -> dict[str, object]:
    raw = _verify(
        M4_RECEIPT_PATH,
        M4_RECEIPT_SIZE_BYTES,
        M4_RECEIPT_RAW_SHA256,
        "m4_receipt",
    )
    root = json.loads(raw)
    if type(root) is not dict or root.get("receiptSha256") != M4_RECEIPT_SELF_SHA256:
        _fail("g2b_m5_m4_receipt_invalid")
    unsigned = dict(root)
    expected = unsigned.pop("receiptSha256")
    payload = _canonical(unsigned)
    observed = _sha256(
        m4.RECEIPT_DOMAIN + struct.pack("<Q", len(payload)) + payload
    )
    failure = root.get("firstFailure")
    if (
        observed != expected
        or root.get("decision") != "MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED"
        or type(failure) is not dict
        or failure.get("stage") != "projection_ladder"
        or failure.get("detail") != "AttributeError"
        or root.get("projectionRecords") is not None
        or root.get("selectedCenterReplay") is None
    ):
        _fail("g2b_m5_m4_receipt_invalid")
    return root


def _tail_value(engine, u_boundary, mass, kappa, sigma, x, radius):
    ratio = x / radius
    u = u_boundary * engine.gmpy2.exp(-kappa * (x - radius))
    u *= ratio**sigma
    potential = -mass / x
    return u, potential


def _corrected_profile(m2, engine, variables, rows):
    mesh = tuple(
        engine.gmpy2.mpfr(value) for value in engine._output_mesh_binary64()
    )
    vc, nu = variables[:2]
    origin_u, origin_v = m2._origin_coefficients(engine, vc, nu)
    seconds = tuple(
        m2._mpfr_endpoint_seconds(
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
            return (
                m2._series(engine, origin_u, x),
                m2._series(engine, origin_v, x),
            )
        if x <= radius:
            right = bisect.bisect_left(mesh, x)
            if right < len(mesh) and mesh[right] == x:
                return rows[0][right], rows[2][right]
            if right == 0 or right >= len(mesh):
                _fail("g2b_m5_profile_interval_missing")
            left = right - 1
            return (
                m2._mpfr_quintic_value(
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
                m2._mpfr_quintic_value(
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
        return _tail_value(
            engine,
            rows[0][-1],
            mass,
            kappa,
            sigma,
            x,
            radius,
        )

    return profile, nu, rows


def _corrected_projection_ladder(m2, engine, variables, rows):
    profile, nu, state_rows = _corrected_profile(m2, engine, variables, rows)
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
        u_coefficients = m2._dct(
            engine, tuple(value[0] for value in samples)
        )
        v_coefficients = m2._dct(
            engine, tuple(value[1] for value in samples)
        )
        node_error = engine.gmpy2.mpfr(0)
        for coefficients, component in (
            (u_coefficients, 0),
            (v_coefficients, 1),
        ):
            for rho, sample in zip(rho_nodes, samples, strict=True):
                difference = abs(
                    m2._mpfr_evaluate(engine, coefficients, rho)
                    - sample[component]
                )
                node_error = max(
                    node_error, difference / (1 + abs(sample[component]))
                )
        join_rho = engine.gmpy2.mpfr(32) / 33
        join_error = max(
            abs(
                m2._mpfr_evaluate(engine, u_coefficients, join_rho)
                - state_rows[0][-1]
            ),
            abs(
                m2._mpfr_evaluate(engine, v_coefficients, join_rho)
                - state_rows[2][-1]
            ),
        )
        endpoint_error = max(
            abs(m2._mpfr_evaluate(engine, u_coefficients, engine.gmpy2.mpfr(0)) - 1),
            abs(
                m2._mpfr_evaluate(engine, v_coefficients, engine.gmpy2.mpfr(0))
                - variables[0]
            ),
            abs(m2._mpfr_evaluate(engine, u_coefficients, engine.gmpy2.mpfr(1))),
            abs(m2._mpfr_evaluate(engine, v_coefficients, engine.gmpy2.mpfr(1))),
        )
        residual = m2._projected_residual(u_coefficients, v_coefficients, nu)
        eligible = (
            residual <= m2.MARGIN
            and node_error <= engine.gmpy2.exp2(m2.NODE_LIMIT_EXPONENT)
            and join_error <= engine.gmpy2.exp2(m2.JOIN_LIMIT_EXPONENT)
            and endpoint_error <= engine.gmpy2.exp2(m2.ENDPOINT_LIMIT_EXPONENT)
        )
        if eligible and selected is None:
            selected = count
        records.append(
            {
                "eligible": eligible,
                "endpointError": m2._dyadic(endpoint_error),
                "joinError": m2._dyadic(join_error),
                "modeCount": count,
                "nodeError": m2._dyadic(node_error),
                "ordinal": ordinal,
                "projectedNormalizedResidualExact": m2._fraction_record(residual),
                "uCoefficientBinding": m2._coefficient_binding(u_coefficients),
                "vCoefficientBinding": m2._coefficient_binding(v_coefficients),
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
        _fail("g2b_m5_output_collision")
    _verify(PACKET_PATH, PACKET_SIZE_BYTES, PACKET_SHA256, "packet")
    m4 = _load_m4()
    _verify_m4_receipt(m4)
    m3 = m4._load_m3()
    m3_receipt = m4._verify_m3_receipt(m3)
    m2 = m3._load_module(
        m3.M2_SOURCE_PATH,
        "g2b_m5_m2",
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
            selected_rows = m4._materialize_full(engine, fine)
            stage = "selected_center_replay"
            selected_center_replay = m4._replay_selected_center(
                m2,
                engine,
                fine,
                selected_rows,
                m4._selected_observation(m3_receipt),
            )
            stage = "projection_ladder"
            projection_records, selected_mode = _corrected_projection_ladder(
                m2, engine, fine, selected_rows
            )
        decision = (
            "MPFR_PROJECTION_SELECTED"
            if selected_mode is not None
            else "MPFR_PROJECTION_FAILED"
        )
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m5_projection",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "completedSolveRefinements": completed,
            "decision": decision,
            "m3ReceiptSha256": m4.M3_RECEIPT_SELF_SHA256,
            "m4ReceiptSha256": M4_RECEIPT_SELF_SHA256,
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
        known = (
            G2BM5Error,
            m4.G2BM4Error,
            m3.G2BM3Error,
            m2.G2BM2Error,
            engine.G2BM1ImplementationBlocked,
        )
        if isinstance(error, known):
            code = error.code
            detail = error.detail
        else:
            code = "g2b_m5_untyped_exception"
            detail = type(error).__name__
        unsigned = {
            "artifactId": "nhm2.spherical_boson_star_v2.g2b_m5_projection",
            "authorityLocks": {name: False for name in AUTHORITY_NAMES},
            "completedSolveRefinements": completed,
            "decision": "MPFR_PROJECTION_SOLVE_OR_REPLAY_FAILED",
            "firstFailure": {"code": code, "detail": detail, "stage": stage},
            "m3ReceiptSha256": m4.M3_RECEIPT_SELF_SHA256,
            "m4ReceiptSha256": M4_RECEIPT_SELF_SHA256,
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
        _fail("g2b_m5_exact_command_required")
    sys.stdout.write(execute_once() + "\n")
    return 0


if (
    SELECTED_SUBSTEPS != 256
    or SOLVE_REFINEMENTS != (4, 8)
    or MODE_COUNTS != (128, 256, 512)
):
    raise RuntimeError("g2b_m5_static_invariant")


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
