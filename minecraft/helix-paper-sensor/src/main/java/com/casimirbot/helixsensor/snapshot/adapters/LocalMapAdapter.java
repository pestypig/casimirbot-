package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;

public final class LocalMapAdapter {
    private final HelixSensorConfig config;

    public LocalMapAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public Map<String, Object> build(Player player) {
        if (!config.snapshotOptions().includeLocalMap()) return Map.of();
        int radius = config.snapshotOptions().localMapRadius();
        Location origin = player.getLocation();
        List<Map<String, Object>> cells = new ArrayList<>();
        for (int dx = -radius; dx <= radius && cells.size() < config.snapshotOptions().maxLocalBlocks(); dx++) {
            for (int dz = -radius; dz <= radius && cells.size() < config.snapshotOptions().maxLocalBlocks(); dz++) {
                Block block = origin.getWorld().getBlockAt(origin.getBlockX() + dx, origin.getBlockY() - 1, origin.getBlockZ() + dz);
                if (block.getType().isAir()) continue;
                cells.add(Map.of(
                    "cell_ref", "cell:" + block.getWorld().getKey() + ":" + block.getX() + ":" + block.getY() + ":" + block.getZ(),
                    "cell_type", AdapterUtil.materialKey(block.getType()),
                    "position", AdapterUtil.position(block.getLocation()),
                    "sensor_scope", "sensor_observable"
                ));
            }
        }
        return Map.of(
            "sensor_scope", "sensor_observable",
            "radius", radius,
            "salient_cells", cells,
            "map_hash", SectionHasher.hash(cells),
            "changed_since_last_snapshot", true
        );
    }
}
