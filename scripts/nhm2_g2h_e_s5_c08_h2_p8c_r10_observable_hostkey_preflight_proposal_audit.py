#!/usr/bin/env python3
"""Audit the inert P8C-R10 observable host-key preflight proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r10-observable-hostkey-preflight-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r10-observable-hostkey-preflight-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r10-command-ledger.v1.txt"
OUTPUT = PREFLIGHT / "h2-p8c-r10-observable-hostkey-preflight-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
ledger_bytes = LEDGER.read_bytes()
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
health, inspect = ledger
commands = proposal["command_ledger"]["commands"]
policy = proposal["execution_policy"]
non_goals = proposal["non_goals"]
decision = proposal["decision_policy"]

prefix = "python3 -c '"
assert inspect.startswith(prefix) and inspect.endswith("'")
python_source = inspect[len(prefix):-1]
compile(python_source, "<h2-p8c-r10>", "exec")

checks = {
    "schema_exact": proposal["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r10_observable_hostkey_preflight_proposal.v1",
    "status_inert": proposal["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "ledger_two_commands": len(ledger) == policy["exact_commands"] == 2,
    "ledger_identity": len(ledger_bytes) == proposal["command_ledger"]["bytes"] == 3435 and digest(LEDGER) == proposal["command_ledger"]["sha256"] == "f767ace7960c4354da725e5509bd010e7a3afc495bc0d84510e0b06ce420294f",
    "health_identity": len(health) == commands[0]["characters"] == 31 and hashlib.sha256(health.encode()).hexdigest() == commands[0]["sha256"] == "fb142941dc9ae3cabfef5104673552e99bd5c347cf960994d45291d4d5309b19" and commands[0]["expected_stdout"] == "R10_CONNECTION_READY",
    "inspection_identity": len(inspect) == commands[1]["characters"] == 3402 and hashlib.sha256(inspect.encode()).hexdigest() == commands[1]["sha256"] == "98f1a0f2e6567655cef38a130d18d8c9cb64aea3a8d09f1f081d9f7a52fb7091",
    "python_syntax_compiles": bool(compile(python_source, "<h2-p8c-r10-replay>", "exec")),
    "child_process_not_shell_errexit": inspect.startswith("python3 -c '") and "set -e" not in inspect and proposal["observability_contract"]["interactive_shell_errexit_forbidden"] is True,
    "project_zone_bound": 'P="dark-stratum-455714-h4"' in inspect and 'Z="us-central1-a"' in inspect and '"--project="+P' in inspect and '"--zone="+Z' in inspect,
    "vm_identities_bound": 'O="nhm2-h2-p8c-diagnostic-c4-16-20260828"' in inspect and 'R="nhm2-h2-p8c-rescue-e2-small-20260829"' in inspect and 'RID="3332429239243725178"' in inspect,
    "only_three_gcloud_reads": inspect.count('["gcloud","compute","instances","describe"') == 3 and inspect.count('["gcloud","compute","instances","get-guest-attributes"') == 1 and '["gcloud","compute","instances","start"' not in inspect,
    "stopped_and_instance_guards": 'assert os=="TERMINATED"' in inspect and 'assert rs=="TERMINATED"' in inspect and "assert ii==RID" in inspect,
    "known_hosts_read_bounded": "KH.lstat()" in inspect and "KH.is_symlink()" in inspect and "KH.read_bytes()" in inspect and "len(raw)<=65536" in inspect and "lines[9]" in inspect,
    "guest_attributes_read_bounded": '"--query-path=hostkeys/"' in inspect and "0<len(gb)<=65536" in inspect and "json.loads" in inspect,
    "hostkey_values_validated": "base64.b64decode" in inspect and "validate=True" in inspect and 'v.get("namespace")=="hostkeys"' in inspect,
    "fingerprint_match_hard_gate": decision["trusted_presented_fingerprint"] in inspect and decision["pass_marker"] in inspect and "assert EXPECTED in" in inspect,
    "step_markers_present": all(marker in inspect for marker in ("ORIGINAL_STATUS_BEGIN", "ORIGINAL_STATUS_PASS", "RESCUE_STATUS_BEGIN", "RESCUE_STATUS_PASS", "INSTANCE_ID_BEGIN", "INSTANCE_ID_PASS", "KNOWN_HOSTS_BEGIN", "KNOWN_HOSTS_PASS", "GUEST_ATTRIBUTES_BEGIN", "GUEST_ATTRIBUTES_PASS", "FINGERPRINT_MATCH_BEGIN")),
    "terminal_marker_exact": commands[1]["expected_terminal_marker"] == "R10_READONLY_COMPLETE" and "R10_READONLY_COMPLETE" in inspect,
    "first_failure_no_retry": policy["first_failure_terminal_for_r10"] is True and policy["retry_or_fallback_authorized"] is False and policy["additional_commands_authorized"] == 0,
    "fresh_ui_surface_only_if_needed": policy["allow_one_fresh_cloud_shell_terminal_ui_surface_if_input_absent"] is True,
    "read_only_surface": all(non_goals[key] is True for key in ("known_hosts_mutation", "cloud_resource_mutation", "restart_any_vm", "ssh_or_scp", "archive_copy_or_download", "numerical_execution", "candidate_evaluation")) and all(token not in inspect for token in ("ssh-keygen", "gcloud compute ssh", "gcloud compute scp", "write_bytes", "write_text", "unlink(", "rename(")),
    "predecessor_chain_exact": proposal["predecessors"]["r9_result_sha256"] == "c658f96f00751100d51de3053424af23638fe1449733ea3b5d9be4022bfe7fdc" and proposal["predecessors"]["r9_result_audit_sha256"] == "ae5fa6fcad92d365dfb9e190f241d96c60eaea99a6caac91ccd3921f7464f92e",
    "authority_all_false": all(value is False for value in proposal["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r10_observable_hostkey_preflight_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "ledger_sha256": digest(LEDGER),
    "cloud_actions_executed": 0,
    "known_hosts_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(PROPOSAL))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
