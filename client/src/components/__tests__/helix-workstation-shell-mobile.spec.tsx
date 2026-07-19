// @vitest-environment jsdom

import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelixWorkstationShell } from "@/components/workstation/HelixWorkstationShell";
import { createHelixWorkflowDemoCustomBinding } from "@/lib/helix/workflow-demos/workflow-demo-context";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useAgiChatStore } from "@/store/useAgiChatStore";
import { useHelixWorkflowDemoStore } from "@/store/useHelixWorkflowDemoStore";

vi.mock("@/components/workstation/WorkstationStage", () => ({
  WorkstationStage: () => <div data-testid="mock-workstation-stage" />,
}));

vi.mock("@/components/workstation/WorkstationResizeRail", () => ({
  WorkstationResizeRail: () => null,
}));

vi.mock("@/components/workstation/HelixAskDock", async () => {
  const ReactModule = await import("react");
  const { HelixAskWorkflowSuggestionRuntime } = await import(
    "@/components/helix/ask-console/HelixAskWorkflowSuggestionRuntime"
  );
  return {
    HelixAskDock: () => ReactModule.createElement(
      "aside",
      { "data-testid": "mock-helix-ask-dock" },
      ReactModule.createElement(HelixAskWorkflowSuggestionRuntime),
    ),
  };
});

vi.mock("@/lib/agi/api", () => ({
  deleteChatSession: vi.fn().mockResolvedValue(undefined),
}));

describe("HelixWorkstationShell mobile navigation", () => {
  let chatId = "";

  beforeEach(() => {
    window.localStorage.clear();
    useHelixWorkflowDemoStore.getState().resetDemo();
    useHelixWorkflowDemoStore.getState().clearDebugHistory();
    useAgiChatStore.setState({ sessions: {}, activeId: undefined, hydrated: true });
    chatId = useAgiChatStore.getState().ensureContextSession(
      HELIX_ASK_CONTEXT_ID.desktop,
      "Mobile navigation regression",
    );
    useAgiChatStore.getState().setActive(chatId);
  });

  afterEach(() => {
    cleanup();
    useHelixWorkflowDemoStore.getState().resetDemo();
    useHelixWorkflowDemoStore.getState().clearDebugHistory();
  });

  it("keeps the surface switch available when Workflow Demo adds a QTE to Ask", async () => {
    render(<HelixWorkstationShell layoutVariant="mobile" onOpenPanel={vi.fn()} />);

    const shell = screen.getByTestId("helix-mobile-workstation-shell");
    const navigation = screen.getByTestId("helix-mobile-surface-navigation");
    const rail = screen.getByTestId("helix-mobile-surface-rail");
    const askSurface = screen.getByTestId("helix-mobile-ask-surface");
    const workstationSurface = screen.getByTestId("helix-mobile-workstation-surface");
    const surfaceSwitch = screen.getByTestId("helix-mobile-surface-switch");

    expect(shell).toHaveStyle({ "--helix-mobile-edge-rail": "3rem" });
    expect(navigation.closest("section")).toBeNull();
    expect(navigation).toHaveClass("pointer-events-none", "absolute", "inset-0", "z-[60]", "isolate");
    expect(rail).toHaveClass("absolute", "inset-y-0", "items-center");
    expect(rail).not.toHaveClass("top-1/2");
    expect(surfaceSwitch).toHaveClass("pointer-events-auto");
    expect(askSurface).toHaveClass("pl-[var(--helix-mobile-edge-rail)]", "pointer-events-auto");
    expect(askSurface).not.toHaveAttribute("inert");
    expect(workstationSurface).toHaveClass("pr-[var(--helix-mobile-edge-rail)]", "pointer-events-none");
    expect(workstationSurface).toHaveAttribute("inert");

    fireEvent.click(surfaceSwitch);

    expect(screen.getByTestId("helix-mobile-surface-switch")).toBe(surfaceSwitch);
    expect(shell).toHaveAttribute("data-mobile-surface", "workstation");
    expect(surfaceSwitch).toHaveAttribute("data-target-surface", "ask");
    expect(askSurface).toHaveAttribute("aria-hidden", "true");
    expect(askSurface).toHaveAttribute("inert");
    expect(askSurface).toHaveClass("pointer-events-none");
    expect(workstationSurface).not.toHaveAttribute("inert");
    expect(workstationSurface).toHaveClass("pointer-events-auto");

    act(() => {
      const binding = createHelixWorkflowDemoCustomBinding(
        "Quantum energy inequalities and negative-energy constraints",
      );
      if (!binding) throw new Error("expected a valid workflow binding");
      useHelixWorkflowDemoStore.getState().startResearchPaperToProposalDemo(binding, chatId);
    });

    const qte = await screen.findByTestId("helix-ask-workflow-qte");
    expect(askSurface).toContainElement(qte);
    expect(screen.getByTestId("helix-mobile-surface-navigation")).toBe(navigation);
    expect(screen.getByTestId("helix-mobile-surface-switch")).toBe(surfaceSwitch);
    expect(screen.getAllByTestId("helix-mobile-surface-switch")).toHaveLength(1);

    fireEvent.click(surfaceSwitch);

    expect(shell).toHaveAttribute("data-mobile-surface", "ask");
    expect(askSurface).not.toHaveAttribute("inert");
    expect(askSurface).toHaveClass("pointer-events-auto");
    expect(workstationSurface).toHaveAttribute("inert");
    expect(workstationSurface).toHaveClass("pointer-events-none");
    expect(qte).toBeInTheDocument();
    expect(surfaceSwitch).toHaveAttribute("data-target-surface", "workstation");
  });
});
