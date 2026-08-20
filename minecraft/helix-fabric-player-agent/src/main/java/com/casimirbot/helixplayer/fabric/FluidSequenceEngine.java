package com.casimirbot.helixplayer.fabric;

import static com.casimirbot.helixplayer.fabric.PlayerActionWorkflow.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Tick-local interpreter for a server-admitted Minecraft player sequence.
 *
 * The interpreter owns no strategy and cannot invoke a model. It advances a
 * finite typed graph, delegates existing workflow nodes to the production
 * PlayerActionController, and returns observations to the outer controller.
 */
final class FluidSequenceEngine {
    private static final String SEQUENCE_SCHEMA = "helix.minecraft.player_sequence.v1";
    private static final int MAX_NODES = 256;
    private static final int MAX_IMMEDIATE_TRANSITIONS = 32;
    private static final int MAX_CONDITION_OBSERVATIONS = 512;

    private final ControlBridge bridge;
    private Map<String, Object> sequence = Map.of();
    private Map<String, Map<String, Object>> nodes = Map.of();
    private String currentNodeId;
    private long nodeEnteredAt = -1;
    private long startedNanos;
    private final Set<String> enteredNodes = new LinkedHashSet<>();
    private final Set<String> satisfiedCheckpoints = new LinkedHashSet<>();
    private final Map<String, String> nodeOutcomes = new LinkedHashMap<>();
    private final Map<String, Boolean> lastConditionValues = new LinkedHashMap<>();
    private final List<Map<String, Object>> conditionObservations = new ArrayList<>();
    private boolean conditionObservationCeilingReached;
    private Set<String> requiredCheckpoints = Set.of();
    private PlayerActionController childController;
    private WorkflowEvent childTerminalEvent;
    private boolean motionPerformed;
    private boolean interactionPerformed;
    private boolean inventoryMutationPerformed;
    private int worldMutationsPerformed;
    private int inventoryMutationsPerformed;
    private int deviations;
    private int retries;

    FluidSequenceEngine(ControlBridge bridge) {
        this.bridge = Objects.requireNonNull(bridge, "bridge");
    }

    void begin(Map<String, Object> arguments) {
        Map<String, Object> candidate = new LinkedHashMap<>(
            Objects.requireNonNull(arguments, "arguments")
        );
        validate(candidate);
        sequence = Map.copyOf(candidate);
        Map<String, Map<String, Object>> indexed = new LinkedHashMap<>();
        for (Object rawNode : list(candidate.get("nodes"))) {
            Map<String, Object> node = object(rawNode);
            indexed.put(text(node, "node_id"), Map.copyOf(node));
        }
        nodes = Map.copyOf(indexed);
        currentNodeId = text(candidate, "start_node_id");
        nodeEnteredAt = -1;
        startedNanos = System.nanoTime();
        enteredNodes.clear();
        satisfiedCheckpoints.clear();
        nodeOutcomes.clear();
        lastConditionValues.clear();
        conditionObservations.clear();
        conditionObservationCeilingReached = false;
        requiredCheckpoints = Set.copyOf(stringList(candidate.get("required_checkpoint_ids")));
        childController = null;
        childTerminalEvent = null;
        motionPerformed = false;
        interactionPerformed = false;
        inventoryMutationPerformed = false;
        worldMutationsPerformed = 0;
        inventoryMutationsPerformed = 0;
        deviations = 0;
        retries = 0;
    }

