"""Focused preexecution tests for the G2B Linux runtime probe."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch


SOURCE = Path(__file__).with_name("g2b_linux_runtime_probe.py")
SPEC = importlib.util.spec_from_file_location("g2b_linux_runtime_probe_tested", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("g2b_runtime_test_source_unavailable")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class G2BLinuxRuntimeProbeTests(unittest.TestCase):
    def test_runtime_manifest_is_exclusive_self_hashed_and_authority_false(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "runtime"
            path = root / "runtime-manifest.json"
            with patch.object(MODULE, "OUTPUT_ROOT", root), patch.object(
                MODULE, "OUTPUT_PATH", path
            ):
                result = MODULE.execute_once()
                raw = path.read_bytes()
                manifest = json.loads(raw)
                self.assertEqual(result["sizeBytes"], len(raw))
                self.assertEqual(result["manifestSha256"], manifest["manifestSha256"])
                self.assertTrue(all(value is False for value in manifest["authority"].values()))
                self.assertEqual(manifest["platform"], "linux")
                self.assertEqual(manifest["pointerBytes"], 8)
                self.assertEqual(manifest["fenv"]["fegetround"], 0)
                names = [Path(item["path"]).name for item in manifest["loadedObjects"]]
                for prefix in ("ld-linux", "libc.so", "libgmp", "libmpfr", "gmpy2."):
                    self.assertTrue(any(name.startswith(prefix) for name in names), prefix)

    def test_existing_output_is_terminal(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "runtime"
            root.mkdir()
            with patch.object(MODULE, "OUTPUT_ROOT", root), patch.object(
                MODULE, "OUTPUT_PATH", root / "runtime-manifest.json"
            ):
                with self.assertRaisesRegex(
                    MODULE.RuntimeAdmissionError, "g2b_runtime_output_collision"
                ):
                    MODULE.execute_once()

    def test_packet_binding_is_live(self) -> None:
        MODULE._verify_packet()


if __name__ == "__main__":
    unittest.main()
