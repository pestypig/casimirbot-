package com.casimirbot.helixsensor.snapshot;

public final class SnapshotBurstController {
    private final long burstDurationTicks;
    private volatile long burstUntilTick = 0L;
    private volatile String latestReason = "baseline";

    public SnapshotBurstController(com.casimirbot.helixsensor.HelixSensorConfig config) {
        this.burstDurationTicks = config.burstDurationTicks();
    }

    public void requestBurst(String reason, long currentTick) {
        this.latestReason = reason == null || reason.isBlank() ? "salient_event" : reason;
        this.burstUntilTick = Math.max(burstUntilTick, currentTick + burstDurationTicks);
    }

    public boolean active(long currentTick) {
        return currentTick <= burstUntilTick;
    }

    public String latestReason() {
        return latestReason;
    }
}
