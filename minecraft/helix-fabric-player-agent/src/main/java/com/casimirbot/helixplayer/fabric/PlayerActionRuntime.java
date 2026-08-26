package com.casimirbot.helixplayer.fabric;

import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ActionRequest;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ManualOverridePolicy;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.PlayerSnapshot;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.State;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import net.minecraft.client.Minecraft;
import org.slf4j.Logger;

final class PlayerActionRuntime implements AutoCloseable {
    private static final String PROTOCOL_VERSION = "helix.environment_action.v1";
    static final String ADAPTER_VERSION = "0.4.0";
    private static final int POLL_INTERVAL_TICKS = 20;
    private static final int HEARTBEAT_INTERVAL_TICKS = 100;
    private static final int MAX_PENDING_DELIVERIES = 768;
    private static final int RESERVED_TERMINAL_DELIVERIES = 3;

    private record ActiveEnvelope(
        Map<String, Object> wire,
        String actionExecutionId,
        String startedAt,
        Map<String, Object> startedClock,
        String controlEngine,
        List<String> progressEventRefs
    ) {}

    private record LocalDiagnosticEnvelope(
        String actionRequestId,
        String workflowId,
        String actionKind,
        Map<String, Object> arguments,
        String controlEngine,
        String stagingRequestRef,
        Map<String, Object> startingState,
        String startedAt,
        Map<String, Object> startedClock
    ) {}

    private final PlayerActionConfig config;
    private final Minecraft minecraft;
    private final Logger logger;
    private final NativeFabricControlBridge bridge;
    private final PlayerActionController controller;
    private final ExecutorService network;
    private final PlayerActionHttpClient http;
    private final Consumer<String> localDiagnosticMessage;
    private volatile String producerEpochRef = id("environment_action_epoch");
    private volatile String manifestId = id("environment_action_manifest");
    private final String executionClockId = id("minecraft_client_tick_clock");
    private final AtomicBoolean cyclePending = new AtomicBoolean(false);
    private final AtomicBoolean manifestPending = new AtomicBoolean(false);
    private final AtomicBoolean deliveryFlushPending = new AtomicBoolean(false);
    private volatile boolean manifestReady;
    private volatile boolean heartbeatReady;
    private volatile boolean emergencyStopLatched;
    private volatile boolean eventStreamResyncRequired;
    private volatile boolean manualInputDetected;
    private volatile long latestEventSequence = -1;
    private volatile String lastTransportError = "";
    private volatile ActiveEnvelope activeEnvelope;
    private volatile LocalDiagnosticEnvelope localDiagnosticEnvelope;
    private final PlayerActionDeliveryOutbox deliveryOutbox =
        new PlayerActionDeliveryOutbox(MAX_PENDING_DELIVERIES);
    private volatile Map<String, Object> latestClockSnapshot = Map.of();
    private volatile MinecraftViabilityGuardian.Decision latestViabilityDecision;
    private volatile String lastViabilityNotice = "";
    private volatile String lastViabilityEventReason = "";
    private long ticks;

    PlayerActionRuntime(
        PlayerActionConfig config,
        Minecraft minecraft,
        Logger logger,
        Consumer<String> localDiagnosticMessage
    ) {
        this.config = config;
        this.minecraft = minecraft;
        this.logger = logger;
        this.localDiagnosticMessage = localDiagnosticMessage;
        this.bridge = new NativeFabricControlBridge(minecraft);
        this.controller = new PlayerActionController(bridge, this::onWorkflowEvent);
        this.network = Executors.newSingleThreadExecutor(runnable -> {
            Thread thread = new Thread(runnable, "helix-player-action-network");
            thread.setDaemon(true);
            return thread;
        });
        this.http = config.ready() ? new PlayerActionHttpClient(config) : null;
    }

    void start() {
        // Manifest admission is deferred until this client is connected as the
        // exact server-observed player bound by the room authority.
    }

    void tick() {
        boolean residentOwnsTick = tickViabilityGuardian();
        if (eventStreamResyncRequired) {
            // The server can no longer admit the immutable evidence sequence
            // for this producer epoch. Never continue acting while terminal
            // evidence is stranded behind that boundary.
            bridge.releaseAll();
        } else if (activeControlPlaneFailureRequiresStop(
            activeEnvelope != null,
            controller.activeWorkflowId(),
            lastTransportError
        )) {
            controller.connectorOffline(
                "The Helix action transport became unreachable; the client released every control and retained the terminal event for later delivery."
            );
            bridge.releaseAll();
        } else if (!residentOwnsTick) {
            controller.tick();
        }
        ticks++;
        latestClockSnapshot = captureClockSnapshot(ticks);
        if (!config.ready() || http == null) return;
        if (!connectedIdentityMatches()) {
            if (controller.activeWorkflowId() != null) {
                controller.emergencyStop("The exact paired Minecraft player is no longer connected.");
                bridge.releaseAll();
            }
            return;
        }
        if (!manifestReady && ticks % POLL_INTERVAL_TICKS == 0 && manifestPending.compareAndSet(false, true)) {
            network.execute(() -> {
                try {
                    publishManifest();
                } finally {
                    manifestPending.set(false);
                }
            });
        }
        if (ticks % HEARTBEAT_INTERVAL_TICKS == 0) {
            if (manifestReady) network.execute(this::publishHeartbeat);
        }
        if (eventStreamResyncRequired) return;
        if (
            actionPollingReady(manifestReady, heartbeatReady) &&
            ticks % POLL_INTERVAL_TICKS == 0 &&
            cyclePending.compareAndSet(false, true)
        ) {
            network.execute(() -> {
                try {
                    pollControlsThenActions();
                } finally {
                    cyclePending.set(false);
                }
            });
        }
    }

    void renderFrame(long frameNanos) {
        controller.renderFrame(frameNanos);
    }

    boolean ready() {
        return config.ready() && manifestReady && heartbeatReady &&
            !emergencyStopLatched && !eventStreamResyncRequired;
    }

    String statusText() {
        if (!config.ready()) return "Helix player embodiment is not paired.";
        if (emergencyStopLatched) return "Helix player embodiment is emergency-stopped; pair a fresh authority to resume.";
        if (eventStreamResyncRequired) {
            return "Helix player embodiment needs a fresh pairing because its evidence stream no longer matches the server epoch.";
        }
        if (!manifestReady) return "Helix player embodiment is paired and waiting for manifest admission.";
        if (!heartbeatReady) return "Helix player embodiment is paired and waiting for its first admitted heartbeat.";
        String workflow = controller.activeWorkflowId();
        return workflow == null
            ? "Helix player embodiment is active and idle."
            : "Helix player embodiment is running workflow " + workflow + ".";
    }

    String localDiagnosticStatusText() {
        LocalDiagnosticEnvelope diagnostic = localDiagnosticEnvelope;
        if (diagnostic == null) return "Helix direct diagnostics are idle.";
        return "Helix direct diagnostic workflow " + diagnostic.workflowId() +
            " is running action " + diagnostic.actionKind() + ".";
    }

    String armLocalViabilityGuardian(long durationSeconds) {
        if (minecraft.player == null || minecraft.getConnection() == null) {
            return "The resident Minecraft guardian requires an active world connection.";
        }
        if (emergencyStopLatched) {
            return "The resident Minecraft guardian cannot arm while Emergency Stop is latched.";
        }
        long boundedSeconds = Math.max(10, Math.min(1_800, durationSeconds));
        bridge.armViabilityGuardian(ticks, boundedSeconds * 20L);
        lastViabilityNotice = "";
        lastViabilityEventReason = "";
        return "The deterministic resident Minecraft guardian is armed for " +
            boundedSeconds + " seconds with local water/air stabilization and fail-closed hazard escalation.";
    }

