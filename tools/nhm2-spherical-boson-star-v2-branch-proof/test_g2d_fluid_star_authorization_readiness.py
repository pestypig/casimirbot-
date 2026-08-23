"""Independent G2D-R2 authorization-readiness audit; never runs a candidate."""

from __future__ import annotations

import ast
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs/research"
TOOLS = Path(__file__).resolve().parent
IMPLEMENTATION = DOCS / "nhm2-spherical-boson-star-v2-g2d-implementation.v1.json"
BASE = DOCS / "nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json"
PRIMARY_RUNTIME = DOCS / "nhm2-spherical-boson-star-v2-g2d-primary-runtime.v1.json"
INDEPENDENT_RUNTIME = DOCS / "nhm2-spherical-boson-star-v2-g2d-independent-runtime.v1.json"
R1 = DOCS / "nhm2-spherical-boson-star-v2-g2d-r1-execution-checkpoint.md"
DECISION = DOCS / "nhm2-spherical-boson-star-v2-g2d-r2-authorization-decision.v1.json"
R2 = DOCS / "nhm2-spherical-boson-star-v2-g2d-r2-authorization-readiness-checkpoint.md"
ORCHESTRATOR = TOOLS / "g2d_fluid_star_orchestrator.py"
DOMAIN = b"nhm2/g2d/fluid-star/one-shot-token/v1\n"
EXPECTED_TOKEN = "359cdf5d87e865dc3721b99bd79c3453046f5e489d51f67676dbc1c48167d034"
EXPECTED_ACK = (
    "I authorize exactly one G2D fluid-star execution under token "
    f"{EXPECTED_TOKEN} using the checkpointed command. I understand that PASS, "
    "FAIL, or partial output becomes immutable evidence and there will be no retry, "
    "retune, deletion, or alternate output root."
)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def no_duplicates(pairs: list[tuple[str, object]]) -> dict[str, object]:
    value: dict[str, object] = {}
    for key, item in pairs:
        if key in value:
            raise ValueError(f"duplicate key: {key}")
        value[key] = item
    return value


def load_strict(path: Path) -> dict[str, object]:
    raw = path.read_bytes()
    if any(byte > 127 for byte in raw):
        raise ValueError(f"non-ASCII JSON: {path}")
    value = json.loads(raw.decode("ascii"), object_pairs_hook=no_duplicates,
                       parse_float=lambda value: (_ for _ in ()).throw(
                           ValueError(f"JSON float forbidden: {value}")))
    if not isinstance(value, dict):
        raise ValueError(f"top-level object required: {path}")

    def walk(item: object) -> None:
        if isinstance(item, str) and any(0xD800 <= ord(char) <= 0xDFFF for char in item):
            raise ValueError(f"surrogate code point forbidden: {path}")
        if isinstance(item, dict):
            for key, child in item.items():
                walk(key)
                walk(child)
        elif isinstance(item, list):
            for child in item:
                walk(child)

    walk(value)
    return value


def inventory(path: Path, marker: str, expected_count: int) -> dict[str, str]:
    found: dict[str, str] = {}
    inside = False
    for line in path.read_text("utf-8").splitlines():
        if line == f"```text {marker}":
            inside = True
            continue
        if inside and line == "```":
            break
        if inside and line:
            digest, relative = line.split("  ", 1)
            if relative in found:
                raise ValueError(f"duplicate inventory path: {relative}")
            found[relative] = digest
    if len(found) != expected_count:
        raise ValueError(f"{marker}: expected {expected_count}, found {len(found)}")
    return found


