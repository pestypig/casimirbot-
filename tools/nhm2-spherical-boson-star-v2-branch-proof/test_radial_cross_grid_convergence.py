from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
import math
from pathlib import Path
import struct
import sys
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import radial_cross_grid_convergence as convergence  # noqa: E402
from radial_cross_grid_convergence import (  # noqa: E402
    BRANCH_SELECTION_CONTRACT_BINDING,
    COMPONENT_ORDER,
    FrozenRadialLevelState,
    LEVEL_NODE_COUNTS,
    PACKED_STATE_ORDER,
    PAIR_IDS,
    PROJECTED_FIELDS,
    SOURCE_BYTE_BINDINGS,
    authenticated_lobatto_rho_snapshot,
    evaluate_radial_cross_grid_convergence,
    radial_cross_grid_receipt_grants_authority,
)


REPOSITORY_ROOT = HERE.parents[1]


def _word(value: float) -> str:
    return struct.pack(">d", value).hex()


def _constant_values(node_count: int, value: float = 0.0) -> tuple[float, ...]:
    return (value,) * node_count


def _state(
    node_count: int,
    *,
    F0: tuple[float, ...] | None = None,
    F1: tuple[float, ...] | None = None,
    varphi: tuple[float, ...] | None = None,
    w: float = 0.0,
) -> FrozenRadialLevelState:
    return FrozenRadialLevelState(
        rho=authenticated_lobatto_rho_snapshot(node_count),
        F0=_constant_values(node_count) if F0 is None else F0,
        F1=_constant_values(node_count) if F1 is None else F1,
        varphi=_constant_values(node_count) if varphi is None else varphi,
        w=w,
    )


def _states() -> tuple[FrozenRadialLevelState, ...]:
    return tuple(_state(node_count) for node_count in LEVEL_NODE_COUNTS)


def _evaluate(
    states: tuple[FrozenRadialLevelState, ...],
):
    return evaluate_radial_cross_grid_convergence(
        level_64=states[0],
        level_96=states[1],
        level_128=states[2],
        level_256=states[3],
    )


def _replace_state(
    states: tuple[FrozenRadialLevelState, ...],
    index: int,
    **changes: object,
) -> tuple[FrozenRadialLevelState, ...]:
    output = list(states)
    output[index] = replace(output[index], **changes)
    return tuple(output)


