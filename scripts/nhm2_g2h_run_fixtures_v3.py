#!/usr/bin/env python3
"""Run the versioned G2H-R2 no-candidate fixture pair exactly once."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_RUNNER = ROOT / "scripts/nhm2_g2h_run_fixtures.py"
SPEC = importlib.util.spec_from_file_location("nhm2_g2h_run_fixtures_v1", BASE_RUNNER)
if SPEC is None or SPEC.loader is None:
    raise SystemExit("unable to load frozen G2H fixture runner")
RUNNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUNNER)

RUNNER.BINDING_PATH = (
    ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-build-bindings.v3.json"
)
RUNNER.BINDING_SIDECAR = RUNNER.BINDING_PATH.with_suffix(".sha256")
RUNNER.OUTPUT_ROOT = ROOT / "artifacts/research/nhm2/g2h-fixtures-v3"


if __name__ == "__main__":
    sys.exit(RUNNER.main())
