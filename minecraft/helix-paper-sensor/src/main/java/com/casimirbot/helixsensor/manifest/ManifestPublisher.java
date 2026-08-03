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
    private final String manifestCreatedAt;
    private final AtomicBoolean publishInFlight = new AtomicBoolean(false);
    private final AtomicBoolean firstAdmissionDelivered = new AtomicBoolean(false);
    private BukkitTask refreshTask;

    public ManifestPublisher(JavaPlugin plugin, HelixSensorConfig config, HelixHttpClient httpClient, HelixSensorRuntimeStatus runtimeStatus) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        this.runtimeStatus = runtimeStatus;
        this.manifestCreatedAt = Instant.now().toString();
    }

    public void start(Runnable onFirstAdmission) {
        if (refreshTask != null) return;
        long refreshTicks = refreshTicksFor(
            config.heartbeatIntervalTicks()
        );
        refreshTask = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            () -> publishIfIdle(onFirstAdmission),
            0L,
            refreshTicks
        );
    }

    static long refreshTicksFor(int heartbeatIntervalTicks) {
        return Math.max(
            HelixSensorConfig.MIN_MANIFEST_REFRESH_INTERVAL_TICKS,
            heartbeatIntervalTicks
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
            HelixJson.stringify(currentManifest())
        );
    }

    Map<String, Object> currentManifest() {
        return buildManifest(config, manifestCreatedAt);
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
        return EnvironmentSourceManifestFactory.build(config, "0.2.0", now);
    }
}
