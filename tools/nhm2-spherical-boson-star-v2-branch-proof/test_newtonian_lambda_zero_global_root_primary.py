"""Static and synthetic tests for the one-shot global-root producer.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: preregistered global-root producer
Current maturity: unexecuted calculation implementation
Target maturity: audited implementation frozen before one-shot execution
Required frozen inputs: global-root proposal and lambda-zero definition pins
Required evidence: algebra, Jacobians, schemas, hostile ingress, false authority
Stop/fail criteria: any drift, actual root execution, or authority promotion
Explicit non-goals: executing the frozen root, proof, candidate, or lamp
Downstream gate unlocked: source/runtime/input preseal for one-shot calculation
"""

from __future__ import annotations

import hashlib
import importlib.util
import inspect
import json
import math
from fractions import Fraction
from pathlib import Path
import tempfile
import unittest
from unittest import mock

import numpy as np


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "newtonian_lambda_zero_global_root_primary.py"
PROPOSAL = (
    HERE.parents[1]
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-lambda-zero-global-root-attempt.md"
)


def _load() -> object:
    spec = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_global_root_primary_test_target", SOURCE
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


M = _load()


class LambdaZeroGlobalRootPrimaryTests(unittest.TestCase):
    def test_public_surface_and_proposal_binding_are_exact(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "AUTHORITY_LOCKS",
                "ATTEMPT_VERSION",
                "GlobalRootAttemptError",
                "execute_one_global_root_attempt",
            ],
        )
        self.assertEqual(
            tuple(inspect.signature(M.execute_one_global_root_attempt).parameters),
            ("output_path",),
        )
        raw = PROPOSAL.read_bytes()
        self.assertEqual(len(raw), M.PROPOSAL_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), M.PROPOSAL_SHA256)
        M._verify_proposal()

    def test_frozen_mesh_is_increasing_and_exactly_bounded(self) -> None:
        mesh = M._initial_mesh()
        self.assertEqual(mesh.shape, (513,))
        self.assertEqual(mesh[0], M.EPSILON)
        self.assertEqual(mesh[-1], M.OUTER_RADIUS)
        self.assertTrue(np.all(np.diff(mesh) > 0.0))

    def test_origin_recurrence_satisfies_each_exact_shell(self) -> None:
        vc = -1.375
        nu = -0.6875
        a, b = M._origin_coefficients(vc, nu)
        nu_exact = Fraction.from_float(nu)
        self.assertEqual(len(a), 17)
        self.assertEqual(len(b), 17)
        for shell in range(16):
            denominator = (2 * shell + 2) * (2 * shell + 3)
            ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
            aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
            self.assertEqual(
                a[shell + 1],
                2 * (ba - nu_exact * a[shell]) / denominator,
            )
            self.assertEqual(b[shell + 1], aa / denominator)

    def test_origin_parameter_jacobian_matches_centered_difference(self) -> None:
        vc = -1.375
        nu = -0.6875
        observed = M._origin_parameter_jacobian(vc, nu)
        step = 2.0**-24
        for column, pair in enumerate(((vc, nu), (vc, nu))):
            lower = list(pair)
            upper = list(pair)
            lower[column] -= step
            upper[column] += step
            expected = (
                M._origin_state(*upper) - M._origin_state(*lower)
            ) / (2.0 * step)
            np.testing.assert_allclose(
                observed[:, column], expected, rtol=2e-2, atol=5e-10
            )

    def test_ode_jacobians_match_centered_differences(self) -> None:
        x = np.asarray([0.25, 1.5, 7.0], dtype=np.float64)
        state = np.asarray(
            [
                [0.9, 0.4, 0.05],
                [-0.1, -0.2, -0.01],
                [-1.2, -0.7, -0.2],
                [0.02, 0.1, 0.01],
            ],
            dtype=np.float64,
        )
        parameters = np.asarray([-1.3, -0.6], dtype=np.float64)
        state_jacobian, parameter_jacobian = M._ode_jacobian(x, state, parameters)
        step = 2.0**-25
        for column in range(4):
            lower = state.copy()
            upper = state.copy()
            lower[column] -= step
            upper[column] += step
            expected = (
                M._ode(x, upper, parameters) - M._ode(x, lower, parameters)
            ) / (2.0 * step)
            np.testing.assert_allclose(
                state_jacobian[:, column, :], expected, rtol=2e-8, atol=2e-9
            )
        for column in range(2):
            lower = parameters.copy()
            upper = parameters.copy()
            lower[column] -= step
            upper[column] += step
            expected = (
                M._ode(x, state, upper) - M._ode(x, state, lower)
            ) / (2.0 * step)
            np.testing.assert_allclose(
                parameter_jacobian[:, column, :],
                expected,
                rtol=2e-8,
                atol=2e-9,
            )

    def test_boundary_jacobians_match_centered_differences(self) -> None:
        left = M._origin_state(-1.3, -0.6)
        right = np.asarray([1e-8, -1e-8, -0.04, 0.00125], dtype=np.float64)
        parameters = np.asarray([-1.3, -0.6], dtype=np.float64)
        jac_left, jac_right, jac_parameter = M._boundary_jacobian(
            left, right, parameters
        )
        step = 2.0**-25
        cases = (
            (left, jac_left, 4),
            (right, jac_right, 4),
            (parameters, jac_parameter, 2),
        )
        for target, jacobian, width in cases:
            for column in range(width):
                lower = target.copy()
                upper = target.copy()
                lower[column] -= step
                upper[column] += step
                if target is left:
                    arguments_lower = (lower, right, parameters)
                    arguments_upper = (upper, right, parameters)
                elif target is right:
                    arguments_lower = (left, lower, parameters)
                    arguments_upper = (left, upper, parameters)
                else:
                    arguments_lower = (left, right, lower)
                    arguments_upper = (left, right, upper)
                expected = (
                    M._boundary(*arguments_upper)
                    - M._boundary(*arguments_lower)
                ) / (2.0 * step)
                np.testing.assert_allclose(
                    jacobian[:, column], expected, rtol=2e-7, atol=2e-8
                )

    def test_receipt_hash_is_length_delimited_and_canonical(self) -> None:
        unsigned = {"b": [2, 1], "a": "x"}
        first = M._self_hash(unsigned)
        second = M._self_hash(json.loads(M._canonical_bytes(unsigned)))
        self.assertEqual(first, second)
        self.assertEqual(len(first), 64)
        self.assertNotEqual(first, M._self_hash({"b": [2, 1], "a": "xy"}))

    def test_exclusive_write_rejects_collision(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "receipt.json"
            M._exclusive_write(target, b"one")
            self.assertEqual(target.read_bytes(), b"one")
            with self.assertRaises(FileExistsError):
                M._exclusive_write(target, b"two")
            self.assertEqual(target.read_bytes(), b"one")

    def test_hostile_ingress_fails_before_solver(self) -> None:
        class Hostile:
            def __str__(self) -> str:
                raise AssertionError("traversed")

        for value in (None, 1, b"x", Hostile()):
            with self.subTest(value=type(value).__name__):
                with self.assertRaises(M.GlobalRootAttemptError) as caught:
                    M.execute_one_global_root_attempt(value)
                self.assertEqual(
                    caught.exception.code, "global_root_output_path_invalid"
                )
        with self.assertRaises(M.GlobalRootAttemptError) as caught:
            M._main([])
        self.assertEqual(caught.exception.code, "global_root_exact_command_required")

    def test_mocked_solver_failure_is_exclusively_persisted(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "failure.json"
            with mock.patch.object(M, "solve_bvp", side_effect=ValueError("x")):
                digest = M.execute_one_global_root_attempt(str(target))
            receipt = json.loads(target.read_text(encoding="ascii"))
            self.assertEqual(receipt["decision"], "CALCULATION_FAIL")
            self.assertEqual(
                receipt["firstFailure"]["code"],
                "global_root_solver_exception",
            )
            self.assertEqual(receipt["receiptSha256"], digest)
            self.assertFalse(any(receipt["authorityLocks"].values()))
            with self.assertRaises(M.GlobalRootAttemptError) as caught:
                M.execute_one_global_root_attempt(str(target))
            self.assertEqual(caught.exception.code, "global_root_output_collision")

    def test_authority_is_permanently_false_and_no_attempt_ran(self) -> None:
        self.assertTrue(M.AUTHORITY_LOCKS)
        self.assertFalse(any(M.AUTHORITY_LOCKS.values()))
        source = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("groundStateAccepted\": True", source)
        self.assertNotIn("physicalAuthority\": True", source)
        before_entry = source.split("def execute_one_global_root_attempt", 1)[0]
        self.assertNotIn("solve_bvp(", before_entry)


if __name__ == "__main__":
    unittest.main()
