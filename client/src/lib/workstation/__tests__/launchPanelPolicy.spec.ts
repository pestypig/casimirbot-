import { describe, expect, it } from "vitest";
import { isUserLaunchPanel } from "@/lib/workstation/launchPanelPolicy";

describe("launchPanelPolicy", () => {
  it("includes workstation notes in the user launch panel list", () => {
    expect(isUserLaunchPanel("workstation-notes")).toBe(true);
  });

  it("includes workstation clipboard and workflow timeline panels", () => {
    expect(isUserLaunchPanel("workstation-clipboard-history")).toBe(true);
    expect(isUserLaunchPanel("workstation-workflow-timeline")).toBe(true);
    expect(isUserLaunchPanel("scientific-calculator")).toBe(true);
  });

  it("keeps unknown ids out of the launch panel list", () => {
    expect(isUserLaunchPanel("not-a-real-panel")).toBe(false);
  });
});
