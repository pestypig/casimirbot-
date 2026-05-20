package com.casimirbot.helixsensor.snapshot;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class SnapshotContractGuardTest {
    @Test
    void acceptsCompactReadOnlySnapshot() {
        SnapshotContractGuard guard = new SnapshotContractGuard();
        Map<String, Object> snapshot = Map.of(
            "snapshot_id", "snapshot:1",
            "source_tick", 2,
            "assistant_answer", false,
            "raw_content_included", false,
            "raw_payload_included", false,
            "changed_sections", List.of("actor_state"),
            "section_hashes", Map.of("actor_state", "sha256:abc"),
            "domain_specific", Map.of("minecraft", Map.of("raw_nbt_included", false))
        );

        assertTrue(guard.validate(snapshot, 1).isEmpty());
    }

    @Test
    void rejectsRawNbtAndOutOfOrderTicks() {
        SnapshotContractGuard guard = new SnapshotContractGuard();
        Map<String, Object> snapshot = Map.of(
            "snapshot_id", "snapshot:1",
            "source_tick", 1,
            "assistant_answer", false,
            "raw_content_included", false,
            "raw_payload_included", false,
            "changed_sections", List.of("actor_state"),
            "section_hashes", Map.of("actor_state", "sha256:abc"),
            "domain_specific", Map.of("minecraft", Map.of("raw_nbt_included", true))
        );

        List<String> issues = guard.validate(snapshot, 1);
        assertFalse(issues.isEmpty());
        assertTrue(issues.contains("raw_nbt_included"));
        assertTrue(issues.contains("source_tick_not_monotonic"));
    }
}
