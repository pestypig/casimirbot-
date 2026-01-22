type LocalRuntimeCaps = {
  contextTokens: number;
  maxTopK: number;
  maxKnowledgeBytes: number;
  maxKnowledgeFiles: number;
  maxAppendixChars: number;
  maxAppendixSnippets: number;
};

const LOCAL_CONTEXT_MIN = 2048;
const LOCAL_CONTEXT_MAX = 4096;
const DEFAULT_CONTEXT_TOKENS = 3072;
const DEFAULT_TOPK_CAP = 4;
const DEFAULT_KNOWLEDGE_BYTES = 80_000;
const DEFAULT_KNOWLEDGE_FILES = 4;
const DEFAULT_APPENDIX_CHARS = 1000;
const DEFAULT_APPENDIX_SNIPPETS = 3;

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Math.floor(value), min), max);

const parsePositiveInt = (raw: string | number | undefined, fallback: number): number => {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const isLocalRuntime = (): boolean => {
  const policy = (process.env.LLM_POLICY ?? "").trim().toLowerCase();
  if (policy === "local") return true;
  const runtime = (process.env.LLM_RUNTIME ?? "").trim().toLowerCase();
  if (runtime === "local" || runtime === "llama.cpp" || runtime === "replit") return true;
  return process.env.ENABLE_LLM_LOCAL_SPAWN === "1";
};

export const resolveLocalContextTokens = (): number => {
  const raw =
    process.env.LLM_LOCAL_CONTEXT_TOKENS ??
    process.env.LLM_LOCAL_CTX_TOKENS ??
    process.env.LLM_LOCAL_CTX_SIZE ??
    process.env.LLM_LOCAL_CONTEXT_SIZE;
  const parsed = parsePositiveInt(raw, DEFAULT_CONTEXT_TOKENS);
  return clampInt(parsed, LOCAL_CONTEXT_MIN, LOCAL_CONTEXT_MAX);
};

export const resolveLocalRuntimeCaps = (): LocalRuntimeCaps | null => {
  if (!isLocalRuntime()) {
    return null;
  }
  const contextTokens = resolveLocalContextTokens();
  const maxTopK = clampInt(parsePositiveInt(process.env.LLM_LOCAL_MAX_TOPK, DEFAULT_TOPK_CAP), 1, 10);
  const maxKnowledgeBytes = clampInt(
    parsePositiveInt(process.env.LLM_LOCAL_MAX_KNOWLEDGE_BYTES, DEFAULT_KNOWLEDGE_BYTES),
    2000,
    1_000_000,
  );
  const maxKnowledgeFiles = clampInt(
    parsePositiveInt(process.env.LLM_LOCAL_MAX_KNOWLEDGE_FILES, DEFAULT_KNOWLEDGE_FILES),
    1,
    20,
  );
  const maxAppendixChars = clampInt(
    parsePositiveInt(process.env.LLM_LOCAL_APPENDIX_CHARS, DEFAULT_APPENDIX_CHARS),
    200,
    4000,
  );
  const maxAppendixSnippets = clampInt(
    parsePositiveInt(process.env.LLM_LOCAL_APPENDIX_SNIPPETS, DEFAULT_APPENDIX_SNIPPETS),
    1,
    6,
  );
  return {
    contextTokens,
    maxTopK,
    maxKnowledgeBytes,
    maxKnowledgeFiles,
    maxAppendixChars,
    maxAppendixSnippets,
  };
};