    String disarmLocalViabilityGuardian() {
        bridge.disarmViabilityGuardian();
        lastViabilityNotice = "";
        lastViabilityEventReason = "";
        return "The resident Minecraft guardian is disarmed and every guardian-owned control is released.";
    }

    String localViabilityGuardianStatusText() {
        MinecraftViabilityGuardian.Decision decision = latestViabilityDecision;
        if (!bridge.viabilityGuardianArmed()) return "The resident Minecraft guardian is not armed.";
        if (decision == null) return "The resident Minecraft guardian is armed and awaiting its first observation.";
        return "The resident Minecraft guardian is armed; latest decision " +
            decision.reasonCode() + " from observation revision " +
            decision.observationRevision() + ".";
    }

    private boolean tickViabilityGuardian() {
        if (!bridge.viabilityGuardianArmed()) return false;
        ActiveEnvelope envelope = activeEnvelope;
        if (
            envelope != null &&
            "arm_viability_guardian".equals(text(envelope.wire(), "action_kind"))
        ) return false;
        java.util.Set<String> residentCoverage = activeResidentGuardianCoverage();
        MinecraftViabilityGuardian.Decision decision = bridge.observeViability(
            ticks,
            emergencyStopLatched,
            residentCoverage.contains(
                ConcurrentReactiveScheduler.COVERAGE_UNSAFE_LANDING
            ),
            residentCoverage.contains(ConcurrentReactiveScheduler.COVERAGE_FIRE)
        );
        latestViabilityDecision = decision;
        boolean ownsTick = decision.proposal() ==
            MinecraftViabilityGuardian.ProposalKind.SWIM_UP;
        boolean delegatedRecovery = decision.proposal() ==
            MinecraftViabilityGuardian.ProposalKind.MONITOR_ADMITTED_RECOVERY;
        if (
            decision.proposal() != MinecraftViabilityGuardian.ProposalKind.NONE &&
            !delegatedRecovery
        ) {
            String workflowId = controller.activeWorkflowId();
            if (workflowId != null) {
                controller.cancel(
                    workflowId,
                    "The resident viability guardian interrupted the workflow: " +
                        decision.reasonCode()
                );
            }
            bridge.applyViabilityDecision(decision);
        }
        if (
            !decision.reasonCode().equals(lastViabilityEventReason) &&
            (!"viability_within_profile".equals(decision.reasonCode()) ||
                !lastViabilityEventReason.isBlank())
        ) {
            lastViabilityEventReason = decision.reasonCode();
            recordViabilityDecision(decision);
        }
        if (
            decision.semanticEscalationRequired() &&
            !decision.reasonCode().equals(lastViabilityNotice)
        ) {
            lastViabilityNotice = decision.reasonCode();
            localDiagnosticMessage.accept(
                "Resident guardian event: " + decision.reasonCode() +
                    ". Controls released=" + decision.controlsMustRelease() + "."
            );
        }
        return ownsTick;
    }

    private java.util.Set<String> activeResidentGuardianCoverage() {
        String actionKind = "";
        Map<String, Object> arguments = Map.of();
        ActiveEnvelope envelope = activeEnvelope;
        if (envelope != null) {
            actionKind = text(envelope.wire(), "action_kind");
            arguments = object(envelope.wire().get("arguments"));
        } else {
            LocalDiagnosticEnvelope diagnostic = localDiagnosticEnvelope;
            if (diagnostic != null) {
                actionKind = diagnostic.actionKind();
                arguments = diagnostic.arguments();
            }
        }
        if (!"execute_reactive_program".equals(actionKind)) return java.util.Set.of();
        return ConcurrentReactiveScheduler.residentGuardianCoverage(arguments);
    }

    private void recordViabilityDecision(
        MinecraftViabilityGuardian.Decision decision
    ) {
        Map<String, Object> record = baseNonAnswer();
        record.put("schema", "helix.minecraft.resident_decision.v1");
        record.put("profile_id", MinecraftViabilityGuardian.PROFILE_ID);
        record.put("artifact_version", MinecraftViabilityGuardian.ARTIFACT_VERSION);
        record.put("decision_sequence", decision.decisionSequence());
        record.put("observation_revision", decision.observationRevision());
        record.put("proposal", decision.proposal().name().toLowerCase(java.util.Locale.ROOT));
        record.put("reason_code", decision.reasonCode());
        record.put("arbiter_outcome", residentArbiterOutcome(decision));
        record.put("bounded_effect", residentBoundedEffect(decision));
        record.put("effect_applied", residentEffectApplied(decision));
        record.put("postcondition_status", residentPostconditionStatus(decision));
        record.put("controls_released", decision.controlsMustRelease());
        record.put("semantic_escalation_required", decision.semanticEscalationRequired());
        record.put("measurements", decision.measurements());
        record.put("clock", clockSnapshot());
        record.put("created_at", Instant.now().toString());
        logger.info("HELIX_MINECRAFT_RESIDENT_DECISION {}", HelixJson.stringify(record));

        if (!config.ready() || http == null || !manifestReady || !heartbeatReady) return;
        long sequence = ++latestEventSequence;
        Map<String, Object> batch = residentEnvironmentEventBatch(decision, sequence);
        if (!deliveryOutbox.enqueueSequence(List.of(
            new PlayerActionDeliveryOutbox.Delivery(
                PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
                batch
            )
        ), RESERVED_TERMINAL_DELIVERIES)) {
            recordTransportError("resident_event_delivery_outbox_full");
            bridge.disarmViabilityGuardian();
            bridge.releaseAll();
            return;
        }
        scheduleDeliveryFlush();
    }

    String startLocalDiagnostic(
        String actionKind,
        Map<String, Object> arguments,
        long maxDurationTicks
    ) {
        return startLocalDiagnostic(
            actionKind,
            arguments,
            maxDurationTicks,
            "native_fabric",
            null
        );
    }

    String startLocalDiagnostic(
        String actionKind,
        Map<String, Object> arguments,
        long maxDurationTicks,
        String controlEngine
    ) {
        return startLocalDiagnostic(
            actionKind,
            arguments,
            maxDurationTicks,
            controlEngine,
            null
        );
    }

    String startLocalDiagnostic(
        String actionKind,
        Map<String, Object> arguments,
        long maxDurationTicks,
        String controlEngine,
        String stagingRequestRef
    ) {
        if (minecraft.player == null || minecraft.getConnection() == null) {
            return "Helix direct diagnostics require an active Minecraft world connection.";
        }
        if (emergencyStopLatched) {
            return "Helix direct diagnostics are unavailable while the local emergency stop is latched.";
        }
        if (activeEnvelope != null || localDiagnosticEnvelope != null ||
            controller.activeWorkflowId() != null) {
            return "Helix cannot start a direct diagnostic while another player workflow is active.";
        }
        if (!directDiagnosticActionAllowed(actionKind)) {
            return "Helix direct diagnostics do not expose that action kind.";
        }
        if (!List.of("native_fabric", "baritone").contains(controlEngine)) {
            return "Helix direct diagnostics do not expose that control engine.";
        }
        if ("baritone".equals(controlEngine) && !"navigate_to".equals(actionKind)) {
            return "Helix direct diagnostics expose Baritone only for navigation.";
        }
        String actionRequestId = id("direct_player_action_request");
        String workflowId = id("direct_player_action_workflow");
        Map<String, Object> executionArguments = new LinkedHashMap<>(arguments);
        if ("arm_viability_guardian".equals(actionKind)) {
            executionArguments.put(
                "lease_expires_tick",
                ticks + Math.max(200, number(executionArguments, "duration_ticks").longValue())
            );
        }
        PlayerSnapshot initialSnapshot = bridge.snapshot();
        Map<String, Object> startingState = new LinkedHashMap<>();
        startingState.put("connected", initialSnapshot.connected());
        startingState.put("x", initialSnapshot.x());
        startingState.put("y", initialSnapshot.y());
        startingState.put("z", initialSnapshot.z());
        startingState.put("yaw", initialSnapshot.yaw());
        startingState.put("pitch", initialSnapshot.pitch());
        startingState.put("health", initialSnapshot.health());
        startingState.put("on_ground", initialSnapshot.onGround());
        startingState.putAll(bridge.compactFluidState());
        LocalDiagnosticEnvelope diagnostic = new LocalDiagnosticEnvelope(
            actionRequestId,
            workflowId,
            actionKind,
            Map.copyOf(executionArguments),
            controlEngine,
            stagingRequestRef,
            Map.copyOf(startingState),
            Instant.now().toString(),
            clockSnapshot()
        );
        localDiagnosticEnvelope = diagnostic;
        ActionRequest request = new ActionRequest(
            actionRequestId,
            workflowId,
            actionKind,
            executionArguments,
            Math.max(1, Math.min(36_000, maxDurationTicks)),
            ManualOverridePolicy.CANCEL,
            controlEngine
        );
        if (!controller.start(request)) {
            localDiagnosticEnvelope = null;
            return "Helix could not start the direct diagnostic because the player controller is busy.";
        }
        Map<String, Object> record = localDiagnosticBase(diagnostic);
        record.put("schema", "helix.minecraft.player.direct_diagnostic_request.v1");
        record.put("event_type", "diagnostic.requested");
        record.put("max_duration_ticks", request.maxDurationTicks());
        logger.info("HELIX_PLAYER_DIRECT_DIAGNOSTIC {}", HelixJson.stringify(record));
        return "Helix started direct diagnostic " + workflowId + " for " + actionKind + ".";
    }

