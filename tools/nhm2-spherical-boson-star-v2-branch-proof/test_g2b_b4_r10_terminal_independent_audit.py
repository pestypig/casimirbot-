"""Read-only producer-independent audit of the sole B4-R10 execution.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R10 immutable terminal-output audit
Current maturity: post-execution audit of one frozen attempt
Target maturity: authenticated terminal PASS or first-failure receipt
Required frozen inputs: R10 output prefix, checkpoint and shared equations/grid
Required evidence: inventory, hashes, chronology, profiles, norms and locks
Stop/fail criteria: any missing byte, mismatch, noncanonical receipt or mutation
Explicit non-goals: Newton/continuation replay, retry, retune or output changes
Downstream gate unlocked: typed result classification and next bounded diagnosis

This module deliberately does not import the R10 producer, R9 proposal, Newton,
continuation, or the preexecution audit.  It performs no write and no solve.
"""

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
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1"
LEVEL = OUTPUT / "level-64"
PRE = OUTPUT / "preexecution-binding.json"
TERMINAL = OUTPUT / "terminal-receipt.json"
PRE_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r10-preexecution/v1\n"
TERMINAL_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r10-terminal/v1\n"
EXPECTED_TERMINAL = "e8d0268f499f6e1cba9ccf26cc34dc602b4a40f7f96478bb7e59e7acce037706"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def word(value: float) -> str:
    return struct.pack(">d", value).hex()


def read_json(path: Path) -> tuple[bytes, dict[str, object]]:
    metadata = path.lstat()
    assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
    raw = path.read_bytes()
    value = json.loads(raw)
    assert type(value) is dict and canonical(value) == raw
    return raw, value


def self_hash(value: dict[str, object], domain: bytes) -> str:
    unsigned = dict(value)
    observed = unsigned.pop("receiptSha256")
    raw = canonical(unsigned)
    assert observed == sha(domain + struct.pack("<Q", len(raw)) + raw)
    return str(observed)


def binding_bytes(binding: dict[str, object]) -> bytes:
    path = OUTPUT / str(binding["path"])
    metadata = path.lstat()
    assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
    raw = path.read_bytes()
    assert (len(raw), sha(raw)) == (binding["sizeBytes"], binding["rawSha256"])
    return raw


def mp_context():
    context = gmpy2.get_context().copy()
    context.precision = 512
    context.round = gmpy2.RoundToNearest
    context.emin = -1_073_741_823
    context.emax = 1_073_741_823
    context.subnormalize = False
    context.trap_underflow = context.trap_overflow = context.trap_inexact = False
    context.trap_invalid = context.trap_erange = context.trap_divzero = False
    context.allow_complex = context.rational_division = context.allow_release_gil = False
    return gmpy2.context(context)


def mp_sum(values):
    total = gmpy2.mpfr(0)
    for value in values:
        total += value
    return total


