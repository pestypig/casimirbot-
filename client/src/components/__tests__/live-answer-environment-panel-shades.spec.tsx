import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const panelSource = () =>
  fs.readFileSync(
    path.resolve(__dirname, "../workstation/LiveAnswerEnvironmentPanel.tsx"),
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

  it("does not mark a missing shade preset as applied", () => {
    const source = panelSource();

    expect(source).toContain("Boolean(");
    expect(source).toContain("activeVisualObserverProfile &&");
    expect(source).toContain("selectedVisualObserverProfile &&");
    expect(source).toContain("selectedShadeApplied");
  });
});