    String cancelLocalDiagnostic() {
        LocalDiagnosticEnvelope diagnostic = localDiagnosticEnvelope;
        if (diagnostic == null) return "No Helix direct diagnostic is running.";
        if (!controller.cancel(
            diagnostic.workflowId(),
            "The local operator canceled the direct diagnostic."
        )) {
            return "The Helix direct diagnostic was no longer running.";
        }
        return "Helix canceled the direct diagnostic and released every asserted control.";
    }

    void localEmergencyStop(String reason) {
        emergencyStopLatched = true;
        bridge.disarmViabilityGuardian();
        controller.emergencyStop(reason);
        bridge.releaseAll();
        if (http != null) network.execute(this::publishHeartbeat);
    }

    PlayerActionController controllerForIntegration() {
        return controller;
    }

    private boolean connectedIdentityMatches() {
        return minecraft.player != null &&
            minecraft.getConnection() != null &&
            minecraft.player.getUUID().toString().equalsIgnoreCase(config.subjectNativeId());
    }

    private void publishManifest() {
        try {
            PlayerActionHttpClient.Response response = http.post("/manifest", manifest());
            manifestReady = response.ok();
            if (!response.ok()) {
                heartbeatReady = false;
                recordTransportError(response.error());
            } else {
                clearTransportErrorIfDeliveryComplete();
                // Establish a fresh active heartbeat before the first work poll.
                // Otherwise the broker correctly rejects the poll as stale and
                // the transient bootstrap error can become self-sustaining.
                publishHeartbeat();
            }
        } catch (Exception error) {
            manifestReady = false;
            heartbeatReady = false;
            recordTransportError("manifest_unreachable");
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
        }
    }

    private void publishHeartbeat() {
        try {
            PlayerActionHttpClient.Response response = http.post("/heartbeat", heartbeat());
            heartbeatReady = response.ok();
            if (!response.ok()) {
                recordTransportError(response.error());
                if (heartbeatFailureRequiresManifestRepublish(response.error())) {
                    // A deferred/local server restore can legitimately forget
                    // the most recently admitted manifest while this connector
                    // remains alive. Re-enter manifest admission before any
                    // further action poll; never replay an action.
                    manifestReady = false;
                } else if (requiresFreshProducerEpoch(response.error())) {
                    if (rotateEvidenceEpochIfIdle()) {
                        publishManifest();
                    } else {
                        eventStreamResyncRequired = true;
                        bridge.releaseAll();
                    }
                }
            } else clearTransportErrorIfDeliveryComplete();
        } catch (Exception error) {
            heartbeatReady = false;
            recordTransportError("heartbeat_unreachable");
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
        }
    }

    private boolean rotateEvidenceEpochIfIdle() {
        if (!evidenceEpochRotationAllowed(
            controller.activeWorkflowId() != null,
            activeEnvelope != null,
            !deliveryOutbox.isEmpty()
        )) return false;
        producerEpochRef = id("environment_action_epoch");
        manifestId = id("environment_action_manifest");
        latestEventSequence = -1;
        manifestReady = false;
        heartbeatReady = false;
        eventStreamResyncRequired = false;
        logger.warn(
            "Helix player-action evidence cursor changed across server persistence; publishing a fresh producer epoch without replaying an action."
        );
        return true;
    }

    private void pollControlsThenActions() {
        try {
            PlayerActionHttpClient.Response controls = http.get("/controls/pending?limit=4");
            if (!controls.ok()) {
                recordTransportError(controls.error());
                return;
            }
            for (Object value : HelixJson.asList(controls.body().get("control_requests"))) {
                Map<String, Object> control = HelixJson.asObject(value);
                Map<String, Object> result = runOnClient(() -> applyControl(control));
                PlayerActionHttpClient.Response submitted = http.post("/controls/result", result);
                if (!submitted.ok()) {
                    recordTransportError(submitted.error());
                    return;
                }
            }
            flushDeliveryOutbox();
            if (
                emergencyStopLatched ||
                activeEnvelope != null ||
                localDiagnosticEnvelope != null ||
                !deliveryOutbox.isEmpty()
            ) return;
            PlayerActionHttpClient.Response actions = http.get("/requests/pending?limit=1");
            if (!actions.ok()) {
                recordTransportError(actions.error());
                return;
            }
            List<Object> requests = HelixJson.asList(actions.body().get("action_requests"));
            if (!requests.isEmpty()) {
                Map<String, Object> request = HelixJson.asObject(requests.get(0));
                // A successful leased-work poll is the control-plane contact
                // that authorizes this exact local action to begin. Do not let
                // an older, already-recovered transport error cancel it.
                clearTransportError();
                runOnClient(() -> {
                    accept(request);
                    return Boolean.TRUE;
                });
            }
            clearTransportErrorIfDeliveryComplete();
        } catch (Exception error) {
            recordTransportError("action_poll_unreachable");
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
        }
    }

    private void accept(Map<String, Object> wire) {
        String requestedEngine = text(wire, "requested_control_engine");
        String resolvedEngine = "baritone".equals(requestedEngine)
            ? "baritone"
            : "native_fabric";
        if (!bridge.supportsControlEngine(resolvedEngine)) {
            submitWithoutExecution(wire, "control_engine_unavailable", "The requested control engine is not installed in this Fabric client.");
            return;
        }
        try {
            Map<String, Object> constraints = object(wire.get("constraints"));
            long maxDurationMs = number(constraints, "max_duration_ms").longValue();
            Map<String, Object> arguments = object(wire.get("arguments"));
            if ("arm_viability_guardian".equals(text(wire, "action_kind"))) {
                arguments.put(
                    "lease_expires_tick",
                    ticks + Math.max(200, number(arguments, "duration_ticks").longValue())
                );
            }
            ActionRequest request = new ActionRequest(
                textRequired(wire, "action_request_id"),
                textRequired(wire, "workflow_id"),
                textRequired(wire, "action_kind"),
                arguments,
                Math.max(1, Math.min(36_000, (maxDurationMs + 49) / 50)),
                ManualOverridePolicy.fromWire(text(constraints, "manual_override_policy")),
                resolvedEngine
            );
            ActiveEnvelope envelope = new ActiveEnvelope(
                new LinkedHashMap<>(wire),
                id("environment_action_execution"),
                Instant.now().toString(),
                clockSnapshot(),
                resolvedEngine,
                new ArrayList<>()
            );
            activeEnvelope = envelope;
            if (!controller.start(request)) {
                activeEnvelope = null;
                submitWithoutExecution(wire, "duplicate_request", "Another player workflow is already active.");
            }
        } catch (RuntimeException error) {
            activeEnvelope = null;
            submitWithoutExecution(wire, "capability_unavailable", "The admitted player request could not be interpreted by this connector version.");
        }
    }

