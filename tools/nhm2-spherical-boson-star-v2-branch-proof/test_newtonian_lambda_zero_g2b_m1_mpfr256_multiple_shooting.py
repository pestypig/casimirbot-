"""Focused tests for the disabled G2B-M1 MPFR256 engine."""

from __future__ import annotations

import ast
from fractions import Fraction
import hashlib
import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m1_mpfr256_multiple_shooting.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m1_engine", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m1_spec_unavailable")
ENGINE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = ENGINE
SPEC.loader.exec_module(ENGINE)


class G2BM1EngineTests(unittest.TestCase):
    def test_frozen_packet_and_center_bindings(self) -> None:
        ENGINE._verify_static_inputs()
        self.assertEqual(
            hashlib.sha256(ENGINE.PACKET_PATH.read_bytes()).hexdigest(),
            ENGINE.PACKET_SHA256,
        )
        self.assertEqual(
            hashlib.sha256(ENGINE.GLOBAL_CENTER_PATH.read_bytes()).hexdigest(),
            ENGINE.GLOBAL_CENTER_SHA256,
        )

    def test_runtime_bindings_and_context_restore(self) -> None:
        paths = ENGINE._verify_runtime()
        self.assertEqual(len(paths), 3)
        before = ENGINE.gmpy2.get_context().copy()
        with ENGINE._mpfr_context():
            active = ENGINE.gmpy2.get_context()
            self.assertEqual(active.precision, 256)
            self.assertEqual(active.emin, -1_000_000)
            self.assertEqual(active.emax, 1_000_000)
        after = ENGINE.gmpy2.get_context()
        self.assertEqual(after.precision, before.precision)
        self.assertEqual(after.round, before.round)
        self.assertEqual(after.emin, before.emin)
        self.assertEqual(after.emax, before.emax)
        with self.assertRaisesRegex(RuntimeError, "synthetic_consumer_failure"):
            with ENGINE._mpfr_context():
                raise RuntimeError("synthetic_consumer_failure")
        recovered = ENGINE.gmpy2.get_context()
        self.assertEqual(recovered.precision, before.precision)
        self.assertEqual(recovered.round, before.round)

    def test_origin_jet_matches_first_exact_coefficients(self) -> None:
        with ENGINE._mpfr_context():
            vc = ENGINE.gmpy2.mpfr("-1.25")
            nu = ENGINE.gmpy2.mpfr("-0.5")
            state, derivative_vc, derivative_nu = ENGINE._origin_jet(vc, nu)
            self.assertEqual(len(state), 4)
            self.assertEqual(len(derivative_vc), 4)
            self.assertEqual(len(derivative_nu), 4)
            expected_a1 = ENGINE.gmpy2.mpfr(Fraction(-1, 4))
            expected_b1 = ENGINE.gmpy2.mpfr(Fraction(1, 6))
            self.assertEqual(expected_a1, (vc - nu) / 3)
            self.assertEqual(expected_b1, ENGINE.gmpy2.mpfr(1) / 6)
            self.assertTrue(all(ENGINE.gmpy2.is_finite(value) for value in state))

    def test_augmented_identity_and_short_propagation(self) -> None:
        with ENGINE._mpfr_context():
            state = tuple(ENGINE.gmpy2.mpfr(value) for value in (1, 0, -1, 0))
            vector = ENGINE._identity_augmented(state)
            self.assertEqual(len(vector), 24)
            output = ENGINE._integrate_interval(
                vector,
                ENGINE.gmpy2.mpfr("0.25"),
                ENGINE.gmpy2.mpfr("0.2501"),
                ENGINE.gmpy2.mpfr("-0.5"),
                2,
                augmented=True,
            )
            self.assertEqual(len(output), 24)
            self.assertTrue(all(ENGINE.gmpy2.is_finite(value) for value in output))

    def test_scaled_partial_pivoting_and_lowest_tie(self) -> None:
        with ENGINE._mpfr_context():
            mp = ENGINE.gmpy2.mpfr
            solution = ENGINE._scaled_partial_pivot_solve(
                ((mp(3), mp(2)), (mp(1), mp(2))),
                (mp(5), mp(5)),
            )
            self.assertEqual(solution, (mp(0), mp("2.5")))
            with self.assertRaisesRegex(
                ENGINE.G2BM1ImplementationBlocked,
                "g2b_m1_linear_singular_scale",
            ):
                ENGINE._scaled_partial_pivot_solve(
                    ((mp(0), mp(0)), (mp(0), mp(1))),
                    (mp(0), mp(1)),
                )

    def test_full_system_analytic_directional_jacobian(self) -> None:
        with ENGINE._mpfr_context():
            variables = ENGINE._initial_unknowns()
            residual, jacobian = ENGINE._system(variables, 1, jacobian=True)
            self.assertIsNotNone(jacobian)
            assert jacobian is not None
            direction = [ENGINE.gmpy2.mpfr(0)] * ENGINE.UNKNOWN_COUNT
            direction[0] = ENGINE.gmpy2.mpfr(1)
            direction[1] = ENGINE.gmpy2.mpfr("-0.25")
            direction[18] = ENGINE.gmpy2.mpfr("0.5")
            step = ENGINE.gmpy2.exp2(-70)
            plus = tuple(
                variables[index] + step * direction[index]
                for index in range(ENGINE.UNKNOWN_COUNT)
            )
            minus = tuple(
                variables[index] - step * direction[index]
                for index in range(ENGINE.UNKNOWN_COUNT)
            )
            plus_residual, _unused = ENGINE._system(plus, 1, jacobian=False)
            minus_residual, _unused = ENGINE._system(minus, 1, jacobian=False)
            for row in range(ENGINE.UNKNOWN_COUNT):
                observed = (plus_residual[row] - minus_residual[row]) / (2 * step)
                expected = sum(
                    (
                        jacobian[row][column] * direction[column]
                        for column in range(ENGINE.UNKNOWN_COUNT)
                    ),
                    ENGINE.gmpy2.mpfr(0),
                )
                difference = ENGINE._normalized_difference(observed, expected)
                self.assertLess(difference, ENGINE.gmpy2.exp2(-50), row)
            self.assertEqual(len(residual), ENGINE.UNKNOWN_COUNT)

    def test_newton_chronology_and_failure_evidence(self) -> None:
        with ENGINE._mpfr_context():
            mp = ENGINE.gmpy2.mpfr

            def linear_system(variables, _substeps, *, jacobian):
                residual = tuple(value - 1 for value in variables)
                matrix = None
                if jacobian:
                    matrix = [
                        [
                            mp(1 if row == column else 0)
                            for column in range(ENGINE.UNKNOWN_COUNT)
                        ]
                        for row in range(ENGINE.UNKNOWN_COUNT)
                    ]
                return residual, matrix

            with patch.object(ENGINE, "_system", side_effect=linear_system):
                solved, chronology = ENGINE._newton_refinement(
                    (mp(0),) * ENGINE.UNKNOWN_COUNT, 4
                )
            self.assertTrue(all(value == 1 for value in solved))
            self.assertEqual(chronology[-1]["decision"], "CONVERGED")

            def blocked_system(_variables, _substeps, *, jacobian):
                del jacobian
                raise ENGINE.G2BM1ImplementationBlocked("synthetic_system_stop")

            with patch.object(ENGINE, "_system", side_effect=blocked_system):
                with self.assertRaises(
                    ENGINE.G2BM1ImplementationBlocked
                ) as caught:
                    ENGINE._newton_refinement(
                        (mp(0),) * ENGINE.UNKNOWN_COUNT, 4
                    )
            self.assertEqual(caught.exception.code, "synthetic_system_stop")
            self.assertEqual(caught.exception.evidence["iteration"], 0)

    def test_private_self_check_is_bounded_and_false_authority(self) -> None:
        result = ENGINE._private_engine_self_check(ENGINE._TEST_MARKER)
        self.assertEqual(result["propagatedCount"], 24)
        self.assertEqual(result["segmentCount"], 16)
        self.assertEqual(result["unknownCount"], 62)
        self.assertTrue(result["originFinite"])
        self.assertFalse(any(result["authorityLocks"].values()))
        with self.assertRaisesRegex(
            ENGINE.G2BM1ImplementationBlocked,
            "g2b_m1_private_marker_required",
        ):
            ENGINE._private_engine_self_check(object())

    def test_public_surface_is_blocked_and_zero_argument(self) -> None:
        self.assertEqual(
            ENGINE.__all__,
            ["G2BM1ImplementationBlocked", "observe_g2b_m1_implementation"],
        )
        with self.assertRaisesRegex(
            ENGINE.G2BM1ImplementationBlocked,
            "g2b_m1_one_shot_execution_not_preregistered",
        ):
            ENGINE.observe_g2b_m1_implementation()
        with self.assertRaises(TypeError):
            ENGINE.observe_g2b_m1_implementation(object())

    def test_static_source_has_no_candidate_execution_or_authority(self) -> None:
        raw = SOURCE.read_bytes()
        tree = ast.parse(raw, filename=str(SOURCE))
        imports = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, ast.Import)
            for alias in node.names
        }
        imports.update(
            node.module or ""
            for node in ast.walk(tree)
            if isinstance(node, ast.ImportFrom)
        )
        self.assertNotIn("scipy", imports)
        self.assertNotIn("numpy", imports)
        self.assertNotIn("subprocess", imports)
        self.assertNotIn("socket", imports)
        self.assertNotIn("requests", imports)
        text = raw.decode("utf-8")
        self.assertNotIn("--execute-once", text)
        self.assertNotIn("AUTHORITY_LOCKS.values()) is False", text)


if __name__ == "__main__":
    unittest.main()
