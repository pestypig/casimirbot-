"""Sole canonical-module-identity repair for the blocked B4-R11 harness.

Program gate: G2B — replacement classical proof attempt
Workstream: authenticated classical branch closure
Capability or component: B4-R11-R1 diagnostic module-identity repair
Current maturity: versioned implementation repair
Target maturity: one authenticated terminal-equivalence diagnosis
Required frozen inputs: immutable R11 source/result and unchanged evidence set
Required evidence: sole loader delta, tests, fresh root and exact receipt
Stop/fail criteria: any non-loader semantic delta, mismatch, partial output/error
Explicit non-goals: R11 retry, B4-R10 retry, Newton/continuation or retune
Downstream gate unlocked: branch closure or one supported successor class
"""

from __future__ import annotations

import importlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import struct
import sys
from typing import Final


PATH: Final[Path] = Path(__file__).with_name("g2b_b4_r11_terminal_equivalence_diagnosis.py")
SPEC = importlib.util.spec_from_file_location("_nhm2_g2b_b4_r11_frozen", PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("r11_frozen_import_spec_invalid")
R11 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = R11
SPEC.loader.exec_module(R11)

OUTPUT: Final[Path] = R11.ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r11-r1-terminal-equivalence-diagnosis-v1"
RECEIPT: Final[Path] = OUTPUT / "receipt.json"
DOMAIN: Final[bytes] = b"nhm2-spherical-boson-star-v2/g2b-b4-r11-r1-terminal-equivalence/v1\n"
REPAIR_PACKET: Final[Path] = R11.ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r11-r1-module-identity-repair.md"
R11_RESULT: Final[Path] = R11.ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2b-b4-r11-result-record.md"
ORIGINAL_LOAD = R11._load


def _binding(path: Path, role: str) -> dict[str, object]:
    metadata = path.lstat()
    raw = path.read_bytes()
    if not stat.S_ISREG(metadata.st_mode) or stat.S_ISLNK(metadata.st_mode):
        raise RuntimeError(f"r11_r1_binding_not_ordinary:{role}")
    return {
        "role": role,
        "path": path.relative_to(R11.ROOT).as_posix(),
        "sizeBytes": len(raw),
        "rawSha256": R11._sha(raw),
    }


def _canonical_load(name: str, path: Path):
    if path.parent.resolve() != R11.BRANCH.resolve():
        return ORIGINAL_LOAD(name, path)
    module_name = path.stem
    module = importlib.import_module(module_name)
    if Path(module.__file__).resolve() != path.resolve():
        raise RuntimeError(f"r11_r1_canonical_import_identity_invalid:{module_name}")
    return module


def execute_once() -> dict[str, object]:
    if OUTPUT.exists() or OUTPUT.is_symlink():
        raise RuntimeError("r11_r1_exclusive_output_root_already_exists")
    R11._load = _canonical_load
    try:
        result = R11._diagnose()
    finally:
        R11._load = ORIGINAL_LOAD
    bindings = list(result["sourceAndInputBindings"])
    bindings.extend(
        (
            _binding(PATH, "frozen_r11_diagnostic"),
            _binding(R11_RESULT, "r11_blocked_result"),
            _binding(REPAIR_PACKET, "r11_r1_repair_packet"),
            _binding(Path(__file__).resolve(), "r11_r1_wrapper"),
        )
    )
    result["sourceAndInputBindings"] = bindings
    unsigned: dict[str, object] = {
        "artifactId": "nhm2.spherical_boson_star_v2.g2b_b4_r11_r1_terminal_equivalence_diagnosis",
        "contractVersion": "nhm2_spherical_boson_star_v2_g2b_b4_r11_r1_terminal_equivalence/v1",
        "status": "PASS",
        **result,
        "moduleIdentityRepairOnly": True,
        "candidateSolveInvoked": False,
        "newtonInvoked": False,
        "continuationInvoked": False,
        "trialResidualEvaluated": False,
        "armijoMeritEvaluated": False,
        "stateUpdateComputedOrPersisted": False,
        "linearCorrectionReconstructed": True,
        "b4R10Retried": False,
        "b4R11Retried": False,
        "noRetune": True,
        "candidateAdmission": False,
        "authorityLocks": dict(R11.AUTHORITY_LOCKS),
    }
    raw_unsigned = R11._canonical(unsigned)
    receipt = dict(unsigned)
    receipt["receiptSha256"] = R11._sha(DOMAIN + struct.pack("<Q", len(raw_unsigned)) + raw_unsigned)
    raw = R11._canonical(receipt)
    os.mkdir(OUTPUT)
    with RECEIPT.open("xb") as handle:
        handle.write(raw)
    return receipt


def main() -> int:
    print(json.dumps(execute_once(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
