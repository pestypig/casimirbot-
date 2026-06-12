import { describe, expect, it } from "vitest";
import {
  isLegacyDebugPanel,
  isUnfinishedPanel,
  isUserLaunchPanel,
} from "@/lib/workstation/launchPanelPolicy";

describe("launchPanelPolicy", () => {
  it("includes workstation notes in the user launch panel list", () => {
    expect(isUserLaunchPanel("workstation-notes")).toBe(true);
  });

  it("shows one unified Situation Room entry in the user launch panel list", () => {
    expect(isUserLaunchPanel("situation-room-sources")).toBe(false);
    expect(isUserLaunchPanel("situation-room-pipelines")).toBe(true);
  });

  it("includes the Live Answer panel for present-state monitoring", () => {
    expect(isUserLaunchPanel("live-answer-environment")).toBe(true);
  });

  it("includes workstation clipboard and workflow timeline panels", () => {
    expect(isUserLaunchPanel("image-lens")).toBe(true);
    expect(isUserLaunchPanel("document-image-lens")).toBe(false);
    expect(isUserLaunchPanel("workstation-clipboard-history")).toBe(true);
    expect(isUserLaunchPanel("workstation-workflow-timeline")).toBe(true);
    expect(isUserLaunchPanel("scientific-calculator")).toBe(true);
  });

  it("includes the theory badge graph in launch panels", () => {
    expect(isUserLaunchPanel("theory-badge-graph")).toBe(true);
  });

  it("includes the Zen Badge Graph and Fruition Calculator in launch panels", () => {
    expect(isUserLaunchPanel("zen-graph")).toBe(true);
    expect(isUserLaunchPanel("fruition-calculator")).toBe(true);
  });

  it("includes the Stage Play Badge Graph in launch panels", () => {
    expect(isUserLaunchPanel("stage-play-badge-graph")).toBe(true);
  });

  it("includes the Civilization Bounds Roadmap in launch panels", () => {
    expect(isUserLaunchPanel("civilization-bounds-roadmap")).toBe(true);
    expect(isUserLaunchPanel("needle-world-roadmap")).toBe(false);
  });

  it("keeps Essence Console as a legacy/debug panel outside default launch", () => {
    expect(isUserLaunchPanel("agi-essence-console")).toBe(false);
    expect(isLegacyDebugPanel("agi-essence-console")).toBe(true);
  });

  it("shows the main Ideology & Zen panel but hides its source/debug variant", () => {
    expect(isUserLaunchPanel("mission-ethos")).toBe(true);
    expect(isUnfinishedPanel("mission-ethos")).toBe(false);
    expect(isUserLaunchPanel("mission-ethos-source")).toBe(false);
    expect(isUnfinishedPanel("mission-ethos-source")).toBe(true);
  });

  it("keeps unknown ids out of the launch panel list", () => {
    expect(isUserLaunchPanel("not-a-real-panel")).toBe(false);
  });

  it("keeps unfinished panels out of the user launch panel list", () => {
    const unfinishedPanels = [
      "agi-contribution-workbench",
      "code-admin",
      "helix-noise-gens",
      "mission-ethos-source",
      "rag-admin",
    ];

    for (const panelId of unfinishedPanels) {
      expect(isUnfinishedPanel(panelId)).toBe(true);
      expect(isUserLaunchPanel(panelId)).toBe(false);
    }
  });
});
