package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

final class FabricCommandAuthorityPolicyTest {
    @Test
    void fullAdministratorAdmitsEveryDispatcherClassification() {
        assertTrue(FabricCommandAuthorityPolicy.profileAllows(
            "server_administrator",
            "mod_command",
            "unknown"
        ));
        assertTrue(FabricCommandAuthorityPolicy.profileAllows(
            "server_administrator",
            "server_administration",
            "server_administration"
        ));
    }

    @Test
    void restrictedProfilesRemainCategoryAndEffectBounded() {
        assertTrue(FabricCommandAuthorityPolicy.profileAllows(
            "observe",
            "query",
            "read_only"
        ));
        assertFalse(FabricCommandAuthorityPolicy.profileAllows(
            "observe",
            "world_time_weather",
            "world_mutation"
        ));
        assertTrue(FabricCommandAuthorityPolicy.profileAllows(
            "player_assistant",
            "player_inventory",
            "player_mutation"
        ));
        assertFalse(FabricCommandAuthorityPolicy.profileAllows(
            "player_assistant",
            "world_build",
            "world_mutation"
        ));
        assertFalse(FabricCommandAuthorityPolicy.profileAllows(
            "world_operator",
            "server_administration",
            "server_administration"
        ));
    }

    @Test
    void restrictedPlayerCommandsCannotTargetOtherPlayersOrBroadSelectors() {
        List<String> players = List.of("Dan", "Alex");
        assertTrue(FabricCommandAuthorityPolicy.confinedToSelectedPlayer(
            "give @s minecraft:torch 4",
            "Dan",
            players
        ));
        assertTrue(FabricCommandAuthorityPolicy.confinedToSelectedPlayer(
            "effect give @s minecraft:night_vision 30",
            "Dan",
            players
        ));
        assertFalse(FabricCommandAuthorityPolicy.confinedToSelectedPlayer(
            "give Alex minecraft:diamond 1",
            "Dan",
            players
        ));
        assertFalse(FabricCommandAuthorityPolicy.confinedToSelectedPlayer(
            "effect give @a minecraft:strength 30",
            "Dan",
            players
        ));
    }
}
