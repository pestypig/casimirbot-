import type {
  AgiEvidence,
  AgiGateReport,
  AgiTrajectory,
  AgiGate,
  AgiSafetyAssessment,
  AgiSafetyAction,
  AgiSafetyKind,
  AgiSafetyStage,
  AgiRejectReason,
} from "@shared/agi-refinery";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  normalizeEvidencePath,
  normalizeEvidenceRef,
} from "./refinery-identity";

const CLAIM_PATTERNS: RegExp[] = [
  /\b(is|are|does|returns|means|implements|uses|adds|removes|updates|exposes|requires|includes|defined|located|calls|builds|runs)\b/i,
  /\b(function|class|module|endpoint|route|api|handler|schema)\b/i,
  /\b[a-z0-9_.-]+\.(ts|tsx|js|jsx|json|md|yml|yaml|py|go|rs|java|cpp|c|h)\b/i,
];
const MIME_PATTERN = /^[a-z0-9]+\/[a-z0-9.+-]+$/i;
const GATE_POLICY_VERSION = "v1.0";

const parseBudgetInt = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
};

const MAX_BUDGET_TOKENS = parseBudgetInt(
  process.env.AGI_REFINERY_MAX_TOKENS,
  4000,
  256,
  64000,
);
const MAX_BUDGET_DURATION_MS = parseBudgetInt(
  process.env.AGI_REFINERY_MAX_DURATION_MS,
  120000,
  1000,
  900000,
);
type SafetyPattern = {
  pattern: RegExp;
  label: string;
  severity: "hard" | "soft";
  kind: AgiSafetyKind;
  allowHandled?: boolean;
  requiresHandling?: boolean;
};

type SafetyFlag = {
  label: string;
  severity: "hard" | "soft";
  kind: AgiSafetyKind;
  allowHandled?: boolean;
  requiresHandling?: boolean;
};

const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    pattern: /\bBearer\s+[A-Za-z0-9._-]+\b/i,
    label: "bearer_token",
    severity: "hard",
    kind: "secret",
  },
  {
    pattern: /\bAIza[0-9A-Za-z\-_]{30,}\b/i,
    label: "google_api_key",
    severity: "hard",
    kind: "secret",
  },
  {
    pattern: /\b(?:sk|rk|pk)-[A-Za-z0-9]{12,}\b/i,
    label: "secret_key",
    severity: "hard",
    kind: "secret",
  },
  {
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/i,
    label: "aws_access_key",
    severity: "hard",
    kind: "secret",
  },
  {
    pattern: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PRIVATE) KEY-----/i,
    label: "private_key",
    severity: "hard",
    kind: "secret",
  },
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    label: "pii_email",
    severity: "soft",
    kind: "pii",
    allowHandled: true,
    requiresHandling: true,
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
    label: "pii_ssn",
    severity: "soft",
    kind: "pii",
    allowHandled: true,
    requiresHandling: true,
  },
  {
    pattern:
      /\b(?:\+?\d{1,3}[-.\\s])?(?:\(?\d{3}\)?[-.\\s])\d{3}[-.\\s]\d{4}\b/,
    label: "pii_phone",
    severity: "soft",
    kind: "pii",
    allowHandled: true,
    requiresHandling: true,
  },
  {
    pattern:
      /\b(ignore (?:all|previous|prior) instructions|system prompt|developer message|jailbreak)\b/i,
    label: "prompt_injection",
    severity: "soft",
    kind: "injection",
    allowHandled: true,
    requiresHandling: true,
  },
  {
    pattern: /\b(bypass|exploit|malware|keylogger|credential[- ]?stuffing)\b/i,
    label: "policy_hazard",
    severity: "soft",
    kind: "policy",
    allowHandled: true,
    requiresHandling: true,
  },
  {
    pattern: /(^|[\\/])(\.env|id_rsa|id_ed25519|\.ssh|secrets?)([\\/]|$)/i,
    label: "secret_path",
    severity: "soft",
    kind: "restricted_path",
  },
];

const RESTRICTED_PATH_PATTERNS = SAFETY_PATTERNS.filter(
  (entry) => entry.kind === "restricted_path",
);

