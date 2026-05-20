package com.casimirbot.helixsensor.snapshot.adapters;

import java.util.Locale;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Monster;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.Damageable;
import org.bukkit.inventory.meta.ItemMeta;

final class AdapterUtil {
    private AdapterUtil() {}

    static String materialKey(Material material) {
        return material == null ? "minecraft:air" : material.getKey().toString();
    }

    static Map<String, Object> position(Location location) {
        return Map.of(
            "x", round(location.getX()),
            "y", round(location.getY()),
            "z", round(location.getZ())
        );
    }

    static double round(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    static String facing(float yaw) {
        float normalized = (yaw % 360 + 360) % 360;
        if (normalized >= 45 && normalized < 135) return "west";
        if (normalized >= 135 && normalized < 225) return "north";
        if (normalized >= 225 && normalized < 315) return "east";
        return "south";
    }

    static Map<String, Object> itemSummary(ItemStack item, Integer slot) {
        if (item == null || item.getType().isAir() || item.getAmount() <= 0) return Map.of();
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("item_type", materialKey(item.getType()));
        result.put("count", item.getAmount());
        if (slot != null) result.put("slot", slot);
        ItemMeta meta = item.getItemMeta();
        if (meta instanceof Damageable damageable && item.getType().getMaxDurability() > 0) {
            int max = item.getType().getMaxDurability();
            result.put("durability", Map.of("remaining", Math.max(0, max - damageable.getDamage()), "max", max));
        }
        result.put("sensor_scope", "player_observable");
        return result;
    }

    static String entityType(Entity entity) {
        return entity.getType().getKey().toString();
    }

    static java.util.List<String> entityTags(Entity entity) {
        java.util.List<String> tags = new java.util.ArrayList<>();
        if (entity instanceof Monster) tags.add("hostile");
        tags.add(entity.getType().name().toLowerCase(Locale.ROOT));
        return tags;
    }
}
