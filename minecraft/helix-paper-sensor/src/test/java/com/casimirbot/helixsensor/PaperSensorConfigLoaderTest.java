package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.bukkit.configuration.file.YamlConfiguration;
import org.junit.jupiter.api.Test;

final class PaperSensorConfigLoaderTest {
    @Test
    void defaultsToAHeartbeatCadenceWithFreshnessHeadroom() {
        HelixSensorConfig config = PaperSensorConfigLoader.from(
            new YamlConfiguration()
        );

        assertEquals(
            HelixSensorConfig.DEFAULT_HEARTBEAT_INTERVAL_TICKS,
            config.heartbeatIntervalTicks()
        );
    }

    @Test
    void preservesAnExplicitPositiveHeartbeatCadence() {
        YamlConfiguration yaml = new YamlConfiguration();
        yaml.set("helix.heartbeat_interval_ticks", 200);

        assertEquals(
            200,
            PaperSensorConfigLoader.from(yaml).heartbeatIntervalTicks()
        );
    }
}
