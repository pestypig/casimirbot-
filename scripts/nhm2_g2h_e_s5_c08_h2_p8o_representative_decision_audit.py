#!/usr/bin/env python3
"""Independent evidence and decision audit for candidate-neutral H2-P8O."""

from __future__ import annotations

import hashlib
import json
import pathlib
import re
from datetime import datetime


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs/research"
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
CAPTURE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
ARTIFACT = CAPTURE / "h2-p8o-representative-decision-v1-20260901"
RECEIPT = ARTIFACT / "h2-p8o-independent-decision-audit.v3.json"

R14_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r14-terminal-result.md"
KL_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8k-p8l-result-adjudication.md"
M_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8m-term-radius-attribution-fixture.md"
N_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8n-selector-term-radius-binding.md"
O_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8o-representative-term-radius-decision-packet.md"
P_DOC = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-observer-progress-turnaround-calibration.md"

R14_AUDIT = CAPTURE / "h2-p8j-r14-stopped-disk-recovery-v1-20260901/h2-p8j-r14-recovery-result-audit.v1.json"
KL_AUDIT = CAPTURE / "h2-p8j-r14-stopped-disk-recovery-v1-20260901/h2-p8k-p8l-independent-audit.v1.json"
M_AUDIT = CAPTURE / "h2-p8m-term-radius-attribution-v1-20260901/h2-p8m-independent-audit.v2.json"
N_AUDIT = CAPTURE / "h2-p8n-selector-term-radius-binding-v1-20260901/h2-p8n-independent-audit.v2.json"

