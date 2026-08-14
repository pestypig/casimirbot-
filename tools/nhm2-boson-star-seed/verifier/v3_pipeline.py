"""Authority-neutral in-memory P -> N -> F candidate chronology.

This is deliberately smaller than the sealed v3 verifier runtime.  It calls
the independent postprojection replay for P, selects a deterministic first P
mismatch, emits a diagnostic-only unformable stop when a sealed P rejection
cannot be proved, and otherwise stops at the first honest N result: the sealed
numeric-materialization failure code for the as-yet unimplemented materializer.
It does not parse a broker channel, form a sealed receipt, write a replay
bundle, run F, register evidence, or grant any authority.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
import hashlib
from types import MappingProxyType, MemberDescriptorType
from typing import Final, NoReturn

from .contract import AUTHORITY_LOCKS
from .errors import Blocker, VerificationBlocked, block
from .mpfr_backend import MpfrBackend
from .postprojection import (
    PostprojectionLevelReplay,
    PostprojectionMathReplay,
    replay_postprojection_math,
)
from .v3_inputs import (
    N32_INVENTORY,
    R6_INVENTORY,
    N32Observation,
    R6Observation,
)


_LEVEL_IDS: Final[tuple[str, ...]] = ("L0", "L1", "L2")
_LEVEL_GEOMETRY: Final[tuple[tuple[str, int, int, int], ...]] = (
    ("L0", 64, 32, 16),
    ("L1", 96, 48, 24),
    ("L2", 128, 64, 32),
)
_FIELD_IDS: Final[tuple[str, ...]] = (
    "scalar",
    "potential",
    "raw_evidence",
    "runtime",
    "identity",
    "independence",
)
_SAFE_INTEGER_MAX: Final[int] = 9_007_199_254_740_991
_N32_ROLES_PER_LEVEL: Final[int] = 8

_P_FAILURE_CODES: Final[tuple[str, ...]] = (
    "run_candidate_identity_mismatch",
    "runtime_binding_mismatch",
    "static_implementation_evidence_mismatch",
    "raw_evidence_closure_mismatch",
    "numeric_staging_closure_mismatch",
    "raw_evidence_inventory_mismatch",
    "raw_evidence_nonfinite",
    "raw_evidence_negative_zero",
    "analytic_z_bits_mismatch",
    "odd_cholesky_nonpositive_pivot",
    "even_cholesky_nonpositive_pivot",
    "scalar_coefficient_serialization_nonfinite",
    "potential_coefficient_serialization_nonfinite",
    "scalar_multipole_byte_mismatch",
    "potential_multipole_byte_mismatch",
    "scalar_multipole_mask_mismatch",
    "potential_multipole_mask_mismatch",
    "phase_a1_zero_or_nonfinite",
    "phase_final_a1_not_positive",
    "scalar_base_reconstruction_serialization_nonfinite",
    "potential_base_reconstruction_serialization_nonfinite",
    "base_scalar_byte_mismatch",
    "base_potential_byte_mismatch",
    "base_scalar_mask_mismatch",
    "base_potential_mask_mismatch",
    "implementation_independence_mismatch",
)

_NUMERIC_REJECTION_FAILURE_CODE: Final[str] = (
    "expected_array_materialization_failed"
)
_NUMERIC_REJECTION_DETAIL_CODE: Final[str] = (
    "numeric_materialization_unimplemented"
)
_NUMERIC_REJECTION_DETAIL_SHA256: Final[str] = hashlib.sha256(
    _NUMERIC_REJECTION_DETAIL_CODE.encode("ascii", "strict")
).hexdigest()

_P_UNFORMABLE_DIAGNOSTIC_CODES: Final[tuple[str, ...]] = (
    "postprojection_blocker_unformable",
    "postprojection_replay_snapshot_invalid",
    "postprojection_mismatch_unformable",
    "postprojection_unexpected_exception",
)

_V3_CLAIM_LOCK_NAMES: Final[tuple[str, ...]] = (
    "successorV3StaticPolicyInputsAccepted",
    "successorV3ProducerExact38OutputAccepted",
    "successorV3NumericStaging32RuntimeClosureAccepted",
    "successorV3RawEvidence6RuntimeClosureAccepted",
    "successorV3CandidateInstanceIdentityAccepted",
    "successorV3VerifierPrelaunchContextAccepted",
    "successorV3CandidatePostprojectionMathMatched",
    "successorV3CandidateNumericMaterializationMatched",
    "successorV3CandidateFullSeedGateEvidenceCompleted",
    "successorV3ValidatedFinalFullSeedAdmissionMatched",
    "successorV3CompositeReplayBundleAccepted",
    "successorV3BrokerRuntimeSeparationAccepted",
    "successorV3AtomicNestedRegistrationAccepted",
    "successorV3AssemblerAccepted",
    "successorV3FinalDescriptorObserved",
    "successorV3FinalContainerClosed",
    "successorV3FinalProjectionEqualityAccepted",
    "successorV3FinalArtifactAccepted",
)
_ADDITIONAL_AUTHORITY_LOCK_NAMES: Final[tuple[str, ...]] = (
    "runtimeConformanceEstablished",
    "observationProvenanceEstablished",
    "brokerSameAttemptEstablished",
    "runtimeIsolationEstablished",
    "authoritativeRegistrationAllowed",
    "scientificAdmissionGranted",
    "seedAdmissionGranted",
    "artifactAdmissionGranted",
    "physicalClaimAllowed",
)
_ALL_LOCK_NAMES: Final[tuple[str, ...]] = tuple(
    dict.fromkeys(
        (
            *AUTHORITY_LOCKS.keys(),
            *_ADDITIONAL_AUTHORITY_LOCK_NAMES,
            *_V3_CLAIM_LOCK_NAMES,
        )
    )
)
ALL_AUTHORITY_AND_CLAIM_LOCKS_FALSE: Final[Mapping[str, bool]] = (
    MappingProxyType({name: False for name in _ALL_LOCK_NAMES})
)


def _exact_optional_safe_integer(value: object) -> bool:
    return value is None or (
        type(value) is int and 0 <= value <= _SAFE_INTEGER_MAX
    )


@dataclass(frozen=True, slots=True)
class FirstMismatch:
    """Policy-shaped first-mismatch coordinates without receipt authority."""

    level_id: str | None
    field: str
    radial_index: int | None
    mode_or_angular_index: int | None
    byte_offset: int | None

    def __post_init__(self) -> None:
        if (
            (self.level_id is not None and type(self.level_id) is not str)
            or self.level_id not in (*_LEVEL_IDS, None)
            or type(self.field) is not str
            or self.field not in _FIELD_IDS
            or not _exact_optional_safe_integer(self.radial_index)
            or not _exact_optional_safe_integer(self.mode_or_angular_index)
            or not _exact_optional_safe_integer(self.byte_offset)
            or (
                self.level_id is None
                and any(
                    value is not None
                    for value in (
                        self.radial_index,
                        self.mode_or_angular_index,
                        self.byte_offset,
                    )
                )
            )
        ):
            block(
                "v3_pipeline",
                "exact_first_mismatch_shape_required",
                repr((self.level_id, self.field)),
            )


@dataclass(frozen=True, slots=True)
class CandidatePStageResult:
    """One in-memory P result; this is not a sealed candidate-P receipt."""

    disposition: str
    replay: PostprojectionMathReplay | None
    failure_code: str | None
    diagnostic_code: str | None
    first_mismatch: FirstMismatch | None

    def __post_init__(self) -> None:
        if type(self.disposition) is not str or self.disposition not in (
            "match",
            "rejection",
            "unformable",
        ):
            block(
                "v3_pipeline",
                "exact_candidate_p_disposition_required",
                type(self.disposition).__name__,
            )
        if self.disposition == "match":
            valid = (
                type(self.replay) is PostprojectionMathReplay
                and self.replay.all_levels_match is True
                and self.failure_code is None
                and self.diagnostic_code is None
                and self.first_mismatch is None
            )
        elif self.disposition == "rejection":
            valid = (
                (self.replay is None or type(self.replay) is PostprojectionMathReplay)
                and not (
                    type(self.replay) is PostprojectionMathReplay
                    and self.replay.all_levels_match is True
                )
                and type(self.failure_code) is str
                and self.failure_code in _P_FAILURE_CODES
                and type(self.diagnostic_code) is str
                and bool(self.diagnostic_code)
                and type(self.first_mismatch) is FirstMismatch
            )
        else:
            valid = (
                self.replay is None
                and self.failure_code is None
                and type(self.diagnostic_code) is str
                and self.diagnostic_code in _P_UNFORMABLE_DIAGNOSTIC_CODES
                and self.first_mismatch is None
            )
        if not valid:
            block(
                "v3_pipeline",
                "exact_candidate_p_result_shape_required",
                self.disposition,
            )


@dataclass(frozen=True, slots=True)
class NumericMaterializationStageResult:
    """Honest typed N stop, intentionally lacking all sealed receipt fields."""

    disposition: str = "rejection"
    failure_code: str = _NUMERIC_REJECTION_FAILURE_CODE
    detail_code: str = _NUMERIC_REJECTION_DETAIL_CODE
    detail_sha256: str = _NUMERIC_REJECTION_DETAIL_SHA256
    first_mismatch_inventory_index: None = None

    def __post_init__(self) -> None:
        if (
            type(self.disposition) is not str
            or self.disposition != "rejection"
            or type(self.failure_code) is not str
            or self.failure_code != _NUMERIC_REJECTION_FAILURE_CODE
            or type(self.detail_code) is not str
            or self.detail_code != _NUMERIC_REJECTION_DETAIL_CODE
            or type(self.detail_sha256) is not str
            or self.detail_sha256 != _NUMERIC_REJECTION_DETAIL_SHA256
            or self.first_mismatch_inventory_index is not None
        ):
            block(
                "v3_pipeline",
                "exact_unimplemented_numeric_rejection_required",
                repr(self.failure_code),
            )


@dataclass(frozen=True, slots=True)
class V3PipelineResult:
    """Deeply immutable diagnostic chronology with every authority lock shut."""

    outcome: str
    candidate_p: CandidatePStageResult
    candidate_n: NumericMaterializationStageResult | None
    candidate_f: None
    attempted_stages: tuple[str, ...]
    replay_bundle_emitted: bool = False
    broker_same_attempt_established: bool = False
    runtime_isolation_established: bool = False
    authoritative_registration_allowed: bool = False
    scientific_admission_granted: bool = False
    seed_admission_granted: bool = False
    artifact_admission_granted: bool = False
    physical_claim_allowed: bool = False
    propulsion_claim_allowed: bool = False
    transport_claim_allowed: bool = False

    def __post_init__(self) -> None:
        exact_false_fields = (
            self.replay_bundle_emitted,
            self.broker_same_attempt_established,
            self.runtime_isolation_established,
            self.authoritative_registration_allowed,
            self.scientific_admission_granted,
            self.seed_admission_granted,
            self.artifact_admission_granted,
            self.physical_claim_allowed,
            self.propulsion_claim_allowed,
            self.transport_claim_allowed,
        )
        common_valid = (
            type(self.outcome) is str
            and type(self.candidate_p) is CandidatePStageResult
            and self.candidate_f is None
            and type(self.attempted_stages) is tuple
            and all(type(stage) is str for stage in self.attempted_stages)
            and all(value is False for value in exact_false_fields)
        )
        if not common_valid:
            block(
                "v3_pipeline",
                "exact_pipeline_result_profile_required",
                type(self.outcome).__name__,
            )
        if self.outcome in ("P_rejection", "P_unformable"):
            profile_valid = (
                self.candidate_p.disposition
                == ("rejection" if self.outcome == "P_rejection" else "unformable")
                and self.candidate_n is None
                and self.attempted_stages == ("P",)
            )
        elif self.outcome == "P_match_N_rejection":
            profile_valid = (
                self.candidate_p.disposition == "match"
                and type(self.candidate_n) is NumericMaterializationStageResult
                and self.candidate_n.disposition == "rejection"
                and self.attempted_stages == ("P", "N")
            )
        else:
            profile_valid = False
        if not profile_valid:
            block(
                "v3_pipeline",
                "exact_pipeline_result_profile_required",
                repr(self.outcome),
            )

    @property
    def p_attempted(self) -> bool:
        return True

    @property
    def n_attempted(self) -> bool:
        return self.candidate_n is not None

    @property
    def f_attempted(self) -> bool:
        return False

    @property
    def authority_locks(self) -> Mapping[str, bool]:
        return ALL_AUTHORITY_AND_CLAIM_LOCKS_FALSE


class _PUnformable(RuntimeError):
    """Internal bounded signal; it deliberately carries no hostile detail."""

    __slots__ = ()


def _unformable() -> NoReturn:
    raise _PUnformable


def _exact_slot(instance: object, exact_type: type[object], name: str) -> object:
    """Read one dataclass slot without dispatching through instance hooks."""

    if type(instance) is not exact_type:
        _unformable()
    descriptor = vars(exact_type).get(name)
    if not isinstance(descriptor, MemberDescriptorType):
        _unformable()
    try:
        return descriptor.__get__(instance, exact_type)
    except (AttributeError, TypeError):
        _unformable()


def _snapshot_n32_payloads(
    n32: Sequence[N32Observation],
) -> tuple[bytes, ...]:
    """Retain an exact bounded N32 byte view for post-return flag validation."""

    if type(n32) is not tuple or len(n32) != len(N32_INVENTORY):
        _unformable()
    payloads: list[bytes] = []
    for spec, observation in zip(N32_INVENTORY, n32, strict=True):
        if type(observation) is not N32Observation:
            _unformable()
        inventory_index = _exact_slot(
            observation, N32Observation, "inventory_index"
        )
        path = _exact_slot(observation, N32Observation, "path")
        relative_path = _exact_slot(
            observation, N32Observation, "relative_path"
        )
        byte_length = _exact_slot(observation, N32Observation, "byte_length")
        plain_sha256 = _exact_slot(
            observation, N32Observation, "plain_sha256"
        )
        raw_bytes = _exact_slot(observation, N32Observation, "raw_bytes")
        if (
            type(inventory_index) is not int
            or inventory_index != spec.inventory_index
            or type(path) is not str
            or path != spec.canonical_absolute_path
            or type(relative_path) is not str
            or relative_path != spec.relative_path
            or type(byte_length) is not int
            or byte_length != spec.byte_length
            or type(plain_sha256) is not str
            or type(raw_bytes) is not bytes
            or len(raw_bytes) != spec.byte_length
            or hashlib.sha256(raw_bytes).hexdigest() != plain_sha256
        ):
            _unformable()
        payloads.append(raw_bytes)
    return tuple(payloads)


def _first_different_byte(left: bytes, right: bytes) -> int | None:
    if type(left) is not bytes or type(right) is not bytes or len(left) != len(right):
        block(
            "v3_pipeline",
            "comparable_exact_byte_strings_required",
            repr((type(left).__name__, type(right).__name__)),
        )
    for offset, (left_byte, right_byte) in enumerate(zip(left, right, strict=True)):
        if left_byte != right_byte:
            return offset
    return None


def _coordinate_mismatch(
    level_id: str,
    field: str,
    flat_byte_offset: int,
    row_width: int,
) -> FirstMismatch:
    element_index, byte_offset = divmod(flat_byte_offset, 8)
    radial_index, mode_or_angular_index = divmod(element_index, row_width)
    return FirstMismatch(
        level_id=level_id,
        field=field,
        radial_index=radial_index,
        mode_or_angular_index=mode_or_angular_index,
        byte_offset=byte_offset,
    )


def _expected_n32_bytes(
    n32_payloads: tuple[bytes, ...], level_index: int, role_index: int
) -> bytes:
    inventory_index = level_index * _N32_ROLES_PER_LEVEL + role_index
    if (
        type(n32_payloads) is not tuple
        or len(n32_payloads) != len(N32_INVENTORY)
        or type(n32_payloads[inventory_index]) is not bytes
    ):
        _unformable()
    return n32_payloads[inventory_index]


def _byte_mismatch(
    replay: PostprojectionMathReplay,
    n32_payloads: tuple[bytes, ...],
) -> tuple[str, FirstMismatch] | None:
    categories = (
        (
            "scalar_multipole_match",
            "computed_scalar_multipole_bytes",
            6,
            "scalar_multipole_byte_mismatch",
            "scalar",
            True,
        ),
        (
            "potential_multipole_match",
            "computed_potential_multipole_bytes",
            7,
            "potential_multipole_byte_mismatch",
            "potential",
            True,
        ),
        (
            "scalar_base_match",
            "computed_scalar_base_bytes",
            2,
            "base_scalar_byte_mismatch",
            "scalar",
            False,
        ),
        (
            "potential_base_match",
            "computed_potential_base_bytes",
            3,
            "base_potential_byte_mismatch",
            "potential",
            False,
        ),
    )
    # Failure-code precedence is outermost; level order is subordinate to it.
    for match_name, payload_name, role_index, code, field, multipole in categories:
        for level_index, level in enumerate(replay.levels):
            if getattr(level, match_name) is False:
                computed = getattr(level, payload_name)
                expected = _expected_n32_bytes(
                    n32_payloads, level_index, role_index
                )
                offset = _first_different_byte(computed, expected)
                if offset is None:
                    block(
                        "v3_pipeline",
                        "p_match_flag_disagrees_with_complete_bytes",
                        f"{level.level_id}:{match_name}",
                    )
                width = level.mode_count if multipole else level.angular_node_count
                return code, _coordinate_mismatch(
                    level.level_id, field, offset, width
                )
    return None


def _mask_indices(
    level: PostprojectionLevelReplay, category: str
) -> Iterable[int]:
    """Yield masked elements in frozen radial-major order without allocation."""

    radial_count = level.radial_node_count
    angular_count = level.angular_node_count
    mode_count = level.mode_count
    if category == "scalar_multipole":
        return (
            radial * mode_count + mode
            for radial in range(radial_count)
            for mode in range(mode_count)
            if radial == 0 or radial == radial_count - 1
        )
    if category == "potential_multipole":
        return (
            radial * mode_count + mode
            for radial in range(radial_count)
            for mode in range(mode_count)
            if radial == radial_count - 1
        )
    if category == "scalar_base":
        return (
            radial * angular_count + angular
            for radial in range(radial_count)
            for angular in range(angular_count)
            if (
                radial == 0
                or radial == radial_count - 1
                or angular == angular_count - 1
            )
        )
    if category == "potential_base":
        return (
            radial * angular_count + angular
            for radial in range(radial_count)
            for angular in range(angular_count)
            if radial == radial_count - 1
        )
    block("v3_pipeline", "unknown_mask_category", category)


def _first_non_positive_zero(
    payload: bytes, indices: Iterable[int]
) -> tuple[int, int] | None:
    zero = b"\x00" * 8
    for index in indices:
        value = payload[8 * index : 8 * (index + 1)]
        if value != zero:
            byte_offset = _first_different_byte(value, zero)
            if byte_offset is None:
                block("v3_pipeline", "mask_mismatch_selection_failed", str(index))
            return index, byte_offset
    return None


def _level_masks_positive_zero(level: PostprojectionLevelReplay) -> bool:
    return all(
        _first_non_positive_zero(
            getattr(level, payload_name), _mask_indices(level, category)
        )
        is None
        for category, payload_name in (
            ("scalar_multipole", "computed_scalar_multipole_bytes"),
            ("potential_multipole", "computed_potential_multipole_bytes"),
            ("scalar_base", "computed_scalar_base_bytes"),
            ("potential_base", "computed_potential_base_bytes"),
        )
    )


def _mask_mismatch(
    replay: PostprojectionMathReplay,
) -> tuple[str, FirstMismatch] | None:
    categories = (
        (
            "scalar_multipole",
            "computed_scalar_multipole_bytes",
            "scalar_multipole_mask_mismatch",
            "scalar",
            True,
        ),
        (
            "potential_multipole",
            "computed_potential_multipole_bytes",
            "potential_multipole_mask_mismatch",
            "potential",
            True,
        ),
        (
            "scalar_base",
            "computed_scalar_base_bytes",
            "base_scalar_mask_mismatch",
            "scalar",
            False,
        ),
        (
            "potential_base",
            "computed_potential_base_bytes",
            "base_potential_mask_mismatch",
            "potential",
            False,
        ),
    )
    for category, payload_name, code, field, multipole in categories:
        for level in replay.levels:
            found = _first_non_positive_zero(
                getattr(level, payload_name), _mask_indices(level, category)
            )
            if found is not None:
                element_index, byte_offset = found
                width = level.mode_count if multipole else level.angular_node_count
                radial_index, mode_or_angular_index = divmod(element_index, width)
                return code, FirstMismatch(
                    level_id=level.level_id,
                    field=field,
                    radial_index=radial_index,
                    mode_or_angular_index=mode_or_angular_index,
                    byte_offset=byte_offset,
                )
    return None


def _snapshot_level_replay(
    source: object,
    expected_geometry: tuple[str, int, int, int],
    level_index: int,
    n32_payloads: tuple[bytes, ...],
) -> PostprojectionLevelReplay:
    if type(source) is not PostprojectionLevelReplay:
        _unformable()
    level_id = _exact_slot(source, PostprojectionLevelReplay, "level_id")
    radial_count = _exact_slot(
        source, PostprojectionLevelReplay, "radial_node_count"
    )
    angular_count = _exact_slot(
        source, PostprojectionLevelReplay, "angular_node_count"
    )
    mode_count = _exact_slot(source, PostprojectionLevelReplay, "mode_count")
    if (
        type(level_id) is not str
        or type(radial_count) is not int
        or type(angular_count) is not int
        or type(mode_count) is not int
        or (level_id, radial_count, angular_count, mode_count)
        != expected_geometry
    ):
        _unformable()

    provisional_a1_bits = _exact_slot(
        source, PostprojectionLevelReplay, "provisional_a1_bits"
    )
    final_a1_bits = _exact_slot(
        source, PostprojectionLevelReplay, "final_a1_bits"
    )
    phase_sign = _exact_slot(source, PostprojectionLevelReplay, "phase_sign")
    scalar_multipole_bytes = _exact_slot(
        source,
        PostprojectionLevelReplay,
        "computed_scalar_multipole_bytes",
    )
    potential_multipole_bytes = _exact_slot(
        source,
        PostprojectionLevelReplay,
        "computed_potential_multipole_bytes",
    )
    scalar_base_bytes = _exact_slot(
        source, PostprojectionLevelReplay, "computed_scalar_base_bytes"
    )
    potential_base_bytes = _exact_slot(
        source, PostprojectionLevelReplay, "computed_potential_base_bytes"
    )
    scalar_multipole_match = _exact_slot(
        source, PostprojectionLevelReplay, "scalar_multipole_match"
    )
    potential_multipole_match = _exact_slot(
        source, PostprojectionLevelReplay, "potential_multipole_match"
    )
    scalar_base_match = _exact_slot(
        source, PostprojectionLevelReplay, "scalar_base_match"
    )
    potential_base_match = _exact_slot(
        source, PostprojectionLevelReplay, "potential_base_match"
    )
    masks_positive = _exact_slot(
        source,
        PostprojectionLevelReplay,
        "all_symbolic_masks_positive_zero",
    )
    all_matches = _exact_slot(source, PostprojectionLevelReplay, "all_matches")

    reconstructed = PostprojectionLevelReplay(
        level_id=level_id,
        radial_node_count=radial_count,
        angular_node_count=angular_count,
        mode_count=mode_count,
        provisional_a1_bits=provisional_a1_bits,
        final_a1_bits=final_a1_bits,
        phase_sign=phase_sign,
        computed_scalar_multipole_bytes=scalar_multipole_bytes,
        computed_potential_multipole_bytes=potential_multipole_bytes,
        computed_scalar_base_bytes=scalar_base_bytes,
        computed_potential_base_bytes=potential_base_bytes,
        scalar_multipole_match=scalar_multipole_match,
        potential_multipole_match=potential_multipole_match,
        scalar_base_match=scalar_base_match,
        potential_base_match=potential_base_match,
        all_symbolic_masks_positive_zero=masks_positive,
        all_matches=all_matches,
    )

    derived_scalar_multipole_match = scalar_multipole_bytes == _expected_n32_bytes(
        n32_payloads, level_index, 6
    )
    derived_potential_multipole_match = (
        potential_multipole_bytes
        == _expected_n32_bytes(n32_payloads, level_index, 7)
    )
    derived_scalar_base_match = scalar_base_bytes == _expected_n32_bytes(
        n32_payloads, level_index, 2
    )
    derived_potential_base_match = potential_base_bytes == _expected_n32_bytes(
        n32_payloads, level_index, 3
    )
    derived_masks_positive = _level_masks_positive_zero(reconstructed)
    derived_all_matches = (
        derived_scalar_multipole_match
        and derived_potential_multipole_match
        and derived_scalar_base_match
        and derived_potential_base_match
        and derived_masks_positive
    )
    if (
        scalar_multipole_match is not derived_scalar_multipole_match
        or potential_multipole_match is not derived_potential_multipole_match
        or scalar_base_match is not derived_scalar_base_match
        or potential_base_match is not derived_potential_base_match
        or masks_positive is not derived_masks_positive
        or all_matches is not derived_all_matches
    ):
        _unformable()
    return reconstructed


def _snapshot_math_replay(
    source: object, n32_payloads: tuple[bytes, ...]
) -> PostprojectionMathReplay:
    if type(source) is not PostprojectionMathReplay:
        _unformable()
    raw_levels = _exact_slot(source, PostprojectionMathReplay, "levels")
    if type(raw_levels) is not tuple or len(raw_levels) != len(_LEVEL_GEOMETRY):
        _unformable()
    levels = tuple(
        _snapshot_level_replay(level, geometry, index, n32_payloads)
        for index, (level, geometry) in enumerate(
            zip(raw_levels, _LEVEL_GEOMETRY, strict=True)
        )
    )
    all_levels_match = _exact_slot(
        source, PostprojectionMathReplay, "all_levels_match"
    )
    verifier_calculation_implemented = _exact_slot(
        source,
        PostprojectionMathReplay,
        "verifier_calculation_implemented",
    )
    runtime_conformance_established = _exact_slot(
        source,
        PostprojectionMathReplay,
        "runtime_conformance_established",
    )
    observation_provenance_established = _exact_slot(
        source,
        PostprojectionMathReplay,
        "observation_provenance_established",
    )
    same_attempt_established = _exact_slot(
        source, PostprojectionMathReplay, "same_attempt_established"
    )
    authoritative_registration_allowed = _exact_slot(
        source,
        PostprojectionMathReplay,
        "authoritative_registration_allowed",
    )
    seed_admission_granted = _exact_slot(
        source, PostprojectionMathReplay, "seed_admission_granted"
    )
    artifact_admission_granted = _exact_slot(
        source, PostprojectionMathReplay, "artifact_admission_granted"
    )
    physical_claim_allowed = _exact_slot(
        source, PostprojectionMathReplay, "physical_claim_allowed"
    )
    return PostprojectionMathReplay(
        levels=levels,
        all_levels_match=all_levels_match,
        verifier_calculation_implemented=verifier_calculation_implemented,
        runtime_conformance_established=runtime_conformance_established,
        observation_provenance_established=observation_provenance_established,
        same_attempt_established=same_attempt_established,
        authoritative_registration_allowed=authoritative_registration_allowed,
        seed_admission_granted=seed_admission_granted,
        artifact_admission_granted=artifact_admission_granted,
        physical_claim_allowed=physical_claim_allowed,
    )


def _first_postprojection_mismatch(
    replay: PostprojectionMathReplay,
    n32_payloads: tuple[bytes, ...],
) -> tuple[str, FirstMismatch]:
    byte_mismatch = _byte_mismatch(replay, n32_payloads)
    if byte_mismatch is not None:
        # Byte and mask failure codes interleave in the frozen precedence.  A
        # multipole mask precedes any base-byte mismatch, so check that case.
        if byte_mismatch[0] in (
            "base_scalar_byte_mismatch",
            "base_potential_byte_mismatch",
        ):
            mask_mismatch = _mask_mismatch(replay)
            if mask_mismatch is not None and mask_mismatch[0] in (
                "scalar_multipole_mask_mismatch",
                "potential_multipole_mask_mismatch",
            ):
                return mask_mismatch
        return byte_mismatch
    mask_mismatch = _mask_mismatch(replay)
    if mask_mismatch is not None:
        return mask_mismatch
    block(
        "v3_pipeline",
        "p_replay_false_without_selectable_mismatch",
        "all_levels_match_false",
    )


def _unformable_p_result(diagnostic_code: str) -> CandidatePStageResult:
    return CandidatePStageResult(
        disposition="unformable",
        replay=None,
        failure_code=None,
        diagnostic_code=diagnostic_code,
        first_mismatch=None,
    )


def _snapshot_blocker(error: VerificationBlocked) -> tuple[str, str, str]:
    if type(error) is not VerificationBlocked:
        _unformable()
    try:
        error_state = object.__getattribute__(error, "__dict__")
    except (AttributeError, TypeError):
        _unformable()
    if type(error_state) is not dict:
        _unformable()
    blocker = error_state.get("blocker")
    if type(blocker) is not Blocker:
        _unformable()
    phase = _exact_slot(blocker, Blocker, "phase")
    source_code = _exact_slot(blocker, Blocker, "code")
    detail = _exact_slot(blocker, Blocker, "detail")
    if (
        type(phase) is not str
        or not phase
        or len(phase) > 64
        or type(source_code) is not str
        or not source_code
        or len(source_code) > 128
        or type(detail) is not str
        or len(detail) > 4096
    ):
        _unformable()
    return phase, source_code, detail


def _canonical_count_detail(detail: str) -> bool:
    return (
        bool(detail)
        and len(detail) <= 16
        and detail.isascii()
        and detail.isdecimal()
        and (len(detail) == 1 or detail[0] != "0")
    )


def _raw_coordinate(detail: str) -> FirstMismatch:
    parts = detail.split(":")
    if len(parts) != 3:
        _unformable()
    level_id, role, encoded_index = parts
    geometry = next(
        (entry for entry in _LEVEL_GEOMETRY if entry[0] == level_id), None
    )
    if (
        geometry is None
        or role not in ("raw_scalar", "raw_potential")
        or not encoded_index
        or not encoded_index.isascii()
        or not encoded_index.isdecimal()
        or (len(encoded_index) > 1 and encoded_index[0] == "0")
        or len(encoded_index) > 7
    ):
        _unformable()
    element_index = int(encoded_index, 10)
    _, radial_count, angular_count, _ = geometry
    if element_index >= radial_count * angular_count:
        _unformable()
    radial_index, angular_index = divmod(element_index, angular_count)
    return FirstMismatch(
        level_id=level_id,
        field="raw_evidence",
        radial_index=radial_index,
        mode_or_angular_index=angular_index,
        byte_offset=None,
    )


def _blocked_p_result(error: VerificationBlocked) -> CandidatePStageResult:
    try:
        phase, source_code, detail = _snapshot_blocker(error)
        raw_entry_codes = {
            "exact_r6_observation_type_required",
            "exact_r6_observation_field_types_required",
            "r6_observation_inventory_mismatch",
        }
        n32_entry_codes = {
            "exact_n32_observation_type_required",
            "exact_n32_observation_field_types_required",
            "n32_observation_inventory_mismatch",
        }
        runtime_codes = {
            "exact_backend_instance_required",
            "attested_library_observations_required",
            "linux_x86_64_runtime_required",
            "library_identity_profile_mismatch",
            "library_version_symbol_missing",
        }
        if source_code in ("negative_zero_forbidden", "finite_binary64_required"):
            if phase != "postprojection":
                _unformable()
            first_mismatch = _raw_coordinate(detail)
            failure_code = (
                "raw_evidence_negative_zero"
                if source_code == "negative_zero_forbidden"
                else "raw_evidence_nonfinite"
            )
        elif source_code == "exact_r6_inventory_required":
            if phase != "postprojection" or not _canonical_count_detail(detail):
                _unformable()
            failure_code = "raw_evidence_closure_mismatch"
            first_mismatch = FirstMismatch(
                None, "raw_evidence", None, None, None
            )
        elif source_code in raw_entry_codes:
            if phase != "postprojection":
                _unformable()
            matching_spec = next(
                (spec for spec in R6_INVENTORY if spec.relative_path == detail),
                None,
            )
            if matching_spec is None:
                _unformable()
            failure_code = "raw_evidence_closure_mismatch"
            first_mismatch = FirstMismatch(
                level_id=matching_spec.level_id,
                field="raw_evidence",
                radial_index=None,
                mode_or_angular_index=None,
                byte_offset=None,
            )
        elif source_code == "exact_f64le_byte_length_required":
            if phase != "postprojection":
                _unformable()
            detail_parts = detail.split(":")
            if (
                len(detail_parts) != 2
                or detail_parts[0] not in _LEVEL_IDS
                or detail_parts[1] not in ("raw_scalar", "raw_potential")
            ):
                _unformable()
            failure_code = "raw_evidence_closure_mismatch"
            first_mismatch = FirstMismatch(
                detail_parts[0], "raw_evidence", None, None, None
            )
        elif source_code == "exact_n32_inventory_required":
            if phase != "postprojection" or not _canonical_count_detail(detail):
                _unformable()
            failure_code = "numeric_staging_closure_mismatch"
            first_mismatch = FirstMismatch(
                None, "identity", None, None, None
            )
        elif source_code in n32_entry_codes:
            if phase != "postprojection":
                _unformable()
            matching_spec = next(
                (spec for spec in N32_INVENTORY if spec.relative_path == detail),
                None,
            )
            if matching_spec is None:
                _unformable()
            failure_code = "numeric_staging_closure_mismatch"
            first_mismatch = FirstMismatch(
                level_id=(
                    matching_spec.level_id
                    if matching_spec.level_id in _LEVEL_IDS
                    else None
                ),
                field="identity",
                radial_index=None,
                mode_or_angular_index=None,
                byte_offset=None,
            )
        elif source_code in (
            "frozen_analytic_z_pin_required",
            "serialized_analytic_z_pin_mismatch",
        ):
            if phase != "postprojection" or detail not in ("32", "48", "64"):
                _unformable()
            failure_code = "analytic_z_bits_mismatch"
            first_mismatch = FirstMismatch(
                level_id={"32": "L0", "48": "L1", "64": "L2"}[detail],
                field="runtime",
                radial_index=None,
                mode_or_angular_index=None,
                byte_offset=None,
            )
        elif source_code == "zero_scalar_phase_rejected":
            if phase != "postprojection" or detail not in _LEVEL_IDS:
                _unformable()
            failure_code = "phase_a1_zero_or_nonfinite"
            first_mismatch = FirstMismatch(
                detail, "scalar", None, None, None
            )
        elif source_code in (
            "final_scalar_phase_not_positive",
            "final_a1_binary64_not_positive",
        ):
            if phase != "postprojection" or detail not in _LEVEL_IDS:
                _unformable()
            failure_code = "phase_final_a1_not_positive"
            first_mismatch = FirstMismatch(
                detail, "scalar", None, None, None
            )
        elif source_code in runtime_codes:
            if phase != "mpfr":
                _unformable()
            failure_code = "runtime_binding_mismatch"
            first_mismatch = FirstMismatch(
                None, "runtime", None, None, None
            )
        else:
            _unformable()
        return CandidatePStageResult(
            disposition="rejection",
            replay=None,
            failure_code=failure_code,
            diagnostic_code=f"postprojection_blocked:{source_code}",
            first_mismatch=first_mismatch,
        )
    except Exception:
        return _unformable_p_result("postprojection_blocker_unformable")


def _run_candidate_p(
    backend: MpfrBackend,
    n32: Sequence[N32Observation],
    r6: Sequence[R6Observation],
) -> CandidatePStageResult:
    try:
        source_replay = replay_postprojection_math(backend, n32, r6)
    except VerificationBlocked as error:
        return _blocked_p_result(error)
    except Exception:
        return _unformable_p_result("postprojection_unexpected_exception")

    try:
        n32_payloads = _snapshot_n32_payloads(n32)
        replay = _snapshot_math_replay(source_replay, n32_payloads)
    except Exception:
        return _unformable_p_result("postprojection_replay_snapshot_invalid")

    try:
        if replay.all_levels_match is False:
            failure_code, first_mismatch = _first_postprojection_mismatch(
                replay, n32_payloads
            )
            return CandidatePStageResult(
                disposition="rejection",
                replay=replay,
                failure_code=failure_code,
                diagnostic_code="postprojection_complete_replay_mismatch",
                first_mismatch=first_mismatch,
            )
        return CandidatePStageResult(
            disposition="match",
            replay=replay,
            failure_code=None,
            diagnostic_code=None,
            first_mismatch=None,
        )
    except Exception:
        return _unformable_p_result("postprojection_mismatch_unformable")


def _numeric_materialization_unimplemented(
    _candidate_p: CandidatePStageResult,
) -> NumericMaterializationStageResult:
    return NumericMaterializationStageResult()


def _attempt_full_seed_gate() -> NoReturn:
    """Unreachable guard: F is forbidden until a future positive N exists."""

    block(
        "v3_pipeline",
        "full_seed_gate_forbidden_without_positive_n",
        "numeric_materialization_unimplemented",
    )


def run_v3_candidate_pipeline(
    backend: MpfrBackend,
    n32: Sequence[N32Observation],
    r6: Sequence[R6Observation],
) -> V3PipelineResult:
    """Run the exact currently implementable P -> N -> F chronology.

    The public surface intentionally has no callbacks or injection seams.
    Tests may replace module-private stage functions to observe chronology.
    An unformable P diagnostic is not a sealed P-rejection value and stops N/F.
    """

    candidate_p = _run_candidate_p(backend, n32, r6)
    if candidate_p.disposition in ("rejection", "unformable"):
        return V3PipelineResult(
            outcome=(
                "P_rejection"
                if candidate_p.disposition == "rejection"
                else "P_unformable"
            ),
            candidate_p=candidate_p,
            candidate_n=None,
            candidate_f=None,
            attempted_stages=("P",),
        )

    candidate_n = _numeric_materialization_unimplemented(candidate_p)
    if type(candidate_n) is not NumericMaterializationStageResult:
        block(
            "v3_pipeline",
            "exact_numeric_stage_result_required",
            type(candidate_n).__name__,
        )
    if candidate_n.disposition == "rejection":
        return V3PipelineResult(
            outcome="P_match_N_rejection",
            candidate_p=candidate_p,
            candidate_n=candidate_n,
            candidate_f=None,
            attempted_stages=("P", "N"),
        )

    # NumericMaterializationStageResult's exact invariant makes this branch
    # unreachable today.  Keeping the guard explicit documents the F boundary.
    _attempt_full_seed_gate()


__all__ = [
    "ALL_AUTHORITY_AND_CLAIM_LOCKS_FALSE",
    "CandidatePStageResult",
    "FirstMismatch",
    "NumericMaterializationStageResult",
    "V3PipelineResult",
    "run_v3_candidate_pipeline",
]
