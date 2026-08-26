#!/usr/bin/env python3
"""Audit G2H-E-S4 manufactured-fixture runtimes without scientific ingress."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile
import tempfile
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_REL = Path(
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json"
)
MANIFEST_SHA256 = "215078e444fd4ff30c393b03daa2c70ef093fcc5719cf802d387f56d6c123515"
SEAL_REL = Path(
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-seal.v1.json"
)
MUTATED_SEAL_REL = Path(
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-inventory.v1.json"
)


checks: list[dict[str, Any]] = []


def record(name: str, passed: bool, detail: Any) -> None:
    checks.append({"name": name, "pass": bool(passed), "detail": detail})


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_identity(relative: str | Path) -> tuple[int, str]:
    data = (ROOT / relative).read_bytes()
    return len(data), sha256_bytes(data)


def run(argv: list[str], expected: int | None = None) -> subprocess.CompletedProcess[bytes]:
    completed = subprocess.run(
        argv,
        cwd=ROOT,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if expected is not None and completed.returncode != expected:
        raise RuntimeError(
            f"unexpected exit {completed.returncode}, expected {expected}: {argv!r}; "
            f"stdout={completed.stdout[:500]!r}; stderr={completed.stderr[:500]!r}"
        )
    return completed


def inspect_image(image: str) -> dict[str, Any]:
    completed = run(["docker", "image", "inspect", image], 0)
    payload = json.loads(completed.stdout)
    if not isinstance(payload, list) or len(payload) != 1:
        raise RuntimeError(f"ambiguous docker image inspection for {image}")
    return payload[0]


def roots_absent(manifest: dict[str, Any], label: str) -> bool:
    roots = manifest["future_candidate_roots"]
    states = {
        roots["primary"]: (ROOT / roots["primary"]).exists(),
        roots["independent"]: (ROOT / roots["independent"]).exists(),
    }
    record(label, not any(states.values()), states)
    return not any(states.values())


def canonical_fixture_argv(image: str, extra_mounts: list[str] | None = None) -> list[str]:
    argv = [
        "docker", "run", "--rm", "--network=none", "--read-only",
        "--cap-drop=ALL", "--security-opt", "no-new-privileges",
        "--volume", f"{ROOT}:/work:ro",
    ]
    for mount in extra_mounts or []:
        argv.extend(["--volume", mount])
    argv.extend([
        "--workdir", "/work", image, "--fixture-suite", SEAL_REL.as_posix()
    ])
    return argv


def canonical_receipt_argv(image: str, output_directory: Path) -> list[str]:
    return [
        "docker", "run", "--rm", "--network=none", "--read-only",
        "--cap-drop=ALL", "--security-opt", "no-new-privileges",
        "--volume", f"{ROOT}:/work:ro",
        "--volume", f"{output_directory}:/fixture-output:rw",
        "--workdir", "/work", image, "--receipt-fixture", SEAL_REL.as_posix(),
        "/fixture-output",
    ]


def parse_report(completed: subprocess.CompletedProcess[bytes]) -> dict[str, Any]:
    stdout = completed.stdout.decode("utf-8", "strict")
    lines = stdout.splitlines()
    if len(lines) != 1:
        raise RuntimeError(f"fixture stdout is not one line: {stdout!r}")
    if completed.stderr:
        raise RuntimeError(f"fixture success wrote stderr: {completed.stderr!r}")
    value = json.loads(lines[0])
    if not isinstance(value, dict):
        raise RuntimeError("fixture report is not an object")
    return value


def audit_receipt_stream(stream: bytes, lane: str) -> tuple[bool, dict[str, Any]]:
    lines = stream.splitlines()
    detail: dict[str, Any] = {"records": len(lines), "sha256": sha256_bytes(stream)}
    if len(lines) != 5 or not stream.endswith(b"\n"):
        return False, detail
    previous = "0" * 64
    expected_decisions = ["PASS", "PASS", "FAIL", "INELIGIBLE_AFTER_FIRST_FAIL", "INELIGIBLE_AFTER_FIRST_FAIL"]
    required = {
        "authority", "candidate_evaluations", "contract_sha256", "decision", "duty_id",
        "fixture_id", "implementation_id", "lane", "payload", "payload_sha256",
        "previous_record_sha256", "record_self_sha256", "schema", "sequence",
    }
    valid = True
    for sequence, line in enumerate(lines):
        record_value = json.loads(line)
        payload_canonical = json.dumps(
            record_value["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
        expected_payload_hash = sha256_bytes(b"nhm2-g2h-e-s4/payload/v1\n" + payload_canonical)
        without_self = dict(record_value)
        observed_self = without_self.pop("record_self_sha256")
        record_canonical = json.dumps(
            without_self, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
        expected_self = sha256_bytes(b"nhm2-g2h-e-s4/record/v1\n" + record_canonical)
        valid = valid and set(record_value) == required
        valid = valid and record_value["sequence"] == sequence
        valid = valid and record_value["decision"] == expected_decisions[sequence]
        valid = valid and record_value["candidate_evaluations"] == 0
        valid = valid and all(value is False for value in record_value["authority"].values())
        valid = valid and record_value["payload_sha256"] == expected_payload_hash
        valid = valid and record_value["previous_record_sha256"] == previous
        valid = valid and observed_self == expected_self
        valid = valid and record_value["lane"] == lane
        valid = valid and record_value["payload"]["evaluated"] is (sequence <= 2)
        valid = valid and (
            record_value["payload"].get("typed_failure")
            == "builder_budget_exhausted:classical_inverse:projection_retries"
            if sequence == 2 else "typed_failure" not in record_value["payload"]
        )
        previous = observed_self
    detail["terminal_record_sha256"] = previous
    detail["decisions"] = expected_decisions
    return valid, detail


def executable_from_image(image: str, executable: str) -> bytes:
    created = run(["docker", "create", image], 0)
    container = created.stdout.decode("ascii", "strict").strip()
    if not container:
        raise RuntimeError("docker create returned no container identity")
    try:
        exported = run(["docker", "export", container], 0).stdout
        with tempfile.TemporaryDirectory(prefix="nhm2-s4-audit-") as directory:
            archive_path = Path(directory) / "rootfs.tar"
            archive_path.write_bytes(exported)
            with tarfile.open(archive_path, "r:") as archive:
                member = archive.getmember(executable.lstrip("/"))
                stream = archive.extractfile(member)
                if stream is None:
                    raise RuntimeError(f"executable {executable} is not a regular archive member")
                return stream.read()
    finally:
        run(["docker", "rm", "--force", container], 0)


def rootfs_names(image: str) -> list[str]:
    created = run(["docker", "create", image], 0)
    container = created.stdout.decode("ascii", "strict").strip()
    try:
        exported = run(["docker", "export", container], 0).stdout
        with tempfile.TemporaryDirectory(prefix="nhm2-s4-rootfs-") as directory:
            archive_path = Path(directory) / "rootfs.tar"
            archive_path.write_bytes(exported)
            with tarfile.open(archive_path, "r:") as archive:
                return sorted(member.name for member in archive.getmembers())
    finally:
        run(["docker", "rm", "--force", container], 0)


def normalized_budget_table(builder: dict[str, Any], lane_key: str) -> dict[tuple[str, str], int]:
    roles = {
        "classical_inverse_builder": "classical_inverse",
        "continuation_builder": "continuation",
        "stability_builder": "stability",
        "quantum_builder": "quantum",
    }
    result: dict[tuple[str, str], int] = {}
    for source_role, wire_role in roles.items():
        for counter, value in builder[lane_key][source_role]["budgets"].items():
            wire_counter = "ell_max_inclusive" if counter == "ell_max" else counter
            if isinstance(value, int):
                result[(wire_role, wire_counter)] = value
                continue
            match = re.fullmatch(r"2\^-(\d+)", value)
            if match is None:
                raise RuntimeError(f"unrecognized frozen budget value {source_role}:{counter}={value!r}")
            if counter == "L":
                wire_counter = "L_exponent_magnitude"
            elif counter in {"target_total_width", "per_tail_target"}:
                wire_counter = f"{counter}_exponent_magnitude"
            else:
                raise RuntimeError(f"unrecognized dyadic budget counter {source_role}:{counter}")
            result[(wire_role, wire_counter)] = int(match.group(1))
    return result


def source_budget_table(source: str, lane: str) -> dict[tuple[str, str], int]:
    if lane == "primary":
        matches = re.findall(r'\{"([a-z_]+)", "([A-Za-z0-9_]+)", (\d+)\}', source)
    else:
        matches = re.findall(
            r'Spec \{ role: "([a-z_]+)", counter: "([A-Za-z0-9_]+)", limit: (\d+) \}',
            source,
        )
    return {(role, counter): int(limit) for role, counter, limit in matches}


def audit() -> int:
    os.chdir(ROOT)
    manifest_bytes = (ROOT / MANIFEST_REL).read_bytes()
    manifest_hash = sha256_bytes(manifest_bytes)
    record("manifest_hash", manifest_hash == MANIFEST_SHA256, manifest_hash)
    manifest = json.loads(manifest_bytes)

    record(
        "manifest_status_is_fixture_only",
        manifest["status"] == "fixture_only_runtime_bound_scientific_producers_not_yet_complete_no_execution_authority",
        manifest["status"],
    )
    for name, binding in manifest["immutable_inputs"].items():
        observed_bytes, observed_hash = file_identity(binding["path"])
        record(
            f"immutable_{name}",
            observed_bytes == binding["bytes"] and observed_hash == binding["raw_sha256"],
            {"bytes": observed_bytes, "sha256": observed_hash},
        )

    lanes = [
        ("primary", manifest["primary_cpp_fixture"]),
        ("independent", manifest["independent_rust_fixture"]),
    ]
    for lane_name, lane in lanes:
        for artifact_name in ("source", "dockerfile"):
            binding = lane[artifact_name]
            observed_bytes, observed_hash = file_identity(binding["path"])
            record(
                f"{lane_name}_{artifact_name}_identity",
                observed_bytes == binding["bytes"] and observed_hash == binding["raw_sha256"],
                {"bytes": observed_bytes, "sha256": observed_hash},
            )
        for index, binding in enumerate(lane.get("additional_sources", [])):
            observed_bytes, observed_hash = file_identity(binding["path"])
            record(
                f"{lane_name}_additional_source_{index}_identity",
                observed_bytes == binding["bytes"] and observed_hash == binding["raw_sha256"],
                {"path": binding["path"], "bytes": observed_bytes, "sha256": observed_hash},
            )
        builder_dockerfile = lane.get("build", {}).get("builder_dockerfile")
        if builder_dockerfile is not None:
            observed_bytes, observed_hash = file_identity(builder_dockerfile["path"])
            record(
                f"{lane_name}_builder_dockerfile_identity",
                observed_bytes == builder_dockerfile["bytes"]
                and observed_hash == builder_dockerfile["raw_sha256"],
                {"path": builder_dockerfile["path"], "bytes": observed_bytes, "sha256": observed_hash},
            )

        image = inspect_image(lane["runtime"]["image"])
        config = image["Config"]
        record(
            f"{lane_name}_image_identity",
            image["Id"] == lane["runtime"]["image_id"],
            image["Id"],
        )
        record(
            f"{lane_name}_platform",
            f"{image['Os']}/{image['Architecture']}" == lane["runtime"]["platform"],
            f"{image['Os']}/{image['Architecture']}",
        )
        record(
            f"{lane_name}_entrypoint",
            config.get("Entrypoint") == lane["runtime"]["entrypoint"],
            config.get("Entrypoint"),
        )
        record(
            f"{lane_name}_environment",
            config.get("Env") == lane["runtime"]["image_environment_exact"],
            config.get("Env"),
        )
        executable = executable_from_image(
            lane["runtime"]["image"], lane["runtime"]["executable"]["path"]
        )
        record(
            f"{lane_name}_executable_identity",
            len(executable) == lane["runtime"]["executable"]["bytes"]
            and sha256_bytes(executable) == lane["runtime"]["executable"]["sha256"],
            {"bytes": len(executable), "sha256": sha256_bytes(executable)},
        )

    primary_bindings = [manifest["primary_cpp_fixture"]["source"]] + manifest["primary_cpp_fixture"].get("additional_sources", [])
    rust_bindings = [manifest["independent_rust_fixture"]["source"]] + manifest["independent_rust_fixture"].get("additional_sources", [])
    primary_source = "\n".join((ROOT / binding["path"]).read_text("utf-8") for binding in primary_bindings)
    rust_source = "\n".join((ROOT / binding["path"]).read_text("utf-8") for binding in rust_bindings)
    record(
        "primary_arithmetic_lineage_present",
        all(token in primary_source for token in ("arb.h", "flint", "gmp", "mpfr")),
        "Arb/FLINT/GMP/MPFR headers required",
    )
    rust_lower = rust_source.lower()
    rust_forbidden = [
        token for token in ("extern \"c\"", "#[link", "unsafe {", "unsafe fn", "gmp", "mpfr", "flint", "arb.h")
        if token in rust_lower
    ]
    record("rust_forbids_unsafe", "#![forbid(unsafe_code)]" in rust_source, "crate-level forbid")
    record("rust_has_no_C_arithmetic_or_FFI", not rust_forbidden, rust_forbidden)
    record(
        "source_hashes_disjoint",
        manifest["primary_cpp_fixture"]["source"]["raw_sha256"]
        != manifest["independent_rust_fixture"]["source"]["raw_sha256"],
        [
            manifest["primary_cpp_fixture"]["source"]["raw_sha256"],
            manifest["independent_rust_fixture"]["source"]["raw_sha256"],
        ],
    )
    primary_hashes = {binding["raw_sha256"] for binding in primary_bindings}
    rust_hashes = {binding["raw_sha256"] for binding in rust_bindings}
    primary_paths = {binding["path"] for binding in primary_bindings}
    rust_paths = {binding["path"] for binding in rust_bindings}
    record(
        "source_sets_disjoint",
        primary_hashes.isdisjoint(rust_hashes) and primary_paths.isdisjoint(rust_paths),
        {"primary_paths": sorted(primary_paths), "independent_paths": sorted(rust_paths)},
    )
    builder = json.loads((ROOT / manifest["immutable_inputs"]["builder_algorithms"]["path"]).read_bytes())
    primary_expected_budgets = normalized_budget_table(builder, "primary_cpp_arb_lineage")
    rust_expected_budgets = normalized_budget_table(builder, "independent_pure_rust_lineage")
    primary_observed_budgets = source_budget_table(primary_source, "primary")
    rust_observed_budgets = source_budget_table(rust_source, "independent")
    record(
        "primary_budget_table_exact",
        primary_observed_budgets == primary_expected_budgets,
        {"expected_count": len(primary_expected_budgets), "observed_count": len(primary_observed_budgets)},
    )
    record(
        "independent_budget_table_exact",
        rust_observed_budgets == rust_expected_budgets,
        {"expected_count": len(rust_expected_budgets), "observed_count": len(rust_observed_budgets)},
    )
    record(
        "primary_P01_arithmetic_kernel_present",
        all(token in primary_source for token in (
            "precision_bits = 512", "projection_exponent = -448", "arf_get_fmpq",
            "fmpz_fdiv_qr", "fmpz_is_odd", "arb_sub(error_ball",
        )),
        "Arb/FLINT 512-bit ball operations, exact-midpoint ties-even projection and directed error ball",
    )
    record(
        "independent_R01_arithmetic_kernel_present",
        all(token in rust_source for token in (
            "const LIMBS: usize = 8", "const WIDE_LIMBS: usize = 16",
            "struct Ball512", "fn add(self", "fn sub(self", "fn mul(self",
            "fn div(self", "fn project_midpoint_2m448",
        )),
        "pure-Rust native 512-bit signed balls with 1024-bit products/division and ties-even projection",
    )

    rust_image = inspect_image(manifest["independent_rust_fixture"]["runtime"]["image"])
    rust_names = rootfs_names(manifest["independent_rust_fixture"]["runtime"]["image"])
    forbidden_runtime_members = [
        name for name in rust_names
        if name.endswith(".so") or "/lib" in f"/{name}" or name.startswith("lib/") or name.startswith("usr/lib/")
    ]
    record(
        "rust_scratch_single_layer",
        len(rust_image["RootFS"]["Layers"]) == manifest["independent_rust_fixture"]["runtime"]["rootfs_layer_count"],
        rust_image["RootFS"]["Layers"],
    )
    record("rust_rootfs_has_no_dynamic_libraries", not forbidden_runtime_members, forbidden_runtime_members)
    record(
        "runtime_images_disjoint",
        manifest["primary_cpp_fixture"]["runtime"]["image_id"]
        != manifest["independent_rust_fixture"]["runtime"]["image_id"],
        [
            manifest["primary_cpp_fixture"]["runtime"]["image_id"],
            manifest["independent_rust_fixture"]["runtime"]["image_id"],
        ],
    )

    if not roots_absent(manifest, "host_roots_absent_before"):
        raise RuntimeError("a forbidden host candidate root exists before fixture execution")

    for lane_name, lane in lanes:
        completed = run(canonical_fixture_argv(lane["runtime"]["image"]), 0)
        report = parse_report(completed)
        expected = lane["expected_report"]
        report_matches = all(report.get(key) == value for key, value in expected.items())
        report_matches = report_matches and report.get("seal_sha256") == manifest["immutable_inputs"]["definition_seal"]["raw_sha256"]
        record(f"{lane_name}_fixture_report", report_matches, report)
        if not roots_absent(manifest, f"host_roots_absent_after_{lane_name}_pass"):
            raise RuntimeError("fixture pass changed forbidden host root state")

        interface_argv = canonical_fixture_argv(lane["runtime"]["image"])
        interface_argv[-2:] = ["--candidate", "6/5"]
        interface = run(interface_argv, 64)
        record(
            f"{lane_name}_candidate_interface_absent",
            interface.stdout == b"" and b"candidate mode does not exist" in interface.stderr,
            {"exit": interface.returncode, "stderr": interface.stderr.decode("utf-8", "replace").strip()},
        )

        mutated_mount = f"{ROOT / MUTATED_SEAL_REL}:/work/{SEAL_REL.as_posix()}:ro"
        mutated = run(canonical_fixture_argv(lane["runtime"]["image"], [mutated_mount]), 65)
        record(
            f"{lane_name}_seal_corruption_rejected",
            mutated.stdout == b"" and (
                b"definition seal identity rejected" in mutated.stderr
                or b"seal" in mutated.stderr
            ),
            {"exit": mutated.returncode, "stderr": mutated.stderr.decode("utf-8", "replace").strip()},
        )
        if not roots_absent(manifest, f"host_roots_absent_after_{lane_name}_negative_tests"):
            raise RuntimeError("negative fixture changed forbidden host root state")

        with tempfile.TemporaryDirectory(prefix=f"nhm2-s4-{lane_name}-receipt-") as directory:
            output_directory = Path(directory)
            receipt_argv = canonical_receipt_argv(lane["runtime"]["image"], output_directory)
            receipt_completed = run(receipt_argv, 0)
            receipt_report = parse_report(receipt_completed)
            receipt_path = output_directory / manifest["canonical_runtime"]["receipt_filename"]
            receipt_bytes = receipt_path.read_bytes()
            receipt_valid, receipt_detail = audit_receipt_stream(
                receipt_bytes,
                "primary_fixture" if lane_name == "primary" else "independent_fixture",
            )
            expected_receipt = lane["expected_receipt_report"]
            report_valid = all(
                receipt_report.get(key) == value for key, value in expected_receipt.items()
            )
            expected_stream_hash = sha256_bytes(b"nhm2-g2h-e-s4/stream/v1\n" + receipt_bytes)
            report_valid = report_valid and receipt_report.get("stream_sha256") == expected_stream_hash
            record(f"{lane_name}_receipt_report", report_valid, receipt_report)
            record(f"{lane_name}_receipt_stream_replay", receipt_valid, receipt_detail)
            second = run(receipt_argv, manifest["canonical_runtime"]["exclusive_receipt_rejection_exit"])
            record(
                f"{lane_name}_receipt_no_overwrite",
                b"exclusive fixture receipt persistence rejected" in second.stderr
                and receipt_path.read_bytes() == receipt_bytes,
                {"exit": second.returncode, "sha256": sha256_bytes(receipt_path.read_bytes())},
            )
        if not roots_absent(manifest, f"host_roots_absent_after_{lane_name}_receipt"):
            raise RuntimeError("receipt fixture changed forbidden host root state")

    for lane_name, lane in lanes:
        corrupt = lane["root_corruption_fixture"]
        corrupt_binding = corrupt["dockerfile"]
        corrupt_bytes, corrupt_hash = file_identity(corrupt_binding["path"])
        record(
            f"{lane_name}_root_corruption_dockerfile_identity",
            corrupt_bytes == corrupt_binding["bytes"] and corrupt_hash == corrupt_binding["raw_sha256"],
            {"bytes": corrupt_bytes, "sha256": corrupt_hash},
        )
        corrupt_image = inspect_image(corrupt["image"])
        record(
            f"{lane_name}_root_corruption_image_identity",
            corrupt_image["Id"] == corrupt["image_id"],
            corrupt_image["Id"],
        )
        corrupt_run = run([
            "docker", "run", "--rm", "--network=none", "--read-only", "--cap-drop=ALL",
            "--security-opt", "no-new-privileges", corrupt["image"], "--fixture-suite", SEAL_REL.as_posix()
        ], corrupt["expected_exit"])
        record(
            f"{lane_name}_ephemeral_root_rejected",
            b"forbidden scientific root exists" in corrupt_run.stderr,
            {"exit": corrupt_run.returncode, "stderr": corrupt_run.stderr.decode("utf-8", "replace").strip()},
        )

    roots_absent(manifest, "host_roots_absent_after_all_fixtures")
    flags = manifest["closure_flags"]
    record(
        "scientific_and_authority_flags_locked",
        flags["full_primary_scientific_producer_implemented"] is False
        and flags["full_independent_scientific_producer_implemented"] is False
        and flags["scientific_builder_executed"] is False
        and flags["candidate_evaluated"] is False
        and flags["positive_parameter_samples"] == 0
        and flags["candidate_root_created"] is False
        and flags["authorization_token_issued"] is False
        and flags["execution_authorized"] is False
        and all(value is False for value in manifest["authority"].values()),
        {"closure_flags": flags, "authority": manifest["authority"]},
    )

    passed = sum(1 for item in checks if item["pass"])
    report = {
        "schema": "nhm2.g2h_e_s4.fixture_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "meaning": "PASS authenticates manufactured-fixture runtimes and fail-closed guards only; it is not a scientific proof-producer or candidate result",
        "manifest_raw_sha256": manifest_hash,
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_builder_executed": False,
        "execution_authorized": False,
        "authority_promoted": False,
        "disposition": "AUDIT_SCIENTIFIC_PRODUCER_IMPLEMENTATION_GAPS_BEFORE_S4_CLOSURE",
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    try:
        sys.exit(audit())
    except Exception as error:  # fail closed with a typed audit error
        print(
            json.dumps(
                {
                    "schema": "nhm2.g2h_e_s4.fixture_runtime_audit.v1",
                    "status": "ERROR",
                    "error": type(error).__name__,
                    "message": str(error),
                    "checks": checks,
                    "candidate_evaluations": 0,
                    "positive_parameter_samples": 0,
                    "candidate_roots_created": False,
                    "scientific_builder_executed": False,
                    "execution_authorized": False,
                    "authority_promoted": False,
                },
                sort_keys=True,
                separators=(",", ":"),
            )
        )
        sys.exit(2)
