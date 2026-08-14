package com.casimirbot.helixplayer.fabric;

import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ControlBridge;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.HandObservation;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.MovementInput;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.PlayerSnapshot;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.TargetObservation;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowStep;
import com.casimirbot.helixplayer.fabric.mixin.ParticleAccessor;
import com.casimirbot.helixplayer.fabric.mixin.ParticleEngineAccessor;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.client.particle.Particle;
import net.minecraft.client.player.LocalPlayer;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.util.Mth;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.projectile.ProjectileUtil;
import net.minecraft.world.inventory.ClickType;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.phys.BlockHitResult;
import net.minecraft.world.level.ClipContext;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.EntityHitResult;
import net.minecraft.world.phys.HitResult;
import net.minecraft.world.phys.Vec3;
import net.minecraft.world.phys.AABB;

final class NativeFabricControlBridge implements ControlBridge {
    private static final int COMPACT_TRAJECTORY_HORIZON_TICKS = 10;

    private record LiveTrajectory(
        ShortHorizonTrajectoryPredictor.Forecast forecast,
        boolean applicable,
        String reason,
        int firstCollisionTick,
        BlockPos collisionPlacementTarget
    ) {}

    private final Minecraft minecraft;
    private MovementInput asserted = MovementInput.released();
    private boolean jumpPulsePending;
    private boolean usePulsePending;
    private boolean attackPulsePending;
    private Float controlledYaw;
    private Float controlledPitch;
    private final BaritoneFacade baritone;
    private final NativeFabricWorkflowEngine workflowEngine;
    private final FluidSequenceEngine fluidSequenceEngine;
    private final ConcurrentReactiveScheduler reactiveScheduler;
    private final ReactiveRuntime reactiveRuntime = new ReactiveRuntime();
    private final String targetReferenceSalt = UUID.randomUUID().toString();
    private final Map<String, Entity> trackingTargets = new HashMap<>();
    private final Map<String, ParticleTrack> trackingParticles = new HashMap<>();
    private long targetReferenceSequence;
    private Double cameraTrackingX;
    private Double cameraTrackingY;
    private Double cameraTrackingZ;
    private float cameraTrackingMaxRate;
    private float cameraTrackingMaxAcceleration;
    private float cameraTrackingDeadband;
    private PredictiveCameraTracker.State cameraTrackingState =
        PredictiveCameraTracker.State.initial();
    private long cameraTrackingLastFrameNanos;

    NativeFabricControlBridge(Minecraft minecraft) {
        this.minecraft = minecraft;
        this.baritone = BaritoneFacade.discover();
        this.workflowEngine = new NativeFabricWorkflowEngine(minecraft, this, baritone);
        this.fluidSequenceEngine = new FluidSequenceEngine(this);
        this.reactiveScheduler = new ConcurrentReactiveScheduler(reactiveRuntime);
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
    public TargetObservation observeTarget(
        Map<String, Object> target,
        String lockedTargetRef,
        String aimPoint,
        double maxDistance,
        boolean requireLineOfSight
    ) {
        LocalPlayer player = requirePlayer();
        if (minecraft.level == null) {
            return TargetObservation.unavailable(lockedTargetRef);
        }
        if (lockedTargetRef != null && !lockedTargetRef.isBlank()) {
            ParticleTrack particleTrack = trackingParticles.get(lockedTargetRef);
            return particleTrack == null
                ? observeEntityTarget(
                    player,
                    trackingTargets.get(lockedTargetRef),
                    lockedTargetRef,
                    aimPoint,
                    maxDistance,
                    requireLineOfSight
                )
                : observeParticleTarget(
                    player,
                    particleTrack,
                    lockedTargetRef,
                    maxDistance,
                    requireLineOfSight
                );
        }
        String targetKind = string(target.get("target_kind"));
        if ("particle_type".equals(targetKind)) {
            String particleTypeId = string(target.get("particle_type_id"));
            Particle particle = nearestParticle(player, particleTypeId, maxDistance);
            if (particle == null) return TargetObservation.unavailable(null);
            String targetRef = opaqueParticleTargetRef(particle, particleTypeId);
            String continuity = string(target.get("continuity"));
            ParticleTrack particleTrack = new ParticleTrack(
                particle,
                particleTypeId,
                "same_type_stream".equals(continuity),
                number(target.get("handoff_radius"), 0),
                integer(target.get("max_handoffs"), 0)
            );
            trackingParticles.put(targetRef, particleTrack);
            return observeParticleTarget(
                player,
                particleTrack,
                targetRef,
                maxDistance,
                requireLineOfSight
            );
        }
        Entity entity;
        if ("current_focus_entity".equals(targetKind)) {
            entity = minecraft.hitResult instanceof EntityHitResult entityHit
                ? entityHit.getEntity()
                : null;
        } else if ("entity_type".equals(targetKind)) {
            String entityTypeId = string(target.get("entity_type_id"));
            AABB bounds = player.getBoundingBox().inflate(maxDistance);
            entity = minecraft.level
                .getEntities(
                    player,
                    bounds,
                    candidate -> candidate.isAlive() &&
                        BuiltInRegistries.ENTITY_TYPE
                            .getKey(candidate.getType())
                            .toString()
                            .equals(entityTypeId)
                )
                .stream()
                .min(java.util.Comparator.comparingDouble(player::distanceToSqr))
                .orElse(null);
        } else {
            entity = null;
        }
        if (entity == null) return TargetObservation.unavailable(null);
        String targetRef = opaqueTargetRef(entity);
        trackingTargets.put(targetRef, entity);
        return observeEntityTarget(
            player,
            entity,
            targetRef,
            aimPoint,
            maxDistance,
            requireLineOfSight
        );
    }

    private TargetObservation observeEntityTarget(
        LocalPlayer player,
        Entity entity,
        String targetRef,
        String aimPoint,
        double maxDistance,
        boolean requireLineOfSight
    ) {
        if (
            entity == null || entity.isRemoved() || !entity.isAlive() ||
            entity.level() != minecraft.level ||
            player.distanceTo(entity) > maxDistance
        ) {
            return TargetObservation.unavailable(targetRef);
        }
        boolean visible = player.hasLineOfSight(entity);
        if (requireLineOfSight && !visible) {
            return TargetObservation.unavailable(targetRef);
        }
        double targetY = switch (aimPoint) {
            case "eyes" -> entity.getEyeY();
            case "feet" -> entity.getY();
            case "render_center" -> renderCenterY(entity);
            default -> entity.getBoundingBox().getCenter().y;
        };
        net.minecraft.world.phys.Vec3 velocity = entity.getDeltaMovement();
        return new TargetObservation(
            true,
            entity.isAlive(),
            visible,
            targetRef,
            BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()).toString(),
            entity.getX(),
            targetY,
            entity.getZ(),
            velocity.x,
            velocity.y,
            velocity.z,
            player.distanceTo(entity)
        );
    }

