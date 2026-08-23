"""Independent read-only audit of the immutable G2B-B4-R2 terminal evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import struct
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r2-four-grid-v1"
PRE = OUTPUT / "preexecution-binding.json"
TERMINAL = OUTPUT / "terminal-receipt.json"
OLD_SCALARS = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/scalars.f64le"
PRE_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-preexecution-binding/v1\n"
TERMINAL_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def verify_self_hash(raw: bytes, domain: bytes) -> dict[str, object]:
    value = json.loads(raw)
    assert canonical(value) == raw
    unsigned = dict(value)
    observed = unsigned.pop("receiptSha256")
    payload = canonical(unsigned)
    assert observed == digest(domain + struct.pack("<Q", len(payload)) + payload)
    return value


class G2BB4R2TerminalEvidenceTests(unittest.TestCase):
    def test_exact_inventory_includes_empty_level64_directory(self) -> None:
        self.assertEqual(sorted(path.name for path in OUTPUT.iterdir()), ["level-64", "preexecution-binding.json", "terminal-receipt.json"])
        self.assertEqual(list((OUTPUT / "level-64").iterdir()), [])
        observed = {path.name: (len(path.read_bytes()), digest(path.read_bytes())) for path in OUTPUT.iterdir() if path.is_file()}
        self.assertEqual(observed, {
            "preexecution-binding.json": (7_262, "3d850a6f63cc22088920b18f013c5b9adbc7c094f28b94a4414e25653d1f9ed5"),
            "terminal-receipt.json": (1_161, "16d9f8e2914076ed31e00b37df8b4fd135c81b36a45b9f4f092612c85420d474"),
        })

    def test_self_hashes_and_corrected_parent_binding(self) -> None:
        pre = verify_self_hash(PRE.read_bytes(), PRE_DOMAIN)
        terminal = verify_self_hash(TERMINAL.read_bytes(), TERMINAL_DOMAIN)
        self.assertEqual(pre["receiptSha256"], "2c89a6c85844468a79cf7a4485b3d8e758e8d46185f3d3294089dd138211d4b2")
        self.assertEqual(terminal["receiptSha256"], "cafa0a8d0bc63ec3c8c166ef63e7be9cc52be278c79a0c112ed69763ab8a42f0")
        self.assertEqual(pre["initializerPersistenceReceiptSha256"], "15c73b1e1ad1583dddf85f2276f661b3016704b113d02a26a995a49863d7e682")
        self.assertEqual(terminal["preexecutionBindingSha256"], pre["receiptSha256"])

    def test_first_failure_zero_work_and_locks(self) -> None:
        terminal = json.loads(TERMINAL.read_bytes())
        self.assertEqual(terminal["status"], "FAIL")
        self.assertEqual(terminal["decision"], "STOPPED_AT_FIRST_EXECUTION_EXCEPTION")
        self.assertEqual(terminal["firstFailure"], {"code": "g2b_b4_initializer_origin_amplitude_mismatch", "detail": "", "levelIndex": 0})
        self.assertEqual(terminal["attemptedLevelCount"], 0)
        self.assertEqual(terminal["levelReceipts"], [])
        self.assertFalse(terminal["allFourLevelsCompleted"])
        self.assertFalse(terminal["allThreeAdjacentPairsEvaluated"])
        self.assertFalse(terminal["vacuumContinuationWorkUnlocked"])
        self.assertTrue(terminal["noRetry"])
        self.assertTrue(terminal["noRetune"])
        self.assertTrue(all(value is False for value in terminal["authorityLocks"].values()))

    def test_audit_exposes_payload_path_alias_defect(self) -> None:
        pre = json.loads(PRE.read_bytes())
        scalar = next(item for item in pre["sourceAndPayloadBindings"] if item["role"] == "initializer_payload_0")
        self.assertEqual(scalar["rawSha256"], "47f2858a2332d5fd079eae07c6301b745e91d0219155528deb7158a79e1bd21a")
        self.assertEqual(scalar["path"], "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b1-r1-initializer-v1/scalars.f64le")
        self.assertEqual(digest(OLD_SCALARS.read_bytes()), "da88f738edbcc722b83a1c780fff4c32316f7e6145445b883ef28e31d2793fc1")
        self.assertNotEqual(digest(OLD_SCALARS.read_bytes()), scalar["rawSha256"])


if __name__ == "__main__":
    unittest.main()
