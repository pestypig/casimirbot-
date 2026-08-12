"""Strict sealed run-request reader and static target validator."""

from __future__ import annotations

import hashlib
import json
import os
import re
import stat
from dataclasses import dataclass
from typing import Final

from .contract import (
    DYNAMIC_RUN_REQUEST_BINDING_PROFILES,
    DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES,
    RUN_REQUEST_ARTIFACT_KIND,
    RUN_REQUEST_BINDING_VERSION,
    RUN_REQUEST_EXPECTED_KEYS,
    RUN_REQUEST_PATH,
    RUN_REQUEST_SHA256_DOMAIN,
    STATIC_RUN_REQUEST_BINDINGS,
)
from .errors import block

_SHA256: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
_OCI_SHA256: Final[re.Pattern[str]] = re.compile(r"^sha256:[0-9a-f]{64}$")
_MAXIMUM_RUN_REQUEST_BYTES: Final[int] = 1024 * 1024
_MAXIMUM_DEPTH: Final[int] = 24
_MAXIMUM_NODES: Final[int] = 8192


@dataclass(frozen=True, slots=True)
class RunRequest:
    value: dict[str, object]
    canonical_bytes: bytes
    binding: dict[str, object]

    @property
    def verifier_source_ledger_binding(self) -> dict[str, object]:
        return dict(_require_dict(self.value["verifierSourceLedgerBinding"], "verifierSourceLedgerBinding"))

    @property
    def verifier_toolchain_ledger_binding(self) -> dict[str, object]:
        return dict(
            _require_dict(
                self.value["verifierToolchainLedgerBinding"],
                "verifierToolchainLedgerBinding",
            )
        )

    @property
    def verifier_proof_kernel_binding(self) -> dict[str, object]:
        return dict(_require_dict(self.value["verifierProofKernelBinding"], "verifierProofKernelBinding"))

    @property
    def verifier_mpfr_gmp_runtime_binding(self) -> dict[str, object]:
        return dict(
            _require_dict(
                self.value["verifierMpfrGmpRuntimeBinding"],
                "verifierMpfrGmpRuntimeBinding",
            )
        )


def _require_dict(value: object, field: str) -> dict[str, object]:
    if type(value) is not dict:
        block("run_request", "binding_not_object", field)
    return value


def _reject_constant(token: str) -> None:
    block("run_request", "nonfinite_json_number", token)


def _unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            block("run_request", "duplicate_json_key", key)
        result[key] = value
    return result


def _json_string(value: str) -> str:
    try:
        value.encode("utf-8", "strict")
    except UnicodeEncodeError:
        block("run_request", "invalid_unicode_scalar", "unpaired_surrogate")
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _canonical_json(value: object, depth: int = 0, counter: list[int] | None = None) -> str:
    if counter is None:
        counter = [0]
    counter[0] += 1
    if depth > _MAXIMUM_DEPTH or counter[0] > _MAXIMUM_NODES:
        block("run_request", "json_structure_limit_exceeded", "depth_or_node_count")
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if type(value) is int:
        return str(value)
    if type(value) is float:
        block("run_request", "unexpected_json_float", "run_request_schema_has_no_float_fields")
    if type(value) is str:
        return _json_string(value)
    if type(value) is list:
        return "[" + ",".join(_canonical_json(item, depth + 1, counter) for item in value) + "]"
    if type(value) is dict:
        keys = sorted(value, key=lambda item: item.encode("utf-16-be"))
        return "{" + ",".join(
            f"{_json_string(key)}:{_canonical_json(value[key], depth + 1, counter)}"
            for key in keys
        ) + "}"
    block("run_request", "unsupported_json_value", type(value).__name__)


def _read_exact_regular_file(path: str) -> bytes:
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
    try:
        before_path = os.lstat(path)
        descriptor = os.open(path, flags)
    except OSError as error:
        block("run_request", "secure_open_failed", f"{error.errno}")
    try:
        before = os.fstat(descriptor)
        if (
            not stat.S_ISREG(before.st_mode)
            or before.st_nlink != 1
            or before.st_size <= 0
            or before.st_size > _MAXIMUM_RUN_REQUEST_BYTES
            or (before_path.st_dev, before_path.st_ino) != (before.st_dev, before.st_ino)
        ):
            block("run_request", "regular_single_link_bounded_file_required", path)
        chunks: list[bytes] = []
        remaining = before.st_size
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                block("run_request", "short_read", path)
            chunks.append(chunk)
            remaining -= len(chunk)
        if os.read(descriptor, 1) != b"":
            block("run_request", "trailing_read_probe_failed", path)
        after = os.fstat(descriptor)
        try:
            after_path = os.lstat(path)
        except OSError as error:
            block("run_request", "post_read_path_stat_failed", str(error.errno))
        identity_before = (
            before.st_dev,
            before.st_ino,
            stat.S_IFMT(before.st_mode),
            before.st_nlink,
            before.st_size,
            before.st_mtime_ns,
            before.st_ctime_ns,
        )
        identity_after = (
            after.st_dev,
            after.st_ino,
            stat.S_IFMT(after.st_mode),
            after.st_nlink,
            after.st_size,
            after.st_mtime_ns,
            after.st_ctime_ns,
        )
        identity_after_path = (
            after_path.st_dev,
            after_path.st_ino,
            stat.S_IFMT(after_path.st_mode),
            after_path.st_nlink,
            after_path.st_size,
            after_path.st_mtime_ns,
            after_path.st_ctime_ns,
        )
        if identity_before != identity_after or identity_before != identity_after_path:
            block("run_request", "stat_read_stat_changed", path)
        return b"".join(chunks)
    finally:
        os.close(descriptor)


