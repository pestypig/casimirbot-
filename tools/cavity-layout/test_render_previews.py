from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
EMIT_SCRIPT = REPO_ROOT / "tools" / "cavity-layout" / "emit_layout.py"
PREVIEW_SCRIPT = REPO_ROOT / "tools" / "cavity-layout" / "render_previews.py"
CONTRACT = REPO_ROOT / "configs" / "needle-hull-mark2-cavity-contract.v1.json"
PYTHON = REPO_ROOT / ".venv-layout" / "Scripts" / "python.exe"


class RenderPreviewsTest(unittest.TestCase):
    def test_renders_preview_pack_for_existing_layout_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            out_dir = Path(temp_dir)
            subprocess.run(
                [
                    str(PYTHON),
                    str(EMIT_SCRIPT),
                    "--contract",
                    str(CONTRACT),
                    "--out-dir",
                    str(out_dir),
                ],
                cwd=REPO_ROOT,
                check=True,
                capture_output=True,
                text=True,
            )

            manifest_path = out_dir / "nhm2-layout-export-manifest.json"
            preview_dir = out_dir / "rerendered-previews"
            completed = subprocess.run(
                [
                    str(PYTHON),
                    str(PREVIEW_SCRIPT),
                    "--out-dir",
                    str(out_dir),
                    "--manifest",
                    str(manifest_path),
                    "--preview-dir",
                    str(preview_dir),
                ],
                cwd=REPO_ROOT,
                check=True,
                capture_output=True,
                text=True,
            )

            payload = json.loads(completed.stdout)
            self.assertEqual(payload["die"]["top_cell"], "NHM2_DIE")
            self.assertTrue((preview_dir / "nhm2-die-preview.svg").exists())
            self.assertTrue((preview_dir / "nhm2-die-preview.png").exists())

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(
                manifest["packages"]["die"]["preview"]["png"]["path"],
                (preview_dir / "nhm2-die-preview.png").as_posix(),
            )
            self.assertEqual(
                manifest["previews"]["tile"]["svg"]["path"],
                (preview_dir / "nhm2-tile-preview.svg").as_posix(),
            )


if __name__ == "__main__":
    unittest.main()
