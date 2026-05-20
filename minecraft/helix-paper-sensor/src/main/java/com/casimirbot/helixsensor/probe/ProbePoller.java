package com.casimirbot.helixsensor.probe;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.HelixSensorRuntimeStatus;
import java.util.List;
import java.util.Map;
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
        httpClient.getPendingProbesAsync().thenAccept(body -> {
            if (body == null || body.isBlank()) return;
            Object parsed = HelixJson.parse(body);
            Map<String, Object> object = HelixJson.asObject(parsed);
            List<Object> probes = HelixJson.asList(object.get("probe_requests"));
            pendingProbeCount.set(probes.size());
            runtimeStatus.setPendingProbeCount(probes.size());
            for (Object probeObject : probes) {
                Map<String, Object> probe = HelixJson.asObject(probeObject);
                plugin.getServer().getScheduler().runTask(plugin, () -> {
                    Map<String, Object> result = executor.executeOnMainThread(probe);
                    publisher.publishAsync(result);
                    pendingProbeCount.updateAndGet(value -> Math.max(0, value - 1));
                    runtimeStatus.setPendingProbeCount(pendingProbeCount.get());
                });
            }
        });
    }
}