    private Map<String, Object> applyControl(Map<String, Object> control) {
        String kind = text(control, "control_kind");
        String workflowId = nullableText(control.get("workflow_id"));
        boolean completed;
        boolean release = Boolean.TRUE.equals(control.get("release_all_controls"));
        if ("emergency_stop".equals(kind)) {
            emergencyStopLatched = true;
            completed = controller.emergencyStop(text(control, "reason"));
            bridge.releaseAll();
            release = true;
        } else if ("cancel".equals(kind)) {
            completed = workflowId != null && controller.cancel(workflowId, text(control, "reason"));
            bridge.releaseAll();
            release = true;
        } else if ("resume".equals(kind)) {
            completed = workflowId != null && controller.resume(workflowId);
        } else {
            completed = workflowId != null && workflowId.equals(controller.activeWorkflowId());
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schema", "helix.environment_action.control_result.v1");
        result.put("control_request_id", textRequired(control, "control_request_id"));
        result.put("control_kind", kind);
        result.put("outcome", completed ? "completed" : "not_running");
        result.put("summary", completed
            ? "The Fabric client applied the requested workflow control."
            : "The exact workflow was not running in this Fabric client.");
        result.put("affected_workflow_ids", completed && workflowId != null ? List.of(workflowId) : List.of());
        result.put("workflow_state", completed ? wireState(controller.state()) : null);
        result.put("controls_released", release);
        result.put("evidence_refs", List.of());
        result.put("completed_at", Instant.now().toString());
        result.put("host_access_performed", false);
        result.put("model_invoked", false);
        result.put("assistant_answer", false);
        result.put("raw_content_included", false);
        return result;
    }

    private void onWorkflowEvent(WorkflowEvent event) {
        LocalDiagnosticEnvelope diagnostic = localDiagnosticEnvelope;
        if (
            diagnostic != null &&
            event.workflowId().equals(diagnostic.workflowId())
        ) {
            onLocalDiagnosticEvent(diagnostic, event);
            return;
        }
        ActiveEnvelope envelope = activeEnvelope;
        if (envelope == null || !event.workflowId().equals(text(envelope.wire(), "workflow_id"))) return;
        String eventId = id("environment_action_event");
        long environmentEventSequence = ++latestEventSequence;
        manualInputDetected = manualInputDetected || event.manualOverrideDetected();
        envelope.progressEventRefs().add(eventId);
        Map<String, Object> payload = baseNonAnswer();
        payload.put("schema", "helix.environment_action.workflow_event.v1");
        payload.put("event_id", eventId);
        payload.put("action_request_id", text(envelope.wire(), "action_request_id"));
        payload.put("workflow_id", event.workflowId());
        payload.put("sequence", event.sequence());
        payload.put("event_type", event.eventType());
        payload.put("workflow_state", wireState(event.state()));
        payload.put("progress_fraction", event.progressFraction());
        payload.put("summary", event.summary());
        payload.put("control_engine", envelope.controlEngine());
        payload.put("measurements", event.measurements());
        payload.put("clock", clockSnapshot());
        payload.put("evidence_refs", List.of());
        payload.put("manual_override_detected", event.manualOverrideDetected());
        payload.put("controls_released", event.controlsReleased());
        payload.put("created_at", Instant.now().toString());
        payload.put("content_role", "environment_action_event_not_assistant_answer");
        Map<String, Object> eventBatch = environmentEventBatch(
            envelope,
            event,
            eventId,
            environmentEventSequence
        );

        boolean terminal = terminal(event.state());
        Map<String, Object> settledResult = terminal
            ? result(
                envelope.wire(),
                envelope.actionExecutionId(),
                envelope.startedAt(),
                envelope.startedClock(),
                outcome(event.state()),
                event.summary(),
                envelope.progressEventRefs(),
                event.state() == State.SUCCEEDED,
                event.manualOverrideDetected(),
                event.measurements()
            )
            : null;
        if (terminal) activeEnvelope = null;
        List<PlayerActionDeliveryOutbox.Delivery> deliveries = new ArrayList<>();
        deliveries.add(new PlayerActionDeliveryOutbox.Delivery(
            PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
            payload
        ));
        deliveries.add(new PlayerActionDeliveryOutbox.Delivery(
            PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
            eventBatch
        ));
        if (settledResult != null) {
            deliveries.add(new PlayerActionDeliveryOutbox.Delivery(
                PlayerActionDeliveryOutbox.Stage.ACTION_RESULT,
                settledResult
            ));
        }
        int reserve = terminal ? 0 : RESERVED_TERMINAL_DELIVERIES;
        if (!deliveryOutbox.enqueueSequence(deliveries, reserve)) {
            recordTransportError("action_delivery_outbox_full");
            emergencyStopLatched = true;
            minecraft.execute(() -> controller.emergencyStop(
                "The bounded evidence outbox filled; controls were released rather than losing workflow provenance."
            ));
            return;
        }
        logger.debug(
            "Helix player-action delivery queued: stage={} pending={}",
            deliveries.get(0).stage().diagnosticName(),
            deliveryOutbox.size()
        );
        scheduleDeliveryFlush();
    }

    private void onLocalDiagnosticEvent(
        LocalDiagnosticEnvelope diagnostic,
        WorkflowEvent event
    ) {
        Map<String, Object> record = localDiagnosticBase(diagnostic);
        record.put("schema", "helix.minecraft.player.direct_diagnostic_event.v1");
        record.put("event_type", event.eventType());
        record.put("sequence", event.sequence());
        record.put("workflow_state", wireState(event.state()));
        record.put("progress_fraction", event.progressFraction());
        record.put("summary", event.summary());
        record.put("measurements", event.measurements());
        record.put("clock", clockSnapshot());
        record.put("manual_override_detected", event.manualOverrideDetected());
        record.put("controls_released", event.controlsReleased());
        record.put("created_at", Instant.now().toString());
        logger.info("HELIX_PLAYER_DIRECT_DIAGNOSTIC {}", HelixJson.stringifyIncludingNulls(record));
        if (terminal(event.state())) {
            localDiagnosticEnvelope = null;
            localDiagnosticMessage.accept(
                "Helix direct diagnostic " + wireState(event.state()) +
                ": " + event.summary() + " Measurements: " +
                HelixJson.stringify(event.measurements())
            );
        }
    }

    private Map<String, Object> localDiagnosticBase(
        LocalDiagnosticEnvelope diagnostic
    ) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("lane", "direct_codex_reference");
        record.put("action_request_id", diagnostic.actionRequestId());
        record.put("workflow_id", diagnostic.workflowId());
        record.put("action_kind", diagnostic.actionKind());
        record.put("arguments", diagnostic.arguments());
        record.put("starting_state", diagnostic.startingState());
        record.put("started_at", diagnostic.startedAt());
        record.put("started_clock", diagnostic.startedClock());
        record.put("control_engine", diagnostic.controlEngine());
        record.put("staging_request_ref", diagnostic.stagingRequestRef());
        record.put("admission_status", "local_operator_diagnostic");
        record.put("helix_terminal_authority_status", "not_applicable");
        record.put("assistant_answer", false);
        record.put("terminal_eligible", false);
        record.put("raw_content_included", false);
        return record;
    }

    private void scheduleDeliveryFlush() {
        if (!deliveryFlushPending.compareAndSet(false, true)) return;
        network.execute(() -> {
            try {
                flushDeliveryOutbox();
            } finally {
                deliveryFlushPending.set(false);
            }
        });
    }

