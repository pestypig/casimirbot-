package com.casimirbot.helixsensor.fabric;

import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;

/**
 * Harmless gameplay-facing commands used to verify that live mod namespaces
 * participate in the governed command catalog independently of /helix
 * connector management.
 */
final class FabricGameplayCommands {
    static final String ROOT = "helixgame";
    static final String PING_RESPONSE = "Helix gameplay command lane is active.";

    private FabricGameplayCommands() {}

    static void register() {
        CommandRegistrationCallback.EVENT.register(
            (dispatcher, registryAccess, environment) ->
                dispatcher.register(
                    Commands.literal(ROOT)
                        .then(
                            Commands.literal("ping").executes(context -> {
                                context.getSource().sendSuccess(
                                    () -> Component.literal(PING_RESPONSE),
                                    false
                                );
                                return 1;
                            })
                        )
                )
        );
    }
}
