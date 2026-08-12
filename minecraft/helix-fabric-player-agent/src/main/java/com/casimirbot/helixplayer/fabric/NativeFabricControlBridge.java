package com.casimirbot.helixplayer.fabric;

import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ControlBridge;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.MovementInput;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.PlayerSnapshot;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowStep;
import java.util.Map;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.util.Mth;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.inventory.ClickType;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.phys.EntityHitResult;

final class NativeFabricControlBridge implements ControlBridge {
    private final Minecraft minecraft;
    private MovementInput asserted = MovementInput.released();
    private boolean jumpPulsePending;
    private boolean usePulsePending;
    private boolean attackPulsePending;
    private Float controlledYaw;
    private Float controlledPitch;
    private final BaritoneFacade baritone;
    private final NativeFabricWorkflowEngine workflowEngine;

    NativeFabricControlBridge(Minecraft minecraft) {
        this.minecraft = minecraft;
        this.baritone = BaritoneFacade.discover();
        this.workflowEngine = new NativeFabricWorkflowEngine(minecraft, this, baritone);
    }

    @Override
    public PlayerSnapshot snapshot() {
        releaseOneTickPulses();
        LocalPlayer player = minecraft.player;
        if (player == null || minecraft.level == null || minecraft.gameMode == null) {
            return new PlayerSnapshot(
                false,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                false,
                false,
                false,
                null
            );
        }
        String manualInputReason = manualInputReason(player);
        return new PlayerSnapshot(
            true,
            player.getX(),
            player.getY(),
            player.getEyeY(),
            player.getZ(),
            player.getYRot(),
            player.getXRot(),
            player.getHealth(),
            player.onGround(),
            player.horizontalCollision,
            manualInputReason != null,
            manualInputReason
        );
    }

    @Override
    public void applyMovement(MovementInput movement) {
        asserted = movement;
        set(minecraft.options.keyUp, movement.forward());
        set(minecraft.options.keyDown, movement.back());
        set(minecraft.options.keyLeft, movement.left());
        set(minecraft.options.keyRight, movement.right());
        set(minecraft.options.keyJump, movement.jump());
        set(minecraft.options.keySprint, movement.sprint());
    }

    @Override
    public void lookAt(double x, double y, double z, float maxDegreesPerTick) {
        LocalPlayer player = requirePlayer();
        double dx = x - player.getX();
        double dy = y - player.getEyeY();
        double dz = z - player.getZ();
        double horizontal = Math.sqrt(dx * dx + dz * dz);
        float targetYaw = (float) Math.toDegrees(Math.atan2(-dx, dz));
        float targetPitch = (float) -Math.toDegrees(Math.atan2(dy, horizontal));
        lookTo(targetYaw, targetPitch, maxDegreesPerTick);
    }

    @Override
    public void lookTo(float targetYaw, float targetPitch, float maxDegreesPerTick) {
        LocalPlayer player = requirePlayer();
        float yaw = approachAngle(player.getYRot(), targetYaw, maxDegreesPerTick);
        float pitch = Mth.clamp(
            approachAngle(player.getXRot(), targetPitch, maxDegreesPerTick),
            -90.0F,
            90.0F
        );
        player.setYRot(yaw);
        player.setXRot(pitch);
        controlledYaw = yaw;
        controlledPitch = pitch;
    }

    @Override
    public void pulseJump() {
        set(minecraft.options.keyJump, true);
        asserted = new MovementInput(
            asserted.forward(),
            asserted.back(),
            asserted.left(),
            asserted.right(),
            true,
            asserted.sprint()
        );
        jumpPulsePending = true;
    }

