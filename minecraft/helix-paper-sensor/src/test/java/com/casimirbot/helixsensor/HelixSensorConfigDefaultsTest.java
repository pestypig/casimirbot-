package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

final class HelixSensorConfigDefaultsTest {
    @Test
    void canonicalDefaultsRemainInactiveAndReadOnly() {
        assertFalse(HelixSensorConfig.DEFAULT_ENABLED);
        assertTrue(HelixSensorConfig.DEFAULT_READ_ONLY_PROBES_ENABLED);
        assertFalse(HelixSensorConfig.DEFAULT_EXECUTION_ENABLED);
        assertEquals(100, HelixSensorConfig.DEFAULT_HEARTBEAT_INTERVAL_TICKS);
        assertEquals(300, HelixSensorConfig.MIN_MANIFEST_REFRESH_INTERVAL_TICKS);
        assertEquals(
            "https://casimirbot.com/api/room-ingress/v1/bindings/replace-with-generated-id",
            HelixSensorConfig.INACTIVE_ENDPOINT
        );
    }
}
