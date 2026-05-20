package com.casimirbot.helixsensor.manifest;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.bukkit.plugin.java.JavaPlugin;

public final class ManifestPublisher {
    private final JavaPlugin plugin;
    private final HelixSensorConfig config;
    private final HelixHttpClient httpClient;
    private final HelixSensorRuntimeStatus runtimeStatus;

    public ManifestPublisher(JavaPlugin plugin, HelixSensorConfig config, HelixHttpClient httpClient, HelixSensorRuntimeStatus runtimeStatus) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        this.runtimeStatus = runtimeStatus;
    }

    public void publishAsync() {
        runtimeStatus.recordManifestAttempt();
        httpClient.postManifestAsync(HelixJson.stringify(buildManifest(config, Instant.now().toString())))
            .thenRun(() -> plugin.getLogger().info("Published Helix environment source manifest."))
            .exceptionally(error -> {
                plugin.getLogger().warning("Failed to publish Helix manifest: " + error.getMessage());
                return null;
            });
    }

    public static Map<String, Object> buildManifest(HelixSensorConfig config, String now) {
        return Map.ofEntries(
            Map.entry("schema", "helix.environment_source_manifest.v1"),
            Map.entry("manifest_id", "manifest:" + config.sourceId() + ":0.1.0"),
            Map.entry("source_id", config.sourceId()),
            Map.entry("room_id", config.roomId()),
            Map.entry("domain", "minecraft"),
            Map.entry("domain_adapter", config.domainAdapter()),
            Map.entry("source_label", config.sourceLabel()),
            Map.entry("adapter_version", "0.1.0"),
            Map.entry("protocol_version", "helix.environment_source_manifest.v1"),
            Map.entry("modalities", List.of("environment_state", "environment_affordance")),
            Map.entry("supported_snapshot_sections", List.of(
                "actor_state",
                "inventory_state",
                "object_state",
                "local_map",
                "focus",
                "affordances",
                "domain_specific"
            )),
            Map.entry("supported_probe_types", List.of(
                "route_feasibility",
                "reachability",
                "line_of_sight",
                "container_freshness",
                "crop_state",
                "hazard_check",
                "inventory_check",
                "local_map_summary"
            )),
            Map.entry("forbidden_probe_types", List.of(
                "move_actor",
                "use_item",
                "take_item",
                "place_block",
                "break_block",
                "attack_entity",
                "open_container"
            )),
            Map.entry("snapshot_policy", Map.of(
                "baseline_interval_ms", config.snapshotIntervalTicks() * 50,
                "burst_interval_ms", config.burstIntervalTicks() * 50,
                "send_only_changed_sections", config.sendOnlyChangedSections(),
                "include_section_hashes", config.includeSectionHashes(),
                "max_payload_bytes", config.maxPayloadBytes(),
                "raw_payload_included", false,
                "raw_nbt_included", false
            )),
            Map.entry("sensor_scope_policy", Map.of(
                "default_scope", config.sensorScopePolicy().defaultScope().wireValue(),
                "can_report_privileged_state", config.sensorScopePolicy().allowPrivilegedContainerScan() || config.sensorScopePolicy().allowPrivilegedEntityScan(),
                "privileged_state_requires_caveat", true,
                "player_memory_requires_prior_observation", true
            )),
            Map.entry("execution_policy", Map.of(
                "may_execute_live_actions", false,
                "may_perform_read_only_probes", true,
                "require_human_approval_for_execution", true
            )),
            Map.entry("auth_policy", Map.of(
                "bearer_required", config.bearerToken() != null && !config.bearerToken().isBlank() && !"replace-me".equals(config.bearerToken())
            )),
            Map.entry("assistant_answer", false),
            Map.entry("raw_content_included", false),
            Map.entry("context_policy", "compact_context_pack_only"),
            Map.entry("created_at", now)
        );
    }
}
