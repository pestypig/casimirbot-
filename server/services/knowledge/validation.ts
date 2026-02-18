import type { KnowledgeProjectExport, KnowledgeFileAttachment } from "@shared/knowledge";
import type { KnowledgeServerConfig } from "../../config/knowledge";

const BASE64_TO_BYTES_RATIO = 3 / 4;
const MIN_FILE_BUDGET = 128;
const KNOWLEDGE_CLAIM_TIER = "diagnostic" as const;

export const KNOWLEDGE_VALIDATION_FAIL_REASON = {
  budgetOverflow: "knowledge.validation.budget_overflow",
  disallowedMime: "knowledge.validation.disallowed_mime",
  fileLimitExceeded: "knowledge.validation.file_limit_exceeded",
  audioInlineDisallowed: "knowledge.validation.audio_inline_disallowed",
} as const;

type KnowledgeValidationAudit = {
  claim_tier: typeof KNOWLEDGE_CLAIM_TIER;
  provenance: {
    class: "derived";
    stage: "validation";
    source: "knowledge.validator";
    deterministic: true;
  };
  status: "accepted" | "rejected";
  fail_reason?: string;
  project_id?: string;
  file_id?: string;
  branch?: "budget" | "mime" | "file_limit" | "audio_inline";
  context?: Record<string, unknown>;
};

type KnowledgeValidationContextProject = KnowledgeProjectExport & {
  audit?: {
    validation?: KnowledgeValidationAudit;
  };
};

const estimateInlineBytes = (base64?: string): number => {
  if (!base64) {
    return 0;
  }
  const trimmed = base64.trim();
  if (!trimmed) {
    return 0;
  }
  return Math.floor(trimmed.length * BASE64_TO_BYTES_RATIO);
};

const estimatePreviewBytes = (preview?: string): number =>
  preview ? Buffer.byteLength(preview, "utf8") : 0;

export const estimateAttachmentBytes = (file: KnowledgeFileAttachment): number => {
  const preview = estimatePreviewBytes(file.preview);
  const inline = estimateInlineBytes(file.contentBase64);
  const fallback = Number.isFinite(file.size) ? Math.min(file.size, 8192) : 0;
  return Math.max(preview + inline, fallback, MIN_FILE_BUDGET);
};

export const estimateKnowledgeProjectBytes = (project: KnowledgeProjectExport): number => {
  if (typeof project.approxBytes === "number" && project.approxBytes >= 0) {
    return project.approxBytes;
  }
  return project.files.reduce((total, file) => total + estimateAttachmentBytes(file), 0);
};

export const estimateKnowledgeContextBytes = (projects?: KnowledgeProjectExport[]): number => {
  if (!projects || projects.length === 0) {
    return 0;
  }
  return projects.reduce((sum, project) => sum + estimateKnowledgeProjectBytes(project), 0);
};

export class KnowledgeValidationError extends Error {
  status: number;
  failReason?: string;
  audit?: KnowledgeValidationAudit;

  constructor(
    message: string,
    status = 400,
    options?: {
      failReason?: string;
      audit?: KnowledgeValidationAudit;
    },
  ) {
    super(message);
    this.status = status;
    this.failReason = options?.failReason;
    this.audit = options?.audit;
    this.name = "KnowledgeValidationError";
  }
}

