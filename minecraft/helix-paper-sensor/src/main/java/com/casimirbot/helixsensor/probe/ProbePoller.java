package com.casimirbot.helixsensor.probe;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;

public final class ProbePoller {
    private final JavaPlugin plugin;
    private final HelixSensorConfig config;
    private final HelixHttpClient httpClient;
    private final ProbeExecutor executor;
    private final ProbeResultPublisher publisher;
    private final AtomicInteger pendingProbeCount;
    private final HelixSensorRuntimeStatus runtimeStatus;
    private final AtomicBoolean pollInFlight = new AtomicBoolean(false);
    private BukkitTask task;

    public ProbePoller(JavaPlugin plugin, HelixSensorConfig config, HelixHttpClient httpClient, HelixSensorRuntimeStatus runtimeStatus, AtomicInteger pendingProbeCount) {
        this.plugin = plugin;
        this.config = config;
        this.httpClient = httpClient;
        ProbeContractGuard guard = new ProbeContractGuard();
        this.executor = new ProbeExecutor(config, guard, runtimeStatus);
        this.publisher = new ProbeResultPublisher(httpClient);
        this.pendingProbeCount = pendingProbeCount;
        this.runtimeStatus = runtimeStatus;
    }

    public void start() {
        if (!config.readOnlyProbesEnabled()) return;
        this.task = plugin.getServer().getScheduler().runTaskTimerAsynchronously(
            plugin,
            this::pollAsync,
            config.probePollIntervalTicks(),
            config.probePollIntervalTicks()
        );
    }

    public void stop() {
        if (task != null) {
            task.cancel();
            task = null;
        }
    }

    private void pollAsync() {
        if (!pollInFlight.compareAndSet(false, true)) return;
        httpClient
            .getPendingProbesAsync()
            .thenCompose(this::executeAndPublishPending)
            .whenComplete((ignored, error) -> {
                pollInFlight.set(false);
                if (error != null) {
                    plugin.getLogger().warning(
                        "Helix probe cycle failed: " + rootMessage(error)
                    );
                }
            });
    }

    private CompletableFuture<Void> executeAndPublishPending(String body) {
        if (body == null || body.isBlank()) {
            return CompletableFuture.completedFuture(null);
        }
        Object parsed = HelixJson.parse(body);
        Map<String, Object> object = HelixJson.asObject(parsed);
        List<Object> probes = HelixJson.asList(object.get("probe_requests"));
        pendingProbeCount.set(probes.size());
        runtimeStatus.setPendingProbeCount(probes.size());
        List<CompletableFuture<Void>> completions = new java.util.ArrayList<>();
        for (Object probeObject : probes) {
            Map<String, Object> probe = HelixJson.asObject(probeObject);
            CompletableFuture<Void> completion = new CompletableFuture<>();
            completions.add(completion);
            plugin.getServer().getScheduler().runTask(plugin, () -> {
                try {
                    Map<String, Object> result = executor.executeOnMainThread(probe);
                    publisher.publishAsync(result).whenComplete((response, error) -> {
                        markProbeComplete();
                        if (error == null) completion.complete(null);
                        else completion.completeExceptionally(error);
                    });
                } catch (RuntimeException error) {
                    markProbeComplete();
                    completion.completeExceptionally(error);
                }
            });
        }
        return CompletableFuture.allOf(
            completions.toArray(CompletableFuture[]::new)
        );
    }

    private void markProbeComplete() {
        pendingProbeCount.updateAndGet(value -> Math.max(0, value - 1));
        runtimeStatus.setPendingProbeCount(pendingProbeCount.get());
    }

    private static String rootMessage(Throwable error) {
        Throwable cursor = error;
        while (cursor.getCause() != null) cursor = cursor.getCause();
        String message = cursor.getMessage();
        return message == null || message.isBlank()
            ? cursor.getClass().getSimpleName()
            : message;
    }
}
