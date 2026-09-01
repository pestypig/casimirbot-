#!/usr/bin/env python3
"""Static independent audit of the P8J-R6 C2D stockout result."""
from __future__ import annotations
import hashlib, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r6-c2d-quota-compatible-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8j-r6-cloud-preexecution-result.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-cloud-preflight-v1-20260831/h2-p8j-r2-overlay-upload-v1.tar"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8j-r6-result-v1-20260831/h2-p8j-r6-result-audit.v1.json"

def digest(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""): h.update(chunk)
    return h.hexdigest()

def main() -> int:
    checks: dict[str, bool] = {}
    def exact(name: str, path: pathlib.Path, size: int, sha: str) -> None:
        checks[name+"_regular"] = path.is_file() and not path.is_symlink()
        checks[name+"_bytes"] = checks[name+"_regular"] and path.stat().st_size == size
        checks[name+"_sha256"] = checks[name+"_regular"] and digest(path) == sha
    exact("proposal", PROPOSAL, 6628, "f0a2aab6e81ca29d39f58fc5b79f51a5324ceca629571f1353d5e2501962d878")
    exact("result", RESULT, 4049, "2cf0ef29ee9fe17e8a6c39fea5055d66a5b52a31fe4a35317c740a4f127f7b68")
    exact("base", BASE, 236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978")
    exact("overlay", OVERLAY, 225792, "3d49deb1c4044232e2cdd83da6192f2baca26bbc9773b58bbdca85e6109c19a7")
    text = RESULT.read_text(encoding="utf-8")
    checks["metadata_complete"] = all(f+":" in text for f in ("Program gate","Workstream","Capability or component","Current maturity","Target maturity","Required frozen inputs","Required evidence","Stop/fail criteria","Explicit non-goals","Downstream gate unlocked"))
    checks["terminal_class"] = "BLOCKED_PREEXECUTION_C2D_ZONE_STOCKOUT / R6 EXHAUSTED" in text
    checks["preflight"] = "R6_PREFLIGHT_PASS" in text and "limit `100.0`, usage `0.0`" in text
    checks["operation"] = "operation-1788226130354-65a61d7471f99-ec7f6b23-e02e7642" in text
    checks["done_503"] = "status: DONE" in text and "httpErrorStatusCode: 503" in text
    checks["error_exact"] = "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS" in text and "reason: stockout" in text
    checks["shape_zone"] = "vmType: c2d-standard-32" in text and "zone: us-central1-a" in text
    checks["timestamps"] = all(x in text for x in ("18:28:51.174-07:00","18:28:51.175-07:00","18:28:57.128-07:00"))
    checks["vm_absent"] = "resource not found for the exact\nR6 VM" in text
    checks["no_resource"] = "No VM, disk, billable runtime" in text
    checks["no_process"] = "No scientific\nexecutable ran" in text
    checks["quota_capacity_distinct"] = "distinguishes quota admission from capacity admission" in text
    checks["not_science"] = "not a scientific or mathematical result" in text
    checks["no_automatic_successor"] = "unlocks no automatic retry" in text
    checks["candidate_zero"] = "Candidate evaluations and positive samples remain zero" in text
    checks["authority_locked"] = "transport authority remain false" in text
    passed = sum(checks.values())
    receipt = {"schema":"nhm2.g2h_e_s5.c08_h2_p8j_r6_result_audit.v1","status":"PASS" if passed==len(checks) else "FAIL","checks_passed":passed,"checks_total":len(checks),"proposal_sha256":"f0a2aab6e81ca29d39f58fc5b79f51a5324ceca629571f1353d5e2501962d878","result_sha256":"2cf0ef29ee9fe17e8a6c39fea5055d66a5b52a31fe4a35317c740a4f127f7b68","classification":"BLOCKED_PREEXECUTION_C2D_ZONE_STOCKOUT","vm_created":False,"disk_created":False,"numerical_process_started":False,"candidate_evaluations":0,"authority_promoted":False,"checks":checks}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(receipt,sort_keys=True,separators=(",",":"))+"\n",encoding="utf-8")
    print(f"{passed}/{len(checks)} {receipt['status']}")
    return 0 if passed==len(checks) else 1
if __name__ == "__main__": raise SystemExit(main())
