#!/usr/bin/env python3
"""Independent candidate-neutral audit for H2-P8F parent binding."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-parent-decomposition-v1-20260830"
RECEIPT = ARTIFACT / "h2-p8f-independent-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8f-parent-decomposition-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8f-parent-decomposition-fixture-v1"
EXPECTED_EXECUTABLE = "c7a6f1e5c8f8b636407517561fe3db22ac0f5eaef86bee594b89e73e9254fcf8"
EXPECTED = {
    "mini_boson_star_primary_c08_h2_ledger_v1.hpp":
        "95b9edfe39367b882dc96ff1bced3c74fa0bb75263bc5c519d1bf1df9cf1c838",
    "mini_boson_star_primary_c08_h2_ledger_v1.cpp":
        "d00603a418ed0507248f9019b35887a8e453c09d0336c9e1464b0bcb2f8f224c",
    "mini_boson_star_primary_c08_h2_p8f_parent_decomposition_fixture_v1.cpp":
        "0e85c5b0d530ded10fadff279e3bff83fd76006e986dc123bb443269da61fc1b",
    "Dockerfile.primary.mini-boson-c08-h2-p8f-parent-decomposition-fixture.v1":
        "8f353a4a99933ad592090726c6a60023370800f7c418fd0eebaca1d2b81f2285",
}
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True)


def report(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    if RECEIPT.exists():
        raise RuntimeError(f"immutable audit receipt exists: {RECEIPT}")
    checks: dict[str, bool] = {
        f"hash:{name}": sha(G2H / name) == expected
        for name, expected in EXPECTED.items()
    }
    checks["protected_absent_before"] = all(
        not (ROOT / path).exists() for path in PROTECTED)
    header = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8f_parent_decomposition_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8f-parent-decomposition-fixture.v1"
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-parent-decomposition-binding.md").read_text(encoding="utf-8")
    checks.update({
        "packet_header": packet.startswith("Program gate:") and "Explicit non-goals:" in packet,
        "read_only_contract": "Read-only parent contract" in packet,
        "representative_frozen_65536": "panel_count = 65,536" in packet,
        "representative_degree3": "target_degree = 3" in packet,
        "representative_jet9": "target_jet = second_jet(1,2) = 9" in packet,
        "ordinary_initialize_retained": "bool initialize(const Input &input" in header,
        "ordinary_extend_retained": "bool extend(const Input &input" in header,
        "additive_entrypoint": "diagnose_next_selector_candidate" in header,
        "const_context": "const Input &input, const Context *context" in header,
        "requires_initialized": "!context->impl_->initialized" in source,
        "rejects_terminal": "context->impl_->terminal_failure" in source,
        "identity_match": "input.scalar_ledger_identities != impl.scalar_ids" in source and "input.h2_ledger_identity != impl.h2_id" in source,
        "exactly_one_new_source": "b->ledger.model_count != impl.models.size() + 1U" in source,
        "prefix_digest_replay": "impl.scalar_source_digests[state][ordinal]" in source,
        "same_selector_input": all(token in source for token in (
            "const ledger::LedgerView b_prefix", "const ledger::LedgerView v_prefix",
            "target.left_endpoint, target.right_endpoint, target.order",
            "kJetCount, impl.b_at_zero.data()")),
        "one_candidate_surface": "selector::evaluate_prepared_candidate_decomposition(" in source,
        "no_extend_impl_call_in_binding": "diagnose_next_selector_candidate" in source and "return extend_impl(input, *context->impl_" not in source[source.index("bool diagnose_next_selector_candidate"):source.index("namespace {", source.index("bool diagnose_next_selector_candidate"))],
        "fixture_parent_unchanged": "same_ledger(before, after)" in fixture,
        "fixture_repeated_determinism": "same_observation(first_observation" in fixture,
        "fixture_two_panels_only": "h2_extension_input, &h2_context, 2U, 2U, 3U" in fixture,
        "fixture_no_selector_decision": "numerical_width_checks == 0U" in fixture,
        "fixture_candidate_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in dockerfile.read_text(encoding="utf-8"),
        "digest_pinned_runtime": "@sha256:8334e977" in dockerfile.read_text(encoding="utf-8"),
        "strict_compile_flags": "-fno-fast-math" in dockerfile.read_text(encoding="utf-8") and "-Werror" in dockerfile.read_text(encoding="utf-8"),
    })

    build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                 "--file", str(dockerfile), "--tag", IMAGE, "."])
    checks["offline_build"] = build.returncode == 0
    image_id = ""
    executable_sha = ""
    reports: list[dict[str, object]] = []
    outputs: list[str] = []
    if build.returncode == 0:
        inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspect.stdout.strip()
        checks["image_identity"] = inspect.returncode == 0 and image_id.startswith("sha256:")
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                          IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_sha = executable.stdout.strip().split()[0]
        checks["executable_identity"] = executable_sha == EXPECTED_EXECUTABLE
        for ordinal in range(2):
            executed = run(["docker", "run", "--rm", "--network", "none",
                            "--read-only", "--cap-drop", "ALL", "--security-opt",
                            "no-new-privileges", "--pids-limit", "64", IMAGE])
            payload = report(executed)
            reports.append(payload)
            outputs.append(executed.stdout)
            checks[f"fixture_{ordinal}_exit"] = executed.returncode == 0
            checks[f"fixture_{ordinal}_11_of_11"] = (
                payload.get("status") == "PASS"
                and payload.get("checks_passed") == 11
                and payload.get("checks_total") == 11)
            checks[f"fixture_{ordinal}_parent_unchanged"] = payload.get("parent_unchanged") is True
            checks[f"fixture_{ordinal}_deterministic"] = payload.get("deterministic") is True
            checks[f"fixture_{ordinal}_neutral"] = (
                payload.get("candidate_evaluations") == 0
                and payload.get("positive_parameter_samples") == 0
                and payload.get("candidate_roots_created") is False)
            checks[f"fixture_{ordinal}_authority_false"] = (
                payload.get("scientific_handler_linked") is False
                and payload.get("authority_promoted") is False)
        checks["fixture_repeat_byte_equal"] = len(outputs) == 2 and outputs[0] == outputs[1]

    checks["protected_absent_after"] = all(
        not (ROOT / path).exists() for path in PROTECTED)
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_parent_decomposition_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "image_id": image_id,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "representative_execution_started": False,
        "parent_selector_executed": False,
        "frozen_candidate_evaluated": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(RECEIPT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
