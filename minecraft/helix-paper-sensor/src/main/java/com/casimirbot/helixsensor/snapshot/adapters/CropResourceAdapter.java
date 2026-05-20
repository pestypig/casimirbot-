package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.block.data.Ageable;
import org.bukkit.entity.Player;

public final class CropResourceAdapter {
    private final HelixSensorConfig config;

    public CropResourceAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public List<Map<String, Object>> build(Player player) {
        if (!config.snapshotOptions().includeCrops()) return List.of();
        List<Map<String, Object>> resources = new ArrayList<>();
        Location origin = player.getLocation();
        int radius = config.snapshotOptions().cropRadius();
        for (int dx = -radius; dx <= radius && resources.size() < config.snapshotOptions().maxCrops(); dx++) {
            for (int dy = -2; dy <= 2 && resources.size() < config.snapshotOptions().maxCrops(); dy++) {
                for (int dz = -radius; dz <= radius && resources.size() < config.snapshotOptions().maxCrops(); dz++) {
                    Block block = origin.getWorld().getBlockAt(origin.getBlockX() + dx, origin.getBlockY() + dy, origin.getBlockZ() + dz);
                    if (!(block.getBlockData() instanceof Ageable ageable)) continue;
                    boolean mature = ageable.getAge() >= ageable.getMaximumAge();
                    resources.add(Map.of(
                        "resource_ref", "resource:" + block.getWorld().getKey() + ":" + block.getX() + ":" + block.getY() + ":" + block.getZ(),
                        "resource_type", AdapterUtil.materialKey(block.getType()),
                        "position", AdapterUtil.position(block.getLocation()),
                        "state", mature ? "available" : "growing",
                        "amount", 1,
                        "tags", List.of("crop"),
                        "sensor_scope", "sensor_observable"
                    ));
                }
            }
        }
        return resources;
    }
}
