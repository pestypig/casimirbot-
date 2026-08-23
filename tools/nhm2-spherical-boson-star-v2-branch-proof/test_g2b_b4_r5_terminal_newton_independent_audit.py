"""Producer-independent audit of the sole B4-R5 diagnosis receipt."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import stat
import struct
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
BRANCH = ROOT / "tools/nhm2-spherical-boson-star-branch"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r5-terminal-newton-diagnosis-v1"
RECEIPT_PATH = OUTPUT / "receipt.json"
STATE_PATH = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r5-terminal-newton-diagnosis/v1\n"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def word(value: float) -> str:
    return struct.pack(">d", value).hex()


def from_word(value: str) -> float:
    return struct.unpack(">d", bytes.fromhex(value))[0]


def linf(values: tuple[float, ...]) -> float:
    return max(abs(value) for value in values)


def row_label(ordinal: int) -> dict[str, object]:
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


def rank(values: tuple[float, ...], unused: bool = False) -> list[dict[str, object]]:
    order = sorted(range(len(values)), key=lambda index: (-abs(values[index]), index))[:16]
    output: list[dict[str, object]] = []
    for index in order:
        item: dict[str, object] = {"ordinal": index, "absoluteBinary64Word": word(abs(values[index])), "valueBinary64Word": word(values[index])}
        if unused:
            item["node"] = index + 1
        else:
            item.update(row_label(index))
        output.append(item)
    return output


def factor(matrix: tuple[tuple[float, ...], ...]) -> dict[str, object]:
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
        assert magnitude > 0.0 and math.isfinite(magnitude)
        pivots.append(pivot_row)
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = lu[row][step] / pivot
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                lu[row][column] -= multiplier * lu[step][column]
    diagonals = tuple(abs(lu[index][index]) for index in range(order))
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    return {
        "matrixInfinityNormBinary64Word": word(matrix_linf),
        "originalMaximumAbsoluteEntryBinary64Word": word(original_max),
        "uMaximumAbsoluteEntryBinary64Word": word(u_max),
        "pivotGrowthBinary64Word": word(u_max / original_max),
        "minimumAbsoluteUDiagonalBinary64Word": word(min(diagonals)),
        "maximumAbsoluteUDiagonalBinary64Word": word(max(diagonals)),
        "uDiagonalSpreadBinary64Word": word(max(diagonals) / min(diagonals)),
        "pivotRows": pivots,
        "pivotRowsSha256": sha(struct.pack(f"<{len(pivots)}H", *pivots)),
    }


class G2BB4R5IndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        metadata = RECEIPT_PATH.lstat()
        cls.raw = RECEIPT_PATH.read_bytes()
        assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
        cls.receipt = json.loads(cls.raw)
        assert canonical(cls.receipt) == cls.raw

    def test_exact_inventory_raw_hash_and_self_hash(self) -> None:
        self.assertEqual({path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file()}, {"receipt.json"})
        self.assertEqual((len(self.raw), sha(self.raw)), (20_509, "645073d238da325db5e727825fcdf4705a08d5e7ae6951be5616d9cc6826fb52"))
        unsigned = dict(self.receipt)
        observed = unsigned.pop("receiptSha256")
        encoded = canonical(unsigned)
        expected = sha(DOMAIN + struct.pack("<Q", len(encoded)) + encoded)
        self.assertEqual(observed, expected)
        self.assertEqual(observed, "0cfb59144cf29beb0da94852ee872455a56017cbe3fc690fd6cb24cd401ea406")

    def test_all_source_and_input_bindings_reopen(self) -> None:
        for binding in self.receipt["sourceAndInputBindings"]:
            raw = (ROOT / binding["path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))
        self.assertEqual(self.receipt["parentTerminalReceiptSha256"], "361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28")

    def test_independent_endpoint_linear_solve_and_factor_replay(self) -> None:
        if str(BRANCH) not in sys.path:
            sys.path.insert(0, str(BRANCH))
        from deterministic_dense_lu import solve_deterministic_dense_lu
        from radial_collocation_interior import RadialCollocationState
        from radial_compactified_system import evaluate_spherical_radial_compactified_system
        from radial_lobatto_grid import generate_compactified_lobatto_grid

        values = struct.unpack("<193d", STATE_PATH.read_bytes())
        state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
        grid = generate_compactified_lobatto_grid(64).differentiation
        assembly = evaluate_spherical_radial_compactified_system(grid=grid, state=state, origin_amplitude=2.0**-16)
        residual = assembly.solved_residual
        unused = assembly.unused_constraint
        solved = solve_deterministic_dense_lu(matrix=assembly.jacobian, rhs=tuple(-value if value else 0.0 for value in residual))
        direction = solved.solution
        observed = self.receipt["linearizedSolve"]
        self.assertEqual(sha(struct.pack("<193d", *direction)), observed["directionRawSha256"])
        self.assertEqual(word(linf(direction)), observed["directionLinfBinary64Word"])
        self.assertEqual(word(solved.final_residual_linf), observed["solveResidualLinfBinary64Word"])
        independent_factor = factor(assembly.jacobian)
        for key, value in independent_factor.items():
            self.assertEqual(value, observed[key], key)
        matrix_norm = from_word(independent_factor["matrixInfinityNormBinary64Word"])
        lower = matrix_norm * linf(direction) / linf(residual)
        self.assertEqual(word(lower), observed["conditionLowerBoundProxyBinary64Word"])
        jp = tuple(math.fsum(row[column] * direction[column] for column in range(193)) for row in assembly.jacobian)
        slope = math.fsum(residual[index] * jp[index] for index in range(193))
        self.assertEqual(word(slope), observed["directionalSlopeBinary64Word"])
        self.assertLess(slope, 0.0)
        self.assertEqual(rank(residual), self.receipt["topSolvedResidualRows"])
        self.assertEqual(rank(unused, True), self.receipt["topUnusedConstraintRows"])

        for trial in self.receipt["armijoTrials"]:
            exponent = trial["exponent"]
            alpha = 2.0**-exponent
            trial_values = tuple(values[index] + alpha * direction[index] for index in range(193))
            self.assertEqual(word(trial_values[-1]), trial["wBinary64Word"])
            self.assertGreaterEqual(trial_values[-1], 1.0)
            self.assertEqual(trial["classification"], "DOMAIN_REJECTED")
            self.assertIsNone(trial["trialMeritBinary64Word"])

    def test_monotonicity_trigger_and_decision_are_exact(self) -> None:
        values = struct.unpack("<193d", STATE_PATH.read_bytes())
        varphi = values[128:192]
        violations = [
            {"leftNode": index, "rightNode": index + 1, "leftBinary64Word": word(varphi[index]), "rightBinary64Word": word(varphi[index + 1]), "increaseBinary64Word": word(varphi[index + 1] - varphi[index])}
            for index in range(63) if varphi[index] < varphi[index + 1]
        ]
        self.assertEqual(violations, self.receipt["monotonicityViolations"])
        self.assertEqual(len(violations), 32)
        self.assertEqual(
            self.receipt["mechanismTriggers"],
            {"ARMIJO_GLOBALIZATION_CONFLICT": False, "BINARY64_TRIAL_STAGNATION": False, "EXTREME_LINEAR_SENSITIVITY": True, "NODAL_MONOTONICITY_DEFECT": True, "NON_DESCENT_NEWTON_DIRECTION": False, "UNUSED_CONSTRAINT_SEPARATION": False},
        )
        self.assertEqual(self.receipt["decision"], "NO_UNIQUE_SUCCESSOR_JUSTIFIED")

    def test_authority_and_mutation_locks(self) -> None:
        self.assertEqual(self.receipt["status"], "PASS")
        for key in ("b4R4Retried", "continuationInvoked", "newtonChronologyInvoked", "trialAcceptedOrPersisted", "candidateAdmission", "vacuumWorkUnlocked"):
            self.assertFalse(self.receipt[key])
        self.assertTrue(self.receipt["noRetune"])
        self.assertTrue(all(value is False for value in self.receipt["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
