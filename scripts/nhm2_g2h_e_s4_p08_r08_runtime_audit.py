#!/usr/bin/env python3
"""Runtime/source audit for candidate-neutral S4 P08/R08 fixture producers."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p08-r08-build-binding.v2.json"
SEAL_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json"
QUANTUM_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
RUST_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def command(argv: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv, cwd=ROOT, check=check, capture_output=True, text=True)


binding = json.loads(BINDING.read_bytes())
checks: list[dict[str, object]] = []


def record(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


sidecar = BINDING.with_suffix(".sha256").read_text("ascii").split()[0]
record("binding_sidecar", digest(BINDING) == sidecar, sidecar)
for name, item in binding["immutable_inputs"].items():
    observed = digest(ROOT / item["path"])
    record(f"immutable_{name}", observed == item["raw_sha256"], observed)
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    for index, item in enumerate(lane["changed_sources"]):
        observed = digest(ROOT / item["path"])
        record(f"{lane_name}_source_{index}", observed == item["raw_sha256"], observed)

primary_source = (ROOT / binding["primary_cpp_fixture"]["changed_sources"][1]["path"]).read_text("utf-8") \
    + (ROOT / binding["primary_cpp_fixture"]["changed_sources"][2]["path"]).read_text("utf-8")
rust_source = (ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]).read_text("utf-8")
record("P08_algorithm_tokens", all(token in primary_source for token in (
    "radial_degree = 24", "nodes_per_cell = 25", "unknowns_per_cell = 50",
    "defect_sweeps = 8", "complete_pivot_inverse", "chebyshev_u",
    "project_midpoint_2m448", "radial_cells", "wronskian_fixture",
)), digest(ROOT / binding["primary_cpp_fixture"]["changed_sources"][1]["path"]))
record("R08_algorithm_tokens", all(token in rust_source for token in (
    "RADIAL_CELLS: usize = 256", "STEPS_PER_CELL: usize = 48",
    "TAYLOR_DEGREE: usize = 28", "PICARD_ITERATIONS: usize = 12",
    "project_midpoint_2m448", "ComplexBall", "fixed_step_taylor_fixture",
    "seed_and_picard_fixture", "wronskian_fixture",
)), digest(ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]))
record("R08_pure_rust", "unsafe" not in rust_source and all(token not in rust_source.lower() for token in (
    'extern "c"', "#[link", "gmp", "mpfr", "flint", "arb.h",
)), "no unsafe, FFI or C arithmetic lineage")

for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    image_id = command(["docker", "image", "inspect", lane["image"].split("@")[0], "--format", "{{.Id}}"] ).stdout.strip()
    record(f"{lane_name}_image_id", image_id == lane["image_id"], image_id)

with tempfile.TemporaryDirectory(prefix="nhm2-s4-p08-audit-") as temp_name:
    temp = Path(temp_name)
    for lane_name, output_name in (("primary_cpp_fixture", "primary"), ("independent_rust_fixture", "rust")):
        lane = binding[lane_name]
        image = lane["image"].split("@")[0]
        container = command(["docker", "create", image]).stdout.strip()
        try:
            command(["docker", "cp", f"{container}:{lane['executable']['path']}", str(temp / output_name)])
        finally:
            command(["docker", "rm", container])
        observed_path = temp / output_name
        record(f"{lane_name}_executable", observed_path.stat().st_size == lane["executable"]["bytes"] and digest(observed_path) == lane["executable"]["sha256"], {"bytes": observed_path.stat().st_size, "sha256": digest(observed_path)})

root_mount = f"{ROOT}:/work:ro"
reports: dict[str, dict[str, object]] = {}
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    image = lane["image"].split("@")[0]
    run = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-w", "/work", image, "--fixture-suite", SEAL_REL])
    report = json.loads(run.stdout)
    reports[lane_name] = report
    expected = lane["expected_report"]
    record(f"{lane_name}_report", all(report.get(key) == value for key, value in expected.items()), report)

with tempfile.TemporaryDirectory(prefix="nhm2-s4-p08-corrupt-") as temp_name:
    corrupt = Path(temp_name) / "quantum.json"
    corrupt.write_bytes((ROOT / QUANTUM_REL).read_bytes() + b"\n")
    corrupt_mount = f"{corrupt}:/work/{QUANTUM_REL}:ro"
    for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
        image = binding[lane_name]["image"].split("@")[0]
        run = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-v", corrupt_mount, "-w", "/work", image, "--fixture-suite", SEAL_REL], check=False)
        record(f"{lane_name}_corrupt_quantum_contract_rejected", run.returncode == 65 and run.stdout == "" and run.stderr == "quantum builder identity rejected\n", {"exit": run.returncode, "stdout": run.stdout, "stderr": run.stderr})

record("runtime_disjoint", binding["primary_cpp_fixture"]["image_id"] != binding["independent_rust_fixture"]["image_id"] and binding["primary_cpp_fixture"]["executable"]["sha256"] != binding["independent_rust_fixture"]["executable"]["sha256"], binding["disjointness"])
record("roots_absent", not PRIMARY_ROOT.exists() and not RUST_ROOT.exists(), [PRIMARY_ROOT.exists(), RUST_ROOT.exists()])
record("closure_fail_closed", binding["closure_flags"]["P08_fixture_complete"] is True and binding["closure_flags"]["R08_fixture_complete"] is True and binding["closure_flags"]["S4_complete"] is False and binding["closure_flags"]["inert_proposal_allowed"] is False, binding["closure_flags"])
record("authority_false", not any(binding["authority"].values()), binding["authority"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.p08_r08_runtime_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "primary_report": reports.get("primary_cpp_fixture"),
    "independent_report": reports.get("independent_rust_fixture"),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "scientific_builder_executed": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "S4_implementation_closure": False,
    "next_roles": "P09/R09 angular subtraction and tails",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
