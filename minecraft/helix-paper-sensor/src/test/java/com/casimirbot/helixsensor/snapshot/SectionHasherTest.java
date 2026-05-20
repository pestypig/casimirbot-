package com.casimirbot.helixsensor.snapshot;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SectionHasherTest {
    @Test
    void hashesAreStableAcrossMapOrder() {
        Map<String, Object> first = new LinkedHashMap<>();
        first.put("b", 2);
        first.put("a", 1);
        Map<String, Object> second = new LinkedHashMap<>();
        second.put("a", 1);
        second.put("b", 2);

        assertEquals(SectionHasher.hash(first), SectionHasher.hash(second));
        assertTrue(SectionHasher.hash(first).startsWith("sha256:"));
    }
}