class G2DAuthorizationReadinessAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.binding = load_strict(IMPLEMENTATION)
        cls.base = load_strict(BASE)
        cls.primary_runtime = load_strict(PRIMARY_RUNTIME)
        cls.independent_runtime = load_strict(INDEPENDENT_RUNTIME)
        cls.decision = load_strict(DECISION)

    def test_r1_and_r2_inventories_rehash(self) -> None:
        for relative, expected in inventory(R1, "checkpoint-inventory", 12).items():
            self.assertEqual(sha(ROOT / relative), expected, relative)
        for relative, expected in inventory(R2, "authorization-readiness-inventory", 5).items():
            self.assertEqual(sha(ROOT / relative), expected, relative)

    def test_decision_binds_checkpoint_manifest_command_and_token(self) -> None:
        decision = self.decision
        binding = self.binding
        self.assertEqual(sha(R1), decision["checkpointSha256"])
        self.assertEqual(sha(IMPLEMENTATION), decision["implementationManifestSha256"])
        self.assertEqual(decision["exactFutureCommand"], binding["exactFutureCommand"])
        fields = {key: binding[key] for key in (
            "baseManifestSha256", "independentRuntimeManifestSha256",
            "independentSourceSha256", "orchestratorSourceSha256", "outputRoot",
            "primaryRuntimeManifestSha256", "primarySourceSha256",
        )}
        raw = DOMAIN + json.dumps(fields, ensure_ascii=True, allow_nan=False,
                                  sort_keys=True, separators=(",", ":")).encode("ascii")
        token = hashlib.sha256(raw).hexdigest()
        self.assertEqual(token, EXPECTED_TOKEN)
        self.assertEqual(decision["executionToken"], token)
        self.assertEqual(decision["requiredExactUserAcknowledgement"], EXPECTED_ACK)

    def test_authority_is_absent_and_root_is_pristine(self) -> None:
        decision = self.decision
        self.assertEqual(decision["status"],
                         "READY_FOR_SEPARATE_USER_DECISION_EXECUTION_UNAUTHORIZED")
        self.assertEqual(decision["decision"], "PENDING_EXPLICIT_USER_AUTHORIZATION")
        self.assertIsNone(decision["authorizationEvidence"])
        self.assertIs(decision["candidateExecutionObserved"], False)
        self.assertTrue(decision["authority"])
        self.assertTrue(all(value is False for value in decision["authority"].values()))
        self.assertEqual(decision["authority"], self.binding["authority"])
        output = ROOT / str(decision["futureOutputRoot"])
        self.assertEqual(decision["futureOutputRoot"], self.binding["outputRoot"])
        self.assertFalse(os.path.lexists(output))

    def test_live_runtime_image_and_binary_identities(self) -> None:
        self.assertEqual(sha(Path(sys.executable).resolve()),
                         self.primary_runtime["executableSha256"])
        self.assertEqual(self.binding["primaryExecutableSha256"],
                         self.primary_runtime["executableSha256"])
        image = str(self.binding["independentImageId"])
        inspect = subprocess.run(
            ["docker", "image", "inspect", image, "--format", "{{.Id}}"],
            cwd=ROOT, capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(inspect.returncode, 0, inspect.stderr)
        self.assertEqual(inspect.stdout.strip(), image)
        binary = subprocess.run(
            ["docker", "run", "--rm", "--network", "none", "--memory", "2048m",
             "--cpus", "1", "--pids-limit", "16", "--entrypoint", "sha256sum",
             image, str(self.independent_runtime["binaryPath"])],
            cwd=ROOT, capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(binary.returncode, 0, binary.stderr)
        self.assertEqual(binary.stdout.split()[0], self.binding["independentBinarySha256"])
        self.assertEqual(self.binding["independentBinarySha256"],
                         self.independent_runtime["binarySha256"])

    def test_source_runtime_hashes_and_resource_ceilings(self) -> None:
        mapping = {
            "baseManifestPath": "baseManifestSha256",
            "primarySourcePath": "primarySourceSha256",
            "independentSourcePath": "independentSourceSha256",
            "orchestratorSourcePath": "orchestratorSourceSha256",
            "primaryRuntimeManifestPath": "primaryRuntimeManifestSha256",
            "independentRuntimeManifestPath": "independentRuntimeManifestSha256",
        }
        for path_key, digest_key in mapping.items():
            self.assertEqual(sha(ROOT / str(self.binding[path_key])),
                             self.binding[digest_key], path_key)
        ceilings = self.decision["resourceCeilings"]
        self.assertEqual(ceilings, {
            "independentContainerCpus": 1,
            "independentContainerMemoryMiB": 2048,
            "independentContainerNetwork": "none",
            "wallSecondsEach": 600,
        })
        self.assertEqual(self.base["resourceCeilings"]["futureEvaluatorWallSecondsEach"], 600)
        self.assertEqual(
            self.base["resourceCeilings"]["futureEvaluatorMaximumResidentMemoryMiB"], 2048)
        tree = ast.parse(ORCHESTRATOR.read_text("utf-8"))
        execute = next(node for node in tree.body
                       if isinstance(node, ast.FunctionDef) and node.name == "execute_once")
        literals = {node.value for node in ast.walk(execute)
                    if isinstance(node, ast.Constant) and isinstance(node.value, (str, int))}
        for literal in ("--network", "none", "--memory", "2048m", "--cpus", "1", 600):
            self.assertIn(literal, literals)

    def test_audit_has_no_candidate_execution_path(self) -> None:
        source = Path(__file__).read_text("utf-8")
        tree = ast.parse(source)
        imports = {alias.name for node in ast.walk(tree)
                   if isinstance(node, (ast.Import, ast.ImportFrom))
                   for alias in node.names}
        self.assertFalse(any("g2d_fluid_star_primary" in name or
                             "g2d_fluid_star_independent" in name or
                             "g2d_fluid_star_orchestrator" in name for name in imports))
        run_calls = [node for node in ast.walk(tree) if isinstance(node, ast.Call)
                     and isinstance(node.func, ast.Attribute) and node.func.attr == "run"]
        self.assertEqual(len(run_calls), 2)
        subprocess_literals = {node.value for call in run_calls for node in ast.walk(call)
                              if isinstance(node, ast.Constant) and isinstance(node.value, str)}
        self.assertNotIn("--" + "execute", subprocess_literals)


if __name__ == "__main__":
    unittest.main()
