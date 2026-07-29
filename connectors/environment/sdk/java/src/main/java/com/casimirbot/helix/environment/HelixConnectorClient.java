package com.casimirbot.helix.environment;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Objects;

/**
 * Minimal outbound-only Helix Connector Protocol client.
 *
 * Callers are responsible for parsing the canonical v1 JSON envelopes. This
 * helper owns only bounded HTTPS transport and never exposes the credential in
 * toString(), exceptions, or logs.
 */
public final class HelixConnectorClient {
  private final URI baseUri;
  private final HttpClient httpClient;
  private final char[] deviceCredential;

  public HelixConnectorClient(
      URI baseUri,
      String deviceCredential,
      HttpClient httpClient
  ) {
    this.baseUri = Objects.requireNonNull(baseUri, "baseUri");
    if (!baseUri.isAbsolute()
        || (!"https".equalsIgnoreCase(baseUri.getScheme())
            && !("http".equalsIgnoreCase(baseUri.getScheme())
                && isLoopbackHost(baseUri.getHost())))) {
      throw new IllegalArgumentException(
          "Connector transport requires HTTPS except on localhost.");
    }
    if (baseUri.getUserInfo() != null
        || baseUri.getQuery() != null
        || baseUri.getFragment() != null) {
      throw new IllegalArgumentException(
          "Connector base URI must not contain credentials, query, or fragment.");
    }
    if (deviceCredential == null
        || !deviceCredential.startsWith("helix_env_device_")) {
      throw new IllegalArgumentException("Invalid device credential.");
    }
    this.deviceCredential = deviceCredential.toCharArray();
    this.httpClient = Objects.requireNonNull(httpClient, "httpClient");
  }

  public String pollPending(int limit)
      throws IOException, InterruptedException {
    int boundedLimit = Math.max(1, Math.min(16, limit));
    var request = authorizedRequest(
        "/api/environment-connectors/v1/device/probes/pending?limit="
            + boundedLimit)
        .GET()
        .build();
    return send(request);
  }

  public String submitResult(String submissionJson)
      throws IOException, InterruptedException {
    Objects.requireNonNull(submissionJson, "submissionJson");
    var request = authorizedRequest(
        "/api/environment-connectors/v1/device/probes/result")
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(submissionJson))
        .build();
    return send(request);
  }

  public String heartbeat() throws IOException, InterruptedException {
    var request = authorizedRequest(
        "/api/environment-connectors/v1/device/heartbeat")
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString("{}"))
        .build();
    return send(request);
  }

  private HttpRequest.Builder authorizedRequest(String path) {
    return HttpRequest.newBuilder(baseUri.resolve(path))
        .timeout(Duration.ofSeconds(15))
        .header("Authorization", "Bearer " + new String(deviceCredential))
        .header("Accept", "application/json");
  }

  private String send(HttpRequest request)
      throws IOException, InterruptedException {
    var response = httpClient.send(
        request,
        HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IOException(
          "Helix connector request failed with HTTP " + response.statusCode());
    }
    return response.body();
  }

  private static boolean isLoopbackHost(String host) {
    return "localhost".equalsIgnoreCase(host)
        || "127.0.0.1".equals(host)
        || "::1".equals(host);
  }

  @Override
  public String toString() {
    return "HelixConnectorClient{baseUri=[redacted], "
        + "deviceCredential=[redacted]}";
  }
}
