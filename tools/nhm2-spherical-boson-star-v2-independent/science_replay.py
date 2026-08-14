"""Source-disjoint numerical replay for the frozen spherical-v2 byte ABI.

The only project-local dependency is :mod:`raw_inventory`, whose private
capability proves that the 68 immutable byte strings passed its independent
admission checks.  This module deliberately does not import the production
implementation or any TypeScript contract.  It duplicates the approved v2
numeric policy and uses a full symmetric eigensolve instead of the primary
factorization path.

The auxiliary metric-demand, error-bound, and classical-target values are
strongly shaped calculation inputs.  Their provenance and the execution that
created them are intentionally *not* authenticated here.  Consequently a
``pass`` is only an authority-neutral calculation result: every replay,
agreement, lamp, viability, propulsion, and transport authority flag remains
false.
"""

from __future__ import annotations

from dataclasses import dataclass
from math import copysign, fsum, isfinite, log, sqrt
from platform import python_implementation, python_version
from struct import pack, unpack
from types import MappingProxyType
from typing import Final, Iterable, Mapping

import numpy as np

import raw_inventory


CANDIDATE_ID: Final = (
    "nhm2.semiclassical_v2.spherical_boson_star_1s_weak_field_control/v1"
)
AUXILIARY_CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_independent_science_auxiliary/v1"
)
REPLAY_CONTRACT_VERSION: Final = (
    "nhm2_spherical_boson_star_v2_independent_science_replay/v1"
)
REPLAY_ARTIFACT_ID: Final = (
    "nhm2.spherical_boson_star_v2_independent_science_replay_receipt"
)
APPROVED_POLICY_ARTIFACT_ID: Final = (
    "nhm2.semiclassical_v2_approved_replay_policy"
)
APPROVED_POLICY_CONTRACT_VERSION: Final = (
    "nhm2_semiclassical_v2_approved_replay_policy/v2"
)
APPROVED_POLICY_ID: Final = (
    "nhm2.server_owned.semiclassical_v2.diagnostic_replay/v2"
)
APPROVED_POLICY_SHA256: Final = (
    "ada5f8a24aba724ec36528d9bddfe267b794b93cd3bceef9a7774c1e78ad5b00"
)
APPROVED_POLICY_SIZE_BYTES: Final = 3_827
CONSTRAINT_ARITHMETIC_POLICY_ARTIFACT_ID: Final = (
    "nhm2.semiclassical_v2_constraint_operand_replay_policy"
)
CONSTRAINT_ARITHMETIC_POLICY_CONTRACT_VERSION: Final = (
    "nhm2_semiclassical_v2_constraint_operand_replay_policy/v2"
)
CONSTRAINT_ARITHMETIC_POLICY_ID: Final = (
    "nhm2.server_owned.semiclassical_v2.constraint_operand_replay/v2"
)
CONSTRAINT_ARITHMETIC_POLICY_SHA256_DOMAIN: Final = (
    "nhm2-semiclassical-v2-constraint-operand-replay-policy/v2\n"
)
CONSTRAINT_ARITHMETIC_POLICY_SHA256: Final = (
    "5a774ce79d8fd7686aeeaa26d9821f31ed2ed8619c2dac4d184f9e022a623e6d"
)
CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES: Final = 5_777
CLASSICAL_TARGET_ORIGIN: Final = (
    "server_recomputed_from_frozen_classical_structure_functions"
)

SAMPLE_COUNT: Final = 64
TENSOR_COMPONENT_COUNT: Final = 10
NOISE_PAIR_COUNT: Final = 100
CONSTRAINT_CHANNEL_COUNT: Final = 4
COVARIANCE_DIMENSION: Final = 640
LEVELS: Final = (
    ("level_0", 1.0 / 16.0),
    ("level_1", 1.0 / 32.0),
    ("level_2", 1.0 / 64.0),
)
BRACKET_FAMILIES: Final = ("H_H", "H_Hi", "Hi_Hj")
FAMILIES: Final = (*BRACKET_FAMILIES, "antisymmetry", "jacobi")
TARGET_ORDER: Final = tuple(
    (level_id, family_id)
    for level_id, _spacing in LEVELS
    for family_id in BRACKET_FAMILIES
)
REQUIRED_CHECK_ORDER: Final = (
    "finiteness",
    "metricDemandNondegeneracy",
    "meanMetricDemandClosure",
    "metricDemandErrorEnclosure",
    "smearingWeightFreeze",
    "smearingNormalization",
    "exchangeSymmetry",
    "psd",
    "maximumEigenvalueUpper95",
    "fluctuationRatio",
    "bracketResidual",
    "antisymmetry",
    "jacobi",
    "regulatorConvergence",
)
SYMMETRIC_TENSOR_MULTIPLICITIES: Final = (
    1.0,
    2.0,
    2.0,
    2.0,
    1.0,
    2.0,
    2.0,
    1.0,
    2.0,
    1.0,
)

SMEARING_WEIGHT_SUM_TOLERANCE: Final = 1e-12
SMEARING_WEIGHT_EXACT: Final = 1.0 / 64.0
SMEARING_WEIGHT_BINARY64_BITS: Final = 0x3F90000000000000
SMEARING_WEIGHT_RAW_SHA256: Final = (
    "25493ecc62734a68fad443881a595d122cb7a93ddf9d07e5ec2060baf84f03fd"
)
SMEARING_WEIGHT_FREEZE_SHA256: Final = (
    "4cff97a0c1220dbef8c0df29e500d4c80d88320c97f8d16529c9e98ac290a446"
)
SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES: Final = 6_764
EXCHANGE_SYMMETRY_TOLERANCE_SI: Final = 1e-12
PSD_NEGATIVE_EIGENVALUE_TOLERANCE_SI: Final = 1e-12
MEAN_NORMALIZATION_FLOOR_SI: Final = 1e-12
FLUCTUATION_TO_MEAN_RATIO_TOLERANCE: Final = 1.0
MINIMUM_METRIC_DEMAND_FROBENIUS_SI: Final = 1e-12
REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION: Final = 1.0
MEAN_METRIC_DEMAND_RELATIVE_UPPER95_TOLERANCE: Final = 0.1
METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE: Final = 0.01
BRACKET_RESIDUAL_UPPER95_TOLERANCE: Final = 0.1
ANTISYMMETRY_RESIDUAL_UPPER95_TOLERANCE: Final = 0.1
JACOBI_RESIDUAL_UPPER95_TOLERANCE: Final = 0.1
REGULATOR_FINAL_RESIDUAL_UPPER95_TOLERANCE: Final = 0.1
REGULATOR_FINAL_ERROR_UPPER95_TOLERANCE: Final = 0.1
REGULATOR_MONOTONICITY_ABSOLUTE_TOLERANCE: Final = 1e-12
MINIMUM_REGULATOR_CONVERGENCE_ORDER: Final = 1.0
FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE: Final = 1e-12

PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID: Final = MappingProxyType(
    {
        "minimumMetricDemandFrobeniusSI": (
            "observed_lower_bound_strictly_greater_than_frozen_minimum"
        ),
        "requiredMetricDemandSampleFraction": (
            "observed_fraction_greater_than_or_equal_to_frozen_minimum"
        ),
        "meanMetricDemandPointwiseRelativeUpper95": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "meanNormalizationFloorSI": "frozen_floor_applied_to_denominator",
        "metricDemandRelativeErrorBound": (
            "observed_relative_error_less_than_or_equal_to_frozen_maximum"
        ),
        "smearingWeightSumAbsolute": (
            "absolute_sum_minus_one_less_than_or_equal_to_frozen_maximum"
        ),
        "exchangeSymmetryUpper95SI": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "psdNegativeEigenvalueSI": (
            "minimum_eigenvalue_greater_than_or_equal_to_negative_frozen_tolerance"
        ),
        "fluctuationToMeanRatioUpper95": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "bracketResidualUpper95": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "antisymmetryResidualUpper95": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "jacobiResidualUpper95": (
            "observed_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "float64RecomputeAbsolute": (
            "every_absolute_recompute_difference_less_than_or_equal_to_frozen_maximum"
        ),
        "regulatorResidualUpper95": (
            "final_residual_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "finalRegulatorErrorUpper95Tolerance": (
            "final_regulator_error_upper95_less_than_or_equal_to_frozen_maximum"
        ),
        "regulatorMonotonicityAbsolute": (
            "D12Upper_less_than_or_equal_to_D01Lower_plus_frozen_tolerance"
        ),
        "minimumRegulatorConvergenceOrder": (
            "observed_lower_order_greater_than_or_equal_to_frozen_minimum"
        ),
    }
)
PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID: Final = MappingProxyType(
    {
        tolerance_id: f"tolerance_not_satisfied:{tolerance_id}"
        for tolerance_id in PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID
    }
)
PAIR_CANONICAL_OUTCOME_ISSUE_CODES: Final = MappingProxyType(
    {
        "blocked": "outcome_not_recomputed",
        "finiteness": "finiteness_not_satisfied",
        "smearingWeightFreeze": "smearing_weight_freeze_not_satisfied",
        "maximumEigenvalueUpper95": "maximum_eigenvalue_upper95_not_finite",
    }
)


def _pair_outcome_role(
    ordinal: int,
    check_id: str,
    scope_id: str,
    tolerance_ids: tuple[str, ...],
) -> Mapping[str, object]:
    return MappingProxyType(
        {
            "ordinal": ordinal,
            "checkId": check_id,
            "scopeId": scope_id,
            "appliedToleranceIds": tolerance_ids,
        }
    )


