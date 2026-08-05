package com.casimirbot.helixsensor.fabric;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.pairing.ConnectorPairingClient;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.logging.Logger;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.server.MinecraftServer;

public final class HelixFabricSensorMod implements ModInitializer {
    public static final String MOD_ID = "helix_fabric_sensor";
    private static final Logger LOGGER = Logger.getLogger(MOD_ID);

    private final AtomicBoolean connectorOperation = new AtomicBoolean(false);
    private volatile FabricConnectorRuntime runtime;
    private volatile MinecraftServer server;

    @Override
    public void onInitialize() {
        FabricConnectorCommands.register(this);
        FabricGameplayCommands.register();
        ServerLifecycleEvents.SERVER_STARTED.register(startedServer -> {
            this.server = startedServer;
            restartRuntime(startedServer);
        });
        ServerTickEvents.END_SERVER_TICK.register(tickingServer -> {
            FabricConnectorRuntime current = runtime;
            if (current != null) current.tick(tickingServer);
            FabricGameplayCommands.tick(tickingServer);
        });
        ServerLifecycleEvents.SERVER_STOPPING.register(stoppingServer -> {
            FabricGameplayCommands.clear(stoppingServer);
            FabricConnectorRuntime current = runtime;
            if (current != null) current.close();
            runtime = null;
            server = null;
        });
        LOGGER.info(
            "Helix Fabric Sensor registered for integrated and dedicated server lifecycle events."
        );
    }

    synchronized void restartRuntime(MinecraftServer activeServer) {
        FabricConnectorRuntime previous = runtime;
        if (previous != null) previous.close();
        HelixSensorConfig config = FabricSensorConfigLoader.loadOrCreate(LOGGER);
        FabricCommandConfig commandConfig =
            FabricSensorConfigLoader.loadCommandConfig(LOGGER);
        FabricConnectorRuntime replacement = new FabricConnectorRuntime(
            config,
            commandConfig,
            LOGGER
        );
        runtime = replacement;
        replacement.start(activeServer);
    }

    void pairAsync(CommandSourceStack source, String code) {
        MinecraftServer activeServer = server;
        if (activeServer == null) {
            FabricConnectorCommands.failure(source, "The server is not ready.");
            return;
        }
        if (!connectorOperation.compareAndSet(false, true)) {
            FabricConnectorCommands.failure(
                source,
                "Another Helix connector operation is already running."
            );
            return;
        }
        String pairingEndpoint = FabricSensorConfigLoader.loadPairingEndpoint(
            LOGGER
        );
        String nonce;
        try {
            nonce = FabricSensorConfigLoader.loadOrCreatePairingNonce(
                code,
                LOGGER
            );
        } catch (RuntimeException error) {
            connectorOperation.set(false);
            FabricConnectorCommands.failure(
                source,
                "The local connector configuration could not be prepared."
            );
            return;
        }
        CompletableFuture
            .supplyAsync(() -> {
                try (ConnectorPairingClient client =
                    new ConnectorPairingClient()) {
                    return client.redeem(
                        pairingEndpoint,
                        code,
                        nonce,
                        "minecraft.fabric_mod.v1",
                        FabricConnectorRuntime.ADAPTER_VERSION
                    );
                } catch (ConnectorPairingClient.PairingException error) {
                    throw new PairingOperationException(
                        error.code(),
                        error.getMessage()
                    );
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new PairingOperationException(
                        "connector_pairing_interrupted",
                        "Connector pairing was interrupted."
                    );
                }
            })
            .whenComplete((paired, error) ->
                activeServer.execute(() -> {
                    connectorOperation.set(false);
                    Throwable cause = unwrap(error);
                    if (cause != null) {
                        String message = cause instanceof PairingOperationException failure
                            ? failure.safeMessage()
                            : "Connector pairing failed before Helix confirmed it.";
                        FabricConnectorCommands.failure(source, message);
                        return;
                    }
                    try {
                        FabricSensorConfigLoader.savePairedSource(
                            paired,
                            LOGGER
                        );
                        restartRuntime(activeServer);
                        FabricConnectorCommands.success(
                            source,
                            paired.commandOnly()
                                ? paired.replayed()
                                    ? "Helix command pairing recovered and command access restarted."
                                    : "Helix command access paired and the connector restarted."
                                : paired.replayed()
                                    ? "Helix pairing recovered from the prior retry and the connector restarted."
                                    : "Helix pairing succeeded and the connector started."
                        );
                    } catch (RuntimeException saveError) {
                        FabricConnectorCommands.failure(
                            source,
                            "Helix paired the source, but the local configuration could not be saved. Run the same pairing command again before its retry window closes."
                        );
                    }
                })
            );
    }

