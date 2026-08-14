package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.recipebook.RecipeCollection;
import net.minecraft.client.player.AbstractClientPlayer;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.StackedItemContents;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.ClickType;
import net.minecraft.world.inventory.CraftingMenu;
import net.minecraft.world.inventory.InventoryMenu;
import net.minecraft.world.inventory.Slot;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.crafting.display.RecipeDisplayEntry;
import net.minecraft.world.item.crafting.display.ShapedCraftingRecipeDisplay;
import net.minecraft.world.item.crafting.display.ShapelessCraftingRecipeDisplay;
import net.minecraft.world.item.crafting.display.SlotDisplayContext;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.Vec3;

/** Tick-sensitive mechanics for already-admitted goals. This class never samples a model. */
final class NativeFabricWorkflowEngine {
    private static final int NATIVE_BLOCK_SEARCH_RADIUS_CEILING = 32;
    private static final int MAX_EXACT_TRANSFER_PER_STEP = 64;

    private final Minecraft minecraft;
    private final NativeFabricControlBridge bridge;
    private final BaritoneFacade baritone;
    private String actionKind = "";
    private Map<String, Object> arguments = Map.of();
    private String controlEngine = "native_fabric";
    private int initialInventoryCount;
    private int completedCount;
    private int worldMutationCount;
    private int placeIndex;
    private int noTargetTicks;
    private int pendingTicks;
    private double initialDistance = -1;
    private BlockPos blockTarget;
    private boolean blockActionStarted;
    private boolean containerOpenRequested;
    private boolean inventoryActionIssued;
    private int inventoryCountBeforeIssued;
    private boolean baritoneGoalOwned;
    private Map<String, Object> latestPlacementForecast = Map.of();
    private Map<String, Object> dynamicPlacementBindingEvidence = Map.of();
    private BlockPos dynamicPlacementTarget;
    private int placementInventoryMutationCount;
    private HandObservation placementHandBefore = HandObservation.unavailable();
    private HandObservation placementHandAfter = HandObservation.unavailable();
    private final Set<Long> completedBlockTargets = new HashSet<>();

    NativeFabricWorkflowEngine(
        Minecraft minecraft,
        NativeFabricControlBridge bridge,
        BaritoneFacade baritone
    ) {
        this.minecraft = minecraft;
        this.bridge = bridge;
        this.baritone = baritone;
    }

    void begin(String actionKind, Map<String, Object> arguments, String controlEngine) {
        cancel();
        this.actionKind = actionKind;
        this.arguments = arguments;
        this.controlEngine = controlEngine;
        String countedItem = switch (actionKind) {
            case "collect" -> text(arguments, "item_or_block_id");
            case "craft" -> text(arguments, "output_item_id");
            case "inventory_transfer" -> text(arguments, "item_id");
            default -> "";
        };
        initialInventoryCount = countedItem.isBlank() ? 0 : inventoryCount(countedItem);
    }

    WorkflowStep step(String requestedKind, long actionTicks) {
        if (!requestedKind.equals(actionKind)) {
            return WorkflowStep.failed(
                "The active native workflow identity changed unexpectedly.",
                Map.of("requested_action_kind", requestedKind, "active_action_kind", actionKind)
            );
        }
        return switch (requestedKind) {
            case "navigate_to" -> baritoneNavigate(actionTicks);
            case "follow" -> follow(actionTicks);
            case "collect" -> collect(actionTicks);
            case "mine" -> mine(actionTicks);
            case "place" -> place(actionTicks);
            case "craft" -> craft(actionTicks);
            case "inventory_transfer" -> inventoryTransfer(actionTicks);
            default -> WorkflowStep.failed(
                "The client companion does not advertise action kind " + requestedKind + ".",
                Map.of("action_kind", requestedKind)
            );
        };
    }

    private WorkflowStep baritoneNavigate(long actionTicks) {
        if (!"baritone".equals(controlEngine) || !baritone.available()) {
            return WorkflowStep.failed(
                "The requested Baritone navigation engine is not installed in this client.",
                Map.of("control_engine", controlEngine, "engine_available", false)
            );
        }
        LocalPlayer player = requirePlayer();
        Map<String, Object> destination = object(arguments.get("destination"));
        double x = number(destination, "x");
        double y = number(destination, "y");
        double z = number(destination, "z");
        double radius = number(arguments, "arrival_radius");
        double distance = distance(player.getX(), player.getY(), player.getZ(), x, y, z);
        if (initialDistance < 0) initialDistance = distance;
        if (distance <= radius) {
            return WorkflowStep.succeeded(
                "Baritone reached the admitted destination radius.",
                Map.of("distance_blocks", distance, "arrival_radius", radius, "control_engine", "baritone")
            );
        }
        if (actionTicks == 1) {
            baritoneGoalOwned = baritone.start(floor(x), floor(y), floor(z));
            if (!baritoneGoalOwned) {
                return WorkflowStep.failed(
                    "Baritone was installed but rejected the admitted navigation goal.",
                    Map.of("control_engine", "baritone", "goal_started", false)
                );
            }
        }
        if (actionTicks > 20 && !baritone.isPathing()) {
            return WorkflowStep.failed(
                "Baritone stopped before the measured destination postcondition was satisfied.",
                Map.of("distance_blocks", distance, "arrival_radius", radius, "control_engine", "baritone")
            );
        }
        return WorkflowStep.running(
            progressFromDistance(distance, radius),
            "Baritone is navigating toward the admitted destination.",
            Map.of("distance_blocks", distance, "arrival_radius", radius, "control_engine", "baritone")
        );
    }

