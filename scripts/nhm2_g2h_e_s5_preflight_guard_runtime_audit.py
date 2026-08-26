#!/usr/bin/env python3
"""Run only candidate-neutral runtime checks for the S5 primary outer guard."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGE = "nhm2-g2h-s5-primary-preflight-guard:v17"
IMAGE_ID = "sha256:bca5bdd17a48381cf2e2f79ecb414452a2b18db96381af6793c9fd06654dc5ba"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-checkpoint-v1"
EXECUTABLE_SHA256 = "571604acbc4cf203de15c44f35f22df4038b0ecf9bbf0f980cd6fe6ecc3bc750"
ABI = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json"
EXPECTED_SOURCES = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_sha256_v1.hpp": "99278b36da34a37e7e6a199f247f1e3d8ca91f10bff309cb19c1355dd3d199d2",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_preflight_guard_v1.cpp": "5650cc5d0fa6f7ce40331f4e6a4a825336218980186c50bf1df78e949e7c13af",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_record_v1.hpp": "158d45df58780489b81d0c090bde0bf7de972cc20cdd586d6ca7c62456057000",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_record_v1.cpp": "6ef30ce771b94fa49fbdeffe6bc5084608a3dfc179a1d7bb6416321f8c9caa17",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_ingress_v1.hpp": "5a8443d8a14dbab69dd8a04fa446043a32c3e89435d78083659e8e9745db9465",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_ingress_v1.cpp": "5b0419c1814a00cbae7d91b1c8fcc959e2eb48fb4cc31ad61b135646c07786eb",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_origin_v1.hpp": "eb93a0bba95d97a09be6650619d373faecde9a69dabdf36afdf9bd9b2bc94ce5",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_origin_v1.cpp": "e80f7bc67a215916156452a350df3fe05c7e8d2fa3ec5c15ab66347eb1862d6d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_grid_v1.hpp": "85bebb7814a1dd7c190e58a031f8e791bb736b0693be0f04035f9826130252c7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_grid_v1.cpp": "63901c2dca4af9f77113249324a3004f002dd63f8d0b56bcc04d1e7eaad20a4b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_dispatch_v1.hpp": "de7a6eedf2c250f926caec29a3add793dbea7a40d437e8a72045b50e94556790",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_dispatch_v1.cpp": "bce039396e22d60f5344ff273a4aaa40269beba27be35aed950700c32b305f12",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_ekg_v1.hpp": "3b10596765b40419377df05926e34fe83a3fb167d51cf7948a018ba4852fbec9",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_ekg_v1.cpp": "708cce158eb83944e2b5a741c37afceb09b0361173192cde0dcb5d0491be3cb9",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_positive_tail_v1.hpp": "d22350f0c1b4d0bfadcca401f903b0387ff61a404286ec47669bf714b8c72158",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_positive_tail_v1.cpp": "fe06fc65a295e697dc8588f08e2949c21143b8a03baffea15be11f1018a9ddf0",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_flat_carrier_v1.hpp": "e88a344b6a31ae461d238a2c6ad3c5ff38c3f4278cbcfa6bf6c128758ba8bc5b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_flat_carrier_v1.cpp": "93b64b2f10876a2742c4becbae2328167c661b0914c33d910ea680cbecd08365",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_carrier_parameters_v1.hpp": "9e4089c46a5012329d2d7cf1235de40a2f95d3046e929448c82859fb186cc39a",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_carrier_parameters_v1.cpp": "dacae316fe94d05273881c3d18182bb71d5750266ed29fc86c7e1543250ff35c",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-preflight-guard.v1": "73fed16528350a4342f42054bfeacc3825fa800d7531de2c26676f70c0a070c3",
}
BASE_ENV = [
    "-e", "LC_ALL=C", "-e", "LANG=C", "-e", "TZ=UTC",
    "-e", "OMP_NUM_THREADS=1", "-e", "OPENBLAS_NUM_THREADS=1",
    "-e", "MKL_NUM_THREADS=1",
]
checks: list[dict[str, object]] = []


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


def run(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(arguments, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=False)


for path, expected in EXPECTED_SOURCES.items():
    actual = sha(ROOT / path)
    check(f"source_{Path(path).name}", actual == expected, actual)

inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
check("image_identity", inspect.returncode == 0 and inspect.stdout.strip() == IMAGE_ID, inspect.stdout.strip())

executable = run(["docker", "run", "--rm", "--network", "none", "--read-only",
    "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
check("executable_identity", executable.returncode == 0 and executable.stdout.split()[0] == EXECUTABLE_SHA256, executable.stdout.strip())

common = ["docker", "run", "--rm", "--network", "none", "--read-only", "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges", "--pids-limit", "64", "--memory", "512m"]
mount = ["-v", f"{ROOT}:/work:ro", "-w", "/work"]
self_test = run(common + BASE_ENV + mount + [IMAGE, "--preflight-self-test", ABI])
try:
    report = json.loads(self_test.stdout)
except json.JSONDecodeError:
    report = {}
check("self_test_pass", self_test.returncode == 0 and report.get("status") == "PASS"
    and report.get("checks_passed") == 10 and report.get("checks_total") == 10
    and report.get("record_checks_passed") == 2
    and report.get("ingress_checks_passed") == 7 and report.get("origin_checks_passed") == 3
    and report.get("grid_checks_passed") == 8 and report.get("dispatch_checks_passed") == 5
    and report.get("ekg_checks_passed") == 3
    and report.get("flat_carrier_checks_passed") == 9
    and report.get("flat_carrier_checks_total") == 9
    and report.get("flat_carrier_check_mask") == 511
    and report.get("flat_carrier_mixed_derivative_inventory") == 78
    and report.get("flat_carrier_compact_box_envelopes_linked") is True
    and report.get("flat_carrier_bell12_norms_linked") is True
    and report.get("flat_carrier_parameter_norm_inventory") == 6
    and report.get("carrier_parameter_checks_passed") == 3
    and report.get("carrier_parameter_checks_total") == 3
    and report.get("carrier_parameter_check_mask") == 7
    and report.get("carrier_parameter_full_state_chain_rules_linked") is True
    and report.get("positive_tail_checks_passed") == 4
    and report.get("positive_tail_check_mask") == 15
    and report.get("positive_tail_zero_field_failure_stage") == 0
    and report.get("positive_tail_zero_field_mask") == 63, report)
check("self_test_zero_science", report.get("candidate_evaluations") == 0
    and report.get("positive_parameter_samples") == 0
    and report.get("candidate_roots_created") is False
    and report.get("dispatch_controller_linked") is True
    and report.get("scientific_handlers_linked") is False, report)

bad_interface = run(common + BASE_ENV + mount + [IMAGE, "--bad-interface"])
check("bad_interface_exit_64", bad_interface.returncode == 64 and bad_interface.stderr == "interface_or_argument_rejected\n", {"code": bad_interface.returncode, "stderr": bad_interface.stderr})

missing_mount = run(common + BASE_ENV + [IMAGE, "--preflight-self-test", ABI])
check("missing_abi_exit_65", missing_mount.returncode == 65, {"code": missing_mount.returncode, "stdout": missing_mount.stdout})

extra_environment = run(common + BASE_ENV + ["-e", "UNSEALED_VARIABLE=1"] + mount
    + [IMAGE, "--preflight-self-test", ABI])
check("extra_environment_exit_65", extra_environment.returncode == 65, {"code": extra_environment.returncode, "stdout": extra_environment.stdout})

token_in_self_test = run(common + BASE_ENV + ["-e", "NHM2_EXECUTION_TOKEN=" + "0" * 64] + mount
    + [IMAGE, "--preflight-self-test", ABI])
check("token_forbidden_in_self_test", token_in_self_test.returncode == 65, {"code": token_in_self_test.returncode, "stdout": token_in_self_test.stdout})

primary = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary"
independent = ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent"
authorization = ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt"
ledgers = ROOT / "artifacts/nhm2/g2h-e-s5/executions"
check("protected_paths_absent", not primary.exists() and not independent.exists() and not authorization.exists() and not ledgers.exists(), [primary.exists(), independent.exists(), authorization.exists(), ledgers.exists()])

passed = sum(1 for item in checks if item["pass"])
report = {
    "schema": "nhm2.g2h_e_s5.preflight_guard_runtime_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "authorization_created": False,
    "scientific_dispatch_linked": False,
    "authority_promoted": False,
    "checks": checks,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if passed == len(checks) else 1)
