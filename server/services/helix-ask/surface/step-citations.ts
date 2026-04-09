type ExecutionResultLike = {
  citations?: unknown;
  output?: unknown;
};

export const collectStepCitations = (steps: ExecutionResultLike[]): string[] => {
  const citations = new Set<string>();
  for (const step of steps) {
    if (Array.isArray(step.citations)) {
      step.citations.forEach((citation) => {
        if (typeof citation === "string" && citation.trim().length > 0) {
          citations.add(citation.trim());
        }
      });
    }
    const output = step.output as { citations?: unknown } | undefined;
    if (Array.isArray(output?.citations)) {
      output.citations.forEach((citation) => {
        if (typeof citation === "string" && citation.trim().length > 0) {
          citations.add(citation.trim());
        }
      });
    }
  }
  return Array.from(citations);
};
