from __future__ import annotations

import argparse
import json
import random
from typing import Any, Dict, List


DEFAULT_TOOLS = [
    "physics.metric-validate",
    "physics.christoffel",
    "physics.riemann",
    "physics.ricci",
    "physics.ricci-scalar",
    "physics.einstein-tensor",
    "physics.invariants",
    "physics.check-metric-symmetry",
    "physics.check-christoffel-symmetry",
    "physics.check-riemann-symmetries",
    "physics.check-contracted-bianchi",
    "physics.check-vacuum",
]

DEFAULT_CHECKS = [
    {"check_name": "metric_symmetry", "passed": True},
    {"check_name": "christoffel_symmetry", "passed": True},
    {"check_name": "riemann_antisym_last", "passed": True},
    {"check_name": "riemann_antisym_first", "passed": True},
    {"check_name": "riemann_pair_exchange", "passed": True},
    {"check_name": "contracted_bianchi", "passed": True},
    {"check_name": "vacuum", "passed": True},
]

def update_check(checks: List[Dict[str, Any]], name: str, passed: bool) -> List[Dict[str, Any]]:
    updated = []
    found = False
    for check in checks:
        if check.get("check_name") == name:
            updated.append({"check_name": name, "passed": passed})
            found = True
        else:
            updated.append(check)
    if not found:
        updated.append({"check_name": name, "passed": passed})
    return updated


def build_flat_metric(randomizer: random.Random) -> Dict[str, Any]:
    coords = randomizer.choice(
        [
            ["t", "x", "y", "z"],
            ["t", "r", "theta", "phi"],
            ["tau", "x1", "x2", "x3"],
        ]
    )
    scales = [randomizer.choice([0.5, 1.0, 1.5, 2.0, 3.0]) for _ in range(4)]
    while all(scale == 1.0 for scale in scales):
        scales = [randomizer.choice([0.5, 1.0, 1.5, 2.0, 3.0]) for _ in range(4)]
    g_dd = [
        [-(scales[0] ** 2), 0, 0, 0],
        [0, scales[1] ** 2, 0, 0],
        [0, 0, scales[2] ** 2, 0],
        [0, 0, 0, scales[3] ** 2],
    ]
    return {
        "coords": coords,
        "g_dd": g_dd,
        "assumptions": {},
        "signature": "-+++",
    }


def build_fixture_entries() -> List[Dict[str, Any]]:
    fixtures: List[Dict[str, Any]] = []
    minkowski = {
        "coords": ["t", "x", "y", "z"],
        "g_dd": [
            [-1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        "assumptions": {},
        "signature": "-+++",
    }
    fixtures.append(
        {
            "id": "fixture-minkowski",
            "prompt": "Verify Minkowski metric in Cartesian coordinates.",
            "conventions": {"signature": "-+++", "units_internal": "geometrized"},
            "metric_spec": minkowski,
            "expected_tools": DEFAULT_TOOLS,
            "expected_checks": DEFAULT_CHECKS,
            "tags": ["fixture", "minkowski", "vacuum"],
        }
    )

    schwarzschild = {
        "coords": ["t", "r", "theta", "phi"],
        "g_dd": [
            ["-(1-2*M/r)", 0, 0, 0],
            [0, "1/(1-2*M/r)", 0, 0],
            [0, 0, "r**2", 0],
            [0, 0, 0, "r**2*sin(theta)**2"],
        ],
        "assumptions": {},
        "signature": "-+++",
        "vacuum_sample_points": [
            {"t": 0.0, "r": 10.0, "theta": 1.2, "phi": 0.5, "M": 1.0}
        ],
        "vacuum_epsilon": 1e-6,
    }
    fixtures.append(
        {
            "id": "fixture-schwarzschild",
            "prompt": "Verify Schwarzschild metric vacuum at a numeric sample point.",
            "conventions": {"signature": "-+++", "units_internal": "geometrized"},
            "metric_spec": schwarzschild,
            "expected_tools": DEFAULT_TOOLS,
            "expected_checks": DEFAULT_CHECKS,
            "tags": ["fixture", "schwarzschild", "vacuum"],
        }
    )

    frw = {
        "coords": ["t", "x", "y", "z"],
        "g_dd": [
            [-1, 0, 0, 0],
            [0, "a(t)**2", 0, 0],
            [0, 0, "a(t)**2", 0],
            [0, 0, 0, "a(t)**2"],
        ],
        "assumptions": {},
        "signature": "-+++",
    }
    frw_checks = update_check(DEFAULT_CHECKS, "vacuum", False)
    fixtures.append(
        {
            "id": "fixture-frw",
            "prompt": "Validate FRW metric (non-vacuum) consistency checks.",
            "conventions": {"signature": "-+++", "units_internal": "geometrized"},
            "metric_spec": frw,
            "expected_tools": DEFAULT_TOOLS,
            "expected_checks": frw_checks,
            "tags": ["fixture", "frw", "non-vacuum"],
        }
    )

    return fixtures


def build_entry(idx: int, randomizer: random.Random) -> Dict[str, Any]:
    metric_spec = build_flat_metric(randomizer)
    coords = metric_spec["coords"]
    prompt = (
        "Verify flat metric with diagonal components "
        f"{metric_spec['g_dd'][0][0]}, {metric_spec['g_dd'][1][1]}, "
        f"{metric_spec['g_dd'][2][2]}, {metric_spec['g_dd'][3][3]} "
        f"in coords {coords}."
    )
    return {
        "id": f"flat-{idx:04d}",
        "prompt": prompt,
        "conventions": {"signature": "-+++", "units_internal": "geometrized"},  
        "metric_spec": metric_spec,
        "expected_tools": DEFAULT_TOOLS,
        "expected_checks": DEFAULT_CHECKS,
        "tags": ["metric", "flat", "vacuum"],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate GR assistant dataset.")
    parser.add_argument("--out", required=True, help="Output JSONL path.")
    parser.add_argument("--count", type=int, default=200, help="Number of entries.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    randomizer = random.Random(args.seed)
    with open(args.out, "w", encoding="utf-8") as handle:
        fixtures = build_fixture_entries()
        target_count = max(args.count, len(fixtures))
        for entry in fixtures:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
        for idx in range(target_count - len(fixtures)):
            entry = build_entry(idx, randomizer)
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
