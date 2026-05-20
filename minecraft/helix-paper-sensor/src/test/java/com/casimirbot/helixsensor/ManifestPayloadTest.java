package com.casimirbot.helixsensor;

import com.casimirbot.helixsensor.manifest.ManifestPublisher;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ManifestPayloadTest {
    @Test
    void manifestIsReadOnlyAndRawNbtFree() {
        Map<String, Object> manifest = ManifestPublisher.buildManifest(TestConfigs.minimal(), "2026-05-20T00:00:00Z");
        Map<String, Object> execution = HelixJson.asObject(manifest.get("execution_policy"));
        Map<String, Object> snapshot = HelixJson.asObject(manifest.get("snapshot_policy"));

        assertEquals(false, execution.get("may_execute_live_actions"));
        assertEquals(true, execution.get("may_perform_read_only_probes"));
        assertEquals(false, snapshot.get("raw_payload_included"));
        assertEquals(false, snapshot.get("raw_nbt_included"));
        assertEquals(false, manifest.get("assistant_answer"));
    }
}
