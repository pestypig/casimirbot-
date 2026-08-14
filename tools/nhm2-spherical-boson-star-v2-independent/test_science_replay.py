from __future__ import annotations

import ast
import importlib.util
import math
import sys
import unittest
from collections.abc import Mapping
from dataclasses import replace
from hashlib import sha256
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
RAW_SPEC = importlib.util.spec_from_file_location(
    "raw_inventory", HERE / "raw_inventory.py"
)
assert RAW_SPEC is not None and RAW_SPEC.loader is not None
raw_inventory = importlib.util.module_from_spec(RAW_SPEC)
sys.modules[RAW_SPEC.name] = raw_inventory
RAW_SPEC.loader.exec_module(raw_inventory)

SCIENCE_SPEC = importlib.util.spec_from_file_location(
    "science_replay", HERE / "science_replay.py"
)
assert SCIENCE_SPEC is not None and SCIENCE_SPEC.loader is not None
science_replay = importlib.util.module_from_spec(SCIENCE_SPEC)
sys.modules[SCIENCE_SPEC.name] = science_replay
SCIENCE_SPEC.loader.exec_module(science_replay)


_RESIDUAL_BY_LEVEL = {
    "level_0": 0.04,
    "level_1": 0.01,
    "level_2": 0.0025,
}
_SERVER_TARGET = 0.2
_CONSTRAINT_U95 = 0.0001


def _payload(descriptor: object) -> bytes:
    value = np.zeros(descriptor.shape, dtype="<f8")
    role = descriptor.role
    if role == "noise_kernel":
        for point in range(64):
            for component in range(10):
                value[point, point, component * 10 + component] = 0.01
    elif role == "mean_rset":
        value[:, 0] = 10.0
    elif role == "mean_rset_absolute_uncertainty95":
        value[:, 0] = 0.001
    elif role == "smearing_weights":
        value.fill(1.0 / 64.0)
    elif role.startswith("constraint_operand."):
        _prefix, level_id, family_id, operand_role = role.split(".")
        residual = _RESIDUAL_BY_LEVEL[level_id]
        if operand_role == "absolute_uncertainty95":
            value.fill(_CONSTRAINT_U95)
        elif family_id in science_replay.BRACKET_FAMILIES:
            if operand_role == "computed":
                value.fill(_SERVER_TARGET + residual)
            elif operand_role == "target":
                value.fill(_SERVER_TARGET)
            elif operand_role == "residual":
                value.fill(residual)
        elif family_id == "antisymmetry":
            if operand_role == "forward":
                value.fill(residual)
            elif operand_role in ("reverse",):
                value.fill(0.0)
            elif operand_role == "residual":
                value.fill(residual)
        elif family_id == "jacobi":
            if operand_role == "term_1":
                value.fill(residual)
            elif operand_role in ("term_2", "term_3"):
                value.fill(0.0)
            elif operand_role == "residual":
                value.fill(residual)
    return value.tobytes(order="C")


def _raw_input() -> dict[str, object]:
    files: list[dict[str, object]] = []
    for descriptor in raw_inventory.FILE_DESCRIPTORS:
        payload = _payload(descriptor)
        files.append(
            {
                "fileOrdinal": descriptor.file_ordinal,
                "path": descriptor.path,
                "role": descriptor.role,
                "shape": list(descriptor.shape),
                "sizeBytes": descriptor.size_bytes,
                "sha256": sha256(payload).hexdigest(),
                "bytes": payload,
            }
        )
    return {
        "contractVersion": raw_inventory.INPUT_CONTRACT_VERSION,
        "candidateId": raw_inventory.CANDIDATE_ID,
        "schemaBinding": raw_inventory.schema_binding(),
        "files": files,
    }


