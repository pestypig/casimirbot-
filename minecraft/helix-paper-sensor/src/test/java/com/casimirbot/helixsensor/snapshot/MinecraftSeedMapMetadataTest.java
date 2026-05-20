package com.casimirbot.helixsensor.snapshot;

import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.TestConfigs;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MinecraftSeedMapMetadataTest {
    @Test
    void seedMapMetadataIsConfigGated() {
        Map<String, Object> meta = MinecraftSeedMapMetadata.buildSeedMapMeta(
            "123456789",
            "1.21.4-R0.1-SNAPSHOT",
            TestConfigs.minimal()
        );

        assertTrue(meta.isEmpty());
    }

    @Test
    void seedMapMetadataCarriesTopLevelAndNestedBridgeFields() {
        HelixSensorConfig config = TestConfigs.withSeedMap();
        Map<String, Object> meta = MinecraftSeedMapMetadata.buildSeedMapMeta(
            "123456789",
            "1.21.4-R0.1-SNAPSHOT",
            config
        );
        Map<String, Object> seedMap = HelixJson.asObject(meta.get("seed_map"));

        assertEquals("123456789", meta.get("seed"));
        assertEquals("1.21.4", meta.get("minecraft_version"));
        assertEquals("java", meta.get("edition"));
        assertEquals(meta.get("seed"), seedMap.get("seed"));
        assertEquals(meta.get("minecraft_version"), seedMap.get("minecraft_version"));
        assertEquals(64, seedMap.get("radius_chunks"));
        assertEquals("village", seedMap.get("selected_target_label"));
        assertTrue(String.valueOf(meta.get("minecraft_version")).matches("^\\d+\\.\\d+(\\.\\d+)?$"));
    }

    @Test
    void seedCanBeRedactedForDebugLogs() {
        HelixSensorConfig config = TestConfigs.withSeedMap();
        Map<String, Object> meta = MinecraftSeedMapMetadata.buildSeedMapMeta(
            "123456789",
            "1.21.4-R0.1-SNAPSHOT",
            config
        );
        Map<String, Object> redacted = MinecraftSeedMapMetadata.redactForDebug(meta, config);
        Map<String, Object> seedMap = HelixJson.asObject(redacted.get("seed_map"));

        assertEquals("<redacted>", redacted.get("seed"));
        assertEquals("<redacted>", seedMap.get("seed"));
        assertEquals("1.21.4", redacted.get("minecraft_version"));
    }

    @Test
    void locationSampleEventCarriesSeedMapMetadata() {
        HelixSensorConfig config = TestConfigs.withSeedMap();
        Map<String, Object> seedMeta = MinecraftSeedMapMetadata.buildSeedMapMeta(
            "123456789",
            "1.21.4-R0.1-SNAPSHOT",
            config
        );
        Map<String, Object> event = LocationSampleWorldEventBuilder.build(
            Map.of(
                "snapshot_id", "snapshot:test",
                "actor_id", "minecraft:player:DatDamPig",
                "actor_label", "DatDamPig",
                "ts", "2026-05-20T18:00:00.000Z",
                "location", Map.of(
                    "dimension", "minecraft:overworld",
                    "x", 280.5,
                    "y", 63,
                    "z", -406.5
                )
            ),
            config,
            seedMeta,
            12345
        );
        Map<String, Object> meta = HelixJson.asObject(event.get("meta"));
        Map<String, Object> seedMap = HelixJson.asObject(meta.get("seed_map"));

        assertEquals("player_location_sample", event.get("event_type"));
        assertEquals("123456789", meta.get("seed"));
        assertTrue(String.valueOf(meta.get("minecraft_version")).matches("^\\d+\\.\\d+(\\.\\d+)?$"));
        assertEquals(meta.get("seed"), seedMap.get("seed"));
        assertEquals(meta.get("minecraft_version"), seedMap.get("minecraft_version"));
        assertTrue(((Number) seedMap.get("radius_chunks")).intValue() > 0);
    }
}
