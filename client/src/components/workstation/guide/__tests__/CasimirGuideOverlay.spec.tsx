/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/components/workstation/friends-parties/FriendsPartiesApi", () => ({
  friendsPartiesApi: { list: mocks.list },
}));

import { CasimirGuideOverlay } from "../CasimirGuideOverlay";

describe("CasimirGuideOverlay", () => {
  beforeEach(() => {
    mocks.list.mockResolvedValue({
      schema: "helix.friends_parties.response.v1",
      ok: true,
      profile: { profile_id: "profile:self" },
      friendships: [
        { state: "accepted", peer: { profile_id: "profile:friend" } },
        { state: "incoming", peer: { profile_id: "profile:request" } },
      ],
      presence: [{ profile_id: "profile:friend", state: "online" }],
      party: {
        party_id: "voice_party:guide",
        state: "active",
        gpt_attachment_state: "detached",
        members: [
          { profile: { profile_id: "profile:self" }, media_state: "direct", muted: false },
          { profile: { profile_id: "profile:friend" }, media_state: "relayed", muted: false },
        ],
      },
    });
  });

  it("projects authoritative social and party state and routes to the full panel", async () => {
    const onOpenPanel = vi.fn();
    render(<CasimirGuideOverlay open onClose={vi.fn()} onOpenPanel={onOpenPanel} />);
    fireEvent.click(screen.getByRole("button", { name: "Live Room" }));
    expect(await screen.findByText("2 members · active")).toBeTruthy();
    expect(screen.getByText("direct")).toBeTruthy();
    expect(screen.getByText("detached")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Friends & party controls/ }));
    expect(onOpenPanel).toHaveBeenCalledWith("friends-parties");
  });
});

