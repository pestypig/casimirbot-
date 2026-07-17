import { describe, expect, it } from "vitest";
import {
  buildHelixAskLiveRuntimeSourceBinding,
  buildHelixAskMinimalRuntimeWorkspaceContext,
} from "../HelixAskMinimalRuntimeWorkspaceContext";
import { buildHelixAskMinimalRuntimeSubmitPlan } from "../HelixAskMinimalRuntimeSubmitPlan";

describe("Helix Ask minimal runtime workstation context", () => {
  it("prefers the live layout focus and emits gateway-compatible panel fields", () => {
    const context = buildHelixAskMinimalRuntimeWorkspaceContext({
      sessionId: "helix-chat:test",
      desktopUrl: "http://localhost:1522/desktop?focus=account-session&doc=docs/research/test.md",
      layoutState: {
        activeGroupId: "group-main",
        groups: {
          "group-main": {
            activePanelId: "scientific-calculator",
            panelIds: ["account-session", "scientific-calculator"],
          },
        },
      },
    });

    expect(context).toMatchObject({
      activePanel: "scientific-calculator",
      active_panel: "scientific-calculator",
      activeGroupId: "group-main",
      groupCount: 1,
      openPanels: ["account-session", "scientific-calculator"],
      activeDocPath: "docs/research/test.md",
    });

    const submitPlan = buildHelixAskMinimalRuntimeSubmitPlan({
      draft: "Which workstation panel are you currently looking at?",
      selectedRuntime: "codex",
      desktopUrl: "http://localhost:1522/desktop",
      workspaceContextSnapshot: context,
    });
    expect(submitPlan.context).toMatchObject({
      activePanel: "scientific-calculator",
      openPanels: ["account-session", "scientific-calculator"],
    });
  });

  it("builds a fresh Live source binding from the same layout context", () => {
    expect(buildHelixAskLiveRuntimeSourceBinding({
      desktopUrl: "http://localhost:1522/desktop?focus=account-session",
      layoutState: {
        activeGroupId: "group-main",
        groups: {
          "group-main": {
            activePanelId: "docs-viewer",
            panelIds: ["account-session", "docs-viewer"],
          },
        },
      },
    })).toEqual({
      thread_id: "helix-ask:desktop",
      source_id: "helix-ask:desktop",
      source_kind: "helix_ask_workstation",
      focus_panel_id: "docs-viewer",
    });
  });
});
