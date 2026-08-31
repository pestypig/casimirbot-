#!/usr/bin/env python3
"""Audit the inert P8C-R9 trusted host-key preflight proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r9-guest-attribute-hostkey-preflight-v1-20260830"
PROPOSAL = PREFLIGHT / "h2-p8c-r9-guest-attribute-hostkey-preflight-proposal.v1.json"
LEDGER = PREFLIGHT / "h2-p8c-r9-command-ledger.v1.txt"
OUTPUT = PREFLIGHT / "h2-p8c-r9-guest-attribute-hostkey-preflight-proposal-independent-audit.v1.json"


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

checks = {
    "schema_exact": proposal["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r9_guest_attribute_hostkey_preflight_proposal.v1",
    "status_inert": proposal["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "ledger_two_commands": len(ledger) == policy["exact_commands"] == 2,
    "ledger_identity": len(ledger_bytes) == proposal["command_ledger"]["bytes"] == 2090 and digest(LEDGER) == proposal["command_ledger"]["sha256"] == "0e5994ae70f4254be4e9d0d6607235965232018ebb089bfb904b91553f246673",
    "health_identity": len(health) == commands[0]["characters"] == 30 and hashlib.sha256(health.encode()).hexdigest() == commands[0]["sha256"] == "6f114346a6886fb84dc7e30e0c210e19c6cace68ff62aa3ee5570d7aac08bb53" and commands[0]["expected_stdout"] == "R9_CONNECTION_READY",
    "inspection_identity": len(inspect) == commands[1]["characters"] == 2058 and hashlib.sha256(inspect.encode()).hexdigest() == commands[1]["sha256"] == "98573fe2f3c18b0c15d63cf16aaa13aae9f982b55ebbe53faafb57a7330ab905",
    "project_zone_bound": "P=dark-stratum-455714-h4" in inspect and "Z=us-central1-a" in inspect and '--project="$P"' in inspect and '--zone="$Z"' in inspect,
    "vm_identities_bound": "O=nhm2-h2-p8c-diagnostic-c4-16-20260828" in inspect and "R=nhm2-h2-p8c-rescue-e2-small-20260829" in inspect and "RID=3332429239243725178" in inspect,
    "failfast_and_stopped": inspect.startswith("set -euo pipefail;") and 'test "$OSTAT" = TERMINATED' in inspect and 'test "$RSTAT" = TERMINATED' in inspect and 'test "$ID" = "$RID"' in inspect,
    "known_hosts_read_bounded": 'test -f "$KH"' in inspect and 'test ! -L "$KH"' in inspect and 'test "$KHB" -le 65536' in inspect and "sed -n '10p'" in inspect and 'sha256sum "$KH"' in inspect,
    "guest_attributes_google_api_read": "gcloud compute instances get-guest-attributes" in inspect and "--query-path='hostkeys/'" in inspect and "--format=json" in inspect,
    "guest_attributes_bounded": 'test "$GAB" -gt 0' in inspect and 'test "$GAB" -le 65536' in inspect and "guest_attributes_sha256" in inspect,
    "hostkey_values_validated": "base64.b64decode" in inspect and "validate=True" in inspect and 'x.get("namespace")=="hostkeys"' in inspect,
    "fingerprint_match_hard_gate": decision["trusted_presented_fingerprint"] in inspect and decision["pass_marker"] in inspect and "assert" in inspect,
    "terminal_marker_exact": commands[1]["expected_terminal_marker"] == "R9_READONLY_COMPLETE" and "printf 'R9_READONLY_COMPLETE\\n'" in inspect,
    "first_failure_terminal": policy["first_failure_terminal"] is True and policy["retry_or_fallback_authorized"] is False and policy["additional_commands_authorized"] == 0,
    "read_only_surface": all(non_goals[key] is True for key in ("known_hosts_mutation", "cloud_resource_mutation", "restart_any_vm", "ssh_or_scp", "archive_copy_or_download", "numerical_execution", "candidate_evaluation")) and " instances start " not in inspect and " compute ssh " not in inspect and " compute scp " not in inspect and "sed -i" not in inspect and "ssh-keygen -R" not in inspect,
    "reference_limit_explicit": proposal["reference_policy"]["google_guest_attributes_are_guest_writable"] is True and proposal["reference_policy"]["google_guidance_uses_hostkeys_guest_attributes_as_gcloud_ssh_back_channel"] is True,
    "predecessor_chain_exact": proposal["predecessors"]["r8_result_sha256"] == "590c56d9faeaac51e3366a6f85a8b0b76a79ea35b3356f374d42dbdb84c8a9b1" and proposal["predecessors"]["r8_result_audit_sha256"] == "95f96892c8e3b58e246310c6e7d931e1d56fbd0c6aacd59cdc23410b0bacffb5",
    "authority_all_false": all(value is False for value in proposal["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r9_guest_attribute_hostkey_preflight_proposal.independent_audit.v1",
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
