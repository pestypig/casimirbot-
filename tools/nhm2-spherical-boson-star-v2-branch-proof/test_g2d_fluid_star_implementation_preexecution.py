from __future__ import annotations

import ast
import hashlib
import json
import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
PRIMARY = TOOLS / "g2d_fluid_star_primary.py"
INDEPENDENT = TOOLS / "g2d_fluid_star_independent.c"
ORCHESTRATOR = TOOLS / "g2d_fluid_star_orchestrator.py"
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json"
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class G2DImplementationPreexecutionTests(unittest.TestCase):
    def test_root_absent_and_all_authority_false(self) -> None:
        self.assertFalse(os.path.lexists(OUTPUT))
        data = json.loads(MANIFEST.read_text("ascii"))
        self.assertTrue(all(value is False for value in data["authority"].values()))
        self.assertFalse(data["authority"]["executionAuthorized"])

    def test_all_source_and_runtime_bindings_rehash(self) -> None:
        data = json.loads(MANIFEST.read_text("ascii"))
        for prefix in ("baseManifest", "primarySource", "independentSource",
                       "orchestratorSource", "primaryRuntimeManifest",
                       "independentRuntimeManifest"):
            self.assertEqual(sha(ROOT / data[f"{prefix}Path"]), data[f"{prefix}Sha256"])

    def test_primary_execute_gate_precedes_candidate_call(self) -> None:
        tree = ast.parse(PRIMARY.read_text("utf-8"))
        main = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == "main")
        text = ast.unparse(main)
        self.assertLess(text.index("if not args.execute"), text.index("evaluate_definition()"))
        self.assertNotIn("subprocess", PRIMARY.read_text("utf-8"))
        self.assertNotIn("gmpy2", PRIMARY.read_text("utf-8"))

    def test_independent_execute_gate_precedes_candidate_call(self) -> None:
        text = INDEPENDENT.read_text("utf-8")
        self.assertLess(text.index("if(!execute)"), text.index("return evaluate();"))
        self.assertIn("#define PREC_BITS 768", text)
        self.assertNotIn("Python.h", text)
        self.assertNotIn("Py_Initialize", text)

    def test_orchestrator_has_no_candidate_mathematics(self) -> None:
        text = ORCHESTRATOR.read_text("utf-8")
        for forbidden in ("Decimal", "Fraction", "mpfr_", "sqrt(", "pHat", "rhoHat", "Einstein", "TOV"):
            self.assertNotIn(forbidden, text)
        self.assertIn('"--network", "none"', text)
        self.assertIn('"--memory", "2048m"', text)
        self.assertIn("timeout=600", text)

    def test_neutral_preflight_passes_without_execution(self) -> None:
        run = subprocess.run(
            [os.fspath(Path(os.sys.executable)), "-I", "-B", os.fspath(ORCHESTRATOR),
             "--implementation-manifest", os.fspath(MANIFEST)],
            cwd=ROOT, capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(run.returncode, 0, run.stderr)
        payload = json.loads(run.stdout)
        self.assertEqual(payload["status"], "PASS_PREEXECUTION")
        self.assertFalse(payload["candidateEvaluated"])
        self.assertFalse(payload["executionAuthorized"])
        self.assertFalse(os.path.lexists(OUTPUT))

    def test_independent_image_and_binary_identity(self) -> None:
        data = json.loads(MANIFEST.read_text("ascii"))
        inspect = subprocess.run(
            ["docker", "image", "inspect", data["independentImageId"], "--format", "{{.Id}}"],
            capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(inspect.returncode, 0, inspect.stderr)
        self.assertEqual(inspect.stdout.strip(), data["independentImageId"])
        binary = subprocess.run(
            ["docker", "run", "--rm", "--network", "none", "--entrypoint", "sha256sum",
             data["independentImageId"], "/usr/local/bin/g2d-fluid-star-independent"],
            capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(binary.returncode, 0, binary.stderr)
        self.assertEqual(binary.stdout.split()[0], data["independentBinarySha256"])


if __name__ == "__main__":
    unittest.main()
