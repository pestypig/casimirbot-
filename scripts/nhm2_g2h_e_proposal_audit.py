#!/usr/bin/env python3
"""Audit that the frozen G2H-E proposal is exact and remains inert."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-execution-proposal.v1.json"
SIDECAR = PROPOSAL.with_suffix(".sha256")
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-execution-proposal.md"
TOKEN = "797cafb72170c8b441cc75b3ec74bb118fed24d3a2e628194d0280bb54a59ac7"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def container_absent(name: str) -> bool:
    result = subprocess.run(
        ["docker", "container", "inspect", name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode != 0


def sidecar_exact() -> bool:
    fields = SIDECAR.read_text(encoding="ascii").strip().split()
    return len(fields) == 2 and fields[0] == sha256(PROPOSAL) and fields[1] == PROPOSAL.name


def main() -> int:
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    checkpoint = ROOT / proposal["checkpoint"]
    packet = PACKET.read_text(encoding="utf-8")
    primary = proposal["primary"]
    independent = proposal["independent"]
    expected_prefix = ["python", "scripts/nhm2_g2h_e_checkpoint.py", "--lane"]
    authority_keys = (
        "candidate_admitted",
        "classical_proof_established",
        "geometry_state_accepted",
        "lane_execution_authorized",
        "diagnostic_lamp",
        "physical_viability",
        "propulsion_authority",
        "transport_authority",
    )
    ledger = ROOT / "artifacts/research/nhm2/g2h-executions"
    checks = {
        "proposal_sidecar_exact": sidecar_exact(),
        "proposal_pending_and_inert": proposal["decision"]
        == "PENDING_SEPARATE_EXPLICIT_USER_AUTHORIZATION"
        and proposal["proposal_only"] is True
        and proposal["execution_authorized"] is False,
        "checkpoint_exact": checkpoint.stat().st_size == proposal["checkpoint_bytes"]
        and sha256(checkpoint) == proposal["checkpoint_sha256"],
        "token_exact_but_non_authoritative": proposal["token"] == TOKEN
        and hashlib.sha256(TOKEN.encode("ascii")).hexdigest() == proposal["token_sha256"]
        and proposal["token_alone_authorizes_nothing"] is True,
        "commands_exact": primary["command"]
        == expected_prefix + ["primary", "--token", TOKEN, "--execute"]
        and independent["command"]
        == expected_prefix + ["independent", "--token", TOKEN, "--execute"],
        "authorization_records_absent": all(
            not (ROOT / lane["authorization_record"]).exists()
            for lane in (primary, independent)
        ),
        "candidate_roots_absent": all(
            not (ROOT / lane["output_root"]).exists() for lane in (primary, independent)
        ),
        "fixed_containers_absent": all(
            container_absent(lane["fixed_container_name"])
            for lane in (primary, independent)
        ),
        "execution_ledger_absent": not ledger.exists(),
        "zero_candidate_evaluations": proposal["candidate_evaluations"] == 0,
        "all_authority_locked": all(proposal[key] is False for key in authority_keys),
        "packet_contract_header_complete": all(
            packet.startswith("Program gate:") if key == "Program gate:" else f"\n{key}" in packet
            for key in (
                "Program gate:",
                "Workstream:",
                "Capability or component:",
                "Current maturity:",
                "Target maturity:",
                "Required frozen inputs:",
                "Required evidence:",
                "Stop/fail criteria:",
                "Explicit non-goals:",
                "Downstream gate unlocked:",
            )
        ),
        "packet_binds_proposal_and_checkpoint": sha256(PROPOSAL) in packet
        and proposal["checkpoint_sha256"] in packet,
        "no_authority_language": "does not authorize or execute" in packet
        and "All admission, geometry/state, lane," in packet,
    }
    print(
        json.dumps(
            {
                "schema": "nhm2.g2h_e.proposal_audit.v1",
                "passed": sum(checks.values()),
                "total": len(checks),
                "checks": checks,
            },
            sort_keys=True,
        )
    )
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
