type LocalRuntimeCaps = {
  contextTokens: number;
  maxTopK: number;
  maxKnowledgeBytes: number;
  maxKnowledgeFiles: number;
  maxAppendixChars: number;
  maxAppendixSnippets: number;
  claimTier: "diagnostic" | "reduced-order" | "certified";
};

export type LocalLlmBackend = "spawn" | "http" | "none";

export type LocalLlmRuntimeDiagnostics = {
  backend: LocalLlmBackend;
  localRuntimeSelected: boolean;
  httpRuntimeLocked: boolean;
  explicitLocal: boolean;
  explicitHttp: boolean;
  httpConfigured: boolean;
  defaultOpenAiBaseAllowed: boolean;
  localSpawnEnabled: boolean;
  localCmdConfigured: boolean;
  localModelConfigured: boolean;
  localArtifactHydrationAllowed: boolean;
  localExecutionPossible: boolean;
  providerCalledByStatusRead: false;
  reason: string;
};

const LOCAL_CONTEXT_MIN = 2048;
const LOCAL_CONTEXT_MAX = 8192;
const DEFAULT_CONTEXT_TOKENS = 4096;
const DEFAULT_TOPK_CAP = 4;
const DEFAULT_KNOWLEDGE_BYTES = 80_000;
const DEFAULT_KNOWLEDGE_FILES = 4;
const DEFAULT_APPENDIX_CHARS = 1000;
const DEFAULT_APPENDIX_SNIPPETS = 3;
const DEFAULT_CLAIM_TIER: LocalRuntimeCaps["claimTier"] = "diagnostic";
const CLAIM_TIER_VALUES = new Set<LocalRuntimeCaps["claimTier"]>([
  "diagnostic",
  "reduced-order",
  "certified",
]);

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Math.floor(value), min), max);

const parsePositiveInt = (raw: string | number | undefined, fallback: number): number => {
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

const normalizeLower = (value: string | undefined): string => (value ?? "").trim().toLowerCase();

export const isHttpRuntimeLocked = (): boolean => {
  const policy = normalizeLower(process.env.LLM_POLICY);
  if (policy === "http") return true;
  if (policy === "local") return false;
  const runtime = normalizeLower(process.env.LLM_RUNTIME);
  return runtime === "http" || runtime === "openai";
};

export const isLocalRuntime = (): boolean => {
  const policy = normalizeLower(process.env.LLM_POLICY);
  if (policy === "local") return true;
  if (policy === "http") return false;
  const runtime = normalizeLower(process.env.LLM_RUNTIME);
  if (runtime === "local" || runtime === "llama.cpp" || runtime === "replit") return true;
  if (runtime === "http" || runtime === "openai") return false;
  return false;
};

export const resolveLocalLlmRuntimeDiagnostics = (): LocalLlmRuntimeDiagnostics => {
  const policy = normalizeLower(process.env.LLM_POLICY);
  const runtime = normalizeLower(process.env.LLM_RUNTIME);
  const defaultOpenAiBaseAllowed =
    String(process.env.LLM_HTTP_ALLOW_DEFAULT_OPENAI_BASE ?? "1").trim() !== "0";
  const httpConfigured =
    Boolean(process.env.LLM_HTTP_BASE?.trim()) ||
    (defaultOpenAiBaseAllowed && Boolean(process.env.OPENAI_API_KEY?.trim()));
  const explicitLocal = isLocalRuntime();
  const httpRuntimeLocked = isHttpRuntimeLocked();
  const explicitHttp = httpRuntimeLocked;
  const localSpawnEnabled = process.env.ENABLE_LLM_LOCAL_SPAWN === "1";
  const localCmdConfigured = Boolean(process.env.LLM_LOCAL_CMD?.trim());
  const localModelConfigured =
    Boolean(process.env.LLM_LOCAL_MODEL_PATH?.trim()) ||
    Boolean(process.env.LLM_LOCAL_MODEL?.trim());
  const spawnAvailable = localSpawnEnabled || localCmdConfigured;
  const backend: LocalLlmBackend =
    explicitLocal && spawnAvailable
      ? "spawn"
      : httpRuntimeLocked
        ? (httpConfigured ? "http" : "none")
        : httpConfigured
          ? "http"
          : "none";
  const localArtifactHydrationAllowed =
    !httpRuntimeLocked || process.env.LLM_HYDRATE_LOCAL_ARTIFACTS_IN_HTTP_MODE === "1";
  const reason =
    backend === "spawn"
      ? "explicit_local_runtime_with_spawn_available"
      : backend === "http" && httpRuntimeLocked
        ? "explicit_http_runtime_locked"
        : backend === "http"
          ? "http_provider_configured"
          : explicitLocal
            ? "local_runtime_selected_but_spawn_unavailable"
            : "no_llm_backend_configured";

  return {
    backend,
    localRuntimeSelected: isLocalRuntime(),
    httpRuntimeLocked,
    explicitLocal,
    explicitHttp,
    httpConfigured,
    defaultOpenAiBaseAllowed,
    localSpawnEnabled,
    localCmdConfigured,
    localModelConfigured,
    localArtifactHydrationAllowed,
    localExecutionPossible: backend === "spawn",
    providerCalledByStatusRead: false,
    reason,
  };
};

export const resolveLlmLocalBackend = (): LocalLlmBackend =>
  resolveLocalLlmRuntimeDiagnostics().backend;

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
  const claimTierRaw = (process.env.LLM_LOCAL_CLAIM_TIER ?? process.env.CLAIM_TIER ?? "").trim();
  const claimTier = CLAIM_TIER_VALUES.has(claimTierRaw as LocalRuntimeCaps["claimTier"])
    ? (claimTierRaw as LocalRuntimeCaps["claimTier"])
    : DEFAULT_CLAIM_TIER;
  return {
    contextTokens,
    maxTopK,
    maxKnowledgeBytes,
    maxKnowledgeFiles,
    maxAppendixChars,
    maxAppendixSnippets,
    claimTier,
  };
};
