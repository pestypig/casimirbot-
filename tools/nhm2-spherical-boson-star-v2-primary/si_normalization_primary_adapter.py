"""Primary, calculation-only direct-ABI SI normalization adapter.

The adapter authenticates and privately executes one exact runtime-lease source
file, acquires its zero-input lease before inspecting caller CODATA bytes, and
evaluates only the frozen 49-node directed and 27-node central normalization
graphs.  It emits no arrays, touches no candidate or output root, and grants no
execution, replay, lamp, theory, or physical authority.

The checked-in runtime manifest is deliberately null, so the public entry point
currently fails closed.  A module-private marker-gated seam exists solely to
exercise the exact adapter graph against the runtime module's synthetic test
provider.  Synthetic receipts remain explicitly non-native and non-authoritative.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat
import struct
import sys
import types
from typing import Any, Callable, Final
import weakref


RUNTIME_SOURCE_RAW_SHA256: Final[str] = (
    "deb4b7519929db338b3586ecbb217c8cac6f4a6b0daf2a86654a9696e3c403ac"
)
RUNTIME_SOURCE_RAW_SIZE_BYTES: Final[int] = 165_492
SI_V2_SEMANTIC_SHA256: Final[str] = (
    "6af028d078ecc4cc9076eb45476fd87ac448503170e88fccf0ada3a98d06cafb"
)
SI_V2_CANONICAL_SIZE_BYTES: Final[int] = 15_246
SI_V2_SOURCE_RAW_SHA256: Final[str] = (
    "6d5d539b5c93409b6a0afefe0afdf9c32aa27f98fb1d133efb8c6d19e66a86cc"
)
SI_V2_SOURCE_RAW_SIZE_BYTES: Final[int] = 26_854
SI_V1_SEMANTIC_SHA256: Final[str] = (
    "16224114ce7bc790d1e5ceeaf8f75e31e5c37412856c5bea8b99284301bf3c24"
)
SI_V1_CANONICAL_SIZE_BYTES: Final[int] = 23_822
CODATA_RAW_SHA256: Final[str] = (
    "5a7e10ed709577c224cf45f78199dd143a7f9cf10d6f8fe8c018e168454b7a61"
)
CODATA_RAW_SIZE_BYTES: Final[int] = 6_180
PRECISION_BITS: Final[int] = 256

SCALE_IDS: Final[tuple[str, ...]] = (
    "mu_E_central",
    "mu_L_central",
    "stress_scale_central_via_mu",
    "stress_scale_central_closed",
    "noise_scale_central",
    "mu_E_one_sigma",
    "mu_L_one_sigma",
    "stress_scale_one_sigma",
    "noise_scale_one_sigma",
    "mu_E_admission_k2",
    "mu_L_admission_k2",
    "stress_scale_admission_k2",
    "noise_scale_admission_k2",
)

CENTRAL_SCALE_IDS: Final[tuple[str, ...]] = (
    "mu_E_central",
    "mu_L_central",
    "stress_scale_central_closed",
    "noise_scale_central",
)

_FORBIDDEN_FLAGS_IN_ORDER: Final[tuple[str, ...]] = (
    "invalid",
    "divide_by_zero",
    "overflow",
    "underflow",
    "erange",
)

_COMMON_BLOCKERS: Final[tuple[str, ...]] = (
    "adapter_source_identity_is_self_observed_not_server_authenticated",
    "runtime_receipt_is_diagnostic_not_server_authenticated",
    "primary_receipt_not_persisted_or_server_rehashed",
    "source_disjoint_independent_si_implementation_absent",
    "independent_receipt_and_zero_ulp_agreement_absent",
    "candidate_manifest_and_scientific_preseal_absent",
    "candidate_execution_replay_and_lamps_not_authorized",
)

_SYNTHETIC_BLOCKER: Final[str] = (
    "synthetic_test_provider_not_production_native_conformance"
)

_EXPECTED_SEMANTIC_RESULT_GOLDEN_SHA256: Final[str] = (
    "4b3143ac7c3a4ae0c2d0c5f08437d499aae73f5af5d63d7a3dd8fab1ee95946b"
)
_EXPECTED_DIRECTED_ENDPOINT_GOLDEN_SHA256: Final[str] = (
    "911e0b2fb17a181314fb80ed763b7961b9333f2c8e2c6bc9eec51e0ebea85b27"
)
_EXPECTED_CENTRAL_BINARY64_BITS: Final[tuple[tuple[str, str], ...]] = (
    ("mu_E_central", "407741b3ca65dd49"),
    ("mu_L_central", "45c303e3734e84e7"),
    ("stress_scale_central_closed", "547384e1ead3be5c"),
    ("noise_scale_central", "68f7cfe829cf73d8"),
)


class PrimarySiNormalizationError(RuntimeError):
    """Typed failure at the primary calculation-only adapter boundary."""

    def __init__(self, code: str, detail: str | None = None) -> None:
        super().__init__(code if detail is None else f"{code}:{detail}")
        self.code = code
        self.detail = detail


@dataclass(frozen=True, slots=True)
class CanonicalDyadic:
    sign: str
    mantissa_lowercase_hex: str
    exponent2: int
    precision_bits: int
    direction: str

    def __post_init__(self) -> None:
        if (
            self.sign not in {"+", "-"}
            or re.fullmatch(r"[0-9a-f]+", self.mantissa_lowercase_hex) is None
            or self.mantissa_lowercase_hex.startswith("0")
            or int(self.mantissa_lowercase_hex, 16) <= 0
            or int(self.mantissa_lowercase_hex, 16) & 1 == 0
            or type(self.exponent2) is not int
            or self.precision_bits not in {53, PRECISION_BITS}
            or self.direction not in {"RNDD", "RNDU", "RNDN"}
        ):
            raise ValueError("canonical dyadic invariant violated")


@dataclass(frozen=True, slots=True)
class DirectedScaleReceipt:
    scale_id: str
    lower: CanonicalDyadic
    upper: CanonicalDyadic


@dataclass(frozen=True, slots=True)
class CentralScaleReceipt:
    scale_id: str
    value: CanonicalDyadic
    binary64_bits: str

    def __post_init__(self) -> None:
        if re.fullmatch(r"[0-9a-f]{16}", self.binary64_bits) is None:
            raise ValueError("central binary64 bits invalid")


@dataclass(frozen=True, slots=True)
class SemanticTraceEntry:
    ordinal: int
    label: str
    primitive: str
    rounding_mode: str
    ternary_sign: int
    forbidden_flags_in_frozen_order: tuple[bool, bool, bool, bool, bool]
    canonical_result_dyadic: CanonicalDyadic

    def __post_init__(self) -> None:
        if (
            type(self.ordinal) is not int
            or self.ordinal < 0
            or type(self.label) is not str
            or not self.label
            or type(self.primitive) is not str
            or not self.primitive.startswith("mpfr_")
            or self.rounding_mode not in {"RNDD", "RNDU", "RNDN"}
            or self.ternary_sign not in {-1, 0, 1}
            or self.forbidden_flags_in_frozen_order != (False,) * 5
        ):
            raise ValueError("semantic trace invariant violated")


@dataclass(frozen=True, slots=True, weakref_slot=True)
class PrimarySiNormalizationReceipt:
    lane: str
    calculation_only: bool
    synthetic_test_provider: bool
    runtime_source_raw_sha256: str
    runtime_source_raw_size_bytes: int
    runtime_executed_from_authenticated_bytes: bool
    si_v2_semantic_sha256: str
    si_v2_canonical_size_bytes: int
    si_v2_source_raw_sha256: str
    si_v2_source_raw_size_bytes: int
    si_v1_semantic_sha256: str
    si_v1_canonical_size_bytes: int
    codata_raw_sha256: str
    codata_raw_size_bytes: int
    adapter_source_observed_sha256: str
    adapter_source_observed_size_bytes: int
    directed_graph_node_count: int
    central_graph_node_count: int
    rounded_operation_count: int
    terminal_get_d_count: int
    semantic_trace: tuple[SemanticTraceEntry, ...]
    scales: tuple[DirectedScaleReceipt, ...]
    central_scales: tuple[CentralScaleReceipt, ...]
    central_via_mu_overlaps_closed: bool
    exact_operation_chronology_validated: bool
    forbidden_flags_validated: bool
    canonical_dyadics_validated: bool
    semantic_si_operation_labels_bound: bool
    runtime_receipt_snapshot_text: str
    runtime_receipt_snapshot_sha256: str
    runtime_lifecycle_complete: bool
    production_native_runtime_observed: bool
    module_local_origin_check_only: bool
    server_authenticated: bool
    primary_receipt_persisted: bool
    pair_comparison_ready: bool
    pair_comparison_observed: bool
    independent_agreement: bool
    candidate_ready: bool
    execution_ready: bool
    execution_authority: bool
    replay_ready: bool
    replay_authority: bool
    publication_ready: bool
    publication_authority: bool
    scientific_preseal_authority: bool
    scientific_authority: bool
    diagnostic_pass: bool
    semiclassical_stress_noise_lamp: bool
    semiclassical_constraint_algebra_lamp: bool
    theory_graph_promotion: bool
    physical_viability: bool
    propulsion: bool
    transport: bool
    implementation_blockers: tuple[str, ...]

    def __post_init__(self) -> None:
        if (
            self.lane != "primary"
            or self.calculation_only is not True
            or self.runtime_source_raw_sha256 != RUNTIME_SOURCE_RAW_SHA256
            or self.runtime_source_raw_size_bytes != RUNTIME_SOURCE_RAW_SIZE_BYTES
            or self.runtime_executed_from_authenticated_bytes is not True
            or self.si_v2_semantic_sha256 != SI_V2_SEMANTIC_SHA256
            or self.si_v2_canonical_size_bytes != SI_V2_CANONICAL_SIZE_BYTES
            or self.si_v2_source_raw_sha256 != SI_V2_SOURCE_RAW_SHA256
            or self.si_v2_source_raw_size_bytes != SI_V2_SOURCE_RAW_SIZE_BYTES
            or self.si_v1_semantic_sha256 != SI_V1_SEMANTIC_SHA256
            or self.si_v1_canonical_size_bytes != SI_V1_CANONICAL_SIZE_BYTES
            or self.codata_raw_sha256 != CODATA_RAW_SHA256
            or self.codata_raw_size_bytes != CODATA_RAW_SIZE_BYTES
            or re.fullmatch(r"[0-9a-f]{64}", self.adapter_source_observed_sha256)
            is None
            or type(self.adapter_source_observed_size_bytes) is not int
            or self.adapter_source_observed_size_bytes <= 0
            or self.directed_graph_node_count != 49
            or self.central_graph_node_count != 27
            or self.rounded_operation_count != 139
            or self.terminal_get_d_count != 4
            or tuple(entry.ordinal for entry in self.semantic_trace)
            != tuple(range(139))
            or tuple(entry.label for entry in self.semantic_trace)
            != tuple(item[0] for item in _EXPECTED_ROUNDED_TRACE)
            or tuple(entry.primitive for entry in self.semantic_trace)
            != tuple(item[1] for item in _EXPECTED_ROUNDED_TRACE)
            or tuple(entry.rounding_mode for entry in self.semantic_trace)
            != tuple(item[2] for item in _EXPECTED_ROUNDED_TRACE)
            or tuple(item.scale_id for item in self.scales) != SCALE_IDS
            or tuple(item.scale_id for item in self.central_scales)
            != CENTRAL_SCALE_IDS
        ):
            raise ValueError("primary SI receipt identity violated")
        required_true = (
            self.central_via_mu_overlaps_closed,
            self.exact_operation_chronology_validated,
            self.forbidden_flags_validated,
            self.canonical_dyadics_validated,
            self.semantic_si_operation_labels_bound,
            self.runtime_lifecycle_complete,
            self.module_local_origin_check_only,
        )
        if any(value is not True for value in required_true):
            raise ValueError("primary SI calculation truth lock violated")
        required_false = (
            self.server_authenticated,
            self.primary_receipt_persisted,
            self.pair_comparison_ready,
            self.pair_comparison_observed,
            self.independent_agreement,
            self.candidate_ready,
            self.execution_ready,
            self.execution_authority,
            self.replay_ready,
            self.replay_authority,
            self.publication_ready,
            self.publication_authority,
            self.scientific_preseal_authority,
            self.scientific_authority,
            self.diagnostic_pass,
            self.semiclassical_stress_noise_lamp,
            self.semiclassical_constraint_algebra_lamp,
            self.theory_graph_promotion,
            self.physical_viability,
            self.propulsion,
            self.transport,
        )
        if any(value is not False for value in required_false):
            raise ValueError("primary SI authority lock violated")
        expected_blockers = (
            ((_SYNTHETIC_BLOCKER,) if self.synthetic_test_provider else ())
            + _COMMON_BLOCKERS
        )
        if self.implementation_blockers != expected_blockers:
            raise ValueError("primary SI blocker inventory violated")
        if self.production_native_runtime_observed is self.synthetic_test_provider:
            raise ValueError("primary SI runtime-kind invariant violated")
        _validate_runtime_snapshot_pair(
            self.runtime_receipt_snapshot_text,
            self.runtime_receipt_snapshot_sha256,
        )


@dataclass(frozen=True, slots=True)
class _Interval:
    lower: object
    upper: object


@dataclass(frozen=True, slots=True)
class _StagedTrace:
    label: str
    primitive: str
    runtime_operation: str
    rounding_mode: str
    ternary_sign: int
    canonical_result: CanonicalDyadic


def _read_exact_runtime_source() -> tuple[bytes, Path]:
    adapter_path = Path(__file__).resolve(strict=True)
    runtime_path = adapter_path.with_name("mpfr256_runtime_conformance.py")
    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_CLOEXEC", 0)
    descriptor = os.open(runtime_path, flags)
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode) or before.st_size != RUNTIME_SOURCE_RAW_SIZE_BYTES:
            raise RuntimeError("primary_si_runtime_source_identity_invalid")
        chunks: list[bytes] = []
        remaining = RUNTIME_SOURCE_RAW_SIZE_BYTES + 1
        while remaining:
            block = os.read(descriptor, min(1_048_576, remaining))
            if not block:
                break
            chunks.append(block)
            remaining -= len(block)
        raw = b"".join(chunks)
        after = os.fstat(descriptor)
        if (
            len(raw) != RUNTIME_SOURCE_RAW_SIZE_BYTES
            or (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns)
            != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns)
            or hashlib.sha256(raw).hexdigest() != RUNTIME_SOURCE_RAW_SHA256
        ):
            raise RuntimeError("primary_si_runtime_source_hash_mismatch")
        return raw, runtime_path
    finally:
        os.close(descriptor)


def _load_private_runtime() -> Any:
    raw, runtime_path = _read_exact_runtime_source()
    module_name = (
        "_nhm2_primary_si_runtime_"
        + hashlib.sha256((__name__ + RUNTIME_SOURCE_RAW_SHA256).encode("utf-8")).hexdigest()[:24]
    )
    if module_name in sys.modules:
        raise RuntimeError("primary_si_private_runtime_name_collision")
    module = types.ModuleType(module_name)
    module.__file__ = str(runtime_path)
    module.__package__ = ""
    sys.modules[module_name] = module
    try:
        exec(compile(raw, str(runtime_path), "exec"), module.__dict__)
    except BaseException:
        sys.modules.pop(module_name, None)
        raise
    return module


_RUNTIME = _load_private_runtime()
_TEST_ONLY_MARKER = object()


def _fraction_from_decimal(value: str) -> Fraction:
    match = re.fullmatch(
        r"(?P<sign>[+-]?)(?P<int>[0-9]+)(?:\.(?P<frac>[0-9]+))?(?:e(?P<exp>[+-]?[0-9]+))?",
        value,
    )
    if match is None:
        raise PrimarySiNormalizationError("frozen_decimal_invalid", value)
    fraction = match.group("frac") or ""
    digits = int(match.group("int") + fraction)
    exponent10 = int(match.group("exp") or "0") - len(fraction)
    result = Fraction(digits, 1)
    result = result * (10**exponent10) if exponent10 >= 0 else result / (10 ** -exponent10)
    return -result if match.group("sign") == "-" else result


def _dyadic_fraction(value: CanonicalDyadic) -> Fraction:
    magnitude = int(value.mantissa_lowercase_hex, 16)
    numerator = -magnitude if value.sign == "-" else magnitude
    if value.exponent2 >= 0:
        return Fraction(numerator << value.exponent2, 1)
    return Fraction(numerator, 1 << -value.exponent2)


def _canonical_from_integer_exponent(
    mantissa: int,
    exponent2: int,
    direction: str,
    *,
    precision_bits: int = PRECISION_BITS,
) -> CanonicalDyadic:
    if type(mantissa) is not int or mantissa == 0 or type(exponent2) is not int:
        raise PrimarySiNormalizationError("canonical_dyadic_zero_or_invalid")
    sign_text = "-" if mantissa < 0 else "+"
    magnitude = abs(mantissa)
    while magnitude & 1 == 0:
        magnitude >>= 1
        exponent2 += 1
    return CanonicalDyadic(
        sign=sign_text,
        mantissa_lowercase_hex=f"{magnitude:x}",
        exponent2=exponent2,
        precision_bits=precision_bits,
        direction=direction,
    )


def _binary64_dyadic(value: float, direction: str) -> CanonicalDyadic:
    if type(value) is not float or not math.isfinite(value) or value == 0.0:
        raise PrimarySiNormalizationError("central_binary64_invalid")
    numerator, denominator = value.as_integer_ratio()
    exponent2 = -(denominator.bit_length() - 1)
    return _canonical_from_integer_exponent(
        numerator, exponent2, direction, precision_bits=53
    )


def _float_bits(value: float) -> str:
    if type(value) is not float or not math.isfinite(value):
        raise PrimarySiNormalizationError("central_binary64_invalid")
    bits = struct.unpack(">Q", struct.pack(">d", value))[0]
    if bits == 0x8000_0000_0000_0000:
        raise PrimarySiNormalizationError("central_binary64_negative_zero")
    return f"{bits:016x}"


def _dyadic_golden_projection(value: CanonicalDyadic) -> dict[str, object]:
    if type(value) is not CanonicalDyadic:
        raise PrimarySiNormalizationError("golden_dyadic_type_invalid")
    return {
        "direction": value.direction,
        "exponent2": value.exponent2,
        "mantissaLowercaseHex": value.mantissa_lowercase_hex,
        "precisionBits": value.precision_bits,
        "sign": value.sign,
    }


def _golden_digest(domain: bytes, payload: object) -> str:
    canonical = json.dumps(
        payload, ensure_ascii=True, separators=(",", ":"), sort_keys=True
    ).encode("ascii")
    return hashlib.sha256(
        domain + struct.pack("<Q", len(canonical)) + canonical
    ).hexdigest()


def _semantic_result_golden_sha256(
    trace: tuple[SemanticTraceEntry, ...],
) -> str:
    if type(trace) is not tuple or len(trace) != 139:
        raise PrimarySiNormalizationError("semantic_result_golden_shape_invalid")
    payload = [
        {
            "canonicalResultDyadic": _dyadic_golden_projection(
                item.canonical_result_dyadic
            ),
            "label": item.label,
            "ordinal": item.ordinal,
        }
        for item in trace
    ]
    return _golden_digest(
        b"nhm2-spherical-boson-star-v2/primary-si-semantic-result-golden/v1\n",
        payload,
    )


def _directed_endpoint_golden_sha256(
    scales: tuple[DirectedScaleReceipt, ...],
) -> str:
    if type(scales) is not tuple or len(scales) != 13:
        raise PrimarySiNormalizationError("directed_endpoint_golden_shape_invalid")
    payload = [
        {
            "lower": _dyadic_golden_projection(item.lower),
            "scaleId": item.scale_id,
            "upper": _dyadic_golden_projection(item.upper),
        }
        for item in scales
    ]
    return _golden_digest(
        b"nhm2-spherical-boson-star-v2/primary-si-directed-endpoint-golden/v1\n",
        payload,
    )


def _sign_of_comparison(left: Fraction, right: Fraction) -> int:
    return (left > right) - (left < right)


def _runtime_snapshot_digest(text: str) -> str:
    try:
        raw = text.encode("ascii", "strict")
    except (AttributeError, UnicodeEncodeError) as error:
        raise PrimarySiNormalizationError("runtime_snapshot_text_invalid") from error
    domain = b"nhm2-spherical-boson-star-v2/runtime-lease-receipt-snapshot/v2\n"
    return hashlib.sha256(domain + struct.pack("<Q", len(raw)) + raw).hexdigest()


def _validate_runtime_snapshot_pair(text: str, digest: str) -> None:
    if (
        type(text) is not str
        or len(text) > 32 * 1024 * 1024
        or type(digest) is not str
        or re.fullmatch(r"[0-9a-f]{64}", digest) is None
        or _runtime_snapshot_digest(text) != digest
    ):
        raise ValueError("runtime receipt snapshot binding violated")


_RUNTIME_SNAPSHOT_KEYS: Final[tuple[str, ...]] = (
    "artifact_id",
    "contract_version",
    "provider_kind",
    "trusted_manifest_installed",
    "trusted_manifest_sha256",
    "trusted_manifest_size_bytes",
    "real_linux_glibc_integration_observed",
    "synthetic_test_provider",
    "calculation_only",
    "runtime_conformance_diagnostic_only",
    "operations_issued_through_this_live_lease",
    "safe_finite_number_predicate_exposed",
    "precision_256_verified_for_every_allocated_mpfr_object",
    "storage_nonalias_verified_for_every_allocated_mpfr_object",
    "semantic_si_operation_labels_bound",
    "expected_directed_rounded_operation_count",
    "expected_central_rndn_operation_count",
    "expected_terminal_get_d_count",
    "expected_total_rounded_operation_count",
    "observed_rounded_operation_count",
    "observed_terminal_get_d_count",
    "operation_inventory",
    "operation_trace",
    "operation_trace_sha256",
    "generation",
    "mpfr_object_count",
    "mpz_object_count",
    "reverse_object_clear_complete",
    "context_restored_exact",
    "flags_restored_exact",
    "runtime_unloaded_and_fds_closed",
    "lifecycle_complete",
    "canary",
    "source_libraries",
    "loaded_libraries",
    "abi",
    "implementation_blockers",
    "runtime_conformance_authority",
    "candidate_ready",
    "execution_ready",
    "execution_authority",
    "replay_ready",
    "replay_authority",
    "publication_ready",
    "publication_authority",
    "scientific_preseal_authority",
    "scientific_authority",
    "independent_agreement",
    "diagnostic_pass",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp",
    "theory_graph_promotion",
    "physical_viability",
    "propulsion",
    "transport",
)

_RUNTIME_OPERATION_INVENTORY: Final[tuple[str, ...]] = (
    "allocate_mpfr256",
    "allocate_mpz",
    "mpz_set_ui",
    "mpz_set_si",
    "mpz_set_decimal",
    "mpz_decimal",
    "mpfr_set_ui",
    "mpfr_set_si",
    "mpfr_set_decimal",
    "mpfr_set_z",
    "mpfr_set",
    "mpfr_mul_2si",
    "mpfr_add",
    "mpfr_sub",
    "mpfr_mul",
    "mpfr_div",
    "mpfr_sqrt",
    "mpfr_const_pi",
    "mpfr_compare",
    "mpfr_compare_ui",
    "mpfr_compare_z",
    "mpfr_equal",
    "mpfr_get_z_2exp",
    "mpfr_get_d",
    "mpfr_number",
    "mpfr_precision",
)

_RUNTIME_SYNTHETIC_BLOCKERS: Final[tuple[str, ...]] = (
    "synthetic_test_provider_not_production_conformance",
    "trusted_runtime_manifest_not_installed",
    "real_linux_glibc_integration_not_observed",
    "independent_runtime_lane_absent",
    "server_authenticated_runtime_loader_observer_absent",
    "transitive_runtime_closure_unbound",
    "host_loader_and_procfs_identity_not_authenticated",
    "candidate_execution_and_publication_not_authorized",
    "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
    "post_close_binding_requires_validated_immutable_receipt_snapshot",
)

_RUNTIME_NATIVE_BLOCKERS: Final[tuple[str, ...]] = (
    "runtime_conformance_receipt_is_diagnostic_binding_only",
    "independent_runtime_lane_absent",
    "server_authenticated_runtime_loader_observer_absent",
    "transitive_runtime_closure_unbound",
    "host_loader_and_procfs_identity_not_authenticated",
    "candidate_execution_and_publication_not_authorized",
    "semantic_si_operation_labels_bound_by_future_adapter_not_runtime_lease",
    "post_close_binding_requires_validated_immutable_receipt_snapshot",
)

_TRACE_KEYS: Final[tuple[str, ...]] = (
    "ordinal",
    "operation",
    "rounding",
    "destination_ordinal",
    "source_ordinals",
    "ternary_result",
    "inexact_flag",
    "forbidden_flags_clear",
)
_FILE_IDENTITY_KEYS: Final[tuple[str, ...]] = (
    "device",
    "inode",
    "mode",
    "link_count",
    "size_bytes",
    "mtime_ns",
    "ctime_ns",
)
_ELF_IDENTITY_KEYS: Final[tuple[str, ...]] = (
    "elf_class",
    "byte_order",
    "object_type",
    "machine",
    "soname",
    "needed",
)
_SOURCE_LIBRARY_KEYS: Final[tuple[str, ...]] = (
    "component",
    "canonical_path",
    "identity",
    "sha256_first_pass",
    "sha256_second_pass",
    "sha256_after_load",
    "elf",
    "nofollow_segment_traversal",
    "single_link_regular_file",
    "source_inode_loaded_directly",
)
_LOADED_LIBRARY_KEYS: Final[tuple[str, ...]] = (
    "component",
    "sealed_memfd_name",
    "identity",
    "sha256",
    "seal_mask",
    "required_seal_mask",
    "seals_exact",
    "loader_procfd_path",
    "loader_link_map_name",
    "dladdr_name",
    "maps_path",
    "representative_symbol",
    "maps_device_inode_exact",
    "link_map_dladdr_exact",
    "source_inode_loaded_directly",
)
_ABI_KEYS: Final[tuple[str, ...]] = (
    "platform_system",
    "machine",
    "byte_order",
    "pointer_bits",
    "c_long_bits",
    "c_int_bits",
    "c_ulong_bits",
    "mpfr_struct_size_bytes",
    "mpfr_struct_offsets",
    "mpz_struct_size_bytes",
    "mpz_struct_offsets",
    "gmp_limb_bits",
    "mpfr_tls_enabled",
    "abi_exact",
)
_CANARY_KEYS: Final[tuple[str, ...]] = (
    "precision_bits",
    "lower_ternary",
    "upper_ternary",
    "lower_binary64_bits",
    "upper_binary64_bits",
    "strict_interval_observed",
    "inexact_flag_observed",
    "forbidden_flags_clear",
    "reverse_cleanup_complete",
)


@dataclass(frozen=True, slots=True)
class _SnapshotTraceEntry:
    ordinal: int
    operation: str
    rounding: str | None
    destination_ordinal: int | None
    source_ordinals: tuple[int, ...]
    ternary_result: int | None
    inexact_flag: bool
    forbidden_flags_clear: bool


@dataclass(frozen=True, slots=True)
class _ValidatedRuntimeSnapshot:
    synthetic_test_provider: bool
    operation_trace: tuple[_SnapshotTraceEntry, ...]


def _snapshot_object(
    value: object, keys: tuple[str, ...], label: str
) -> dict[str, object]:
    if type(value) is not dict or tuple(value.keys()) != keys:
        raise ValueError(f"runtime receipt snapshot {label} schema invalid")
    return value


def _snapshot_list(value: object, label: str, maximum: int) -> list[object]:
    if type(value) is not list or len(value) > maximum:
        raise ValueError(f"runtime receipt snapshot {label} list invalid")
    return value


def _snapshot_text(value: object, label: str) -> str:
    if type(value) is not str or len(value.encode("utf-8", "strict")) > 32_768:
        raise ValueError(f"runtime receipt snapshot {label} text invalid")
    return value


def _snapshot_int(value: object, label: str) -> int:
    if type(value) is not int or value.bit_length() > 256:
        raise ValueError(f"runtime receipt snapshot {label} integer invalid")
    return value


def _snapshot_bool(value: object, label: str) -> bool:
    if type(value) is not bool:
        raise ValueError(f"runtime receipt snapshot {label} boolean invalid")
    return value


def _validate_file_identity(value: object, label: str) -> None:
    identity = _snapshot_object(value, _FILE_IDENTITY_KEYS, label)
    for key in _FILE_IDENTITY_KEYS:
        _snapshot_int(identity[key], f"{label}.{key}")


def _validate_elf_identity(value: object, label: str) -> None:
    elf = _snapshot_object(value, _ELF_IDENTITY_KEYS, label)
    for key in _ELF_IDENTITY_KEYS[:-1]:
        _snapshot_text(elf[key], f"{label}.{key}")
    needed = _snapshot_list(elf["needed"], f"{label}.needed", 128)
    for index, item in enumerate(needed):
        _snapshot_text(item, f"{label}.needed[{index}]")


def _validate_source_library(value: object, label: str) -> None:
    binding = _snapshot_object(value, _SOURCE_LIBRARY_KEYS, label)
    for key in (
        "component",
        "canonical_path",
        "sha256_first_pass",
        "sha256_second_pass",
        "sha256_after_load",
    ):
        _snapshot_text(binding[key], f"{label}.{key}")
    _validate_file_identity(binding["identity"], f"{label}.identity")
    _validate_elf_identity(binding["elf"], f"{label}.elf")
    for key in (
        "nofollow_segment_traversal",
        "single_link_regular_file",
        "source_inode_loaded_directly",
    ):
        _snapshot_bool(binding[key], f"{label}.{key}")


def _validate_loaded_library(value: object, label: str) -> None:
    binding = _snapshot_object(value, _LOADED_LIBRARY_KEYS, label)
    for key in (
        "component",
        "sealed_memfd_name",
        "sha256",
        "loader_procfd_path",
        "loader_link_map_name",
        "dladdr_name",
        "maps_path",
        "representative_symbol",
    ):
        _snapshot_text(binding[key], f"{label}.{key}")
    _validate_file_identity(binding["identity"], f"{label}.identity")
    for key in ("seal_mask", "required_seal_mask"):
        _snapshot_int(binding[key], f"{label}.{key}")
    for key in (
        "seals_exact",
        "maps_device_inode_exact",
        "link_map_dladdr_exact",
        "source_inode_loaded_directly",
    ):
        _snapshot_bool(binding[key], f"{label}.{key}")


def _validate_abi(value: object) -> None:
    abi = _snapshot_object(value, _ABI_KEYS, "abi")
    for key in ("platform_system", "machine", "byte_order"):
        _snapshot_text(abi[key], f"abi.{key}")
    for key in (
        "pointer_bits",
        "c_long_bits",
        "c_int_bits",
        "c_ulong_bits",
        "mpfr_struct_size_bytes",
        "mpz_struct_size_bytes",
        "gmp_limb_bits",
    ):
        _snapshot_int(abi[key], f"abi.{key}")
    for key, length in (("mpfr_struct_offsets", 4), ("mpz_struct_offsets", 3)):
        offsets = _snapshot_list(abi[key], f"abi.{key}", length)
        if len(offsets) != length:
            raise ValueError(f"runtime receipt snapshot abi.{key} length invalid")
        for index, offset in enumerate(offsets):
            _snapshot_int(offset, f"abi.{key}[{index}]")
    for key in ("mpfr_tls_enabled", "abi_exact"):
        _snapshot_bool(abi[key], f"abi.{key}")


def _validate_canary(value: object) -> None:
    canary = _snapshot_object(value, _CANARY_KEYS, "canary")
    for key in ("precision_bits", "lower_ternary", "upper_ternary"):
        _snapshot_int(canary[key], f"canary.{key}")
    for key in ("lower_binary64_bits", "upper_binary64_bits"):
        bits = _snapshot_text(canary[key], f"canary.{key}")
        if re.fullmatch(r"[0-9a-f]{16}", bits) is None:
            raise ValueError(f"runtime receipt snapshot canary.{key} invalid")
    for key in (
        "strict_interval_observed",
        "inexact_flag_observed",
        "forbidden_flags_clear",
        "reverse_cleanup_complete",
    ):
        if _snapshot_bool(canary[key], f"canary.{key}") is not True:
            raise ValueError(f"runtime receipt snapshot canary.{key} false")
    if (
        canary["precision_bits"] != PRECISION_BITS
        or canary["lower_ternary"] != -1
        or canary["upper_ternary"] != 1
    ):
        raise ValueError("runtime receipt snapshot canary semantic invalid")


def _snapshot_trace_sha256(trace: tuple[_SnapshotTraceEntry, ...]) -> str:
    payload = [
        {
            "destinationOrdinal": item.destination_ordinal,
            "forbiddenFlagsClear": item.forbidden_flags_clear,
            "inexactFlag": item.inexact_flag,
            "operation": item.operation,
            "ordinal": item.ordinal,
            "rounding": item.rounding,
            "sourceOrdinals": item.source_ordinals,
            "ternaryResult": item.ternary_result,
        }
        for item in trace
    ]
    canonical = json.dumps(
        payload, ensure_ascii=True, separators=(",", ":"), sort_keys=True
    ).encode("ascii")
    domain = b"nhm2-spherical-boson-star-v2/runtime-lease-operation-trace/v1\n"
    return hashlib.sha256(domain + struct.pack("<Q", len(canonical)) + canonical).hexdigest()


def _parse_runtime_snapshot(text: str, digest: str) -> _ValidatedRuntimeSnapshot:
    _validate_runtime_snapshot_pair(text, digest)

    def reject_duplicate_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
        parsed_object: dict[str, object] = {}
        for key, value in pairs:
            if key in parsed_object:
                raise ValueError("runtime receipt snapshot duplicate key")
            parsed_object[key] = value
        return parsed_object

    try:
        parsed = json.loads(text, object_pairs_hook=reject_duplicate_keys)
    except (TypeError, ValueError) as error:
        raise ValueError("runtime receipt snapshot JSON invalid") from error
    receipt = _snapshot_object(parsed, _RUNTIME_SNAPSHOT_KEYS, "receipt")
    if (
        json.dumps(
            receipt, ensure_ascii=True, separators=(",", ":"), sort_keys=False
        )
        != text
    ):
        raise ValueError("runtime receipt snapshot canonical JSON invalid")

    if (
        _snapshot_text(receipt["artifact_id"], "artifact_id")
        != "nhm2.spherical_boson_star_v2.mpfr256_runtime_conformance_receipt"
        or _snapshot_text(receipt["contract_version"], "contract_version")
        != "nhm2_spherical_boson_star_v2_mpfr256_runtime_conformance/v2"
    ):
        raise ValueError("runtime receipt snapshot identity invalid")

    synthetic = _snapshot_bool(
        receipt["synthetic_test_provider"], "synthetic_test_provider"
    )
    provider_kind = _snapshot_text(receipt["provider_kind"], "provider_kind")
    trusted_manifest_installed = _snapshot_bool(
        receipt["trusted_manifest_installed"], "trusted_manifest_installed"
    )
    manifest_sha = receipt["trusted_manifest_sha256"]
    manifest_size = receipt["trusted_manifest_size_bytes"]
    linux_observed = _snapshot_bool(
        receipt["real_linux_glibc_integration_observed"],
        "real_linux_glibc_integration_observed",
    )
    if synthetic:
        if (
            provider_kind != "synthetic_test_only"
            or trusted_manifest_installed
            or manifest_sha is not None
            or manifest_size is not None
            or linux_observed
        ):
            raise ValueError("runtime receipt snapshot synthetic identity invalid")
    else:
        if (
            provider_kind != "linux_x86_64_sealed_memfd_dlmopen_diagnostic/v1"
            or trusted_manifest_installed is not True
            or type(manifest_sha) is not str
            or re.fullmatch(r"[0-9a-f]{64}", manifest_sha) is None
            or type(manifest_size) is not int
            or manifest_size <= 0
            or linux_observed is not True
        ):
            raise ValueError("runtime receipt snapshot native identity invalid")

    fixed_true = (
        "calculation_only",
        "runtime_conformance_diagnostic_only",
        "safe_finite_number_predicate_exposed",
        "precision_256_verified_for_every_allocated_mpfr_object",
        "storage_nonalias_verified_for_every_allocated_mpfr_object",
        "reverse_object_clear_complete",
        "context_restored_exact",
        "flags_restored_exact",
        "runtime_unloaded_and_fds_closed",
        "lifecycle_complete",
    )
    fixed_false = (
        "semantic_si_operation_labels_bound",
        "runtime_conformance_authority",
        "candidate_ready",
        "execution_ready",
        "execution_authority",
        "replay_ready",
        "replay_authority",
        "publication_ready",
        "publication_authority",
        "scientific_preseal_authority",
        "scientific_authority",
        "independent_agreement",
        "diagnostic_pass",
        "semiclassical_stress_noise_lamp",
        "semiclassical_constraint_algebra_lamp",
        "theory_graph_promotion",
        "physical_viability",
        "propulsion",
        "transport",
    )
    if any(_snapshot_bool(receipt[key], key) is not True for key in fixed_true):
        raise ValueError("runtime receipt snapshot lifecycle lock invalid")
    if any(_snapshot_bool(receipt[key], key) is not False for key in fixed_false):
        raise ValueError("runtime receipt snapshot authority lock invalid")

    inventory = _snapshot_list(receipt["operation_inventory"], "operation_inventory", 64)
    if tuple(inventory) != _RUNTIME_OPERATION_INVENTORY:
        raise ValueError("runtime receipt snapshot operation inventory invalid")
    for index, item in enumerate(inventory):
        _snapshot_text(item, f"operation_inventory[{index}]")

    raw_trace = _snapshot_list(receipt["operation_trace"], "operation_trace", 65_536)
    trace_items: list[_SnapshotTraceEntry] = []
    for index, raw_item in enumerate(raw_trace, start=1):
        item = _snapshot_object(raw_item, _TRACE_KEYS, f"operation_trace[{index - 1}]")
        ordinal = _snapshot_int(item["ordinal"], f"operation_trace[{index - 1}].ordinal")
        operation = _snapshot_text(
            item["operation"], f"operation_trace[{index - 1}].operation"
        )
        rounding = item["rounding"]
        destination = item["destination_ordinal"]
        ternary = item["ternary_result"]
        sources = _snapshot_list(
            item["source_ordinals"], f"operation_trace[{index - 1}].source_ordinals", 16
        )
        if (
            ordinal != index
            or operation not in _RUNTIME_OPERATION_INVENTORY
            or (
                rounding is not None
                and (
                    type(rounding) is not str
                    or rounding not in {"nearest_even", "upward", "downward"}
                )
            )
            or (
                destination is not None
                and (type(destination) is not int or destination <= 0)
            )
            or (
                ternary is not None
                and (type(ternary) is not int or ternary not in {-1, 0, 1})
            )
        ):
            raise ValueError("runtime receipt snapshot trace semantic invalid")
        source_ordinals = tuple(
            _snapshot_int(source, f"operation_trace[{index - 1}].source_ordinals")
            for source in sources
        )
        if any(source <= 0 for source in source_ordinals):
            raise ValueError("runtime receipt snapshot trace source invalid")
        inexact = _snapshot_bool(
            item["inexact_flag"], f"operation_trace[{index - 1}].inexact_flag"
        )
        forbidden_clear = _snapshot_bool(
            item["forbidden_flags_clear"],
            f"operation_trace[{index - 1}].forbidden_flags_clear",
        )
        if forbidden_clear is not True:
            raise ValueError("runtime receipt snapshot forbidden flag invalid")
        trace_items.append(
            _SnapshotTraceEntry(
                ordinal=ordinal,
                operation=operation,
                rounding=rounding,
                destination_ordinal=destination,
                source_ordinals=source_ordinals,
                ternary_result=ternary,
                inexact_flag=inexact,
                forbidden_flags_clear=forbidden_clear,
            )
        )
    trace = tuple(trace_items)
    trace_sha = _snapshot_text(receipt["operation_trace_sha256"], "operation_trace_sha256")
    if re.fullmatch(r"[0-9a-f]{64}", trace_sha) is None or _snapshot_trace_sha256(trace) != trace_sha:
        raise ValueError("runtime receipt snapshot trace digest invalid")

    expected_counts = {
        "expected_directed_rounded_operation_count": 107,
        "expected_central_rndn_operation_count": 28,
        "expected_terminal_get_d_count": 4,
        "expected_total_rounded_operation_count": 139,
        "observed_rounded_operation_count": 139,
        "observed_terminal_get_d_count": 4,
    }
    for key, expected in expected_counts.items():
        if _snapshot_int(receipt[key], key) != expected:
            raise ValueError("runtime receipt snapshot rounded count invalid")
    if (
        sum(item.rounding is not None for item in trace) != 139
        or sum(item.operation == "mpfr_get_d" for item in trace) != 4
        or _snapshot_bool(
            receipt["operations_issued_through_this_live_lease"],
            "operations_issued_through_this_live_lease",
        )
        is not bool(trace)
    ):
        raise ValueError("runtime receipt snapshot observed trace count invalid")

    for key in ("generation", "mpfr_object_count", "mpz_object_count"):
        value = _snapshot_int(receipt[key], key)
        if value < (1 if key == "generation" else 0):
            raise ValueError(f"runtime receipt snapshot {key} invalid")
    _validate_canary(receipt["canary"])
    source_libraries = _snapshot_list(receipt["source_libraries"], "source_libraries", 2)
    loaded_libraries = _snapshot_list(receipt["loaded_libraries"], "loaded_libraries", 2)
    if len(source_libraries) != 2 or len(loaded_libraries) != 2:
        raise ValueError("runtime receipt snapshot library inventory invalid")
    for index, binding in enumerate(source_libraries):
        _validate_source_library(binding, f"source_libraries[{index}]")
    for index, binding in enumerate(loaded_libraries):
        _validate_loaded_library(binding, f"loaded_libraries[{index}]")
    _validate_abi(receipt["abi"])

    blockers = _snapshot_list(receipt["implementation_blockers"], "implementation_blockers", 16)
    for index, blocker in enumerate(blockers):
        _snapshot_text(blocker, f"implementation_blockers[{index}]")
    expected_blockers = (
        _RUNTIME_SYNTHETIC_BLOCKERS if synthetic else _RUNTIME_NATIVE_BLOCKERS
    )
    if tuple(blockers) != expected_blockers:
        raise ValueError("runtime receipt snapshot blocker inventory invalid")
    return _ValidatedRuntimeSnapshot(
        synthetic_test_provider=synthetic,
        operation_trace=trace,
    )


class _Arithmetic:
    def __init__(self, lease: object) -> None:
        self.lease = lease
        self.scratch_mpz = lease.allocate_mpz()
        self.staged: list[_StagedTrace] = []
        self.result_by_label: dict[str, CanonicalDyadic] = {}

    def _canonical(self, value: object, direction: str) -> CanonicalDyadic:
        if self.lease.mpfr_number(value) is not True:
            raise PrimarySiNormalizationError("mpfr_nonfinite_result")
        if self.lease.mpfr_precision(value) != PRECISION_BITS:
            raise PrimarySiNormalizationError("mpfr_precision_mismatch")
        exponent2 = self.lease.mpfr_get_z_2exp(self.scratch_mpz, value)
        mantissa_text = self.lease.mpz_decimal(self.scratch_mpz)
        try:
            mantissa = int(mantissa_text, 10)
        except (TypeError, ValueError) as error:
            raise PrimarySiNormalizationError("mpfr_canonical_mantissa_invalid") from error
        return _canonical_from_integer_exponent(mantissa, exponent2, direction)

    def _rounded(
        self,
        label: str,
        primitive: str,
        runtime_operation: str,
        rounding: str,
        destination: object,
        invoke: Callable[[], object],
        *,
        exact_decimal: str | None = None,
        require_exact: bool = False,
    ) -> object:
        observed = invoke()
        canonical = self._canonical(destination, rounding)
        if exact_decimal is None:
            if type(observed) is not int or observed not in {-1, 0, 1}:
                raise PrimarySiNormalizationError("mpfr_ternary_invalid", label)
            ternary = observed
        else:
            if observed is not None:
                raise PrimarySiNormalizationError("mpfr_set_str_status_invalid", label)
            ternary = _sign_of_comparison(
                _dyadic_fraction(canonical), _fraction_from_decimal(exact_decimal)
            )
        if require_exact and ternary != 0:
            raise PrimarySiNormalizationError("exact_mpfr_construction_inexact", label)
        self.staged.append(
            _StagedTrace(
                label=label,
                primitive=primitive,
                runtime_operation=runtime_operation,
                rounding_mode=rounding,
                ternary_sign=ternary,
                canonical_result=canonical,
            )
        )
        if label in self.result_by_label:
            raise PrimarySiNormalizationError("semantic_label_duplicate", label)
        self.result_by_label[label] = canonical
        return destination

    def _new_binary(
        self,
        label: str,
        primitive: str,
        rounding: str,
        left: object,
        right: object,
    ) -> object:
        destination = self.lease.allocate_mpfr256()
        operation = getattr(self.lease, primitive)
        return self._rounded(
            label,
            primitive,
            primitive,
            rounding,
            destination,
            lambda: operation(
                destination, left, right, _ROUNDING_VALUE[rounding]
            ),
        )

    def _new_unary(
        self, label: str, primitive: str, rounding: str, source: object
    ) -> object:
        destination = self.lease.allocate_mpfr256()
        operation = getattr(self.lease, primitive)
        return self._rounded(
            label,
            primitive,
            primitive,
            rounding,
            destination,
            lambda: operation(destination, source, _ROUNDING_VALUE[rounding]),
        )

    def decimal(self, label: str, text: str) -> _Interval:
        lower = self.lease.allocate_mpfr256()
        upper = self.lease.allocate_mpfr256()
        self._rounded(
            f"{label}.lower",
            "mpfr_set_str",
            "mpfr_set_decimal",
            "RNDD",
            lower,
            lambda: self.lease.mpfr_set_decimal(lower, text, _RUNTIME.RNDD),
            exact_decimal=text,
        )
        self._rounded(
            f"{label}.upper",
            "mpfr_set_str",
            "mpfr_set_decimal",
            "RNDU",
            upper,
            lambda: self.lease.mpfr_set_decimal(upper, text, _RUNTIME.RNDU),
            exact_decimal=text,
        )
        return self._positive_interval(label, lower, upper)

    def uint(self, label: str, value: int) -> _Interval:
        if type(value) is not int or value < 0:
            raise PrimarySiNormalizationError("exact_unsigned_integer_required", label)
        lower = self.lease.allocate_mpfr256()
        upper = self.lease.allocate_mpfr256()
        if lower is upper:
            raise PrimarySiNormalizationError("exact_endpoint_alias", label)
        self._rounded(
            f"{label}.lower.set_ui",
            "mpfr_set_ui",
            "mpfr_set_ui",
            "RNDN",
            lower,
            lambda: self.lease.mpfr_set_ui(lower, value, _RUNTIME.RNDN),
            require_exact=True,
        )
        self._rounded(
            f"{label}.upper.set_copy",
            "mpfr_set",
            "mpfr_set",
            "RNDN",
            upper,
            lambda: self.lease.mpfr_set(upper, lower, _RUNTIME.RNDN),
            require_exact=True,
        )
        if not self.lease.mpfr_equal(lower, upper):
            raise PrimarySiNormalizationError("exact_uint_endpoints_differ", label)
        return self._positive_interval(label, lower, upper)

    def dyadic(self, label: str, mantissa: int, exponent2: int) -> _Interval:
        integer = self.lease.allocate_mpz()
        self.lease.mpz_set_si(integer, mantissa)
        mantissa_value = self.lease.allocate_mpfr256()
        lower = self.lease.allocate_mpfr256()
        upper = self.lease.allocate_mpfr256()
        if len({id(mantissa_value), id(lower), id(upper)}) != 3:
            raise PrimarySiNormalizationError("exact_dyadic_destination_alias", label)
        self._rounded(
            f"{label}.mantissa.set_z",
            "mpfr_set_z",
            "mpfr_set_z",
            "RNDN",
            mantissa_value,
            lambda: self.lease.mpfr_set_z(
                mantissa_value, integer, _RUNTIME.RNDN
            ),
            require_exact=True,
        )
        self._rounded(
            f"{label}.lower.mul_2exp",
            "mpfr_mul_2si",
            "mpfr_mul_2si",
            "RNDN",
            lower,
            lambda: self.lease.mpfr_mul_2si(
                lower, mantissa_value, exponent2, _RUNTIME.RNDN
            ),
            require_exact=True,
        )
        self._rounded(
            f"{label}.upper.set_copy",
            "mpfr_set",
            "mpfr_set",
            "RNDN",
            upper,
            lambda: self.lease.mpfr_set(upper, lower, _RUNTIME.RNDN),
            require_exact=True,
        )
        if not self.lease.mpfr_equal(lower, upper):
            raise PrimarySiNormalizationError("exact_dyadic_endpoints_differ", label)
        expected = Fraction(mantissa, 1)
        expected = (
            expected * (1 << exponent2)
            if exponent2 >= 0
            else expected / (1 << -exponent2)
        )
        if _dyadic_fraction(self.result_by_label[f"{label}.lower.mul_2exp"]) != expected:
            raise PrimarySiNormalizationError("exact_dyadic_value_mismatch", label)
        return self._positive_interval(label, lower, upper)

    def const_pi(self, label: str) -> _Interval:
        lower = self.lease.allocate_mpfr256()
        upper = self.lease.allocate_mpfr256()
        self._rounded(
            f"{label}.lower",
            "mpfr_const_pi",
            "mpfr_const_pi",
            "RNDD",
            lower,
            lambda: self.lease.mpfr_const_pi(lower, _RUNTIME.RNDD),
        )
        self._rounded(
            f"{label}.upper",
            "mpfr_const_pi",
            "mpfr_const_pi",
            "RNDU",
            upper,
            lambda: self.lease.mpfr_const_pi(upper, _RUNTIME.RNDU),
        )
        return self._positive_interval(label, lower, upper)

    def mul_pos(self, label: str, left: _Interval, right: _Interval) -> _Interval:
        self._require_nonnegative(label, left, right)
        lower = self._new_binary(
            f"{label}.lower", "mpfr_mul", "RNDD", left.lower, right.lower
        )
        upper = self._new_binary(
            f"{label}.upper", "mpfr_mul", "RNDU", left.upper, right.upper
        )
        return self._positive_interval(label, lower, upper)

    def div_pos(self, label: str, numerator: _Interval, denominator: _Interval) -> _Interval:
        self._require_nonnegative(label, numerator, denominator)
        if self.lease.mpfr_compare_ui(denominator.lower, 0) <= 0:
            raise PrimarySiNormalizationError("interval_denominator_not_positive", label)
        lower = self._new_binary(
            f"{label}.lower",
            "mpfr_div",
            "RNDD",
            numerator.lower,
            denominator.upper,
        )
        upper = self._new_binary(
            f"{label}.upper",
            "mpfr_div",
            "RNDU",
            numerator.upper,
            denominator.lower,
        )
        return self._positive_interval(label, lower, upper)

    def square_pos(self, label: str, value: _Interval) -> _Interval:
        return self.mul_pos(label, value, value)

    def sqrt_pos(self, label: str, value: _Interval) -> _Interval:
        self._require_nonnegative(label, value)
        lower = self._new_unary(
            f"{label}.lower", "mpfr_sqrt", "RNDD", value.lower
        )
        upper = self._new_unary(
            f"{label}.upper", "mpfr_sqrt", "RNDU", value.upper
        )
        return self._positive_interval(label, lower, upper)

    def symmetric_hull(
        self, label: str, center: _Interval, uncertainty: _Interval, factor: _Interval
    ) -> _Interval:
        self._require_nonnegative(label, center, uncertainty, factor)
        product_lower = self._new_binary(
            f"{label}.factor_uncertainty_for_lower",
            "mpfr_mul",
            "RNDU",
            factor.upper,
            uncertainty.upper,
        )
        lower = self._new_binary(
            f"{label}.lower", "mpfr_sub", "RNDD", center.lower, product_lower
        )
        product_upper = self._new_binary(
            f"{label}.factor_uncertainty_for_upper",
            "mpfr_mul",
            "RNDU",
            factor.upper,
            uncertainty.upper,
        )
        upper = self._new_binary(
            f"{label}.upper", "mpfr_add", "RNDU", center.upper, product_upper
        )
        return self._positive_interval(label, lower, upper)

    def central_decimal(self, label: str, text: str) -> object:
        destination = self.lease.allocate_mpfr256()
        self._rounded(
            label,
            "mpfr_set_str",
            "mpfr_set_decimal",
            "RNDN",
            destination,
            lambda: self.lease.mpfr_set_decimal(destination, text, _RUNTIME.RNDN),
            exact_decimal=text,
        )
        self._positive_value(label, destination)
        return destination

    def central_uint(self, label: str, value: int) -> object:
        destination = self.lease.allocate_mpfr256()
        self._rounded(
            label,
            "mpfr_set_ui",
            "mpfr_set_ui",
            "RNDN",
            destination,
            lambda: self.lease.mpfr_set_ui(destination, value, _RUNTIME.RNDN),
            require_exact=True,
        )
        self._positive_value(label, destination)
        return destination

    def central_dyadic(self, label: str, mantissa: int, exponent2: int) -> object:
        integer = self.lease.allocate_mpz()
        self.lease.mpz_set_si(integer, mantissa)
        base = self.lease.allocate_mpfr256()
        destination = self.lease.allocate_mpfr256()
        self._rounded(
            f"{label}.set_integer",
            "mpfr_set_z",
            "mpfr_set_z",
            "RNDN",
            base,
            lambda: self.lease.mpfr_set_z(base, integer, _RUNTIME.RNDN),
            require_exact=True,
        )
        self._rounded(
            f"{label}.mul_2exp",
            "mpfr_mul_2si",
            "mpfr_mul_2si",
            "RNDN",
            destination,
            lambda: self.lease.mpfr_mul_2si(
                destination, base, exponent2, _RUNTIME.RNDN
            ),
            require_exact=True,
        )
        self._positive_value(label, destination)
        return destination

    def central_pi(self, label: str) -> object:
        destination = self.lease.allocate_mpfr256()
        self._rounded(
            label,
            "mpfr_const_pi",
            "mpfr_const_pi",
            "RNDN",
            destination,
            lambda: self.lease.mpfr_const_pi(destination, _RUNTIME.RNDN),
        )
        self._positive_value(label, destination)
        return destination

    def central_binary(
        self, label: str, primitive: str, left: object, right: object
    ) -> object:
        value = self._new_binary(label, primitive, "RNDN", left, right)
        self._positive_value(label, value)
        return value

    def central_sqrt(self, label: str, source: object) -> object:
        if self.lease.mpfr_compare_ui(source, 0) <= 0:
            raise PrimarySiNormalizationError("central_sqrt_nonpositive", label)
        value = self._new_unary(label, "mpfr_sqrt", "RNDN", source)
        self._positive_value(label, value)
        return value

    def terminal_get_d(self, label: str, source: object) -> tuple[float, CanonicalDyadic]:
        source_dyadic = self._canonical(source, "RNDN")
        value = self.lease.mpfr_get_d(source, _RUNTIME.RNDN)
        result_dyadic = _binary64_dyadic(value, "RNDN")
        ternary = _sign_of_comparison(
            _dyadic_fraction(result_dyadic), _dyadic_fraction(source_dyadic)
        )
        self.staged.append(
            _StagedTrace(
                label=label,
                primitive="mpfr_get_d",
                runtime_operation="mpfr_get_d",
                rounding_mode="RNDN",
                ternary_sign=ternary,
                canonical_result=result_dyadic,
            )
        )
        return value, source_dyadic

    def _positive_value(self, label: str, value: object) -> None:
        if self.lease.mpfr_compare_ui(value, 0) <= 0:
            raise PrimarySiNormalizationError("positive_value_invalid", label)

    def _positive_interval(self, label: str, lower: object, upper: object) -> _Interval:
        if (
            self.lease.mpfr_compare_ui(lower, 0) <= 0
            or self.lease.mpfr_compare(lower, upper) > 0
        ):
            raise PrimarySiNormalizationError("positive_interval_invalid", label)
        return _Interval(lower=lower, upper=upper)

    def _require_nonnegative(self, label: str, *values: _Interval) -> None:
        if any(
            self.lease.mpfr_compare_ui(value.lower, 0) < 0
            or self.lease.mpfr_compare(value.lower, value.upper) > 0
            for value in values
        ):
            raise PrimarySiNormalizationError(
                "positive_interval_precondition_failed", label
            )


_ROUNDING_VALUE: Final[dict[str, int]] = {
    "RNDD": _RUNTIME.RNDD,
    "RNDU": _RUNTIME.RNDU,
    "RNDN": _RUNTIME.RNDN,
}


def _directed_graph(arithmetic: _Arithmetic) -> dict[str, _Interval]:
    node: dict[str, _Interval] = {}
    node["g"] = arithmetic.dyadic("01_g", 1, -40)
    node["c"] = arithmetic.uint("02_c", 299_792_458)
    node["h"] = arithmetic.decimal("03_h", "6.62607015e-34")
    node["pi"] = arithmetic.const_pi("04_pi")
    node["two"] = arithmetic.uint("05_two", 2)
    node["eight"] = arithmetic.uint("06_eight", 8)
    node["twoPi"] = arithmetic.mul_pos("07_twoPi", node["two"], node["pi"])
    node["hbar"] = arithmetic.div_pos("08_hbar", node["h"], node["twoPi"])
    node["GCentral"] = arithmetic.decimal("09_GCentral", "6.67430e-11")
    node["GStandardUncertainty"] = arithmetic.decimal(
        "10_GStandardUncertainty", "1.5e-15"
    )
    one = arithmetic.uint("11_GOneSigma.factor", 1)
    node["GOneSigma"] = arithmetic.symmetric_hull(
        "11_GOneSigma", node["GCentral"], node["GStandardUncertainty"], one
    )
    two = arithmetic.uint("12_GAdmissionK2.factor", 2)
    node["GAdmissionK2"] = arithmetic.symmetric_hull(
        "12_GAdmissionK2",
        node["GCentral"],
        node["GStandardUncertainty"],
        two,
    )
    node["eightPi"] = arithmetic.mul_pos("13_eightPi", node["eight"], node["pi"])
    node["c2"] = arithmetic.mul_pos("14_c2", node["c"], node["c"])
    node["c3"] = arithmetic.mul_pos("15_c3", node["c2"], node["c"])
    node["c4"] = arithmetic.mul_pos("16_c4", node["c2"], node["c2"])
    node["c5"] = arithmetic.mul_pos("17_c5", node["c4"], node["c"])
    node["c7"] = arithmetic.mul_pos("18_c7", node["c4"], node["c3"])
    node["gHbar"] = arithmetic.mul_pos("19_gHbar", node["g"], node["hbar"])
    node["gHbarC5"] = arithmetic.mul_pos("20_gHbarC5", node["gHbar"], node["c5"])
    node["eightPiGCentral"] = arithmetic.mul_pos(
        "21_eightPiGCentral", node["eightPi"], node["GCentral"]
    )
    node["muECentralSquared"] = arithmetic.div_pos(
        "22_muECentralSquared", node["gHbarC5"], node["eightPiGCentral"]
    )
    node["muECentral"] = arithmetic.sqrt_pos("23_muECentral", node["muECentralSquared"])
    node["hbarC"] = arithmetic.mul_pos("24_hbarC", node["hbar"], node["c"])
    node["muLCentral"] = arithmetic.div_pos("25_muLCentral", node["muECentral"], node["hbarC"])
    node["muLCentralSquared"] = arithmetic.square_pos(
        "26_muLCentralSquared", node["muLCentral"]
    )
    node["c4MuLCentralSquared"] = arithmetic.mul_pos(
        "27_c4MuLCentralSquared", node["c4"], node["muLCentralSquared"]
    )
    node["stressScaleCentralViaMu"] = arithmetic.div_pos(
        "28_stressScaleCentralViaMu",
        node["c4MuLCentralSquared"],
        node["eightPiGCentral"],
    )
    node["eightPiGCentralSquared"] = arithmetic.square_pos(
        "29_eightPiGCentralSquared", node["eightPiGCentral"]
    )
    node["eightPiGCentralSquaredHbar"] = arithmetic.mul_pos(
        "30_eightPiGCentralSquaredHbar", node["eightPiGCentralSquared"], node["hbar"]
    )
    node["gC7"] = arithmetic.mul_pos("31_gC7", node["g"], node["c7"])
    node["stressScaleCentral"] = arithmetic.div_pos(
        "32_stressScaleCentral", node["gC7"], node["eightPiGCentralSquaredHbar"]
    )
    node["noiseScaleCentral"] = arithmetic.square_pos(
        "33_noiseScaleCentral", node["stressScaleCentral"]
    )
    node["eightPiGOneSigma"] = arithmetic.mul_pos(
        "34_eightPiGOneSigma", node["eightPi"], node["GOneSigma"]
    )
    node["muEOneSigmaSquared"] = arithmetic.div_pos(
        "35_muEOneSigmaSquared", node["gHbarC5"], node["eightPiGOneSigma"]
    )
    node["muEOneSigma"] = arithmetic.sqrt_pos("36_muEOneSigma", node["muEOneSigmaSquared"])
    node["muLOneSigma"] = arithmetic.div_pos("37_muLOneSigma", node["muEOneSigma"], node["hbarC"])
    node["eightPiGOneSigmaSquared"] = arithmetic.square_pos(
        "38_eightPiGOneSigmaSquared", node["eightPiGOneSigma"]
    )
    node["eightPiGOneSigmaSquaredHbar"] = arithmetic.mul_pos(
        "39_eightPiGOneSigmaSquaredHbar", node["eightPiGOneSigmaSquared"], node["hbar"]
    )
    node["stressScaleOneSigma"] = arithmetic.div_pos(
        "40_stressScaleOneSigma", node["gC7"], node["eightPiGOneSigmaSquaredHbar"]
    )
    node["noiseScaleOneSigma"] = arithmetic.square_pos(
        "41_noiseScaleOneSigma", node["stressScaleOneSigma"]
    )
    node["eightPiGAdmissionK2"] = arithmetic.mul_pos(
        "42_eightPiGAdmissionK2", node["eightPi"], node["GAdmissionK2"]
    )
    node["muEAdmissionK2Squared"] = arithmetic.div_pos(
        "43_muEAdmissionK2Squared", node["gHbarC5"], node["eightPiGAdmissionK2"]
    )
    node["muEAdmissionK2"] = arithmetic.sqrt_pos(
        "44_muEAdmissionK2", node["muEAdmissionK2Squared"]
    )
    node["muLAdmissionK2"] = arithmetic.div_pos(
        "45_muLAdmissionK2", node["muEAdmissionK2"], node["hbarC"]
    )
    node["eightPiGAdmissionK2Squared"] = arithmetic.square_pos(
        "46_eightPiGAdmissionK2Squared", node["eightPiGAdmissionK2"]
    )
    node["eightPiGAdmissionK2SquaredHbar"] = arithmetic.mul_pos(
        "47_eightPiGAdmissionK2SquaredHbar",
        node["eightPiGAdmissionK2Squared"],
        node["hbar"],
    )
    node["stressScaleAdmissionK2"] = arithmetic.div_pos(
        "48_stressScaleAdmissionK2", node["gC7"], node["eightPiGAdmissionK2SquaredHbar"]
    )
    node["noiseScaleAdmissionK2"] = arithmetic.square_pos(
        "49_noiseScaleAdmissionK2", node["stressScaleAdmissionK2"]
    )
    return node


def _central_graph(arithmetic: _Arithmetic) -> dict[str, object]:
    node: dict[str, object] = {}
    node["gN"] = arithmetic.central_dyadic("central.01_gN", 1, -40)
    node["cN"] = arithmetic.central_uint("central.02_cN", 299_792_458)
    node["hN"] = arithmetic.central_decimal("central.03_hN", "6.62607015e-34")
    node["piN"] = arithmetic.central_pi("central.04_piN")
    node["twoN"] = arithmetic.central_uint("central.05_twoN", 2)
    node["eightN"] = arithmetic.central_uint("central.06_eightN", 8)
    node["twoPiN"] = arithmetic.central_binary("central.07_twoPiN", "mpfr_mul", node["twoN"], node["piN"])
    node["hbarN"] = arithmetic.central_binary("central.08_hbarN", "mpfr_div", node["hN"], node["twoPiN"])
    node["GN"] = arithmetic.central_decimal("central.09_GN", "6.67430e-11")
    node["eightPiN"] = arithmetic.central_binary("central.10_eightPiN", "mpfr_mul", node["eightN"], node["piN"])
    node["c2N"] = arithmetic.central_binary("central.11_c2N", "mpfr_mul", node["cN"], node["cN"])
    node["c3N"] = arithmetic.central_binary("central.12_c3N", "mpfr_mul", node["c2N"], node["cN"])
    node["c4N"] = arithmetic.central_binary("central.13_c4N", "mpfr_mul", node["c2N"], node["c2N"])
    node["c5N"] = arithmetic.central_binary("central.14_c5N", "mpfr_mul", node["c4N"], node["cN"])
    node["c7N"] = arithmetic.central_binary("central.15_c7N", "mpfr_mul", node["c4N"], node["c3N"])
    node["gHbarN"] = arithmetic.central_binary("central.16_gHbarN", "mpfr_mul", node["gN"], node["hbarN"])
    node["gHbarC5N"] = arithmetic.central_binary("central.17_gHbarC5N", "mpfr_mul", node["gHbarN"], node["c5N"])
    node["eightPiGN"] = arithmetic.central_binary("central.18_eightPiGN", "mpfr_mul", node["eightPiN"], node["GN"])
    node["muE2N"] = arithmetic.central_binary("central.19_muE2N", "mpfr_div", node["gHbarC5N"], node["eightPiGN"])
    node["muEN"] = arithmetic.central_sqrt("central.20_muEN", node["muE2N"])
    node["hbarCN"] = arithmetic.central_binary("central.21_hbarCN", "mpfr_mul", node["hbarN"], node["cN"])
    node["muLN"] = arithmetic.central_binary("central.22_muLN", "mpfr_div", node["muEN"], node["hbarCN"])
    node["eightPiG2N"] = arithmetic.central_binary("central.23_eightPiG2N", "mpfr_mul", node["eightPiGN"], node["eightPiGN"])
    node["eightPiG2HbarN"] = arithmetic.central_binary("central.24_eightPiG2HbarN", "mpfr_mul", node["eightPiG2N"], node["hbarN"])
    node["gC7N"] = arithmetic.central_binary("central.25_gC7N", "mpfr_mul", node["gN"], node["c7N"])
    node["stressScaleN"] = arithmetic.central_binary("central.26_stressScaleN", "mpfr_div", node["gC7N"], node["eightPiG2HbarN"])
    node["noiseScaleN"] = arithmetic.central_binary("central.27_noiseScaleN", "mpfr_mul", node["stressScaleN"], node["stressScaleN"])
    return node


_SCALE_NODE_BINDINGS: Final[tuple[tuple[str, str], ...]] = (
    ("mu_E_central", "muECentral"),
    ("mu_L_central", "muLCentral"),
    ("stress_scale_central_via_mu", "stressScaleCentralViaMu"),
    ("stress_scale_central_closed", "stressScaleCentral"),
    ("noise_scale_central", "noiseScaleCentral"),
    ("mu_E_one_sigma", "muEOneSigma"),
    ("mu_L_one_sigma", "muLOneSigma"),
    ("stress_scale_one_sigma", "stressScaleOneSigma"),
    ("noise_scale_one_sigma", "noiseScaleOneSigma"),
    ("mu_E_admission_k2", "muEAdmissionK2"),
    ("mu_L_admission_k2", "muLAdmissionK2"),
    ("stress_scale_admission_k2", "stressScaleAdmissionK2"),
    ("noise_scale_admission_k2", "noiseScaleAdmissionK2"),
)

_CENTRAL_NODE_BINDINGS: Final[tuple[tuple[str, str], ...]] = (
    ("mu_E_central", "muEN"),
    ("mu_L_central", "muLN"),
    ("stress_scale_central_closed", "stressScaleN"),
    ("noise_scale_central", "noiseScaleN"),
)


def _semantic_trace_after_close(
    staged: tuple[_StagedTrace, ...], runtime_snapshot: _ValidatedRuntimeSnapshot
) -> tuple[SemanticTraceEntry, ...]:
    rounded = tuple(
        item for item in runtime_snapshot.operation_trace if item.rounding is not None
    )
    if len(staged) != 139 or len(rounded) != 139:
        raise PrimarySiNormalizationError("rounded_operation_count_mismatch")
    entries: list[SemanticTraceEntry] = []
    runtime_rounding = {"nearest_even": "RNDN", "upward": "RNDU", "downward": "RNDD"}
    for ordinal, (stage, raw, expected) in enumerate(
        zip(staged, rounded, _EXPECTED_ROUNDED_TRACE, strict=True)
    ):
        if (
            (stage.label, stage.primitive, stage.rounding_mode) != expected
            or raw.operation != stage.runtime_operation
            or runtime_rounding.get(raw.rounding) != stage.rounding_mode
            or raw.forbidden_flags_clear is not True
            or (ordinal < 135 and raw.destination_ordinal is None)
            or (ordinal >= 135 and raw.destination_ordinal is not None)
        ):
            raise PrimarySiNormalizationError("semantic_runtime_trace_mismatch", stage.label)
        if raw.source_ordinals != _EXPECTED_ROUNDED_SOURCE_ORDINALS[ordinal]:
            raise PrimarySiNormalizationError(
                "semantic_runtime_source_topology_mismatch", stage.label
            )
        if raw.operation == "mpfr_get_d":
            if raw.ternary_result is not None:
                raise PrimarySiNormalizationError(
                    "exceptional_ternary_status_mismatch", stage.label
                )
            if raw.inexact_flag is not False:
                raise PrimarySiNormalizationError(
                    "semantic_get_d_raw_inexact_flag", stage.label
                )
        elif raw.operation == "mpfr_set_decimal":
            if raw.ternary_result is not None:
                raise PrimarySiNormalizationError(
                    "exceptional_ternary_status_mismatch", stage.label
                )
            if raw.inexact_flag is not (stage.ternary_sign != 0):
                raise PrimarySiNormalizationError(
                    "semantic_inexact_flag_mismatch", stage.label
                )
        else:
            if raw.ternary_result != stage.ternary_sign:
                raise PrimarySiNormalizationError("semantic_ternary_mismatch", stage.label)
            if raw.inexact_flag is not (stage.ternary_sign != 0):
                raise PrimarySiNormalizationError(
                    "semantic_inexact_flag_mismatch", stage.label
                )
        entries.append(
            SemanticTraceEntry(
                ordinal=ordinal,
                label=stage.label,
                primitive=stage.primitive,
                rounding_mode=stage.rounding_mode,
                ternary_sign=stage.ternary_sign,
                forbidden_flags_in_frozen_order=(False,) * 5,
                canonical_result_dyadic=stage.canonical_result,
            )
        )
    destination_ordinals = tuple(item.destination_ordinal for item in rounded[:135])
    if len(set(destination_ordinals)) != 135:
        raise PrimarySiNormalizationError("rounded_destination_nonalias_mismatch")
    if tuple(item.ternary_sign for item in entries[135:]) != (-1, 1, 1, -1):
        raise PrimarySiNormalizationError("terminal_get_d_semantic_sign_mismatch")
    return tuple(entries)


def _source_observation() -> tuple[str, int]:
    raw = Path(__file__).resolve(strict=True).read_bytes()
    return hashlib.sha256(raw).hexdigest(), len(raw)


def _materialize_with_lease(
    codata_raw_bytes: object,
    lease: object,
) -> PrimarySiNormalizationReceipt:
    directed: dict[str, _Interval]
    central: dict[str, object]
    staged: tuple[_StagedTrace, ...]
    scale_receipts: tuple[DirectedScaleReceipt, ...]
    central_receipts: tuple[CentralScaleReceipt, ...]
    adapter_source_sha256: str
    adapter_source_size: int
    with lease:
        adapter_source_sha256, adapter_source_size = _source_observation()
        if type(codata_raw_bytes) is not bytes:
            raise PrimarySiNormalizationError("codata_exact_bytes_required")
        if len(codata_raw_bytes) != CODATA_RAW_SIZE_BYTES:
            raise PrimarySiNormalizationError("codata_raw_size_mismatch")
        observed_codata_sha256 = hashlib.sha256(codata_raw_bytes).hexdigest()
        if observed_codata_sha256 != CODATA_RAW_SHA256:
            raise PrimarySiNormalizationError("codata_raw_sha256_mismatch")

        arithmetic = _Arithmetic(lease)
        directed = _directed_graph(arithmetic)
        central = _central_graph(arithmetic)
        if not (
            lease.mpfr_compare(
                directed["stressScaleCentralViaMu"].lower,
                directed["stressScaleCentral"].upper,
            )
            <= 0
            and lease.mpfr_compare(
                directed["stressScaleCentral"].lower,
                directed["stressScaleCentralViaMu"].upper,
            )
            <= 0
        ):
            raise PrimarySiNormalizationError("central_stress_identity_intervals_disjoint")

        scale_receipts = tuple(
            DirectedScaleReceipt(
                scale_id=scale_id,
                lower=arithmetic._canonical(directed[node_id].lower, "RNDD"),
                upper=arithmetic._canonical(directed[node_id].upper, "RNDU"),
            )
            for scale_id, node_id in _SCALE_NODE_BINDINGS
        )

        central_items: list[CentralScaleReceipt] = []
        directed_by_id = {item.scale_id: item for item in scale_receipts}
        for scale_id, node_id in _CENTRAL_NODE_BINDINGS:
            central_dyadic = arithmetic._canonical(central[node_id], "RNDN")
            interval = directed_by_id[scale_id]
            if not (
                _dyadic_fraction(interval.lower)
                <= _dyadic_fraction(central_dyadic)
                <= _dyadic_fraction(interval.upper)
            ):
                raise PrimarySiNormalizationError("central_representative_not_enclosed", scale_id)
            value, barrier_source_dyadic = arithmetic.terminal_get_d(
                f"receipt.central_scales.{scale_id}.get_d", central[node_id]
            )
            if barrier_source_dyadic != central_dyadic:
                raise PrimarySiNormalizationError("central_barrier_source_drift", scale_id)
            central_items.append(
                CentralScaleReceipt(
                    scale_id=scale_id,
                    value=central_dyadic,
                    binary64_bits=_float_bits(value),
                )
            )
        central_receipts = tuple(central_items)
        staged = tuple(arithmetic.staged)

    snapshot_pair = lease.validated_receipt_snapshot()
    if type(snapshot_pair) is not tuple or len(snapshot_pair) != 2:
        raise PrimarySiNormalizationError("runtime_receipt_snapshot_pair_invalid")
    snapshot_text, snapshot_sha256 = snapshot_pair
    try:
        runtime_snapshot = _parse_runtime_snapshot(snapshot_text, snapshot_sha256)
    except ValueError as error:
        raise PrimarySiNormalizationError("runtime_receipt_snapshot_invalid") from error
    semantic_trace = _semantic_trace_after_close(staged, runtime_snapshot)
    if (
        _semantic_result_golden_sha256(semantic_trace)
        != _EXPECTED_SEMANTIC_RESULT_GOLDEN_SHA256
    ):
        raise PrimarySiNormalizationError("semantic_result_golden_mismatch")
    if (
        _directed_endpoint_golden_sha256(scale_receipts)
        != _EXPECTED_DIRECTED_ENDPOINT_GOLDEN_SHA256
    ):
        raise PrimarySiNormalizationError("directed_endpoint_golden_mismatch")
    if (
        tuple((item.scale_id, item.binary64_bits) for item in central_receipts)
        != _EXPECTED_CENTRAL_BINARY64_BITS
    ):
        raise PrimarySiNormalizationError("central_binary64_golden_mismatch")
    synthetic = runtime_snapshot.synthetic_test_provider
    receipt = PrimarySiNormalizationReceipt(
        lane="primary",
        calculation_only=True,
        synthetic_test_provider=synthetic,
        runtime_source_raw_sha256=RUNTIME_SOURCE_RAW_SHA256,
        runtime_source_raw_size_bytes=RUNTIME_SOURCE_RAW_SIZE_BYTES,
        runtime_executed_from_authenticated_bytes=True,
        si_v2_semantic_sha256=SI_V2_SEMANTIC_SHA256,
        si_v2_canonical_size_bytes=SI_V2_CANONICAL_SIZE_BYTES,
        si_v2_source_raw_sha256=SI_V2_SOURCE_RAW_SHA256,
        si_v2_source_raw_size_bytes=SI_V2_SOURCE_RAW_SIZE_BYTES,
        si_v1_semantic_sha256=SI_V1_SEMANTIC_SHA256,
        si_v1_canonical_size_bytes=SI_V1_CANONICAL_SIZE_BYTES,
        codata_raw_sha256=CODATA_RAW_SHA256,
        codata_raw_size_bytes=CODATA_RAW_SIZE_BYTES,
        adapter_source_observed_sha256=adapter_source_sha256,
        adapter_source_observed_size_bytes=adapter_source_size,
        directed_graph_node_count=49,
        central_graph_node_count=27,
        rounded_operation_count=139,
        terminal_get_d_count=4,
        semantic_trace=semantic_trace,
        scales=scale_receipts,
        central_scales=central_receipts,
        central_via_mu_overlaps_closed=True,
        exact_operation_chronology_validated=True,
        forbidden_flags_validated=True,
        canonical_dyadics_validated=True,
        semantic_si_operation_labels_bound=True,
        runtime_receipt_snapshot_text=snapshot_text,
        runtime_receipt_snapshot_sha256=snapshot_sha256,
        runtime_lifecycle_complete=True,
        production_native_runtime_observed=not synthetic,
        module_local_origin_check_only=True,
        server_authenticated=False,
        primary_receipt_persisted=False,
        pair_comparison_ready=False,
        pair_comparison_observed=False,
        independent_agreement=False,
        candidate_ready=False,
        execution_ready=False,
        execution_authority=False,
        replay_ready=False,
        replay_authority=False,
        publication_ready=False,
        publication_authority=False,
        scientific_preseal_authority=False,
        scientific_authority=False,
        diagnostic_pass=False,
        semiclassical_stress_noise_lamp=False,
        semiclassical_constraint_algebra_lamp=False,
        theory_graph_promotion=False,
        physical_viability=False,
        propulsion=False,
        transport=False,
        implementation_blockers=(((_SYNTHETIC_BLOCKER,) if synthetic else ()) + _COMMON_BLOCKERS),
    )
    _register_receipt(receipt)
    return receipt


def materialize_primary_si_normalization(
    codata_raw_bytes: bytes,
) -> PrimarySiNormalizationReceipt:
    """Acquire the literal runtime first, then materialize the frozen graph."""

    lease = _RUNTIME.acquire_mpfr256_runtime_lease()
    return _materialize_with_lease(codata_raw_bytes, lease)


def _test_only_materialize_primary_si_normalization(
    codata_raw_bytes: object,
    request: object,
    provider: object,
    marker: object,
) -> PrimarySiNormalizationReceipt:
    if marker is not _TEST_ONLY_MARKER:
        raise PrimarySiNormalizationError("synthetic_test_marker_invalid")
    lease = _RUNTIME._test_only_acquire_runtime_lease(
        request, provider, _RUNTIME._TEST_ONLY_MARKER
    )
    return _materialize_with_lease(codata_raw_bytes, lease)


_RECEIPT_PROJECTION_MAX_DEPTH: Final[int] = 6
_RECEIPT_PROJECTION_MAX_NODES: Final[int] = 4_096
_RECEIPT_PROJECTION_MAX_TUPLE_LENGTH: Final[int] = 139
_RECEIPT_PROJECTION_MAX_STRING_BYTES: Final[int] = 32_768
_RECEIPT_PROJECTION_MAX_RUNTIME_SNAPSHOT_BYTES: Final[int] = 1_048_576
_RECEIPT_PROJECTION_MAX_CANONICAL_BYTES: Final[int] = 2_097_152


@dataclass(slots=True)
class _ReceiptProjectionBudget:
    nodes: int = 0

    def take(self, depth: int) -> None:
        if depth > _RECEIPT_PROJECTION_MAX_DEPTH:
            raise PrimarySiNormalizationError(
                "primary_receipt_projection_depth_limit"
            )
        self.nodes += 1
        if self.nodes > _RECEIPT_PROJECTION_MAX_NODES:
            raise PrimarySiNormalizationError(
                "primary_receipt_projection_node_limit"
            )


def _project_receipt_scalar(
    value: object,
    budget: _ReceiptProjectionBudget,
    depth: int,
    *,
    string_limit: int = _RECEIPT_PROJECTION_MAX_STRING_BYTES,
) -> bool | int | str:
    budget.take(depth)
    if type(value) is bool:
        return value
    if type(value) is int:
        if value.bit_length() > 256:
            raise PrimarySiNormalizationError(
                "primary_receipt_projection_integer_limit"
            )
        return value
    if type(value) is str:
        try:
            encoded = value.encode("utf-8", "strict")
        except UnicodeEncodeError as error:
            raise PrimarySiNormalizationError(
                "primary_receipt_projection_string_invalid"
            ) from error
        if len(encoded) > string_limit:
            raise PrimarySiNormalizationError(
                "primary_receipt_projection_string_limit"
            )
        return value
    raise PrimarySiNormalizationError("primary_receipt_projection_scalar_invalid")


def _project_receipt_tuple(
    value: object,
    expected_length: int,
    budget: _ReceiptProjectionBudget,
    depth: int,
    projector: Callable[[object, _ReceiptProjectionBudget, int], object],
) -> list[object]:
    budget.take(depth)
    if (
        type(value) is not tuple
        or expected_length > _RECEIPT_PROJECTION_MAX_TUPLE_LENGTH
        or len(value) != expected_length
    ):
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_tuple_shape_invalid"
        )
    return [projector(item, budget, depth + 1) for item in value]


def _project_canonical_dyadic(
    value: object, budget: _ReceiptProjectionBudget, depth: int
) -> dict[str, object]:
    budget.take(depth)
    if type(value) is not CanonicalDyadic:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_dyadic_type_invalid"
        )
    projection = {
        "sign": _project_receipt_scalar(
            value.sign, budget, depth + 1, string_limit=1
        ),
        "mantissa_lowercase_hex": _project_receipt_scalar(
            value.mantissa_lowercase_hex,
            budget,
            depth + 1,
            string_limit=64,
        ),
        "exponent2": _project_receipt_scalar(value.exponent2, budget, depth + 1),
        "precision_bits": _project_receipt_scalar(
            value.precision_bits, budget, depth + 1
        ),
        "direction": _project_receipt_scalar(
            value.direction, budget, depth + 1, string_limit=4
        ),
    }
    try:
        CanonicalDyadic.__post_init__(value)
    except BaseException as error:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_dyadic_invalid"
        ) from error
    return projection


def _project_semantic_trace_entry(
    value: object, budget: _ReceiptProjectionBudget, depth: int
) -> dict[str, object]:
    budget.take(depth)
    if type(value) is not SemanticTraceEntry:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_trace_entry_type_invalid"
        )
    flags = _project_receipt_tuple(
        value.forbidden_flags_in_frozen_order,
        5,
        budget,
        depth + 1,
        _project_receipt_scalar,
    )
    projection = {
        "ordinal": _project_receipt_scalar(value.ordinal, budget, depth + 1),
        "label": _project_receipt_scalar(
            value.label, budget, depth + 1, string_limit=512
        ),
        "primitive": _project_receipt_scalar(
            value.primitive, budget, depth + 1, string_limit=64
        ),
        "rounding_mode": _project_receipt_scalar(
            value.rounding_mode, budget, depth + 1, string_limit=4
        ),
        "ternary_sign": _project_receipt_scalar(
            value.ternary_sign, budget, depth + 1
        ),
        "forbidden_flags_in_frozen_order": flags,
        "canonical_result_dyadic": _project_canonical_dyadic(
            value.canonical_result_dyadic, budget, depth + 1
        ),
    }
    try:
        SemanticTraceEntry.__post_init__(value)
    except BaseException as error:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_trace_entry_invalid"
        ) from error
    return projection


def _project_directed_scale(
    value: object, budget: _ReceiptProjectionBudget, depth: int
) -> dict[str, object]:
    budget.take(depth)
    if type(value) is not DirectedScaleReceipt:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_directed_scale_type_invalid"
        )
    return {
        "scale_id": _project_receipt_scalar(
            value.scale_id, budget, depth + 1, string_limit=64
        ),
        "lower": _project_canonical_dyadic(value.lower, budget, depth + 1),
        "upper": _project_canonical_dyadic(value.upper, budget, depth + 1),
    }


def _project_central_scale(
    value: object, budget: _ReceiptProjectionBudget, depth: int
) -> dict[str, object]:
    budget.take(depth)
    if type(value) is not CentralScaleReceipt:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_central_scale_type_invalid"
        )
    projection = {
        "scale_id": _project_receipt_scalar(
            value.scale_id, budget, depth + 1, string_limit=64
        ),
        "value": _project_canonical_dyadic(value.value, budget, depth + 1),
        "binary64_bits": _project_receipt_scalar(
            value.binary64_bits, budget, depth + 1, string_limit=16
        ),
    }
    try:
        CentralScaleReceipt.__post_init__(value)
    except BaseException as error:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_central_scale_invalid"
        ) from error
    return projection


def _receipt_projection(value: object) -> dict[str, object]:
    if type(value) is not PrimarySiNormalizationReceipt:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_receipt_type_invalid"
        )
    budget = _ReceiptProjectionBudget()
    budget.take(0)
    synthetic = value.synthetic_test_provider
    if type(synthetic) is not bool:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_provider_kind_invalid"
        )
    expected_blocker_count = len(_COMMON_BLOCKERS) + (1 if synthetic else 0)
    projection: dict[str, object] = {}
    for field in fields(PrimarySiNormalizationReceipt):
        field_value = getattr(value, field.name)
        if field.name == "semantic_trace":
            projected = _project_receipt_tuple(
                field_value,
                139,
                budget,
                1,
                _project_semantic_trace_entry,
            )
        elif field.name == "scales":
            projected = _project_receipt_tuple(
                field_value, 13, budget, 1, _project_directed_scale
            )
        elif field.name == "central_scales":
            projected = _project_receipt_tuple(
                field_value, 4, budget, 1, _project_central_scale
            )
        elif field.name == "implementation_blockers":
            projected = _project_receipt_tuple(
                field_value,
                expected_blocker_count,
                budget,
                1,
                _project_receipt_scalar,
            )
        elif field.name == "runtime_receipt_snapshot_text":
            projected = _project_receipt_scalar(
                field_value,
                budget,
                1,
                string_limit=_RECEIPT_PROJECTION_MAX_RUNTIME_SNAPSHOT_BYTES,
            )
        else:
            projected = _project_receipt_scalar(field_value, budget, 1)
        projection[field.name] = projected
    try:
        PrimarySiNormalizationReceipt.__post_init__(value)
    except BaseException as error:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_receipt_invalid"
        ) from error
    return projection


def _primary_receipt_snapshot(
    value: PrimarySiNormalizationReceipt,
) -> tuple[str, str]:
    canonical = json.dumps(
        _receipt_projection(value),
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=False,
    ).encode("ascii")
    if len(canonical) > _RECEIPT_PROJECTION_MAX_CANONICAL_BYTES:
        raise PrimarySiNormalizationError(
            "primary_receipt_projection_canonical_byte_limit"
        )
    domain = b"nhm2-spherical-boson-star-v2/primary-si-receipt-snapshot/v2\n"
    digest = hashlib.sha256(
        domain + struct.pack("<Q", len(canonical)) + canonical
    ).hexdigest()
    return canonical.decode("ascii"), digest


_RECEIPTS: dict[
    int, tuple[weakref.ReferenceType[object], str, str]
] = {}


def _register_receipt(receipt: PrimarySiNormalizationReceipt) -> None:
    key = id(receipt)
    canonical, digest = _primary_receipt_snapshot(receipt)
    existing = _RECEIPTS.get(key)
    if existing is not None and existing[0]() is not None:
        raise PrimarySiNormalizationError("primary_si_receipt_identity_collision")

    def discard(reference: weakref.ReferenceType[object]) -> None:
        current = _RECEIPTS.get(key)
        if current is not None and current[0] is reference:
            _RECEIPTS.pop(key, None)

    reference = weakref.ref(receipt, discard)
    _RECEIPTS[key] = (reference, canonical, digest)


def validated_primary_si_normalization_receipt_snapshot(
    value: object,
) -> tuple[str, str]:
    if type(value) is not PrimarySiNormalizationReceipt:
        raise PrimarySiNormalizationError("primary_si_receipt_not_authentic")
    entry = _RECEIPTS.get(id(value))
    try:
        current = _primary_receipt_snapshot(value)
        valid = (
            entry is not None
            and entry[0]() is value
            and current == (entry[1], entry[2])
        )
    except BaseException:
        valid = False
    if not valid or entry is None:
        raise PrimarySiNormalizationError("primary_si_receipt_not_authentic")
    return entry[1], entry[2]


def require_authentic_primary_si_normalization_receipt(
    value: object,
) -> tuple[str, str]:
    """Admit an origin-bound receipt and expose only its immutable snapshot."""

    return validated_primary_si_normalization_receipt_snapshot(value)


# Exact semantic order: 107 directed operations, 28 central operations, then
# four once-only terminal binary64 barriers.  The runtime trace is deliberately
# unlabeled; this adapter owns and validates these names.
_EXPECTED_ROUNDED_TRACE: Final[tuple[tuple[str, str, str], ...]] = (
    ("01_g.mantissa.set_z", "mpfr_set_z", "RNDN"),
    ("01_g.lower.mul_2exp", "mpfr_mul_2si", "RNDN"),
    ("01_g.upper.set_copy", "mpfr_set", "RNDN"),
    ("02_c.lower.set_ui", "mpfr_set_ui", "RNDN"),
    ("02_c.upper.set_copy", "mpfr_set", "RNDN"),
    ("03_h.lower", "mpfr_set_str", "RNDD"),
    ("03_h.upper", "mpfr_set_str", "RNDU"),
    ("04_pi.lower", "mpfr_const_pi", "RNDD"),
    ("04_pi.upper", "mpfr_const_pi", "RNDU"),
    ("05_two.lower.set_ui", "mpfr_set_ui", "RNDN"),
    ("05_two.upper.set_copy", "mpfr_set", "RNDN"),
    ("06_eight.lower.set_ui", "mpfr_set_ui", "RNDN"),
    ("06_eight.upper.set_copy", "mpfr_set", "RNDN"),
    ("07_twoPi.lower", "mpfr_mul", "RNDD"),
    ("07_twoPi.upper", "mpfr_mul", "RNDU"),
    ("08_hbar.lower", "mpfr_div", "RNDD"),
    ("08_hbar.upper", "mpfr_div", "RNDU"),
    ("09_GCentral.lower", "mpfr_set_str", "RNDD"),
    ("09_GCentral.upper", "mpfr_set_str", "RNDU"),
    ("10_GStandardUncertainty.lower", "mpfr_set_str", "RNDD"),
    ("10_GStandardUncertainty.upper", "mpfr_set_str", "RNDU"),
    ("11_GOneSigma.factor.lower.set_ui", "mpfr_set_ui", "RNDN"),
    ("11_GOneSigma.factor.upper.set_copy", "mpfr_set", "RNDN"),
    ("11_GOneSigma.factor_uncertainty_for_lower", "mpfr_mul", "RNDU"),
    ("11_GOneSigma.lower", "mpfr_sub", "RNDD"),
    ("11_GOneSigma.factor_uncertainty_for_upper", "mpfr_mul", "RNDU"),
    ("11_GOneSigma.upper", "mpfr_add", "RNDU"),
    ("12_GAdmissionK2.factor.lower.set_ui", "mpfr_set_ui", "RNDN"),
    ("12_GAdmissionK2.factor.upper.set_copy", "mpfr_set", "RNDN"),
    ("12_GAdmissionK2.factor_uncertainty_for_lower", "mpfr_mul", "RNDU"),
    ("12_GAdmissionK2.lower", "mpfr_sub", "RNDD"),
    ("12_GAdmissionK2.factor_uncertainty_for_upper", "mpfr_mul", "RNDU"),
    ("12_GAdmissionK2.upper", "mpfr_add", "RNDU"),
    ("13_eightPi.lower", "mpfr_mul", "RNDD"),
    ("13_eightPi.upper", "mpfr_mul", "RNDU"),
    ("14_c2.lower", "mpfr_mul", "RNDD"),
    ("14_c2.upper", "mpfr_mul", "RNDU"),
    ("15_c3.lower", "mpfr_mul", "RNDD"),
    ("15_c3.upper", "mpfr_mul", "RNDU"),
    ("16_c4.lower", "mpfr_mul", "RNDD"),
    ("16_c4.upper", "mpfr_mul", "RNDU"),
    ("17_c5.lower", "mpfr_mul", "RNDD"),
    ("17_c5.upper", "mpfr_mul", "RNDU"),
    ("18_c7.lower", "mpfr_mul", "RNDD"),
    ("18_c7.upper", "mpfr_mul", "RNDU"),
    ("19_gHbar.lower", "mpfr_mul", "RNDD"),
    ("19_gHbar.upper", "mpfr_mul", "RNDU"),
    ("20_gHbarC5.lower", "mpfr_mul", "RNDD"),
    ("20_gHbarC5.upper", "mpfr_mul", "RNDU"),
    ("21_eightPiGCentral.lower", "mpfr_mul", "RNDD"),
    ("21_eightPiGCentral.upper", "mpfr_mul", "RNDU"),
    ("22_muECentralSquared.lower", "mpfr_div", "RNDD"),
    ("22_muECentralSquared.upper", "mpfr_div", "RNDU"),
    ("23_muECentral.lower", "mpfr_sqrt", "RNDD"),
    ("23_muECentral.upper", "mpfr_sqrt", "RNDU"),
    ("24_hbarC.lower", "mpfr_mul", "RNDD"),
    ("24_hbarC.upper", "mpfr_mul", "RNDU"),
    ("25_muLCentral.lower", "mpfr_div", "RNDD"),
    ("25_muLCentral.upper", "mpfr_div", "RNDU"),
    ("26_muLCentralSquared.lower", "mpfr_mul", "RNDD"),
    ("26_muLCentralSquared.upper", "mpfr_mul", "RNDU"),
    ("27_c4MuLCentralSquared.lower", "mpfr_mul", "RNDD"),
    ("27_c4MuLCentralSquared.upper", "mpfr_mul", "RNDU"),
    ("28_stressScaleCentralViaMu.lower", "mpfr_div", "RNDD"),
    ("28_stressScaleCentralViaMu.upper", "mpfr_div", "RNDU"),
    ("29_eightPiGCentralSquared.lower", "mpfr_mul", "RNDD"),
    ("29_eightPiGCentralSquared.upper", "mpfr_mul", "RNDU"),
    ("30_eightPiGCentralSquaredHbar.lower", "mpfr_mul", "RNDD"),
    ("30_eightPiGCentralSquaredHbar.upper", "mpfr_mul", "RNDU"),
    ("31_gC7.lower", "mpfr_mul", "RNDD"),
    ("31_gC7.upper", "mpfr_mul", "RNDU"),
    ("32_stressScaleCentral.lower", "mpfr_div", "RNDD"),
    ("32_stressScaleCentral.upper", "mpfr_div", "RNDU"),
    ("33_noiseScaleCentral.lower", "mpfr_mul", "RNDD"),
    ("33_noiseScaleCentral.upper", "mpfr_mul", "RNDU"),
    ("34_eightPiGOneSigma.lower", "mpfr_mul", "RNDD"),
    ("34_eightPiGOneSigma.upper", "mpfr_mul", "RNDU"),
    ("35_muEOneSigmaSquared.lower", "mpfr_div", "RNDD"),
    ("35_muEOneSigmaSquared.upper", "mpfr_div", "RNDU"),
    ("36_muEOneSigma.lower", "mpfr_sqrt", "RNDD"),
    ("36_muEOneSigma.upper", "mpfr_sqrt", "RNDU"),
    ("37_muLOneSigma.lower", "mpfr_div", "RNDD"),
    ("37_muLOneSigma.upper", "mpfr_div", "RNDU"),
    ("38_eightPiGOneSigmaSquared.lower", "mpfr_mul", "RNDD"),
    ("38_eightPiGOneSigmaSquared.upper", "mpfr_mul", "RNDU"),
    ("39_eightPiGOneSigmaSquaredHbar.lower", "mpfr_mul", "RNDD"),
    ("39_eightPiGOneSigmaSquaredHbar.upper", "mpfr_mul", "RNDU"),
    ("40_stressScaleOneSigma.lower", "mpfr_div", "RNDD"),
    ("40_stressScaleOneSigma.upper", "mpfr_div", "RNDU"),
    ("41_noiseScaleOneSigma.lower", "mpfr_mul", "RNDD"),
    ("41_noiseScaleOneSigma.upper", "mpfr_mul", "RNDU"),
    ("42_eightPiGAdmissionK2.lower", "mpfr_mul", "RNDD"),
    ("42_eightPiGAdmissionK2.upper", "mpfr_mul", "RNDU"),
    ("43_muEAdmissionK2Squared.lower", "mpfr_div", "RNDD"),
    ("43_muEAdmissionK2Squared.upper", "mpfr_div", "RNDU"),
    ("44_muEAdmissionK2.lower", "mpfr_sqrt", "RNDD"),
    ("44_muEAdmissionK2.upper", "mpfr_sqrt", "RNDU"),
    ("45_muLAdmissionK2.lower", "mpfr_div", "RNDD"),
    ("45_muLAdmissionK2.upper", "mpfr_div", "RNDU"),
    ("46_eightPiGAdmissionK2Squared.lower", "mpfr_mul", "RNDD"),
    ("46_eightPiGAdmissionK2Squared.upper", "mpfr_mul", "RNDU"),
    ("47_eightPiGAdmissionK2SquaredHbar.lower", "mpfr_mul", "RNDD"),
    ("47_eightPiGAdmissionK2SquaredHbar.upper", "mpfr_mul", "RNDU"),
    ("48_stressScaleAdmissionK2.lower", "mpfr_div", "RNDD"),
    ("48_stressScaleAdmissionK2.upper", "mpfr_div", "RNDU"),
    ("49_noiseScaleAdmissionK2.lower", "mpfr_mul", "RNDD"),
    ("49_noiseScaleAdmissionK2.upper", "mpfr_mul", "RNDU"),
    ("central.01_gN.set_integer", "mpfr_set_z", "RNDN"),
    ("central.01_gN.mul_2exp", "mpfr_mul_2si", "RNDN"),
    ("central.02_cN", "mpfr_set_ui", "RNDN"),
    ("central.03_hN", "mpfr_set_str", "RNDN"),
    ("central.04_piN", "mpfr_const_pi", "RNDN"),
    ("central.05_twoN", "mpfr_set_ui", "RNDN"),
    ("central.06_eightN", "mpfr_set_ui", "RNDN"),
    ("central.07_twoPiN", "mpfr_mul", "RNDN"),
    ("central.08_hbarN", "mpfr_div", "RNDN"),
    ("central.09_GN", "mpfr_set_str", "RNDN"),
    ("central.10_eightPiN", "mpfr_mul", "RNDN"),
    ("central.11_c2N", "mpfr_mul", "RNDN"),
    ("central.12_c3N", "mpfr_mul", "RNDN"),
    ("central.13_c4N", "mpfr_mul", "RNDN"),
    ("central.14_c5N", "mpfr_mul", "RNDN"),
    ("central.15_c7N", "mpfr_mul", "RNDN"),
    ("central.16_gHbarN", "mpfr_mul", "RNDN"),
    ("central.17_gHbarC5N", "mpfr_mul", "RNDN"),
    ("central.18_eightPiGN", "mpfr_mul", "RNDN"),
    ("central.19_muE2N", "mpfr_div", "RNDN"),
    ("central.20_muEN", "mpfr_sqrt", "RNDN"),
    ("central.21_hbarCN", "mpfr_mul", "RNDN"),
    ("central.22_muLN", "mpfr_div", "RNDN"),
    ("central.23_eightPiG2N", "mpfr_mul", "RNDN"),
    ("central.24_eightPiG2HbarN", "mpfr_mul", "RNDN"),
    ("central.25_gC7N", "mpfr_mul", "RNDN"),
    ("central.26_stressScaleN", "mpfr_div", "RNDN"),
    ("central.27_noiseScaleN", "mpfr_mul", "RNDN"),
    ("receipt.central_scales.mu_E_central.get_d", "mpfr_get_d", "RNDN"),
    ("receipt.central_scales.mu_L_central.get_d", "mpfr_get_d", "RNDN"),
    (
        "receipt.central_scales.stress_scale_central_closed.get_d",
        "mpfr_get_d",
        "RNDN",
    ),
    ("receipt.central_scales.noise_scale_central.get_d", "mpfr_get_d", "RNDN"),
)

# Independently frozen live-lease operand topology in the same 139-entry order.
# Ordinals are opaque runtime object ordinals; empty tuples denote literal-only
# constructors.  Commutative operations retain directed operand order here.
_EXPECTED_ROUNDED_SOURCE_ORDINALS: Final[tuple[tuple[int, ...], ...]] = (
    (2,),
    (3,),
    (4,),
    (),
    (6,),
    (),
    (),
    (),
    (),
    (),
    (12,),
    (),
    (14,),
    (12, 10),
    (13, 11),
    (8, 17),
    (9, 16),
    (),
    (),
    (),
    (),
    (),
    (24,),
    (25, 23),
    (20, 26),
    (25, 23),
    (21, 28),
    (),
    (30,),
    (31, 23),
    (20, 32),
    (31, 23),
    (21, 34),
    (14, 10),
    (15, 11),
    (6, 6),
    (7, 7),
    (38, 6),
    (39, 7),
    (38, 38),
    (39, 39),
    (42, 6),
    (43, 7),
    (42, 40),
    (43, 41),
    (4, 18),
    (5, 19),
    (48, 44),
    (49, 45),
    (36, 20),
    (37, 21),
    (50, 53),
    (51, 52),
    (54,),
    (55,),
    (18, 6),
    (19, 7),
    (56, 59),
    (57, 58),
    (60, 60),
    (61, 61),
    (42, 62),
    (43, 63),
    (64, 53),
    (65, 52),
    (52, 52),
    (53, 53),
    (68, 18),
    (69, 19),
    (4, 46),
    (5, 47),
    (72, 71),
    (73, 70),
    (74, 74),
    (75, 75),
    (36, 27),
    (37, 29),
    (50, 79),
    (51, 78),
    (80,),
    (81,),
    (82, 59),
    (83, 58),
    (78, 78),
    (79, 79),
    (86, 18),
    (87, 19),
    (72, 89),
    (73, 88),
    (90, 90),
    (91, 91),
    (36, 33),
    (37, 35),
    (50, 95),
    (51, 94),
    (96,),
    (97,),
    (98, 59),
    (99, 58),
    (94, 94),
    (95, 95),
    (102, 18),
    (103, 19),
    (72, 105),
    (73, 104),
    (106, 106),
    (107, 107),
    (110,),
    (111,),
    (),
    (),
    (),
    (),
    (),
    (116, 115),
    (114, 118),
    (),
    (117, 115),
    (113, 113),
    (122, 113),
    (122, 122),
    (124, 113),
    (124, 123),
    (112, 119),
    (127, 125),
    (121, 120),
    (128, 129),
    (130,),
    (119, 113),
    (131, 132),
    (129, 129),
    (134, 119),
    (112, 126),
    (136, 135),
    (137, 137),
    (131,),
    (133,),
    (137,),
    (138,),
)

if (
    len(_EXPECTED_ROUNDED_TRACE) != 139
    or len(_EXPECTED_ROUNDED_SOURCE_ORDINALS) != 139
):
    raise RuntimeError("primary_si_expected_trace_length_invalid")


__all__ = (
    "PrimarySiNormalizationError",
    "PrimarySiNormalizationReceipt",
    "materialize_primary_si_normalization",
    "require_authentic_primary_si_normalization_receipt",
    "validated_primary_si_normalization_receipt_snapshot",
)
