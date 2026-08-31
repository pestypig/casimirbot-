#!/usr/bin/env python3
"""Audit the bounded candidate-neutral H2 continuation operating charter."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-bounded-continuation-charter-v1-20260830"
PROPOSAL = BASE / "h2-bounded-continuation-charter-proposal.v1.json"
OUTPUT = BASE / "h2-bounded-continuation-charter-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


p = json.loads(PROPOSAL.read_text(encoding="utf-8"))
cloud = p["cloud_bounds"]
cleanup = p["automatic_local_cleanup"]
scope = p["execution_scope"]
forbidden = set(p["forbidden"])

checks = {
    "schema_exact": p["schema"] == "nhm2.g2h_e_s5.h2_bounded_continuation_operating_charter.proposal.v1",
    "status_inert": p["status"] == "FROZEN_INERT_AWAITING_ONE_STANDING_AUTHORIZATION",
    "project_zone_bound": cloud["allowed_project"] == "dark-stratum-455714-h4" and cloud["allowed_zone"] == "us-central1-a" and cloud["allowed_region"] == "us-central1",
    "cost_bounded": cloud["cumulative_cost_ceiling_usd"] == 25.0 and cloud["aggregate_compute_runtime_hours"] == 30,
    "single_vm_bound": cloud["maximum_simultaneously_running_vms"] == 1 and cloud["idle_stop_minutes"] == 15,
    "machine_allowlist": cloud["allowed_machine_types"] == ["e2-small", "c4-standard-2", "c4-standard-16"],
    "storage_bound": cloud["maximum_new_persistent_storage_gb"] == 60,
    "resource_prefix_bound": cloud["resource_name_prefix"] == "nhm2-h2-",
    "cleanup_roots_narrow": cleanup["exact_allowed_roots"] == [
        "C:/Users/dan/AppData/Local/Temp",
        "C:/Users/dan/.cache/huggingface",
        "C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/nhm2/g2h-e-s5/candidate-neutral",
    ],
    "cleanup_inventory_required": cleanup["inventory_receipt_required"] is True and len(cleanup["before_action_evidence"]) == 5,
    "cleanup_fail_closed": cleanup["no_recursive_delete_on_ambiguous_or_broad_target"] is True,
    "unique_evidence_preserved": "all_nhm2_artifacts_and_frozen_result_roots" in cleanup["always_preserve"] and "all_unique_manifests_receipts_logs_and_terminal_evidence" in cleanup["always_preserve"],
    "personal_and_runtime_data_preserved": "all_codex_runtime_caches" in cleanup["always_preserve"] and "downloads_documents_desktop_personal_media_browser_profiles_and_google_drive" in cleanup["always_preserve"],
    "candidate_neutral_scope": "candidate_neutral_h2_causal_classification_and_algorithmic_optimization" in scope["allowed"] and scope["expires_at"] == "first_irreversible_frozen_candidate_execution_decision_or_any_bound_exhaustion",
    "candidate_execution_forbidden": "frozen_candidate_evaluation_or_positive_sampling" in forbidden and "candidate_scientific_output_root_token_or_authorization_creation" in forbidden,
    "retune_forbidden": "retuning_a_frozen_candidate_after_observing_results" in forbidden,
    "authority_all_false": all(value is False for value in p["authority"].values()),
    "security_changes_forbidden": "firewall_iam_account_credential_or_api_key_changes" in forbidden and "uploading_secrets_personal_files_or_unmanifested_data" in forbidden,
    "downstream_work_forbidden": "rust_g3_si_metric_lane_or_theory_graph_execution" in forbidden,
    "stop_conditions_complete": len(p["stop_and_request_direction"]) == 6,
}

audit = {
    "schema": "nhm2.g2h_e_s5.h2_bounded_continuation_operating_charter.proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloud_actions_executed": 0,
    "cleanup_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(PROPOSAL))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
