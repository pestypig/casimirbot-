"""Producer-independent audit of the sole B4-R7 causal-review receipt."""

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
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r7-causal-interaction-review-v1"
RECEIPT_PATH = OUTPUT / "receipt.json"
STATE_PATH = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r7-causal-interaction-review/v1\n"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def word(value: float) -> str:
    return struct.pack(">d", value).hex()


def from_word(value: str) -> float:
    return struct.unpack(">d", bytes.fromhex(value))[0]


def factor(matrix: tuple[tuple[float, ...], ...]) -> dict[str, str]:
    order = len(matrix)
    lu = [list(row) for row in matrix]
    original_max = max(abs(value) for row in matrix for value in row)
    matrix_linf = max(math.fsum(abs(value) for value in row) for row in matrix)
    for step in range(order):
        pivot_row = step
        pivot_abs = abs(lu[step][step])
        for row in range(step + 1, order):
            candidate = abs(lu[row][step])
            if candidate > pivot_abs:
                pivot_abs, pivot_row = candidate, row
        assert pivot_abs > 0.0 and math.isfinite(pivot_abs)
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = lu[row][step] / pivot
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                lu[row][column] -= multiplier * lu[step][column]
    diagonal = tuple(abs(lu[index][index]) for index in range(order))
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    return {
        "matrixInfinityNormBinary64Word": word(matrix_linf),
        "matrixMaximumBinary64Word": word(original_max),
        "pivotGrowthBinary64Word": word(u_max / original_max),
        "uDiagonalSpreadBinary64Word": word(max(diagonal) / min(diagonal)),
    }


def power_scale(maximum: float) -> float:
    if maximum == 0.0:
        return 1.0
    _fraction, exponent = math.frexp(maximum)
    return math.ldexp(1.0, -exponent)


def equilibrate(matrix: tuple[tuple[float, ...], ...]):
    order = len(matrix)
    row_scales = tuple(power_scale(max(abs(value) for value in row)) for row in matrix)
    row_scaled = tuple(tuple(row_scales[row] * value for value in matrix[row]) for row in range(order))
    column_scales = tuple(power_scale(max(abs(row_scaled[row][column]) for row in range(order))) for column in range(order))
    balanced = tuple(tuple(row_scaled[row][column] * column_scales[column] for column in range(order)) for row in range(order))
    return balanced, row_scales, column_scales


def excise(matrix: tuple[tuple[float, ...], ...], node: int | None):
    if node is None:
        return matrix
    removed = {node, 64 + node, 128 + node}
    return tuple(tuple(value for column, value in enumerate(row) if column not in removed) for ordinal, row in enumerate(matrix) if ordinal not in removed)


def ratio_record(values: tuple[float, ...]) -> dict[str, object]:
    ordered = sorted(values)
    median = (ordered[30] + ordered[31]) / 2.0
    return {
        "wordStreamSha256": sha(struct.pack("<62d", *values)),
        "node1Binary64Word": word(values[0]),
        "medianBinary64Word": word(median),
        "node1ToMedianBinary64Word": word(values[0] / median),
    }


