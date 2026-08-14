"""Focused chronology and invariant tests for the bounded v3 pipeline."""

from __future__ import annotations

from dataclasses import FrozenInstanceError, fields
import hashlib
import inspect
import struct
import unittest
from unittest.mock import patch

from verifier.errors import Blocker, VerificationBlocked
from verifier.postprojection import PostprojectionLevelReplay, PostprojectionMathReplay
from verifier.v3_inputs import N32_INVENTORY, N32Observation
from verifier.v3_pipeline import (
    CandidatePStageResult,
    FirstMismatch,
    NumericMaterializationStageResult,
    V3PipelineResult,
    run_v3_candidate_pipeline,
)
import verifier.v3_pipeline as pipeline


_LEVELS = (
    ("L0", 64, 32),
    ("L1", 96, 48),
    ("L2", 128, 64),
)


class _AlwaysEqual:
    def __init__(self) -> None:
        self.comparisons = 0

    def __eq__(self, _other: object) -> bool:
        self.comparisons += 1
        return True


def _changed_f64le(payload: bytes, element_index: int) -> bytes:
    result = bytearray(payload)
    # Smallest positive subnormal: finite, canonical, and byte-distinct.
    struct.pack_into("<Q", result, 8 * element_index, 1)
    return bytes(result)


def _level(
    level_id: str,
    radial: int,
    angular: int,
    *,
    scalar_multipole_mismatch: bool = False,
    potential_multipole_mismatch: bool = False,
    scalar_base_mismatch: bool = False,
    potential_base_mismatch: bool = False,
    mask_mismatch: str | None = None,
) -> PostprojectionLevelReplay:
    modes = angular // 2
    scalar_multipoles = bytes(8 * radial * modes)
    potential_multipoles = bytes(8 * radial * modes)
    scalar_base = bytes(8 * radial * angular)
    potential_base = bytes(8 * radial * angular)
    if scalar_multipole_mismatch:
        scalar_multipoles = _changed_f64le(scalar_multipoles, modes)
    if potential_multipole_mismatch:
        potential_multipoles = _changed_f64le(potential_multipoles, 0)
    if scalar_base_mismatch:
        scalar_base = _changed_f64le(scalar_base, angular)
    if potential_base_mismatch:
        potential_base = _changed_f64le(potential_base, 0)
    if mask_mismatch == "scalar_multipole":
        scalar_multipoles = _changed_f64le(scalar_multipoles, 0)
    elif mask_mismatch == "potential_multipole":
        potential_multipoles = _changed_f64le(
            potential_multipoles, (radial - 1) * modes
        )
    elif mask_mismatch == "scalar_base":
        scalar_base = _changed_f64le(scalar_base, 0)
    elif mask_mismatch == "potential_base":
        potential_base = _changed_f64le(
            potential_base, (radial - 1) * angular
        )
    elif mask_mismatch is not None:
        raise AssertionError(mask_mismatch)

    scalar_multipole_match = not scalar_multipole_mismatch
    potential_multipole_match = not potential_multipole_mismatch
    scalar_base_match = not scalar_base_mismatch
    potential_base_match = not potential_base_mismatch
    masks_positive = mask_mismatch is None
    all_matches = (
        scalar_multipole_match
        and potential_multipole_match
        and scalar_base_match
        and potential_base_match
        and masks_positive
    )
    return PostprojectionLevelReplay(
        level_id=level_id,
        radial_node_count=radial,
        angular_node_count=angular,
        mode_count=modes,
        provisional_a1_bits="3ff0000000000000",
        final_a1_bits="3ff0000000000000",
        phase_sign=1,
        computed_scalar_multipole_bytes=scalar_multipoles,
        computed_potential_multipole_bytes=potential_multipoles,
        computed_scalar_base_bytes=scalar_base,
        computed_potential_base_bytes=potential_base,
        scalar_multipole_match=scalar_multipole_match,
        potential_multipole_match=potential_multipole_match,
        scalar_base_match=scalar_base_match,
        potential_base_match=potential_base_match,
        all_symbolic_masks_positive_zero=masks_positive,
        all_matches=all_matches,
    )


def _matching_replay() -> PostprojectionMathReplay:
    levels = tuple(_level(*profile) for profile in _LEVELS)
    return PostprojectionMathReplay(levels=levels, all_levels_match=True)


