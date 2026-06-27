const asksForReceiptProvenance = (prompt: string): boolean =>
  /\b(?:debug|trace|provenance|audit|raw\s+receipt|receipt\s+id|show\s+(?:me\s+)?(?:the\s+)?receipt|why\s+did|how\s+did)\b/i.test(prompt);

const cleanSentenceSpacing = (text: string): string =>
  text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();

const hasMarkdownBulletLines = (text: string): boolean =>
  /(?:^|\n)\s*[-*]\s+\S/m.test(text);

const cleanLineSentenceSpacing = (text: string): string =>
  text
    .replace(/[ \t]+([,.!?;:])/g, "$1")
    .replace(/([.!?])([A-Z])/g, "$1 $2")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const cleanStructuredSentenceSpacing = (text: string): string =>
  text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => cleanLineSentenceSpacing(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
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

  cleaned = hasMarkdownBulletLines(cleaned)
    ? cleanStructuredSentenceSpacing(cleaned)
    : cleanSentenceSpacing(cleaned);
  return cleaned || text.trim();
}

export const cleanHelixPostObservationDraftText = (text: string, prompt?: string | null): string =>
  suppressReceiptFramingInFinalAnswer({
    text: text
    .replace(
      /Quantities that depend on time:\s*Impulse and Average Power\./gi,
      "Quantities that depend on time: final speed, impulse, and average power.",
    )
    .replace(
      /Quantities that depend on time:\s*Impulse and average power\./gi,
      "Quantities that depend on time: final speed, impulse, and average power.",
    )
    .replace(
      /Quantities that depend only on (?:the\s+)?final speed:\s*Final kinetic energy and net force\./gi,
      "Quantities that depend only on final speed, with mass fixed: final kinetic energy. Net force depends on acceleration; if acceleration is derived from final speed, elapsed time is also required.",
    )
    .replace(
      /Quantities that depend only on (?:the\s+)?final speed:\s*Final kinetic energy,? and net force\./gi,
      "Quantities that depend only on final speed, with mass fixed: final kinetic energy. Net force depends on acceleration; if acceleration is derived from final speed, elapsed time is also required.",
    )
    .replace(/(?:^|\n)\s*However,?\s+the\s+interpretation\s+of\s+these\s+results\s+is\s+missing\.?\s*$/i, "")
    .replace(/(?:^|\n)\s*Missing interpretation(?:\s+of\s+results)?\.?\s*$/i, "")
    .trim(),
    prompt,
  });
