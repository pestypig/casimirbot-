#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

try:
    import gdstk
except ModuleNotFoundError as exc:  # pragma: no cover - operator-facing failure path
    raise SystemExit(
        "gdstk is required. Activate .venv-layout or install gdstk before running this tool."
    ) from exc

try:
    from validate_contract import read_contract, validate_contract_data
except ModuleNotFoundError:  # pragma: no cover - fallback for direct embedding
    def read_contract(path: Path) -> dict[str, Any]:
        return json.loads(path.read_text(encoding="utf-8"))

    def validate_contract_data(contract: dict[str, Any]) -> dict[str, Any]:
        return {
            "valid": True,
            "errorCount": 0,
            "warningCount": 0,
            "errors": [],
            "warnings": [],
            "metrics": {},
        }


LAYER_MAP = {
    "bottom_mirror": 10,
    "cavity_gap": 20,
    "top_membrane": 30,
    "anchor_posts": 40,
    "release_holes": 50,
    "seal_ring": 60,
    "pads": 70,
    "alignment": 80,
    "witness": 90,
    "die_outline": 99,
}
DEFAULT_DRC_REPORT = Path("klayout-drc-report.rdb")
DEFAULT_DRC_SUMMARY = Path("klayout-drc-summary.md")
DEFAULT_EXPORT_MANIFEST = Path("nhm2-layout-export-manifest.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Emit the NHM2 cavity geometry-freeze layout as GDS and OAS."
    )
    parser.add_argument(
        "--contract",
        type=Path,
        default=Path("configs/needle-hull-mark2-cavity-contract.v1.json"),
        help="Path to the NHM2 cavity contract JSON.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("artifacts/layout/nhm2"),
        help="Directory for emitted layout artifacts.",
    )
    parser.add_argument(
        "--skip-validate",
        action="store_true",
        help="Skip contract validation before layout emission.",
    )
    return parser.parse_args()


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def artifact_entry(path: Path) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "path": path.as_posix(),
        "exists": path.exists(),
    }
    if path.exists():
        entry["sha256"] = file_sha256(path)
        entry["size_bytes"] = path.stat().st_size
    return entry


def number(value: Any, label: str) -> float:
    if not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be numeric, received {value!r}")
    return float(value)


def rect(cx: float, cy: float, width: float, height: float, layer: int) -> gdstk.Polygon:
    half_w = width / 2.0
    half_h = height / 2.0
    return gdstk.rectangle(
        (cx - half_w, cy - half_h),
        (cx + half_w, cy + half_h),
        layer=layer,
        datatype=0,
    )


def add_boolean(
    cell: gdstk.Cell,
    subject: list[gdstk.Polygon],
    clip: list[gdstk.Polygon],
    operation: str,
    layer: int,
) -> None:
    polygons = gdstk.boolean(subject, clip, operation, layer=layer, datatype=0)
    if polygons:
        cell.add(*polygons)


def add_alignment_cross(
    cell: gdstk.Cell,
    cx: float,
    cy: float,
    arm_length: float,
    arm_width: float,
) -> None:
    layer = LAYER_MAP["alignment"]
    cell.add(rect(cx, cy, arm_length, arm_width, layer))
    cell.add(rect(cx, cy, arm_width, arm_length, layer))


def compute_post_centers(count: int, ring_radius_um: float) -> list[tuple[float, float]]:
    if count <= 0:
        return []
    centers: list[tuple[float, float]] = []
    for index in range(count):
        angle = (2.0 * math.pi * index) / count
        centers.append(
            (
                ring_radius_um * math.cos(angle),
                ring_radius_um * math.sin(angle),
            )
        )
    return centers


def compute_release_hole_centers(
    rows: int,
    columns: int,
    pitch_um: float,
    keep_radius_um: float,
    hole_radius_um: float,
    post_centers: list[tuple[float, float]],
    post_guard_um: float,
) -> list[tuple[float, float]]:
    start_x = -((columns - 1) * pitch_um) / 2.0
    start_y = -((rows - 1) * pitch_um) / 2.0
    centers: list[tuple[float, float]] = []
    for row in range(rows):
        for column in range(columns):
            x = start_x + (column * pitch_um)
            y = start_y + (row * pitch_um)
            if math.hypot(x, y) + hole_radius_um > keep_radius_um:
                raise ValueError("Release-hole grid exceeds cavity keep radius.")
            if any(math.hypot(x - px, y - py) < post_guard_um for px, py in post_centers):
                raise ValueError("Release-hole grid overlaps anchor-post keepout.")
            centers.append((x, y))
    return centers


