package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

final class FabricRegionCheckpointStoreTest {
    @Test
    void computesBoundedSymmetricCheckpointVolumes() {
        assertEquals(27, FabricRegionCheckpointStore.volume(1, 1));
        assertEquals(1_331, FabricRegionCheckpointStore.volume(5, 5));
        assertTrue(
            FabricRegionCheckpointStore.volume(
                FabricRegionCheckpointStore.MAX_HORIZONTAL_RADIUS,
                FabricRegionCheckpointStore.MAX_VERTICAL_RADIUS
            ) <= FabricRegionCheckpointStore.MAX_BLOCKS
        );
    }
}
