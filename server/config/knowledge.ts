import {
  KNOWLEDGE_DEFAULT_CONTEXT_LIMIT,
  KNOWLEDGE_DEFAULT_FILES_PER_PROJECT,
  KNOWLEDGE_FALLBACK_ALLOWED_MIME,
} from "@shared/knowledge";

export type KnowledgeServerConfig = {
  enabled: boolean;
  promptHintsEnabled: boolean;
  contextBytes: number;
  maxFilesPerProject: number;
  allowedMime: string[];
};

const clampPositiveInt = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const parseMimeList = (raw: string | undefined): string[] => {
  if (!raw) {
    return [...KNOWLEDGE_FALLBACK_ALLOWED_MIME];
  }
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
};

export const readKnowledgeConfig = (
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): KnowledgeServerConfig => {
  return {
    enabled: env.ENABLE_KNOWLEDGE_PROJECTS !== "0",
    promptHintsEnabled: env.ENABLE_KNOWLEDGE_PROMPT_HINTS === "1",
    contextBytes: clampPositiveInt(env.MAX_KNOWLEDGE_CONTEXT_BYTES, KNOWLEDGE_DEFAULT_CONTEXT_LIMIT),
    maxFilesPerProject: clampPositiveInt(env.MAX_KNOWLEDGE_FILES_PER_PROJECT, KNOWLEDGE_DEFAULT_FILES_PER_PROJECT),
    allowedMime: parseMimeList(env.KNOWLEDGE_ALLOWED_MIME),
  };
};
