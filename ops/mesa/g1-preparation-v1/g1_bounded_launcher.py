"""Non-executing G1 launcher preflight. Never starts Docker or MESA.

This is the policy/host-capacity half of a future bounded launcher. An
execution half must be separately reviewed, tested and admitted after the
observation freeze; this module intentionally has no subprocess launch path.
"""

import ctypes
import hashlib
import json
import math
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MODEL = ROOT / "configs/research/controlled-stellar-composition-transport-g1-model-design.v1.json"
ACCEPTANCE = ROOT / "configs/research/controlled-stellar-composition-transport-g1-acceptance-design.v1.json"
STRUCTURAL = ROOT / "configs/research/controlled-stellar-composition-transport-g1-structural-source.v1.json"
PROVENANCE = ROOT / "configs/research/controlled-stellar-composition-transport-g1-installed-provenance.v1.json"


@dataclass(frozen=True)
class ResourceSample:
    elapsed_seconds: float
    attempt_bytes: int
    host_free_bytes: int
    running_g1_jobs: int


def runtime_stop_reason(sample: ResourceSample, resources: dict) -> str | None:
    """Pure first-stop decision for a future monitor; no process control here."""
    frozen_limits = {
        "jobConcurrency": 1,
        "pilotTimeoutSeconds": 7200,
        "maximumAttemptWorkingAndOutputBytes": 5_000_000_000,
        "stopBelowHostFreeBytes": 20_000_000_000,
    }
    if any(type(resources.get(key)) is not type(value) or resources.get(key) != value
           for key, value in frozen_limits.items()):
        return "STOP_RESOURCE_POLICY_DRIFT"
    if any((isinstance(value, bool) or not isinstance(value, (int, float)))
           for value in (sample.elapsed_seconds, sample.attempt_bytes,
                         sample.host_free_bytes, sample.running_g1_jobs)):
        return "STOP_INVALID_RESOURCE_SAMPLE"
    if (not all(math.isfinite(float(value)) for value in
                (sample.elapsed_seconds, sample.attempt_bytes, sample.host_free_bytes,
                 sample.running_g1_jobs)) or
            min(sample.elapsed_seconds, sample.attempt_bytes,
                sample.host_free_bytes, sample.running_g1_jobs) < 0):
        return "STOP_INVALID_RESOURCE_SAMPLE"
    if int(sample.running_g1_jobs) != sample.running_g1_jobs:
        return "STOP_INVALID_RESOURCE_SAMPLE"
    if sample.running_g1_jobs > resources["jobConcurrency"]:
        return "STOP_JOB_CONCURRENCY"
    # Conservative one-minute, 500-MB and 1-GB margins leave time for a
    # future monitor to stop before the frozen hard ceilings are crossed.
    if sample.elapsed_seconds >= resources["pilotTimeoutSeconds"] - 60:
        return "STOP_WALL_CLOCK_MARGIN"
    if sample.attempt_bytes >= resources["maximumAttemptWorkingAndOutputBytes"] - 500_000_000:
        return "STOP_ATTEMPT_BYTES_MARGIN"
    if sample.host_free_bytes <= resources["stopBelowHostFreeBytes"] + 1_000_000_000:
        return "STOP_HOST_FREE_MARGIN"
    return None


def available_memory_bytes() -> int | None:
    """Return host-available RAM, not total or virtual memory; unknown fails closed."""
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("load", ctypes.c_ulong),
                       ("total_physical", ctypes.c_ulonglong),
                       ("available_physical", ctypes.c_ulonglong),
                       ("total_page", ctypes.c_ulonglong),
                       ("available_page", ctypes.c_ulonglong),
                       ("total_virtual", ctypes.c_ulonglong),
                       ("available_virtual", ctypes.c_ulonglong),
                       ("available_extended", ctypes.c_ulonglong)]
        status = MemoryStatus()
        status.length = ctypes.sizeof(status)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return None
        return int(status.available_physical)
    try:
        for line in Path("/proc/meminfo").read_text(encoding="ascii").splitlines():
            if line.startswith("MemAvailable:"):
                return int(line.split()[1]) * 1024
    except (OSError, ValueError, IndexError):
        pass
    return None


