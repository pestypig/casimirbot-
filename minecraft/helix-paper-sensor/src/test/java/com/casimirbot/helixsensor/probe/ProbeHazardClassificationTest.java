package com.casimirbot.helixsensor.probe;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.bukkit.Material;
import org.junit.jupiter.api.Test;

final class ProbeHazardClassificationTest {
    @Test
    void classifiesBoundedEnvironmentalHazardMaterials() {
        assertEquals("lava", ProbeExecutor.hazardType(Material.LAVA));
        assertEquals("fire", ProbeExecutor.hazardType(Material.FIRE));
        assertEquals("magma_block", ProbeExecutor.hazardType(Material.MAGMA_BLOCK));
        assertEquals("campfire", ProbeExecutor.hazardType(Material.SOUL_CAMPFIRE));
        assertEquals("cactus", ProbeExecutor.hazardType(Material.CACTUS));
        assertEquals("powder_snow", ProbeExecutor.hazardType(Material.POWDER_SNOW));
        assertEquals(
            "pointed_dripstone",
            ProbeExecutor.hazardType(Material.POINTED_DRIPSTONE)
        );
        assertNull(ProbeExecutor.hazardType(Material.STONE));
    }

    @Test
    void classifiesLiquidFloorMaterialsWithoutPaperRuntimeHelpers() {
        assertTrue(ProbeExecutor.isLiquidFloor(Material.WATER));
        assertTrue(ProbeExecutor.isLiquidFloor(Material.LAVA));
        assertFalse(ProbeExecutor.isLiquidFloor(Material.STONE));
    }
}
