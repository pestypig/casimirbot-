package com.casimirbot.helixsensor;

import com.casimirbot.helixsensor.command.CommandStatusFormatter;
import com.casimirbot.helixsensor.events.SnapshotEventListener;
import com.casimirbot.helixsensor.manifest.HeartbeatScheduler;
import com.casimirbot.helixsensor.manifest.ManifestPublisher;
import com.casimirbot.helixsensor.probe.ProbePoller;
import com.casimirbot.helixsensor.snapshot.SnapshotBurstController;
import com.casimirbot.helixsensor.snapshot.SnapshotScheduler;
import java.util.concurrent.atomic.AtomicInteger;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.plugin.java.JavaPlugin;

public final class HelixPaperSensorPlugin extends JavaPlugin {
    private HelixSensorConfig sensorConfig;
    private HelixHttpClient httpClient;
    private ManifestPublisher manifestPublisher;
    private HeartbeatScheduler heartbeatScheduler;
    private SnapshotScheduler snapshotScheduler;
    private ProbePoller probePoller;
    private SnapshotBurstController burstController;
    private HelixSensorRuntimeStatus runtimeStatus;
    private final AtomicInteger pendingProbeCount = new AtomicInteger(0);
    private final AtomicInteger skippedSnapshotCount = new AtomicInteger(0);

    @Override
    public void onEnable() {
        saveDefaultConfig();
        this.sensorConfig = HelixSensorConfig.from(getConfig());
        if (!sensorConfig.enabled()) {
            getLogger().info("HelixPaperSensor disabled by config.");
            return;
        }
        if (sensorConfig.executionEnabled()) {
            getLogger().severe("HelixPaperSensor refuses to start with execution_enabled=true.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }

        this.runtimeStatus = new HelixSensorRuntimeStatus(sensorConfig);
        this.httpClient = new HelixHttpClient(sensorConfig, getLogger(), runtimeStatus);
        this.burstController = new SnapshotBurstController(sensorConfig);
        this.manifestPublisher = new ManifestPublisher(this, sensorConfig, httpClient, runtimeStatus);
        this.heartbeatScheduler = new HeartbeatScheduler(this, sensorConfig, httpClient, runtimeStatus, pendingProbeCount, skippedSnapshotCount);
        this.snapshotScheduler = new SnapshotScheduler(this, sensorConfig, httpClient, runtimeStatus, burstController, heartbeatScheduler, skippedSnapshotCount);
        this.probePoller = new ProbePoller(this, sensorConfig, httpClient, runtimeStatus, pendingProbeCount);

        getServer().getPluginManager().registerEvents(new SnapshotEventListener(burstController), this);

        manifestPublisher.publishAsync();
        heartbeatScheduler.start();
        snapshotScheduler.start();
        probePoller.start();

        getLogger().info("HelixPaperSensor enabled in read-only mode.");
    }

    @Override
    public void onDisable() {
        if (heartbeatScheduler != null) heartbeatScheduler.stop();
        if (snapshotScheduler != null) snapshotScheduler.stop();
        if (probePoller != null) probePoller.stop();
        if (httpClient != null) httpClient.close();
        getLogger().info("HelixPaperSensor disabled.");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!"helixsensor".equalsIgnoreCase(command.getName())) return false;
        if (!sender.hasPermission("helixsensor.admin")) {
            sender.sendMessage("Missing helixsensor.admin permission.");
            return true;
        }
        String subcommand = args.length == 0 ? "status" : args[0].toLowerCase();
        if ("status".equals(subcommand)) return sendLines(sender, CommandStatusFormatter.status(sensorConfig, runtimeStatus));
        if ("probes".equals(subcommand)) return sendLines(sender, CommandStatusFormatter.probes(runtimeStatus));
        if ("debug-payload".equals(subcommand) || "debug_payload".equals(subcommand)) return sendLines(sender, CommandStatusFormatter.debugPayload(runtimeStatus));
        if ("heartbeat".equals(subcommand)) {
            if (heartbeatScheduler != null) heartbeatScheduler.forceHeartbeat();
            sender.sendMessage("Helix heartbeat queued.");
            return true;
        }
        if ("snapshot".equals(subcommand)) {
            if (snapshotScheduler != null) snapshotScheduler.forceSnapshot();
            sender.sendMessage("Helix snapshot queued.");
            return true;
        }
        if ("reload".equals(subcommand)) {
            reloadConfig();
            sender.sendMessage("Helix config reloaded. Restart the server to recreate HTTP clients and schedulers.");
            return true;
        }
        sender.sendMessage("Usage: /helixsensor status|snapshot|heartbeat|probes|reload|debug-payload");
        return true;
    }

    private boolean sendLines(CommandSender sender, Iterable<String> lines) {
        for (String line : lines) sender.sendMessage(line);
        return true;
    }
}
