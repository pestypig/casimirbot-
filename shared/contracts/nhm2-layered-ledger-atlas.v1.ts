export const NHM2_LAYERED_LEDGER_ATLAS_ARTIFACT_ID = "nhm2_layered_ledger_atlas" as const;
export const NHM2_LAYERED_LEDGER_ATLAS_SCHEMA_VERSION = "v1" as const;

export type Nhm2LayerSemanticKind =
  | "spatial_geometry"
  | "source_evidence"
  | "validation_overlay"
  | "citation_boundary";

export interface Nhm2AtlasLayer {
  id: string;
  label: string;
  semanticKind: Nhm2LayerSemanticKind;
  sourceArtifacts: string[];
  visibleOnHull: boolean;
  claimBoundary: string;
  statusEncoding: string;
  outputPath: string;
  metadata?: Record<string, unknown>;
}

export interface Nhm2AtlasCaption {
  id: string;
  text: string;
  literatureRefs: string[];
  nonPromotional?: boolean;
}

export interface Nhm2AtlasInputRef {
  path: string;
  exists: boolean;
  resolvedPath?: string;
}

export interface Nhm2AtlasManifest {
  artifactId: typeof NHM2_LAYERED_LEDGER_ATLAS_ARTIFACT_ID;
  schemaVersion: typeof NHM2_LAYERED_LEDGER_ATLAS_SCHEMA_VERSION;
  generatedAt: string;
  runId: string;
  selectedProfileId: string;
  laneId: "nhm2_shift_lapse";
  axisConvention: string;
  inputRefs: Record<string, Nhm2AtlasInputRef>;
  inputHashes: Record<string, string | null>;
  camera: Record<string, unknown>;
  layers: Nhm2AtlasLayer[];
  captions: Nhm2AtlasCaption[];
  literatureRefs: string[];
  claimLock: {
    validationClaimAllowed: false;
    physicalMechanismClaimAllowed: false;
    promotionAllowed: false;
  };
  prohibitedClaims: string[];
  validationNotes: string[];
}

const LEGAL_LAYER_KINDS = new Set<Nhm2LayerSemanticKind>([
  "spatial_geometry",
  "source_evidence",
  "validation_overlay",
  "citation_boundary",
]);

const LITERATURE_KEYWORDS = [
  "Casimir",
  "QEI",
  "quantum inequality",
  "energy condition",
  "warp drive",
  "negative energy",
  "NEC",
  "WEC",
];

export const NHM2_ATLAS_PROHIBITED_PATTERNS: RegExp[] = [
  /\bworking\s+propulsion\b/i,
  /\bproof\s+of\s+propulsion\b/i,
  /\bproves?\s+propulsion\b/i,
  /\bvalidated\s+physical\s+mechanism\b/i,
  /\bsolved\s+full\s+warp\b/i,
  /\bsolved\s+warp\s+drive\b/i,
  /\bvalidated\s+FTL\b/i,
  /\bsolved\s+FTL\b/i,
  /\bmeasured\s+detector\s+observation\b/i,
  /\bdirect\s+Casimir[- ]to[- ]curvature\s+proof\b/i,
  /\bexternal\s+paper\s+validates\s+NHM2\b/i,
  /\bvalidated\s+by\s+(Alcubierre|Nat[aá]rio|Pfenning|Ford|Fewster|Lamoreaux|Klimchitskaya|Bobrick|Martire|Santiago|Visser)\b/i,
];

export function isNhm2LayeredLedgerAtlasManifest(value: unknown): value is Nhm2AtlasManifest {
  return validateNhm2LayeredLedgerAtlasManifest(value).length === 0;
}

export function validateNhm2LayeredLedgerAtlasManifest(value: unknown): string[] {
  const issues: string[] = [];
  const manifest = value as Partial<Nhm2AtlasManifest> | null;

  if (!manifest || typeof manifest !== "object") return ["Manifest is not an object"];
  if (manifest.artifactId !== NHM2_LAYERED_LEDGER_ATLAS_ARTIFACT_ID) issues.push("artifactId must be nhm2_layered_ledger_atlas");
  if (manifest.schemaVersion !== NHM2_LAYERED_LEDGER_ATLAS_SCHEMA_VERSION) issues.push("schemaVersion must be v1");
  if (manifest.laneId !== "nhm2_shift_lapse") issues.push("laneId must be nhm2_shift_lapse");

  if (!manifest.claimLock || manifest.claimLock.validationClaimAllowed !== false) {
    issues.push("claimLock.validationClaimAllowed must be false");
  }
  if (!manifest.claimLock || manifest.claimLock.physicalMechanismClaimAllowed !== false) {
    issues.push("claimLock.physicalMechanismClaimAllowed must be false");
  }
  if (!manifest.claimLock || manifest.claimLock.promotionAllowed !== false) {
    issues.push("claimLock.promotionAllowed must be false");
  }

  if (!Array.isArray(manifest.layers)) {
    issues.push("layers must be an array");
  } else {
    for (const layer of manifest.layers) {
      if (!LEGAL_LAYER_KINDS.has(layer.semanticKind)) issues.push(`Layer ${layer.id} has illegal semanticKind ${layer.semanticKind}`);
      if (layer.semanticKind === "validation_overlay" && layer.visibleOnHull !== false) {
        issues.push(`Validation overlay layer ${layer.id} must have visibleOnHull=false`);
      }
      if (typeof layer.outputPath !== "string" || layer.outputPath.length === 0) {
        issues.push(`Layer ${layer.id} is missing outputPath`);
      }
    }
  }

  if (!Array.isArray(manifest.captions)) {
    issues.push("captions must be an array");
  } else {
    for (const caption of manifest.captions) {
      const refs = Array.isArray(caption.literatureRefs) ? caption.literatureRefs : [];
      if (captionNeedsLiterature(caption.text) && refs.length === 0) {
        issues.push(`Caption ${caption.id} uses external physics terms without literatureRefs`);
      }
      if (/certificate pass/i.test(caption.text) && !/non-promotional/i.test(caption.text) && caption.nonPromotional !== true) {
        issues.push(`Caption ${caption.id} says certificate pass without non-promotional boundary`);
      }
      for (const pattern of NHM2_ATLAS_PROHIBITED_PATTERNS) {
        if (pattern.test(caption.text)) issues.push(`Caption ${caption.id} contains prohibited promotion language`);
      }
    }
  }

  const manifestText = JSON.stringify({
    layers: manifest.layers,
    captions: manifest.captions,
    validationNotes: manifest.validationNotes,
  });
  for (const pattern of NHM2_ATLAS_PROHIBITED_PATTERNS) {
    if (pattern.test(manifestText)) issues.push(`Manifest contains prohibited promotion language: ${pattern}`);
  }

  return issues;
}

export function captionNeedsLiterature(text: string): boolean {
  return LITERATURE_KEYWORDS.some((keyword) => new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(text));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