    private WorkflowStep follow(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String nativeId = text(arguments, "target_subject_native_id");
        AbstractClientPlayer target = findPlayer(nativeId);
        if (target == null) {
            return WorkflowStep.failed(
                "The exact followed player is not present in the current client world.",
                Map.of("target_present", false)
            );
        }
        double stopHealth = number(arguments, "stop_below_health");
        if (player.getHealth() < stopHealth) {
            return WorkflowStep.failed(
                "Following stopped because the paired player's measured health crossed the admitted floor.",
                Map.of("health", player.getHealth(), "stop_below_health", stopHealth)
            );
        }
        double desired = number(arguments, "distance");
        double current = player.distanceTo(target);
        long durationTicks = Math.max(20, integer(arguments, "max_duration_ms") / 50L);
        if (actionTicks >= durationTicks) {
            bridge.applyMovement(MovementInput.released());
            return WorkflowStep.succeeded(
                "The bounded follow interval completed with the target still observed.",
                Map.of(
                    "target_present", true,
                    "final_distance_blocks", current,
                    "requested_distance_blocks", desired,
                    "duration_ticks", actionTicks
                )
            );
        }
        if (current > desired) {
            navigateToward(target.getX(), target.getY(), target.getZ(), desired, true);
        } else {
            bridge.applyMovement(MovementInput.released());
            bridge.lookAt(target.getX(), target.getEyeY(), target.getZ(), 18.0F);
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) actionTicks / durationTicks),
            current > desired
                ? "The paired player is closing the admitted gap to the followed player."
                : "The paired player is maintaining the admitted follow distance.",
            Map.of(
                "target_present", true,
                "distance_blocks", current,
                "requested_distance_blocks", desired,
                "health", player.getHealth()
            )
        );
    }

    private WorkflowStep collect(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String itemId = text(arguments, "item_or_block_id");
        int requested = integer(arguments, "count");
        int now = inventoryCount(itemId);
        int collected = Math.max(0, now - initialInventoryCount);
        if (collected >= requested) {
            return WorkflowStep.succeeded(
                "The requested dropped items were collected and verified in the player inventory.",
                Map.of("item_id", itemId, "requested_count", requested, "collected_count", collected)
            );
        }
        double radius = number(arguments, "search_radius");
        AABB bounds = player.getBoundingBox().inflate(radius);
        ItemEntity target = minecraft.level.getEntitiesOfClass(
            ItemEntity.class,
            bounds,
            entity -> entity.isAlive() && matches(entity.getItem(), itemId)
        ).stream().min(Comparator.comparingDouble(player::distanceToSqr)).orElse(null);
        if (target == null) {
            bridge.applyMovement(MovementInput.released());
            noTargetTicks++;
            if (noTargetTicks > 40) {
                return WorkflowStep.failed(
                    "No matching dropped item remained in the loaded admitted search radius.",
                    Map.of("item_id", itemId, "collected_count", collected, "search_radius", radius)
                );
            }
        } else {
            noTargetTicks = 0;
            navigateToward(target.getX(), target.getY(), target.getZ(), 0.75, true);
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) collected / requested),
            target == null
                ? "The client is waiting briefly for a matching dropped item in loaded range."
                : "The paired player is moving toward a matching dropped item.",
            Map.of(
                "item_id", itemId,
                "requested_count", requested,
                "collected_count", collected,
                "target_present", target != null
            )
        );
    }

    private WorkflowStep mine(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String blockId = text(arguments, "block_id");
        int requested = integer(arguments, "count");
        int radius = integer(arguments, "search_radius");
        if (radius > NATIVE_BLOCK_SEARCH_RADIUS_CEILING) {
            return WorkflowStep.failed(
                "Native Fabric mining accepts a loaded search radius of at most 32 blocks; request a smaller radius or a declared pathing engine.",
                Map.of("requested_radius", radius, "native_radius_ceiling", NATIVE_BLOCK_SEARCH_RADIUS_CEILING)
            );
        }
        if (completedCount >= requested) {
            return WorkflowStep.succeeded(
                "The requested block removals were verified in the client world.",
                Map.of(
                    "block_id", blockId,
                    "requested_count", requested,
                    "removed_count", completedCount,
                    "world_mutations_performed", worldMutationCount
                )
            );
        }
        if (blockTarget != null && !blockMatches(blockTarget, blockId)) {
            completedBlockTargets.add(blockTarget.asLong());
            completedCount++;
            worldMutationCount++;
            blockTarget = null;
            blockActionStarted = false;
            minecraft.gameMode.stopDestroyBlock();
            if (completedCount >= requested) return mine(actionTicks);
        }
        if (blockTarget == null) {
            blockTarget = findNearestBlock(player.blockPosition(), blockId, radius);
            if (blockTarget == null) {
                return WorkflowStep.failed(
                    "No matching loaded block was found inside the admitted native mining radius.",
                    Map.of("block_id", blockId, "removed_count", completedCount, "search_radius", radius)
                );
            }
        }
        double distance = eyeDistance(player, blockTarget);
        if (distance > player.blockInteractionRange()) {
            navigateToward(blockTarget.getX() + 0.5, blockTarget.getY(), blockTarget.getZ() + 0.5, 3.5, false);
        } else {
            bridge.applyMovement(MovementInput.released());
            bridge.lookAt(blockTarget.getX() + 0.5, blockTarget.getY() + 0.5, blockTarget.getZ() + 0.5, 18.0F);
            if (!blockActionStarted) {
                blockActionStarted = minecraft.gameMode.startDestroyBlock(blockTarget, Direction.UP);
            } else {
                minecraft.gameMode.continueDestroyBlock(blockTarget, Direction.UP);
            }
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) completedCount / requested),
            distance > player.blockInteractionRange()
                ? "The paired player is moving within legitimate block interaction range."
                : "The client is mining the selected matching block through the normal game-mode controller.",
            Map.of(
                "block_id", blockId,
                "requested_count", requested,
                "removed_count", completedCount,
                "world_mutations_performed", worldMutationCount,
                "target_position", position(blockTarget),
                "target_distance_blocks", distance
            )
        );
    }

    private WorkflowStep place(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String blockId = text(arguments, "block_id");
        String placementMethod = text(arguments, "placement_method");
        if (placementMethod.isBlank()) placementMethod = "block_item";
        String sourceItemId = "item_use".equals(placementMethod)
            ? text(arguments, "source_item_id")
            : blockId;
        String handName = "item_use".equals(placementMethod)
            ? text(arguments, "hand")
            : "main_hand";
        Map<String, Object> positionBinding = optionalObject(
            arguments.get("position_binding")
        );
        List<BlockPos> positions;
        if (!positionBinding.isEmpty()) {
            if (!"predicted_collision_cell".equals(text(positionBinding, "binding_kind"))) {
                return WorkflowStep.failed(
                    "The requested placement binding kind is not supported by this client.",
                    Map.of("position_binding_kind", text(positionBinding, "binding_kind"))
                );
            }
            int horizonTicks = integer(positionBinding, "horizon_ticks");
            double maximumDistance = number(positionBinding, "max_distance_blocks");
            boolean requireReplaceable = bool(
                positionBinding,
                "require_replaceable"
            );
            if (dynamicPlacementTarget == null) {
                latestPlacementForecast = bridge.predictedCollisionPlacementForecast(
                    player,
                    horizonTicks,
                    maximumDistance,
                    requireReplaceable
                );
                Map<String, Object> resolved = optionalObject(
                    latestPlacementForecast.get("target_position")
                );
                if (
                    latestPlacementForecast.get("predicted_reachable") != Boolean.TRUE ||
                    resolved.isEmpty()
                ) {
                    return WorkflowStep.running(
                        0.0,
                        "The bounded placement binding is waiting for a reachable predicted collision cell.",
                        withPlacementForecast(Map.of(
                            "block_id", blockId,
                            "verified_positions", completedCount,
                            "requested_positions", 1,
                            "world_mutations_performed", worldMutationCount
                        ))
                    );
                }
                dynamicPlacementTarget = new BlockPos(
                    integer(resolved, "x"),
                    integer(resolved, "y"),
                    integer(resolved, "z")
                );
                dynamicPlacementBindingEvidence = latestPlacementForecast;
                if (!dynamicPlacementTargetAdmitted(dynamicPlacementTarget, blockId)) {
                    return WorkflowStep.failed(
                        "The resolved predicted collision cell is outside the admitted mutation scope.",
                        withPlacementForecast(Map.of(
                            "block_id", blockId,
                            "target_position", position(dynamicPlacementTarget),
                            "position_binding_kind", "predicted_collision_cell"
                        ))
                    );
                }
            }
            positions = List.of(dynamicPlacementTarget);
        } else {
            positions = positions(arguments.get("positions"));
        }
        while (placeIndex < positions.size() && blockMatches(positions.get(placeIndex), blockId)) {
            if (blockActionStarted) {
                placementHandAfter = bridge.observeHand(handName);
                if (handChanged(placementHandBefore, placementHandAfter)) {
                    placementInventoryMutationCount++;
                }
                worldMutationCount++;
            }
            placeIndex++;
            completedCount++;
            blockActionStarted = false;
            pendingTicks = 0;
        }
        if (placeIndex >= positions.size()) {
            return WorkflowStep.succeeded(
                "Every admitted placement position now matches the requested block.",
                withPlacementForecast(Map.of(
                    "block_id", blockId,
                    "verified_positions", completedCount,
                    "requested_positions", positions.size(),
                    "world_mutations_performed", worldMutationCount,
                    "inventory_mutations_performed", placementInventoryMutationCount
                ))
            );
        }
        BlockPos target = positions.get(placeIndex);
        latestPlacementForecast = dynamicPlacementTarget == null
            ? bridge.placementForecast(player, target, 10)
            : mergePlacementForecast(
                bridge.placementForecast(
                    player,
                    target,
                    integer(positionBinding, "horizon_ticks")
                ),
                dynamicPlacementBindingEvidence
            );
        BlockState existing = minecraft.level.getBlockState(target);
        if (!existing.canBeReplaced()) {
            return WorkflowStep.failed(
                "An admitted placement position is occupied by a different non-replaceable block.",
                withPlacementForecast(Map.of(
                    "block_id", blockId,
                    "target_position", position(target),
                    "existing_block", blockId(existing)
                ))
            );
        }
        HandObservation held = bridge.observeHand(handName);
        boolean sourceAvailable =
            (held.available() && sourceItemId.equals(held.itemId())) ||
            inventoryCount(sourceItemId) > 0;
        if (!sourceAvailable) {
            return WorkflowStep.failed(
                "The paired player does not hold the declared placement source item.",
                withPlacementForecast(Map.of(
                    "block_id", blockId,
                    "source_item_id", sourceItemId,
                    "remaining_positions", positions.size() - placeIndex
                ))
            );
        }
        double distance = placementInteractionDistance(player, target);
        if (!Double.isFinite(distance)) {
            return WorkflowStep.failed(
                "No valid support face exists for the declared placement target.",
                withPlacementForecast(Map.of(
                    "block_id", blockId,
                    "target_position", position(target)
                ))
            );
        }
        if (distance > player.blockInteractionRange()) {
            if (dynamicPlacementTarget != null && !player.onGround()) {
                // Gravity is already moving the player toward the predicted
                // collision cell. Adding horizontal navigation here changes
                // that prediction and can move the admitted target out from
                // under the player before a clutch is reachable.
                bridge.applyMovement(MovementInput.released());
            } else {
                navigateToward(
                    target.getX() + 0.5,
                    target.getY(),
                    target.getZ() + 0.5,
                    3.5,
                    false
                );
            }
        } else {
            bridge.applyMovement(MovementInput.released());
            bridge.lookAt(target.getX() + 0.5, target.getY() + 0.5, target.getZ() + 0.5, 18.0F);
            if (!blockActionStarted) {
                if (!bridge.equip(sourceItemId, handName)) {
                    return WorkflowStep.failed(
                        "The declared placement source item could not be equipped in the admitted hand.",
                        withPlacementForecast(Map.of(
                            "block_id", blockId,
                            "source_item_id", sourceItemId,
                            "hand", handName,
                            "target_position", position(target)
                        ))
                    );
                }
                placementHandBefore = bridge.observeHand(handName);
                blockActionStarted = usePlacementItem(
                    target,
                    handName,
                    placementMethod
                );
                if (!blockActionStarted) {
                    return WorkflowStep.failed(
                        "No valid support face accepted the declared placement item use.",
                        withPlacementForecast(Map.of(
                            "block_id", blockId,
                            "source_item_id", sourceItemId,
                            "hand", handName,
                            "target_position", position(target)
                        ))
                    );
                }
            }
            if (++pendingTicks > 20 && !blockMatches(target, blockId)) {
                return WorkflowStep.failed(
                    "The server did not confirm the requested block placement.",
                    withPlacementForecast(Map.of(
                        "block_id", blockId,
                        "target_position", position(target)
                    ))
                );
            }
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) placeIndex / positions.size()),
            distance > player.blockInteractionRange()
                ? "The paired player is moving within legitimate placement range."
                : "The client submitted one admitted block placement and is awaiting measured world state.",
            withPlacementForecast(Map.of(
                "block_id", blockId,
                "verified_positions", completedCount,
                "requested_positions", positions.size(),
                "world_mutations_performed", worldMutationCount,
                "inventory_mutations_performed", placementInventoryMutationCount,
                "target_position", position(target)
            ))
        );
    }

    private WorkflowStep craft(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String outputId = text(arguments, "output_item_id");
        int requested = integer(arguments, "count");
        int produced = Math.max(0, inventoryCount(outputId) - initialInventoryCount);
        if (produced >= requested) {
            return WorkflowStep.succeeded(
                "The requested crafted output was verified in the player inventory.",
                Map.of("output_item_id", outputId, "requested_count", requested, "produced_count", produced)
            );
        }
        Object exactRecipe = arguments.get("recipe_id");
        if (exactRecipe instanceof String recipe && !recipe.isBlank()) {
            return WorkflowStep.failed(
                "This client protocol cannot prove a resource-key recipe identity from the 1.21.8 display-only recipe book; retry with recipe_id null or add an exact recipe mapping.",
                Map.of("output_item_id", outputId, "exact_recipe_mapping_available", false)
            );
        }
        AbstractContainerMenu menu = player.containerMenu;
        if (!(menu instanceof InventoryMenu) && !(menu instanceof CraftingMenu)) {
            return WorkflowStep.failed(
                "Crafting requires the player inventory grid or an already-open crafting table.",
                Map.of("output_item_id", outputId, "crafting_menu_available", false)
            );
        }
        Slot resultSlot = menu.getSlot(0);
        if (matches(resultSlot.getItem(), outputId)) {
            minecraft.gameMode.handleInventoryMouseClick(
                menu.containerId,
                0,
                0,
                ClickType.QUICK_MOVE,
                player
            );
            pendingTicks = 0;
            return WorkflowStep.running(
                Math.min(0.99, (double) produced / requested),
                "The client took one server-presented crafting result and is verifying inventory state.",
                Map.of("output_item_id", outputId, "produced_count", produced, "result_slot_present", true)
            );
        }
        RecipeDisplayEntry recipe = findCraftableRecipe(player, outputId, menu instanceof CraftingMenu);
        if (recipe == null) {
            return WorkflowStep.failed(
                "No known recipe for the requested output is craftable from the current inventory and crafting grid.",
                Map.of("output_item_id", outputId, "produced_count", produced, "craftable_recipe_found", false)
            );
        }
        if (!inventoryActionIssued) {
            minecraft.gameMode.handlePlaceRecipe(menu.containerId, recipe.id(), false);
            inventoryActionIssued = true;
            pendingTicks = 0;
        } else if (++pendingTicks > 20) {
            return WorkflowStep.failed(
                "The server did not materialize the selected recipe result in the active crafting menu.",
                Map.of("output_item_id", outputId, "recipe_display_id", recipe.id().index())
            );
        }
        if (actionTicks % 5 == 0 && resultSlot.getItem().isEmpty()) {
            inventoryActionIssued = false;
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) produced / requested),
            "The client selected a craftable recipe and is awaiting the server-presented result slot.",
            Map.of(
                "output_item_id", outputId,
                "produced_count", produced,
                "recipe_display_id", recipe.id().index(),
                "crafting_table_menu", menu instanceof CraftingMenu
            )
        );
    }

    private WorkflowStep inventoryTransfer(long actionTicks) {
        LocalPlayer player = requirePlayer();
        String itemId = text(arguments, "item_id");
        String direction = text(arguments, "direction");
        int requested = integer(arguments, "count");
        int current = inventoryCount(itemId);
        int transferred = "deposit".equals(direction)
            ? Math.max(0, initialInventoryCount - current)
            : Math.max(0, current - initialInventoryCount);
        if (transferred >= requested) {
            return WorkflowStep.succeeded(
                "The exact requested inventory transfer was measured on the player side of the container.",
                Map.of("item_id", itemId, "direction", direction, "requested_count", requested, "transferred_count", transferred)
            );
        }
        if ("looked_at_container".equals(text(arguments, "container_target")) &&
            player.containerMenu == player.inventoryMenu && !containerOpenRequested) {
            containerOpenRequested = bridge.interact("looked_at_block", "main_hand", "interact");
            if (!containerOpenRequested) {
                return WorkflowStep.failed(
                    "The looked-at block did not accept a container interaction.",
                    Map.of("container_opened", false, "item_id", itemId)
                );
            }
            return WorkflowStep.running(
                null,
                "The client requested the looked-at container and is awaiting its server menu.",
                Map.of("container_open_requested", true, "item_id", itemId)
            );
        }
        AbstractContainerMenu menu = player.containerMenu;
        if (menu == player.inventoryMenu || menu instanceof CraftingMenu) {
            if (++pendingTicks > 20) {
                return WorkflowStep.failed(
                    "No transferable container menu became available.",
                    Map.of("container_open", false, "item_id", itemId)
                );
            }
            return WorkflowStep.running(
                null,
                "The client is waiting for the admitted container menu.",
                Map.of("container_open", false, "item_id", itemId)
            );
        }
        if (!inventoryActionIssued) {
            int remaining = requested - transferred;
            inventoryCountBeforeIssued = current;
            int moved = transferExact(menu, player, itemId, direction, remaining);
            if (moved < 1) {
                return WorkflowStep.failed(
                    "The active container could not accept or provide the requested item.",
                    Map.of("item_id", itemId, "direction", direction, "transferred_count", transferred)
                );
            }
            inventoryActionIssued = true;
            pendingTicks = 0;
        } else if (current != inventoryCountBeforeIssued) {
            inventoryActionIssued = false;
        } else if (++pendingTicks > 20) {
            return WorkflowStep.failed(
                "The server did not confirm the requested container transfer.",
                Map.of("item_id", itemId, "direction", direction, "transferred_count", transferred)
            );
        }
        return WorkflowStep.running(
            Math.min(0.99, (double) transferred / requested),
            "The client submitted a bounded inventory transfer and is verifying the player inventory delta.",
            Map.of("item_id", itemId, "direction", direction, "requested_count", requested, "transferred_count", transferred)
        );
    }

    private int transferExact(
        AbstractContainerMenu menu,
        LocalPlayer player,
        String itemId,
        String direction,
        int remaining
    ) {
        boolean deposit = "deposit".equals(direction);
        Inventory inventory = player.getInventory();
        int sourceIndex = -1;
        for (int index = 0; index < menu.slots.size(); index++) {
            Slot slot = menu.slots.get(index);
            boolean playerSlot = slot.container == inventory;
            if (sourceIndex < 0 && playerSlot == deposit && matches(slot.getItem(), itemId)) {
                sourceIndex = index;
            }
        }
        if (sourceIndex < 0) return 0;
        ItemStack source = menu.getSlot(sourceIndex).getItem();
        int destinationIndex = -1;
        for (int index = 0; index < menu.slots.size(); index++) {
            Slot slot = menu.slots.get(index);
            boolean playerSlot = slot.container == inventory;
            if (playerSlot != deposit && slot.mayPlace(source) &&
                (slot.getItem().isEmpty() || matches(slot.getItem(), itemId))) {
                destinationIndex = index;
                break;
            }
        }
        if (destinationIndex < 0) return 0;
        Slot destination = menu.getSlot(destinationIndex);
        int capacity = destination.getMaxStackSize(source) - destination.getItem().getCount();
        int count = Math.min(Math.min(remaining, source.getCount()), capacity);
        count = Math.min(count, MAX_EXACT_TRANSFER_PER_STEP);
        if (count < 1) return 0;
        if (count == source.getCount()) {
            minecraft.gameMode.handleInventoryMouseClick(
                menu.containerId,
                sourceIndex,
                0,
                ClickType.QUICK_MOVE,
                player
            );
            return count;
        }
        minecraft.gameMode.handleInventoryMouseClick(menu.containerId, sourceIndex, 0, ClickType.PICKUP, player);
        for (int index = 0; index < count; index++) {
            minecraft.gameMode.handleInventoryMouseClick(menu.containerId, destinationIndex, 1, ClickType.PICKUP, player);
        }
        minecraft.gameMode.handleInventoryMouseClick(menu.containerId, sourceIndex, 0, ClickType.PICKUP, player);
        return count;
    }

    private RecipeDisplayEntry findCraftableRecipe(
        LocalPlayer player,
        String outputId,
        boolean largeGrid
    ) {
        StackedItemContents contents = new StackedItemContents();
        player.getInventory().fillStackedContents(contents);
        for (RecipeCollection collection : player.getRecipeBook().getCollections()) {
            for (RecipeDisplayEntry entry : collection.getRecipes()) {
                if (!entry.canCraft(contents) || !recipeFits(entry, largeGrid)) continue;
                boolean matchesOutput = entry.resultItems(
                    SlotDisplayContext.fromLevel(minecraft.level)
                ).stream().anyMatch(stack -> matches(stack, outputId));
                if (matchesOutput) return entry;
            }
        }
        return null;
    }

    boolean isCraftable(String outputId) {
        LocalPlayer player = minecraft.player;
        if (player == null || minecraft.level == null) return false;
        AbstractContainerMenu menu = player.containerMenu;
        if (menu != player.inventoryMenu && !(menu instanceof CraftingMenu)) return false;
        return findCraftableRecipe(player, outputId, menu instanceof CraftingMenu) != null;
    }

    private static boolean recipeFits(RecipeDisplayEntry entry, boolean largeGrid) {
        if (largeGrid) return true;
        if (entry.display() instanceof ShapedCraftingRecipeDisplay shaped) {
            return shaped.width() <= 2 && shaped.height() <= 2;
        }
        if (entry.display() instanceof ShapelessCraftingRecipeDisplay shapeless) {
            return shapeless.ingredients().size() <= 4;
        }
        return false;
    }

    private boolean usePlacementItem(
        BlockPos target,
        String handName,
        String placementMethod
    ) {
        LocalPlayer player = requirePlayer();
        InteractionHand hand = "off_hand".equals(handName)
            ? InteractionHand.OFF_HAND
            : InteractionHand.MAIN_HAND;
        for (Direction direction : Direction.values()) {
            BlockPos support = target.relative(direction);
            BlockState supportState = minecraft.level.getBlockState(support);
            if (supportState.isAir() || supportState.canBeReplaced()) continue;
            Direction supportFace = direction.getOpposite();
            Vec3 hitLocation = supportFaceHitLocation(support, supportFace);
            BlockHitResult hit = new BlockHitResult(
                hitLocation,
                supportFace,
                support,
                false
            );
            if ("item_use".equals(placementMethod)) {
                bridge.lookAt(
                    hitLocation.x,
                    hitLocation.y,
                    hitLocation.z,
                    180.0F
                );
                // Bucket-like items implement Item.use and perform their own
                // vanilla POV block ray cast. The caller has already waited
                // for this exact support face to enter interaction range and
                // aligned the local view to it.
                InteractionResult result = minecraft.gameMode.useItem(player, hand);
                if (result.consumesAction()) return true;
                continue;
            }
            InteractionResult result = minecraft.gameMode.useItemOn(player, hand, hit);
            if (result.consumesAction()) return true;
        }
        return false;
    }

    private static boolean handChanged(
        HandObservation before,
        HandObservation after
    ) {
        return before.available() && after.available() &&
            (before.count() != after.count() || !before.itemId().equals(after.itemId()));
    }

    static Vec3 supportFaceHitLocation(BlockPos support, Direction supportFace) {
        return Vec3.atCenterOf(support).add(
            supportFace.getStepX() * 0.5,
            supportFace.getStepY() * 0.5,
            supportFace.getStepZ() * 0.5
        );
    }

    private double placementInteractionDistance(LocalPlayer player, BlockPos target) {
        double nearest = Double.POSITIVE_INFINITY;
        for (Direction direction : Direction.values()) {
            BlockPos support = target.relative(direction);
            BlockState supportState = minecraft.level.getBlockState(support);
            if (supportState.isAir() || supportState.canBeReplaced()) continue;
            Vec3 hitLocation = supportFaceHitLocation(
                support,
                direction.getOpposite()
            );
            nearest = Math.min(
                nearest,
                distance(
                    player.getX(),
                    player.getEyeY(),
                    player.getZ(),
                    hitLocation.x,
                    hitLocation.y,
                    hitLocation.z
                )
            );
        }
        return nearest;
    }

    private BlockPos findNearestBlock(BlockPos center, String blockId, int radius) {
        for (int shell = 0; shell <= radius; shell++) {
            BlockPos nearest = null;
            double nearestDistance = Double.POSITIVE_INFINITY;
            for (int dx = -shell; dx <= shell; dx++) {
                for (int dy = -shell; dy <= shell; dy++) {
                    for (int dz = -shell; dz <= shell; dz++) {
                        if (Math.max(Math.max(Math.abs(dx), Math.abs(dy)), Math.abs(dz)) != shell) continue;
                        BlockPos candidate = center.offset(dx, dy, dz);
                        if (completedBlockTargets.contains(candidate.asLong()) ||
                            !minecraft.level.hasChunkAt(candidate) ||
                            !blockMatches(candidate, blockId)) continue;
                        double distance = candidate.distSqr(center);
                        if (distance < nearestDistance) {
                            nearest = candidate.immutable();
                            nearestDistance = distance;
                        }
                    }
                }
            }
            if (nearest != null) return nearest;
        }
        return null;
    }

    private void navigateToward(
        double x,
        double y,
        double z,
        double arrivalRadius,
        boolean sprint
    ) {
        LocalPlayer player = requirePlayer();
        double current = distance(player.getX(), player.getY(), player.getZ(), x, y, z);
        if (current <= arrivalRadius) {
            bridge.applyMovement(MovementInput.released());
            return;
        }
        bridge.lookAt(x, y + 0.5, z, 18.0F);
        bridge.applyMovement(new MovementInput(
            true,
            false,
            false,
            false,
            player.horizontalCollision && player.onGround(),
            sprint
        ));
    }

    private AbstractClientPlayer findPlayer(String nativeId) {
        if (nativeId.isBlank() || minecraft.level == null) return null;
        UUID uuid = null;
        try {
            uuid = UUID.fromString(nativeId);
        } catch (IllegalArgumentException ignored) {}
        for (AbstractClientPlayer player : minecraft.level.players()) {
            if ((uuid != null && player.getUUID().equals(uuid)) ||
                player.getScoreboardName().equalsIgnoreCase(nativeId)) return player;
        }
        return null;
    }

    private int inventoryCount(String itemId) {
        LocalPlayer player = requirePlayer();
        int count = 0;
        for (int index = 0; index < player.getInventory().getContainerSize(); index++) {
            ItemStack stack = player.getInventory().getItem(index);
            if (matches(stack, itemId)) count += stack.getCount();
        }
        return count;
    }

    private static int findInventorySlot(Inventory inventory, String itemId) {
        for (int index = 0; index < inventory.getContainerSize(); index++) {
            if (matches(inventory.getItem(index), itemId)) return index;
        }
        return -1;
    }

    private boolean blockMatches(BlockPos position, String blockId) {
        return blockId(minecraft.level.getBlockState(position)).equals(blockId);
    }

    private static String blockId(BlockState state) {
        return BuiltInRegistries.BLOCK.getKey(state.getBlock()).toString();
    }

    private static boolean matches(ItemStack stack, String itemId) {
        return !stack.isEmpty() && BuiltInRegistries.ITEM.getKey(stack.getItem()).toString().equals(itemId);
    }

    private LocalPlayer requirePlayer() {
        if (minecraft.player == null || minecraft.level == null || minecraft.gameMode == null) {
            throw new IllegalStateException("The Minecraft player is not connected.");
        }
        return minecraft.player;
    }

    boolean screenAutomationAllowed() {
        return ownsScreen(actionKind);
    }

    static boolean ownsScreen(String actionKind) {
        return "craft".equals(actionKind) || "inventory_transfer".equals(actionKind);
    }

    void cancel() {
        boolean closeOwnedScreen = ownsScreen(actionKind);
        if (minecraft.gameMode != null && blockActionStarted) minecraft.gameMode.stopDestroyBlock();
        if (baritoneGoalOwned) baritone.cancel();
        if (closeOwnedScreen && minecraft.screen != null) minecraft.setScreen(null);
        actionKind = "";
        arguments = Map.of();
        controlEngine = "native_fabric";
        initialInventoryCount = 0;
        completedCount = 0;
        worldMutationCount = 0;
        placeIndex = 0;
        noTargetTicks = 0;
        pendingTicks = 0;
        initialDistance = -1;
        blockTarget = null;
        blockActionStarted = false;
        containerOpenRequested = false;
        inventoryActionIssued = false;
        inventoryCountBeforeIssued = 0;
        baritoneGoalOwned = false;
        latestPlacementForecast = Map.of();
        dynamicPlacementBindingEvidence = Map.of();
        dynamicPlacementTarget = null;
        placementInventoryMutationCount = 0;
        placementHandBefore = HandObservation.unavailable();
        placementHandAfter = HandObservation.unavailable();
        completedBlockTargets.clear();
    }

    BaritoneFacade baritone() {
        return baritone;
    }

    private double progressFromDistance(double distance, double radius) {
        double baseline = Math.max(radius + 0.01, initialDistance);
        return Math.max(0, Math.min(0.99, 1.0 - distance / baseline));
    }

    private static double eyeDistance(LocalPlayer player, BlockPos pos) {
        return distance(
            player.getX(),
            player.getEyeY(),
            player.getZ(),
            pos.getX() + 0.5,
            pos.getY() + 0.5,
            pos.getZ() + 0.5
        );
    }

    private static double distance(
        double x1,
        double y1,
        double z1,
        double x2,
        double y2,
        double z2
    ) {
        double dx = x2 - x1;
        double dy = y2 - y1;
        double dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private static int floor(double value) {
        return (int) Math.floor(value);
    }

    private static Map<String, Object> position(BlockPos position) {
        return Map.of("x", position.getX(), "y", position.getY(), "z", position.getZ());
    }

    private Map<String, Object> withPlacementForecast(Map<String, Object> measurements) {
        Map<String, Object> result = new LinkedHashMap<>(measurements);
        String placementMethod = text(arguments, "placement_method");
        if (placementMethod.isBlank()) placementMethod = "block_item";
        result.put("placement_method", placementMethod);
        result.put(
            "source_item_id",
            "item_use".equals(placementMethod)
                ? text(arguments, "source_item_id")
                : text(arguments, "block_id")
        );
        result.put(
            "hand",
            "item_use".equals(placementMethod)
                ? text(arguments, "hand")
                : "main_hand"
        );
        result.put(
            "inventory_mutations_performed",
            placementInventoryMutationCount
        );
        if (placementHandBefore.available()) {
            result.put("held_item_id_before", placementHandBefore.itemId());
            result.put("held_item_count_before", placementHandBefore.count());
        }
        if (placementHandAfter.available()) {
            result.put("held_item_id_after", placementHandAfter.itemId());
            result.put("held_item_count_after", placementHandAfter.count());
        }
        if (!latestPlacementForecast.isEmpty()) {
            result.put("placement_prediction", latestPlacementForecast);
        }
        return Map.copyOf(result);
    }

    private Map<String, Object> mergePlacementForecast(
        Map<String, Object> current,
        Map<String, Object> binding
    ) {
        Map<String, Object> result = new LinkedHashMap<>(current);
        for (String key : List.of(
            "position_binding_kind",
            "first_collision_tick",
            "max_distance_blocks",
            "require_replaceable",
            "actor_position_at_resolution",
            "resolved_distance_blocks"
        )) {
            Object value = binding.get(key);
            if (value != null) result.put(key, value);
        }
        return Map.copyOf(result);
    }

    private boolean dynamicPlacementTargetAdmitted(BlockPos target, String blockId) {
        Map<String, Object> scope = optionalObject(
            arguments.get("_helix_admitted_mutation_scope")
        );
        if (scope.isEmpty()) return true;
        if (!bool(scope, "world_mutation_allowed")) return false;
        List<String> allowedBlocks = strings(scope.get("allowed_block_ids"));
        if (!allowedBlocks.isEmpty() && !allowedBlocks.contains(blockId)) return false;
        List<Map<String, Object>> regions = objects(scope.get("allowed_regions"));
        if (regions.isEmpty()) return true;
        return regions.stream().anyMatch(region -> {
            Map<String, Object> minimum = optionalObject(region.get("min"));
            Map<String, Object> maximum = optionalObject(region.get("max"));
            return !minimum.isEmpty() && !maximum.isEmpty() &&
                target.getX() >= integer(minimum, "x") &&
                target.getX() <= integer(maximum, "x") &&
                target.getY() >= integer(minimum, "y") &&
                target.getY() <= integer(maximum, "y") &&
                target.getZ() >= integer(minimum, "z") &&
                target.getZ() <= integer(maximum, "z");
        });
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("The workflow arguments are incomplete.");
        }
        return (Map<String, Object>) map;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> optionalObject(Object value) {
        return value instanceof Map<?, ?> map
            ? (Map<String, Object>) map
            : Map.of();
    }

    private static List<Map<String, Object>> objects(Object value) {
        if (!(value instanceof List<?> values)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object entry : values) {
            Map<String, Object> record = optionalObject(entry);
            if (!record.isEmpty()) result.add(record);
        }
        return List.copyOf(result);
    }

    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> values)) return List.of();
        List<String> result = new ArrayList<>();
        for (Object entry : values) {
            if (entry instanceof String text && !text.isBlank()) result.add(text);
        }
        return List.copyOf(result);
    }

    private static List<BlockPos> positions(Object value) {
        if (!(value instanceof List<?> values)) {
            throw new IllegalArgumentException("Placement positions are required.");
        }
        List<BlockPos> positions = new ArrayList<>();
        for (Object entry : values) {
            Map<String, Object> position = object(entry);
            positions.add(new BlockPos(
                integer(position, "x"),
                integer(position, "y"),
                integer(position, "z")
            ));
        }
        return List.copyOf(positions);
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof String text ? text.trim() : "";
    }

    private static double number(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new IllegalArgumentException("The numeric workflow argument " + key + " is required.");
        }
        return number.doubleValue();
    }

    private static int integer(Map<String, Object> map, String key) {
        double value = number(map, key);
        if (Math.rint(value) != value) {
            throw new IllegalArgumentException("The workflow argument " + key + " must be an integer.");
        }
        return (int) value;
    }

    private static boolean bool(Map<String, Object> map, String key) {
        return map.get(key) == Boolean.TRUE;
    }
}
