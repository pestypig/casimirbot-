import type { HelixEvidenceObservation } from "../../../shared/helix-evidence-observation";

export type HelixRepoClaimSupportGateMode = "off" | "shadow" | "repair" | "fail";

export type HelixRepoClaimKind =
  | "implementation_state"
  | "file_mapping"
  | "symbol_behavior"
  | "pipeline_behavior"
  | "config_contract"
  | "repo_summary";

export type HelixRepoClaim = {
  id: string;
  text: string;
  kind: HelixRepoClaimKind;
  requiresObservation: boolean;
  matchedObservationIds: string[];
  matchedBecause: string[];
  supportStatus: "supported" | "unsupported" | "not_required";
  reason?: string;
};

export type HelixRepoClaimObservationGateResult = {
  decision: "pass" | "shadow_warn" | "repair_required" | "fail_closed";
  unsupportedClaims: HelixRepoClaim[];
  supportedClaims: HelixRepoClaim[];
  observationCount: number;
  reason?: "REPO_CLAIM_OBSERVATION_SUPPORT_MISSING";
};

export type HelixRepoClaimSupportTrace = {
  claims: Array<{
    id: string;
    text: string;
    kind: HelixRepoClaimKind;
    supportStatus: HelixRepoClaim["supportStatus"];
    matchedObservationIds: string[];
    matchedBecause: string[];
  }>;
  observations: Array<{
    id: string;
    filePath?: string;
    lineStart?: number;
    lineEnd?: number;
    sourceStage?: HelixEvidenceObservation["sourceStage"];
    lane: HelixEvidenceObservation["lane"];
  }>;
};

const REPO_CLAIM_OBSERVATION_SUPPORT_MISSING =
  "REPO_CLAIM_OBSERVATION_SUPPORT_MISSING" as const;

const REPO_CLAIM_CUES = [
  /\b(file|path|module|route|endpoint|contract|schema|lane|runtime|recovery|preflight|fallback|stage0|debug|trace|probe)\b/i,
  /\b(defines|declares|exports|imports|threads|wires|emits|records|enforces|validates|supports|routes|builds|runs|calls)\b/i,
  /\b(server|client|shared|docs|scripts|modules|tools)\//i,
  /\b[A-Za-z0-9_-]+\.(ts|tsx|js|jsx|md|json|py)\b/i,
];

