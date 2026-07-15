export const THEORY_RUNTIME_OUTPUT_MAX_CHARS = 64_000;

export const THEORY_RUNTIME_OUTPUT_TRUNCATED_MARKER = "\n[output truncated]";

export function appendBoundedTheoryRuntimeOutput(
  current: string,
  chunk: unknown,
  maxChars = THEORY_RUNTIME_OUTPUT_MAX_CHARS,
): string {
  if (current.endsWith(THEORY_RUNTIME_OUTPUT_TRUNCATED_MARKER)) return current;
  const next = current + String(chunk);
  if (next.length <= maxChars) return next;
  const contentLimit = Math.max(0, maxChars - THEORY_RUNTIME_OUTPUT_TRUNCATED_MARKER.length);
  return next.slice(0, contentLimit) + THEORY_RUNTIME_OUTPUT_TRUNCATED_MARKER.slice(0, maxChars);
}