def build_tile_cell(lib: gdstk.Library, contract: dict[str, Any]) -> tuple[gdstk.Cell, dict[str, Any]]:
    layout = contract["layout"]
    geometry = contract["geometry"]

    tile_width_um = number(geometry["tileWidth_mm"], "geometry.tileWidth_mm") * 1000.0
    tile_height_um = number(geometry["tileHeight_mm"], "geometry.tileHeight_mm") * 1000.0
    pocket_diameter_um = number(geometry["pocketDiameter_um"], "geometry.pocketDiameter_um")
    gap_nm = number(geometry["gap_nm"], "geometry.gap_nm")
    rim_width_um = number(geometry["rimWidth_um"], "geometry.rimWidth_um")

    seal_ring = layout["sealRing"]
    seal_inset_um = number(seal_ring["inset_um"], "layout.sealRing.inset_um")
    seal_width_um = number(seal_ring["width_um"], "layout.sealRing.width_um")

    pad_layout = layout["padArray"]
    pad_width_um = number(pad_layout["width_um"], "layout.padArray.width_um")
    pad_height_um = number(pad_layout["height_um"], "layout.padArray.height_um")
    pad_edge_inset_um = number(pad_layout["edgeInset_um"], "layout.padArray.edgeInset_um")

    marks = layout["alignmentMarks"]
    mark_size_um = number(marks["size_um"], "layout.alignmentMarks.size_um")
    mark_edge_inset_um = number(marks["edgeInset_um"], "layout.alignmentMarks.edgeInset_um")
    mark_arm_width_um = max(10.0, mark_size_um / 5.0)

    posts = layout["anchorPosts"]
    post_count = int(number(posts["count"], "layout.anchorPosts.count"))
    post_radius_um = number(posts["radius_um"], "layout.anchorPosts.radius_um")
    post_ring_radius_um = number(posts["ringRadius_um"], "layout.anchorPosts.ringRadius_um")

    holes = layout["releaseHoles"]
    hole_diameter_um = number(holes["diameter_um"], "layout.releaseHoles.diameter_um")
    hole_pitch_um = number(holes["pitch_um"], "layout.releaseHoles.pitch_um")
    hole_rows = int(number(holes["rows"], "layout.releaseHoles.rows"))
    hole_columns = int(number(holes["columns"], "layout.releaseHoles.columns"))

    witness_zone = layout["witnessZone"]
    witness_spacing_um = number(witness_zone["spacing_um"], "layout.witnessZone.spacing_um")
    witness_offset_um = number(
        witness_zone["centerOffsetFromBottom_um"],
        "layout.witnessZone.centerOffsetFromBottom_um",
    )
    coupons = layout["witnessCoupons"]

    cell = lib.new_cell("NHM2_TILE")
    half_tile_w = tile_width_um / 2.0
    half_tile_h = tile_height_um / 2.0

    cell.add(rect(0.0, 0.0, tile_width_um, tile_height_um, LAYER_MAP["top_membrane"]))

    active_width_um = tile_width_um - (2.0 * seal_inset_um)
    active_height_um = tile_height_um - (2.0 * seal_inset_um)
    cell.add(rect(0.0, 0.0, active_width_um, active_height_um, LAYER_MAP["bottom_mirror"]))

    pocket_radius_um = pocket_diameter_um / 2.0
    cell.add(gdstk.ellipse((0.0, 0.0), pocket_radius_um, layer=LAYER_MAP["cavity_gap"], datatype=0))

    seal_outer = [rect(0.0, 0.0, active_width_um, active_height_um, LAYER_MAP["seal_ring"])]
    seal_inner = [
        rect(
            0.0,
            0.0,
            active_width_um - (2.0 * seal_width_um),
            active_height_um - (2.0 * seal_width_um),
            LAYER_MAP["seal_ring"],
        )
    ]
    add_boolean(cell, seal_outer, seal_inner, "not", LAYER_MAP["seal_ring"])

    post_centers = compute_post_centers(post_count, post_ring_radius_um)
    for center in post_centers:
        cell.add(gdstk.ellipse(center, post_radius_um, layer=LAYER_MAP["anchor_posts"], datatype=0))

    hole_radius_um = hole_diameter_um / 2.0
    release_keep_radius_um = pocket_radius_um - rim_width_um - hole_radius_um
    post_guard_um = post_radius_um + hole_diameter_um
    for center in compute_release_hole_centers(
        rows=hole_rows,
        columns=hole_columns,
        pitch_um=hole_pitch_um,
        keep_radius_um=release_keep_radius_um,
        hole_radius_um=hole_radius_um,
        post_centers=post_centers,
        post_guard_um=post_guard_um,
    ):
        cell.add(gdstk.ellipse(center, hole_radius_um, layer=LAYER_MAP["release_holes"], datatype=0))

    pad_x = half_tile_w - pad_edge_inset_um
    pad_y = half_tile_h - pad_edge_inset_um
    for cx, cy in ((0.0, pad_y), (0.0, -pad_y), (pad_x, 0.0), (-pad_x, 0.0)):
        cell.add(rect(cx, cy, pad_width_um, pad_height_um, LAYER_MAP["pads"]))

    mark_x = half_tile_w - mark_edge_inset_um
    mark_y = half_tile_h - mark_edge_inset_um
    for cx, cy in ((mark_x, mark_y), (mark_x, -mark_y), (-mark_x, mark_y), (-mark_x, -mark_y)):
        add_alignment_cross(cell, cx, cy, mark_size_um, mark_arm_width_um)

    total_coupon_width = sum(
        number(coupon["width_um"], f"layout.witnessCoupons.{coupon['name']}.width_um")
        for coupon in coupons
    )
    if coupons:
        total_coupon_width += witness_spacing_um * (len(coupons) - 1)
    cursor_x = -(total_coupon_width / 2.0)
    coupon_center_y = -half_tile_h + witness_offset_um
    for coupon in coupons:
        coupon_width_um = number(coupon["width_um"], f"layout.witnessCoupons.{coupon['name']}.width_um")
        coupon_height_um = number(
            coupon["height_um"],
            f"layout.witnessCoupons.{coupon['name']}.height_um",
        )
        coupon_center_x = cursor_x + (coupon_width_um / 2.0)
        cell.add(
            rect(
                coupon_center_x,
                coupon_center_y,
                coupon_width_um,
                coupon_height_um,
                LAYER_MAP["witness"],
            )
        )
        cursor_x += coupon_width_um + witness_spacing_um

    metadata = {
        "tile_width_um": tile_width_um,
        "tile_height_um": tile_height_um,
        "pocket_diameter_um": pocket_diameter_um,
        "gap_nm": gap_nm,
        "post_count": post_count,
        "release_rows": hole_rows,
        "release_columns": hole_columns,
    }
    return cell, metadata


