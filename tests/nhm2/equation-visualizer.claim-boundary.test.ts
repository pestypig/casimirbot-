import { describe, expect, it } from "vitest";
import {
  validateNhm2EquationVisualizerManifest,
  validateNhm2EquationVisualizerPresetFile,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { loadEquationVisualizerManifest, loadEquationVisualizerPresets } from "./equation-visualizer.test-utils.js";

describe("NHM2 equation visualizer claim boundary", () => {
  it("keeps visualizer preset and output claim locks closed", () => {
    const presets = loadEquationVisualizerPresets();
    for (const preset of presets.presets) {
      expect(preset.claimBoundary).toEqual({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }
    const manifest = loadEquationVisualizerManifest();
    for (const output of manifest.outputs) {
      expect(output.claimBoundary).toEqual({
        diagnosticOnly: true,
        doesValidateNHM2: false,
        validationClaimAllowed: false,
        physicalMechanismClaimAllowed: false,
        promotionAllowed: false,
      });
    }
  });

  it("rejects forbidden phrase variants", () => {
    const presets = loadEquationVisualizerPresets();
    const unsafePresets = {
      ...presets,
      presets: [
        {
          ...presets.presets[0],
          caption: "This output is validated.",
        },
        ...presets.presets.slice(1),
      ],
    };
    expect(validateNhm2EquationVisualizerPresetFile(unsafePresets).some((issue) => /forbidden/i.test(issue))).toBe(true);

    const manifest = loadEquationVisualizerManifest();
    const unsafeManifest = {
      ...manifest,
      outputs: [
        {
          ...manifest.outputs[0],
          caption: "This output is proven.",
        },
        ...manifest.outputs.slice(1),
      ],
    };
    expect(validateNhm2EquationVisualizerManifest(unsafeManifest).some((issue) => /forbidden/i.test(issue))).toBe(true);
  });
});
