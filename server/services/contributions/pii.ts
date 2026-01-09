export type PiiKind = "email" | "phone" | "ssn" | "credit_card";

export type PiiFinding = {
  kind: PiiKind;
  field: string;
};

export type PiiScanResult = { ok: true } | { ok: false; findings: PiiFinding[] };

type PiiField = {
  field: string;
  value?: string | null;
};

const PII_SCAN_ENABLED = process.env.CONTRIBUTION_PII_SCAN !== "0";

const parseMaxFindings = (): number => {
  const requested = Number(process.env.CONTRIBUTION_PII_MAX_FINDINGS ?? 8);
  if (!Number.isFinite(requested) || requested < 1) {
    return 8;
  }
  return Math.min(Math.max(1, Math.floor(requested)), 25);
};

const MAX_FINDINGS = parseMaxFindings();

const EMAIL_REGEX =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_CANDIDATE_REGEX =
  /(?:\+?\d[\d\s().-]{7,}\d)/g;
const SSN_REGEX = /\b\d{3}-?\d{2}-?\d{4}\b/g;
const CREDIT_CARD_CANDIDATE_REGEX =
  /\b(?:\d[ -]*?){13,19}\b/g;

const normalizeDigits = (value: string): string => value.replace(/\D/g, "");

const isValidPhoneDigits = (digits: string): boolean => {
  if (digits.length < 10 || digits.length > 15) return false;
  return !/^0+$/.test(digits);
};

const luhnCheck = (digits: string): boolean => {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const pushFinding = (
  findings: PiiFinding[],
  kind: PiiKind,
  field: string,
): void => {
  if (findings.length >= MAX_FINDINGS) return;
  const exists = findings.some(
    (finding) => finding.kind === kind && finding.field === field,
  );
  if (!exists) findings.push({ kind, field });
};

const scanRegex = (
  value: string,
  regex: RegExp,
  onMatch: (match: string) => boolean,
): boolean => {
  regex.lastIndex = 0;
  let match = regex.exec(value);
  while (match && match[0]) {
    if (onMatch(match[0])) return true;
    match = regex.exec(value);
  }
  return false;
};

const scanValueForPii = (
  value: string,
  field: string,
  findings: PiiFinding[],
): void => {
  scanRegex(value, EMAIL_REGEX, () => {
    pushFinding(findings, "email", field);
    return true;
  });
  scanRegex(value, SSN_REGEX, () => {
    pushFinding(findings, "ssn", field);
    return true;
  });
  scanRegex(value, PHONE_CANDIDATE_REGEX, (match) => {
    const digits = normalizeDigits(match);
    if (isValidPhoneDigits(digits)) {
      pushFinding(findings, "phone", field);
      return true;
    }
    return false;
  });
  scanRegex(value, CREDIT_CARD_CANDIDATE_REGEX, (match) => {
    const digits = normalizeDigits(match);
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      pushFinding(findings, "credit_card", field);
      return true;
    }
    return false;
  });
};

export const scanFieldsForPii = (fields: PiiField[]): PiiScanResult => {
  if (!PII_SCAN_ENABLED) return { ok: true };
  const findings: PiiFinding[] = [];
  for (const entry of fields) {
    if (findings.length >= MAX_FINDINGS) break;
    const value = entry.value;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    scanValueForPii(trimmed, entry.field, findings);
  }
  return findings.length > 0 ? { ok: false, findings } : { ok: true };
};
