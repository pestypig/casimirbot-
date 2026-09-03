#!/usr/bin/env python3
"""Independent static audit of the P8P-R16 regional bulk proposal."""
from __future__ import annotations
import hashlib
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r16-regional-bulk-successor-proposal.md"
R15 = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r15-operation-detail-result.md"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r16-regional-bulk-ingress-v1-20260902/h2-p8p-r16-regional-bulk-upload-v1.tar"
ORCHESTRATOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r16_cloudshell_orchestrator_v1.sh"

def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

text = PROPOSAL.read_text(encoding="utf-8")
flat = " ".join(text.split())
with tarfile.open(ARCHIVE, "r:") as bundle:
    members = bundle.getnames()
    member_hashes = {}
    for member in members:
        handle = bundle.extractfile(member)
        assert handle is not None
        member_hashes[member] = hashlib.sha256(handle.read()).hexdigest()
orchestrator = ORCHESTRATOR.read_text(encoding="utf-8")
checks = {
    "required_header": all(x in text for x in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "r15_identity": digest(R15) == "cd554add41e7b2932cf76bb546992246a27fdacc94d96feb513cc2982826be1d",
    "cause_specific": "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS" in text and "does not retry that zonal start" in flat,
    "archive_identity": ARCHIVE.stat().st_size == 236640768 and digest(ARCHIVE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
    "archive_inventory": members == ["h2-p8f-c2-r1-cloud-upload-v1.tar", "h2-p8p-overlay-upload-v1.tar", "h2_p8p_r2_browser_guest_sequence_v1.sh", "h2_p8p_r16_cloudshell_orchestrator_v1.sh"],
    "archive_member_hashes": member_hashes == {
        "h2-p8f-c2-r1-cloud-upload-v1.tar": "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "h2-p8p-overlay-upload-v1.tar": "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
        "h2_p8p_r2_browser_guest_sequence_v1.sh": "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6",
        "h2_p8p_r16_cloudshell_orchestrator_v1.sh": "74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938",
    },
    "orchestrator_identity": ORCHESTRATOR.stat().st_size == 6874 and digest(ORCHESTRATOR) == "74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938",
    "orchestrator_one_create": orchestrator.count("gcloud compute instances bulk create") == 1,
    "orchestrator_one_transfer": orchestrator.count("gcloud compute scp") == 1 and orchestrator.count("gcloud compute ssh") == 1,
    "orchestrator_resource": all(x in orchestrator for x in ("REGION=us-east1", "VM=nhm2-h2-p8p-r16-c2d-32-20260902", "--machine-type=c2d-standard-32", "--boot-disk-type=pd-standard", "--max-run-duration=5h")),
    "orchestrator_guards": all(x in orchestrator for x in ("C2D_CPUS", 'row.get("status") != "TERMINATED"', "EXPECTED_ARCHIVE_SHA", "EXPECTED_ARCHIVE_BYTES")),
    "orchestrator_handoff": orchestrator.count("systemctl start --no-block nhm2-h2-p8p-r16.service") == 1 and "User=pestypig" in orchestrator,
    "orchestrator_failure_stop": "terminal_cleanup" in orchestrator and orchestrator.count('gcloud compute instances stop "$VM"') == 1,
    "nested_identities": all(x in text for x in ("fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978", "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e", "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6", "74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938")),
    "one_vm": all(x in flat for x in ("count=1", "min-count=1", "exactly one running exact-name VM", "second VM")),
    "regional_capacity": all(x in text for x in ("ANY_SINGLE_ZONE", "us-east1-b", "us-east1-c", "us-east1-d", "c2d-standard-32")),
    "resource_binding": all(x in text for x in ("debian-12-bookworm-v20260817", "30 GB `pd-standard`", "`STANDARD` on-demand")),
    "ceilings": "18,000 seconds" in flat and "$9.00" in flat and "14,400-second external timeout" in flat,
    "single_ingress": "one browser file chooser to upload only the R16 archive" in flat and "one `gcloud compute scp`" in flat and "one `gcloud compute ssh`" in flat,
    "scientific_identity": "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text and "11-entry candidate-neutral manifest" in flat,
    "docker_boundary": "conditionally installs Debian `docker.io` only if absent" in flat,
    "one_process": "exactly one candidate-neutral P=1024 controller" in flat,
    "evidence_stop": "automatically stops the VM" in flat and "unchanged independent auditor" in flat,
    "p8q_only": "P8Q trinary rule" in text and "No result authorizes P=65,536" in flat,
    "first_failure": "First failure is terminal and consumes R16" in flat,
    "no_action_yet": "NO R16 CLOUD ACTION" in text,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
    "authorization_text": "## Exact authorization text" in text and "PROPOSAL_SHA256" in text,
}
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(PROPOSAL)}")
raise SystemExit(0 if passed == len(checks) else 1)
