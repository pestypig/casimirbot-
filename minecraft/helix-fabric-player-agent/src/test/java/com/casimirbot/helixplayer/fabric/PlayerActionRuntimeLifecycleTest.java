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
    void recoveryHeartbeatDoesNotSelfLatchAPreviousStalePoll() {
        assertEquals(
            "active",
            PlayerActionRuntime.connectorHeartbeatStatus(
                false,
                "action_connector_stale"
            )
        );
        assertEquals(
            "paused",
            PlayerActionRuntime.connectorHeartbeatStatus(
                true,
                "action_connector_stale"
            )
        );
    }
}
