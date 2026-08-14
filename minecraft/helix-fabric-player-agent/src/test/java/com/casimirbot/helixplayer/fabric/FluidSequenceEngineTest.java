package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class FluidSequenceEngineTest {
    @Test
    void executesTickAddressedInputThenVerifiesCheckpoint() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        engine.begin(sequence(
            "node:input",
            List.of("checkpoint:landed"),
            List.of(
                inputNode("node:input", "node:checkpoint", "node:failed", 2),
                Map.of(
                    "node_id", "node:checkpoint",
                    "node_kind", "checkpoint",
                    "earliest_tick", 1,
                    "checkpoint_id", "checkpoint:landed",
                    "condition", Map.of(
                        "condition_kind", "player_grounded",
                        "expected", true
                    ),
                    "wait_up_to_ticks", 10,
                    "on_satisfied", "node:succeeded",
                    "on_timeout", "node:failed"
                ),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        ));

        WorkflowStep first = engine.step(1);
        assertEquals(WorkflowStepStatus.RUNNING, first.status());
        assertTrue(bridge.movement.forward());
        assertTrue(bridge.movement.sprint());
        assertEquals(1, bridge.jumpPulses);

        WorkflowStep second = engine.step(2);
        assertEquals(WorkflowStepStatus.RUNNING, second.status());
        assertTrue(bridge.movement.forward());

        assertEquals(WorkflowStepStatus.RUNNING, engine.step(3).status());
        assertTrue(bridge.released);

        WorkflowStep terminal = engine.step(4);
        assertEquals(WorkflowStepStatus.SUCCEEDED, terminal.status());
        assertEquals(true, terminal.measurements().get("sequence_completed"));
        assertEquals(1L, terminal.measurements().get("required_checkpoints_satisfied"));
        assertEquals(3, terminal.measurements().get("executed_node_count"));
        assertEquals(4L, terminal.measurements().get("scheduler_ticks_elapsed"));
        assertEquals(1, terminal.measurements().get("condition_observation_count"));
    }

    @Test
    void reusesTheProductionControllerForEmbeddedActions() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        engine.begin(sequence(
            "node:hotbar",
            List.of(),
            List.of(
                Map.of(
                    "node_id", "node:hotbar",
                    "node_kind", "workflow_action",
                    "earliest_tick", 0,
                    "timeout_ticks", 20,
                    "action", Map.of("action_kind", "hotbar_select", "slot", 4),
                    "on_success", "node:succeeded",
                    "on_failure", "node:failed"
                ),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        ));

        assertEquals(WorkflowStepStatus.RUNNING, engine.step(1).status());
        assertEquals(4, bridge.selectedSlot);
        WorkflowStep terminal = engine.step(2);
        assertEquals(WorkflowStepStatus.SUCCEEDED, terminal.status());
        assertEquals(true, terminal.measurements().get("inventory_mutation_performed"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void passesSequenceMutationScopeToADynamicPlacementWorkflow() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        Map<String, Object> candidate = new LinkedHashMap<>(sequence(
            "node:place",
            List.of(),
            List.of(
                Map.of(
                    "node_id", "node:place",
                    "node_kind", "workflow_action",
                    "earliest_tick", 0,
                    "timeout_ticks", 20,
                    "action", Map.ofEntries(
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
                    ),
                    "on_success", "node:succeeded",
                    "on_failure", "node:failed"
                ),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
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
        engine.begin(Map.copyOf(candidate));

        assertEquals(WorkflowStepStatus.RUNNING, engine.step(1).status());
        Map<String, Object> scope = (Map<String, Object>) bridge.startedArguments.get(
            "_helix_admitted_mutation_scope"
        );
        assertEquals(true, scope.get("world_mutation_allowed"));
        assertEquals(List.of("minecraft:water"), scope.get("allowed_block_ids"));
    }

    @Test
    void branchFailureRemainsATypedTerminalInsteadOfInventingARepair() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        engine.begin(sequence(
            "node:branch",
            List.of(),
            List.of(
                Map.of(
                    "node_id", "node:branch",
                    "node_kind", "branch",
                    "earliest_tick", 0,
                    "condition", Map.of(
                        "condition_kind", "health_at_least",
                        "health", 20.0
                    ),
                    "on_true", "node:succeeded",
                    "on_false", "node:failed"
                ),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        ));
        bridge.snapshot = snapshot(10.0F, true, false, null);

        WorkflowStep terminal = engine.step(1);
        assertEquals(WorkflowStepStatus.FAILED, terminal.status());
        assertEquals(false, terminal.measurements().get("sequence_completed"));
        assertEquals("tas_terminal", terminal.measurements().get("terminal_reason_code"));
    }

    @Test
    void recordsConditionChangesAsCompactEventsInsteadOfPerTickNoise() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        engine.begin(sequence(
            "node:dimension",
            List.of("checkpoint:dimension"),
            List.of(
                Map.of(
                    "node_id", "node:dimension",
                    "node_kind", "checkpoint",
                    "earliest_tick", 0,
                    "checkpoint_id", "checkpoint:dimension",
                    "condition", Map.of(
                        "condition_kind", "dimension_is",
                        "dimension", "minecraft:overworld"
                    ),
                    "wait_up_to_ticks", 10,
                    "on_satisfied", "node:succeeded",
                    "on_timeout", "node:failed"
                ),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        ));

        assertEquals(WorkflowStepStatus.RUNNING, engine.step(1).status());
        assertEquals(WorkflowStepStatus.RUNNING, engine.step(2).status());
        bridge.worldCondition = true;
        WorkflowStep terminal = engine.step(3);

        assertEquals(WorkflowStepStatus.SUCCEEDED, terminal.status());
        Object raw = terminal.measurements().get("condition_observations");
        assertInstanceOf(List.class, raw);
        List<?> observations = (List<?>) raw;
        assertEquals(2, observations.size());
        assertEquals(2, terminal.measurements().get("condition_observation_count"));
        assertEquals(false, ((Map<?, ?>) observations.get(0)).get("satisfied"));
        assertEquals(true, ((Map<?, ?>) observations.get(1)).get("satisfied"));
    }

    @Test
    void rejectsCyclesBeforeAnyControlIsAsserted() {
        FakeBridge bridge = new FakeBridge();
        FluidSequenceEngine engine = new FluidSequenceEngine(bridge);
        Map<String, Object> cyclic = inputNode(
            "node:input",
            "node:input",
            "node:failed",
            1
        );
        assertThrows(IllegalArgumentException.class, () -> engine.begin(sequence(
            "node:input",
            List.of(),
            List.of(
                cyclic,
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        )));
        assertEquals(MovementInput.released(), bridge.movement);
    }

    @Test
    void outerControllerManualOverrideCancelsSequenceAndReleasesControls() {
        SequenceBridge bridge = new SequenceBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        Map<String, Object> arguments = sequence(
            "node:input",
            List.of(),
            List.of(
                inputNode("node:input", "node:succeeded", "node:failed", 20),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        );
        assertTrue(controller.start(new ActionRequest(
            "action_request:sequence-override",
            "workflow:sequence-override",
            "execute_sequence",
            arguments,
            100,
            ManualOverridePolicy.CANCEL,
            "native_fabric"
        )));
        controller.tick();
        assertTrue(bridge.movement.forward());

        bridge.snapshot = snapshot(20.0F, true, true, "forward_key_pressed");
        controller.tick();

        assertEquals(State.CANCELED, controller.state());
        assertTrue(bridge.released);
        assertEquals(MovementInput.released(), bridge.movement);
    }

    @Test
    void outerControllerEmergencyStopReleasesSequenceControls() {
        SequenceBridge bridge = new SequenceBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        Map<String, Object> arguments = sequence(
            "node:input",
            List.of(),
            List.of(
                inputNode("node:input", "node:succeeded", "node:failed", 20),
                terminal("node:succeeded", "succeeded"),
                terminal("node:failed", "failed")
            )
        );
        controller.start(new ActionRequest(
            "action_request:sequence-stop",
            "workflow:sequence-stop",
            "execute_sequence",
            arguments,
            100,
            ManualOverridePolicy.CANCEL,
            "native_fabric"
        ));
        controller.tick();
        assertTrue(bridge.movement.forward());

        assertTrue(controller.emergencyStop("test stop"));
        assertEquals(State.EMERGENCY_STOPPED, controller.state());
        assertTrue(bridge.released);
        assertEquals(MovementInput.released(), bridge.movement);
    }

    private static Map<String, Object> sequence(
        String start,
        List<String> checkpoints,
        List<Map<String, Object>> nodes
    ) {
        return Map.ofEntries(
            Map.entry("action_kind", "execute_sequence"),
            Map.entry("sequence_schema", "helix.minecraft.player_sequence.v1"),
            Map.entry("sequence_id", "sequence:test"),
            Map.entry("ruleset", "survival_tas"),
            Map.entry("execution_plane", "player_embodiment"),
            Map.entry("scheduler_engine", "native_fabric"),
            Map.entry("optimization", Map.of(
                "primary", "minimize_world_ticks",
                "record_wall_clock", true,
                "stop_on_first_verified_success", true
            )),
            Map.entry("start_node_id", start),
            Map.entry("max_total_ticks", 200),
            Map.entry("required_checkpoint_ids", checkpoints),
            Map.entry("mutation_scope", Map.of(
                "world_mutation_allowed", false,
                "max_block_mutations", 0,
                "max_inventory_transfers", 0,
                "allowed_block_ids", List.of(),
                "allowed_regions", List.of(),
                "combat_allowed", false
            )),
            Map.entry("nodes", nodes)
        );
    }

    private static Map<String, Object> inputNode(
        String id,
        String complete,
        String failure,
        int duration
    ) {
        return Map.of(
            "node_id", id,
            "node_kind", "input_segment",
            "earliest_tick", 0,
            "duration_ticks", duration,
            "controls", Map.of(
                "forward", 1,
                "strafe", 0,
                "sprint", true,
                "sneak", false,
                "jump", "pulse",
                "use", "idle"
            ),
            "on_complete", complete,
            "on_failure", failure
        );
    }

    private static Map<String, Object> terminal(String id, String outcome) {
        return Map.of(
            "node_id", id,
            "node_kind", "terminal",
            "terminal_outcome", outcome,
            "reason_code", "tas_terminal"
        );
    }

    private static PlayerSnapshot snapshot(
        float health,
        boolean grounded,
        boolean manual,
        String manualReason
    ) {
        return new PlayerSnapshot(
            true,
            0,
            64,
            65.62,
            0,
            0,
            0,
            health,
            grounded,
            false,
            manual,
            manualReason
        );
    }

    private static class FakeBridge implements ControlBridge {
        protected PlayerSnapshot snapshot = FluidSequenceEngineTest.snapshot(
            20.0F,
            true,
            false,
            null
        );
        protected MovementInput movement = MovementInput.released();
        protected boolean released;
        protected int jumpPulses;
        protected int selectedSlot = -1;
        protected boolean worldCondition;
        protected Map<String, Object> startedArguments = Map.of();

        @Override
        public PlayerSnapshot snapshot() {
            return snapshot;
        }

        @Override
        public void applyMovement(MovementInput movement) {
            this.movement = movement;
            released = false;
        }

        @Override
        public void lookAt(double x, double y, double z, float maxDegreesPerTick) {}

        @Override
        public void lookTo(float yaw, float pitch, float maxDegreesPerTick) {}

        @Override
        public void pulseJump() {
            jumpPulses++;
        }

        @Override
        public boolean interact(String target, String hand, String interaction) {
            return true;
        }

        @Override
        public boolean selectHotbar(int slot) {
            selectedSlot = slot;
            return slot >= 0 && slot <= 8;
        }

        @Override
        public boolean equip(String itemId, String destination) {
            return true;
        }

        @Override
        public boolean evaluateFluidWorldCondition(Map<String, Object> condition) {
            return worldCondition;
        }

        @Override
        public void beginWorkflow(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine
        ) {
            startedArguments = Map.copyOf(arguments);
        }

        @Override
        public WorkflowStep runWorkflowStep(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine,
            long actionTicks
        ) {
            return WorkflowStep.running(
                0.5,
                "test workflow is running",
                Map.of()
            );
        }

        @Override
        public void releaseAll() {
            movement = MovementInput.released();
            released = true;
        }
    }

    private static final class SequenceBridge extends FakeBridge {
        private final FluidSequenceEngine sequenceEngine = new FluidSequenceEngine(this);

        @Override
        public void beginWorkflow(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine
        ) {
            if ("execute_sequence".equals(actionKind)) sequenceEngine.begin(arguments);
        }

        @Override
        public WorkflowStep runWorkflowStep(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine,
            long actionTicks
        ) {
            return "execute_sequence".equals(actionKind)
                ? sequenceEngine.step(actionTicks)
                : WorkflowStep.failed("unsupported", Map.of());
        }
    }
}