    /**
     * Return the visible vertical anchor for entity renderers whose motion is
     * distinct from their collision anchor. Minecraft renders a dropped item
     * with this sinusoidal hover translation; reproducing that transform here
     * lets the camera follow the visible model instead of merely following the
     * stationary ItemEntity position. Unsupported renderers deliberately fall
     * back to their logical center rather than inventing a visual transform.
     */
    private static double renderCenterY(Entity entity) {
        double logicalCenterY = entity.getBoundingBox().getCenter().y;
        if (entity instanceof ItemEntity item) {
            double hoverOffset = Math.sin(item.getAge() / 10.0 + item.bobOffs) * 0.1 + 0.1;
            return logicalCenterY + hoverOffset;
        }
        return logicalCenterY;
    }

    private Particle nearestParticle(
        LocalPlayer player,
        String particleTypeId,
        double maxDistance
    ) {
        Particle nearest = null;
        double nearestDistanceSquared = maxDistance * maxDistance;
        Map<?, java.util.Queue<Particle>> layers =
            ((ParticleEngineAccessor) minecraft.particleEngine).helix$getParticles();
        for (java.util.Queue<Particle> layer : layers.values()) {
            for (Particle particle : layer) {
                if (
                    !particle.isAlive() ||
                    !particleTypeId.equals(HelixParticleObservationRegistry.typeOf(particle))
                ) continue;
                ParticleAccessor position = (ParticleAccessor) particle;
                double dx = position.helix$getX() - player.getX();
                double dy = position.helix$getY() - player.getEyeY();
                double dz = position.helix$getZ() - player.getZ();
                double distanceSquared = dx * dx + dy * dy + dz * dz;
                if (distanceSquared <= nearestDistanceSquared) {
                    nearest = particle;
                    nearestDistanceSquared = distanceSquared;
                }
            }
        }
        return nearest;
    }

    private Particle nearestParticleForHandoff(
        LocalPlayer player,
        ParticleTrack track,
        double maxDistance
    ) {
        Particle nearest = null;
        double nearestDistanceSquared = track.handoffRadius * track.handoffRadius;
        double playerDistanceSquared = maxDistance * maxDistance;
        Map<?, java.util.Queue<Particle>> layers =
            ((ParticleEngineAccessor) minecraft.particleEngine).helix$getParticles();
        for (java.util.Queue<Particle> layer : layers.values()) {
            for (Particle candidate : layer) {
                if (
                    candidate == track.particle || !candidate.isAlive() ||
                    !track.particleTypeId.equals(
                        HelixParticleObservationRegistry.typeOf(candidate)
                    )
                ) continue;
                ParticleAccessor sample = (ParticleAccessor) candidate;
                double x = sample.helix$getX();
                double y = sample.helix$getY();
                double z = sample.helix$getZ();
                double fromLastX = x - track.lastX;
                double fromLastY = y - track.lastY;
                double fromLastZ = z - track.lastZ;
                double fromLastSquared =
                    fromLastX * fromLastX + fromLastY * fromLastY +
                    fromLastZ * fromLastZ;
                double fromPlayerX = x - player.getX();
                double fromPlayerY = y - player.getEyeY();
                double fromPlayerZ = z - player.getZ();
                double fromPlayerSquared =
                    fromPlayerX * fromPlayerX + fromPlayerY * fromPlayerY +
                    fromPlayerZ * fromPlayerZ;
                if (
                    fromLastSquared <= nearestDistanceSquared &&
                    fromPlayerSquared <= playerDistanceSquared
                ) {
                    nearest = candidate;
                    nearestDistanceSquared = fromLastSquared;
                }
            }
        }
        return nearest;
    }

    private TargetObservation observeParticleTarget(
        LocalPlayer player,
        ParticleTrack track,
        String targetRef,
        double maxDistance,
        boolean requireLineOfSight
    ) {
        Particle particle = track.particle;
        if (particle == null || !particle.isAlive()) {
            if (!track.stream || track.handoffs >= track.maxHandoffs) {
                return TargetObservation.unavailable(targetRef);
            }
            particle = nearestParticleForHandoff(player, track, maxDistance);
            if (particle == null) return TargetObservation.unavailable(targetRef);
            track.particle = particle;
            track.handoffs++;
        }
        String particleTypeId = HelixParticleObservationRegistry.typeOf(particle);
        if (
            particleTypeId.isBlank() ||
            !track.particleTypeId.equals(particleTypeId)
        ) return TargetObservation.unavailable(targetRef);
        ParticleAccessor sample = (ParticleAccessor) particle;
        Vec3 position = new Vec3(
            sample.helix$getX(),
            sample.helix$getY(),
            sample.helix$getZ()
        );
        track.lastX = position.x;
        track.lastY = position.y;
        track.lastZ = position.z;
        double distance = player.getEyePosition().distanceTo(position);
        if (distance > maxDistance) return TargetObservation.unavailable(targetRef);
        boolean visible = particleLineOfSight(player, position);
        if (requireLineOfSight && !visible) {
            return TargetObservation.unavailable(targetRef);
        }
        return new TargetObservation(
            true,
            true,
            visible,
            targetRef,
            particleTypeId,
            position.x,
            position.y,
            position.z,
            sample.helix$getVelocityX(),
            sample.helix$getVelocityY(),
            sample.helix$getVelocityZ(),
            distance,
            track.handoffs
        );
    }

    private static final class ParticleTrack {
        private Particle particle;
        private final String particleTypeId;
        private final boolean stream;
        private final double handoffRadius;
        private final int maxHandoffs;
        private int handoffs;
        private double lastX;
        private double lastY;
        private double lastZ;

