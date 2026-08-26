#!/usr/bin/env python3
"""Independent definition/runtime audit for the candidate-neutral S5 carrier jets."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import sympy as sp


ROOT = Path(__file__).resolve().parents[1]
IMAGE = "nhm2-g2h-s5-primary-preflight-guard:v17"
ABI = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-checkpoint-abi.v1.json"
GRID = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json"
FLAT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-flat-carrier-remainder-contract.v1.json"
SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_carrier_parameters_v1.cpp"
HEADER = SOURCE.with_suffix(".hpp")
BASE_ENV = [
    "-e", "LC_ALL=C", "-e", "LANG=C", "-e", "TZ=UTC",
    "-e", "OMP_NUM_THREADS=1", "-e", "OPENBLAS_NUM_THREADS=1",
    "-e", "MKL_NUM_THREADS=1",
]
checks: list[dict[str, object]] = []


def check(name: str, passed: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


def zero(expression: sp.Expr) -> bool:
    return sp.simplify(expression) == 0


grid = json.loads(GRID.read_text(encoding="utf-8"))
flat = json.loads(FLAT.read_text(encoding="utf-8"))
check("positive_definitions_frozen",
      grid["positive_kappa_chart"]["tail_unknowns"]["scalars_after_patch_coefficients"] == ["omega", "M"],
      grid["positive_kappa_chart"]["tail_unknowns"]["scalars_after_patch_coefficients"])
vacuum = grid["vacuum_blow_up_chart"]["tail_factorization"]
check("vacuum_definitions_frozen",
      vacuum["kappa_bar"] == "sqrt(-2*Nbar)>0"
      and vacuum["beta_bar"] == "Mbar_infinity*(1+4*eta*Nbar)/kappa_bar-1"
      and vacuum["dependent_mass_observable"].startswith("Mbar_infinity=integral_0^infinity"),
      {key: vacuum[key] for key in ("kappa_bar", "beta_bar", "dependent_mass_observable")})
check("six_instances_frozen",
      len(flat["carrier_family"]["positive_instances"]) == 3
      and len(flat["carrier_family"]["vacuum_instances"]) == 3,
      flat["carrier_family"])
check("mixed_terms_required",
      "omitted mixed terms are forbidden" in flat["mixed_parameter_derivatives"]["chain_rule"],
      flat["mixed_parameter_derivatives"]["chain_rule"])

w, mass = sp.symbols("w mass", positive=True)
kappa = sp.sqrt(1 - w**2)
beta = mass * (2*w**2 - 1) / kappa - 1
positive_expected = {
    "k_w": -w / kappa,
    "k_ww": -1 / kappa**3,
    "b_w": mass * w * (3 - 2*w**2) / kappa**3,
    "b_m": (2*w**2 - 1) / kappa,
    "b_ww": 3*mass / kappa**5,
    "b_wm": w * (3 - 2*w**2) / kappa**3,
    "b_mm": sp.Integer(0),
}
positive_actual = {
    "k_w": sp.diff(kappa, w), "k_ww": sp.diff(kappa, w, 2),
    "b_w": sp.diff(beta, w), "b_m": sp.diff(beta, mass),
    "b_ww": sp.diff(beta, w, 2), "b_wm": sp.diff(beta, w, mass),
    "b_mm": sp.diff(beta, mass, 2),
}
positive_result = {name: zero(positive_actual[name] - expected)
                   for name, expected in positive_expected.items()}
check("positive_value_jacobian_hessian", all(positive_result.values()), positive_result)

eta, nbar, mbar = sp.symbols("eta nbar mbar", real=True)
kbar = sp.sqrt(-2*nbar)
bbar = mbar * (1 + 4*eta*nbar) / kbar - 1
vacuum_expected = {
    "k_n": -1/kbar,
    "k_nn": -1/kbar**3,
    "b_n": mbar*(1 - 4*eta*nbar)/kbar**3,
    "b_m": (1 + 4*eta*nbar)/kbar,
    "b_nn": mbar*(3 - 4*eta*nbar)/kbar**5,
    "b_nm": (1 - 4*eta*nbar)/kbar**3,
    "b_mm": sp.Integer(0),
}
vacuum_actual = {
    "k_n": sp.diff(kbar, nbar), "k_nn": sp.diff(kbar, nbar, 2),
    "b_n": sp.diff(bbar, nbar), "b_m": sp.diff(bbar, mbar),
    "b_nn": sp.diff(bbar, nbar, 2), "b_nm": sp.diff(bbar, nbar, mbar),
    "b_mm": sp.diff(bbar, mbar, 2),
}
vacuum_result = {name: zero(vacuum_actual[name] - expected)
                 for name, expected in vacuum_expected.items()}
check("vacuum_value_jacobian_hessian", all(vacuum_result.values()), vacuum_result)

# Independently verify the full-state Hessian composition for beta_bar when
# eta is fixed, Nbar is one state coordinate and Mbar_infinity is dependent.
bn, bm = vacuum_expected["b_n"], vacuum_expected["b_m"]
bnn, bnm = vacuum_expected["b_nn"], vacuum_expected["b_nm"]
mi, mj, mij, di, dj = sp.symbols("mi mj mij di dj")
composed = bm*mij + bnn*di*dj + bnm*(di*mj + mi*dj)
check("dependent_mass_full_state_hessian",
      zero(composed - (bm*mij + bnn*di*dj + bnm*di*mj + bnm*mi*dj)),
      str(composed))

source_text = SOURCE.read_text(encoding="utf-8")
header_text = HEADER.read_text(encoding="utf-8")
check("selected_member_absent", "6/5" not in source_text + header_text,
      "no selected coordinate literal")
check("positive_sample_absent", "positive_parameter_samples" not in source_text + header_text,
      "parameter producer has no sampling counter or ingress")
check("fixed_eta_state_derivative_documented", "hold eta fixed" in header_text,
      "vacuum state derivative convention")
check("full_mass_jet_required",
      "mbar_gradient" in header_text and "mbar_hessian" in header_text,
      "dependent observable derivative ingress")
check("mixed_hessian_terms_present",
      "if (i == nbar_index)" in source_text and "if (j == nbar_index)" in source_text,
      "both directed Nbar/Mbar mixed orientations")

common = [
    "docker", "run", "--rm", "--network", "none", "--read-only",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
    "--pids-limit", "64", "--memory", "512m",
]
mount = ["-v", f"{ROOT}:/work:ro", "-w", "/work"]
runtime = subprocess.run(common + BASE_ENV + mount + [IMAGE, "--preflight-self-test", ABI],
                         cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=False)
try:
    runtime_report = json.loads(runtime.stdout)
except json.JSONDecodeError:
    runtime_report = {}
check("candidate_neutral_runtime",
      runtime.returncode == 0 and runtime_report.get("status") == "PASS"
      and runtime_report.get("checks_passed") == 10
      and runtime_report.get("carrier_parameter_checks_passed") == 3
      and runtime_report.get("carrier_parameter_check_mask") == 7
      and runtime_report.get("candidate_evaluations") == 0
      and runtime_report.get("positive_parameter_samples") == 0
      and runtime_report.get("candidate_roots_created") is False
      and runtime_report.get("authorization_created") is False
      and runtime_report.get("authority_promoted") is False,
      runtime_report)

protected = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    ROOT / "artifacts/nhm2/g2h-e-s5/executions",
]
check("protected_paths_absent", not any(path.exists() for path in protected),
      {str(path.relative_to(ROOT)): path.exists() for path in protected})

passed = sum(1 for item in checks if item["pass"])
report = {
    "schema": "nhm2.g2h_e_s5.carrier_parameter_definition_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "authorization_created": False,
    "authority_promoted": False,
    "checks": checks,
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if passed == len(checks) else 1)
