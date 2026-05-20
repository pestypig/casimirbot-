package com.casimirbot.helixsensor.snapshot;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PayloadLimiterTest {
    @Test
    void truncatesOversizedLocalMap() {
        List<Map<String, Object>> cells = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            cells.add(Map.of("cell_ref", "cell:" + i, "cell_type", "minecraft:stone", "sensor_scope", "sensor_observable"));
        }
        Map<String, Object> snapshot = new java.util.LinkedHashMap<>();
        snapshot.put("local_map", Map.of("salient_cells", cells, "sensor_scope", "sensor_observable"));
        snapshot.put("object_state", Map.of("nearby_entities", List.of(), "resources", List.of()));

        Map<String, Object> limited = PayloadLimiter.truncateSnapshot(snapshot, 1000);

        assertTrue(PayloadLimiter.byteLength(limited) <= PayloadLimiter.byteLength(snapshot));
    }
}