        private ParticleTrack(
            Particle particle,
            String particleTypeId,
            boolean stream,
            double handoffRadius,
            int maxHandoffs
        ) {
            this.particle = particle;
            this.particleTypeId = particleTypeId;
            this.stream = stream;
            this.handoffRadius = handoffRadius;
            this.maxHandoffs = maxHandoffs;
            ParticleAccessor sample = (ParticleAccessor) particle;
            this.lastX = sample.helix$getX();
            this.lastY = sample.helix$getY();
            this.lastZ = sample.helix$getZ();
        }
    }

    private boolean particleLineOfSight(LocalPlayer player, Vec3 target) {
        Vec3 origin = player.getEyePosition();
        HitResult hit = minecraft.level.clip(new ClipContext(
            origin,
            target,
            ClipContext.Block.COLLIDER,
            ClipContext.Fluid.NONE,
            player
        ));
        return hit.getType() == HitResult.Type.MISS ||
            origin.distanceToSqr(hit.getLocation()) + 0.01 >=
                origin.distanceToSqr(target);
    }

    @Override
    public void updateCameraTrackingTarget(
        double x,
        double y,
        double z,
        float maxDegreesPerTick,
        float maxAccelerationDegreesPerTickSquared,
        float deadbandDegrees
    ) {
        cameraTrackingX = x;
        cameraTrackingY = y;
        cameraTrackingZ = z;
        cameraTrackingMaxRate = maxDegreesPerTick;
        cameraTrackingMaxAcceleration = maxAccelerationDegreesPerTickSquared;
        cameraTrackingDeadband = deadbandDegrees;
    }

    @Override
    public String renderCameraTrackingFrame(long frameNanos) {
        if (
            cameraTrackingX == null || cameraTrackingY == null ||
            cameraTrackingZ == null
        ) return null;
        LocalPlayer player = requirePlayer();
        String manualInput = manualInputReason(player);
        if (manualInput != null) return manualInput;
        if (cameraTrackingLastFrameNanos == 0) {
            cameraTrackingLastFrameNanos = frameNanos;
            return null;
        }
        double elapsedTicks = Math.max(
            0.001,
            Math.min(1.0, (frameNanos - cameraTrackingLastFrameNanos) / 50_000_000.0)
        );
        cameraTrackingLastFrameNanos = frameNanos;
        PredictiveCameraTracker.Step cameraStep =
            PredictiveCameraTracker.stepTowardPosition(
                player.getYRot(),
                player.getXRot(),
                player.getX(),
                player.getEyeY(),
                player.getZ(),
                cameraTrackingX,
                cameraTrackingY,
                cameraTrackingZ,
                cameraTrackingMaxRate,
                cameraTrackingMaxAcceleration,
                cameraTrackingDeadband,
                elapsedTicks,
                cameraTrackingState
            );
        cameraTrackingState = cameraStep.state();
        if (cameraStep.moved()) {
            player.setYRot(cameraStep.yaw());
            player.setXRot(cameraStep.pitch());
            controlledYaw = cameraStep.yaw();
            controlledPitch = cameraStep.pitch();
        }
        return null;
    }

    @Override
    public String renderReactiveProgramFrame(long frameNanos) {
        return reactiveScheduler.renderFrame(frameNanos);
    }

    @Override
    public void clearCameraTrackingTarget() {
        cameraTrackingX = null;
        cameraTrackingY = null;
        cameraTrackingZ = null;
        cameraTrackingState = PredictiveCameraTracker.State.initial();
        cameraTrackingLastFrameNanos = 0;
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
        if ("looked_at_entity".equals(target)) {
            EntityHitResult entityHit = currentEntityHit(player);
            if (entityHit == null) return false;
            InteractionResult result = minecraft.gameMode.interact(
                player,
                entityHit.getEntity(),
                hand
            );
            return result.consumesAction();
        }
        if ("looked_at_block".equals(target)) {
            if (!(minecraft.hitResult instanceof BlockHitResult blockHit)) return false;
            InteractionResult result = minecraft.gameMode.useItemOn(
                player,
                hand,
                blockHit
            );
            return result.consumesAction();
        }
        if ("current_focus".equals(target)) {
            if (minecraft.hitResult instanceof EntityHitResult entityHit) {
                return minecraft.gameMode.interact(
                    player,
                    entityHit.getEntity(),
                    hand
                ).consumesAction();
            }
            if (minecraft.hitResult instanceof BlockHitResult blockHit) {
                return minecraft.gameMode.useItemOn(player, hand, blockHit).consumesAction();
            }
            InteractionResult result = minecraft.gameMode.useItem(player, hand);
            return result.consumesAction();
        }
        return false;
    }

    /**
     * Recompute the entity under the current view when Minecraft's cached
     * hitResult has not caught up with a render-interpolated camera update.
     * The fallback uses the vanilla interaction range and stops at the first
     * blocking voxel, so it cannot select a merely nearby or occluded entity.
     */
    private EntityHitResult currentEntityHit(LocalPlayer player) {
        if (minecraft.hitResult instanceof EntityHitResult entityHit) {
            return entityHit;
        }
        double range = player.entityInteractionRange();
        Vec3 origin = player.getEyePosition();
        Vec3 direction = player.getViewVector(1.0F);
        Vec3 reach = direction.scale(range);
        Vec3 end = origin.add(reach);
        HitResult obstruction = minecraft.level.clip(new ClipContext(
            origin,
            end,
            ClipContext.Block.COLLIDER,
            ClipContext.Fluid.NONE,
            player
        ));
        double maximumDistanceSquared = obstruction.getType() == HitResult.Type.MISS
            ? range * range
            : origin.distanceToSqr(obstruction.getLocation());
        return ProjectileUtil.getEntityHitResult(
            player,
            origin,
            end,
            player.getBoundingBox().expandTowards(reach).inflate(1.0),
            candidate -> candidate != player &&
                !candidate.isSpectator() && candidate.isPickable(),
            maximumDistanceSquared
        );
    }

