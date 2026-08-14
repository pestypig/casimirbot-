#!/usr/bin/env python3
"""Build or verify the candidate-independent MPFR-256 GL(256) fixture.

The generator observes one pinned gmpy2/MPFR toolchain.  It computes the 128
positive Gauss--Legendre roots independently at 1024 and 1536 bits, requires
the two calculations to serialize to identical MPFR-256 records, and then
constructs the negative half by exact sign reflection.  The checked-in JSONL
is therefore an exact byte fixture of rounded values, not a claim that the
rounded values are exact algebraic roots.

Every serialized value denotes ``sign * significand * 2**exponent2`` with a
normalized 256-bit hexadecimal significand.  Its represented real value is
the closed half-ulp cell centered on that dyadic value.  Downstream proofs
must propagate those cells.

This script is deliberately candidate-independent and grants no solver,
scientific, gate, certificate, physical, propulsion, or transport authority.
"""

from __future__ import annotations

import argparse
from fractions import Fraction
import hashlib
import json
import platform
from pathlib import Path
import sys
from typing import Any, Final, Iterable

import gmpy2


SCHEMA: Final[str] = "nhm2_spherical_gl256_mpfr256_manifest/v1"
RECORD_SCHEMA: Final[str] = "nhm2_spherical_gl256_mpfr256_record/v1"
ALGORITHM_ID: Final[str] = "symmetric_gl256_newton_legendre_cross_precision/v1"
ORDER: Final[int] = 256
HALF_ORDER: Final[int] = ORDER // 2
SERIALIZATION_BITS: Final[int] = 256
WORK_PRECISIONS: Final[tuple[int, int]] = (1024, 1536)
ROUNDING_MODE: Final[int] = gmpy2.RoundToNearest
EMIN: Final[int] = -1_000_000
EMAX: Final[int] = 1_000_000

PINNED_PYTHON_IMPLEMENTATION: Final[str] = "CPython"
PINNED_PYTHON_VERSION: Final[str] = "3.13.7"
PINNED_GMPY2_VERSION: Final[str] = "2.3.1"
PINNED_MPFR_VERSION: Final[str] = "MPFR 4.2.2"
PINNED_GMP_VERSION: Final[str] = "GMP 6.3.0"
PINNED_MPC_VERSION: Final[str] = "MPC 1.4.0"
PINNED_NATIVE_RUNTIME_BASENAMES: Final[tuple[str, ...]] = (
    "libgcc_s_seh-1.dll",
    "libgmp-10.dll",
    "libmpc-3.dll",
    "libmpfr-6.dll",
    "libwinpthread-1.dll",
)

REPO_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
SCRIPT_RELATIVE: Final[str] = (
    "scripts/research/build-verify-nhm2-spherical-gl256-mpfr256.py"
)
RAW_RELATIVE: Final[str] = (
    "configs/research/fixtures/nhm2-spherical-gl256-mpfr256.v1.jsonl"
)
MANIFEST_RELATIVE: Final[str] = (
    "configs/research/nhm2-spherical-gl256-mpfr256-manifest.v1.json"
)
TEST_RELATIVE: Final[str] = (
    "tests/nhm2-spherical-gl256-mpfr256-fixture.spec.ts"
)


