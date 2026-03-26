#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

try:  # pragma: no cover - exercised through KLayout runtime
    import pya  # type: ignore
    import rdb  # type: ignore
except ImportError:  # pragma: no cover - local Python path
    import klayout.db as pya  # type: ignore
    import klayout.rdb as rdb  # type: ignore


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

MIN_WIDTH_RULES_UM = {
    "bottom_mirror": 0.50,
    "top_membrane": 0.50,
    "anchor_posts": 10.0,
    "release_holes": 10.0,
    "seal_ring": 10.0,
    "pads": 25.0,
    "alignment": 10.0,
    "witness": 25.0,
    "die_outline": 25.0,
}

MIN_SPACE_RULES_UM = {
    "anchor_posts": 20.0,
    "release_holes": 20.0,
    "seal_ring": 20.0,
    "pads": 50.0,
    "alignment": 20.0,
    "witness": 50.0,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run NHM2 smoke DRC in KLayout.")
    parser.add_argument("--input", required=True, type=Path, help="Input GDS path.")
    parser.add_argument("--report", required=True, type=Path, help="Output RDB path.")
    parser.add_argument("--summary", required=True, type=Path, help="Output markdown summary path.")
    return parser.parse_args()


def get_paths_from_context() -> tuple[Path, Path, Path]:
    context = globals()
    input_path = context.get("input")
    report_path = context.get("report")
    summary_path = context.get("summary")
    if input_path and report_path and summary_path:
        return Path(str(input_path)), Path(str(report_path)), Path(str(summary_path))
    args = parse_args()
    return args.input, args.report, args.summary


def to_dbu(layout: pya.Layout, microns: float) -> int:
    return max(1, int(round(microns / layout.dbu)))


def category_id(report_db: rdb.ReportDatabase, name: str, description: str) -> int:
    category = report_db.category_by_path(name)
    if category is None:
        category = report_db.create_category(None, name)
    category.description = description
    return category.rdb_id()


def region_for(layout: pya.Layout, top_cell: pya.Cell, layer_name: str) -> pya.Region:
    layer_index = layout.find_layer(LAYER_MAP[layer_name], 0)
    if layer_index is None or layer_index < 0:
        return pya.Region()
    return pya.Region(top_cell.begin_shapes_rec(layer_index))


def add_box_item(
    report_db: rdb.ReportDatabase,
    cell_id: int,
    cat_id: int,
    box: pya.Box,
) -> None:
    report_db.create_item(cell_id, cat_id, box)


def add_region_items(
    report_db: rdb.ReportDatabase,
    cell_id: int,
    cat_id: int,
    region: pya.Region,
) -> int:
    count = 0
    for polygon in region.each():
        add_box_item(report_db, cell_id, cat_id, polygon.bbox())
        count += 1
    return count


def add_edge_pair_items(
    report_db: rdb.ReportDatabase,
    cell_id: int,
    cat_id: int,
    edge_pairs: pya.EdgePairs,
) -> int:
    count = 0
    for edge_pair in edge_pairs.each():
        add_box_item(report_db, cell_id, cat_id, edge_pair.bbox())
        count += 1
    return count


def top_cell_for(layout: pya.Layout) -> pya.Cell:
    for preferred in ("NHM2_DIE", "NHM2_ARRAY_2X2", "NHM2_TILE"):
        cell = layout.cell(preferred)
        if cell is not None:
            return cell
    top_cells = layout.top_cells()
    if not top_cells:
        raise RuntimeError("No top cell found in layout.")
    return top_cells[0]


def write_summary(
    summary_path: Path,
    input_path: Path,
    report_path: Path,
    top_cell: str,
    violations: dict[str, int],
) -> None:
    total = sum(violations.values())
    lines = [
        "# NHM2 Smoke DRC Summary",
        "",
        f"- input: `{input_path.as_posix()}`",
        f"- report: `{report_path.as_posix()}`",
        f"- top cell: `{top_cell}`",
        f"- total violations: `{total}`",
        "",
        "## Violations by Rule",
        "",
    ]
    if violations:
        for name in sorted(violations):
            lines.append(f"- `{name}`: `{violations[name]}`")
    else:
        lines.append("- none")
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run_drc(input_path: Path, report_path: Path, summary_path: Path) -> int:
    layout = pya.Layout()
    layout.read(str(input_path))
    top_cell = top_cell_for(layout)

    report_db = rdb.ReportDatabase("nhm2_smoke_drc")
    cell_id = report_db.create_cell(top_cell.name).rdb_id()
    violations: dict[str, int] = {}

    missing_cat = category_id(report_db, "missing_layer", "Expected NHM2 layer missing from layout")
    for layer_name in LAYER_MAP:
        layer_region = region_for(layout, top_cell, layer_name)
        if layer_region.is_empty():
            add_box_item(report_db, cell_id, missing_cat, pya.Box(0, 0, 1, 1))
            violations[f"missing_layer/{layer_name}"] = 1

    for layer_name, min_width_um in MIN_WIDTH_RULES_UM.items():
        region = region_for(layout, top_cell, layer_name)
        if region.is_empty():
            continue
        cat_id = category_id(
            report_db,
            f"min_width/{layer_name}",
            f"Minimum width check on {layer_name}",
        )
        edge_pairs = region.width_check(to_dbu(layout, min_width_um))
        count = add_edge_pair_items(report_db, cell_id, cat_id, edge_pairs)
        if count:
            violations[f"min_width/{layer_name}"] = count

    for layer_name, min_space_um in MIN_SPACE_RULES_UM.items():
        region = region_for(layout, top_cell, layer_name)
        if region.is_empty():
            continue
        cat_id = category_id(
            report_db,
            f"min_space/{layer_name}",
            f"Minimum space check on {layer_name}",
        )
        edge_pairs = region.space_check(to_dbu(layout, min_space_um))
        count = add_edge_pair_items(report_db, cell_id, cat_id, edge_pairs)
        if count:
            violations[f"min_space/{layer_name}"] = count

    bottom_mirror = region_for(layout, top_cell, "bottom_mirror")
    cavity_gap = region_for(layout, top_cell, "cavity_gap")
    top_membrane = region_for(layout, top_cell, "top_membrane")
    anchor_posts = region_for(layout, top_cell, "anchor_posts")
    release_holes = region_for(layout, top_cell, "release_holes")
    seal_ring = region_for(layout, top_cell, "seal_ring")
    pads = region_for(layout, top_cell, "pads")
    witness = region_for(layout, top_cell, "witness")

    enclosure_checks = [
        ("cavity_outside_bottom", cavity_gap - bottom_mirror),
        ("seal_outside_top", seal_ring - top_membrane),
        ("anchors_outside_cavity", anchor_posts - cavity_gap),
        ("holes_outside_cavity", release_holes - cavity_gap),
    ]
    for name, region in enclosure_checks:
        if region.is_empty():
            continue
        cat_id = category_id(report_db, f"enclosure/{name}", f"Enclosure failure: {name}")
        count = add_region_items(report_db, cell_id, cat_id, region)
        if count:
            violations[f"enclosure/{name}"] = count

    overlap_checks = [
        ("pads_on_cavity", pads & cavity_gap),
        ("pads_on_seal", pads & seal_ring),
        ("witness_on_cavity", witness & cavity_gap),
        ("witness_on_pads", witness & pads),
    ]
    for name, region in overlap_checks:
        if region.is_empty():
            continue
        cat_id = category_id(report_db, f"overlap/{name}", f"Overlap failure: {name}")
        count = add_region_items(report_db, cell_id, cat_id, region)
        if count:
            violations[f"overlap/{name}"] = count

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_db.save(str(report_path))
    write_summary(summary_path, input_path, report_path, top_cell.name, violations)
    return 0 if not violations else 2


def main() -> int:
    input_path, report_path, summary_path = get_paths_from_context()
    return run_drc(input_path, report_path, summary_path)


if __name__ == "__main__":
    raise SystemExit(main())
