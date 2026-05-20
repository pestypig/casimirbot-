package com.casimirbot.helixsensor.events;

import com.casimirbot.helixsensor.snapshot.SnapshotBurstController;
import org.bukkit.Bukkit;
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

    @EventHandler public void onDamage(EntityDamageEvent event) { burst("entity_damage"); }
    @EventHandler public void onDeath(PlayerDeathEvent event) { burst("player_death"); }
    @EventHandler public void onInteract(PlayerInteractEvent event) { burst("player_interact"); }
    @EventHandler public void onInventoryOpen(InventoryOpenEvent event) { burst("inventory_open"); }
    @EventHandler public void onInventoryClose(InventoryCloseEvent event) { burst("inventory_close"); }
    @EventHandler public void onInventoryClick(InventoryClickEvent event) { burst("inventory_click"); }
    @EventHandler public void onBlockBreak(BlockBreakEvent event) { burst("block_break"); }
    @EventHandler public void onBlockPlace(BlockPlaceEvent event) { burst("block_place"); }
    @EventHandler public void onItemConsume(PlayerItemConsumeEvent event) { burst("item_consume"); }
    @EventHandler public void onWorldChange(PlayerChangedWorldEvent event) { burst("world_change"); }
    @EventHandler public void onJoin(PlayerJoinEvent event) { burst("player_join"); }
    @EventHandler public void onQuit(PlayerQuitEvent event) { burst("player_quit"); }

    private void burst(String reason) {
        burstController.requestBurst(reason, Bukkit.getCurrentTick());
    }
}
