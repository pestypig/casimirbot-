#!/usr/bin/env python3
"""Producer-independent audit of the immutable G2H-E primary partial result."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-primary-result.v1.json"
SIDECAR = RESULT.with_suffix(".sha256")
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-execution-proposal.v1.json"
CHECKPOINT = ROOT / "scripts/nhm2_g2h_e_checkpoint.py"
PROOF_SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_proof.c"
AUTHORIZATION = ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt"
LEDGER = ROOT / "artifacts/research/nhm2/g2h-executions"
PRIMARY_ROOT = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1"
INDEPENDENT_ROOT = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1"
INDEPENDENT_AUTHORIZATION = (
    ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt"
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect_container(name: str) -> dict[str, object]:
    values = json.loads(
        subprocess.check_output(
            ["docker", "container", "inspect", name], text=True, encoding="utf-8"
        )
    )
    if len(values) != 1:
        raise RuntimeError("fixed container inspection was not singleton")
    return values[0]


def procfs_nofollow_diagnostic(image: str) -> dict[str, object]:
    code = (
        "import errno,json,os;"
        "p='/proc/self/exe';"
        "o={'path':p,'is_symlink':os.path.islink(p),'readlink':os.readlink(p)};"
        "\ntry: os.close(os.open(p,os.O_RDONLY|os.O_NOFOLLOW));o['open_result']='UNEXPECTED_PASS'"
        "\nexcept OSError as e:o.update(open_result='FAIL',errno=e.errno,errno_name=errno.errorcode.get(e.errno),message=e.strerror)"
        "\nprint(json.dumps(o,sort_keys=True,separators=(',',':')))"
    )
    output = subprocess.check_output(
        [
            "docker",
            "run",
            "--rm",
            "--network",
            "none",
            "--read-only",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--entrypoint",
            "python",
            image,
            "-c",
            code,
        ],
        text=True,
        encoding="utf-8",
    )
    return json.loads(output)


def main() -> int:
    result = json.loads(RESULT.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    invocation_path = LEDGER / "g2h-e-primary-v1-invocation.json"
    process_path = LEDGER / "g2h-e-primary-v1-result.json"
    stdout_path = LEDGER / "g2h-e-primary-v1.stdout.log"
    stderr_path = LEDGER / "g2h-e-primary-v1.stderr.log"
    invocation = json.loads(invocation_path.read_text(encoding="utf-8"))
    process = json.loads(process_path.read_text(encoding="utf-8"))
    container = inspect_container(result["runtime"]["container_name"])
    diagnostic = procfs_nofollow_diagnostic(result["runtime"]["image"])
    proof_source = PROOF_SOURCE.read_text(encoding="utf-8")
    ledger_expected = {
        entry["name"]: (entry["bytes"], entry["sha256"])
        for entry in result["immutable_ledger"]["files"]
    }
    ledger_actual = {path.name for path in LEDGER.iterdir() if path.is_file()}
    authorization_lines = AUTHORIZATION.read_text(encoding="ascii").splitlines()
    expected_authorization = [
        "schema=nhm2.g2h_execution_authorization.v1",
        "decision=AUTHORIZED",
        "lane=primary",
        f"token_sha256={proposal['token_sha256']}",
        f"contract_sha256={proposal['contract_sha256']}",
        "executable_sha256=3345e4511b017e6ad54960903d96a8af6cd605312052412302a4286420c47128",
        "output_root=artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
    ]
    expected_command = [
        "--candidate",
        "--contract",
        "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json",
        "--sources",
        ".cal/nhm2-g2h/sources-v1",
        "--output-root",
        "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
        "--authorization",
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt",
        "--token",
        proposal["token"],
    ]
    mounts = container["Mounts"]
    mount_destinations = {mount["Destination"]: mount for mount in mounts}
    host = container["HostConfig"]
    state = container["State"]
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
    call_fragment = 'primary_hash_file("/proc/self/exe", self_hash, &self_bytes)'
    open_fragment = "open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW)"
    checks = {
        "result_sidecar_exact": SIDECAR.read_text(encoding="ascii").strip().split()
        == [sha256(RESULT), RESULT.name],
        "proposal_and_checkpoint_exact": sha256(PROPOSAL) == result["proposal_sha256"]
        and sha256(CHECKPOINT) == result["checkpoint_sha256"],
        "authorization_exact": AUTHORIZATION.stat().st_size
        == result["authorization"]["bytes"]
        and sha256(AUTHORIZATION) == result["authorization"]["sha256"]
        and authorization_lines == expected_authorization,
        "ledger_inventory_and_hashes_exact": ledger_actual == set(ledger_expected)
        and all(
            (LEDGER / name).stat().st_size == expected[0]
            and sha256(LEDGER / name) == expected[1]
            for name, expected in ledger_expected.items()
        ),
        "invocation_binding_exact": invocation["schema"] == "nhm2.g2h_e.invocation.v1"
        and invocation["authorization_sha256"] == result["authorization"]["sha256"]
        and invocation["binding_sha256"]
        == "37738d325eb2e0eabe9ac9c34ecd65726071ae213c9fe3dd12f61f86b720362a"
        and invocation["image_id"] == result["runtime"]["image_id"]
        and invocation["token_sha256"] == proposal["token_sha256"]
        and invocation["retry_allowed"] is False,
        "process_result_exact": process
        == {
            "lane": "primary",
            "output_root_exists": False,
            "retry_allowed": False,
            "returncode": 66,
            "schema": "nhm2.g2h_e.process_result.v1",
            "stderr_sha256": result["immutable_ledger"]["files"][2]["sha256"],
            "stdout_sha256": result["immutable_ledger"]["files"][3]["sha256"],
        },
        "logs_exact": stdout_path.read_bytes() == b""
        and stderr_path.read_bytes()
        == b"digest, source, runtime or authorization preflight rejected\n",
        "retained_container_exact": container["Id"] == result["runtime"]["container_id"]
        and container["Image"] == result["runtime"]["image_id"]
        and state["Status"] == "exited"
        and state["ExitCode"] == 66
        and state["OOMKilled"] is False
        and state["Error"] == ""
        and container["Config"]["Cmd"] == expected_command,
        "runtime_bounds_exact": host["NetworkMode"] == "none"
        and host["ReadonlyRootfs"] is True
        and host["CapDrop"] == ["ALL"]
        and host["PidsLimit"] == 64
        and host["Memory"] == 2147483648
        and host["RestartPolicy"] == {"Name": "no", "MaximumRetryCount": 0},
        "mount_authority_exact": set(mount_destinations)
        == {
            "/work/docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json",
            "/work/.cal/nhm2-g2h/sources-v1",
            "/work/artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt",
            "/work/artifacts/research/nhm2/g2h",
        }
        and mount_destinations[
            "/work/artifacts/research/nhm2/g2h"
        ]["RW"]
        is True
        and all(
            mount["RW"] is False
            for destination, mount in mount_destinations.items()
            if destination != "/work/artifacts/research/nhm2/g2h"
        ),
        "source_first_failure_causal": sha256(PROOF_SOURCE)
        == result["first_failure"]["proof_source_sha256"]
        and call_fragment in proof_source
        and open_fragment in proof_source
        and proof_source.index(call_fragment)
        < proof_source.index("|| self_bytes == 0", proof_source.index(call_fragment))
        < proof_source.index("|| !primary_verify_inputs", proof_source.index(call_fragment))
        < proof_source.index("|| !primary_verify_authorization", proof_source.index(call_fragment)),
        "exact_runtime_procfs_failure": diagnostic["path"] == "/proc/self/exe"
        and diagnostic["is_symlink"] is True
        and diagnostic["open_result"] == "FAIL"
        and diagnostic["errno"] == 40
        and diagnostic["errno_name"] == "ELOOP",
        "no_mathematical_evidence_root": not PRIMARY_ROOT.exists()
        and not (PRIMARY_ROOT / "proof-manifest.json").exists()
        and result["candidate_evaluations"] == 0
        and result["mathematical_decision"] is None,
        "independent_lane_unauthorized_and_absent": not INDEPENDENT_AUTHORIZATION.exists()
        and not INDEPENDENT_ROOT.exists()
        and result["independent_execution_authorized"] is False
        and result["independent_execution_performed"] is False,
        "all_downstream_authority_locked": all(result[key] is False for key in authority_keys),
        "same_proposal_retry_forbidden": invocation_path.exists()
        and result["primary_candidate_path_invocations"] == 1
        and result["immutable_ledger"]["retry_allowed"] is False
        and container["Name"] == "/nhm2-g2h-e-primary-v1",
    }
    print(
        json.dumps(
            {
                "schema": "nhm2.g2h_e.primary_partial_audit.v1",
                "decision": result["decision"] if all(checks.values()) else "FAIL",
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
