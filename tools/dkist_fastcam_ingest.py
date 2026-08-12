#!/usr/bin/env python3
"""Build a provenance-first DKIST FastCam KHI observation manifest.

The tool never resamples image data. It inventories native MFBD and speckle
frames, hashes their bytes, records the co-registration artifact, and emits the
shared ``solar_khi_observation/v1`` JSON shape. Pixel measurement happens later
in the deterministic TypeScript analysis service.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "solar_khi_observation/v1"
SUPPORTED_SUFFIXES = {".fits", ".fit", ".fts", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".npy"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_hash(value: Any) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return "sha256:" + hashlib.sha256(payload).hexdigest()


def discover_frames(root: Path) -> list[Path]:
    if root.is_file():
        candidates = [root]
    else:
        candidates = [path for path in root.rglob("*") if path.is_file()]
    frames = sorted(path.resolve() for path in candidates if path.suffix.lower() in SUPPORTED_SUFFIXES)
    if not frames:
        raise ValueError(f"no supported FastCam frames found under {root}")
    return frames


def infer_dimensions(path: Path) -> tuple[int, int] | None:
    if path.suffix.lower() in {".fits", ".fit", ".fts"}:
        try:
            from astropy.io import fits  # type: ignore

            with fits.open(path, memmap=True) as hdus:
                for hdu in hdus:
                    shape = getattr(getattr(hdu, "data", None), "shape", None)
                    if shape and len(shape) >= 2:
                        return int(shape[-1]), int(shape[-2])
        except (ImportError, OSError, ValueError):
            return None
    try:
        from PIL import Image  # type: ignore

        with Image.open(path) as image:
            return int(image.width), int(image.height)
    except (ImportError, OSError, ValueError):
        return None


def product_manifest(kind: str, root: Path, width: int | None, height: int | None) -> dict[str, Any]:
    frames = discover_frames(root)
    inferred = infer_dimensions(frames[0])
    resolved_width = width or (inferred[0] if inferred else None)
    resolved_height = height or (inferred[1] if inferred else None)
    if not resolved_width or not resolved_height:
        raise ValueError(f"could not infer {kind} frame dimensions; pass --native-width-px and --native-height-px")
    digest = hashlib.sha256()
    for frame in frames:
        digest.update(frame.name.encode("utf-8"))
        digest.update(bytes.fromhex(sha256_file(frame)))
    return {
        "kind": kind,
        "frame_artifact_refs": [frame.as_uri() for frame in frames],
        "native_width_px": resolved_width,
        "native_height_px": resolved_height,
        "frame_count": len(frames),
        "content_hash": "sha256:" + digest.hexdigest(),
        "reconstruction_method": "multi-object multi-frame blind deconvolution" if kind == "mfbd" else "speckle reconstruction",
    }


def load_registration(path: Path) -> dict[str, Any]:
    registration = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "source_frame",
        "target_frame",
        "transform_kind",
        "matrix_3x3",
        "residual_rms_arcsec",
        "covariance_2x2_arcsec2",
    }
    missing = sorted(required.difference(registration))
    if missing:
        raise ValueError(f"registration JSON missing: {', '.join(missing)}")
    if len(registration["matrix_3x3"]) != 9 or len(registration["covariance_2x2_arcsec2"]) != 4:
        raise ValueError("registration matrix_3x3/covariance_2x2_arcsec2 have invalid dimensions")
    registration["artifact_ref"] = path.resolve().as_uri()
    return registration


def polygon(center_x: float, center_y: float, width_arcsec: float, height_arcsec: float) -> list[dict[str, float]]:
    half_w = width_arcsec / 2
    half_h = height_arcsec / 2
    return [
        {"x": center_x - half_w, "y": center_y - half_h},
        {"x": center_x + half_w, "y": center_y - half_h},
        {"x": center_x + half_w, "y": center_y + half_h},
        {"x": center_x - half_w, "y": center_y + half_h},
    ]


def build_manifest(args: argparse.Namespace) -> dict[str, Any]:
    mfbd = product_manifest("mfbd", args.mfbd, args.native_width_px, args.native_height_px)
    speckle = product_manifest("speckle", args.speckle, args.native_width_px, args.native_height_px)
    if (mfbd["native_width_px"], mfbd["native_height_px"]) != (
        speckle["native_width_px"], speckle["native_height_px"]
    ):
        raise ValueError("MFBD and speckle products must preserve the same native dimensions")

    observation_time = args.observation_time
    # Normalize a trailing Z without silently changing the represented instant.
    parsed_time = datetime.fromisoformat(observation_time.replace("Z", "+00:00"))
    if parsed_time.tzinfo is None:
        parsed_time = parsed_time.replace(tzinfo=timezone.utc)
    observation_time = parsed_time.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

    manifest: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "observation_id": args.observation_id,
        "observation_time": observation_time,
        "instrument": "DKIST_FastCam",
        "detector": args.detector,
        "noaa_active_region_id": args.noaa_active_region,
        "passband": {"center_nm": args.passband_center_nm, "fwhm_nm": args.passband_fwhm_nm},
        "sampling": {
            "reconstructed_cadence_s": args.cadence_s,
            "native_km_per_pixel": args.native_km_per_pixel,
            "effective_resolution_km": args.effective_resolution_km,
        },
        "native_field_of_view": {"width_km": args.fov_width_km, "height_km": args.fov_height_km},
        "coordinates": {
            "helioprojective_center_arcsec": {"x": args.hpc_x_arcsec, "y": args.hpc_y_arcsec},
            "footprint_polygon_arcsec": polygon(
                args.hpc_x_arcsec, args.hpc_y_arcsec, args.footprint_width_arcsec, args.footprint_height_arcsec
            ),
            "heliographic_stonyhurst_deg": {"longitude": args.hgs_lon_deg, "latitude": args.hgs_lat_deg},
            "carrington_deg": {"longitude": args.carrington_lon_deg, "latitude": args.carrington_lat_deg},
            "mu": args.mu,
            "observer_metadata": {"observatory": "DKIST", "observer": args.observer},
            "wcs_artifact_ref": args.wcs_ref,
        },
        "registrations": [load_registration(args.registration_json)],
        "reconstruction_products": [mfbd, speckle],
        "psf_artifact_ref": args.psf_ref,
        "quality_report_ref": args.quality_report_ref,
        "parent_context_image_refs": args.context_ref,
        "boundary_track_artifact_refs": [],
        "vortex_tracks": [],
        "radiometric_interpretation": "forward_model_required",
        "energy_calibration": "not_applicable_aia_193",
        "numerical_measurement_authority": True,
        "provenance": {
            "source_archive": args.source_archive,
            "source_literature_doi": args.source_literature_doi,
            "ingest_tool": "tools/dkist_fastcam_ingest.py",
            "ingest_version": "1.0.0",
        },
    }
    manifest["provenance"]["manifest_hash"] = canonical_hash(manifest)
    return manifest


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description=__doc__)
    value.add_argument("--mfbd", type=Path, required=True, help="MFBD frame file or directory")
    value.add_argument("--speckle", type=Path, required=True, help="Speckle frame file or directory")
    value.add_argument("--registration-json", type=Path, required=True)
    value.add_argument("--output", type=Path, required=True)
    value.add_argument("--observation-id", required=True)
    value.add_argument("--observation-time", required=True, help="ISO-8601 observation time")
    value.add_argument("--noaa-active-region", default="14060")
    value.add_argument("--detector", default="FastCam diagnostic")
    value.add_argument("--observer", default="DKIST")
    value.add_argument("--passband-center-nm", type=float, default=416.0)
    value.add_argument("--passband-fwhm-nm", type=float, default=0.5)
    value.add_argument("--cadence-s", type=float, default=2.7)
    value.add_argument("--native-km-per-pixel", type=float, default=6.0)
    value.add_argument("--effective-resolution-km", type=float, default=19.0)
    value.add_argument("--fov-width-km", type=float, default=5800.0)
    value.add_argument("--fov-height-km", type=float, default=4350.0)
    value.add_argument("--native-width-px", type=int)
    value.add_argument("--native-height-px", type=int)
    value.add_argument("--hpc-x-arcsec", type=float, default=-162.0)
    value.add_argument("--hpc-y-arcsec", type=float, default=168.0)
    value.add_argument("--footprint-width-arcsec", type=float, required=True)
    value.add_argument("--footprint-height-arcsec", type=float, required=True)
    value.add_argument("--hgs-lon-deg", type=float, required=True)
    value.add_argument("--hgs-lat-deg", type=float, required=True)
    value.add_argument("--carrington-lon-deg", type=float, required=True)
    value.add_argument("--carrington-lat-deg", type=float, required=True)
    value.add_argument("--mu", type=float, default=0.97)
    value.add_argument("--wcs-ref", required=True)
    value.add_argument("--psf-ref", required=True)
    value.add_argument("--quality-report-ref", required=True)
    value.add_argument("--context-ref", action="append", required=True, help="Repeat for VBI/HMI context artifacts")
    value.add_argument("--source-archive", default="https://dkist.virtualsolar.org/vanNoortfastcam/")
    value.add_argument("--source-literature-doi", default="10.1038/s41586-026-10871-3")
    return value


def main() -> int:
    args = parser().parse_args()
    manifest = build_manifest(args)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "output": str(args.output.resolve()), "manifest_hash": manifest["provenance"]["manifest_hash"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
