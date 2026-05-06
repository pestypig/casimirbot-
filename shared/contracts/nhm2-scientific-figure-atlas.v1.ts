export const NHM2_SCIENTIFIC_FIGURE_ATLAS_ARTIFACT_ID = "nhm2_scientific_figure_atlas" as const;
export const NHM2_SCIENTIFIC_FIGURE_ATLAS_SCHEMA_VERSION = "v1" as const;

export type Nhm2ScientificFigureKind =
  | "spatial_geometry"
  | "field_slice"
  | "mechanism_schematic"
  | "schedule_timeline"
  | "tensor_matrix"
  | "residual_chart"
  | "observer_worldline_plot"
  | "energy_condition_chart"
  | "validation_dag"
  | "provenance_map"
  | "claim_boundary_strip"
  | "literature_context_map";

export type Nhm2FigureSemanticDomain =
  | "geometry"
  | "mechanism"
  | "math_closure"
  | "evidence_ledger";

export type Nhm2FigureRenderer =
  | "scientific_3p1_renderer"
  | "vega_lite"
  | "graphviz_wasm"
  | "svg_table";

export type Nhm2FigureDataRole =
  | "metric_brick"
  | "hull_sdf"
  | "field_channel"
  | "cavity_contract"
  | "source_closure"
  | "blocker_ledger"
  | "validation_summary"
  | "literature_boundary";

export interface Nhm2ScientificFigureRecord {
  id: string;
  title: string;
  family: Nhm2FigureSemanticDomain;
  kind: Nhm2ScientificFigureKind;
  outputSvg?: string;
  outputPng: string;
  sourceDataJson: string;
  fieldStatsJson?: string;
  dataSources: Array<{
    path: string;
    sha256: string;
    role: Nhm2FigureDataRole;
  }>;
  visualEncoding: {
    renderer: Nhm2FigureRenderer;
    x?: string;
    y?: string;
    color?: string;
    shape?: string;
    line?: string;
    region?: string;
    matrixRows?: string;
    matrixCols?: string;
  };
  hullOverlayPolicy: {
    usesHullGeometry: boolean;
    permitsLedgerOverlayOnHull: false;
    reason: string;
  };
  caption: string;
  literatureRefs: string[];
  claimBoundary: {
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
    doesValidateNHM2: false;
  };
}

export interface Nhm2ScientificFigureAtlasManifest {
  artifactId: typeof NHM2_SCIENTIFIC_FIGURE_ATLAS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_SCIENTIFIC_FIGURE_ATLAS_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  inputHashes: Record<string, string>;
  figures: Nhm2ScientificFigureRecord[];
  colorPolicy: {
    scalarMagnitude: "sequential_perceptual";
    signedResidual: "diverging_perceptual";
    categoricalStatus: "limited_status_palette";
    forbidRainbow: true;
  };
  prohibitedClaims: string[];
  claimBoundary: {
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
  };
}

export const NHM2_SCIENTIFIC_ATLAS_PROHIBITED_PATTERNS: RegExp[] = [
  /\bvalidated\s+propulsion\b/i,
  /\bworking\s+warp\s+drive\b/i,
  /\bphysical\s+mechanism\s+confirmed\b/i,
  /\bCasimir\s+propulsion\s+proven\b/i,
  /\bQEI\s+passed\b/i,
  /\bcertificate\s+validates\s+NHM2\s+propulsion\b/i,
  /\bproves?\s+NHM2\b/i,
  /\bvalidates?\s+NHM2\b/i,
  /\bdemonstrates?\s+physical\s+mechanism\b/i,
  /\bconfirms?\s+propulsion\b/i,
  /\bdetector\s+observation\b/i,
];

export const NHM2_SCIENTIFIC_ATLAS_PHYSICS_TERMS = [
  "QEI",
  "quantum inequality",
  "Casimir",
  "NEC",
  "WEC",
  "warp metric",
  "negative energy",
  "exotic matter",
];