_PAIR_TOP_OUTCOME_ROLES: Final = (
    _pair_outcome_role(0, "finiteness", "all_raw_and_auxiliary_values", ()),
    _pair_outcome_role(
        1,
        "metricDemandNondegeneracy",
        "all_64_samples",
        (
            "minimumMetricDemandFrobeniusSI",
            "requiredMetricDemandSampleFraction",
        ),
    ),
    _pair_outcome_role(
        2,
        "meanMetricDemandClosure",
        "all_64_samples",
        (
            "meanMetricDemandPointwiseRelativeUpper95",
            "meanNormalizationFloorSI",
        ),
    ),
    _pair_outcome_role(
        3,
        "metricDemandErrorEnclosure",
        "all_64_samples",
        ("metricDemandRelativeErrorBound",),
    ),
    _pair_outcome_role(4, "smearingWeightFreeze", "raw_file_ordinal_4", ()),
    _pair_outcome_role(
        5,
        "smearingNormalization",
        "all_64_weights",
        ("smearingWeightSumAbsolute",),
    ),
    _pair_outcome_role(
        6,
        "exchangeSymmetry",
        "full_bilocal_tensor",
        ("exchangeSymmetryUpper95SI",),
    ),
    _pair_outcome_role(
        7,
        "psd",
        "weighted_640_by_640_covariance",
        ("psdNegativeEigenvalueSI",),
    ),
    _pair_outcome_role(
        8,
        "maximumEigenvalueUpper95",
        "weighted_640_by_640_covariance",
        (),
    ),
    _pair_outcome_role(
        9,
        "fluctuationRatio",
        "smeared_symmetric_tensor",
        ("fluctuationToMeanRatioUpper95", "meanNormalizationFloorSI"),
    ),
)
_PAIR_CONSTRAINT_OUTCOME_ROLES: Final = tuple(
    _pair_outcome_role(
        10 + level_ordinal * len(FAMILIES) + family_ordinal,
        (
            "antisymmetry"
            if family_id == "antisymmetry"
            else "jacobi"
            if family_id == "jacobi"
            else "bracketResidual"
        ),
        f"{level_id}.{family_id}",
        (
            (
                "bracketResidualUpper95"
                if family_id in BRACKET_FAMILIES
                else "antisymmetryResidualUpper95"
                if family_id == "antisymmetry"
                else "jacobiResidualUpper95"
            ),
            "float64RecomputeAbsolute",
        )
        if level_ordinal == 2
        else ("float64RecomputeAbsolute",),
    )
    for level_ordinal, (level_id, _spacing) in enumerate(LEVELS)
    for family_ordinal, family_id in enumerate(FAMILIES)
)
_PAIR_REGULATOR_OUTCOME_ROLES: Final = tuple(
    _pair_outcome_role(
        25 + family_ordinal,
        "regulatorConvergence",
        family_id,
        (
            "regulatorResidualUpper95",
            "finalRegulatorErrorUpper95Tolerance",
            "regulatorMonotonicityAbsolute",
            "minimumRegulatorConvergenceOrder",
        ),
    )
    for family_ordinal, family_id in enumerate(FAMILIES)
)
PAIR_OUTCOME_ROLES: Final = (
    *_PAIR_TOP_OUTCOME_ROLES,
    *_PAIR_CONSTRAINT_OUTCOME_ROLES,
    *_PAIR_REGULATOR_OUTCOME_ROLES,
)

APPROVED_POLICY: Final = MappingProxyType(
    {
        "artifactId": APPROVED_POLICY_ARTIFACT_ID,
        "contractVersion": APPROVED_POLICY_CONTRACT_VERSION,
        "policyId": APPROVED_POLICY_ID,
        "sha256": APPROVED_POLICY_SHA256,
        "sizeBytes": APPROVED_POLICY_SIZE_BYTES,
        "sampleCount": SAMPLE_COUNT,
        "regulatorLevels": LEVELS,
        "families": FAMILIES,
        "symmetricTensorMultiplicities": SYMMETRIC_TENSOR_MULTIPLICITIES,
        "smearingWeightSumAbsolute": SMEARING_WEIGHT_SUM_TOLERANCE,
        "smearingWeightExact": SMEARING_WEIGHT_EXACT,
        "smearingWeightBinary64Bits": f"{SMEARING_WEIGHT_BINARY64_BITS:016x}",
        "smearingWeightRawSha256": SMEARING_WEIGHT_RAW_SHA256,
        "smearingWeightFreezeSha256": SMEARING_WEIGHT_FREEZE_SHA256,
        "smearingWeightFreezeCanonicalSizeBytes": (
            SMEARING_WEIGHT_FREEZE_CANONICAL_SIZE_BYTES
        ),
        "exchangeSymmetryUpper95SI": EXCHANGE_SYMMETRY_TOLERANCE_SI,
        "psdNegativeEigenvalueSI": PSD_NEGATIVE_EIGENVALUE_TOLERANCE_SI,
        "meanNormalizationFloorSI": MEAN_NORMALIZATION_FLOOR_SI,
        "fluctuationToMeanRatioUpper95": (
            FLUCTUATION_TO_MEAN_RATIO_TOLERANCE
        ),
        "minimumMetricDemandFrobeniusSI": (
            MINIMUM_METRIC_DEMAND_FROBENIUS_SI
        ),
        "requiredMetricDemandSampleFraction": (
            REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION
        ),
        "meanMetricDemandPointwiseRelativeUpper95": (
            MEAN_METRIC_DEMAND_RELATIVE_UPPER95_TOLERANCE
        ),
        "metricDemandRelativeErrorBound": (
            METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE
        ),
        "bracketResidualUpper95": BRACKET_RESIDUAL_UPPER95_TOLERANCE,
        "antisymmetryResidualUpper95": (
            ANTISYMMETRY_RESIDUAL_UPPER95_TOLERANCE
        ),
        "jacobiResidualUpper95": JACOBI_RESIDUAL_UPPER95_TOLERANCE,
        "regulatorResidualUpper95": (
            REGULATOR_FINAL_RESIDUAL_UPPER95_TOLERANCE
        ),
        "regulatorErrorUpper95": REGULATOR_FINAL_ERROR_UPPER95_TOLERANCE,
        "regulatorMonotonicityAbsolute": (
            REGULATOR_MONOTONICITY_ABSOLUTE_TOLERANCE
        ),
        "minimumRegulatorConvergenceOrder": (
            MINIMUM_REGULATOR_CONVERGENCE_ORDER
        ),
        "float64RecomputeAbsolute": FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE,
    }
)
CONSTRAINT_ARITHMETIC_POLICY: Final = MappingProxyType(
    {
        "artifactId": CONSTRAINT_ARITHMETIC_POLICY_ARTIFACT_ID,
        "contractVersion": CONSTRAINT_ARITHMETIC_POLICY_CONTRACT_VERSION,
        "policyId": CONSTRAINT_ARITHMETIC_POLICY_ID,
        "sha256Domain": CONSTRAINT_ARITHMETIC_POLICY_SHA256_DOMAIN,
        "sha256": CONSTRAINT_ARITHMETIC_POLICY_SHA256,
        "sizeBytes": CONSTRAINT_ARITHMETIC_POLICY_SIZE_BYTES,
        "relationToApprovedReplayPolicy": (
            "candidate_specific_additive_successor_for_constraint_residual_"
            "and_regulator_arithmetic_only"
        ),
        "supersedes": (
            "legacy_spacing_qk_regulator_summary_for_this_candidate"
        ),
        "doesNotSupersede": (
            "approved_v2_identity_units_tolerances_or_other_science_checks"
        ),
        "legacySpacingFormulaUsed": False,
        "conservativeExactBoundFormulaUsed": True,
    }
)

_EXPECTED_RAW_LENGTHS: Final = (
    409_600,
    409_600,
    640,
    640,
    64,
    *((256,) * 63),
)
_NONNEGATIVE_RAW_ORDINALS: Final = (
    1,
    3,
    4,
    8,
    12,
    16,
    20,
    25,
    29,
    33,
    37,
    41,
    46,
    50,
    54,
    58,
    62,
    67,
)
_ORDINAL_BY_ROLE: Final = MappingProxyType(
    {descriptor.role: descriptor.file_ordinal for descriptor in raw_inventory.FILE_DESCRIPTORS}
)


@dataclass(frozen=True, slots=True)
class ClassicalTargetArray:
    level_id: str
    family_id: str
    origin: str
    values: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class AuxiliaryFrozenInputs:
    contract_version: str
    candidate_id: str
    metric_demand_rset_si: tuple[float, ...]
    metric_demand_absolute_error_bound_si: tuple[float, ...]
    server_recomputed_classical_targets: tuple[ClassicalTargetArray, ...]


@dataclass(frozen=True, slots=True)
class ReplayIssue:
    code: str
    phase: str
    pointer: str | None
    detail: str
    disposition: str


@dataclass(frozen=True, slots=True)
class ReplayResult:
    artifact_id: str
    contract_version: str
    implementation_role: str
    source_disjoint: bool
    diagnostic_only: bool
    calculation_complete: bool
    calculation_disposition: str
    candidate_disposition: str
    retuning_permitted: bool
    first_issue: str | None
    issues: tuple[ReplayIssue, ...]
    raw_hash_closure_sha256: str | None
    approved_policy: Mapping[str, object]
    constraint_arithmetic_policy: Mapping[str, object]
    required_check_order: tuple[str, ...]
    normalized_outcome_projection: tuple[Mapping[str, object], ...]
    numerical_runtime_boundary: Mapping[str, object]
    metrics: Mapping[str, object]
    authority_blockers: tuple[str, ...]
    authority_boundary: Mapping[str, bool]


_AUTHORITY_BLOCKERS: Final = (
    "auxiliary_scientific_input_provenance_not_authenticated",
    "independent_execution_provenance_not_authenticated",
    "scientific_preseal_not_authenticated_by_this_calculation",
    "pair_agreement_not_computed_by_this_calculation",
)
_AUTHORITY_BOUNDARY: Final = MappingProxyType(
    {
        "auxiliaryProvenanceValidated": False,
        "executionProvenanceValidated": False,
        "scientificPresealValidated": False,
        "replayAuthority": False,
        "replayPerformed": False,
        "independentAgreement": False,
        "semiclassicalStressNoiseLamp": False,
        "semiclassicalConstraintAlgebraLamp": False,
        "diagnosticPass": False,
        "theoryGraphPromotion": False,
        "physicalViability": False,
        "propulsion": False,
        "transport": False,
        "certificateAuthority": False,
    }
)


def _lapack_build_identity() -> str:
    configuration = getattr(np.__config__, "CONFIG", None)
    if not isinstance(configuration, dict):
        return "numpy_linked_lapack_identity_unavailable"
    dependencies = configuration.get("Build Dependencies")
    if not isinstance(dependencies, dict):
        return "numpy_linked_lapack_identity_unavailable"
    lapack = dependencies.get("lapack")
    if not isinstance(lapack, dict):
        return "numpy_linked_lapack_identity_unavailable"
    name = lapack.get("name")
    version = lapack.get("version")
    return f"{name or 'unknown'}:{version or 'unknown'}"


def _runtime_boundary() -> Mapping[str, object]:
    return MappingProxyType(
        {
            "pythonImplementation": python_implementation(),
            "pythonVersion": python_version(),
            "numpyVersion": np.__version__,
            "linkedLapackBuild": _lapack_build_identity(),
            "psdAlgorithm": (
                "numpy.linalg.eigvalsh_full_symmetric_spectrum_UPLO_lower"
            ),
            "psdInput": "central_symmetric_weighted_640_by_640_covariance",
            "acceptanceRule": "minimum_eigenvalue>=-1e-12_J2_per_m6",
            "justification": (
                "a_real_symmetric_covariance_is_PSD_exactly_when_its_smallest_"
                "eigenvalue_is_nonnegative;the_frozen_negative_tolerance_is_"
                "applied_to_the_direct_full_spectrum_result"
            ),
            "portabilityBoundary": (
                "deterministic_for_fixed_bytes_and_recorded_runtime;cross_"
                "LAPACK_bitwise_identity_not_asserted"
            ),
        }
    )