def _validate_control_plane_binding(field: str, value: object) -> None:
    record = _require_dict(value, field)
    if set(record) != {
        "bindingVersion",
        "artifactKind",
        "sha256Domain",
        "sha256",
        "canonicalSizeBytes",
    }:
        block("run_request", "binding_surface_mismatch", field)
    expected_profile = DYNAMIC_RUN_REQUEST_BINDING_PROFILES.get(field)
    if expected_profile is None:
        block("run_request", "unregistered_dynamic_binding_field", field)
    if (
        record["bindingVersion"] != "nhm2.control_plane.domain_hash_binding/v1"
        or record["artifactKind"] != expected_profile[0]
        or record["sha256Domain"] != expected_profile[1]
        or type(record["sha256"]) is not str
        or _SHA256.fullmatch(record["sha256"]) is None
        or type(record["canonicalSizeBytes"]) is not int
        or record["canonicalSizeBytes"] < 0
        or record["canonicalSizeBytes"] > (2**53 - 1)
        or record["canonicalSizeBytes"]
        > DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES[field]
    ):
        block("run_request", "binding_profile_or_value_invalid", field)


def parse_run_request_bytes(raw: bytes) -> RunRequest:
    if not raw or raw.startswith(b"\xef\xbb\xbf"):
        block("run_request", "empty_or_bom_prefixed", "canonical_utf8_required")
    try:
        text = raw.decode("utf-8", "strict")
        value = json.loads(
            text,
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
        )
    except UnicodeDecodeError:
        block("run_request", "invalid_utf8", "strict_utf8_required")
    except json.JSONDecodeError as error:
        block("run_request", "invalid_json", f"line={error.lineno}:column={error.colno}")
    if type(value) is not dict or set(value) != set(RUN_REQUEST_EXPECTED_KEYS):
        block("run_request", "exact_top_level_keys_required", "seed_run_request_v1")
    canonical = _canonical_json(value).encode("utf-8")
    if canonical != raw:
        block("run_request", "noncanonical_json", "raw_bytes_must_equal_rfc8785_projection")
    if value["schemaVersion"] != "nhm2.prolate_boson_star.newtonian_seed.run_request/v1":
        block("run_request", "schema_version_mismatch", str(value["schemaVersion"]))
    for field, expected in STATIC_RUN_REQUEST_BINDINGS.items():
        if value[field] != dict(expected):
            block("run_request", "static_binding_mismatch", field)
    for field in RUN_REQUEST_EXPECTED_KEYS:
        if field.endswith("Binding") and field not in STATIC_RUN_REQUEST_BINDINGS:
            _validate_control_plane_binding(field, value[field])
    if set(DYNAMIC_RUN_REQUEST_BINDING_PROFILES) != {
        field
        for field in RUN_REQUEST_EXPECTED_KEYS
        if field.endswith("Binding") and field not in STATIC_RUN_REQUEST_BINDINGS
    }:
        block("run_request", "dynamic_binding_profile_table_drift", "field_coverage")
    if set(DYNAMIC_RUN_REQUEST_BINDING_MAXIMUM_BYTES) != set(
        DYNAMIC_RUN_REQUEST_BINDING_PROFILES
    ):
        block("run_request", "dynamic_binding_maximum_table_drift", "field_coverage")
    distinct_classes = (
        (
            "producerSourceLedgerBinding",
            "verifierSourceLedgerBinding",
            "assemblerSourceLedgerBinding",
        ),
        (
            "producerToolchainLedgerBinding",
            "verifierToolchainLedgerBinding",
            "assemblerToolchainLedgerBinding",
        ),
        (
            "producerSeccompPolicyBinding",
            "verifierSeccompPolicyBinding",
            "assemblerSeccompPolicyBinding",
        ),
        (
            "producerQuotaCapabilityBinding",
            "verifierQuotaCapabilityBinding",
            "assemblerQuotaCapabilityBinding",
        ),
    )
    for fields in distinct_classes:
        digests = {
            _require_dict(value[field], field)["sha256"]
            for field in fields
        }
        if len(digests) != len(fields):
            block("run_request", "pairwise_distinct_stage_bindings_required", ",".join(fields))
    for field in (
        "producerOciImageDigest",
        "verifierOciImageDigest",
        "assemblerOciImageDigest",
    ):
        digest = value[field]
        if type(digest) is not str or _OCI_SHA256.fullmatch(digest) is None:
            block("run_request", "oci_digest_invalid", field)
    request_sha = hashlib.sha256(RUN_REQUEST_SHA256_DOMAIN + raw).hexdigest()
    binding = {
        "bindingVersion": RUN_REQUEST_BINDING_VERSION,
        "artifactKind": RUN_REQUEST_ARTIFACT_KIND,
        "sha256Domain": RUN_REQUEST_SHA256_DOMAIN.decode("utf-8"),
        "sha256": request_sha,
        "canonicalSizeBytes": len(raw),
    }
    return RunRequest(value=value, canonical_bytes=raw, binding=binding)


def read_run_request(path: str) -> RunRequest:
    if path != RUN_REQUEST_PATH:
        block("run_request", "exact_run_request_path_required", path)
    return parse_run_request_bytes(_read_exact_regular_file(path))
