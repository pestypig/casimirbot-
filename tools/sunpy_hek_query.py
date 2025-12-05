#!/usr/bin/env python
"""
Minimal HEK -> JSON bridge using SunPy + Fido.

Usage:
    python tools/sunpy_hek_query.py <start_iso> <end_iso> [types_csv]

Example:
    python tools/sunpy_hek_query.py 2025-02-25T00:00:00 2025-02-25T06:00:00 fl,ar,ch

Outputs JSON to stdout:
{
  "events": [
    {
      "ivorn": "...",
      "event_type": "FL",
      "start": "...",
      "end": "...",
      "hpc_x": ...,
      "hpc_y": ...,
      "u": ...,
      "v": ...,
      "goes_class": "...",
      "noaa_ar": ...,
      "ch_area": ...,
      "hpc_boundcc": "POLYGON((...))"
    }
  ]
}
"""
import json
import sys
from typing import List

import astropy.units as u
from sunpy.coordinates import sun
from sunpy.net import Fido, attrs as a


def build_attr(start: str, end: str, types: List[str]):
    attr = a.Time(start, end) & a.hek.EventType(types[0])
    for t in types[1:]:
        attr |= a.hek.EventType(t)
    return attr


def main():
    if len(sys.argv) < 3:
        print("usage: python tools/sunpy_hek_query.py <start_iso> <end_iso> [types_csv]", file=sys.stderr)
        sys.exit(1)

    start = sys.argv[1]
    end = sys.argv[2]
    types_csv = sys.argv[3] if len(sys.argv) > 3 else "FL,AR,CH"
    types = [t.strip().upper() for t in types_csv.split(",") if t.strip()]
    if not types:
        types = ["FL", "AR", "CH"]

    attr = build_attr(start, end, types)
    res = Fido.search(attr)["hek"]
    if len(res) == 0:
        print(json.dumps({"events": []}))
        return

    # Use solar angular radius at first event time (good enough for short windows)
    ang_r = sun.angular_radius(res["event_starttime"][0]).to(u.arcsec).value
    events = []
    for row in res:
        tx = row["event_coord"].Tx.to_value(u.arcsec)
        ty = row["event_coord"].Ty.to_value(u.arcsec)
        events.append(
            {
                "ivorn": row["kb_archivid"],
                "event_type": row["event_type"],
                "start": row["event_starttime"].isot,
                "end": row["event_endtime"].isot,
                "hpc_x": tx,
                "hpc_y": ty,
                "u": tx / ang_r,
                "v": ty / ang_r,
                "goes_class": row.get("fl_goescls"),
                "noaa_ar": row.get("ar_noaanum"),
                "ch_area": row.get("ch_area_atdiskcenter"),
                "hpc_boundcc": row.raw.get("hpc_boundcc"),
            }
        )

    print(json.dumps({"events": events}, default=str))


if __name__ == "__main__":
    main()
