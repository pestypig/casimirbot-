"""Producer-independent audit of the sole B4-R6 benchmark receipt."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import stat
import struct
import sys
import unittest

import gmpy2


ROOT = Path(__file__).resolve().parents[2]
BRANCH = ROOT / "tools/nhm2-spherical-boson-star-branch"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r6-mechanism-separation-v1"
RECEIPT_PATH = OUTPUT / "receipt.json"
STATE_PATH = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r6-mechanism-separation/v1\n"


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
    diagonals = tuple(abs(lu[index][index]) for index in range(order))
    u_max = max(abs(lu[row][column]) for row in range(order) for column in range(row, order))
    return {
        "matrixInfinityNormBinary64Word": word(matrix_linf),
        "matrixMaximumBinary64Word": word(original_max),
        "pivotGrowthBinary64Word": word(u_max / original_max),
        "uDiagonalSpreadBinary64Word": word(max(diagonals) / min(diagonals)),
    }


def power_scale(maximum: float) -> float:
    if maximum == 0.0:
        return 1.0
    _fraction, exponent = math.frexp(maximum)
    return math.ldexp(1.0, -exponent)


def equilibrate(matrix: tuple[tuple[float, ...], ...]):
    count = len(matrix)
    rows = tuple(power_scale(max(abs(value) for value in row)) for row in matrix)
    row_scaled = tuple(tuple(rows[row] * value for value in matrix[row]) for row in range(count))
    columns = tuple(power_scale(max(abs(row_scaled[row][column]) for row in range(count))) for column in range(count))
    result = tuple(tuple(row_scaled[row][column] * columns[column] for column in range(count)) for row in range(count))
    return result, rows, columns


def spectrum(varphi: tuple[float, ...]) -> dict[str, object]:
    context = gmpy2.get_context().copy()
    context.precision = 256
    context.round = gmpy2.RoundToNearest
    context.emin = -1_073_741_823
    context.emax = 1_073_741_823
    context.subnormalize = False
    context.trap_underflow = context.trap_overflow = context.trap_inexact = False
    context.trap_invalid = context.trap_erange = context.trap_divzero = False
    with gmpy2.context(context):
        mp = gmpy2.mpfr
        pi = gmpy2.const_pi()
        coefficients = []
        for mode in range(64):
            total = mp(varphi[0]) / mp(2)
            for node in range(1, 63):
                total += mp(varphi[node]) * gmpy2.cos(pi * mp(mode * node) / mp(63))
            total += mp(varphi[-1]) * (mp(-1) if mode % 2 else mp(1)) / mp(2)
            coefficient = mp(2) * total / mp(63)
            if mode % 2:
                coefficient = -coefficient
            if mode in (0, 63):
                coefficient /= mp(2)
            coefficients.append(coefficient)
        norm = lambda values: gmpy2.sqrt(sum((value * value for value in values), mp(0)))
        total_norm = norm(coefficients)
        tail_norm = norm(coefficients[32:])
        even_norm = norm([coefficients[index] for index in range(32, 64, 2)])
        odd_norm = norm([coefficients[index] for index in range(33, 64, 2)])
        largest = max(range(32, 64), key=lambda index: (abs(coefficients[index]), -index))
        rounded = tuple(float(value) for value in coefficients)
        return {
            "coefficientWordStreamSha256": sha(struct.pack("<64d", *rounded)),
            "totalL2Binary64Word": word(float(total_norm)),
            "highTailL2Binary64Word": word(float(tail_norm)),
            "highTailToTotalBinary64Word": word(float(tail_norm / total_norm)),
            "evenHighTailL2Binary64Word": word(float(even_norm)),
            "oddHighTailL2Binary64Word": word(float(odd_norm)),
            "evenOddHighTailRatioBinary64Word": word(float(even_norm / odd_norm)),
            "largestTailMode": largest,
            "largestTailCoefficientBinary64Word": word(rounded[largest]),
        }


class G2BB4R6IndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        metadata = RECEIPT_PATH.lstat()
        cls.raw = RECEIPT_PATH.read_bytes()
        assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
        cls.receipt = json.loads(cls.raw)
        assert canonical(cls.receipt) == cls.raw
        if str(BRANCH) not in sys.path:
            sys.path.insert(0, str(BRANCH))
        from radial_collocation_interior import RadialCollocationState
        from radial_compactified_system import evaluate_spherical_radial_compactified_system
        from radial_lobatto_grid import generate_compactified_lobatto_grid
        values = struct.unpack("<193d", STATE_PATH.read_bytes())
        cls.values = values
        cls.state = RadialCollocationState(F0=values[:64], F1=values[64:128], varphi=values[128:192], w=values[192])
        cls.grid = generate_compactified_lobatto_grid(64).differentiation
        cls.assembly = evaluate_spherical_radial_compactified_system(grid=cls.grid, state=cls.state, origin_amplitude=2.0**-16)

    def test_exact_inventory_raw_hash_and_self_hash(self) -> None:
        inventory = {path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file()}
        self.assertEqual(inventory, {"receipt.json"})
        self.assertEqual((len(self.raw), sha(self.raw)), (12_503, "e7f0580ab0e8a52b5bf8fe69691f00f821a0004ea5dd49b623a1e498bce203b2"))
        unsigned = dict(self.receipt)
        observed = unsigned.pop("receiptSha256")
        encoded = canonical(unsigned)
        self.assertEqual(observed, sha(DOMAIN + struct.pack("<Q", len(encoded)) + encoded))
        self.assertEqual(observed, "0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001")

    def test_all_bindings_reopen_exactly(self) -> None:
        for binding in self.receipt["sourceAndInputBindings"]:
            raw = (ROOT / binding["path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))
        self.assertEqual(self.receipt["parentB4R5ReceiptSha256"], "0cfb59144cf29beb0da94852ee872455a56017cbe3fc690fd6cb24cd401ea406")

    def test_coordinate_and_equilibration_replay(self) -> None:
        gap = 1.0 - self.state.w
        derivatives = (("DIRECT_W", 1.0), ("GAP_Q", -1.0), ("LOG_GAP_S", -gap), ("NU", 1.0 / self.state.w))
        observed = self.receipt["coordinateDiagnostics"]
        for ordinal, (identifier, derivative) in enumerate(derivatives):
            transformed = tuple(tuple(value * derivative if column == 192 else value for column, value in enumerate(row)) for row in self.assembly.jacobian)
            balanced, rows, columns = equilibrate(transformed)
            expected = {
                "coordinateId": identifier,
                "dwDzBinary64Word": word(derivative),
                "unscaled": factor(transformed),
                "equilibrated": factor(balanced),
                "rowScaleMinimumBinary64Word": word(min(rows)),
                "rowScaleMaximumBinary64Word": word(max(rows)),
                "columnScaleMinimumBinary64Word": word(min(columns)),
                "columnScaleMaximumBinary64Word": word(max(columns)),
                "frequencyColumnMaximumBinary64Word": word(max(abs(row[192]) for row in transformed)),
            }
            self.assertEqual(observed[ordinal], expected)

    def test_spectral_and_first_node_replay(self) -> None:
        self.assertEqual(self.receipt["spectralDiagnostics"], spectrum(self.state.varphi))
        absolute = sorted(abs(value) for value in self.assembly.unused_constraint)
        median = (absolute[30] + absolute[31]) / 2.0
        ratio = abs(self.assembly.unused_constraint[0]) / median
        self.assertEqual(self.receipt["firstInteriorConstraint"], {
            "node1AbsoluteBinary64Word": word(abs(self.assembly.unused_constraint[0])),
            "medianAbsoluteBinary64Word": word(median),
            "node1ToMedianBinary64Word": word(ratio),
        })
        self.assertGreaterEqual(ratio, 16.0)

    def test_thresholds_force_multiple_mechanism_stop(self) -> None:
        coordinate = self.receipt["coordinateDiagnostics"]
        direct_raw = from_word(coordinate[0]["unscaled"]["uDiagonalSpreadBinary64Word"])
        direct_balanced = from_word(coordinate[0]["equilibrated"]["uDiagonalSpreadBinary64Word"])
        direct_growth = from_word(coordinate[0]["equilibrated"]["pivotGrowthBinary64Word"])
        coordinate_candidates = [
            item["coordinateId"] for item in coordinate[1:]
            if from_word(item["unscaled"]["uDiagonalSpreadBinary64Word"]) <= direct_raw * 2.0**-10
        ]
        coordinate_trigger = False
        if len(coordinate_candidates) == 1:
            winner = coordinate_candidates[0]
            winner_spread = from_word(next(item for item in coordinate if item["coordinateId"] == winner)["unscaled"]["uDiagonalSpreadBinary64Word"])
            coordinate_trigger = all(from_word(item["unscaled"]["uDiagonalSpreadBinary64Word"]) >= 4.0 * winner_spread for item in coordinate[1:] if item["coordinateId"] != winner)
        scaling_trigger = direct_balanced <= direct_raw * 2.0**-10 and direct_growth < 2.0**20 and not coordinate_trigger
        matrix_max = from_word(coordinate[0]["unscaled"]["matrixMaximumBinary64Word"])
        mpfr = self.receipt["mpfr256Comparison"]
        precision_trigger = from_word(mpfr["residual"]["maximumAbsoluteDifferenceBinary64Word"]) >= 2.0**-40 or from_word(mpfr["jacobian"]["maximumAbsoluteDifferenceBinary64Word"]) / matrix_max >= 2.0**-40
        spectral = self.receipt["spectralDiagnostics"]
        tail = from_word(spectral["highTailToTotalBinary64Word"])
        parity = from_word(spectral["evenOddHighTailRatioBinary64Word"])
        spectral_trigger = tail >= 2.0**-10 and (parity < 2.0**-4 or parity > 2.0**4)
        first_trigger = from_word(self.receipt["firstInteriorConstraint"]["node1ToMedianBinary64Word"]) >= 16.0
        triggers = {"COORDINATE_SEPARATION": coordinate_trigger, "SCALING_SEPARATION": scaling_trigger, "PRECISION_SEPARATION": precision_trigger, "SPECTRAL_SEPARATION": spectral_trigger, "FIRST_NODE_SEPARATION": first_trigger}
        self.assertEqual(triggers, self.receipt["mechanismTriggers"])
        self.assertEqual([name for name, active in (("SCALING", scaling_trigger), ("DISCRETIZATION", spectral_trigger or first_trigger)) if active], self.receipt["activeMechanismFamilies"])
        self.assertEqual(self.receipt["decision"], "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR")

    def test_no_solve_mutation_or_authority(self) -> None:
        for key in ("candidateSolveInvoked", "newtonInvoked", "continuationInvoked", "armijoTrialEvaluated", "stateUpdateComputedOrPersisted", "b4R4Retried", "candidateAdmission", "vacuumWorkUnlocked"):
            self.assertFalse(self.receipt[key])
        self.assertTrue(self.receipt["noRetune"])
        self.assertTrue(all(value is False for value in self.receipt["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
