package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.block.BlockState;
import org.bukkit.block.Container;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryView;
import org.bukkit.inventory.ItemStack;

public final class ContainerStateAdapter {
    private final HelixSensorConfig config;

    public ContainerStateAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public List<Map<String, Object>> build(Player player) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (config.snapshotOptions().includeOpenContainer()) {
            Map<String, Object> open = openContainer(player);
            if (!open.isEmpty()) result.add(open);
        }
        if (config.snapshotOptions().includeNearbyContainerRefs()) {
            addNearbyContainerRefs(player, result);
        }
        return result;
    }

    private Map<String, Object> openContainer(Player player) {
        InventoryView view = player.getOpenInventory();
        Inventory top = view.getTopInventory();
        if (top == null || top.getHolder() == null || top.getHolder() instanceof Player) return Map.of();
        List<Map<String, Object>> contents = new ArrayList<>();
        for (ItemStack item : top.getStorageContents()) {
            Map<String, Object> summary = AdapterUtil.itemSummary(item, null);
            if (!summary.isEmpty()) {
                Map<String, Object> memoryItem = new java.util.LinkedHashMap<>(summary);
                memoryItem.put("sensor_scope", "player_memory");
                contents.add(memoryItem);
            }
        }
        Map<String, Object> base = new java.util.LinkedHashMap<>();
        String containerType = top.getType().name().toLowerCase(java.util.Locale.ROOT);
        base.put("container_ref", "container:open:" + player.getUniqueId() + ":" + containerType);
        base.put("container_type", "minecraft:" + containerType);
        base.put("contents_known", true);
        base.put("contents_summary", contents);
        base.put("contents_hash", SectionHasher.hash(contents));
        base.put("last_verified_at", Instant.now().toString());
        base.put("sensor_scope", "player_memory");
        return base;
    }

    private void addNearbyContainerRefs(Player player, List<Map<String, Object>> result) {
        int radius = Math.min(8, config.snapshotOptions().localMapRadius());
        Location origin = player.getLocation();
        int added = 0;
        for (int dx = -radius; dx <= radius && added < 12; dx++) {
            for (int dy = -2; dy <= 2 && added < 12; dy++) {
                for (int dz = -radius; dz <= radius && added < 12; dz++) {
                    Block block = origin.getWorld().getBlockAt(origin.getBlockX() + dx, origin.getBlockY() + dy, origin.getBlockZ() + dz);
                    BlockState state = block.getState();
                    if (!(state instanceof Container)) continue;
                    result.add(Map.of(
                        "container_ref", containerRef(block),
                        "container_type", AdapterUtil.materialKey(block.getType()),
                        "position", AdapterUtil.position(block.getLocation()),
                        "contents_known", false,
                        "sensor_scope", "sensor_observable"
                    ));
                    added++;
                }
            }
        }
    }

    static String containerRef(Block block) {
        return "container:" + block.getWorld().getKey() + ":" + block.getX() + ":" + block.getY() + ":" + block.getZ();
    }
}