    private boolean flushDeliveryOutbox() {
        while (!deliveryOutbox.isEmpty()) {
            PlayerActionDeliveryOutbox.Delivery delivery = deliveryOutbox.peek();
            try {
                PlayerActionHttpClient.Response receipt = http.post(
                    delivery.stage().endpointSuffix(),
                    delivery.payload()
                );
                if (!receipt.ok()) {
                    String transportError = PlayerActionDeliveryOutbox.transportErrorCode(
                        delivery.stage(),
                        receipt.statusCode(),
                        receipt.error()
                    );
                    recordTransportError(transportError);
                    if (requiresFreshProducerEpoch(transportError)) {
                        eventStreamResyncRequired = true;
                        bridge.releaseAll();
                        logger.error(
                            "Helix player-action evidence stream requires a fresh pairing; controls were released and no further actions will be polled."
                        );
                        network.execute(this::publishHeartbeat);
                    }
                    return false;
                }
                deliveryOutbox.acknowledge(delivery);
                logger.debug(
                    "Helix player-action delivery acknowledged: stage={} pending={}",
                    delivery.stage().diagnosticName(),
                    deliveryOutbox.size()
                );
            } catch (Exception error) {
                recordTransportError(
                    "action_delivery_" + delivery.stage().diagnosticName() + "_unreachable"
                );
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                return false;
            }
        }
        clearTransportError();
        return true;
    }

    private Map<String, Object> environmentEventBatch(
        ActiveEnvelope envelope,
        WorkflowEvent workflowEvent,
        String actionEventId,
        long sequence
    ) {
        String observedAt = Instant.now().toString();
        PlayerActionWorkflow.PlayerSnapshot snapshot = bridge.snapshot();
        Map<String, Object> actor = new LinkedHashMap<>();
        actor.put("connected", snapshot.connected());
        actor.put("position", Map.of(
            "x", snapshot.x(),
            "y", snapshot.y(),
            "z", snapshot.z()
        ));
        actor.put("eye_y", snapshot.eyeY());
        actor.put("yaw", snapshot.yaw());
        actor.put("pitch", snapshot.pitch());
        actor.put("on_ground", snapshot.onGround());
        actor.put("horizontal_collision", snapshot.horizontalCollision());

        Map<String, Object> activeWorkflow = new LinkedHashMap<>();
        activeWorkflow.put("workflow_ref", workflowEvent.workflowId());
        activeWorkflow.put("action_kind", text(envelope.wire(), "action_kind"));
        activeWorkflow.put("workflow_state", wireState(workflowEvent.state()));
        if (workflowEvent.progressFraction() != null) {
            activeWorkflow.put("progress_fraction", workflowEvent.progressFraction());
        }
        activeWorkflow.put("manual_override_detected", workflowEvent.manualOverrideDetected());
        activeWorkflow.put("controls_released", workflowEvent.controlsReleased());

        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("actor", actor);
        attributes.put("active_workflow", activeWorkflow);
        attributes.put("workflow_measurements", workflowEvent.measurements());
        attributes.put("clock", clockSnapshot());
        attributes.put("action_event_ref", actionEventId);

        String streamEventId = id("environment_event");
        Map<String, Object> streamEvent = baseNonAnswer();
        streamEvent.put("schema", "helix.environment_event.v1");
        streamEvent.put("event_id", streamEventId);
        streamEvent.put("sequence", sequence);
        streamEvent.put("event_type", workflowEvent.eventType());
        streamEvent.put("producer_plane", "player_embodiment");
        streamEvent.put("domain", "minecraft");
        streamEvent.put("domain_adapter", config.domainAdapter());
        streamEvent.put("room_id", config.roomId());
        streamEvent.put("source_id", config.sourceId());
        streamEvent.put("world_id", config.worldId());
        streamEvent.put("producer_epoch_ref", producerEpochRef);
        streamEvent.put("subject_ref", config.subjectBindingId());
        streamEvent.put("workflow_ref", workflowEvent.workflowId());
        streamEvent.put("summary", workflowEvent.summary());
        streamEvent.put("attributes", attributes);
        streamEvent.put("evidence_refs", List.of(actionEventId));
        streamEvent.put("occurred_at", observedAt);
        streamEvent.put("observed_at", observedAt);
        streamEvent.put("provenance", "measured");
        streamEvent.put("raw_event_included", false);
        streamEvent.put("content_role", "environment_event_not_assistant_answer");

        Map<String, Object> batch = baseNonAnswer();
        batch.put("schema", "helix.environment_event_batch.v1");
        batch.put("batch_id", id("environment_event_batch"));
        batch.put("room_id", config.roomId());
        batch.put("source_id", config.sourceId());
        batch.put("world_id", config.worldId());
        batch.put("producer_epoch_ref", producerEpochRef);
        batch.put("producer_plane", "player_embodiment");
        batch.put("first_sequence", sequence);
        batch.put("last_sequence", sequence);
        batch.put("events", List.of(streamEvent));
        batch.put("created_at", observedAt);
        batch.put("content_role", "environment_event_batch_not_assistant_answer");
        batch.put("batch_hash", SectionHasher.hashIncludingNulls(batch));
        return batch;
    }

    private Map<String, Object> residentEnvironmentEventBatch(
        MinecraftViabilityGuardian.Decision decision,
        long sequence
    ) {
        String observedAt = Instant.now().toString();
        String eventId = id("environment_event");
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("resident_decision", Map.ofEntries(
            Map.entry("profile_id", MinecraftViabilityGuardian.PROFILE_ID),
            Map.entry("artifact_version", MinecraftViabilityGuardian.ARTIFACT_VERSION),
            Map.entry("decision_sequence", decision.decisionSequence()),
            Map.entry("observation_revision", decision.observationRevision()),
            Map.entry("proposal", decision.proposal().name().toLowerCase(java.util.Locale.ROOT)),
            Map.entry("reason_code", decision.reasonCode()),
            Map.entry("arbiter_outcome", residentArbiterOutcome(decision)),
            Map.entry("bounded_effect", residentBoundedEffect(decision)),
            Map.entry("effect_applied", residentEffectApplied(decision)),
            Map.entry("postcondition_status", residentPostconditionStatus(decision)),
            Map.entry("controls_released", decision.controlsMustRelease()),
            Map.entry("semantic_escalation_required", decision.semanticEscalationRequired()),
            Map.entry("measurements", decision.measurements())
        ));
        attributes.put("clock", clockSnapshot());

        Map<String, Object> event = baseNonAnswer();
        event.put("schema", "helix.environment_event.v1");
        event.put("event_id", eventId);
        event.put("sequence", sequence);
        event.put("event_type", "resident.decision");
        event.put("producer_plane", "player_embodiment");
        event.put("domain", "minecraft");
        event.put("domain_adapter", config.domainAdapter());
        event.put("room_id", config.roomId());
        event.put("source_id", config.sourceId());
        event.put("world_id", config.worldId());
        event.put("producer_epoch_ref", producerEpochRef);
        event.put("subject_ref", config.subjectBindingId());
        event.put("workflow_ref", null);
        event.put("summary", "The deterministic resident Minecraft guardian recorded " + decision.reasonCode() + ".");
        event.put("attributes", attributes);
        event.put("evidence_refs", List.of());
        event.put("occurred_at", observedAt);
        event.put("observed_at", observedAt);
        event.put("provenance", "measured");
        event.put("raw_event_included", false);
        event.put("content_role", "environment_event_not_assistant_answer");

        Map<String, Object> batch = baseNonAnswer();
        batch.put("schema", "helix.environment_event_batch.v1");
        batch.put("batch_id", id("environment_event_batch"));
        batch.put("room_id", config.roomId());
        batch.put("source_id", config.sourceId());
        batch.put("world_id", config.worldId());
        batch.put("producer_epoch_ref", producerEpochRef);
        batch.put("producer_plane", "player_embodiment");
        batch.put("first_sequence", sequence);
        batch.put("last_sequence", sequence);
        batch.put("events", List.of(event));
        batch.put("created_at", observedAt);
        batch.put("content_role", "environment_event_batch_not_assistant_answer");
        batch.put("batch_hash", SectionHasher.hashIncludingNulls(batch));
        return batch;
    }