    @Override
    public HandObservation observeHand(String handName) {
        LocalPlayer player = minecraft.player;
        if (player == null) return HandObservation.unavailable();
        ItemStack stack = "off_hand".equals(handName)
            ? player.getOffhandItem()
            : player.getMainHandItem();
        if (stack.isEmpty()) return new HandObservation(true, "", 0);
        return new HandObservation(
            true,
            BuiltInRegistries.ITEM.getKey(stack.getItem()).toString(),
            stack.getCount()
        );
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
            NativeFabricInventoryControls.selectForMainHand(minecraft, player, sourceIndex);
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
        if ("track_target".equals(actionKind)) {
            trackingTargets.clear();
            trackingParticles.clear();
            clearCameraTrackingTarget();
        } else if ("execute_sequence".equals(actionKind)) {
            fluidSequenceEngine.begin(arguments);
        } else if ("execute_reactive_program".equals(actionKind)) {
            reactiveScheduler.begin(arguments);
        } else if (Set.of(
            "follow",
            "collect",
            "mine",
            "place",
            "craft",
            "inventory_transfer"
        ).contains(actionKind)) {
            workflowEngine.begin(actionKind, arguments, controlEngine);
        }
    }

    @Override
    public WorkflowStep runWorkflowStep(
        String actionKind,
        Map<String, Object> arguments,
        String controlEngine,
        long actionTicks
    ) {
        return switch (actionKind) {
            case "execute_sequence" -> fluidSequenceEngine.step(actionTicks);
            case "execute_reactive_program" -> reactiveScheduler.step(
                reactiveTickIndex(actionTicks)
            );
            default -> workflowEngine.step(actionKind, actionTicks);
        };
    }

    static long reactiveTickIndex(long actionTicks) {
        return Math.max(0, actionTicks - 1);
    }

    @Override
    public boolean evaluateFluidWorldCondition(Map<String, Object> condition) {
        LocalPlayer player = minecraft.player;
        if (player == null || minecraft.level == null) return false;
        Object kindValue = condition.get("condition_kind");
        if (!(kindValue instanceof String kind)) return false;
        Boolean playerCondition = ReactivePlayerConditionEvaluator.evaluate(
            condition,
            new ReactivePlayerConditionEvaluator.PlayerState(
                player.getHealth(),
                player.getFoodData().getFoodLevel(),
                player.onGround(),
                player.getX(),
                player.getY(),
                player.getZ()
            )
        );
        if (playerCondition != null) return playerCondition;
        return switch (kind) {
            case "inventory_count_at_least" -> {
                String itemId = string(condition.get("item_id"));
                int required = integer(condition.get("count"), Integer.MAX_VALUE);
                int count = 0;
                Inventory inventory = player.getInventory();
                for (int index = 0; index < inventory.getContainerSize(); index++) {
                    ItemStack stack = inventory.getItem(index);
                    if (matches(stack, itemId)) count += stack.getCount();
                }
                yield count >= required;
            }
            case "block_matches" -> {
                Map<String, Object> position = object(condition.get("position"));
                BlockPos blockPos = new BlockPos(
                    integer(position.get("x"), Integer.MIN_VALUE),
                    integer(position.get("y"), Integer.MIN_VALUE),
                    integer(position.get("z"), Integer.MIN_VALUE)
                );
                String actual = BuiltInRegistries.BLOCK.getKey(
                    minecraft.level.getBlockState(blockPos).getBlock()
                ).toString();
                yield actual.equals(string(condition.get("block_id")));
            }
            case "focus_kind_is" -> {
                HitResult hit = minecraft.hitResult;
                String actual = hit == null
                    ? "miss"
                    : hit.getType().name().toLowerCase(java.util.Locale.ROOT);
                yield actual.equals(string(condition.get("focus_kind")));
            }
            case "focus_reachable" -> {
                HitResult hit = minecraft.hitResult;
                double maximum = number(condition.get("max_distance"), -1);
                boolean reachable = hit != null && hit.getType() != HitResult.Type.MISS &&
                    player.getEyePosition().distanceTo(hit.getLocation()) <= maximum;
                yield reachable == bool(condition.get("expected"));
            }
            case "vertical_velocity_at_most" ->
                player.getDeltaMovement().y <= number(
                    condition.get("velocity_y"),
                    -Double.MAX_VALUE
                );
            case "predicted_collision_within" -> {
                int horizon = integer(condition.get("max_ticks"), 0);
                LiveTrajectory trajectory = liveTrajectory(player, horizon);
                boolean predicted = trajectory.applicable() &&
                    trajectory.firstCollisionTick() > 0 &&
                    trajectory.firstCollisionTick() <= horizon;
                yield predicted == bool(condition.get("expected"));
            }
            case "placement_reachable_within" -> {
                Map<String, Object> position = object(condition.get("position"));
                BlockPos target = new BlockPos(
                    integer(position.get("x"), Integer.MIN_VALUE),
                    integer(position.get("y"), Integer.MIN_VALUE),
                    integer(position.get("z"), Integer.MIN_VALUE)
                );
                Map<String, Object> forecast = placementForecast(
                    player,
                    target,
                    integer(condition.get("horizon_ticks"), 0)
                );
                yield bool(forecast.get("predicted_reachable")) ==
                    bool(condition.get("expected"));
            }
            case "dimension_is" -> player.level().dimension().location().toString()
                .equals(string(condition.get("dimension")));
            case "equipment_item_is" -> matches(
                player.getItemBySlot(equipmentSlot(string(condition.get("destination")))),
                string(condition.get("item_id"))
            );
            case "portal_nearby" -> portalNearby(
                player.blockPosition(),
                integer(condition.get("radius"), 0),
                string(condition.get("portal_kind"))
            ) == bool(condition.get("expected"));
            case "hazard_clear" -> hazardClear(
                player,
                integer(condition.get("radius"), 0),
                strings(condition.get("hazard_kinds"))
            );
            case "recipe_craftable" -> workflowEngine.isCraftable(
                string(condition.get("output_item_id"))
            ) == bool(condition.get("expected"));
            default -> false;
        };
    }

