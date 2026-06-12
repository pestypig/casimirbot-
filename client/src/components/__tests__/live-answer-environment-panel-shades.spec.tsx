import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const panelSource = () =>
  fs.readFileSync(
    path.resolve(__dirname, "../workstation/LiveAnswerEnvironmentPanel.tsx"),
    "utf8",
  );

const producerSource = () =>
  fs.readFileSync(
    path.resolve(__dirname, "../../lib/helix/visualFrameProducer.ts"),
    "utf8",
  );

describe("LiveAnswerEnvironmentPanel visual observer shades controls", () => {
  it("surfaces doc equation context as observation-only context", () => {
    const source = panelSource();

    expect(source).toContain('data-testid="live-answer-doc-equation-context"');
    expect(source).toContain("Doc Equation Context");
    expect(source).toContain("observation only");
    expect(source).toContain("docEquationScopeLabel");
    expect(source).toContain("buildDocEquationContextAskPrompt");
    expect(source).toContain('aria-label="Ask Helix to explain current doc equation context"');
  });

  it("exposes explicit apply controls in the visual capture panel", () => {
    const source = panelSource();

    expect(source).toContain('aria-label="Visual observer shade subject"');
    expect(source).toContain('aria-label="Apply selected visual observer shade"');
    expect(source).toContain("Apply selected shade");
    expect(source).toContain("Selected shade applied");
  });

  it("organizes visual observer shades by subject category", () => {
    const source = panelSource();

    expect(source).toContain("visualShadeSubjectCategory");
    expect(source).toContain("Science");
    expect(source).toContain("stage_play_visual_observer_profile:solar-sdo-aia-193:v1");
    expect(source).toContain("Selected subject:");
    expect(source).toContain('label={`${group.category} subject`}');
  });

  it("applies shades through the Stage Play visual observer profile route", () => {
    const source = panelSource();

    expect(source).toContain("/api/helix/stage-play/visual-observer-profile/apply");
    expect(source).toContain("profileId: profile.profileId");
    expect(source).toContain("sourceIds: [source.source_id]");
    expect(source).toContain("Future visual frames will use this observer prompt.");
  });

  it("lets shade prompt edits save as custom profiles without mutating presets", () => {
    const source = panelSource();

    expect(source).toContain('aria-label="Visual observer shade prompt"');
    expect(source).toContain('aria-label="Save visual observer shade prompt as custom"');
    expect(source).toContain("Presets are read-only. Edits save as the next Custom slot.");
    expect(source).toContain("Save As");
    expect(source).toContain("nextVisualShadeCustomSlot");
    expect(source).toContain('title = `Custom ${slot}`');
    expect(source).toContain("/api/helix/stage-play/visual-observer-profile");
    expect(source).toContain("setSessionVisualObserverProfiles");
  });

  it("surfaces source and preset loading state for inaccessible shades", () => {
    const source = panelSource();

    expect(source).toContain('Source: {activeVisualSourceId ?? "will register on apply"}');
    expect(source).toContain("Shade presets are still loading. Refresh shades if the server was just restarted.");
    expect(source).toContain("Refresh shades");
  });

  it("exposes MicroDeck prompt presets beside visual shades", () => {
    const source = panelSource();

    expect(source).toContain('aria-label="Micro-reasoner prompt preset"');
    expect(source).toContain('aria-label="Apply selected micro-reasoner prompt preset"');
    expect(source).toContain("/api/helix/stage-play/micro-reasoner-prompt-preset/apply");
    expect(source).toContain("Future mail-loop packets will use this prompt deck.");
    expect(source).toContain("MicroDeck presets are still loading. Refresh deck if the server was just restarted.");
    expect(source).toContain("selectedMicroPromptPreview");
  });

  it("renders a local-only last-frame preview in the visual capture source panel", () => {
    const source = panelSource();

    expect(source).toContain("Latest captured visual frame preview");
    expect(source).toContain("visualProducerState?.last_frame_preview_data_url");
    expect(source).toContain("No frame preview");
    expect(source).toContain("Hook up a visual source to start preview.");
    expect(source).toContain("local only");
  });

  it("keeps a bounded local review carousel for recent visual frames", () => {
    const source = panelSource();
    const producer = producerSource();

    expect(source).toContain('data-testid="visual-frame-review-carousel"');
    expect(source).toContain("Recent frame review");
    expect(source).toContain("capped at 20 frames and auto-expiring after 10 minutes");
    expect(source).toContain("selectedVisualFrameHistory.summary");
    expect(source).toContain("selectedVisualFrameHistory.visual_prompt_hash");
    expect(source).toContain("Review previous visual frame");
    expect(source).toContain("Review next visual frame");
    expect(source).toContain("Recent visual frame thumbnails");
    expect(producer).toContain("const visualFrameHistoryLimit = 20");
    expect(producer).toContain("const visualFrameHistoryTtlMs = 10 * 60 * 1000");
    expect(producer).toContain("frame_history: pruneVisualFrameHistory");
  });

  it("uses the freshest local visual producer when server visual latest has no source", () => {
    const source = panelSource();

    expect(source).toContain("Object.values(state.producers)");
    expect(source).toContain("producer.thread_id === threadId");
    expect(source).toContain("visualProducerState?.source_id ?? null");
    expect(source).toContain('visualCaptureStatus');
    expect(source).toContain('"manual_frame_ready"');
    expect(source).toContain('window.addEventListener("helix:image-lens:visual-frame-sent"');
  });

  it("offers an Image Lens-first screen share route without starting direct frame summarization", () => {
    const source = panelSource();

    expect(source).toContain('aria-label="Visual capture route"');
    expect(source).toContain("Live Answer first");
    expect(source).toContain("Image Lens first");
    expect(source).toContain("Share to Image Lens");
    expect(source).toContain("routeVisualCaptureToImageLens");
    expect(source).toContain("setImageLensLiveSource");
    expect(source).toContain("Raw frames will not be summarized until a crop is sent");
    expect(source).toContain('window.dispatchEvent(new CustomEvent("open-helix-panel", { detail: { id: "image-lens" } }))');
  });

  it("adds a separate action replay section for re-lensing captured frames", () => {
    const source = panelSource();

    expect(source).toContain('data-testid="visual-frame-action-replay"');
    expect(source).toContain("Action replay");
    expect(source).toContain("Live capture can keep running.");
    expect(source).toContain('aria-label="Replay selected visual frame with selected shade"');
    expect(source).toContain("replaySelectedVisualFrame");
    expect(source).toContain("/api/agi/situation/visual-frame/analyze");
    expect(source).toContain("image_data_url: input.frame.preview_data_url");
    expect(source).toContain("visual_observer_profile_id: profileIsSessionOnly ? undefined : input.profile.profileId");
    expect(source).toContain("Replay results will appear here without replacing the live capture carousel.");
  });

  it("adopts tool-requested visual action replay jobs from the local carousel", () => {
    const source = panelSource();

    expect(source).toContain("HelixVisualFrameActionReplayRequest");
    expect(source).toContain("/api/agi/situation/visual-frame/replay/pending");
    expect(source).toContain("/api/agi/situation/visual-frame/replay/result");
    expect(source).toContain("visualReplayFramesForRequest");
    expect(source).toContain("request.requested_frame_history_ids");
    expect(source).toContain("request.summary_query");
    expect(source).toContain("missing_client_frames");
    expect(source).toContain("missing_shade_profile");
    expect(source).toContain("runVisualFrameActionReplayAnalysis");
  });

  it("does not mark a missing shade preset as applied", () => {
    const source = panelSource();

    expect(source).toContain("Boolean(");
    expect(source).toContain("activeVisualObserverProfile &&");
    expect(source).toContain("selectedVisualObserverProfile &&");
    expect(source).toContain("selectedShadeApplied");
  });
});
