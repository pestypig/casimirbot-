"""Structural validator for the frozen spherical primary candidate descriptor.

The descriptor still uses the v3 source-candidate identity. This module never
maps it to the v2 candidate; only the separately frozen initializer bridge may
do that. Provenance fields whose hash recipes are not yet closed are validated
only for their frozen shape, never treated as authoritative evidence.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from types import MappingProxyType
from typing import Final
import unicodedata

from canonical_json import (
    CanonicalJsonDocument,
    CanonicalJsonError,
    FrozenJsonArray,
    FrozenJsonObject,
    parse_canonical_json_bytes,
)
from forbidden_roles import scan_document_for_forbidden_roles
from hash_graph import (
    PayloadHashInput,
    descriptor_sha256,
    input_binding_sha256,
    payload_binding_sha256,
)


SOURCE_CANDIDATE_ID: Final = (
    "nhm2.semiclassical_v3.spherical_boson_star_1s_weak_field_control/v1"
)
DESCRIPTOR_SCHEMA_VERSION: Final = (
    "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_descriptor/v1"
)

_HEX40: Final = re.compile(r"^[0-9a-f]{40}$")
_HEX64: Final = re.compile(r"^[0-9a-f]{64}$")
_DECIMAL_COUNTER: Final = re.compile(r"^(?:0|[1-9][0-9]{0,38})$")
_MODE_OCTAL: Final = re.compile(r"^[0-7]{4}$")
_UTC_TIMESTAMP: Final = re.compile(
    r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{9}Z$"
)
_MEDIA_TYPE: Final = re.compile(
    r"^[!#$%&'*+.^_`|~0-9A-Za-z-]+/[!#$%&'*+.^_`|~0-9A-Za-z-]+$"
)

_DESCRIPTOR_KEYS: Final = (
    "attemptOrdinal",
    "authorityFalse",
    "candidateId",
    "orderedPayloadBindings",
    "policyBindings",
    "provenance",
    "schemaVersion",
)
_PAYLOAD_KEYS: Final = (
    "elementCount",
    "elementType",
    "path",
    "payloadSha256",
    "rawSha256",
    "semanticRole",
    "sizeBytes",
)
_POLICY_KEYS: Final = (
    "artifactId",
    "canonicalSizeBytes",
    "policyVersion",
    "sha256",
    "sha256Domain",
)
_POLICY_BINDING_KEYS: Final = (
    "directedProofArchitecture",
    "directedProofOperator",
    "interchangePolicy",
    "operationPrepolicy",
    "primaryNumericsPolicy",
    "semanticSeed",
)
_PROVENANCE_KEYS: Final = (
    "commandArgv",
    "commit40",
    "dirtyTreeDigestSha256",
    "executableBinding",
    "freshnessObservations",
    "outputRootIdentitySha256",
    "preexecutionPresealBinding",
    "runtimeManifestBinding",
    "sourceManifestBinding",
    "timing",
    "toolchainManifestBinding",
)
_RAW_BINDING_KEYS: Final = ("mediaType", "path", "sha256", "sizeBytes")
_TIMING_KEYS: Final = (
    "monotonicElapsedNanoseconds",
    "monotonicEndNanoseconds",
    "monotonicStartNanoseconds",
    "wallEndUtc",
    "wallStartUtc",
)
_FRESHNESS_KEYS: Final = ("path", "postread", "preopen", "stable")
_FILE_STAT_KEYS: Final = (
    "changeTimeNanoseconds",
    "device",
    "inode",
    "modeOctal",
    "modifyTimeNanoseconds",
    "sha256",
    "sizeBytes",
)

_EXPECTED_POLICIES: Final = MappingProxyType(
    {
        "directedProofArchitecture": (
            "nhm2.spherical_boson_star_newtonian_seed_directed_proof",
            42_778,
            "nhm2_spherical_boson_star_newtonian_seed_directed_proof/v1",
            "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99",
            "nhm2-spherical-boson-star-newtonian-seed-directed-proof/v1\n",
        ),
        "directedProofOperator": (
            "nhm2.spherical_boson_star_newtonian_seed_directed_proof_operator",
            34_695,
            "nhm2_spherical_boson_star_newtonian_seed_directed_proof_operator/v1",
            "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b",
            "nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator/v1\n",
        ),
        "interchangePolicy": (
            "nhm2.spherical_boson_star_newtonian_seed_interchange",
            67_853,
            "nhm2_spherical_boson_star_newtonian_seed_interchange/v1",
            "827eb79c27137dd1649b35884c945c2d6809483acf25c7fd68d2a3ed80936f95",
            "nhm2-spherical-boson-star-newtonian-seed-interchange/v1\n",
        ),
        "operationPrepolicy": (
            "nhm2.spherical_boson_star_newtonian_seed_operation_policy",
            32_308,
            "nhm2_spherical_boson_star_newtonian_seed_operation_policy/v1",
            "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
            "nhm2-spherical-boson-star-newtonian-seed-operation-policy/v1\n",
        ),
        "primaryNumericsPolicy": (
            "nhm2.spherical_boson_star_newtonian_seed_primary_numerics",
            80_055,
            "nhm2_spherical_boson_star_newtonian_seed_primary_numerics/v1",
            "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
            "nhm2-spherical-boson-star-newtonian-seed-primary-numerics/v1\n",
        ),
        "semanticSeed": (
            "nhm2.spherical_boson_star_newtonian_seed",
            18_894,
            "nhm2_spherical_boson_star_newtonian_seed/v1",
            "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
            "nhm2-spherical-boson-star-newtonian-seed/v1\n",
        ),
    }
)

_EXPECTED_PAYLOADS: Final = (
    ("scalars.f64le", "primary_scalar_operands", 9, 72),
    (
        "coefficients/core_L2_u.f64le",
        "primary_L2_scalar_Chebyshev_coefficients",
        128,
        1_024,
    ),
    (
        "coefficients/core_L2_V.f64le",
        "primary_L2_potential_Chebyshev_coefficients",
        128,
        1_024,
    ),
    (
        "coefficients/tail_H.f64le",
        "primary_tail_H_Chebyshev_coefficients",
        32,
        256,
    ),
    (
        "coefficients/tail_Q.f64le",
        "primary_tail_Q_Chebyshev_coefficients",
        32,
        256,
    ),
)


class DescriptorError(ValueError):
    def __init__(self, code: str, pointer: str = "/") -> None:
        super().__init__(f"{code}:{pointer}")
        self.code = code
        self.pointer = pointer


@dataclass(frozen=True, slots=True)
class ValidatedSourceDescriptor:
    descriptor_sha256: str
    source_input_binding_sha256: str
    source_candidate_id: str
    payloads: tuple[PayloadHashInput, ...]
    provenance_structurally_valid: bool
    provenance_authoritative: bool = False
    v2_candidate_binding_present: bool = False


def _object(value: object, keys: tuple[str, ...], pointer: str) -> FrozenJsonObject:
    if type(value) is not FrozenJsonObject or value.keys() != keys:
        raise DescriptorError("json_schema_mismatch", pointer)
    return value


def _array(value: object, length: int, pointer: str) -> FrozenJsonArray:
    if type(value) is not FrozenJsonArray or len(value.items) != length:
        raise DescriptorError("json_schema_mismatch", pointer)
    return value


def _string(value: object, pointer: str) -> str:
    if type(value) is not str:
        raise DescriptorError("json_schema_mismatch", pointer)
    return value


def _safe_nonnegative(value: object, pointer: str) -> int:
    if type(value) is not int or value < 0 or value > (1 << 53) - 1:
        raise DescriptorError("json_schema_mismatch", pointer)
    return value


def _hash(value: object, pointer: str) -> str:
    text = _string(value, pointer)
    if _HEX64.fullmatch(text) is None:
        raise DescriptorError("json_schema_mismatch", pointer)
    return text


def _relative_path(value: object, pointer: str) -> str:
    path = _string(value, pointer)
    try:
        encoded = path.encode("utf-8", "strict")
    except UnicodeEncodeError as exc:
        raise DescriptorError("json_schema_mismatch", pointer) from exc
    segments = path.split("/")
    if (
        not 1 <= len(encoded) <= 4_096
        or unicodedata.normalize("NFC", path) != path
        or path.startswith("/")
        or path.endswith("/")
        or "\\" in path
        or any(
            segment in ("", ".", "..")
            or not 1 <= len(segment.encode("utf-8", "strict")) <= 255
            for segment in segments
        )
        or (len(segments[0]) >= 2 and segments[0][0].isalpha() and segments[0][1] == ":")
    ):
        raise DescriptorError("json_schema_mismatch", pointer)
    return path


def _raw_binding(
    value: object, pointer: str, expected_media_type: str
) -> tuple[str, str, int]:
    record = _object(value, _RAW_BINDING_KEYS, pointer)
    media_type = _string(record.get("mediaType"), f"{pointer}/mediaType")
    if (
        _MEDIA_TYPE.fullmatch(media_type) is None
        or not media_type.isascii()
        or media_type != expected_media_type
    ):
        raise DescriptorError("json_schema_mismatch", f"{pointer}/mediaType")
    path = _relative_path(record.get("path"), f"{pointer}/path")
    digest = _hash(record.get("sha256"), f"{pointer}/sha256")
    size = _safe_nonnegative(record.get("sizeBytes"), f"{pointer}/sizeBytes")
    return path, digest, size


def _validate_policy_bindings(value: object) -> None:
    bindings = _object(value, _POLICY_BINDING_KEYS, "/policyBindings")
    for role, expected in _EXPECTED_POLICIES.items():
        binding = _object(bindings.get(role), _POLICY_KEYS, f"/policyBindings/{role}")
        observed = (
            binding.get("artifactId"),
            binding.get("canonicalSizeBytes"),
            binding.get("policyVersion"),
            binding.get("sha256"),
            binding.get("sha256Domain"),
        )
        if observed != expected:
            raise DescriptorError("policy_binding_mismatch", f"/policyBindings/{role}")


def _validate_timing(value: object) -> None:
    timing = _object(value, _TIMING_KEYS, "/provenance/timing")
    start = _string(timing.get("monotonicStartNanoseconds"), "/provenance/timing/start")
    end = _string(timing.get("monotonicEndNanoseconds"), "/provenance/timing/end")
    elapsed = _string(
        timing.get("monotonicElapsedNanoseconds"), "/provenance/timing/elapsed"
    )
    if any(_DECIMAL_COUNTER.fullmatch(value) is None for value in (start, end, elapsed)):
        raise DescriptorError("json_schema_mismatch", "/provenance/timing")
    if int(end) < int(start) or int(end) - int(start) != int(elapsed):
        raise DescriptorError("command_or_timing_mismatch", "/provenance/timing")
    wall_start = _string(timing.get("wallStartUtc"), "/provenance/timing/wallStartUtc")
    wall_end = _string(timing.get("wallEndUtc"), "/provenance/timing/wallEndUtc")

    def parse_wall_timestamp(timestamp: str) -> tuple[int, ...]:
        if _UTC_TIMESTAMP.fullmatch(timestamp) is None:
            raise DescriptorError("json_schema_mismatch", "/provenance/timing")
        try:
            instant = datetime(
                int(timestamp[0:4]),
                int(timestamp[5:7]),
                int(timestamp[8:10]),
                int(timestamp[11:13]),
                int(timestamp[14:16]),
                int(timestamp[17:19]),
                tzinfo=timezone.utc,
            )
        except ValueError as error:
            raise DescriptorError("json_schema_mismatch", "/provenance/timing") from error
        return (
            instant.year,
            instant.month,
            instant.day,
            instant.hour,
            instant.minute,
            instant.second,
            int(timestamp[20:29]),
        )

    wall_start_key = parse_wall_timestamp(wall_start)
    wall_end_key = parse_wall_timestamp(wall_end)
    if wall_end_key < wall_start_key:
        raise DescriptorError("command_or_timing_mismatch", "/provenance/timing")


def _validate_file_stat(value: object, pointer: str) -> tuple[object, ...]:
    stat = _object(value, _FILE_STAT_KEYS, pointer)
    counters = tuple(
        _string(stat.get(field), f"{pointer}/{field}")
        for field in (
            "changeTimeNanoseconds",
            "device",
            "inode",
            "modifyTimeNanoseconds",
        )
    )
    if any(_DECIMAL_COUNTER.fullmatch(counter) is None for counter in counters):
        raise DescriptorError("json_schema_mismatch", pointer)
    mode = _string(stat.get("modeOctal"), f"{pointer}/modeOctal")
    if _MODE_OCTAL.fullmatch(mode) is None:
        raise DescriptorError("json_schema_mismatch", f"{pointer}/modeOctal")
    digest = _hash(stat.get("sha256"), f"{pointer}/sha256")
    size = _safe_nonnegative(stat.get("sizeBytes"), f"{pointer}/sizeBytes")
    return (*counters[:3], mode, counters[3], digest, size)


def _validate_freshness(
    value: object, bound_artifacts: dict[str, tuple[str, int]]
) -> None:
    freshness = value
    if type(freshness) is not FrozenJsonArray or not 1 <= len(freshness.items) <= 8_192:
        raise DescriptorError("json_schema_mismatch", "/provenance/freshnessObservations")
    paths: list[bytes] = []
    for ordinal, item in enumerate(freshness.items):
        pointer = f"/provenance/freshnessObservations/{ordinal}"
        observation = _object(item, _FRESHNESS_KEYS, pointer)
        path = _relative_path(observation.get("path"), f"{pointer}/path")
        encoded_path = path.encode("utf-8", "strict")
        paths.append(encoded_path)
        preopen = _validate_file_stat(observation.get("preopen"), f"{pointer}/preopen")
        postread = _validate_file_stat(observation.get("postread"), f"{pointer}/postread")
        expected_binding = bound_artifacts.get(path)
        if (
            observation.get("stable") is not True
            or preopen != postread
            or expected_binding is None
            or preopen[-2:] != expected_binding
        ):
            raise DescriptorError("freshness_mismatch", pointer)
    folded_paths = [
        unicodedata.normalize("NFC", path.decode("utf-8", "strict").casefold())
        for path in paths
    ]
    if (
        paths != sorted(paths)
        or len(set(paths)) != len(paths)
        or len(set(folded_paths)) != len(folded_paths)
        or set(path.decode("utf-8", "strict") for path in paths)
        != set(bound_artifacts)
    ):
        raise DescriptorError(
            "freshness_mismatch", "/provenance/freshnessObservations"
        )


def _validate_provenance(value: object) -> None:
    provenance = _object(value, _PROVENANCE_KEYS, "/provenance")
    argv = provenance.get("commandArgv")
    if type(argv) is not FrozenJsonArray or not 1 <= len(argv.items) <= 256:
        raise DescriptorError("json_schema_mismatch", "/provenance/commandArgv")
    if any(type(arg) is not str or not arg or "\x00" in arg for arg in argv.items):
        raise DescriptorError("json_schema_mismatch", "/provenance/commandArgv")
    commit = _string(provenance.get("commit40"), "/provenance/commit40")
    if _HEX40.fullmatch(commit) is None:
        raise DescriptorError("json_schema_mismatch", "/provenance/commit40")
    _hash(provenance.get("dirtyTreeDigestSha256"), "/provenance/dirtyTreeDigestSha256")
    _hash(provenance.get("outputRootIdentitySha256"), "/provenance/outputRootIdentitySha256")
    bound_artifacts: dict[str, tuple[str, int]] = {}
    media_types = {
        "executableBinding": "application/octet-stream",
        "preexecutionPresealBinding": "application/json",
        "runtimeManifestBinding": "application/json",
        "sourceManifestBinding": "application/json",
        "toolchainManifestBinding": "application/json",
    }
    for field, expected_media_type in media_types.items():
        path, digest, size = _raw_binding(
            provenance.get(field), f"/provenance/{field}", expected_media_type
        )
        folded = unicodedata.normalize("NFC", path.casefold())
        if path in bound_artifacts or any(
            unicodedata.normalize("NFC", candidate.casefold()) == folded
            for candidate in bound_artifacts
        ):
            raise DescriptorError("freshness_mismatch", f"/provenance/{field}/path")
        bound_artifacts[path] = (digest, size)
    _validate_freshness(provenance.get("freshnessObservations"), bound_artifacts)
    _validate_timing(provenance.get("timing"))


def validate_source_descriptor(
    document: CanonicalJsonDocument,
) -> ValidatedSourceDescriptor:
    if type(document) is not CanonicalJsonDocument or document.document_class != "descriptor":
        raise DescriptorError("json_schema_mismatch", "/")
    try:
        reparsed = parse_canonical_json_bytes(document.raw_bytes, "descriptor")
    except CanonicalJsonError as error:
        raise DescriptorError("descriptor_document_binding_mismatch", "/") from error
    if (
        document.raw_bytes != reparsed.raw_bytes
        or document.plain_sha256 != reparsed.plain_sha256
        or document.root != reparsed.root
        or document.node_count != reparsed.node_count
        or document.token_count != reparsed.token_count
    ):
        raise DescriptorError("descriptor_document_binding_mismatch", "/")
    document = reparsed
    scan_document_for_forbidden_roles(document)
    descriptor = _object(document.root, _DESCRIPTOR_KEYS, "/")
    if descriptor.get("attemptOrdinal") != 1 or descriptor.get("authorityFalse") is not True:
        raise DescriptorError("json_schema_mismatch", "/")
    if descriptor.get("candidateId") != SOURCE_CANDIDATE_ID:
        raise DescriptorError("source_candidate_id_mismatch", "/candidateId")
    if descriptor.get("schemaVersion") != DESCRIPTOR_SCHEMA_VERSION:
        raise DescriptorError("json_schema_mismatch", "/schemaVersion")
    _validate_policy_bindings(descriptor.get("policyBindings"))

    bindings = _array(descriptor.get("orderedPayloadBindings"), 5, "/orderedPayloadBindings")
    payloads: list[PayloadHashInput] = []
    for ordinal, (value, expected) in enumerate(zip(bindings.items, _EXPECTED_PAYLOADS, strict=True)):
        pointer = f"/orderedPayloadBindings/{ordinal}"
        binding = _object(value, _PAYLOAD_KEYS, pointer)
        path, role, count, size = expected
        if (
            binding.get("elementCount") != count
            or binding.get("elementType") != "IEEE754_binary64_little_endian"
            or binding.get("path") != path
            or binding.get("semanticRole") != role
            or binding.get("sizeBytes") != size
        ):
            raise DescriptorError("numeric_payload_hash_or_shape_mismatch", pointer)
        raw_hash = _hash(binding.get("rawSha256"), f"{pointer}/rawSha256")
        payload_hash = _hash(binding.get("payloadSha256"), f"{pointer}/payloadSha256")
        payload = PayloadHashInput(path, size, raw_hash)
        if payload_hash != payload_binding_sha256(payload):
            raise DescriptorError("numeric_payload_hash_or_shape_mismatch", pointer)
        payloads.append(payload)

    _validate_provenance(descriptor.get("provenance"))
    descriptor_hash = descriptor_sha256(document.raw_bytes)
    frozen_payloads = tuple(payloads)
    return ValidatedSourceDescriptor(
        descriptor_sha256=descriptor_hash,
        source_input_binding_sha256=input_binding_sha256(
            descriptor_hash, frozen_payloads
        ),
        source_candidate_id=SOURCE_CANDIDATE_ID,
        payloads=frozen_payloads,
        provenance_structurally_valid=True,
    )


AUTHORITY_LOCKS: Final = MappingProxyType(
    {
        "provenanceAuthoritative": False,
        "v2CandidateBindingPresent": False,
        "executionAuthorized": False,
        "candidateAccepted": False,
        "replayAuthority": False,
        "diagnosticPass": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
    }
)

if any(AUTHORITY_LOCKS.values()):
    raise RuntimeError("descriptor_authority_lock_invalid")