    @Override
    public Map<String, Object> compactFluidState() {
        LocalPlayer player = minecraft.player;
        if (player == null || minecraft.level == null) return Map.of();
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("state_schema", "helix.minecraft.player_fluid_state.v1");
        state.put("dimension", player.level().dimension().location().toString());
        state.put("food", player.getFoodData().getFoodLevel());
        state.put("saturation", player.getFoodData().getSaturationLevel());
        state.put(
            "trajectory_forecast",
            trajectoryEvidence(
                player,
                liveTrajectory(player, COMPACT_TRAJECTORY_HORIZON_TICKS)
            )
        );

        Map<String, Integer> inventoryCounts = new LinkedHashMap<>();
        Inventory inventory = player.getInventory();
        for (int index = 0; index < inventory.getContainerSize(); index++) {
            ItemStack stack = inventory.getItem(index);
            if (stack.isEmpty()) continue;
            String itemId = BuiltInRegistries.ITEM.getKey(stack.getItem()).toString();
            inventoryCounts.merge(itemId, stack.getCount(), Integer::sum);
        }
        state.put("inventory_counts", Map.copyOf(inventoryCounts));

        Map<String, String> equipment = new LinkedHashMap<>();
        for (String destination : List.of(
            "main_hand", "off_hand", "head", "chest", "legs", "feet"
        )) {
            ItemStack stack = player.getItemBySlot(equipmentSlot(destination));
            if (!stack.isEmpty()) {
                equipment.put(
                    destination,
                    BuiltInRegistries.ITEM.getKey(stack.getItem()).toString()
                );
            }
        }
        state.put("equipped_items", Map.copyOf(equipment));

        HitResult hit = minecraft.hitResult;
        Map<String, Object> focus = new LinkedHashMap<>();
        String focusKind = hit == null
            ? "miss"
            : hit.getType().name().toLowerCase(java.util.Locale.ROOT);
        focus.put("kind", focusKind);
        if (hit != null && hit.getType() != HitResult.Type.MISS) {
            double distance = player.getEyePosition().distanceTo(hit.getLocation());
            focus.put("distance", distance);
            focus.put("reachable", distance <= 6.0);
            if (hit instanceof BlockHitResult blockHit) {
                focus.put(
                    "target_id",
                    BuiltInRegistries.BLOCK.getKey(
                        minecraft.level.getBlockState(blockHit.getBlockPos()).getBlock()
                    ).toString()
                );
            } else if (hit instanceof EntityHitResult entityHit) {
                focus.put(
                    "target_id",
                    BuiltInRegistries.ENTITY_TYPE.getKey(entityHit.getEntity().getType()).toString()
                );
            }
        } else {
            focus.put("reachable", false);
        }
        state.put("focus", Map.copyOf(focus));

        state.put(
            "nearby_hazard_types",
            List.copyOf(detectedHazards(player, 6, Set.of(
                "lava", "fire", "magma", "cactus", "powder_snow", "hostile",
                "void_fall"
            )))
        );
        state.put(
            "nearby_portal_kinds",
            List.copyOf(nearbyPortalKinds(player.blockPosition(), 8))
        );
        boolean largeGrid = player.containerMenu instanceof net.minecraft.world.inventory.CraftingMenu;
        state.put("crafting_grid", largeGrid ? "3x3" : "2x2");
        state.put("raw_nbt_included", false);
        return Map.copyOf(state);
    }

    private LiveTrajectory liveTrajectory(LocalPlayer player, int horizonTicks) {
        if (horizonTicks < 1 ||
            horizonTicks > ShortHorizonTrajectoryPredictor.MAX_HORIZON_TICKS) {
            return new LiveTrajectory(null, false, "invalid_horizon", -1, null);
        }
        if (player.isInWater()) {
            return new LiveTrajectory(null, false, "water_physics_not_modeled", -1, null);
        }
        if (player.isInLava()) {
            return new LiveTrajectory(null, false, "lava_physics_not_modeled", -1, null);
        }
        if (player.isFallFlying()) {
            return new LiveTrajectory(null, false, "elytra_physics_not_modeled", -1, null);
        }
        if (player.getAbilities().flying) {
            return new LiveTrajectory(null, false, "flight_physics_not_modeled", -1, null);
        }
        Vec3 velocity = player.getDeltaMovement();
        ShortHorizonTrajectoryPredictor.Forecast forecast =
            ShortHorizonTrajectoryPredictor.predict(
                player.getX(),
                player.getY(),
                player.getZ(),
                velocity.x,
                velocity.y,
                velocity.z,
                horizonTicks
            );
        AABB start = player.getBoundingBox();
        int firstCollisionTick = -1;
        BlockPos collisionPlacementTarget = null;
        for (ShortHorizonTrajectoryPredictor.State state : forecast.states()) {
            if (state.tick() == 0) continue;
            AABB projected = start.move(
                state.x() - player.getX(),
                state.y() - player.getY(),
                state.z() - player.getZ()
            );
            if (!minecraft.level.noCollision(player, projected)) {
                firstCollisionTick = state.tick();
                collisionPlacementTarget = landingPlacementTarget(projected, state);
                break;
            }
        }
        return new LiveTrajectory(
            forecast,
            true,
            "airborne_vanilla_approximation",
            firstCollisionTick,
            collisionPlacementTarget
        );
    }

    /**
     * Resolve only the replaceable cell immediately above a measured downward
     * collision support. This is geometry, not rescue strategy: the authored
     * program still decides whether and when to request a placement binding.
     */
    private BlockPos landingPlacementTarget(
        AABB projected,
        ShortHorizonTrajectoryPredictor.State state
    ) {
        if (state.velocityY() >= 0 || minecraft.level == null) return null;
        int minimumX = Mth.floor(projected.minX + 1.0e-6);
        int maximumX = Mth.floor(projected.maxX - 1.0e-6);
        int minimumZ = Mth.floor(projected.minZ + 1.0e-6);
        int maximumZ = Mth.floor(projected.maxZ - 1.0e-6);
        int supportY = Mth.floor(projected.minY);
        BlockPos best = null;
        double bestHorizontalDistance = Double.POSITIVE_INFINITY;
        for (int y = supportY; y >= supportY - 1; y--) {
            for (int x = minimumX; x <= maximumX; x++) {
                for (int z = minimumZ; z <= maximumZ; z++) {
                    BlockPos support = new BlockPos(x, y, z);
                    BlockState supportState = minecraft.level.getBlockState(support);
                    if (
                        supportState.isAir() || supportState.canBeReplaced() ||
                        supportState.getCollisionShape(minecraft.level, support).isEmpty()
                    ) continue;
                    BlockPos target = support.above();
                    if (!minecraft.level.getBlockState(target).canBeReplaced()) continue;
                    double dx = target.getX() + 0.5 - state.x();
                    double dz = target.getZ() + 0.5 - state.z();
                    double horizontalDistance = dx * dx + dz * dz;
                    if (horizontalDistance < bestHorizontalDistance) {
                        best = target;
                        bestHorizontalDistance = horizontalDistance;
                    }
                }
            }
            if (best != null) return best;
        }
        return null;
    }

