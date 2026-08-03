package com.casimirbot.helixsensor.fabric;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

final class FabricCommandClassifierTest {
    @Test
    void classifiesRepresentativeVanillaCommandsConservatively() {
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("locate structure minecraft:end_city")
        );
        assertEquals(
            new FabricCommandClassifier.Classification(
                "world_time_weather",
                "world_mutation"
            ),
            FabricCommandClassifier.classify("time set day")
        );
        assertEquals(
            new FabricCommandClassifier.Classification(
                "world_build",
                "world_mutation"
            ),
            FabricCommandClassifier.classify("setblock 0 64 0 minecraft:stone")
        );
        assertEquals(
            new FabricCommandClassifier.Classification(
                "server_administration",
                "server_administration"
            ),
            FabricCommandClassifier.classify("stop")
        );
        assertEquals(
            new FabricCommandClassifier.Classification(
                "server_administration",
                "server_administration"
            ),
            FabricCommandClassifier.classify("say Helix admin test")
        );
    }

    @Test
    void classifiesExecuteByItsNestedCommandAndUnknownModsAsUnknown() {
        assertEquals(
            new FabricCommandClassifier.Classification(
                "player_inventory",
                "player_mutation"
            ),
            FabricCommandClassifier.classify(
                "execute as @s at @s run give @s minecraft:torch 4"
            )
        );
        assertEquals(
            new FabricCommandClassifier.Classification("mod_command", "unknown"),
            FabricCommandClassifier.classify("crimsoncurse inspect @s")
        );
    }

    @Test
    void classifiesReadFormsOfOtherwiseMutatingRootsAsQueries() {
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("time query daytime")
        );
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("gamerule keepInventory")
        );
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("difficulty")
        );
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("worldborder get")
        );
        assertEquals(
            new FabricCommandClassifier.Classification("query", "read_only"),
            FabricCommandClassifier.classify("tick query")
        );
        assertEquals(
            new FabricCommandClassifier.Classification(
                "world_time_weather",
                "world_mutation"
            ),
            FabricCommandClassifier.classify("time set day")
        );
    }
}
