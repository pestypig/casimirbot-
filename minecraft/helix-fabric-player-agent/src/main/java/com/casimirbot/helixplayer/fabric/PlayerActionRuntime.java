package com.casimirbot.helixplayer.fabric;

import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.snapshot.SectionHasher;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ActionRequest;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.ManualOverridePolicy;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.State;
import com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.WorkflowEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import net.minecraft.client.Minecraft;
import org.slf4j.Logger;

final class PlayerActionRuntime implements AutoCloseable {
    private static final String PROTOCOL_VERSION = "helix.environment_action.v1";
    static final String ADAPTER_VERSION = "0.2.0";
    private static final int POLL_INTERVAL_TICKS = 20;
    private static final int HEARTBEAT_INTERVAL_TICKS = 100;
    private static final int MAX_PENDING_ENVIRONMENT_EVENT_BATCHES = 256;
    private static final int MAX_NONTERMINAL_PENDING_EVENT_BATCHES =
        MAX_PENDING_ENVIRONMENT_EVENT_BATCHES - 1;

    private record ActiveEnvelope(
        Map<String, Object> wire,
        String actionExecutionId,
        String startedAt,
        String controlEngine,
        List<String> progressEventRefs
    ) {}

    private final PlayerActionConfig config;
    private final Minecraft minecraft;
    private final Logger logger;
    private final NativeFabricControlBridge bridge;
    private final PlayerActionController controller;
    private final ExecutorService network;
    private final PlayerActionHttpClient http;
    private final String producerEpochRef = id("environment_action_epoch");
    private final String manifestId = id("environment_action_manifest");
    private final AtomicBoolean cyclePending = new AtomicBoolean(false);
    private final AtomicBoolean manifestPending = new AtomicBoolean(false);
    private volatile boolean manifestReady;
    private volatile boolean heartbeatReady;
    private volatile boolean emergencyStopLatched;
    private volatile boolean manualInputDetected;
    private volatile long latestEventSequence = -1;
    private volatile String lastTransportError = "";
    private volatile ActiveEnvelope activeEnvelope;
    private final Deque<Map<String, Object>> pendingEnvironmentEventBatches =
        new ArrayDeque<>();
    private long ticks;

