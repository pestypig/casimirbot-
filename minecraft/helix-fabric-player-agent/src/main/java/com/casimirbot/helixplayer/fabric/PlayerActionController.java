package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;

import java.util.Map;
import java.util.Objects;

public final class PlayerActionController {
    private final ControlBridge bridge;
    private final EventListener listener;
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
    private boolean oneShotAttempted;
    private Map<String, Object> lastMeasurements = Map.of();

    public PlayerActionController(ControlBridge bridge, EventListener listener) {
        this.bridge = Objects.requireNonNull(bridge, "bridge");
        this.listener = Objects.requireNonNull(listener, "listener");
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
        oneShotAttempted = false;
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
            bridge.releaseAll();
            if (active.manualOverridePolicy() == ManualOverridePolicy.PAUSE) {
                state = State.PAUSED_MANUAL_OVERRIDE;
                emit(
                    "workflow.manual_override_detected",
                    progress(),
                    "Manual player input paused the workflow and released controls.",
                    true,
                    true
                );
            } else {
                settle(
                    State.CANCELED,
                    "workflow.canceled",
                    "Manual player input canceled the workflow and released controls.",
                    true
                );
            }
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
            settle(
                State.FAILED,
                "workflow.failed",
                "The native Fabric executor could not complete the admitted action."
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
        bridge.releaseAll();
        if (active == null || terminal(state)) return false;
        settle(
            State.EMERGENCY_STOPPED,
            "workflow.emergency_stopped",
            boundedReason(reason, "Emergency stop released every client control.")
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
        bridge.lookAt(x, y, z, 18.0F);
        bridge.applyMovement(new MovementInput(
            true,
            false,
            false,
            false,
            snapshot.horizontalCollision() && snapshot.onGround(),
            bool(active.arguments(), "allow_sprint")
        ));
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
                "view_retained", true
            );
            settle(State.SUCCEEDED, "workflow.succeeded", "The current player focus was retained.");
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
                "pitch_error_degrees", pitchError
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
        if (oneShotAttempted) return;
        oneShotAttempted = true;
        if (!bridge.interact(
            text(active.arguments(), "target"),
            text(active.arguments(), "hand"),
            text(active.arguments(), "interaction")
        )) {
            throw new IllegalArgumentException(
                "No compatible block or entity was available at the current focus."
            );
        }
        lastMeasurements = Map.of(
            "interaction_accepted", true,
            "target", text(active.arguments(), "target"),
            "hand", text(active.arguments(), "hand"),
            "interaction", text(active.arguments(), "interaction")
        );
        settle(
            State.SUCCEEDED,
            "workflow.succeeded",
            "The game accepted the admitted interaction at the current focus."
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
        bridge.releaseAll();
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

    private static double wrapDegrees(double value) {
        double wrapped = value % 360.0;
        if (wrapped >= 180.0) wrapped -= 360.0;
        if (wrapped < -180.0) wrapped += 360.0;
        return wrapped;
    }
}
