package com.casimirbot.helixplayer.fabric;

import static org.junit.jupiter.api.Assertions.*;

import com.casimirbot.helixplayer.fabric.ConcurrentReactiveScheduler.ActionStep;
import com.casimirbot.helixplayer.fabric.ConcurrentReactiveScheduler.Runtime;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowStep;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowStepStatus;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

final class ConcurrentReactiveSchedulerTest {
    @Test
    void interactionLocksOnlyTheHandSelectedByTheReasoningLayer() {
        Map<String, Object> offHand = Map.of(
            "action_kind", "interact",
            "target", "looked_at_entity",
            "hand", "off_hand",
            "interaction", "interact"
        );
        Map<String, Object> mainHand = Map.of(
            "action_kind", "interact",
            "target", "looked_at_entity",
            "hand", "main_hand",
            "interaction", "interact"
        );

        assertEquals(Set.of("off_hand"), ConcurrentReactiveScheduler.resourcesFor(offHand));
        assertEquals(Set.of("main_hand"), ConcurrentReactiveScheduler.resourcesFor(mainHand));
    }

    @Test
    void itemUsePlacementLocksItsExactHandAndWorldMutationResources() {
        Map<String, Object> action = Map.of(
            "action_kind", "place",
            "block_id", "minecraft:water",
            "positions", List.of(Map.of("x", 1, "y", 64, "z", 2)),
            "placement_method", "item_use",
            "source_item_id", "minecraft:water_bucket",
            "hand", "off_hand"
        );

        assertEquals(
            Set.of(
                "camera", "locomotion", "off_hand", "inventory", "world",
                "native_workflow"
            ),
            ConcurrentReactiveScheduler.resourcesFor(action)
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void failedActionRetainsItsTypedReasonAndObservedEffects() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.failedLanes.add("lane:place");
        runtime.failedMeasurements.put("lane:place", Map.of(
            "placement_method", "item_use",
            "source_item_id", "minecraft:water_bucket",
            "world_mutations_performed", 0
        ));
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        Map<String, Object> place = Map.of(
            "action_kind", "place",
            "block_id", "minecraft:water",
            "positions", List.of(Map.of("x", 1, "y", 64, "z", 2)),
            "placement_method", "item_use",
            "source_item_id", "minecraft:water_bucket",
            "hand", "main_hand"
        );
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:place",
                "world",
                100,
                true,
                List.of(
                    "camera", "locomotion", "hotbar", "main_hand",
                    "inventory", "world", "native_workflow"
                ),
                actionNode("node:place", place, 20),
                terminal("node:place:done", "succeeded"),
                terminal("node:place:failed", "failed")
            )),
            List.of(),
            List.of()
        ));

        WorkflowStep result = scheduler.step(0);

        assertEquals(WorkflowStepStatus.FAILED, result.status());
        List<Map<String, Object>> receipts =
            (List<Map<String, Object>>) result.measurements().get("action_receipts");
        assertEquals(1, receipts.size());
        assertEquals("failed", receipts.get(0).get("outcome"));
        assertEquals("measured failure", receipts.get(0).get("summary"));
        assertEquals(
            "minecraft:water_bucket",
            receipts.get(0).get("source_item_id")
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void guardedActionRetainsItsExactSafetyInterruptEvidence() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.successfulMeasurements.put("lane:camera", Map.of(
            "tracking_completed", false,
            "safety_interrupted", true,
            "interrupt_reason", "health_floor_crossed",
            "measured_health", 18.0,
            "stop_below_health", 19.0
        ));
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:camera",
                "camera",
                200,
                true,
                List.of("camera", "safety"),
                actionNode("node:camera", lookAction(), 200),
                terminal("node:camera:done", "succeeded"),
                terminal("node:camera:failed", "failed")
            )),
            List.of(),
            List.of()
        ));

        WorkflowStep result = scheduler.step(0);

        assertEquals(WorkflowStepStatus.SUCCEEDED, result.status());
        assertEquals(1, result.measurements().get("interrupt_count"));
        List<Map<String, Object>> receipts =
            (List<Map<String, Object>>) result.measurements().get("action_receipts");
        assertEquals(1, receipts.size());
        Map<String, Object> receipt = receipts.get(0);
        assertEquals("succeeded", receipt.get("outcome"));
        assertEquals(false, receipt.get("tracking_completed"));
        assertEquals(true, receipt.get("safety_interrupted"));
        assertEquals("health_floor_crossed", receipt.get("interrupt_reason"));
        assertEquals(18.0, receipt.get("measured_health"));
        assertEquals(19.0, receipt.get("stop_below_health"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void timedOutActionRetainsTheLastRuntimeDiagnostics() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:place", 100);
        runtime.runningMeasurements.put("lane:place", Map.of(
            "position_binding_kind", "predicted_collision_cell",
            "target_position", Map.of("x", -80, "y", 81, "z", -38),
            "placement_method", "item_use"
        ));
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        Map<String, Object> place = Map.ofEntries(
            Map.entry("action_kind", "place"),
            Map.entry("block_id", "minecraft:water"),
            Map.entry("position_binding", Map.of(
                "binding_kind", "predicted_collision_cell",
                "horizon_ticks", 5,
                "max_distance_blocks", 6,
                "require_replaceable", true
            )),
            Map.entry("placement_method", "item_use"),
            Map.entry("source_item_id", "minecraft:water_bucket"),
            Map.entry("hand", "main_hand")
        );
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:place",
                "world",
                100,
                true,
                List.of(
                    "camera", "locomotion", "hotbar", "main_hand",
                    "inventory", "world", "native_workflow"
                ),
                actionNode("node:place", place, 1),
                terminal("node:place:done", "succeeded"),
                terminal("node:place:failed", "failed")
            )),
            List.of(),
            List.of()
        ));

        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(0).status());
        WorkflowStep terminal = scheduler.step(1);

        assertEquals(WorkflowStepStatus.FAILED, terminal.status());
        List<Map<String, Object>> receipts =
            (List<Map<String, Object>>) terminal.measurements().get("action_receipts");
        assertEquals(1, receipts.size());
        assertEquals("timed_out", receipts.get(0).get("outcome"));
        assertEquals("action_timeout", receipts.get(0).get("timeout_reason"));
        assertEquals("still running", receipts.get(0).get("last_runtime_summary"));
        assertEquals(
            Map.of("x", -80, "y", 81, "z", -38),
            receipts.get(0).get("target_position")
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void programTickCeilingRetainsTheLastRuntimeDiagnostics() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:place", 100);
        runtime.runningMeasurements.put("lane:place", Map.of(
            "position_binding_kind", "predicted_collision_cell",
            "placement_prediction", Map.of(
                "position_binding_kind", "predicted_collision_cell",
                "applicable", false,
                "predicted_reachable", false,
                "reason", "grounded_static"
            )
        ));
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        Map<String, Object> place = Map.ofEntries(
            Map.entry("action_kind", "place"),
            Map.entry("block_id", "minecraft:water"),
            Map.entry("position_binding", Map.of(
                "binding_kind", "predicted_collision_cell",
                "horizon_ticks", 5,
                "max_distance_blocks", 6,
                "require_replaceable", true
            )),
            Map.entry("placement_method", "item_use"),
            Map.entry("source_item_id", "minecraft:water_bucket"),
            Map.entry("hand", "main_hand")
        );
        Map<String, Object> candidate = new LinkedHashMap<>(program(
            "all_required",
            List.of(lane(
                "lane:place",
                "world",
                100,
                true,
                List.of(
                    "camera", "locomotion", "hotbar", "main_hand",
                    "inventory", "world", "native_workflow"
                ),
                actionNode("node:place", place, 20),
                terminal("node:place:done", "succeeded"),
                terminal("node:place:failed", "failed")
            )),
            List.of(),
            List.of()
        ));
        candidate.put("max_total_ticks", 1);
        scheduler.begin(Map.copyOf(candidate));

        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(0).status());
        WorkflowStep terminal = scheduler.step(1);

        assertEquals(WorkflowStepStatus.FAILED, terminal.status());
        List<Map<String, Object>> receipts =
            (List<Map<String, Object>>) terminal.measurements().get("action_receipts");
        assertEquals(1, receipts.size());
        assertEquals("program_timeout", receipts.get(0).get("timeout_reason"));
        assertEquals("still running", receipts.get(0).get("last_runtime_summary"));
        List<Map<String, Object>> predictions =
            (List<Map<String, Object>>) terminal.measurements().get("placement_predictions");
        assertEquals(1, predictions.size());
        assertEquals("grounded_static", predictions.get(0).get("reason"));
        assertEquals(false, predictions.get(0).get("predicted_reachable"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void dynamicPlacementReceivesTheProgramMutationScopeAtRuntime() {
        FakeRuntime runtime = new FakeRuntime();
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        Map<String, Object> place = Map.ofEntries(
            Map.entry("action_kind", "place"),
            Map.entry("block_id", "minecraft:water"),
            Map.entry("position_binding", Map.of(
                "binding_kind", "predicted_collision_cell",
                "horizon_ticks", 5,
                "max_distance_blocks", 6,
                "require_replaceable", true
            )),
            Map.entry("placement_method", "item_use"),
            Map.entry("source_item_id", "minecraft:water_bucket"),
            Map.entry("hand", "main_hand")
        );
        Map<String, Object> candidate = new LinkedHashMap<>(program(
            "all_required",
            List.of(lane(
                "lane:place",
                "world",
                100,
                true,
                List.of(
                    "camera", "locomotion", "hotbar", "main_hand",
                    "inventory", "world", "native_workflow"
                ),
                actionNode("node:place", place, 20),
                terminal("node:place:done", "succeeded"),
                terminal("node:place:failed", "failed")
            )),
            List.of(),
            List.of()
        ));
        candidate.put("mutation_scope", Map.of(
            "world_mutation_allowed", true,
            "max_block_mutations", 1,
            "max_inventory_transfers", 1,
            "allowed_block_ids", List.of("minecraft:water"),
            "allowed_regions", List.of(Map.of(
                "min", Map.of("x", -82, "y", 80, "z", -40),
                "max", Map.of("x", -78, "y", 82, "z", -36)
            )),
            "combat_allowed", false
        ));
        scheduler.begin(Map.copyOf(candidate));

        assertEquals(WorkflowStepStatus.SUCCEEDED, scheduler.step(0).status());
        Map<String, Object> runtimeAction = runtime.actionsByLane.get("lane:place");
        assertNotNull(runtimeAction);
        Map<String, Object> scope = (Map<String, Object>) runtimeAction.get(
            "_helix_admitted_mutation_scope"
        );
        assertEquals(true, scope.get("world_mutation_allowed"));
        assertEquals(List.of("minecraft:water"), scope.get("allowed_block_ids"));
    }

    @Test
    void advancesNonConflictingCameraAndLocomotionLanesInTheSameTick() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:camera", 1);
        runtime.runningCallsBeforeSuccess.put("lane:move", 1);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(
                lane("lane:camera", "camera", 80, true, List.of("camera"),
                    actionNode("node:camera", lookAction(), 20),
                    terminal("node:camera:done", "succeeded"),
                    terminal("node:camera:failed", "failed")),
                lane("lane:move", "locomotion", 70, true, List.of("locomotion"),
                    actionNode("node:move", walkAction(), 20),
                    terminal("node:move:done", "succeeded"),
                    terminal("node:move:failed", "failed"))
            ),
            List.of(),
            List.of()
        ));

        WorkflowStep first = scheduler.step(0);

        assertEquals(WorkflowStepStatus.RUNNING, first.status());
        assertEquals(List.of("lane:camera#0@0", "lane:move#0@0"), runtime.actionCalls);
        assertEquals(0, first.measurements().get("resource_conflict_count"));

        WorkflowStep second = scheduler.step(1);
        assertEquals(WorkflowStepStatus.SUCCEEDED, second.status());
        assertEquals(true, second.measurements().get("controls_released"));
        assertEquals(2, second.measurements().get("max_concurrent_lane_count"));
        assertEquals(2, second.measurements().get("parallel_tick_count"));
    }

    @Test
    void higherPriorityLaneOwnsAConflictingResourceUntilItSettles() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:high", 1);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(
                lane("lane:high", "camera", 100, true, List.of("camera"),
                    actionNode("node:high", lookAction(), 20),
                    terminal("node:high:done", "succeeded"),
                    terminal("node:high:failed", "failed")),
                lane("lane:low", "camera", 10, true, List.of("camera"),
                    actionNode("node:low", lookAction(), 20),
                    terminal("node:low:done", "succeeded"),
                    terminal("node:low:failed", "failed"))
            ),
            List.of(),
            List.of()
        ));

        WorkflowStep first = scheduler.step(0);
        assertEquals(List.of("lane:high#0@0"), runtime.actionCalls);
        assertEquals(1, first.measurements().get("resource_conflict_count"));

        WorkflowStep second = scheduler.step(1);
        assertEquals(WorkflowStepStatus.SUCCEEDED, second.status());
        assertEquals(
            List.of("lane:high#0@0", "lane:high#0@1", "lane:low#0@0"),
            runtime.actionCalls
        );
    }

    @Test
    void repeatNodeRunsAtMostOneIterationPerTickAndStopsAtItsBound() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.successfulMeasurements.put("lane:hand", Map.of(
            "interaction_accepted", true,
            "post_interaction_observed", true,
            "consumed_item_count", 1,
            "inventory_mutations_performed", 1
        ));
        Map<String, Object> repeat = new LinkedHashMap<>();
        repeat.put("node_id", "node:repeat");
        repeat.put("node_kind", "repeat");
        repeat.put("earliest_tick", 0);
        repeat.put("action", interactAction());
        repeat.put("max_iterations", 3);
        repeat.put("timeout_ticks", 20);
        repeat.put("on_complete", "node:done");
        repeat.put("on_failure", "node:failed");
        repeat.put("on_timeout", "node:failed");
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:hand",
                "hand",
                50,
                true,
                List.of("main_hand", "off_hand"),
                repeat,
                terminal("node:done", "succeeded"),
                terminal("node:failed", "failed")
            )),
            List.of(),
            List.of()
        ));

        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(0).status());
        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(1).status());
        WorkflowStep terminal = scheduler.step(2);

        assertEquals(WorkflowStepStatus.SUCCEEDED, terminal.status());
        assertEquals(
            List.of("lane:hand#0@0", "lane:hand#1@0", "lane:hand#2@0"),
            runtime.actionCalls
        );
        assertEquals(3, terminal.measurements().get("consumed_item_count"));
        assertEquals(3, terminal.measurements().get("inventory_mutations_performed"));
        assertEquals(3, terminal.measurements().get("action_receipt_count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> receipts =
            (List<Map<String, Object>>) terminal.measurements().get("action_receipts");
        assertEquals(List.of(0, 1, 2), receipts.stream()
            .map(receipt -> receipt.get("iteration"))
            .toList());
    }

    @Test
    void oneShotInterruptCancelsActiveLanesAndActivatesSafetyFallback() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.conditions.put("health_at_least", false);
        runtime.runningCallsBeforeSuccess.put("lane:camera", 100);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "first_success",
            List.of(
                lane("lane:camera", "camera", 50, false, List.of("camera"),
                    actionNode("node:camera", lookAction(), 100),
                    terminal("node:camera:done", "succeeded"),
                    terminal("node:camera:failed", "failed")),
                dormantLane(
                    "lane:safety",
                    "safety",
                    255,
                    List.of("safety"),
                    terminal("node:safety", "succeeded")
                )
            ),
            List.of(),
            List.of(Map.of(
                "interrupt_id", "interrupt:low-health",
                "priority", 255,
                "condition", Map.of("condition_kind", "health_at_least", "health", 6),
                "trigger_when", "not_satisfied",
                "debounce_ticks", 1,
                "activate_lane_id", "lane:safety",
                "cancel_lane_ids", List.of("lane:camera"),
                "max_activations", 1
            ))
        ));

        WorkflowStep result = scheduler.step(0);

        assertEquals(WorkflowStepStatus.SUCCEEDED, result.status());
        assertEquals(1, result.measurements().get("interrupt_count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lanes =
            (List<Map<String, Object>>) result.measurements().get("lanes");
        Map<String, Object> camera = lanes.stream()
            .filter(lane -> "lane:camera".equals(lane.get("lane_id")))
            .findFirst()
            .orElseThrow();
        assertEquals("canceled", camera.get("state"));
        assertEquals(true, camera.get("controls_released"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void allRequiredTreatsAnAuthoredSafetyInterruptAsAHandledExecution() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.conditions.put("health_at_least", false);
        runtime.runningCallsBeforeSuccess.put("lane:camera", 100);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(
                lane("lane:camera", "camera", 50, true, List.of("camera"),
                    actionNode("node:camera", lookAction(), 100),
                    terminal("node:camera:done", "succeeded"),
                    terminal("node:camera:failed", "failed")),
                dormantLane(
                    "lane:safety",
                    "safety",
                    255,
                    List.of("safety"),
                    terminal("node:safety", "canceled")
                )
            ),
            List.of(),
            List.of(Map.of(
                "interrupt_id", "interrupt:low-health",
                "priority", 255,
                "condition", Map.of("condition_kind", "health_at_least", "health", 19),
                "trigger_when", "not_satisfied",
                "debounce_ticks", 1,
                "activate_lane_id", "lane:safety",
                "cancel_lane_ids", List.of("lane:camera"),
                "max_activations", 1
            ))
        ));

        WorkflowStep result = scheduler.step(0);

        assertEquals(WorkflowStepStatus.SUCCEEDED, result.status());
        assertEquals(true, result.measurements().get("reactive_program_completed"));
        assertEquals("reactive_program_interrupted", result.measurements().get("reason_code"));
        assertEquals("interrupt:low-health", result.measurements().get("settled_interrupt_id"));
        assertEquals(1, result.measurements().get("interrupt_count"));
        List<Map<String, Object>> lanes =
            (List<Map<String, Object>>) result.measurements().get("lanes");
        assertEquals(
            "canceled",
            lanes.stream()
                .filter(lane -> "lane:camera".equals(lane.get("lane_id")))
                .findFirst()
                .orElseThrow()
                .get("state")
        );
    }

    @Test
    void raceCancelsRemainingMembersAfterTheFirstSuccess() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:slow", 100);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "first_success",
            List.of(
                lane("lane:fast", "camera", 100, false, List.of("camera"),
                    actionNode("node:fast", lookAction(), 20),
                    terminal("node:fast:done", "succeeded"),
                    terminal("node:fast:failed", "failed")),
                lane("lane:slow", "locomotion", 50, false, List.of("locomotion"),
                    actionNode("node:slow", walkAction(), 20),
                    terminal("node:slow:done", "succeeded"),
                    terminal("node:slow:failed", "failed"))
            ),
            List.of(Map.of(
                "race_id", "race:rescue",
                "lane_ids", List.of("lane:fast", "lane:slow"),
                "settle_on", "first_succeeded",
                "cancel_remaining", true
            )),
            List.of()
        ));

        WorkflowStep result = scheduler.step(0);

        assertEquals(WorkflowStepStatus.SUCCEEDED, result.status());
        assertTrue(runtime.canceledLanes.contains("lane:slow"));
        assertEquals(1, result.measurements().get("race_outcome_count"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> outcomes =
            (List<Map<String, Object>>) result.measurements().get("race_outcomes");
        assertEquals("race:rescue", outcomes.get(0).get("race_id"));
        assertEquals("lane:fast", outcomes.get(0).get("winner_lane_id"));
        assertEquals(List.of("lane:slow"), outcomes.get(0).get("canceled_lane_ids"));
    }

    @Test
    void actionTimeoutUsesItsExplicitFallbackTransition() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:camera", 100);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:camera",
                "camera",
                50,
                true,
                List.of("camera"),
                actionNode("node:camera", lookAction(), 2),
                terminal("node:camera:done", "succeeded"),
                terminal("node:camera:failed", "succeeded")
            )),
            List.of(),
            List.of()
        ));

        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(0).status());
        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(1).status());
        WorkflowStep result = scheduler.step(2);

        assertEquals(WorkflowStepStatus.SUCCEEDED, result.status());
        assertTrue(runtime.canceledLanes.contains("lane:camera"));
    }

    @Test
    void explicitCancellationReleasesEveryHeldResource() {
        FakeRuntime runtime = new FakeRuntime();
        runtime.runningCallsBeforeSuccess.put("lane:move", 100);
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(lane("lane:move", "locomotion", 50, true, List.of("locomotion"),
                actionNode("node:move", walkAction(), 100),
                terminal("node:move:done", "succeeded"),
                terminal("node:move:failed", "failed"))),
            List.of(),
            List.of()
        ));
        scheduler.step(0);

        scheduler.cancelAll("operator_cancel");

        assertTrue(runtime.canceledLanes.contains("lane:move"));
        assertEquals(Set.of("locomotion"), runtime.releasedResources.get("lane:move"));
    }

    @Test
    void schedulerOwnedTickCheckpointAndNodeOutcomeConditionsDoNotFallThrough() {
        FakeRuntime runtime = new FakeRuntime();
        Map<String, Object> checkpoint = Map.of(
            "node_id", "node:tick",
            "node_kind", "checkpoint",
            "earliest_tick", 0,
            "checkpoint_id", "checkpoint:tick-two",
            "condition", Map.of("condition_kind", "tick_at_least", "tick_index", 2),
            "wait_up_to_ticks", 5,
            "on_satisfied", "node:checkpoint-verify",
            "on_timeout", "node:failed"
        );
        Map<String, Object> checkpointVerify = Map.of(
            "node_id", "node:checkpoint-verify",
            "node_kind", "branch",
            "earliest_tick", 0,
            "condition", Map.of(
                "condition_kind", "checkpoint_satisfied",
                "checkpoint_id", "checkpoint:tick-two"
            ),
            "on_true", "node:action",
            "on_false", "node:failed"
        );
        Map<String, Object> action = Map.of(
            "node_id", "node:action",
            "node_kind", "action",
            "earliest_tick", 0,
            "timeout_ticks", 20,
            "action", lookAction(),
            "on_success", "node:outcome-verify",
            "on_failure", "node:failed",
            "on_timeout", "node:failed"
        );
        Map<String, Object> outcomeVerify = Map.of(
            "node_id", "node:outcome-verify",
            "node_kind", "branch",
            "earliest_tick", 0,
            "condition", Map.of(
                "condition_kind", "node_outcome_is",
                "node_id", "node:action",
                "outcome", "succeeded"
            ),
            "on_true", "node:done",
            "on_false", "node:failed"
        );
        ConcurrentReactiveScheduler scheduler = new ConcurrentReactiveScheduler(runtime);
        scheduler.begin(program(
            "all_required",
            List.of(lane(
                "lane:conditions",
                "camera",
                50,
                true,
                List.of("camera"),
                checkpoint,
                checkpointVerify,
                action,
                outcomeVerify,
                terminal("node:done", "succeeded"),
                terminal("node:failed", "failed")
            )),
            List.of(),
            List.of()
        ));

        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(0).status());
        assertEquals(WorkflowStepStatus.RUNNING, scheduler.step(1).status());
        WorkflowStep terminal = scheduler.step(2);

        assertEquals(WorkflowStepStatus.SUCCEEDED, terminal.status());
        assertEquals(
            List.of("checkpoint:tick-two"),
            terminal.measurements().get("satisfied_checkpoint_ids")
        );
        @SuppressWarnings("unchecked")
        Map<String, String> outcomes =
            (Map<String, String>) terminal.measurements().get("node_outcomes");
        assertEquals("succeeded", outcomes.get("node:action"));
        assertEquals(List.of("lane:conditions#0@0"), runtime.actionCalls);
    }

    private static Map<String, Object> program(
        String completionMode,
        List<Map<String, Object>> lanes,
        List<Map<String, Object>> races,
        List<Map<String, Object>> interrupts
    ) {
        return Map.ofEntries(
            Map.entry("program_schema", "helix.minecraft.reactive_program.v1"),
            Map.entry("program_id", "program:test"),
            Map.entry("ruleset", "survival_tas"),
            Map.entry("execution_plane", "player_embodiment"),
            Map.entry("scheduler_engine", "native_fabric_concurrent"),
            Map.entry("max_total_ticks", 1_000),
            Map.entry("completion_policy", Map.of(
                "mode", completionMode,
                "cancel_remaining_on_settle", true
            )),
            Map.entry("lanes", lanes),
            Map.entry("races", races),
            Map.entry("interrupts", interrupts)
        );
    }

    @SafeVarargs
    private static Map<String, Object> lane(
        String laneId,
        String kind,
        int priority,
        boolean required,
        List<String> resources,
        Map<String, Object>... nodes
    ) {
        return Map.of(
            "lane_id", laneId,
            "lane_kind", kind,
            "priority", priority,
            "required", required,
            "activation", "immediate",
            "resource_ceiling", resources,
            "start_node_id", nodes[0].get("node_id"),
            "nodes", List.of(nodes)
        );
    }

    @SafeVarargs
    private static Map<String, Object> dormantLane(
        String laneId,
        String kind,
        int priority,
        List<String> resources,
        Map<String, Object>... nodes
    ) {
        Map<String, Object> lane = new LinkedHashMap<>(
            lane(laneId, kind, priority, false, resources, nodes)
        );
        lane.put("activation", "interrupt_only");
        return Map.copyOf(lane);
    }

    private static Map<String, Object> actionNode(
        String nodeId,
        Map<String, Object> action,
        int timeoutTicks
    ) {
        return Map.of(
            "node_id", nodeId,
            "node_kind", "action",
            "earliest_tick", 0,
            "timeout_ticks", timeoutTicks,
            "action", action,
            "on_success", nodeId + ":done",
            "on_failure", nodeId + ":failed",
            "on_timeout", nodeId + ":failed"
        );
    }

    private static Map<String, Object> terminal(String nodeId, String outcome) {
        return Map.of(
            "node_id", nodeId,
            "node_kind", "terminal",
            "terminal_outcome", outcome,
            "reason_code", "reason:" + nodeId
        );
    }

    private static Map<String, Object> lookAction() {
        return Map.of(
            "action_kind", "look_at",
            "target", Map.of("target_kind", "current_focus"),
            "max_turn_degrees_per_tick", 10
        );
    }

    private static Map<String, Object> walkAction() {
        return Map.of(
            "action_kind", "walk",
            "direction", "forward",
            "duration_ms", 1_000,
            "sprint", false
        );
    }

    private static Map<String, Object> interactAction() {
        return Map.of(
            "action_kind", "interact",
            "target", "looked_at_entity",
            "hand", "main_hand",
            "interaction", "interact"
        );
    }

    private static final class FakeRuntime implements Runtime {
        private final Map<String, Integer> runningCallsBeforeSuccess = new HashMap<>();
        private final Map<String, Integer> calls = new HashMap<>();
        private final Map<String, Boolean> conditions = new HashMap<>();
        private final Map<String, Map<String, Object>> successfulMeasurements =
            new HashMap<>();
        private final Map<String, Map<String, Object>> failedMeasurements =
            new HashMap<>();
        private final Map<String, Map<String, Object>> runningMeasurements =
            new HashMap<>();
        private final Set<String> failedLanes = new java.util.LinkedHashSet<>();
        private final List<String> actionCalls = new ArrayList<>();
        private final Set<String> canceledLanes = new java.util.LinkedHashSet<>();
        private final Map<String, Set<String>> releasedResources = new HashMap<>();
        private final Map<String, Map<String, Object>> actionsByLane = new HashMap<>();

        @Override
        public boolean evaluateCondition(Map<String, Object> condition) {
            return conditions.getOrDefault(String.valueOf(condition.get("condition_kind")), false);
        }

        @Override
        public ActionStep stepAction(
            String laneId,
            Map<String, Object> action,
            int iteration,
            long actionTicks
        ) {
            actionsByLane.put(laneId, Map.copyOf(action));
            actionCalls.add(laneId + "#" + iteration + "@" + actionTicks);
            int call = calls.merge(laneId, 1, Integer::sum);
            int running = runningCallsBeforeSuccess.getOrDefault(laneId, 0);
            if (call <= running) {
                return new ActionStep(
                    ConcurrentReactiveScheduler.ActionStatus.RUNNING,
                    "still running",
                    runningMeasurements.getOrDefault(laneId, Map.of())
                );
            }
            return failedLanes.contains(laneId)
                ? new ActionStep(
                    ConcurrentReactiveScheduler.ActionStatus.FAILED,
                    "measured failure",
                    failedMeasurements.getOrDefault(laneId, Map.of())
                )
                : new ActionStep(
                    ConcurrentReactiveScheduler.ActionStatus.SUCCEEDED,
                    "measured success",
                    successfulMeasurements.getOrDefault(laneId, Map.of())
                );
        }

        @Override
        public void cancelAction(String laneId, String reason) {
            canceledLanes.add(laneId);
        }

        @Override
        public void releaseResources(String laneId, Set<String> resources) {
            releasedResources.put(laneId, Set.copyOf(resources));
        }
    }
}
