#!/usr/bin/env python3
"""Bounded NHM2 connected-noise full-array diagnostic worker.

This process consumes one exact, server-built descriptor envelope on stdin and
emits one length-prefixed metadata document followed by three raw f64le arrays.
It is deliberately diagnostic-only: it produces no files, uncertainty bound,
run receipt, lamp state, constraint operand, or physical authority.
"""

from __future__ import annotations

import datetime as _datetime
import hashlib
import json
import math
import os
import platform
import struct
import sys
import time
from pathlib import Path
from typing import Any, Iterable, Sequence


SCHEMA_VERSION = (
    "nhm2_conformally_flat_needle_connected_noise_full_array_diagnostic_worker/v1"
)
ENVELOPE_SCHEMA_VERSION = (
    "nhm2_conformally_flat_needle_connected_noise_full_array_diagnostic_envelope/v1"
)
POLICY_SHA256 = "a07fa41375f2cdb00340d5eaef1fbd9fa1a9d573520a55ad13c7ff737270212f"
POLICY_SIZE_BYTES = 18_704
FULL_POLICY_SHA256 = "84ecd8e8755bc79d2fb482ffe4d4df4fe4c63dfd651169643c4b31e37475d199"
FULL_POLICY_SIZE_BYTES = 22_389
MOMENT_MAP_SHA256 = "4a09a273d759851979b6b7ef7a1f381d19dec82474e4fc5088cbdf87ac086fff"
MOMENT_MAP_SIZE_BYTES = 7_738
EXPECTED_PYTHON_VERSION = "3.13.7"
EXPECTED_NUMPY_VERSION = "2.2.6"
EXPECTED_SCIPY_VERSION = "1.16.1"
THREAD_ENVIRONMENT = {
    "OPENBLAS_NUM_THREADS": "1",
    "MKL_NUM_THREADS": "1",
    "OMP_NUM_THREADS": "1",
    "VECLIB_MAXIMUM_THREADS": "1",
    "NUMEXPR_NUM_THREADS": "1",
}
MAX_STDIN_BYTES = 65_536
MAX_METADATA_BYTES = 65_536
MAX_RESIDENT_BYTES = 268_435_456
RAW_ARRAY_BYTES = 3_276_800
RAW_INVENTORY_BYTES = 9_830_400
FULL_SHAPE = (64, 64, 100)
FULL_ELEMENT_COUNT = 409_600


class WorkerFailure(RuntimeError):
    """Typed fail-closed worker failure."""


def _fail(code: str) -> None:
    raise WorkerFailure(code)


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha256_file(path: str | os.PathLike[str]) -> tuple[str, int]:
    digest = hashlib.sha256()
    observed = 0
    with open(path, "rb") as stream:
        while True:
            chunk = stream.read(1 << 20)
            if not chunk:
                break
            digest.update(chunk)
            observed += len(chunk)
    return digest.hexdigest(), observed


def _utc_now() -> str:
    return _datetime.datetime.now(_datetime.timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )


def _object_without_duplicate_keys(
    pairs: Sequence[tuple[str, Any]],
) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for key, value in pairs:
        if key in output:
            _fail("duplicate_json_key")
        output[key] = value
    return output


def _exact_keys(value: Any, expected: Iterable[str], code: str) -> dict[str, Any]:
    if type(value) is not dict or set(value.keys()) != set(expected):
        _fail(code)
    return value


def _read_exact_envelope() -> dict[str, Any]:
    payload = sys.stdin.buffer.read(MAX_STDIN_BYTES + 1)
    if len(payload) == 0 or len(payload) > MAX_STDIN_BYTES:
        _fail("stdin_byte_limit_or_empty")
    try:
        value = json.loads(
            payload.decode("utf-8"), object_pairs_hook=_object_without_duplicate_keys
        )
    except (UnicodeDecodeError, json.JSONDecodeError):
        _fail("stdin_json_invalid")
    envelope = _exact_keys(
        value,
        (
            "schemaVersion",
            "policyCanonicalJson",
            "policySha256",
            "policySizeBytes",
            "fullPolicyCanonicalJson",
            "fullPolicySha256",
            "fullPolicySizeBytes",
            "momentMapCanonicalJson",
            "momentMapSha256",
            "momentMapSizeBytes",
            "workerSourceSha256",
            "workerSourceSizeBytes",
        ),
        "envelope_keys_invalid",
    )
    if envelope["schemaVersion"] != ENVELOPE_SCHEMA_VERSION:
        _fail("envelope_schema_invalid")
    for key in (
        "policyCanonicalJson",
        "policySha256",
        "fullPolicyCanonicalJson",
        "fullPolicySha256",
        "momentMapCanonicalJson",
        "momentMapSha256",
        "workerSourceSha256",
    ):
        if type(envelope[key]) is not str:
            _fail("envelope_string_field_invalid")
    for key in (
        "policySizeBytes",
        "fullPolicySizeBytes",
        "momentMapSizeBytes",
        "workerSourceSizeBytes",
    ):
        if type(envelope[key]) is not int or envelope[key] <= 0:
            _fail("envelope_size_field_invalid")
    return envelope


