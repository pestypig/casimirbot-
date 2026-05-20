package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.casimirbot.helixsensor.command.CommandStatusFormatter;
import java.util.List;
import org.junit.jupiter.api.Test;

final class CommandStatusFormatterTest {
    @Test
    void formatsOperationalStatusWithoutRawPayloads() {
        HelixSensorConfig config = TestConfigs.minimal();
        HelixSensorRuntimeStatus runtime = new HelixSensorRuntimeStatus(config);
        runtime.recordSnapshotSkipped();
        runtime.recordProbeSummary("line_of_sight", "succeeded");
        runtime.recordPayload(18422, 5, "actor_state ✓ inventory_state ✓ raw_nbt false changed_sections [actor_state]");

        String status = String.join("\n", CommandStatusFormatter.status(config, runtime));
        String probes = String.join("\n", CommandStatusFormatter.probes(runtime));
        String debug = String.join("\n", CommandStatusFormatter.debugPayload(runtime));

        assertTrue(status.contains("execution_enabled: false"));
        assertTrue(status.contains("raw_nbt_included: false"));
        assertTrue(probes.contains("line_of_sight: succeeded"));
        assertTrue(debug.contains("raw_nbt false"));
    }
}
