package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

final class FabricGameplayCommandsTest {
    @Test
    void gameplayNamespaceIsCatalogVisibleAndNotConnectorManagement() {
        assertEquals("helixgame", FabricGameplayCommands.ROOT);
        assertFalse(
            FabricCommandCatalogBuilder.isConnectorManagementRoot(
                FabricGameplayCommands.ROOT
            )
        );
        FabricCommandClassifier.Classification classification =
            FabricCommandClassifier.classify("helixgame ping");
        assertEquals("mod_command", classification.category());
        assertEquals("unknown", classification.effectClass());
    }
}
