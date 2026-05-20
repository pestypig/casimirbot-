package com.casimirbot.helixsensor.probe;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import com.casimirbot.helixsensor.scope.SensorScope;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Bukkit;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.data.Ageable;
import org.bukkit.entity.Monster;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;

public final class ProbeExecutor {
    private final HelixSensorConfig config;
    private final ProbeContractGuard guard;
    private final HelixSensorRuntimeStatus runtimeStatus;

    public ProbeExecutor(HelixSensorConfig config, ProbeContractGuard guard, HelixSensorRuntimeStatus runtimeStatus) {
        this.config = config;
        this.guard = guard;
        this.runtimeStatus = runtimeStatus;
    }

    public Map<String, Object> executeOnMainThread(Map<String, Object> probe) {
        if (guard.isForbiddenAction(probe)) {
            runtimeStatus.recordForbiddenProbeBlocked();
            return blocked(probe, "Probe type would require live action and is forbidden.");
        }
        if (!guard.isKnownReadOnlyProbe(probe)) return blocked(probe, "Probe type is unknown and blocked by policy.");
        if (!guard.isReadOnly(probe)) return blocked(probe, "Probe is not read-only.");
        Player player = resolvePlayer(probe);
        if (player == null) return failed(probe, "No matching online player is available.");
        String type = String.valueOf(probe.get("probe_type"));
        return switch (type) {
            case "inventory_check" -> inventoryCheck(probe, player);
            case "line_of_sight" -> lineOfSight(probe, player);
            case "reachability" -> reachability(probe, player, type);
            case "route_feasibility" -> unsupported(probe, "route_feasibility is not implemented by this plugin version.");
            case "crop_state" -> cropState(probe, player);
            case "hazard_check" -> hazardCheck(probe, player);
            case "local_map_summary" -> localMapSummary(probe, player);
            case "container_freshness" -> failed(probe, "Closed container contents are not exposed by default.");
            default -> unsupported(probe, "Probe type is not supported by this MVP sensor.");
        };
    }