def _finite_fsum(values: Iterable[float]) -> float | None:
    try:
        result = fsum(values)
    except (OverflowError, ValueError):
        return None
    return result if isfinite(result) else None


def _binary64_bits(value: float) -> int:
    return unpack(">Q", pack(">d", value))[0]


def _issue_precedence(issue: ReplayIssue) -> tuple[int, int, int, str, str]:
    tokens = tuple(
        token
        for token in (issue.code + "/" + (issue.pointer or "")).replace(
            ":", "/"
        ).split("/")
        if token
    )
    family = next((item for item in FAMILIES if item in tokens), None)
    level_rank = next(
        (
            ordinal
            for ordinal, (level_id, _spacing) in enumerate(LEVELS)
            if level_id in tokens
        ),
        len(LEVELS),
    )
    issue_kind_rank = (
        0
        if issue.code == "smearing_weights_not_frozen_exact"
        else 1
        if issue.phase in {"smearing_weight_freeze", "smearing_normalization"}
        else 0
        if "target_echo" in issue.code
        else 1
        if "residual_echo" in issue.code
        else 2
        if issue.phase == "constraint_central"
        else 3
    )
    if issue.phase in {
        "receipt",
        "structure",
        "length",
        "decode",
        "negative_zero",
        "nonnegative_roles",
    }:
        rank = -1
    elif issue.phase == "finiteness":
        rank = 0
    elif issue.phase == "metric_demand":
        rank = 3 if "error_bound" in issue.code else 1
    elif issue.phase == "mean_metric_closure":
        rank = 2
    elif issue.phase == "smearing_weight_freeze":
        rank = 4
    elif issue.phase == "smearing_normalization":
        rank = 5
    elif issue.phase == "noise_exchange":
        rank = 6
    elif issue.phase == "noise_psd":
        rank = 7
    elif issue.phase == "noise_upper95":
        rank = 8
    elif issue.phase == "fluctuation_ratio":
        rank = 9
    elif issue.phase.startswith("constraint_"):
        rank = (
            10
            if family == "H_H"
            else 11
            if family == "H_Hi"
            else 12
            if family == "Hi_Hj"
            else 13
            if family == "antisymmetry"
            else 14
        )
    elif issue.phase == "regulator":
        rank = 15
        level_rank = FAMILIES.index(family) if family in FAMILIES else len(FAMILIES)
        issue_kind_rank = (
            0
            if "order_undefined" in issue.code
            else 1
            if "not_monotone" in issue.code
            else 2
            if "order_below" in issue.code
            else 3
            if "final_residual" in issue.code
            else 4
            if "final_error" in issue.code
            else 5
        )
    else:
        rank = 99
    return rank, level_rank, issue_kind_rank, issue.pointer or "", issue.code


def _normalized_pair_outcome(
    role: Mapping[str, object],
    disposition: str,
    tolerance_satisfied: Mapping[str, bool] | None = None,
    *,
    incomplete_after_observed_fail: bool = False,
) -> Mapping[str, object]:
    tolerance_ids = role["appliedToleranceIds"]
    assert type(tolerance_ids) is tuple
    applied_results = tuple(
        MappingProxyType(
            {
                "toleranceId": tolerance_id,
                "comparisonRelation": (
                    PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID[tolerance_id]
                ),
                "satisfied": (
                    tolerance_satisfied is not None
                    and tolerance_satisfied.get(tolerance_id) is True
                ),
            }
        )
        for tolerance_id in tolerance_ids
    )
    check_id = role["checkId"]
    assert type(check_id) is str
    if disposition == "pass":
        issue_codes: tuple[str, ...] = ()
    elif disposition == "blocked":
        issue_codes = (PAIR_CANONICAL_OUTCOME_ISSUE_CODES["blocked"],)
    else:
        issue_codes = (
            (
                PAIR_CANONICAL_OUTCOME_ISSUE_CODES.get(
                    check_id, PAIR_CANONICAL_OUTCOME_ISSUE_CODES["blocked"]
                ),
            )
            if not tolerance_ids
            else tuple(
                PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID[
                    result["toleranceId"]
                ]
                for result in applied_results
                if result["satisfied"] is not True
            )
        )
        if incomplete_after_observed_fail:
            issue_codes = (
                *issue_codes,
                PAIR_CANONICAL_OUTCOME_ISSUE_CODES["blocked"],
            )
    return MappingProxyType(
        {
            "ordinal": role["ordinal"],
            "checkId": check_id,
            "scopeId": role["scopeId"],
            "disposition": disposition,
            "appliedToleranceIds": tolerance_ids,
            "appliedToleranceResults": applied_results,
            "orderedIssueCodes": issue_codes,
        }
    )


def _independent_normalized_outcome_projection(
    issues: list[ReplayIssue], metrics: Mapping[str, object]
) -> tuple[Mapping[str, object], ...]:
    statuses: list[tuple[str, Mapping[str, bool] | None, bool]] = [
        ("blocked", None, False) for _unused in range(30)
    ]
    if "finiteness" in metrics:
        statuses[0] = ("pass", None, False)

    metric = metrics.get("metricDemand")
    if not isinstance(metric, Mapping):
        nondegeneracy = metrics.get("metricDemandNondegeneracy")
        error_enclosure = metrics.get("metricDemandErrorEnclosure")
        if isinstance(nondegeneracy, Mapping) and isinstance(
            error_enclosure, Mapping
        ):
            metric = MappingProxyType(
                {**dict(nondegeneracy), **dict(error_enclosure)}
            )
    if isinstance(metric, Mapping):
        minimum_satisfied = (
            type(metric.get("minimumFrobeniusLowerBoundSI")) is float
            and metric["minimumFrobeniusLowerBoundSI"]
            > MINIMUM_METRIC_DEMAND_FROBENIUS_SI
        )
        fraction_satisfied = (
            type(metric.get("qualifyingSampleFraction")) is float
            and metric["qualifyingSampleFraction"]
            >= REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION
        )
        tolerance_status = {
            "minimumMetricDemandFrobeniusSI": minimum_satisfied,
            "requiredMetricDemandSampleFraction": fraction_satisfied,
        }
        statuses[1] = (
            "pass" if all(tolerance_status.values()) else "fail",
            tolerance_status,
            False,
        )
        relative = metric.get("maximumRelativeErrorBound")
        relative_available = type(relative) is float and isfinite(relative)
        relative_satisfied = (
            relative_available and relative <= METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE
        )
        statuses[3] = (
            "pass" if relative_satisfied else "fail" if relative_available else "blocked",
            {"metricDemandRelativeErrorBound": relative_satisfied},
            False,
        )

    closure = metrics.get("meanMetricDemandClosure")
    if isinstance(closure, Mapping):
        closure_satisfied = closure.get("allSamplesWithinTolerance") is True
        statuses[2] = (
            "pass" if closure_satisfied else "fail",
            {
                "meanMetricDemandPointwiseRelativeUpper95": closure_satisfied,
                "meanNormalizationFloorSI": True,
            },
            False,
        )

    freeze = metrics.get("smearingWeightFreeze")
    if isinstance(freeze, Mapping):
        raw_exact = freeze.get("exactRawSha256Matched") is True
        bits = freeze.get("everyWeightBinary64BitsMatched")
        if not raw_exact or bits is False:
            statuses[4] = ("fail", None, False)
        elif bits is True:
            statuses[4] = ("pass", None, False)

    smearing = metrics.get("smearing")
    if not isinstance(smearing, Mapping):
        smearing = metrics.get("smearingNormalization")
    if isinstance(smearing, Mapping):
        normalization_satisfied = smearing.get("passed") is True
        statuses[5] = (
            "pass" if normalization_satisfied else "fail",
            {"smearingWeightSumAbsolute": normalization_satisfied},
            False,
        )

    noise = metrics.get("noise")
    if isinstance(noise, Mapping):
        exchange_satisfied = (
            type(noise.get("exchangeResidualUpper95SI")) is float
            and noise["exchangeResidualUpper95SI"] <= EXCHANGE_SYMMETRY_TOLERANCE_SI
        )
        statuses[6] = (
            "pass" if exchange_satisfied else "fail",
            {"exchangeSymmetryUpper95SI": exchange_satisfied},
            False,
        )
        psd_satisfied = noise.get("positiveSemidefiniteWithinTolerance") is True
        statuses[7] = (
            "pass" if psd_satisfied else "fail",
            {"psdNegativeEigenvalueSI": psd_satisfied},
            False,
        )
        maximum = noise.get("maximumEigenvalueUpper95SI")
        if type(maximum) is float and isfinite(maximum):
            statuses[8] = ("pass", None, False)
    else:
        exchange = metrics.get("exchangeSymmetry")
        if isinstance(exchange, Mapping):
            exchange_satisfied = (
                type(exchange.get("exchangeResidualUpper95SI")) is float
                and exchange["exchangeResidualUpper95SI"]
                <= EXCHANGE_SYMMETRY_TOLERANCE_SI
            )
            statuses[6] = (
                "pass" if exchange_satisfied else "fail",
                {"exchangeSymmetryUpper95SI": exchange_satisfied},
                False,
            )
        psd = metrics.get("psd")
        if isinstance(psd, Mapping):
            psd_satisfied = psd.get("positiveSemidefiniteWithinTolerance") is True
            statuses[7] = (
                "pass" if psd_satisfied else "fail",
                {"psdNegativeEigenvalueSI": psd_satisfied},
                False,
            )
        maximum = metrics.get("maximumEigenvalueUpper95")
        if (
            isinstance(maximum, Mapping)
            and type(maximum.get("maximumEigenvalueUpper95SI")) is float
            and isfinite(maximum["maximumEigenvalueUpper95SI"])
        ):
            statuses[8] = ("pass", None, False)

    fluctuation = metrics.get("meanAndFluctuation")
    if not isinstance(fluctuation, Mapping):
        fluctuation = metrics.get("fluctuationRatio")
    if isinstance(fluctuation, Mapping):
        ratio = fluctuation.get("fluctuationToMeanRatioUpper95")
        ratio_satisfied = (
            type(ratio) is float
            and ratio <= FLUCTUATION_TO_MEAN_RATIO_TOLERANCE
        )
        statuses[9] = (
            "pass" if ratio_satisfied else "fail",
            {
                "fluctuationToMeanRatioUpper95": ratio_satisfied,
                "meanNormalizationFloorSI": True,
            },
            False,
        )

    constraint_metrics = metrics.get("constraintResiduals")
    if type(constraint_metrics) is not tuple:
        ordered_constraints = (
            metrics.get("bracketResidual"),
            metrics.get("antisymmetry"),
            metrics.get("jacobi"),
        )
        if all(type(entries) is tuple for entries in ordered_constraints):
            constraint_metrics = tuple(
                entry
                for entries in ordered_constraints
                for entry in entries
            )
    if type(constraint_metrics) is tuple:
        by_scope = {
            f"{entry['levelId']}.{entry['familyId']}": entry
            for entry in constraint_metrics
            if isinstance(entry, Mapping)
        }
        for ordinal in range(10, 25):
            role = PAIR_OUTCOME_ROLES[ordinal]
            scope_id = role["scopeId"]
            assert type(scope_id) is str
            entry = by_scope.get(scope_id)
            if entry is None:
                continue
            residual_echo = entry.get("submittedResidualEchoMismatchLInf")
            target_echo = entry.get("submittedTargetEchoMismatchLInf")
            float64_satisfied = (
                type(residual_echo) is float
                and residual_echo <= FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE
                and (
                    target_echo is None
                    or (
                        type(target_echo) is float
                        and target_echo <= FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE
                    )
                )
            )
            tolerance_status = {
                "float64RecomputeAbsolute": float64_satisfied,
            }
            tolerance_ids = role["appliedToleranceIds"]
            assert type(tolerance_ids) is tuple
            if len(tolerance_ids) == 2:
                residual_upper95 = entry.get("residualUpper95")
                tolerance_id = tolerance_ids[0]
                tolerance = (
                    BRACKET_RESIDUAL_UPPER95_TOLERANCE
                    if tolerance_id == "bracketResidualUpper95"
                    else ANTISYMMETRY_RESIDUAL_UPPER95_TOLERANCE
                    if tolerance_id == "antisymmetryResidualUpper95"
                    else JACOBI_RESIDUAL_UPPER95_TOLERANCE
                )
                tolerance_status[tolerance_id] = (
                    type(residual_upper95) is float
                    and residual_upper95 <= tolerance
                )
            satisfied = all(
                tolerance_status.get(tolerance_id) is True
                for tolerance_id in tolerance_ids
            )
            statuses[ordinal] = (
                "pass" if satisfied else "fail",
                tolerance_status,
                False,
            )

    regulator_metrics = metrics.get("regulatorFamilies")
    if type(regulator_metrics) is not tuple:
        regulator_metrics = metrics.get("regulatorConvergence")
    if type(regulator_metrics) is tuple:
        by_family = {
            entry["familyId"]: entry
            for entry in regulator_metrics
            if isinstance(entry, Mapping)
        }
        for ordinal in range(25, 30):
            role = PAIR_OUTCOME_ROLES[ordinal]
            family_id = role["scopeId"]
            entry = by_family.get(family_id)
            if entry is None:
                continue
            residual_satisfied = (
                type(entry.get("finalResidualUpper95")) is float
                and entry["finalResidualUpper95"]
                <= REGULATOR_FINAL_RESIDUAL_UPPER95_TOLERANCE
            )
            final_error_satisfied = (
                type(entry.get("finalRegulatorErrorUpper95")) is float
                and entry["finalRegulatorErrorUpper95"]
                <= REGULATOR_FINAL_ERROR_UPPER95_TOLERANCE
            )
            monotone = entry.get("monotone") is True
            order = entry.get("pLower")
            order_available = type(order) is float and isfinite(order)
            order_satisfied = (
                order_available and order >= MINIMUM_REGULATOR_CONVERGENCE_ORDER
            )
            tolerance_status = {
                "regulatorResidualUpper95": residual_satisfied,
                "finalRegulatorErrorUpper95Tolerance": final_error_satisfied,
                "regulatorMonotonicityAbsolute": monotone,
                "minimumRegulatorConvergenceOrder": order_satisfied,
            }
            definitive_failure = (
                not residual_satisfied
                or not final_error_satisfied
                or not monotone
                or (order_available and not order_satisfied)
            )
            statuses[ordinal] = (
                "fail"
                if definitive_failure
                else "pass"
                if order_available
                else "blocked",
                tolerance_status,
                definitive_failure and not order_available,
            )

    return tuple(
        _normalized_pair_outcome(
            role,
            statuses[ordinal][0],
            statuses[ordinal][1],
            incomplete_after_observed_fail=statuses[ordinal][2],
        )
        for ordinal, role in enumerate(PAIR_OUTCOME_ROLES)
    )


