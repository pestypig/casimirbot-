"""Source-independent audit of the G2E closure identities and authority boundary."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs/research"
TOOLS = Path(__file__).resolve().parent
RESULT = DOCS / "nhm2-spherical-boson-star-v2-g2e-result.v1.json"
G2D_ROOT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class G2EResultAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.result = json.loads(RESULT.read_text("ascii"))

    def test_all_bound_sources_rehash(self) -> None:
        mapping = {
            "contractSha256": DOCS / "nhm2-spherical-boson-star-v2-g2e-generic-contract.v1.json",
            "dockerfileSha256": TOOLS / "Dockerfile.g2e-directed-sqrt-independent",
            "independentSourceSha256": TOOLS / "g2e_directed_sqrt_independent.c",
            "primarySourceSha256": TOOLS / "g2e_directed_sqrt_primary.py",
            "provenanceSourceSha256": TOOLS / "g2e_failure_provenance.py",
            "syntheticFixtureSha256": TOOLS / "g2e_synthetic_failure_fixture.py",
        }
        for key, path in mapping.items():
            self.assertEqual(sha(path), self.result[key], key)
        self.assertEqual(sha(TOOLS / "test_g2e_interval_provenance.py"),
                         self.result["focusedTests"]["sourceSha256"])

    def test_live_image_and_binary_rehash(self) -> None:
        image = self.result["independentImageId"]
        inspect = subprocess.run(["docker", "image", "inspect", image, "--format", "{{.Id}}"],
                                 capture_output=True, text=True, timeout=60, check=False)
        self.assertEqual(inspect.returncode, 0, inspect.stderr)
        self.assertEqual(inspect.stdout.strip(), image)
        binary = subprocess.run(
            ["docker", "run", "--rm", "--network", "none", "--entrypoint", "sha256sum",
             image, "/usr/local/bin/g2e-directed-sqrt-independent"],
            capture_output=True, text=True, timeout=60, check=False,
        )
        self.assertEqual(binary.returncode, 0, binary.stderr)
        self.assertEqual(binary.stdout.split()[0], self.result["independentBinarySha256"])

    def test_result_is_candidate_neutral_and_authority_false(self) -> None:
        self.assertEqual(self.result["status"],
                         "PASS_CANDIDATE_NEUTRAL_INFRASTRUCTURE_ONLY")
        self.assertTrue(self.result["candidateNeutral"])
        self.assertFalse(self.result["candidateEvaluated"])
        self.assertEqual(self.result["focusedTests"], {
            "passed": 7,
            "sourceSha256": "d996a310abe124a987c1568109259ba20b2963d51d39f695bcbb427a2a4d048b",
            "total": 7,
        })
        self.assertTrue(all(value is False for value in self.result["authority"].values()))

    def test_g2d_root_remains_exactly_immutable(self) -> None:
        entries = {path.relative_to(G2D_ROOT).as_posix(): path for path in G2D_ROOT.rglob("*")}
        self.assertEqual(set(entries), {"primary", "preexecution-binding.json", "terminal-receipt.json"})
        self.assertEqual(sha(entries["preexecution-binding.json"]),
                         "dfde4d74b7fbe6b73216cf0b263fc165c127820411b6f8ab61ffedd38acbf76c")
        self.assertEqual(sha(entries["terminal-receipt.json"]),
                         "25bc26daa110d7de50b2657325bb9d5c6c767482887ba79211c97c7f514ccc83")
        self.assertEqual(list(entries["primary"].iterdir()), [])
        self.assertFalse(os.path.lexists(G2D_ROOT / "independent"))


if __name__ == "__main__":
    unittest.main()
