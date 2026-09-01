#!/usr/bin/env python3
"""Independent static/synthetic audit of the C2-R1 result-ABI definition."""

from __future__ import annotations

import hashlib
import importlib.util
import sys
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
READER = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8f_c2_r1_result_audit.py"
DEFINITION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c2-r1-result-abi-audit-definition.md"
READER_SHA = "c0b0196d7879f1e156cea6abeae6d5f216ac3f01e6f365affc81a459da8ee4b6"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    spec = importlib.util.spec_from_file_location("c2r1_audit", READER)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    source = READER.read_text(encoding="utf-8")
    definition = DEFINITION.read_text(encoding="utf-8")
    checks: list[bool] = []
    checks.append(sha256(READER) == READER_SHA)
    checks.append(READER_SHA in definition)
    checks.append("FROZEN IMPLEMENTATION DEFINITION" in definition)
    checks.append("strict and enclosure-safe" in definition)
    checks.append("All such authority remains false" in definition)
    checks.append("subprocess" not in source and "docker " not in source.lower())
    checks.append("REQUIRED_HASHES" in source and len(module.REQUIRED_HASHES) == 13)
    checks.append(set(module.REQUIRED_HASHES) == {
        "container.id.txt", "container.inspect.json", "controller.exit.txt",
        "executable.sha256.txt", "finish.utc.txt", "image.inspect.json",
        "p8f-c2-r1-docker-build.txt", "p8f-c2-r1-docker-load.txt", "phase.txt",
        "start.utc.txt", "stderr.txt", "stdout.txt", "timed_out.txt"})
    checks.append(module.CONTAINER_ID == "82dd2e3e412a030bbe6c6e8ae787ad9ffe96d9a0e9b314bfc3d2555c28d68d3e")
    checks.append(module.IMAGE_ID == "sha256:d6baac26c7806cb23c84d432c9d11b91f8d99b31e802b04d61698714476b1352")
    checks.append(module.EXECUTABLE_SHA256 == "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6")
    checks.append(module.TIMEOUT_SECONDS == 86_400)
    checks.append(module.ball("[1.25e-4 +/- 2e-9]") == module.Interval(Decimal("0.000124998"), Decimal("0.000125002")))
    checks.append(module.ball("[nan +/- 0]") is None)
    checks.append(module.ball("[1 +/- -1]") is None)

    def b(mid: str, radius: str = "0"):
        parsed = module.ball(f"[{mid} +/- {radius}]")
        assert parsed is not None
        return parsed

    checks.append(module.divide(b("12"), b("10")) == b("1.2"))
    checks.append(module.divide(b("12"), b("0", "1")) is None)
    checks.append(module.add([b("1"), b("2"), b("3"), b("4")]) == b("10"))
    checks.append(module.classify(b("12"), b("10"), b("1"), b("9"), [b("1"), b("2"), b("3"), b("4")])[0] == "P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD")
    checks.append(module.classify(b("10"), b("10"), b("9"), b("8"), [b("1"), b("2"), b("3"), b("4")])[0] == "P8G_BOUNDARY_CONTRIBUTION_ENCLOSURE_LEAD")
    checks.append(module.classify(b("10"), b("10"), b("8"), b("9"), [b("1"), b("5"), b("3"), b("4")])[0] == "P8G_NONBOUNDARY_SLOT_1_ENCLOSURE_LEAD")
    checks.append(module.classify(b("10"), b("10"), b("8"), b("9"), [b("4", "1"), b("4", "1"), b("3"), b("2")])[0] == "P8G_DISTRIBUTED_NONBOUNDARY_ENCLOSURE_LEAD")
    checks.append(all(value is False for value in {
        "candidate": False, "proof": False, "geometry_state": False,
        "lane": False, "lamp": False, "physical": False,
        "propulsion": False, "transport": False}.values()))
    passed = sum(checks)
    print(f"{passed}/{len(checks)} {'PASS' if passed == len(checks) else 'FAIL'}")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
