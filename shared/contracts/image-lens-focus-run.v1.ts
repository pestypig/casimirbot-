import type { DocumentImageBboxPxV1 } from "./document-image-region-receipt.v1";

export const IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION = "image_lens_focus_run/v1" as const;
export const IMAGE_LENS_FOCUS_RUN_RESULT_VERSION = "image_lens_focus_run_result/v1" as const;

export type ImageLensFocusRunModeV1 = "regions_only" | "broad_then_regions";

export type ImageLensFocusBboxPctV1 = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ImageLensFocusRegionV1 = {
  regionId: string;
  bboxPct: ImageLensFocusBboxPctV1;
  reason: string;
  priority: number;
};

export type ImageLensFocusRunRequestV1 = {
  contractVersion: typeof IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION;
  sourceId: string;
  mode: ImageLensFocusRunModeV1;
  regions: ImageLensFocusRegionV1[];
  maxRegions: number;
  claimBoundary: {
    observationOnly: true;
    notAnswerAuthority: true;
  };
};

export type ImageLensFocusRunSubmittedRegionV1 = {
  regionId: string;
  bboxPct: ImageLensFocusBboxPctV1;
  bboxPx: DocumentImageBboxPxV1;
  reason: string;
  evidenceId: string | null;
  frameId: string | null;
  summary: string;
  previewHash: string | null;
};

export type ImageLensFocusRunResultV1 = {
  contractVersion: typeof IMAGE_LENS_FOCUS_RUN_RESULT_VERSION;
  generatedAt: string;
  sourceId: string;
  submittedRegions: ImageLensFocusRunSubmittedRegionV1[];
  blockers: string[];
  claimBoundary: {
    observationOnly: true;
    notAnswerAuthority: true;
  };
};

const MAX_FOCUS_REGIONS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function clampImageLensFocusBboxPct(value: unknown): ImageLensFocusBboxPctV1 {
  const record = isRecord(value) ? value : {};
  const x = clampNumber(record.x, 0, 1, 0);
  const y = clampNumber(record.y, 0, 1, 0);
  const maxWidth = Math.max(0.001, 1 - x);
  const maxHeight = Math.max(0.001, 1 - y);
  return {
    x,
    y,
    width: clampNumber(record.width, 0.001, maxWidth, maxWidth),
    height: clampNumber(record.height, 0.001, maxHeight, maxHeight),
  };
}

export function normalizeImageLensFocusRunRequestV1(input: unknown): ImageLensFocusRunRequestV1 {
  const record = isRecord(input) ? input : {};
  const rawRegions = Array.isArray(record.regions) ? record.regions : [];
  const regions = rawRegions
    .filter(isRecord)
    .map((region, index): ImageLensFocusRegionV1 => ({
      regionId: readString(region.regionId ?? region.region_id, `focus-region:${index + 1}`),
      bboxPct: clampImageLensFocusBboxPct(region.bboxPct ?? region.bbox_pct ?? region.bbox),
      reason: readString(region.reason, "Agent-selected Image Lens focus region."),
      priority: clampNumber(region.priority, 0, 100, index + 1),
    }));
  const mode = record.mode === "broad_then_regions" ? "broad_then_regions" : "regions_only";
  const maxRegions = Math.max(1, Math.floor(clampNumber(record.maxRegions ?? record.max_regions, 1, MAX_FOCUS_REGIONS, regions.length || 1)));

  return {
    contractVersion: IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION,
    sourceId: readString(record.sourceId ?? record.source_id, ""),
    mode,
    regions: regions.slice(0, maxRegions),
    maxRegions,
    claimBoundary: {
      observationOnly: true,
      notAnswerAuthority: true,
    },
  };
}

export function validateImageLensFocusRunRequestV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["request must be an object"];
  if (value.contractVersion !== IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION) {
    issues.push(`contractVersion must be ${IMAGE_LENS_FOCUS_RUN_REQUEST_VERSION}`);
  }
  if (!readString(value.sourceId, "")) issues.push("sourceId must be a non-empty string");
  if (value.mode !== "regions_only" && value.mode !== "broad_then_regions") {
    issues.push("mode must be regions_only or broad_then_regions");
  }
  if (!Array.isArray(value.regions) || value.regions.length < 1) {
    issues.push("regions must contain at least one focus region");
  }
  if (!isRecord(value.claimBoundary) || value.claimBoundary.observationOnly !== true || value.claimBoundary.notAnswerAuthority !== true) {
    issues.push("claimBoundary must mark observationOnly and notAnswerAuthority true");
  }
  return issues;
}

export function buildImageLensFocusRunResultV1(input: {
  generatedAt?: string;
  sourceId: string;
  submittedRegions?: ImageLensFocusRunSubmittedRegionV1[];
  blockers?: string[];
}): ImageLensFocusRunResultV1 {
  return {
    contractVersion: IMAGE_LENS_FOCUS_RUN_RESULT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceId: input.sourceId,
    submittedRegions: input.submittedRegions ?? [],
    blockers: input.blockers ?? [],
    claimBoundary: {
      observationOnly: true,
      notAnswerAuthority: true,
    },
  };
}
