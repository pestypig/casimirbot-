import { describe, expect, it, vi } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  readHelixSharedRoomIdFromAskSession,
  resolveHelixSharedRoomAskSessionAccess,
} from "../shared-room-ask-session";

describe("shared room Ask session access", () => {
  const availablePolicy = {
    ...buildHelixAccountCapabilityPolicy("user"),
    feature_flags: [
      ...buildHelixAccountCapabilityPolicy("user").feature_flags,
      "shared_realtime_rooms" as const,
    ],
    locked_features: buildHelixAccountCapabilityPolicy(
      "user",
    ).locked_features.filter((feature) => feature !== "shared_realtime_rooms"),
  };

  it("parses only the exact bounded room-scoped Ask session", () => {
    expect(
      readHelixSharedRoomIdFromAskSession("helix-ask:room:room:123"),
    ).toBe("room:123");
    expect(readHelixSharedRoomIdFromAskSession("helix-ask:desktop")).toBeNull();
    expect(readHelixSharedRoomIdFromAskSession("helix-ask:room:")).toBeNull();
    expect(
      readHelixSharedRoomIdFromAskSession(
        `helix-ask:room:${"r".repeat(241)}`,
      ),
    ).toBeNull();
  });

  it("admits an active member under the shared-room account policy", async () => {
    const readMembership = vi.fn().mockResolvedValue({
      roomId: "room:123",
      profileId: "profile:member",
      participantId: "participant:member",
    });
    const access = await resolveHelixSharedRoomAskSessionAccess({
      sessionId: "helix-ask:room:room:123",
      profileId: "profile:member",
      accountPolicy: availablePolicy,
      readMembership,
    });

    expect(access).toMatchObject({
      scoped: true,
      admitted: true,
      roomId: "room:123",
      participantId: "participant:member",
      reason: "active_room_member",
    });
    expect(readMembership).toHaveBeenCalledWith({
      roomId: "room:123",
      profileId: "profile:member",
    });
  });

  it("fails closed for an outsider before shared thread history can be read", async () => {
    const access = await resolveHelixSharedRoomAskSessionAccess({
      sessionId: "helix-ask:room:room:123",
      profileId: "profile:outsider",
      accountPolicy: availablePolicy,
      readMembership: vi.fn().mockResolvedValue(null),
    });

    expect(access).toMatchObject({
      scoped: true,
      admitted: false,
      reason: "room_membership_required",
    });
  });
});
