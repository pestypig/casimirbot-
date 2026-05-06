export const NHM2_OBSERVABLE_EQUATION_MAP_ARTIFACT_ID = "nhm2_observable_equation_map" as const;
export const NHM2_OBSERVABLE_EQUATION_MAP_SCHEMA_VERSION = "v1" as const;

export type Nhm2EquationFamily =
  | "geometry_3p1"
  | "metric_required_source"
  | "observer_projection"
  | "source_model"
  | "tile_effective_counterpart"
  | "closure_residual"
  | "energy_condition"
  | "qei_gate"
  | "convergence_reproducibility"
  | "claim_boundary";

export type Nhm2FigureType =
  | "equation_flow_dag"
  | "field_slice"
  | "centerline_curve"
  | "proper_time_curve"
  | "tensor_matrix"
  | "component_profile"
  | "residual_chart"
  | "observer_family_surface"
  | "qei_sampling_plot"
  | "sector_schedule"
  | "tile_layout"
  | "convergence_plot"
  | "validation_dag"
  | "claim_boundary_strip";

export type Nhm2EquationStatus =
  | "computed"
  | "diagnostic"
  | "reduced_order_only"
  | "missing_counterpart"
  | "review"
  | "blocked";

export type Nhm2EquationEdgeRelation =
  | "defines"
  | "projects_to"
  | "requires"
  | "compares_against"
  | "averages_to"
  | "bounds"
  | "blocks"
  | "constrains"
  | "documents";

export type Nhm2ObservableUnits =
  | "geometric_units"
  | "repo_normalized"
  | "dimensionless_diagnostic"
  | "layout_units"
  | "unknown";

export interface Nhm2ObservableEquationMap {
  artifactId: typeof NHM2_OBSERVABLE_EQUATION_MAP_ARTIFACT_ID;
  schemaVersion: typeof NHM2_OBSERVABLE_EQUATION_MAP_SCHEMA_VERSION;
  generatedAt: string;
  sourceWhitepaperRefs: Array<{
    path: string;
    sha256: string;
    role:
      | "status_whitepaper"
      | "full_solve_overview"
      | "source_to_york_bridge"
      | "tile_effective_claim_safety"
      | "reference_ledger";
  }>;
  claimBoundary: {
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
    literatureDoesValidateNHM2: false;
  };
  nodes: Nhm2EquationNode[];
  edges: Nhm2EquationEdge[];
}

export interface Nhm2EquationNode {
  id: string;
  family: Nhm2EquationFamily;
  symbol: string;
  displayEquation?: string;
  equationLatex?: string;
  plainMeaning: string;
  whyItMatters: string;
  repoBindings: Array<{
    artifactPath?: string;
    fieldName?: string;
    channel?: string;
    component?: string;
    units: Nhm2ObservableUnits;
    hashRequired: boolean;
  }>;
  figurePlan: Array<{
    figureId: string;
    figureType: Nhm2FigureType;
    purpose: string;
    requiredAxesOrEncodings: string[];
    allowedRenderer:
      | "scientific_3p1_renderer"
      | "vega_lite"
      | "graphviz_wasm"
      | "svg_table"
      | "katex_equation_panel";
  }>;
  status: Nhm2EquationStatus;
  blockerRefs: Array<{
    blockerId: string;
    sourceArtifact: string;
    status: "pass" | "review" | "missing" | "fail" | "not_run";
  }>;
  literatureRefs: string[];
  claimBoundary: {
    doesValidateNHM2: false;
    maySupportContextOnly: true;
    promotionAllowed: false;
  };
  forbiddenClaims: string[];
}

export interface Nhm2EquationEdge {
  from: string;
  to: string;
  relation: Nhm2EquationEdgeRelation;
  plainMeaning: string;
  claimBoundaryNote: string;
}

export const NHM2_EQUATION_FAMILIES: readonly Nhm2EquationFamily[] = [
  "geometry_3p1",
  "metric_required_source",
  "observer_projection",
  "source_model",
  "tile_effective_counterpart",
  "closure_residual",
  "energy_condition",
  "qei_gate",
  "convergence_reproducibility",
  "claim_boundary",
];

