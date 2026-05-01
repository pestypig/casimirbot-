import { describe, expect, it } from "vitest";
import { isUnfinishedPanel, isUserLaunchPanel } from "@/lib/workstation/launchPanelPolicy";

describe("launchPanelPolicy", () => {
  it("includes workstation notes in the user launch panel list", () => {
    expect(isUserLaunchPanel("workstation-notes")).toBe(true);
  });

  it("includes situation room sources in the user launch panel list", () => {
    expect(isUserLaunchPanel("situation-room-sources")).toBe(true);
  });

  it("includes workstation clipboard and workflow timeline panels", () => {
    expect(isUserLaunchPanel("workstation-clipboard-history")).toBe(true);
    expect(isUserLaunchPanel("workstation-workflow-timeline")).toBe(true);
    expect(isUserLaunchPanel("scientific-calculator")).toBe(true);
  });

  it("keeps unknown ids out of the launch panel list", () => {
    expect(isUserLaunchPanel("not-a-real-panel")).toBe(false);
  });

  it("keeps unfinished panels out of the user launch panel list", () => {
    const unfinishedPanels = [
      "agi-contribution-workbench",
      "code-admin",
      "helix-noise-gens",
      "mission-ethos",
      "mission-ethos-source",
      "rag-admin",
    ];

    for (const panelId of unfinishedPanels) {
      expect(isUnfinishedPanel(panelId)).toBe(true);
      expect(isUserLaunchPanel(panelId)).toBe(false);
    }
  });
});