def _result(
    receipt: object,
    issues: list[ReplayIssue],
    metrics: dict[str, object],
    *,
    calculation_complete: bool,
) -> ReplayResult:
    failed = any(issue.disposition == "fail" for issue in issues)
    issues = sorted(
        issues,
        key=lambda issue: (
            1 if failed and issue.disposition == "blocked" else 0,
            *_issue_precedence(issue),
        ),
    )
    blocked = any(issue.disposition == "blocked" for issue in issues)
    disposition = "fail" if failed else "blocked" if blocked else "pass"
    candidate_disposition = (
        "fail_frozen_candidate_without_retuning"
        if failed
        else "blocked_without_candidate_result"
        if blocked
        else "authority_neutral_diagnostic_calculation_pass"
    )
    raw_closure = None
    if raw_inventory.has_private_admitted_inventory(receipt):
        admitted_closure = receipt.raw_hash_closure_sha256
        if type(admitted_closure) is str and len(admitted_closure) == 64:
            raw_closure = admitted_closure
    return ReplayResult(
        artifact_id=REPLAY_ARTIFACT_ID,
        contract_version=REPLAY_CONTRACT_VERSION,
        implementation_role="independent",
        source_disjoint=True,
        diagnostic_only=True,
        calculation_complete=calculation_complete and not blocked,
        calculation_disposition=disposition,
        candidate_disposition=candidate_disposition,
        retuning_permitted=False,
        first_issue=None if not issues else issues[0].code,
        issues=tuple(issues),
        raw_hash_closure_sha256=raw_closure,
        approved_policy=APPROVED_POLICY,
        constraint_arithmetic_policy=CONSTRAINT_ARITHMETIC_POLICY,
        required_check_order=REQUIRED_CHECK_ORDER,
        normalized_outcome_projection=_independent_normalized_outcome_projection(
            issues, metrics
        ),
        numerical_runtime_boundary=_runtime_boundary(),
        metrics=MappingProxyType(dict(metrics)),
        authority_blockers=_AUTHORITY_BLOCKERS,
        authority_boundary=_AUTHORITY_BOUNDARY,
    )


def _blocked(
    receipt: object,
    code: str,
    phase: str,
    pointer: str | None,
    detail: str,
    metrics: dict[str, object] | None = None,
    prior_issues: list[ReplayIssue] | tuple[ReplayIssue, ...] = (),
) -> ReplayResult:
    return _result(
        receipt,
        [*prior_issues, ReplayIssue(code, phase, pointer, detail, "blocked")],
        {} if metrics is None else metrics,
        calculation_complete=False,
    )


def _add_fail(
    issues: list[ReplayIssue],
    code: str,
    phase: str,
    pointer: str | None,
    detail: str,
) -> None:
    if not any(issue.code == code for issue in issues):
        issues.append(ReplayIssue(code, phase, pointer, detail, "fail"))


def _validate_auxiliary_shape(
    receipt: object,
    auxiliary: object,
    metrics: dict[str, object],
    prior_issues: list[ReplayIssue],
) -> ReplayResult | None:
    def reject(
        code: str, phase: str, pointer: str | None, detail: str
    ) -> ReplayResult:
        return _blocked(
            receipt,
            code,
            phase,
            pointer,
            detail,
            metrics,
            prior_issues=prior_issues,
        )

    if type(auxiliary) is not AuxiliaryFrozenInputs:
        return reject(
            "auxiliary_shape_invalid",
            "structure",
            None,
            "Auxiliary input must be the exact frozen dataclass type.",
        )
    if (
        type(auxiliary.contract_version) is not str
        or len(auxiliary.contract_version) != len(AUXILIARY_CONTRACT_VERSION)
        or auxiliary.contract_version != AUXILIARY_CONTRACT_VERSION
    ):
        return reject(
            "auxiliary_contract_version_mismatch",
            "structure",
            "/contract_version",
            "Auxiliary contract version mismatch.",
        )
    if (
        type(auxiliary.candidate_id) is not str
        or len(auxiliary.candidate_id) != len(CANDIDATE_ID)
        or auxiliary.candidate_id != CANDIDATE_ID
    ):
        return reject(
            "auxiliary_candidate_mismatch",
            "structure",
            "/candidate_id",
            "Auxiliary candidate identity mismatch.",
        )
    if (
        type(auxiliary.metric_demand_rset_si) is not tuple
        or len(auxiliary.metric_demand_rset_si) != SAMPLE_COUNT * TENSOR_COMPONENT_COUNT
    ):
        return reject(
            "auxiliary_length_mismatch",
            "length",
            "/metric_demand_rset_si",
            "Metric demand must contain exactly 640 binary64 values.",
        )
    if (
        type(auxiliary.metric_demand_absolute_error_bound_si) is not tuple
        or len(auxiliary.metric_demand_absolute_error_bound_si)
        != SAMPLE_COUNT * TENSOR_COMPONENT_COUNT
    ):
        return reject(
            "auxiliary_length_mismatch",
            "length",
            "/metric_demand_absolute_error_bound_si",
            "Metric error bound must contain exactly 640 binary64 values.",
        )
    targets = auxiliary.server_recomputed_classical_targets
    if type(targets) is not tuple or len(targets) != len(TARGET_ORDER):
        return reject(
            "auxiliary_target_inventory_mismatch",
            "length",
            "/server_recomputed_classical_targets",
            "Exactly nine ordered classical target arrays are required.",
        )
    for target_ordinal, ((level_id, family_id), target) in enumerate(
        zip(TARGET_ORDER, targets, strict=True)
    ):
        pointer = f"/server_recomputed_classical_targets/{target_ordinal}"
        if type(target) is not ClassicalTargetArray:
            return reject(
                "auxiliary_target_shape_invalid",
                "structure",
                pointer,
                "Target entry must be the exact frozen dataclass type.",
            )
        if not all(
            type(observed) is str
            and len(observed) == len(expected)
            and observed == expected
            for observed, expected in (
                (target.level_id, level_id),
                (target.family_id, family_id),
                (target.origin, CLASSICAL_TARGET_ORIGIN),
            )
        ):
            return reject(
                "auxiliary_target_descriptor_mismatch",
                "structure",
                pointer,
                "Target level, family, or calculation-origin tag mismatch.",
            )
        if type(target.values) is not tuple or len(target.values) != 256:
            return reject(
                "auxiliary_length_mismatch",
                "length",
                f"{pointer}/values",
                "Each classical target must contain exactly 256 values.",
            )
    numeric_sequences = (
        auxiliary.metric_demand_rset_si,
        auxiliary.metric_demand_absolute_error_bound_si,
        *(target.values for target in targets),
    )
    if any(
        type(value) is not float
        for sequence in numeric_sequences
        for value in sequence
    ):
        return reject(
            "auxiliary_value_type_invalid",
            "structure",
            None,
            "Every auxiliary numerical value must be an exact built-in float.",
        )
    return None


