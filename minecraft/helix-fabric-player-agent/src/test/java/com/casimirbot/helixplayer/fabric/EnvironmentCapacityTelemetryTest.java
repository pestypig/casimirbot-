package com.casimirbot.helixplayer.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import org.junit.jupiter.api.Test;

final class EnvironmentCapacityTelemetryTest {
    @Test
    void reportsDispatchResidentControlStallAndMissedTickMeasurements() {
        EnvironmentCapacityTelemetry telemetry = new EnvironmentCapacityTelemetry(
            1_000_000_000L,
            1_002_000_000L,
            3L,
            125L,
            20L
        );

        Map<String, Object> beforeFirstTick = telemetry.snapshot();
        assertEquals(2L, beforeFirstTick.get("dispatch_to_client_accept_ms"));
        assertNull(beforeFirstTick.get("dispatch_to_first_tick_ms"));
        assertEquals(3L, beforeFirstTick.get("queue_depth_at_lease"));
        assertEquals(125L, beforeFirstTick.get("oldest_pending_age_ms"));
        assertEquals(20L, beforeFirstTick.get("planned_runway_ticks_at_accept"));
        assertEquals(20L, beforeFirstTick.get("runway_ticks_remaining"));

        telemetry.recordSchedulerTick(true, 1_010_000_000L);
        telemetry.recordResidentComputation(1_100_000L);
        telemetry.recordSchedulerTick(false, 1_160_000_000L);
        telemetry.recordResidentComputation(900_000L);
        telemetry.recordManualOrSafetyToRelease(1_100_000L);

        Map<String, Object> measured = telemetry.snapshot();
        assertEquals(10L, measured.get("dispatch_to_first_tick_ms"));
        assertEquals(2L, measured.get("resident_computation_ms"));
        assertEquals(2L, measured.get("scheduler_ticks"));
        assertEquals(1L, measured.get("active_control_ticks"));
        assertEquals(1L, measured.get("stalled_ticks"));
        assertEquals(2L, measured.get("missed_ticks"));
        assertEquals(2L, measured.get("manual_or_safety_to_release_ms"));
        assertEquals(18L, measured.get("runway_ticks_remaining"));
        assertFalse((Boolean) measured.get("measurement_authority"));
        assertFalse((Boolean) measured.get("answer_authority"));
        assertFalse((Boolean) measured.get("terminal_eligible"));
    }

    @Test
    void rejectsRegressingMonotonicMarks() {
        assertThrows(
            IllegalArgumentException.class,
            () -> new EnvironmentCapacityTelemetry(2L, 1L, 0L, 0L, 1L)
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> new EnvironmentCapacityTelemetry(1L, 2L, -1L, 0L, 1L)
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> new EnvironmentCapacityTelemetry(1L, 2L, 0L, 0L, 0L)
        );
        EnvironmentCapacityTelemetry telemetry = new EnvironmentCapacityTelemetry(
            1L,
            2L,
            0L,
            0L,
            1L
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> telemetry.recordSchedulerTick(true, 1L)
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> telemetry.recordManualOrSafetyToRelease(-1L)
        );
    }
}
