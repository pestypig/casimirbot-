#!/usr/bin/env python3
"""Independent audit of the additive C2-R1 decimal-ingress repair."""

from __future__ import annotations

import hashlib
import importlib.util
import sys
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
V1 = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit.py"
V2 = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v2.py"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c2-r1-decimal-ingress-repair.md"
V1_SHA = "c0b0196d7879f1e156cea6abeae6d5f216ac3f01e6f365affc81a459da8ee4b6"
V2_SHA = "33e660490990ba3c94c4d260d427552c5d0b4385751b52e7bd0f2222ebaec2b4"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    spec = importlib.util.spec_from_file_location("c2r1_decimal_v2", V2)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    doc = DOC.read_text(encoding="utf-8")
    source = V2.read_text(encoding="utf-8")
    checks = [
        sha(V1) == V1_SHA, sha(V2) == V2_SHA,
        module.BASE_SHA256 == V1_SHA,
        V1_SHA in doc and V2_SHA in doc,
        "arb_get_str(value, 80, 0)" in doc,
        "https://flintlib.org/doc/arb.html" in doc,
        "Exactly one midpoint ulp is added" in doc,
        "No empirical tolerance" in doc,
        "subprocess" not in source and "docker " not in source.lower(),
        "midpoint_ulp = Decimal(1).scaleb(midpoint.as_tuple().exponent)" in source,
        "total_radius = radius + midpoint_ulp" in source,
        module.printed_ball("[1.025 +/- 2e-6]") == module.BASE.Interval(Decimal("1.023998"), Decimal("1.026002")),
        module.printed_ball("[1.0e-54 +/- 3e-134]").low == Decimal("9.000000000000000000000000000E-55"),
        module.printed_ball("1.0") is None,
        module.printed_ball("[1 +/- -1]") is None,
        module.AUDIT_SCHEMA.endswith(".v2"),
        "all_evidence_hashes_exact" in V1.read_text(encoding="utf-8"),
        "authority_locks_false" in V1.read_text(encoding="utf-8"),
        "all candidate, proof" in doc.lower(),
    ]
    passed = sum(checks)
    if passed != len(checks):
        print("failed_indices=" + ",".join(str(i) for i, value in enumerate(checks, 1) if not value))
    print(f"{passed}/{len(checks)} {'PASS' if passed == len(checks) else 'FAIL'}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
