#!/usr/bin/env python3
"""Audit the frozen P8P-R38 cmd-metacharacter-free controller proposal."""
from __future__ import annotations
import hashlib, json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r38-no-cmd-metachar-controller-proposal.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r38_no_cmd_metachar_controller_v1.ps1"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r38-no-cmd-metachar-proposal-v1-20260904/h2-p8p-r38-proposal-audit.v1.json"
def sha256(path: Path) -> str: return hashlib.sha256(path.read_bytes()).hexdigest()
def main() -> int:
    text=PROPOSAL.read_text(encoding="utf-8"); controller=CONTROLLER.read_text(encoding="utf-8")
    remote=[line for line in controller.splitlines() if line.startswith("$guard = ") or line.startswith("$handoff = ")]
    checks={
        "header":text.startswith("Program gate:") and text.splitlines()[9].startswith("Downstream gate unlocked:"),"inert":"FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED" in text,"r37_bound":"R37 proved that the Windows transport intercepted" in text,
        "controller_bytes":CONTROLLER.stat().st_size==7946,"controller_hash":sha256(CONTROLLER)=="e1414f3966f05d3dc2825f571007f35ff0f4414cfc7d11cc1593282f01f15fc7","two_remote_lines":len(remote)==2,"no_cmd_metacharacters":all(not any(ch in line for ch in "|&<>") for line in remote),"runtime_rejection":"remote command contains forbidden cmd metacharacter" in controller,
        "one_start":controller.count("'compute','instances','start'")==1,"two_role_ssh":controller.count("'compute','ssh'")==2,"one_scp":controller.count("'compute','scp'")==1,"one_stop":controller.count("'compute','instances','stop'")==1,
        "archive_identity":"236,640,768 bytes" in text and "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" in text,"vm_identity":"1893159507643031574" in text and "us-east1-b" in text,"fixture_identity":"97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79" in text,"wrapper_identity":"f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19" in text,
        "ceilings":"3,600-second aggregate restart ceiling" in text and "`$1.00` total ceiling" in text,"first_failure":"First failure is terminal" in text,"no_numerical":"R38 permits no numerical execution" in text,"p8q_stopped":"P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED" in text,"authority_false":"authority\nremains false" in text}
    failed=[k for k,v in checks.items() if not v]
    payload={"schema":"nhm2.g2h_e_s5.c08_h2_p8p_r38_proposal_audit.v1","status":"PASS" if not failed else "FAIL","checks_passed":sum(checks.values()),"checks_total":len(checks),"checks":checks,"failed":failed,"proposal_sha256":sha256(PROPOSAL),"controller_sha256":sha256(CONTROLLER),"cloud_actions":0,"numerical_runs":0,"candidate_evaluated":False,"authority_promoted":False}
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(payload,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}"); print(sha256(OUT)); print(payload["proposal_sha256"])
    return 0 if not failed else 1
if __name__ == "__main__": raise SystemExit(main())