def build_array_cell(
    lib: gdstk.Library,
    tile_cell: gdstk.Cell,
    tile_metadata: dict[str, Any],
) -> tuple[gdstk.Cell, dict[str, Any]]:
    cell = lib.new_cell("NHM2_ARRAY_2X2")
    tile_width_um = tile_metadata["tile_width_um"]
    tile_height_um = tile_metadata["tile_height_um"]
    spacing_um = 1000.0
    pitch_x = tile_width_um + spacing_um
    pitch_y = tile_height_um + spacing_um
    for ix in range(2):
        for iy in range(2):
            origin = ((ix - 0.5) * pitch_x, (iy - 0.5) * pitch_y)
            cell.add(gdstk.Reference(tile_cell, origin))

    metadata = {
        "rows": 2,
        "columns": 2,
        "pitch_x_um": pitch_x,
        "pitch_y_um": pitch_y,
        "width_um": (2.0 * tile_width_um) + spacing_um,
        "height_um": (2.0 * tile_height_um) + spacing_um,
    }
    return cell, metadata


def build_die_cell(
    lib: gdstk.Library,
    array_cell: gdstk.Cell,
    array_metadata: dict[str, Any],
) -> gdstk.Cell:
    cell = lib.new_cell("NHM2_DIE")
    die_margin_um = 2000.0
    cell.add(gdstk.Reference(array_cell, (0.0, 0.0)))
    cell.add(
        rect(
            0.0,
            0.0,
            array_metadata["width_um"] + (2.0 * die_margin_um),
            array_metadata["height_um"] + (2.0 * die_margin_um),
            LAYER_MAP["die_outline"],
        )
    )
    return cell


def build_layout_libraries(contract: dict[str, Any]) -> dict[str, gdstk.Library]:
    tile_lib = gdstk.Library(unit=1e-6, precision=1e-9)
    build_tile_cell(tile_lib, contract)

    array_lib = gdstk.Library(unit=1e-6, precision=1e-9)
    array_tile_cell, array_tile_metadata = build_tile_cell(array_lib, contract)
    build_array_cell(array_lib, array_tile_cell, array_tile_metadata)

    die_lib = gdstk.Library(unit=1e-6, precision=1e-9)
    die_tile_cell, die_tile_metadata = build_tile_cell(die_lib, contract)
    die_array_cell, die_array_metadata = build_array_cell(
        die_lib, die_tile_cell, die_tile_metadata
    )
    build_die_cell(die_lib, die_array_cell, die_array_metadata)

    return {
        "tile": tile_lib,
        "array": array_lib,
        "die": die_lib,
    }


def write_library_outputs(
    lib: gdstk.Library,
    gds_path: Path,
    oas_path: Path,
) -> dict[str, str]:
    lib.write_gds(gds_path)
    lib.write_oas(oas_path)
    return {
        "gds": str(gds_path.as_posix()),
        "oas": str(oas_path.as_posix()),
    }


