#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

try:
    import gdstk
except ModuleNotFoundError as exc:  # pragma: no cover - operator-facing failure path
    raise SystemExit(
        "gdstk is required. Activate .venv-layout or install gdstk before rendering previews."
    ) from exc

try:
    from PIL import Image, ImageDraw
except ModuleNotFoundError as exc:  # pragma: no cover - operator-facing failure path
    raise SystemExit(
        "Pillow is required. Activate .venv-layout or install pillow before rendering previews."
    ) from exc


DEFAULT_OUT_DIR = Path("artifacts/layout/nhm2")
DEFAULT_MANIFEST = DEFAULT_OUT_DIR / "nhm2-layout-export-manifest.json"
DEFAULT_PREVIEW_DIR = DEFAULT_OUT_DIR / "previews"
PNG_WIDTH_PX = 1600
PNG_MARGIN_PX = 96
PNG_SUPERSAMPLE = 2
SVG_BACKGROUND = "#f7f5ef"

PREVIEW_PACKAGES = {
    "smoke": {
        "gds": "nhm2-layout-smoke.gds",
        "top_cell": "NHM2_DIE",
        "basename": "nhm2-smoke-preview",
    },
    "tile": {
        "gds": "nhm2-tile.gds",
        "top_cell": "NHM2_TILE",
        "basename": "nhm2-tile-preview",
    },
    "array": {
        "gds": "nhm2-array-2x2.gds",
        "top_cell": "NHM2_ARRAY_2X2",
        "basename": "nhm2-array-2x2-preview",
    },
    "die": {
        "gds": "nhm2-die.gds",
        "top_cell": "NHM2_DIE",
        "basename": "nhm2-die-preview",
    },
}

SVG_LAYER_STYLE = {
    10: {"fill": "#355c7d", "stroke": "#23384b", "fill_opacity": 0.50, "stroke_width": 3.0},
    20: {"fill": "#f3c623", "stroke": "#b08b12", "fill_opacity": 0.78, "stroke_width": 3.0},
    30: {"fill": "#d8dde5", "stroke": "#8c97a5", "fill_opacity": 0.22, "stroke_width": 2.0},
    40: {"fill": "#1c9c5c", "stroke": "#0f5f37", "fill_opacity": 0.90, "stroke_width": 2.0},
    50: {"fill": "#ffffff", "stroke": "#4b5563", "fill_opacity": 1.0, "stroke_width": 2.0},
    60: {"fill": "#c44536", "stroke": "#7d2118", "fill_opacity": 0.46, "stroke_width": 3.0},
    70: {"fill": "#eb8f34", "stroke": "#8f4b12", "fill_opacity": 0.86, "stroke_width": 2.0},
    80: {"fill": "#7c4d9d", "stroke": "#4f2f67", "fill_opacity": 0.88, "stroke_width": 2.0},
    90: {"fill": "#2a9d8f", "stroke": "#175d55", "fill_opacity": 0.86, "stroke_width": 2.0},
    99: {"fill": "none", "stroke": "#111827", "fill_opacity": 0.0, "stroke_width": 5.0},
}

PNG_SHAPE_STYLE = {
    10: {"fill": (53, 92, 125, 128), "stroke": (35, 56, 75, 255), "stroke_width": 3},
    20: {"fill": (243, 198, 35, 210), "stroke": (176, 139, 18, 255), "stroke_width": 3},
    30: {"fill": (216, 221, 229, 56), "stroke": (140, 151, 165, 200), "stroke_width": 2},
    40: {"fill": (28, 156, 92, 230), "stroke": (15, 95, 55, 255), "stroke_width": 2},
    50: {"fill": (255, 255, 255, 255), "stroke": (75, 85, 99, 180), "stroke_width": 2},
    60: {"fill": (196, 69, 54, 118), "stroke": (125, 33, 24, 255), "stroke_width": 3},
    70: {"fill": (235, 143, 52, 220), "stroke": (143, 75, 18, 255), "stroke_width": 2},
    80: {"fill": (124, 77, 157, 224), "stroke": (79, 47, 103, 255), "stroke_width": 2},
    90: {"fill": (42, 157, 143, 224), "stroke": (23, 93, 85, 255), "stroke_width": 2},
    99: {"fill": None, "stroke": (17, 24, 39, 255), "stroke_width": 5},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render deterministic NHM2 SVG and PNG plan-view previews."
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help="Directory containing NHM2 package GDS outputs.",
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Export manifest path to update with preview metadata.",
    )
    parser.add_argument(
        "--preview-dir",
        type=Path,
        default=DEFAULT_PREVIEW_DIR,
        help="Directory for rendered preview artifacts.",
    )
    return parser.parse_args()


