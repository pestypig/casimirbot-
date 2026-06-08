import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tabsPath = path.resolve(process.cwd(), "client/src/components/workstation/WorkstationPanelTabs.tsx");
const stagePlayPath = path.resolve(process.cwd(), "client/src/components/panels/StagePlayBadgeGraphPanel.tsx");

describe("WorkstationPanelTabs layering", () => {
  it("keeps the launch panel picker above Stage Play panel overlays", () => {
    const tabsSource = fs.readFileSync(tabsPath, "utf8");
    const stagePlaySource = fs.readFileSync(stagePlayPath, "utf8");

    expect(tabsSource).toContain("top-8 z-[90] w-72");
    expect(tabsSource).toContain("Launch panel");
    expect(stagePlaySource).toContain("fixed z-[80]");
  });
});
