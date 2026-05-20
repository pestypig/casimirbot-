package com.casimirbot.helixsensor.snapshot.adapters;

import java.util.Map;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.util.RayTraceResult;

public final class RayFocusAdapter {
    public Map<String, Object> build(Player player) {
        Location eye = player.getEyeLocation();
        RayTraceResult result = player.getWorld().rayTraceBlocks(
            eye,
            eye.getDirection(),
            6.0,
            FluidCollisionMode.NEVER,
            true
        );
        if (result == null || result.getHitBlock() == null) {
            return Map.of(
                "sensor_scope", "player_observable",
                "target_kind", "empty",
                "line_of_sight", false,
                "reachable", false
            );
        }
        Block block = result.getHitBlock();
        double distance = block.getLocation().add(0.5, 0.5, 0.5).distance(eye);
        return Map.of(
            "sensor_scope", "player_observable",
            "target_kind", "block",
            "target_ref", blockRef(block),
            "target_type", AdapterUtil.materialKey(block.getType()),
            "distance", AdapterUtil.round(distance),
            "line_of_sight", true,
            "reachable", distance <= 5.0
        );
    }

    static String blockRef(Block block) {
        return "block:" + block.getWorld().getKey() + ":" + block.getX() + ":" + block.getY() + ":" + block.getZ();
    }
}
