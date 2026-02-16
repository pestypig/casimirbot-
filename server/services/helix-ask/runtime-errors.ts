const FAST_MODE_RUNTIME_MISSING_SYMBOLS = ["runHelperWithinStageBudget", "getAskElapsedMs"] as const;

const buildMissingSymbolPatterns = (symbol: string): RegExp[] => [
  new RegExp(`(?:['"])?\\b${symbol}\\b(?:['"])?(?:\\([^)]*\\))?\\s*(?:is not defined|is undefined)`, "i"),
  new RegExp(`can't find variable:\\s*(?:['"])?${symbol}\\b(?:['"])?`, "i"),
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
