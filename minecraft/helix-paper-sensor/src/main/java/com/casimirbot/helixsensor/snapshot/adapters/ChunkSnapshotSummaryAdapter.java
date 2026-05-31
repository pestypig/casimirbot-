package com.casimirbot.helixsensor.snapshot.adapters;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Chunk;
import org.bukkit.ChunkSnapshot;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.entity.Player;

public final class ChunkSnapshotSummaryAdapter {
    private final HelixSensorConfig config;

    public ChunkSnapshotSummaryAdapter(HelixSensorConfig config) {
        this.config = config;
    }

    public Map<String, Object> build(Player player) {
        if (!config.snapshotOptions().includeChunkSnapshotSummary()) return Map.of();
        Location origin = player.getLocation();
        World world = player.getWorld();
        int radius = config.snapshotOptions().chunkSnapshotRadiusChunks();
        int maxCells = config.snapshotOptions().maxChunkSnapshotCells();
        int centerChunkX = origin.getBlockX() >> 4;
        int centerChunkZ = origin.getBlockZ() >> 4;
        List<Map<String, Object>> cells = new ArrayList<>();
        int loadedChunks = 0;

        for (int chunkX = centerChunkX - radius; chunkX <= centerChunkX + radius && cells.size() < maxCells; chunkX++) {
            for (int chunkZ = centerChunkZ - radius; chunkZ <= centerChunkZ + radius && cells.size() < maxCells; chunkZ++) {
                if (!world.isChunkLoaded(chunkX, chunkZ)) continue;
                loadedChunks++;
                Chunk chunk = world.getChunkAt(chunkX, chunkZ);
                ChunkSnapshot snapshot = chunk.getChunkSnapshot();
                addSurfaceCells(world, snapshot, chunkX, chunkZ, cells, maxCells);
            }
        }

        return Map.of(
            "sensor_scope", "sensor_observable",
            "sampled_radius_chunks", radius,
            "loaded_chunks_sampled", loadedChunks,
            "surface_cells", cells,
            "map_hash", SectionHasher.hash(cells),
            "changed_since_last_snapshot", true,
            "evidence_trust", "server_observation",
            "instruction_authority", "none",
            "ask_context_policy", "evidence_only",
            "raw_chunk_included", false
        );
    }

    private void addSurfaceCells(
        World world,
        ChunkSnapshot snapshot,
        int chunkX,
        int chunkZ,
        List<Map<String, Object>> cells,
        int maxCells
    ) {
        int minY = world.getMinHeight();
        int maxY = world.getMaxHeight() - 1;
        for (int localX = 0; localX < 16 && cells.size() < maxCells; localX += 4) {
            for (int localZ = 0; localZ < 16 && cells.size() < maxCells; localZ += 4) {
                int y = Math.max(minY, Math.min(snapshot.getHighestBlockYAt(localX, localZ), maxY));
                Material surface = snapshot.getBlockType(localX, y, localZ);
                Material above = y < maxY ? snapshot.getBlockType(localX, y + 1, localZ) : Material.AIR;
                Material below = y > world.getMinHeight() ? snapshot.getBlockType(localX, y - 1, localZ) : Material.AIR;
                Map<String, Object> cell = surfaceCell(world, chunkX, chunkZ, localX, y, localZ, surface, above, below);
                if (!cell.isEmpty()) cells.add(cell);
            }
        }
    }

    private Map<String, Object> surfaceCell(
        World world,
        int chunkX,
        int chunkZ,
        int localX,
        int y,
        int localZ,
        Material surface,
        Material above,
        Material below
    ) {
        int x = chunkX * 16 + localX;
        int z = chunkZ * 16 + localZ;
        boolean walkable = surface.isSolid() && passable(above);
        boolean lava = surface == Material.LAVA || above == Material.LAVA;
        boolean water = surface == Material.WATER || above == Material.WATER;
        boolean portal = isPortal(surface) || isPortal(above);
        boolean bridgeLike = walkable && (below.isAir() || !below.isSolid());
        boolean voidEdge = surface.isAir() && below.isAir();

        List<String> tags = new ArrayList<>();
        tags.add("chunk_surface_sample");
        if (walkable) {
            tags.add("walkable");
            tags.add("traversable");
        }
        if (bridgeLike) tags.add("bridge_like");
        if (voidEdge) tags.add("void_or_drop_risk");
        if (lava) tags.add("hazard_lava");
        if (water) tags.add("water");
        if (portal) tags.add("portal_or_gateway");

        if (!walkable && !bridgeLike && !voidEdge && !lava && !water && !portal) return Map.of();

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("walkable", walkable);
        state.put("bridge_like", bridgeLike);
        state.put("void_or_drop_risk", voidEdge);
        state.put("surface_type", AdapterUtil.materialKey(surface));
        state.put("above_type", AdapterUtil.materialKey(above));
        state.put("below_type", AdapterUtil.materialKey(below));

        Map<String, Object> cell = new LinkedHashMap<>();
        cell.put("cell_ref", "chunk_cell:" + world.getKey() + ":" + x + ":" + y + ":" + z);
        cell.put("cell_type", AdapterUtil.materialKey(surface));
        cell.put("position", Map.of("x", x, "y", y, "z", z));
        cell.put("tags", tags);
        cell.put("state", state);
        cell.put("sensor_scope", "sensor_observable");
        return cell;
    }

    private boolean passable(Material material) {
        return material.isAir() || !material.isSolid() || isPortal(material);
    }

    private boolean isPortal(Material material) {
        String key = material.getKey().toString();
        return key.contains("portal") || key.contains("gateway");
    }
}
