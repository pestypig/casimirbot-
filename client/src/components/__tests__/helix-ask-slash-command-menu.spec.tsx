// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
} from "@shared/helix-account-session";
import { HelixAskSlashCommandMenu } from "@/components/helix/ask-console/HelixAskSlashCommandMenu";
import {
  buildHelixAskSlashCommandMenuItems,
} from "@/components/helix/ask-console/HelixAskSlashCommandCatalog";
import {
  insertHelixAskSlashCommandPrompt,
  resolveHelixAskSlashCommandTrigger,
} from "@/components/helix/ask-console/HelixAskSlashCommandInsertion";
import {
  buildHelixAskSlashCommandMenuState,
  resolveHelixAskSlashCommandMenuKey,
} from "@/components/helix/ask-console/HelixAskSlashCommandMenuState";

afterEach(() => cleanup());

describe("Helix Ask slash command menu", () => {
  it("builds account-scoped command items without exposing developer-only commands to user accounts", () => {
    const userItems = buildHelixAskSlashCommandMenuItems({
      accountPolicy: HELIX_USER_ACCOUNT_POLICY,
      runtime: { id: "codex", label: "Codex Workstation Mode" },
    });
    expect(userItems.map((item) => item.command)).toEqual(
      expect.arrayContaining(["/calculator", "/research", "/docs", "/image"]),
    );
    expect(userItems.some((item) => item.command === "/situation")).toBe(false);

    const developerItems = buildHelixAskSlashCommandMenuItems({
      accountPolicy: HELIX_DEVELOPER_ACCOUNT_POLICY,
      runtime: { id: "codex", label: "Codex Workstation Mode" },
    });
    expect(developerItems.some((item) => item.command === "/situation")).toBe(true);
  });

  it("filters commands and tracks keyboard navigation without executing tools", () => {
    const items = buildHelixAskSlashCommandMenuItems({
      accountPolicy: HELIX_USER_ACCOUNT_POLICY,
      runtime: { id: "codex", label: "Codex Workstation Mode" },
    });
    const state = buildHelixAskSlashCommandMenuState({
      open: true,
      query: "calc",
      items,
      selectedIndex: 0,
    });
    expect(state.items).toHaveLength(1);
    expect(state.selectedItem?.command).toBe("/calculator");
    expect(
      resolveHelixAskSlashCommandMenuKey({
        key: "ArrowDown",
        open: true,
        selectedIndex: 0,
        itemCount: 2,
      }),
    ).toMatchObject({ handled: true, action: "select", selectedIndex: 1 });
    expect(
      resolveHelixAskSlashCommandMenuKey({
        key: "Enter",
        open: true,
        selectedIndex: 0,
        itemCount: 1,
      }),
    ).toMatchObject({ handled: true, action: "insert" });
    expect(
      resolveHelixAskSlashCommandMenuKey({
        key: "Enter",
        open: true,
        selectedIndex: -1,
        itemCount: 0,
      }),
    ).toMatchObject({ handled: true, action: "none" });
  });

  it("replaces only the active slash token with safe prompt scaffold text", () => {
    const value = "Before /calc";
    const trigger = resolveHelixAskSlashCommandTrigger({
      value,
      selectionStart: value.length,
      selectionEnd: value.length,
    });
    expect(trigger).toMatchObject({ query: "calc" });

    expect(
      insertHelixAskSlashCommandPrompt({
        value,
        trigger,
        insertionText: "Use the scientific calculator capability to ",
      }),
    ).toEqual({
      value: "Before Use the scientific calculator capability to ",
      cursor: "Before Use the scientific calculator capability to ".length,
    });
  });

  it("renders command descriptions and calls selection without submitting or fetching", () => {
    const onSelect = vi.fn();
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
    const items = buildHelixAskSlashCommandMenuItems({
      accountPolicy: HELIX_USER_ACCOUNT_POLICY,
      runtime: { id: "codex", label: "Codex Workstation Mode" },
    });
    render(
      <HelixAskSlashCommandMenu
        state={buildHelixAskSlashCommandMenuState({
          open: true,
          query: "",
          items,
          selectedIndex: 0,
        })}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByTestId("helix-ask-slash-command-menu")).toBeTruthy();
    expect(screen.getByText("/calculator")).toBeTruthy();
    expect(screen.getByText(/Solve or inspect a mathematical expression/)).toBeTruthy();

    fireEvent.mouseDown(screen.getByTestId("helix-ask-slash-command-calculator"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ command: "/calculator" }));
    expect(fetchMock).not.toHaveBeenCalled();
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });
});