def _auxiliary() -> object:
    metric = np.zeros((64, 10), dtype=np.float64)
    metric[:, 0] = 10.0
    error = np.zeros((64, 10), dtype=np.float64)
    error[:, 0] = 0.001
    targets = tuple(
        science_replay.ClassicalTargetArray(
            level_id=level_id,
            family_id=family_id,
            origin=science_replay.CLASSICAL_TARGET_ORIGIN,
            values=tuple(float(_SERVER_TARGET) for _unused in range(256)),
        )
        for level_id, family_id in science_replay.TARGET_ORDER
    )
    return science_replay.AuxiliaryFrozenInputs(
        contract_version=science_replay.AUXILIARY_CONTRACT_VERSION,
        candidate_id=science_replay.CANDIDATE_ID,
        metric_demand_rset_si=tuple(float(value) for value in metric.reshape(-1)),
        metric_demand_absolute_error_bound_si=tuple(
            float(value) for value in error.reshape(-1)
        ),
        server_recomputed_classical_targets=targets,
    )


def _replace_role(input_value: dict[str, object], role: str, fill: float) -> None:
    files = input_value["files"]
    assert type(files) is list
    observation = next(
        entry for entry in files if type(entry) is dict and entry["role"] == role
    )
    assert type(observation) is dict
    shape = observation["shape"]
    assert type(shape) is list
    value = np.full(tuple(shape), fill, dtype="<f8")
    payload = value.tobytes(order="C")
    observation["bytes"] = payload
    observation["sha256"] = sha256(payload).hexdigest()


def _replace_array(
    input_value: dict[str, object], role: str, values: np.ndarray
) -> None:
    files = input_value["files"]
    assert type(files) is list
    observation = next(
        entry for entry in files if type(entry) is dict and entry["role"] == role
    )
    assert type(observation) is dict
    shape = observation["shape"]
    assert type(shape) is list
    value = np.asarray(values, dtype="<f8")
    assert value.shape == tuple(shape)
    payload = value.tobytes(order="C")
    observation["bytes"] = payload
    observation["sha256"] = sha256(payload).hexdigest()


def _all_float_metrics_finite(value: object) -> bool:
    if type(value) is float:
        return math.isfinite(value)
    if isinstance(value, Mapping):
        return all(_all_float_metrics_finite(item) for item in value.values())
    if type(value) in (tuple, list):
        return all(_all_float_metrics_finite(item) for item in value)
    return True


def _assert_exact_normalized_projection(
    test: unittest.TestCase, result: object
) -> None:
    projection = result.normalized_outcome_projection
    test.assertEqual(len(projection), 30)
    test.assertEqual(
        tuple(entry["ordinal"] for entry in projection), tuple(range(30))
    )
    test.assertEqual(
        tuple(
            (entry["checkId"], entry["scopeId"], entry["appliedToleranceIds"])
            for entry in projection
        ),
        tuple(
            (role["checkId"], role["scopeId"], role["appliedToleranceIds"])
            for role in science_replay.PAIR_OUTCOME_ROLES
        ),
    )
    for entry in projection:
        test.assertEqual(
            tuple(entry),
            (
                "ordinal",
                "checkId",
                "scopeId",
                "disposition",
                "appliedToleranceIds",
                "appliedToleranceResults",
                "orderedIssueCodes",
            ),
        )
        test.assertEqual(
            tuple(
                tolerance["toleranceId"]
                for tolerance in entry["appliedToleranceResults"]
            ),
            entry["appliedToleranceIds"],
        )
        for tolerance in entry["appliedToleranceResults"]:
            test.assertEqual(
                tuple(tolerance),
                ("toleranceId", "comparisonRelation", "satisfied"),
            )
            test.assertEqual(
                tolerance["comparisonRelation"],
                science_replay.PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID[
                    tolerance["toleranceId"]
                ],
            )


class IndependentScienceReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.base_input = _raw_input()
        cls.receipt = raw_inventory.admit_raw_inventory(cls.base_input)
        assert cls.receipt.disposition == "accepted"
        cls.auxiliary = _auxiliary()

    def test_frozen_policy_and_exact_typed_auxiliary_inventory(self) -> None:
        self.assertEqual(science_replay.APPROVED_POLICY_SHA256, "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00")
        self.assertEqual(science_replay.APPROVED_POLICY_SIZE_BYTES, 3_827)
        self.assertEqual(
            science_replay.CONSTRAINT_ARITHMETIC_POLICY_SHA256,
            "5a774ce79d8fd7686aeeaa26d9821f31ed2ed8619c2dac4d184f9e022a623e6d",
        )
        self.assertEqual(
            science_replay.CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES, 5_777
        )
        self.assertFalse(
            science_replay.CONSTRAINT_ARITHMETIC_POLICY[
                "legacySpacingFormulaUsed"
            ]
        )
        self.assertTrue(
            science_replay.CONSTRAINT_ARITHMETIC_POLICY[
                "conservativeExactBoundFormulaUsed"
            ]
        )
        self.assertEqual(science_replay.LEVELS, (("level_0", 1 / 16), ("level_1", 1 / 32), ("level_2", 1 / 64)))
        self.assertEqual(len(science_replay.FAMILIES), 5)
        self.assertEqual(len(science_replay.TARGET_ORDER), 9)
        self.assertEqual(len(science_replay.PAIR_OUTCOME_ROLES), 30)
        self.assertEqual(
            dict(science_replay.PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID),
            {
                "minimumMetricDemandFrobeniusSI": "observed_lower_bound_strictly_greater_than_frozen_minimum",
                "requiredMetricDemandSampleFraction": "observed_fraction_greater_than_or_equal_to_frozen_minimum",
                "meanMetricDemandPointwiseRelativeUpper95": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "meanNormalizationFloorSI": "frozen_floor_applied_to_denominator",
                "metricDemandRelativeErrorBound": "observed_relative_error_less_than_or_equal_to_frozen_maximum",
                "smearingWeightSumAbsolute": "absolute_sum_minus_one_less_than_or_equal_to_frozen_maximum",
                "exchangeSymmetryUpper95SI": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "psdNegativeEigenvalueSI": "minimum_eigenvalue_greater_than_or_equal_to_negative_frozen_tolerance",
                "fluctuationToMeanRatioUpper95": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "bracketResidualUpper95": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "antisymmetryResidualUpper95": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "jacobiResidualUpper95": "observed_upper95_less_than_or_equal_to_frozen_maximum",
                "float64RecomputeAbsolute": "every_absolute_recompute_difference_less_than_or_equal_to_frozen_maximum",
                "regulatorResidualUpper95": "final_residual_upper95_less_than_or_equal_to_frozen_maximum",
                "finalRegulatorErrorUpper95Tolerance": "final_regulator_error_upper95_less_than_or_equal_to_frozen_maximum",
                "regulatorMonotonicityAbsolute": "D12Upper_less_than_or_equal_to_D01Lower_plus_frozen_tolerance",
                "minimumRegulatorConvergenceOrder": "observed_lower_order_greater_than_or_equal_to_frozen_minimum",
            },
        )
        self.assertEqual(
            dict(science_replay.PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID),
            {
                tolerance_id: f"tolerance_not_satisfied:{tolerance_id}"
                for tolerance_id in science_replay.PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID
            },
        )
        self.assertEqual(len(self.auxiliary.metric_demand_rset_si), 640)
        self.assertEqual(
            len(self.auxiliary.metric_demand_absolute_error_bound_si), 640
        )
        self.assertTrue(
            all(len(target.values) == 256 for target in self.auxiliary.server_recomputed_classical_targets)
        )

    def test_synthetic_pass_recomputes_every_gate_without_authority(self) -> None:
        result = science_replay.replay_science(self.receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "pass")
        self.assertTrue(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition,
            "authority_neutral_diagnostic_calculation_pass",
        )
        self.assertFalse(result.retuning_permitted)
        self.assertEqual(len(result.metrics["bracketResidual"]), 9)
        self.assertEqual(len(result.metrics["antisymmetry"]), 3)
        self.assertEqual(len(result.metrics["jacobi"]), 3)
        self.assertEqual(len(result.metrics["regulatorConvergence"]), 5)
        self.assertEqual(tuple(result.metrics), result.required_check_order)
        self.assertEqual(
            result.required_check_order[4:6],
            ("smearingWeightFreeze", "smearingNormalization"),
        )
        self.assertTrue(result.metrics["smearingNormalization"]["passed"])
        self.assertTrue(
            result.metrics["smearingWeightFreeze"]["exactRawSha256Matched"]
        )
        self.assertTrue(
            result.metrics["smearingWeightFreeze"][
                "everyWeightBinary64BitsMatched"
            ]
        )
        self.assertNotIn(
            "exactRawSha256Matched", result.metrics["smearingNormalization"]
        )
        self.assertTrue(
            result.metrics["metricDemandNondegeneracy"][
                "strictlyNondegenerate"
            ]
        )
        self.assertTrue(
            result.metrics["meanMetricDemandClosure"]["allSamplesWithinTolerance"]
        )
        self.assertTrue(
            result.metrics["psd"][
                "positiveSemidefiniteWithinTolerance"
            ]
        )
        self.assertEqual(
            result.metrics["exchangeSymmetry"]["exchangeResidualUpper95SI"],
            0.0,
        )
        self.assertLess(
            result.metrics["fluctuationRatio"]["fluctuationToMeanRatioUpper95"],
            1.0,
        )
        self.assertTrue(
            all(
                metric["monotone"]
                and metric["pLower"] is not None
                and metric["pLower"] >= 1.0
                and metric["finalResidualUpper95"] <= 0.1
                and metric["finalRegulatorErrorUpper95"] <= 0.1
                for metric in result.metrics["regulatorConvergence"]
            )
        )
        self.assertEqual(
            result.numerical_runtime_boundary["psdAlgorithm"],
            "numpy.linalg.eigvalsh_full_symmetric_spectrum_UPLO_lower",
        )
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )
        self.assertIn(
            "auxiliary_scientific_input_provenance_not_authenticated",
            result.authority_blockers,
        )
        _assert_exact_normalized_projection(self, result)
        self.assertTrue(
            all(
                entry["disposition"] == "pass"
                for entry in result.normalized_outcome_projection
            )
        )

    def test_limit_failure_finishes_replay_and_forbids_retuning(self) -> None:
        zero_metric = replace(
            self.auxiliary,
            metric_demand_rset_si=tuple(0.0 for _unused in range(640)),
        )
        result = science_replay.replay_science(self.receipt, zero_metric)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertTrue(result.calculation_complete)
        self.assertEqual(result.first_issue, "metric_demand_degenerate")
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertFalse(result.retuning_permitted)
        self.assertEqual(len(result.metrics["bracketResidual"]), 9)
        self.assertEqual(len(result.metrics["antisymmetry"]), 3)
        self.assertEqual(len(result.metrics["jacobi"]), 3)
        self.assertEqual(len(result.metrics["regulatorConvergence"]), 5)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_target_and_residual_echoes_and_regulator_are_independent(self) -> None:
        value = _raw_input()
        _replace_role(
            value,
            "constraint_operand.level_0.H_H.target",
            0.3,
        )
        _replace_role(
            value,
            "constraint_operand.level_2.H_H.computed",
            _SERVER_TARGET + 0.2,
        )
        _replace_role(
            value,
            "constraint_operand.level_2.H_H.residual",
            0.2,
        )
        _replace_role(
            value,
            "constraint_operand.level_1.H_Hi.residual",
            0.5,
        )
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        codes = {issue.code for issue in result.issues}
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertIn("submitted_target_echo_mismatch:level_0:H_H", codes)
        self.assertIn(
            "submitted_residual_echo_mismatch:level_1:H_Hi", codes
        )
        self.assertIn("regulator_not_monotone:H_H", codes)
        self.assertIn("regulator_final_residual_exceeds_tolerance:H_H", codes)
        self.assertIn("regulator_final_error_exceeds_tolerance:H_H", codes)
        h_h_level_0 = next(
            metric
            for metric in result.metrics["bracketResidual"]
            if metric["levelId"] == "level_0" and metric["familyId"] == "H_H"
        )
        self.assertAlmostEqual(h_h_level_0["residualLInf"], 0.04)
        self.assertAlmostEqual(
            h_h_level_0["submittedTargetEchoMismatchLInf"], 0.1
        )
        self.assertAlmostEqual(
            h_h_level_0["submittedResidualEchoMismatchLInf"], 0.0
        )

    def test_submitted_target_echo_may_differ_within_frozen_tolerance(self) -> None:
        value = _raw_input()
        _replace_role(
            value,
            "constraint_operand.level_0.H_H.target",
            _SERVER_TARGET + 5e-13,
        )
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "pass")
        entry = next(
            metric
            for metric in result.metrics["bracketResidual"]
            if metric["levelId"] == "level_0" and metric["familyId"] == "H_H"
        )
        self.assertGreater(entry["submittedTargetEchoMismatchLInf"], 0.0)
        self.assertLessEqual(
            entry["submittedTargetEchoMismatchLInf"],
            science_replay.FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE,
        )

    def test_exchange_and_direct_minimum_eigenvalue_fail_closed(self) -> None:
        value = _raw_input()
        files = value["files"]
        assert type(files) is list and type(files[0]) is dict
        noise = np.frombuffer(files[0]["bytes"], dtype="<f8").copy().reshape(
            64, 64, 100
        )
        noise[0, 0, 0] = -0.01
        noise[0, 1, 0] = 0.02
        payload = noise.tobytes(order="C")
        files[0]["bytes"] = payload
        files[0]["sha256"] = sha256(payload).hexdigest()
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        codes = {issue.code for issue in result.issues}
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertIn("noise_exchange_symmetry_exceeds_tolerance", codes)
        self.assertIn("noise_covariance_not_psd_within_tolerance", codes)
        self.assertLess(
            result.metrics["psd"][
                "minimumCentralEigenvalueSI"
            ],
            -1e-12,
        )

    def test_frozen_science_check_precedence_with_multiple_failures(self) -> None:
        value = _raw_input()
        _replace_role(value, "smearing_weights", 1.0 / 128.0)
        _replace_role(
            value,
            "constraint_operand.level_2.H_H.residual",
            0.5,
        )
        _replace_role(
            value,
            "constraint_operand.level_0.H_Hi.target",
            0.3,
        )
        files = value["files"]
        assert type(files) is list and type(files[0]) is dict
        noise = np.frombuffer(files[0]["bytes"], dtype="<f8").copy().reshape(
            64, 64, 100
        )
        noise[0, 0, 0] = -0.01
        noise[0, 1, 0] = 0.02
        payload = noise.tobytes(order="C")
        files[0]["bytes"] = payload
        files[0]["sha256"] = sha256(payload).hexdigest()
        receipt = raw_inventory.admit_raw_inventory(value)
        zero_metric = replace(
            self.auxiliary,
            metric_demand_rset_si=tuple(0.0 for _unused in range(640)),
        )
        result = science_replay.replay_science(receipt, zero_metric)
        self.assertEqual(
            [issue.code for issue in result.issues[:9]],
            [
                "metric_demand_degenerate",
                "mean_metric_demand_closure_exceeds_tolerance",
                "metric_demand_error_bound_exceeds_tolerance",
                "smearing_weights_not_frozen_exact",
                "smearing_weight_normalization_exceeds_tolerance",
                "noise_exchange_symmetry_exceeds_tolerance",
                "noise_covariance_not_psd_within_tolerance",
                "submitted_residual_echo_mismatch:level_2:H_H",
                "submitted_target_echo_mismatch:level_0:H_Hi",
            ],
        )

    def test_normalized_nonuniform_weights_fail_the_exact_freeze(self) -> None:
        value = _raw_input()
        weights = np.full(64, 1.0 / 64.0, dtype="<f8")
        weights[0] = 1.0 / 32.0
        weights[1] = 0.0
        _replace_array(value, "smearing_weights", weights)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertTrue(result.calculation_complete)
        self.assertEqual(
            [issue.code for issue in result.issues],
            ["smearing_weights_not_frozen_exact"],
        )
        self.assertEqual(result.first_issue, "smearing_weights_not_frozen_exact")
        self.assertEqual(
            result.metrics["smearingNormalization"]["weightSum"], 1.0
        )
        self.assertTrue(result.metrics["smearingNormalization"]["passed"])
        self.assertFalse(
            result.metrics["smearingWeightFreeze"]["exactRawSha256Matched"]
        )
        self.assertFalse(
            result.metrics["smearingWeightFreeze"][
                "everyWeightBinary64BitsMatched"
            ]
        )
        _assert_exact_normalized_projection(self, result)
        self.assertEqual(
            (
                result.normalized_outcome_projection[4]["disposition"],
                result.normalized_outcome_projection[5]["disposition"],
            ),
            ("fail", "pass"),
        )

    def test_raw_hash_fail_survives_later_auxiliary_block_before_decode(self) -> None:
        value = _raw_input()
        _replace_role(value, "smearing_weights", 1.0 / 128.0)
        receipt = raw_inventory.admit_raw_inventory(value)
        malformed_auxiliary = replace(
            self.auxiliary,
            metric_demand_rset_si=self.auxiliary.metric_demand_rset_si[:-1],
        )
        result = science_replay.replay_science(receipt, malformed_auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertEqual(
            [(entry.code, entry.disposition) for entry in result.issues],
            [
                ("smearing_weights_not_frozen_exact", "fail"),
                ("auxiliary_length_mismatch", "blocked"),
            ],
        )
        self.assertEqual(
            result.first_issue, "smearing_weights_not_frozen_exact"
        )
        self.assertIsNone(
            result.metrics["smearingWeightFreeze"][
                "everyWeightBinary64BitsMatched"
            ]
        )
        _assert_exact_normalized_projection(self, result)
        self.assertEqual(
            result.normalized_outcome_projection[4]["disposition"], "fail"
        )
        self.assertEqual(
            result.normalized_outcome_projection[4]["orderedIssueCodes"],
            ("smearing_weight_freeze_not_satisfied",),
        )
        self.assertTrue(
            all(
                entry["disposition"] == "blocked"
                for ordinal, entry in enumerate(
                    result.normalized_outcome_projection
                )
                if ordinal != 4
            )
        )

    def test_extreme_finite_weights_block_without_python_fsum_escape(self) -> None:
        value = _raw_input()
        _replace_role(value, "smearing_weights", sys.float_info.max)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [
                ("smearing_weights_not_frozen_exact", "fail"),
                ("derived_nonfinite:smearing_weight_sum", "blocked"),
            ],
        )
        self.assertEqual(
            result.first_issue, "smearing_weights_not_frozen_exact"
        )
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_extreme_metric_error_ratio_blocks_without_numpy_escape(self) -> None:
        metric = np.asarray(
            self.auxiliary.metric_demand_rset_si, dtype=np.float64
        ).reshape(64, 10).copy()
        error = np.asarray(
            self.auxiliary.metric_demand_absolute_error_bound_si,
            dtype=np.float64,
        ).reshape(64, 10).copy()
        metric[0, :] = 0.0
        metric[0, 0] = float.fromhex("0x1p-537")
        error[0, :] = 0.0
        error[0, 0] = 1e154
        auxiliary = replace(
            self.auxiliary,
            metric_demand_rset_si=tuple(
                float(value) for value in metric.reshape(-1)
            ),
            metric_demand_absolute_error_bound_si=tuple(
                float(value) for value in error.reshape(-1)
            ),
        )
        result = science_replay.replay_science(self.receipt, auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [
                ("metric_demand_degenerate", "fail"),
                (
                    "derived_nonfinite:metric_demand_error_bound_ratio",
                    "blocked",
                ),
            ],
        )
        self.assertEqual(result.first_issue, "metric_demand_degenerate")
        self.assertIsNone(
            result.metrics["metricDemand"]["maximumRelativeErrorBound"]
        )
        self.assertTrue(_all_float_metrics_finite(result.metrics))
        self.assertFalse(result.retuning_permitted)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_single_max_weight_blocks_covariance_basis_without_escape(self) -> None:
        value = _raw_input()
        weights = np.zeros(64, dtype="<f8")
        weights[0] = sys.float_info.max
        _replace_array(value, "smearing_weights", weights)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [
                ("smearing_weights_not_frozen_exact", "fail"),
                (
                    "smearing_weight_normalization_exceeds_tolerance",
                    "fail",
                ),
                (
                    "derived_nonfinite:covariance_basis_weighting",
                    "blocked",
                ),
            ],
        )
        self.assertEqual(
            result.first_issue,
            "smearing_weights_not_frozen_exact",
        )
        self.assertTrue(_all_float_metrics_finite(result.metrics))
        self.assertFalse(result.retuning_permitted)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_extreme_symmetric_noise_blocks_without_numpy_add_escape(self) -> None:
        value = _raw_input()
        files = value["files"]
        assert type(files) is list and type(files[0]) is dict
        noise = np.frombuffer(files[0]["bytes"], dtype="<f8").copy().reshape(
            64, 64, 100
        )
        noise[0, 0, 0] = sys.float_info.max
        _replace_array(value, "noise_kernel", noise)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "blocked")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition, "blocked_without_candidate_result"
        )
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [("derived_nonfinite:noise_symmetrization", "blocked")],
        )
        self.assertEqual(
            result.first_issue, "derived_nonfinite:noise_symmetrization"
        )
        self.assertTrue(_all_float_metrics_finite(result.metrics))
        self.assertFalse(result.retuning_permitted)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_central_covariance_symmetrization_blocks_without_escape(self) -> None:
        value = _raw_input()
        weights = np.zeros(64, dtype="<f8")
        weights[0] = 1.0
        _replace_array(value, "smearing_weights", weights)
        files = value["files"]
        assert type(files) is list and type(files[0]) is dict
        noise = np.frombuffer(files[0]["bytes"], dtype="<f8").copy().reshape(
            64, 64, 100
        )
        noise[0, 0, 11] = 8e307
        _replace_array(value, "noise_kernel", noise)
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [
                ("smearing_weights_not_frozen_exact", "fail"),
                (
                    "derived_nonfinite:central_covariance_symmetrization",
                    "blocked",
                )
            ],
        )
        self.assertEqual(
            result.first_issue,
            "smearing_weights_not_frozen_exact",
        )
        self.assertTrue(_all_float_metrics_finite(result.metrics))
        self.assertFalse(result.retuning_permitted)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_regulator_log_difference_survives_quotient_underflow(self) -> None:
        value = _raw_input()
        level_residuals = {
            "level_0": float.fromhex("0x0.0000000000001p-1022"),
            "level_1": 0.0,
            "level_2": 1e300,
        }
        for level_id, residual in level_residuals.items():
            _replace_role(
                value,
                f"constraint_operand.{level_id}.H_H.computed",
                residual,
            )
            _replace_role(
                value,
                f"constraint_operand.{level_id}.H_H.target",
                0.0,
            )
            _replace_role(
                value,
                f"constraint_operand.{level_id}.H_H.residual",
                residual,
            )
            _replace_role(
                value,
                f"constraint_operand.{level_id}.H_H.absolute_uncertainty95",
                0.0,
            )
        targets = tuple(
            replace(
                target,
                values=tuple(0.0 for _unused in range(256)),
            )
            if target.family_id == "H_H"
            else target
            for target in self.auxiliary.server_recomputed_classical_targets
        )
        auxiliary = replace(
            self.auxiliary,
            server_recomputed_classical_targets=targets,
        )
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, auxiliary)
        h_h = next(
            metric
            for metric in result.metrics["regulatorConvergence"]
            if metric["familyId"] == "H_H"
        )
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertTrue(result.calculation_complete)
        self.assertEqual(h_h["D01Lower"], level_residuals["level_0"])
        self.assertEqual(h_h["D12Upper"], level_residuals["level_2"])
        self.assertEqual(h_h["D01Lower"] / h_h["D12Upper"], 0.0)
        self.assertTrue(math.isfinite(h_h["pLower"]))
        self.assertLess(h_h["pLower"], -1_000.0)
        self.assertNotIn(
            "derived_nonfinite:regulator_log_order",
            {issue.code for issue in result.issues},
        )

    def test_late_block_preserves_earlier_failure_and_candidate_fail(self) -> None:
        value = _raw_input()
        _replace_role(value, "smearing_weights", 1.0 / 128.0)
        _replace_role(
            value,
            "noise_kernel_absolute_uncertainty95",
            sys.float_info.max,
        )
        receipt = raw_inventory.admit_raw_inventory(value)
        self.assertEqual(receipt.disposition, "accepted")
        result = science_replay.replay_science(receipt, self.auxiliary)
        self.assertEqual(result.calculation_disposition, "fail")
        self.assertFalse(result.calculation_complete)
        self.assertEqual(
            result.candidate_disposition,
            "fail_frozen_candidate_without_retuning",
        )
        self.assertEqual(
            [(issue.code, issue.disposition) for issue in result.issues],
            [
                ("smearing_weights_not_frozen_exact", "fail"),
                (
                    "smearing_weight_normalization_exceeds_tolerance",
                    "fail",
                ),
                ("derived_nonfinite", "blocked"),
            ],
        )
        self.assertEqual(
            result.first_issue,
            "smearing_weights_not_frozen_exact",
        )
        self.assertFalse(result.retuning_permitted)
        self.assertTrue(
            all(value is False for value in result.authority_boundary.values())
        )

    def test_validation_precedence_is_receipt_then_finite_then_negative_zero_then_sign(self) -> None:
        malformed = object()
        self.assertEqual(
            science_replay.replay_science(object(), malformed).first_issue,
            "admitted_receipt_invalid",
        )

        metric = list(self.auxiliary.metric_demand_rset_si)
        error = list(self.auxiliary.metric_demand_absolute_error_bound_si)
        metric[0] = float("nan")
        metric[1] = -0.0
        error[0] = -1.0
        all_three = replace(
            self.auxiliary,
            metric_demand_rset_si=tuple(metric),
            metric_demand_absolute_error_bound_si=tuple(error),
        )
        self.assertEqual(
            science_replay.replay_science(self.receipt, all_three).first_issue,
            "input_nonfinite",
        )

        metric[0] = 10.0
        negative_zero_and_sign = replace(
            all_three,
            metric_demand_rset_si=tuple(metric),
        )
        self.assertEqual(
            science_replay.replay_science(
                self.receipt, negative_zero_and_sign
            ).first_issue,
            "input_negative_zero",
        )

        metric[1] = 0.0
        negative_sign_only = replace(
            negative_zero_and_sign,
            metric_demand_rset_si=tuple(metric),
        )
        self.assertEqual(
            science_replay.replay_science(
                self.receipt, negative_sign_only
            ).first_issue,
            "input_nonnegative_role_negative",
        )

    def test_forged_receipt_cannot_trap_or_expose_forged_hashes(self) -> None:
        class Trap:
            calls = 0

            def __eq__(self, _other: object) -> bool:
                type(self).calls += 1
                raise AssertionError("forged receipt field comparison ran")

            def __iter__(self):
                type(self).calls += 1
                raise AssertionError("forged receipt field iteration ran")

            def values(self):
                type(self).calls += 1
                raise AssertionError("forged receipt mapping traversal ran")

        forged = raw_inventory.Receipt(
            artifact_id=Trap(),
            contract_version=Trap(),
            server_owned=True,
            independent_implementation=True,
            diagnostic_only=True,
            calculation_only=True,
            disposition=Trap(),
            calculation_ready=True,
            first_blocker=None,
            blockers=Trap(),
            candidate_id=Trap(),
            raw_hash_closure_sha256="f" * 64,
            raw_hash_bindings=Trap(),
            authority_boundary=Trap(),
        )
        result = science_replay.replay_science(forged, self.auxiliary)
        self.assertEqual(result.first_issue, "admitted_receipt_invalid")
        self.assertIsNone(result.raw_hash_closure_sha256)
        self.assertEqual(Trap.calls, 0)
        _assert_exact_normalized_projection(self, result)
        self.assertTrue(
            all(
                entry["disposition"] == "blocked"
                for entry in result.normalized_outcome_projection
            )
        )

    def test_auxiliary_is_exact_and_source_imports_are_disjoint(self) -> None:
        wrong_length = replace(
            self.auxiliary,
            metric_demand_rset_si=self.auxiliary.metric_demand_rset_si[:-1],
        )
        self.assertEqual(
            science_replay.replay_science(self.receipt, wrong_length).first_issue,
            "auxiliary_length_mismatch",
        )
        source = (HERE / "science_replay.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported_roots.add(node.module.split(".")[0])
        self.assertLessEqual(
            imported_roots,
            {
                "__future__",
                "dataclasses",
                "math",
                "platform",
                "struct",
                "types",
                "typing",
                "numpy",
                "raw_inventory",
            },
        )
        lowered = source.lower()
        for forbidden in (
            "server/services/",
            "content-replay",
            "subprocess",
            "declared_lever",
        ):
            self.assertNotIn(forbidden, lowered)
        self.assertNotIn("open(", lowered)


if __name__ == "__main__":
    unittest.main()
