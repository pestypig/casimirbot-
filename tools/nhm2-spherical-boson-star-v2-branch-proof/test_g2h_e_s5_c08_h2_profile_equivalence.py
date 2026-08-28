from __future__ import annotations

import importlib.util
import json
import pathlib
import tempfile
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_profile_equivalence.py"
SPEC = importlib.util.spec_from_file_location("h2_profile_equivalence", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def record(milliseconds: int, elementary: int = 43) -> dict[str, object]:
    return {
        "schema": "nhm2.g2h_e_s5.c08_h2_timing_calibration.v1",
        "status": "PROGRESS",
        "exponent": 0,
        "u_panels": 1,
        "candidate_milliseconds": milliseconds,
        "cumulative_milliseconds": milliseconds,
        "candidate_elementary_convolutions": elementary,
        "cumulative_subpanels": 1,
        "cumulative_elementary_convolutions": elementary,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }


class H2ProfileEquivalenceTests(unittest.TestCase):
    def write(self, directory: pathlib.Path, name: str,
              records: list[dict[str, object]]) -> pathlib.Path:
        path = directory / name
        path.write_text("".join(json.dumps(item, separators=(",", ":")) + "\n"
                                for item in records), encoding="utf-8")
        return path

    def test_timing_only_difference_passes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = pathlib.Path(temporary)
            baseline = self.write(directory, "baseline.ndjson", [record(10)])
            profile = self.write(directory, "profile.ndjson", [record(99)])
            receipt = MODULE.compare(baseline, profile)
            self.assertEqual(receipt["status"], "PASS")
            self.assertTrue(receipt["semantic_records_equal"])
            self.assertEqual(receipt["baseline_semantic_sha256"],
                             receipt["profile_semantic_sha256"])

    def test_semantic_difference_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = pathlib.Path(temporary)
            baseline = self.write(directory, "baseline.ndjson", [record(10)])
            profile = self.write(directory, "profile.ndjson", [record(10, 42)])
            receipt = MODULE.compare(baseline, profile)
            self.assertEqual(receipt["status"], "FAIL")
            self.assertFalse(receipt["semantic_records_equal"])

    def test_duplicate_key_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = pathlib.Path(temporary) / "duplicate.ndjson"
            path.write_text('{"status":"PASS","status":"FAIL"}\n',
                            encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate JSON key"):
                MODULE.load_records(path)

    def test_authority_promotion_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = pathlib.Path(temporary)
            promoted = record(10)
            promoted["authority_promoted"] = True
            baseline = self.write(directory, "baseline.ndjson", [promoted])
            profile = self.write(directory, "profile.ndjson", [promoted])
            receipt = MODULE.compare(baseline, profile)
            self.assertEqual(receipt["status"], "FAIL")


if __name__ == "__main__":
    unittest.main()
