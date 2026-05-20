package com.casimirbot.helixsensor.scope;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SensorScopePolicyTest {
    @Test
    void privilegedStateRequiresCaveatAndDefaultPrivilegedScansAreOff() {
        SensorScopePolicy policy = new SensorScopePolicy(SensorScope.PLAYER_OBSERVABLE, false, false, true);

        assertFalse(policy.allowPrivilegedContainerScan());
        assertFalse(policy.allowPrivilegedEntityScan());
        assertTrue(policy.requiresCaveat(SensorScope.PRIVILEGED_SERVER_STATE));
        assertFalse(policy.requiresCaveat(SensorScope.PLAYER_MEMORY));
    }
}