    void unpairAsync(CommandSourceStack source) {
        MinecraftServer activeServer = server;
        if (activeServer == null) {
            FabricConnectorCommands.failure(source, "The server is not ready.");
            return;
        }
        HelixSensorConfig config = FabricSensorConfigLoader.loadOrCreate(LOGGER);
        if (!config.sensorUploadsAllowed()) {
            FabricSensorConfigLoader.clearPairedSource(LOGGER);
            restartRuntime(activeServer);
            FabricConnectorCommands.success(
                source,
                "The local connector was already inactive and is now cleared."
            );
            return;
        }
        if (!connectorOperation.compareAndSet(false, true)) {
            FabricConnectorCommands.failure(
                source,
                "Another Helix connector operation is already running."
            );
            return;
        }
        String pairingEndpoint = FabricSensorConfigLoader.loadPairingEndpoint(
            LOGGER
        );
        ConnectorPairingClient.PairedSourceConfig paired =
            new ConnectorPairingClient.PairedSourceConfig(
                config.endpoint(),
                pairingEndpoint,
                config.bearerToken(),
                config.sourceId(),
                config.roomId(),
                config.worldId(),
                config.domainAdapter(),
                java.util.Map.of(),
                false,
                false
            );
        CompletableFuture
            .runAsync(() -> {
                try (ConnectorPairingClient client =
                    new ConnectorPairingClient()) {
                    client.unpair(paired);
                } catch (ConnectorPairingClient.PairingException error) {
                    throw new PairingOperationException(
                        error.code(),
                        error.getMessage()
                    );
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new PairingOperationException(
                        "connector_unpair_interrupted",
                        "Connector unpairing was interrupted."
                    );
                }
            })
            .whenComplete((ignored, error) ->
                activeServer.execute(() -> {
                    connectorOperation.set(false);
                    Throwable cause = unwrap(error);
                    if (cause != null) {
                        FabricConnectorCommands.failure(
                            source,
                            cause instanceof PairingOperationException failure
                                ? failure.safeMessage()
                                : "Connector unpairing failed before Helix confirmed revocation."
                        );
                        return;
                    }
                    FabricSensorConfigLoader.clearPairedSource(LOGGER);
                    restartRuntime(activeServer);
                    FabricConnectorCommands.success(
                        source,
                        "The Helix source binding was revoked and the local connector was cleared."
                    );
                })
            );
    }

    void reconnect(CommandSourceStack source) {
        MinecraftServer activeServer = server;
        if (activeServer == null) {
            FabricConnectorCommands.failure(source, "The server is not ready.");
            return;
        }
        restartRuntime(activeServer);
        FabricConnectorCommands.success(
            source,
            "The Helix connector reloaded its local configuration and restarted."
        );
    }

    void sendStatus(CommandSourceStack source) {
        HelixSensorConfig config = FabricSensorConfigLoader.loadOrCreate(LOGGER);
        FabricConnectorRuntime current = runtime;
        String state = current != null && current.active()
            ? current.admitted() ? "active and admitted" : "connecting"
            : config.enabled() ? "configured but inactive" : "not paired";
        FabricConnectorCommands.success(
            source,
            "Helix connector: " + state +
            "; adapter " + config.domainAdapter() +
            "; world " + config.worldId() +
            ". Credentials are hidden."
        );
    }

    void sendCapabilities(CommandSourceStack source) {
        FabricConnectorCommands.success(
            source,
            "Helix Fabric capabilities: player status, inventory, nearby entities, local map, hazards, reachability, line of sight, crops, heartbeats, and bounded live Minecraft commands when separately authorized. Pairing management is operator-only and never exposed to the runtime agent."
        );
    }

    private static Throwable unwrap(Throwable error) {
        if (error == null) return null;
        Throwable current = error;
        while (
            current.getCause() != null &&
            (current instanceof java.util.concurrent.CompletionException ||
                current instanceof java.util.concurrent.ExecutionException)
        ) {
            current = current.getCause();
        }
        return current;
    }

    private static final class PairingOperationException
        extends RuntimeException {
        private final String code;
        private final String safeMessage;

        PairingOperationException(String code, String safeMessage) {
            super(code);
            this.code = code;
            this.safeMessage = safeMessage;
        }

        String safeMessage() {
            return safeMessage == null || safeMessage.isBlank()
                ? "Helix connector operation failed (" + code + ")."
                : safeMessage;
        }
    }
}
