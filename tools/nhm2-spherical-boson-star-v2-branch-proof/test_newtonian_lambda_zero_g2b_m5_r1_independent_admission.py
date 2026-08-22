"""Pre-execution tests for G2B-M5-R1 independent exact admission."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


SOURCE = Path(__file__).with_name(
    "newtonian_lambda_zero_g2b_m5_r1_independent_admission.py"
)
SPEC = importlib.util.spec_from_file_location("g2b_m5_r1", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_m5_r1_spec_unavailable")
M = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = M
SPEC.loader.exec_module(M)

RECEIPT_RAW_SHA256 = (
    "41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83"
)
RECEIPT_SIZE_BYTES = 12_888
RECEIPT_SELF_SHA256 = (
    "c37c0a329765c558c99e559bfede6aed815244f372d289085953f7aed097d1a8"
)


class G2BM5R1Tests(unittest.TestCase):
    def test_frozen_inputs_and_receipt_self_hash(self) -> None:
        M._verify(M.PACKET_PATH, M.PACKET_SIZE_BYTES, M.PACKET_SHA256, "packet")
        M._verify(
            M.M5_SOURCE_PATH,
            M.M5_SOURCE_SIZE_BYTES,
            M.M5_SOURCE_SHA256,
            "m5_source",
        )
        root = M._load_json(
            M.M5_RECEIPT_PATH,
            M.M5_RECEIPT_SIZE_BYTES,
            M.M5_RECEIPT_SHA256,
            "m5_receipt",
        )
        M._verify_self_hash(
            root,
            M.M5_RECEIPT_DOMAIN,
            M.M5_RECEIPT_SELF_SHA256,
            "m5",
        )

    def test_selected_center_is_exact_m3_observation(self) -> None:
        m5 = json.loads(M.M5_RECEIPT_PATH.read_bytes())
        m3 = json.loads(M.M3_RECEIPT_PATH.read_bytes())
        self.assertEqual(m5["selectedCenterReplay"], m3["centerObservations"][3])
        self.assertEqual(m5["selectedModeCount"], 128)

    def test_coefficient_bindings_are_independently_rehashed(self) -> None:
        root = json.loads(M.M5_RECEIPT_PATH.read_bytes())
        for record in root["projectionRecords"]:
            count = record["modeCount"]
            for component in ("u", "v"):
                values = M._coefficient_binding(
                    record[f"{component}CoefficientBinding"],
                    count,
                    f"{component}:{count}",
                )
                self.assertEqual(len(values), count)

    def test_independent_chebyshev_operators(self) -> None:
        coefficients = (Fraction(1), Fraction(2), Fraction(3))
        derivative = M._chebyshev_derivative(coefficients)
        self.assertEqual(derivative, (Fraction(2), Fraction(12)))
        self.assertEqual(
            M._chebyshev_value(coefficients, Fraction(1, 2)),
            Fraction(1, 2),
        )

    def test_projected_residual_rejects_a_non_solution(self) -> None:
        residual = M._projected_residual(
            (Fraction(1), Fraction(0)),
            (Fraction(0), Fraction(0)),
            Fraction(-1, 2),
        )
        self.assertGreater(residual, M.MARGIN)

    def test_source_does_not_import_m5_or_use_its_residual_helper(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("import newtonian_lambda_zero_g2b_m5", text)
        self.assertNotIn("m5._projected_residual", text)
        self.assertIn("def _projected_residual(", text)
        self.assertIn('"noProjectionRerun": True', text)

    def test_dependency_hashes_and_postexecution_receipt(self) -> None:
        for path, digest in (
            (M.PACKET_PATH, M.PACKET_SHA256),
            (M.M5_SOURCE_PATH, M.M5_SOURCE_SHA256),
            (M.M5_RECEIPT_PATH, M.M5_RECEIPT_SHA256),
            (M.M3_RECEIPT_PATH, M.M3_RECEIPT_SHA256),
            (M.ENGINE_PATH, M.ENGINE_SHA256),
        ):
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), digest)
        raw = M.OUTPUT_PATH.read_bytes()
        self.assertEqual(len(raw), RECEIPT_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), RECEIPT_RAW_SHA256)
        root = json.loads(raw)
        unsigned = {key: value for key, value in root.items() if key != "receiptSha256"}
        canonical = M._canonical(unsigned)
        observed = hashlib.sha256(
            M.RECEIPT_DOMAIN + struct.pack("<Q", len(canonical)) + canonical
        ).hexdigest()
        self.assertEqual(observed, RECEIPT_SELF_SHA256)
        self.assertEqual(root["receiptSha256"], RECEIPT_SELF_SHA256)
        self.assertEqual(root["decision"], "INDEPENDENT_CORE_DUTY_PASS")
        self.assertIsNone(root["firstFailure"])
        self.assertEqual(root["selectedModeCount"], 128)
        self.assertTrue(all(check["eligible"] for check in root["modeChecks"]))
        self.assertTrue(
            all(check["storedResidualExactMatch"] for check in root["modeChecks"])
        )
        with self.assertRaisesRegex(M.G2BM5R1Error, "exact_command_required"):
            M._main([])


if __name__ == "__main__":
    unittest.main()