const HYPOTHESIS_OR_NEXT_EVIDENCE_HEADING =
  /^(?:#+\s*)?(hypothesis|possible connection|next evidence|next evidence needed|open question|open questions)\b/i;

const GENERIC_SKIP_RE =
  /\b(?:may|might|could|possibly|hypothesis|open question|next evidence|needs verification|should verify)\b/i;

const LOW_SIGNAL_MATCH_TOKENS = new Set([
  "file",
  "path",
  "module",
  "route",
  "runtime",
  "supports",
  "support",
  "emits",
  "records",
  "builds",
  "handles",
  "code",
  "contract",
  "schema",
  "debug",
  "trace",
]);

const normalizeText = (value: string): string =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/i)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length >= 3);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const splitSentencesWithSections = (
  answer: string,
): Array<{ text: string; evidenceExempt: boolean }> => {
  const out: Array<{ text: string; evidenceExempt: boolean }> = [];
  let evidenceExempt = false;
  for (const rawLine of String(answer ?? "").split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(?:#+\s*)?[A-Z][A-Za-z0-9 ()/-]{1,80}:$/.test(line)) {
      evidenceExempt = HYPOTHESIS_OR_NEXT_EVIDENCE_HEADING.test(line);
      continue;
    }
    if (HYPOTHESIS_OR_NEXT_EVIDENCE_HEADING.test(line)) {
      evidenceExempt = true;
      continue;
    }
    const normalized = line.replace(/^[-*]\s+/, "").trim();
    const parts = normalized
      .split(/(?<=[.!?])\s+(?=[A-Z0-9`])/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const part of parts.length ? parts : [normalized]) {
      out.push({ text: part, evidenceExempt });
    }
  }
  return out;
};

const classifyClaimKind = (text: string): HelixRepoClaimKind => {
  if (/\b(route|endpoint|pipeline|runtime|preflight|fallback|stage0|recovery|probe|trace)\b/i.test(text)) {
    return "pipeline_behavior";
  }
  if (/\b(contract|schema|config|configuration)\b/i.test(text)) {
    return "config_contract";
  }
  if (/\b(exports|imports|symbol|function|class|type|interface|defines|declares)\b/i.test(text)) {
    return "symbol_behavior";
  }
  if (/\b(file|path|module|server\/|client\/|shared\/|docs\/|scripts\/|modules\/|tools\/)\b/i.test(text)) {
    return "file_mapping";
  }
  if (/\b(repo|repository)\b/i.test(text)) {
    return "repo_summary";
  }
  return "implementation_state";
};

const looksLikeRepoClaim = (text: string): boolean => {
  const matched = REPO_CLAIM_CUES.filter((cue) => cue.test(text)).length;
  return matched >= 2 || /\b(server|client|shared|docs|scripts|modules|tools)\//i.test(text);
};

const observationMatchesClaim = (
  claimText: string,
  observation: HelixEvidenceObservation,
): string[] => {
  const matchedBecause: string[] = [];
  const claimLower = claimText.toLowerCase();
  const filePath = String(observation.filePath ?? "").replace(/\\/g, "/").toLowerCase();
  if (filePath && claimLower.includes(filePath)) matchedBecause.push("file_path_exact");
  const term = String(observation.term ?? "").trim().toLowerCase();
  if (term.length >= 3 && !LOW_SIGNAL_MATCH_TOKENS.has(term) && claimLower.includes(term)) {
    matchedBecause.push("term_exact");
  }
  const query = String(observation.query ?? "").trim().toLowerCase();
  if (query.length >= 4 && !LOW_SIGNAL_MATCH_TOKENS.has(query) && claimLower.includes(query)) {
    matchedBecause.push("query_overlap");
  }

  const claimTokens = new Set(tokenize(claimText));
  const supportTokens = unique([
    ...tokenize(String(observation.snippet ?? "")),
    ...tokenize(String(observation.term ?? "")),
    ...tokenize(String(observation.query ?? "")),
    ...tokenize(String(observation.filePath ?? "")),
  ]).filter((token) => !LOW_SIGNAL_MATCH_TOKENS.has(token));
  let overlap = 0;
  for (const token of supportTokens) {
    if (claimTokens.has(token)) overlap += 1;
  }
  if (overlap >= 2) matchedBecause.push("snippet_token_overlap");
  return unique(matchedBecause);
};

export const evaluateHelixRepoClaimObservationGate = (args: {
  answer: string;
  observations: HelixEvidenceObservation[];
  mode: HelixRepoClaimSupportGateMode;
  repoRequired: boolean;
}): HelixRepoClaimObservationGateResult => {
  if (args.mode === "off" || !args.repoRequired) {
    return {
      decision: "pass",
      unsupportedClaims: [],
      supportedClaims: [],
      observationCount: args.observations.length,
    };
  }

  const supportedClaims: HelixRepoClaim[] = [];
  const unsupportedClaims: HelixRepoClaim[] = [];
  const candidates = splitSentencesWithSections(args.answer);
  let index = 0;
  for (const candidate of candidates) {
    const text = normalizeText(candidate.text);
    if (!text || candidate.evidenceExempt || GENERIC_SKIP_RE.test(text) || !looksLikeRepoClaim(text)) {
      continue;
    }
    const matchReasonsByObservation = args.observations
      .map((observation) => ({
        observation,
        matchedBecause: observationMatchesClaim(text, observation),
      }))
      .filter((entry) => entry.matchedBecause.length > 0);
    const matchedObservationIds = matchReasonsByObservation.map((entry) => entry.observation.id);
    const matchedBecause = unique(matchReasonsByObservation.flatMap((entry) => entry.matchedBecause));
    const claim: HelixRepoClaim = {
      id: `repo_claim_${index + 1}`,
      text,
      kind: classifyClaimKind(text),
      requiresObservation: true,
      matchedObservationIds,
      matchedBecause,
      supportStatus: matchedObservationIds.length > 0 ? "supported" : "unsupported",
      ...(matchedObservationIds.length > 0
        ? {}
        : { reason: REPO_CLAIM_OBSERVATION_SUPPORT_MISSING }),
    };
    index += 1;
    if (claim.supportStatus === "supported") {
      supportedClaims.push(claim);
    } else {
      unsupportedClaims.push(claim);
    }
  }

  if (unsupportedClaims.length === 0) {
    return {
      decision: "pass",
      unsupportedClaims,
      supportedClaims,
      observationCount: args.observations.length,
    };
  }

  return {
    decision:
      args.mode === "fail"
        ? "fail_closed"
        : args.mode === "repair"
          ? "repair_required"
          : "shadow_warn",
    unsupportedClaims,
    supportedClaims,
    observationCount: args.observations.length,
    reason: REPO_CLAIM_OBSERVATION_SUPPORT_MISSING,
  };
};

export const buildHelixRepoClaimSupportTrace = (args: {
  gate: HelixRepoClaimObservationGateResult;
  observations: HelixEvidenceObservation[];
}): HelixRepoClaimSupportTrace => {
  const claims = [...args.gate.supportedClaims, ...args.gate.unsupportedClaims];
  const matchedIds = new Set(claims.flatMap((claim) => claim.matchedObservationIds));
  return {
    claims: claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      kind: claim.kind,
      supportStatus: claim.supportStatus,
      matchedObservationIds: claim.matchedObservationIds,
      matchedBecause: claim.matchedBecause,
    })),
    observations: args.observations
      .filter((observation) => matchedIds.has(observation.id))
      .map((observation) => ({
        id: observation.id,
        filePath: observation.filePath,
        lineStart: observation.lineStart,
        lineEnd: observation.lineEnd ?? observation.lineStart,
        sourceStage: observation.sourceStage,
        lane: observation.lane,
      })),
  };
};

export const renderHelixRepoClaimObservationSources = (args: {
  gate: HelixRepoClaimObservationGateResult;
  observations: HelixEvidenceObservation[];
}): string[] => {
  const matchedIds = new Set(args.gate.supportedClaims.flatMap((claim) => claim.matchedObservationIds));
  const sources: string[] = [];
  const seen = new Set<string>();
  for (const observation of args.observations) {
    if (!matchedIds.has(observation.id)) continue;
    const filePath = String(observation.filePath ?? "").replace(/\\/g, "/").trim();
    if (!filePath) continue;
    const lineStart = Number.isFinite(observation.lineStart)
      ? Math.max(1, Math.trunc(Number(observation.lineStart)))
      : null;
    const lineEnd = Number.isFinite(observation.lineEnd)
      ? Math.max(lineStart ?? 1, Math.trunc(Number(observation.lineEnd)))
      : lineStart;
    const lineSuffix = lineStart
      ? lineEnd && lineEnd !== lineStart
        ? `:${lineStart}-${lineEnd}`
        : `:${lineStart}`
      : "";
    const rendered = `${filePath}${lineSuffix}`;
    if (seen.has(rendered)) continue;
    seen.add(rendered);
    sources.push(rendered);
  }
  return sources;
};

export const applyHelixRepoClaimObservationSources = (args: {
  answer: string;
  sources: string[];
}): string => {
  if (args.sources.length === 0) return args.answer;
  const sourceBlock = ["Sources:", ...args.sources.map((source) => `- ${source}`)].join("\n");
  const withoutSources = String(args.answer ?? "")
    .replace(/\n+Sources:\s*(?:\n\s*[-*]\s+.+)+\s*$/ims, "")
    .replace(/\n+Sources:\s*.+\s*$/ims, "")
    .trim();
  return `${withoutSources}\n\n${sourceBlock}`.trim();
};

export const repairHelixRepoClaimObservationAnswer = (args: {
  answer: string;
  gate: HelixRepoClaimObservationGateResult;
}): string => {
  if (args.gate.unsupportedClaims.length === 0) return args.answer;
  const unsupported = new Set(args.gate.unsupportedClaims.map((claim) => claim.text));
  const kept = splitSentencesWithSections(args.answer)
    .map((entry) => normalizeText(entry.text))
    .filter((sentence) => sentence && !unsupported.has(sentence));
  const nextEvidence = args.gate.unsupportedClaims.map((claim) => `- Verify: ${claim.text}`);
  return [...kept, "", "Next evidence needed:", ...nextEvidence].join("\n").trim();
};

export const buildHelixRepoClaimObservationRepairPrompt = (args: {
  answerDraft: string;
  observations: HelixEvidenceObservation[];
  unsupportedClaims: HelixRepoClaim[];
}): string => {
  const compactObservations = args.observations.slice(0, 24).map((observation) => ({
    id: observation.id,
    filePath: observation.filePath,
    lineStart: observation.lineStart,
    lineEnd: observation.lineEnd ?? observation.lineStart,
    snippet: observation.snippet,
  }));
  return [
    "Rewrite the answer using only repo claims supported by the provided evidence observations.",
    "",
    "Rules:",
    "- Keep supported claims.",
    "- Remove or downgrade unsupported implementation-state claims.",
    '- Unsupported implementation claims may appear only under "Next evidence needed".',
    "- Do not invent file paths, symbols, lanes, or routes.",
    "- Preserve uncertainty.",
    "- Sources must reference observation-backed file paths/lines only.",
    "",
    `Answer draft:\n${args.answerDraft}`,
    "",
    `Evidence observations:\n${JSON.stringify(compactObservations, null, 2)}`,
    "",
    `Unsupported claims:\n${JSON.stringify(args.unsupportedClaims, null, 2)}`,
  ].join("\n");
};