def _validate_admitted_receipt(receipt: object) -> ReplayResult | None:
    if not raw_inventory.has_private_admitted_inventory(receipt):
        return _blocked(
            receipt,
            "admitted_receipt_invalid",
            "receipt",
            None,
            "An accepted exact independent raw-inventory receipt is required.",
        )
    artifact_id = receipt.artifact_id
    contract_version = receipt.contract_version
    disposition = receipt.disposition
    candidate_id = receipt.candidate_id
    closure = receipt.raw_hash_closure_sha256
    blockers = receipt.blockers
    bindings = receipt.raw_hash_bindings
    if (
        type(artifact_id) is not str
        or len(artifact_id) != len(raw_inventory.RECEIPT_ARTIFACT_ID)
        or artifact_id != raw_inventory.RECEIPT_ARTIFACT_ID
        or type(contract_version) is not str
        or len(contract_version) != len(raw_inventory.RECEIPT_CONTRACT_VERSION)
        or contract_version != raw_inventory.RECEIPT_CONTRACT_VERSION
        or receipt.server_owned is not True
        or receipt.independent_implementation is not True
        or receipt.diagnostic_only is not True
        or receipt.calculation_only is not True
        or type(disposition) is not str
        or len(disposition) != len("accepted")
        or disposition != "accepted"
        or receipt.calculation_ready is not True
        or type(candidate_id) is not str
        or len(candidate_id) != len(CANDIDATE_ID)
        or candidate_id != CANDIDATE_ID
        or receipt.first_blocker is not None
        or type(blockers) is not tuple
        or len(blockers) != 0
        or type(closure) is not str
        or len(closure) != 64
        or any(
            character not in "0123456789abcdef"
            for character in closure
        )
        or type(bindings) is not tuple
        or len(bindings) != 68
        or receipt.authority_boundary is not raw_inventory._AUTHORITY_BOUNDARY
    ):
        return _blocked(
            receipt,
            "admitted_receipt_invalid",
            "receipt",
            None,
            "An accepted exact independent raw-inventory receipt is required.",
        )
    for ordinal, expected_length in enumerate(_EXPECTED_RAW_LENGTHS):
        observed_length = raw_inventory.get_admitted_float64_length(receipt, ordinal)
        if observed_length != expected_length:
            return _blocked(
                receipt,
                "admitted_raw_length_mismatch",
                "length",
                f"/files/{ordinal}",
                "Private admitted bytes do not have the frozen element count.",
            )
    return None


def _decode_admitted_inventory(
    receipt: object,
    metrics: dict[str, object],
    prior_issues: list[ReplayIssue],
) -> tuple[tuple[np.ndarray, ...] | None, ReplayResult | None]:
    arrays: list[np.ndarray] = []
    try:
        for ordinal, expected_length in enumerate(_EXPECTED_RAW_LENGTHS):
            decoded = np.fromiter(
                (
                    raw_inventory.read_admitted_float64(receipt, ordinal, index)
                    for index in range(expected_length)
                ),
                dtype=np.float64,
                count=expected_length,
            )
            if decoded.size != expected_length:
                raise ValueError("decoded length mismatch")
            decoded.setflags(write=False)
            arrays.append(decoded)
    except (TypeError, ValueError, OverflowError):
        return None, _blocked(
            receipt,
            "admitted_raw_decode_failed",
            "decode",
            None,
            "The private admitted-byte capability could not decode every value.",
            metrics,
            prior_issues=prior_issues,
        )
    return tuple(arrays), None


def _first_invalid_value(
    arrays: tuple[np.ndarray, ...],
    auxiliary: AuxiliaryFrozenInputs,
) -> tuple[str, str, str] | None:
    auxiliary_arrays = (
        (
            "/metric_demand_rset_si",
            np.asarray(auxiliary.metric_demand_rset_si, dtype=np.float64),
        ),
        (
            "/metric_demand_absolute_error_bound_si",
            np.asarray(
                auxiliary.metric_demand_absolute_error_bound_si,
                dtype=np.float64,
            ),
        ),
        *tuple(
            (
                f"/server_recomputed_classical_targets/{ordinal}/values",
                np.asarray(target.values, dtype=np.float64),
            )
            for ordinal, target in enumerate(
                auxiliary.server_recomputed_classical_targets
            )
        ),
    )
    all_arrays = tuple(
        (f"/files/{ordinal}", array) for ordinal, array in enumerate(arrays)
    ) + auxiliary_arrays
    for pointer, array in all_arrays:
        positions = np.flatnonzero(~np.isfinite(array))
        if positions.size:
            return (
                "input_nonfinite",
                f"{pointer}/{int(positions[0])}",
                "Every raw and auxiliary value must be finite.",
            )
    for pointer, array in all_arrays:
        positions = np.flatnonzero((array == 0.0) & np.signbit(array))
        if positions.size:
            return (
                "input_negative_zero",
                f"{pointer}/{int(positions[0])}",
                "Negative zero is forbidden in every numerical input.",
            )
    nonnegative_arrays = tuple(
        (f"/files/{ordinal}", arrays[ordinal])
        for ordinal in _NONNEGATIVE_RAW_ORDINALS
    ) + (
        (
            "/metric_demand_absolute_error_bound_si",
            auxiliary_arrays[1][1],
        ),
    )
    for pointer, array in nonnegative_arrays:
        positions = np.flatnonzero(array < 0.0)
        if positions.size:
            return (
                "input_nonnegative_role_negative",
                f"{pointer}/{int(positions[0])}",
                "An uncertainty, error-bound, or weight input was negative.",
            )
    return None


def _frobenius_rows(values: np.ndarray) -> np.ndarray:
    multiplicities = np.asarray(SYMMETRIC_TENSOR_MULTIPLICITIES)
    with np.errstate(over="ignore", invalid="ignore", under="ignore"):
        return np.sqrt(np.sum(values * values * multiplicities, axis=1))


def _constraint_array(
    arrays: tuple[np.ndarray, ...], level_id: str, family_id: str, role: str
) -> np.ndarray:
    ordinal = _ORDINAL_BY_ROLE[
        f"constraint_operand.{level_id}.{family_id}.{role}"
    ]
    return arrays[ordinal]


