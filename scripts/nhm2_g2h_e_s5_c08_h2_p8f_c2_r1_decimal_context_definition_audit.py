#!/usr/bin/env python3
"""Independent audit of the C2-R1 fixed-context decimal repair."""

from __future__ import annotations

import hashlib
import importlib.util
import sys
from decimal import Decimal, localcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
V2 = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v2.py"
V3 = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit_v3.py"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c2-r1-decimal-context-repair.md"
V2_SHA = "33e660490990ba3c94c4d260d427552c5d0b4385751b52e7bd0f2222ebaec2b4"
V3_SHA = "2b4fe456654b5d46b8d528d90785772f32e4b19a347135b784a7472c2e258a09"

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main() -> int:
    spec = importlib.util.spec_from_file_location("c2r1_decimal_v3", V3)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    source = V3.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    midpoint = "1." + "1234567890" * 8
    parsed = module.printed_ball(f"[{midpoint} +/- 2e-90]")
    with localcontext() as context:
        context.prec = 220
        m = Decimal(midpoint); r = Decimal("1e-80") + Decimal("2e-90")
        expected = module.BASE.Interval(m-r, m+r)
    checks = [
        sha(V2) == V2_SHA, sha(V3) == V3_SHA,
        module.V2_SHA256 == V2_SHA, module.DECIMAL_PRECISION == 220,
        V2_SHA in doc and V3_SHA in doc,
        "fixed Decimal precision 220" in doc,
        "with localcontext() as context" in source,
        "context.prec = DECIMAL_PRECISION" in source,
        parsed == expected,
        module.printed_ball("[1 +/- -1]") is None,
        "subprocess" not in source and "docker " not in source.lower(),
        "one-ulp rule" in doc,
        "all other checks" in doc,
        "every candidate, proof" in doc,
        module.AUDIT_SCHEMA.endswith(".v3"),
    ]
    passed = sum(checks)
    print(f"{passed}/{len(checks)} {'PASS' if passed == len(checks) else 'FAIL'}")
    return 0 if passed == len(checks) else 1

if __name__ == "__main__":
    raise SystemExit(main())
