package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

final class FabricServerPairingInboxTest {
    @TempDir
    Path tempDir;

    @Test
    void atomicallyConsumesAndDeletesAValidServerPairingCommand() throws Exception {
        Path inbox = tempDir.resolve(FabricServerPairingInbox.FILE_NAME);
        Files.writeString(inbox, "/helix pair Z4ZD-X2JJ");

        FabricServerPairingInbox.PollResult result =
            FabricServerPairingInbox.consume(inbox, System.currentTimeMillis());

        assertEquals("Z4ZD-X2JJ", result.code());
        assertFalse(Files.exists(inbox));
        assertFalse(
            Files.exists(inbox.resolveSibling(inbox.getFileName() + ".processing"))
        );
    }

    @Test
    void rejectsAndDeletesMalformedInputWithoutEchoingIt() throws Exception {
        Path inbox = tempDir.resolve(FabricServerPairingInbox.FILE_NAME);
        Files.writeString(inbox, "/say definitely-not-a-pairing-command");

        FabricServerPairingInbox.PollResult result =
            FabricServerPairingInbox.consume(inbox, System.currentTimeMillis());

        assertNull(result.code());
        assertEquals("server_pairing_inbox_invalid", result.failureCode());
        assertFalse(Files.exists(inbox));
    }

    @Test
    void rejectsAndDeletesStalePairingMaterial() throws Exception {
        Path inbox = tempDir.resolve(FabricServerPairingInbox.FILE_NAME);
        Files.writeString(inbox, "/helix pair Z4ZD-X2JJ");
        long now = System.currentTimeMillis();
        Files.setLastModifiedTime(
            inbox,
            FileTime.fromMillis(now - FabricServerPairingInbox.MAX_AGE_MILLIS - 1)
        );

        FabricServerPairingInbox.PollResult result =
            FabricServerPairingInbox.consume(inbox, now);

        assertNull(result.code());
        assertEquals("server_pairing_inbox_stale", result.failureCode());
        assertFalse(Files.exists(inbox));
    }
}
