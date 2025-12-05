#!/usr/bin/env python
"""
Small bridge to map HEK HPC coordinates into normalized disk (u,v) using sunpy.
Reads JSON on stdin: {"events":[{hpc_x,hpc_y,start,...}]}
Writes JSON on stdout: {"events":[{...,u,v,polygon_uv:[{u,v},...] }]}
"""
import json
import sys
from typing import Any, Dict, List, Optional

import astropy.units as u
from astropy.coordinates import SkyCoord
from sunpy.coordinates import frames
from sunpy.coordinates import sun


def hpc_to_uv(hpc_x: float, hpc_y: float, obstime: str) -> Optional[Dict[str, float]]:
  """
  Convert HPC arcsec offsets to normalized disk coordinates using true solar angular radius at obstime.
  """
  coord = SkyCoord(hpc_x * u.arcsec, hpc_y * u.arcsec, frame=frames.Helioprojective, obstime=obstime, observer="earth")
  ang_r = sun.angular_radius(obstime).to(u.arcsec).value
  if ang_r <= 0:
    return None
  return {"u": coord.Tx.to(u.arcsec).value / ang_r, "v": coord.Ty.to(u.arcsec).value / ang_r}


def map_event(ev: Dict[str, Any]) -> Dict[str, Any]:
  obstime = ev.get("start") or ev.get("time") or ev.get("event_starttime")
  out = dict(ev)
  try:
    if ev.get("hpc_x") is not None and ev.get("hpc_y") is not None and obstime:
      uv = hpc_to_uv(float(ev["hpc_x"]), float(ev["hpc_y"]), obstime)
      if uv:
        out["u"] = uv["u"]
        out["v"] = uv["v"]
  except Exception:
    pass

  poly_uv: List[Dict[str, float]] = []
  polygon_candidates = ev.get("polygon_hpc") or ev.get("polygon") or ev.get("polygon_uv") or []
  for pt in polygon_candidates:
    try:
      px = pt.get("x") if isinstance(pt, dict) else None
      py = pt.get("y") if isinstance(pt, dict) else None
      if px is None or py is None or not obstime:
        continue
      uv_pt = hpc_to_uv(float(px), float(py), obstime)
      if uv_pt:
        poly_uv.append(uv_pt)
    except Exception:
      continue
  if poly_uv:
    out["polygon_uv"] = poly_uv
  return out


def main():
  payload = json.load(sys.stdin)
  events = payload.get("events", [])
  out = [map_event(ev) for ev in events]
  json.dump({"events": out}, sys.stdout)


if __name__ == "__main__":
  main()