def _replay_with_levels(
    levels: tuple[PostprojectionLevelReplay, ...]
) -> PostprojectionMathReplay:
    return PostprojectionMathReplay(levels=levels, all_levels_match=False)


def _n32(
    overrides: dict[int, bytes] | None = None,
) -> tuple[N32Observation, ...]:
    replacements = {} if overrides is None else overrides
    observations: list[N32Observation] = []
    for spec in N32_INVENTORY:
        raw = replacements.get(spec.inventory_index, bytes(spec.byte_length))
        if len(raw) != spec.byte_length:
            raise AssertionError(spec.relative_path)
        observations.append(
            N32Observation(
                inventory_index=spec.inventory_index,
                path=spec.canonical_absolute_path,
                relative_path=spec.relative_path,
                byte_length=spec.byte_length,
                plain_sha256=hashlib.sha256(raw).hexdigest(),
                device_id=1,
                inode=spec.inventory_index + 1,
                mode=0,
                mode_file_type=0,
                link_count=1,
                mtime_nanoseconds=1,
                ctime_nanoseconds=1,
                raw_bytes=raw,
                security_profile="test_only_non_authoritative",
            )
        )
    return tuple(observations)


def _p_rejection() -> CandidatePStageResult:
    return CandidatePStageResult(
        disposition="rejection",
        replay=None,
        failure_code="runtime_binding_mismatch",
        diagnostic_code="fixture_rejection",
        first_mismatch=FirstMismatch(
            level_id=None,
            field="runtime",
            radial_index=None,
            mode_or_angular_index=None,
            byte_offset=None,
        ),
    )