export const buildKnowledgeValidator = (config: KnowledgeServerConfig) => {
  const allowedMime = new Set((config.allowedMime ?? []).map((mime) => mime.toLowerCase()));

  return (projects?: KnowledgeProjectExport[]): KnowledgeProjectExport[] | undefined => {
    if (!config.enabled) {
      return undefined;
    }
    if (!projects || projects.length === 0) {
      return undefined;
    }

    let totalBytes = 0;
    for (const project of projects) {
      if (project.files.length > config.maxFilesPerProject) {
        throw new KnowledgeValidationError(
          `project ${project.project.name} exceeds file limit (${project.files.length}/${config.maxFilesPerProject})`,
          400,
          {
            failReason: KNOWLEDGE_VALIDATION_FAIL_REASON.fileLimitExceeded,
            audit: {
              claim_tier: KNOWLEDGE_CLAIM_TIER,
              provenance: {
                class: "derived",
                stage: "validation",
                source: "knowledge.validator",
                deterministic: true,
              },
              status: "rejected",
              fail_reason: KNOWLEDGE_VALIDATION_FAIL_REASON.fileLimitExceeded,
              branch: "file_limit",
              project_id: project.project.id,
              context: {
                files: project.files.length,
                max_files_per_project: config.maxFilesPerProject,
              },
            },
          },
        );
      }
      for (const file of project.files) {
        const mime = (file.mime ?? "").toLowerCase();
        if (allowedMime.size > 0 && mime && !allowedMime.has(mime)) {
          throw new KnowledgeValidationError(`file ${file.name} has disallowed mime ${file.mime}`, 400, {
            failReason: KNOWLEDGE_VALIDATION_FAIL_REASON.disallowedMime,
            audit: {
              claim_tier: KNOWLEDGE_CLAIM_TIER,
              provenance: {
                class: "derived",
                stage: "validation",
                source: "knowledge.validator",
                deterministic: true,
              },
              status: "rejected",
              fail_reason: KNOWLEDGE_VALIDATION_FAIL_REASON.disallowedMime,
              branch: "mime",
              project_id: project.project.id,
              file_id: file.id,
              context: {
                mime,
                allowed_mime: Array.from(allowedMime.values()).sort(),
              },
            },
          });
        }
        if ((file.kind === "audio" || mime.startsWith("audio/")) && file.contentBase64) {
          throw new KnowledgeValidationError(`audio attachment ${file.name} must not include inline content`, 400, {
            failReason: KNOWLEDGE_VALIDATION_FAIL_REASON.audioInlineDisallowed,
            audit: {
              claim_tier: KNOWLEDGE_CLAIM_TIER,
              provenance: {
                class: "derived",
                stage: "validation",
                source: "knowledge.validator",
                deterministic: true,
              },
              status: "rejected",
              fail_reason: KNOWLEDGE_VALIDATION_FAIL_REASON.audioInlineDisallowed,
              branch: "audio_inline",
              project_id: project.project.id,
              file_id: file.id,
            },
          });
        }
      }
      const projectBytes = estimateKnowledgeProjectBytes(project);
      totalBytes += projectBytes;
      if (totalBytes > config.contextBytes) {
        throw new KnowledgeValidationError(
          `knowledge context exceeds budget (${totalBytes}/${config.contextBytes} bytes)`,
          413,
          {
            failReason: KNOWLEDGE_VALIDATION_FAIL_REASON.budgetOverflow,
            audit: {
              claim_tier: KNOWLEDGE_CLAIM_TIER,
              provenance: {
                class: "derived",
                stage: "validation",
                source: "knowledge.validator",
                deterministic: true,
              },
              status: "rejected",
              fail_reason: KNOWLEDGE_VALIDATION_FAIL_REASON.budgetOverflow,
              branch: "budget",
              project_id: project.project.id,
              context: {
                total_bytes: totalBytes,
                context_budget_bytes: config.contextBytes,
              },
            },
          },
        );
      }
    }

    return projects.map((project) => {
      const existingAudit = (project as KnowledgeValidationContextProject).audit ?? {};
      const validationAudit: KnowledgeValidationAudit = {
        claim_tier: KNOWLEDGE_CLAIM_TIER,
        provenance: {
          class: "derived",
          stage: "validation",
          source: "knowledge.validator",
          deterministic: true,
        },
        status: "accepted",
        project_id: project.project.id,
        context: {
          project_bytes: estimateKnowledgeProjectBytes(project),
          file_count: project.files.length,
        },
      };
      return {
        ...project,
        audit: {
          ...existingAudit,
          validation: validationAudit,
        },
      } as KnowledgeProjectExport;
    });
  };
};
