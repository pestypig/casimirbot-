package com.casimirbot.helixsensor.probe;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import com.casimirbot.helixsensor.scope.SensorScope;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.bukkit.Bukkit;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.data.Ageable;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Monster;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.util.RayTraceResult;

public final class ProbeExecutor {
    static record InventoryStackDetail(int slot, String item, int count, boolean edible) {}
    static record ActorCandidate(int index, String actorId, String actorLabel) {}
    static record ActorSelection(String status, Integer selectedIndex) {}
    private record PlayerResolution(Player player, String failureCode, String failureSummary) {}

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
        PlayerResolution resolution = resolvePlayer(probe);
        if (resolution.player() == null) {
            return failed(probe, resolution.failureSummary(), resolution.failureCode());
        }
        Player player = resolution.player();
        String type = String.valueOf(probe.get("probe_type"));
        return switch (type) {
            case "actor_status" -> actorStatus(probe, player);
            case "inventory_check" -> inventoryCheck(probe, player);
            case "nearby_entities" -> nearbyEntities(probe, player);
            case "line_of_sight" -> lineOfSight(probe, player);
            case "reachability" -> reachability(probe, player, type);
            case "crop_state" -> cropState(probe, player);
            case "hazard_check" -> hazardCheck(probe, player);
            case "local_map_summary" -> localMapSummary(probe, player);
            default -> unsupported(probe, "Probe type is not supported by this MVP sensor.");
        };
    }

    private PlayerResolution resolvePlayer(Map<String, Object> probe) {
        Object target = probe.get("target");
        String actor = null;
        if (target instanceof Map<?, ?> targetMap && targetMap.get("actor_id") != null) {
            actor = String.valueOf(targetMap.get("actor_id")).trim();
        }
        List<Player> players = List.copyOf(Bukkit.getOnlinePlayers());
        List<ActorCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < players.size(); index++) {
            Player player = players.get(index);
            candidates.add(new ActorCandidate(
                index,
                player.getUniqueId().toString(),
                player.getName()
            ));
        }
        ActorSelection selection = selectActor(candidates, actor);
        if ("selected".equals(selection.status()) && selection.selectedIndex() != null) {
            return new PlayerResolution(players.get(selection.selectedIndex()), null, null);
        }
        if ("target_ambiguous".equals(selection.status())) {
            return new PlayerResolution(
                null,
                "target_ambiguous",
                "The current actor is ambiguous because multiple players are online and no exact actor binding was supplied."
            );
        }
        return new PlayerResolution(
            null,
            "target_unavailable",
            actor == null || actor.isBlank()
                ? "No online player is available for the current actor."
                : "The exactly requested actor is not online in this world."
        );
    }

    static ActorSelection selectActor(List<ActorCandidate> candidates, String requestedActorId) {
        String requested = requestedActorId == null ? "" : requestedActorId.trim();
        if (!requested.isEmpty()) {
            List<ActorCandidate> exactMatches = candidates.stream()
                .filter(candidate ->
                    requested.equalsIgnoreCase(candidate.actorId()) ||
                    requested.equalsIgnoreCase(candidate.actorLabel())
                )
                .toList();
            return exactMatches.size() == 1
                ? new ActorSelection("selected", exactMatches.get(0).index())
                : new ActorSelection(
                    exactMatches.size() > 1 ? "target_ambiguous" : "target_unavailable",
                    null
                );
        }
        return switch (candidates.size()) {
            case 0 -> new ActorSelection("target_unavailable", null);
            case 1 -> new ActorSelection("selected", candidates.get(0).index());
            default -> new ActorSelection("target_ambiguous", null);
        };
    }

    private Map<String, Object> actorStatus(Map<String, Object> probe, Player player) {
        Location location = player.getLocation();
        List<String> statusFlags = new ArrayList<>();
        if (player.isSprinting()) statusFlags.add("sprinting");
        if (player.isSneaking()) statusFlags.add("sneaking");
        if (player.isSwimming()) statusFlags.add("swimming");
        if (player.isFlying()) statusFlags.add("flying");
        if (player.isGliding()) statusFlags.add("gliding");
        if (player.isSleeping()) statusFlags.add("sleeping");
        if (player.getFireTicks() > 0) statusFlags.add("on_fire");
        if (player.isDead()) statusFlags.add("dead");
        List<Map<String, Object>> activeEffects = player
            .getActivePotionEffects()
            .stream()
            .sorted(Comparator.comparing(effect ->
                effect.getType().getKey().toString()
            ))
            .map(ProbeExecutor::activeEffectDetails)
            .toList();
        return success(probe, "Actor status read-only probe completed.", SensorScope.PLAYER_OBSERVABLE, Map.of(
            "confidence", 0.98,
            "details", Map.ofEntries(
                Map.entry("health", round(player.getHealth())),
                Map.entry("max_health", round(player.getMaxHealth())),
                Map.entry("food_level", player.getFoodLevel()),
                Map.entry("saturation", round(player.getSaturation())),
                Map.entry("game_mode", player.getGameMode().name().toLowerCase(Locale.ROOT)),
                Map.entry("world", player.getWorld().getKey().toString()),
                Map.entry("position", Map.of(
                    "x", round(location.getX()),
                    "y", round(location.getY()),
                    "z", round(location.getZ())
                )),
                Map.entry("status_flags", List.copyOf(statusFlags)),
                Map.entry("active_effects", activeEffects)
            )
        ));
    }

    static Map<String, Object> activeEffectDetails(PotionEffect effect) {
        return Map.of(
            "effect", effect.getType().getKey().toString(),
            "amplifier", effect.getAmplifier(),
            "duration_ticks", effect.getDuration()
        );
    }

    private Map<String, Object> inventoryCheck(Map<String, Object> probe, Player player) {
        return success(probe, "Inventory read-only check completed.", SensorScope.PLAYER_OBSERVABLE, Map.of(
            "confidence", 0.95,
            "details", inventoryDetails(player.getInventory().getContents())
        ));
    }

    private Map<String, Object> nearbyEntities(Map<String, Object> probe, Player player) {
        List<Map<String, Object>> entities = player.getWorld()
            .getNearbyEntities(player.getLocation(), 16, 8, 16).stream()
            .filter(entity -> !entity.getUniqueId().equals(player.getUniqueId()))
            .sorted(Comparator.comparingDouble(entity -> entity.getLocation().distanceSquared(player.getLocation())))
            .limit(128)
            .map(entity -> nearbyEntityDetails(entity, player))
            .toList();
        return success(probe, "Nearby entity read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "confidence", 0.9,
            "details", Map.of(
                "entity_count", entities.size(),
                "entities", entities
            )
        ));
    }

    private Map<String, Object> nearbyEntityDetails(Entity entity, Player actor) {
        String classification;
        if (entity instanceof Monster) classification = "hostile";
        else if (entity instanceof Player) classification = "player";
        else if (entity instanceof Projectile) classification = "projectile";
        else if (entity instanceof LivingEntity) classification = "passive";
        else classification = "other";
        boolean targetingActor =
            entity instanceof Monster monster && actor.equals(monster.getTarget());
        return Map.of(
            "entity_type", entity.getType().getKey().toString(),
            "classification", classification,
            "distance_blocks", round(entity.getLocation().distance(actor.getLocation())),
            "targeting_actor", targetingActor
        );
    }

    static Map<String, Object> inventoryDetails(ItemStack[] contents) {
        List<InventoryStackDetail> projected = new ArrayList<>();
        for (int slot = 0; slot < contents.length; slot++) {
            ItemStack item = contents[slot];
            if (item == null || item.getType().isAir()) continue;
            projected.add(new InventoryStackDetail(
                slot,
                item.getType().getKey().toString(),
                item.getAmount(),
                item.getType().isEdible()
            ));
        }
        return inventoryDetails(projected);
    }

    static Map<String, Object> inventoryDetails(List<InventoryStackDetail> contents) {
        int foodStacks = 0;
        List<Map<String, Object>> slots = new ArrayList<>();
        for (InventoryStackDetail item : contents) {
            if (item.edible()) foodStacks++;
            slots.add(Map.of(
                "slot", item.slot(),
                "item", item.item(),
                "count", item.count()
            ));
        }
        return Map.of(
            "stack_count", contents.size(),
            "food_stack_count", foodStacks,
            "slots", List.copyOf(slots)
        );
    }

    private Map<String, Object> lineOfSight(Map<String, Object> probe, Player player) {
        Location target = targetLocation(probe, player);
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
        Location target = targetLocation(probe, player);
        if (target == null) return failed(probe, "Probe target position is missing.");
        double distance = player.getLocation().distance(target);
        boolean within = distance <= config.probeOptions().maxRouteRadius();
        boolean nearby = distance <= 5.0;
        return success(probe, type + " read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "feasible", within,
            "reachable", nearby,
            "distance_blocks", round(distance),
            "confidence", within ? 0.72 : 0.4
        ));
    }

    private Map<String, Object> cropState(Map<String, Object> probe, Player player) {
        Location target = targetLocation(probe, player);
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
        List<Double> hostileDistances = player.getWorld()
            .getNearbyEntities(player.getLocation(), 16, 8, 16).stream()
            .filter(entity -> entity instanceof Monster)
            .map(entity -> entity.getLocation().distance(player.getLocation()))
            .sorted()
            .toList();
        int environmentalHazardBlockCount = 0;
        double nearestEnvironmentalHazardDistance = Double.POSITIVE_INFINITY;
        Set<String> environmentalHazardTypes = new TreeSet<>();
        Location origin = player.getLocation();
        for (int dx = -6; dx <= 6; dx++) {
            for (int dy = -2; dy <= 3; dy++) {
                for (int dz = -6; dz <= 6; dz++) {
                    Block block = player.getWorld().getBlockAt(
                        origin.getBlockX() + dx,
                        origin.getBlockY() + dy,
                        origin.getBlockZ() + dz
                    );
                    String hazardType = hazardType(block.getType());
                    if (hazardType == null) continue;
                    environmentalHazardBlockCount++;
                    environmentalHazardTypes.add(hazardType);
                    nearestEnvironmentalHazardDistance = Math.min(
                        nearestEnvironmentalHazardDistance,
                        block.getLocation().add(0.5, 0.5, 0.5).distance(origin)
                    );
                }
            }
        }
        boolean actorOnFire = player.getFireTicks() > 0;
        boolean actorFreezing = player.getFreezeTicks() > 0;
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("hostile_entity_count", hostileDistances.size());
        if (!hostileDistances.isEmpty()) {
            details.put("nearest_hostile_distance_blocks", round(hostileDistances.get(0)));
        }
        details.put(
            "environmental_hazard_block_count",
            environmentalHazardBlockCount
        );
        details.put(
            "environmental_hazard_types",
            List.copyOf(environmentalHazardTypes)
        );
        if (Double.isFinite(nearestEnvironmentalHazardDistance)) {
            details.put(
                "nearest_environmental_hazard_distance_blocks",
                round(nearestEnvironmentalHazardDistance)
            );
        }
        details.put("actor_on_fire", actorOnFire);
        details.put("actor_freezing", actorFreezing);
        boolean hazardPresent =
            !hostileDistances.isEmpty() ||
            environmentalHazardBlockCount > 0 ||
            actorOnFire ||
            actorFreezing;
        return success(probe, "Hazard check read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "hazard_present", hazardPresent,
            "confidence", 0.82,
            "details", details
        ));
    }

    private Map<String, Object> localMapSummary(Map<String, Object> probe, Player player) {
        int solid = 0;
        int hazardous = 0;
        int liquid = 0;
        Location origin = player.getLocation();
        for (int dx = -4; dx <= 4; dx++) {
            for (int dz = -4; dz <= 4; dz++) {
                Material type = origin.getWorld().getBlockAt(origin.getBlockX() + dx, origin.getBlockY() - 1, origin.getBlockZ() + dz).getType();
                if (!type.isAir()) solid++;
                if (isLiquidFloor(type)) liquid++;
                if (hazardType(type) != null) hazardous++;
            }
        }
        return success(probe, "Local map summary read-only probe completed.", SensorScope.SENSOR_OBSERVABLE, Map.of(
            "confidence", 0.8,
            "details", Map.of(
                "sampled_floor_blocks", 81,
                "solid_floor_blocks", solid,
                "open_floor_blocks", 81 - solid,
                "hazardous_floor_blocks", hazardous,
                "liquid_floor_blocks", liquid
            )
        ));
    }

    static String hazardType(Material material) {
        return switch (material) {
            case LAVA -> "lava";
            case FIRE, SOUL_FIRE -> "fire";
            case MAGMA_BLOCK -> "magma_block";
            case CAMPFIRE, SOUL_CAMPFIRE -> "campfire";
            case CACTUS -> "cactus";
            case POWDER_SNOW -> "powder_snow";
            case SWEET_BERRY_BUSH -> "sweet_berry_bush";
            case WITHER_ROSE -> "wither_rose";
            case POINTED_DRIPSTONE -> "pointed_dripstone";
            default -> null;
        };
    }

    static boolean isLiquidFloor(Material material) {
        return material == Material.WATER || material == Material.LAVA;
    }

    private Location targetLocation(Map<String, Object> probe, Player player) {
        Object target = probe.get("target");
        if (!(target instanceof Map<?, ?> targetMap)) return null;
        Object position = targetMap.get("position");
        if (!(position instanceof Map<?, ?> pos)) return null;
        Number x = number(pos.get("x"));
        Number y = number(pos.get("y"));
        Number z = number(pos.get("z"));
        if (x == null || y == null) return null;
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

    private Map<String, Object> failed(Map<String, Object> probe, String summary, String failureCode) {
        return base(probe, "failed", summary, SensorScope.UNKNOWN, Map.of(
            "confidence", 0.2,
            "details", Map.of("failure_code", failureCode)
        ));
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
