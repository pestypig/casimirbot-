package com.casimirbot.helixsensor.pairing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

final class ConnectorPairingClientTest {
    private HttpServer server;
    private String baseUrl;
    private final AtomicBoolean unpairAuthorized = new AtomicBoolean(false);
    private final AtomicBoolean commandOnlyResponse = new AtomicBoolean(false);

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext(
            ConnectorPairingClient.REDEEM_PATH,
            this::redeem
        );
        server.createContext(
            ConnectorPairingClient.UNPAIR_PATH,
            this::unpair
        );
        server.start();
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void redeemsAndSelfRevokesWithoutPuttingManagementInAgentState()
        throws Exception {
        try (ConnectorPairingClient client = new ConnectorPairingClient()) {
            String nonce = ConnectorPairingClient.newRedemptionNonce();
            ConnectorPairingClient.PairedSourceConfig paired = client.redeem(
                baseUrl + ConnectorPairingClient.REDEEM_PATH,
                "ABCD-2345",
                nonce,
                "minecraft.fabric_mod.v1",
                "0.1.0"
            );
            assertEquals("room:test", paired.roomId());
            assertEquals("minecraft:fabric:test", paired.worldId());
            assertFalse(paired.replayed());
            assertTrue(paired.bearerToken().startsWith("helix_room_src_"));
            assertEquals(
                Boolean.TRUE,
                paired.commandConfig().get("command_execution_enabled")
            );
            assertEquals(
                Boolean.FALSE,
                paired.commandConfig().get("host_access_enabled")
            );
            client.unpair(paired);
            assertTrue(unpairAuthorized.get());
        }
    }

    @Test
    void rejectsNonTlsRemotePairingEndpoints() {
        try (ConnectorPairingClient client = new ConnectorPairingClient()) {
            ConnectorPairingClient.PairingException error = assertThrows(
                ConnectorPairingClient.PairingException.class,
                () -> client.redeem(
                    "http://example.com" + ConnectorPairingClient.REDEEM_PATH,
                    "ABCD-2345",
                    ConnectorPairingClient.newRedemptionNonce(),
                    "minecraft.fabric_mod.v1",
                    "0.1.0"
                )
            );
            assertEquals("connector_pairing_endpoint_unsafe", error.code());
        }
    }

    @Test
    void acceptsCommandOnlyPairingWithoutReplacingTheSourceCredential()
        throws Exception {
        commandOnlyResponse.set(true);
        try (ConnectorPairingClient client = new ConnectorPairingClient()) {
            ConnectorPairingClient.PairedSourceConfig paired = client.redeem(
                baseUrl + ConnectorPairingClient.REDEEM_PATH,
                "ABCD-2345",
                ConnectorPairingClient.newRedemptionNonce(),
                "minecraft.fabric_mod.v1",
                "0.1.0"
            );
            assertTrue(paired.commandOnly());
            assertTrue(paired.bearerToken().isBlank());
            assertEquals(
                "command_authority:test",
                paired.commandConfig().get("command_authority_id")
            );
        }
    }

    private void redeem(HttpExchange exchange) throws IOException {
        if (commandOnlyResponse.get()) {
            String response = """
                {
                  "schema":"helix.connector_pairing_redemption.v1",
                  "ok":true,
                  "error":null,
                  "replayed":false,
                  "plugin_config":{
                    "pairing_mode":"command_only",
                    "pairing_endpoint":"%s/api/environment-connectors/v1/pairing/redeem",
                    "source_id":"source:room-ingress:test",
                    "room_id":"room:test",
                    "world_id":"minecraft:fabric:test",
                    "domain_adapter":"minecraft.fabric_mod.v1",
                    "command":{
                      "schema":"helix.environment_command.connector_config.v1",
                      "endpoint":"%s/api/environment-command/v1/authorities/command_authority%%3Atest",
                      "bearer_token":"helix_env_cmd_%s",
                      "command_authority_id":"command_authority:test",
                      "environment_binding_id":"environment_binding:test",
                      "room_id":"room:test",
                      "source_id":"source:room-ingress:test",
                      "world_id":"minecraft:fabric:test",
                      "adapter_profile_id":"game.minecraft.readonly.v1",
                      "domain_adapter":"minecraft.fabric_mod.v1",
                      "policy_version":1,
                      "command_execution_enabled":true,
                      "host_access_enabled":false,
                      "automatic_retry_enabled":false,
                      "expires_at":"2099-01-01T00:00:00.000Z"
                    }
                  }
                }
                """.formatted(baseUrl, baseUrl, "c".repeat(43));
            send(exchange, 200, response);
            return;
        }
        String response = """
            {
              "schema":"helix.connector_pairing_redemption.v1",
              "ok":true,
              "error":null,
              "replayed":false,
              "plugin_config":{
                "endpoint":"%s/api/room-ingress/v1/bindings/room_source_binding%%3Atest",
                "pairing_endpoint":"%s/api/environment-connectors/v1/pairing/redeem",
                "bearer_token":"helix_room_src_%s",
                "source_id":"source:room-ingress:test",
                "room_id":"room:test",
                "world_id":"minecraft:fabric:test",
                "domain_adapter":"minecraft.fabric_mod.v1",
                "execution_enabled":false,
                "command":{
                  "schema":"helix.environment_command.connector_config.v1",
                  "endpoint":"%s/api/environment-command/v1/authorities/command_authority%%3Atest",
                  "bearer_token":"helix_env_cmd_%s",
                  "command_authority_id":"command_authority:test",
                  "environment_binding_id":"environment_binding:test",
                  "room_id":"room:test",
                  "source_id":"source:room-ingress:test",
                  "world_id":"minecraft:fabric:test",
                  "adapter_profile_id":"game.minecraft.readonly.v1",
                  "domain_adapter":"minecraft.fabric_mod.v1",
                  "policy_version":1,
                  "command_execution_enabled":true,
                  "host_access_enabled":false,
                  "automatic_retry_enabled":false,
                  "expires_at":"2099-01-01T00:00:00.000Z"
                }
              }
            }
            """.formatted(
                baseUrl,
                baseUrl,
                "a".repeat(43),
                baseUrl,
                "b".repeat(43)
            );
        send(exchange, 200, response);
    }

    private void unpair(HttpExchange exchange) throws IOException {
        unpairAuthorized.set(
            ("Bearer helix_room_src_" + "a".repeat(43)).equals(
                exchange.getRequestHeaders().getFirst("Authorization")
            )
        );
        send(
            exchange,
            unpairAuthorized.get() ? 200 : 401,
            "{\"ok\":true,\"status\":\"revoked\"}"
        );
    }

    private static void send(
        HttpExchange exchange,
        int status,
        String body
    ) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getRequestBody().readAllBytes();
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
