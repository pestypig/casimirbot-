package com.casimirbot.helixsensor.manifest;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

public final class HeartbeatScheduler {
    private final JavaPlugin plugin;
    private final HelixSensorConfig config;
    private final HelixHttpClient httpClient;
    private final HelixSensorRuntimeStatus runtimeStatus;
    private final AtomicInteger pendingProbeCount;
    private final AtomicInteger skippedSnapshotCount;
    private BukkitTask task;
    private volatile String latestSnapshotId;
    private volatile String latestSnapshotTs;

    public HeartbeatScheduler(
        JavaPlugin plugin,
        HelixSensorConfig config,
        HelixHttpClient httpClient,
        HelixSensorRuntimeStatus runtimeStatus,
        AtomicInteger pendingProbeCount,
        AtomicInteger skippedSnapshotCount
    ) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        this.runtimeStatus = runtimeStatus;
        this.pendingProbeCount = pendingProbeCount;
        this.skippedSnapshotCount = skippedSnapshotCount;
    }

    public void start() {
        this.task = plugin.getServer().getScheduler().runTaskTimer(
            plugin,
            this::collectAndPostOnMainThread,
            20L,
            config.heartbeatIntervalTicks()
        );
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
    }

    public void recordLatestSnapshot(String snapshotId, String snapshotTs) {
        this.latestSnapshotId = snapshotId;
        this.latestSnapshotTs = snapshotTs;
    }

    public void forceHeartbeat() {
        collectAndPostOnMainThread();
    }

    private void collectAndPostOnMainThread() {
        String now = Instant.now().toString();
        List<Map<String, Object>> players = new ArrayList<>();
        for (Player player : Bukkit.getOnlinePlayers()) {
            players.add(Map.of(
                "actor_id", "minecraft:player:" + player.getName(),
                "actor_label", player.getName(),
                "dimension", player.getWorld().getKey().toString()
            ));
        }
        Map<String, Object> heartbeat = new java.util.LinkedHashMap<>();
        heartbeat.put("schema", "helix.environment_source_heartbeat.v1");
        heartbeat.put("heartbeat_id", "heartbeat:" + config.sourceId() + ":" + now);
        heartbeat.put("source_id", config.sourceId());
        heartbeat.put("room_id", config.roomId());
        heartbeat.put("domain", "minecraft");
        heartbeat.put("domain_adapter", config.domainAdapter());
        heartbeat.put("status", httpClient.pausedForAuth() ? "error" : httpClient.degraded() ? "degraded" : "active");
        heartbeat.put("server_tick", Bukkit.getCurrentTick());
        heartbeat.put("latest_snapshot_id", latestSnapshotId);
        heartbeat.put("latest_snapshot_ts", latestSnapshotTs);
        heartbeat.put("active_players", players);
        heartbeat.put("pending_probe_count", pendingProbeCount.get());
        heartbeat.put("backpressure", Map.of(
            "snapshot_upload_pending", false,
            "skipped_snapshot_count", skippedSnapshotCount.get(),
            "avg_payload_bytes", runtimeStatus.avgPayloadBytes
        ));
        heartbeat.put("runtime_status", Map.of(
            "upload_queue", runtimeStatus.uploadQueueState,
            "backoff_state", runtimeStatus.backoffState,
            "auth_failure_count", runtimeStatus.authFailureCount,
            "oversized_payload_count", runtimeStatus.oversizedPayloadCount,
            "contract_failure_count", runtimeStatus.contractFailureCount,
            "last_error", runtimeStatus.lastError == null ? "" : runtimeStatus.lastError
        ));
        heartbeat.put("evidence_refs", List.of("minecraft:heartbeat:" + Bukkit.getCurrentTick()));
        heartbeat.put("assistant_answer", false);
        heartbeat.put("raw_content_included", false);
        heartbeat.put("created_at", now);
        httpClient.postHeartbeatAsync(HelixJson.stringify(heartbeat));
    }
}
