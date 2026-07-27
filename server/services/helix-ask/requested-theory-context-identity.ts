const normalizeIdentityText = (value: string): string =>
  value
    .normalize("NFKC")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const coverageTokens = (value: string): string[] =>
  normalizeIdentityText(value)
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => !["the", "theory", "badge", "graph", "context"].includes(token)) ?? [];

export function extractRequestedTheoryContextIdentities(prompt: string): string[] {
  const normalizedPrompt = normalizeIdentityText(prompt);
  const graphScopeMatch = normalizedPrompt.match(
    /\b(?:locate|map|place|compare|relate)\s+(?:the\s+)?(.{1,220}?)\s+(?:in|within|against|on)\s+(?:the\s+)?(?:Theory Badge Graph|theory graph|badge graph)\b/i,
  );
  const naturalIdentities = graphScopeMatch?.[1]
    ? graphScopeMatch[1]
        .split(/\s+(?:and|versus|vs\.?|with)\s+(?:the\s+)?/i)
        .map((value) => value.replace(/[.!?]+$/g, "").trim())
        .filter(Boolean)
    : [];
  const registeredBadgeIds = Array.from(
    normalizedPrompt.matchAll(/\b[a-z][a-z0-9-]*(?:\.[a-z0-9_-]+){2,}\b/g),
    (match) => match[0],
  );
  return Array.from(new Set([...naturalIdentities, ...registeredBadgeIds]))
    .filter((identity) => coverageTokens(identity).length > 0)
    .slice(0, 6);
}

export function missingRequestedTheoryContextIdentities(
  prompt: string,
  answer: string,
): string[] {
  const answerTokens = new Set(coverageTokens(answer));
  return extractRequestedTheoryContextIdentities(prompt).filter((identity) => {
    const identityTokens = coverageTokens(identity);
    return identityTokens.some((token) => !answerTokens.has(token));
  });
}

export function requestedTheoryContextIdentityLine(prompt: string): string | null {
  const identities = extractRequestedTheoryContextIdentities(prompt);
  if (identities.length === 0) return null;
  return `Requested graph identities (query scope only): ${identities.join("; ")}. This preserves the query scope; it does not assert a registered relationship or proof.`;
}
