package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;

public final class EntityStateAdapter {
    private final HelixSensorConfig config;

    public EntityStateAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public List<Map<String, Object>> build(Player player) {
        if (!config.snapshotOptions().includeNearbyEntities()) return List.of();
        Location origin = player.getLocation();
        double radius = config.snapshotOptions().nearbyEntityRadius();
        return player.getWorld().getNearbyEntities(origin, radius, radius, radius).stream()
            .filter(entity -> !(entity instanceof Player))
            .sorted(Comparator.comparingDouble(entity -> entity.getLocation().distanceSquared(origin)))
            .limit(config.snapshotOptions().maxEntities())
            .map(entity -> entitySummary(entity, origin))
            .toList();
    }

    private Map<String, Object> entitySummary(Entity entity, Location origin) {
        return Map.of(
            "object_ref", "entity:" + entity.getUniqueId(),
            "object_type", AdapterUtil.entityType(entity),
            "position", AdapterUtil.position(entity.getLocation()),
            "distance", AdapterUtil.round(entity.getLocation().distance(origin)),
            "tags", AdapterUtil.entityTags(entity),
            "sensor_scope", "sensor_observable"
        );
    }
}
