package com.casimirbot.helixsensor.snapshot;

import com.casimirbot.helixsensor.HelixSensorConfig;
import com.casimirbot.helixsensor.snapshot.adapters.ActorStateAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.AffordanceSummaryAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.ContainerStateAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.CropResourceAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.EntityStateAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.InventoryStateAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.LocalMapAdapter;
import com.casimirbot.helixsensor.snapshot.adapters.RayFocusAdapter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;

public final class EnvironmentSnapshotBuilder {
    private final HelixSensorConfig config;
    private final ActorStateAdapter actorStateAdapter = new ActorStateAdapter();
    private final InventoryStateAdapter inventoryStateAdapter;
    private final EntityStateAdapter entityStateAdapter;
    private final ContainerStateAdapter containerStateAdapter;
    private final CropResourceAdapter cropResourceAdapter;
    private final RayFocusAdapter rayFocusAdapter = new RayFocusAdapter();
    private final LocalMapAdapter localMapAdapter;
    private final AffordanceSummaryAdapter affordanceSummaryAdapter = new AffordanceSummaryAdapter();
    private final Map<String, Map<String, String>> previousHashesByActor = new LinkedHashMap<>();
    private int snapshotCounter = 0;

    public EnvironmentSnapshotBuilder(HelixSensorConfig config) {
        this.config = config;
        this.inventoryStateAdapter = new InventoryStateAdapter(config);
        this.entityStateAdapter = new EntityStateAdapter(config);
        this.containerStateAdapter = new ContainerStateAdapter(config);
        this.cropResourceAdapter = new CropResourceAdapter(config);
        this.localMapAdapter = new LocalMapAdapter(config);
    }

    public List<Map<String, Object>> buildForOnlinePlayers(boolean forceFullRefresh) {
        List<Map<String, Object>> snapshots = new ArrayList<>();
        String now = Instant.now().toString();
        snapshotCounter++;
        boolean fullRefresh = forceFullRefresh || snapshotCounter % 6 == 0;
        for (Player player : Bukkit.getOnlinePlayers()) {
            snapshots.add(buildForPlayer(player, now, fullRefresh));
        }
        if (snapshots.isEmpty()) snapshots.add(buildForSource(now, fullRefresh));
        return snapshots;
    }