class G2BB4R7IndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        metadata = RECEIPT_PATH.lstat()
        cls.raw = RECEIPT_PATH.read_bytes()
        assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
        cls.receipt = json.loads(cls.raw)
        assert canonical(cls.receipt) == cls.raw
        if str(BRANCH) not in sys.path:
            sys.path.insert(0, str(BRANCH))
        from binary64_environment import nearest_binary64
        from radial_collocation_interior import RadialCollocationState
        from radial_compactified_system import evaluate_spherical_radial_compactified_system
        from radial_lobatto_grid import generate_compactified_lobatto_grid
        from radial_residual import RadialJet, evaluate_spherical_radial_residual

        @nearest_binary64
        def reconstruct():
            values = struct.unpack("<193d", STATE_PATH.read_bytes())
            state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
            grid = generate_compactified_lobatto_grid(64).differentiation
            assembly = evaluate_spherical_radial_compactified_system(grid=grid, state=state, origin_amplitude=2.0**-16)
            fields = (state.F0, state.F1, state.varphi)
            normalized = []
            for node in range(1, 63):
                rho = grid.rho[node]
                one_minus = 1.0 - rho
                first_scale = one_minus * one_minus
                second_scale = first_scale * first_scale
                mixed_scale = -2.0 * one_minus * first_scale
                first = tuple(first_scale * value for value in grid.first_rho[node])
                second = tuple(second_scale * d2 + mixed_scale * d1 for d1, d2 in zip(grid.first_rho[node], grid.second_rho[node], strict=True))
                jets = tuple(RadialJet(value=field[node], dx=math.fsum(first[column] * field[column] for column in range(64)), dxx=math.fsum(second[column] * field[column] for column in range(64))) for field in fields)
                point = evaluate_spherical_radial_residual(x=rho / one_minus, F0=jets[0], F1=jets[1], varphi=jets[2], w=state.w)
                assert word(point.unused_constraints[0]) == word(assembly.unused_constraint[node - 1])
                normalized.append(abs(point.normalized_unused_constraints[0]))
            return assembly, tuple(normalized)

        cls.assembly, cls.normalized = reconstruct()

    def test_exact_inventory_raw_hash_and_self_hash(self) -> None:
        inventory = {path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file()}
        self.assertEqual(inventory, {"receipt.json"})
        self.assertEqual((len(self.raw), sha(self.raw)), (7_325, "6164f02d0fd6a91606692e9a451f8bc26d3a38fe6b8ae1afff36463606d506ea"))
        unsigned = dict(self.receipt)
        observed = unsigned.pop("receiptSha256")
        encoded = canonical(unsigned)
        self.assertEqual(observed, sha(DOMAIN + struct.pack("<Q", len(encoded)) + encoded))
        self.assertEqual(observed, "c7547fb302f0e128bfce68faf7e60f87d9172715f392fcc0ca329e4f4d667ccb")

    def test_all_bindings_reopen_exactly(self) -> None:
        for binding in self.receipt["sourceAndInputBindings"]:
            raw = (ROOT / binding["path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))
        self.assertEqual(self.receipt["parentB4R6ReceiptSha256"], "0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001")

    def test_all_intervention_cells_replay(self) -> None:
        interventions = (("FULL", None), ("DROP_FIRST", 1), ("DROP_MIDDLE", 32), ("DROP_LAST", 62))
        for observed, (identifier, node) in zip(self.receipt["interventionCells"], interventions, strict=True):
            matrix = excise(self.assembly.jacobian, node)
            balanced, rows, columns = equilibrate(matrix)
            expected = {
                "cellId": identifier, "deletedNode": node, "matrixOrder": len(matrix),
                "raw": factor(matrix), "equilibrated": factor(balanced),
                "rowScaleMinimumBinary64Word": word(min(rows)), "rowScaleMaximumBinary64Word": word(max(rows)),
                "columnScaleMinimumBinary64Word": word(min(columns)), "columnScaleMaximumBinary64Word": word(max(columns)),
            }
            self.assertEqual(observed, expected)

    def test_constraint_normalizations_replay(self) -> None:
        raw_values = tuple(abs(value) for value in self.assembly.unused_constraint)
        _balanced, _rows, full_columns = equilibrate(self.assembly.jacobian)
        sensitivity_raw = []
        sensitivity_scaled = []
        for residual, gradient in zip(raw_values, self.assembly.unused_constraint_jacobian, strict=True):
            sensitivity_raw.append(residual / max(abs(value) for value in gradient))
            sensitivity_scaled.append(residual / max(abs(value * full_columns[column]) for column, value in enumerate(gradient)))
        expected = {
            "rawUnusedConstraint": ratio_record(raw_values),
            "termNormalizedUnusedConstraint": ratio_record(self.normalized),
            "sensitivityRaw": ratio_record(tuple(sensitivity_raw)),
            "sensitivityEquilibrated": ratio_record(tuple(sensitivity_scaled)),
        }
        self.assertEqual(self.receipt["constraintLocalization"], expected)

    def test_predicates_and_unresolved_stop_are_forced(self) -> None:
        cells = self.receipt["interventionCells"]
        spreads = {cell["cellId"]: (from_word(cell["raw"]["uDiagonalSpreadBinary64Word"]), from_word(cell["equilibrated"]["uDiagonalSpreadBinary64Word"])) for cell in cells}
        scaling = all(eq <= raw * 2.0**-10 and from_word(cell["equilibrated"]["pivotGrowthBinary64Word"]) < 2.0**20 for cell, (raw, eq) in zip(cells, spreads.values(), strict=True))
        first = spreads["DROP_FIRST"][0]
        boundary = first <= spreads["FULL"][0] * 2.0**-10 and spreads["DROP_MIDDLE"][0] >= 4.0 * first and spreads["DROP_LAST"][0] >= 4.0 * first
        ratios = {name: from_word(record["node1ToMedianBinary64Word"]) for name, record in self.receipt["constraintLocalization"].items()}
        robust = all(value >= 16.0 for value in ratios.values())
        scale_absorb = ratios["rawUnusedConstraint"] >= 16.0 and ratios["sensitivityRaw"] >= 16.0 and ratios["sensitivityEquilibrated"] < 16.0 and ratios["sensitivityEquilibrated"] <= ratios["sensitivityRaw"] * 2.0**-4
        term_absorb = ratios["rawUnusedConstraint"] >= 16.0 and ratios["termNormalizedUnusedConstraint"] < 16.0 and ratios["termNormalizedUnusedConstraint"] <= ratios["rawUnusedConstraint"] * 2.0**-10
        self.assertEqual(self.receipt["causalPredicates"], {"SCALING_MAIN_EFFECT": scaling, "FIRST_BLOCK_CONDITIONING_LEVERAGE": boundary, "LOCALIZATION_ROBUST": robust, "SCALING_ABSORBS_LOCALIZATION": scale_absorb, "LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION": term_absorb})
        self.assertEqual(self.receipt["classification"], "CAUSAL_INTERACTION_UNRESOLVED_STOP")
        self.assertFalse(self.receipt["proposalPreparationSupported"])
        self.assertIsNone(self.receipt["proposalClass"])

    def test_no_solve_mutation_or_authority(self) -> None:
        for key in ("candidateSolveInvoked", "linearCorrectionSolved", "newtonInvoked", "continuationInvoked", "armijoTrialEvaluated", "stateUpdateComputedOrPersisted", "b4R4Retried", "candidateAdmission", "vacuumWorkUnlocked"):
            self.assertFalse(self.receipt[key])
        self.assertTrue(self.receipt["noRetune"])
        self.assertTrue(all(value is False for value in self.receipt["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
