#!/usr/bin/env python3
"""Independent runtime/source audit for candidate-neutral S4 P12/R12 fixtures."""
from __future__ import annotations
import hashlib, json, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-p12-r12-build-binding.v6.json"
SEAL_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json"
QUANTUM_REL = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json"
ROOTS = [ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary", ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"]
def digest(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def canonical_hash(value: object) -> str: return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
def command(argv: list[str], check: bool = True) -> subprocess.CompletedProcess[str]: return subprocess.run(argv, cwd=ROOT, check=check, capture_output=True, text=True)

binding = json.loads(BINDING.read_bytes()); checks: list[dict[str, object]] = []
def record(name: str, condition: bool, detail: object) -> None: checks.append({"name": name, "pass": bool(condition), "detail": detail})
record("binding_sidecar", digest(BINDING) == BINDING.with_suffix(".sha256").read_text("ascii").split()[0], digest(BINDING))
for name, item in binding["immutable_inputs"].items():
    observed = digest(ROOT / item["path"]); record(f"immutable_{name}", observed == item["raw_sha256"], observed)
environment = binding["environment_binding"]
record("environment_binding", canonical_hash(environment["canonical"]) == environment["canonical_json_sha256"], environment)
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]
    for index, item in enumerate(lane["changed_sources"]):
        observed = digest(ROOT / item["path"]); record(f"{lane_name}_source_{index}", observed == item["raw_sha256"], observed)
    for key in ("canonical_build_argv", "canonical_run_argv"):
        record(f"{lane_name}_{key}", canonical_hash(lane[key]) == lane[f"{key}_sha256"], lane[f"{key}_sha256"])

primary_source = (ROOT / binding["primary_cpp_fixture"]["changed_sources"][1]["path"]).read_text("utf-8")
rust_source = (ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]).read_text("utf-8")
record("P12_algorithm_tokens", all(token in primary_source for token in (
    "transport_order = 20", "jet_multiindices = 70", "correction_sweeps = 8",
    "remainder_majorant_iterations = 8", "graded_multiindices", "complete_pivot_inverse",
    "triangular_transport_fixture", "state_remainder_fixture", "projection_and_recompute_fixture", "conservation_fixture",
)), digest(ROOT / binding["primary_cpp_fixture"]["changed_sources"][1]["path"]))
record("R12_algorithm_tokens", all(token in rust_source for token in (
    "TRANSPORT_ORDER: usize = 22", "JET_MULTIINDICES: usize = 70", "PICARD_PASSES: usize = 12",
    "REMAINDER_MAJORANT_ITERATIONS: usize = 12", "graded_multiindices", "native_tensor_connection_fixture",
    "transport_recurrence_fixture", "state_remainder_fixture", "projection_and_recompute_fixture", "conservation_fixture",
)), digest(ROOT / binding["independent_rust_fixture"]["changed_sources"][1]["path"]))
record("R12_pure_rust", "unsafe" not in rust_source and all(token not in rust_source.lower() for token in ('extern "c"', "#[link", "gmp", "mpfr", "flint", "arb.h")), "no unsafe, FFI, C ABI or primary arithmetic lineage")
record("algorithm_lineages_disjoint", "complete_pivot_inverse" in primary_source and "complete_pivot_inverse" not in rust_source and "PICARD_PASSES" in rust_source and "PICARD_PASSES" not in primary_source, binding["disjointness"]["algorithms"])
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]; image = lane["image"].split("@")[0]
    observed = command(["docker", "image", "inspect", image, "--format", "{{.Id}}"]).stdout.strip()
    record(f"{lane_name}_image_id", observed == lane["image_id"], observed)
with tempfile.TemporaryDirectory(prefix="nhm2-s4-p12-audit-") as temp_name:
    temp = Path(temp_name)
    for lane_name, output_name in (("primary_cpp_fixture", "primary"), ("independent_rust_fixture", "rust")):
        lane = binding[lane_name]; image = lane["image"].split("@")[0]; container = command(["docker", "create", image]).stdout.strip()
        try: command(["docker", "cp", f"{container}:{lane['executable']['path']}", str(temp / output_name)])
        finally: command(["docker", "rm", container])
        path = temp / output_name; observed = {"bytes": path.stat().st_size, "sha256": digest(path)}
        record(f"{lane_name}_executable", observed == {"bytes": lane["executable"]["bytes"], "sha256": lane["executable"]["sha256"]}, observed)
root_mount = f"{ROOT}:/work:ro"; reports: dict[str, dict[str, object]] = {}
for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
    lane = binding[lane_name]; image = lane["image"].split("@")[0]
    run = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-w", "/work", image, "--fixture-suite", SEAL_REL])
    report = json.loads(run.stdout); reports[lane_name] = report; expected = lane["expected_report"]
    record(f"{lane_name}_report", all(report.get(key) == value for key, value in expected.items()), report)
    rejected = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-w", "/work", image, "--candidate"], check=False)
    record(f"{lane_name}_candidate_interface_absent", rejected.returncode == 64 and rejected.stdout == "" and rejected.stderr == "fixture-only interface rejected; candidate mode does not exist\n", {"exit": rejected.returncode, "stdout": rejected.stdout, "stderr": rejected.stderr})
with tempfile.TemporaryDirectory(prefix="nhm2-s4-p12-corrupt-") as temp_name:
    corrupt = Path(temp_name) / "quantum.json"; corrupt.write_bytes((ROOT / QUANTUM_REL).read_bytes() + b"\n")
    for lane_name in ("primary_cpp_fixture", "independent_rust_fixture"):
        image = binding[lane_name]["image"].split("@")[0]
        run = command(["docker", "run", "--rm", "--network", "none", "--read-only", "-v", root_mount, "-v", f"{corrupt}:/work/{QUANTUM_REL}:ro", "-w", "/work", image, "--fixture-suite", SEAL_REL], check=False)
        record(f"{lane_name}_corrupt_contract_rejected", run.returncode == 65 and run.stdout == "" and run.stderr == "quantum builder identity rejected\n", {"exit": run.returncode, "stdout": run.stdout, "stderr": run.stderr})
record("runtime_disjoint", binding["primary_cpp_fixture"]["image_id"] != binding["independent_rust_fixture"]["image_id"] and binding["primary_cpp_fixture"]["executable"]["sha256"] != binding["independent_rust_fixture"]["executable"]["sha256"], binding["disjointness"])
record("roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
record("closure_fail_closed", binding["closure_flags"]["P12_fixture_complete"] and binding["closure_flags"]["R12_fixture_complete"] and not binding["closure_flags"]["S4_complete"] and not binding["closure_flags"]["inert_proposal_allowed"], binding["closure_flags"])
record("authority_false", not any(binding["authority"].values()), binding["authority"])
passed = sum(item["pass"] is True for item in checks)
report = {"schema": "nhm2.g2h_e_s4.p12_r12_runtime_audit.v1", "status": "PASS" if passed == len(checks) else "FAIL", "checks_passed": passed, "checks_total": len(checks), "checks": checks, "primary_report": reports.get("primary_cpp_fixture"), "independent_report": reports.get("independent_rust_fixture"), "candidate_evaluations": 0, "positive_parameter_samples": 0, "candidate_roots_created": False, "scientific_builder_executed": False, "execution_authorized": False, "authority_promoted": False, "S4_implementation_closure": False, "next_roles": "P13/R13 noise Gram and PSD residual"}
print(json.dumps(report, sort_keys=True, separators=(",", ":"))); raise SystemExit(0 if report["status"] == "PASS" else 1)
