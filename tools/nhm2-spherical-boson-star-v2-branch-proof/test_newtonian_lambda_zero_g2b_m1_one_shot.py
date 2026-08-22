"""Pre-execution tests for the frozen G2B-M1 one-shot runner."""

from __future__ import annotations

import ast
from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest


SOURCE = Path(__file__).with_name("newtonian_lambda_zero_g2b_m1_one_shot.py")
SPECIFICATION = importlib.util.spec_from_file_location("g2b_m1_runner", SOURCE)
if SPECIFICATION is None or SPECIFICATION.loader is None:
    raise RuntimeError("g2b_m1_runner_spec_unavailable")
RUNNER = importlib.util.module_from_spec(SPECIFICATION)
sys.modules[SPECIFICATION.name] = RUNNER
SPECIFICATION.loader.exec_module(RUNNER)

OLD_CENTER = (
    RUNNER.ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "lambda-zero-global-root-primary-v1.json"
)
DIAGNOSIS = (
    RUNNER.ROOT
    / "artifacts"
    / "nhm2-spherical-boson-star-v2-g2"
    / "g2-r1-exact-hermite-diagnosis-v1.json"
)


def _record_fraction(value: dict[str, str]) -> Fraction:
    return Fraction(int(value["numerator"]), int(value["denominator"]))


class G2BM1OneShotTests(unittest.TestCase):
    def test_exact_static_bindings(self) -> None:
        for path, size, digest in (
            (RUNNER.PROPOSAL_PATH, RUNNER.PROPOSAL_SIZE_BYTES, RUNNER.PROPOSAL_SHA256),
            (RUNNER.ENGINE_PATH, RUNNER.ENGINE_SIZE_BYTES, RUNNER.ENGINE_SHA256),
            (
                RUNNER.ENGINE_SPEC_PATH,
                RUNNER.ENGINE_SPEC_SIZE_BYTES,
                RUNNER.ENGINE_SPEC_SHA256,
            ),
            (
                RUNNER.PROJECTION_PATH,
                RUNNER.PROJECTION_SIZE_BYTES,
                RUNNER.PROJECTION_SHA256,
            ),
        ):
            self.assertEqual(path.stat().st_size, size)
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)

    def test_old_center_exact_hermite_oracle_is_reproduced(self) -> None:
        center = json.loads(OLD_CENTER.read_bytes())
        diagnosis = json.loads(DIAGNOSIS.read_bytes())["result"]
        observed = RUNNER._exact_center_residual(center)
        expected = _record_fraction(diagnosis["hermiteNormalizedResidualExact"])
        self.assertEqual(observed, expected)

    def test_old_projection_exact_polynomial_oracle_is_reproduced(self) -> None:
        center = json.loads(OLD_CENTER.read_bytes())
        diagnosis = json.loads(DIAGNOSIS.read_bytes())["result"]
        observed = RUNNER._exact_projected_residual(center)
        expected = _record_fraction(diagnosis["polynomialNormalizedResidualExact"])
        self.assertEqual(observed, expected)

    def test_classifier_preserves_center_and_codec_causality(self) -> None:
        margin = RUNNER.CENTER_MARGIN
        self.assertEqual(
            RUNNER._classify(margin + Fraction(1, 10**20), Fraction(0)),
            "GLOBAL_CENTER_SUCCESSOR_FAILED",
        )
        self.assertEqual(
            RUNNER._classify(Fraction(0), margin + Fraction(1, 10**20)),
            "CENTER_RECOVERED_CODEC_OR_MODE_SUCCESSOR_REQUIRED",
        )
        self.assertEqual(
            RUNNER._classify(margin, margin),
            "CENTER_AND_FROZEN_PROJECTION_RECOVERED",
        )

    def test_self_hash_is_domain_and_length_delimited(self) -> None:
        unsigned = {"authority": False, "decision": "synthetic"}
        raw = RUNNER._canonical(unsigned)
        expected = hashlib.sha256(
            RUNNER.RECEIPT_DOMAIN
            + len(raw).to_bytes(8, "little")
            + raw
        ).hexdigest()
        self.assertEqual(RUNNER._self_hash(unsigned), expected)
        self.assertNotEqual(
            RUNNER._self_hash(unsigned),
            hashlib.sha256(raw).hexdigest(),
        )

    def test_wrong_command_is_blocked_before_execution(self) -> None:
        with self.assertRaisesRegex(
            RUNNER.G2BM1OneShotError, "g2b_m1_exact_command_required"
        ):
            RUNNER._main([])
        self.assertFalse(RUNNER.OUTPUT_PATH.exists())

    def test_static_surface_has_no_scipy_numpy_or_network(self) -> None:
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
        for forbidden in ("numpy", "scipy", "socket", "requests", "subprocess"):
            self.assertNotIn(forbidden, imports)
        self.assertIn("--execute-once", raw.decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