    private static String residentArbiterOutcome(
        MinecraftViabilityGuardian.Decision decision
    ) {
        return switch (decision.proposal()) {
            case NONE -> "not_requested";
            case MONITOR_ADMITTED_RECOVERY -> "delegated_to_admitted_recovery";
            default -> "admitted";
        };
    }

    private static boolean residentEffectApplied(
        MinecraftViabilityGuardian.Decision decision
    ) {
        return decision.proposal() != MinecraftViabilityGuardian.ProposalKind.NONE &&
            decision.proposal() !=
                MinecraftViabilityGuardian.ProposalKind.MONITOR_ADMITTED_RECOVERY;
    }

    private static String residentBoundedEffect(
        MinecraftViabilityGuardian.Decision decision
    ) {
        return switch (decision.proposal()) {
            case NONE -> "none";
            case SWIM_UP -> "swim_up_input";
            case MONITOR_ADMITTED_RECOVERY -> "continue_admitted_recovery";
            case RELEASE_AND_ESCALATE, ABSTAIN_AND_ESCALATE -> "release_controls";
        };
    }

    private static String residentPostconditionStatus(
        MinecraftViabilityGuardian.Decision decision
    ) {
        return switch (decision.reasonCode()) {
            case "breathing_restored_surface_hold" -> "breathing_restored_surface_hold_active";
            case "water_exit_verified" -> "water_exit_verified";
            case "unsafe_landing_recovery_active" -> "admitted_fall_recovery_active";
            case "fire_recovery_program_active" -> "admitted_fire_recovery_active";
            case "fire_recovery_postcondition_observed" -> "fire_recovery_postcondition_observed";
            case "fall_recovery_verified" -> "fall_recovery_verified";
            case "fire_recovery_verified" -> "fire_recovery_verified";
            case "movement_blocked_requires_semantic_replan",
                 "unsafe_landing_requires_admitted_recovery",
                 "fire_pressure_requires_semantic_replan",
                 "lava_pressure_requires_semantic_replan",
                 "manual_override",
                 "emergency_stop",
                 "guardian_lease_expired",
                 "guardian_lease_expired_during_water_recovery" -> "controls_released";
            default -> "pending_or_not_applicable";
        };
    }

    private void submitWithoutExecution(Map<String, Object> wire, String outcome, String summary) {
        Map<String, Object> payload = result(
            wire,
            id("environment_action_execution"),
            null,
            null,
            outcome,
            summary,
            List.of(),
            false,
            false,
            Map.of()
        );
        PlayerActionDeliveryOutbox.Delivery delivery =
            new PlayerActionDeliveryOutbox.Delivery(
                PlayerActionDeliveryOutbox.Stage.ACTION_RESULT,
                payload
            );
        if (!deliveryOutbox.enqueueSequence(List.of(delivery), 0)) {
            recordTransportError("action_delivery_outbox_full");
            return;
        }
        scheduleDeliveryFlush();
    }