    WorkflowStep step(long actionTicks) {
        if (sequence.isEmpty() || currentNodeId == null) {
            return WorkflowStep.failed(
                "The admitted fluid sequence is not active.",
                Map.of("sequence_completed", false)
            );
        }
        if (actionTicks > longNumber(sequence, "max_total_ticks")) {
            deviations++;
            return fail("sequence_tick_ceiling_reached", actionTicks);
        }
        long tickIndex = Math.max(0, actionTicks - 1);
        for (int immediate = 0; immediate < MAX_IMMEDIATE_TRANSITIONS; immediate++) {
            Map<String, Object> node = nodes.get(currentNodeId);
            if (node == null) {
                return fail("sequence_node_missing", actionTicks);
            }
            if (nodeEnteredAt < 0) {
                nodeEnteredAt = tickIndex;
                enteredNodes.add(currentNodeId);
            }
            long earliestTick = longOr(node, "earliest_tick", 0);
            if (tickIndex < earliestTick) {
                bridge.applyMovement(MovementInput.released());
                return running(actionTicks, "The sequence is waiting for its admitted tick address.");
            }
            switch (text(node, "node_kind")) {
                case "input_segment":
                    return inputSegment(node, tickIndex, actionTicks);
                case "workflow_action":
                    return workflowAction(node, actionTicks);
                case "checkpoint": {
                    PlayerSnapshot snapshot = bridge.snapshot();
                    Map<String, Object> condition = object(node.get("condition"));
                    boolean satisfied = conditionSatisfied(condition, snapshot, tickIndex);
                    recordConditionObservation(node, condition, tickIndex, satisfied);
                    if (conditionObservationCeilingReached) {
                        return fail("sequence_condition_observation_ceiling", actionTicks);
                    }
                    if (satisfied) {
                        String checkpointId = text(node, "checkpoint_id");
                        satisfiedCheckpoints.add(checkpointId);
                        transition(text(node, "on_satisfied"), "succeeded");
                        continue;
                    }
                    long waited = tickIndex - nodeEnteredAt;
                    if (waited >= longNumber(node, "wait_up_to_ticks")) {
                        deviations++;
                        transition(text(node, "on_timeout"), "timed_out");
                        continue;
                    }
                    bridge.applyMovement(MovementInput.released());
                    return running(actionTicks, "The sequence is waiting for a required checkpoint.");
                }
                case "branch": {
                    Map<String, Object> condition = object(node.get("condition"));
                    boolean value = conditionSatisfied(
                        condition,
                        bridge.snapshot(),
                        tickIndex
                    );
                    recordConditionObservation(node, condition, tickIndex, value);
                    if (conditionObservationCeilingReached) {
                        return fail("sequence_condition_observation_ceiling", actionTicks);
                    }
                    transition(text(node, value ? "on_true" : "on_false"), "succeeded");
                    continue;
                }
                case "terminal":
                    return terminal(node, actionTicks);
                default:
                    return fail("sequence_node_kind_unsupported", actionTicks);
            }
        }
        deviations++;
        return fail("sequence_immediate_transition_ceiling", actionTicks);
    }

    private WorkflowStep inputSegment(
        Map<String, Object> node,
        long tickIndex,
        long actionTicks
    ) {
        Map<String, Object> controls = object(node.get("controls"));
        long localTick = tickIndex - nodeEnteredAt;
        int forward = integer(controls, "forward");
        int strafe = integer(controls, "strafe");
        String jump = text(controls, "jump");
        String use = text(controls, "use");
        boolean sprint = bool(controls, "sprint");
        if (localTick >= longNumber(node, "duration_ticks")) {
            bridge.releaseAll();
            transition(text(node, "on_complete"), "succeeded");
            return running(actionTicks, "The tick-addressed input segment completed.");
        }
        PlayerSnapshot lookSnapshot = controls.get("look_delta") instanceof Map<?, ?>
            ? bridge.snapshot()
            : null;
        MovementInput movement = new MovementInput(
            forward > 0,
            forward < 0,
            strafe < 0,
            strafe > 0,
            "hold".equals(jump),
            sprint
        );
        bridge.applyMovement(movement);
        if (localTick == 0) {
            if (controls.get("hotbar_slot") instanceof Number) {
                if (!bridge.selectHotbar(integer(controls, "hotbar_slot"))) {
                    bridge.releaseAll();
                    deviations++;
                    transition(text(node, "on_failure"), "failed");
                    return running(actionTicks, "The sequence could not select its admitted hotbar slot.");
                }
                inventoryMutationPerformed = true;
            }
            if ("pulse".equals(jump)) bridge.pulseJump();
            if ("pulse".equals(use)) {
                interactionPerformed = true;
                if (!bridge.interact("current_focus", "main_hand", "use")) {
                    bridge.releaseAll();
                    deviations++;
                    transition(text(node, "on_failure"), "failed");
                    return running(actionTicks, "The sequence interaction was not accepted.");
                }
            }
        }
        if (
            forward != 0 || strafe != 0 || sprint || !"idle".equals(jump) ||
            controls.get("look_delta") instanceof Map<?, ?>
        ) motionPerformed = true;
        if (controls.get("look_delta") instanceof Map<?, ?>) {
            Map<String, Object> look = object(controls.get("look_delta"));
            double duration = Math.max(1, longNumber(node, "duration_ticks"));
            float yawStep = (float) (number(look, "yaw_degrees") / duration);
            float pitchStep = (float) (number(look, "pitch_degrees") / duration);
            float maximum = (float) number(look, "max_degrees_per_tick");
            bridge.lookTo(
                lookSnapshot.yaw() + clamp(yawStep, -maximum, maximum),
                lookSnapshot.pitch() + clamp(pitchStep, -maximum, maximum),
                maximum
            );
        }
        return running(actionTicks, "The Fabric client is applying the admitted input segment.");
    }

