const asksForReceiptProvenance = (prompt: string): boolean =>
  /\b(?:debug|trace|provenance|audit|raw\s+receipt|receipt\s+id|show\s+(?:me\s+)?(?:the\s+)?receipt|why\s+did|how\s+did)\b/i.test(prompt);

const cleanSentenceSpacing = (text: string): string =>
  text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();

export function suppressReceiptFramingInFinalAnswer(input: {
  text: string;
  prompt?: string | null;
}): string {
  const text = String(input.text ?? "");
  if (!text.trim()) return "";
  if (asksForReceiptProvenance(String(input.prompt ?? ""))) return text.trim();

  let cleaned = text
    .replace(
      /,\s*(?:as\s+)?(?:indicated|shown|confirmed|reported|evidenced)\s+by\s+(?:the\s+)?(?:(?:workspace|workstation|tool|action|panel|client)\s+)?(?:action\s+)?receipt\.?/gi,
      ".",
    )
    .replace(
      /\s+(?:as\s+)?(?:indicated|shown|confirmed|reported|evidenced)\s+by\s+(?:the\s+)?(?:(?:workspace|workstation|tool|action|panel|client)\s+)?(?:action\s+)?receipt\.?/gi,
      ".",
    )
    .replace(
      /,\s*according\s+to\s+(?:the\s+)?(?:(?:workspace|workstation|tool|action|panel|client)\s+)?(?:action\s+)?receipt\.?/gi,
      ".",
    )
    .replace(
      /\s+according\s+to\s+(?:the\s+)?(?:(?:workspace|workstation|tool|action|panel|client)\s+)?(?:action\s+)?receipt\.?/gi,
      ".",
    );

  cleaned = cleanSentenceSpacing(cleaned);
  return cleaned || text.trim();
}
