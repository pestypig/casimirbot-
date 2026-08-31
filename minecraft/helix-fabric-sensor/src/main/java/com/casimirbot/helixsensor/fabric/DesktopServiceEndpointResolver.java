package com.casimirbot.helixsensor.fabric;

import com.casimirbot.helixsensor.HelixJson;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/**
 * Resolves the installed desktop service's current per-launch loopback origin
 * without carrying a desktop-session secret into Minecraft. The existing
 * room-source credential and exact binding path remain unchanged.
 */
final class DesktopServiceEndpointResolver {
    private static final String RECEIPT_SCHEMA =
        "casimir_desktop_service_ready_receipt/1";
    private static final String RECEIPT_OVERRIDE_ENV =
        "CASIMIRBOT_DESKTOP_READY_RECEIPT";
    private static final String RECEIPT_RELATIVE_PATH =
        "@casimirbot/desktop/state/desktop-service-ready.json";

    private DesktopServiceEndpointResolver() {}

    static String resolve(String configuredEndpoint) {
        return resolve(configuredEndpoint, defaultReceiptPath());
    }

    static String resolve(String configuredEndpoint, Path receiptPath) {
        URI configured = exactLoopbackBindingEndpoint(configuredEndpoint);
        if (configured == null || receiptPath == null || !Files.isRegularFile(receiptPath)) {
            return configuredEndpoint;
        }
        try {
            Map<String, Object> receipt = HelixJson.asObject(
                HelixJson.parse(Files.readString(receiptPath, StandardCharsets.UTF_8))
            );
            if (
                !RECEIPT_SCHEMA.equals(receipt.get("schema")) ||
                !Boolean.TRUE.equals(receipt.get("ready")) ||
                !(receipt.get("origin") instanceof String origin) ||
                !(receipt.get("serviceProcessId") instanceof Number processNumber)
            ) {
                return configuredEndpoint;
            }
            long processId = processNumber.longValue();
            if (processId <= 0L || ProcessHandle.of(processId).map(ProcessHandle::isAlive).orElse(false) == false) {
                return configuredEndpoint;
            }
            URI currentOrigin = exactLoopbackOrigin(origin);
            if (currentOrigin == null) return configuredEndpoint;
            return new URI(
                "http",
                null,
                "127.0.0.1",
                currentOrigin.getPort(),
                configured.getPath(),
                null,
                null
            ).toString();
        } catch (IOException | RuntimeException | java.net.URISyntaxException ignored) {
            return configuredEndpoint;
        }
    }

    private static Path defaultReceiptPath() {
        String override = System.getenv(RECEIPT_OVERRIDE_ENV);
        if (override != null && !override.isBlank()) return Path.of(override.trim());
        String appData = System.getenv("APPDATA");
        if (appData == null || appData.isBlank()) return null;
        return Path.of(appData).resolve(RECEIPT_RELATIVE_PATH);
    }

    private static URI exactLoopbackBindingEndpoint(String value) {
        try {
            URI endpoint = URI.create(value);
            return "http".equals(endpoint.getScheme()) &&
                "127.0.0.1".equals(endpoint.getHost()) &&
                endpoint.getPort() > 0 &&
                endpoint.getPort() <= 65_535 &&
                endpoint.getRawUserInfo() == null &&
                endpoint.getRawQuery() == null &&
                endpoint.getRawFragment() == null &&
                endpoint.getPath() != null &&
                endpoint.getPath().matches("^/api/room-ingress/v1/bindings/[^/]{1,320}$")
                    ? endpoint
                    : null;
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    private static URI exactLoopbackOrigin(String value) {
        try {
            URI origin = URI.create(value);
            return "http".equals(origin.getScheme()) &&
                "127.0.0.1".equals(origin.getHost()) &&
                origin.getPort() > 0 &&
                origin.getPort() <= 65_535 &&
                origin.getRawUserInfo() == null &&
                origin.getRawQuery() == null &&
                origin.getRawFragment() == null &&
                (origin.getPath() == null || origin.getPath().isEmpty() || "/".equals(origin.getPath()))
                    ? origin
                    : null;
        } catch (RuntimeException ignored) {
            return null;
        }
    }
}
