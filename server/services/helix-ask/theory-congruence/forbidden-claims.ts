export type ForbiddenClaimScanResult = {
  status: "pass" | "fail";
  forbidden_terms_found: string[];
  failure_reason?: string;
};

const FORBIDDEN_CLAIMS = [
  { label: "NHM2 validated", pattern: /\bNHM2\s+(?:is\s+)?validated\b/i },
  { label: "NHM2 is proven", pattern: /\bNHM2\s+(?:is\s+)?proven\b/i },
  { label: "warp drive validated", pattern: /\bwarp\s+drive\s+(?:is\s+)?validated\b/i },
  { label: "warp claim certified", pattern: /\bwarp\s+claim\s+(?:is\s+)?certified\b/i },
  { label: "solar restoration feasible", pattern: /\bsolar\s+restoration\s+(?:is\s+)?feasible\b/i },
  { label: "solar intervention proven", pattern: /\bsolar\s+intervention\s+(?:is\s+)?proven\b/i },
  { label: "sunquakes prove collapse", pattern: /\bsunquakes?\s+prove(?:s)?\s+collapse\b/i },
  { label: "nanoflares prove objective collapse", pattern: /\bnanoflares?\s+prove(?:s)?\s+objective\s+collapse\b/i },
  { label: "theory of everything proven", pattern: /\btheory\s+of\s+everything\s+(?:is\s+)?proven\b/i },
  { label: "badge graph proves physics", pattern: /\bbadge\s+graph\s+proves\s+physics\b/i },
  { label: "paper proves repo theory", pattern: /\bpaper\s+proves\s+(?:the\s+)?repo\s+theory\b/i },
] as const;

const NEGATION_OR_BOUNDARY_PATTERN =
  /\b(does\s+not|do\s+not|did\s+not|not|never|no|cannot|can't|cant|forbidden|blocked|avoid|must\s+not|doesn't|isn't|is\s+not)\b/i;

function isAllowedContext(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 70), index);
  return NEGATION_OR_BOUNDARY_PATTERN.test(before);
}

export function scanForbiddenTheoryClaims(text: string): ForbiddenClaimScanResult {
  const forbidden: string[] = [];
  for (const claim of FORBIDDEN_CLAIMS) {
    const match = claim.pattern.exec(text);
    if (!match || isAllowedContext(text, match.index)) continue;
    forbidden.push(claim.label);
  }
  return forbidden.length === 0
    ? { status: "pass", forbidden_terms_found: [] }
    : {
        status: "fail",
        forbidden_terms_found: forbidden,
        failure_reason: "forbidden_theory_claim_language_detected",
      };
}
