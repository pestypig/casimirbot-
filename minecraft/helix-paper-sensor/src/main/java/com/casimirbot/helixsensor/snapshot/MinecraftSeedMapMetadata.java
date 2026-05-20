package com.casimirbot.helixsensor.snapshot;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.LinkedHashMap;
import java.util.Map;
import org.bukkit.Bukkit;
import org.bukkit.World;

public final class MinecraftSeedMapMetadata {
    private MinecraftSeedMapMetadata() {}

    public static Map<String, Object> buildSeedMapMeta(World world, HelixSensorConfig config) {
        if (!config.emitSeedMapMetadata() || world == null) return Map.of();
        return buildSeedMapMeta(
            Long.toString(world.getSeed()),
            Bukkit.getServer().getBukkitVersion(),
            config
        );
    }

    public static Map<String, Object> buildSeedMapMeta(String seed, String bukkitVersion, HelixSensorConfig config) {
        if (!config.emitSeedMapMetadata() || seed == null || seed.isBlank()) return Map.of();
        String minecraftVersion = minecraftVersionFromBukkitVersion(bukkitVersion);
        Map<String, Object> seedMap = new LinkedHashMap<>();
        seedMap.put("seed", seed);
        seedMap.put("minecraft_version", minecraftVersion);
        seedMap.put("edition", "java");
        seedMap.put("radius_chunks", config.seedMapOptions().radiusChunks());
        seedMap.put("selected_target_label", config.seedMapOptions().selectedTargetLabel());

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("seed", seed);
        meta.put("minecraft_version", minecraftVersion);
        meta.put("edition", "java");
        meta.put("seed_map", seedMap);
        return meta;
    }

    public static String minecraftVersionFromBukkitVersion(String bukkitVersion) {
        if (bukkitVersion == null || bukkitVersion.isBlank()) return "unknown";
        String trimmed = bukkitVersion.trim();
        int dash = trimmed.indexOf('-');
        return dash > 0 ? trimmed.substring(0, dash) : trimmed;
    }

    public static Map<String, Object> redactForDebug(Map<String, Object> meta, HelixSensorConfig config) {
        if (!config.seedMapOptions().redactSeedInDebugLogs() || meta.isEmpty()) return meta;
        Map<String, Object> redacted = new LinkedHashMap<>(meta);
        if (redacted.containsKey("seed")) redacted.put("seed", "<redacted>");
        Object seedMapValue = redacted.get("seed_map");
        if (seedMapValue instanceof Map<?, ?> seedMap) {
            Map<String, Object> redactedSeedMap = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : seedMap.entrySet()) {
                redactedSeedMap.put(String.valueOf(entry.getKey()), "seed".equals(String.valueOf(entry.getKey())) ? "<redacted>" : entry.getValue());
            }
            redacted.put("seed_map", redactedSeedMap);
        }
        return redacted;
    }
}
