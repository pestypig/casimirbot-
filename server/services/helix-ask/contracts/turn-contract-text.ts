const HELIX_ASK_TURN_CONTRACT_PATH_FRAGMENT_RE =
  /\b(?:docs|server|client|modules|shared|scripts|tests|apps|packages|cli)\/[A-Za-z0-9_./-]+\b/gi;

const clipHelixAskTurnContractText = (value: string | undefined, limit: number): string => {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

export const normalizeHelixAskTurnContractText = (value: unknown, maxChars: number): string => {
  const cleaned = String(value ?? "")
    .replace(HELIX_ASK_TURN_CONTRACT_PATH_FRAGMENT_RE, " ")
    .replace(/^\s*sources?\s*:\s*/gim, " ")
    .replace(/[`#*]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned ? clipHelixAskTurnContractText(cleaned, maxChars).trim() : "";
};