    private Map<String, Object> trajectoryEvidence(
        LocalPlayer player,
        LiveTrajectory trajectory
    ) {
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("model_schema", ShortHorizonTrajectoryPredictor.MODEL_SCHEMA);
        evidence.put("applicable", trajectory.applicable());
        evidence.put("reason", trajectory.reason());
        if (!trajectory.applicable() || trajectory.forecast() == null) {
            return Map.copyOf(evidence);
        }
        ShortHorizonTrajectoryPredictor.Forecast forecast = trajectory.forecast();
        ShortHorizonTrajectoryPredictor.State initial = forecast.states().get(0);
        ShortHorizonTrajectoryPredictor.State terminal = forecast.finalState();
        evidence.put("horizon_ticks", forecast.horizonTicks());
        evidence.put("initial_position", vector(initial.x(), initial.y(), initial.z()));
        evidence.put(
            "initial_velocity",
            vector(initial.velocityX(), initial.velocityY(), initial.velocityZ())
        );
        evidence.put("final_position", vector(terminal.x(), terminal.y(), terminal.z()));
        evidence.put(
            "final_velocity",
            vector(terminal.velocityX(), terminal.velocityY(), terminal.velocityZ())
        );
        evidence.put("collision_predicted", trajectory.firstCollisionTick() > 0);
        if (trajectory.firstCollisionTick() > 0) {
            evidence.put("first_collision_tick", trajectory.firstCollisionTick());
        }
        return Map.copyOf(evidence);
    }

    Map<String, Object> placementForecast(
        LocalPlayer player,
        BlockPos target,
        int horizonTicks
    ) {
        LiveTrajectory trajectory = liveTrajectory(player, horizonTicks);
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("model_schema", ShortHorizonTrajectoryPredictor.MODEL_SCHEMA);
        evidence.put("target_position", blockPosition(target));
        evidence.put("horizon_ticks", Math.max(0, horizonTicks));
        evidence.put("applicable", trajectory.applicable());
        evidence.put("reason", trajectory.reason());
        if (!trajectory.applicable() || trajectory.forecast() == null) {
            evidence.put("support_candidate_count", 0);
            evidence.put("predicted_reachable", false);
            return Map.copyOf(evidence);
        }

        List<Vec3> supportFaces = new java.util.ArrayList<>();
        for (Direction direction : Direction.values()) {
            BlockPos support = target.relative(direction);
            var supportState = minecraft.level.getBlockState(support);
            if (supportState.isAir() || supportState.canBeReplaced()) continue;
            supportFaces.add(NativeFabricWorkflowEngine.supportFaceHitLocation(
                support,
                direction.getOpposite()
            ));
        }
        int supportCount = supportFaces.size();
        ShortHorizonTrajectoryPredictor.PlacementForecast best = null;
        List<Vec3> candidates = supportFaces.isEmpty()
            ? List.of(Vec3.atCenterOf(target))
            : List.copyOf(supportFaces);
        for (Vec3 candidate : candidates) {
            ShortHorizonTrajectoryPredictor.PlacementForecast forecast =
                ShortHorizonTrajectoryPredictor.predictPlacementReach(
                    trajectory.forecast(),
                    player.getEyeHeight(),
                    candidate.x,
                    candidate.y,
                    candidate.z,
                    player.blockInteractionRange(),
                    supportCount
                );
            if (best == null ||
                (forecast.predictedReachable() && !best.predictedReachable()) ||
                (forecast.predictedReachable() == best.predictedReachable() &&
                    forecast.minimumPredictedDistance() < best.minimumPredictedDistance())) {
                best = forecast;
            }
        }
        evidence.put("support_candidate_count", supportCount);
        evidence.put("predicted_reachable", best != null && best.predictedReachable());
        if (best != null) {
            evidence.put("first_reachable_tick", best.firstReachableTick());
            evidence.put("initial_distance", best.initialDistance());
            evidence.put("minimum_predicted_distance", best.minimumPredictedDistance());
        }
        return Map.copyOf(evidence);
    }

    Map<String, Object> predictedCollisionPlacementForecast(
        LocalPlayer player,
        int horizonTicks,
        double maximumDistance,
        boolean requireReplaceable
    ) {
        LiveTrajectory trajectory = liveTrajectory(player, horizonTicks);
        Map<String, Object> evidence = new LinkedHashMap<>();
        evidence.put("model_schema", ShortHorizonTrajectoryPredictor.MODEL_SCHEMA);
        evidence.put("position_binding_kind", "predicted_collision_cell");
        evidence.put("horizon_ticks", horizonTicks);
        evidence.put("max_distance_blocks", maximumDistance);
        evidence.put("require_replaceable", requireReplaceable);
        evidence.put("actor_position_at_resolution", vector(
            player.getX(), player.getY(), player.getZ()
        ));
        evidence.put("applicable", trajectory.applicable());
        evidence.put("reason", trajectory.reason());
        BlockPos target = trajectory.collisionPlacementTarget();
        if (
            !trajectory.applicable() || trajectory.firstCollisionTick() < 1 ||
            target == null
        ) {
            evidence.put("support_candidate_count", 0);
            evidence.put("predicted_reachable", false);
            return Map.copyOf(evidence);
        }
        if (target.getY() >= Mth.floor(player.getY())) {
            evidence.put("support_candidate_count", 0);
            evidence.put("predicted_reachable", false);
            evidence.put("reason", "predicted_collision_cell_not_below_actor");
            return Map.copyOf(evidence);
        }
        evidence.put("first_collision_tick", trajectory.firstCollisionTick());
        evidence.put("target_position", blockPosition(target));
        double distance = Math.sqrt(
            Math.pow(target.getX() + 0.5 - player.getX(), 2) +
            Math.pow(target.getY() + 0.5 - player.getY(), 2) +
            Math.pow(target.getZ() + 0.5 - player.getZ(), 2)
        );
        evidence.put("resolved_distance_blocks", distance);
        if (distance > maximumDistance) {
            evidence.put("support_candidate_count", 0);
            evidence.put("predicted_reachable", false);
            evidence.put("reason", "predicted_collision_target_outside_binding_distance");
            return Map.copyOf(evidence);
        }
        if (requireReplaceable && !minecraft.level.getBlockState(target).canBeReplaced()) {
            evidence.put("support_candidate_count", 0);
            evidence.put("predicted_reachable", false);
            evidence.put("reason", "predicted_collision_target_not_replaceable");
            return Map.copyOf(evidence);
        }
        evidence.putAll(placementForecast(player, target, horizonTicks));
        evidence.put("position_binding_kind", "predicted_collision_cell");
        evidence.put("first_collision_tick", trajectory.firstCollisionTick());
        evidence.put("max_distance_blocks", maximumDistance);
        evidence.put("require_replaceable", requireReplaceable);
        evidence.put("actor_position_at_resolution", vector(
            player.getX(), player.getY(), player.getZ()
        ));
        evidence.put("resolved_distance_blocks", distance);
        return Map.copyOf(evidence);
    }

