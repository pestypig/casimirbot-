import { FIGURE_BACKGROUND } from "../figures/figure-colors.js";
import type { Nhm2EquationVisualizerPreset } from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import type { EquationSampleResult } from "./equation-visualizer-types.js";

export function buildEquationPlotSpec(preset: Nhm2EquationVisualizerPreset, sample: EquationSampleResult): any {
  switch (sample.graphMode) {
    case "centerline_profile":
      return centerlineSpec(preset, sample);
    case "tensor_matrix":
      return tensorMatrixSpec(preset, sample);
    case "one_dimensional_sweep":
      return lineSpec(preset, sample, "a", "value");
    case "worldline_sampling_plot":
      return lineSpec(preset, sample, "tau", "value");
    default:
      return tableLikeSpec(preset, sample);
  }
}

function centerlineSpec(preset: Nhm2EquationVisualizerPreset, sample: EquationSampleResult): any {
  return {
    width: 680,
    height: 330,
    background: FIGURE_BACKGROUND,
    title: { text: preset.title, color: "#dbeaf1" },
    data: { values: sample.rows },
    mark: { type: "line", strokeWidth: 2 },
    encoding: {
      x: { field: "s", type: "quantitative", title: "centerline sample", axis: axisStyle() },
      y: { field: "value", type: "quantitative", title: "repo-normalized", axis: axisStyle() },
      color: { field: "channel", type: "nominal", legend: legendStyle() },
      strokeDash: { field: "region", type: "nominal", legend: legendStyle() },
    },
    config: baseConfig(),
  };
}

function tensorMatrixSpec(preset: Nhm2EquationVisualizerPreset, sample: EquationSampleResult): any {
  return {
    width: 420,
    height: 420,
    background: FIGURE_BACKGROUND,
    title: { text: preset.title, color: "#dbeaf1" },
    data: { values: sample.rows },
    mark: { type: "rect" },
    encoding: {
      x: { field: "b", type: "ordinal", title: "b index", axis: axisStyle() },
      y: { field: "a", type: "ordinal", title: "a index", axis: axisStyle() },
      color: {
        field: "value",
        type: "quantitative",
        scale: { scheme: "redblue", domainMid: 0 },
        legend: legendStyle("Delta T_ab"),
      },
      opacity: {
        condition: { test: "datum.status === 'available'", value: 1 },
        value: 0.22,
      },
      tooltip: [
        { field: "component", type: "nominal" },
        { field: "status", type: "nominal" },
        { field: "value", type: "quantitative", format: ".3e" },
        { field: "invalidReason", type: "nominal" },
      ],
    },
    config: baseConfig(),
  };
}

function lineSpec(preset: Nhm2EquationVisualizerPreset, sample: EquationSampleResult, xField: string, yField: string): any {
  return {
    width: 680,
    height: 330,
    background: FIGURE_BACKGROUND,
    title: { text: preset.title, color: "#dbeaf1" },
    data: { values: sample.rows },
    mark: { type: "line", strokeWidth: 2 },
    encoding: {
      x: { field: xField, type: "quantitative", axis: axisStyle() },
      y: { field: yField, type: "quantitative", axis: axisStyle() },
      color: { field: "channel", type: "nominal", legend: legendStyle() },
      tooltip: [
        { field: xField, type: "quantitative", format: ".3e" },
        { field: yField, type: "quantitative", format: ".3e" },
        { field: "invalidReason", type: "nominal" },
      ],
    },
    config: baseConfig(),
  };
}

function tableLikeSpec(preset: Nhm2EquationVisualizerPreset, sample: EquationSampleResult): any {
  return {
    width: 560,
    height: 260,
    background: FIGURE_BACKGROUND,
    title: { text: preset.title, color: "#dbeaf1" },
    data: { values: sample.rows },
    mark: { type: "bar" },
    encoding: {
      x: { field: "gate", type: "nominal", axis: axisStyle() },
      y: { field: "value", type: "nominal", axis: axisStyle() },
      color: { field: "status", type: "nominal", legend: legendStyle() },
    },
    config: baseConfig(),
  };
}

function axisStyle(): any {
  return { labelColor: "#dbeaf1", titleColor: "#dbeaf1", gridColor: "#263342", domainColor: "#6b7f8e", tickColor: "#6b7f8e" };
}

function legendStyle(title?: string): any {
  return { title, labelColor: "#dbeaf1", titleColor: "#dbeaf1" };
}

function baseConfig(): any {
  return {
    font: "Consolas",
    view: { stroke: "#1c2b38" },
    axis: axisStyle(),
    legend: legendStyle(),
  };
}
