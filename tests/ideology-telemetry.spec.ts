import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  buildIdeologyPanelTelemetry,
  IDEOLOGY_TELEMETRY_SCHEMA_PATH,
} from "../shared/ideology-telemetry";
import { saveConsoleTelemetry } from "../server/services/console-telemetry/store";
import { collectPanelSnapshots } from "../server/services/telemetry/panels";

describe("ideology telemetry", () => {
  it("schema has core metrics and flags", () => {
    const schema = JSON.parse(readFileSync(IDEOLOGY_TELEMETRY_SCHEMA_PATH, "utf-8"));
    expect(schema.metrics).toBeTruthy();
    expect(schema.flags).toBeTruthy();
    expect(schema.metrics.noise_laplacian_rms).toBeTruthy();
    expect(schema.flags.artifacts_complete).toBeTruthy();
  });

  it("builds a panel telemetry payload", () => {
    const panel = buildIdeologyPanelTelemetry({
      nodeId: "citizens-arc",
      surface: "ui",
      metrics: { noise_laplacian_rms: 0.25, determinism_rate: 0.92 },
      flags: { artifacts_complete: true },
      notes: "sample",
    });

    expect(panel.panelId).toBe("ideology");
    expect(panel.kind).toBe("ideology");
    expect(panel.metrics?.noise_laplacian_rms).toBe(0.25);
    expect(panel.flags?.artifacts_complete).toBe(true);
    expect(panel.sourceIds).toContain("citizens-arc");
  });

  it("preserves additive provenance fields in panel snapshots", () => {
    const desktopId = "toe018.ideology";
    const panel = buildIdeologyPanelTelemetry({
      nodeId: "citizens-arc",
      panelId: "ideology",
      metrics: { determinism_rate: 0.92 },
    });
    saveConsoleTelemetry({ desktopId, capturedAt: panel.lastUpdated, panels: [panel] });

    const snapshot = collectPanelSnapshots({ desktopId, panelIds: ["ideology"], strictProvenance: true });
    expect(snapshot.fail_tag).toBeUndefined();
    expect(snapshot.panels[0]?.provenance_class).toBe("measured");
    expect(snapshot.panels[0]?.claim_tier).toBe("certified");
    expect(snapshot.panels[0]?.certifying).toBe(true);
  });
});
