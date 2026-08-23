"""Run the sealed B4-R7 no-solve causal-interaction review once.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: scaling/boundary causal discriminator
Current maturity: preregistered authority-neutral scientific review
Target maturity: audited unique causal classification or unresolved stop
Required frozen inputs: B4-R4 state, B4-R6 receipt, evaluator/Jacobian/grid
Required evidence: controlled excisions, factor cells and constraint normalization
Stop/fail criteria: first binding, reconstruction, factor or persistence mismatch
Explicit non-goals: correction solve, Newton, continuation, trial, retry or retune
Downstream gate unlocked: at most one separately versioned proposal preparation
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
PACKET: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r7-causal-interaction-review.md"
CHECKPOINT: Final[Path] = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r7-execution-checkpoint.md"
TEST_PATH: Final[Path] = Path(__file__).with_name("test_g2b_b4_r7_causal_interaction_review.py")
PACKET_SIZE: Final[int] = 8_911
PACKET_SHA256: Final[str] = "a389dde8a2557d7da3290b2fe8b7a6ba6edb7d9edb0cd6d6e10e67df51647b4f"
STATE_PATH: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
R6_PATH: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1/receipt.json"
OUTPUT_ROOT: Final[Path] = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r7-causal-interaction-review-v1"
OUTPUT_PATH: Final[Path] = OUTPUT_ROOT / "receipt.json"
IMAGE_ID: Final[str] = "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1"
IMAGE_ENV: Final[str] = "NHM2_G2B_IMAGE_ID"
TOKEN_ENV: Final[str] = "NHM2_G2B_B4_R7_EXECUTION_TOKEN"
TARGET_AMPLITUDE: Final[float] = 2.0**-16
RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r7-causal-interaction-review/v1\n"
R6_RECEIPT_DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r6-mechanism-separation/v1\n"

FROZEN_BINDINGS: Final[tuple[tuple[str, str, int, str], ...]] = (
    ("packet", "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r7-causal-interaction-review.md", PACKET_SIZE, PACKET_SHA256),
    ("b4_r4_terminal_state", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le", 1_544, "972b05243ee51e7fa9c19a525e050f7302001c68a5187428ccff43a7aebf5d9c"),
    ("b4_r6_receipt", "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1/receipt.json", 12_503, "e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2"),
    ("binary64_environment", "tools/nhm2-spherical-boson-star-branch/binary64_environment.py", 12_642, "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47"),
    ("lobatto_grid", "tools/nhm2-spherical-boson-star-branch/radial_lobatto_grid.py", 6_704, "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385"),
    ("compactified_system", "tools/nhm2-spherical-boson-star-branch/radial_compactified_system.py", 15_202, "dafe134453b5a2a328fbe9088b4e85593e9ea4ee231923fec4024d2f67ebb905"),
    ("collocation_state", "tools/nhm2-spherical-boson-star-branch/radial_collocation_interior.py", 8_898, "253aee132897b6b11fa57df1b0864d9a821cc6dbce8b870dba3ab0e4f610290a"),
    ("radial_residual", "tools/nhm2-spherical-boson-star-branch/radial_residual.py", 10_222, "c22249155373344069772bfe2b4807385de6d7edc4454242d855b6f8611cd205"),
    ("radial_residual_jacobian", "tools/nhm2-spherical-boson-star-branch/radial_residual_jacobian.py", 5_583, "5464f2010e051cf2487fbdd9f6879b355d7e7ede47e6bd3ea245916781a1119e"),
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

INTERVENTIONS: Final[tuple[tuple[str, int | None], ...]] = (
    ("FULL", None), ("DROP_FIRST", 1), ("DROP_MIDDLE", 32), ("DROP_LAST", 62),
)


class ReviewError(RuntimeError):
    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}:{detail}" if detail else code)
        self.code = code
        self.detail = detail


def _fail(code: str, detail: str = "") -> NoReturn:
    raise ReviewError(code, detail)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _from_word(value: str) -> float:
    return struct.unpack(">d", bytes.fromhex(value))[0]


def _canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def _self_hash(value: dict[str, object], domain: bytes) -> str:
    raw = _canonical(value)
    return _sha(domain + struct.pack("<Q", len(raw)) + raw)


def _verify(path: Path, size: int, digest: str, role: str) -> bytes:
    try:
        metadata = path.lstat()
        raw = path.read_bytes()
    except OSError as error:
        _fail("g2b_b4_r7_input_read_failed", f"{role}:{type(error).__name__}")
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        _fail("g2b_b4_r7_input_not_ordinary", role)
    if len(raw) != size or _sha(raw) != digest:
        _fail("g2b_b4_r7_input_binding_drift", role)
    return raw


def _json(raw: bytes, role: str) -> dict[str, object]:
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        _fail("g2b_b4_r7_json_invalid", f"{role}:{type(error).__name__}")
    if type(value) is not dict or _canonical(value) != raw:
        _fail("g2b_b4_r7_json_noncanonical", role)
    return value


def _checkpoint_binding() -> dict[str, object]:
    try:
        raw = CHECKPOINT.read_bytes()
        text = raw.decode("utf-8")
        source = Path(__file__).read_bytes()
        tests = TEST_PATH.read_bytes()
    except (OSError, UnicodeDecodeError) as error:
        _fail("g2b_b4_r7_checkpoint_read_failed", type(error).__name__)
    required = (
        f"| review producer | {len(source):,} | `{_sha(source)}` |",
        f"| preexecution tests | {len(tests):,} | `{_sha(tests)}` |",
        PACKET_SHA256, IMAGE_ID, f"-e {TOKEN_ENV}={PACKET_SHA256}",
        f"-e {IMAGE_ENV}={IMAGE_ID}", "docker run --rm --network none",
        "The review command may run once.",
    )
    if any(item not in text for item in required):
        _fail("g2b_b4_r7_checkpoint_invalid")
    return {"role": "execution_checkpoint", "path": CHECKPOINT.relative_to(ROOT).as_posix(), "sizeBytes": len(raw), "rawSha256": _sha(raw)}


def _closure() -> tuple[list[dict[str, object]], bytes, dict[str, object]]:
    bindings: list[dict[str, object]] = []
    state_raw = b""
    r6: dict[str, object] = {}
    for role, relative, size, digest in FROZEN_BINDINGS:
        raw = _verify(ROOT / relative, size, digest, role)
        bindings.append({"role": role, "path": relative, "sizeBytes": size, "rawSha256": digest})
        if role == "b4_r4_terminal_state":
            state_raw = raw
        elif role == "b4_r6_receipt":
            r6 = _json(raw, role)
    unsigned = dict(r6)
    observed = unsigned.pop("receiptSha256", None)
    if observed != "0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001" or observed != _self_hash(unsigned, R6_RECEIPT_DOMAIN):
        _fail("g2b_b4_r7_parent_self_hash_invalid")
    if (
        r6.get("status") != "PASS"
        or r6.get("decision") != "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR"
        or r6.get("activeMechanismFamilies") != ["SCALING", "DISCRETIZATION"]
        or r6.get("mechanismTriggers") != {"COORDINATE_SEPARATION": False, "FIRST_NODE_SEPARATION": True, "PRECISION_SEPARATION": False, "SCALING_SEPARATION": True, "SPECTRAL_SEPARATION": False}
        or not all(value is False for value in r6.get("authorityLocks", {}).values())
    ):
        _fail("g2b_b4_r7_parent_semantics_invalid")
    bindings.append(_checkpoint_binding())
    return bindings, state_raw, r6


def _factor(matrix: tuple[tuple[float, ...], ...]) -> dict[str, object]:
    order = len(matrix)
    if order == 0 or any(len(row) != order for row in matrix):
        _fail("g2b_b4_r7_matrix_shape_invalid")
    lu = [list(row) for row in matrix]
    original_max = max(abs(value) for row in matrix for value in row)
    matrix_linf = max(math.fsum(abs(value) for value in row) for row in matrix)
    for step in range(order):
        pivot_row = max(range(step, order), key=lambda row: (abs(lu[row][step]), -row))
        if lu[pivot_row][step] == 0.0:
            _fail("g2b_b4_r7_zero_pivot", str(step))
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = lu[row][step] / pivot
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                lu[row][column] -= multiplier * lu[step][column]
    diagonal = tuple(abs(lu[index][index]) for index in range(order))
    if original_max == 0.0 or min(diagonal) == 0.0:
        _fail("g2b_b4_r7_singular_factor")
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    diagnostics = (matrix_linf, original_max, u_max / original_max, max(diagonal) / min(diagonal))
    if not all(math.isfinite(value) for value in diagnostics):
        _fail("g2b_b4_r7_nonfinite_factor")
    return {
        "matrixInfinityNormBinary64Word": _word(matrix_linf),
        "matrixMaximumBinary64Word": _word(original_max),
        "pivotGrowthBinary64Word": _word(u_max / original_max),
        "uDiagonalSpreadBinary64Word": _word(max(diagonal) / min(diagonal)),
    }


def _power_two_scale(maximum: float) -> float:
    if maximum == 0.0:
        return 1.0
    _fraction, exponent = math.frexp(maximum)
    return math.ldexp(1.0, -exponent)


def _equilibrate(matrix: tuple[tuple[float, ...], ...]):
    order = len(matrix)
    row_scales = tuple(_power_two_scale(max(abs(value) for value in row)) for row in matrix)
    row_scaled = tuple(tuple(row_scales[row] * value for value in matrix[row]) for row in range(order))
    column_scales = tuple(_power_two_scale(max(abs(row_scaled[row][column]) for row in range(order))) for column in range(order))
    output = tuple(tuple(row_scaled[row][column] * column_scales[column] for column in range(order)) for row in range(order))
    return output, row_scales, column_scales


def _excise(matrix: tuple[tuple[float, ...], ...], node: int | None) -> tuple[tuple[float, ...], ...]:
    if node is None:
        return matrix
    removed = {node, 64 + node, 128 + node}
    return tuple(tuple(value for column, value in enumerate(row) if column not in removed) for ordinal, row in enumerate(matrix) if ordinal not in removed)


def _median(values: tuple[float, ...]) -> float:
    ordered = sorted(values)
    return (ordered[30] + ordered[31]) / 2.0


def _ratio_record(values: tuple[float, ...]) -> dict[str, object]:
    if len(values) != 62 or any(not math.isfinite(value) or value < 0.0 for value in values):
        _fail("g2b_b4_r7_metric_stream_invalid")
    median = _median(values)
    if median <= 0.0:
        _fail("g2b_b4_r7_metric_median_invalid")
    ratio = values[0] / median
    if not math.isfinite(ratio):
        _fail("g2b_b4_r7_metric_ratio_invalid")
    return {
        "wordStreamSha256": _sha(struct.pack("<62d", *values)),
        "node1Binary64Word": _word(values[0]),
        "medianBinary64Word": _word(median),
        "node1ToMedianBinary64Word": _word(ratio),
    }


def _classification(predicates: dict[str, bool]) -> tuple[str, str | None]:
    boundary = predicates["FIRST_BLOCK_CONDITIONING_LEVERAGE"]
    robust = predicates["LOCALIZATION_ROBUST"]
    scaling = predicates["SCALING_MAIN_EFFECT"]
    absorbed = predicates["SCALING_ABSORBS_LOCALIZATION"] or predicates["LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION"]
    if boundary and robust:
        return "BOUNDARY_DISCRETIZATION_UPSTREAM", "BOUNDARY_FORMULATION_PROPOSAL"
    if scaling and not boundary and absorbed:
        return "SCALING_UPSTREAM_OF_APPARENT_LOCALIZATION", "EQUILIBRATED_SCALING_PROPOSAL"
    if scaling and not boundary and robust:
        return "INDEPENDENT_SCALING_AND_LOCALIZATION", "COMBINED_ORTHOGONAL_FORMULATION_PROPOSAL"
    return "CAUSAL_INTERACTION_UNRESOLVED_STOP", None


def _run_review() -> dict[str, object]:
    bindings, state_raw, r6 = _closure()
    if str(BRANCH_ROOT) not in sys.path:
        sys.path.insert(0, str(BRANCH_ROOT))
    from binary64_environment import nearest_binary64
    from radial_collocation_interior import RadialCollocationState
    from radial_compactified_system import evaluate_spherical_radial_compactified_system
    from radial_lobatto_grid import generate_compactified_lobatto_grid
    from radial_residual import RadialJet, evaluate_spherical_radial_residual

    @nearest_binary64
    def calculate() -> dict[str, object]:
        values = struct.unpack("<193d", state_raw)
        state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
        grid = generate_compactified_lobatto_grid(64).differentiation
        assembly = evaluate_spherical_radial_compactified_system(grid=grid, state=state, origin_amplitude=TARGET_AMPLITUDE)
        cells = []
        spreads: dict[str, tuple[float, float]] = {}
        full_column_scales: tuple[float, ...] = ()
        for identifier, node in INTERVENTIONS:
            matrix = _excise(assembly.jacobian, node)
            raw_factor = _factor(matrix)
            equilibrated, row_scales, column_scales = _equilibrate(matrix)
            equilibrated_factor = _factor(equilibrated)
            if identifier == "FULL":
                full_column_scales = column_scales
            raw_spread = _from_word(raw_factor["uDiagonalSpreadBinary64Word"])
            eq_spread = _from_word(equilibrated_factor["uDiagonalSpreadBinary64Word"])
            spreads[identifier] = (raw_spread, eq_spread)
            cells.append({
                "cellId": identifier, "deletedNode": node,
                "matrixOrder": len(matrix), "raw": raw_factor,
                "equilibrated": equilibrated_factor,
                "rowScaleMinimumBinary64Word": _word(min(row_scales)),
                "rowScaleMaximumBinary64Word": _word(max(row_scales)),
                "columnScaleMinimumBinary64Word": _word(min(column_scales)),
                "columnScaleMaximumBinary64Word": _word(max(column_scales)),
            })
        if len(full_column_scales) != 193:
            _fail("g2b_b4_r7_full_scale_missing")

        fields = (state.F0, state.F1, state.varphi)
        normalized = []
        for node in range(1, 63):
            rho = grid.rho[node]
            one_minus = 1.0 - rho
            x = rho / one_minus
            first_scale = one_minus * one_minus
            second_scale = first_scale * first_scale
            mixed_scale = -2.0 * one_minus * first_scale
            first = tuple(first_scale * value for value in grid.first_rho[node])
            second = tuple(second_scale * second_value + mixed_scale * first_value for first_value, second_value in zip(grid.first_rho[node], grid.second_rho[node], strict=True))
            jets = tuple(RadialJet(value=field[node], dx=math.fsum(first[column] * field[column] for column in range(64)), dxx=math.fsum(second[column] * field[column] for column in range(64))) for field in fields)
            point = evaluate_spherical_radial_residual(x=x, F0=jets[0], F1=jets[1], varphi=jets[2], w=state.w)
            if _word(point.unused_constraints[0]) != _word(assembly.unused_constraint[node - 1]):
                _fail("g2b_b4_r7_point_reconstruction_mismatch", str(node))
            normalized.append(abs(point.normalized_unused_constraints[0]))

        raw_values = tuple(abs(value) for value in assembly.unused_constraint)
        normalized_values = tuple(normalized)
        sensitivity_raw = []
        sensitivity_scaled = []
        for residual, gradient in zip(raw_values, assembly.unused_constraint_jacobian, strict=True):
            raw_denominator = max(abs(value) for value in gradient)
            scaled_denominator = max(abs(value * full_column_scales[column]) for column, value in enumerate(gradient))
            if raw_denominator <= 0.0 or scaled_denominator <= 0.0:
                _fail("g2b_b4_r7_sensitivity_denominator_invalid")
            sensitivity_raw.append(residual / raw_denominator)
            sensitivity_scaled.append(residual / scaled_denominator)

        metrics = {
            "rawUnusedConstraint": _ratio_record(raw_values),
            "termNormalizedUnusedConstraint": _ratio_record(normalized_values),
            "sensitivityRaw": _ratio_record(tuple(sensitivity_raw)),
            "sensitivityEquilibrated": _ratio_record(tuple(sensitivity_scaled)),
        }
        if metrics["rawUnusedConstraint"]["node1ToMedianBinary64Word"] != r6["firstInteriorConstraint"]["node1ToMedianBinary64Word"]:
            _fail("g2b_b4_r7_parent_localization_replay_mismatch")

        scaling_main = all(eq <= raw * 2.0**-10 and _from_word(cell["equilibrated"]["pivotGrowthBinary64Word"]) < 2.0**20 for cell, (raw, eq) in zip(cells, spreads.values(), strict=True))
        first_raw = spreads["DROP_FIRST"][0]
        boundary_leverage = first_raw <= spreads["FULL"][0] * 2.0**-10 and spreads["DROP_MIDDLE"][0] >= 4.0 * first_raw and spreads["DROP_LAST"][0] >= 4.0 * first_raw
        ratios = {name: _from_word(record["node1ToMedianBinary64Word"]) for name, record in metrics.items()}
        robust = all(value >= 2.0**4 for value in ratios.values())
        scaling_absorbs = ratios["rawUnusedConstraint"] >= 2.0**4 and ratios["sensitivityRaw"] >= 2.0**4 and ratios["sensitivityEquilibrated"] < 2.0**4 and ratios["sensitivityEquilibrated"] <= ratios["sensitivityRaw"] * 2.0**-4
        term_absorbs = ratios["rawUnusedConstraint"] >= 2.0**4 and ratios["termNormalizedUnusedConstraint"] < 2.0**4 and ratios["termNormalizedUnusedConstraint"] <= ratios["rawUnusedConstraint"] * 2.0**-10
        predicates = {
            "SCALING_MAIN_EFFECT": scaling_main,
            "FIRST_BLOCK_CONDITIONING_LEVERAGE": boundary_leverage,
            "LOCALIZATION_ROBUST": robust,
            "SCALING_ABSORBS_LOCALIZATION": scaling_absorbs,
            "LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION": term_absorbs,
        }
        classification, proposal = _classification(predicates)
        return {
            "sourceAndInputBindings": bindings,
            "parentB4R6ReceiptSha256": r6["receiptSha256"],
            "interventionCells": cells,
            "constraintLocalization": metrics,
            "causalPredicates": predicates,
            "classification": classification,
            "proposalPreparationSupported": proposal is not None,
            "proposalClass": proposal,
        }

    return calculate()


def execute_once() -> dict[str, object]:
    if os.environ.get(TOKEN_ENV) != PACKET_SHA256 or os.environ.get(IMAGE_ENV) != IMAGE_ID:
        _fail("g2b_b4_r7_execution_identity_invalid")
    if os.environ.get("PYTHONHASHSEED") != "0" or os.environ.get("PYTHONDONTWRITEBYTECODE") != "1":
        _fail("g2b_b4_r7_python_environment_invalid")
    if sys.platform != "linux" or platform.machine() != "x86_64" or platform.libc_ver() != ("glibc", "2.36"):
        _fail("g2b_b4_r7_runtime_invalid")
    if Path.cwd().resolve() != ROOT.resolve() or OUTPUT_ROOT.exists() or OUTPUT_ROOT.is_symlink():
        _fail("g2b_b4_r7_output_boundary_invalid")
    result = _run_review()
    unsigned = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r7_causal_interaction_review",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r7_causal_interaction_review/v1",
        "status": "PASS", "packetSha256": PACKET_SHA256,
        "runtimeImageId": IMAGE_ID, **result,
        "candidateSolveInvoked": False, "linearCorrectionSolved": False,
        "newtonInvoked": False, "continuationInvoked": False,
        "armijoTrialEvaluated": False, "stateUpdateComputedOrPersisted": False,
        "b4R4Retried": False, "noRetune": True, "candidateAdmission": False,
        "vacuumWorkUnlocked": False, "authorityLocks": dict(AUTHORITY_LOCKS),
    }
    receipt = dict(unsigned)
    receipt["receiptSha256"] = _self_hash(unsigned, RECEIPT_DOMAIN)
    raw = _canonical(receipt)
    try:
        OUTPUT_ROOT.mkdir(mode=0o700)
        descriptor = os.open(OUTPUT_PATH, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(raw)
            handle.flush()
            os.fsync(handle.fileno())
    except OSError as error:
        _fail("g2b_b4_r7_persistence_failed", type(error).__name__)
    if OUTPUT_PATH.read_bytes() != raw or _json(raw, "generated") != receipt:
        _fail("g2b_b4_r7_readback_failed")
    return receipt


def _main(arguments: list[str]) -> int:
    if arguments:
        _fail("g2b_b4_r7_exact_command_required")
    try:
        receipt = execute_once()
    except ReviewError as error:
        print(_canonical({"status": "BLOCKED", "code": error.code, "detail": error.detail}).decode("ascii"))
        return 2
    print(_canonical(receipt).decode("ascii"))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv[1:]))
