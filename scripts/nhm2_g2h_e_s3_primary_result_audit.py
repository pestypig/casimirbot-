#!/usr/bin/env python3
"""Producer-independent, read-only audit of the sole G2H-E-S3 primary-v3 run."""

from __future__ import annotations

import hashlib
import json
import subprocess
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUN_ROOT = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v3"

EXPECTED_ROOT_HASHES = {
    "00-preflight.json": "c380d692c2d9cc8cd8159e11d352850653f40353123782be31eaa2abbdce9fd3",
    "01-surface-regularity.json": "696d7c92db103ad4f37e5c71daf3655ed2826147d7a86d5e12a6ff0ab5110597",
    "02-G2G-C01.json": "6090df17e50f5dac8092d650d6eb57ed2a292e00698fbcd22d7bb9150bcf20dd",
    "03-G2G-C02.json": "c33507a9b58c0c68dce01ff7ae63492b0570f9468daa01897c96582d68617309",
    "04-G2G-C03.json": "038d21f4754cdeaf20a8fe03b0921b7a9d341ba6af09f6ef526bc7e2ee0dfe8f",
    "05-G2G-C04.json": "905fb2aaa245eab2d5f66414070dfba9644f90c510b51f83acb3d40f83582b7a",
    "06-G2G-C05.json": "26ba4c9f47a361f5183b784a94c0b56fb0c3bc8b3793320a739384671fb764ad",
    "07-G2G-C06.json": "aa39aa5b72411684d9ec2fdc4d30ad89ff79716e36106f8391a10a18228233d5",
    "08-G2G-C07.json": "12d14f533c7272b1722c5f1c9db3e8185cb1177a03214d8ec823bc4285d4fcdc",
    "09-G2G-C08.json": "763f6b4ffec367d2c14f2375815c02ecdd6b4a6ac9f6867385d99ab7d4494cac",
    "10-G2G-C09.json": "337563d54cb5e5984a69d0964fb54206973dff390162b3170d74e9f8557affe4",
    "11-G2G-C10.json": "ec821c1938f5d0807acca38da4adde1380a995f39efea1405a75eb617ad23157",
    "12-G2G-C11.json": "7bd8430ff5f378f26939ffaa52d4ffcfd8fb88168aa5072647777385a1a1d58e",
    "13-G2G-C12.json": "a4d45225ce2537688802f9ff08842ce43bb970c6ec7bd2b1236193b0353a4687",
    "14-G2G-Q01.json": "a48d5e2f0ec5445e6a6310b97a56f3d8f378945115061500794d1029d7b75137",
    "15-G2G-Q02.json": "e89d42f56a98d03fead6f7b1097867170e41219a8be07d9ae843b570dbfab79e",
    "16-G2G-Q03.json": "095d0e385d3e498ec0ad5356753a8e749be9adf0efb4650186449c4e275897d5",
    "17-G2G-Q04.json": "ceb60e85bba75387c19414020c774f1922e323d7038df525c4910bac4af5d92f",
    "18-G2G-Q05.json": "21db20fb1a820bdb61f5fcc3bbbbfec41570aac7a29f5339a5bd5b242589930d",
    "19-G2G-Q06.json": "e76bde3208ab9ca9013e5b1a2a46b4babcdcb4086719a8a315342a8dbcf3b071",
    "proof-manifest.json": "b4eec02bdc166b10cfc0e795e7d3f1bb64b618356e07d1dfcf883e8cbe5edd98",
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    checks: list[tuple[str, bool]] = []
    add = lambda name, value: checks.append((name, bool(value)))
    proposal = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s-r1-primary-v3-proposal.v1.json"
    authorization = ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v3.txt"
    ledger = ROOT / "artifacts/research/nhm2/g2h-executions"
    add("proposal_identity", sha(proposal) == "af0a0394a16f58e7c7e4dff30a0f5e2fb97562baefc1c77f6a47d76499667384")
    add("authorization_identity", authorization.stat().st_size == 380 and sha(authorization) == "29543f4b8f6cc524bf62a8ac65d5da40f9ef9aa0752f3ddf977c7cff66465450")
    expected_ledger = {
        "g2h-e-primary-v3-invocation.json": "6d024cac22d2c81101671bd0ac9e1a6df2c02ec1baf5c7cef30ec8108325caf9",
        "g2h-e-primary-v3.stdout.log": "108d3861d6ceac396c88ae9068105aceca00134b05807676b48019daabf6493f",
        "g2h-e-primary-v3.stderr.log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "g2h-e-primary-v3-result.json": "3ff31ae1859cb2128576796cad5f26944a2ba26025bb4ca8249008fc8df585c5",
    }
    add("ledger_inventory", {p.name for p in ledger.glob("g2h-e-primary-v3*")} == set(expected_ledger))
    for name, expected in expected_ledger.items():
        add("ledger_" + name, sha(ledger / name) == expected)
    invocation = load(ledger / "g2h-e-primary-v3-invocation.json")
    result = load(ledger / "g2h-e-primary-v3-result.json")
    add("invocation_binding", invocation["authorization_sha256"] == sha(authorization) and invocation["retry_allowed"] is False)
    add("process_result", result == {"lane": "primary", "output_root_exists": True, "retry_allowed": False, "returncode": 1, "schema": "nhm2.g2h_e_successor.process_result.v3", "stderr_sha256": expected_ledger["g2h-e-primary-v3.stderr.log"], "stdout_sha256": expected_ledger["g2h-e-primary-v3.stdout.log"]})
    add("root_inventory", {p.name for p in RUN_ROOT.iterdir() if p.is_file()} == set(EXPECTED_ROOT_HASHES))
    add("root_no_links", all(p.is_file() and not p.is_symlink() for p in RUN_ROOT.iterdir()))
    for name, expected in EXPECTED_ROOT_HASHES.items():
        add("root_" + name, sha(RUN_ROOT / name) == expected)
    preflight = load(RUN_ROOT / "00-preflight.json")
    surface = load(RUN_ROOT / "01-surface-regularity.json")
    manifest = load(RUN_ROOT / "proof-manifest.json")
    add("preflight_pass", preflight["decision"] == "PASS" and preflight["candidate_evaluations"] == 0 and preflight["sources_verified"] == 7)
    value, first = Fraction(3, 5), Fraction(2, 5)
    reciprocal_second = lambda second: 2 * first * first / (value ** 3) - second / (value ** 2)
    interior, exterior = reciprocal_second(Fraction(26, 5)), reciprocal_second(Fraction(-4, 5))
    add("independent_exact_surface_replay", (str(interior), str(exterior)) == ("-350/27", "100/27"))
    add("surface_first_failure", surface["decision"] == "FAIL" and surface["typed_result"] == "GLOBAL_STATIC_STATE_FAIL" and surface["coefficient"] == "B" and surface["first_disjoint_order"] == 2 and surface["interior_exact"] == str(interior) and surface["exterior_exact"] == str(exterior))
    ordered = [name for name in EXPECTED_ROOT_HASHES if name not in ("proof-manifest.json",)]
    previous = "0" * 64
    for sequence, name in enumerate(ordered):
        record = load(RUN_ROOT / name)
        add(f"chain_{sequence}", record["sequence"] == sequence and record["previous_record_sha256"] == previous)
        previous = EXPECTED_ROOT_HASHES[name]
        if sequence >= 2:
            authority = record["authority"]
            add(f"downstream_ineligible_{sequence}", record["decision"] == "INELIGIBLE_AFTER_FIRST_FAIL" and record["typed_failure"] == "GLOBAL_STATIC_STATE_FAIL" and record["candidate_evaluations"] == 1 and not any(authority.values()))
    add("manifest_fail", manifest["decision"] == "FAIL" and manifest["first_failure"] == "GLOBAL_STATIC_STATE_FAIL" and manifest["candidate_evaluations"] == 1 and manifest["candidate_admitted"] is False and manifest["classical_proof_established"] is False)
    add("stdout_manifest_binding", (ledger / "g2h-e-primary-v3.stdout.log").read_text(encoding="ascii") == EXPECTED_ROOT_HASHES["proof-manifest.json"] + "\n")
    container = subprocess.run(["docker", "container", "inspect", "nhm2-g2h-e-primary-v3", "--format", "{{.Id}} {{.State.Status}} {{.State.ExitCode}} {{.State.OOMKilled}} {{.Image}}"], text=True, capture_output=True, check=False)
    add("retained_container", container.returncode == 0 and container.stdout.strip() == "f972b7d44f35cc0a28b36eb1a3fdbfc98a9e533d3aa9de491c544f6a5ff2625e exited 1 false sha256:5a790295492d607fc9c3ede7a527a86922e09608cce1eaa9af464d33a1617ada")
    add("independent_untouched", not (ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt").exists() and not (ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1").exists() and not any(ledger.glob("g2h-e-independent*")))
    failed = [name for name, passed in checks if not passed]
    print(json.dumps({"schema": "nhm2.g2h_e_s3.primary_result_audit.v1", "passed": len(checks) - len(failed), "total": len(checks), "failures": failed}, sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