    private static Map<String, Object> vector(double x, double y, double z) {
        return Map.of("x", x, "y", y, "z", z);
    }

    private static Map<String, Object> blockPosition(BlockPos position) {
        return Map.of("x", position.getX(), "y", position.getY(), "z", position.getZ());
    }

    private boolean portalNearby(BlockPos center, int radius, String portalKind) {
        return nearbyPortalKinds(center, radius).contains(portalKind);
    }

    private Set<String> nearbyPortalKinds(BlockPos center, int radius) {
        if (radius < 1 || radius > 8) return Set.of();
        Set<String> kinds = new HashSet<>();
        for (BlockPos position : BlockPos.betweenClosed(
            center.offset(-radius, -radius, -radius),
            center.offset(radius, radius, radius)
        )) {
            String blockId = BuiltInRegistries.BLOCK.getKey(
                minecraft.level.getBlockState(position).getBlock()
            ).toString();
            switch (blockId) {
                case "minecraft:nether_portal" -> kinds.add("nether_portal");
                case "minecraft:end_portal", "minecraft:end_portal_frame" ->
                    kinds.add("end_portal");
                case "minecraft:end_gateway" -> kinds.add("end_gateway");
                default -> {}
            }
        }
        return Set.copyOf(kinds);
    }

    private boolean hazardClear(LocalPlayer player, int radius, Set<String> hazards) {
        return !hazards.isEmpty() && detectedHazards(player, radius, hazards).isEmpty();
    }

    private Set<String> detectedHazards(LocalPlayer player, int radius, Set<String> hazards) {
        if (radius < 1 || radius > 8 || hazards.isEmpty()) return Set.of("invalid_scope");
        Set<String> detected = new HashSet<>();
        if (hazards.contains("hostile")) {
            AABB bounds = player.getBoundingBox().inflate(radius);
            if (!minecraft.level.getEntitiesOfClass(Monster.class, bounds).isEmpty()) {
                detected.add("hostile");
            }
        }
        BlockPos center = player.blockPosition();
        if (hazards.contains("void_fall")) {
            boolean supportFound = false;
            for (int depth = 1; depth <= radius; depth++) {
                BlockPos below = center.below(depth);
                if (!minecraft.level.getBlockState(below).getCollisionShape(
                    minecraft.level,
                    below
                ).isEmpty()) {
                    supportFound = true;
                    break;
                }
            }
            if (!supportFound) detected.add("void_fall");
        }
        Set<String> hazardousBlocks = new HashSet<>();
        if (hazards.contains("lava")) hazardousBlocks.add("minecraft:lava");
        if (hazards.contains("fire")) {
            hazardousBlocks.add("minecraft:fire");
            hazardousBlocks.add("minecraft:soul_fire");
            hazardousBlocks.add("minecraft:campfire");
            hazardousBlocks.add("minecraft:soul_campfire");
        }
        if (hazards.contains("magma")) hazardousBlocks.add("minecraft:magma_block");
        if (hazards.contains("cactus")) hazardousBlocks.add("minecraft:cactus");
        if (hazards.contains("powder_snow")) hazardousBlocks.add("minecraft:powder_snow");
        if (hazardousBlocks.isEmpty()) return Set.copyOf(detected);
        for (BlockPos position : BlockPos.betweenClosed(
            center.offset(-radius, -radius, -radius),
            center.offset(radius, radius, radius)
        )) {
            String blockId = BuiltInRegistries.BLOCK.getKey(
                minecraft.level.getBlockState(position).getBlock()
            ).toString();
            if (!hazardousBlocks.contains(blockId)) continue;
            if ("minecraft:lava".equals(blockId)) detected.add("lava");
            else if ("minecraft:magma_block".equals(blockId)) detected.add("magma");
            else if ("minecraft:cactus".equals(blockId)) detected.add("cactus");
            else if ("minecraft:powder_snow".equals(blockId)) detected.add("powder_snow");
            else detected.add("fire");
        }
        return Set.copyOf(detected);
    }

    boolean baritoneAvailable() {
        return baritone.available();
    }

    String baritoneVersion() {
        return baritone.version();
    }

    @Override
    public void releaseAll() {
        reactiveScheduler.cancelAll("global_control_release");
        releaseResources(Set.of(
            "camera",
            "locomotion",
            "hotbar",
            "main_hand",
            "off_hand",
            "inventory",
            "world",
            "native_workflow",
            "safety"
        ));
    }

    @Override
    public void releaseResources(Set<String> resources) {
        if (resources.contains("native_workflow") || resources.contains("safety")) {
            workflowEngine.cancel();
        }
        if (resources.contains("locomotion") || resources.contains("safety")) {
            set(minecraft.options.keyUp, false);
            set(minecraft.options.keyDown, false);
            set(minecraft.options.keyLeft, false);
            set(minecraft.options.keyRight, false);
            set(minecraft.options.keyJump, false);
            set(minecraft.options.keySprint, false);
            asserted = MovementInput.released();
            jumpPulsePending = false;
        }
        if (
            resources.contains("main_hand") ||
            resources.contains("off_hand") ||
            resources.contains("safety")
        ) {
            set(minecraft.options.keyUse, false);
            set(minecraft.options.keyAttack, false);
            usePulsePending = false;
            attackPulsePending = false;
        }
        if (resources.contains("camera") || resources.contains("safety")) {
            controlledYaw = null;
            controlledPitch = null;
            clearCameraTrackingTarget();
        }
    }

