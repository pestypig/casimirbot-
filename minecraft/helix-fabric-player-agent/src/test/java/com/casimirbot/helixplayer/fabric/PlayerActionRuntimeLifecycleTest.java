package com.casimirbot.helixplayer.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

final class PlayerActionRuntimeLifecycleTest {
    @Test
    void actionPollingWaitsForTheFirstAdmittedHeartbeat() {
        assertFalse(PlayerActionRuntime.actionPollingReady(false, false));
        assertFalse(PlayerActionRuntime.actionPollingReady(true, false));
        assertTrue(PlayerActionRuntime.actionPollingReady(true, true));
    }

    @Test
    void activeActionFailsClosedOnAnyCurrentTransportFailure() {
        assertFalse(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(null, "heartbeat_unreachable"));
        assertFalse(PlayerActionRuntime.activeControlPlaneFailureRequiresStop("workflow:active", ""));
        assertTrue(PlayerActionRuntime.activeControlPlaneFailureRequiresStop(
            "workflow:active",
            "action_delivery_workflow_event_unreachable"
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
        assertEquals(
            "error",
            PlayerActionRuntime.connectorHeartbeatStatus(false, true, conflict)
        );
        assertEquals(
            "error",
            PlayerActionRuntime.connectorHeartbeatStatus(false, false, conflict)
        );
    }
}
