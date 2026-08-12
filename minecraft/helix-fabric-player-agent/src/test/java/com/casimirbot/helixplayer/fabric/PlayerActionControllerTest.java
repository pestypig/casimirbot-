package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class PlayerActionControllerTest {
    @Test
    void navigationReleasesControlsOnlyAfterReachingThePostcondition() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);

        assertTrue(controller.start(request(
                "navigate_to",
                Map.of(
                "destination", Map.of("x", 0.0, "y", 64.0, "z", 4.0),
                "arrival_radius", 0.5,
                "allow_sprint", true
            ),
            ManualOverridePolicy.CANCEL
        )));
        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertTrue(bridge.movement.forward());
        assertTrue(bridge.movement.sprint());
        assertFalse(bridge.released);

        bridge.snapshot = snapshot(true, 0.0, 64.0, 4.0, false);
        controller.tick();
        assertEquals(State.SUCCEEDED, controller.state());
        assertTrue(bridge.released);
        assertEquals("workflow.succeeded", events.get(events.size() - 1).eventType());
        assertTrue(events.get(events.size() - 1).controlsReleased());
    }

    @Test
    void nativeNavigationAlignsBeforeAdvancingTowardANearbyTarget() {
        FakeBridge bridge = new FakeBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "navigate_to",
            Map.of(
                "destination", Map.of("x", 2.0, "y", 64.0, "z", 0.0),
                "arrival_radius", 0.5,
                "allow_sprint", true
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertFalse(bridge.movement.forward());
        assertEquals(1, bridge.lookCalls);

        bridge.snapshot = snapshotPose(true, 0, 64, 0, -90, 0, true, false);
        controller.tick();
        assertTrue(bridge.movement.forward());
        assertFalse(bridge.movement.sprint());
    }

    @Test
    void nativeNavigationFailsClosedAfterMeasuredNonProgress() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "navigate_to",
            Map.of(
                "destination", Map.of("x", 0.0, "y", 64.0, "z", 4.0),
                "arrival_radius", 0.25,
                "allow_sprint", false
            ),
            ManualOverridePolicy.CANCEL
        ));

        for (int tick = 0; tick < 65 && controller.state() == State.RUNNING; tick++) {
            controller.tick();
        }

        assertEquals(State.FAILED, controller.state());
        assertTrue(bridge.released);
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertTrue(terminal.summary().contains("measured non-progress"));
        assertTrue(((Number) terminal.measurements().get("no_progress_ticks")).intValue() >= 40);
    }

    @Test
    void manualInputCancelsAndReleasesEveryControl() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 1_000, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));
        bridge.snapshot = snapshot(true, 0, 64, 0, true);

        controller.tick();

        assertEquals(State.CANCELED, controller.state());
        assertTrue(bridge.released);
        WorkflowEvent event = events.get(events.size() - 1);
        assertTrue(event.manualOverrideDetected());
        assertTrue(event.controlsReleased());
        assertEquals("test_manual_input", event.measurements().get("manual_input_reason"));
        assertEquals(0L, event.measurements().get("action_ticks_before_override"));
        assertTrue(event.summary().contains("reason: test_manual_input"));
    }

    @Test
    void manualOverrideAfterControlReportsPartialActionTicks() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 1_000, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        bridge.snapshot = snapshot(true, 0.1, 64, 0, true);
        controller.tick();

        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(State.CANCELED, controller.state());
        assertEquals(1L, terminal.measurements().get("action_ticks_before_override"));
    }

    @Test
    void pausePolicyDoesNotResumeWithoutAnExplicitWorkflowIdentity() {
        FakeBridge bridge = new FakeBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 1_000, "sprint", false),
            ManualOverridePolicy.PAUSE
        ));
        bridge.snapshot = snapshot(true, 0, 64, 0, true);
        controller.tick();

        assertEquals(State.PAUSED_MANUAL_OVERRIDE, controller.state());
        assertFalse(controller.resume("workflow:wrong"));
        assertTrue(controller.resume("workflow:test"));
        assertEquals(State.RUNNING, controller.state());
    }

    @Test
    void emergencyStopIsIdempotentAndNeverStartsASecondWorkflow() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 1_000, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));

        assertTrue(controller.emergencyStop("operator stop"));
        assertFalse(controller.emergencyStop("duplicate stop"));
        assertEquals(State.EMERGENCY_STOPPED, controller.state());
        assertTrue(bridge.released);
        assertEquals(1, events.stream()
            .filter(event -> "workflow.emergency_stopped".equals(event.eventType()))
            .count());
    }

    @Test
    void controlPlaneLossStopsTheExactWorkflowAndReleasesControls() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 1_000, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));
        controller.tick();

        assertTrue(controller.connectorOffline("control plane unavailable"));
        assertFalse(controller.connectorOffline("duplicate"));
        assertEquals(State.CONNECTOR_OFFLINE, controller.state());
        assertTrue(bridge.released);
        assertEquals("workflow.failed", events.get(events.size() - 1).eventType());
        assertTrue(events.get(events.size() - 1).controlsReleased());
    }

    @Test
    void unsupportedWorkflowKindFailsTypedInsteadOfTakingControl() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request("mine", Map.of(), ManualOverridePolicy.CANCEL));

        controller.tick();

        assertEquals(State.FAILED, controller.state());
        assertTrue(bridge.released);
        assertTrue(events.get(events.size() - 1).summary().contains("does not advertise"));
    }

    @Test
    void reusableWorkflowSucceedsOnlyFromMeasuredBridgePostconditions() {
        FakeBridge bridge = new FakeBridge();
        bridge.workflowStep = WorkflowStep.succeeded(
            "Two blocks were measured as removed.",
            Map.of("removed_count", 2, "requested_count", 2)
        );
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "mine",
            Map.of(
                "block_id", "minecraft:stone",
                "count", 2,
                "search_radius", 8
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        assertTrue(bridge.released);
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(2, terminal.measurements().get("removed_count"));
        assertTrue(terminal.controlsReleased());
    }

    @Test
    void boundedWalkRequiresMeasuredMotionBeforeSuccess() {
        FakeBridge bridge = new FakeBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 50, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        controller.tick();

        assertEquals(State.FAILED, controller.state());
        assertTrue(bridge.released);
    }

    @Test
    void boundedWalkSucceedsAfterTheClientMeasuresDisplacement() {
        FakeBridge bridge = new FakeBridge();
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "walk",
            Map.of("direction", "forward", "duration_ms", 50, "sprint", false),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        bridge.snapshot = snapshot(true, 0.25, 64, 0, false);
        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        assertTrue(events.get(events.size() - 1).summary().contains("measured motion"));
    }

    @Test
    void lookWaitsForMeasuredAngularConvergence() {
        FakeBridge bridge = new FakeBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "look_at",
            Map.of(
                "target", Map.of(
                    "target_kind", "position",
                    "position", Map.of("x", 10.0, "y", 65.62, "z", 0.0)
                ),
                "max_turn_degrees_per_tick", 30.0
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertEquals(1, bridge.lookCalls);

        bridge.snapshot = snapshotPose(true, 0, 64, 0, -90, 0, true, false);
        controller.tick();
        assertEquals(State.SUCCEEDED, controller.state());
    }

    @Test
    void relativeLookResolvesTheTargetOnceAndReportsTheMeasuredFinalPose() {
        FakeBridge bridge = new FakeBridge();
        bridge.snapshot = snapshotPose(true, 0, 64, 0, 10, -5, true, false);
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "look_at",
            Map.of(
                "target", Map.of(
                    "target_kind", "relative_rotation",
                    "yaw_delta_degrees", 20.0,
                    "pitch_delta_degrees", 5.0
                ),
                "max_turn_degrees_per_tick", 10.0
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertEquals(1, bridge.lookToCalls);
        assertEquals(30.0F, bridge.targetYaw);
        assertEquals(0.0F, bridge.targetPitch);

        bridge.snapshot = snapshotPose(true, 0, 64, 0, 30, 0, true, false);
        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals("relative_rotation", terminal.measurements().get("target_kind"));
        assertEquals(30.0, terminal.measurements().get("final_yaw"));
        assertEquals(0.0, terminal.measurements().get("final_pitch"));
        assertEquals(20.0, terminal.measurements().get("applied_yaw_delta_degrees"));
        assertEquals(5.0, terminal.measurements().get("applied_pitch_delta_degrees"));
    }

    @Test
    void jumpRequiresAnObservedAirborneTransition() {
        FakeBridge bridge = new FakeBridge();
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "jump",
            Map.of("count", 1),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertEquals(1, bridge.jumpPulses);

        bridge.snapshot = snapshotPose(true, 0, 64.2, 0, 0, 0, false, false);
        controller.tick();
        assertEquals(State.SUCCEEDED, controller.state());
    }

    private static ActionRequest request(
        String actionKind,
        Map<String, Object> arguments,
        ManualOverridePolicy policy
    ) {
        Map<String, Object> mutable = new LinkedHashMap<>(arguments);
        return new ActionRequest(
            "action_request:test",
            "workflow:test",
            actionKind,
            mutable,
            100,
            policy,
            "native_fabric"
        );
    }

    private static PlayerSnapshot snapshot(
        boolean connected,
        double x,
        double y,
        double z,
        boolean manualInput
    ) {
        return new PlayerSnapshot(
            connected,
            x,
            y,
            y + 1.62,
            z,
            0,
            0,
            20,
            true,
            false,
            manualInput,
            manualInput ? "test_manual_input" : null
        );
    }

    private static PlayerSnapshot snapshotPose(
        boolean connected,
        double x,
        double y,
        double z,
        float yaw,
        float pitch,
        boolean onGround,
        boolean manualInput
    ) {
        return new PlayerSnapshot(
            connected,
            x,
            y,
            y + 1.62,
            z,
            yaw,
            pitch,
            20,
            onGround,
            false,
            manualInput,
            manualInput ? "test_manual_input" : null
        );
    }

    private static final class FakeBridge implements ControlBridge {
        private PlayerSnapshot snapshot = PlayerActionControllerTest.snapshot(
            true,
            0,
            64,
            0,
            false
        );
        private MovementInput movement = MovementInput.released();
        private boolean released;
        private int lookCalls;
        private int lookToCalls;
        private float targetYaw;
        private float targetPitch;
        private int jumpPulses;
        private WorkflowStep workflowStep = WorkflowStep.failed(
            "The client companion does not advertise this workflow.",
            Map.of()
        );

        @Override
        public PlayerSnapshot snapshot() {
            return snapshot;
        }

        @Override
        public void applyMovement(MovementInput movement) {
            this.movement = movement;
            this.released = false;
        }

        @Override
        public void lookAt(double x, double y, double z, float maxDegreesPerTick) {
            lookCalls++;
        }

        @Override
        public void lookTo(float yaw, float pitch, float maxDegreesPerTick) {
            lookToCalls++;
            targetYaw = yaw;
            targetPitch = pitch;
        }

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
            return slot >= 0 && slot <= 8;
        }

        @Override
        public boolean equip(String itemId, String destination) {
            return true;
        }

        @Override
        public WorkflowStep runWorkflowStep(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine,
            long actionTicks
        ) {
            return workflowStep;
        }

        @Override
        public void releaseAll() {
            movement = MovementInput.released();
            released = true;
        }
    }
}
