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
  });

  it("exposes explicit apply controls in the visual capture panel", () => {
    const source = panelSource();

    expect(source).toContain("Apply Minecraft shade");
    expect(source).toContain("Apply Generic shade");
    expect(source).toContain('aria-label="Apply Minecraft visual observer shade"');
    expect(source).toContain('aria-label="Apply generic visual observer shade"');
  });

  it("applies shades through the Stage Play visual observer profile route", () => {
    const source = panelSource();

    expect(source).toContain("/api/helix/stage-play/visual-observer-profile/apply");
    expect(source).toContain("profileId: profile.profileId");
    expect(source).toContain("sourceIds: [source.source_id]");
    expect(source).toContain("Future visual frames will use this observer prompt.");
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
    expect(source).toContain("minecraftVisualObserverProfile &&");
    expect(source).toContain("genericVisualObserverProfile &&");
  });
});
