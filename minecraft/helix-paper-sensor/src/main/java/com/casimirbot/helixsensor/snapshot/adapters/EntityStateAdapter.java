package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.entity.Animals;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Golem;
import org.bukkit.entity.Item;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Mob;
import org.bukkit.entity.Monster;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.entity.Tameable;
import org.bukkit.entity.Vehicle;
import org.bukkit.entity.Villager;
import org.bukkit.inventory.EntityEquipment;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.util.BoundingBox;
import org.bukkit.util.Vector;

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
        Location location = entity.getLocation();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("object_ref", "entity:" + entity.getUniqueId());
        result.put("object_type", AdapterUtil.entityType(entity));
        result.put("position", AdapterUtil.position(location));
        result.put("velocity", vector(entity.getVelocity()));
        result.put("facing", AdapterUtil.facing(location.getYaw()));
        result.put("yaw", AdapterUtil.round(location.getYaw()));
        result.put("pitch", AdapterUtil.round(location.getPitch()));
        result.put("distance", AdapterUtil.round(location.distance(origin)));
        result.put("bounding_box", boundingBox(entity.getBoundingBox()));
        result.put("classification", classification(entity));
        result.put("tags", AdapterUtil.entityTags(entity));
        result.put("state", entityState(entity));
        if (entity instanceof LivingEntity living) result.put("living", livingState(living));
        if (entity instanceof Mob mob) result.put("mob_ai", mobAiState(mob));
        result.put("threat", threat(entity, origin));
        result.put("sensor_scope", "sensor_observable");
        result.put("evidence_trust", "server_observation");
        result.put("instruction_authority", "none");
        result.put("ask_context_policy", "evidence_only");
        result.put("raw_nbt_included", false);
        return result;
    }

    private Map<String, Object> vector(Vector vector) {
        return Map.of(
            "x", AdapterUtil.round(vector.getX()),
            "y", AdapterUtil.round(vector.getY()),
            "z", AdapterUtil.round(vector.getZ())
        );
    }

    private Map<String, Object> boundingBox(BoundingBox box) {
        return Map.of(
            "min", Map.of(
                "x", AdapterUtil.round(box.getMinX()),
                "y", AdapterUtil.round(box.getMinY()),
                "z", AdapterUtil.round(box.getMinZ())
            ),
            "max", Map.of(
                "x", AdapterUtil.round(box.getMaxX()),
                "y", AdapterUtil.round(box.getMaxY()),
                "z", AdapterUtil.round(box.getMaxZ())
            )
        );
    }

    private List<String> classification(Entity entity) {
        List<String> values = new ArrayList<>();
        if (entity instanceof Monster) values.add("hostile");
        if (entity instanceof Animals || entity instanceof Villager) values.add("passive");
        if (entity instanceof Golem) values.add("neutral");
        if (entity instanceof Projectile) values.add("projectile");
        if (entity instanceof Item) values.add("item");
        if (entity instanceof Vehicle) values.add("vehicle");
        if (entity instanceof Tameable tameable && tameable.isTamed()) values.add("player_owned");
        if (values.isEmpty()) values.add("unknown");
        return values;
    }

    private Map<String, Object> entityState(Entity entity) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("on_ground", entity.isOnGround());
        state.put("in_water", entity.isInWater());
        state.put("in_lava", entity.isInLava());
        state.put("fire_ticks", entity.getFireTicks());
        state.put("visual_fire", entity.isVisualFire());
        state.put("freeze_ticks", entity.getFreezeTicks());
        state.put("fall_distance", AdapterUtil.round(entity.getFallDistance()));
        state.put("portal_cooldown", entity.getPortalCooldown());
        state.put("no_gravity", !entity.hasGravity());
        state.put("silent", entity.isSilent());
        state.put("glowing", entity.isGlowing());
        state.put("invulnerable", entity.isInvulnerable());
        state.put("passenger_count", entity.getPassengers().size());
        Entity vehicle = entity.getVehicle();
        if (vehicle != null) state.put("vehicle_ref", "entity:" + vehicle.getUniqueId());
        if (entity instanceof LivingEntity living) {
            state.put("remaining_air", living.getRemainingAir());
            state.put("underwater", living.getRemainingAir() < living.getMaximumAir());
        }
        return state;
    }

    private Map<String, Object> livingState(LivingEntity living) {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("health", AdapterUtil.round(living.getHealth()));
        AttributeInstance maxHealth = living.getAttribute(Attribute.MAX_HEALTH);
        if (maxHealth != null) state.put("max_health", AdapterUtil.round(maxHealth.getValue()));
        state.put("absorption", AdapterUtil.round(living.getAbsorptionAmount()));
        state.put("potion_effects", potionEffects(living));
        state.put("equipment_summary", equipmentSummary(living.getEquipment()));
        return state;
    }

    private List<Map<String, Object>> potionEffects(LivingEntity living) {
        List<Map<String, Object>> effects = new ArrayList<>();
        for (PotionEffect effect : living.getActivePotionEffects()) {
            effects.add(Map.of(
                "type", effect.getType().getKey().toString(),
                "amplifier", effect.getAmplifier(),
                "duration_ticks", effect.getDuration()
            ));
        }
        return effects;
    }

    private List<Map<String, Object>> equipmentSummary(EntityEquipment equipment) {
        if (equipment == null) return List.of();
        List<Map<String, Object>> items = new ArrayList<>();
        addEquipment(items, "main_hand", equipment.getItemInMainHand());
        addEquipment(items, "off_hand", equipment.getItemInOffHand());
        addEquipment(items, "helmet", equipment.getHelmet());
        addEquipment(items, "chestplate", equipment.getChestplate());
        addEquipment(items, "leggings", equipment.getLeggings());
        addEquipment(items, "boots", equipment.getBoots());
        return items;
    }

    private void addEquipment(List<Map<String, Object>> items, String slot, ItemStack item) {
        if (item == null || item.getType().isAir()) return;
        items.add(Map.of(
            "slot", slot,
            "item_type", AdapterUtil.materialKey(item.getType())
        ));
    }

    private Map<String, Object> mobAiState(Mob mob) {
        Map<String, Object> state = new LinkedHashMap<>();
        LivingEntity target = mob.getTarget();
        if (target != null) {
            state.put("target_ref", "entity:" + target.getUniqueId());
            state.put("target_type", AdapterUtil.entityType(target));
        }
        state.put("aware", mob.isAware());
        state.put("can_pickup_items", mob.getCanPickupItems());
        return state;
    }

    private Map<String, Object> threat(Entity entity, Location origin) {
        Map<String, Object> threat = new LinkedHashMap<>();
        List<String> reasons = new ArrayList<>();
        double distance = entity.getLocation().distance(origin);
        boolean hostile = entity instanceof Monster;
        boolean projectile = entity instanceof Projectile;
        boolean targetingPlayer = entity instanceof Mob mob && mob.getTarget() instanceof Player;
        if (hostile) reasons.add("hostile_entity");
        if (projectile) reasons.add("projectile");
        if (targetingPlayer) reasons.add("targeting_player");
        if ((hostile || projectile) && distance <= 6.0d) reasons.add("close_range");
        String level = "none";
        if (!reasons.isEmpty()) level = "watch";
        if ((hostile || projectile) && distance <= 8.0d) level = "warning";
        if ((targetingPlayer && distance <= 6.0d) || (projectile && distance <= 4.0d)) level = "critical";
        threat.put("threat_level", level);
        threat.put("threat_reasons", reasons);
        Double timeToContact = timeToContactTicks(entity, origin);
        if (timeToContact != null) threat.put("time_to_contact_ticks", AdapterUtil.round(timeToContact));
        return threat;
    }

    private Double timeToContactTicks(Entity entity, Location origin) {
        Vector velocity = entity.getVelocity();
        double speed = velocity.length();
        if (speed <= 0.01d) return null;
        Vector toPlayer = origin.toVector().subtract(entity.getLocation().toVector());
        double distance = toPlayer.length();
        if (distance <= 0.0d) return 0.0d;
        double closing = velocity.dot(toPlayer.normalize());
        if (closing <= 0.01d) return null;
        return distance / closing;
    }
}
