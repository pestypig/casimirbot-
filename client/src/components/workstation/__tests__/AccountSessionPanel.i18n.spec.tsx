// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountSessionPanel from "@/components/workstation/AccountSessionPanel";
import { hawMessages } from "@/lib/i18n/messages/haw";
import { INTERFACE_MESSAGE_IDS } from "@/lib/i18n/messages/types";

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

const statusBodyWithMappedStates = {
  ...statusBody,
  ok: true,
  session: {
    session_id: "session-123",
    profile: {
      profile_id: "profile-123",
      display_name: "Localized State Tester",
      email: "tester@example.test",
      auth_mode: "local_dev_profile",
      provider: "local",
    },
    status: "active",
    memory_scope: "session_only",
    created_at: "2026-06-16T00:00:00.000Z",
    updated_at: "2026-06-16T00:00:00.000Z",
  },
  linked_accounts: [
    {
      provider: "browser",
      external_id: "browser-account-1",
      display_name: null,
      status: "linked",
      authority: "viewer",
      linked_at: "2026-06-16T00:00:00.000Z",
    },
  ],
  profile_ingress_tokens: [
    {
      token_id: "token-1",
      label: "State token",
      token_prefix: "cbt_test",
      public_ingress_url: "https://example.test/ingress/token-1",
      scopes: ["source_event"],
      status: "active",
      request_count: 0,
      last_used_at: null,
      created_at: "2026-06-16T00:00:00.000Z",
      revoked_at: null,
    },
  ],
};

const archiveRows = [
  {
    archive_id: "archive-1",
    source_family: "helix-ask:desktop",
    session_title: "Archive title",
    objective: "Archive objective",
    started_at: "2026-06-16T00:00:00.000Z",
    ended_at: "2026-06-16T00:05:00.000Z",
    summary: "Archive summary",
    evidence_index: [],
    subgoals: [],
    learned_pattern_candidates: [],
    raw_logs_included: false,
    assistant_answer: false,
  },
];

const jobRows = [
  {
    job_id: "job-1",
    thread_id: "helix-ask:desktop",
    profile_id: "profile-123",
    room_id: null,
    source_family: "helix-ask:desktop",
    source_ids: [],
    world_id: null,
    objective: "Job objective",
    status: "running",
    policy: {
      mode: "observe",
      evidence_budget: "small",
      surface_policy: "account-panel-test",
      archive_on_stop: false,
      profile_archive_policy: "manual",
    },
    counters: {
      source_events_seen: 0,
      categorization_events: 0,
      synthetic_evidence: 0,
      utility_hypotheses: 0,
      pattern_candidates: 0,
    },
    latest_summary: null,
    last_event_ts: null,
    archive_id: null,
    raw_logs_included: false,
    assistant_answer: false,
    updated_at: "2026-06-16T00:00:00.000Z",
  },
];

function mockFetch(accountStatus = statusBody) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/account/session")) {
      return new Response(JSON.stringify(accountStatus), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.startsWith("/api/discord/sessions")) {
      return new Response(JSON.stringify({ sessions: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.startsWith("/api/agi/situation/profile-archives")) {
      return new Response(JSON.stringify({ archives: accountStatus.session ? archiveRows : [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.startsWith("/api/agi/situation/categorization-jobs")) {
      return new Response(JSON.stringify({ jobs: accountStatus.session ? jobRows : [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
      expect(screen.getByText("Moʻokāki a me nā kau")).toBeInTheDocument();
      expect(screen.getByText("ʻŌlelo")).toBeInTheDocument();
      expect(screen.getByText("ʻŌlelo no ke alo")).toBeInTheDocument();
    });
    expect(screen.getByRole("combobox")).toHaveValue("haw");
    expect(
      screen.getByRole("option", {
        name: `Hawaiian (ʻŌlelo Hawaiʻi) - ${Object.keys(hawMessages).length}/${INTERFACE_MESSAGE_IDS.length} catalog strings`,
      }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("haw");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("renders known backend states through localized display labels instead of raw enum values", async () => {
    localStorage.setItem("helix-start-settings", JSON.stringify({ interfaceLanguage: "haw" }));
    vi.stubGlobal("fetch", mockFetch(statusBodyWithMappedStates));

    render(<AccountSessionPanel />);

    await waitFor(() => {
      expect(screen.getByText("Localized State Tester")).toBeInTheDocument();
      expect(screen.getAllByText(/e hana nei/).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/kau wale nō/)).toBeInTheDocument();
    expect(screen.getByText(/local dev profile/)).toBeInTheDocument();
    expect(screen.getAllByText(/kūloko/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hoʻopili ʻia/).length).toBeGreaterThan(0);
    expect(screen.getByText(/mea nānā/)).toBeInTheDocument();
    expect(screen.getAllByText(/Helix Ask desktop/).length).toBeGreaterThan(0);
    expect(screen.getByText(/ke holo nei/)).toBeInTheDocument();
    expect(screen.getByText(/ʻaʻohe lumi/)).toBeInTheDocument();
    expect(screen.getAllByText(/ʻaʻohe/).length).toBeGreaterThan(0);

    expect(screen.queryByText(/local_dev_profile/)).not.toBeInTheDocument();
    expect(screen.queryByText(/session_only/)).not.toBeInTheDocument();
    expect(screen.queryByText(/helix-ask:desktop/)).not.toBeInTheDocument();
    expect(screen.queryByText(/false/)).not.toBeInTheDocument();
  });
});