export const isRestrictedEvidencePath = (value?: string): boolean => {
  if (!value) return false;
  const normalized = normalizeEvidencePath(value, {
    stripDecorators: true,
    normalizeExtensions: false,
    lowercase: false,
  });
  if (!normalized) return false;
  return RESTRICTED_PATH_PATTERNS.some((entry) => entry.pattern.test(normalized));
};

const RESTRICTED_INPUT_PATTERNS: RegExp[] = [
  /\b\.env\b/i,
  /\bid_rsa\b/i,
  /\bid_ed25519\b/i,
  /\b\.ssh\b/i,
  /\bsecrets?\b/i,
];

export const hasRestrictedInput = (value?: string): boolean => {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  if (RESTRICTED_INPUT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  return SAFETY_PATTERNS.some(
    (entry) => entry.severity === "hard" && entry.pattern.test(normalized),
  );
};

const refusalPattern =
  /\b(can't|cannot|unable to|not able to|won't|refuse|policy|not permitted|cannot comply|disallowed)\b/i;
const requestAuthPattern =
  /\b(requires? (?:authorization|access)|need (?:permission|access)|provide (?:access|authorization))\b/i;
const redactionPattern = /\b(redact(?:ed|ion)?|removed)\b/i;

const buildGate = (
  name: AgiGate["name"],
  pass: boolean,
  reason?: string,
  score?: number,
): AgiGate => ({
  name,
  pass,
  reason,
  score,
});

const normalizeRef = (value: string): string =>
  normalizeEvidenceRef(value) ?? "";

const extractCitationVariants = (citation: string): string[] => {
  const normalized = normalizeEvidenceRef(citation);
  if (!normalized) return [];
  const variants = new Set<string>([normalized]);
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length > 0) variants.add(segments[segments.length - 1]);
  return Array.from(variants);
};

const addRef = (refs: Set<string>, value?: string): void => {
  if (typeof value !== "string") return;
  const normalized = normalizeRef(value);
  if (normalized) refs.add(normalized);
};

const collectEvidenceRefs = (
  items: AgiEvidence[],
): { refs: Set<string>; paths: string[] } => {
  const refs = new Set<string>();
  const paths: string[] = [];
  for (const item of items) {
    addRef(refs, item.hash);
    addRef(refs, item.id);
    addRef(refs, item.snippetHash);
    addRef(refs, item.envelopeId ?? undefined);
    if (Array.isArray(item.keys)) {
      item.keys.forEach((key) => addRef(refs, key));
    }
    if (item.path) {
      const normalizedPath =
        normalizeEvidencePath(item.path, {
          lowercase: true,
          normalizeExtensions: true,
        }) ?? "";
      if (normalizedPath) {
        refs.add(normalizedPath);
        const base = normalizedPath.split("/").pop();
        if (base) refs.add(base);
        paths.push(normalizedPath);
      }
    }
    if (item.extra && typeof item.extra === "object") {
      const extra = item.extra as { snippetId?: unknown; symbolName?: unknown };
      if (typeof extra.snippetId === "string") {
        addRef(refs, extra.snippetId);
      }
      if (typeof extra.symbolName === "string") {
        addRef(refs, extra.symbolName);
      }
    }
  }
  return { refs, paths };
};

const isCitationLinked = (
  citation: string,
  refs: Set<string>,
  paths: string[],
): boolean => {
  const variants = extractCitationVariants(citation);
  for (const variant of variants) {
    if (refs.has(variant)) return true;
    for (const path of paths) {
      if (path.endsWith(variant)) return true;
    }
  }
  return false;
};

const hasClaimLikeOutput = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return false;
  return CLAIM_PATTERNS.some((pattern) => pattern.test(normalized));
};

const estimateTokens = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

export type GroundingAssessment = {
  hasClaims: boolean;
  totalCitations: number;
  linkedCitations: number;
  candidateLinkedCitations: number;
  retrievalLinkedCitations: number;
  evidenceCount: number;
  retrievalCandidateCount: number;
  retrievalSelectedCount: number;
  score: number;
  pass: boolean;
  reason?: string;
};