export function captionNeedsScientificLiterature(text: string): boolean {
  return NHM2_SCIENTIFIC_ATLAS_PHYSICS_TERMS.some((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i").test(text));
}

export function validateNhm2ScientificFigureAtlasManifest(value: unknown): string[] {
  const issues: string[] = [];
  const manifest = value as Partial<Nhm2ScientificFigureAtlasManifest> | null;
  if (!manifest || typeof manifest !== "object") return ["Manifest is not an object"];
  if (manifest.artifactId !== NHM2_SCIENTIFIC_FIGURE_ATLAS_ARTIFACT_ID) issues.push("artifactId must be nhm2_scientific_figure_atlas");
  if (manifest.schemaVersion !== NHM2_SCIENTIFIC_FIGURE_ATLAS_SCHEMA_VERSION) issues.push("schemaVersion must be v1");
  if (!manifest.claimBoundary || manifest.claimBoundary.validationClaimAllowed !== false) issues.push("validationClaimAllowed must remain false");
  if (!manifest.claimBoundary || manifest.claimBoundary.physicalMechanismClaimAllowed !== false) issues.push("physicalMechanismClaimAllowed must remain false");
  if (!manifest.claimBoundary || manifest.claimBoundary.promotionAllowed !== false) issues.push("promotionAllowed must remain false");
  if (manifest.colorPolicy?.forbidRainbow !== true) issues.push("colorPolicy.forbidRainbow must be true");

  if (!manifest.inputHashes || Object.keys(manifest.inputHashes).length === 0) {
    issues.push("inputHashes are missing");
  } else {
    for (const [key, value] of Object.entries(manifest.inputHashes)) {
      if (typeof value !== "string" || value.length < 16) issues.push(`input hash missing or invalid for ${key}`);
    }
  }

  if (!Array.isArray(manifest.figures)) {
    issues.push("figures must be an array");
  } else {
    for (const figure of manifest.figures) {
      if (!figure.id) issues.push("figure id is missing");
      if (!figure.family) issues.push(`figure ${figure.id} is missing family`);
      if (!figure.kind) issues.push(`figure ${figure.id} is missing kind`);
      if (!figure.outputPng) issues.push(`figure ${figure.id} is missing outputPng`);
      if (!figure.sourceDataJson) issues.push(`figure ${figure.id} is missing sourceDataJson`);
      if (!Array.isArray(figure.dataSources) || figure.dataSources.length === 0) issues.push(`figure ${figure.id} has no dataSources`);
      for (const source of figure.dataSources ?? []) {
        if (!source.path || !source.sha256 || !source.role) issues.push(`figure ${figure.id} has incomplete data source`);
      }
      if (figure.hullOverlayPolicy?.permitsLedgerOverlayOnHull !== false) {
        issues.push(`figure ${figure.id} must forbid ledger overlays on hull`);
      }
      if (figure.family === "evidence_ledger" && figure.hullOverlayPolicy?.usesHullGeometry) {
        issues.push(`evidence figure ${figure.id} must not use hull geometry`);
      }
      if (figure.family === "math_closure" && figure.hullOverlayPolicy?.usesHullGeometry) {
        issues.push(`math closure figure ${figure.id} must not use 3D hull geometry`);
      }
      if (figure.family === "geometry" && /ledger|certificate|provenance|claim[- ]?lock|pass\/fail/i.test(`${figure.caption} ${figure.title}`)) {
        issues.push(`geometry figure ${figure.id} contains ledger/certificate/provenance/claim-lock language`);
      }
      if (figure.family === "mechanism" && /field strength|energy intensity|curvature intensity|spacetime intensity/i.test(figure.caption)) {
        issues.push(`mechanism figure ${figure.id} mislabels mechanism colors as physical intensity`);
      }
      if (/certificate pass/i.test(figure.caption) && !/non-promotional/i.test(figure.caption)) {
        issues.push(`figure ${figure.id} says certificate pass without non-promotional boundary`);
      }
      if (captionNeedsScientificLiterature(figure.caption) && figure.literatureRefs.length === 0) {
        issues.push(`figure ${figure.id} caption needs literature refs`);
      }
      if (figure.claimBoundary.validationClaimAllowed !== false) issues.push(`figure ${figure.id} validationClaimAllowed must remain false`);
      if (figure.claimBoundary.physicalMechanismClaimAllowed !== false) issues.push(`figure ${figure.id} physicalMechanismClaimAllowed must remain false`);
      if (figure.claimBoundary.promotionAllowed !== false) issues.push(`figure ${figure.id} promotionAllowed must remain false`);
      if (figure.claimBoundary.doesValidateNHM2 !== false) issues.push(`figure ${figure.id} doesValidateNHM2 must remain false`);
    }
  }

  const text = JSON.stringify({
    figures: manifest.figures,
    claimBoundary: manifest.claimBoundary,
  });
  for (const pattern of NHM2_SCIENTIFIC_ATLAS_PROHIBITED_PATTERNS) {
    if (pattern.test(text)) issues.push(`Prohibited claim language found: ${pattern}`);
  }
  return issues;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
