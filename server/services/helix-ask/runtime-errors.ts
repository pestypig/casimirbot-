const FAST_MODE_RUNTIME_MISSING_SYMBOLS = ["runHelperWithinStageBudget", "getAskElapsedMs"] as const;
export const HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON = "HELIX_ASK_RUNTIME_UNAVAILABLE" as const;

const buildMissingSymbolPatterns = (symbol: string): RegExp[] => [
  new RegExp(`(?:['"])?\\b${symbol}\\b(?:['"])?(?:\\([^)]*\\))?\\s*(?:is not defined|is undefined)`, "i"),
  new RegExp(`can't find variable:\\s*(?:['"])?${symbol}\\b(?:['"])?`, "i"),
  new RegExp(`\\b${symbol}\\b\\s*(?:is not defined|is undefined)`, "i"),
  new RegExp(`can't find variable:\\s*${symbol}\\b`, "i"),
];

const FAST_MODE_RUNTIME_MISSING_SYMBOL_PATTERNS = FAST_MODE_RUNTIME_MISSING_SYMBOLS.flatMap(
  (symbol) => buildMissingSymbolPatterns(symbol),
);

const readErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return String(error ?? "");
};

export const isFastModeRuntimeMissingSymbolError = (error: unknown): boolean => {
  const message = readErrorMessage(error);
  return FAST_MODE_RUNTIME_MISSING_SYMBOL_PATTERNS.some((pattern) => pattern.test(message));
};

export const classifyHelixAskRuntimeUnavailableReason = (error: unknown): string | null => {
  if (isFastModeRuntimeMissingSymbolError(error)) {
    return HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON;
  }
  const message = readErrorMessage(error);
  if (/\b(fetch failed|request failed|network|econnrefused|connection refused|abort(?:ed)?|timed out?)\b/i.test(message)) {
    return HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON;
  }
  return null;
};
