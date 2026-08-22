"""Pre-execution tests for the frozen proof-center projection.

Program gate: G2 — classical branch proof and terminal state
Workstream: lambda-zero limiting-ground-state proof closure
Capability or component: core/tail representation transform
Current maturity: unexecuted deterministic transform
Target maturity: audited source frozen before the one projection
Required frozen inputs: immutable center and projection proposal
Required evidence: DCT algebra, codecs, bindings, hostile ingress, locks
Stop/fail criteria: any transform drift or actual projection execution
Explicit non-goals: consuming the real center, proof, candidate, or lamp
Downstream gate unlocked: one exact projection execution
"""

from __future__ import annotations

import hashlib
import importlib.util
import inspect
import math
from fractions import Fraction
from pathlib import Path
import struct
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "newtonian_lambda_zero_proof_center_projection.py"


def _load() -> object:
    spec = importlib.util.spec_from_file_location(
        "_nhm2_lambda_zero_proof_center_projection_test", SOURCE
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


M = _load()


class ProofCenterProjectionTests(unittest.TestCase):
    def test_public_surface_and_frozen_bindings(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "AUTHORITY_LOCKS",
                "PROJECTION_VERSION",
                "ProofCenterProjectionError",
                "materialize_proof_center",
            ],
        )
        self.assertEqual(
            tuple(inspect.signature(M.materialize_proof_center).parameters),
            ("output_root",),
        )
        raw = M.INPUT_PATH.read_bytes()
        self.assertEqual(len(raw), M.INPUT_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), M.INPUT_RAW_SHA256)
        proposal = M.PROPOSAL_PATH.read_bytes()
        self.assertEqual(len(proposal), M.PROPOSAL_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(proposal).hexdigest(), M.PROPOSAL_RAW_SHA256
        )

    def test_dct_i_round_trips_each_low_mode_at_all_nodes(self) -> None:
        count = M.CORE_MODE_COUNT
        rho = tuple(
            (1.0 - math.cos(math.pi * index / (count - 1))) / 2.0
            for index in range(count)
        )
        for selected in (0, 1, 2, 7, 31, 126, 127):
            values = tuple(
                math.cos(selected * math.acos(2.0 * item - 1.0))
                for item in rho
            )
            coefficients = M._dct_i(values)
            for ordinal, item in enumerate(rho):
                self.assertAlmostEqual(
                    M._evaluate_chebyshev(coefficients, item),
                    values[ordinal],
                    delta=3e-13,
                )

    def test_constant_and_affine_coefficients_have_expected_shape(self) -> None:
        constant = M._dct_i((1.0,) * M.CORE_MODE_COUNT)
        self.assertAlmostEqual(constant[0], 1.0, delta=1e-14)
        self.assertLess(max(abs(item) for item in constant[1:]), 2e-14)
        rho = tuple(
            index / (M.CORE_MODE_COUNT - 1)
            for index in range(M.CORE_MODE_COUNT)
        )
        values = tuple(2.0 * item - 1.0 for item in rho)
        coefficients = M._dct_i(values)
        self.assertTrue(all(math.isfinite(item) for item in coefficients))

    def test_origin_recurrence_satisfies_exact_rows(self) -> None:
        vc = -1.25
        nu = -0.625
        nu_exact = Fraction.from_float(nu)
        a, b = M._origin_coefficients(vc, nu)
        for shell in range(16):
            denominator = (2 * shell + 2) * (2 * shell + 3)
            ba = sum(b[k] * a[shell - k] for k in range(shell + 1))
            aa = sum(a[k] * a[shell - k] for k in range(shell + 1))
            self.assertEqual(
                a[shell + 1],
                2 * (ba - nu_exact * a[shell]) / denominator,
            )
            self.assertEqual(b[shell + 1], aa / denominator)

    def test_payload_codec_is_little_endian_and_normalizes_negative_zero(self) -> None:
        raw = M._encode_f64le((1.0, -0.0, -2.5))
        self.assertEqual(len(raw), 24)
        self.assertEqual(struct.unpack("<ddd", raw), (1.0, 0.0, -2.5))
        self.assertEqual(raw[8:16], bytes(8))

    def test_hostile_public_ingress_fails_without_traversal(self) -> None:
        class Hostile:
            def __str__(self) -> str:
                raise AssertionError("traversed")

        for value in (None, 1, b"x", Hostile()):
            with self.subTest(value=type(value).__name__):
                with self.assertRaises(M.ProofCenterProjectionError) as caught:
                    M.materialize_proof_center(value)
                self.assertEqual(
                    caught.exception.code, "projection_output_root_invalid"
                )

    def test_collision_fails_before_input_projection(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "existing"
            target.mkdir()
            with self.assertRaises(M.ProofCenterProjectionError) as caught:
                M.materialize_proof_center(str(target))
            self.assertEqual(caught.exception.code, "projection_output_collision")

    def test_authority_is_false_and_real_projection_did_not_run(self) -> None:
        self.assertFalse(any(M.AUTHORITY_LOCKS.values()))
        source = SOURCE.read_text(encoding="utf-8")
        before_public = source.split("def materialize_proof_center", 1)[0]
        self.assertNotIn("_project(value)", before_public)
        self.assertNotIn('"proofComplete": True', source)
        self.assertNotIn('"physicalAuthority": True', source)


if __name__ == "__main__":
    unittest.main()
