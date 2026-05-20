package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

final class HeartbeatPayloadTelemetryTest {
    @Test
    void runtimeStatusTracksHeartbeatTelemetryInputs() {
        HelixSensorRuntimeStatus runtime = new HelixSensorRuntimeStatus(TestConfigs.minimal());
        runtime.recordPayload(18000, 6, "actor_state ✓ raw_nbt false");
        runtime.setUploadInFlight(true);
        runtime.recordBackoff("backoff", "http_429");
        runtime.setUploadInFlight(false);

        assertEquals(18000, runtime.avgPayloadBytes);
        assertEquals("backoff", runtime.backoffState);
        assertEquals("backoff", runtime.uploadQueueState);
        assertEquals("http_429", runtime.lastError);
    }
}