def evaluate_preflight(
    model: dict, acceptance: dict, structural: dict, provenance: dict,
    inlist_bytes: bytes, host_free_bytes: int | None,
    host_available_memory_bytes: int | None,
) -> list[str]:
    """Pure, ordered fail-closed checks; no scientific acceptance is implied."""
    blockers: list[str] = []
    resources = model.get("resources", {})
    expected = {
        "jobConcurrency": 1, "cpus": 2, "OMP_NUM_THREADS": 2,
        "OPENBLAS_NUM_THREADS": 1, "memoryBytes": 2_147_483_648,
        "memoryPlusSwapBytes": 2_147_483_648, "pids": 128,
        "pilotTimeoutSeconds": 7200,
        "minimumHostFreeBytesBeforeStart": 25_000_000_000,
        "minimumHostAvailableMemoryBytes": 4_294_967_296,
        "maximumAttemptWorkingAndOutputBytes": 5_000_000_000,
        "stopBelowHostFreeBytes": 20_000_000_000, "network": "none",
        "privileged": False, "dockerSocketMount": False,
        "automaticDeletion": False,
    }
    if any(type(resources.get(key)) is not type(value) or resources.get(key) != value
           for key, value in expected.items()):
        blockers.append("BLOCK_RESOURCE_POLICY_DRIFT")
    if model.get("image") != provenance.get("image"):
        blockers.append("BLOCK_IMAGE_IDENTITY_MISMATCH")
    if hashlib.sha256(inlist_bytes).hexdigest() != provenance.get("inlist", {}).get("sha256"):
        blockers.append("BLOCK_INLIST_HASH_MISMATCH")
    def valid_capacity(value: object) -> bool:
        return type(value) is int and value >= 0

    if (not valid_capacity(host_free_bytes) or
            host_free_bytes < expected["minimumHostFreeBytesBeforeStart"]):
        blockers.append("BLOCK_HOST_DISK_CAPACITY")
    if (not valid_capacity(host_available_memory_bytes) or
            host_available_memory_bytes < expected["minimumHostAvailableMemoryBytes"]):
        blockers.append("BLOCK_HOST_MEMORY_CAPACITY")
    for label, document in (("MODEL", model), ("ACCEPTANCE", acceptance),
                            ("STRUCTURAL", structural), ("PROVENANCE", provenance)):
        if document.get("launchAllowed") is not True:
            blockers.append(f"BLOCK_{label}_LAUNCH_AUTHORITY")
    if structural.get("comparisonOperator") is None:
        blockers.append("BLOCK_STRUCTURAL_COMPARISON_OPERATOR")
    # This prototype does not attest Docker's data-drive space, image state,
    # native parser, loaded microphysics or runtime monitoring. No override.
    blockers.append("BLOCK_EXECUTION_ADAPTER_NOT_IMPLEMENTED")
    return blockers


def main() -> int:
    if len(sys.argv) != 1:
        print("usage: python g1_bounded_launcher.py (preflight only)", file=sys.stderr)
        return 2
    try:
        model = json.loads(MODEL.read_text(encoding="utf-8"))
        acceptance = json.loads(ACCEPTANCE.read_text(encoding="utf-8"))
        structural = json.loads(STRUCTURAL.read_text(encoding="utf-8"))
        provenance = json.loads(PROVENANCE.read_text(encoding="utf-8"))
        inlist_path = ROOT / provenance["inlist"]["path"]
        inlist_bytes = inlist_path.read_bytes()
        host_free = shutil.disk_usage(ROOT).free
        host_memory = available_memory_bytes()
        blockers = evaluate_preflight(model, acceptance, structural, provenance,
                                      inlist_bytes, host_free, host_memory)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"schemaVersion": "g1-bounded-launcher-preflight/1",
                          "status": "BLOCK_PREFLIGHT_ERROR", "detail": str(exc),
                          "launchAllowed": False}, indent=2))
        return 2
    print(json.dumps({"schemaVersion": "g1-bounded-launcher-preflight/1",
                      "status": "BLOCKED" if blockers else "PASS_PREFLIGHT_ONLY",
                      "launchAllowed": False, "hostFreeBytes": host_free,
                      "hostAvailableMemoryBytes": host_memory,
                      "inlistSha256": hashlib.sha256(inlist_bytes).hexdigest(),
                      "blockers": blockers,
                      "limitations": "No Docker/image/data-drive/native-parser/loaded-microphysics check, execution or calibration"},
                     indent=2))
    return 2 if blockers else 0


if __name__ == "__main__":
    raise SystemExit(main())
