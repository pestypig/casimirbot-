package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

final class RuntimeStatusTest {
    @Test
    void recordsHttpHealthAndPayloadAverages() {
        HelixSensorRuntimeStatus status = new HelixSensorRuntimeStatus(TestConfigs.minimal());
        status.recordHttpResult("/api/agi/environment/sources/manifest", 200, 12);
        status.recordHttpResult("/api/agi/situation/world-event/batch", 413, 20);
        status.recordPayload(100, 4, "actor_state ✓ raw_nbt false");
        status.recordPayload(300, 8, "actor_state unchanged raw_nbt false");

        assertTrue(status.lastManifestSuccessAt != null);
        assertEquals(1, status.oversizedPayloadCount);
        assertEquals("payload_too_large", status.lastError);
        assertEquals(200, status.avgPayloadBytes);
        assertEquals(8, status.lastSnapshotBuildMillis);
    }
}
