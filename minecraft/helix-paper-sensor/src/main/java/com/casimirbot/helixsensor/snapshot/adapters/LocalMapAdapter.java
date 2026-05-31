package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.Material;
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
                Map<String, Object> cell = traversabilityCell(origin, dx, dz);
                if (!cell.isEmpty()) cells.add(cell);
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

    private Map<String, Object> traversabilityCell(Location origin, int dx, int dz) {
        int x = origin.getBlockX() + dx;
        int z = origin.getBlockZ() + dz;
        int feetY = origin.getBlockY();
        Block feet = origin.getWorld().getBlockAt(x, feetY, z);
        Block head = origin.getWorld().getBlockAt(x, feetY + 1, z);
        Block floor = origin.getWorld().getBlockAt(x, feetY - 1, z);
        Block belowFloor = origin.getWorld().getBlockAt(x, feetY - 2, z);
        Block stepFloor = origin.getWorld().getBlockAt(x, feetY, z);
        Block stepFeet = origin.getWorld().getBlockAt(x, feetY + 1, z);
        Block stepHead = origin.getWorld().getBlockAt(x, feetY + 2, z);

        List<String> tags = new ArrayList<>();
        tags.add("traversability_sample");
        if (dx == 0 && dz == 0) tags.add("current_column");
        if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) tags.add("adjacent_column");

        boolean floorSolid = floor.getType().isSolid();
        boolean feetClear = passable(feet);
        boolean headClear = passable(head);
        boolean walkable = floorSolid && feetClear && headClear;
        boolean stepUp = !walkable && stepFloor.getType().isSolid() && passable(stepFeet) && passable(stepHead);
        boolean fluid = isFluid(feet.getType()) || isFluid(floor.getType());
        boolean lava = feet.getType() == Material.LAVA || floor.getType() == Material.LAVA;
        boolean water = feet.getType() == Material.WATER || floor.getType() == Material.WATER;
        boolean portal = isPortal(feet.getType()) || isPortal(head.getType()) || isPortal(floor.getType());
        boolean doorLike = isDoorLike(feet.getType()) || isDoorLike(head.getType()) || isDoorLike(floor.getType());
        boolean fenceLike = isFenceLike(feet.getType()) || isFenceLike(floor.getType());
        boolean stairLike = isStairLike(floor.getType()) || isStairLike(feet.getType());
        boolean slabLike = isSlabLike(floor.getType()) || isSlabLike(feet.getType());
        boolean drop = floor.getType().isAir() && belowFloor.getType().isAir();
        boolean blocked = !feetClear || !headClear;

        if (walkable) {
            tags.add("walkable");
            tags.add("traversable");
        }
        if (stepUp) tags.add("step_up_candidate");
        if (drop) tags.add("drop_or_void_risk");
        if (blocked) tags.add("blocked");
        if (fluid) tags.add("fluid");
        if (lava) tags.add("hazard_lava");
        if (water) tags.add("water");
        if (portal) tags.add("portal_or_gateway");
        if (doorLike) tags.add("door_or_trapdoor");
        if (fenceLike) tags.add("barrier_like");
        if (stairLike) tags.add("stairs");
        if (slabLike) tags.add("slab");

        if (!walkable && !stepUp && !drop && !fluid && !portal && !doorLike && !fenceLike && !stairLike && !slabLike && floor.getType().isAir()) {
            return Map.of();
        }

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("walkable", walkable);
        state.put("step_up_candidate", stepUp);
        state.put("blocked", blocked);
        state.put("drop_or_void_risk", drop);
        state.put("fluid", fluid);
        state.put("floor_type", AdapterUtil.materialKey(floor.getType()));
        state.put("feet_type", AdapterUtil.materialKey(feet.getType()));
        state.put("head_type", AdapterUtil.materialKey(head.getType()));
        state.put("below_floor_type", AdapterUtil.materialKey(belowFloor.getType()));

        Map<String, Object> cell = new LinkedHashMap<>();
        cell.put("cell_ref", "cell:" + floor.getWorld().getKey() + ":" + floor.getX() + ":" + floor.getY() + ":" + floor.getZ());
        cell.put("cell_type", AdapterUtil.materialKey(floor.getType()));
        cell.put("position", AdapterUtil.position(floor.getLocation()));
        cell.put("tags", tags);
        cell.put("state", state);
        cell.put("sensor_scope", "sensor_observable");
        return cell;
    }

    private boolean passable(Block block) {
        return block.getType().isAir() || block.isPassable() || isFluid(block.getType()) || isPortal(block.getType());
    }

    private boolean isFluid(Material material) {
        return material == Material.WATER || material == Material.LAVA;
    }

    private boolean isPortal(Material material) {
        String key = material.getKey().toString();
        return key.contains("portal") || key.contains("gateway");
    }

    private boolean isDoorLike(Material material) {
        String key = material.getKey().toString();
        return key.endsWith("_door") || key.endsWith("_trapdoor") || key.endsWith("_gate");
    }

    private boolean isFenceLike(Material material) {
        String key = material.getKey().toString();
        return key.endsWith("_fence") || key.endsWith("_wall") || key.endsWith("_fence_gate");
    }

    private boolean isStairLike(Material material) {
        return material.getKey().toString().endsWith("_stairs");
    }

    private boolean isSlabLike(Material material) {
        return material.getKey().toString().endsWith("_slab");
    }
}
