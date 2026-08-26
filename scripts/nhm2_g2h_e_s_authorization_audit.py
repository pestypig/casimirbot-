#!/usr/bin/env python3
"""Candidate-neutral G2H-E-S authorization and chronology audit."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CHECKPOINT_PATH = ROOT / "scripts/nhm2_g2h_e_r1_successor_checkpoint.py"
PROPOSAL_PATH = ROOT / (
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-r1-"
    "successor-proposal.v1.json"
)
PROPOSAL_SHA256 = "65093d0084a513b101172e339123ecb2839cd76ef4350c6a351acdf054dbcfdd"
TOKEN = "ec667713a193b0b70e79d851f279e53ab945ccdfc749135fbe5ee1b098f3dd09"
TOKEN_SHA256 = "d54ee55da5967062bfbc080bcfb3d962b07ed69b08e4316b3973aa5b24d2ff4b"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_checkpoint():
    spec = importlib.util.spec_from_file_location("nhm2_g2h_e_s_checkpoint", CHECKPOINT_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("checkpoint module unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def rejected(callable_object) -> bool:
    try:
        callable_object()
    except RuntimeError:
        return True
    return False


def authorization_parser_checks(checkpoint, expected: list[str]) -> list[tuple[str, bool]]:
    checks: list[tuple[str, bool]] = []
    with tempfile.TemporaryDirectory(prefix="nhm2-g2h-e-s-auth-") as temporary:
        parent = Path(temporary)
        exact = parent / "exact.txt"
        exact.write_text("\n".join(expected) + "\n", encoding="ascii")
        checkpoint.parse_authorization(exact, "primary", None)
        checks.append(("exact_seven_line_authorization_admitted", True))

        for index, name in enumerate((
            "schema", "decision", "lane", "token", "contract", "executable", "root"
        )):
            mutated = list(expected)
            mutated[index] = mutated[index] + "0"
            path = parent / f"mutated-{index}.txt"
            path.write_text("\n".join(mutated) + "\n", encoding="ascii")
            checks.append((f"mutation_{name}_rejected",
                           rejected(lambda path=path: checkpoint.parse_authorization(
                               path, "primary", None))))

        extra = parent / "extra-line.txt"
        extra.write_text("\n".join(expected + ["extra=forbidden"]) + "\n", encoding="ascii")
        checks.append(("extra_line_rejected",
                       rejected(lambda: checkpoint.parse_authorization(extra, "primary", None))))

        oversized = parent / "oversized.txt"
        oversized.write_bytes(b"x" * 4097)
        checks.append(("oversized_authorization_rejected",
                       rejected(lambda: checkpoint.parse_authorization(
                           oversized, "primary", None))))
    return checks


def chronology_case(checkpoint, collision: str | None) -> bool:
    original_root = checkpoint.ROOT
    try:
        with tempfile.TemporaryDirectory(prefix="nhm2-g2h-e-s-chronology-") as temporary:
            checkpoint.ROOT = Path(temporary)
            if collision is not None:
                path = checkpoint.ROOT / collision
                path.mkdir(parents=True)
            if collision is None:
                return checkpoint.verify_chronology("primary") is None
            return rejected(lambda: checkpoint.verify_chronology("primary"))
    finally:
        checkpoint.ROOT = original_root


def main() -> int:
    checkpoint = load_checkpoint()
    proposal = json.loads(PROPOSAL_PATH.read_text(encoding="utf-8"))
    checks: list[tuple[str, bool]] = []
    checks.append(("proposal_identity", sha256(PROPOSAL_PATH) == PROPOSAL_SHA256))
    checks.append(("token_digest",
                   hashlib.sha256(TOKEN.encode("ascii")).hexdigest() == TOKEN_SHA256
                   == proposal["token_sha256"]))
    expected = proposal["authorization_template_lines"]
    checks.append(("authorization_inventory_exactly_seven", len(expected) == 7))
    checks.extend(authorization_parser_checks(checkpoint, expected))

    checks.append(("fresh_chronology_admitted_without_creation",
                   chronology_case(checkpoint, None)))
    for name, path in (
        ("future_primary_collision_rejected", "artifacts/research/nhm2/g2h/tolman-vii-primary-v2"),
        ("exhausted_primary_collision_rejected", "artifacts/research/nhm2/g2h/tolman-vii-primary-v1"),
        ("independent_collision_rejected", "artifacts/research/nhm2/g2h/tolman-vii-independent-v1"),
    ):
        checks.append((name, chronology_case(checkpoint, path)))

    checks.append(("checkpoint_primary_only",
                   rejected(lambda: checkpoint.execute_once("independent", TOKEN))))
    checks.append(("proposal_first_output_terminal",
                   proposal["retry_allowed"] is False
                   and proposal["no_retune"] is True
                   and "exhausts this proposal" in proposal["stop_rule"]))
    checks.append(("proposal_authority_false",
                   proposal["authority"]["candidate_execution_authorized"] is False
                   and proposal["authority"]["independent_execution_authorized"] is False
                   and proposal["authority"]["candidate_evaluations"] == 0))

    real_absent = [
        proposal["future_authorization_path"],
        proposal["future_output_root"],
        proposal["future_execution_ledger_prefix"] + "-invocation.json",
        proposal["future_execution_ledger_prefix"] + "-result.json",
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt",
        "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
    ]
    checks.append(("real_future_and_independent_evidence_absent",
                   all(not (ROOT / path).exists() for path in real_absent)))
    container = subprocess.run(
        ["docker", "container", "inspect", proposal["future_container"]],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
    )
    checks.append(("future_container_absent", container.returncode != 0))

    for name, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    passed_count = sum(passed for _, passed in checks)
    print(f"SUMMARY {passed_count}/{len(checks)}")
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
