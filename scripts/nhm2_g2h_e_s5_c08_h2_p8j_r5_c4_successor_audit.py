#!/usr/bin/env python3
"""Static independent audit for the candidate-neutral P8J-R5 C4 successor."""

from __future__ import annotations

import hashlib
import json
import pathlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
R4_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r4-cloud-preexecution-result.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r5-c4-capacity-successor-proposal.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
P8J_AUDIT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_cloud_run_v1.sh"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r5-c4-successor-preflight-v1-20260831/h2-p8j-r5-c4-successor-audit.v1.json"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    checks: dict[str, bool] = {}

    def exact(name: str, path: pathlib.Path, size: int, digest: str) -> None:
        checks[f"{name}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{name}_bytes"] = checks[f"{name}_regular"] and path.stat().st_size == size
        checks[f"{name}_sha256"] = checks[f"{name}_regular"] and sha256(path) == digest

    exact("r4_result", R4_RESULT, 3760, "9c368edd093e3a44696ff85c9ce73a1a32bceb60f95b58a179d254a740839fbe")
    exact("r5_proposal", PROPOSAL, 7207, "bc883b8f6763987a1e7f4fc4744335aad7c633cef6de36bd33d6cf0961ae06ea")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")
    exact("p8j_audit", P8J_AUDIT, 10138, "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2")
    exact("controller", CONTROLLER, 5857, "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6")

    r4 = R4_RESULT.read_text(encoding="utf-8")
    proposal = PROPOSAL.read_text(encoding="utf-8")
    checks["r4_terminal"] = "BLOCKED_PREEXECUTION_ZONE_RESOURCE_POOL_EXHAUSTED / R4 EXHAUSTED" in r4
    checks["r4_no_resource"] = "P8J_R4_VM_ABSENT" in r4 and "No VM, disk," in r4
    checks["r4_no_science"] = "No scientific\nexecutable ran" in r4
    checks["metadata_complete"] = all(
        f"{field}:" in proposal
        for field in (
            "Program gate", "Workstream", "Capability or component", "Current maturity",
            "Target maturity", "Required frozen inputs", "Required evidence", "Stop/fail criteria",
            "Explicit non-goals", "Downstream gate unlocked",
        )
    )
    checks["official_provisioning_matrix"] = "instances/provisioning-models" in proposal
    checks["official_spot_guidance"] = "instances/spot" in proposal
    checks["official_c4_definition"] = "general-purpose-machines" in proposal
    checks["official_rate_source"] = "products/compute/pricing/general-purpose" in proposal
    checks["flex_rejected"] = "Flex-start supports accelerator" in proposal and "not the\n  CPU-only N2 or C4" in proposal
    checks["spot_rejected"] = "Spot is best-effort excess capacity" in proposal and "incompatible with this\n  one-shot" in proposal
    checks["reservation_rejected"] = "ordinary on-demand reservation" in proposal and "not the\n  smallest successor" in proposal
    checks["c4_exact_shape"] = "`c4-standard-32` is defined\nwith 32 vCPUs and 122,880 MiB" in proposal
    checks["quota_bound"] = "regional general\nCPU quota is at least 200/0" in proposal and "`CPUS_ALL_REGIONS`\nremains 32/0" in proposal
    checks["no_active_instances"] = "zero active instances" in proposal
    checks["no_capacity_claim"] = "this is not a capacity promise" in proposal
    checks["zone_exact"] = "zone: exactly `us-central1-a`" in proposal
    checks["vm_exact"] = "nhm2-h2-p8j-r5-c4-32-20260831" in proposal
    checks["machine_exact"] = "exactly one temporary on-demand `c4-standard-32`" in proposal
    checks["image_exact"] = "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" in proposal
    checks["hyperdisk_exact"] = "exactly 30 GB `hyperdisk-balanced`" in proposal
    checks["c4_prior_evidence"] = "earlier candidate-neutral H2 work successfully provisioned C4" in proposal
    checks["controller_cpu_only"] = "controller contains no N2 or machine-type binding" in proposal and "`--cpus 32`" in proposal
    checks["no_creation_probe"] = "No creation request was used to test C4 capacity" in proposal
    checks["no_upload"] = "No upload, replacement, rename, move or deletion is permitted" in proposal
    checks["single_creation"] = "exactly one R5 creation attempt" in proposal
    checks["failure_terminal"] = "If creation\nfails, R5 is terminal" in proposal
    checks["no_retry"] = "There is no\nretry, fallback, retune, resource substitution" in proposal
    checks["one_process"] = "starting\nexactly one no-network" in proposal
    checks["timeout_bound"] = "`86,400` seconds" in proposal and "`90,000` seconds" in proposal
    checks["rate_bound"] = "`$1.58136/hour`" in proposal
    checks["cost_bound"] = "`$42.00`" in proposal
    checks["binary_bound"] = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6" in proposal
    checks["fixture_bound"] = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2" in proposal
    checks["separate_authorization"] = "R5 requires separate exact operator authorization" in proposal
    checks["candidate_neutral"] = "Candidate evaluations and positive samples remain zero" in proposal
    checks["authority_locked"] = "authority remain false" in proposal

    passed = sum(checks.values())
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r5_c4_successor_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "r4_result_sha256": "9c368edd093e3a44696ff85c9ce73a1a32bceb60f95b58a179d254a740839fbe",
        "r5_proposal_sha256": "bc883b8f6763987a1e7f4fc4744335aad7c633cef6de36bd33d6cf0961ae06ea",
        "r5_cloud_action_performed": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "authority_promoted": False,
        "checks": checks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {receipt['status']}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
