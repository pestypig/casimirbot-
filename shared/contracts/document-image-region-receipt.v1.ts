export const DOCUMENT_IMAGE_REGION_RECEIPT_VERSION = "document_image_region_receipt/v1" as const;

export const DOCUMENT_IMAGE_REGION_KIND_VALUES = [
  "equation",
  "figure",
  "caption",
  "table",
  "paragraph",
  "reference",
  "unknown",
] as const;

export const DOCUMENT_IMAGE_SOURCE_KIND_VALUES = [
  "image_attachment",
  "pdf_page_render",
  "manual_image_url",
] as const;

export const DOCUMENT_IMAGE_EXTRACTION_STATUS_VALUES = [
  "candidate",
  "confirmed",
  "rejected",
] as const;

export type DocumentImageRegionKindV1 = (typeof DOCUMENT_IMAGE_REGION_KIND_VALUES)[number];
export type DocumentImageSourceKindV1 = (typeof DOCUMENT_IMAGE_SOURCE_KIND_VALUES)[number];
export type DocumentImageExtractionStatusV1 = (typeof DOCUMENT_IMAGE_EXTRACTION_STATUS_VALUES)[number];

export type DocumentImageBboxPxV1 = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DocumentImageRegionReceiptV1 = {
  contractVersion: typeof DOCUMENT_IMAGE_REGION_RECEIPT_VERSION;
  generatedAt: string;
  sourceAttachmentId: string;
  sourceKind: DocumentImageSourceKindV1;
  pageRef?: {
    pageNumber: number;
    pageImageRef: string;
  };
  crop: {
    regionId: string;
    bboxPx: DocumentImageBboxPxV1;
    imageRef: string;
    imageHash: string;
  };
  visualSource: {
    sourceId: string;
    frameId: string;
    observerProfileId: string;
    shadePromptId?: string;
  };
  classification: {
    kind: DocumentImageRegionKindV1;
    confidence: number;
    summary: string;
  };
  extraction: {
    textCandidate?: string;
    latexCandidate?: string;
    tableCandidateRef?: string;
    status: DocumentImageExtractionStatusV1;
  };
  locatorAnchor: {
    pageNumber?: number | null;
    bboxPx: DocumentImageBboxPxV1;
    nearbyTextHash?: string;
    ocrHash?: string;
    anchorConfidence: number;
  };
  claimBoundary: {
    ocrCandidateOnly: boolean;
    notProofAuthority: true;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

function validateBbox(path: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }
  for (const key of ["x", "y", "width", "height"] as const) {
    if (!isFiniteNumber(value[key])) issues.push(`${path}.${key} must be a finite number`);
  }
  if (isFiniteNumber(value.width) && value.width <= 0) issues.push(`${path}.width must be positive`);
  if (isFiniteNumber(value.height) && value.height <= 0) issues.push(`${path}.height must be positive`);
}

export function validateDocumentImageRegionReceiptV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["receipt must be an object"];

  if (value.contractVersion !== DOCUMENT_IMAGE_REGION_RECEIPT_VERSION) {
    issues.push(`contractVersion must be ${DOCUMENT_IMAGE_REGION_RECEIPT_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.sourceAttachmentId)) issues.push("sourceAttachmentId must be a non-empty string");
  if (!includes(DOCUMENT_IMAGE_SOURCE_KIND_VALUES, value.sourceKind)) {
    issues.push(`sourceKind must be one of ${DOCUMENT_IMAGE_SOURCE_KIND_VALUES.join(", ")}`);
  }

  if (value.pageRef !== undefined) {
    if (!isRecord(value.pageRef)) {
      issues.push("pageRef must be an object when present");
    } else {
      if (!isFiniteNumber(value.pageRef.pageNumber) || value.pageRef.pageNumber < 1) {
        issues.push("pageRef.pageNumber must be a positive number");
      }
      if (!isNonEmptyString(value.pageRef.pageImageRef)) {
        issues.push("pageRef.pageImageRef must be a non-empty string");
      }
    }
  }

  if (!isRecord(value.crop)) {
    issues.push("crop must be an object");
  } else {
    if (!isNonEmptyString(value.crop.regionId)) issues.push("crop.regionId must be a non-empty string");
    validateBbox("crop.bboxPx", value.crop.bboxPx, issues);
    if (!isNonEmptyString(value.crop.imageRef)) issues.push("crop.imageRef must be a non-empty string");
    if (!isNonEmptyString(value.crop.imageHash)) issues.push("crop.imageHash must be a non-empty string");
  }

  if (!isRecord(value.visualSource)) {
    issues.push("visualSource must be an object");
  } else {
    if (!isNonEmptyString(value.visualSource.sourceId)) issues.push("visualSource.sourceId must be a non-empty string");
    if (!isNonEmptyString(value.visualSource.frameId)) issues.push("visualSource.frameId must be a non-empty string");
    if (!isNonEmptyString(value.visualSource.observerProfileId)) {
      issues.push("visualSource.observerProfileId must be a non-empty string");
    }
    if (value.visualSource.shadePromptId !== undefined && !isNonEmptyString(value.visualSource.shadePromptId)) {
      issues.push("visualSource.shadePromptId must be a non-empty string when present");
    }
  }

  if (!isRecord(value.classification)) {
    issues.push("classification must be an object");
  } else {
    if (!includes(DOCUMENT_IMAGE_REGION_KIND_VALUES, value.classification.kind)) {
      issues.push(`classification.kind must be one of ${DOCUMENT_IMAGE_REGION_KIND_VALUES.join(", ")}`);
    }
    if (!isFiniteNumber(value.classification.confidence) || value.classification.confidence < 0 || value.classification.confidence > 1) {
      issues.push("classification.confidence must be a number from 0 to 1");
    }
    if (!isNonEmptyString(value.classification.summary)) {
      issues.push("classification.summary must be a non-empty string");
    }
  }

  if (!isRecord(value.extraction)) {
    issues.push("extraction must be an object");
  } else {
    if (!includes(DOCUMENT_IMAGE_EXTRACTION_STATUS_VALUES, value.extraction.status)) {
      issues.push(`extraction.status must be one of ${DOCUMENT_IMAGE_EXTRACTION_STATUS_VALUES.join(", ")}`);
    }
    for (const key of ["textCandidate", "latexCandidate", "tableCandidateRef"] as const) {
      if (value.extraction[key] !== undefined && typeof value.extraction[key] !== "string") {
        issues.push(`extraction.${key} must be a string when present`);
      }
    }
  }

  if (!isRecord(value.locatorAnchor)) {
    issues.push("locatorAnchor must be an object");
  } else {
    if (value.locatorAnchor.pageNumber !== undefined && value.locatorAnchor.pageNumber !== null) {
      if (!isFiniteNumber(value.locatorAnchor.pageNumber) || value.locatorAnchor.pageNumber < 1) {
        issues.push("locatorAnchor.pageNumber must be a positive number, null, or omitted");
      }
    }
    validateBbox("locatorAnchor.bboxPx", value.locatorAnchor.bboxPx, issues);
    if (value.locatorAnchor.nearbyTextHash !== undefined && !isNonEmptyString(value.locatorAnchor.nearbyTextHash)) {
      issues.push("locatorAnchor.nearbyTextHash must be a non-empty string when present");
    }
    if (value.locatorAnchor.ocrHash !== undefined && !isNonEmptyString(value.locatorAnchor.ocrHash)) {
      issues.push("locatorAnchor.ocrHash must be a non-empty string when present");
    }
    if (
      !isFiniteNumber(value.locatorAnchor.anchorConfidence) ||
      value.locatorAnchor.anchorConfidence < 0 ||
      value.locatorAnchor.anchorConfidence > 1
    ) {
      issues.push("locatorAnchor.anchorConfidence must be a number from 0 to 1");
    }
  }

  if (!isRecord(value.claimBoundary)) {
    issues.push("claimBoundary must be an object");
  } else {
    if (typeof value.claimBoundary.ocrCandidateOnly !== "boolean") {
      issues.push("claimBoundary.ocrCandidateOnly must be a boolean");
    }
    if (value.claimBoundary.notProofAuthority !== true) {
      issues.push("claimBoundary.notProofAuthority must be true");
    }
  }

  return issues;
}

export function isDocumentImageRegionReceiptV1(value: unknown): value is DocumentImageRegionReceiptV1 {
  return validateDocumentImageRegionReceiptV1(value).length === 0;
}