export const assessGrounding = (trajectory: AgiTrajectory): GroundingAssessment => {
  const outputText = (trajectory.y?.summary ?? trajectory.y?.text ?? "").trim();
  const hasClaims = hasClaimLikeOutput(outputText);
  const citationSet = new Set<string>();
  for (const citation of trajectory.y?.citations ?? []) {
    if (typeof citation === "string" && citation.trim().length > 0) {
      citationSet.add(citation.trim());
    }
  }
  const citations = Array.from(citationSet);
  const retrievalCandidates = trajectory.meta?.retrievalCandidates ?? [];
  const retrievalSelected = trajectory.meta?.retrievalSelected ?? [];
  const evidenceRefs = collectEvidenceRefs([
    ...(trajectory.E ?? []),
    ...retrievalCandidates,
    ...retrievalSelected,
  ]);
  const candidateRefs = collectEvidenceRefs(retrievalCandidates);
  const retrievalRefs = collectEvidenceRefs(retrievalSelected);
  const candidateLinkedCount = citations.filter((citation) =>
    isCitationLinked(citation, candidateRefs.refs, candidateRefs.paths),
  ).length;
  const linkedCount = citations.filter((citation) =>
    isCitationLinked(citation, evidenceRefs.refs, evidenceRefs.paths),
  ).length;
  const retrievalLinkedCount = citations.filter((citation) =>
    isCitationLinked(citation, retrievalRefs.refs, retrievalRefs.paths),        
  ).length;
  const score =
    citations.length > 0 ? linkedCount / citations.length : hasClaims ? 0 : 1;
  let pass = true;
  let reason: string | undefined;
  if (hasClaims && citations.length === 0) {
    pass = false;
    reason = "missing_citations";
  } else if (citations.length > 0 && linkedCount === 0) {
    pass = false;
    reason = "unlinked_citations";
  } else if (
    hasClaims &&
    retrievalSelected.length > 0 &&
    citations.length > 0 &&
    retrievalLinkedCount === 0
  ) {
    pass = false;
    reason = "citation_not_in_retrieval";
  }
  return {
    hasClaims,
    totalCitations: citations.length,
    linkedCitations: linkedCount,
    candidateLinkedCitations: candidateLinkedCount,
    retrievalLinkedCitations: retrievalLinkedCount,
    evidenceCount: evidenceRefs.paths.length,
    retrievalCandidateCount: retrievalCandidates.length,
    retrievalSelectedCount: retrievalSelected.length,
    score,
    pass,
    reason,
  };
};

const looksLikeJson = (value: string, format?: string): boolean => {
  if (format && /json|essence/i.test(format)) return true;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const starts = trimmed.startsWith("{") || trimmed.startsWith("[");
  const ends = trimmed.endsWith("}") || trimmed.endsWith("]");
  return starts && ends;
};

const collectContentTypes = (value: unknown): string[] => {
  if (!value || typeof value !== "object") return [];
  const contentTypes: string[] = [];
  const obj = value as Record<string, unknown>;
  const direct = obj.contentType ?? obj.content_type;
  if (typeof direct === "string") contentTypes.push(direct);
  const header = obj.header;
  if (header && typeof header === "object") {
    const headerObj = header as Record<string, unknown>;
    const headerType = headerObj.contentType ?? headerObj.content_type;
    if (typeof headerType === "string") contentTypes.push(headerType);
  }
  const payload = obj.payload;
  if (payload && typeof payload === "object") {
    const payloadObj = payload as Record<string, unknown>;
    const payloadType = payloadObj.contentType ?? payloadObj.content_type;
    if (typeof payloadType === "string") contentTypes.push(payloadType);
  }
  return contentTypes;
};

const isEssenceEnvelopeCandidate = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return Boolean(obj.header && obj.provenance);
};

