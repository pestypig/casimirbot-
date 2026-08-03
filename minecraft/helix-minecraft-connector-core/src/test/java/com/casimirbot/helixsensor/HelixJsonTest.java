package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

final class HelixJsonTest {
    @Test
    void strictContractEncodingCanPreserveExplicitNullFields() {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("nullable", null);
        value.put("present", true);

        assertEquals("{\"present\":true}", HelixJson.stringify(value));
        assertEquals(
            "{\"nullable\":null,\"present\":true}",
            HelixJson.stringifyIncludingNulls(value)
        );
    }
}