    @Override
    public boolean interact(String target, String handName, String interaction) {
        LocalPlayer player = requirePlayer();
        InteractionHand hand = "off_hand".equals(handName)
            ? InteractionHand.OFF_HAND
            : InteractionHand.MAIN_HAND;
        if (minecraft.hitResult instanceof EntityHitResult entityHit) {
            InteractionResult result = minecraft.gameMode.interact(
                player,
                entityHit.getEntity(),
                hand
            );
            pulse(minecraft.options.keyUse, true);
            return result.consumesAction();
        }
        if (minecraft.hitResult instanceof BlockHitResult blockHit) {
            InteractionResult result = minecraft.gameMode.useItemOn(
                player,
                hand,
                blockHit
            );
            pulse(minecraft.options.keyUse, true);
            return result.consumesAction();
        }
        if ("current_focus".equals(target)) {
            InteractionResult result = minecraft.gameMode.useItem(player, hand);
            pulse(minecraft.options.keyUse, true);
            return result.consumesAction();
        }
        return false;
    }

    @Override
    public boolean selectHotbar(int slot) {
        LocalPlayer player = minecraft.player;
        if (player == null || slot < 0 || slot >= Inventory.getSelectionSize()) return false;
        player.getInventory().setSelectedSlot(slot);
        return player.getInventory().getSelectedSlot() == slot;
    }

    @Override
    public boolean equip(String itemId, String destination) {
        LocalPlayer player = requirePlayer();
        EquipmentSlot destinationSlot = equipmentSlot(destination);
        if (matches(player.getItemBySlot(destinationSlot), itemId)) return true;

        Inventory inventory = player.getInventory();
        int sourceIndex = findUnequippedInventorySlot(inventory, itemId);
        if (sourceIndex < 0) return false;
        ItemStack stack = inventory.getItem(sourceIndex);

        if (destinationSlot == EquipmentSlot.MAINHAND) {
            if (sourceIndex < Inventory.getSelectionSize()) {
                inventory.setSelectedSlot(sourceIndex);
            } else {
                inventory.pickSlot(sourceIndex);
            }
            return matches(player.getMainHandItem(), itemId);
        }

        int sourceMenuSlot = sourceIndex < Inventory.getSelectionSize()
            ? 36 + sourceIndex
            : sourceIndex;
        if (destinationSlot == EquipmentSlot.OFFHAND) {
            minecraft.gameMode.handleInventoryMouseClick(
                player.inventoryMenu.containerId,
                sourceMenuSlot,
                40,
                ClickType.SWAP,
                player
            );
            return matches(player.getOffhandItem(), itemId);
        }

        if (player.getEquipmentSlotForItem(stack) != destinationSlot) return false;
        minecraft.gameMode.handleInventoryMouseClick(
            player.inventoryMenu.containerId,
            sourceMenuSlot,
            0,
            ClickType.QUICK_MOVE,
            player
        );
        return matches(player.getItemBySlot(destinationSlot), itemId);
    }

    @Override
    public boolean supportsControlEngine(String controlEngine) {
        return "native_fabric".equals(controlEngine) ||
            ("baritone".equals(controlEngine) && baritone.available());
    }

    @Override
    public void beginWorkflow(
        String actionKind,
        Map<String, Object> arguments,
        String controlEngine
    ) {
        workflowEngine.begin(actionKind, arguments, controlEngine);
    }

    @Override
    public WorkflowStep runWorkflowStep(
        String actionKind,
        Map<String, Object> arguments,
        String controlEngine,
        long actionTicks
    ) {
        return workflowEngine.step(actionKind, actionTicks);
    }

    boolean baritoneAvailable() {
        return baritone.available();
    }

    String baritoneVersion() {
        return baritone.version();
    }

    @Override
    public void releaseAll() {
        workflowEngine.cancel();
        set(minecraft.options.keyUp, false);
        set(minecraft.options.keyDown, false);
        set(minecraft.options.keyLeft, false);
        set(minecraft.options.keyRight, false);
        set(minecraft.options.keyJump, false);
        set(minecraft.options.keySprint, false);
        set(minecraft.options.keyUse, false);
        set(minecraft.options.keyAttack, false);
        asserted = MovementInput.released();
        jumpPulsePending = false;
        usePulsePending = false;
        attackPulsePending = false;
        controlledYaw = null;
        controlledPitch = null;
    }

