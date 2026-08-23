from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
MODULE_PATH = HERE / "g2d_fluid_star_preregistration_guard.py"
SPEC = importlib.util.spec_from_file_location("g2d_prereg_guard", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
GUARD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(GUARD)


class G2DFluidStarPreregistrationGuardTests(unittest.TestCase):
    def test_canonical_tree_passes_without_candidate_sources_or_root(self) -> None:
        result = GUARD.validate(REPO)
        self.assertEqual(result["status"], "PASS_NO_EXECUTION")
        self.assertTrue(result["futureOutputRootAbsent"])
        self.assertTrue(result["candidateEvaluatorSourcesAbsent"])
        self.assertFalse(result["executionAuthorized"])

    def test_manifest_freezes_only_exact_string_parameters(self) -> None:
        payload = json.loads((REPO / GUARD.MANIFEST_RELATIVE).read_text("ascii"))
        parameters = payload["candidate"]["parameters"]
        self.assertEqual(parameters["chi"], "2*M/R=1/4")
        self.assertEqual(parameters["M"], "1/8")
        self.assertEqual(payload["replayGrids"]["resolutionOrder"], [64, 96, 128, 256])
        self.assertIsNone(payload["executionCheckpoint"]["exactCommand"])
        self.assertIsNone(payload["executionCheckpoint"]["token"])

    def test_root_collision_fails_before_any_candidate_evaluation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fake_repo = Path(temporary)
            manifest = fake_repo / GUARD.MANIFEST_RELATIVE
            manifest.parent.mkdir(parents=True)
            manifest.write_bytes((REPO / GUARD.MANIFEST_RELATIVE).read_bytes())
            collision = fake_repo / GUARD.FUTURE_ROOT_RELATIVE
            collision.parent.mkdir(parents=True)
            collision.write_text("collision", encoding="ascii")
            with self.assertRaisesRegex(GUARD.GuardFailure, "future_output_root_exists"):
                GUARD.validate(fake_repo)

    def test_broken_symlink_source_collision_fails_when_supported(self) -> None:
        if os.name == "nt":
            self.skipTest("unprivileged symlink creation is not portable on Windows")
        with tempfile.TemporaryDirectory() as temporary:
            fake_repo = Path(temporary)
            manifest = fake_repo / GUARD.MANIFEST_RELATIVE
            manifest.parent.mkdir(parents=True)
            manifest.write_bytes((REPO / GUARD.MANIFEST_RELATIVE).read_bytes())
            source = fake_repo / GUARD.FUTURE_SOURCE_RELATIVES[0]
            source.parent.mkdir(parents=True)
            source.symlink_to(fake_repo / "missing")
            with self.assertRaisesRegex(GUARD.GuardFailure, "candidate_evaluator_exists"):
                GUARD.validate(fake_repo)


if __name__ == "__main__":
    unittest.main()
