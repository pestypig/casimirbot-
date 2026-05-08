export const NHM2_EQUATION_VISUALIZER_PRESETS_ARTIFACT_ID = "nhm2_equation_visualizer_presets" as const;
export const NHM2_EQUATION_VISUALIZER_OUTPUTS_ARTIFACT_ID = "nhm2_equation_visualizer_outputs" as const;
export const NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION = "v1" as const;

export type Nhm2ComputableOperatorKind =
  | "scalar_expression"
  | "field_sample"
  | "tensor_component"
  | "region_aggregate"
  | "worldline_integral"
  | "residual"
  | "gate_status"
  | "noncomputable_reference";

export type Nhm2GraphMode =
  | "scalar_eval"
  | "one_dimensional_sweep"
  | "two_dimensional_heatmap"
  | "centerline_profile"
  | "region_bar_chart"
  | "tensor_matrix"
  | "worldline_sampling_plot"
  | "parametric_curve"
  | "gate_status_table";

export type Nhm2EquationVariableSource =
  | "repo_artifact"
  | "manual_input"
  | "sweep_axis"
  | "constant"
  | "derived"
  | "unavailable";

export type Nhm2ObservableUnits =
  | "geometric_units"
  | "repo_normalized"
  | "dimensionless_diagnostic"
  | "layout_units"
  | "unknown";

export interface Nhm2EquationVariable {
  name: string;
  symbol: string;
  meaning: string;
  source: Nhm2EquationVariableSource;
  units: Nhm2ObservableUnits;
  defaultValue?: number;
  defaultRange?: {
    min: number;
    max: number;
    steps: number;
    scale: "linear" | "log";
  };
  artifactBinding?: {
    artifactPath: string;
    fieldName?: string;
    component?: string;
    sha256Required: true;
  };
  required: boolean;
}

export interface Nhm2EquationOutput {
  name: string;
  symbol: string;
  meaning: string;
  units: Nhm2ObservableUnits;
}

export interface Nhm2AxisTemplate {
  id: string;
  graphMode: Nhm2GraphMode;
  x?: {
    variable: string;
    label: string;
    units: string;
  };
  y?: {
    output: string;
    label: string;
    units: string;
  };
  color?: {
    output: string;
    label: string;
    units: string;
    scale: "sequential" | "diverging_zero_centered" | "categorical";
  };
  regionBands?: boolean;
  tensorRows?: string;
  tensorCols?: string;
  captionTemplate: string;
  uncertaintyTemplate: string;
}

export interface Nhm2ComputableForm {
  id: string;
  nodeId: string;
  operatorKind: Nhm2ComputableOperatorKind;
  expressionSyntax?: "mathjs";
  expression?: string;
  displayLatex: string;
  inputs: Nhm2EquationVariable[];
  outputs: Nhm2EquationOutput[];
  allowedGraphModes: Nhm2GraphMode[];
  defaultAxisTemplates: Nhm2AxisTemplate[];
  domainPolicy: {
    finiteOnly: true;
    maxSamples: number;
    allowComplex: boolean;
    allowUnits: boolean;
    allowUnknownUnits: boolean;
  };
  claimBoundary: {
    doesValidateNHM2: false;
    diagnosticOnly: true;
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
  };
}

export interface Nhm2EquationVisualizerPresetFile {
  artifactId: typeof NHM2_EQUATION_VISUALIZER_PRESETS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION;
  generatedAt: string;
  equationMap: {
    path: string;
    sha256: string;
  };
  presets: Nhm2EquationVisualizerPreset[];
}

export interface Nhm2EquationVisualizerPreset {
  id: string;
  equationNodeId: string;
  computableFormId: string;
  graphMode: Nhm2GraphMode;
  axisTemplateId: string;
  title: string;
  purpose: string;
  variables: Nhm2EquationVariable[];
  literatureRefs: string[];
  caption: string;
  uncertaintyNote: string;
  claimBoundary: Nhm2EquationVisualizerClaimBoundary;
}

export interface Nhm2EquationVisualizerClaimBoundary {
  diagnosticOnly: true;
  doesValidateNHM2: false;
  validationClaimAllowed: false;
  physicalMechanismClaimAllowed: false;
  promotionAllowed: false;
}

export interface Nhm2EquationVisualizerManifest {
  artifactId: typeof NHM2_EQUATION_VISUALIZER_OUTPUTS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  equationMap: {
    path: string;
    sha256: string;
  };
  outputs: Array<{
    id: string;
    equationNodeId: string;
    computableFormId: string;
    graphMode: Nhm2GraphMode;
    outputPng: string;
    outputSvg?: string;
    sourceDataJson: string;
    vegaSpecJson?: string;
    visualizerPresetJson: string;
    variables: Array<{
      name: string;
      source: string;
      units: string;
      range?: unknown;
      artifactHash?: string;
    }>;
    caption: string;
    uncertaintyNote: string;
    literatureRefs: string[];
    claimBoundary: Nhm2EquationVisualizerClaimBoundary;
  }>;
}

