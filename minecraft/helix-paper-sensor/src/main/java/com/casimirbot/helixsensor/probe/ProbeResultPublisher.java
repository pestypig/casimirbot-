package com.casimirbot.helixsensor.probe;

import com.casimirbot.helixsensor.HelixHttpClient;
import com.casimirbot.helixsensor.HelixJson;
import java.util.Map;

public final class ProbeResultPublisher {
    private final HelixHttpClient httpClient;

    public ProbeResultPublisher(HelixHttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public void publishAsync(Map<String, Object> result) {
        httpClient.postProbeResultAsync(HelixJson.stringify(result));
    }
}
