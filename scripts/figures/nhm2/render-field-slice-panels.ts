import { DIVERGING_BLUE_ORANGE, FIGURE_BACKGROUND, SEQUENTIAL_TEAL } from "../figure-colors.js";
import type { BrickFieldBundle } from "./extract-brick-fields.js";
import { sampleCenterSlice } from "./extract-brick-fields.js";
import { computeFieldStats, type FieldStats } from "./field-stats.js";

export interface FieldPanelBundle {
  rows: Array<{ x: number; y: number; value: number | null; panel: string; field: string }>;
  stats: FieldStats[];
  spec: any;
}

export function buildLapseShiftPanels(bundle: BrickFieldBundle, sourceHash: string, samples = 36): FieldPanelBundle {
  const alpha = sampleCenterSlice(bundle, "alpha", { samples, signed: true });
  const betaX = sampleCenterSlice(bundle, "beta_x", { samples, signed: true });
  const betaY = sampleCenterSlice(bundle, "beta_y", { samples, signed: true });
  const betaZ = sampleCenterSlice(bundle, "beta_z", { samples, signed: true });
  const rows: FieldPanelBundle["rows"] = [];
  for (let i = 0; i < alpha.length; i += 1) {
    const a = alpha[i];
    const bx = betaX[i]?.value ?? 0;
    const by = betaY[i]?.value ?? 0;
    const bz = betaZ[i]?.value ?? 0;
    rows.push({ x: a.x, y: a.y, value: a.value, panel: "alpha raw", field: "alpha" });
    rows.push({ x: a.x, y: a.y, value: a.value - 1, panel: "alpha - 1", field: "alpha_minus_1" });
    rows.push({ x: a.x, y: a.y, value: bx, panel: "beta_x signed", field: "beta_x" });
    rows.push({ x: a.x, y: a.y, value: Math.hypot(bx, by, bz), panel: "|beta| magnitude", field: "beta_magnitude" });
  }
  const stats = [
    computeFieldStats("alpha", rows.filter((row) => row.field === "alpha"), { sampleShape: [samples, samples], normalization: "repo-normalized", units: "repo-normalized", sourceHash }),
    computeFieldStats("alpha_minus_1", rows.filter((row) => row.field === "alpha_minus_1"), { sampleShape: [samples, samples], normalization: "delta_from_reference", units: "dimensionless diagnostic", sourceHash }),
    computeFieldStats("beta_x", rows.filter((row) => row.field === "beta_x"), { sampleShape: [samples, samples], normalization: "signed_zero_centered", units: "repo-normalized", sourceHash, symmetricDomain: true }),
    computeFieldStats("beta_magnitude", rows.filter((row) => row.field === "beta_magnitude"), { sampleShape: [samples, samples], normalization: "repo-normalized", units: "repo-normalized", sourceHash }),
  ];
  return {
    rows,
    stats,
    spec: fieldPanelSpec(rows, "Lapse / shift diagnostic panels", false),
  };
}

export function buildThetaPanel(bundle: BrickFieldBundle, sourceHash: string, samples = 48): FieldPanelBundle {
  const raw = sampleCenterSlice(bundle, "theta", { samples, signed: true });
  const values = raw.map((row) => Math.abs(row.value)).sort((a, b) => a - b);
  const p95 = values[Math.floor(values.length * 0.95)] ?? 0;
  const epsilon = Math.max(Number.MIN_VALUE, p95 * 0.02);
  const rows = raw.map((row) => ({
    x: row.x,
    y: row.y,
    value: Math.abs(row.value) <= epsilon ? null : row.value,
    panel: "theta signed",
    field: "theta",
  }));
  const stats = [
    computeFieldStats("theta", raw, {
      sampleShape: [samples, samples],
      normalization: "signed_zero_centered",
      units: "dimensionless diagnostic",
      sourceHash,
      nearZeroEpsilon: epsilon,
      symmetricDomain: true,
    }),
  ];
  return {
    rows,
    stats,
    spec: fieldPanelSpec(rows, "Signed theta diagnostic", true, stats[0].colorDomain),
  };
}

function fieldPanelSpec(
  rows: FieldPanelBundle["rows"],
  title: string,
  diverging: boolean,
  domain?: [number, number],
): any {
  const scale: any = { range: diverging ? DIVERGING_BLUE_ORANGE : SEQUENTIAL_TEAL };
  if (domain) scale.domain = domain;
  return {
    width: 230,
    height: 230,
    background: FIGURE_BACKGROUND,
    title: { text: title, color: "#dbeaf1" },
    data: { values: rows },
    mark: { type: "rect" },
    encoding: {
      x: { field: "x", type: "ordinal", title: "x sample", axis: axisStyle() },
      y: { field: "y", type: "ordinal", title: "z sample", axis: axisStyle() },
      color: {
        field: "value",
        type: "quantitative",
        title: diverging ? "signed scalar" : "repo-normalized",
        scale,
        legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1", format: ".2e", tickCount: 5 },
      },
      column: { field: "panel", type: "nominal", header: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" } },
      tooltip: [
        { field: "field", type: "nominal" },
        { field: "value", type: "quantitative", format: ".3e" },
      ],
    },
    resolve: { scale: { color: "independent" } },
    config: {
      font: "Consolas",
      view: { stroke: "#1c2b38" },
      axis: axisStyle(),
      legend: { labelColor: "#dbeaf1", titleColor: "#dbeaf1" },
    },
  };
}

function axisStyle(): any {
  return { labelColor: "#dbeaf1", titleColor: "#dbeaf1", gridColor: "#263342", domainColor: "#6b7f8e", tickColor: "#6b7f8e", labelFontSize: 8 };
}