class V3PipelineChronologyTests(unittest.TestCase):
    def test_public_api_is_only_backend_n32_r6_and_calls_real_p_symbol(self) -> None:
        signature = inspect.signature(run_v3_candidate_pipeline)
        self.assertEqual(tuple(signature.parameters), ("backend", "n32", "r6"))
        self.assertTrue(
            all(
                parameter.default is inspect.Parameter.empty
                for parameter in signature.parameters.values()
            )
        )
        backend = object()
        n32 = _n32()
        r6 = ()
        replay = _matching_replay()
        with patch.object(
            pipeline, "replay_postprojection_math", return_value=replay
        ) as replay_call:
            result = run_v3_candidate_pipeline(backend, n32, r6)  # type: ignore[arg-type]
        replay_call.assert_called_once_with(backend, n32, r6)
        self.assertEqual(result.outcome, "P_match_N_rejection")
        self.assertIsNot(result.candidate_p.replay, replay)
        self.assertTrue(
            all(
                left is not right
                for left, right in zip(
                    result.candidate_p.replay.levels,
                    replay.levels,
                    strict=True,
                )
            )
        )
        object.__setattr__(replay, "physical_claim_allowed", True)
        object.__setattr__(
            replay.levels[0],
            "computed_scalar_multipole_bytes",
            _changed_f64le(
                replay.levels[0].computed_scalar_multipole_bytes,
                replay.levels[0].mode_count,
            ),
        )
        self.assertIs(result.candidate_p.replay.physical_claim_allowed, False)
        self.assertEqual(
            result.candidate_p.replay.levels[0].computed_scalar_multipole_bytes,
            bytes(8 * 64 * 16),
        )

    def test_p_blocked_rejection_short_circuits_n_and_f(self) -> None:
        events: list[str] = []

        def rejected_p(*_args: object) -> PostprojectionMathReplay:
            events.append("P")
            raise VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="negative_zero_forbidden",
                    detail="L1:raw_scalar:7",
                )
            )

        def forbidden_n(*_args: object) -> NumericMaterializationStageResult:
            events.append("N")
            raise AssertionError("N must not run")

        def forbidden_f() -> None:
            events.append("F")
            raise AssertionError("F must not run")

        with (
            patch.object(pipeline, "replay_postprojection_math", side_effect=rejected_p),
            patch.object(
                pipeline,
                "_numeric_materialization_unimplemented",
                side_effect=forbidden_n,
            ),
            patch.object(pipeline, "_attempt_full_seed_gate", side_effect=forbidden_f),
        ):
            result = run_v3_candidate_pipeline(object(), (), ())  # type: ignore[arg-type]

        self.assertEqual(events, ["P"])
        self.assertEqual(result.outcome, "P_rejection")
        self.assertEqual(result.attempted_stages, ("P",))
        self.assertEqual(result.candidate_p.failure_code, "raw_evidence_negative_zero")
        self.assertEqual(
            result.candidate_p.first_mismatch,
            FirstMismatch("L1", "raw_evidence", 0, 7, None),
        )
        self.assertIsNone(result.candidate_n)
        self.assertIsNone(result.candidate_f)
        self.assertFalse(result.n_attempted)
        self.assertFalse(result.f_attempted)

    def test_unexpected_p_exception_is_deterministic_and_short_circuits(self) -> None:
        with (
            patch.object(
                pipeline,
                "replay_postprojection_math",
                side_effect=RuntimeError("host-dependent message one"),
            ),
            patch.object(
                pipeline, "_numeric_materialization_unimplemented"
            ) as numeric_call,
            patch.object(pipeline, "_attempt_full_seed_gate") as full_gate_call,
        ):
            first = run_v3_candidate_pipeline(object(), (), ())  # type: ignore[arg-type]
        with patch.object(
            pipeline,
            "replay_postprojection_math",
            side_effect=ValueError("host-dependent message two"),
        ):
            second = run_v3_candidate_pipeline(object(), (), ())  # type: ignore[arg-type]
        self.assertEqual(first, second)
        self.assertEqual(first.outcome, "P_unformable")
        self.assertIsNone(first.candidate_p.failure_code)
        self.assertEqual(
            first.candidate_p.diagnostic_code,
            "postprojection_unexpected_exception",
        )
        numeric_call.assert_not_called()
        full_gate_call.assert_not_called()

    def test_forged_or_mutated_replay_is_unformable_and_stops(self) -> None:
        mutated_level = _matching_replay()
        object.__setattr__(mutated_level.levels[0], "all_matches", False)

        unlocked_nested_claim = _matching_replay()
        object.__setattr__(unlocked_nested_claim, "physical_claim_allowed", True)

        flags_disagree_with_bytes = _matching_replay()
        l0 = flags_disagree_with_bytes.levels[0]
        object.__setattr__(
            l0,
            "computed_scalar_multipole_bytes",
            _changed_f64le(l0.computed_scalar_multipole_bytes, l0.mode_count),
        )

        missing_slots = object.__new__(PostprojectionMathReplay)
        for label, replay in (
            ("mutated_level", mutated_level),
            ("unlocked_nested_claim", unlocked_nested_claim),
            ("flags_disagree_with_bytes", flags_disagree_with_bytes),
            ("missing_slots", missing_slots),
        ):
            with (
                self.subTest(label=label),
                patch.object(
                    pipeline, "replay_postprojection_math", return_value=replay
                ),
                patch.object(
                    pipeline, "_numeric_materialization_unimplemented"
                ) as numeric_call,
                patch.object(pipeline, "_attempt_full_seed_gate") as full_gate_call,
            ):
                result = run_v3_candidate_pipeline(
                    object(), _n32(), ()  # type: ignore[arg-type]
                )
            self.assertEqual(result.outcome, "P_unformable")
            self.assertEqual(result.candidate_p.disposition, "unformable")
            self.assertIsNone(result.candidate_p.failure_code)
            self.assertEqual(
                result.candidate_p.diagnostic_code,
                "postprojection_replay_snapshot_invalid",
            )
            self.assertIsNone(result.candidate_p.replay)
            self.assertFalse(result.n_attempted)
            self.assertFalse(result.f_attempted)
            self.assertTrue(
                all(value is False for value in result.authority_locks.values())
            )
            numeric_call.assert_not_called()
            full_gate_call.assert_not_called()

    def test_huge_mutated_dimensions_stop_before_mask_iteration(self) -> None:
        replay = _matching_replay()
        object.__setattr__(replay.levels[0], "radial_node_count", 10**30)
        with (
            patch.object(
                pipeline, "replay_postprojection_math", return_value=replay
            ),
            patch.object(pipeline, "_mask_indices") as mask_indices,
            patch.object(
                pipeline, "_numeric_materialization_unimplemented"
            ) as numeric_call,
            patch.object(pipeline, "_attempt_full_seed_gate") as full_gate_call,
        ):
            result = run_v3_candidate_pipeline(
                object(), _n32(), ()  # type: ignore[arg-type]
            )
        self.assertEqual(result.outcome, "P_unformable")
        self.assertEqual(
            result.candidate_p.diagnostic_code,
            "postprojection_replay_snapshot_invalid",
        )
        mask_indices.assert_not_called()
        numeric_call.assert_not_called()
        full_gate_call.assert_not_called()

    def test_malformed_or_contextless_blocker_is_diagnostic_only(self) -> None:
        missing_blocker = VerificationBlocked.__new__(VerificationBlocked)
        blockers: tuple[BaseException, ...] = (
            VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="negative_zero_forbidden",
                    detail=None,  # type: ignore[arg-type]
                )
            ),
            missing_blocker,
            VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="nonpositive_cholesky_pivot",
                    detail="0",
                )
            ),
            VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="negative_zero_forbidden",
                    detail="x" * 4097,
                )
            ),
            VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="r6_observation_inventory_mismatch",
                    detail="not-a-frozen-inventory-path",
                )
            ),
        )
        for error in blockers:
            with (
                self.subTest(error=type(error).__name__),
                patch.object(
                    pipeline, "replay_postprojection_math", side_effect=error
                ),
                patch.object(
                    pipeline, "_numeric_materialization_unimplemented"
                ) as numeric_call,
                patch.object(pipeline, "_attempt_full_seed_gate") as full_gate_call,
            ):
                result = run_v3_candidate_pipeline(
                    object(), (), ()  # type: ignore[arg-type]
                )
            self.assertEqual(result.outcome, "P_unformable")
            self.assertIsNone(result.candidate_p.failure_code)
            self.assertEqual(
                result.candidate_p.diagnostic_code,
                "postprojection_blocker_unformable",
            )
            numeric_call.assert_not_called()
            full_gate_call.assert_not_called()

    def test_raw_flat_index_maps_to_radial_and_angular_coordinates(self) -> None:
        with patch.object(
            pipeline,
            "replay_postprojection_math",
            side_effect=VerificationBlocked(
                Blocker(
                    phase="postprojection",
                    code="finite_binary64_required",
                    detail="L1:raw_potential:1550",
                )
            ),
        ):
            result = run_v3_candidate_pipeline(
                object(), (), ()  # type: ignore[arg-type]
            )
        self.assertEqual(result.outcome, "P_rejection")
        self.assertEqual(result.candidate_p.failure_code, "raw_evidence_nonfinite")
        self.assertEqual(
            result.candidate_p.first_mismatch,
            FirstMismatch("L1", "raw_evidence", 32, 14, None),
        )

    def test_complete_byte_mismatch_has_exact_first_coordinate_and_stops(self) -> None:
        levels = (
            _level("L0", 64, 32, scalar_multipole_mismatch=True),
            _level("L1", 96, 48),
            _level("L2", 128, 64),
        )
        replay = _replay_with_levels(levels)
        with (
            patch.object(pipeline, "replay_postprojection_math", return_value=replay),
            patch.object(
                pipeline, "_numeric_materialization_unimplemented"
            ) as numeric_call,
            patch.object(pipeline, "_attempt_full_seed_gate") as full_gate_call,
        ):
            result = run_v3_candidate_pipeline(object(), _n32(), ())  # type: ignore[arg-type]
        self.assertEqual(result.outcome, "P_rejection")
        self.assertEqual(
            result.candidate_p.failure_code, "scalar_multipole_byte_mismatch"
        )
        self.assertEqual(
            result.candidate_p.first_mismatch,
            FirstMismatch("L0", "scalar", 1, 0, 0),
        )
        numeric_call.assert_not_called()
        full_gate_call.assert_not_called()

    def test_failure_code_precedence_is_before_level_order(self) -> None:
        levels = (
            _level("L0", 64, 32, potential_multipole_mismatch=True),
            _level("L1", 96, 48, scalar_multipole_mismatch=True),
            _level("L2", 128, 64),
        )
        replay = _replay_with_levels(levels)
        with patch.object(
            pipeline, "replay_postprojection_math", return_value=replay
        ):
            result = run_v3_candidate_pipeline(object(), _n32(), ())  # type: ignore[arg-type]
        self.assertEqual(
            result.candidate_p.failure_code, "scalar_multipole_byte_mismatch"
        )
        self.assertEqual(result.candidate_p.first_mismatch.level_id, "L1")

    def test_multipole_mask_precedes_base_byte_mismatch(self) -> None:
        l0 = _level("L0", 64, 32, scalar_base_mismatch=True)
        l1 = _level("L1", 96, 48, mask_mismatch="potential_multipole")
        l2 = _level("L2", 128, 64)
        # Make the expected N32 multipoles equal the non-zero masked replay so
        # this is a pure mask failure rather than an earlier byte mismatch.
        overrides = {15: l1.computed_potential_multipole_bytes}
        replay = _replay_with_levels((l0, l1, l2))
        with patch.object(
            pipeline, "replay_postprojection_math", return_value=replay
        ):
            result = run_v3_candidate_pipeline(
                object(), _n32(overrides), ()  # type: ignore[arg-type]
            )
        self.assertEqual(
            result.candidate_p.failure_code,
            "potential_multipole_mask_mismatch",
        )
        self.assertEqual(
            result.candidate_p.first_mismatch,
            FirstMismatch("L1", "potential", 95, 0, 0),
        )

    def test_p_match_runs_only_n_and_returns_sealed_numeric_failure_code(self) -> None:
        events: list[str] = []
        replay = _matching_replay()

        def matched_p(*_args: object) -> PostprojectionMathReplay:
            events.append("P")
            return replay

        def rejected_n(
            candidate_p: CandidatePStageResult,
        ) -> NumericMaterializationStageResult:
            events.append("N")
            self.assertEqual(candidate_p.disposition, "match")
            return NumericMaterializationStageResult()

        def forbidden_f() -> None:
            events.append("F")
            raise AssertionError("F must not run")

        with (
            patch.object(pipeline, "replay_postprojection_math", side_effect=matched_p),
            patch.object(
                pipeline,
                "_numeric_materialization_unimplemented",
                side_effect=rejected_n,
            ),
            patch.object(pipeline, "_attempt_full_seed_gate", side_effect=forbidden_f),
        ):
            result = run_v3_candidate_pipeline(
                object(), _n32(), ()  # type: ignore[arg-type]
            )

        self.assertEqual(events, ["P", "N"])
        self.assertEqual(result.outcome, "P_match_N_rejection")
        self.assertEqual(result.attempted_stages, ("P", "N"))
        self.assertEqual(
            result.candidate_n.failure_code,
            "expected_array_materialization_failed",
        )
        self.assertEqual(
            result.candidate_n.detail_code,
            "numeric_materialization_unimplemented",
        )
        self.assertEqual(
            result.candidate_n.detail_sha256,
            hashlib.sha256(b"numeric_materialization_unimplemented").hexdigest(),
        )
        self.assertIsNone(result.candidate_f)
        self.assertTrue(result.n_attempted)
        self.assertFalse(result.f_attempted)


