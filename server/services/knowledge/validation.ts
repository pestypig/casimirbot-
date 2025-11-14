import type { KnowledgeProjectExport, KnowledgeFileAttachment } from "@shared/knowledge";
import type { KnowledgeServerConfig } from "../../config/knowledge";

const BASE64_TO_BYTES_RATIO = 3 / 4;
const MIN_FILE_BUDGET = 128;

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
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
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
        );
      }
      for (const file of project.files) {
        const mime = (file.mime ?? "").toLowerCase();
        if (allowedMime.size > 0 && mime && !allowedMime.has(mime)) {
          throw new KnowledgeValidationError(`file ${file.name} has disallowed mime ${file.mime}`);
        }
        if ((file.kind === "audio" || mime.startsWith("audio/")) && file.contentBase64) {
          throw new KnowledgeValidationError(`audio attachment ${file.name} must not include inline content`);
        }
      }
      const projectBytes = estimateKnowledgeProjectBytes(project);
      totalBytes += projectBytes;
      if (totalBytes > config.contextBytes) {
        throw new KnowledgeValidationError(
          `knowledge context exceeds budget (${totalBytes}/${config.contextBytes} bytes)`,
          413,
        );
      }
    }

    return projects;
  };
};
