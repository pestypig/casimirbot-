package com.casimirbot.helixsensor.events;

import com.casimirbot.helixsensor.snapshot.SnapshotBurstController;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryOpenEvent;
import org.bukkit.event.player.PlayerChangedWorldEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemConsumeEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

public final class SnapshotEventListener implements Listener {
    private final SnapshotBurstController burstController;

    public SnapshotEventListener(SnapshotBurstController burstController) {
        this.burstController = burstController;
    }

    @EventHandler public void onDamage(EntityDamageEvent event) { burst("entity_damage", entityDamageFact(event)); }
    @EventHandler public void onDeath(PlayerDeathEvent event) { burst("player_death", playerFact("player_death", event.getEntity())); }
    @EventHandler public void onInteract(PlayerInteractEvent event) { burst("player_interact"); }
    @EventHandler public void onInventoryOpen(InventoryOpenEvent event) { burst("inventory_open", inventoryFact("inventory_open", event.getPlayer() instanceof Player player ? player : null)); }
    @EventHandler public void onInventoryClose(InventoryCloseEvent event) { burst("inventory_close"); }
    @EventHandler public void onInventoryClick(InventoryClickEvent event) { burst("inventory_click"); }
    @EventHandler public void onBlockBreak(BlockBreakEvent event) { burst("block_break", blockDeltaFact("block_break", event.getPlayer(), event.getBlock(), "break")); }
    @EventHandler public void onBlockPlace(BlockPlaceEvent event) { burst("block_place", blockDeltaFact("block_place", event.getPlayer(), event.getBlockPlaced(), "place")); }
    @EventHandler public void onItemConsume(PlayerItemConsumeEvent event) { burst("item_consume", playerFact("item_consume", event.getPlayer())); }
    @EventHandler public void onWorldChange(PlayerChangedWorldEvent event) { burst("world_change", worldChangeFact(event)); }
    @EventHandler public void onJoin(PlayerJoinEvent event) { burst("player_join"); }
    @EventHandler public void onQuit(PlayerQuitEvent event) { burst("player_quit"); }

    private void burst(String reason) {
        burstController.requestBurst(reason, Bukkit.getCurrentTick());
    }

    private void burst(String reason, Map<String, Object> eventFact) {
        burstController.requestBurst(reason, Bukkit.getCurrentTick(), eventFact);
    }

    private Map<String, Object> blockDeltaFact(String eventType, Player player, Block block, String action) {
        Map<String, Object> fact = baseFact(eventType, player);
        fact.put("fact_type", "block_delta_overlay");
        fact.put("action", action);
        fact.put("block", Map.of(
            "block_type", materialKey(block.getType()),
            "position", position(block.getLocation()),
            "dimension", block.getWorld().getKey().toString()
        ));
        fact.put("evidence_refs", List.of("minecraft:event:" + eventType + ":" + block.getWorld().getKey() + ":" + block.getX() + ":" + block.getY() + ":" + block.getZ()));
        return fact;
    }

    private Map<String, Object> entityDamageFact(EntityDamageEvent event) {
        Entity entity = event.getEntity();
        Map<String, Object> fact = baseFact("entity_damage", entity instanceof Player player ? player : null);
        fact.put("fact_type", "entity_damage");
        fact.put("entity_ref", "entity:" + entity.getUniqueId());
        fact.put("entity_type", entity.getType().getKey().toString());
        fact.put("damage_cause", event.getCause().name().toLowerCase(java.util.Locale.ROOT));
        fact.put("final_damage", round(event.getFinalDamage()));
        fact.put("position", position(entity.getLocation()));
        return fact;
    }

    private Map<String, Object> inventoryFact(String eventType, Player player) {
        Map<String, Object> fact = baseFact(eventType, player);
        fact.put("fact_type", eventType);
        return fact;
    }

    private Map<String, Object> playerFact(String eventType, Player player) {
        Map<String, Object> fact = baseFact(eventType, player);
        fact.put("fact_type", eventType);
        return fact;
    }

    private Map<String, Object> worldChangeFact(PlayerChangedWorldEvent event) {
        Map<String, Object> fact = baseFact("dimension_transition", event.getPlayer());
        fact.put("event_type", "dimension_transition");
        fact.put("fact_type", "dimension_transition");
        fact.put("from_dimension", event.getFrom().getKey().toString());
        fact.put("to_dimension", event.getPlayer().getWorld().getKey().toString());
        fact.put("position", position(event.getPlayer().getLocation()));
        return fact;
    }

    private Map<String, Object> baseFact(String eventType, Player player) {
        Map<String, Object> fact = new LinkedHashMap<>();
        fact.put("event_type", eventType);
        fact.put("ts", Instant.now().toString());
        fact.put("source_tick", Bukkit.getCurrentTick());
        fact.put("actor_id", player == null ? "minecraft:unknown" : "minecraft:player:" + player.getUniqueId());
        fact.put("actor_label", player == null ? "unknown" : player.getName());
        fact.put("sensor_scope", "sensor_observable");
        fact.put("evidence_trust", "server_observation");
        fact.put("instruction_authority", "none");
        fact.put("ask_context_policy", "evidence_only");
        fact.put("raw_nbt_included", false);
        fact.put("assistant_answer", false);
        return fact;
    }

    private Map<String, Object> position(Location location) {
        return Map.of(
            "x", round(location.getX()),
            "y", round(location.getY()),
            "z", round(location.getZ())
        );
    }

    private double round(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    private String materialKey(Material material) {
        return material == null ? "minecraft:air" : material.getKey().toString();
    }
}
