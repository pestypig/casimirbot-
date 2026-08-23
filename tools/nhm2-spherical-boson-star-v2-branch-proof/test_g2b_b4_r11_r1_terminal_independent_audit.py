"""Producer-independent audit of the immutable B4-R11-R1 receipt.

Imports no R11 producer, R11-R1 wrapper, equation evaluator, LU, Newton, or
continuation module. Performs no writes and no candidate solve.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import stat
import struct
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r11-r1-terminal-equivalence-diagnosis-v1"
RECEIPT = OUTPUT / "receipt.json"
R4_STAGE = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00.json"
R4_STATE = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r4-four-grid-v1/level-64/stage-00-state.f64le"
R10_STAGE = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/level-64/stage-00.json"
R10_STATE = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r10-four-grid-v1/level-64/stage-00-state.f64le"
DOMAIN = b"nhm2-spherical-boson-star-v2/g2b-b4-r11-r1-terminal-equivalence/v1\n"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def word(value: float) -> str:
    return struct.pack(">d", float(value)).hex()


def from_word(value: object) -> float:
    return struct.unpack(">d", bytes.fromhex(str(value)))[0]


class B4R11R1IndependentAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.raw = RECEIPT.read_bytes()
        cls.value = json.loads(cls.raw.decode("ascii"))
        cls.r4_stage = json.loads(R4_STAGE.read_text(encoding="ascii"))
        cls.r10_stage = json.loads(R10_STAGE.read_text(encoding="ascii"))

    def test_exact_one_file_inventory_and_absent_failed_root(self) -> None:
        files = sorted(path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob("*") if path.is_file())
        self.assertEqual(files, ["receipt.json"])
        self.assertFalse((ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r11-terminal-equivalence-diagnosis-v1").exists())

    def test_canonical_receipt_and_self_hash(self) -> None:
        self.assertEqual(self.raw, canonical(self.value))
        unsigned = dict(self.value)
        claimed = unsigned.pop("receiptSha256")
        raw_unsigned = canonical(unsigned)
        self.assertEqual(claimed, sha(DOMAIN + struct.pack("<Q", len(raw_unsigned)) + raw_unsigned))

    def test_all_source_bindings_rehash(self) -> None:
        bindings = self.value["sourceAndInputBindings"]
        self.assertEqual(len(bindings), 21)
        for item in bindings:
            path = ROOT.joinpath(*item["path"].split("/"))
            metadata = path.lstat()
            raw = path.read_bytes()
            self.assertTrue(stat.S_ISREG(metadata.st_mode))
            self.assertFalse(stat.S_ISLNK(metadata.st_mode))
            self.assertEqual(len(raw), item["sizeBytes"])
            self.assertEqual(sha(raw), item["rawSha256"])

    def test_recorded_correction_trace_and_domain_trials(self) -> None:
        trace = dict(self.r10_stage["linearCorrectionTraces"][29])
        trace.pop("update_index")
        self.assertEqual(self.value["correctionTrace"], trace)
        self.assertTrue(self.value["correctionTraceMatchesRecordedR10"])
        state_w = struct.unpack("<193d", R10_STATE.read_bytes())[-1]
        direction_w = from_word(self.value["directionWBinary64Word"])
        trials = self.value["domainTrials"]
        self.assertEqual(len(trials), 25)
        for exponent, item in enumerate(trials):
            expected_w = state_w + (2.0**-exponent) * direction_w
            self.assertEqual(item["exponent"], exponent)
            self.assertEqual(item["wBinary64Word"], word(expected_w))
            self.assertTrue(math.isfinite(expected_w))
            self.assertFalse(0.0 < expected_w < 1.0)
            self.assertEqual(item["classification"], "DOMAIN_REJECTED")
        self.assertEqual(self.value["domainEligibleTrialCount"], 0)
        self.assertTrue(self.value["allTrialsDomainRejected"])

    def test_r4_r10_comparison_recomputes(self) -> None:
        r4 = struct.unpack("<193d", R4_STATE.read_bytes())
        r10 = struct.unpack("<193d", R10_STATE.read_bytes())
        differences = tuple(abs(a - b) for a, b in zip(r10, r4))
        maximum = max(differences)
        comparison = self.value["r4R10Comparison"]
        self.assertEqual(self.r4_stage["newtonAcceptedAlphaExponents"], self.r10_stage["newtonAcceptedAlphaExponents"])
        self.assertTrue(comparison["acceptedExponentChronologyExactlyEqual"])
        self.assertEqual(comparison["maximumStateAbsoluteDifferenceBinary64Word"], word(maximum))
        self.assertEqual(comparison["maximumStateDifferenceOrdinal"], differences.index(maximum))
        self.assertEqual(comparison["frequencyAbsoluteDifferenceBinary64Word"], word(abs(r10[-1] - r4[-1])))
        for key, field in (("residualRatioBinary64Word", "newtonResidualLinfBinary64Word"), ("scaledStepRatioBinary64Word", "newtonScaledStepLinfBinary64Word"), ("unusedConstraintRatioBinary64Word", "unusedConstraintLinfBinary64Word")):
            self.assertEqual(comparison[key], word(from_word(self.r10_stage[field]) / from_word(self.r4_stage[field])))

    def test_terminal_decision_and_locks(self) -> None:
        self.assertEqual(self.value["status"], "PASS")
        self.assertEqual(self.value["decision"], "CLOSE_FROZEN_BRANCH_NO_SUPPORTED_SUCCESSOR")
        self.assertEqual(self.value["decisionPredicates"], {
            "priorUniqueProposalClassAbsent": True,
            "r10ImmediateDomainObstructionReproduced": True,
            "recordedBytesIdentifyUniqueRemainingProposal": False,
            "soleR8R9InterventionFalsified": True,
        })
        for flag in ("candidateSolveInvoked", "newtonInvoked", "continuationInvoked", "trialResidualEvaluated", "armijoMeritEvaluated", "stateUpdateComputedOrPersisted", "b4R10Retried", "b4R11Retried", "candidateAdmission"):
            self.assertFalse(self.value[flag])
        self.assertTrue(self.value["noRetune"])
        self.assertFalse(any(self.value["authorityLocks"].values()))


if __name__ == "__main__":
    unittest.main()