export const NHM2_FIGURE_TYPES: readonly Nhm2FigureType[] = [
  "equation_flow_dag",
  "field_slice",
  "centerline_curve",
  "proper_time_curve",
  "tensor_matrix",
  "component_profile",
  "residual_chart",
  "observer_family_surface",
  "qei_sampling_plot",
  "sector_schedule",
  "tile_layout",
  "convergence_plot",
  "validation_dag",
  "claim_boundary_strip",
];

export const NHM2_EQUATION_STATUSES: readonly Nhm2EquationStatus[] = [
  "computed",
  "diagnostic",
  "reduced_order_only",
  "missing_counterpart",
  "review",
  "blocked",
];

export const NHM2_EQUATION_EDGE_RELATIONS: readonly Nhm2EquationEdgeRelation[] = [
  "defines",
  "projects_to",
  "requires",
  "compares_against",
  "averages_to",
  "bounds",
  "blocks",
  "constrains",
  "documents",
];

export const NHM2_OBSERVABLE_UNITS: readonly Nhm2ObservableUnits[] = [
  "geometric_units",
  "repo_normalized",
  "dimensionless_diagnostic",
  "layout_units",
  "unknown",
];

export const NHM2_OBSERVABLE_PHYSICS_TERMS = [
  "warp",
  "drive",
  "negative energy",
  "exotic matter",
  "NEC",
  "WEC",
  "QEI",
  "quantum",
  "Casimir",
  "stress-energy",
  "stress energy",
];

export const NHM2_OBSERVABLE_FORBIDDEN_PATTERNS: RegExp[] = [
  /\bvalidated\s+propulsion\b/i,
  /\bworking\s+warp\s+drive\b/i,
  /\bphysical\s+mechanism\s+confirmed\b/i,
  /\bCasimir\s+propulsion\s+proven\b/i,
  /\bQEI\s+passed\b/i,
  /\benergy\s+conditions\s+cleared\b/i,
  /\bexternal\s+paper\s+validates\s+NHM2\b/i,
  /\bdetector\s+observation\b/i,
  /\bmeasured\s+propulsion\b/i,
  /\bsource\s+closure\s+solved\b/i,
];

