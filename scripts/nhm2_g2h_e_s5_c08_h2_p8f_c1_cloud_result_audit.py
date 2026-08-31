"""Audit the immutable H2-P8F-C1 cloud execution result."""

from __future__ import annotations

import hashlib
import json
import pathlib
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8f-c1-cloud-execution-result.md"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c1-stopped-disk-rescue-v1-20260831/nhm2-h2-p8f-c1-stopped-disk-evidence-v1.tgz"
EXPECTED = "8236b3a7ec691555daf386e967460463a378380d22cf50e69dd84c6e995f8130"
BASE = "nhm2-h2-p8f-c1-rescue-capture-v1/"


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def member(tf: tarfile.TarFile, name: str) -> str:
    stream = tf.extractfile(BASE + name)
    assert stream is not None
    return stream.read().decode("utf-8", errors="replace")


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    with tarfile.open(ARCHIVE, "r:gz") as tf:
        journal = member(tf, "controller.journal.txt")
        build = member(tf, "p8f-c1-docker-build.txt")
        absent = member(tf, "absent-paths.txt")
        mount = member(tf, "device-and-mount.txt")
    checks = {
        "archive_exact": ARCHIVE.stat().st_size == 5025 and sha(ARCHIVE) == EXPECTED,
        "verdict": "`BLOCKED_PREEXECUTION_ARCHIVE_INVENTORY_SKEW`" in text,
        "controller_failure": "P8F_C1_CONTROLLER_FAIL phase=offline_build" in journal and "phase=offline_build" in text,
        "build_causal_symbols": all(v in build for v in ("kSecondJetTermCount", "CoefficientDecomposition", "evaluate_prepared_decomposed")),
        "archive_jet_old": all(v in text for v in ("1982953e636bfd007d1d094aec493120e6ffda9cdca7b2d3ede171c90bdc779a", "11cfa7047639761c6bdfd84a7ed3ff919cc400741ab5e85964e4415116f1e6a9")),
        "local_jet_new": all(v in text for v in ("5cca40e060d243d7edfd977bfe35fa35bddb6319c9ba42306cb371873469d010", "907f4f42c48e7659653d458ff1bf6c46116ee751b15d37a24e088081b480ebc4")),
        "evidence_root_absent": "nhm2-h2-p8f-c1-evidence-v1 ABSENT" in absent and "evidence-export-v1.tgz ABSENT" in absent,
        "readonly_recovery": "DEVICE_RO=1" in mount and "MOUNT_OPTIONS=ro,relatime,norecovery" in mount,
        "zero_numerics": "numerical processes" in text and "are all zero" in text,
        "c1_exhausted": "C1 is exhausted" in text and "may not be retried" in text,
        "successor_bounded": "replace\nonly the two stale jet archive members" in text and "separately authorized cloud action" in text,
        "authority_locked": "authority promotions are all zero" in text and "or authority promotion" in text,
    }
    passed = sum(checks.values())
    out = {"schema":"nhm2.g2h_e_s5.c08_h2_p8f_c1_cloud_result_audit.v1","status":"PASS" if passed == len(checks) else "FAIL","checks_passed":passed,"checks_total":len(checks),"checks":checks,"candidate_evaluations":0,"numerical_processes":0,"authority_promoted":False}
    print(json.dumps(out, sort_keys=True, separators=(",", ":")))
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    raise SystemExit(main())
