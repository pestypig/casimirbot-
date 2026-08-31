"""Independent static audit of the candidate-neutral P8F-C2-R1 proposal."""

from __future__ import annotations

import hashlib
import json
import pathlib
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c2-r1-cloud-execution-proposal.md"
C1_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-cloud-execution-result.md"
C2_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-cloud-preflight-v1-20260831"
C2_ARCHIVE = C2_ROOT / "h2-p8f-c2-cloud-upload-v1.tar"
R1_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831"
R1_ARCHIVE = R1_ROOT / "h2-p8f-c2-r1-cloud-upload-v1.tar"
R1_MANIFEST = R1_ROOT / "staging/h2-p8f-c2-r1-source-manifest.v1.json"
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
CONTROLLER = G2H / "h2_p8f_c2_r1_cloud_run_v1.sh"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8f-c2-r1-cloud-representative.v1"

EXPECTED_C2 = "b55dd71dad70396d8a1eb69665f6baaf42703fa52f0a54c0d2a6b062f4054951"
EXPECTED_ARCHIVE = "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978"
EXPECTED_MANIFEST = "6ff82d7b8eeb8918462a559df2d7cd4d213b5f226c824d51e6c162c31d5fde96"
EXPECTED_CONTROLLER = "8c83cd477e95260bcf53bd909584062b8c6d8f9087b5614c9df0533bfa2b2406"
EXPECTED_DOCKERFILE = "77c5c4dc3dff52190564298797b89bcbe230c51bf6efc0b5281edd8957f6f631"
EXPECTED_BINARY = "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6"
ADDITIONS = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c1-observability-fixture.v1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_p8f_c1_observability_fixture_v1.cpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c2-r1-cloud-representative.v1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_cloud_run_v1.sh",
}


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def archive_map(path: pathlib.Path) -> dict[str, bytes]:
    out: dict[str, bytes] = {}
    with tarfile.open(path, "r") as tf:
        for member in tf.getmembers():
            name = member.name.replace("\\", "/")
            if not member.isfile() or name in out:
                raise RuntimeError(f"unsafe or duplicate archive member: {name}")
            pure = pathlib.PurePosixPath(name)
            if pure.is_absolute() or ".." in pure.parts:
                raise RuntimeError(f"unsafe archive path: {name}")
            stream = tf.extractfile(member)
            assert stream is not None
            out[name] = stream.read()
    return out


def main() -> int:
    checks: dict[str, bool] = {}

    def check(name: str, condition: bool) -> None:
        checks[name] = bool(condition)

    packet = PACKET.read_text(encoding="utf-8")
    c1 = C1_RESULT.read_text(encoding="utf-8")
    controller = CONTROLLER.read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    manifest = json.loads(R1_MANIFEST.read_text(encoding="utf-8"))
    c2 = archive_map(C2_ARCHIVE)
    r1 = archive_map(R1_ARCHIVE)

    check("c2_parent_exact", sha(C2_ARCHIVE) == EXPECTED_C2)
    check("r1_archive_exact", R1_ARCHIVE.stat().st_size == 236_492_800 and sha(R1_ARCHIVE) == EXPECTED_ARCHIVE)
    check("r1_manifest_exact", sha(R1_MANIFEST) == EXPECTED_MANIFEST)
    check("r1_controller_exact", CONTROLLER.stat().st_size == 4_080 and sha(CONTROLLER) == EXPECTED_CONTROLLER)
    check("r1_dockerfile_exact", sha(DOCKERFILE) == EXPECTED_DOCKERFILE)
    check("inventory_counts", len(c2) == 55 and len(r1) == 60)
    check("parent_members_preserved", all(name in r1 and r1[name] == raw for name, raw in c2.items()))
    check("additions_exact", set(r1) - set(c2) == ADDITIONS | {"h2-p8f-c2-r1-source-manifest.v1.json"})
    check("manifest_parent", manifest["predecessor_archive_sha256"] == EXPECTED_C2)
    check("manifest_repair_class", manifest["repair_class"] == "additive_fixture_and_preexecution_evidence_binding")
    check("manifest_additions", {entry["path"] for entry in manifest["additions"]} == ADDITIONS)
    check("manifest_controller", manifest["cloud_controller_sha256"] == EXPECTED_CONTROLLER)
    check("manifest_binary", manifest["required_binary_sha256"] == EXPECTED_BINARY)
    check("manifest_file_replay", all(entry["path"] in r1 and len(r1[entry["path"]]) == entry["bytes"] and hashlib.sha256(r1[entry["path"]]).hexdigest() == entry["sha256"] for entry in manifest["files"]))
    check("jet_pair_current", sha(G2H / "mini_boson_star_primary_c08_convolution_jet_v1.cpp") == "5cca40e060d243d7edfd977bfe35fa35bddb6319c9ba42306cb371873469d010" and sha(G2H / "mini_boson_star_primary_c08_convolution_jet_v1.hpp") == "907f4f42c48e7659653d458ff1bf6c46116ee751b15d37a24e088081b480ebc4")
    check("selector_pair_current", sha(G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp") == "f02eccdd773f134758a8652a348466e6b859d27765b634349766bca5d3ea456d" and sha(G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp") == "84d5ada97933a858682ce7e3d9df6316527f560207d981a0bc16961287e639d4")
    check("same_scientific_main", "mini_boson_star_primary_c08_h2_p8f_c1_cloud_representative_v1.cpp" in dockerfile)
    check("offline_build", "docker build --network=none --pull=false" in controller)
    check("binary_guard", EXPECTED_BINARY in controller and '[[ "$BINARY_SHA" == "$EXPECTED_BINARY_SHA" ]]' in controller)
    check("single_process", controller.count('docker create --name "$CONTAINER"') == 1 and controller.count('docker start -a "$CONTAINER"') == 1)
    check("bounded_runtime", "TIMEOUT_SECONDS=86400" in controller and "timeout --signal=TERM --kill-after=30s" in controller)
    check("preexecution_evidence", controller.index('mkdir "$EVIDENCE"') < controller.index("docker load -i") and 'failure.phase.txt' in controller and "P8F_C2_R1_EVIDENCE_BASE64_BEGIN" in controller)
    check("immutable_outputs", '[[ ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]' in controller)
    check("automatic_stop", controller.count("shutdown -h now") >= 2)
    check("c1_honest_boundary", "BLOCKED_PREEXECUTION_ARCHIVE_INVENTORY_SKEW" in c1 and "C1 is exhausted" in c1)
    check("proposal_resource_exact", all(value in packet for value in ("nhm2-h2-p8f-c2-r1-n2-32-20260831", "n2-standard-32", "30 GB `pd-balanced`", "86,400", "$40.00")))
    check("proposal_hashes_exact", all(value in packet for value in (EXPECTED_C2, EXPECTED_ARCHIVE, EXPECTED_MANIFEST, EXPECTED_CONTROLLER, EXPECTED_DOCKERFILE, EXPECTED_BINARY)))
    check("authority_locked", all(value in packet for value in ("candidate-neutral", "First failure is terminal", "No result from this run alone admits a candidate", "propulsion", "transport authority")))

    passed = sum(checks.values())
    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_cloud_proposal_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "candidate_evaluations": 0,
        "numerical_executions": 0,
        "authority_promoted": False,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
