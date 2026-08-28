#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p3-deterministic-parallel-v3-20260827"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    receipt = json.loads((EVIDENCE / "receipt.json").read_text(encoding="utf-8"))
    manifest = json.loads((EVIDENCE / "evidence-manifest.json").read_text(encoding="utf-8"))
    checks: list[tuple[str, bool]] = []
    checks.append(("receipt_pass", receipt["verdict"] == "PASS"))
    checks.append(("candidate_neutral", receipt["candidate_neutral"] is True))
    checks.append(("frozen_arithmetic", receipt["precision_bits"] == 512 and receipt["order"] == 128))
    checks.append(("frozen_inventory", receipt["jet_count"] == 13 and receipt["elementary_convolutions_per_subpanel"] == 43))
    checks.append(("tested_threads", receipt["tested_threads"] == [1, 2]))
    checks.append(("ordinal_reduction", receipt["ordinal_reduction"] == "serial_increasing"))
    checks.append(("refinement_sequential", receipt["refinement_candidates_parallelized"] is False))
    checks.append(("arb_equal", receipt["serial_oracle_arb_equal_all_outputs"] is True))
    checks.append(("repeat_equal", receipt["two_thread_repeat_semantically_equal"] is True))
    checks.append(("fixture_repeat", receipt["selector_fixture_repeat_byte_equal"] is True))
    checks.append(("fixture_31", receipt["selector_fixture"]["checks_passed"] == 31 == receipt["selector_fixture"]["checks_total"]))
    checks.append(("fixture_pass", receipt["selector_fixture"]["status"] == "PASS"))
    checks.append(("speedup_positive", min(receipt["speedup"].values()) > 1.0))
    checks.append(("candidate_zero", receipt["candidate_evaluations"] == 0))
    checks.append(("samples_zero", receipt["positive_parameter_samples"] == 0))
    checks.append(("roots_false", receipt["candidate_roots_created"] is False))
    checks.append(("authorization_false", receipt["authorization_created"] is False))
    checks.append(("handler_false", receipt["scientific_handler_linked"] is False))
    checks.append(("authority_false", receipt["authority_promoted"] is False))
    checks.append(("cloud_unmodified", receipt["preserved_cloud_serial_execution_modified"] is False))
    inventory_ok = all((EVIDENCE / name).is_file()
                       and (EVIDENCE / name).stat().st_size == meta["bytes"]
                       and sha256(EVIDENCE / name) == meta["sha256"]
                       for name, meta in manifest["files"].items())
    checks.append(("inventory_hashes", inventory_ok))
    passed = sum(value for _, value in checks)
    result = {"schema": "nhm2.g2h_e_s5.c08_h2_p3_independent_audit.v1",
              "verdict": "PASS" if passed == len(checks) else "FAIL",
              "checks_passed": passed, "checks_total": len(checks),
              "checks": {name: value for name, value in checks},
              "candidate_evaluations": 0, "positive_parameter_samples": 0,
              "candidate_roots_created": False, "authority_promoted": False}
    output = EVIDENCE.parent / "h2-p3-deterministic-parallel-v3-audit-20260827.json"
    if output.exists():
        raise RuntimeError(f"immutable audit output exists: {output}")
    output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n",
                      encoding="utf-8", newline="\n")
    print(json.dumps({"audit": str(output), "sha256": sha256(output),
                      **result}, sort_keys=True))
    return 0 if result["verdict"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
