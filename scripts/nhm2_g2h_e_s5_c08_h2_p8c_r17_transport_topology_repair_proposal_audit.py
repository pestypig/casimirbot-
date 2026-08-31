#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r17-transport-topology-repair-v1-20260830"
PROPOSAL = BASE / "h2-p8c-r17-transport-topology-repair-proposal.v1.json"
WRAPPER = BASE / "h2-p8c-r17-transport-topology-repair-cloudshell.v1.sh"

data = json.loads(PROPOSAL.read_bytes())
raw = WRAPPER.read_bytes()
text = raw.decode("utf-8")
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r17_transport_topology_repair.proposal.v1")
check("status", data["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER")
check("charter", data["charter_proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("wrapper_bytes", len(raw) == data["wrapper"]["bytes"] == 4538)
check("wrapper_hash", hashlib.sha256(raw).hexdigest() == data["wrapper"]["sha256"] == "80cb03862a64ae4c5ec41887f355e72cf54f12c767e87087973702d5b180fd22")
check("r16_binding", "d5754639ed1e641c2c12c6dfddd9d41c19ceecfe2e2964691f5844bfea5f9eec" in text)
check("r17_generated_binding", "a706018814ef02b1f2bedc3c63c4902791a4b83adf12b05a64584d3b9760cc84" in text)
check("three_user_precondition", all(name in text for name in data["repair"]["detached_from_stopped_helpers"] + [data["repair"]["required_sole_remaining_stopped_helper"]]))
check("exact_two_repair_detaches", 'for helper in "$R13_HELPER" "$R14_HELPER"' in text)
check("sole_r15_postcondition", "len(users) == 1" in text and 'R17_R15_SOLE_STOPPED_ATTACHMENT_PASS' in text)
check("no_running_vm_precondition", "running_count" in text and "== '0'" in text)
check("new_helper_identity", data["retrieval"]["helper_vm"] in text)
check("new_archive_identity", data["retrieval"]["cloud_archive"] in text)
check("new_evidence_identity", "nhm2-h2-p8c-r17-evidence-v1" in text)
check("archive_identity", data["retrieval"]["expected_archive_bytes"] == 16443 and data["retrieval"]["expected_archive_sha256"] == "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d")
check("one_vm", data["execution_bounds"]["maximum_running_vms"] == 1)
check("runtime", data["execution_bounds"]["aggregate_runtime_seconds"] == 1800)
check("cost", data["execution_bounds"]["cost_ceiling_usd"] == 1.0)
check("storage", data["execution_bounds"]["new_persistent_disk_gb"] == 10)
check("no_retry", data["execution_bounds"]["retry_authorized"] is False)
check("no_delete", data["execution_bounds"]["resource_deletion_authorized"] is False and " delete " not in text)
check("no_ssh", " compute ssh " not in text and " compute scp " not in text and "known_hosts" not in text)
check("no_numerics", data["execution_bounds"]["numerical_processes"] == 0 and "mini-boson-star" not in text)
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(PROPOSAL.read_bytes()).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
