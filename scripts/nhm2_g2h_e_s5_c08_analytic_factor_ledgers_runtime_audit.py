#!/usr/bin/env python3
"""Independent audit for persistent candidate-neutral C08 F/E1/E2 ledgers."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-analytic-factor-ledgers-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-analytic-factor-ledgers-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-analytic-factor-ledgers-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_ledgers_v1.hpp":
        "8c7b84dfcdaf0ee4eb2384ba6c528c56b8cf26e38ec996c2faca552c4a98a677",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_ledgers_v1.cpp":
        "20380c43627e0278e888e8c1ff0e16ea94d8a49732182af7488eed23766356a8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_ledgers_fixture_v1.cpp":
        "611beee2a571bc8c220445f770726c7d83d2b1a3b75293c5dda0443012b409cf",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-factor-ledgers-fixture.v1":
        "6d3f6727f69a472f7a8da3b3e78708938adab923898f427d3b0c08d7fc7e41f3",
}
EXPECTED_EXECUTABLE = "3a9e4f425e6453f5770f77709d14aa4294d84c10faa111f96cf41fa07673555f"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False,
                          capture_output=True, text=True)


def parse(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def passing(path: str) -> bool:
    process = run([sys.executable, path])
    payload = parse(process)
    return (process.returncode == 0 and payload.get("status") == "PASS"
            and payload.get("checks_passed") == payload.get("checks_total"))


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", sha(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_analytic_factor_ledgers_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_analytic_factor_ledgers_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_analytic_factor_ledgers_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("complete_scalar_inventory", "scalar_ledger_identities{};  // B,V,J1,J2" in header
         and "kScalarStateCount = 4U" in header),
        ("three_factor_inventory", "factor_ledger_identities{};  // F,E1,E2" in header
         and "kFactorCount = factor::kFactorCount" in header),
        ("unique_disjoint_ids", "std::set<std::uint32_t> scalar_ids" in source
         and "std::set<std::uint32_t> factor_ids" in source
         and "scalar_ids.count(identity)" in source),
        ("all_sources_validated", "valid_ledger((*scalar)[state]->ledger)" in source),
        ("coherent_all_source_geometry", "same_geometry(reference" in source
         and "state = 1U; state < kScalarStateCount" in source),
        ("all_four_prefixes_locked", "source_digests" in source
         and "digest != impl.source_digests[state][ordinal]" in source),
        ("exact_parameter_identity", "same_parameters(input, impl)" in source
         and "parameter_identity_or_prefix" in source),
        ("real_model_producer", "factor::evaluate(model_input" in source
         and "&impl.parameters" in source),
        ("three_pending_validations", "selected < kFactorCount && ledgers_valid" in source
         and "validate_with_pending(" in source),
        ("atomic_triple_commit", source.index("selected < kFactorCount && ledgers_valid")
         < source.index("impl.models.push_back(std::move(pending))")),
        ("stable_owned_models", "std::vector<std::unique_ptr<factor::Output>> models" in source),
        ("stable_publications", "std::array<std::vector<std::unique_ptr<Publication>>" in source
         and "publications[selected].push_back" in source),
        ("resource_and_terminal_guard", "ledger::kMaximumLedgerModels" in source
         and "terminal_failure_already_recorded" in source),
        ("fixture_three_ledgers", "valid_ledger(f_after" in fixture
         and "valid_ledger(e1_after" in fixture
         and "valid_ledger(e2_after" in fixture),
        ("fixture_stable_prefix", "same_model(f_before.models[0]" in fixture
         and "same_model(e2_before.models[0]" in fixture),
        ("fixture_unused_j2_mutation", "mutable_j2" in fixture
         and "scalar_inventory_or_prefix" in fixture),
        ("fixture_parameter_mutation", "changed_parameter" in fixture
         and "parameter_identity_or_prefix" in fixture),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))
    checks.append(("predecessor_factor_model",
                   passing("scripts/nhm2_g2h_e_s5_c08_analytic_factor_model_runtime_audit.py")))
    checks.append(("predecessor_scalar_ledgers",
                   passing("scripts/nhm2_g2h_e_s5_c08_scalar_ledger_provider_runtime_audit.py")))

    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE,
                         "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("local_image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--network", "none",
                          "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        for ordinal in range(2):
            process = run(["docker", "run", "--rm", "--network", "none",
                           "--read-only", "--cap-drop", "ALL", "--security-opt",
                           "no-new-privileges", "--pids-limit", "64", IMAGE])
            payload = parse(process)
            reports.append(payload)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", process.returncode == 0),
                (f"fixture_{ordinal}_13_of_13", payload.get("checks_passed") == 13
                 and payload.get("checks_total") == 13),
                (f"fixture_{ordinal}_inventory", payload.get("models_per_factor") == 2),
                (f"fixture_{ordinal}_candidate_inert", payload.get("candidate_evaluations") == 0
                 and payload.get("positive_parameter_samples") == 0
                 and payload.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false", payload.get("scientific_handler_linked") is False
                 and payload.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report", reports[0] == reports[1]))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failed = [name for name, ok in checks if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_analytic_factor_ledgers_runtime_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks), "failed": failed,
        "image_id": image_id, "executable_sha256": executable_hash,
        "candidate_evaluations": 0, "positive_parameter_samples": 0,
        "candidate_roots_created": False, "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, separators=(",", ":"), sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
