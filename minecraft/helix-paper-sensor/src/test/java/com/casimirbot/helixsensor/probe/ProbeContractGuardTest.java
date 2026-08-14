package com.casimirbot.helixsensor.probe;

import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ProbeContractGuardTest {
    @Test
    void blocksForbiddenActionProbes() {
        ProbeContractGuard guard = new ProbeContractGuard();

        assertTrue(guard.isForbiddenAction(Map.of("probe_type", "place_block")));
        assertFalse(guard.isForbiddenAction(Map.of("probe_type", "line_of_sight")));
    }

    @Test
    void requiresReadOnlyConstraints() {
        ProbeContractGuard guard = new ProbeContractGuard();

        assertTrue(guard.isReadOnly(Map.of("constraints", Map.of("read_only", true, "side_effects_allowed", false))));
        assertFalse(guard.isReadOnly(Map.of("constraints", Map.of("read_only", true, "side_effects_allowed", true))));
    }

    @Test
    void admitsLiveMechanicsFactsOnlyAsReadOnlyProbes() {
        ProbeContractGuard guard = new ProbeContractGuard();

        assertTrue(guard.isKnownReadOnlyProbe(Map.of("probe_type", "registry_fact")));
        assertTrue(guard.isKnownReadOnlyProbe(Map.of("probe_type", "recipe_fact")));
        assertFalse(guard.isForbiddenAction(Map.of("probe_type", "registry_fact")));
    }
}
