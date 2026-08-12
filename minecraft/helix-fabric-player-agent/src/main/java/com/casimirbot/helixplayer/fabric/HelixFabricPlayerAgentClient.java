package com.casimirbot.helixplayer.fabric;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.Minecraft;
import net.minecraft.network.chat.Component;
import com.casimirbot.helixsensor.pairing.ConnectorPairingClient;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class HelixFabricPlayerAgentClient implements ClientModInitializer {
    private static final Logger LOGGER = LoggerFactory.getLogger(
        "HelixFabricPlayerAgent"
    );
    private Minecraft minecraft;
    private volatile PlayerActionRuntime runtime;
    private final AtomicBoolean connectorOperation = new AtomicBoolean(false);
    private int pairingInboxTicks;

    @Override
    public void onInitializeClient() {
        minecraft = Minecraft.getInstance();
        PlayerActionConfig initialConfig = PlayerActionConfigLoader.load(LOGGER);
        replaceRuntime(initialConfig);
        PlayerActionClientCommands.register(this);
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            runtime.tick();
            pollPairingInbox();
        });
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

    void showDiagnosticStatus() {
        message(runtime == null
            ? "Helix player embodiment is not initialized."
            : runtime.localDiagnosticStatusText());
    }

    void startDiagnosticWalk(String direction, int durationMs, boolean sprint) {
        if (!List.of("forward", "back", "left", "right").contains(direction)) {
            message("Diagnostic walk direction must be forward, back, left, or right.");
            return;
        }
        message(runtime == null
            ? "Helix player embodiment is not initialized."
            : runtime.startLocalDiagnostic(
                "walk",
                Map.of(
                    "direction", direction,
                    "duration_ms", durationMs,
                    "sprint", sprint
                ),
                Math.max(20, (durationMs + 49L) / 50L + 20L)
            ));
    }

    void startDiagnosticJump(int count) {
        message(runtime == null
            ? "Helix player embodiment is not initialized."
            : runtime.startLocalDiagnostic(
                "jump",
                Map.of("count", count),
                Math.max(40, count * 30L)
            ));
    }

    void startDiagnosticRelativeLook(double yawDelta, double pitchDelta) {
        message(runtime == null
            ? "Helix player embodiment is not initialized."
            : runtime.startLocalDiagnostic(
                "look_at",
                Map.of(
                    "target", Map.of(
                        "target_kind", "relative_rotation",
                        "yaw_delta_degrees", yawDelta,
                        "pitch_delta_degrees", pitchDelta
                    ),
                    "max_turn_degrees_per_tick", 18.0
                ),
                100
            ));
    }

    void cancelDiagnostic() {
        message(runtime == null
            ? "Helix player embodiment is not initialized."
            : runtime.cancelLocalDiagnostic());
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

    private void pollPairingInbox() {
        pairingInboxTicks = (pairingInboxTicks + 1) % 20;
        if (pairingInboxTicks != 0 || connectorOperation.get()) return;
        try {
            PlayerActionPairingInbox.PollResult result =
                PlayerActionPairingInbox.consumeDefault(System.currentTimeMillis());
            if (result.request() != null) {
                pairAsync(result.request().code(), result.request().endpointOverride());
            } else if (!result.failureCode().isBlank()) {
                LOGGER.warn(
                    "Ignored a local Helix player-pairing inbox entry: {}.",
                    result.failureCode()
                );
            }
        } catch (IOException error) {
            LOGGER.warn("Could not claim the local Helix player-pairing inbox.");
        }
    }

    private void replaceRuntime(PlayerActionConfig config) {
        PlayerActionRuntime prior = runtime;
        if (prior != null) prior.close();
        runtime = new PlayerActionRuntime(config, minecraft, LOGGER, this::message);
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
