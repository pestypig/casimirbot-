/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const launchMocks = vi.hoisted(() => ({
  launchHelixAskPrompt: vi.fn(),
}));

vi.mock("@/lib/helix/ask-prompt-launch", () => ({
  launchHelixAskPrompt: launchMocks.launchHelixAskPrompt,
}));

import { HelixAskTurnControls } from "../HelixAskTurnControls";

describe("HelixAskTurnControls postulate action", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.clearAllTimers();
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

  it("launches an auto-submitted /postulate runtime review turn with explicit source ids", () => {
    renderControls({
      postulateOriginatingSessionId: "turn-source-1",
      postulateOriginatingAnswerId: "answer-source-1",
    });

    fireEvent.click(screen.getByTestId("helix-ask-postulate"));

    expect(launchMocks.launchHelixAskPrompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("/postulate")).toBeNull();
    expect(screen.queryByLabelText("Postulate review note")).toBeNull();
    expect(screen.queryByLabelText("Attached final answer")).toBeNull();
    expect(launchMocks.launchHelixAskPrompt).toHaveBeenCalledWith(expect.objectContaining({
      autoSubmit: true,
      forceReasoningDispatch: true,
      question: expect.stringContaining("/postulate\nReview this postulate candidate"),
      routeMetadata: expect.objectContaining({
        invocationKind: "postulate_final_answer_review",
        allowedCapabilities: ["postulate.submit_proposal"],
        requiredCanonicalGoal: "postulate_runtime_review_then_gated_submit",
      }),
    }));
    const payload = launchMocks.launchHelixAskPrompt.mock.calls[0]?.[0];
    expect(payload.question).toContain("Return JSON only with this shape:");
    expect(payload.question).toContain("Evidence context:");
    expect(payload.question).toContain("Candidate postulate:");
    expect(payload.question).toContain("A constructive final answer that can be attached as a postulate.");
    expect(payload.question).toContain("Originating session: turn-source-1");
    expect(payload.question).toContain("Originating answer: answer-source-1");
    expect(payload.question).toContain("decision");
    expect(payload.question).toContain("readinessRating");
    expect(payload.question).toContain("not claim proof");
  });

  it("carries recent scientific Image Lens evidence refs into postulate review metadata", () => {
    renderControls({
      postulateOriginatingAnswerId: "answer-source-1",
      postulateEvidenceText: [
        "I am using the latest scientific Image Lens evidence chain, not a fresh scholarly lookup.",
        "Evidence depth: `exact_row_promoted`.",
        "Sidecar: `ask:turn-1:scientific_image_evidence_sidecar:retry:ask:turn-2`.",
        "Image Lens source: `pdf-page-render:a57b3f7f064f9ade`.",
        "Crop ref: `sha256:23e70bd8fb953a139ca1afcc206cd51dd4f76c66bbef7524b487b63ba77fdf95#crop=73,570,1078,87`.",
        "Active promoted row blockers: `none`.",
        "Theory Badge Graph reflection completed as diagnostic evidence only.",
        "Calculator status: template_only.",
      ].join("\n"),
    });

    fireEvent.click(screen.getByTestId("helix-ask-postulate"));

    const payload = launchMocks.launchHelixAskPrompt.mock.calls[0]?.[0];
    expect(payload.routeMetadata.evidenceContext).toMatchObject({
      evidenceSidecarRefs: [expect.stringContaining("scientific_image_evidence_sidecar")],
      promotedEquationRowRefs: [expect.stringContaining("promoted_equation_row:sha256")],
      pageRenderRefs: expect.arrayContaining(["pdf-page-render:a57b3f7f064f9ade"]),
      cropRefs: [expect.stringContaining("sha256:23e70bd8fb953a139")],
      graphReflectionRefs: ["graph_reflection:diagnostic:answer-source-1"],
      calculatorCheckRefs: ["calculator_check:template_admissibility:template_only"],
    });
    expect(payload.question).toContain("promotedEquationRowRefs");
    expect(payload.question).toContain("graphReflectionRefs");
  });
});
