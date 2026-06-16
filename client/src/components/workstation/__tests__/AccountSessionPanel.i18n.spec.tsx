// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountSessionPanel from "@/components/workstation/AccountSessionPanel";

vi.mock("@/components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <button type="button">Google sign-in mock</button>,
}));

const statusBody = {
  schema: "helix.account_session_status.v1",
  ok: false,
  session: null,
  linked_accounts: [],
  profile_ingress_tokens: [],
  profile_ingress_usage: {
    request_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    estimated_token_count: 0,
    last_event_at: null,
  },
  usage: {
    thread_count: 0,
    item_count: 0,
    answer_count: 0,
    tool_observation_count: 0,
    validation_count: 0,
    estimated_token_count: 0,
    window_started_at: "",
    window_ended_at: "",
  },
  auth_boundary: {
    credential_collection_allowed_in_agents: false,
    raw_password_stored: false,
    discord_bot_password_collection_allowed: false,
    recommended_flow: "web_auth_or_oauth_link",
  },
};

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/account/session")) {
      return new Response(JSON.stringify(statusBody), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.startsWith("/api/discord/sessions")) {
      return new Response(JSON.stringify({ sessions: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.startsWith("/api/agi/situation/profile-archives")) {
      return new Response(JSON.stringify({ archives: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.startsWith("/api/agi/situation/categorization-jobs")) {
      return new Response(JSON.stringify({ jobs: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({}), { status: 404, headers: { "Content-Type": "application/json" } });
  });
}

describe("AccountSessionPanel interface language", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  it("renders reviewed Hawaiian catalog entries when the account setting selects Hawaiian", async () => {
    localStorage.setItem("helix-start-settings", JSON.stringify({ interfaceLanguage: "haw" }));
    vi.stubGlobal("fetch", mockFetch());

    render(<AccountSessionPanel />);

    await waitFor(() => {
      expect(screen.getByText("ʻŌlelo")).toBeInTheDocument();
      expect(screen.getByText("ʻŌlelo no ke alo")).toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toHaveValue("haw");
    expect(document.documentElement.lang).toBe("haw");
    expect(document.documentElement.dir).toBe("ltr");
  });
});