    private Map<String, Object> result(
        Map<String, Object> wire,
        String executionId,
        String startedAt,
        Map<String, Object> startedClock,
        String outcome,
        String summary,
        List<String> eventRefs,
        boolean postconditionsSatisfied,
        boolean manualOverride,
        Map<String, Object> measurements
    ) {
        String actionKind = text(wire, "action_kind");
        List<Map<String, Object>> postconditions = new ArrayList<>();
        for (Object value : list(wire.get("postconditions"))) {
            Map<String, Object> condition = object(value);
            Map<String, Object> checked = new LinkedHashMap<>();
            checked.put("condition_id", textRequired(condition, "condition_id"));
            checked.put("condition_kind", textRequired(condition, "condition_kind"));
            checked.put("required", Boolean.TRUE.equals(condition.get("required")));
            checked.put("status", postconditionsSatisfied ? "satisfied" : "not_checked");
            checked.put("summary", postconditionsSatisfied
                ? "The native Fabric executor completed its action-specific postcondition check."
                : "The workflow did not complete, so this postcondition was not claimed as satisfied.");
            checked.put("evidence_refs", List.copyOf(eventRefs));
            checked.put("checked_at", Instant.now().toString());
            postconditions.add(checked);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schema", "helix.environment_action.result.v1");
        result.put("action_request_id", textRequired(wire, "action_request_id"));
        result.put("workflow_id", textRequired(wire, "workflow_id"));
        result.put("action_execution_id", executionId);
        result.put("capability_id", textRequired(wire, "capability_id"));
        result.put("capability_version", number(wire, "capability_version").intValue());
        result.put("action_kind", actionKind);
        result.put("outcome", outcome);
        result.put("summary", summary);
        result.put("control_engine", startedAt == null
            ? "none"
            : "baritone".equals(text(wire, "requested_control_engine"))
                ? "baritone"
                : "native_fabric");
        result.put("started_at", startedAt);
        result.put("completed_at", Instant.now().toString());
        result.put("progress_event_refs", List.copyOf(eventRefs));
        result.put("postconditions", postconditions);
        result.put("evidence_refs", List.copyOf(eventRefs));
        Map<String, Object> completedClock = clockSnapshot();
        result.put("started_clock", startedClock);
        result.put("completed_clock", completedClock);
        result.put(
            "duration_ticks",
            startedClock == null
                ? null
                : Math.max(
                    0,
                    longNumber(completedClock, "tick_index") -
                        longNumber(startedClock, "tick_index")
                )
        );
        boolean programKind = "execute_sequence".equals(actionKind) ||
            "execute_reactive_program".equals(actionKind);
        boolean motionKind = List.of(
            "navigate_to", "look_at", "track_target", "walk", "jump", "follow", "collect", "mine", "place"
        ).contains(actionKind) ||
            (programKind && Boolean.TRUE.equals(measurements.get("player_motion_performed")));
        boolean interactionKind = List.of(
            "interact", "mine", "place", "craft", "inventory_transfer"
        ).contains(actionKind) ||
            (programKind && Boolean.TRUE.equals(measurements.get("player_interaction_performed")));
        boolean directInventoryKind = List.of("hotbar_select", "equip").contains(actionKind) ||
            (programKind && Boolean.TRUE.equals(measurements.get("inventory_mutation_performed")));
        boolean measuredInventoryMutation =
            positiveMeasurement(measurements, "collected_count") ||
            positiveMeasurement(measurements, "produced_count") ||
            positiveMeasurement(measurements, "transferred_count") ||
            positiveMeasurement(measurements, "inventory_mutations_performed");
        boolean measuredWorldMutation = positiveMeasurement(
            measurements,
            "world_mutations_performed"
        );
        boolean executionStarted = startedAt != null;
        boolean actionAppliedBeforeManualOverride =
            !manualOverride || positiveMeasurement(
                measurements,
                "action_ticks_before_override"
            );
        boolean executionPerformed = effectExecutionPerformed(
            executionStarted,
            actionAppliedBeforeManualOverride,
            measurements
        );
        result.put(
            "side_effects_performed",
            executionPerformed && (
                motionKind || interactionKind || directInventoryKind ||
                measuredInventoryMutation || measuredWorldMutation
            )
        );
        result.put("player_motion_performed", motionKind && executionPerformed);
        result.put("player_interaction_performed", interactionKind && executionPerformed);
        result.put(
            "inventory_mutation_performed",
            executionPerformed && (
                directInventoryKind || measuredInventoryMutation
            )
        );
        result.put("world_mutation_performed", executionPerformed && measuredWorldMutation);
        result.put("manual_override_detected", manualOverride);
        result.put(
            "manual_override_reason",
            manualOverride ? measurements.get("manual_input_reason") : null
        );
        result.put("controls_released", true);
        result.put("host_access_performed", false);
        result.put("automatic_replay_performed", false);
        result.put("model_invoked", false);
        result.put("assistant_answer", false);
        result.put("raw_content_included", false);
        return result;
    }

    static boolean effectExecutionPerformed(
        boolean executionStarted,
        boolean actionAppliedBeforeManualOverride,
        Map<String, Object> measurements
    ) {
        return executionStarted &&
            actionAppliedBeforeManualOverride &&
            !Boolean.TRUE.equals(measurements.get("effect_prevented"));
    }

    private Map<String, Object> manifest() {
        Map<String, Object> manifest = baseNonAnswer();
        manifest.put("schema", "helix.environment_action.connector_manifest.v1");
        manifest.put("manifest_id", manifestId);
        manifest.put("connector_installation_id", config.connectorInstallationId());
        manifest.put("producer_epoch_ref", producerEpochRef);
        manifest.put("action_authority_id", config.actionAuthorityId());
        manifest.put("environment_binding_id", config.environmentBindingId());
        manifest.put("room_id", config.roomId());
        manifest.put("source_id", config.sourceId());
        manifest.put("world_id", config.worldId());
        manifest.put("participant_id", config.participantId());
        manifest.put("subject_binding_id", config.subjectBindingId());
        manifest.put("subject_native_id", config.subjectNativeId());
        manifest.put("domain", "minecraft");
        manifest.put("domain_adapter", config.domainAdapter());
        manifest.put("adapter_profile_id", config.adapterProfileId());
        manifest.put("adapter_version", ADAPTER_VERSION);
        manifest.put("protocol_version", PROTOCOL_VERSION);
        manifest.put("capabilities", instanceCapabilities());
        List<Map<String, Object>> engines = new ArrayList<>();
        engines.add(Map.of(
            "control_engine", "native_fabric",
            "available", true,
            "version", "1"
        ));
        if (bridge.baritoneAvailable()) {
            engines.add(Map.of(
                "control_engine", "baritone",
                "available", true,
                "version", bridge.baritoneVersion(),
                "goal_forms", List.of("near_position"),
                "mutation_policy", "movement_only",
                "breaking_allowed", false,
                "placement_allowed", false,
                "inventory_mutation_allowed", false
            ));
        }
        manifest.put("available_control_engines", engines);
        manifest.put("safety_policy", Map.of(
            "manual_override_supported", true,
            "manual_override_policy", "cancel",
            "progress_observations_supported", true,
            "postcondition_verification_supported", true,
            "emergency_stop_supported", true,
            "release_controls_on_disconnect", true,
            "host_access_supported", false,
            "automatic_replay_supported", false,
            "model_execution_supported", false
        ));
        manifest.put("created_at", Instant.now().toString());
        manifest.put("credential_included", false);
        manifest.put("content_role", "environment_action_connector_manifest_not_assistant_answer");
        return manifest;
    }

    private Map<String, Object> heartbeat() {
        String workflow = controller.activeWorkflowId();
        boolean running = workflow != null && controller.state() == State.RUNNING;
        Map<String, Object> heartbeat = baseNonAnswer();
        heartbeat.put("schema", "helix.environment_action.connector_heartbeat.v1");
        heartbeat.put("heartbeat_id", id("environment_action_heartbeat"));
        heartbeat.put("manifest_id", manifestId);
        heartbeat.put("connector_installation_id", config.connectorInstallationId());
        heartbeat.put("producer_epoch_ref", producerEpochRef);
        heartbeat.put("action_authority_id", config.actionAuthorityId());
        heartbeat.put("environment_binding_id", config.environmentBindingId());
        heartbeat.put("room_id", config.roomId());
        heartbeat.put("source_id", config.sourceId());
        heartbeat.put("world_id", config.worldId());
        heartbeat.put("participant_id", config.participantId());
        heartbeat.put("subject_binding_id", config.subjectBindingId());
        heartbeat.put(
            "status",
            connectorHeartbeatStatus(
                emergencyStopLatched,
                eventStreamResyncRequired,
                lastTransportError
            )
        );
        heartbeat.put("active_workflow_ids", workflow == null ? List.of() : List.of(workflow));
        heartbeat.put(
            "controls_asserted",
            running && !emergencyStopLatched && !eventStreamResyncRequired
        );
        heartbeat.put("manual_input_detected", manualInputDetected);
        heartbeat.put("emergency_stop_latched", emergencyStopLatched);
        List<Map<String, Object>> engineStates = new ArrayList<>();
        String activeEngine = activeEnvelope == null
            ? ""
            : activeEnvelope.controlEngine();
        Map<String, Object> nativeEngine = new LinkedHashMap<>();
        nativeEngine.put("control_engine", "native_fabric");
        nativeEngine.put("status", running && "native_fabric".equals(activeEngine) ? "busy" : "available");
        nativeEngine.put("last_error", lastTransportError.isBlank() ? null : lastTransportError);
        engineStates.add(nativeEngine);
        if (bridge.baritoneAvailable()) {
            BaritoneFacade.Status status = bridge.baritoneStatus();
            Map<String, Object> baritoneEngine = new LinkedHashMap<>();
            baritoneEngine.put("control_engine", "baritone");
            baritoneEngine.put("status", status.pathState().name().toLowerCase());
            baritoneEngine.put("goal_owned", status.goalOwned());
            baritoneEngine.put("process_active", status.processActive());
            baritoneEngine.put("mutation_policy", "movement_only");
            baritoneEngine.put("mutation_policy_intact", status.mutationPolicyIntact());
            baritoneEngine.put("safe_cancel_last_result", status.safeCancelLastResult());
            baritoneEngine.put("last_error", status.lastError().isBlank() ? null : status.lastError());
            if (status.estimatedTicksToGoal() != null) {
                baritoneEngine.put("estimated_ticks_to_goal", status.estimatedTicksToGoal());
            }
            engineStates.add(baritoneEngine);
        }
        heartbeat.put("control_engines", engineStates);
        heartbeat.put("latest_event_sequence", latestEventSequence < 0 ? null : latestEventSequence);
        heartbeat.put("clock", clockSnapshot());
        heartbeat.put("evidence_refs", List.of());
        heartbeat.put("created_at", Instant.now().toString());
        heartbeat.put("credential_included", false);
        heartbeat.put("content_role", "environment_action_connector_heartbeat_not_assistant_answer");
        return heartbeat;
    }

    private List<Map<String, Object>> instanceCapabilities() {
        List<Map<String, Object>> capabilities = new ArrayList<>();
        capabilities.add(capability(
            "com.casimirbot.minecraft.player.navigate",
            "navigate_to",
            "continuous_control",
            List.of("long_running"),
            bridge.baritoneAvailable() ? List.of("native_fabric", "baritone") : List.of("native_fabric"),
            false
        ));
        capabilities.addAll(List.of(
            capability("com.casimirbot.minecraft.player.look", "look_at", "player_motion", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.camera.track", "track_target", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.walk", "walk", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.jump", "jump", "player_motion", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.interact", "interact", "player_interaction", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.combat.attack", "attack", "player_interaction", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.hotbar.select", "hotbar_select", "player_inventory", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.equipment.equip", "equip", "player_inventory", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.follow", "follow", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.collect", "collect", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.mine", "mine", "world_mutation", List.of("long_running"), List.of("native_fabric"), true),
            capability("com.casimirbot.minecraft.player.place", "place", "world_mutation", List.of("long_running"), List.of("native_fabric"), true),
            capability("com.casimirbot.minecraft.player.craft", "craft", "player_inventory", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.inventory.transfer", "inventory_transfer", "player_inventory", List.of("long_running")),
            capability(
                "com.casimirbot.minecraft.player.sequence.execute",
                "execute_sequence",
                "continuous_control",
                List.of("long_running"),
                List.of("native_fabric"),
                true
            ),
            capability(
                "com.casimirbot.minecraft.player.guardian.execute",
                "execute_reactive_program",
                "continuous_control",
                List.of("long_running"),
                List.of("native_fabric"),
                true
            ),
            capability(
                "com.casimirbot.minecraft.player.viability_guardian.arm",
                "arm_viability_guardian",
                "continuous_control",
                List.of("single_action"),
                List.of("native_fabric"),
                false
            ),
            capability(
                "com.casimirbot.minecraft.player.viability_guardian.disarm",
                "disarm_viability_guardian",
                "continuous_control",
                List.of("single_action"),
                List.of("native_fabric"),
                false
            )
        ));
        return List.copyOf(capabilities);
    }

    private static Map<String, Object> capability(
        String capabilityId,
        String actionKind,
        String effectClass,
        List<String> modes
    ) {
        return capability(
            capabilityId,
            actionKind,
            effectClass,
            modes,
            List.of("native_fabric"),
            false
        );
    }

    private static Map<String, Object> capability(
        String capabilityId,
        String actionKind,
        String effectClass,
        List<String> modes,
        List<String> controlEngines,
        boolean mutationScopeRequired
    ) {
        return Map.of(
            "capability_id", capabilityId,
            "capability_version", 1,
            "action_kind", actionKind,
            "effect_class", effectClass,
            "workflow_modes", modes,
            "control_engines", controlEngines,
            "requires_world_mutation_scope", mutationScopeRequired,
            "requires_confirmation", true
        );
    }

    private <T> T runOnClient(java.util.concurrent.Callable<T> callable) throws Exception {
        CompletableFuture<T> future = new CompletableFuture<>();
        minecraft.execute(() -> {
            try {
                future.complete(callable.call());
            } catch (Throwable error) {
                future.completeExceptionally(error);
            }
        });
        return future.get();
    }

    private Map<String, Object> captureClockSnapshot(long clientTick) {
        Long worldTick = minecraft.level == null
            ? null
            : Math.max(0L, minecraft.level.getGameTime());
        Map<String, Object> clock = new LinkedHashMap<>();
        clock.put("schema", "helix.environment_clock_snapshot.v1");
        clock.put("clock_id", executionClockId);
        clock.put("clock_kind", "minecraft_game_tick");
        clock.put("tick_rate_hz", 20);
        clock.put("tick_index", Math.max(0L, clientTick));
        clock.put("world_tick_index", worldTick);
        clock.put(
            "synchronization",
            worldTick == null ? "client_local" : "server_synchronized"
        );
        clock.put("observed_at", Instant.now().toString());
        return Collections.unmodifiableMap(clock);
    }

    private Map<String, Object> clockSnapshot() {
        Map<String, Object> snapshot = latestClockSnapshot;
        return snapshot.isEmpty()
            ? captureClockSnapshot(Math.max(0L, ticks))
            : new LinkedHashMap<>(snapshot);
    }

    private void recordTransportError(String error) {
        if (!error.equals(lastTransportError)) {
            logger.warn("Helix player-action connector degraded: {}", error);
        }
        lastTransportError = error;
    }

    private void clearTransportError() {
        lastTransportError = "";
    }

    private void clearTransportErrorIfDeliveryComplete() {
        if (deliveryOutbox.isEmpty()) clearTransportError();
    }

    static boolean actionPollingReady(
        boolean manifestReady,
        boolean heartbeatReady
    ) {
        return manifestReady && heartbeatReady;
    }

    static boolean directDiagnosticActionAllowed(String actionKind) {
        return List.of(
            "navigate_to", "look_at", "track_target", "walk", "jump", "interact",
            "attack", "hotbar_select", "equip", "follow", "collect", "mine", "place",
            "craft", "inventory_transfer", "execute_sequence",
            "execute_reactive_program", "arm_viability_guardian",
            "disarm_viability_guardian"
        ).contains(actionKind);
    }

    static boolean activeControlPlaneFailureRequiresStop(
        boolean remoteActionActive,
        String activeWorkflowId,
        String transportError
    ) {
        return remoteActionActive &&
            activeWorkflowId != null &&
            transportError != null &&
            !transportError.isBlank();
    }

    static String connectorHeartbeatStatus(
        boolean emergencyStopLatched,
        boolean eventStreamResyncRequired,
        String previousTransportError
    ) {
        // Reaching the heartbeat endpoint is itself the recovery probe. A
        // previous poll/transport error remains diagnostic engine metadata but
        // must not make the recovery heartbeat fail the broker's active-status
        // gate forever.
        if (emergencyStopLatched) return "paused";
        if (eventStreamResyncRequired || requiresFreshProducerEpoch(previousTransportError)) {
            return "error";
        }
        return "active";
    }

    static boolean requiresFreshProducerEpoch(String transportError) {
        return transportError != null && (
            transportError.equals(
                "action_delivery_environment_event_batch_http_409_action_event_conflict"
            ) || transportError.equals("action_event_stream_resync_required")
        );
    }

    static boolean heartbeatFailureRequiresManifestRepublish(String error) {
        return "action_heartbeat_invalid".equals(error) ||
            "action_manifest_required".equals(error);
    }

    static boolean evidenceEpochRotationAllowed(
        boolean controllerWorkflowActive,
        boolean remoteEnvelopeActive,
        boolean deliveryPending
    ) {
        return !controllerWorkflowActive && !remoteEnvelopeActive && !deliveryPending;
    }

    private static String wireState(State state) {
        return state == null ? null : state.name().toLowerCase(java.util.Locale.ROOT);
    }

    private static String outcome(State state) {
        return switch (state) {
            case SUCCEEDED -> "succeeded";
            case CANCELED -> "request_canceled";
            case TIMED_OUT -> "workflow_timeout";
            case EMERGENCY_STOPPED -> "emergency_stopped";
            case CONNECTOR_OFFLINE -> "connector_offline";
            case PAUSED_MANUAL_OVERRIDE -> "manual_override";
            default -> "failed";
        };
    }

    private static boolean terminal(State state) {
        return state == State.CANCELED || state == State.SUCCEEDED ||
            state == State.FAILED || state == State.TIMED_OUT ||
            state == State.EMERGENCY_STOPPED || state == State.CONNECTOR_OFFLINE;
    }

    private static Map<String, Object> baseNonAnswer() {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("answer_authority", false);
        value.put("assistant_answer", false);
        value.put("terminal_eligible", false);
        value.put("raw_content_included", false);
        return value;
    }

    private static String id(String prefix) {
        return prefix + ":" + UUID.randomUUID();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        return value instanceof Map<?, ?> map
            ? new LinkedHashMap<>((Map<String, Object>) map)
            : new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> list(Object value) {
        return value instanceof List<?> list ? (List<Object>) list : List.of();
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof String text ? text.trim() : "";
    }

    private static String textRequired(Map<String, Object> map, String key) {
        String value = text(map, key);
        if (value.isBlank()) throw new IllegalArgumentException("Missing " + key);
        return value;
    }

    private static String nullableText(Object value) {
        return value instanceof String text && !text.isBlank() ? text.trim() : null;
    }

    private static Number number(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Number number)) throw new IllegalArgumentException("Missing " + key);
        return number;
    }

    private static long longNumber(Map<String, Object> map, String key) {
        return number(map, key).longValue();
    }

    private static boolean positiveMeasurement(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Number number && number.doubleValue() > 0;
    }

    @Override
    public void close() {
        emergencyStopLatched = true;
        controller.emergencyStop("The player-action connector stopped.");
        bridge.releaseAll();
        network.shutdownNow();
        if (http != null) http.close();
    }
}
