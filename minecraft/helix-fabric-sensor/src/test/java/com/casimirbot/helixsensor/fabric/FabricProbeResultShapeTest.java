package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

final class FabricProbeResultShapeTest {
    @Test
    void reachabilityUsesOnlyLegacyProbeEnvelopeFields() {
        Map<String, Object> result =
            FabricProbeExecutor.reachabilityResult(4.5d, true);

        assertEquals(
            Set.of(
                "feasible",
                "reachable",
                "distance_blocks",
                "confidence"
            ),
            result.keySet()
        );
        assertEquals(true, result.get("feasible"));
        assertEquals(true, result.get("reachable"));
        assertEquals(4.5d, result.get("distance_blocks"));
        assertFalse(result.containsKey("limitation"));
        assertTrue((double) result.get("confidence") <= 1.0d);
    }
}
