#!/usr/bin/env python3
"""Authenticate and classify the immutable P8J-R13 result recovered by R14."""

from __future__ import annotations

import hashlib
import json
import re
import tarfile
from dataclasses import dataclass
from decimal import Decimal, localcontext
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p8j-r14-stopped-disk-recovery-v1-20260901"
)
OUTER_ARCHIVE = CAPTURE / "nhm2-h2-p8j-r14-cloudshell-evidence-export-v1.tgz"
OUTER_DATA = CAPTURE / "outer-extracted"
INNER_ARCHIVE = OUTER_DATA / "nhm2-h2-p8j-r13-stopped-disk-evidence-v1.tgz"
CLOUD = OUTER_DATA / "nhm2-h2-p8j-r14-cloudshell-evidence-v1"
INNER_DATA = CAPTURE / "inner-extracted/nhm2-h2-p8j-r13-rescue-capture-v1"
EVIDENCE = INNER_DATA / "nhm2-h2-p8j-evidence-v1"
OUTPUT = CAPTURE / "h2-p8j-r14-recovery-result-audit.v1.json"

OUTER_BYTES = 27799
OUTER_SHA256 = "336b004493d1bdeecc419b6b6909842920c44d41006e256849ae4982e50c0dff"
INNER_BYTES = 24679
INNER_SHA256 = "d630df1b04716d8c7c1930f87fddb55b2b5a6458457a1fce1daf515c5237cc52"
CONTROLLER_SHA256 = "867f4b20a9d81d00b9bab16d99865470b70ea22d8a02fd2735901b2ad7097a01"
EXECUTABLE_SHA256 = "d40c6e51988c30d89f8cd824e41f855e56acdb4e40f0bb0a24cf0e88721de9d6"
RECORD_SHA256 = "565c44ef3231c2e301fea01e789928fc7dcfb9b4cbb886579f075fea0dcee5e2"
FROZEN_AUDIT_SHA256 = "5b35a80be8ddf3cf69f5c1169fe3bb950acd94641354b52d207f81c728aac91d"
FROZEN_AUDITOR_SHA256 = "5a3cfc0d1413353c7ee6f9050bc8b2305d23383fd0746559cd51b53f3454cab2"
BALL_RE = re.compile(r"^\[([^ ]+) \+/- ([^\]]+)\]$")


@dataclass(frozen=True)
class Interval:
    low: Decimal
    high: Decimal


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="strict")


def safe_tar(path: Path) -> tuple[bool, int]:
    with tarfile.open(path, "r:gz") as archive:
        members = archive.getmembers()
        safe = all(
            not member.issym()
            and not member.islnk()
            and not Path(member.name).is_absolute()
            and ".." not in Path(member.name).parts
            for member in members
        )
    return safe, len(members)


def ball(value: object) -> Interval | None:
    if value == "0":
        return Interval(Decimal(0), Decimal(0))
    if not isinstance(value, str):
        return None
    match = BALL_RE.fullmatch(value)
    if match is None:
        return None
    with localcontext() as context:
        context.prec = 220
        midpoint = Decimal(match.group(1))
        radius = Decimal(match.group(2))
        return Interval(midpoint - radius, midpoint + radius)


def add(left: Interval, right: Interval) -> Interval:
    with localcontext() as context:
        context.prec = 220
        return Interval(left.low + right.low, left.high + right.high)


def divide(left: Interval, right: Interval) -> Interval | None:
    if right.low <= 0:
        return None
    with localcontext() as context:
        context.prec = 220
        return Interval(left.low / right.high, left.high / right.low)


def interval_json(value: Interval | None) -> dict[str, str] | None:
    if value is None:
        return None
    return {"low": str(value.low), "high": str(value.high)}


