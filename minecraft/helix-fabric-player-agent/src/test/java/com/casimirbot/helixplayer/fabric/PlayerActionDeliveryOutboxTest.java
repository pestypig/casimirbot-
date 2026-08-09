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
    void preservesStrictDeliveryOrderUntilEachEntryIsAcknowledged() {
        PlayerActionDeliveryOutbox outbox = new PlayerActionDeliveryOutbox(6);
        PlayerActionDeliveryOutbox.Delivery event = delivery(
            PlayerActionDeliveryOutbox.Stage.WORKFLOW_EVENT,
            "event"
        );
        PlayerActionDeliveryOutbox.Delivery batch = delivery(
            PlayerActionDeliveryOutbox.Stage.ENVIRONMENT_EVENT_BATCH,
            "batch"
        );
        PlayerActionDeliveryOutbox.Delivery result = delivery(
            PlayerActionDeliveryOutbox.Stage.ACTION_RESULT,
            "result"
        );

        assertTrue(outbox.enqueueSequence(List.of(event, batch, result), 0));
        assertSame(event, outbox.peek());
        assertTrue(outbox.acknowledge(event));
        assertSame(batch, outbox.peek());
        assertFalse(outbox.acknowledge(result));
        assertSame(batch, outbox.peek());
        assertTrue(outbox.acknowledge(batch));
        assertTrue(outbox.acknowledge(result));
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