def replay_science(
    receipt: object, auxiliary: object
) -> ReplayResult:
    """Recompute the frozen calculation without granting replay authority."""

    receipt_failure = _validate_admitted_receipt(receipt)
    if receipt_failure is not None:
        return receipt_failure
    issues: list[ReplayIssue] = []
    metrics: dict[str, object] = {}

    smearing_weight_raw_sha256 = raw_inventory.get_admitted_raw_sha256(
        receipt, 4
    )
    if smearing_weight_raw_sha256 is None:
        return _blocked(
            receipt,
            "admitted_raw_hash_unavailable",
            "receipt",
            "/files/4",
            "The private admitted-byte capability could not rehash the weights.",
            metrics,
            prior_issues=issues,
        )
    smearing_weight_hash_exact = (
        smearing_weight_raw_sha256 == SMEARING_WEIGHT_RAW_SHA256
    )
    metrics["smearingWeightFreeze"] = MappingProxyType(
        {
            "exactRawSha256Matched": smearing_weight_hash_exact,
            "everyWeightBinary64BitsMatched": None,
            "expectedRawSha256": SMEARING_WEIGHT_RAW_SHA256,
            "expectedBinary64Bits": f"{SMEARING_WEIGHT_BINARY64_BITS:016x}",
            "passed": False if not smearing_weight_hash_exact else None,
        }
    )
    if not smearing_weight_hash_exact:
        _add_fail(
            issues,
            "smearing_weights_not_frozen_exact",
            "smearing_weight_freeze",
            "/files/4",
            "The admitted 512-byte smearing file must match the frozen raw SHA-256 before float decoding.",
        )

    auxiliary_failure = _validate_auxiliary_shape(
        receipt, auxiliary, metrics, issues
    )
    if auxiliary_failure is not None:
        return auxiliary_failure
    assert type(auxiliary) is AuxiliaryFrozenInputs

    arrays, decode_failure = _decode_admitted_inventory(
        receipt, metrics, issues
    )
    if decode_failure is not None:
        return decode_failure
    assert arrays is not None

    weights = arrays[4]
    smearing_weight_bits_exact = all(
        _binary64_bits(float(value)) == SMEARING_WEIGHT_BINARY64_BITS
        for value in weights
    )
    metrics["smearingWeightFreeze"] = MappingProxyType(
        {
            "exactRawSha256Matched": smearing_weight_hash_exact,
            "everyWeightBinary64BitsMatched": smearing_weight_bits_exact,
            "expectedRawSha256": SMEARING_WEIGHT_RAW_SHA256,
            "expectedBinary64Bits": f"{SMEARING_WEIGHT_BINARY64_BITS:016x}",
            "passed": smearing_weight_hash_exact and smearing_weight_bits_exact,
        }
    )
    if not smearing_weight_bits_exact:
        _add_fail(
            issues,
            "smearing_weights_not_frozen_exact",
            "smearing_weight_freeze",
            "/files/4",
            "The decoded smearing file must contain 64 exact binary64 copies of 1/64.",
        )

    invalid = _first_invalid_value(arrays, auxiliary)
    if invalid is not None:
        code, pointer, detail = invalid
        phase = (
            "finiteness"
            if code == "input_nonfinite"
            else "negative_zero"
            if code == "input_negative_zero"
            else "nonnegative_roles"
        )
        return _blocked(
            receipt,
            code,
            phase,
            pointer,
            detail,
            metrics,
            prior_issues=issues,
        )

    metrics["finiteness"] = MappingProxyType(
        {
            "exactRawElementLengthsVerified": True,
            "everyRawAndAuxiliaryValueFinite": True,
            "negativeZeroAbsent": True,
            "nonnegativeRolesVerified": True,
        }
    )
    noise = arrays[0].reshape(SAMPLE_COUNT, SAMPLE_COUNT, 10, 10)
    noise_u95 = arrays[1].reshape(SAMPLE_COUNT, SAMPLE_COUNT, 10, 10)
    mean = arrays[2].reshape(SAMPLE_COUNT, TENSOR_COMPONENT_COUNT)
    mean_u95 = arrays[3].reshape(SAMPLE_COUNT, TENSOR_COMPONENT_COUNT)
    metric_demand = np.asarray(
        auxiliary.metric_demand_rset_si, dtype=np.float64
    ).reshape(SAMPLE_COUNT, TENSOR_COMPONENT_COUNT)
    metric_error = np.asarray(
        auxiliary.metric_demand_absolute_error_bound_si, dtype=np.float64
    ).reshape(SAMPLE_COUNT, TENSOR_COMPONENT_COUNT)

    demand_norm = _frobenius_rows(metric_demand)
    error_norm = _frobenius_rows(metric_error)
    demand_lower = np.maximum(0.0, demand_norm - error_norm)
    if not all(
        bool(np.all(np.isfinite(value)))
        for value in (demand_norm, error_norm, demand_lower)
    ):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "metric_demand",
            None,
            "Metric-demand Frobenius arithmetic overflowed.",
            metrics,
            prior_issues=issues,
        )
    qualifying = demand_lower > MINIMUM_METRIC_DEMAND_FROBENIUS_SI
    qualifying_count = int(np.count_nonzero(qualifying))
    qualifying_fraction = qualifying_count / SAMPLE_COUNT
    strictly_nondegenerate = (
        bool(np.all(qualifying))
        and qualifying_fraction >= REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION
    )
    if not strictly_nondegenerate:
        _add_fail(
            issues,
            "metric_demand_degenerate",
            "metric_demand",
            None,
            "Every error-subtracted pointwise demand must exceed the floor.",
        )
    relative_error = np.zeros(SAMPLE_COUNT, dtype=np.float64)
    nonzero_demand = demand_norm > 0.0
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        relative_error[nonzero_demand] = (
            error_norm[nonzero_demand] / demand_norm[nonzero_demand]
        )
    relative_error_defined = bool(np.all(nonzero_demand))
    relative_error_finite = bool(
        np.all(np.isfinite(relative_error[nonzero_demand]))
    )
    if not relative_error_finite:
        metrics["metricDemand"] = MappingProxyType(
            {
                "minimumFrobeniusSI": float(np.min(demand_norm)),
                "maximumFrobeniusSI": float(np.max(demand_norm)),
                "minimumFrobeniusLowerBoundSI": float(np.min(demand_lower)),
                "maximumDeterministicErrorFrobeniusSI": float(
                    np.max(error_norm)
                ),
                "minimumRequiredFrobeniusSI": (
                    MINIMUM_METRIC_DEMAND_FROBENIUS_SI
                ),
                "qualifyingSampleCount": qualifying_count,
                "qualifyingSampleFraction": qualifying_fraction,
                "requiredSampleFraction": REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION,
                "strictlyNondegenerate": strictly_nondegenerate,
                "maximumRelativeErrorBound": None,
                "relativeErrorDefinedAtEveryPoint": relative_error_defined,
                "relativeErrorTolerance": METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE,
            }
        )
        return _blocked(
            receipt,
            "derived_nonfinite:metric_demand_error_bound_ratio",
            "metric_demand",
            "/metric_demand_absolute_error_bound_si",
            "A finite-input pointwise demand-error ratio overflowed binary64.",
            metrics,
            prior_issues=issues,
        )
    maximum_relative_error = (
        float(np.max(relative_error)) if relative_error_defined else None
    )
    metrics["metricDemand"] = MappingProxyType(
        {
            "minimumFrobeniusSI": float(np.min(demand_norm)),
            "maximumFrobeniusSI": float(np.max(demand_norm)),
            "minimumFrobeniusLowerBoundSI": float(np.min(demand_lower)),
            "maximumDeterministicErrorFrobeniusSI": float(np.max(error_norm)),
            "minimumRequiredFrobeniusSI": MINIMUM_METRIC_DEMAND_FROBENIUS_SI,
            "qualifyingSampleCount": qualifying_count,
            "qualifyingSampleFraction": qualifying_fraction,
            "requiredSampleFraction": REQUIRED_METRIC_DEMAND_SAMPLE_FRACTION,
            "strictlyNondegenerate": strictly_nondegenerate,
            "maximumRelativeErrorBound": maximum_relative_error,
            "relativeErrorDefinedAtEveryPoint": relative_error_defined,
            "relativeErrorTolerance": METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE,
        }
    )
    if (
        maximum_relative_error is None
        or maximum_relative_error > METRIC_DEMAND_RELATIVE_ERROR_TOLERANCE
    ):
        _add_fail(
            issues,
            "metric_demand_error_bound_exceeds_tolerance",
            "metric_demand",
            None,
            "A pointwise deterministic demand-error ratio exceeds 0.01.",
        )

    with np.errstate(over="ignore", invalid="ignore"):
        closure_components = np.abs(mean - metric_demand) + mean_u95 + metric_error
    closure_numerator = _frobenius_rows(closure_components)
    closure_denominator = np.maximum(demand_lower, MEAN_NORMALIZATION_FLOOR_SI)
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        closure_relative = closure_numerator / closure_denominator
    if not all(
        bool(np.all(np.isfinite(value)))
        for value in (closure_components, closure_numerator, closure_relative)
    ):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "mean_metric_closure",
            None,
            "Mean/metric closure arithmetic overflowed.",
            metrics,
            prior_issues=issues,
        )
    closure_argmax = int(np.argmax(closure_relative))
    closure_pass_count = int(
        np.count_nonzero(
            closure_relative <= MEAN_METRIC_DEMAND_RELATIVE_UPPER95_TOLERANCE
        )
    )
    closure_pass = closure_pass_count == SAMPLE_COUNT
    metrics["meanMetricDemandClosure"] = MappingProxyType(
        {
            "maximumPointwiseRelativeUpper95": float(
                closure_relative[closure_argmax]
            ),
            "argmaxPointIndex": closure_argmax,
            "residualFrobeniusUpper95AtWorstPointSI": float(
                closure_numerator[closure_argmax]
            ),
            "denominatorAtWorstPointSI": float(
                closure_denominator[closure_argmax]
            ),
            "passingSampleCount": closure_pass_count,
            "requiredPassingSampleCount": SAMPLE_COUNT,
            "relativeUpper95Tolerance": (
                MEAN_METRIC_DEMAND_RELATIVE_UPPER95_TOLERANCE
            ),
            "allSamplesWithinTolerance": closure_pass,
        }
    )
    if not closure_pass:
        _add_fail(
            issues,
            "mean_metric_demand_closure_exceeds_tolerance",
            "mean_metric_closure",
            None,
            "At least one pointwise mean/demand upper bound exceeds 0.1.",
        )

    weight_sum = _finite_fsum(float(value) for value in weights)
    if weight_sum is None:
        metrics["smearing"] = MappingProxyType(
            {
                "weightSum": None,
                "absoluteNormalizationError": None,
                "tolerance": SMEARING_WEIGHT_SUM_TOLERANCE,
                "nonnegative": True,
                "passed": False,
            }
        )
        return _blocked(
            receipt,
            "derived_nonfinite:smearing_weight_sum",
            "smearing_normalization",
            "/files/4",
            "The exact finite-input smearing reduction overflowed binary64.",
            metrics,
            prior_issues=issues,
        )
    weight_error = abs(weight_sum - 1.0)
    if not isfinite(weight_error):
        metrics["smearing"] = MappingProxyType(
            {
                "weightSum": weight_sum,
                "absoluteNormalizationError": None,
                "tolerance": SMEARING_WEIGHT_SUM_TOLERANCE,
                "nonnegative": True,
                "passed": False,
            }
        )
        return _blocked(
            receipt,
            "derived_nonfinite:smearing_normalization_error",
            "smearing_normalization",
            "/files/4",
            "The smearing normalization error is nonfinite.",
            metrics,
            prior_issues=issues,
        )
    metrics["smearing"] = MappingProxyType(
        {
            "weightSum": weight_sum,
            "absoluteNormalizationError": weight_error,
            "tolerance": SMEARING_WEIGHT_SUM_TOLERANCE,
            "nonnegative": True,
            "passed": weight_error <= SMEARING_WEIGHT_SUM_TOLERANCE,
        }
    )
    if weight_error > SMEARING_WEIGHT_SUM_TOLERANCE:
        _add_fail(
            issues,
            "smearing_weight_normalization_exceeds_tolerance",
            "smearing_normalization",
            "/files/4",
            "The frozen nonnegative smearing weights do not sum to one.",
        )

    noise_transpose = noise.transpose(1, 0, 3, 2)
    uncertainty_transpose = noise_u95.transpose(1, 0, 3, 2)
    with np.errstate(over="ignore", invalid="ignore"):
        exchange_upper95 = (
            np.abs(noise - noise_transpose) + noise_u95 + uncertainty_transpose
        )
    diagonal = np.arange(COVARIANCE_DIMENSION)
    exchange_matrix = exchange_upper95.transpose(0, 2, 1, 3).reshape(
        COVARIANCE_DIMENSION, COVARIANCE_DIMENSION
    )
    exchange_matrix[diagonal, diagonal] = 0.0
    exchange_residual_upper95 = float(np.max(exchange_matrix))
    if not isfinite(exchange_residual_upper95):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "noise_exchange",
            None,
            "Noise exchange-symmetry arithmetic overflowed.",
            metrics,
            prior_issues=issues,
        )
    if exchange_residual_upper95 > EXCHANGE_SYMMETRY_TOLERANCE_SI:
        _add_fail(
            issues,
            "noise_exchange_symmetry_exceeds_tolerance",
            "noise_exchange",
            None,
            "The raw bilocal/component exchange upper bound exceeds 1e-12.",
        )

    multiplicities = np.asarray(SYMMETRIC_TENSOR_MULTIPLICITIES)
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        weighted_basis_square = (
            weights[:, np.newaxis] * multiplicities[np.newaxis, :]
        ).reshape(-1)
    if not np.all(np.isfinite(weighted_basis_square)):
        return _blocked(
            receipt,
            "derived_nonfinite:covariance_basis_weighting",
            "noise_psd",
            "/files/4",
            "Finite smearing weights overflowed the covariance basis weighting.",
            metrics,
            prior_issues=issues,
        )
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        diagonal_basis = np.sqrt(weighted_basis_square)
    if not np.all(np.isfinite(diagonal_basis)):
        return _blocked(
            receipt,
            "derived_nonfinite:covariance_basis_square_root",
            "noise_psd",
            "/files/4",
            "The covariance basis square root is nonfinite.",
            metrics,
            prior_issues=issues,
        )
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        basis_outer = np.multiply.outer(diagonal_basis, diagonal_basis)
    if not np.all(np.isfinite(basis_outer)):
        return _blocked(
            receipt,
            "derived_nonfinite:covariance_basis_outer_product",
            "noise_psd",
            "/files/4",
            "The covariance basis outer product is nonfinite.",
            metrics,
            prior_issues=issues,
        )
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        symmetric_noise = 0.5 * (noise + noise_transpose)
    if not np.all(np.isfinite(symmetric_noise)):
        return _blocked(
            receipt,
            "derived_nonfinite:noise_symmetrization",
            "noise_psd",
            "/files/0",
            "Finite noise inputs overflowed the exchange symmetrization.",
            metrics,
            prior_issues=issues,
        )
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        central_covariance = (
            symmetric_noise.transpose(0, 2, 1, 3).reshape(
                COVARIANCE_DIMENSION, COVARIANCE_DIMENSION
            )
            * basis_outer
        )
    if not np.all(np.isfinite(central_covariance)):
        return _blocked(
            receipt,
            "derived_nonfinite:central_covariance_weighting",
            "noise_psd",
            None,
            "Weighted covariance construction overflowed.",
            metrics,
            prior_issues=issues,
        )
    with np.errstate(
        over="ignore", invalid="ignore", divide="ignore", under="ignore"
    ):
        central_covariance = 0.5 * (
            central_covariance + central_covariance.T
        )
    if not np.all(np.isfinite(central_covariance)):
        return _blocked(
            receipt,
            "derived_nonfinite:central_covariance_symmetrization",
            "noise_psd",
            None,
            "Finite weighted covariance entries overflowed symmetrization.",
            metrics,
            prior_issues=issues,
        )
    try:
        eigenvalues = np.linalg.eigvalsh(central_covariance, UPLO="L")
    except np.linalg.LinAlgError:
        return _blocked(
            receipt,
            "psd_eigensolver_failed",
            "noise_psd",
            None,
            "The recorded NumPy/LAPACK symmetric eigensolver did not converge.",
            metrics,
            prior_issues=issues,
        )
    if not np.all(np.isfinite(eigenvalues)):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "noise_psd",
            None,
            "The full covariance eigenspectrum contains a nonfinite value.",
            metrics,
            prior_issues=issues,
        )
    minimum_eigenvalue = float(eigenvalues[0])
    maximum_central_eigenvalue = float(eigenvalues[-1])
    psd_pass = minimum_eigenvalue >= -PSD_NEGATIVE_EIGENVALUE_TOLERANCE_SI
    if not psd_pass:
        _add_fail(
            issues,
            "noise_covariance_not_psd_within_tolerance",
            "noise_psd",
            None,
            "The direct minimum covariance eigenvalue is below -1e-12.",
        )

    with np.errstate(over="ignore", invalid="ignore"):
        uncertainty_radius = (
            0.5
            * (
                noise_u95
                + uncertainty_transpose
                + np.abs(noise - noise_transpose)
            )
        ).transpose(0, 2, 1, 3).reshape(
            COVARIANCE_DIMENSION, COVARIANCE_DIMENSION
        ) * basis_outer
        absolute_interval_matrix = np.abs(central_covariance) + uncertainty_radius
        off_diagonal_radius = (
            np.sum(absolute_interval_matrix, axis=1)
            - np.diag(absolute_interval_matrix)
        )
        eigenvalue_upper_rows = (
            np.diag(central_covariance)
            + np.diag(uncertainty_radius)
            + off_diagonal_radius
        )
    if not all(
        bool(np.all(np.isfinite(value)))
        for value in (
            uncertainty_radius,
            off_diagonal_radius,
            eigenvalue_upper_rows,
        )
    ):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "noise_upper95",
            None,
            "The covariance uncertainty/Gershgorin enclosure overflowed.",
            metrics,
            prior_issues=issues,
        )
    maximum_eigenvalue_upper95 = max(0.0, float(np.max(eigenvalue_upper_rows)))
    metrics["noise"] = MappingProxyType(
        {
            "sampleCount": SAMPLE_COUNT,
            "covarianceDimension": COVARIANCE_DIMENSION,
            "exchangeResidualUpper95SI": exchange_residual_upper95,
            "exchangeToleranceSI": EXCHANGE_SYMMETRY_TOLERANCE_SI,
            "minimumCentralEigenvalueSI": minimum_eigenvalue,
            "maximumCentralEigenvalueSI": maximum_central_eigenvalue,
            "psdToleranceSI": PSD_NEGATIVE_EIGENVALUE_TOLERANCE_SI,
            "positiveSemidefiniteWithinTolerance": psd_pass,
            "maximumEigenvalueUpper95SI": maximum_eigenvalue_upper95,
            "maximumGershgorinRadiusUpper95SI": float(
                np.max(off_diagonal_radius)
            ),
            "psdAlgorithm": (
                "numpy.linalg.eigvalsh_full_symmetric_spectrum_UPLO_lower"
            ),
        }
    )

    smeared_mean_values: list[float] = []
    for component in range(TENSOR_COMPONENT_COUNT):
        reduced = _finite_fsum(
            float(weights[point]) * float(mean[point, component])
            for point in range(SAMPLE_COUNT)
        )
        if reduced is None:
            return _blocked(
                receipt,
                "derived_nonfinite:smeared_mean_reduction",
                "fluctuation_ratio",
                f"/component/{component}",
                "A finite-input smeared-mean reduction overflowed binary64.",
                metrics,
                prior_issues=issues,
            )
        smeared_mean_values.append(reduced)
    smeared_mean = tuple(smeared_mean_values)
    frobenius_square = _finite_fsum(
        multiplicity * component * component
        for multiplicity, component in zip(
            SYMMETRIC_TENSOR_MULTIPLICITIES, smeared_mean, strict=True
        )
    )
    if frobenius_square is None or frobenius_square < 0.0:
        return _blocked(
            receipt,
            "derived_nonfinite:smeared_mean_frobenius",
            "fluctuation_ratio",
            None,
            "The smeared-mean Frobenius reduction is not finite nonnegative binary64.",
            metrics,
            prior_issues=issues,
        )
    mean_frobenius = sqrt(frobenius_square)
    normalization_scale = max(mean_frobenius, MEAN_NORMALIZATION_FLOOR_SI)
    fluctuation_amplitude_upper95 = sqrt(maximum_eigenvalue_upper95)
    fluctuation_ratio = fluctuation_amplitude_upper95 / normalization_scale
    if not all(
        isfinite(value)
        for value in (
            mean_frobenius,
            normalization_scale,
            fluctuation_amplitude_upper95,
            fluctuation_ratio,
        )
    ):
        return _blocked(
            receipt,
            "derived_nonfinite",
            "fluctuation_ratio",
            None,
            "The smeared mean or fluctuation ratio overflowed.",
            metrics,
            prior_issues=issues,
        )
    metrics["meanAndFluctuation"] = MappingProxyType(
        {
            "smearedTensorComponentsSI": smeared_mean,
            "symmetricTensorFrobeniusSI": mean_frobenius,
            "normalizationFloorSI": MEAN_NORMALIZATION_FLOOR_SI,
            "normalizationScaleSI": normalization_scale,
            "fluctuationAmplitudeUpper95SI": fluctuation_amplitude_upper95,
            "fluctuationToMeanRatioUpper95": fluctuation_ratio,
            "fluctuationRatioTolerance": (
                FLUCTUATION_TO_MEAN_RATIO_TOLERANCE
            ),
        }
    )
    if fluctuation_ratio > FLUCTUATION_TO_MEAN_RATIO_TOLERANCE:
        _add_fail(
            issues,
            "fluctuation_ratio_exceeds_tolerance",
            "fluctuation_ratio",
            None,
            "The noise-to-smeared-mean upper ratio exceeds one.",
        )

    target_lookup = {
        (target.level_id, target.family_id): np.asarray(
            target.values, dtype=np.float64
        )
        for target in auxiliary.server_recomputed_classical_targets
    }
    residuals: dict[str, list[np.ndarray]] = {family: [] for family in FAMILIES}
    uncertainties: dict[str, list[np.ndarray]] = {
        family: [] for family in FAMILIES
    }
    constraint_metrics: list[Mapping[str, object]] = []
    for level_id, _spacing in LEVELS:
        for family_id in FAMILIES:
            target_echo_mismatch: float | None = None
            with np.errstate(over="ignore", invalid="ignore"):
                if family_id in BRACKET_FAMILIES:
                    computed = _constraint_array(
                        arrays, level_id, family_id, "computed"
                    )
                    server_target = target_lookup[(level_id, family_id)]
                    submitted_target = _constraint_array(
                        arrays, level_id, family_id, "target"
                    )
                    server_residual = computed - server_target
                    target_echo_mismatch = float(
                        np.max(np.abs(submitted_target - server_target))
                    )
                elif family_id == "antisymmetry":
                    forward = _constraint_array(
                        arrays, level_id, family_id, "forward"
                    )
                    reverse = _constraint_array(
                        arrays, level_id, family_id, "reverse"
                    )
                    server_residual = forward + reverse
                else:
                    term_1 = _constraint_array(
                        arrays, level_id, family_id, "term_1"
                    )
                    term_2 = _constraint_array(
                        arrays, level_id, family_id, "term_2"
                    )
                    term_3 = _constraint_array(
                        arrays, level_id, family_id, "term_3"
                    )
                    server_residual = term_1 + term_2 + term_3
                submitted_residual = _constraint_array(
                    arrays, level_id, family_id, "residual"
                )
                uncertainty = _constraint_array(
                    arrays, level_id, family_id, "absolute_uncertainty95"
                )
                residual_linf = float(np.max(np.abs(server_residual)))
                residual_upper95 = float(
                    np.max(np.abs(server_residual) + uncertainty)
                )
                residual_echo_mismatch = float(
                    np.max(np.abs(submitted_residual - server_residual))
                )
            derived_values = (
                server_residual,
                residual_linf,
                residual_upper95,
                residual_echo_mismatch,
                0.0 if target_echo_mismatch is None else target_echo_mismatch,
            )
            if not all(
                bool(np.all(np.isfinite(value)))
                if isinstance(value, np.ndarray)
                else isfinite(value)
                for value in derived_values
            ):
                return _blocked(
                    receipt,
                    "derived_nonfinite",
                    "constraint_residual",
                    f"/{level_id}/{family_id}",
                    "Constraint residual arithmetic overflowed.",
                    metrics,
                    prior_issues=issues,
                )
            residuals[family_id].append(server_residual)
            uncertainties[family_id].append(uncertainty)
            constraint_metrics.append(
                MappingProxyType(
                    {
                        "levelId": level_id,
                        "familyId": family_id,
                        "residualLInf": residual_linf,
                        "residualUpper95": residual_upper95,
                        "submittedResidualEchoMismatchLInf": (
                            residual_echo_mismatch
                        ),
                        "submittedTargetEchoMismatchLInf": (
                            target_echo_mismatch
                        ),
                        "targetCalculationOrigin": (
                            CLASSICAL_TARGET_ORIGIN
                            if family_id in BRACKET_FAMILIES
                            else None
                        ),
                        "targetProvenanceValidated": False,
                    }
                )
            )
            if (
                target_echo_mismatch is not None
                and target_echo_mismatch > FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE
            ):
                _add_fail(
                    issues,
                    f"submitted_target_echo_mismatch:{level_id}:{family_id}",
                    "constraint_target_echo",
                    f"/{level_id}/{family_id}/target",
                    "Submitted target bytes differ from the typed recomputed target.",
                )
            if residual_echo_mismatch > FLOAT64_RECOMPUTE_ABSOLUTE_TOLERANCE:
                _add_fail(
                    issues,
                    f"submitted_residual_echo_mismatch:{level_id}:{family_id}",
                    "constraint_residual_echo",
                    f"/{level_id}/{family_id}/residual",
                    "Submitted residual bytes differ from the independent recomputation.",
                )
    metrics["constraintResiduals"] = tuple(constraint_metrics)

    regulator_metrics: list[Mapping[str, object]] = []
    for family_id in FAMILIES:
        r0, r1, r2 = residuals[family_id]
        u0, u1, u2 = uncertainties[family_id]
        with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
            d01 = np.abs(r0 - r1)
            d12 = np.abs(r1 - r2)
            u01 = u0 + u1
            u12 = u1 + u2
            e0 = 2.0 * d01
            e1 = 2.0 * d12
            e2 = d12
            ue0 = 2.0 * u01
            ue1 = 2.0 * u12
            ue2 = u12
            q0 = float(np.max(np.abs(e0) + ue0))
            q1 = float(np.max(np.abs(e1) + ue1))
            q2 = float(np.max(np.abs(e2) + ue2))
            d01_lower = float(np.max(np.maximum(0.0, d01 - u01)))
            d01_upper = float(np.max(d01 + u01))
            d12_lower = float(np.max(np.maximum(0.0, d12 - u12)))
            d12_upper = float(np.max(d12 + u12))
            final_residual_upper95 = float(np.max(np.abs(r2) + u2))
        derived = (
            d01,
            d12,
            u01,
            u12,
            e0,
            e1,
            e2,
            ue0,
            ue1,
            ue2,
            q0,
            q1,
            q2,
            d01_lower,
            d01_upper,
            d12_lower,
            d12_upper,
            final_residual_upper95,
        )
        if not all(
            bool(np.all(np.isfinite(value)))
            if isinstance(value, np.ndarray)
            else isfinite(value)
            for value in derived
        ):
            return _blocked(
                receipt,
                "derived_nonfinite",
                "regulator",
                f"/{family_id}",
                "A conservative regulator role overflowed.",
                metrics,
                prior_issues=issues,
            )
        p_lower: float | None
        if d01_lower <= 0.0 or d12_upper <= 0.0:
            p_lower = None
            issues.append(
                ReplayIssue(
                    f"regulator_order_undefined:{family_id}",
                    "regulator",
                    f"/{family_id}",
                    "D01Lower and D12Upper must be strictly positive; no synthetic floor is allowed.",
                    "blocked",
                )
            )
        else:
            try:
                log_d01_lower = log(d01_lower)
                log_d12_upper = log(d12_upper)
                log_spacing_ratio = log(2.0)
                log_difference = log_d01_lower - log_d12_upper
                p_lower = log_difference / log_spacing_ratio
            except (OverflowError, ValueError):
                log_d01_lower = None
                log_d12_upper = None
                log_spacing_ratio = None
                log_difference = None
                p_lower = None
            if (
                p_lower is None
                or log_d01_lower is None
                or log_d12_upper is None
                or log_spacing_ratio is None
                or log_difference is None
                or not all(
                    isfinite(value)
                    for value in (
                        log_d01_lower,
                        log_d12_upper,
                        log_spacing_ratio,
                        log_difference,
                        p_lower,
                    )
                )
            ):
                return _blocked(
                    receipt,
                    "derived_nonfinite:regulator_log_order",
                    "regulator",
                    f"/{family_id}/pLower",
                    "The log-difference conservative regulator order is nonfinite.",
                    metrics,
                    prior_issues=issues,
                )
        monotone = (
            d12_upper
            <= d01_lower + REGULATOR_MONOTONICITY_ABSOLUTE_TOLERANCE
        )
        regulator_metrics.append(
            MappingProxyType(
                {
                    "familyId": family_id,
                    "spacing": tuple(spacing for _level, spacing in LEVELS),
                    "errorEnvelopeUpper95ByLevel": (q0, q1, q2),
                    "D01Lower": d01_lower,
                    "D01Upper": d01_upper,
                    "D12Lower": d12_lower,
                    "D12Upper": d12_upper,
                    "pLower": p_lower,
                    "minimumRequiredOrder": MINIMUM_REGULATOR_CONVERGENCE_ORDER,
                    "monotone": monotone,
                    "finalResidualUpper95": final_residual_upper95,
                    "finalResidualTolerance": (
                        REGULATOR_FINAL_RESIDUAL_UPPER95_TOLERANCE
                    ),
                    "finalRegulatorErrorUpper95": q2,
                    "finalRegulatorErrorTolerance": (
                        REGULATOR_FINAL_ERROR_UPPER95_TOLERANCE
                    ),
                }
            )
        )
        if not monotone:
            _add_fail(
                issues,
                f"regulator_not_monotone:{family_id}",
                "regulator",
                f"/{family_id}",
                "D12Upper exceeds D01Lower plus the frozen tolerance.",
            )
        if p_lower is not None and p_lower < MINIMUM_REGULATOR_CONVERGENCE_ORDER:
            _add_fail(
                issues,
                f"regulator_order_below_minimum:{family_id}",
                "regulator",
                f"/{family_id}/pLower",
                "The conservative convergence order is below one.",
            )
        if final_residual_upper95 > REGULATOR_FINAL_RESIDUAL_UPPER95_TOLERANCE:
            _add_fail(
                issues,
                f"regulator_final_residual_exceeds_tolerance:{family_id}",
                "regulator",
                f"/{family_id}",
                "The level_2 residual upper bound exceeds 0.1.",
            )
        if q2 > REGULATOR_FINAL_ERROR_UPPER95_TOLERANCE:
            _add_fail(
                issues,
                f"regulator_final_error_exceeds_tolerance:{family_id}",
                "regulator",
                f"/{family_id}",
                "The conservative level_2 regulator error exceeds 0.1.",
            )
        central_tolerance = (
            BRACKET_RESIDUAL_UPPER95_TOLERANCE
            if family_id in BRACKET_FAMILIES
            else ANTISYMMETRY_RESIDUAL_UPPER95_TOLERANCE
            if family_id == "antisymmetry"
            else JACOBI_RESIDUAL_UPPER95_TOLERANCE
        )
        if final_residual_upper95 > central_tolerance:
            _add_fail(
                issues,
                f"central_residual_upper95_exceeds_tolerance:{family_id}",
                "constraint_central",
                f"/{family_id}/level_2",
                "The central level_2 family residual exceeds its frozen limit.",
            )
    metrics["regulatorFamilies"] = tuple(regulator_metrics)

    metric_summary = metrics["metricDemand"]
    noise_summary = metrics["noise"]
    fluctuation_summary = metrics["meanAndFluctuation"]
    constraint_summary = metrics["constraintResiduals"]
    ordered_metrics: dict[str, object] = {
        "finiteness": metrics["finiteness"],
        "metricDemandNondegeneracy": MappingProxyType(
            {
                key: metric_summary[key]
                for key in (
                    "minimumFrobeniusSI",
                    "maximumFrobeniusSI",
                    "minimumFrobeniusLowerBoundSI",
                    "maximumDeterministicErrorFrobeniusSI",
                    "minimumRequiredFrobeniusSI",
                    "qualifyingSampleCount",
                    "qualifyingSampleFraction",
                    "requiredSampleFraction",
                    "strictlyNondegenerate",
                )
            }
        ),
        "meanMetricDemandClosure": metrics["meanMetricDemandClosure"],
        "metricDemandErrorEnclosure": MappingProxyType(
            {
                key: metric_summary[key]
                for key in (
                    "maximumRelativeErrorBound",
                    "relativeErrorDefinedAtEveryPoint",
                    "relativeErrorTolerance",
                )
            }
        ),
        "smearingWeightFreeze": metrics["smearingWeightFreeze"],
        "smearingNormalization": metrics["smearing"],
        "exchangeSymmetry": MappingProxyType(
            {
                "exchangeResidualUpper95SI": noise_summary[
                    "exchangeResidualUpper95SI"
                ],
                "exchangeToleranceSI": noise_summary["exchangeToleranceSI"],
            }
        ),
        "psd": MappingProxyType(
            {
                key: noise_summary[key]
                for key in (
                    "sampleCount",
                    "covarianceDimension",
                    "minimumCentralEigenvalueSI",
                    "maximumCentralEigenvalueSI",
                    "psdToleranceSI",
                    "positiveSemidefiniteWithinTolerance",
                    "psdAlgorithm",
                )
            }
        ),
        "maximumEigenvalueUpper95": MappingProxyType(
            {
                "maximumEigenvalueUpper95SI": noise_summary[
                    "maximumEigenvalueUpper95SI"
                ],
                "maximumGershgorinRadiusUpper95SI": noise_summary[
                    "maximumGershgorinRadiusUpper95SI"
                ],
            }
        ),
        "fluctuationRatio": fluctuation_summary,
        "bracketResidual": tuple(
            next(
                entry
                for entry in constraint_summary
                if entry["familyId"] == family_id
                and entry["levelId"] == level_id
            )
            for family_id in BRACKET_FAMILIES
            for level_id, _spacing in LEVELS
        ),
        "antisymmetry": tuple(
            entry
            for entry in constraint_summary
            if entry["familyId"] == "antisymmetry"
        ),
        "jacobi": tuple(
            entry
            for entry in constraint_summary
            if entry["familyId"] == "jacobi"
        ),
        "regulatorConvergence": tuple(regulator_metrics),
    }
    return _result(
        receipt,
        issues,
        ordered_metrics,
        calculation_complete=True,
    )