def artifact_entry(path: Path) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "path": path.as_posix(),
        "exists": path.exists(),
    }
    if path.exists():
        entry["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        entry["size_bytes"] = path.stat().st_size
    return entry


def load_top_cell(gds_path: Path, top_cell_name: str) -> gdstk.Cell:
    library = gdstk.read_gds(gds_path)
    for cell in library.cells:
        if cell.name == top_cell_name:
            return cell
    raise ValueError(f"Top cell {top_cell_name!r} not found in {gds_path}")


def layer_sort_key(polygon: gdstk.Polygon) -> tuple[Any, ...]:
    canonical_points = canonicalize_polygon_points(polygon.points)
    return (int(polygon.layer), int(polygon.datatype), len(canonical_points), canonical_points)


def canonicalize_polygon_points(
    points: Any,
    precision: int = 6,
) -> tuple[tuple[float, float], ...]:
    rounded = [
        (round(float(x), precision), round(float(y), precision))
        for x, y in points
    ]
    if not rounded:
        return tuple()

    def rotate(values: list[tuple[float, float]], index: int) -> list[tuple[float, float]]:
        return values[index:] + values[:index]

    min_index = min(range(len(rounded)), key=lambda idx: rounded[idx])
    forward = rotate(rounded, min_index)

    reversed_points = list(reversed(rounded))
    min_reverse_index = min(
        range(len(reversed_points)),
        key=lambda idx: reversed_points[idx],
    )
    backward = rotate(reversed_points, min_reverse_index)

    return tuple(forward if tuple(forward) <= tuple(backward) else backward)


def render_svg(cell: gdstk.Cell, svg_path: Path) -> dict[str, Any]:
    bbox = cell.bounding_box()
    if bbox is None:
        raise ValueError(f"Cell {cell.name} has no geometry to render.")

    (min_x, min_y), (max_x, max_y) = bbox
    world_width = max(max_x - min_x, 1.0)
    world_height = max(max_y - min_y, 1.0)
    width_px = PNG_WIDTH_PX
    height_px = max(800, int(math.ceil((world_height / world_width) * width_px)))
    margin_px = PNG_MARGIN_PX
    scale = min(
        (width_px - 2 * margin_px) / world_width,
        (height_px - 2 * margin_px) / world_height,
    )

    def transform(point: tuple[float, float]) -> tuple[float, float]:
        x, y = point
        px = margin_px + (x - min_x) * scale
        py = height_px - (margin_px + (y - min_y) * scale)
        return (px, py)

    polygons = sorted(
        cell.get_polygons(apply_repetitions=True, include_paths=True, depth=None),
        key=layer_sort_key,
    )
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width_px}" height="{height_px}" viewBox="0 0 {width_px} {height_px}" version="1.1">',
        f'  <rect x="0" y="0" width="{width_px}" height="{height_px}" fill="{SVG_BACKGROUND}" />',
    ]
    for polygon in polygons:
        style = SVG_LAYER_STYLE.get(int(polygon.layer))
        if style is None:
            continue
        points = [transform(point) for point in canonicalize_polygon_points(polygon.points)]
        points_attr = " ".join(f"{x:.3f},{y:.3f}" for x, y in points)
        lines.append(
            "  <polygon "
            f'points="{points_attr}" '
            f'fill="{style["fill"]}" '
            f'fill-opacity="{style["fill_opacity"]:.3f}" '
            f'stroke="{style["stroke"]}" '
            f'stroke-width="{style["stroke_width"]:.3f}" '
            'stroke-linejoin="round" />'
        )
    lines.append("</svg>")
    svg_path.parent.mkdir(parents=True, exist_ok=True)
    svg_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {
        **artifact_entry(svg_path),
        "format": "svg",
        "background": SVG_BACKGROUND,
        "width_px": width_px,
        "height_px": height_px,
    }


