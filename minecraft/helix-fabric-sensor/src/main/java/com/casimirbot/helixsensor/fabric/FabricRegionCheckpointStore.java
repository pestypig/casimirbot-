package com.casimirbot.helixsensor.fabric;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import net.minecraft.core.BlockPos;
import net.minecraft.resources.ResourceKey;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.state.BlockState;

/**
 * Small, in-memory rollback checkpoints for bounded agent build operations.
 * Checkpoints never touch the host filesystem and deliberately skip block
 * entities during restore so container contents are not overwritten.
 */
final class FabricRegionCheckpointStore {
    static final int MAX_HORIZONTAL_RADIUS = 12;
    static final int MAX_VERTICAL_RADIUS = 8;
    static final int MAX_BLOCKS = 16_384;
    private static final int MAX_CHECKPOINTS_PER_PLAYER = 4;
    private static final long TTL_TICKS = 20L * 60L * 15L;

    record Operation(boolean ok, String message) {}

    private record Checkpoint(
        UUID playerId,
        String name,
        ResourceKey<Level> dimension,
        BlockPos center,
        int horizontalRadius,
        int verticalRadius,
        Map<BlockPos, BlockState> states,
        int blockEntityPositions,
        long expiresAtTick
    ) {}

    private static final Map<String, Checkpoint> CHECKPOINTS = new HashMap<>();

    private FabricRegionCheckpointStore() {}

    static Operation capture(
        ServerPlayer player,
        String requestedName,
        int requestedHorizontalRadius,
        int requestedVerticalRadius
    ) {
        String name = normalizedName(requestedName);
        if (name == null) {
            return new Operation(
                false,
                "Checkpoint names must use 1-24 letters, numbers, underscores, or hyphens."
            );
        }
        int horizontalRadius = clamp(
            requestedHorizontalRadius,
            1,
            MAX_HORIZONTAL_RADIUS
        );
        int verticalRadius = clamp(
            requestedVerticalRadius,
            1,
            MAX_VERTICAL_RADIUS
        );
        int blockCount = volume(horizontalRadius, verticalRadius);
        if (blockCount > MAX_BLOCKS) {
            return new Operation(
                false,
                "Checkpoint region exceeds the bounded in-memory block limit."
            );
        }
        long existingForPlayer = CHECKPOINTS.values().stream()
            .filter(checkpoint -> checkpoint.playerId().equals(player.getUUID()))
            .filter(checkpoint -> !checkpoint.name().equals(name))
            .count();
        if (existingForPlayer >= MAX_CHECKPOINTS_PER_PLAYER) {
            return new Operation(
                false,
                "Discard or restore an existing checkpoint before capturing another."
            );
        }
        ServerLevel level = (ServerLevel) player.level();
        BlockPos center = player.blockPosition().immutable();
        Map<BlockPos, BlockState> states = new LinkedHashMap<>(blockCount);
        int blockEntityPositions = 0;
        for (int dx = -horizontalRadius; dx <= horizontalRadius; dx++) {
            for (int dz = -horizontalRadius; dz <= horizontalRadius; dz++) {
                for (int dy = -verticalRadius; dy <= verticalRadius; dy++) {
                    BlockPos position = center.offset(dx, dy, dz).immutable();
                    BlockState state = level.getBlockState(position);
                    states.put(position, state);
                    if (state.hasBlockEntity()) blockEntityPositions++;
                }
            }
        }
        CHECKPOINTS.put(
            key(player.getUUID(), name),
            new Checkpoint(
                player.getUUID(),
                name,
                level.dimension(),
                center,
                horizontalRadius,
                verticalRadius,
                Map.copyOf(states),
                blockEntityPositions,
                level.getGameTime() + TTL_TICKS
            )
        );
        return new Operation(
            true,
            "Captured checkpoint '" + name + "' with " + blockCount +
            " blocks around " + coordinates(center) + "; " +
            blockEntityPositions +
            " block-entity positions will be skipped during restore."
        );
    }

    static Operation restore(ServerPlayer player, String requestedName) {
        String name = normalizedName(requestedName);
        if (name == null) return new Operation(false, "Checkpoint name is invalid.");
        String key = key(player.getUUID(), name);
        Checkpoint checkpoint = CHECKPOINTS.get(key);
        if (checkpoint == null) {
            return new Operation(false, "Checkpoint '" + name + "' is unavailable or expired.");
        }
        ServerLevel level = (ServerLevel) player.level();
        if (!checkpoint.dimension().equals(level.dimension())) {
            return new Operation(false, "Checkpoint belongs to a different Minecraft dimension.");
        }
        if (level.getGameTime() >= checkpoint.expiresAtTick()) {
            CHECKPOINTS.remove(key);
            return new Operation(false, "Checkpoint '" + name + "' expired before restore.");
        }
        int restored = 0;
        int unchanged = 0;
        int skippedBlockEntities = 0;
        for (Map.Entry<BlockPos, BlockState> entry : checkpoint.states().entrySet()) {
            BlockState current = level.getBlockState(entry.getKey());
            BlockState original = entry.getValue();
            if (current.hasBlockEntity() || original.hasBlockEntity()) {
                skippedBlockEntities++;
                continue;
            }
            if (current.equals(original)) {
                unchanged++;
                continue;
            }
            if (level.setBlock(entry.getKey(), original, 3)) restored++;
        }
        CHECKPOINTS.remove(key);
        return new Operation(
            true,
            "Restored checkpoint '" + name + "': " + restored +
            " blocks changed, " + unchanged + " already matched, " +
            skippedBlockEntities + " block-entity positions skipped."
        );
    }

    static Operation discard(ServerPlayer player, String requestedName) {
        String name = normalizedName(requestedName);
        if (name == null) return new Operation(false, "Checkpoint name is invalid.");
        boolean removed = CHECKPOINTS.remove(key(player.getUUID(), name)) != null;
        return new Operation(
            removed,
            removed
                ? "Discarded checkpoint '" + name + "'."
                : "Checkpoint '" + name + "' was not active."
        );
    }

    static Operation status(ServerPlayer player) {
        long count = CHECKPOINTS.values().stream()
            .filter(checkpoint -> checkpoint.playerId().equals(player.getUUID()))
            .count();
        return new Operation(
            true,
            "Active in-memory region checkpoints for " +
            player.getGameProfile().getName() + ": " + count + "."
        );
    }

    static void tick(ServerLevel level) {
        long now = level.getGameTime();
        CHECKPOINTS.entrySet().removeIf(entry ->
            entry.getValue().dimension().equals(level.dimension()) &&
            now >= entry.getValue().expiresAtTick()
        );
    }

    static void clear() {
        CHECKPOINTS.clear();
    }

    static int volume(int horizontalRadius, int verticalRadius) {
        int width = horizontalRadius * 2 + 1;
        int height = verticalRadius * 2 + 1;
        return width * width * height;
    }

    private static String normalizedName(String value) {
        String name = value == null ? "" : value.trim().toLowerCase();
        return name.matches("[a-z0-9_-]{1,24}") ? name : null;
    }

    private static String key(UUID playerId, String name) {
        return playerId + ":" + name;
    }

    private static String coordinates(BlockPos position) {
        return position.getX() + "," + position.getY() + "," + position.getZ();
    }

    private static int clamp(int value, int minimum, int maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
}
