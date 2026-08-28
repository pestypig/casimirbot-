from __future__ import annotations

import hashlib
import json
import tarfile
from collections import OrderedDict
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = (
    ROOT
    / "artifacts"
    / "nhm2"
    / "g2h-e-s5"
    / "candidate-neutral"
    / "h2-p5a-r1-cloud-execution-v1-20260827"
)
BUNDLE = ARTIFACT_DIR / "h2-p5a-r1-preexecution-evidence.tgz"
EVIDENCE = ARTIFACT_DIR / "evidence"
AUDIT = ARTIFACT_DIR / "h2-p5a-r1-independent-audit.v1.json"

EXPECTED_BUNDLE_SHA256 = "e9b0dcce67d756c3b53833437b8d7bf3c86d4f1f72eff498c49cc70639c75f4d"
EXPECTED_UPLOAD_SHA256 = "a8b660522087c820aa23f7e11737aa55b944b7f6a048f867cabdeb4d8ccb6422"
EXPECTED_BUILDER = (
    "nhm2-g2h-s4-primary-fixture-builder:v2@"
    "sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1"
)
EXPECTED_RUNTIME = (
    "nhm2-g2h-primary-proof:v2@"
    "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab"
)
EXPECTED_MEMBERS = {
    "h2-p5a-r1-outcome.json",
    "h2-p5a-r1-upload.sha256",
    "h2-p5a-r1-upload.member-count",
    "h2-p5a-r1-base-images.inspect.json",
    "h2-p5a-r1-docker-load.log",
    "h2-p5a-r1-docker-build.log",
    "h2-p5a-r1-evidence-packed-utc.txt",
}
EXPECTED_TAGS = {
    "nhm2-g2h-s4-primary-fixture-builder:v2",
    "nhm2-g2h-primary-proof:v2",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    checks: OrderedDict[str, bool] = OrderedDict()
    checks["bundle_exists"] = BUNDLE.is_file()
    checks["bundle_sha256_matches_cloud"] = checks["bundle_exists"] and sha256(BUNDLE) == EXPECTED_BUNDLE_SHA256

    members: list[str] = []
    if checks["bundle_exists"]:
        with tarfile.open(BUNDLE, "r:gz") as archive:
            members = archive.getnames()
    checks["bundle_has_exact_seven_members"] = len(members) == 7 and set(members) == EXPECTED_MEMBERS
    checks["bundle_has_no_calibration_outputs"] = not any(
        "run-" in member or member.endswith(".stdout.json") or member.endswith(".stderr.txt")
        for member in members
    )

    extracted_names = {path.name for path in EVIDENCE.iterdir()} if EVIDENCE.is_dir() else set()
    checks["extracted_inventory_matches_bundle"] = extracted_names == EXPECTED_MEMBERS

    upload_sha_line = (EVIDENCE / "h2-p5a-r1-upload.sha256").read_text(encoding="utf-8").strip()
    checks["uploaded_archive_sha256_matches_frozen"] = upload_sha_line.split()[0] == EXPECTED_UPLOAD_SHA256
    checks["uploaded_archive_path_matches_vm_home"] = upload_sha_line.endswith(
        "/home/pestypig/h2-p5a-r1-upload-v1.tar"
    )
    checks["uploaded_archive_member_count_is_37"] = (
        EVIDENCE / "h2-p5a-r1-upload.member-count"
    ).read_text(encoding="utf-8").strip() == "37"

    load_log = (EVIDENCE / "h2-p5a-r1-docker-load.log").read_text(encoding="utf-8")
    checks["both_frozen_base_tags_loaded"] = all(
        f"Loaded image: {tag}" in load_log for tag in EXPECTED_TAGS
    )

    image_records = json.loads(
        (EVIDENCE / "h2-p5a-r1-base-images.inspect.json").read_text(encoding="utf-8")
    )
    checks["base_image_inspection_has_two_records"] = len(image_records) == 2
    observed_tags = {
        tag for record in image_records for tag in (record.get("RepoTags") or [])
    }
    checks["base_image_tags_are_exact"] = observed_tags == EXPECTED_TAGS
    checks["base_image_ids_are_content_ids"] = all(
        str(record.get("Id", "")).startswith("sha256:") for record in image_records
    )
    checks["base_image_repo_digests_are_empty"] = all(
        not (record.get("RepoDigests") or []) for record in image_records
    )

    build_log = (EVIDENCE / "h2-p5a-r1-docker-build.log").read_text(encoding="utf-8")
    checks["build_used_frozen_builder_reference"] = EXPECTED_BUILDER in build_log
    checks["build_used_frozen_runtime_reference"] = EXPECTED_RUNTIME in build_log
    checks["build_reached_first_from_instruction"] = "Step 3/43 : FROM ${BUILDER_IMAGE} AS builder" in build_log
    checks["build_failed_on_digest_resolution"] = (
        "pull access denied for nhm2-g2h-s4-primary-fixture-builder" in build_log
        and "requested access to the resource is denied" in build_log
    )
    checks["build_did_not_report_success"] = "Successfully built" not in build_log

    raw_outcome = (EVIDENCE / "h2-p5a-r1-outcome.json").read_text(encoding="utf-8")
    try:
        json.loads(raw_outcome)
        outcome_is_invalid_json = False
    except json.JSONDecodeError:
        outcome_is_invalid_json = True
    checks["malformed_remote_outcome_record_detected"] = outcome_is_invalid_json
    checks["raw_outcome_preserves_zero_numerical_runs"] = "numerical_runs:0" in raw_outcome
    checks["raw_outcome_preserves_build_binding_reason"] = (
        "loaded_base_images_have_empty_repo_digests" in raw_outcome
        and "frozen_name_at_digest_from_cannot_resolve_offline" in raw_outcome
    )

    packed_utc = (EVIDENCE / "h2-p5a-r1-evidence-packed-utc.txt").read_text(encoding="utf-8").strip()
    try:
        datetime.strptime(packed_utc, "%Y-%m-%dT%H:%M:%SZ")
        packed_utc_valid = True
    except ValueError:
        packed_utc_valid = False
    checks["evidence_timestamp_is_utc"] = packed_utc_valid

    passed = sum(checks.values())
    total = len(checks)
    verdict = "PASS" if passed == total else "FAIL"
    result = {
        "schema_version": "nhm2.h2.p5a.r1.independent_audit.v1",
        "verdict": verdict,
        "checks_passed": passed,
        "checks_total": total,
        "checks": checks,
        "classification": "BLOCKED_PREEXECUTION_BUILD_BINDING",
        "numerical_runs": 0,
        "binary_hash_checked": False,
        "calibration_decision_reached": False,
        "evidence_bundle_sha256": EXPECTED_BUNDLE_SHA256,
        "frozen_upload_sha256": EXPECTED_UPLOAD_SHA256,
        "representational_note": (
            "The remote outcome file is preserved but malformed; the classification is independently "
            "derived from the load, inspect, and build logs."
        ),
        "authority": {
            "candidate": False,
            "proof": False,
            "geometry_state": False,
            "lane": False,
            "lamp": False,
            "physical": False,
            "propulsion": False,
            "transport": False,
        },
    }
    AUDIT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{passed}/{total} {verdict}")
    print(sha256(AUDIT))
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
