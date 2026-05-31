package com.casimirbot.helixsensor;

import com.casimirbot.helixsensor.scope.SensorScope;
import com.casimirbot.helixsensor.scope.SensorScopePolicy;
import org.bukkit.configuration.file.FileConfiguration;

public record HelixSensorConfig(
    boolean enabled,
    String endpoint,
    String bearerToken,
    String sourceId,
    String roomId,
    String worldId,
    String domainAdapter,
    String sourceLabel,
    int snapshotIntervalTicks,
    int heartbeatIntervalTicks,
    int probePollIntervalTicks,
    int burstIntervalTicks,
    int burstDurationTicks,
    boolean sendOnlyChangedSections,
    boolean includeSectionHashes,
    int maxPayloadBytes,
    int maxPendingUploads,
    SensorScopePolicy sensorScopePolicy,
    boolean readOnlyProbesEnabled,
    int maxPendingProbesPerPoll,
    boolean executionEnabled,
    boolean emitSeedMapMetadata,
    SeedMapOptions seedMapOptions,
    SnapshotOptions snapshotOptions,
    ProbeOptions probeOptions
) {
    public record SnapshotOptions(
        boolean includeActorState,
        boolean includeInventoryState,
        boolean includeFocus,
        boolean includeNearbyEntities,
        boolean includeOpenContainer,
        boolean includeNearbyContainerRefs,
        boolean includeCrops,
        boolean includeLocalMap,
        boolean includeChunkSnapshotSummary,
        int nearbyEntityRadius,
        int cropRadius,
        int localMapRadius,
        int chunkSnapshotRadiusChunks,
        int maxEntities,
        int maxCrops,
        int maxLocalBlocks,
        int maxChunkSnapshotCells,
        int maxInventoryStacks
    ) {}

    public record ProbeOptions(int maxRouteRadius, int maxProbeDurationMs, int ttlMs) {}

    public record SeedMapOptions(
        int radiusChunks,
        String selectedTargetLabel,
        boolean repeatOnLocationSamples,
        int repeatEveryLocationSamples,
        boolean exposeSeedToHelixOnly,
        boolean redactSeedInDebugLogs
    ) {}

    public static HelixSensorConfig from(FileConfiguration config) {
        SensorScopePolicy scopePolicy = new SensorScopePolicy(
            SensorScope.from(config.getString("helix.sensor_scope_default", "player_observable")),
            config.getBoolean("helix.allow_privileged_container_scan", false),
            config.getBoolean("helix.allow_privileged_entity_scan", false),
            config.getBoolean("helix.privileged_state_requires_caveat", true)
        );
        return new HelixSensorConfig(
            config.getBoolean("helix.enabled", true),
            stripTrailingSlash(config.getString("helix.endpoint", "http://localhost:5050")),
            config.getString("helix.bearer_token", "replace-me"),
            config.getString("helix.source_id", "source:minecraft-paper-plugin"),
            config.getString("helix.room_id", "room:minecraft"),
            config.getString("helix.world_id", "minecraft:paper-server"),
            config.getString("helix.domain_adapter", "minecraft.paper_plugin.v1"),
            config.getString("helix.source_label", "Minecraft Paper Plugin"),
            positive(config.getInt("helix.snapshot_interval_ticks", 100), 100),
            positive(config.getInt("helix.heartbeat_interval_ticks", 300), 300),
            positive(config.getInt("helix.probe_poll_interval_ticks", 40), 40),
            positive(config.getInt("helix.burst_interval_ticks", 20), 20),
            positive(config.getInt("helix.burst_duration_ticks", 120), 120),
            config.getBoolean("helix.send_only_changed_sections", true),
            config.getBoolean("helix.include_section_hashes", true),
            positive(config.getInt("helix.max_payload_bytes", 48000), 48000),
            positive(config.getInt("helix.max_pending_uploads", 1), 1),
            scopePolicy,
            config.getBoolean("helix.read_only_probes_enabled", true),
            positive(config.getInt("helix.max_pending_probes_per_poll", 8), 8),
            config.getBoolean("helix.execution_enabled", false),
            config.getBoolean("helix.emit_seed_map_metadata", false),
            new SeedMapOptions(
                positive(config.getInt("helix.seed_map.radius_chunks", 64), 64),
                config.getString("helix.seed_map.selected_target_label", "village"),
                config.getBoolean("helix.seed_map.repeat_on_location_samples", true),
                positive(config.getInt("helix.seed_map.repeat_every_location_samples", 1), 1),
                config.getBoolean("helix.seed_map.expose_seed_to_helix_only", true),
                config.getBoolean("helix.seed_map.redact_seed_in_debug_logs", true)
            ),
            new SnapshotOptions(
                config.getBoolean("snapshot.include_actor_state", true),
                config.getBoolean("snapshot.include_inventory_state", true),
                config.getBoolean("snapshot.include_focus", true),
                config.getBoolean("snapshot.include_nearby_entities", true),
                config.getBoolean("snapshot.include_open_container", true),
                config.getBoolean("snapshot.include_nearby_container_refs", true),
                config.getBoolean("snapshot.include_crops", true),
                config.getBoolean("snapshot.include_local_map", true),
                config.getBoolean("snapshot.include_chunk_snapshot_summary", false),
                positive(config.getInt("snapshot.nearby_entity_radius", 16), 16),
                positive(config.getInt("snapshot.crop_radius", 16), 16),
                positive(config.getInt("snapshot.local_map_radius", 8), 8),
                Math.max(0, config.getInt("snapshot.chunk_snapshot_radius_chunks", 0)),
                positive(config.getInt("snapshot.max_entities", 24), 24),
                positive(config.getInt("snapshot.max_crops", 48), 48),
                positive(config.getInt("snapshot.max_local_blocks", 128), 128),
                positive(config.getInt("snapshot.max_chunk_snapshot_cells", 48), 48),
                positive(config.getInt("snapshot.max_inventory_stacks", 64), 64)
            ),
            new ProbeOptions(
                positive(config.getInt("probe.max_route_radius", 64), 64),
                positive(config.getInt("probe.max_probe_duration_ms", 250), 250),
                positive(config.getInt("probe.ttl_ms", 10000), 10000)
            )
        );
    }

    public boolean sensorUploadsAllowed() {
        return enabled && !executionEnabled;
    }

    private static int positive(int value, int fallback) {
        return value > 0 ? value : fallback;
    }

    private static String stripTrailingSlash(String value) {
        if (value == null || value.isBlank()) return "http://localhost:5050";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
