package com.casimirbot.helixcompanion.spike;

import com.mojang.authlib.GameProfile;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import net.minecraft.core.BlockPos;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ClientInformation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.GameType;
import net.minecraft.world.level.block.state.BlockState;

/**
 * Candidate B feasibility adapter. It constructs a detached, locally identified
 * server-player-shaped mechanics subject, never registers it as a second online
 * actor, and reports failures instead of synthesizing a network connection.
 */
public final class PlayerSemanticMiningProbe {
    private static final String PROFILE_NAMESPACE = "helix-companion-spike:";

    private PlayerSemanticMiningProbe() {}

    public record Result(
        UUID profileId,
        float vanillaProgressPerTick,
        int vanillaMinimumTicks,
        boolean blockDestroyed,
        boolean networkConnectionPresent,
        boolean toolMayDestroy,
        boolean blockActionRestricted,
        int toolDamageBefore,
        int toolDamageAfter,
        MiningEventProbe.Counts eventCounts,
        String failureCode
    ) {}

    public static Result attempt(
        MinecraftServer server,
        ServerLevel level,
        BlockPos target,
        ItemStack tool,
        String companionId,
        boolean cancelThroughFabricEvent
    ) {
        UUID profileId = UUID.nameUUIDFromBytes(
            (PROFILE_NAMESPACE + companionId).getBytes(StandardCharsets.UTF_8)
        );
        ServerPlayer subject = new ServerPlayer(
            server,
            level,
            new GameProfile(profileId, "HelixSpike"),
            ClientInformation.createDefault()
        );
        subject.gameMode.changeGameModeForPlayer(GameType.SURVIVAL);
        subject.setPos(target.getX() + 0.5D, target.getY() + 1.0D, target.getZ() + 2.5D);
        ItemStack workingTool = tool.copy();
        subject.setItemInHand(InteractionHand.MAIN_HAND, workingTool);

        BlockState state = level.getBlockState(target);
        float progress = state.getDestroyProgress(subject, level, target);
        int minimumTicks = progress <= 0.0F
            ? Integer.MAX_VALUE
            : (int) Math.ceil(1.0F / progress);
        boolean connectionPresent = subject.connection != null;
        boolean toolMayDestroy = workingTool.canDestroyBlock(state, level, target, subject);
        boolean actionRestricted = subject.blockActionRestricted(
            level,
            target,
            GameType.SURVIVAL
        );
        int damageBefore = workingTool.getDamageValue();
        MiningEventProbe.Scope events = MiningEventProbe.open(
            target,
            cancelThroughFabricEvent
        );
        try {
            boolean destroyed = subject.gameMode.destroyBlock(target);
            return new Result(
                profileId,
                progress,
                minimumTicks,
                destroyed,
                connectionPresent,
                toolMayDestroy,
                actionRestricted,
                damageBefore,
                workingTool.getDamageValue(),
                events.counts(),
                "none"
            );
        } catch (RuntimeException failure) {
            return new Result(
                profileId,
                progress,
                minimumTicks,
                false,
                connectionPresent,
                toolMayDestroy,
                actionRestricted,
                damageBefore,
                workingTool.getDamageValue(),
                events.counts(),
                "detached_player_interaction_failed:" + failure.getClass().getSimpleName()
            );
        } finally {
            events.close();
        }
    }
}
