package com.casimirbot.helixplayer.fabric;

import java.util.Map;
import java.util.Objects;

public final class PlayerActionWorkflow {
    private PlayerActionWorkflow() {}

    public enum State {
        QUEUED,
        RUNNING,
        PAUSED_MANUAL_OVERRIDE,
        CANCELED,
        SUCCEEDED,
        FAILED,
        TIMED_OUT,
        EMERGENCY_STOPPED,
        CONNECTOR_OFFLINE
    }

    public enum ManualOverridePolicy {
        PAUSE,
        CANCEL;

        static ManualOverridePolicy fromWire(String value) {
            return "pause".equals(value) ? PAUSE : CANCEL;
        }
    }

    public enum WorkflowStepStatus {
        RUNNING,
        SUCCEEDED,
        FAILED
    }

    public record ActionRequest(
        String actionRequestId,
        String workflowId,
        String actionKind,
        Map<String, Object> arguments,
        long maxDurationTicks,
        ManualOverridePolicy manualOverridePolicy,
        String controlEngine
    ) {
        public ActionRequest {
            requireIdentifier(actionRequestId, "actionRequestId");
            requireIdentifier(workflowId, "workflowId");
            requireIdentifier(actionKind, "actionKind");
            arguments = Map.copyOf(Objects.requireNonNull(arguments, "arguments"));
            if (maxDurationTicks < 1 || maxDurationTicks > 36_000) {
                throw new IllegalArgumentException("maxDurationTicks must be 1-36000");
            }
            Objects.requireNonNull(manualOverridePolicy, "manualOverridePolicy");
            requireIdentifier(controlEngine, "controlEngine");
        }
    }

    public record PlayerSnapshot(
        boolean connected,
        double x,
        double y,
        double eyeY,
        double z,
        float yaw,
        float pitch,
        float health,
        boolean onGround,
        boolean horizontalCollision,
        boolean manualInputDetected,
        String manualInputReason
    ) {
        public PlayerSnapshot {
            if (!manualInputDetected) manualInputReason = null;
            if (manualInputDetected && (manualInputReason == null || manualInputReason.isBlank())) {
                manualInputReason = "unspecified_manual_input";
            }
        }
    }

    public record MovementInput(
        boolean forward,
        boolean back,
        boolean left,
        boolean right,
        boolean jump,
        boolean sprint
    ) {
        public static MovementInput released() {
            return new MovementInput(false, false, false, false, false, false);
        }
    }

    public record WorkflowEvent(
        String workflowId,
        long sequence,
        String eventType,
        State state,
        Double progressFraction,
        String summary,
        Map<String, Object> measurements,
        boolean manualOverrideDetected,
        boolean controlsReleased
    ) {
        public WorkflowEvent {
            measurements = Map.copyOf(Objects.requireNonNull(measurements, "measurements"));
        }
    }

    public record WorkflowStep(
        WorkflowStepStatus status,
        Double progressFraction,
        String summary,
        Map<String, Object> measurements
    ) {
        public WorkflowStep {
            Objects.requireNonNull(status, "status");
            if (progressFraction != null &&
                (!Double.isFinite(progressFraction) || progressFraction < 0 || progressFraction > 1)) {
                throw new IllegalArgumentException("progressFraction must be null or 0-1");
            }
            if (summary == null || summary.isBlank() || summary.length() > 4_000) {
                throw new IllegalArgumentException("summary must be bounded");
            }
            measurements = Map.copyOf(Objects.requireNonNull(measurements, "measurements"));
        }

        public static WorkflowStep running(
            Double progressFraction,
            String summary,
            Map<String, Object> measurements
        ) {
            return new WorkflowStep(
                WorkflowStepStatus.RUNNING,
                progressFraction,
                summary,
                measurements
            );
        }

        public static WorkflowStep succeeded(String summary, Map<String, Object> measurements) {
            return new WorkflowStep(WorkflowStepStatus.SUCCEEDED, 1.0, summary, measurements);
        }

        public static WorkflowStep failed(String summary, Map<String, Object> measurements) {
            return new WorkflowStep(WorkflowStepStatus.FAILED, null, summary, measurements);
        }
    }

    @FunctionalInterface
    public interface EventListener {
        void onEvent(WorkflowEvent event);
    }

    public interface ControlBridge {
        PlayerSnapshot snapshot();

        void applyMovement(MovementInput movement);

        void lookAt(double x, double y, double z, float maxDegreesPerTick);

        void lookTo(float yaw, float pitch, float maxDegreesPerTick);

        void pulseJump();

        boolean interact(String target, String hand, String interaction);

        boolean selectHotbar(int slot);

        boolean equip(String itemId, String destination);

        default boolean supportsControlEngine(String controlEngine) {
            return "native_fabric".equals(controlEngine);
        }

        default void beginWorkflow(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine
        ) {}

        default WorkflowStep runWorkflowStep(
            String actionKind,
            Map<String, Object> arguments,
            String controlEngine,
            long actionTicks
        ) {
            return WorkflowStep.failed(
                "The client companion does not advertise action kind " + actionKind + ".",
                Map.of("action_kind", actionKind)
            );
        }

        void releaseAll();
    }

    private static void requireIdentifier(String value, String name) {
        if (value == null || value.isBlank() || value.length() > 320) {
            throw new IllegalArgumentException(name + " must be a bounded identifier");
        }
    }
}