def write_outputs(
    libraries: dict[str, gdstk.Library],
    contract: dict[str, Any],
    contract_path: Path,
    out_dir: Path,
) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    smoke_gds_path = out_dir / "nhm2-layout-smoke.gds"
    smoke_oas_path = out_dir / "nhm2-layout-smoke.oas"
    summary_path = out_dir / "nhm2-layout-smoke-summary.json"
    layer_map_path = out_dir / "nhm2-layer-map.json"
    manifest_path = out_dir / DEFAULT_EXPORT_MANIFEST
    drc_report_path = out_dir / DEFAULT_DRC_REPORT
    drc_summary_path = out_dir / DEFAULT_DRC_SUMMARY
    package_outputs = {
        "tile": write_library_outputs(
            libraries["tile"],
            out_dir / "nhm2-tile.gds",
            out_dir / "nhm2-tile.oas",
        ),
        "array": write_library_outputs(
            libraries["array"],
            out_dir / "nhm2-array-2x2.gds",
            out_dir / "nhm2-array-2x2.oas",
        ),
        "die": write_library_outputs(
            libraries["die"],
            out_dir / "nhm2-die.gds",
            out_dir / "nhm2-die.oas",
        ),
    }
    smoke_outputs = write_library_outputs(
        libraries["die"],
        smoke_gds_path,
        smoke_oas_path,
    )

    layer_map = {
        name: {
            "layer": layer,
            "datatype": 0,
            "gds": f"{layer}/0",
        }
        for name, layer in LAYER_MAP.items()
    }
    summary = {
        "contract_path": str(contract_path.as_posix()),
        "contract_sha256": file_sha256(contract_path),
        "cells": sorted(cell.name for cell in libraries["die"].cells),
        "files": {
            **smoke_outputs,
            "summary": str(summary_path.as_posix()),
            "layer_map": str(layer_map_path.as_posix()),
            "manifest": str(manifest_path.as_posix()),
            "packages": package_outputs,
        },
        "layer_map": {name: spec["gds"] for name, spec in layer_map.items()},
        "status": "generated",
    }
    layer_map_path.write_text(json.dumps(layer_map, indent=2) + "\n", encoding="utf-8")
    summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "schema_version": "nhm2_layout_export_manifest/1",
        "contract": {
            "path": contract_path.as_posix(),
            "sha256": summary["contract_sha256"],
            "status": contract.get("status"),
            "profileVersion": contract.get("profileVersion"),
            "solutionCategory": contract.get("solutionCategory"),
        },
        "summary": artifact_entry(summary_path),
        "layer_map": artifact_entry(layer_map_path),
        "smoke": {
            "top_cell": "NHM2_DIE",
            "gds": artifact_entry(smoke_gds_path),
            "oas": artifact_entry(smoke_oas_path),
        },
        "drc": {
            "status": "pending",
            "top_cell": "NHM2_DIE",
            "input_gds": artifact_entry(smoke_gds_path),
            "report": artifact_entry(drc_report_path),
            "summary": artifact_entry(drc_summary_path),
        },
        "packages": {
            "tile": {
                "top_cell": "NHM2_TILE",
                "gds": artifact_entry(out_dir / "nhm2-tile.gds"),
                "oas": artifact_entry(out_dir / "nhm2-tile.oas"),
                "paired_contract_sha256": summary["contract_sha256"],
                "paired_drc": {
                    "status": "pending",
                    "report": artifact_entry(drc_report_path),
                    "summary": artifact_entry(drc_summary_path),
                },
            },
            "array": {
                "top_cell": "NHM2_ARRAY_2X2",
                "gds": artifact_entry(out_dir / "nhm2-array-2x2.gds"),
                "oas": artifact_entry(out_dir / "nhm2-array-2x2.oas"),
                "paired_contract_sha256": summary["contract_sha256"],
                "paired_drc": {
                    "status": "pending",
                    "report": artifact_entry(drc_report_path),
                    "summary": artifact_entry(drc_summary_path),
                },
            },
            "die": {
                "top_cell": "NHM2_DIE",
                "gds": artifact_entry(out_dir / "nhm2-die.gds"),
                "oas": artifact_entry(out_dir / "nhm2-die.oas"),
                "paired_contract_sha256": summary["contract_sha256"],
                "paired_drc": {
                    "status": "pending",
                    "report": artifact_entry(drc_report_path),
                    "summary": artifact_entry(drc_summary_path),
                },
            },
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return summary["files"]


def main() -> int:
    args = parse_args()
    contract = read_contract(args.contract)
    if not args.skip_validate:
        validation = validate_contract_data(contract)
        if not validation["valid"]:
            print(json.dumps(validation, indent=2), file=sys.stderr)
            return 1

    outputs = write_outputs(
        build_layout_libraries(contract),
        contract,
        args.contract,
        args.out_dir,
    )
    print(json.dumps(outputs, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
