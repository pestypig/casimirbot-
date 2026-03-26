from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import run_drc


class RunDrcTests(unittest.TestCase):
    def test_resolve_klayout_binary_prefers_appdata_install(self) -> None:
        with mock.patch("pathlib.Path.exists", return_value=True):
            resolved = run_drc.resolve_klayout_binary()
        self.assertIsNotNone(resolved)
        self.assertEqual(resolved.name, "klayout_app.exe")

    def test_resolve_klayout_binary_falls_back_to_path(self) -> None:
        with mock.patch("pathlib.Path.exists", return_value=False):
            with mock.patch("shutil.which", side_effect=[None, r"C:\Tools\klayout.exe", None]):
                resolved = run_drc.resolve_klayout_binary()
        self.assertEqual(resolved, Path(r"C:\Tools\klayout.exe"))

    def test_build_command_contains_required_flags(self) -> None:
        input_path = Path("artifacts/layout/nhm2/nhm2-layout-smoke.gds")
        report_path = Path("artifacts/layout/nhm2/klayout-drc-report.rdb")
        summary_path = Path("artifacts/layout/nhm2/klayout-drc-summary.md")
        command = run_drc.build_command(
            Path(r"C:\KLayout\klayout_app.exe"),
            Path("tools/cavity-layout/klayout/nhm2_smoke_drc.py"),
            input_path,
            report_path,
            summary_path,
        )
        self.assertIn("-b", command)
        self.assertIn("-r", command)
        self.assertIn(f"input={input_path}", command)
        self.assertIn(f"report={report_path}", command)
        self.assertIn(f"summary={summary_path}", command)

    def test_missing_klayout_writes_failure_summary(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            base = Path(temp_dir)
            input_gds = base / "layout.gds"
            input_gds.write_bytes(b"GDS")
            summary_path = base / "summary.md"
            manifest_path = base / "nhm2-layout-export-manifest.json"
            manifest_path.write_text(
                json.dumps(
                    {
                        "contract": {"sha256": "abc123"},
                        "packages": {"tile": {}, "array": {}, "die": {}},
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            with mock.patch("run_drc.resolve_klayout_binary", return_value=None):
                code = run_drc.run_drc(
                    input_gds=input_gds,
                    report_path=base / "report.rdb",
                    summary_path=summary_path,
                    rule_path=base / "rule.py",
                    manifest_path=manifest_path,
                )
            self.assertEqual(code, 1)
            self.assertIn("klayout_not_found", summary_path.read_text(encoding="utf-8"))
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["drc"]["status"], "exit_1")

    def test_run_drc_invokes_subprocess_with_expected_command(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            base = Path(temp_dir)
            input_gds = base / "layout.gds"
            input_gds.write_bytes(b"GDS")
            report = base / "report.rdb"
            summary = base / "summary.md"
            manifest_path = base / "nhm2-layout-export-manifest.json"
            rule = base / "rule.py"
            rule.write_text("print('rule')\n", encoding="utf-8")
            manifest_path.write_text(
                json.dumps(
                    {
                        "contract": {"sha256": "abc123"},
                        "packages": {"tile": {}, "array": {}, "die": {}},
                    }
                )
                + "\n",
                encoding="utf-8",
            )

            completed = mock.Mock(returncode=0, stdout="", stderr="")

            def fake_run(*args: Any, **kwargs: Any) -> mock.Mock:
                report.write_text("rdb", encoding="utf-8")
                summary.write_text("# summary\n", encoding="utf-8")
                return completed

            with mock.patch("run_drc.resolve_klayout_binary", return_value=Path(r"C:\KLayout\klayout_app.exe")):
                with mock.patch("subprocess.run", side_effect=fake_run) as mocked_run:
                    code = run_drc.run_drc(
                        input_gds=input_gds,
                        report_path=report,
                        summary_path=summary,
                        rule_path=rule,
                        manifest_path=manifest_path,
                    )

            self.assertEqual(code, 0)
            mocked_run.assert_called_once()
            command = mocked_run.call_args.args[0]
            self.assertEqual(command[0], r"C:\KLayout\klayout_app.exe")
            self.assertIn(f"input={input_gds}", command)
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["drc"]["status"], "pass")
            self.assertTrue(manifest["packages"]["tile"]["paired_drc"]["report"]["exists"])


if __name__ == "__main__":
    unittest.main()