class V3PipelineInvariantTests(unittest.TestCase):
    def test_result_is_deeply_immutable_and_every_lock_is_false(self) -> None:
        replay = _matching_replay()
        with patch.object(
            pipeline, "replay_postprojection_math", return_value=replay
        ):
            result = run_v3_candidate_pipeline(
                object(), _n32(), ()  # type: ignore[arg-type]
            )
        with self.assertRaises(FrozenInstanceError):
            result.outcome = "P_rejection"  # type: ignore[misc]
        with self.assertRaises(FrozenInstanceError):
            result.candidate_n.failure_code = (  # type: ignore[misc,union-attr]
                "candidate_array_byte_mismatch"
            )
        with self.assertRaises(TypeError):
            result.authority_locks["artifactAccepted"] = True  # type: ignore[index]
        self.assertGreaterEqual(len(result.authority_locks), 30)
        self.assertTrue(all(value is False for value in result.authority_locks.values()))
        for lock in (
            "artifactAccepted",
            "seedAccepted",
            "physicalViabilityEstablished",
            "authoritativeRegistrationAllowed",
            "scientificAdmissionGranted",
            "successorV3CandidatePostprojectionMathMatched",
            "successorV3CandidateNumericMaterializationMatched",
            "successorV3CandidateFullSeedGateEvidenceCompleted",
            "successorV3FinalArtifactAccepted",
        ):
            self.assertIs(result.authority_locks[lock], False)
        for direct_lock in (
            "replay_bundle_emitted",
            "broker_same_attempt_established",
            "runtime_isolation_established",
            "authoritative_registration_allowed",
            "scientific_admission_granted",
            "seed_admission_granted",
            "artifact_admission_granted",
            "physical_claim_allowed",
            "propulsion_claim_allowed",
            "transport_claim_allowed",
        ):
            self.assertIs(getattr(result, direct_lock), False)

    def test_hostile_equal_objects_cannot_satisfy_exact_invariants(self) -> None:
        hostile = _AlwaysEqual()
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_candidate_p_disposition_required"
        ):
            CandidatePStageResult(
                disposition=hostile,  # type: ignore[arg-type]
                replay=None,
                failure_code="runtime_binding_mismatch",
                diagnostic_code="hostile",
                first_mismatch=FirstMismatch(None, "runtime", None, None, None),
            )
        self.assertEqual(hostile.comparisons, 0)

        hostile = _AlwaysEqual()
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_unimplemented_numeric_rejection_required"
        ):
            NumericMaterializationStageResult(failure_code=hostile)  # type: ignore[arg-type]
        self.assertEqual(hostile.comparisons, 0)

        hostile = _AlwaysEqual()
        with self.assertRaisesRegex(
            VerificationBlocked, "exact_pipeline_result_profile_required"
        ):
            V3PipelineResult(
                outcome=hostile,  # type: ignore[arg-type]
                candidate_p=_p_rejection(),
                candidate_n=None,
                candidate_f=None,
                attempted_stages=("P",),
            )
        self.assertEqual(hostile.comparisons, 0)

    def test_first_mismatch_has_independently_nullable_safe_coordinates(self) -> None:
        self.assertEqual(
            FirstMismatch("L2", "scalar", None, 31, None),
            FirstMismatch("L2", "scalar", None, 31, None),
        )
        self.assertEqual(
            FirstMismatch("L0", "potential", 1, None, 8),
            FirstMismatch("L0", "potential", 1, None, 8),
        )
        for mismatch in (
            dict(
                level_id="L0",
                field="scalar",
                radial_index=True,
                mode_or_angular_index=0,
                byte_offset=0,
            ),
            dict(
                level_id=None,
                field="runtime",
                radial_index=0,
                mode_or_angular_index=0,
                byte_offset=0,
            ),
            dict(
                level_id="L0",
                field="scalar",
                radial_index=-1,
                mode_or_angular_index=None,
                byte_offset=None,
            ),
            dict(
                level_id="L0",
                field="scalar",
                radial_index=None,
                mode_or_angular_index=None,
                byte_offset=9_007_199_254_740_992,
            ),
        ):
            with self.subTest(mismatch=mismatch), self.assertRaisesRegex(
                VerificationBlocked, "exact_first_mismatch_shape_required"
            ):
                FirstMismatch(**mismatch)  # type: ignore[arg-type]

    def test_result_profiles_reject_mixed_or_authoritative_states(self) -> None:
        rejected_p = _p_rejection()
        matched_p = CandidatePStageResult(
            disposition="match",
            replay=_matching_replay(),
            failure_code=None,
            diagnostic_code=None,
            first_mismatch=None,
        )
        invalid_profiles = (
            dict(
                outcome="P_rejection",
                candidate_p=matched_p,
                candidate_n=None,
                candidate_f=None,
                attempted_stages=("P",),
            ),
            dict(
                outcome="P_match_N_rejection",
                candidate_p=rejected_p,
                candidate_n=NumericMaterializationStageResult(),
                candidate_f=None,
                attempted_stages=("P", "N"),
            ),
            dict(
                outcome="P_rejection",
                candidate_p=rejected_p,
                candidate_n=None,
                candidate_f=None,
                attempted_stages=("P", "N"),
            ),
            dict(
                outcome="P_rejection",
                candidate_p=rejected_p,
                candidate_n=None,
                candidate_f=None,
                attempted_stages=("P",),
                artifact_admission_granted=True,
            ),
        )
        for profile in invalid_profiles:
            with self.subTest(profile=profile), self.assertRaisesRegex(
                VerificationBlocked, "exact_pipeline_result_profile_required"
            ):
                V3PipelineResult(**profile)  # type: ignore[arg-type]

    def test_stage_values_do_not_expose_fabricated_receipt_fields(self) -> None:
        stage_field_names = {
            field.name
            for stage_type in (
                CandidatePStageResult,
                NumericMaterializationStageResult,
                V3PipelineResult,
            )
            for field in fields(stage_type)
        }
        self.assertFalse(
            any("receipt" in field_name.lower() for field_name in stage_field_names),
            stage_field_names,
        )
        self.assertFalse(
            any("binding" in field_name.lower() for field_name in stage_field_names),
            stage_field_names,
        )


if __name__ == "__main__":
    unittest.main()