    private final class ReactiveRuntime implements ConcurrentReactiveScheduler.Runtime {
        private final Map<String, ReactiveLaneAction> laneActions = new HashMap<>();

        @Override
        public boolean evaluateCondition(Map<String, Object> condition) {
            return evaluateFluidWorldCondition(condition);
        }

        @Override
        public ConcurrentReactiveScheduler.ActionStep stepAction(
            String laneId,
            Map<String, Object> action,
            int iteration,
            long actionTicks
        ) {
            ReactiveLaneAction laneAction = laneActions.get(laneId);
            if (
                laneAction == null || laneAction.iteration != iteration ||
                !laneAction.action.equals(action)
            ) {
                if (laneAction != null) laneAction.cancel("reactive_iteration_replaced");
                laneAction = new ReactiveLaneAction(laneId, action, iteration);
                laneActions.put(laneId, laneAction);
            }
            laneAction.controller.tick();
            return laneAction.step();
        }

        @Override
        public void cancelAction(String laneId, String reason) {
            ReactiveLaneAction laneAction = laneActions.remove(laneId);
            if (laneAction != null) laneAction.cancel(reason);
        }

        @Override
        public void releaseResources(String laneId, Set<String> resources) {
            NativeFabricControlBridge.this.releaseResources(resources);
        }

        @Override
        public String renderFrame(long frameNanos) {
            for (ReactiveLaneAction laneAction : List.copyOf(laneActions.values())) {
                laneAction.controller.renderFrame(frameNanos);
            }
            return null;
        }
    }

    private final class ReactiveLaneAction {
        private final int iteration;
        private final Map<String, Object> action;
        private final Set<String> resources;
        private final String workflowId;
        private final PlayerActionController controller;
        private PlayerActionWorkflow.WorkflowEvent latestEvent;
        private PlayerActionWorkflow.WorkflowEvent terminalEvent;

        private ReactiveLaneAction(
            String laneId,
            Map<String, Object> action,
            int iteration
        ) {
            this.iteration = iteration;
            this.action = Map.copyOf(action);
            this.resources = ConcurrentReactiveScheduler.resourcesFor(action);
            this.workflowId = "workflow:reactive:" + laneId + ":" + iteration;
            this.controller = new PlayerActionController(
                NativeFabricControlBridge.this,
                event -> {
                    latestEvent = event;
                    if (terminalWorkflowState(event.state())) terminalEvent = event;
                },
                () -> NativeFabricControlBridge.this.releaseResources(resources)
            );
            controller.start(new PlayerActionWorkflow.ActionRequest(
                "action_request:reactive:" + laneId + ":" + iteration,
                workflowId,
                string(action.get("action_kind")),
                this.action,
                36_000,
                PlayerActionWorkflow.ManualOverridePolicy.CANCEL,
                "native_fabric"
            ));
        }

        private ConcurrentReactiveScheduler.ActionStep step() {
            if (terminalEvent == null) {
                return latestEvent == null
                    ? ConcurrentReactiveScheduler.ActionStep.running(
                        "The typed lane action is still running."
                    )
                    : new ConcurrentReactiveScheduler.ActionStep(
                        ConcurrentReactiveScheduler.ActionStatus.RUNNING,
                        latestEvent.summary(),
                        latestEvent.measurements()
                    );
            }
            return terminalEvent.state() == PlayerActionWorkflow.State.SUCCEEDED
                ? new ConcurrentReactiveScheduler.ActionStep(
                    ConcurrentReactiveScheduler.ActionStatus.SUCCEEDED,
                    terminalEvent.summary(),
                    terminalEvent.measurements()
                )
                : new ConcurrentReactiveScheduler.ActionStep(
                    terminalEvent.state() == PlayerActionWorkflow.State.TIMED_OUT
                        ? ConcurrentReactiveScheduler.ActionStatus.TIMED_OUT
                        : ConcurrentReactiveScheduler.ActionStatus.FAILED,
                    terminalEvent.summary(),
                    terminalEvent.measurements()
                );
        }

        private void cancel(String reason) {
            controller.cancel(workflowId, reason);
        }
    }

    private static boolean terminalWorkflowState(PlayerActionWorkflow.State state) {
        return state == PlayerActionWorkflow.State.CANCELED ||
            state == PlayerActionWorkflow.State.SUCCEEDED ||
            state == PlayerActionWorkflow.State.FAILED ||
            state == PlayerActionWorkflow.State.TIMED_OUT ||
            state == PlayerActionWorkflow.State.EMERGENCY_STOPPED ||
            state == PlayerActionWorkflow.State.CONNECTOR_OFFLINE;
    }

    private String opaqueTargetRef(Entity entity) {
        return opaqueTargetRef("entity:" + entity.getUUID());
    }

    private String opaqueParticleTargetRef(Particle particle, String particleTypeId) {
        return opaqueTargetRef(
            "particle:" + particleTypeId + ":" +
                System.identityHashCode(particle) + ":" + targetReferenceSequence++
        );
    }

    private String opaqueTargetRef(String nativeSeed) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(
                (targetReferenceSalt + ":" + nativeSeed)
                    .getBytes(StandardCharsets.UTF_8)
            );
            return "target:" + java.util.HexFormat.of().formatHex(digest).substring(0, 40);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable.", impossible);
        }
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

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        return value instanceof Map<?, ?> map
            ? (Map<String, Object>) map
            : Map.of();
    }

    private static int integer(Object value, int fallback) {
        if (!(value instanceof Number number)) return fallback;
        double numeric = number.doubleValue();
        return Double.isFinite(numeric) && Math.rint(numeric) == numeric
            ? (int) numeric
            : fallback;
    }

    private static double number(Object value, double fallback) {
        return value instanceof Number number && Double.isFinite(number.doubleValue())
            ? number.doubleValue()
            : fallback;
    }

    private static boolean bool(Object value) {
        return value instanceof Boolean flag && flag;
    }

    private static Set<String> strings(Object value) {
        if (!(value instanceof List<?> list)) return Set.of();
        Set<String> values = new HashSet<>();
        for (Object candidate : list) {
            if (candidate instanceof String text && !text.isBlank()) values.add(text);
        }
        return Set.copyOf(values);
    }

    private static String string(Object value) {
        return value instanceof String text ? text : "";
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
