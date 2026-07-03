// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_USER_ACCOUNT_POLICY } from "@shared/helix-account-session";
import { fetchAccountCapabilityPolicy } from "@/lib/workstation/accountCapabilityPolicy";
import { WorkstationPanelHost } from "../WorkstationPanelHost";

vi.mock("@/hooks/useHelixStartSettings", () => ({
  useHelixStartSettings: () => ({
    userSettings: { interfaceLanguage: "en" },
  }),
}));

vi.mock("@/lib/i18n/interfaceText", () => ({
  useInterfaceText: () => ({
    t: (_key: string, fallback?: Record<string, unknown>) =>
      typeof fallback?.title === "string" ? fallback.title : "",
  }),
}));

describe("WorkstationPanelHost account policy", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a lock screen for locked panel deep links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ account_policy: HELIX_USER_ACCOUNT_POLICY }),
      })),
    );
    await fetchAccountCapabilityPolicy();

    render(<WorkstationPanelHost panelId="code-admin" />);

    expect(screen.getByText("Code Admin is locked")).toBeTruthy();
    expect(screen.getByText(/reserved for developer mode/i)).toBeTruthy();
  });
});
