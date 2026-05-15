const SETUP_PROMPT_PATTERNS: RegExp[] = [
  /\bi have visual capture active\b/i,
  /\bset up\b.*\b(?:live environment|minecraft cortana|cortana live environment)\b/i,
  /\bshow missing source fidelity\b/i,
  /\bprepare line checks\b/i,
  /\bcapture and analyze the first frame\b/i,
  /\bderive (?:the )?live card\b/i,
  /\busing the active visual source\b/i,
  /\bi do not have the minecraft plugin source attached\b/i,
  /\bstart visual-only\b/i,
];

const FACTUAL_MISSING_PATTERNS: RegExp[] = [
  /\b(?:no|missing|not attached|not active|not configured|unavailable|waiting for|stale|failed)\b/i,
  /\b(?:visual frame|world-event|world event|audio transcript|vision provider|source|frame|receipt|evidence)\b/i,
];

export const isSetupInstructionText = (value: unknown): boolean => {
  const text = String(value ?? "").trim();
  if (!text) return false;
  if (SETUP_PROMPT_PATTERNS.some((pattern) => pattern.test(text))) return true;
  if (text.length > 180 && /\b(?:set up|start|prepare|show|derive|capture)\b/i.test(text)) return true;
  return false;
};

export const sanitizeMissingEvidenceEntry = (value: unknown): string | null => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (isSetupInstructionText(text)) return null;
  if (text.length > 220 && !FACTUAL_MISSING_PATTERNS.some((pattern) => pattern.test(text))) return null;
  return text;
};

export const sanitizeMissingEvidence = (values: unknown[]): string[] =>
  Array.from(new Set(values.map(sanitizeMissingEvidenceEntry).filter((entry): entry is string => Boolean(entry))));
