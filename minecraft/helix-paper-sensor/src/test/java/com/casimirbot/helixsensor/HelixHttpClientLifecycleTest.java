package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.casimirbot.helixsensor.scope.SensorScope;
import com.casimirbot.helixsensor.scope.SensorScopePolicy;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

final class HelixHttpClientLifecycleTest {
    private HttpServer server;
    private ExecutorService executor;
    private String endpoint;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        executor = Executors.newCachedThreadPool();
        server.setExecutor(executor);
        server.start();
        endpoint = "http://127.0.0.1:" + server.getAddress().getPort()
            + "/api/room-ingress/v1/bindings/test-binding";
    }

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
        if (executor != null) executor.shutdownNow();
    }

    @Test
    void projectsProducerRequestIdentityWithTheServerDigestContract() {
        assertEquals(
            "request_sha256:"
                + "4bde0f382d3ad9b8ec11fc61784f4f863d0942903125a693de6cc203d86b4800",
            HelixHttpClient.requestProjectionId(
                "test-binding",
                "request:fixed"
            )
        );
    }

    @Test
    void usesHttp11WithoutAHiddenCleartextHttp2Upgrade() throws Exception {
        List<String> upgradeHeaders = new CopyOnWriteArrayList<>();
        List<String> http2SettingsHeaders = new CopyOnWriteArrayList<>();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/manifest",
            exchange -> {
                upgradeHeaders.add(String.valueOf(
                    exchange.getRequestHeaders().getFirst("Upgrade")
                ));
                http2SettingsHeaders.add(String.valueOf(
                    exchange.getRequestHeaders().getFirst("HTTP2-Settings")
                ));
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );

        HelixHttpClient client = client(new AtomicInteger());
        HelixHttpClient.IngressResponse manifest = client
            .postManifestAsync("{}")
            .get(5, TimeUnit.SECONDS);

        assertTrue(manifest.success());
        assertEquals(List.of("null"), upgradeHeaders);
        assertEquals(List.of("null"), http2SettingsHeaders);
        client.close();
    }

    @Test
    void retriesWithTheSameIdentityAndSerializesQueuedDelivery() throws Exception {
        AtomicInteger manifestAttempts = new AtomicInteger();
        List<String> manifestRequestIds = new CopyOnWriteArrayList<>();
        List<String> manifestSequences = new CopyOnWriteArrayList<>();
        server.createContext("/api/room-ingress/v1/bindings/test-binding/manifest", exchange -> {
            manifestRequestIds.add(exchange.getRequestHeaders().getFirst("X-Helix-Request-Id"));
            manifestSequences.add(exchange.getRequestHeaders().getFirst("X-Helix-Sequence"));
            if (manifestAttempts.incrementAndGet() == 1) {
                respond(
                    exchange,
                    503,
                    receipt(exchange, false, "room_source_unavailable")
                );
            } else {
                respond(exchange, 200, receipt(exchange, true, null));
            }
        });

        AtomicInteger activeHeartbeats = new AtomicInteger();
        AtomicInteger maxConcurrentHeartbeats = new AtomicInteger();
        List<Long> heartbeatSequences = new CopyOnWriteArrayList<>();
        server.createContext("/api/room-ingress/v1/bindings/test-binding/heartbeat", exchange -> {
            int active = activeHeartbeats.incrementAndGet();
            maxConcurrentHeartbeats.accumulateAndGet(active, Math::max);
            heartbeatSequences.add(Long.parseLong(
                exchange.getRequestHeaders().getFirst("X-Helix-Sequence")
            ));
            try {
                try {
                    Thread.sleep(75L);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                }
                respond(exchange, 200, receipt(exchange, true, null));
            } finally {
                activeHeartbeats.decrementAndGet();
            }
        });

        HelixHttpClient client = client(new AtomicInteger());
        HelixHttpClient.IngressResponse manifest = client
            .postManifestAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertTrue(manifest.success());
        assertEquals(2, manifestAttempts.get());
        assertEquals(1, manifestRequestIds.stream().distinct().count());
        assertEquals(1, manifestSequences.stream().distinct().count());

        var first = client.postHeartbeatAsync("{}");
        var second = client.postHeartbeatAsync("{}");
        assertTrue(first.get(5, TimeUnit.SECONDS).success());
        assertTrue(second.get(5, TimeUnit.SECONDS).success());
        assertEquals(1, maxConcurrentHeartbeats.get());
        assertEquals(List.of(2L, 3L), heartbeatSequences);
        client.close();
    }

    @Test
    void prioritizesOnDemandProbePollingAheadOfQueuedTelemetry() throws Exception {
        CountDownLatch firstHeartbeatEntered = new CountDownLatch(1);
        CountDownLatch releaseFirstHeartbeat = new CountDownLatch(1);
        AtomicBoolean holdFirstHeartbeat = new AtomicBoolean(true);
        List<String> deliveryOrder = new CopyOnWriteArrayList<>();
        List<Long> deliverySequences = new CopyOnWriteArrayList<>();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                deliveryOrder.add("heartbeat");
                deliverySequences.add(Long.parseLong(
                    exchange.getRequestHeaders().getFirst("X-Helix-Sequence")
                ));
                if (holdFirstHeartbeat.compareAndSet(true, false)) {
                    firstHeartbeatEntered.countDown();
                    try {
                        releaseFirstHeartbeat.await(5, TimeUnit.SECONDS);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                    }
                }
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/probes/pending",
            exchange -> {
                deliveryOrder.add("probe_requests");
                deliverySequences.add(Long.parseLong(
                    exchange.getRequestHeaders().getFirst("X-Helix-Sequence")
                ));
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );

        HelixHttpClient client = client(new AtomicInteger());
        var firstHeartbeat = client.postHeartbeatAsync("{}");
        assertTrue(firstHeartbeatEntered.await(2, TimeUnit.SECONDS));
        var secondHeartbeat = client.postHeartbeatAsync("{}");
        var pendingProbe = client.getPendingProbesAsync();
        releaseFirstHeartbeat.countDown();

        assertTrue(firstHeartbeat.get(5, TimeUnit.SECONDS).success());
        assertFalse(pendingProbe.get(5, TimeUnit.SECONDS).isBlank());
        assertTrue(secondHeartbeat.get(5, TimeUnit.SECONDS).success());
        assertEquals(
            List.of("heartbeat", "probe_requests", "heartbeat"),
            deliveryOrder
        );
        assertEquals(List.of(1L, 2L, 3L), deliverySequences);
        client.close();
    }

    @Test
    void prioritizesManifestReadmissionAheadOfQueuedTelemetry() throws Exception {
        CountDownLatch firstHeartbeatEntered = new CountDownLatch(1);
        CountDownLatch releaseFirstHeartbeat = new CountDownLatch(1);
        AtomicBoolean holdFirstHeartbeat = new AtomicBoolean(true);
        List<String> deliveryOrder = new CopyOnWriteArrayList<>();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                deliveryOrder.add("heartbeat");
                if (holdFirstHeartbeat.compareAndSet(true, false)) {
                    firstHeartbeatEntered.countDown();
                    try {
                        releaseFirstHeartbeat.await(5, TimeUnit.SECONDS);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                    }
                }
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/manifest",
            exchange -> {
                deliveryOrder.add("manifest");
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );

        HelixHttpClient client = client(new AtomicInteger());
        var firstHeartbeat = client.postHeartbeatAsync("{}");
        assertTrue(firstHeartbeatEntered.await(2, TimeUnit.SECONDS));
        var secondHeartbeat = client.postHeartbeatAsync("{}");
        var manifest = client.postManifestAsync("{}");
        releaseFirstHeartbeat.countDown();

        assertTrue(firstHeartbeat.get(5, TimeUnit.SECONDS).success());
        assertTrue(manifest.get(5, TimeUnit.SECONDS).success());
        assertTrue(secondHeartbeat.get(5, TimeUnit.SECONDS).success());
        assertEquals(
            List.of("heartbeat", "manifest", "heartbeat"),
            deliveryOrder
        );
        client.close();
    }

    @Test
    void priorityProbePollingBypassesTelemetryRetryBackoff() throws Exception {
        CountDownLatch heartbeatEntered = new CountDownLatch(1);
        CountDownLatch releaseHeartbeat = new CountDownLatch(1);
        AtomicInteger heartbeatAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                heartbeatAttempts.incrementAndGet();
                heartbeatEntered.countDown();
                try {
                    releaseHeartbeat.await(5, TimeUnit.SECONDS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                }
                respond(
                    exchange,
                    503,
                    receipt(exchange, false, "room_source_unavailable")
                );
            }
        );
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/probes/pending",
            exchange -> respond(exchange, 200, receipt(exchange, true, null))
        );

        HelixHttpClient client = client(new AtomicInteger());
        var heartbeat = client.postHeartbeatAsync("{}");
        assertTrue(heartbeatEntered.await(2, TimeUnit.SECONDS));
        var pendingProbe = client.getPendingProbesAsync();
        releaseHeartbeat.countDown();

        assertFalse(heartbeat.get(5, TimeUnit.SECONDS).success());
        assertFalse(pendingProbe.get(5, TimeUnit.SECONDS).isBlank());
        assertEquals(1, heartbeatAttempts.get());
        client.close();
    }

    @Test
    void manifestReadmissionRespectsTransportBackoff() throws Exception {
        AtomicInteger heartbeatAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                heartbeatAttempts.incrementAndGet();
                respond(
                    exchange,
                    503,
                    receipt(exchange, false, "room_source_unavailable")
                );
            }
        );
        AtomicInteger manifestAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/manifest",
            exchange -> {
                manifestAttempts.incrementAndGet();
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );

        HelixHttpClient client = client(new AtomicInteger());
        HelixHttpClient.IngressResponse heartbeat = client
            .postHeartbeatAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertFalse(heartbeat.success());
        assertEquals(3, heartbeatAttempts.get());

        HelixHttpClient.IngressResponse manifest = client
            .postManifestAsync("{}")
            .get(2, TimeUnit.SECONDS);
        assertEquals("client_backoff", manifest.errorCode());
        assertEquals(0, manifestAttempts.get());
        client.close();
    }

    @Test
    void surfacesOutcomeUnknownWithoutRetryAndStopsOnClosedBinding() throws Exception {
        AtomicInteger outcomeAttempts = new AtomicInteger();
        server.createContext("/api/room-ingress/v1/bindings/test-binding/manifest", exchange -> {
            outcomeAttempts.incrementAndGet();
            respond(
                exchange,
                503,
                receipt(
                    exchange,
                    false,
                    "room_source_request_outcome_unknown"
                )
            );
        });
        AtomicInteger terminalCallbacks = new AtomicInteger();
        HelixHttpClient client = client(terminalCallbacks);
        HelixHttpClient.IngressResponse outcome = client
            .postManifestAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertTrue(outcome.outcomeUnknown());
        assertEquals(1, outcomeAttempts.get());
        assertFalse(client.terminallyPaused());
        client.close();

        server.removeContext("/api/room-ingress/v1/bindings/test-binding/manifest");
        server.createContext("/api/room-ingress/v1/bindings/test-binding/heartbeat", exchange ->
            respond(
                exchange,
                410,
                receipt(exchange, false, "room_source_binding_closed")
            )
        );
        HelixSensorConfig closedConfig = config();
        HelixSensorRuntimeStatus closedStatus = new HelixSensorRuntimeStatus(
            closedConfig
        );
        HelixHttpClient closedClient = client(
            closedConfig,
            closedStatus,
            terminalCallbacks
        );
        HelixHttpClient.IngressResponse closed = closedClient
            .postHeartbeatAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertFalse(closed.success());
        assertTrue(closedClient.terminallyPaused());
        assertEquals(1, terminalCallbacks.get());
        assertEquals("binding_inactive", closedStatus.backoffState);
        assertTrue(
            closedStatus.lastError.contains("request=" + closed.requestId())
        );
        assertTrue(
            closedStatus.lastError.contains("sequence=" + closed.sequence())
        );
        closedClient.close();
    }

    @Test
    void rejectsIdentityOrSafetyMismatchesAndAcceptsExactReplay() throws Exception {
        AtomicInteger manifestAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/manifest",
            exchange -> {
                manifestAttempts.incrementAndGet();
                respond(
                    exchange,
                    200,
                    receipt(
                        exchange,
                        true,
                        null,
                        Map.of("source_id", "source:room-ingress:wrong")
                    )
                );
            }
        );
        AtomicInteger heartbeatAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                heartbeatAttempts.incrementAndGet();
                respond(
                    exchange,
                    200,
                    receipt(
                        exchange,
                        true,
                        null,
                        Map.of("terminal_eligible", true)
                    )
                );
            }
        );
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/world-events/batch",
            exchange -> respond(
                exchange,
                200,
                receipt(
                    exchange,
                    true,
                    null,
                    Map.of("replayed", true)
                )
            )
        );
        AtomicInteger probeResultAttempts = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/probes/result",
            exchange -> {
                probeResultAttempts.incrementAndGet();
                respond(
                    exchange,
                    200,
                    receipt(
                        exchange,
                        true,
                        null,
                        Map.of("request_id", "request:other")
                    )
                );
            }
        );

        HelixSensorConfig config = config();
        HelixSensorRuntimeStatus status = new HelixSensorRuntimeStatus(config);
        HelixHttpClient client = client(config, status, new AtomicInteger());

        HelixHttpClient.IngressResponse wrongSource = client
            .postManifestAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertFalse(wrongSource.success());
        assertEquals("invalid_ingress_receipt", wrongSource.errorCode());
        assertEquals(3, manifestAttempts.get());
        assertTrue(status.lastManifestSuccessAt == null);

        HelixHttpClient.IngressResponse unsafe = client
            .postHeartbeatAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertFalse(unsafe.success());
        assertEquals("invalid_ingress_receipt", unsafe.errorCode());
        assertEquals(3, heartbeatAttempts.get());
        assertTrue(status.lastHeartbeatSuccessAt == null);

        HelixHttpClient.IngressResponse wrongRequest = client
            .postProbeResultAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertFalse(wrongRequest.success());
        assertEquals("invalid_ingress_receipt", wrongRequest.errorCode());
        assertEquals(3, probeResultAttempts.get());

        HelixHttpClient.IngressResponse replay = client
            .postWorldEventBatchAsync("{}")
            .get(5, TimeUnit.SECONDS);
        assertTrue(replay.success());
        assertTrue(replay.replayed());
        client.close();
    }

    @Test
    void boundsQueuedWorkWhileTheTransportIsSlow() throws Exception {
        CountDownLatch firstRequestEntered = new CountDownLatch(1);
        CountDownLatch releaseFirstRequest = new CountDownLatch(1);
        AtomicBoolean holdFirstRequest = new AtomicBoolean(true);
        AtomicInteger received = new AtomicInteger();
        server.createContext(
            "/api/room-ingress/v1/bindings/test-binding/heartbeat",
            exchange -> {
                received.incrementAndGet();
                if (holdFirstRequest.compareAndSet(true, false)) {
                    firstRequestEntered.countDown();
                    try {
                        releaseFirstRequest.await(5, TimeUnit.SECONDS);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                    }
                }
                respond(exchange, 200, receipt(exchange, true, null));
            }
        );

        HelixHttpClient client = client(new AtomicInteger());
        List<CompletableFuture<HelixHttpClient.IngressResponse>> admitted =
            new ArrayList<>();
        admitted.add(client.postHeartbeatAsync("{}"));
        assertTrue(firstRequestEntered.await(2, TimeUnit.SECONDS));
        for (int index = 1; index < HelixHttpClient.MAX_QUEUED_REQUESTS; index++) {
            admitted.add(client.postHeartbeatAsync("{}"));
        }

        HelixHttpClient.IngressResponse overflow = client
            .postHeartbeatAsync("{}")
            .get(2, TimeUnit.SECONDS);
        assertEquals("client_queue_full", overflow.errorCode());
        assertFalse(overflow.delivered());

        releaseFirstRequest.countDown();
        for (CompletableFuture<HelixHttpClient.IngressResponse> future : admitted) {
            assertTrue(future.get(10, TimeUnit.SECONDS).success());
        }
        assertEquals(HelixHttpClient.MAX_QUEUED_REQUESTS, received.get());
        client.close();
    }

    private HelixHttpClient client(AtomicInteger terminalCallbacks) {
        HelixSensorConfig config = config();
        return client(
            config,
            new HelixSensorRuntimeStatus(config),
            terminalCallbacks
        );
    }

    private HelixHttpClient client(
        HelixSensorConfig config,
        HelixSensorRuntimeStatus runtimeStatus,
        AtomicInteger terminalCallbacks
    ) {
        return new HelixHttpClient(
            config,
            Logger.getLogger("HelixHttpClientLifecycleTest"),
            runtimeStatus,
            terminalCallbacks::incrementAndGet
        );
    }

    private HelixSensorConfig config() {
        return new HelixSensorConfig(
            true,
            endpoint,
            "helix_room_src_test",
            "source:room-ingress:test",
            "shared_realtime_room:test",
            "minecraft:test",
            "minecraft.paper_plugin.v1",
            "Test source",
            100,
            300,
            40,
            20,
            120,
            true,
            true,
            48_000,
            1,
            new SensorScopePolicy(
                SensorScope.PLAYER_OBSERVABLE,
                false,
                false,
                true
            ),
            true,
            8,
            false,
            false,
            new HelixSensorConfig.SeedMapOptions(
                64,
                "village",
                true,
                1,
                true,
                true
            ),
            new HelixSensorConfig.SnapshotOptions(
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                false,
                16,
                16,
                8,
                0,
                24,
                48,
                128,
                48,
                64
            ),
            new HelixSensorConfig.ProbeOptions(64, 250, 10_000)
        );
    }

    private static String receipt(
        HttpExchange exchange,
        boolean ok,
        String error
    ) {
        return receipt(exchange, ok, error, Map.of());
    }

    private static String receipt(
        HttpExchange exchange,
        boolean ok,
        String error,
        Map<String, Object> overrides
    ) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("schema", "helix.room_source_ingress_receipt.v1");
        value.put("ok", ok);
        value.put("error", error);
        value.put("message", ok ? "accepted" : "rejected");
        value.put("binding_id", "test-binding");
        value.put("room_id", "shared_realtime_room:test");
        value.put("source_id", "source:room-ingress:test");
        value.put("world_id", "minecraft:test");
        value.put(
            "request_id",
            HelixHttpClient.requestProjectionId(
                "test-binding",
                exchange.getRequestHeaders().getFirst("X-Helix-Request-Id")
            )
        );
        value.put("kind", kindFor(exchange));
        value.put("accepted", ok);
        value.put("replayed", false);
        value.put(
            "content_role",
            "source_observation_not_assistant_answer"
        );
        value.put("reentry_required", true);
        value.put("answer_authority", false);
        value.put("assistant_answer", false);
        value.put("terminal_eligible", false);
        value.put("raw_content_included", false);
        value.putAll(overrides);
        return HelixJson.stringify(value);
    }

    private static String kindFor(HttpExchange exchange) {
        String path = exchange.getRequestURI().getPath();
        if (path.endsWith("/world-events/batch")) return "world_event_batch";
        if (path.endsWith("/manifest")) return "manifest";
        if (path.endsWith("/heartbeat")) return "heartbeat";
        if (path.endsWith("/probes/pending")) return "probe_requests";
        if (path.endsWith("/probes/result")) return "probe_result";
        if (path.endsWith("/status")) return "status";
        throw new IllegalArgumentException("Unknown test ingress route: " + path);
    }

    private static void respond(
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
