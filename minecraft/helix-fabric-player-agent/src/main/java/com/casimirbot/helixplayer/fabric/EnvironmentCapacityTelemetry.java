package com.casimirbot.helixplayer.fabric;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Observation-only timing counters for one admitted workflow. This class never
 * schedules work or owns controls; it only measures the native executor path.
 */
final class EnvironmentCapacityTelemetry {
    private static final long NOMINAL_TICK_NANOS = 50_000_000L;

    private final long dispatchReceivedNanos;
    private final long acceptedNanos;
    private final long queueDepthAtLease;
    private final long oldestPendingAgeMs;
    private final long plannedRunwayTicksAtAccept;
    private long firstExecutionTickNanos = -1L;
    private long lastSchedulerTickNanos = -1L;
    private long residentComputationNanos;
    private long schedulerTicks;
    private long activeControlTicks;
    private long stalledTicks;
    private long missedTicks;
    private Long manualOrSafetyToReleaseNanos;

    EnvironmentCapacityTelemetry(
        long dispatchReceivedNanos,
        long acceptedNanos,
        long queueDepthAtLease,
        long oldestPendingAgeMs,
        long plannedRunwayTicksAtAccept
    ) {
        if (dispatchReceivedNanos < 0L || acceptedNanos < dispatchReceivedNanos) {
            throw new IllegalArgumentException("Capacity telemetry clocks cannot regress.");
        }
        if (
            queueDepthAtLease < 0L ||
            oldestPendingAgeMs < 0L ||
            plannedRunwayTicksAtAccept < 1L
        ) {
            throw new IllegalArgumentException("Capacity queue and runway measurements are invalid.");
        }
        this.dispatchReceivedNanos = dispatchReceivedNanos;
        this.acceptedNanos = acceptedNanos;
        this.queueDepthAtLease = queueDepthAtLease;
        this.oldestPendingAgeMs = oldestPendingAgeMs;
        this.plannedRunwayTicksAtAccept = plannedRunwayTicksAtAccept;
    }

    synchronized void recordSchedulerTick(
        boolean activeControl,
        long tickStartedNanos
    ) {
        if (tickStartedNanos < acceptedNanos) {
            throw new IllegalArgumentException("Capacity telemetry tick marks cannot regress.");
        }
        if (firstExecutionTickNanos < 0L) firstExecutionTickNanos = tickStartedNanos;
        if (lastSchedulerTickNanos >= 0L) {
            long intervalNanos = tickStartedNanos - lastSchedulerTickNanos;
            if (intervalNanos < 0L) {
                throw new IllegalArgumentException("Capacity telemetry tick marks cannot regress.");
            }
            long elapsedIntervals = intervalNanos / NOMINAL_TICK_NANOS;
            if (elapsedIntervals > 1L) missedTicks += elapsedIntervals - 1L;
        }
        lastSchedulerTickNanos = tickStartedNanos;
        schedulerTicks++;
        if (activeControl) activeControlTicks++;
        else stalledTicks++;
    }

    synchronized void recordResidentComputation(long computationNanos) {
        if (computationNanos < 0L) {
            throw new IllegalArgumentException("Resident computation cannot be negative.");
        }
        residentComputationNanos += computationNanos;
    }

    synchronized void recordManualOrSafetyToRelease(long latencyNanos) {
        if (latencyNanos < 0L) {
            throw new IllegalArgumentException("Release latency cannot be negative.");
        }
        manualOrSafetyToReleaseNanos = latencyNanos;
    }

    synchronized Map<String, Object> snapshot() {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put(
            "dispatch_to_client_accept_ms",
            nanosToCeilingMilliseconds(acceptedNanos - dispatchReceivedNanos)
        );
        values.put(
            "dispatch_to_first_tick_ms",
            firstExecutionTickNanos < 0L
                ? null
                : nanosToCeilingMilliseconds(firstExecutionTickNanos - dispatchReceivedNanos)
        );
        values.put(
            "resident_computation_ms",
            nanosToCeilingMilliseconds(residentComputationNanos)
        );
        values.put("queue_depth_at_lease", queueDepthAtLease);
        values.put("oldest_pending_age_ms", oldestPendingAgeMs);
        values.put("planned_runway_ticks_at_accept", plannedRunwayTicksAtAccept);
        values.put(
            "runway_ticks_remaining",
            Math.max(0L, plannedRunwayTicksAtAccept - schedulerTicks)
        );
        values.put("scheduler_ticks", schedulerTicks);
        values.put("active_control_ticks", activeControlTicks);
        values.put("stalled_ticks", stalledTicks);
        values.put("missed_ticks", missedTicks);
        values.put(
            "manual_or_safety_to_release_ms",
            manualOrSafetyToReleaseNanos == null
                ? null
                : nanosToCeilingMilliseconds(manualOrSafetyToReleaseNanos)
        );
        values.put("measurement_authority", false);
        values.put("answer_authority", false);
        values.put("terminal_eligible", false);
        return Collections.unmodifiableMap(values);
    }

    private static long nanosToCeilingMilliseconds(long nanos) {
        if (nanos <= 0L) return 0L;
        return (nanos + 999_999L) / 1_000_000L;
    }
}