    private LocalPlayer requirePlayer() {
        if (minecraft.player == null || minecraft.gameMode == null) {
            throw new IllegalStateException("The Minecraft player is not connected.");
        }
        return minecraft.player;
    }

    private boolean viewWasManuallyChanged(LocalPlayer player) {
        if (controlledYaw == null || controlledPitch == null) return false;
        boolean changed = Math.abs(Mth.wrapDegrees(player.getYRot() - controlledYaw)) > 4.0F ||
            Math.abs(player.getXRot() - controlledPitch) > 4.0F;
        controlledYaw = null;
        controlledPitch = null;
        return changed;
    }

    private String manualInputReason(LocalPlayer player) {
        if (minecraft.screen != null && !workflowEngine.screenAutomationAllowed()) {
            return "screen_open";
        }
        if (minecraft.mouseHandler.isLeftPressed()) return "left_mouse_pressed";
        if (minecraft.mouseHandler.isMiddlePressed()) return "middle_mouse_pressed";
        if (minecraft.mouseHandler.isRightPressed()) return "right_mouse_pressed";
        if (unexpectedDown(minecraft.options.keyUp, asserted.forward())) {
            return "forward_key_pressed";
        }
        if (unexpectedDown(minecraft.options.keyDown, asserted.back())) {
            return "back_key_pressed";
        }
        if (unexpectedDown(minecraft.options.keyLeft, asserted.left())) {
            return "left_key_pressed";
        }
        if (unexpectedDown(minecraft.options.keyRight, asserted.right())) {
            return "right_key_pressed";
        }
        if (unexpectedDown(minecraft.options.keyJump, asserted.jump())) {
            return "jump_key_pressed";
        }
        if (unexpectedDown(minecraft.options.keySprint, asserted.sprint())) {
            return "sprint_key_pressed";
        }
        return viewWasManuallyChanged(player) ? "unexpected_view_change" : null;
    }

    private void releaseOneTickPulses() {
        if (jumpPulsePending) {
            set(minecraft.options.keyJump, false);
            asserted = new MovementInput(
                asserted.forward(),
                asserted.back(),
                asserted.left(),
                asserted.right(),
                false,
                asserted.sprint()
            );
            jumpPulsePending = false;
        }
        if (usePulsePending) {
            set(minecraft.options.keyUse, false);
            usePulsePending = false;
        }
        if (attackPulsePending) {
            set(minecraft.options.keyAttack, false);
            attackPulsePending = false;
        }
    }

    private void pulse(KeyMapping key, boolean use) {
        set(key, true);
        if (use) usePulsePending = true;
        else attackPulsePending = true;
    }

    private static boolean unexpectedDown(KeyMapping key, boolean assertedByAgent) {
        return key.isDown() && !assertedByAgent;
    }

    private static void set(KeyMapping key, boolean down) {
        key.setDown(down);
    }

    private static float approachAngle(float current, float target, float maximum) {
        return current + Mth.clamp(Mth.wrapDegrees(target - current), -maximum, maximum);
    }

    private static int findUnequippedInventorySlot(Inventory inventory, String itemId) {
        for (int index = 0; index < 36; index++) {
            if (matches(inventory.getItem(index), itemId)) return index;
        }
        return -1;
    }

    private static boolean matches(ItemStack stack, String itemId) {
        return !stack.isEmpty() &&
            BuiltInRegistries.ITEM.getKey(stack.getItem()).toString().equals(itemId);
    }

    private static EquipmentSlot equipmentSlot(String destination) {
        return switch (destination) {
            case "main_hand" -> EquipmentSlot.MAINHAND;
            case "off_hand" -> EquipmentSlot.OFFHAND;
            case "head" -> EquipmentSlot.HEAD;
            case "chest" -> EquipmentSlot.CHEST;
            case "legs" -> EquipmentSlot.LEGS;
            case "feet" -> EquipmentSlot.FEET;
            default -> throw new IllegalArgumentException("Unsupported equipment destination.");
        };
    }
}