_PAIR_TOLERANCE_IDS: Final = frozenset(
    tolerance_id
    for role in PAIR_OUTCOME_ROLES
    for tolerance_id in role["appliedToleranceIds"]
)


if (
    len(_EXPECTED_RAW_LENGTHS) != 68
    or sum(_EXPECTED_RAW_LENGTHS) != 836_672
    or len(_ORDINAL_BY_ROLE) != 68
    or raw_inventory.CANDIDATE_ID != CANDIDATE_ID
    or tuple(raw_inventory.NONNEGATIVE_FILE_ORDINALS)
    != _NONNEGATIVE_RAW_ORDINALS
    or len(TARGET_ORDER) != 9
    or COVARIANCE_DIMENSION != SAMPLE_COUNT * TENSOR_COMPONENT_COUNT
    or len(PAIR_OUTCOME_ROLES) != 30
    or any(
        role["ordinal"] != ordinal
        for ordinal, role in enumerate(PAIR_OUTCOME_ROLES)
    )
    or REQUIRED_CHECK_ORDER[4:6]
    != ("smearingWeightFreeze", "smearingNormalization")
    or _PAIR_TOLERANCE_IDS
    != frozenset(PAIR_COMPARISON_RELATION_BY_TOLERANCE_ID)
    or _PAIR_TOLERANCE_IDS
    != frozenset(PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID)
    or any(
        PAIR_CANONICAL_ISSUE_CODE_BY_TOLERANCE_ID[tolerance_id]
        != f"tolerance_not_satisfied:{tolerance_id}"
        for tolerance_id in _PAIR_TOLERANCE_IDS
    )
    or any(not isfinite(float(value)) for value in APPROVED_POLICY.values() if type(value) is float)
    or copysign(1.0, SMEARING_WEIGHT_SUM_TOLERANCE) < 0.0
):
    raise RuntimeError("spherical_v2_independent_science_constants_invalid")
