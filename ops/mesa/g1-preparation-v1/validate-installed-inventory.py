"""Check a retained, non-evolving installed MESA inventory receipt."""

import argparse
import hashlib
import json
import re
from pathlib import Path


MARKERS = (
    "G1_INSTALLED_DEPENDENCY_INVENTORY_V1",
    "SOURCE_AND_DATA_SHA256",
    "SDK_FILES_SHA256",
    "SYMLINK_TARGETS",
    "END_G1_INSTALLED_DEPENDENCY_INVENTORY_V1",
)
HASH_LINE = re.compile(r"^([0-9a-f]{64})  (/home/docker/(?:mesa|mesasdk)/.+)$")


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--upstream-manifest", type=Path, required=True)
    args = parser.parse_args()
    receipt_bytes = args.receipt.read_bytes()
    lines = receipt_bytes.decode("utf-8-sig").splitlines()
    indices = []
    for marker in MARKERS:
        hits = [i for i, line in enumerate(lines) if line == marker]
        require(len(hits) == 1, f"missing or duplicate receipt marker: {marker}")
        indices.append(hits[0])
    require(indices == sorted(indices) and indices[0] == 0 and indices[-1] == len(lines) - 1,
            "invalid receipt structure")
    require(lines[1] == "MESA_VERSION r24.03.1", "unexpected installed MESA version")
    records = {}
    counts = {"mesa": 0, "mesasdk": 0}
    for label, start, end in (("mesa", indices[1], indices[2]),
                              ("mesasdk", indices[2], indices[3])):
        prefix = f"/home/docker/{label}/"
        for line in lines[start + 1:end]:
            match = HASH_LINE.fullmatch(line)
            require(match is not None and match.group(2).startswith(prefix), f"invalid {label} hash line")
            path = match.group(2)
            require(path not in records, f"duplicate installed file: {path}")
            records[path] = match.group(1)
            counts[label] += 1
    manifest = json.loads(args.upstream_manifest.read_text(encoding="utf-8"))
    commit = manifest.get("commit", manifest.get("upstreamCommit"))
    require(commit == "7ecf3dfa61d514c7b6f47645e02d968d3e3c28b7", "unexpected upstream commit")
    receipt_hash = hashlib.sha256(receipt_bytes).hexdigest()
    if "installedInventory" in manifest:
        require(manifest["installedInventory"]["sha256"] == receipt_hash, "receipt digest mismatch")
        require(manifest["installedInventory"]["mesaFileCount"] == counts["mesa"], "MESA count mismatch")
        require(manifest["installedInventory"]["sdkFileCount"] == counts["mesasdk"], "SDK count mismatch")
    sources = manifest.get("files", manifest.get("selectedInstalledAndUpstreamMatches"))
    require(isinstance(sources, list) and len(sources) == 13, "missing selected source list")
    mismatches = []
    for source in sources:
        path = "/home/docker/mesa/" + source["path"]
        if records.get(path) != source["sha256"]:
            mismatches.append(source["path"])
    require(not mismatches, f"installed/upstream mismatch: {mismatches}")
    print(json.dumps({
        "schemaVersion": "g1-installed-inventory-validation/1",
        "status": "PASS_RETAINED_FILE_HASH_CHECKS",
        "installedReceiptSha256": receipt_hash,
        "installedMesaFiles": counts["mesa"],
        "installedSdkFiles": counts["mesasdk"],
        "upstreamFileMatches": len(sources),
        "launchAllowed": False,
        "limitations": "broad installed inventory and selected source match, not an active dependency load trace",
    }, indent=2))


if __name__ == "__main__":
    main()
