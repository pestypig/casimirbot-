package com.casimirbot.helixplayer.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

final class PlayerActionRuntimeLifecycleTest {
    @Test
    void actionPollingWaitsForTheFirstAdmittedHeartbeat() {
        assertFalse(PlayerActionRuntime.actionPollingReady(false, false));
        assertFalse(PlayerActionRuntime.actionPollingReady(true, false));
        assertTrue(PlayerActionRuntime.actionPollingReady(true, true));
    }

    @Test
    void directDiagnosticAdmissionIncludesTheExactHostileAttackAction() {
        assertTrue(PlayerActionRuntime.directDiagnosticActionAllowed("attack"));
        assertFalse(PlayerActionRuntime.directDiagnosticActionAllowed("attack_nearest"));
    }

    @Test
    void activeActionFailsClosedOnAnyCurrentTransportFailure() {
        assertFalse(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(
            true,
            null,
            "heartbeat_unreachable"
        ));
        assertFalse(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(
            true,
            "workflow:active",
            ""
        ));
        assertTrue(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(
            true,
            "workflow:active",
            "action_delivery_workflow_event_unreachable"
        ));
    }

    @Test
    void directDiagnosticIgnoresRemoteTransportFailure() {
        assertFalse(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(
            false,
            "direct_player_action_workflow:active",
            "heartbeat_unreachable"
        ));
    }

    @Test
    void recoveryHeartbeatDoesNotSelfLatchAPreviousStalePoll() {
        assertEquals(
            "active",
            PlayerActionRuntime.connectorHeartbeatStatus(
                false,
                false,
                "action_connector_stale"
            )
        );
        assertEquals(
            "paused",
            PlayerActionRuntime.connectorHeartbeatStatus(
                true,
                false,
                "action_connector_stale"
            )
        );
    }

    @Test
    void evidenceStreamConflictFailsClosedUntilFreshPairing() {
        String conflict =
            "action_delivery_environment_event_batch_http_409_action_event_conflict";
        assertTrue(PlayerActionRuntime.requiresFreshProducerEpoch(conflict));
        assertTrue(PlayerActionRuntime.requiresFreshProducerEpoch(
            "action_event_stream_resync_required"
        ));
        assertEquals(
            "error",
            PlayerActionRuntime.connectorHeartbeatStatus(false, true, conflict)
        );
        assertEquals(
            "error",
            PlayerActionRuntime.connectorHeartbeatStatus(false, false, conflict)
        );
        assertTrue(PlayerActionRuntime.eventStreamResyncRequiresWorkflowStop(
            true,
            "workflow:active"
        ));
        assertFalse(PlayerActionRuntime.eventStreamResyncRequiresWorkflowStop(
            true,
            null
        ));
        assertFalse(PlayerActionRuntime.eventStreamResyncRequiresWorkflowStop(
            false,
            "workflow:active"
        ));
    }

    @Test
    void evidenceEpochRotatesOnlyWhileIdleAndFullyDelivered() {
        assertTrue(PlayerActionRuntime.evidenceEpochRotationAllowed(false, false, false));
        assertFalse(PlayerActionRuntime.evidenceEpochRotationAllowed(true, false, false));
        assertFalse(PlayerActionRuntime.evidenceEpochRotationAllowed(false, true, false));
        assertFalse(PlayerActionRuntime.evidenceEpochRotationAllowed(false, false, true));
    }

    @Test
    void missingRestoredManifestReentersManifestAdmission() {
        assertTrue(PlayerActionRuntime.heartbeatFailureRequiresManifestRepublish(
            "action_heartbeat_invalid"
        ));
        assertTrue(PlayerActionRuntime.heartbeatFailureRequiresManifestRepublish(
            "action_manifest_required"
        ));
        assertFalse(PlayerActionRuntime.heartbeatFailureRequiresManifestRepublish(
            "action_event_stream_resync_required"
        ));
    }

    @Test
    void heartbeatCursorAdvancesOnlyFromAcknowledgedEnvironmentBatches() {
        long acknowledged = -1;

        // Producing workflow events does not change the server-visible cursor.
        assertEquals(-1, acknowledged);
        acknowledged = PlayerActionRuntime.acknowledgedEventSequence(
            acknowledged,
            Map.of("last_sequence", 2)
        );
        assertEquals(2, acknowledged);

        // A delayed replay cannot move the acknowledged cursor backwards.
        assertEquals(
            2,
            PlayerActionRuntime.acknowledgedEventSequence(
                acknowledged,
                Map.of("last_sequence", 1)
            )
        );
        assertEquals(
            2,
            PlayerActionRuntime.acknowledgedEventSequence(
                acknowledged,
                Map.of("schema", "helix.environment_action.workflow_event.v1")
            )
        );
    }

    @Test
    void preControlSafetyRefusalDoesNotClaimAnEnvironmentEffect() {
        assertFalse(PlayerActionRuntime.effectExecutionPerformed(
            true,
            true,
            Map.of(
                "effect_prevented", true,
                "reason_code", "locomotion_health_floor_crossed"
            )
        ));
        assertTrue(PlayerActionRuntime.effectExecutionPerformed(true, true, Map.of()));
    }

    @Test
    void laterSafetyRefusalPreservesMeasuredPartialMotion() {
        assertTrue(PlayerActionRuntime.effectExecutionPerformed(
            true,
            true,
            Map.of(
                "effect_prevented", true,
                "player_motion_performed", true,
                "distance_blocks", 3.0,
                "reason_code", "locomotion_predicted_drop_exceeded"
            )
        ));
    }

    @Test
    void plannerRefusalWithExplicitZeroMotionDoesNotClaimAnEffect() {
        assertFalse(PlayerActionRuntime.effectExecutionPerformed(
            true,
            true,
            Map.of(
                "player_motion_performed", false,
                "workflow_displacement_blocks", 0.0,
                "reason_code", "native_plan_unavailable"
            )
        ));
    }
}
