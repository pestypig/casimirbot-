package com.casimirbot.helixsensor;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

final class RoomIngressEndpointTest {
    @Test
    void recognizesFirstPartyRoomIngressWithoutConfusingLegacyBaseUrls() {
        assertTrue(HelixHttpClient.isRoomIngressEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding:abc"
        ));
        assertTrue(HelixHttpClient.isRoomIngressEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding%3Aabc"
        ));
        assertFalse(HelixHttpClient.isRoomIngressEndpoint("https://casimirbot.com"));
        assertTrue(HelixHttpClient.isRoomIngressEndpoint(
            "https://casimirbot.com/casimir/api/room-ingress/v1/bindings/room_source_binding:abc"
        ));
        assertFalse(HelixHttpClient.isRoomIngressEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding:abc/status"
        ));
        assertFalse(HelixHttpClient.isRoomIngressEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding:abc?token=wrong"
        ));
        assertFalse(HelixHttpClient.isRoomIngressEndpoint("not a url"));
    }

    @Test
    void requiresHttpsExceptForLoopbackDevelopment() {
        assertTrue(HelixSensorConfig.secureEndpointAllowed("https://casimirbot.com/api/room-ingress/v1/bindings/a"));
        assertTrue(HelixSensorConfig.secureEndpointAllowed("http://localhost:5050"));
        assertTrue(HelixSensorConfig.secureEndpointAllowed("http://127.0.0.1:5050"));
        assertFalse(HelixSensorConfig.secureEndpointAllowed("http://example.com"));
        assertFalse(HelixSensorConfig.secureEndpointAllowed("replace-me"));
        assertTrue(HelixSensorConfig.credentialAllowedForEndpoint("http://localhost:5050", "replace-me"));
        assertTrue(HelixSensorConfig.credentialAllowedForEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding:abc",
            "helix_room_src_secret"
        ));
        assertFalse(HelixSensorConfig.credentialAllowedForEndpoint(
            "https://casimirbot.com/api/room-ingress/v1/bindings/room_source_binding:abc",
            "replace-me"
        ));
    }
}