const validateOutputSchema = (
  outputText: string,
  format?: string,
): { ok: boolean; reason?: string } => {
  if (!looksLikeJson(outputText, format)) return { ok: true };
  try {
    const parsed = JSON.parse(outputText) as unknown;
    const contentTypes = collectContentTypes(parsed);
    if (contentTypes.some((value) => !MIME_PATTERN.test(value))) {
      return { ok: false, reason: "content_type_invalid" };
    }
    if (isEssenceEnvelopeCandidate(parsed)) {
      const verdict = EssenceEnvelope.safeParse(parsed);
      if (!verdict.success) {
        return { ok: false, reason: "essence_schema_invalid" };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "json_parse_error" };
  }
};

const scanSafetyFlags = (value: string): SafetyFlag[] => {
  if (!value) return [];
  const flags = new Map<string, SafetyFlag>();
  for (const entry of SAFETY_PATTERNS) {
    if (entry.pattern.test(value)) {
      flags.set(entry.label, {
        label: entry.label,
        severity: entry.severity,
        kind: entry.kind,
        allowHandled: entry.allowHandled,
        requiresHandling: entry.requiresHandling,
      });
    }
  }
  return Array.from(flags.values());
};

const scanEvidenceFlags = (paths: string[]): SafetyFlag[] => {
  if (!paths.length) return [];
  const flags = new Map<string, SafetyFlag>();
  for (const path of paths) {
    for (const entry of RESTRICTED_PATH_PATTERNS) {
      if (entry.pattern.test(path)) {
        flags.set(entry.label, {
          label: entry.label,
          severity: entry.severity,
          kind: entry.kind,
        });
      }
    }
  }
  return Array.from(flags.values());
};

export const detectSafetyHandling = (
  outputText: string,
): { handled: boolean; action?: "refuse" | "request_auth" | "redact" } => {
  if (!outputText) return { handled: false };
  if (refusalPattern.test(outputText)) {
    return { handled: true, action: "refuse" };
  }
  if (requestAuthPattern.test(outputText)) {
    return { handled: true, action: "request_auth" };
  }
  if (redactionPattern.test(outputText)) {
    return { handled: true, action: "redact" };
  }
  return { handled: false };
};

const deriveSafetyKind = (
  flags: SafetyFlag[],
  evidenceFlags: SafetyFlag[],
  executionBlocked: boolean,
): AgiSafetyKind | undefined => {
  if (flags.length > 0) return flags[0].kind;
  if (evidenceFlags.length > 0) return evidenceFlags[0].kind;
  if (executionBlocked) return "policy";
  return undefined;
};

const assessSafety = (
  trajectory: AgiTrajectory,
  outputText: string,
): { ok: boolean; reason?: string; assessment?: AgiSafetyAssessment } => {
  const flags = scanSafetyFlags(outputText);
  const hardFlags = flags.filter(
    (flag) => flag.severity === "hard" && !flag.allowHandled,
  );
  const softFlags = flags.filter((flag) => flag.severity === "soft");
  const requiresHandlingFlags = flags.filter((flag) => flag.requiresHandling);
  const evidenceRefs = collectEvidenceRefs([
    ...(trajectory.E ?? []),
    ...(trajectory.meta?.retrievalSelected ?? []),
  ]);
  const evidenceFlags = scanEvidenceFlags(evidenceRefs.paths);
  const executionBlocked =
    trajectory.meta?.executionOk === false || trajectory.meta?.safetyOk === false;
  const handling = detectSafetyHandling(outputText);
  let ok = true;
  let reason: string | undefined;

  if (hardFlags.length > 0) {
    ok = false;
    reason = `safety_${hardFlags[0].label}`;
  } else if (requiresHandlingFlags.length > 0 && !handling.handled) {
    ok = false;
    reason = `safety_${requiresHandlingFlags[0].label}`;
  } else if (evidenceFlags.length > 0) {
    if (handling.handled) {
      ok = true;
      reason = "safety_handled";
    } else {
      ok = false;
      reason = "safety_sensitive_evidence";
    }
  } else if (executionBlocked) {
    if (handling.handled) {
      ok = true;
      reason = "safety_handled";
    } else {
      ok = false;
      reason = "safety_blocked";
    }
  } else if (flags.length > 0 && handling.handled) {
    ok = true;
    reason = "safety_handled";
  }

  const stage: AgiSafetyStage | undefined = executionBlocked
    ? "execution"
    : evidenceFlags.length > 0
      ? "evidence"
      : flags.length > 0 || handling.handled
        ? "output"
        : undefined;
  const kind = deriveSafetyKind(flags, evidenceFlags, executionBlocked);
  const action: AgiSafetyAction | undefined =
    handling.handled
      ? handling.action
      : executionBlocked || evidenceFlags.length > 0 || requiresHandlingFlags.length > 0
        ? "block"
        : softFlags.length > 0
          ? "allow"
          : undefined;

  const assessment: AgiSafetyAssessment | undefined =
    stage || kind || action || flags.length > 0 || handling.handled
      ? {
          stage: stage as AgiSafetyStage | undefined,
          kind,
          action: action ?? "unknown",
          handled: handling.handled,
          pass: ok,
          flags: flags.map((flag) => flag.label),
        }
      : undefined;

  return { ok, reason, assessment };
};

const deriveRejectReason = (
  trajectory: AgiTrajectory,
  grounding: GroundingAssessment,
  formatOk: boolean,
  formatReason: string | undefined,
  safetyAssessment: { ok: boolean; reason?: string; assessment?: AgiSafetyAssessment },
  testsRequired: boolean,
  testsRun: boolean,
  testsOk: boolean,
  contractRequired: boolean,
  contractOk: boolean,
  constraintRequired: boolean,
  constraintOk: boolean,
  budgetOk: boolean,
): AgiRejectReason => {
  const executionFailed = trajectory.meta?.executionOk === false;
  const executionHandled =
    executionFailed &&
    safetyAssessment.assessment?.handled &&
    safetyAssessment.assessment?.stage === "execution";
  if (executionFailed && !executionHandled) {
    const errorTypes = trajectory.meta?.executionErrorTypes ?? [];
    const hasTimeout = errorTypes.some((type) =>
      type.toLowerCase().includes("timeout"),
    );
    return hasTimeout
      ? "execution_timeout"
      : "execution_tool_error";
  }
  if (!formatOk) {
    if (formatReason && formatReason.includes("schema")) {
      return "schema_invalid";
    }
    if (formatReason && formatReason.includes("json")) {
      return "schema_invalid";
    }
    return "schema_invalid";
  }
  if (!safetyAssessment.ok) {
    const stage = safetyAssessment.assessment?.stage;
    if (stage === "input") return "safety_input_disallowed";
    if (stage === "evidence") return "safety_sensitive_evidence";
    return "safety_output_violation";
  }
  const hasClaims = grounding.hasClaims;
  const evidenceCount =
    (trajectory.E?.length ?? 0) +
    (trajectory.meta?.retrievalSelected?.length ?? 0);
  if (hasClaims && evidenceCount === 0) {
    return "retrieval_empty";
  }
  if (testsRequired && !testsRun) {
    return "tests_required";
  }
  if (testsRun && !testsOk) {
    return "other";
  }
  if (contractRequired && !contractOk) {
    return "contract_mismatch";
  }
  if (constraintRequired && !constraintOk) {
    return "constraint_failed";
  }
  if (!budgetOk) {
    return "budget_exceeded";
  }
  if (!grounding.pass) {
    return "other";
  }
  return "other";
};

export const evaluateTrajectoryGates = (
  trajectory: AgiTrajectory,
): AgiGateReport => {
  const outputText = (trajectory.y?.summary ?? trajectory.y?.text ?? "").trim();
  const grounding = assessGrounding(trajectory);

  const upstreamFormatOk =
    trajectory.meta?.formatOk ??
    Boolean(trajectory.y?.summary || trajectory.y?.text);
  const schemaVerdict = validateOutputSchema(
    outputText,
    trajectory.y?.format,
  );
  const formatOk = upstreamFormatOk && schemaVerdict.ok;
  const formatReason = formatOk
    ? undefined
    : schemaVerdict.reason ?? "format_invalid";
  const safetyAssessment = assessSafety(trajectory, outputText);
  let safetyOk = safetyAssessment.ok;
  let safetyReason = safetyAssessment.reason;
  if (safetyAssessment.assessment) {
    if (trajectory.meta) {
      trajectory.meta.safety = trajectory.meta.safety ?? safetyAssessment.assessment;
    } else {
      trajectory.meta = { safety: safetyAssessment.assessment };
    }
  }
  const executionOk = trajectory.meta?.executionOk !== false;
  const testsRequired = trajectory.meta?.testsRequired ?? false;
  const testsRun = trajectory.meta?.testsRun ?? false;
  const testsOk = testsRun ? trajectory.meta?.testsOk === true : true;
  const testsGateOk = testsRequired ? testsRun && testsOk : !testsRun || testsOk;
  const executionHandled =
    !executionOk &&
    safetyAssessment.assessment?.handled === true &&
    safetyAssessment.assessment?.stage === "execution";
  const executionGateOk = executionOk || executionHandled;
  const contractRequired = trajectory.meta?.contractRequired ?? false;
  const contractOk = contractRequired ? trajectory.meta?.contractOk === true : true;
  const contractIssue = trajectory.meta?.contractIssues?.[0];
  const constraintRequired = trajectory.meta?.constraintRequired ?? false;
  const constraintOk =
    constraintRequired ? trajectory.meta?.constraintOk === true : true;
  const constraintIssue = trajectory.meta?.constraintIssues?.[0];
  const tokenEstimate =
    trajectory.meta?.tokens ??
    estimateTokens(trajectory.x ?? "") +
      estimateTokens(trajectory.y?.summary ?? trajectory.y?.text ?? "");
  const durationMs =
    typeof trajectory.meta?.durationMs === "number"
      ? trajectory.meta?.durationMs
      : undefined;
  const computedBudgetOk =
    tokenEstimate <= MAX_BUDGET_TOKENS &&
    (durationMs === undefined || durationMs <= MAX_BUDGET_DURATION_MS);
  const budgetOk = trajectory.meta?.budgetOk ?? computedBudgetOk;
  const budgetReason =
    tokenEstimate > MAX_BUDGET_TOKENS
      ? "budget_tokens_exceeded"
      : durationMs !== undefined && durationMs > MAX_BUDGET_DURATION_MS
        ? "budget_duration_exceeded"
        : undefined;
  const testsReason =
    testsRequired && !testsRun
      ? "tests_required"
      : testsRun && !testsOk
        ? "tests_failed"
        : undefined;

  const gates: AgiGate[] = [
    buildGate("grounding", grounding.pass, grounding.reason, grounding.score),
    buildGate("format", Boolean(formatOk), formatReason),
    buildGate("safety", Boolean(safetyOk), safetyReason ?? "safety_flagged"),
    buildGate(
      "execution",
      Boolean(executionGateOk),
      executionGateOk
        ? executionHandled
          ? "execution_handled"
          : undefined
        : "execution_failed",
    ),
    buildGate(
      "tests",
      Boolean(testsGateOk),
      testsReason,
    ),
    buildGate(
      "contract",
      Boolean(contractOk),
      contractOk ? undefined : contractIssue ?? "contract_mismatch",
    ),
    buildGate(
      "constraints",
      Boolean(constraintOk),
      constraintOk ? undefined : constraintIssue ?? "constraint_failed",
    ),
    buildGate(
      "budget",
      Boolean(budgetOk),
      budgetOk ? undefined : budgetReason ?? "budget_exceeded",
    ),
  ];

  const accepted = gates.every((gate) => gate.pass);
  const rejectReason = accepted
    ? undefined
    : deriveRejectReason(
        trajectory,
        grounding,
        formatOk,
        formatReason,
        safetyAssessment,
        testsRequired,
        testsRun,
        testsOk,
        contractRequired,
        contractOk,
        constraintRequired,
        constraintOk,
        budgetOk,
      );
  return {
    trajectoryId: trajectory.id,
    traceId: trajectory.traceId,
    createdAt: new Date().toISOString(),
    policyVersion: GATE_POLICY_VERSION,
    accepted,
    rejectReason,
    gates,
    safety: safetyAssessment.assessment,
  };
};
