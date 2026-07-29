package com.casimirbot.helixsensor.probe;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import org.junit.jupiter.api.Test;

final class ProbeActorSelectionTest {
    private static final ProbeExecutor.ActorCandidate ALEX =
        new ProbeExecutor.ActorCandidate(0, "11111111-1111-1111-1111-111111111111", "Alex");
    private static final ProbeExecutor.ActorCandidate STEVE =
        new ProbeExecutor.ActorCandidate(1, "22222222-2222-2222-2222-222222222222", "Steve");

    @Test
    void selectsTheOnlyOnlineActorForCurrentActor() {
        ProbeExecutor.ActorSelection selection =
            ProbeExecutor.selectActor(List.of(ALEX), null);

        assertEquals("selected", selection.status());
        assertEquals(0, selection.selectedIndex());
    }

    @Test
    void failsClosedWhenCurrentActorIsAmbiguous() {
        ProbeExecutor.ActorSelection selection =
            ProbeExecutor.selectActor(List.of(ALEX, STEVE), null);

        assertEquals("target_ambiguous", selection.status());
        assertNull(selection.selectedIndex());
    }

    @Test
    void selectsOnlyAnExactActorIdentity() {
        ProbeExecutor.ActorSelection byUuid =
            ProbeExecutor.selectActor(List.of(ALEX, STEVE), STEVE.actorId());
        ProbeExecutor.ActorSelection byLabel =
            ProbeExecutor.selectActor(List.of(ALEX, STEVE), "alex");
        ProbeExecutor.ActorSelection suffix =
            ProbeExecutor.selectActor(List.of(ALEX, STEVE), "room:Alex");

        assertEquals(1, byUuid.selectedIndex());
        assertEquals(0, byLabel.selectedIndex());
        assertEquals("target_unavailable", suffix.status());
    }

    @Test
    void reportsUnavailableForMissingOrOfflineActors() {
        assertEquals(
            "target_unavailable",
            ProbeExecutor.selectActor(List.of(), null).status()
        );
        assertEquals(
            "target_unavailable",
            ProbeExecutor.selectActor(List.of(ALEX), STEVE.actorId()).status()
        );
    }
}
