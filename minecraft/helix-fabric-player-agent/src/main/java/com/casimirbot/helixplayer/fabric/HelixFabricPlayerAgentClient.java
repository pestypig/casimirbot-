package com.casimirbot.helixplayer.fabric;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import com.casimirbot.helixsensor.pairing.ConnectorPairingClient;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class HelixFabricPlayerAgentClient implements ClientModInitializer {
    private static final Logger LOGGER = LoggerFactory.getLogger(
        "HelixFabricPlayerAgent"
    );
    private Minecraft minecraft;
    private volatile PlayerActionRuntime runtime;
    private final AtomicBoolean connectorOperation = new AtomicBoolean(false);

    @Override
    public void onInitializeClient() {
        minecraft = Minecraft.getInstance();
        PlayerActionConfig initialConfig = PlayerActionConfigLoader.load(LOGGER);
        replaceRuntime(initialConfig);
        PlayerActionClientCommands.register(this);
        ClientTickEvents.END_CLIENT_TICK.register(client -> runtime.tick());
        ClientLifecycleEvents.CLIENT_STOPPING.register(client -> {
            PlayerActionRuntime active = runtime;
            if (active != null) active.close();
        });
        LOGGER.info(initialConfig.ready()
            ? "Helix Fabric Player Agent loaded with a separately paired action authority."
            : "Helix Fabric Player Agent loaded disabled; a separate action pairing is required before capabilities are advertised.");
    }

    PlayerActionController controllerForIntegration() {
        return runtime == null ? null : runtime.controllerForIntegration();
    }

    void pairAsync(String code, String endpointOverride) {
        if (!connectorOperation.compareAndSet(false, true)) {
            message("Another Helix player connector operation is already running.");
            return;
        }
        String pairingEndpoint = endpointOverride == null || endpointOverride.isBlank()
            ? PlayerActionConfigLoader.pairingEndpoint(LOGGER)
            : endpointOverride.trim();
        message("Helix is redeeming the one-time player-action pairing code...");
        CompletableFuture
            .supplyAsync(() -> {
                try {
                    String nonce = PlayerActionConfigLoader.loadOrCreateNonce(
                        code,
                        pairingEndpoint,
                        LOGGER
                    );
                    try (ConnectorPairingClient client = new ConnectorPairingClient()) {
                        return client.redeem(
                            pairingEndpoint,
                            code,
                            nonce,
                            PlayerActionConfig.DOMAIN_ADAPTER,
                            PlayerActionRuntime.ADAPTER_VERSION
                        );
                    }
                } catch (ConnectorPairingClient.PairingException error) {
                    throw new PlayerPairingFailure(error.code() + ": " + error.getMessage());
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new PlayerPairingFailure("Player-action pairing was interrupted.");
                } catch (java.io.IOException error) {
                    throw new PlayerPairingFailure("The local player-action pairing state could not be saved.");
                }
            })
            .whenComplete((paired, error) -> minecraft.execute(() -> {
                connectorOperation.set(false);
                if (error != null) {
                    Throwable cause = unwrap(error);
                    message(cause == null ? "Player-action pairing failed." : cause.getMessage());
                    return;
                }
                try {
                    PlayerActionConfig config = PlayerActionConfigLoader.savePairedAction(
                        paired,
                        LOGGER
                    );
                    replaceRuntime(config);
                    message(paired.replayed()
                        ? "Helix player-action pairing recovered and embodiment restarted."
                        : "Helix player-action pairing succeeded. The client companion is publishing its capabilities.");
                } catch (java.io.IOException failure) {
                    message("Helix paired the action authority, but the client configuration could not be saved. Retry the same code during its replay window.");
                }
            }));
    }

    void showStatus() {
        message(runtime == null ? "Helix player embodiment is not initialized." : runtime.statusText());
    }

    void emergencyStop() {
        if (runtime != null) runtime.localEmergencyStop("The player invoked the local emergency stop.");
        message("Helix released every client control and latched the local emergency stop.");
    }

    void disconnectLocal() {
        try {
            PlayerActionConfigLoader.clear(LOGGER);
            replaceRuntime(PlayerActionConfig.disabled());
            message("The local Helix player connector is disconnected. Revoke or expire the room authority separately if it should no longer exist.");
        } catch (java.io.IOException error) {
            message("The local player connector could not clear its saved pairing state.");
        }
    }

    private void replaceRuntime(PlayerActionConfig config) {
        PlayerActionRuntime prior = runtime;
        if (prior != null) prior.close();
        runtime = new PlayerActionRuntime(config, minecraft, LOGGER);
        runtime.start();
    }

    private void message(String text) {
        if (minecraft != null && minecraft.gui != null) {
            minecraft.gui.getChat().addMessage(Component.literal(text));
        }
        LOGGER.info("{}", text);
    }

    private static Throwable unwrap(Throwable error) {
        Throwable current = error;
        while (
            current instanceof java.util.concurrent.CompletionException &&
            current.getCause() != null
        ) current = current.getCause();
        return current;
    }

    private static final class PlayerPairingFailure extends RuntimeException {
        PlayerPairingFailure(String message) {
            super(message);
        }
    }
}
