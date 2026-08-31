#!/usr/bin/env python3
"""Audit the inert P8C-R11 offline host-key resource preflight proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r11-offline-hostkey-resource-preflight-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r11-offline-hostkey-resource-preflight-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r11-command-ledger.v1.txt"
OUTPUT = PREFLIGHT / "h2-p8c-r11-offline-hostkey-resource-preflight-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger_bytes = LEDGER.read_bytes()
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
health, inspect = ledger
commands = proposal["command_ledger"]["commands"]
policy = proposal["execution_policy"]
non_goals = proposal["non_goals"]
resources = proposal["frozen_existing_resources"]
proposed = proposal["proposed_attestation_resources"]

prefix = "python3 -c '"
assert inspect.startswith(prefix) and inspect.endswith("'")
python_source = inspect[len(prefix):-1]
compile(python_source, "<h2-p8c-r11>", "exec")

checks = {
    "schema_exact": proposal["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r11_offline_hostkey_resource_preflight_proposal.v1",
    "status_inert": proposal["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "ledger_two_commands": len(ledger) == policy["exact_commands"] == 2,
    "ledger_identity": len(ledger_bytes) == proposal["command_ledger"]["bytes"] == 3928 and digest(LEDGER) == proposal["command_ledger"]["sha256"] == "e1acdd23d5c989684a5980420ed4b6a3d069cf11065c2acab2457ba5ad3d80b0",
    "health_identity": len(health) == commands[0]["characters"] == 31 and hashlib.sha256(health.encode()).hexdigest() == commands[0]["sha256"] == "d752558665c681baf6db0cf9d71a25731f06ef49cfd42d142432e4704bbcbeb2" and commands[0]["expected_stdout"] == "R11_CONNECTION_READY",
    "inspection_identity": len(inspect) == commands[1]["characters"] == 3895 and hashlib.sha256(inspect.encode()).hexdigest() == commands[1]["sha256"] == "c3d7c263c6354ad91f1d5eab1a5dfa72610f621d530bcf2fa73f1ca68e3606ae",
    "python_syntax_compiles": bool(compile(python_source, "<h2-p8c-r11-replay>", "exec")),
    "project_zone_bound": 'P="dark-stratum-455714-h4"' in inspect and 'Z="us-central1-a"' in inspect and '"--project="+P' in inspect and '"--zone="+Z' in inspect,
    "existing_identities_bound": all(value in inspect for value in resources.values()),
    "proposed_names_bound": all(value in inspect for value in proposed.values()),
    "read_only_api_surface": inspect.count('["gcloud","compute","instances","describe"') == 2 and inspect.count('["gcloud","compute","disks","describe"') == 1 and inspect.count('["gcloud","compute","snapshots","list"') == 1 and inspect.count('["gcloud","compute","disks","list"') == 1 and inspect.count('["gcloud","compute","instances","list"') == 1,
    "stopped_guards": 'x.stdout.strip()=="TERMINATED"' in inspect and 'i.get("status")=="TERMINATED"' in inspect,
    "instance_id_guard": 'str(i.get("id"))==RID' in inspect and resources["rescue_instance_id"] in inspect,
    "disk_topology_guard": 'len(ds)==2' in inspect and 'len(boots)==1' in inspect and 'b.get("mode")=="READ_WRITE"' in inspect and 'clones[0].get("mode")=="READ_ONLY"' in inspect,
    "boot_disk_guard": 'd.get("status")=="READY"' in inspect and 'str(d.get("sizeGb"))=="10"' in inspect and '/diskTypes/pd-standard' in inspect and 'd.get("sourceImage","").endswith("/images/"+IMG)' in inspect,
    "proposed_names_absence_guard": inspect.count('x.stdout.strip()==""') == 3,
    "bounded_json_reads": inspect.count('0<len(x.stdout.encode())<=65536') == 2,
    "step_markers_present": all(marker in inspect for marker in ("ORIGINAL_BEGIN", "ORIGINAL_PASS", "RESCUE_INSTANCE_BEGIN", "RESCUE_INSTANCE_PASS", "BOOT_DISK_BEGIN", "BOOT_DISK_PASS", "PROPOSED_NAMES_BEGIN", "PROPOSED_NAMES_PASS")),
    "terminal_marker_exact": commands[1]["expected_terminal_marker"] == "R11_READONLY_COMPLETE" and "R11_READONLY_COMPLETE" in inspect,
    "first_failure_no_retry": policy["first_failure_terminal_for_r11"] is True and policy["retry_or_fallback_authorized"] is False and policy["additional_commands_authorized"] == 0,
    "read_only_non_goals": all(non_goals[key] is True for key in ("cloud_resource_creation_or_mutation", "restart_any_vm", "ssh_or_scp", "filesystem_mount", "known_hosts_mutation", "archive_copy_or_download", "numerical_execution", "candidate_evaluation")),
    "no_mutating_tokens": all(token not in inspect for token in (
        '["gcloud","compute","instances","create"',
        '["gcloud","compute","instances","start"',
        '["gcloud","compute","instances","stop"',
        '["gcloud","compute","snapshots","create"',
        '["gcloud","compute","disks","create"',
        '"attach-disk"',
        '"detach-disk"',
        "ssh-keygen",
        "compute ssh",
        "compute scp",
        "write_bytes",
        "write_text",
        "unlink(",
        "rename(",
    )),
    "predecessor_chain_exact": proposal["predecessors"]["r10_result_sha256"] == "ae3f4ed5ea567b56a193edd83f2fa5f2df79aed14f4f724b7991111e55f9eb6a" and proposal["predecessors"]["r10_result_audit_sha256"] == "ab97af6e7b0a3fbe78a5b022b576927afd01f4175bc14ae6a76f2def34e1bd43",
    "authority_all_false": all(value is False for value in proposal["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r11_offline_hostkey_resource_preflight_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "ledger_sha256": digest(LEDGER),
    "cloud_actions_executed": 0,
    "resource_mutations": 0,
    "known_hosts_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(PROPOSAL))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
