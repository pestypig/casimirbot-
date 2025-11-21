import { describe, it, expect } from "vitest";
import { plan, execute, pushTelemetry, getLatticeVersion } from "./helpers";

describe("Plan->Execute sealed context", () => {
  it("reuses telemetry and resonance after restart", async () => {
    const desktopId = "helix.desktop.main";
    await pushTelemetry(desktopId, {
      panels: [
        {
          panelId: "near-zero",
          metrics: { mode: "yellow" },
          sourceIds: ["client/src/components/NearZeroWidget.tsx"],
        },
      ],
    });
    const planRes = await plan({ goal: "drive guard yellow?", desktopId });
    // simulate restart: rehydrate should load saved trace fields
    const execRes = await execute(planRes.traceId);
    expect(execRes.resonance_selection?.primaryPatchId).toEqual(planRes.resonance_selection?.primaryPatchId);
    expect(execRes.lattice_version).toEqual(planRes.lattice_version);
  });
});
