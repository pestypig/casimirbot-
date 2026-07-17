// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_USER_ACCOUNT_POLICY } from "@shared/helix-account-session";
import { fetchAccountCapabilityPolicy } from "@/lib/workstation/accountCapabilityPolicy";
import { WorkstationPanelHost } from "../WorkstationPanelHost";

const testState = vi.hoisted(() => ({
  interfaceLanguage: "en",
}));

vi.mock("@/hooks/useHelixStartSettings", () => ({
  useHelixStartSettings: () => ({
    userSettings: { interfaceLanguage: testState.interfaceLanguage },
  }),
}));

describe("WorkstationPanelHost account policy", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    testState.interfaceLanguage = "en";
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

  it("renders the workflow demo lab for public user-policy deep links", async () => {
    vi.stubGlobal("React", React);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ account_policy: HELIX_USER_ACCOUNT_POLICY }),
      })),
    );
    await fetchAccountCapabilityPolicy();

    render(<WorkstationPanelHost panelId="workflow-demo-lab" />);

    expect(await screen.findByTestId("workflow-demo-lab-panel")).toBeTruthy();
    expect(screen.queryByText(/reserved for developer mode/i)).toBeNull();
  });

  it("renders locked panel chrome through the selected interface language", async () => {
    testState.interfaceLanguage = "haw";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ account_policy: HELIX_USER_ACCOUNT_POLICY }),
      })),
    );
    await fetchAccountCapabilityPolicy();

    render(<WorkstationPanelHost panelId="code-admin" />);

    expect(screen.getByText("Ua laka \u02bbia \u02bbo Luna Ho\u02bbokele Code")).toBeTruthy();
    expect(screen.getByText(/M\u0101lama \u02bbia k\u0113ia hi\u02bbohi\u02bbona workstation/)).toBeTruthy();
  });
});
