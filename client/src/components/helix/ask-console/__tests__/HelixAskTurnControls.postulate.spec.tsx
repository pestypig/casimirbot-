/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const proposalMocks = vi.hoisted(() => ({
  buildClaimablePostulateReceipt: vi.fn(() => null),
  notifyPostulateBoardChanged: vi.fn(),
  rememberClaimablePostulateReceipt: vi.fn(),
  submitPostulateProposal: vi.fn(),
}));

vi.mock("@/lib/agi/proposals", () => ({
  buildClaimablePostulateReceipt: proposalMocks.buildClaimablePostulateReceipt,
  notifyPostulateBoardChanged: proposalMocks.notifyPostulateBoardChanged,
  rememberClaimablePostulateReceipt: proposalMocks.rememberClaimablePostulateReceipt,
  submitPostulateProposal: proposalMocks.submitPostulateProposal,
}));

import { HelixAskTurnControls } from "../HelixAskTurnControls";

describe("HelixAskTurnControls postulate action", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderControls = (overrides: Partial<React.ComponentProps<typeof HelixAskTurnControls>> = {}) =>
    render(
      <HelixAskTurnControls
        onCopyFinal={vi.fn()}
        onDebugCopy={vi.fn()}
        onReadAloud={vi.fn()}
        postulateText="A constructive final answer that can be attached as a postulate."
        postulateTestId="helix-ask-postulate"
        {...overrides}
      />,
    );

  it("renders the postulate action as an icon-only peer with the final-answer controls", () => {
    renderControls();

    const copy = screen.getByRole("button", { name: "Copy response" });
    const debug = screen.getByRole("button", { name: "Debug copy" });
    const readAloud = screen.getByRole("button", { name: "Read aloud" });
    const postulate = screen.getByTestId("helix-ask-postulate");

    expect(copy).toBeTruthy();
    expect(debug).toBeTruthy();
    expect(readAloud).toBeTruthy();
    expect(postulate).toBeTruthy();
    expect(postulate.textContent).toBe("");
    expect(postulate.getAttribute("aria-label")).toBe("Send postulate for review");
  });

  it("opens a composer with the /postulate prompt and attached final answer", () => {
    renderControls();

    fireEvent.click(screen.getByTestId("helix-ask-postulate"));

    expect(screen.getByText("/postulate")).toBeTruthy();
    expect(screen.getAllByText("Send this postulate to be reviewed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Postulate review note")).toBeTruthy();
    expect(screen.getByLabelText("Attached final answer")).toHaveProperty(
      "value",
      "A constructive final answer that can be attached as a postulate.",
    );
  });

  it("submits the attached final answer with explicit source ids", async () => {
    proposalMocks.submitPostulateProposal.mockResolvedValue({
      receiptId: "receipt-accepted-1",
      proposal: {
        id: "postulate-accepted-1",
        kind: "postulate",
        status: "accepted",
        title: "Accepted postulate",
        summary: "Accepted postulate",
        source: "agent",
        target: { type: "postulate-board", domain: "product", badgeGraphLocatorRefs: [] },
        patchKind: "badge-graph-suggestion",
        patch: "{}",
        rewardTokens: 0,
        safetyScore: 0.72,
        createdAt: "2026-07-07T04:00:00.000Z",
        updatedAt: "2026-07-07T04:00:00.000Z",
        createdForDay: "2026-07-07",
      },
    });
    renderControls({
      postulateOriginatingSessionId: "turn-source-1",
      postulateOriginatingAnswerId: "answer-source-1",
    });

    fireEvent.click(screen.getByTestId("helix-ask-postulate"));
    fireEvent.click(screen.getByTestId("helix-ask-postulate-submit"));

    await waitFor(() => expect(proposalMocks.submitPostulateProposal).toHaveBeenCalledTimes(1));
    expect(proposalMocks.submitPostulateProposal).toHaveBeenCalledWith(expect.objectContaining({
      proposalText: "A constructive final answer that can be attached as a postulate.",
      userComment: "Send this postulate to be reviewed",
      originatingSessionId: "turn-source-1",
      originatingAnswerId: "answer-source-1",
    }));
  });
});