    private Map<String, Object> buildForSource(String now, boolean fullRefresh) {
        Map<String, Object> actorState = Map.of(
            "sensor_scope", "sensor_observable",
            "active_player_count", Bukkit.getOnlinePlayers().size()
        );
        Map<String, Object> inventoryState = Map.of(
            "sensor_scope", "unknown",
            "carried_items", List.of(),
            "inventory_hash", SectionHasher.hash(List.of())
        );
        Map<String, Object> objectState = Map.of(
            "sensor_scope", "sensor_observable",
            "nearby_entities", List.of(),
            "nearby_containers", List.of(),
            "resources", List.of(),
            "hazards", List.of()
        );
        Map<String, Object> focus = Map.of("target_kind", "none", "sensor_scope", "unknown");
        Map<String, Object> localMap = Map.of("sensor_scope", "unknown", "cells", List.of());
        Map<String, Object> affordances = Map.of("sensor_scope", "sensor_observable", "summary", List.of("server source alive"));
        Map<String, Object> sections = new LinkedHashMap<>();
        sections.put("actor_state", actorState);
        sections.put("inventory_state", inventoryState);
        sections.put("object_state", objectState);
        sections.put("focus", focus);
        sections.put("local_map", localMap);
        sections.put("affordances", affordances);
        Map<String, String> hashes = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : sections.entrySet()) hashes.put(entry.getKey(), SectionHasher.hash(entry.getValue()));
        Map<String, String> previous = previousHashesByActor.getOrDefault("minecraft:server", Map.of());
        List<String> changed = hashes.entrySet().stream()
            .filter(entry -> !entry.getValue().equals(previous.get(entry.getKey())))
            .map(Map.Entry::getKey)
            .toList();
        previousHashesByActor.put("minecraft:server", hashes);
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("schema", "helix.environment_state_snapshot.v1");
        snapshot.put("snapshot_id", "snapshot:" + config.sourceId() + ":server:" + Bukkit.getCurrentTick());
        snapshot.put("domain", "minecraft");
        snapshot.put("domain_adapter", config.domainAdapter());
        snapshot.put("room_id", config.roomId());
        snapshot.put("world_id", config.worldId());
        snapshot.put("source_id", config.sourceId());
        snapshot.put("actor_id", "minecraft:server");
        snapshot.put("actor_label", "Minecraft server");
        snapshot.put("ts", now);
        snapshot.put("source_tick", Bukkit.getCurrentTick());
        snapshot.put("coordinate_frame", Map.of("kind", "world_xyz", "dimension", "minecraft:overworld", "units", "blocks"));
        putSection(snapshot, "actor_state", actorState, hashes, previous, fullRefresh);
        putSection(snapshot, "inventory_state", inventoryState, hashes, previous, fullRefresh);
        putSection(snapshot, "object_state", objectState, hashes, previous, fullRefresh);
        putSection(snapshot, "focus", focus, hashes, previous, fullRefresh);
        putSection(snapshot, "local_map", localMap, hashes, previous, fullRefresh);
        snapshot.put("affordances", fullRefresh || changed.contains("affordances")
            ? affordances
            : Map.of("unchanged", true, "hash", hashes.get("affordances"), "sensor_scope", "sensor_observable"));
        snapshot.put("section_hashes", hashes);
        snapshot.put("changed_sections", changed);
        snapshot.put("domain_specific", Map.of("minecraft", Map.of("raw_nbt_included", false)));
        snapshot.put("evidence_refs", List.of("minecraft:snapshot:server_tick:" + Bukkit.getCurrentTick()));
        snapshot.put("deterministic", true);
        snapshot.put("model_invoked", false);
        snapshot.put("assistant_answer", false);
        snapshot.put("raw_content_included", false);
        snapshot.put("raw_payload_included", false);
        snapshot.put("context_policy", "compact_context_pack_only");
        return PayloadLimiter.truncateSnapshot(snapshot, config.maxPayloadBytes());
    }

    private Map<String, Object> buildForPlayer(Player player, String now, boolean fullRefresh) {
        Map<String, Object> actorState = config.snapshotOptions().includeActorState() ? actorStateAdapter.build(player) : Map.of();
        Map<String, Object> inventoryState = config.snapshotOptions().includeInventoryState() ? inventoryStateAdapter.build(player) : Map.of();
        Map<String, Object> focus = config.snapshotOptions().includeFocus() ? rayFocusAdapter.build(player) : Map.of();
        List<Map<String, Object>> entities = entityStateAdapter.build(player);
        List<Map<String, Object>> containers = containerStateAdapter.build(player);
        List<Map<String, Object>> resources = cropResourceAdapter.build(player);
        Map<String, Object> localMap = localMapAdapter.build(player);
        Map<String, Object> affordances = affordanceSummaryAdapter.build(focus, containers, resources);
        Map<String, Object> objectState = new LinkedHashMap<>();
        objectState.put("sensor_scope", "sensor_observable");
        objectState.put("nearby_entities", entities);
        objectState.put("nearby_containers", containers);
        objectState.put("resources", resources);
        objectState.put("hazards", List.of());

        Map<String, Object> sections = new LinkedHashMap<>();
        sections.put("actor_state", actorState);
        sections.put("inventory_state", inventoryState);
        sections.put("object_state", objectState);
        sections.put("focus", focus);
        sections.put("local_map", localMap);
        sections.put("affordances", affordances);

        Map<String, String> hashes = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : sections.entrySet()) hashes.put(entry.getKey(), SectionHasher.hash(entry.getValue()));
        Map<String, String> previous = previousHashesByActor.getOrDefault(player.getUniqueId().toString(), Map.of());
        List<String> changed = hashes.entrySet().stream()
            .filter(entry -> !entry.getValue().equals(previous.get(entry.getKey())))
            .map(Map.Entry::getKey)
            .toList();
        previousHashesByActor.put(player.getUniqueId().toString(), hashes);

        Map<String, Object> snapshot = new LinkedHashMap<>();
        Location location = player.getLocation();
        snapshot.put("schema", "helix.environment_state_snapshot.v1");
        snapshot.put("snapshot_id", "snapshot:" + config.sourceId() + ":" + player.getUniqueId() + ":" + Bukkit.getCurrentTick());
        snapshot.put("domain", "minecraft");
        snapshot.put("domain_adapter", config.domainAdapter());
        snapshot.put("room_id", config.roomId());
        snapshot.put("world_id", config.worldId());
        snapshot.put("source_id", config.sourceId());
        snapshot.put("actor_id", "minecraft:player:" + player.getName());
        snapshot.put("actor_label", player.getName());
        snapshot.put("ts", now);
        snapshot.put("source_tick", Bukkit.getCurrentTick());
        snapshot.put("coordinate_frame", Map.of(
            "kind", "world_xyz",
            "dimension", player.getWorld().getKey().toString(),
            "units", "blocks"
        ));
        snapshot.put("location", Map.of(
            "dimension", player.getWorld().getKey().toString(),
            "x", location.getX(),
            "y", location.getY(),
            "z", location.getZ()
        ));
        putSection(snapshot, "actor_state", actorState, hashes, previous, fullRefresh);
        putSection(snapshot, "inventory_state", inventoryState, hashes, previous, fullRefresh);
        putSection(snapshot, "object_state", objectState, hashes, previous, fullRefresh);
        putSection(snapshot, "focus", focus, hashes, previous, fullRefresh);
        putSection(snapshot, "local_map", localMap, hashes, previous, fullRefresh);
        snapshot.put("affordances", fullRefresh || changed.contains("affordances")
            ? affordances
            : Map.of("unchanged", true, "hash", hashes.get("affordances"), "sensor_scope", "sensor_observable"));
        snapshot.put("section_hashes", hashes);
        snapshot.put("changed_sections", changed);
        snapshot.put("domain_specific", Map.of("minecraft", Map.of(
            "raw_nbt_included", false,
            "paper_api_fields_seen", List.of("Player", "Inventory", "World#getNearbyEntities", "World#rayTraceBlocks")
        )));
        snapshot.put("evidence_refs", List.of("minecraft:snapshot:server_tick:" + Bukkit.getCurrentTick()));
        snapshot.put("deterministic", true);
        snapshot.put("model_invoked", false);
        snapshot.put("assistant_answer", false);
        snapshot.put("raw_content_included", false);
        snapshot.put("raw_payload_included", false);
        snapshot.put("context_policy", "compact_context_pack_only");
        return PayloadLimiter.truncateSnapshot(snapshot, config.maxPayloadBytes());
    }

    private void putSection(
        Map<String, Object> snapshot,
        String key,
        Map<String, Object> value,
        Map<String, String> hashes,
        Map<String, String> previous,
        boolean fullRefresh
    ) {
        if (!config.sendOnlyChangedSections() || fullRefresh || !hashes.get(key).equals(previous.get(key))) {
            snapshot.put(key, value);
        } else {
            snapshot.put(key, Map.of("unchanged", true, "hash", hashes.get(key), "sensor_scope", value.getOrDefault("sensor_scope", "sensor_observable")));
        }
    }
}