    private WorkflowStep workflowAction(Map<String, Object> node, long actionTicks) {
        Map<String, Object> action = object(node.get("action"));
        String actionKind = text(action, "action_kind");
        if (childController == null) {
            if (!mutationScopeAdmits(action)) {
                deviations++;
                transition(text(node, "on_failure"), "failed");
                return running(
                    actionTicks,
                    "The embedded workflow was outside the admitted mutation scope."
                );
            }
            childTerminalEvent = null;
            Set<String> childResources =
                ConcurrentReactiveScheduler.resourcesFor(action);
            childController = new PlayerActionController(
                bridge,
                event -> {
                    if (terminal(event.state())) childTerminalEvent = event;
                },
                () -> bridge.releaseResources(childResources)
            );
            String engine = "navigate_to".equals(actionKind) &&
                "baritone".equals(action.get("engine_preference"))
                ? "baritone"
                : "native_fabric";
            ActionRequest request = new ActionRequest(
                "sequence_action_request:" + currentNodeId,
                "sequence_workflow:" + currentNodeId,
                actionKind,
                actionForRuntime(action),
                longNumber(node, "timeout_ticks"),
                ManualOverridePolicy.CANCEL,
                engine
            );
            if (!childController.start(request)) {
                deviations++;
                transition(text(node, "on_failure"), "failed");
                return running(actionTicks, "The embedded typed workflow could not start.");
            }
            markDeclaredEffects(actionKind);
        }
        childController.tick();
        State childState = childController.state();
        if (!terminal(childState)) {
            return running(actionTicks, "The embedded typed player workflow is running.");
        }
        WorkflowEvent terminalEvent = childTerminalEvent;
        if (terminalEvent != null) aggregateMeasurements(terminalEvent.measurements());
        boolean succeeded = childState == State.SUCCEEDED;
        String target = text(node, succeeded ? "on_success" : "on_failure");
        if (!succeeded) deviations++;
        transition(target, succeeded ? "succeeded" : stateOutcome(childState));
        childController = null;
        childTerminalEvent = null;
        return running(
            actionTicks,
            succeeded
                ? "The embedded typed player workflow completed."
                : "The embedded typed player workflow produced a bounded failure."
        );
    }

    private WorkflowStep terminal(Map<String, Object> node, long actionTicks) {
        String declaredOutcome = text(node, "terminal_outcome");
        String reasonCode = text(node, "reason_code");
        nodeOutcomes.put(currentNodeId, declaredOutcome);
        if ("succeeded".equals(declaredOutcome)) {
            Set<String> missing = new LinkedHashSet<>(requiredCheckpoints);
            missing.removeAll(satisfiedCheckpoints);
            if (!missing.isEmpty()) {
                deviations++;
                return WorkflowStep.failed(
                    "The sequence reached success without every required checkpoint.",
                    measurements(false, actionTicks, "required_checkpoint_missing")
                );
            }
            return WorkflowStep.succeeded(
                "The Fabric client completed the admitted sequence and every required checkpoint.",
                measurements(true, actionTicks, reasonCode)
            );
        }
        return WorkflowStep.failed(
            "The admitted sequence reached its typed failure terminal.",
            measurements(false, actionTicks, reasonCode)
        );
    }