def _parse_bound_descriptor(
    canonical_json: str, declared_sha: str, declared_size: int, expected_sha: str, expected_size: int
) -> dict[str, Any]:
    raw = canonical_json.encode("utf-8")
    if (
        len(raw) != declared_size
        or declared_size != expected_size
        or _sha256_bytes(raw) != declared_sha
        or declared_sha != expected_sha
    ):
        _fail("descriptor_identity_mismatch")
    try:
        value = json.loads(canonical_json, object_pairs_hook=_object_without_duplicate_keys)
    except json.JSONDecodeError:
        _fail("descriptor_json_invalid")
    if type(value) is not dict:
        _fail("descriptor_root_invalid")
    return value


def _import_frozen_runtime() -> tuple[Any, Any]:
    for name, expected in THREAD_ENVIRONMENT.items():
        if os.environ.get(name) != expected:
            _fail(f"thread_environment_mismatch:{name}")
    if platform.python_implementation() != "CPython":
        _fail("python_implementation_mismatch")
    if platform.python_version() != EXPECTED_PYTHON_VERSION:
        _fail("python_version_mismatch")
    import numpy as np  # Imported only after the thread environment is checked.
    import scipy

    if np.__version__ != EXPECTED_NUMPY_VERSION:
        _fail("numpy_version_mismatch")
    if scipy.__version__ != EXPECTED_SCIPY_VERSION:
        _fail("scipy_version_mismatch")
    np.seterr(all="raise")
    return np, scipy


