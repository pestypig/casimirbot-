package com.casimirbot.helixsensor.command;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.util.ArrayList;
import java.util.List;

public final class CommandStatusFormatter {
    private CommandStatusFormatter() {}

    public static List<String> status(HelixSensorConfig config, HelixSensorRuntimeStatus runtime) {
        List<String> lines = new ArrayList<>();
        lines.add("HelixPaperSensor status");
        lines.add("enabled: " + runtime.enabled);
        lines.add("endpoint: " + runtime.endpoint);
        lines.add("source_id: " + runtime.sourceId);
        lines.add("manifest: " + state(runtime.lastManifestSuccessAt, runtime.manifestFailureCount));
        lines.add("heartbeat: " + state(runtime.lastHeartbeatSuccessAt, runtime.heartbeatFailureCount));
        lines.add("snapshot: last sent " + runtime.ago(runtime.lastSnapshotSuccessAt));
        lines.add("upload queue: " + runtime.uploadQueueState);
        lines.add("skipped snapshots: " + runtime.skippedSnapshotCount);
        lines.add("pending probes: " + runtime.pendingProbeCount);
        lines.add("execution_enabled: " + config.executionEnabled());
        lines.add("raw_nbt_included: false");
        if (runtime.lastError != null) lines.add("last_error: " + runtime.lastError);
        return lines;
    }

    public static List<String> probes(HelixSensorRuntimeStatus runtime) {
        List<String> lines = new ArrayList<>();
        lines.add("HelixPaperSensor probes");
        List<String> summaries = runtime.recentProbeSummaries();
        if (summaries.isEmpty()) lines.add("no recent probes");
        else lines.addAll(summaries);
        return lines;
    }

    public static List<String> debugPayload(HelixSensorRuntimeStatus runtime) {
        return List.of(
            "HelixPaperSensor debug payload",
            runtime.latestPayloadSummary(),
            "payload_bytes " + runtime.lastPayloadBytes,
            "avg_payload_bytes " + runtime.avgPayloadBytes,
            "raw_nbt false"
        );
    }

    private static String state(Object successAt, int failures) {
        if (successAt != null) return failures > 0 ? "sent / degraded" : "sent";
        return failures > 0 ? "failed" : "pending";
    }
}
