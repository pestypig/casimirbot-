"""Independent read-only audit of the B4-R3 reconciliation receipt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import struct
import unittest

import gmpy2


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r3-initializer-predictor-binding-v1"
RECEIPT = OUTPUT / "receipt.json"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r3-predictor-path-reconciliation/v1\n"


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


class G2BB4R3IndependentAuditTests(unittest.TestCase):
    def test_exact_single_file_inventory(self) -> None:
        self.assertEqual([path.name for path in OUTPUT.iterdir()], ["receipt.json"])
        raw = RECEIPT.read_bytes()
        self.assertEqual((len(raw), digest(raw)), (5_971, "e5f22ce8fd9814d55395d1ea585c650a412520ccccaa1c51be072d2f68dcfd5b"))

    def test_canonical_self_hash_and_false_authority(self) -> None:
        raw = RECEIPT.read_bytes()
        receipt = json.loads(raw)
        self.assertEqual(canonical(receipt), raw)
        observed = receipt.pop("receiptSha256")
        unsigned = canonical(receipt)
        expected = digest(DOMAIN + struct.pack("<Q", len(unsigned)) + unsigned)
        self.assertEqual(observed, "c067e2109f1aeba8bb3f1329d3ddf3c6db8663e1c35c4e35d443d86a896738d3")
        self.assertEqual(observed, expected)
        self.assertEqual(receipt["status"], "PASS")
        self.assertFalse(receipt["fourGridExecutionAuthorized"])
        self.assertFalse(receipt["gridGenerated"])
        self.assertFalse(receipt["newtonExecuted"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))

    def test_every_emitted_path_resolves_to_its_recorded_bytes(self) -> None:
        receipt = json.loads(RECEIPT.read_bytes())
        for binding in receipt["orderedPayloadBindings"]:
            path = ROOT / binding["path"]
            raw = path.read_bytes()
            self.assertIn("g2b-b4-r1-initializer-scalar-abi-v1", binding["path"])
            self.assertEqual((len(raw), digest(raw)), (binding["sizeBytes"], binding["rawSha256"]))

    def test_independent_mpfr512_origin_reconstruction(self) -> None:
        receipt = json.loads(RECEIPT.read_bytes())
        bindings = {binding["ordinal"]: binding for binding in receipt["orderedPayloadBindings"]}
        u_raw = (ROOT / bindings[1]["path"]).read_bytes()
        v_raw = (ROOT / bindings[2]["path"]).read_bytes()
        scalars = struct.unpack("<9d", (ROOT / bindings[0]["path"]).read_bytes())
        u = struct.unpack("<128d", u_raw)
        v = struct.unpack("<128d", v_raw)
        template = gmpy2.get_context().copy()
        template.precision = 512
        template.round = gmpy2.RoundToNearest
        with gmpy2.context(template):
            base_u = sum((gmpy2.mpfr(value) if ordinal % 2 == 0 else -gmpy2.mpfr(value)) for ordinal, value in enumerate(u))
            base_v = sum((gmpy2.mpfr(value) if ordinal % 2 == 0 else -gmpy2.mpfr(value)) for ordinal, value in enumerate(v))
            lam2 = (gmpy2.mpfr(1) / gmpy2.mpfr(32)) ** 2
            words = {
                "baseU": struct.pack(">d", float(base_u)).hex(),
                "baseV": struct.pack(">d", float(base_v)).hex(),
                "F0": struct.pack(">d", float(lam2 * base_v)).hex(),
                "F1": struct.pack(">d", -float(lam2 * base_v)).hex(),
                "varphi": struct.pack(">d", float(lam2 * base_u)).hex(),
                "w": struct.pack(">d", scalars[8]).hex(),
                "firstTargetAmplitude": struct.pack(">d", 2.0 ** -16).hex(),
                "terminalTargetAmplitude": struct.pack(">d", 2.0 ** -10).hex(),
            }
        self.assertEqual(words, receipt["originWords"])

    def test_policy_chronology_is_predictor_not_equality(self) -> None:
        receipt = json.loads(RECEIPT.read_bytes())
        policy_binding = next(item for item in receipt["sourceBindings"] if item["role"] == "branch_selection_policy")
        policy = (ROOT / policy_binding["path"]).read_text(encoding="utf-8")
        sequence = (
            "materialize_same_frozen_initializer_evaluator_output_at_lambda_2^-5",
            "use_that_output_as_caller_initializer_for_A_2^-16",
            "run_complete_frozen_amplitude_schedule_through_A_2^-10",
        )
        positions = tuple(policy.index(literal) for literal in sequence)
        self.assertEqual(positions, tuple(sorted(positions)))
        self.assertEqual(receipt["initializerPayloadTransformation"], "IDENTITY_NO_BYTE_CHANGES")
        self.assertTrue(receipt["predictorPassedToContinuationUnchanged"])
        self.assertFalse(receipt["firstTargetOriginEqualityRequiredBeforeNewton"])


if __name__ == "__main__":
    unittest.main()
