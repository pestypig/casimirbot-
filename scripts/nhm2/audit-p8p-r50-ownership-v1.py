"""Read-only, source-disjoint audit of one local R50 ownership fixture.

This auditor does not grant execution or inspect candidate/scientific data.
"""

import argparse
import hashlib
import json
import re
from pathlib import Path


HEX = re.compile(r"[0-9a-f]{64}\Z")
HEADER = b'{"schema":"nhm2.p8p.r50.host-anchor.v1","state":"prepared"}\n'
SCOPE = "R48_CANDIDATE_NEUTRAL_RECOVERY_ONLY"
CLAIM_KEYS = ("schema", "proposalSha256", "attempt", "scope")
RESERVATION_KEYS = (
    "schema", "attempt", "proposalSha256", "utc", "scope",
    "maxCostCents", "maxHelperSeconds", "expiresAt",
    "scientificAuthority", "hostAnchorSha256", "hostClaimSha256",
)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("r50_audit_duplicate_key")
        result[key] = value
    return result


def strict_line(data, maximum):
    if not 1 <= len(data) <= maximum or not data.endswith(b"\n") or b"\r" in data:
        raise ValueError("r50_audit_line_bound")
    if data.count(b"\n") != 1:
        raise ValueError("r50_audit_line_count")
    value = json.loads(data[:-1], object_pairs_hook=unique_pairs,
                       parse_constant=lambda _: (_ for _ in ()).throw(
                           ValueError("r50_audit_constant")))
    if not isinstance(value, dict):
        raise ValueError("r50_audit_object")
    encoded = (json.dumps(value, separators=(",", ":"),
                          ensure_ascii=False) + "\n").encode("utf-8")
    if encoded != data:
        raise ValueError("r50_audit_encoding")
    return value


def regular(path, maximum):
    info = path.lstat()
    if not path.is_file() or path.is_symlink() or info.st_nlink != 1 or not 1 <= info.st_size <= maximum:
        raise ValueError("r50_audit_file_identity")
    data = path.read_bytes()
    if len(data) != info.st_size:
        raise ValueError("r50_audit_file_readback")
    return data


def audit(root, attempt, proposal):
    if not HEX.fullmatch(attempt) or not HEX.fullmatch(proposal):
        raise ValueError("r50_audit_input")
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("r50_audit_root")
    anchor = regular(root / "r50-host-anchor-v1.jsonl", 4096)
    if not anchor.startswith(HEADER):
        raise ValueError("r50_audit_header")
    claim_bytes = anchor[len(HEADER):]
    claim = strict_line(claim_bytes, 1024)
    if tuple(claim) != CLAIM_KEYS or claim != {
        "schema": "nhm2.p8p.r50.host-claim.v1",
        "proposalSha256": proposal, "attempt": attempt, "scope": SCOPE,
    }:
        raise ValueError("r50_audit_claim")
    attempt_root = root / ("r48-" + attempt)
    if attempt_root.is_symlink() or not attempt_root.is_dir():
        raise ValueError("r50_audit_attempt_root")
    reservation_bytes = regular(attempt_root / "reservation.jsonl", 4096)
    reservation = strict_line(reservation_bytes, 4096)
    if tuple(reservation) != RESERVATION_KEYS or any((
        reservation["schema"] != "nhm2.p8p.r50.local-reservation.v1",
        reservation["attempt"] != attempt,
        reservation["proposalSha256"] != proposal,
        reservation["scope"] != SCOPE,
        reservation["scientificAuthority"] is not False,
        reservation["hostAnchorSha256"] != digest(anchor),
        reservation["hostClaimSha256"] != digest(claim_bytes),
        type(reservation["maxCostCents"]) is not int,
        type(reservation["maxHelperSeconds"]) is not int,
    )):
        raise ValueError("r50_audit_reservation")
    if not 1 <= reservation["maxCostCents"] <= 100 or not 900 <= reservation["maxHelperSeconds"] <= 1200:
        raise ValueError("r50_audit_bounds")
    if not (isinstance(reservation["utc"], str) and
            isinstance(reservation["expiresAt"], str) and
            re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", reservation["utc"]) and
            re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", reservation["expiresAt"]) and
            reservation["utc"] < reservation["expiresAt"]):
        raise ValueError("r50_audit_chronology")
    capture = attempt_root / "capture"
    workload = attempt_root / "workload"
    if ((attempt_root / "safety").exists() or capture.is_symlink() or
            workload.is_symlink() or not capture.is_dir() or
            not workload.is_dir()):
        raise ValueError("r50_audit_layout")
    journal = regular(workload / "journal.jsonl", 8192)
    record = strict_line(journal, 8192)
    if (tuple(record) != ("schema", "attempt", "channel", "seq", "utc",
                         "prevSha256", "event", "recordSha256") or
        record["schema"] != "nhm2.p8p.r48.journal.v1" or
        record["attempt"] != attempt or record["channel"] != "workload" or
        record["seq"] != 1 or record["prevSha256"] != "0" * 64 or
        record["event"] != {
            "event": "RESERVED", "proposalSha256": proposal,
            "reservationSha256": digest(reservation_bytes),
            "anchorSha256": digest(anchor),
        } or record["recordSha256"] != digest(json.dumps(
            {key: value for key, value in record.items()
             if key != "recordSha256"},
            separators=(",", ":"), ensure_ascii=False).encode("utf-8"))):
        raise ValueError("r50_audit_journal")
    return {"pass": True, "attempt": attempt, "proposalSha256": proposal,
            "anchorSha256": digest(anchor),
            "reservationSha256": digest(reservation_bytes),
            "workloadTailSha256": record["recordSha256"],
            "scientificAuthority": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(allow_abbrev=False)
    parser.add_argument("root")
    parser.add_argument("attempt")
    parser.add_argument("proposal_sha256")
    args = parser.parse_args()
    print(json.dumps(audit(args.root, args.attempt, args.proposal_sha256),
                     sort_keys=True, separators=(",", ":")))
