package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Objects;

public final class PlayerActionController {
    private static final int INTERACTION_FOCUS_ACQUISITION_TICKS = 10;
    private final ControlBridge bridge;
    private final EventListener listener;
    private final Runnable releaseOwnedControls;
    private ActionRequest active;
    private State state;
    private long sequence;
    private long elapsedTicks;
    private long actionTicks;
    private int jumpPulses;
    private int confirmedJumps;
    private long lastJumpPulseTick;
    private double jumpStartY;
    private Double actionStartX;
    private Double actionStartY;
    private Double actionStartZ;
    private Float lookStartYaw;
    private Float lookStartPitch;
    private Float lookTargetYaw;
    private Float lookTargetPitch;
    private double navigationClosestDistance;
    private int navigationNoProgressTicks;
    private boolean oneShotAttempted;
    private int interactionAttemptCount;
    private HandObservation interactionHandBefore = HandObservation.unavailable();
    private String trackingTargetRef;
    private String trackingTargetTypeId;
    private long trackingSamples;
    private long trackingRetainedTicks;
    private long trackingLossTicks;
    private long trackingLineOfSightTicks;
    private long trackingReacquisitions;
    private long trackingParticleHandoffs;
    private int trackingConsecutiveLossTicks;
    private boolean trackingWasMissing;
    private double trackingErrorSum;
    private double trackingMaxError;
    private double trackingFinalYawError;
    private double trackingFinalPitchError;
    private long[] trackingErrorHistogram = new long[181];
    private Map<String, Object> lastMeasurements = Map.of();

    public PlayerActionController(ControlBridge bridge, EventListener listener) {
        this(bridge, listener, bridge::releaseAll);
    }

    PlayerActionController(
        ControlBridge bridge,
        EventListener listener,
        Runnable releaseOwnedControls
    ) {
        this.bridge = Objects.requireNonNull(bridge, "bridge");
        this.listener = Objects.requireNonNull(listener, "listener");
        this.releaseOwnedControls = Objects.requireNonNull(
            releaseOwnedControls,
            "releaseOwnedControls"
        );
    }

    public synchronized boolean start(ActionRequest request) {
        Objects.requireNonNull(request, "request");
        if (active != null && !terminal(state)) return false;
        active = request;
        state = State.RUNNING;
        sequence = 0;
        elapsedTicks = 0;
        actionTicks = 0;
        jumpPulses = 0;
        confirmedJumps = 0;
        lastJumpPulseTick = -1;
        jumpStartY = 0;
        actionStartX = null;
        actionStartY = null;
        actionStartZ = null;
        lookStartYaw = null;
        lookStartPitch = null;
        lookTargetYaw = null;
        lookTargetPitch = null;
        navigationClosestDistance = Double.POSITIVE_INFINITY;
        navigationNoProgressTicks = 0;
        oneShotAttempted = false;
        interactionAttemptCount = 0;
        interactionHandBefore = HandObservation.unavailable();
        trackingTargetRef = null;
        trackingTargetTypeId = null;
        trackingSamples = 0;
        trackingRetainedTicks = 0;
        trackingLossTicks = 0;
        trackingLineOfSightTicks = 0;
        trackingReacquisitions = 0;
        trackingParticleHandoffs = 0;
        trackingConsecutiveLossTicks = 0;
        trackingWasMissing = false;
        trackingErrorSum = 0;
        trackingMaxError = 0;
        trackingFinalYawError = 0;
        trackingFinalPitchError = 0;
        trackingErrorHistogram = new long[181];
        lastMeasurements = Map.of();
        bridge.beginWorkflow(request.actionKind(), request.arguments(), request.controlEngine());
        emit("workflow.started", 0.0, "The admitted player workflow started.", false, false);
        return true;
    }

