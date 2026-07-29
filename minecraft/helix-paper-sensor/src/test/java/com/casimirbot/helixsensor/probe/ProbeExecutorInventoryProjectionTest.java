package com.casimirbot.helixsensor.probe;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class ProbeExecutorInventoryProjectionTest {
    @Test
    void projectsSafeSlotLevelItemNamesAndCounts() {
        Map<String, Object> details = ProbeExecutor.inventoryDetails(List.of(
            new ProbeExecutor.InventoryStackDetail(0, "minecraft:diamond", 3, false),
            new ProbeExecutor.InventoryStackDetail(5, "minecraft:bread", 5, true)
        ));

        assertEquals(2, details.get("stack_count"));
        assertEquals(1, details.get("food_stack_count"));
        assertEquals(
            List.of(
                Map.of("slot", 0, "item", "minecraft:diamond", "count", 3),
                Map.of("slot", 5, "item", "minecraft:bread", "count", 5)
            ),
            details.get("slots")
        );
    }
}
