package com.casimirbot.helixplayer.fabric;

import com.casimirbot.helixsensor.HelixJson;
import com.casimirbot.helixsensor.HelixSensorConfig;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

final class PlayerActionHttpClient implements AutoCloseable {
    record Response(int statusCode, Map<String, Object> body) {
        boolean ok() {
            return statusCode >= 200 && statusCode < 300 && Boolean.TRUE.equals(body.get("ok"));
        }

        String error() {
            Object value = body.get("error");
            return value instanceof String text && !text.isBlank()
                ? text
                : "action_connector_request_failed";
        }
    }

    private final PlayerActionConfig config;
    private final HttpClient client;

    PlayerActionHttpClient(PlayerActionConfig config) {
        if (!config.ready()) throw new IllegalArgumentException("Player-action config is inactive.");
        this.config = config;
        this.client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .version(HttpClient.Version.HTTP_1_1)
            .build();
    }

    Response get(String suffix) throws IOException, InterruptedException {
        return send(
            HttpRequest.newBuilder(endpoint(suffix))
                .GET()
                .timeout(Duration.ofSeconds(12))
                .build()
        );
    }

    Response post(String suffix, Map<String, Object> payload)
        throws IOException, InterruptedException {
        return send(
            HttpRequest.newBuilder(endpoint(suffix))
                .POST(HttpRequest.BodyPublishers.ofString(
                    HelixJson.stringifyIncludingNulls(payload)
                ))
                .timeout(Duration.ofSeconds(12))
                .header("Content-Type", "application/json")
                .build()
        );
    }

    private Response send(HttpRequest unauthed) throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder(unauthed.uri())
            .timeout(unauthed.timeout().orElse(Duration.ofSeconds(12)))
            .method(unauthed.method(), unauthed.bodyPublisher().orElse(HttpRequest.BodyPublishers.noBody()))
            .header("Accept", "application/json")
            .header("Authorization", "Bearer " + config.bearerToken());
        unauthed.headers().map().forEach((key, values) ->
            values.forEach(value -> builder.header(key, value))
        );
        HttpResponse<String> response = client.send(
            builder.build(),
            HttpResponse.BodyHandlers.ofString()
        );
        Map<String, Object> body;
        try {
            body = HelixJson.asObject(HelixJson.parse(response.body()));
        } catch (RuntimeException error) {
            body = Map.of("ok", false, "error", "action_connector_response_invalid");
        }
        return new Response(response.statusCode(), body);
    }

    private URI endpoint(String suffix) {
        String value = InstalledDesktopServiceEndpointResolver.resolve(
            config.endpoint().replaceAll("/+$", "") + suffix
        );
        if (!HelixSensorConfig.secureEndpointAllowed(value)) {
            throw new IllegalArgumentException("Player-action endpoint must use HTTPS or loopback HTTP.");
        }
        return URI.create(value);
    }

    @Override
    public void close() {
        // java.net.http.HttpClient has no close method on Java 21.
    }
}
