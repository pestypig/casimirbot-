package com.casimirbot.helixplayer.fabric;

import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.argument;
import static net.fabricmc.fabric.api.client.command.v2.ClientCommandManager.literal;

import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;

final class PlayerActionClientCommands {
    private PlayerActionClientCommands() {}

    static void register(HelixFabricPlayerAgentClient agent) {
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) ->
            dispatcher.register(
                literal("helix-player")
                    .then(
                        literal("pair")
                            .then(
                                argument("code", StringArgumentType.word())
                                    .executes(context -> {
                                        agent.pairAsync(
                                            StringArgumentType.getString(context, "code"),
                                            null
                                        );
                                        return 1;
                                    })
                                    .then(
                                        argument("endpoint", StringArgumentType.greedyString())
                                            .executes(context -> {
                                                agent.pairAsync(
                                                    StringArgumentType.getString(context, "code"),
                                                    StringArgumentType.getString(context, "endpoint")
                                                );
                                                return 1;
                                            })
                                    )
                            )
                    )
                    .then(literal("status").executes(context -> {
                        agent.showStatus();
                        return 1;
                    }))
                    .then(literal("emergency-stop").executes(context -> {
                        agent.emergencyStop();
                        return 1;
                    }))
                    .then(literal("disconnect").executes(context -> {
                        agent.disconnectLocal();
                        return 1;
                    }))
            )
        );
    }
}
