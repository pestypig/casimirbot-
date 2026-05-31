package com.casimirbot.helixsensor;

import com.casimirbot.helixsensor.scope.SensorScope;
import com.casimirbot.helixsensor.scope.SensorScopePolicy;

public final class TestConfigs {
    private TestConfigs() {}

    public static HelixSensorConfig minimal() {
        return new HelixSensorConfig(
            true,
            "http://localhost:5050",
            "token",
            "source:minecraft-paper-plugin",
            "room:minecraft",
            "minecraft:paper-server",
            "minecraft.paper_plugin.v1",
            "Minecraft Paper Plugin",
            100,
            300,
            40,
            20,
            120,
            true,
            true,
            48000,
            1,
            new SensorScopePolicy(SensorScope.PLAYER_OBSERVABLE, false, false, true),
            true,
            8,
            false,
            false,
            new HelixSensorConfig.SeedMapOptions(64, "village", true, 1, true, true),
            new HelixSensorConfig.SnapshotOptions(true, true, true, true, true, true, true, true, false, 16, 16, 8, 0, 24, 48, 128, 48, 64),
            new HelixSensorConfig.ProbeOptions(64, 250, 10000)
        );
    }

    public static HelixSensorConfig withSeedMap() {
        HelixSensorConfig base = minimal();
        return new HelixSensorConfig(
            base.enabled(),
            base.endpoint(),
            base.bearerToken(),
            base.sourceId(),
            base.roomId(),
            base.worldId(),
            base.domainAdapter(),
            base.sourceLabel(),
            base.snapshotIntervalTicks(),
            base.heartbeatIntervalTicks(),
            base.probePollIntervalTicks(),
            base.burstIntervalTicks(),
            base.burstDurationTicks(),
            base.sendOnlyChangedSections(),
            base.includeSectionHashes(),
            base.maxPayloadBytes(),
            base.maxPendingUploads(),
            base.sensorScopePolicy(),
            base.readOnlyProbesEnabled(),
            base.maxPendingProbesPerPoll(),
            base.executionEnabled(),
            true,
            new HelixSensorConfig.SeedMapOptions(64, "village", true, 1, true, true),
            base.snapshotOptions(),
            base.probeOptions()
        );
    }
}