export const NHM2_OPERATOR_KINDS: readonly Nhm2ComputableOperatorKind[] = [
  "scalar_expression",
  "field_sample",
  "tensor_component",
  "region_aggregate",
  "worldline_integral",
  "residual",
  "gate_status",
  "noncomputable_reference",
];

export const NHM2_GRAPH_MODES: readonly Nhm2GraphMode[] = [
  "scalar_eval",
  "one_dimensional_sweep",
  "two_dimensional_heatmap",
  "centerline_profile",
  "region_bar_chart",
  "tensor_matrix",
  "worldline_sampling_plot",
  "parametric_curve",
  "gate_status_table",
];

export const NHM2_VISUALIZER_FORBIDDEN_PATTERNS: RegExp[] = [
  /\bvalidated\b/i,
  /\bproven\b/i,
  /\bworking\s+propulsion\b/i,
  /\bworking\s+warp\s+drive\b/i,
  /\bmechanism\s+confirmed\b/i,
  /\bphysical\s+mechanism\s+confirmed\b/i,
  /\bCasimir\s+propulsion\b/i,
  /\bQEI\s+passed\b/i,
  /\benergy\s+conditions\s+cleared\b/i,
  /\bsource\s+closure\s+solved\b/i,
];

export function validateNhm2ComputableForm(form: Partial<Nhm2ComputableForm> | null | undefined): string[] {
  const issues: string[] = [];
  if (!form || typeof form !== "object") return ["computable form is not an object"];
  if (!form.id) issues.push("computable form id is required");
  if (!form.nodeId) issues.push(`computable form ${form.id} missing nodeId`);
  if (!NHM2_OPERATOR_KINDS.includes(form.operatorKind as Nhm2ComputableOperatorKind)) issues.push(`computable form ${form.id} has invalid operatorKind`);
  if (!form.displayLatex) issues.push(`computable form ${form.id} missing displayLatex`);
  if (form.expression && form.expressionSyntax !== "mathjs") issues.push(`computable form ${form.id} expressionSyntax must be mathjs`);
  if (!Array.isArray(form.inputs)) issues.push(`computable form ${form.id} inputs must be an array`);
  if (!Array.isArray(form.outputs) || form.outputs.length === 0) issues.push(`computable form ${form.id} outputs are required`);
  if (!Array.isArray(form.allowedGraphModes) || form.allowedGraphModes.length === 0) issues.push(`computable form ${form.id} allowedGraphModes are required`);
  for (const mode of form.allowedGraphModes ?? []) {
    if (!NHM2_GRAPH_MODES.includes(mode)) issues.push(`computable form ${form.id} has invalid graph mode ${mode}`);
  }
  if (!Array.isArray(form.defaultAxisTemplates) || form.defaultAxisTemplates.length === 0) issues.push(`computable form ${form.id} defaultAxisTemplates are required`);
  if (form.domainPolicy?.finiteOnly !== true) issues.push(`computable form ${form.id} must require finiteOnly`);
  if (!Number.isFinite(form.domainPolicy?.maxSamples) || Number(form.domainPolicy?.maxSamples) < 1) issues.push(`computable form ${form.id} maxSamples must be finite`);
  if (form.claimBoundary?.diagnosticOnly !== true) issues.push(`computable form ${form.id} must be diagnosticOnly`);
  if (form.claimBoundary?.doesValidateNHM2 !== false) issues.push(`computable form ${form.id} doesValidateNHM2 must be false`);
  if (form.claimBoundary?.validationClaimAllowed !== false) issues.push(`computable form ${form.id} validationClaimAllowed must be false`);
  if (form.claimBoundary?.physicalMechanismClaimAllowed !== false) issues.push(`computable form ${form.id} physicalMechanismClaimAllowed must be false`);
  if (form.claimBoundary?.promotionAllowed !== false) issues.push(`computable form ${form.id} promotionAllowed must be false`);
  return issues;
}

