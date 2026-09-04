package com.casimirbot.helixplayer.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class PlayerActionDeliveryOutboxTest {
    @Test
    void settlesTheActionLaneBeforeSlowEnvironmentProjection() {
        PlayerActionDeliveryOutbox outbox = new PlayerActionDeliveryOutbox(9);
        PlayerActionDeliveryOutbox.Delivery started = delivery(
            PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
            "started"
        );
        PlayerActionDeliveryOutbox.Delivery startedBatch = delivery(
            PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
            "started-batch"
        );
        PlayerActionDeliveryOutbox.Delivery progress = delivery(
            PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
            "progress"
        );
        PlayerActionDeliveryOutbox.Delivery progressBatch = delivery(
            PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
            "progress-batch"
        );
        PlayerActionDeliveryOutbox.Delivery terminal = delivery(
            PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
            "terminal"
        );
        PlayerActionDeliveryOutbox.Delivery result = delivery(
            PlayerActionDeliveryOutbox.Stage.ACTION_RESULT,
            "result"
        );
        PlayerActionDeliveryOutbox.Delivery terminalBatch = delivery(
            PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
            "terminal-batch"
        );

        assertTrue(outbox.enqueueSequence(List.of(started, startedBatch), 3));
        assertSame(started, outbox.peekCritical());
        assertTrue(outbox.acknowledge(started));
        assertSame(startedBatch, outbox.peekProjection());
        assertTrue(outbox.enqueueSequence(
            List.of(progress, progressBatch, terminal, terminalBatch, result),
            0
        ));

        // A selected slow projection remains pinned to its own lane while the
        // ordered workflow events and terminal result settle independently.
        assertSame(progress, outbox.peekCritical());
        assertTrue(outbox.acknowledge(progress));
        assertSame(terminal, outbox.peekCritical());
        assertTrue(outbox.acknowledge(terminal));
        assertSame(result, outbox.peekCritical());
        assertTrue(outbox.acknowledge(result));
        assertTrue(outbox.isCriticalEmpty());
        assertSame(startedBatch, outbox.peekProjection());
        assertTrue(outbox.acknowledge(startedBatch));
        assertSame(progressBatch, outbox.peekProjection());
        assertFalse(outbox.acknowledge(terminalBatch));
        assertTrue(outbox.acknowledge(progressBatch));
        assertSame(terminalBatch, outbox.peekProjection());
        assertTrue(outbox.acknowledge(terminalBatch));
        assertTrue(outbox.isEmpty());
    }

    @Test
    void reservesRoomForTheTerminalEvidenceAndResult() {
        PlayerActionDeliveryOutbox outbox = new PlayerActionDeliveryOutbox(5);
        assertTrue(outbox.enqueueSequence(List.of(
            delivery(PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT, "progress"),
            delivery(PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH, "stream")
        ), 3));
        assertFalse(outbox.enqueueSequence(List.of(
            delivery(PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT, "overflow")
        ), 3));
        assertEquals(2, outbox.size());
    }

    @Test
    void keepsTransportDiagnosticsTypedAndSanitized() {
        assertEquals(
            "action_delivery_action_result_http_409_action_result_conflict",
            PlayerActionDeliveryOutbox.transportErrorCode(
                PlayerActionDeliveryOutbox.Stage.ACTION_RESULT,
                409,
                "action_result_conflict"
            )
        );
        assertEquals(
            "action_delivery_workflow_event_http_500_request_failed",
            PlayerActionDeliveryOutbox.transportErrorCode(
                PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
                500,
                "request contained sensitive free-form details"
            )
        );
    }

    private static PlayerActionDeliveryOutbox.Delivery delivery(
        PlayerActionDeliveryOutbox.Stage stage,
        String id
    ) {
        return new PlayerActionDeliveryOutbox.Delivery(stage, Map.of("id", id));
    }
}
