package com.casimirbot.helixsensor;

import java.io.Closeable;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Logger;

public final class HelixHttpClient implements Closeable {
    private final HelixSensorConfig config;
    private final Logger logger;
    private final HelixSensorRuntimeStatus runtimeStatus;
    private final HttpClient client;
    private final AtomicBoolean pausedForAuth = new AtomicBoolean(false);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile long backoffUntilMs = 0L;

    public HelixHttpClient(HelixSensorConfig config, Logger logger, HelixSensorRuntimeStatus runtimeStatus) {
        this.config = config;
        this.logger = logger;
        this.runtimeStatus = runtimeStatus;
        this.client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();
    }

    public CompletableFuture<Void> postJsonAsync(String path, String json) {
        if (pausedForAuth.get() || inBackoff()) return CompletableFuture.completedFuture(null);
        HttpRequest request = base(path)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
            .build();
        long started = System.nanoTime();
        return client.sendAsync(request, HttpResponse.BodyHandlers.discarding())
            .thenAccept(response -> handleStatus(path, response.statusCode(), elapsedMillis(started)))
            .exceptionally(error -> {
                markBackoff("timeout/error posting " + path + ": " + error.getMessage());
                return null;
            });
    }

    public CompletableFuture<String> getJsonAsync(String path) {
        if (pausedForAuth.get() || inBackoff()) return CompletableFuture.completedFuture("");
        HttpRequest request = base(path)
            .GET()
            .build();
        long started = System.nanoTime();
        return client.sendAsync(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8))
            .thenApply(response -> {
                handleStatus(path, response.statusCode(), elapsedMillis(started));
                return response.statusCode() >= 200 && response.statusCode() < 300 ? response.body() : "";
            })
            .exceptionally(error -> {
                markBackoff("timeout/error getting " + path + ": " + error.getMessage());
                return "";
            });
    }

    public CompletableFuture<Void> postWorldEventBatchAsync(String json) {
        return postJsonAsync("/api/agi/situation/world-event/batch", json);
    }

    public CompletableFuture<Void> postManifestAsync(String json) {
        return postJsonAsync("/api/agi/environment/sources/manifest", json);
    }

    public CompletableFuture<Void> postHeartbeatAsync(String json) {
        return postJsonAsync("/api/agi/environment/sources/heartbeat", json);
    }

    public CompletableFuture<String> getPendingProbesAsync() {
        String source = URLEncoder.encode(config.sourceId(), StandardCharsets.UTF_8);
        return getJsonAsync("/api/agi/environment/sources/" + source + "/probes/pending?limit=" + config.maxPendingProbesPerPoll());
    }

    public CompletableFuture<Void> postProbeResultAsync(String json) {
        String source = URLEncoder.encode(config.sourceId(), StandardCharsets.UTF_8);
        return postJsonAsync("/api/agi/environment/sources/" + source + "/probes/result", json);
    }

    public boolean degraded() {
        return failureCount.get() > 0 || inBackoff();
    }

    public boolean pausedForAuth() {
        return pausedForAuth.get();
    }

    private HttpRequest.Builder base(String path) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(config.endpoint() + path))
            .timeout(Duration.ofSeconds(8))
            .header("Accept", "application/json");
        if (config.bearerToken() != null && !config.bearerToken().isBlank()) {
            builder.header("Authorization", "Bearer " + config.bearerToken());
        }
        return builder;
    }

    private void handleStatus(String path, int status, long elapsedMillis) {
        runtimeStatus.recordHttpResult(path, status, elapsedMillis);
        if (status >= 200 && status < 300) {
            failureCount.set(0);
            backoffUntilMs = 0L;
            return;
        }
        if (status == 401 || status == 403) {
            pausedForAuth.set(true);
            runtimeStatus.recordBackoff("auth_error", "http_" + status + ":" + path);
            logger.warning("Helix auth failed for " + path + "; pausing uploads.");
            return;
        }
        if (status == 413) {
            markBackoff("Helix payload too large for " + path + "; snapshots will be truncated/skipped.");
            return;
        }
        if (status == 429 || status >= 500) {
            markBackoff("Helix HTTP " + status + " for " + path);
            return;
        }
        logger.warning("Helix HTTP " + status + " for " + path);
    }

    private boolean inBackoff() {
        return System.currentTimeMillis() < backoffUntilMs;
    }

    private void markBackoff(String message) {
        int failures = Math.min(6, failureCount.incrementAndGet());
        long delayMs = Math.min(60_000L, (1L << failures) * 1000L);
        backoffUntilMs = System.currentTimeMillis() + delayMs;
        runtimeStatus.recordBackoff("backoff", message);
        logger.warning(message + " Backing off for " + delayMs + "ms.");
    }

    private long elapsedMillis(long started) {
        return Math.max(0L, (System.nanoTime() - started) / 1_000_000L);
    }

    @Override
    public void close() {
        pausedForAuth.set(true);
    }
}
