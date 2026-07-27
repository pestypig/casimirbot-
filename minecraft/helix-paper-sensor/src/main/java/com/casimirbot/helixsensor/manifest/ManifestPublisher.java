package com.casimirbot.helixsensor.manifest;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

public final class ManifestPublisher {
    private final JavaPlugin plugin;
    private final HelixSensorConfig config;
    private final HelixHttpClient httpClient;
    private final HelixSensorRuntimeStatus runtimeStatus;
    private final AtomicBoolean publishInFlight = new AtomicBoolean(false);
    private final AtomicBoolean firstAdmissionDelivered = new AtomicBoolean(false);
    private BukkitTask refreshTask;

    public ManifestPublisher(JavaPlugin plugin, HelixSensorConfig config, HelixHttpClient httpClient, HelixSensorRuntimeStatus runtimeStatus) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        this.runtimeStatus = runtimeStatus;
    }

    public void start(Runnable onFirstAdmission) {
        if (refreshTask != null) return;
        long refreshTicks = Math.max(100L, config.heartbeatIntervalTicks());
        refreshTask = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            () -> publishIfIdle(onFirstAdmission),
            0L,
            refreshTicks
        );
    }

    public void stop() {
        if (refreshTask != null) {
            refreshTask.cancel();
            refreshTask = null;
        }
    }

    public CompletableFuture<HelixHttpClient.IngressResponse> publishAsync() {
        runtimeStatus.recordManifestAttempt();
        return httpClient.postManifestAsync(
            HelixJson.stringify(buildManifest(config, Instant.now().toString()))
        );
    }

    private void publishIfIdle(Runnable onFirstAdmission) {
        if (
            httpClient.terminallyPaused() ||
            !publishInFlight.compareAndSet(false, true)
        ) {
            return;
        }
        publishAsync().whenComplete((response, error) -> {
            publishInFlight.set(false);
            if (error != null) {
                plugin.getLogger().warning(
                    "Failed to publish Helix manifest: " + error.getMessage()
                );
                return;
            }
            if (httpClient.terminallyPaused()) return;
            if (!response.success()) {
                if (
                    !"client_backoff".equals(response.errorCode()) &&
                    !"client_terminally_paused".equals(response.errorCode())
                ) {
                    plugin.getLogger().warning(
                        "Helix manifest was not admitted: " + response.failureSummary()
                    );
                }
                return;
            }
            if (firstAdmissionDelivered.compareAndSet(false, true)) {
                plugin.getLogger().info(
                    "Published and admitted the Helix environment source manifest."
                );
                plugin.getServer().getScheduler().runTask(
                    plugin,
                    onFirstAdmission
                );
            }
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
                "chunk_snapshot_summary",
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
