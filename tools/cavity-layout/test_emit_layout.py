from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import gdstk


REPO_ROOT = Path(__file__).resolve().parents[2]
EMIT_SCRIPT = REPO_ROOT / "tools" / "cavity-layout" / "emit_layout.py"
CONTRACT = REPO_ROOT / "configs" / "needle-hull-mark2-cavity-contract.v1.json"
PYTHON = REPO_ROOT / ".venv-layout" / "Scripts" / "python.exe"


class EmitLayoutTest(unittest.TestCase):
    def test_emits_gds_oas_summary_layer_map_packages_and_previews(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            out_dir = Path(temp_dir)
            completed = subprocess.run(
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

            gds_path = out_dir / "nhm2-layout-smoke.gds"
            oas_path = out_dir / "nhm2-layout-smoke.oas"
            summary_path = out_dir / "nhm2-layout-smoke-summary.json"
            layer_map_path = out_dir / "nhm2-layer-map.json"
            manifest_path = out_dir / "nhm2-layout-export-manifest.json"
            preview_dir = out_dir / "previews"
            tile_gds_path = out_dir / "nhm2-tile.gds"
            array_gds_path = out_dir / "nhm2-array-2x2.gds"
            die_gds_path = out_dir / "nhm2-die.gds"
            smoke_svg_path = preview_dir / "nhm2-smoke-preview.svg"
            smoke_png_path = preview_dir / "nhm2-smoke-preview.png"
            tile_svg_path = preview_dir / "nhm2-tile-preview.svg"
            tile_png_path = preview_dir / "nhm2-tile-preview.png"
            array_svg_path = preview_dir / "nhm2-array-2x2-preview.svg"
            die_png_path = preview_dir / "nhm2-die-preview.png"

            self.assertTrue(gds_path.exists(), completed.stdout)
            self.assertTrue(oas_path.exists(), completed.stdout)
            self.assertTrue(summary_path.exists(), completed.stdout)
            self.assertTrue(layer_map_path.exists(), completed.stdout)
            self.assertTrue(manifest_path.exists(), completed.stdout)
            self.assertTrue(tile_gds_path.exists(), completed.stdout)
            self.assertTrue(array_gds_path.exists(), completed.stdout)
            self.assertTrue(die_gds_path.exists(), completed.stdout)
            self.assertTrue(smoke_svg_path.exists(), completed.stdout)
            self.assertTrue(smoke_png_path.exists(), completed.stdout)
            self.assertTrue(tile_svg_path.exists(), completed.stdout)
            self.assertTrue(tile_png_path.exists(), completed.stdout)
            self.assertTrue(array_svg_path.exists(), completed.stdout)
            self.assertTrue(die_png_path.exists(), completed.stdout)

            summary = json.loads(summary_path.read_text(encoding="utf-8"))
            self.assertEqual(
                summary["cells"],
                ["NHM2_ARRAY_2X2", "NHM2_DIE", "NHM2_TILE"],
            )
            self.assertEqual(summary["files"]["layer_map"], layer_map_path.as_posix())
            self.assertEqual(
                summary["files"]["packages"]["tile"]["gds"],
                tile_gds_path.as_posix(),
            )
            self.assertEqual(
                summary["files"]["packages"]["array"]["gds"],
                array_gds_path.as_posix(),
            )
            self.assertEqual(
                summary["files"]["packages"]["die"]["gds"],
                die_gds_path.as_posix(),
            )
            self.assertEqual(summary["files"]["manifest"], manifest_path.as_posix())
            self.assertEqual(
                summary["files"]["previews"]["tile"]["svg"],
                tile_svg_path.as_posix(),
            )
            self.assertEqual(
                summary["files"]["previews"]["smoke"]["png"],
                smoke_png_path.as_posix(),
            )

            layer_map = json.loads(layer_map_path.read_text(encoding="utf-8"))
            self.assertEqual(layer_map["seal_ring"]["gds"], "60/0")

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["schema_version"], "nhm2_layout_export_manifest/1")
            self.assertEqual(
                manifest["packages"]["tile"]["paired_contract_sha256"],
                summary["contract_sha256"],
            )
            self.assertEqual(
                manifest["packages"]["die"]["paired_drc"]["report"]["path"],
                (out_dir / "klayout-drc-report.rdb").as_posix(),
            )
            self.assertEqual(manifest["drc"]["status"], "pending")
            self.assertEqual(
                manifest["packages"]["array"]["preview"]["svg"]["path"],
                array_svg_path.as_posix(),
            )
            self.assertEqual(
                manifest["smoke"]["preview"]["png"]["path"],
                smoke_png_path.as_posix(),
            )
            self.assertGreater(manifest["packages"]["tile"]["preview"]["png"]["size_bytes"], 0)

            library = gdstk.read_gds(gds_path)
            cell_names = sorted(cell.name for cell in library.cells)
            self.assertEqual(cell_names, ["NHM2_ARRAY_2X2", "NHM2_DIE", "NHM2_TILE"])

            tile_library = gdstk.read_gds(tile_gds_path)
            self.assertEqual(sorted(cell.name for cell in tile_library.cells), ["NHM2_TILE"])


if __name__ == "__main__":
    unittest.main()