    public synchronized void tick() {
        if (active == null || state != State.RUNNING) return;
        PlayerSnapshot snapshot = bridge.snapshot();
        if (!snapshot.connected()) {
            settle(
                State.CONNECTOR_OFFLINE,
                "workflow.failed",
                "The Minecraft client disconnected while the workflow was active."
            );
            return;
        }
        if (snapshot.manualInputDetected()) {
            handleManualOverride(snapshot.manualInputReason());
            return;
        }
        if (++elapsedTicks > active.maxDurationTicks()) {
            settle(
                State.TIMED_OUT,
                "workflow.timed_out",
                "The workflow reached its admitted duration ceiling."
            );
            return;
        }
        actionTicks++;
        try {
            runAction(snapshot);
        } catch (IllegalArgumentException error) {
            settle(State.FAILED, "workflow.failed", error.getMessage());
        } catch (RuntimeException error) {
            java.util.List<String> failureTrace = new java.util.ArrayList<>();
            for (StackTraceElement frame : error.getStackTrace()) {
                if (!frame.getClassName().startsWith("com.casimirbot.")) continue;
                failureTrace.add(frame.toString());
                if (failureTrace.size() >= 4) break;
            }
            String failureSite = error.getStackTrace().length > 0
                ? error.getStackTrace()[0].toString()
                : "unavailable";
            lastMeasurements = Map.of(
                "executor_failure_class",
                error.getClass().getSimpleName(),
                "executor_failure_site",
                failureSite,
                "executor_failure_trace",
                java.util.List.copyOf(failureTrace)
            );
            settle(
                State.FAILED,
                "workflow.failed",
                "The native Fabric executor could not complete the admitted action (" +
                    error.getClass().getSimpleName() + ")."
            );
        }
    }

    public synchronized boolean resume(String workflowId) {
        if (
            active == null ||
            state != State.PAUSED_MANUAL_OVERRIDE ||
            !active.workflowId().equals(workflowId)
        ) return false;
        state = State.RUNNING;
        emit("workflow.resumed", progress(), "The paused workflow resumed.", false, false);
        return true;
    }

    public synchronized void renderFrame(long frameNanos) {
        if (active == null || state != State.RUNNING) return;
        String manualInputReason = "track_target".equals(active.actionKind())
            ? bridge.renderCameraTrackingFrame(frameNanos)
            : "execute_reactive_program".equals(active.actionKind())
                ? bridge.renderReactiveProgramFrame(frameNanos)
                : null;
        if (manualInputReason != null && !manualInputReason.isBlank()) {
            handleManualOverride(manualInputReason);
        }
    }

    public synchronized boolean cancel(String workflowId, String reason) {
        if (active == null || terminal(state) || !active.workflowId().equals(workflowId)) {
            return false;
        }
        settle(
            State.CANCELED,
            "workflow.canceled",
            boundedReason(reason, "The workflow was canceled.")
        );
        return true;
    }

    public synchronized boolean emergencyStop(String reason) {
        releaseOwnedControls.run();
        if (active == null || terminal(state)) return false;
        settle(
            State.EMERGENCY_STOPPED,
            "workflow.emergency_stopped",
            boundedReason(reason, "Emergency stop released every client control.")
        );
        return true;
    }

    public synchronized boolean connectorOffline(String reason) {
        if (active == null || terminal(state)) return false;
        settle(
            State.CONNECTOR_OFFLINE,
            "workflow.failed",
            boundedReason(
                reason,
                "The Helix control plane became unreachable; the client released every control."
            )
        );
        return true;
    }

    public synchronized State state() {
        return state;
    }

    public synchronized String activeWorkflowId() {
        return active == null || terminal(state) ? null : active.workflowId();
    }

    private void runAction(PlayerSnapshot snapshot) {
        switch (active.actionKind()) {
            case "navigate_to" -> navigate(snapshot);
            case "look_at" -> lookAt(snapshot);
            case "track_target" -> trackTarget(snapshot);
            case "walk" -> walk(snapshot);
            case "jump" -> jump(snapshot);
            case "interact" -> interact();
            case "hotbar_select" -> selectHotbar();
            case "equip" -> equip();
            case "follow", "collect", "mine", "place", "craft", "inventory_transfer" ->
                reusableWorkflow();
            default -> reusableWorkflow();
        }
    }

