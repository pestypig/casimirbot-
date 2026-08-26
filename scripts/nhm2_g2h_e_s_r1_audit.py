#!/usr/bin/env python3
"""Read-only audit of the G2H-E-S-R1 primary-v3 preexecution packet."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def digest(relative: str) -> str:
    return hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()


def docker(*arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["docker", *arguments], text=True, capture_output=True, check=False)


def main() -> int:
    checks: list[tuple[str, bool]] = []
    add = lambda name, value: checks.append((name, bool(value)))
    proposal_path = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s-r1-primary-v3-proposal.v1.json"
    binding_path = "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s-r1-build-binding.v1.json"
    checkpoint_path = "scripts/nhm2_g2h_e_s_r1_primary_v3_checkpoint.py"
    proposal = json.loads((ROOT / proposal_path).read_text(encoding="utf-8"))
    binding = json.loads((ROOT / binding_path).read_text(encoding="utf-8"))
    add("proposal_hash", digest(proposal_path) == "af0a0394a16f58e7c7e4dff30a0f5e2fb97562baefc1c77f6a47d76499667384")
    add("binding_hash", digest(binding_path) == "5c9546b1bcb1a41a9f785b41969da14e789b00e0d177b58b0a89b0ad7a3cc164")
    add("checkpoint_hash", digest(checkpoint_path) == "c7266e346f7c1cf1afb38437fd723b3f9b3db7f17e05ed954c615df0e2560532")
    add("v2_source_immutable", digest("tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_proof_v2.c") == "2d20513005834ca87885a30ab65a1b4b3c1d835904d3247dc6cebc71e4e59740")
    add("v3_source_bound", digest(binding["source"]["path"]) == binding["source"]["sha256"])
    add("dockerfile_bound", digest(binding["dockerfile"]["path"]) == binding["dockerfile"]["sha256"])
    immutable = {
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt": "348dc0f0f7bedf1e825b83218f55f3a20cdf3507b1b04189a8db8618778e87f3",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-invocation.json": "0640623244279e787b74b85980fa7d52a038f4312f006eb7100116849aaeb5c8",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-result.json": "44ab716de6b2657d549cc6589241fab7a728af3c5baf2e25c184911348913b0f",
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v2.txt": "452537efaf5ae64260122fac63cc8817b3babb4eb15668dfe8dc92bcbb16cc10",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-invocation.json": "2b6e57dc5a9586f16737f6dc2d190d2d8f22f92ac09328e989112e035aaccdd2",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-result.json": "0d3987694b1b47d5eb92cee644bff9458ec80185a819f8764f6de94b7bcb79c9",
    }
    for path, expected in immutable.items():
        add("immutable_" + Path(path).name, digest(path) == expected)
    for version in ("v1", "v2"):
        add(f"stderr_{version}", digest(f"artifacts/research/nhm2/g2h-executions/g2h-e-primary-{version}.stderr.log") == "8a51fa06ab6ee3ab86f7d081f8dc62c95d81c17c86ce12b8ae05cf8519be2643")
        add(f"stdout_{version}", digest(f"artifacts/research/nhm2/g2h-executions/g2h-e-primary-{version}.stdout.log") == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
    for name, expected_id in (("nhm2-g2h-e-primary-v1", "ed7ed5fd641507c5457d83943489e0cc2c521a723509a76bcc1fd4668b00270c"), ("nhm2-g2h-e-primary-v2", "6ffbd649062affbfdc231cd3ae4fb5965d4f87b56bf06eb9596270ce07a9644b")):
        result = docker("container", "inspect", name, "--format", "{{.Id}} {{.State.ExitCode}} {{.State.OOMKilled}}")
        add(name + "_retained", result.returncode == 0 and result.stdout.strip() == f"{expected_id} 66 false")
    for root in ("tolman-vii-primary-v1", "tolman-vii-primary-v2", "tolman-vii-primary-v3", "tolman-vii-independent-v1"):
        add(root + "_absent", not (ROOT / "artifacts/research/nhm2/g2h" / root).exists())
    add("v3_authorization_absent", not (ROOT / proposal["future_authorization_path"]).exists())
    add("v3_ledger_absent", not any((ROOT / "artifacts/research/nhm2/g2h-executions").glob("g2h-e-primary-v3*")))
    add("v3_container_absent", docker("container", "inspect", proposal["future_container"]).returncode != 0)
    image = docker("image", "inspect", "nhm2-g2h-primary-proof:v3", "--format", "{{.Id}}")
    add("v3_image", image.returncode == 0 and image.stdout.strip() == proposal["primary_image_id"])
    executable = docker("run", "--rm", "--network", "none", "--read-only", "--entrypoint", "sha256sum", "nhm2-g2h-primary-proof:v3", "/usr/local/bin/tolman-vii-primary-proof-v3")
    add("v3_executable", executable.returncode == 0 and executable.stdout.split()[0] == proposal["primary_executable_sha256"])
    fixture = docker("run", "--rm", "--network", "none", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=1m", "--workdir", "/tmp", "nhm2-g2h-primary-authorization-schema-fixture:v2")
    expected_fixture = {"candidate_entrypoint_invocations": 0, "cases_passed": 10, "exact_v2_admitted": True, "v1_and_mutations_rejected": True}
    add("actual_linux_c_fixture", fixture.returncode == 0 and json.loads(fixture.stdout) == expected_fixture)
    checkpoint = (ROOT / checkpoint_path).read_text(encoding="utf-8")
    add("c_python_schema_agreement", proposal["authorization_template_lines"][0].endswith(".v2") and '"nhm2.g2h_execution_authorization.v2"' in checkpoint)
    add("authority_locked", all(value is False or value == 0 for value in proposal["authority"].values()))
    add("primary_only", proposal["independent_lane"]["execution_authorized"] is False)
    failed = [name for name, passed in checks if not passed]
    print(json.dumps({"schema": "nhm2.g2h_e_s_r1.audit.v1", "passed": len(checks) - len(failed), "total": len(checks), "failures": failed}, sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
