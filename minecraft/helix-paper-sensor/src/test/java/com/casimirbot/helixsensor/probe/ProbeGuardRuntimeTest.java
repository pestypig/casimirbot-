package com.casimirbot.helixsensor.probe;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

final class ProbeGuardRuntimeTest {
    @Test
    void separatesReadOnlyUnsupportedAndForbiddenProbes() {
        ProbeContractGuard guard = new ProbeContractGuard();
        assertTrue(guard.isKnownReadOnlyProbe(Map.of("probe_type", "inventory_check")));
        assertTrue(guard.isKnownReadOnlyProbe(Map.of("probe_type", "route_feasibility")));
        assertTrue(guard.isForbiddenAction(Map.of("probe_type", "place_block")));
        assertFalse(guard.isKnownReadOnlyProbe(Map.of("probe_type", "place_block")));
        assertFalse(guard.isKnownReadOnlyProbe(Map.of("probe_type", "teleport_actor")));
    }
}
