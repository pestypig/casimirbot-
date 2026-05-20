package com.casimirbot.helixsensor.snapshot;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import com.casimirbot.helixsensor.manifest.HeartbeatScheduler;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.bukkit.Bukkit;
import org.bukkit.NamespacedKey;
import org.bukkit.World;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

public final class SnapshotScheduler {
    private final JavaPlugin plugin;
    private final HelixSensorConfig config;
    private final HelixHttpClient httpClient;
    private final HelixSensorRuntimeStatus runtimeStatus;
    private final SnapshotBurstController burstController;
    private final HeartbeatScheduler heartbeatScheduler;
    private final AtomicInteger skippedSnapshotCount;
    private final AtomicBoolean uploadInFlight = new AtomicBoolean(false);
    private final EnvironmentSnapshotBuilder snapshotBuilder;
    private final SnapshotContractGuard contractGuard = new SnapshotContractGuard();
    private final Map<String, Long> latestSourceTickByActor = new LinkedHashMap<>();
    private final AtomicInteger locationSampleCounter = new AtomicInteger(0);
    private BukkitTask baselineTask;
    private BukkitTask burstTask;

    public SnapshotScheduler(
        JavaPlugin plugin,
        HelixSensorConfig config,
        HelixHttpClient httpClient,
        HelixSensorRuntimeStatus runtimeStatus,
        SnapshotBurstController burstController,
        HeartbeatScheduler heartbeatScheduler,
        AtomicInteger skippedSnapshotCount
    ) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        this.runtimeStatus = runtimeStatus;
        this.burstController = burstController;
        this.heartbeatScheduler = heartbeatScheduler;
        this.skippedSnapshotCount = skippedSnapshotCount;
        this.snapshotBuilder = new EnvironmentSnapshotBuilder(config);
    }

    public void start() {
        this.baselineTask = plugin.getServer().getScheduler().runTaskTimer(
            plugin,
            () -> collectAndQueueSnapshotOnMainThread(false),
            20L,
            config.snapshotIntervalTicks()
        );
        this.burstTask = plugin.getServer().getScheduler().runTaskTimer(
            plugin,
            this::collectBurstIfActiveOnMainThread,
            config.burstIntervalTicks(),
            config.burstIntervalTicks()
        );
    }

    public void stop() {
        if (baselineTask != null) baselineTask.cancel();
        if (burstTask != null) burstTask.cancel();
    }

    private void collectBurstIfActiveOnMainThread() {
        if (burstController.active(Bukkit.getCurrentTick())) collectAndQueueSnapshotOnMainThread(true);
    }

    public void forceSnapshot() {
        collectAndQueueSnapshotOnMainThread(true);
    }

    private void collectAndQueueSnapshotOnMainThread(boolean forceFullRefresh) {
        if (!uploadInFlight.compareAndSet(false, true)) {
            skippedSnapshotCount.incrementAndGet();
            runtimeStatus.recordSnapshotSkipped();
            return;
        }
        runtimeStatus.setUploadInFlight(true);
        long started = System.nanoTime();
        List<Map<String, Object>> snapshots = snapshotBuilder.buildForOnlinePlayers(forceFullRefresh);
        if (snapshots.isEmpty()) {
            uploadInFlight.set(false);
            runtimeStatus.setUploadInFlight(false);
            return;
        }
        List<Map<String, Object>> events = new ArrayList<>();
        for (Map<String, Object> snapshot : snapshots) {
            String actorKey = String.valueOf(snapshot.get("actor_id"));
            long previousTick = latestSourceTickByActor.getOrDefault(actorKey, -1L);
            List<String> issues = contractGuard.validate(snapshot, previousTick);
            if (!issues.isEmpty()) {
                runtimeStatus.recordSnapshotContractFailure("snapshot_contract:" + String.join(",", issues));
                plugin.getLogger().warning("Skipping Helix snapshot with contract issues: " + issues);
                continue;
            }
            Object tick = snapshot.get("source_tick");
            if (tick instanceof Number number) latestSourceTickByActor.put(actorKey, number.longValue());
            events.add(worldEventForSnapshot(snapshot));
            Map<String, Object> locationSample = worldEventForLocationSample(snapshot);
            if (!locationSample.isEmpty()) events.add(locationSample);
            heartbeatScheduler.recordLatestSnapshot(String.valueOf(snapshot.get("snapshot_id")), String.valueOf(snapshot.get("ts")));
        }
        if (events.isEmpty()) {
            uploadInFlight.set(false);
            runtimeStatus.setUploadInFlight(false);
            return;
        }
        String json = HelixJson.stringify(Map.of("events", events));
        runtimeStatus.recordPayload(
            json.getBytes(StandardCharsets.UTF_8).length,
            Math.max(0L, (System.nanoTime() - started) / 1_000_000L),
            payloadSummary(snapshots)
        );
        httpClient.postWorldEventBatchAsync(json).whenComplete((ignored, error) -> {
            uploadInFlight.set(false);
            runtimeStatus.setUploadInFlight(false);
        });
    }

    private String payloadSummary(List<Map<String, Object>> snapshots) {
        Map<String, Object> first = snapshots.get(0);
        Object changed = first.get("changed_sections");
        Object localMap = first.get("local_map");
        int localCells = localMap instanceof Map<?, ?> map && map.get("cells") instanceof List<?> cells ? cells.size() : 0;
        Object objectState = first.get("object_state");
        int entities = objectState instanceof Map<?, ?> objectMap && objectMap.get("nearby_entities") instanceof List<?> list ? list.size() : 0;
        return "actor_state " + mark(first, "actor_state") +
            " inventory_state " + mark(first, "inventory_state") +
            " focus " + mark(first, "focus") +
            " object_state " + entities + " entities" +
            " local_map " + localCells + " cells" +
            " raw_nbt false changed_sections " + changed;
    }

    private String mark(Map<String, Object> snapshot, String key) {
        Object value = snapshot.get(key);
        if (value instanceof Map<?, ?> map && Boolean.TRUE.equals(map.get("unchanged"))) return "unchanged";
        return value == null ? "-" : "✓";
    }

    private Map<String, Object> worldEventForSnapshot(Map<String, Object> snapshot) {
        return Map.of(
            "schema", "helix.world_event.v1",
            "world_id", config.worldId(),
            "room_id", config.roomId(),
            "source_id", config.sourceId(),
            "actor_id", snapshot.get("actor_id"),
            "actor_label", snapshot.get("actor_label"),
            "ts", snapshot.get("ts"),
            "event_type", "environment_state_snapshot",
            "evidence_refs", snapshot.get("evidence_refs"),
            "meta", Map.of(
                "snapshot_schema", "helix.environment_state_snapshot.v1",
                "domain", "minecraft",
                "domain_adapter", config.domainAdapter(),
                "snapshot", snapshot
            )
        );
    }

    private Map<String, Object> worldEventForLocationSample(Map<String, Object> snapshot) {
        if (!config.emitSeedMapMetadata() || !config.seedMapOptions().repeatOnLocationSamples()) return Map.of();
        int sampleNumber = locationSampleCounter.incrementAndGet();
        if (sampleNumber % config.seedMapOptions().repeatEveryLocationSamples() != 0) return Map.of();
        Object locationValue = snapshot.get("location");
        if (!(locationValue instanceof Map<?, ?> rawLocation)) return Map.of();
        Map<String, Object> location = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : rawLocation.entrySet()) location.put(String.valueOf(entry.getKey()), entry.getValue());
        String dimension = String.valueOf(location.getOrDefault("dimension", ""));
        World world = worldForDimension(dimension);
        return LocationSampleWorldEventBuilder.build(
            snapshot,
            config,
            MinecraftSeedMapMetadata.buildSeedMapMeta(world, config),
            Bukkit.getCurrentTick()
        );
    }

    private World worldForDimension(String dimension) {
        NamespacedKey key = NamespacedKey.fromString(dimension);
        return key == null ? null : Bukkit.getWorld(key);
    }
}
