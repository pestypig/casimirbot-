#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any


DEFAULT_OUT_DIR = Path("artifacts/layout/nhm2")
DEFAULT_INPUT_GDS = DEFAULT_OUT_DIR / "nhm2-layout-smoke.gds"
DEFAULT_REPORT = DEFAULT_OUT_DIR / "klayout-drc-report.rdb"
DEFAULT_SUMMARY = DEFAULT_OUT_DIR / "klayout-drc-summary.md"
DEFAULT_MANIFEST = DEFAULT_OUT_DIR / "nhm2-layout-export-manifest.json"
DEFAULT_RULE = Path("tools/cavity-layout/klayout/nhm2_smoke_drc.py")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run KLayout batch DRC for NHM2 cavity layout.")
    parser.add_argument("--input-gds", type=Path, default=DEFAULT_INPUT_GDS, help="Input GDS path.")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT, help="Output RDB report path.")
    parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY, help="Output markdown summary path.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST, help="Output export manifest path.")
    parser.add_argument("--rule", type=Path, default=DEFAULT_RULE, help="KLayout DRC script path.")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="Output directory.")
    return parser.parse_args()


def default_paths(out_dir: Path) -> dict[str, Path]:
    return {
        "input_gds": out_dir / "nhm2-layout-smoke.gds",
        "report": out_dir / "klayout-drc-report.rdb",
        "summary": out_dir / "klayout-drc-summary.md",
        "manifest": out_dir / "nhm2-layout-export-manifest.json",
    }


def resolve_klayout_binary() -> Path | None:
    appdata = Path.home() / "AppData" / "Roaming" / "KLayout" / "klayout_app.exe"
    if appdata.exists():
        return appdata
    for candidate in ("klayout_app.exe", "klayout.exe", "klayout"):
        found = shutil.which(candidate)
        if found:
            return Path(found)
    return None


def build_command(
    klayout_binary: Path,
    rule_path: Path,
    input_gds: Path,
    report_path: Path,
    summary_path: Path,
) -> list[str]:
    return [
        str(klayout_binary),
        "-b",
        "-r",
        str(rule_path),
        "-rd",
        f"input={input_gds}",
        "-rd",
        f"report={report_path}",
        "-rd",
        f"summary={summary_path}",
    ]


def write_summary(summary_path: Path, lines: list[str]) -> None:
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def file_sha256(path: Path) -> str | None:
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact_entry(path: Path) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "path": path.as_posix(),
        "exists": path.exists(),
    }
    digest = file_sha256(path)
    if digest is not None:
        entry["sha256"] = digest
        entry["size_bytes"] = path.stat().st_size
    return entry


def update_export_manifest(
    manifest_path: Path,
    input_gds: Path,
    report_path: Path,
    summary_path: Path,
    exit_code: int,
) -> None:
    if not manifest_path.exists():
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    drc_status = "pass" if exit_code == 0 else f"exit_{exit_code}"
    paired_drc = {
        "status": drc_status,
        "input_gds": artifact_entry(input_gds),
        "report": artifact_entry(report_path),
        "summary": artifact_entry(summary_path),
    }
    manifest["drc"] = {
        "status": drc_status,
        "top_cell": "NHM2_DIE",
        **paired_drc,
    }
    packages = manifest.get("packages", {})
    if isinstance(packages, dict):
        for package in packages.values():
            if isinstance(package, dict):
                package["paired_contract_sha256"] = manifest.get("contract", {}).get("sha256")
                package["paired_drc"] = paired_drc
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def run_drc(
    input_gds: Path,
    report_path: Path,
    summary_path: Path,
    rule_path: Path,
    manifest_path: Path,
) -> int:
    if not input_gds.exists():
        write_summary(
            summary_path,
            [
                "# NHM2 Smoke DRC Summary",
                "",
                f"- input: `{input_gds.as_posix()}`",
                "- status: `failed`",
                "- reason: `missing_input_gds`",
            ],
        )
        update_export_manifest(manifest_path, input_gds, report_path, summary_path, 1)
        return 1

    klayout_binary = resolve_klayout_binary()
    if klayout_binary is None:
        write_summary(
            summary_path,
            [
                "# NHM2 Smoke DRC Summary",
                "",
                f"- input: `{input_gds.as_posix()}`",
                "- status: `failed`",
                "- reason: `klayout_not_found`",
            ],
        )
        update_export_manifest(manifest_path, input_gds, report_path, summary_path, 1)
        return 1

    report_path.unlink(missing_ok=True)
    summary_path.unlink(missing_ok=True)
    command = build_command(klayout_binary, rule_path, input_gds, report_path, summary_path)
    completed = subprocess.run(command, capture_output=True, text=True, check=False)
    if not summary_path.exists():
        write_summary(
            summary_path,
            [
                "# NHM2 Smoke DRC Summary",
                "",
                f"- input: `{input_gds.as_posix()}`",
                f"- report: `{report_path.as_posix()}`",
                f"- status: `exit_{completed.returncode}`",
                "",
                "## Wrapper Output",
                "",
                "```text",
                completed.stdout.strip(),
                completed.stderr.strip(),
                "```",
            ],
        )
    update_export_manifest(manifest_path, input_gds, report_path, summary_path, completed.returncode)
    return completed.returncode


def main() -> int:
    args = parse_args()
    derived = default_paths(args.out_dir)
    input_gds = args.input_gds if args.input_gds != DEFAULT_INPUT_GDS else derived["input_gds"]
    report = args.report if args.report != DEFAULT_REPORT else derived["report"]
    summary = args.summary if args.summary != DEFAULT_SUMMARY else derived["summary"]
    manifest = args.manifest if args.manifest != DEFAULT_MANIFEST else derived["manifest"]
    return run_drc(
        input_gds=input_gds,
        report_path=report,
        summary_path=summary,
        rule_path=args.rule,
        manifest_path=manifest,
    )


if __name__ == "__main__":
    raise SystemExit(main())