    private WorkflowStep running(long actionTicks, String summary) {
        double progress = Math.min(
            0.99,
            (double) enteredNodes.size() / (double) Math.max(1, nodes.size())
        );
        return WorkflowStep.running(
            progress,
            summary,
            measurements(false, actionTicks, "sequence_running")
        );
    }

    private WorkflowStep fail(String reasonCode, long actionTicks) {
        bridge.releaseAll();
        return WorkflowStep.failed(
            "The bounded Fabric sequence stopped at a typed interpreter boundary.",
            measurements(false, actionTicks, reasonCode)
        );
    }

    private Map<String, Object> measurements(
        boolean completed,
        long actionTicks,
        String terminalReasonCode
    ) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("sequence_completed", completed);
        values.put("sequence_id", text(sequence, "sequence_id"));
        values.put("ruleset", text(sequence, "ruleset"));
        values.put("executed_node_count", enteredNodes.size());
        values.put("executed_node_ids", List.copyOf(enteredNodes));
        values.put("required_checkpoints_satisfied", satisfiedCheckpoints.stream()
            .filter(requiredCheckpoints::contains)
            .count());
        values.put("satisfied_checkpoint_ids", List.copyOf(satisfiedCheckpoints));
        values.put("scheduler_ticks_elapsed", actionTicks);
        values.put("wall_clock_elapsed_ms", Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000));
        values.put("terminal_reason_code", terminalReasonCode);
        values.put("node_outcomes", Map.copyOf(nodeOutcomes));
        values.put("condition_observations", List.copyOf(conditionObservations));
        values.put("condition_observation_count", conditionObservations.size());
        values.put("deviation_count", deviations);
        values.put("retry_count", retries);
        values.put("player_motion_performed", motionPerformed);
        values.put("player_interaction_performed", interactionPerformed);
        values.put("inventory_mutation_performed", inventoryMutationPerformed);
        values.put("inventory_mutations_performed", inventoryMutationsPerformed);
        values.put("world_mutations_performed", worldMutationsPerformed);
        return Map.copyOf(values);
    }

    private void recordConditionObservation(
        Map<String, Object> node,
        Map<String, Object> condition,
        long tickIndex,
        boolean satisfied
    ) {
        String nodeId = text(node, "node_id");
        Boolean previous = lastConditionValues.put(nodeId, satisfied);
        if (previous != null && previous == satisfied) return;
        if (conditionObservations.size() >= MAX_CONDITION_OBSERVATIONS) {
            conditionObservationCeilingReached = true;
            return;
        }
        Map<String, Object> observation = new LinkedHashMap<>();
        observation.put("node_id", nodeId);
        observation.put("tick_index", tickIndex);
        observation.put("condition_kind", text(condition, "condition_kind"));
        observation.put("satisfied", satisfied);
        for (String field : List.of(
            "item_id",
            "output_item_id",
            "dimension",
            "destination",
            "portal_kind",
            "checkpoint_id",
            "node_id"
        )) {
            Object value = condition.get(field);
            if (value instanceof String text && !text.isBlank()) {
                observation.put("subject_" + field, text);
            }
        }
        conditionObservations.add(Map.copyOf(observation));
    }

    private boolean conditionSatisfied(
        Map<String, Object> condition,
        PlayerSnapshot snapshot,
        long tickIndex
    ) {
        return switch (text(condition, "condition_kind")) {
            case "tick_at_least" -> tickIndex >= longNumber(condition, "tick_index");
            case "player_grounded" -> snapshot.onGround() == bool(condition, "expected");
            case "health_at_least" -> snapshot.health() >= number(condition, "health");
            case "position_within" -> {
                Map<String, Object> position = object(condition.get("position"));
                double dx = snapshot.x() - number(position, "x");
                double dy = snapshot.y() - number(position, "y");
                double dz = snapshot.z() - number(position, "z");
                double radius = number(condition, "radius");
                yield dx * dx + dy * dy + dz * dz <= radius * radius;
            }
            case "node_outcome_is" -> Objects.equals(
                nodeOutcomes.get(text(condition, "node_id")),
                text(condition, "outcome")
            );
            case "checkpoint_satisfied" -> satisfiedCheckpoints.contains(
                text(condition, "checkpoint_id")
            );
            default -> bridge.evaluateFluidWorldCondition(condition);
        };
    }

    private void transition(String targetNodeId, String outcome) {
        nodeOutcomes.put(currentNodeId, outcome);
        currentNodeId = targetNodeId;
        nodeEnteredAt = -1;
    }

    private void markDeclaredEffects(String actionKind) {
        if (Set.of(
            "navigate_to", "look_at", "walk", "jump", "follow", "collect", "mine", "place"
        ).contains(actionKind)) motionPerformed = true;
        if (Set.of(
            "interact", "mine", "place", "craft", "inventory_transfer"
        ).contains(actionKind)) interactionPerformed = true;
        if (Set.of(
            "hotbar_select", "equip", "collect", "mine", "place", "craft", "inventory_transfer"
        ).contains(actionKind)) inventoryMutationPerformed = true;
    }

    private void aggregateMeasurements(Map<String, Object> measurements) {
        worldMutationsPerformed += nonnegativeInteger(measurements, "world_mutations_performed");
        inventoryMutationsPerformed +=
            nonnegativeInteger(measurements, "collected_count") +
            nonnegativeInteger(measurements, "produced_count") +
            nonnegativeInteger(measurements, "transferred_count");
        if (worldMutationsPerformed > 0) inventoryMutationPerformed = true;
        if (inventoryMutationsPerformed > 0) inventoryMutationPerformed = true;
    }

    private boolean mutationScopeAdmits(Map<String, Object> action) {
        String actionKind = text(action, "action_kind");
        if (!"mine".equals(actionKind) && !"place".equals(actionKind)) return true;
        Map<String, Object> scope = object(sequence.get("mutation_scope"));
        if (!bool(scope, "world_mutation_allowed") ||
            longNumber(scope, "max_block_mutations") < 1) return false;
        String blockId = text(action, "block_id");
        if (!stringList(scope.get("allowed_block_ids")).contains(blockId)) return false;
        List<Object> rawRegions = list(scope.get("allowed_regions"));
        if (rawRegions.isEmpty()) return true;
        if ("place".equals(actionKind)) {
            if (action.get("position_binding") instanceof Map<?, ?>) {
                return true;
            }
            for (Object rawPosition : list(action.get("positions"))) {
                if (!positionWithinAnyRegion(object(rawPosition), rawRegions)) return false;
            }
            return true;
        }
        PlayerSnapshot snapshot = bridge.snapshot();
        int radius = integer(action, "search_radius");
        Map<String, Object> minimum = Map.of(
            "x", (int) Math.floor(snapshot.x()) - radius,
            "y", (int) Math.floor(snapshot.y()) - radius,
            "z", (int) Math.floor(snapshot.z()) - radius
        );
        Map<String, Object> maximum = Map.of(
            "x", (int) Math.floor(snapshot.x()) + radius,
            "y", (int) Math.floor(snapshot.y()) + radius,
            "z", (int) Math.floor(snapshot.z()) + radius
        );
        return rawRegions.stream().map(FluidSequenceEngine::object).anyMatch(region ->
            positionWithin(minimum, region) && positionWithin(maximum, region)
        );
    }

    private Map<String, Object> actionForRuntime(Map<String, Object> action) {
        Map<String, Object> runtimeAction = new LinkedHashMap<>();
        action.forEach((key, value) -> {
            if (value != null) runtimeAction.put(key, value);
        });
        if (
            !"place".equals(text(action, "action_kind")) ||
            !(action.get("position_binding") instanceof Map<?, ?>)
        ) return Map.copyOf(runtimeAction);
        runtimeAction.put(
            "_helix_admitted_mutation_scope",
            object(sequence.get("mutation_scope"))
        );
        return Map.copyOf(runtimeAction);
    }

    private static boolean positionWithinAnyRegion(
        Map<String, Object> position,
        List<Object> regions
    ) {
        return regions.stream().map(FluidSequenceEngine::object).anyMatch(region ->
            positionWithin(position, region)
        );
    }

    private static boolean positionWithin(
        Map<String, Object> position,
        Map<String, Object> region
    ) {
        Map<String, Object> minimum = object(region.get("min"));
        Map<String, Object> maximum = object(region.get("max"));
        for (String axis : List.of("x", "y", "z")) {
            long value = longNumber(position, axis);
            if (value < longNumber(minimum, axis) || value > longNumber(maximum, axis)) {
                return false;
            }
        }
        return true;
    }

    static void validate(Map<String, Object> sequence) {
        if (!"execute_sequence".equals(text(sequence, "action_kind")) ||
            !SEQUENCE_SCHEMA.equals(text(sequence, "sequence_schema")) ||
            !"survival_tas".equals(text(sequence, "ruleset")) ||
            !"player_embodiment".equals(text(sequence, "execution_plane")) ||
            !"native_fabric".equals(text(sequence, "scheduler_engine"))) {
            throw new IllegalArgumentException(
                "The client admits only the survival_tas Player Embodiment sequence contract."
            );
        }
        long maximumTicks = longNumber(sequence, "max_total_ticks");
        if (maximumTicks < 1 || maximumTicks > 36_000) {
            throw new IllegalArgumentException("max_total_ticks must be 1-36000.");
        }
        List<Object> rawNodes = list(sequence.get("nodes"));
        if (rawNodes.size() < 2 || rawNodes.size() > MAX_NODES) {
            throw new IllegalArgumentException("A sequence requires 2-256 nodes.");
        }
        Map<String, Map<String, Object>> indexed = new LinkedHashMap<>();
        Set<String> checkpointIds = new HashSet<>();
        boolean successTerminal = false;
        for (Object raw : rawNodes) {
            Map<String, Object> node = object(raw);
            String nodeId = text(node, "node_id");
            if (indexed.putIfAbsent(nodeId, node) != null) {
                throw new IllegalArgumentException("Sequence node identifiers must be unique.");
            }
            String kind = text(node, "node_kind");
            if (!Set.of(
                "input_segment", "workflow_action", "checkpoint", "branch", "terminal"
            ).contains(kind)) {
                throw new IllegalArgumentException("The sequence contains an unsupported node kind.");
            }
            if ("checkpoint".equals(kind) && !checkpointIds.add(text(node, "checkpoint_id"))) {
                throw new IllegalArgumentException("Checkpoint identifiers must be unique.");
            }
            if ("workflow_action".equals(kind)) {
                String actionKind = text(object(node.get("action")), "action_kind");
                if (!Set.of(
                    "navigate_to", "look_at", "walk", "jump", "interact",
                    "hotbar_select", "equip", "follow", "collect", "mine", "place",
                    "craft", "inventory_transfer"
                ).contains(actionKind)) {
                    throw new IllegalArgumentException(
                        "Fluid sequence workflow nodes must reuse one of the 13 typed player actions."
                    );
                }
            }
            if ("terminal".equals(kind) && "succeeded".equals(text(node, "terminal_outcome"))) {
                successTerminal = true;
            }
        }
        String start = text(sequence, "start_node_id");
        if (!indexed.containsKey(start) || !successTerminal) {
            throw new IllegalArgumentException(
                "The sequence requires an existing start node and a success terminal."
            );
        }
        for (Map<String, Object> node : indexed.values()) {
            for (String target : transitions(node)) {
                if (!indexed.containsKey(target)) {
                    throw new IllegalArgumentException("Every sequence transition must name a node.");
                }
            }
        }
        for (String checkpoint : stringList(sequence.get("required_checkpoint_ids"))) {
            if (!checkpointIds.contains(checkpoint)) {
                throw new IllegalArgumentException("Every required checkpoint must name a checkpoint node.");
            }
        }
        Set<String> reachable = new HashSet<>();
        Set<String> active = new HashSet<>();
        visit(start, indexed, reachable, active);
        if (reachable.size() != indexed.size()) {
            throw new IllegalArgumentException("Every sequence node must be reachable.");
        }
    }

    private static void visit(
        String nodeId,
        Map<String, Map<String, Object>> nodes,
        Set<String> reachable,
        Set<String> active
    ) {
        if (active.contains(nodeId)) {
            throw new IllegalArgumentException("Fluid sequence graphs must be acyclic.");
        }
        if (reachable.contains(nodeId)) return;
        active.add(nodeId);
        reachable.add(nodeId);
        for (String target : transitions(nodes.get(nodeId))) {
            visit(target, nodes, reachable, active);
        }
        active.remove(nodeId);
    }

    private static List<String> transitions(Map<String, Object> node) {
        return switch (text(node, "node_kind")) {
            case "input_segment" -> List.of(text(node, "on_complete"), text(node, "on_failure"));
            case "workflow_action" -> List.of(text(node, "on_success"), text(node, "on_failure"));
            case "checkpoint" -> List.of(text(node, "on_satisfied"), text(node, "on_timeout"));
            case "branch" -> List.of(text(node, "on_true"), text(node, "on_false"));
            case "terminal" -> List.of();
            default -> throw new IllegalArgumentException("Unsupported sequence node kind.");
        };
    }

    private static boolean terminal(State state) {
        return state == State.CANCELED || state == State.SUCCEEDED || state == State.FAILED ||
            state == State.TIMED_OUT || state == State.EMERGENCY_STOPPED ||
            state == State.CONNECTOR_OFFLINE;
    }

    private static String stateOutcome(State state) {
        return switch (state) {
            case TIMED_OUT -> "timed_out";
            case CANCELED, EMERGENCY_STOPPED -> "canceled";
            default -> "failed";
        };
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> object(Object value) {
        if (!(value instanceof Map<?, ?> map)) {
            throw new IllegalArgumentException("The sequence object is incomplete.");
        }
        return (Map<String, Object>) map;
    }

    @SuppressWarnings("unchecked")
    private static List<Object> list(Object value) {
        if (!(value instanceof List<?> list)) {
            throw new IllegalArgumentException("The sequence list is incomplete.");
        }
        return (List<Object>) list;
    }

    private static List<String> stringList(Object value) {
        List<String> result = new ArrayList<>();
        for (Object item : list(value)) {
            if (!(item instanceof String text) || text.isBlank()) {
                throw new IllegalArgumentException("Sequence identifiers must be non-empty strings.");
            }
            result.add(text);
        }
        return List.copyOf(result);
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException("The sequence field " + key + " is required.");
        }
        return text;
    }

    private static boolean bool(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Boolean bool)) {
            throw new IllegalArgumentException("The sequence boolean " + key + " is required.");
        }
        return bool;
    }

    private static double number(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw new IllegalArgumentException("The sequence number " + key + " is required.");
        }
        return number.doubleValue();
    }

    private static long longNumber(Map<String, Object> map, String key) {
        double value = number(map, key);
        if (Math.rint(value) != value) {
            throw new IllegalArgumentException("The sequence field " + key + " must be an integer.");
        }
        return (long) value;
    }

    private static long longOr(Map<String, Object> map, String key, long fallback) {
        return map.get(key) instanceof Number ? longNumber(map, key) : fallback;
    }

    private static int integer(Map<String, Object> map, String key) {
        return Math.toIntExact(longNumber(map, key));
    }

    private static int nonnegativeInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (!(value instanceof Number number) || !Double.isFinite(number.doubleValue())) return 0;
        double numeric = number.doubleValue();
        return numeric >= 0 && Math.rint(numeric) == numeric ? (int) numeric : 0;
    }

    private static float clamp(float value, float minimum, float maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }
}
