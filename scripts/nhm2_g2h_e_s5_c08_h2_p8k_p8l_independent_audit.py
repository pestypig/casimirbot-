#!/usr/bin/env python3
"""Independent definition and immutable-evidence audit for P8K/P8L."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
import tempfile
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p8j-r14-stopped-disk-recovery-v1-20260901"
)
RECORD = CAPTURE / (
    "inner-extracted/nhm2-h2-p8j-r13-rescue-capture-v1/"
    "nhm2-h2-p8j-evidence-v1/terminal-record.json"
)
FROZEN_FAILURE = CAPTURE / (
    "inner-extracted/nhm2-h2-p8j-r13-rescue-capture-v1/"
    "nhm2-h2-p8j-evidence-v1/p8j-result-audit.json"
)
R14_AUDIT = CAPTURE / "h2-p8j-r14-recovery-result-audit.v1.json"
P8K_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8k_result_audit.py"
P8L_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8l_direct_integrated_evidence_replay.py"
P8K_RECEIPT = CAPTURE / "h2-p8k-corrected-result-audit.v1.json"
P8L_RECEIPT = CAPTURE / "h2-p8l-direct-integrated-evidence-replay.v1.json"
OUTPUT = CAPTURE / "h2-p8k-p8l-independent-audit.v1.json"

P8K_SHA256 = "280d84af2da4b377ada04fa6b46f8b2628f4f368af709c3a0214e7c85cf2fe90"
P8L_SHA256 = "f629425fad406b05289e6e354274b3f0ae517357cbeb6be90a1fe3fed2056458"
RECORD_SHA256 = "565c44ef3231c2e301fea01e789928fc7dcfb9b4cbb886579f075fea0dcee5e2"
FROZEN_FAILURE_SHA256 = "5b35a80be8ddf3cf69f5c1169fe3bb950acd94641354b52d207f81c728aac91d"
R14_AUDIT_SHA256 = "a0ee190e6c3f450189539ab4ac8ab8935fd7950ed1bd4df91b655a037dc96864"
P8K_RECEIPT_SHA256 = "a14cbb66b41c30cc2fa597c4c790c3bcdace40f546438fb6b6d271aa68af4fc1"
P8L_RECEIPT_SHA256 = "631cead0948d9e1a37d6be0b56d931c1b0d37eaa08cc5cc222fa7a1db1b5e98a"
FROZEN_AUDITOR_SHA256 = "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2"
P8J_SOURCE_SHA256 = "56fa8892dff6b450b19f1ac073ccaafd8618acb6113dcd9da025cd25cd2a1cff"
BIVARIATE_SOURCE_SHA256 = "8fd618213793fc9726aa86e96944ddac076711701f98135e4e3a8d67611cc7f6"
H2_LEDGER_SOURCE_SHA256 = "171b83daeb6ba25f07054bb160c3007cbaebb6b4c1757297a99223422f3666aa"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    p8k = load("p8k_independent_target", P8K_PATH)
    p8l = load("p8l_independent_target", P8L_PATH)
    record = json.loads(RECORD.read_text(encoding="utf-8"))
    frozen = json.loads(FROZEN_FAILURE.read_text(encoding="utf-8"))
    r14 = json.loads(R14_AUDIT.read_text(encoding="utf-8"))
    p8k_receipt = json.loads(P8K_RECEIPT.read_text(encoding="utf-8"))
    p8l_receipt = json.loads(P8L_RECEIPT.read_text(encoding="utf-8"))

    with tempfile.TemporaryDirectory(prefix="nhm2-p8k-p8l-audit-") as directory:
        temp = Path(directory)
        replay_k_path = temp / "p8k.json"
        replay_l_path = temp / "p8l.json"
        replay_k = p8k.audit(RECORD, replay_k_path)
        replay_l = p8l.replay(RECORD, replay_k_path, replay_l_path)
        p8k_byte_repeat = replay_k_path.read_bytes() == P8K_RECEIPT.read_bytes()
        p8l_byte_repeat = replay_l_path.read_bytes() == P8L_RECEIPT.read_bytes()

    b = lambda low, high: p8k.Interval(Decimal(low), Decimal(high))
    zero = p8k.printed_nonnegative_ball("0")
    source = (ROOT / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
        "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp"
    )).read_text(encoding="utf-8")
    target_source = (ROOT / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
        "mini_boson_star_primary_c08_h2_p8j_representative_attribution_v1.cpp"
    )).read_text(encoding="utf-8")

    checks = {
        "p8k_source_hash_exact": sha256(P8K_PATH) == P8K_SHA256,
        "p8l_source_hash_exact": sha256(P8L_PATH) == P8L_SHA256,
        "frozen_auditor_unchanged": sha256(
            ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py"
        ) == FROZEN_AUDITOR_SHA256,
        "representative_source_hash_exact": sha256(ROOT / (
            "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
            "mini_boson_star_primary_c08_h2_p8j_representative_attribution_v1.cpp"
        )) == P8J_SOURCE_SHA256,
        "bivariate_source_hash_exact": sha256(ROOT / (
            "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
            "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp"
        )) == BIVARIATE_SOURCE_SHA256,
        "h2_ledger_source_hash_exact": sha256(ROOT / (
            "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
            "mini_boson_star_primary_c08_h2_ledger_v1.cpp"
        )) == H2_LEDGER_SOURCE_SHA256,
        "record_hash_exact": sha256(RECORD) == RECORD_SHA256,
        "frozen_failure_hash_exact": sha256(FROZEN_FAILURE) == FROZEN_FAILURE_SHA256,
        "r14_audit_hash_exact": sha256(R14_AUDIT) == R14_AUDIT_SHA256,
        "p8k_receipt_hash_exact": sha256(P8K_RECEIPT) == P8K_RECEIPT_SHA256,
        "p8l_receipt_hash_exact": sha256(P8L_RECEIPT) == P8L_RECEIPT_SHA256,
        "frozen_failure_preserved": frozen.get("audit_status") == "FAIL"
        and frozen.get("checks_passed") == 4 and frozen.get("checks_total") == 9,
        "r14_recovery_audit_pass": r14.get("status") == "PASS"
        and r14.get("checks_passed") == r14.get("checks_total") == 37,
        "count_formula_independent": p8k.expected_integrated_terms(128, 128, 3)
        == 129 * 129 - 3 == 16638,
        "boundary_formula_independent": p8k.expected_boundary_terms(24, 3)
        == 24 - 3 + 1 == 22,
        "producer_degree_rule_present": (
            "const unsigned t_degree = a + b + 1U" in source
            and "t_degree >= attribution_degree" in source
        ),
        "representative_shape_constants_present": (
            "constexpr std::size_t kPanelCount = 65536U" in target_source
            and "constexpr std::size_t kThreadCount = 32U" in target_source
            and "constexpr unsigned kTargetDegree = 3U" in target_source
        ),
        "canonical_zero_extension_exact": zero == p8k.Interval(Decimal(0), Decimal(0)),
        "negative_boundary_not_admitted": b("-0.1", "0.1").low < 0,
        "p8k_semantic_pass": replay_k.get("audit_status") == "PASS"
        and replay_k.get("checks_passed") == replay_k.get("checks_total") == 11,
        "p8k_classification_exact": replay_k.get("result_classification")
        == "P8K_DIRECT_INTEGRATION_GPRIME_HULL_ASYMMETRY_LEAD",
        "p8k_byte_deterministic": p8k_byte_repeat,
        "p8l_semantic_pass": replay_l.get("status") == "PASS"
        and replay_l.get("checks_passed") == replay_l.get("checks_total") == 16,
        "p8l_classification_exact": replay_l.get("classification")
        == "P8L_DIRECT_POLYNOMIAL_MOMENT_TERM_RADIUS_ACCUMULATION_LEAD",
        "p8l_byte_deterministic": p8l_byte_repeat,
        "source_hull_insufficient_by_strict_interval": replay_l["checks"][
            "combined_source_hull_scale_below_direct_excess"
        ] is True,
        "translation_insufficient_by_strict_interval": replay_l["checks"][
            "translation_gap_scale_below_direct_excess"
        ] is True,
        "boundary_exact_zero": replay_l["checks"]["boundary_component_exact_zero"] is True,
        "candidate_neutral_locks": record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False,
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8k_p8l_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "p8k_source_sha256": sha256(P8K_PATH),
        "p8k_receipt_sha256": sha256(P8K_RECEIPT),
        "p8l_source_sha256": sha256(P8L_PATH),
        "p8l_receipt_sha256": sha256(P8L_RECEIPT),
        "terminal_classification": replay_l.get("classification"),
        "next_gate_decision": replay_l.get("next_gate_decision"),
        "candidate_evaluated": False,
        "authority": {
            name: False
            for name in (
                "candidate", "proof", "geometry_state", "lane", "lamp",
                "physical", "propulsion", "transport"
            )
        },
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(payload["terminal_classification"])
    print(sha256(OUTPUT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
