package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class FabricSensorConfigLoaderTest {
    @Test
    void createsDisabledReadOnlyFabricDefaults() {
        HelixSensorConfig config = FabricSensorConfigLoader.disabledDefaults();

        assertFalse(config.enabled());
        assertFalse(config.executionEnabled());
        assertTrue(config.readOnlyProbesEnabled());
        assertTrue(config.domainAdapter().equals("minecraft.fabric_mod.v1"));
        assertFalse(config.sendOnlyChangedSections());
        assertFalse(config.sensorUploadsAllowed());
    }

    @Test
    void admitsOnlyBoundLoopbackOrHttpsConfiguration() {
        Map<String, Object> loopback = new LinkedHashMap<>(
            FabricSensorConfigLoader.defaultTemplate()
        );
        loopback.put("enabled", true);
        loopback.put(
            "endpoint",
            "http://127.0.0.1:1522/api/room-ingress/v1/bindings/binding:test"
        );
        loopback.put("bearer_token", "room-source-test-credential");
        assertTrue(FabricSensorConfigLoader.fromMap(loopback).sensorUploadsAllowed());

        loopback.put("endpoint", "http://example.com/ingress");
        assertFalse(FabricSensorConfigLoader.fromMap(loopback).sensorUploadsAllowed());

        loopback.put("endpoint", "https://example.com/ingress");
        loopback.put("execution_enabled", true);
        assertFalse(FabricSensorConfigLoader.fromMap(loopback).sensorUploadsAllowed());
    }
}