class RadialCrossGridConvergenceTests(unittest.TestCase):
    def test_exact_contract_dependency_and_snapshot_bindings(self) -> None:
        self.assertEqual(
            BRANCH_SELECTION_CONTRACT_BINDING.raw_source.sha256,
            "d20e6eeef3d185ff938aa27cc83af87a201d76f986c63d77e0dbe72cf8600c82",
        )
        self.assertEqual(
            BRANCH_SELECTION_CONTRACT_BINDING.raw_source.size_bytes,
            44_912,
        )
        self.assertEqual(
            BRANCH_SELECTION_CONTRACT_BINDING.semantic_sha256,
            "221af0c6b9f858d20ca2f89c5e4eedf14a0c64ede9ff39e60077b79f08ad9aaa",
        )
        self.assertEqual(
            BRANCH_SELECTION_CONTRACT_BINDING.canonical_size_bytes,
            41_280,
        )
        self.assertEqual(
            BRANCH_SELECTION_CONTRACT_BINDING.plain_canonical_sha256,
            "913b9d524071c20669e8f0abfd838ef6daa7b2e17b1bd5775a1fafc1e2282962",
        )
        self.assertEqual(
            tuple(binding.sha256 for binding in SOURCE_BYTE_BINDINGS[1:]),
            (
                "ec973351fa34efd1c76b3358e6b87da91688a06a648e5299d0aa800767e11a47",
                "ea424885abed4788d989cd228b7c4dd7b8907909bd4a0931b2e009d021d4d385",
            ),
        )
        for binding in SOURCE_BYTE_BINDINGS:
            path = REPOSITORY_ROOT.joinpath(*binding.relative_path.split("/"))
            payload = path.read_bytes()
            self.assertEqual(len(payload), binding.size_bytes)
            self.assertEqual(hashlib.sha256(payload).hexdigest(), binding.sha256)

        expected_snapshot_hashes = {
            64: "d23d0163fd585a960572b78e44fbd09e66b073de71015cf1c56bb56e8c3ef65f",
            96: "fc1f48f84af4153e53d5b7297f5f86d923aa2b0fc604a21e23e058c75f73919a",
            128: "fc2db55f9a24286758f73937f09a216335e042679682d08c74a2610461abbbe0",
            256: "94393bd4b9991020887813a197b7aa1417a6aa174af4070ac3b8e2ac2bc9426a",
        }
        for node_count, expected_hash in expected_snapshot_hashes.items():
            rho = authenticated_lobatto_rho_snapshot(node_count)
            bits = b"".join(struct.pack(">d", value) for value in rho)
            digest = hashlib.sha256()
            digest.update(b"nhm2-radial-lobatto-rho-binary64-snapshot/v1\n")
            digest.update(struct.pack(">I", node_count))
            digest.update(bits)
            self.assertEqual(digest.hexdigest(), expected_hash)
            self.assertEqual(_word(rho[0]), "0000000000000000")
            self.assertEqual(_word(rho[-1]), "3ff0000000000000")
            self.assertTrue(
                all(rho[index] > rho[index - 1] for index in range(1, node_count))
            )

    def test_constant_and_low_degree_projection_on_frozen_grids(self) -> None:
        coarse = authenticated_lobatto_rho_snapshot(64)
        fine = authenticated_lobatto_rho_snapshot(96)
        instructions = convergence._projection_instructions(coarse, fine)

        constant = (1.25,) * 64
        projected_constant = convergence._apply_projection(constant, instructions)
        self.assertLessEqual(
            max(abs(value - 1.25) for value in projected_constant),
            3.0e-15,
        )

        def polynomial(rho: float) -> float:
            return 0.25 - 0.5 * rho + 0.75 * rho * rho - rho * rho * rho

        coarse_polynomial = tuple(polynomial(rho) for rho in coarse)
        expected = tuple(polynomial(rho) for rho in fine)
        projected = convergence._apply_projection(coarse_polynomial, instructions)
        self.assertLessEqual(
            max(abs(left - right) for left, right in zip(projected, expected, strict=True)),
            8.0e-15,
        )
        self.assertEqual(_word(projected[0]), _word(coarse_polynomial[0]))
        self.assertEqual(_word(projected[-1]), _word(coarse_polynomial[-1]))

    def test_endpoint_weights_scale_tie_and_ascending_term_order(self) -> None:
        self.assertEqual(
            convergence._barycentric_weights(4),
            (0.5, -1.0, 1.0, -0.5),
        )
        tied = convergence._projection_instruction(
            (0.0, 1.0),
            convergence._barycentric_weights(2),
            0.5,
        )
        self.assertIsNone(tied.exact_source_ordinal)
        self.assertEqual(tied.scale_ordinal, 0)
        self.assertEqual(tied.scaled_terms, (1.0, 1.0))
        self.assertEqual(tied.denominator, 2.0)

        ordered = convergence._projection_instruction(
            (0.0, 0.5, 1.0),
            convergence._barycentric_weights(3),
            0.25,
        )
        self.assertEqual(ordered.scale_ordinal, 1)
        self.assertEqual(ordered.scaled_terms, (0.5, 1.0, -1.0 / 6.0))
        self.assertIn("terms_created_j_ascending", convergence.PROJECTION_OPERATION_GRAPH)
        self.assertIn("lowest_j", convergence.PROJECTION_OPERATION_GRAPH)

    def test_exact_hit_copy_and_projected_positive_zero(self) -> None:
        coarse = authenticated_lobatto_rho_snapshot(64)
        fine = authenticated_lobatto_rho_snapshot(96)
        instructions = convergence._projection_instructions(coarse, fine)
        self.assertEqual(instructions[0].exact_source_ordinal, 0)
        self.assertEqual(instructions[-1].exact_source_ordinal, 63)
        self.assertEqual(
            sum(item.exact_source_ordinal is not None for item in instructions),
            2,
        )
        source = (0.0,) * 64
        projected = convergence._apply_projection(source, instructions)
        self.assertTrue(all(_word(value) == "0000000000000000" for value in projected))

    def test_zero_states_pass_with_bounded_deterministic_receipt_and_ties(self) -> None:
        states = _states()
        left = _evaluate(states)
        right = _evaluate(states)
        self.assertEqual(left, right)
        self.assertEqual(left.state_packing_order, PACKED_STATE_ORDER)
        self.assertEqual(left.projected_fields, PROJECTED_FIELDS)
        self.assertEqual(left.component_order, COMPONENT_ORDER)
        self.assertEqual(left.pair_order, PAIR_IDS)
        self.assertEqual(len(left.level_inputs), 4)
        self.assertEqual(len(left.pairs), 3)
        self.assertTrue(all(len(pair.components) == 4 for pair in left.pairs))
        self.assertTrue(left.all_pairs_within_tolerance)
        self.assertIsNone(left.first_failing_pair_index)
        self.assertIsNone(left.first_failing_pair_id)
        self.assertEqual(left.maximum_pair_index, 0)
        self.assertEqual(left.maximum_pair_id, "64_to_96")
        self.assertEqual(left.overall_normalized_linf_binary64_word, "0000000000000000")
        self.assertEqual(
            left.diagnostic_disposition,
            "all_three_pairs_within_frozen_tolerances_diagnostic_only",
        )
        for pair in left.pairs:
            self.assertEqual(pair.projection_exact_hit_count, 2)
            self.assertEqual(
                pair.projection_exact_hit_count + pair.projection_interpolated_count,
                pair.fine_node_count,
            )
            self.assertEqual(pair.maximum_component_ordinal, 0)
            self.assertEqual(pair.maximum_component, "F0")
            self.assertIsNone(pair.first_failing_component)
            self.assertTrue(all(component.passed for component in pair.components))
            self.assertTrue(
                all(
                    component.normalized_linf_binary64_word == "0000000000000000"
                    for component in pair.components
                )
            )
        for value in (
            left.combined_input_sha256,
            left.calculation_receipt_sha256,
            *(pair.projection_geometry_sha256 for pair in left.pairs),
            *(pair.projected_fields_sha256 for pair in left.pairs),
        ):
            self.assertEqual(len(value), 64)
            int(value, 16)

    def test_hostile_outer_objects_fail_before_property_traversal(self) -> None:
        observations = {"reads": 0}

        class Hostile:
            @property
            def rho(self):
                observations["reads"] += 1
                raise AssertionError("hostile property traversed")

        states = _states()
        with self.assertRaises(TypeError):
            evaluate_radial_cross_grid_convergence(
                level_64=Hostile(),  # type: ignore[arg-type]
                level_96=states[1],
                level_128=states[2],
                level_256=states[3],
            )
        self.assertEqual(observations["reads"], 0)

        class Derived(FrozenRadialLevelState):
            pass

        derived = Derived(
            states[0].rho,
            states[0].F0,
            states[0].F1,
            states[0].varphi,
            states[0].w,
        )
        with self.assertRaises(TypeError):
            evaluate_radial_cross_grid_convergence(
                level_64=derived,
                level_96=states[1],
                level_128=states[2],
                level_256=states[3],
            )

    def test_wrong_builtin_shapes_values_and_grids_fail_closed(self) -> None:
        states = _states()
        bad_cases: list[tuple[str, tuple[FrozenRadialLevelState, ...]]] = []
        bad_cases.append(
            (
                "list_field",
                _replace_state(states, 0, F0=list(states[0].F0)),  # type: ignore[arg-type]
            )
        )
        bad_cases.append(("short_field", _replace_state(states, 1, F1=states[1].F1[:-1])))
        integer_field = list(states[2].varphi)
        integer_field[4] = 0  # exact int is forbidden even though numerically finite
        bad_cases.append(("integer_field", _replace_state(states, 2, varphi=tuple(integer_field))))
        bad_cases.append(("integer_w", _replace_state(states, 3, w=1)))  # type: ignore[arg-type]
        bad_cases.append(
            (
                "list_rho",
                _replace_state(states, 0, rho=list(states[0].rho)),  # type: ignore[arg-type]
            )
        )
        shifted_rho = list(states[1].rho)
        shifted_rho[1] = math.nextafter(shifted_rho[1], math.inf)
        bad_cases.append(("wrong_grid_bit", _replace_state(states, 1, rho=tuple(shifted_rho))))
        reversed_rho = list(states[2].rho)
        reversed_rho[4], reversed_rho[5] = reversed_rho[5], reversed_rho[4]
        bad_cases.append(("wrong_grid_order", _replace_state(states, 2, rho=tuple(reversed_rho))))
        for name, bad in bad_cases:
            with self.subTest(name=name), self.assertRaises((TypeError, ValueError)):
                _evaluate(bad)

        for bad_count in (True, 63, 64.0, "64", None):
            with self.subTest(bad_count=bad_count), self.assertRaises(ValueError):
                authenticated_lobatto_rho_snapshot(bad_count)  # type: ignore[arg-type]

    def test_negative_zero_and_nonfinite_inputs_fail_closed(self) -> None:
        states = _states()
        for field_name in ("rho", "F0", "F1", "varphi"):
            values = list(getattr(states[0], field_name))
            values[0] = -0.0
            bad = _replace_state(states, 0, **{field_name: tuple(values)})
            with self.subTest(
                field=field_name, case="negative_zero"
            ), self.assertRaises(ValueError):
                _evaluate(bad)
        for field_name in ("F0", "F1", "varphi"):
            for invalid in (math.nan, math.inf, -math.inf):
                values = list(getattr(states[2], field_name))
                values[7] = invalid
                bad = _replace_state(states, 2, **{field_name: tuple(values)})
                with self.subTest(field=field_name, invalid=invalid), self.assertRaises(ValueError):
                    _evaluate(bad)
        for invalid_w in (-0.0, math.nan, math.inf, -math.inf):
            with self.subTest(w=invalid_w), self.assertRaises(ValueError):
                _evaluate(_replace_state(states, 3, w=invalid_w))

    def test_exact_tolerance_boundary_and_nextafter_failure(self) -> None:
        states = _states()
        tolerance = convergence._component_tolerance("w")
        boundary = tolerance.absolute / (1.0 - tolerance.relative)
        passing = _evaluate(_replace_state(states, 3, w=boundary))
        result = passing.pairs[2].components[3]
        self.assertEqual(result.component, "w")
        self.assertEqual(result.normalized_linf, 1.0)
        self.assertEqual(result.normalized_linf_binary64_word, "3ff0000000000000")
        self.assertTrue(result.passed)
        self.assertTrue(passing.all_pairs_within_tolerance)

        failing_value = math.nextafter(boundary, math.inf)
        failing = _evaluate(_replace_state(states, 3, w=failing_value))
        result = failing.pairs[2].components[3]
        self.assertEqual(result.normalized_linf, math.nextafter(1.0, math.inf))
        self.assertEqual(result.normalized_linf_binary64_word, "3ff0000000000001")
        self.assertFalse(result.passed)
        self.assertEqual(failing.first_failing_pair_index, 2)
        self.assertEqual(failing.first_failing_pair_id, "128_to_256")

    def test_each_component_can_be_the_first_failing_component(self) -> None:
        base = _states()
        for component in COMPONENT_ORDER:
            if component == "w":
                states = _replace_state(base, 3, w=1.0)
            else:
                values = [0.0] * 256
                values[17] = 1.0
                states = _replace_state(base, 3, **{component: tuple(values)})
            receipt = _evaluate(states)
            terminal = receipt.pairs[2]
            with self.subTest(component=component):
                self.assertEqual(receipt.first_failing_pair_index, 2)
                self.assertEqual(terminal.first_failing_component, component)
                self.assertFalse(terminal.passed)
                self.assertGreater(
                    terminal.components[COMPONENT_ORDER.index(component)].normalized_linf,
                    1.0,
                )

    def test_each_pair_can_be_preserved_as_first_failure(self) -> None:
        schedules = (
            (0.0, 1.0, 1.0, 1.0),
            (0.0, 0.0, 1.0, 1.0),
            (0.0, 0.0, 0.0, 1.0),
        )
        for expected_index, w_schedule in enumerate(schedules):
            states = tuple(
                _state(node_count, w=w)
                for node_count, w in zip(LEVEL_NODE_COUNTS, w_schedule, strict=True)
            )
            receipt = _evaluate(states)
            with self.subTest(pair=PAIR_IDS[expected_index]):
                self.assertEqual(receipt.first_failing_pair_index, expected_index)
                self.assertEqual(receipt.first_failing_pair_id, PAIR_IDS[expected_index])
                self.assertTrue(all(pair.passed for pair in receipt.pairs[:expected_index]))
                self.assertFalse(receipt.pairs[expected_index].passed)
                self.assertTrue(all(pair.passed for pair in receipt.pairs[expected_index + 1 :]))

    def test_all_pairs_evaluate_after_first_failure_without_retune(self) -> None:
        states = tuple(
            _state(node_count, w=float(index))
            for index, node_count in enumerate(LEVEL_NODE_COUNTS)
        )
        receipt = _evaluate(states)
        self.assertEqual(len(receipt.pairs), 3)
        self.assertTrue(all(not pair.passed for pair in receipt.pairs))
        self.assertEqual(receipt.first_failing_pair_index, 0)
        self.assertEqual(receipt.first_failing_pair_id, "64_to_96")
        self.assertEqual(
            receipt.diagnostic_disposition,
            "blocked_at_first_failing_pair_no_retry_retune_or_fallback",
        )
        self.assertTrue(receipt.all_three_pairs_evaluated)
        self.assertTrue(receipt.first_failure_preserved)
        self.assertFalse(receipt.retry_allowed)
        self.assertFalse(receipt.retune_allowed)
        self.assertFalse(receipt.tolerance_change_allowed)
        self.assertFalse(receipt.alternate_grid_allowed)
        self.assertFalse(receipt.alternate_initializer_allowed)
        self.assertFalse(receipt.coarse_state_used_as_predictor)

    def test_receipt_is_frozen_bounded_and_has_no_authority(self) -> None:
        states = _states()
        receipt = _evaluate(states)
        authority_fields = (
            "declared_lever_tensor_read",
            "candidate_instance_ready",
            "candidate_admissible",
            "execution_authorized",
            "candidate_execution_authority",
            "execution_observed",
            "primary_replay_ready",
            "independent_replay_ready",
            "replay_authority",
            "pair_agreement_authority",
            "diagnostic_pass_authority",
            "stress_noise_lamp",
            "constraint_algebra_lamp",
            "theory_graph_lamp",
            "theory_graph_authority",
            "output_written",
            "registry_promoted",
            "physical_authority",
            "physical_viability",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(receipt.calculation_implemented)
        self.assertTrue(receipt.bounded_four_level_three_pair_receipt)
        self.assertTrue(receipt.only_F0_F1_varphi_interpolated)
        self.assertTrue(receipt.w_compared_directly_without_projection)
        self.assertEqual(receipt.rho_snapshot_mpfr_precision_bits, 256)
        self.assertTrue(all(getattr(receipt, name) is False for name in authority_fields))
        with self.assertRaises(FrozenInstanceError):
            receipt.physical_authority = True  # type: ignore[misc]
        with self.assertRaises((TypeError, ValueError)):
            replace(receipt, physical_authority=True)
        copied = replace(receipt)
        self.assertIsNot(copied, receipt)
        self.assertTrue(all(getattr(copied, name) is False for name in authority_fields))
        self.assertFalse(radial_cross_grid_receipt_grants_authority(receipt))
        self.assertFalse(radial_cross_grid_receipt_grants_authority(copied))
        self.assertFalse(radial_cross_grid_receipt_grants_authority(object()))
        with self.assertRaises(FrozenInstanceError):
            states[0].w = 1.0  # type: ignore[misc]

    def test_source_pin_drift_fails_closed(self) -> None:
        original = Path.read_bytes

        def altered(path: Path) -> bytes:
            payload = original(path)
            if path.name == "binary64_environment.py":
                return payload + b"\n"
            return payload

        with patch.object(Path, "read_bytes", altered), self.assertRaisesRegex(
            RuntimeError, "cross_grid_bound_source_pin_mismatch"
        ):
            convergence._assert_bound_source_bytes()

    def test_import_graph_excludes_solver_initializer_candidate_output_registry(self) -> None:
        source_path = HERE / "radial_cross_grid_convergence.py"
        tree = ast.parse(source_path.read_text(encoding="utf-8"))
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported.add(node.module)
        self.assertEqual(
            {name for name in imported if name.startswith("radial_")},
            set(),
        )
        forbidden_fragments = (
            "deterministic_newton",
            "continuation",
            "initializer",
            "candidate",
            "output",
            "registry",
        )
        self.assertTrue(
            all(
                fragment not in module_name
                for fragment in forbidden_fragments
                for module_name in imported
            )
        )
        self.assertNotIn("radial_lobatto_grid", sys.modules)
        self.assertNotIn("deterministic_newton", sys.modules)
        self.assertNotIn("radial_continuation", sys.modules)


if __name__ == "__main__":
    unittest.main()