    PlayerActionRuntime(
        PlayerActionConfig config,
        Minecraft minecraft,
        Logger logger
    ) {
        this.config = config;
        this.minecraft = minecraft;
        this.logger = logger;
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
        controller.tick();
        if (!config.ready() || http == null) return;
        ticks++;
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

    boolean ready() {
        return config.ready() && manifestReady && heartbeatReady && !emergencyStopLatched;
    }

    String statusText() {
        if (!config.ready()) return "Helix player embodiment is not paired.";
        if (emergencyStopLatched) return "Helix player embodiment is emergency-stopped; pair a fresh authority to resume.";
        if (!manifestReady) return "Helix player embodiment is paired and waiting for manifest admission.";
        if (!heartbeatReady) return "Helix player embodiment is paired and waiting for its first admitted heartbeat.";
        String workflow = controller.activeWorkflowId();
        return workflow == null
            ? "Helix player embodiment is active and idle."
            : "Helix player embodiment is running workflow " + workflow + ".";
    }

    void localEmergencyStop(String reason) {
        emergencyStopLatched = true;
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
                clearTransportError();
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
            if (!response.ok()) recordTransportError(response.error());
            else clearTransportError();
        } catch (Exception error) {
            heartbeatReady = false;
            recordTransportError("heartbeat_unreachable");
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
        }
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
            flushPendingEnvironmentEventBatches();
            if (
                emergencyStopLatched ||
                activeEnvelope != null ||
                !pendingEnvironmentEventBatches.isEmpty()
            ) return;
            PlayerActionHttpClient.Response actions = http.get("/requests/pending?limit=1");
            if (!actions.ok()) {
                recordTransportError(actions.error());
                return;
            }
            List<Object> requests = HelixJson.asList(actions.body().get("action_requests"));
            if (!requests.isEmpty()) {
                Map<String, Object> request = HelixJson.asObject(requests.get(0));
                runOnClient(() -> {
                    accept(request);
                    return Boolean.TRUE;
                });
            }
            clearTransportError();
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
            ActionRequest request = new ActionRequest(
                textRequired(wire, "action_request_id"),
                textRequired(wire, "workflow_id"),
                textRequired(wire, "action_kind"),
                object(wire.get("arguments")),
                Math.max(1, Math.min(36_000, (maxDurationMs + 49) / 50)),
                ManualOverridePolicy.fromWire(text(constraints, "manual_override_policy")),
                resolvedEngine
            );
            ActiveEnvelope envelope = new ActiveEnvelope(
                new LinkedHashMap<>(wire),
                id("environment_action_execution"),
                Instant.now().toString(),
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
        if (terminal) activeEnvelope = null;
        network.execute(() -> {
            try {
                PlayerActionHttpClient.Response eventReceipt = http.post("/requests/event", payload);
                if (!eventReceipt.ok()) {
                    recordTransportError(eventReceipt.error());
                    return;
                }
                int ceiling = terminal
                    ? MAX_PENDING_ENVIRONMENT_EVENT_BATCHES
                    : MAX_NONTERMINAL_PENDING_EVENT_BATCHES;
                if (pendingEnvironmentEventBatches.size() >= ceiling) {
                    recordTransportError("environment_event_backlog_full");
                    if (!terminal) {
                        emergencyStopLatched = true;
                        minecraft.execute(() -> controller.emergencyStop(
                            "The bounded evidence backlog filled; controls were released rather than losing workflow provenance."
                        ));
                    }
                    return;
                }
                pendingEnvironmentEventBatches.addLast(eventBatch);
                flushPendingEnvironmentEventBatches();
                if (terminal) submitSettledResult(envelope, event);
            } catch (Exception error) {
                recordTransportError("action_event_unreachable");
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            }
        });
    }

    private boolean flushPendingEnvironmentEventBatches() {
        while (!pendingEnvironmentEventBatches.isEmpty()) {
            Map<String, Object> batch = pendingEnvironmentEventBatches.peekFirst();
            try {
                PlayerActionHttpClient.Response receipt = http.post("/events/batch", batch);
                if (!receipt.ok()) {
                    recordTransportError(receipt.error());
                    return false;
                }
                pendingEnvironmentEventBatches.removeFirst();
            } catch (Exception error) {
                recordTransportError("environment_event_batch_unreachable");
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                return false;
            }
        }
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

    private void submitSettledResult(ActiveEnvelope envelope, WorkflowEvent event)
        throws java.io.IOException, InterruptedException {
        Map<String, Object> result = result(
            envelope.wire(),
            envelope.actionExecutionId(),
            envelope.startedAt(),
            outcome(event.state()),
            event.summary(),
            envelope.progressEventRefs(),
            event.state() == State.SUCCEEDED,
            event.manualOverrideDetected(),
            event.measurements()
        );
        PlayerActionHttpClient.Response response = http.post("/requests/result", result);
        if (!response.ok()) recordTransportError(response.error());
        else clearTransportError();
    }

    private void submitWithoutExecution(Map<String, Object> wire, String outcome, String summary) {
        network.execute(() -> {
            try {
                PlayerActionHttpClient.Response response = http.post(
                    "/requests/result",
                    result(
                        wire,
                        id("environment_action_execution"),
                        null,
                        outcome,
                        summary,
                        List.of(),
                        false,
                        false,
                        Map.of()
                    )
                );
                if (!response.ok()) recordTransportError(response.error());
            } catch (Exception error) {
                recordTransportError("action_result_unreachable");
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            }
        });
    }

    private Map<String, Object> result(
        Map<String, Object> wire,
        String executionId,
        String startedAt,
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
        boolean motionKind = List.of(
            "navigate_to", "look_at", "walk", "jump", "follow", "collect", "mine", "place"
        ).contains(actionKind);
        boolean interactionKind = List.of(
            "interact", "mine", "place", "craft", "inventory_transfer"
        ).contains(actionKind);
        boolean directInventoryKind = List.of("hotbar_select", "equip").contains(actionKind);
        boolean measuredInventoryMutation =
            positiveMeasurement(measurements, "collected_count") ||
            positiveMeasurement(measurements, "produced_count") ||
            positiveMeasurement(measurements, "transferred_count");
        boolean measuredWorldMutation = positiveMeasurement(
            measurements,
            "world_mutations_performed"
        );
        boolean executionStarted = startedAt != null;
        result.put(
            "side_effects_performed",
            executionStarted && (
                motionKind || interactionKind || directInventoryKind ||
                measuredInventoryMutation || measuredWorldMutation
            )
        );
        result.put("player_motion_performed", motionKind && executionStarted);
        result.put("player_interaction_performed", interactionKind && executionStarted);
        result.put(
            "inventory_mutation_performed",
            executionStarted && (
                directInventoryKind || measuredInventoryMutation
            )
        );
        result.put("world_mutation_performed", executionStarted && measuredWorldMutation);
        result.put("manual_override_detected", manualOverride);
        result.put("controls_released", true);
        result.put("host_access_performed", false);
        result.put("automatic_replay_performed", false);
        result.put("model_invoked", false);
        result.put("assistant_answer", false);
        result.put("raw_content_included", false);
        return result;
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
                "version", bridge.baritoneVersion()
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
            connectorHeartbeatStatus(emergencyStopLatched, lastTransportError)
        );
        heartbeat.put("active_workflow_ids", workflow == null ? List.of() : List.of(workflow));
        heartbeat.put("controls_asserted", running && !emergencyStopLatched);
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
            Map<String, Object> baritoneEngine = new LinkedHashMap<>();
            baritoneEngine.put("control_engine", "baritone");
            baritoneEngine.put("status", running && "baritone".equals(activeEngine) ? "busy" : "available");
            baritoneEngine.put("last_error", null);
            engineStates.add(baritoneEngine);
        }
        heartbeat.put("control_engines", engineStates);
        heartbeat.put("latest_event_sequence", latestEventSequence < 0 ? null : latestEventSequence);
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
            capability("com.casimirbot.minecraft.player.walk", "walk", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.jump", "jump", "player_motion", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.interact", "interact", "player_interaction", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.hotbar.select", "hotbar_select", "player_inventory", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.equipment.equip", "equip", "player_inventory", List.of("single_action")),
            capability("com.casimirbot.minecraft.player.follow", "follow", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.collect", "collect", "continuous_control", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.mine", "mine", "world_mutation", List.of("long_running"), List.of("native_fabric"), true),
            capability("com.casimirbot.minecraft.player.place", "place", "world_mutation", List.of("long_running"), List.of("native_fabric"), true),
            capability("com.casimirbot.minecraft.player.craft", "craft", "player_inventory", List.of("long_running")),
            capability("com.casimirbot.minecraft.player.inventory.transfer", "inventory_transfer", "player_inventory", List.of("long_running"))
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

    private void recordTransportError(String error) {
        if (!error.equals(lastTransportError)) {
            logger.warn("Helix player-action connector degraded: {}", error);
        }
        lastTransportError = error;
    }

    private void clearTransportError() {
        lastTransportError = "";
    }

    static boolean actionPollingReady(
        boolean manifestReady,
        boolean heartbeatReady
    ) {
        return manifestReady && heartbeatReady;
    }

    static String connectorHeartbeatStatus(
        boolean emergencyStopLatched,
        String previousTransportError
    ) {
        // Reaching the heartbeat endpoint is itself the recovery probe. A
        // previous poll/transport error remains diagnostic engine metadata but
        // must not make the recovery heartbeat fail the broker's active-status
        // gate forever.
        return emergencyStopLatched ? "paused" : "active";
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
