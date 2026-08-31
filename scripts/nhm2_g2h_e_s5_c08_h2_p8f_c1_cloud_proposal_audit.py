"""Independent static audit of the candidate-neutral H2-P8F-C1 packet."""

from __future__ import annotations

import hashlib
import json
import pathlib
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-cloud-observable-execution-proposal.md"
INTERRUPTION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-local-interruption-result.md"
PREFLIGHT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c1-cloud-preflight-v1-20260831"
ARCHIVE = PREFLIGHT / "h2-p8f-c1-cloud-upload-v2.tar"
MANIFEST_PATH = PREFLIGHT / "staging/h2-p8f-c1-source-manifest.v2.json"
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
CONTROLLER = G2H / "h2_p8f_c1_cloud_run_v1.sh"
SOURCE = G2H / "mini_boson_star_primary_c08_h2_p8f_c1_cloud_representative_v1.cpp"
SELECTOR_HEADER = G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp"
SELECTOR_SOURCE = G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp"

EXPECTED_ARCHIVE = "c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640"
EXPECTED_MANIFEST = "0a3880db1ef5b4e57d8b0c7d5ac1fecec6330a08f8ff1df722334b32810b34fd"
EXPECTED_CONTROLLER = "940ee74a7093614bc5c5268a9871fd40a16ab1563c60a9ba5bc399f286ddb8b2"
EXPECTED_BINARY = "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(name: str, condition: bool, checks: dict[str, bool]) -> None:
    checks[name] = bool(condition)


def main() -> int:
    checks: dict[str, bool] = {}
    packet = PACKET.read_text(encoding="utf-8")
    interruption = INTERRUPTION.read_text(encoding="utf-8")
    controller = CONTROLLER.read_text(encoding="utf-8")
    source = SOURCE.read_text(encoding="utf-8")
    selector_header = SELECTOR_HEADER.read_text(encoding="utf-8")
    selector_source = SELECTOR_SOURCE.read_text(encoding="utf-8")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    check("archive_exact", ARCHIVE.stat().st_size == 236_391_936 and sha(ARCHIVE) == EXPECTED_ARCHIVE, checks)
    check("manifest_exact", sha(MANIFEST_PATH) == EXPECTED_MANIFEST, checks)
    check("controller_exact", sha(CONTROLLER) == EXPECTED_CONTROLLER, checks)
    check("manifest_bindings", manifest["required_binary_sha256"] == EXPECTED_BINARY and manifest["cloud_controller_sha256"] == EXPECTED_CONTROLLER, checks)

    expected = {
        entry["path"].replace("\\", "/"): entry
        for entry in manifest["files"]
    }
    with tarfile.open(ARCHIVE, "r") as archive:
        members = [member for member in archive.getmembers() if member.isfile()]
        names = [member.name.replace("\\", "/") for member in members]
        check("archive_inventory", len(members) == len(names) == len(set(names)) == 52, checks)
        check("manifest_is_archive_member", "h2-p8f-c1-source-manifest.v2.json" in names, checks)
        check("pre_manifest_inventory_bound", set(expected) <= set(names), checks)
        replay = True
        replayed: set[str] = set()
        for member in members:
            name = member.name.replace("\\", "/")
            if name not in expected:
                continue
            stream = archive.extractfile(member)
            assert stream is not None
            raw = stream.read()
            entry = expected[name]
            replay = replay and len(raw) == entry["bytes"] and hashlib.sha256(raw).hexdigest() == entry["sha256"]
            replayed.add(name)
        check("manifest_hash_replay", replay and replayed == set(expected), checks)
        check("archive_paths_safe", all(not pathlib.PurePosixPath(name).is_absolute() and ".." not in pathlib.PurePosixPath(name).parts for name in names), checks)

    check("target_unchanged", "kPanelCount = 65536U" in source and "kTargetDegree = 3U" in source and "second_jet(1U, 2U)" in source, checks)
    check("cloud_thread_width", "kThreadCount = 32U" in source and "--cpus 32" in controller, checks)
    check("progress_observable", "kProgressInterval = 1024U" in source and "completed_panels" in source and "CandidateProgressObserver" in selector_header, checks)
    check("progress_after_serial_reduction", selector_source.index("++counters.subpanels_accumulated") < selector_source.index("progress(counters.subpanels_accumulated"), checks)
    check("progress_cannot_select", "void progress(std::size_t completed" in source and "const bool evaluated" in source, checks)
    check("single_process", controller.count('docker create --name "$CONTAINER"') == 1 and controller.count('docker start -a "$CONTAINER"') == 1, checks)
    check("offline_build", "docker build --network=none --pull=false" in controller, checks)
    check("binary_guard", EXPECTED_BINARY in controller and '[[ "$BINARY_SHA" == "$EXPECTED_BINARY_SHA" ]]' in controller, checks)
    check("bounded_runtime", "TIMEOUT_SECONDS=86400" in controller and "timeout --signal=TERM --kill-after=30s" in controller, checks)
    check("serial_evidence_transport", "P8F_C1_EVIDENCE_BASE64_BEGIN" in controller and "base64 -w0" in controller and "shutdown -h now" in controller, checks)
    check("immutable_outputs", '[[ ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]' in controller, checks)
    check("local_interruption_honest", "P8F_OPERATOR_INTERRUPTED_PARTIAL_NO_CAUSAL_SELECTION" in interruption and "exit code: `137`" in interruption and "It is not a" in interruption and "numerical timeout" in interruption, checks)
    check("proposal_resource_exact", all(value in packet for value in ("c4-standard-32", "30 GB `hyperdisk-balanced`", "86,400", "$40.00", EXPECTED_ARCHIVE, EXPECTED_MANIFEST, EXPECTED_BINARY)), checks)
    check("authority_locked", all(phrase in packet for phrase in ("No candidate", "no scientific execution authority", "frozen-candidate evaluation")), checks)

    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c1_cloud_proposal_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
