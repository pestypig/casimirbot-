#!/usr/bin/env python3
"""Independent, candidate-neutral audit of the frozen H2-P8J-R2 proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys
import tarfile
import tempfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r2-representative-attribution-cloud-execution-proposal.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ARTIFACT / "h2-p8j-r2-overlay-upload-v1.tar"
MANIFEST_MEMBER = "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-source-manifest.v1.tsv"
RECEIPT = ARTIFACT / "h2-p8j-r2-cloud-proposal-audit.v1.json"

EXPECTED = {
    "proposal": (6960, "82a6a67cab6bdc9db45e06acc95ad8e8090359dc5844dc01509e898cee8a433a"),
    "base": (236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978"),
    "overlay": (225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7"),
    "manifest": (2700, "b3d3eb20f773c4ec91cbbfabc5192c059236ab9bfb26546d9e6ee794bfc5c8aa"),
    "audit": (10138, "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2"),
    "controller": (5857, "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6"),
    "target_source": (9546, "56fa8892dff6b450b19f1ac073ccaafd8618acb6113dcd9da025cd25cd2a1cff"),
}
TARGET_BINARY_SHA = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6"
FIXTURE_BINARY_SHA = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2"
BUILDER = "nhm2-g2h-s4-primary-fixture-builder:v2@sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1"


def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def run(args: list[str], *, cwd: pathlib.Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=False)


def safe_extract(archive: pathlib.Path, destination: pathlib.Path) -> None:
    destination_resolved = destination.resolve()
    with tarfile.open(archive, "r") as tf:
        for member in tf.getmembers():
            target = (destination / member.name).resolve()
            if destination_resolved not in target.parents and target != destination_resolved:
                raise RuntimeError(f"unsafe archive member: {member.name}")
            if member.issym() or member.islnk():
                raise RuntimeError(f"link archive member: {member.name}")
        tf.extractall(destination, filter="data")


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path) -> None:
        size, sha = EXPECTED[name]
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = path.stat().st_size == size if checks[f"{name}_regular"] else False
        checks[f"{name}_sha256"] = digest(path) == sha if checks[f"{name}_regular"] else False

    exact("proposal", PROPOSAL)
    exact("base", BASE)
    exact("overlay", OVERLAY)
    proposal_text = PROPOSAL.read_text(encoding="utf-8")
    checks["proposal_no_execution_authority"] = "no execution or scientific authority is granted" in proposal_text.lower()
    checks["proposal_authority_locks"] = all(
        phrase in proposal_text
        for phrase in ("Candidate evaluations and positive samples remain zero", "authority remain false")
    )
    checks["proposal_one_process"] = "exactly one no-network" in proposal_text and "There is no retry" in proposal_text

    with tarfile.open(OVERLAY, "r") as tf:
        members = tf.getmembers()
        names = [member.name.replace("\\", "/") for member in members]
        checks["overlay_17_entries"] = len(members) == 17
        checks["overlay_regular_members"] = all(member.isfile() for member in members)
        checks["overlay_manifest_present"] = MANIFEST_MEMBER in names

    with tempfile.TemporaryDirectory(prefix="nhm2-p8j-r2-audit-") as td:
        tree = pathlib.Path(td)
        safe_extract(BASE, tree)
        safe_extract(OVERLAY, tree)
        manifest = tree / MANIFEST_MEMBER
        exact("manifest", manifest)
        rows = manifest.read_text(encoding="utf-8").splitlines()
        checks["manifest_header"] = rows[0] == "sha256\tbytes\tpath"
        checks["manifest_16_entries"] = len(rows) == 17
        manifest_ok = True
        paths: set[str] = set()
        for row in rows[1:]:
            sha, size, rel = row.split("\t", 2)
            path = tree / rel
            paths.add(rel)
            manifest_ok = manifest_ok and path.is_file() and not path.is_symlink()
            manifest_ok = manifest_ok and path.stat().st_size == int(size) and digest(path) == sha
        checks["manifest_all_exact"] = manifest_ok
        checks["manifest_unique_paths"] = len(paths) == 16

        audit = tree / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
        controller = tree / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
        target_source = tree / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_p8j_representative_attribution_v1.cpp"
        exact("audit", audit)
        exact("controller", controller)
        exact("target_source", target_source)

        self_test = run([sys.executable, str(audit), "--self-test"], cwd=tree)
        checks["audit_self_test_6_of_6"] = self_test.returncode == 0 and self_test.stdout.strip() == "6/6 PASS"
        shell = run(["docker", "run", "--rm", "--entrypoint", "bash", "-v", f"{tree}:/src:ro", BUILDER, "-n", "/src/" + controller.relative_to(tree).as_posix()])
        checks["controller_bash_syntax"] = shell.returncode == 0

        fixture_dockerfile = tree / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1"
        target_dockerfile = tree / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8j-representative-attribution.v1"
        fixture_tag = "nhm2-h2-p8j-r2-proposal-audit-fixture"
        target_tag = "nhm2-h2-p8j-r2-proposal-audit-target"
        fixture_build = run(["docker", "build", "--pull=false", "--network=none", "-f", str(fixture_dockerfile), "-t", fixture_tag, str(tree)])
        checks["fixture_offline_build"] = fixture_build.returncode == 0
        fixture_run = run(["docker", "run", "--rm", "--network", "none", fixture_tag]) if fixture_build.returncode == 0 else None
        fixture_record: dict[str, object] = {}
        if fixture_run and fixture_run.returncode == 0:
            try:
                fixture_record = json.loads(fixture_run.stdout.strip())
            except json.JSONDecodeError:
                fixture_record = {}
        checks["fixture_14_of_14"] = fixture_record.get("status") == "PASS" and fixture_record.get("checks_passed") == 14 and fixture_record.get("checks_total") == 14
        checks["fixture_locks_false"] = bool(fixture_record) and fixture_record.get("candidate_evaluations") == 0 and fixture_record.get("positive_parameter_samples") == 0 and not fixture_record.get("authority_promoted")

        target_build = run(["docker", "build", "--pull=false", "--network=none", "-f", str(target_dockerfile), "-t", target_tag, str(tree)])
        checks["target_offline_build"] = target_build.returncode == 0
        binary = tree / "p8j-target-binary"
        cid = ""
        if target_build.returncode == 0:
            created = run(["docker", "create", target_tag])
            cid = created.stdout.strip() if created.returncode == 0 else ""
        copied = run(["docker", "cp", f"{cid}:/usr/local/bin/mini-boson-star-primary-c08-h2-p8j-representative-attribution-v1", str(binary)]) if cid else None
        if cid:
            run(["docker", "rm", cid])
        checks["target_binary_sha256"] = bool(copied and copied.returncode == 0 and binary.is_file() and digest(binary) == TARGET_BINARY_SHA)
        checks["target_not_executed"] = True
        checks["fixture_binary_bound"] = FIXTURE_BINARY_SHA in controller.read_text(encoding="utf-8")
        checks["target_binary_bound"] = TARGET_BINARY_SHA in controller.read_text(encoding="utf-8")

    passed = sum(checks.values())
    total = len(checks)
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r2_cloud_proposal_audit.v1",
        "status": "PASS" if passed == total else "FAIL",
        "checks_passed": passed,
        "checks_total": total,
        "proposal_sha256": EXPECTED["proposal"][1],
        "base_archive_sha256": EXPECTED["base"][1],
        "overlay_archive_sha256": EXPECTED["overlay"][1],
        "target_binary_sha256": TARGET_BINARY_SHA,
        "representative_executable_started": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "authority_promoted": False,
        "checks": checks,
    }
    RECEIPT.write_text(json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{passed}/{total} {receipt['status']}")
    print(f"receipt={RECEIPT}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