export function validateNhm2EquationVisualizerPresetFile(value: unknown): string[] {
  const issues: string[] = [];
  const file = value as Partial<Nhm2EquationVisualizerPresetFile> | null;
  if (!file || typeof file !== "object") return ["preset file is not an object"];
  if (file.artifactId !== NHM2_EQUATION_VISUALIZER_PRESETS_ARTIFACT_ID) issues.push("preset artifactId is invalid");
  if (file.schemaVersion !== NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION) issues.push("preset schemaVersion must be v1");
  if (!file.equationMap?.path || !/^[a-f0-9]{64}$/i.test(file.equationMap?.sha256 ?? "")) issues.push("preset equationMap path/hash required");
  if (!Array.isArray(file.presets) || file.presets.length === 0) {
    issues.push("presets are required");
  } else {
    const ids = new Set<string>();
    for (const preset of file.presets) {
      if (!preset.id) issues.push("preset id is required");
      if (ids.has(preset.id)) issues.push(`duplicate preset id: ${preset.id}`);
      ids.add(preset.id);
      if (!preset.equationNodeId) issues.push(`preset ${preset.id} missing equationNodeId`);
      if (!preset.computableFormId) issues.push(`preset ${preset.id} missing computableFormId`);
      if (!NHM2_GRAPH_MODES.includes(preset.graphMode)) issues.push(`preset ${preset.id} has invalid graphMode`);
      if (!preset.axisTemplateId) issues.push(`preset ${preset.id} missing axisTemplateId`);
      for (const variable of preset.variables ?? []) {
        if (!variable.name || !variable.source || !variable.units) issues.push(`preset ${preset.id} has incomplete variable`);
        if (variable.source === "manual_input" && (variable.defaultValue === undefined || !variable.defaultRange)) {
          issues.push(`manual variable ${variable.name} in ${preset.id} must include defaultValue and defaultRange`);
        }
        if (variable.source === "sweep_axis" && !variable.defaultRange) {
          issues.push(`sweep variable ${variable.name} in ${preset.id} must include defaultRange`);
        }
        if (variable.source === "repo_artifact" && (!variable.artifactBinding?.artifactPath || variable.artifactBinding.sha256Required !== true)) {
          issues.push(`repo variable ${variable.name} in ${preset.id} must include artifact binding and hash requirement`);
        }
      }
      issues.push(...validateVisualizerClaimBoundary(preset.claimBoundary, `preset ${preset.id}`));
    }
  }
  issues.push(...validateNoForbiddenText(JSON.stringify(file), "preset file"));
  return issues;
}

export function validateNhm2EquationVisualizerManifest(value: unknown): string[] {
  const issues: string[] = [];
  const manifest = value as Partial<Nhm2EquationVisualizerManifest> | null;
  if (!manifest || typeof manifest !== "object") return ["manifest is not an object"];
  if (manifest.artifactId !== NHM2_EQUATION_VISUALIZER_OUTPUTS_ARTIFACT_ID) issues.push("manifest artifactId is invalid");
  if (manifest.schemaVersion !== NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION) issues.push("manifest schemaVersion must be v1");
  if (!manifest.runId) issues.push("manifest runId is required");
  if (!manifest.equationMap?.path || !/^[a-f0-9]{64}$/i.test(manifest.equationMap?.sha256 ?? "")) issues.push("manifest equationMap path/hash required");
  if (!Array.isArray(manifest.outputs) || manifest.outputs.length === 0) {
    issues.push("manifest outputs are required");
  } else {
    for (const output of manifest.outputs) {
      if (!output.id || !output.equationNodeId || !output.computableFormId) issues.push("output id/node/form fields are required");
      if (!NHM2_GRAPH_MODES.includes(output.graphMode)) issues.push(`output ${output.id} has invalid graphMode`);
      if (!output.outputPng || !output.sourceDataJson) issues.push(`output ${output.id} missing output/source-data paths`);
      if (!output.caption) issues.push(`output ${output.id} missing caption`);
      if (!output.uncertaintyNote) issues.push(`output ${output.id} missing uncertaintyNote`);
      issues.push(...validateVisualizerClaimBoundary(output.claimBoundary, `output ${output.id}`));
    }
  }
  issues.push(...validateNoForbiddenText(JSON.stringify(manifest), "manifest"));
  return issues;
}

function validateVisualizerClaimBoundary(boundary: Partial<Nhm2EquationVisualizerClaimBoundary> | undefined, label: string): string[] {
  const issues: string[] = [];
  if (boundary?.diagnosticOnly !== true) issues.push(`${label} diagnosticOnly must be true`);
  if (boundary?.doesValidateNHM2 !== false) issues.push(`${label} doesValidateNHM2 must be false`);
  if (boundary?.validationClaimAllowed !== false) issues.push(`${label} validationClaimAllowed must be false`);
  if (boundary?.physicalMechanismClaimAllowed !== false) issues.push(`${label} physicalMechanismClaimAllowed must be false`);
  if (boundary?.promotionAllowed !== false) issues.push(`${label} promotionAllowed must be false`);
  return issues;
}

export function validateNoForbiddenText(text: string, label: string): string[] {
  const issues: string[] = [];
  for (const pattern of NHM2_VISUALIZER_FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) issues.push(`${label} contains forbidden phrase: ${pattern}`);
  }
  if (/[A-Z]:[\\/]/.test(text)) issues.push(`${label} contains absolute local Windows path`);
  return issues;
}
