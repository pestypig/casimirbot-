package com.casimirbot.helixsensor.fabric;

import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.scope.SensorScope;
import com.casimirbot.helixsensor.scope.SensorScopePolicy;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.logging.Logger;
import net.fabricmc.loader.api.FabricLoader;

public final class FabricSensorConfigLoader {
    public static final String CONFIG_FILE_NAME = "helix-fabric-sensor.json";

    private FabricSensorConfigLoader() {}

    public static HelixSensorConfig loadOrCreate(Logger logger) {
        Path path = FabricLoader.getInstance().getConfigDir().resolve(CONFIG_FILE_NAME);
        if (!Files.exists(path)) {
            writeDisabledTemplate(path, logger);
        }
        try {
            String text = Files.readString(path, StandardCharsets.UTF_8);
            return fromMap(HelixJson.asObject(HelixJson.parse(text)));
        } catch (RuntimeException | IOException error) {
            logger.warning(
                "Helix Fabric Sensor configuration is invalid; the connector will remain disabled. " +
                "No configuration values were logged."
            );
            return disabledDefaults();
        }
    }

    static HelixSensorConfig fromMap(Map<String, Object> config) {
        SensorScopePolicy scopePolicy = new SensorScopePolicy(
            SensorScope.from(text(config, "sensor_scope_default", "player_observable")),
            bool(config, "allow_privileged_container_scan", false),
            bool(config, "allow_privileged_entity_scan", false),
            true
        );
        return new HelixSensorConfig(
            bool(config, "enabled", false),
            HelixSensorConfig.stripTrailingSlash(
                text(config, "endpoint", HelixSensorConfig.INACTIVE_ENDPOINT)
            ),
            text(config, "bearer_token", "replace-me"),
            text(config, "source_id", "source:room-ingress:replace-with-generated-id"),
            text(config, "room_id", "room:minecraft"),
            text(config, "world_id", "minecraft:fabric-integrated-server"),
            text(config, "domain_adapter", "minecraft.fabric_mod.v1"),
            text(config, "source_label", "Minecraft Fabric Sensor"),
            positive(config, "snapshot_interval_ticks", 100),
            positive(config, "heartbeat_interval_ticks", 300),
            positive(config, "probe_poll_interval_ticks", 40),
            positive(config, "burst_interval_ticks", 20),
            positive(config, "burst_duration_ticks", 120),
            bool(config, "send_only_changed_sections", false),
            bool(config, "include_section_hashes", true),
            positive(config, "max_payload_bytes", 48_000),
            1,
            scopePolicy,
            bool(config, "read_only_probes_enabled", true),
            positive(config, "max_pending_probes_per_poll", 8),
            bool(config, "execution_enabled", false),
            false,
            new HelixSensorConfig.SeedMapOptions(
                64,
                "village",
                false,
                1,
                true,
                true
            ),
            new HelixSensorConfig.SnapshotOptions(
                true,
                true,
                true,
                true,
                false,
                false,
                true,
                true,
                false,
                positive(config, "nearby_entity_radius", 16),
                positive(config, "crop_radius", 16),
                positive(config, "local_map_radius", 8),
                0,
                positive(config, "max_entities", 128),
                positive(config, "max_crops", 48),
                positive(config, "max_local_blocks", 128),
                0,
                positive(config, "max_inventory_stacks", 64)
            ),
            new HelixSensorConfig.ProbeOptions(
                positive(config, "max_route_radius", 64),
                positive(config, "max_probe_duration_ms", 250),
                positive(config, "probe_ttl_ms", 10_000)
            )
        );
    }

    public static HelixSensorConfig disabledDefaults() {
        return fromMap(defaultTemplate());
    }

    static Map<String, Object> defaultTemplate() {
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("enabled", false);
        config.put("endpoint", HelixSensorConfig.INACTIVE_ENDPOINT);
        config.put("bearer_token", "replace-me");
        config.put("source_id", "source:room-ingress:replace-with-generated-id");
        config.put("room_id", "room:minecraft");
        config.put("world_id", "minecraft:fabric-integrated-server");
        config.put("domain_adapter", "minecraft.fabric_mod.v1");
        config.put("source_label", "Minecraft Fabric Sensor");
        config.put("execution_enabled", false);
        config.put("read_only_probes_enabled", true);
        config.put("snapshot_interval_ticks", 100);
        config.put("heartbeat_interval_ticks", 300);
        config.put("probe_poll_interval_ticks", 40);
        config.put("max_pending_probes_per_poll", 8);
        config.put("send_only_changed_sections", false);
        config.put("include_section_hashes", true);
        config.put("sensor_scope_default", "player_observable");
        config.put("allow_privileged_container_scan", false);
        config.put("allow_privileged_entity_scan", false);
        return config;
    }

    private static void writeDisabledTemplate(Path path, Logger logger) {
        try {
            Files.createDirectories(path.getParent());
            Files.writeString(
                path,
                HelixJson.stringify(defaultTemplate()) + System.lineSeparator(),
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE
            );
            logger.info(
                "Created a disabled Helix Fabric Sensor configuration. " +
                "Bind a room source before enabling it."
            );
        } catch (IOException error) {
            logger.warning(
                "Could not create the disabled Helix Fabric Sensor configuration."
            );
        }
    }

    private static boolean bool(
        Map<String, Object> config,
        String key,
        boolean fallback
    ) {
        Object value = config.get(key);
        return value instanceof Boolean bool ? bool : fallback;
    }

    private static String text(
        Map<String, Object> config,
        String key,
        String fallback
    ) {
        Object value = config.get(key);
        if (!(value instanceof String text) || text.isBlank()) return fallback;
        return text.trim();
    }

    private static int positive(
        Map<String, Object> config,
        String key,
        int fallback
    ) {
        Object value = config.get(key);
        if (!(value instanceof Number number)) return fallback;
        return HelixSensorConfig.positive(number.intValue(), fallback);
    }
}
