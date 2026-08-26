#!/usr/bin/env python3
"""Independent runtime/source audit for candidate-neutral S4 P09/R09 fixtures."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p09-r09-build-binding.v3.json"
SEAL_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json"
QUANTUM_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json"
PRIMARY_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
RUST_ROOT = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_hash(value: object) -> str:
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()


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

environment = binding["environment_binding"]
record("environment_binding", canonical_hash(environment["canonical"]) == environment["canonical_json_sha256"], environment)
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    for index, item in enumerate(lane["changed_sources"]):
        observed = digest(ROOT / item["path"])
        record(f"{lane_name}_source_{index}", observed == item["raw_sha256"], observed)
    for command_name in ("canonical_build_argv", "canonical_run_argv"):
        expected_hash = lane[f"{command_name}_sha256"]
        record(f"{lane_name}_{command_name}", canonical_hash(lane[command_name]) == expected_hash, expected_hash)

primary_source = "\n".join(
    (ROOT / item["path"]).read_text("utf-8")
    for item in binding["primary_cpp_fixture"]["changed_sources"][1:3]
)
rust_source = (ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]).read_text("utf-8")
record("P09_algorithm_tokens", all(token in primary_source for token in (
    "subtraction_order = 20", "ell_terms = 256", "arb_hurwitz_zeta",
    "hurwitz_zeta_calls_per_channel = 21", "majorant_iterations = 8",
    "classify_threshold", "project_midpoint_2m448", "drach_recurrence_fixture",
)), digest(ROOT / binding["primary_cpp_fixture"]["changed_sources"][1]["path"]))
record("R09_algorithm_tokens", all(token in rust_source for token in (
    "HEAT_ORDER: usize = 22", "ELL_TERMS: usize = 288",
    "EULER_MACLAURIN_TERMS: usize = 64", "MAJORANT_ITERATIONS: usize = 12",
    "akiyama_tanigawa_through_128", "euler_maclaurin_fixture",
    "heat_recurrence_fixture", "project_midpoint_2m448",
)), digest(ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]))
record("R09_pure_rust", "unsafe" not in rust_source and all(token not in rust_source.lower() for token in (
    'extern "c"', "#[link", "gmp", "mpfr", "flint", "arb.h",
)), "no unsafe, FFI, C ABI or primary arithmetic lineage")
record("algorithm_lineages_disjoint", "arb_hurwitz_zeta" in primary_source
       and "arb_hurwitz_zeta" not in rust_source
       and "akiyama_tanigawa_through_128" in rust_source
       and "akiyama_tanigawa_through_128" not in primary_source,
       binding["disjointness"]["algorithms"])

for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    image_name = lane["image"].split("@")[0]
    image_id = command(["docker", "image", "inspect", image_name, "--format", "{{.Id}}"]).stdout.strip()
    record(f"{lane_name}_image_id", image_id == lane["image_id"], image_id)

with tempfile.TemporaryDirectory(prefix="nhm2-s4-p09-audit-") as temp_name:
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
        observed = {"bytes": observed_path.stat().st_size, "sha256": digest(observed_path)}
        record(f"{lane_name}_executable", observed == {"bytes": lane["executable"]["bytes"], "sha256": lane["executable"]["sha256"]}, observed)

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
    rejected = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-w", "/work", image, "--candidate"], check=False)
    record(f"{lane_name}_candidate_interface_absent", rejected.returncode == 64
           and rejected.stdout == ""
           and rejected.stderr == "fixture-only interface rejected; candidate mode does not exist\n",
           {"exit": rejected.returncode, "stdout": rejected.stdout, "stderr": rejected.stderr})

with tempfile.TemporaryDirectory(prefix="nhm2-s4-p09-corrupt-") as temp_name:
    corrupt = Path(temp_name) / "quantum.json"
    corrupt.write_bytes((ROOT / QUANTUM_REL).read_bytes() + b"\n")
    corrupt_mount = f"{corrupt}:/work/{QUANTUM_REL}:ro"
    for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
        image = binding[lane_name]["image"].split("@")[0]
        run = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-v", corrupt_mount, "-w", "/work", image, "--fixture-suite", SEAL_REL], check=False)
        record(f"{lane_name}_corrupt_quantum_contract_rejected", run.returncode == 65
               and run.stdout == "" and run.stderr == "quantum builder identity rejected\n",
               {"exit": run.returncode, "stdout": run.stdout, "stderr": run.stderr})

record("runtime_disjoint", binding["primary_cpp_fixture"]["image_id"] != binding["independent_rust_fixture"]["image_id"]
       and binding["primary_cpp_fixture"]["executable"]["sha256"] != binding["independent_rust_fixture"]["executable"]["sha256"], binding["disjointness"])
record("roots_absent", not PRIMARY_ROOT.exists() and not RUST_ROOT.exists(), [PRIMARY_ROOT.exists(), RUST_ROOT.exists()])
record("closure_fail_closed", binding["closure_flags"]["P09_fixture_complete"] is True
       and binding["closure_flags"]["R09_fixture_complete"] is True
       and binding["closure_flags"]["S4_complete"] is False
       and binding["closure_flags"]["inert_proposal_allowed"] is False, binding["closure_flags"])
record("authority_false", not any(binding["authority"].values()), binding["authority"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.p09_r09_runtime_audit.v1",
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
    "next_roles": "P10/R10 negative-axis spectral quadrature and tails",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