EXPECTED = {
    R14_DOC: "63ef420ad5d6195dbebbae5e76dd3188b29229cc03d395e77be2fbf5327d2d0c",
    KL_DOC: "73f8fb816131e65a99f7171659282c3599315c5742b9a51ed855a6eb16db2574",
    M_DOC: "41b6ba5b0988d52490a65b5bb04e930faa722d6361dff78cb14d68650b6dad44",
    N_DOC: "374ad5aad42d3b4a3a2d83122bf596bf4e285f235e73b4dda848cb93f88a3624",
    R14_AUDIT: "a0ee190e6c3f450189539ab4ac8ab8935fd7950ed1bd4df91b655a037dc96864",
    KL_AUDIT: "1b83c284a0810aa114776298fd72b9a4a955fcf10056370e9a681e19048c8ad7",
    M_AUDIT: "b1a18eb7d53fcaecfe0834d5aace1aae688cbb77511038a51de24b805f525d09",
    N_AUDIT: "6a1323492c1e9178d2424c0621eff5078d2ab7d2b7a2cf92fe20f65bb3f5074a",
    G2H / "mini_boson_star_primary_c08_h2_p8j_representative_attribution_v1.cpp": "56fa8892dff6b450b19f1ac073ccaafd8618acb6113dcd9da025cd25cd2a1cff",
    G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp": "77b9aa9c1f7af0fc7f626567bc1a1c4986c2936dd4c873a2a000b4d18048298a",
    G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.cpp": "09b1f707bb1b4c800bb513997f6862c7d503a739f119719947aca1bf38735f3c",
}


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: pathlib.Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    if RECEIPT.exists():
        raise RuntimeError(f"immutable audit receipt exists: {RECEIPT}")
    checks: dict[str, bool] = {}
    for path, expected in EXPECTED.items():
        checks[f"hash:{path.name}"] = path.is_file() and sha256(path) == expected

    r14 = R14_DOC.read_text(encoding="utf-8")
    kl = KL_DOC.read_text(encoding="utf-8")
    n_header = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp").read_text(encoding="utf-8")
    n_source = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.cpp").read_text(encoding="utf-8")
    n_fixture = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_fixture_v1.cpp").read_text(encoding="utf-8")
    o_doc = O_DOC.read_text(encoding="utf-8")
    p_doc = P_DOC.read_text(encoding="utf-8")
    r14_audit = load_json(R14_AUDIT)
    kl_audit = load_json(KL_AUDIT)
    m_audit = load_json(M_AUDIT)
    n_audit = load_json(N_AUDIT)

    timestamps = re.findall(r"2026-09-01T\d\d:\d\d:\d\dZ", r14)
    start = datetime.fromisoformat(timestamps[0].replace("Z", "+00:00"))
    end = datetime.fromisoformat(timestamps[1].replace("Z", "+00:00"))
    selector_seconds = int((end - start).total_seconds())
    panels = 65536
    threads = 32
    terms_per_panel = 16638
    term_observations = panels * terms_per_panel
    serial_equivalent_hours = selector_seconds * threads / 3600

    selector_call = n_source.index("selector::evaluate_prepared_candidate_decomposition(")
    serial_loop = n_source.index("for (std::size_t ordinal = 0U; ordinal < panel_count")
    observer_call = n_source.index("p8m::evaluate_prepared_observed(")
    checks.update({
        "r14_audit_pass": r14_audit.get("status") == "PASS" and r14_audit.get("checks_passed") == r14_audit.get("checks_total") == 37,
        "p8kl_audit_pass": kl_audit.get("status") == "PASS" and kl_audit.get("checks_passed") == kl_audit.get("checks_total") == 29,
        "p8m_audit_pass": m_audit.get("status") == "PASS" and m_audit.get("checks_passed") == m_audit.get("checks_total") == 42,
        "p8n_audit_pass": n_audit.get("status") == "PASS" and n_audit.get("checks_passed") == n_audit.get("checks_total") == 45,
        "authenticated_selector_runtime": selector_seconds == 6044,
        "representative_panel_count": "65,536" in r14,
        "representative_terms_per_panel": "16,638" in r14 and "16,638" in kl,
        "term_observation_count": term_observations == 1090387968,
        "serial_equivalent_projection": abs(serial_equivalent_hours - 53.724444444444444) < 1e-12,
        "p8n_selector_precedes_observer": selector_call < serial_loop < observer_call,
        "p8n_serial_panel_order": "serial panel" in n_header and "++ordinal" in n_source,
        "p8n_fixed_514_buckets": "kMaximumDegreeBuckets" in n_header and "514" in o_doc,
        "p8n_no_progress_interface": "progress" not in n_header.lower() and "progress" not in n_source.lower(),
        "p8n_fixture_only_two_panels": "input, 2U, 2U, 3U" in n_fixture,
        "p8n_fixture_2172_terms": "terms_observed == 2172U" in n_fixture,
        "science_question_distinguishable": all(token in o_doc for token in ("concentration by global degree", "unseparated distribution", "binding failure", "bounded timeout")),
        "direct_run_not_justified": "DIRECT_REPRESENTATIVE_PROPOSAL_NOT_JUSTIFIED_WITHOUT_P8P_TURNAROUND_CALIBRATION" in o_doc,
        "stop_is_not_scientific_failure": "not a scientific failure" in o_doc,
        "p8p_selected": "smallest lawful successor is P8P" in o_doc,
        "p8p_packet_header": p_doc.startswith("Program gate:") and "Explicit non-goals:" in p_doc,
        "p8p_inert": "INERT / NO IMPLEMENTATION OR EXECUTION AUTHORITY" in p_doc,
        "p8p_preserves_predecessors": "unchanged P8I/P8M/P8N" in p_doc and "P8N as an" in p_doc and "immutable predecessor" in p_doc,
        "p8p_exact_equivalence": all(token in p_doc for token in ("complete scientific `Output`", "complete scientific `Result`", "all 514 P8N degree slots")),
        "p8p_bounded_progress": "aggregate-only" in p_doc and "may not retain per-panel Arb" in p_doc,
        "p8p_calibration_width": "`P=1024`" in p_doc,
        "p8p_phase_timing": "selector phase and serial P8M/P8N observer phase" in p_doc,
        "p8p_full_run_still_locked": "No P=65,536 process" in p_doc and "becomes" in p_doc and "eligible" in p_doc,
        "no_execution_authority": "No cloud resource, output root, process" in p_doc,
        "authority_locks": "No representative process, cloud resource, candidate evaluation" in o_doc,
    })

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8o_representative_decision_independent_audit.v3",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "decision": "DIRECT_REPRESENTATIVE_PROPOSAL_NOT_JUSTIFIED_WITHOUT_P8P_TURNAROUND_CALIBRATION",
        "selected_successor": "P8P_OBSERVER_PROGRESS_AND_REPRESENTATIVE_WIDTH_TURNAROUND_CALIBRATION",
        "authenticated_selector_seconds": selector_seconds,
        "representative_panels": panels,
        "representative_terms_per_panel": terms_per_panel,
        "serial_term_observations": term_observations,
        "serial_full_selector_equivalent_hours": serial_equivalent_hours,
        "projection_is_completion_eta": False,
        "representative_process_executed": False,
        "calibration_process_executed": False,
        "cloud_resource_created": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha256(RECEIPT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
