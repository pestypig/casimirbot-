#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r12-offline-hostkey-attestation-v1-20260830/h2-p8c-r12-offline-hostkey-attestation-result.v1.json"

raw = RESULT.read_bytes()
data = json.loads(raw)
checks = []

def check(name, condition):
    checks.append((name, bool(condition)))

check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r12_offline_hostkey_attestation.result.v1")
check("terminal_status", data["status"] == "EXECUTED_ONCE_EXHAUSTED_BLOCKED")
check("classification", data["classification"] == "BLOCKED_NO_ACTIVE_CLOUD_ACCOUNT_BEFORE_CLOUD_ACTION")
check("proposal_binding", data["proposal_sha256"] == "e9ee7ed7d8b77f8f144c7d97f9162ae301dba761a44174562c894f7001e2ef45")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("authorization_binding", data["charter"]["authorization_sha256"] == "4f28231a74f2919aab597dda754acce7f8d43e5ac2f60c110bb3a2b4e47680dc")
check("connection_passed", data["execution"]["connection_marker_observed"] is True)
check("invoked_once", data["action_counts"]["r12_invocations"] == 1)
check("proposal_consumed", data["execution"]["proposal_consumed"] is True)
check("first_failure_terminal", data["execution"]["first_failure_terminal"] is True)
check("no_completion", data["execution"]["completion_marker_observed"] is False)
check("exact_error", data["cloud_error"]["message"] == "You do not currently have an active account selected.")
check("read_only_failure", data["cloud_error"]["command_class"] == "gcloud.compute.instances.describe")
check("no_mutation_command", data["cloud_error"]["mutation_capable_command_reached"] is False)
check("no_cloud_create", data["action_counts"]["cloud_resource_creations"] == 0)
check("no_cloud_delete", data["action_counts"]["cloud_resource_deletions"] == 0)
check("no_retry", data["action_counts"]["retries"] == 0)
check("no_numerics", data["action_counts"]["numerical_processes"] == 0)
check("no_candidate", data["action_counts"]["candidate_evaluations"] == 0)
check("no_ssh", data["action_counts"]["ssh_or_scp"] == 0)
check("staged_startup", data["staging"]["startup_script_sha256"] == "f28efc172d7db843e328368fa03e2c5d48c6eea9346cbd3a96cc9a5dbcf7dc6f")
check("staged_cloudshell", data["staging"]["cloudshell_script_sha256"] == "58bd563f643b45310f9c6a8a04d088922ec4538ea9427dc6e48fd5e86b8e65c4")
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
