package com.casimirbot.helixsensor.manifest;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import com.casimirbot.helixsensor.TestConfigs;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class ManifestPublisherLifecycleTest {
    @Test
    void keepsManifestIdentityStableAcrossRefreshesInOneProducerProcess() {
        HelixSensorConfig config = TestConfigs.minimal();
        ManifestPublisher publisher = new ManifestPublisher(
            null,
            config,
            null,
            new HelixSensorRuntimeStatus(config)
        );

        Map<String, Object> first = publisher.currentManifest();
        Map<String, Object> refresh = publisher.currentManifest();

        assertEquals(first, refresh);
        assertEquals(first.get("created_at"), refresh.get("created_at"));
    }
}
