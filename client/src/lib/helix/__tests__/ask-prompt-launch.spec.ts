// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  HELIX_ASK_PROMPT_EVENT,
  HELIX_PENDING_ASK_KEY,
  clearPendingHelixAskPrompt,
  consumePendingHelixAskPrompt,
  launchHelixAskPrompt,
} from "../ask-prompt-launch";

const navigateMock = vi.fn();

vi.mock("wouter/use-browser-location", () => ({
  navigate: (...args: unknown[]) => navigateMock(...args),
}));

describe("helix ask prompt launch bridge", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    clearPendingHelixAskPrompt();
    window.history.replaceState({}, "", "/helix-core");
  });

  it("stores a pending prompt and navigates to desktop when launched off desktop", () => {
    const listener = vi.fn();
    window.addEventListener(HELIX_ASK_PROMPT_EVENT, listener as EventListener);
    try {
      launchHelixAskPrompt({
        question: "Explain nhm2.proof-guardrails and cite provenance.",
        blockId: "nhm2.proof-guardrails",
        panelId: "nhm2-solve-state",
      });
    } finally {
      window.removeEventListener(HELIX_ASK_PROMPT_EVENT, listener as EventListener);
    }

    const stored = JSON.parse(window.localStorage.getItem(HELIX_PENDING_ASK_KEY) ?? "{}");
    expect(stored.question).toBe("Explain nhm2.proof-guardrails and cite provenance.");
    expect(stored.blockId).toBe("nhm2.proof-guardrails");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/desktop?desktop=1");
  });

  it("consumes and clears pending prompts deterministically", () => {
    window.localStorage.setItem(
      HELIX_PENDING_ASK_KEY,
      JSON.stringify({
        question: "Show provenance for nhm2.geometry-timing.",
        autoSubmit: false,
        blockId: "nhm2.geometry-timing",
        panelId: "nhm2-solve-state",
        createdAt: 42,
      }),
    );

    expect(consumePendingHelixAskPrompt()).toEqual({
      question: "Show provenance for nhm2.geometry-timing.",
      autoSubmit: false,
      blockId: "nhm2.geometry-timing",
      panelId: "nhm2-solve-state",
      createdAt: 42,
    });
    expect(window.localStorage.getItem(HELIX_PENDING_ASK_KEY)).toBeNull();
  });
});
