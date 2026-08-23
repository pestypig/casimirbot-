"""Read-only independent audit of the sole B4-R4 terminal evidence.

This module deliberately does not import the producer or numerical solver.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import stat
import struct
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1"
PREEXECUTION = OUTPUT / "preexecution-binding.json"
TERMINAL = OUTPUT / "terminal-receipt.json"
PREEXECUTION_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-preexecution-binding/v1\n"
TERMINAL_DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def read_canonical(path: Path) -> tuple[bytes, dict[str, object]]:
    metadata = path.lstat()
    assert stat.S_ISREG(metadata.st_mode) and not stat.S_ISLNK(metadata.st_mode)
    raw = path.read_bytes()
    value = json.loads(raw)
    assert type(value) is dict and canonical(value) == raw
    return raw, value


def verify_self_hash(value: dict[str, object], domain: bytes) -> str:
    unsigned = dict(value)
    observed = unsigned.pop("receiptSha256")
    raw = canonical(unsigned)
    assert observed == sha(domain + struct.pack("<Q", len(raw)) + raw)
    return observed


class G2BB4R4IndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.pre_raw, cls.pre = read_canonical(PREEXECUTION)
        cls.terminal_raw, cls.terminal = read_canonical(TERMINAL)

    def test_exact_terminal_inventory_and_chronology(self) -> None:
        expected = {
            "preexecution-binding.json", "level-64/initializer-state.f64le",
            "level-64/stage-00-state.f64le", "level-64/stage-00.json",
            "level-64/level-receipt.json", "terminal-receipt.json",
        }
        observed = {path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file()}
        self.assertEqual(observed, expected)
        ordered = [PREEXECUTION, OUTPUT / "level-64/initializer-state.f64le", OUTPUT / "level-64/stage-00-state.f64le", OUTPUT / "level-64/stage-00.json", OUTPUT / "level-64/level-receipt.json", TERMINAL]
        mtimes = [path.stat().st_mtime_ns for path in ordered]
        self.assertEqual(mtimes, sorted(mtimes))
        self.assertFalse(any((OUTPUT / f"level-{n}").exists() for n in (96, 128, 256)))
        self.assertFalse((OUTPUT / "cross-grid-receipt.json").exists())

    def test_receipt_self_hashes_and_terminal_binding(self) -> None:
        pre_hash = verify_self_hash(self.pre, PREEXECUTION_DOMAIN)
        terminal_hash = verify_self_hash(self.terminal, TERMINAL_DOMAIN)
        self.assertEqual(pre_hash, "f8e75820961d5812bb21d1d3fd23bc6720ec57a2b7472519b1857ff02bb8ba63")
        self.assertEqual(terminal_hash, "361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28")
        self.assertEqual(self.terminal["preexecutionBindingSha256"], pre_hash)
        self.assertEqual(sha(self.pre_raw), "58e17389d77c136331c7fcbc2a03d9a6cf875d181cff8086ee17f0338f6302c3")
        self.assertEqual(sha(self.terminal_raw), "4a76e65331e6b6244fe9fbf9437552a4f450423eb1d57ee0b8e42d6452de9204")

    def test_all_preexecution_bindings_reopen_exactly(self) -> None:
        self.assertEqual(self.pre["packetSha256"], "cc4f81c0fb37bb84d35adb7bc84e3e9322d0f4b10186e0bb734d5d5afeba5acc")
        payload_count = 0
        for binding in self.pre["sourceAndPayloadBindings"]:
            path = ROOT / binding["path"]
            raw = path.read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))
            if binding["role"].startswith("initializer_payload_"):
                payload_count += 1
                self.assertIn("g2b-b4-r1-initializer-scalar-abi-v1", binding["path"])
                self.assertNotIn("g2b-b1-r1-initializer-v1/coefficients", binding["path"])
        self.assertEqual(payload_count, 6)

    def test_level_and_stage_bindings_rehash(self) -> None:
        level = self.terminal["levelReceipts"][0]
        level_raw, level_disk = read_canonical(OUTPUT / level["levelReceiptBinding"]["path"])
        self.assertEqual((len(level_raw), sha(level_raw)), (level["levelReceiptBinding"]["sizeBytes"], level["levelReceiptBinding"]["rawSha256"]))
        embedded = dict(level)
        embedded.pop("levelReceiptBinding")
        self.assertEqual(embedded, level_disk)
        for binding in (level["initializerBinding"], level["stageReceipts"][0]["metadata"]["stateBinding"], level["stageReceipts"][0]["metadataBinding"]):
            raw = (OUTPUT / binding["path"]).read_bytes()
            self.assertEqual((len(raw), sha(raw)), (binding["sizeBytes"], binding["rawSha256"]))

    def test_predictor_target_and_terminal_failure_are_consistent(self) -> None:
        initializer = struct.unpack("<193d", (OUTPUT / "level-64/initializer-state.f64le").read_bytes())
        stage = struct.unpack("<193d", (OUTPUT / "level-64/stage-00-state.f64le").read_bytes())
        self.assertEqual(struct.pack(">d", initializer[128]).hex(), "3f50000000000000")
        self.assertEqual(struct.pack(">d", stage[128]).hex(), "3ef0000000000000")
        failure = self.terminal["firstFailure"]
        self.assertEqual(failure, {"code": "armijo_schedule_exhausted_without_retry", "levelId": "L0", "nodeCount": 64, "stageIndex": 0})
        metadata = self.terminal["levelReceipts"][0]["stageReceipts"][0]["metadata"]
        self.assertEqual(metadata["newtonAcceptedUpdateCount"], 29)
        self.assertEqual(len(metadata["newtonAcceptedAlphaExponents"]), 29)
        self.assertEqual(metadata["newtonResidualLinfBinary64Word"], "3e30c0da3244efc6")
        self.assertEqual(metadata["newtonScaledStepLinfBinary64Word"], "3d8175bbd24b9a49")
        self.assertFalse(metadata["varphiNodesNonincreasing"])

    def test_fail_closed_authority_and_no_retry(self) -> None:
        self.assertEqual(self.terminal["status"], "FAIL")
        self.assertEqual(self.terminal["decision"], "STOPPED_AT_FIRST_SOLVE_FAILURE")
        self.assertEqual(self.terminal["attemptedLevelCount"], 1)
        self.assertFalse(self.terminal["allFourLevelsCompleted"])
        self.assertFalse(self.terminal["allThreeAdjacentPairsEvaluated"])
        self.assertFalse(self.terminal["vacuumContinuationWorkUnlocked"])
        self.assertTrue(self.terminal["noRetry"] and self.terminal["noRetune"])
        self.assertTrue(all(value is False for value in self.terminal["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
