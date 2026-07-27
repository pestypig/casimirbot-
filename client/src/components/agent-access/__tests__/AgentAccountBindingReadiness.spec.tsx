// @vitest-environment jsdom

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AGENT_ACCOUNT_BINDINGS_ENDPOINT,
  AgentAccountBindingReadiness,
  parseAgentAccountBindingReadiness,
} from "../AgentAccountBindingReadiness";

const binding = {
  binding_ref: "agent-binding:sha256:private-binding-reference",
  issuer: "https://issuer.example/oauth?private=query#private-fragment",
  tenant_ref: "tenant:sha256:1234567890abcdef12345678",
  provider: "workos",
  status: "active",
  created_at: "2026-07-26T12:00:00.000Z",
  updated_at: "2026-07-26T12:00:00.000Z",
  revoked_at: null,
  subject_included: false,
  bearer_included: false,
  provider_subject: "private-provider-subject",
  access_token: "private-access-token",
} as const;

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const bindingsBody = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  schema: "helix.agent_account_bindings.v1",
  oauth_ready: true,
  bindings: [binding],
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AgentAccountBindingReadiness", () => {
  it("renders only sanitized provider, issuer, status, and tenant references", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(bindingsBody()));
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentAccountBindingReadiness />);

    expect(
      await screen.findByText("Linked for agent access"),
    ).toBeInTheDocument();
    expect(screen.getByText("workos")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(
      screen.getByText("https://issuer.example/oauth"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("tenant:sha256:1234567890abcdef12345678"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("agent-binding:sha256:private-binding-reference"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("private-provider-subject"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("private-access-token")).not.toBeInTheDocument();
    expect(
      screen.queryByText("2026-07-26T12:00:00.000Z"),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      AGENT_ACCOUNT_BINDINGS_ENDPOINT,
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("distinguishes a signed-in profile with no active binding", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          bindingsBody({
            oauth_ready: false,
            bindings: [
              {
                ...binding,
                status: "revoked",
                revoked_at: "2026-07-26T13:00:00.000Z",
              },
            ],
          }),
        ),
      ),
    );

    render(<AgentAccountBindingReadiness />);

    expect(
      await screen.findByText("No active agent binding"),
    ).toBeInTheDocument();
    expect(screen.getByText("revoked")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This signed-in profile has no active OAuth agent binding. This read-only panel cannot create, reactivate, or authorize one.",
      ),
    ).toBeInTheDocument();
  });

  it("distinguishes signed-out state from service configuration failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response(
          {
            ok: false,
            error: "session_required",
            message: "Private server detail must not render.",
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        response(
          {
            ok: false,
            error: "oauth_provider_not_configured",
            message: "Private configuration detail must not render.",
          },
          503,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const first = render(<AgentAccountBindingReadiness />);
    expect(
      await screen.findByText("Sign in to check binding status"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Private server detail must not render."),
    ).not.toBeInTheDocument();
    first.unmount();

    render(<AgentAccountBindingReadiness />);
    expect(
      await screen.findByText("Binding readiness unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Private configuration detail must not render."),
    ).not.toBeInTheDocument();
  });

  it("fails closed when oauth_ready disagrees with the sanitized bindings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          bindingsBody({
            oauth_ready: true,
            bindings: [],
          }),
        ),
      ),
    );

    render(<AgentAccountBindingReadiness />);

    expect(
      await screen.findByText("Binding readiness unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Linked for agent access"),
    ).not.toBeInTheDocument();
  });

  it("offers only a read-only GET refresh and no generic link action", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response(bindingsBody({ oauth_ready: false, bindings: [] })),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AgentAccountBindingReadiness />);
    await screen.findByText("No active agent binding");

    expect(
      screen.queryByRole("button", { name: /link|authorize|connect/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh binding status" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).toBe(AGENT_ACCOUNT_BINDINGS_ENDPOINT);
      expect(call[1]).toEqual(
        expect.objectContaining({
          method: "GET",
        }),
      );
    }
  });
});

describe("parseAgentAccountBindingReadiness", () => {
  it("rejects projections that could include subjects or bearer material", () => {
    expect(
      parseAgentAccountBindingReadiness(
        bindingsBody({
          bindings: [
            {
              ...binding,
              bearer_included: true,
            },
          ],
        }),
      ),
    ).toBeNull();
    expect(
      parseAgentAccountBindingReadiness(
        bindingsBody({
          bindings: [
            {
              ...binding,
              subject_included: true,
            },
          ],
        }),
      ),
    ).toBeNull();
  });
});
