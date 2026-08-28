import { beforeEach, describe, expect, it } from "vitest";
import { realtimeTexturePackHarnessStore } from "../realtime-texture-pack-harness-store";
import { executeRealtimeTexturePackHarnessGatewayCapability } from "../realtime-texture-pack-harness";

describe("Realtime Texture Pack harness control", () => {
  beforeEach(() => realtimeTexturePackHarnessStore.resetForTests());

  it("fails closed until Image Lens creates a user lease", () => {
    const result = executeRealtimeTexturePackHarnessGatewayCapability({
      capabilityId: "realtime_texture_pack.show_overlay",
      profileId: "profile:developer",
    });
    expect(result.ok).toBe(false);
    expect("error" in result ? result.error : null).toBe("active_user_lease_required");
  });

  it("queues only user-allowed actions and distinguishes queueing from observation", () => {
    realtimeTexturePackHarnessStore.renew({
      profileId: "profile:developer",
      sessionId: "texture-session:test",
      allowedActions: ["reveal_original", "stop"],
      clientState: { capture_active: true, overlay_visible: true, session_status: "streaming" },
    });

    const show = executeRealtimeTexturePackHarnessGatewayCapability({
      capabilityId: "realtime_texture_pack.show_overlay",
      profileId: "profile:developer",
    });
    expect(show.ok).toBe(false);
    expect("error" in show ? show.error : null).toBe("action_not_allowed_by_user");

    const reveal = executeRealtimeTexturePackHarnessGatewayCapability({
      capabilityId: "realtime_texture_pack.reveal_original",
      profileId: "profile:developer",
    });
    expect(reveal.ok).toBe(true);
    expect(reveal.status).toBe("queued");
    expect(reveal.observation.requested_state_observed).toBe(false);
    expect(reveal.observation).not.toHaveProperty("pixels");
    expect(realtimeTexturePackHarnessStore.poll("profile:developer", "texture-session:test").commands)
      .toHaveLength(1);
  });

  it("revokes the mailbox with the owning capture session", () => {
    realtimeTexturePackHarnessStore.renew({
      profileId: "profile:developer",
      sessionId: "texture-session:test",
      allowedActions: ["stop"],
      clientState: { capture_active: true, overlay_visible: false, session_status: "streaming" },
    });
    realtimeTexturePackHarnessStore.revoke("profile:developer", "texture-session:other");
    expect(realtimeTexturePackHarnessStore.inspect("profile:developer").lease_active).toBe(true);
    realtimeTexturePackHarnessStore.revoke("profile:developer", "texture-session:test");
    expect(realtimeTexturePackHarnessStore.inspect("profile:developer").lease_active).toBe(false);
  });
});