def independent_q_g(grid, fields, w64):
    q = [0.0]
    source = [0.0]
    with mp_context():
        mp = gmpy2.mpfr
        zero, one, two, four = (mp(value) for value in (0, 1, 2, 4))
        w2 = mp(w64) * mp(w64)
        lifted_fields = tuple(tuple(mp(value) for value in field) for field in fields)
        for node in range(1, len(grid.rho) - 1):
            rho = mp(grid.rho[node])
            om = one - rho
            x = rho / om
            invx = one / x
            first_scale = om * om
            second_scale = first_scale * first_scale
            mixed_scale = -two * om * first_scale
            first = tuple(first_scale * mp(value) for value in grid.first_rho[node])
            second = tuple(
                second_scale * mp(d2) + mixed_scale * mp(d1)
                for d1, d2 in zip(grid.first_rho[node], grid.second_rho[node], strict=True)
            )
            f0, f1, phi = (field[node] for field in lifted_fields)
            f0p, f1p, phip = (
                mp_sum([coefficient * value for coefficient, value in zip(first, field, strict=True)])
                for field in lifted_fields
            )
            f0pp, f1pp, phipp = (
                mp_sum([coefficient * value for coefficient, value in zip(second, field, strict=True)])
                for field in lifted_fields
            )
            em2f0 = gmpy2.exp(-two * f0)
            em2f1 = gmpy2.exp(-two * f1)
            phi2 = phi * phi
            time_gradient = em2f0 * w2 * phi2
            radial_gradient = em2f1 * phip * phip
            stress_t = -time_gradient - radial_gradient - phi2
            stress_x = time_gradient + radial_gradient - phi2
            stress_theta = time_gradient - radial_gradient - phi2
            gt = em2f1 * (two * f1pp + f1p * f1p + four * invx * f1p)
            gx = em2f1 * (two * f0p * f1p + f1p * f1p + two * invx * (f0p + f1p))
            gtheta = em2f1 * (f0p * f0p + f0pp + f1pp + invx * (f0p + f1p))
            box_phi = em2f1 * (phipp + (f0p + f1p + two * invx) * phip) + em2f0 * w2 * phi
            A = gt - stress_t
            B = gx - stress_x
            C = gtheta - stress_theta
            K = box_phi - phi
            W = x * x * gmpy2.exp(f0 + two * f1)
            charge = W * B
            forcing = W * (f0p * A + two * (f1p + invx) * C - two * phip * K) / (om * om)
            q.append(0.0 if charge == zero else float(charge))
            source.append(0.0 if forcing == zero else float(forcing))
    q.append(0.0)
    source.append(0.0)
    return tuple(q), tuple(source)


def independent_prefix(nodes, values):
    count = len(nodes)
    with mp_context():
        mp = gmpy2.mpfr
        zero, one, two, four = (mp(value) for value in (0, 1, 2, 4))
        matrix = []
        for node in nodes:
            t = two * mp(node) - one
            row = [one, t]
            for _degree in range(2, count):
                row.append(two * t * row[-1] - row[-2])
            matrix.append(row)
        right = [mp(value) for value in values]
        for column in range(count):
            vector = [matrix[row][column] for row in range(column, count)]
            norm = gmpy2.sqrt(mp_sum([value * value for value in vector]))
            assert norm != zero
            vector[0] += norm if vector[0] >= zero else -norm
            norm_square = mp_sum([value * value for value in vector])
            assert norm_square != zero
            for target in range(column, count):
                factor = two * mp_sum([
                    vector[offset] * matrix[column + offset][target]
                    for offset in range(len(vector))
                ]) / norm_square
                for offset, value in enumerate(vector):
                    matrix[column + offset][target] -= factor * value
            factor = two * mp_sum([
                vector[offset] * right[column + offset] for offset in range(len(vector))
            ]) / norm_square
            for offset, value in enumerate(vector):
                right[column + offset] -= factor * value
        coefficients = [zero for _ in range(count)]
        for row in range(count - 1, -1, -1):
            tail = mp_sum([matrix[row][column] * coefficients[column] for column in range(row + 1, count)])
            assert matrix[row][row] != zero
            coefficients[row] = (right[row] - tail) / matrix[row][row]
        output = []
        for node in nodes:
            r = mp(node)
            t = two * r - one
            chebyshev = [one, t]
            for _degree in range(2, count + 1):
                chebyshev.append(two * t * chebyshev[-1] - chebyshev[-2])
            integrated = [r, (t * t - one) / four]
            for degree in range(2, count):
                endpoint = (
                    mp(-1 if (degree + 1) % 2 else 1) / mp(degree + 1)
                    - mp(-1 if (degree - 1) % 2 else 1) / mp(degree - 1)
                )
                integrated.append((
                    chebyshev[degree + 1] / mp(degree + 1)
                    - chebyshev[degree - 1] / mp(degree - 1)
                    - endpoint
                ) / four)
            value = float(mp_sum([a * basis for a, basis in zip(coefficients, integrated, strict=True)]))
            output.append(0.0 if value == 0.0 else value)
    return tuple(output)


