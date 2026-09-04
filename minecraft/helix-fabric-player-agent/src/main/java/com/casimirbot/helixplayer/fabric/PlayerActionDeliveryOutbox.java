package com.casimirbot.helixplayer.fabric;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Bounded, ordered, in-memory delivery state for an accepted player workflow.
 * Entries remain present until the Helix endpoint acknowledges them. This is
 * deliberately not an action replay mechanism: it only completes delivery of
 * evidence and the terminal result for the already executed action.
 */
final class PlayerActionDeliveryOutbox {
    enum Stage {
        WORKFLOW_EVENT("/requests/event", "workflow_event"),
        ENVIRONMENT_EVENT_BATCH("/events/batch", "environment_event_batch"),
        ACTION_RESULT("/requests/result", "action_result");

        private final String endpointSuffix;
        private final String diagnosticName;

        Stage(String endpointSuffix, String diagnosticName) {
            this.endpointSuffix = endpointSuffix;
            this.diagnosticName = diagnosticName;
        }

        String endpointSuffix() {
            return endpointSuffix;
        }

        String diagnosticName() {
            return diagnosticName;
        }
    }

    record Delivery(Stage stage, Map<String, Object> payload) {
        Delivery {
            payload = Collections.unmodifiableMap(new LinkedHashMap<>(payload));
        }
    }

    private final int capacity;
    private final Deque<Delivery> pending = new ArrayDeque<>();
    private Delivery criticalInFlight;
    private Delivery projectionInFlight;

    PlayerActionDeliveryOutbox(int capacity) {
        if (capacity < 3) throw new IllegalArgumentException("Delivery outbox capacity is too small.");
        this.capacity = capacity;
    }

    synchronized boolean enqueueSequence(List<Delivery> deliveries, int reservedTerminalSlots) {
        if (deliveries.isEmpty()) return true;
        int usableCapacity = capacity - Math.max(0, reservedTerminalSlots);
        if (pending.size() + deliveries.size() > usableCapacity) return false;
        pending.addAll(new ArrayList<>(deliveries));
        return true;
    }

    synchronized Delivery peekCritical() {
        if (criticalInFlight != null) return criticalInFlight;
        for (Delivery delivery : pending) {
            if (delivery.stage() == Stage.ENVIRONMENT_EVENT_BATCH) continue;
            criticalInFlight = delivery;
            return criticalInFlight;
        }
        return null;
    }

    synchronized Delivery peekProjection() {
        if (projectionInFlight != null) return projectionInFlight;
        for (Delivery delivery : pending) {
            if (delivery.stage() != Stage.ENVIRONMENT_EVENT_BATCH) continue;
            projectionInFlight = delivery;
            return projectionInFlight;
        }
        return null;
    }

    synchronized boolean acknowledge(Delivery expected) {
        if (expected == null) return false;
        Delivery selected = expected.stage() == Stage.ENVIRONMENT_EVENT_BATCH
            ? projectionInFlight
            : criticalInFlight;
        if (selected != expected) return false;
        Iterator<Delivery> iterator = pending.iterator();
        while (iterator.hasNext()) {
            if (iterator.next() != expected) continue;
            iterator.remove();
            if (expected.stage() == Stage.ENVIRONMENT_EVENT_BATCH) {
                projectionInFlight = null;
            } else {
                criticalInFlight = null;
            }
            return true;
        }
        return false;
    }

    synchronized boolean isEmpty() {
        return pending.isEmpty();
    }

    synchronized boolean isCriticalEmpty() {
        return pending.stream().noneMatch(
            delivery -> delivery.stage() != Stage.ENVIRONMENT_EVENT_BATCH
        );
    }

    synchronized boolean isProjectionEmpty() {
        return pending.stream().noneMatch(
            delivery -> delivery.stage() == Stage.ENVIRONMENT_EVENT_BATCH
        );
    }

    synchronized int size() {
        return pending.size();
    }

    static String transportErrorCode(Stage stage, int statusCode, String serverError) {
        String candidate = serverError == null
            ? "request_failed"
            : serverError.trim().toLowerCase(Locale.ROOT);
        if (!candidate.matches("[a-z0-9_]{1,80}")) candidate = "request_failed";
        int boundedStatus = statusCode >= 100 && statusCode <= 599 ? statusCode : 0;
        return "action_delivery_" + stage.diagnosticName() + "_http_" +
            boundedStatus + "_" + candidate;
    }
}