def render_png(cell: gdstk.Cell, png_path: Path) -> dict[str, Any]:
    bbox = cell.bounding_box()
    if bbox is None:
        raise ValueError(f"Cell {cell.name} has no geometry to render.")

    (min_x, min_y), (max_x, max_y) = bbox
    world_width = max(max_x - min_x, 1.0)
    world_height = max(max_y - min_y, 1.0)
    width_px = PNG_WIDTH_PX
    height_px = max(800, int(math.ceil((world_height / world_width) * width_px)))

    render_width = width_px * PNG_SUPERSAMPLE
    render_height = height_px * PNG_SUPERSAMPLE
    margin_px = PNG_MARGIN_PX * PNG_SUPERSAMPLE
    scale = min(
        (render_width - 2 * margin_px) / world_width,
        (render_height - 2 * margin_px) / world_height,
    )

    def transform(point: tuple[float, float]) -> tuple[float, float]:
        x, y = point
        px = margin_px + (x - min_x) * scale
        py = render_height - (margin_px + (y - min_y) * scale)
        return (px, py)

    image = Image.new("RGBA", (render_width, render_height), (247, 245, 239, 255))
    draw = ImageDraw.Draw(image, "RGBA")
    polygons = sorted(
        cell.get_polygons(apply_repetitions=True, include_paths=True, depth=None),
        key=layer_sort_key,
    )

    for polygon in polygons:
        style = PNG_SHAPE_STYLE.get(int(polygon.layer))
        if style is None:
            continue
        points = [transform(point) for point in canonicalize_polygon_points(polygon.points)]
        if len(points) < 2:
            continue
        fill = style["fill"]
        stroke = style["stroke"]
        stroke_width = int(style["stroke_width"])
        if fill is not None:
            draw.polygon(points, fill=fill)
        draw.line(points + [points[0]], fill=stroke, width=stroke_width, joint="curve")

    if PNG_SUPERSAMPLE > 1:
        image = image.resize((width_px, height_px), Image.Resampling.LANCZOS)
    png_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(png_path)

    return {
        **artifact_entry(png_path),
        "format": "png",
        "width_px": width_px,
        "height_px": height_px,
        "background_rgba": [247, 245, 239, 255],
    }


def render_preview_set(
    out_dir: Path,
    manifest_path: Path,
    preview_dir: Path,
) -> dict[str, dict[str, Any]]:
    previews: dict[str, dict[str, Any]] = {}
    preview_dir.mkdir(parents=True, exist_ok=True)

    for key, spec in PREVIEW_PACKAGES.items():
        gds_path = out_dir / spec["gds"]
        cell = load_top_cell(gds_path, spec["top_cell"])
        svg_path = preview_dir / f"{spec['basename']}.svg"
        png_path = preview_dir / f"{spec['basename']}.png"
        previews[key] = {
            "top_cell": spec["top_cell"],
            "source_gds": artifact_entry(gds_path),
            "svg": render_svg(cell, svg_path),
            "png": render_png(cell, png_path),
        }

    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest["previews"] = previews
        if isinstance(manifest.get("smoke"), dict):
            manifest["smoke"]["preview"] = previews["smoke"]
        packages = manifest.get("packages", {})
        if isinstance(packages, dict):
            for key in ("tile", "array", "die"):
                if isinstance(packages.get(key), dict):
                    packages[key]["preview"] = previews[key]
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    return previews


def main() -> int:
    args = parse_args()
    previews = render_preview_set(
        out_dir=args.out_dir,
        manifest_path=args.manifest,
        preview_dir=args.preview_dir,
    )
    print(json.dumps(previews, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
