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
    void reactiveWorkflowConvertsOneBasedActionTicksToZeroBasedSchedulerTicks() {
        assertEquals(0, NativeFabricControlBridge.reactiveTickIndex(1));
        assertEquals(99, NativeFabricControlBridge.reactiveTickIndex(100));
        assertEquals(0, NativeFabricControlBridge.reactiveTickIndex(0));
    }

    @Test
    void interactionWaitsForConcurrentCameraFocusWithinABoundedWindow() {
        FakeBridge bridge = new FakeBridge();
        bridge.interactAccepted = false;
        bridge.handObservation = new HandObservation(true, "minecraft:wheat", 3);
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "interact",
            Map.of(
                "target", "looked_at_entity",
                "hand", "off_hand",
                "interaction", "interact"
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertEquals(1, bridge.interactCalls);

        bridge.interactAccepted = true;
        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        bridge.handObservation = new HandObservation(true, "minecraft:wheat", 2);
        controller.tick();

        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(State.SUCCEEDED, controller.state());
        assertEquals(2, terminal.measurements().get("interaction_attempt_count"));
        assertEquals(1, terminal.measurements().get("consumed_item_count"));
    }

    @Test
    void interactionFailsAfterTheBoundedFocusWindowInsteadOfWaitingIndefinitely() {
        FakeBridge bridge = new FakeBridge();
        bridge.interactAccepted = false;
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "interact",
            Map.of(
                "target", "looked_at_entity",
                "hand", "off_hand",
                "interaction", "interact"
            ),
            ManualOverridePolicy.CANCEL
        ));

        for (int tick = 0; tick < 10; tick++) controller.tick();

        assertEquals(State.FAILED, controller.state());
        assertEquals(10, bridge.interactCalls);
        assertTrue(bridge.released);
        assertTrue(events.get(events.size() - 1).summary().contains("bounded focus"));
    }

    @Test
    void interactionWaitsOneTickAndMeasuresConsumedHeldItems() {
        FakeBridge bridge = new FakeBridge();
        bridge.handObservation = new HandObservation(true, "minecraft:wheat", 3);
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "interact",
            Map.of(
                "target", "looked_at_entity",
                "hand", "off_hand",
                "interaction", "interact"
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        assertEquals(State.RUNNING, controller.state());
        assertEquals(1, bridge.interactCalls);

        bridge.handObservation = new HandObservation(true, "minecraft:wheat", 2);
        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(true, terminal.measurements().get("post_interaction_observed"));
        assertEquals(-1, terminal.measurements().get("held_item_count_delta"));
        assertEquals(1, terminal.measurements().get("consumed_item_count"));
        assertEquals(1, terminal.measurements().get("inventory_mutations_performed"));
        assertTrue(bridge.released);
    }

    @Test
    void acceptedInteractionCanSucceedWithoutInventingAnInventoryMutation() {
        FakeBridge bridge = new FakeBridge();
        bridge.handObservation = new HandObservation(true, "minecraft:stick", 1);
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "interact",
            Map.of(
                "target", "current_focus",
                "hand", "main_hand",
                "interaction", "use"
            ),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        controller.tick();

        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(State.SUCCEEDED, controller.state());
        assertEquals(0, terminal.measurements().get("consumed_item_count"));
        assertEquals(0, terminal.measurements().get("inventory_mutations_performed"));
    }

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

    @Test
    void cameraTrackerLocksOneEntityAndReportsBoundedErrorEvidence() {
        FakeBridge bridge = new FakeBridge();
        bridge.targetObservation = new TargetObservation(
            true,
            true,
            true,
            "target:0123456789abcdef0123456789abcdef01234567",
            "minecraft:bat",
            0,
            65.62,
            10,
            0,
            0,
            0,
            10
        );
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "track_target",
            trackingArguments(1_000),
            ManualOverridePolicy.CANCEL
        ));

        for (int tick = 0; tick < 20; tick++) controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals(true, terminal.measurements().get("tracking_completed"));
        assertEquals(20L, terminal.measurements().get("sample_count"));
        assertEquals(20L, terminal.measurements().get("retained_ticks"));
        assertEquals(0L, terminal.measurements().get("target_loss_ticks"));
        assertEquals("minecraft:bat", terminal.measurements().get("target_entity_type_id"));
        assertEquals(0.0, terminal.measurements().get("p95_angular_error_degrees"));
        assertEquals(20, bridge.cameraTargetUpdates);
        assertEquals(0.0, bridge.cameraTargetX);
        assertEquals(65.62, bridge.cameraTargetY);
        assertEquals(10.0, bridge.cameraTargetZ);
        assertTrue(bridge.released);
    }

    @Test
    void healthFloorSafelyInterruptsTrackingAndCompletesTheAdmittedGuard() {
        FakeBridge bridge = new FakeBridge();
        bridge.snapshot = new PlayerSnapshot(
            true,
            0,
            64,
            65.62,
            0,
            0,
            0,
            18,
            true,
            false,
            false,
            null
        );
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        Map<String, Object> arguments = new LinkedHashMap<>(trackingArguments(10_000));
        arguments.put("stop_below_health", 19.0);
        controller.start(request(
            "track_target",
            Map.copyOf(arguments),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals("workflow.succeeded", terminal.eventType());
        assertTrue(terminal.summary().contains("safely interrupted"));
        assertEquals(false, terminal.measurements().get("tracking_completed"));
        assertEquals(true, terminal.measurements().get("safety_interrupted"));
        assertEquals("health_floor_crossed", terminal.measurements().get("interrupt_reason"));
        assertEquals(18.0, terminal.measurements().get("measured_health"));
        assertEquals(19.0, terminal.measurements().get("stop_below_health"));
        assertTrue(bridge.released);
    }

    @Test
    void cameraTrackerProjectsMeasuredVelocityByTheAdmittedPredictionHorizon() {
        FakeBridge bridge = new FakeBridge();
        bridge.targetObservation = new TargetObservation(
            true,
            true,
            true,
            "target:0123456789abcdef0123456789abcdef01234567",
            "minecraft:bat",
            1,
            65,
            3,
            0.5,
            -0.25,
            1.0,
            4
        );
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "track_target",
            trackingArguments(1_000),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();

        assertEquals(2.0, bridge.cameraTargetX);
        assertEquals(64.5, bridge.cameraTargetY);
        assertEquals(5.0, bridge.cameraTargetZ);
    }

    @Test
    void cameraTrackerNeverSubstitutesAnotherEntityAfterLock() {
        FakeBridge bridge = new FakeBridge();
        bridge.targetObservation = new TargetObservation(
            true, true, true,
            "target:0123456789abcdef0123456789abcdef01234567",
            "minecraft:bat",
            0, 65.62, 10, 0, 0, 0, 10
        );
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "track_target",
            trackingArguments(1_000),
            ManualOverridePolicy.CANCEL
        ));
        controller.tick();
        bridge.targetObservation = new TargetObservation(
            true, true, true,
            "target:fedcba9876543210fedcba9876543210fedcba98",
            "minecraft:bat",
            0, 65.62, 10, 0, 0, 0, 10
        );

        controller.tick();

        assertEquals(State.FAILED, controller.state());
        assertTrue(bridge.released);
    }

    @Test
    void manualViewInputImmediatelyCancelsCameraTracking() {
        FakeBridge bridge = new FakeBridge();
        bridge.targetObservation = new TargetObservation(
            true, true, true,
            "target:0123456789abcdef0123456789abcdef01234567",
            "minecraft:bat",
            10, 65.62, 0, 0, 0, 0, 10
        );
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "track_target",
            trackingArguments(1_000),
            ManualOverridePolicy.CANCEL
        ));
        controller.tick();
        bridge.snapshot = snapshotPose(true, 0, 64, 0, 0, 0, true, true);

        controller.tick();

        assertEquals(State.CANCELED, controller.state());
        assertTrue(bridge.released);
    }

    @Test
    void renderFrameManualInputWinsBeforeTheNextGameTick() {
        FakeBridge bridge = new FakeBridge();
        bridge.targetObservation = new TargetObservation(
            true, true, true,
            "target:0123456789abcdef0123456789abcdef01234567",
            "minecraft:bat",
            10, 65.62, 0, 0, 0, 0, 10
        );
        PlayerActionController controller = new PlayerActionController(bridge, event -> {});
        controller.start(request(
            "track_target",
            trackingArguments(1_000),
            ManualOverridePolicy.CANCEL
        ));
        controller.tick();
        bridge.renderManualReason = "unexpected_view_change";

        controller.renderFrame(System.nanoTime());

        assertEquals(State.CANCELED, controller.state());
        assertTrue(bridge.released);
    }

    @Test
    void particleStreamKeepsOneOpaqueStreamIdentityAndCountsHandoffs() {
        FakeBridge bridge = new FakeBridge();
        String streamRef = "target:0123456789abcdef0123456789abcdef01234567";
        bridge.targetObservation = new TargetObservation(
            true, true, true, streamRef, "minecraft:enchant",
            0, 65.62, 10, 0, 0, 0, 10, 0
        );
        List<WorkflowEvent> events = new ArrayList<>();
        PlayerActionController controller = new PlayerActionController(bridge, events::add);
        controller.start(request(
            "track_target",
            particleTrackingArguments(100),
            ManualOverridePolicy.CANCEL
        ));

        controller.tick();
        bridge.targetObservation = new TargetObservation(
            true, true, true, streamRef, "minecraft:enchant",
            0.1, 65.62, 9.9, 0, 0, 0, 10, 1
        );
        controller.tick();

        assertEquals(State.SUCCEEDED, controller.state());
        WorkflowEvent terminal = events.get(events.size() - 1);
        assertEquals("same_type_stream", terminal.measurements().get("particle_continuity"));
        assertEquals(1L, terminal.measurements().get("particle_handoff_count"));
        assertEquals(4, terminal.measurements().get("particle_max_handoffs"));
        assertEquals(streamRef, terminal.measurements().get("target_ref"));
        assertTrue(bridge.released);
    }

    private static Map<String, Object> particleTrackingArguments(int durationMs) {
        Map<String, Object> arguments = new LinkedHashMap<>(trackingArguments(durationMs));
        arguments.put(
            "target",
            Map.of(
                "target_kind", "particle_type",
                "particle_type_id", "minecraft:enchant",
                "selection", "nearest",
                "continuity", "same_type_stream",
                "handoff_radius", 2.0,
                "max_handoffs", 4
            )
        );
        return Map.copyOf(arguments);
    }

    private static Map<String, Object> trackingArguments(int durationMs) {
        Map<String, Object> arguments = new LinkedHashMap<>();
        arguments.put(
            "target",
            Map.of(
                "target_kind", "entity_type",
                "entity_type_id", "minecraft:bat",
                "selection", "nearest"
            )
        );
        arguments.put("aim_point", "center");
        arguments.put("max_acquisition_distance", 64.0);
        arguments.put("max_duration_ms", durationMs);
        arguments.put("max_turn_degrees_per_tick", 20.0);
        arguments.put("max_angular_acceleration_degrees_per_tick_squared", 4.0);
        arguments.put("prediction_ticks", 2);
        arguments.put("deadband_degrees", 0.5);
        arguments.put("reacquire_ticks", 3);
        arguments.put("require_line_of_sight", false);
        arguments.put("stop_below_health", 4.0);
        return Map.copyOf(arguments);
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
        private int cameraTargetUpdates;
        private double cameraTargetX;
        private double cameraTargetY;
        private double cameraTargetZ;
        private String renderManualReason;
        private HandObservation handObservation = HandObservation.unavailable();
        private int interactCalls;
        private boolean interactAccepted = true;
        private TargetObservation targetObservation = TargetObservation.unavailable(null);
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
        public TargetObservation observeTarget(
            Map<String, Object> target,
            String lockedTargetRef,
            String aimPoint,
            double maxDistance,
            boolean requireLineOfSight
        ) {
            return targetObservation;
        }

        @Override
        public void updateCameraTrackingTarget(
            double x,
            double y,
            double z,
            float maxDegreesPerTick,
            float maxAccelerationDegreesPerTickSquared,
            float deadbandDegrees
        ) {
            cameraTargetUpdates++;
            cameraTargetX = x;
            cameraTargetY = y;
            cameraTargetZ = z;
        }

        @Override
        public String renderCameraTrackingFrame(long frameNanos) {
            return renderManualReason;
        }

        @Override
        public void pulseJump() {
            jumpPulses++;
        }

        @Override
        public boolean interact(String target, String hand, String interaction) {
            interactCalls++;
            return interactAccepted;
        }

        @Override
        public HandObservation observeHand(String hand) {
            return handObservation;
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
