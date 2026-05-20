package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.PlayerInventory;

public final class InventoryStateAdapter {
    private final HelixSensorConfig config;

    public InventoryStateAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public Map<String, Object> build(Player player) {
        PlayerInventory inventory = player.getInventory();
        Map<String, Integer> counts = new LinkedHashMap<>();
        int seen = 0;
        for (ItemStack item : inventory.getContents()) {
            if (item == null || item.getType().isAir()) continue;
            counts.merge(AdapterUtil.materialKey(item.getType()), item.getAmount(), Integer::sum);
            seen++;
            if (seen >= config.snapshotOptions().maxInventoryStacks()) break;
        }
        List<Map<String, Object>> carried = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            carried.add(Map.of(
                "item_type", entry.getKey(),
                "count", entry.getValue(),
                "sensor_scope", "player_observable"
            ));
        }
        List<Map<String, Object>> equipped = new ArrayList<>();
        for (ItemStack item : inventory.getArmorContents()) {
            Map<String, Object> summary = AdapterUtil.itemSummary(item, null);
            if (!summary.isEmpty()) equipped.add(summary);
        }
        Map<String, Object> selected = AdapterUtil.itemSummary(
            inventory.getItem(inventory.getHeldItemSlot()),
            inventory.getHeldItemSlot()
        );
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sensor_scope", "player_observable");
        result.put("selected_item", selected.isEmpty() ? null : selected);
        result.put("carried_items", carried);
        result.put("equipped_items", equipped);
        result.put("inventory_hash", SectionHasher.hash(counts));
        result.put("changed_since_last_snapshot", true);
        Material offhand = inventory.getItemInOffHand().getType();
        if (!offhand.isAir()) result.put("offhand_item", AdapterUtil.itemSummary(inventory.getItemInOffHand(), "offhand".hashCode()));
        return result;
    }
}
