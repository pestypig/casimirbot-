"""No-Docker safety tests for the G1 launcher preflight."""

import importlib.util
import json
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("g1_bounded_launcher.py")
spec = importlib.util.spec_from_file_location("g1_bounded_launcher", SCRIPT)
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherPreflightTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model = json.loads(launcher.MODEL.read_text(encoding="utf-8"))
        cls.acceptance = json.loads(launcher.ACCEPTANCE.read_text(encoding="utf-8"))
        cls.structural = json.loads(launcher.STRUCTURAL.read_text(encoding="utf-8"))
        cls.provenance = json.loads(launcher.PROVENANCE.read_text(encoding="utf-8"))
        cls.inlist = (launcher.ROOT / cls.provenance["inlist"]["path"]).read_bytes()

    def check(self, *, model=None, acceptance=None, structural=None,
              provenance=None, inlist=None, disk=30_000_000_000,
              memory=6_000_000_000):
        return launcher.evaluate_preflight(
            model or self.model, acceptance or self.acceptance,
            structural or self.structural, provenance or self.provenance,
            self.inlist if inlist is None else inlist, disk, memory)

    def test_current_manifests_block_even_with_plenty_of_capacity(self):
        blockers = self.check()
        self.assertIn("BLOCK_STRUCTURAL_LAUNCH_AUTHORITY", blockers)
        self.assertIn("BLOCK_STRUCTURAL_COMPARISON_OPERATOR", blockers)
        self.assertIn("BLOCK_EXECUTION_ADAPTER_NOT_IMPLEMENTED", blockers)

    def test_disk_threshold_is_strict_and_unknown_fails_closed(self):
        self.assertIn("BLOCK_HOST_DISK_CAPACITY", self.check(disk=24_999_999_999))
        self.assertIn("BLOCK_HOST_DISK_CAPACITY", self.check(disk=None))
        self.assertNotIn("BLOCK_HOST_DISK_CAPACITY", self.check(disk=25_000_000_000))

    def test_memory_threshold_is_strict_and_unknown_fails_closed(self):
        self.assertIn("BLOCK_HOST_MEMORY_CAPACITY", self.check(memory=4_294_967_295))
        self.assertIn("BLOCK_HOST_MEMORY_CAPACITY", self.check(memory=None))
        self.assertNotIn("BLOCK_HOST_MEMORY_CAPACITY", self.check(memory=4_294_967_296))

    def test_inlist_and_image_identity_fail_closed(self):
        self.assertIn("BLOCK_INLIST_HASH_MISMATCH", self.check(inlist=self.inlist + b"\n"))
        model = dict(self.model, image="unbound:latest")
        self.assertIn("BLOCK_IMAGE_IDENTITY_MISMATCH", self.check(model=model))

    def test_resource_policy_cannot_silently_relax(self):
        model = dict(self.model, resources=dict(self.model["resources"], network="bridge"))
        self.assertIn("BLOCK_RESOURCE_POLICY_DRIFT", self.check(model=model))
        model = dict(self.model, resources=dict(self.model["resources"],
                                                minimumHostFreeBytesBeforeStart=0))
        self.assertIn("BLOCK_RESOURCE_POLICY_DRIFT", self.check(model=model))

    def test_even_replaced_authority_flags_do_not_enable_execution(self):
        model = dict(self.model, launchAllowed=True)
        acceptance = dict(self.acceptance, launchAllowed=True)
        structural = dict(self.structural, launchAllowed=True,
                          comparisonOperator={"verified": True})
        provenance = dict(self.provenance, launchAllowed=True)
        blockers = self.check(model=model, acceptance=acceptance,
                              structural=structural, provenance=provenance)
        self.assertEqual(blockers, ["BLOCK_EXECUTION_ADAPTER_NOT_IMPLEMENTED"])


if __name__ == "__main__":
    unittest.main()
