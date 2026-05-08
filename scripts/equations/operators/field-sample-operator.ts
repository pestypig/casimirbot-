import type { Nhm2ComputableForm, Nhm2EquationVisualizerPreset } from "../../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { loadBrickFieldBundle, sampleCenterline } from "../../figures/nhm2/extract-brick-fields.js";
import { variableTrace } from "../equation-variable-scope.js";
import type { EquationSampleResult } from "../equation-visualizer-types.js";

const DEFAULT_BRICK = "artifacts/research/full-solve/triage-brick-48.raw";
const DEFAULT_WRAPPED_BRICK = "artifacts/research/full-solve/user-york-brick-latest.json";

export function runFieldSampleOperator(
  preset: Nhm2EquationVisualizerPreset,
  form: Nhm2ComputableForm,
): EquationSampleResult {
  const bundle = loadBrickFieldBundle(DEFAULT_BRICK, DEFAULT_WRAPPED_BRICK);
  const samples = Math.min(96, form.domainPolicy.maxSamples);
  const rows = preset.equationNodeId === "beta_shift"
    ? betaRows(bundle, samples)
    : alphaRows(bundle, samples);
  return {
    id: preset.id,
    graphMode: preset.graphMode,
    rows,
    variables: variableTrace(preset.variables),
    notes: ["Centerline samples are read from the NHM2 metric brick and are repo-normalized diagnostics."],
  };
}

function alphaRows(bundle: any, samples: number) {
  return sampleCenterline(bundle, "alpha", samples).map((row) => ({
    s: row.s,
    value: row.value,
    channel: "alpha",
    region: regionForSample(row.s, samples),
    invalid: !Number.isFinite(row.value),
    invalidReason: Number.isFinite(row.value) ? undefined : "non_finite_alpha",
  }));
}

function betaRows(bundle: any, samples: number) {
  const bx = sampleCenterline(bundle, "beta_x", samples);
  const by = sampleCenterline(bundle, "beta_y", samples);
  const bz = sampleCenterline(bundle, "beta_z", samples);
  return bx.flatMap((row, i) => {
    const magnitude = Math.hypot(row.value, by[i]?.value ?? 0, bz[i]?.value ?? 0);
    return [
      { s: row.s, value: row.value, channel: "beta_x", region: regionForSample(row.s, samples), invalid: !Number.isFinite(row.value), invalidReason: Number.isFinite(row.value) ? undefined : "non_finite_beta_x" },
      { s: row.s, value: magnitude, channel: "beta_magnitude", region: regionForSample(row.s, samples), invalid: !Number.isFinite(magnitude), invalidReason: Number.isFinite(magnitude) ? undefined : "non_finite_beta_magnitude" },
    ];
  });
}

function regionForSample(s: number, samples: number): "exterior_shell" | "wall" | "hull" {
  return s < samples * 0.18 || s > samples * 0.82
    ? "exterior_shell"
    : s < samples * 0.28 || s > samples * 0.72
      ? "wall"
      : "hull";
}
