package com.casimirbot.helixsensor.fabric;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import net.fabricmc.loader.api.FabricLoader;

/**
 * Bounded same-host handoff for a one-time World Authority pairing command.
 * The claimed file is deleted before redemption and the code is never logged.
 */
final class FabricServerPairingInbox {
    static final String FILE_NAME = "helix-fabric-sensor.pairing-inbox";
    static final long MAX_AGE_MILLIS = 2 * 60 * 1000L;
    static final long MAX_BYTES = 512L;

    private static final Pattern PAIR_COMMAND = Pattern.compile(
        "^/helix\\s+pair\\s+([A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4})\\s*$"
    );

    private FabricServerPairingInbox() {}

    record PollResult(String code, String failureCode) {
        static PollResult absent() {
            return new PollResult(null, "");
        }

        static PollResult rejected(String failureCode) {
            return new PollResult(null, failureCode);
        }
    }

    static PollResult consumeDefault(long nowMillis) throws IOException {
        return consume(
            FabricLoader.getInstance().getConfigDir().resolve(FILE_NAME),
            nowMillis
        );
    }

    static PollResult consume(Path inbox, long nowMillis) throws IOException {
        if (!Files.exists(inbox, LinkOption.NOFOLLOW_LINKS)) {
            return PollResult.absent();
        }
        if (!Files.isRegularFile(inbox, LinkOption.NOFOLLOW_LINKS)) {
            Files.deleteIfExists(inbox);
            return PollResult.rejected("server_pairing_inbox_not_regular");
        }

        Path claimed = inbox.resolveSibling(inbox.getFileName() + ".processing");
        Files.deleteIfExists(claimed);
        try {
            Files.move(
                inbox,
                claimed,
                StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING
            );
        } catch (AtomicMoveNotSupportedException ignored) {
            Files.move(inbox, claimed, StandardCopyOption.REPLACE_EXISTING);
        }

        try {
            if (!Files.isRegularFile(claimed, LinkOption.NOFOLLOW_LINKS)) {
                return PollResult.rejected("server_pairing_inbox_not_regular");
            }
            if (Files.size(claimed) > MAX_BYTES) {
                return PollResult.rejected("server_pairing_inbox_too_large");
            }
            long modifiedAt = Files.getLastModifiedTime(
                claimed,
                LinkOption.NOFOLLOW_LINKS
            ).toMillis();
            if (
                modifiedAt > nowMillis + 5_000L ||
                nowMillis - modifiedAt > MAX_AGE_MILLIS
            ) {
                return PollResult.rejected("server_pairing_inbox_stale");
            }

            String command = Files.readString(
                claimed,
                StandardCharsets.UTF_8
            ).trim();
            Matcher match = PAIR_COMMAND.matcher(command);
            if (!match.matches()) {
                return PollResult.rejected("server_pairing_inbox_invalid");
            }
            return new PollResult(match.group(1), "");
        } finally {
            Files.deleteIfExists(claimed);
        }
    }
}
