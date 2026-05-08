import type {
  Nhm2ComputableForm,
  Nhm2EquationVisualizerPreset,
  Nhm2GraphMode,
} from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import type { Nhm2EquationNode, Nhm2ObservableEquationMap } from "../../shared/contracts/nhm2-observable-equation-map.v1.js";

export interface ResolvedEquationNode {
  map: Nhm2ObservableEquationMap;
  node: Nhm2EquationNode;
  form: Nhm2ComputableForm;
  preset: Nhm2EquationVisualizerPreset;
}

export interface EquationSampleRow {
  [key: string]: string | number | boolean | null | undefined;
  invalid?: boolean;
  invalidReason?: string;
}

export interface EquationSampleResult {
  id: string;
  graphMode: Nhm2GraphMode;
  rows: EquationSampleRow[];
  variables: Array<{
    name: string;
    source: string;
    units: string;
    range?: unknown;
    artifactHash?: string;
  }>;
  notes: string[];
}

export interface EquationVisualizerRenderResult {
  id: string;
  equationNodeId: string;
  computableFormId: string;
  graphMode: Nhm2GraphMode;
  outputPng: string;
  outputSvg?: string;
  sourceDataJson: string;
  vegaSpecJson?: string;
  visualizerPresetJson: string;
  variables: EquationSampleResult["variables"];
  caption: string;
  uncertaintyNote: string;
  literatureRefs: string[];
}
