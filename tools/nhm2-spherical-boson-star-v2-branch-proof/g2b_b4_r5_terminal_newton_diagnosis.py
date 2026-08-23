"""Read-only diagnosis of the immutable B4-R4 N=64 Newton endpoint.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: terminal residual/Jacobian/Armijo diagnosis
Current maturity: preregistered authority-neutral diagnostic
Target maturity: independently audited mechanism and successor decision
Required frozen inputs: exact B4-R4 endpoint, evaluator, grid, LU and policy
Required evidence: endpoint replay, row ranks, LU proxies, 25 trials and receipt
Stop/fail criteria: first binding, replay, solve, trial, persistence or audit error
Explicit non-goals: continuation/Newton execution, retry, retune or authority
Downstream gate unlocked: at most one separately versioned proposal if supported
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import platform
import stat
import struct
import sys
from typing import Final, NoReturn


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
BRANCH_ROOT: Final[Path] = ROOT / "tools/nhm2-spherical-boson-star-branch"
PACKET: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r5-terminal-newton-diagnosis.md"
CHECKPOINT: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r5-execution-checkpoint.md"
TEST_PATH: Final[Path] = Path(__file__).with_name("test_g2b_b4_r5_terminal_newton_diagnosis.py")
PACKET_SIZE: Final[int] = 6_986
PACKET_SHA256: Final[str] = "ca29bf1462524800db82372ccf7f40c2d603e94d83d788664df50eae47b11a45"
B4_ROOT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1"
OUTPUT_ROOT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1"
OUTPUT_PATH: Final[Path] = OUTPUT_ROOT / "receipt.json"
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
IMAGE_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R5_EXECUTION_TOKEN"
RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r5-terminal-newton-diagnosis/v1\n"
PREEXECUTION_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-preexecution-binding/v1\n"
TERMINAL_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"
TARGET_AMPLITUDE: Final[float] = 2.0**-16
ARMIJO_C: Final[float] = 2.0**-12
RESIDUAL_THRESHOLD: Final[float] = 2.0**-40
STEP_THRESHOLD: Final[float] = 2.0**-42
MAX_BACKTRACK_EXPONENT: Final[int] = 24

FROZEN_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("packet", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r5-terminal-newton-diagnosis.md", PACKET_SIZE, PACKET_SHA256),
    ("b4_r4_preexecution", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/preexecution-binding.json", 7_580, "58e17389d77c136331c7fcbc2a03d9a6cf875d181cff8086ee17f0338f6302c3"),
    ("b4_r4_stage_state", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le", 1_544, "972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c"),
    ("b4_r4_stage_metadata", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00.json", 831, "08309d40bd590996ba976839abeacbf2b492e2af03d49014ee55c7acb09bd1c2"),
    ("b4_r4_level_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/level-receipt.json", 1_414, "d45e7e730e1775e834303ccb40518f4bbbb7448946c988b83ba35ac06bc81ef5"),
    ("b4_r4_terminal_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/terminal-receipt.json", 2_739, "4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204"),
    ("binary64_environment", "tools/nhm2-spherical-boson-star-branch/binary64_environment.py", 12_642, "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"),
    ("lobatto_grid", "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py", 6_704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
    ("compactified_system", "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py", 15_202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    ("collocation_state", "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py", 8_898, "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a"),
    ("radial_residual", "tools/nhm2-spherical-boson-star-branch/radial_residual.py", 10_222, "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205"),
    ("radial_residual_jacobian", "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py", 5_583, "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e"),
    ("deterministic_dense_lu", "tools/nhm2-spherical-boson-star-branch/deterministic_dense_lu.py", 8_033, "70b63cdf3517d0ae5f81217ca31d6d1d2a7450b76569e7693c3b8e9e59572ce2"),
    ("deterministic_newton_policy", "tools/nhm2-spherical-boson-star-branch/deterministic_newton.py", 13_891, "60ad54e4376e43aa8c496e38fa9a495cab4d0a5001ca2515692a684889516618"),
)

AUTHORITY_LOCKS: Final[dict[str, bool]] = {
    "candidateAdmission": False, "vacuumContinuationAuthority": False,
    "proofAuthority": False, "executionAuthority": False,
    "execution68FileAuthority": False, "replayAuthority": False,
    "pairAgreementAuthority": False, "diagnosticLampAuthority": False,
    "theoryGraphAuthority": False, "jointGeometryStateAuthority": False,
    "physicalAuthority": False, "physicalViability": False,
    "propulsionAuthority": False, "transportAuthority": False,
}


class DiagnosisError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise DiagnosisError(code, detail)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _self_hash(value: dict[str, object], domain: bytes) -> str:
    raw = _canonical(value)
    return _sha(domain + struct.pack("<Q", len(raw)) + raw)


def _verify_file(path: Path, size: int, digest: str, label: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r5_input_read_failed", f"{label}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r5_input_not_ordinary", label)
    if len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r5_input_binding_drift", label)
    return raw


def _json(raw: bytes, label: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r5_json_invalid", f"{label}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b4_r5_json_noncanonical", label)
    return value


def _verify_checkpoint() -> dict[str, object]:
    try:
        raw = CHECKPOINT.read_bytes()
        text = raw.decode("utf-8")
        source = Path(__file__).read_bytes()
        tests = TEST_PATH.read_bytes()
    except (OSError, UnicodeDecodeError) as error:
        _fail("g2b_b4_r5_checkpoint_read_failed", type(error).__name__)
    required = (
        f"| diagnostic producer | {len(source):,} | `{_sha(source)}` |",
        f"| preexecution tests | {len(tests):,} | `{_sha(tests)}` |",
        PACKET_SHA256, IMAGE_ID, f"-e {TOKEN_ENV}={PACKET_SHA256}",
        f"-e {IMAGE_ENV}={IMAGE_ID}", "docker run --rm --network none",
        "The diagnostic command may run once.",
    )
    if any(item not in text for item in required):
        _fail("g2b_b4_r5_checkpoint_binding_invalid")
    return {"role": "execution_checkpoint", "path": CHECKPOINT.relative_to(ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha(raw)}


def _verify_closure() -> tuple[list[dict[str, object]], dict[str, object], dict[str, object], bytes]:
    bindings: list[dict[str, object]] = []
    raw_by_role: dict[str, bytes] = {}
    for role, relative, size, digest in FROZEN_BINDINGS:
        raw = _verify_file(ROOT / relative, size, digest, role)
        raw_by_role[role] = raw
        bindings.append({"role": role, "path": relative, "sizeBytes": size, "rawSha256": digest})
    bindings.append(_verify_checkpoint())
    pre = _json(raw_by_role["b4_r4_preexecution"], "preexecution")
    terminal = _json(raw_by_role["b4_r4_terminal_receipt"], "terminal")
    for value, domain, expected in (
        (pre, PREEXECUTION_DOMAIN, "f8e75820961d5812bb21d1d3fd23bc6720ec57a2b7472519b1857ff02bb8ba63"),
        (terminal, TERMINAL_DOMAIN, "361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28"),
    ):
        unsigned = dict(value)
        observed = unsigned.pop("receiptSha256", None)
        if observed != expected or observed != _self_hash(unsigned, domain):
            _fail("g2b_b4_r5_parent_self_hash_invalid")
    failure = terminal.get("firstFailure")
    if (
        terminal.get("status") != "FAIL"
        or terminal.get("decision") != "STOPPED_AT_FIRST_SOLVE_FAILURE"
        or failure != {"code": "armijo_schedule_exhausted_without_retry", "levelId": "L0", "nodeCount": 64, "stageIndex": 0}
        or terminal.get("attemptedLevelCount") != 1
        or terminal.get("allFourLevelsCompleted") is not False
        or terminal.get("allThreeAdjacentPairsEvaluated") is not False
        or terminal.get("noRetry") is not True
        or terminal.get("noRetune") is not True
        or not all(value is False for value in terminal.get("authorityLocks", {}).values())
    ):
        _fail("g2b_b4_r5_parent_semantics_invalid")
    metadata = _json(raw_by_role["b4_r4_stage_metadata"], "stage_metadata")
    level = _json(raw_by_role["b4_r4_level_receipt"], "level_receipt")
    if level.get("attemptedStageCount") != 1 or level.get("acceptedStageCount") != 0 or level.get("failureStageIndex") != 0:
        _fail("g2b_b4_r5_level_semantics_invalid")
    return bindings, terminal, metadata, raw_by_role["b4_r4_stage_state"]


def _row_label(ordinal: int) -> dict[str, object]:
    if ordinal == 192:
        return {"block": "amplitude", "kind": "varphi_origin_minus_target", "node": 0}
    block_index, local = divmod(ordinal, 64)
    block = ("F0", "F1", "varphi")[block_index]
    equation = ("Et_t", "Etheta_theta", "KG")[block_index]
    if local == 0:
        return {"block": block, "kind": "origin_derivative", "node": 0}
    if local == 63:
        return {"block": block, "kind": "infinity_value", "node": 63}
    return {"block": block, "kind": equation, "node": local}


def _rank(values: tuple[float, ...], unused: bool = False) -> list[dict[str, object]]:
    order = sorted(range(len(values)), key=lambda index: (-abs(values[index]), index))[:16]
    output: list[dict[str, object]] = []
    for index in order:
        item: dict[str, object] = {"ordinal": index, "absoluteBinary64Word": _word(abs(values[index])), "valueBinary64Word": _word(values[index])}
        if unused:
            item["node"] = index + 1
        else:
            item.update(_row_label(index))
        output.append(item)
    return output


def _factor_diagnostics(matrix: tuple[tuple[float, ...], ...]) -> dict[str, object]:
    order = len(matrix)
    lu = [list(row) for row in matrix]
    pivots: list[int] = []
    original_max = max(abs(value) for row in matrix for value in row)
    matrix_linf = max(math.fsum(abs(value) for value in row) for row in matrix)
    for step in range(order):
        pivot_row = step
        magnitude = abs(lu[step][step])
        for row in range(step + 1, order):
            candidate = abs(lu[row][step])
            if candidate > magnitude:
                magnitude, pivot_row = candidate, row
        if magnitude == 0.0 or not math.isfinite(magnitude):
            _fail("g2b_b4_r5_independent_factor_failed", str(step))
        pivots.append(pivot_row)
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = lu[row][step] / pivot
            if not math.isfinite(multiplier):
                _fail("g2b_b4_r5_independent_factor_nonfinite")
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                value = lu[row][column] - multiplier * lu[step][column]
                if not math.isfinite(value):
                    _fail("g2b_b4_r5_independent_factor_nonfinite")
                lu[row][column] = value
    diagonals = tuple(abs(lu[index][index]) for index in range(order))
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    return {
        "matrixInfinityNormBinary64Word": _word(matrix_linf),
        "originalMaximumAbsoluteEntryBinary64Word": _word(original_max),
        "uMaximumAbsoluteEntryBinary64Word": _word(u_max),
        "pivotGrowthBinary64Word": _word(u_max / original_max),
        "minimumAbsoluteUDiagonalBinary64Word": _word(min(diagonals)),
        "maximumAbsoluteUDiagonalBinary64Word": _word(max(diagonals)),
        "uDiagonalSpreadBinary64Word": _word(max(diagonals) / min(diagonals)),
        "pivotRows": pivots,
        "pivotRowsSha256": _sha(struct.pack(f"<{len(pivots)}H", *pivots)),
    }


def _l2(values: tuple[float, ...]) -> float:
    result = 0.0
    for value in values:
        result = math.hypot(result, value)
    return result


def _linf(values: tuple[float, ...]) -> float:
    return max(abs(value) for value in values)


def _mechanism_decision(triggers: dict[str, bool]) -> str:
    families: list[str] = []
    if triggers["BINARY64_TRIAL_STAGNATION"]:
        families.append("precision")
    if triggers["ARMIJO_GLOBALIZATION_CONFLICT"]:
        families.append("globalization")
    if triggers["NON_DESCENT_NEWTON_DIRECTION"] or triggers["UNUSED_CONSTRAINT_SEPARATION"]:
        families.append("formulation")
    if len(families) > 1:
        return "SEPARATE_BENCHMARKS_REQUIRED_BEFORE_SUCCESSOR"
    if families == ["formulation"]:
        return "FORMULATION_OR_DISCRETIZATION_REVIEW_REQUIRED"
    if families == ["precision"]:
        return "PRECISION_SUCCESSOR_PROPOSAL_SUPPORTED"
    if families == ["globalization"]:
        return "GLOBALIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"
    return "NO_UNIQUE_SUCCESSOR_JUSTIFIED"


def _diagnose() -> dict[str, object]:
    bindings, terminal, metadata, state_raw = _verify_closure()
    if str(BRANCH_ROOT) not in sys.path:
        sys.path.insert(0, str(BRANCH_ROOT))
    from binary64_environment import nearest_binary64
    from deterministic_dense_lu import solve_deterministic_dense_lu
    from radial_collocation_interior import RadialCollocationState
    from radial_compactified_system import evaluate_spherical_radial_compactified_system
    from radial_lobatto_grid import generate_compactified_lobatto_grid

    @nearest_binary64
    def calculate() -> dict[str, object]:
        values = struct.unpack("<193d", state_raw)
        state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
        grid = generate_compactified_lobatto_grid(64).differentiation
        assembly = evaluate_spherical_radial_compactified_system(grid=grid, state=state, origin_amplitude=TARGET_AMPLITUDE)
        residual = assembly.solved_residual
        jacobian = assembly.jacobian
        unused = assembly.unused_constraint
        residual_linf = _linf(residual)
        unused_linf = _linf(unused)
        monotonic = all(state.varphi[index] >= state.varphi[index + 1] for index in range(63))
        if (
            _word(residual_linf) != metadata.get("newtonResidualLinfBinary64Word")
            or _word(unused_linf) != metadata.get("unusedConstraintLinfBinary64Word")
            or _word(state.varphi[0]) != metadata.get("originAmplitudeBinary64Word")
            or _word(state.w) != metadata.get("wBinary64Word")
            or all(value >= 0.0 for value in state.varphi) is not metadata.get("varphiNodesNonnegative")
            or all(value > 0.0 for value in state.varphi[:-1]) is not metadata.get("varphiFiniteNodesStrictlyPositive")
            or monotonic is not metadata.get("varphiNodesNonincreasing")
        ):
            _fail("g2b_b4_r5_endpoint_replay_mismatch")

        rhs = tuple(-value if value != 0.0 else 0.0 for value in residual)
        solved = solve_deterministic_dense_lu(matrix=jacobian, rhs=rhs)
        direction = solved.solution
        factor = _factor_diagnostics(jacobian)
        matrix_norm = struct.unpack(">d", bytes.fromhex(factor["matrixInfinityNormBinary64Word"]))[0]
        condition_lower = matrix_norm * _linf(direction) / residual_linf
        jp = tuple(math.fsum(row[column] * direction[column] for column in range(193)) for row in jacobian)
        directional_slope = math.fsum(residual[index] * jp[index] for index in range(193))
        current_merit = _l2(residual)
        trials: list[dict[str, object]] = []
        merit_words: list[str | None] = []
        for exponent in range(MAX_BACKTRACK_EXPONENT + 1):
            alpha = 2.0**-exponent
            trial = tuple(values[index] + alpha * direction[index] for index in range(193))
            scaled_step = _linf(tuple(abs(alpha * direction[index]) / max(1.0, abs(trial[index])) for index in range(193)))
            item: dict[str, object] = {"exponent": exponent, "alphaBinary64Word": _word(alpha), "scaledStepLinfBinary64Word": _word(scaled_step), "wBinary64Word": _word(trial[-1])}
            if not all(math.isfinite(value) for value in trial) or not 0.0 < trial[-1] < 1.0:
                item["classification"] = "DOMAIN_REJECTED"
                item["trialMeritBinary64Word"] = None
                merit_words.append(None)
                trials.append(item)
                continue
            identical = trial == values
            try:
                trial_state = RadialCollocationState(F0=trial[:64], F1=trial[64:128], varphi=trial[128:192], w=trial[192])
                trial_assembly = evaluate_spherical_radial_compactified_system(grid=grid, state=trial_state, origin_amplitude=TARGET_AMPLITUDE)
                trial_merit = _l2(trial_assembly.solved_residual)
                trial_linf = _linf(trial_assembly.solved_residual)
            except ValueError:
                item["classification"] = "EVALUATION_REJECTED"
                item["trialMeritBinary64Word"] = None
                merit_words.append(None)
                trials.append(item)
                continue
            armijo_bound = (1.0 - ARMIJO_C * alpha) * current_merit
            stationary = identical and residual_linf <= RESIDUAL_THRESHOLD and scaled_step <= STEP_THRESHOLD
            acceptable = trial_merit <= armijo_bound or stationary
            item.update({"trialMeritBinary64Word": _word(trial_merit), "trialResidualLinfBinary64Word": _word(trial_linf), "armijoBoundBinary64Word": _word(armijo_bound), "meritRatioBinary64Word": _word(trial_merit / current_merit)})
            item["classification"] = "ARMIJO_ACCEPTABLE" if acceptable else ("STATE_IDENTICAL" if identical else "INSUFFICIENT_MERIT_DECREASE")
            merit_words.append(_word(trial_merit))
            trials.append(item)
        if any(item["classification"] == "ARMIJO_ACCEPTABLE" for item in trials):
            _fail("g2b_b4_r5_reconstruction_acceptable_trial")

        violations = [
            {"leftNode": index, "rightNode": index + 1, "leftBinary64Word": _word(state.varphi[index]), "rightBinary64Word": _word(state.varphi[index + 1]), "increaseBinary64Word": _word(state.varphi[index + 1] - state.varphi[index])}
            for index in range(63) if state.varphi[index] < state.varphi[index + 1]
        ]
        unused_max_index = min((index for index, value in enumerate(unused) if abs(value) == unused_linf), default=0)
        pivot_growth = struct.unpack(">d", bytes.fromhex(factor["pivotGrowthBinary64Word"]))[0]
        pivot_spread = struct.unpack(">d", bytes.fromhex(factor["uDiagonalSpreadBinary64Word"]))[0]
        final_four = merit_words[-4:]
        all_evaluable = all(item["classification"] not in {"DOMAIN_REJECTED", "EVALUATION_REJECTED"} for item in trials)
        any_identical = any(item["classification"] == "STATE_IDENTICAL" for item in trials)
        triggers = {
            "EXTREME_LINEAR_SENSITIVITY": condition_lower >= 2.0**40 or pivot_growth >= 2.0**20 or pivot_spread >= 2.0**40,
            "BINARY64_TRIAL_STAGNATION": any_identical or (all(value is not None for value in final_four) and len(set(final_four)) == 1),
            "UNUSED_CONSTRAINT_SEPARATION": unused_linf / residual_linf >= 2.0**20,
            "NODAL_MONOTONICITY_DEFECT": bool(violations),
            "NON_DESCENT_NEWTON_DIRECTION": directional_slope >= 0.0,
            "ARMIJO_GLOBALIZATION_CONFLICT": directional_slope < 0.0 and all_evaluable and not any_identical,
        }
        decision = _mechanism_decision(triggers)
        return {
            "sourceAndInputBindings": bindings,
            "parentTerminalReceiptSha256": terminal["receiptSha256"],
            "endpoint": {"nodeCount": 64, "unknownCount": 193, "targetAmplitudeBinary64Word": _word(TARGET_AMPLITUDE), "stateRawSha256": _sha(state_raw), "solvedResidualLinfBinary64Word": _word(residual_linf), "solvedResidualL2Binary64Word": _word(current_merit), "unusedConstraintLinfBinary64Word": _word(unused_linf), "wBinary64Word": _word(state.w)},
            "topSolvedResidualRows": _rank(residual),
            "topUnusedConstraintRows": _rank(unused, True),
            "linearizedSolve": {**factor, "directionLinfBinary64Word": _word(_linf(direction)), "directionRawSha256": _sha(struct.pack("<193d", *direction)), "solveResidualLinfBinary64Word": _word(solved.final_residual_linf), "conditionLowerBoundProxyBinary64Word": _word(condition_lower), "directionalSlopeBinary64Word": _word(directional_slope), "directionIsStrictDescent": directional_slope < 0.0, "refinementPasses": solved.refinement_passes},
            "armijoTrials": trials,
            "armijoTrialCount": 25,
            "armijoAcceptableTrialCount": 0,
            "monotonicityViolations": violations,
            "monotonicityViolationCount": len(violations),
            "unusedConstraintMaximum": {"ordinal": unused_max_index, "node": unused_max_index + 1, "valueBinary64Word": _word(unused[unused_max_index])},
            "mechanismTriggers": triggers,
            "decision": decision,
        }

    return calculate()


def execute_once() -> dict[str, object]:
    if os.environ.get(TOKEN_ENV) != PACKET_SHA256 or os.environ.get(IMAGE_ENV) != IMAGE_ID:
        _fail("g2b_b4_r5_execution_identity_invalid")
    if os.environ.get("PYTHONHASHSEED") != "0" or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1":
        _fail("g2b_b4_r5_python_environment_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or platform.libc_ver() != ("glibc", "2.36"):
        _fail("g2b_b4_r5_runtime_invalid")
    if Path.cwd().resolve() != ROOT.resolve():
        _fail("g2b_b4_r5_working_directory_invalid")
    if OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r5_output_root_not_fresh")
    result = _diagnose()
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r5_terminal_newton_diagnosis",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r5_terminal_newton_diagnosis/v1",
        "status": "PASS", "packetSha256": PACKET_SHA256, "runtimeImageId": IMAGE_ID,
        **result,
        "b4R4Retried": False, "continuationInvoked": False,
        "newtonChronologyInvoked": False, "trialAcceptedOrPersisted": False,
        "noRetune": True, "candidateAdmission": False,
        "vacuumWorkUnlocked": False, "authorityLocks": dict(AUTHORITY_LOCKS),
    }
    full = dict(unsigned)
    full["receiptSha256"] = _self_hash(unsigned, RECEIPT_DOMAIN)
    raw = _canonical(full)
    try:
        OUTPUT_ROOT.mkdir(mode=0o700)
        descriptor = os.open(OUTPUT_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
    except OSError as error:
        _fail("g2b_b4_r5_persistence_failed", type(error).__name__)
    readback = OUTPUT_PATH.read_bytes()
    if readback != raw or _json(readback, "readback") != full:
        _fail("g2b_b4_r5_readback_failed")
    return full


def _main(arguments: list[str]) -> int:
    if arguments:
        _fail("g2b_b4_r5_exact_command_required")
    try:
        receipt = execute_once()
    except DiagnosisError as error:
        print(_canonical({"status": "BLOCKED", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(receipt).decode("ascii"))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