    private Player resolvePlayer(Map<String, Object> probe) {
        Object target = probe.get("target");
        String actor = null;
        if (target instanceof Map<?, ?> targetMap && targetMap.get("actor_id") != null) {
            actor = String.valueOf(targetMap.get("actor_id"));
        }
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (actor == null || actor.endsWith(player.getName()) || actor.equals(player.getUniqueId().toString())) return player;
        }
        return Bukkit.getOnlinePlayers().stream().findFirst().orElse(null);
    }

    private Map<String, Object> inventoryCheck(Map<String, Object> probe, Player player) {
        int stacks = 0;
        int foodStacks = 0;
        for (ItemStack item : player.getInventory().getContents()) {
            if (item == null || item.getType().isAir()) continue;
            stacks++;
            if (item.getType().isEdible()) foodStacks++;
        }
        return success(probe, "Inventory read-only check completed.", SensorScope.PLAYER_OBSERVABLE, Map.of(
            "confidence", 0.95,
            "details", Map.of("stack_count", stacks, "food_stack_count", foodStacks)
        ));
    }

    private Map<String, Object> lineOfSight(Map<String, Object> probe, Player player) {
        Location target = targetLocation(probe);
        if (target == null) return failed(probe, "Probe target position is missing.");
        Location eye = player.getEyeLocation();
        double distance = eye.distance(target);
        RayTraceResult ray = player.getWorld().rayTraceBlocks(eye, target.toVector().subtract(eye.toVector()), distance, FluidCollisionMode.NEVER, true);
        boolean clear = ray == null || ray.getHitPosition().distance(target.toVector()) < 1.5;
        return success(probe, "Line-of-sight read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "line_of_sight", clear,
            "distance_blocks", round(distance),
            "confidence", 0.85
        ));
    }

    private Map<String, Object> reachability(Map<String, Object> probe, Player player, String type) {
        Location target = targetLocation(probe);
        if (target == null) return failed(probe, "Probe target position is missing.");
        double distance = player.getLocation().distance(target);
        boolean within = distance <= config.probeOptions().maxRouteRadius();
        boolean nearby = distance <= 5.0;
        return success(probe, type + " read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "feasible", within,
            "reachable", nearby,
            "distance_blocks", round(distance),
            "path_cost_blocks", round(distance),
            "confidence", within ? 0.72 : 0.4
        ));
    }

    private Map<String, Object> cropState(Map<String, Object> probe, Player player) {
        Location target = targetLocation(probe);
        Block block = target == null ? player.getTargetBlockExact(6) : target.getBlock();
        if (block == null || !(block.getBlockData() instanceof Ageable ageable)) {
            return failed(probe, "Target block is not a crop.");
        }
        boolean mature = ageable.getAge() >= ageable.getMaximumAge();
        return success(probe, "Crop state read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "crop_mature", mature,
            "confidence", 0.9,
            "details", Map.of("block_type", block.getType().getKey().toString())
        ));
    }

    private Map<String, Object> hazardCheck(Map<String, Object> probe, Player player) {
        long hostileCount = player.getWorld()
            .getNearbyEntities(player.getLocation(), 16, 8, 16).stream()
            .filter(entity -> entity instanceof Monster)
            .count();
        return success(probe, "Hazard check read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "hazard_present", hostileCount > 0,
            "confidence", 0.82,
            "details", Map.of("hostile_entity_count", hostileCount)
        ));
    }

    private Map<String, Object> localMapSummary(Map<String, Object> probe, Player player) {
        int solid = 0;
        Location origin = player.getLocation();
        for (int dx = -4; dx <= 4; dx++) {
            for (int dz = -4; dz <= 4; dz++) {
                Material type = origin.getWorld().getBlockAt(origin.getBlockX() + dx, origin.getBlockY() - 1, origin.getBlockZ() + dz).getType();
                if (!type.isAir()) solid++;
            }
        }
        return success(probe, "Local map summary read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "confidence", 0.8,
            "details", Map.of("sampled_floor_blocks", 81, "solid_floor_blocks", solid)
        ));
    }

    private Location targetLocation(Map<String, Object> probe) {
        Object target = probe.get("target");
        if (!(target instanceof Map<?, ?> targetMap)) return null;
        Object position = targetMap.get("position");
        if (!(position instanceof Map<?, ?> pos)) return null;
        Number x = number(pos.get("x"));
        Number y = number(pos.get("y"));
        Number z = number(pos.get("z"));
        if (x == null || y == null) return null;
        Player player = Bukkit.getOnlinePlayers().stream().findFirst().orElse(null);
        if (player == null) return null;
        return new Location(player.getWorld(), x.doubleValue(), y.doubleValue(), z == null ? player.getLocation().getZ() : z.doubleValue());
    }

    private Number number(Object value) {
        return value instanceof Number number ? number : null;
    }

    private Map<String, Object> success(Map<String, Object> probe, String summary, SensorScope scope, Map<String, Object> result) {
        return base(probe, "succeeded", summary, scope, result);
    }

    private Map<String, Object> failed(Map<String, Object> probe, String summary) {
        return base(probe, "failed", summary, SensorScope.UNKNOWN, Map.of("confidence", 0.2));
    }

    private Map<String, Object> unsupported(Map<String, Object> probe, String summary) {
        return base(probe, "unsupported", summary, SensorScope.UNKNOWN, Map.of());
    }

    private Map<String, Object> blocked(Map<String, Object> probe, String summary) {
        return base(probe, "blocked_by_policy", summary, SensorScope.UNKNOWN, Map.of());
    }

    private Map<String, Object> base(Map<String, Object> probe, String status, String summary, SensorScope scope, Map<String, Object> result) {
        runtimeStatus.recordProbeSummary(String.valueOf(probe.get("probe_type")), status);
        Map<String, Object> output = new LinkedHashMap<>();
        output.put("schema", "helix.environment_probe_result.v1");
        output.put("probe_result_id", "environment_probe_result:" + probe.get("probe_request_id") + ":" + status);
        output.put("probe_request_id", String.valueOf(probe.get("probe_request_id")));
        output.put("source_id", config.sourceId());
        output.put("room_id", config.roomId());
        output.put("domain", "minecraft");
        output.put("probe_type", String.valueOf(probe.get("probe_type")));
        output.put("status", status);
        output.put("result_summary", summary);
        output.put("result", result);
        output.put("sensor_scope", scope.wireValue());
        output.put("requires_caveat", config.sensorScopePolicy().requiresCaveat(scope));
        output.put("side_effects_performed", false);
        output.put("commands_executed", List.of());
        output.put("world_mutation_performed", false);
        output.put("evidence_refs", List.of("minecraft:probe:" + probe.get("probe_request_id")));
        output.put("deterministic", true);
        output.put("model_invoked", false);
        output.put("assistant_answer", false);
        output.put("raw_content_included", false);
        output.put("context_policy", "compact_context_pack_only");
        output.put("created_at", Instant.now().toString());
        return output;
    }

    private double round(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }
}
