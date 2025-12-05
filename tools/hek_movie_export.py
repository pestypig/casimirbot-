#!/usr/bin/env python
"""
SunPy + HEK export bridge for Star Watcher.

- Fetches a short full-disk sequence (default: AIA 193 A)
- Queries HEK for events over the same window
- Projects events into unit-disk coordinates (u,v in [-1,1], +v north/up, +u east/right)
- Emits a compact JSON payload on stdout that Node/React can consume directly
"""

import argparse
import base64
import json
import math
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import astropy.units as u
from astropy.time import Time
import pandas as pd
import numpy as np
import sunpy.map
from sunpy.coordinates import sun
from sunpy.net import Fido, attrs as a, hek  # importing hek registers its AttrWalker
from sunpy.timeseries import TimeSeries


def log(msg: str) -> None:
  print(msg, file=sys.stderr)


def parse_args():
  now = datetime.now(timezone.utc)
  default_start = (now - timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S")
  default_end = now.strftime("%Y-%m-%dT%H:%M:%S")
  p = argparse.ArgumentParser(description="Fetch a short solar sequence and HEK events, emit JSON to stdout")
  p.add_argument("--probe-only", action="store_true", help="Only run a lightweight SunPy search and exit")
  p.add_argument("--start", required=False, default=default_start, help="Start time (ISO)")
  p.add_argument("--end", required=False, default=default_end, help="End time (ISO)")
  p.add_argument("--instrument", required=False, default="AIA", help="Instrument (e.g., AIA, SUVI)")
  p.add_argument("--wavelength", required=False, default="193", help="Wavelength in Angstroms (number)")
  p.add_argument("--cadence", type=float, required=False, default=None, help="Optional cadence in seconds (SunPy Sample)")
  p.add_argument("--max-frames", type=int, default=10, help="Cap frames to fetch for the movie")
  p.add_argument("--event-types", default="FL,AR,CH", help="Comma-separated HEK event types (e.g., FL,AR,CH)")
  p.add_argument("--out-dir", default="sunpy_out", help="Output directory for FITS + optional JSON copy")
  p.add_argument("--out-json", default=None, help="Optional JSON filename (under out-dir)")
  p.add_argument("--grid-size", type=int, default=192, help="Grid size for downsampled intensity (co-rot view)")
  p.add_argument(
    "--cdaweb-dataset",
    default="SOLO_L2_MAG-RTN-NORMAL-1-MINUTE",
    help="CDAWeb dataset id for turbulence proxy (set to 'none' to disable)",
  )
  p.add_argument(
    "--skip-cdaweb",
    action="store_true",
    help="Skip CDAWeb fetch even if a dataset id is provided",
  )
  p.add_argument(
    "--jsoc-sharp",
    action="store_true",
    default=bool(os.environ.get("JSOC_EMAIL")),
    help="Fetch a JSOC SHARP Bp patch for the first NOAA AR (requires JSOC_EMAIL)",
  )
  p.add_argument(
    "--jsoc-cutout",
    action="store_true",
    default=bool(os.environ.get("JSOC_EMAIL")),
    help="Request a JSOC AIA cutout around the first on-disk HEK event (requires JSOC_EMAIL)",
  )
  p.add_argument(
    "--goes-xrs",
    action="store_true",
    default=True,
    help="Fetch GOES XRS flux and add 300 s aggregates to the payload",
  )
  return p.parse_args()


def parse_wavelength(value: str) -> u.Quantity:
  try:
    wl = float(value)
  except Exception:
    wl = 193.0
  return wl * u.angstrom


def build_event_attr(start: str, end: str, types_csv: str):
  types: List[str] = [t.strip().upper() for t in types_csv.split(",") if t.strip()]
  if not types:
    types = ["FL", "AR", "CH"]
  attr = a.hek.EventType(types[0])
  for t in types[1:]:
    attr |= a.hek.EventType(t)
  return attr, types


def pick_b_components(df: pd.DataFrame) -> Optional[pd.DataFrame]:
  """
  Return a DataFrame with magnetic components if available; otherwise None.
  Prefers RTN components (B_RTN_0/1/2) and falls back to Bx/By/Bz style names.
  """
  cols = {str(c).lower(): c for c in df.columns}
  for base in ["b_rtn_0", "b_rtn_1", "b_rtn_2"]:
    if base not in cols:
      break
  else:
    return df[[cols["b_rtn_0"], cols["b_rtn_1"], cols["b_rtn_2"]]].astype(float)

  # Fallback: try bx/by/bz or br/bt/bn style labels.
  candidates = [
    ("bx", "by", "bz"),
    ("br", "bt", "bn"),
  ]
  for trio in candidates:
    if all(name in cols for name in trio):
      return df[[cols[trio[0]], cols[trio[1]], cols[trio[2]]]].astype(float)
  return None


def fetch_cdaweb_bins(start: str, end: str, dataset: str, max_files: int = 6) -> Dict[str, object]:
  """
  Fetch a short CDAWeb magnetic field time series and collapse into 300 s bins.
  """
  if not dataset or dataset.strip().lower() == "none":
    return {"dataset": dataset, "bins": [], "reason": "disabled"}
  try:
    res = Fido.search(a.Time(start, end), a.cdaweb.Dataset(dataset))
  except Exception as exc:
    return {"dataset": dataset, "bins": [], "reason": f"search_failed:{exc}"}

  if len(res) == 0 or len(res[0]) == 0:
    return {"dataset": dataset, "bins": [], "reason": "no_results"}

  count = min(max_files, len(res[0]))
  try:
    files = Fido.fetch(res[0][0:count])
  except Exception as exc:
    return {"dataset": dataset, "bins": [], "reason": f"fetch_failed:{exc}"}

  try:
    ts = TimeSeries(files, concatenate=True)
    df = ts.to_dataframe()
  except Exception as exc:
    return {"dataset": dataset, "bins": [], "reason": f"timeseries_failed:{exc}"}

  if df.empty:
    return {"dataset": dataset, "bins": [], "reason": "empty_timeseries"}

  df = df.dropna()
  comp = pick_b_components(df)
  comp_idx = None
  if comp is None:
    # fallback: look for a magnitude column
    mag_col = next((c for c in df.columns if str(c).lower().startswith("b_total") or str(c).lower() == "|b|"), None)
    if mag_col is None:
      return {"dataset": dataset, "bins": [], "reason": "no_b_components"}
    b_mag = df[mag_col].astype(float)
  else:
    # components in nT typically
    bx, by, bz = comp.iloc[:, 0], comp.iloc[:, 1], comp.iloc[:, 2]
    b_mag = np.sqrt(bx * bx + by * by + bz * bz)
    comp_idx = comp.index

  b_mag = b_mag.dropna()
  if b_mag.empty:
    return {"dataset": dataset, "bins": [], "reason": "no_valid_mag"}

  try:
    idx = pd.to_datetime(b_mag.index).tz_convert(None)
  except Exception:
    idx = pd.to_datetime(b_mag.index)
  b_mag.index = idx
  if comp is not None:
    try:
      comp_idx = pd.to_datetime(comp_idx).tz_convert(None)
    except Exception:
      comp_idx = pd.to_datetime(comp_idx)
    comp.index = comp_idx
  bins: List[Dict[str, object]] = []
  resampled = b_mag.resample("300S")
  for bin_start, series in resampled:
    if series.empty or series.count() == 0:
      continue
    bin_end = bin_start + pd.Timedelta(seconds=300)
    values = series.to_numpy(dtype=float)
    variance = float(np.var(values))
    rms = float(np.sqrt(np.mean(values ** 2)))
    mean = float(np.mean(values))
    dbdt_rms = float(np.sqrt(np.mean(np.diff(values) ** 2))) if len(values) > 1 else None
    anisotropy = None
    if comp is not None:
      try:
        comp_bin = comp.loc[(comp.index >= bin_start) & (comp.index < bin_end)]
        if len(comp_bin) > 1:
          comps = comp_bin.to_numpy(dtype=float)
          spread = float(np.mean(np.std(comps, axis=0)))
          base = float(np.mean(np.abs(comps))) or 1e-6
          anisotropy = spread / base
      except Exception:
        anisotropy = None
    bins.append(
      {
        "start": bin_start.replace(tzinfo=None).isoformat(),
        "end": bin_end.replace(tzinfo=None).isoformat(),
        "variance": variance,
        "rms": rms,
        "mean": mean,
        "samples": int(series.count()),
        "dbdt_rms": dbdt_rms,
        "anisotropy": anisotropy,
      }
    )

  return {
    "dataset": dataset,
    "bins": bins,
    "window_start": start,
    "window_end": end,
    "reason": "ok" if bins else "no_bins",
  }


def fetch_goes_xrs(start: str, end: str, max_files: int = 3) -> Dict[str, object]:
  """
  Fetch GOES XRS flux and return raw points plus 300 s aggregates.
  """
  try:
    res = Fido.search(a.Time(start, end), a.Instrument("GOES"), a.goes.Physobs("xrs"))
  except Exception as exc:
    return {"points": [], "bins": [], "reason": f"search_failed:{exc}"}

  if len(res) == 0 or len(res[0]) == 0:
    return {"points": [], "bins": [], "reason": "no_results"}

  try:
    files = Fido.fetch(res[0][0 : min(max_files, len(res[0]))])
  except Exception as exc:
    return {"points": [], "bins": [], "reason": f"fetch_failed:{exc}"}

  try:
    ts = TimeSeries(files, concatenate=True)
    df = ts.to_dataframe().dropna()
  except Exception as exc:
    return {"points": [], "bins": [], "reason": f"timeseries_failed:{exc}"}

  if df.empty:
    return {"points": [], "bins": [], "reason": "empty_timeseries"}

  try:
    idx = pd.to_datetime(df.index).tz_convert(None)
  except Exception:
    idx = pd.to_datetime(df.index)
  df.index = idx

  def pick_col(candidates):
    for cand in candidates:
      for col in df.columns:
        if cand in str(col).lower():
          return col
    return None

  short_col = pick_col(["xrsa", "short", "0.5", "xs"])
  long_col = pick_col(["xrsb", "long", "1-8", "xl"])
  if short_col is None and len(df.columns) > 1:
    short_col = df.columns[0]
  if long_col is None and len(df.columns) > 1:
    long_col = df.columns[-1]

  points: List[Dict[str, object]] = []
  for t, row in df.iterrows():
    points.append(
      {
        "time": t.replace(tzinfo=None).isoformat(),
        "short": float(row[short_col]) if short_col is not None and pd.notna(row.get(short_col)) else None,
        "long": float(row[long_col]) if long_col is not None and pd.notna(row.get(long_col)) else None,
      }
    )

  bins: List[Dict[str, object]] = []
  agg_cols = [c for c in [short_col, long_col] if c is not None]
  resampled = df[agg_cols].resample("300S")
  for bin_start, frame in resampled:
    if frame.empty:
      continue
    bin_end = bin_start + pd.Timedelta(seconds=300)
    try:
      mean_short = float(frame[short_col].mean()) if short_col in frame else None
      mean_long = float(frame[long_col].mean()) if long_col in frame else None
      max_short = float(frame[short_col].max()) if short_col in frame else None
      max_long = float(frame[long_col].max()) if long_col in frame else None
    except Exception:
      mean_short = mean_long = max_short = max_long = None
    bins.append(
      {
        "start": bin_start.replace(tzinfo=None).isoformat(),
        "end": bin_end.replace(tzinfo=None).isoformat(),
        "mean_short": mean_short,
        "mean_long": mean_long,
        "max_short": max_short,
        "max_long": max_long,
      }
    )

  return {"points": points, "bins": bins, "reason": "ok"}


def fetch_sequence(
  start: str,
  end: str,
  instrument: str,
  wavelength: u.Quantity,
  cadence: Optional[float],
  max_frames: int,
  out_dir: Path,
) -> Tuple[List[sunpy.map.GenericMap], List[str], Optional[str]]:
  attrs: List[a.DataAttr] = [a.Time(start, end), a.Instrument(instrument), a.Wavelength(wavelength)]
  if cadence and cadence > 0:
    attrs.append(a.Sample(cadence * u.second))
  t_search = time.time()
  log(f"[SEQ] Searching {instrument} {wavelength} from {start} to {end}")
  res = Fido.search(*attrs)
  log(f"[SEQ] search finished in {time.time() - t_search:.2f}s (tables: {len(res)})")
  if len(res) == 0 or len(res[0]) == 0:
    log("[SEQ] No results for this time range.")
    return [], [], "no_results"
  total = len(res[0])
  # Favor the most recent frames in the window to dodge ingest latency.
  count = min(max_frames, total) if max_frames and max_frames > 0 else total
  sub = res[0][total - count : total]
  log(f"[SEQ] Fetching {len(sub)} of {total} file(s) (latest slice)")
  t_fetch = time.time()
  fetched = Fido.fetch(sub, path=str(out_dir / "{file}"))
  log(f"[SEQ] fetch finished in {time.time() - t_fetch:.2f}s")
  files = [str(Path(f)) for f in fetched]

  maps: List[sunpy.map.GenericMap] = []
  valid_files: List[str] = []
  for f in files:
    try:
      m = sunpy.map.Map(f, allow_errors=True)
      # Map can return a list when allow_errors=True; keep the first valid entry.
      if isinstance(m, list):
        m = m[0] if m else None
      if m is None:
        log(f"[SEQ] Skipping {f} (no valid map object)")
        continue
      maps.append(m)
      valid_files.append(f)
    except MemoryError as exc:
      log(f"[SEQ] Skipping {f} due to memory error: {exc}")
    except Exception as exc:
      log(f"[SEQ] Skipping {f} due to read error: {exc}")

  if not maps:
    log("[SEQ] No valid maps read from fetched files.")
    return [], [], "no_valid_maps"

  return maps, valid_files, None


def fetch_sharp_flux(start: str, end: str, events: List[object], jsoc_email: Optional[str]) -> Optional[Dict[str, object]]:
  """
  Fetch a single SHARP CEA Bp patch for the first NOAA AR in the event list.
  Returns flux summaries only; caller is responsible for JSON serialization.
  """
  try:
    from sunpy.net import jsoc  # noqa: F401
  except Exception as exc:
    log(f"[JSOC] sunpy.net.jsoc unavailable: {exc}")
    return None

  if not jsoc_email:
    log("[JSOC] JSOC_EMAIL not provided; skipping SHARP fetch.")
    return None

  harpnum = None
  for ev in events:
    try:
      val = ev.get("noaa_ar") if isinstance(ev, dict) else None
      if val is not None:
        harpnum = int(val)
        break
    except Exception:
      continue

  if harpnum is None:
    log("[JSOC] No NOAA AR found in events; skipping SHARP search.")
    return None

  log(f"[JSOC] Searching SHARP for HARPNUM={harpnum}")
  try:
    query = Fido.search(
      a.Time(start, end),
      a.Sample(1 * u.hour),
      a.jsoc.Series("hmi.sharp_cea_720s"),
      a.jsoc.PrimeKey("HARPNUM", harpnum),
      a.jsoc.Notify(jsoc_email),
      a.jsoc.Segment("Bp"),
    )
  except Exception as exc:
    log(f"[JSOC] Search failed: {exc}")
    return None

  if len(query) == 0 or len(query[0]) == 0:
    log("[JSOC] No SHARP records returned.")
    return None

  try:
    fetch_res = Fido.fetch(query[0, 0:1])
    if len(fetch_res) == 0:
      log("[JSOC] Fetch returned no files.")
      return None
    path = Path(str(fetch_res[0]))
    sharp_map = sunpy.map.Map(str(path))
    data = np.array(sharp_map.data, dtype=float)
    if data.size == 0:
      log("[JSOC] Empty SHARP map.")
      return None
    abs_bp = np.abs(data)
    mean_flux = float(np.nanmean(abs_bp))
    total_flux = float(np.nansum(abs_bp))
    max_flux = float(np.nanmax(abs_bp))
    return {
      "harpnum": harpnum,
      "source": "hmi.sharp_cea_720s",
      "segment": "Bp",
      "map_path": str(path),
      "obstime": str(getattr(sharp_map, "date", "") or getattr(sharp_map, "observation_time", "")),
      "mean_abs_flux": mean_flux,
      "total_abs_flux": total_flux,
      "max_abs_flux": max_flux,
      "pixels": int(abs_bp.size),
    }
  except Exception as exc:
    log(f"[JSOC] Fetch/parse failed: {exc}")
    return None


def fetch_jsoc_cutout(start: str, end: str, events: List[object], r_sun_arcsec: float, wavelength: u.Quantity, jsoc_email: Optional[str]) -> Optional[Dict[str, object]]:
  """
  Request a single JSOC AIA cutout around the first on-disk event.
  Returns a minimal metadata summary; file path is included for debugging.
  """
  try:
    from astropy.coordinates import SkyCoord
  except Exception as exc:
    log(f"[JSOC CUTOUT] SkyCoord unavailable: {exc}")
    return None

  if not jsoc_email:
    log("[JSOC CUTOUT] JSOC_EMAIL not provided; skipping cutout fetch.")
    return None

  target_ev = None
  for ev in events:
    try:
      if ev.get("on_disk"):
        target_ev = ev
        break
    except Exception:
      continue
  if target_ev is None:
    log("[JSOC CUTOUT] No on-disk event to anchor cutout.")
    return None

  try:
    u_coord = float(target_ev.get("u"))
    v_coord = float(target_ev.get("v"))
  except Exception:
    log("[JSOC CUTOUT] Event missing u/v; skipping.")
    return None

  center = SkyCoord(u_coord * r_sun_arcsec * u.arcsec, v_coord * r_sun_arcsec * u.arcsec, frame="helioprojective")
  width = 600 * u.arcsec
  height = 600 * u.arcsec
  bottom_left = SkyCoord(center.Tx - width / 2, center.Ty - height / 2, frame=center.frame)
  top_right = SkyCoord(center.Tx + width / 2, center.Ty + height / 2, frame=center.frame)

  try:
    cutout = a.jsoc.Cutout(bottom_left, top_right=top_right, tracking=True)
    query = Fido.search(
      a.Time(start, end),
      a.jsoc.Series.aia_lev1_euv_12s,
      a.Wavelength(wavelength),
      a.jsoc.Notify(jsoc_email),
      a.jsoc.Segment.image,
      cutout,
    )
  except Exception as exc:
    log(f"[JSOC CUTOUT] Search failed: {exc}")
    return None

  if len(query) == 0 or len(query[0]) == 0:
    log("[JSOC CUTOUT] No cutout records returned.")
    return None

  try:
    fetch_res = Fido.fetch(query[0, 0:1])
    if len(fetch_res) == 0:
      log("[JSOC CUTOUT] Fetch returned no files.")
      return None
    path = Path(str(fetch_res[0]))
    return {
      "file": str(path),
      "start": start,
      "end": end,
      "center_arcsec": {"x": float(center.Tx.to_value(u.arcsec)), "y": float(center.Ty.to_value(u.arcsec))},
      "width_arcsec": float(width.to_value(u.arcsec)),
      "height_arcsec": float(height.to_value(u.arcsec)),
      "reason": "ok",
    }
  except Exception as exc:
    log(f"[JSOC CUTOUT] Fetch/parse failed: {exc}")
    return None


def fetch_hek_events(start: str, end: str, types_csv: str):
  attr, types = build_event_attr(start, end, types_csv)
  log(f"[HEK] Searching events: {','.join(types)}")
  t_hek = time.time()
  res = Fido.search(a.Time(start, end), attr)
  log(f"[HEK] search finished in {time.time() - t_hek:.2f}s")
  try:
    hek_tab = res["hek"]
  except Exception:
    log("[HEK] No HEK results table returned.")
    return []
  log(f"[HEK] Found {len(hek_tab)} event(s)")
  return hek_tab


def get_field(row, key: str):
  try:
    return row.get(key)
  except Exception:
    try:
      return row[key]
    except Exception:
      return None


def coerce_field_value(val):
  """
  Return a scalar-ish value or None; avoids numpy array truthiness errors.
  """
  if val is None:
    return None
  try:
    if isinstance(val, np.ma.MaskedArray):
      if val.count() == 0:
        return None
      data = val.compressed()
      if data.size == 0:
        return None
      val = data[0]
    arr = np.asanyarray(val)
    if arr.size == 0:
      return None
    scalar = arr.ravel()[0]
    try:
      return scalar.item()
    except Exception:
      return scalar
  except Exception:
    return val


def first_field(row, *keys):
  for k in keys:
    v = coerce_field_value(get_field(row, k))
    if v is not None:
      return v
  return None


def grid_indices_from_uv(u_coord: Optional[float], v_coord: Optional[float], grid_size: int):
  """
  Map normalized disk coords (u east/right, v north/up) into grid indices.
  Returns (i, j) or None if the point is off-disk or grid is invalid.
  """
  try:
    if u_coord is None or v_coord is None or grid_size is None or grid_size < 2:
      return None
    # reject obviously off-disk points
    if u_coord * u_coord + v_coord * v_coord > 1.2:
      return None
    i = int(round((u_coord * 0.5 + 0.5) * (grid_size - 1)))
    # flip v so +v (north/up) maps to smaller j (top of array)
    j = int(round(((-v_coord) * 0.5 + 0.5) * (grid_size - 1)))
    i = max(0, min(grid_size - 1, i))
    j = max(0, min(grid_size - 1, j))
    return i, j
  except Exception:
    return None


def event_uv_from_row(row, r_sun_arcsec: float) -> Tuple[Optional[float], Optional[float], bool]:
  """
  Convert a HEK row to (u, v) on a unit disk, if possible.
  Tries event_coord (SkyCoord), else hpc_x/hpc_y. Returns (u, v, inside_disk).
  """
  try:
    coord = row["event_coord"]
    Tx = coord.Tx.to_value(u.arcsec)
    Ty = coord.Ty.to_value(u.arcsec)
  except Exception:
    try:
      Tx = row["hpc_x"].to_value(u.arcsec)
      Ty = row["hpc_y"].to_value(u.arcsec)
    except Exception:
      return None, None, False
  u_coord = Tx / r_sun_arcsec
  v_coord = Ty / r_sun_arcsec
  rho2 = u_coord * u_coord + v_coord * v_coord
  return float(u_coord), float(v_coord), rho2 <= 1.05


def polygon_uv_from_wkt(wkt: Optional[str], r_sun_arcsec: float) -> List[dict]:
  if not wkt:
    return []
  match = re.search(r"POLYGON\s*\(\((.*?)\)\)", str(wkt), re.IGNORECASE)
  if not match:
    return []
  verts = []
  for pair in match.group(1).split(","):
    parts = pair.strip().split()
    if len(parts) < 2:
      continue
    try:
      x = float(parts[0])
      y = float(parts[1])
    except Exception:
      continue
    verts.append({"u": x / r_sun_arcsec, "v": y / r_sun_arcsec})
  return verts


def estimate_cadence_s(times: List[str]) -> Optional[float]:
  if len(times) < 2:
    return None
  try:
    t0 = Time(times[0]).unix
    t1 = Time(times[-1]).unix
    if t1 <= t0:
      return None
    return (t1 - t0) / max(1, len(times) - 1)
  except Exception:
    return None


def run_probe_only(args) -> int:
  """
  Lightweight availability probe: SunPy search only, no fetch or HEK.
  Always exits 0 and prints a compact JSON payload to stdout.
  """
  wavelength = parse_wavelength(args.wavelength)
  query = [
    a.Time(args.start, args.end),
    a.Instrument(args.instrument),
    a.Wavelength(wavelength),
  ]
  if args.cadence and args.cadence > 0:
    query.append(a.Sample(args.cadence * u.second))
  error_msg = None
  try:
    res = Fido.search(*query)
    tables = len(res)
    available_frames = 0
    for tbl in res:
      try:
        available_frames += len(tbl)
      except Exception:
        continue
    reason = "ok" if available_frames > 0 else "no_aia_data"
  except Exception as exc:
    tables = 0
    available_frames = 0
    reason = "search_error"
    error_msg = str(exc)
    log(f"[PROBE] SunPy search failed: {exc}")

  payload = {
    "available_frames": int(available_frames),
    "tables": int(tables),
    "start": args.start,
    "end": args.end,
    "instrument": args.instrument,
    "wavelength": wavelength.to_value(u.angstrom),
    "reason": reason,
    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    "source": "sunpy_probe",
  }
  if error_msg:
    payload["error"] = error_msg
  json.dump(payload, sys.stdout)
  return 0


def main():
  args = parse_args()
  if args.probe_only:
    raise SystemExit(run_probe_only(args))
  out_dir = Path(args.out_dir)
  out_dir.mkdir(parents=True, exist_ok=True)
  out_json = Path(args.out_json) if args.out_json else None
  wavelength = parse_wavelength(args.wavelength)
  grid_size = max(32, min(512, int(args.grid_size or 192)))

  maps, files, missing_reason = fetch_sequence(
    args.start, args.end, args.instrument, wavelength, args.cadence, args.max_frames, out_dir
  )
  hek_tab = fetch_hek_events(args.start, args.end, args.event_types)

  # Derive solar radius (arcsec) from first map if available; fall back to Sun angular radius at mid-time.
  def coerce_scalar(val) -> Optional[float]:
    """Return a finite scalar float or None (avoids numpy truthiness on empty arrays)."""
    try:
      arr = np.asanyarray(val)
      if arr.size == 0:
        return None
      scalar = float(arr.ravel()[0])
      return scalar if math.isfinite(scalar) else None
    except Exception:
      try:
        scalar = float(val)
        return scalar if math.isfinite(scalar) else None
      except Exception:
        return None

  r_sun_arcsec = None
  if maps:
    r_sun_arcsec = coerce_scalar(maps[0].rsun_obs.to_value(u.arcsec))

  if r_sun_arcsec is None:
    mid_time = Time(args.start) + 0.5 * (Time(args.end) - Time(args.start))
    r_sun_arcsec = coerce_scalar(sun.angular_radius(mid_time).to_value(u.arcsec))

  if r_sun_arcsec is None or r_sun_arcsec <= 0:
    r_sun_arcsec = 960.0
  log(f"[INFO] Using R_sun = {r_sun_arcsec:.2f} arcsec for unit-disk mapping")

  frames = []
  times: List[str] = []
  for idx, (m, f) in enumerate(zip(maps, files)):
    t_iso = Time(m.date).isot
    times.append(t_iso)
    # Downsample to a square grid for lightweight client display.
    map_b64 = None
    try:
      target_shape = u.Quantity([grid_size, grid_size], u.pixel)
      resampled = m.resample(target_shape)
      data = np.nan_to_num(resampled.data.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
      finite = data[np.isfinite(data) & (data > 0)]
      scale = np.percentile(finite, 99.5) if finite.size > 0 else 1.0
      if not np.isfinite(scale) or scale <= 0:
        scale = 1.0
      data = np.clip(data / scale, 0, 1).astype(np.float32)
      map_b64 = base64.b64encode(data.tobytes()).decode("ascii")
    except Exception as exc:
      log(f"[SEQ] Could not resample map for frame {idx}: {exc}")

    frames.append(
      {
        "index": idx,
        "obstime": t_iso,
        "fits_path": str(Path(f).resolve()),
        "png_path": None,
        "grid_size": grid_size,
        "map_b64": map_b64,
      }
    )

  cadence_s = estimate_cadence_s(times)
  frames_missing_reason = missing_reason or (None if frames else "no_frames_emitted")
  frames_missing = bool(frames_missing_reason)
  if frames_missing:
    log(f"[WARN] No AIA frames returned (reason={frames_missing_reason}); emitting HEK-only payload.")
  # Keep going: HEK rows are still projected and a JSON payload is emitted even when AIA returned zero frames.

  events = []
  for row in hek_tab:
    u_coord, v_coord, inside = event_uv_from_row(row, r_sun_arcsec)
    if u_coord is None or v_coord is None:
      continue
    rho = math.sqrt(u_coord * u_coord + v_coord * v_coord)
    cell = grid_indices_from_uv(u_coord, v_coord, grid_size)
    start_time_val = coerce_field_value(get_field(row, "event_starttime"))
    end_time_val = coerce_field_value(get_field(row, "event_endtime"))
    peak_flux_val = first_field(row, "fl_peakflux", "FL_peakflux", "fl_peakflux")
    try:
      peak_flux_val = float(peak_flux_val) if peak_flux_val is not None else None
    except Exception:
      peak_flux_val = None
    ev = {
      "id": first_field(row, "kb_archivid", "kb_archiveid", "ivorn"),
      "ivorn": first_field(row, "kb_archivid", "kb_archiveid", "ivorn"),
      "event_type": get_field(row, "event_type"),
      "start_time": str(start_time_val) if start_time_val is not None else "",
      "end_time": str(end_time_val) if end_time_val is not None else "",
      "u": u_coord,
      "v": v_coord,
      "rho": rho,
      "on_disk": bool(inside and rho <= 1.05),
      "goes_class": first_field(row, "fl_goescls", "FL_GOESCls"),
      "peak_flux": peak_flux_val,
      "noaa_ar": first_field(row, "ar_noaanum", "AR_NOAANum"),
      "ch_area": first_field(row, "ch_area_atdiskcenter", "CH_AREA"),
      "frm_name": first_field(row, "FRM_Name"),
      "bbox": polygon_uv_from_wkt(first_field(row, "HPC_BOUNDCC", "hpc_boundcc"), r_sun_arcsec),
    }
    if cell:
      ev["grid_i"], ev["grid_j"] = cell
      ev["grid_n"] = grid_size
      ev["grid_rsun_arcsec"] = r_sun_arcsec
    events.append(ev)

  cdaweb = None
  if not args.skip_cdaweb:
    cdaweb = fetch_cdaweb_bins(args.start, args.end, args.cdaweb_dataset)
    if cdaweb and cdaweb.get("reason") != "ok":
      log(f"[CDAWeb] status={cdaweb.get('reason')} bins={len(cdaweb.get('bins', []))}")
  goes_xrs = fetch_goes_xrs(args.start, args.end) if args.goes_xrs else None

  jsoc_email = os.environ.get("JSOC_EMAIL")
  sharp_summary = fetch_sharp_flux(args.start, args.end, events, jsoc_email) if args.jsoc_sharp else None
  if sharp_summary:
    mean_flux = sharp_summary.get("mean_abs_flux")
    total_flux = sharp_summary.get("total_abs_flux")
    log(
      f"[JSOC] HARPNUM {sharp_summary.get('harpnum')} "
      f"mean|Bp|={(mean_flux if mean_flux is not None else 'n/a')} "
      f"total={(total_flux if total_flux is not None else 'n/a')}"
    )
  cutout_summary = fetch_jsoc_cutout(args.start, args.end, events, r_sun_arcsec, wavelength, jsoc_email) if args.jsoc_cutout else None

  payload = {
    "reason": "no_aia_data" if frames_missing_reason in {"no_results", "no_valid_maps", "no_frames_emitted"} else None,
    "meta": {
      "start": args.start,
      "end": args.end,
      "instrument": args.instrument,
      "wavelength": wavelength.to_value(u.angstrom),
      "cadence_s": cadence_s,
      "max_frames": args.max_frames,
      "requestedEventTypes": [t.strip().upper() for t in args.event_types.split(",") if t.strip()],
      "rsun_arcsec": r_sun_arcsec,
      "frames_missing": frames_missing,
      "frames_missing_reason": frames_missing_reason,
      "source": "sunpy_no_results" if frames_missing_reason == "no_results" else ("hek_only" if frames_missing else "sunpy"),
      "reason": "no_aia_data" if frames_missing_reason in {"no_results", "no_valid_maps", "no_frames_emitted"} else None,
    },
    "instrument": args.instrument,
    "wavelength_A": wavelength.to_value(u.angstrom),
    "rsun_arcsec": r_sun_arcsec,
    "frames": frames,
    "events": events,
    "cdaweb": cdaweb,
    "jsoc_sharp": sharp_summary,
    "jsoc_cutout": cutout_summary,
    "goes_xrs": goes_xrs,
  }

  if out_json:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_json if out_json.is_absolute() else out_dir / out_json
    with out_path.open("w", encoding="utf-8") as f:
      json.dump(payload, f, indent=2)
    log(f"[OK] wrote copy to {out_path}")

  json.dump(payload, sys.stdout)


if __name__ == "__main__":
  try:
    main()
  except Exception as exc:
    log(f"[ERR] {exc}")
    try:
      import traceback

      traceback.print_exc()
    except Exception:
      pass
    sys.exit(1)
