"""Independent G2E candidate-neutral arithmetic/provenance acceptance tests."""

from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
sys.path.insert(0, os.fspath(TOOLS))
from g2e_directed_sqrt_primary import run_manifest  # noqa: E402
from g2e_failure_provenance import canonical, run_synthetic  # noqa: E402


MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2e-generic-contract.v1.json"
FIXTURE = TOOLS / "g2e_synthetic_failure_fixture.py"
IMAGE = "nhm2-g2e-directed-sqrt:v1"
G2D_ROOT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1"
G2D_HASHES = {
    "preexecution-binding.json": "dfde4d74b7fbe6b73216cf0b263fc165c127820411b6f8ab61ffedd38acbf76c",
    "terminal-receipt.json": "25bc26daa110d7de50b2657325bb9d5c6c767482887ba79211c97c7f514ccc83",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_self_hash(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text("ascii"))
    expected = value["selfSha256"]
    value["selfSha256"] = None
    if hashlib.sha256(canonical(value)).hexdigest() != expected:
        raise AssertionError(f"self hash mismatch: {path}")
    return value


class G2EIntervalProvenanceTests(unittest.TestCase):
    def test_manifest_is_candidate_neutral_and_all_authority_false(self) -> None:
        raw = MANIFEST.read_bytes()
        self.assertTrue(all(byte < 128 for byte in raw))
        manifest = json.loads(raw.decode("ascii"))
        self.assertTrue(manifest["candidateNeutral"])
        self.assertEqual(len(manifest["vectors"]), 9)
        self.assertTrue(all(value is False for value in manifest["authority"].values()))
        self.assertEqual(manifest["status"],
                         "FROZEN_CANDIDATE_NEUTRAL_NO_SCIENTIFIC_EXECUTION")

    def test_primary_generic_vectors_pass_exact_postconditions(self) -> None:
        payload = run_manifest(MANIFEST)
        self.assertEqual(payload["status"], "PASS")
        self.assertFalse(payload["candidateEvaluated"])
        self.assertEqual(len(payload["vectors"]), 9)
        for vector in payload["vectors"]:
            self.assertTrue(vector["lowerPostcondition"], vector["id"])
            self.assertTrue(vector["upperPostcondition"], vector["id"])
            self.assertTrue(vector["lowerTight"], vector["id"])
            self.assertTrue(vector["upperTight"], vector["id"])

    def test_independent_offline_mpfr_replay_passes_same_vector_ids(self) -> None:
        run = subprocess.run(
            ["docker", "run", "--rm", "--network", "none", "--memory", "512m",
             "--cpus", "1", "--pids-limit", "16", IMAGE],
            cwd=ROOT, capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(run.returncode, 0, run.stderr)
        payload = json.loads(run.stdout)
        self.assertEqual(payload["status"], "PASS")
        self.assertFalse(payload["candidateEvaluated"])
        actual = [item["id"] for item in payload["vectors"]]
        self.assertEqual(actual, ["zero", "unit", "quarter-square", "sqrt-two",
                                  "sqrt-ten", "tiny-square", "tiny-irrational",
                                  "huge-square", "interval-endpoints-lower",
                                  "interval-endpoints-upper"])
        self.assertTrue(all(item["status"] == "PASS" for item in payload["vectors"]))

    def test_synthetic_failure_persists_bounded_complete_provenance(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nhm2-g2e-") as temp:
            root = Path(temp) / "receipt-root"
            command = [sys.executable, "-I", "-B", os.fspath(FIXTURE)]
            terminal = run_synthetic(command, root, maximum_prefix_bytes=64)
            self.assertEqual(terminal["status"], "FAIL")
            self.assertEqual(terminal["firstFail"], "synthetic_process_exit:7")
            self.assertEqual(terminal["stdout"]["byteCount"], 96)
            self.assertEqual(terminal["stderr"]["byteCount"], 80)
            self.assertTrue(terminal["stdout"]["truncated"])
            self.assertTrue(terminal["stderr"]["truncated"])
            self.assertEqual(base64.b64decode(terminal["stdout"]["capturedPrefixBase64"]),
                             b"S" * 64)
            self.assertEqual(base64.b64decode(terminal["stderr"]["capturedPrefixBase64"]),
                             b"E" * 64)
            self.assertEqual(terminal["stdout"]["sha256"], hashlib.sha256(b"S" * 96).hexdigest())
            self.assertEqual(terminal["stderr"]["sha256"], hashlib.sha256(b"E" * 80).hexdigest())
            self.assertEqual(set(path.name for path in root.iterdir()),
                             {"preexecution-binding.json", "terminal-receipt.json"})
            verify_self_hash(root / "preexecution-binding.json")
            verify_self_hash(root / "terminal-receipt.json")

    def test_exclusive_root_blocks_synthetic_retry_without_mutation(self) -> None:
        with tempfile.TemporaryDirectory(prefix="nhm2-g2e-") as temp:
            root = Path(temp) / "receipt-root"
            command = [sys.executable, "-I", "-B", os.fspath(FIXTURE)]
            run_synthetic(command, root, maximum_prefix_bytes=64)
            before = {path.name: sha(path) for path in root.iterdir()}
            with self.assertRaises(FileExistsError):
                run_synthetic(command, root, maximum_prefix_bytes=64)
            after = {path.name: sha(path) for path in root.iterdir()}
            self.assertEqual(before, after)

    def test_g2d_immutable_root_is_byte_identical(self) -> None:
        entries = {path.relative_to(G2D_ROOT).as_posix(): path for path in G2D_ROOT.rglob("*")}
        self.assertEqual(set(entries), {"primary", *G2D_HASHES})
        self.assertEqual(list(entries["primary"].iterdir()), [])
        for relative, expected in G2D_HASHES.items():
            self.assertEqual(sha(entries[relative]), expected)

    def test_g2e_sources_contain_no_g2d_entrypoint_or_scientific_formula(self) -> None:
        paths = [TOOLS / "g2e_directed_sqrt_primary.py",
                 TOOLS / "g2e_directed_sqrt_independent.c",
                 TOOLS / "g2e_failure_provenance.py",
                 TOOLS / "g2e_synthetic_failure_fixture.py"]
        source = "\n".join(path.read_text("utf-8") for path in paths)
        for forbidden in ("g2d_fluid_star", "evaluate_definition", "rhoHat", "pHat",
                          "chi=", "RESOLUTIONS", "fluid-star-chi"):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
