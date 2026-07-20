#!/usr/bin/env python3
"""Sealed NHM2 adapter for warpax 1.3.0 frame-free grid certification.

This process is deliberately narrow: it accepts two raw covariant tensor fields,
validates their bytes and sampled metric geometry, calls only
``certify_grid_frame_free``, and writes two deterministic JSON artifacts.  It
does not run or substitute the observer-manifold BFGS routines.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import stat
import sys
from typing import Any, NoReturn

import numpy as np


DRIVER_VERSION = "nhm2_warpax_frame_free_driver/v1"
INPUT_VERSION = "nhm2_warpax_frame_free_input/v1"
RESULT_VERSION = "nhm2_warpax_frame_free_observer_result/v1"
TRACE_VERSION = "nhm2_warpax_frame_free_trace/v1"
WARPAX_VERSION = "1.3.0"
WARPAX_REPOSITORY = "https://github.com/anindex/warpax"
WARPAX_TAG = "v1.3.0"
WARPAX_COMMIT = "187985fe28c49b28caac5964759b3d34ba03b3f3"
MAX_POINTS = 1_000_000
SHA256 = re.compile(r"^[a-f0-9]{64}$")
OFFICIAL_WARPAX_CRITICAL_SOURCES = {
    "_gen_eig_callback.py": "70d8e8fc866d61cae034ffd3bc12b2f7ddeafc410714ad0db2625b6d3c2e97b0",
    "classification.py": "693a4b488c17100dff72a5253cec589bee3997559583e2aaa05239b5a083c93a",
    "eigenvalue_checks.py": "879a43ba19506d43ec085f6dd64f6d4835149fa61036e9b843cf8f910e5d53e6",
    "frame_free.py": "ead8a12b62b64ee67fa4ebc9fb67bf0c306f44a3cfbdde457d3bbb41374b98f0",
    "types.py": "411f2be3ff3ab99b3df137eb417aefdeb9fa594a6c4ee183fa136dc8551a6bcd",
    "verifier.py": "6591be714271737fbed0c8a5284fd40a9806e9d1e95ec9dad064f2ce38b924ea",
}


class DriverError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def _fail(code: str, message: str) -> NoReturn:
    raise DriverError(code, message)


def _canonical_json_bytes(value: Any) -> bytes:
    try:
        text = json.dumps(
            value,
            allow_nan=False,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
    except (TypeError, ValueError) as error:
        _fail("canonical_json_invalid", str(error))
    return text.encode("utf-8")


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            _fail("input_json_duplicate_key", f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def _load_json(path_value: str) -> tuple[Path, dict[str, Any]]:
    path = Path(path_value).resolve(strict=True)
    before = path.lstat()
    if path.is_symlink() or not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
        _fail("input_manifest_not_regular", "Input manifest must be a single-link regular file.")
    try:
        value = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_reject_duplicate_keys)
    except DriverError:
        raise
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        _fail("input_manifest_unreadable", type(error).__name__)
    after = path.lstat()
    if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (
        after.st_dev,
        after.st_ino,
        after.st_size,
        after.st_mtime_ns,
    ):
        _fail("input_manifest_changed", "Input manifest changed while it was read.")
    if not isinstance(value, dict):
        _fail("input_manifest_invalid", "Input manifest must be a JSON object.")
    return path, value


def _require_exact_keys(value: dict[str, Any], keys: set[str], label: str) -> None:
    if set(value) != keys:
        _fail("input_schema_invalid", f"{label} keys do not match the v1 contract.")


def _portable_relative_path(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value or value.strip() != value:
        _fail("input_path_invalid", f"{label} must be a non-empty portable relative path.")
    if "\\" in value or "\x00" in value:
        _fail("input_path_invalid", f"{label} is not portable.")
    parsed = PurePosixPath(value)
    if parsed.is_absolute() or any(part in ("", ".", "..") for part in value.split("/")):
        _fail("input_path_invalid", f"{label} is not a contained relative path.")
    return value


def _finite_positive_number(value: Any, label: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        _fail("input_number_invalid", f"{label} must be numeric.")
    result = float(value)
    if not math.isfinite(result) or result <= 0.0:
        _fail("input_number_invalid", f"{label} must be finite and positive.")
    return result


def _validate_descriptor(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        _fail("input_descriptor_invalid", f"{label} must be an object.")
    _require_exact_keys(
        value,
        {
            "byteOrder",
            "chart",
            "dtype",
            "indexPosition",
            "relativePath",
            "sha256",
            "shape",
            "storageOrder",
            "units",
        },
        label,
    )
    relative_path = _portable_relative_path(value["relativePath"], f"{label}.relativePath")
    if value["dtype"] != "float64" or value["byteOrder"] != "little":
        _fail("input_encoding_invalid", f"{label} must be raw little-endian float64.")
    if value["storageOrder"] != "row_major" or value["indexPosition"] != "covariant":
        _fail("input_encoding_invalid", f"{label} must be row-major covariant data.")
    shape = value["shape"]
    if (
        not isinstance(shape, list)
        or len(shape) != 3
        or isinstance(shape[0], bool)
        or not isinstance(shape[0], int)
        or shape[0] <= 0
        or shape[0] > MAX_POINTS
        or shape[1:] != [4, 4]
    ):
        _fail("input_shape_invalid", f"{label}.shape must be [N,4,4].")
    if not isinstance(value["sha256"], str) or SHA256.fullmatch(value["sha256"]) is None:
        _fail("input_hash_invalid", f"{label}.sha256 is invalid.")
    for field in ("chart", "units"):
        item = value[field]
        if (
            not isinstance(item, str)
            or not item
            or item.strip() != item
            or len(item) > 256
            or any(ord(character) < 32 for character in item)
        ):
            _fail("input_metadata_invalid", f"{label}.{field} is invalid.")
    return {**value, "relativePath": relative_path}


def _validate_manifest(value: dict[str, Any]) -> dict[str, Any]:
    _require_exact_keys(
        value,
        {
            "artifactId",
            "contractVersion",
            "metric",
            "metricSignature",
            "package",
            "solver",
            "stressEnergy",
            "tolerance",
            "unitSystem",
        },
        "input manifest",
    )
    if value["artifactId"] != "nhm2.warpax_frame_free_input" or value["contractVersion"] != INPUT_VERSION:
        _fail("input_contract_invalid", "Input artifact identity or contract version is invalid.")
    if value["metricSignature"] != "(-,+,+,+)" or value["unitSystem"] != "geometric_G_eq_c_eq_1":
        _fail("input_convention_invalid", "warpax requires geometric units and signature (-,+,+,+).")
    if value["solver"] not in ("auto", "standard", "generalized"):
        _fail("input_solver_invalid", "Solver must be auto, standard, or generalized.")
    tolerance = _finite_positive_number(value["tolerance"], "tolerance")
    if tolerance > 1.0:
        _fail("input_tolerance_invalid", "Tolerance must not exceed 1.0.")
    package = value["package"]
    if not isinstance(package, dict):
        _fail("input_package_invalid", "package must be an object.")
    _require_exact_keys(
        package,
        {"commitSha", "harnessOnly", "name", "repository", "tag", "version"},
        "package",
    )
    if (
        package["name"] != "warpax"
        or package["version"] != WARPAX_VERSION
        or package["repository"] != WARPAX_REPOSITORY
        or package["tag"] != WARPAX_TAG
        or package["commitSha"] != WARPAX_COMMIT
        or not isinstance(package["harnessOnly"], bool)
    ):
        _fail("input_package_invalid", "warpax package binding is not pinned to official v1.3.0.")
    stress_energy = _validate_descriptor(value["stressEnergy"], "stressEnergy")
    metric = _validate_descriptor(value["metric"], "metric")
    if stress_energy["shape"] != metric["shape"]:
        _fail("input_shape_mismatch", "Stress-energy and metric shapes differ.")
    if stress_energy["chart"] != metric["chart"]:
        _fail("input_chart_mismatch", "Stress-energy and metric arrays are not in the same chart.")
    if stress_energy["units"] != "inverse_length_squared" or metric["units"] != "dimensionless":
        _fail("input_units_invalid", "Tensor units must match the governed geometric-unit contract.")
    if stress_energy["relativePath"] == metric["relativePath"]:
        _fail("input_path_collision", "Stress-energy and metric arrays must be distinct files.")
    return {
        **value,
        "metric": metric,
        "stressEnergy": stress_energy,
        "tolerance": tolerance,
    }


def _read_raw_array(root: Path, descriptor: dict[str, Any], label: str) -> np.ndarray:
    candidate = root.joinpath(*descriptor["relativePath"].split("/"))
    try:
        before = candidate.lstat()
        resolved = candidate.resolve(strict=True)
    except OSError as error:
        _fail("raw_array_unreadable", f"{label}: {type(error).__name__}")
    try:
        resolved.relative_to(root)
    except ValueError:
        _fail("raw_array_outside_input_root", f"{label} escaped the input root.")
    if candidate.is_symlink() or not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
        _fail("raw_array_not_regular", f"{label} must be a single-link regular file.")
    expected_bytes = descriptor["shape"][0] * 4 * 4 * 8
    if before.st_size != expected_bytes:
        _fail("raw_array_size_mismatch", f"{label} byte length does not match [N,4,4] float64.")
    try:
        raw = candidate.read_bytes()
    except OSError as error:
        _fail("raw_array_unreadable", f"{label}: {type(error).__name__}")
    after = candidate.lstat()
    if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (
        after.st_dev,
        after.st_ino,
        after.st_size,
        after.st_mtime_ns,
    ):
        _fail("raw_array_changed", f"{label} changed while it was read.")
    observed_hash = hashlib.sha256(raw).hexdigest()
    if observed_hash != descriptor["sha256"]:
        _fail("raw_array_hash_mismatch", f"{label} SHA-256 does not match its binding.")
    array = np.frombuffer(raw, dtype="<f8").reshape(tuple(descriptor["shape"]))
    if not np.all(np.isfinite(array)):
        _fail("raw_array_nonfinite", f"{label} contains NaN or infinity.")
    return np.array(array, dtype=np.float64, copy=True, order="C")


def _validate_sampled_tensors(stress_energy: np.ndarray, metric: np.ndarray) -> dict[str, float]:
    stress_scale = max(1.0, float(np.max(np.abs(stress_energy))))
    metric_scale = max(1.0, float(np.max(np.abs(metric))))
    stress_asymmetry = float(np.max(np.abs(stress_energy - np.swapaxes(stress_energy, -1, -2))))
    metric_asymmetry = float(np.max(np.abs(metric - np.swapaxes(metric, -1, -2))))
    if stress_asymmetry > 1.0e-12 * stress_scale:
        _fail("stress_energy_not_symmetric", "Covariant stress-energy is not symmetric within the fixed check tolerance.")
    if metric_asymmetry > 1.0e-12 * metric_scale:
        _fail("metric_not_symmetric", "Covariant metric is not symmetric within the fixed check tolerance.")
    eigenvalues = np.linalg.eigvalsh(metric)
    threshold = 1.0e-12 * np.maximum(1.0, np.max(np.abs(eigenvalues), axis=1))
    negative = np.sum(eigenvalues < -threshold[:, None], axis=1)
    positive = np.sum(eigenvalues > threshold[:, None], axis=1)
    if not np.all((negative == 1) & (positive == 3)):
        first = int(np.flatnonzero((negative != 1) | (positive != 3))[0])
        _fail("metric_not_lorentzian", f"Metric sample {first} does not have signature (-,+,+,+).")
    return {
        "maximumMetricAsymmetry": metric_asymmetry,
        "maximumStressEnergyAsymmetry": stress_asymmetry,
        "minimumAbsoluteMetricEigenvalue": float(np.min(np.abs(eigenvalues))),
    }


def _as_array(value: Any, shape: tuple[int, ...], label: str) -> np.ndarray:
    array = np.asarray(value)
    if array.shape != shape:
        _fail("warpax_result_shape_invalid", f"{label} has shape {array.shape}, expected {shape}.")
    return array


def _nullable_finite(value: float) -> float | None:
    return float(value) if math.isfinite(float(value)) else None


def _check_close(observed: float, expected: float, tolerance: float, label: str) -> None:
    scale = max(1.0, abs(observed), abs(expected))
    check_tolerance = max(tolerance, 128.0 * np.finfo(np.float64).eps * scale)
    if abs(observed - expected) > check_tolerance:
        _fail("warpax_type_i_margin_mismatch", f"{label} does not match the Type-I eigenvalue inequality.")


def _serialize_warpax_result(result: Any, n_points: int, tolerance: float) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    he_types = _as_array(result.he_types, (n_points,), "he_types").astype(np.float64)
    eigenvalues = _as_array(result.eigenvalues, (n_points, 4), "eigenvalues").astype(np.float64)
    eigenvalues_imag = _as_array(result.eigenvalues_imag, (n_points, 4), "eigenvalues_imag").astype(np.float64)
    rho = _as_array(result.rho, (n_points,), "rho").astype(np.float64)
    pressures = _as_array(result.pressures, (n_points, 3), "pressures").astype(np.float64)
    margins = {
        "nec": _as_array(result.nec_margins, (n_points,), "nec_margins").astype(np.float64),
        "wec": _as_array(result.wec_margins, (n_points,), "wec_margins").astype(np.float64),
        "sec": _as_array(result.sec_margins, (n_points,), "sec_margins").astype(np.float64),
        "dec": _as_array(result.dec_margins, (n_points,), "dec_margins").astype(np.float64),
    }
    is_vacuum = _as_array(result.is_vacuum, (n_points,), "is_vacuum").astype(np.float64)
    rounded_types = np.rint(he_types)
    if not np.all(np.isfinite(he_types)) or not np.all(he_types == rounded_types) or not np.all((rounded_types >= 1) & (rounded_types <= 4)):
        _fail("warpax_he_type_invalid", "Hawking-Ellis labels must be finite integers 1 through 4.")
    if not np.all(np.isin(is_vacuum, [0.0, 1.0])):
        _fail("warpax_vacuum_flag_invalid", "is_vacuum must contain only zero or one.")

    points: list[dict[str, Any]] = []
    condition_samples: dict[str, list[float]] = {key: [] for key in margins}
    type_counts = {"I": 0, "II": 0, "III": 0, "IV": 0}
    roman = {1: "I", 2: "II", 3: "III", 4: "IV"}
    for index in range(n_points):
        he_type = int(rounded_types[index])
        he_label = roman[he_type]
        type_counts[he_label] += 1
        point: dict[str, Any] = {
            "eigenvalues": {
                "imaginary": [_nullable_finite(item) for item in eigenvalues_imag[index]],
                "real": [_nullable_finite(item) for item in eigenvalues[index]],
            },
            "hawkingEllisType": he_label,
            "index": index,
            "isVacuum": bool(is_vacuum[index]),
        }
        if he_type == 1:
            if not math.isfinite(float(rho[index])) or not np.all(np.isfinite(pressures[index])):
                _fail("warpax_type_i_nonfinite", f"Type-I sample {index} lacks finite rho/pressures.")
            if not all(math.isfinite(float(field[index])) for field in margins.values()):
                _fail("warpax_type_i_nonfinite", f"Type-I sample {index} lacks finite margins.")
            rho_value = float(rho[index])
            pressure_values = [float(item) for item in pressures[index]]
            expected = {
                "nec": min(rho_value + item for item in pressure_values),
                "wec": min([rho_value, *[rho_value + item for item in pressure_values]]),
                "sec": min(
                    [
                        *[rho_value + item for item in pressure_values],
                        rho_value + sum(pressure_values),
                    ]
                ),
                "dec": min(rho_value - abs(item) for item in pressure_values),
            }
            serialized_margins: dict[str, dict[str, Any]] = {}
            for condition, field in margins.items():
                observed = float(field[index])
                _check_close(observed, expected[condition], tolerance, f"{condition}[{index}]")
                condition_samples[condition].append(observed)
                serialized_margins[condition] = {
                    "margin": observed,
                    "satisfiedWithinRequestedTolerance": observed >= -tolerance,
                }
            point["typeIAlgebraicResult"] = {
                "authority": "algebraic_all_observer_type_i_at_sample",
                "margins": serialized_margins,
                "principalPressures": pressure_values,
                "rho": rho_value,
            }
            point["nonTypeIResult"] = None
        else:
            if math.isfinite(float(rho[index])) or np.any(np.isfinite(pressures[index])):
                _fail("warpax_non_type_i_rest_frame_value", f"Non-Type-I sample {index} exposes rest-frame scalars.")
            if any(math.isfinite(float(field[index])) for field in margins.values()):
                _fail("warpax_non_type_i_margin_promoted", f"Non-Type-I sample {index} exposes a finite margin.")
            point["typeIAlgebraicResult"] = None
            point["nonTypeIResult"] = {
                "bfgsReplacementUsed": False,
                "marginAuthority": "unavailable_non_type_i_no_invariant_rest_frame",
                "margins": {condition: None for condition in margins},
            }
        points.append(point)

    reported_counts = {
        "I": int(result.n_type_i),
        "II": int(result.n_type_ii),
        "III": int(result.n_type_iii),
        "IV": int(result.n_type_iv),
    }
    if reported_counts != type_counts or int(result.n_total) != n_points:
        _fail("warpax_type_census_mismatch", "warpax type census does not match its point labels.")
    vacuum_count = int(np.sum(is_vacuum == 1.0))
    if int(result.n_vacuum) != vacuum_count:
        _fail("warpax_vacuum_census_mismatch", "warpax vacuum census does not match its point flags.")
    summary = {
        "conditionMinimumMarginsOverTypeISamples": {
            condition: (min(values) if values else None)
            for condition, values in condition_samples.items()
        },
        "maximumImaginaryEigenvalueMagnitudeReported": _nullable_finite(
            float(result.max_imag_eigenvalue)
        ),
        "pointCount": n_points,
        "typeCounts": type_counts,
        "vacuumCount": vacuum_count,
    }
    return points, summary


def _claim_boundary() -> dict[str, bool]:
    return {
        "bfgsSubstitutionForNonTypeIAllowed": False,
        "empiricalValidationEstablished": False,
        "globalIntervalCoverageEstablished": False,
        "physicalViabilityClaimAllowed": False,
        "propulsionClaimAllowed": False,
        "routeEtaClaimAllowed": False,
        "spatialContinuumCoverageEstablished": False,
        "speedAuthorityClaimAllowed": False,
        "theoryClosureClaimAllowed": False,
        "transportClaimAllowed": False,
    }


def _validate_official_warpax_sources(module: Any, harness_only: bool) -> bool:
    if harness_only:
        return False
    module_file = getattr(module, "__file__", None)
    if not isinstance(module_file, str) or Path(module_file).name != "frame_free.py":
        _fail("warpax_official_source_path_invalid", "Loaded frame-free API has no governed source path.")
    source_root = Path(module_file).resolve(strict=True).parent
    for filename, expected_hash in OFFICIAL_WARPAX_CRITICAL_SOURCES.items():
        source_path = source_root / filename
        try:
            source_bytes = source_path.read_bytes()
        except OSError as error:
            _fail("warpax_official_source_unreadable", f"{filename}: {type(error).__name__}")
        if hashlib.sha256(source_bytes).hexdigest() != expected_hash:
            _fail("warpax_official_source_hash_mismatch", f"Official v1.3.0 source mismatch: {filename}")
    return True


def _write_exclusive(path_value: str, payload: dict[str, Any], label: str) -> None:
    path = Path(path_value).resolve(strict=False)
    if not path.parent.is_dir() or path.exists():
        _fail("output_path_invalid", f"{label} parent must exist and output must be fresh.")
    try:
        with path.open("xb") as output:
            output.write(_canonical_json_bytes(payload))
            output.flush()
            os.fsync(output.fileno())
    except OSError as error:
        _fail("output_write_failed", f"{label}: {type(error).__name__}")


def _run(arguments: argparse.Namespace) -> None:
    if Path(arguments.result).resolve(strict=False) == Path(arguments.trace).resolve(strict=False):
        _fail("output_path_collision", "Result and trace paths must be distinct.")
    manifest_path, raw_manifest = _load_json(arguments.input)
    manifest = _validate_manifest(raw_manifest)
    input_root = manifest_path.parent.resolve(strict=True)
    stress_energy = _read_raw_array(input_root, manifest["stressEnergy"], "stressEnergy")
    metric = _read_raw_array(input_root, manifest["metric"], "metric")
    validation_summary = _validate_sampled_tensors(stress_energy, metric)

    try:
        installed_version = importlib.metadata.version("warpax")
    except importlib.metadata.PackageNotFoundError:
        _fail("warpax_package_missing", "The sealed runtime has no warpax distribution metadata.")
    if installed_version != WARPAX_VERSION:
        _fail("warpax_version_mismatch", f"Expected warpax {WARPAX_VERSION}, observed {installed_version}.")
    try:
        from warpax.energy_conditions import frame_free as frame_free_module
    except Exception as error:
        _fail("warpax_api_import_failed", type(error).__name__)
    certify_grid_frame_free = getattr(frame_free_module, "certify_grid_frame_free", None)
    if (
        not callable(certify_grid_frame_free)
        or getattr(certify_grid_frame_free, "__module__", None)
        != "warpax.energy_conditions.frame_free"
        or getattr(certify_grid_frame_free, "__name__", None) != "certify_grid_frame_free"
    ):
        _fail("warpax_api_binding_invalid", "Loaded callable is not the governed frame-free API.")
    official_sources_validated = _validate_official_warpax_sources(
        frame_free_module,
        manifest["package"]["harnessOnly"],
    )

    try:
        warpax_result = certify_grid_frame_free(
            stress_energy,
            metric,
            solver=manifest["solver"],
            tol=manifest["tolerance"],
        )
    except Exception as error:
        _fail("warpax_execution_failed", type(error).__name__)
    points, summary = _serialize_warpax_result(
        warpax_result,
        manifest["stressEnergy"]["shape"][0],
        manifest["tolerance"],
    )
    non_type_i_count = summary["pointCount"] - summary["typeCounts"]["I"]
    blockers = [
        "independent_scientific_content_replay_required",
        "spatial_continuum_coverage_unresolved",
        "global_interval_coverage_unresolved",
        "warpax_v1_3_grid_tolerance_not_forwarded_to_batch_classifier",
    ]
    if non_type_i_count > 0:
        blockers.append("non_type_i_all_observer_margins_unavailable")
    if manifest["package"]["harnessOnly"]:
        blockers.append("test_harness_package_not_scientific_evidence")
    blockers.sort()

    result_payload = {
        "artifactId": "nhm2.warpax_frame_free_observer_result",
        "blockers": blockers,
        "chart": manifest["stressEnergy"]["chart"],
        "claimBoundary": _claim_boundary(),
        "contractVersion": RESULT_VERSION,
        "metricSignature": manifest["metricSignature"],
        "points": points,
        "status": "sampled_frame_free_algebraic_result_no_theory_promotion",
        "summary": summary,
        "tensorUnits": manifest["stressEnergy"]["units"],
        "unitSystem": manifest["unitSystem"],
    }
    trace_payload = {
        "api": {
            "bfgsImportedOrUsed": False,
            "callable": "certify_grid_frame_free",
            "classificationToleranceForwardedByPublicCall": True,
            "module": "warpax.energy_conditions.frame_free",
            "requestedSolver": manifest["solver"],
            "requestedTolerance": manifest["tolerance"],
            "upstreamBatchClassifierReceivesRequestedTolerance": False,
            "warpaxVersion": installed_version,
        },
        "artifactId": "nhm2.warpax_frame_free_trace",
        "blockers": blockers,
        "claimBoundary": _claim_boundary(),
        "contractVersion": TRACE_VERSION,
        "driverVersion": DRIVER_VERSION,
        "inputBindings": {
            "metricSha256": manifest["metric"]["sha256"],
            "shape": manifest["metric"]["shape"],
            "stressEnergySha256": manifest["stressEnergy"]["sha256"],
        },
        "packageBinding": manifest["package"],
        "summary": summary,
        "validation": {
            **validation_summary,
            "finiteMetric": True,
            "finiteStressEnergy": True,
            "lorentzianSignatureAtEverySample": True,
            "officialCriticalSourceHashesValidated": official_sources_validated,
            "sameChart": True,
            "symmetricMetric": True,
            "symmetricStressEnergy": True,
        },
    }
    _write_exclusive(arguments.result, result_payload, "observer result")
    _write_exclusive(arguments.trace, trace_payload, "observer trace")


def _parse_arguments(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(allow_abbrev=False)
    parser.add_argument("--input", required=True)
    parser.add_argument("--result", required=True)
    parser.add_argument("--trace", required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    try:
        _run(_parse_arguments(sys.argv[1:] if argv is None else argv))
        return 0
    except DriverError as error:
        print(f"NHM2_WARPAX_DRIVER_ERROR:{error.code}:{error}", file=sys.stderr)
        return 2
    except Exception as error:  # Keep unexpected failures typed without exposing local paths.
        print(f"NHM2_WARPAX_DRIVER_ERROR:unexpected:{type(error).__name__}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