class FixtureError(RuntimeError):
    """A deterministic, fail-closed fixture build or verification error."""


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical_json(value: Any) -> bytes:
    return (
        json.dumps(
            value,
            ensure_ascii=True,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        + "\n"
    ).encode("ascii")


def _canonical_jsonl(records: Iterable[dict[str, Any]]) -> bytes:
    return b"".join(_canonical_json(record) for record in records)


def _runtime_identity() -> dict[str, Any]:
    package_path = Path(gmpy2.__file__).resolve()
    package_raw = package_path.read_bytes()
    extension_candidates = tuple(package_path.parent.glob("gmpy2.*.pyd"))
    if len(extension_candidates) != 1:
        raise FixtureError(
            f"unique_gmpy2_native_extension_required:{len(extension_candidates)}"
        )
    extension_path = extension_candidates[0].resolve()
    extension_raw = extension_path.read_bytes()
    native_library_directory = (
        package_path.parent.parent / "gmpy2.libs"
    ).resolve(strict=True)
    if not native_library_directory.is_dir():
        raise FixtureError("gmpy2_native_runtime_directory_required")
    native_library_paths = tuple(
        sorted(
            (
                path
                for path in native_library_directory.iterdir()
                if path.suffix.casefold() == ".dll"
            ),
            key=lambda path: path.name,
        )
    )
    if any(path.is_symlink() or not path.is_file() for path in native_library_paths):
        raise FixtureError("regular_nonsymlink_gmpy2_native_runtime_files_required")
    observed_native_library_basenames = tuple(
        path.name for path in native_library_paths
    )
    if observed_native_library_basenames != PINNED_NATIVE_RUNTIME_BASENAMES:
        raise FixtureError(
            "gmpy2_native_runtime_closure_mismatch:"
            f"{observed_native_library_basenames!r}"
        )
    executable_path = Path(sys.executable).resolve()
    executable_raw = executable_path.read_bytes()
    return {
        "gmpVersion": gmpy2.mp_version(),
        "gmpy2NativeExtension": {
            "basename": extension_path.name,
            "sha256": _sha256(extension_raw),
            "sizeBytes": len(extension_raw),
        },
        "gmpy2NativeRuntimeClosure": [
            {
                "basename": path.name,
                "sha256": _sha256(path.read_bytes()),
                "sizeBytes": path.stat().st_size,
            }
            for path in native_library_paths
        ],
        "gmpy2NativeRuntimeInventory": {
            "coverage": (
                "all_case_insensitive_.dll_entries_in_resolved_"
                "gmpy2_package_parent_parent/gmpy2.libs"
            ),
            "expectedBasenames": list(PINNED_NATIVE_RUNTIME_BASENAMES),
            "filePolicy": "regular_nonsymlink_files_only",
            "missingExtraOrReorderedPolicy": "fail_closed",
            "ordering": "ascending_case_sensitive_basename",
            "scope": (
                "complete_wheel_bundled_GMP_MPFR_MPC_native_closure_"
                "including_bundled_runtime_dependencies"
            ),
        },
        "gmpy2PackageInit": {
            "basename": package_path.name,
            "sha256": _sha256(package_raw),
            "sizeBytes": len(package_raw),
        },
        "gmpy2Version": gmpy2.version(),
        "mpcVersion": gmpy2.mpc_version(),
        "mpfrVersion": gmpy2.mpfr_version(),
        "pythonExecutable": {
            "basename": executable_path.name,
            "sha256": _sha256(executable_raw),
            "sizeBytes": len(executable_raw),
        },
        "pythonImplementation": platform.python_implementation(),
        "pythonVersion": platform.python_version(),
    }


def _guard_runtime_identity() -> dict[str, Any]:
    observed = _runtime_identity()
    expected = {
        "pythonImplementation": PINNED_PYTHON_IMPLEMENTATION,
        "pythonVersion": PINNED_PYTHON_VERSION,
        "gmpy2Version": PINNED_GMPY2_VERSION,
        "mpfrVersion": PINNED_MPFR_VERSION,
        "gmpVersion": PINNED_GMP_VERSION,
        "mpcVersion": PINNED_MPC_VERSION,
    }
    for key, expected_value in expected.items():
        if observed[key] != expected_value:
            raise FixtureError(
                f"generator_runtime_identity_mismatch:{key}:"
                f"{observed[key]!r}!={expected_value!r}"
            )
    return observed


def _context(precision: int) -> gmpy2.context:
    return gmpy2.context(
        precision=precision,
        round=ROUNDING_MODE,
        emin=EMIN,
        emax=EMAX,
        subnormalize=False,
        trap_underflow=False,
        trap_overflow=False,
        trap_inexact=False,
        trap_invalid=False,
        trap_erange=False,
        trap_divzero=False,
        allow_complex=False,
        rational_division=False,
        allow_release_gil=False,
    )


def _legendre_pair(order: int, x: gmpy2.mpfr) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
    """Return P_order(x), P_(order-1)(x) in the active MPFR context."""

    if order < 1:
        raise FixtureError("positive_legendre_order_required")
    p_nm2 = gmpy2.mpfr(1)
    if order == 1:
        return x, p_nm2
    p_nm1 = +x
    for degree in range(2, order + 1):
        p_n = (
            gmpy2.mpfr(2 * degree - 1) * x * p_nm1
            - gmpy2.mpfr(degree - 1) * p_nm2
        ) / gmpy2.mpfr(degree)
        p_nm2, p_nm1 = p_nm1, p_n
    return p_nm1, p_nm2


def _positive_nodes_and_weights(
    precision: int,
) -> list[tuple[gmpy2.mpfr, gmpy2.mpfr]]:
    context = _context(precision)
    with context:
        active = gmpy2.get_context()
        if (
            active.precision != precision
            or active.round != ROUNDING_MODE
            or active.emin != EMIN
            or active.emax != EMAX
            or active.subnormalize is not False
            or active.allow_complex is not False
            or active.rational_division is not False
            or active.allow_release_gil is not False
        ):
            raise FixtureError("mpfr_context_mismatch")
        pi = gmpy2.const_pi(precision)
        tolerance = gmpy2.mul_2exp(gmpy2.mpfr(1), -(precision - 64))
        result: list[tuple[gmpy2.mpfr, gmpy2.mpfr]] = []
        for ordinal in range(1, HALF_ORDER + 1):
            angle = (
                pi * gmpy2.mpfr(4 * ordinal - 1)
                / gmpy2.mpfr(4 * ORDER + 2)
            )
            x = gmpy2.cos(angle)
            converged = False
            for _iteration in range(96):
                p_n, p_nm1 = _legendre_pair(ORDER, x)
                denominator = gmpy2.mpfr(1) - x * x
                derivative = (
                    gmpy2.mpfr(ORDER) * (p_nm1 - x * p_n) / denominator
                )
                correction = p_n / derivative
                next_x = x - correction
                if next_x == x or abs(correction) < tolerance:
                    x = next_x
                    converged = True
                    break
                x = next_x
            if not converged:
                raise FixtureError(f"newton_did_not_converge:{precision}:{ordinal}")
            p_n, p_nm1 = _legendre_pair(ORDER, x)
            denominator = gmpy2.mpfr(1) - x * x
            derivative = gmpy2.mpfr(ORDER) * (p_nm1 - x * p_n) / denominator
            weight = gmpy2.mpfr(2) / (denominator * derivative * derivative)
            if not (
                gmpy2.is_finite(x)
                and gmpy2.is_finite(weight)
                and x > 0
                and x < 1
                and weight > 0
            ):
                raise FixtureError(f"invalid_generated_pair:{precision}:{ordinal}")
            result.append((+x, +weight))
        result.sort(key=lambda pair: pair[0])
        if len(result) != HALF_ORDER or any(
            result[index][0] >= result[index + 1][0]
            for index in range(HALF_ORDER - 1)
        ):
            raise FixtureError(f"positive_root_order_failure:{precision}")
        return result


def _round_to_serialization(value: gmpy2.mpfr) -> gmpy2.mpfr:
    with _context(SERIALIZATION_BITS):
        rounded = gmpy2.mpfr(value, SERIALIZATION_BITS)
        if rounded.precision != SERIALIZATION_BITS or not gmpy2.is_finite(rounded):
            raise FixtureError("serialization_rounding_failure")
        return rounded


def _encode_positive(value: gmpy2.mpfr) -> dict[str, Any]:
    rounded = _round_to_serialization(value)
    if rounded <= 0:
        raise FixtureError("positive_serialized_value_required")
    numerator_raw, denominator_raw = rounded.as_integer_ratio()
    numerator = int(numerator_raw)
    denominator = int(denominator_raw)
    if numerator <= 0 or denominator <= 0 or denominator & (denominator - 1):
        raise FixtureError("canonical_dyadic_required")
    denominator_exponent = denominator.bit_length() - 1
    numerator_bits = numerator.bit_length()
    if numerator_bits > SERIALIZATION_BITS:
        raise FixtureError("serialized_significand_too_wide")
    left_shift = SERIALIZATION_BITS - numerator_bits
    significand = numerator << left_shift
    exponent2 = -denominator_exponent - left_shift
    significand_hex = f"{significand:064x}"
    if (
        len(significand_hex) != 64
        or significand_hex[0] not in "89abcdef"
        or int(significand_hex, 16).bit_length() != SERIALIZATION_BITS
    ):
        raise FixtureError("normalized_256_bit_significand_required")
    return {
        "exponent2": exponent2,
        "sign": 1,
        "significandHex": significand_hex,
    }


def _reflect(encoded: dict[str, Any]) -> dict[str, Any]:
    return {
        "exponent2": encoded["exponent2"],
        "sign": -1,
        "significandHex": encoded["significandHex"],
    }


def _serialize_records(
    positive: list[tuple[gmpy2.mpfr, gmpy2.mpfr]],
) -> list[dict[str, Any]]:
    encoded_positive = [
        (_encode_positive(node), _encode_positive(weight))
        for node, weight in positive
    ]
    ordered_pairs = [
        (_reflect(node), weight)
        for node, weight in reversed(encoded_positive)
    ] + encoded_positive
    return [
        {
            "index": index,
            "node": node,
            "schema": RECORD_SCHEMA,
            "weight": weight,
        }
        for index, (node, weight) in enumerate(ordered_pairs)
    ]


def _decode_fraction(encoded: dict[str, Any]) -> Fraction:
    if set(encoded) != {"exponent2", "sign", "significandHex"}:
        raise FixtureError("noncanonical_value_record_shape")
    sign = encoded["sign"]
    exponent2 = encoded["exponent2"]
    significand_hex = encoded["significandHex"]
    if sign not in (-1, 1) or type(sign) is not int:
        raise FixtureError("canonical_sign_required")
    if type(exponent2) is not int:
        raise FixtureError("integer_exponent_required")
    if (
        type(significand_hex) is not str
        or len(significand_hex) != 64
        or any(character not in "0123456789abcdef" for character in significand_hex)
        or significand_hex[0] not in "89abcdef"
    ):
        raise FixtureError("canonical_significand_required")
    significand = int(significand_hex, 16)
    numerator = sign * significand
    if exponent2 >= 0:
        return Fraction(numerator << exponent2, 1)
    return Fraction(numerator, 1 << (-exponent2))


def _half_ulp(encoded: dict[str, Any]) -> Fraction:
    exponent = int(encoded["exponent2"]) - 1
    if exponent >= 0:
        return Fraction(1 << exponent, 1)
    return Fraction(1, 1 << (-exponent))


def _validate_record_surface(records: list[dict[str, Any]]) -> None:
    if len(records) != ORDER:
        raise FixtureError(f"record_count_mismatch:{len(records)}")
    nodes: list[Fraction] = []
    weights: list[Fraction] = []
    weight_lower_sum = Fraction(0)
    weight_upper_sum = Fraction(0)
    for index, record in enumerate(records):
        if set(record) != {"index", "node", "schema", "weight"}:
            raise FixtureError(f"record_shape_mismatch:{index}")
        if record["index"] != index or type(record["index"]) is not int:
            raise FixtureError(f"record_index_mismatch:{index}")
        if record["schema"] != RECORD_SCHEMA:
            raise FixtureError(f"record_schema_mismatch:{index}")
        node = _decode_fraction(record["node"])
        weight = _decode_fraction(record["weight"])
        if not (-1 < node < 1) or weight <= 0:
            raise FixtureError(f"node_or_weight_range_failure:{index}")
        nodes.append(node)
        weights.append(weight)
        half = _half_ulp(record["weight"])
        weight_lower_sum += weight - half
        weight_upper_sum += weight + half
    if any(nodes[index] >= nodes[index + 1] for index in range(ORDER - 1)):
        raise FixtureError("strict_node_order_failure")
    for index in range(ORDER - 1):
        left_upper = nodes[index] + _half_ulp(records[index]["node"])
        right_lower = nodes[index + 1] - _half_ulp(records[index + 1]["node"])
        if left_upper >= right_lower:
            raise FixtureError(f"node_half_ulp_cells_not_disjoint:{index}")
    if not (weight_lower_sum <= 2 <= weight_upper_sum):
        raise FixtureError("weight_sum_half_ulp_enclosure_failure")
    for index in range(HALF_ORDER):
        mirror = ORDER - 1 - index
        if nodes[index] != -nodes[mirror] or weights[index] != weights[mirror]:
            raise FixtureError(f"symmetry_failure:{index}:{mirror}")
        if records[index]["weight"] != records[mirror]["weight"]:
            raise FixtureError(f"weight_record_symmetry_failure:{index}:{mirror}")
        left_node = records[index]["node"]
        right_node = records[mirror]["node"]
        if (
            left_node["sign"] != -1
            or right_node["sign"] != 1
            or left_node["exponent2"] != right_node["exponent2"]
            or left_node["significandHex"] != right_node["significandHex"]
        ):
            raise FixtureError(f"node_record_symmetry_failure:{index}:{mirror}")


def _build_records() -> list[dict[str, Any]]:
    low = _serialize_records(_positive_nodes_and_weights(WORK_PRECISIONS[0]))
    high = _serialize_records(_positive_nodes_and_weights(WORK_PRECISIONS[1]))
    if low != high:
        for index, (left, right) in enumerate(zip(low, high, strict=True)):
            if left != right:
                raise FixtureError(f"cross_precision_serialization_mismatch:{index}")
        raise FixtureError("cross_precision_serialization_mismatch")
    _validate_record_surface(high)
    return high


def _file_pin(relative_path: str) -> dict[str, Any]:
    raw = (REPO_ROOT / relative_path).read_bytes()
    return {
        "path": relative_path,
        "sha256": _sha256(raw),
        "sizeBytes": len(raw),
    }


def _manifest(raw: bytes, runtime: dict[str, Any]) -> dict[str, Any]:
    script_pin = _file_pin(SCRIPT_RELATIVE)
    test_pin = _file_pin(TEST_RELATIVE)
    return {
        "authorityLocks": {
            "candidateAuthority": False,
            "certificateAuthority": False,
            "executionAuthority": False,
            "gateAuthority": False,
            "physicalAuthority": False,
            "propulsionAuthority": False,
            "scientificAuthority": False,
            "seedAdmissionAuthority": False,
            "solverAuthority": False,
            "transportAuthority": False,
        },
        "fixture": {
            "encoding": {
                "canonicalJson": "UTF-8_ASCII_subset_sorted_keys_compact_LF",
                "halfUlpCell": "closed_[value-2^(exponent2-1),value+2^(exponent2-1)]",
                "value": "sign*int(significandHex,16)*2^exponent2",
            },
            "nodeCount": ORDER,
            "path": RAW_RELATIVE,
            "recordCount": ORDER,
            "recordSchema": RECORD_SCHEMA,
            "sha256": _sha256(raw),
            "sizeBytes": len(raw),
            "strictNodeOrder": "ascending",
        },
        "generation": {
            "algorithmId": ALGORITHM_ID,
            "commands": {
                "generate": (
                    "python scripts/research/"
                    "build-verify-nhm2-spherical-gl256-mpfr256.py generate"
                ),
                "verify": (
                    "python scripts/research/"
                    "build-verify-nhm2-spherical-gl256-mpfr256.py verify"
                ),
            },
            "crossPrecisionSerializationAgreementRequired": True,
            "exponentMaximum": EMAX,
            "exponentMinimum": EMIN,
            "rounding": "MPFR_RNDN_nearest_ties_to_even",
            "runtime": runtime,
            "script": script_pin,
            "serializationPrecisionBits": SERIALIZATION_BITS,
            "workPrecisionsBits": list(WORK_PRECISIONS),
        },
        "independentVerifier": {
            "arithmetic": (
                "TypeScript_BigInt_1536_bit_outward_rounded_dyadic_intervals"
            ),
            "candidateDataImported": False,
            "checks": [
                "raw_sha256_and_size",
                "canonical_records_and_exact_count",
                "strict_order_symmetry_positive_weights",
                "sum_two_half_ulp_enclosure",
                "P256_root_residual_half_ulp_enclosure",
                "P256_unique_root_bracket_half_ulp_cell",
                "interval_newton_root_refinement",
                "true_weight_formula_interval_subset_of_serialized_half_ulp_cell",
                "serialized_dyadic_centers_explicitly_not_exact",
                "underlying_exact_GL_rule_true_moment_enclosures_degrees_0_through_511",
            ],
            "enclosureSemantics": {
                "momentClaim": (
                    "outward_intervals_from_proved_true_root_and_weight_"
                    "enclosures_contain_each_exact_GL_moment_target_"
                    "for_degrees_0_through_511"
                ),
                "rootClaim": (
                    "each_serialized_node_half_ulp_cell_contains_exactly_"
                    "one_true_P256_root"
                ),
                "serializedCenterClaim": (
                    "rounded_dyadic_centers_are_not_asserted_to_be_exact_"
                    "algebraic_nodes_weights_or_moments"
                ),
                "weightClaim": (
                    "the_true_GL_weight_formula_interval_at_each_proved_"
                    "root_is_contained_in_its_serialized_weight_half_ulp_cell"
                ),
            },
            "rootRefinement": {
                "arithmeticPrecisionBits": 1536,
                "maximumIterations": 12,
                "method": "exact_dyadic_interval_newton_with_global_P256_second_derivative_bound",
                "observedFrozenFixtureIterations": {
                    "histogram": {"1": 256},
                    "maximum": 1,
                },
                "requiredStopCondition": (
                    "directed_true_weight_interval_subset_of_serialized_weight_half_ulp_cell"
                ),
                "unresolvedAsFail": True,
            },
            "test": test_pin,
        },
        "quadrature": {
            "underlyingExactAlgebraicRule": {
                "degreeExactness": 2 * ORDER - 1,
                "momentIdentity": "sum_i(w_i*x_i^k)=integral_-1^1(x^k dx),0<=k<=511",
                "theorem": "Gauss-Legendre_exactness",
            },
            "family": "Gauss-Legendre",
            "interval": [-1, 1],
            "order": ORDER,
            "serializedDyadicCenters": {
                "algebraicExactness": False,
                "degreeExactness": False,
                "momentsExact": False,
                "nodeCentersEqualAlgebraicRoots": False,
                "rootResidualsExactlyZero": False,
                "weightCentersEqualAlgebraicWeights": False,
                "weightSumExactlyTwo": False,
            },
        },
        "schema": SCHEMA,
        "scope": {
            "candidateData": False,
            "candidateIndependent": True,
            "diagnosticOnly": True,
            "seedSolveExecuted": False,
        },
    }


def _read_json_strict(raw: bytes, label: str) -> Any:
    try:
        text = raw.decode("ascii")
    except UnicodeDecodeError as error:
        raise FixtureError(f"non_ascii_{label}") from error
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise FixtureError(f"invalid_json_{label}:{error.msg}") from error


def generate() -> None:
    runtime = _guard_runtime_identity()
    records = _build_records()
    raw = _canonical_jsonl(records)
    raw_path = REPO_ROOT / RAW_RELATIVE
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(raw)
    manifest = _manifest(raw, runtime)
    manifest_raw = _canonical_json(manifest)
    (REPO_ROOT / MANIFEST_RELATIVE).write_bytes(manifest_raw)
    print(
        json.dumps(
            {
                "fixtureSha256": _sha256(raw),
                "fixtureSizeBytes": len(raw),
                "manifestSha256": _sha256(manifest_raw),
                "manifestSizeBytes": len(manifest_raw),
                "recordCount": len(records),
            },
            sort_keys=True,
        )
    )


def verify() -> None:
    runtime = _guard_runtime_identity()
    raw_path = REPO_ROOT / RAW_RELATIVE
    manifest_path = REPO_ROOT / MANIFEST_RELATIVE
    raw = raw_path.read_bytes()
    manifest_raw = manifest_path.read_bytes()
    manifest = _read_json_strict(manifest_raw, "manifest")
    if _canonical_json(manifest) != manifest_raw:
        raise FixtureError("manifest_not_canonical")
    expected_manifest = _manifest(raw, runtime)
    if manifest != expected_manifest:
        raise FixtureError("manifest_binding_or_identity_mismatch")
    lines = raw.splitlines(keepends=True)
    if len(lines) != ORDER or any(not line.endswith(b"\n") for line in lines):
        raise FixtureError("raw_line_count_or_lf_failure")
    records = [_read_json_strict(line, f"record_{index}") for index, line in enumerate(lines)]
    if _canonical_jsonl(records) != raw:
        raise FixtureError("raw_fixture_not_canonical")
    _validate_record_surface(records)
    regenerated = _build_records()
    if regenerated != records:
        raise FixtureError("regenerated_record_mismatch")
    print(
        json.dumps(
            {
                "fixtureSha256": _sha256(raw),
                "fixtureSizeBytes": len(raw),
                "manifestSha256": _sha256(manifest_raw),
                "manifestSizeBytes": len(manifest_raw),
                "recordCount": len(records),
                "verified": True,
            },
            sort_keys=True,
        )
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("generate", "verify"))
    arguments = parser.parse_args(argv)
    try:
        if arguments.mode == "generate":
            generate()
        else:
            verify()
    except (FixtureError, OSError) as error:
        print(f"GL256_FIXTURE_FAIL:{error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
