"""Byte-level G2D-R1 audit; imports none of the implementation sources."""

from __future__ import annotations

import ast
import hashlib
import json
import os
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json"
BASE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json"
PRIMARY = TOOLS / "g2d_fluid_star_primary.py"
INDEPENDENT = TOOLS / "g2d_fluid_star_independent.c"
ORCHESTRATOR = TOOLS / "g2d_fluid_star_orchestrator.py"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1"
CHECKPOINT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-r1-execution-checkpoint.md"
DOMAIN = b"nhm2/g2d/fluid-star/one-shot-token/v1\n"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class G2DImplementationIndependentAudit(unittest.TestCase):
    def test_token_derivation_is_reimplemented(self) -> None:
        data = json.loads(MANIFEST.read_text("ascii"))
        fields = {key: data[key] for key in (
            "baseManifestSha256", "independentRuntimeManifestSha256",
            "independentSourceSha256", "orchestratorSourceSha256", "outputRoot",
            "primaryRuntimeManifestSha256", "primarySourceSha256",
        )}
        raw = DOMAIN + json.dumps(fields, ensure_ascii=True, allow_nan=False,
                                  sort_keys=True, separators=(",", ":")).encode("ascii")
        self.assertEqual(hashlib.sha256(raw).hexdigest(), data["executionToken"])
        self.assertEqual(len(re.findall(r"[0-9a-f]{64}", data["executionToken"])), 1)

    def test_sources_are_byte_and_language_disjoint(self) -> None:
        self.assertNotEqual(sha(PRIMARY), sha(INDEPENDENT))
        primary = PRIMARY.read_text("utf-8")
        independent = INDEPENDENT.read_text("utf-8")
        self.assertIn("from decimal import", primary)
        self.assertIn("from fractions import", primary)
        self.assertIn("#include <mpfr.h>", independent)
        self.assertNotIn("import gmpy2", primary.lower())
        self.assertNotIn("ctypes", primary.lower())
        self.assertNotIn("#include <python.h>", independent.lower())
        self.assertNotIn("py_initialize", independent.lower())

    def test_orchestrator_preflight_cannot_reach_execute_once(self) -> None:
        tree = ast.parse(ORCHESTRATOR.read_text("utf-8"))
        preflight = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "verify_preexecution")
        called = {node.func.id for node in ast.walk(preflight)
                  if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)}
        self.assertNotIn("execute_once", called)
        self.assertFalse(os.path.lexists(OUTPUT))

    def test_base_receipt_and_resource_contract_is_preserved(self) -> None:
        base = json.loads(BASE.read_text("ascii"))
        self.assertEqual(base["replayGrids"]["resolutionOrder"], [64, 96, 128, 256])
        self.assertEqual(base["hardRails"]["intervalMaximumWidth"], "2^-180")
        self.assertEqual(base["resourceCeilings"]["futureEvaluatorWallSecondsEach"], 600)
        self.assertEqual(base["resourceCeilings"]["futureEvaluatorMaximumResidentMemoryMiB"], 2048)
        required = set(base["receiptSchema"]["requiredFields"])
        orchestrator = ORCHESTRATOR.read_text("utf-8")
        for field in required:
            self.assertIn(field, orchestrator)

    def test_no_authority_or_result_exists(self) -> None:
        data = json.loads(MANIFEST.read_text("ascii"))
        self.assertEqual(data["status"], "IMPLEMENTED_PREEXECUTION_EXECUTION_UNAUTHORIZED")
        self.assertTrue(all(value is False for value in data["authority"].values()))
        self.assertFalse(os.path.lexists(OUTPUT))

    def test_checkpoint_inventory_rehashes(self) -> None:
        inventory: dict[str, str] = {}
        inside = False
        for line in CHECKPOINT.read_text("utf-8").splitlines():
            if line == "```text checkpoint-inventory":
                inside = True
                continue
            if inside and line == "```":
                break
            if inside and line:
                digest, relative = line.split("  ", 1)
                inventory[relative] = digest
        self.assertEqual(len(inventory), 12)
        for relative, expected in inventory.items():
            self.assertEqual(sha(ROOT / relative), expected, relative)


if __name__ == "__main__":
    unittest.main()