def clenshaw_weights(count):
    n = count - 1
    theta = tuple(math.pi * j / n for j in range(count))
    weights = [0.0] * count
    interior = tuple(range(1, n))
    values = [1.0] * len(interior)
    if n % 2 == 0:
        endpoint = 1.0 / (n * n - 1.0)
        for k in range(1, n // 2):
            for ordinal, j in enumerate(interior):
                values[ordinal] -= 2.0 * math.cos(2.0 * k * theta[j]) / (4.0 * k * k - 1.0)
        for ordinal, j in enumerate(interior):
            values[ordinal] -= math.cos(n * theta[j]) / (n * n - 1.0)
    else:
        endpoint = 1.0 / (n * n)
        for k in range(1, (n + 1) // 2):
            for ordinal, j in enumerate(interior):
                values[ordinal] -= 2.0 * math.cos(2.0 * k * theta[j]) / (4.0 * k * k - 1.0)
    weights[0] = weights[-1] = endpoint / 2.0
    for ordinal, j in enumerate(interior):
        weights[j] = values[ordinal] / n
    return tuple(weights)


def weighted_l2(values, weights):
    with mp_context():
        mp = gmpy2.mpfr
        return float(gmpy2.sqrt(mp_sum([
            mp(weight) * mp(value) * mp(value)
            for value, weight in zip(values, weights, strict=True)
        ])))


class B4R10TerminalIndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pre_raw, cls.pre = read_json(PRE)
        cls.terminal_raw, cls.terminal = read_json(TERMINAL)
        cls.stage_raw, cls.stage = read_json(LEVEL / "stage-00.json")
        cls.monitor_raw, cls.monitor = read_json(LEVEL / "stage-00-constraint-monitor.json")
        cls.level_raw, cls.level = read_json(LEVEL / "level-receipt.json")

    def test_exact_inventory_and_write_chronology(self):
        expected = {
            "preexecution-binding.json", "terminal-receipt.json",
            "level-64/initializer-state.f64le", "level-64/stage-00-state.f64le",
            "level-64/stage-00.json", "level-64/stage-00-q.f64le",
            "level-64/stage-00-g.f64le", "level-64/stage-00-prefix.f64le",
            "level-64/stage-00-delta.f64le", "level-64/stage-00-constraint-monitor.json",
            "level-64/level-receipt.json",
        }
        observed = {path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file()}
        self.assertEqual(observed, expected)
        order = [
            PRE, LEVEL / "initializer-state.f64le", LEVEL / "stage-00-state.f64le",
            LEVEL / "stage-00.json", LEVEL / "stage-00-q.f64le", LEVEL / "stage-00-g.f64le",
            LEVEL / "stage-00-prefix.f64le", LEVEL / "stage-00-delta.f64le",
            LEVEL / "stage-00-constraint-monitor.json", LEVEL / "level-receipt.json", TERMINAL,
        ]
        mtimes = [path.stat().st_mtime_ns for path in order]
        self.assertEqual(mtimes, sorted(mtimes))

    def test_receipt_hashes_and_all_input_bindings(self):
        self.assertEqual(self_hash(self.pre, PRE_DOMAIN), "1712eddad469b30f43aa694bdf00646a8b9c0e5b2886b83a02bd27677c5009be")
        self.assertEqual(self_hash(self.terminal, TERMINAL_DOMAIN), EXPECTED_TERMINAL)
        self.assertEqual(self.terminal["preexecutionBindingSha256"], self.pre["receiptSha256"])
        for binding in self.pre["checkpointBindings"]:
            raw = (ROOT / binding["path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))
        self.assertEqual(len(self.pre["frozenDependencies"]), 27)
        for binding in self.pre["frozenDependencies"]:
            raw = (ROOT / binding["relative_path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["size_bytes"], binding["sha256"]))

    def test_level_stage_and_profile_bindings_reopen(self):
        embedded = dict(self.terminal["levelReceipts"][0])
        level_binding = embedded.pop("levelReceiptBinding")
        self.assertEqual(binding_bytes(level_binding), self.level_raw)
        self.assertEqual(embedded, self.level)
        stage_receipt = self.level["stageReceipts"][0]
        self.assertEqual(binding_bytes(stage_receipt["metadataBinding"]), self.stage_raw)
        self.assertEqual(binding_bytes(stage_receipt["constraintMonitorBinding"]), self.monitor_raw)
        self.assertEqual(binding_bytes(self.stage["stateBinding"]), (LEVEL / "stage-00-state.f64le").read_bytes())
        for binding in self.monitor["profileBindings"].values():
            binding_bytes(binding)

    def test_independent_constraint_profiles_and_norms(self):
        if str(BRANCH) not in sys.path:
            sys.path.insert(0, str(BRANCH))
        from radial_lobatto_grid import generate_compactified_lobatto_grid
        values = struct.unpack("<193d", (LEVEL / "stage-00-state.f64le").read_bytes())
        fields = (values[:64], values[64:128], values[128:192])
        grid = generate_compactified_lobatto_grid(64).differentiation
        q, g = independent_q_g(grid, fields, values[-1])
        prefix = independent_prefix(grid.rho, g)
        with mp_context():
            delta = tuple(
                0.0 if (value := float(gmpy2.mpfr(left) - gmpy2.mpfr(right))) == 0.0 else value
                for left, right in zip(q, prefix, strict=True)
            )
        profiles = {"q": q, "g": g, "prefix": prefix, "delta": delta}
        for name, profile in profiles.items():
            self.assertEqual(struct.pack("<64d", *profile), (LEVEL / f"stage-00-{name}.f64le").read_bytes())
        weights = clenshaw_weights(64)
        for name in ("q", "delta"):
            self.assertEqual(self.monitor["normBinary64Words"][name]["linf"], word(max(abs(value) for value in profiles[name])))
            self.assertEqual(self.monitor["normBinary64Words"][name]["l2"], word(weighted_l2(profiles[name], weights)))
        for name, profile in profiles.items():
            self.assertEqual(self.monitor["endpointWords"][name], {"origin": word(profile[0]), "infinity": word(profile[-1])})

    def test_linear_trace_and_first_failure_chronology(self):
        self.assertEqual(self.stage["newtonAcceptedUpdateCount"], 29)
        self.assertEqual(len(self.stage["newtonAcceptedAlphaExponents"]), 29)
        self.assertEqual(len(self.stage["linearCorrectionTraces"]), 30)
        self.assertEqual([trace["update_index"] for trace in self.stage["linearCorrectionTraces"]], list(range(30)))
        self.assertEqual(self.stage["newtonFailureCode"], "armijo_schedule_exhausted_without_retry")
        self.assertFalse(self.stage["varphiNodesNonincreasing"])
        self.assertEqual(self.terminal["firstFailure"], {
            "code": "armijo_schedule_exhausted_without_retry", "levelId": "L0", "stageIndex": 0,
        })
        self.assertEqual((self.terminal["attemptedLevelCount"], self.terminal["completedLevelCount"]), (1, 0))
        self.assertIsNone(self.terminal["fieldCrossGridBinding"])
        self.assertIsNone(self.terminal["constraintCrossGridBinding"])

    def test_terminal_fail_closed_without_retry_or_authority(self):
        self.assertEqual(self.terminal["status"], "FAIL")
        self.assertEqual(self.terminal["decision"], "STOPPED_AT_FIRST_SOLVE_FAILURE")
        self.assertTrue(self.terminal["noRetry"] and self.terminal["noRetune"])
        self.assertFalse(self.terminal["coarseGridPredictorAllowed"])
        self.assertFalse(self.terminal["candidateAdmission"])
        self.assertFalse(self.terminal["nextMathematicalDutyUnlocked"])
        self.assertTrue(all(value is False for value in self.terminal["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
