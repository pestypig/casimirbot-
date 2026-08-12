#!/usr/bin/env python3
"""Extract paper-faithful KHI measurements from manually traced FastCam frames.

The source image is never resized. An operator traces the same magnetic-element
boundary in at least three native-resolution frames and marks a propagating
ridge. This tool samples intensity on the traced boundary, projects its
displacement onto the reference-boundary normal, and emits the typed
``solar_khi_measurement/v1`` input consumed by the deterministic TypeScript
analysis service. The tool measures pixels; it does not classify KHI or infer
nanoflare causality.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any

TRACE_SCHEMA_VERSION = "solar_khi_manual_trace/v1"
MEASUREMENT_SCHEMA_VERSION = "solar_khi_measurement/v1"
TOOL_VERSION = "1.0.0"
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".pgm"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return "sha256:" + digest.hexdigest()


def source_inventory(source: Path) -> tuple[list[Path] | None, str]:
    if source.is_file():
        return None, sha256_file(source)
    frames = sorted(
        path.resolve()
        for path in source.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    )
    if not frames:
        raise ValueError(f"no supported native image frames found under {source}")
    digest = hashlib.sha256()
    for frame in frames:
        digest.update(frame.relative_to(source.resolve()).as_posix().encode("utf-8"))
        digest.update(bytes.fromhex(sha256_file(frame).removeprefix("sha256:")))
    return frames, "sha256:" + digest.hexdigest()


def require_cv2() -> tuple[Any, Any]:
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as error:
        raise RuntimeError("dkist_fastcam_measure_requires_opencv_and_numpy") from error
    return cv2, np


def read_selected_frames(source: Path, indices: list[int]) -> dict[int, Any]:
    cv2, _np = require_cv2()
    inventory, _content_hash = source_inventory(source)
    selected: dict[int, Any] = {}
    if inventory is not None:
        for index in indices:
            if index >= len(inventory):
                raise ValueError(f"frame_index {index} exceeds image inventory ({len(inventory)} frames)")
            frame = cv2.imread(str(inventory[index]), cv2.IMREAD_GRAYSCALE)
            if frame is None:
                raise ValueError(f"could not decode native frame {inventory[index]}")
            selected[index] = frame
        return selected

    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise ValueError(f"could not decode FastCam movie {source}")
    wanted = set(indices)
    cursor = 0
    try:
        while wanted:
            ok, frame = capture.read()
            if not ok:
                missing = ", ".join(str(value) for value in sorted(wanted))
                raise ValueError(f"movie ended before annotated frame(s): {missing}")
            if cursor in wanted:
                selected[cursor] = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                wanted.remove(cursor)
            cursor += 1
    finally:
        capture.release()
    return selected


def point(value: Any, label: str) -> tuple[float, float]:
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be an object with x_px/y_px")
    x = float(value["x_px"])
    y = float(value["y_px"])
    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError(f"{label} coordinates must be finite")
    return x, y


def polyline(value: Any, label: str) -> list[tuple[float, float]]:
    if not isinstance(value, list) or len(value) < 3:
        raise ValueError(f"{label} must contain at least three points")
    return [point(item, f"{label}[{index}]") for index, item in enumerate(value)]


def cumulative_lengths(points: list[tuple[float, float]]) -> list[float]:
    values = [0.0]
    for first, second in zip(points, points[1:]):
        segment = math.hypot(second[0] - first[0], second[1] - first[1])
        if segment <= 0:
            raise ValueError("manual trace contains a zero-length segment")
        values.append(values[-1] + segment)
    return values


def resample_polyline(points: list[tuple[float, float]], count: int) -> list[tuple[float, float]]:
    lengths = cumulative_lengths(points)
    total = lengths[-1]
    output: list[tuple[float, float]] = []
    segment = 0
    for sample_index in range(count):
        target = total * sample_index / (count - 1)
        while segment + 1 < len(lengths) - 1 and lengths[segment + 1] < target:
            segment += 1
        span = lengths[segment + 1] - lengths[segment]
        ratio = (target - lengths[segment]) / span
        first, second = points[segment], points[segment + 1]
        output.append((first[0] + ratio * (second[0] - first[0]), first[1] + ratio * (second[1] - first[1])))
    return output


def reference_normals(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    normals: list[tuple[float, float]] = []
    for index in range(len(points)):
        before = points[max(0, index - 1)]
        after = points[min(len(points) - 1, index + 1)]
        tangent_x, tangent_y = after[0] - before[0], after[1] - before[1]
        magnitude = math.hypot(tangent_x, tangent_y)
        if magnitude <= 0:
            raise ValueError("manual trace has an undefined reference normal")
        normals.append((-tangent_y / magnitude, tangent_x / magnitude))
    return normals


def validate_bounds(points: list[tuple[float, float]], width: int, height: int, label: str) -> None:
    for index, (x, y) in enumerate(points):
        if x < 0 or y < 0 or x > width - 1 or y > height - 1:
            raise ValueError(f"{label}[{index}] lies outside the native {width}x{height} frame")


def bilinear_sample(frame: Any, samples: list[tuple[float, float]]) -> list[float]:
    height, width = frame.shape[:2]
    validate_bounds(samples, width, height, "resampled_trace")
    values: list[float] = []
    for x, y in samples:
        x0, y0 = int(math.floor(x)), int(math.floor(y))
        x1, y1 = min(x0 + 1, width - 1), min(y0 + 1, height - 1)
        dx, dy = x - x0, y - y0
        top = float(frame[y0, x0]) * (1 - dx) + float(frame[y0, x1]) * dx
        bottom = float(frame[y1, x0]) * (1 - dx) + float(frame[y1, x1]) * dx
        values.append(top * (1 - dy) + bottom * dy)
    return values


def ridge_position_px(frame_trace: dict[str, Any], samples: list[tuple[float, float]], reference_length: float) -> float:
    if "ridge_position_px" in frame_trace:
        value = float(frame_trace["ridge_position_px"])
        if not math.isfinite(value) or value < 0:
            raise ValueError("ridge_position_px must be finite and nonnegative")
        return value
    if "ridge_point_px" not in frame_trace:
        raise ValueError("each annotated frame requires ridge_position_px or ridge_point_px")
    ridge = point(frame_trace["ridge_point_px"], "ridge_point_px")
    nearest = min(
        range(len(samples)),
        key=lambda index: (samples[index][0] - ridge[0]) ** 2 + (samples[index][1] - ridge[1]) ** 2,
    )
    return reference_length * nearest / (len(samples) - 1)


def build_measurement(source: Path, annotation_path: Path) -> dict[str, Any]:
    annotation = json.loads(annotation_path.read_text(encoding="utf-8"))
    if annotation.get("schema_version") != TRACE_SCHEMA_VERSION:
        raise ValueError(f"trace schema_version must be {TRACE_SCHEMA_VERSION}")
    reconstruction = annotation.get("reconstruction")
    if reconstruction not in {"mfbd", "speckle"}:
        raise ValueError("reconstruction must be mfbd or speckle")
    annotated_frames = annotation.get("frames")
    if not isinstance(annotated_frames, list) or len(annotated_frames) < 3:
        raise ValueError("manual trace requires at least three annotated frames")
    indices = [int(item["frame_index"]) for item in annotated_frames]
    if len(indices) != len(set(indices)) or min(indices) < 0:
        raise ValueError("annotated frame_index values must be unique and nonnegative")
    decoded = read_selected_frames(source, sorted(indices))
    dimensions = {(frame.shape[1], frame.shape[0]) for frame in decoded.values()}
    if len(dimensions) != 1:
        raise ValueError("native frame dimensions changed within the traced sequence")
    width, height = next(iter(dimensions))

    reference = polyline(annotation.get("reference_polyline_px"), "reference_polyline_px")
    validate_bounds(reference, width, height, "reference_polyline_px")
    reference_length = cumulative_lengths(reference)[-1]
    sample_count = max(3, int(round(reference_length)) + 1)
    reference_samples = resample_polyline(reference, sample_count)
    normals = reference_normals(reference_samples)
    cadence_s = float(annotation["cadence_s"])
    frames: list[dict[str, Any]] = []
    for item in sorted(annotated_frames, key=lambda value: int(value["frame_index"])):
        frame_index = int(item["frame_index"])
        traced = polyline(item.get("boundary_polyline_px"), f"frames[{frame_index}].boundary_polyline_px")
        validate_bounds(traced, width, height, f"frames[{frame_index}].boundary_polyline_px")
        samples = resample_polyline(traced, sample_count)
        displacement = [
            (current[0] - origin[0]) * normal[0] + (current[1] - origin[1]) * normal[1]
            for origin, current, normal in zip(reference_samples, samples, normals)
        ]
        frames.append({
            "frame_index": frame_index,
            "time_offset_s": float(item.get("time_offset_s", frame_index * cadence_s)),
            "boundary_displacement_px": displacement,
            "intensity_along_boundary": bilinear_sample(decoded[frame_index], samples),
            "ridge_position_px": ridge_position_px(item, samples, reference_length),
        })

    _inventory, source_hash = source_inventory(source)
    return {
        "schema_version": MEASUREMENT_SCHEMA_VERSION,
        "observation_id": str(annotation["observation_id"]),
        "boundary_id": str(annotation["boundary_id"]),
        "reconstruction": reconstruction,
        "native_km_per_pixel": float(annotation["native_km_per_pixel"]),
        "effective_resolution_km": float(annotation["effective_resolution_km"]),
        "cadence_s": cadence_s,
        "flow_speed_km_s": annotation.get("flow_speed_km_s"),
        "minimum_dip_prominence": float(annotation.get("minimum_dip_prominence", 0.04)),
        "frames": frames,
        "extraction_provenance": {
            "trace_schema_version": TRACE_SCHEMA_VERSION,
            "extraction_tool": "tools/dkist_fastcam_measure.py",
            "extraction_version": TOOL_VERSION,
            "source_artifact_ref": source.resolve().as_uri(),
            "source_content_hash": source_hash,
            "annotation_artifact_ref": annotation_path.resolve().as_uri(),
            "annotation_content_hash": sha256_file(annotation_path),
            "native_width_px": width,
            "native_height_px": height,
            "interpolation": "bilinear_native_pixel_grid",
            "resampled_image_forbidden": True,
            "manual_trace_authority": True,
        },
    }


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description=__doc__)
    value.add_argument("--source", type=Path, required=True, help="Native movie or ordered native-frame directory")
    value.add_argument("--annotation", type=Path, required=True, help="solar_khi_manual_trace/v1 JSON")
    value.add_argument("--output", type=Path, required=True, help="solar_khi_measurement/v1 input JSON")
    return value


def main() -> int:
    args = parser().parse_args()
    measurement = build_measurement(args.source, args.annotation)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(measurement, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "output": str(args.output.resolve()),
        "source_content_hash": measurement["extraction_provenance"]["source_content_hash"],
        "annotated_frame_count": len(measurement["frames"]),
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
