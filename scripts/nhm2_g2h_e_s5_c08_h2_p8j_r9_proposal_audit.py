#!/usr/bin/env python3
"""Audit the frozen P8J-R9 atomic command-transport proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r9-atomic-command-transport-successor-proposal.md"
R8_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r8-cloud-preexecution-result.md"
ORCHESTRATOR = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8j_r9_cloudshell_orchestrator_v1.sh"
LEDGER = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r9-atomic-transport-preflight-v1-20260831/h2-p8j-r9-staging-command-ledger.v1.json"
COMMANDS = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r9-atomic-transport-preflight-v1-20260831/h2-p8j-r9-staging-commands.v1.txt"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r9-atomic-transport-preflight-v1-20260831/h2-p8j-r9-proposal-audit.v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


proposal = PROPOSAL.read_text(encoding="utf-8")
orchestrator = ORCHESTRATOR.read_text(encoding="utf-8")
ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
commands = ledger["commands"]

checks = {
    "proposal_identity": PROPOSAL.stat().st_size == 7556 and sha256(PROPOSAL) == "f652f5afb8b62c9032650d0f0539530b185036bfd6f4e48868765b26be41509a",
    "r8_result_identity": R8_RESULT.stat().st_size == 3338 and sha256(R8_RESULT) == "28f6669382953f501b63238c9ef45e69e1c6f40301b78d636da5e1b0879abc43",
    "orchestrator_identity": ORCHESTRATOR.stat().st_size == 7132 and sha256(ORCHESTRATOR) == "7007992e2538f7ecb981a4b0d588bb1cba0e7abafa22cdab63c35c266bc8e379",
    "ledger_identity": sha256(LEDGER) == "4c94a957d056ee32806b7d6b6ffc90118ca9d7578dd6ef9f877e3f54356a8d54",
    "commands_identity": sha256(COMMANDS) == "d89489c1543348d9aea2873c6b8643e996be489745fe46f9e6d3008b3f749422",
    "definition_audit": ledger["definition_audit"]["status"] == "PASS" and ledger["definition_audit"]["checks_passed"] == 27 and ledger["definition_audit"]["checks_total"] == 27,
    "command_count": len(commands) == 33,
    "chunk_count": ledger["chunk_count"] == 30,
    "source_identity_bound": ledger["source_bytes"] == 7132 and ledger["source_sha256"] == sha256(ORCHESTRATOR),
    "base64_identity_bound": ledger["base64_characters"] == 9512 and ledger["base64_sha256"] == "9f8f00f03a8a0761e9f1c830818bb7065a779dbd083e254ad42e4f2459d3b500",
    "proposal_required_header": all(label in proposal for label in ("Program gate:", "Workstream:", "Capability or component:", "Current maturity:", "Target maturity:", "Required frozen inputs:", "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:", "Downstream gate unlocked:")),
    "atomic_dom_admission": "textbox DOM value" in proposal and "byte-for-byte equality" in proposal,
    "no_incremental_typing": "Do not use incremental typing" in proposal,
    "ordered_markers": all(f"R9_CHUNK_{index:02d}" in commands[index]["command"] for index in range(1, 31)),
    "stage_complete": "R9_STAGE_COMPLETE" in commands[-2]["command"],
    "single_invocation": commands[-1]["command"].count("bash /home/pestypig/h2-p8j-r9-cloudshell-orchestrator.v1.sh") == 1,
    "single_bulk_request": orchestrator.count("gcloud compute instances bulk create") == 1,
    "single_scp": orchestrator.count("gcloud compute scp") == 1,
    "single_ssh": orchestrator.count("gcloud compute ssh") == 1,
    "r9_name": "nhm2-h2-p8j-r9-c2d-32-20260831" in orchestrator,
    "machine_storage": "--machine-type=c2d-standard-32" in orchestrator and "--boot-disk-type=pd-standard" in orchestrator,
    "one_vm": "--count=1" in orchestrator and "--min-count=1" in orchestrator,
    "archive_hashes": all(value in orchestrator for value in ("fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978", "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")),
    "manifest_exact": '"$(wc -l <"$MANIFEST")" == 17' in orchestrator,
    "controller_exact": "4b8f5722c885980bb0fbac3602ecf36436a66ff1141e4776168f3bbef86276e6" in orchestrator,
    "failure_stop": "gcloud compute instances stop" in orchestrator,
    "cost_ceiling": "`$40.00`" in proposal and "90,000 seconds" in proposal,
    "authority_locked": "All such authority remains false" in proposal,
    "no_execution_claim": "No R9 command has been entered" in proposal,
}

passed = sum(checks.values())
total = len(checks)
payload = {
    "schema": "nhm2.g2h_e_s5.c08.h2_p8j_r9.atomic_transport_proposal_audit.v1",
    "status": "PASS" if passed == total else "FAIL",
    "checks_passed": passed,
    "checks_total": total,
    "checks": checks,
    "proposal_sha256": sha256(PROPOSAL),
    "orchestrator_sha256": sha256(ORCHESTRATOR),
    "ledger_sha256": sha256(LEDGER),
    "commands_sha256": sha256(COMMANDS),
}
OUT.write_text(json.dumps(payload, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"{passed}/{total} {payload['status']}")
raise SystemExit(0 if passed == total else 1)