def _validate_descriptors(
    policy: dict[str, Any], full_policy: dict[str, Any], moment: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    policy_root = _exact_keys(
        policy,
        ("artifactId", "schemaVersion", "content", "contentBinding"),
        "policy_root_keys_invalid",
    )
    content = policy_root.get("content")
    if type(content) is not dict:
        _fail("policy_content_invalid")
    if policy_root.get("artifactId") != "nhm2.conformally_flat_needle_connected_noise_diagnostic_cubature_worker_policy":
        _fail("policy_artifact_id_mismatch")
    if policy_root.get("schemaVersion") != "nhm2_conformally_flat_needle_connected_noise_diagnostic_cubature_worker_policy/v1":
        _fail("policy_schema_mismatch")
    binding = policy_root.get("contentBinding")
    if type(binding) is not dict or binding.get("sha256") is None:
        _fail("policy_content_binding_missing")

    expected_false_paths = (
        ("authoritativeExecutionReady",),
        ("inputBoundary", "acceptsNumericArguments"),
        ("inputBoundary", "acceptsUserArguments"),
        ("inputBoundary", "acceptsEnvironmentOverrides"),
        ("inputBoundary", "acceptsCommandLineOverrides"),
        ("inputBoundary", "acceptsToleranceOverrides"),
        ("inputBoundary", "acceptsWorkOverrides"),
        ("inputBoundary", "acceptsAuthorityOverrides"),
        ("outputAuthority", "mayFeedFixedBackgroundRun"),
        ("outputAuthority", "executionAuthority"),
        ("outputAuthority", "replayAuthority"),
        ("outputAuthority", "lampAuthority"),
        ("outputAuthority", "constraintAuthority"),
        ("outputAuthority", "physicalClaimAuthority"),
        ("outputAuthority", "propulsionAuthority"),
        ("outputAuthority", "transportAuthority"),
    )
    for path in expected_false_paths:
        cursor: Any = content
        for key in path:
            if type(cursor) is not dict or key not in cursor:
                _fail("policy_required_field_missing")
            cursor = cursor[key]
        if cursor is not False:
            _fail("policy_authority_or_override_drift")
    if content["inputBoundary"].get("acceptedCallerConfigurationKeys") != []:
        _fail("policy_caller_configuration_surface_drift")
    if content.get("diagnosticWorkerImplementationInputsFrozen") is not True:
        _fail("policy_diagnostic_worker_inputs_not_frozen")
    hard_caps = content.get("hardCaps")
    if type(hard_caps) is not dict or hard_caps.get("maximumPointCount") != 262_144:
        _fail("policy_hard_caps_drift")
    if (
        hard_caps.get("maximumResidentBytes") != MAX_RESIDENT_BYTES
        or hard_caps.get("maximumRawBytesPerFullArray") != RAW_ARRAY_BYTES
        or hard_caps.get("maximumFullArrayInventoryBytes") != RAW_INVENTORY_BYTES
        or hard_caps.get("partialOutputAllowed") is not False
        or hard_caps.get("disposition") != "abort_without_output"
    ):
        _fail("policy_hard_caps_drift")

    geometry = content.get("geometryAndScatter")
    numerics = content.get("diagnosticNumerics")
    prefixes = content.get("prefixesAndBatching")
    runtime = content.get("diagnosticRuntimePolicy")
    if not all(type(entry) is dict for entry in (geometry, numerics, prefixes, runtime)):
        _fail("policy_worker_section_missing")
    if (
        prefixes.get("coarsePointCount") != 131_072
        or prefixes.get("finePointCount") != 262_144
        or prefixes.get("batchPointCount") != 4_096
        or prefixes.get("maximumBatchCount") != 64
    ):
        _fail("policy_prefix_drift")
    if (
        geometry.get("halfWidthsM") != [0.002, 0.01, 0.002, 0.002]
        or geometry.get("sampleOrdinalIdentity") != "p=16*i_z+4*i_y+i_x"
        or len(geometry.get("sampleCentersXYZMicrometersInOrdinalOrder", [])) != 64
        or len(geometry.get("canonicalDisplacementsXYZMicrometersInOrdinalOrder", [])) != 75
        or len(geometry.get("normalizationOrbitRepresentativesXYZMicrometers", [])) != 6
        or len(geometry.get("normalizationOrbitOrdinalBySampleOrdinal", [])) != 64
    ):
        _fail("policy_geometry_drift")
    expected_runtime = runtime.get("requiredUnattestedVersionTuple")
    if expected_runtime != {
        "implementation": "CPython",
        "pythonVersion": EXPECTED_PYTHON_VERSION,
        "numpyVersion": EXPECTED_NUMPY_VERSION,
        "scipyVersion": EXPECTED_SCIPY_VERSION,
    }:
        _fail("policy_runtime_tuple_drift")

    moment_root = _exact_keys(
        moment,
        (
            "schemaVersion",
            "componentOrder",
            "monomialExponents",
            "commonDenominator",
            "numeratorRows",
            "parityProjectedZeroPairOrdinals",
            "parityAdmittedUpperPairOrdinals",
            "pairReflectionSignatures",
            "exchangeComponentPairOrdinals",
            "yzExchangeComponentOrdinals",
            "yzExchangeComponentPairOrdinals",
            "yzExchangeMonomialOrdinals",
            "scatter",
        ),
        "moment_map_root_keys_invalid",
    )
    if (
        moment_root.get("schemaVersion")
        != "nhm2_conformally_flat_needle_connected_noise_spectral_moment_map/v1"
        or moment_root.get("commonDenominator") != 6
        or len(moment_root.get("componentOrder", [])) != 10
        or len(moment_root.get("monomialExponents", [])) != 22
        or len(moment_root.get("numeratorRows", [])) != 100
        or any(len(row) != 22 for row in moment_root.get("numeratorRows", []))
        or moment_root.get("scatter", {}).get("targetShape") != [64, 64, 100]
        or moment_root.get("scatter", {}).get("targetElementCount") != FULL_ELEMENT_COUNT
    ):
        _fail("moment_map_shape_or_schema_drift")
    expected_triples = content.get("reductions", {}).get("exponentTripleOrderKxKyKz")
    if expected_triples != [",".join(str(x) for x in exponents[1:]) for exponents in moment_root["monomialExponents"]]:
        _fail("policy_moment_order_mismatch")
    full_root = _exact_keys(
        full_policy,
        ("artifactId", "contractVersion", "contentBinding", "content"),
        "full_policy_root_keys_invalid",
    )
    full_content = full_root.get("content")
    if (
        full_root.get("artifactId")
        != "nhm2.conformally_flat_needle_connected_noise_diagnostic_cubature_policy"
        or full_root.get("contractVersion")
        != "nhm2_conformally_flat_needle_connected_noise_diagnostic_cubature_policy/v1"
        or type(full_content) is not dict
        or full_content.get("executionAdmissible") is not False
    ):
        _fail("full_policy_identity_or_blocked_state_drift")
    worker_binding = full_content.get("workerPolicyDescriptorBinding")
    if (
        type(worker_binding) is not dict
        or worker_binding.get("canonicalSha256") != POLICY_SHA256
        or worker_binding.get("canonicalSizeBytes") != POLICY_SIZE_BYTES
        or worker_binding.get("callerOverrideSurfacePresent") is not False
    ):
        _fail("full_policy_worker_binding_drift")
    sobol = full_content.get("sobolPolicy")
    if (
        type(sobol) is not dict
        or sobol.get("dimensionCount") != 3
        or sobol.get("coordinateWordBits") != 32
        or sobol.get("scramble") is not False
        or sobol.get("digitalShift") is not None
        or sobol.get("maximumDirectionExponentUsed") != 18
        or len(sobol.get("directionNumberParameters", [])) != 3
        or sobol.get("coarsePrefix", {}).get("pointCount") != 131_072
        or sobol.get("finePrefix", {}).get("pointCount") != 262_144
    ):
        _fail("full_policy_sobol_drift")
    locks = full_content.get("authority", {}).get("locks")
    claims = full_content.get("claimLocks")
    if (
        type(locks) is not dict
        or any(value is not False for value in locks.values())
        or type(claims) is not dict
        or any(value is not False for value in claims.values())
    ):
        _fail("full_policy_authority_drift")
    return content, moment_root, sobol


def _q_bump_scalar(u: float) -> float:
    absolute = abs(u)
    if absolute >= 1.0:
        return 0.0
    return math.exp(-(u * u) / (1.0 - u * u))


def _q_values(np: Any, z: Any, nodes: Any, weighted_bump: Any, row_batch: int = 1024) -> Any:
    output = np.empty(z.shape[0], dtype=np.float64)
    for start in range(0, z.shape[0], row_batch):
        stop = min(start + row_batch, z.shape[0])
        rows = np.zeros(stop - start, dtype=np.float64)
        z_batch = z[start:stop]
        for ordinal in range(nodes.shape[0]):
            rows += (2.0 * weighted_bump[ordinal]) * np.cos(z_batch * nodes[ordinal])
        output[start:stop] = rows
    return output


def _left_prefix_trapezoid(np: Any, x: Any, values: Any) -> Any:
    output = np.zeros(values.shape[0], dtype=np.float64)
    increments = (
        (x[1:] - x[:-1]) * 0.5 * (values[:-1] + values[1:])
    ).astype(np.float64, copy=False)
    output[1:] = np.cumsum(increments, dtype=np.float64)
    return output


def _inverse_cdf(np: Any, targets: Any, grid: Any, cdf: Any) -> Any:
    indices = np.searchsorted(cdf, targets, side="left")
    indices = np.minimum(indices, cdf.shape[0] - 1)
    result = np.empty(targets.shape[0], dtype=np.float64)
    zeros = targets == 0.0
    result[zeros] = 0.0
    active = ~zeros
    upper = indices[active]
    lower = np.maximum(upper - 1, 0)
    c0 = cdf[lower]
    c1 = cdf[upper]
    z0 = grid[lower]
    z1 = grid[upper]
    denominator = c1 - c0
    interpolated = z1.copy()
    non_plateau = denominator > 0.0
    interpolated[non_plateau] = z0[non_plateau] + (
        (targets[active][non_plateau] - c0[non_plateau])
        * (z1[non_plateau] - z0[non_plateau])
        / denominator[non_plateau]
    )
    result[active] = interpolated
    return result


def _direction_numbers(np: Any, degree: int, coefficient: int, initial_m: Sequence[int]) -> Any:
    values = np.zeros(32, dtype=np.uint32)
    if degree == 0:
        for j in range(1, 33):
            values[j - 1] = np.uint32(1 << (32 - j))
        return values
    for j in range(1, degree + 1):
        values[j - 1] = np.uint32(initial_m[j - 1] << (32 - j))
    for j in range(degree + 1, 33):
        value = int(values[j - degree - 1])
        value ^= value >> degree
        for k in range(1, degree):
            if (coefficient >> (degree - 1 - k)) & 1:
                value ^= int(values[j - k - 1])
        values[j - 1] = np.uint32(value)
    return values


def _sobol_points(np: Any, start: int, count: int, parameters: Sequence[dict[str, Any]]) -> Any:
    indices = np.arange(start, start + count, dtype=np.uint32)
    gray = np.bitwise_xor(indices, np.right_shift(indices, np.uint32(1)))
    points = np.zeros((count, 3), dtype=np.float64)
    for dimension, parameter in enumerate(parameters):
        directions = _direction_numbers(
            np,
            int(parameter["degreeS"]),
            int(parameter["coefficientA"]),
            parameter["initialOddM"],
        )
        words = np.zeros(count, dtype=np.uint32)
        for bit in range(18):
            mask = np.uint32(0) - np.bitwise_and(
                np.right_shift(gray, np.uint32(bit)), np.uint32(1)
            )
            words = np.bitwise_xor(words, np.bitwise_and(mask, directions[bit]))
        points[:, dimension] = words.astype(np.float64) / 4_294_967_296.0
    return points


def _interpolate_prefix(np: Any, lower: Any, grid: Any, prefix: Any, upper_index: int) -> Any:
    result = np.zeros(lower.shape[0], dtype=np.float64)
    inside = lower < grid[upper_index]
    if not np.any(inside):
        return result
    values = lower[inside]
    index = np.floor(values * 256.0).astype(np.int64)
    index = np.minimum(index, upper_index - 1)
    fraction = (values - grid[index]) * 256.0
    at_lower = prefix[index] + fraction * (prefix[index + 1] - prefix[index])
    result[inside] = prefix[upper_index] - at_lower
    return result


def _sample_normalizations(np: Any, geometry: dict[str, Any], q0: float) -> tuple[Any, Any]:
    nodes, weights = np.polynomial.legendre.leggauss(32)
    bump = np.array([_q_bump_scalar(float(value)) for value in nodes], dtype=np.float64)
    weighted = weights * bump
    orbit_values: list[float] = []
    for center_um in geometry["normalizationOrbitRepresentativesXYZMicrometers"]:
        cx, cy, cz = [float(value) / 1_000_000.0 for value in center_um]
        s_value = 0.0
        for x_ordinal in range(32):
            x = cx + 0.01 * float(nodes[x_ordinal])
            x_weight = float(weighted[x_ordinal])
            for y_ordinal in range(32):
                y = cy + 0.002 * float(nodes[y_ordinal])
                xy_weight = x_weight * float(weighted[y_ordinal])
                for z_ordinal in range(32):
                    z = cz + 0.002 * float(nodes[z_ordinal])
                    radius = (x / 0.25) ** 2 + (y / 0.05) ** 2 + (z / 0.05) ** 2
                    compact = (
                        math.exp(-radius / (1.0 - radius))
                        if radius < 1.0
                        else 0.0
                    )
                    omega = 1.0 + 0.000001 * compact
                    term = (
                        xy_weight
                        * float(weighted[z_ordinal])
                        * omega**4
                    )
                    s_value += term
        cp = 1.0 / (float(geometry["volumeM4"]) * q0 * s_value)
        if not math.isfinite(cp) or cp <= 0.0:
            _fail("normalization_nonfinite")
        orbit_values.append(cp)
    orbit = np.asarray(orbit_values, dtype=np.float64)
    expansion = np.asarray(geometry["normalizationOrbitOrdinalBySampleOrdinal"], dtype=np.int64)
    return orbit, orbit[expansion]


def _peak_resident_bytes() -> int:
    if os.name == "nt":
        import ctypes
        from ctypes import wintypes

        class Counters(ctypes.Structure):
            _fields_ = [
                ("cb", wintypes.DWORD),
                ("PageFaultCount", wintypes.DWORD),
                ("PeakWorkingSetSize", ctypes.c_size_t),
                ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                ("PagefileUsage", ctypes.c_size_t),
                ("PeakPagefileUsage", ctypes.c_size_t),
            ]

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        kernel32.GetCurrentProcess.argtypes = []
        kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        psapi.GetProcessMemoryInfo.argtypes = [
            wintypes.HANDLE,
            ctypes.POINTER(Counters),
            wintypes.DWORD,
        ]
        psapi.GetProcessMemoryInfo.restype = wintypes.BOOL
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        ok = psapi.GetProcessMemoryInfo(
            kernel32.GetCurrentProcess(),
            ctypes.byref(counters),
            counters.cb,
        )
        if not ok:
            _fail("resident_memory_observation_failed")
        return int(counters.PeakWorkingSetSize)
    try:
        import resource

        value = int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
        return value if sys.platform == "darwin" else value * 1024
    except (ImportError, OSError):
        _fail("resident_memory_observation_failed")


def _assert_memory_cap() -> int:
    peak = _peak_resident_bytes()
    if peak > MAX_RESIDENT_BYTES:
        _fail("resident_memory_cap_exceeded")
    return peak


def _phase_pattern_ordinal(exponents: Sequence[int]) -> int:
    parity = tuple(int(value) & 1 for value in exponents[1:])
    patterns = ((0, 0, 0), (1, 1, 0), (1, 0, 1), (0, 1, 1))
    try:
        return patterns.index(parity)
    except ValueError:
        _fail("unexpected_spatial_parity_pattern")


def _accumulate_moments(
    np: Any,
    content: dict[str, Any],
    moment: dict[str, Any],
    grid: Any,
    q_squared: Any,
    cdf: Any,
    prefix_by_power: dict[int, Any],
    sobol: dict[str, Any],
) -> tuple[Any, Any, Any]:
    geometry = content["geometryAndScatter"]
    prefixes = content["prefixesAndBatching"]
    displacements = np.asarray(
        geometry["canonicalDisplacementsXYZMicrometersInOrdinalOrder"], dtype=np.float64
    ) / 1_000_000.0
    exponents = np.asarray(moment["monomialExponents"], dtype=np.int64)
    pattern_ordinals = np.asarray(
        [_phase_pattern_ordinal(entry) for entry in exponents], dtype=np.int64
    )
    reconstruction = content["diagnosticNumerics"]["positiveOctantReconstruction"]
    class_names = ("evenEvenEven", "oddOddEven", "oddEvenOdd", "evenOddOdd")
    frozen_class_ordinals = [
        np.asarray(reconstruction["parityClassMomentOrdinals"][name], dtype=np.int64)
        for name in class_names
    ]
    if any(
        not np.array_equal(selected, np.flatnonzero(pattern_ordinals == ordinal))
        for ordinal, selected in enumerate(frozen_class_ordinals)
    ):
        _fail("frozen_parity_class_mismatch")

    normalizer = float(cdf[-1])
    if normalizer != 1.0:
        _fail("cdf_not_normalized")
    z_q = float(prefix_by_power[0][-1])
    importance_factor = z_q**3 / (0.01 * 0.002 * 0.002)
    primary = np.zeros((75, 22), dtype=np.float64)
    comparison = np.zeros((75, 22), dtype=np.float64)
    coarse = None
    batch_count = int(prefixes["maximumBatchCount"])
    batch_size = int(prefixes["batchPointCount"])
    parameters = sobol["directionNumberParameters"]
    primary_upper_index = 128 * 256
    comparison_upper_index = 256 * 256

    for batch_ordinal in range(batch_count):
        sobol_points = _sobol_points(np, batch_ordinal * batch_size, batch_size, parameters)
        u = np.column_stack(
            [_inverse_cdf(np, sobol_points[:, axis], grid, cdf) for axis in range(3)]
        )
        k = u / np.asarray([0.01, 0.002, 0.002], dtype=np.float64)
        lower_dimensionless = 0.002 * np.sqrt(np.sum(k * k, axis=1))

        angle_x = k[:, 0, None] * displacements[None, :, 0]
        angle_y = k[:, 1, None] * displacements[None, :, 1]
        angle_z = k[:, 2, None] * displacements[None, :, 2]
        cos_x, sin_x = np.cos(angle_x), np.sin(angle_x)
        cos_y, sin_y = np.cos(angle_y), np.sin(angle_y)
        cos_z, sin_z = np.cos(angle_z), np.sin(angle_z)
        phase_by_pattern = []
        for left, middle, right, scale in (
            (cos_x, cos_y, cos_z, 8.0),
            (sin_x, sin_y, cos_z, -8.0),
            (sin_x, cos_y, sin_z, -8.0),
            (cos_x, sin_y, sin_z, -8.0),
        ):
            phase = np.multiply(left, middle)
            np.multiply(phase, right, out=phase)
            np.multiply(phase, scale, out=phase)
            phase_by_pattern.append(phase)

        primary_contributions = np.empty((batch_size, 22), dtype=np.float64)
        comparison_contributions = np.empty((batch_size, 22), dtype=np.float64)
        for moment_ordinal, exponent in enumerate(exponents):
            energy_power = int(exponent[0])
            spatial_power = (
                np.power(k[:, 0], int(exponent[1]))
                * np.power(k[:, 1], int(exponent[2]))
                * np.power(k[:, 2], int(exponent[3]))
            )
            prefix = prefix_by_power[energy_power]
            primary_j = _interpolate_prefix(
                np, lower_dimensionless, grid, prefix, primary_upper_index
            ) / (0.002 ** (energy_power + 1))
            comparison_j = _interpolate_prefix(
                np, lower_dimensionless, grid, prefix, comparison_upper_index
            ) / (0.002 ** (energy_power + 1))
            primary_contributions[:, moment_ordinal] = (
                importance_factor * spatial_power * primary_j
            )
            comparison_contributions[:, moment_ordinal] = (
                importance_factor * spatial_power * comparison_j
            )

        primary_batch = np.zeros((75, 22), dtype=np.float64)
        comparison_batch = np.zeros((75, 22), dtype=np.float64)
        for pattern_ordinal, selected in enumerate(frozen_class_ordinals):
            primary_batch[:, selected] = np.matmul(
                phase_by_pattern[pattern_ordinal].T,
                primary_contributions[:, selected],
            )
            comparison_batch[:, selected] = np.matmul(
                phase_by_pattern[pattern_ordinal].T,
                comparison_contributions[:, selected],
            )
        np.add(primary, primary_batch, out=primary)
        np.add(comparison, comparison_batch, out=comparison)
        if batch_ordinal + 1 == 32:
            coarse = primary.copy()
        _assert_memory_cap()

    if coarse is None:
        _fail("coarse_snapshot_missing")
    primary_fine = primary / 262_144.0
    primary_coarse = coarse / 131_072.0
    comparison_fine = comparison / 262_144.0
    return primary_fine, primary_fine - primary_coarse, comparison_fine - primary_fine


def _scatter_full_arrays(
    np: Any,
    content: dict[str, Any],
    moment: dict[str, Any],
    moment_observations: tuple[Any, Any, Any],
    cp_by_sample: Any,
) -> tuple[Any, Any, Any]:
    geometry = content["geometryAndScatter"]
    scalar = content["diagnosticNumerics"]["scalarIntegrationAndScatter"]
    rows = np.asarray(moment["numeratorRows"], dtype=np.float64)
    canonical_tensors = [np.matmul(values, rows.T) / 6.0 for values in moment_observations]
    arrays = [np.empty(FULL_SHAPE, dtype=np.float64) for _ in range(3)]
    centers = geometry["sampleCentersXYZMicrometersInOrdinalOrder"]
    displacement_ordinals = {
        tuple(int(value) for value in entry): ordinal
        for ordinal, entry in enumerate(
            geometry["canonicalDisplacementsXYZMicrometersInOrdinalOrder"]
        )
    }
    reflection = moment["pairReflectionSignatures"]
    yz_pairs = moment["yzExchangeComponentPairOrdinals"]
    volume = float(geometry["volumeM4"])
    global_factor = float(scalar["hbarCSquaredTimesInverseFourierAndRhoBinary64"]) * volume**2

    for left in range(64):
        for right in range(64):
            delta = [int(centers[left][axis]) - int(centers[right][axis]) for axis in range(3)]
            absolute = [abs(value) for value in delta]
            yz_swap = absolute[1] > absolute[2]
            canonical_key = (absolute[0], min(absolute[1], absolute[2]), max(absolute[1], absolute[2]))
            displacement = displacement_ordinals.get(canonical_key)
            if displacement is None:
                _fail("scatter_displacement_missing")
            first_sample = min(left, right)
            second_sample = max(left, right)
            scale = global_factor * (
                float(cp_by_sample[first_sample])
                * float(cp_by_sample[second_sample])
            )
            for pair in range(100):
                source_pair = int(yz_pairs[pair]) if yz_swap else pair
                reflection_factor = 1
                for axis in range(3):
                    if delta[axis] < 0:
                        reflection_factor *= int(reflection[pair][axis])
                for observation_ordinal in range(3):
                    arrays[observation_ordinal][left, right, pair] = (
                        scale
                        * reflection_factor
                        * canonical_tensors[observation_ordinal][displacement, source_pair]
                    )
    for array in arrays:
        if not np.all(np.isfinite(array)):
            _fail("full_array_nonfinite")
        array[array == 0.0] = 0.0
    return arrays[0], arrays[1], arrays[2]


def _run(
    np: Any,
    scipy: Any,
    content: dict[str, Any],
    moment: dict[str, Any],
    sobol: dict[str, Any],
) -> tuple[dict[str, Any], tuple[bytes, bytes, bytes]]:
    started_at = _utc_now()
    started = time.perf_counter_ns()
    q_policy = content["diagnosticNumerics"]["qEvaluator"]
    nodes_raw, weights_raw = np.polynomial.legendre.leggauss(int(q_policy["quadratureOrder"]))
    nodes = (nodes_raw + 1.0) * 0.5
    weights = weights_raw * 0.5
    bump = np.asarray([_q_bump_scalar(float(value)) for value in nodes], dtype=np.float64)
    weighted_bump = weights * bump
    grid = np.arange(65_537, dtype=np.float64) / 256.0
    q = _q_values(np, grid, nodes, weighted_bump, int(q_policy["rowBatchPointCount"]))
    q_squared = q * q
    cdf_raw = _left_prefix_trapezoid(np, grid, q_squared)
    truncated_q_squared_integral = float(cdf_raw[-1])
    if not math.isfinite(truncated_q_squared_integral) or truncated_q_squared_integral <= 0.0:
        _fail("cdf_normalizer_invalid")
    cdf = cdf_raw / truncated_q_squared_integral
    cdf[-1] = 1.0
    prefix_by_power = {
        power: _left_prefix_trapezoid(np, grid, (grid**power) * q_squared)
        for power in (0, 2, 4)
    }
    q0 = float(q[0])
    cp_orbits, cp_by_sample = _sample_normalizations(
        np, content["geometryAndScatter"], q0
    )
    _assert_memory_cap()
    moment_observations = _accumulate_moments(
        np, content, moment, grid, q_squared, cdf, prefix_by_power, sobol
    )
    arrays = _scatter_full_arrays(np, content, moment, moment_observations, cp_by_sample)
    raw = tuple(array.astype("<f8", copy=False).tobytes(order="C") for array in arrays)
    if any(len(entry) != RAW_ARRAY_BYTES for entry in raw):
        _fail("raw_array_size_mismatch")
    peak = _assert_memory_cap()
    completed = time.perf_counter_ns()
    completed_at = _utc_now()
    python_sha, python_size = _sha256_file(sys.executable)
    numpy_sha, numpy_size = _sha256_file(np.__file__)
    scipy_sha, scipy_size = _sha256_file(scipy.__file__)
    worker_sha, worker_size = _sha256_file(__file__)
    observations = []
    identifiers = (
        ("central", "diagnostic_binary64_truncated_not_enclosed"),
        ("refinement_observation", "diagnostic_binary64_refinement_observation_not_an_error_bound"),
        ("cutoff_observation", "diagnostic_binary64_cutoff_observation_not_a_tail_enclosure"),
    )
    for (identifier, status), data in zip(identifiers, raw, strict=True):
        observations.append(
            {
                "id": identifier,
                "shape": list(FULL_SHAPE),
                "elementRepresentation": "ieee754_binary64_little_endian",
                "sizeBytes": len(data),
                "sha256": _sha256_bytes(data),
                "status": status,
            }
        )
    metadata = {
        "schemaVersion": SCHEMA_VERSION,
        "status": "diagnostic_full_shape_central_and_observations_produced_not_enclosed",
        "diagnosticOnly": True,
        "timing": {
            "startedAt": started_at,
            "completedAt": completed_at,
            "durationNanoseconds": completed - started,
        },
        "runtime": {
            "implementation": platform.python_implementation(),
            "pythonVersion": platform.python_version(),
            "numpyVersion": np.__version__,
            "scipyVersion": scipy.__version__,
            "pythonExecutable": str(Path(sys.executable).resolve()),
            "pythonExecutableSha256": python_sha,
            "pythonExecutableSizeBytes": python_size,
            "numpyInitSourceSha256": numpy_sha,
            "numpyInitSourceSizeBytes": numpy_size,
            "scipyInitSourceSha256": scipy_sha,
            "scipyInitSourceSizeBytes": scipy_size,
            "workerSourceSha256": worker_sha,
            "workerSourceSizeBytes": worker_size,
            "threadEnvironment": THREAD_ENVIRONMENT,
            "peakResidentBytesObserved": peak,
            "maximumResidentBytes": MAX_RESIDENT_BYTES,
        },
        "descriptorBindings": {
            "cubatureWorkerPolicySha256": POLICY_SHA256,
            "cubatureWorkerPolicySizeBytes": POLICY_SIZE_BYTES,
            "cubatureFullPolicySha256": FULL_POLICY_SHA256,
            "cubatureFullPolicySizeBytes": FULL_POLICY_SIZE_BYTES,
            "spectralMomentMapSha256": MOMENT_MAP_SHA256,
            "spectralMomentMapSizeBytes": MOMENT_MAP_SIZE_BYTES,
        },
        "numericalObservations": {
            "q0": q0,
            "truncatedQSquaredIntegral0To256": truncated_q_squared_integral,
            "sampleNormalizationCpOrbitValues": [float(value) for value in cp_orbits],
            "arithmetic": "ieee754_binary64",
            "sobol": "contract_owned_unscrambled_uint32_gray_code_recurrence",
            "coarsePointCount": 131_072,
            "finePointCount": 262_144,
            "primaryUpperCutoffDimensionless": 128,
            "comparisonUpperCutoffDimensionless": 256,
        },
        "outputs": observations,
        "deterministicEnclosure": None,
        "simultaneousAbsoluteUncertainty95": None,
        "tailEnclosure": None,
        "mayFeedFixedBackgroundRun": False,
        "authority": {
            "numericalEnclosureAuthority": False,
            "fixedBackgroundRunAuthority": False,
            "executionAuthority": False,
            "replayAuthority": False,
            "agreementAuthority": False,
            "lampAuthority": False,
            "constraintAuthority": False,
            "admConstraintAuthority": False,
            "bracketAuthority": False,
            "physicalClaimAuthority": False,
            "propulsionAuthority": False,
            "transportAuthority": False,
            "certificateAuthority": False,
        },
        "claimLocks": {
            "connectedNoiseDiagnosticPass": False,
            "semiclassicalStressNoiseLamp": False,
            "constraintClosureLamp": False,
            "admConstraintClosure": False,
            "bracketClosure": False,
            "physicalViability": False,
            "propulsion": False,
            "transport": False,
            "certificateEligibility": False,
            "certificateIssued": False,
        },
    }
    return metadata, raw


def _main() -> int:
    try:
        envelope = _read_exact_envelope()
        worker_sha, worker_size = _sha256_file(__file__)
        if (
            envelope["workerSourceSha256"] != worker_sha
            or envelope["workerSourceSizeBytes"] != worker_size
        ):
            _fail("worker_source_identity_mismatch")
        policy = _parse_bound_descriptor(
            envelope["policyCanonicalJson"],
            envelope["policySha256"],
            envelope["policySizeBytes"],
            POLICY_SHA256,
            POLICY_SIZE_BYTES,
        )
        full_policy = _parse_bound_descriptor(
            envelope["fullPolicyCanonicalJson"],
            envelope["fullPolicySha256"],
            envelope["fullPolicySizeBytes"],
            FULL_POLICY_SHA256,
            FULL_POLICY_SIZE_BYTES,
        )
        moment = _parse_bound_descriptor(
            envelope["momentMapCanonicalJson"],
            envelope["momentMapSha256"],
            envelope["momentMapSizeBytes"],
            MOMENT_MAP_SHA256,
            MOMENT_MAP_SIZE_BYTES,
        )
        content, moment_descriptor, sobol = _validate_descriptors(
            policy, full_policy, moment
        )
        np, scipy = _import_frozen_runtime()
        metadata, arrays = _run(np, scipy, content, moment_descriptor, sobol)
        metadata_bytes = json.dumps(
            metadata, separators=(",", ":"), ensure_ascii=True, allow_nan=False
        ).encode("utf-8")
        if len(metadata_bytes) > MAX_METADATA_BYTES:
            _fail("metadata_byte_limit_exceeded")
        if sum(len(entry) for entry in arrays) != RAW_INVENTORY_BYTES:
            _fail("output_inventory_size_mismatch")
        _assert_memory_cap()
        sys.stdout.buffer.write(struct.pack("<Q", len(metadata_bytes)))
        sys.stdout.buffer.write(metadata_bytes)
        for array in arrays:
            sys.stdout.buffer.write(array)
            _assert_memory_cap()
        sys.stdout.buffer.flush()
        _assert_memory_cap()
        return 0
    except WorkerFailure as error:
        sys.stderr.write(f"nhm2_connected_noise_full_array_diagnostic:{error}\n")
        return 2
    except Exception as error:  # No traceback or partial scientific output.
        sys.stderr.write(
            f"nhm2_connected_noise_full_array_diagnostic:unexpected:{type(error).__name__}\n"
        )
        return 3


if __name__ == "__main__":
    raise SystemExit(_main())
