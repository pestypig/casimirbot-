package com.casimirbot.helixsensor.probe;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class ProbeSubmissionEnvelopeTest {
    @Test
    void wrapsOnlyAnExactDurableLeaseWithoutChangingTheProbeResult() {
        Map<String, Object> result = Map.of(
            "schema",
            "helix.environment_probe_result.v1",
            "probe_request_id",
            "environment_probe_request:test"
        );
        String leaseToken =
            "helix_probe_lease_abcdefghijklmnopqrstuvwxyz0123456789";
        Map<String, Object> probe = new LinkedHashMap<>();
        probe.put(
            "connector_transport",
            Map.of(
                "schema",
                "helix.environment_connector.probe_lease.v1",
                "probe_attempt_id",
                "environment_probe_attempt:test",
                "lease_token",
                leaseToken
            )
        );

        Map<String, Object> submission =
            ProbeSubmissionEnvelope.forProbe(probe, result);

        assertEquals(
            "helix.environment_connector.probe_submission.v1",
            submission.get("schema")
        );
        assertEquals(
            "environment_probe_attempt:test",
            submission.get("probe_attempt_id")
        );
        assertEquals(leaseToken, submission.get("lease_token"));
        assertSame(result, submission.get("result"));
        assertTrue(
            Instant.parse(String.valueOf(submission.get("submitted_at")))
                .isBefore(Instant.now().plusSeconds(1))
        );
    }

    @Test
    void preservesTheLegacyResultWhenTheLeaseMetadataIsMissingOrMalformed() {
        Map<String, Object> result = Map.of(
            "schema",
            "helix.environment_probe_result.v1"
        );
        assertSame(
            result,
            ProbeSubmissionEnvelope.forProbe(Map.of(), result)
        );
        assertSame(
            result,
            ProbeSubmissionEnvelope.forProbe(
                Map.of(
                    "connector_transport",
                    Map.of(
                        "schema",
                        "helix.environment_connector.probe_lease.v1",
                        "probe_attempt_id",
                        "environment_probe_attempt:test",
                        "lease_token",
                        "too-short"
                    )
                ),
                result
            )
        );
        assertFalse(result.containsKey("lease_token"));
    }
}
