#!/usr/bin/env python3
"""Exact structural cost model for the candidate-neutral C08 H2 selector."""

from __future__ import annotations

import argparse
import json


PANELS = tuple(1 << exponent for exponent in range(17))
ELEMENTARY_PER_SUBPANEL = 43


def projection(seconds_per_subpanel: float | None, selector_count: int) -> dict[str, object]:
    cumulative_panels = sum(PANELS)
    elementary_per_selector = cumulative_panels * ELEMENTARY_PER_SUBPANEL
    payload: dict[str, object] = {
        "schema": "nhm2.g2h_e_s5.c08_h2_cost_model.v1",
        "status": "STRUCTURAL_ONLY" if seconds_per_subpanel is None else "CALIBRATED_PROJECTION",
        "u_panel_candidates": list(PANELS),
        "candidate_count": len(PANELS),
        "maximum_u_panels": PANELS[-1],
        "cumulative_subpanels_per_selector": cumulative_panels,
        "elementary_convolutions_per_subpanel": ELEMENTARY_PER_SUBPANEL,
        "elementary_convolutions_per_selector": elementary_per_selector,
        "selector_count": selector_count,
        "cumulative_subpanels": cumulative_panels * selector_count,
        "elementary_convolutions": elementary_per_selector * selector_count,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    if seconds_per_subpanel is not None:
        seconds = seconds_per_subpanel * cumulative_panels * selector_count
        payload.update({
            "seconds_per_subpanel": seconds_per_subpanel,
            "projected_seconds": seconds,
            "projected_hours": seconds / 3600.0,
            "projection_is_authority": False,
        })
    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds-per-subpanel", type=float)
    parser.add_argument("--selector-count", type=int, default=2)
    args = parser.parse_args()
    if args.selector_count < 1 or args.selector_count > 3:
        parser.error("--selector-count must be in [1,3]")
    if args.seconds_per_subpanel is not None and args.seconds_per_subpanel <= 0:
        parser.error("--seconds-per-subpanel must be positive")
    print(json.dumps(projection(args.seconds_per_subpanel, args.selector_count),
                     sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