    private void navigate(PlayerSnapshot snapshot) {
        if ("baritone".equals(active.controlEngine())) {
            reusableWorkflow();
            return;
        }
        Map<String, Object> destination = object(active.arguments().get("destination"));
        double x = number(destination, "x");
        double y = number(destination, "y");
        double z = number(destination, "z");
        double radius = number(active.arguments(), "arrival_radius");
        double dx = x - snapshot.x();
        double dy = y - snapshot.y();
        double dz = z - snapshot.z();
        double distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance <= radius) {
            lastMeasurements = Map.of(
                "distance_blocks", distance,
                "arrival_radius", radius,
                "final_x", snapshot.x(),
                "final_y", snapshot.y(),
                "final_z", snapshot.z()
            );
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                "The player reached the admitted destination radius."
            );
            return;
        }
        if (distance + 0.02 < navigationClosestDistance) {
            navigationClosestDistance = distance;
            navigationNoProgressTicks = 0;
        } else {
            navigationNoProgressTicks++;
        }
        if (actionTicks > 20 && navigationNoProgressTicks >= 40) {
            lastMeasurements = Map.of(
                "distance_blocks", distance,
                "closest_distance_blocks", navigationClosestDistance,
                "arrival_radius", radius,
                "no_progress_ticks", navigationNoProgressTicks,
                "final_x", snapshot.x(),
                "final_y", snapshot.y(),
                "final_z", snapshot.z()
            );
            settle(
                State.FAILED,
                "workflow.failed",
                "Native Fabric navigation stopped after measured non-progress instead of continuing to circle the destination."
            );
            return;
        }
        double horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        float desiredYaw = (float) Math.toDegrees(Math.atan2(-dx, dz));
        float yawError = Math.abs(wrapDegrees(desiredYaw - snapshot.yaw()));
        bridge.lookAt(x, y, z, 18.0F);
        if (yawError > 12.0F || horizontalDistance <= radius) {
            bridge.applyMovement(MovementInput.released());
        } else {
            bridge.applyMovement(new MovementInput(
                true,
                false,
                false,
                false,
                snapshot.horizontalCollision() && snapshot.onGround(),
                bool(active.arguments(), "allow_sprint") && distance > Math.max(3.0, radius + 1.5)
            ));
        }
        if (actionTicks == 1 || actionTicks % 20 == 0) {
            double initialBound = Math.max(radius + 1.0, numberOr(active.arguments(), "initial_distance", distance));
            emit(
                "workflow.progress",
                Math.max(0.0, Math.min(0.99, 1.0 - (distance / initialBound))),
                "The player is navigating toward the admitted destination.",
                false,
                false
            );
        }
    }

    private void lookAt(PlayerSnapshot snapshot) {
        Map<String, Object> target = object(active.arguments().get("target"));
        String targetKind = text(target, "target_kind");
        if ("current_focus".equals(targetKind)) {
            lastMeasurements = Map.of(
                "target_kind", "current_focus",
                "view_retained", true,
                "final_yaw", (double) snapshot.yaw(),
                "final_pitch", (double) snapshot.pitch()
            );
            settle(State.SUCCEEDED, "workflow.succeeded", "The current player focus was retained.");
            return;
        }
        if ("relative_rotation".equals(targetKind)) {
            relativeLook(snapshot, target);
            return;
        }
        if (!"position".equals(targetKind)) {
            throw new IllegalArgumentException(
                "The client needs a resolved position before it can look at this subject."
            );
        }
        Map<String, Object> position = object(target.get("position"));
        double x = number(position, "x");
        double y = number(position, "y");
        double z = number(position, "z");
        double dx = x - snapshot.x();
        double dy = y - snapshot.eyeY();
        double dz = z - snapshot.z();
        double horizontal = Math.sqrt(dx * dx + dz * dz);
        double desiredYaw = Math.toDegrees(Math.atan2(-dx, dz));
        double desiredPitch = -Math.toDegrees(Math.atan2(dy, horizontal));
        double yawError = Math.abs(wrapDegrees(desiredYaw - snapshot.yaw()));
        double pitchError = Math.abs(desiredPitch - snapshot.pitch());
        if (yawError <= 2.0 && pitchError <= 2.0) {
            lastMeasurements = Map.of(
                "target_kind", "position",
                "yaw_error_degrees", yawError,
                "pitch_error_degrees", pitchError,
                "target_yaw", desiredYaw,
                "target_pitch", desiredPitch,
                "final_yaw", (double) snapshot.yaw(),
                "final_pitch", (double) snapshot.pitch()
            );
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                String.format(
                    java.util.Locale.ROOT,
                    "The player view reached the admitted target (yaw error %.2f°, pitch error %.2f°).",
                    yawError,
                    pitchError
                )
            );
            return;
        }
        bridge.lookAt(
            x,
            y,
            z,
            (float) number(active.arguments(), "max_turn_degrees_per_tick")
        );
        if (actionTicks == 1 || actionTicks % 5 == 0) {
            emit(
                "workflow.progress",
                null,
                "The player view is turning toward the admitted position.",
                false,
                false
            );
        }
    }

    private void relativeLook(PlayerSnapshot snapshot, Map<String, Object> target) {
        double requestedYawDelta = number(target, "yaw_delta_degrees");
        double requestedPitchDelta = number(target, "pitch_delta_degrees");
        if (lookTargetYaw == null || lookTargetPitch == null) {
            lookStartYaw = snapshot.yaw();
            lookStartPitch = snapshot.pitch();
            lookTargetYaw = (float) wrapDegrees(snapshot.yaw() + requestedYawDelta);
            lookTargetPitch = (float) clamp(
                snapshot.pitch() + requestedPitchDelta,
                -90.0,
                90.0
            );
        }
        double yawError = Math.abs(wrapDegrees(lookTargetYaw - snapshot.yaw()));
        double pitchError = Math.abs(lookTargetPitch - snapshot.pitch());
        if (yawError <= 0.5 && pitchError <= 0.5) {
            double appliedYawDelta = wrapDegrees(snapshot.yaw() - lookStartYaw);
            double appliedPitchDelta = snapshot.pitch() - lookStartPitch;
            lastMeasurements = Map.ofEntries(
                Map.entry("target_kind", "relative_rotation"),
                Map.entry("requested_yaw_delta_degrees", requestedYawDelta),
                Map.entry("requested_pitch_delta_degrees", requestedPitchDelta),
                Map.entry("initial_yaw", (double) lookStartYaw),
                Map.entry("initial_pitch", (double) lookStartPitch),
                Map.entry("target_yaw", (double) lookTargetYaw),
                Map.entry("target_pitch", (double) lookTargetPitch),
                Map.entry("final_yaw", (double) snapshot.yaw()),
                Map.entry("final_pitch", (double) snapshot.pitch()),
                Map.entry("applied_yaw_delta_degrees", appliedYawDelta),
                Map.entry("applied_pitch_delta_degrees", appliedPitchDelta),
                Map.entry("yaw_error_degrees", yawError),
                Map.entry("pitch_error_degrees", pitchError)
            );
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                String.format(
                    java.util.Locale.ROOT,
                    "The player view completed the admitted relative rotation (yaw %.2f degrees, pitch %.2f degrees).",
                    appliedYawDelta,
                    appliedPitchDelta
                )
            );
            return;
        }
        bridge.lookTo(
            lookTargetYaw,
            lookTargetPitch,
            (float) number(active.arguments(), "max_turn_degrees_per_tick")
        );
        if (actionTicks == 1 || actionTicks % 5 == 0) {
            emit(
                "workflow.progress",
                null,
                "The player view is applying the admitted relative rotation.",
                false,
                false
            );
        }
    }

    private void trackTarget(PlayerSnapshot snapshot) {
        double stopBelowHealth = number(active.arguments(), "stop_below_health");
        if (snapshot.health() < stopBelowHealth) {
            lastMeasurements = Map.ofEntries(
                Map.entry("measured_health", (double) snapshot.health()),
                Map.entry("stop_below_health", stopBelowHealth),
                Map.entry("tracking_completed", false),
                Map.entry("safety_interrupted", true),
                Map.entry("interrupt_reason", "health_floor_crossed")
            );
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                "Camera tracking safely interrupted because measured player health crossed the admitted floor."
            );
            return;
        }

        Map<String, Object> target = object(active.arguments().get("target"));
        String targetKind = text(target, "target_kind");
        String aimPoint = text(active.arguments(), "aim_point");
        double maxDistance = number(active.arguments(), "max_acquisition_distance");
        boolean requireLineOfSight = bool(active.arguments(), "require_line_of_sight");
        TargetObservation observation = bridge.observeTarget(
            target,
            trackingTargetRef,
            aimPoint,
            maxDistance,
            requireLineOfSight
        );
        trackingSamples++;

        if (!observation.available() || !observation.alive()) {
            bridge.clearCameraTrackingTarget();
            trackingLossTicks++;
            trackingConsecutiveLossTicks++;
            trackingWasMissing = true;
            if (trackingConsecutiveLossTicks > integer(active.arguments(), "reacquire_ticks")) {
                lastMeasurements = trackingMeasurements(targetKind, requireLineOfSight, false);
                settle(
                    State.FAILED,
                    "workflow.failed",
                    trackingTargetRef == null
                        ? "No matching " + trackingSubject(targetKind) +
                            " could be acquired inside the admitted tracking envelope."
                        : "The locked " + trackingSubject(targetKind) +
                            " left the admitted tracking envelope beyond its reacquisition grace."
                );
                return;
            }
        } else {
            if (trackingTargetRef == null) {
                trackingTargetRef = observation.targetRef();
                trackingTargetTypeId = observation.targetTypeId();
            } else if (!trackingTargetRef.equals(observation.targetRef())) {
                lastMeasurements = trackingMeasurements(targetKind, requireLineOfSight, false);
                settle(
                    State.FAILED,
                    "workflow.failed",
                    "The connector attempted to substitute a different " +
                        trackingSubject(targetKind) + " for the locked tracking target."
                );
                return;
            }
            trackingParticleHandoffs = Math.max(
                trackingParticleHandoffs,
                observation.handoffCount()
            );
            if (trackingWasMissing) trackingReacquisitions++;
            trackingWasMissing = false;
            trackingConsecutiveLossTicks = 0;
            trackingRetainedTicks++;
            if (observation.visible()) trackingLineOfSightTicks++;

            double predictionTicks = integer(active.arguments(), "prediction_ticks");
            double targetX = observation.x() + observation.velocityX() * predictionTicks;
            double targetY = observation.y() + observation.velocityY() * predictionTicks;
            double targetZ = observation.z() + observation.velocityZ() * predictionTicks;
            double dx = targetX - snapshot.x();
            double dy = targetY - snapshot.eyeY();
            double dz = targetZ - snapshot.z();
            double horizontal = Math.sqrt(dx * dx + dz * dz);
            double desiredYaw = Math.toDegrees(Math.atan2(-dx, dz));
            double desiredPitch = -Math.toDegrees(Math.atan2(dy, horizontal));
            trackingFinalYawError = Math.abs(wrapDegrees(desiredYaw - snapshot.yaw()));
            trackingFinalPitchError = Math.abs(desiredPitch - snapshot.pitch());
            double angularError = Math.min(
                180,
                Math.hypot(trackingFinalYawError, trackingFinalPitchError)
            );
            trackingErrorSum += angularError;
            trackingMaxError = Math.max(trackingMaxError, angularError);
            trackingErrorHistogram[(int) Math.ceil(angularError)]++;

            bridge.updateCameraTrackingTarget(
                targetX,
                targetY,
                targetZ,
                (float) number(active.arguments(), "max_turn_degrees_per_tick"),
                (float) number(
                    active.arguments(),
                    "max_angular_acceleration_degrees_per_tick_squared"
                ),
                (float) number(active.arguments(), "deadband_degrees")
            );
        }

        long durationTicks = Math.max(
            1,
            (long) Math.ceil(number(active.arguments(), "max_duration_ms") / 50.0)
        );
        if (actionTicks >= durationTicks) {
            if (trackingTargetRef == null || trackingRetainedTicks < 1) {
                lastMeasurements = trackingMeasurements(targetKind, requireLineOfSight, false);
                settle(
                    State.FAILED,
                    "workflow.failed",
                    "No matching " + trackingSubject(targetKind) +
                        " was measured during the admitted tracking interval."
                );
                return;
            }
            lastMeasurements = trackingMeasurements(targetKind, requireLineOfSight, true);
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                String.format(
                    java.util.Locale.ROOT,
                    "The camera retained the locked %s target for %d of %d measured ticks (mean error %.2f degrees, p95 %.2f degrees).",
                    trackingTargetTypeId,
                    trackingRetainedTicks,
                    trackingSamples,
                    trackingRetainedTicks == 0 ? 0 : trackingErrorSum / trackingRetainedTicks,
                    trackingP95Error()
                )
            );
            return;
        }
        if (actionTicks == 1 || actionTicks % 20 == 0) {
            lastMeasurements = trackingMeasurements(targetKind, requireLineOfSight, false);
            emit(
                "workflow.progress",
                Math.min(0.99, (double) actionTicks / durationTicks),
                trackingTargetRef == null
                    ? "The camera tracker is acquiring the admitted entity target."
                    : "The camera tracker is retaining the locked entity target.",
                false,
                false
            );
        }
    }

    private Map<String, Object> trackingMeasurements(
        String targetKind,
        boolean requireLineOfSight,
        boolean completed
    ) {
        Map<String, Object> measurements = new java.util.LinkedHashMap<>();
        measurements.put("tracking_completed", completed);
        measurements.put("target_kind", targetKind);
        if (trackingTargetRef != null) measurements.put("target_ref", trackingTargetRef);
        if (trackingTargetTypeId != null) {
            measurements.put(
                "particle_type".equals(targetKind)
                    ? "target_particle_type_id"
                    : "target_entity_type_id",
                trackingTargetTypeId
            );
        }
        if ("particle_type".equals(targetKind)) {
            Map<String, Object> target = object(active.arguments().get("target"));
            measurements.put("particle_continuity", text(target, "continuity"));
            measurements.put("particle_handoff_count", trackingParticleHandoffs);
            measurements.put("particle_max_handoffs", integer(target, "max_handoffs"));
        }
        measurements.put("duration_ticks", trackingSamples);
        measurements.put("sample_count", trackingSamples);
        measurements.put("retained_ticks", trackingRetainedTicks);
        measurements.put("target_loss_ticks", trackingLossTicks);
        measurements.put("line_of_sight_retained_ticks", trackingLineOfSightTicks);
        measurements.put("reacquisition_count", trackingReacquisitions);
        measurements.put(
            "mean_angular_error_degrees",
            trackingRetainedTicks == 0 ? 0 : trackingErrorSum / trackingRetainedTicks
        );
        measurements.put("p95_angular_error_degrees", trackingP95Error());
        measurements.put("max_angular_error_degrees", trackingMaxError);
        measurements.put("final_yaw_error_degrees", trackingFinalYawError);
        measurements.put("final_pitch_error_degrees", trackingFinalPitchError);
        measurements.put("line_of_sight_required", requireLineOfSight);
        return Map.copyOf(measurements);
    }

    private static String trackingSubject(String targetKind) {
        return "particle_type".equals(targetKind) ? "particle" : "entity";
    }

    private double trackingP95Error() {
        if (trackingRetainedTicks == 0) return 0;
        long threshold = (long) Math.ceil(trackingRetainedTicks * 0.95);
        long cumulative = 0;
        for (int error = 0; error < trackingErrorHistogram.length; error++) {
            cumulative += trackingErrorHistogram[error];
            if (cumulative >= threshold) return error;
        }
        return 180;
    }

    private void handleManualOverride(String manualInputReason) {
        lastMeasurements = Map.of(
            "manual_input_reason", manualInputReason,
            "action_ticks_before_override", actionTicks
        );
        releaseOwnedControls.run();
        if (active.manualOverridePolicy() == ManualOverridePolicy.PAUSE) {
            state = State.PAUSED_MANUAL_OVERRIDE;
            emit(
                "workflow.manual_override_detected",
                progress(),
                "Manual player input paused the workflow and released controls (reason: " +
                    manualInputReason + ").",
                true,
                true
            );
        } else {
            settle(
                State.CANCELED,
                "workflow.canceled",
                "Manual player input canceled the workflow and released controls (reason: " +
                    manualInputReason + ").",
                true
            );
        }
    }

    private void walk(PlayerSnapshot snapshot) {
        if (actionStartX == null) {
            actionStartX = snapshot.x();
            actionStartY = snapshot.y();
            actionStartZ = snapshot.z();
        }
        long durationTicks = Math.max(
            1,
            (long) Math.ceil(number(active.arguments(), "duration_ms") / 50.0)
        );
        if (actionTicks > durationTicks) {
            double dx = snapshot.x() - actionStartX;
            double dy = snapshot.y() - actionStartY;
            double dz = snapshot.z() - actionStartZ;
            double distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            double minimumMotion = Math.min(0.1, Math.max(0.01, durationTicks * 0.005));
            if (distance < minimumMotion) {
                settle(
                    State.FAILED,
                    "workflow.failed",
                    "The bounded walk asserted controls but no measurable player motion occurred."
                );
                return;
            }
            lastMeasurements = Map.of(
                "distance_blocks", distance,
                "duration_ticks", durationTicks
            );
            settle(
                State.SUCCEEDED,
                "workflow.succeeded",
                String.format(
                    java.util.Locale.ROOT,
                    "The bounded walk completed with %.3f blocks of measured motion.",
                    distance
                )
            );
            return;
        }
        String direction = text(active.arguments(), "direction");
        bridge.applyMovement(new MovementInput(
            "forward".equals(direction),
            "back".equals(direction),
            "left".equals(direction),
            "right".equals(direction),
            false,
            bool(active.arguments(), "sprint")
        ));
    }

    private void jump(PlayerSnapshot snapshot) {
        int requested = integer(active.arguments(), "count");
        if (jumpPulses > confirmedJumps) {
            if (!snapshot.onGround() || snapshot.y() > jumpStartY + 0.05) {
                confirmedJumps++;
                if (confirmedJumps >= requested) {
                    lastMeasurements = Map.of(
                        "confirmed_jumps", confirmedJumps,
                        "requested_count", requested
                    );
                    settle(
                        State.SUCCEEDED,
                        "workflow.succeeded",
                        "The admitted jump sequence completed with every jump observed airborne."
                    );
                }
                return;
            }
            if (actionTicks - lastJumpPulseTick > 8) {
                settle(
                    State.FAILED,
                    "workflow.failed",
                    "The jump control was asserted but no airborne transition was observed."
                );
            }
            return;
        }
        if (snapshot.onGround()) {
            bridge.pulseJump();
            jumpPulses++;
            lastJumpPulseTick = actionTicks;
            jumpStartY = snapshot.y();
        }
    }

    private void interact() {
        String target = text(active.arguments(), "target");
        String hand = text(active.arguments(), "hand");
        String interaction = text(active.arguments(), "interaction");
        if (!oneShotAttempted) {
            interactionAttemptCount++;
            HandObservation beforeAttempt = bridge.observeHand(hand);
            if (!bridge.interact(target, hand, interaction)) {
                if (interactionAttemptCount >= INTERACTION_FOCUS_ACQUISITION_TICKS) {
                    lastMeasurements = Map.of(
                        "interaction_accepted", false,
                        "target", target,
                        "hand", hand,
                        "interaction", interaction,
                        "focus_acquisition_pending", true,
                        "interaction_attempt_count", interactionAttemptCount,
                        "post_interaction_observed", false
                    );
                    throw new IllegalArgumentException(
                        "No compatible block or entity became available during the bounded focus acquisition window."
                    );
                }
                lastMeasurements = Map.of(
                    "interaction_accepted", false,
                    "target", target,
                    "hand", hand,
                    "interaction", interaction,
                    "focus_acquisition_pending", true,
                    "interaction_attempt_count", interactionAttemptCount,
                    "post_interaction_observed", false
                );
                return;
            }
            interactionHandBefore = beforeAttempt;
            oneShotAttempted = true;
            Map<String, Object> accepted = new LinkedHashMap<>();
            accepted.put("interaction_accepted", true);
            accepted.put("target", target);
            accepted.put("hand", hand);
            accepted.put("interaction", interaction);
            accepted.put("focus_acquisition_pending", false);
            accepted.put("interaction_attempt_count", interactionAttemptCount);
            accepted.put("post_interaction_observed", false);
            lastMeasurements = Map.copyOf(accepted);
            return;
        }

        HandObservation after = bridge.observeHand(hand);
        Map<String, Object> measured = new LinkedHashMap<>();
        measured.put("interaction_accepted", true);
        measured.put("target", target);
        measured.put("hand", hand);
        measured.put("interaction", interaction);
        measured.put("focus_acquisition_pending", false);
        measured.put("interaction_attempt_count", interactionAttemptCount);
        boolean observed = interactionHandBefore.available() && after.available();
        measured.put("post_interaction_observed", observed);
        if (observed) {
            int delta = after.count() - interactionHandBefore.count();
            boolean changed = delta != 0 ||
                !after.itemId().equals(interactionHandBefore.itemId());
            int consumed = after.itemId().equals(interactionHandBefore.itemId()) ||
                after.itemId().isBlank()
                ? Math.max(0, -delta)
                : 0;
            measured.put("held_item_id_before", interactionHandBefore.itemId());
            measured.put("held_item_id_after", after.itemId());
            measured.put("held_item_count_before", interactionHandBefore.count());
            measured.put("held_item_count_after", after.count());
            measured.put("held_item_count_delta", delta);
            measured.put("consumed_item_count", consumed);
            measured.put("inventory_mutations_performed", changed ? 1 : 0);
        } else {
            measured.put("consumed_item_count", 0);
            measured.put("inventory_mutations_performed", 0);
        }
        lastMeasurements = Map.copyOf(measured);
        settle(
            State.SUCCEEDED,
            "workflow.succeeded",
            observed
                ? "The game accepted the interaction and the used hand postcondition was observed."
                : "The game accepted the interaction; no hand postcondition provider was available."
        );
    }

    private void selectHotbar() {
        int slot = integer(active.arguments(), "slot");
        if (!bridge.selectHotbar(slot)) {
            throw new IllegalArgumentException("The requested hotbar slot is unavailable.");
        }
        lastMeasurements = Map.of("selected_slot", slot, "selection_matches", true);
        settle(State.SUCCEEDED, "workflow.succeeded", "The admitted hotbar slot was selected.");
    }

    private void equip() {
        String itemId = text(active.arguments(), "item_id");
        String destination = text(active.arguments(), "destination");
        if (!bridge.equip(itemId, destination)) {
            throw new IllegalArgumentException(
                "The requested item could not be equipped in the requested destination."
            );
        }
        lastMeasurements = Map.of(
            "item_id", itemId,
            "destination", destination,
            "equipment_matches", true
        );
        settle(State.SUCCEEDED, "workflow.succeeded", "The requested item was equipped.");
    }

    private void reusableWorkflow() {
        WorkflowStep step = bridge.runWorkflowStep(
            active.actionKind(),
            active.arguments(),
            active.controlEngine(),
            actionTicks
        );
        lastMeasurements = step.measurements();
        switch (step.status()) {
            case SUCCEEDED -> settle(State.SUCCEEDED, "workflow.succeeded", step.summary());
            case FAILED -> settle(State.FAILED, "workflow.failed", step.summary());
            case RUNNING -> {
                if (actionTicks == 1 || actionTicks % 20 == 0) {
                    emit(
                        "workflow.progress",
                        step.progressFraction(),
                        step.summary(),
                        false,
                        false
                    );
                }
            }
        }
    }

    private void settle(State next, String eventType, String summary) {
        settle(next, eventType, summary, false);
    }

    private void settle(
        State next,
        String eventType,
        String summary,
        boolean manualOverrideDetected
    ) {
        releaseOwnedControls.run();
        state = next;
        emit(
            eventType,
            next == State.SUCCEEDED ? 1.0 : progress(),
            summary,
            manualOverrideDetected,
            true
        );
    }

    private void emit(
        String eventType,
        Double progressFraction,
        String summary,
        boolean manualOverrideDetected,
        boolean controlsReleased
    ) {
        listener.onEvent(new WorkflowEvent(
            active.workflowId(),
            sequence++,
            eventType,
            state,
            progressFraction,
            summary,
            lastMeasurements,
            manualOverrideDetected,
            controlsReleased
        ));
    }

    private double progress() {
        if (active == null) return 0.0;
        return Math.min(0.99, (double) elapsedTicks / (double) active.maxDurationTicks());
    }

    private static boolean terminal(State state) {
        return state == State.CANCELED ||
            state == State.SUCCEEDED ||
            state == State.FAILED ||
            state == State.TIMED_OUT ||
            state == State.EMERGENCY_STOPPED ||
            state == State.CONNECTOR_OFFLINE;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("The action arguments are incomplete.");
        }
        return (Map<String, Object>) map;
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException("The action argument " + key + " is required.");
        }
        return text;
    }

    private static double number(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new IllegalArgumentException("The numeric action argument " + key + " is required.");
        }
        return number.doubleValue();
    }

    private static double numberOr(Map<String, Object> map, String key, double fallback) {
        Object value = map.get(key);
        return value instanceof Number number && Double.isFinite(number.doubleValue())
            ? number.doubleValue()
            : fallback;
    }

    private static int integer(Map<String, Object> map, String key) {
        double value = number(map, key);
        if (Math.rint(value) != value) {
            throw new IllegalArgumentException("The action argument " + key + " must be an integer.");
        }
        return (int) value;
    }

    private static boolean bool(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Boolean bool)) {
            throw new IllegalArgumentException("The boolean action argument " + key + " is required.");
        }
        return bool;
    }

    private static String boundedReason(String reason, String fallback) {
        if (reason == null || reason.isBlank()) return fallback;
        return reason.length() <= 1_000 ? reason : reason.substring(0, 1_000);
    }

    private static float wrapDegrees(float value) {
        float wrapped = value % 360.0F;
        if (wrapped >= 180.0F) wrapped -= 360.0F;
        if (wrapped < -180.0F) wrapped += 360.0F;
        return wrapped;
    }

    private static double wrapDegrees(double value) {
        double wrapped = value % 360.0;
        if (wrapped >= 180.0) wrapped -= 360.0;
        if (wrapped < -180.0) wrapped += 360.0;
        return wrapped;
    }

    private static double clamp(double value, double minimum, double maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
}
