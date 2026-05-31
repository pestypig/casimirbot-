package com.casimirbot.helixsensor.snapshot;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class SnapshotSchedulerTest {
    @Test
    void localMapCellCountUsesSalientCells() {
        int count = SnapshotScheduler.localMapCellCount(Map.of(
            "salient_cells", List.of(Map.of("cell_ref", "cell:1"), Map.of("cell_ref", "cell:2"))
        ));

        assertEquals(2, count);
    }

    @Test
    void localMapCellCountFallsBackToLegacyCells() {
        int count = SnapshotScheduler.localMapCellCount(Map.of(
            "cells", List.of(Map.of("cell_ref", "cell:1"))
        ));

        assertEquals(1, count);
    }
}
