#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any


DEFAULT_CONTRACT = Path("configs/needle-hull-mark2-cavity-contract.v1.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate the NHM2 cavity geometry-freeze contract."
    )
    parser.add_argument(
        "--contract",
        type=Path,
        default=DEFAULT_CONTRACT,
        help="Path to the NHM2 cavity contract JSON.",
    )
    return parser.parse_args()


def read_contract(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def number(value: Any, label: str) -> float:
    if not isinstance(value, (int, float)):
        raise ValueError(f"{label} must be numeric, received {value!r}")
    return float(value)


def box_intersects_circle(
    box: tuple[float, float, float, float],
    cx: float,
    cy: float,
    radius: float,
) -> bool:
    x0, y0, x1, y1 = box
    nearest_x = min(max(cx, x0), x1)
    nearest_y = min(max(cy, y0), y1)
    return math.hypot(nearest_x - cx, nearest_y - cy) < radius


def box_overlap(
    box_a: tuple[float, float, float, float],
    box_b: tuple[float, float, float, float],
) -> bool:
    ax0, ay0, ax1, ay1 = box_a
    bx0, by0, bx1, by1 = box_b
    return ax0 < bx1 and ax1 > bx0 and ay0 < by1 and ay1 > by0


def compute_hole_centers(
    rows: int,
    columns: int,
    pitch: float,
    keep_radius: float,
    hole_radius: float,
    post_centers: list[tuple[float, float]],
    post_guard: float,
) -> list[tuple[float, float]]:
    centers: list[tuple[float, float]] = []
    start_x = -((columns - 1) * pitch) / 2.0
    start_y = -((rows - 1) * pitch) / 2.0
    for row in range(rows):
        for column in range(columns):
            x = start_x + (column * pitch)
            y = start_y + (row * pitch)
            if math.hypot(x, y) + hole_radius > keep_radius:
                raise ValueError("Release-hole grid exceeds cavity keep radius.")
            if any(math.hypot(x - px, y - py) < post_guard for px, py in post_centers):
                raise ValueError("Release-hole grid overlaps anchor-post keepout.")
            centers.append((x, y))
    return centers


def validate_contract_data(contract: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []

    required_top_level = [
        "solutionCategory",
        "profileVersion",
        "geometry",
        "boundary",
        "thermal",
        "loss",
        "drive",
        "readout",
        "layout",
    ]
    for key in required_top_level:
        if key not in contract:
            errors.append(f"Missing required top-level key: {key}")
    if errors:
        return {
            "valid": False,
            "errorCount": len(errors),
            "warningCount": len(warnings),
            "errors": errors,
            "warnings": warnings,
            "metrics": {},
        }

    geometry = contract["geometry"]
    layout = contract["layout"]

    try:
        tile_width_um = number(geometry["tileWidth_mm"], "geometry.tileWidth_mm") * 1000.0
        tile_height_um = number(geometry["tileHeight_mm"], "geometry.tileHeight_mm") * 1000.0
        tile_area_mm2 = number(layout["tileArea_mm2"], "layout.tileArea_mm2")
        margin_um = number(layout["margin_um"], "layout.margin_um")
        pocket_diameter_um = number(geometry["pocketDiameter_um"], "geometry.pocketDiameter_um")
        gap_nm = number(geometry["gap_nm"], "geometry.gap_nm")
        rim_width_um = number(geometry["rimWidth_um"], "geometry.rimWidth_um")

        seal_ring = layout["sealRing"]
        seal_inset_um = number(seal_ring["inset_um"], "layout.sealRing.inset_um")
        seal_width_um = number(seal_ring["width_um"], "layout.sealRing.width_um")

        posts = layout["anchorPosts"]
        post_count = int(number(posts["count"], "layout.anchorPosts.count"))
        post_radius_um = number(posts["radius_um"], "layout.anchorPosts.radius_um")
        post_ring_radius_um = number(posts["ringRadius_um"], "layout.anchorPosts.ringRadius_um")

        holes = layout["releaseHoles"]
        hole_diameter_um = number(holes["diameter_um"], "layout.releaseHoles.diameter_um")
        hole_pitch_um = number(holes["pitch_um"], "layout.releaseHoles.pitch_um")
        hole_rows = int(number(holes["rows"], "layout.releaseHoles.rows"))
        hole_columns = int(number(holes["columns"], "layout.releaseHoles.columns"))

        pads = layout["padArray"]
        pad_count = int(number(pads["count"], "layout.padArray.count"))
        pad_width_um = number(pads["width_um"], "layout.padArray.width_um")
        pad_height_um = number(pads["height_um"], "layout.padArray.height_um")
        pad_edge_inset_um = number(pads["edgeInset_um"], "layout.padArray.edgeInset_um")

        marks = layout["alignmentMarks"]
        mark_size_um = number(marks["size_um"], "layout.alignmentMarks.size_um")
        mark_edge_inset_um = number(marks["edgeInset_um"], "layout.alignmentMarks.edgeInset_um")

        witness_zone = layout["witnessZone"]
        witness_spacing_um = number(
            witness_zone["spacing_um"],
            "layout.witnessZone.spacing_um",
        )
        witness_offset_um = number(
            witness_zone["centerOffsetFromBottom_um"],
            "layout.witnessZone.centerOffsetFromBottom_um",
        )

        coupons = layout["witnessCoupons"]
    except (KeyError, ValueError, TypeError) as exc:
        errors.append(str(exc))
        return {
            "valid": False,
            "errorCount": len(errors),
            "warningCount": len(warnings),
            "errors": errors,
            "warnings": warnings,
            "metrics": {},
        }

    positive_values = {
        "geometry.tileWidth_mm": tile_width_um,
        "geometry.tileHeight_mm": tile_height_um,
        "geometry.pocketDiameter_um": pocket_diameter_um,
        "geometry.gap_nm": gap_nm,
        "geometry.rimWidth_um": rim_width_um,
        "layout.margin_um": margin_um,
        "layout.sealRing.inset_um": seal_inset_um,
        "layout.sealRing.width_um": seal_width_um,
        "layout.anchorPosts.count": post_count,
        "layout.anchorPosts.radius_um": post_radius_um,
        "layout.anchorPosts.ringRadius_um": post_ring_radius_um,
        "layout.releaseHoles.diameter_um": hole_diameter_um,
        "layout.releaseHoles.pitch_um": hole_pitch_um,
        "layout.releaseHoles.rows": hole_rows,
        "layout.releaseHoles.columns": hole_columns,
        "layout.padArray.count": pad_count,
        "layout.padArray.width_um": pad_width_um,
        "layout.padArray.height_um": pad_height_um,
        "layout.padArray.edgeInset_um": pad_edge_inset_um,
        "layout.alignmentMarks.size_um": mark_size_um,
        "layout.alignmentMarks.edgeInset_um": mark_edge_inset_um,
        "layout.witnessZone.spacing_um": witness_spacing_um,
        "layout.witnessZone.centerOffsetFromBottom_um": witness_offset_um,
    }
    for label, value in positive_values.items():
        if value <= 0:
            errors.append(f"{label} must be positive, received {value}")

    computed_tile_area_mm2 = (tile_width_um * tile_height_um) / 1_000_000.0
    if abs(computed_tile_area_mm2 - tile_area_mm2) > 0.01:
        errors.append(
            "layout.tileArea_mm2 does not match geometry tile width/height "
            f"({tile_area_mm2} vs {computed_tile_area_mm2:.3f})"
        )

    if pad_count != 4:
        warnings.append(f"layout.padArray.count is {pad_count}; emitter currently places four pads.")

    if hole_rows < 1 or hole_columns < 1:
        errors.append("layout.releaseHoles rows and columns must both be at least 1.")

    tile_half_w = tile_width_um / 2.0
    tile_half_h = tile_height_um / 2.0
    min_half_dim = min(tile_half_w, tile_half_h)
    pocket_radius_um = pocket_diameter_um / 2.0
    active_half_dim = min_half_dim - seal_inset_um
    seal_inner_half_dim = active_half_dim - seal_width_um

    if seal_inset_um + seal_width_um >= min_half_dim:
        errors.append("Seal ring extends beyond tile bounds.")
    if seal_inner_half_dim <= 0:
        errors.append("Seal ring width leaves no interior opening.")
    if pocket_radius_um > (min_half_dim - margin_um):
        errors.append("Cavity pocket exceeds the tile margin budget.")
    if pocket_radius_um > seal_inner_half_dim:
        errors.append("Cavity pocket exceeds the seal-ring interior opening.")
    if rim_width_um >= pocket_radius_um:
        errors.append("geometry.rimWidth_um must be smaller than the cavity pocket radius.")

    if post_ring_radius_um + post_radius_um > pocket_radius_um:
        errors.append("Anchor posts exceed the cavity pocket radius.")

    if hole_diameter_um >= hole_pitch_um:
        errors.append("Release-hole diameter must be smaller than pitch.")

    hole_radius_um = hole_diameter_um / 2.0
    keep_radius_um = pocket_radius_um - rim_width_um - hole_radius_um
    if keep_radius_um <= 0:
        errors.append("Release-hole keep radius is non-positive.")

    post_centers: list[tuple[float, float]] = []
    if post_count > 0:
        for index in range(post_count):
            angle = (2.0 * math.pi * index) / post_count
            post_centers.append(
                (
                    post_ring_radius_um * math.cos(angle),
                    post_ring_radius_um * math.sin(angle),
                )
            )

    post_guard_um = post_radius_um + hole_diameter_um
    filtered_hole_centers: list[tuple[float, float]] = []
    if not errors:
        try:
            filtered_hole_centers = compute_hole_centers(
                rows=hole_rows,
                columns=hole_columns,
                pitch=hole_pitch_um,
                keep_radius=keep_radius_um,
                hole_radius=hole_radius_um,
                post_centers=post_centers,
                post_guard=post_guard_um,
            )
        except ValueError as exc:
            errors.append(str(exc))

    pad_x = tile_half_w - pad_edge_inset_um
    pad_y = tile_half_h - pad_edge_inset_um
    pad_boxes = [
        (
            cx - (pad_width_um / 2.0),
            cy - (pad_height_um / 2.0),
            cx + (pad_width_um / 2.0),
            cy + (pad_height_um / 2.0),
        )
        for cx, cy in ((0.0, pad_y), (0.0, -pad_y), (pad_x, 0.0), (-pad_x, 0.0))
    ]

    mark_half = mark_size_um / 2.0
    mark_x = tile_half_w - mark_edge_inset_um
    mark_y = tile_half_h - mark_edge_inset_um
    for cx, cy in ((mark_x, mark_y), (mark_x, -mark_y), (-mark_x, mark_y), (-mark_x, -mark_y)):
        if abs(cx) + mark_half > tile_half_w or abs(cy) + mark_half > tile_half_h:
            errors.append("Alignment marks exceed the tile boundary.")
            break

    coupon_total_width = sum(
        number(coupon["width_um"], f"layout.witnessCoupons.{coupon['name']}.width_um")
        for coupon in coupons
    )
    if coupons:
        coupon_total_width += witness_spacing_um * (len(coupons) - 1)
    cursor_x = -(coupon_total_width / 2.0)
    coupon_center_y = -tile_half_h + witness_offset_um
    coupon_boxes: list[tuple[float, float, float, float]] = []
    for coupon in coupons:
        coupon_width = number(coupon["width_um"], f"layout.witnessCoupons.{coupon['name']}.width_um")
        coupon_height = number(coupon["height_um"], f"layout.witnessCoupons.{coupon['name']}.height_um")
        if coupon_width <= 0 or coupon_height <= 0:
            errors.append(f"Witness coupon {coupon['name']} must have positive width and height.")
            continue
        cx = cursor_x + (coupon_width / 2.0)
        box = (
            cx - (coupon_width / 2.0),
            coupon_center_y - (coupon_height / 2.0),
            cx + (coupon_width / 2.0),
            coupon_center_y + (coupon_height / 2.0),
        )
        coupon_boxes.append(box)
        cursor_x += coupon_width + witness_spacing_um

    for box in coupon_boxes:
        x0, y0, x1, y1 = box
        if x0 < -tile_half_w or x1 > tile_half_w or y0 < -tile_half_h or y1 > tile_half_h:
            errors.append("Witness coupons exceed tile bounds.")
            break
        if box_intersects_circle(box, 0.0, 0.0, pocket_radius_um):
            errors.append("Witness coupons intersect the cavity pocket.")
            break
        if any(box_overlap(box, pad_box) for pad_box in pad_boxes):
            errors.append("Witness coupons overlap the pad array.")
            break

    metrics = {
        "tileWidth_um": tile_width_um,
        "tileHeight_um": tile_height_um,
        "pocketRadius_um": pocket_radius_um,
        "sealInnerHalfDim_um": seal_inner_half_dim,
        "postGuard_um": post_guard_um,
        "releaseHoleCount": len(filtered_hole_centers),
        "witnessCouponCount": len(coupons),
    }
    return {
        "valid": not errors,
        "errorCount": len(errors),
        "warningCount": len(warnings),
        "errors": errors,
        "warnings": warnings,
        "metrics": metrics,
    }


def build_summary(
    contract_path: Path,
    contract: dict[str, Any],
    validation: dict[str, Any],
) -> dict[str, Any]:
    return {
        "contract_path": str(contract_path.as_posix()),
        "contract_sha256": hashlib.sha256(contract_path.read_bytes()).hexdigest(),
        "status": "pass" if validation["valid"] else "fail",
        **validation,
    }


def main() -> int:
    args = parse_args()
    contract = read_contract(args.contract)
    summary = build_summary(args.contract, contract, validate_contract_data(contract))
    print(json.dumps(summary, indent=2))
    return 0 if summary["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