export function validateNhm2ObservableEquationMap(value: unknown): string[] {
  const issues: string[] = [];
  const map = value as Partial<Nhm2ObservableEquationMap> | null;
  if (!map || typeof map !== "object") return ["map is not an object"];
  if (map.artifactId !== NHM2_OBSERVABLE_EQUATION_MAP_ARTIFACT_ID) issues.push("artifactId must be nhm2_observable_equation_map");
  if (map.schemaVersion !== NHM2_OBSERVABLE_EQUATION_MAP_SCHEMA_VERSION) issues.push("schemaVersion must be v1");
  if (!map.generatedAt) issues.push("generatedAt is required");
  if (map.claimBoundary?.validationClaimAllowed !== false) issues.push("validationClaimAllowed must remain false");
  if (map.claimBoundary?.physicalMechanismClaimAllowed !== false) issues.push("physicalMechanismClaimAllowed must remain false");
  if (map.claimBoundary?.promotionAllowed !== false) issues.push("promotionAllowed must remain false");
  if (map.claimBoundary?.literatureDoesValidateNHM2 !== false) issues.push("literatureDoesValidateNHM2 must remain false");

  if (!Array.isArray(map.sourceWhitepaperRefs) || map.sourceWhitepaperRefs.length === 0) {
    issues.push("sourceWhitepaperRefs are required");
  } else {
    for (const ref of map.sourceWhitepaperRefs) {
      if (!ref.path || !ref.role) issues.push("sourceWhitepaperRef must include path and role");
      if (!/^[a-f0-9]{64}$/i.test(ref.sha256 ?? "")) issues.push(`sourceWhitepaperRef has invalid sha256: ${ref.path}`);
    }
  }

  const nodeIds = new Set<string>();
  const figureIds = new Set<string>();
  if (!Array.isArray(map.nodes) || map.nodes.length === 0) {
    issues.push("nodes are required");
  } else {
    for (const node of map.nodes) {
      if (!node.id) issues.push("node id is required");
      if (nodeIds.has(node.id)) issues.push(`duplicate node id: ${node.id}`);
      nodeIds.add(node.id);
      if (!NHM2_EQUATION_FAMILIES.includes(node.family)) issues.push(`node ${node.id} has invalid family`);
      if (!NHM2_EQUATION_STATUSES.includes(node.status)) issues.push(`node ${node.id} has invalid status`);
      if (!node.symbol) issues.push(`node ${node.id} is missing symbol`);
      if (!node.plainMeaning) issues.push(`node ${node.id} is missing plainMeaning`);
      if (!node.whyItMatters) issues.push(`node ${node.id} is missing whyItMatters`);
      if (!Array.isArray(node.repoBindings) || node.repoBindings.length === 0) issues.push(`node ${node.id} is missing repoBindings`);
      for (const binding of node.repoBindings ?? []) {
        if (!binding.artifactPath && !binding.fieldName && !binding.channel && !binding.component) issues.push(`node ${node.id} has empty repo binding`);
        if (!NHM2_OBSERVABLE_UNITS.includes(binding.units)) issues.push(`node ${node.id} has invalid units`);
      }
      if (!Array.isArray(node.figurePlan) || node.figurePlan.length === 0) issues.push(`node ${node.id} is missing figurePlan`);
      for (const figure of node.figurePlan ?? []) {
        if (!figure.figureId || !figure.figureType || !figure.purpose) issues.push(`node ${node.id} has incomplete figure plan`);
        if (!NHM2_FIGURE_TYPES.includes(figure.figureType)) issues.push(`node ${node.id} has invalid figure type`);
        if (figureIds.has(figure.figureId)) issues.push(`duplicate figure id: ${figure.figureId}`);
        figureIds.add(figure.figureId);
        if (!Array.isArray(figure.requiredAxesOrEncodings) || figure.requiredAxesOrEncodings.length === 0) {
          issues.push(`figure ${figure.figureId} is missing required axes or encodings`);
        }
      }
      if (!Array.isArray(node.literatureRefs)) issues.push(`node ${node.id} literatureRefs must be an array`);
      if (!Array.isArray(node.forbiddenClaims) || node.forbiddenClaims.length === 0) issues.push(`node ${node.id} must include forbiddenClaims`);
      if (node.claimBoundary?.doesValidateNHM2 !== false) issues.push(`node ${node.id} doesValidateNHM2 must remain false`);
      if (node.claimBoundary?.maySupportContextOnly !== true) issues.push(`node ${node.id} maySupportContextOnly must be true`);
      if (node.claimBoundary?.promotionAllowed !== false) issues.push(`node ${node.id} promotionAllowed must remain false`);
    }
  }

  if (!Array.isArray(map.edges)) {
    issues.push("edges must be an array");
  } else {
    for (const edge of map.edges) {
      if (!nodeIds.has(edge.from)) issues.push(`edge references missing from node: ${edge.from}`);
      if (!nodeIds.has(edge.to)) issues.push(`edge references missing to node: ${edge.to}`);
      if (!NHM2_EQUATION_EDGE_RELATIONS.includes(edge.relation)) issues.push(`edge ${edge.from}->${edge.to} has invalid relation`);
      if (!edge.plainMeaning || !edge.claimBoundaryNote) issues.push(`edge ${edge.from}->${edge.to} must include meaning and claim boundary note`);
    }
  }

  const text = JSON.stringify(map);
  if (/[A-Z]:[\\/]/.test(text)) issues.push("map contains absolute local Windows path");
  for (const pattern of NHM2_OBSERVABLE_FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) issues.push(`forbidden promotion language found: ${pattern}`);
  }
  return issues;
}

export function observableTextNeedsLiterature(text: string): boolean {
  return NHM2_OBSERVABLE_PHYSICS_TERMS.some((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(text));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
