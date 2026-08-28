#!/usr/bin/env python3
"""Independently audit the inert H2-P5A-R2 binding repair and clean replay."""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R1 = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r1-upload-repair-v1-20260827/h2-p5a-r1-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-binding-repair-v1-20260827"
ARCHIVE = OUT / "h2-p5a-r2-upload-v1.tar"
MANIFEST = OUT / "h2-p5a-r2-source-manifest.json"
PREFLIGHT = OUT / "h2-p5a-r2-preflight.json"
AUDIT = OUT / "h2-p5a-r2-independent-audit.json"
BEFORE = OUT / "clean-r2b-images-before.log"
STDOUT = OUT / "clean-r2b-guard.stdout.log"
STDERR = OUT / "clean-r2b-guard.stderr.log"
DOCKERFILE = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.r2"
GUARD = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p5a_r2_offline_build_guard_v1.sh"
R1_SHA = "a8b660522087c820aa23f7e11737aa55b944b7f6a048f867cabdeb4d8ccb6422"
BUILDER_CONFIG = "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c"
RUNTIME_CONFIG = "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e"
BINARY = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def member_hash(archive: tarfile.TarFile, name: str) -> str:
    stream = archive.extractfile(archive.getmember(name))
    if stream is None:
        return ""
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(block)
    return digest.hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    output = STDOUT.read_text(encoding="utf-8")
    error = STDERR.read_text(encoding="utf-8")
    checks: dict[str, bool] = {
        "r1_archive_exact": sha256(R1) == R1_SHA,
        "producer_preflight_pass": preflight["status"] == "PASS" and preflight["checks_passed"] == preflight["checks_total"],
        "manifest_bound": sha256(MANIFEST) == preflight["manifest_sha256"],
        "archive_bound": sha256(ARCHIVE) == preflight["archive_sha256"],
        "entry_count_39": preflight["archive_entry_count"] == 39,
        "cloud_actions_zero": preflight["cloud_actions"] == 0,
        "numerical_runs_zero": preflight["numerical_runs"] == 0,
        "authority_false": preflight["authority_promoted"] is False,
        "clean_target_store_empty": BEFORE.read_text(encoding="utf-8-sig").strip() == "",
        "clean_guard_stderr_empty": error == "",
        "clean_build_success": "Successfully built" in output,
        "clean_guard_pass": "\nPASS\n" in output,
        "builder_config_restored": f"builder={BUILDER_CONFIG}" in output,
        "runtime_config_restored": f"runtime={RUNTIME_CONFIG}" in output,
        "binary_reproduced": f"binary={BINARY}" in output,
        "single_source_copy_layer": output.count("Step 4/9 : COPY") == 1,
        "nine_step_build": "Step 9/9 : ENTRYPOINT" in output,
        "no_calibration_argv": "--threads" not in output and "--max-exponent" not in output,
    }
    with tarfile.open(R1, "r") as r1, tarfile.open(ARCHIVE, "r") as r2:
        r1_names = r1.getnames()
        r2_names = r2.getnames()
        checks["r1_inventory_prefix_preserved"] = r2_names[: len(r1_names)] == r1_names
        checks["only_two_additions"] = r2_names[len(r1_names):] == [DOCKERFILE, GUARD]
        checks["all_r1_bytes_preserved"] = all(member_hash(r1, name) == member_hash(r2, name) for name in r1_names)
        docker_text = r2.extractfile(DOCKERFILE).read().decode("utf-8")  # type: ignore[union-attr]
        guard_text = r2.extractfile(GUARD).read().decode("utf-8")  # type: ignore[union-attr]
        checks["dockerfile_uses_local_tags"] = "@sha256:" not in docker_text and "ARG BUILDER_IMAGE=nhm2-g2h" in docker_text
        checks["dockerfile_one_copy"] = docker_text.count("\nCOPY ") == 2
        checks["guard_disables_pull_and_network"] = "--pull=false --network=none" in guard_text
        checks["guard_requires_absent_target_tags"] = "target base tag existed before archive load" in guard_text
        checks["guard_checks_identity_stability"] = "identity changed during build" in guard_text
        checks["guard_invokes_sha_only"] = "--entrypoint /usr/bin/sha256sum" in guard_text
    checks["manifest_has_no_execution_proposal"] = manifest["status"] == "PREPARED_INERT_BINDING_REPAIR"
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "archive_sha256": sha256(ARCHIVE),
        "authority_promoted": False,
        "binary_sha256": BINARY if checks["binary_reproduced"] else None,
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "failed": failed,
        "manifest_sha256": sha256(MANIFEST),
        "numerical_runs": 0,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_binding_repair_audit.v1",
        "status": "PASS" if not failed else "FAIL",
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    if failed:
        print("failed=" + ",".join(failed))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