def main() -> int:
    outer_safe, outer_members = safe_tar(OUTER_ARCHIVE)
    inner_safe, inner_members = safe_tar(INNER_ARCHIVE)
    record_path = EVIDENCE / "terminal-record.json"
    frozen_audit_path = EVIDENCE / "p8j-result-audit.json"
    record = json.loads(text(record_path))
    frozen_audit = json.loads(text(frozen_audit_path))
    original = json.loads(text(CLOUD / "original-instance.json"))

    slots = record.get("slot_radius_sums", [])
    parsed = {
        "threshold": ball(record.get("final_threshold")),
        "final": ball(record.get("final_radius")),
        "slot3": ball(slots[3] if isinstance(slots, list) and len(slots) == 4 else None),
        "integrated": ball(record.get("slot3_integrated_component_radius_sum")),
        "boundary": ball(record.get("slot3_boundary_component_radius_sum")),
        "direct": ball(record.get("slot3_direct_integrated_radius_sum")),
        "f_hull": ball(record.get("slot3_f_source_hull_radius_sum")),
        "g_hull": ball(record.get("slot3_gprime_source_hull_radius_sum")),
    }
    balls_parse = all(value is not None for value in parsed.values())
    component_sum = (
        add(parsed["integrated"], parsed["boundary"])
        if balls_parse else None
    )
    strict = lambda left, right: left is not None and right is not None and left.low > right.high
    nonnegative = all(value is not None and value.low >= 0 for value in parsed.values())

    panel_count = record.get("panel_count")
    integrated_terms = record.get("slot3_integrated_terms_observed")
    boundary_terms = record.get("slot3_boundary_terms_observed")
    integrated_per_panel = (
        integrated_terms // panel_count
        if isinstance(integrated_terms, int) and isinstance(panel_count, int)
        and panel_count > 0 and integrated_terms % panel_count == 0
        else None
    )
    boundary_per_panel = (
        boundary_terms // panel_count
        if isinstance(boundary_terms, int) and isinstance(panel_count, int)
        and panel_count > 0 and boundary_terms % panel_count == 0
        else None
    )

    fixture = json.loads(text(EVIDENCE / "p8i-fixture.stdout.txt"))
    device = text(INNER_DATA / "device-and-mount.txt")
    frozen_stdout = text(EVIDENCE / "p8j-result-audit.stdout.txt")
    checks = {
        "outer_archive_regular_non_symlink": OUTER_ARCHIVE.is_file() and not OUTER_ARCHIVE.is_symlink(),
        "outer_archive_bytes_exact": OUTER_ARCHIVE.stat().st_size == OUTER_BYTES,
        "outer_archive_sha256_exact": sha256(OUTER_ARCHIVE) == OUTER_SHA256,
        "outer_archive_members_safe": outer_safe and outer_members > 0,
        "inner_archive_regular_non_symlink": INNER_ARCHIVE.is_file() and not INNER_ARCHIVE.is_symlink(),
        "inner_archive_bytes_exact": INNER_ARCHIVE.stat().st_size == INNER_BYTES,
        "inner_archive_sha256_exact": sha256(INNER_ARCHIVE) == INNER_SHA256,
        "inner_archive_members_safe": inner_safe and inner_members > 0,
        "recovery_preexecution_pass": "R14_PREEXECUTION_PASS" in text(CLOUD / "cloudshell.stdout.txt"),
        "recovery_exit_zero": text(CLOUD / "procedure.exit.txt").strip() == "0",
        "original_vm_terminated": original.get("status") == "TERMINATED",
        "clone_read_only_mount": "DEVICE_RO=1" in device
        and "MOUNT_OPTIONS=ro," in device
        and "sdb1  part ext4" in device
        and "  1 /mnt/nhm2-p8j-r13-rescue" in device,
        "controller_identity_exact": sha256(INNER_DATA / "controller.source.sh") == CONTROLLER_SHA256,
        "controller_identity_receipt_exact": CONTROLLER_SHA256 in text(INNER_DATA / "controller.sha256.txt"),
        "fixture_pass_14_of_14": fixture.get("status") == "PASS"
        and fixture.get("checks_passed") == 14 and fixture.get("checks_total") == 14,
        "executable_identity_exact": text(EVIDENCE / "executable.sha256.txt").strip() == EXECUTABLE_SHA256,
        "run_completed_without_timeout": text(EVIDENCE / "run.exit.txt").strip() == "0"
        and text(EVIDENCE / "timed_out.txt").strip() == "false",
        "postrun_frozen_audit_failure_preserved": text(EVIDENCE / "controller.exit.txt").strip() == "1"
        and text(EVIDENCE / "failure.phase.txt").strip() == "result_audit_execution",
        "terminal_record_regular_non_symlink": record_path.is_file() and not record_path.is_symlink(),
        "terminal_record_hash_exact": sha256(record_path) == RECORD_SHA256,
        "stdout_matches_terminal_record": text(EVIDENCE / "stdout.txt") == text(record_path),
        "terminal_success_shape": record.get("schema")
        == "nhm2.g2h_e_s5.c08_h2_p8j_representative_attribution.v1"
        and record.get("status") == "PASS" and record.get("phase") == "complete"
        and panel_count == 65536 and record.get("thread_count") == 32,
        "elementary_count_exact": record.get("terms_per_panel") == 4
        and record.get("elementary_terms_observed") == panel_count * 4,
        "representative_integrated_count_uniform": integrated_per_panel == 16638,
        "boundary_count_exact": boundary_per_panel == 22,
        "all_reconstructions_exact": record.get("all_panel_reconstructions_equal") is True
        and record.get("final_reconstruction_equal") is True
        and record.get("all_slot3_reconstructions_equal") is True,
        "all_required_balls_nonnegative": balls_parse and nonnegative,
        "slot3_strictly_exceeds_rail": strict(parsed["slot3"], parsed["threshold"]),
        "integrated_component_strictly_exceeds_rail": strict(parsed["integrated"], parsed["threshold"]),
        "direct_integrated_sum_strictly_exceeds_rail": strict(parsed["direct"], parsed["threshold"]),
        "integrated_strictly_dominates_boundary": strict(parsed["integrated"], parsed["boundary"]),
        "gprime_hull_strictly_exceeds_f_hull": strict(parsed["g_hull"], parsed["f_hull"]),
        "component_sum_covers_slot3": component_sum is not None
        and component_sum.low <= parsed["slot3"].low
        and component_sum.high >= parsed["slot3"].high,
        "frozen_auditor_identity_exact": sha256(ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8j_result_audit.py")
        == FROZEN_AUDITOR_SHA256,
        "frozen_audit_failure_hash_exact": sha256(frozen_audit_path) == FROZEN_AUDIT_SHA256,
        "frozen_audit_failure_shape_exact": frozen_audit.get("audit_status") == "FAIL"
        and frozen_audit.get("checks_passed") == 4 and frozen_audit.get("checks_total") == 9
        and frozen_audit.get("result_classification") == "P8J_AUDIT_FAIL"
        and "4/9 FAIL" in frozen_stdout,
        "candidate_neutral_authority_locked": record.get("candidate_evaluations") == 0
        and record.get("positive_parameter_samples") == 0
        and record.get("candidate_roots_created") is False
        and record.get("scientific_handler_linked") is False
        and record.get("authority_promoted") is False,
    }
    failed = [name for name, passed in checks.items() if not passed]
    ratio = divide(parsed["final"], parsed["threshold"]) if balls_parse else None
    direct_ratio = divide(parsed["direct"], parsed["threshold"]) if balls_parse else None
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8j_r14_recovery_result_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "outer_archive_sha256": sha256(OUTER_ARCHIVE),
        "inner_archive_sha256": sha256(INNER_ARCHIVE),
        "terminal_record_sha256": sha256(record_path),
        "frozen_audit_sha256": sha256(frozen_audit_path),
        "benchmark_result": "PASS",
        "terminal_classification": "scientific attribution / frozen result-auditor contract mismatch",
        "scientific_classification": "P8J_DIRECT_INTEGRATION_GPRIME_HULL_ASYMMETRY_LEAD",
        "observations": {
            "panels": panel_count,
            "integrated_terms_per_panel": integrated_per_panel,
            "boundary_terms_per_panel": boundary_per_panel,
            "final_to_threshold_recomputed": interval_json(ratio),
            "direct_integrated_to_threshold_recomputed": interval_json(direct_ratio),
            "boundary_component": interval_json(parsed["boundary"]),
            "frozen_auditor_expected_integrated_terms_per_panel": 1086,
            "frozen_auditor_required_all_balls_strictly_positive": True,
        },
        "demonstrated_blocker": (
            "the frozen result auditor imported the 1,086-term manufactured-panel count "
            "into the representative 16,638-term panel and rejected the valid exact-zero "
            "boundary component before classification"
        ),
        "next_gate_decision": (
            "preserve the numerical result; do not rerun; separately version an evidence-only "
            "auditor correction that admits nonnegative boundary balls and binds representative "
            "coverage counts, then use the authenticated direct-integration attribution to select "
            "the next candidate-neutral enclosure diagnostic"
        ),
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
    print(payload["scientific_classification"])
    print(sha256(OUTPUT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
