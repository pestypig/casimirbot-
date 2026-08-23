"""No-execution tests for the B4-R10 implementation surface."""

from __future__ import annotations

from dataclasses import replace
import importlib.util
import math
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "g2b_b4_r10_equilibrated_four_grid_successor.py"


def _load():
    name = "_test_g2b_b4_r10_impl"
    spec = importlib.util.spec_from_file_location(name, SOURCE)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


R10 = _load()


class _Grid:
    def __init__(self, rho: tuple[float, ...]) -> None:
        self.rho = rho
        count = len(rho)
        # Synthetic definition wire only.  These matrices do not represent a
        # candidate grid and are never passed to Newton or continuation.
        self.first_rho = tuple(
            tuple(0.0 for _ in range(count)) for _ in range(count)
        )
        self.second_rho = self.first_rho


class _State:
    def __init__(self, count: int) -> None:
        self.F0 = tuple(0.0 for _ in range(count))
        self.F1 = tuple(0.0 for _ in range(count))
        self.varphi = tuple(0.0 for _ in range(count))
        self.w = 0.5


class B4R10FocusedTests(unittest.TestCase):
    def test_output_root_remains_absent_and_import_is_inert(self) -> None:
        self.assertFalse(R10.OUTPUT_ROOT.exists())
        self.assertEqual(R10.NEWTON_TRACES, [])

    def test_constraint_monitor_synthetic_zero_wire(self) -> None:
        grid = _Grid((0.0, 0.25, 0.5, 0.75, 1.0))
        monitor = R10.evaluate_constraint_monitor(grid, _State(5))
        for name in R10.PROFILE_NAMES:
            values = getattr(monitor, name)
            self.assertEqual(values, (0.0,) * 5)
            self.assertEqual(struct.pack(">d", values[0]), bytes(8))
            self.assertEqual(struct.pack(">d", values[-1]), bytes(8))
        self.assertEqual(monitor.norms["q"], {"linf": 0.0, "l2": 0.0})
        self.assertEqual(monitor.norms["delta"], {"linf": 0.0, "l2": 0.0})

    def test_tail_interface_fails_closed(self) -> None:
        grid = _Grid((0.0, 0.5, 1.0))
        state = _State(3)
        state.F0 = (0.0, 0.0, math.ulp(0.0))
        with self.assertRaisesRegex(R10.G2BB4R10Error, "tail_interface_failure"):
            R10.evaluate_constraint_monitor(grid, state)

    def test_scale_free_cross_grid_zero_plateau_and_failure(self) -> None:
        grids = tuple(_Grid((0.0, 0.5, 1.0)) for _ in range(4))
        zero = R10.ConstraintMonitor(
            q=(0.0, 0.0, 0.0), g=(0.0, 0.0, 0.0),
            prefix=(0.0, 0.0, 0.0), delta=(0.0, 0.0, 0.0),
            norms={"q": {"linf": 0.0, "l2": 0.0}, "delta": {"linf": 0.0, "l2": 0.0}},
            tail_interface_passed=True,
        )
        passed = R10.evaluate_constraint_cross_grid(grids, (zero, zero, zero, zero))
        self.assertTrue(passed["passed"])
        self.assertFalse(passed["absoluteThresholdUsed"])
        bad = replace(
            zero,
            q=(0.0, 1.0, 0.0),
            norms={"q": {"linf": 1.0, "l2": 1.0}, "delta": {"linf": 0.0, "l2": 0.0}},
        )
        failed = R10.evaluate_constraint_cross_grid(grids, (zero, bad, zero, zero))
        self.assertFalse(failed["passed"])

    def test_preexecution_entrypoint_never_executes(self) -> None:
        receipt = R10.verify_preexecution_only()
        self.assertEqual(receipt["decision"], "IMPLEMENTATION_PREEXECUTION_CLOSED_NO_EXECUTION")
        self.assertTrue(receipt["outputRootAbsent"])
        for field in ("candidateDataRead", "gridGenerated", "newtonInvoked", "continuationInvoked", "armijoInvoked"):
            self.assertFalse(receipt[field])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
